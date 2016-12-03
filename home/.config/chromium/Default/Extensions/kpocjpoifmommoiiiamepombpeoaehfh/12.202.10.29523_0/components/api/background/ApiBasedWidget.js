/**
 * Background support for widgets using the common widget API
 */
function ApiBasedWidget(config) {
	var self = this,
		widgetApi,
        adapterUtil = Mindspark_.adapterUtil,
		_ = Mindspark_.underscore,
        secureBasepath = config.basepath,
        insecureBasepath = config.insecureBasepath || config.basepath;

	Widget.Background.initialize(self);

	this.beginScrollableArea = config.beginScrollableArea;

	self.config = config;
	self.id = config.id;
	self.disableSoftwareCheckOnButtonClick = config.disableSoftwareCheckOnButtonClick;
	self.elementId = self.id.replace(/\./g, "\\.");
	self.readyListeners = [];

	var	button = self.button = config.button;

	var getStringObjectText = function(stringObject) {
		var text = "";

		if (typeof stringObject === "object") {
			stringObject = stringObject.text;
		}

		if (typeof stringObject === "string") {
			text = stringObject;
		}

		return text;
	};

	var injectAdapter = function(params) {
		console.warn("injecting adapter: " + JSON.stringify(params));
		params.file = "common/adapter/widget-adapter.js";
		injectContentScript(params);
	};

	var injectContentScript = function(params) {
		chrome.tabs.executeScript(
			params.tabId,
			{ allFrames: params.allFrames, file: params.file},
			params.callback || function() {}
		);
	};

	var getWidgetWindowUrl = function(url, trusted, isHttps) {
		if (typeof(url) === 'object') {
			url = url.path + (!url.params ? '' : '?' + Common.makeQueryString(url.params));
		}

		if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
			// Trusted windows must use a relative path
			if (trusted) {
				throw new Error("Invalid window configuration: trusted windows must use a relative URL");
			} else {
				return url;
			}
		}

		return (trusted || isHttps ? secureBasepath : insecureBasepath) + url;
	};

	self.getWidgetUrl = function(url, isSecure) {
		if (typeof(url) === 'object') {
			url = url.path + (!url.params ? '' : '?' + Common.makeQueryString(url.params));
		}

		if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
			return url;
		}

		return (isSecure ? secureBasepath : insecureBasepath) + url;
	};

    self.render = function() {
		var html = "";

        if (button) {
            // if type is missing, should default to "simple"
            if (!button.type || button.type === "simple") {
                var style = button.style;

                if (style) {
					var titleText = getStringObjectText(style.title);

                    html = "<button class='toolbar-item button' id='" + self.id + "' ";
                    if (titleText) {
                        html += "title='" + Common.encodeForAttrValue(titleText) + "'";
                    }
                    html += ">";
                    html += self.getSimpleButtonHTML(style);
                    html += "</button>";
                    return html;
                }
                else {
                    console.warn('Missing button style element');
                }
            } else if (button.type === "ticker") {
				var ticker = button.ticker,
					backgroundColor = ticker.backgroundColor || "",
					fontFace = ticker.fontFace || "",
					fontColor = ticker.fontColor || "",
					width = ticker.width,
					items = ticker.items,
                    animationType = ticker.type,
                    scrollDirection = ticker.scrollDirection,
					styles = [
						"background-color:#" + backgroundColor,
						"font-family:" + fontFace,
						"color:#" + fontColor,
						"width:" + width + 'px'
					];


				if (items.length > 0) {
					var item,
						itemStyle = "";

					html = "<button class='toolbar-item button ticker' id='" + self.id + "' ";
					html += "style='" + styles.join(";") + "'>";

					if (animationType === "fade") {
						html += "<div class='items'>";
						itemStyle = "width: " + width + "px; display: none;";
					} else if (animationType === "scroll") {
                        var itemContainerStyle = 'left:' + width + 'px;';
                        itemStyle = "padding: 0 5px;";

                        if (scrollDirection === "right") {
                            itemContainerStyle += 'display:none;';
                            itemStyle += 'float: right;';
                        }

						html += "<div class='items' style='" + itemContainerStyle + "'>";
					}

					for (var i = 0; i < items.length; i += 1) {
						item = items[i];

						html += "<div class='item' data-index='" + i + "' style='" + itemStyle + "'>" + item.content + "</div>";
					}

					html += "</div></button>";
				}

				return html;
            } else {
                console.warn('Unsupported button type: ' + button.type);
            }
        }

		return html;
    };

	self.getSimpleButtonHTML = function(style) {
		var html = "",
			labelText = getStringObjectText(style.label);

		if (style.icon) {
			// critical: what about image width - will break scrolling?
			html += "<img class='icon api-based-widget-icon' src='" + self.getWidgetUrl(style.icon) + "' ";

			if (style.stripPadding) {
				html += "style='padding: 0; vertical-align: top;'";
			}

			html += "/>";
		}
		if (labelText) {
			var labelStyle = [];

			if (style.textColor) {
				labelStyle.push("color:" + style.textColor);
			}

			html += "<span class='label' style='" + labelStyle.join(';') + "'>" + Common.encodeForHTML(labelText) + "</span>";
		}
		return html;
	};
	
	self.openWindow = function(windowComponent, rectangle, tabId, callback, argument, isHttps) {
		if (Common.isNotNull(windowComponent)) {
			self.setWindowComponentNamespace(windowComponent);
		}

		var DEFAULT_WINDOW_TYPE = "dialog",
			DEFAULT_DIALOG_BEHAVIOR = "menu",
			namespaceId = windowComponent.namespaceId,
			behavior = null,
			type = windowComponent.type = Common.defaultVal(windowComponent.type, DEFAULT_WINDOW_TYPE),
			trusted = Common.defaultVal(windowComponent.trusted, true),
			widgetUrl = getWidgetWindowUrl(windowComponent.url, trusted, isHttps);

		var	queryString = {
			widgetUrl: widgetUrl,
			widgetId: self.id,
			type: type,
			title: windowComponent.title,
			width: windowComponent.width,
			height: windowComponent.height,
			trusted: trusted
		};

		var	widgetWindowURL = chrome.extension.getURL('components/api/window/widgetWindow.html') +
            "?params=" +
            JSON.stringify(queryString);

		if (type === "currentTab") {
			self.openPage(widgetUrl, { tabId: tabId });
		}
		else if (type === "newTab") {
			self.openPage(widgetUrl, null);
		}
		else if (type === "newWindow") {
			self.openPage(widgetUrl, { newWindow: true });
		}
		// Widget Window types
		else {
			var existingWindowInfo = widgetWindowManager.getWindowByNamespaceId(namespaceId),
				invokeCallback = function(params) {
					var tab = null,
						_tabId = null;

					// Non-dialogs and pre-existing windows get a null value for the tab properties
					if (type === 'dialog' && params.opened) {
						_tabId = tabId * 1;  // Coerce the tabId to a number

						tab = {
							'id': _tabId
						};
					}

					if (typeof callback === "function") {
						callback({
							windowId: params.windowId,
							opened: params.opened,
							tabId: _tabId
						});
					}

					// Only fire the WindowOpened event if a new window was opened
					if (params.opened) {
						widgetApi.sendInterwidgetMessage(
							"WindowOpened",
							{
								widget: {
									id: self.id
								},
								tab: tab,
								window: {
									id: params.windowId,
									type: type,
									behavior: behavior
								}
							}
						);
					}
				};

			if (type === "dialog") {
				behavior = windowComponent.behavior = Common.defaultVal(windowComponent.behavior, DEFAULT_DIALOG_BEHAVIOR);

				var dialogConfig = adapterUtil.getDialogConfig(behavior);

				self.showDialog(tabId, {
					containerId: self.id,
					src: widgetWindowURL,
					rectangle: rectangle,
					namespaceId: namespaceId,
					dialogConfig: dialogConfig,
					windowComponent: windowComponent
				}, function(response) {
					var _windowId,
						opened = response.opened;

					if (opened) {
						_windowId = widgetWindowManager.addWindow({
							namespaceId: windowComponent.namespaceId,
							chromeId: tabId,
							isTab: true,
							frameId: response.frameId,
							widgetId: self.id,
							argument: argument,
							trusted: trusted
						});
					}
					else if (existingWindowInfo) {
						_windowId = existingWindowInfo.id;
					}

					invokeCallback({
						windowId: _windowId,
						opened: opened
					});
				});
			}
			else if (type === "popup") {
				// Check to see if this window already exists, in which case the window will be focused,
				// the callback will be invoked, and we will short-circuit this code path
				if (existingWindowInfo) {
					chrome.windows.update(
						existingWindowInfo.chromeId,
						{ focused: true },
						function(_window) {
							invokeCallback({
								windowId: existingWindowInfo.id,
								opened: false
							});
						}
					);

					// ================== SHORT-CIRCUIT
					return;
				}

				self.getPositioningInfo(
					tabId,
					{
						containerId: self.id,
						url: widgetUrl,
						rectangle: rectangle,
						windowComponent: windowComponent
					},
					function(positionInfo) {
						// If necessary, the window will be automatically resized to ensure that
						// the content area dimensions match that of the specified window dimensions.
						// To reduce the difference in size due to the Chrome UI, we will use the following
						// default values.
						var CHROME_UI_WIDTH = 10,
							CHROME_UI_HEIGHT = 28;

						self.createWindow({
							url: widgetUrl,
							width: positionInfo.width + CHROME_UI_WIDTH,
							height: positionInfo.height + CHROME_UI_HEIGHT,
							left: positionInfo.left,
							top: positionInfo.top,
							type: 'popup'
						}, function(_window) {
							var widgetTab = _window.tabs[0];

							chrome.tabs.onUpdated.addListener(function onTabComplete(tabId, changeInfo, tab) {
								if (tabId === widgetTab.id && tab.status === "loading") {
									chrome.tabs.onUpdated.removeListener(onTabComplete);

									injectAdapter({
										tabId: tabId,
										callback: function() {
											injectContentScript({
												tabId: tabId,
												file: "initWidgetWindow.js",
												callback: function() {
													chrome.tabs.sendRequest(
														tabId,
														{
															type: "INIT_WIDGET_WINDOW",
															width: positionInfo.width,
															height: positionInfo.height,
															widgetId: self.id,
															trusted: trusted
														}
													);
												}
											});
										}
									});
								}
							});

							var id = widgetWindowManager.addWindow({
								namespaceId: namespaceId,
								chromeId: _window.id,
								widgetId: self.id,
								argument: argument,
								trusted: trusted
							});

							invokeCallback({
								windowId: id,
								opened: true
							});
						});
					}
				);
			}
			else if (type === "hidden") {
				widgetWindowURL = chrome.extension.getURL('components/api/window/hiddenWidgetWindow.html') +
					"?params=" +
					JSON.stringify(queryString);

				var frame = document.createElement("iframe");

				// Check to see if this window already exists, in which case the callback will be invoked
				// and we will short-circuit this code path
				if (existingWindowInfo && existingWindowInfo.window) {
					invokeCallback({
						windowId: existingWindowInfo.id,
						opened: false
					});

					// ================== SHORT-CIRCUIT
					return;
				}

				if (!document.getElementById(namespaceId)) {
					frame.setAttribute("id", namespaceId);
					frame.setAttribute("src", widgetWindowURL);
					frame.setAttribute("width", "1");
					frame.setAttribute("height", "1");

					var windowId = widgetWindowManager.addWindow({
						namespaceId: namespaceId,
						widgetId: self.id,
						window: frame,
						argument: argument,
						trusted: trusted,
						hidden: true
					});

					frame.addEventListener("load", function(event) {
						invokeCallback({
							windowId: windowId,
							opened: true
						});
					}, true);

					document.documentElement.appendChild(frame);
				}
			}
			else {
				console.warn("Unknown window type: " + type);
			}
		}
	};

	self.closeWindow = function(widgetWindow, message, callback) {
		if (widgetWindow) {
			if (widgetWindow.isTab) {
				self.hideDialog(
					widgetWindow.chromeId,
					{
						widgetWindow: widgetWindow
					}
				);
			} else if (widgetWindow.hidden) {
				var frame = document.getElementById(widgetWindow.namespaceId);

				if (frame) {
					widgetWindowManager.removeWindow(widgetWindow);
					document.documentElement.removeChild(frame);
				}
			} else {
				self.removeWindow(widgetWindow.chromeId);
			}
		} else {
			console.warn("Attempted to close nonexistent window");
		}
	};

	self.getWindowComponent = function(name) {
		var windowComponent = config.windows[name];

		if (windowComponent) {
			windowComponent.name = name;

			return windowComponent;
		} else {
			console.warn("window '" + name + "' does not exist in " + self.id);
		}

		return false;
	};

	self.setWindowComponentNamespace = function(windowComponent) {
		if (windowComponent) {
			windowComponent.namespaceId = self.getWindowNamespaceId(windowComponent);
		}
	};

	self.getWindowNamespaceId = function(windowComponent) {
		return widgetWindowManager.getBrowserId() + "_" + self.id + "_" + windowComponent.name;
	};

	self.fireReadyListeners = function(tabId) {
		while (self.readyListeners.length > 0) {
			(self.readyListeners.shift())(tabId);
		}
	};

	self.onReady = function(message, sender, sendResponse) {
		// Fire ready listeners
		self.fireReadyListeners(sender.tab.id);

		if (button && button.type === "ticker") {
			chrome.tabs.sendRequest(
				sender.tab.id,
				{
					cmd: "TICKER",
					widgetId: self.id,
					initialize: true,
					tickerSelector: '#' + self.elementId,
					itemsSelector: '#' + self.elementId + ' .items',
					ticker: button.ticker
				}
			);
		}
	};

	if (config.background) {
		if (config.background.url) {
			var frame = document.createElement("iframe"),
				bgUrl = self.getWidgetUrl(config.background.url, true);
			frame.setAttribute("src", bgUrl);
			frame.addEventListener("load", function() {
				initAdapter({
					widgetWindow:  frame.contentWindow,
					logFunction: function(s) {
						console.log(s);
					},
					windowUrl: bgUrl,
					adapterWindow: window,
					widgetId: self.id,
					windowManager: widgetWindowManager,
					isTrusted: true
				});
			}, false);
			document.documentElement.appendChild(frame);
		}
		else console.warn("background element missing url");
	}

	////////////////////////////////////////////////////////////////////////////////////////
    // Initialize Widget API
    ////////////////////////////////////////////////////////////////////////////////////////

	widgetApi = api(self);
}
ApiBasedWidget.prototype = new Widget.Background();