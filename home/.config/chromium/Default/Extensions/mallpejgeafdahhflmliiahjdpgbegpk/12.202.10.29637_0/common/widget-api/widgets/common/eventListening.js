function addEvtListener(element, type, fn) {
	if (element.addEventListener) {
		element.addEventListener(type, fn, false);
	} else if (element.attachEvent) {
		element.attachEvent('on' + type, fn);
	} else {
		throw 'Uknown browser: missing addEventListener and attachEvent.';
	}
}

function removeEvtListener(element, type, fn) {
	if (element.addEventListener) {
		element.removeEventListener(type, fn);
	} else if (element.attachEvent) {
		element.detachEvent('on' + type, fn);
	} else {
		throw 'Uknown browser: missing removeEventListener and detachEvent.';
	}
}
