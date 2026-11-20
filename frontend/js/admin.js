/**
 * Accessible Place Finder - Administrator Dashboard & Moderation Controller
 */

const Admin = {
  currentTab: 'places', // 'places' | 'reviews' | 'reports' | 'stats'
  editingPlaceId: null,

  async initDashboard() {
    if (!window.Auth.isAdmin()) {
      const container = document.getElementById('admin-view-container');
      if (container) {
        container.innerHTML = `
          <div class="empty-state" style="margin-top:3rem;">
            <div class="empty-state-icon">🔒</div>
            <h2 class="empty-state-title">Administrator Access Required</h2>
            <p class="empty-state-text">You must be logged in as an administrator to view this control panel.</p>
            <button class="btn btn-primary" onclick="window.App.openLoginModal()">Login as Administrator</button>
          </div>
        `;
      }
      return;
    }

    Admin.setupTabNavigation();
    await Admin.loadStats();
    await Admin.loadPlaces();
  },

  setupTabNavigation() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        Admin.switchTab(tab);
      });
    });
  },

  switchTab(tab) {
    Admin.currentTab = tab;
    document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
    const target = document.getElementById(`admin-tab-${tab}`);
    if (target) target.style.display = 'block';

    if (tab === 'places') Admin.loadPlaces();
    else if (tab === 'reviews') Admin.loadReviews();
    else if (tab === 'reports') Admin.loadReports();
    else if (tab === 'stats') Admin.loadStats();
  },

  /**
   * Load Dashboard KPI Stats
   */
  async loadStats() {
    try {
      const response = await window.API.apiRequest('/admin/stats');
      if (response.success && response.stats) {
        const s = response.stats;
        const totalPlacesEl = document.getElementById('stat-total-places');
        const totalUsersEl = document.getElementById('stat-total-users');
        const totalReviewsEl = document.getElementById('stat-total-reviews');
        const pendingReportsEl = document.getElementById('stat-pending-reports');

        if (totalPlacesEl) totalPlacesEl.textContent = s.totalPlaces;
        if (totalUsersEl) totalUsersEl.textContent = s.totalUsers;
        if (totalReviewsEl) totalReviewsEl.textContent = s.totalReviews;
        if (pendingReportsEl) pendingReportsEl.textContent = s.pendingReports;
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  },

  /**
   * Load and render admin places table
   */
  async loadPlaces(page = 1) {
    const tableBody = document.getElementById('admin-places-tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">Loading places...</td></tr>';

    try {
      const q = document.getElementById('admin-place-search') ? document.getElementById('admin-place-search').value.trim() : '';
      const response = await window.API.apiRequest(`/admin/places?page=${page}&q=${encodeURIComponent(q)}`);

      if (response.success && response.places.length > 0) {
        tableBody.innerHTML = response.places.map(p => `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <img src="${window.Places.getPlaceImage(p)}" alt="" style="width:48px; height:48px; border-radius:6px; object-fit:cover;" />
                <div>
                  <strong style="display:block; font-size:0.95rem;">${window.API.escapeHtml(p.name)}</strong>
                  <span style="font-size:0.8rem; color:var(--text-light);">${window.API.escapeHtml(p.address)}</span>
                </div>
              </div>
            </td>
            <td><span class="status-badge" style="background:#e0f2fe; color:#0369a1;">${window.API.escapeHtml(p.category)}</span></td>
            <td>${window.API.escapeHtml(p.city)}</td>
            <td>
              <div style="display:flex; gap:0.25rem; flex-wrap:wrap;">
                ${p.wheelchairAccessible ? '<span title="Wheelchair">♿</span>' : ''}
                ${p.rampAvailable ? '<span title="Ramp">📐</span>' : ''}
                ${p.accessibleWashroom ? '<span title="Washroom">🚻</span>' : ''}
                ${p.elevatorAvailable ? '<span title="Elevator">🛗</span>' : ''}
                ${p.accessibleParking ? '<span title="Parking">🅿️</span>' : ''}
              </div>
            </td>
            <td>⭐ ${p.averageRating.toFixed(1)} (${p.reviewCount})</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-outline btn-sm btn-edit-place" data-id="${p._id}">✏️ Edit</button>
                <button class="btn btn-danger btn-sm btn-delete-place" data-id="${p._id}" data-name="${window.API.escapeHtml(p.name)}">🗑️</button>
              </div>
            </td>
          </tr>
        `).join('');

        // Attach edit listeners
        tableBody.querySelectorAll('.btn-edit-place').forEach(btn => {
          btn.addEventListener('click', () => {
            Admin.openPlaceModal(btn.getAttribute('data-id'));
          });
        });

        // Attach delete listeners
        tableBody.querySelectorAll('.btn-delete-place').forEach(btn => {
          btn.addEventListener('click', () => {
            const placeId = btn.getAttribute('data-id');
            const placeName = btn.getAttribute('data-name');
            Admin.confirmDeletePlace(placeId, placeName);
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-light);">No places found.</td></tr>';
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:2rem;">Error: ${err.message}</td></tr>`;
    }
  },

  /**
   * Open Add or Edit Place Modal
   */
  async openPlaceModal(placeId = null) {
    Admin.editingPlaceId = placeId;
    const modal = document.getElementById('modal-admin-place');
    const form = document.getElementById('admin-place-form');
    const modalTitle = document.getElementById('admin-place-modal-title');

    if (!modal || !form) return;

    form.reset();

    if (placeId) {
      modalTitle.textContent = 'Edit Place Details';
      try {
        const response = await window.API.apiRequest(`/places/${placeId}`);
        if (response.success && response.place) {
          const p = response.place;
          form.name.value = p.name || '';
          form.category.value = p.category || '';
          form.description.value = p.description || '';
          form.address.value = p.address || '';
          form.city.value = p.city || '';
          form.contactPhone.value = p.contactPhone || '';
          form.contactEmail.value = p.contactEmail || '';
          form.website.value = p.website || '';
          form.openingHours.value = p.openingHours || '';
          form.photoUrl.value = (p.photos && p.photos[0]) || '';
          form.additionalAccessibility.value = p.additionalAccessibility || '';

          form.wheelchairAccessible.checked = Boolean(p.wheelchairAccessible);
          form.rampAvailable.checked = Boolean(p.rampAvailable);
          form.accessibleWashroom.checked = Boolean(p.accessibleWashroom);
          form.elevatorAvailable.checked = Boolean(p.elevatorAvailable);
          form.accessibleParking.checked = Boolean(p.accessibleParking);
        }
      } catch (err) {
        window.API.showToast('Failed to load place details for editing', 'error');
        return;
      }
    } else {
      modalTitle.textContent = 'Add New Accessible Place';
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  closePlaceModal() {
    const modal = document.getElementById('modal-admin-place');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      Admin.editingPlaceId = null;
    }
  },

  /**
   * Handle Add / Edit Place Form Submit
   */
  async handlePlaceSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();

    // Append text fields
    formData.append('name', form.name.value.trim());
    formData.append('category', form.category.value.trim());
    formData.append('description', form.description.value.trim());
    formData.append('address', form.address.value.trim());
    formData.append('city', form.city.value.trim());
    formData.append('contactPhone', form.contactPhone.value.trim());
    formData.append('contactEmail', form.contactEmail.value.trim());
    formData.append('website', form.website.value.trim());
    formData.append('openingHours', form.openingHours.value.trim());
    formData.append('additionalAccessibility', form.additionalAccessibility.value.trim());
    formData.append('photoUrl', form.photoUrl.value.trim());

    // Append boolean accessibility flags
    formData.append('wheelchairAccessible', form.wheelchairAccessible.checked);
    formData.append('rampAvailable', form.rampAvailable.checked);
    formData.append('accessibleWashroom', form.accessibleWashroom.checked);
    formData.append('elevatorAvailable', form.elevatorAvailable.checked);
    formData.append('accessibleParking', form.accessibleParking.checked);

    // Optional photo file upload
    if (form.photo && form.photo.files && form.photo.files[0]) {
      formData.append('photo', form.photo.files[0]);
    }

    try {
      const endpoint = Admin.editingPlaceId
        ? `/admin/places/${Admin.editingPlaceId}`
        : '/admin/places';
      const method = Admin.editingPlaceId ? 'PUT' : 'POST';

      const response = await window.API.apiRequest(endpoint, {
        method,
        body: formData
      });

      if (response.success) {
        window.API.showToast(response.message || 'Place saved successfully!', 'success');
        Admin.closePlaceModal();
        Admin.loadPlaces();
        Admin.loadStats();
        // Refresh home/search view places
        if (window.Places) {
          window.Places.loadPopularPlaces();
          window.Places.loadRecentPlaces();
        }
      }
    } catch (err) {
      window.API.showToast(err.message || 'Failed to save place', 'error');
    }
  },

  /**
   * Confirm & Delete Place
   */
  async confirmDeletePlace(placeId, placeName) {
    if (!confirm(`Are you sure you want to delete "${placeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await window.API.apiRequest(`/admin/places/${placeId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        window.API.showToast(response.message || 'Place deleted successfully', 'success');
        Admin.loadPlaces();
        Admin.loadStats();
        if (window.Places) {
          window.Places.searchPlaces();
          window.Places.loadPopularPlaces();
        }
      }
    } catch (err) {
      window.API.showToast(err.message || 'Failed to delete place', 'error');
    }
  },

  /**
   * Load and moderate reviews
   */
  async loadReviews() {
    const tableBody = document.getElementById('admin-reviews-tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">Loading reviews...</td></tr>';

    try {
      const response = await window.API.apiRequest('/admin/reviews');
      if (response.success && response.reviews.length > 0) {
        tableBody.innerHTML = response.reviews.map(r => `
          <tr>
            <td><strong>${window.API.escapeHtml(r.place ? r.place.name : 'Unknown Place')}</strong></td>
            <td>${window.API.escapeHtml(r.user ? r.user.name : 'Unknown User')}</td>
            <td><span class="review-stars">${'★'.repeat(r.rating)}</span> (${r.rating}/5)</td>
            <td style="max-width:320px;">${window.API.escapeHtml(r.comment)}</td>
            <td>${new Date(r.createdAt).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-danger btn-sm btn-admin-delete-review" data-id="${r._id}">🗑️ Delete</button>
            </td>
          </tr>
        `).join('');

        tableBody.querySelectorAll('.btn-admin-delete-review').forEach(btn => {
          btn.addEventListener('click', async () => {
            const revId = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this review?')) return;
            try {
              const delRes = await window.API.apiRequest(`/admin/reviews/${revId}`, { method: 'DELETE' });
              if (delRes.success) {
                window.API.showToast('Review removed by administrator', 'success');
                Admin.loadReviews();
                Admin.loadStats();
              }
            } catch (err) {
              window.API.showToast(err.message || 'Failed to delete review', 'error');
            }
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-light);">No user reviews submitted yet.</td></tr>';
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:2rem;">Error: ${err.message}</td></tr>`;
    }
  },

  /**
   * Load and moderate community reports
   */
  async loadReports(statusFilter = '') {
    const tableBody = document.getElementById('admin-reports-tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">Loading accessibility reports...</td></tr>';

    try {
      const endpoint = statusFilter ? `/admin/reports?status=${statusFilter}` : '/admin/reports';
      const response = await window.API.apiRequest(endpoint);

      if (response.success && response.reports.length > 0) {
        tableBody.innerHTML = response.reports.map(rep => `
          <tr>
            <td><strong>${window.API.escapeHtml(rep.place ? rep.place.name : 'Unknown Place')}</strong></td>
            <td><span class="status-badge" style="background:#fee2e2; color:#991b1b;">${window.API.escapeHtml(rep.issueType)}</span></td>
            <td>${window.API.escapeHtml(rep.facilityAffected || 'General')}</td>
            <td style="max-width:300px;">
              <p style="margin:0; font-size:0.9rem;">${window.API.escapeHtml(rep.description)}</p>
              ${rep.adminNotes ? `<small style="color:var(--primary-dark); display:block; margin-top:0.35rem;">📝 Admin Note: ${window.API.escapeHtml(rep.adminNotes)}</small>` : ''}
            </td>
            <td><span class="status-badge status-${rep.status}">${window.API.escapeHtml(rep.status)}</span></td>
            <td>
              <button class="btn btn-outline btn-sm btn-update-report" data-id="${rep._id}" data-status="${rep.status}" data-notes="${window.API.escapeHtml(rep.adminNotes || '')}">
                Resolve / Update
              </button>
            </td>
          </tr>
        `).join('');

        tableBody.querySelectorAll('.btn-update-report').forEach(btn => {
          btn.addEventListener('click', () => {
            Admin.openResolveReportModal(
              btn.getAttribute('data-id'),
              btn.getAttribute('data-status'),
              btn.getAttribute('data-notes')
            );
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-light);">No inaccuracy reports found.</td></tr>';
      }
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:2rem;">Error: ${err.message}</td></tr>`;
    }
  },

  openResolveReportModal(reportId, currentStatus, currentNotes) {
    const modal = document.getElementById('modal-admin-resolve-report');
    const form = document.getElementById('admin-resolve-report-form');
    if (!modal || !form) return;

    form.reportId.value = reportId;
    form.status.value = currentStatus;
    form.adminNotes.value = currentNotes || '';

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  closeResolveReportModal() {
    const modal = document.getElementById('modal-admin-resolve-report');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  },

  async handleResolveReportSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const reportId = form.reportId.value;
    const status = form.status.value;
    const adminNotes = form.adminNotes.value.trim();

    try {
      const response = await window.API.apiRequest(`/admin/reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNotes })
      });

      if (response.success) {
        window.API.showToast(response.message || 'Report status updated successfully', 'success');
        Admin.closeResolveReportModal();
        Admin.loadReports();
        Admin.loadStats();
      }
    } catch (err) {
      window.API.showToast(err.message || 'Failed to update report', 'error');
    }
  }
};

window.Admin = Admin;
