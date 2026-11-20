/**
 * Accessible Place Finder - Accessibility Inaccuracy Reporting System
 */

const Reports = {
  currentPlaceId: null,

  openReportModal(placeId, placeName) {
    Reports.currentPlaceId = placeId;
    const modal = document.getElementById('modal-report-inaccuracy');
    const titleEl = document.getElementById('report-modal-place-name');
    const form = document.getElementById('report-inaccuracy-form');

    if (!modal || !form) return;

    if (titleEl) {
      titleEl.textContent = placeName;
    }

    form.reset();

    // Auto-fill user details if logged in
    if (window.Auth && window.Auth.isAuthenticated()) {
      const u = window.Auth.currentUser;
      if (form.reporterName) form.reporterName.value = u.name;
      if (form.reporterEmail) form.reporterEmail.value = u.email;
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  closeReportModal() {
    const modal = document.getElementById('modal-report-inaccuracy');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  },

  async handleReportSubmit(e) {
    e.preventDefault();
    if (!Reports.currentPlaceId) return;

    const form = e.target;
    const issueType = form.issueType.value;
    const facilityAffected = form.facilityAffected.value;
    const description = form.description.value.trim();
    const reporterName = form.reporterName ? form.reporterName.value.trim() : '';
    const reporterEmail = form.reporterEmail ? form.reporterEmail.value.trim() : '';

    if (!description || description.length < 10) {
      window.API.showToast('Please provide a detailed description (at least 10 characters)', 'warning');
      return;
    }

    try {
      const response = await window.API.apiRequest(`/places/${Reports.currentPlaceId}/reports`, {
        method: 'POST',
        body: JSON.stringify({
          issueType,
          facilityAffected,
          description,
          reporterName,
          reporterEmail
        })
      });

      if (response.success) {
        window.API.showToast(response.message || 'Thank you! Your inaccuracy report has been submitted.', 'success', 5000);
        Reports.closeReportModal();
      }
    } catch (err) {
      window.API.showToast(err.message || 'Failed to submit report', 'error');
    }
  }
};

window.Reports = Reports;
