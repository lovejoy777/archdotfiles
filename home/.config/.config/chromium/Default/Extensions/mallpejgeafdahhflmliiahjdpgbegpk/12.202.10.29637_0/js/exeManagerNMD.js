var exeManagerNMD = (function(config, document) {
	"use strict";

	return {
		launchExe: function(params, callback) {
			Mindspark_nativeMessagingDispatcher.sendLaunchExe(params, callback);
		},

		detectExe: function(params, callback) {
            console.log('eMNMD: detectExe(%O)', arguments);
			Mindspark_nativeMessagingDispatcher.sendDetectExe(params, callback);
		}
	};
})(config, document);
