/*global _disableSSApplicable:true*/
var tprVal = 'sug';
if (typeof(ssTpr) != 'undefined' && ssTpr != null && Common.trim(ssTpr) != '') {
	tprVal = ssTpr;
}

var getSearchUrl = function(val) {
	return Common.getSearchUrl(
		val,
		"tab",
		Global.getToolbarId(),
		Global.getPartnerId(),
		Global.getPartnerSubId(),
		Global.getInstallDate(),
		{
			"ct": "SS",
			"pg": "GGmain",
			"tpr": tprVal
		}
	);
};

var _suggestUrls = {web: Common.searchSuggUrl + '?'};

//test
window.onload=function() {
     document.onkeydown = checkKeycode;
     if (typeof(pageTimer)=="function") { pageTimer();}
     if (typeof document.hpForm != 'undefined') { document.hpForm.searchfor.focus(); }
};
var keyIdx=-1;
var sPrevTerm;
var bReset=false;
var bReopen=false;
var sTpr_def = '';
var sTpr_ss = 'sug';
function checkKeycode(e) {
	var keycode;
	if (window.event) keycode = window.event.keyCode;
	else if (e) keycode = e.which;
	if($("#suggestlist").length>0 && ($("#sgpane").css("display")=="block" || bReopen) && (keycode == 38 || keycode == 40)) {
		if(bReopen) {
			keyIdx!=0;
			$("#sgpane").show();
			bReopen=false;
		}
		
		var bUp=(keycode == 38);
		
		var numResult=$("#suggestlist")[0].childNodes.length;
		
		if(keyIdx!=-1) {
			sSuggOut(keyIdx);
		}else{
			sPrevTerm=$("#searchfor").val();
		}
		
		if(!bReset){
			if(bUp) {
				keyIdx--;
			} else {
				keyIdx++;
			}
		}else{
			bReset=false;
			if(bUp){
				keyIdx=numResult-1;
			}
		}
		
		var bDoHighlight=true;
		if(keyIdx<0 || keyIdx==numResult) {
			keyIdx=0;
			bDoHighlight=false;
			bReset=true;
			$("#searchfor").val(sPrevTerm);
			$("#tpr").val(sTpr_def);
		}
		
		if(bDoHighlight)
			sSuggOver(keyIdx);
		
	}
}
function searchSuggOver(){
	$("#searchfor").val($("#sSuggOver"+keyIdx).html().replace(/(<([^>]+)>)/ig,""));
	$("#tpr").val(sTpr_ss);
}
function sSuggOver(idx) {
	if(keyIdx!=idx)
		sSuggOut(keyIdx);
	
	keyIdx=idx;
	
	a10.ss.select(idx);
	searchSuggOver();
	
	if(idx>-1 && idx<10) {
		$('#sSuggOver'+idx).css('backgroundColor','#5992D3');
		$('#sSuggLink'+idx).css('color','#ffffff');
	}
}
function sSuggOut(idx) {
	if(keyIdx!=-1) {
		keyIdx=idx;
		a10.ss.select(idx);
		$("#searchfor").val(sPrevTerm);
		$("#tpr").val(sTpr_def);
	}
	
	if(idx>-1 && idx<10) {
		$('#sSuggOver'+idx).css('backgroundColor','#ffffff');
		$('#sSuggLink'+idx).css('color','#0030CE');
	}
}
function sSuggDown(idx){
	sPrevTerm = $("#sSuggOver"+idx).html().replace(/(<([^>]+)>)/ig,"");
}
function $$(A){
	return(typeof A=="string")?document.getElementById(A):A;
}
function $F(B){
	var A=document.getElementsByName(B);
	if(A&&A.length>0){
		return A[0].value;
	}
	return"";
}

var Cookie={};
Cookie.isEnabled=function(){
	return window.navigator.cookieEnabled;
};
Cookie.getCookie=function(D,C){
	var E=document.cookie;
	var F=E.indexOf(D+"=");
	var A=F+D.length+1;
	if((!F)&&(D!=E.substring(0,D.length))){
		return null;
	}
	if(F==-1){
		return null;
	}
	var B=E.indexOf(";",A);
	if(B==-1){
		B=E.length;
	}
	return C?E.substring(A,B):unescape(E.substring(A,B));
};
Cookie.deleteCookie=function(A,C,B){
	if(Cookie.getCookie(A)){
		document.cookie=A+"="+((C)?"; path="+C:"")+((B)?"; domain="+B:"")+"; expires=Thu, 01-Jan-70 00:00:01 GMT";
	}
};
Cookie.setCookie=function(B,D,A,F,C,E){
	document.cookie=B+"="+escape(D)+((A)?"; expires="+A.toGMTString():"")+((F)?"; path="+F:"")+((C)?"; domain="+C:"")+((E)?"; secure":"");
};

