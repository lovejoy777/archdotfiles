(function(window) {
	var document = window.document,
		location = window.location,
		CONTENT_SCRIPT_ADDRESS = "CONTENT_SCRIPT";

	var enableDetect = {
		toolbarId: 207743773,
		detectDomains: [".fromdoctopdf.com",".iwon.com",".mindspark.com",".myway.com",".zwinky.com",".excite.com"],

		initialize: function() {
			var self = this,
				currentDomain = location.hostname;

			if (!self.isDetectEnabledDomain(currentDomain)) {
				return;
			}

			self.handleMessaging();
		},

		messaging: {
			send: function(envelope) {
				envelope.from = CONTENT_SCRIPT_ADDRESS;
				envelope.toolbarId = enableDetect.toolbarId;

				window.postMessage(
					JSON.stringify(envelope),
					location.href
				);
			},

			receive: function(callback) {
				var parent = enableDetect;

				window.addEventListener('message', function(event) {
					if (!parent.isDetectEnabledDomain(event.origin)) {
						return;
					}

					callback(event);
				});
			}
		},

		handleMessaging: function() {
			var self = this;

			self.messaging.receive(function(event) {
				var data = event.data;

				if (data) {
					var envelope = JSON.parse(data);

					if (envelope.from === CONTENT_SCRIPT_ADDRESS ||
						(envelope.toolbarId && envelope.toolbarId !== self.toolbarId))
					{
						return;
					}

					var extensionRequest = {
						"GET_FEATURES": function() {
							chrome.extension.sendRequest(
								{
									name: 'EXTENSION_REQUEST',
									action: 'GET_FEATURES'
								},
								function (response) {
									self.messaging.send({
										"status": "GET_FEATURES",
										"message": response.featureValueMap
									});
								}
							);
						},

						"SET_FEATURES": function() {
							chrome.extension.sendRequest(
								{
									name: 'EXTENSION_REQUEST',
									action: 'SET_FEATURES',
									message: {
										features: envelope.features
									}
								},
								function (response) {
									self.messaging.send({
										"status": "SET_FEATURES",
										"message": response.featureValueMap
									});
								}
							);
						},

						"GET_INFO": function() {
							chrome.extension.sendRequest(
								{
									name: 'EXTENSION_REQUEST',
									action: 'GET_INFO'
								},
								function (response) {
									var toolbarInfo = response.toolbarInfo;

									self.messaging.send({
										"status": "GET_INFO",
										"message": toolbarInfo
									});
								}
							);
						}
					};

					var extensionRequestHandler = extensionRequest[envelope.status];

					if (typeof extensionRequestHandler === "function") {
						extensionRequestHandler();
					}
				}
			});

			self.messaging.send({ "status": "TOOLBAR_READY" });
		},

		isDetectEnabledDomain: function(domain) {
			if (domain.charAt(0) !== '.') {
				domain = '.' + domain;
			}
			for (var i = 0; i < this.detectDomains.length; i++) {
				var detectDomain = this.detectDomains[i];
				if (domain.length >= detectDomain.length &&
						(domain.substring(domain.length - detectDomain.length) === detectDomain)) {
					return true;
				}
			}
			return false;
		}
	};

	enableDetect.initialize();
}(window));