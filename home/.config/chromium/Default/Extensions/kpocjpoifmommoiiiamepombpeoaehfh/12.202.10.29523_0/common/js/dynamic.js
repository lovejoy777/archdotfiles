// this file holds data that will dynamically be filled in by the templated build
Common.extend(Common, {
	activeUrl:"http://live.tb.ask.com/tr.gif?anxa=CAPNative&anxe=ToolbarActive&anxv={{toolbarVersion}}&anxt={{toolbarId}}&anxtv={{toolbarVersion}}&anxp={{partnerId}}&anxsi={{partnerSubId}}&anxd={{buildDate}}&f=00400000&anxr={{random}}&defaultSearchState={{defaultSearchState}}&isStore={{isStore}}&tabEnabled={{tabEnabled}}&coid={{coid}}&userSegment={{userSegment}}&parentToolbarId={{parentToolbarId}}&otherToolbarId={{otherToolbarId}}",
	unifiedLoggingPixelUrl: "http://anx.tb.ask.com/anx.gif",
	localStorageCommunicationUrl: "http://easypdfcombine.dl.myway.com/blank.jhtml",
	searchFaviconUrl: "http://ak.imgfarm.com/images/toolbar/native/chrome/search-engines/ask/favicon.ico",
	chromeExtensionResetSearchSettingsUrl: "http://eula.mindspark.com/ask/reset-homepage-default-search-settings/",
	chromeExtensionUpdateEulaUrl: "http://eula.mindspark.com/ask/updates/chrome/",
    searchUrl: "http://search.myway.com/search/GGmain.jhtml",
    searchSuggUrl: "http://ss.search.ask.com/ss?li=ff&sstype=prefix&limit=10&hl=${highPriorityLanguage}",
    downloadUrl: "http://free.easypdfcombine.com/index.jhtml",
	extensionId: "EasyPDFCombine",
    isChromeUpdateSearchRequired: "false" === "true",
    browserHomeUrlDesc: "Ask",
    keyword: "askws",
    isChromeStore: "true" === "true",
    isChrome25UpgradeRequired: "false" === "true",
   	companyKeyName: "EasyPDFCombine_ce",
    includeNPAPI: false,
    coBrandID: "BSB",
	getInstructionsUrl: function() {
		return config.instructionsUrl;
	},
    cso: {
        homepage: "",
        homepageInternal: "",
        search: "",
        searchInternal: "",
        searchPostParams: "",
        searchSuggest: "",
        searchSuggestPostParams: "",
        instant: "",
        instantPostParams: "",
        imageSearch: "",
        imageSearchPostParams: ""
    },
    newTabCache: "false" === "true",
    newTabURL: "http://hp.myway.com/easypdfcombine/ttab02chr/index.html?p2=&n=&st=tab&ptb=&si=",
    companyName: "Mindspark"
});