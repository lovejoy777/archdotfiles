window.util || (window.util = {});

window.config || (window.config = {});

config.DisplayMode = {
	Full: 'full',
	Text: 'text',
	Thumbnail: 'thumbnail',
	Title: 'title',
	Video: 'video',
	Gallery: 'gallery', // display thumbnails plus title

	isValid: function(s) {
		var self = config.DisplayMode;
		return s == self.Full || s == self.Text || s == self.Thumbnail || s == self.Title;
	}
};

config.LayoutMode = {
	Standard: 'standard',
	Menu: 'menu',

	isValid: function(s) {
		var self = config.LayoutMode;
		return s == self.Standard || s == self.Menu;
	}
};

var RssWidget = {
	init: function() {
		RssWidget.config.init(function(){
            // Initialize UI.
            var ui = RssWidget.ui;
            ui.init();

            // Set title.
            var title = RssWidget.config.getTitle() || '';
            var titleText = RssWidget.ui.titleText;
            while (titleText.firstChild) {
                titleText.removeChild(titleText.firstChild);
            }
            titleText.appendChild(document.createTextNode(title));

            // Set title icon.
            var titleIcon = RssWidget.ui.titleIcon;
            addEvtListener(titleIcon, 'error', function() {
                // todo: Use default title icon.
            });
            titleIcon.src = RssWidget.config.getTitleIconUri();
            titleIcon.setAttribute('src', titleIcon.src);

            // Set Powered by text.
            var poweredByAnchors = [ui.tabsPoweredByAnchor, ui.titlePoweredByAnchor];
            var poweredByDivs = [ui.titlePoweredBy, ui.tabsPoweredBy];
			var poweredByImg = RssWidget.config.getPoweredByImg();

            for (var k = 0; k < poweredByAnchors.length; k++) {
                var poweredByAnchor = poweredByAnchors[k];
                while (poweredByAnchor.firstChild) {
                    poweredByAnchor.removeChild(poweredByAnchor.firstChild);
                }

	            if (RssWidget.config.isPoweredBy()) {
		            /*var node = document.createTextNode(RssWidget.config.getPoweredBy());
		            poweredByAnchor.appendChild(node);*/

		            poweredByAnchor.innerHTML = RssWidget.config.getPoweredBy();

		            addEvtListener(poweredByAnchor, 'click', function() {
			            RssWidget.handleLinkClick(RssWidget.config.getPoweredByUri());
			            return false;
                    });
                }
                else {
                    var poweredByDiv = poweredByDivs[k];
                    poweredByDiv.className = 'hidden powered-by';
                    poweredByDiv.setAttribute('class', poweredByDiv.className);
                }
            }
			
			if (RssWidget.config.isPoweredBy() && poweredByImg) {
				ui.tabsPoweredByImg.innerHTML = '<img src="' + poweredByImg + '" />';

				addEvtListener(ui.tabsPoweredByImg, 'click', function() {
					RssWidget.handleLinkClick(RssWidget.config.getPoweredByUri());
				});
			}

            // Set additional CSS.
            var additionalCssUri = RssWidget.config.getAdditionalCssUri();
            if (additionalCssUri) {
                var additionalCss = document.createElement('link');
                additionalCss.setAttribute('type', 'text/css');
                additionalCss.setAttribute('rel', 'stylesheet');
                additionalCss.setAttribute('href', additionalCssUri);

                document.getElementsByTagName('head')[0].appendChild(additionalCss);
            }

            // Get RSS feed infos.
            var rssInfos = RssWidget.getRssInfos();
            if (!rssInfos || !rssInfos.length) {
                ui.showMisconfigured();
                return;
            }

            // Create an entry for each RSS info.
            for (var k = 0; k < rssInfos.length; k++) {
                var rssInfo = rssInfos[k];
                var tab = ui.addTab(rssInfo);
                rssInfo.tab = tab;
            }

            // Activate the first RSS.
            var firstRssInfo = rssInfos[0];
            RssWidget.showRss(firstRssInfo);
        });
	},

	close: function() {
		RssWidget.config.closeWindow();
	},

	// Retrieves the information about the RSS feeds to display from the
	// environment. Most of the time, the RSS information is provided as
	// parameters by the toolbar object.
	getRssInfos: function() {
		return RssWidget.config.getRssInfos();
	},

	handleListItemSelected: function(element) {
		var anchors = element.getElementsByTagName('a');
		if (anchors && anchors.length) {
			var titleAnchor = null;
			for (var k = 0; k < anchors.length; k++) {
				var anchor = anchors[k];
				if (anchor.getAttribute('class') == 'title') {
					titleAnchor = anchor;
					break;
				}
			}
			if (titleAnchor) {
				var href = titleAnchor.getAttribute('itemLink');
				return RssWidget.handleLinkClick(href);
			}
		}
	},

	handleLinkClick: function(uri) {
		RssWidget.config.handleLinkClick(uri);
		return true;
	},

	createThumbnailElement: function(item, rssInfo) {
		var imageEl = document.createElement('img');
		imageEl.className = 'transparent thumbnail';
		imageEl.setAttribute('class', imageEl.className);

		var thumbnailEl = document.createElement('div');
		thumbnailEl.className = '';
		thumbnailEl.setAttribute('class', thumbnailEl.className);
		thumbnailEl.appendChild(imageEl);

		if (rssInfo.imageWidth) {
			imageEl.style.width = rssInfo.imageWidth + 'px';
		}

		addEvtListener(imageEl, 'load', function() {
			if (rssInfo.imageWidth) {
				try {
					var resizeRatio = rssInfo.imageWidth / imageEl.width;
					var newHeight = imageEl.height * resizeRatio;

					imageEl.style.width = rssInfo.imageWidth + 'px';
					imageEl.style.height = newHeight + 'px';

				} catch (e) {
					// Do nothing. It is probably the case the the image is
					// no longer attached to the document.
				}
			}

			imageEl.className = 'thumbnail';
			imageEl.setAttribute('class', imageEl.className);
		});

		imageEl.src = item.imageUri;
		imageEl.setAttribute('src', imageEl.src);

		addEvtListener(imageEl, 'click', function() {
			RssWidget.handleLinkClick(item.uri);
		});

		return thumbnailEl;
	},

	createTitleElement: function(item) {
		var titleEl = document.createElement('a');
		titleEl.className = 'title';
		titleEl.setAttribute('class', titleEl.className);
		titleEl.setAttribute('itemLink', item.uri);
		//titleEl.appendChild(document.createTextNode(item.title));
		titleEl.innerHTML = item.title;

		addEvtListener(titleEl, 'click', function() {
			RssWidget.handleLinkClick(item.uri);
			return false;
		});

		return titleEl;
	},

	processText: function(text){
		return text.replace(/"\/\//ig, "\"http://");
	},

	updateContent: function(xml, rssInfo) {
		try {
            this.updateContentImpl(xml, rssInfo);

			var links = document.getElementsByClassName('handleLinkClick');

			for(var i = 0, j=links.length; i<j; i++){
				links[i].addEventListener('click', function() {
					var url = this.getAttribute('data-url');
					RssWidget.handleLinkClick(url);
				});
			}

        } catch (e) {
            this.ui.showError(e);
        }
    },

    updateContentImpl: function(xml, rssInfo) {
        var rss = util.Feed.parse(xml);
        var rssContent = RssWidget.ui.rssContent;
        while (rssContent.firstChild) {
            rssContent.removeChild(rssContent.firstChild);
        }

        var maximum = rssInfo.maximumNumberOfItems
	        ? Math.min(rssInfo.maximumNumberOfItems, rss.items.length)
	        : rss.items.length;

        // hack for youtube
        if (RssWidget.config.getDisplayMode() == config.DisplayMode.Video) {
            for (var k = 0; k < maximum; k++) {
                var item = rss.items[k];
	        	this.renderVideos(rssContent, item);
            }
        	RssWidget.ui.showRssContent();
        	return;
        }
	    
		// gallery display mode
        if (RssWidget.config.getDisplayMode() == config.DisplayMode.Gallery) {
            for (var k = 0; k < maximum; k++) {
                var item = rss.items[k];
	        	this.renderGallery(rssContent, item);
            }
        	RssWidget.ui.showRssContent();
        	return;
        }

        var tableBodyEl = document.createElement('tbody');
        var tableEl = document.createElement('table');
        tableEl.appendChild(tableBodyEl);

        rssContent.appendChild(tableEl);

        // Indicates whether any of the processed items has an associated
        // thumbnail.
        var thumbnailsPresent = false;

        for (var k = 0; k < maximum; k++) {
            var item = rss.items[k];

            // Update the flag indicating any thumbnails are present.
            thumbnailsPresent |= !!item.imageUri;

            var thumbnailEl = RssWidget.createThumbnailElement(item, rssInfo);
            var titleEl = RssWidget.createTitleElement(item);

            var descriptionEl = document.createElement('div');
            descriptionEl.className = 'description';
            descriptionEl.setAttribute('class', descriptionEl.className);
            //descriptionEl.appendChild(document.createTextNode(item.description));
            descriptionEl.innerHTML = RssWidget.processText(item.description) || '';

            var contentEl = document.createElement('div');
            contentEl.className = 'content';
            contentEl.setAttribute('class', contentEl.className);
            contentEl.appendChild(titleEl);
            contentEl.appendChild(descriptionEl);

            var thumbnailCellEl = document.createElement('td');
            thumbnailCellEl.className = 'thumbnail-cell';
            thumbnailCellEl.setAttribute('class', thumbnailCellEl.className);
            thumbnailCellEl.appendChild(thumbnailEl);

            var contentCellEl = document.createElement('td');
            contentCellEl.className = 'content-cell';
            contentCellEl.setAttribute('class', contentCellEl.className);
            contentCellEl.appendChild(contentEl);

            var itemEl = document.createElement('tr');
            var evenness = k % 2 ? 'even' : 'odd';
            itemEl.className = evenness + ' item';
            itemEl.setAttribute('class', itemEl.className);
            itemEl.appendChild(thumbnailCellEl);
            itemEl.appendChild(contentCellEl);

            tableBodyEl.appendChild(itemEl);
        }

        // If no images are present, indicate that with a special CSS class
        // which will cause each item's thumbnail area to be hidden.
        var tableElClassName = thumbnailsPresent ? '' : 'no-thumbnails';
        tableEl.className = tableElClassName;
        tableEl.setAttribute('class', tableEl.className);

        if (RssWidget.config.getLayoutMode() == config.LayoutMode.Menu) {
            // Enable list style interactions for all the items.
            util.ListInteraction.enable(tableBodyEl.childNodes, RssWidget.handleListItemSelected);
        }

        RssWidget.ui.showRssContent();
	},

	// from http://www.mywebface.com/menus/filmfanatic/live/affinity/youtube.html
	renderVideos: function(div, item){
		var username = item.author;

		var url = item.uri;

		//var url2 = videoNode.getElementsByTagName("author")[0].childNodes[1].text;

		var url2 = "http://www.youtube.com/user/" + encodeURIComponent(username);

		var div_currCond = "<div class='videoBlock floatLeft'>"

			+ "<div class='videoThumbnailDiv'><a href='#' class='handleLinkClick' data-url='" + url + "'>"

			+ "<img class='videoThumbnail' src='" + item.imageUri + "' /></a></div>"

			+ "<div class='videoTitle'> <a href='#' data-url='" + url + "' class='handleLinkClick'>"

			+ item.title + "</a></div>"

			+ "<div class='videoViewCounts'>"+ item.viewCount +" views</div> "

			+ "<div class='videoAuthor'> <a href='#' data-url='" + url2 + "' class='handleLinkClick'>"

			+ username +"</a></div> "

			+ "</div>";

		div.innerHTML += div_currCond;
	},

	// from www.mywebface.com/menus/widgets/filmfanatic/live/affinity/trailers.html
	renderGallery: function(div, item){

		var url = item.uri;
		var _div = 	"<div class='gallery floatLeft' >" +

			"<a href='#' class='handleLinkClick' data-url='" + url + "'>"+

			"<img class='thumbnail' src='" + item.imageUri +"' width='116' height='87' /></a>"+

			"<div class='feedTitle'>" +

				"<a href='#' class='handleLinkClick' data-url='" + url + "'>"+

					item.title +

				"</a>" +

			"</div>";/*+

			"</div><div class='space floatLeft'></div>";*/

		div.innerHTML += _div;
	},

	showRss: function(rssInfo) {
		rssInfo.tab.select();

		var ui = RssWidget.ui,
			poweredByAnchors = [ui.tabsPoweredByAnchor, ui.titlePoweredByAnchor],
			poweredByDivs = [ui.titlePoweredBy, ui.tabsPoweredBy],
			poweredBy = rssInfo.poweredBy;

		ui.showSpinner();

		// Support per-feed powered by display
		if (poweredBy) {
			for (var k = 0; k < poweredByAnchors.length; k += 1) {
				var poweredByAnchor = poweredByAnchors[k];

				while (poweredByAnchor.firstChild) {
					poweredByAnchor.removeChild(poweredByAnchor.firstChild);
				}

				/*var node = document.createTextNode(poweredBy.name);
				poweredByAnchor.appendChild(node);*/

				poweredByAnchor.innerHTML = poweredBy.name;

				addEvtListener(poweredByAnchor, 'click', function() {
					RssWidget.handleLinkClick(poweredBy.uri);
					return false;
				});

				poweredByDivs[k].className = 'powered-by';
			}
		}

		RssWidget.config.getResource({
			uri: rssInfo.uri,
			success: function(response) {
				RssWidget.updateContent(response.xml, rssInfo);
			},
			error: function(response) {
				RssWidget.ui.showError(response ? response.text : response);
			}
		});
	},

	ui: {
		numberOfTabs: 0,
		title: null,
		titleIcon: null,
		titleText: null,
		titlePoweredBy: null,
		titlePoweredByAnchor: null,
		closeButton: null,
		body: null,
		tabs: null,
		tabsPoweredBy: null,
		tabsPoweredByAnchor: null,
		content: null,
		rssContent: null,
		spinner: null,
		error: null,
		incompleteProcessMessage: null,
		selectedTab: null,
		tabsVisible: true,

		init: function() {
			// Inject and focus a text input to obtain keyboard focus.
			var input = document.createElement('input');
			input.type = 'text';
			input.setAttribute('type', input.type);
			input.style.position = 'absolute';
			input.style.left = '0';
			input.style.top = '0';

			document.body.appendChild(input);
            try {
    			input.focus();
            } catch (e) {
                // IE8 causes errors.
            }
			document.body.removeChild(input);

			var self = RssWidget.ui;
			var config = self.config;

			self.title = document.getElementById('title');
			self.titleIcon = document.getElementById('title-icon');
			self.titleText = document.getElementById('title-text');
			self.titlePoweredBy = document.getElementById('title-powered-by');
			self.titlePoweredByAnchor = document.getElementById('title-powered-by-anchor');
			self.closeButton = document.getElementById('close-button');
			self.body = document.getElementById('body');
			self.tabs = document.getElementById('tabs');
			self.tabsPoweredBy = document.getElementById('tabs-powered-by');
			self.tabsPoweredByAnchor = document.getElementById('tabs-powered-by-anchor');
			self.tabsPoweredByImg = document.getElementById('tabs-powered-by-img');
			self.content = document.getElementById('content');
			self.rssContent = document.getElementById('rss-content');
			self.spinner = document.getElementById('spinner');
			self.error = document.getElementById('error');
			self.incompleteProcessMessage = document.getElementById('incomplete-process-message');

			var bodyClassName
				= RssWidget.config.getDisplayMode() + '-display-mode '
				+ RssWidget.config.getLayoutMode() + '-layout';
			document.body.setAttribute('class', bodyClassName);
			document.body.className = bodyClassName;

			self.resize();
			self.hideTabs();

			addEvtListener(self.closeButton, "click", RssWidget.close);
		},

		hideTabs: function() {
			var self = RssWidget.ui;
			if (self.tabsVisible) {
				var width = self.tabs.offsetWidth;
				self.tabs.className = 'hidden';
				self.tabs.setAttribute('class', self.tabs.className);

				var newContentWidth = self.content.offsetWidth + width;
				self.content.style.width = newContentWidth + 'px';

				self.tabsVisible = false;

				// Because the tabs are no longer visible, neither is the
				// "Powered by" text. Show the title bar's "Powered by" text
				// instead.
				self.titlePoweredBy.className = 'powered-by';
				self.titlePoweredBy.setAttribute('class', self.titlePoweredBy.className);
			}
		},

		showTabs: function() {
			var self = RssWidget.ui;
			if (!self.tabsVisible) {
				self.tabs.className = '';
				self.tabs.setAttribute('class', self.tabs.className);

				var width = self.tabs.offsetWidth;

				var newContentWidth = self.content.offsetWidth - width;
				self.content.style.width = newContentWidth + 'px';

				self.tabsVisible = true;

				// Because the tabs are now visible, so is the "Powered by"
				// text. Hide the title bar's "Powered by" text, which is now
				// redundant.
				self.titlePoweredBy.className = 'hidden powered-by';
				self.titlePoweredBy.setAttribute('class', self.titlePoweredBy.className);
			}
		},

		clearContent: function() {
			var content = RssWidget.ui.content;
			while (content.firstChild) {
				content.removeChild(content.firstChild);
			}
		},

		showSpinner: function() {
			var self = RssWidget.ui;
			self.clearContent();
			self.content.appendChild(self.spinner);
		},

		showRssContent: function() {
			var self = RssWidget.ui;
			self.clearContent();
			self.content.appendChild(self.rssContent);
		},

		showError: function(error) {
			var self = RssWidget.ui;
			self.clearContent();
			self.content.appendChild(self.error);

            RssWidget.config.showError(error);
		},

		showMisconfigured: function() {
			var self = RssWidget.ui;
			self.clearContent();
			self.content.appendChild(self.incompleteProcessMessage);
		},

		resize: function() {
			var self = RssWidget.ui;

		    // Find the increase or decrease in width with respect to the current body size.
		    var availableWidth = window.innerWidth || document.documentElement.clientWidth;
		    var deltaWidth = self.body.clientWidth - availableWidth;

		    // Find the increase or decrease in height with respect to the current body size.
		    var availableHeight = window.innerHeight || document.documentElement.clientHeight;
		    //availableHeight -= self.title.clientHeight; alert(self.title.clientHeight);
		    var deltaHeight = self.body.clientHeight - availableHeight;

		    // Apply increase to body.
		    var newBodyWidth = availableWidth;
		    self.body.style.width = newBodyWidth + 'px';

		    var newBodyHeight = self.body.clientHeight - deltaHeight;
		    self.body.style.height = newBodyHeight + 'px';

		    // Apply width and height change to content.
		    var newContentWidth = self.content.offsetWidth - deltaWidth;
		    self.content.style.width = newContentWidth + 'px';

		    var newContentHeight = self.content.offsetHeight - deltaHeight;
		    self.content.style.height = newContentHeight + 'px';

		    if (self.tabsVisible) {
		    	// Apply height change to tabs. Tabs width never changes.
		    	var newTabsHeight = self.tabs.clientHeight - deltaHeight;
		    	if (newTabsHeight < 0) {
		    		// Tabs are probably not visible because we're in menu
		    		// mode. Don't bother to update the height.
		    	} else {
		    		self.tabs.style.height = newTabsHeight + 'px';
		    	}
		    }
		},

		addTab: function(rssInfo) {
			var self = RssWidget.ui;

			var icon = document.createElement('img');
			if (rssInfo.iconUri) {
				icon.src = rssInfo.iconUri;
				icon.setAttribute('src', icon.src);
			}

			var name = document.createElement('span');
			name.appendChild(document.createTextNode(rssInfo.name));

			var el = document.createElement('div');
			el.appendChild(icon);
			el.appendChild(name);

			self.tabs.insertBefore(el, self.tabsPoweredBy);

			self.numberOfTabs += 1;
			if (self.numberOfTabs > 1) {
				self.showTabs();
			}

			return new RssWidget.Tab(el, rssInfo);
		}
	},

	Tab: function(element, rssInfo) {
		var selected = false;
		var mouseOver = false;

		var updateClassName = function() {
			var c = 'tab';
			if (selected) {
				c = 'selected ' + c;
			}
			if (mouseOver) {
				c = 'hover ' + c;
			}
			element.className = c;
			element.setAttribute('class', element.className);
		};

		var handleClick = function() {
			RssWidget.showRss(rssInfo);
		};

		var handleMouseOver = function() {
			mouseOver = true;
			updateClassName();
		};

		var handleMouseOut = function() {
			mouseOver = false;
			updateClassName();
		};

		addEvtListener(element, 'click', handleClick);
		addEvtListener(element, 'mouseover', handleMouseOver);
		addEvtListener(element, 'mouseout', handleMouseOut);

		this.select = function() {
			var t = RssWidget.ui.selectedTab;
			t && t.deselect();

			selected = true;
			updateClassName();

			RssWidget.ui.selectedTab = this;
		};

		this.deselect = function() {
			selected = false;
			updateClassName();
		};

		this.deselect();
	}
};

addEvtListener(window, 'load', RssWidget.init);
addEvtListener(window, 'resize', RssWidget.ui.resize);

