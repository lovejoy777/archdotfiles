
window.onload = function() {
    chrome.extension.onRequest.addListener(
        function(request, sender, sendResponse) {
            if (request.cmd == 'SHOW_SUGGESTIONS')
                Suggestions.displaySuggestions(request);
            else if (request.cmd === 'NEXT_SUGGESTION')
                Suggestions.highlightSuggestion(1);
            else if (request.cmd === 'PREV_SUGGESTION')
                Suggestions.highlightSuggestion(-1);
        });

    chrome.extension.sendRequest({ cmd: 'SEARCH_SUGGESTION_INIT' });
};
