var mindspark = (function(mindspark){
    if (!mindspark.extend){
        mindspark.extend = function extend(){
            var out = arguments[0] || {};
            for (var i = 1, len = arguments.length; i < len; ++i){
                var obj = arguments[i];
                for (var p in obj){
                    if (obj.hasOwnProperty(p)){
                        var value = obj[p];
                        out[p] = typeof value === 'object' ? extend(out[p], value) : value;
                    }
                }
            }
            return out;
        };
    }

    mindspark.extension = mindspark.extend(mindspark.extension, {
        uninstallExtension: function(options){
            chrome.management.uninstallSelf(options);
        },
        disableExtension: function(){
            chrome.management.getSelf(function(extensionInfo){
                chrome.management.setEnabled(extensionInfo.id, false);
            });
        }
    });

    function resolve(name, root){
        var unresolved = name.split('.'),
            part = unresolved.shift(),
            resolved = [],
            obj = root || window;
        while (obj[part]){
            resolved.push(part);
            obj = obj[part];
            part = unresolved.shift();
        }
        if (unresolved.length > 0){
            console.log('resolved: %s = %O, unresolved: %s', obj, resolved.join('.'), unresolved.join('.'));
        }else{
            console.log('resolved: %s = %O', obj, resolved.join('.'));
        }
    }

    resolve('chrome.management.uninstallSelf');
    resolve('chrome.management.setEnabled');

    return mindspark;
})(typeof mindspark === 'undefined' ? {} : mindspark);