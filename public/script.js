// Wait for the page to load, then load our tours
document.addEventListener('DOMContentLoaded', function() {
    loadTours();
});

// Load and display all available tours
async function loadTours() {
    const toursList = document.getElementById('tours-list');
    
    try {
        // Load all tour information from individual tour files
        // Here async and await are used so we can wait for content to load (audio files and the like)
        const tours = await preloadAllTours(); // From tour-registry.js
        
        toursList.innerHTML = '';
        
        for (let i = 0; i < tours.length; i++) {
            const tourCard = createTourCard(tours[i]);
            toursList.appendChild(tourCard);
        }

    } catch (error) {
        console.error('Error loading tours:', error);
        toursList.innerHTML = '<p>Error loading tours. Please try again later.</p>';
    }
}

// Create a tour card element
function createTourCard(tour) {

    const card = document.createElement('div');
    card.className = 'tour-card';
    card.onclick = () => startTour(tour.id); //Make the whole card a button to transfer to the tour page
    
    card.innerHTML = `
        <h3>${tour.title}</h3>
        <p>${tour.description}</p>
        <div class="tour-info">
            <span>${tour.stops} stops</span>
            <span class="tour-duration">${tour.duration}</span>
        </div>
    `;
    
    return card;
}


function startTour(tourId) {
    // Store the tour ID in localStorage so the tour page can access it
    localStorage.setItem('currentTourId', tourId);
    window.location.href = 'tour.html';
}

// This doesn't really do much error handling - if it broke once it probably will be broken again
window.addEventListener('error', function(e) {
    console.error('An error occurred:', e.error);
    alert('Sorry, something went wrong. Please refresh the page and try again.');
});
