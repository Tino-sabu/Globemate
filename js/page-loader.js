// ============ PAGE LOADER SYSTEM ============
(function() {
  'use strict';
  
  const PageLoader = {
    currentPage: null,
    currentModule: null,
    modules: {},
    contentContainer: null,

    init() {
      this.contentContainer = document.getElementById('content-container');
      if (!this.contentContainer) {
        console.error('Content container not found!');
        return;
      }

      // Set up tab navigation
      this.setupNavigation();
      
      // Load home page by default
      this.loadPage('home');
      
      // Initial navbar state check
      setTimeout(() => {
        const navbar = document.getElementById('navbar');
        if (navbar && document.body.classList.contains('hero-page')) {
          navbar.classList.remove('scrolled');
          navbar.style.background = 'transparent';
          navbar.style.boxShadow = 'none';
          console.log('🚀 Initial navbar setup: transparent for hero page');
        }
      }, 400);
    },

    setupNavigation() {
      // Handle ALL clicks with data-tab attribute (navbar + buttons in pages)
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-tab]');
        if (!trigger) return;
        
        e.preventDefault();
        const pageId = trigger.getAttribute('data-tab');
        this.loadPage(pageId);
        
        // Update active state on navbar links
        const navLinks = document.querySelectorAll('.nav-links a[data-tab]');
        navLinks.forEach(l => l.classList.remove('active-tab'));
        const activeNavLink = document.querySelector(`.nav-links a[data-tab="${pageId}"]`);
        if (activeNavLink) {
          activeNavLink.classList.add('active-tab');
        }
        
        // Close mobile menu if open
        const navLinksContainer = document.getElementById('navLinks');
        if (navLinksContainer) {
          navLinksContainer.classList.remove('show');
        }
      });

      // Set home as active initially
      const homeLink = document.querySelector('.nav-links a[data-tab="home"]');
      if (homeLink) {
        homeLink.classList.add('active-tab');
      }
    },

    async loadPage(pageId) {
      if (pageId === this.currentPage) {
        return; // Already loaded
      }

      // Cleanup current module
      if (this.currentModule && this.modules[this.currentPage]) {
        const module = this.modules[this.currentPage];
        if (module.cleanup) {
          module.cleanup();
        }
      }

      try {
        // Fetch HTML content
        const response = await fetch(`pages/${pageId}.html`);
        if (!response.ok) {
          throw new Error(`Failed to load page: ${pageId}`);
        }

        const html = await response.text();
        
        // Update container with fade effect
        this.contentContainer.style.opacity = '0';
        
        setTimeout(() => {
          this.contentContainer.innerHTML = html;
          this.contentContainer.style.opacity = '1';
          
          this.currentPage = pageId;
          
          // Update body class for hero-style pages
          document.body.className = ''; // Clear previous classes
          document.body.classList.add(`page-${pageId}`);
          const navbar = document.getElementById('navbar');
          if (['home', 'country-info', 'safety', 'trip-planner'].includes(pageId)) {
            document.body.classList.add('hero-page');
            console.log(`✅ Added hero-page class for: ${pageId}`);
            // Remove scrolled class immediately on hero pages
            if (navbar) {
              navbar.classList.remove('scrolled');
              navbar.style.background = 'transparent';
              navbar.style.boxShadow = 'none';
              console.log('✅ Removed scrolled class and set transparent background');
            }
          } else {
            console.log(`ℹ️ Not a hero page: ${pageId}`);
            if (navbar) {
              navbar.style.background = '';
              navbar.style.boxShadow = '';
            }
          }
          console.log('Body classes:', document.body.className);
          console.log('Navbar classes:', navbar ? navbar.className : 'navbar not found');
          
          // Initialize module after DOM is fully ready
          setTimeout(() => {
            if (this.modules[pageId]) {
              const module = this.modules[pageId];
              if (module.init) {
                console.log(`Initializing module: ${pageId}`);
                module.init();
              }
              this.currentModule = module;
            }
          }, 50); // Small delay to ensure DOM is ready
          
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);

      } catch (error) {
        console.error('Error loading page:', error);
        this.contentContainer.innerHTML = `
          <section class="section">
            <div class="container">
              <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Page Not Found</h3>
                <p>Sorry, we couldn't load the requested page.</p>
              </div>
            </div>
          </section>
        `;
      }
    },

    registerModule(pageId, module) {
      this.modules[pageId] = module;
    }
  };

  // Expose to global scope
  window.PageLoader = PageLoader;
})();
