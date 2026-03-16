import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MouseWigglePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        window.add(page);

        // Detection group
        const detectionGroup = new Adw.PreferencesGroup({
            title: 'Detection',
        });
        page.add(detectionGroup);

        detectionGroup.add(this._spinRow(settings, 'poll-interval-ms',
            'Poll Interval (ms)', 'How often to sample cursor position', 10, 500, 10));
        detectionGroup.add(this._spinRow(settings, 'history-window-ms',
            'Detection Window (ms)', 'Sliding window for wiggle detection', 100, 5000, 50));
        detectionGroup.add(this._spinRow(settings, 'min-reversals',
            'Min Direction Reversals', 'Direction changes needed to trigger', 1, 20, 1));
        detectionGroup.add(this._spinRow(settings, 'min-move-px',
            'Min Movement (px)', 'Minimum pixels per sample (jitter filter)', 1, 100, 1));

        // Appearance & Animation group
        const animGroup = new Adw.PreferencesGroup({
            title: 'Appearance & Animation',
        });
        page.add(animGroup);

        animGroup.add(this._spinRow(settings, 'cursor-scale',
            'Cursor Scale', 'Enlargement multiplier', 2, 10, 1));
        animGroup.add(this._spinRow(settings, 'restore-delay-ms',
            'Restore Delay (ms)', 'Hold time before shrink animation', 0, 2000, 50));
        animGroup.add(this._spinRow(settings, 'restore-anim-steps',
            'Animation Steps', 'Steps in the shrink animation', 1, 60, 1));
        animGroup.add(this._spinRow(settings, 'restore-anim-step-ms',
            'Animation Step (ms)', 'Duration of each animation step', 8, 100, 1));
    }

    _spinRow(settings, key, title, subtitle, min, max, step) {
        const row = new Adw.SpinRow({
            title,
            subtitle,
            adjustment: new Gtk.Adjustment({
                lower: min,
                upper: max,
                step_increment: step,
            }),
        });
        settings.bind(key, row, 'value', Gio.SettingsBindFlags.DEFAULT);
        return row;
    }
}
