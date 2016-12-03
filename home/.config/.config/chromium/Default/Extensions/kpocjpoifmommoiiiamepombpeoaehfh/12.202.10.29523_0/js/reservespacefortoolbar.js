(function() {
	"use strict";

	window.mindspark || (window.mindspark = {});

	var LEGACY_STYLE_ELEMENT_ID = "mindspark-reserve-style",
		STYLE_ELEMENT_ID = "mindspark-reserve-style-v2",
		BODY_HEIGHT_ATTRIBUTE_NAME = "mindsparkBodyHeight",
		MINDSPARK_CLASS_REGEX = /Mindspark_-|mindspark|iframeMyWebSearchToolbar/,
		MOVED_ATTRIBUTE_NAME = "Mindspark-moved",
		TOOLBAR_HEIGHT = 30;

	var spaceReserved = false,
		mutationObservers = [],
		originalHtmlStyle = {};

	var isPositioned = function(position) {
		return /fixed|absolute/.test(position);
	};

	mindspark.ReserveSpaceForToolbar = {
		toolbarHeight: TOOLBAR_HEIGHT,
		PAGE_EVENT: {
			TOOLBAR_LOAD: "toolbar_load",
			WINDOW_LOAD: "window_load"
		},

		reserveSpace: function() {
			var self = this;

			if (spaceReserved) {
				return;
			}

			// This content script is injected before the document.body exists.
			// Unfortunately, a Mutation Observer does not provide info when the body is created
			if (!document.body) {
				// The body hasn't been created yet, wait for it.
				window.setTimeout(function() {
					self.reserveSpace();
				}, 1);

				return;
			}

			spaceReserved = true;

			self.updateHtmlAndBody();

			if (document.readyState === "loading") {
				document.addEventListener(
					'DOMContentLoaded',
					_.bind(self.movePositionedElements, self),
					false
				);
			} else {
				self.movePositionedElements();
			}

			// Ensure our toolbar is still visible after the window has fully loaded
			window.addEventListener(
				'load',
				_.bind(self.verifyToolbarVisibility, self, self.PAGE_EVENT.WINDOW_LOAD),
				false
			);
		},

		updateHtmlAndBody: function(revert) {
			var body = document.body,
				htmlStyle = window.getComputedStyle(document.documentElement),
				mindsparkBodyHeight = 0,
				style = document.getElementById(STYLE_ELEMENT_ID),
				rules,
				cssInnerText;

			try {
				mindsparkBodyHeight = parseInt(body.getAttribute(BODY_HEIGHT_ATTRIBUTE_NAME));
			} catch(e) {}

			if (!mindsparkBodyHeight) {
				mindsparkBodyHeight = TOOLBAR_HEIGHT;
			} else if (!revert){
				mindsparkBodyHeight += TOOLBAR_HEIGHT;
			} else {
				spaceReserved = false;

				mindsparkBodyHeight -= TOOLBAR_HEIGHT;
			}

			// update custom height attribute
			body.setAttribute(BODY_HEIGHT_ATTRIBUTE_NAME, mindsparkBodyHeight);

			originalHtmlStyle = {
				"paddingTop": htmlStyle.paddingTop
			};

			rules = [
				"padding-top: " + mindsparkBodyHeight + "px !important"
			];

			cssInnerText = 'html { ' + rules.join(";") + ' }';

			// remove style definition if it exists
			if (!style) {
				style = document.createElement('style');
				style.setAttribute('id', STYLE_ELEMENT_ID);
			} else if (style.hasChildNodes()){
				style.removeChild(style.firstChild);
			}

			// update style definition
			style.appendChild(document.createTextNode(cssInnerText));
			document.documentElement.appendChild(style);
		},

		removeActiveToolbarListeners: function() {
			try {
				// disconnect mutation observers
				_.forEach(mutationObservers, function(observer, index, list) {
					observer.disconnect();
				});
			} catch(e) {}
		},

		destroyToolbar: function() {
			var self = this,
				styleElement = document.getElementById(STYLE_ELEMENT_ID),
				computedStyle,
				originalTop,
				intOriginalTop,
				currentTop,
				newTop,
				cssText;

			if (styleElement) {
				document.documentElement.removeChild(styleElement);
			}

			self.updateHtmlAndBody(true);

			// Deallocate the space for this toolbar
			_.forEach(document.querySelectorAll('[' + MOVED_ATTRIBUTE_NAME + ']'), function(domElement, index, list) {
				computedStyle = window.getComputedStyle(domElement);
				originalTop = domElement.getAttribute(MOVED_ATTRIBUTE_NAME);
				intOriginalTop = parseInt(originalTop, 10);
				currentTop = parseInt(computedStyle.top, 10);
				newTop = currentTop - TOOLBAR_HEIGHT;

				// If we are back to the original top setting, remove our custom attribute
				if (intOriginalTop === newTop) {
					domElement.removeAttribute(MOVED_ATTRIBUTE_NAME);
				}

				cssText = 'top: ' + newTop + 'px !important';
				domElement.style.cssText += cssText;
			});

			// Reset html tag styles
			_.forEach(originalHtmlStyle, function(value, key, list) {
				document.documentElement.style[key] = value;
			});

			self.removeActiveToolbarListeners();
		},

		handleNodePosition: function(node, observedNodeAddition) {
			var self = this;

			if (!(MINDSPARK_CLASS_REGEX).test(node.className)) {
				var nodeComputedStyle = window.getComputedStyle(node),
					position = nodeComputedStyle.position,
					absolute = position === "absolute",
					fixed = position === "fixed";

				// Leave static and relative positioned elements alone, they will automatically be
				// repositioned based on the css we injected to reserve space for the toolbar
				if (fixed || absolute) {
					var top = nodeComputedStyle.top,
						bottom = nodeComputedStyle.bottom,
						numTop = parseInt(top, 10),
						importantTop = false;

					// Do not reposition the element if:
					//
					// - The positioned element's top is auto, as it will be positioned
					//   relative to the closest position ancestor
					// - OR The top is a percentage value
					// - OR The bottom property is defined while there is no top defined
					//
					// NOTE: If both top and bottom are specified, the CSS spec says that the top wins:
					// https://developer.mozilla.org/en-US/docs/CSS/position#Notes
					if (top === "auto"
						|| top.indexOf("%") > -1
						|| (!isNaN(parseInt(bottom, 10)) && isNaN(numTop)))
					{
						return false;
					}

					// Do not move absolute elements that have positioned parents, because positioned
					// elements are positioned relative to the closest positioned ancestor.
					// Fixed elements are always positioned relative to the screen's viewport, so
					// we can safely proceed.
					if (absolute && Common.hasOffsetParent(node)) {
						return false;
					}

					// If we observed this element being added, we should honor the top calculation it was given
					//  - EXCEPTION: If a Mindspark toolbar has already moved this item
					// If the top is set to 0, our toolbar has certainly not been accounted for
					if ((!observedNodeAddition || node.getAttribute(MOVED_ATTRIBUTE_NAME)) || numTop === 0) {
						numTop += TOOLBAR_HEIGHT;
					} else {
						return false;
					}

					// Retain original top value
					if (!node.getAttribute(MOVED_ATTRIBUTE_NAME)) {
						node.setAttribute(MOVED_ATTRIBUTE_NAME, top);
					}

					// Determine whether or not the top property is set with !important
					// First, check the inline style
					importantTop = self.isImportantStyle("top", node.style.cssText);

					// If necessary, check the matched CSS rules
					if (!importantTop) {
						_.forEach(
							node.ownerDocument.defaultView.getMatchedCSSRules(node, ''),
							function(cssStyleRule, index, list) {
								var cssText = cssStyleRule.cssText;
								var tmp = cssText.substring(cssText.indexOf('{ ') + 2);
								tmp = tmp.substring(0, tmp.indexOf(' }'));
								tmp = tmp.split(';');

								_.forEach(tmp, function(ruleText, index, list) {
									if (self.isImportantStyle("top", ruleText)) {
										importantTop = true;
									}
								});
							}
						);
					}

					// Setting via cssText allows us to include the !important flag
					if (!importantTop) {
						node.style.cssText += 'top: ' + numTop + 'px';
					} else {
						node.style.cssText += 'top: ' + numTop + 'px !important';
					}
				}
			}
		},

		isImportantStyle: function(property, cssText) {
			return cssText.indexOf(property + ':') > -1 && cssText.indexOf('!important') > -1;
		},

		movePositionedElements: function() {
			var self = this,
				domBody = window.document.body,
				allNodeList = document.querySelectorAll('*'),
				allNodeArray = Array.prototype.slice.call(allNodeList),
				isBodyPositioned = isPositioned(window.getComputedStyle(domBody).position),
				mutationCallback;

			// We must inspect every element in the DOM
			allNodeArray.forEach(function(element, index, array) {
				self.handleNodePosition(element);
			});

			/**
			 * Temporary Google-specific logic - see: NTLBR-583
			 *
			 * We are reacting to any DOM mutations, regardless of what they were,
			 * in order to see if we need to adjust the body position. If the #viewport
			 * element is not position:relative, we must make the body element
			 * position:relative in order to prevent the toolbar from overlaying the
			 * Google search box.
			 */
            var GOOGLE_RE = /^(www\.)?google(\.com|\.co)?(\.[a-z][a-z])?$/;
			if (GOOGLE_RE.test(window.location.hostname)) {
				mutationCallback = function(response) {
					var domViewport = document.getElementById('viewport');

					if (domViewport) {
						var viewportPosition = window.getComputedStyle(domViewport).position;

						if (viewportPosition !== 'relative') {
							domBody.style.position = 'relative';
						}
					}
				};
			}
			else {
				mutationCallback = function(response) {
					var elementQuerySummary = response[0],
						added = elementQuerySummary.added;

					_.forEach(added, function(element, index, list) {
						self.handleNodePosition(element, true);
					});
				};
			}

			// When elements are added to the DOM, we can react to this by checking
			// to see if we must reposition the element
			mutationObservers.push(new MutationSummary({
				callback: mutationCallback,
				queries: [
					{ element: '*' }
				]
			}));

			/**
			 * Observe changes to the document body 'class' and 'style' attributes.
			 * If either of these attributes change, compute the body's CSS position
			 * value. If the body went from being positioned (fixed or absolute) to
			 * not positioned, examine the body's children to see if we must perform
			 * any repositioning.
			 *
			 * This stemmed from the following issue: NTLBR-441
			 */
			mutationObservers.push(new MutationSummary({
				callback: function(response) {
					var elementQuerySummary = response[0],
						attributeChanges = elementQuerySummary.attributeChanged,
						classChangedElements = attributeChanges.class || [],
						styleChangedElements = attributeChanges.style || [];

					_.forEach(
						// As we are only targeting the body at the moment, the union
						// should always just contain the body element.
						_.union(classChangedElements, styleChangedElements),
						function(element, index, list) {
							var isUpdatedBodyPositioned = isPositioned(window.getComputedStyle(element).position);

							// Did the body element go from being positioned to not being positioned?
							if (isBodyPositioned && !isUpdatedBodyPositioned) {
								_.forEach(
									document.querySelectorAll('body *'),
									function(element, index, list) {
										self.handleNodePosition(element);
									}
								);
							}

							isBodyPositioned = isUpdatedBodyPositioned;
						}
					);
				},
				queries: [
					{
						element: 'body',
						elementAttributes: 'class style'
					}
				]
			}));

			// Ensure that our toolbar always displays on top of any other toolbar
			// Other toolbar criteria: iframe, fixed position, does not use a Mindspark class name
			mutationObservers.push(new MutationSummary({
				callback: function(response) {
					var elementQuerySummary = response[0],
						added = elementQuerySummary.added,
						toolbarFrame = window.Content && window.Content.newToolbarFrame;

					if (toolbarFrame) {
						_.forEach(added, function(element, index, list) {
							if (!(MINDSPARK_CLASS_REGEX).test(element.className)) {
								var style = window.getComputedStyle(element);
								if (style && style.position === 'fixed') {
									var position = toolbarFrame.compareDocumentPosition(element);

									// Bitmap logic
									if (position & toolbarFrame.DOCUMENT_POSITION_FOLLOWING) {
										document.body.appendChild(toolbarFrame);
									}
								}
							}
						});
					}
				},
				queries: [
					{ element: 'iframe' }
				]
			}));
		},

		verifyToolbarVisibility: function(pageEvent) {
			var toolbarFrame = window.Content && window.Content.newToolbarFrame;

			if (window.toolbarData && window.toolbarData.toolbarEnabled && toolbarFrame) {
				// Get the toolbar's position in the viewport
				var toolbarCoords = toolbarFrame.getBoundingClientRect(),
					width = toolbarCoords.width - 1,
					height = toolbarCoords.height - 1,
					top = toolbarCoords.top,
					left = toolbarCoords.left,
					report = false,
					visible,
					topmostElement;

				// Coordinates we want to check the visibility of
				var coords = [
					{
						name: "centerVisible",
						x: left + width / 2,
						y: top + height / 2
					},
					{
						name: "topLeftVisible",
						x: left,
						y: top
					},
					{
						name: "topRightVisible",
						x: left + width,
						y: top
					},
					{
						name: "bottomLeftVisible",
						x: left,
						y: top + height
					},
					{
						name: "bottomRightVisible",
						x: left + width,
						y: top + height
					}
				];

				var appData = {
					pageEvent: pageEvent
				};

				_.forEach(coords, function(coord, key, list) {
					// Determine what DOM element is visible at the toolbar's position
					topmostElement = document.elementFromPoint(coord.x, coord.y);

					// Is our toolbar the topmost element?
					visible = topmostElement === toolbarFrame;

					appData[coord.name] = visible ? 1 : 0;

					// If any of the coords are not visible, we should report it
					if (!visible) {
						report = true;
					}
				});

				if (report) {
					// Fire unified logging event with appData
					unifiedLogging.logEvent(
						unifiedLogging.EVENTS.TOOLBAR_BLOCKED,
						appData
					);
				}
			}
		}
	};
}());