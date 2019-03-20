export const localFileFetchTimeout = 120000;
export const weatherUpdateTimeout = 300000;
export const weatherUpdateInterval = 300000;
export const latestWeatherUpdateCalculationInterval = 1000;

// export const defaultLocaion = new Location(2934246, 'Dusseldorf', 'DE');

export function storeItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        throw new Error('The item cold not be stored because: ' + error.message);
    }
}

export function getItem(key) {
    return localStorage.getItem(key);
}

