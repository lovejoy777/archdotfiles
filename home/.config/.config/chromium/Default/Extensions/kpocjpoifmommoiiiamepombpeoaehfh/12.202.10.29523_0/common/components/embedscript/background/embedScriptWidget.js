function EmbedScriptWidget(config) {
    Widget.Background.initialize(this);
    this.id = config.id;
    this.img = config.img;
    if (this.img != null && this.img.indexOf('http') != 0) {
        this.img = this.getURL(this.img);
    }
	this.imgWidth = config.imgWidth || '';
    this.label = config.label || '';
    this.tooltipText = config.tooltipText || '';

    this.jsUrl = config.jsUrl;
    this.width = config.width;
    this.height = config.height;
    this.navRedirect = !!config.navRedirect;
	this.beginScrollableArea = config.beginScrollableArea;
    var self = this;

    this.render = function() {
        return "<button class='toolbar-item button' id='" + this.id + "'" +
            (this.tooltipText ? " title='" + Common.encodeForAttrValue(this.tooltipText) + "'" : '') +
            ">" +
            "<img class='icon' src='" + this.img + "' width='" + this.imgWidth + "'/>" +
            "<span class='label'>" + Common.encodeForHTML(this.label) + "</span></button>";
    };

	this.handleRequest = function(request, sender) {
		if(request.name == self.id){
			if (request.cmd == 'getJsUrl') {
				return {jsUrl: self.jsUrl, navRedirect: self.navRedirect};
			}
			else if(!request.cmd)
			self.handleClick(request, sender.tab);
		}
    };
	
	this.handleClick = function(params, tab) {
		this.showDialog(tab, {
			containerId: self.id,
			src: this.getURL('common/components/embedscript/html/embedScriptTemplate.html?') + encodeURIComponent(self.id),
			rectangle: params.rectangle,
			width: self.width,
			height: self.height
		});

		self.logButtonClickedEvent(config.buttonId, params.overflow);
	};
}

EmbedScriptWidget.prototype = new Widget.Background();
