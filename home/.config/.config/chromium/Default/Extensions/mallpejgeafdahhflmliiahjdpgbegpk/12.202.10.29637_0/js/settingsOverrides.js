/**
 * Created by steven.harris on 4/10/14.
 */

(function(){
    var REDIRECT_PARAM_NAME = 'redirect',
        redirectId = Common.coBrandID,
        urlToPattern = function(urlStr){
            var url = Mindspark_HttpURL(urlStr);
            url.setQueryString('');
            // need the asterisk since the pattern will attempt to match against the query string too!
            return url.toString() + '*';
        },
        hasReplaceableTokens = function(urlStr){
            return /\$\{\??\w+\}|<!--\s*\w+\s*-->/g.test(urlStr);
        },
        addListener = function(name){
            var visibleUrlStr = Common.cso[name],
                internalUrlStr = Common.cso[name + 'Internal'],
                redirectUrlStr = internalUrlStr || visibleUrlStr;

            if (internalUrlStr || hasReplaceableTokens(redirectUrlStr)){
                var urlPattern = urlToPattern(visibleUrlStr),
                    visiblePath = Mindspark_HttpURL(visibleUrlStr).getPath(),
                    redirectUrl = Mindspark_HttpURL(paramReplacer.replaceParams(redirectUrlStr)),
                    redirectDomain = redirectUrl.getDomain(),
                    redirectPath = redirectUrl.getPath(),
                    redirectParams = Mindspark_HttpQueryString(redirectUrl.getQueryString()),
                    redirectParamNames = redirectParams.getParamNames(),
                    listener = function(details){
                        try{
                            var urlStrIn = details.url,
                                startTime = new Date().getTime();
                            if (urlStrIn) {
                                console.log('sO: listener(%O)', details);
                                var urlIn = Mindspark_HttpURL(urlStrIn);

                                // since the asterisk is used in the urlPattern, ensure that the paths match
                                // and, ensure that this url is a candidate for redirection
                                if (urlIn.getPath() == visiblePath && urlIn.getParam(REDIRECT_PARAM_NAME) == redirectId){
                                    var urlOut = Mindspark_HttpURL(urlStrIn);

                                    urlOut.setDomain(redirectDomain);
                                    urlOut.setPath(redirectPath);
                                    for (var i = 0, len = redirectParamNames.length; i < len; ++i) {
                                        var paramName = redirectParamNames[i];

                                        urlOut.setParam(paramName, redirectParams.getParam(paramName));
                                    }

                                    urlOut.removeParam(REDIRECT_PARAM_NAME);

                                    console.log('sO: IN  url: %s', urlStrIn);
                                    console.log('sO: OUT url: %s', urlOut.toString());
                                    console.log('sO: TIMING: %s ms', new Date().getTime() - startTime);
                                    return {redirectUrl: urlOut.toString()};
                                }
                            }
                        }catch (e){
                            console.error('sO: listener caught: %O', e);
                        }
                    };
                try{
                    console.log('sO: Adding listener for %s', urlPattern);
                    //noinspection JSUnresolvedVariable
                    chrome.webRequest.onBeforeRequest.addListener(listener, {urls: [urlPattern]}, ['blocking']);
                }catch(e){
                    console.error('sO: addListener caught %O', e);
                }
            }
        },
        isInternalSetting = function(settingName){
            return /^.*Internal$/.test(settingName);
        },
        addAllListeners = function(){
            //console.log('sO: addAllListeners()');
            if (Common.cso){
                for (var settingName in Common.cso){
                    if (!isInternalSetting(settingName)){
                        addListener(settingName);
                    }
                }
            }
        };


    Global.addListener('toolbar:initialized', addAllListeners);
})();
