/* ========================================
   GlobeMate — Main Application Logic
   ======================================== */

// ============ UTILITIES ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showToast(message, type = 'success') {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle' };
  toast.innerHTML = `<i class="fas fa-${icons[type] || icons.success}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function saveToLocal(key, data) {
  localStorage.setItem(`globemate_${key}`, JSON.stringify(data));
}

function loadFromLocal(key) {
  const data = localStorage.getItem(`globemate_${key}`);
  return data ? JSON.parse(data) : null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// ============ NAVBAR ============
(function initNavbar() {
  const navbar = $('#navbar');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });

  // Close mobile menu on link click
  $$('.nav-links a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('show'));
  });

  // Active section highlight
  const sections = $$('section[id]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$('.nav-links a').forEach(a => a.classList.remove('active'));
        const active = $(`.nav-links a[data-section="${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => observer.observe(s));
})();

// ============ TRIP PLANNER ============
const TripPlanner = (() => {
  let trips = loadFromLocal('trips') || [];
  let currentTripId = null;
  let activities = [];

  function init() {
    $('#tripForm').addEventListener('submit', saveTrip);
    $('#addActivityBtn').addEventListener('click', addActivity);
    renderTrips();
  }

  function saveTrip(e) {
    e.preventDefault();
    const trip = {
      id: currentTripId || Date.now(),
      name: $('#tripName').value,
      destination: $('#tripDest').value,
      budget: parseInt($('#tripBudget').value) || 0,
      startDate: $('#tripStart').value,
      endDate: $('#tripEnd').value,
      notes: $('#tripNotes').value,
      activities: activities
    };

    if (currentTripId) {
      const idx = trips.findIndex(t => t.id === currentTripId);
      if (idx > -1) trips[idx] = trip;
      currentTripId = null;
    } else {
      trips.push(trip);
    }

    saveToLocal('trips', trips);
    $('#tripForm').reset();
    activities = [];
    renderTrips();
    showItineraryBuilder(trip);
    showToast('Trip saved successfully!');
  }

  function addActivity() {
    const text = $('#activityInput').value.trim();
    const time = $('#activityTime').value || '09:00';
    if (!text) return;

    activities.push({ text, time, id: Date.now() });
    activities.sort((a, b) => a.time.localeCompare(b.time));
    renderActivities();
    $('#activityInput').value = '';

    // Update current trip
    if (currentTripId) {
      const trip = trips.find(t => t.id === currentTripId);
      if (trip) {
        trip.activities = activities;
        saveToLocal('trips', trips);
      }
    }
  }

  function renderActivities() {
    const list = $('#activityList');
    list.innerHTML = activities.map(a => `
      <li class="activity-item">
        <span class="activity-time">${a.time}</span>
        <span class="activity-text">${a.text}</span>
        <button class="activity-remove" onclick="TripPlanner.removeActivity(${a.id})">
          <i class="fas fa-times"></i>
        </button>
      </li>
    `).join('');
  }

  function removeActivity(id) {
    activities = activities.filter(a => a.id !== id);
    renderActivities();
    if (currentTripId) {
      const trip = trips.find(t => t.id === currentTripId);
      if (trip) {
        trip.activities = activities;
        saveToLocal('trips', trips);
      }
    }
  }

  function showItineraryBuilder(trip) {
    $('#itineraryEmpty').classList.add('hidden');
    $('#itineraryBuilder').classList.remove('hidden');
    currentTripId = trip.id;
    activities = trip.activities || [];
    renderActivities();
  }

  function renderTrips() {
    const container = $('#savedTrips');
    if (trips.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-plane-departure"></i><p>No trips yet. Create your first adventure!</p></div>`;
      return;
    }

    container.innerHTML = trips.map(trip => `
      <div class="trip-item">
        <div class="trip-item-header">
          <div>
            <h4>${trip.name}</h4>
            <div class="trip-item-dest"><i class="fas fa-map-pin"></i> ${trip.destination}</div>
            <div class="trip-item-dates"><i class="fas fa-calendar"></i> ${formatDate(trip.startDate)} — ${formatDate(trip.endDate)}</div>
          </div>
          <div>
            ${trip.budget ? `<span class="trip-item-budget"><i class="fas fa-wallet"></i> $${formatNumber(trip.budget)}</span>` : ''}
          </div>
        </div>
        <div class="trip-actions">
          <button class="btn-edit" onclick="TripPlanner.editTrip(${trip.id})" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="btn-edit" onclick="TripPlanner.viewItinerary(${trip.id})" title="Itinerary"><i class="fas fa-list"></i></button>
          <button class="btn-delete" onclick="TripPlanner.deleteTrip(${trip.id})" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  }

  function editTrip(id) {
    const trip = trips.find(t => t.id === id);
    if (!trip) return;
    currentTripId = id;
    $('#tripName').value = trip.name;
    $('#tripDest').value = trip.destination;
    $('#tripBudget').value = trip.budget;
    $('#tripStart').value = trip.startDate;
    $('#tripEnd').value = trip.endDate;
    $('#tripNotes').value = trip.notes || '';
    showItineraryBuilder(trip);
    document.getElementById('trip-planner').scrollIntoView({ behavior: 'smooth' });
  }

  function viewItinerary(id) {
    const trip = trips.find(t => t.id === id);
    if (trip) showItineraryBuilder(trip);
  }

  function deleteTrip(id) {
    trips = trips.filter(t => t.id !== id);
    saveToLocal('trips', trips);
    renderTrips();
    if (currentTripId === id) {
      currentTripId = null;
      activities = [];
      $('#itineraryEmpty').classList.remove('hidden');
      $('#itineraryBuilder').classList.add('hidden');
    }
    showToast('Trip deleted', 'warning');
  }

  return { init, removeActivity, editTrip, viewItinerary, deleteTrip };
})();

// Make accessible globally for onclick handlers
window.TripPlanner = TripPlanner;

// ============ COUNTRY INFO & VISA ============
const CountryExplorer = (() => {
  let allCountries = [];
  let selectedCountry = null;

  async function init() {
    try {
      const res = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,capital,region,subregion,population,languages,currencies,timezones,idd,car,cca2');
      allCountries = await res.json();
      allCountries.sort((a, b) => a.name.common.localeCompare(b.name.common));
      populatePassportDropdown();
    } catch (err) {
      console.error('Failed to load countries:', err);
    }

    $('#countrySearch').addEventListener('input', handleSearch);
    $('#countrySearch').addEventListener('focus', handleSearch);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar')) {
        $('#countrySuggestions').classList.add('hidden');
      }
    });
    $('#checkVisaBtn').addEventListener('click', checkVisa);
  }

  function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const dropdown = $('#countrySuggestions');
    if (query.length < 1) { dropdown.classList.add('hidden'); return; }

    const matches = allCountries.filter(c =>
      c.name.common.toLowerCase().includes(query)
    ).slice(0, 8);

    if (matches.length === 0) { dropdown.classList.add('hidden'); return; }

    dropdown.innerHTML = matches.map(c => `
      <div class="suggestion-item" data-country="${c.name.common}">
        <img src="${c.flags.svg}" alt="${c.name.common}">
        <span>${c.name.common}</span>
      </div>
    `).join('');

    dropdown.classList.remove('hidden');
    dropdown.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        selectCountry(item.dataset.country);
        dropdown.classList.add('hidden');
        $('#countrySearch').value = item.dataset.country;
      });
    });
  }

  function selectCountry(name) {
    selectedCountry = allCountries.find(c => c.name.common === name);
    if (!selectedCountry) return;
    const c = selectedCountry;

    $('#countryFlag').src = c.flags.svg;
    $('#countryName').textContent = c.name.common;
    $('#countryOfficialName').textContent = c.name.official;
    $('#countryCapital').textContent = c.capital ? c.capital.join(', ') : 'N/A';
    $('#countryRegion').textContent = `${c.region}${c.subregion ? ' / ' + c.subregion : ''}`;
    $('#countryPopulation').textContent = formatNumber(c.population);
    $('#countryLanguages').textContent = c.languages ? Object.values(c.languages).join(', ') : 'N/A';
    $('#countryCurrency').textContent = c.currencies ? Object.entries(c.currencies).map(([k, v]) => `${v.name} (${v.symbol || k})`).join(', ') : 'N/A';
    $('#countryTimezone').textContent = c.timezones ? c.timezones.slice(0, 3).join(', ') : 'N/A';
    $('#countryCallingCode').textContent = c.idd ? `${c.idd.root}${c.idd.suffixes ? c.idd.suffixes[0] : ''}` : 'N/A';
    $('#countryDriving').textContent = c.car ? c.car.side.charAt(0).toUpperCase() + c.car.side.slice(1) : 'N/A';

    $('#countryResult').classList.remove('hidden');
  }

  function populatePassportDropdown() {
    const select = $('#passportCountry');
    allCountries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name.common;
      opt.textContent = c.name.common;
      select.appendChild(opt);
    });
  }

  function checkVisa() {
    const passport = $('#passportCountry').value;
    if (!passport || !selectedCountry) {
      showToast('Please select both a destination and passport country', 'warning');
      return;
    }

    const result = $('#visaResult');
    result.classList.remove('hidden', 'visa-free', 'visa-required', 'visa-on-arrival');

    // Simulated visa data based on common patterns
    const dest = selectedCountry.name.common;
    if (passport === dest) {
      result.className = 'visa-result visa-free';
      result.innerHTML = `<i class="fas fa-check-circle"></i> <strong>No visa required</strong> — You are a citizen of ${dest}.`;
    } else {
      // Simulate: visa-free regions, on-arrival, or required
      const freeRegions = {
        'European Union': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Portugal', 'Greece', 'Sweden', 'Denmark', 'Finland', 'Ireland', 'Poland', 'Czech Republic', 'Romania', 'Bulgaria', 'Croatia', 'Hungary', 'Slovakia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Cyprus'],
        'ASEAN': ['Thailand', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines', 'Vietnam', 'Myanmar', 'Cambodia', 'Laos', 'Brunei']
      };

      let visaType = 'required';
      for (const [, countries] of Object.entries(freeRegions)) {
        if (countries.includes(passport) && countries.includes(dest)) {
          visaType = 'free';
          break;
        }
      }

      // Common visa-on-arrival destinations
      const voaCountries = ['Thailand', 'Indonesia', 'Maldives', 'Turkey', 'Jordan', 'Kenya', 'Tanzania', 'Nepal', 'Cambodia', 'Laos', 'Madagascar'];
      if (visaType === 'required' && voaCountries.includes(dest)) {
        visaType = 'on-arrival';
      }

      // Strong passports get more free access
      const strongPassports = ['United States', 'United Kingdom', 'Germany', 'Japan', 'South Korea', 'Singapore', 'Finland', 'Spain', 'Italy', 'France', 'Sweden', 'Denmark', 'Netherlands', 'Canada', 'Australia', 'New Zealand'];
      const openCountries = ['Mexico', 'Brazil', 'Argentina', 'Colombia', 'South Africa', 'Morocco', 'Tunisia', 'Peru', 'Chile', 'Costa Rica', 'Panama', 'Ecuador', 'Uruguay', 'Paraguay', 'Israel', 'Georgia', 'Armenia', 'Albania', 'Montenegro', 'Serbia', 'North Macedonia', 'Bosnia and Herzegovina'];
      if (strongPassports.includes(passport) && (openCountries.includes(dest) || voaCountries.includes(dest))) {
        visaType = 'free';
      }

      if (visaType === 'free') {
        result.className = 'visa-result visa-free';
        result.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Visa-free travel</strong> — ${passport} passport holders can typically enter ${dest} without a visa for short stays (up to 90 days). Always verify with the destination embassy.`;
      } else if (visaType === 'on-arrival') {
        result.className = 'visa-result visa-on-arrival';
        result.innerHTML = `<i class="fas fa-info-circle"></i> <strong>Visa on arrival available</strong> — ${passport} passport holders may obtain a visa upon arrival in ${dest}. Check requirements and fees before traveling.`;
      } else {
        result.className = 'visa-result visa-required';
        result.innerHTML = `<i class="fas fa-exclamation-circle"></i> <strong>Visa required</strong> — ${passport} passport holders typically need to apply for a visa before traveling to ${dest}. Contact the ${dest} embassy for details.`;
      }
    }
  }

  return { init };
})();

