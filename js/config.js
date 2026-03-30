// Public-safe defaults. Do not place real secrets in this file.
(function () {
  function normalizeFirebaseConfig(raw) {
    const value = raw || {};
    const pick = (...keys) => {
      for (const key of keys) {
        const candidate = value[key];
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
      return '';
    };

    return {
      apiKey: pick('apiKey', 'api_key', 'apikey', 'firebaseApiKey'),
      authDomain: pick('authDomain', 'auth_domain', 'firebaseAuthDomain'),
      projectId: pick('projectId', 'project_id', 'firebaseProjectId'),
      storageBucket: pick('storageBucket', 'storage_bucket', 'firebaseStorageBucket'),
      messagingSenderId: pick('messagingSenderId', 'messaging_sender_id', 'firebaseMessagingSenderId'),
      appId: pick('appId', 'app_id', 'firebaseAppId'),
      measurementId: pick('measurementId', 'measurement_id', 'firebaseMeasurementId')
    };
  }

  function normalizeEmailJsConfig(raw) {
    const value = raw || {};
    const pick = (...keys) => {
      for (const key of keys) {
        const candidate = value[key];
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
      return '';
    };

    return {
      serviceId: pick('serviceId', 'service_id', 'emailjsServiceId'),
      templateId: pick('templateId', 'template_id', 'emailjsTemplateId'),
      resetTemplateId: pick('resetTemplateId', 'reset_template_id', 'emailjsResetTemplateId'),
      publicKey: pick('publicKey', 'public_key', 'emailjsPublicKey')
    };
  }

  const emptyFirebaseConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  };

  const emptyEmailJsConfig = {
    serviceId: '',
    templateId: '',
    resetTemplateId: '',
    publicKey: ''
  };

  let localFirebaseConfig = {};
  let localEmailJsConfig = {};
  let localApiKeys = {};
  try {
    const firebaseRaw = localStorage.getItem('globemate.firebaseConfig');
    if (firebaseRaw) {
      localFirebaseConfig = normalizeFirebaseConfig(JSON.parse(firebaseRaw));
    }

    const emailJsRaw = localStorage.getItem('globemate.emailjsConfig');
    if (emailJsRaw) {
      localEmailJsConfig = normalizeEmailJsConfig(JSON.parse(emailJsRaw));
    }

    const apiKeysRaw = localStorage.getItem('globemate.apiKeys');
    if (apiKeysRaw) {
      localApiKeys = JSON.parse(apiKeysRaw);
    }
  } catch (error) {
    console.warn('Unable to parse local runtime config:', error);
  }

  // Priority order: server-injected config > localStorage config > empty defaults.
  window.FIREBASE_CONFIG = {
    ...emptyFirebaseConfig,
    ...(localFirebaseConfig || {}),
    ...(window.FIREBASE_CONFIG || {})
  };

  // Priority order: server-injected config > localStorage config > empty defaults.
  window.EMAILJS_CONFIG = {
    ...emptyEmailJsConfig,
    ...(localEmailJsConfig || {}),
    ...(window.EMAILJS_CONFIG || {})
  };

  window.TOMORROW_IO_API_KEY = window.TOMORROW_IO_API_KEY || localApiKeys.tomorrowIo || '';
  window.GROK_API_KEY = window.GROK_API_KEY || localApiKeys.grok || '';
  window.GROQ_API_KEY = window.GROQ_API_KEY || localApiKeys.groq || '';
})();
