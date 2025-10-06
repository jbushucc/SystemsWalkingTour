// Tour Registry - Manages loading and accessing individual tours
// This code loads tours from JSON files for easy editing

// List of available tours (add new tours here)
const AVAILABLE_TOURS = [
    {
        id: 'example-ucc',
        folder: 'example-ucc'
    },

    // Add new tours here following the same pattern:
    // {
    //     id: 'your-tour-id',
    //     folder: 'your-tour-folder'
    // }
];

let loadedTours = {};

// Function to dynamically load a tour from JSON file
async function loadTourFromJSON(tourConfig) {
    // Check if we've already loaded the same id
    if (loadedTours[tourConfig.id]) {
        return loadedTours[tourConfig.id];
    }

    try {
        //try to load from the tour folder specified
        const response = await fetch(`tours/${tourConfig.folder}/tour.json`);
        
        if (!response.ok) {
            throw new Error(`Failed to load tour ${tourConfig.id}: ${response.status}`);
        }
        
        const tourData = await response.json();
        
        // Process the tour data to add full paths for audio and images
        const stops_data = [];
        for (const stop of tourData.stops_data) { 
            //do this for every stop in our tour data

            const audio = [];
            for (const audioFile of stop.audio) {
                audio.push(`tours/${tourConfig.folder}/audio/${audioFile}`);
            }

            const images = [];
            for (const imageFile of stop.images) {
                images.push(`tours/${tourConfig.folder}/images/${imageFile}`);
            }

            stops_data.push({ //push adds element to the end of a list
                id: stop.id,
                type: stop.type,
                title: stop.title,
                description: stop.description,
                text: stop.text,
                latitude: stop.latitude,
                longitude: stop.longitude,
                audio: audio,
                images: images,
            });
        }
        const processedTour = {
            id: tourData.id,
            title: tourData.title,
            description: tourData.description,
            duration: tourData.duration,
            stops: stops_data.length,
            stops_data: stops_data
            // add any other fields from tourData you want to include
        };
        
        // Cache the tour
        loadedTours[tourConfig.id] = processedTour;
        
        return processedTour;
        
    } catch (error) {
        console.error(`Error loading tour ${tourConfig.id}:`, error);
        throw error;
    }
}

// Function to load and return complete tour data
async function getTourById(tourId) {
    const tourConfig = AVAILABLE_TOURS.find(tour => tour.id === tourId);
    
    if (!tourConfig) {
        throw new Error(`Tour not found: ${tourId}`);
    }
    
    try {
        const tourData = await loadTourFromJSON(tourConfig);
        return tourData;
    } catch (error) {
        console.error('Error loading tour:', error);
        throw error;
    }
}

// Function to preload all tour basic information (for the main page)
async function preloadAllTours() {
    const promises = AVAILABLE_TOURS.map(async (tourConfig) => {
        try {
            const tourData = await loadTourFromJSON(tourConfig);
            return {
                id: tourData.id,
                title: tourData.title,
                description: tourData.description,
                duration: tourData.duration,
                stops: tourData.stops,
            };
        } catch (error) {
            console.error(`Failed to load tour ${tourConfig.id}:`, error);
            return {
                id: tourConfig.id,
                title: 'Error Loading Tour',
                description: 'This tour could not be loaded.',
                duration: 'Unknown',
                stops: 0,
            };
        }
    });
    
    return Promise.all(promises);
}

// Function to add a new tour (for future expansion)
function addTour(tourConfig) {
    if (!AVAILABLE_TOURS.find(tour => tour.id === tourConfig.id)) {
        AVAILABLE_TOURS.push(tourConfig);
        console.log(`Added new tour: ${tourConfig.id}`);
    }
}
