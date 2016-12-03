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

	if (params.title) {
		document.title = params.title;
	}

	innerBrowser.setAttribute("src", params.widgetUrl);

	innerBrowser.addEventListener('load', function(event) {
		initAdapter({
			widgetWindow: innerBrowser.contentWindow,
			adapterWindow: window,
			widgetId: params.widgetId,
			windowUrl: params.widgetUrl,
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
	innerBrowser.focus();

	window.addEventListener('resize', function(event) {
		innerBrowser.style.width = window.innerWidth + 'px';
		innerBrowser.style.height = window.innerHeight + 'px';
	}, false);
}(window));