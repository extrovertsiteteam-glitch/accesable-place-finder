/**
 * Accessible Place Finder - Main Application Orchestration & Routing
 */

const App = {
  currentView: 'home',

  async init() {
    console.log('🚀 Initializing Accessible Place Finder...');

    // 1. Initialize Accessibility Preferences
    App.initA11yToolbar();

    // 2. Initialize Authentication
    await window.Auth.init();

    // 3. Initialize Global Event Listeners & Modals
    App.initModalListeners();
    App.initSearchControls();

    // 4. Handle Routing (Hash or View)
    window.addEventListener('hashchange', App.handleHashChange);
    App.handleHashChange();

    // 5. Initial Data Load
    await window.Places.loadCategories();
    await window.Places.loadCities();
    await window.Places.loadPopularPlaces();
    await window.Places.loadRecentPlaces();

    console.log('✅ Accessible Place Finder Ready!');
  },

  /**
   * Client-side Routing between SPA Views
   */
  navigate(viewName) {
    App.currentView = viewName;
    window.location.hash = viewName === 'home' ? '' : `#${viewName}`;

    document.querySelectorAll('.view-container').forEach(view => {
      view.style.display = 'none';
    });

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.style.display = 'block';
    }

    // Update nav links active state
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkView = link.getAttribute('data-view');
      if (linkView === viewName) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    // Close mobile nav drawer if open
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) navMenu.classList.remove('open');

    // Specific view setup hooks
    if (viewName === 'search') {
      window.Places.searchPlaces();
    } else if (viewName === 'admin') {
      window.Admin.initDashboard();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'home';
    App.navigate(hash);
  },

  /**
   * Accessibility Toolbar Feature Implementation
   */
  initA11yToolbar() {
    // 1. High Contrast Mode
    const btnContrast = document.getElementById('btn-toggle-contrast');
    const isHighContrast = localStorage.getItem('apf_high_contrast') === 'true';
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
      if (btnContrast) btnContrast.classList.add('active');
    }

    if (btnContrast) {
      btnContrast.addEventListener('click', () => {
        const active = document.body.classList.toggle('high-contrast');
        localStorage.setItem('apf_high_contrast', active);
        btnContrast.classList.toggle('active', active);
        btnContrast.setAttribute('aria-pressed', String(active));
        window.API.showToast(active ? 'High Contrast Mode Enabled' : 'Standard Contrast Mode Restored', 'info', 2500);
      });
    }

    // 2. Font Sizing (Normal -> Large -> Extra Large -> Normal)
    const btnFontSize = document.getElementById('btn-toggle-fontsize');
    const savedFontSize = localStorage.getItem('apf_font_size') || 'normal';
    if (savedFontSize === 'large') document.body.classList.add('font-size-large');
    else if (savedFontSize === 'xlarge') document.body.classList.add('font-size-xlarge');

    if (btnFontSize) {
      btnFontSize.addEventListener('click', () => {
        if (document.body.classList.contains('font-size-xlarge')) {
          document.body.classList.remove('font-size-large', 'font-size-xlarge');
          localStorage.setItem('apf_font_size', 'normal');
          btnFontSize.textContent = 'A- Text Size: Normal';
        } else if (document.body.classList.contains('font-size-large')) {
          document.body.classList.remove('font-size-large');
          document.body.classList.add('font-size-xlarge');
          localStorage.setItem('apf_font_size', 'xlarge');
          btnFontSize.textContent = 'A+ Text Size: XL';
        } else {
          document.body.classList.add('font-size-large');
          localStorage.setItem('apf_font_size', 'large');
          btnFontSize.textContent = 'A+ Text Size: Large';
        }
      });
    }

    // 3. Reduced Motion
    const btnMotion = document.getElementById('btn-toggle-motion');
    const isReducedMotion = localStorage.getItem('apf_reduced_motion') === 'true';
    if (isReducedMotion) {
      document.body.classList.add('reduced-motion');
      if (btnMotion) btnMotion.classList.add('active');
    }

    if (btnMotion) {
      btnMotion.addEventListener('click', () => {
        const active = document.body.classList.toggle('reduced-motion');
        localStorage.setItem('apf_reduced_motion', active);
        btnMotion.classList.toggle('active', active);
        btnMotion.setAttribute('aria-pressed', String(active));
      });
    }
  },

  /**
   * Search Controls on Hero & Search Page
   */
  initSearchControls() {
    // Hero search input & button
    const heroSearchInput = document.getElementById('hero-search-input');
    const heroSearchBtn = document.getElementById('hero-search-btn');

    const triggerHeroSearch = () => {
      const q = heroSearchInput ? heroSearchInput.value.trim() : '';
      window.Places.currentFilters.q = q;
      const searchPageInput = document.getElementById('filter-keyword-input');
      if (searchPageInput) searchPageInput.value = q;
      App.navigate('search');
    };

    if (heroSearchBtn) heroSearchBtn.addEventListener('click', triggerHeroSearch);
    if (heroSearchInput) {
      heroSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerHeroSearch();
      });
    }

    // Search Page Input Controls
    const filterKeyword = document.getElementById('filter-keyword-input');
    const filterCity = document.getElementById('filter-city-select');
    const filterCategory = document.getElementById('filter-category-select');
    const filterSort = document.getElementById('sort-select');

    // Accessibility Facility Checkboxes
    const chkWheelchair = document.getElementById('filter-wheelchair');
    const chkRamp = document.getElementById('filter-ramp');
    const chkWashroom = document.getElementById('filter-washroom');
    const chkElevator = document.getElementById('filter-elevator');
    const chkParking = document.getElementById('filter-parking');

    const btnResetFilters = document.getElementById('btn-reset-filters');
    const btnResetFiltersEmpty = document.getElementById('btn-reset-filters-empty');

    let debounceTimer;
    const onFilterChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        window.Places.currentFilters.q = filterKeyword ? filterKeyword.value.trim() : '';
        window.Places.currentFilters.city = filterCity ? filterCity.value : '';
        window.Places.currentFilters.category = filterCategory ? filterCategory.value : '';
        window.Places.currentFilters.sort = filterSort ? filterSort.value : 'newest';

        window.Places.currentFilters.wheelchair = chkWheelchair ? chkWheelchair.checked : false;
        window.Places.currentFilters.ramp = chkRamp ? chkRamp.checked : false;
        window.Places.currentFilters.washroom = chkWashroom ? chkWashroom.checked : false;
        window.Places.currentFilters.elevator = chkElevator ? chkElevator.checked : false;
        window.Places.currentFilters.parking = chkParking ? chkParking.checked : false;

        window.Places.currentFilters.page = 1;
        window.Places.searchPlaces();
      }, 250);
    };

    if (filterKeyword) filterKeyword.addEventListener('input', onFilterChange);
    if (filterCity) filterCity.addEventListener('change', onFilterChange);
    if (filterCategory) filterCategory.addEventListener('change', onFilterChange);
    if (filterSort) filterSort.addEventListener('change', onFilterChange);

    [chkWheelchair, chkRamp, chkWashroom, chkElevator, chkParking].forEach(chk => {
      if (chk) chk.addEventListener('change', onFilterChange);
    });

    const resetFilters = () => {
      if (filterKeyword) filterKeyword.value = '';
      if (filterCity) filterCity.value = '';
      if (filterCategory) filterCategory.value = '';
      if (filterSort) filterSort.value = 'newest';
      [chkWheelchair, chkRamp, chkWashroom, chkElevator, chkParking].forEach(chk => {
        if (chk) chk.checked = false;
      });

      window.Places.currentFilters = {
        q: '',
        city: '',
        category: '',
        wheelchair: false,
        ramp: false,
        washroom: false,
        elevator: false,
        parking: false,
        sort: 'newest',
        page: 1,
        limit: 9
      };
      window.Places.searchPlaces();
    };

    if (btnResetFilters) btnResetFilters.addEventListener('click', resetFilters);
    if (btnResetFiltersEmpty) btnResetFiltersEmpty.addEventListener('click', resetFilters);

    // Mobile nav toggle
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
      });
    }

    // Hero category pills
    document.querySelectorAll('.hero-category-pills .pill-btn').forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.getAttribute('data-category');
        if (filterCategory) filterCategory.value = cat;
        window.Places.currentFilters.category = cat;
        App.navigate('search');
        window.Places.searchPlaces();
      });
    });
  },

  /**
   * Modal Management (Login, Register, Profile, Admin modals)
   */
  initModalListeners() {
    // Close modal on backdrop click or close button
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('modal-close-btn') || e.target.closest('.modal-close-btn')) {
          App.closeAllModals();
        }
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        App.closeAllModals();
      }
    });

    // Login Form Submit
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;
        const remember = loginForm.remember ? loginForm.remember.checked : true;

        try {
          await window.Auth.login(email, password, remember);
          App.closeAllModals();
        } catch (err) {
          // Handled by Auth
        }
      });
    }

    // Quick fill demo credentials buttons
    const btnFillAdmin = document.getElementById('btn-fill-admin-creds');
    const btnFillUser = document.getElementById('btn-fill-user-creds');
    if (btnFillAdmin && loginForm) {
      btnFillAdmin.addEventListener('click', () => {
        loginForm.email.value = 'admin@accessibleplacefinder.org';
        loginForm.password.value = 'Admin@12345';
      });
    }
    if (btnFillUser && loginForm) {
      btnFillUser.addEventListener('click', () => {
        loginForm.email.value = 'sarah.jenkins@example.com';
        loginForm.password.value = 'User@12345';
      });
    }

    // Switch between Login and Register modals
    const linkSwitchRegister = document.getElementById('link-switch-register');
    const linkSwitchLogin = document.getElementById('link-switch-login');
    if (linkSwitchRegister) {
      linkSwitchRegister.addEventListener('click', (e) => {
        e.preventDefault();
        App.closeAllModals();
        App.openRegisterModal();
      });
    }
    if (linkSwitchLogin) {
      linkSwitchLogin.addEventListener('click', (e) => {
        e.preventDefault();
        App.closeAllModals();
        App.openLoginModal();
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('form-register');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm.name.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value;
        const confirmPassword = registerForm.confirmPassword.value;

        if (password !== confirmPassword) {
          window.API.showToast('Passwords do not match', 'warning');
          return;
        }

        const accessibilityPreferences = [];
        if (registerForm.prefWheelchair && registerForm.prefWheelchair.checked) accessibilityPreferences.push('wheelchair');
        if (registerForm.prefRamp && registerForm.prefRamp.checked) accessibilityPreferences.push('ramps');
        if (registerForm.prefWashroom && registerForm.prefWashroom.checked) accessibilityPreferences.push('washroom');
        if (registerForm.prefElevator && registerForm.prefElevator.checked) accessibilityPreferences.push('elevator');

        try {
          await window.Auth.register({ name, email, password, accessibilityPreferences });
          App.closeAllModals();
        } catch (err) {
          // Handled
        }
      });
    }

    // Profile Form Submit
    const profileForm = document.getElementById('form-profile');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = profileForm.name.value.trim();
        const accessibilityPreferences = [];
        if (profileForm.prefWheelchair && profileForm.prefWheelchair.checked) accessibilityPreferences.push('wheelchair');
        if (profileForm.prefRamp && profileForm.prefRamp.checked) accessibilityPreferences.push('ramps');
        if (profileForm.prefWashroom && profileForm.prefWashroom.checked) accessibilityPreferences.push('washroom');
        if (profileForm.prefElevator && profileForm.prefElevator.checked) accessibilityPreferences.push('elevator');

        try {
          await window.Auth.updateProfile({ name, accessibilityPreferences });
          App.closeAllModals();
        } catch (err) {}
      });
    }

    // Inaccuracy Report Form Submit
    const reportForm = document.getElementById('report-inaccuracy-form');
    if (reportForm) {
      reportForm.addEventListener('submit', window.Reports.handleReportSubmit);
    }

    // Admin Place Form Submit
    const adminPlaceForm = document.getElementById('admin-place-form');
    if (adminPlaceForm) {
      adminPlaceForm.addEventListener('submit', window.Admin.handlePlaceSubmit);
    }

    // Admin Resolve Report Form Submit
    const adminReportForm = document.getElementById('admin-resolve-report-form');
    if (adminReportForm) {
      adminReportForm.addEventListener('submit', window.Admin.handleResolveReportSubmit);
    }

    // Admin Add New Place Button
    const btnAddPlace = document.getElementById('btn-admin-add-place');
    if (btnAddPlace) {
      btnAddPlace.addEventListener('click', () => {
        window.Admin.openPlaceModal();
      });
    }

    // Admin Places Search Input
    const adminPlaceSearch = document.getElementById('admin-place-search');
    if (adminPlaceSearch) {
      adminPlaceSearch.addEventListener('input', () => {
        window.Admin.loadPlaces(1);
      });
    }
  },

  openLoginModal() {
    const modal = document.getElementById('modal-login');
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const emailInput = modal.querySelector('input[name="email"]');
      if (emailInput) setTimeout(() => emailInput.focus(), 100);
    }
  },

  openRegisterModal() {
    const modal = document.getElementById('modal-register');
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const nameInput = modal.querySelector('input[name="name"]');
      if (nameInput) setTimeout(() => nameInput.focus(), 100);
    }
  },

  async openProfileModal() {
    if (!window.Auth.isAuthenticated()) return;
    const modal = document.getElementById('modal-profile');
    const form = document.getElementById('form-profile');
    if (!modal || !form) return;

    const u = window.Auth.currentUser;
    form.name.value = u.name || '';
    form.email.value = u.email || '';

    // Check preferences
    const prefs = u.accessibilityPreferences || [];
    if (form.prefWheelchair) form.prefWheelchair.checked = prefs.includes('wheelchair');
    if (form.prefRamp) form.prefRamp.checked = prefs.includes('ramps');
    if (form.prefWashroom) form.prefWashroom.checked = prefs.includes('washroom');
    if (form.prefElevator) form.prefElevator.checked = prefs.includes('elevator');

    // Load user's submitted reviews and reports
    const myReviewsList = document.getElementById('profile-my-reviews');
    const myReportsList = document.getElementById('profile-my-reports');

    try {
      if (myReviewsList) {
        myReviewsList.innerHTML = '<p style="color:var(--text-light); text-align:center;">Loading your reviews...</p>';
        const revRes = await window.Auth.getMyReviews();
        if (revRes.success && revRes.reviews.length > 0) {
          myReviewsList.innerHTML = revRes.reviews.map(r => `
            <div class="review-item">
              <div class="review-header">
                <strong>${window.API.escapeHtml(r.place ? r.place.name : 'Location')}</strong>
                <span class="review-stars">${'★'.repeat(r.rating)}</span>
              </div>
              <p class="review-comment">${window.API.escapeHtml(r.comment)}</p>
              <div style="text-align:right; margin-top:0.5rem;">
                <button class="btn btn-danger btn-sm btn-delete-my-review" data-id="${r._id}">Delete Review</button>
              </div>
            </div>
          `).join('');

          myReviewsList.querySelectorAll('.btn-delete-my-review').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              if (!confirm('Are you sure you want to delete your review?')) return;
              try {
                await window.API.apiRequest(`/reviews/${id}`, { method: 'DELETE' });
                window.API.showToast('Review deleted', 'success');
                App.openProfileModal(); // Refresh modal
                window.Places.searchPlaces();
              } catch (e) {
                window.API.showToast(e.message || 'Failed to delete review', 'error');
              }
            });
          });
        } else {
          myReviewsList.innerHTML = '<p style="color:var(--text-light); text-align:center;">You have not written any reviews yet.</p>';
        }
      }

      if (myReportsList) {
        myReportsList.innerHTML = '<p style="color:var(--text-light); text-align:center;">Loading your reports...</p>';
        const repRes = await window.Auth.getMyReports();
        if (repRes.success && repRes.reports.length > 0) {
          myReportsList.innerHTML = repRes.reports.map(rep => `
            <div class="review-item">
              <div class="review-header">
                <strong>${window.API.escapeHtml(rep.place ? rep.place.name : 'Location')}</strong>
                <span class="status-badge status-${rep.status}">${window.API.escapeHtml(rep.status)}</span>
              </div>
              <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:0.25rem;"><strong>Issue:</strong> ${window.API.escapeHtml(rep.issueType)} (${window.API.escapeHtml(rep.facilityAffected || 'General')})</p>
              <p class="review-comment">${window.API.escapeHtml(rep.description)}</p>
              ${rep.adminNotes ? `<small style="display:block; margin-top:0.35rem; color:var(--primary-dark);">📝 Admin response: ${window.API.escapeHtml(rep.adminNotes)}</small>` : ''}
            </div>
          `).join('');
        } else {
          myReportsList.innerHTML = '<p style="color:var(--text-light); text-align:center;">You have not submitted any inaccuracy reports.</p>';
        }
      }
    } catch (e) {
      console.error(e);
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
    window.Admin.editingPlaceId = null;
  }
};

window.App = App;

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
