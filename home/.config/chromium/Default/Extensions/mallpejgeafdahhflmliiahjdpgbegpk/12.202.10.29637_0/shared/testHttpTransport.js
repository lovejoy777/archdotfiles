/**
 * Created by steven.harris on 5/19/2015.
 */

var Mindspark_testHttpTransport = (function(){
    function send(method, url, postData, callback, timeoutMS){
        console.log('THT: %s %s', method, url);
        console.log('THT: postData: %s, callback: %s, timeoutMS: %s', postData, callback, timeoutMS);
        if (callback){
            callback({status: 200, responseText: 'N/A'});
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
        that = {
            send: send,
            get: get,
            post: post
        };

    if (window.Mindspark_Global){
        Mindspark_Global.getValues('console', function(consoleIn){
            consoleIn.log('THT: new console');
            console = consoleIn;
        });
    }
    return that;
})();

if (window.Mindspark_Global){
    Mindspark_Global.setValue('httpTransport', Mindspark_testHttpTransport);
}