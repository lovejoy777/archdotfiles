var MenuButton = {
	name: null,
	overflow: null,
	items: null,
	BORDER_WIDTH: 2,
	MENU_PADDING: 24,
	minimumWidth: 150,
	idToItemMapping: {},

	initialize: function() {
		var self = this,
			query = QueryString.toObject(window.location.search.substr(1));

		this.name = query.id;
		this.overflow = Mindspark_.shared.utils.getBoolean(query.overflow);

		// Retrieve list items and render them
		Widget.Content.extension.sendRequest(
			{
				name: self.name,
				cmd: 'getItems'
			},
			function(response) {
				self.items = response.items;

				if (response.minimumWidth) {
					self.minimumWidth = response.minimumWidth;
				}

				self.render();
			}
		);

		document.body.addEventListener('click', function (event) {
			// Make sure the user did not click on a menu
			if (event.target.nodeName === "BODY") {
				self.close();
			}
		}, false);
	},

	close: function() {
		Widget.Content.extension.sendRequest(
			{
				name: this.name,
				cmd: 'remove'
			}
		);
	},

	selectHandler: function(node, listInteraction) {
		var self = this,
			id = node.getAttribute('custom'),
			item = self.idToItemMapping[id];

		// Does this item have children?
		if (item.items && item.items.length) {
			chrome.extension.sendRequest({
				name: "LOG_BUTTON_CLICKED",
				buttonId: item.buttonId,
				overflow: self.overflow
			});

			// Render the children
			self.render(node, item.items, listInteraction);
		} else {
			chrome.extension.sendRequest(
				{
					name: "getRectangle",
					elementId: self.name,
					getAbsolutePosition: true
				},
				function(rectangle) {
					Widget.Content.extension.sendRequest(
						{
							name: id,
							rectangle: rectangle,
							overflow: self.overflow
						},
						function(response) {
							self.close();
						}
					);
				}
			);
		}
	},

	getMenuHeight: function() {
		// Find the menu with the max offset height
		var maxOffsetMenu;

		_.forEach(
			document.getElementsByTagName('menu'),
			function(menu, index, array) {
				if (!maxOffsetMenu ||
					$(menu).offset().top + menu.offsetHeight >
					$(maxOffsetMenu).offset().top + maxOffsetMenu.offsetHeight)
				{
					maxOffsetMenu = menu;
				}
			}
		);

		if (maxOffsetMenu) {
			return $(maxOffsetMenu).offset().top + maxOffsetMenu.offsetHeight;
		}
	},

	render: function(parent, items, parentListInteraction) {
		var menu,
			menuOffset;

		if (parent) {
			var $parent = $(parent),
				parentOffset = $parent.offset();

			$parent.addClass('opened');

			menu = document.createElement('menu');
			menu.setAttribute('class', 'sub-menu');
			menu.style.top = parentOffset.top + 'px';
			menu.style.left = parentOffset.left + parent.offsetWidth - 5 + 'px';

			document.body.appendChild(menu);
		} else {
			menu = document.getElementById('root');
		}

		menuOffset = $(menu).offset();

		items = items || this.items;

		// Puny attempt at focusing.
		var focusme = document.createElement('input');
		focusme.setAttribute('type', 'text');
		document.body.appendChild(focusme);
		focusme.focus();
		focusme.parentNode.removeChild(focusme);

		for (var i = 0; i < items.length; i++) {
			var item = items[i],
			    id = item.id,
			    label = item.label || '',
			    img = item.img,
                tooltipText = item.tooltipText || '',
                menuItem = document.createElement('li');

			// If the list item has children, add the visual cue
			// Do not show a menu item that has an empty child list
			if (item.items) {
				if (item.items.length) {
					menuItem.setAttribute('class', 'parent');
				}
				// If a menu has no children but has a url, still display it
				else if (!item.url) {
					continue;
				}
			}

			// Handle API Based Widgets
			if (item.type === "ApiBasedWidget" && item.button && item.button.style) {
				if (item.button.style.label) {
					label = this.getStringObjectText(item.button.style.label);
				}

				img = item.button.style.icon;
			}
			// Disable link buttons that have no URL
			else if (item.type === "LinkButton" && !item.url) {
				menuItem.setAttribute('class', 'disabled');
			}
            // Handle Separators
            else if (item.type === 'Separator') {
                var lastChild = menu.lastChild;
                if (lastChild) {
                    var lastClass = lastChild.getAttribute('class');
                    lastChild.setAttribute('class', (lastClass || '') + ' show-separator');
                }
                continue;
            }

            menuItem.setAttribute('custom', id);

			// Map the id to the item Object
			this.idToItemMapping[id] = item;

            if (tooltipText){
                menuItem.setAttribute('title', tooltipText);
            }

            if (!img) {
				menuItem.appendChild(document.createTextNode(label));
				menu.appendChild(menuItem);
			} else {
				var imgItem = document.createElement('img');

				// If the URL is relative, get the absolute path
				if (!/^(http[s]?|chrome):\/\//.test(img)) {
					img = chrome.extension.getURL(img);
				}

				imgItem.setAttribute('class', 'icon');
				imgItem.setAttribute('custom', id);
				imgItem.src = img;
				menuItem.appendChild(imgItem);

				var spanItem = document.createElement('span');
				spanItem.setAttribute('class', 'label');
				spanItem.setAttribute('custom', id);
				spanItem.appendChild(document.createTextNode(label));

				menuItem.appendChild(spanItem);

				menu.appendChild(menuItem);
			}
		}

		// This class is temporarily set in order to calculate the width
		document.body.setAttribute('class', 'measurable');
		var width = this.minimumWidth;
		for (var k = 0; k < menu.childNodes.length; k++) {
			var childNode = menu.childNodes[k];
			if (childNode.offsetWidth) {
				width = Math.max(width, childNode.offsetWidth);
			}
		}

		width += this.MENU_PADDING;

		document.body.setAttribute('class', '');

		var offsetWidth = menuOffset.left + width + this.BORDER_WIDTH,
			menuHeight = this.getMenuHeight();

		// Keep the body height up to date
		document.body.style.height = menuHeight + 'px';

		// Set the menu width
		menu.style.width = width + 'px';

		// Now resize the parent iframe
		Widget.Content.extension.sendRequest({
			name: this.name,
			cmd: 'resize',
			size: {
				width: offsetWidth,
				height: menuHeight
			}
		});

		var listInteraction = new util.ListInteraction(
			menu,
			this.selectHandler,
			parentListInteraction
		);

		// Disable the key events on the parent menu
		if (parentListInteraction) {
			parentListInteraction.disableKeyEvents();
			parentListInteraction.childListInteraction = listInteraction;
		}
	},

	// Ported from ApiBasedWidget.js
	getStringObjectText: function(stringObject) {
		var text = "";

		if (typeof stringObject === "object") {
			stringObject = stringObject.text;
		}

		if (typeof stringObject === "string") {
			text = stringObject;
		}

		return text;
	}
};

window.addEventListener('load', function() {
	MenuButton.initialize();
}, false);

