(function(){
    var sources = [
            "common/js/underscore-1.5.2.min.js",
            "js/messaging.js",
            "js/scriptInjector.js",
            "contentScript.js"
        ],
        injector0 = function(){
            var docFragment = document.createDocumentFragment();

            sources.forEach(function(src){
                var script = document.createElement('script');
                script.setAttribute('src', src);
                script.setAttribute('type', 'text/javascript');
                docFragment.appendChild(script);
            });

            document.body.appendChild(docFragment);
        },
        appendScripts = function(sources){
            var src = sources.shift();
            if (src){
                var script = document.createElement('script');
                script.setAttribute('type', 'text/javascript');
                script.setAttribute('src', src);
                script.addEventListener('load', function(){appendScripts(sources);});
                document.body.appendChild(script);
            }
        },
        injector = function(){
            appendScripts(sources);
        };

    if (document.URL.indexOf('cachingNewTab') == -1){
        document.addEventListener('DOMContentLoaded', injector);
    }
})();
