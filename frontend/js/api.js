/**
 * Accessible Place Finder - REST Client & API Utilities
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? (window.location.port === '5500' || window.location.port === '3000' ? 'http://localhost:5000/api' : '/api')
  : '/api';

/**
 * Token management
 */
const TokenManager = {
  getToken: () => localStorage.getItem('apf_token') || sessionStorage.getItem('apf_token'),
  setToken: (token, remember = true) => {
    if (remember) {
      localStorage.setItem('apf_token', token);
    } else {
      sessionStorage.setItem('apf_token', token);
    }
  },
  removeToken: () => {
    localStorage.removeItem('apf_token');
    sessionStorage.removeItem('apf_token');
  },
  hasToken: () => Boolean(TokenManager.getToken())
};

/**
 * Generic HTTP Request Wrapper
 */
async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const token = TokenManager.getToken();

  const headers = { ...options.headers };

  // Set default JSON Content-Type unless body is FormData (for file uploads)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach Bearer token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Screen Reader Accessible Toast Notifications
 */
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.5rem;">
      <span aria-hidden="true">${iconMap[type] || 'ℹ️'}</span>
      <span>${escapeHtml(message)}</span>
    </div>
    <button class="toast-close" aria-label="Close notification" style="color:var(--text-light); font-size:1.1rem;">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);
  }
}

/**
 * XSS sanitizer utility for text interpolation
 */
function escapeHtml(string) {
  if (string === null || string === undefined) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.API = {
  apiRequest,
  TokenManager,
  showToast,
  escapeHtml,
  API_BASE_URL
};
