/* ========================================
   GlobeMate — Core Application
   ======================================== */

// ============ UTILITIES ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showToast(message, type = 'success') {
  const container = $('#toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { 
    success: 'check-circle', 
    error: 'exclamation-circle', 
    warning: 'exclamation-triangle' 
  };
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

const GlobeMateStore = (() => {
  const KEYS = {
    savedPlaces: 'globemate_saved_places_v1',
    trips: 'globemateTrips',
    itineraries: 'globemate_saved_itineraries',
    aiTripId: 'globemate_ai_trip_id',
    viewItinerary: 'globemate_view_itinerary'
  };

  const CLOUD_COLLECTION = 'user_saved_places';
  let cloudPullInFlight = null;
  let cloudPushTimer = null;
  let cloudSyncedUserId = null;
  let suspendCloudPush = false;

  function safeParseArray(raw) {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function readArray(key) {
    return safeParseArray(localStorage.getItem(key));
  }

  function writeArray(key, value) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId(prefix = 'sp') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function currentUserId() {
    return (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.uid) ? Auth.currentUser.uid : null;
  }

  function currentDB() {
    return (typeof Auth !== 'undefined' && typeof Auth.getDB === 'function') ? Auth.getDB() : null;
  }

  function emitUpdated() {
    window.dispatchEvent(new CustomEvent('globemate:saved-places-updated'));
  }

  function normalizeTrip(trip = {}) {
    return {
      ...trip,
      id: Number(trip.id) || Date.now(),
      createdAt: trip.createdAt || nowIso()
    };
  }

  function normalizePlace(place = {}) {
    const baseTrip = normalizeTrip(place.trip || {});
    const hasItinerary = place.itinerary && (place.itinerary.html || place.itinerary.destination);

    return {
      id: place.id || makeId('sp'),
      sourceTripId: Number(place.sourceTripId) || baseTrip.id,
      destination: place.destination || baseTrip.destination || place.itinerary?.destination || 'Unknown destination',
      createdAt: place.createdAt || baseTrip.createdAt || nowIso(),
      updatedAt: place.updatedAt || place.createdAt || nowIso(),
      trip: baseTrip,
      itinerary: hasItinerary ? normalizeItinerary({
        ...(place.itinerary || {}),
        trip: place.itinerary?.trip || baseTrip,
        destination: place.itinerary?.destination || place.destination || baseTrip.destination,
        date: place.itinerary?.date || place.updatedAt || nowIso()
      }) : null
    };
  }

  function normalizeItinerary(entry = {}) {
    const normalizedTrip = normalizeTrip(entry.trip || {});
    return {
      id: Number(entry.id) || Date.now(),
      destination: entry.destination || normalizedTrip.destination || 'Unknown destination',
      date: entry.date || nowIso(),
      prefs: entry.prefs || {},
      trip: normalizedTrip,
      html: entry.html || ''
    };
  }

  function placeFromTrip(trip) {
    const normalizedTrip = normalizeTrip(trip);
    const stamp = nowIso();
    return {
      id: makeId('trip'),
      sourceTripId: normalizedTrip.id,
      destination: normalizedTrip.destination || 'Unknown destination',
      createdAt: normalizedTrip.createdAt || stamp,
      updatedAt: stamp,
      trip: normalizedTrip,
      itinerary: null
    };
  }

  function placeFromItinerary(itinerary) {
    const normalized = normalizeItinerary(itinerary);
    const stamp = normalized.date || nowIso();
    return {
      id: makeId('itin'),
      sourceTripId: normalized.trip.id,
      destination: normalized.destination,
      createdAt: stamp,
      updatedAt: stamp,
      trip: normalized.trip,
      itinerary: {
        id: normalized.id,
        destination: normalized.destination,
        date: normalized.date,
        prefs: normalized.prefs,
        trip: normalized.trip,
        html: normalized.html
      }
    };
  }

  function sortByRecent(items) {
    return [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }

  function keyFromPlace(place) {
    if (place && place.sourceTripId !== undefined && place.sourceTripId !== null) {
      return `trip:${Number(place.sourceTripId)}`;
    }
    return `id:${place?.id || makeId('key')}`;
  }

  function mergePlaces(localPlaces = [], cloudPlaces = []) {
    const map = new Map();

    [...localPlaces, ...cloudPlaces]
      .map(normalizePlace)
      .forEach((place) => {
        const key = keyFromPlace(place);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, place);
          return;
        }

        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const incomingTime = new Date(place.updatedAt || place.createdAt || 0).getTime();
        if (incomingTime >= existingTime) {
          map.set(key, {
            ...existing,
            ...place,
            itinerary: place.itinerary || existing.itinerary
          });
        }
      });

    return sortByRecent(Array.from(map.values()));
  }

  function placesEqual(a = [], b = []) {
    const normalizeForCompare = (items) => sortByRecent(items).map((place) => ({
      id: place.id,
      sourceTripId: Number(place.sourceTripId),
      destination: place.destination,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
      trip: place.trip,
      itinerary: place.itinerary
    }));

    return JSON.stringify(normalizeForCompare(a.map(normalizePlace)))
      === JSON.stringify(normalizeForCompare(b.map(normalizePlace)));
  }

  async function pushPlacesToCloud(places) {
    const uid = currentUserId();
    const db = currentDB();
    if (!uid || !db) return;

    await db.collection(CLOUD_COLLECTION).doc(uid).set({
      uid,
      places,
      updatedAt: nowIso()
    }, { merge: true });
  }

  function scheduleCloudPush(places) {
    if (suspendCloudPush) return;
    const uid = currentUserId();
    if (!uid) return;

    if (cloudPushTimer) clearTimeout(cloudPushTimer);
    cloudPushTimer = setTimeout(async () => {
      try {
        // Never push before first pull; this avoids clobbering existing cloud data.
        if (cloudSyncedUserId !== uid) {
          await syncFromCloud();
        }

        const latestPlaces = readArray(KEYS.savedPlaces).map(normalizePlace);
        await pushPlacesToCloud(latestPlaces);
        cloudSyncedUserId = uid;
      } catch (error) {
        console.warn('Cloud sync push failed:', error);
      } finally {
        cloudPushTimer = null;
      }
    }, 450);
  }

  async function syncFromCloud() {
    const uid = currentUserId();
    const db = currentDB();
    if (!uid || !db) return migrateLegacyIfNeeded();
    if (cloudPullInFlight) return cloudPullInFlight;

    cloudPullInFlight = (async () => {
      const snapshot = await db.collection(CLOUD_COLLECTION).doc(uid).get();
      const cloudPlaces = (snapshot.exists && Array.isArray(snapshot.data()?.places))
        ? snapshot.data().places
        : [];
      const localPlaces = migrateLegacyIfNeeded();
      const merged = mergePlaces(localPlaces, cloudPlaces);

      suspendCloudPush = true;
      try {
        savePlaces(merged);
      } finally {
        suspendCloudPush = false;
      }

      cloudSyncedUserId = uid;

      // Keep cloud in sync with merged result (legacy local data + cloud data).
      if (!placesEqual(merged, cloudPlaces)) {
        await pushPlacesToCloud(merged);
      }

      return merged;
    })();

    try {
      return await cloudPullInFlight;
    } catch (error) {
      console.warn('Cloud sync pull failed:', error);
      return migrateLegacyIfNeeded();
    } finally {
      cloudPullInFlight = null;
    }
  }

  function ensureCloudPull() {
    const uid = currentUserId();
    const db = currentDB();
    if (!uid) {
      cloudSyncedUserId = null;
      return;
    }
    if (!db) return;
    if (cloudSyncedUserId === uid || cloudPullInFlight) return;
    syncFromCloud().catch((error) => {
      console.warn('Cloud ensure pull failed:', error);
    });
  }

  function syncLegacyFromPlaces(places) {
    const trips = places
      .filter(place => place && place.trip)
      .map(place => normalizeTrip(place.trip));

    const itineraries = places
      .filter(place => place && place.itinerary && place.itinerary.html)
      .map(place => normalizeItinerary(place.itinerary));

    writeArray(KEYS.trips, trips);
    writeArray(KEYS.itineraries, itineraries);
  }

  function savePlaces(places) {
    const sorted = sortByRecent((places || []).map(normalizePlace));
    writeArray(KEYS.savedPlaces, sorted);
    syncLegacyFromPlaces(sorted);
    emitUpdated();
    scheduleCloudPush(sorted);
    return sorted;
  }

  function migrateLegacyIfNeeded() {
    const existing = readArray(KEYS.savedPlaces).map(normalizePlace);
    if (existing.length) return sortByRecent(existing);

    const tripPlaces = readArray(KEYS.trips).map(placeFromTrip);
    const merged = [...tripPlaces];

    readArray(KEYS.itineraries)
      .map(normalizeItinerary)
      .forEach((entry) => {
        const index = merged.findIndex(place => Number(place.sourceTripId) === Number(entry.trip.id));
        if (index >= 0) {
          merged[index] = {
            ...merged[index],
            destination: entry.destination || merged[index].destination,
            trip: normalizeTrip(entry.trip || merged[index].trip),
            itinerary: {
              id: entry.id,
              destination: entry.destination,
              date: entry.date,
              prefs: entry.prefs,
              trip: normalizeTrip(entry.trip),
              html: entry.html
            },
            updatedAt: entry.date || merged[index].updatedAt
          };
        } else {
          merged.push(placeFromItinerary(entry));
        }
      });

    return savePlaces(merged);
  }

  function getSavedPlaces() {
    const places = migrateLegacyIfNeeded();
    ensureCloudPull();
    return places;
  }

  function getTrips() {
    return getSavedPlaces()
      .filter(place => place.trip)
      .map(place => normalizeTrip(place.trip));
  }

  function getItineraries() {
    return getSavedPlaces()
      .filter(place => place.itinerary && place.itinerary.html)
      .map(place => normalizeItinerary(place.itinerary));
  }

  function saveTrip(trip) {
    const normalizedTrip = normalizeTrip(trip);
    const all = getSavedPlaces();
    const existingIndex = all.findIndex(place => Number(place.sourceTripId) === Number(normalizedTrip.id));
    const stamp = nowIso();

    if (existingIndex >= 0) {
      const existing = all[existingIndex];
      all[existingIndex] = {
        ...existing,
        sourceTripId: normalizedTrip.id,
        destination: normalizedTrip.destination || existing.destination,
        trip: normalizedTrip,
        updatedAt: stamp
      };
    } else {
      all.unshift({
        id: makeId('trip'),
        sourceTripId: normalizedTrip.id,
        destination: normalizedTrip.destination || 'Unknown destination',
        createdAt: normalizedTrip.createdAt || stamp,
        updatedAt: stamp,
        trip: normalizedTrip,
        itinerary: null
      });
    }

    savePlaces(all);
    return normalizedTrip;
  }

  function saveItinerary(payload = {}) {
    const normalizedTrip = normalizeTrip(payload.trip || {});
    const stamp = nowIso();
    const itinerary = normalizeItinerary({
      id: payload.id || Date.now(),
      destination: payload.destination || normalizedTrip.destination,
      date: payload.date || stamp,
      prefs: payload.prefs || {},
      trip: normalizedTrip,
      html: payload.html || ''
    });

    const all = getSavedPlaces();
    const existingIndex = all.findIndex(place => Number(place.sourceTripId) === Number(normalizedTrip.id));

    if (existingIndex >= 0) {
      const existing = all[existingIndex];
      all[existingIndex] = {
        ...existing,
        sourceTripId: normalizedTrip.id,
        destination: itinerary.destination || existing.destination,
        trip: normalizedTrip,
        itinerary,
        updatedAt: itinerary.date || stamp
      };
    } else {
      all.unshift({
        id: makeId('itin'),
        sourceTripId: normalizedTrip.id,
        destination: itinerary.destination,
        createdAt: itinerary.date || stamp,
        updatedAt: itinerary.date || stamp,
        trip: normalizedTrip,
        itinerary
      });
    }

    savePlaces(all);
    return itinerary;
  }

  function deleteSavedPlace(placeId) {
    const all = getSavedPlaces().filter(place => place.id !== placeId);
    savePlaces(all);
  }

  function deleteTrip(tripId) {
    const all = getSavedPlaces().filter(place => Number(place.sourceTripId) !== Number(tripId));
    savePlaces(all);
  }

  function setCurrentTripId(tripId) {
    localStorage.setItem(KEYS.aiTripId, String(tripId));
  }

  function getCurrentTripId() {
    const value = parseInt(localStorage.getItem(KEYS.aiTripId), 10);
    return Number.isNaN(value) ? null : value;
  }

  function setViewedItinerary(itinerary) {
    localStorage.setItem(KEYS.viewItinerary, JSON.stringify(itinerary || null));
  }

  function consumeViewedItinerary() {
    const raw = localStorage.getItem(KEYS.viewItinerary);
    localStorage.removeItem(KEYS.viewItinerary);
    if (!raw || raw === 'null') return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  async function syncToCloud() {
    const places = getSavedPlaces();
    await pushPlacesToCloud(places);
    return places;
  }

  return {
    keys: KEYS,
    getSavedPlaces,
    getTrips,
    getItineraries,
    saveTrip,
    saveItinerary,
    deleteSavedPlace,
    deleteTrip,
    setCurrentTripId,
    getCurrentTripId,
    setViewedItinerary,
    consumeViewedItinerary,
    syncFromCloud,
    syncToCloud
  };
})();

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// Debounce function for search inputs
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll events
function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    showToast('Failed to copy', 'error');
    return false;
  }
}

