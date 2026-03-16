# Mouse Wiggle

A GNOME Shell extension that temporarily enlarges the cursor when you wiggle the mouse, similar to the "shake to find cursor" feature on macOS.

## How it works

The extension polls the cursor position at ~20 Hz and tracks horizontal direction changes over a sliding time window. When enough reversals are detected, the cursor is scaled up. It then eases back to its original size after a short delay.

## Installation

```sh
make install
```

Then reload GNOME Shell (log out and back in, or Alt+F2 → `r` on X11) and enable the extension via GNOME Extensions.

## Preferences

All settings are configurable through the GNOME Extensions app — no need to edit any files. Click the **Settings** button next to the extension to open the preferences window.

| Setting | Default | Description |
|---|---|---|
| Poll Interval (ms) | 50 | How often cursor position is sampled |
| Detection Window (ms) | 800 | Sliding window used for wiggle detection |
| Min Direction Reversals | 4 | Direction changes required to trigger |
| Min Movement (px) | 8 | Minimum pixels per sample (filters micro-jitter) |
| Cursor Scale | 3 | Enlargement multiplier |
| Restore Delay (ms) | 200 | How long the cursor stays large before shrinking |
| Animation Steps | 12 | Steps in the shrink animation |
| Animation Step (ms) | 16 | Duration of each animation step |

Settings take effect immediately without restarting the shell.

## Requirements

- GNOME Shell 48 or 49
- `glib-compile-schemas` (part of `glib2` / `libglib2.0-bin`, installed on any standard GNOME desktop)
- `libadwaita` 1.x (installed on any standard GNOME 48+ desktop)
