/**
 * Widget namespace contains two children:
 * - Background - abstract class for widget background objects
 * - Content - "static" methods for widget content objects to interact with background/browser
 */
var Widget = {
    Background: function() {},
    Content: {
		tabs: {},
		extension: {}
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Background
//////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * "static" helper method - should be called from widget background constructors
 */
Widget.Background.initialize = function(self) {
	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {
			if (self.handleRequest) {
				var response = self.handleRequest(request, sender, sendResponse);
			}
			if (response) {
				sendResponse(response);
			}
		}
	);
};

Widget.Background.prototype.logButtonClickedEvent = function(buttonId, overflow) {
	Mindspark_.shared.unifiedLogging.logButtonClickedEvent({
		buttonId: buttonId,
		overflow: overflow
	});
};

/**
 * Return path to files within the extension
 * @param src
 */
Widget.Background.prototype.getURL = function(src) {
    if (src.indexOf('http') == 0) {
        return src;
    } else {
        return chrome.extension.getURL(src);
    }
};

Widget.Background.prototype.reRender = function(id, html, tab){
	if (tab) {
		chrome.tabs.sendRequest(
			tab.id,
			{
				cmd: "REPLACE",
				containerId: id,
				html: html
			}
		);
	}
};

Widget.Background.prototype.addClass = function(selector, className, tab){
	if (tab) {
		chrome.tabs.sendRequest(
			tab.id,
			{
				cmd: "ADDCLASS",
				selector: selector,
				className: className
			}
		);
	}
};

Widget.Background.prototype.removeClass = function(selector, className, tabId){
	chrome.tabs.sendRequest(
		tabId,
		{
			cmd: "REMOVECLASS",
			selector: selector,
			className: className
		}
	);
};

Widget.Background.prototype.updateAttributes = function(elementId, attributes, tab){
	if (tab) {
		chrome.tabs.sendRequest(
			tab.id,
			{
				cmd: "UPDATE_ATTRIBUTES",
				elementId: elementId,
				attributes: attributes
			}
		);
	}
};

Widget.Background.prototype.createWindow = function(options, callback) {
	chrome.windows.create(options, callback);
};

Widget.Background.prototype.removeWindow = function(windowId, callback) {
	chrome.windows.remove(windowId, callback);
};

Widget.Background.prototype.openPage = function(url, params, callback){
	if (params) {
		if (params.tabId) {
			chromeUtils.tabs.update(params.tabId, { url: url }, function(tab) {
				if (typeof callback === "function") {
					callback({
						tab: tab
					});
				}
			});
		} else if (params.newWindow) {
			chrome.windows.create({ url: url }, function(_window) {
				if (typeof callback === "function") {
					callback({
						window: _window
					});
				}
			});
		}
	} else {
        chrome.tabs.create({ url: url }, function(tab) {
			if (typeof callback === "function") {
				callback({
					tab: tab
				});
			}
		});
    }
};

Widget.Background.prototype.getPositioningInfo = function(tabId, params, responseCallback) {
	params.cmd = "GET_POSITIONING_INFO";

	chrome.tabs.sendRequest(tabId, params,	responseCallback);
};

/**
 * Show a dialog in the content script from the background object
 * @param tab
 * @param params
 */
Widget.Background.prototype.showDialog = function(tabId, params, callback) {
	if (typeof tabId === "object") {
		tabId = tabId.id;
	}

    params.cmd = "ADD";
    chrome.tabs.sendRequest(tabId, params, callback);
};

/**
 * Hide the popup in the content script from the background page
 * @param tab the tab to hide the popup from
 * @param params an object representing the parameters.  Should contain the containerId
 */
Widget.Background.prototype.hideDialog = function(tabId, params, callback) {
	if (typeof tabId === "object") {
		tabId = tabId.id;
	}

    params.cmd = 'REMOVE';
    chrome.tabs.sendRequest(tabId, params, callback);
};

/**
 * Show an alert in the content script from the background object
 * @param tab the tab to show the alert on
 * @param msg the message to alert
 */
Widget.Background.prototype.showAlert = function(tab, msg) {
    var params = {msg: msg, cmd: 'ALERT'};
    chrome.tabs.sendRequest(tab.id, params);
};

/**
 * Determines the selected tab and passes it to the callback.
 * Handles being called from a non-tab context.
 * @param callback the function to call w/ the selected tab
 */
Widget.Background.prototype.getSelectedTab = function(callback) {
    chromeUtils.tabs.getSelected({ windowType: 'normal' }, callback);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Widget.Content - API-based widgets should not use this directly
//////////////////////////////////////////////////////////////////////////////////////////////////////

Widget.Content.extension.sendRequest = function(message, callback) {
    if (callback) {
        chrome.extension.sendRequest(message, callback);
	} else {
    	chrome.extension.sendRequest(message);
	}
};

Widget.Content.tabs.sendRequest = function(tab, message) {
	chrome.tabs.sendRequest(tab.id, message);
};

Widget.Content.tabs.update = function(tab, url){
	chrome.tabs.update(tab.id, {url: url});
};

Widget.Content.openPage = function(url, isNewWindow){
	if (isNewWindow) {
        chrome.windows.create({url: url});
    } else {
        chrome.tabs.create({url: url});
    }
};

Widget.Content.tabs.isSearchURL = function(url){
    var needle = /\/GG(dirs|main|advf|image).jhtml/g;
    return url && needle.test(url);
};

Widget.Content.tabs.loadButtonLink = function(tab, url, isNewWindow){
    console.log('Widget.Content.tabs.loadButtonLink(%s,%s,%s)', tab, url, isNewWindow);
    if (Widget.Content.tabs.isSearchURL(url)){
        // Handle case where url is for Search.
        // This is similar to the Firefox implementation but is inclusive of all searches
        // TODO may want to revisit excluding searched content from opening in a new window for both FF and Chrome!
        Widget.Content.tabs.update(tab, url);
    }else if (isNewWindow === 'newTab'){
        chrome.tabs.create({url: url});
    }else if (isNewWindow){
        chrome.windows.create({url: url});
    }else {
        chrome.tabs.update(tab.id, {url: url});
    }
};
