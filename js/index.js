import { weatherCodes, loadWeatherCodes } from './weather_codes_loader.js';
import { citiesDatabse, loadCitiesDatabase } from './cities_database_loader.js';


function MainViewModel() {
    // Constants
    self = this;

    this.LOCATION_SYMBOL_CLASS = 'fas fa-map-marker-alt';
    this.DATE_NOW = new Date();
    this.daysMapping = { 
        0: { short: 'Sun', long: 'Sunday' },
        1: { short: 'Mon', long: 'Monday' },
        2: { short: 'Tue', long: 'Tuesday' },
        3: { short: 'Wed', long: 'Wednesday' },
        4: { short: 'Thu', long: 'Thursday' },
        5: { short: 'Fri', long: 'Friday' },
        6: { short: 'Sat', long: 'Saturday' }
    }
    this.monthsMapping = { 
        0: { short: 'Jan.', long: 'January' },
        1: { short: 'Feb.', long: 'February' },
        2: { short: 'Mar.', long: 'March' },
        3: { short: 'Apr.', long: 'April' },
        4: { short: 'May.', long: 'May' },
        5: { short: 'Jun.', long: 'June' },
        6: { short: 'Jul.', long: 'July' },
        7: { short: 'Aug.', long: 'August' },
        8: { short: 'Sep.', long: 'September' },
        9: { short: 'Oct.', long: 'October' },
        10: { short: 'Nov.', long: 'November' },
        11: { short: 'Dec.', long: 'December' }
    }
    
    // Unit chooser
    this.tempUnits = ko.observableArray([
        new Unit('imperial', '&#176;', 'F', true),
        new Unit('metric', '&#176;', 'C', true)
    ]);
    this.speedUnits = ko.observableArray([
        new Unit('imperial', '', 'mph'),
        new Unit('metric', '', 'm/s')
    ]);
    this.pressureUnits = ko.observableArray([
        new Unit('imperial', '', 'inHg'),
        new Unit('metric', '', 'hPa')
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
    
    this.locationId = ko.observable(2934246);
    this.currentLocationName = ko.observable('DUSSELDORF');
    this.locationMarker = ko.observable('fas fa-map-marker-alt');
    this.currentDate = ko.pureComputed(function() {
        let day = self.DATE_NOW.getDay();
        let date = self.DATE_NOW.getDate();
        let month = self.DATE_NOW.getMonth();
        let year = self.DATE_NOW.getFullYear();
        return self.parseWeekday(day, 'long') + ' ' + date + ' ' + self.parseMonth(month) + ' ' + year;
    });
    this.weatherUpdateInterval = ko.observable(600000);
    this.parseWeekday = function(day, format = 'short') {
        return self.daysMapping[day][format];
    }
    this.parseMonth = function(month, format = 'short') {
        return self.monthsMapping[month][format];
    }
    this.parseAPIDate = function(date) {
        const split = date.split(' ');
        const dateSplit = split[0].split('-');
        const timeSplit = split[1].split(':');
        // console.log(new Date(dateSplit[0] + '-' + dateSplit[1] + '-' + dateSplit[2] + 'T' + timeSplit[0] + ':' + timeSplit[1]));
        return new Date(dateSplit[0] + '-' + dateSplit[1] + '-' + dateSplit[2] + 'T' + timeSplit[0] + ':' + timeSplit[1]);
    }
    this.capitalize = function(string) {
        const split = string.split('');
        let newStringArray = [];
        split.forEach((char, index) => { 
            if (index == 0) 
                newStringArray.push(char.toUpperCase());
            else
                newStringArray.push(char.toLowerCase());
        });
        return newStringArray.join('');
    }
    this.titalize = function(string) {
        const split = string.split(' ');
        if (split.length > 0) {
            let newStringArray = [];
            for (let chunk of split) {
                newStringArray.push(self.capitalize(chunk));
            }
            return newStringArray.join(' ');
        } 
        return self.capitalize(string);
    }
    
    // 5-day forecast
    this.forecastWeather = ko.observableArray();
    this.forecast = ko.observableArray([
    ]);
    this.getCityByName = function(name) {
        if (citiesDatabse === undefined)
            throw new Error('The cities database is empty.');
        let cities = [];
        for (let city of citiesDatabse)
            if (city.name === name)
                cities.push(new City(city.id, city.name, city.country, new Coords(city.coord.lat, city.coord.long)));
        return cities;
    }
    this.getCityById = function(id) {
        if (citiesDatabse === undefined)
            throw new Error('The cities database is empty.');
        let city;
        for (let city of citiesDatabse)
            if (city.id === id)
                cities.push(new City(city.id, 
                                     city.name, 
                                     city.country, 
                                     new Coords(city.coord.lat, city.coord.long)));
        return city;
    }
    this.isEmpty = function(something) {
        if (Array.isArray(something)) {
            if (something.length === 0)
                return true;
            return false;
        }
        else {
            if (Object.keys(something).length === 0)
                return true;
            return false;
        }
    }
    this.constructForecast = function() {
        self.forecast.removeAll();
        let next5Days = {};
        const forecast = this.response.list;
        for (let entry of forecast) {
            const day = self.parseWeekday(self.parseAPIDate(entry.dt_txt).getDay());
            if (day != self.parseWeekday(self.DATE_NOW.getDay())) {
                if (Object.keys(next5Days).indexOf(day) === -1)
                    next5Days[day] = [];
                next5Days[day].push(entry);                    
            }
        }
        // console.log(next5Days);
        for (let day in next5Days) {
            const day_ = next5Days[day];
            let temp = 0, temps = [], windDirection = 0, windSpeed = 0, humidity_ = 0, pressure_ = 0;
            let rain_ = 0,  snow_ = 0;
            for (let entry of day_) {
                temp += entry.main.temp;
                temps.push(entry.main.temp);
                windDirection += entry.wind.deg;
                windSpeed += entry.wind.speed;
                humidity_ += entry.main.humidity;
                pressure_ += entry.main.pressure;
                if (Object.keys(entry).indexOf('rain') !== -1)
                    if (Object.keys(entry.rain).length !== 0)
                        rain_ += entry.rain['3h'];
                if (Object.keys(entry).indexOf('snow') !== -1)
                    if (Object.keys(entry.snow).length !== 0)
                        snow_ += entry.snow['3h'];
            }
            const precipitationRain = rain_ !== 0 ? new Precipitation('rain', (rain_ / day_.length).toFixed()) : 
                new Precipitation('rain', rain_.toFixed());
            const precipitationSnow = snow_ !== 0 ? new Precipitation('snow', (snow_ / day_.length).toFixed()) : 
                new Precipitation('snow', snow_.toFixed())
            const icon = typeof weatherCodes[self.getMostFrequentCondition(day_).toString()].icon === 'string' ? 
                weatherCodes[self.getMostFrequentCondition(day_).toString()].icon : 
                weatherCodes[self.getMostFrequentCondition(day_).toString()].icon.day; // TODO: Determine which icon to use

            self.forecast.push(new Day(self.capitalize(day), 
            'http://openweathermap.org/img/w/' + icon + '.png',
            new Temp((temp / day_.length).toFixed(1), Math.min(...temps).toFixed(), Math.max(...temps).toFixed()),
            new Wind((windDirection / day_.length).toFixed() + '&#176;', (windSpeed / day_.length).toFixed()),
            new Humidity((humidity_ / day_.length).toFixed()),
            new Pressure((pressure_ / day_.length).toFixed(2)),
            precipitationRain, 
            precipitationSnow));
        }
    }
    this.constructCurrent = function() {
        const currentForecast = this.response;
        self.currentTemp(currentForecast.main.temp);
        self.currentWindDirection(currentForecast.wind.deg);
        self.currentWindSpeed(currentForecast.wind.speed);
        self.currentHum(currentForecast.main.humidity);
        self.currentPress(currentForecast.main.pressure);
        self.currentClouds(currentForecast.clouds.all);
        self.currentConditionsIcon('http://openweathermap.org/img/w/' + currentForecast.weather[0].icon + '.png');
        self.currentConditionsText(self.titalize(currentForecast.weather[0].description))
    }
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
        '/?APPID=18ed9fdaa2110e66a69a476be0df2ca9' + '&id=' + self.locationId() + 
        '&units=' + self.activeUnit().name
    });

    this.updateForecast = function() {
        self.weatherType(self.FORECAST_5_DAYS);
        const weatherRequest = new XMLHttpRequest();
        weatherRequest.responseType = 'json';        
        weatherRequest.open('GET', self.apiCall());
        weatherRequest.onload = self.constructForecast.bind(weatherRequest);
        weatherRequest.send();
    }
    this.updateCurrent = function() {
        self.weatherType(self.CURRENT_CONDITIONS);
        const weatherRequest = new XMLHttpRequest();
        weatherRequest.responseType = 'json';        
        weatherRequest.open('GET', self.apiCall());
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
        setInterval(self.updateWeather, self.weatherUpdateInterval());
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

// Denotes a city
function City(id, name, country, coords) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.coords = coords;
}

// Denotes geo coordinates
function Coords(lat, long) {
    this.lat = lat;
    this.long = long;
}

// Denotes a unit. Could be a unit for temperature, wind etc.
function Unit(name, symbol, mnemonic, reverse = false) {
    this.name = name;
    this.symbol = symbol;
    this.mnemonic = mnemonic;
    this.output = function() {
        if (reverse)
            return this.symbol + this.mnemonic;
        else
            return this.mnemonic + this.symbol;
    }
}

// Denotes a temperature pair of min and max values
function Temp(avg = 'n/a', min, max) {
    this.avg = avg;
    this.min = min;
    this.max = max;
    this.reading = this.min != undefined && this.max != undefined ? 
        this.min.toString() + self.activeUnit().symbol + '/' + this.max.toString() + self.activeUnit().symbol : 
        this.avg.toString() + self.activeUnit().symbol;
}

// Denotes a wind reading of a direction and a velocity
function Wind(direction = 'n/a', velocity = 'n/a', separator = '@', unit = self.activeSpeedUnit().mnemonic) {
    this.direction = direction;
    this.velocity = velocity;
    this.separator = separator;
    this.unit = unit;
    this.reading = this.direction + ' ' + this.separator + ' ' + this.velocity + ' ' + this.unit;
}

// Denotes a humidity reading
function Humidity(percent = 'n/a', unit = '%') {
    this.percent = percent;
    this.unit = unit;
    this.reading = this.percent + this.unit;
}

function Pressure(value = 'n/a', unit = 'hPa') {
    this.value = value;
    this.unit = unit;
    this.reading = this.value + ' ' + this.unit;
}

function Precipitation(type = 'rain', value = 'n/a', unit = 'mm') {
    this.type = type;
    this.value = value;
    this.unit = unit;
    this.reading = this.value + this.unit;
}

// Denotes a one day forecast. A 5-day forecast would feature 5 of these
function Day(name, icon, temp, wind, humidity, pressure, rain, snow) {
    this.name = name;
    this.icon = icon;
    this.temp = temp;
    this.wind = wind;
    this.humidity = humidity;
    this.pressure = pressure;
    this.rain = rain;
    this.snow = snow;
}

// function UnitChooserViewModel() {

// }

// ko.components.register('unit-chooser', {
//     viewModel: UnitChooserViewModel,
//     template: <see below>
// });

// Runs the weather updater automatically
ko.bindingHandlers.autoWeatherUpdate = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        window.onload = function() { 
            loadCitiesDatabase();
            loadWeatherCodes(bindingContext.$data.updateWeather);
            bindingContext.$data.periodicUpdate();
        }
    }
};

ko.applyBindings(new MainViewModel);
