



 
 

var buildVars = {
    defaults: {
        disappearingAskLogoURL: 'icons/tb_icon_search_disappearing_ask.png',
        includeOptionsPage: false,
        includeBrowserAction: true,
        forceNewTab: true,
        noSuccessPage: true,
        isTBPartOfPage: false,
        chromeManifestNewTab: 'stubby',
        chromeEnableTopSites: false,
        hasExecutablePackages: true,
        chromeHideToolbarSearch: false,
        chromeShowToolbar: 'new-tab',
        chromeToolbarStyleSheet: '',
        i18nSearchDefaultDomain: '',
        i18nSearchSpecifiedDomain: '',
        i18nSearchCountryCodes: [],
        localizedSearchSuggestDefaultLanguage: 'en',
        localizedSearchSuggestSupportedLanguages: ['en', 'ca', 'fr'],
        uninstallSurveyUrl: ''
    },
    buildTime: {
        disappearingAskLogoURL: '',
        includeOptionsPage: false,
        includeBrowserAction: true,
        forceNewTab: true,
        noSuccessPage: true,
        isTBPartOfPage: false,
        chromeManifestNewTab: 'stubby',
        chromeEnableTopSites: false,
        hasExecutablePackages: false,
        chromeHideToolbarSearch: false,
        chromeShowToolbar: 'nowhere',
        chromeToolbarStyleSheet: '',
        i18nSearchDefaultDomain: 'http://int.search.myway.com/search',
        i18nSearchSpecifiedDomain: 'http://search.myway.com/search',
        i18nSearchCountryCodes: ['99','US'        ],
        localizedSearchSuggestDefaultLanguage: 'en',
        localizedSearchSuggestSupportedLanguages: ['de','es','pt','ja','en'        ],
        uninstallSurveyUrl: 'http://fromdoctopdf.dl.myway.com/uninstall.jhtml?surveyUrl=http%3A%2F%2Fwww.research.net%2Fr%2FGBT6YQG%3Fc%3D<!--toolbarID-->%26ptb%3D<!--partnerID-->'
    }
};

/*
ChromeExtensionCopies.chromeShowToolbar: nowhere
ChromeExtensionCopies.chromeManifestNewTab: stubby
ChromeExtensionCopies.chromeHideToolbarSearch: ${ChromeExtensionCopies.chromeHideToolbarSearch}
ChromeExtensionCopies.chromeEnableTopSites: ${ChromeExtensionCopies.chromeEnableTopSites}
ChromeExtensionCopies.chromeToolbarStyleSheet: ${ChromeExtensionCopies.chromeToolbarStyleSheet}
InternationalSearch.default: http://int.search.myway.com/search
InternationalSearch.specified: http://search.myway.com/search
InternationalSearch.countryCodes: [99, US]
AutocompleteDefaultLanguage: 'en',
AutocompleteSupportedLanguages: [de, es, pt, ja, en]
 */