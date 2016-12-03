window.RadioWidget = {
    // Favorite states.
    FavoriteStatus: {
        inactive: 'inactive',
        pending: 'pending',
        unknown: 'unknown',
        active: 'active',

        toggle: function(status) {
            if (status == this.active) {
                return this.inactive;
            }
            if (status == this.inactive) {
                return this.active;
            }
            if (status == this.unknown) {
                return this.unknown;
            }
            throw 'Cannot toggle unknown status: ' + status;
        }
    },

    // The navigation path records the navigation choices made by the user down
    // the tree of options and is used by the Back function. Each object in the
    // list contains sufficient information to reconstruct the state when the
    // corresponding item is selected.
    navigationPath: [],

    // The handlers associated with each of the sections (tabs).
    sectionConfigurations: {},

    // Contains the unique identifiers of the items that are, at any time, a
    // part of the user's favorites. The collection is constructed on an
    // ongoing basis, as more and more items become visited.
    favorites: new Set(),

    init: function() {
        // Pointer to context object.
        var self = this;
        
        // Initialize.
        this.config = config.get();
        this.config.init(function() {
	        self.ui.init(self.config);
	
	        // Until initialization is complete asynchronously, disable any as yet
	        // uninitialized components that could cause the widget to be navigated
	        // away from.
	        self.ui.searchForm.onsubmit = function() {
	            return false;
	        };
	
	        // Initialize favorites item.
	        self.favoritesItem = {
	            uri: self.config.getFavoriteListServiceUri(),
	            name: 'My Stations'
	        };
	
	        // Clicking the back button results in a back navigation.
	        addEvtListener(self.ui.back, 'click', function() {
	            self.navigateBack();
	        });
	
	        // Submitting the Search form may trigger a click.
	        self.ui.searchForm.onsubmit = function() {
	            self.search();
	            return false;
	        };
	
	        // Clicking on the favorites action triggers the Show Favorites action.
	        self.ui.favoritesAction.onclick = function() {
	            self.showFavorites();
	            return false;
	        };
	
	       // Create specific presentation handlers for the well known sections.
	        self.sectionConfigurations.featured = {
	            handler: self.featuredSectionHandler
	        };
	
	        for (var k = 0; k < self.ui.tabs.length; k++) {
	            // Get the tab element under consideration.
	            var tab = self.ui.tabs[k];
	
	            // Listen to the click event on each tab.
	            addEvtListener(tab.parentNode, 'click', self.createTabClickHandler(tab));
	
	            // Get the name of the section corresponding to the given tab.
	            var sectionName = self.ui.getTabSectionName(tab);
	
	            // If the section under consideration is well known, do not assign
	            // a handler to it, as one has already been assigned in the step
	            // preceding this loop. Otherwise, assign a list handler to it.
	            var wellKnownSection = !!self.sectionConfigurations[sectionName];
	            if (!wellKnownSection) {
	                // Infer the URI of the root item corresponding to the section
	                // under consideration.
	                var serviceUri = self.config.getSectionServiceUri(sectionName);
	
	                // Create a root item based on information for this tab.
	                var rootItem = {
	                    name: self.ui.getTabName(tab),
	                    hiddenInBreadcrumb: true,
	                    uri: serviceUri
	                };
	
	                // Associate the root item information, as well as the default
	                // handler, to the section under consideration.
	                self.sectionConfigurations[sectionName] = {
	                    handler: self.itemListSectionHandler,
	                    rootItem: rootItem
	                };
	            }
	        }
	
	        if (self.ui.tabs.length) {
	            // Force a click of the first tab.
	            var selectedTab = self.ui.tabs[0];
	            self.handleTabClicked(selectedTab);
	        }
        });
    },

    createTabClickHandler: function(tab) {
        var self = this;
        return function() {
            self.handleTabClicked(tab);
            return false;
        };
    },

    showFavorites: function() {
        // Clear any navigation path.
        this.navigationPath = [];

        // Sorry, no more active tab.
        this.ui.deselectAllTabs();

        // Force a refresh of the favorites.
        delete this.favoritesItem.childItems;

        // Add the heart icon to the breadcrumb after the fact.
        var self = this;
        var navigateCallback = function() {
            self.ui.setCssClass(self.ui.toolbarIcon, 'favorites');
        };

        // Navigate to the item representing the search action.
        this.navigateTo(this.favoritesItem, navigateCallback);
    },

    search: function() {
        var query = this.ui.getSearchBoxValue();
        if (query) {
            var item = {
                uri: this.config.getSearchServiceUri(query),
                name: 'Search: ' + query
            };

            // Clear any navigation path.
            this.navigationPath = [];

            // Sorry, no more active tab.
            this.ui.deselectAllTabs();

            // Navigate to the item representing the search action.
            this.navigateTo(item);
        }
    },

    updateBreadcrumb: function() {
        var a = [];
        for (var k = 0; k < this.navigationPath.length; k++) {
            var item = this.navigationPath[k];
            if (!item.hiddenInBreadcrumb) {
                a.push(item.name);
            }
        }

        if (a.length) {
            // There is a breadcrumb to show.
            this.ui.breadcrumb.innerText = a.join(' > ');
            this.ui.showToolbar();

            // Decide whether the back function should be visible.
            var backButtonHidden = this.navigationPath.length == 1;
            this.ui.setCssClass(this.ui.toolbar, backButtonHidden ? 'at-root' : '');
        } else {
            // There is no breadcrumb to show.
            this.ui.hideToolbar();
        }
    },

    navigateBackOnce: function() {
        var count = this.navigationPath.length;
        if (count > 1) {
            // It is possible to navigate back.

            // Remove current item from navigation path.
            this.navigationPath.pop();

            // Pop the new current item from the navigation path. It will be
            // pushed back as part of the navigateTo call.
            var currentItem = this.navigationPath.pop();

            // Navigate to the new current item.
            this.navigateTo(currentItem);
        }
    },

    navigateBack: function() {
        if (!this.navigationPath.length) {
            return;
        }

        var a = this.navigationPath;
        var phantomPresent = a[a.length - 1].phantom;
        if (phantomPresent) {
            do {
                a.pop();
            } while (a.length && a[a.length - 1].phantom);
            a.push(null);
        }
        this.navigateBackOnce();
    },

    navigateToDepth: function(depth) {
        if (depth >= 1 && depth < this.navigationPath.length - 1) {
            // todo: remove all items below depth.
            // todo: remove and navigate to item at depth.
        }
    },

    navigateTo: function(item, callback) {
        if (item.type == ItemType.audio) {
            // Item is a radio station.
            this.play(item);
        } else {
            var self = this;
            this.loadChildItems(item, function() {
                self.handleItemSelected(item);
                callback && callback();
            });
        }
    },

    loadChildItems: function(item, callback) {
        // Item is probably a link to a collection of radio stations.
        if (item.childItems) {
            // Item already comes with child items. The items were probably
            // cached previously. Just continue synchronously.
            // Keep the child items in sync with the favorites.
            this.syncFavoritesWithChildItems(item.childItems);
            // And invoke the callback, of course.
            callback();
        } else {
            this.ui.showSpinner();

            // Get and display the child items.
            var contentsUri = item.uri;
            this.config.getResource({
                uri: contentsUri,
                success: function(response) {
                    this.ui.cancelSpinner();
                    // Cache the child items of this item for future reference.
                    item.childItems = RadioParser.parse(response.text);
                    // Keep the child items in sync with the favorites.
                    this.syncFavoritesWithChildItems(item.childItems);
                    // Continue.
                    callback();
                },
                error: function(error) {
                    // What to do?
                    this.config.showError(error);
                },
                scope: this
            });
        }
    },

    syncFavoritesWithChildItems: function(items) {
        for (var k = 0; k < items.length; k++) {
            var item = items[k];
            if (item.id) {
                if (items.fromCache) {
                    // This is a cached version of the items. Sync from the set of
                    // favorites to the items.
                    item.favoriteStatus = this.favorites.contains(item.id)
                            ? RadioWidget.FavoriteStatus.active
                            : RadioWidget.FavoriteStatus.inactive;
                } else {
                    // This is a live version of the items. Sync from the items to
                    // the set of favorites.
                    var operation = item.favoriteStatus == RadioWidget.FavoriteStatus.active
                            ? this.favorites.add
                            : this.favorites.remove;
                    operation.apply(this.favorites, [item.id]);
                }
            }
        }
        items.fromCache = true;
    },

    handleItemSelected: function(item) {
        // Add item to path.
        this.navigationPath.push(item);

        // Set the given item as current.
        this.setCurrentItem(item);

        // Show the toolbar, including the back button and the breadcrumb, if any.
        this.updateBreadcrumb();
    },

    handleTabClicked: function(tab) {
        // Report the tab click.
        var sectionName = this.ui.getTabSectionName(tab);
        this.config.fireReportingEvent('tab-clicked', sectionName);

        // Visually select the given tab.
        this.ui.deselectAllTabs();
        this.ui.selectTab(tab);

        // Invoke the tab's click handler, as configured during initialization.
        var sectionConfiguration = this.sectionConfigurations[sectionName];
        sectionConfiguration.handler.apply(this, [sectionConfiguration]);
    },

    featuredSectionHandler: function() {
        if (this.featuredItems) {
            this.showFeaturedItems();
        } else {
            var self = this;
            this.ui.showSpinner();
            this.config.getResource({
                uri: this.config.getFeaturedServiceUri(),
                scope: this,
                success: function(response) {
                    self.ui.cancelSpinner();
                    self.featuredItems = RadioParser.parse(response.text);
                    self.showFeaturedItems();
                },
                error: function(error) {
                    self.ui.cancelSpinner();
                    self.config.showError(error);
                }
            });
        }
    },

    showFeaturedItems: function() {
        // Clear the items element.
        while (this.ui.items.firstChild) {
            this.ui.items.removeChild(this.ui.items.firstChild);
        }

        this.ui.hideToolbar();
        this.ui.showItems();

        this.showFeaturedItems0(this.featuredItems);
    },

    showFeaturedItems0: function(items) {
        for (var k = 0; k < items.length; k++) {
            var item = items[k];

            if (item.type != ItemType.audio) {
                // I don't want to process non-audio items at this time.
                // Items such as "more stations" would not display well in this
                // section.
                item.childItems && this.showFeaturedItems0(item.childItems);
                continue;
            }

            var imageElement = document.createElement('img');
            imageElement.src = item.imageUri;
            imageElement.setAttribute('src', imageElement.src);

            var playElement = document.createElement('a');
            this.ui.setCssClass(playElement, 'play-button');
            playElement.appendChild(document.createTextNode(' '));

            var imageContainer = document.createElement('div');
            this.ui.setCssClass(imageContainer, 'thumbnail');
            imageContainer.appendChild(imageElement);
            imageContainer.appendChild(playElement);

            var titleElement = document.createElement('span');
            this.ui.setCssClass(titleElement, 'title');
            titleElement.appendChild(document.createTextNode(item.name || ''));

            var newLineElement = document.createElement('br');

            var subTitleElement = document.createElement('span');
            this.ui.setCssClass(subTitleElement, 'sub-title');
            subTitleElement.appendChild(document.createTextNode(item.nowPlaying || ''));

            var textElement = document.createElement('div');
            this.ui.setCssClass(textElement, 'text');
            textElement.appendChild(titleElement);
            textElement.appendChild(newLineElement);
            textElement.appendChild(subTitleElement);

            var element = document.createElement('div');
            this.ui.setCssClass(element, 'featured-item');
            element.appendChild(imageContainer);
            element.appendChild(textElement);

            addEvtListener(element, 'click', this.createItemClickHandler(item));

            this.ui.items.appendChild(element);
        }

        this.ui.showItems();
    },

    itemListSectionHandler: function(config) {
        // Clear any navigation path.
        this.navigationPath = [];

        // Navigate to the root item associated with this section.
        this.navigateTo(config.rootItem);
    },

    play: function(radioStation) {
        this.config.play(radioStation);
        this.config.closeWindow();
    },

    setCurrentItem: function(item) {
        // Clear the items element.
        while (this.ui.items.firstChild) {
            this.ui.items.removeChild(this.ui.items.firstChild);
        }

        // Apply the inheritable configuration of the item, if any, to the item.
        if (item.inheritableConfig) {
            for (var p in item.inheritableConfig) {
                var o = item.inheritableConfig[p];
                item[p] = o;
            }
        }

        // Obtain the complete child items, including any pre-defined descendants.
        var childItems = item.childItems;
        if (item.additionalChildItems) {
            childItems = item.additionalChildItems.concat(childItems);
        }

        // Calculate the maximum number of items to display.
        var max = this.config.getMaximumNumberOfDisplayedItems();
        var length = (max == 0 || max)
            ? Math.min(max, childItems.length)
            : childItems.length;

        var detailedItemsPresent = false;

        // Loop through the child items and display them.
        for (var k = 0; k < length; k++) {
            var childItem = childItems[k];

            // Recursively add inheritable configuration to the children.
            if (item.inheritableConfig) {
                if (!childItem.inheritableConfig) {
                    childItem.inheritableConfig = item.inheritableConfig;
                }
            }

            var stripeClass = k % 2 ? 'even' : 'odd';
            if (childItem.type == ItemType.audio) {
                detailedItemsPresent = true;
            }
            this.createItemElement(childItem, stripeClass);
        }

        // Switch to items view.
        this.ui.showItems();

        // Indicate whether radio stations are listed among the items.
        this.ui.setCssClass(this.ui.items, detailedItemsPresent ? '' : 'abridged');
    },

    createItemElement: function(childItem, stripeClass) {
        // Store all the elements into the item for easy access by the
        // various click handlers.
        childItem.htmlElements = {};

        // Create item element.
        var itemElement = document.createElement('div');
        var itemClass = stripeClass + ' item';
        this.ui.setCssClass(itemElement, itemClass);
        this.ui.items.appendChild(itemElement);

        // Create actions element, to be displayed to the left of the name.
        var actionsElement = document.createElement('div');
        this.ui.setCssClass(actionsElement, 'actions');
        itemElement.appendChild(actionsElement);

        // Create name element.
        var nameElement = document.createElement('div');
        nameElement.appendChild(document.createTextNode(childItem.name));
        this.ui.setCssClass(nameElement, 'name');
        itemElement.appendChild(nameElement);

        // Create info element, to be displayed to the left of the name.
        var infoElement = document.createElement('div');
        this.ui.setCssClass(infoElement, 'info');
        itemElement.appendChild(infoElement);

        if (childItem.type != ItemType.text) {
            // Clicking the name or info sections triggers a click of the item.
            // Clicking in the dead space of the options area does not trigger
            // a click of the item, because a click of the item causes the
            // radio widget to hide, an action that will destroy the user
            // context inadvertently if the user clicks a few pixels too far
            // from whatever actions are available (such as toggle favorites).
            var itemClickHandler = this.createItemClickHandler(childItem);
            addEvtListener(nameElement, 'click', itemClickHandler);
            addEvtListener(infoElement, 'click', itemClickHandler);
        }

        if (childItem.type == ItemType.audio) {
            // Create favorite action.
            var favoriteActionElement = document.createElement('div');
            childItem.htmlElements.favoriteAction = favoriteActionElement;
            favoriteActionElement.onclick = this.createFavoriteActionClickHandler(childItem);
            this.ui.setCssClass(favoriteActionElement, childItem.favoriteStatus + ' favorite-action');
            actionsElement.appendChild(favoriteActionElement);

            var favoriteHeartElement = document.createElement('span');
            this.ui.setCssClass(favoriteHeartElement, 'heart');
            favoriteActionElement.appendChild(favoriteHeartElement);

            // Create fix-it action; unlike other actions, this is rendered
            // in a special location, immediately to the left of the info
            // item, for which reason we add it directly to the item.
            var fixItActionElement = document.createElement('span');
            this.ui.setCssClass(fixItActionElement, 'options-action');
            itemElement.appendChild(fixItActionElement);
            var f = this.createFixItActionClickHandler(childItem);
            addEvtListener(fixItActionElement, 'click', f);

            if (childItem.bitrate) {
                // Add bit rate information.
                var bitrateString = childItem.bitrate + 'kbps';
                var bitrateElement = document.createElement('span');
                bitrateElement.appendChild(document.createTextNode(bitrateString));
                this.ui.setCssClass(bitrateElement, 'bitrate');
                infoElement.appendChild(bitrateElement);
            }
        }
    },

    createItemClickHandler: function(item) {
        if (!item.clickHandler) {
            var self = this;
            item.clickHandler = function() {
                self.navigateTo(item);
            };
        }
        return item.clickHandler;
    },

    createFixItActionClickHandler: function(item) {
        if (!item.optionsClickHandler) {
            var self = this;
            item.optionsClickHandler = function(event) {
                event || (event = window.event);
                event.cancelBubble = true;

                self.handleFixItActionClicked(item);

                return false;
            };
        }
        return item.optionsClickHandler;
    },

    handleFixItActionClicked: function(item) {
        var self = this;
        var reportItem = {
            name: 'Fix-It Wizard',
            uri: this.config.getReportServiceUri(item.id),
            inheritableConfig: {
                phantom: true,
                hiddenInBreadcrumb: true,
                additionalChildItems: [
                    {
                        type: ItemType.link,
                        clickHandler: function() { self.fixItWizardBack(); },
                        name: 'Back'
                    },
                    {
                        type: ItemType.link,
                        clickHandler: function() { self.fixItWizardClose(); },
                        name: 'Close'
                    }
                ]
            }
        };

        this.navigateTo(reportItem);
    },

    fixItWizardBack: function() {
        this.navigateBackOnce();
    },

    fixItWizardClose: function() {
        this.navigateBack();
    },

    createFavoriteActionClickHandler: function(item) {
        if (!item.favoriteActionClickHandler) {
            item.favoriteActionClickHandler = this.createFavoriteActionClickHandler0(item);
        }
        return item.favoriteActionClickHandler;
    },

    createFavoriteActionClickHandler0: function(item) {
        var self = this;
        return function(event) {
            // Stop this event here.
            event || (event = window.event);
            event.cancelBubble = true;

            self.handleFavoriteActionClicked(item);

            return false;
        };
    },

    handleFavoriteActionClicked: function(item) {
        // Check the state of the item. Prior clicks may have put the item
        // in pending mode, whereas prior processing errors may have put
        // it in error mode.

        if (item.pending) {
            // In pending mode, ignore this click.
            return;
        }

        if (item.error) {
            // Immediately restore the item state and disable any timers
            // associated with the error mode.
            this.clearItemFailedStatus(item);
            return;
        }

        // The item is neither pending nor in error mode. We will attempt to
        // toggle its favorite status.

        // Find out which service to target to toggle the state of this item.
        var targetFavorite = item.favoriteStatus != RadioWidget.FavoriteStatus.active;
        var uri = targetFavorite
                ? this.config.getAddFavoriteServiceUri(item.id)
                : this.config.getRemoveFavoriteServiceUri(item.id);

        // Item is now pending.
        this.setItemToPendingStatus(item);

        // Invoke the service and interpret the response.
        this.config.getResource({
            uri: uri,
            scope: this,
            success: function(response) {
                this.clearItemPendingStatus(item);

                var items = RadioParser.parse(response.text);

                var success = items.status == 200;
                if (success) {
                    var s = RadioWidget.FavoriteStatus.toggle(item.favoriteStatus);
                    item.favoriteStatus = s;
                    this.setItemFavoriteStatus(item);
                } else {
                    this.setItemToFailedStatus(item);
                }
            },
            error: function() {
                this.clearItemPendingStatus(item);
                this.setItemToFailedStatus(item);
                // Do not change any internal state.
            }
        });
    },

    setItemFavoriteStatus: function(item) {
        var s = item.favoriteStatus;
        this.ui.setCssClass(item.htmlElements.favoriteAction, s + ' favorite-action');
        if (item.id) {
            var operation = item.favoriteStatus == RadioWidget.FavoriteStatus.active
                    ? this.favorites.add
                    : this.favorites.remove;
            operation.apply(this.favorites, [item.id]);
        }
    },

    setItemToFailedStatus: function(item) {
        // Immediately provide a visual cue that the item is in error mode.
        this.ui.setCssClass(item.htmlElements.favoriteAction, 'error favorite-action');

        // With a certain delay, automatically clear the error status,
        // and restore the visual cues associated with the item's status.
        var self = this;
        item.errorTimer = setTimeout(function() {
            self.clearItemFailedStatus(item);
        }, 3000);

        // Set a flag indicating that this item is in error mode. This will
        // enable click processing to react to this state.
        item.error = true;
    },

    clearItemFailedStatus: function(item) {
        // Clear any timers associated with the failed status.
        if (item.errorTimer) {
            clearTimeout(item.errorTimer);
            delete item.errorTimer;
        }

        // Clear the flag indicating that the item is in error mode.
        if (item.error) {
            delete item.error;
        }

        this.setItemFavoriteStatus(item);
    },

    setItemToPendingStatus: function(item) {
        // With a certain delay, provide a visual cue that the item is in
        // pending mode.
        var self = this;
        item.pendingTimer = setTimeout(function() {
            self.ui.setCssClass(item.htmlElements.favoriteAction, 'pending favorite-action');
        }, 500);
        // Immediately mark this item as pending. Subsequent clicks must
        // be aware of this state even as the visible cue is being delayed.
        item.pending = true;
    },

    clearItemPendingStatus: function(item) {
        if (item.pendingTimer) {
            clearInterval(item.pendingTimer);
            delete item.pendingTimer;
        }

        if (item.pending) {
            delete item.pending;
        }
    }
};

window.addEventListener("load", function(event) {
	RadioWidget.init();
}, false);
