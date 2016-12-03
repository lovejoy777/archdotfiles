var ss = {
	eventDriven : false,
	prev : "",
	selected : -1,
	console : window.console,
	badString : '<!--SEARCH_TERMS-->',
    textDecorationFromURL: false
};

function getSuggestions(el, URI){
	//console = console1;
	
	var default_el = document.querySelector('search-box input[type="text"]');
	if(el)
		el = !el.value ? default_el : el;
	else
		el = default_el;




	var default_URI = localStorage.getItem('searchSuggestUrl') || 'http://ssmsp.ask.com/query?q='+ss.badString;
	URI = URI || default_URI;

	//console.log(URI);

	var q = el.value;

	function displayResults(data){
        ss.selected = -1;
		var arr = eval(data);
		var b = document.querySelector("#sgbody");
		var resArr = arr[1];
		b.style.display = resArr.length>0?'block':'none';
		b.innerHTML = "";
		var a,d,t;
		var hack = document.createElement('div');


        var sb = document.querySelector('search-box');
        var att = sb.getAttribute('ss-no-spans') !== null;
        ss.textDecorationFromURL = resArr[0].indexOf('</span>')> 0 && !att;

		for(var index in resArr){
            if(index*1 > -1 && typeof resArr[index] == 'string'){
                hack.innerHTML = resArr[index];
                a = document.createElement('a');
                d = document.createElement('div');
                a.setAttribute('href',searchURL.replace(ss.badString,encodeURI(hack.innerText)));
                d.innerHTML=resArr[index];
                if(!ss.textDecorationFromURL){
                    t = d.innerText;
                    t=t.replace(arr[0], "<span class='suggest'>$&</span>");
                    d.innerHTML = t;
                }
                d.setAttribute('data-index',index);
                a.appendChild(d);
                b.appendChild(a);
                b.addEventListener('click',function(e){
                    e.stopPropagation();
                });
                document.body.addEventListener('click', function(){
                    b.style.display='none';

                })
            }
        }


		//console.log(arr);
	}

	window.requestSuggestions = new XMLHttpRequest ();
	window.requestSuggestions.onreadystatechange = function(){
		
		var state = window.requestSuggestions.readyState,
			status = window.requestSuggestions.status;
		
		//console.log()
		if( state == 4 && status  == 200){
			displayResults(window.requestSuggestions.responseText);
		}
		else{
			console.log("HTTP Response from %s - Ready State:%s; Status: %s.", URI,state, status );
		}
	};
	var constructedURI = URI.replace(ss.badString, q);
	console.error(constructedURI);
    window.requestSuggestions.open('GET', constructedURI, true);
    window.requestSuggestions.send();
}

var debounce = function(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

if(ss.eventDriven){
	document.querySelector('search-box input[type="text"]').addEventListener('keyup', function(e){
	    if(e.keyCode> 45 && e.keyCode < 112){
	    	console.log('keyup %s', e.target.value);
	    	debounce(getSuggestions(e.target),250);
	    }
	    
		
	});
}
else{
	setInterval(function(){
		var target = document.querySelector('search-box input[type="text"]');
		if(target.value != ss.prev){
			getSuggestions(target,null);
			ss.prev = target.value;
		}
			

	},125);



}

document.querySelector('search-box input[type="text"]').addEventListener('keydown', function(e){
	
	var divs,t, suggestions;
	//console.warn("keypress");
	//console.log(e.keyCode);
    if(e.keyCode == 38 || e.keyCode == 40){
    	suggestions = document.querySelectorAll('#sgbody a').length;

    	//console.log("Pre keypress: %s", ss.selected);
    	ss.selected = ss.selected -39 + e.keyCode;
        if(ss.selected == -1){
            ss.selected = suggestions -1;
        }
    	//console.log("post keypress: %s", ss.selected);
    	if(ss.selected>-1){
    		if(ss.selected == suggestions){
                ss.selected = 0;
            }

    		t = document.querySelector('#sgbody div.selected');
    		t?t.className = null:null;

    		t =	document.querySelector("#sgbody div[data-index='" + ss.selected + "']");
    		
    		t.className = 'selected';
    	}


    	e.preventDefault();
    }
    else if(e.keyCode == 0x0D || e.keyCode == 0x0A){
    	//stuff
    	try{
    		e.target.value = document.querySelector('#sgbody div.selected').innerText;
    	}
    	catch(err){
    		var str="........................................\n..................,..,:.................\n............,:~..:,,,,:..,,:............\n\n............,,:~.,,,,,:.,,,:............\n.......:,:~.,,,,.,,,,,:,,,,...,,........\n........,,,::,,,,,,,,,:,,,:,+,:,,:......\n....:,::,,,,:,,,::,,,,=,,:+,,,,,,.......\n....:.,,,::,::,::,:,,:,,,=,.,,,:........\n...:::::,,,::,:,:::::,,,,,,,,:..........\n.....:::::::::::~?+I??I,,,,,,,,,,,,,:...\n.......,:::::::+?IIIII?I:,,,.,,,,,:.....\n..,,:::,:,::::=??I7I?I?7~,.,,,,,,,,,:...\n...::::,,,,,::~II7I?I7?$:,,,,.,,,,::....\n.....,:,:::::::+?+7I?I??,.,,,.,.........\n...,:,:::,:::=,:~?IOI7:,,,,,,,,,,:......\n....~:::+=:,,,::,::~,,,,:,,,,:,,,,:.....\n......,.,,,,,,:,,,,,,.,.,~,,,,,.........\n.....:,,,,,,,:,,,,:,.,.,,.,...,:........\n......::,,,:,~,,:,+,,..,,,:,..,,:.......\n........,:~:.,,,:,+.,,,,,,,,,...........\n........~....,,,~.,,,,,.,,:,,~..........\n.............,:...,,,,,,,...............\n..................:,:.,,................\n........................................\n........................................\nSomething broke. Have a daisy.";
    		console.log(str);
    	}
    		
    	//e.preventDefault();

    }
    else if(e.keyCode == 27){
    	document.querySelector("#sgbody").style.display = 'none';
        ss.selected = -1;
    }
});



var searchURL = localStorage.getItem("searchUrl") || 'http://search.tb.ask.com/search/GGmain.jhtml?searchfor='+ss.badString;


(function(){
	var el = document.querySelector('search-box input[type="text"]');

	var form = el? el.parentElement:{};

	var cl = searchURL.indexOf('mywebsearch') > -1 ?
		'mws' : 'ask';
	el.parentElement.parentElement.className += cl;

	form.action = searchURL.replace("searchfor="+ss.badString,"");

	var termsArr = searchURL.split('&');

	var input, kstr;
	for(var i=1;i<termsArr.length;i++){
        kstr = termsArr[i].split('=');
		input = document.createElement('input');
		input.setAttribute('name',decodeURIComponent(kstr[0]));
		input.setAttribute('value',decodeURIComponent(kstr[1]));
		input.setAttribute('type','hidden');
		form.appendChild(input);
	}
})();


