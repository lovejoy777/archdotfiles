/**
 * Allows Widget Background and Foreground Window(s) to communicate with each other
 * and the Toolbar via window.postMessage.
 *
 * @param {Object} params An Object with the following properties:
 *   - {DOMWindow} widgetWindow The Widget Foreground or Background Window that will be forwarded messages.
 *   - {String} widgetId The Widget's ID.
 *   - {String} windowUrl The Widget Foreground or Background Window URL.
 *   - {Function} logFunction A function that accepts a message String and logs the message accordingly
 *   - {Number} [windowId] The Widget Foreground Window ID.
 *   - {DOMWindow} [adapterWindow] The DOM Window that will be receiving messages and forwarding them
 *                                 to the widgetWindow. Defaults to the widgetWindow, but can be different
 *                                 depending on the platform (such as in Chrome).
 *   - {Object} [messaging] The Message passing namespace. Defaults to using the Global Messaging namespace.
 *   - {Object} [windowManager] The Window Manager namespace. This is specified when initializing from the Background.
 *   - {Boolean} [isTrusted] A flag indicating whether or not the Widget Window is Trusted. Defaults to true.
 */
function initAdapter(params) {
	var widgetWindow = params.widgetWindow,
		windowUrl = params.windowUrl || widgetWindow.location.href,
		adapterWindow = params.adapterWindow || widgetWindow,
		widgetId = params.widgetId,
		windowId = params.windowId,
		registerListener,
		sendToWidget,
		log = function(s) {
			params.logFunction("adapter " + widgetId + " " + windowUrl +  ": " + s);
		},
		Messaging = params.messaging || window.Messaging,
		windowManager = params.windowManager,
		isTrusted = params.isTrusted;

    log('initializing');

	sendToWidget = function(envelope) {
		log('sending postMessage to ' + windowUrl + ': ' + JSON.stringify(envelope));
		envelope.sender = "toolbar";
		widgetWindow.postMessage(JSON.stringify(envelope), windowUrl);
	};

    registerListener = function(listener) {
        adapterWindow.addEventListener('message', function(event) {
            if (event.data && windowUrl.indexOf(event.origin) == 0) {
                var envelope = JSON.parse(event.data);
                if (envelope.status == "ADAPTER_READY") {
                    // ignore the message from ourselves
                }
                else if (envelope.status == "WIDGET_READY") {
                    log('received WIDGET_READY');
                    sendToWidget({status: "ADAPTER_READY"});
                }
                else if (envelope.sender != "toolbar") {
                    listener(envelope);
                }
            }
        }, false);
    };

	// TODO: Find a cleaner way to handle Untrusted window security
	// In the untrusted context, only IntrawidgetMessages (Intrawidget_Protocol) are allowed
	// outside of the background page. The DynamicButtonProtocol is a subclass of Intrawidget_Protocol
	// so we must explicitly block its methods.
	var isUntrustedSecurityViolation = function(envelope) {
		return !isTrusted
			&& (envelope.msg !== "IntrawidgetMessage"
				|| (envelope.payload
					&& (envelope.payload.msg === "UpdateButtonStyle"
						|| envelope.payload.msg === "UpdateButtonTicker"
						|| envelope.payload.msg === "ButtonClicked"
						|| envelope.payload.msg === "TickerClicked")));
	};

	// Listen to messages being sent from the widget (either the widget background
	// or widget window, depending on which one this adapter instance was initialized for)
	// and forward the message to other Widget Windows belonging to this widget and/or the Toolbar
    registerListener(function(envelope) {
		var callback;

		// Ensure the message is from this widget
        if (envelope.widget != widgetId) return;

        log('received postMessage: ' + JSON.stringify(envelope));

        var message = {
            type: envelope.msg,
            widgetId: envelope.widget,
            body: envelope.payload,
			windowId: windowId
        };
        log('sending chrome message to tab ' + envelope.tab + ': ' + JSON.stringify(message));

		if (isUntrustedSecurityViolation(envelope)) {
			sendToWidget({
				msg: "Reply",
				from: envelope.to,
				to: envelope.from,
				payload: {
					"error": "Adapter message security violation."
				},
				token: envelope.token
			});

			return;
		}

		// Allow the recipient to send a response (encoded as a reply message
		// with the token from the original message).
		//
		// We do not need to do this for messages that are double-encapsulated,
		// such as an IntrawidgetMessage. See 'IntrawidgetProtocol' in widget-api-1.x.js'
		//
		// TODO: rather detect double-encapsulation vs specifically checking for 'IntrawidgetMessage'
		// Moving forward we will be using double-encapsulation for other types of messages.
        if (envelope.msg !== 'IntrawidgetMessage') {
            callback = function(response) {
                log('received message response: ' + JSON.stringify(response));

				sendToWidget({
					msg: "Reply",
					from: envelope.to,
					to: envelope.from,
					payload: response,
					token: envelope.token
				});
            };
        }

        Messaging.send(
            message,
            callback,
            envelope.tab
        );
    });

	// Listen to messages being sent from the Toolbar or another Widget Background or Widget Window (either a
	// different component of the same widget, or a different widget in the case of Interwidget messages) and
	// forward them to the Widget (Optionally, request.recipient can be specified - defaults to "widget").
    Messaging.addListener({}, function(request, sender) {
//        log('TRACE received chrome message from ' + (sender.tab ? 'content script' : 'background') + ': ' + JSON.stringify(request));
        if (request.widgetId && request.type) {
			var isInterwidgetMessage = request.interwidget,
				isIntrawidgetMessage = request.widgetId == widgetId;

			// The message can either be an Interwidget or Intrawidget Message, but not neither nor both.
			// Using the bitwise Exclusive OR operator because both inputs are Booleans
			if (isInterwidgetMessage ^ isIntrawidgetMessage) {
                log('received chrome message from ' + (sender.tab ? ('tab ' + sender.tab.id) : 'background') + ': ' + JSON.stringify(request));

                var message = {
                    msg: request.type,
                    from: "toolbar",
                    to: request.recipient || "widget",
                    payload: request.body || {}
                    // todo we could add a token if needed but right now we do not have any
                    // messages from the toolbar for which the widget sends a response
                };

				if (isUntrustedSecurityViolation(message)) {
					return false;
				}

				if (sender.tab && sender.tab.id) {
					// pass on the tab that the message was sent from, so we can direct the reply to the appropriate tab
					message.payload.tab = sender.tab.id;

					// pass on the window ID that the message was sent from -
					// if windowManager is available (only from the background)
					if (!request.windowId && windowManager) {
						var fromWidgetWindow = windowManager.getWindowByTab(sender.tab);
						if (fromWidgetWindow) {
							message.payload.fromWindow = fromWidgetWindow.id;
						}
						else {
							log('No widget window associated with tab ' + sender.tab.id);
						}
					}
				}

				if (request.windowId) {
					message.payload.fromWindow = request.windowId;
				}

				sendToWidget(message);
            }
        }
    });

    sendToWidget({status: "ADAPTER_READY"});
}
