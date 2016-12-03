var WidgetFactory = {
    createWidget: function(widgetConfiguration, imageWidths) {
        if (imageWidths && widgetConfiguration.img) {
            widgetConfiguration.imgWidth = imageWidths[widgetConfiguration.img] || '';
        }
        if (widgetConfiguration.type == 'WeatherButton') {
            return new WeatherButton(widgetConfiguration);
        } else if (widgetConfiguration.type == 'SearchBox') {
        	return new SearchBox(widgetConfiguration);
        } else if (widgetConfiguration.type == 'LinkButton') {
            var linkButton = new LinkButton(widgetConfiguration);
            if (linkButton.disabled) {
                return null;
            }
            return linkButton;
        } else if (widgetConfiguration.type == 'MenuButton') {
			var menuButton = new MenuButton(widgetConfiguration);
            return !menuButton.disabled ? menuButton : null;
        } else if (widgetConfiguration.type == 'RSS') {
            return new RssWidget(widgetConfiguration);
        } else if (widgetConfiguration.type == 'MovieReviews') {
            return new MovieReviews(widgetConfiguration);
        } else if (widgetConfiguration.type == 'ThirdPartyWidget') {
            return new ThirdPartyWidget(widgetConfiguration);
		} else if (widgetConfiguration.type == 'RadioWidget') {
		    return new RadioWidget(widgetConfiguration);
		} else if (widgetConfiguration.type == 'FlareWidget') {
		    return new FlareWidget(widgetConfiguration);
		} else if (widgetConfiguration.type == 'EmbedHtml') {
            return new EmbedHtmlWidget(widgetConfiguration);
		} else if (widgetConfiguration.type == 'EmbedScript') {
            return new EmbedScriptWidget(widgetConfiguration);
        } else if (widgetConfiguration.type == 'Alert') {
            return new AlertButton(widgetConfiguration);
        } else if (widgetConfiguration.type == 'GenericWidget') {
            return new GenericWidget(widgetConfiguration);
        } else if (widgetConfiguration.type == 'ApiBasedWidget') {
            return new ApiBasedWidget(widgetConfiguration);
		} else if (widgetConfiguration.type == 'UninstallButton') {
			var uninstallButton = new UninstallButton(widgetConfiguration);
			return !uninstallButton.disabled ? uninstallButton : null;
		}
    }
};