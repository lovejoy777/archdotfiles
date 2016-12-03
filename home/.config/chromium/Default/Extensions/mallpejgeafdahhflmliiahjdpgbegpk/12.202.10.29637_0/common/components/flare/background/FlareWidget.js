function FlareWidget(config) {
    Widget.Background.initialize(this);
	var self = this;
	this.id = config.id;
    this.img = config.img;
    if (this.img != null && this.img.indexOf('http') != 0) {
        this.img = this.getURL(this.img);
    }
	
	this.imgWidth = config.imgWidth || '';
	this.flareImg = config.img2;
	this.domainUrl = config.domainUrl;
    this.label = config.label || '';
    this.url = config.url;
    this.width = config.width;
    this.height = config.height;
    this.duration = config.duration;
	this.timerId = null;
	this.domains = []; // need to load from domainUrl
	this.navRedirect = !!config.navRedirect;
	this.beginScrollableArea = config.beginScrollableArea;

	var idleHtml = "<button class='toolbar-item button' id='" + this.id + "'><img class='icon' src='" + this.img + "' width='" + this.imgWidth + "'/><span class='label'>" + Common.encodeForHTML(this.label) + "</span></button>",
		innerIdleHtml = "<img class='icon' src='" + this.img + "' width='" + this.imgWidth + "'/><span class='label'>" + Common.encodeForHTML(this.label) + "</span>",
		innerFlareHtml = "<img class='icon' src='" + this.flareImg + "' width='" + this.imgWidth + "'/><span class='label'>" + Common.encodeForHTML(this.label) + "</span>";

    this.render = function() {
		return idleHtml;
    };
	
	this.getDomains = function() {
        var request = new XMLHttpRequest();
        request.open('GET', self.domainUrl);
        request.onload = function() {
            self.domains = request.responseText.split(/\s+/);
        };
        request.send();
	};
	
	var selector = '#' + self.id;

	this.flare = function(tab) {
		self.addClass(selector, "flare", tab);
		// Cleanup the timer, should it exist
		if (typeof self.timerId === "number") {
			window.clearTimeout(self.timerId);
			
			delete self.timerId;
		}
		
		// At the end of the CSS3 transition, replace with new html
		self.timerId = window.setTimeout(
			function() {			
				self.reRender(self.id, innerFlareHtml, tab);
				// Set timer to extinguish the flare
				window.setTimeout(
					function() {
						self.extinguish(tab);
					},
					2000
				);
			},
			1200
		);
	};
	
	this.extinguish = function(tab) {
		self.reRender(self.id, innerIdleHtml, tab);
		self.removeClass(selector, "flare", tab);
	};

	this.checkTabForMatch = function(tab) {
		var isMatch = false,
			i;
		
		var domain = '.' + Common.extractTopLevelDomain(tab.url);
		for (i = 0; i < self.domains.length; i += 1) {
			if (domain == self.domains[i]) {
				isMatch = true;
				break;
			}
		}		
		return isMatch;
	};
	
	
	this.handleRequest = function(request, sender) {
		if(request.name == self.id){
			if (request.cmd == 'extraControls') {
				return {navRedirect: self.navRedirect};
			}
			else if(!request.cmd)
			self.handleClick(request, sender.tab);
		} else if (request.name == 'toolbarReady') {
			if (self.checkTabForMatch(sender.tab)) {
				self.flare(sender.tab);
			}
		}
    };
	
	this.handleClick = function(params, tab) {
		this.showDialog(tab, {
			containerId: self.id,
			src: paramReplacer.replaceParams(self.url, tab),
			rectangle: params.rectangle,
			width: self.width,
			height: self.height
		});

		self.logButtonClickedEvent(config.buttonId, params.overflow);
	};
	
	// fetch domains on startup and periodically
	this.getDomains();
    setInterval(function() {
        self.getDomains();
    }, 60 * 60 * 1000);
};

FlareWidget.prototype = new Widget.Background();
