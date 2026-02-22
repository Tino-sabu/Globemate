// ============ COUNTRY INFO MODULE ============
(function() {
  'use strict';
  
  const CountryExplorer = {
    countries: [],
    currentCountry: null,
    isLoading: false,

    init() {
      console.log('Country Explorer initializing...');
      this.bindEvents();
      this.loadCountries();
    },

    bindEvents() {
      console.log('Binding events...');
      
      const searchInput = document.getElementById('countrySearch');
      const checkVisaBtn = document.getElementById('checkVisaBtn');

      console.log('Search input found:', !!searchInput);
      console.log('Visa button found:', !!checkVisaBtn);

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          console.log('Search input event triggered:', e.target.value);
          this.handleSearch(e.target.value);
        });
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target)) {
            const dropdown = document.getElementById('countrySuggestions');
            if (dropdown) {
              dropdown.classList.add('hidden');
            }
          }
        });
        
        console.log('Search input event listener attached');
      } else {
        console.error('Search input element not found! ID: countrySearch');
      }

      if (checkVisaBtn) {
        checkVisaBtn.addEventListener('click', () => {
          this.checkVisa();
        });
      } else {
        console.warn('Visa check button not found! ID: checkVisaBtn');
      }

      // Fix Country & Plan Trip button
      const fixCountryBtn = document.getElementById('fixCountryBtn');
      if (fixCountryBtn) {
        fixCountryBtn.addEventListener('click', () => {
          this.fixCountryAndPlanTrip();
        });
      }
    },

    fixCountryAndPlanTrip() {
      if (!this.currentCountry) {
        if (typeof showToast === 'function') {
          showToast('Please search and select a country first.', 'warning');
        }
        return;
      }

      const country = this.currentCountry;
      const destination = {
        name: country.name.common,
        officialName: country.name.official,
        flag: country.flags?.svg || '',
        capital: country.capital?.[0] || '',
        region: country.region || '',
        cca3: country.cca3 || ''
      };

      // Save destination to localStorage
      localStorage.setItem('globemate_trip_destination', JSON.stringify(destination));

      if (typeof showToast === 'function') {
        showToast(`${country.name.common} fixed as destination! Redirecting to Trip Planner...`, 'success');
      }

      // Navigate to trip planner
      setTimeout(() => {
        if (typeof PageLoader !== 'undefined') {
          PageLoader.loadPage('trip-planner');
        }
      }, 800);
    },

    async loadCountries() {
      if (this.isLoading) return;
      
      try {
        this.isLoading = true;
        console.log('Fetching countries from REST Countries API...');
        
        if (typeof showToast === 'function') {
          showToast('Loading countries data...', 'info');
        }
        
        // API limit: max 10 fields
        const fields = 'name,capital,region,population,languages,currencies,flags,cca3,idd,car';
        const response = await fetch(`https://restcountries.com/v3.1/all?fields=${fields}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        this.countries = await response.json();
        console.log(`✓ Loaded ${this.countries.length} countries successfully`);
        
        this.populatePassportDropdown();
        
        if (typeof showToast === 'function') {
          showToast('Countries loaded successfully!', 'success');
        }
        
      } catch (error) {
        console.error('Error loading countries:', error);
        
        if (typeof showToast === 'function') {
          showToast('Failed to load countries. Using cached data.', 'error');
        }
        
        // Fallback: Use a small subset of countries
        this.countries = this.getFallbackCountries();
        this.populatePassportDropdown();
        console.log('Using fallback countries:', this.countries.length);
      } finally {
        this.isLoading = false;
      }
    },
    
    getFallbackCountries() {
      return [
        { name: { common: 'United States', official: 'United States of America' }, cca3: 'USA', flags: { svg: 'https://flagcdn.com/us.svg' }, capital: ['Washington, D.C.'], region: 'Americas', population: 331002651 },
        { name: { common: 'United Kingdom', official: 'United Kingdom of Great Britain and Northern Ireland' }, cca3: 'GBR', flags: { svg: 'https://flagcdn.com/gb.svg' }, capital: ['London'], region: 'Europe', population: 67886011 },
        { name: { common: 'Canada', official: 'Canada' }, cca3: 'CAN', flags: { svg: 'https://flagcdn.com/ca.svg' }, capital: ['Ottawa'], region: 'Americas', population: 38005238 },
        { name: { common: 'Australia', official: 'Commonwealth of Australia' }, cca3: 'AUS', flags: { svg: 'https://flagcdn.com/au.svg' }, capital: ['Canberra'], region: 'Oceania', population: 25687041 },
        { name: { common: 'Japan', official: 'Japan' }, cca3: 'JPN', flags: { svg: 'https://flagcdn.com/jp.svg' }, capital: ['Tokyo'], region: 'Asia', population: 125836021 },
        { name: { common: 'Germany', official: 'Federal Republic of Germany' }, cca3: 'DEU', flags: { svg: 'https://flagcdn.com/de.svg' }, capital: ['Berlin'], region: 'Europe', population: 83240525 },
        { name: { common: 'France', official: 'French Republic' }, cca3: 'FRA', flags: { svg: 'https://flagcdn.com/fr.svg' }, capital: ['Paris'], region: 'Europe', population: 67391582 }
      ];
    },

    handleSearch(query) {
      const dropdown = document.getElementById('countrySuggestions');
      
      if (!dropdown) {
        console.error('Suggestions dropdown not found!');
        return;
      }
      
      if (query.length < 2) {
        dropdown.classList.add('hidden');
        return;
      }

      console.log(`Searching for: "${query}", Total countries: ${this.countries.length}`);

      if (this.countries.length === 0) {
        dropdown.innerHTML = '<div class="suggestion-item"><span>Loading countries, please wait...</span></div>';
        dropdown.classList.remove('hidden');
        return;
      }

      const matches = this.countries.filter(country => 
        country.name.common.toLowerCase().includes(query.toLowerCase()) ||
        country.name.official.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);

      console.log(`Found ${matches.length} matches for "${query}"`);
      this.showSuggestions(matches, query);
    },

    showSuggestions(countries, query) {
      const dropdown = document.getElementById('countrySuggestions');
      if (!dropdown) return;

      if (countries.length === 0) {
        dropdown.innerHTML = `
          <div class="suggestion-item">
            <i class="fas fa-search"></i>
            <span>No countries found for "${query}"</span>
          </div>
        `;
        dropdown.classList.remove('hidden');
        return;
      }

      // Display matching countries with flags
      dropdown.innerHTML = countries.map(country => `
        <div class="suggestion-item" data-country="${country.cca3}">
          <img src="${country.flags.svg}" alt="${country.name.common}">
          <div>
            <strong>${country.name.common}</strong>
            <small>${country.name.official}</small>
          </div>
        </div>
      `).join('');

      // Add click handlers for suggestions
      dropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const countryCode = item.dataset.country;
          this.selectCountry(countryCode);
        });
      });

      dropdown.classList.remove('hidden');
    },

    selectCountry(code) {
      const country = this.countries.find(c => c.cca3 === code);
      if (!country) {
        console.error(`Country not found: ${code}`);
        return;
      }

      console.log('Selected country:', country.name.common);
      
      this.currentCountry = country;
      this.displayCountryInfo(country);
      document.getElementById('countrySuggestions')?.classList.add('hidden');
      document.getElementById('countrySearch').value = country.name.common;
      
      // Clear visa result when selecting new country
      const visaResult = document.getElementById('visaResult');
      if (visaResult) {
        visaResult.innerHTML = '';
        visaResult.classList.add('hidden');
      }
      
      // Load history and places
      this.loadCountryHistory(country);
      this.loadImportantPlaces(country);
    },

    displayCountryInfo(country) {
      console.log('Displaying info for:', country.name.common);
      
      try {
        // Update flag and name
        const flagImg = document.getElementById('countryFlag');
        const nameEl = document.getElementById('countryName');
        const officialNameEl = document.getElementById('countryOfficialName');
        const headerCard = document.getElementById('countryHeaderCard');
        
        if (flagImg) flagImg.src = country.flags.svg;
        if (nameEl) nameEl.textContent = country.name.common;
        if (officialNameEl) officialNameEl.textContent = country.name.official;

        // Set background image for country header
        if (headerCard) {
          const backgroundImage = this.getCountryBackgroundImage(country);
          headerCard.style.backgroundImage = `url('${backgroundImage}')`;
        }

        // Update info cards
        this.setTextContent('countryCapital', country.capital?.[0] || 'N/A');
        
        const regionText = country.region || 'N/A';
        this.setTextContent('countryRegion', regionText);
        
        const population = country.population 
          ? country.population.toLocaleString() 
          : 'N/A';
        this.setTextContent('countryPopulation', population);
        
        const languages = country.languages 
          ? Object.values(country.languages).join(', ') 
          : 'N/A';
        this.setTextContent('countryLanguages', languages);
        
        const currency = country.currencies ? Object.values(country.currencies)[0] : null;
        const currencyText = currency 
          ? `${currency.name}${currency.symbol ? ` (${currency.symbol})` : ''}`
          : 'N/A';
        this.setTextContent('countryCurrency', currencyText);
        
        // Show country info section
        const countryResultDiv = document.getElementById('countryResult');
        if (countryResultDiv) {
          countryResultDiv.classList.remove('hidden');
        }

        // Update Plan Trip CTA country name
        const planTripCountryName = document.getElementById('planTripCountryName');
        if (planTripCountryName) {
          planTripCountryName.textContent = country.name.common;
        }
        
      } catch (error) {
        console.error('Error displaying country info:', error);
        if (typeof showToast === 'function') {
          showToast('Error displaying country information', 'error');
        }
      }
    },

    setTextContent(elementId, text) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = text;
      }
    },

    getCountryBackgroundImage(country) {
      // Database of iconic images for countries
      const countryImages = {
        'FRA': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=400&fit=crop', // Paris
        'ITA': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1200&h=400&fit=crop', // Colosseum
        'JPN': 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=1200&h=400&fit=crop', // Tokyo
        'ESP': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1200&h=400&fit=crop', // Barcelona
        'GBR': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=400&fit=crop', // Big Ben
        'USA': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=1200&h=400&fit=crop', // NYC
        'CHN': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&h=400&fit=crop', // Great Wall
        'IND': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&h=400&fit=crop', // Taj Mahal
        'DEU': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&h=400&fit=crop', // Neuschwanstein
        'BRA': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&h=400&fit=crop', // Christ Redeemer
        'AUS': 'https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=1200&h=400&fit=crop', // Sydney Opera
        'CAN': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1200&h=400&fit=crop', // Banff
        'MEX': 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200&h=400&fit=crop', // Chichen Itza
        'RUS': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1200&h=400&fit=crop', // Moscow
        'THA': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&h=400&fit=crop', // Grand Palace
        'EGY': 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&h=400&fit=crop', // Pyramids
        'GRC': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&h=400&fit=crop', // Acropolis
        'TUR': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&h=400&fit=crop', // Istanbul
        'ARE': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&h=400&fit=crop', // Dubai
        'SGP': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&h=400&fit=crop', // Singapore
        'NLD': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&h=400&fit=crop', // Amsterdam
        'CHE': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop', // Swiss Alps
        'AUT': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&h=400&fit=crop', // Vienna
        'BEL': 'https://images.unsplash.com/photo-1559564484-e48eef1a14b0?w=1200&h=400&fit=crop', // Brussels
        'SWE': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1200&h=400&fit=crop', // Stockholm
        'NOR': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&h=400&fit=crop', // Norway fjords
        'DNK': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1200&h=400&fit=crop', // Copenhagen
        'FIN': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&h=400&fit=crop', // Helsinki
        'PRT': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&h=400&fit=crop', // Lisbon
        'IRL': 'https://images.unsplash.com/photo-1590503376178-04f36522c1fa?w=1200&h=400&fit=crop', // Ireland
        'POL': 'https://images.unsplash.com/photo-1619457386095-4d47f3f086e5?w=1200&h=400&fit=crop', // Warsaw
        'CZE': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&h=400&fit=crop', // Prague
        'HUN': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&h=400&fit=crop', // Budapest
        'ROU': 'https://images.unsplash.com/photo-1563920443079-783e5c786b83?w=1200&h=400&fit=crop', // Romania
        'ARG': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&h=400&fit=crop', // Buenos Aires
        'CHL': 'https://images.unsplash.com/photo-1504126254377-86b2c4e4805b?w=1200&h=400&fit=crop', // Chile
        'PER': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&h=400&fit=crop', // Machu Picchu
        'COL': 'https://images.unsplash.com/photo-1568632234168-4f0fbdea0529?w=1200&h=400&fit=crop', // Colombia
        'ZAF': 'https://images.unsplash.com/photo-1563656353898-febc9270a0f8?w=1200&h=400&fit=crop', // Cape Town
        'MAR': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200&h=400&fit=crop', // Morocco
        'KEN': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&h=400&fit=crop', // Kenya
        'NZL': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&h=400&fit=crop', // New Zealand
        'KOR': 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1200&h=400&fit=crop', // Seoul
        'VNM': 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=1200&h=400&fit=crop', // Vietnam
        'IDN': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=400&fit=crop', // Bali
        'MYS': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&h=400&fit=crop', // Malaysia
        'PHL': 'https://images.unsplash.com/photo-1531438871706-a1d0e3d95ce7?w=1200&h=400&fit=crop', // Philippines
        'ISL': 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200&h=400&fit=crop', // Iceland
        'HRV': 'https://images.unsplash.com/photo-1555990538-9f94b6e2c413?w=1200&h=400&fit=crop' // Croatia
      };
      
      // Return country-specific image or default  
      return countryImages[country.cca3] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=400&fit=crop';
    },

    async loadCountryHistory(country) {
      const historyCard = document.getElementById('countryHistory');
      const historyContent = document.getElementById('historyContent');
      
      if (!historyCard || !historyContent) return;
      
      // Show the card and loading state
      historyCard.classList.remove('hidden');
      historyContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading history...</div>';
      
      try {
        // Use Wikipedia API to get country information
        const searchTerm = country.name.common;
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
        
        const response = await fetch(wikiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }
        
        const data = await response.json();
        
        // Display the extract (summary)
        if (data.extract) {
          historyContent.innerHTML = `
            <div class="history-text">
              <p>${data.extract}</p>
              ${data.content_urls?.desktop?.page ? `
                <a href="${data.content_urls.desktop.page}" target="_blank" class="wiki-link">
                  <i class="fas fa-external-link-alt"></i> Read more on Wikipedia
                </a>
              ` : ''}
            </div>
          `;
        } else {
          throw new Error('No history data available');
        }
        
      } catch (error) {
        console.error('Error loading country history:', error);
        historyContent.innerHTML = `
          <div class="error-message">
            <i class="fas fa-info-circle"></i>
            <p>Historical information is currently unavailable for this country.</p>
          </div>
        `;
      }
    },

    async loadImportantPlaces(country) {
      const placesCard = document.getElementById('countryPlaces');
      const placesContent = document.getElementById('placesContent');
      
      if (!placesCard || !placesContent) return;
      
      // Show the card and loading state
      placesCard.classList.remove('hidden');
      placesContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading places...</div>';
      
      try {
        // Get curated places for this country
        const places = this.getImportantPlaces(country);
        
        if (places && places.length > 0) {
          placesContent.innerHTML = places.map(place => `
            <div class="place-card">
              <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(place.wiki || place.name)}" target="_blank" class="place-image-link">
                <div class="place-image">
                  <img src="${place.image}" alt="${place.name}" onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(place.name)}'">
                  <div class="place-overlay">
                    <i class="fas fa-${place.icon}"></i>
                  </div>
                </div>
              </a>
              <div class="place-info">
                <h4><a href="https://en.wikipedia.org/wiki/${encodeURIComponent(place.wiki || place.name)}" target="_blank">${place.name}</a></h4>
                <p>${place.description}</p>
                <div class="place-actions">
                  ${place.type ? `<span class="place-type">${place.type}</span>` : ''}
                  ${place.lat && place.lng ? `<a href="https://www.google.com/maps?q=${place.lat},${place.lng}" target="_blank" class="place-location-btn" title="View on Map"><i class="fas fa-map-marker-alt"></i> Location</a>` : ''}
                  <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(place.wiki || place.name)}" target="_blank" class="place-wiki-btn" title="Read on Wikipedia"><i class="fab fa-wikipedia-w"></i></a>
                </div>
              </div>
            </div>
          `).join('');
        } else {
          // Try to get places from Wikipedia
          await this.fetchPlacesFromWikipedia(country, placesContent);
        }
        
      } catch (error) {
        console.error('Error loading important places:', error);
        placesContent.innerHTML = `
          <div class="error-message">
            <i class="fas fa-info-circle"></i>
            <p>Places information is currently unavailable for this country.</p>
          </div>
        `;
      }
    },

    async fetchPlacesFromWikipedia(country, placesContent) {
      try {
        // Search for tourism page
        const searchTerm = `Tourism in ${country.name.common}`;
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
        
        const response = await fetch(wikiUrl);
        
        if (response.ok) {
          const data = await response.json();
          placesContent.innerHTML = `
            <div class="places-fallback">
              <p>${data.extract || 'Information about tourist destinations is available.'}</p>
              ${data.content_urls?.desktop?.page ? `
                <a href="${data.content_urls.desktop.page}" target="_blank" class="wiki-link">
                  <i class="fas fa-external-link-alt"></i> Discover places to visit
                </a>
              ` : ''}
            </div>
          `;
        } else {
          throw new Error('No tourism data found');
        }
      } catch (error) {
        placesContent.innerHTML = `
          <div class="places-fallback">
            <div class="place-card">
              <div class="place-icon"><i class="fas fa-city"></i></div>
              <div class="place-info">
                <h4>${country.capital?.[0] || 'Capital City'}</h4>
                <p>The capital city is often a major tourist destination with historical sites and cultural attractions.</p>
                <span class="place-type">City</span>
              </div>
            </div>
          </div>
        `;
      }
    },

    getImportantPlaces(country) {
      const placesDatabase = {
        'FRA': [
          { name: 'Eiffel Tower', wiki: 'Eiffel_Tower', description: 'Iconic iron lattice tower in Paris, symbol of France', type: 'Landmark', icon: 'landmark', image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&h=300&fit=crop', lat: 48.8584, lng: 2.2945 },
          { name: 'Louvre Museum', wiki: 'Louvre', description: 'World\'s largest art museum and historic monument', type: 'Museum', icon: 'university', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop', lat: 48.8606, lng: 2.3376 },
          { name: 'Palace of Versailles', wiki: 'Palace_of_Versailles', description: 'Former royal residence with magnificent gardens', type: 'Palace', icon: 'crown', image: 'https://images.unsplash.com/photo-1601974258903-a98d1b2f746e?w=400&h=300&fit=crop', lat: 48.8049, lng: 2.1204 },
          { name: 'Mont Saint-Michel', wiki: 'Mont-Saint-Michel', description: 'Medieval abbey on tidal island in Normandy', type: 'Historic Site', icon: 'church', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop', lat: 48.6361, lng: -1.5115 }
        ],
        'JPN': [
          { name: 'Mount Fuji', wiki: 'Mount_Fuji', description: 'Japan\'s highest mountain and sacred symbol', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&h=300&fit=crop', lat: 35.3606, lng: 138.7274 },
          { name: 'Fushimi Inari Shrine', wiki: 'Fushimi_Inari-taisha', description: 'Thousands of vermilion torii gates in Kyoto', type: 'Shrine', icon: 'torii-gate', image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop', lat: 34.9671, lng: 135.7727 },
          { name: 'Tokyo Tower', wiki: 'Tokyo_Tower', description: 'Communications and observation tower inspired by Eiffel Tower', type: 'Landmark', icon: 'tower-broadcast', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop', lat: 35.6586, lng: 139.7454 },
          { name: 'Hiroshima Peace Memorial', wiki: 'Hiroshima_Peace_Memorial', description: 'Monument dedicated to peace and nuclear disarmament', type: 'Memorial', icon: 'dove', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=300&fit=crop', lat: 34.3955, lng: 132.4536 }
        ],
        'ITA': [
          { name: 'Colosseum', wiki: 'Colosseum', description: 'Ancient amphitheater, iconic symbol of Imperial Rome', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop', lat: 41.8902, lng: 12.4922 },
          { name: 'Venice Grand Canal', wiki: 'Grand_Canal_(Venice)', description: 'Romantic waterways and historic architecture', type: 'City', icon: 'water', image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&h=300&fit=crop', lat: 45.4408, lng: 12.3155 },
          { name: 'Leaning Tower of Pisa', wiki: 'Leaning_Tower_of_Pisa', description: 'Famous bell tower known for its unintended tilt', type: 'Landmark', icon: 'monument', image: 'https://images.unsplash.com/photo-1583934443781-a8dfa9ac2076?w=400&h=300&fit=crop', lat: 43.7230, lng: 10.3966 },
          { name: 'Amalfi Coast', wiki: 'Amalfi_Coast', description: 'Stunning stretch of coastline south of Naples', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=400&h=300&fit=crop', lat: 40.6333, lng: 14.6029 }
        ],
        'ESP': [
          { name: 'Sagrada Familia', wiki: 'Sagrada_Família', description: 'Gaudí\'s unfinished masterpiece in Barcelona', type: 'Church', icon: 'church', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop', lat: 41.4036, lng: 2.1744 },
          { name: 'Alhambra', wiki: 'Alhambra', description: 'Moorish palace and fortress complex in Granada', type: 'Palace', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1589788292671-791ada59ba24?w=400&h=300&fit=crop', lat: 37.1761, lng: -3.5881 },
          { name: 'Park Güell', wiki: 'Park_Güell', description: 'Colorful park with architectural elements by Gaudí', type: 'Park', icon: 'tree', image: 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=400&h=300&fit=crop', lat: 41.4145, lng: 2.1527 },
          { name: 'Plaza de España, Seville', wiki: 'Plaza_de_España_(Seville)', description: 'Grand plaza built for the 1929 Ibero-American Exposition', type: 'Landmark', icon: 'landmark', image: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400&h=300&fit=crop', lat: 37.3772, lng: -5.9869 }
        ],
        'GBR': [
          { name: 'Big Ben', wiki: 'Big_Ben', description: 'Iconic clock tower at the Palace of Westminster', type: 'Landmark', icon: 'landmark', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop', lat: 51.5007, lng: -0.1246 },
          { name: 'Tower of London', wiki: 'Tower_of_London', description: 'Historic castle and home to the Crown Jewels', type: 'Castle', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&h=300&fit=crop', lat: 51.5081, lng: -0.0759 },
          { name: 'Stonehenge', wiki: 'Stonehenge', description: 'Prehistoric monument in Wiltshire', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1599833975787-5ad2f962c78b?w=400&h=300&fit=crop', lat: 51.1789, lng: -1.8262 },
          { name: 'Edinburgh Castle', wiki: 'Edinburgh_Castle', description: 'Historic fortress dominating the Edinburgh skyline', type: 'Castle', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1588974269162-4c0e5c0e0e0e?w=400&h=300&fit=crop', lat: 55.9486, lng: -3.1999 }
        ],
        'USA': [
          { name: 'Statue of Liberty', wiki: 'Statue_of_Liberty', description: 'Iconic symbol of freedom in New York Harbor', type: 'Monument', icon: 'monument', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=400&h=300&fit=crop', lat: 40.6892, lng: -74.0445 },
          { name: 'Grand Canyon', wiki: 'Grand_Canyon', description: 'Massive natural wonder carved by the Colorado River', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=400&h=300&fit=crop', lat: 36.1069, lng: -112.1129 },
          { name: 'Golden Gate Bridge', wiki: 'Golden_Gate_Bridge', description: 'Iconic red suspension bridge in San Francisco', type: 'Landmark', icon: 'bridge', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop', lat: 37.8199, lng: -122.4783 },
          { name: 'Times Square', wiki: 'Times_Square', description: 'Bustling commercial intersection and entertainment center', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop', lat: 40.7580, lng: -73.9855 }
        ],
        'CHN': [
          { name: 'Great Wall of China', wiki: 'Great_Wall_of_China', description: 'Ancient fortification stretching thousands of miles', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&h=300&fit=crop', lat: 40.4319, lng: 116.5704 },
          { name: 'Forbidden City', wiki: 'Forbidden_City', description: 'Imperial palace complex in Beijing', type: 'Palace', icon: 'crown', image: 'https://images.unsplash.com/photo-1584266161905-2f6573548d63?w=400&h=300&fit=crop', lat: 39.9163, lng: 116.3972 },
          { name: 'Terracotta Army', wiki: 'Terracotta_Army', description: 'Ancient sculptures depicting armies of Qin Shi Huang', type: 'Museum', icon: 'landmark', image: 'https://images.unsplash.com/photo-1591122947157-26bad3a117d2?w=400&h=300&fit=crop', lat: 34.3841, lng: 109.2785 },
          { name: 'The Bund, Shanghai', wiki: 'The_Bund', description: 'Waterfront area with colonial-era buildings and modern skyline', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1537531383496-f4749b76cac3?w=400&h=300&fit=crop', lat: 31.2400, lng: 121.4900 }
        ],
        'EGY': [
          { name: 'Pyramids of Giza', wiki: 'Giza_pyramid_complex', description: 'Ancient wonders and last surviving of the original Seven Wonders', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&h=300&fit=crop', lat: 29.9792, lng: 31.1342 },
          { name: 'Abu Simbel', wiki: 'Abu_Simbel', description: 'Massive rock-cut temples built by Ramesses II', type: 'Temple', icon: 'landmark', image: 'https://images.unsplash.com/photo-1568636505933-1e1c5f5ad1b4?w=400&h=300&fit=crop', lat: 22.3459, lng: 31.6156 },
          { name: 'Valley of the Kings', wiki: 'Valley_of_the_Kings', description: 'Ancient burial ground containing 63 royal tombs', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&h=300&fit=crop', lat: 25.7402, lng: 32.6014 },
          { name: 'Karnak Temple', wiki: 'Karnak', description: 'Massive ancient temple complex in Luxor', type: 'Temple', icon: 'church', image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=400&h=300&fit=crop', lat: 25.7188, lng: 32.6573 }
        ],
        'IND': [
          { name: 'Taj Mahal', wiki: 'Taj_Mahal', description: 'White marble mausoleum, symbol of eternal love', type: 'Monument', icon: 'landmark', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=300&fit=crop', lat: 27.1751, lng: 78.0421 },
          { name: 'Red Fort', wiki: 'Red_Fort', description: 'Historic Mughal-era fortified palace in Delhi', type: 'Fort', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop', lat: 28.6562, lng: 77.2410 },
          { name: 'Jaipur City Palace', wiki: 'City_Palace,_Jaipur', description: 'Royal residence blending Rajput and Mughal architecture', type: 'Palace', icon: 'crown', image: 'https://media-cdn.tripadvisor.com/media/photo-s/10/cb/09/72/city-palace-of-jaipur.jpg', lat: 26.9260, lng: 75.8235 },
          { name: 'Varanasi Ghats', wiki: 'Ghats_in_Varanasi', description: 'Sacred riverside steps along the Ganges', type: 'Religious Site', icon: 'place-of-worship', image: 'https://varanasismartcity.gov.in//assets/images/images/DashashwamedhGhat.jpg', lat: 25.3176, lng: 83.0104 }
        ],
        'AUS': [
          { name: 'Sydney Opera House', wiki: 'Sydney_Opera_House', description: 'Iconic performing arts center with unique sail design', type: 'Landmark', icon: 'landmark', image: 'https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=400&h=300&fit=crop', lat: -33.8568, lng: 151.2153 },
          { name: 'Great Barrier Reef', wiki: 'Great_Barrier_Reef', description: 'World\'s largest coral reef system', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop', lat: -18.2871, lng: 147.6992 },
          { name: 'Uluru', wiki: 'Uluru', description: 'Sacred sandstone monolith in the heart of Australia', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1529108190281-9a4f620bc2d8?w=400&h=300&fit=crop', lat: -25.3444, lng: 131.0369 },
          { name: 'Twelve Apostles', wiki: 'The_Twelve_Apostles_(Victoria)', description: 'Limestone stacks off the coast of Victoria', type: 'Nature', icon: 'water', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/The_Twelve_Apostles_2011.jpg', lat: -38.6655, lng: 143.1049 }
        ],
        'BRA': [
          { name: 'Christ the Redeemer', wiki: 'Christ_the_Redeemer_(statue)', description: 'Iconic Art Deco statue overlooking Rio de Janeiro', type: 'Monument', icon: 'monument', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=300&fit=crop', lat: -22.9519, lng: -43.2105 },
          { name: 'Iguazu Falls', wiki: 'Iguazu_Falls', description: 'Massive waterfalls on the border with Argentina', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1619546952812-200e9a516f8f?w=400&h=300&fit=crop', lat: -25.6953, lng: -54.4367 },
          { name: 'Sugarloaf Mountain', wiki: 'Sugarloaf_Mountain', description: 'Peak with cable car offering panoramic views of Rio', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=400&h=300&fit=crop', lat: -22.9491, lng: -43.1546 },
          { name: 'Amazon Rainforest', wiki: 'Amazon_rainforest', description: 'World\'s largest tropical rainforest', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop', lat: -3.4653, lng: -62.2159 }
        ],
        'DEU': [
          { name: 'Brandenburg Gate', wiki: 'Brandenburg_Gate', description: 'Neoclassical monument and symbol of German unity', type: 'Landmark', icon: 'landmark', image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=300&fit=crop', lat: 52.5163, lng: 13.3777 },
          { name: 'Neuschwanstein Castle', wiki: 'Neuschwanstein_Castle', description: 'Fairy-tale castle in the Bavarian Alps', type: 'Castle', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop', lat: 47.5576, lng: 10.7498 },
          { name: 'Cologne Cathedral', wiki: 'Cologne_Cathedral', description: 'Gothic masterpiece and UNESCO World Heritage site', type: 'Church', icon: 'church', image: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=400&h=300&fit=crop', lat: 50.9413, lng: 6.9583 },
          { name: 'Berlin Wall Memorial', wiki: 'Berlin_Wall', description: 'Historic memorial of the divided city', type: 'Memorial', icon: 'monument', image: 'https://images.unsplash.com/photo-1551525212-a1fb75e16ffc?w=400&h=300&fit=crop', lat: 52.5350, lng: 13.3900 }
        ],
        'CAN': [
          { name: 'Niagara Falls', wiki: 'Niagara_Falls', description: 'Powerful waterfalls on the US-Canada border', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1489447068241-b3490214e879?w=400&h=300&fit=crop', lat: 43.0896, lng: -79.0849 },
          { name: 'Banff National Park', wiki: 'Banff_National_Park', description: 'Stunning Rocky Mountain scenery and turquoise lakes', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=400&h=300&fit=crop', lat: 51.4968, lng: -115.9281 },
          { name: 'CN Tower', wiki: 'CN_Tower', description: 'Iconic communications and observation tower in Toronto', type: 'Landmark', icon: 'tower-broadcast', image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=300&fit=crop', lat: 43.6426, lng: -79.3871 },
          { name: 'Old Montreal', wiki: 'Old_Montreal', description: 'Historic district with cobblestone streets and French architecture', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1559587336-6de1d85b3984?w=400&h=300&fit=crop', lat: 45.5079, lng: -73.5540 }
        ],
        'MEX': [
          { name: 'Chichen Itza', wiki: 'Chichen_Itza', description: 'Ancient Mayan city with iconic El Castillo pyramid', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&h=300&fit=crop', lat: 20.6843, lng: -88.5678 },
          { name: 'Teotihuacan', wiki: 'Teotihuacan', description: 'Ancient Mesoamerican city with massive pyramids', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1512813195329-d6369a7429f5?w=400&h=300&fit=crop', lat: 19.6925, lng: -98.8437 },
          { name: 'Cancún', wiki: 'Cancún', description: 'Beautiful Caribbean beaches and resorts', type: 'Beach', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=400&h=300&fit=crop', lat: 21.1619, lng: -86.8515 },
          { name: 'Cenotes of Yucatán', wiki: 'Cenote', description: 'Natural sinkholes with crystal-clear freshwater', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1534791400428-5a42ece35c0a?w=400&h=300&fit=crop', lat: 20.7320, lng: -89.3300 }
        ],
        'GRC': [
          { name: 'Acropolis of Athens', wiki: 'Acropolis_of_Athens', description: 'Ancient citadel above Athens featuring the Parthenon', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&h=300&fit=crop', lat: 37.9715, lng: 23.7257 },
          { name: 'Santorini', wiki: 'Santorini', description: 'Stunning volcanic island with white and blue buildings', type: 'Island', icon: 'water', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300&fit=crop', lat: 36.3932, lng: 25.4615 },
          { name: 'Meteora', wiki: 'Meteora', description: 'Monasteries built atop towering natural rock pillars', type: 'Religious Site', icon: 'church', image: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=400&h=300&fit=crop', lat: 39.7217, lng: 21.6306 },
          { name: 'Delphi', wiki: 'Delphi', description: 'Ancient sanctuary and oracle site on Mount Parnassus', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1601581987809-a874a81309c9?w=400&h=300&fit=crop', lat: 38.4824, lng: 22.5012 }
        ],
        'THA': [
          { name: 'Grand Palace', wiki: 'Grand_Palace', description: 'Former royal residence with ornate temples in Bangkok', type: 'Palace', icon: 'crown', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&h=300&fit=crop', lat: 13.7500, lng: 100.4914 },
          { name: 'Phi Phi Islands', wiki: 'Phi_Phi_Islands', description: 'Beautiful limestone islands in the Andaman Sea', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop', lat: 7.7407, lng: 98.7784 },
          { name: 'Wat Arun', wiki: 'Wat_Arun', description: 'Temple of Dawn with distinctive spires on the river', type: 'Temple', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=300&fit=crop', lat: 13.7437, lng: 100.4888 },
          { name: 'Ayutthaya', wiki: 'Ayutthaya_(city)', description: 'Ancient capital with magnificent temple ruins', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1598968210756-3cb5b590e7b7?w=400&h=300&fit=crop', lat: 14.3692, lng: 100.5877 }
        ],
        'TUR': [
          { name: 'Hagia Sophia', wiki: 'Hagia_Sophia', description: 'Historic cathedral-turned-mosque in Istanbul', type: 'Historic Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&h=300&fit=crop', lat: 41.0086, lng: 28.9802 },
          { name: 'Cappadocia', wiki: 'Cappadocia', description: 'Fairy chimneys and hot air balloon rides', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=400&h=300&fit=crop', lat: 38.6431, lng: 34.8289 },
          { name: 'Pamukkale', wiki: 'Pamukkale', description: 'White travertine terraces and thermal pools', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1600623047481-57e6e702cb47?w=400&h=300&fit=crop', lat: 37.9204, lng: 29.1187 },
          { name: 'Ephesus', wiki: 'Ephesus', description: 'Ancient Greek city with well-preserved ruins', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1590076083625-7709e5f81e1e?w=400&h=300&fit=crop', lat: 37.9392, lng: 27.3417 }
        ],
        'RUS': [
          { name: 'Red Square', wiki: 'Red_Square', description: 'Moscow\'s most famous square with St. Basil\'s Cathedral', type: 'Landmark', icon: 'landmark', image: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400&h=300&fit=crop', lat: 55.7539, lng: 37.6208 },
          { name: 'Hermitage Museum', wiki: 'Hermitage_Museum', description: 'One of the world\'s largest art museums in St. Petersburg', type: 'Museum', icon: 'university', image: 'https://images.unsplash.com/photo-1548834925-e48f8a27ae24?w=400&h=300&fit=crop', lat: 59.9398, lng: 30.3146 },
          { name: 'Lake Baikal', wiki: 'Lake_Baikal', description: 'Deepest and oldest freshwater lake in the world', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1551845738-8e5c3e2d8d26?w=400&h=300&fit=crop', lat: 53.5587, lng: 108.1650 },
          { name: 'Kremlin', wiki: 'Moscow_Kremlin', description: 'Fortified complex and seat of Russian government', type: 'Historic Site', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=400&h=300&fit=crop', lat: 55.7520, lng: 37.6175 }
        ],
        'ZAF': [
          { name: 'Table Mountain', wiki: 'Table_Mountain', description: 'Flat-topped mountain overlooking Cape Town', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=300&fit=crop', lat: -33.9628, lng: 18.4098 },
          { name: 'Kruger National Park', wiki: 'Kruger_National_Park', description: 'One of Africa\'s largest game reserves', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop', lat: -23.9884, lng: 31.5547 },
          { name: 'Cape of Good Hope', wiki: 'Cape_of_Good_Hope', description: 'Rocky headland on the Atlantic coast', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1552425006-9348b90e7cce?w=400&h=300&fit=crop', lat: -34.3568, lng: 18.4740 },
          { name: 'Robben Island', wiki: 'Robben_Island', description: 'Historic prison island where Nelson Mandela was held', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1591120651251-f5cce0e6bffa?w=400&h=300&fit=crop', lat: -33.8076, lng: 18.3712 }
        ],
        'KOR': [
          { name: 'Gyeongbokgung Palace', wiki: 'Gyeongbokgung', description: 'Grand palace from the Joseon dynasty in Seoul', type: 'Palace', icon: 'crown', image: 'https://images.unsplash.com/photo-1546874177-9e664107314e?w=400&h=300&fit=crop', lat: 37.5796, lng: 126.9770 },
          { name: 'Bukchon Hanok Village', wiki: 'Bukchon_Hanok_Village', description: 'Traditional Korean village with hundreds of hanok houses', type: 'Historic Site', icon: 'home', image: 'https://images.unsplash.com/photo-1553619420-c96f4e72bb6b?w=400&h=300&fit=crop', lat: 37.5826, lng: 126.9831 },
          { name: 'Jeju Island', wiki: 'Jeju_Island', description: 'Volcanic island with waterfalls, beaches, and lava tubes', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1600002415506-dd06090d3480?w=400&h=300&fit=crop', lat: 33.4996, lng: 126.5312 },
          { name: 'N Seoul Tower', wiki: 'N_Seoul_Tower', description: 'Communication and observation tower with city views', type: 'Landmark', icon: 'tower-broadcast', image: 'https://images.unsplash.com/photo-1617178388636-0e59bf560792?w=400&h=300&fit=crop', lat: 37.5512, lng: 126.9882 }
        ],
        'ARG': [
          { name: 'Iguazú Falls', wiki: 'Iguazu_Falls', description: 'Breathtaking waterfall system on Brazilian border', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1619546952812-200e9a516f8f?w=400&h=300&fit=crop', lat: -25.6953, lng: -54.4367 },
          { name: 'Perito Moreno Glacier', wiki: 'Perito_Moreno_Glacier', description: 'Massive advancing glacier in Patagonia', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop', lat: -50.4966, lng: -73.1378 },
          { name: 'Buenos Aires Obelisk', wiki: 'Obelisco_de_Buenos_Aires', description: 'Iconic monument in the heart of Buenos Aires', type: 'Landmark', icon: 'monument', image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=400&h=300&fit=crop', lat: -34.6037, lng: -58.3816 },
          { name: 'La Boca', wiki: 'La_Boca', description: 'Colorful neighborhood known for tango and street art', type: 'City', icon: 'palette', image: 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=400&h=300&fit=crop', lat: -34.6345, lng: -58.3630 }
        ],
        'PER': [
          { name: 'Machu Picchu', wiki: 'Machu_Picchu', description: 'Ancient Incan citadel high in the Andes Mountains', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&h=300&fit=crop', lat: -13.1631, lng: -72.5450 },
          { name: 'Sacred Valley', wiki: 'Sacred_Valley', description: 'Scenic valley with Incan ruins and traditional villages', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=300&fit=crop', lat: -13.3370, lng: -72.0750 },
          { name: 'Cusco', wiki: 'Cusco', description: 'Former Inca capital with colonial architecture', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=400&h=300&fit=crop', lat: -13.5320, lng: -71.9675 },
          { name: 'Lake Titicaca', wiki: 'Lake_Titicaca', description: 'Highest navigable lake in the world', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1580415752826-1459fef63e61?w=400&h=300&fit=crop', lat: -15.9254, lng: -69.3354 }
        ],
        'MAR': [
          { name: 'Jemaa el-Fnaa', wiki: 'Jemaa_el-Fnaa', description: 'Famous square and marketplace in Marrakesh', type: 'City', icon: 'store', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&h=300&fit=crop', lat: 31.6258, lng: -7.9891 },
          { name: 'Hassan II Mosque', wiki: 'Hassan_II_Mosque', description: 'Stunning mosque partly built over the Atlantic Ocean', type: 'Religious Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?w=400&h=300&fit=crop', lat: 33.6087, lng: -7.6322 },
          { name: 'Sahara Desert', wiki: 'Sahara', description: 'World\'s largest hot desert with stunning dunes', type: 'Nature', icon: 'sun', image: 'https://images.unsplash.com/photo-1509622905150-fa66d3906e09?w=400&h=300&fit=crop', lat: 31.0500, lng: -4.0000 },
          { name: 'Chefchaouen', wiki: 'Chefchaouen', description: 'Enchanting blue-washed city in the Rif Mountains', type: 'City', icon: 'palette', image: 'https://images.unsplash.com/photo-1553244390-e08c9be70ffd?w=400&h=300&fit=crop', lat: 35.1688, lng: -5.2636 }
        ],
        'NZL': [
          { name: 'Milford Sound', wiki: 'Milford_Sound', description: 'Stunning fiord in the southwest of New Zealand', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400&h=300&fit=crop', lat: -44.6713, lng: 167.9272 },
          { name: 'Hobbiton', wiki: 'Hobbiton_Movie_Set', description: 'Movie set from The Lord of the Rings trilogy', type: 'Landmark', icon: 'film', image: 'https://images.unsplash.com/photo-1595125990323-885cec5217ff?w=400&h=300&fit=crop', lat: -37.8722, lng: 175.6830 },
          { name: 'Tongariro National Park', wiki: 'Tongariro_National_Park', description: 'Volcanic landscape and New Zealand\'s oldest national park', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=400&h=300&fit=crop', lat: -39.2000, lng: 175.5833 },
          { name: 'Bay of Islands', wiki: 'Bay_of_Islands', description: 'Subtropical micro-region with 144 islands', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1507097489474-c9212a8f8597?w=400&h=300&fit=crop', lat: -35.2281, lng: 174.0917 }
        ],
        'PRT': [
          { name: 'Tower of Belém', wiki: 'Belém_Tower', description: 'Iconic fortified tower on the Tagus River', type: 'Landmark', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=300&fit=crop', lat: 38.6916, lng: -9.2160 },
          { name: 'Jerónimos Monastery', wiki: 'Jerónimos_Monastery', description: 'Ornate 16th-century Manueline-style monastery', type: 'Historic Site', icon: 'church', image: 'https://images.unsplash.com/photo-1588176053922-e8e76eb5c4b2?w=400&h=300&fit=crop', lat: 38.6979, lng: -9.2068 },
          { name: 'Pena Palace', wiki: 'Pena_Palace', description: 'Colorful Romanticist castle in Sintra', type: 'Palace', icon: 'crown', image: 'https://images.unsplash.com/photo-1580323956510-5c899a981e60?w=400&h=300&fit=crop', lat: 38.7876, lng: -9.3907 },
          { name: 'Douro Valley', wiki: 'Douro_DOC', description: 'Wine region with terraced vineyards along the river', type: 'Nature', icon: 'wine-glass', image: 'https://images.unsplash.com/photo-1558369178-6556d97855d0?w=400&h=300&fit=crop', lat: 41.1579, lng: -7.7227 }
        ],
        'NLD': [
          { name: 'Anne Frank House', wiki: 'Anne_Frank_House', description: 'Museum dedicated to the wartime diarist', type: 'Museum', icon: 'university', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', lat: 52.3752, lng: 4.8840 },
          { name: 'Keukenhof Gardens', wiki: 'Keukenhof', description: 'World\'s largest flower garden with millions of tulips', type: 'Park', icon: 'seedling', image: 'https://images.unsplash.com/photo-1524386416438-98b9b2d4b433?w=400&h=300&fit=crop', lat: 52.2700, lng: 4.5463 },
          { name: 'Rijksmuseum', wiki: 'Rijksmuseum', description: 'Dutch national museum with Rembrandt and Vermeer', type: 'Museum', icon: 'university', image: 'https://images.unsplash.com/photo-1582807129843-8a00296ccb37?w=400&h=300&fit=crop', lat: 52.3600, lng: 4.8852 },
          { name: 'Kinderdijk', wiki: 'Kinderdijk', description: 'UNESCO network of 19 historic windmills', type: 'Historic Site', icon: 'fan', image: 'https://images.unsplash.com/photo-1605101100278-5d1deb2b6498?w=400&h=300&fit=crop', lat: 51.8833, lng: 4.6333 }
        ],
        'AUT': [
          { name: 'Schönbrunn Palace', wiki: 'Schönbrunn_Palace', description: 'Former imperial summer residence in Vienna', type: 'Palace', icon: 'crown', image: 'https://images.unsplash.com/photo-1609856878074-cf31e21ccb6b?w=400&h=300&fit=crop', lat: 48.1845, lng: 16.3122 },
          { name: 'Hallstatt', wiki: 'Hallstatt', description: 'Picturesque lakeside village in the Austrian Alps', type: 'City', icon: 'home', image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400&h=300&fit=crop', lat: 47.5622, lng: 13.6493 },
          { name: 'St. Stephen\'s Cathedral', wiki: 'St._Stephen%27s_Cathedral,_Vienna', description: 'Gothic cathedral and symbol of Vienna', type: 'Church', icon: 'church', image: 'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=400&h=300&fit=crop', lat: 48.2082, lng: 16.3738 },
          { name: 'Salzburg Old Town', wiki: 'Altstadt_Salzburg', description: 'Baroque city center and birthplace of Mozart', type: 'City', icon: 'music', image: 'https://images.unsplash.com/photo-1588881727773-2d9d6afb80a0?w=400&h=300&fit=crop', lat: 47.8000, lng: 13.0450 }
        ],
        'CHE': [
          { name: 'Matterhorn', wiki: 'Matterhorn', description: 'Iconic pyramid-shaped peak in the Alps', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1529973625058-a665431e8506?w=400&h=300&fit=crop', lat: 45.9763, lng: 7.6586 },
          { name: 'Lake Geneva', wiki: 'Lake_Geneva', description: 'Crescent-shaped alpine lake with the Jet d\'Eau', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=400&h=300&fit=crop', lat: 46.4530, lng: 6.5783 },
          { name: 'Jungfraujoch', wiki: 'Jungfraujoch', description: 'Top of Europe mountain pass with panoramic views', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=400&h=300&fit=crop', lat: 46.5472, lng: 7.9620 },
          { name: 'Chapel Bridge, Lucerne', wiki: 'Chapel_Bridge', description: 'Medieval covered wooden bridge with paintings', type: 'Landmark', icon: 'bridge', image: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=400&h=300&fit=crop', lat: 47.0515, lng: 8.3074 }
        ],
        'NOR': [
          { name: 'Geirangerfjord', wiki: 'Geirangerfjord', description: 'Stunning deep blue fjord with waterfalls', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop', lat: 62.1049, lng: 7.0950 },
          { name: 'Tromsø', wiki: 'Tromsø', description: 'Gateway to the Arctic with Northern Lights', type: 'City', icon: 'star', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop', lat: 69.6492, lng: 18.9553 },
          { name: 'Preikestolen', wiki: 'Preikestolen', description: 'Dramatic cliff with 604m drop to the fjord below', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=400&h=300&fit=crop', lat: 58.9863, lng: 6.1908 },
          { name: 'Lofoten Islands', wiki: 'Lofoten', description: 'Dramatic scenery with mountains rising from the sea', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1516562309708-05f3b2b2c238?w=400&h=300&fit=crop', lat: 68.2500, lng: 14.5667 }
        ],
        'SWE': [
          { name: 'Vasa Museum', wiki: 'Vasa_Museum', description: 'Museum displaying a nearly intact 17th-century warship', type: 'Museum', icon: 'ship', image: 'https://images.unsplash.com/photo-1585154445689-9c34c5c0c992?w=400&h=300&fit=crop', lat: 59.3280, lng: 18.0914 },
          { name: 'Gamla Stan', wiki: 'Gamla_stan', description: 'Stockholm\'s old town with colorful medieval buildings', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1572621081923-c1a76c35e951?w=400&h=300&fit=crop', lat: 59.3253, lng: 18.0714 },
          { name: 'Icehotel', wiki: 'Icehotel_(Jukkasjärvi)', description: 'World\'s first hotel made entirely of ice', type: 'Landmark', icon: 'snowflake', image: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&h=300&fit=crop', lat: 67.8558, lng: 20.5944 },
          { name: 'Stockholm Archipelago', wiki: 'Stockholm_archipelago', description: 'Stunning chain of 30,000 islands and skerries', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=400&h=300&fit=crop', lat: 59.3940, lng: 18.4080 }
        ],
        'ISL': [
          { name: 'Blue Lagoon', wiki: 'Blue_Lagoon_(geothermal_spa)', description: 'Geothermal spa with milky-blue waters', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1515861461149-8c917e23fdb0?w=400&h=300&fit=crop', lat: 63.8804, lng: -22.4495 },
          { name: 'Golden Circle', wiki: 'Golden_Circle_(Iceland)', description: 'Tourist route with geysers, waterfalls, and tectonic plates', type: 'Nature', icon: 'route', image: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400&h=300&fit=crop', lat: 64.3271, lng: -20.1199 },
          { name: 'Jökulsárlón', wiki: 'Jökulsárlón', description: 'Glacier lagoon with floating icebergs', type: 'Nature', icon: 'snowflake', image: 'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=400&h=300&fit=crop', lat: 64.0784, lng: -16.2306 },
          { name: 'Hallgrímskirkja', wiki: 'Hallgrímskirkja', description: 'Iconic Lutheran church and Reykjavík landmark', type: 'Church', icon: 'church', image: 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=400&h=300&fit=crop', lat: 64.1417, lng: -21.9267 }
        ],
        'IDN': [
          { name: 'Borobudur', wiki: 'Borobudur', description: 'World\'s largest Buddhist temple in Central Java', type: 'Temple', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=400&h=300&fit=crop', lat: -7.6079, lng: 110.2038 },
          { name: 'Bali Rice Terraces', wiki: 'Jatiluwih_rice_terraces', description: 'UNESCO-listed rice terraces in Bali', type: 'Nature', icon: 'seedling', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop', lat: -8.3682, lng: 115.1310 },
          { name: 'Komodo National Park', wiki: 'Komodo_National_Park', description: 'Home of the famous Komodo dragons', type: 'Nature', icon: 'dragon', image: 'https://images.unsplash.com/photo-1570789210967-2cac24ee7f3f?w=400&h=300&fit=crop', lat: -8.5500, lng: 119.4833 },
          { name: 'Uluwatu Temple', wiki: 'Uluwatu_Temple', description: 'Sea temple perched on a cliff edge in Bali', type: 'Temple', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=300&fit=crop', lat: -8.8291, lng: 115.0849 }
        ],
        'VNM': [
          { name: 'Ha Long Bay', wiki: 'Ha_Long_Bay', description: 'Thousands of limestone karsts rising from emerald waters', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop', lat: 20.9101, lng: 107.1839 },
          { name: 'Hội An Ancient Town', wiki: 'Hoi_An', description: 'Atmospheric old town with lantern-lit streets', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop', lat: 15.8801, lng: 108.3380 },
          { name: 'Phong Nha Caves', wiki: 'Phong_Nha-Kẻ_Bàng_National_Park', description: 'Spectacular cave system and karst landscape', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=400&h=300&fit=crop', lat: 17.5899, lng: 106.2833 },
          { name: 'Cu Chi Tunnels', wiki: 'Củ_Chi_tunnels', description: 'Vast network of underground tunnels from the Vietnam War', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop', lat: 11.1418, lng: 106.4649 }
        ],
        'KHM': [
          { name: 'Angkor Wat', wiki: 'Angkor_Wat', description: 'World\'s largest religious monument', type: 'Temple', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1569242840510-9fe6f0112cee?w=400&h=300&fit=crop', lat: 13.4125, lng: 103.8670 },
          { name: 'Bayon Temple', wiki: 'Bayon', description: 'Ancient temple known for massive stone faces', type: 'Temple', icon: 'landmark', image: 'https://images.unsplash.com/photo-1600460378811-770b3e0a5a8d?w=400&h=300&fit=crop', lat: 13.4411, lng: 103.8590 },
          { name: 'Ta Prohm', wiki: 'Ta_Prohm', description: 'Temple ruins entwined by massive tree roots', type: 'Temple', icon: 'tree', image: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=400&h=300&fit=crop', lat: 13.4350, lng: 103.8891 },
          { name: 'Tonlé Sap', wiki: 'Tonlé_Sap', description: 'Largest freshwater lake in Southeast Asia', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1565018054866-968e244671af?w=400&h=300&fit=crop', lat: 12.8333, lng: 104.0833 }
        ],
        'ARE': [
          { name: 'Burj Khalifa', wiki: 'Burj_Khalifa', description: 'World\'s tallest building in Dubai at 828 meters', type: 'Landmark', icon: 'building', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop', lat: 25.1972, lng: 55.2744 },
          { name: 'Sheikh Zayed Mosque', wiki: 'Sheikh_Zayed_Grand_Mosque', description: 'Stunning white marble mosque in Abu Dhabi', type: 'Religious Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1585337610880-c61e63c66d90?w=400&h=300&fit=crop', lat: 24.4128, lng: 54.4750 },
          { name: 'Palm Jumeirah', wiki: 'Palm_Jumeirah', description: 'Artificial palm-shaped archipelago', type: 'Landmark', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=400&h=300&fit=crop', lat: 25.1124, lng: 55.1390 },
          { name: 'Dubai Mall', wiki: 'The_Dubai_Mall', description: 'World\'s largest shopping mall with an aquarium and ice rink', type: 'City', icon: 'store', image: 'https://images.unsplash.com/photo-1597659840241-37e2b7753e1c?w=400&h=300&fit=crop', lat: 25.1985, lng: 55.2796 }
        ],
        'SAU': [
          { name: 'Masjid al-Haram', wiki: 'Masjid_al-Haram', description: 'The holiest mosque in Islam surrounding the Kaaba', type: 'Religious Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1591604129938-7c0bfcbf4be8?w=400&h=300&fit=crop', lat: 21.4225, lng: 39.8262 },
          { name: 'Al-Ula', wiki: 'Al-Ula', description: 'Ancient oasis city with stunning rock formations', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1578894381163-c31bcb1adcfb?w=400&h=300&fit=crop', lat: 26.6174, lng: 37.9166 },
          { name: 'Edge of the World', wiki: 'Edge_of_the_World_(Saudi_Arabia)', description: 'Dramatic cliff overlooking an endless desert', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1586724237569-9c5b647e5c3b?w=400&h=300&fit=crop', lat: 24.8356, lng: 46.2147 },
          { name: 'Hegra', wiki: 'Hegra_(ancient_city)', description: 'Saudi Arabia\'s first UNESCO World Heritage Site', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1586724237569-9c5b647e5c3b?w=400&h=300&fit=crop', lat: 26.7750, lng: 37.9567 }
        ],
        'JOR': [
          { name: 'Petra', wiki: 'Petra', description: 'Ancient Nabataean city carved into rose-red cliffs', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1579606032821-4e6161c81571?w=400&h=300&fit=crop', lat: 30.3285, lng: 35.4444 },
          { name: 'Wadi Rum', wiki: 'Wadi_Rum', description: 'Dramatic desert landscape known as the Valley of the Moon', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1580745777072-45eb0e01e tried?w=400&h=300&fit=crop', lat: 29.5321, lng: 35.4113 },
          { name: 'Dead Sea', wiki: 'Dead_Sea', description: 'Saltwater lake at the lowest point on Earth', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop', lat: 31.5000, lng: 35.5000 },
          { name: 'Jerash', wiki: 'Jerash', description: 'Well-preserved ancient Roman city ruins', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1575309441097-651dc8aa014e?w=400&h=300&fit=crop', lat: 32.2747, lng: 35.8897 }
        ],
        'ISR': [
          { name: 'Western Wall', wiki: 'Western_Wall', description: 'Holiest prayer site in Judaism in Jerusalem', type: 'Religious Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=400&h=300&fit=crop', lat: 31.7767, lng: 35.2345 },
          { name: 'Masada', wiki: 'Masada', description: 'Ancient fortification on a rock plateau in the desert', type: 'Historic Site', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=300&fit=crop', lat: 31.3156, lng: 35.3536 },
          { name: 'Old City of Jerusalem', wiki: 'Old_City_(Jerusalem)', description: 'Walled area with sacred sites for three religions', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1553026023-92e52e8a1a9f?w=400&h=300&fit=crop', lat: 31.7781, lng: 35.2354 },
          { name: 'Baháʼí Gardens', wiki: 'Baháʼí_gardens_in_Haifa', description: 'Terraced gardens cascading down Mount Carmel', type: 'Park', icon: 'seedling', image: 'https://images.unsplash.com/photo-1590002750000-48c03b67fd18?w=400&h=300&fit=crop', lat: 32.8136, lng: 34.9869 }
        ],
        'KEN': [
          { name: 'Maasai Mara', wiki: 'Maasai_Mara', description: 'Famous game reserve for the Great Migration', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=300&fit=crop', lat: -1.5021, lng: 35.1440 },
          { name: 'Mount Kenya', wiki: 'Mount_Kenya', description: 'Africa\'s second-highest mountain', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop', lat: -0.1521, lng: 37.3084 },
          { name: 'Amboseli National Park', wiki: 'Amboseli_National_Park', description: 'Park with views of Kilimanjaro and elephant herds', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&h=300&fit=crop', lat: -2.6527, lng: 37.2606 },
          { name: 'Diani Beach', wiki: 'Diani_Beach', description: 'Pristine white sand beach on the Indian Ocean', type: 'Beach', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400&h=300&fit=crop', lat: -4.3477, lng: 39.5681 }
        ],
        'TZA': [
          { name: 'Mount Kilimanjaro', wiki: 'Mount_Kilimanjaro', description: 'Africa\'s highest mountain and tallest freestanding peak', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?w=400&h=300&fit=crop', lat: -3.0674, lng: 37.3556 },
          { name: 'Serengeti', wiki: 'Serengeti', description: 'Vast ecosystem famous for annual wildebeest migration', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop', lat: -2.3333, lng: 34.8333 },
          { name: 'Zanzibar', wiki: 'Zanzibar', description: 'Tropical island with turquoise waters and spice history', type: 'Island', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=300&fit=crop', lat: -6.1659, lng: 39.2026 },
          { name: 'Ngorongoro Crater', wiki: 'Ngorongoro_Conservation_Area', description: 'World\'s largest inactive volcanic caldera', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&h=300&fit=crop', lat: -3.2200, lng: 35.4500 }
        ],
        'CUB': [
          { name: 'Old Havana', wiki: 'Old_Havana', description: 'UNESCO-listed historic center with colonial architecture', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=400&h=300&fit=crop', lat: 23.1356, lng: -82.3590 },
          { name: 'Viñales Valley', wiki: 'Viñales_Valley', description: 'Stunning valley with limestone mogotes and tobacco fields', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1570299437522-544c499dafe1?w=400&h=300&fit=crop', lat: 22.6167, lng: -83.7167 },
          { name: 'Trinidad', wiki: 'Trinidad,_Cuba', description: 'Preserved colonial town with colorful cobblestone streets', type: 'City', icon: 'palette', image: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=400&h=300&fit=crop', lat: 21.8027, lng: -79.9838 },
          { name: 'El Malecón', wiki: 'Malecón,_Havana', description: 'Iconic 8km seafront promenade in Havana', type: 'Landmark', icon: 'water', image: 'https://images.unsplash.com/photo-1571102591458-47fa5ca43eb5?w=400&h=300&fit=crop', lat: 23.1467, lng: -82.3631 }
        ],
        'COL': [
          { name: 'Cartagena Old Town', wiki: 'Cartagena,_Colombia', description: 'Colonial walled city with colorful buildings', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1578193673720-e07e78fc1d62?w=400&h=300&fit=crop', lat: 10.3910, lng: -75.5144 },
          { name: 'Cocora Valley', wiki: 'Cocora_Valley', description: 'Cloud forest valley with towering wax palm trees', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1583531172005-814bfb3ada8e?w=400&h=300&fit=crop', lat: 4.6381, lng: -75.4893 },
          { name: 'Tatacoa Desert', wiki: 'Tatacoa_Desert', description: 'Arid zone perfect for stargazing', type: 'Nature', icon: 'sun', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&h=300&fit=crop', lat: 3.2267, lng: -75.1714 },
          { name: 'Caño Cristales', wiki: 'Caño_Cristales', description: 'River of five colors, the most beautiful river in the world', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=400&h=300&fit=crop', lat: 2.1833, lng: -73.7833 }
        ],
        'CHL': [
          { name: 'Easter Island', wiki: 'Easter_Island', description: 'Remote island with mysterious moai statues', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1589307357542-4c05c6e7cff4?w=400&h=300&fit=crop', lat: -27.1127, lng: -109.3497 },
          { name: 'Torres del Paine', wiki: 'Torres_del_Paine_National_Park', description: 'Spectacular national park in Patagonia', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&h=300&fit=crop', lat: -51.0000, lng: -73.0000 },
          { name: 'Atacama Desert', wiki: 'Atacama_Desert', description: 'Driest non-polar desert with lunar landscapes', type: 'Nature', icon: 'sun', image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=300&fit=crop', lat: -24.5000, lng: -69.2500 },
          { name: 'Valparaíso', wiki: 'Valparaíso', description: 'Bohemian port city with colorful hillside houses', type: 'City', icon: 'palette', image: 'https://images.unsplash.com/photo-1551029506-0807df4e2031?w=400&h=300&fit=crop', lat: -33.0458, lng: -71.6197 }
        ],
        'NPL': [
          { name: 'Mount Everest', wiki: 'Mount_Everest', description: 'Earth\'s highest peak at 8,849 meters', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=400&h=300&fit=crop', lat: 27.9881, lng: 86.9250 },
          { name: 'Boudhanath Stupa', wiki: 'Boudhanath', description: 'One of the largest spherical stupas in Nepal', type: 'Temple', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=400&h=300&fit=crop', lat: 27.7215, lng: 85.3620 },
          { name: 'Lumbini', wiki: 'Lumbini', description: 'Birthplace of Gautama Buddha, UNESCO site', type: 'Religious Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1629294771662-cba2be0a5e6f?w=400&h=300&fit=crop', lat: 27.4683, lng: 83.2763 },
          { name: 'Chitwan National Park', wiki: 'Chitwan_National_Park', description: 'Subtropical park with rhinos, tigers, and elephants', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop', lat: 27.5000, lng: 84.3333 }
        ],
        'LKA': [
          { name: 'Sigiriya', wiki: 'Sigiriya', description: 'Ancient rock fortress and UNESCO World Heritage Site', type: 'Historic Site', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1586613835864-575e06037efb?w=400&h=300&fit=crop', lat: 7.9570, lng: 80.7603 },
          { name: 'Temple of the Tooth', wiki: 'Temple_of_the_Tooth', description: 'Sacred Buddhist temple in Kandy', type: 'Temple', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1580975120590-1bee0ded9b82?w=400&h=300&fit=crop', lat: 7.2936, lng: 80.6413 },
          { name: 'Yala National Park', wiki: 'Yala_National_Park', description: 'Renowned for its leopard population and wildlife', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1614593641480-a924d3a3a1b5?w=400&h=300&fit=crop', lat: 6.3742, lng: 81.5214 },
          { name: 'Galle Fort', wiki: 'Galle_Fort', description: 'Historic Dutch colonial fortification', type: 'Fort', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1588612625675-6568d68d5a9c?w=400&h=300&fit=crop', lat: 6.0282, lng: 80.2170 }
        ],
        'MYS': [
          { name: 'Petronas Towers', wiki: 'Petronas_Towers', description: 'Iconic twin skyscrapers in Kuala Lumpur', type: 'Landmark', icon: 'building', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop', lat: 3.1578, lng: 101.7117 },
          { name: 'Batu Caves', wiki: 'Batu_Caves', description: 'Hindu temple complex in limestone caves', type: 'Temple', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop', lat: 3.2379, lng: 101.6840 },
          { name: 'George Town', wiki: 'George_Town,_Penang', description: 'UNESCO-listed city with diverse cultural heritage', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=400&h=300&fit=crop', lat: 5.4141, lng: 100.3288 },
          { name: 'Langkawi', wiki: 'Langkawi', description: 'Archipelago of 99 islands with beaches and rainforests', type: 'Nature', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1559628233-100c798642d4?w=400&h=300&fit=crop', lat: 6.3500, lng: 99.8000 }
        ],
        'SGP': [
          { name: 'Marina Bay Sands', wiki: 'Marina_Bay_Sands', description: 'Iconic integrated resort with infinity pool', type: 'Landmark', icon: 'building', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=300&fit=crop', lat: 1.2834, lng: 103.8607 },
          { name: 'Gardens by the Bay', wiki: 'Gardens_by_the_Bay', description: 'Futuristic park with the iconic Supertree Grove', type: 'Park', icon: 'tree', image: 'https://images.unsplash.com/photo-1506351421178-63b52a2d2668?w=400&h=300&fit=crop', lat: 1.2816, lng: 103.8636 },
          { name: 'Sentosa Island', wiki: 'Sentosa', description: 'Resort island with beaches, theme parks, and casinos', type: 'Island', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=400&h=300&fit=crop', lat: 1.2494, lng: 103.8303 },
          { name: 'Merlion Park', wiki: 'Merlion', description: 'National icon of Singapore spouting water', type: 'Landmark', icon: 'monument', image: 'https://images.unsplash.com/photo-1496939376851-89342e90adcd?w=400&h=300&fit=crop', lat: 1.2868, lng: 103.8545 }
        ],
        'PHL': [
          { name: 'Chocolate Hills', wiki: 'Chocolate_Hills', description: 'Over 1,000 perfectly cone-shaped hills in Bohol', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=400&h=300&fit=crop', lat: 9.7964, lng: 124.1681 },
          { name: 'El Nido', wiki: 'El_Nido', description: 'Stunning lagoons and limestone cliffs in Palawan', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=400&h=300&fit=crop', lat: 11.1784, lng: 119.3897 },
          { name: 'Boracay', wiki: 'Boracay', description: 'World-famous island with White Beach', type: 'Beach', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=400&h=300&fit=crop', lat: 11.9674, lng: 121.9248 },
          { name: 'Banaue Rice Terraces', wiki: 'Banaue_Rice_Terraces', description: '2,000-year-old carved terraces called eighth wonder of world', type: 'Historic Site', icon: 'seedling', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop', lat: 16.9175, lng: 121.0531 }
        ],
        'MMR': [
          { name: 'Bagan', wiki: 'Bagan', description: 'Ancient city with over 2,000 Buddhist temples', type: 'Historic Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1540611025311-01df3cee54b5?w=400&h=300&fit=crop', lat: 21.1717, lng: 94.8585 },
          { name: 'Shwedagon Pagoda', wiki: 'Shwedagon_Pagoda', description: 'Gilded stupa and the most sacred Buddhist pagoda', type: 'Temple', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop', lat: 16.8710, lng: 96.1497 },
          { name: 'Inle Lake', wiki: 'Inle_Lake', description: 'Scenic freshwater lake with floating gardens', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1570789210967-2cac24ee7f3f?w=400&h=300&fit=crop', lat: 20.5833, lng: 96.9167 },
          { name: 'Mandalay Palace', wiki: 'Mandalay_Palace', description: 'Last royal palace of the Burmese monarchy', type: 'Palace', icon: 'crown', image: 'https://images.unsplash.com/photo-1540611025311-01df3cee54b5?w=400&h=300&fit=crop', lat: 21.9580, lng: 96.0900 }
        ],
        'POL': [
          { name: 'Wawel Castle', wiki: 'Wawel_Castle', description: 'Historic royal castle in Kraków', type: 'Castle', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 50.0540, lng: 19.9352 },
          { name: 'Auschwitz-Birkenau', wiki: 'Auschwitz_concentration_camp', description: 'WWII memorial and museum, UNESCO World Heritage', type: 'Memorial', icon: 'monument', image: 'https://images.unsplash.com/photo-1587895835255-ef4c2b37b367?w=400&h=300&fit=crop', lat: 50.0343, lng: 19.1752 },
          { name: 'Wieliczka Salt Mine', wiki: 'Wieliczka_Salt_Mine', description: 'Underground salt mine with chapels and sculptures', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=400&h=300&fit=crop', lat: 49.9836, lng: 20.0550 },
          { name: 'Gdańsk Old Town', wiki: 'Gdańsk', description: 'Colorful port city with stunning Gothic architecture', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1587825140708-dfaf18c09076?w=400&h=300&fit=crop', lat: 54.3520, lng: 18.6466 }
        ],
        'CZE': [
          { name: 'Charles Bridge', wiki: 'Charles_Bridge', description: 'Medieval stone bridge spanning the Vltava River', type: 'Landmark', icon: 'bridge', image: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=400&h=300&fit=crop', lat: 50.0865, lng: 14.4114 },
          { name: 'Prague Castle', wiki: 'Prague_Castle', description: 'Largest ancient castle complex in the world', type: 'Castle', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&h=300&fit=crop', lat: 50.0909, lng: 14.4013 },
          { name: 'Old Town Square', wiki: 'Old_Town_Square_(Prague)', description: 'Historic square with the Astronomical Clock', type: 'City', icon: 'clock', image: 'https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=400&h=300&fit=crop', lat: 50.0870, lng: 14.4213 },
          { name: 'Český Krumlov', wiki: 'Český_Krumlov', description: 'Medieval town with a magnificent castle complex', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1560218739-8b70be53ae1c?w=400&h=300&fit=crop', lat: 48.8127, lng: 14.3175 }
        ],
        'HUN': [
          { name: 'Hungarian Parliament', wiki: 'Hungarian_Parliament_Building', description: 'Spectacular Gothic Revival building on the Danube', type: 'Landmark', icon: 'landmark', image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&h=300&fit=crop', lat: 47.5073, lng: 19.0458 },
          { name: 'Fisherman\'s Bastion', wiki: 'Fisherman%27s_Bastion', description: 'Neo-Romanesque terrace with panoramic views', type: 'Landmark', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=400&h=300&fit=crop', lat: 47.5022, lng: 19.0344 },
          { name: 'Széchenyi Thermal Bath', wiki: 'Széchenyi_thermal_bath', description: 'Largest medicinal bath in Europe', type: 'Landmark', icon: 'hot-tub-person', image: 'https://images.unsplash.com/photo-1600623047481-57e6e702cb47?w=400&h=300&fit=crop', lat: 47.5184, lng: 19.0821 },
          { name: 'Buda Castle', wiki: 'Buda_Castle', description: 'Historical castle and palace complex of Hungarian kings', type: 'Castle', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1521291916038-a6e1cfac2463?w=400&h=300&fit=crop', lat: 47.4960, lng: 19.0397 }
        ],
        'HRV': [
          { name: 'Dubrovnik Old Town', wiki: 'Dubrovnik', description: 'Walled city known as the Pearl of the Adriatic', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 42.6507, lng: 18.0944 },
          { name: 'Plitvice Lakes', wiki: 'Plitvice_Lakes_National_Park', description: 'UNESCO park with cascading turquoise lakes', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400&h=300&fit=crop', lat: 44.8654, lng: 15.5820 },
          { name: 'Diocletian\'s Palace', wiki: 'Diocletian%27s_Palace', description: 'Ancient Roman palace in Split', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 43.5081, lng: 16.4402 },
          { name: 'Hvar Island', wiki: 'Hvar', description: 'Glamorous island with lavender fields and nightlife', type: 'Island', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=400&h=300&fit=crop', lat: 43.1729, lng: 16.4412 }
        ],
        'DNK': [
          { name: 'Tivoli Gardens', wiki: 'Tivoli_Gardens', description: 'Historic amusement park and pleasure garden', type: 'Park', icon: 'tree', image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=400&h=300&fit=crop', lat: 55.6737, lng: 12.5681 },
          { name: 'The Little Mermaid', wiki: 'The_Little_Mermaid_(statue)', description: 'Famous bronze statue in Copenhagen harbour', type: 'Monument', icon: 'monument', image: 'https://images.unsplash.com/photo-1552560880-2482680b42bf?w=400&h=300&fit=crop', lat: 55.6929, lng: 12.5994 },
          { name: 'Nyhavn', wiki: 'Nyhavn', description: 'Colorful 17th-century waterfront with restaurants', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=400&h=300&fit=crop', lat: 55.6798, lng: 12.5913 },
          { name: 'Kronborg Castle', wiki: 'Kronborg', description: 'Renaissance castle and setting of Shakespeare\'s Hamlet', type: 'Castle', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1559291001-693fb9166cba?w=400&h=300&fit=crop', lat: 56.0389, lng: 12.6217 }
        ],
        'FIN': [
          { name: 'Santa Claus Village', wiki: 'Santa_Claus_Village', description: 'Famous Christmas-themed amusement park in Rovaniemi', type: 'Landmark', icon: 'snowflake', image: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&h=300&fit=crop', lat: 66.5436, lng: 25.8473 },
          { name: 'Suomenlinna', wiki: 'Suomenlinna', description: 'UNESCO-listed sea fortress spanning six islands', type: 'Fort', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=400&h=300&fit=crop', lat: 60.1454, lng: 24.9881 },
          { name: 'Northern Lights in Lapland', wiki: 'Aurora_borealis', description: 'Best location to see the aurora borealis', type: 'Nature', icon: 'star', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop', lat: 68.4194, lng: 27.4131 },
          { name: 'Helsinki Cathedral', wiki: 'Helsinki_Cathedral', description: 'Iconic white neoclassical cathedral', type: 'Church', icon: 'church', image: 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=400&h=300&fit=crop', lat: 60.1695, lng: 24.9526 }
        ],
        'IRL': [
          { name: 'Cliffs of Moher', wiki: 'Cliffs_of_Moher', description: 'Dramatic sea cliffs on the western coast', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1564959130747-897fb406b9c5?w=400&h=300&fit=crop', lat: 52.9715, lng: -9.4309 },
          { name: 'Ring of Kerry', wiki: 'Ring_of_Kerry', description: 'Scenic driving route with mountains and coastline', type: 'Nature', icon: 'route', image: 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=400&h=300&fit=crop', lat: 51.7500, lng: -10.0000 },
          { name: 'Trinity College Library', wiki: 'Trinity_College_Library,_Dublin', description: 'Historic library housing the Book of Kells', type: 'Museum', icon: 'book', image: 'https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?w=400&h=300&fit=crop', lat: 53.3440, lng: -6.2544 },
          { name: 'Giant\'s Causeway', wiki: 'Giant%27s_Causeway', description: 'Natural wonder of 40,000 interlocking basalt columns', type: 'Nature', icon: 'monument', image: 'https://images.unsplash.com/photo-1533154683220-da1808a997e8?w=400&h=300&fit=crop', lat: 55.2408, lng: -6.5116 }
        ],
        'SCO': [],
        'PAK': [
          { name: 'Badshahi Mosque', wiki: 'Badshahi_Mosque', description: 'Iconic Mughal-era mosque in Lahore', type: 'Religious Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop', lat: 31.5882, lng: 74.3106 },
          { name: 'Hunza Valley', wiki: 'Hunza_Valley', description: 'Breathtaking mountain valley in Gilgit-Baltistan', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=400&h=300&fit=crop', lat: 36.3167, lng: 74.6500 },
          { name: 'Mohenjo-daro', wiki: 'Mohenjo-daro', description: 'Ancient Indus Valley Civilization archaeological site', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1575134247406-fd6ccbaee09b?w=400&h=300&fit=crop', lat: 27.3290, lng: 68.1389 },
          { name: 'Lahore Fort', wiki: 'Lahore_Fort', description: 'Citadel of the city of Lahore with Mughal architecture', type: 'Fort', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1575134247406-fd6ccbaee09b?w=400&h=300&fit=crop', lat: 31.5880, lng: 74.3153 }
        ],
        'BGD': [
          { name: 'Sundarbans', wiki: 'Sundarbans', description: 'Largest mangrove forest and home of Bengal tigers', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop', lat: 21.9497, lng: 89.1833 },
          { name: 'Lalbagh Fort', wiki: 'Lalbagh_Fort', description: '17th-century Mughal fort complex in Dhaka', type: 'Fort', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1575134247406-fd6ccbaee09b?w=400&h=300&fit=crop', lat: 23.7194, lng: 90.3889 },
          { name: 'Cox\'s Bazar', wiki: 'Cox%27s_Bazar', description: 'World\'s longest natural sea beach at 120km', type: 'Beach', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400&h=300&fit=crop', lat: 21.4272, lng: 92.0058 },
          { name: 'Sixty Dome Mosque', wiki: 'Sixty_Dome_Mosque', description: 'UNESCO World Heritage mosque in Bagerhat', type: 'Religious Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1591604129938-7c0bfcbf4be8?w=400&h=300&fit=crop', lat: 22.6736, lng: 89.7486 }
        ],
        'ETH': [
          { name: 'Rock-Hewn Churches of Lalibela', wiki: 'Rock-Hewn_Churches,_Lalibela', description: 'Monolithic churches carved from solid rock', type: 'Religious Site', icon: 'church', image: 'https://images.unsplash.com/photo-1568636505933-1e1c5f5ad1b4?w=400&h=300&fit=crop', lat: 12.0319, lng: 39.0472 },
          { name: 'Simien Mountains', wiki: 'Simien_Mountains', description: 'Dramatic landscapes and endemic wildlife', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop', lat: 13.2500, lng: 38.4167 },
          { name: 'Danakil Depression', wiki: 'Danakil_Depression', description: 'One of the hottest and lowest places on Earth', type: 'Nature', icon: 'sun', image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=300&fit=crop', lat: 14.2417, lng: 40.3000 },
          { name: 'Axum Obelisks', wiki: 'Obelisk_of_Axum', description: 'Ancient carved stone pillars from the Kingdom of Axum', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1568636505933-1e1c5f5ad1b4?w=400&h=300&fit=crop', lat: 14.1310, lng: 38.7188 }
        ],
        'NGA': [
          { name: 'Zuma Rock', wiki: 'Zuma_Rock', description: 'Massive monolith near Nigeria\'s capital Abuja', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=300&fit=crop', lat: 9.1147, lng: 7.2286 },
          { name: 'Yankari National Park', wiki: 'Yankari_National_Park', description: 'Largest national park with elephants and warm springs', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop', lat: 9.7500, lng: 10.5000 },
          { name: 'Olumo Rock', wiki: 'Olumo_Rock', description: 'Ancient fortress and tourist attraction in Abeokuta', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=300&fit=crop', lat: 7.1000, lng: 3.3500 },
          { name: 'Lekki Conservation Centre', wiki: 'Lekki_Conservation_Centre', description: 'Nature reserve with Africa\'s longest canopy walkway', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop', lat: 6.4421, lng: 3.5355 }
        ],
        'GHA': [
          { name: 'Cape Coast Castle', wiki: 'Cape_Coast_Castle', description: 'Historic castle and UNESCO World Heritage Site', type: 'Historic Site', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=300&fit=crop', lat: 5.1053, lng: -1.2411 },
          { name: 'Kakum National Park', wiki: 'Kakum_National_Park', description: 'Tropical rainforest with a canopy walkway', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop', lat: 5.3500, lng: -1.3833 },
          { name: 'Mole National Park', wiki: 'Mole_National_Park', description: 'Ghana\'s largest wildlife refuge with elephants', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=300&fit=crop', lat: 9.2500, lng: -1.8500 },
          { name: 'Kwame Nkrumah Memorial', wiki: 'Kwame_Nkrumah_Memorial_Park', description: 'Monument to Ghana\'s founding father', type: 'Memorial', icon: 'monument', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=300&fit=crop', lat: 5.5500, lng: -0.2000 }
        ],
        'TUN': [
          { name: 'Carthage', wiki: 'Carthage', description: 'Ruins of the ancient Phoenician city', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1590076083625-7709e5f81e1e?w=400&h=300&fit=crop', lat: 36.8586, lng: 10.3300 },
          { name: 'Medina of Tunis', wiki: 'Medina_of_Tunis', description: 'UNESCO-listed old town with traditional architecture', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&h=300&fit=crop', lat: 36.7986, lng: 10.1706 },
          { name: 'Sidi Bou Said', wiki: 'Sidi_Bou_Said', description: 'Charming blue and white cliff-top village', type: 'City', icon: 'palette', image: 'https://images.unsplash.com/photo-1553244390-e08c9be70ffd?w=400&h=300&fit=crop', lat: 36.8687, lng: 10.3474 },
          { name: 'El Jem Amphitheatre', wiki: 'Amphitheatre_of_El_Jem', description: 'Largest Roman amphitheatre in North Africa', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1590076083625-7709e5f81e1e?w=400&h=300&fit=crop', lat: 35.2959, lng: 10.7070 }
        ],
        'ROM': [
          { name: 'Bran Castle', wiki: 'Bran_Castle', description: 'Gothic castle linked to the Dracula legend', type: 'Castle', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 45.5147, lng: 25.3672 },
          { name: 'Palace of Parliament', wiki: 'Palace_of_the_Parliament', description: 'World\'s heaviest building in Bucharest', type: 'Landmark', icon: 'landmark', image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&h=300&fit=crop', lat: 44.4275, lng: 26.0871 },
          { name: 'Painted Monasteries', wiki: 'Churches_of_Moldavia', description: 'UNESCO-listed monasteries with vivid frescoes', type: 'Religious Site', icon: 'church', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 47.5167, lng: 25.7000 },
          { name: 'Transfăgărășan Highway', wiki: 'Transfăgărășan', description: 'Spectacular mountain road through the Carpathians', type: 'Nature', icon: 'road', image: 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=400&h=300&fit=crop', lat: 45.6000, lng: 24.6000 }
        ],
        'ROU': [
          { name: 'Bran Castle', wiki: 'Bran_Castle', description: 'Gothic castle linked to Dracula legend', type: 'Castle', icon: 'chess-rook', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 45.5147, lng: 25.3672 },
          { name: 'Palace of Parliament', wiki: 'Palace_of_the_Parliament', description: 'World\'s heaviest building in Bucharest', type: 'Landmark', icon: 'landmark', image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&h=300&fit=crop', lat: 44.4275, lng: 26.0871 },
          { name: 'Transfăgărășan Road', wiki: 'Transfăgărășan', description: 'Spectacular mountain road through the Carpathians', type: 'Nature', icon: 'road', image: 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=400&h=300&fit=crop', lat: 45.6000, lng: 24.6000 },
          { name: 'Painted Monasteries', wiki: 'Churches_of_Moldavia', description: 'Unique exteriorly painted churches in Moldavia', type: 'Religious Site', icon: 'church', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 47.5167, lng: 25.7000 }
        ],
        'BGR': [
          { name: 'Rila Monastery', wiki: 'Rila_Monastery', description: 'Largest Eastern Orthodox monastery in Bulgaria', type: 'Religious Site', icon: 'church', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 42.1333, lng: 23.3403 },
          { name: 'Alexander Nevsky Cathedral', wiki: 'Alexander_Nevsky_Cathedral,_Sofia', description: 'Neo-Byzantine cathedral in Sofia', type: 'Church', icon: 'church', image: 'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=400&h=300&fit=crop', lat: 42.6966, lng: 23.3328 },
          { name: 'Old Town Plovdiv', wiki: 'Old_Plovdiv', description: 'One of the oldest continuously inhabited cities', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 42.1478, lng: 24.7501 },
          { name: 'Belogradchik Fortress', wiki: 'Belogradchik_Fortress', description: 'Ancient fortress amid dramatic rock formations', type: 'Fort', icon: 'fort-awesome', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 43.6256, lng: 22.6836 }
        ],
        'ECU': [
          { name: 'Galápagos Islands', wiki: 'Galápagos_Islands', description: 'UNESCO site with unique wildlife that inspired Darwin', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop', lat: -0.9538, lng: -90.9656 },
          { name: 'Quito Old Town', wiki: 'Historic_Center_of_Quito', description: 'UNESCO-listed colonial center with baroque churches', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=300&fit=crop', lat: -0.2200, lng: -78.5125 },
          { name: 'Cotopaxi Volcano', wiki: 'Cotopaxi', description: 'One of the highest active volcanoes in the world', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=300&fit=crop', lat: -0.6838, lng: -78.4374 },
          { name: 'Amazon Rainforest', wiki: 'Amazon_rainforest', description: 'Breathtaking biodiversity in the Ecuadorian Amazon', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop', lat: -1.0000, lng: -77.0000 }
        ],
        'CRI': [
          { name: 'Arenal Volcano', wiki: 'Arenal_Volcano', description: 'Active stratovolcano with stunning profile', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop', lat: 10.4626, lng: -84.7032 },
          { name: 'Manuel Antonio', wiki: 'Manuel_Antonio_National_Park', description: 'National park with beaches, rainforest, and wildlife', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop', lat: 9.3928, lng: -84.1369 },
          { name: 'Monteverde Cloud Forest', wiki: 'Monteverde_Cloud_Forest_Reserve', description: 'Misty tropical cloud forest teeming with biodiversity', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop', lat: 10.3000, lng: -84.8000 },
          { name: 'Tortuguero National Park', wiki: 'Tortuguero_National_Park', description: 'Nesting grounds for green sea turtles', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop', lat: 10.5431, lng: -83.5028 }
        ],
        'GTM': [
          { name: 'Tikal', wiki: 'Tikal', description: 'Ancient Mayan city with towering temples in the jungle', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&h=300&fit=crop', lat: 17.2220, lng: -89.6237 },
          { name: 'Antigua Guatemala', wiki: 'Antigua_Guatemala', description: 'Colonial city surrounded by volcanoes', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=300&fit=crop', lat: 14.5586, lng: -90.7295 },
          { name: 'Lake Atitlán', wiki: 'Lake_Atitlán', description: 'Stunning volcanic lake surrounded by Mayan villages', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=300&fit=crop', lat: 14.6873, lng: -91.1840 },
          { name: 'Semuc Champey', wiki: 'Semuc_Champey', description: 'Natural limestone bridge with turquoise pools', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400&h=300&fit=crop', lat: 15.5283, lng: -89.9553 }
        ],
        'JAM': [
          { name: 'Dunn\'s River Falls', wiki: 'Dunn%27s_River_Falls', description: 'Famous tiered waterfall climbing experience', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400&h=300&fit=crop', lat: 18.4062, lng: -77.1319 },
          { name: 'Blue Mountains', wiki: 'Blue_Mountains_(Jamaica)', description: 'Mountain range famous for its coffee and hiking', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop', lat: 18.1824, lng: -76.5784 },
          { name: 'Bob Marley Museum', wiki: 'Bob_Marley_Museum', description: 'Former home of the reggae legend in Kingston', type: 'Museum', icon: 'music', image: 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=400&h=300&fit=crop', lat: 18.0128, lng: -76.7835 },
          { name: 'Seven Mile Beach', wiki: 'Seven_Mile_Beach_(Jamaica)', description: 'Iconic stretch of white sand in Negril', type: 'Beach', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400&h=300&fit=crop', lat: 18.2892, lng: -78.3500 }
        ],
        'MDV': [
          { name: 'Male Atoll', wiki: 'Malé_Atoll', description: 'Colourful capital with mosques and markets', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop', lat: 4.1755, lng: 73.5093 },
          { name: 'Vaadhoo Island', wiki: 'Vaadhoo_(Raa_Atoll)', description: 'Famous for bioluminescent glowing beach', type: 'Nature', icon: 'star', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop', lat: 5.7167, lng: 73.0167 },
          { name: 'Maafushi Island', wiki: 'Maafushi', description: 'Popular local island for budget travellers', type: 'Beach', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop', lat: 3.9425, lng: 73.4897 },
          { name: 'Banana Reef', wiki: 'Banana_Reef', description: 'One of the most famous dive sites in the Maldives', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop', lat: 4.2833, lng: 73.5333 }
        ],
        'MUS': [
          { name: 'Le Morne Brabant', wiki: 'Le_Morne_Brabant', description: 'UNESCO World Heritage basalt monolith', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=300&fit=crop', lat: -20.4489, lng: 57.3189 },
          { name: 'Chamarel Coloured Earth', wiki: 'Seven_Coloured_Earths', description: 'Geological formation of sand dunes in seven colours', type: 'Nature', icon: 'palette', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&h=300&fit=crop', lat: -20.4339, lng: 57.3812 },
          { name: 'Black River Gorges', wiki: 'Black_River_Gorges_National_Park', description: 'National park with rare plants and bird species', type: 'Nature', icon: 'tree', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop', lat: -20.4250, lng: 57.4000 },
          { name: 'Île aux Cerfs', wiki: 'Île_aux_Cerfs', description: 'Beautiful island with white sandy beaches', type: 'Beach', icon: 'umbrella-beach', image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop', lat: -20.2700, lng: 57.8000 }
        ],
        'TWN': [
          { name: 'Taipei 101', wiki: 'Taipei_101', description: 'Iconic supertall skyscraper in Taipei', type: 'Landmark', icon: 'building', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop', lat: 25.0340, lng: 121.5645 },
          { name: 'Taroko Gorge', wiki: 'Taroko_National_Park', description: 'Marble-walled gorge in a stunning national park', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=400&h=300&fit=crop', lat: 24.1579, lng: 121.5006 },
          { name: 'Sun Moon Lake', wiki: 'Sun_Moon_Lake', description: 'Largest body of water in Taiwan surrounded by mountains', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=400&h=300&fit=crop', lat: 23.8530, lng: 120.9163 },
          { name: 'Jiufen Old Street', wiki: 'Jiufen', description: 'Historic mining town that inspired Spirited Away', type: 'City', icon: 'store', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop', lat: 25.1099, lng: 121.8450 }
        ],
        'QAT': [
          { name: 'Museum of Islamic Art', wiki: 'Museum_of_Islamic_Art,_Doha', description: 'Iconic waterfront museum designed by I.M. Pei', type: 'Museum', icon: 'university', image: 'https://images.unsplash.com/photo-1597659840241-37e2b7753e1c?w=400&h=300&fit=crop', lat: 25.2959, lng: 51.5396 },
          { name: 'Souq Waqif', wiki: 'Souq_Waqif', description: 'Traditional marketplace with authentic Qatari culture', type: 'City', icon: 'store', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&h=300&fit=crop', lat: 25.2874, lng: 51.5328 },
          { name: 'The Pearl-Qatar', wiki: 'The_Pearl-Qatar', description: 'Artificial island with luxury shops and restaurants', type: 'Landmark', icon: 'gem', image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=400&h=300&fit=crop', lat: 25.3684, lng: 51.5516 },
          { name: 'Khor Al Adaid', wiki: 'Khor_Al_Adaid', description: 'Inland sea surrounded by sand dunes', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=300&fit=crop', lat: 24.6167, lng: 51.3333 }
        ],
        'OMN': [
          { name: 'Sultan Qaboos Grand Mosque', wiki: 'Sultan_Qaboos_Grand_Mosque', description: 'Magnificent mosque in Muscat', type: 'Religious Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1591604129938-7c0bfcbf4be8?w=400&h=300&fit=crop', lat: 23.5873, lng: 58.0936 },
          { name: 'Wahiba Sands', wiki: 'Wahiba_Sands', description: 'Vast desert with towering sand dunes', type: 'Nature', icon: 'sun', image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=300&fit=crop', lat: 22.0000, lng: 58.2500 },
          { name: 'Wadi Shab', wiki: 'Wadi_Shab', description: 'Scenic canyon with turquoise pools and waterfalls', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400&h=300&fit=crop', lat: 23.0567, lng: 59.2333 },
          { name: 'Jebel Akhdar', wiki: 'Jebel_Akhdar', description: 'Green Mountain with terraced villages and rose gardens', type: 'Nature', icon: 'mountain', image: 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=400&h=300&fit=crop', lat: 23.2333, lng: 57.6667 }
        ],
        'UKR': [
          { name: 'St. Sophia Cathedral', wiki: 'Saint_Sophia_Cathedral,_Kyiv', description: '11th-century cathedral and UNESCO World Heritage site', type: 'Church', icon: 'church', image: 'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=400&h=300&fit=crop', lat: 50.4530, lng: 30.5144 },
          { name: 'Kyiv Pechersk Lavra', wiki: 'Kyiv_Pechersk_Lavra', description: 'Historic Orthodox Christian monastery', type: 'Religious Site', icon: 'place-of-worship', image: 'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=400&h=300&fit=crop', lat: 50.4346, lng: 30.5573 },
          { name: 'Chernobyl Exclusion Zone', wiki: 'Chernobyl_Exclusion_Zone', description: 'Site of the 1986 nuclear disaster, now open for tours', type: 'Historic Site', icon: 'radiation', image: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=400&h=300&fit=crop', lat: 51.2763, lng: 30.2219 },
          { name: 'Lviv Old Town', wiki: 'Lviv', description: 'UNESCO-listed city center with diverse architecture', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=400&h=300&fit=crop', lat: 49.8397, lng: 24.0297 }
        ],
        'GEO': [
          { name: 'Tbilisi Old Town', wiki: 'Tbilisi', description: 'Charming old town with sulfur baths and cobbled streets', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&h=300&fit=crop', lat: 41.6934, lng: 44.8015 },
          { name: 'Gergeti Trinity Church', wiki: 'Gergeti_Trinity_Church', description: '14th-century church with views of Mount Kazbek', type: 'Church', icon: 'church', image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&h=300&fit=crop', lat: 42.6618, lng: 44.6195 },
          { name: 'Vardzia', wiki: 'Vardzia', description: 'Cave monastery complex from the 12th century', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&h=300&fit=crop', lat: 41.3811, lng: 43.2833 },
          { name: 'Batumi Boulevard', wiki: 'Batumi_Boulevard', description: 'Beautiful seaside promenade on the Black Sea', type: 'City', icon: 'water', image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&h=300&fit=crop', lat: 41.6528, lng: 41.6344 }
        ],
        'ARM': [
          { name: 'Garni Temple', wiki: 'Temple_of_Garni', description: 'Hellenistic pagan temple from the 1st century', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1590076083625-7709e5f81e1e?w=400&h=300&fit=crop', lat: 40.1132, lng: 44.7306 },
          { name: 'Geghard Monastery', wiki: 'Geghard', description: 'UNESCO-listed medieval monastery carved from rock', type: 'Religious Site', icon: 'church', image: 'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=400&h=300&fit=crop', lat: 40.1403, lng: 44.8178 },
          { name: 'Lake Sevan', wiki: 'Lake_Sevan', description: 'Largest lake in the Caucasus with monastery on peninsula', type: 'Nature', icon: 'water', image: 'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=400&h=300&fit=crop', lat: 40.3000, lng: 45.3500 },
          { name: 'Tatev Monastery', wiki: 'Tatev_monastery', description: '9th-century monastery accessible by long aerial tramway', type: 'Religious Site', icon: 'church', image: 'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=400&h=300&fit=crop', lat: 39.3806, lng: 46.2506 }
        ],
        'UZB': [
          { name: 'Registan Square', wiki: 'Registan', description: 'Stunning ensemble of three madrasahs in Samarkand', type: 'Historic Site', icon: 'landmark', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop', lat: 39.6542, lng: 66.9759 },
          { name: 'Shah-i-Zinda', wiki: 'Shah-i-Zinda', description: 'Avenue of mausoleums with stunning tilework', type: 'Historic Site', icon: 'monument', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop', lat: 39.6625, lng: 66.9889 },
          { name: 'Bukhara Old City', wiki: 'Bukhara', description: 'Ancient city on the Silk Road with madrasahs and minarets', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop', lat: 39.7746, lng: 64.4226 },
          { name: 'Khiva', wiki: 'Khiva', description: 'Well-preserved UNESCO Silk Road city', type: 'City', icon: 'city', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop', lat: 41.3784, lng: 60.3598 }
        ]
      };
      
      return placesDatabase[country.cca3] || null;
    },

    populatePassportDropdown() {
      const select = document.getElementById('passportCountry');
      
      if (!select) {
        console.warn('Passport dropdown not found');
        return;
      }

      if (this.countries.length === 0) {
        console.warn('No countries loaded yet');
        return;
      }

      const sortedCountries = [...this.countries].sort((a, b) => 
        a.name.common.localeCompare(b.name.common)
      );

      select.innerHTML = '<option value="">Select your passport country</option>' +
        sortedCountries.map(country => `
          <option value="${country.cca3}">${country.name.common}</option>
        `).join('');
        
      console.log('Passport dropdown populated with', sortedCountries.length, 'countries');
    },

    checkVisa() {
      const passportCode = document.getElementById('passportCountry')?.value;
      const resultDiv = document.getElementById('visaResult');
      
      if (!passportCode) {
        if (typeof showToast === 'function') {
          showToast('Please select your passport country', 'warning');
        }
        return;
      }
      
      if (!this.currentCountry) {
        if (typeof showToast === 'function') {
          showToast('Please select a destination country first', 'warning');
        }
        return;
      }
      
      // Simplified visa logic (in reality, would need a comprehensive database)
      const visaInfo = this.getVisaRequirement(passportCode, this.currentCountry.cca3);
      
      if (resultDiv) {
        resultDiv.innerHTML = `
          <div class="visa-status visa-${visaInfo.status}">
            <i class="fas fa-${visaInfo.icon}"></i>
            <h4>${visaInfo.title}</h4>
            <p>${visaInfo.message}</p>
          </div>
        `;
        resultDiv.classList.remove('hidden');
      }
    },

    getVisaRequirement(passportCode, destinationCode) {
      // Same passport = no visa
      if (passportCode === destinationCode) {
        return {
          status: 'free',
          icon: 'check-circle',
          title: 'No Visa Required',
          message: 'You are a citizen of this country.'
        };
      }

      // Simplified logic - powerful passports
      const strongPassports = ['USA', 'GBR', 'CAN', 'AUS', 'DEU', 'FRA', 'JPN', 'ITA', 'ESP'];
      const easyDestinations = ['USA', 'GBR', 'CAN', 'AUS', 'DEU', 'FRA', 'JPN', 'ITA', 'ESP', 'NLD', 'BEL', 'CHE'];
      
      if (strongPassports.includes(passportCode) && easyDestinations.includes(destinationCode)) {
        return {
          status: 'free',
          icon: 'check-circle',
          title: 'Visa-Free Entry',
          message: 'You can enter without a visa for tourism (typically 90 days).'
        };
      }
      
      // Default: visa required
      return {
        status: 'required',
        icon: 'passport',
        title: 'Visa Required',
        message: 'You need to apply for a visa before traveling. Check with the embassy for requirements.'
      };
    },

    cleanup() {
      console.log('Country Explorer cleanup');
      this.currentCountry = null;
      // Note: We keep countries data for reuse
    }
  };

  // Expose to global scope
  window.CountryExplorer = CountryExplorer;

  // Register with PageLoader
  if (typeof PageLoader !== 'undefined') {
    console.log('Registering CountryExplorer with PageLoader');
    PageLoader.registerModule('country-info', CountryExplorer);
  } else {
    console.log('PageLoader not found, initializing directly');
    // Auto-initialize if PageLoader not available
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing CountryExplorer');
        CountryExplorer.init();
      });
    } else {
      console.log('DOM already loaded, initializing CountryExplorer immediately');
      CountryExplorer.init();
    }
  }
  
  console.log('CountryExplorer module loaded');
})();
