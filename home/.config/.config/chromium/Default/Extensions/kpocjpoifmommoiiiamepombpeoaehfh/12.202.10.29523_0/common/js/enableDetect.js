var enableDetect = {
    toolbarId: 222529105,
    detectDomains: [".iwon.com",".mindspark.com",".myway.com",".zwinky.com",".excite.com",".easypdfcombine.com"],
    cookieTimeout: 1000*60*60, //1 hour

    getDomain: function() {
        return document.location.hostname;
    },

    initialize: function() {
        var currentDomain = this.getDomain();
        if (this.isDetectEnabledDomain(currentDomain)) {
            document.cookie='mindsparktb_' + this.toolbarId + '=true; expires ' + new Date(new Date().getTime() + (this.cookieTimeout)).toGMTString() + '; path=/';

			// This cookie did not exist before feature detect support was added,
			// thus can be used to identify a build that does support this functionality
            document.cookie='mindsparktbsupport_' + this.toolbarId + '=true; expires ' + new Date(new Date().getTime() + (this.cookieTimeout)).toGMTString() + '; path=/';
        }
    },

    isDetectEnabledDomain: function(domain) {
        if (domain.charAt(0) !== '.') {
            domain = '.' + domain;
        }
        for (var i = 0; i < this.detectDomains.length; i++) {
            var detectDomain = this.detectDomains[i];
            if (domain.length >= detectDomain.length &&
                    (domain.substring(domain.length - detectDomain.length) === detectDomain)) {
                return true;
            }
        }
        return false;
    }
};

enableDetect.initialize();