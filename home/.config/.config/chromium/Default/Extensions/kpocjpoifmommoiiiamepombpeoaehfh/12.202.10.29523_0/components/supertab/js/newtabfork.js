var forceNewTab = Global.retrieve('forceNewTab') == 'true';
var disableTabTakeOver = Global.retrieve('disableTabTakeover') == 'true';
var takeOverNewTab = forceNewTab || !disableTabTakeOver;
if (!takeOverNewTab) {
	var newTabURI = 'https://www.google.com/_/chrome/newtab',
		getChromeBrowserVersion = function() {
			return parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
		};

	// Use the chrome-internal URI in the versions where it is still supported
	try {
		if (getChromeBrowserVersion() < 33) {
			newTabURI = 'chrome-internal://newtab/';
		}
	} catch (e) {
		console.warn("Could not determine Chrome Browser version", e);
	}

	chrome.tabs.update({ url: newTabURI });
} else {
	// This is being done to prevent a "flicker" on the screen from
	// our new tab page first rendering.
	window.addEventListener('load', function() {
		document.body.style.display = 'block';
	}, false);
}

/*
truth table (u = undefined, f = false, t = true)

disableTabTakeover  u   f   t   u   f   t   u   f   t
forceNewTab         u   u   u   f   f   f   t   t   t
take over           t   t   f   t   t   f   t   t   t

*/