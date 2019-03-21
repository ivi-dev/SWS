import * as utils from '../utils.js';
import { weatherCodes } from '../weather_codes_loader.js';
import * as objects from '../objects.js';

export const MainViewModel = function() {
    // Constants
    self = this;

    this.LOCATION_SYMBOL_CLASS = 'fas fa-map-marker-alt';
    this.DATE_NOW = new Date();
    
    // Unit chooser
    this.tempUnits = ko.observableArray([
        new objects.Unit('imperial', '&#176;', 'F', true),
        new objects.Unit('metric', '&#176;', 'C', true)
    ]);
    this.speedUnits = ko.observableArray([
        new objects.Unit('imperial', '', 'mph'),
        new objects.Unit('metric', '', 'm/s')
    ]);
    this.pressureUnits = ko.observableArray([
        new objects.Unit('imperial', '', 'inHg'),
        new objects.Unit('metric', '', 'hPa')
    ]);
    this.activeUnit = ko.observable(self.tempUnits()[1]);
    this.activeSpeedUnit = ko.computed(function() {
        for (let unit of self.speedUnits()) 
            if (unit.name === self.activeUnit().name)
                return unit;
    });
    this.activePressureUnit = ko.computed(function() {
        for (let unit of self.pressureUnits()) 
            if (unit.name === self.activeUnit().name)
                return unit;
    });
    this.changeActiveUnit = function(unit) { 
        self.activeUnit(unit); 
        self.updateWeather();
    }
    
    // Current conditions and other
    this.currentTemp = ko.observable(0);
    this.currentTemperature = ko.computed(function() {
        const temp = Math.abs(self.currentTemp().toFixed()) == 0 ? 0 : self.currentTemp().toFixed();
        return temp + self.activeUnit().symbol;
    });

    this.currentWindDirection = ko.observable(0);
    this.currentWindSpeed = ko.observable(0);
    this.currentWind = ko.pureComputed(function() {
        return self.calculateWind(self.currentWindDirection(), self.currentWindSpeed(), 'number');
    });

    this.currentHum = ko.observable(0);
    this.currentHumidity = ko.pureComputed(function() {
        return self.currentHum().toFixed() + '%';
    });

    this.currentPress = ko.observable(0);
    this.currentPressure = ko.pureComputed(function() {
        return self.currentPress().toFixed(2) + ' hPa';
    });

    this.currentClouds = ko.observable(0);
    this.currentCloudCoverage = ko.pureComputed(function() {
        return self.currentClouds() + '%';
    });

    this.currentConditionsText = ko.observable('Waiting for a weather update...');
    this.currentConditionsIcon = ko.observable('');
    
    this.currentLocationName = ko.observable('Dusseldorf');
    this.locationMarker = ko.observable('fas fa-map-marker-alt');
    this.currentDate = ko.pureComputed(function() {
        let day = self.DATE_NOW.getDay();
        let date = self.DATE_NOW.getDate();
        let month = self.DATE_NOW.getMonth();
        let year = self.DATE_NOW.getFullYear();
        return utils.parseWeekday(day, 'long') + ' ' + date + ' ' + utils.parseMonth(month) + ' ' + year;
    });
    this.latestUpdateDate = ko.observable();
    this.calculatedLatestUpdate = ko.observable('---');
    this.calculateLatestUpdate = function() {
        if (self.latestUpdateDate()) {
            const mins = new Date(new Date() - self.latestUpdateDate()).getMinutes();
            let value, unit;
            if (mins > 0) {
                unit = mins === 1 ? ' minute' : ' minutes';
                value = mins + unit + ' ago';
            }
            else if (mins > 60) {
                unit = mins === 1 ? ' hour' : ' hours';
                value = (mins / 60).toFixed() + unit + ' ago';
            }
            else
                value = 'just now';
            self.calculatedLatestUpdate(value); 
        }
    };
    this.periodicLatestUpdateTimeCalculation = function() {
        setInterval(self.calculateLatestUpdate, utils.latestWeatherUpdateCalculationInterval);
    }

    // 5-day forecast
    this.forecastWeather = ko.observableArray();
    this.forecast = ko.observableArray([]);
    
    this.constructForecast = function() {
        self.forecast.removeAll();
        let next5Days = {};
        const forecast = this.response.list;
        for (let entry of forecast) {
            const day = utils.parseWeekday(utils.parseAPIDate(entry.dt_txt).getDay());
            if (day != utils.parseWeekday(self.DATE_NOW.getDay())) {
                if (Object.keys(next5Days).indexOf(day) === -1)
                    next5Days[day] = [];
                next5Days[day].push(entry);                    
            }
        }
        for (let day in next5Days) {
            const day_ = next5Days[day];
            let temp = 0, temps = [], windDirection = 0, windSpeed = 0, humidity_ = 0, pressure_ = 0;
            let rain_ = 0,  snow_ = 0;
            let readings = [];
            let date;
            for (let entry of day_) {
                temp += entry.main.temp;
                temps.push(entry.main.temp);
                windDirection += entry.wind.deg;
                windSpeed += entry.wind.speed;
                humidity_ += entry.main.humidity;
                pressure_ += entry.main.pressure;
                date = utils.parseAPIDate(entry.dt_txt);
                let rain = 0, snow = 0;
                if (Object.keys(entry).indexOf('rain') !== -1)
                    if (Object.keys(entry.rain).indexOf('3h') !== -1) {
                        rain = entry.rain['3h'];
                        rain_ += entry.rain['3h'];
                    }
                if (Object.keys(entry).indexOf('snow') !== -1)
                    if (Object.keys(entry.snow).indexOf('3h') !== -1) {
                        snow = entry.snow['3h'];
                        snow_ += entry.snow['3h'];
                    }

                readings.push(new objects.Reading(utils.parseAPIDate(entry.dt_txt).getHours() + ':00', 
                        new objects.Temp(entry.main.temp.toFixed(1)), 
                        new objects.Wind(entry.wind.deg.toFixed() + '&#176;', entry.wind.speed.toFixed()), 
                        new objects.Humidity(entry.main.humidity.toFixed()), 
                        new objects.Pressure(entry.main.pressure.toFixed(2)), 
                        new objects.Precipitation('rain', rain !== 0 ? rain.toFixed() : 0), 
                        new objects.Precipitation('snow', snow !== 0 ? snow.toFixed() : 0)));
            }
            const precipitationRain = rain_ !== 0 ? new objects.Precipitation('rain', (rain_ / day_.length).toFixed()) : 
                new objects.Precipitation('rain', rain_.toFixed());
            const precipitationSnow = snow_ !== 0 ? new objects.Precipitation('snow', (snow_ / day_.length).toFixed()) : 
                new objects.Precipitation('snow', snow_.toFixed())
            const icon = typeof weatherCodes[self.getMostFrequentCondition(day_).toString()].icon === 'string' ? 
                weatherCodes[self.getMostFrequentCondition(day_).toString()].icon : 
                weatherCodes[self.getMostFrequentCondition(day_).toString()].icon.day; // TODO: Determine which icon to use

            self.forecast.push(new objects.Day(date, 
            'http://openweathermap.org/img/w/' + icon + '.png',
            new objects.Temp((temp / day_.length).toFixed(1), Math.min(...temps).toFixed(), Math.max(...temps).toFixed()),
            new objects.Wind((windDirection / day_.length).toFixed() + '&#176;', (windSpeed / day_.length).toFixed()),
            new objects.Humidity((humidity_ / day_.length).toFixed()),
            new objects.Pressure((pressure_ / day_.length).toFixed(2)),
            precipitationRain, 
            precipitationSnow, readings));
        }
        self.selectedDay(self.forecast()[0]);
    }
    this.constructCurrent = function() {
        const currentForecast = this.response;
        self.currentTemp(currentForecast.main.temp);
        self.currentWindDirection(currentForecast.wind.deg || '---');
        self.currentWindSpeed(currentForecast.wind.speed);
        self.currentHum(currentForecast.main.humidity);
        self.currentPress(currentForecast.main.pressure);
        self.currentClouds(currentForecast.clouds.all);
        self.currentConditionsIcon('http://openweathermap.org/img/w/' + currentForecast.weather[0].icon + '.png');
        self.currentConditionsText(utils.titalize(currentForecast.weather[0].description));
        self.latestUpdateDate(new Date());
        self.calculateLatestUpdate();
    }
    this.selectDay = function(day) {
        self.selectedDay(day);
    }
    this.selectedDay = ko.observable();
    this.reportDate = ko.computed(function() {
        return self.selectedDay() ? utils.parseWeekday(self.selectedDay().date.getDay()) + ' ' +
            self.selectedDay().date.getDate() + ' ' + 
            utils.parseMonth(self.selectedDay().date.getMonth()) : '--- -- ---';
    });
    this.calculateWind = function(direction, speed, output = 'text') {
        let direction_;
        if (direction >= 260 && direction <= 280)
            direction_ = 'W';
        else if (direction >= 280 && direction <= 350)
            direction_ = 'NW';
        else if (direction >= 350 && direction <= 10)
            direction_ = 'N';
        else if (direction >= 10 && direction <= 80)
            direction_ = 'NE';
        else if (direction >= 80 && direction <= 100)
            direction_ = 'E';
        else if (direction >= 100 && direction <= 170)
            direction_ = 'SE';
        else if (direction >= 170 && direction <= 190)
            direction_ = 'S';
        else if (direction >= 190 && direction <= 260)
            direction_ = 'SW';
        if (output === 'text')
            return direction_ + ' @ ' + speed.toFixed() + ' ' + self.activeSpeedUnit().mnemonic;
        if (output === 'arrow') // TODO: Figure out how to display an arrow pointing opposite to the direction that the wind is blowing from
            return direction_ + ' @ ' + speed.toFixed() + ' ' + self.activeSpeedUnit().mnemonic;
        if (output === 'number')
            return direction + '&#176;' + ' @ ' + speed.toFixed() + ' ' + self.activeSpeedUnit().mnemonic;
    }

    this.FORECAST_5_DAYS = 'forecast';
    this.CURRENT_CONDITIONS = 'weather';
    this.weatherType = ko.observable(this.FORECAST_5_DAYS);
    this.apiCall = ko.pureComputed(function() {
        return 'http://api.openweathermap.org/data/2.5/' + self.weatherType() + 
        '/?APPID=18ed9fdaa2110e66a69a476be0df2ca9' + '&id=' + self.selectedLocation().id + 
        '&units=' + self.activeUnit().name
    });

    this.updateForecast = function() {
        self.weatherType(self.FORECAST_5_DAYS);
        const weatherRequest = new XMLHttpRequest();
        weatherRequest.responseType = 'json';        
        weatherRequest.open('GET', self.apiCall());
        weatherRequest.timeout = utils.weatherUpdateTimeout;
        weatherRequest.onload = self.constructForecast.bind(weatherRequest);
        weatherRequest.send();
    }
    this.updateCurrent = function() {
        self.weatherType(self.CURRENT_CONDITIONS);
        const weatherRequest = new XMLHttpRequest();
        weatherRequest.responseType = 'json';        
        weatherRequest.open('GET', self.apiCall());
        weatherRequest.timeout = utils.weatherUpdateTimeout;
        weatherRequest.onload = self.constructCurrent.bind(weatherRequest);
        weatherRequest.send();
    }
    this.updateWeather = function() {
        if (weatherCodes == undefined)
            throw new Error('The weeather codes table is empty.');
        self.updateForecast();
        self.updateCurrent();
    }
    this.periodicUpdate =  function() {
        setInterval(self.updateWeather, utils.weatherUpdateInterval);
    }
    this.searchLocationActive = ko.observable(false);
    this.activateLocationSearch = function() {
        self.searchLocationActive(true);
    }
    this.deactivateLocationSearch = function() {
        self.searchLocationActive(false);
        self.locationFromInput('');
        self.locationsList.removeAll();
        self.locationsDisplayList.removeAll();
    }
    this.locationFromInput = ko.observable('');
    this.selectedLocation = ko.observable(new objects.Location(2934246, 'Dusseldorf', 'DE'));
    this.locationIndex = ko.observable(0);
    this.locationsLimit = 500;
    this.locationsList = ko.observableArray([]);
    this.locationsDisplayList = ko.observableArray([]);
    this.searchLocation = function() {
        if (self.locationFromInput().trim().length !== 0) {
            self.locationsList.removeAll();
            self.locationsDisplayList.removeAll();
            const cities = utils.getCityByName(self.locationFromInput());
            if (cities.length !== 0) {
                for (let city of cities)
                    self.locationsList.push(new objects.Location(city.id, city.name, city.country));
                self.locationIndex(0);
                self.updateLocations(self.locationsList(), self.locationIndex(), self.locationsLimit);
            }
        } 
        else {
            self.locationsList.removeAll();
            self.locationsDisplayList.removeAll();
        }
        return true;
    }
    this.updateLocations = function(allLocations, nthLocation, limit) {
        if (nthLocation === 0)
            self.locationsDisplayList.removeAll();
        let a = [];
        for (let i = nthLocation; i < nthLocation + limit; i++) {
            if (self.locationsDisplayList().length === allLocations.length) 
                break;
            a.push(allLocations[i]);
            self.locationsDisplayList.push(allLocations[i]);
        }
    }
    this.showNextSegmentOfLocations = function(data, event) {
        if (Math.abs(event.target.scrollTop) === (event.target.scrollHeight - event.target.offsetHeight)) {
            self.locationIndex(self.locationIndex() + self.locationsLimit + 1);
            self.updateLocations(self.locationsList(), self.locationIndex(), self.locationsLimit);
        }
    }
    this.changeLocation = function(location) {
        self.selectedLocation(location);
        storeItem('sws_selectedLocation', JSON.stringify(self.selectedLocation()));
        self.updateWeather();
        self.locationsList.removeAll();
        self.locationsDisplayList.removeAll();
        self.currentLocationName(location.name);
        self.searchLocationActive(false);
        self.locationFromInput('');
        self.locElementWidth(self.selectedLocation().name.length * 23);
    }
    this.locElementWidth = ko.observable('auto');
    this.buttonPressed = function(data, event) {
        if (event.key.toLowerCase() === 'escape')
            self.deactivateLocationSearch();
    }
    this.getMostFrequentCondition = function(day) {
        let conditions = {};
        for (let entry of day) {
            const weatherId = entry.weather[0].id.toString();
            if (Object.keys(conditions).indexOf(weatherId) === -1)
                conditions[weatherId] = 1;
            else
                conditions[weatherId] += 1
        }
        let mostFrequentCondition = 0; let conditionCount = 0;
        for (let condition in conditions)
            if (conditions[condition] > conditionCount) {
                conditionCount = conditions[condition];
                mostFrequentCondition = condition;
            }
        return mostFrequentCondition;
    }
}