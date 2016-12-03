var widgetWindowManager = (function() {
    // private
	// TODO: Use an Object literal, which will cleanup the namespace concept
    var windows = [],
        nextId = 1,
	    browserId = "bid" + (new Date()).getTime(),
        isNotNull = function(v){return typeof(v) !== 'undefined' && v !== null;};

    // public API
    return {
		addWindow: function(windowInfo) {
            windowInfo.id = nextId;

			if (windowInfo.window) {
				// Store the id on the window Object itself
				windowInfo.window.Mindspark_windowId = nextId;
			}

            windows[nextId] = windowInfo;

            return nextId++;
        },

        removeWindow: function(windowInfo) {
			if (windowInfo) {
				try {
					var deleted = delete windows[windowInfo.id],
						tab = null;

					// Non-dialogs get a null value for the tab property
					if (windowInfo.isTab) {
						tab = {
							id: windowInfo.chromeId * 1 // coerce the tabId to a number
						};
					}

					Messaging.send({
						type: "WindowClosed",
						widgetId: windowInfo.widgetId,
						body: {
							windowId: windowInfo.id
						}
					});

					Messaging.sendInterwidgetMessage({
						type: "WindowClosed",
						widgetId: windowInfo.widgetId,
						body: {
							widget: {
								id: windowInfo.widgetId
							},
							tab: tab,
							window: {
								id: windowInfo.id
							}
						},
						recipient: "interwidget",
						interwidget: true
					});

					return deleted;
				} catch(e) {
					// Nothing
				}
			}

			return false;
        },

        getWindow: function(id) {
            return windows[id];
        },

		getWindowByNamespaceId: function(namespaceId) {
			var windowInfo;

			for (var i = 0; i < windows.length; i += 1) {
				windowInfo = windows[i];

				if (isNotNull(windowInfo) && windowInfo.namespaceId === namespaceId) {
					return windowInfo;
				}
			}

			return false;
		},

		// TODO: Update to return an array of windowInfos, since tabs
		// can have multiple widget windows associated with it
		getWindowByChromeId: function(id) {
			var windowInfo;

			for (var i = 0; i < windows.length; i += 1) {
				windowInfo = windows[i];

				if (isNotNull(windowInfo) && windowInfo.chromeId === id) {
					return windowInfo;
				}
			}

			return false;
		},

		getWindowByFrameId: function(frameId) {
			var windowInfo;

			for (var i = 0; i < windows.length; i += 1) {
				windowInfo = windows[i];

				if (isNotNull(windowInfo) && windowInfo.frameId === frameId) {
					return windowInfo;
				}
			}

			return false;
		},

        getWindowByTab: function(tab) {
            // Is this a popup?
            var widgetWindow = this.getWindowByChromeId(tab.windowId);

            // Is this widget dependent on a tab?
            if (!widgetWindow) {
                widgetWindow = this.getWindowByChromeId(tab.id);
            }
            return widgetWindow;
        },

        getWindowsByWidgetId: function(widgetId) {
            // the namespaceId is currently a string separated by underscores
            // the second token of the string is the widget ID.
            var windowInfos = [],
                windowInfo,
                widgetIdStartIndex;

            for (var i = 1; i < windows.length; i += 1) {
                windowInfo = windows[i];

                if (isNotNull(windowInfo) && isNotNull(windowInfo.namespaceId)) {
                    widgetIdStartIndex = windowInfo.namespaceId.indexOf('_') + 1;
                    if (windowInfo.namespaceId.indexOf(widgetId + '_') == widgetIdStartIndex) {
                        windowInfos.push(windowInfo);
                    }
                }
            }

            return windowInfos;
        },

		getBrowserId: function() {
			return browserId;
		}
    };
})();

chrome.windows.onRemoved.addListener(function(windowId) {
	var widgetWindow = widgetWindowManager.getWindowByChromeId(windowId);

	widgetWindowManager.removeWindow(widgetWindow);
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	if (!removeInfo.isWindowClosing) {
		var widgetWindow = widgetWindowManager.getWindowByChromeId(tabId);

		widgetWindowManager.removeWindow(widgetWindow);
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// We only want to remove windows during the loading phase,
	// because new windows can be added at completion
	if (changeInfo.status === "loading") {
		var widgetWindow = widgetWindowManager.getWindowByChromeId(tabId);

		if (widgetWindow && widgetWindow.isTab) {
			widgetWindowManager.removeWindow(widgetWindow);
		}
	}
});

Messaging.addListener(
	{ name: "addWindow" },
	function(message, sender, sendResponse) {
		var windowInfo = message.windowInfo,
			windowId;

		if (windowInfo) {
			windowId = widgetWindowManager.addWindow(windowInfo);
		}

		sendResponse({ "windowId": windowId });
	}
);

Messaging.addListener(
	{ name: "removeWindow" },
	function(message, sender, sendResponse) {
		var widgetWindow = widgetWindowManager.getWindowByFrameId(message.frameId);

		if (widgetWindow) {
			widgetWindowManager.removeWindow(widgetWindow);
		}

		sendResponse();
	}
);