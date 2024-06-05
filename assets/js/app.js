var API_KEY = "a27fff43faff7af28a2b63073b7d9e28";

// -- On load --
$(document).ready(function(){
    // If geolocation is not supported, hide the geolocation icon
    if (!navigator.geolocation){
        $('#geolocation').hide();
    }

    // Get the default city from local storage or use "Accra"
    var city = localStorage.getItem('lastCity') || "Accra";

    // Update the input field with the city name
    $('input[name="meteo-city"]').val(city);

    // Get and display the current date
    var date = moment();
    for (var i = 0; i < 5; i++){
        // Display date
        var day = $("#meteo-day-" + (i+1));
        day.find(".name").text(date.format("dddd"));
        day.find(".date").text(date.format("DD/MM"));
        // Go to the next day
        date = date.add(1, 'days')
    }

    // Loading...
    var loading = $('#search-loading');
    loading.attr('class', 'loading inload');

    // Get and update meteo
    getMeteoByCity(city, function (data, error) {
        if (error == null) {
            displayMeteo(data);
        } else {
            var meteoTitle = $('#meteo-title span');
            meteoTitle.html('City <span class="text-muted">' + city + '</span> not found');
        }
        // Stop loader
        setTimeout(function () {
            loading.attr('class', 'loading')
        }, 500);
    });
});

// -- Core --
$("#meteo-form").submit(function (event) {
    event.preventDefault();

    // Loading...
    var loading = $('#search-loading');
    loading.attr('class', 'loading inload');

    // Get and update meteo
    var city = event.currentTarget[0].value;

    // Save the city to local storage
    localStorage.setItem('lastCity', city);

    getMeteoByCity(city, function (data, error){
        if (error == null) {
            displayMeteo(data);
        } else {
            var meteoTitle = $('#meteo-title span');
            meteoTitle.html('City <span class="text-muted">' + city + '</span> not found');
        }
        // Stop loader
        setTimeout(function () {
            loading.attr('class', 'loading')
        }, 500);
    });

    // Don't refresh the page
    return false;
});

$("#geolocation").click(function (event) {
    navigator.geolocation.getCurrentPosition(function (position) {
        // Loading...
        var loading = $('#search-loading');
        loading.attr('class', 'loading inload');

        // Get latitude and longitude
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;

        // Get and update meteo
        getMeteoByCoordinates(lat, lon, function (data, error) {
            if (error == null) {
                displayMeteo(data);
            } else {
                var meteoTitle = $('#meteo-title span');
                meteoTitle.html('Can\'t get meteo for your position');
            }
            // Stop loader
            setTimeout(function () {
                loading.attr('class', 'loading')
            }, 500);
        });
    });
});

function getMeteoByCity(city, callback){
    $.ajax({
        url: "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&APPID=" + API_KEY,
        success: function(data){
            callback(data, null);
        },
        error: function(req, status, error){
            callback(null, error);
        }
    });
}

function getMeteoByCoordinates(lat, lon, callback){
    $.ajax({
        url: "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&APPID=" + API_KEY,
        success: function(data){
            callback(data, null);
        },
        error: function(req, status, error){
            callback(null, error);
        }
    });
}

function displaySunriseSunset(lat, long){
    var date = moment();
    for (var i = 0; i < 5; i++) {
        // Get sunrise and sunset
        var times = SunCalc.getTimes(date, lat, long);
        var sunrise = pad(times.sunrise.getHours(), 2) + ':' + pad(times.sunrise.getMinutes(), 2);
        var sunset = pad(times.sunset.getHours(), 2) + ':' + pad(times.sunset.getMinutes(), 2);
        // Display sunrise and sunset
        var day = $("#meteo-day-" + (i + 1));
        day.find('.meteo-sunrise .meteo-block-data').text(sunrise);
        day.find('.meteo-sunset .meteo-block-data').text(sunset);
        // Go to the next day
        date = date.add(1, 'days')
    }
}

function displayMeteo(data){
    // Update Google Map URL
    var googleMapCity = "https://www.google.fr/maps/place/" + data.city.coord.lat + "," + data.city.coord.lon;
    $('#meteo-title span').html('Weather in <a href="' + googleMapCity + '" class="text-muted meteo-city" target="_blank">' + data.city.name + ', ' + data.city.country + '</a>');
    
    // Update meteo for each day
    var tempMoyenne = 0;
    for (var i = 0; i < 5; i++){
        // Get meteo
        var meteo = data.list[i*8];
        // Get DOM elements
        var day = $("#meteo-day-" + (i + 1));
        var icon = day.find(".meteo-temperature .wi");
        var temperature = day.find(".meteo-temperature .data");
        var humidity = day.find(".meteo-humidity .meteo-block-data");
        var wind = day.find(".meteo-wind .meteo-block-data");
        // Update DOM
        var code = meteo.weather[0].id;
        icon.attr('class', 'wi wi-owm-' + code);
        temperature.text(toCelsius(meteo.main.temp) + "°C");
        humidity.text(meteo.main.humidity + "%");
        wind.text(meteo.wind.speed + " km/h");
        tempMoyenne += meteo.main.temp;
    }

    displaySunriseSunset(data.city.coord.lat, data.city.coord.lon);
    
    // Get custom gradient according to the temperature
    tempMoyenne = toCelsius(tempMoyenne / 5);
    var hue1 = 30 + 240 * (30 - tempMoyenne) / 60;
    var hue2 = hue1 + 30;
    var rgb1 = 'rgb(' + hslToRgb(hue1 / 360, 0.6, 0.5).join(',') + ')';
    var rgb2 = 'rgb(' + hslToRgb(hue2 / 360, 0.6, 0.5).join(',') + ')';
    $('body').css('background', 'linear-gradient(' + rgb1 + ',' + rgb2 + ')');
}

function toCelsius(kelvin) {
    return Math.round(kelvin - 273.15);
}

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
