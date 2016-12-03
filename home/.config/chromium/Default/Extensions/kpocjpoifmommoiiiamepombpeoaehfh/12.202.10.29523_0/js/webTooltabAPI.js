/**
 * Created by souleymane.toure on 11/12/2015.
 */


var WebTooltabAPI = (function () {
    'use strict';
    /**
     * Tells wether a given object is an Array
     * @param obj
     * @returns {boolean}
     */
    function isArray(obj) {
        return 'array' === Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
    }

    /**
     *  Expected message format
     *  {
     *      destination: String (Required) Target extension identifying token
     *      sender: String (Optional) A string used by the call to identify the response message
     *      cmd:    String (Required) Name of the API method to call
     *      args:   Array[Any Object] (Optional) Arguments to be passed the underlying handler
     *  }
     *
     *  Response message format
     *  {
     *      destination: String sender from received message
     *      data:        Array[Any Object] Output from call to the underlying API method
     *      error:       Possible error from executing the request
     *  }
     */


    var extensionInfo,
        UL = {
            CEDisable: {
                log: function (state, message) {
                    UL.logEvent('CEDisable', {
                        state: state,
                        message: message
                    });
                }
            },
            CEUninstall: {
                log: function (state, message) {
                    UL.logEvent('CEUninstall', {
                        state: state,
                        message: message
                    });
                }
            },
            logEvent: function (name, params) {
                try {
                    Mindspark_.shared.unifiedLogging.logCapNativeEvent(name, params);
                } catch (ex) {
                    console.log('WTT: UL error ', ex);
                }
            }
        },
        commands = {
            /**
             * Disables the extension
             * @param callback function
             */
            disable: function (options, callback) {
                UL.CEDisable.log('initiated');
                popDisableSurvey();
                // Allow some time from the UL to complete
                setTimeout(function () {
                    try {
                        chrome.management.setEnabled(extensionInfo.id, false, function () {
                            var error = chrome.runtime.lastError;
                            // The caller may not be there to receive this message
                            chrome.management.getSelf(function (info) {
                                error || (error = chrome.runtime.lastError);
                                !callback || callback.call(null, {success: !(info && info.enabled)}, error);
                            });
                        });
                    } catch (ex) {
                        UL.CEDisable.log('exception', ex.message);
                    }
                }, 50);

            },
            uninstall: function (options, callback) {
                UL.CEUninstall.log('initiated');
                // Allow some time from the UL to complete
                setTimeout(function () {
                    try {
                        chrome.management.uninstallSelf({showConfirmDialog: options.showConfirmDialog === true}, function () {
                            var error = chrome.runtime.lastError;
                            // The caller may not be there to receive this message
                            chrome.management.getSelf(function (info) {
                                error || (error = chrome.runtime.lastError);
                                // if we got this far, the operation failed or was canceled by the user.
                                !callback || callback.call(null, {success: !(info && info.enabled)}, error);
                            });
                        });
                    } catch (ex) {
                        UL.CEUninstall.log('exception', ex.message);
                    }
                }, 50);

            }
        },
        CSWCommands = {
            detectExe: function (options, callback) {
                try {
                    var params = [config].concat(options.uri.split('/')),
                        info = findExecutableInfo.apply(null, params);
                    if (info) {
                        sendDetectExe(info, function (response) {
                            handleCSWResponse(response, params, callback);
                        });
                    } else {
                        !callback || callback.call(null, {success: false}, {
                            message: '"%s" not found'.replace('%s', options.uri)
                        });
                    }
                } catch (e) {
                    !callback || callback.call(null, {success: false}, {error: e});
                }
            },

            launchExe: function (options, callback) {
                try {
                    var params = [config].concat(options.uri.split('/')),
                        info = findExecutableInfo.apply(null, params);
                    if (info) {
                        info.commandLine = options.params;
                        sendLaunchExe(info, function (response) {
                            handleCSWResponse(response, params, callback);
                        });
                    } else {
                        !callback || callback.call(null, {success: false}, {
                            message: '"%s" not found'.replace('%s', JSON.stringify(options.uri))
                        });
                    }
                } catch (e) {
                    !callback || callback.call(null, {success: false}, {error: e});
                }
            }
        },
        find = Array.prototype.find || function (callback, thisArg) {
            for (var i = 0; i < this.length; i++) {
                if (callback.call(thisArg || null, this[i], i, this)) {
                    return this[i];
                }
            }
            return undefined;
        };

    function getDisableSurveyUrl() {
        var url = Global.getUninstallSurveyUrl(),
            showOnDisable;
        if (!url) {
            return null;
        }
        url = Mindspark_HttpURL(paramReplacer.replaceParams(url));
        showOnDisable = url.getParam('showOnDisable');
        if (showOnDisable !== 'true') {
            return null;
        }
        url.setParam('reason', 'disable');
        return url.toString();
    }

    function popDisableSurvey() {
        var disableSurveyUrl = getDisableSurveyUrl();
        if (disableSurveyUrl) {
            chrome.tabs.create({url: disableSurveyUrl});
        }
    }

    function handleCSWResponse(response, params, callback) {
        var error;
        if (response.error) {
            error = {message: response.error, installURL: findInstallURLFromConfig.apply(null, params)};
        }
        !callback || callback.call(null, response, error);
    }

    function findInstallURLFromConfig(config, id, name) {
        if (config.executablePackages) {
            var pkg = find.call(config.executablePackages, function (pkg) {
                return pkg.name == name;
            });

            if (pkg) {
                var bitness = window.navigator.appVersion.indexOf('WOW64') > -1 ? 64 : 32,
                    installURL = (pkg['configuration' + bitness + 'Bit'] || {}).installerUri;
                console.log(Global);
                return CompanionSWUtils.getDynamicInstallerUri(installURL);
            }
        }
        return '';
    }

    function findExecutableInfo(config, id, name, key) {
        var widget = find.call(config.widgets, function (widget) {
            return widget.id === id
        });

        if (widget && widget.executables && widget.executables[key]) {
            var data = widget.executables[key];
            return {template: key, url: widget.basepath + 'manifest.json', data: data};
        }
    }

    function sendDetectExe(params, callback) {
        Mindspark_nativeMessagingDispatcher.sendDetectExe(params, callback);
    }

    function sendLaunchExe(params, callback) {
        Mindspark_nativeMessagingDispatcher.sendLaunchExe(params, callback);
    }

    function sendGetVersion(callback) {
        Mindspark_nativeMessagingDispatcher.getVersion(callback);
    }

    /**
     * Handles messages from web tooltab page
     * @param data {*} postMessage data
     * @param target window
     * @param origin url
     */
    function handleMessage(data, target, origin) {
        var message = JSON.parse(data);
        if (message.destination === extensionInfo.id) {
            var handler = resolveMethod(commands, message.cmd);
                if (handler) {
                    var args = isArray(message.args) ? message.args : [];
                    args.push(function (response, error) {
                        if (message.sender) {
                            target.postMessage(JSON.stringify({
                                destination: message.sender,
                                url: origin,
                                info: extensionInfo,
                                data: response,
                                error: error
                            }), origin);
                        }
                    });

                    handler.apply(commands, args);
            } else if (message.sender) {
                target.postMessage(JSON.stringify({
                    destination: message.sender,
                    url: origin,
                    info: extensionInfo,
                    error: {message: 'Invalid command "' + message.cmd + '"'}
                }), origin);
            }
        }
    }

    function isFunction(obj) {
        return Object.prototype.toString.call(obj).slice(8, -1) === 'Function';
    }

    function resolveMethod(object, namespace) {
        if (!isArray(namespace)) {
            namespace = String(namespace).split('.');
        }
        if (!object) {
            return undefined;
        }
        var key = namespace.shift(),
            current = object[key];
        if (!current) {
            return undefined;
        }
        if (!namespace.length) {
            return isFunction(current) ? current : undefined;
        }
        return resolveMethod(current, namespace);
    }

    function getFeatures() {
        var featuresList = [];
        function namespace(obj, prefix) {
            if (isFunction(obj)) {
                featuresList.push(prefix);
            } else {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        namespace(obj[key], (prefix ? prefix + '.' + key : key));
                    }
                }
            }
        }
        namespace(commands);
        return featuresList;
    }

    function setupCommands() {
        if (config.executablePackages && config.executablePackages.length) {
            commands['CSW'] = CSWCommands;
        }
    }

    return {
        /**
         * @param info extension info from "chrome.management.getSelf"
         * @param target window
         * @param url
         */
        init: function (info, target, url) {
            extensionInfo = info;
            setupCommands();
            target.postMessage(JSON.stringify({
                info: extensionInfo,
                url: url,
                features: getFeatures(config),
                messagingApiV2: true
            }), url);

            window.addEventListener('message', function (e) {
                try {
                    handleMessage(e.data, e.source, url);
                } catch (ex) {
                    console.log('WTT: error ', ex);
                }
            }, true);
        }
    }
})();