var Suggestions = {
    searchBoxId: Common.defaultVal(Common.getParamValue('id'), 'searchBox'),
    maxItems: 10,
    numItems: 0,
    numHistoryItems: 0,
    numSuggestions: 0,
    highlightedItem: -1,

    displaySuggestions: function (request) {
        this.highlightedItem = -1;

        var hpane = document.getElementById('historypane');
        var sgpane = document.getElementById('sgpane');
        this.numItems = 0;
        this.displaySuggestionList(request.historyMatches, hpane, request, 'History');
        this.numHistoryItems = this.numItems;
        this.displaySuggestionList(request.suggestions, sgpane, request, 'Suggestions');
        this.numSuggestions = this.numItems - this.numHistoryItems;

        var dividerVisible = this.numHistoryItems > 0 && this.numSuggestions > 0;
        var dividerClass = dividerVisible ? '' : 'hidden';
        var divider = document.getElementById('divider');
        divider.setAttribute('class', dividerClass);

        // Now resize the parent.
        var container = document.getElementById('container');
        chrome.extension.sendRequest({
            cmd: 'resize',
            size: {
                width: 480,
                height: container.offsetHeight
            }
        });
    },

    displaySuggestionList: function (list, pane, request, header) {
        if (Common.isEmpty(list)) {
            pane.style.display = 'none';
            pane.style.visibility = 'hidden';
            return;
        }
        else {
            pane.style.display = 'block';
            pane.style.visibility = 'visible';
        }

        var div = pane.querySelector('div[class="body"]');
        var child = div.firstChild;
        var item;
        while (child !== null) {
            var next = child.nextSibling;
            div.removeChild(child);
            child = next;
        }

        for (var i = 0; i < list.length && this.numItems < this.maxItems; i++) {
            item = this.createSuggestionListItem(list[i], request.query, this.numItems);
            div.appendChild(item);
            this.numItems++;
        }
    },

    createSuggestionListItem: function (suggestion, query, itemIndex) {
		var suggestionSafe = suggestion.replace(/(<([^>]+)>)/ig, "");   // strip out any HTML tags
        var link = document.createElement('a');

        if (suggestion.indexOf(query) === 0) {
            suggestion = suggestion.substr(query.length);

            var qspan = document.createElement('span');
            qspan.className = 'suggQuery';
            qspan.innerText = query;
            link.appendChild(qspan);
        }

        link.addEventListener('click', function (event) {
                chrome.extension.sendRequest({cmd: 'PERFORM_SEARCH', query: suggestionSafe});    
            
        });

        var sspan = document.createElement('span');
        sspan.innerText = suggestion;
        link.appendChild(sspan);

        var self = this;
        var item = document.createElement('p');
        item.className = 'suggItem';
        item.appendChild(link);
        item.addEventListener('mouseover', function (event) {
            self.highlightSuggestion(0, itemIndex);
        });
        item.addEventListener('mouseout', function (event) {
            self.highlightSuggestion(0, -1);
        });

        return item;
    },

    getSuggestion: function (index) {
        if (Common.defaultVal(index) === null)
            index = this.highlightedItem;

        if (index < 0 || index >= this.numItems)
            return null;

        var pane = null;
        if (index < this.numHistoryItems)
            pane = document.getElementById('historypane');
        else {
            pane = document.getElementById('sgpane');
            index -= this.numHistoryItems;
        }

        var div = pane.querySelector('div[class="body"]');
        var children = div.childNodes;
        return children[index];
    },

    highlightSuggestion: function (increment, newValue) {
        var item = this.getSuggestion();
        if (item !== null)
            item.className = 'suggItem';

        if (Common.defaultVal(newValue) !== null)
            this.highlightedItem = newValue;
        else
            this.highlightedItem += increment;

        if (this.highlightedItem < -1)
            this.highlightedItem = -1;
        else if (this.highlightedItem >= this.numItems)
            this.highlightedItem = this.numItems - 1;

        chrome.extension.sendRequest({cmd: 'HIGHLIGHT_SUGGESTION', index: this.highlightedItem});

        var item = this.getSuggestion();
        if (item !== null)
            item.className = 'highlightedItem';
    }
};
