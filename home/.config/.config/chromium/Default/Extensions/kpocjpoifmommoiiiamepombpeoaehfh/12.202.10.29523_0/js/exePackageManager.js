/**
 * Created with IntelliJ IDEA.
 * User: steven.harris
 * Date: 12/11/13
 * Time: 10:48 AM
 * To change this template use File | Settings | File Templates.
 */
var exePackageManager = (function(config, _) {
    "use strict";

    var packageInfo = {
            exeInfos: {},
            exePackageButtonMap: {}
        },
        getOSBitness = function() {
            return navigator.userAgent.indexOf('WOW64') > -1 || window.navigator.platform == 'Win64' ? 64 : 32;
        },
        currentBitness = getOSBitness(),
        configurationBit = "configuration" + currentBitness + "Bit",
        executablePackages = config.executablePackages,
        getExePackageByButtonId = function(buttonId) {
            return packageInfo.exePackageButtonMap[buttonId];
        },
        getExeInfoByPackageName = function(packageName) {
            return packageInfo.exeInfos[packageName];
        },
        getAllExeInfos = function() {
            return packageInfo.exeInfos;
        },
        getMostImportantExeInfo = function() {
            var exePackage;

            if (executablePackages && executablePackages.length) {
                // When there are multiple software packages, they will be sorted
                // according to the position of the extension on the toolbar.
                // Therefore, the first package is the most important.
                exePackage = getExeInfoByPackageName(executablePackages[0].name);
            }

            return exePackage;
		},
		packageInfoIterator = function packageInfoIterator(packageInfo, packages, template, list) {
            console.log('ePM: packageInfoIterator(%O)', arguments);
			var widget = this,
                getButtonPackage = function getButtonPackage(){
                    var bp = _.findWhere(packages, { bitness: currentBitness });
                    console.log('ePM: getButtonPackage returns %O', bp);
                    return bp;
                },
                buttonPackage = getButtonPackage(),
                buttonPackageName = buttonPackage.name,
                getExeInfo = function getExeInfo(){
                    var ei = _.findWhere(executablePackages, { name: buttonPackageName });
                    console.log('ePM: getExeInfo returns %O', ei);
                    return ei;
                },
				exeInfo = getExeInfo(),
				exeInfoPackage = packageInfo.exeInfos[buttonPackageName],
				buttonMapPackage = {
					name: buttonPackageName,
					path: buttonPackage.path,
					installerUri: exeInfo[configurationBit].installerUri,
					manifestUri: widget.basepath + "manifest.json",
					template: template
				},
				executableMapPackage = {
					name: buttonPackageName,
					buttonIds: [ widget.buttonId ],
					installerUri: exeInfo[configurationBit].installerUri
				};

			if (exeInfoPackage) {
				exeInfoPackage.buttonIds.push(widget.buttonId);
			} else {
				packageInfo.exeInfos[buttonPackageName] = executableMapPackage;
			}

			packageInfo.exePackageButtonMap[widget.buttonId] = buttonMapPackage;

			return packageInfo;
		};

    // Example of Package Info Object
    /*
     packageInfo = {
        "exeInfos": {
            "SafePCRepair": {
                "name": "SafePCRepair",
                "buttonIds": [
                    10146805581,
                    10146805586
                ],
                "installerUri": "http://ak.imgfarm.com/images/nocache/vicinio/executable-packages/SafePCRepair/1365016805393/SafePCRepairSetup.exe"
            },
            "MindsparkVideoDownloadConverter": {
                "name": "MindsparkVideoDownloadConverter",
                "buttonIds": [
                    10146805582
                ],
                "installerUri": "http://ak.imgfarm.com/images/nocache/vicinio/executable-packages/MindsparkVideoDownloadConverter/1376679720945/VideoDownloadConverterSetup.exe"
            }
        },
        "exePackageButtonMap": {
            "10146805581": {
                "name": "SafePCRepair",
                "path": "${reg[HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion:ProgramFilesDir (x86)]}\\SafePCRepair\\SPR.exe",
                "installerUri": "http://ak.imgfarm.com/images/nocache/vicinio/executable-packages/SafePCRepair/1365016805393/SafePCRepairSetup.exe",
                "manifestUri": "https://ak.ssl.imgfarm.com/images/nocache/vicinio/211634648/com.mindspark.safepcrepair.launcher.logo-1.0.0-20130828180353/manifest.json",
                "template": "open"
            },
            "10146805586": {
                "name": "SafePCRepair",
                "path": "${reg[HKLM\\SOFTWARE\\Wow6432Node\\iolo\\System Mechanic:AppPath]}",
                "installerUri": "http://ak.imgfarm.com/images/nocache/vicinio/executable-packages/SafePCRepair/1365016805393/SafePCRepairSetup.exe",
                "manifestUri": "https://ak.ssl.imgfarm.com/images/nocache/vicinio/211634648/com.mindspark.safepcrepair.launcher.games-1.0.0-20130808141832/manifest.json",
                "template": "open"
            },
            "10146805582": {
                "name": "MindsparkVideoDownloadConverter",
                "path": "${reg[HKLM\\SOFTWARE\\Wow6432Node\\VideoDownloadConverter:InstDir]}VideoDownloadConverter.exe",
                "installerUri": "http://ak.imgfarm.com/images/nocache/vicinio/executable-packages/MindsparkVideoDownloadConverter/1376679720945/VideoDownloadConverterSetup.exe",
                "manifestUri": "https://ak.ssl.imgfarm.com/images/nocache/vicinio/205320000/com.mindspark.videodownloadconverter.vdc.widget-1.2.0-20131115172229/manifest.json",
                "template": "open"
            }
        }
     };
    */

    // Build Package Info Object
	// Wrap this process in a Try to be defensive against malformed configurations
	try {
		_.each(config.widgets, function(widget, index, widgets) {
			if (widget.executables) {
				packageInfo = _.reduce(
					widget.executables,
					_.bind(packageInfoIterator, widget),
					packageInfo
				);
			}
		});
	} catch (e) {
		console.log("ePM: Error building package info: %O", e);
	}

    console.log('ePM: packageInfo: %s', JSON.stringify(packageInfo));

    return {
        getAllExeInfos: getAllExeInfos,

        getMostImportantExeInfo: getMostImportantExeInfo,

        getExeInfoByPackageName: getExeInfoByPackageName,

        getExePackageByButtonId: getExePackageByButtonId
    };
})(config, Mindspark_.underscore);
