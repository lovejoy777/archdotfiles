var scriptWidget = {
    name: window.location.search.substr(1),
    navRedirect: false,
    initialize: function() {
        var self = this;
		
		Widget.Content.extension.sendRequest({name: self.name, cmd: 'getJsUrl'}, function(response) {
			//This is necessary so that the code runs after this function is called.
			setTimeout(function() {
				var iframe = document.createElement("iframe"),
					src = "http://ak.imgfarm.com/images/toolbar/native/chrome/innerEmbedScriptTemplate.html";
				iframe.setAttribute("src", src);
				iframe.setAttribute("width", window.innerWidth);
				iframe.setAttribute("height", window.innerHeight);
				iframe.addEventListener('load', function(event) {
					iframe.contentWindow.postMessage({
						jsUrl: response.jsUrl,
						navRedirect: response.navRedirect,
						mindspark: true
					}, src);
				});
				document.body.appendChild(iframe);
			}, 0);
        });
    }
};

window.addEventListener('load', function() { scriptWidget.initialize()}, false);