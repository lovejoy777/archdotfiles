document.addEventListener('extensionMessageEvent', function(event) {
    // send a chrome API message containing the requested message
    var messageHolder = document.getElementById('extension-message-holder');
    var messageWrapper = JSON.parse(messageHolder.innerText);
//    console.log("received message: " + messageHolder.innerText);

    chrome.extension.sendRequest(messageWrapper.message, function(response) {
        // add the response to a hidden div
        var responseHolder = document.getElementById('extension-response-holder');
        var responseWrapper = {id: messageWrapper.id, response: response};
        responseHolder.innerText = JSON.stringify(responseWrapper);

        // publish dom event
        var event = document.createEvent('Event');
        event.initEvent('extensionResponseEvent', true, true);
//        console.log("sending response via dom event: " + JSON.stringify(responseWrapper));
        responseHolder.dispatchEvent(event);
    });
});