// ============ SAFETY INDEX ============
const SafetyCenter = (() => {
  // Safety scores (simplified)
  const safetyData = {
    'Japan': { score: 92, ambulance: '119', fire: '119', police: '110' },
    'Iceland': { score: 95, ambulance: '112', fire: '112', police: '112' },
    'Singapore': { score: 94, ambulance: '995', fire: '995', police: '999' },
    'Switzerland': { score: 93, ambulance: '144', fire: '118', police: '117' },
    'Norway': { score: 91, ambulance: '113', fire: '110', police: '112' },
    'Denmark': { score: 90, ambulance: '112', fire: '112', police: '112' },
    'Finland': { score: 91, ambulance: '112', fire: '112', police: '112' },
    'Canada': { score: 87, ambulance: '911', fire: '911', police: '911' },
    'Australia': { score: 86, ambulance: '000', fire: '000', police: '000' },
    'New Zealand': { score: 88, ambulance: '111', fire: '111', police: '111' },
    'Germany': { score: 85, ambulance: '112', fire: '112', police: '110' },
    'United Kingdom': { score: 84, ambulance: '999', fire: '999', police: '999' },
    'United States': { score: 75, ambulance: '911', fire: '911', police: '911' },
    'France': { score: 82, ambulance: '15', fire: '18', police: '17' },
    'South Korea': { score: 85, ambulance: '119', fire: '119', police: '112' },
    'Spain': { score: 81, ambulance: '112', fire: '112', police: '112' },
    'Italy': { score: 78, ambulance: '118', fire: '115', police: '113' },
    'Portugal': { score: 83, ambulance: '112', fire: '112', police: '112' },
    'Thailand': { score: 65, ambulance: '1669', fire: '199', police: '191' },
    'Mexico': { score: 55, ambulance: '065', fire: '068', police: '060' },
    'Brazil': { score: 52, ambulance: '192', fire: '193', police: '190' },
    'India': { score: 50, ambulance: '102', fire: '101', police: '100' },
    'Turkey': { score: 62, ambulance: '112', fire: '110', police: '155' },
    'Egypt': { score: 48, ambulance: '123', fire: '180', police: '122' },
    'South Africa': { score: 42, ambulance: '10177', fire: '10111', police: '10111' },
    'China': { score: 70, ambulance: '120', fire: '119', police: '110' },
    'Russia': { score: 55, ambulance: '103', fire: '101', police: '102' },
    'Colombia': { score: 50, ambulance: '125', fire: '119', police: '112' },
    'Indonesia': { score: 58, ambulance: '118', fire: '113', police: '110' },
    'Philippines': { score: 54, ambulance: '911', fire: '911', police: '911' },
    'Vietnam': { score: 62, ambulance: '115', fire: '114', police: '113' },
    'Malaysia': { score: 72, ambulance: '999', fire: '994', police: '999' },
    'Argentina': { score: 56, ambulance: '107', fire: '100', police: '101' },
    'Morocco': { score: 60, ambulance: '15', fire: '15', police: '19' },
    'Kenya': { score: 45, ambulance: '999', fire: '999', police: '999' },
    'Nigeria': { score: 38, ambulance: '199', fire: '190', police: '199' },
    'Pakistan': { score: 35, ambulance: '115', fire: '16', police: '15' },
    'Nepal': { score: 55, ambulance: '102', fire: '101', police: '100' },
    'Greece': { score: 79, ambulance: '166', fire: '199', police: '100' },
    'Netherlands': { score: 88, ambulance: '112', fire: '112', police: '112' },
    'Sweden': { score: 89, ambulance: '112', fire: '112', police: '112' },
    'Austria': { score: 87, ambulance: '144', fire: '122', police: '133' },
    'Czech Republic': { score: 80, ambulance: '155', fire: '150', police: '158' },
    'Poland': { score: 78, ambulance: '999', fire: '998', police: '997' },
    'Ireland': { score: 85, ambulance: '112', fire: '112', police: '112' },
    'Israel': { score: 60, ambulance: '101', fire: '102', police: '100' },
    'United Arab Emirates': { score: 88, ambulance: '998', fire: '997', police: '999' },
    'Qatar': { score: 87, ambulance: '999', fire: '999', police: '999' },
    'Saudi Arabia': { score: 72, ambulance: '997', fire: '998', police: '999' },
    'Peru': { score: 55, ambulance: '116', fire: '116', police: '105' },
    'Chile': { score: 70, ambulance: '131', fire: '132', police: '133' },
    'Costa Rica': { score: 72, ambulance: '911', fire: '911', police: '911' },
    'Cuba': { score: 68, ambulance: '104', fire: '105', police: '106' },
    'Jamaica': { score: 50, ambulance: '110', fire: '110', police: '119' },
    'Croatia': { score: 82, ambulance: '112', fire: '112', police: '112' },
    'Hungary': { score: 78, ambulance: '104', fire: '105', police: '107' },
  };

  const safetyTips = {
    high: [
      'Research local customs and laws before your trip',
      'Keep digital copies of all important documents',
      'Register with your country\'s embassy upon arrival',
      'Share your itinerary with friends or family',
      'Keep emergency contacts saved in your phone',
      'Get travel insurance for medical emergencies'
    ],
    medium: [
      'Avoid displaying expensive jewelry or electronics',
      'Stay in well-lit, populated areas at night',
      'Use official taxis or ride-sharing services',
      'Be cautious with street food and water safety',
      'Keep copies of documents separate from originals',
      'Learn basic phrases in the local language',
      'Monitor local news for any safety advisories',
      'Avoid isolated areas, especially after dark'
    ],
    low: [
      'Avoid all non-essential travel to this destination',
      'Register with your embassy before traveling',
      'Maintain constant situational awareness',
      'Avoid public demonstrations and political gatherings',
      'Do not travel alone, especially at night',
      'Keep a low profile and avoid drawing attention',
      'Have an emergency evacuation plan ready',
      'Carry minimal cash and valuables',
      'Stay at internationally recognized hotels',
      'Share your real-time location with trusted contacts'
    ]
  };

  function init() {
    $('#safetySearchBtn').addEventListener('click', searchSafety);
    $('#safetySearch').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchSafety();
    });
  }

  function searchSafety() {
    const query = $('#safetySearch').value.trim();
    if (!query) return;

    // Find matching country
    const match = Object.keys(safetyData).find(k => k.toLowerCase() === query.toLowerCase());
    if (!match) {
      // Generate a random score for unknown countries
      displaySafety(query, {
        score: 50 + Math.floor(Math.random() * 40),
        ambulance: '112',
        fire: '112',
        police: '112'
      });
      return;
    }
    displaySafety(match, safetyData[match]);
  }

  function displaySafety(country, data) {
    $('#safetyResult').classList.remove('hidden');

    const gauge = $('#safetyGauge');
    const score = data.score;
    $('#safetyScore').textContent = score;
    gauge.className = 'gauge-circle';

    let level, levelClass, tips;
    if (score >= 80) { level = 'Very Safe'; levelClass = 'safe'; tips = safetyTips.high; }
    else if (score >= 60) { level = 'Moderately Safe'; levelClass = 'moderate'; tips = safetyTips.medium; }
    else if (score >= 40) { level = 'Exercise Caution'; levelClass = 'caution'; tips = safetyTips.medium.concat(safetyTips.low.slice(0, 3)); }
    else { level = 'High Risk'; levelClass = 'danger'; tips = safetyTips.low; }

    gauge.classList.add(levelClass);
    $('#safetyLevel').textContent = `${country} — ${level}`;
    $('#safetyLevel').style.color = levelClass === 'safe' ? 'var(--success)' :
      levelClass === 'moderate' ? 'var(--warning)' :
      levelClass === 'caution' ? '#f97316' : 'var(--danger)';

    $('#emergencyAmbulance').textContent = data.ambulance;
    $('#emergencyFire').textContent = data.fire;
    $('#emergencyPolice').textContent = data.police;

    $('#safetyTips').innerHTML = tips.map(t => `<li>${t}</li>`).join('');
  }

  return { init };
})();

