/**
 * This service auto-initializes and fires a request for the toolbar rendering blacklist
 * file on Akamai. After updating the blacklist file, it should be purged on Akamai in
 * order for the user to consume the latest version. The toolbar will not be displayed
 * on a blacklisted domain. The extension will store the latest snapshot of the blacklist
 * in the event that the blacklist request is having issues.
 *
 * Note that if a user visits a blacklisted page prior to the blacklist being pulled down,
 * the toolbar will render. This would only occur after the extension is installed. As
 * blacklisting is not currently a legal obligation and has to do with rendering issues,
 * this edge case will not be addressed.
 */
var globalBlacklistService = (function() {
	var TOOLBAR_RENDERING_VERSION = '1.1', // TODO: source this version from elsewhere
		GLOBAL_BLACKLIST_KEY = "GLOBAL_BLACKLIST",
		blacklist = Global.retrieve(GLOBAL_BLACKLIST_KEY);

	if (blacklist) {
		blacklist = JSON.parse(blacklist);
	}
	else {
		blacklist = [];
	}

	Mindspark_.adapterUtil.sendAjaxRequest(
		{
			'url': 'http://ak.imgfarm.com/images/nocache/native/globalBlacklist-' + TOOLBAR_RENDERING_VERSION + '.json'
		},
		function(response) {
			if (!response.error) {
				var content = response.content;

				try {
					blacklist = JSON.parse(content);
					Global.store(GLOBAL_BLACKLIST_KEY, content);
				} catch (e) {
					console.warn('Unable to parse blacklist response %s', e);
				}
			}
		}
	);

	return {
		isUrlBlacklisted: function(url) {
			var blacklisted = false;

			_.each(blacklist, function(domainRegexObject, index, list) {
				var pattern = domainRegexObject.p,
					flags = domainRegexObject.f,
					domainRegex = new RegExp(pattern, flags);

				if (domainRegex.test(url)) {
					blacklisted = true;
				}
			});

			return blacklisted;
		}
	};
}());