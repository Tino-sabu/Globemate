module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const firebaseConfig = {
    apiKey: process.env.PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.PUBLIC_FIREBASE_APP_ID || '',
    measurementId: process.env.PUBLIC_FIREBASE_MEASUREMENT_ID || ''
  };

  const emailJsConfig = {
    serviceId: process.env.PUBLIC_EMAILJS_SERVICE_ID || '',
    templateId: process.env.PUBLIC_EMAILJS_TEMPLATE_ID || '',
    resetTemplateId: process.env.PUBLIC_EMAILJS_RESET_TEMPLATE_ID || '',
    publicKey: process.env.PUBLIC_EMAILJS_PUBLIC_KEY || ''
  };

  const js = `
(function () {
  window.FIREBASE_CONFIG = {
    apiKey: ${JSON.stringify(firebaseConfig.apiKey)},
    authDomain: ${JSON.stringify(firebaseConfig.authDomain)},
    projectId: ${JSON.stringify(firebaseConfig.projectId)},
    storageBucket: ${JSON.stringify(firebaseConfig.storageBucket)},
    messagingSenderId: ${JSON.stringify(firebaseConfig.messagingSenderId)},
    appId: ${JSON.stringify(firebaseConfig.appId)},
    measurementId: ${JSON.stringify(firebaseConfig.measurementId)}
  };

  window.EMAILJS_CONFIG = {
    serviceId: ${JSON.stringify(emailJsConfig.serviceId)},
    templateId: ${JSON.stringify(emailJsConfig.templateId)},
    resetTemplateId: ${JSON.stringify(emailJsConfig.resetTemplateId)},
    publicKey: ${JSON.stringify(emailJsConfig.publicKey)}
  };

  window.TOMORROW_IO_API_KEY = ${JSON.stringify(process.env.PUBLIC_TOMORROW_IO_API_KEY || '')};
  window.GROK_API_KEY = ${JSON.stringify(process.env.PUBLIC_GROK_API_KEY || '')};
  window.GROQ_API_KEY = ${JSON.stringify(process.env.PUBLIC_GROQ_API_KEY || '')};
})();
`;

  res.status(200).send(js);
};
