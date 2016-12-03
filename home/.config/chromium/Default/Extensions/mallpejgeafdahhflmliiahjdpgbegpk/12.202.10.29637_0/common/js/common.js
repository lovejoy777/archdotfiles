/**
 * Note: DO NOT USE UNDERSCORE HERE
 * There are occurrences where we load common but not underscore (new tab page, content script for all frams)
 * When we add underscore dependency here, we should make sure it does not break any of these places
 */


var Common = {
    ACTIVE_APP: 'CAPNative',
    ACTIVE_EVENT: "ToolbarActive",

    BAR_SEARCH: 'bar',
    KEYWORD_SEARCH: 'kwd',
    DNS_SEARCH: 'dns',
    SEARCH_BOX_SEARCH: 'sb',
    CONTEXT_SEARCH: 'ctxt',

	isNull: function (v) {
		return typeof(v) === 'undefined' || v === null;
	},

	isNotNull: function (v) {
		return typeof(v) !== 'undefined' && v !== null;
	},

	// Returns true if the argument is undefined, null, an empty string, or an
	// empty array.
	isEmpty: function (v) {
        var t = typeof v;
		return t === 'undefined' || v === null || (t === 'string' && v.length == 0);
	},

	// Returns true if the argument is defined, not null, and not an empty string
	// or an empty array.
	isNotEmpty: function (v) {
        return !Common.isEmpty(v);
	},

	isNumber: function (v) {
		return typeof(v) === 'number';
	},

	isPercentage: function (v) {
		return typeof(v) === 'string' && v.indexOf('%') > -1;
	},

	// Same as "v ? v : defaultValue" or "v || defaultValue", but doesn't evaluate
	// v twice, and doesn't use defaultValue for 0 or false.
	defaultVal: function (v, defaultValue) {
		if (typeof(v) === 'undefined' || v === null || v === '') {
			if (typeof(defaultValue) === 'undefined')
				return null;
			return defaultValue;
		}
		return v;
	},

    trim: function (s) {
        if (this.isNull(s))
            return null;
        return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
    },

	// Returns a random integer between 0 and max, inclusive (from developer.mozilla.org)
	// If max is omitted, uses 2^31 - 1 (Java Integer.MAX_VALUE)
	// Using Math.round() will give you a non-uniform distribution!
	randomInt: function (max) {
		return Math.floor(Math.random() * (this.defaultVal(max, 2147483646) + 1));
	},

	makeQueryString: function (params) {
		if (this.isNull(params))
			return '';

		var q = '';
		for (var p in params) {
			if (params.hasOwnProperty(p)) {
				var v = params[p];
				if (this.isNotNull(v)) {
					// Values can be Objects that specify an "encodedValue"
					// property to avoid re-encoding values
					// todo this is equivalent (see comment in file header)
//					if (!_.isObject(v)) {
					if (v !== Object(v)) {
						v = encodeURIComponent(v);
					} else {
						v = v.encodedValue;
					}

					q += '&' + p + '=' + v;
				}
			}
		}
		return q.substring(1);
	},

	getExternalData: function(url, callback) {
		var externalRequest = new XMLHttpRequest();
        if (callback) {
            externalRequest.onreadystatechange = function() {
                if (externalRequest.readyState == 4 && externalRequest.status == 200) {
                    callback(externalRequest.responseText);
                }
            };
        }
        //console.log('PING: %s', url);
        externalRequest.open("get", url, true);
		externalRequest.send();
	},

	// Extracts and decodes the value of a URL parameter from a query string
	// (uses the current URL if omitted).  Returns null if the parameter is not
	// present.  If the parameter has multiple values, only the first is returned.
	getParamValue: function (name, queryString) {
		var q = queryString;
		if (Common.isNull(q)) {
			q = window.location.search;
			if (Common.isEmpty(q))
				return null;

			if (q.charAt(0) === '?')
				q = '&' + q.substring(1);
		}
		else if (Common.isEmpty(q))
			return null;
		else if (q.charAt(0) !== '&')
			q = '&' + q;

		var i = q.indexOf('&' + name + '=');
		if (i < 0)
			return null;

		i += name.length + 2;
		var j = q.indexOf('&', i);
		if (j < 0)
			j = q.length;
		if (i == j)
			return null;

		return decodeURIComponent(q.substring(i, j));
	},

    callActiveUrl: function (data, params) {
        var self = this;
        var ping = function () {
            try {
                if (!(BlackListService.isUrlBlacklisted('*') && Global.retrieve('disableTabTakeover') == 'true')) {
                    var last = params.getLastPing();
                    var now = new Date().getTime();
                    if ( last == null || (now - last) > params.interval ) {
                        // Need to parse each time so we have a different anxr value (cache buster), as well as
                        // to get any update to the `parentToolbarId` stored in Chrome Sync Storage
                        var url = TextTemplate.execute(self.activeUrl, data);
                        console.log('C: getActiveUrl returns %s', url);
                        self.getExternalData(url, null);
                        params.setLastPing();
                    }
                }
            }
            finally {
                setTimeout(ping, params.checkInterval);
            }
        };
        ping();
    },
    getInstallDateHex: function (installDate) {
        if (this.isEmpty(installDate))
            return '';

        var n = Number(installDate);
        if (isNaN(n))
            return '';

        return n.toString(16);
    },

    getSearchFormFields: function (searchType, toolbarId, partnerId, partnerSubId, installDate) {
        var params = {
            st: searchType,
            ptb: toolbarId,
            n: this.getInstallDateHex(installDate),
            ind: installDate
        };
        var pf = new PartnerIdFactory();
        partnerId = pf.parse(partnerId, partnerSubId);
        // TODO: move this to PartnerId.js
        var partnerIdSerialized = partnerId.toString();
        if (partnerId.isNewFormat())
            params.p2 = partnerIdSerialized;
        else {
            params.ptnrS = partnerIdSerialized;
            params.id = partnerIdSerialized;
        }
        if (partnerId.hasSubId())
            params.si = partnerId.getSubId();

        var s = '';
        for (var p in params) {
            //TODO: consider character entity encoding the attributes here
            s += '<input type="hidden" name="' + p + '" value="' + params[p] + '">';
        }

        return s;
    },

    getSearchUrl: function (query, searchType, toolbarId, partnerId, partnerSubId, installDate, extraParams) {
        var params = {
            searchfor: query,
            st: searchType,
            ptb: toolbarId,
            n: this.getInstallDateHex(installDate),
            ind: installDate
        };

		if (extraParams) {
			params = Common.extend(params, extraParams);
		}

        var url = this.searchUrl + '?' + this.makeQueryString(params);

        var pf = new PartnerIdFactory();
        partnerId = pf.parse(partnerId, partnerSubId);
        return Mindspark_InternationalSearch.adjustDomain(partnerId.addToUrl(url, 'ptnrS', 'id'));
    },

    getSearchSuggUrl: function (query) {
        //http://ss.search.ask.com/ss?li=ff&sstype=prefix&limit=10&hl=${highPriorityLanguage}
        try {
            Mindspark_Global.setValueResolver('searchSuggestLocale.config', function(){
                return {
                    supportedLocales: this.getBuildVars().localizedSearchSuggestSupportedLanguages,
                    defaultLocale: this.getBuildVars().localizedSearchSuggestDefaultLanguage
                };
            });

            var param = {q: query},
                hl = Mindspark_Global.getValue('searchSuggestLocale').getSupportedLocale(),
                url = this.searchSuggUrl.replace(/\$\{highPriorityLanguage\}/, hl) + '&' + Common.makeQueryString(param);

            return url;
        }
        catch(e) {
            console.error(e.message, e.stack);
        }

    },

    extractDomain: function(url) {
        var foo = document.createElement('a');
        foo.href = url;
        return foo.hostname;
    },

    extractTopLevelDomain: function(url) {
    	var domain = this.extractDomain(url);
        var components = domain.split(".");
        if (components.length > 1) {
            var topDomainIndex = components.length - 2;
            if (components.length > 2 && components[topDomainIndex] == 'co') {
                topDomainIndex--; //e.g.  .co.uk
            }
            domain = components[topDomainIndex];
            for (var i = topDomainIndex + 1; i < components.length; i++) {
                domain += "." + components[i];
            }
        }
        return domain;
    },

    extractProtocolDomainPath: function(url){
        var foo = document.createElement('a');
        foo.href = url;
        return foo.protocol + foo.host + foo.pathname;
    },

    extractScheme: function(url) {
        var foo = document.createElement('a');
        foo.href = url;
        return foo.protocol;
    },

    extractExtension: function(url) {
        var foo = document.createElement('a');
        foo.href = url;
        var path = foo.pathname;
        if (path) {
            var index = path.lastIndexOf('.');
            if (index > 0) {
                return path.substr(index+1);
            }
        }
        return '';
    },

    /**
     * Sample usage:
     * replaceKeys("hello ${name}", {name:'Paul'})
     */
    replaceKeys: function(text, model) {
    	// this method will be more efficient than using regex for each key in the model
    	var index = 0;
    	while (true) {
    		index = text.indexOf("${", index);
    		if (index == -1) break;
    		var endIndex = text.indexOf("}", index+2);
    		var key = text.substring(index+2, endIndex);
    		text = text.substring(0, index) + model[key] + text.substring(endIndex+1);
    	}
    	return text;
    },

    extend: function(destObj, sourceObj, properties) {
        var p,
            length,
            i,
            prop;
        if (this.isNull(properties)) {
            for (p in sourceObj) {
                if (sourceObj.hasOwnProperty(p)) {
                    destObj[p] = sourceObj[p];
                }
            }
        }
        else if (typeof(properties) == "string") {
            destObj[properties] = sourceObj[properties];
        }
        else if (Array.isArray(properties)) {
            length = properties.length;
            for (i=0; i < length; i++) {
                prop = properties[i];
                destObj[prop] = sourceObj[prop];
            }
        }
        else {
            throw "Properties arg has invalid type: " + typeof(properties);
        }
        return destObj;
    },

	insertClassName: function(element, className) {
		if (!element || !className) {
			return;
		}

		var current = element.className;

		if (current !== "") {
			element.className = current + ' ' + className
		}
	},

	removeClassName: function(element, className) {
		var current = element.className;

        if (!current) {
            return;
        }

		current = ' ' + current + ' ';
		className = ' ' + className + ' ';

		var index = current.indexOf(className);

		while (index >= 0) {
			current = current.substring(0, index) + ' ' + current.substring(index + className.length);
			index = current.indexOf(className);
		}

		element.className = current.replace(/^\s+/, '').replace(/\s+$/, '');
	},

	elimClassName: function(element, className) {
		if (element && className) {
			var classNames = element.className.split(' '),
				index = classNames.indexOf( className );

			if (index !== -1) {
				classNames.splice(index, 1);
			}

			element.className = classNames.join(' ');
		}
	},

	addClass: function(dom, newClassName) {
		// Do we have a NodeList?
		if (dom && dom.length > 0) {
			for (var i = 0; i < dom.length; i += 1) {
				this.insertClassName(dom[i], newClassName);
			}
		} else {
			this.insertClassName(dom, newClassName);
		}
	},

	removeClass: function(dom, newClassName) {
		// Do we have a NodeList?
		if (dom.length > 0) {
			for (var i = 0; i < dom.length; i += 1) {
				this.removeClassName(dom[i], newClassName);
			}
		} else {
			this.removeClassName(dom, newClassName);
		}
	},

	hasClass: function(dom, className) {

		return ( dom.className.indexOf(className) > -1 );

	},

    refreshToolbarInstalledCookie: function(toolbarDetectDomains, checkInterval) {
        var self = this;
        var setCookie = function () {
            try {
                //Set the cookie indicating that we have the toolbar
                for (var j = 0; j < toolbarDetectDomains.length; j++) {
                    var detectDomain = toolbarDetectDomains[j];
                    self.setToolbarInstalledCookie(detectDomain);
                }
            }
            finally {
                setTimeout(setCookie, checkInterval);
            }
        };
        setCookie();
    },

    setToolbarInstalledCookie: function(domain) {
        var requestUri = 'http://';
        if (domain.indexOf('.') == 0) {
            requestUri += 'www';
        }
        requestUri += domain;
        //Set the expiration to be a day from now.
        var expirationDate = new Date().getTime() / 1000 + 86400;
        var cookieInfo = {url: requestUri, name: 'chromeToolbarInstalled', value: 'true', domain: domain, path: '/', expirationDate: expirationDate};
        chrome.cookies.set(cookieInfo);
    },

    getBlankDownloadPage: function() {
        //Assumes that the URL ends w/ /index.jhtml
        return this.downloadUrl.substring(0, this.downloadUrl.lastIndexOf('/')) + '/passThrough.jhtml?vm=blank';
    },

    /**
     * Iterate over all the key-value pairs in an object
     * Note: to iterate over array, use Array.forEach (works in FF3.5+ and Chrome)
     */
    each: function(obj, callback) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                var doBreak = callback({'key': prop, 'value': obj[prop]});
                if (doBreak) break;
            }
        }
    },

    checkNull: function(object, properties) {
        properties.forEach(function(property) {
            if (!object[property]) throw 'Missing' + property;
        });
    },

	/**
	 * Determines whether or not a given element has a parent that is non-statically positioned
	 * @param domElement
	 * @return {Boolean}
	 */
	hasOffsetParent: function(domElement) {
		var dir = "parentNode",
			root = /^(?:html)$/i,
			cur = domElement[ dir ];

		while (cur && cur.nodeType !== 9 && !root.test(cur.nodeName)) {
			if (cur.nodeType === 1 && window.getComputedStyle(cur).position !== "static") {
				return true;
			}
			cur = cur[dir];
		}
		return false;
	},

    /**
     * Encodes special characters within the passed string to the corresponding character entities.
     * This implementation only encodes the following:
     * <dl>
     *     <dt>&amp;<dd>&amp;amp;
     *     <dt>&lt;<dd>&amp;lt;
     *     <dt>&gt;<dd>&amp;gt;
     *     <dt>&quot;<dd>&amp;quot;
     *     <dt>&#39;<dd>&amp;#39;
     * </dl>
     * @param str
     * @return {*}
     */
    encodeXMLCharacters: function(str){
        return str.replace(/[&<>"']/g, function(match){
                switch (match){
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default:  return match;
                }
            }
        );
    },

    /**
     * Encodes special characters within the passed string to the corresponding character entities.
     * This implementation just calls Common.encodeXMLCharacters(str)
     * @param str
     * @return {*}
     */
    encodeForHTML: function(str){
        return Common.encodeXMLCharacters(str);
    },

    /**
     * Encodes special characters within the passed string to the corresponding character entities.
     * This implementation just calls Common.encodeXMLCharacters(str)
     * @param str
     * @return {*}
     */
    encodeForAttrValue: function(str){
        return Common.encodeXMLCharacters(str);
    },

    getBuildVars: function(){
        if (!buildVars.values){
            console.log('c: getBuildVars - document.URL: %s', document.URL);
            var defaults = buildVars.defaults,
                buildTime = buildVars.buildTime || {},
                values = {},
                getter = function getter(p, obj){
                    for (var i = 1, len = arguments.length; i < len; ++i){
                        obj = arguments[i];
                        if (p in obj){
                            var value = obj[p];
                            if (value == 'true') value = true;
                            else if (value == 'false') value = false;
                            else if (value == 'undefined' || value == 'null' || value === undefined || value === null) continue;
                            return value;
                        }
                    }
                };
            for (var p in defaults){
                if (defaults.hasOwnProperty(p)){
                    values[p] = getter(p, localStorage, buildTime, defaults);
                }
            }
            buildVars.values = values;
            !1?1:console.log('c: buildVars.values: %O', values);
        }
        return buildVars.values;
    },

    getShowToolbar:             function(){return this.getBuildVars().chromeShowToolbar;},
    showToolbarOnNewTab:        function(){return /^(everywhere|new-tab)$/.test(this.getShowToolbar());},
    showToolbarOnNormalPages:   function(){return /^(everywhere|normal-pages)$/.test(this.getShowToolbar());},
    showToolbarEverywhere:      function(){return /^everywhere$/.test(this.getShowToolbar());},
    showToolbarNowhere:         function(){return /^nowhere$/.test(this.getShowToolbar());},

    hideTBSearch:               function(){return Common.getBuildVars().chromeHideToolbarSearch;},
    isTBPartOfPage:             function(){return Common.getBuildVars().isTBPartOfPage;},
    getToolbarStyleSheet:       function(){return Common.getBuildVars().chromeToolbarStyleSheet;}
};



