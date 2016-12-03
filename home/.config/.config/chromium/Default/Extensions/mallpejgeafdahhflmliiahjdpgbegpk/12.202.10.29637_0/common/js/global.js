var Global = {
    errors: [],

    store: function (key, value) {
        try {
            localStorage[key] = value;
        }
        catch (e) {
            Global.errors.push('Exception in store: ' + e);
        }
    },
    
    retrieve: function (key) {
        try {
            return localStorage[key];
        }
        catch (e) {
            Global.errors.push('Exception in retrieve: ' + e);
            return null;
        }
    },

    remove: function (key) {
        try {
            localStorage.removeItem(key);
        }
        catch (e) {
            Global.errors.push('Exception in remove: ' + e);
        }
    },

    isToolbarIdSet: function() {
        return this.isDefined(Global.retrieve('toolbarId'));
    },

    isPartnerIdSet: function() {
        return this.isDefined(Global.retrieve('partnerId'));
    },

    isPartnerSubIdSet: function() {
        return this.isDefined(Global.retrieve('partnerSubId'));
    },

    isInstallDateSet: function() {
        return this.isDefined(Global.retrieve('installDate'));
    },

    isInstallTimestampSet: function() {
        return this.isDefined(Global.retrieve('installTimestamp'));
    },

    isDefined: function(value) {
        return value != null && typeof(value) != "undefined" && value != '';
    },

    getToolbarId: function () {
        return Common.defaultVal(Global.retrieve('toolbarId'), '');
    },
    getPartnerId: function () {
        return Common.defaultVal(Global.retrieve('partnerId'), '');
    },
    getPartnerSubId: function () {
        return Common.defaultVal(Global.retrieve('partnerSubId'), '');
    },
    getInstallDate: function () {
        return Common.defaultVal(Global.retrieve('installDate'), '');
    },
    getInstallTimestamp: function () {
        return Common.defaultVal(Global.retrieve('installTimestamp'), '');
    },
    getUninstallSurveyUrl: function() {
        return Common.defaultVal(Global.retrieve('uninstallSurveyUrl'), '');
    },
    setToolbarId: function (toolbarId) {
        return Global.store('toolbarId', toolbarId);
    },
    setPartnerId: function (partnerId) {
        return Global.store('partnerId', partnerId);
    },
    setPartnerSubId: function (partnerSubId) {
        return Global.store('partnerSubId', partnerSubId);
    },
    setInstallDate: function (installDate) {
        return Global.store('installDate', installDate);
    },
    setInstallTimestamp: function (installDate) {
        return Global.store('installTimestamp', installDate);
    },
    setUninstallSurveyUrl: function(uninstallSurveyUrl) {
        return Global.store('uninstallSurveyUrl', uninstallSurveyUrl);
    },
    getSearchUrl: function (query, searchType) {
        return Common.getSearchUrl(query, searchType, Global.getToolbarId(), Global.getPartnerId(), Global.getPartnerSubId(), Global.getInstallDate());
    },

    listeners: [],

    /** getMessageListeners - returns the listeners added for a specific message */
    getMessageListeners: function(message){
        var messageListeners = this.listeners[message];
        if (!messageListeners){
            this.listeners[message] = messageListeners = [];
        }
        return messageListeners;
    },

    trimToLength: function(value, lenIn){
        var str = String(value),
            len = lenIn || 32;
        return value === undefined || value === null ? value : '"' + (str.length <= len ? str : str.substr(0, len || 32).replace(/\n/g, '\\n').replace(/"/g, '\\"') + '...') + '"';
    },

    /** addListener - adds a listener for the specific message */
    addListener: function(message, listener){
        console.log('g: addListener(%s,%s)', message, this.trimToLength(listener));
        this.getMessageListeners(message).push(listener);
    },

    /** postMessage - sends the data to all of the listeners setup via addListener for the specific message */
    postMessage: function(message, data){
        console.log('g: postMessage(%s,%s)', message, this.trimToLength(data));
        var messageListeners = this.getMessageListeners(message);
        for (var i = messageListeners.length - 1; i >= 0; --i){
            messageListeners[i](data);
        }
    },

    TS: function(message){
        var args = Array.prototype.slice.call(arguments, 0),
            now = Date.now(),
            delta = now - window.TSStart || now,
            ts = (delta / 1000.0).toFixed(3);
        if (args.length == 0){
            console.log('TS: %ss', ts);
        }else{
            args.unshift('TS: ' + ts + 's - ' + args[0]);
            console.log.apply(console, args);
        }
        if (!window.TSStart){
            window.TSStart = now;
        }
    }
};