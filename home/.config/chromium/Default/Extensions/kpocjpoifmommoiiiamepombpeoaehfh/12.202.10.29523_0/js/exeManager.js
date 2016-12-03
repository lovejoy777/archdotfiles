var exeManager = (function(config, document) {
	"use strict";

	var PLUGIN_ID = "exemanager",
		domPlugin,
		pluginAttributes = config.plugins && config.plugins[PLUGIN_ID];

	// Embed the plugin into the background page
	if (pluginAttributes) {
		domPlugin = document.createElement("embed");
		domPlugin.setAttribute("id", PLUGIN_ID);

		_.each(pluginAttributes, function(value, key, list) {
			domPlugin.setAttribute(key, value);
		});

		document.body.appendChild(domPlugin);
	}

	return {
		launchExe: function(params, callback) {
			if (domPlugin) {
				domPlugin.sendLaunchExe(params, callback);
			}
		},

		detectExe: function(params, callback) {
			if (domPlugin) {
				domPlugin.sendDetectExe(params, callback);
			}
		}
	};
})(config, document);
