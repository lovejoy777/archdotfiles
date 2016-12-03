// Background
var Toolbar = {
	name: '',
	html: "",
	widgets: [],
	rightSideWidgets: [],
	detectDomains: [],
	isScrollable: false,
	searchBoxWidget: null,
	toolbarInfo: {},
	softwareDetectTimers: {},
    newTabRE: undefined,

	initialize: function initialize(config, imageWidths, isNewInstall) {
        this.setupGlobals();
		var self = this;

		// This will ensure consistent ordering of multiple toolbars
		if (!Global.isInstallTimestampSet()) {
			Global.setInstallTimestamp(new Date().getTime());
		}

		var toolbarInfo = self.toolbarInfo = {
			toolbarId: Global.getToolbarId(),
			partnerId: Global.getPartnerId(),
			partnerSubId: Global.getPartnerSubId(),
			installDate: Global.getInstallDate(),
			installTimestamp: Global.getInstallTimestamp(),
			toolbarBuildDate: config.buildDate,
			toolbarVersion: config.version
		};

		Mindspark_.shared.unifiedLogging.init({
			toolbarData: toolbarInfo,
			toolbarConfig: config,
			eventUrl: Common.unifiedLoggingPixelUrl,
			localStorageMechanism: {
				get: function(key) {
					return Global.retrieve(key);
				},

				set: function(key, value) {
					return Global.store(key, value);
				}
			},
			excludeButtonTypes: [
				'SearchBox',
				'EditFeaturesButton'
			]
		});

        var customVars = Common.getBuildVars();
        for (var p in customVars){
            Global.store(p, customVars[p]);
            console.log('t: Global.store(%s, %s) from customVars.%s', p, customVars[p], p);
        }

		self.setupInternationalSearch(customVars);

        if (Common.showToolbarOnNewTab()){
            self.initializeNewTabURLRegEx();
        }

        self.startActivePing();

		this.name = config.name;

		//Set the toolbar detect domains
		for (var i = 0; i < config.toolbarDetectDomains.length; i++) {
			this.detectDomains.push(config.toolbarDetectDomains[i]);
		}

		for (var j = 0; j < config.widgets.length; j++) {
			var widgetConfig = config.widgets[j],
                isWidgetSearchBox = widgetConfig.type === 'SearchBox',
                nextWidgetConfig = config.widgets[j + 1],
				isNextWidgetSearchBox = (j + 1 < config.widgets.length) && nextWidgetConfig.type === 'SearchBox';

            !0?1:console.log('t: widgetConfig[%s]: %O', j, widgetConfig);

			//If this widget is the magnifying glass, and the next widget is the search box
			if (widgetConfig.isMagnifyingGlass && isNextWidgetSearchBox) {
				nextWidgetConfig.menu = widgetConfig;

				self.searchBoxWidget = nextWidgetConfig;
			} else {
				if (isNextWidgetSearchBox) {
					self.searchBoxWidget = nextWidgetConfig;
				}else if (isWidgetSearchBox && nextWidgetConfig){
                    nextWidgetConfig.isSearchButton = true;
				}

				var widget = WidgetFactory.createWidget(widgetConfig, imageWidths);
                !0?1:console.log('t: widget: %O', widget);
				if (!widget) {
					if (widgetConfig.beginScrollableArea && nextWidgetConfig) {
						// Fix for scrolling, in case the first element after search button
						// (marked with beginScrollableArea=true) is a non-supported type
						nextWidgetConfig.beginScrollableArea = widgetConfig.beginScrollableArea;
					}
				} else if (!widgetConfig.rightSide) {
					self.widgets.push(widget);
				} else {
					self.rightSideWidgets.push(widget);
				}

                if (widget){
                    widget.hiddenWidget = widgetConfig.hiddenWidget;
                    !0?1:console.log('t: widget: %O', widget);
                }

			}
		}

		var extensionRequest = (function() {
			var available_features = (function() {
				var features = {};

				Object.defineProperties(features, {
					"NEW_TAB_PAGE": {
						get: function() {
							return Global.retrieve('disableTabTakeover') === 'false';
						},

						set: function(enable) {
							enable = enable ? 'false' : 'true';

							Global.store('disableTabTakeover', enable);
						}
					}
				});

				return features;
			}());

			var featureValueMap = {},
				features = Object.getOwnPropertyNames(available_features),
				featureLen = features.length;

			return {
				"GET_FEATURES": function(message, sendResponse) {
					var i;

					for (i = 0; i < featureLen; i++) {
						featureValueMap[features[i]] = available_features[features[i]];
					}

					sendResponse({ "featureValueMap": featureValueMap });
				},

				"SET_FEATURES": function(message, sendResponse) {
					var i,
						updatedFeatures = message.features,
						updatedFeatureNames = Object.getOwnPropertyNames(updatedFeatures),
						featureName;

					for (i = 0; i < updatedFeatureNames.length; i++) {
						featureName = updatedFeatureNames[i];

						available_features[featureName] = updatedFeatures[featureName];
					}

					// Build an Object that represents the latest feature values
					for (i = 0; i < featureLen; i++) {
						featureValueMap[features[i]] = available_features[features[i]];
					}

					sendResponse({ "featureValueMap": featureValueMap })
				},

				"GET_INFO": function(message, sendResponse) {
					sendResponse({
						"toolbarInfo": toolbarInfo
					});
				}
			};
		}());

		Messaging.addListener(
			{ name: 'GET_TOOLBAR_DATA' },
			function(request, sender, sendResponse) {
				self.isToolbarEnabled(request.href, sender.tab, function getToolbarDataListener(enabled) {
					//noinspection JSUnresolvedVariable
					var ci = config.codeInjection,
						href = request.href,
						injectionUrls = [];

					if (ci) {
						// Ported from XPI
						for (var i = 0; i < ci.length; i++) {
							var cie = ci[i];
							var isPrefix = cie.isPrefix;
							var pattern = cie.pattern;
							if (!isPrefix && href === pattern || isPrefix && href.substring(0, pattern.length) === pattern) {
								var jsUrl = paramReplacer.replaceParams(cie.codeUrl, sender.tab);
								injectionUrls.push(jsUrl);
							}
						}
					}

					sendResponse({
						toolbarEnabled: enabled,
						detectableDomain: self.isDetectEnabledDomain(request.domain),
						injectionUrls: injectionUrls,
						toolbarInfo: toolbarInfo
					});
				});
			}
		);

		Messaging.addListener(
			{ name: 'EXTENSION_REQUEST' },
			function(request, sender, sendResponse) {
				var extensionRequestHandler = extensionRequest[request.action];

				if (typeof extensionRequestHandler === "function") {
					extensionRequestHandler(request.message, sendResponse);
				}
			}
		);

		Messaging.addListener(
			{ name: 'getRectangle' },
			function(request, sender, sendResponse) {
				chrome.tabs.sendRequest(
					sender.tab.id,
					{
						cmd: "GET_RECTANGLE",
						elementId: request.elementId,
						getAbsolutePosition: request.getAbsolutePosition
					},
					sendResponse
				);
			}
		);

		Messaging.addListener(
			{ name: 'LOG_BUTTON_CLICKED' },
			function(request, sender, sendResponse) {
				var buttonId = request.buttonId,
					overflow = !!request.overflow;

				Mindspark_.shared.unifiedLogging.logButtonClickedEvent({
					buttonId: buttonId,
					overflow: overflow
				});
			}
		);

		// Listen for content script requests
		chrome.extension.onRequest.addListener(
			function(request, sender, sendResponse) {
				if (request.name == "toolbarHtml") {
					self.createHtml(sender.tab);

					var response = {
						html: self.html,
						tab: sender.tab,
						isScrollable: self.isScrollable,
						existingSearchBoxQuery: searchContext.getQuery(sender.tab.id)
					};

					var searchBoxWidget = self.searchBoxWidget;

					// Expose search box configuration options
					if (searchBoxWidget) {
						response.searchBoxConfig = {
							minHeightPixels: searchBoxWidget.minHeightPixels,
							heightPercent: searchBoxWidget.heightPercent,
							autoExpandButtonCount: searchBoxWidget.autoExpandButtonCount,
							borderPixels: searchBoxWidget.borderPixels,
							hasMagnifyingGlass: searchBoxWidget.isMagnifyingGlass
						};
                        !0?1:console.log('t: defined searchBoxWidget');
					}else{
                        !0?1:console.log('t: !defined searchBoxWidget');
                    }

					sendResponse(response);
				} else if (request.name == 'highlight') {
                    if (false){
                        searchContext.updateQuery(sender.tab.id, request.text);
                        chrome.tabs.sendRequest(sender.tab.id, {
                            cmd: 'HIGHLIGHTED',
                            text: request.text
                        });
                    }
                } else if (request.name == 'setToolbarInstalledCookie') {
                    Common.setToolbarInstalledCookie(request.domain);
                } else if (request.name === 'closeFrames') {
                    chrome.tabs.sendRequest(sender.tab.id, { cmd: "CLOSE_FRAMES" });
                } else if (request.name === 'navigate') {
                    var action = request.action;

                    if (action === "currentTab") {
                        chrome.tabs.update(sender.tab.id, { url: request.url });
                    } else if (action === "newWindow") {
                        chrome.windows.create({ url: request.url });
                    } else if (action === "newTab" || Common.isNull(action)) {
                        chrome.tabs.create({ url: request.url });
                    }
                }
            }
		);

		chromeUtils.tabs.onActiveChanged(function(tab) {
			if (tab && Toolbar.isSupportedScheme(tab.url) && tab.status === "complete") {
				chrome.tabs.sendRequest(tab.id, { cmd: "REPAINT" });
			}
		});

		//noinspection JSUnresolvedVariable
        if (chrome.browserAction && chrome.browserAction.onClicked){
            //noinspection JSUnresolvedVariable
            chrome.tabs.onCreated.addListener(
                function(tab) {
                    self.updateBrowserAction(tab);
                }
            );

            //noinspection JSUnresolvedVariable
            chrome.tabs.onUpdated.addListener(
                function(tabId, changeInfo, tab) {
                    self.updateBrowserAction(tab);
                }
            );

            //Icon handler
            //noinspection JSUnresolvedVariable
            chrome.browserAction.onClicked.addListener(
                function (tab) {
					if (Common.showToolbarNowhere() || Common.showToolbarOnNewTab()) {
						chrome.tabs.create({
							active: true,
							url: chrome.extension.getURL(Common.getBuildVars().chromeManifestNewTab + '.html')
						}, function(tab) {
							if (chrome.runtime.lastError) {
								console.error(chrome.runtime.lastError);
							}
						});
					} else if (self.isSupportedScheme(tab.url) && !globalBlacklistService.isUrlBlacklisted(tab.url)) {
                        var domain = Common.extractDomain(tab.url);
                        var blacklisted = BlackListService.isUrlBlacklisted(tab.url);
                        //Toggle some things
                        if (blacklisted) {
                            BlackListService.removeDomainFromBlackList(domain);
                            chrome.browserAction.setTitle({tabId: tab.id, title: 'Disable ' + self.name});
                        } else {
                            BlackListService.addDomainToBlackList(domain);
                            chrome.browserAction.setTitle({tabId: tab.id, title: 'Enable ' + self.name});
                            //TODO: this will change if we support domain level blacklisting.
                            turnOffRadio();
                        }

                        //Message all windows/tabs with new state
                        self.updateAll(domain, !blacklisted);
                    }
                }
            );
        }

        //Set the cookies
        Common.refreshToolbarInstalledCookie(config.toolbarDetectDomains, config.checkInterval);

        // Let the content scripts know that the background is ready for interaction
        chromeUtils.tabs.getAllInWindow({}, function getAllInWindowCallback(tabs) {
            _.forEach(tabs, function getAllInWindowCallbackForEach(tab, index, list) {
                Messaging.send(
                    { name: "BACKGROUND_READY" },
                    function(response) {
                        // nothing to do
                    },
                    tab.id
                );
            });
        });

        var isNewInstall = Toolbar.installState.isNewInstall();
        if (Toolbar.installState.isNewInstall() || Toolbar.installState.isUpgrade()) {
            // Fire the Unified Logging ButtonStructure event for new and upgraded installs
            // and only when the Button Structure has changed
			if (!Mindspark_.shared.unifiedLogging.logButtonStructureEvent()) {
				console.warn('Button Structure Unchanged, did not log the event');
			}
		}

        if (Common.getBuildVars().hasExecutablePackages) {
            CompanionSW.setDefaultCallbacks({
                onInstalled: function onInstalled() {
                    Toolbar.reloadNewTab('detectedExe');
                },
                onMissing: function onMissingDefault() {
                    Toolbar.reloadNewTab('missingExe');
                }
            });
        }

        if (isNewInstall) {
            !1 ? 0 : console.log('t: isNewInstall - initiating downloadMissingSoftwarePackages');
            Toolbar.openNewTab();

            var exePackage = config.executablePackages;

            function deferDownload() {
                var extensionStates = {
                    onDetected: function onDetectedDuringInstall() {
                        Toolbar.reloadNewTab('installedTB');
                        Toolbar.showSuccessfulInstallationPage();
                    },
                    onMissing: function onMissingDuringInstall(params) {
                        !1 ? 0 : console.log('t: isNewInstall - onMissing(%O)', arguments);
                        !1 ? 0 : console.log('t: isNewInstall - onMissing, params.installerUri', params.installerUri);
                        Toolbar.reloadNewTab('installedDownload=' + encodeURIComponent(params.installerUri));
                    },
                    onDownloading: function onDownloadingDuringInstall() {
                        Toolbar.reloadNewTab('downloadingExe', 'installedTB');
                    },
                    onInstalled: function onInstalledDuringInstall() {
                        Toolbar.reloadNewTab('detectedExe');
                        Toolbar.showSuccessfulInstallationPage();
                    },
                    onError: function onErrorDuringInstall() {
                        Toolbar.reloadNewTab('installedTB');
                        Toolbar.showSuccessfulInstallationPage();
                    }
                };

                //if the extension doesn't have an exe installer
                if (!exePackage) {
                    extensionStates.onMissing = function onMissingDuringInstall(params) {
                        !1 ? 0 : console.log('t: isNewInstall - onMissing(%O)', arguments);
                        !1 ? 0 : console.log('t: isNewInstall - onMissing, params.installerUri', params.installerUri);
                        Toolbar.reloadNewTab('installedTB'); //Display the welcome bubble instead
                        Mindspark_.log("t: This extension doesn't have an exe installer");
                        Mindspark_.log("t: We're displaying the Welcome bubble instead");
                    };
                }

                CompanionSW.downloadMissingSoftware(extensionStates);
            }

            window.setTimeout(deferDownload, 500);
        }

		// set up uninstall url
		(function() {
			var url = Global.getUninstallSurveyUrl();
			if (url) {
				url = Mindspark_HttpURL(paramReplacer.replaceParams(url));
				url.setParam('reason', 'uninstall');
				chrome.runtime.setUninstallURL(url.toString());
			} else {
				chrome.runtime.setUninstallURL('');
			}
		})();

        Global.postMessage('toolbar:initialized');
	},

	setupInternationalSearch: function(customVars){
		var i18nSearch = Mindspark_InternationalSearch,
			searchUrl = (function(){
				var searchUrl = new Mindspark_HttpURL(Common.searchUrl);
				searchUrl.setPath('');
				return String(searchUrl);
			})(),
			pf = new PartnerIdFactory(),
			partnerId = pf.parse(Global.getPartnerId()),
			countryCodes = customVars.i18nSearchCountryCodes || [];

		if (typeof countryCodes === 'string'){
			// need to turn array back to string because of the deserialization that occurs in common.js#getBuildVars
			countryCodes = countryCodes.split(',');
		}

		i18nSearch.setOriginalDomain(searchUrl);
		i18nSearch.setDefaultDomain(customVars.i18nSearchDefaultDomain);
		i18nSearch.setCountryCodes(countryCodes);
		i18nSearch.setSpecifiedDomain(customVars.i18nSearchSpecifiedDomain);
		i18nSearch.setCountryCode(localStorage.getItem('dev_i18nSearchCountryCode'), partnerId.getCountry(), Global.retrieve('dlpCountryCode'));
		console.log('t: %s', String(i18nSearch));
	},

    trimForLog: function(value, lenIn){
        var str = String(value),
            len = lenIn || 32;
        if (str.length > len){
            str = str.substring(0, len).replace(/\n/, "\\n") + '...';
        }
        return str;
    },

    fetchResource: function(src, onFullfilled, onRejected){
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function(){
            if (xmlHttp.status === 400){
                !1?0:console.log('t: fetchResource(%s, %s, "%s") xmlHttp: %O', src, Toolbar.trimForLog(onFullfilled), Toolbar.trimForLog(onRejected), xmlHttp);
                onRejected(xmlHttp.status);
            }else if (xmlHttp.readyState === 4 && xmlHttp.status === 200){
                !1?0:console.log('t: fetchResource(%s, %s, "%s") responseText: "%s"', src, Toolbar.trimForLog(onFullfilled), Toolbar.trimForLog(onRejected), Toolbar.trimForLog(xmlHttp.responseText));
                onFullfilled(xmlHttp.responseText);
            }else if(xmlHttp.readyState === 4){
                !1?0:console.error('t: fetchResource failed with state: %s and status code: %s', xmlHttp.readyState, xmlHttp.status);
                onRejected(xmlHttp.status);
            }
        };
        xmlHttp.open("GET", src + '?ts=' + Date.now(), false);
        try{
            xmlHttp.send();
        }catch (e){
            !1?0:console.warn('t: caught: %s while attempting to get %s', e, src);
            !1?0:console.dir(e);
            onRejected(e);
        }
    },

    setupExternalStyling: function setupExternalStyling(callback){
        !1?0:console.log('t: setupExternalStyling("%s")', Toolbar.trimForLog(callback));
        var toolbarStyleUrl = Common.getToolbarStyleSheet(),
            fullfilledToolbarStyle = function(content){
                !1?0:console.log('t: setupExternalStyling - fullfilledToolbarStyle("%s")', Toolbar.trimForLog(content));
                localStorage.setItem('toolbarStyle', content);
                callback();
            },
            rejectedToolbarStyle = function(){
                callback();
            };

        if (toolbarStyleUrl){
            Toolbar.fetchResource(toolbarStyleUrl, fullfilledToolbarStyle, rejectedToolbarStyle);
        }else{
            !1?0:console.log('t: setupExternalStyling - !toolbarStyleUrl');
            callback();
        }
    },

    newTabId: undefined,

    openNewTab: function openNewTab(/*fragments*/){
        if (Common.getBuildVars().chromeManifestNewTab == "N/A"){
            console.log('t: openNewTab - unable to comply since newTab is N/A, arguments: %O', arguments);
        }else{
            var fragment = Array.prototype.join.call(arguments, '&');
            console.log('t: openNewTab - %s', fragment);
            Toolbar.newTabId = null;
            chrome.tabs.create({url: 'chrome://newtab/'}, function(tab){
                console.log('t: openNewTab - "%s", tab.id: %s', fragment, tab.id);
                Toolbar.newTabId = tab.id;
                if (fragment){
                    window.setTimeout(function(){
                        console.log('t: openNewTab - updating to "%s"', fragment);
                        chrome.tabs.update(tab.id, {url: 'chrome://newtab/#' + fragment});
                    }, 500);
                }
            });
        }
    },

    reloadNewTab: function reloadNewTab(/*fragments*/){
        var fragment = Array.prototype.join.call(arguments, '&');
        var args=arguments;
        chrome.tabs.query({active:true}, function(tabs){
            var tab = tabs[0];
            var newTabRE = /chrome.*\:\/\/.*(?:spent|spe|stub|bg|newtab)/;
            if(newTabRE.test(tab.url)){
                //use this one
                try{
                    console.log('t: reloadNewTab (active) - "%s", tab.id: %s', fragment, Toolbar.newTabId);
                    chrome.tabs.update(tab.id, {url: 'chrome://newtab/#' + fragment});
                }catch(err){
                    console.log('t: reloadNewTab - "%s", tab.id: %s failed', fragment, Toolbar.newTabId);
                    console.log('t: Err: %s', err.message);
                }

            } else if (Toolbar.newTabId){
                console.log('t: reloadNewTab (not active) - "%s" - tab.id: %s', fragment, Toolbar.newTabId);
                try{
                    chrome.tabs.update(Toolbar.newTabId, {url: 'chrome://newtab/#' + fragment});
                } catch (err){
                    console.log('t: Err: %s', err.message);
                    Toolbar.newTabId = null;
                    console.log('t: reloadNewTab (not active with Error) - "%s", need to openNewTab', fragment);
                    Toolbar.openNewTab.apply(Toolbar, args);
                }
            } 
            else {
                console.log('t: reloadNewTab - "%s", need to openNewTab', fragment);
                Toolbar.openNewTab.apply(Toolbar, args);
            }
            
        });

        
    },

	installState: (function createInstallState() {
		var lastKnownVersion = Global.retrieve('last_known_version'),
			isNewInstall = false,
			isUpgrade = false;

		// If there is not a known version, this is a new install
		if (!lastKnownVersion) {
			isNewInstall = true;
            Global.store('first_known_version', config.version);
		}
		// If the version has been changed, this is an upgrade
		else if (lastKnownVersion !== config.version) {
			isUpgrade = true;

            if (!Global.retrieve('first_known_version')) {
                Global.store('first_known_version', lastKnownVersion);
            }
		}


		// Update the last known version
		Global.store('last_known_version', config.version);

		return {
			isNewInstall: function() {
				return isNewInstall;
			},

			isUpgrade: function() {
				return isUpgrade;
			},
            firstKnownVersion: Global.retrieve('first_known_version'),
            lastKnownVersion: Global.retrieve('last_known_version')
		};
	}()),

	showSuccessfulInstallationPage: function showSuccessfulInstallationPage(){
        console.log('T: showSuccessfulInstallationPage()');

        if (Toolbar.installState.isNewInstall()) {
            console.log('T: showSuccessfulInstallationPage - isNewInstall');
            Toolbar.loadPostInstallSuccessPage();
        }
        else if (Toolbar.installState.isUpgrade()) {
            console.log('T: showSuccessfulInstallationPage - isUpgrade');
        }
        else {
            console.log('T: showSuccessfulInstallationPage - else');
        }
    },

    // Load the installPageURI into an existing tab if the existing tab is on the installPageURI
    // domain, install domain, or instruction page domain
	loadPostInstallPage: function loadPostInstallPage(installPageURI, callback) {
        var useExistingTab = false,
            instructionsUrl = Common.getInstructionsUrl(),
            instructionsDomain = Common.extractDomain(instructionsUrl),
            installPageDomain = Common.extractDomain(installPageURI),
            domainsForExistingTab = [ config.domain, instructionsDomain, installPageDomain ];

        callback = callback || function() {};

        var navigateTab = function(tab) {
            chrome.tabs.update(
                tab.id,
                {
                    url: paramReplacer.replaceParams(installPageURI, tab),
                    active: true
                },
                function(tab) {
                    callback(tab);
                }
            );
        };

        chromeUtils.tabs.getAllInWindow(null, function(tabs) {
            for (var j = 0; j < domainsForExistingTab.length && !useExistingTab; j++) {
                var existingDomain = domainsForExistingTab[j];

                for (var i = 0; i < tabs.length; i++) {
                    var tab = tabs[i];

                    if (tab.url.indexOf(existingDomain) > -1) {
                        navigateTab(tab);
                        useExistingTab = true;
                        break;
                    }
                }
            }

            // We could not find a tab to reuse - open URI in new tab.
            if (!useExistingTab) {
                chrome.tabs.create({}, function(tab) {
                    navigateTab(tab);
                });
            }
        });
    },

	loadPostInstallSuccessPage: function loadPostInstallSuccessPage() {
        if (Common.getBuildVars().noSuccessPage || Global.retrieve('noSuccessPage') === 'true'){
            console.log('T: noSuccessPage overrides display of success page');
        }else{
            var successUrl = Global.retrieve('successUrl') || config.installSuccess;

            Toolbar.loadPostInstallPage(successUrl);
        }
    },

    initializeNewTabURLRegEx: function initializeNewTabURLRegEx(){
        var manifest = chrome.runtime.getManifest(),
            chrome_url_overrides = manifest.chrome_url_overrides || {newtab: ''},
            newTabInManifest = chrome_url_overrides.newtab,
            convertUrlListToRegExp = function(originalList){
                console.log('t: convertCompetitorListToRegExp(%s)', originalList);
                var specialCharsRegEx = /([\\\/\[\]^$\.()*+?|{}])/g,
                    escapeIt = function(match, p1, offset, string){
                        return '\\' + p1;
                    },
                    regexList = [];

                for (var i = 0, len = originalList.length; i < len; ++i){
                    regexList.push('(' + originalList[i].replace(specialCharsRegEx, escapeIt) + ')');
                }

                var str = regexList.join('|'),
                    regex = new RegExp(str);

                console.log('t: convertUrlListToRegExp - regex str: %s', str);

                return regex;
            },
            urls = ['chrome://newtab/'];

        if (newTabInManifest){
            urls.push('chrome-extension://' + chrome.runtime.id + '/' + newTabInManifest);
        }else{
            console.log('t: chrome.runtime.getManifest(): %O', chrome.runtime.getManifest());
        }

        var regex = convertUrlListToRegExp(urls);

        this.newTabRE = regex;
    },

    isNewTabURL: function isNewTabURL(url){
        return this.newTabRE.test(url);
    },

	isToolbarEnabled: function isToolbarEnabled(url, tab, callback) {
        if (Common.isNull(tab)){
            !0?1:console.log('t: isToolbarEnabled(%O) - !tab', arguments);
            callback(false);
        }else if (Common.showToolbarOnNewTab() && this.isNewTabURL(url)){
            !0?1:console.log('t: isToolbarEnabled(%O) - is new tab', arguments);
            chrome.windows.get(tab.windowId, function(window) {
                // Do not show the toolbar in popup windows
                callback(Common.isNotNull(window) && window.type !== 'popup');
            });
        }else if (Common.showToolbarOnNormalPages() && this.isSupportedScheme(tab.url) && !BlackListService.isUrlBlacklisted(url)){
            !0?1:console.log('t: isToolbarEnabled(%O) - is normal page', arguments);
            chrome.windows.get(tab.windowId, function(window) {
                // Do not show the toolbar in popup windows
                callback(Common.isNotNull(window) && window.type !== 'popup');
            });
        }else{
            !0?1:console.log('t: isToolbarEnabled(%O) - is not supported, showToolbar: %s', arguments, Common.getShowToolbar());
            callback(false);
        }
	},

	updateBrowserAction: function updateBrowserAction(tab) {
		// The toolbar should be disabled on this tab if we do not support the URL scheme,
		// or if the domain is on the global blacklist.
        if (!chrome.browserAction || !chrome.browserAction.setIcon || Common.showToolbarNowhere() || Common.showToolbarOnNewTab()){
          //nop
        } else if (!this.isSupportedScheme(tab.url) || globalBlacklistService.isUrlBlacklisted(tab.url)) {
			chrome.browserAction.setIcon({tabId: tab.id, path: 'icons/icon19disabled.png'});
			chrome.browserAction.setTitle({tabId: tab.id, title: this.name + ' is disabled on this page'});

		} else {
			var blacklisted = BlackListService.isUrlBlacklisted(tab.url);
			var title;
			if (blacklisted) {
				title = 'Enable ' + this.name; // + ' for ' + domain;
			} else {
				title = 'Disable ' + this.name; // + ' for ' + domain;
			}
			chrome.browserAction.setIcon({tabId: tab.id, path: 'icons/icon19on.png'});
			chrome.browserAction.setTitle({tabId: tab.id, title: title});
		}
	},

	isSupportedScheme: function isSupportedScheme(url) {
		var scheme = Common.extractScheme(url);

		return scheme === 'http:' || scheme === 'https:';
	},

    /**
     * parses the install date into an object
     * @param datestr {string} expected format YYYYMMDDhh
     * @returns Date
     */
    parseInstallDate: function (datestr) {
        var params = [];
        for (var i = 0, j = 4, k = datestr.length; i < k; i = j, j += 2) {
			params.push(parseInt(datestr.slice(i, j), 10));
        }
		// Install date does not contain timezone information. Assume user timezone
        return (function(year, month, day, hours){return new Date(year, month, day, hours)}).apply(null, params);
    },

	startActivePing: function startActivePing() {
		function useDefaultWhenEmpty(value, defaultValue){
			return value || defaultValue;
		}
        var _self = this;
        chrome.management.getSelf(function (ext) {

            Common.callActiveUrl(
                {
                    toolbarId: Global.getToolbarId(),
                    partnerId: Global.getPartnerId(),
                    partnerSubId: Global.getPartnerSubId(),
                    installDate: new DateWrapper(_self.parseInstallDate(Global.getInstallDate())),
                    toolbarVersion: config.version,
                    buildDate: new DateWrapper(new Date(config.buildDate)),
                    defaultSearchState: Global.retrieve("defaultSearchState"),
                    isStore: Common.isChromeStore,
                    tabEnabled: Global.retrieve('disableTabTakeover') === 'false',
                    coid: useDefaultWhenEmpty(Global.retrieve('coId'), ''),
                    userSegment: useDefaultWhenEmpty(Global.retrieve('userSegment'), ''),
                    random: function () {
                        return Common.randomInt()
                    },
                    extension: ext,
                    browser: {
                        name: 'chrome',
                        type: 'CR'
                    },
                    parentToolbarId: function() {
                        try {
                            var syncParentToolbarId = Mindspark_Global.getValue('syncParentToolbarId');
                            if (!syncParentToolbarId || syncParentToolbarId.id === 'undefined' || /^other/i.test(syncParentToolbarId.source)) {
                                return null;
                            } else if (/^dlp/i.test(syncParentToolbarId.source)) {
                                return syncParentToolbarId.id;
                            } else {
                                return 'n_a';
                            }
                        } catch(e) {
                            console.error(e);
                            return 'error';
                        }
                    },
                    otherToolbarId: function() {
                        try {
                            var syncParentToolbarId = Mindspark_Global.getValue('syncParentToolbarId');
                            if (syncParentToolbarId && /^other/i.test(syncParentToolbarId.source) && syncParentToolbarId.id !== 'undefined') {
                                return syncParentToolbarId.id;
                            } else {
                                return 'n_a';
                            }
                        } catch(e) {
                            console.error(e);
                            return 'error';
                        }
                    }
                },
                {
                    interval: config.pingInterval,
                    checkInterval: config.checkInterval,
                    getLastPing: function () {
                        return Global.retrieve('lastActivePing');
                    },
                    setLastPing: function () {
                        Global.store('lastActivePing', new Date().getTime());
                    }
                }
            );
        });
	},

    updateAll: function updateAll(domain, blacklisted) {
		var self = this,
			command = blacklisted ? 'TURNOFF' : 'TURNON';

		chromeUtils.tabs.getAllInWindow(
			{ windowType: 'normal' },
			function(tabs) {
				_.forEach(tabs, function(tab, index, list) {
					// TODO: If we support domain level blacklisting, we will need to wrap the following
					// two lines in this condition: if (Common.extractDomain(tab.url) == domain) { ... }
					if (!globalBlacklistService.isUrlBlacklisted(tab.url)) {
						self.updateBrowserAction(tab);
						chrome.tabs.sendRequest(tab.id, { cmd: command, installTimestamp: Global.getInstallTimestamp() });
					}
				});
			}
		);
	},

	findWidget: function findWidget(id) {
		for (var i = 0; i < this.widgets.length; i++) {
			var w = this.widgets[i];
			if (w.id === id)
				return w;
		}
		return null;
	},

	createHtml: function createHtml(tab) {
		var widgets = this.widgets,
			rightSideWidgets = this.rightSideWidgets,
			rightSideHTML = "",
			widget,
			html = "",
			scrollableHtml = "",
            toolbarStyle = localStorage.getItem('toolbarStyle'),
            render = function render(widget){
                return widget.hiddenWidget ? '' : widget.render(tab);
            };

		for (var i = 0; i < this.widgets.length; i++) {
			widget = widgets[i];

            if (widget.beginScrollableArea) {
                !0?1:console.log('t: beginScrollableArea: %O', widget);
				scrollableHtml += '<div id="scrollable-area"><div id="scrollable-inner">' + render(widget);
				this.isScrollable = true;
            } else if (scrollableHtml) {
                !0?1:console.log('t: is scrollableHtml: %O', widget);
				scrollableHtml += render(widget);
			} else {
                !0?1:console.log('t: else: %O', widget);
				html += render(widget);
			}
		}

		var arrowContainerHTML = '<div id="arrow-container"><button id="scroll-left" class="scroll left" disabled></button><button id="scroll-right" class="scroll right"></button></div>';

		if (rightSideWidgets.length) {
			rightSideHTML = '<div id="rightSide-container">';

			for (i = 0; i < rightSideWidgets.length; i++) {
				widget = rightSideWidgets[i];

				rightSideHTML += widget.render(tab);
			}

			rightSideHTML += '</div>';
		}

        var style = toolbarStyle ? '<style type="text/css">' + toolbarStyle + '</style>' : '',
            searchArea = '<div id="search-area"' + (Common.hideTBSearch() ? ' style="display:none;"' : '') + '>';

		html = style
            + searchArea
			+ html
			+ '</div><div id="widget-content">'
			+ rightSideHTML
			+ arrowContainerHTML
			+ scrollableHtml + '</div></div>';

        !0?1:console.log('t: html: %s', html);
		this.html = html;
	},

	isDetectEnabledDomain: function isDetectEnabledDomain(domain) {
		for (var i = 0; i < this.detectDomains.length; i++) {
			var detectDomain = this.detectDomains[i];
			if (domain.charAt(0) !== '.') {
				domain = '.' + domain;
			}
			if (domain.length >= detectDomain.length &&
					(domain.substring(domain.length - detectDomain.length) === detectDomain)) {
				return true;
			}
		}
		return false;
	},

	handlePixelUrl: function handlePixelUrl(pixelUrl){
        console.log('T: handlePixelUrl(%s)', pixelUrl);
        if (!pixelUrl) return;
        try{
            console.log('T: handlePixelUrl(%s) - creating and loading iframe', pixelUrl);
            var frame = document.createElement("iframe");
            frame.setAttribute('src', pixelUrl);
            document.documentElement.appendChild(frame);
        }catch(e){
            console.warn(e.message || e);
        }
    },
    setupGlobals : function() {
        //Initializing Platform Dependency Globals - PIDM

        Mindspark_Global.setErrorRecorder(function (err) {
            console.error('t: Mindspark_Global caught: %s, stack: %s', err.message, err.stack);
        });
        Mindspark_Global.setTracer(function(){
            if (arguments.length > 0){
                arguments[0] = 't: ' + arguments[0];
            }
            console.debug.apply(console, arguments);
        });
        var toolbarData= JSON.parse(Global.retrieve('dlpToolbarData'));

        //Initializing Platform Independent Dependency Management - PIDM
        Mindspark_Global.setValue('underscore', _);
        Mindspark_Global.setValue('searchSuggestLocale.config', {
            supportedLocales: Common.getBuildVars().localizedSearchSuggestSupportedLanguages,
            defaultLocale: Common.getBuildVars().localizedSearchSuggestDefaultLanguage
        });

        Mindspark_Global.setValue('installationInfo', {});
        Mindspark_Global.setValue('toolbarData', toolbarData);
        Mindspark_Global.setValue('UL.eventURL', Common.unifiedLoggingPixelUrl);

        Mindspark_Global.setValue('firstKnownVersion', this.installState.firstKnownVersion);

    }
};

