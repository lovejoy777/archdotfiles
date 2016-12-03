/**
 * Back-end support for generic widgets using the widget API
 */
function GenericWidget(config) {
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
	this.beginScrollableArea = config.beginScrollableArea;

    // config properties specific to WidgetApiWidget
    this.popupSource = config.popupSource;
    if (config.extraProperties) {
        for (var key in config.extraProperties) {
            this[key] = config.extraProperties[key];
        }
    }
    var self = this;

    this.render = function() {
        return "<button class='toolbar-item button' id='" + this.id + "'><img class='icon' src='" + this.img + "' width='" + this.imgWidth + "'/><span class='label'>" + Common.encodeForHTML(this.label) + "</span></button>";
    };

	this.handleRequest = function(request, sender){
		if(request.name == self.id){
			if (request.cmd == 'config') {
				return self;
			}
            else if (request.cmd == 'staticData'){
                return {
                    toolbarId: Global.getToolbarId(),
                    partnerId: Global.getPartnerId(),
                    partnerSubId: Global.getPartnerSubId(),
                    installDate: Global.getInstallDate(),
                    toolbarVersion: window.config.version // todo this is not working for some reason.  not used right now though
                };
			}
            else if (request.cmd == 'feed'){
				var feedRequest = new XMLHttpRequest();
				feedRequest.open('GET', request.url);
				feedRequest.onload = function() {
					return {success: true, text: feedRequest.responseText};
				};
				feedRequest.onerror = function() {
					return {success: false, text: feedRequest.responseText};
				};
				feedRequest.send();
			}
            else if (request.cmd == 'navigate') {
				if (request.url != null) {
                    if (request.dest == 'newTab') {
                        Widget.Content.openPage(request.url, false);
                    } else if (request.dest == 'newWindow') {
                        Widget.Content.openPage(request.url, true);
                    } else {
                        Widget.Content.tabs.update(sender.tab, request.url);
                    }
				}
			}
            else if (request.cmd == 'close') {
                // TODO should not use widget.content, create new method in widget
				Widget.Content.tabs.sendRequest(sender.tab, {cmd: 'REMOVE', containerId: self.id});
            }
            else if (request.cmd == 'resize') {
                // TODO should not use widget.content, create new method in widget
                Widget.Content.tabs.sendRequest(sender.tab, {cmd: 'RESIZE', containerId: self.id, size: request.size});
            }
            else if (request.cmd == 'store') {
                var key = request.name + '_' + request.key;
                localStorage.setItem(key, request.value);
            }
            else if (request.cmd == 'retrieve') {
                var values = {};
                for (var i=0; i < request.keys.length; i++) {
                    var key = request.keys[i];
                    var value = localStorage.getItem(request.name + '_' +key);
                    values[key] = value;
                }
                return values;
            }
            else if (request.cmd == 'getSupportedMessageTypes') {
                // the only type supported by GenericWidget is ExampleMessage, used for test widget
                // widget that require other message types should have custom background class implementation
                return ['ExampleMessage'];
            }
            else if (request.cmd == 'ExampleMessage') {
                // support this for the test widget
                return "hello " + request.echo;
			}
            else if(!request.cmd) {
			    self.handleClick(request, sender.tab);
            }
		}
		return null;
	};

    this.handleClick = function(params, tab) {
        this.showDialog(tab, {
            containerId: self.id,
            src: self.getURL(self.popupSource) + '?' + encodeURIComponent(self.id),
            rectangle: params.rectangle,
            width: self.width,
            height: self.height
        });

		self.logButtonClickedEvent(config.buttonId, params.overflow);
    };
}
GenericWidget.prototype = new Widget.Background();
