
(function(script){
    if (script.hasAttribute('log')){
        console.log(script.getAttribute('log'));
    }else{
        console.log('debug was here');
    }
})(document.currentScript);
