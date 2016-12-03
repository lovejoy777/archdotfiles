(function(window) {
	"use strict";

	// The Hidden Widget Window can leverage the Messaging namespace
	// of the Background page parent.
	if (window.parent && window.parent.Messaging) {
		window.Messaging = window.parent.Messaging;
	} else {
		throw new Error("Hidden Widget Window unable to access parent Messaging namespace");
	}
}(window));