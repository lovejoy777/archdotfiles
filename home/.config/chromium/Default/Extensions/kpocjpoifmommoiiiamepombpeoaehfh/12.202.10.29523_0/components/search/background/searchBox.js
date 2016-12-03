function SearchBox(config) {
	var self = this;

    this.id = config.id;
    this.img = config.img;
	this.beginScrollableArea = config.beginScrollableArea;

	// Customization
    var backgroundColor = config.backgroundColor,
		borderColor = config.borderColor || "#2266AA",
		borderPixels = Common.isNotNull(config.borderPixels) ? config.borderPixels : 2,   // 0 is a legal value
		// Hack: IE toolbar seems to add 1 to the radius, and FF anti-aliasing tends to obscure another pixel, so add 2 to the value
		borderRadiusPixels = Common.isNotNull(config.borderRadiusPixels) ? (config.borderRadiusPixels > 0 ? config.borderRadiusPixels + 2 : 0) : 0,
		textColor = config.textColor,
		watermarkText = config.watermarkText || "", // not supported in FF
		widthChars = config.widthChars || 34;

    if (this.img != null && this.img.indexOf('http') != 0) {
        this.img = chrome.extension.getURL(this.img);
    }
    
    this.searchButton = null;

    if (config.menu) {
        this.searchButton = WidgetFactory.createWidget(config.menu, imageWidths);
    }

    this.searchUrl = config.searchUrl;

    this.SEARCH_HISTORY_KEY = 'searchHistory';
    this.MAX_HISTORY_ENTRIES = 20;
    this.history = [];
    this.curMatches = [];
    this.curSuggestions = [];
    this.curSuggestion = -1;

    this.disappearingAskIconURL = Common.getBuildVars().disappearingAskLogoURL;
    this.showAskLogo = !Common.isEmpty(this.disappearingAskIconURL);

    this.renderState = {};

    this.getRenderState = function(tab){
        var renderState = this.renderState[tab.windowId];
        if (!renderState){
            this.renderState[tab.windowId] = renderState = {
                showAskLogo: true,
                html: undefined
            }
        }
        return renderState;
    };

    this.init = function() {
        var h = Global.retrieve(this.SEARCH_HISTORY_KEY);
        if (Common.isNotNull(h)) {
            try {
                this.history = JSON.parse(h);
            }
            catch (e) {
                console.log('Exception parsing search history: ' + e);
            }
        }

        SearchBox.singleInstance = this;
    };

    this.performSearch = function(params, tab, url){
        var q = searchContext.getQuery(tab.id),
            self = this;

        //TODO uncomment this for the next RC
        //self.addToHistory(q);
        var url = paramReplacer.replaceParams(url || self.searchUrl, tab);
        chrome.tabs.update(tab.id, { url: url });
        self.hideAskLogo(tab);
    };

    this.render = function(tab) {
        var renderState = this.getRenderState(tab),
            html = renderState.html,
			_widthChars = widthChars;

		if (!html){

            var rules = [
                "border: " + borderPixels + "px solid " + borderColor,
                "background: " + backgroundColor,
                "border-radius: " + borderRadiusPixels + "px"
            ];

            if (textColor) {
                rules.push("color: " + textColor);
            }

            console.log('sB: render - showAskLogo: %s, windowId: %s, renderState: %O', this.showAskLogo, tab.windowId, renderState);
            if (this.showAskLogo && renderState.showAskLogo){
				_widthChars -= 5;

                console.log('sB: render showAskLogo');
                rules.push('background-color: white');
                rules.push('background-image: url(' + this.disappearingAskIconURL + ')');
                rules.push('background-position: 100% 50%');
                rules.push('background-repeat: no-repeat no-repeat');
                rules.push('padding-right: 28px');
            }else{
                console.log('sB: render !showAskLogo');
            }

            var classNames = [];

            if (!this.searchButton) {
                classNames.push("extract-search-icon");
            }

            var attributes = [
                //IMPORTANT: do no set the size attr, since Chrome's sizing logic goes screwy with certain zoom settings
                'style="' + rules.join(';') + '"',
                'class="' + classNames.join(' ') + '"'
            ];

            html = '<input id="searchfor" name="searchfor" type="text" autocomplete="off" ' + attributes.join(' ') + '/>';

            if (this.searchButton) {
                html = '<div id="searchCombo">' +
                    this.searchButton.render(tab) +
                    html +
                    '</div>';
            }

            renderState.html = html;
        }

		return html;
	};

    this.getSuggestions = function (query, rectangle) {
        this.rectangle = rectangle;
        var url = Common.getSearchSuggUrl(query);
        Common.getExternalData(url, function (response) { self.displaySuggestions(response, query); });
    };

    this.displaySuggestions = function (responseJson, query) {
        self.curSuggestion = -1;
        self.curMatches = self.findMatchesInHistory(query);
        self.curSuggestions = [];
        try {
            var response = JSON.parse(responseJson);
            self.curSuggestions = self.excludeMatches(response[1]);
        }
        catch (e) {
            console.log('Error parsing suggestion JSON ' + responseJson + ': ' + e.message);
            try{
                var response = eval(responseJson);
                self.curSuggestions = self.excludeMatches(response[1]);
            } catch(e){
                console.log('Error trying eval on JSON-P ' + responseJson + ': ' + e.message);
            }
        }

        if (!self.curMatches.length && !self.curSuggestions.length) {
            this.hideSuggestions();
            return;
        }

        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.sendRequest(tab.id,
                {
                    cmd:"ADD",
                    keepFrameOpen: true,
                    containerId: self.id,
                    src: chrome.extension.getURL('components/search/html/searchSuggestions.html?id=' + encodeURIComponent(self.id) + '&q=' + encodeURIComponent(query)),
                    rectangle: self.rectangle,
                    width: 480,
                    height: 1
                },
                function(response) {
                	// Send a message to the toolbar iframe to tell it to set focus back to the search box
                	chrome.tabs.sendRequest(tab.id, {cmd: 'SET_FOCUS', id: 'searchfor'});

                    self.lastSuggestionsRequest = {cmd: 'SHOW_SUGGESTIONS',
                        query: query,
                        historyMatches: self.curMatches,
                        suggestions: self.curSuggestions
                    };

                    chrome.tabs.sendRequest(tab.id, self.lastSuggestionsRequest);
                }
            );
        });
    };

    this.hideSuggestions = function() {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.sendRequest(tab.id, {
                containerId: self.id,
                cmd: 'REMOVE'
            });
        });
    };

    this.findMatchesInHistory = function (query) {
        query = Common.trim(query.toLowerCase());
        var matches = [];
        // Look in reverse order (newest first)
        for (var i = self.history.length - 1; i >= 0; i--) {
            var entry = self.history[i];
            if (entry.substr(0, query.length) === query)
                matches.push(entry);
        }
        return matches;
    };
    
    this.excludeMatches = function (suggestions) {
        var result = [];
        for (var i = 0; i < suggestions.length; i++) {
            var match = false;
            for (var j = 0; j < self.curMatches.length; j++) {
                if (self.curMatches[j] === suggestions[i]) {
                    match = true;
                    break;
                }
            }
            if (!match)
                result.push(suggestions[i]);
        }
        return result;
    };

    this.addToHistory = function (query) {
        if (Common.isNull(query))
            return;

        // See if it's already in the history
        query = Common.trim(query).toLowerCase();
        if (query.length === 0)
            return;

        for (var i = 0; i < self.history.length; i++) {
            if (self.history[i] === query) {
                self.history.splice(i, 1);
                break;
            }
        }

        if (self.history.length >= self.MAX_HISTORY_ENTRIES)
            self.history.shift();
        self.history.push(query);
        Global.store(this.SEARCH_HISTORY_KEY, JSON.stringify(this.history));
    };

    this.hideAskLogo = function(tab){
        var renderState = this.getRenderState(tab);
        if (this.showAskLogo && renderState.showAskLogo){
            console.log('sB: hideAskLogo(%s) - hiding', tab);
            renderState.showAskLogo = false;
            renderState.html = undefined;

            chrome.tabs.query(
                {
                    windowId: tab.windowId
                },
                function(tabs) {
                    tabs.forEach(function(tab){
                        chrome.tabs.sendRequest(tab.id, {cmd: 'HIDE_ASK_LOGO'});
                    });
                }
            );

            this.render(tab);
        }

        console.log('sB: hideAskLogo - fini');
    };

    chrome.extension.onRequest.addListener(
        function(request, sender, sendResponse) {
            if (request.cmd == 'SEARCHBOX_INPUT') {
                var q = request.query;
                searchContext.updateQuery(sender.tab.id, q);
                if (Common.isNotEmpty(q))
                    self.getSuggestions(q, request.rectangle);
            }
            else if (request.cmd === 'SEARCH_SUGGESTION_INIT') {
                if (self.lastSuggestionsRequest) {
                    chrome.tabs.sendRequest(sender.tab.id, self.lastSuggestionsRequest);
                }
            }
            else if (request.cmd === 'PERFORM_SEARCH') {
                var q = request.query;
                // If there's a highlighted suggestion, use that instead of the value of the search box
                if (self.curSuggestion >= 0) {
                    if (self.curSuggestion < self.curMatches.length)
                        q = self.curMatches[self.curSuggestion];
                    else if (self.curSuggestion < self.curMatches.length + self.curSuggestions.length)
                        q = self.curSuggestions[self.curSuggestion - self.curMatches.length];
                }
                searchContext.updateQuery(sender.tab.id, q);
                self.addToHistory(q);
                var url = paramReplacer.replaceParams(self.searchUrl, sender.tab);
                chrome.tabs.update(sender.tab.id, { url: url });
                self.hideAskLogo(sender.tab);
            }
            else if (request.cmd === 'SEARCHBOX_DOWNARROW') {
                chrome.tabs.sendRequest(sender.tab.id, {cmd: 'NEXT_SUGGESTION'});
            }
            else if (request.cmd === 'SEARCHBOX_UPARROW') {
                chrome.tabs.sendRequest(sender.tab.id, {cmd: 'PREV_SUGGESTION'});
            }
            else if (request.cmd === 'HIGHLIGHT_SUGGESTION') {
                self.curSuggestion = Common.defaultVal(request.index, -1);
            }
            else if (request.cmd === 'resize') {
                var size = request.size;
                chrome.tabs.sendRequest(sender.tab.id, {cmd: "RESIZE", containerId: self.id, size: size});
            }
        });

    this.init();
}
