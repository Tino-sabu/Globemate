// ============ TRIP PLANNER MODULE (Flight Search) ============
(function() {
  'use strict';
  
  // Major international airports database (city -> airports)
  const AIRPORTS_DB = {
    // North America
    'new york': [{ code: 'JFK', name: 'John F. Kennedy Intl', city: 'New York' }, { code: 'EWR', name: 'Newark Liberty Intl', city: 'Newark' }, { code: 'LGA', name: 'LaGuardia', city: 'New York' }],
    'los angeles': [{ code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles' }],
    'chicago': [{ code: 'ORD', name: "O'Hare Intl", city: 'Chicago' }, { code: 'MDW', name: 'Midway Intl', city: 'Chicago' }],
    'san francisco': [{ code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco' }],
    'miami': [{ code: 'MIA', name: 'Miami Intl', city: 'Miami' }],
    'dallas': [{ code: 'DFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas' }],
    'atlanta': [{ code: 'ATL', name: 'Hartsfield-Jackson Intl', city: 'Atlanta' }],
    'houston': [{ code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston' }],
    'washington': [{ code: 'IAD', name: 'Dulles Intl', city: 'Washington' }, { code: 'DCA', name: 'Reagan National', city: 'Washington' }],
    'toronto': [{ code: 'YYZ', name: 'Toronto Pearson Intl', city: 'Toronto' }],
    'vancouver': [{ code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' }],
    'mexico city': [{ code: 'MEX', name: 'Benito Juárez Intl', city: 'Mexico City' }],
    // Europe
    'london': [{ code: 'LHR', name: 'Heathrow', city: 'London' }, { code: 'LGW', name: 'Gatwick', city: 'London' }, { code: 'STN', name: 'Stansted', city: 'London' }],
    'paris': [{ code: 'CDG', name: 'Charles de Gaulle', city: 'Paris' }, { code: 'ORY', name: 'Orly', city: 'Paris' }],
    'berlin': [{ code: 'BER', name: 'Berlin Brandenburg', city: 'Berlin' }],
    'frankfurt': [{ code: 'FRA', name: 'Frankfurt Intl', city: 'Frankfurt' }],
    'amsterdam': [{ code: 'AMS', name: 'Schiphol', city: 'Amsterdam' }],
    'rome': [{ code: 'FCO', name: 'Fiumicino', city: 'Rome' }],
    'madrid': [{ code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid' }],
    'barcelona': [{ code: 'BCN', name: 'El Prat', city: 'Barcelona' }],
    'istanbul': [{ code: 'IST', name: 'Istanbul Airport', city: 'Istanbul' }],
    'moscow': [{ code: 'SVO', name: 'Sheremetyevo', city: 'Moscow' }, { code: 'DME', name: 'Domodedovo', city: 'Moscow' }],
    'zurich': [{ code: 'ZRH', name: 'Zürich Airport', city: 'Zurich' }],
    'vienna': [{ code: 'VIE', name: 'Vienna Intl', city: 'Vienna' }],
    'lisbon': [{ code: 'LIS', name: 'Lisbon Portela', city: 'Lisbon' }],
    'dublin': [{ code: 'DUB', name: 'Dublin Airport', city: 'Dublin' }],
    'copenhagen': [{ code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen' }],
    'stockholm': [{ code: 'ARN', name: 'Arlanda', city: 'Stockholm' }],
    'oslo': [{ code: 'OSL', name: 'Gardermoen', city: 'Oslo' }],
    'helsinki': [{ code: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki' }],
    'warsaw': [{ code: 'WAW', name: 'Chopin Airport', city: 'Warsaw' }],
    'athens': [{ code: 'ATH', name: 'Eleftherios Venizelos', city: 'Athens' }],
    'brussels': [{ code: 'BRU', name: 'Brussels Airport', city: 'Brussels' }],
    'munich': [{ code: 'MUC', name: 'Munich Airport', city: 'Munich' }],
    // Asia
    'tokyo': [{ code: 'NRT', name: 'Narita Intl', city: 'Tokyo' }, { code: 'HND', name: 'Haneda', city: 'Tokyo' }],
    'shanghai': [{ code: 'PVG', name: 'Pudong Intl', city: 'Shanghai' }],
    'beijing': [{ code: 'PEK', name: 'Capital Intl', city: 'Beijing' }],
    'hong kong': [{ code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong' }],
    'singapore': [{ code: 'SIN', name: 'Changi', city: 'Singapore' }],
    'bangkok': [{ code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok' }],
    'seoul': [{ code: 'ICN', name: 'Incheon Intl', city: 'Seoul' }],
    'mumbai': [{ code: 'BOM', name: 'Chhatrapati Shivaji Intl', city: 'Mumbai' }],
    'delhi': [{ code: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi' }],
    'new delhi': [{ code: 'DEL', name: 'Indira Gandhi Intl', city: 'New Delhi' }],
    'bangalore': [{ code: 'BLR', name: 'Kempegowda Intl', city: 'Bangalore' }],
    'chennai': [{ code: 'MAA', name: 'Chennai Intl', city: 'Chennai' }],
    'hyderabad': [{ code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad' }],
    'kolkata': [{ code: 'CCU', name: 'Netaji Subhas Chandra Bose Intl', city: 'Kolkata' }],
    'dubai': [{ code: 'DXB', name: 'Dubai Intl', city: 'Dubai' }],
    'abu dhabi': [{ code: 'AUH', name: 'Zayed Intl', city: 'Abu Dhabi' }],
    'doha': [{ code: 'DOH', name: 'Hamad Intl', city: 'Doha' }],
    'taipei': [{ code: 'TPE', name: 'Taiwan Taoyuan Intl', city: 'Taipei' }],
    'kuala lumpur': [{ code: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur' }],
    'jakarta': [{ code: 'CGK', name: 'Soekarno–Hatta Intl', city: 'Jakarta' }],
    // Africa
    'cairo': [{ code: 'CAI', name: 'Cairo Intl', city: 'Cairo' }],
    'johannesburg': [{ code: 'JNB', name: 'O. R. Tambo Intl', city: 'Johannesburg' }],
    'nairobi': [{ code: 'NBO', name: 'Jomo Kenyatta Intl', city: 'Nairobi' }],
    'cape town': [{ code: 'CPT', name: 'Cape Town Intl', city: 'Cape Town' }],
    'lagos': [{ code: 'LOS', name: 'Murtala Muhammed Intl', city: 'Lagos' }],
    'casablanca': [{ code: 'CMN', name: 'Mohammed V Intl', city: 'Casablanca' }],
    'addis ababa': [{ code: 'ADD', name: 'Bole Intl', city: 'Addis Ababa' }],
    // South America
    'sao paulo': [{ code: 'GRU', name: 'Guarulhos Intl', city: 'São Paulo' }],
    'rio de janeiro': [{ code: 'GIG', name: 'Galeão Intl', city: 'Rio de Janeiro' }],
    'buenos aires': [{ code: 'EZE', name: 'Ministro Pistarini Intl', city: 'Buenos Aires' }],
    'bogota': [{ code: 'BOG', name: 'El Dorado Intl', city: 'Bogotá' }],
    'lima': [{ code: 'LIM', name: 'Jorge Chávez Intl', city: 'Lima' }],
    'santiago': [{ code: 'SCL', name: 'Arturo Merino Benítez Intl', city: 'Santiago' }],
    // Oceania
    'sydney': [{ code: 'SYD', name: 'Kingsford Smith Intl', city: 'Sydney' }],
    'melbourne': [{ code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne' }],
    'auckland': [{ code: 'AKL', name: 'Auckland Airport', city: 'Auckland' }],
  };

  // Country -> major airports mapping
  const COUNTRY_AIRPORTS = {
    'United States': ['JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'SFO', 'MIA'],
    'United Kingdom': ['LHR', 'LGW', 'STN', 'MAN'],
    'France': ['CDG', 'ORY'],
    'Germany': ['FRA', 'BER', 'MUC'],
    'Japan': ['NRT', 'HND', 'KIX'],
    'China': ['PVG', 'PEK', 'CAN'],
    'India': ['DEL', 'BOM', 'BLR', 'MAA', 'HYD', 'CCU'],
    'Australia': ['SYD', 'MEL', 'BNE'],
    'Canada': ['YYZ', 'YVR', 'YUL'],
    'Brazil': ['GRU', 'GIG'],
    'Italy': ['FCO', 'MXP'],
    'Spain': ['MAD', 'BCN'],
    'Thailand': ['BKK', 'CNX'],
    'Singapore': ['SIN'],
    'South Korea': ['ICN'],
    'United Arab Emirates': ['DXB', 'AUH'],
    'Turkey': ['IST'],
    'Netherlands': ['AMS'],
    'Switzerland': ['ZRH'],
    'Mexico': ['MEX', 'CUN'],
    'Egypt': ['CAI'],
    'South Africa': ['JNB', 'CPT'],
    'Kenya': ['NBO'],
    'Nigeria': ['LOS', 'ABV'],
    'Russia': ['SVO', 'DME'],
    'Indonesia': ['CGK'],
    'Malaysia': ['KUL'],
    'New Zealand': ['AKL'],
    'Argentina': ['EZE'],
    'Colombia': ['BOG'],
    'Peru': ['LIM'],
    'Chile': ['SCL'],
    'Portugal': ['LIS'],
    'Ireland': ['DUB'],
    'Greece': ['ATH'],
    'Austria': ['VIE'],
    'Belgium': ['BRU'],
    'Sweden': ['ARN'],
    'Norway': ['OSL'],
    'Denmark': ['CPH'],
    'Finland': ['HEL'],
    'Poland': ['WAW'],
    'Qatar': ['DOH'],
    'Taiwan': ['TPE'],
    'Hong Kong': ['HKG'],
    'Morocco': ['CMN'],
    'Ethiopia': ['ADD'],
  };

  // Airlines database
  const AIRLINES = [
    { name: 'Emirates', code: 'EK', logo: 'fas fa-plane', color: '#c81432' },
    { name: 'Singapore Airlines', code: 'SQ', logo: 'fas fa-plane', color: '#1a3768' },
    { name: 'Qatar Airways', code: 'QR', logo: 'fas fa-plane', color: '#5c0632' },
    { name: 'British Airways', code: 'BA', logo: 'fas fa-plane', color: '#075aaa' },
    { name: 'Lufthansa', code: 'LH', logo: 'fas fa-plane', color: '#05164d' },
    { name: 'Air France', code: 'AF', logo: 'fas fa-plane', color: '#002157' },
    { name: 'Delta Air Lines', code: 'DL', logo: 'fas fa-plane', color: '#003366' },
    { name: 'United Airlines', code: 'UA', logo: 'fas fa-plane', color: '#002244' },
    { name: 'American Airlines', code: 'AA', logo: 'fas fa-plane', color: '#0078d2' },
    { name: 'Turkish Airlines', code: 'TK', logo: 'fas fa-plane', color: '#c80815' },
    { name: 'Etihad Airways', code: 'EY', logo: 'fas fa-plane', color: '#bd8b13' },
    { name: 'Air India', code: 'AI', logo: 'fas fa-plane', color: '#e3350d' },
    { name: 'Japan Airlines', code: 'JL', logo: 'fas fa-plane', color: '#c70a2d' },
    { name: 'ANA', code: 'NH', logo: 'fas fa-plane', color: '#003876' },
    { name: 'Cathay Pacific', code: 'CX', logo: 'fas fa-plane', color: '#006564' },
    { name: 'KLM', code: 'KL', logo: 'fas fa-plane', color: '#00a1de' },
    { name: 'Thai Airways', code: 'TG', logo: 'fas fa-plane', color: '#6b2c91' },
    { name: 'Qantas', code: 'QF', logo: 'fas fa-plane', color: '#e0001b' },
    { name: 'Swiss Intl', code: 'LX', logo: 'fas fa-plane', color: '#c81432' },
    { name: 'IndiGo', code: '6E', logo: 'fas fa-plane', color: '#3f51b5' },
  ];

  const TripPlanner = {
    trips: [],
    destination: null,
    hostCountry: null,
    countries: [],
    passengerCount: 1,
    selectedAirport: null,

    init() {
      console.log('Trip Planner (new) initializing...');
      this.loadTrips();
      this.loadDestinationFromStorage();
      this.bindEvents();
      this.renderSavedTrips();
      this.setMinDate();
    },

    setMinDate() {
      const dateInput = document.getElementById('tripDate');
      const returnDateInput = document.getElementById('tripReturnDate');
      const today = new Date().toISOString().split('T')[0];
      if (dateInput) dateInput.min = today;
      if (returnDateInput) returnDateInput.min = today;
    },

    loadDestinationFromStorage() {
      const stored = localStorage.getItem('globemate_trip_destination');
      if (stored) {
        try {
          this.destination = JSON.parse(stored);
          this.updateDestinationBanner();
        } catch (e) {
          console.error('Error parsing stored destination:', e);
        }
      }
    },

    updateDestinationBanner() {
      const banner = document.getElementById('tripDestBanner');
      const flag = document.getElementById('tripDestFlag');
      const name = document.getElementById('tripDestName');
      const details = document.getElementById('tripDestDetails');

      if (!banner) return;

      if (this.destination) {
        if (flag) flag.src = this.destination.flag || '';
        if (name) name.textContent = this.destination.name || 'Unknown';
        if (details) {
          const parts = [];
          if (this.destination.capital) parts.push(`Capital: ${this.destination.capital}`);
          if (this.destination.region) parts.push(`Region: ${this.destination.region}`);
          details.textContent = parts.join(' | ');
        }
        banner.classList.add('has-destination');
      } else {
        if (flag) flag.src = '';
        if (name) name.textContent = 'No destination selected';
        if (details) details.textContent = 'Go to Countries page to fix a destination.';
        banner.classList.remove('has-destination');
      }
    },

    bindEvents() {
      // Travel mode selector
      const modeOptions = document.querySelectorAll('.tp-mode');
      modeOptions.forEach(option => {
        option.addEventListener('click', () => {
          modeOptions.forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          const radio = option.querySelector('input[type="radio"]');
          if (radio) radio.checked = true;
        });
      });

      // Passenger counter
      const passIncrease = document.getElementById('passIncrease');
      const passDecrease = document.getElementById('passDecrease');
      if (passIncrease) {
        passIncrease.addEventListener('click', () => {
          if (this.passengerCount < 9) {
            this.passengerCount++;
            document.getElementById('passengerCount').textContent = this.passengerCount;
          }
        });
      }
      if (passDecrease) {
        passDecrease.addEventListener('click', () => {
          if (this.passengerCount > 1) {
            this.passengerCount--;
            document.getElementById('passengerCount').textContent = this.passengerCount;
          }
        });
      }

      // Host country search
      const hostInput = document.getElementById('tripHostCountry');
      if (hostInput) {
        hostInput.addEventListener('input', (e) => this.handleHostCountrySearch(e.target.value));
        document.addEventListener('click', (e) => {
          if (!hostInput.contains(e.target)) {
            const dd = document.getElementById('hostCountrySuggestions');
            if (dd) dd.classList.add('hidden');
          }
        });
      }

      // Detect location button
      const detectBtn = document.getElementById('detectLocationBtn');
      if (detectBtn) {
        detectBtn.addEventListener('click', () => this.detectLocation());
      }

      // Form submit
      const form = document.getElementById('tripDetailsForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.searchFlights();
        });
      }

      // Trip date change => update return min
      const tripDate = document.getElementById('tripDate');
      if (tripDate) {
        tripDate.addEventListener('change', () => {
          const returnDate = document.getElementById('tripReturnDate');
          if (returnDate) returnDate.min = tripDate.value;
        });
      }

      // Change destination
      const changeBtn = document.getElementById('changeDestBtn');
      if (changeBtn) {
        changeBtn.addEventListener('click', () => {
          // Navigate back to countries page
          if (typeof PageLoader !== 'undefined') {
            PageLoader.loadPage('country-info');
          }
        });
      }

      // Save trip
      const saveBtn = document.getElementById('saveTripBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.saveCurrentTrip());
      }

      // Share trip
      const shareBtn = document.getElementById('shareTripBtn');
      if (shareBtn) {
        shareBtn.addEventListener('click', () => this.shareTrip());
      }

      // Sort flights
      const sortSelect = document.getElementById('flightSortBy');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => this.sortFlights(sortSelect.value));
      }
    },

    async handleHostCountrySearch(query) {
      const dropdown = document.getElementById('hostCountrySuggestions');
      if (!dropdown) return;

      if (query.length < 2) {
        dropdown.classList.add('hidden');
        return;
      }

      // Try to use the globally loaded countries from CountryExplorer
      let countries = [];
      if (window.CountryExplorer && window.CountryExplorer.countries) {
        countries = window.CountryExplorer.countries;
      } else {
        // Fallback: fetch from API
        try {
          const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fields=name,flags,cca3`);
          if (resp.ok) countries = await resp.json();
        } catch(e) { /* ignore */ }
      }

      const matches = countries.filter(c =>
        c.name.common.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);

      if (matches.length === 0) {
        dropdown.classList.add('hidden');
        return;
      }

      dropdown.innerHTML = matches.map(c => `
        <div class="suggestion-item" data-country="${c.name.common}">
          <img src="${c.flags.svg}" alt="${c.name.common}" style="width:24px;height:16px;object-fit:cover;border-radius:2px;">
          <span>${c.name.common}</span>
        </div>
      `).join('');

      dropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const name = item.dataset.country;
          document.getElementById('tripHostCountry').value = name;
          this.hostCountry = name;
          dropdown.classList.add('hidden');
        });
      });

      dropdown.classList.remove('hidden');
    },

    detectLocation() {
      const locationInput = document.getElementById('tripCurrentLocation');
      const detectBtn = document.getElementById('detectLocationBtn');
      
      if (!navigator.geolocation) {
        if (typeof showToast === 'function') showToast('Geolocation is not supported by your browser.', 'error');
        return;
      }

      if (detectBtn) detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Reverse geocode using Nominatim
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            const data = await resp.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown';
            if (locationInput) locationInput.value = city;
            if (typeof showToast === 'function') showToast(`Location detected: ${city}`, 'success');
          } catch(e) {
            if (typeof showToast === 'function') showToast('Could not detect city name.', 'error');
          } finally {
            if (detectBtn) detectBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
          }
        },
        (error) => {
          if (typeof showToast === 'function') showToast('Location access denied. Please enter manually.', 'warning');
          if (detectBtn) detectBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
        },
        { timeout: 10000 }
      );
    },

    findNearestAirports(city) {
      const cityLower = city.toLowerCase().trim();
      
      // Direct match
      if (AIRPORTS_DB[cityLower]) {
        return AIRPORTS_DB[cityLower];
      }

      // Partial match
      for (const [key, airports] of Object.entries(AIRPORTS_DB)) {
        if (key.includes(cityLower) || cityLower.includes(key)) {
          return airports;
        }
      }

      // Country-based fallback
      if (this.hostCountry && COUNTRY_AIRPORTS[this.hostCountry]) {
        const codes = COUNTRY_AIRPORTS[this.hostCountry];
        const airports = [];
        for (const [key, list] of Object.entries(AIRPORTS_DB)) {
          for (const apt of list) {
            if (codes.includes(apt.code)) airports.push(apt);
          }
        }
        if (airports.length > 0) return airports.slice(0, 5);
      }

      // Generic fallback
      return [{ code: 'NEAREST', name: `Nearest airport to ${city}`, city: city }];
    },

    findDestinationAirports() {
      if (!this.destination) return [];
      const countryName = this.destination.name;

      if (COUNTRY_AIRPORTS[countryName]) {
        const codes = COUNTRY_AIRPORTS[countryName];
        const airports = [];
        for (const [key, list] of Object.entries(AIRPORTS_DB)) {
          for (const apt of list) {
            if (codes.includes(apt.code)) airports.push(apt);
          }
        }
        return airports;
      }

      // Try capital city
      if (this.destination.capital) {
        const capLower = this.destination.capital.toLowerCase();
        if (AIRPORTS_DB[capLower]) return AIRPORTS_DB[capLower];
      }

      return [{ code: 'DEST', name: `Airport in ${countryName}`, city: countryName }];
    },

    generateFlights(departureAirports, arrivalAirports, date, passengers) {
      const flights = [];
      const dateObj = new Date(date);
      
      // Generate realistic flights
      const numFlights = Math.floor(Math.random() * 6) + 4; // 4-9 flights
      
      for (let i = 0; i < numFlights; i++) {
        const depAirport = departureAirports[Math.floor(Math.random() * departureAirports.length)];
        const arrAirport = arrivalAirports[Math.floor(Math.random() * arrivalAirports.length)];
        const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
        
        // Random departure time
        const depHour = Math.floor(Math.random() * 20) + 2; // 2-22
        const depMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        
        // Duration based on approximate distance (2-18 hours)
        const baseDuration = Math.floor(Math.random() * 10) + 3;
        const durationHours = Math.min(baseDuration, 18);
        const durationMins = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        
        // Arrival time
        const arrHour = (depHour + durationHours + Math.floor((depMin + durationMins) / 60)) % 24;
        const arrMin = (depMin + durationMins) % 60;
        
        // Price
        const basePrice = 150 + Math.floor(Math.random() * 800);
        const totalPrice = basePrice * passengers;
        
        // Stops
        const stops = Math.random() > 0.5 ? 0 : (Math.random() > 0.5 ? 1 : 2);
        const stopTexts = ['Direct', '1 Stop', '2 Stops'];
        
        const flightNumber = `${airline.code}${100 + Math.floor(Math.random() * 900)}`;
        
        flights.push({
          id: `FL-${Date.now()}-${i}`,
          airline: airline,
          flightNumber,
          departure: {
            airport: depAirport,
            time: `${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}`,
            date: date
          },
          arrival: {
            airport: arrAirport,
            time: `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`,
            date: durationHours > 12 ? this.addDays(date, 1) : date
          },
          duration: `${durationHours}h ${durationMins}m`,
          durationMinutes: durationHours * 60 + durationMins,
          stops: stops,
          stopsText: stopTexts[stops],
          pricePerPerson: basePrice,
          totalPrice: totalPrice,
          passengers: passengers,
          class: 'Economy',
          seatsLeft: Math.floor(Math.random() * 15) + 1
        });
      }

      // Sort by price by default
      flights.sort((a, b) => a.totalPrice - b.totalPrice);
      return flights;
    },

    addDays(dateStr, days) {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    },

    async searchFlights() {
      if (!this.destination) {
        if (typeof showToast === 'function') showToast('Please fix a destination country first! Go to the Countries page.', 'warning');
        return;
      }

      const hostCountry = document.getElementById('tripHostCountry')?.value;
      const currentCity = document.getElementById('tripCurrentLocation')?.value;
      const tripDate = document.getElementById('tripDate')?.value;
      const travelMode = document.querySelector('input[name="travelMode"]:checked')?.value || 'flight';

      if (!hostCountry || !currentCity || !tripDate) {
        if (typeof showToast === 'function') showToast('Please fill in all required fields.', 'warning');
        return;
      }

      this.hostCountry = hostCountry;

      // Show loading
      const loadingEl = document.getElementById('flightResultsLoading');
      const resultsCard = document.getElementById('flightResultsCard');
      const resultsList = document.getElementById('flightResultsList');
      const emptyEl = document.getElementById('flightResultsEmpty');
      const bookingCard = document.getElementById('bookingLinksCard');
      const airportsCard = document.getElementById('nearestAirportsCard');

      if (resultsCard) resultsCard.classList.remove('hidden');
      if (loadingEl) loadingEl.classList.remove('hidden');
      if (resultsList) resultsList.innerHTML = '';
      if (emptyEl) emptyEl.classList.add('hidden');

      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (travelMode === 'flight') {
        // Find airports
        const depAirports = this.findNearestAirports(currentCity);
        const arrAirports = this.findDestinationAirports();

        // Show nearest airports
        this.displayNearestAirports(depAirports);
        if (airportsCard) airportsCard.classList.remove('hidden');

        // Generate flights
        this.currentFlights = this.generateFlights(depAirports, arrAirports, tripDate, this.passengerCount);
        
        if (loadingEl) loadingEl.classList.add('hidden');
        
        if (this.currentFlights.length > 0) {
          this.displayFlights(this.currentFlights);
          this.displayBookingLinks(currentCity, this.destination.name, tripDate);
          this.displayTripSummary(hostCountry, currentCity, tripDate);
        } else {
          if (emptyEl) emptyEl.classList.remove('hidden');
        }
      } else {
        // For non-flight modes
        if (loadingEl) loadingEl.classList.add('hidden');
        if (resultsList) {
          resultsList.innerHTML = `
            <div class="non-flight-message">
              <i class="fas fa-${travelMode === 'train' ? 'train' : travelMode === 'bus' ? 'bus' : 'ship'}"></i>
              <h3>${travelMode.charAt(0).toUpperCase() + travelMode.slice(1)} Travel</h3>
              <p>For ${travelMode} bookings from ${currentCity} to ${this.destination.name}, we recommend checking these platforms:</p>
              <div class="alt-travel-links">
                ${travelMode === 'train' ? `
                  <a href="https://www.thetrainline.com/" target="_blank" class="alt-travel-link"><i class="fas fa-external-link-alt"></i> Trainline</a>
                  <a href="https://www.raileurope.com/" target="_blank" class="alt-travel-link"><i class="fas fa-external-link-alt"></i> Rail Europe</a>
                  <a href="https://www.seat61.com/" target="_blank" class="alt-travel-link"><i class="fas fa-external-link-alt"></i> Seat61</a>
                ` : travelMode === 'bus' ? `
                  <a href="https://www.flixbus.com/" target="_blank" class="alt-travel-link"><i class="fas fa-external-link-alt"></i> FlixBus</a>
                  <a href="https://www.busbud.com/" target="_blank" class="alt-travel-link"><i class="fas fa-external-link-alt"></i> Busbud</a>
                  <a href="https://www.rome2rio.com/" target="_blank" class="alt-travel-link"><i class="fas fa-external-link-alt"></i> Rome2Rio</a>
                ` : `
                  <a href="https://www.cruisecritic.com/" target="_blank" class="alt-travel-link"><i class="fas fa-external-link-alt"></i> Cruise Critic</a>
                  <a href="https://www.directferries.com/" target="_blank" class="alt-travel-link"><i class="fas fa-external-link-alt"></i> Direct Ferries</a>
                `}
              </div>
            </div>
          `;
        }
        this.displayTripSummary(hostCountry, currentCity, tripDate);
      }

      // Scroll to results
      if (resultsCard) resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    displayNearestAirports(airports) {
      const list = document.getElementById('nearestAirportsList');
      if (!list) return;

      list.innerHTML = airports.map(apt => `
        <div class="airport-item">
          <div class="airport-code">${apt.code}</div>
          <div class="airport-info">
            <strong>${apt.name}</strong>
            <span>${apt.city}</span>
          </div>
        </div>
      `).join('');
    },

    displayFlights(flights) {
      const list = document.getElementById('flightResultsList');
      if (!list) return;

      list.innerHTML = flights.map(flight => `
        <div class="flight-card" data-flight-id="${flight.id}">
          <div class="flight-airline">
            <div class="airline-logo" style="background-color: ${flight.airline.color}">
              <i class="${flight.airline.logo}"></i>
            </div>
            <div class="airline-info">
              <strong>${flight.airline.name}</strong>
              <span class="flight-number">${flight.flightNumber}</span>
            </div>
          </div>
          <div class="flight-route">
            <div class="flight-dep">
              <span class="flight-time">${flight.departure.time}</span>
              <span class="flight-airport">${flight.departure.airport.code}</span>
              <span class="flight-city-name">${flight.departure.airport.city}</span>
            </div>
            <div class="flight-duration-line">
              <span class="flight-duration">${flight.duration}</span>
              <div class="duration-line">
                <span class="dot"></span>
                <span class="line"></span>
                ${flight.stops > 0 ? '<span class="stop-dot"></span>' : ''}
                ${flight.stops > 1 ? '<span class="stop-dot"></span>' : ''}
                <span class="line"></span>
                <i class="fas fa-plane"></i>
              </div>
              <span class="flight-stops ${flight.stops === 0 ? 'direct' : ''}">${flight.stopsText}</span>
            </div>
            <div class="flight-arr">
              <span class="flight-time">${flight.arrival.time}</span>
              <span class="flight-airport">${flight.arrival.airport.code}</span>
              <span class="flight-city-name">${flight.arrival.airport.city}</span>
            </div>
          </div>
          <div class="flight-price-section">
            <div class="flight-price">$${flight.totalPrice.toLocaleString()}</div>
            <span class="price-per-person">${flight.passengers > 1 ? `$${flight.pricePerPerson}/person` : 'per person'}</span>
            <span class="seats-left ${flight.seatsLeft < 5 ? 'low' : ''}">${flight.seatsLeft} seats left</span>
            <button class="btn btn-primary btn-sm select-flight-btn" data-flight-id="${flight.id}">Select</button>
          </div>
        </div>
      `).join('');

      // Bind select buttons
      list.querySelectorAll('.select-flight-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const flightId = e.target.dataset.flightId;
          this.selectFlight(flightId);
        });
      });
    },

    selectFlight(flightId) {
      const flight = this.currentFlights?.find(f => f.id === flightId);
      if (!flight) return;

      // Highlight selected card
      document.querySelectorAll('.flight-card').forEach(c => c.classList.remove('selected'));
      const card = document.querySelector(`.flight-card[data-flight-id="${flightId}"]`);
      if (card) card.classList.add('selected');

      // Build Google Flights URL
      const from = flight.departure.airport.code;
      const to = flight.arrival.airport.code;
      const date = flight.departure.date;
      const googleFlightsUrl = `https://www.google.com/travel/flights?q=flights+from+${from}+to+${to}+on+${date}&curr=USD`;
      
      if (typeof showToast === 'function') {
        showToast(`Selected ${flight.airline.name} ${flight.flightNumber}. Check booking links below!`, 'success');
      }

      // Scroll to booking links
      const bookingCard = document.getElementById('bookingLinksCard');
      if (bookingCard) {
        bookingCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    displayBookingLinks(origin, destination, date) {
      const container = document.getElementById('bookingLinks');
      const card = document.getElementById('bookingLinksCard');
      if (!container || !card) return;

      card.classList.remove('hidden');

      const originEnc = encodeURIComponent(origin);
      const destEnc = encodeURIComponent(destination);

      const sites = [
        { name: 'Google Flights', icon: 'fab fa-google', url: `https://www.google.com/travel/flights?q=flights+from+${originEnc}+to+${destEnc}+on+${date}`, color: '#4285f4' },
        { name: 'Skyscanner', icon: 'fas fa-search-dollar', url: `https://www.skyscanner.com/transport/flights/${originEnc}/${destEnc}/${date.replace(/-/g, '')}`, color: '#0770e3' },
        { name: 'Kayak', icon: 'fas fa-ship', url: `https://www.kayak.com/flights/${originEnc}-${destEnc}/${date}`, color: '#ff690f' },
        { name: 'Expedia', icon: 'fas fa-globe', url: `https://www.expedia.com/Flights-search/${originEnc}-${destEnc}/${date}`, color: '#00355f' },
        { name: 'Momondo', icon: 'fas fa-search', url: `https://www.momondo.com/flights/${originEnc}-${destEnc}/${date}`, color: '#0896ff' },
        { name: 'Trip.com', icon: 'fas fa-plane', url: `https://www.trip.com/flights/${originEnc}-${destEnc}`, color: '#287dfa' },
      ];

      container.innerHTML = sites.map(site => `
        <a href="${site.url}" target="_blank" rel="noopener" class="booking-link-card">
          <div class="booking-link-icon" style="background: ${site.color}">
            <i class="${site.icon}"></i>
          </div>
          <span class="booking-link-name">${site.name}</span>
          <i class="fas fa-external-link-alt booking-link-arrow"></i>
        </a>
      `).join('');
    },

    displayTripSummary(hostCountry, city, date) {
      const card = document.getElementById('tripSummaryCard');
      const content = document.getElementById('tripSummaryContent');
      if (!card || !content) return;

      card.classList.remove('hidden');

      const returnDate = document.getElementById('tripReturnDate')?.value;
      const travelMode = document.querySelector('input[name="travelMode"]:checked')?.value || 'flight';

      content.innerHTML = `
        <div class="summary-grid">
          <div class="summary-item">
            <i class="fas fa-map-pin"></i>
            <div>
              <span class="summary-label">Destination</span>
              <span class="summary-value">${this.destination?.name || 'N/A'}</span>
            </div>
          </div>
          <div class="summary-item">
            <i class="fas fa-home"></i>
            <div>
              <span class="summary-label">Home Country</span>
              <span class="summary-value">${hostCountry}</span>
            </div>
          </div>
          <div class="summary-item">
            <i class="fas fa-map-marker-alt"></i>
            <div>
              <span class="summary-label">Departing From</span>
              <span class="summary-value">${city}</span>
            </div>
          </div>
          <div class="summary-item">
            <i class="fas fa-calendar-alt"></i>
            <div>
              <span class="summary-label">Travel Date</span>
              <span class="summary-value">${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          ${returnDate ? `
          <div class="summary-item">
            <i class="fas fa-calendar-check"></i>
            <div>
              <span class="summary-label">Return Date</span>
              <span class="summary-value">${new Date(returnDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>` : ''}
          <div class="summary-item">
            <i class="fas fa-${travelMode === 'flight' ? 'plane' : travelMode === 'train' ? 'train' : travelMode === 'bus' ? 'bus' : 'ship'}"></i>
            <div>
              <span class="summary-label">Travel Mode</span>
              <span class="summary-value">${travelMode.charAt(0).toUpperCase() + travelMode.slice(1)}</span>
            </div>
          </div>
          <div class="summary-item">
            <i class="fas fa-users"></i>
            <div>
              <span class="summary-label">Passengers</span>
              <span class="summary-value">${this.passengerCount}</span>
            </div>
          </div>
        </div>
      `;
    },

    saveCurrentTrip() {
      if (!this.destination) {
        if (typeof showToast === 'function') showToast('No trip to save.', 'warning');
        return;
      }

      const hostCountry = document.getElementById('tripHostCountry')?.value || '';
      const currentCity = document.getElementById('tripCurrentLocation')?.value || '';
      const tripDate = document.getElementById('tripDate')?.value || '';
      const returnDate = document.getElementById('tripReturnDate')?.value || '';
      const travelMode = document.querySelector('input[name="travelMode"]:checked')?.value || 'flight';

      const trip = {
        id: Date.now(),
        destination: this.destination.name,
        destinationFlag: this.destination.flag,
        hostCountry,
        departureCity: currentCity,
        tripDate,
        returnDate,
        travelMode,
        passengers: this.passengerCount,
        createdAt: new Date().toISOString()
      };

      this.trips.push(trip);
      localStorage.setItem('globemateTrips', JSON.stringify(this.trips));
      this.renderSavedTrips();
      if (typeof showToast === 'function') showToast('Trip saved successfully!', 'success');
    },

    shareTrip() {
      const text = `I'm planning a trip to ${this.destination?.name || 'somewhere amazing'}! Check out GlobeMate for trip planning.`;
      if (navigator.share) {
        navigator.share({ title: 'My GlobeMate Trip', text }).catch(() => {});
      } else {
        if (typeof copyToClipboard === 'function') {
          copyToClipboard(text);
        }
      }
    },

    loadTrips() {
      const saved = localStorage.getItem('globemateTrips');
      if (saved) {
        try {
          this.trips = JSON.parse(saved);
        } catch(e) {
          this.trips = [];
        }
      }
    },

    renderSavedTrips() {
      const list = document.getElementById('savedTripsList');
      const noTrips = document.getElementById('noTripsMessage');
      if (!list) return;

      if (this.trips.length === 0) {
        if (noTrips) noTrips.classList.remove('hidden');
        return;
      }

      if (noTrips) noTrips.classList.add('hidden');

      list.innerHTML = this.trips.map(trip => `
        <div class="saved-trip-item">
          <div class="saved-trip-flag">
            ${trip.destinationFlag ? `<img src="${trip.destinationFlag}" alt="${trip.destination}">` : '<i class="fas fa-globe"></i>'}
          </div>
          <div class="saved-trip-info">
            <h4>${trip.destination}</h4>
            <p><i class="fas fa-calendar-alt"></i> ${new Date(trip.tripDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${trip.returnDate ? ` — ${new Date(trip.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</p>
            <p><i class="fas fa-map-marker-alt"></i> From ${trip.departureCity} | <i class="fas fa-${trip.travelMode === 'flight' ? 'plane' : trip.travelMode}"></i> ${trip.travelMode}</p>
          </div>
          <button class="btn-icon delete-trip-btn" data-trip-id="${trip.id}" title="Delete trip">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join('');

      // Bind delete buttons
      list.querySelectorAll('.delete-trip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.currentTarget.dataset.tripId);
          this.deleteTrip(id);
        });
      });
    },

    deleteTrip(id) {
      this.trips = this.trips.filter(t => t.id !== id);
      localStorage.setItem('globemateTrips', JSON.stringify(this.trips));
      this.renderSavedTrips();
      if (typeof showToast === 'function') showToast('Trip deleted.', 'success');
    },

    sortFlights(sortBy) {
      if (!this.currentFlights) return;
      
      switch (sortBy) {
        case 'price':
          this.currentFlights.sort((a, b) => a.totalPrice - b.totalPrice);
          break;
        case 'duration':
          this.currentFlights.sort((a, b) => a.durationMinutes - b.durationMinutes);
          break;
        case 'departure':
          this.currentFlights.sort((a, b) => a.departure.time.localeCompare(b.departure.time));
          break;
      }
      
      this.displayFlights(this.currentFlights);
    },

    cleanup() {
      this.currentFlights = null;
    }
  };

  // Expose to global scope
  window.TripPlanner = TripPlanner;

  if (typeof PageLoader !== 'undefined') {
    PageLoader.registerModule('trip-planner', TripPlanner);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => TripPlanner.init());
    } else {
      TripPlanner.init();
    }
  }
})();
