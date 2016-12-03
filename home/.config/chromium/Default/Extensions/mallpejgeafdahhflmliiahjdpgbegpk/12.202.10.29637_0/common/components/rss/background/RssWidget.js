function RssWidget(config) {
    Widget.Background.initialize(this);
    this.id = config.id;
    this.img = config.img;
    if (this.img != null && this.img.indexOf('http') != 0) {
        this.img = this.getURL(this.img);
    }
	this.imgWidth = config.imgWidth || '';
    this.label = config.label || '';

    this.width = config.width;
    this.height = config.height;
    this.title = config.title;
    this.titleIconUri = config.titleIconUri;
    this.poweredBy = config.poweredBy;
    this.layoutMode = config.layoutMode;
    this.displayMode = config.displayMode;
    this.feeds = config.feeds;
    this.tooltipText = config.tooltipText || '';
	this.extractImageFromDescription = config.extractImageFromDescription;
	this.beginScrollableArea = config.beginScrollableArea;
    var self = this;

    this.render = function() {
        return "<button class='toolbar-item button' id='" + this.id + "'" +
            (this.tooltipText ? " title='" + Common.encodeForAttrValue(this.tooltipText) + "'" : '') +
            ">" +
            "<img class='icon' src='" + this.img + "' width='" + this.imgWidth + "'/>" +
            "<span class='label'>" + Common.encodeForHTML(this.label) + "</span></button>";
    };
	
	this.handleRequest = function(request, sender, sendResponse){
		if(request.name == self.id){
			if (request.cmd == 'config') {
				//sendResponse(self);
				return self;
			} else if (request.cmd == 'feed'){
				var feedRequest = new XMLHttpRequest();
				feedRequest.open('GET', request.url);
				feedRequest.onload = function() {
					sendResponse({success: true, text: feedRequest.responseText});
				};
				feedRequest.onerror = function() {
					sendResponse({success: false, text: feedRequest.responseText});
				};
				feedRequest.send();
			} else if (request.cmd == 'navigate') {
				if (request.url != null) {
					Widget.Content.tabs.update(sender.tab, request.url);
				}
			} else if (request.cmd == 'close') {
                this.hideDialog(sender.tab, {containerId: this.id});
			}
			else if(!request.cmd)
			self.handleClick(request, sender.tab);
		}
		return null;
	};
	
	
    this.handleClick = function(params, tab) {
        this.showDialog(tab, {
            containerId: self.id,
            src: self.getURL('common/widget-api/widgets/rss/rssWidget.html?') + encodeURIComponent(self.id),
            rectangle: params.rectangle,
            width: self.width,
            height: self.height
        });

		self.logButtonClickedEvent(config.buttonId, params.overflow);
    };
}
RssWidget.prototype = new Widget.Background();
