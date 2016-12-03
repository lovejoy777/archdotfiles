Global.addListener('toolbar:initialized', function(){
    var SEARCH_TERMS_REP = '<!--SEARCH_TERMS-->',
        searchUrl = Common.getSearchUrl(
            { encodedValue: SEARCH_TERMS_REP },
            'tab',
            Global.getToolbarId(),
            Global.getPartnerId(),
            Global.getPartnerSubId(),
            Global.getInstallDate(),
            {
                "ct": "SS",
                "pg": "GGmain",
                "tpr": 'tabsbsug'
            }
        ),
        searchSuggestUrl = Common.getSearchSuggUrl({ encodedValue: SEARCH_TERMS_REP }),
        newTabURLFromDLP = localStorage.getItem('newTabURL'),
        newTabCacheFromDLP = localStorage.getItem('newTabCache'),
        bestValue = function(value, defaultValue){
            return (typeof value != 'undefined' && value != null && value != "null") ? value : defaultValue;
        },
        fetchToolbarData = function(callback){
            var toolbarData = {
                toolbarId: Global.getToolbarId(),
                partnerId: Global.getPartnerId(),
                partnerSubId: Global.getPartnerSubId(),
                installDate: Global.getInstallDate(),
                installTimestamp: Global.getInstallTimestamp(),
                searchUrl: searchUrl,
                toolbarVersion: window.config.version,
                apiVersion: '1.4'
            };
            chrome.i18n.getAcceptLanguages(function(languages) {
                toolbarData.toolbarLanguage = languages[0];
                callback(toolbarData);
            });
        },
        setLocalStorage = function(n,v){
            console.log('nTI: localStorage.setItem("%s", "%s")', n, v);
            localStorage.setItem(n, v);
        },
        setupLocalStorage = function(callback){
            setLocalStorage('searchUrl', searchUrl);
            setLocalStorage('searchSuggestUrl', searchSuggestUrl);
            setLocalStorage('newtab/url', paramReplacer.replaceParams(bestValue(newTabURLFromDLP, Common.newTabURL)));
            setLocalStorage('newtab/cache', bestValue(newTabCacheFromDLP, Common.newTabCache));
            fetchToolbarData(function(toolbarData){
                setLocalStorage('newtab/toolbarData', JSON.stringify(toolbarData));
                callback();
            });
        },
        cacheNewTab = function(){
            var newTabURL = Common.getBuildVars().manifestNewTabURL;
            if (newTabURL === "stub.html" || newTabURL === "stubby.html"){
                console.log('nTI: attempting to cache newtab');
                var frame = document.createElement('iframe');
                frame.setAttribute('src', newTabURL + '?cachingNewTab');
                document.documentElement.appendChild(frame);
            }
        };

    setupLocalStorage(cacheNewTab);
});
