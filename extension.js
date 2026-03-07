import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

// Tunable constants
const POLL_INTERVAL_MS = 50;    // polling interval (~20 Hz)
const HISTORY_WINDOW_MS = 800;  // sliding time window for wiggle detection
const MIN_REVERSALS = 4;        // direction changes needed to trigger
const MIN_MOVE_PX = 8;          // min pixels/event to count (filters micro-jitter)
const CURSOR_SCALE = 3;         // enlargement multiplier
const RESTORE_DELAY_MS = 200;   // how long cursor stays big before shrinking
const RESTORE_ANIM_STEPS = 12;  // number of steps in the shrink animation
const RESTORE_ANIM_STEP_MS = 16; // ms per step (~192ms total)

export default class MouseWiggleExtension extends Extension {
    enable() {
        this._settings = new Gio.Settings({ schema: 'org.gnome.desktop.interface' });
        this._originalSize = this._settings.get_int('cursor-size');
        this._history = [];
        this._enlarged = false;
        this._restoreTimer = null;

        this._pollTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, POLL_INTERVAL_MS, () => {
            const [x] = global.get_pointer();
            this._onMotion(x);
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        if (this._pollTimer !== null) {
            GLib.source_remove(this._pollTimer);
            this._pollTimer = null;
        }
        this._clearRestoreTimer();
        this._restoreCursor();
        this._settings = null;
        this._history = null;
    }

    _onMotion(x) {
        const now = Date.now();
        this._history.push({ x, t: now });

        // Prune entries outside the sliding window
        const cutoff = now - HISTORY_WINDOW_MS;
        this._history = this._history.filter(e => e.t >= cutoff);

        if (this._detectWiggle())
            this._triggerEnlarge();
    }

    _detectWiggle() {
        const h = this._history;
        if (h.length < 3)
            return false;

        let reversals = 0;
        let lastSign = 0;

        for (let i = 1; i < h.length; i++) {
            const dx = h[i].x - h[i - 1].x;
            if (Math.abs(dx) < MIN_MOVE_PX)
                continue;

            const sign = dx > 0 ? 1 : -1;
            if (lastSign !== 0 && sign !== lastSign)
                reversals++;
            lastSign = sign;
        }

        return reversals >= MIN_REVERSALS;
    }

    _triggerEnlarge() {
        this._enlarged = true;
        this._settings.set_int('cursor-size', this._originalSize * CURSOR_SCALE);

        // Reset the restore timer so continued wiggling keeps cursor big
        this._clearRestoreTimer();
        this._restoreTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, RESTORE_DELAY_MS, () => {
            this._restoreTimer = null;
            this._animateRestore(0);
            return GLib.SOURCE_REMOVE;
        });
    }

    _animateRestore(step) {
        if (step >= RESTORE_ANIM_STEPS) {
            this._restoreCursor();
            return;
        }
        // Ease-out quad: fast at start, slow at end
        const t = (step + 1) / RESTORE_ANIM_STEPS;
        const eased = 1 - Math.pow(1 - t, 2);
        const size = Math.round(this._originalSize * (1 + (CURSOR_SCALE - 1) * (1 - eased)));
        this._settings.set_int('cursor-size', size);
        this._restoreTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, RESTORE_ANIM_STEP_MS, () => {
            this._restoreTimer = null;
            this._animateRestore(step + 1);
            return GLib.SOURCE_REMOVE;
        });
    }

    _restoreCursor() {
        if (this._enlarged && this._settings) {
            this._settings.set_int('cursor-size', this._originalSize);
            this._enlarged = false;
        }
    }

    _clearRestoreTimer() {
        if (this._restoreTimer !== null) {
            GLib.source_remove(this._restoreTimer);
            this._restoreTimer = null;
        }
    }
}
