// These are hard-coded locations. Normally we'd have these in a database instead.
var favoritePlaces = [{
    name: 'Golden Gate Bridge',
    location: {
        lat: 37.819929,
        lng: -122.478255
    }
}, {
    name: 'Googleplex',
    location: {
        lat: 37.422,
        lng: -122.084057
    }
}, {
    name: 'Udacity',
    location: {
        lat: 37.399864,
        lng: -122.1084
    }
}, {
    name: 'Fisherman\'s Wharf',
    location: {
        lat: 37.794565,
        lng: -122.40783
    }
}, {
    name: 'Muir Woods',
    location: {
        lat: 37.895369,
        lng: -122.578071
    }
}, {
    name: 'Napa Valley',
    location: {
        lat: 38.427432,
        lng: -122.39433
    }
}, {
    name: 'La Taqueria',
    location: {
        lat: 37.750896,
        lng: -122.418087
    }
}, {
    name: 'Dolores Park',
    location: {
        lat: 37.759773,
        lng: -122.427063
    }
}];

var map;
var infowindow;
var mapViewModel = new ViewModel();
var clickedLocation;
var searchLocation;

function initMap() {
    // Creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById("map"), {
        center: {
            lat: 37.5087133,
            lng: -122.2945044
        },
        zoom: 9,
        styles: styles,
        mapTypeControl: false
    });

    // Call generate markers
    generateMarkers();

    // Create empty infowindow
    infowindow = new google.maps.InfoWindow({
        maxWidth: 200
    });

    // Resize canvas for responsiveness
    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });
}

function PlaceContainer(location) {
    this.name = location.name;
    this.location = location.location;
    this.selectedLocation = ko.observable(false);
}

function generateMarkers() {
    // Generate a marker for each place. Store the location for accessibility and create a marker object.
    var place;
    var bounds = new google.maps.LatLngBounds();

    for (var i = 0; i < mapViewModel.locObservableArray().length; i++) {
        place = mapViewModel.locObservableArray()[i];
        var newMarker = new google.maps.Marker({
            map: map,
            position: place.location,
            title: place.name,
            animation: google.maps.Animation.DROP
        });

        place.marker = newMarker;

        newMarker.addListener('click', (function(place) {
            return function() {
                populateInfoWindow(place);
                toggleBounce(place);
                // To control color change of locations 
                if (clickedLocation) {
                    clickedLocation.selectedLocation(false);
                }
                clickedLocation = place;
                place.selectedLocation(true);
            };
        })(place));
    }
}

function toggleBounce(place) {
    if (place.marker.getAnimation() !== null) {
        place.marker.setAnimation(null);
    } else {
        place.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            place.marker.setAnimation(null);
        }, 2000);
    }
}

// Populate and open infowindow. Uses AJAX retrieved info and Knockout to update the UI.
function populateInfoWindow(location) {
    // Foursquare Credentials
    var FOURSQUARE_URL = 'https://api.foursquare.com/v2/venues/search';
    var CLIENT_ID = 'ELY3E2TUMOBQYW2RNN3PAFUPSK0MXYYH35YHUCHNLKE1RSNX';
    var CLIENT_SECRET = 'MZYLG135WRNP2ETN4PMEXVFNPEWWTQLIR4ODFO5CBJK0KLXD';

    // AJAX request.   
    function searchFoursquareVenues() {
        $.ajax({
            url: FOURSQUARE_URL,
            dataType: 'json',
            data: {
                limit: 10,
                ll: '37.5087133,-122.2945044',
                query: location.name,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                v: 20160903,
                m: 'foursquare',
            },
            async: true,

            success: function(result) {
                var nameSearched = result.response.venues[0];
                var addressSearched = nameSearched.location.address;
                var infoWindowInfo;

                if (nameSearched === null) {
                    infoWindowInfo = '<div class="infowindowHeader">' + location.name + "<br>" + 'NO ADDRESS DATA AVAILABLE.' + '</div>';
                } else {
                    infoWindowInfo = '<div class="infowindowHeader">' + location.name + "<br>" + addressSearched + '</div>';
                }

                infowindow.setContent(infoWindowInfo);
                infowindow.open(map, location.marker);
            },

            error: function() {
                alert('Foursquare data unavailable. Please try again later.');
            }
        });
    }
    searchFoursquareVenues();
}

function ViewModel() {
    var self = this;
    self.locObservableArray = ko.observableArray();

    var location;

    for (var i = 0; i < favoritePlaces.length; i++) {
        location = new PlaceContainer(favoritePlaces[i]);
        self.locObservableArray.push(location);
    }

    self.favoriteLocationClick = function(marker) {
        google.maps.event.trigger(this.marker, 'click');
    };

    self.sidebarControl = ko.observable();
    self.searchLocation = ko.observable();
    self.filterLocations = ko.computed(function() {
        if (!self.searchLocation() || self.searchLocation === undefined) {
            for (var i = 0; i < self.locObservableArray().length; i++) {
                if (self.locObservableArray()[i].marker !== undefined) {
                    self.locObservableArray()[i].marker.setVisible(true);
                }
            }
            return self.locObservableArray();

        } else {
            filter = self.searchLocation().toLowerCase();
            return ko.utils.arrayFilter(self.locObservableArray(),
                function(location) {
                    var matching = location.name.toLowerCase().indexOf(filter) > -1;
                    location.marker.setVisible(matching);
                    return matching;
                });
        }
    });
}

function startMap() {
    initMap();
    ko.applyBindings(mapViewModel);
}

// Warns the user if Google Maps is unavailable.
function googleError() {
    document.getElementById('map').innerHTML = '<div class="map-error">Google Maps is unavailable. Please try again later.</div>';
}

// Control responsive behavior for other screens
var sidebarControl = document.getElementById('sidebar');
var triggerSidebar = document.getElementById('triggerSidebar');
var mapControl = document.getElementById('map');

// Display sidebar
triggerSidebar.addEventListener('click', function(e) {
    sidebarControl.classList.toggle('open');
    e.stopPropagation();
});

// Hide sidebar
mapControl.addEventListener('click', function() {
    sidebarControl.classList.remove('open');
});
