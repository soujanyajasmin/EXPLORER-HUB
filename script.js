// ====== GLOBAL VARIABLES ======
const weatherResultDiv = document.getElementById("weatherResult");
const inspirationGrid = document.getElementById("inspirationGrid");
const weatherInput = document.getElementById("weatherInput");

// ====== API KEYS ======
const WEATHER_API_KEY = "569b7be787319363638b3bb70a54f127"; 
const UNSPLASH_API_KEY = "EfQyndDxOcDj_txoSI9rWWST7gnD6ORmSKuv3r2Z2Ls"; 

let lastQuery = null; // Track last query

// ====== HELPER FUNCTIONS ======
function scrollToInspiration() {
  const section = document.getElementById("inspiration");
  if (section) section.scrollIntoView({ behavior: "smooth" });
}

async function getCountryName(place) {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${place}?fullText=false`);
    const data = await res.json();
    return data[0].name.common;
  } catch {
    return place;
  }
}

// ====== COUNTRY NAME RESOLVER ======
async function getCountryNameByCode(code) {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
    const data = await res.json();
    return data[0]?.name?.common || code;
  } catch {
    return code;
  }
}

// ====== WEATHER API ======
async function getWeather(cityOrCountry) {
  if (!cityOrCountry) return;
  lastQuery = cityOrCountry;
  if (weatherInput) weatherInput.value = cityOrCountry;

  try {
    // First: check if user typed a country
    let countryCheck = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(cityOrCountry)}?fullText=true`);
    if (countryCheck.ok) {
      let countryData = await countryCheck.json();
      let country = countryData[0];
      if (country?.capital?.length) {
        cityOrCountry = country.capital[0]; // use capital city for weather
      }
    }

    // Now fetch weather for the (possibly corrected) city
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityOrCountry)}&appid=${WEATHER_API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("City/Country not found");
    const data = await response.json();

    // Resolve proper country name
    const countryName = await getCountryNameByCode(data.sys.country);
    lastCountryName = countryName;

    // Display Weather
    weatherResultDiv.innerHTML = `
      <h3>${data.name}</h3>
      <p>🌡 Temperature: ${data.main.temp} °C</p>
      <p>☁ Weather: ${data.weather[0].description}</p>
      <p>🌍 Country: ${countryName}</p>
    `;

    // Add extra info
    await getCountryInfo(data.sys.country);

  } catch (error) {
    weatherResultDiv.innerHTML = `<p>${error.message}</p>`;
  }
}

// ====== COUNTRY INFO ======
async function getCountryInfo(countryCode) {
  try {
    const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    if (!response.ok) throw new Error("Country info not found");
    const data = await response.json();
    const country = data[0];

    weatherResultDiv.innerHTML += `
      <p>🏙 Capital: ${country.capital ? country.capital[0] : "N/A"}</p>
      <p>👥 Population: ${country.population.toLocaleString()}</p>
      <p>🗺 Region: ${country.region}</p>
    `;

    if (weatherInput) weatherInput.value = country.name.common;
  } catch (error) {
    console.log("Country info error:", error.message);
  }
}

// ====== CREATE INSPIRATION CARDS ======
function createInspirationCards(images, autoScroll = false) {
  inspirationGrid.innerHTML = images
    .map(
      img => `
      <div class="inspiration-card">
        <img src="${img.url}" alt="${img.alt}">
        <div class="inspiration-hover">
          <h3>${img.place}</h3>
          <p>${img.country}</p>
        </div>
      </div>
    `
    )
    .join("");

  if (autoScroll) scrollToInspiration();
}