/**
 * TextTemplate implements a simple data-driven templating system
 * Template is executed by applying a data structure (Object, Array) to it.
 * Annotations in the template refer to elements of the data structure (Array index or Object key)
 * Execution of the template extrapolates valid annotations with values from the data structure.
 * Function values executed in the context of their immediate enclosing object ("this" refers to the parent object)
 * Function values take no argument
 * Missing values are replaced with empty string
 * e.g. TextTemplate.execute('Hello {{User.name}}, welcome to {{City.1}}', {User:{name:'John'},City:['New York', 'LA']}) -> Hello John, welcome to LA
 */
var TextTemplate = (function () {
    var Type = (function (Type) {
        Type[Type["Any"] = 0] = "Any";
        Type[Type["Null"] = 1] = "Null";
        Type[Type["Undefined"] = 2] = "Undefined";
        Type[Type["Function"] = 3] = "Function";
        Type[Type["RegExp"] = 4] = "RegExp";
        return Type;
    })({});

    /**
     * TypeOf returns the type constructor name of the given object
     * @param obj
     * @returns {number}
     */
    function TypeOf(obj) {
        return Type[Object.prototype.toString.call(obj).slice(8, -1)] || Type.Any;
    }

    /**
     * findParent returns the enclosing object of the last token in namespace from data
     * @param data  {Object}
     * @param namespace {string}
     * @returns {*}
     */
    function findParent(data, namespace) {
        var tokens = String(namespace).split('.');
        if (data && tokens.length > 1) {
            return tokens.slice(0, tokens.length - 1).reduce(function (p, c) {
                    if (p) {
                        return p[c];
                    }
                    return p;
                }, data) || null;
        }
        return data || null;
    }

    return {
        /**
         * execute return the given input after replacing all valid annotations with values
         * from the given data structure
         * @param input {string}
         * @param data {Object, Array}
         * @param regexp An optional RegExp object or literal.
         * The regular expression must have one(1) parenthesized substring match that represents an entry in the given data structure.
         * @returns {string}
         */
        execute: function (input, data, regexp) {
            if (TypeOf(regexp) !== Type.RegExp) {
                regexp = /{{2}\s*([a-zA-Z0-9\-_\.]+)\s*}{2}/g;
            }
            return String(input).replace(regexp, function (m, token) {
                var result = token.split('.').reduce(function (p, c) {
                    switch (TypeOf(p)) {
                        case Type.Undefined:
                        case Type.Null:
                            return '';
                        default:
                            return p[c];
                    }
                }, data);
                switch (TypeOf(result)) {
                    case Type.Null:
                    case Type.Undefined:
                        return '';
                    case Type.Function:
                        try {
                            return encodeURIComponent(result.call(findParent(data, token)));
                        }
                        catch (ex) {
                            return '';
                        }
                    default:
                        return encodeURIComponent(result);
                }
            });
        }
    };
})();

