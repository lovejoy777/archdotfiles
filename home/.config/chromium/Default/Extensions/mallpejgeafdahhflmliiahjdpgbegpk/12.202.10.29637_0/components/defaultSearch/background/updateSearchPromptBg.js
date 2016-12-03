/**
 * Created with IntelliJ IDEA.
 * User: steven.harris
 * Date: 2/14/13
 * Time: 2:32 PM
 * To change this template use File | Settings | File Templates.
 */

var updateSearchPromptBg = (function(){
    console.log('USP-BG: anon()');
    var STATE = {
            UNDEFINED: 'undefined',
            OVERRIDE_PENDING: 'overridePending',
            OVERRIDDEN: 'overridden',
            OVERRIDE_ERROR: 'overrideError',
            DO_NOT_OVERRIDE_MAC: 'doNotOverride_Mac',
			DO_NOT_OVERRIDE_OPTED_OUT: 'doNotOverride_optedOut',
			DO_NOT_OVERRIDE_NO_OPTION: 'doNotOverride_noOption',
			DO_NOT_OVERRIDE_NOT_STORE_INSTALL: 'doNotOverride_notStoreInstall',
            DO_NOT_OVERRIDE_NO_NPAPI: 'doNotOverride_noNPAPI'
        },
        FOREGROUND = {
            MSG_NAME: "CDS_FG_MSG",
            READY_CMD: "CDS_FG_READY_CMD",
            YES_CMD: "CDS_FG_YES_CMD",
            NO_CMD: "CDS_FG_NO_CMD",
            RESTART_CMD: "CDS_FG_RESTART_CMD",
            RESTART_AFTER_INSTALL_CMD: "CDS_FG_RESTART_AFTER_INSTALL_CMD",
            NOT_NOW_CMD: "CDS_FG_NOT_NOW_CMD",
            CLOSE_DIALOG_CMD: "CDS_FG_CLOSE_DIALOG_CMD"
        },
        BACKGROUND = {
            MSG_NAME: "CDS_BG_MSG",
            SHOW_PROMPT_CMD: "CDS_BG_SHOW_PROMPT_CMD",
            SHOW_RESTART_CMD: "CDS_BG_SHOW_RESTART_CMD",
            SHOW_RESTART_AFTER_INSTALL_CMD: "CDS_BG_SHOW_RESTART_AFTER_INSTALL_CMD",
            SHOW_RESTARTING_CMD: "CDS_BG_SHOW_RESTARTING_CMD",
            SHOW_UNABLE_TO_RESTART_CMD: "CDS_BG_SHOW_UNABLE_TO_RESTART_CMD",
            REMOVE_CMD: "CDS_BG_REMOVE_CMD"
        },
		USER_EXPERIENCE = {
			MODAL: "MODAL",
			INFO_BAR: "INFO_BAR"
		},
        INSTALL_TYPE = {
            CRXEXE: "CRXEXE",
            CRX_WEBSTORE: "CRX_WEBSTORE",
            UNDEFINED: null
        },
        GlobalBean = function(name, defaultValue){
            return {
                get: function(){
                    //nsole.log('USP-BG: %s.get()', name);
                    var value = Global.retrieve(name),
                        out = typeof value === 'undefined' || value === '' ? defaultValue : value;
                    console.log('USP-BG: %s.get() returns %s', name, out);
                    return out;
                },
                set: function(value){
                    console.log('USP-BG: %s.set(%s)', name, value);
                    Global.store(name, value);
                }
            };
        },
        userExperienceGlobalBean = new GlobalBean('defaultSearchUX', USER_EXPERIENCE.MODAL),
        defaultSearchBean = new GlobalBean('defaultSearch', "false"),
        defaultSearchOptionBean = new GlobalBean('defaultSearchOption', "false"),
        searchStateBean = new GlobalBean('defaultSearchState', STATE.UNDEFINED),
        installTypeBean = new GlobalBean('installType', INSTALL_TYPE.UNDEFINED),
        injected = false,
        fgOnReadyCmd = null,
        allDone = false,
        fgOnReadyShowPromptCmd = BACKGROUND.SHOW_PROMPT_CMD,
        fgOnReadyShowRestartCmd = null,
        fgOnReadyShowRestartAfterInstallCmd = null,
        displaySection = null,
        restartPromptSection = null,
        updateSearchEntryPoint = null,
        contentScriptFilePath = "",
        getBrowserHomeUrlDesc = function(){return Common.browserHomeUrlDesc;},
        getAppName = function(){return config.name;},
        getAppIcon = function(){return "../../../icons/icon48.png";},
        isMac = function(){
            var isMac = window.navigator.userAgent.indexOf('Macintosh') != -1;
            console.log("USP-BG: isMac - returns %s", isMac);
            return isMac;
        },
        shouldIncludeNPAPI = function(){
            return typeof Common.includeNPAPI === 'undefined' ? true : Common.includeNPAPI;
        },
        isStoreInstall = function(){
            // we are looking at both here because:
            // 1) there is a bug where it is a Chrome Store yet no cookies are parsed
            // 2) Common.isChromeStore is fixed at build time, so relying on the installType bean allows
            //    the developer to test both scenarios w/out creating a new build.
            var installType = installTypeBean.get(),
                isStoreInstall = installType === INSTALL_TYPE.CRX_WEBSTORE ||
                    (Common.isEmpty(installType) && Common.isChromeStore);
            console.log("USP-BG: isStoreInstall - returns %s", isStoreInstall);
            return isStoreInstall;
        },
        renderTabUI = function(tab) {
            if (!allDone){
                console.log('USP-BG: renderTabUI - injected: %s', injected);
                if (!injected && Toolbar.isSupportedScheme(tab.url)) {
                    chrome.windows.get(tab.windowId, function(window) {
                        // We do not care for popups
                        //noinspection JSUnresolvedVariable
                        if (Common.isNotNull(window) && window.type !== 'popup') {
                            chrome.tabs.get(tab.id, function(tab){
                                if (!injected && tab.active){
                                    console.log('USP-BG: renderTabUI - about to execute script');
                                    //noinspection JSUnresolvedFunction
                                    chrome.tabs.executeScript(
                                        tab.id,
                                        { file: contentScriptFilePath },
                                        function(/*injectionResult*/) {
                                            console.log('USP-BG: renderTabUI - executed script, setting injected = true;');
                                            logDisplayEvent();
                                            injected = true;
                                        }
                                    );
                                }
                            });
                        }
                    });
                }
            }
		},
        injectUI = function(){},
        startStateMachine = function(isNewInstall){
            console.log('USP-BG: startStateMachine(' + isNewInstall + ')');
            var overrideIsNewInstall = new GlobalBean('overrideIsNewInstall', 'false').get() === 'true',
                fromStore = isStoreInstall();
            switch (searchStateBean.get()){
            case STATE.UNDEFINED:
                if (isMac()) {
                    actions.doNotOverride(STATE.DO_NOT_OVERRIDE_MAC);
                }else if (!shouldIncludeNPAPI()) {
                    actions.doNotOverride(STATE.DO_NOT_OVERRIDE_NO_NPAPI);
                }else if ((!isNewInstall || overrideIsNewInstall) && !fromStore) {
                    // extension update
                    actions.prepareToShowPrompt();
                }else if (!fromStore) {
                    // EXE install
                    actions.doNotOverride(STATE.DO_NOT_OVERRIDE_NOT_STORE_INSTALL);
                }else if (defaultSearchOptionBean.get() !== "true"){
                    // user was not shown option
                    invokeEntryPoint(
                        "OptionsNotPresented",
                        {},
                        function(){
                            actions.doNotOverride(STATE.DO_NOT_OVERRIDE_NO_OPTION);
                        }
                    );
                }else if (defaultSearchBean.get() !== "true") {
                    // user opted out
                    invokeEntryPoint(
                        "UserOptedOut",
                        {},
                        function(){
                            actions.doNotOverride(STATE.DO_NOT_OVERRIDE_OPTED_OUT);
                        }
                    );
                }else{
                    // user opted in for search override
                    actions.overrideSearchAfterInstall();
                }

                break;
            case STATE.OVERRIDE_PENDING:
                actions.confirmOverride();
                break;
            }
            console.log('USP-BG: startStateMachine - leaving');
        },
        invokeEntryPoint = function(name, params, callback){
            if (!callback) callback = function(){};
            if (updateSearchEntryPoint){
                console.log('USP-BG: invokeEntryPoint(%s, %O, %O) - calling entryPoint', name, params, callback);
                updateSearchEntryPoint(name, params || {}, callback);
                updateSearchEntryPoint = null;
            }else{
                callback();
            }
        },
        actions = {
            // All state transitions occur here
            prepareToShowPrompt: function(){
                console.log('USP-BG: actions.prepareToShowPrompt()');
                if (actions._acquire()){
                    // state transitions now driven by user actions through fgListener
                    // two possible responses are YES_CMD and NO_CMD
                    fgOnReadyCmd = fgOnReadyShowPromptCmd;
                    displaySection = "SearchPrompt";
                    restartPromptSection = "RestartPrompt";
                    injectUI();
                    addListener();
                }else{
                    console.log("USP-BG: failed to acquire lock!");
                }
                console.log('USP-BG: actions.prepareToShowPrompt - leaving');
            },
            overrideSearchAfterPrompt: function(){
                console.log('USP-BG: actions.overrideSearchAfterPrompt()');
                fgOnReadyCmd = null;
                actions._overrideSearch();
                actions.showRestart();
                console.log('USP-BG: actions.overrideSearchAfterPrompt - leaving');
            },
            overrideSearchAfterInstall: function(){
                console.log('USP-BG: actions.overrideSearchAfterInstall()');
                actions._overrideSearch();
                if (searchStateBean.get() === STATE.OVERRIDE_PENDING){
                    console.log('USP-BG: actions.overrideSearchAfterInstall - override pending, updateSearchEntryPoint', updateSearchEntryPoint);
                    var callback = function(){
                            console.log('USP-BG: actions.overrideSearchAfterInstall - override pending - updateSearchEntryPoint called back');
                            // state transitions now driven by user actions through fgListener
                            // two possible responses are RESTART_AFTER_INSTALL_CMD and NOT_NOW_CMD
                            fgOnReadyCmd = fgOnReadyShowRestartAfterInstallCmd;
                            displaySection = "RestartPromptAfterInstall";
                            restartPromptSection = "RestartPromptAfterInstall";
                            injectUI();
                            addListener();
                            console.log('USP-BG: actions.overrideSearchAfterInstall - override pending - updateSearchEntryPoint called back finished');
                        };
                    invokeEntryPoint("PostOverrideSearch", {pending: true}, callback);
                }else{
                    console.log('USP-BG: actions.overrideSearchAfterInstall - override !pending');
                    invokeEntryPoint("PostOverrideSearch", {pending: false, state: searchStateBean.get()});
                    actions._release();
                    overrideComplete();
                    fgOnReadyCmd = null;
                }
                console.log('USP-BG: actions.overrideSearchAfterInstall - leaving');
            },
            confirmOverride: function(){
                console.log('USP-BG: actions.confirmOverride()');
                fgOnReadyCmd = null;
                actions._overrideSearch();
                if (searchStateBean.get() !== STATE.OVERRIDE_PENDING){
                    console.log('USP-BG: actions.confirmOverride - override !pending');
                    actions._release();
                    overrideComplete();
                }
                console.log('USP-BG: actions.confirmOverride - leaving');
            },
            doNotOverride: function(state){
                console.log('USP-BG: actions.doNotOverride(' + state + ')');
                fgOnReadyCmd = null;
                searchStateBean.set(state);
                sendRemovePrompts();
                actions._release();
                overrideComplete();
                console.log('USP-BG: actions.doNotOverride - leaving');
            },
            showRestart: function(){
                console.log('USP-BG: actions.showRestart()');
                if (searchStateBean.get() === STATE.OVERRIDE_PENDING){
                    console.log('USP-BG: actions.showRestart - override pending, so showing restart');
                    fgOnReadyCmd = fgOnReadyShowRestartCmd;
                    sendShowRestart();
                }else{
                    console.log('USP-BG: actions.showRestart - override !pending');
                    fgOnReadyCmd = null;
                    actions._release();
                    overrideComplete();
                }
                console.log('USP-BG: actions.showRestart - leaving');
            },
            restart: function(){
                console.log('USP-BG: actions.restart()');
                fgOnReadyCmd = null;
                sendShowRestarting();
                var results = actions._restart();
                switch(results){
                case updateSearch.ACTION_CODES.SUCCESS:
                    //haha, will not likely get a return, but might as well try
                    overrideComplete();
                    break;
                case updateSearch.ACTION_CODES.FAILED_RESTART:
                case updateSearch.ACTION_CODES.RETRY:
                case updateSearch.ACTION_CODES.UNRECOVERABLE:
                    sendShowUnableToRestart();
                    break;
                }
                console.log('USP-BG: actions.restart - leaving');
            },
            doNotRestart: function(){
                console.log('USP-BG: actions.doNotRestart()');
                fgOnReadyCmd = null;
                sendRemovePrompts();
                actions._release();
                overrideComplete();
                console.log('USP-BG: actions.doNotRestart - leaving');
            },
            closeUnableToRestartDialog: function(){
                console.log('USP-BG: actions.closeUnableToRestartDialog()');
                fgOnReadyCmd = null;
                sendRemovePrompts();
                actions._release();
                overrideComplete();
                console.log('USP-BG: actions.closeUnableToRestartDialog - leaving');
            },
            _overrideSearch: function(){
                console.log('USP-BG: actions._overrideSearch()');
                var updateSearchAction = plugin.overrideSearch();
                switch (updateSearchAction) {
                case updateSearch.ACTION_CODES.RETRY:
                    searchStateBean.set(STATE.OVERRIDE_PENDING);
                    break;
                case updateSearch.ACTION_CODES.SUCCESS:
                    searchStateBean.set(STATE.OVERRIDDEN);
                    break;
                case updateSearch.ACTION_CODES.UNRECOVERABLE:
                    searchStateBean.set(STATE.OVERRIDE_ERROR);
                    break;
                }
                console.log('USP-BG: actions._overrideSearch - action: %s, state: %s, leaving', updateSearchAction, searchStateBean.get());
            },
            _restart: function(){
                // here in case it is necessary to change state based on the return results from plugin
                console.log('USP-BG: actions._restart()');
                var restartAction = plugin.restart();
                console.log('USP-BG: actions._restart - action: %s, leaving', restartAction);
                return restartAction;
            },
            _acquire: function(){
                // here in case it is necessary to change state based on the return results from plugin
                console.log('USP-BG: actions._acquire()');
                var results = plugin.acquire();
                console.log('USP-BG: actions._acquire - results: %s, leaving', results);
                return results;
            },
            _release: function(){
                // here in case it is necessary to change state based on the return results from plugin
                // Should release when the override is no longer pending
                console.log('USP-BG: actions._release()');
                var results = plugin.release();
                console.log('USP-BG: actions._release - results: %s, leaving', results);
            }
        },
        fgListener = function(request, sender, sendResponse){
            console.log('USP-BG: fgListener(%s, %s, %s)', request, sender, 'sendResponse');

            switch (request.cmd){
            case FOREGROUND.READY_CMD:
                console.log('USP-BG: fgListener - foreground ready, cmd: %s', fgOnReadyCmd);
                if (fgOnReadyCmd){
                    var params = {
                        "cmd": fgOnReadyCmd,
                        "appIcon": getAppIcon(),
                        "appName": getAppName(),
                        "browserHomeUrlDesc": getBrowserHomeUrlDesc()
                    };
                    console.log('USP-BG: fgListener - sendResponse(%s)', JSON.stringify(params));
                    sendResponse(params);
                }
                break;
            case FOREGROUND.YES_CMD:
                logSearchPromptAcceptEvent();
                actions.overrideSearchAfterPrompt();
                break;
            case FOREGROUND.NO_CMD:
                logSearchPromptDeclineEvent();
                actions.doNotOverride(STATE.DO_NOT_OVERRIDE_OPTED_OUT);
                break;
            case FOREGROUND.RESTART_CMD:
                logRestartPromptAcceptEvent();
                actions.restart();
                break;
            case FOREGROUND.RESTART_AFTER_INSTALL_CMD:
                logRestartPromptAcceptEvent();
                actions.restart();
                break;
            case FOREGROUND.NOT_NOW_CMD:
                logRestartPromptDeclineEvent();
                actions.doNotRestart();
                break;
            case FOREGROUND.CLOSE_DIALOG_CMD:
                logCloseUnableToRestartDialogEvent();
                actions.doNotRestart();
                break;
            }
            console.log('USP-BG: fgListener - leaving');
        },
        sendShowRestart = function(){
            console.log('USP-BG: sendShowRestart()');
            logRestartPromptDisplayEvent();
            broadcast({
                "name": BACKGROUND.MSG_NAME,
                "cmd": BACKGROUND.SHOW_RESTART_CMD
            });
            console.log('USP-BG: sendShowRestart - leaving');
        },
        sendShowRestarting = function(){
            console.log('USP-BG: sendShowRestarting()');
            logRestartingDisplayEvent();
            broadcast({
                "name": BACKGROUND.MSG_NAME,
                "cmd": BACKGROUND.SHOW_RESTARTING_CMD
            });
            console.log('USP-BG: sendShowRestarting - leaving');
        },
        sendShowUnableToRestart = function(){
            console.log('USP-BG: sendShowUnableToRestart()');
            logUnableToRestartDisplayEvent();
            broadcast({
                "name": BACKGROUND.MSG_NAME,
                "cmd": BACKGROUND.SHOW_UNABLE_TO_RESTART_CMD
            });
            console.log('USP-BG: sendShowUnableToRestart - leaving');
        },
        sendRemovePrompts = function(){
            console.log('USP-BG: sendRemovePrompts()');
            broadcast({
                "name": BACKGROUND.MSG_NAME,
                "cmd": BACKGROUND.REMOVE_CMD
            });
            console.log('USP-BG: sendRemovePrompts - leaving');
        },
        overrideComplete = function(){
            // This will be invoked whether or not the user choose to override prompt
            console.log('USP-BG: overrideComplete()');
            Toolbar.showSuccessfulInstallationPage(true);
            sendRemovePrompts();
            cleanup();
            console.log('USP-BG: overrideComplete - leaving');
        },
        addListener = function(){
            console.log('USP-BG: addListener()');
            Messaging.addListener({
                "name" : FOREGROUND.MSG_NAME
            }, fgListener);
            console.log('USP-BG: addListener - leaving');
        },
		// iterator signature: function(tab, index, list)
		forEachTab = function(iterator) {
            if (!iterator) throw "Required parameter iterator missing!";

			chromeUtils.tabs.getAllInWindow({}, function(tabs) {
				_.forEach(tabs, iterator);
			});
		},
        broadcast = function(request, callback){
			callback = callback || function() {};

			forEachTab(function(tab /*, index, list */) {
				Messaging.send(request, callback, tab.id);
			});
        },
        injectModalUI = function() {
            if (!allDone){
                console.log('USP-BG: injectModalUI()');
                // Get Active Tab
                chromeUtils.tabs.getSelected({ windowType: 'normal' }, function(tab) {
                    // No need to filter because chromeUtils filters out inapplicable tab protocols
                    if (tab) {
                        renderTabUI(tab);
                    } else {
                        // Handle activated tabs
                        //noinspection JSUnresolvedVariable
                        chrome.tabs.onActivated.addListener(function(activeInfo) {
                            chrome.tabs.get(activeInfo.tabId, function(activeTab) {
                                console.log('USP-BG: injectModalUI - onActivated');
                                renderTabUI(activeTab);
                            });
                        });

                        // Handle loaded tabs
                        Messaging.addListener(
                            { "name": 'TAB_COMPLETE' },
                            function(message, sender /*, sendResponse*/) {
                                console.log('USP-BG: injectModalUI - TAB_COMPLETE');
                                renderTabUI(sender.tab);
                            }
                        );
                    }
                });

                console.log('USP-BG: injectModalUI - leaving');
            }
        },
        injectInfoBarUI = function(){
            throw "Unsupported operation!";
        },
        initialize = function(entryPoint){
            console.log('USP-BG: initialize(%O)', entryPoint);
            updateSearchEntryPoint = entryPoint;
            switch (userExperienceGlobalBean.get()){
            case USER_EXPERIENCE.MODAL:
                console.log('USP-BG: initialize - USER_EXPERIENCE.MODAL');
                fgOnReadyShowPromptCmd = BACKGROUND.SHOW_PROMPT_CMD;
                fgOnReadyShowRestartAfterInstallCmd = BACKGROUND.SHOW_RESTART_AFTER_INSTALL_CMD;
                fgOnReadyShowRestartCmd = null;
                contentScriptFilePath = "components/defaultSearch/foreground/defaultSearchModalInjector.js";
                // inject into active tab
                injectUI = injectModalUI;
                break;
            case USER_EXPERIENCE.INFO_BAR:
                console.log('USP-BG: initialize - USER_EXPERIENCE.INFO_BAR');
                fgOnReadyShowPromptCmd = BACKGROUND.SHOW_PROMPT_CMD;
                fgOnReadyShowRestartAfterInstallCmd = BACKGROUND.SHOW_RESTART_AFTER_INSTALL_CMD;
                fgOnReadyShowRestartCmd = BACKGROUND.SHOW_RESTART_CMD;
                contentScriptFilePath = "components/defaultSearch/foreground/defaultSearchInfoBarInjector.js";
                // inject into all pages
                injectUI = injectInfoBarUI;
                break;
            default:
                console.warn("Unexpected user experience type: " + userExperienceGlobalBean.get());
                break;
            }
            console.log('USP-BG: initialize - leaving');
        },
        cleanup = function(){
            allDone = true;
        },
        plugin = {
            overrideSearch: function(){
                console.log('USP-BG: plugin.overrideSearch()');
                var action = updateSearch.updateSearch();
                console.log('USP-BG: plugin.overrideSearch - leaving, returning: %s', action);
                return action;
            },
            restart: function(){
                console.log('USP-BG: plugin.restart()');
                var action = updateSearch.restart();
                console.log('USP-BG: plugin.restart - leaving, returning: %s', action);
                return action;
            },
            acquire: function(){
                console.log('USP-BG: plugin.acquire()');
                var results = updateSearch.acquire();
                console.log('USP-BG: plugin.acquire - leaving, returning: %s', results);
                return results;
            },
            release: function(){
                console.log('USP-BG: plugin.release()');
                var results = updateSearch.release();
                console.log('USP-BG: plugin.release - leaving, returning: %s', results);
                return results;
            }
        },
        logDisplayEvent = function(){
            logEvent(unifiedLogging.EVENTS.DIALOG_VIEW, displaySection);
        },
        logSearchPromptAcceptEvent = function(){
            logEvent(unifiedLogging.EVENTS.UICONTROL, "SearchPrompt", "button", "Yes");
        },
        logSearchPromptDeclineEvent = function(){
            logEvent(unifiedLogging.EVENTS.UICONTROL, "SearchPrompt", "button", "No");
        },
        logRestartPromptDisplayEvent = function(){
            logEvent(unifiedLogging.EVENTS.DIALOG_VIEW, restartPromptSection);
        },
        logRestartingDisplayEvent = function(){
            logEvent(unifiedLogging.EVENTS.DIALOG_VIEW, "RestartingDialog");
        },
        logUnableToRestartDisplayEvent = function(){
            logEvent(unifiedLogging.EVENTS.DIALOG_VIEW, "UnableToRestartDialog");
        },
        logRestartPromptAcceptEvent = function(){
            logEvent(unifiedLogging.EVENTS.UICONTROL, restartPromptSection, "button", "Restart");
        },
        logRestartPromptDeclineEvent = function(){
            logEvent(unifiedLogging.EVENTS.UICONTROL, restartPromptSection, "button", "Not Now");
        },
        logCloseUnableToRestartDialogEvent = function(){
            logEvent(unifiedLogging.EVENTS.UICONTROL, restartPromptSection, "button", "Close UnableToRestartDialog");
        },
        logEvent = function(type, section, uiType, controlID){
            var params = {
                "dialogType": userExperienceGlobalBean.get()
            };

            var properties = ['anxs', 'uitype', 'controlID'];
            for (var i = 1; i < arguments.length; ++i){
                params[properties[i-1]] = arguments[i];
            }

            unifiedLogging.logEvent(type, params);
            console.log("USP-BG: logEvent - type: %s, params: %s", type, JSON.stringify(params));
        };


    console.log('USP-BG: anon - leaving');
    return {
        FOREGROUND: FOREGROUND,
        BACKGROUND: BACKGROUND,
        execute: function(isNewInstall, updateSearchEntryPoint){
            console.log('USP-BG: execute(%s,%O)', isNewInstall, updateSearchEntryPoint);
            initialize(updateSearchEntryPoint);
            startStateMachine(isNewInstall);
            console.log('USP-BG: execute - leaving');
        }
    }
})();