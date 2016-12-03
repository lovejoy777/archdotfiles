var Mindspark_nativeMessagingDispatcher = (function() {
	"use strict";

	// NB! Undocumented requirement from Chrome: the NM Host Name must be lower case
	var NATIVE_MESSAGING_HOST_NAME = "com.mindspark." + Common.companyKeyName.toLowerCase(),
		GET_VERSION_METHOD_NAME = "getVersion",
		LAUNCH_EXE_METHOD_NAME = "sendLaunchExe",
		DETECT_EXE_METHOD_NAME = "sendDetectExe",
		messageRequestID = 0;

	var sendNativeMessage = function(message, callback) {
		message.RequestID = messageRequestID += 1;
		// TODO: Remove ProviderID requirement
		message.ProviderID = "1";

		console.log("NMD: sendNativeMessage: %O", message);

		chrome.runtime.sendNativeMessage(
			NATIVE_MESSAGING_HOST_NAME,
			message,
			function(response) {
                console.log("NMD: sendNativeMessage response: %O", response);
				callback(response);
			}
		);
	};

    var getVersion = function(params, callback) {
		var message = {
			"Service": GET_VERSION_METHOD_NAME
		};

		sendNativeMessage(message, function(response) {
			var result = {};

			if (!response) {
				result.failureInfo = "Unable to invoke " + GET_VERSION_METHOD_NAME;
                result.error="NMD Error: "+ result.failureInfo;
			}
			else if (response.ErrorCode) {
                result.failureInfo = response.ErrorCode;
                result.error="NMD Error: "+ response.failureInfo;
			}
			else {
				result.version = response.Outputs.version;
			}

            console.log("NMD: getVersion result: %O", result);
			callback(result);
		});
	};

	var sendLaunchExe = function(params, callback) {
		var message = {
			"Service": LAUNCH_EXE_METHOD_NAME,
			"Inputs": {
				"url": params.url,
				"template": params.template,
				"commandLine": params.commandLine || ""
			}
		};

		sendNativeMessage(message, function(response) {
			var result = {};

			if (!response) {
				result.failureInfo = "Unable to invoke " + LAUNCH_EXE_METHOD_NAME;
                result.error="NMD Error: "+ result.failureInfo;
			}
			else if (response.ErrorCode) {
                result.failureInfo = response.ErrorCode;
                result.error="NMD Error: "+ response.failureInfo;
			}
			else {
				// The high-level API does not expose any properties in the success state
			}

            console.log("NMD: sendLaunchExe result: %O", result);
			callback(result);
		});
	};

	var sendDetectExe = function(params, callback) {
        console.log('NMD: sendDetectExe(%O)', arguments);
		var message = {
			"Service": DETECT_EXE_METHOD_NAME,
			"Inputs": {
				"url": params.url,
				"template": params.template
			}
		};

		sendNativeMessage(message, function(response) {
            console.log("NMD: sendDetectExe response: %O", response);
			var result = {};

			if (!response) {
                result.failureInfo = "Unable to invoke " + DETECT_EXE_METHOD_NAME;
                result.error="NMD Error: "+ result.failureInfo;
			}
			else if (response.ErrorCode) {
				result.failureInfo = response.ErrorCode;
                result.error="NMD Error: "+ result.failureInfo;
			}
			else {
				result.fileExists = (response.Outputs.fileExists === true || response.Outputs.fileExists === "true");
			}

            console.log("NMD: sendDetectExe result: %O", result);
			callback(result);
		});
	};

	return {
		getVersion: getVersion,

		sendLaunchExe: sendLaunchExe,

		sendDetectExe: sendDetectExe
	};
}());