function AlertButton(config) {
	"use strict";

	var self = this;

	if (!self.msg) {
        self.msg = 'Distributed by Mindspark\nFromDocToPDF\nVersion: 12.202.10.29637';
	}

	self.onRequest = function(request, sender, sendResponse) {
		self.showAlert(sender.tab, self.msg);

		// When the Alert Button is within a menu, self allows
		// the menu to be closed after the button click.
		sendResponse(true);
	};

	// Calls the super constructor
	AbstractButton.call(self, config);
}

AlertButton.prototype = Object.create(AbstractButton.prototype);