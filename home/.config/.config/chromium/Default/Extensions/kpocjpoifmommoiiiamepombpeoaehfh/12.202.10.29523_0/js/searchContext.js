var searchContext = {
    queryByTabId: {},

    initialize: function() {
        var self = this; 

        chrome.tabs.onRemoved.addListener(function(tabId) {
            self.removeTab(tabId);
        });
    },

    updateQuery: function(tabId, query) {
        this.queryByTabId[tabId] = query;
    },

    clearQuery: function(tabId) {
        this.queryByTabId[tabId] = '';
    },

    removeTab: function(tabId) {
        delete this.queryByTabId[tabId];
    },

    getQuery: function(tabId) {
        var value = this.queryByTabId[tabId];
        if (typeof(value) === 'undefined' || value === null) {
            return '';
        } else {
            return value;
        }
    }
};

searchContext.initialize();