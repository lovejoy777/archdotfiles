var embedHtmlWidget = {
    name: window.location.search.substr(1),
    initialize: function() {
        var self = this;
        Widget.Content.extension.sendRequest({name: self.name, cmd: 'getData'}, function(response) {
            //This is necessary so that the code runs after this function is called.
            setTimeout(function() {
				var iframe = document.createElement("iframe"),
					src = "http://ak.imgfarm.com/images/toolbar/native/chrome/innerEmbedHtmlTemplate.html";
				iframe.setAttribute("src", src);
				iframe.setAttribute("width", window.innerWidth);
				iframe.setAttribute("height", window.innerHeight);
				iframe.addEventListener('load', function(event) {
					iframe.contentWindow.postMessage({ html: response.html, mindspark: true }, src);
				});
				document.body.appendChild(iframe);

                if (response.navRedirect) {
                    NavRedirector.redirectNavigation();
                }
            }, 0);
        });
    }
};
window.addEventListener('load', function() { embedHtmlWidget.initialize()}, false);