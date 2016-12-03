var bg = chrome.extension.getBackgroundPage();

function init() {
	var tabTakeOverCheckbox = document.getElementById('tabTakeOverCheckBox');
	var setting = bg.Global.retrieve('disableTabTakeover');
	if (setting && setting == 'true') {
		tabTakeOverCheckbox.checked = true;
	}
}

function save() {
	var tabTakeOverCheckbox = document.getElementById('tabTakeOverCheckBox');
	bg.Global.store('disableTabTakeover', tabTakeOverCheckbox.checked);
}

function saveAndClose() {
	save();
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.remove(tab.id);
	});
}

document.getElementById("saveAndClose").addEventListener("click", saveAndClose, false);

init();