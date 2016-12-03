/*
 Declaration dependencies:
 - 'persister': see FFPreferencesPersister.js or LocalStoragePersister.js
 - 'console': anything that implements the non-standard console API. See universalConsole.js
 - 'underscore': the underscore object as made available via underscorejs.org
 - 'unifiedLogger': see unifiedLogger.js

 Initialization dependencies:
 - 'activePingConfig': a structured object that contains the following:
 -- successInterval: time in ms between successful pings
 -- failInterval: time in ms to wait for next ping attempt after a failure
 -- appParams: an object containing the name/value pairs to send with each ping. values can be functions or strings

 Exports:
 - 'activePing': provides the services of a regular active ping
 -- stop: stops the generation of new active pings. use scheduleNextPing to restart
 -- scheduleNextPing(action): schedules the next ping. action can be missing, 'check', 'successful' or 'failed'
 -- sendPing: sends a ping
 -- toString: a string showing time till next ping
 */
Mindspark_Global.getValues('persister', 'console', 'unifiedLogger', 'underscore',
    function(persister, console, unifiedLogger, _){
        Mindspark_Global.setValue('activePing',
            (function(){
                function eventCallback(xhr){
                    scheduleNextPing(Math.floor(xhr.status/100) === 2 ? 'successful' : 'failed');
                }
                function sendPing(){
                    console.log('aP: sendPing() - getParams: %O', getParams());
                    unifiedLogger.logEvent('CAPNative', 'ToolbarActive', getParams(), null, eventCallback);
                }
                function getParams(){
                    var out = {};
                    _.each(appParams, function(value, key){
                        out[key] = typeof value === 'function' ? value() : value;
                    });
                    return out;
                }
                function scheduleNextPing(action){
                    console.log('aP: scheduleNextPing(%s)', action);
                    if (timeoutId){
                        window.clearInterval(timeoutId);
                        timeoutId = undefined;
                    }
                    var nextActivePing,
                        interval;
                    switch (action){
                    case 'failed':
                        interval = failInterval;
                        break;
                    case 'successful':
                        interval = successInterval;
                        persister.setValue(NEXT_ACTIVE_PING, Date.now() + successInterval);
                        break;
                    default:
                    case 'check':
                        nextActivePing = persister.getValue(NEXT_ACTIVE_PING) || 0;
                        interval = nextActivePing - Date.now();
                        break;
                    }
                    interval = Math.max(interval, 1000);
                    console.log('aP: scheduleNextPing - action: %s, interval: %s', action, interval);
                    timeoutId = window.setTimeout(sendPing, interval);
                }
                function initialize(config){
                    successInterval = config.successInterval || successInterval;
                    failInterval = config.failInterval || failInterval;
                    appParams = config.appParams || {};
                    scheduleNextPing('check');
                }
                function stop(){
                    if (timeoutId){
                        window.clearTimeout(timeoutId);
                        timeoutId = undefined;
                    }
                }
                function toString(){
                    var next = Math.max((persister.getValue(NEXT_ACTIVE_PING) || 0) - Date.now(), 0),
                        ms = next % 1000,
                        remainingSecs = (next - ms) / 1000,
                        secs = remainingSecs % 60,
                        remainingMins = (remainingSecs - secs) / 60,
                        mins = remainingMins % 60,
                        remainingHrs = (remainingMins - mins) / 60,
                        nextStr = remainingHrs + 'h' + mins + 'm' + secs + 's';

                    return ["ActivePing{",
                        "next:", nextStr, ',',
                        "params:", getParams(), '}'
                    ].join('');
                }

                var NEXT_ACTIVE_PING = 'nextActivePing',
                    SEC = 1000,
                    MIN = 60*SEC,
                    HR = 60*MIN,
                    timeoutId,
                    successInterval = 6*HR,
                    failInterval = 10*MIN,
                    appParams = {},
                    that = {
                        stop: stop,
                        scheduleNextPing: scheduleNextPing,
                        sendPing: sendPing,
                        toString: toString
                    };

                Mindspark_Global.getValues('activePingConfig', initialize);
                return that;
            })()
        );
    }
);

/*
Mindspark_Global.getValues('toolbarData',
    function activePingConfig(toolbarData){
        Mindspark_Global.setValue('activePingConfig', (function(){
            var SEC = 1000,
                MIN = 60*SEC,
                HR = 60*MIN,
                toolbarConfig = window.config || window.Mindspark_config,
                platform = !!window.Mindspark_config ? 'Firefox' : (window.chrome && window.chrome.runtime ? 'Chrome' : 'Other'),
                appParams = {
                    anxv: toolbarConfig.version,
                    anxd: toolbarConfig.buildDate
                },
                apConfig = {
                    successInterval: 1*MIN,
                    failInterval: 5*SEC,
                    appParams: appParams
                };

            switch (platform){
            case 'Firefox':
                _.extend(appParams, {
                    f: '00500000',
                    homePageEnabled: Mindspark_.browser.isHomePageEnabled(),
                    tabEnabled: Mindspark_.options.isTabEnabled(),
                    keywordEnabled: Mindspark_.options.isKeywordEnabled(),
                    defaultSearch: Mindspark_.browser.isDefaultSearch(),
                    buttonIds: JSON.stringify(Mindspark_.getButtonIds()),
                    coId: Mindspark_.installation.coId || '',
                    userSegment: Mindspark_.installation.userSegment || ''
                });
                break;
            case 'Chrome':
                _.extend(appParams, {
                    f: '00400000',
                    defaultSearchState: Global.retrieve('defaultSearchState'),
                    isStore: Common.isChromeStore,
                    tabEnabled: Global.retrieve('disableTabTakeover') === 'false',
                    coId: Global.retrieve('coId') || '',
                    userSegment: Global.retrieve('userSegment') || ''
                });
                break;
            case 'Other':
                _.extend(appParams, {
                    f: '00600000' //TODO get right flag
                });
                break;
            }
            return apConfig;
        })());
    }
);
*/