// ====== LOAD INSPIRATION (Safe Fetch with Fallback) ======
async function loadInspiration(query) {
  if (!query) return;
  lastQuery = query;

  const specialNames = {
    Russia: "Russian Federation",
    UK: "United Kingdom",
    USA: "United States",
    UAE: "United Arab Emirates",
    Vietnam: "Viet Nam",
    Iran: "Islamic Republic of Iran",
    Turkey: "Türkiye"
  };
  const mappedQuery = specialNames[query] || query;

  const fallbackQueries = [
    mappedQuery,
    `${mappedQuery} travel`,
    `${mappedQuery} tourism`,
    `${mappedQuery} nature`,
    `${mappedQuery} city`
  ];

  try {
    for (let q of fallbackQueries) {
      let page = Math.floor(Math.random() * 10) + 1;
      let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&client_id=${UNSPLASH_API_KEY}&per_page=4&page=${page}`;
      let response = await fetch(url);
      let data = await response.json();

      // Retry with page 1 if random page empty
      if (!data.results.length) {
        url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&client_id=${UNSPLASH_API_KEY}&per_page=6&page=1`;
        response = await fetch(url);
        data = await response.json();
      }

      if (data.results && data.results.length) {
        const countryName = await getCountryName(query);
        const images = data.results.map(photo => ({
          url: photo.urls.regular,
          alt: photo.alt_description,
          place: photo.alt_description || query,
          country: countryName
        }));
        createInspirationCards(images, true);
        return;
      }
    }

    inspirationGrid.innerHTML = `<p>📷 No images found for ${query}.</p>`;
  } catch (error) {
    inspirationGrid.innerHTML = `<p>❌ Could not load images for ${query}.</p>`;
    console.error("Unsplash error:", error);
  }
}

