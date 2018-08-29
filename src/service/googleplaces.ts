export function Parse(gData) {
    var output: any = {};
    var address: any = {};
    if (gData.formatted_address)
        output.Address = gData.formatted_address;
    if (gData.name)
        output.Name = gData.name;
    if (typeof gData.icon === 'string' && !(gData.icon.indexOf('generic_business') === -1))
        output.Logo = gData.icon;
    /*if (gData.types) {
    }*/
    return output;
};

/*
https://developers.google.com/places/web-service/search
https://developers.google.com/maps/documentation/javascript/places
https://maps.googleapis.com/maps/api/place/textsearch/json?query=www.octi.ca&key=AIzaSyAEVLkug0ZUykkhFRElgv2op69JHTNT2IM
http://stackoverflow.com/questions/14343965/google-places-library-without-map*/
var container;
export function Search(query: string, callback, faultCallback?) {
    var request: google.maps.places.TextSearchRequest = {
        query: query
    };

    if (!container)
        container = document.createElement('div');
    var service = new google.maps.places.PlacesService(container);
    service.textSearch(request, (results, status) => {
        if (status == google.maps.places.PlacesServiceStatus.OK && results && results.length)
            callback(Parse(results[0]));
        else if (faultCallback)
            faultCallback(status);
    });

    /*var settings: Ajax.RequestOptions = {
        url: 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + encodeURIComponent(query) + '&key=' + ServiceSettings.Google.ApiKey,
        method: 'GET',
        async: true,
        handleAs: "json"
    };

    Ajax.generateRequest(settings, (output) => {
        if (output.status == google.maps.places.PlacesServiceStatus.OK && output.results && output.results.length) {
            callback(GooglePlaces.Parse(output.results[0]));
        }
        else if (faultCallback) {
            faultCallback(output.error_message || status);
        }
    }, (request: Ajax.Request, error) => {
        if (faultCallback)
            faultCallback(error);
    });*/
};