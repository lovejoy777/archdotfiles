function MenuButton(config) {
	var self = this;

    Widget.Background.initialize(this);
    this.id = config.id;
    this.img = config.img;
	this.imgWidth = config.imgWidth || '';
    this.url = config.url;
    this.items = config.items;
    this.minimumWidth = config.minimumWidth;
    this.beginScrollableArea = config.beginScrollableArea;
    this.isMagnifyingGlass = config.isMagnifyingGlass;
    this.opensNewWindow = config.openInNewWindow || false;
    this.isSearchButton = config.isSearchButton;

	// The root node recursively instantiates all of the child widgets
	// so they behave as they should when clicked in the menuframe. The
	// menuframe also handles the rendering on its own. Thus, we only
	// want to execute this logic on the root node
	if (!config.isNested) {
		(function verifyMenuItems(parent) {
			var items = parent.items || [],
				verifiedItems = [],
				item,
				widgetInstance,
				icon;

			for (var i = 0; i < items.length; i++) {
				item = items[i];
				item.isNested = true;
                item.opensNewWindow = item.openInNewWindow || false;

				widgetInstance = WidgetFactory.createWidget(item);

				// TODO: We could create a Separator widget Class to avoid this exception
				if (widgetInstance || item.type === "Separator") {
					// If there is an icon, get the full path
					if (item.button && item.button.style && (icon = item.button.style.icon)) {
						item.button.style.icon = widgetInstance.getWidgetUrl(icon);
					}

					// Does this item have children?
					if (widgetInstance instanceof MenuButton) {
						if (item.items) {
							// Ensure this is not an empty Array
							if (item.items.length) {
								var _verifiedItems = verifyMenuItems(item);

								if (_verifiedItems.length) {
									verifiedItems.push(item);
								}
							}
							// If a menu has no children but has a url, still display it
							else if (item.url) {
								verifiedItems.push(item);
							}
						}
					} else {
						verifiedItems.push(item);
					}
				}
			}

			parent.items = verifiedItems;

			return verifiedItems;
		}(config));

		self.items = config.items;

		// Do not show a menu button if it has no URL and no children
		if (!config.url && config.items && !config.items.length) {
			self.disabled = true;
		}

		if (this.img != null && this.img.indexOf('http') != 0) {
			this.img = this.getURL(this.img);
		}

		this.label = Common.defaultVal(config.label, '');
		this.tooltipText = config.tooltipText || '';
	}

	this.render = function() {
		var buttonClassName = "toolbar-item button",
			label = this.label,
			html = "";

		if (!label) {
			buttonClassName += " no-label";
		}

		html = [ "<button class='" + buttonClassName + "' id='" + this.id + "'" +
            (this.tooltipText ? " title='" + Common.encodeForAttrValue(this.tooltipText) + "'" : '') +
            ">" ];

		html.push("<div><img class='icon' src='" + this.img + "' width='" + this.imgWidth + "'/>");

		if (label) {
			html.push("<span class='label'>" + Common.encodeForHTML(label) + "</span>");
		}

		html.push("</div>");

		var hasChildren = this.items && this.items.length > 0;

		// We want to show the dropdown arrow for the magnifying glass
		if (hasChildren && ( this.url || this.isMagnifyingGlass )) {
			html.push("<div id='" + this.id + "_arrow' class='arrow use-parent-coords'></div>");
		}

		html.push("</button>");

		return html.join('');
	};

	this.handleClick = function(params, tab) {
        //If we have a URL and the click wasn't on the arrow go to the url.  Otherwise, show the menu items.
        if (this.url && params.name != (this.id + '_arrow')) {
			this.select(params, tab);
        } else if (this.items && this.items.length) {
			this.openMenu(params, tab);
		}
	};

	this.openMenu = function(params, tab) {
		var queryString = Common.makeQueryString({
			id: this.id,
			overflow: params.overflow
		});

		this.showDialog(tab, {
			containerId: this.id,
			className: "active",
			src: this.getURL('common/components/menu/html/menuframe.html?') + queryString,
			border: false,
			rectangle: params.rectangle,
			transparent: true,
			width: 1024, //This needs to be larger than the potential width of the item or the item will wrap to 2 lines.
			height: 0
		});

		self.logButtonClickedEvent(config.buttonId, params.overflow);
	};
	
	this.select = function(params, tab) {
        if (this.isSearchButton){
            console.log('mB: select - this.isSearchButton');
            SearchBox.singleInstance.performSearch(params, tab, this.url);
        }else{
            console.log('mB: select - !this.isSearchButton');
            // Navigate to the URL
            var url = paramReplacer.replaceParams(this.url, tab);
            Widget.Content.tabs.loadButtonLink(tab, url, this.opensNewWindow);
        }
        self.logButtonClickedEvent(config.buttonId, params.overflow);
    };

	this.handleRequest = function(request, sender) {
		if (request.name == this.id) {
            if (request.cmd == 'itemSelect') {
				var id = request.itemId;
				Widget.Content.tabs.sendRequest(sender.tab, {cmd: 'REMOVE', containerId: this.id});
				this.select(request, id);
			} else if (request.cmd == 'resize') {
				var size = request.size;
				Widget.Content.tabs.sendRequest(sender.tab, {cmd: 'RESIZE', containerId: this.id, size: size});
			} else if (request.cmd == 'remove') {
				Widget.Content.tabs.sendRequest(sender.tab, {cmd: 'REMOVE', containerId: this.id});
			} else if (request.cmd == 'getItems') {
				return {items: this.items, minimumWidth: this.minimumWidth};
			} else if(!request.cmd) {
			    this.handleClick(request, sender.tab);
            }
		} else if (request.name == this.id + '_arrow') {
            this.openMenu(request, sender.tab);
        }
    };
}

MenuButton.prototype = new Widget.Background();
