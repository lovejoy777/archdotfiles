(function(window) {
	"use strict";

	var document = window.document;

	var serializeQueryString = function() {
		var query = {},
			queryString = window.location.search.substring(1),
			re = /([^&=]+)=([^&]*)/g,
			m;

		while (m = re.exec(queryString)) {
			query[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
		}

		return query;
	};

	/* Structure of the params Object
	{
		widgetUrl: --,
		widgetId: --,
		type: --,		// window type
		title: --,		// only applies to popup windows
		width: --,
		height: --,
		trusted: --		// whether or not this is a trusted window
	}*/
	var query = serializeQueryString(),
		params = JSON.parse(query.params),
		innerBrowser = document.createElement("iframe");

	innerBrowser.setAttribute("src", params.widgetUrl);

	innerBrowser.addEventListener('load', function(event) {
		var windowId = window.frameElement.Mindspark_windowId;

		initAdapter({
			widgetWindow: innerBrowser.contentWindow,
			adapterWindow: window,
			widgetId: params.widgetId,
			windowUrl: params.widgetUrl,
			windowId: windowId,
			logFunction: function(s) {
				try {
					console.log(s);
				} catch (e) {
					// noop
				}
			},
			isTrusted: params.trusted
		});
	}, false);

	document.body.appendChild(innerBrowser);
}(window));