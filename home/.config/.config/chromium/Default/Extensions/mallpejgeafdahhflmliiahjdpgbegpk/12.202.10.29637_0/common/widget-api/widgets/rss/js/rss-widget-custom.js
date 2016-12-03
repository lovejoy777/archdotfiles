// Adapter around new widget API
RssWidget.config = {
	init: function(callbackFunction) {
        WidgetContextFactory.getWidgetContext(function(context) {
            this.context = context;
            context.getConfig(['feeds', 'title', 'titleIconUri', 'poweredBy', 'additionalCssUri', 'displayMode', 'layoutMode', 'extractImageFromDescription'],
                function(config) {
                    this.config = config;
                    callbackFunction();
                },
            this); // end getConfig
        }, this); // end getWidgetContext
	},

	// Config settings ///////////////////////////////////////////////////

	getRssInfos: function() {
		return this.config.feeds;
	},

	getTitle: function() {
		return this.config.title;
	},

	getTitleIconUri: function() {
		return this.config.titleIconUri;
	},

	isPoweredBy:function() {
		return this.config.poweredBy && this.config.poweredBy.name;
	},

	getPoweredBy: function() {
		return this.isPoweredBy() ? this.config.poweredBy.name : null;
	},

	getPoweredByUri: function() {
		return this.isPoweredBy() ? this.config.poweredBy.uri : null;
	},

	getPoweredByImg: function() {
		return this.isPoweredBy() ? this.config.poweredBy.img : null;
	},

	getAdditionalCssUri: function() {
		return this.config.additionalCssUri;
	},

	getDisplayMode: function() {
		return this.config.displayMode || config.DisplayMode.Full; // Title;
	},

	getLayoutMode: function() {
		return this.config.layoutMode || config.LayoutMode.Standard; // Menu;
	},

	// Page interactions ///////////////////////////////////////////////////

	closeWindow: function() {
        this.context.close();
	},

	handleLinkClick: function(uri) {
        this.context.navigate(uri);
	},

	getResource: function(params) {
        params.scope = params.scope || this;
        this.context.getResource({
            url: params.uri,
            format: "xml",
            success: function(response) {
                params.success({xml: response.data});
            },
            error: function(error) {
                //TODO: revise expression - {text: error || error.message}
                params.error({text: error || error.message});
            }
        });
	},

    showError: function(error) {
        //TODO: revise expression - ("rss-widget error: " + error.message || error)
        this.context.handleError("rss-widget error: " + error.message || error);
    }
};