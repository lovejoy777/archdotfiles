if (!window.Mindspark_) {
    window.Mindspark_ = {};
}

if (!Mindspark_.shared) {
    Mindspark_.shared = {};
}

Mindspark_.shared.unifiedLogging = (function() {
    'use strict';

    var unifiedLogging = function(params) {
        var _ = Mindspark_.underscore,
            excludeButtonTypes = params.excludeButtonTypes,
            localStorageMechanism = params.localStorageMechanism,
            toolbarData = params.toolbarData,
            toolbarConfig = params.toolbarConfig,
            eventUrl = params.eventUrl,
            buttonStructureInfo,
            buttonStructureChanged = true,
            buttonStructure,
            stringifiedButtonStructure,
            BUTTON_STRUCTURE_KEY = 'BUTTON_STRUCTURE',
            existingStringifiedButtonStructure = localStorageMechanism.get(BUTTON_STRUCTURE_KEY),
            buttonStructureMap,
            utils = Mindspark_.shared.utils,
            commonData = {},
            unifiedLoggingPropertyName,
            dataMap = {
                applicationName: 'anxa',
                toolbarId: 'anxt',
                toolbarVersion: 'anxtv',
                partnerId: 'anxp',
                partnerSubId: 'anxsi',
                toolbarBuildDate: 'anxd'
            };

        var CAP_TOOLBAR_BUTTONS = 'CAPToolbarButtons',
            CAP_NATIVE = 'CAPNative';

        var applications = {};
        applications[CAP_TOOLBAR_BUTTONS] = {
            'data': [
                'anxt',
                'anxtv',
                'anxp',
                'anxsi'
            ],
            'events': {
                BUTTON_STRUCTURE: 'ButtonStructure',
                BUTTON_CLICKED: 'ButtonClick'
            }
        };
        applications[CAP_NATIVE] = {
            data: [
                'anxt',
                'anxtv',
                'anxp',
                'anxsi',
                'anxd'
            ],
            events: {
                FF_UNINSTALL_DIALOG: 'FFUninstallDialog',
                QUERY_ASSIST: 'QueryAssist',
                DNS_SEARCH: 'DNSSearch',
                ERROR: 'GenericError',
                WARN: 'GenericWarn',
                INFO: 'GenericInfo'
            }
        };

        // Build the Unified Logging common data points
        _.each(toolbarData, function(value, propertyName, list) {
            unifiedLoggingPropertyName = dataMap[propertyName];
            commonData[unifiedLoggingPropertyName] = value;
        });

        // Example: http://imgfarm.com/images/toolbar/native/wiki/ButtonStructureFinal.json
        var getButtonStructureInfo = function(items) {
            var buttonStructure = [],
                buttonStructureMap = {};

            // Map<longPropertyName, shortPropertyName>
            var propertyMap = {
                'buttonId': 'b',
                'conceptualName': 'c',
                'version': 'v',
                'origin': 'o'
            };

            var createButton = function(item) {
                var button = {},
                    buttonPropertyValue;

                _.each(propertyMap, function(shortPropertyName, longPropertyName, list) {
                    buttonPropertyValue = item[longPropertyName];

                    if (buttonPropertyValue) {
                        button[shortPropertyName] = buttonPropertyValue;
                    }
                });

                return button;
            };

            var parse = function(items, parentButton) {
                var button,
                    position,
                    _index,
                    leftIndex = 0,
                    rightIndex = 0;

                _.each(items, function(item, index, list) {
                    // Exclude buttons that have no buttonId as well as
                    // buttons marked directly for exclusion
                    if (!item.buttonId || _.indexOf(excludeButtonTypes, item.type) > -1) {
                        return;
                    }

                    button = createButton(item);

                    _index = item.rightSide ? rightIndex++ : leftIndex++;

                    if (!parentButton) {
                        position = item.rightSide ? "R" : "L";
                    } else {
                        position = parentButton.p;
                    }

                    // Position
                    button.p = position + "." + _index;

                    buttonStructure.push(button);
                    buttonStructureMap[button.b] = button;

                    // Does this item have children?
                    if (item.items) {
                        parse(item.items, button);
                    }
                });
            };

            parse(items);

            return {
                'buttonStructure': buttonStructure,
                'buttonStructureMap': buttonStructureMap
            };
        };

        buttonStructureInfo = getButtonStructureInfo(toolbarConfig.widgets);
        buttonStructure = buttonStructureInfo.buttonStructure;
        stringifiedButtonStructure = JSON.stringify(buttonStructure);
        buttonStructureMap = buttonStructureInfo.buttonStructureMap;

        // If there is an existing Button Structure, did it change?
        if (existingStringifiedButtonStructure) {
            try {
                buttonStructureChanged = existingStringifiedButtonStructure !== stringifiedButtonStructure;
            } catch (e) {
                Mindspark_.error('Error parsing existing Button Structure', e);
            }
        }

        if (buttonStructureChanged) {
            localStorageMechanism.set(BUTTON_STRUCTURE_KEY, stringifiedButtonStructure);
        }

        return {
            init: function(){
                // adding this entry point to detect attempts to initialize multiple times!
                console.error('uL: already initialized');
            },

            logEvent: function(applicationName, eventType, appSpecificParams, postBody) {
                var eventData = {
                        'anxa': applicationName,
                        'anxe': eventType,
                        'anxr': utils.randomInt()
                    },
                    requestUrl,
                    applicationInfo = applications[applicationName],
                    requiredData = applicationInfo ? applicationInfo.data : undefined; // Data we need

                if (requiredData){
                    _.each(requiredData, function(propertyName, index, list) {
                        // Lookup and store the data we need
                        eventData[propertyName] = commonData[propertyName];
                    });
                }

                _.extend(eventData, appSpecificParams);

                requestUrl = eventUrl + "?" + utils.makeQueryString(eventData);

                if (postBody) {
                    utils.postExternalData(requestUrl, postBody);
                } else {
                    utils.getExternalData(requestUrl);
                }
            },

            CAP_NATIVE_EVENTS: applications[CAP_NATIVE].events,

            logCapNativeEvent: function(eventType, appSpecificParams){
                this.logEvent(CAP_NATIVE, eventType, appSpecificParams);
            },

            logButtonStructureEvent: function() {
                var applicationName = CAP_TOOLBAR_BUTTONS;

                // Do not log the event if the Button Structure was unchanged
                if (buttonStructureChanged) {
                    this.logEvent(
                        applicationName,
                        applications[applicationName].events.BUTTON_STRUCTURE,
                        {},
                        'buttons=' + encodeURIComponent(stringifiedButtonStructure)
                    );
                }

                return buttonStructureChanged;
            },

            logButtonClickedEvent: function(params) {
                var applicationName = CAP_TOOLBAR_BUTTONS,
                    buttonId = params.buttonId,
                    overflow = !!params.overflow;

                // Lookup the button
                var button = buttonStructureMap[buttonId];

                // If the button does not exist, it is a Special Button
                if (!button) {
                    button = {
                        b: buttonId
                    };
                }

                // Extend with the overflow property
                button.overflow = overflow;

                this.logEvent(
                    applicationName,
                    applications[applicationName].events.BUTTON_CLICKED,
                    button
                );
            }
        };
    };

    return {
        init: function(params) {
            Mindspark_.shared.unifiedLogging = unifiedLogging(params);
        }
    };
}());
