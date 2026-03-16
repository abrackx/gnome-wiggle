UUID = mouse-wiggle@gnome-wiggle
INSTALL_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

install:
	mkdir -p $(INSTALL_DIR)/schemas
	cp metadata.json extension.js prefs.js $(INSTALL_DIR)/
	cp schemas/*.gschema.xml $(INSTALL_DIR)/schemas/
	glib-compile-schemas $(INSTALL_DIR)/schemas/

uninstall:
	rm -rf $(INSTALL_DIR)
