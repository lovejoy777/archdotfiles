function UninstallButton(config) {
	"use strict";

	var self = this,
		url = '';

	try {
		url = 'http:\/\/eula.mindspark.com\/ask\/uninstall\/chrome\/?toolbarDisplayName=EasyPDFCombine&isChromeStore=<!-- isChromeStore -->&track=<!-- trackID -->&languageISO=<!-- languageISO -->';
        paramReplacer.addKey('isChromeStore', Common.isChromeStore ? 'true' : 'false');
        url = paramReplacer.replaceParams(url);
    } catch (e) {
		self.disabled = true;
	}

	if (!url) {
		self.disabled = true;
	}

	config.url = url;
    config.openInNewWindow = 'newTab';

	// Calls the super constructor
	LinkButton.call(self, config);
}

UninstallButton.prototype = Object.create(LinkButton.prototype);