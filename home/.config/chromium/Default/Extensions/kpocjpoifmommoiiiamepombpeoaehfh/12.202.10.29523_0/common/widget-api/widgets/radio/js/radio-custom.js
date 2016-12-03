var browseService = 'https://opml.radiotime.com/Browse.ashx?render=json';

window.config || (window.config = {});

config.get = function() {
    return config.LiveConfig;
};

config.extend = function(object) {
    for (var p in object) {
        this[p] = object[p];
    }
};

config.LiveConfig = {
    extend: config.extend,

    getResource: function(params) {
        params.scope = params.scope || this;
        this.context.getResource({
            url: params.uri,
            format: 'txt',
            success: function(response) {
                params.success.apply(params.scope, [{text: response.data}]);
            },
            error: function(error) {
                params.error.apply(params.scope, [
                    {text: error || error.message}
                ]);
            }
        });
    },

    showError: function(error) {
        this.context.handleError("radio-widget error: " + error.message || error);
    },

    closeWindow: function() {
        this.context.close();
    },

    handleLinkClick: function(uri) {
        this.context.navigate(uri);
    }
};

config.LiveConfig.extend({
    init: function(callback) {
        WidgetContextFactory.getWidgetContext(function(context) {
            this.context = context;
            context.getConfig(['maximumNumberOfDisplayedItems', 'featuredCategory', 'radioTimePartnerId', 'formats'], function(config) {
                this.extend(config);
                browseService += config.formats; // formats is in form '&formats=mp3'

                context.getStaticData(function(data) {
                    this.toolbarId = data.toolbarId;
                    this.partnerId = data.partnerId;
                    this.userContextualUriSuffix =
                        'partnerId=' + encodeURIComponent(config.radioTimePartnerId)
                        + '&serial=' + encodeURIComponent(data.toolbarId);

                    // init the featuredServiceUri
                    var uri;
                    if (this.featuredCategory)
                        uri = this.featuredServiceUrisByFeaturedCategory[this.featuredCategory];
                    if (!uri) {
                        uri = this.featuredServiceUrisByFeaturedCategory['top'];
                    }
                    this.featuredServiceUri = this.toUserContextualUri(uri);

                    // invoke callback
                    callback();
                }, this); // end getStaticData
            }, this); //end getConfig
        }, this); //end getWidgetContext
    },

    toUserContextualUri: function(uri) {
        var connector = uri.indexOf('?') >= 0 ? '&' : '?';
        if (!this.userContextualUriSuffix) throw "this.userContextualUriSuffix undefiedn";
        return uri + connector + this.userContextualUriSuffix;
    },

    getFeaturedServiceUri: function() {
        return this.featuredServiceUri;
    },

    getSectionServiceUri: function(sectionName) {
        var uri = sectionName == 'locations'
            ? browseService + '&id=r0'
            : browseService + '&c='
            + encodeURIComponent(sectionName);
        return this.toUserContextualUri(uri);
    },

    getSearchServiceUri: function(query) {
        var uri = 'https://opml.radiotime.com/Search.ashx?render=json&query='
            + encodeURIComponent(query);
        return this.toUserContextualUri(uri);
    },

    getFavoriteListServiceUri: function() {
        var uri = browseService + '&c=presets';
        return this.toUserContextualUri(uri);
    },

    getAddFavoriteServiceUri: function(id) {
        var uri = 'https://opml.radiotime.com/Preset.ashx?c=add&render=json' + this.formats + '&id='
            + encodeURIComponent(id);
        return this.toUserContextualUri(uri);
    },

    getRemoveFavoriteServiceUri: function(id) {
        var uri = 'https://opml.radiotime.com/Preset.ashx?c=remove&render=json' + this.formats + '&id='
            + encodeURIComponent(id);
        return this.toUserContextualUri(uri);
    },

    getReportServiceUri: function(id) {
        var uri = 'https://opml.radiotime.com/Report.ashx?render=json' + this.formats + '&c=wizard&id=' + encodeURIComponent(id);
        return this.toUserContextualUri(uri);
    },

    getMaximumNumberOfDisplayedItems: function() {
        return this.maximumNumberOfDisplayedItems;
    },

    play: function(station) {
        this.context.sendMessage('loadStation', {station: {
            name: station.name,
            uri: station.uri,
            id: station.id
        }});
    },

    fireReportingEvent: function() {
        var path = [];
        for (var k = 0; k < arguments.length; k++) {
            var arg = encodeURIComponent(arguments[k]);
            path.push(arg);
        }
        path = path.join('/');

        var uid = encodeURIComponent(this.toolbarId);
        var pid = encodeURIComponent(this.partnerId);
        var pixelUri = 'http://imgfarm.com/images/nocache/radio_widget/tr.gif';
        var uri = pixelUri + '?uid=' + uid + '&p=' + pid + '&a=' + path + '&rand=' + new Date().getTime();
        new Image().src = uri;
    },

    featuredServiceUrisByFeaturedCategory: {
        top: browseService + '&c=index,best',
        conservative: browseService + '&id=c57917',
        bestbets: browseService + '&id=c688891',
        christian: browseService + '&id=g271&filter=s:popular'
    }
});