function ssloaded() {
	a10.ss.init('searchfor', 'sgpane', 'sgbody');
	a10.ss.offsetLeft = 20;
}
var _disableSSMsg = "close";
var _noSSFoundMsg = "No Search Suggestions Found";
var _language = "en";
var _country = "US";
var _maxItems = -1;
if (!a10) {var a10 = {}};
a10.ss2 = {};
a10.ss2.createSuggestions = function(suggestions, qsrc, origin, partnerID, siteID, country) {
	var return_str = '<div id="suggestlist">';
	function createSuggestionListItem(suggestion, qsrc, origin, partnerID, siteID, country, idx) {
		keyIdx=-1;
		var query = suggestion.replace(/(<([^>]+)>)/ig,"");
		return "<a id='sSuggLink" + (idx) +"' style='text-decoration:none;color:#0030CE;font-size:12px;' href='" + getSearchUrl(query) + "'><div style='padding-left:6px;padding-top:2px;padding-bottom:4px;font-family:Arial;font-size:12px;font-weight:bold;' id='sSuggOver" + (idx) +"' onmouseover='sSuggOver(" + (idx) +");' onmouseout='sSuggOut(" + (idx) +");' onmousedown='sSuggDown(" + (idx) +");'>" + suggestion.replace(/\\/g,"") + "</div></a>";
	}
	var suggestion_index = 0;
	for (var i = 0; i < suggestions.length; i++) {
		if (_maxItems > 0 && suggestion_index >= _maxItems) {
			break;
		}
		return_str += createSuggestionListItem(suggestions[i], qsrc, origin, partnerID, siteID, country, suggestion_index++);
	}
	return_str += "</div>";
	return return_str;
};
a10.ss2.getSuggestions = function(jsonData) {
	return jsonData[1];
	//return jsonData["Suggestions"];
};
a10.ss2.getQuery = function(jsonData) {
	return jsonData[0];
	//return jsonData["Query"];
};
a10.ss2.execute = function(query, country, language) {
	var ssurl = _suggestUrls['web'] +
		"q=" + encodeURIComponent(query).toLowerCase() +
		"&cn=" + country +
		"&ln=" + language +
		"&sstype=prefix";//For prefix suggest
		
	$.ajax({
		url: ssurl,
		success: function(data, textStatus, jqXHR) {
			suggestCallBack(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.warn(textStatus, jqXHR);
		},
		dataType: "json"
	});
};

a10.browser={};
a10.browser.isIE=function(){
	return navigator.userAgent.toLowerCase().indexOf("msie")!=-1;
};
a10.browser.isIE6=function(){
	return navigator.userAgent.toLowerCase().indexOf("msie 6.")!=-1;
};
a10.browser.isIE7=function(){
	return navigator.userAgent.toLowerCase().indexOf("msie 7.")!=-1;
};
a10.browser.isOpera=function(){
	return navigator.userAgent.toLowerCase().indexOf("opera")!=-1;
};

a10.util={};
a10.util.findPos=function(A){
	var B= 0, curtop=0;
	if(A&&A.offsetParent){
		B=A.offsetLeft;
		curtop=A.offsetTop;
		while(A=A.offsetParent){
			B+=A.offsetLeft;
			curtop+=A.offsetTop;
		}
	}
	return[B,curtop];
};
a10.util.scrollTop=function(){
    return window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0;
};
a10.util.ie6PNGSpriteHack=function(H){
    if(a10.browser.isIE6()){
        var G=H.style.backgroundImage.substr(4,H.style.backgroundImage.length-5);
        var B=H.style.backgroundPosition.split(" ");
        var F=B.length>=1?parseInt(B[0]):0;
        var C=B.length>=2?parseInt(B[1]):0;
        F=isNaN(F)?0:F;
        C=isNaN(C)?0:C;
        var E=parseInt(H.style.width);
        var A=parseInt(H.style.height);
        E=isNaN(E)?0:E;
        A=isNaN(A)?0:A;
        H.style.backgroundImage="none";
        H.style.overflow="hidden";
        var D=document.createElement("div");
        D.style.filter="progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+G+"', sizingMethod='crop')";
        D.style.position="relative";
        D.style.left=F+"px";
        D.style.top=C+"px";
        D.style.width=-F+E+"px";
        D.style.height=-C+A+"px";
        H.appendChild(D);
    }
};
a10.util.uniqueID=(function(){
	var A=0;
	return function(){
		return A++;
	};
})();

a10.event={};
a10.event.addListener=function(D,B,A){
	D=$$(D);
	if(D){
		if(D.addEventListener){
			D.addEventListener(B,A,false);
		}
		else{
			if(D.attachEvent){
				if(!A["_addListenerID"]){
					A["_addListenerID"]=a10.util.uniqueID();
				}
				var C=B+A["_addListenerID"];
				if(D[C]){
					return;
				}
				D["fn"+C]=A;
				D[C]=function(){
					D["fn"+C](window.event);
				};
				D.attachEvent("on"+B,D[C]);
			}
		}
	}
};
a10.event.removeListener=function(D,B,A){
	D=$$(D);
	if(D.removeEventListener){
		D.removeEventListener(B,A,false);
	}
	else{
		if(D.detachEvent){
			var C=B+A["_addListenerID"];
			D.detachEvent("on"+B,D[C]);
			D[C]=null;
			D["fn"+C]=null;
		}
	}
};
a10.event.element=function(A){
	return A.target||A.srcElement;
};
a10.event.cancelDefaultAction=function(A){
	if(A.preventDefault){
		A.preventDefault();
	}
	else{
		A.returnValue=false;
	}
};

a10.element={};
a10.element.visible=function(B){
    var A=$$(B);
    if(A){
        return A.style.display!="none";
    }
    return false;
};
a10.element.toggle=function(A){
    A=$$(A);
    a10.element[a10.element.visible(A)?"hide":"show"](A);
    return A;
};
a10.element.hide=function(B){
    var A=$$(B);
    if(A){
        A.style.display="none";
    }
    return B;
};
a10.element.show=function(B){
    var A=$$(B);
    if(A){
        A.style.display="";
    }
    return B;
};
a10.element.containsPoint=function(C,A,E,B){
    if(C){
        var D=a10.util.findPos(C);
        if(B){
            D[1]-=a10.util.scrollTop();
        }
        else{
            if(a10.browser.isIE6()){
                D[0]-=document.body.scrollLeft;
                D[1]-=document.body.scrollTop;
            }
        }
        return A>=D[0]&&A<(D[0]+C.offsetWidth)&&E>=D[1]&&E<(D[1]+C.offsetHeight);
    }
};
a10.element.setOpacity=function(A,D){
    A=$$(A);
    if(!A){
        return;
    }
    if(a10.browser.isIE()){
        var C=A.style.filter;
        var B=A.style;
        if(D==1||D===""){
            B.filter=C.replace(/alpha\([^\)]*\)/gi,"");
            return ;
        }
        else{
            if(D<0.00001){
                D=0;
            }
        }
        B.filter=C.replace(/alpha\([^\)]*\)/gi,"")+"alpha(opacity="+(D*100)+")";
    }
    else{
        A.style.opacity=(D==1||D==="")?"":(D<0.00001)?0:D;
    }
};
a10.element.getOpacity=function(A){
    A=$$(A);
    if(A){
        if(a10.browser.isIE()){
            var B=(A.style.filter||"").match(/alpha\(opacity=(.*)\)/);
            if(B&&B[1]){
                return parseFloat(B[1])/100;
            }
            else{
                return 1;
            }
        }
        else{
            var B=A.style.opacity;
            return B?parseFloat(B):1;
        }
    }
    return null;
};
a10.element.getHeight=function(A){
    return this.getDimensions(A).height;
};
a10.element.getWidth=function(A){
    return this.getDimensions(A).width;
};
a10.element.getDimensions=function(C){
    C=$$(C);
    if(!C){
        return{width:null,height:null};
    }
    var B=C.style;
    var F=B.visibility;
    var D=B.position;
    var A=B.display;
    B.visibility="hidden";
    B.position="absolute";
    B.display="block";
    var G=C.offsetWidth;
    var E=C.clientHeight;
    B.display=A;
    B.position=D;
    B.visibility=F;
    return{width:G,height:E};
};

