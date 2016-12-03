var ToolbarCookieParser = {

    getToolbarInfo: function(domain, defaultPartnerId, callback) {
        var self = this;
        chrome.cookies.getAll({domain: domain}, function(cookies) {
            //Setup the defaults
            var defaultToolbarData = {
                    toolbarId: self.createToolbarId(),
                    toolbarIdSource: 'extension',
                    partnerId: null,
                    partnerSubId: null,
                    installDate: self.createInstallDate(),
                    overrideNewTab: false,
                    defaultSearch: null,
                    defaultSearchOption: false,
                    installType: null,
                    pixelUrl: null,
                    successUrl: null,
                    newTabCache: null,
                    newTabURL: null,
                    newTabBubbleURL: null,
                    newDownloadURL : null,
                    newTabInstructURL: null,
                    newTabSuccessURL: null,
                    coId: null,
                    userSegment: null,
                    uninstallSurveyUrl: null
                },
                toolbarData,
                parseCookieData = function(cookies){
                    var toolbarData = _.defaults({}, defaultToolbarData),
                        toolbarDataExists = false;
                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = cookies[i];
                        switch (cookie.name){
                        case 'installDate':
                            // The installDate cookie is guaranteed to exist if the data was set properly
                            toolbarDataExists = true;
                            toolbarData.installDate = cookie.value;
                            toolbarData.toolbarIdSource = 'dlp-cookie';
                            break;
                        case 'homePage':
                            toolbarData.overrideNewTab = cookie.value === 'true';
                            break;
                        default:
                            toolbarData[cookie.name] = cookie.value;
                            break;
                        }
                    }
                    return toolbarDataExists ? toolbarData : null;
                },
                finish = function(toolbarData, dlpCountryCode) {
                    // Partner ID from cookie will be parent partner ID
                    var pf = new PartnerIdFactory(),
                        parentId = pf.parse(toolbarData.partnerId);

                    if (!parentId.isValid()) {
                        toolbarData.partnerId = defaultPartnerId;
                    }

                    callback(toolbarData, dlpCountryCode);
                };

            toolbarData = parseCookieData(cookies);

			if (toolbarData) {
				finish(toolbarData, undefined);
			}
			else {
                self.getFromLocalStorage(Common.localStorageCommunicationUrl, defaultToolbarData, finish);
			}
        });
    },

    listening: false,

    getFromLocalStorage: function(localStorageCommunicationUrl, defaults, callback){

        // The cookies are missing so it's likely a Chrome 21+ install. So:
        // 1) EXE installer set local storage with the JSON object we need, called 'toolbarData', accessible
        //    to the SERVER identified below
        // 2) We need to run within the context of this SERVER to see them
        // 3) Load a page from this SERVER (url)
        // 4) Declared within the Manifest is that 'readLocalStorage.js' should run for every page
        // 5) So, when this page is loaded, it runs, and sends the LOCALSTORAGE_TOOLBAR_DATA cmd with the
        //    toolbarData we need.
        // That is why we add the listener below.
        //
        // NOTE: the localStorage JSON value is doubly stringified, so it needs to be doubly parsed. The first
        //       is in readLocalStorage.js and the second is below.
        var completed = false;

        var frame = document.createElement("iframe"),
            localStorageToolbarDataListener = function localStorageToolbarDataListener(request/*, sender, sendResponse*/) {
                console.log('tcp: localStorageToolbarDataListener(%O)', request);
                var rawToolbarData = request.toolbarData,
                    dlpCountryCode = request.countryCode,
                    parsedToolbarData;

                try {
                    parsedToolbarData = JSON.parse(rawToolbarData);
                    parsedToolbarData.overrideNewTab = parsedToolbarData.homePage === 'true';
                    parsedToolbarData.toolbarIdSource = 'dlp-localStorage';
                    //console.log('tcp: Success parsing toolbar data from localStorage');
                } catch (error) {
                    // If the toolbar data is missing, use the defaults
                    parsedToolbarData = defaults;
                    console.warn("tcp: Failed to parse toolbar data from localStorage, using defaults - error: " + error);
                    console.log('tcp: defaults: %O', parsedToolbarData);
                } finally {
                    callback(parsedToolbarData, dlpCountryCode);
                }
            },
            addLocalStorageListener = function(){
                // eliminate potential registration of the listener more than once
                if (!self.listening){
                    Messaging.addListener({ name: 'LOCALSTORAGE_TOOLBAR_DATA' }, localStorageToolbarDataListener);
                    self.listening = true;
                }
            },
            xhr = new XMLHttpRequest(),
            found = function(){
                if(completed)
                    return;
                completed = true;
                addLocalStorageListener();
                frame.setAttribute("src", localStorageCommunicationUrl);
                document.documentElement.appendChild(frame);
            },
            notFound = function(){
                if(completed)
                    return;
                completed = true;
                localStorageToolbarDataListener({toolbarData: null});
            },
            readyStateChange = function(evt){
                if (xhr.readyState != 4) return;
                if (xhr.status == 200){
                    console.warn("tcp: found: %s, will attempt to retrieve from localStorage", localStorageCommunicationUrl);
                    !0?1:console.dir(xhr);
                    !0?1:console.dir(evt);
                    found();
                }else{
                    console.warn("tcp: not found: %s, status: %s, will use defaults", localStorageCommunicationUrl, xhr.status);
                    !0?1:console.dir(xhr);
                    !0?1:console.dir(evt);
                    notFound();
                }
                clearRequestTimeOut();
            },
            requestTimeOutTimer,
            REQUEST_TIME_OUT_MS = 1000,
            createRequestTimeoutHandler = function(){
                requestTimeOutTimer = setTimeout(requestTimedOut, REQUEST_TIME_OUT_MS);
            },
            requestTimedOut = function(){
                xhr.abort();
                notFound();
            },
            clearRequestTimeOut = function(){
                if (requestTimeOutTimer){
                    clearTimeout(requestTimeOutTimer);
                    requestTimeOutTimer = undefined;
                }
            },
            goGetLocalStorage = function(){
                try{
                    xhr.onreadystatechange = readyStateChange;
                    xhr.open('head', localStorageCommunicationUrl, true);
                    createRequestTimeoutHandler();
                    xhr.send();
                }catch (e){
                    console.error(e);
                }
            };

        console.warn("tcp: Toolbar data cookies are missing, attempting to retrieve from %s localStorage", localStorageCommunicationUrl);
        goGetLocalStorage();
    },

    createInstallDate: function() {
        var today = new Date(),
            year = today.getFullYear(),
            month = today.getMonth() + 1,
            day = today.getDate(),
            hour = today.getHours(),
            pad = function(n){return (n < 10 ? '0' : '') + n;};

        return '' + year + pad(month) + pad(day) + pad(hour);
    },

    createToolbarId: function() {
        var s = [],
            HEX_DIGITS = "0123456789ABCDEF";
        for (var i = 0; i < 36; i++) {
            if (i == 8 || i == 13 || i == 18 || i == 23)
                s[i] = '-';
            else
                s[i] = HEX_DIGITS.charAt(Math.floor(Math.random() * 0x10));
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = HEX_DIGITS.charAt((s[19] & 0x3) | 0x8);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

        return s.join("");
    }

};