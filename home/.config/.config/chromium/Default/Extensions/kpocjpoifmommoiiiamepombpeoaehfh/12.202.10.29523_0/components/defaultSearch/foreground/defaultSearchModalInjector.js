var container = document.createElement('section'),
    addListener = function(){
        console.log('USP-INJ: addListener()');
        //TODO: consider replacing hard coded string with reference to updateSearchPromptBg.BACKGROUND.MSG_NAME
        Messaging_addListener({"name" : "CDS_BG_MSG", "cmd" : "CDS_BG_REMOVE_CMD"}, bgListener);
        console.log('USP-INJ: addListener - leaving');
    },
    bgListener = function(request /*, sender, sendResponse*/){
        console.log('USP-INJ: bgListener(%s)', request);
        switch (request.cmd){
        //TODO: consider replacing hard coded string with reference to updateSearchPromptBg.BACKGROUND.REMOVE_CMD
        case "CDS_BG_REMOVE_CMD":
            removeAll();
            break;
        }
        console.log('USP-INJ: bgListener - leaving');
    },
    Messaging_addListener = function(filters, listener) {
        // Need local copy since we can't ensure that Messaging or _ exist in this context
        console.log('USP-INJ: Messaging_addListener()');
        var realListener = function(request, sender, sendResponse) {
            var matches = true;
            for (var p in filters){
                if (Object.prototype.hasOwnProperty.call(filters, p) && filters[p] !== request[p]){
                    matches = false;
                    break;
                }
            }
            if (matches) {
                listener(request, sender, sendResponse);
            }
        };

        chrome.extension.onRequest.addListener(realListener);

        console.log('USP-INJ: Messaging_addListener - leaving');
    },
    injectAll = function(){
        console.log('USP-INJ: injectAll()');

        var link = document.createElement('link'),
            background = document.createElement('div'),
            frame = document.createElement('iframe');

        container.setAttribute('id', 'Mindspark_defaultSearchContainer');

        link.setAttribute('href', chrome.extension.getURL('components/defaultSearch/foreground/defaultSearchModalInjector.css'));
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        container.appendChild(link);

        background.setAttribute('id', 'Mindspark_defaultSearchModalBackground');
        container.appendChild(background);

        frame.setAttribute('src', chrome.extension.getURL('components/defaultSearch/foreground/defaultSearchModal.html'));
        frame.setAttribute('id', "Mindspark_defaultSearchModal");
        container.appendChild(frame);

        document.body.appendChild(container);

        console.log('USP-INJ: injectAll - leaving');
    },
    removeAll = function(){
        console.log('USP-INJ: removeAll()');
        if (container){
            document.body.removeChild(container);
        }
        console.log('USP-INJ: removeAll - leaving');
    },
    execute = function(){
        console.log('USP-INJ: execute()');
        injectAll();
        addListener();
        console.log('USP-INJ: execute - leaving');
    };

execute();

