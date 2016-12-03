chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.name == 'radioWidgetInterface') {
        var id = createId();
        if (request.cmd == 'clearPlaylist') {
            addScript(id, 'radio.clearPlaylist("' + id + '");');
        } else if (request.cmd == 'play') {
            addScript(id, 'radio.play("' + id + '");');
        } else if (request.cmd == 'stop') {
            addScript(id, 'radio.stop("' + id + '");');
        } else if (request.cmd == 'addToPlaylist') {
            addScript(id, 'radio.addToPlaylist("' + id + '", "' + request.url + '");');
        } else if (request.cmd == 'setVolume') {
            addScript(id, 'radio.setVolume("' + id + '", ' + request.volume + ');');
        }
    }
});

function createId() {
    return 's_' + new Date().getTime();
}

function addScript(id, script) {
    var scriptNode = document.createElement('script');
    scriptNode.type = 'text/javascript';
    scriptNode.id = id;
    scriptNode.textContent = script;
    document.getElementById('headElement').appendChild(scriptNode);
}

document.body.addEventListener('click', function() {
    chrome.extension.sendRequest({name:'radioWidget', cmd: 'error'},
            function(response) {
            });
});

document.body.addEventListener('mouseUp', function() {
    chrome.extension.sendRequest({name:'radioWidget', cmd: 'playing'},
            function(response) {
            });
});