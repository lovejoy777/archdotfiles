function handleApplications() {

	var $menu = $('#app-context-menu'),
		$menuButtons = $('menu button');

	$menuButtons.bind(
		'mouseover',
		function(e) {
			$menuButtons.removeAttr('selected');

			$(this).attr('selected', 'selected');
		}
	);

	// Remove the context menu if the user clicks outside of it
	$(window).click(function() {

		$menuButtons.removeAttr('selected');

		$menu.hide();

	});

	var update = function() {
	    chrome.management.getAll(function(extensionInfos) {
	        var applications = [];

	        for (var i = 0; i < extensionInfos.length; i++) {
	            if (extensionInfos[i].isApp) {
	                var appInfo = extensionInfos[i];
	                var app = {id: appInfo.id, name: appInfo.name, launchUrl: appInfo.appLaunchUrl};
	                //Not all applications have an options page
	                if (Common.isNotEmpty(appInfo.optionsUrl)) {
	                    app.optionsUrl = appInfo.optionsUrl;
	                }
	                //Find the largest icon
	                var icons = appInfo.icons;
	                if (icons) {
	                    var largestSize = 0;
	                    var smallIconSize = 1000000;
	                    var smallIcon = null;
	                    var icon = null;

	                    for (var j = 0; j < icons.length; j++) {
	                        var size = icons[j].size;
	                        if (size > largestSize) {
	                            largestSize = size;
	                            icon = icons[j].url;
	                        }
	                        if (size < smallIconSize && size >= 16) {
	                            smallIconSize = size;
	                            smallIcon = icons[j].url;
	                        }
	                    }
	                    if (icon != null) {
	                        app.iconUrl = icon;
	                    }
	                    if (smallIcon != null) {
	                        app.smallIconUrl = smallIcon;
	                    }
	                }

	                applications.push(app);
	            }
	        }

			applications.push(
				{
					iconUrl: "/images/IDR_WEBSTORE_ICON.png",
					id: "webstore",
					launchUrl: "https://chrome.google.com/webstore?hl=en-US",
					name: "Web Store",
					smallIconUrl: "/images/IDR_PRODUCT_LOGO_16.png",
					nocontextmenu: true
				}
			);

			render(applications.reverse());
	    });
	};

	var render = function(apps) {
		var $apps = $('#apps').html(''),
			app,
			html,
			$html,
			i;

		var contextMenuHandler = function(e) {
			var app = $(this).data('app'),
				$options = $menu.find('button.options');

			if (app.nocontextmenu) {
				return true;
			}

			$menuButtons.removeAttr('selected');

			$menu
				.css(
					{
						"left": e.clientX,
						"top": e.clientY
					}
				)
				.show()
				.find('button.launch').text(app.name);

			$menu.find('button.launch').unbind('click').click(
				function(e) {
	                chrome.management.launchApp(app.id);
				}
			);

			if (app.optionsUrl) {
				$options
					.removeAttr('disabled')
					.unbind('click')
					.click(
						function(e) {
							window.location.href = app.optionsUrl;
						}
					);
			} else {
				$options.attr('disabled', 'disabled')
			}

			$menu.find('button.uninstall').unbind('click').click(
				function(e) {
					chrome.management.uninstall(app.id);
				}
			);

			return false;
		};

		for (i = 0; i < apps.length; i += 1) {
			app = apps[i];

			// html will become more complicated down the line
			html = '<a id="' + app.id + '" href="' + app.launchUrl + '" class="app">' + Common.encodeForHTML(app.name) + '</a>';

			$html = $(html);

			$html
				.css('background-image', 'url(' + app.iconUrl + ')')
				.bind('contextmenu', contextMenuHandler)
				.data('app', app)
				.click(
					function(e) {
						var app = $(this).data('app');

						if (app.nocontextmenu) {
							return true;
						}

						chrome.management.launchApp(app.id);

						return false;
					}
				);

			$apps.prepend($html);
		}
	};

	update();

    chrome.management.onInstalled.addListener(update);
    chrome.management.onUninstalled.addListener(function(id) {
        if (chrome.i18n.getMessage("@@extension_id") != id) {
            update();
        }
    });
}