// ====== LOAD DEFAULT INSPIRATION ======
async function loadDefaultInspiration() {
  const defaultPlaces = [
  // Europe
  { city: "Paris", country: "France" },
  { city: "London", country: "UK" },
  { city: "Rome", country: "Italy" },
  { city: "Venice", country: "Italy" },
  { city: "Barcelona", country: "Spain" },
  { city: "Madrid", country: "Spain" },
  { city: "Berlin", country: "Germany" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Athens", country: "Greece" },
  { city: "Prague", country: "Czech Republic" },
  { city: "Vienna", country: "Austria" },
  { city: "Budapest", country: "Hungary" },
  { city: "Lisbon", country: "Portugal" },
  { city: "Zurich", country: "Switzerland" },
  { city: "Dubrovnik", country: "Croatia" },

  // Asia
  { city: "Tokyo", country: "Japan" },
  { city: "Kyoto", country: "Japan" },
  { city: "Bangkok", country: "Thailand" },
  { city: "Singapore", country: "Singapore" },
  { city: "Bali", country: "Indonesia" },
  { city: "Dubai", country: "UAE" },
  { city: "Istanbul", country: "Turkey" },
  { city: "Seoul", country: "South Korea" },
  { city: "New Delhi", country: "India" },
  { city: "Goa", country: "India" },
  { city: "Beijing", country: "China" },
  { city: "Shanghai", country: "China" },

  // Americas
  { city: "New York", country: "USA" },
  { city: "Los Angeles", country: "USA" },
  { city: "San Francisco", country: "USA" },
  { city: "Rio de Janeiro", country: "Brazil" },
  { city: "São Paulo", country: "Brazil" },
  { city: "Buenos Aires", country: "Argentina" },
  { city: "Mexico City", country: "Mexico" },
  { city: "Toronto", country: "Canada" },
  { city: "Vancouver", country: "Canada" },

  // Africa
  { city: "Cape Town", country: "South Africa" },
  { city: "Marrakech", country: "Morocco" },
  { city: "Nairobi", country: "Kenya" },
  { city: "Cairo", country: "Egypt" },
  { city: "Zanzibar", country: "Tanzania" },

  // Oceania
  { city: "Sydney", country: "Australia" },
  { city: "Melbourne", country: "Australia" },
  { city: "Auckland", country: "New Zealand" },
  { city: "Queenstown", country: "New Zealand" },
  { city: "Fiji", country: "Fiji" }
];

  const selectedPlaces = defaultPlaces.sort(() => 0.5 - Math.random()).slice(0, 4);
  let allImages = [];

  for (const place of selectedPlaces) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${place.city}&client_id=${UNSPLASH_API_KEY}&per_page=1&page=1`
      );
      const data = await res.json();
      if (data.results.length) {
        allImages.push({
          url: data.results[0].urls.regular,
          alt: data.results[0].alt_description || place.city,
          place: place.city,
          country: place.country
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  createInspirationCards(allImages, false);
  document.querySelector("#inspiration .inspiration-subtitle").innerText = "Travel Inspiration";
}

// ====== RESET INSPIRATION ======
document.getElementById("resetInspiration").addEventListener("click", () => {
  if (weatherInput.value.trim()) {
    loadInspiration(weatherInput.value.trim());
    document.querySelector("#inspiration .inspiration-subtitle").innerText =
      `More places in ${weatherInput.value.trim()}`;
  } else {
    loadDefaultInspiration();
    document.querySelector("#inspiration .inspiration-subtitle").innerText =
      "Not sure where to go? Get inspired by these stunning places.";
  }
});

// ====== HAMBURGER MENU ======
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
hamburger.addEventListener("click", () => navLinks.classList.toggle("show"));

// ====== TESTIMONIAL CAROUSEL ======
const carousel = document.querySelector('.testimonial-carousel');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
let currentIndex = 0;

function showCard(index) {
  const cards = document.querySelectorAll('.testimonial-card');
  cards.forEach(card => card.classList.remove('active'));
  if(cards[index]) cards[index].classList.add('active');
  carousel.style.transform = `translateX(-${index * 100}%)`;
}

prevBtn.addEventListener('click', () => {
  const cards = document.querySelectorAll('.testimonial-card');
  currentIndex = (currentIndex === 0) ? cards.length - 1 : currentIndex - 1;
  showCard(currentIndex);
});

nextBtn.addEventListener('click', () => {
  const cards = document.querySelectorAll('.testimonial-card');
  currentIndex = (currentIndex === cards.length - 1) ? 0 : currentIndex + 1;
  showCard(currentIndex);
});

setInterval(() => nextBtn.click(), 5000);

// ====== REVIEW SUBMISSION ======
const reviewForm = document.getElementById('reviewForm');
reviewForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const reviewText = document.getElementById('reviewText').value.trim();
  const stars = document.querySelector('input[name="stars"]:checked')?.value;

  if (!name || !reviewText || !stars) return alert('Please fill all fields.');

  const newCard = document.createElement('div');
  newCard.classList.add('testimonial-card');
  newCard.innerHTML = `
    <p>"${reviewText}"</p>
    <div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
    <h4>- ${name}</h4>
  `;

  carousel.appendChild(newCard);
  const allCards = document.querySelectorAll('.testimonial-card');
  currentIndex = allCards.length - 1;
  showCard(currentIndex);

  reviewForm.reset();
  alert('Thank you for your review!');
});

// ====== CONTACT FORM ======
const contactForm = document.getElementById('contactForm');
const sendButton = contactForm.querySelector('button[type="submit"]');
const feedbackMessage = document.createElement('p');
feedbackMessage.style.color = 'white';
feedbackMessage.style.marginTop = '10px';
feedbackMessage.style.display = 'none';
contactForm.appendChild(feedbackMessage);

contactForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = contactForm.querySelector('input[type="text"]').value.trim();
  const email = contactForm.querySelector('input[type="email"]').value.trim();
  const message = contactForm.querySelector('textarea').value.trim();

  if (name && email && message) {
    sendButton.disabled = true;
    const originalText = sendButton.textContent;
    sendButton.textContent = 'Sending... 🚀';

    setTimeout(() => {
      feedbackMessage.textContent = `Thank you ${name}! Your message has been sent. ✨`;
      feedbackMessage.style.display = 'block';
      contactForm.reset();
      sendButton.disabled = false;
      sendButton.textContent = originalText;

      setTimeout(() => feedbackMessage.style.display = 'none', 5000);
    }, 1500);
  } else {
    alert('Please fill in all fields!');
  }
});

// ====== FEATURED DESTINATIONS ======
const featuredPlaces = [
  // Europe
  "Paris","London","Rome","Venice","Barcelona","Madrid","Berlin","Amsterdam",
  "Athens","Prague","Vienna","Budapest","Lisbon","Zurich","Dubrovnik","Florence",

  // Asia
  "Tokyo","Kyoto","Bangkok","Singapore","Bali","Dubai","Istanbul","Seoul",
  "New Delhi","Goa","Beijing","Shanghai","Jaipur","Phuket",

  // Americas
  "New York","Los Angeles","San Francisco","Miami","Rio de Janeiro","São Paulo",
  "Buenos Aires","Mexico City","Toronto","Vancouver","Chicago","Cusco",

  // Africa
  "Cape Town","Marrakech","Nairobi","Cairo","Zanzibar","Seychelles",

  // Oceania
  "Sydney","Melbourne","Auckland","Queenstown","Fiji","Tahiti"
];

function getRandomPlaces(num) {
  return featuredPlaces.sort(() => 0.5 - Math.random()).slice(0, num);
}

async function loadFeaturedDestinations() {
  const container = document.querySelector(".destinations-grid");
  container.innerHTML = `<p>Loading destinations...</p>`;

  const randomPlaces = getRandomPlaces(4);
  let cardsHTML = "";

  for (const place of randomPlaces) {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${place}&client_id=${UNSPLASH_API_KEY}&per_page=1`
      );
      const data = await response.json();
      const photo = data.results[0];
      const countryName = await getCountryName(place);

      cardsHTML += `
        <div class="destination-card animate-card">
          <img src="${photo ? photo.urls.regular : ''}" alt="${place}">
          <div class="destination-info">
            <h3>${place}</h3>
            <p>${countryName}</p>
            <button class="explore-btn" data-query="${place}">Explore</button>
          </div>
        </div>
      `;
    } catch (err) {
      console.error("Error loading destination:", err);
    }
  }

  container.innerHTML = cardsHTML;

  document.querySelectorAll(".explore-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const query = btn.dataset.query;
      weatherInput.value = query;

      await getWeather(query);
      await loadInspiration(query);
      await getFoodPhotos(query);
      await getTravelInfo(query);

      document.querySelector("#inspiration .inspiration-subtitle").innerText = `Explore ${query}`;
      document.getElementById("weather").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        document.getElementById("travel-info").scrollIntoView({ behavior: "smooth" });
      }, 1200);
    });
  });
}

