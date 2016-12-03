window.util || (window.util = {});

util.ListInteraction = function(menuNode, selectHandler, parentListInteraction) {
	var self = this,
		PARENT_ITEM_SELECT_DELAY = 1000,
		NIL = -1,
		parentItemSelectTimeout,
		nodes = menuNode.childNodes,
		enabled = false,
		selectedIndex;

	// This gets set by menuframe.js
	self.childListInteraction = null;

	this.enable = function() {
		if (!nodes || !nodes.length) {
			throw 'At least one node is required.';
		}

		if (enabled) {
			self.disable();
		}

		for (var k = 0; k < nodes.length; k++) {
			var node = nodes[k];
			node.index = k;
			$(node).click(self.handleNodeClick);
			addEvtListener(node, 'mouseover', self.handleNodeMouseOver);
		}

		self.selectHandler = selectHandler;
		selectedIndex = NIL;
		self.enableKeyEvents();
		enabled = true;
	};

	this.disable = function() {
		if (enabled) {
			for (var k = 0; k < nodes.length; k++) {
				var node = nodes[k];
				removeEvtListener(node, 'click', self.handleNodeClick);
				removeEvtListener(node, 'mouseover', self.handleNodeMouseOver);
			}

			self.disableKeyEvents();
			self.selectHandler = null;
			selectedIndex = null;
			enabled = false;
		}
	};

	this.fixupIndex = function(index) {
		return Math.min(nodes.length - 1, Math.max(0, index));
	};

	this.selectNode = function(index) {
		self.clearParentItemSelectTimeout();

		var className = "";

		if (NIL !== selectedIndex && _.isNumber(selectedIndex)) {
			var selectedNode = nodes[selectedIndex];
			className = selectedNode.getAttribute('class') || "";
			className = self.removeClass(className, 'active-list-item');
			selectedNode.setAttribute('class', className);
			if (className) {
				selectedNode.className = className;
			}
		}

		selectedIndex = index = self.fixupIndex(index);

		var node = nodes[index],
			$node = $(node);

		className = node.getAttribute('class') || "";
		className = self.addClass(className, 'active-list-item');
		node.setAttribute('class', className);
		if (className) {
			node.className = className;
		}

		// Close child lists, but only if the selected node is not in the "opened" state
		if (!$node.hasClass('opened')) {
			if (self.childListInteraction) {
				$(menuNode).find('.opened').removeClass('opened');

				self.childListInteraction.close();
			}

			// If the item is a parent, show the sub-menu after a certain period of time
			if ($node.hasClass('parent')) {
				parentItemSelectTimeout = window.setTimeout(
					function() {
						$node.click();
					},
					PARENT_ITEM_SELECT_DELAY
				);
			}
		}
	};

	this.handleNodeMouseOver = function(event) {
		self.clearParentItemSelectTimeout();

		var node = event.target;
		var hasIndex = node.index || node.index == 0;
		while (!hasIndex && node) {
			node = node.parentNode;
			if (node) {
				hasIndex = node.index || node.index == 0;
			}
		}
		if (!node) {
			return;
		}
		var index = node.index;
		self.selectNode(index);
	};

	this.handleNodeClick = function(event) {
		self.clearParentItemSelectTimeout();

		if (self.selectHandler) {
			self.selectHandler.apply(MenuButton, [ event.currentTarget, self ]);
		}
	};

	this.clearParentItemSelectTimeout = function() {
		if (parentItemSelectTimeout) {
			window.clearTimeout(parentItemSelectTimeout);
		}
	};

	this.handleKeyDown = function(event) {
		var handled = true;

		// Special handling for the down arrow key when nothing is selected
		if (NIL === selectedIndex) {
			selectedIndex = ( event.keyCode === 40 ? -1 : 0 );
		}

		if (event && event.keyCode) {
			switch (event.keyCode) {
				case 33: // Page up.
					self.selectNode(-10 + selectedIndex);
					break;
				case 34: // Page down.
					self.selectNode(10 + selectedIndex);
					break;
				case 38: // Up arrow.
					self.selectNode(-1 + selectedIndex);
					break;
				case 40: // Down arrow.
					self.selectNode(1 + selectedIndex);
					break;
				case 36: // Home.
					self.selectNode(0);
					break;
				case 35: // End.
					self.selectNode(nodes.length - 1);
					break;
				case 13:
					if (self.selectHandler) {
						var selectedNode = nodes[selectedIndex];
						self.selectHandler.apply(MenuButton, [ selectedNode, self ]);
					}
					break;
				default:
					handled = false;
			}
		}
		return !handled;
	};

	this.enableKeyEvents = function() {
		addEvtListener(document, 'keydown', self.handleKeyDown);
	};

	this.disableKeyEvents = function() {
		removeEvtListener(document, 'keydown', self.handleKeyDown);
	};

	this.addClass = function(s, c) {
		return s ? c + ' ' + s : c;
	};

	this.removeClass = function(s, c) {
		s = ' ' + s + ' ';
		c = ' ' + c + ' ';
		var index = s.indexOf(c);
		while (index >= 0) {
			s = s.substring(0, index) + ' ' + s.substring(index + c.length);
			index = s.indexOf(c);
		}
		return s.replace(/^\s+/, '').replace(/\s+$/, '');
	};

	this.close = function() {
		if (menuNode) {
			self.clearParentItemSelectTimeout();

			document.body.removeChild(menuNode);
			menuNode = null;

			if (self.childListInteraction) {
				self.childListInteraction.close();
			}
		}
	};

	this.enable();
};
