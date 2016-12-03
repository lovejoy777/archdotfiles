var Toolbar = {
	initialized: false,
	toolbarDiv: null,
	toolbarHtml: "",
	toolbarReady: false,
	selButtonId: "",
	extensionId: window.name,
	visibleWidgets: [],
	hiddenWidgetsRight: [],
	hiddenWidgetsLeft: [],
	searchBoxConfig: null,
	existingSearchBoxQuery: "",
	searchAreaWidth: 0,
	searchBoxWidth: 0,
    hasDynamicIcon: false,

	getTargetInfo: function(event, getAbsolutePosition) {
		var self = this,
			id = null,
			target = event.target,
			isToolbarButton,
			overflow;

		while (target != null && target != self.toolbarDiv && id == null) {
			// Targets with ids can be ignored by specifying the "ignore-click" class
			if ((target.id != null && target.id.length > 0)
					&& !Common.hasClass(target, 'ignore-click')) {

				isToolbarButton = Common.hasClass(target, 'toolbar-item');

				if (isToolbarButton) {
					overflow = target.Mindspark_overflow;
				}
				// If this isn't a toolbar button, perhaps it is a child of one.
				// Find the parent toolbar button and check its overflow property.
				else {
					var $parentToolbarButton = $(target).parents('.toolbar-item');

					if ($parentToolbarButton.length) {
						overflow = $parentToolbarButton.get(0).Mindspark_overflow;
					}
				}

				return {
					name: target.id,
					overflow: !!overflow,
					rectangle: self.getRectangle(target, getAbsolutePosition),
					view: {
						left: window.screenLeft,
						top: window.screenTop,
						innerHeight: window.innerHeight,
						outerHeight: window.outerHeight
					},
					clazz: target.className
				};
			} else {
				target = target.parentNode;
			}
		}

		return null;
	},

	getRectangle: function(element, getAbsolutePosition) {
		if (!element) {
			return -1;
		}

		var self = this,
			rectangle,
			parent = element.parentNode,
			left,
			top;

		// elements with this custom class inherit the coords of its parent, specifically for buttons with items.
		if (Common.hasClass(element, 'use-parent-coords')) {
			element = parent;

			parent = element.parentNode;
		}

		left = element.offsetLeft;
		top = element.offsetTop;

		if (getAbsolutePosition && self.isScrollable && getComputedStyle(parent).getPropertyValue('position') === 'relative') {
			var dom_scrollableInner = document.getElementById('scrollable-inner'),
				innerLeft = parseInt(dom_scrollableInner.style.left || getComputedStyle(dom_scrollableInner).getPropertyValue('left'), 10);

			//console.log('tUI: style.left: %s, getComputedStyle(dom_scrollableInner).getPropertyValue(left): %s', dom_scrollableInner.style.left,getComputedStyle(dom_scrollableInner).getPropertyValue('left'));
			left += parent.parentNode.offsetLeft + innerLeft;
		}

		rectangle = {
			top: top,
			left: left,
			height: element.offsetHeight,
			width: element.offsetWidth
		};
		//console.log('tUI: getRect(%s) returns (%s,%s,%s,%s)', element.id, rectangle.top, rectangle.left, rectangle.height, rectangle.width);

		return rectangle;
	},

	getSearchBoxDimensions: function() {
		var self = this;

		// This function no longer gets the original dimensions, since zooming the browser can cause elements to change size.
		// NTLBR-303: In rare cases, the toolbarUI.html iframe innerWidth is 0 by the time we initialize.
		// This impacts our calculations.
		if (window.innerWidth) {
			// NOTE: some zoom sizes cause fractional offsetWidth's, so adding 1 to round up
			self.searchAreaWidth = document.getElementById('search-area').offsetWidth + 1;
			self.searchBoxWidth = Math.ceil(parseFloat(getComputedStyle(self.searchBox).getPropertyValue('width')));
			console.log('tUI: searchAreaWidth: %s, getComputedStyle(self.searchBox).getPropertyValue(width): %s', self.searchAreaWidth, getComputedStyle(self.searchBox).getPropertyValue('width'))
		}

		return {
			searchAreaWidth: self.searchAreaWidth,
			searchBoxWidth: self.searchBoxWidth
		};
	},

    init: function() {
        var self = this,
			tickerPausedInfos = {};

		if (self.initialized) {
			return;
		}

		self.initialized = true;

		// Sets up all toolbar click handling
        self.toolbarDiv.addEventListener('click', function(event) {
			var params = self.getTargetInfo(event, true);
			if (params !== null) {
				chrome.extension.sendRequest(self.extensionId, params);
            }
        });

        chrome.extension.onRequest.addListener(function onRequestListener(request, sender, sendResponse) {
			var commandFound = true,
				response;

			//console.log('tUI: onRequestListener(%O)', arguments);
			if (request.cmd == 'REPLACE') {
                // Replace should contain the containerId, and new html
                document.getElementById(request.containerId).innerHTML = request.html;

				self.toolbarChangeHandler.handleResize('cmd == REPLACE');
				self.afterPaint();
            } else if (request.cmd == 'GET_RECTANGLE') {
				response = self.getRectangle(
					document.getElementById(request.elementId),
					request.getAbsolutePosition
				);
			} else if (request.cmd == 'REPAINT') {
                // Repaint doesn't require any parameters
                self.retrieveToolbarHtml();
            } else if (request.cmd == 'SET_FOCUS') {
                var element = document.getElementById(request.id);
                if (element !== null)
                    element.focus();
            } else if (request.cmd == 'HIGHLIGHTED') {
                var searchBox = self.searchBox;
                if (searchBox != null) {
                    searchBox.value = request.text;
                }
            } else if (request.cmd == 'ADDCLASS') {

				Common.addClass(document.querySelectorAll(request.selector), request.className);

			} else if (request.cmd == 'REMOVECLASS') {

				Common.removeClass(document.querySelectorAll(request.selector), request.className);

			} else if (request.cmd === 'ADD') {

				//remove active class from selected menu button
/*
				if (request.containerId !== self.selButtonId) {
					Common.elimClassName(document.getElementById(self.selButtonId), request.className);
					Common.elimClassName(document.getElementById(self.selButtonId+'_arrow'), request.className);
				}

				//select new menu button
				Common.addClass(document.getElementById(request.containerId), request.className);
				Common.addClass(document.getElementById(request.containerId+'_arrow'), request.className);
*/

				self.selButtonId = request.containerId;//update selected menu button id

			} else if (request.cmd === 'REMOVE') {

				//remove active class from current menu button
/*
				if (self.selButtonId) {
					Common.elimClassName(document.getElementById(self.selButtonId), request.className);
					Common.elimClassName(document.getElementById(self.selButtonId+'_arrow'), request.className);
				}

*/
				self.selButtonId = "";//update selected menu button id
            } else if (request.cmd === "UPDATE_ATTRIBUTES") {
                var elem = document.getElementById(request.elementId);
                var attributes = request.attributes;
                for (var attr in attributes) {
                    if (attributes.hasOwnProperty(attr)) {
                        elem.setAttribute(attr, attributes[attr]);
                    }
                }

				self.toolbarChangeHandler.handleResize('cmd == UPDATE_ATTRIBUTES');
			} else if (request.cmd === "TOOLBAR_READY") {
				response = {
					ready: self.toolbarReady
				};

            } else if (request.cmd === 'HIDE_ASK_LOGO'){
                self.hideAskLogo();

            } else {
				commandFound = false;
			}

            if (sendResponse && response && commandFound) {
                sendResponse(response);
            }
        });

		var tickerListener = function(message, sender, sendResponse) {
			var html = message.html,
				repaint = !!html,
				initialize = message.initialize,
				reanimation = message.reanimation,
				$itemContainer = $(message.itemsSelector);

			// Repaint if necessary
			if (repaint) {
				// We must stop the current animation because the old animation's complete
				// event seems to still fire even though it is no longer in the DOM
				$itemContainer.stop(true);

				$(document.getElementById(message.containerId)).replaceWith(message.html);

				$itemContainer = $(message.itemsSelector);
			}

			var tab = sender.tab,
				widgetId = message.widgetId,
				ticker = message.ticker,
				$items = $itemContainer.children(),
				pixelsPerSecond = ticker.scrollSpeed,
				width = ticker.width,
                animationType = ticker.type;

			if ($itemContainer.length) {
				var stop,
					pause,
					animate;

				if (initialize) {
					$itemContainer.on(
						'click',
						'.item',
						function(event) {
							Messaging.send({
								name: "TICKER_CLICKED",
								widgetId: widgetId,
								index: $(this).data('index')
							});
						}
					);
				}

				if (animationType === "fade") {
					var itemsLength = $items.length,
						currentIndex,
						showTimeoutId,
						$item;

					stop = function() {
						if ($item) {
							$item.stop(true);
							// In case the item is at the beginning of the animation and is not legible
							$item.css('opacity', 1);
							window.clearTimeout(showTimeoutId);
						}
					};

					animate = function(index) {
						currentIndex = index;

						$item = $($items.get(index % itemsLength));

						$item.fadeIn(ticker.fadeIn, function() {
							showTimeoutId = window.setTimeout(
								function(event) {
									$item.fadeOut(ticker.fadeOut, function() {
										animate(index + 1);
									});
								},
								ticker.duration
							);
						});
					};

					if (initialize) {
						$itemContainer.hover(
							function(event) {
								stop();
							},
							function(event) {
								animate(currentIndex);
							}
						);
					}

					if (reanimation) {
						stop();
					}

					animate(0);
				} else if (animationType === "scroll") {
                    var scrollDirection = ticker.scrollDirection,
                        itemsWidth = $itemContainer.outerWidth(),
                        leftStart = width,
                        leftFinish = -itemsWidth,
                        pixelsToTravel = width + itemsWidth,
						msPerPixel = pixelsPerSecond / 1000;

					if (scrollDirection === "right") {
						leftStart = -itemsWidth;
						leftFinish = width;

						if (initialize) {
							$itemContainer.css({
								'left': leftStart,
								'display': 'block'
							});
						}
					}

					stop = function() {
						$itemContainer.stop(true);
					};

					pause = function() {
						stop();
						tickerPausedInfos[widgetId] = true;
					};

					animate = function() {
						tickerPausedInfos[widgetId] = false;

						var currentLeft = parseInt($itemContainer.css('left'), 10),
							pixelsTraveled,
                            remainingPixelsToTravel;

                        if (scrollDirection !== "right") {
                            if (currentLeft < 0) {
                                pixelsTraveled = leftStart + Math.abs(currentLeft);
                            } else {
                                pixelsTraveled = leftStart - currentLeft;
                            }
                        } else {
                            if (currentLeft < 0) {
                                pixelsTraveled = (leftStart * -1) - Math.abs(currentLeft);
                            } else {
                                pixelsTraveled = (leftStart * -1) + currentLeft;
                            }
                        }

						remainingPixelsToTravel = pixelsToTravel - pixelsTraveled;

						if (msPerPixel) {
							$itemContainer.animate({
								"left": leftFinish
							},
							{
								duration: remainingPixelsToTravel / msPerPixel,
								complete: function() {
									$itemContainer.css({
										"left": leftStart
									});

									animate();
								},
								easing: "linear",
								queue: false
							});
						} else {
							pause();
						}
					};

					if (initialize) {
						$itemContainer.hover(
							function(event) {
								stop();
							},
							function(event) {
								if (!tickerPausedInfos[widgetId]) {
									animate();
								}
							}
						);
					}

					if (reanimation) {
						stop();
					}

					animate();
				}
			}
		};

		// Ticker Widget
		Messaging.addListener({ "cmd": 'TICKER' }, tickerListener);

		Messaging.addListener(
			{ "cmd": 'GET_SEARCH_TERMS' },
			function(request, sender, sendResponse) {
				if (self.searchBox) {
					sendResponse(self.searchBox.value);
				}
			}
		);
    },

	afterPaint: function() {
		radio.init();
	},

	injectToolbarDiv: function(tab) {
		var self = this,
			toolbarDiv = self.toolbarDiv = document.getElementById('toolbar-item-container'),
            toolbarClassNames = (toolbarDiv.getAttribute('class') || "").split(' ');

        if (Common.isTBPartOfPage()){
            toolbarClassNames.push('part-of-page');
        }
        toolbarDiv.setAttribute('class', toolbarClassNames.join(' '));

		toolbarDiv.innerHTML = self.toolbarHtml;
		document.body.insertBefore(toolbarDiv, document.body.firstChild);

        self.hasDynamicIcon = self.toolbarHtml.indexOf('api-based-widget-icon') !== -1;
		self.searchBox = toolbarDiv.querySelector('input[id="searchfor"]');
		self.toolbarReady = true;

		// Let it be known that the toolbar has been injected
		chrome.extension.sendRequest(
			self.extensionId,
			{
				name: "toolbarReady",
				tab: tab
			}
		);

		self.handleSearchBox();

		if (self.isScrollable) {
			self.handleWidgetOverflow();
		}

		self.afterPaint();
	},

	handleSearchBox: function() {
		var self = this,
			dom_searchBox = self.searchBox,
			searchBoxConfig = self.searchBoxConfig;

		if (dom_searchBox === null) {
			console.log('*** searchBox not found');
		} else {
			var $dom_searchBox = $(dom_searchBox);

			// Pre-populate the search box with a possible existing value
			$dom_searchBox.val(self.existingSearchBoxQuery);

			if (searchBoxConfig) {
				var searchBoxHeight,
					$dom_toolbar = $(self.toolbarDiv),
					maxSearchBoxHeight = 20,
					minSearchBoxHeight = parseInt($dom_searchBox.css('font-size'), 10),
					borderPixels = Common.isNotNull(searchBoxConfig.borderPixels) ? searchBoxConfig.borderPixels : 2,   // 0 is a legal value
					minHeightPixels = searchBoxConfig.minHeightPixels || maxSearchBoxHeight,
					heightPercent = searchBoxConfig.heightPercent;

				// The search box height can't be less than the line height
				minHeightPixels = minHeightPixels < minSearchBoxHeight ? minSearchBoxHeight : minHeightPixels;

				// Account for border width
				maxSearchBoxHeight -= borderPixels * 2;
				minHeightPixels -= borderPixels * 2;

				searchBoxHeight = minHeightPixels;

				if (heightPercent && heightPercent > 0) {
					var toolbarHeight = $dom_toolbar.height();

					if (heightPercent > 100) {
						heightPercent = 100;
					}

					searchBoxHeight = Math.ceil(toolbarHeight * heightPercent / 100);

					if (searchBoxHeight < minHeightPixels) {
						searchBoxHeight = minHeightPixels;
					}
				}

				// Do not let the search box be taller than the toolbar
				if (searchBoxHeight > maxSearchBoxHeight) {
					searchBoxHeight = maxSearchBoxHeight;
				}

				$dom_searchBox.css('height', searchBoxHeight);
			}

			dom_searchBox.addEventListener('input', function (event) {
				var params = self.getTargetInfo(event);
				if (params !== null) {
					params.cmd = 'SEARCHBOX_INPUT';
					params.query = event.target.value;
					chrome.extension.sendRequest(self.extensionId, params);
				}
			});

			dom_searchBox.addEventListener('keydown', function (event) {
				if (event.keyCode == 13) {
					chrome.extension.sendRequest(self.extensionId, {cmd: 'PERFORM_SEARCH', query: event.target.value});
				}
				else if (event.keyCode == 40) {
					chrome.extension.sendRequest(self.extensionId, {cmd: 'SEARCHBOX_DOWNARROW'});
				}
				else if (event.keyCode == 38) {
					chrome.extension.sendRequest(self.extensionId, {cmd: 'SEARCHBOX_UPARROW'});
				}
			});
		}
	},

    hideAskLogo: function(){
        console.log('tUI: hideAskLogo()');
        var self = this,
            dom_searchBox = self.searchBox;

        if (dom_searchBox === null) {
            console.log('tUI: hideAskLogo - *** searchBox not found');
        } else {
            var $dom_searchBox = $(dom_searchBox);
            console.log('tUI: hideAskLogo - css background-image: %s', $dom_searchBox.css('background-image'));
            $dom_searchBox.css('background-image', '');
            console.log('tUI: hideAskLogo - css background-image: %s', $dom_searchBox.css('background-image'));
        }
        console.log('tUI: hideAskLogo - fini');
    },

	// TODO: This can be simplified now that we have access to jQuery
	handleWidgetOverflow: function() {
		var self = this,
			dom_scrollableInner = document.getElementById('scrollable-inner'),
			dom_scrollRight = document.getElementById('scroll-right'),
			dom_scrollLeft = document.getElementById('scroll-left'),
			transitionInProgress = false,
			logSpecialButtonClicked = function(buttonId) {
				Messaging.send({
					name: "LOG_BUTTON_CLICKED",
					buttonId: buttonId
				});
			},
			// Assigned button IDS: https://confluence.iaccap.com:8443/display/ITDER/UL-App-CAPToolbarButtons-ButtonClicked#UL-App-CAPToolbarButtons-ButtonClicked-SpecialButtons
			SPECIAL_BUTTON_IDS = {
				SCROLL_LEFT: -2,
				SCROLL_RIGHT: -3
			};

		// While a transition is in progress, prevent another one from being triggered
		dom_scrollableInner.addEventListener(
			'webkitTransitionEnd',
			function(e) {
				transitionInProgress = false;
			},
			false
		);

		// Setup scroller arrows
		dom_scrollRight.addEventListener(
			'click',
			function(e) {
				if (!transitionInProgress && self.visibleWidgets.length > 0 && self.hiddenWidgetsRight.length > 0) {
					transitionInProgress = true;

					chrome.extension.sendRequest(self.extensionId, { name: "closeFrames" });

					var left = parseInt(getComputedStyle(dom_scrollableInner).getPropertyValue('left'), 10),
						newLeft;

					if (self.visibleWidgets.length > 0 && self.hiddenWidgetsRight.length > 0) {
						newLeft = left - self.visibleWidgets[0].offsetWidth;

						dom_scrollableInner.style.left = newLeft + 'px';
					}

					self.toolbarChangeHandler.handleScroll();

					logSpecialButtonClicked(SPECIAL_BUTTON_IDS.SCROLL_RIGHT);
				}
			},
			false
		);

		dom_scrollLeft.addEventListener(
			'click',
			function(e) {
				if (!transitionInProgress && self.hiddenWidgetsLeft.length > 0) {
					transitionInProgress = true;

					chrome.extension.sendRequest(self.extensionId, { name: "closeFrames" });

					var left = parseInt(getComputedStyle(dom_scrollableInner).getPropertyValue('left'), 10),
						newLeft;

					if (self.hiddenWidgetsLeft.length > 0) {
						newLeft = left + self.hiddenWidgetsLeft[0].offsetWidth;

						dom_scrollableInner.style.left = newLeft + 'px';

						self.toolbarChangeHandler.handleScroll();
					}

					logSpecialButtonClicked(SPECIAL_BUTTON_IDS.SCROLL_LEFT);
				}
			},
			false
		);

		window.addEventListener(
			'resize',
			function resizeEventHandler(){
				self.toolbarChangeHandler.handleResize('resize');
			},
			false
		);

		self.toolbarChangeHandler.handleResize('handleWidgetOverflow');
	},

	toolbarChangeHandler: {
		handleScroll: function(params) {
			//console.log('tUI: handleScroll(%O)', params);
			params = params || {};

			var parent = Toolbar,
				isResizeEvent = params.isResizeEvent,
				self = this,
				dom_toolbarItems = parent.toolbarDiv.querySelectorAll('#scrollable-area .toolbar-item'),
				dom_scrollableInner = document.getElementById('scrollable-inner'),
				dom_scrollRight = document.getElementById('scroll-right'),
				dom_scrollLeft = document.getElementById('scroll-left'),
				dom_scrollableArea = document.getElementById('scrollable-area'),
				dom_arrowContainer = document.getElementById('arrow-container');

			if(!dom_scrollableArea)
				return;

			var	item,
				hiddenWidgetsRight = [],
				hiddenWidgetsLeft = [],
				visibleWidgets = [],
				itemOffset,
				itemRightPos,
				innerLeftPos = parseInt(dom_scrollableInner.style.left || getComputedStyle(dom_scrollableInner).getPropertyValue('left'), 10),
				scrollableWidth = parseInt(dom_scrollableArea.style.width, 10),
				totalWidgetWidth = 0,
				overflow;

			//console.log('tUI: innerLeftPos: %s, scrollableWidth: %s, scrollableArea.style.width: %s', innerLeftPos, scrollableWidth, dom_scrollableArea.style.width);

			for (var i = dom_toolbarItems.length - 1; i >= 0; i -= 1) {
				item = dom_toolbarItems[i];
				itemOffset = parent.getRectangle(item);
				itemRightPos = itemOffset.left + itemOffset.width + innerLeftPos;

				// Is this item overflowing on the right side?
				if (itemRightPos > scrollableWidth) {
					overflow = true;

					item.style.visibility = 'hidden';

					// Show the arrow container when we detect the first hidden widget
					if (hiddenWidgetsRight.length === 0) {
						dom_arrowContainer.style.visibility = 'visible';
						//console.log('tUI: %s, Show the arrow container when we detect the first hidden widget', item.id);
					}

					hiddenWidgetsRight.push(item);

				}
				else if (itemOffset.left + innerLeftPos < 0) {
					overflow = true;

					hiddenWidgetsLeft.push(item);
					//console.log('tUI: %s, hiding', item.id);
				}
				else {
					overflow = false;

					if (item.style.visibility === 'hidden') {
						item.style.visibility = 'visible';
					}

					visibleWidgets.push(item);
					//console.log('tUI: %s, showing', item.id);
				}

				// Update the overflow property on resize events
				if (isResizeEvent) {
					item.Mindspark_overflow = overflow;
				}

				totalWidgetWidth += item.offsetWidth;
			}

			if (scrollableWidth >= totalWidgetWidth) {
				dom_arrowContainer.style.visibility = 'hidden';

				// Reset left coordinate
				dom_scrollableInner.style.left = 0;
				//console.log('tUI: scrollableWidth >= totalWidgetWidth');
			}

			if (hiddenWidgetsLeft.length > 0) {
				dom_scrollLeft.removeAttribute('disabled');
				//console.log('tUI: remove left disabled');
			} else {
				dom_scrollLeft.setAttribute('disabled', "true");
				//console.log('tUI: add left disabled');
			}

			if (hiddenWidgetsRight.length > 0) {
				dom_scrollRight.removeAttribute('disabled');
				//console.log('tUI: remove right disabled');
			} else {
				dom_scrollRight.setAttribute('disabled', "true");
				//console.log('tUI: add right disabled');
			}

			if (visibleWidgets.length === 0) {
				dom_arrowContainer.style.visibility = 'hidden';
				//console.log('tUI: hide arrow');
			}

			parent.visibleWidgets = visibleWidgets.reverse();
			parent.hiddenWidgetsRight = hiddenWidgetsRight.reverse();
			parent.hiddenWidgetsLeft = hiddenWidgetsLeft;
			//console.log('tUI: handleScroll - done');
		},

		deferResize: function(){
			var self = this;
			if (self.deferRefreshTimerID){
				window.clearTimeout(self.deferRefreshTimerID);
				self.deferRefreshTimerID = null;
			}
			self.deferRefreshTimerID = window.setTimeout(function deferResizeTimeout(){
					self.deferRefreshTimerID = null;
					self.handleResize('deferResizeTimeout');
				},
				100);
		},

		handleResize: function(reason) {
            console.log('tUI: handleResize(%s) - Toolbar: %O', reason, Toolbar);
			var parent = Toolbar,
				self = this,
				dom_searchBox = parent.searchBox,
				dom_toolbarItems = parent.toolbarDiv.querySelectorAll('#scrollable-area .toolbar-item'),
				dom_scrollableInner = document.getElementById('scrollable-inner'),
				dom_scrollableArea = document.getElementById('scrollable-area'),
				dom_arrowContainer = document.getElementById('arrow-container'),
				dom_rightSideContainer = document.getElementById('rightSide-container'),
				searchBoxConfig = parent.searchBoxConfig;

			var	widgetCount = searchBoxConfig ? searchBoxConfig.autoExpandButtonCount : 0,
				item,
				itemOffset,
				itemRightPos,
				toolbarWidth = window.innerWidth,
				searchBoxDimensions = parent.getSearchBoxDimensions(),
				innerLeftPos,
				derivedScrollableWidth,
				searchBoxWidth = searchBoxDimensions.searchBoxWidth,
				totalWidgetWidth = 0;

			//console.log('tUI: widgetCount: %s, toolbarWidth: %s, searchBoxDimensions: %O, searchBoxWidth: %s', widgetCount, toolbarWidth, searchBoxDimensions, searchBoxWidth);

            if (parent.hasDynamicIcon && !parent.addedResizeHandlers){
				// since handleResize can be called more than once, protect against multiple addition
				// of icon load handlers
				//console.log('tUI: hasDynamicIcon');

				function handleResize(icon){
					if (!icon.width) {
						//console.log('tUI: handleResize - adding handler for %s', icon.src);
						icon.addEventListener('load', function () {
							//console.log('tUI: handleResize due to api-based-widget-icon for %s', icon.src);
							self.deferResize();
						});
					}
				}
				var icons = parent.toolbarDiv.getElementsByClassName('api-based-widget-icon');
				parent.addedResizeHandlers = true;
                for (var i = 0, len = icons.length; i < len; ++i){
					handleResize(icons[i]);
                }
            }

            innerLeftPos = dom_scrollableInner ? parseInt(dom_scrollableInner.style.left
				|| getComputedStyle(dom_scrollableInner).getPropertyValue('left'), 10) : 0;

			//console.log('tUI: innerLeftPos: %s, style.left: %s, dom.left" %s', innerLeftPos, dom_scrollableInner.style.left, getComputedStyle(dom_scrollableInner).getPropertyValue('left'));
			derivedScrollableWidth = toolbarWidth
				- searchBoxDimensions.searchAreaWidth - 1
				- dom_arrowContainer.offsetWidth;

			//console.log('tUI: dom_arrowContainer: %O', dom_arrowContainer);
			//console.log('tUI: derivedScrollableWidth: %s, searchBoxDimensions.searchAreaWidth: %s, dom_arrowContainer.offsetWidth: %s', derivedScrollableWidth, searchBoxDimensions.searchAreaWidth, dom_arrowContainer.offsetWidth);
			if (dom_rightSideContainer) {
				derivedScrollableWidth -= dom_rightSideContainer.offsetWidth;
				//console.log('tUI: derivedScrollableWidth: %s, dom_rightSideContainer.offsetWidth: %s', derivedScrollableWidth, dom_rightSideContainer.offsetWidth);
			}

			if(dom_scrollableArea)
				dom_scrollableArea.style.width = derivedScrollableWidth + 'px';

			// Handle auto-expanding search box
			if (widgetCount > 0) {
				widgetCount -= 3; // search box, search button, options button

				if (searchBoxConfig.hasMagnifyingGlass) { // IE toolbar counts magnifying glass as a separate button
					widgetCount -= 1;
				}

				for (var j = 0; j < dom_toolbarItems.length && j < widgetCount; j += 1) {
					item = dom_toolbarItems[j];
					itemOffset = parent.getRectangle(item);
					itemRightPos = itemOffset.left + itemOffset.width + innerLeftPos;

					if (itemRightPos <= derivedScrollableWidth) {
						totalWidgetWidth += item.offsetWidth;
					}
				}
				//console.log('tUI: derivedScrollableWidth: %s', derivedScrollableWidth);

				var newScrollableWidth = totalWidgetWidth,
					availableWidth = derivedScrollableWidth - totalWidgetWidth;

				dom_searchBox.style.width = searchBoxWidth + availableWidth + 'px';

				dom_scrollableArea.style.width = newScrollableWidth + 'px';
				//console.log('tUI: newScrollableWidth: %s, availableWidth: %s', newScrollableWidth, availableWidth);
			}

			self.handleScroll({
				isResizeEvent: true
			});
			//console.log('tUI: handleResize - done');
		}
	},

    retrieveToolbarHtml: function() {
        var self = this;

        // Talk to background
        chrome.extension.sendRequest(self.extensionId,
			{
				name: "toolbarHtml"
			},
			function toolbarHtmlListener(response) {
                console.log('tUI: toolbarHtmlListener(%O)', response);
				self.searchBoxConfig = response.searchBoxConfig;
	            self.toolbarHtml = response.html;
	            self.isScrollable = response.isScrollable;
				self.existingSearchBoxQuery = response.existingSearchBoxQuery;
				self.injectToolbarDiv(response.tab);
	            self.init();
        	}
		);
    }
};

console.log('tUI: - Toolbar: %O', Toolbar);
Toolbar.retrieveToolbarHtml();
console.log('tUI: - Toolbar: post retrieve %O', Toolbar);
