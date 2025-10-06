// Tour page script (tour.html)


//these manage where in the tour we are
let currentTour = null;
let currentStopIndex = 0;
let userLocation = null;
let watchId = null;

// Leaflet map variables needed for the map
let map = null;
let userMarker = null;
let stopMarkers = [];

//make some markers
var pointIcon   = L.icon({
iconUrl: 'point-marker.png',
iconSize:     [20, 24], // size of the icon
iconAnchor:   [10, 20], // point of the icon which will correspond to marker's location
popupAnchor:  [0, -20] // point from which the popup should open relative to the iconAnchor
});

var walkingIcon   = L.icon({
iconUrl: 'walking-marker.png',
iconSize:     [20, 24], 
iconAnchor:   [10, 20], 
popupAnchor:  [0, -20] 
});

var currentIcon   = L.icon({
iconUrl: 'current-marker.png',
iconSize:     [20, 24], 
iconAnchor:   [10, 20], 
popupAnchor:  [0, -20]
});

// Wait for the page to load
document.addEventListener('DOMContentLoaded', function() {
    initializeTour();
});

// Initialize the tour when the page loads
async function initializeTour() {
    const tourId = localStorage.getItem('currentTourId'); //set in script.js just before navigating to this
    
    if (!tourId) {
        alert('No tour selected. Returning to tour selection.');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // Load the tour data 
        currentTour = await getTourById(tourId); // From tour-registry.js
        
        // Set up the tour
        setupTour();
        
        // Start watching user location
        startLocationTracking();
        
        // Load the first stop
        loadCurrentStop();
        
    } catch (error) {
        console.error('Error loading tour:', error);
        if (error && error.stack) { //make sure to log the error so you can actually see what's going wrong
            console.error('Stack trace:', error.stack);
        }
        alert('Error loading tour. Returning to tour selection.');
        window.location.href = 'index.html';
    }
}

// Set up the tour header and basic information
function setupTour() {
    document.getElementById('tour-title').textContent = currentTour.title;
    updateProgress();
    initializeMap();
}

