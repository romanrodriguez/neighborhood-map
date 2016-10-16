"use strict";

var map;

// Create a new blank array for all the listing markers.
var markers = [];

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;

// Create placemarkers array to use in multiple functions to have control
// over the number of places that show.
var placeMarkers = [];

// Foursquare API Userless Access
var FOURSQUARE_URL = "https://api.foursquare.com/v2/venues/explore?client_id=ELY3E2TUMOBQYW2RNN3PAFUPSK0MXYYH35YHUCHNLKE1RSNX&client_secret=MZYLG135WRNP2ETN4PMEXVFNPEWWTQLIR4ODFO5CBJK0KLXD";

// Foursquare API Settings
var FOURSQUARE_SETTINGS = {
      ll: '37.4419, -122.1430',
      limit: 50,
      section: 'topPicks',
      v: '20160903',
      m: 'foursquare'
}

// Instance of Venue Model 
var VenueModel = function (data) {
    var lat = data.venue.location.lat;
    var lng = data.venue.location.lng;
    this.position = new google.maps.LatLng(lat, lng);

    this.name = ko.observable(data.venue.name);
    this.address = data.venue.location.formattedAddress || '';

    this.marker = new google.maps.Marker({
        map: map,
        position: this.position,
        title: name,
        animation: google.maps.Animation.DROP,
    });
}

// Animation to bounce marker
VenueModel.prototype.bounce = function() {
    var obj;
    if (this.hasOwnProperty('marker')) {
        obj = this.marker;
    } else {
        obj = this;
    }
    obj.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        obj.setAnimation(null);
    }, 1000);
}

// Pop up Infowindow for marker
VenueModel.prototype.info = function() {
    var contentString = '<div>' + this.name() +  '</div>' + '<div>' + this.address; + '</div>'
    var largeInfowindow = new google.maps.InfoWindow();
    largeInfowindow.setContent(contentString);
    largeInfowindow.open(map, this.marker);
    if (largeInfowindow.open){
        this.largeInfowindow.close;
    }
}

// Animation for marker when it is clicked.
VenueModel.prototype.animate = function() {
    this.bounce();
    this.info();
}

// ViewModel
var mapViewModel = function() {
    var self = this;
    self.venues = ko.observableArray([]);
    self.keyword = ko.observable('');
    self.foursquareVenues = ko.observableArray([]);
    // JSON Foursquare API
    $.getJSON(FOURSQUARE_URL, FOURSQUARE_SETTINGS).done(function(data) {
        self.foursquareVenues(data.response.groups[0].items);
        self.bounds = new google.maps.LatLngBounds();

        for (var i = 0; i < self.foursquareVenues().length; i++) {
            var venue = new VenueModel(self.foursquareVenues()[i]);
            self.venues.push(venue);
            self.bounds.extend(venue.position);
            map.fitBounds(self.bounds);
            map.setCenter(self.bounds.getCenter());
        }
    }).fail(function(jqXHR, status, error) {
        alert("We couldn't reach the Forsquare API. Please, try again later.");
    });

    self.showVenues = ko.computed(function() {
        return self.venues().filter(function(venue) {
            if (venue.name().toLowerCase().indexOf(self.keyword().toLowerCase()) > -1) {
                venue.marker.setMap(map);

                venue.marker.addListener('click', function(){
                    map.panTo(venue.position);
                    venue.animate();
                });
                return true;
            } else {
                venue.marker.setMap(null);
                return false;
            }
        });
    });
}

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 37.5087133,
            lng: -122.2945044
        },
        zoom: 10,
        styles: styles,
        mapTypeControl: false
    });

	// Resize canvas for responsiveness
	google.maps.event.addDomListener(window, "resize", function() {
	   var center = map.getCenter();
	   google.maps.event.trigger(map, "resize");
	   map.setCenter(center); 
	});

    // These are my hard-coded favorite locations.
    // Normally we'd have these in a database instead.
    var locations = [{
        title: 'Golden Gate Bridge',
        location: {
            lat: 37.819929,
            lng: -122.478255
        }
    }, {
        title: 'Googleplex',
        location: {
            lat: 37.422,
            lng: -122.084057
        }
    }, {
        title: 'Udacity',
        location: {
            lat: 37.399864,
            lng: -122.1084
        }
    }, {
        title: 'Chinatown',
        location: {
            lat: 37.794138,
            lng: -122.407791
        }
    }, {
        title: 'Muir Woods',
        location: {
            lat: 37.895369,
            lng: -122.578071
        }
    }];

    var largeInfowindow = new google.maps.InfoWindow();

    // Initialize the drawing manager.
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('0091ff');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');

    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        var position = locations[i].location;
        var title = locations[i].title;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: i
        });
        // Push the marker to our array of markers.
        markers.push(marker);
        // Create an onclick event to open the large infowindow at each marker.
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });
        // Two event listeners - one for mouseover, one for mouseout,
        // to change the colors back and forth.
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
    }
    document.getElementById('show-listings').addEventListener('click', showListings);

    document.getElementById('hide-listings').addEventListener('click', function() {
        hideMarkers(markers);
    });

    document.getElementById('toggle-drawing').addEventListener('click', function() {
        toggleDrawing(drawingManager);
    });

    // Add an event listener so that the polygon is captured,  call the
    // searchWithinPolygon function. This will show the markers in the polygon,
    // and hide any outside of it.
    drawingManager.addListener('overlaycomplete', function(event) {
        // First, check if there is an existing polygon.
        // If there is, get rid of it and remove the markers
        if (polygon) {
            polygon.setMap(null);
            hideMarkers(markers);
        }
        // Switching the drawing mode to the HAND (i.e., no longer drawing).
        drawingManager.setDrawingMode(null);
        // Creating a new editable polygon from the overlay.
        polygon = event.overlay;
        polygon.setEditable(true);
        // Searching within the polygon.
        searchWithinPolygon(polygon);
        // Make sure the search is re-done if the poly is changed.
        polygon.getPath().addListener('set_at', searchWithinPolygon);
        polygon.getPath().addListener('insert_at', searchWithinPolygon);
    });
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
            }
        }
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
}

