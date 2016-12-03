topAppsWidget.config = {
    getFeedUri: function() {
        return this.config.feedUri || 'http://topapp.nanigans.com/mindspark.xml';
    },

    getResource: function(params) {
        params.scope = params.scope || this;
        this.context.getResource({
            url: params.uri,
            format: 'xml',
            success: function(response) {
                params.success.call(params.scope, {xml: response.data});
            },
            error: function(error) {
                params.error.call(params.scope, {text: error || error.message});
            }
        }, params.scope);
    },

    showError: function(error) {
        this.context.handleError('top-apps error: ' + error.message || error);
    },

    closeWindow: function() {
        this.context.close();
    },

    handleLinkClick: function(uri) {
        this.closeWindow();
        this.context.navigate(uri);
    },

    setHeight: function(height) {
        this.config.height = height;
        this.context.setSize(this.config.width, height + 6);
    },

    init: function(callbackFunction) {
        WidgetContextFactory.getWidgetContext(function(context) {
            this.context = context;
            context.getConfig(['width', 'height', 'feedUri'], function(config) {
                    this.config = config;
                    callbackFunction();
                    this.context.setSize(this.config.width, this.config.height);

                },
                this); //end getConfig
        }, this); //end getWidgetContext

    }
};