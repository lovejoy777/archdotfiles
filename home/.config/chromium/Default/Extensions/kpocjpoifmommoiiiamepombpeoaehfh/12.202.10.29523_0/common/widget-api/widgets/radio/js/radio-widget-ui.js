window.RadioWidget.ui = {
    init: function(config) {
        this.config = config;

        // Add CSS class "msie7" to the body if IE7 is detected.
        var ie7 = navigator.appVersion.indexOf('MSIE 7.') >= 0 || navigator.appVersion.indexOf('MSIE 6.') >= 0;
        var cssClass = ie7 ? 'msie7' : '';
        this.setCssClass(document.body, cssClass);
        document.body.originalClass = cssClass;

        this.items = document.getElementById('items');
        this.spinner = document.getElementById('spinner');
        this.error = document.getElementById('error');
        this.retry = document.getElementById('retry');

        this.toolbar = document.getElementById('toolbar');
        this.toolbarIcon = document.getElementById('toolbar-icon');
        this.breadcrumb = document.getElementById('breadcrumb');
        this.back = document.getElementById('back');

        var featuredTab = document.getElementById('featured-tab');
        var localTab = document.getElementById('local-tab');
        var locationsTab = document.getElementById('locations-tab');
        var musicTab = document.getElementById('music-tab');
        var talkTab = document.getElementById('talk-tab');
        var sportsTab = document.getElementById('sports-tab');

        this.tabs = [
            featuredTab,
            localTab,
            locationsTab,
            musicTab,
            talkTab,
            sportsTab
        ];

        this.searchForm = document.getElementById('search-form');

        var searchBoxBlurHandler = this.createSearchBoxBlurHandler();
        var searchBoxFocusHandler = this.createSearchBoxFocusHandler();
        this.searchBox = document.getElementById('search-box');
        addEvtListener(this.searchBox, 'blur', searchBoxBlurHandler);
        addEvtListener(this.searchBox, 'focus', searchBoxFocusHandler);
        // Simulate a blur to correctly initialize the Search box.
        searchBoxBlurHandler();

        this.searchButton = document.getElementById('search-button');
        this.favoritesAction = document.getElementById('favorites-action');
    },

    getSearchBoxValue: function() {
        var empty = this.searchBox.className == 'empty';
        return empty ? '' : this.searchBox.value;
    },

    createSearchBoxBlurHandler: function() {
        var self = this;
        return function() {
            var empty = !self.searchBox.value;
            if (empty) {
                self.setCssClass(self.searchBox, 'empty');
                self.searchBox.value = 'Search';
            }
        }
    },

    createSearchBoxFocusHandler: function() {
        var self = this;
        return function() {
            var cssClass = self.searchBox.className;
            if (cssClass == 'empty') {
                self.searchBox.value = '';
            }
            self.setCssClass(self.searchBox, '');
        }
    },

    setCssClass: function(element, className) {
        element.setAttribute('class', className);
        element.className = className;
    },

    getTabSectionName: function(tab) {
        return tab.getAttribute('rel');
    },

    getTabName: function(tab) {
        return tab.innerText;
    },

    deselectAllTabs: function() {
        for (var k = 0; k < this.tabs.length; k++) {
            var tab = this.tabs[k];
            this.setCssClass(tab.parentNode, 'tab');
        }
    },

    selectTab: function(tab) {
        this.setCssClass(tab.parentNode, 'selected tab');
    },

    hideToolbar: function() {
        this.setCssClass(this.toolbar, 'hidden');
        this.setCssClass(document.body, document.body.originalClass);
    },

    showToolbar: function() {
        this.setCssClass(this.toolbar, '');
        this.setCssClass(document.body, 'toolbar-visible ' + document.body.originalClass);
    },

    showItems: function() {
        this.hideAll();
        this.setCssClass(this.items, '');
    },

    showSpinner: function() {
        // We show the spinner with a delay.
        var self = this;
        this.spinnerTimeout = setTimeout(function() {
            self.hideAll();
            self.setCssClass(self.spinner, '');
        }, 500);
    },

    cancelSpinner: function() {
        if (this.spinnerTimeout) {
            clearTimeout(this.spinnerTimeout);
            delete this.spinnerTimeout;
        }
    },

    showError: function() {
        this.hideAll();
        this.setCssClass(this.error, '');
    },

    hideAll: function() {
        this.cancelSpinner();
        this.setCssClass(this.toolbarIcon, 'hidden');
        this.setCssClass(this.items, 'hidden');
        this.setCssClass(this.spinner, 'hidden');
        this.setCssClass(this.error, 'hidden');
    }
};
