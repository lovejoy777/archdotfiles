/**
 * Created by steven.harris on 5/7/2015.
 */

/*
 Definition Dependencies:
 'unifiedLogger': see unifiedLogger.js
 'persister': see FFPreferencesPersister.js or LocalStoragePersister.js
 'searchSuggestLocale.config': structured object with the following properties
 - supportedLocales: an array of strings specifying the locales to use when found
 - defaultLocale: the locale to use when unable to find a supported locale

 Exports:
 'searchSuggestLocale': this object, with the following entry points:
 - toString: string representing state of this object
 - setDefaultLocale: sets the default locale
 - getDefaultLocale: gets the default locale
 - setSupportedLocales: sets the supported locales. takes a comma seperated string or array
 - getSupportedLocales: gets a copy of the array of supported locales
 - getSupportedLocale: gets the computed locale to use based on list in navigator.languages, supportedLocales and defaultLocale
 */
Mindspark_Global.getValues('searchSuggestLocale.config', 'unifiedLogger', 'persister', 'console',
    function SearchSuggestLocale(searchSuggestLocaleConfig, unifiedLogger, persister, console){
        "use strict";

        Mindspark_Global.setValue('searchSuggestLocale', (function SearchSuggestLocaleConstructor(){

            function setSupportedLocales(locales){
                console.log('ssl: setSupportedLocale(%O) - this: %s', locales, toString());
                var curValue = state.supportedLocales.toString(),
                    newValue = locales.toString();
                if (curValue != newValue){
                    state.supportedLocales = (typeof locales === 'string' ? locales.split(',') : locales) || [];
                    savePreviousLocale();
                    state.supportedLocale = undefined;
                    saveState();
                    console.log('ssl: setSupportedLocale - this: %s', toString());
                }
            }

            function savePreviousLocale() {
                if(state.supportedLocale) {
                    state.previousLocale = state.supportedLocale;
                }
            }

            function getSupportedLocales(){
                // return a copy
                return state.supportedLocales.slice(0);
            }
            function setDefaultLocale(locale){
                console.log('ssl: setDefaultLocale(%O) - this: %s', locale, toString());
                if (locale != state.defaultLocale) {
                    savePreviousLocale();
                    state.supportedLocale = undefined;
                    state.defaultLocale = locale;
                    saveState();
                    console.log('ssl: setDefaultLocale - this: %s', toString());
                }
            }
            function getDefaultLocale(){
                return state.defaultLocale;
            }
            function initialState(){
                return {
                    previousLocales: [],
                    supportedLocales: [],
                    defaultLocale: 'en',
                    supportedLocale: undefined,
                    previousLocale: undefined
                };
            }
            function loadState(){
                var temp = persister.getValue('lssState');
                state = temp || initialState();
            }
            function saveState(){
                persister.setValue('lssState', state);
            }
            function getAcceptedLanguages(){
                return navigator.languages || [navigator.language];
            }
            function getSupportedLocale(){
                //console.log(new Error().stack);
                console.log('ssl: getSupportedLocale() - this: %s', toString());
                if (!state.supportedLocale){
                    var languages = getAcceptedLanguages(),
                        supportedLocale = state.defaultLocale;
                    for (var i = 0, len = languages.length; i < len; ++i){
                        var language = languages[i],
                            index = state.supportedLocales.indexOf(language);
                        if (index !== -1){
                            supportedLocale = language;
                            break;
                        }
                    }
                    if (supportedLocale != state.supportedLocale){
                        unifiedLogger.logSSLocaleChanged({
                            'previousLocales': state.previousLocales.join(','),
                            'currentLocales': languages.join(','),
                            'previousLocale': state.previousLocale,
                            'defaultLocale': state.defaultLocale,
                            'supportedLocale': supportedLocale
                        });
                        state.supportedLocale = supportedLocale;
                        state.previousLocale = supportedLocale;
                        state.previousLocales = languages;
                        saveState();
                    }
                }
                console.log('ssl: getSupportedLocale - this: %s', toString());
                return state.supportedLocale;
            }
            function toString(){
                return ['LSS{',
                    'previousLocales:[', state.previousLocales.join(','), '],',
                    'supportedLocales:[', state.supportedLocales.join(','), '],',
                    'defaultLocale:', state.defaultLocale, ',',
                    'supportedLocale:', state.supportedLocale, ',',
                    'previousLocale:', state.previousLocale,
                    '}'].join('');
            }


            function SearchSuggestLocaleInit(searchSuggestSupportedConfig){
                console.log('ssl: SearchSuggestLocaleInit(%O) - this: %s', searchSuggestSupportedConfig, toString());
                setSupportedLocales(searchSuggestSupportedConfig.supportedLocales);
                setDefaultLocale(searchSuggestSupportedConfig.defaultLocale);
                getSupportedLocale();
                console.log('ssl: SearchSuggestLocaleInit - this: %s', toString());
            }

            try {

                var state;
                loadState();

                SearchSuggestLocaleInit(searchSuggestLocaleConfig);

                return {
                    toString: toString,
                    setDefaultLocale: setDefaultLocale,
                    getDefaultLocale: getDefaultLocale,
                    setSupportedLocales: setSupportedLocales,
                    getSupportedLocales: getSupportedLocales,
                    getSupportedLocale: getSupportedLocale
                };

            } catch(e) {
                console.error(e.message, e.stack);
                throw e;
            }

        })());
    }
);


