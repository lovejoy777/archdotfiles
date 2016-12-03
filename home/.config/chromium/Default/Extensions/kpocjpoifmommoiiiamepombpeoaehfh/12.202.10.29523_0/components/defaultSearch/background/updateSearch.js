/**
 * Created with IntelliJ IDEA.
 * User: steven.harris
 * Date: 2/12/13
 * Time: 2:12 PM
 */

/*
 The call is UpdateSearch(
 BSTR bstrExtensionId, //Extension ID to be monitored
 BSTR bstrSearchName, //Name of the search provider that will be added
 BSTR bstrSearchUrl, //Search URL to use
 BSTR bstrSearchSuggestUrl, //Search suggest URL to use
 BSTR bstrFavIconUrl, //Favorite icon URL for the search
 BSTR bstrOmniboxKeyword, //Keyword to use for the omnibox
 BOOL bAutoreplace, //Sets the flag “Safe for Autoreplace”
 BOOL bDisplay //Sets the flag “Show in default list”
 ) returns a long value;
 */
/*
 Questions:
 1. How will we know to enable search?
 - caller will know when to invoke
 2. How will the cookies be made visible to this code?
 - Won't be visible. Caller will use toolbarCookieParser.js
 3. How shall we prompt the user to opt in/out?
 4. How will product be able to have any control over the prompt user experience?
 5. How will we configure the search URL?
 - dynamic.js and dynamic.js.vm add values to Common
 6. Can I assume that underscore js exists?
 - yes
 7. Need to work out the specifics for UL?
 8. Need to know what to do when it is determined that we should not try again?
 9. Need to add the search specific params to Common.
 - see dynamic.js and dynamic.js.vm
 10. Need to know how it will be invoked?
 - see bottom of toolbar.js (ToolbarCookieParser callback)
 11. What should be the RETRY_DELAY_MINUTES? Right now is 5, which is a long time.
 12. Plugin location?
 - in the target plugins directory
 13. How to confirm?
 - confirm via chrome://settings/searchEngines
 14. How to build search URL?
 - see usages of dynamic.js searchURL
 */

