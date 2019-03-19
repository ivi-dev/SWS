export let citiesDatabse;
export function loadCitiesDatabase(source = '/data/city_list.json') {
    const cityListRequest = new XMLHttpRequest();
    cityListRequest.responseType = 'json';        
    cityListRequest.open('GET', source);
    cityListRequest.onload = function() { citiesDatabse = cityListRequest.response; }
    cityListRequest.send();
};