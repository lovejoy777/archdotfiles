//nsole.dir(chrome);

var CE = (function(){
	//var chrome = window.chrome;

    var StubConsole = function(){},
        stubFunction = function(){};
    for (var key in console){StubConsole.prototype[key] = stubFunction;}

    var console1 = console,
        console2 = new StubConsole();

	HTMLElement.prototype.setAttributes = function setA(obj){
        for(var key in obj)
            this.setAttribute(key,obj[key])
    };

    var acb = function(){
        console2.log('ce: search-box attached');
        // an instance of the element is created

        //wrapper
        var form = document.createElement('form');

        //parts
        var search = document.createElement('input');
        var submit = document.createElement('input');
        var sgpane = document.createElement('div');
        var sgbody = document.createElement('div');
        var script = document.createElement('script');
        var idString = this.getAttribute('search-form-id') || "frmSearch";


        //variables
        var acA = this.getAttribute('autocomplete') || 'off';

        var ac = acA.toLowerCase() == 'on' ? 'on' : 'off';

        //attributes
        search.setAttributes({
            "id"			: "searchfor",
            "name"			: "searchfor",
            "autocomplete"	: ac,
            "value"			: "",
            "type"			: "text"
        });

        submit.setAttributes({
            "id"			: "submitSearch",
            //"name"			: "searchfor",
            "autocomplete"	: ac,
            "value"			: "",
            "type"			: "submit"
        });

        sgpane.setAttributes({
            "id"            : "sgpane"
        });

        sgbody.setAttributes({
            "id"            : "sgbody"
        });

        script.setAttributes({
            "type"          : "text/javascript",
            "src"           : "native/ss.js"
        });



        //join
        form.appendChild(search);
        form.appendChild(submit);
        form.appendChild(sgpane);
        sgpane.appendChild(sgbody);
        form.appendChild(script);


        //append
        this.appendChild(form);
        this.style.display='block';
        search.focus();





    };

    function extend(base, modifier){
        for(var key in modifier)
            base[key] = modifier[key];
    }

    /*var stretch = function(){
        var w = $("search-box").width();
        var cW = 0
        $("search-box").children().each(function(){
            cW += $(this).width();
        })
        w = w + $("search-box input[type='text']").width(); - cW;
        $("search-box input[type='text']").width(w);
    }
    stretch();*/

    var sbProto = Object.create(HTMLElement.prototype);

    sbProto.attachedCallback = acb;

    var searchBox = document.registerElement('search-box', {prototype : sbProto});

    var chromeTSProto = Object.create(HTMLElement.prototype);

    chromeTSProto.attachedCallback = function(){
        var proto = this;

        //do stuff
        function mV(title,url){
            this.title = title;
            this.url =url;
            return this;
        };
        function flub(){
            var arr=[];
            arr[0] = new mV('Vimeo','www.vimeo.com');
            arr[1] = new mV('College Humor','www.collegehumor.com');
            arr[2] = new mV('Ask','www.ask.com');
            arr[3] = new mV('Google','www.google.com');
            //arr[4] = new mV('Google','www.google.com');

            return arr;
        };

        var flubImages = [
            //Vimeo
            "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABZUlEQVQ4jZ1QO0/CYBQ9/aAKMQVpjAlC1M1oHEnAQRMWEnV0YRZ/gqsOzA7+AWcdZHHQqCuJGF1IDOpgXKCgJPISobZcHAifrUVDPdN9nXPvuULwpLjKRHbAGPPDBoioSBolhOmzF8Uu2SjC7JADLmbKGWN+U0VyCjgMefEcm8DO3Bivb0yNIhuVkV6RkY3KCPvEb5F+MC85cLo0jojca27OuPnWvUUJHrE36hEZn+ECARfDUciLoNthOjHsExGRReTq+q+2GAAU2oTkYxPxm5qpGXQzpBQV65mqqZ5vdawWUoqK64pm2rYgOfkPjOSUoloF+jhW2jyOTY5AcgrYNTw0+dC0WjAiU9EMFhxIL/v4Ay9eVVyWP/8WuG90UNeI531yrq5j++7957hVoLfJvCXf6iB+W0ND7w4nsP/0wa/IvGlYu6oOJAOAMHteHtwZEoyIiv8lE1GJkU5bRFSyT+4WSKfEF7Z4h3s9ocRvAAAAAElFTkSuQmCC",
            //College Humor
            "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACAUlEQVQ4jZ3Rv2sTcRjH8Xcul7ucTWISa37QNJJRIYIUXOzSJZP4B7i5uTg410ld3BSqqxYpLhUcFEEQkUJtwaD4q9XYak2TNE1iyCV3l/QuF4fgxVADpc/4PM/3xfPh69q4kulhdzlUCW5E7C52xzjce1lBPMhir9dDnDyFEAjTUytY29+c2RCgpKcRg+OYlQLBzEXa+RzuUJTc4kNOXprFn0yxfu8m+qcsgaB/GHApfuKXr2PpOnQ0pGgCX/osAOaDObTtn/iTKfaaKrulGp32HpFkAuEvEDh3HkGSeXfjKmI4CkBpZQmArq6hRCcA6NSqADTqTQqb+QEwNjXTH3x4Q6vwC4B2ZWcQLxoHwCjlnZ7ebA0A0R/EqFWxjRbFF0/YWX6FVSsBYGlNJF8/s3TsOJGZCw7iAC7Zixw4itsfYuvRXbYe38dlmwCkr90BwDZNYtMZTK25/xcESUbweDhzax7fZApcUHy+iG2aWC21n19tsH579t+PG1xgbK4BMH56Cm8ojDcYxhtL0tj4Svn1M0aVA7Rz74cGtmli7JboNOoIHony6hI/Fub2AU4EPfeRyttlqisvaXxfQ/2cxTZazmLx6cJ/L3CAvVwW7csq1fJvtKY+8uSREQA8HpF4IsLEiRiSLB0IEBHcCLIy1ByTFY6EQqh1lWqhTNeyRgJ/APROwnCLUovJAAAAAElFTkSuQmCC",
            //Ask
            "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABcElEQVQ4jc1SUWrCQBQcLaQIBUOhUCjUCP2teoS9gOANjCdQL6B4AsUDGC8g6AlMLuCKUCiINRZBsEQiKSkWZPrltlHpb/vgfex7OzMPZoB/WcFwyIVp8skwKIGT9iyLZ4GhlJwKcRY00XUGjqPeUyGiJJ5lqeWyWj0hmgpBkpHZslJh/AB+LZUU2U25DM0wIgJXQuBzsYjMNt0u4qGUEfC1aUJLpaAZBhKZDB4cB3etFhLZLPabDR59H8lCAQCw933gpVCInLVzXe5cl6t6nf5gwJ3rUgIMx2OSZGDbkf/xbb//rV4s4kLXse31gFgM214PWiqF21oNiWwWAPAxGkWuxbH6oQLb5iyfZyilmnmdjrpIAtzN58RE1ykBLkyTJDnL57luNhnYNkkqwKrR4CSZVO6oLKzqdUqAb+02163W2Qwc5+FnkGIAMBWC77b9WziVlfeWhct0Onay9CyLx45IgM+5HJeVCkMpz8f3z+sLGZ45rY6b+YkAAAAASUVORK5CYII=",
            //Google
            "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABlUlEQVQ4jZ2TP2uTURSHn/ve+4YSleokGbQU/+HQUqui0ZaSDEIUirg56NI6uEn1I7RLv0MElWwBUbO4CVk0JQmoQwTjoiZBi7YkmrQ37z1dpDbkhTY924Xze875nXOPmllaT3mi00oRY4AQoe5UMOftRwygFDFPdNqEiT0FNy/4eAqunNaMHdO8LFrefg5Y+RL0QsLo95IRtAfZguVRpkOl5jh8QPWIt4uFAVLjhl8tAcAJ5MqW+CkTaiUU4ATGj+vtd2NdaKy5vQOe5C3XxgyXTmgODSkSZw3LuY29A14ULQ+etYkd8Xi+EOXD14BKbYAOAD7VHbmSpdkWZicNw1EVmqeSS/+mtSMun9RMjGhWW0I0ArOTPn82hIeZDqvN3vS+Dm7HfW5d9Em/2ST7zvI0b7n/uI0TuDsd2d3C9QlDoRpgd6z8Z1N4VeoSCdlkH6D6w3HjnOHo8H/PRsP5UU2u3N19BgeHFHeu+kydMaz9FWq/HR0Lr993+fit/yeqxGKrtp9jAhCh4SHBvAiNwdV8R4K5Le1xlvOY9nnhAAAAAElFTkSuQmCC"
        ];



        var chrome = window.chrome;
        if (!chrome) chrome = {};
        if (!chrome.topSites) chrome.topSites = {};
        if (!chrome.topSites.get) chrome.topSites.get = function(cb){console.log("ce: Faking topSites");cb(flub())};

        chrome.topSites.get(next);
        function next(arr){
            var topSites = arr.length > 3 ? arr.slice(0,4) : flub();
            var imgArray;
            //in extension
            if(chrome.history){
                imgArray = [];
                for(var index in arr){
                    if(index*1 > -1&& arr[index].url)
                        imgArray.push("chrome://favicon/"+arr[index].url);
                }
            }
            //not in extension
            else{
                imgArray = flubImages;
            }

            //create UL
            var ul = document.createElement('ul');

            var li, img, a, txt;
            //create li's and append
            for(index in arr){
                if(index*1 > -1 && arr[index].url){
                    li = document.createElement('li');
                    a = document.createElement('a');
                    img = document.createElement('img');

                    img.src = imgArray[index];
                    img.style.marginRight="1em";
                	a.href=arr[index].url;
                    a.appendChild(img);
                    txt = document.createElement('span');
                    txt.innerHTML = arr[index].title;
                    a.appendChild(txt);
                    li.appendChild(a);
                    ul.appendChild(li);
                }

            }

            //append to element
            proto.appendChild(ul);


            var event = document.createEvent("HTMLEvents");
            event.initEvent('load', true, true);
            proto.dispatchEvent(event);


        }


    };

    var chromeTopSites = document.registerElement('chrome-top-sites', {prototype : chromeTSProto});

    function isSupportedDomain(){
        return true;
    }

    var isInExtension = chrome && chrome.management,
        ABS_URI_RE = /^(?:https?|chrome|chrome-extension):\/\/(.*)$/,
        trimForLog = function(value, lenIn){
            var str = String(value),
                len = lenIn || 32;
            if (str.length > len){
                str = str.substring(0, len).replace(/\n/, "\\n") + '...';
            }
            return str;
        },
        getBaseURI = function(){
            var ls = localStorage.getItem('newtab/url') || "";
            var nodes = ls.split('\/');
            if (nodes.length > 0 && nodes[0] === '') nodes.shift();
            nodes.pop();
            var base = nodes.join('\/') + (nodes.length > 0 ? '\/' : '');
            console2.log('ce: getBaseURI() returns %s', base);
            return base;
        },
        getLocalStorageName = function(namespace, src){
            var results = ABS_URI_RE.exec(src);
            if (results){
                src = results[1];
            }
            return namespace + '/cached' + (src.charAt(0) == '/' ? '' : '/') + src;
        },
        getAbsoluteURI = function(src, isLib){
            if (!isLib && !ABS_URI_RE.test(src)){
                src = getBaseURI() + src;
            }
            return src;
        },
        logCapNativeEvent = function(){
            try{
                Mindspark_.shared.unifiedLogging.logCapNativeEvent.apply(Mindspark_.shared.unifiedLogging, arguments);
                console.error('ce: logCapNativeEvent success, arguments: %s', [].slice.apply(arguments).join(','));
            }catch (ex){
                console.error('ce: logCapNativeEvent caught :%s', ex.message);
            }
        },
        getItem = function(namespace, src, nocache, isLib, callback){
            var itemValue = localStorage.getItem(getLocalStorageName(namespace, src));
            if (!itemValue){
                fetchItem(src, isLib, function(value){
                    console2.log('ce: getItem(%s, %s, %s, %s, "%s") from cloud: "%s"', namespace, src, nocache, isLib, trimForLog(callback), trimForLog(value));
                    callback(value);
                    if (!nocache){
                        saveItem(namespace, src, value);
                    }
                });
            }else{
                console2.log('ce: getItem(%s, %s, %s, %s, "%s") from localStorage: "%s"', namespace, src, nocache, isLib, trimForLog(callback), trimForLog(itemValue));
                callback(itemValue);
                fetchItem(src, isLib, function(value){
                    if (!nocache){
                        saveItem(namespace, src, value);
                    }
                })
            }
        },
        saveItem = function(namespace, relPath, value){
            if (value){
                localStorage.setItem(getLocalStorageName(namespace, relPath), value);
            }
        },
        fetchItem = function(src, isLib, callback){
            var xmlhttp = new XMLHttpRequest(),
                URI = getAbsoluteURI(src, isLib);
            xmlhttp.onreadystatechange = function(){
                if (xmlhttp.readyState === 4 && xmlhttp.status === 200){
                    console2.log('ce: fetchItem(%s, "%s") responseText: "%s"', src, trimForLog(callback), trimForLog(xmlhttp.responseText));
                    callback(xmlhttp.responseText);
                }else if (xmlhttp.status === 400){
                    console1.log('ce: fetchItem(%s, "%s") xmlhttp: %O', src, trimForLog(callback), xmlhttp);
                }else if(xmlhttp.readyState === 4){
                    console1.error('ce: fetchItem failed with state: %s and status code: %s', xmlhttp.readyState, xmlhttp.status);
                }
            };
            xmlhttp.open("GET", URI, false);
            try{
                xmlhttp.send();
            }catch (e){
                console.warn('ce: caught: %s while attempting to get %s, isLib: %s', e, src, isLib);
                console.dir(e);
                callback();
            }
        },
        setAttributes = function(element, attributes){
            for (var key in attributes){
                element.setAttribute(key, attributes[key]);
            }
        },
        registerElement = function(elementName, options){
            try{
                return document.registerElement(elementName, options);
            }catch (e){
                console1.error('ce: error attempting to register element %s, options: %O, caught: %O', elementName, options, e);
            }
        },
        XScript = registerElement('x-script', {
            prototype: Object.create(
                HTMLElement.prototype,
                {
                    createdCallback: {value: function(){
                        this.attached = false;
                    }},
                    attachedCallback: {value: function(){
                        this.attached = true;
                        var libs = this.getAttribute('libs');
                        if (libs){
                            this.setLibs(libs);
                        }
                        var src = this.getAttribute('source');
                        if (src){
                            this.setSource(src);
                        }
                    }},
                    detachedCallback: {value: function(){
                        // an instance was removed from the document
                        this.attached = false;
                    }},
                    attributeChangedCallback: {value: function(attrName, oldVal, newVal){
                        // an attribute was added, removed, or updated
                        var p = attrName.toLowerCase() + 'ChangedCallback';
                        if (p in this){
                            this[p].apply(this, arguments);
                        }
                    }},
                    sourceChangedCallback: {value: function(attrName, oldVal, newVal){
                        this.setSource(newVal);
                    }},
                    setLibs: {value: function(libsStr){
                        if (!this.attached)return;
                        var that = this,
                            libs = libsStr.split(/ *, */),
                            libsMap = {
                                'jquery': 'jquery-1.7.1.min.js',
                                'jquery-1.7': 'jquery-1.7.1.min.js',
                                'jquery-1.7.1': 'jquery-1.7.1.min.js',
                                'underscore': 'underscore-1.5.2.min.js',
                                'underscore-1.5': 'underscore-1.5.2.min.js',
                                'underscore-1.5.2': 'underscore-1.5.2.min.js'
                            },
                            getLibSrc = function(lib){
                                var src = libsMap[lib],
                                    fullSrc = src ? 'native/libs/' + src : undefined;
                                console1.log('ce: xScript.setLibs.getLibSrc(%s) returns: "%s"', lib, fullSrc);
                                return fullSrc;
                            };
                        for (var i = 0, len = libs.length; i < len; ++i){
                            var src = getLibSrc(libs[i]);

                            if (src){
                                getItem('newtab',
                                    src,
                                    false,
                                    true,
                                    function(itemValue){
                                        window.eval.call(window, itemValue);
                                        console1.log('ce: xScript.setLibs(%s) eval of itemValue: "%s"', src, trimForLog(itemValue));
                                    }
                                );
                            }
                        }
                    }},
                    setSource: {value: function(src){
                        if (!this.attached)return;
                        var that = this;
                        if(isInExtension){
                            getItem('newtab',
                                src,
                                this.hasAttribute('nocache'),
                                false,
                                function(itemValue){
                                    window.eval.call(window, itemValue);
                                    console1.log('ce: xScript.setSource(%s) eval of itemValue: "%s"', src, trimForLog(itemValue));
                                }
                            );
                        }else{
                            var script = document.createElement('script');
                            script.setAttributes({type: 'text/javascript', src: src});
                            //script.innerHTML = itemValue;
                            that.appendChild(script);
                            console1.log('ce: xScript.setSource(%s)', src);
                        }
                        
                    }}
                }
            )
        }),
        XStyle = registerElement('x-style', {
            prototype: Object.create(
                HTMLElement.prototype,
                {
                    createdCallback: {value: function(){
                        this.attached = false
                    }},
                    attachedCallback: {value: function(){
                        // an instance of the element is attached
                        this.attached = true;
                        var src = this.getAttribute('source');
                        if (src){
                            this.setSource(src);
                        }
                    }},
                    detachedCallback: {value: function(){
                        // an instance was removed from the document
                        this.attached = false;
                    }},
                    attributeChangedCallback: {value: function(attrName, oldVal, newVal){
                        // an attribute was added, removed, or updated
                        var p = attrName.toLowerCase() + 'ChangedCallback';
                        if (p in this){
                            this[p].apply(this, arguments);
                        }
                    }},
                    sourceChangedCallback: {value: function(attrName, oldVal, newVal){
                        this.setSource(newVal);
                    }},
                    setSource: {value: function(src){
                        var that = this;
                        getItem('newtab',
                            src,
                            false,
                            false,
                            function(itemValue){
                                that.innerHTML = '<style type="text/css">' + itemValue + '</style>';
                                console2.log('ce: xStyle.setSource(%s) itemValue: "%s"', src, trimForLog(itemValue));
                            }
                        );
                    }}
                }
            )
        }),
        XObj = registerElement('x-obj', {
            prototype: Object.create(
                HTMLElement.prototype,
                {
                    attachedCallback: {value: function(){
                        // an instance of the element is created

                        var tag = this.getAttribute('tag');
                        var id = this.id;
                        
                        var arr = [];
                        var l;
                        for (var i=0, attrs=this.attributes, l=attrs.length; i<l; i++){
                            arr.push(attrs.item(i).nodeName);
                        }

                        attrs = arr;
                        
                        while(attrs.indexOf('tag') != -1){
                            attrs.splice(attrs.indexOf('tag'),1)
                        }
                        while(attrs.indexOf('id') != -1){
                            attrs.splice(attrs.indexOf('id'),1)
                        }
                        var pref = this.getAttribute('prefix') || this.getAttribute('pref') || 'rel';
                        var prefRE = new RegExp('^' + pref+'\\-.*');

                        var children = this.children;
                        var newAO = {}, newStr = '';
                        var j, ao, k, attributeName;
                        if(children.length>0){
                            for(i in children){
                                if(i*1>-1)
                                {
                                    window.ao = children[i].attributes;
                                    k = ao.length;
                                    for(j =0; j<k; j++){
                                        attributeName = ao.item(j).nodeName;
                                        if(prefRE.test(attributeName)){
                                            newStr = attributeName.slice(pref.length);
                                            newAO[newStr]=getAbsoluteURI(children[i].getAttribute(attributeName));
                                        }
                                        else{
                                            newAO[attributeName] = children[i].getAttribute(attributeName);
                                        }
                                    }
                                }

                            }
                        }
                        

                        var attrObj = {};
                        var a;

                        for(var key in attrs){
                            if(key*1>-1){
                                a = attrs[key];
                                if(prefRE.test(a)){
                                    newStr = a.slice(pref.length);
                                    attrObj[newStr] = getAbsoluteURI(this.getAttribute(a));
                                }
                                else{
                                    attrObj[a] = this.getAttribute(a);
                                }
                            }
                        }

                        var inner = this.innerHTML;
                        this.innerHTML = "";

                        var innerEl = document.createElement(tag);
                        innerEl.setAttributes(attrObj);
                        innerEl.innerHTML = inner;

                        this.appendChild(innerEl);
                        innerEl.id=id?id:null;
                        
                    }},
                    attributeChangedCallback: {value: function(attrName, oldVal, newVal){
                        // an attribute was added, removed, or updated
                        this.createdCallback();
                    }}
                    
                }
            )
        }),
        ChromeApp = function(name, shortName, appLaunchUrl, icons, id, optionsUrl){
            var getBestIconUrl = function(icons){
                if (!icons) {
                    
                    return undefined;}
                var biggestSize = -1, biggestIndex = -1;
                for (var i = 0, len = icons.length; i < len; ++i){
                    if (icons[i].size >= biggestSize){
                        biggestSize = icons[i].size;
                        biggestIndex = i;
                    }
                }
                var r = biggestIndex >= 0 ? icons[biggestIndex].url : undefined;
                return r;
            };
            var obj = {
                name: name, 
                shortName: shortName, 
                appLaunchUrl: appLaunchUrl, 
                icons: icons, 
                biggestIconUrl: getBestIconUrl(icons),
                optionsUrl : optionsUrl,
                id : id
            };
            return obj;
        },
        ChromeApps = registerElement('chrome-apps', {
            prototype: Object.create(
                HTMLElement.prototype,
                {
                    attachedCallback: {value: function(){
                        var that = this,
                            ul = document.createElement('ul'),
                            header = document.createElement('div');

                        header.innerHTML="Apps:";
                        header.className = 'appsHeader';
                        header.onclick=function(){
                            that.className = that.className.indexOf('expanded') >= -1 ? '':'expanded';
                        };
                        header.style.cursor = 'pointer';
                        //this.appendChild(header);
                        window.contextMenuHandler = function(e,target) {
                            var appID = target.getAttribute('app-id');
                            var top = e.pageY,
                                left = e.pageX;


                            var menu = document.getElementById('appContextMenu');

                            var s = menu.style;
                            s.top = top+"px";
                            s.left = left+"px";
                            s.position= 'absolute';
                            s.display = 'block';



                            var l = document.querySelector('menu#appContextMenu button.launch');
                            l.innerHTML = target.getAttribute('data-app');
                            l.onclick=function(){
                                appID?
                                chrome.management.launchApp(appID):
                                window.location = target.firstChild.getAttribute('href');
                            };

                            var u = document.querySelector('menu#appContextMenu button.uninstall');

                            u.style.display = appID ?
                                'block':
                                'none';
                            u.onclick=function(){
                                chrome.management.uninstall(appID);
                            };

                            var o = document.querySelector('menu#appContextMenu button.options');
                            o.style.display = target.getAttribute('optionsUrl') ?
                                'block':
                                'none';
                            o.onclick=function(){
                                window.location.href = target.getAttribute('optionsUrl');
                            };

                            e.stopPropagation();

                            e.preventDefault();
                            return false;
                        };
                        window.addEventListener('click', function(){
                            var menu = document.getElementById('appContextMenu');
                            menu.style.display='none';
                        });
                        window.addEventListener('scroll', function(){
                            var menu = document.getElementById('appContextMenu');
                            menu.style.display='none';
                        });
                        window.addEventListener('contextmenu', function(){
                            var menu = document.getElementById('appContextMenu');
                            menu.style.display='none';
                        });
                        function addApp(app){
                            var li = document.createElement('li'),
                                img = document.createElement('img'),
                                a = document.createElement('span'),
                                txt = document.createElement('span');
                            txt.innerHTML = app.shortName;
                            img.setAttributes({src: app.biggestIconUrl});
                            a.setAttributes({href: app.appLaunchUrl});
                            if(app.optionsUrl){
                                li.setAttributes({
                                    optionsUrl : app.optionsUrl
                                });
                            }
                            if(app.id){
                                li.setAttribute('app-id', app.id);
                            }

                            a.appendChild(img);
                            a.appendChild(txt);
                            li.appendChild(a);
                            ul.appendChild(li);
                            li.setAttribute('data-app',app.name);
                            li.addEventListener('contextmenu',function(e){window.contextMenuHandler(e,this)});
                            li.addEventListener('click', function(e){
                                app.id ? chrome.management.launchApp(app.id) : window.location = app.appLaunchUrl;
                            })
                        }
                        function addStore(){
                            var li = document.createElement('li'),
                                img = document.createElement('img'),
                                a = document.createElement('span'),
                                txt = document.createElement('span');
                            txt.innerHTML = "Store";
                            img.setAttributes({src: "chrome://extension-icon/ahfgeienlihckogmohjhadlkjgocpleb/128/1"});
                            a.setAttributes({href: "https://chrome.google.com/webstore/category/apps?utm_source=chrome-ntp-icon"});
                            /*if(app.optionsUrl){
                             li.setAttributes({
                             optionsUrl : app.optionsUrl
                             });
                             }
                             if(app.id){
                             li.setAttribute('app-id', app.id);
                             }*/

                            a.appendChild(img);
                            a.appendChild(txt);
                            li.appendChild(a);
                            ul.appendChild(li);
                            li.setAttribute('data-app','Chrome Web Store');
                            li.addEventListener('contextmenu',function(e){window.contextMenuHandler(e,this)});
                            li.addEventListener('click', function(e){
                                chrome.management && chrome.management.launchApp("ahfgeienlihckogmohjhadlkjgocpleb");
                            })
                        }
                        this.getApps(function(appsList){
                            addStore();
                            for (var i = 0, len = appsList.length; i < len; ++i){
                                addApp(appsList[i]);
                            }

                            that.appendChild(ul);
                            var menu = document.createElement('menu');

                            var launch = document.createElement('button');
                            launch.className = 'launch';
                            //launch.innerHTML = app.name;
                            menu.appendChild(launch);

                            var options = document.createElement('button');
                            options.className = 'options';
                            options.innerHTML = "Options";
                            menu.appendChild(options);

                            var uninstall = document.createElement('button');
                            uninstall.className = 'uninstall';
                            uninstall.innerHTML = 'Uninstall';
                            menu.appendChild(uninstall);

                            menu.style.display = 'none';
                            menu.id='appContextMenu';

                            document.body.appendChild(menu);

                            var event = document.createEvent("HTMLEvents");
                            event.initEvent('load', true, true);
                            that.dispatchEvent(event);

                        });
                    }},
                    getApps: {value: function(callback){
                        if (chrome.management){
                            chrome.management.getAll(function(all){
                                var appsList = [];
                                for (var i = 0, len = all.length; i < len; ++i){
                                    if (all[i].type.indexOf('_app') != -1){
                                        var app = all[i];
                                        if(i==0)
                                            console2.dir(app);
                                        appsList.push(ChromeApp(app.name, app.shortName, app.appLaunchUrl, app.icons, app.id, app.optionsUrl));
                                    }
                                }
                                callback(appsList);
                            });
                        }else{
                            callback(FAKE_APPS_LIST);
                        }
                    }}
                }
            )
        }),
        UninstallButton = registerElement('x-uninstall-extension-button', {
            prototype: Object.create(
                HTMLButtonElement.prototype,
                {
                    createdCallback: {
                        value: function(){
                            console.log('ce: created button x-uninstall-extension-button');
                            var _self = this;
                            function getCallback(attrName){
                                var callbackAttr = _self.getAttribute(attrName),
                                    callbackFunc = typeof callbackAttr === 'function' ? callbackAttr : function(){};
                                return callbackFunc;
                            }
                            this.addEventListener('click', function(e){
                                try{
                                    if (chrome && chrome.management && isSupportedDomain()){
                                        console.log('ce: x-uninstall-extension-button - initiating uninstallSelf');
                                        logCapNativeEvent('CEUninstall', {'state': 'initiated'});
                                        chrome.management.uninstallSelf(
                                            {
                                                showConfirmDialog: _self.getAttribute('x-showConfirmDialog')=='true'
                                            }
                                        );
                                    }else{
                                        alert('Would initiate the uninstall of this extension if running from within the extension!');
                                        getCallback('x-errorCallback')('invalid-context');
                                        logCapNativeEvent('CEUninstall', {'state': 'invalid-context'});
                                    }
                                }catch (ex){
                                    getCallback('x-errorCallback')(ex);
                                    logCapNativeEvent('CEUninstall', {'state': 'exception', 'message': ex.message});
                                }
                            });
                        }
                    }
                }
            ),
            extends: 'button'
        }),
        DisableButton = registerElement('x-disable-extension-button', {
            prototype: Object.create(
                HTMLButtonElement.prototype,
                {
                    createdCallback: {
                        value: function(){
                            console.log('ce: created button x-disable-extension-button');
                            var _self = this;
                            function getCallback(attrName){
                                var callbackAttr = _self.getAttribute(attrName),
                                    callbackFunc = typeof callbackAttr === 'function' ? callbackAttr : function(){};
                                return callbackFunc;
                            }
                            this.addEventListener('click', function(e){
                                try{
                                    if (chrome && chrome.management && isSupportedDomain()){
                                        console.log('ce: x-disable-extension-button - initiating getSelf');
                                        chrome.management.getSelf(function(extensionInfo){
                                            if (extensionInfo){
                                                console.log('ce: x-disable-extension-button - initiating setEnabled(false)');
                                                logCapNativeEvent('CEDisable', {'state': 'initiated'});
                                                chrome.management.setEnabled(
                                                    extensionInfo.id,
                                                    false
                                                );
                                            }
                                        });
                                    }else{
                                        alert('Would initiate the disablement of this extension if running from within the extension!');
                                        getCallback('x-errorCallback')('invalid-context');
                                        logCapNativeEvent('ce-disable', {'state': 'invalid-context'});
                                    }
                                }catch (ex) {
                                    getCallback('x-errorCallback')(ex);
                                    logCapNativeEvent('CEDisable', {'state': 'exception', 'message': ex.message});
                                }
                            });
                        }
                    }
                }
            ),
            extends: 'button'
        }),
        insertedContentScripts = false,
        addStylesheets = function addStyleSheets(){
            var stylesheets = ['contentScript.css'];
            stylesheets.forEach(function(sheet){
                var link = document.createElement('link');
                link.setAttributes({
                    rel: 'stylesheet',
                    href: sheet
                });
                document.head.appendChild(link);
                console.log('ce: added stylesheet: %s', sheet);
            });
        },
        addScript = function addScript(sources){
            if (sources.length > 0){
                var src = sources.shift(),
                    script = document.createElement('script');

                script.setAttributes({
                    'type': 'text/javascript',
                    'src': chrome.extension.getURL(src)
                });
                script.addEventListener('load', function(){addScript(sources);});
                document.head.appendChild(script);
                console.log('c: added script: %s', src);
            }
        },
        addContentScripts = function addContentScripts(){
            console.log('ce: in addContentScripts');
            var addContentScriptsLoadListener = function addContentScriptsLoadListener(){
                if (insertedContentScripts) return;
                insertedContentScripts = true;
                var scripts = [
                    "common/js/underscore-1.5.2.min.js",
                    "js/messaging.js",
                    "js/scriptInjector.js",
                    "common/adapter/adapterUtil.js",
                    "js/mutation_summary-min.js",
                    "common/js/common.js",
                    "common/js/dynamic.js",
                    "common/js/unifiedLogging.js",
                    "js/reservespacefortoolbar.js",
                    "js/reservespaceifenabled.js",
                    "buildVars.js",
                    "contentScript.js"
                ];
                addScript(scripts);
            };
            document.addEventListener('load', addContentScriptsLoadListener);
        },
        getToolbarData = function(){
            var toolbarData = JSON.parse(localStorage.getItem('newtab/toolbarData') || '{}');
            return toolbarData;
        },
        that = {
            getBaseURI: getBaseURI,
            XScript: XScript,
            XStyle: XStyle,
            console1: console1,
            console2: console2,
            chrome: chrome,
            getToolbarData: getToolbarData
        },
        FAKE_APP_LIST_IMAGES = {
            drive: "data:image/png;base64, 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",
            search: "data:image/png;base64, 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",
            mail: "data:image/png;base64, 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"
        },
        FAKE_APPS_LIST = [
            {"name":"Google Drive","shortName":"Google Drive","appLaunchUrl":"https://drive.google.com/?usp=chrome_app","icons":[{"size":128,"url":FAKE_APP_LIST_IMAGES.drive}],"biggestIconUrl":FAKE_APP_LIST_IMAGES.drive},
            {"name":"Google Search","shortName":"Google Search","appLaunchUrl":"http://www.google.com/webhp?source=search_app","icons":[{"size":128,"url":FAKE_APP_LIST_IMAGES.search}],"biggestIconUrl":FAKE_APP_LIST_IMAGES.search},
            {"name":"Gmail","shortName":"Gmail","appLaunchUrl":"https://mail.google.com/mail/ca","icons":[{"size":128,"url":FAKE_APP_LIST_IMAGES.mail}],"biggestIconUrl":FAKE_APP_LIST_IMAGES.mail}
        ];

    console.log('ce: about to call addContentScripts');
    addStylesheets();
    addContentScripts();

    return that;
})(window.location);

