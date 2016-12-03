function MovieReviews(config) {
    this.id = config.id;
    this.img = config.img;
    if (this.img != null && this.img.indexOf('http') != 0) {
        this.img = chrome.extension.getURL(this.img);
    }
	this.imgWidth = config.imgWidth || '';
    this.label = config.label || '';

    this.width = config.width;
    this.height = config.height;

    var self = this;

    this.render = function() {
        return "<button class='toolbar-item button' id='" + this.id + "'><img class='icon' src='" + this.img + "' width='" + this.imgWidth + "'/><span class='label'>" + Common.encodeForHTML(this.label) + "</span></button>";
    };

	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {
			if (request.name == self.id) {
				if (request.cmd == 'config') {
					sendResponse(self);
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
						chrome.tabs.update(sender.tab.id, {url: request.url});
					}
				} else if (request.cmd == 'close') {
					chrome.tabs.sendRequest(sender.tab.id, {cmd:"REMOVE", containerId: self.id});
				} else {
					chrome.tabs.sendRequest(sender.tab.id, {
						cmd: "ADD",
						containerId: self.id,
						src: chrome.extension.getURL('components/moviereviews/html/movieReviews.html?' + encodeURIComponent(self.id)),
						rectangle: request.rectangle,
						width: self.width,
						height: self.height
					});

					self.logButtonClickedEvent(config.buttonId, request.overflow);
				}
			}
		});

}

MovieReviews.prototype = new Widget.Background();