(function(){
    var toolbarDataProperties = ['toolbarId', 'partnerId', 'partnerSubId', 'installDate',
            'homePageOption', 'homePage', 'defaultSearchOption', 'defaultSearch',
            'installType', 'pixelUrl', 'successUrl', 'dlput', 'overrideNewTab',
            'chromeShowToolbar', 'chromeHideToolbarSearch', 'chromeToolbarStyleSheet',
            'newTabCache', 'newTabURL', 'newTabBubbleURL', 'newDownloadURL',
			'coId', 'userSegment', 'uninstallSurveyUrl'],
        propertyNameMap = {
            'overrideNewTab': 'disableTabTakeover'
        },
        isValidValue = function(value){
            var type = typeof value;
            return type != 'undefined' && value !== 'undefined' && value !== 'null' && value !== null;
        },
        persist = function persist(name, toolbarData){
            var toName = propertyNameMap[name] || name,
                setName = 'set' + toName.charAt(0).toUpperCase() + toName.substr(1),
                value = toolbarData[name];
            if (isValidValue(value)){
                (setName in Global) ? Global[setName](value) : Global.store(toName, value);
            }
        },
        persistAll = function(toolbarData){
            for (var i = 0, len = toolbarDataProperties.length; i < len; ++i){
                persist(toolbarDataProperties[i], toolbarData);
            }
            console.log('t: persisting dlpToolbarData from dlp as: %O', toolbarData);
            Global.store('dlpToolbarData', JSON.stringify(toolbarData));
        },
        retrieve = function retrieve(name, toolbarData){
            var fromName = propertyNameMap[name] || name,
                getName = 'get' + fromName.charAt(0).toUpperCase() + fromName.substr(1),
                value = getName in Global ? Global[getName]() : Global.retrieve(fromName);
            if (isValidValue(value)){
                toolbarData[name] = value;
            }
        },
        retrieveAll = function(){
            var toolbarData = Global.retrieve('dlpToolbarData');
            if (!toolbarData){
                toolbarData = {};
                for (var i = 0, len = toolbarDataProperties.length; i < len; ++i){
                    retrieve(toolbarDataProperties[i], toolbarData);
                }
                console.log('t: persisting dlpToolbarData from toolbar as: %O', toolbarData);
                Global.store('dlpToolbarData', JSON.stringify(toolbarData));
            }
		},
		saveDlpCountryCode = function(countryCode){
			if (countryCode){
				console.log('t: saving dlpCountryCode: %s', countryCode);
				Global.store('dlpCountryCode', countryCode);
			}else{
				console.log('t: clearing dlpCountryCode: %s');
				Global.remove('dlpCountryCode');
			}
		},
		haveDlpCountryCode = function(){
			return !!Global.retrieve('dlpCountryCode');
		},
		setupExternalStyling = function(isNewInstall){
			Toolbar.setupExternalStyling(function installCallback(){
				Toolbar.initialize(config, imageWidths, isNewInstall);
				Global.postMessage(isNewInstall ? 'toolbar:installed' : 'toolbar:initialized');
			});
		};


    //If the toolbar id is not set, read it from the cookies
    if (!Global.isToolbarIdSet()) {
        Global.postMessage('toolbar:installing');
        ToolbarCookieParser.getToolbarInfo(
            config.domain,
            config.defaultPartnerId,
            function getToolbarData(toolbarData, countryCode) {

                persistAll(toolbarData);
				saveDlpCountryCode(countryCode);

                Toolbar.handlePixelUrl(toolbarData.pixelUrl);
				setupExternalStyling(true);

                Mindspark_Global.setValue('toolbarId', {id: toolbarData.toolbarId, source: toolbarData.toolbarIdSource});
            }
        );
    } else {
        retrieveAll();
		Global.postMessage('toolbar:initializing');
		if (haveDlpCountryCode()){
			setupExternalStyling(false);
		}else{
			// need to retrieve the DLP countryCode when missing
			ToolbarCookieParser.getFromLocalStorage(
				Common.localStorageCommunicationUrl,
				null,
				function(toolbarDataIgnored, countryCode) {
					saveDlpCountryCode(countryCode);
					setupExternalStyling(false);
				}
			);
		}
    }
})();
