var paramReplacer = {
    keys: new Array(),
    partnerIdFactory: new PartnerIdFactory(),

    init: function() {
        var self = this;

        this.addKey("affiliateID", function() {
            return self.getPartner().getCampaign();
        });
        this.addKey("cobrandID", function() {
            return self.getPartner().getCobrand();
        });
        this.addKey("countryCode", function() {
            return self.getPartner().getCountry();
        });
        this.addKey("curHour", function() {
            var today = new Date();
            var year = today.getFullYear();
            var month = today.getMonth() + 1;
            var day = today.getDate();
            var hour = today.getHours();
            return '' + year + (month < 10 ? '0' + month : month) + (day < 10 ? '0' + day : day) + (hour < 10 ? '0' + hour : hour);
        });
        this.addKey("definitionID", function() {
            return config.id;
        });
        this.addKey("installDate", function() {
            return Global.getInstallDate();
        });
        this.addKey("installDateHex", function() {
            return Common.getInstallDateHex(Global.getInstallDate());
        });
        this.addKey("languageISO", function() {
            if (Common.isNotEmpty(navigator.language))
                return navigator.language;
            if (Common.isNotEmpty(navigator.userLanguage))
                return navigator.userLanguage;
            if (Common.isNotEmpty(navigator.browserLanguage))
                return navigator.browserLanguage;
            if (Common.isNotEmpty(navigator.systemLanguage))
                return navigator.systemLanguage;
            return '';
        });
        this.addKey("partnerID", function() {
            return self.getPartner().toString();
        });
        this.addKey("partnerParams", function() {
            return self.getPartner().appendQueryParameters('ptnrS');
        });
        this.addKey("partnerParamsConfig", function() {
            return self.getPartner().appendQueryParameters('p');
        });
        this.addKey("partnerParamsSearch", function() {
            return self.getPartner().appendQueryParameters('id', 'ptnrS');
        });
        this.addKey("partnerSubID", function() {
            return Global.getPartnerSubId();
        });
        this.addKey("toolbarID", function() {
            return Global.getToolbarId();
        });
        this.addKey("toolbarVersion", function() {
            return config.version;
        });
        this.addKey("toolbarVersionNew", function() {
            return config.version;
        });
        this.addKey("trackID", function() {
            return self.getPartner().getTrack();
        });
        this.addKey("topDomain", function(tab) {
            return Common.extractTopLevelDomain(tab.url);
        });
        this.addKey("QUERY_INPUT", function(tab) {
            return encodeURIComponent(searchContext.getQuery(tab.id));
        });
        this.addKey("MY_TEXT_INPUT", function(tab) {
            return encodeURIComponent(searchContext.getQuery(tab.id));
        });
    },

    replaceParams: function(input, tab) {
        var self = this,
            isSearch = false;
        //console.log('pR: replaceParams(%s,%s)', input, tab);
        var internalReplace = function(match, group) {
            var value = self.keys[group];
            isSearch = isSearch || /^(QUERY_INPUT|MY_TEXT_INPUT)$/.test(group);
            if (typeof value === 'function') {
                try{
                    value = value(tab);
                }catch (e){
                    console.error('internalReplace(%s,%s) input: %s, caught: %s', match, group, input, e);
                    value = '';
                }
            } else if (!value) {
                console.error('Unknown param: ' + group);
                value = '';
            }
            //console.log('pR: internalReplace(%s,%s) returns: %s', match, group, value);
            return value;
        };
        var result = input.replace(/\$\{\??(\w+)\}/g, internalReplace);
        result = result.replace(/<!--\s*(\w+)\s*-->/g, internalReplace);
        if (isSearch){
            //console.log('pR: replaceParams - before adjustDomain %s', result);
            result = Mindspark_InternationalSearch.adjustDomain(result);
            //console.log('pR: replaceParams - after adjustDomain %s', result);
        }
        //console.log('pR: replaceParams - returns', result);
        return result;
    },

    addKey: function(name, value){
        this.keys[name] = value;
    },

    getPartner: function() {
        return this.partnerIdFactory.parse(Global.getPartnerId(), Global.getPartnerSubId());
    }
};

paramReplacer.init();