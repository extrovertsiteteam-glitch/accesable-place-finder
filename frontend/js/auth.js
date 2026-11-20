/**
 * Accessible Place Finder - Authentication & User State Management
 */

const Auth = {
  currentUser: null,

  async init() {
    if (window.API.TokenManager.hasToken()) {
      try {
        const response = await window.API.apiRequest('/auth/me');
        if (response.success && response.user) {
          Auth.currentUser = response.user;
        } else {
          window.API.TokenManager.removeToken();
          Auth.currentUser = null;
        }
      } catch (err) {
        window.API.TokenManager.removeToken();
        Auth.currentUser = null;
      }
    } else {
      Auth.currentUser = null;
    }
    Auth.renderAuthUI();
  },

  isAuthenticated() {
    return Boolean(Auth.currentUser && window.API.TokenManager.hasToken());
  },

  isAdmin() {
    return Boolean(Auth.currentUser && Auth.currentUser.role === 'admin');
  },

  async login(email, password, remember = true) {
    try {
      const response = await window.API.apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success && response.token) {
        window.API.TokenManager.setToken(response.token, remember);
        Auth.currentUser = response.user;
        Auth.renderAuthUI();
        window.API.showToast(`Welcome back, ${response.user.name}!`, 'success');
        return response.user;
      }
    } catch (err) {
      window.API.showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  },

  async register(userData, remember = true) {
    try {
      const response = await window.API.apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.success && response.token) {
        window.API.TokenManager.setToken(response.token, remember);
        Auth.currentUser = response.user;
        Auth.renderAuthUI();
        window.API.showToast('Account registered successfully! Welcome to Accessible Place Finder.', 'success');
        return response.user;
      }
    } catch (err) {
      window.API.showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  },

  logout() {
    window.API.TokenManager.removeToken();
    Auth.currentUser = null;
    Auth.renderAuthUI();
    window.API.showToast('You have been logged out.', 'info');
    if (window.App && typeof window.App.navigate === 'function') {
      window.App.navigate('home');
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await window.API.apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });

      if (response.success && response.user) {
        Auth.currentUser = { ...Auth.currentUser, ...response.user };
        Auth.renderAuthUI();
        window.API.showToast('Profile updated successfully!', 'success');
        return response.user;
      }
    } catch (err) {
      window.API.showToast(err.message || 'Failed to update profile', 'error');
      throw err;
    }
  },

  async getMyReviews() {
    return await window.API.apiRequest('/users/my-reviews');
  },

  async getMyReports() {
    return await window.API.apiRequest('/users/my-reports');
  },

  renderAuthUI() {
    const authActionsContainer = document.getElementById('nav-auth-actions');
    const adminNavLink = document.getElementById('nav-admin-link');

    if (!authActionsContainer) return;

    if (Auth.isAuthenticated()) {
      // Show admin link if role === 'admin'
      if (adminNavLink) {
        adminNavLink.style.display = Auth.isAdmin() ? 'inline-block' : 'none';
      }

      authActionsContainer.innerHTML = `
        <button id="btn-user-profile" class="btn btn-outline btn-sm" aria-label="Open user profile menu">
          <span>👤</span>
          <span style="font-weight:700;">${window.API.escapeHtml(Auth.currentUser.name.split(' ')[0])}</span>
          ${Auth.isAdmin() ? '<span class="status-badge status-investigating" style="font-size:0.65rem; margin-left:0.25rem;">ADMIN</span>' : ''}
        </button>
        <button id="btn-logout" class="btn btn-outline btn-sm" aria-label="Sign out of your account">
          <span>Logout</span>
        </button>
      `;

      document.getElementById('btn-user-profile').addEventListener('click', () => {
        if (window.App) window.App.openProfileModal();
      });

      document.getElementById('btn-logout').addEventListener('click', () => {
        Auth.logout();
      });
    } else {
      if (adminNavLink) {
        adminNavLink.style.display = 'none';
      }

      authActionsContainer.innerHTML = `
        <button id="btn-open-login" class="btn btn-outline btn-sm">Login</button>
        <button id="btn-open-register" class="btn btn-primary btn-sm">Register</button>
      `;

      document.getElementById('btn-open-login').addEventListener('click', () => {
        if (window.App) window.App.openLoginModal();
      });

      document.getElementById('btn-open-register').addEventListener('click', () => {
        if (window.App) window.App.openRegisterModal();
      });
    }
  }
};

window.Auth = Auth;
