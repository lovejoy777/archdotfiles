/**
 * Created by steven.harris on 5/7/2015.
 */

/*
 Definition Dependencies:
 'console': anything that implements the non-standard console API. See universalConsole.js

 Initialization Dependencies:
 N/A

 Exports:
 'persister': persists to Local Storage
 - setValue: saves the value with the passed name. Uses JSON format
 - getValue: gets the value with the passed name. Returns the JSON.parsed value

 */

Mindspark_Global.getValues('console', function(console){
    "use strict";

    Mindspark_Global.setValue('persister', (function(){
        function setValue(name, value){
            if (value !== undefined){
                value = JSON.stringify(value);
                console.log('lsp: setValue(%s,%s)', name, value);
                localStorage.setItem(name, value);
            }else{
                console.log('lsp: setValue(%s,%s) - removing', name, value);
                localStorage.removeItem(name);
            }
        }
        function getValue(name, defaultValue){
            var value = localStorage.getItem(name);
            if (value !== null){
                try{
                    value = JSON.parse(value);
                }catch(err){
                    value = defaultValue;
                }
            }else{
                value = defaultValue;
            }
            return value;
        }

        return {
            getValue: getValue,
            setValue: setValue
        };
    }
    )());
});