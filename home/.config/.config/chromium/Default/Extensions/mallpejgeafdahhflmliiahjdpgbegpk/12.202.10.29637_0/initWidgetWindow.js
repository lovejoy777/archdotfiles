Messaging.addListener(
	{ type: 'INIT_WIDGET_WINDOW' },
	function(message, sender, sendResponse) {
		initAdapter({
			widgetWindow: this,
			logFunction: function(s) {
				console.log(s);
			},
			widgetId: message.widgetId,
			isTrusted: message.trusted
		});

		var deltaX = message.width - window.innerWidth,
			deltaY = message.height - window.innerHeight;

		if (deltaX !== 0 || deltaY !== 0) {
			window.resizeBy(
				deltaX,
				deltaY
			);
		}
	}
);

Messaging.addListener(
	{ type: 'SET_WINDOW_SIZE' },
	function(message, sender, sendResponse) {
		var newSize = message.newSize,
			deltaX = window.outerWidth - window.innerWidth,
			deltaY = window.outerHeight - window.innerHeight;

		window.resizeTo(newSize.width + deltaX, newSize.height + deltaY);
	}
);