function handleWindowResize() {
	var jSearchFor = $('#searchfor'),
		searchContainerWidth = $('#searchFields').width(),
		searchButtonOuterWidth = $('#submitSearch').outerWidth(),
		searchBoxOffsetWidth = jSearchFor.outerWidth() - jSearchFor.width(),
		pxForOverlap = 1;

	jSearchFor.css('width', searchContainerWidth - searchButtonOuterWidth - searchBoxOffsetWidth + pxForOverlap);
}

var init = function() {
	var domBackgroundWindow = chrome.extension.getBackgroundPage(),
		domDisableTabTakeover = $('#disableTabTakeover'),
		domSettings = $('#settings'),
		searchUrlDomain = Common.extractDomain(Common.searchUrl),
		searchProviderClassName = "";

	window.addEventListener('resize', handleWindowResize);
	handleWindowResize();

	// Update footer logo
	if (searchUrlDomain.indexOf('mywebsearch') > -1) {
		searchProviderClassName = "mws";
	} else if (searchUrlDomain.indexOf('ask') > -1) {
		searchProviderClassName = "ask";
	}

	if (searchProviderClassName) {
		$('body').addClass(searchProviderClassName);
	}

	domSettings.click(function(event) {
		unifiedLogging.logClick("settings");
	});

	domDisableTabTakeover.click(function(event) {
		unifiedLogging.logClick("disable");

        Global.store('disableTabTakeover', true);
        chrome.tabs.getCurrent(function(tab) {
            chrome.tabs.update(tab.id, {url: 'chrome-internal://newtab/'});
        });

		event.preventDefault();
    });

	var domTabSearch = document.getElementById('tabSearch'),
		domSearchFor = document.getElementById('searchfor');

	// Focus the search box. Note that Chrome currently forces the focus to
	// the omnibox and there does not appear to be a way to circumvent that
	domSearchFor.focus();

	domTabSearch.addEventListener('submit', function(event) {
		var val = domSearchFor.value;

		if (val !== null && Common.trim(val) !== '') {
			var searchUrl = Common.getSearchUrl(
				val,
				"tab",
				Global.getToolbarId(),
				Global.getPartnerId(),
				Global.getPartnerSubId(),
				Global.getInstallDate()
			);

			window.location.href = searchUrl;
		}

		event.preventDefault();
	}, false);

	ssloaded();

	var expandApps = Global.retrieve('supertab_apps_expanded');

	if (expandApps && expandApps == 'true') {
		$('#appsSection').removeClass('collapsed');
	}

    var populateArea = function(dataList, node) {
        for (var i = 0; i < dataList.length; i++) {
            var url = dataList[i].url;

            var item = document.createElement('li');
            var link = document.createElement('a');

            link.setAttribute('href', url);
            var favIcon = document.createElement('img');
            favIcon.setAttribute('class', 'favicon');
            var favIconUri = dataList[i].favIcon;
            if (!favIconUri) {
                favIconUri = 'chrome://favicon/' + url;
            }
            favIcon.setAttribute('src', favIconUri);
            var label = document.createElement('label');
            var labelText = dataList[i].title;
            if (!labelText) {
                labelText = url;
            }
            label.innerText = labelText;

            link.appendChild(favIcon);
            link.appendChild(label);
            item.appendChild(link);
            node.appendChild(item);
        }
    };

	populateArea(domBackgroundWindow.NewTabInfo.mostPopularSites, document.getElementById('mostVisited'));
	populateArea(domBackgroundWindow.NewTabInfo.getRecentlyClosedTabs(), document.getElementById('recentlyClosed'));

	// App section handling
	handleApplications();

	$('section.toggle header').click(function(e) {
		var $section = $(this).parent(),
			collapsedClass = 'collapsed',
			collapsed = $section.hasClass(collapsedClass);

		if (collapsed) {
			$section.removeClass(collapsedClass);
		} else {
			$section.addClass(collapsedClass);
		}

		Global.store('supertab_apps_expanded', collapsed);
	});

	// Log page view
	unifiedLogging.logEvent(unifiedLogging.EVENTS.TABPAGEVIEW, {
		controlID: "chrome-orig"
	});
};

window.addEventListener('load', function() {
	var domBackgroundWindow = chrome.extension.getBackgroundPage();

	if (domBackgroundWindow.document.readyState === 'complete') {
		init();
	}
	else {
		domBackgroundWindow.addEventListener('load', function() {
			init();
		});
	}
});
