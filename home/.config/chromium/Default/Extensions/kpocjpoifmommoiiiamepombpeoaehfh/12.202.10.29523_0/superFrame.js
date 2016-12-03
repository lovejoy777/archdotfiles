var SuperFrame = {
    key: 'mindspark_' + chrome.i18n.getMessage("@@extension_id"),
    initialize: function() {
        var self = this;
        var name = window.name;
        if (name.indexOf(this.key + '_') == 0) {
            //It was opened by the extension - call to the background to see if it should enable navRedirector
            var id = name.substr(this.key.length + 1);
            chrome.extension.sendRequest({name: id, cmd: 'extraControls'}, function(response){
                if (response.navRedirect) {
                    NavRedirector.redirectNavigation();
                }
            });
        }
    }
};

//Only in the case of iframes
if (window != window.top) {
    SuperFrame.initialize();
}
