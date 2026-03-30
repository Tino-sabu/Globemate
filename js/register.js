// ============ REGISTER PAGE MODULE ============
(function () {
  'use strict';

  const RegisterModule = {
    init() {
      console.log('📝 Register page loading...');

      // If already logged in, redirect
      if (Auth.isAuthenticated) {
        showToast('Already logged in!', 'info');
        setTimeout(() => window.PageLoader.loadPage('country-info'), 500);
        return;
      }

      this.setupForm();
    },

    setupForm() {
      const form = document.getElementById('registerFormElement');
      if (!form) {
        console.error('Register form not found');
        return;
      }

      const nameInput = document.getElementById('registerName');
      if (nameInput) {
        nameInput.addEventListener('input', () => {
          nameInput.value = nameInput.value.replace(/[^A-Za-z\s]/g, '');
        });
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validation
        if (!name) {
          showToast('Please enter your full name', 'error');
          return;
        }

        if (!/^[A-Za-z\s]+$/.test(name)) {
          showToast('Name should contain only alphabets', 'error');
          return;
        }

        if (password !== confirmPassword) {
          showToast('Passwords do not match', 'error');
          return;
        }

        if (password.length < 8) {
          showToast('Password must be at least 8 characters', 'error');
          return;
        }

        // Show loading state
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

        const result = await Auth.signUp(name, email, password);

        if (result.success) {
          showToast('Account created! Welcome to GlobeMate.', 'success');
          Auth.applyLoggedInUI();

          // Go to countries tab
          setTimeout(() => {
            if (window.PageLoader) window.PageLoader.loadPage('country-info');
          }, 300);
        } else {
          showToast(result.error || 'Registration failed. Please try again.', 'error');
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      });

      // Google sign-up
      const googleBtn = document.getElementById('googleRegisterBtn');
      if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
          const result = await Auth.signInWithGoogle();
          if (result.success) {
            showToast('Account created! Welcome to GlobeMate.', 'success');
            Auth.applyLoggedInUI();
            setTimeout(() => {
              if (window.PageLoader) window.PageLoader.loadPage('country-info');
            }, 300);
          } else {
            showToast(result.error || 'Google sign-up failed.', 'error');
          }
        });
      }

      console.log('✅ Register form ready');
    },

    cleanup() {
      console.log('Cleaning up register page');
    }
  };

  // Register with PageLoader
  if (window.PageLoader) {
    window.PageLoader.registerModule('register', RegisterModule);
  }
})();
