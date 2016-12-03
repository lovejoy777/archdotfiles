window.util || (window.util = {});

util.ListInteraction = {
	enabled: false,
	selectedIndex: null,
	nodes: null,

	enable: function(nodes, selectHandler) {
		if (!nodes || !nodes.length) {
			throw 'At least one node is required.';
		}

		var self = util.ListInteraction;
		if (self.enabled) {
			self.disable();
		}

		self.nodes = nodes;
		for (var k = 0; k < self.nodes.length; k++) {
			var node = self.nodes[k];
			node.index = k;
			addEvtListener(node, 'click', self.handleNodeClick);
			addEvtListener(node, 'mouseover', self.handleNodeMouseOver);
		}

		self.selectHandler = selectHandler;
		self.selectedIndex = null;
		self.selectNode(0);
		self.enableEvents();
		self.enabled = true;
	},

	disable: function() {
		var self = util.ListInteraction;
		if (self.enabled) {
			for (var k = 0; k < self.nodes.length; k++) {
				var node = self.nodes[k];
				removeEvtListener(node, 'click', self.handleNodeClick);
				removeEvtListener(node, 'mouseover', self.handleNodeMouseOver);
			}

			self.disableEvents();
			self.selectHandler = null;
			self.selectedIndex = null;
			self.nodes = null;
			self.enabled = false;
		}
	},

	fixupIndex: function(index) {
		var self = util.ListInteraction;
		return Math.min(self.nodes.length - 1, Math.max(0, index));
	},

	selectNode: function(index) {
		var self = util.ListInteraction;

		if (self.selectedIndex || self.selectedIndex == 0) {
			var selectedNode = self.nodes[self.selectedIndex];
			var className = selectedNode.getAttribute('class');
			className = self.removeClass(className, 'active-list-item');
			selectedNode.setAttribute('class', className);
			selectedNode.className = className;
		}

		index = self.fixupIndex(index);

		var node = self.nodes[index];
		var className = node.getAttribute('class');
		className = self.addClass(className, 'active-list-item');
		node.setAttribute('class', className);
		node.className = className;

		if (node.nodeName.toLowerCase() == 'tr') {
			// Table rows don't respond to scrollIntoView, at least not in IE 7.
			for (var k = 0; k < node.childNodes.length; k++) {
				var childNode = node.childNodes[k];
				childNode.scrollIntoView(false);
			}
		} else {
			node.scrollIntoView(false);
		}

		self.selectedIndex = index;
	},

	handleNodeMouseOver: function(event) {
		var node = event.target || event.srcElement;
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
		var self = util.ListInteraction;
		var index = node.index;
		self.selectNode(index);
	},

	handleNodeClick: function(event) {
		var self = util.ListInteraction;
		if (self.selectHandler) {
			self.selectHandler.apply(null, [event.target || event.srcElement]);
		}
	},

	handleKeyDown: function(event) {
		var self = util.ListInteraction;

		var handled = true;
		if (event && event.keyCode) {
			switch (event.keyCode) {
			case 33: // Page up.
				self.selectNode(-10 + self.selectedIndex);
				break;
			case 34: // Page down.
				self.selectNode(10 + self.selectedIndex);
				break;
			case 38: // Up arrow.
				self.selectNode(-1 + self.selectedIndex);
				break;
			case 40: // Down arrow.
				self.selectNode(1 + self.selectedIndex);
				break;
			case 36: // Home.
				self.selectNode(0);
				break;
			case 35: // End.
				self.selectNode(self.nodes.length - 1);
				break;
			case 13:
				if (self.selectHandler) {
					var selectedNode = self.nodes[self.selectedIndex];
					self.selectHandler.apply(null, [selectedNode]);
				}
				break;
			default:
				handled = false;
			}
		}
		return !handled;
	},

	enableEvents: function() {
		var self = util.ListInteraction;
		addEvtListener(document, 'keydown', self.handleKeyDown);
	},

	disableEvents: function() {
		var self = util.ListInteraction;
		removeEvtListener(document, 'keydown', self.handleKeyDown);
	},

	addClass: function(s, c) {
		return c + ' ' + s;
	},

	removeClass: function(s, c) {
		s = ' ' + s + ' ';
		c = ' ' + c + ' ';
		var index = s.indexOf(c);
		while (index >= 0) {
			s = s.substring(0, index) + ' ' + s.substring(index + c.length);
			index = s.indexOf(c);
		}
		return s.replace(/^\s+/, '').replace(/\s+$/, '');
	}
};
