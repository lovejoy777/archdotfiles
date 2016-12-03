chrome.extension.sendRequest(
	{
		cmd: 'URI_LOADER_READY'
	},
	function(response) {
		var newFrame = document.createElement('iframe');
		newFrame.setAttribute('src', response.URI);
		newFrame.style.display = 'none';
		document.body.appendChild(newFrame);
	}
);
