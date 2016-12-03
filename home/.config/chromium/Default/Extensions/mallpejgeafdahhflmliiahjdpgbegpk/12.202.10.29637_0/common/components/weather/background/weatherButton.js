function WeatherButton(config) {
    Widget.Background.initialize(this);
    this.id = config.id;
    //Set up the object using the config
    this.fetchFrequency = config.fetchFrequency; // how often we fetch the weather (60 seconds)
    this.imgBaseUrl = 'https://ak.ssl.imgfarm.com/images/widgets/weather/';
    this.zip = window.localStorage.getItem('zip_' + this.id); // zip code
    this.isFahrenheit = window.localStorage.getItem('isFahrenheit_' + this.id);
    //Deal w/ null and possible string values instead of boolean.
    if (this.isFahrenheit == null) {
        this.isFahrenheit = true;
    } else if(this.isFahrenheit == "false") {
	    this.isFahrenheit = false;
    } else if(this.isFahrenheit == "true") {
	    this.isFahrenheit = true;
    }

    this.todaysWeather = null;
    this.userLocation = null;
    this.weatherForecast = new Array();
    this.html = "";
	this.imgWidth = config.imgWidth || '';
	this.beginScrollableArea = config.beginScrollableArea;

    //Update the weather every so often
    var self = this;
    setInterval(function() {
        self.getWeather(self, self.updateWeather, self.zip);
    }, this.fetchFrequency);

    //Set up the arrays
	var IMAGES = {
		"chance of flurries": "ChanceOfSnow",
		"chance of rain": "ChanceOfRain",
		"chance of freezing rain": "ChanceOfRain",
		"chance of sleet": "ChanceOfRain",
		"chance of snow": "ChanceOfSnow",
		"chance of thunderstorms": "ChanceOfTstorm",
		"chance of a thunderstorm": "ChanceOfTstorm",
		"clear": "Sunny",
		"cloudy": "Cloudy",
		"flurries": "ChanceOfSnow",
		"fog": "Fog",
		"freezing fog": "Fog",
		"haze": "Fog",
		"mist": "Misty",
		"spray": "Misty",
		"rain mist": "Misty",
		"hail": "Ice",
		"dust whirls": "Dust",
		"sandstorm": "Dust",
		"widespread dust": "Dust",
		"blowing widespread dust": "Dust",
		"low drifting sand": "Dust",
		"blowing sand": "Dust",
		"mostly cloudy": "MostlyCloudy",
		"mostly sunny": "MostlySunny",
		"partly cloudy": "MostlySunny",
		"partly sunny": "MostlyCloudy",
		"freezing rain": "Ice",
		"freezing drizzle": "Ice",
		"drizzle": "Drizzle",
		"rain": "Rain",
		"rain showers": "Showers",
		"sleet": "Sleet",
		"snow": "Snow",
		"low drifting snow": "Snow",
		"snow showers": "Snow",
		"snow grains": "ChanceOfSnow",
		"ice crystals": "Ice",
		"ice pellets": "Ice",
		"hail showers": "Ice",
		"small hail showers": "Ice",
		"sunny": "Sunny",
		"thunderstorms": "Thunderstorm",
		"thunderstorms and rain": "Thunderstorm",
		"thunderstorms and snow": "Thunderstorm",
		"thunderstorms and ice pellets": "Thunderstorm",
		"thunderstorms with hail": "Thunderstorm",
		"thunderstorms with small hail": "Thunderstorm",
		"thunderstorm": "Thunderstorm",
		"unknown": "Misc",
		"overcast": "Cloudy",
		"scattered clouds": "MostlySunny"
	};

	var imgs = {
		ChanceOfRain: {"btn":"chance_of_rain.png", "icon":"icon_chance_of_rain.png", "bkg":"backgrounds/bk_rain.png"},
		ChanceOfSnow: {"btn":"chance_of_snow.png", "icon":"icon_chance_of_snow.png", "bkg":"backgrounds/bk_flurries.png"},
		ChanceOfTstorm: {"btn":"chance_of_storm.png", "icon":"icon_chance_of_thunderstorm.png", "bkg":"backgrounds/bk_thunderstorms.png"},
		Cloudy: {"btn":"cloudy.png", "icon":"icon_cloudy.png", "bkg":"backgrounds/bk_cloudy.png"},
		Drizzle: {"btn":"drizzle.png", "icon":"icon_chance_of_rain.png", "bkg":"backgrounds/bk_rain.png"},
		Dust: {"btn":"dust.png", "icon":"icon_dust.png", "bkg":"backgrounds/bk_dusty.png"},
		Fog: {"btn":"fog.png", "icon":"icon_fog.png", "bkg":"backgrounds/bk_foggy.png"},
		Ice: {"btn":"icy.png", "icon":"icon_icy.png", "bkg":"backgrounds/bk_icy.png"},
		Misc: {"btn":"misc.png", "icon":"t.png", "bkg":"backgrounds/bk_cloudy.png"},
		Misty: {"btn":"misty.png", "icon":"icon_mist.png", "bkg":"backgrounds/bk_misty.png"},
		MostlyCloudy: {"btn":"mostly_cloudy.png", "icon":"icon_mostly_cloudy.png", "bkg":"backgrounds/bk_cloudy.png"},
		MostlySunny: {"btn":"mostly_sunny.png", "icon":"icon_mostly_sunny.png", "bkg":"backgrounds/bk_sunny.png"},
		Rain: {"btn":"rain.png", "icon":"icon_rain.png", "bkg":"backgrounds/bk_rain.png"},
		Showers: {"btn":"showers.png", "icon":"icon_showers.png", "bkg":"backgrounds/bk_rain.png"},
		Sleet: {"btn":"sleet.png", "icon":"icon_sleet.png", "bkg":"backgrounds/bk_rain.png"},
		Snow: {"btn":"snow.png", "icon":"icon_snow.png", "bkg":"backgrounds/bk_snow.png"},
		Sunny: {"btn":"sunny.png", "icon":"icon_sunny.png", "bkg":"backgrounds/bk_sunny.png"},
		Thunderstorm: {"btn":"thunderstorm.png", "icon":"icon_thunderstorm.png", "bkg":"backgrounds/bk_thunderstorms.png"},
		UNKNOWN: {"btn": "misc.png", "icon":"icon_misc.png", "bkg": "backgrounds/bk_sunny.png"},
		UNMAPPED : {"btn":"windy.png", "icon":"icon_windy.png", "bkg":"backgrounds/bk_windy.png"}
	};

    //fetch zip code from server
    this.getZipFromServer = function() {
        var zipRequest = new XMLHttpRequest();
        zipRequest.open('GET', 'http://home.mindspark.com/weatherWidgetZip.jhtml');
        zipRequest.onload = function() {
            //process zip code from server

            //The following is needed because the content type is not XML
            var xmlDoc = new DOMParser().parseFromString(zipRequest.responseText, "text/xml");
            var newZip = xmlDoc.evaluate('//zip', xmlDoc).iterateNext().textContent;
            if (newZip && newZip.length > 5) {
                newZip = newZip.substring(0, 5);
            }
            self.setZip(newZip);
        };
        zipRequest.send();
    };

    this.setZip = function(newZip) {
        this.zip = newZip;
        window.localStorage.setItem('zip_' + this.id, this.zip);
        this.getWeather(this, this.updateWeather, this.zip);
    };

    this.saveSettings = function(newZip, isFahrenheit) {
        if (newZip != null && typeof(newZip) != "undefined") {
            this.zip = newZip;
            window.localStorage.setItem('zip_' + this.id, this.zip);
        }
        if (isFahrenheit != null && typeof(isFahrenheit) != "undefined") {
            this.isFahrenheit = isFahrenheit;
            window.localStorage.setItem('isFahrenheit_' + this.id, this.isFahrenheit);
        }
    };

    this.updateWeather = function(newUserLocation, newWeather, newForecast) {
        if (this.userLocation != newUserLocation || this.isWeatherNew(this.todaysWeather, newWeather) || this.isForecastNew(this.weatherForecast, newForecast)) {
            this.userLocation = newUserLocation;
            this.todaysWeather = newWeather;
            this.weatherForecast = newForecast;
            this.updateRendering();
        }
    };

    //fetch weather from server
    this.getWeather = function(context, callback, location) {
        if (typeof(location) == 'undefined' || location == null) {
            this.getZipFromServer();
        } else {
            var weatherRequest = new XMLHttpRequest();
            weatherRequest.open('GET', 'http://weatherblink.wdgserv.com/weatherblink/lookup/' + location);
            weatherRequest.onload = function() {
				try {
					var responseText = weatherRequest.responseText,
						weather = JSON.parse(responseText),
						newUserLocation = weather.location.display,
						newWeather,
						newForecast,
						today;

					if (!weather.error && weather.forecast) {
						today = weather.forecast.length && weather.forecast[0];

						//Parse today
						newWeather = self.createWeatherObject(today, true);

						//Parse forecast
						newForecast = [];
						_.each(weather.forecast, function(data) {
							newForecast.push(self.createWeatherObject(data, false));
						});
					}

	                callback.apply(context, [newUserLocation, newWeather, newForecast]);
				} catch (e) {
					callback.apply(context);
				}
            };
            weatherRequest.send();
        }
    };

    this.createImageUrl = function(imageUrl) {
        return this.imgBaseUrl + imageUrl;
    };

    this.getImageObj = function(condition) {
        if (condition == null) {
            return imgs.UNKNOWN;
        }
        var imageObj = imgs[IMAGES[condition.toLowerCase()]];
        if (imageObj == null || typeof(imageObj) == 'undefined') {
            imageObj = imgs.UNKNOWN;
        }
        return imageObj;
    };

    this.createWeatherObject = function(data, isToday) {
        var weather = {};
        weather.condition = data.conditions;
        var imageObj = this.getImageObj(weather.condition);
        weather.buttonImage = this.createImageUrl(imageObj.btn);
        weather.icon = this.createImageUrl(imageObj.icon);
        weather.background = this.createImageUrl(imageObj.bkg);
        weather.windChill = null;
        weather.dayOfWeek = null;
        weather.highTemp = null;
        weather.lowTemp = null;
        if (isToday) {
			// By default the temp is Fahrenheit
			var temperature = data.temperature;

			if (!this.isFahrenheit) {
				temperature = this.convertToCelsius(temperature);
			}

			weather.temperature = temperature;

            if (this.hasWindChillFactor(temperature)) {
				weather.windChill = this.calculateWindchill(temperature, data.windSpeed);
            }
        } else {
			weather.dayOfWeek = this.getWeekDay(new Date(data.date * 1000).getDay());
			weather.highTemp = data.high;
			weather.lowTemp = data.low;
			if (!this.isFahrenheit) {
				weather.highTemp = this.convertToCelsius(weather.highTemp);
				weather.lowTemp = this.convertToCelsius(weather.lowTemp);
			}
        }
        return weather;
    };

    this.hasWindChillFactor = function(temperature) {
        if (this.isFahrenheit) {
            return temperature <= 50;
        } else {
            return temperature <= 10;
        }
    };

    this.calculateWindchill = function(temperature, wind) {
        //Formula from wikipedia
        if (this.isFahrenheit) {
            return Math.floor(35.74 + 0.6215 * temperature - 35.75 * Math.pow(wind,
                    0.16) + 0.4275 * temperature * Math.pow(wind,
                    0.16));
        } else {
            return Math.floor(13.12 + 0.6215 * temperature - 11.37 * Math.pow(wind,
                    0.16) + 0.3965 * temperature * Math.pow(wind, 0.16));
        }
    };

	this.getWeekDay = function(dayOfWeek) {
		var dayToName = {
			0: "Sunday",
			1: "Monday",
			2: "Tuesday",
			3: "Wednesday",
			4: "Thursday",
			5: "Friday",
			6: "Saturday"
		};

		return dayToName[dayOfWeek];
	};

    this.convertToCelsius = function(temperature) {
        return Math.round((temperature - 32) * 5 / 9);
    };

    this.render = function() {
        return "<button class='toolbar-item button' id='" + this.id + "'>" + this.html + "</button>";
    };

    this.updateRendering = function() {
        if (this.todaysWeather != null) {
            this.html = "<img class='icon' src='" + this.todaysWeather.buttonImage + "' width='" + this.imgWidth + "'/><span class='label'>" + this.todaysWeather.temperature + this.getUnit() + " " + Common.encodeForHTML(this.userLocation) + "</span>";
            this.getSelectedTab(function(tab) {
				if (tab) {
					self.reRender(self.id, self.html, tab);
				}
            });
        }
    };

    this.isWeatherNew = function(currentWeather, newWeather) {
        //Check to see if they've been set
        if (!currentWeather && !newWeather) {
            return true;
        }
        return !(currentWeather.condition == newWeather.condition &&
                currentWeather.buttonImage == newWeather.buttonImage &&
                currentWeather.icon == newWeather.icon &&
                currentWeather.background == newWeather.background &&
                currentWeather.windChill == newWeather.windChill &&
                currentWeather.dayOfWeek == newWeather.dayOfWeek &&
                currentWeather.highTemp == newWeather.highTemp &&
                currentWeather.lowTemp == newWeather.lowTemp);
    };

    this.isForecastNew = function(currentForecast, newForecast) {
        if (currentForecast == null && newForecast != null) {
            return true;
        }
        if (currentForecast.length != newForecast.length) {
            return true;
        }
        for (var i = 0; i < currentForecast.length; i++) {
            if (this.isWeatherNew(currentForecast[i], newForecast[i])) {
                return true;
            }
        }
        return false;
    };

    this.getUnit = function() {
        return this.isFahrenheit ? "&#176F" : "&#176C";
    };

    this.handleRequest = function(request, sender, sendResponse) {
        if (request.name == this.id) {
            if (request.cmd == 'current_weather') {
                sendResponse({todaysWeather: this.todaysWeather, weatherForecast: this.weatherForecast, isFahrenheit: this.isFahrenheit, userLocation: this.userLocation});
            } else if (request.cmd == 'update_settings') {
                this.saveSettings(request.newLocation, request.isFahrenheit);
                this.getWeather(this, function(newUserLocation, newWeather, newForecast) {
                    self.updateWeather(newUserLocation, newWeather, newForecast);
                    sendResponse({});
                }, this.zip);
            } else if (request.cmd == 'test_location') {
                this.getWeather(null, function(newUserLocation, newWeather, newForecast) {
                    if (newUserLocation == null && newWeather == null && newForecast == null) {
                        sendResponse({success: false});
                    } else {
                        sendResponse({success: true, userLocation: newUserLocation});
                    }
                }, request.newLocation);
            } else if (request.cmd == 'close') {
                this.hideDialog(sender.tab, {containerId: this.id});
			} else if (request.cmd == 'navigate') {
				if (request.url != null) {
					Widget.Content.tabs.update(sender.tab, request.url);
				}
            } else if (!request.cmd) {
                this.handleClick(request, sender.tab);
            }
        }
        return null;
    };

    this.handleClick = function(params, tab) {
        this.showDialog(tab, {
            containerId: this.id,
            src: this.getURL('common/widget-api/widgets/weather/weatherButton.html?' + encodeURIComponent(this.id)),
            rectangle: params.rectangle,
            width: 620,
            height: 275
        });

		self.logButtonClickedEvent(config.buttonId, params.overflow);
    };

    this.getWeather(this, this.updateWeather, this.zip);
}

WeatherButton.prototype = new Widget.Background();