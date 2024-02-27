// Store URL for earthquake data and tectonic plate data
var earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson";
var plateUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Define a function to create the map
function createMap(earthquakeMarkers, plateLayer) {
    // Create the tile layer for the map background using OpenStreetMap
    var myMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // Define the base maps with "World Map" as the only option
    var baseMaps = {
        "World Map": myMap
    };

    // Define the overlay maps with "Earthquakes" as the earthquake layer and "Tectonic Plates" as the plate layer
    var overlayMaps = {
        "Earthquakes": earthquakeMarkers,
        "Tectonic Plates": plateLayer
    };

    // Create the map object with options, centering it around Nashville, TN, and setting the initial zoom level
    var map = L.map("map", {
        center: [36.17, -86.76],
        zoom: 3,
        layers: [myMap, earthquakeMarkers, plateLayer]
    });

    // Create a layer control for toggling between base maps and overlay maps, and add it to the map
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(map);

    // Add legend for earthquake depth
    var legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
        var div = L.DomUtil.create("div", "legend"),
            depth = [-10, 10, 30, 50, 70, 90];

        div.innerHTML += "<h3 style='text-align: center'>Depth</h3>";

        for (var i = 0; i < depth.length; i++) {
            div.innerHTML +=
                '<i style="background:' + chooseColor(depth[i] + 1) + '"></i> ' + depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);
}

// Function to fetch and process earthquake data
function getEarthquakeData() {
    return d3.json(earthquakeUrl).then(function (response) {
        // Initialize an array to hold earthquake markers
        var earthquakeMarkers = [];

        // Loop through the features array in the response
        for (var i = 0; i < response.features.length; i++) {
            var location = response.features[i].geometry.coordinates;
            var magnitude = response.features[i].properties.mag;
            var depth = location[2];

            // Create a circle marker for each earthquake with specified properties
            var earthquakeMarker = L.circleMarker([location[1], location[0]], {
                radius: markerSize(magnitude),
                fillColor: chooseColor(depth),
                fillOpacity: 0.7,
                color: "black",
                stroke: true,
                weight: 0.5
            }).bindPopup("<h3>" + response.features[i].properties.place + "</h3><h3>Magnitude: " + magnitude + "</h3>");

            // Add the marker to the earthquakeMarkers array
            earthquakeMarkers.push(earthquakeMarker);
        }

        // Create a layer group from the earthquake markers array
        var earthquakeLayer = L.layerGroup(earthquakeMarkers);

        return earthquakeLayer;
    });
}

// Function to fetch and process tectonic plate data
function getPlateData() {
    return d3.json(plateUrl).then(function (response) {
        // Create a GeoJSON layer from the response data
        var plateLayer = L.geoJSON(response, {
            style: {
                color: "orange",
                weight: 2
            }
        });

        return plateLayer;
    });
}

// Perform API calls to retrieve earthquake data and tectonic plate data, and create the map
Promise.all([getEarthquakeData(), getPlateData()]).then(function (results) {
    var earthquakeMarkers = results[0];
    var plateLayer = results[1];
    createMap(earthquakeMarkers, plateLayer);
});

// Define functions to set marker size based on earthquake magnitude and assign colors based on depth
function markerSize(magnitude) {
    return magnitude * 7;
}

function chooseColor(depth) {
    if (depth < 10) return "green";
    else if (depth < 30) return "greenyellow";
    else if (depth < 50) return "yellow";
    else if (depth < 70) return "orange";
    else if (depth < 90) return "orangered";
    else return "red";
}