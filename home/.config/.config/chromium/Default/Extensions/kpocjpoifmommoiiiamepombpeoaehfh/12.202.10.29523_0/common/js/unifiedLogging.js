var unifiedLogging = (function() {
	var APPLICATION_NAME = 'CAPNative',
		activeUrl = Common.activeUrl;

	return {
		EVENTS: {
			ACTIVE: 'ToolbarActive',
			TOOLBAR_BLOCKED: 'ToolbarBlocked',
            PLUGIN_INVOKED: 'PluginInvoked',
            DIALOG_VIEW: 'DialogView',
            UICONTROL: 'UIControl',
			GC25_UPGRADE_INVOKED: 'GC25UpgradeInvoked'			
        },

		logEvent: function(eventType, appSpecificParams) {
			var toolbarInfo = {},
				url;

			// This is available in the context of a Content Script
			if (window.toolbarData) {
				toolbarInfo = window.toolbarData.toolbarInfo
			}
			// This is available in the context of the Background
			else if (window.Toolbar) {
				toolbarInfo = Toolbar.toolbarInfo;
			}

			var params = {
				anxa: APPLICATION_NAME,
				anxv: toolbarInfo.toolbarVersion,
				anxe: eventType,
				anxt: toolbarInfo.toolbarId,
				anxtv: toolbarInfo.toolbarVersion,
				anxp: toolbarInfo.partnerId,
				anxsi: toolbarInfo.partnerSubId,
				anxd: toolbarInfo.toolbarBuildDate,
				f: '00400000',
				anxr: Common.randomInt()
			};

			_.extend(params, appSpecificParams);

			url = activeUrl + "?" + Common.makeQueryString(params);

			Common.getExternalData(url);
		}
	};
})();