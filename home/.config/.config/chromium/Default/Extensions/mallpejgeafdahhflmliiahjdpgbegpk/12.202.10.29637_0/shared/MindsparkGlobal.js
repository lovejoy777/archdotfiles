/**
 * Created by steven.harris on 5/7/2015.
 */

/*
 * This file defines the main logic for Platform Independent Globals Management (short PIGM)
 * PIGM is a solution that focuses solely on enabling the retrieval of global variables
 * once all of their dependencies have been resolved. Due to the nature of the extension
 * and its current architecture this solution is critical and it presents a better way on
 * managing globals. Please note that this is an asynchronous implementation.
 *
 * Main entry points/methods that allow interactions with Mindspark_Global are:
 *
 * 'setTracer':
 * It defines the tracer/logging. To do so a function is passed as an argument, here is an example:
 * Mindspark_Global.setTracer(function tracer(){ arguments[0] = 'MGu-t: ' + arguments[0]; console.log.apply(console, arguments); });
 *
 * 'getGlobal':
 * It returns an object that lists all possible methods that can be invoked on a Global variable
 *
 * 'setValue':
 * Is is used to define a Global variable
 *
 * 'getValue':
 * Used to get the value of a variable that has already been initialized. It returns an object with all
 * possible methods available for invocation. Example: getValue("searchSuggestLocale").getSupportedLocale();
 * returns the value of the supported language/locale of the already initialized global variable 'searchSuggestLocale'
 *
 * 'subscribe':
 * It is used to subscribe or listen to any changes that happen to an initialized Global variable. As changes happen
 * the subscriber will be notified of these changes.
 *
 * 'unsubscribe':
 * Essentially it is the opposite of 'subscribe'
 *
 * 'subscribeToAll':
 * It has the same usage as the 'subscribe' method except that it subscribes or listens to any changes that are happening
 * to all Global variables that have already been initialized.
 *
 * 'getValues':
 * It is used to define a list of dependencies and also a callback function is passed as an argument with the primary purpose of
 * initializing a Global variable using the 'setValue' method described above. Essentially if dependencies that are
 * defined are not initialized then the Global variable defined using the 'setValue' method will be in a 'waiting' state
 * or not 'initialized'.
 *
 * 'setValueResolver':
 * This method serves the same purpose as the 'setValue' method, except that it will make the Global variables accessible to
 * parties that did not subscribe to Global variables but actually need them in order for them to operate.
 * In other words it is a measure that is used to prevent code from breaking.
 *
 * 'setErrorRecorder':
 * This method allows us to define how we want to record errors. It allows passing a function as an argument that will define how to record errors.
 * Here's an example:
 * Mindspark_Global.setErrorRecorder(function(err) { Mindspark_.error('c: Mindspark_Global caught: %s, stack: %s', err.message, err.stack); });
 * The function that we pass in as an argument will define how the errors will be outputted
 *
 * 'toString':
 * It outputs to the browser console the state of all Globals. It shows if a variable has been initialized or
 * waiting. It also outputs the number of subscribers for each Global variable.
 *
 * For detailed information see Confluence page at: https://confluence.iaccap.com:8443/display/NATIVE/PIGM+-+Platform+Independent+Globals+Management
 */

