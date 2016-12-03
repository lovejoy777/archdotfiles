/**
 * Created by steven.harris on 5/7/2015.
 */
/*
 Definition Dependencies:
 'console': anything that implements the non-standard console API. See universalConsole.js
 'toolbarName': set to "Mindspark_" and it will be replaced with the toolbar specific member name at build time

 Initialization Dependencies:
 N/A

 Exports:
 'persister': persists to the toolbar specific FF preferences branch ("extensions.toolbar.mindspark." + toolbarName + ".")
 - setValue: saves the value with the passed name. Uses JSON format
 - getValue: gets the value with the passed name. Returns the JSON.parsed value
 'shared.persister': persists to the shared toolbar preferences branch ("extensions.toolbar.mindspark.")
 - same as above
 'toolbar.persister': same as 'persister'
 - same as above

 */
Mindspark_Global.getValues('console', 'toolbarName',
    function FFPreferencesPersister(console, toolbarName){
        "use strict";

        function branchPersister(branchName, branchPath){
            function clearUserPref(name){
                branch.clearUserPref(name);
            }
            function setCharPref(name, value){
                try{
                    branch.setCharPref(name, JSON.stringify(value));
                }catch (err){
                    console.error('ffpp: caught %s', (err || {}).message);
                }
            }
            function branchWithValue(name){
                if (branch.prefHasUserValue(name)){
                    return branch;
                }else if (defaultBranch.prefHasUserValue(name)){
                    return defaultBranch;
                }else{
                    return null;
                }
            }
            function getCharPref(name){
                var _branch = branchWithValue(name),
                    rawValue,
                    value;
                try{
                    rawValue = _branch ? _branch.getCharPref(name) : undefined;
                    if (rawValue){
                        value = JSON.parse(rawValue);
                    }
                }catch (err){
                    console.error('ffpp: caught %s', (err || {}).message);
                }
                return value;
            }
            function setValue(name, value){
                if (typeof value === undefined){
                    console.log('ffpp: %s.setValue(%s) - clearing', branchName, name);
                    clearUserPref(name);
                }else{
                    console.log('ffpp: %s.setValue(%s,%s) - setting', branchName, name, value);
                    setCharPref(name, value);
                }
            }
            function getValue(name){
                return getCharPref(name);
            }

            var branch = prefsService.getBranch(branchPath),
                defaultBranch = prefsService.getDefaultBranch(branchPath);

            return {
                setValue: setValue,
                getValue: getValue
            };
        }

        var prefsService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
            sharedBranchPath = "extensions.toolbar.mindspark.",
            toolbarBranchPath = sharedBranchPath + toolbarName + ".",
            toolbarPersister = branchPersister('toolbar', toolbarBranchPath),
            sharedPersister = branchPersister('shared', sharedBranchPath);

        Mindspark_Global.setValue('persister', toolbarPersister);
        Mindspark_Global.setValue('toolbar.persister', toolbarPersister);
        Mindspark_Global.setValue('shared.persister', sharedPersister);
    }
);