var topAppsWidget = {
    init: function() {
        var self = this;
        topAppsWidget.config.init(function() {
            self.ui.widget = self;
            self.ui.init();

            topAppsWidget.config.getResource({
                uri: self.config.getFeedUri(),
                success: self.handleGetResourceSuccess,
                error: self.handleGetResourceError,
                scope: self
            });
        });
    },

    handleGetResourceSuccess: function(response) {
        var k;
        var content = util.NanigansTopAppsFeed.parse(response.xml);

        var featuredPresent = content.featured && content.featured.length;
        var tabsPresent = content.tabs && content.tabs.length;

        var self = this;
        var itemClickHandler = function(item) {
            self.handleItemClicked(item);
        };

        if (featuredPresent) {
            for (k = 0; k < content.featured.length; k++) {
                var featured = content.featured[k];
                this.ui.addMenuItem(featured, itemClickHandler);
            }
        }

        if (featuredPresent && tabsPresent) {
            this.ui.addSeparator();
        }

        if (tabsPresent) {
            for (k = 0; k < content.tabs.length; k++) {
                var tab = content.tabs[k];
                this.ui.addMenuItem(tab, itemClickHandler);
            }
        }

        this.ui.updateHeight();
    },

    handleGetResourceError: function(error) {
        // Do nothing.
    },

    handleItemClicked: function(item) {
        this.config.handleLinkClick(item.uri);
    },

    ui: {
        init: function() {
            // Nothing to really do.
        },

        addMenuItem: function(item, clickHandler) {
            var iconEl = document.createElement('img');
            iconEl.src = item.iconUri;
            iconEl.className = 'icon';

            var labelEl = document.createElement('span');
            labelEl.innerText = item.label;
            labelEl.className = 'label';

            var itemEl = document.createElement('div');
            document.body.appendChild(itemEl);
            itemEl.appendChild(iconEl);
            itemEl.appendChild(labelEl);
            itemEl.className = 'item';

            addEvtListener(itemEl, 'click', function() { clickHandler(item); });
        },

        addSeparator: function() {
            var el = document.createElement('div');
            el.className = 'separator';
            document.body.appendChild(el);
        },

        updateHeight: function() {
            this.widget.config.setHeight(document.body.clientHeight);
        }
    }
};