// This function will loop through the markers array and display them all.
function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// This shows and hides (respectively) the drawing options.
function toggleDrawing(drawingManager) {
    if (drawingManager.map) {
        drawingManager.setMap(null);
        // In case the user drew anything, get rid of the polygon
        if (polygon !== null) {
            polygon.setMap(null);
        }
    } else {
        drawingManager.setMap(map);
    }
}

// This function hides all markers outside the polygon,
// and shows only the ones within it. This is so that the
// user can specify an exact area of search.
function searchWithinPolygon() {
    for (var i = 0; i < markers.length; i++) {
        if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
            markers[i].setMap(map);
        } else {
            markers[i].setMap(null);
        }
    }
}

// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Set the marker property on this infowindow so it isn't created again.
            infowindow.marker = marker;
            var innerHTML = '<div>';
            if (place.name) {
                innerHTML += '<strong>' + place.name + '</strong>';
            }
            if (place.formatted_address) {
                innerHTML += '<br>' + place.formatted_address;
            }
            if (place.formatted_phone_number) {
                innerHTML += '<br>' + place.formatted_phone_number;
            }
            if (place.opening_hours) {
                innerHTML += '<br><br><strong>Hours:</strong><br>' +
                    place.opening_hours.weekday_text[0] + '<br>' +
                    place.opening_hours.weekday_text[1] + '<br>' +
                    place.opening_hours.weekday_text[2] + '<br>' +
                    place.opening_hours.weekday_text[3] + '<br>' +
                    place.opening_hours.weekday_text[4] + '<br>' +
                    place.opening_hours.weekday_text[5] + '<br>' +
                    place.opening_hours.weekday_text[6];
            }
            if (place.photos) {
                innerHTML += '<br><br><img src="' + place.photos[0].getUrl({
                    maxHeight: 100,
                    maxWidth: 200
                }) + '">';
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
        }
    });
}

function startMap() {
	initMap();
	ko.applyBindings(new mapViewModel());
}

// This makes sure to warn the user if Google Maps is unavailable.
function googleError() {
    document.getElementById('map').innerHTML = '<div class="map-error">Google Maps is unavailable. Please try again later.</div>';
}