document.getElementById("refreshDestinations").addEventListener("click", loadFeaturedDestinations);

// ====== POPULAR ACTIVITIES ======
const activityPlaces = {
  Hiking: ["Swiss Alps", "Nepal", "Rocky Mountains", "Andes", "Himalayas", "Patagonia"],
  Surfing: ["Bali", "Hawaii", "Gold Coast", "Portugal", "Sri Lanka", "Malibu"],
  Camping: ["Yosemite", "Banff", "Ladakh", "Grand Canyon", "Yellowstone", "Norway Fjords"],
  Wildlife: ["Serengeti", "Kruger", "Amazon Rainforest", "Borneo", "Galápagos", "Okavango Delta"]
};
document.querySelectorAll(".activity-card").forEach(card => {
  card.addEventListener("click", async () => {
    const activity = card.dataset.activity;
    const places = activityPlaces[activity];
    if (!places) return;

    let allCards = [];
    for (const place of places) {
      try {
        const res = await fetch(`https://api.unsplash.com/search/photos?query=${place}&client_id=${UNSPLASH_API_KEY}&per_page=1`);
        const data = await res.json();
        const photo = data.results[0];
        const countryName = await getCountryName(place);

        allCards.push({
          url: photo ? photo.urls.regular : "",
          alt: photo.alt_description,
          place,
          country: countryName
        });
      } catch (err) {
        console.error(err);
      }
    }

    createInspirationCards(allCards, true);
    document.querySelector("#inspiration .inspiration-subtitle").innerText = `Top destinations for ${activity}`;
  });
});

