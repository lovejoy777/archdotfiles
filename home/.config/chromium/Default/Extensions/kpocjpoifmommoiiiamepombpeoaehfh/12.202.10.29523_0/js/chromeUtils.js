var chromeUtils = function() {
    var queryExists = (typeof chrome.tabs.query != 'undefined');
	var windows = {};
    var tabs = {};
	// The most recent active window of type "normal"
	var activeWindow;

    if (queryExists) {
        // chrome.tabs.query exists as of chrome 16
		// defaults to targeting the current window
		tabs.getSelected = function tabsGetSelected(queryInfo, callback) {
			queryInfo = queryInfo || {};
			queryInfo.active = true;
			// The "*://*/*" url property excludes invalid tabs such as those on the chrome protocol
			if (!Common.showToolbarOnNewTab()){
                queryInfo.url = "*://*/*";
            }

			if (queryInfo.windowType === "normal" && !queryInfo.windowId &&
				activeWindow && activeWindow.id)
			{
				queryInfo.windowId = activeWindow.id;
			}

			chrome.tabs.query(
				queryInfo,
				function tabsGetSelectedQuery(tabArray) {
					// Select the last active tab
					callback(tabArray.length ? tabArray[tabArray.length - 1] : null);
				}
			);
		};

		tabs.getAllInWindow = function(queryInfo, callback) {
			queryInfo = queryInfo || { windowType: 'normal' };
			// The "*://*/*" url property excludes invalid tabs such as those on the chrome protocol
			queryInfo.url = "*://*/*";

			chrome.tabs.query(
				queryInfo,
				function(tabArray) {
					callback(tabArray);
				}
			);
		};
    } else {
        // query does not exist - fall back to chrome methods which have been deprecated in 16
        tabs.getSelected = function(queryInfo, callback) {
			queryInfo = queryInfo || {};

			chrome.tabs.getSelected(queryInfo.windowId, callback);
		};
        tabs.getAllInWindow = function(queryInfo, callback) {
			queryInfo = queryInfo || {};

			chrome.tabs.getAllInWindow(queryInfo.windowId, callback);
		};
    }

    tabs.update = function(tabId, properties, callback) {
		if (tabId) {
            chrome.tabs.update(tabId, properties, callback);
        }
        else {
            chromeUtils.tabs.getSelected({ windowType: 'normal' }, function(tab) {
				// tabId parameter is required for chrome 15 and below
                chrome.tabs.update(tab.id, properties, callback);
            });
        }
    };

	tabs.onActiveChanged = function tabsOnActiveChanged(callback) {
		var sendTabMessage = function tabsOnActiveChangedSendMessage(tabId) {
			chrome.tabs.get(tabId, function tabsOnActiveChangedSendMessageCallback(tab) {
				if (tab) {
					callback(tab);
				}
			});
		};

        //noinspection JSUnresolvedVariable
		if (chrome.tabs.onActivated) {
            //noinspection JSUnresolvedVariable
			chrome.tabs.onActivated.addListener(function(activeInfo) {
				sendTabMessage(activeInfo.tabId);
			});
		} else if (chrome.tabs.onActiveChanged) {
			// onActiveChanged does not exist in old chrome versions for some reason!
			// may lead to buggy widgets :(
			chrome.tabs.onActiveChanged.addListener(function(tabId/*, selectInfo*/) {
				sendTabMessage(tabId);
			});
		}
	};

    //noinspection JSUnresolvedVariable
	chrome.windows.onFocusChanged.addListener(function(windowId) {
        //noinspection JSUnresolvedVariable
		if (windowId !== chrome.windows.WINDOW_ID_NONE) {
            try{
                chrome.windows.get(windowId, { populate: true }, function(window) {
                    if (window && window.type === "normal") {
                        activeWindow = window;
                    }
                });
            }catch (e){
                console.log('cU: caught error %s', e);
            }
		}
	});

    //noinspection JSUnresolvedVariable
	chrome.windows.onRemoved.addListener(function(windowId) {
        //noinspection JSUnresolvedVariable
		if (windowId !== chrome.windows.WINDOW_ID_NONE) {
            try{
                if (activeWindow && activeWindow.id === windowId) {
                    activeWindow = null;
                }
            }catch (e){
                console.log('cU: caught error %s', e);
            }
		}
	});

	/**
	 * Retrieves the current (non-widget) window
	 * @param callback
	 */
	windows.getCurrent = function(callback) {
		callback(activeWindow);
	};

    return {
		windows: windows,
		tabs: tabs
	};
}();