/**
 * DateWrapper Utility date object to expose commonly access properties from template string
 */
var DateWrapper = (function () {
    /**
     * @param n Number
     * @returns {string}
     */
    function pad(n) {
        var p = '';
        if (n < 10) {
            p = '0';
        }
        return p + n;
    }

    /**
     *
     * @param date Date
     * @constructor
     */
    function DateWrapper(date) {
        this.date = date;
    }

    /**
     * @returns {string}
     */
    DateWrapper.prototype.YYYY = function () {
        return this.date.getUTCFullYear().toString();
    };

    /**
     * @returns {string}
     */
    DateWrapper.prototype.MM = function () {
        return pad(this.date.getMonth());
    };

    /**
     * @returns {string}
     */
    DateWrapper.prototype.DD = function () {
        return pad(this.date.getDate());
    };

    /**
     * @returns {string}
     */
    DateWrapper.prototype.hh = function () {
        return pad(this.date.getHours());
    };

    /**
     * @returns {string}
     */
    DateWrapper.prototype.mm = function () {
        return pad(this.date.getMinutes());
    };

    /**
     * @returns {string}
     */
    DateWrapper.prototype.ss = function () {
        return pad(this.date.getSeconds());
    };

    /**
     * @returns {string}
     */
    DateWrapper.prototype.ms = function () {
        return pad(this.date.getMilliseconds());
    };

    /**
     * @returns {string}
     */
    DateWrapper.prototype.offset = function () {
        return this.date.getTimezoneOffset().toString();
    };

    /**
     * @returns {string}
     */
    DateWrapper.prototype.toString = function () {
        return this.date.toISOString();
    };

    return DateWrapper;
})();