// Initialize the Leaflet map
function initializeMap() {
    // Get coordinates from first stop as initial center
    const firstStop = currentTour.stops_data[0];
    const initialLat = firstStop.latitude;
    const initialLong = firstStop.longitude;
    
    // Initialize the map using the leaflet library
    map = L.map('leaflet-map').setView([initialLat, initialLong], 16);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', //openstreetmap requires attribution
        maxZoom: 19
    }).addTo(map);
    
    // Add markers for all tour stops
    for(let i = 0; i <currentTour.stops_data.length; i++){
        const stop = currentTour.stops_data[i];
        if (stop.type == "point") {//as opposed to a walk, which has no marker
            const lat = stop.latitude;
            const long = stop.longitude;
            
            if (lat && long) {
                const marker = L.marker([lat, long],{icon:pointIcon}).addTo(map);
                marker.bindPopup(`<b>${stop.title}</b><br>${stop.description}`);
                
                // Highlight current stop differently
                if (stop.id === currentStopIndex) {
                    marker.openPopup();
                }
                
                stopMarkers.push(marker);
            }
        }
    };

    // Add our icon to display the user using leaflet's marker with a different icon
    userMarker = L.marker([initialLat, initialLong], {
        icon: L.icon({//these are the default images in leaflet, but in theory you could edit them
            iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
            `),
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
    }).addTo(map);
    userMarker.bindPopup("You are here!");
}

function startLocationTracking() {
    if ('geolocation' in navigator) { 
        //navigator refers to the app running this code
        //in this case, we're going to use it's geolocation capabilities

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // 1 minute
        };
        

        //Watch position takes three arguments here,
        //the first is the success callback, which runs a function when it works
        //the second is the error callback, which runs another function if there's an error
        //the third is an options object which can update the behavior of the geolocation request
        watchId = navigator.geolocation.watchPosition(
            updateUserLocation,
            handleLocationError,
            options
        );
    } else {
        console.warn('Geolocation is not supported by this browser.');
        document.getElementById('simple-map').innerHTML = 
            '<p>⚠️ Location services not available</p>';
    }
}

function updateUserLocation(position) {
    userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };
    
    // Update user marker on map
    if (map) {
        if (userMarker) {
            userMarker.setLatLng([userLocation.latitude, userLocation.longitude]);
        } 
        // Center map on user location - do you always want this? You can edit this line.
        map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
    }
}

// Handle location errors
function handleLocationError(error) {
    console.warn('Location error:', error.message);
    /*
    const mapElement = document.getElementById('map-container');
    if (error.code === error.PERMISSION_DENIED) {
        mapElement.innerHTML = '<p>Location access denied<br>Please enable location services</p>';
    } else if (error.code === error.POSITION_UNAVAILABLE) {
        mapElement.innerHTML = '<p>Location unavailable<br>Please check your connection</p>';
    } else if (error.code === error.TIMEOUT) {
        mapElement.innerHTML = '<p>Location timeout<br>Trying again...</p>';
    } else {
        mapElement.innerHTML = '<p>Location error<br>Please refresh the page</p>';
    }
        */
}

// Load the current stop content
function loadCurrentStop() {
    if (!currentTour || currentStopIndex >= currentTour.stops_data.length) {
        return;
    }

    const stop = currentTour.stops_data[currentStopIndex];
    
    // Update stop information
    document.getElementById('location-title').textContent = stop.title;
    document.getElementById('location-description').textContent = stop.description;
    
    // Update detailed text content
    const textElement = document.getElementById('location-text');
    if (stop.text) {
        textElement.textContent = stop.text;
        textElement.style.display = 'block';
    } else {
        textElement.style.display = 'none';
    }
    
    const audioElement = document.getElementById('tour-audio');
    if (stop.audio && stop.audio.length > 0) {
        audioElement.src = stop.audio[0]; // Use first audio file for now
        audioElement.style.display = 'block';
    } else {
        audioElement.style.display = 'none';
    }
    
    // Update images
    loadStopImages(stop.images);
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Update progress
    updateProgress();

    // Close all popups first, and reset markers
    for(let i = 0; i < stopMarkers.length; i++){
        stopMarkers[i].closePopup();
        stopMarkers[i].setIcon(pointIcon);
    }   
    //because walks don't have markers, we'll count to see where in the marker index our current stop is
    markerIndex = 0
    for (let i = 0; i <currentStopIndex; i++){
        if (currentTour.stops_data[i].type == "point") {
            markerIndex++;
        }
    }
    console.log("current stop index: " + currentStopIndex + " marker index: " + markerIndex);
    // Update map to focus on current stop if it's not a walk
    if (map && currentTour.stops_data[currentStopIndex].type == "point" &&stopMarkers[markerIndex]) {
        const currentStop = currentTour.stops_data[currentStopIndex];
        const lat = currentStop.latitude;
        const long = currentStop.longitude;
        
        // Open current stop popup and center map
        stopMarkers[markerIndex].openPopup();
        stopMarkers[markerIndex].setIcon(currentIcon);
        map.setView([lat, long], 17);
    }
    //otherwise set the marker focus for the next stop
    if (map && currentTour.stops_data[currentStopIndex].type == "walk" &&stopMarkers[markerIndex+1]) {
        const nextStop = currentTour.stops_data[currentStopIndex + 1];
        const lat = nextStop.latitude;
        const long = nextStop.longitude;

        stopMarkers[markerIndex].setIcon(walkingIcon);

        map.setView([lat, long], 17);
    }

}

// Load images for the current stop
function loadStopImages(images) {
    const imagesContainer = document.getElementById('images-container');
    
    if (!images || images.length === 0) {
        imagesContainer.style.display = 'none';
        return;
    }
    
    imagesContainer.style.display = 'block';
    imagesContainer.innerHTML = '';
    
    images.forEach(imageSrc => {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = 'Tour location image';
        img.className = 'tour-image';
        img.onerror = function() {
            this.style.display = 'none';
        };
        imagesContainer.appendChild(img);
    });
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.disabled = currentStopIndex === 0;
    
    if (currentStopIndex === currentTour.stops_data.length - 1) {
        nextBtn.textContent = 'Finish Tour';
    } else {
        nextBtn.textContent = 'Next →';
    }
}

// Update progress bar
function updateProgress() {
    const progress = document.getElementById('progress');
    const percentage = ((currentStopIndex + 1) / currentTour.stops_data.length) * 100;
    progress.style.width = `${percentage}%`;
}

// Navigate to previous stop
function previousStop() {
    if (currentStopIndex > 0) {
        currentStopIndex--;
        loadCurrentStop();
    }
}

// Navigate to next stop
function nextStop() {
    if (currentStopIndex < currentTour.stops_data.length - 1) {
        currentStopIndex++;
        loadCurrentStop();
    } else {
        // Finish tour
        finishTour();
    }
}

// Finish the tour
function finishTour() {
    alert('Congratulations! You have completed the tour. Thank you for exploring with us!');
    goBack();
}

// Go back to tour selection
function goBack() {
    // Stop location tracking
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
    
    // Clear stored tour data
    localStorage.removeItem('currentTourId');
    
    // Navigate back
    window.location.href = 'index.html';
}

function calculateDistance(lat1, long1, lat2, long2) {
    //here's a fun approxmation
    // 1 degree latitude ~ 111,320 meters
    // 1 degree longitude ~ 111,320 * cos(latitude) meters
    const latDist = (lat2 - lat1) * 111320; // horizontal distance
    const longDist = (lon2 - long1) * 111320 * Math.cos(lat1); //vertical distance
    return Math.sqrt(latDist * latDist + longDist * longDist);
}

// Calculate bearing between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
}

// Handle page unload to make sure we stop geolocation
window.addEventListener('beforeunload', function() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
});

