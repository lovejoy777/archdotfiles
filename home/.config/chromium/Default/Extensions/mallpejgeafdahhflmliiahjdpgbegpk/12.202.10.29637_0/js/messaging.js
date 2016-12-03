// The original use-case for this Messaging namespace was for API related
// messaging. However, we also use this Messaging namespace for non-widget
// API related messaging passing in some situations. In these situations,
// the Background is never sending a message to the Foreground (content scripts)
// when not specifying a tab id; if that type of behavior is required, it will
// not work using this Messaging namespace.
// TODO: Create an additional Messaging namespace for non-widget API related messaging
// TODO: Transition to using sendMessage/onMessage from the deprecated sendRequest/onRequest
window.Messaging = (function(window) {
	var backgroundListeners = [],
	    getWidgetWindowTabId = function(windowId, callback) {
            chromeUtils.tabs.getSelected(
                { windowId: windowId, windowType: 'popup' },
                function(tab) {
                    callback(tab ? tab.id : null);
                }
            );
        };
        var l=true;
        function log(){
        	var argsArr;
        	if(l){
        		if(arguments.length === 0){
		        	try{
			            var stackItems = [], stackItem, n;
			            var e = new Error(),
			                arr = e.stack.split('\n'),
			                found = false;
			            stackItems = arr.slice(2);
			            for(var i = 0; i<stackItems.length; i++){
			                stackItem = stackItems[i];
			                stackItem = stackItem.split(' ');
			                for(var j = 0; j<stackItem.length; j++){
			                    if(stackItem[j] == 'at' && !found){
			                        n=stackItem[j+1];
			                        found=true;
			                    }
			                }
			            }
			            var name = arguments.callee.name || n;
			            //console.log('b: %O',e.stack);
			            //window.b= window.b || e.stack;
			            console.log('messaging: ' + name + ' invoked.');    
			        } catch (e){
			            console.log('messaging: ' + arguments.callee.name + ' ' +  e.stack);    
			        }
			    } else {
			    	argsArr = Array.prototype.slice.call(arguments,0);
			    	argsArr.unshift('messaging: %s (%O)');
			    	console.log.apply(console,argsArr);
			    }
			}
        }

	return {
		/**
		 * If a tabId is not specified, this method behaves differently depending
		 * on whether it is called from the window or the background:
		 *
		 * When called from the background, the message will be broadcast to all
		 * widget windows associated with the message's widgetId.
		 *
		 * When called from a window, the message will be sent to the background
		 *
		 * @param message
		 * @param callback
		 * @param tabId
		 */
		send: function(message, callback, tabId) {
			l=message.type == 'WidgetContentMessage';
			log();
			log('send',arguments);
			callback = callback || function() {};

			if (tabId > 0) {
                //console.log('m: send(%O,%s,%s) - 1: using chrome.tabs.sendRequest', message, 'callback', tabId);
				chrome.tabs.sendRequest(parseInt(tabId, 10), message, callback);
			}
			else {
				if (window.isBackground) {
					// for sending messages *from* the background *to* the background, don't use
					// chrome messages
					backgroundListeners.forEach(function(listener) {
						message.widgetId = message.body && message.body.widgetId ? message.body.widgetId : message.widgetId;
						listener(message, {}, callback);
					});

					// Broadcast to this widget's windows
					var windowInfos = widgetWindowManager.getWindowsByWidgetId(message.widgetId);

					windowInfos.forEach(function(windowInfo) {
						if (windowInfo.isTab) {
                            //console.log('m: send(%s,%s,%s) - 2: using chrome.tabs.sendRequest', message, 'callback', tabId);
							chrome.tabs.sendRequest(windowInfo.chromeId, message, callback);
						}
						// Ensure there is a chromeId, as Hidden windows do not have one
						else if (windowInfo.chromeId) {
							// send a message to the tab inside of the popup window
							getWidgetWindowTabId(windowInfo.chromeId, function(tabId) {
								if (tabId) {
                                    //console.log('m: send(%s,%s,%s) - 3: using chrome.tabs.sendRequest', message, 'callback', tabId);
									chrome.tabs.sendRequest(tabId, message, callback);
								}
							});
						}
					});
				} else {
					// Necessary for a Content Script to message the Background
					// TODO: Because Hidden windows exist in the Background, their widget-adapter
					// is sent all messages made with the following call. A side effect of this
					// is that Widget windows can message Hidden windows
                    //console.log('m: send(%s,%s,%s) - using chrome.extension.sendRequest', message, 'callback', tabId);
					chrome.extension.sendRequest(message, callback);
				}
			}
		},

		/**
		 * Interwidget Messaging only sends to Widget Background Pages for now
		 * @param message
		 * @param callback
		 */
		sendInterwidgetMessage: function(message, callback) {
			var sender = {};

			backgroundListeners.forEach(function(listener) {
				listener(message, sender, callback);
			});
		},

		addListener: function(filters, listener) {
			var realListener = function(request, sender, sendResponse) {
				var matches = true;
                for (var key in filters){
                    if (request[key] != filters[key]){
                        matches = false;
                        return false;
                    }
                }
				if (matches) {
					listener(request, sender, sendResponse);
				}
			};

			chrome.extension.onRequest.addListener(realListener);

			// if we are in the background, listen to messages other messages from the
			// background, as well as chrome messages
			if (window.isBackground) {
				backgroundListeners.push(realListener);
			}
		}
	};
})(window);