// ============ SMART PACKING ============
const PackingList = (() => {
  const templates = {
    beach: {
      'Clothing': [
        { item: 'Swimsuit', qty: 2 }, { item: 'Tank tops', qty: 4 }, { item: 'Shorts', qty: 3 },
        { item: 'Light dress/shirt', qty: 2 }, { item: 'Sandals', qty: 1 }, { item: 'Flip flops', qty: 1 },
        { item: 'Sunhat', qty: 1 }, { item: 'Cover-up / sarong', qty: 1 }
      ],
      'Essentials': [
        { item: 'Sunscreen SPF 50+', qty: 1 }, { item: 'After-sun lotion', qty: 1 },
        { item: 'Sunglasses', qty: 1 }, { item: 'Beach towel', qty: 1 },
        { item: 'Reef-safe sunscreen', qty: 1 }, { item: 'Waterproof phone pouch', qty: 1 }
      ],
      'Entertainment': [
        { item: 'Snorkeling gear', qty: 1 }, { item: 'Beach reads / Kindle', qty: 1 },
        { item: 'Portable speaker', qty: 1 }, { item: 'Playing cards', qty: 1 }
      ]
    },
    city: {
      'Clothing': [
        { item: 'Comfortable walking shoes', qty: 1 }, { item: 'Casual outfits', qty: 4 },
        { item: 'Smart dinner outfit', qty: 1 }, { item: 'Light jacket', qty: 1 },
        { item: 'Jeans / pants', qty: 2 }, { item: 'Rain jacket', qty: 1 }
      ],
      'Essentials': [
        { item: 'Day backpack', qty: 1 }, { item: 'Travel umbrella', qty: 1 },
        { item: 'City map / guidebook', qty: 1 }, { item: 'Portable charger', qty: 1 },
        { item: 'Universal adapter', qty: 1 }
      ],
      'Entertainment': [
        { item: 'Camera', qty: 1 }, { item: 'Headphones', qty: 1 },
        { item: 'Notebook / journal', qty: 1 }
      ]
    },
    mountain: {
      'Clothing': [
        { item: 'Hiking boots (broken in)', qty: 1 }, { item: 'Moisture-wicking base layers', qty: 3 },
        { item: 'Hiking pants', qty: 2 }, { item: 'Fleece / insulating layer', qty: 1 },
        { item: 'Waterproof jacket', qty: 1 }, { item: 'Hiking socks (wool)', qty: 4 },
        { item: 'Warm hat', qty: 1 }, { item: 'Gloves', qty: 1 }
      ],
      'Gear': [
        { item: 'Backpack (30-50L)', qty: 1 }, { item: 'Trekking poles', qty: 1 },
        { item: 'Headlamp', qty: 1 }, { item: 'Water bottle / hydration pack', qty: 1 },
        { item: 'First aid kit', qty: 1 }, { item: 'Trail snacks', qty: 5 }
      ],
      'Essentials': [
        { item: 'Sunscreen', qty: 1 }, { item: 'Insect repellent', qty: 1 },
        { item: 'Map / GPS device', qty: 1 }, { item: 'Emergency whistle', qty: 1 }
      ]
    },
    winter: {
      'Clothing': [
        { item: 'Heavy winter coat', qty: 1 }, { item: 'Thermal underwear set', qty: 2 },
        { item: 'Wool sweaters', qty: 3 }, { item: 'Warm pants', qty: 3 },
        { item: 'Winter boots', qty: 1 }, { item: 'Thick socks', qty: 5 },
        { item: 'Scarf', qty: 1 }, { item: 'Beanie', qty: 1 },
        { item: 'Insulated gloves', qty: 1 }, { item: 'Hand/toe warmers', qty: 5 }
      ],
      'Essentials': [
        { item: 'Lip balm (with SPF)', qty: 1 }, { item: 'Moisturizer', qty: 1 },
        { item: 'Sunglasses (snow glare)', qty: 1 }, { item: 'Thermos', qty: 1 }
      ]
    },
    business: {
      'Clothing': [
        { item: 'Business suits', qty: 2 }, { item: 'Dress shirts', qty: 4 },
        { item: 'Ties / accessories', qty: 2 }, { item: 'Dress shoes', qty: 1 },
        { item: 'Casual evening outfit', qty: 1 }, { item: 'Belt', qty: 1 }
      ],
      'Business': [
        { item: 'Business cards', qty: 1 }, { item: 'Portfolio / notebook', qty: 1 },
        { item: 'Presentation materials', qty: 1 }, { item: 'Name badges', qty: 1 }
      ],
      'Essentials': [
        { item: 'Garment bag', qty: 1 }, { item: 'Wrinkle-release spray', qty: 1 },
        { item: 'Portable steamer', qty: 1 }
      ]
    },
    adventure: {
      'Clothing': [
        { item: 'Quick-dry pants', qty: 3 }, { item: 'Long-sleeve sun shirts', qty: 3 },
        { item: 'Safari hat', qty: 1 }, { item: 'Sturdy boots', qty: 1 },
        { item: 'Bandana / buff', qty: 2 }, { item: 'Lightweight rain poncho', qty: 1 }
      ],
      'Gear': [
        { item: 'Binoculars', qty: 1 }, { item: 'Multi-tool / knife', qty: 1 },
        { item: 'Dry bags', qty: 2 }, { item: 'Water purification tabs', qty: 1 },
        { item: 'Flashlight / headlamp', qty: 1 }, { item: 'Carabiners', qty: 2 }
      ],
      'Essentials': [
        { item: 'Insect repellent (DEET)', qty: 1 }, { item: 'Malaria prophylaxis', qty: 1 },
        { item: 'First aid kit', qty: 1 }, { item: 'Sunscreen SPF 50+', qty: 1 }
      ]
    }
  };

  const commonItems = {
    'Toiletries': [
      { item: 'Toothbrush & toothpaste', qty: 1 }, { item: 'Shampoo & conditioner', qty: 1 },
      { item: 'Deodorant', qty: 1 }, { item: 'Face wash', qty: 1 },
      { item: 'Razor', qty: 1 }, { item: 'Medications', qty: 1 }
    ],
    'Electronics': [
      { item: 'Phone charger', qty: 1 }, { item: 'Power bank', qty: 1 },
      { item: 'Universal adapter', qty: 1 }, { item: 'Headphones', qty: 1 }
    ],
    'Documents': [
      { item: 'Passport', qty: 1 }, { item: 'Travel insurance docs', qty: 1 },
      { item: 'Booking confirmations', qty: 1 }, { item: 'Copies of ID', qty: 1 }
    ]
  };

  let currentList = [];

  function init() {
    $('#packingForm').addEventListener('submit', generateList);
  }

  function generateList(e) {
    e.preventDefault();
    const type = $('#packDest').value;
    const duration = parseInt($('#packDuration').value);
    const travelers = parseInt($('#packTravelers').value);

    const template = templates[type];
    currentList = [];

    // Build list from template
    for (const [category, items] of Object.entries(template)) {
      currentList.push({ category, items: items.map(i => ({
        ...i,
        qty: Math.max(1, Math.ceil(i.qty * (duration > 7 ? 1.3 : 1) * travelers)),
        checked: false,
        id: Date.now() + Math.random()
      }))});
    }

    // Add common items
    for (const [category, items] of Object.entries(commonItems)) {
      currentList.push({ category, items: items.map(i => ({
        ...i,
        qty: i.qty * travelers,
        checked: false,
        id: Date.now() + Math.random()
      }))});
    }

    // Optional extras
    if ($('#packLaptop').checked) {
      currentList.push({ category: 'Work / Laptop', items: [
        { item: 'Laptop', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'Laptop charger', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'Mouse', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'USB drive', qty: 1, checked: false, id: Date.now() + Math.random() }
      ]});
    }
    if ($('#packCamera').checked) {
      currentList.push({ category: 'Photography', items: [
        { item: 'Camera body', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'Camera lenses', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'Memory cards', qty: 2, checked: false, id: Date.now() + Math.random() },
        { item: 'Tripod', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'Camera charger', qty: 1, checked: false, id: Date.now() + Math.random() }
      ]});
    }
    if ($('#packFitness').checked) {
      currentList.push({ category: 'Fitness', items: [
        { item: 'Workout clothes', qty: 2, checked: false, id: Date.now() + Math.random() },
        { item: 'Running shoes', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'Resistance bands', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'Jump rope', qty: 1, checked: false, id: Date.now() + Math.random() }
      ]});
    }
    if ($('#packKids').checked) {
      currentList.push({ category: 'Kids Essentials', items: [
        { item: 'Kids snacks', qty: 5, checked: false, id: Date.now() + Math.random() },
        { item: 'Coloring books / activities', qty: 2, checked: false, id: Date.now() + Math.random() },
        { item: 'Favorite toy', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'Baby wipes', qty: 1, checked: false, id: Date.now() + Math.random() },
        { item: 'Kids medicines', qty: 1, checked: false, id: Date.now() + Math.random() }
      ]});
    }

    renderPackingList();
    showToast('Packing list generated!');
  }

  function renderPackingList() {
    const container = $('#packingList');
    const totalItems = currentList.reduce((s, c) => s + c.items.length, 0);
    const checkedItems = currentList.reduce((s, c) => s + c.items.filter(i => i.checked).length, 0);

    $('#packProgress').textContent = `${checkedItems} / ${totalItems}`;
    $('#packProgressBar').style.width = `${totalItems > 0 ? (checkedItems / totalItems * 100) : 0}%`;

    const icons = {
      'Clothing': 'tshirt', 'Essentials': 'first-aid', 'Entertainment': 'gamepad',
      'Gear': 'tools', 'Business': 'briefcase', 'Toiletries': 'pump-soap',
      'Electronics': 'plug', 'Documents': 'passport', 'Work / Laptop': 'laptop',
      'Photography': 'camera', 'Fitness': 'dumbbell', 'Kids Essentials': 'baby'
    };

    container.innerHTML = currentList.map(cat => `
      <div class="packing-category">
        <h4><i class="fas fa-${icons[cat.category] || 'box'}"></i> ${cat.category}</h4>
        ${cat.items.map(item => `
          <div class="packing-item${item.checked ? ' checked' : ''}" data-id="${item.id}">
            <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="PackingList.toggleItem('${item.id}')">
            <label>${item.item}</label>
            <span class="quantity">×${item.qty}</span>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  function toggleItem(id) {
    for (const cat of currentList) {
      const item = cat.items.find(i => String(i.id) === String(id));
      if (item) {
        item.checked = !item.checked;
        break;
      }
    }
    renderPackingList();
  }

  return { init, toggleItem };
})();

window.PackingList = PackingList;

// ============ CURRENCY CONVERTER ============
const CurrencyConverter = (() => {
  const currencies = {
    USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
    AUD: 'Australian Dollar', CAD: 'Canadian Dollar', CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan', INR: 'Indian Rupee', MXN: 'Mexican Peso',
    BRL: 'Brazilian Real', KRW: 'South Korean Won', SGD: 'Singapore Dollar',
    HKD: 'Hong Kong Dollar', SEK: 'Swedish Krona', NOK: 'Norwegian Krone',
    DKK: 'Danish Krone', NZD: 'New Zealand Dollar', THB: 'Thai Baht',
    MYR: 'Malaysian Ringgit', IDR: 'Indonesian Rupiah', PHP: 'Philippine Peso',
    VND: 'Vietnamese Dong', TWD: 'Taiwan Dollar', ZAR: 'South African Rand',
    TRY: 'Turkish Lira', RUB: 'Russian Ruble', PLN: 'Polish Zloty',
    CZK: 'Czech Koruna', HUF: 'Hungarian Forint', ILS: 'Israeli Shekel',
    AED: 'UAE Dirham', SAR: 'Saudi Riyal', QAR: 'Qatari Riyal',
    EGP: 'Egyptian Pound', NGN: 'Nigerian Naira', KES: 'Kenyan Shilling',
    CLP: 'Chilean Peso', COP: 'Colombian Peso', PEN: 'Peruvian Sol',
    ARS: 'Argentine Peso', PKR: 'Pakistani Rupee', BDT: 'Bangladeshi Taka',
    LKR: 'Sri Lankan Rupee', NPR: 'Nepalese Rupee', MAD: 'Moroccan Dirham',
    RON: 'Romanian Leu', BGN: 'Bulgarian Lev', HRK: 'Croatian Kuna',
    ISK: 'Icelandic Krona', JOD: 'Jordanian Dinar', KWD: 'Kuwaiti Dinar',
    BHD: 'Bahraini Dinar', OMR: 'Omani Rial'
  };

  // Rates relative to USD (approximate)
  const baseRates = {
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, AUD: 1.53, CAD: 1.36,
    CHF: 0.88, CNY: 7.24, INR: 83.1, MXN: 17.15, BRL: 4.97, KRW: 1325,
    SGD: 1.34, HKD: 7.82, SEK: 10.42, NOK: 10.55, DKK: 6.87, NZD: 1.63,
    THB: 35.2, MYR: 4.72, IDR: 15650, PHP: 55.8, VND: 24500, TWD: 31.5,
    ZAR: 18.9, TRY: 30.1, RUB: 92.5, PLN: 4.02, CZK: 22.8, HUF: 356,
    ILS: 3.67, AED: 3.67, SAR: 3.75, QAR: 3.64, EGP: 30.9, NGN: 1550,
    KES: 153, CLP: 895, COP: 3950, PEN: 3.72, ARS: 870, PKR: 282,
    BDT: 110, LKR: 325, NPR: 133, MAD: 10.1, RON: 4.58, BGN: 1.8,
    HRK: 6.93, ISK: 138, JOD: 0.71, KWD: 0.31, BHD: 0.376, OMR: 0.385
  };

  function init() {
    const fromSelect = $('#currencyFrom');
    const toSelect = $('#currencyTo');

    Object.entries(currencies).forEach(([code, name]) => {
      fromSelect.add(new Option(`${code} — ${name}`, code));
      toSelect.add(new Option(`${code} — ${name}`, code));
    });

    fromSelect.value = 'USD';
    toSelect.value = 'EUR';

    $('#amountFrom').addEventListener('input', convert);
    fromSelect.addEventListener('change', convert);
    toSelect.addEventListener('change', convert);

    $('#swapCurrency').addEventListener('click', () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      convert();
    });

    // Popular currency chips
    const popular = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
    const chipsContainer = $('#currencyChips');
    popular.forEach(code => {
      const chip = document.createElement('span');
      chip.className = 'currency-chip';
      chip.textContent = `USD → ${code}`;
      chip.addEventListener('click', () => {
        fromSelect.value = 'USD';
        toSelect.value = code;
        convert();
      });
      chipsContainer.appendChild(chip);
    });

    convert();
  }

  function convert() {
    const from = $('#currencyFrom').value;
    const to = $('#currencyTo').value;
    const amount = parseFloat($('#amountFrom').value) || 0;

    const fromRate = baseRates[from] || 1;
    const toRate = baseRates[to] || 1;
    const rate = toRate / fromRate;
    const result = amount * rate;

    $('#amountTo').value = result.toFixed(result > 100 ? 0 : result > 1 ? 2 : 4);
    $('#exchangeRate').textContent = `1 ${from} = ${rate.toFixed(rate > 100 ? 2 : 4)} ${to}`;
    $('#exchangeDate').textContent = `Approximate rate • ${new Date().toLocaleDateString()}`;
  }

  return { init };
})();

// ============ DOCUMENT STORAGE ============
const DocumentStore = (() => {
  let documents = loadFromLocal('documents') || [];
  let reminders = loadFromLocal('reminders') || [];

  function init() {
    $('#docForm').addEventListener('submit', saveDocument);
    $('#reminderForm').addEventListener('submit', saveReminder);
    $('#docFile').addEventListener('change', handleFileSelect);
    renderDocuments();
    renderReminders();
    checkReminders();
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    $('#fileName').textContent = file ? file.name : '';
  }

  function saveDocument(e) {
    e.preventDefault();
    const doc = {
      id: Date.now(),
      name: $('#docName').value,
      type: $('#docType').value,
      expiry: $('#docExpiry').value,
      notes: $('#docNotes').value,
      fileName: $('#docFile').files[0]?.name || '',
      createdAt: new Date().toISOString()
    };

    documents.push(doc);
    saveToLocal('documents', documents);
    $('#docForm').reset();
    $('#fileName').textContent = '';
    renderDocuments();
    showToast('Document saved securely!');
  }

  function deleteDocument(id) {
    documents = documents.filter(d => d.id !== id);
    saveToLocal('documents', documents);
    renderDocuments();
    showToast('Document removed', 'warning');
  }

  function renderDocuments() {
    const container = $('#documentsList');
    if (documents.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-folder-plus"></i><p>No documents stored yet</p></div>`;
      return;
    }

    const icons = { passport: 'passport', visa: 'stamp', ticket: 'ticket-alt', hotel: 'hotel', insurance: 'file-shield', id: 'id-card', other: 'file-alt' };

    container.innerHTML = documents.map(doc => `
      <div class="doc-item">
        <div class="doc-icon ${doc.type}">
          <i class="fas fa-${icons[doc.type] || 'file'}"></i>
        </div>
        <div class="doc-info">
          <h4>${doc.name}</h4>
          <p>${doc.expiry ? `Expires: ${formatDate(doc.expiry)}` : doc.notes || doc.type}</p>
          ${doc.fileName ? `<p><i class="fas fa-paperclip"></i> ${doc.fileName}</p>` : ''}
        </div>
        <button class="btn-delete" onclick="DocumentStore.deleteDocument(${doc.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  function saveReminder(e) {
    e.preventDefault();
    const reminder = {
      id: Date.now(),
      title: $('#reminderTitle').value,
      date: $('#reminderDate').value,
      priority: $('#reminderPriority').value,
      completed: false
    };

    reminders.push(reminder);
    saveToLocal('reminders', reminders);
    $('#reminderForm').reset();
    renderReminders();
    showToast('Reminder set!');
  }

  function deleteReminder(id) {
    reminders = reminders.filter(r => r.id !== id);
    saveToLocal('reminders', reminders);
    renderReminders();
  }

  function renderReminders() {
    const container = $('#remindersList');
    if (reminders.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No reminders set yet</p></div>`;
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const sorted = [...reminders].sort((a, b) => new Date(a.date) - new Date(b.date));

    container.innerHTML = sorted.map(r => {
      const isOverdue = r.date < today;
      const isToday = r.date === today;
      const badge = isToday ? 'today' : isOverdue ? 'overdue' : 'upcoming';
      const badgeText = isToday ? 'Today' : isOverdue ? 'Overdue' : 'Upcoming';

      return `
        <div class="reminder-item">
          <div class="reminder-priority ${r.priority}"></div>
          <div class="reminder-info">
            <h4>${r.title}</h4>
            <p><i class="fas fa-calendar"></i> ${formatDate(r.date)}</p>
          </div>
          <span class="reminder-badge ${badge}">${badgeText}</span>
          <button class="btn-delete" onclick="DocumentStore.deleteReminder(${r.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  function checkReminders() {
    const today = new Date().toISOString().split('T')[0];
    const todayReminders = reminders.filter(r => r.date === today);
    const overdueReminders = reminders.filter(r => r.date < today);

    if (todayReminders.length > 0) {
      setTimeout(() => showToast(`You have ${todayReminders.length} reminder(s) for today!`, 'warning'), 1500);
    }
    if (overdueReminders.length > 0) {
      setTimeout(() => showToast(`You have ${overdueReminders.length} overdue reminder(s)!`, 'error'), 3000);
    }
  }

  return { init, deleteDocument, deleteReminder };
})();

window.DocumentStore = DocumentStore;

// ============ MAP EXPLORER ============
const MapExplorer = (() => {
  let map = null;
  let markers = [];
  let savedPlaces = loadFromLocal('savedPlaces') || [];

  function init() {
    // Initialize Leaflet map
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Map click to add marker
    map.on('click', (e) => {
      addMarker(e.latlng.lat, e.latlng.lng, 'Dropped Pin');
    });

    // Search
    $('#mapSearchBtn').addEventListener('click', searchLocation);
    $('#mapSearch').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchLocation();
    });

    // Buttons
    $('#locateMeBtn').addEventListener('click', locateMe);
    $('#clearMarkersBtn').addEventListener('click', clearMarkers);

    renderSavedPlaces();
  }

  function addMarker(lat, lng, name) {
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`
      <div style="min-width:150px;">
        <strong>${name}</strong><br>
        <small>${lat.toFixed(4)}, ${lng.toFixed(4)}</small><br>
        <button onclick="MapExplorer.savePlace(${lat}, ${lng}, '${name.replace(/'/g, "\\'")}')"
          style="margin-top:6px;padding:4px 10px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
          <i class="fas fa-star"></i> Save
        </button>
      </div>
    `).openPopup();
    markers.push(marker);
  }

  async function searchLocation() {
    const query = $('#mapSearch').value.trim();
    if (!query) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const results = await res.json();

      const resultsContainer = $('#mapSearchResults');
      if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="text-muted text-sm" style="padding:8px;">No results found</p>';
        return;
      }

      resultsContainer.innerHTML = results.map(r => `
        <div class="map-result-item" onclick="MapExplorer.goToLocation(${r.lat}, ${r.lon}, '${r.display_name.split(',')[0].replace(/'/g, "\\'")}')">
          <i class="fas fa-map-marker-alt"></i>
          <span>${r.display_name.length > 60 ? r.display_name.substring(0, 60) + '...' : r.display_name}</span>
        </div>
      `).join('');
    } catch (err) {
      showToast('Search failed. Please try again.', 'error');
    }
  }

  function goToLocation(lat, lng, name) {
    map.setView([lat, lng], 12);
    addMarker(lat, lng, name);
    $('#mapSearchResults').innerHTML = '';
  }

  function locateMe() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 13);
        addMarker(latitude, longitude, 'My Location');
        showToast('Location found!');
      },
      () => showToast('Unable to retrieve your location', 'error')
    );
  }

  function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    showToast('All markers cleared');
  }

  function savePlace(lat, lng, name) {
    if (savedPlaces.find(p => p.lat === lat && p.lng === lng)) {
      showToast('Place already saved', 'warning');
      return;
    }
    savedPlaces.push({ lat, lng, name, id: Date.now() });
    saveToLocal('savedPlaces', savedPlaces);
    renderSavedPlaces();
    showToast('Place saved!');
  }

  function renderSavedPlaces() {
    const container = $('#savedPlaces');
    if (savedPlaces.length === 0) {
      container.innerHTML = '<p class="text-muted text-sm">Click on the map to save places</p>';
      return;
    }

    container.innerHTML = savedPlaces.map(p => `
      <div class="saved-place-item" onclick="MapExplorer.goToLocation(${p.lat}, ${p.lng}, '${p.name.replace(/'/g, "\\'")}')">
        <i class="fas fa-star"></i>
        <span>${p.name}</span>
      </div>
    `).join('');
  }

  return { init, goToLocation, savePlace };
})();

window.MapExplorer = MapExplorer;

// ============ INITIALIZE APP ============
document.addEventListener('DOMContentLoaded', () => {
  TripPlanner.init();
  CountryExplorer.init();
  SafetyCenter.init();
  PackingList.init();
  CurrencyConverter.init();
  DocumentStore.init();

  // Delay map init so DOM is ready and visible
  setTimeout(() => MapExplorer.init(), 500);
});
