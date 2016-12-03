(function(){
    var UL_QUEUE_NAME = 'newtab/offline';
    var NUCLEAR = {external : 'http://search.tb.ask.com',
					internal : 'spentK.html'};

    var url = localStorage.getItem('newtab/url') || Common.newTabURL || NUCLEAR.external;
    var offLineArr = [];
    var offLineArrStr = localStorage.getItem(UL_QUEUE_NAME);
    var ts = new Date();
    var urlStr = localStorage.getItem('newtab/url');
    var URL_RE = /^http(s?)\:\/\/.*/;


    function UL(type,date){
        var d = new Date(date);
        if(typeof type != 'string'){
            throw 'uLinvalidType';
        } else if(!(d instanceof Date)) {
            throw 'uLinvalidDate';
        }
        var obj = {
            "type" : type,
            "date" : date
        };
        return obj;
    }
    window.Mindspark_ = window.Mindspark_ || {};
    window.Mindspark_.UL=UL;
    window.Mindspark_.offLineArr = offLineArr;
    window.Mindspark_.fireUL = fireUL;
    //Copied from Toolbar.js
    var toolbarInfo = {
        toolbarId: Global.getToolbarId(),
        partnerId: Global.getPartnerId(),
        partnerSubId: Global.getPartnerSubId(),
        installDate: Global.getInstallDate(),
        installTimestamp: Global.getInstallTimestamp(),
        toolbarBuildDate: config.buildDate,
        toolbarVersion: config.version
    };
    Mindspark_.shared.unifiedLogging.init({
        toolbarData: toolbarInfo,
        toolbarConfig: config,
        eventUrl: Common.unifiedLoggingPixelUrl,
        localStorageMechanism: {
            get: function(key) {
                return Global.retrieve(key);
            },
            set: function(key, value) {
                return Global.store(key, value);
            }
        },
        excludeButtonTypes: [
            'SearchBox',
            'EditFeaturesButton'
        ]
    });
    
    function fireUL(arr){
        if(!arr){
            throw new Error('fireULInvalidArray');
        }
        Mindspark_.shared.unifiedLogging.logCapNativeEvent(
            "OffLineEvents",
            {
                "events" : JSON.stringify(arr)
            }
        );
        
    };
    function isValidUrl(url){
        //requirements
        //must contain a '.' or a 'localhost'
        //If this is invoked, you have all failed me.

        var testRE = /(.+\..+|localhost)/;
        return testRE.test(url);
        

    }
	
	function getValidUrl(testUrl){
		if (!isValidUrl(testUrl)){
	        console.log('Creating UL for complete URL failure');
	        offLineArr.push(UL('URL_FAILURE', ts));
	        try{
	            testUrl = chrome.extension.getURL(NUCLEAR.internal);
	        } catch(e){
	            testUrl = NUCLEAR.external;
	        }
		}
		return testUrl;
	}

    function reroute(k){
		url = getValidUrl(url);
        if(!k){
            console.warn('c: trying again to %s', url);
            cache(null,true)
        }
        else{
            console.warn('c: No XHR capabilities redirecting to: %s', url);
            window.location=url;
        }
    }

    function cache(rendered, kill){
        function hasContent(str){
            if(!str || str.length ==0)
                return false;
            if(str.indexOf('<') > -1 && str.indexOf('>') == -1)
                return false;

            return true;
        }
        console.log('c: cache(%s)', rendered);
        
        console.log('c: url: %s', url);
        var x = new XMLHttpRequest();
        x.onreadystatechange = function(){
            if (x.readyState === 4 && x.status === 200){
                if(!hasContent(x.responseText)){
                    reroute(kill);
                }
                localStorage.setItem('newtab/html', x.responseText);
                if(!rendered)
                    pass(rendered);
            }else if (x.readyState === 4){
                console.log('c: html fetch failed with state: %s and status code: %s', x.readyState, x.status);
                reroute(kill);
            }
        };
        x.open("GET", url, false);
        try{
            x.send();
        }catch (e){
            console.warn('c: caught: %s while attempting to get %s', e, url);
            console.dir(e);
            reroute(kill);
        }
        console.log('c: cache returns');
    }
    function pass(r){
        console.log('c: pass(%s)', r);
        var str = localStorage.getItem('newtab/html') || '';
        if (r){
            //nop
        }else if(!str){
            cache();
        }else{
            document.body.innerHTML+=(str + '<script type="text/javascript" src="newTabContentScript.js"></script>');
            cache(true);
            r=true;
        }
        console.log('c: %s', r?"already rendered":'no it wasnt');
    }

    var dom = {
        setStyle: function setStyle(e, obj){
            for (var p in obj){
                if (obj.hasOwnProperty(p))e.style[p] = obj[p];
            }
        },
        setAttributes: function setAttributes(e, obj){
            for (var p in obj){
                if (obj.hasOwnProperty(p))e.setAttribute(p, obj[p]);
            }
        },
        addListeners: function addListeners(e, obj){
            for (var p in obj){
                if (obj.hasOwnProperty(p))e.addEventListener(p, obj[p]);
            }
        },
        addChildren: function addChildren(e, array, doc){
            if (array){
                for (var i = 0, len = array.length; i < len; ++i){
                    e.appendChild(dom.createElement(array[i], doc));
                }
            }
        },
        createElement: function createElement(obj, doc){
            var e = (doc || document).createElement(obj.n);
            dom.setStyle(e, obj.s);
            dom.setAttributes(e, obj.a);
            if (obj.t){
                e.appendChild((doc || document).createTextNode(obj.t));
            }
            if (obj.h){
                e.innerHTML += obj.h;
            }
            if (obj.id){
                e.setAttribute('id', obj.id);
            }
            dom.addListeners(e, obj.l);
            dom.addChildren(e, obj.c, doc);
            return e;
        }
    };

    function promptForNewTabSettings(){
        document.body.appendChild(dom.createElement({
            n: 'div',
            s: {
                margin: 'auto',
                width: '400px'
            },
            c: [
                {n: 'h1', t: 'Please Configure Defaults'},
                {n: 'img', a: {src: 'http://lorempixel.com/400/200/cats'}},
                {n: 'form',
                    c: [
                        {
                            n: 'label', t: 'New Tab URL', s: {display: 'block'},
                            c: [{n: 'input', id: 'url', a: {type: 'text'}}]
                        },
                        {
                            n: 'label', t: 'Caching?', s: {display: 'block'},
                            c: [{n: 'input', id: 'cached', a: {type: 'checkbox', checked: true}}]
                        },
                        {
                            n: 'button', t: 'Submit',
                            l: {
                                click: function (e) {
                                    var u = document.querySelector('#url').value,
                                        c = document.querySelector('#cached').checked;
                                    if (u.indexOf(':\/\/') > -1) {
                                        localStorage.setItem('newtab/cache', c);
                                        localStorage.setItem('newtab/url', u);
                                        window.location.reload();
                                    }else{
                                        alert("Invalid URL");
                                        e.preventDefault();
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        }));
    }

   if(offLineArrStr){
        offLineArr = JSON.parse(offLineArrStr);
        if(!(offLineArr instanceof Array) && offLineArr.length)
            offLineArr = [].slice.call(offLineArr);
        if(!(offLineArr instanceof Array))
            offLineArr = [];
    }

    if(!URL_RE.test(urlStr)){
        console.log('Creating UL for DLP failure');
        offLineArr.push(UL('NO_DLP_URL_FOR_NEWTAB', ts));
    }
    if(!URL_RE.test(Common.newTabURL)){
        console.log('Creating UL for Vicinio failure');
        offLineArr.push(UL('NO_CONFIG_URL_FOR_NEWTAB', ts));
    }

	url = getValidUrl(url);
    
    if(navigator.onLine){
        if(offLineArr.length>0){
            try{
                fireUL(offLineArr);
                offLineArr =[];
            } catch (err){
                console.log('fireUL failed');                
                offLineArr.push( UL('ULFailedToSend' , ts));
                offLineArr.push( UL(err.message , ts));
                offLineArr.push( UL('newTabOpenedOffline' , ts));
            }
        }       
    } else {
        //Queue up an offline event;
        offLineArr.push( UL('newTabOpenedOffline', ts));
    }

    localStorage.setItem(UL_QUEUE_NAME, JSON.stringify(offLineArr));

    if(localStorage.getItem('newtab/cache') == 'true'){
        pass();
    }else{      
		var newTabUrl = localStorage.getItem('newtab/url');
        if(newTabUrl == null || newTabUrl == 'null'){
            if(localStorage.getItem('devMode') == 'true'){
                promptForNewTabSettings();
            } else {
                console.warn('c: Not Dev Mode, redirecting to: %s', NUCLEAR.external);
                window.location=NUCLEAR.external;
            }
        }else if (navigator.onLine){
            console.warn('c: no cache, iframe.src: %s', url);
            chrome.management.getSelf(function (info) {
                url += (url.indexOf('?') >-1? '&' : '?') + 'id=' + info.id;
                var iframe = dom.createElement({
                    n: 'iframe',
                    s: {position: 'absolute', left: 0, width: '100%', top: 0, height: '100%'},
                    a: {frameborder: 0, src: url}
                });
                document.body.appendChild(iframe);
                iframe.addEventListener('load', function (e) {
                    var target = this.contentWindow;
                    var chromeVersion = (/Chrome\/([0-9\.]+)/.exec(window.navigator.userAgent) || [])[1];
                    info.platform = {
                        version: chromeVersion,
                        name: 'Chrome',
                        vendor: window.navigator.vendor
                    };
                    console.log('TT: TOOLBAR INFO: ', info);
                    WebTooltabAPI.init(info, target, url);
                }, true);
            });
        }else{ // !onLine
            //document.body.appendChild(dom.createElement({n: 'h1', t: 'Not connected to the internet!', s: {'text-align': 'center'}}));
            document.body.appendChild(dom.createElement({
                n: 'div',
                s: {width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, 'background-color': '#dddddd', 'text-align': 'center', display: 'table'},
                c: [
                    {
                        n: 'div', s: {display: 'table-row'},
                        c: [
                            {
                                n: 'span', s: {color: '#535353', display: 'table-cell', 'vertical-align': 'bottom', 'font-size': '14pt'},
                                t: 'Please connect to the Internet to enable page functionality.'
                            }
                        ]
                    },
                    {
                        n: 'div', s: {display: 'table-row'},
                        c: [
                            {
                                n: 'span',
                                s: {display: 'table-cell', 'vertical-align': 'bottom', 'padding-bottom': '24px'},
                                c: [
                                    {
                                        n: 'span',
                                        s: {'text-transform': 'capitalize', 'text-decoration': 'none', color: 'black', 'font-size': '10pt'},
                                        h: 'TM, &reg; + &copy; ' + new Date().getFullYear() + ' ' + Common.companyName
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }));
        }
    }

})();



/*(function init(){
    Object.prototype.extend = Object.prototype.extend || function(obj){
        if(typeof obj == 'object'){
            for(var key in obj){
                if(obj.hasOwnProperty(key)){
                    this[key] = obj[key];
                }
            }
        }
        return this;
    }

    var url = localStorage.getItem('newtab/url');
    var frame = document.querySelector('iframe');
    frame.setAttribute('src', url);
    frame.style.extend({
        height : '100%',
        width : '100%',
        position : 'absolute',
        top: '0',
        left : '0',

    });
    document.body.style.extend({
        overflow:'hidden'
    })
})();*/
