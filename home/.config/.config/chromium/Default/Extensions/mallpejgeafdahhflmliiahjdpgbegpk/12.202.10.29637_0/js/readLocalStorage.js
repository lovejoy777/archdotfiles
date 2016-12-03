var toolbarData = localStorage.getItem("toolbarData"),
	countryCode = localStorage.getItem('countryCode'),
	parsedToolbarData;

try {
	parsedToolbarData = JSON.parse(toolbarData);
} catch (e) {
	console.warn("Failed to parse toolbar data from localStorage");
} finally {
	chrome.extension.sendRequest({
		name: 'LOCALSTORAGE_TOOLBAR_DATA',
		toolbarData: parsedToolbarData,
		countryCode: countryCode
	});
}