a10.IFrameCover=function(A,B){
    this.element=$$(A);
    this.iframe=null;
    if(B){
        this.leftOffset=B.left||0;
        this.topOffset=B.top||0;
        this.widthOffset=B.width||0;
        this.heightOffset=B.height||0;
    }
    else{
        this.leftOffset=this.topOffset=this.widthOffset=this.heightOffset=0;
    }
};
a10.IFrameCover.prototype={
    show:function(){
        this.iframe=document.createElement("iframe");
        this.iframe.src="about:blank";
        this.iframe.scrolling="no";
        this.iframe.frameBorder=0;
        this.iframe.style.position="absolute";
        this.iframe.style.zIndex=0;
        this.iframe.id=this.element.id+"_IFrameCover";
        document.body.appendChild(this.iframe);
        this.reposition();
    },
    hide:function(){
        if(this.iframe==null){
            return;
        }
        document.body.removeChild(this.iframe);
        this.iframe=null;
    },
    reposition:function(){
        if(this.iframe==null){
            return;
        }
        var B=a10.util.findPos(this.element);
        var A=a10.element.getDimensions(this.element);
        this.iframe.style.left=B[0]+this.leftOffset+"px";
        this.iframe.style.top=B[1]+this.topOffset+"px";
        this.iframe.style.width=A.width+this.widthOffset+"px";
        this.iframe.style.height=A.height+this.heightOffset+"px";
        if(a10.browser.isIE6()){
            this.iframe.style.width=A.width+this.widthOffset-27+"px";
            this.iframe.style.height=A.height+this.heightOffset-12+"px";
        }
    }
};



