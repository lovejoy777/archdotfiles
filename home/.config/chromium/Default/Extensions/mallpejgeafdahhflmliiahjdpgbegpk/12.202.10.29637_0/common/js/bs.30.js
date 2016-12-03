/**
 * This service is used to enable/disable the visibility of the toolbar. It used to toggle
 * the visibility on a domain-level, where if a user was on foo.com and disabled the toolbar,
 * it would be disabled on that domain only. However, at one point the service was changed
 * to enable/disable the toolbar on all domains.
 */
var BlackListService = {
	/**
	 * This method will take into account the Global Blacklist, which are sites that the
	 * toolbar should never appear on, in addition to the user's blacklist.
	 * @param url
	 * @returns {Boolean} Indicates whether or not the domain is blacklisted
	 */
	isUrlBlacklisted: function(url) {
		var domain = Common.extractDomain(url);

        //TODO: remove this when it's not domain based
        domain = '*';

		var userBlacklisted = this.getBlacklistDomains()[domain],
			globallyBlacklisted = globalBlacklistService.isUrlBlacklisted(url);

        return userBlacklisted || globallyBlacklisted;
    },

    addDomainToBlackList: function(domain) {
        //TODO: remove this when it's not domain based
        domain = '*';
        var blacklist = this.getBlacklistDomains();
        blacklist[domain] = true;
        this.saveBlacklistDomains(blacklist);
    },

    removeDomainFromBlackList: function(domain) {
        //TODO: remove this when it's not domain based
        domain = '*';
        var blacklist = this.getBlacklistDomains();
        if (blacklist[domain]) {
            delete blacklist[domain];
            this.saveBlacklistDomains(blacklist);
        }
    },

    getBlacklistDomains: function() {
        var blacklistStr = Global.retrieve('blacklist');
        if (blacklistStr) {
            return JSON.parse(blacklistStr);
        } else {
            return {};
        }
    },

    saveBlacklistDomains: function(domains) {
        Global.store('blacklist', JSON.stringify(domains));
    }
};
