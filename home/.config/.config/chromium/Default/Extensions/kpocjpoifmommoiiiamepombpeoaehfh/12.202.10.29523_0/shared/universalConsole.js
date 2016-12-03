var	universalConsole = (function(){
    var	sysConsole = window.console,
        resolve = function(objByName){
            var parts = objByName.split('.'),
                curObj = window;
            while (parts.length > 0 && curObj){
                curObj = curObj[parts.shift()];
            }
            return curObj;
        },
        hasComponentsClasses = resolve('Components.classes'),
        mozLogger = function(arg){
            try{
                Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage('[UC] ' + arg);
            }catch (e){}
        },
        sysLogger = function(arg){
            if (sysConsole){
                sysConsole.log('[UC] ' + arg);
            }
        },
        internalLogger = hasComponentsClasses ? mozLogger : sysLogger,
        _log = function(){
            internalLogger(Array.prototype.slice.call(arguments).join(','));
        },
        isArray = function (obj){
            return Object.prototype.toString.call(obj) === '[object Array]';
        },
        isDate = function(obj){
            return Object.prototype.toString.call(obj) === "[object Date]";
        },
        formatter = (function(){
            var	formatValue = function(value, depth){
                    switch (value === null ? 'null' : typeof value){
                        case 'object':
                            return formatObject(value, depth);
                        case 'function':
                            return formatFunction(value, depth);
                        case 'string':
                        case 'null':
                        case 'undefined':
                        case 'boolean':
                        default:
                            return String(value);
                    }
                },
                formatFunction = function(value, depth){
                    if (depth <= 0){
                        return '[function]';
                    }else{
                        var funcStr = String(value);
                        if (funcStr.length > 50){
                            var ar = funcStr.match(/^(.*?\(.*?\))/);
                            funcStr = ar ? ar[0] + '{...}' : funcStr.substring(0, 48) + '...}';
                        }
                        return funcStr.replace(/\s*\n\s*/, '\\n');
                    }
                },
                formatArray = function(array, depth){
                    if (depth === 0){
                        return String(array);
                    }else{
                        var out = [];
                        for (var i = 0; i < array.length; ++i){
                            out.push(formatValue(array[i], depth-1));
                        }
                        return '[' + out.join(', ') + ']';
                    }
                },
                objHasOwnProperty = function(obj, property){
                    try{
                        return obj.hasOwnProperty(property);
                    }catch (e){
                        return true;
                    }
                },
                getObjValue = function(obj, property){
                    var value;
                    try{
                        value = obj[property];
                    }catch (e){
                        value = '[Exception:' + e + ']';
                    }
                    return value;
                },
                formatObject = function(obj, depth){
                    var out = '';
                    if (depth === 0){
                        out = String(obj);
                    }else if (isArray(obj)){
                        out = formatArray(obj, depth);
                    }else if (isDate(obj)){
                        out = String(obj);
                    }else{
                        var items = [];
                        for (var p in obj){
                            if (objHasOwnProperty(obj, p)){
                                items.push(p + ':' + formatValue(getObjValue(obj, p), depth - 1));
                            }
                        }
                        out = '{' + items.join(', ') + '}';
                    }
                    return out;
                },
                formatArgs = function(args){
                    var argIndex = 0,
                        out = '',
                        sep = '';

                    if (args.length > 0 && typeof args[0] === 'string' && args[0].indexOf('%') != -1){
                        var re = /%[odisfO%]/g,
                            substitutor = function(match /*, offset, string*/){
                                var value = match === '%' ? '%' : formatValue(args[argIndex++], 1);
                                return typeof value === 'undefined' ? '' : value;
                            };

                        out = args[argIndex++].replace(re, substitutor);
                        sep = ' ';
                    }

                    out += sep + formatArgsNoSubstitution(args, argIndex);
                    return out;
                },
                formatArgsNoSubstitution = function(args, startIndex){
                    var out = '',
                        sep = '';
                    for (var i = startIndex || 0, len = args.length; i < len; ++i){
                        out += sep + formatValue(args[i], 1);
                        sep = ' ';
                    }
                    return out;
                },
                formatLine = function(type, args, noGroup){
                    var argsArray = Array.prototype.splice.call(args, 0),
                        argsFmt = formatArgs(argsArray),
                        output = (noGroup ? '' : groupObj) + '[' + type + '] ' + argsFmt;
                    return output;
                },
                that = {
                    formatValue: formatValue,
                    formatArray: formatArray,
                    formatObject: formatObject,
                    formatArgs: formatArgs,
                    formatArgsNoSubstitution: formatArgsNoSubstitution,
                    formatLine: formatLine
                };

            return that;
        })(),
        groupObj = (function(){
            var output = "",
                level = 0,
                start = function(){
                    output += "--";
                    level += 1;
                },
                end = function(){
                    if (level > 0){
                        output = output.substring(2);
                        level -= 1;
                    }
                },
                getLevel = function(){
                    return level;
                },
                toString = function(){
                    return output;
                },
                that = {
                    start: start,
                    end: end,
                    getLevel: getLevel,
                    toString: toString
                };

            return that;
        })(),
        timeObj = (function(){
            var map = {},
                start = function(name){
                    map[name] = new Date();
                    return name + ': timer started';
                },
                end = function(name){
                    var date = map[name];
                    return name + ': ' + (date ? (new Date().getTime() - date.getTime()) + 'ms' : 'not found!');
                },
                that = {
                    start: start,
                    end: end
                };
            return that;
        })(),
        stubConsole = (function(){
            var stubFunction = function(){},
                that = {
                    debug: stubFunction,
                    dir: stubFunction,
                    error: stubFunction,
                    group: stubFunction,
                    groupCollapsed: stubFunction,
                    groupEnd: stubFunction,
                    info: stubFunction,
                    log: stubFunction,
                    time: stubFunction,
                    timeEnd: stubFunction,
                    trace: stubFunction,
                    warn: stubFunction
                };
            return that;
        })(),
        chromeMessengerConsole = (function(){
            var log = function(type, args){
                    try{
                        var argsArray = Array.prototype.splice.call(args, 0),
                            argsFmt = formatter.formatArgs(argsArray),
                            request = {
                                cmd: "console",
                                which: type,
                                arguments: argsArray,
                                formatted: argsFmt,
                                level: groupObj.getLevel()
                            };
                        chrome.extension.sendMessage(request, function(){});
                    }catch (e){}
                },
                that = {
                    debug: 			function(){log('debug', arguments);},
                    dir: 			function(){log('dir', arguments);},
                    error: 			function(){log('error', arguments);},
                    group: 			groupObj.start,
                    groupCollapsed:	groupObj.start,
                    groupEnd: 		groupObj.end,
                    info: 			function(){log('info', arguments);},
                    log: 			function(){log('log', arguments);},
                    time: 			function(){log('time', [timeObj.start.apply(timeObj, arguments)]);},
                    timeEnd: 		function(){log('time', [timeObj.end.apply(timeObj, arguments)]);},
                    trace: 			function(){log('trace', ['unsupported']);},
                    warn: 			function(){log('warn', arguments);}
                };

            return that;
        })(),
        mozillaConsole = (function(){
            var getConsoleService = function(){
                    var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
                    getConsoleService = function(){
                        return consoleService;
                    };
                    return consoleService;
                },
                log = function(type, args){
                    try{
                        getConsoleService().logStringMessage(formatter.formatLine(type, args));
                    }catch (e){}
                },
                that = {
                    debug: 			function(){log('debug', arguments);},
                    dir: 			function(){log('dir', arguments);},
                    error: 			function(){log('error', arguments);},
                    group: 			groupObj.start,
                    groupCollapsed:	groupObj.start,
                    groupEnd: 		groupObj.end,
                    info: 			function(){log('info', arguments);},
                    log: 			function(){log('log', arguments);},
                    time: 			function(){log('time', [timeObj.start.apply(timeObj, arguments)]);},
                    timeEnd: 		function(){log('time', [timeObj.end.apply(timeObj, arguments)]);},
                    trace: 			function(){log('trace', ['unsupported']);},
                    warn: 			function(){log('warn', arguments);}
                };

            return that;
        })(),
        alertConsole = (function(){
            var	queued = [],
                log = function(type, args){
                    try{
                        queued.push(formatter.formatLine(type, args));
                        schedule();
                    }catch(e){}
                },
                timerId = 0,
                delay = 3*1000,
                maxLines = 20,
                schedule = function(){
                    if (!timerId){
                        timerId = window.setTimeout(show, delay);
                    }
                },
                show = function(){
                    var output = queued.slice(0, maxLines);
                    queued = queued.slice(maxLines);

                    timerId = 0;
                    if (output.length > 0){
                        output.unshift(' ---------------- CONSOLE OUTPUT ---------------- ');
                        window.alert(output.join('\n'));
                        schedule();
                    }
                },
                setOptions = function(options){
                    if (options.alertDelay)		delay = options.alertDelay;
                    if (options.alertMaxLines)	maxLines = options.alertMaxLines;
                },
                that = {
                    setOptions:		setOptions,
                    debug: 			function(){log('debug', arguments);},
                    dir: 			function(){log('dir', arguments);},
                    error: 			function(){log('error', arguments);},
                    group: 			groupObj.start,
                    groupCollapsed:	groupObj.start,
                    groupEnd: 		groupObj.end,
                    info: 			function(){log('info', arguments);},
                    log: 			function(){log('log', arguments);},
                    time: 			function(){log('time', [timeObj.start.apply(timeObj, arguments)]);},
                    timeEnd: 		function(){log('time', [timeObj.end.apply(timeObj, arguments)]);},
                    trace: 			function(){log('trace', ['unsupported']);},
                    warn: 			function(){log('warn', arguments);}
                };

            return that;
        })(),
        htmlConsole = (function(){
            var queued = ['CONSOLE OUTPUT'],
                sep = '',
                timerId = 0,
                delay = 100,
                element,
                getTypeStyle = function(type){
                    switch (type){
                        case 'error': return 'color: red; font-weight: bolder;';
                        case 'warn': return 'color: orange; font-weight: bolder;';
                        case 'debug': return 'color: blue;';
                        case 'info': return 'font-style: italic;';
                        default: return '';
                    }
                },
                getPadding = function(){
                    return 'padding-left: ' + (groupObj.getLevel()*2) + 'em;';
                },
                log = function(type, args){
                    try{
                        var style = ' style="' + getTypeStyle(type) + getPadding() + '"';
                        queued.push('<span' + style + '>'
                        + formatter.formatLine(type, args, true)
                        + '</span>');
                        schedule();
                    }catch(e){}
                },
                getElement = function(){
                    if (!element){
                        document.body.appendChild(element = document.createElement('div'));
                        element.style.whiteSpace = 'nowrap';
                        element.style.fontFamily = 'monospace';
                        element.style.fontSize = '9pt';
                    }
                    return element;
                },
                schedule = function(){
                    if (!timerId){
                        timerId = window.setTimeout(show, delay);
                    }
                },
                show = function(){
                    var output = queued.join('\n');
                    queued = [];
                    timerId = 0;
                    getElement().innerHTML += sep + output;
                    sep = '\n';
                },
                setOptions = function(options){
                    if (options.htmlDelay)		delay = options.htmlDelay;
                    if (options.htmlElement)	element = options.htmlElement;
                },
                that = {
                    setOptions:		setOptions,
                    debug: 			function(){log('debug', arguments);},
                    dir: 			function(){log('dir', arguments);},
                    error: 			function(){log('error', arguments);},
                    group: 			groupObj.start,
                    groupCollapsed:	groupObj.start,
                    groupEnd: 		groupObj.end,
                    info: 			function(){log('info', arguments);},
                    log: 			function(){log('log', arguments);},
                    time: 			function(){log('time', [timeObj.start.apply(timeObj, arguments)]);},
                    timeEnd: 		function(){log('time', [timeObj.end.apply(timeObj, arguments)]);},
                    trace: 			function(){log('trace', ['unsupported']);},
                    warn: 			function(){log('warn', arguments);}
                };

            return that;
        })(),
        mozillaFileConsole = (function(){
            var logFilePath = null,
                logFileName = 'universalConsole.log',
                getFFProfileDir = function(){
                    return Components.classes["@mozilla.org/file/directory_service;1"].
                        getService(Components.interfaces.nsIProperties).
                        get("ProfD", Components.interfaces.nsIFile);
                },
                logFile = null,
                queuedLines = [],
                writeToQueue = function(line){
                    queuedLines.push(line);
                },
                getFile = function(){
                    try{

                        if (!logFile){
                            if (logFilePath){
                                logFile = Components.classes["@mozilla.org/file/local;1"].
                                    createInstance(Components.interfaces.nsILocalFile);
                                logFile.initWithPath(logFilePath);
                            }else{
                                logFile = getFFProfileDir();
                                logFile.append(logFileName);
                            }
                            if (!logFile.exists()){
                                logFile.create(Components.interfaces.nsIFile.FILE_TYPE, 0777);
                                writeToQueue('Created ' + new Date());
                            }else{
                                writeToQueue('------------------------');
                                writeToQueue('Appending to ' + new Date());
                            }
                        }
                    }catch(e){
                        _log('getFile caught ' + e);
                    }
                    return logFile;
                },
                flushToFile = function(){
                    try{
                        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                                createInstance(Components.interfaces.nsIFileOutputStream),
                        // if you are sure there will never ever be any non-ascii text in data you can
                        // also call foStream.write(data, data.length) directly
                            converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                                createInstance(Components.interfaces.nsIConverterOutputStream),
                            out = queuedLines.join('\n') + '\n';

                        queuedLines = [];

                        foStream.init(getFile(), 0x02 | 0x10, 0666, 0);
                        // write, create, truncate
                        // In a c file operation, we have no need to set file mode with or operation,
                        // directly using "r" or "w" usually.

                        converter.init(foStream, "UTF-8", 0, 0);
                        converter.writeString(out);
                        converter.close(); // this closes foStream
                    }catch (e){
                        _log('mFC - flushToFile - caught ' + e);
                    }
                },
                log = function(type, args){
                    try{
                        getFile(); // prepares the file!
                        writeToQueue(formatter.formatLine(type, args));
                        flushToFile();
                    }catch (e){
                        _log('mFC - log - caught ' + e);
                    }
                },
                setOptions = function(options){
                    if (options.logFileName)		logFileName = options.logFileName;
                    if (options.logFilePath)		logFilePath = options.logFilePath;
                },
                that = {
                    setOptions:		setOptions,
                    debug: 			function(){log('debug', arguments);},
                    dir: 			function(){log('dir', arguments);},
                    error: 			function(){log('error', arguments);},
                    group: 			groupObj.start,
                    groupCollapsed:	groupObj.start,
                    groupEnd: 		groupObj.end,
                    info: 			function(){log('info', arguments);},
                    log: 			function(){log('log', arguments);},
                    time: 			function(){log('time', [timeObj.start.apply(timeObj, arguments)]);},
                    timeEnd: 		function(){log('time', [timeObj.end.apply(timeObj, arguments)]);},
                    trace: 			function(){log('trace', ['unsupported']);},
                    warn: 			function(){log('warn', arguments);}
                };
            return that;
        })(),
        logFileConsole = resolve('Components.interfaces.nsIFile') ? mozillaFileConsole : stubConsole,
        chainConsole = (function(){
            var consoles = [],
                log = function(type, args){
                    try{
                        for (var i = 0, len = consoles.length; i < len; ++i){
                            var console = getConsole(consoles[i]);
                            console[type].apply(console, args);
                        }
                    }catch(e){}
                },
                includesSysConsole = false,
                get = function(){
                    consoles = Array.prototype.slice.call(arguments, 0);
                    includesSysConsole = false;
                    for (var i = 0, len = consoles.length; i < len; ++i){
                        var c = getConsole(consoles[i]);
                        includesSysConsole |= c === sysConsole;
                    }
                    return that;
                },
                group = function(){
                    if (includesSysConsole){
                        sysConsole.group();
                    }
                    groupObj.start();
                },
                groupCollapsed = function(){
                    if (includesSysConsole){
                        sysConsole.groupCollapsed();
                    }
                    groupObj.start();
                },
                groupEnd = function(){
                    if (includesSysConsole){
                        sysConsole.groupEnd();
                    }
                    groupObj.end();
                },
                timeOp = function(op, args){
                    try{
                        for (var i = 0, len = consoles.length; i < len; ++i){
                            var console = getConsole(consoles[i]);
                            console[op].apply(console, args);
                        }
                    }catch(e){}
                },
                that = {
                    get:			get,
                    debug: 			function(){log('debug', arguments);},
                    dir: 			function(){log('dir', arguments);},
                    error: 			function(){log('error', arguments);},
                    group: 			group,
                    groupCollapsed:	groupCollapsed,
                    groupEnd: 		groupEnd,
                    info: 			function(){log('info', arguments);},
                    log: 			function(){log('log', arguments);},
                    time: 			function(){timeOp('time', arguments);},
                    timeEnd: 		function(){timeOp('timeEnd', arguments);},
                    //time: 		function(){log('time', [timeObj.start.apply(timeObj, arguments)]);},
                    //timeEnd: 		function(){log('time', [timeObj.end.apply(timeObj, arguments)]);},
                    trace: 			function(){log('trace', ['unsupported']);},
                    warn: 			function(){log('warn', arguments);}
                };

            return that;
        })(),
        httpConsole = (function(){
            var httpConsoleURL = 'http://localhost/debug',
                httpConsoleAsync = true,
                httpConsoleMethod = "POST",
                error = false,
                sendMessage = function(msg){
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.onreadystatechange = function(){
                        if (xmlHttp.status === 400){
                            sysConsole.warn('sendMessage - 400, msg: %s', msg);
                            error = true;
                        }else if (xmlHttp.status !== 200 && xmlHttp.readyState === 4){
                            sysConsole.warn('sendMessage - status: %s, readState === 4, msg: %s', xmlHttp.status, msg);
                            error = true;
                        }
                    };
                    if (!error){
                        var content = 'msg=' + encodeURIComponent(msg),
                            url = httpConsoleMethod == "POST" ? httpConsoleURL : httpConsoleURL + '?' + content;
                        xmlHttp.open(httpConsoleMethod, url, httpConsoleAsync);
                        try{
                            if (httpConsoleMethod === "POST"){
                                xmlHttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
                                xmlHttp.send(content);
                            }else{
                                xmlHttp.send();
                            }
                        }catch (e){
                            sysConsole.warn('sendMessage - caught %s while attempting to send %s', e, msg);
                        }
                    }
                },
                log = function(type, args){
                    try{
                        var formatted = formatter.formatLine(type, args, true);
                        sendMessage(formatted);
                    }catch(e){}
                },
                setOptions = function(options){
                    if (options.httpConsoleURL)		httpConsoleURL = options.httpConsoleURL;
                    if (options.httpConsoleAsync)   httpConsoleAsync = options.httpConsoleAsync;
                    if (options.httpConsoleMethod)  httpConsoleMethod = options.httpConsoleMethod
                },
                that = {
                    setOptions:		setOptions,
                    debug: 			function(){log('debug', arguments);},
                    dir: 			function(){log('dir', arguments);},
                    error: 			function(){log('error', arguments);},
                    group: 			groupObj.start,
                    groupCollapsed:	groupObj.start,
                    groupEnd: 		groupObj.end,
                    info: 			function(){log('info', arguments);},
                    log: 			function(){log('log', arguments);},
                    time: 			function(){log('time', [timeObj.start.apply(timeObj, arguments)]);},
                    timeEnd: 		function(){log('time', [timeObj.end.apply(timeObj, arguments)]);},
                    trace: 			function(){log('trace', ['unsupported']);},
                    warn: 			function(){log('warn', arguments);}
                };

            return that;
        })(),
        bestConsole = (function(){
            if (resolve('Components.classes')){
                return mozillaConsole;
            }else if (sysConsole){
                return sysConsole;
            }else{
                return alertConsole;
            }
        })(),
        CONSOLE_TYPE = {
            STUB: 0, SYS: 1, MOZILLA: 2, ALERT: 3, HTML: 4, BG_CHROME: 5, LOG_FILE: 6, LOG_HTTP: 7, BEST: 1000
        },
        consoles = [stubConsole, sysConsole, mozillaConsole, alertConsole, htmlConsole, chromeMessengerConsole, logFileConsole, httpConsole],
        consolePropertyName = 'console',
        getConsole = function(which){
            if (arguments.length > 1){
                return chainConsole.get.apply(chainConsole, arguments);
            }else if (0 <= which && which < consoles.length && consoles[which]){
                return consoles[which];
            }else if (which === CONSOLE_TYPE.BEST){
                return bestConsole;
            }else{
                return stubConsole;
            }
        },
        setConsole = function(which){
            window[consolePropertyName] = getConsole.apply(this, arguments);
        },
        addConsoleImpl = function(index, console){
            consoles[index] = console;
        },
        initialize = function(){
            setConsole(CONSOLE_TYPE.BEST);
        },
        setConsoleOptions = function(options){
            for (var i = 0, len = consoles.length; i < len; ++i){
                var console = consoles[i];
                if (console && console.setOptions){
                    console.setOptions(options);
                }
            }
            if (options.consolePropertyName)    consolePropertyName = options.consolePropertyName;
        },
        resetConsole = function(){
            setConsole(CONSOLE_TYPE.BEST);
        },
        that = {
            getConsole: getConsole,
            setConsole: setConsole,
            resetConsole: resetConsole,
            addConsoleImpl: addConsoleImpl,
            initialize: initialize,
            setConsoleOptions: setConsoleOptions,
            CONSOLE_TYPE: CONSOLE_TYPE
        };

    initialize();

    return that;
})();

/*
 universalConsole.setConsole(universalConsole.CONSOLE_TYPE.SYS, universalConsole.CONSOLE_TYPE.LOG_HTTP);
 */