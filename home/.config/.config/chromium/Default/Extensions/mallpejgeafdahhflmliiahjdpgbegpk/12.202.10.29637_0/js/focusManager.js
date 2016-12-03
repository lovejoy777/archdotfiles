var focusManager = (function() {
    var currentWindowId = chrome.windows.WINDOW_ID_NONE;
    var listeners = [];

    //Find the initial focused window
    chrome.windows.getAll({populate: false}, function(windows) {
        for (var i = 0; i < windows.length; i++) {
            var window = windows[i];
            if (window.focused) {
                currentWindowId = window.id;
                break;
            }
        }
    });

    var focusChanged = function(newlyFocusedWindowId, includeLost) {
        var lostWindowInfo = includeLost ? widgetWindowManager.getWindowByChromeId(currentWindowId) : false;
        var focusedWindowInfo = widgetWindowManager.getWindowByChromeId(newlyFocusedWindowId);

        currentWindowId = newlyFocusedWindowId;
        for (var i = 0; i < listeners.length; i++) {
            listeners[i](lostWindowInfo, focusedWindowInfo);
        }
    };

    chrome.windows.onFocusChanged.addListener(function (newlyFocusedWindowId) {
        //Necessary because chrome doesn't like when you pass that value
        if (currentWindowId == chrome.windows.WINDOW_ID_NONE) {
            focusChanged(newlyFocusedWindowId, false);
        } else {
            //Make sure the window wasn't already closed
            try{
                chrome.windows.get(currentWindowId, function(window) {
                    focusChanged(newlyFocusedWindowId, window);
                });
            }catch (e){
                console.log('fM: caught error %s', e);
            }
        }
    });

/*  //For use when we need to deal w/ tabs changing.
    var openWindows = {};

    var getWindowId = function(chromeId) {
        return 'win_' + id;
    };

    var getOpenWindow = function(id) {
        return openWindows[getWindowId(id)];
    };

    var addOpenWindow = function(id) {
        var openWindow = getOpenWindow(id);
        if (Common.isNull(openWindow)) {
            openWindow = {};
            openWindows[getWindowId(id)] = openWindow;
        }
        return openWindow;
    };

    //Initialize all the windows.
    chrome.windows.getAll({populate: true}, function(windows) {
        for (var i = 0; i < windows.length; i++) {
            var window = windows[i];
            var openWindow = addOpenWindow(window.id);
            for (var j = 0; j < window.tabs.length; j++) {
                var tab = window.tabs[j];
                if (tab.active) {
                    openWindow.activeTab = tab.id;
                }
            }
        }
    });
*/
    // public API
    return {
        addFocusChangedListener: function(listener) {
            listeners.push(listener);
        }
    }
})();