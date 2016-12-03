/**
 * Extension implementation of WidgetContextFactory
 * Implementation note: this uses chrome.extension API for sending messages
 * and contains port of the API for Safari
 */
var WidgetContextFactory = {
    getWidgetContext: function (callback, who) {
        // helper functions
        function isNull (v) {
            return typeof(v) === 'undefined' || v === null;
        }
        function checkNull (v, msg) {
            if (isNull(v)) {
                throw msg;
            }
        }
        function defaultVal (v, defaultValue) {
            if (isNull(v)) {
                return isNull(defaultValue) ? null : defaultValue;
            }
            return v;
        }

        checkNull(callback, 'Missing callback');

        // WidgetContext constructor
        var WidgetContext = function () {
            this.name = window.location.search.substr(1);

            this.navigate = function (url, dest) {
                checkNull(url, 'Missing URL');
                dest = defaultVal(dest, 'currentTab');
                chrome.extension.sendRequest({name: this.name, cmd: 'navigate', url: url, dest: dest});
            };

            this.getConfig = function (params, callback, who) {
                checkNull(callback, 'Missing callback');
                chrome.extension.sendRequest({name: this.name, cmd: 'config'}, function(backEndConfig) {
                    var config = [];
                    if (typeof(params) == "string") params = [params];
                    for (var i=0; i < params.length; i++) {
                        var key = params[i];
                        config[key] = backEndConfig[key];
                    }
                    callback.call(defaultVal(who), config);
                });
            };

            this.getStaticData = function(callback, who) {
                checkNull(callback, 'Missing callback');
                chrome.extension.sendRequest({name: this.name, cmd: 'staticData'}, function(data) {
                    callback.call(defaultVal(who), data);
                });
            };

            this.getResource = function (params, who) {
                checkNull(params.url, 'Missing url');
                checkNull(params.success, 'Missing success');
                checkNull(params.error, 'Missing error');
                var format = defaultVal(params.format, "text");
                chrome.extension.sendRequest({name: this.name, cmd: 'feed', url: params.url}, function(response) {
                    if (response.success) {
                        var data = response.text;
                        if (format == "xml") {
                            data = new DOMParser().parseFromString(data, "text/xml")
                        } else if (format == "json") {
                            data = JSON.parse(data);
                        }
                        params.success.apply(defaultVal(who), [{data: data}]);
                    } else {
                        params.error.apply(defaultVal(who), [response.text]);
                    }
                });
            };

            this.store = function (key, value) {
                chrome.extension.sendRequest({name: this.name, cmd: 'store', key: key, value: value});
            };

            this.retrieve = function (keys, callback, who) {
                checkNull(keys, 'Missing keys');
                checkNull(callback, 'Missing callback');
                if (typeof(keys) == "string") keys = [keys];
                chrome.extension.sendRequest({name: this.name, cmd: 'retrieve', keys: keys}, function(values) {
                    callback.call(defaultVal(who), values);
                });
            };

            this.sendMessage = function (type, body, callback, who) {
                var request = body;
                request.name = this.name;
                request.cmd = type;
                chrome.extension.sendRequest(request, function(response) {
                    if (!isNull(callback)) {
                        callback.call(defaultVal(who), response);
                    }
                });
            };

            this.getSupportedMessageTypes = function (callback, who) {
                checkNull(callback, 'Missing callback');
                chrome.extension.sendRequest({name: this.name, cmd: 'getSupportedMessageTypes'}, function(types) {
                    callback.call(defaultVal(who), types);
                });
            };

            this.setSize = function (width, height) {
                chrome.extension.sendRequest({name: this.name, cmd: 'resize', size: {width: width, height: height}});
            };

            this.close = function () {
                chrome.extension.sendRequest({name: this.name, cmd: 'close'});
            };

            this.handleError = function (error) {
                console.log(error);
            };

            this.getVersion = function () {
                return '1.0';
            };
        };
        callback.call(defaultVal(who), new WidgetContext());
    }
};

// for external urls, define chrome.extension.sendRequest method
// that uses DOM events to talk to content script
if (window.location.protocol.indexOf('http') == 0) {
    if (!window.chrome) {
        window.chrome = {};
    }
    chrome.extension = {
        lastId: 0,
        callbacks: {},

        sendRequest: function(message, callback) {
            // save callback with an id for reference
            var id = '' + chrome.extension.lastId++;
            chrome.extension.callbacks[id] = callback;

            // add the message to a hidden div
            var messageHolder = document.getElementById('extension-message-holder');
            if (!messageHolder) {
                messageHolder = document.createElement("div");
                messageHolder.setAttribute("id", "extension-message-holder");
                messageHolder.setAttribute("style", "display:none");
                document.documentElement.appendChild(messageHolder);
            }
            var messageWrapper = {id: id, message: message};
            messageHolder.innerText = JSON.stringify(messageWrapper);

            // publish DOM event
            var event = document.createEvent('Event');
            event.initEvent('extensionMessageEvent', true, true);
            event.timeStamp = 42;
//            console.log("sending message via DOM event: " + JSON.stringify(message));
            document.dispatchEvent(event);
        }
    };

    // register listener for response
    var responseHolder = document.createElement("div");
    responseHolder.setAttribute("id", "extension-response-holder");
    responseHolder.setAttribute("style", "display:none");
    responseHolder.addEventListener('extensionResponseEvent', function(event) {
        var responseWrapper = JSON.parse(responseHolder.innerText);
        var callback = chrome.extension.callbacks[responseWrapper.id];
//        console.log("callback " + responseWrapper.id + ": " + callback);
        if (callback) {
            chrome.extension.callbacks[responseWrapper.id] = null;
            callback(responseWrapper.response);
        }
    });
    document.documentElement.appendChild(responseHolder);
//    console.log("defined chrome.extension.sendRequest");
}

