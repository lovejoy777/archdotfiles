/**
 * Created by steven.harris on 5/7/2015.
 */

/*
 Definition Dependencies:
 'console': anything that implements the non-standard console API. See universalConsole.js
 'underscore': the underscore object as made available via underscorejs.org
 'HttpURL': see HttpURL.js

 Initialization Dependencies:
 'toolbarData': structured object as passed from dlp to the toolbar
 'UL.eventURL': the URL to which the unified logger should send events

 Exports:
 'unifiedLogger': this object, with the following entry points:
 - logEvent(appName, evtType, appParams, postBody): ...
 - addApplication(appName, array of events, array of required keys): ...
 - Invoking this method extends this object by adding the following additional entry points:
 - log<appName>(evtType, appParams, postBody): ...
 - log<event[i]>(appParams, postBody): ...

 */
Mindspark_Global.getValues('console', 'underscore', 'HttpURL', 'httpTransport',
    function UnifiedLogger(console, _, HttpURL, httpTransport){
        "use strict";

        Mindspark_Global.setValue('unifiedLogger',
            (function UnifiedLoggerConstructor(){
                function queueEvent(appName, evtType, appParams, postBody, callback){
                    //console.log('uL: queue(%O)', arguments);
                    queuedEvents.push(Array.prototype.slice.call(arguments, 0));
                }
                function dequeueEvents(){
                    var events;
                    that.logEvent = logEvent;
                    events = queuedEvents;
                    queuedEvents = [];
                    _.each(events, function(item){
                        logEvent.apply(this, item);
                    });
                }
                function randomInteger(){
                    return Math.floor(Math.random() * MAX_INT);
                }
                function getCommonData(appName){
                    var appInfo = applications[appName] || {};
                    if (!appInfo.data){
                        appInfo.data = {};
                        _.each(appInfo.keys, function(key){
                            appInfo.data[key] = commonData[paramMap[key]];
                        });
                    }
                    return appInfo.data;
                }
                function addApplication(appName, events, requiredKeys){
                    applications[appName] = {
                        name: appName,
                        keys: requiredKeys,
                        events: events
                    };

                    that['log' + appName] = function(evtType, appParams, postBody, callback){
                        [].splice.call(arguments, 0, 0, appName); // insert appName at index 0
                        that.logEvent.apply(this, arguments);
                    };
                    _.each(events, function(evtType){
                        that['log' + evtType] = function(appParams, postBody, callback){
                            [].splice.call(arguments, 0, 0, appName, evtType); // insert appName, evtType at index 0
                            that.logEvent.apply(this, arguments);
                        }
                    });
                }
                function logEvent(appName, evtType, appParams, postBody, callback){
                    console.log('uL: logEvent(%O)', arguments);
                    var eventData = {
                            'anxa': appName,
                            'anxe': evtType,
                            'anxr': randomInteger()
                        },
                        requestUrl = new HttpURL(eventURL);

                    _.extend(eventData, getCommonData(appName), appParams);
                    requestUrl.setParamsFromObject(eventData);
                    requestUrl = requestUrl.toString();
                    console.log('uL: %s', requestUrl);
                    if (postBody){
                        httpTransport.post(requestUrl, postBody, callback);
                    }else{
                        httpTransport.get(requestUrl, callback);
                    }
                }
                function addCommonData(data){
                    _.extend(commonData, data);
                }

                var MAX_INT = Math.pow(2,31),
                    consoleOnly = false,
                    queuedEvents = [],
                    eventURL,
                    commonData = {},
                    paramMap = {
                        anxt: 'toolbarId',
                        anxtv: 'toolbarVersion',
                        anxp: 'partnerId',
                        anxsi: 'partnerSubId',
                        anxv: 'toolbarVersion'
                    },
                    applications = {},
                    that = {
                        logEvent: queueEvent,
                        addApplication: addApplication
                    };

                addApplication('CAPNative',
                    ['FFUninstallDialog', 'QueryAssist', 'DNSSearch', 'GenericError', 'GenericWarn','GenericInfo', 'SSLocaleChanged'],
                    ['anxt', 'anxtv', 'anxp', 'anxsi', 'anxd']
                );

                Mindspark_Global.getValues('toolbarData', 'installationInfo', 'UL.eventURL',
                    function UnifiedLoggerConstructorInit(toolbarData, installationInfo, _eventURL){

                        addCommonData(toolbarData);
                        addCommonData(installationInfo);
                        eventURL = _eventURL;

                        dequeueEvents();
                    }
                );

                return that;
            })()
        );
    }
);
