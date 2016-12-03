var unifiedLogging = (function() {
	var domBackgroundPage = chrome.extension.getBackgroundPage(),
		toolbarConfig = domBackgroundPage.config,
		ANX_URL = Common.unifiedLoggingPixelUrl,
		APPLICATION_NAME = 'CAPSearch',
		pf = new PartnerIdFactory(),
		parentPartnerId = pf.parse(Global.getPartnerId()),
		trackId = "";

	if (parentPartnerId.isValid()) {
		trackId = parentPartnerId.getTrack();
	}

	return {
		EVENTS: {
			TABPAGEVIEW: 'TabPageView',
			UICONTROL: 'UIControl'
		},

		logEvent: function(eventType, appSpecificParams) {
			var params = {
				anxa: APPLICATION_NAME,
				anxv: toolbarConfig.version,
				anxd: toolbarConfig.buildDate,
				userSeg: trackId,
				userSegType: "ndl",
				anxe: eventType,
				anxr: Common.randomInt()
			};

			Common.extend(params, appSpecificParams);
			Common.getExternalData(ANX_URL + "?" + Common.makeQueryString(params));
		},

		logClick: function(controlID) {
			this.logEvent(this.EVENTS.UICONTROL, {
				controlID: controlID,
				uitype: "link",
				controlGroupID: "tab"
			});
		}
	};
})();
