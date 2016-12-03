/*
 * Created with IntelliJ IDEA.
 * User: steven.harris
 * Date: 4/17/13
 * Time: 9:21 AM
 * To change this template use File | Settings | File Templates.
 */

/**
 * Returns an object to encapsulate an Http URL.
 * @param url - which gets parsed into the Http URL object
 * @returns an object that provides operations for:
 * <ul>
 * <li>Scheme - getter/setter
 * <li>Domain - getter/setter
 * <li>Port - getter/setter
 * <li>Path - getter/setter
 * <li>QueryString - getter/setter
 * <li>FragmentId - getter/setter
 * <li>Param - getter/setter/removal
 * <li>setParamsFromObject - passed an object, each attribute is turned into a parameters name/value
 * <li>hasParams - return true when the URL has at least one parameter
 * <li>toString - returns the actual URL as a string.
 * </ul>
 * @constructor
 */
var Mindspark_HttpURL = function(url){
        var parts = {
                scheme: undefined,
                domain: undefined,
                port: undefined,
                path: undefined,
                queryString: undefined,
                fragmentId: undefined
            },
            params = new Mindspark_HttpQueryString(),
            toString = function(){
                var out = parts.scheme + '://' + parts.domain;
                if (parts.port) 		out += ':' + parts.port;
                out += '/';
                if (parts.path) 		out += parts.path;
                if (parts.queryString)  out += '?' + parts.queryString;
                if (parts.fragmentId)	out += '#' + parts.fragmentId;
                return out;
            },
            that = {
                getScheme: 		function()    {return parts.scheme;},
                getDomain: 		function()    {return parts.domain;},
                getPort: 		function()    {return parts.port;},
                getPath: 		function()    {return parts.path;},
                getQueryString: function()    {return parts.queryString;},
                getFragmentId: 	function()    {return parts.fragmentId;},
                setScheme: 		function(v)	  {parts.scheme = v;},
                setDomain: 		function(v)	  {parts.domain = v;},
                setPort: 		function(v)	  {parts.port = v;},
                setPath: 		function(v)	  {parts.path = v;},
                setFragmentId: 	function(v)	  {parts.fragmentId = v;},
                setQueryString: function(v)   {params.setQueryString(v); parts.queryString = params.toString();},
                getParam: 		function(n)   {return params.getParam(n);},
                setParam: 		function(n,v) {params.setParam(n,v); parts.queryString = params.toString();},
                setParamsFromObject: function(o){params.setParamsFromObject(o); parts.queryString = params.toString();},
                removeParam:    function(n)   {params.removeParam(n); parts.queryString = params.toString();},
                hasParams:		function()    {return params.hasParams();},
                hasParam:       function(n)   {return params.hasParam(n);},
                getParamsObject:function()    {return params.getParamsObject();},
                toString:		toString
            },
            parse = function(url){
                var RFC_URL = /^(.*?):\/\/(.*?)(:[0-9]+)?\/(.*?)(\?.*?)?(#.*)?$/, // scheme://domain[:port]/[path][?query][#fragment]
                    SCHEME_DOMAIN = /^(.*?):\/\/(.*?)(:[0-9]+)?$/, // scheme://domain[:port]
                    results = RFC_URL.exec(url);

                if (!results){
                    // also support url w/out slash following domain
                    results = SCHEME_DOMAIN.exec(url);
                }

                if (results){
                    that.setScheme(results[1]);
                    that.setDomain(results[2]);
                    that.setPort(results[3] ? results[3].substring(1) : undefined);
                    that.setPath(results[4]);
                    that.setQueryString(results[5] ? results[5].substring(1) : undefined);
                    that.setFragmentId(results[6] ? results[6].substring(1) : undefined);
                }
            };

        if (url){
            parse(url);
        }

        return that;
    },
    /**
     * Returns an object to encapsulate an Http Query String
     * @param queryString - this string gets parsed into it's corresponding parameters
     * @returns an object that provides operations for:
     * <ul>
     *     <li>setQueryString - parses the passed string into it's corresponding parameters
     *     <li>Param - getter/setter/removal
     *     <li>setParamsFromObject - passed an object, each attribute is turned into a parameters name/value
     *     <li>getParamNames - returns array of all of the parameter names
     *     <li>hasParams - return true when the URL has at least one parameter
     *     <li>toString - returns the parameters as a properly formatted query string.
     *  </ul>
     * @constructor
     */
    Mindspark_HttpQueryString = function(qs){
        var nameValues = [],
            parse = function(queryString){
                var nvs = queryString ? queryString.split('&') : [];

                nameValues = [];
                for (var i = 0, len = nvs.length; i < len; ++i){
                    var nvp = nvs[i].split('='),
                        encodedValue = nvp.length === 1 ? '' : nvp[1],
                        nv = {
                            name: decodeURIComponent(nvp[0]),
                            value: decodeURIComponent(encodedValue),
                            encodedName: nvp[0],
                            encodedValue: encodedValue
                        };
                    if (nv.name){
                        nameValues.push(nv);
                    }
                }
            },
            getParamIndex = function(name){
                var index = -1;
                for (var i = 0, len = nameValues.length; i < len; ++i){
                    if (nameValues[i].name === name){
                        index = i;
                        break;
                    }
                }
                return index;
            },
            getParam = function(name){
                var index = getParamIndex(name),
                    value = index === -1 ? undefined : nameValues[index].value;
                return value;
            },
            setParam = function(name, decodedValueIn){
                var index = getParamIndex(name),
                    decodedValue = typeof decodedValueIn === 'undefined' ? '' : decodedValueIn,
                    nv = {
                        name: name,
                        value: decodedValue,
                        encodedName: encodeURIComponent(name),
                        encodedValue: encodeURIComponent(decodedValue)
                    };
                if (index === -1){
                    nameValues.push(nv);
                }else{
                    nameValues[index] = nv;
                }
            },
            setParamsFromObject = function(obj){
                for (var p in obj){
                    if (obj.hasOwnProperty(p)){
                        setParam(p, obj[p]);
                    }
                }
            },
            removeParam = function(name){
                var index = getParamIndex(name);
                if (index !== -1){
                    nameValues.splice(index, 1);
                }
            },
            getParamNames = function(){
                var out = [];
                for (var i = 0, len = nameValues.length; i < len; ++i){
                    var nv = nameValues[i];
                    out.push(nv.name);
                }
                return out;
            },
            hasParams = function(){
                return nameValues.length > 0;
            },
            hasParam = function(name){
                var index = getParamIndex(name);
                return index !== -1;
            },
            getParamsObject = function(){
                var obj = {};
                for (var i = 0, len = nameValues.length; i < len; ++i){
                    var nv = nameValues[i];
                    obj[nv.name] = nv.value;
                }
                return obj;
            },
            toString = function(){
                var out = [];
                for (var i = 0, len = nameValues.length; i < len; ++i){
                    var nv = nameValues[i];
                    out.push(nv.encodedName + '=' + nv.encodedValue);
                }
                return out.join('&');
            },
            setQueryString = function(qs){
                parse(qs);
            },
            that = {
                setQueryString: setQueryString,
                getParam: 		getParam,
                setParam: 		setParam,
                setParamsFromObject: setParamsFromObject,
                getParamNames:  getParamNames,
                hasParams:      hasParams,
                hasParam:       hasParam,
                removeParam:	removeParam,
                getParamsObject:getParamsObject,
                toString:		toString
            };

        if (qs){
            parse(qs);
        }

        return that;
    };

if (window.Mindspark_Global) {
    Mindspark_Global.setValue('HttpURL', Mindspark_HttpURL);
    Mindspark_Global.setValue('HttpQueryString', Mindspark_HttpQueryString);
}

(function(runTests){
    var console = window.console || Mindspark_console,
        HttpURL = Mindspark_HttpURL,
        HttpQueryString = Mindspark_HttpQueryString;
    Mindspark_HttpURL.unitTests = function HttpURLTests(){
        //confirm that the parser supports expected formats
        console.log('Mindspark_HttpURL unit tests - STARTING');
        console.log(String(new HttpURL("scheme://domain.x.y.com")));
        console.log(String(new HttpURL("scheme://domain.x.y.com:1234")));
        console.log(String(new HttpURL("scheme://domain.x.y.com/path.a.b.c?a=1&b=2")));
        console.log(String(new HttpURL("scheme://domain.x.y.com:1234/path.a.b.c?a=1&b=2")));
        console.log(String(new HttpURL("scheme://domain.x.y.com/path.a.b.c?a=1&b=2#abc")));
        console.log(String(new HttpURL("scheme://domain.x.y.com:1234/path.a.b.c?a=1&b=2#abc")));
        console.log(String(new HttpURL("scheme://domain.x.y.com/path.a.b.c#abc")));
        console.log(String(new HttpURL("scheme://domain.x.y.com:1234/path.a.b.c#abc")));
        console.log('Mindspark_HttpURL unit tests - COMPLETED');
    };
    Mindspark_HttpQueryString.unitTests = function HttpQueryStringTests(){
        console.log('Mindspark_HttpQueryString unit tests - place holder for now')
    };
    if (runTests){
        HttpURL.unitTests();
        HttpQueryString.unitTests();
    }
})(false);