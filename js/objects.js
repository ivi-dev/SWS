export function City(id, name, country, coords) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.coords = coords;
}

export function Coords(lat, long) {
    this.lat = lat;
    this.long = long;
}

export function Unit(name, symbol, mnemonic, reverse = false) {
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

export function Temp(avg = 'n/a', min, max) {
    this.avg = avg;
    this.min = min;
    this.max = max;
    this.reading = this.min != undefined && this.max != undefined ? 
        this.min.toString() + self.activeUnit().symbol + '/' + this.max.toString() + self.activeUnit().symbol : 
        this.avg.toString() + self.activeUnit().symbol;
}

export function Wind(direction = 'n/a', velocity = 'n/a', separator = '@', unit = self.activeSpeedUnit().mnemonic) {
    this.direction = direction;
    this.velocity = velocity;
    this.separator = separator;
    this.unit = unit;
    this.reading = this.direction + ' ' + this.separator + ' ' + this.velocity + ' ' + this.unit;
}

export function Humidity(percent = 'n/a', unit = '%') {
    this.percent = percent;
    this.unit = unit;
    this.reading = this.percent + this.unit;
}

export function Pressure(value = 'n/a', unit = 'hPa') {
    this.value = value;
    this.unit = unit;
    this.reading = this.value + ' ' + this.unit;
}

export function Precipitation(type = 'rain', value = 'n/a', unit = 'mm') {
    this.type = type;
    this.value = value;
    this.unit = unit;
    this.reading = this.value + this.unit;
}

export function Day(date, icon, temp, wind, humidity, pressure, rain, snow, readings) {
    this.date = date;
    this.icon = icon;
    this.temp = temp;
    this.wind = wind;
    this.humidity = humidity;
    this.pressure = pressure;
    this.rain = rain;
    this.snow = snow;
    this.readings = readings;
}

export function Reading(time, temp, wind, humidity, pressure, rain, snow) {
    this.time = time;
    this.temp = temp;
    this.wind = wind;
    this.humidity = humidity;
    this.pressure = pressure;
    this.rain = rain;
    this.snow = snow;
}

export function Location(id, name, country) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.output = this.name + ', ' + this.country;
}