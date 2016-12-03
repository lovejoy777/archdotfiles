var radioPlayer,
	RADIO_WRAPPER_FRAME_ID = "radioWrapper";

function addRadioFrame() {
	var domRadioFrame = document.getElementById(RADIO_WRAPPER_FRAME_ID);

	if (!domRadioFrame) {
		domRadioFrame = document.createElement('iframe');
		domRadioFrame.setAttribute('id', RADIO_WRAPPER_FRAME_ID);
		domRadioFrame.src = 'http://ak.imgfarm.com/images/toolbar/radio/radioWrapper.html';
		document.body.appendChild(domRadioFrame);
	}
}

function turnOffRadio() {
    if (radioPlayer) {
        if (radioPlayer.isPlaying) {
            chrome.tabs.getSelected(null, function(tab) {
                radioPlayer.stop();
                radioPlayer.showIdle(tab);
                radioPlayer.hideError(tab);
            });
        }
    }
}

function RadioWidget(config) {

	addRadioFrame();

	var self = this;
    radioPlayer = this;

    this.id = 'radioWidget';
    this.width = config.width;
    this.height = config.height;
    this.maximumNumberOfDisplayedItems = config.maximumNumberOfDisplayedItems || 100;
    this.radioTimePartnerId = 'QAN!60_e';
    this.formats = '&formats=mp3';
    this.featuredCategory = config.featuredCategory;
    this.isMaximized = true;
    this.isVolumeShowing = false;
    this.isPlaying = false;
    this.volume = .5;
	this.beginScrollableArea = config.beginScrollableArea;

    this.getUserContextualUriSuffix = function() {
        return 'partnerId=' + encodeURIComponent(this.radioTimePartnerId)
            + '&serial=' + encodeURIComponent(Global.getToolbarId());
    };

    this.render = function() {
        return "<div class='toolbar-item' id='" + this.id + "'>" + this.getHtml() + "</div>";
    };

    this.reRender = function() {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.sendRequest(tab.id, {cmd:"REPLACE", containerId: self.id, html: self.getHtml()});
        });
    };

    this.getHtml = function() {
    	var template = document.getElementById("radioWidgetTemplate").innerHTML;
    	return Common.replaceKeys(template, {
    		id: this.id,
    		volume: this.volume,
		    stationName: !this.currentStation ? "Radio" : this.currentStation.name,
		    playClassName: ( this.isPlaying ? "playing" : "stopped" ),
		    displayClassName: ( this.isMaximized ? "" : "collapsed" ),
		    volumeClassName: ( this.isVolumeShowing ? "" : "hidden" )
    	});
    };

    this.callRadio = function(cmd, args) {
        var request = {name: 'radioWidgetInterface', cmd: cmd};
        if (args) {
            for (var i = 0; i < args.length; i++) {
                request[args[i].name] = args[i].value;
            }
        }
        chrome.extension.sendRequest(request, function(response) {});
    };

    this.clearPlaylist = function() {
        this.callRadio('clearPlaylist');
        this.isPlaying = false;
    };

    this.play = function() {
        this.callRadio('play');
        this.isPlaying = true;

    };

    this.stop = function() {
        this.callRadio('stop');
        this.isPlaying = false;

    };

    this.addToPlaylist = function(url) {
        this.callRadio('addToPlaylist', [{name: 'url', value: url}]);
        if (!this.isPlaying) {
            this.isPlaying  = true;
            this.play();
            chrome.tabs.getSelected(null, function(tab) {
                self.showPlaying(tab);
                self.showLoading(tab);
                self.hideError(tab);
            })
        }
    };

    this.setVolume = function(volume) {
        this.volume = volume;
        this.callRadio('setVolume', [{name: 'volume', value: volume * 100}]);
    };

    this.loadStation = function(station) {
		this.currentStation = station;
        //Clear out all the current source urls

        this.clearPlaylist();

		// Station is a URL that returns a LIST of URLs that can be either playlists or
		// audio streams.  Playlists can be in various formats and contain urls to audio streams
		// Traverse this tree and add all audio streams we find to the audio element.
        var req = new XMLHttpRequest();
        req.open('GET', station.uri);
        req.onload = function() {
			var urls = req.responseText.split(/\s*\n\s*/);
			for (var i=0; i < urls.length; i++) {
				var url = Common.trim(urls[i]);
				if (url != "")
					self.loadPlaylist(url);
			}
        };
        req.onerror = function(e) {
            console.log("error loading station " + station.name + ": " + e.messsage || e);
        };
        req.send();

		// update UI
    	this.reRender();
	};

	this.loadPlaylist = function(url) {
        var self = this;
        if (url.indexOf('mms://') == 0) {
            this.addToPlaylist(url);
            return;
        }
        var req = new XMLHttpRequest();
        req.open('HEAD', url);
        req.onload = function() {
			var mimeType = req.getResponseHeader("Content-Type");
            if (self.isKnownErrorResponse(req.status) && !self.isPlaylistUrl(url)) {
                //Head request is not always valid for streams themselves.
                self.addToPlaylist(url);
            } else if (!self.isKnownErrorResponse(req.status) && (mimeType == 'audio/mpeg' || mimeType == 'application/ogg')) {
                self.addToPlaylist(url);
            } else if (!self.isKnownErrorResponse(req.status) && (mimeType == 'text/html')) {
                //Might be shoutcast
                self.addToPlaylist(url + ';');
            } else {
                var contentReq = new XMLHttpRequest();
                var receivedResponse = false;
                contentReq.open('GET', url);
                contentReq.onload = function() {
                    receivedResponse = true;
                    var content = contentReq.responseText;
                    var streams = self.extractStreams(Common.extractExtension(url), mimeType, content);
                    for (var i = 0; i < streams.length; i++) {
                        self.addToPlaylist(streams[i]);
                    }
                };
                contentReq.onerror = function(e) {
                    receivedResponse = true;
                    console.log("error loading playlist " + url + ": " + e.messsage || e);
                };
                contentReq.send();
                //Wait 5 seconds for a response.  If there hasn't been a response, assume it's a stream and abort the rquest
                setTimeout(function() {
                    if (!receivedResponse) {
                        Mindspark_.log("5 Seconds passed, adding to playlist");
                        contentReq.abort();
                        self.addToPlaylist(url);
                    }
                }, 5000);
            }
        };
        req.onerror = function(e) {
            console.log("error loading playlist " + url + ": " + e.messsage || e);
        };
        req.send();
	};

    this.isKnownErrorResponse = function(code) {
        return code == 400 || code == 501;
    };

    this.extractStreams = function(extension, mimeType, content) {
        /*
            Need to figure out what type of playlist it is.
            Possibilities:
                ASX:  Content type unknown.  Content should start with '<asx' ignore case.  Extension 'asx'.
                PLS:  Content type 'audio/x-scpls.  Content should start with '[playlist]' ignore case.  Extension 'pls'.
                M3U:  Content type 'audio/mpegurl' or 'audio/x-mpegurl'.  Content should start with '#EXTM3U' ignore case.  Extension 'm3u'.
                ASF:  Content type unknown.  Content should start with '[Reference]' ignore case.  Extension 'asf'.

                Sample logic from radiotime (http://inside.radiotime.com/developers/guide/solutions/streaming/appendix-e)
                Checks the actual content, then content-type (in case there's a mismatch), then extension.
         */
        content = Common.trim(content);
        extension = Common.trim(extension).toLowerCase();
        if (content.substr(0, 4).toLowerCase() == '<asx') {
            return this.extractASXStreams(content);
        } else if (content.substr(0, 10).toLowerCase() == '[playlist]' || mimeType == 'audio/x-scpls') {
            return this.extractPLSStreams(content);
        } else if (content.substr(0, 11).toLowerCase() == '[reference]') {
            return this.extractASFStreams(content);
        } else if (content.substr(0, 7).toLowerCase() == '#extm3u' || mimeType == 'audio/mpegurl' || mimeType == 'audio/x-mpegurl') {
            return this.extractM3UStreams(content);
        } else if (extension == 'asx') {
            return this.extractASXStreams(content);
        } else if (extension == 'pls') {
            return this.extractPLSStreams(content);
        } else if (extension == 'asf') {
            return this.extractASFStreams(content);
        } else if (extension == 'm3u') {
            return this.extractM3UStreams(content);
        }
        return new Array();
    };

    this.isPlaylistUrl = function(url) {
        var extension = Common.trim(Common.extractExtension(url)).toLowerCase();
        return (extension == 'asx' || extension == 'pls' || extension == 'asf' || extension == 'm3u');
    };

    this.extractM3UStreams = function(content) {
        var streams = new Array();
        var lines = content.split(/[\r\f\n]+/);
        var commentRegEx = /\s*#/;
        for (var i = 0; i < lines.length; i++) {
            var line = Common.trim(lines[i]);
            if (line.length > 0 && !commentRegEx.test(line)) {
                streams.push(line);
            }
        }
        return streams;
    };

    this.extractPLSStreams = function(content) {
        var streams = new Array();
        var lines = content.match(/\s*File\d+\s*=.+/gi);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            streams.push(Common.trim(line.split('=')[1]));
        }
        return streams;
    };

    this.extractASXStreams = function(content) {
        var streams = new Array();
        var tags = content.match(/\s*<ref[^>]+>/gi);
        var hrefRexex = /["']/;
        for (var i = 0; i < tags.length; i++) {
            var parts = tags[i].split(hrefRexex);
            if (parts.length == 3) {
                streams.push(parts[1]);
            }
        }
        return streams;
    };

    this.extractASFStreams = function(content) {
        var streams = new Array();
        var lines = content.match(/\s*Ref\d+\s*=.+/ig);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            streams.push(Common.trim(line.split('=')[1]));
        }
        return streams;
    };

    this.togglePlay = function(tab) {
	    if (this.isPlaying) {
            this.stop();
            this.showIdle(tab);
	    } else {
		    this.play();
            this.showPlaying(tab);
            this.showLoading(tab);
	    }
        this.hideError(tab);
    };

    this.showPlaying = function(tab) {
        this.updateClass(tab, 'ADDCLASS', '.toggle-play', 'playing');
    };

    this.showIdle = function(tab) {
        this.updateClass(tab, 'REMOVECLASS', '.toggle-play', 'playing');
    };

    this.showLoading = function(tab) {
        this.updateClass(tab, 'ADDCLASS', '.state-icon', 'loading');
    };

    this.hideLoading = function(tab) {
        this.updateClass(tab, 'REMOVECLASS', '.state-icon', 'loading');
    };

    this.showError = function(tab) {
        this.updateClass(tab, 'ADDCLASS', '.state-icon', 'error');
    };

    this.hideError = function(tab) {
        this.updateClass(tab, 'REMOVECLASS', '.state-icon', 'error');
    };

    this.updateClass = function(tab, cmd, selector, className) {
        chrome.tabs.sendRequest(tab.id, {cmd: cmd, selector: selector, className: className});
    };

	this.toggleDisplay = function(tab) {

		var cmd;

		if (self.isMaximized) {
			cmd = "ADDCLASS";
		} else {
			cmd = "REMOVECLASS";
		}

        this.updateClass(tab, cmd, '.inner-container', 'collapsed');
		self.isMaximized = !self.isMaximized;
	};

	this.toggleVolumeDisplay = function(tab) {

		var cmd;

		if (!self.isVolumeShowing) {
			cmd = "REMOVECLASS";
		} else {
			cmd = "ADDCLASS";
		}

		chrome.tabs.sendRequest(
			tab.id,
			{
				cmd: cmd,
				selector: "#" + self.id + "_volumeSlider",
				className: "hidden"
			}
		);

		self.isVolumeShowing = !self.isVolumeShowing;
	};


	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {
			var tab = sender.tab,
				hideVolumeDisplay = (
					self.isVolumeShowing
					&& (request.name !== self.id + "_volume" || request.name === "contentBodyClicked")
				),
				logButtonClickedEvent = function() {
					self.logButtonClickedEvent(config.buttonId, request.overflow);
				};

			// Hide the volume slider when applicable
			if (hideVolumeDisplay) {
				self.toggleVolumeDisplay(tab);
			}

			if (request.name == self.id + "_togglePlay") {
				self.togglePlay(tab);

				logButtonClickedEvent();
			}
			else if (request.name == self.id + "_toggleDisplay") {
				self.toggleDisplay(tab);

				logButtonClickedEvent();
			}
			else if (!hideVolumeDisplay && request.name == self.id + "_toggleVolumeDisplay") {
				self.toggleVolumeDisplay(tab);

				logButtonClickedEvent();
			}
			else if (request.name == self.id + "_volume") {
				self.setVolume(request.volume);
			}
			else if (request.name == self.id) {
				if (request.cmd == 'loadStation') {
					self.loadStation(request.station);
				} else if (request.cmd == 'config') {
					sendResponse({
//                        maximumNumberOfDisplayedItems: self.maximumNumberOfDisplayedItems,
                        featuredCategory: self.featuredCategory,
                        userContextualUriSuffix: self.getUserContextualUriSuffix(),
                        radioTimePartnerId: self.radioTimePartnerId,
                        formats: self.formats
                    });
                } else if (request.cmd == 'staticData'){
                    sendResponse({
                        toolbarId: Global.getToolbarId(),
                        partnerId: Global.getPartnerId(),
                        partnerSubId: Global.getPartnerSubId(),
                        installDate: Global.getInstallDate(),
                        toolbarVersion: config.version
                    });
				} else if (request.cmd == 'feed'){
					var feedRequest = new XMLHttpRequest();
					feedRequest.open('GET', request.url);
					feedRequest.onload = function() {
						sendResponse({success: true, text: feedRequest.responseText});
					};
					feedRequest.onerror = function(e) {
						sendResponse({success: false, error: e.target.status});
					};
					feedRequest.send();
				} else if (request.cmd == 'navigate') {
					if (request.url != null) {
						chrome.tabs.update(tab.id, {url: request.url});
					}
				} else if (request.cmd == 'close') {
					chrome.tabs.sendRequest(tab.id, {
						cmd: "REMOVE",
						containerId: self.id
					});
				} else if (request.cmd == 'error') {
                    //Need to get the selected one because it might not be passed by a content script.
                    chrome.tabs.getSelected(null, function(tab) {
                        self.isPlaying = false;
                        self.showIdle(tab);
                        self.hideLoading(tab);
                        self.showError(tab);
                    });
                } else if (request.cmd == 'playing') {
                    //Need to get the selected one because it might not be passed by a content script.
                    chrome.tabs.getSelected(null, function(tab) {
                        self.isPlaying = true;
                        self.hideLoading(tab);
                    });
                } else {
					chrome.tabs.sendRequest(tab.id, {
						cmd: "ADD",
						containerId: self.id,
						src: chrome.extension.getURL('common/widget-api/widgets/radio/radio-widget.html?' + encodeURIComponent(self.id)),
						rectangle: request.rectangle,
						width: self.width,
						height: self.height
					});

					logButtonClickedEvent();
				}
			}
		}
	);
}

RadioWidget.prototype = new Widget.Background();