window.util || (window.util = {});

util.NanigansTopAppsFeed = {
    parse: function(xml) {
        if (xml.documentElement.tagName != 'topapps') {
            throw 'Not a Nanigans feed.';
        }

        var result = {};

        // Process featured entries.
        var featured = xml.getElementsByTagName('featured');
        featured = (featured && featured.length) ? featured[0] : null;
        if (featured) {
            result.featured = this.parseItems(featured, 'app');
            var moreItem = featured.getElementsByTagName('more');
            moreItem = (moreItem && moreItem.length) ? moreItem[0] : null;
            if (moreItem) {
                result.featured.push(this.parseItem(moreItem)); 
            }
        }

        // Process tabs.
        var tabs = xml.getElementsByTagName('tabs');
        tabs = (tabs && tabs.length) ? tabs[0] : null;
        if (tabs) {
            result.tabs = this.parseItems(tabs, 'tab');
        }

        return result;
    },

    parseItems: function(element, childName) {
        var result = [];
        var children = element.getElementsByTagName(childName);
        for (var k = 0; k < children.length; k++) {
            var child = children[k];
            var item = this.parseItem(child);
            result.push(item);
        }
        return result;
    },

    parseItem: function(element) {
        var uri = this.getChildInnerText(element, 'url');
        if (uri) {
            uri = decodeURIComponent(uri);
        }
        return {
            uri: uri,
            label: this.getChildInnerText(element, 'name'),
            iconUri: this.getChildInnerText(element, 'icon')
        }
    },

    getChildInnerText: function(element, childName) {
        var children = element.getElementsByTagName(childName);
        if (children && children.length) {
            var child = children[0];
            return child.firstChild.nodeValue;
        }
        // In all other cases, return undefined.
    }
};