var updateSearch = (function(){
    "use strict";

    var DLL_NAME = "SearchControl",
        PLUGIN_GUID = "{A85E2E3C-5C69-4EAA-994B-7A25AE1805D0}",
        EXTENSION_ID = chrome.i18n.getMessage("@@extension_id"),
        SEARCH_NAME = Common.browserHomeUrlDesc,
        FAV_ICON_URL = Common.searchFaviconUrl,
        OMNIBOX_KEYWORD = Common.keyword,
        RESTART_TIMEOUT_1 = "2000", // time to wait for WM_CLOSE to finish as well as the time to wait
                                    // for chrome to exit.
        RESTART_TIMEOUT_2 = "5000", // time for the control to wait for the UPDATER process to finish and exit
        AUTO_REPLACE = true,
        DISPLAY = true,
        ACTION_CODES = {
            SUCCESS: 'SUCCESS',
            FAILED_RESTART: 'FAILED_RESTART',
            RETRY: 'RETRY',
            UNRECOVERABLE: 'UNRECOVERABLE'
        },
        RESULT_CODES = {
            PLUGIN_INVOCATION_ERROR: 			    {code: -1, action: ACTION_CODES.UNRECOVERABLE},
            //TODO: what about zero?
            ZERO: 					                {code:  0, action: ACTION_CODES.SUCCESS},
            EXTENSION_UPDATED: 					    {code:  1, action: ACTION_CODES.SUCCESS},
            EXTENSION_SEARCH_TAKEN: 			    {code:  2, action: ACTION_CODES.SUCCESS},
            UPDATER_INTERNAL_ERROR: 			    {code:  3, action: ACTION_CODES.RETRY},
            UPDATER_CREATE_PROCESS_ERROR: 		    {code:  4, action: ACTION_CODES.RETRY},
            // pending (first invocation returns this, if there was not an error)
            UPDATER_ALREADY_RUNNING: 			    {code:  5, action: ACTION_CODES.RETRY},
            BAD_EXTENSION_ID: 					    {code:  6, action: ACTION_CODES.UNRECOVERABLE},
            BAD_SEARCH_NAME: 					    {code:  7, action: ACTION_CODES.UNRECOVERABLE},
            BAD_SEARCH_URL: 					    {code:  8, action: ACTION_CODES.UNRECOVERABLE},
            BAD_SEARCH_SUGGEST_URL: 			    {code:  9, action: ACTION_CODES.UNRECOVERABLE},
            BAD_FAV_ICON_URL: 					    {code: 10, action: ACTION_CODES.UNRECOVERABLE},
            BAD_OMNIBOX_KEYWORD: 				    {code: 11, action: ACTION_CODES.UNRECOVERABLE},
            UPDATER_CREATE_FILE_ERROR: 			    {code: 12, action: ACTION_CODES.RETRY},
            UPDATER_TEMP_PATH_ERROR:                {code: 13, action: ACTION_CODES.RETRY},
            UPDATER_ALREADY_ACQUIRED_BY_ME:         {code: 14, action: ACTION_CODES.SUCCESS},
            UPDATER_NOT_ACQUIRED:                   {code: 15, action: ACTION_CODES.SUCCESS},
            UPDATER_ACQUIRED_BY_OTHER:              {code: 16, action: ACTION_CODES.SUCCESS},
            UPDATER_ACQUIRED:                       {code: 17, action: ACTION_CODES.SUCCESS},
            RESTART_TIMEOUT:                        {code: 18, action: ACTION_CODES.FAILED_RESTART},
            RESTART_EXE_TIMEOUT:                    {code: 19, action: ACTION_CODES.FAILED_RESTART},
            LAST_RESULT: 						    {code: 64, action: ACTION_CODES.RETRY},
            UNKNOWN_ERROR_IN_GET_PART_FROM_RESOURCE:{code: 64 + 0x0101, action: ACTION_CODES.RETRY},
            LOAD_OR_LOCK_RESOURCE_FAILED: 		    {code: 64 + 0x0102, action: ACTION_CODES.RETRY},
            SIZE_OF_RESOURCE_FAILED: 			    {code: 64 + 0x0103, action: ACTION_CODES.RETRY},
            FIND_RESOURCE_FAILED: 				    {code: 64 + 0x0104, action: ACTION_CODES.RETRY},
            CREATE_FILE_FAILED: 				    {code: 64 + 0x0105, action: ACTION_CODES.RETRY},
            UNEXPECTED_SIZE_FROM_WRITE_FILE: 	    {code: 64 + 0x0106, action: ACTION_CODES.RETRY}
        },
        pluginAttributes = {
            id: DLL_NAME,
            type: "application/x-mindsparkchromeplugin",
            Server: DLL_NAME + "." + PLUGIN_GUID
        },
        getSearchUrl = function(){
            return Global.getSearchUrl({ encodedValue: "{searchTerms}" }, Common.KEYWORD_SEARCH);
        },
        getSearchSuggestUrl = function(){
            return Common.getSearchSuggUrl({ encodedValue: "{searchTerms}" });
        },
        domPlugin = document.getElementById(pluginAttributes.id),
        embedPlugin = function(){
            domPlugin = document.createElement('embed');
            _.each(pluginAttributes, function(value, key/*, list*/){
                domPlugin.setAttribute(key, value);
            });
            document.body.appendChild(domPlugin);
        },
        logEvent = function(methodName, resultCode, errorMessage) {
            var appSpecificParams = {
                "controlName": DLL_NAME,
                "methodName": methodName,
                "resultCode": resultCode,
                "errorMessage": errorMessage
            };

            unifiedLogging.logEvent(unifiedLogging.EVENTS.PLUGIN_INVOKED, appSpecificParams);
            console.log('US: updateSearch: logEvent - type: %s, params: %s', unifiedLogging.EVENTS.PLUGIN_INVOKED, JSON.stringify(appSpecificParams));
        },
        mapResultCode = function(resultCode, rc){
            var out = rc;
            _.each(RESULT_CODES, function(value){

                if (value.code == resultCode){
                    out = value;
                    return false;
                }else{
                    return true;
                }
            });
            return out;
        },
        pluginUpdateSearch = function(){
            console.log('US: updateSearch.pluginUpdateSearch()');
            var resultCode,
                errorMessage = '',
                rc = {code: -2, action: ACTION_CODES.UNRECOVERABLE};

            if (!domPlugin){
                embedPlugin();
            }

            try {
                resultCode = domPlugin.UpdateSearch(EXTENSION_ID, SEARCH_NAME, getSearchUrl(),
                    getSearchSuggestUrl(), FAV_ICON_URL, OMNIBOX_KEYWORD, AUTO_REPLACE, DISPLAY);
                console.log('US: updateSearch.pluginRestart - post UpdateSearch, resultCode: %s', resultCode);
            } catch (e) {
                resultCode = RESULT_CODES.PLUGIN_INVOCATION_ERROR.code;
                errorMessage = e.name + ': ' + e.message;
                console.warn(errorMessage);
            }

            rc = mapResultCode(resultCode, rc);

            logEvent("UpdateSearch", resultCode, errorMessage);
            console.log('US: updateSearch.pluginUpdateSearch - result: ' + JSON.stringify(rc));
            return rc.action;
        },
        pluginRestart = function(){
            console.log('US: updateSearch.pluginRestart()');
            var resultCode,
                errorMessage = '',
                rc = {code: -3, action: ACTION_CODES.UNRECOVERABLE};

            if (!domPlugin){
                embedPlugin();
            }

            try {
                console.log('US: updateSearch.pluginRestart - invoking Restart(%s,%s,%s)', EXTENSION_ID, RESTART_TIMEOUT_1, RESTART_TIMEOUT_2);
                resultCode = domPlugin.Restart(EXTENSION_ID, RESTART_TIMEOUT_1, RESTART_TIMEOUT_2);
                console.log('US: updateSearch.pluginRestart - post Restart, resultCode: %s', resultCode);
            } catch (e) {
                resultCode = RESULT_CODES.PLUGIN_INVOCATION_ERROR.code;
                errorMessage = e.name + ': ' + e.message;
                console.warn(errorMessage);
            }

            rc = mapResultCode(resultCode, rc);

            logEvent("Restart", resultCode, errorMessage);
            console.log('US: updateSearch.pluginRestart - result: ' + JSON.stringify(rc));
            return rc.action;
        },
        pluginAcquire = function(){
            console.log('US: updateSearch.pluginAcquire()');
            var resultCode = -4,
                errorMessage = '';

            if (!domPlugin){
                embedPlugin();
            }

            try {
                resultCode = domPlugin.Acquire(EXTENSION_ID);
                console.log('US: updateSearch.pluginAcquire - post Acquire, resultCode: %s', resultCode);
            } catch (e) {
                resultCode = RESULT_CODES.PLUGIN_INVOCATION_ERROR.code;
                errorMessage = e.name + ': ' + e.message;
                console.warn(errorMessage);
            }

            logEvent("Acquire", resultCode, errorMessage);
            var success = resultCode === RESULT_CODES.UPDATER_ACQUIRED.code ||
                resultCode === RESULT_CODES.UPDATER_ALREADY_ACQUIRED_BY_ME.code;
            console.log('US: updateSearch.pluginAcquire - returns: %s', success);
            return success;
        },
        pluginRelease = function(){
            console.log('US: updateSearch.pluginRelease()');
            var resultCode = -5,
                errorMessage = '';

            if (!domPlugin){
                embedPlugin();
            }

            try {
                resultCode = domPlugin.Release(EXTENSION_ID);
                console.log('US: updateSearch.pluginRelease - post Release, resultCode: %s', resultCode);
            } catch (e) {
                resultCode = RESULT_CODES.PLUGIN_INVOCATION_ERROR.code;
                errorMessage = e.name + ': ' + e.message;
                console.warn(errorMessage);
            }

            logEvent("Release", resultCode, errorMessage);
            var success = resultCode === RESULT_CODES.UPDATER_ALREADY_ACQUIRED_BY_ME.code;
            console.log('US: updateSearch.pluginRelease - returns: %s', success);
            return success;
        };

    return {
        ACTION_CODES: ACTION_CODES,
        updateSearch: pluginUpdateSearch,
        restart: pluginRestart,
        acquire: pluginAcquire,
        release: pluginRelease
    };
})();
