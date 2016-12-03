var CompanionSWUtils = (function() {

    function getDynamicInstallerUri(installerUri) {
        var companyKeyName = Common.companyKeyName,
            extensionId = chrome.runtime.id,
            dynamicUri;
        if (typeof installerUri === 'string' && installerUri.length) {
            dynamicUri = installerUri.replace(/\/([^/]*)(\.exe)/, function(match, filename, fileExt) {
                return '/exepkg' + filename + '/' + filename + '.' + companyKeyName + '.' + extensionId + '.ch' + fileExt;
            });
        }
        return dynamicUri || '';
    }

    return {
        getDynamicInstallerUri: getDynamicInstallerUri
    }

})();