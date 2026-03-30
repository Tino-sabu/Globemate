// ============ LOGIN PAGE MODULE ============
(function () {
  'use strict';

  const LoginModule = {
    init() {
      console.log('🔑 Login page loading...');

      // If already logged in, redirect
      if (Auth.isAuthenticated) {
        showToast('Already logged in!', 'info');
        setTimeout(() => window.PageLoader.loadPage('country-info'), 500);
        return;
      }

      this.setupForm();
    },

    setupForm() {
      const form = document.getElementById('loginFormElement');
      if (!form) {
        console.error('Login form not found');
        return;
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
          showToast('Please fill in all fields', 'error');
          return;
        }

        // Show loading state
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        const result = await Auth.login(email, password);

        if (result.success) {
          showToast('Welcome back!', 'success');
          Auth.applyLoggedInUI();

          // Go to countries tab
          setTimeout(() => {
            if (window.PageLoader) window.PageLoader.loadPage('country-info');
          }, 300);
        } else {
          showToast(result.error || 'Invalid email or password.', 'error');
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      });

      // Google login
      const googleBtn = document.getElementById('googleLoginBtn');
      if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
          const result = await Auth.signInWithGoogle();
          if (result.success) {
            showToast('Welcome!', 'success');
            Auth.applyLoggedInUI();
            setTimeout(() => {
              if (window.PageLoader) window.PageLoader.loadPage('country-info');
            }, 300);
          } else {
            showToast(result.error || 'Google sign-in failed.', 'error');
          }
        });
      }

      const forgotPasswordLink = document.querySelector('.forgot-password');
      if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('The beta version does not support Gmail verifcation, we will introduce it soon.', 'info');
        });
      }

      console.log('✅ Login form ready');
    },

    cleanup() {
      console.log('Cleaning up login page');
    }
  };

  // Register with PageLoader
  if (window.PageLoader) {
    window.PageLoader.registerModule('login', LoginModule);
  }
})();