// Form validation helpers
const FormValidation = {
  isEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isPhoneNumber(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return phone.length >= 10 && re.test(phone);
  },

  isStrongPassword(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
  },

  isEmpty(value) {
    return !value || value.trim() === '';
  },

  showFieldError(input, message) {
    input.classList.add('error');
    let errorEl = input.parentElement.querySelector('.field-error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
  },

  clearFieldError(input) {
    input.classList.remove('error');
    const errorEl = input.parentElement.querySelector('.field-error');
    if (errorEl) errorEl.remove();
  }
};

// API fetch wrapper with error handling
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    showToast(`Failed to fetch data: ${error.message}`, 'error');
    throw error;
  }
}

// Random ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Slugify string (for URLs)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Truncate text with ellipsis
function truncate(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Get query parameter from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Set document title
function setPageTitle(title) {
  document.title = `${title} — GlobeMate`;
}

// Check if mobile device
function isMobile() {
  return window.innerWidth <= 768;
}

// Scroll to element
function scrollToElement(selector, offset = 0) {
  const element = $(selector);
  if (!element) return;

  const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

// Expose utilities globally
window.AppUtils = {
  $,
  $$,
  showToast,
  saveToLocal,
  loadFromLocal,
  GlobeMateStore,
  formatDate,
  formatNumber,
  debounce,
  throttle,
  copyToClipboard,
  FormValidation,
  fetchAPI,
  generateId,
  slugify,
  truncate,
  getQueryParam,
  setPageTitle,
  isMobile,
  scrollToElement
};

// Also expose individual functions for modules
window.$ = $;
window.$$ = $$;
window.showToast = showToast;
window.saveToLocal = saveToLocal;
window.loadFromLocal = loadFromLocal;
window.GlobeMateStore = GlobeMateStore;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.debounce = debounce;
window.throttle = throttle;
window.copyToClipboard = copyToClipboard;
window.FormValidation = FormValidation;
window.fetchAPI = fetchAPI;
window.generateId = generateId;

// ============ SPLASH SCREEN ============
class SplashScreen {
  constructor(onComplete) {
    this.onComplete = onComplete || (() => {});
    this.el = null;
  }

  init() {
    this.el = document.getElementById('splashScreen');
    if (!this.el) return;
    
    this.startTransition();
  }

  startTransition() {
    // Wait for 2.5 seconds, then fade out
    setTimeout(() => {
      this.fadeOut();
    }, 2500);
  }

  fadeOut() {
    if (!this.el) return;
    
    this.el.classList.add('fade-out');
    
    // Once fade out completes, show main app
    setTimeout(() => {
      this.el.style.display = 'none';
      const mainApp = document.getElementById('mainApp');
      if (mainApp) {
        mainApp.classList.add('visible');
      }
      
      // Trigger callback
      this.onComplete();
    }, 800);
  }
}

// ============ NAVBAR SCROLL EFFECT ============
function initNavbar() {
  const navbar = $('#navbar');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');

  if (!navbar) return;

  let lastScrollY = 0;
  const handleScroll = (event) => {
    const target = event && event.target instanceof Element ? event.target : null;
    const isPageSection = target && target.classList.contains('section') && target.classList.contains('tab-section');
    const currentScrollY = isPageSection ? target.scrollTop : window.scrollY;
    const isHeroPage = document.body.classList.contains('hero-page');
    const isMenuOpen = navLinks && navLinks.classList.contains('show');

    if (isHeroPage) {
      navbar.classList.remove('scrolled');
      navbar.style.background = 'transparent';
      navbar.style.boxShadow = 'none';
      console.log('🔒 Keeping navbar transparent (hero page)');
    } else {
      navbar.classList.toggle('scrolled', currentScrollY > 50);
      navbar.style.background = '';
      navbar.style.boxShadow = '';
    }

    if (!isMenuOpen && currentScrollY > 80 && currentScrollY > lastScrollY) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }

    lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
  };

  // Scroll effect on navbar
  window.addEventListener('scroll', throttle(handleScroll, 100));
  document.addEventListener('scroll', throttle(handleScroll, 100), true);

  // Mobile menu toggle
  if (navToggle && navLinks) {
    const closeMobileMenu = () => {
      navLinks.classList.remove('show');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    const setExpandedState = () => {
      navToggle.setAttribute('aria-expanded', navLinks.classList.contains('show') ? 'true' : 'false');
    };

    if (window.innerWidth <= 768) {
      closeMobileMenu();
    } else {
      setExpandedState();
    }

    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
      setExpandedState();
    });

    // Close mobile menu when clicking nav links
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('.nav-tab-link')) {
        closeMobileMenu();
      }
    });

    // Close menu when tapping outside in mobile view.
    document.addEventListener('click', (e) => {
      if (window.innerWidth > 768) return;
      if (!navLinks.classList.contains('show')) return;
      const clickedInsideMenu = navLinks.contains(e.target) || navToggle.contains(e.target);
      if (!clickedInsideMenu) {
        closeMobileMenu();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        navLinks.classList.remove('show');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// ============ APP INITIALIZATION ============
const App = {
  splash: null,

  init() {
    // Initialize splash screen
    this.splash = new SplashScreen(() => {
      this.onSplashComplete();
    });
    this.splash.init();
  },

  onSplashComplete() {
    // Initialize navbar effects
    initNavbar();
    
    // Initialize PageLoader to load first page
    if (typeof PageLoader !== 'undefined') {
      PageLoader.init();
    } else {
      console.error('PageLoader not found!');
    }
  }
};

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Expose App globally for debugging
window.GlobeMateApp = App;
