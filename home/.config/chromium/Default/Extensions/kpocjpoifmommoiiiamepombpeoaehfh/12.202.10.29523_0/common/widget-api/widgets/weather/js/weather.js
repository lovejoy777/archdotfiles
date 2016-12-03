var Weather = {
    name: window.location.search.substr(1),
    todaysWeather: null,
    weatherForecast: null,
    isFahrenheit: true,
    userLocation: null,

    init: function() {
		var self = this;

		// Setup UI event handlers
		$('#close').click(_.bind(self.closeWeather, self));
		$('.navigateToLocationDetails').click(_.bind(self.navigateToLocationDetails, self));
		$('.openSettingsWindow').click(_.bind(self.openSettingsWindow, self));
		$('.navigateToProviderHP').click(_.bind(self.navigateToProviderHP, self));
		$('#closeSettingsWindow').click(_.bind(self.closeSettingsWindow, self));
		$('#saveBtn').click(_.bind(self.closeSettingsWindow, self, true));
		$('#cancelBtn').click(_.bind(self.closeSettingsWindow, self, false));
		$('#searchBtn').click(_.bind(self.onSearchBtnClick, self));
		$('#location').keypress(_.bind(self.keyPress, self));

        WidgetContextFactory.getWidgetContext(function(context) {
            this.context = context;
            this.renderWeatherUI();
        }, this);
    },

    renderWeatherUI: function() {
        this.context.sendMessage('current_weather', {}, function(response) {
            this.todaysWeather = response.todaysWeather;
            this.weatherForecast = response.weatherForecast;
            this.isFahrenheit = response.isFahrenheit;
            this.userLocation = response.userLocation;
            this.draw();
        }, this);
    },

    draw: function() {
        //Render current weather
        var currentConditions = "<div class='currentImg'><img src='" + this.todaysWeather.icon + "' />" + "</div>" + "<div class='currentTemp'>" + this.todaysWeather.temperature + this.getUnit(this.isFahrenheit) + "</div>" + "<div class='currentCondition'>" + this.todaysWeather.condition;

        if (this.todaysWeather.windChill != null) {
            currentConditions += " <span class='windChill' >feels like " + this.todaysWeather.windChill + this.getUnit(this.isFahrenheit) + "</span></div>";
        } else {
            currentConditions += " </div>";
        }
        document.getElementById("current_condition").innerHTML = currentConditions;
        //Render background
        document.body.background = this.todaysWeather.background;

        if (this.userLocation != null) {
            document.getElementById("currentLocation").innerHTML = this.userLocation;
        }

        var forecasts = this.weatherForecast,
			day;

        for (var i = 0; i < forecasts.length; i++) {
			day = document.getElementById("forcast_condition_" + i);

			if (day) {
				day.innerHTML = "<div style='margin-top:10px;overflow:hidden;'>" + "<img style='width:76px;height:64px;' src='" + forecasts[i].icon + "' /></div>" + "<div class='weekDay'>" + forecasts[i].dayOfWeek + "</div>" + "<div class='highTemp'>" + forecasts[i].highTemp + this.getUnit(this.isFahrenheit) + "</div>" + "<div class='lowTemp'>" + forecasts[i].lowTemp + this.getUnit(this.isFahrenheit) + "</div>" + "<div class='weatherCondition'>" + forecasts[i].condition + "</div>";
			}
        }
    },

    getUnit: function() {
        if (this.isFahrenheit) {
            return "&#176F";
        } else {
            return "&#176C";
        }
    },

    updateStatusText: function(s, style) {
        document.getElementById("searchStatus").innerHTML = s;
        if (style) {
            document.getElementById("searchStatus").style.backgroundColor = style;
        } else {
            document.getElementById("searchStatus").style.backgroundColor = "#D6EEFF";
        }
    },

    openSettingsWindow: function() {
        var unitId = "unitgroup_" + (this.isFahrenheit ? "f" : "c");
        document.getElementById(unitId).checked = "checked";

        document.getElementById("locationSettings").style.display = "block";
        document.getElementById("settingsMainContent").style.display = "block";
        this.updateStatusText("<span class='statusTitle'>Current Location: </span> <span class='statusLocation'>" + this.userLocation + "</span>");
    },

	navigateToLocationDetails: function() {
		this.context.navigate('http://www.wunderground.com/cgi-bin/findweather/getForecast?query=' + encodeURIComponent(this.userLocation) + '#forecast');
	},

	navigateToProviderHP: function() {
		this.context.navigate('http://www.wunderground.com/');
	},

    keyPress: function(event) {
        var charCode = event.which;
        if (charCode == 13) {
            document.getElementById('saveBtn').click();
        }
    },

    closeSettingsWindow: function(bSwitch) {
        var self = this;
        if (bSwitch) {
            var location = document.getElementById("location").value;
            location = location == null ? "" : Common.trim(location);
            var isFahrenheit = document.getElementById("unitgroup_f").checked;
            if (isFahrenheit == this.isFahrenheit && location.length == 0) {
                //Nothing has changed.
                document.getElementById("locationSettings").style.display = "none";
                document.getElementById("settingsMainContent").style.display = "none";
            } else {
                if (location.length > 0) {
                    this.context.sendMessage('test_location', {newLocation: location}, function(response) {
                        if (response.success) {
                            this.context.sendMessage('update_settings', {newLocation: location, isFahrenheit: isFahrenheit}, function(response) {
                                document.getElementById("locationSettings").style.display = "none";
                                document.getElementById("settingsMainContent").style.display = "none";
                                self.renderWeatherUI();
                            }, this);
                        } else {
                            this.updateStatusText("<span class='statusError'>Location not found. Please try searching again.</span>", "#FF6600");
                        }
                    }, this);
                } else {
                    this.context.sendMessage('update_settings', {isFahrenheit: isFahrenheit}, function(response) {
                        document.getElementById("locationSettings").style.display = "none";
                        document.getElementById("settingsMainContent").style.display = "none";
                        this.renderWeatherUI();
                    }, this);
                }
            }
        } else {
            document.getElementById("locationSettings").style.display = "none";
            document.getElementById("settingsMainContent").style.display = "none";
        }
    },

    onSearchBtnClick: function() {
        var self = this;
        var location = document.getElementById("location").value;
        if (location != null && Common.trim(location).length > 0) {
            this.context.sendMessage('test_location', {newLocation: location}, function(response) {
                if (response.success) {
                    this.updateStatusText("<span class='statusTitle'>New Location:</span> <span class='statusLocation' >" + response.userLocation + "</span><br><span class='statusTips'>Not correct? Try entering city AND state</span>");
                } else {
                    this.updateStatusText("<span class='statusError'>Location not found. Please try searching again.</span>", "#FF6600");
                }

            }, this);
        }
    },

    closeWeather: function() {
        this.context.close();
    }
};

window.addEventListener('load', function() { Weather.init()}, false);