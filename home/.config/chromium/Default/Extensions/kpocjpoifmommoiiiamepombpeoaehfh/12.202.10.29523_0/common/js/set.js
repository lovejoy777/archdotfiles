
window.Set = function() {
    this.addAll(arguments.length == 1 && arguments[0].length ? arguments[0] : arguments);
};

window.Set.prototype = {
    items: {},

    addAll: function(items) {
        for (var k = 0; k < items.length; k++) {
            var item = items[k];
            this.add(item);
        }
    },

    add: function(item) {
        this.items[item] = '-';
    },

    remove: function(item) {
        delete this.items[item];
    },

    contains: function(item) {
        return !!this.items[item];
    }
};
