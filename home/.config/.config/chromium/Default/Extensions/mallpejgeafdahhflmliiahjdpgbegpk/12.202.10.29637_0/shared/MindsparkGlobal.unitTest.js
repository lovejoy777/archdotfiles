/**
 * Created by steven.harris on 5/7/2015.
 */

(function(runTest) {
    Mindspark_Global.unitTest = function() {
        "use strict";

        function valueOf(value){
            return typeof value != 'function' ? JSON.stringify(value) : String(value);
        }

        function createSubscriber(prefix) {
            return function createdSubscriber(name, newValue, oldValue) {
                console.log('MGu: %s - %s: %s, was %s', prefix, name, valueOf(newValue), JSON.stringify(oldValue));
            };
        }

        function createGetter(prefix, name){
            return function createdGetter(value){
                console.log('MGu: %s - %s.callback(%s)', prefix, name, value);
            };
        }

        function logValue(prefix, name) {
            for (var i = 1; i < arguments.length; ++i) {
                console.log('MGu: %s - %s=%s', prefix, arguments[i], valueOf(Mindspark_Global.getValue(arguments[i])));
            }
        }

        function loadScript(_id, src, loader) {
            var id = '_____' + id + '_____',
                script;
            if (document.querySelector('#' + id)){
                loader();
            }else{
                try{
                    script = document.createElement('script');
                    script.addEventListener('load', function(){loader()});
                    script.setAttribute('type', 'text/javascript');
                    script.setAttribute('id', id);
                    document.body.appendChild(script);
                    script.setAttribute('src', src);
                }catch (e){
                    console.log('MGu:', e.message, e.stack);
                }
            }
        }

        var toolbarData = {a: 123, b: 456},
            stub = function(){},
            console = window.console || Mindspark_console || {log: stub, error: stub};

        //Mindspark_Global.reset();

        Mindspark_Global.setTracer(function tracer(){
            arguments[0] = 'MGu-t: ' + arguments[0];
            console.log.apply(console, arguments);
        });

        Mindspark_Global.subscribeToAll(createSubscriber('ALL  '));
        Mindspark_Global.setErrorRecorder(function errorRecorder(err){
            console.error('MGu: message: %s, stack: %s', err.message, err.stack);
        });

        Mindspark_Global.setValueResolver('jquery', function(name) {
            console.log('MGu: - jquery loader');
            loadScript('jquery', 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js', function() {
                Mindspark_Global.setValue('jquery', $);
            });
        });

        Mindspark_Global.getValues('underscore', 'jquery', 'toolbarData', 'testing', 'date', 'a', function(_, $, toolbarData, testing, date, a) {
            console.log('MGu: getValues(%s, %s, %s, %s, %s, %s)', valueOf(_), valueOf($), valueOf(toolbarData), testing, valueOf(date), a);
            logValue('getValues', 'underscore', 'jquery', 'toolbarData', 'testing', 'date', 'a');
            console.log('MGu: _.VERSION', _.VERSION);
            console.log('MGu: $.expando', $.expando);
        });

        Mindspark_Global.setValue('toolbarData', toolbarData);
        Mindspark_Global.subscribe('toolbarData', createSubscriber('TBDATA'));

        Mindspark_Global.getValue('testing', createGetter('pre set', 'testing'));
        Mindspark_Global.subscribe('testing', createSubscriber('TEST1'));
        Mindspark_Global.setValue('testing', 123);
        Mindspark_Global.getValue('testing', createGetter('post set', 'testing'));

        Mindspark_Global.subscribe('testing', createSubscriber('TEST2'));
        Mindspark_Global.subscribe('date', createSubscriber('DATE '));
        console.log('MGu: 0000', Mindspark_Global.toString());

        window.setTimeout(function() {
            console.log('MGu: 2000');
            Mindspark_Global.setValue('date', new Date());
            Mindspark_Global.subscribe('date', createSubscriber('DATE2'));
            Mindspark_Global.setValue('testing', Mindspark_Global.getValue('testing') + 10);
            console.log('MGu: 2000', Mindspark_Global.toString());
        }, 2000);

        window.setTimeout(function() {
            console.log('MGu: 4000');
            Mindspark_Global.setValue('date', new Date());
            Mindspark_Global.subscribe('date', createSubscriber('DATE3'));
            Mindspark_Global.setValue('testing', Mindspark_Global.getValue('testing') + 10);
            Mindspark_Global.setValue('a', 'a-value');
            console.log('MGu: 4000', Mindspark_Global.toString());
        }, 4000);

        window.setTimeout(function() {
            console.log('MGu: 6000');
            Mindspark_Global.setValue('date', new Date());
            Mindspark_Global.setValue('testing', Mindspark_Global.getValue('testing') + 10);
            toolbarData.c = 789;
            Mindspark_Global.setValue('toolbarData', toolbarData, true);
            loadScript('underscore', 'http://underscorejs.org/underscore-min.js', function() {
                console.log('MGu: 6000 - underscore loader');
                Mindspark_Global.setValue('underscore', _);
                console.log('MGu: 6000', Mindspark_Global.toString());
            });
        }, 6000);

        console.log('MGu: done')
    };
    if (runTest) Mindspark_Global.unitTest();
})(false);