a10.ss={};
a10.ss.lastSuccessfulQuery=null;
a10.ss.currentQuery=null;
a10.ss.currentResults=new Array();
a10.ss.pauseTimeoutID=null;
a10.ss.selectedIndex=-1;
a10.ss.pageHasMadeRequest=false;
a10.ss.formSubmitted=false;
a10.ss.hidden=true;
a10.ss.PAUSE_PERIOD=201;
a10.ss.FADE_SPEED=0.07;
a10.ss.skipNextArrowKeyEvent=false;
a10.ss.inputId="";
a10.ss.uiId="";
a10.ss.uiBodyId="";
a10.ss.offsetLeft=10;
a10.ss.ssQsrcDefault="2352";
a10.ss.ssQsrcHP="178";
a10.ss.qsrc=a10.ss.ssQsrcDefault;
a10.ss.popupIE6Cover="";
a10.ss.popupIE6CoverTarget="";
a10.ss.init=function(D,A,B,C){
	a10.ss.inputId=D;
	a10.ss.uiId=A;
	a10.ss.uiBodyId=B;
	var inputOffset = $("#"+D).offset();
    var AA = $$(A);
	AA.style.display = "none";
    AA.style.position = "absolute";
	AA.style.left = "" + inputOffset.left + "px";
    AA.style.top = "" + (inputOffset.top + $("#"+D).outerHeight()) + "px";
	if("event" in a10){
		a10.event.addListener(document.getElementById(D),"keyup",a10.ss.searchSuggestion);
		a10.event.addListener(document.documentElement,"click",a10.ss.closePopup);
	}
	if(C){
		a10.ss.PAUSE_PERIOD=C;
	}
};
a10.ss.closePopup=function(){
	var A=$$(a10.ss.uiId);
	if(A){
		A.style.display="none";
	}
	if(a10.browser.isIE6()&&a10.ss.popupIE6Cover){
		a10.ss.popupIE6Cover.hide();
	}
};
a10.ss.searchSuggestion=function(B){
	var A=Cookie.getCookie("gset");
	if(a10.ss.hp=="true"){
		a10.ss.qsrc=a10.ss.ssQsrcHP;
	}
	if((!A)||(A.indexOf("ss=0")==-1)){
		if(!B){
			B=window.event;
		}
		switch(B.keyCode){
			case 38:
				if((navigator.userAgent.indexOf("AppleWebKit")!=-1)&&(navigator.appVersion.indexOf("Version/")==-1)){
					if(a10.ss.skipNextArrowKeyEvent){
						a10.ss.skipNextArrowKeyEvent=false;
						return ;
					}
					else{
						a10.ss.skipNextArrowKeyEvent=true;
					}
				}
				a10.ss.handleKey(38);
				return;
			case 40:
				if((navigator.userAgent.indexOf("AppleWebKit")!=-1)&&(navigator.appVersion.indexOf("Version/")==-1)){
					if(a10.ss.skipNextArrowKeyEvent){
						a10.ss.skipNextArrowKeyEvent=false;
						return;
					}
					else{
						a10.ss.skipNextArrowKeyEvent=true;
					}
				}
				a10.ss.handleKey(40);
				return;
			case 13:
				a10.ss.formSubmitted=true;
				a10.ss.closePopup();
				return;
			case 9:
			case 18:
				return;
		}
		if(a10.ss.currentQuery==$$(a10.ss.inputId).value){
			return;
		}
		a10.ss.currentQuery=$$(a10.ss.inputId).value;
		if(a10.ss.pauseTimeoutID){
			clearTimeout(a10.ss.pauseTimeoutID);
			a10.ss.pauseTimeoutID=null;
		}
		a10.ss.pauseTimeoutID=setTimeout(function(){
			a10.ss.pauseTimeoutID=null;
			a10.ss.searchSuggestHandler();
		},a10.ss.PAUSE_PERIOD);
	}
};
a10.ss.updateQsrc=function(){
	if(a10.ss.selectedIndex!=-1){
		var A=document.getElementById("qsrc");
		if(A){
			A.value=a10.ss.qsrc;
		}
	}
};
a10.ss.select=function(C){
	var A=a10.ss.currentResults.length;
	function D(E){
		if(E>=0&&E<A){
			var el=a10.ss.currentResults[E];
			el.className="";
		}
	}
	D(a10.ss.selectedIndex);
	var B=a10.ss.lastSuccessfulQuery;
	if(C>=0&&C<A){
		var el=a10.ss.currentResults[C];
		var links=el.getElementsByTagName("a");
		if(links.length==0){
			return 0;
		}
		el.className="selected";
	}
	else{
		a10.ss.setValue($$(a10.ss.inputId),B);
	}
	a10.ss.selectedIndex=C;
	return 1;
};
a10.ss.handleKey=function(F){
	var B=38;
	var C=40;
	var A=a10.ss.currentResults.length;
	function D(G){
		if(G<-1){
			return A-1;
		}
		else{
			if(G>=A){
				return -1;
			}
			else{
				return G;
			}
		}
	}
	if($$(a10.ss.uiId).style.display!="none"&&A>0){
		var E=a10.ss.selectedIndex, delta = 0;
		if(F==B){
			delta=-1;
		}
		else{
			if(F==C){
				delta=+1;
			}
		}
		E+=delta;
		E=D(E);
		if(!a10.ss.select(E)){
			E+=delta;
			E=D(E);
			a10.ss.select(E);
		}
		a10.ss.copyToInput(E);
	}
};
a10.ss.copyToInput=function(A){
	if(A<0){
		return;
	}
	var el=a10.ss.currentResults[A];
	var link=el.getElementsByTagName("a")[0];
	var query=link.innerText||link.textContent;
	a10.ss.setValue($$(a10.ss.inputId),query);
	a10.ss.currentQuery=query;
};
a10.ss.searchSuggestHandler=function(){
	function D(G,F){
		for(var E=0; E<F.length; E++){
			if(F[E].innerHTML.toLowerCase().indexOf(G.toLowerCase())!=0){
				return false;
			}
		}
		return true;
	}
	var C=$$(a10.ss.inputId).value;
	var B;
	if(a10.ss.currentResults.length>0&&((C==a10.ss.lastSuccessfulQuery)||(C.length>a10.ss.lastSuccessfulQuery.length&&D(C,a10.ss.currentResults)))){
		return ;
	}
	var A=a10.ss.lastSuccessfulQuery ? a10.ss.lastSuccessfulQuery.toLowerCase() : null;
	if(a10.ss.currentResults.length==0&&C.toLowerCase().indexOf(A)==0){
		return;
	}
	if(C.length>0){
		a10.ss.pageHasMadeRequest=true;
		a10.ss2.execute(C,_country,_language);
	}
	else{
		a10.ss.lastSuccessfulQuery=null;
		a10.ss.currentResults=new Array();
		if($$(a10.ss.uiId).style.display!="none"){
			a10.ss.transitionSuggestion(true);
		}
	}
};
function suggestCallBack(C){
	if(a10.ss.formSubmitted){
		return;
	}
	if(!a10.ss.pageHasMadeRequest){
		return;
	}
	var E=a10.ss2.getQuery(C);
	if(E!=$$(a10.ss.inputId).value.toLowerCase()){
		return;
	}
	a10.ss.selectedIndex=-1;
	a10.ss.lastSuccessfulQuery=E;
	var A=a10.ss2.getSuggestions(C);
	if(A.length>0){
		var D="";
		var _origin=$F("o");
		if(_origin==""){
			_origin=0;
		}
		var _partnerID=$F("l");
		if(_partnerID==""){
			_partnerID="dir";
		}
		var _siteID=$F("siteid");
		if(_siteID==""){
			_siteID="";
		}
		else{
			_siteID="&siteid="+$F("siteid");
		}
		D+=a10.ss2.createSuggestions(A,a10.ss.qsrc,_origin,_partnerID,_siteID,a10.ss.getCountry());
		if(typeof _disableSSApplicable=="undefined"){
			_disableSSApplicable=true;
		}
		if(_disableSSApplicable){
			var B=Cookie.getCookie("gset");
			if((!B)||(B.indexOf("ss=0")==-1)){
				D+="<div id='disablediv' style='padding-bottom:4px;'><a id='ssdisable' href='#'  onclick='a10.ss.turnOffSS()' class='L3' style='font-family:arial;font-size:9px;'>"+_disableSSMsg+"</a></div>";
			}
		}
		$$(a10.ss.uiBodyId).innerHTML=D;
		a10.ss.currentResults=$$("suggestlist");
		if($$(a10.ss.uiId).style.display=="none"){
			a10.ss.transitionSuggestion(false);
		}
	}
	else{
		a10.ss.clearSuggestions();
	}
}
a10.ss.getCountry=function(){
	var B=$$("alltop")||$$("all");
	var A=$$("ctrytop")||$$("ctry");
	var D=$$("langtop")||$$("lang");
	if(!B||!A||!D){
		return "";
	}
	var C="all";
	if(B.checked){
		C="all";
	}
	else{
		if(A.checked){
			C="ctry";
		}
		else{
			if(D.checked){
				C="lang";
			}
		}
	}
	return C;
};
a10.ss.clearSuggestions=function(){
	a10.ss.currentResults=new Array();
	$$(a10.ss.uiBodyId).innerHTML='<div class="lh18"><span style="color:gray;padding-left:6px;">'+_noSSFoundMsg+'</span></div><div class="pb20" />';
};
a10.ss.reset=function(){
	a10.ss.currentResults=new Array();
	if(a10.ss.pauseTimeoutID){
		clearTimeout(a10.ss.pauseTimeoutID);
		a10.ss.pauseTimeoutID=null;
	}
	a10.ss.pageHasMadeRequest=false;
	a10.ss.lastSuccessfulQuery=null;
	a10.ss.hidden=true;
};
a10.ss.transitionSuggestion=function(A){
	a10.ss.hidden=A;
	if(A){
		a10.ss.closePopup();
		a10.ss.transitionSuggestionDone();
	}
	else{
		a10.ss.transitionSuggestionDone();
	}
};
a10.ss.setValue=function(A,B){
	A.value=B;
	if(navigator.userAgent.indexOf("AppleWebKit")&&A.setSelectionRange){
		A.setSelectionRange(A.value.length,A.value.length);
	}
};
a10.ss.transitionSuggestionDone=function(){
	if(!a10.ss.hidden){
		$$(a10.ss.uiId).style.display="";
	}
};
a10.ss.turnOffSS=function(){
	var C=Cookie.getCookie("gset");
	var A=new Date();
	A.setFullYear(A.getFullYear()+2);
	var E="ss=0";
	if((C)){
		if(C.indexOf("&ss=1")!=-1){
			var B=C.split("&ss=1");
			E=B.join("");
		}
		else{
			if(C.indexOf("&ss=0")!=-1){
				var B=C.split("&ss=0");
				E=B.join("");
			}
		}
		E+="&ss=0";
	}
	Cookie.deleteCookie("gset","/");
	document.cookie="gset="+E+"; expires="+A.toGMTString()+"; path=/; domain=.ask.com";
	var D=$$("searchfor");
	if(D){
		D.focus();
	}
	
	bReopen=true;
	
};
if(typeof ssloaded!="undefined"){
	$(document).ready(ssloaded);
}