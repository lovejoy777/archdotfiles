function LinkButton(config) {
	"use strict";

	var self = this;

	self.url = config.url;

	// handle any encoded javascript
	if (self.url && self.url.indexOf('javascript') !== -1) {
		self.url = decodeURIComponent(self.url);
	}

	self.disabled = Common.isEmpty(self.url);
	self.opensNewWindow = config.openInNewWindow || false;

	self.onRequest = function(request, sender, sendResponse) {
		var url = paramReplacer.replaceParams(self.url, sender.tab);
		Widget.Content.tabs.loadButtonLink(sender.tab, url, self.opensNewWindow);
	};

	// Calls the super constructor
	AbstractButton.call(self, config);
}

LinkButton.prototype = Object.create(AbstractButton.prototype);


