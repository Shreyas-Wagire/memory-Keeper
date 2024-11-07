document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('memory-form');
    const memoriesContainer = document.getElementById('memories-container');
    const locationBtn = document.getElementById('location-btn');
    const locationInput = document.getElementById('location');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const addMemoryBtn = document.getElementById('add-memory-btn');
    const viewMapBtn = document.getElementById('view-map-btn');
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    const mapContainer = document.getElementById('map-container');

    let memories = JSON.parse(localStorage.getItem('memories')) || [];
    let map;

    // Display existing memories
    displayMemories();

    // Event listeners
    form.addEventListener('submit', addMemory);
    locationBtn.addEventListener('click', getLocation);
    searchInput.addEventListener('input', filterMemories);
    categoryFilter.addEventListener('change', filterMemories);
    addMemoryBtn.addEventListener('click', () => modal.style.display = 'block');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    viewMapBtn.addEventListener('click', toggleMapView);

    function addMemory(e) {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const message = document.getElementById('message').value;
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        const imageFile = document.getElementById('image').files[0];
        const location = locationInput.value;

        if (title && message && date && category && imageFile && location) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const memory = {
                    id: Date.now(),
                    title,
                    message,
                    date,
                    category,
                    image: event.target.result,
                    location
                };

                memories.push(memory);
                localStorage.setItem('memories', JSON.stringify(memories));
                displayMemories();
                form.reset();
                locationInput.value = '';
                modal.style.display = 'none';
            };
            reader.readAsDataURL(imageFile);
        }
    }

    function displayMemories(filteredMemories = memories) {
        memoriesContainer.innerHTML = '';
        filteredMemories.forEach(memory => {
            const memoryCard = document.createElement('div');
            memoryCard.classList.add('memory-card');
            memoryCard.innerHTML = `
                <img src="${memory.image}" alt="${memory.title}">
                <div class="memory-card-content">
                    <h2>${memory.title}</h2>
                    <span class="category-tag">${memory.category}</span>
                    <p>${memory.message}</p>
                    <p>Date: ${memory.date}</p>
                    <p>Location: ${memory.location}</p>
                    <button class="delete-btn" data-id="${memory.id}">Delete</button>
                </div>
            `;
            memoriesContainer.appendChild(memoryCard);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteMemory);
        });
    }

    function deleteMemory(e) {
        const id = parseInt(e.target.getAttribute('data-id'));
        memories = memories.filter(memory => memory.id !== id);
        localStorage.setItem('memories', JSON.stringify(memories));
        displayMemories();
    }

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            locationInput.value = "Geolocation is not supported by this browser.";
        }
    }

    function showPosition(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        locationInput.value = `${latitude}, ${longitude}`;
    }

    function showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                locationInput.value = "User denied the request for Geolocation."
                break;
            case error.POSITION_UNAVAILABLE:
                locationInput.value = "Location information is unavailable."
                break;
            case error.TIMEOUT:
                locationInput.value = "The request to get user location timed out."
                break;
            case error.UNKNOWN_ERROR:
                locationInput.value = "An unknown error occurred."
                break;
        }
    }

    function filterMemories() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        const filteredMemories = memories.filter(memory => {
            const titleMatch = memory.title.toLowerCase().includes(searchTerm);
            const messageMatch = memory.message.toLowerCase().includes(searchTerm);
            const categoryMatch = selectedCategory === '' || memory.category === selectedCategory;
            return (titleMatch || messageMatch) && categoryMatch;
        });

        displayMemories(filteredMemories);
    }

    function toggleMapView() {
        if (mapContainer.style.display === 'none') {
            mapContainer.style.display = 'block';
            memoriesContainer.style.display = 'none';
            viewMapBtn.textContent = 'View List';
            initMap();
        } else {
            mapContainer.style.display = 'none';
            memoriesContainer.style.display = 'grid';
            viewMapBtn.textContent = 'View Map';
        }
    }

    function initMap() {
        if (!map) {
            map = L.map('map-container').setView([0, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        }

        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        memories.forEach(memory => {
            const [lat, lng] = memory.location.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
                L.marker([lat, lng]).addTo(map)
                    .bindPopup(`<b>${memory.title}</b><br>${memory.date}<br>${memory.category}`);
            }
        });
    }
});