// ====== FOOD PHOTOS ======
async function getFoodPhotos(country) {
  const foodPhotosDiv = document.getElementById("foodPhotos");
  foodPhotosDiv.innerHTML = "<p>Loading top foods...</p>";

  try {
    const queries = [
      `${country} food`,
      `${country} cuisine`,
      `${country} traditional dish`,
      `${country} street food`,
      `${country} restaurant`,
      `${country} famous food`
    ];

    let data = { results: [] };
    for (let q of queries) {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&client_id=${UNSPLASH_API_KEY}&per_page=3`
      );
      data = await res.json();
      if (data.results.length) break;
    }

    if (!data.results.length) {
      foodPhotosDiv.innerHTML = `<p>No food images found for ${country}. 🍽️</p>`;
      return;
    }

    foodPhotosDiv.innerHTML = data.results
      .map(
        photo => `
        <div class="food-card">
          <img src="${photo.urls.small}" alt="${photo.alt_description || "Food"}">
          <div class="food-overlay">
            <p>${photo.alt_description || "Food item"}</p>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Food fetch error:", err);
    foodPhotosDiv.innerHTML = `<p>Failed to load food images.</p>`;
  }
}

// ====== TRAVEL INFO ======
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getTravelInfo(destination) {
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    const userLat = pos.coords.latitude;
    const userLon = pos.coords.longitude;

    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${destination}&format=json&limit=1`);
    const geoData = await geoRes.json();
    if (!geoData.length) {
      document.getElementById("distanceValue").innerText = "❌ Location not found";
      return;
    }
    const destLat = parseFloat(geoData[0].lat);
    const destLon = parseFloat(geoData[0].lon);

    const distance = haversineDistance(userLat, userLon, destLat, destLon);
    document.getElementById("distanceValue").innerText =
      `Approx. ${distance.toFixed(1)} km`;

    const modes = [
      { mode: "✈️ Flight", speed: 800 },
      { mode: "🚗 Car", speed: 80 },
      { mode: "🚌 Bus", speed: 70 },
      { mode: "🚆 Train", speed: 120 },
      { mode: "🚢 Ship", speed: 35 }
    ];

    document.getElementById("travelModes").innerHTML = modes.map(m => {
      const time = distance / m.speed;
      const hrs = Math.floor(time);
      const mins = Math.round((time - hrs) * 60);
      return `<li>${m.mode}: ${hrs}h ${mins}m</li>`;
    }).join("");
  } catch (err) {
    document.getElementById("distanceValue").innerText = "⚠️ Could not get distance.";
  }
}

// ====== SEARCH HANDLER ======
async function handleSearch(query) {
  if (!query) return alert("Please enter a destination!");

  await getWeather(query);
  await loadInspiration(query);
  await getFoodPhotos(query);
  await getTravelInfo(query);

  document.querySelector("#inspiration .inspiration-subtitle").innerText = `Results for ${query}`;

  document.getElementById("weather").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    document.getElementById("travel-info").scrollIntoView({ behavior: "smooth" });
  }, 1200);
}

document.querySelector(".search-box button").addEventListener("click", () => {
  const query = document.querySelector(".search-box input").value.trim();
  handleSearch(query);
});

document.getElementById("weatherBtn").addEventListener("click", () => {
  const query = weatherInput.value.trim();
  handleSearch(query);
});

// ====== INITIAL LOAD ======
document.addEventListener("DOMContentLoaded", () => {
  loadFeaturedDestinations();
  loadDefaultInspiration();
});