// Support limited chrome.extension API for message passing
// For pages that are loaded outside of extensions

// Stripped-down version of Chrome to Safari port
// Author: Michael Gundlach (gundlach@gmail.com)
// License: GPLv3 as part of adblockforchrome.googlecode.com
//          or MIT if GPLv3 conflicts with your code's license.
//
// Porting library to make Chrome extensions work in Safari.
// To use: Add as the first script loaded in your Options page,
// your background page, your Chrome manifest.json, and your
// Safari Info.plist (created by the Extensions Builder).
//
// Then you can use chrome.* APIs as usual, and check the isSafari
// global boolean variable to see if you're in Safari or Chrome
// for doing browser-specific stuff.  The safari.* APIs will
// still be available in Safari, and the chrome.* APIs will be
// unchanged in Chrome.

// this expression is true only if in safari extension (not publis web page in safari browser)
if (typeof isSafari == "undefined") {
(function() {
    
    // True in Safari, false in Chrome.
    isSafari = (typeof safari !== "undefined");

    if (isSafari) {
      addListener = function(handler) {
        var x = safari.self;
        if (!x.addEventListener)
          x = safari.application;
        x.addEventListener("message", handler, false);
      };

      // Replace the 'chrome' object with a Safari adapter.
      chrome = {
        // Track tabs that make requests to the global page, assigning them
        // IDs so we can recognize them later.
        __getTabId: (function() {
          // Tab objects are destroyed when no one has a reference to them,
          // so we keep a list of them, lest our IDs get lost.
          var tabs = [];
          var lastAssignedTabId = 0;
          var theFunction = function(tab) {
            // Clean up closed tabs, to avoid memory bloat.
            tabs = tabs.filter(function(t) { return t.browserWindow != null; });

            if (tab.id == undefined) {
              // New tab
              tab.id = lastAssignedTabId + 1;
              lastAssignedTabId = tab.id;
              tabs.push(tab); // save so it isn't garbage collected, losing our ID.
            }
            return tab.id;
          };
          return theFunction;
        })(),

        extension: {
          getBackgroundPage: function() {
            return safari.extension.globalPage.contentWindow;
          },

          getURL: function(path) {
            return safari.extension.baseURI + path;
          },

          sendRequest: (function() {
            // The function we'll return at the end of all this
            function theFunction(data, callback) {
              var callbackToken = "callback" + Math.random();

              // Listen for a response for our specific request token.
              addOneTimeResponseListener(callbackToken, callback);

              var x = safari.self.tab || safari.application.activeBrowserWindow.activeTab.page;
              x.dispatchMessage("request", {
                data: data,
                callbackToken: callbackToken
              });
            }

            // Make a listener that, when it hears sendResponse for the given
            // callbackToken, calls callback(resultData) and deregisters the
            // listener.
            function addOneTimeResponseListener(callbackToken, callback) {

              var responseHandler = function(messageEvent) {
                if (messageEvent.name != "response")
                  return;
                if (messageEvent.message.callbackToken != callbackToken)
                  return;

                callback(messageEvent.message.data);
                // Change to calling in 0-ms setTimeout, as Safari team thinks
                // this will work around their crashing until they can release
                // a fix.
                // safari.self.removeEventListener("message", responseHandler, false);
                window.setTimeout(function() {
                  safari.self.removeEventListener("message", responseHandler, false);
                }, 0);
              };

              addListener(responseHandler);
            }

            return theFunction;
          })(),

          onRequest: {
            addListener: function(handler) {
              addListener(function(messageEvent) {
                // Only listen for "sendRequest" messages
                if (messageEvent.name != "request")
                  return;

                var request = messageEvent.message.data;
                var id = chrome.__getTabId(messageEvent.target);
                var sender = { tab: { id: id, url: messageEvent.target.url } };
                var sendResponse = function(dataToSend) {
                  var responseMessage = { callbackToken: messageEvent.message.callbackToken, data: dataToSend };
                  messageEvent.target.page.dispatchMessage("response", responseMessage);
                };
                handler(request, sender, sendResponse);
              });
            }
          }
        }
      };
    }
})(); } // end if (typeof isSafari == "undefined") { (function() {