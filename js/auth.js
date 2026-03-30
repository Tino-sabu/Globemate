// ============ SHARED AUTH UTILITIES (Firebase) ============
const Auth = (() => {
  let firebaseAuth = null;
  let firebaseDB = null;
  let currentUser = null;

  // Initialize Firebase client
  function initFirebase() {
    try {
      if (typeof firebase === 'undefined') {
        console.error('Firebase library not loaded');
        return false;
      }
      const config = window.FIREBASE_CONFIG;
      if (!config || !config.apiKey || config.apiKey === 'YOUR_API_KEY') {
        console.error('Firebase credentials not configured. Set Vercel PUBLIC_FIREBASE_* env vars or localStorage key globemate.firebaseConfig.');
        return false;
      }

      if (!config.authDomain || !config.projectId || !config.appId) {
        console.error('Firebase config incomplete. Ensure apiKey, authDomain, projectId, and appId are set.');
        return false;
      }
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      firebaseAuth = firebase.auth();
      firebaseDB = firebase.firestore();
      console.log('✅ Firebase initialized');
      return true;
    } catch (e) {
      console.error('Firebase init error:', e);
      return false;
    }
  }

  // Ensure Firebase Auth is ready
  function getAuth() {
    if (!firebaseAuth) initFirebase();
    return firebaseAuth;
  }

  // Ensure Firestore is ready
  function getDB() {
    if (!firebaseDB) initFirebase();
    return firebaseDB;
  }

  // Check existing session on app load (uses onAuthStateChanged)
  function checkSession() {
    return new Promise((resolve) => {
      const auth = getAuth();
      if (!auth) { restoreLoggedOutUI(); resolve(null); return; }
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          currentUser = user;
          applyLoggedInUI();
          resolve(user);
        } else {
          restoreLoggedOutUI();
          resolve(null);
        }
      });
    });
  }

  async function syncUserStoreAfterAuth() {
    if (!window.GlobeMateStore || typeof window.GlobeMateStore.syncFromCloud !== 'function') return;
    try {
      await window.GlobeMateStore.syncFromCloud();
    } catch (error) {
      console.warn('Post-auth saved data sync failed:', error);
    }
  }

  // Sign up new user
  async function signUp(name, email, password) {
    const auth = getAuth();
    if (!auth) return { success: false, error: 'Auth service unavailable' };

    try {
      const [credential] = await Promise.all([
        auth.createUserWithEmailAndPassword(email, password)
      ]);
      // Update display name and save Firestore profile in parallel, don't await
      credential.user.updateProfile({ displayName: name }).catch(console.warn);
      currentUser = credential.user;

      // Fire-and-forget Firestore write — don't block the user
      const db = getDB();
      if (db) {
        db.collection('profiles').doc(credential.user.uid).set({
          full_name: name,
          email,
          created_at: new Date().toISOString()
        }).catch(console.warn);
      }
      await syncUserStoreAfterAuth();
      return { success: true, user: credential.user };
    } catch (e) {
      console.error('SignUp error:', e);
      return { success: false, error: firebaseErrorMessage(e) };
    }
  }

  // Log in existing user
  async function login(email, password) {
    const auth = getAuth();
    if (!auth) return { success: false, error: 'Auth service unavailable' };

    try {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      currentUser = credential.user;
      await syncUserStoreAfterAuth();
      return { success: true, user: credential.user };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: firebaseErrorMessage(e) };
    }
  }

  // Google Sign-In (popup)
  async function signInWithGoogle() {
    const auth = getAuth();
    if (!auth) return { success: false, error: 'Auth service unavailable' };

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await auth.signInWithPopup(provider);
      currentUser = credential.user;

      // Fire-and-forget Firestore upsert — don't block the user
      const db = getDB();
      if (db) {
        db.collection('profiles').doc(credential.user.uid).set({
          full_name: credential.user.displayName || '',
          email: credential.user.email,
          created_at: new Date().toISOString()
        }, { merge: true }).catch(console.warn);
      }
      await syncUserStoreAfterAuth();
      return { success: true, user: credential.user };
    } catch (e) {
      console.error('Google sign-in error:', e);
      return { success: false, error: firebaseErrorMessage(e) };
    }
  }

  // Logout
  async function logout() {
    const auth = getAuth();
    if (!auth) return;
    try {
      await auth.signOut();
      currentUser = null;
      restoreLoggedOutUI();
      showToast('Logged out successfully', 'success');
      if (window.PageLoader) window.PageLoader.loadPage('home');
    } catch (e) {
      console.error('Logout error:', e);
      showToast('Logout failed', 'error');
    }
  }

  // Convert Firebase error codes to friendly messages
  function firebaseErrorMessage(e) {
    const map = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/cancelled-popup-request': 'Sign-in popup was cancelled.',
      'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Firebase API key is invalid. Use the Web API key from Firebase Project Settings > General > Your apps.'
    };
    return map[e.code] || e.message;
  }

  // ---- UI helpers when logged in ----

  function applyLoggedInUI() {
    if (!currentUser) return;
    const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';

    // Show nav links and mobile toggle
    const navLinksEl = document.getElementById('navLinks');
    const navToggleEl = document.getElementById('navToggle');
    // Let CSS control desktop vs mobile nav layout; avoid forcing menu open on phones.
    if (navLinksEl) navLinksEl.style.display = '';
    if (navToggleEl) navToggleEl.style.display = '';

    // Replace GlobeMate logo text with user name
    const navLogoText = document.querySelector('.nav-logo .logo-text');
    const navLogoLink = document.querySelector('.nav-logo');
    if (navLogoText) {
      navLogoText.innerHTML = userName;
      navLogoText.style.fontWeight = '400';
      navLogoText.style.color = '#111827';
      navLogoText.style.fontFamily = '';
      navLogoText.style.fontSize = '';
    }
    if (navLogoLink) {
      navLogoLink.dataset.authLocked = 'true';
      navLogoLink.addEventListener('click', preventNavLogoClick, true);
    }

    // Hide Home nav item
    const homeLink = document.querySelector('#navLinks a[data-tab="home"]');
    if (homeLink && homeLink.parentElement) {
      homeLink.parentElement.style.display = 'none';
    }

    setNavItemVisibility('trip-planner', true);
    setNavItemVisibility('packing', true);

    // Add Logout nav item
    const navLinks = document.getElementById('navLinks');
    if (navLinks && !document.getElementById('logoutNavItem')) {
      const li = document.createElement('li');
      li.id = 'logoutNavItem';
      li.innerHTML = '<a href="#" id="logoutNavLink" class="nav-tab-link"><i class="fas fa-sign-out-alt"></i> Logout</a>';
      navLinks.appendChild(li);
      document.getElementById('logoutNavLink').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }

    if (window.GlobeMateStore && typeof window.GlobeMateStore.syncFromCloud === 'function') {
      window.GlobeMateStore.syncFromCloud().catch((error) => {
        console.warn('Saved places sync on login failed:', error);
      });
    }

    console.log('✅ Navbar updated — user:', userName);
  }

  function restoreLoggedOutUI() {
    // Hide nav links and mobile toggle
    const navLinksEl = document.getElementById('navLinks');
    const navToggleEl = document.getElementById('navToggle');
    if (navLinksEl) navLinksEl.style.display = 'none';
    if (navToggleEl) navToggleEl.style.display = 'none';

    // Restore logo
    const navLogoText = document.querySelector('.nav-logo .logo-text');
    const navLogoLink = document.querySelector('.nav-logo');
    if (navLogoText) {
      navLogoText.innerHTML = '<span class="letter-g">G</span><span class="letter-l">l</span><span class="letter-o">o</span><span class="letter-b">b</span><span class="letter-e1">e</span><span class="letter-m">M</span><span class="letter-a">a</span><span class="letter-t">t</span><span class="letter-e2">e</span>';
      navLogoText.style.fontWeight = '';
      navLogoText.style.color = '';
      navLogoText.style.fontFamily = '';
      navLogoText.style.fontSize = '';
    }
    if (navLogoLink) {
      delete navLogoLink.dataset.authLocked;
      navLogoLink.removeEventListener('click', preventNavLogoClick, true);
    }

    // Show Home nav item
    const homeLink = document.querySelector('#navLinks a[data-tab="home"]');
    if (homeLink && homeLink.parentElement) {
      homeLink.parentElement.style.display = '';
    }

    setNavItemVisibility('trip-planner', false);
    setNavItemVisibility('packing', false);

    // Remove logout item
    const logoutLi = document.getElementById('logoutNavItem');
    if (logoutLi) logoutLi.remove();
  }

  function getUserName() {
    if (!currentUser) return null;
    return currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  }

  function preventNavLogoClick(event) {
    const link = event.currentTarget;
    if (link && link.dataset.authLocked === 'true') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function setNavItemVisibility(tabId, isVisible) {
    const link = document.querySelector(`#navLinks a[data-tab="${tabId}"]`);
    if (link && link.parentElement) {
      link.parentElement.style.display = isVisible ? '' : 'none';
    }
  }

  return {
    initFirebase,
    getAuth,
    getDB,
    checkSession,
    signUp,
    login,
    logout,
    signInWithGoogle,
    applyLoggedInUI,
    restoreLoggedOutUI,
    getUserName,
    get currentUser() { return currentUser; },
    get isAuthenticated() { return currentUser !== null; }
  };
})();

// Initialize Firebase immediately on script load
Auth.initFirebase();

// Check for existing session and apply UI on app load
document.addEventListener('DOMContentLoaded', () => {
  Auth.checkSession();
});

window.Auth = Auth;
