function AbstractButton(config) {
	var self = this;
	
	Widget.Background.initialize(self);
	
    self.id = config.id;
    self.img = config.img;
    if (self.img != null && self.img.indexOf('http') != 0) {
        self.img = self.getURL(self.img);
    }
	self.imgWidth = config.imgWidth || '';
    self.label = config.label || '';
    self.tooltipText = config.tooltipText || '';
	self.beginScrollableArea = config.beginScrollableArea;

    self.render = function() {
        return "<button class='toolbar-item button' id='" + self.id + "'" +
            (self.tooltipText ? " title='" + Common.encodeForAttrValue(self.tooltipText) + "'" : '') +
            ">" +
            "<img class='icon' src='" + self.img + "' width='" + self.imgWidth + "'/>" +
            "<span class='label'>" + Common.encodeForHTML(self.label) + "</span></button>";
    };

	self.handleRequest = function(request, sender, sendResponse) {
		if (request.name === self.id) {
			self.onRequest(request, sender, sendResponse);

			self.logButtonClickedEvent(config.buttonId, request.overflow);
		}
    };
}

AbstractButton.prototype = new Widget.Background();
