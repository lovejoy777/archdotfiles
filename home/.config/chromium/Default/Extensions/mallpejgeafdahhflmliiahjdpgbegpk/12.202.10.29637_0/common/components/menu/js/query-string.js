
QueryString = {
    toObject: function(s) {
        var o = new Object();
        var pairs = s.split('&');
        for (var k = 0; k < pairs.length; k++) {
            var pair = pairs[k];

            var index = pair.indexOf('=');
            if (index >= 0) {
                var key = pair.substring(0, index);
                var value = pair.substring(1 + index);

                key = decodeURIComponent(key);
                value = decodeURIComponent(value);

                if (o[key]) {
                    if (o[key].length && o[key].push) {
                        o[key].push(value);
                    } else {
                        o[key] = [o[key], value];
                    }
                } else {
                    o[key] = value;
                }
            } else {
                pair = decodeURIComponent(pair);
                o[pair] = true;
            }
        }
        return o;
    },

    fromObject: function(o) {
        var a = [];
        for (var key in o) {
            var value = o[key];

            key = encodeURIComponent(key);
            value = encodeURIComponent(value);

            a.push(key + '=' + value);
        }
        return a.join('&');
    }
};
