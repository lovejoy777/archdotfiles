/**
 * Created by steven.harris on 5/19/2015.
 */

var Mindspark_httpTransport = (function(){
    function send(method, url, postData, callback, timeoutMS){
        var xhr = new XMLHttpRequest(),
            timerId;
        if (callback){
            timerId = window.setTimeout(
                function httpSendTimeout(){
                    console.log('ht: timed out %s %s, calling callback', method, url);
                    timerId = undefined;
                    callback(xhr);
                },
                timeoutMS || defaultTimeoutMS
            );
            xhr.onreadystatechange = function httpGetOnReadyStateChange(){
                if (xhr.readyState === 4){
                    if (timerId) {
                        window.clearTimeout(timerId);
                        console.log('ht: successfully %s %s, calling callback', method, url);
                        callback(xhr, Math.floor(xhr.status/100) === 2 ? xhr.responseText : undefined);
                    }else{
                        console.warn('ht: successfully %s %s, but already timed out', method, url);
                    }
                }
            };
        } else {
            console.log('ht: successfully %s %s', method, url);
        }

        xhr.open(method, url, true);
        if (postData){
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send(postData);
        }else{
            xhr.send();
        }
    }
    function get(url, callback, timeoutMS){
        send('get', url, null, callback, timeoutMS);
    }
    function post(url, postData, callback, timeoutMS){
        send('post', url, postData, callback, timeoutMS);
    }
    var stub = function(){},
        console = {log: stub, error: stub, warn: stub},
        defaultTimeoutMS = 1000,
        that = {
            send: send,
            get: get,
            post: post
        };

    if (window.Mindspark_Global){
        Mindspark_Global.getValues('console', function(consoleIn){
            console = consoleIn;
        });
    }
    return that;
})();

if (window.Mindspark_Global){
    Mindspark_Global.setValue('httpTransport', Mindspark_httpTransport);
}