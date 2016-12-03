/**
 * Created by steven.harris on 5/7/2015.
 */

/*
 Declaration Dependencies:
 - 'unifiedLogger': see unifiedLogger.js
 - 'console': anything that implements the non-standard console API. See universalConsole.js
 - 'persister': see FFPreferencesPersister.js or LocalStoragePersister.js
 - 'underscore': the underscore object as made available via underscorejs.org

 Initialization Dependencies:
 - 'toolbar.config', 'see toolbar config'
 - 'persister': see FFPreferencesPersister.js or LocalStoragePersister.js

 Exports:
 - logButtonStructure(): ...
 - logButtonClicked(params): ...
 */

Mindspark_Global.getValues('unifiedLogging', 'console', 'persister', 'underscore', 'buttonLoggerConfig',
    function(unifiedLogging, console, persister, _, buttonLoggerConfig){
        "use strict";

        Mindspark_Global.setValue('buttonLogger', (function(){

            function logButtonStructure(){
                // Do not log the event if the Button Structure was unchanged
                if (buttonStructureChanged) {
                    unifiedLogging.logButtonStructure(
                        {},
                        'buttons=' + encodeURIComponent(stringifiedButtonStructure)
                    );
                }

                return buttonStructureChanged;
            }
            function logButtonClicked(params){
                var buttonId = params.buttonId,
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

                unifiedLogging.logButtonClicked(button);
            }
            // Example: http://imgfarm.com/images/toolbar/native/wiki/ButtonStructureFinal.json
            function getButtonStructureInfo(items) {

                function createButton(item) {
                    var button = {},
                        buttonPropertyValue;

                    _.each(propertyMap, function(shortPropertyName, longPropertyName, list) {
                        buttonPropertyValue = item[longPropertyName];

                        if (buttonPropertyValue) {
                            button[shortPropertyName] = buttonPropertyValue;
                        }
                    });

                    return button;
                }

                function parse(items, parentButton) {
                    var button,
                        position,
                        _index,
                        leftIndex = 0,
                        rightIndex = 0;

                    _.each(items, function(item, index, list) {
                        // Exclude buttons that have no buttonId as well as
                        // buttons marked directly for exclusion
                        if (!item.buttonId || _.indexOf(buttonLoggerConfig.excludeButtonTypes, item.type) > -1) {
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
                }

                var buttonStructure = [],
                    buttonStructureMap = {},
                    propertyMap = {// Map<longPropertyName, shortPropertyName>
                        'buttonId': 'b',
                        'conceptualName': 'c',
                        'version': 'v',
                        'origin': 'o'
                    };

                parse(items);

                return {
                    buttonStructure: buttonStructure,
                    buttonStructureMap: buttonStructureMap
                };
            }

            var buttonStructureInfo,
                buttonStructureChanged = true,
                buttonStructure,
                stringifiedButtonStructure,
                BUTTON_STRUCTURE_KEY = 'BUTTON_STRUCTURE',
                existingStringifiedButtonStructure = persister.getValue(BUTTON_STRUCTURE_KEY),
                buttonStructureMap,
                that = {
                    logButtonStructure: logButtonStructure,
                    logButtonClicked: logButtonClicked
                };

            unifiedLogging.addApplication('CAPToolbarButtons',
                ['ButtonStructure', 'ButtonClick'],
                ['anxt', 'anxtv', 'anxp', 'anxsi']
            );

            Mindspark_Global.getValues('toolbar.config', 'persister',
                function(config, persister){

                    buttonStructureInfo = getButtonStructureInfo(config.widgets);
                    buttonStructure = buttonStructureInfo.buttonStructure;
                    stringifiedButtonStructure = JSON.stringify(buttonStructure);
                    buttonStructureMap = buttonStructureInfo.buttonStructureMap;

                    // If there is an existing Button Structure, did it change?
                    if (existingStringifiedButtonStructure) {
                        try {
                            buttonStructureChanged = existingStringifiedButtonStructure !== stringifiedButtonStructure;
                        } catch (e) {
                            console.error('BL: Error parsing existing Button Structure', (e || {}).message);
                        }
                    }

                    if (buttonStructureChanged) {
                        persister.setValue(BUTTON_STRUCTURE_KEY, stringifiedButtonStructure);
                    }

                });

            return that;
        })());
    }
);
