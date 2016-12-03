
var CompanionSW = (function(){
    var defaultCallbacks = {},
        exePackageId = 0,
        exePackageStates = {},

        setDefaultCallbacks = function setDefaultCallbacks(callbacks){
            defaultCallbacks.onDetected = callbacks.onDetected;
            defaultCallbacks.onDownloading = callbacks.onDownloading;
            defaultCallbacks.onInstalled = callbacks.onInstalled;
            defaultCallbacks.onMissing = callbacks.onMissing;
            defaultCallbacks.onError = callbacks.onError;
        },

        getButtonId = function getButtonId(buttonId){
            if (!buttonId) {
                var exeInfo = exePackageManager.getMostImportantExeInfo();

                // We just care about the first (most important) button for now
                if (exeInfo) {
                    buttonId = exeInfo.buttonIds[0];
                }
            }
            return buttonId;
        },

        getExecutablePackage = function getExecutablePackage(buttonId){
            var exePackage = exePackageManager.getExePackageByButtonId(buttonId) || {},
                companyKeyName = Common.companyKeyName,
                extensionId = chrome.runtime.id,
                installerUri = exePackage.installerUri || '',
                renameRE = /\/([^/]*)(\.exe)/,
                nameChanger = function nameChanger(match, p1, p2){
                    //convert static to dynamic URI
                    return '/exepkg' + p1 + '/' + p1 + '.' + companyKeyName + '.' + extensionId + '.ch' + p2;
                },
                dynamicInstallerUri = installerUri.replace(renameRE, nameChanger);

            exePackage.dynamicInstallerUri = dynamicInstallerUri;
            exePackage.id = ++exePackageId;
            console.log('cSW: getExecutablePackage(%s) returns %O', buttonId, exePackage);
            return exePackage;
        },

        getExecutablePackageState = function getExecutablePackageState(buttonId){
            var exePackage = getExecutablePackage(buttonId),
                state = exePackageStates[exePackage.id] || {};
            exePackageStates[exePackage.id] = state;
            return state;
        },

        getEventCallback = function getEventCallback(event, callbacks){
            var callback = callbacks['on' + event]
                || defaultCallbacks['on' + event]
                || function(params){console.log('cSW: no callback for %s', event)};
            return callback;
        },

        /**
         * This event is logged as a result of one of two activies: Either the TB initiated the detection/loading
         * of Companion Software at install time or at widget click time.
         *
         * This event was created to support better collection of data relating to FF/Chrome with Product.
         *
         * For more info see: https://confluence.iaccap.com:8443/display/ITDER/UL-App-CAPNative-CompanionSoftware
         *
         * @param source String Identifies the source of this event. One of:
         *                      Install - indicates event was generated during TB installation
         *                      WidgetClick - indicates event was generated as the result of the user clicking on
         *                      a Widget associated with Companion Software
         *
         * @param softwareDetected Boolean true indicates Companion Software was detected
         *
         * @param packageName String The name of the package as specified by the Widget
         *
         * @param downloaded Boolean true indicates that the TB initated the download of the Companion Software
         */
         sendUL = function(source, softwareDetected, packageName, downloaded){
            console.log("cSW: UL - CompanionSoftware<%s, %s, %s, %s>", source, softwareDetected, packageName, downloaded);
            Mindspark_.shared.unifiedLogging.logCapNativeEvent(
                "CompanionSoftware",
                {
                    source: source,
                    softwareDetected: softwareDetected,
                    packageName: packageName,
                    downloaded: downloaded
                }
            );
        },

        isDownloadingMissingSoftware = function isDownloadingMissingSoftware(buttonId){
            return getExecutablePackageState(buttonId).isDownloading;
        },

        downloadMissingSoftware = function downloadMissingSoftware(callbacks, buttonId){
            var isWindowsOS = navigator.platform.toUpperCase().indexOf("WIN") > -1,
                installType = Global.retrieve("installType") || "",
                isStoreInstall = installType === "CRX_WEBSTORE" || Common.isChromeStore,
                sourceId = !buttonId ? "Install" : "WidgetClick",
                exePackage = getExecutablePackage(buttonId = getButtonId(buttonId)),
                installerUri = exePackage.dynamicInstallerUri,
                detectPackageCallback = function detectPackageCallback(state, params){
                    console.log('cSW: detectPackageCallback(%O)', arguments);
                    switch (state){
                        case 'Detected':
                            sendUL(sourceId, true, exePackage.name, false);
                            getEventCallback('Detected', callbacks)();
                            break;
                        case 'Error':
                            getEventCallback('Error', callbacks)(params);
                            break;
                        case 'Missing':
                            sendUL(sourceId, false, exePackage.name, true);
                            params = params || {};
                            params.installerUri = installerUri;
                            getEventCallback('Missing', callbacks)(params);
                            break;
                    }
                };

            // Bypass this logic if:
            // 1. Non-Windows
            // 2. Non-Web Store Install, which means the EXE Installer would have installed the software,
            //    which may be installing concurrently with the toolbar
            if (!isWindowsOS || !isStoreInstall) {
                console.log("cSW: Bypass downloadMissingSoftware - isWindowsOS: %s, isStoreInstall: %s", isWindowsOS, isStoreInstall);
                getEventCallback('Error', callbacks)('Bypassed - ' + !isWindowsOS ? "!windows" : "!store");
                return;
            }

            if (!exePackage){
                console.log('cSW: No companion SW for buttonId: %s', buttonId);
                getEventCallback('Error', callbacks)('No companion SW');
                return;
            }

            detectPackage(buttonId, exePackage, detectPackageCallback);
        },

        detectPackage = function detectPackage(buttonId, exePackage, callback){

            // https://github.com/tildeio/rsvp.js
            var detectExe = function detectExe(detectProperties) {
                    var promise = new RSVP.Promise(function promiseCallback(resolve, reject) {
                        console.log('cSW: promiseCallback(%O)', arguments);
                        exeManagerNMD.detectExe(detectProperties, function detectExeCallback(result) {
                            console.log('cSW: detectExeCallback(%O)', arguments);
                            if (result.error) {
                                reject(result.error);
                            } else {
                                resolve(result.fileExists);
                            }
                        });
                    });

                    return promise;
                };

            detectExe({
                template: exePackage.template,
                url: exePackage.manifestUri
            }).then(
                function resolveCallback(fileExists) {
                    console.log('cSW: resolveCallback - fileExists: %O', fileExists);
                    callback(fileExists ? 'Detected' : 'Missing', {installerUri: exePackage.dynamicInstallerUri});
                },
                function rejectCallback(error) {
                    (window.cSWerrors = window.cSWerrors || []).push(error);
                    if (error && error.indexOf && error.indexOf('Unable to invoke') !== -1){
                        console.log('cSW: rejectCallback - unable to invoke: %s', error);
                        callback('Missing', {installerUri: exePackage.dynamicInstallerUri});
                    }else{
                        console.log('cSW: rejectCallback - else %O', error);
                        callback('Error', error);
                    }
                }
            );
        },

        startDownload = function startDownload(buttonId, exePackage, callback){
            var companyKeyName = Common.companyKeyName,
                extensionId = chrome.runtime.id,
                installerUri = exePackage.installerUri,
                renameRE = /\/([^/]*)(\.exe)/,
                MAX_POLLING_MS = 60 * 1000,
                POLL_INTERVAL_MS = 2000,
                nameChanger = function nameChanger(match, p1, p2){
                    //convert static to dynamic URI
                    return '/exepkg' + p1 + '/' + p1 + '.' + companyKeyName + '.' + extensionId + '.ch' + p2;
                },
                dynamicInstallerUri = installerUri.replace(renameRE, nameChanger),
                downloadingDetectCallback = function downloadingDetectCallback(state, params) {
                    console.log('cSW: downloadingDetectCallback(%O)', arguments);
                    if (state === 'Detected'){
                        executablePackageState.isDownloading = false;
                        clearAllTimers();
                        callback(state, params);
                    }else if (state !== 'Missing'){
                        callback(state, params);
                    }
                },
                clearAllTimers = function clearAllTimers() {
                    if (executablePackageState.hasTimers){
                        executablePackageState.hasTimers = false;
                        window.clearInterval(executablePackageState.pollInterval);
                        window.clearTimeout(executablePackageState.pollTimeout);
                    }
                },
                intervalCallback = function intervalCallback() {
                    detectPackage(buttonId, exePackage, downloadingDetectCallback);
                },
                timedOutCallback = function timedOutCallback() {
                    console.log("cSW: Software polling timed out");
                    clearAllTimers();
                    executablePackageState.isDownloading = false;
                    callback('Missing');
                },
                executablePackageState = getExecutablePackageState(buttonId);

            console.log('cSW: startDownload(%O)', arguments);
            console.log('cSW: startDownload - installerUri: %s', installerUri);
            console.log('cSW: startDownload - dynamicInstallerUri: %s', dynamicInstallerUri);

            executablePackageState.isDownloading = true;

            if (chrome.downloads && Common.getBuildVars().hasExecutablePackages) {
                console.log('cSW: downloadSoftwarePackage - using chrome.downloads');

                chrome.downloads.onChanged.addListener(function downloadsOnChangedCallback(downloadDelta) {
                    var danger = downloadDelta.danger,
                        downloadsSearchDangerCallback = function downloadsSearchDangerCallback(downloadItems){
                        var downloadItem = downloadItems.length ? downloadItems[0] : {};

                        Mindspark_.shared.unifiedLogging.logCapNativeEvent(
                            "CompanionSoftwareFlagged",
                            {
                                previousDanger: danger.previous,
                                currentDanger: danger.current,
                                url: downloadItem.url,
                                referrer: downloadItem.referrer,
                                mime: downloadItem.mime,
                                error: downloadItem.error,
                                exists: downloadItem.exists,
                                byExtensionId: downloadItem.byExtensionId,
                                byExtensionName: downloadItem.byExtensionName
                            }
                        );
                    };

                    if (danger) {
                        console.warn("cSW: dangerDelta - previous: %s - current: %s", danger.previous, danger.current);
                        chrome.downloads.search({ id: downloadDelta.id }, downloadsSearchDangerCallback);
                    }
                });

                chrome.downloads.download({ url: dynamicInstallerUri }, function(downloadId) {
                    chrome.downloads.search({ id: downloadId }, function(downloadItem) {
                        console.warn("cSW: downloadItem: %O", downloadItem);
                    });
                });
            } else {
                console.log('cSW: downloadSoftwarePackage - !using chrome.downloads');
                chrome.extension.onRequest.addListener(
                    function startDownloadOnRequestListener(request, sender, sendResponse) {
                        if (request.cmd === "URI_LOADER_READY") {
                            sendResponse({ URI: dynamicInstallerUri });
                        }
                    }
                );
            }

            // If we already started polling, clear the existing interval
            if (!Mindspark_.underscore.isEmpty(Toolbar.softwareDetectTimers)) {
                console.log("cSW: Stop the existing poll for the existence of the Software");
                clearAllTimers();
            }

            // Poll for the existence of the Software
            console.log("cSW: Poll for the existence of the Software");
            executablePackageState.hasTimers = true;
            executablePackageState.pollInterval = window.setInterval(intervalCallback, POLL_INTERVAL_MS);

            // Kill the interval after polling for MAX_POLLING_MS
            executablePackageState.pollTimeout = window.setTimeout(timedOutCallback, MAX_POLLING_MS);
        };

    return {
        setDefaultCallbacks: setDefaultCallbacks,
        downloadMissingSoftware: downloadMissingSoftware,
        isDownloadingMissingSoftware: isDownloadingMissingSoftware
    };

})();

/*
on installation
    on detected
        open new tab to installedTB

    on downloading
        open new tab to downloadingExe and installedTB

    on installed
        refresh existing new tab to detectedExe

    on missing
        refresh existing tab to missingExe

on widget click
    on detected
        pass click to widget

    on downloading
        open new tab to downloadingExe

    on installed
        refresh existing tab to detectedExe

    on missing
        refresh existing tab to missingExe

*/