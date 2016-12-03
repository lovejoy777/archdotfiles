
RadioParser = {
    parse: function(text) {
        if (!text) {
            return;
        }

        // Parse the text as a JSON object.
        var object = JSON.parse(text);

        // Use the RadioTime parser to further parse this object.
        return RadioParser.RadioTime.convert(object);
    }
};

RadioParser.RadioTime = {
    convert: function(object) {
        if (object.body) {
            var rawItems = object.body;
            var items = this.rawItemsToItems(rawItems);
            items.status = object.head.status;
            return items;
        }
        return null;
    },

    rawItemsToItems: function(rawItems) {
        if (!rawItems) {
            return null;
        }

        var items = [];
        for (var k = 0; k < rawItems.length; k++) {
            var rawItem = rawItems[k];
            var item = this.rawItemToItem(rawItem);
            if (item) {
                items.push(item);
            }
        }
        return items;
    },

    rawItemToItem: function(rawItem) {
        var type = ItemType.parse(rawItem.type);

        if (rawItem.type == 'audio') {
            var favoriteStatus = rawItem.is_preset
                    ? RadioWidget.FavoriteStatus.active
                    : RadioWidget.FavoriteStatus.inactive;
            return {
                type: type,
                id: rawItem.preset_id || rawItem.guide_id,
                reliability: parseInt(rawItem.reliability),
                bitrate: parseInt(rawItem.bitrate),
                uri: rawItem.URL,
                name: rawItem.text,
                nowPlaying: rawItem.current_track,
                favoriteStatus: favoriteStatus,
                imageUri: rawItem.image
            };
        }

        return {
            type: type,
            name: rawItem.text,
            uri: rawItem.URL ? rawItem.URL + '&render=json' : null,
            childItems: this.rawItemsToItems(rawItem.children)
        };
    }
};

ItemType = {
    text: 'text',
    link: 'link',
    audio: 'audio',
    outline: 'outline',
    container: 'container',
    none: 'undefined',

    parse: function(s) {
        if (!s) {
            return this.none;
        }

        var t = this[s];
        if (typeof (t) === 'string') {
            return t;
        }
        alert('Unknown item type: ' + s);
        throw 'Unknown item type: ' + s;
    }
};
