(function(){
    var timeToStart = Date.now() + 15 * 1000;
    var timeoutId = 0;

    window.go = function startupGo(){
        stop();
        console.log('loading extension: bg.html');
        window.location='bg.html';
    };

    window.cls = function startupCls(all){
        stop();
        if (all){
            console.log('clearing ALL local storage, including dev_ items. Use cls() to clear non-dev items');
            localStorage.clear();
        }else{
            var DEV_RE = /^dev_/;
            function isNotDevKey(item){
                return !DEV_RE.test(item);
            }
            console.log('clearing non-dev local storage, excluding dev_ items. Use cls(true) to clear all items');
            Object.keys(localStorage).filter(isNotDevKey).forEach(function(key){
                localStorage.removeItem(key);
            });
        }
    };

    window.show=function(){
        stop();
        var urlString = 'chrome-extension://' + chrome.runtime.id + '/debug.html';
        if(chrome.tabs)
            chrome.tabs.create({url:urlString});
        else{
            console.log('this is broken');
        }
    };

    window.addUniversalConsole=function(){
        stop();
        var s = document.createElement('script');
        s.src='shared/universalConsole.js';
        document.body.appendChild(s);
    };
    
    var insertedContentScripts = false;

    window.dlp=function(){
        stop();
        var addScript = function addScript(sources, callback){
                //console.log('s: addScript(%O)', arguments);
                if (sources.length > 0){
                    var src = sources.shift(),
                        script = document.createElement('script');

                    script.setAttribute('type', 'text/javascript');
                    script.setAttribute('src', chrome.extension.getURL(src));
                    script.addEventListener('load', function(){addScript(sources, callback);});
                    document.head.appendChild(script);
                    //console.log('s: added script: %s', src);
                }else{
                    callback();
                }
            },
            addContentScripts = function addContentScripts(callback){
                //console.log('s: addContentScripts(%O)', arguments);
                var addContentScriptsLoadListener = function addContentScriptsLoadListener(){
                    //console.log('s: addContentScriptsLoadListener(%O)', arguments);
                    if (insertedContentScripts) {
                        callback();
                    }else{
                        insertedContentScripts = true;
                        var scripts = [
                            "common/js/common.js",
                            "common/js/dynamic.js"
                        ];
                        addScript(scripts, callback);
                    }
                };
                //document.addEventListener('load', addContentScriptsLoadListener);
                addContentScriptsLoadListener();
            },
            loadDLP = function loadDLP(){
                //console.log('s: loadDLP(%O)', arguments);
                try{
                    var frame = document.createElement('iframe');
                    frame.src = Common.localStorageCommunicationUrl;
                    document.body.appendChild(frame);
                    console.log('s: loaded iframe to DLP: %s', Common.localStorageCommunicationUrl);
                }catch (e){
                    //nop
                }
            };
        addContentScripts(loadDLP);
    };

    window.stop=function(){
        if (timeoutId){
            window.clearTimeout(timeoutId);
            timeoutId = 0;
            console.log('%cStopped countdown! %cTo start, enter go()', 'color: red', 'color: green');
        }
    };

    function countdown(){
        var timeRemaining = timeToStart - Date.now();
        if (timeRemaining <= 0){
            timeoutId = 0; // setting to 0 so that the invocation of stop() within go() will NOT attempt to clear the timeout
            window.go();
        }else{
            console.log('%cloading bg.html in %s seconds. %cTo stop, enter stop()', 'color: orange', Math.ceil(timeRemaining/1000), 'color: green');
            timeoutId = window.setTimeout(countdown, 1000);
        }
    }

    countdown();
})();