Mindspark_Global = (function() {
    "use strict";

    function Global(name) {
        function trace(){
            if (tracer){
                [].splice.call(arguments, 1, 0, name); // insert name at index 1
                tracer.apply(window, arguments);
            }
        }
        function subscribe(subscriber) {
            trace('%s.subscribe(%O)', subscriber.name || subscriber);
            subscribers.push(subscriber);
            switch (state) {
                case 'initialized':
                    trace('%s.subscribe - initialized, invoking subscriber');
                    subscriber(name, value, value);
                    break;
                case 'uninitialized':
                    if (resolver){
                        trace('%s.subscribe - uninitialized, invoking resolver=%O', resolver);
                        resolver(name);
                        state = 'resolving';
                    }else{
                        trace('%s.subscribe - uninitialized, !resolver');
                        state = 'waiting';
                    }
                    break;
            }
        }
        function unsubscribe(subscriber) {
            var index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                trace('%s.unsubscribe(%O) - removing subscriber', subscriber);
                subscribers.splice(index, 1);
            }else{
                trace('%s.unsubscribe(%O) - !found - subscriber', subscriber);
            }
        }
        function notify(newValue, oldValue) {
            trace('%s.notify(%O,%O)', newValue, oldValue);
            function notify_(list) {
                var entry;
                list = list.slice(0);
                while (list.length > 0) {
                    entry = list.shift();
                    try{
                        trace('%s.notify - invoking subscriber=%O, newValue=%O, oldValue=%O', entry.name || entry, newValue, oldValue);
                        entry(name, newValue, oldValue);
                    }catch (err){
                        trace('%s.notify - error invoking subscriber=%O, err.message=%s, err.stack=%s', entry.name || entry, err.message, err.stack);
                        if (errorRecorder){
                            errorRecorder(err);
                        }
                    }
                }
            }
            trace('%s.notify - notifying all subcribers');
            notify_(subscribersToAll);
            trace('%s.notify - notifying value subcribers');
            notify_(subscribers);
        }
        function setValue(newValue, forceNotify) {
            trace('%s.setValue(%O%s)', newValue, arguments.length > 1 ? ',' + forceNotify : '');
            var oldValue = value;
            value = newValue;
            state = 'initialized';
            if (oldValue != newValue || forceNotify) {
                trace('%s.setValue - notifying(%O,%O)', newValue, oldValue);
                notify(newValue, oldValue);
            }
            trace('%s.setValue - state = initialized');
        }
        function getValue(callback) {
            function getValueSubscriber(name, newValue, oldValue){
                unsubscribe(getValueSubscriber);
                callback(newValue);
            }
            if (!callback){
                return value;
            }else if (state === 'initialized'){
                callback(value);
            }else{
                subscribe(getValueSubscriber);
            }
        }
        function setValueResolver(_resolver) {
            trace('%s.setValueResolver(%O)', _resolver.name || _resolver);
            resolver = _resolver;
            if (state == 'waiting'){
                trace('%s.setValueResolver - invoking resolver=%O', resolver.name || _resolver);
                resolver(name);
                state = 'resolving';
            }
        }
        function toString(){
            var out = [name, ':' ,
                'state=', state, ',',
                value === undefined ? 'undefined,' : '',
                'subscribers=', subscribers.length
            ];
            return out.join('');
        }

        var value,
            state = 'uninitialized',
            resolver,
            subscribers = [],
            that = {
                subscribe: subscribe,
                unsubscribe: unsubscribe,
                setValue: setValue,
                getValue: getValue,
                setValueResolver: setValueResolver,
                toString: toString
            };

        return that;
    }

    function trace(){
        if (tracer){
            tracer.apply(window, arguments);
        }
    }

    function getOrCreate(method, name) {
        var g = values[name];
        if (!g) {
            trace('%s - creating Global %s', method, name);
            values[name] = g = new Global(name);
        }
        return g;
    }

    function setValue(name, value, forceNotify) {
        var g = getOrCreate('setValue', name);
        [].shift.call(arguments);
        g.setValue.apply(g, arguments);
    }

    function getValue(name, callback) {
        var g = callback ? getOrCreate('getValue', name) : values[name];
        [].shift.call(arguments);
        return g ? g.getValue.apply(g, arguments) : undefined;
    }

    function subscribe(name, subscriber) {
        var g = getOrCreate('subscribe', name);
        g.subscribe(subscriber);
    }

    function unsubscribe(name, subscriber) {
        var g = values[name];
        if (g) {
            g.unsubscribe(subscriber);
        }
    }

    function subscribeToAll(subscriber) {
        trace('subscribeToAll(%s)', subscriber.name || subscriber);
        subscribersToAll.push(subscriber);
    }

    function getValues(name, /*names,*/ callbackIn) {
        function getValuesChecker(name, newValue, oldValue) {
            if (newValue === undefined){
                trace('getValues(%s,%s) - newValue undefined, valueName=%s', originalNamesStr, callback.name || callback, name);
                return;
            }
            unsubscribe(name, getValuesChecker);
            var index = unresolvedNames.indexOf(name);
            if (index != -1) {
                unresolvedNames.splice(index, 1);
                if (unresolvedNames.length === 0) {
                    var values = originalNames.map(function(name) {
                        return Mindspark_Global.getValue(name);
                    });
                    trace('getValues(%s,%s) - just set value for valueName=%s, last unresolved value, calling callback', originalNamesStr, callback.name || callback, name);
                    callback.apply(window, values);
                }else{
                    trace('getValues(%s,%s) - just set value for valueName=%s, unresolved remaining=%s', originalNamesStr, callback.name || callback, name, unresolvedNames.join(','));
                }
            }
        }

        var unresolvedNames = Array.prototype.slice.call(arguments, 0),
            callback = unresolvedNames.pop(),
            originalNames = unresolvedNames.slice(0),
            originalNamesStr = unresolvedNames.join(',');

        trace('getValues(%s,%s) - subscribing to Globals with getValuesChecker', originalNamesStr, callback.name || callback);
        for (var i = 0, len = originalNames.length; i < len; ++i) {
            subscribe(originalNames[i], getValuesChecker);
        }
    }

    function setValueResolver(name, resolver) {
        //trace('setValueResolver(%s,%s)', name, resolver.name || resolver);
        var g = getOrCreate('setValueResolver', name);
        g.setValueResolver(resolver);
    }

    function setErrorRecorder(_errorRecorder){
        trace('setErrorRecorder(%s)', _errorRecorder.name || _errorRecorder);
        errorRecorder = _errorRecorder;
    }

    function getGlobal(name){
        return values[name];
    }

    function setTracer(_tracer){
        tracer = _tracer;
    }

    function toString(){
        var out = [],
            keys = Object.keys(values),
            len = keys.length,
            i;
        for (i = 0; i < len; ++i){
            out.push(String(values[keys[i]]));
        }
        return out.join('; ');
    }

    var values = {},
        subscribersToAll = [],
        tracer,
        errorRecorder;

    function getErrorRecorder () {
        return "Current Error Recorder is: " + errorRecorder;
    }

    function getTracer () {
        return "Current Tracer is: " + tracer;
    }

    return {
        setTracer: setTracer,
        getTracer: getTracer,
        getGlobal: getGlobal,
        setValue: setValue,
        getValue: getValue,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        subscribeToAll: subscribeToAll,
        getValues: getValues,
        setValueResolver: setValueResolver,
        setErrorRecorder: setErrorRecorder,
        toString: toString,
        getErrorRecorder : getErrorRecorder
    };
})();
