(function(window) {
	var document = window.document;
	var initialized = false;
	var	reserveSpace = function reserveSpace() {
        console.log('rsie: reserveSpace');
		var getToolbarData = function getToolbarData() {
            console.log('rsie: getToolbarData');
			Messaging.send(
				{
					name: 'GET_TOOLBAR_DATA',
					href: document.location.href,
					domain: document.location.hostname
				},
				function getToolbarDataCallback(toolbarData, sender, sendResponse) {
                    console.log('rsie: getToolbarDataCallback(%O)', arguments);
					if (initialized || !toolbarData) {
                        console.log('rsie: getToolbarDataCallback(%O) - initialized || !toolbarData', arguments);
						return;
					}

					initialized = true;

					window.toolbarData = toolbarData;

                    console.log('rsie: window.toolbarData: %O', window.toolbarData);
                    console.log('rsie: window.Content: %O', window.Content);
					if (window.Content) {
						window.Content.initialize();
					}

					if (toolbarData.toolbarEnabled) {
                        console.log('rsie: mindspark: %O', mindspark);
						mindspark.ReserveSpaceForToolbar.reserveSpace();
					}
                    console.log('rsie: getToolbarDataCallback - done');
				}
			);
		};

		getToolbarData();

		Messaging.addListener(
			{ name: 'BACKGROUND_READY' },
			function BackgroundReadyListener() {
                console.log('rsie: BackgroundReadyListener');
				getToolbarData();
			}
		);
	};

	// Handle Chrome prerendering, also known as "Instant"
	if (!document.webkitHidden) {
		reserveSpace();
	} else {
		var handleVisibilityChange = function() {
			if (!document.webkitHidden) {
				reserveSpace();
				document.removeEventListener("webkitvisibilitychange", handleVisibilityChange, false);
			}
		};

		document.addEventListener("webkitvisibilitychange", handleVisibilityChange, false);
	}
}(window));

console.log('rsie: leaving js');