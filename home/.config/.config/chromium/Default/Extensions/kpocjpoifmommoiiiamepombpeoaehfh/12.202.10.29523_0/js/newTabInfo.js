var NewTabInfo = {
    currentTabs: new Array(),
    mostPopularSites: new Array(),

    initialize: function() {
        var self = this;

        //Keep track of the current tabs so we know what is closed
        chrome.tabs.onCreated.addListener(function(tab) {
            self.updateTabs(tab);
        });
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
           self.updateTabs(tab);
        });

        chrome.tabs.onRemoved.addListener(function(tabId) {
            var tabInfo = self.currentTabs[tabId + ''];
            if (tabInfo) {
                self.addRecentlyClosedTab(tabInfo);
                //Clean up the array of current tabs
                delete self.currentTabs[tabId + ''];
            }
        });

        this.determineMostPopularSites();

        setInterval(function() {
            self.determineMostPopularSites();
        }, 1000 * 60 * 5); //recalculate the most popular sites every 5 minutes

    },

    getRecentlyClosedTabs: function(){
        var recentlyClosedTabsStr = Global.retrieve('recentlyClosedTabs'),
            recentlyClosedTabs = recentlyClosedTabsStr ? JSON.parse(recentlyClosedTabsStr) : {list:[]};
        return recentlyClosedTabs.list;
    },

    setRecentlyClosedTabs: function(list){
        Global.store('recentlyClosedTabs', JSON.stringify({list: list || []}));
    },

    addRecentlyClosedTab: function(tabInfo) {
        //Do not store pages w/ the chrome scheme
        if (tabInfo.url && tabInfo.url.indexOf('chrome') != 0) {
            //Get the latest from local storage
            var list = this.getRecentlyClosedTabs();

            //Add it to the list
            list.unshift(tabInfo);

            //Remove existing tab with the same url and title
            for (var i = 1, len = list.length; i < len; i++) {
                if (list[i].url == tabInfo.url) {
                    list.splice(i, 1);
                    break;
                }
            }

            this.setRecentlyClosedTabs(list);
        }
    },

    updateTabs: function(tab) {
        this.currentTabs[tab.id + ''] = {
            url : tab.url,
            title: tab.title,
            favIcon: tab.favIconUrl
        };
    },

    determineMostPopularSites: function() {
        var self = this,
            ONE_WEEK = 1000 /*ms*/ * 60 /*secs*/ * 60 /*mins*/ * 24 /*hrs*/ * 7 /*days*/,
            lastWeek = new Date().getTime() - ONE_WEEK,
            extractDomain = function(url) {
                var foo = document.createElement('a');
                foo.href = url;
                return foo.hostname;
            },
            VisitedEntry = function(historyItem, domain){
                return {
                    url: historyItem.url,
                    title: historyItem.title,
                    favIcon: 'chrome://favicon/' + historyItem.url,
                    domain: domain || extractDomain(historyItem.url),
                    visitCount: historyItem.visitCount};
            },
            comparator = function(historyItem1, historyItem2) {
                //Sorts decending
                return historyItem2.visitCount - historyItem1.visitCount;
            };

        chrome.history.search(
            {
                text:'',
                startTime: lastWeek,
                maxResults: 50000
            },
            function(historyResults){
                var visitedDomains = {},
                    list = [];

                for (var i = 0, len = historyResults.length; i < len; i++) {
                    var historyItem = historyResults[i];

                    if (historyItem.url.indexOf('chrome') == 0) continue;

                    var domain = extractDomain(historyItem.url),
                        visitedEntry = visitedDomains[domain];

                    if (!visitedEntry || visitedEntry.visitCount < historyItem.visitCount){
                        visitedDomains[domain] = VisitedEntry(historyItem, domain);
                    }
                }

                for (var key in visitedDomains){
                    if (visitedDomains.hasOwnProperty(key)){
                        list.push(visitedDomains[key]);
                    }
                }
                list.sort(comparator);
                self.mostPopularSites = list;
            }
        );
    },

    comparator: function(historyItem1, historyItem2) {
        //Sorts decending
        return historyItem2.visitCount - historyItem1.visitCount;
    }
};

if (Common.getBuildVars().chromeManifestNewTab === 'supertab'){
    NewTabInfo.initialize();
}
