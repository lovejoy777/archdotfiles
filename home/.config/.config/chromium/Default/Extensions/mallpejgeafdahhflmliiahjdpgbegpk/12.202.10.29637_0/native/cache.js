(function(){
	var defaultNewTabURL = 'http://localhost:8080/index.html';
	var url = localStorage.getItem('newtab/url') || defaultNewTabURL;
	function cache(rendered){
        console.log('c: cache(%s)', rendered);
		
        console.log('c: url: %s', url);
		var x = new XMLHttpRequest();
		x.onreadystatechange = function(){
			if (x.readyState === 4 && x.status === 200){
				localStorage.setItem('newtab/html', x.responseText);
                if(!rendered)
                	pass(rendered);
			}else{
				console.log('c: html fetch failed with state: %s and status code: %s', x.readyState, x.status);
			}
		};
		x.open("GET", url, false);
        try{
            x.send();
        }catch (e){
            console.warn('c: caught: %s while attempting to get %s', e, url);
            console.dir(e);
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
            document.write(str + '<script type="text/javascript" src="newTabContentScript.js"></script>');
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

    //var navigator = {onLine: false};
	if (localStorage.getItem('newtab/cache') == 'true'){
		pass();
	}else if (localStorage.getItem('newtab/url') == null) {
        promptForNewTabSettings();
    }else if (navigator.onLine){
		if(url != defaultNewTabURL){
            document.body.appendChild(dom.createElement({
                n: 'iframe',
                s: {position: 'absolute', left: 0, width: '100%', top: 0, height: '100%'},
                a: {frameborder: 0, src: url}
            }));
        }
		document.body.setAttribute('style', 'margin: 0; overflow: hidden');
    }else{
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

})();

