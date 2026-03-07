UUID = mouse-wiggle@gnome-wiggle
INSTALL_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

install:
	mkdir -p $(INSTALL_DIR)
	cp metadata.json extension.js $(INSTALL_DIR)/

uninstall:
	rm -rf $(INSTALL_DIR)
