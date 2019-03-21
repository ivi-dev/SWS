import { loadCitiesDatabase } from './cities_database_loader.js';
import { loadWeatherCodes } from './weather_codes_loader.js';
import * as utils from './utils.js';

ko.bindingHandlers.autoWeatherUpdate = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        window.onload = function() { 
            loadCitiesDatabase();
            loadWeatherCodes(bindingContext.$data.updateWeather);
            bindingContext.$data.periodicUpdate();
            bindingContext.$data.periodicLatestUpdateTimeCalculation();
        }
    }
};

ko.bindingHandlers.parseWeekday = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        element.innerText = utils.parseWeekday(ko.unwrap(valueAccessor()), allBindings.get('format'));
    }
};