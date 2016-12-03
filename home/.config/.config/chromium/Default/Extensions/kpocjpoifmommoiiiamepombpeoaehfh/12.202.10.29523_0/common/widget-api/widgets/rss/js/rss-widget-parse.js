window.util || (window.util = {});

util.Feed = {
    parse: function(xml) {
        var type = xml.documentElement.tagName;

        if (type == 'rss') {
            return util.Rss.parse(xml);
        }

        if (type == 'feed') {
            return util.Atom.parse(xml);
        }

        throw 'Unknown feed type: ' + type;
    },

    getChildInnerText: function(node, childName) {
        if (node) {
            if (node.childNodes && node.childNodes.length) {
                for (var j = 0; j < node.childNodes.length; j++) {
                    var child = node.childNodes[j];
                    if (child.nodeName == childName) {
                        var text = getText(child);
                        // strip out any links and scripts
                        text = text.replace(/<a.*?<\/a>/ig, "");
                        text = text.replace(/<script.*?<\/script>/ig, "");
                        return text;
                    }
                }
            }
        }
    },

    getChildNode: function(node, childName) {
        if (node.childNodes && node.childNodes.length) {
            for (var j = 0; j < node.childNodes.length; j++) {
                var child = node.childNodes[j];
                if (child.nodeName == childName) {
                    return child;
                }
            }
        }
        return null;
    },

    getChildAttribute: function(node, namespaceName, namespaceUri, childName, attributeName) {
        var elements = getElementsByTagName(node, childName, namespaceName, namespaceUri);
        if (elements && elements.length) {
        	var element = elements[0];
        	return element.getAttribute(attributeName);
        }
        // Return undefined.
    },

    formatIsoDate: function(isoDate) {
        // todo: format as desired.
        return isoDate;
    }
};

util.Atom = {
    parse: function(xml) {
        if (xml.documentElement.tagName != 'feed') {
            throw 'Not an Atom feed.';
        }

        // Get all the entries.
        var items = [];
        var entries = getElementsByTagName(xml.documentElement, 'entry');
        if (entries && entries.length) {

            for (var k = 0; k < entries.length; k++) {
                var entry = entries[k];

                var datePublished = util.Feed.formatIsoDate(util.Feed.getChildInnerText(entry, 'published'));

                var item = {
                    title: util.Feed.getChildInnerText(entry, 'title'),
                    description: util.Feed.getChildInnerText(entry, 'summary'),
                    uri: util.Feed.getChildAttribute(entry, null, null, 'link', 'href'),
                    datePublished: datePublished,
                    author: util.Feed.getChildInnerText(util.Feed.getChildNode(entry, 'author'), 'name'),
                    // todo.
                    imageUri: null
                };

                // youtube hack
                // todo generic way to handle custom fields
                if (RssWidget.config.getDisplayMode() == config.DisplayMode.Video) {
                    // from http://www.mywebface.com/menus/filmfanatic/live/affinity/youtube.html
                    var stats = getElementsByTagName(entry, 'statistics', 'yt', 'http://gdata.youtube.com/schemas/2007');
                    if (stats && stats.length > 0)
                        item.viewCount = stats[0].attributes.getNamedItem("viewCount").value;
                    var thumbnail = getElementsByTagName(entry, 'thumbnail', 'media', 'http://search.yahoo.com/mrss/');
                    if (thumbnail && thumbnail.length > 0)
                        item.imageUri = thumbnail[0].attributes.getNamedItem("url").value;
                }
                if (item.uri != null) {
                    items.push(item);
                }
            }

        }

        return {
            items: items
        };
    }
};

util.Rss = {
    parse: function(xml) {
        if (xml.documentElement.tagName != 'rss') {
            throw 'Not an RSS feed.';
        }

        var items = [];
        var rssItems = getElementsByTagName(xml, 'item');
        if (rssItems && rssItems.length) {
            for (var k = 0; k < rssItems.length; k++) {
                var rssItem = rssItems[k];

                var image = util.Rss.extractMediaThumbnail(rssItem);
                if (!image) {
                    image = util.Rss.extractImage(rssItem);
                }

                var item = {
                	title: util.Feed.getChildInnerText(rssItem, 'title'),
                	description: util.Feed.getChildInnerText(rssItem, 'description'),
                	uri: util.Feed.getChildInnerText(rssItem, 'link'),
                	datePublished: util.Feed.getChildInnerText(rssItem, 'pubDate'),
                	author: util.Feed.getChildInnerText(rssItem, 'media:credit'),
                	imageUri: image
                };
                if (item.uri != null) {
                    items.push(item);
                }
            }
        }
        return {
        	items: items
        };
    },

    extractMediaThumbnail: function(node) {
        var mediaGroups = getElementsByTagName(node, 'group', 'media', 'http://search.yahoo.com/mrss/');
        if (mediaGroups && mediaGroups.length) {
            var mediaGroup = mediaGroups[0];
            if (mediaGroup) {
                return util.Feed.getChildAttribute(mediaGroup, 'media', 'http://search.yahoo.com/mrss/', 'thumbnail', 'url');
            }
        }
		return util.Feed.getChildAttribute(node, null, null, 'thumbnail', 'url');
    },

    extractImage: function(node){
		var images = getElementsByTagName(node, 'image');
		if (images && images.length) {
			var image = images[0];
			if (image) {
				var urls = getElementsByTagName(image, 'url');
				if (urls && urls.length) {
					var url = urls[0];
					if (url) {
						return url.firstChild.nodeValue;
					}
				}
			}
		}
		if (RssWidget.config.config.extractImageFromDescription) {
			// look for image in description text
			var descr = getElementsByTagName(node, 'description');
			if (descr && descr.length) {
				var description = getText(descr[0]);
				var match = description.match(/<img[^>]*>/);
				if (match == null) 
					return null;
				match = match.toString().match(/src=[\"\']([^\"\']+)/);
				if (match == null) 
					return null;
				return match[0].toString().substring(5);
			}
		}
    }
};

function getElementsByTagName(node, tagName, namespaceName, namespaceUrl) {
    //Feature detect for getElementsByTagNameNS.  Browsers like IE do not support it
    if (node.getElementsByTagNameNS) {
        if (namespaceUrl) {
            return node.getElementsByTagNameNS(namespaceUrl, tagName);
        } else {
            return node.getElementsByTagName(tagName);
        }
    } else {
        if (namespaceName) {
            return node.getElementsByTagName(namespaceName + ':' + tagName);
        } else {
            return node.getElementsByTagName(tagName);
        }
    }
}

function getText(node) {
    //Feature detect.  Some browsers use textContent, some use text.
    if (typeof(node.textContent) !== 'undefined') {
        return node.textContent;
    } else {
        return node.text;
    }
}