import { citiesDatabase } from './cities_database_loader.js';
import * as objects from './objects.js';


export const localFileFetchTimeout = 120000;
export const weatherUpdateTimeout = 300000;
export const weatherUpdateInterval = 300000;
export const latestWeatherUpdateCalculationInterval = 1000;

export const daysMapping = { 
    0: { short: 'Sun', long: 'Sunday' },
    1: { short: 'Mon', long: 'Monday' },
    2: { short: 'Tue', long: 'Tuesday' },
    3: { short: 'Wed', long: 'Wednesday' },
    4: { short: 'Thu', long: 'Thursday' },
    5: { short: 'Fri', long: 'Friday' },
    6: { short: 'Sat', long: 'Saturday' }
}
const monthsMapping = { 
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
export const parseWeekday = function(day, format = 'short') {
    return daysMapping[day][format];
}
export const parseMonth = function(month, format = 'short') {
    return monthsMapping[month][format];
}
export const parseAPIDate = function(date) {
    const split = date.split(' ');
    const dateSplit = split[0].split('-');
    const timeSplit = split[1].split(':');
    return new Date(dateSplit[0] + '-' + dateSplit[1] + '-' + dateSplit[2] + 
            'T' + timeSplit[0] + ':' + timeSplit[1]);
}
export const capitalize = function(string) {
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
export const titalize = function(string) {
    const split = string.split(' ');
    if (split.length > 0) {
        let newStringArray = [];
        for (let chunk of split) {
            newStringArray.push(capitalize(chunk));
        }
        return newStringArray.join(' ');
    } 
    return capitalize(string);
}
export const getCityByName = function(name) {
    if (citiesDatabase === undefined)
        throw new Error('The cities database is empty.');
    let cities = [];
    for (let city of citiesDatabase)
        if (city.name.toLowerCase().includes(name.toLowerCase()))
            cities.push(new objects.City(city.id, city.name, city.country, 
                        new objects.Coords(city.coord.lat, city.coord.long)));
    return cities;
}

