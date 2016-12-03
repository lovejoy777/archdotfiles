window.widgetContentScriptFunction = function(msg){
    //msg = JSON.parse(msg);
    console.log('wCSI: received %O', msg);
    if(!window[msg.namespace]){
        window[msg.namespace] = {
            sendWidgetContentMessage : function(body){
                var sendMessage = {
                    widgetId: msg.widgetId,
                    namespace: msg.namespace,
                    body: body,
                    type: 'WIDGET_CONTENT_MESSAGE'
                };
                sendMessage.body.widgetId = msg.widgetId;

                //Messaging.send(sendMessage);
                console.log('wCSI: about to window.postMessage(%O, "*")', sendMessage);
                window.postMessage(sendMessage,'*');
            }
        };
        console.log('wCSI: window.widgetContentScriptFunction executed, namespace: %s', msg.namespace);
    }else{
        console.log('wCSI: window.widgetContentScriptFunction already executed, namespace: %s', msg.namespace);
    }
};
console.warn("wCSI: window.widgetContentScriptFunction defined");