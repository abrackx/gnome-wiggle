import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class MouseWiggleExtension extends Extension {
    enable() {
        this._desktopSettings = new Gio.Settings({ schema: 'org.gnome.desktop.interface' });
        this._extSettings = this.getSettings();
        this._loadSettings();
        this._settingsChangedId = this._extSettings.connect('changed', () => this._onSettingsChanged());

        this._originalSize = this._desktopSettings.get_int('cursor-size');
        this._history = [];
        this._lastX = null;
        this._enlarged = false;
        this._restoreTimer = null;

        this._startPollTimer();
    }

    disable() {
        this._stopPollTimer();
        this._clearRestoreTimer();
        this._restoreCursor();

        if (this._settingsChangedId) {
            this._extSettings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        this._desktopSettings = null;
        this._extSettings = null;
        this._history = null;
    }

    _loadSettings() {
        this._pollIntervalMs = this._extSettings.get_int('poll-interval-ms');
        this._historyWindowMs = this._extSettings.get_int('history-window-ms');
        this._minReversals = this._extSettings.get_int('min-reversals');
        this._minMovePx = this._extSettings.get_int('min-move-px');
        this._cursorScale = this._extSettings.get_int('cursor-scale');
        this._restoreDelayMs = this._extSettings.get_int('restore-delay-ms');
        this._restoreAnimSteps = this._extSettings.get_int('restore-anim-steps');
        this._restoreAnimStepMs = this._extSettings.get_int('restore-anim-step-ms');
    }

    _onSettingsChanged() {
        const oldInterval = this._pollIntervalMs;
        this._loadSettings();
        if (this._pollIntervalMs !== oldInterval) {
            this._stopPollTimer();
            this._startPollTimer();
        }
    }

    _startPollTimer() {
        this._pollTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._pollIntervalMs, () => {
            const [x] = global.get_pointer();
            this._onMotion(x);
            return GLib.SOURCE_CONTINUE;
        });
    }

    _stopPollTimer() {
        if (this._pollTimer !== null) {
            GLib.source_remove(this._pollTimer);
            this._pollTimer = null;
        }
    }

    _onMotion(x) {
        if (x === this._lastX)
            return;
        this._lastX = x;

        const now = Date.now();
        this._history.push({ x, t: now });

        // Prune entries outside the sliding window
        const cutoff = now - this._historyWindowMs;
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
            if (Math.abs(dx) < this._minMovePx)
                continue;

            const sign = dx > 0 ? 1 : -1;
            if (lastSign !== 0 && sign !== lastSign)
                reversals++;
            lastSign = sign;
        }

        return reversals >= this._minReversals;
    }

    _triggerEnlarge() {
        this._enlarged = true;
        this._desktopSettings.set_int('cursor-size', this._originalSize * this._cursorScale);

        // Reset the restore timer so continued wiggling keeps cursor big
        this._clearRestoreTimer();
        this._restoreTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._restoreDelayMs, () => {
            this._restoreTimer = null;
            this._animateRestore(0);
            return GLib.SOURCE_REMOVE;
        });
    }

    _animateRestore(step) {
        if (step >= this._restoreAnimSteps) {
            this._restoreCursor();
            return;
        }
        // Ease-out quad: fast at start, slow at end
        const t = (step + 1) / this._restoreAnimSteps;
        const eased = 1 - Math.pow(1 - t, 2);
        const size = Math.round(this._originalSize * (1 + (this._cursorScale - 1) * (1 - eased)));
        this._desktopSettings.set_int('cursor-size', size);
        this._restoreTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._restoreAnimStepMs, () => {
            this._restoreTimer = null;
            this._animateRestore(step + 1);
            return GLib.SOURCE_REMOVE;
        });
    }

    _restoreCursor() {
        if (this._enlarged && this._desktopSettings) {
            this._desktopSettings.set_int('cursor-size', this._originalSize);
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
