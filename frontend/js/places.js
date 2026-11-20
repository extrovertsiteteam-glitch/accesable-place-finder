/**
 * Accessible Place Finder - Places Discovery, Search, Filtering & Detail Display
 */

const Places = {
  currentFilters: {
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
  },

  categoryIcons: {
    'Healthcare': '🏥',
    'Restaurant & Cafe': '☕',
    'Education & Library': '📚',
    'Park & Recreation': '🌳',
    'Shopping & Mall': '🛍️',
    'Transit & Station': '🚆',
    'Museum & Culture': '🏛️',
    'Government & Public': '🏛️',
    'Other': '📍'
  },

  // Fallback high quality accessible place images
  defaultImages: {
    'Healthcare': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    'Restaurant & Cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    'Education & Library': 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    'Park & Recreation': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    'Shopping & Mall': 'https://images.unsplash.com/photo-1567449303183-ae0d6ed1498e?auto=format&fit=crop&w=800&q=80',
    'Transit & Station': 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    'Museum & Culture': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=800&q=80',
    'Government & Public': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    'Other': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
  },

  getPlaceImage(place) {
    if (place.photos && place.photos.length > 0 && place.photos[0]) {
      const photo = place.photos[0];
      return photo.startsWith('http') ? photo : photo;
    }
    return Places.defaultImages[place.category] || Places.defaultImages['Other'];
  },

  /**
   * Render Place Card HTML
   */
  createPlaceCardHTML(place) {
    const imageUrl = Places.getPlaceImage(place);
    const ratingDisplay = place.averageRating > 0
      ? `⭐ ${place.averageRating.toFixed(1)} (${place.reviewCount})`
      : '⭐ New (0 reviews)';

    return `
      <article class="place-card" data-id="${place._id}">
        <div class="place-card-image">
          <img src="${imageUrl}" alt="Photo of ${window.API.escapeHtml(place.name)}" loading="lazy" />
          <span class="place-card-category-badge">${Places.categoryIcons[place.category] || '📍'} ${window.API.escapeHtml(place.category)}</span>
          <span class="place-card-rating-badge">${ratingDisplay}</span>
        </div>
        <div class="place-card-body">
          <div class="place-card-city">📍 ${window.API.escapeHtml(place.city)}</div>
          <h3 class="place-card-title">${window.API.escapeHtml(place.name)}</h3>
          <p class="place-card-desc">${window.API.escapeHtml(place.description)}</p>

          <div class="facilities-list" aria-label="Accessibility facilities available at this location">
            ${place.wheelchairAccessible ? '<span class="facility-badge badge-wheelchair" title="Wheelchair Accessible">♿ Wheelchair</span>' : '<span class="facility-badge badge-unavailable" title="Wheelchair Inaccessible">♿ No Wheelchair</span>'}
            ${place.rampAvailable ? '<span class="facility-badge badge-ramp" title="Accessible Ramp">📐 Ramp</span>' : ''}
            ${place.accessibleWashroom ? '<span class="facility-badge badge-washroom" title="Accessible Washroom">🚻 Washroom</span>' : ''}
            ${place.elevatorAvailable ? '<span class="facility-badge badge-elevator" title="Elevator Available">🛗 Elevator</span>' : ''}
            ${place.accessibleParking ? '<span class="facility-badge badge-parking" title="Accessible Parking">🅿️ Parking</span>' : ''}
          </div>

          <div class="place-card-footer">
            <span style="font-size:0.85rem; color:var(--text-light);">${window.API.escapeHtml(place.address.substring(0, 30))}...</span>
            <button class="btn btn-primary btn-sm btn-view-place" data-id="${place._id}">View Details</button>
          </div>
        </div>
      </article>
    `;
  },

  /**
   * Load Popular Places for Home Page
   */
  async loadPopularPlaces() {
    const container = document.getElementById('popular-places-grid');
    if (!container) return;

    try {
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem;">Loading popular places...</div>';
      const response = await window.API.apiRequest('/places/popular');
      if (response.success && response.places.length > 0) {
        container.innerHTML = response.places.map(p => Places.createPlaceCardHTML(p)).join('');
        Places.attachCardListeners(container);
      } else {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-light);">No places found yet. Be the first to add one!</div>';
      }
    } catch (err) {
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--danger);">Unable to load places. Please check backend connection.</div>';
    }
  },

  /**
   * Load Recent Places for Home Page
   */
  async loadRecentPlaces() {
    const container = document.getElementById('recent-places-grid');
    if (!container) return;

    try {
      const response = await window.API.apiRequest('/places/recent');
      if (response.success && response.places.length > 0) {
        container.innerHTML = response.places.map(p => Places.createPlaceCardHTML(p)).join('');
        Places.attachCardListeners(container);
      } else {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-light);">No recent places.</div>';
      }
    } catch (err) {
      console.error(err);
    }
  },

  /**
   * Load Category Cards on Home Page
   */
  async loadCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    try {
      const response = await window.API.apiRequest('/places/categories');
      if (response.success && response.categories) {
        container.innerHTML = response.categories.map(cat => `
          <a href="#" class="category-card" data-category="${window.API.escapeHtml(cat.name)}">
            <div class="category-icon">${Places.categoryIcons[cat.name] || '📍'}</div>
            <div class="category-name">${window.API.escapeHtml(cat.name)}</div>
            <div class="category-count">${cat.count} places listed</div>
          </a>
        `).join('');

        container.querySelectorAll('.category-card').forEach(card => {
          card.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = card.getAttribute('data-category');
            Places.currentFilters.category = cat;
            if (window.App) window.App.navigate('search');
            Places.searchPlaces();
          });
        });
      }
    } catch (err) {
      console.error(err);
    }
  },

  /**
   * Populate Cities Dropdown
   */
  async loadCities() {
    const select = document.getElementById('filter-city-select');
    if (!select) return;

    try {
      const response = await window.API.apiRequest('/places/cities');
      if (response.success && response.cities) {
        const currentVal = select.value;
        select.innerHTML = '<option value="">All Cities</option>' +
          response.cities.map(c => `<option value="${window.API.escapeHtml(c)}">${window.API.escapeHtml(c)}</option>`).join('');
        select.value = currentVal;
      }
    } catch (err) {
      console.error(err);
    }
  },

  /**
   * Perform search & filtering with current criteria
   */
  async searchPlaces() {
    const grid = document.getElementById('search-places-grid');
    const emptyState = document.getElementById('search-empty-state');
    const resultsCountEl = document.getElementById('search-results-count');
    const paginationEl = document.getElementById('search-pagination');

    if (!grid) return;

    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem;">🔍 Searching accessible places...</div>';
    if (emptyState) emptyState.style.display = 'none';

    // Build query params
    const params = new URLSearchParams();
    if (Places.currentFilters.q) params.append('q', Places.currentFilters.q);
    if (Places.currentFilters.city) params.append('city', Places.currentFilters.city);
    if (Places.currentFilters.category) params.append('category', Places.currentFilters.category);
    if (Places.currentFilters.wheelchair) params.append('wheelchair', 'true');
    if (Places.currentFilters.ramp) params.append('ramp', 'true');
    if (Places.currentFilters.washroom) params.append('washroom', 'true');
    if (Places.currentFilters.elevator) params.append('elevator', 'true');
    if (Places.currentFilters.parking) params.append('parking', 'true');
    if (Places.currentFilters.sort) params.append('sort', Places.currentFilters.sort);
    params.append('page', Places.currentFilters.page);
    params.append('limit', Places.currentFilters.limit);

    try {
      const response = await window.API.apiRequest(`/places?${params.toString()}`);

      if (response.success && response.places.length > 0) {
        grid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = response.places.map(p => Places.createPlaceCardHTML(p)).join('');
        Places.attachCardListeners(grid);

        if (resultsCountEl) {
          resultsCountEl.textContent = `Found ${response.pagination.total} matching accessible place${response.pagination.total === 1 ? '' : 's'}`;
        }

        // Render Pagination
        Places.renderPagination(response.pagination, paginationEl);
      } else {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (resultsCountEl) resultsCountEl.textContent = '0 places found';
        if (paginationEl) paginationEl.innerHTML = '';
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--danger); padding:2rem;">Error loading search results: ${err.message}</div>`;
    }
  },

  renderPagination(pagination, container) {
    if (!container) return;
    if (pagination.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" ${pagination.page <= 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} data-page="${pagination.page - 1}">
        &laquo; Previous
      </button>
    `;

    for (let i = 1; i <= pagination.totalPages; i++) {
      html += `
        <button class="page-btn ${i === pagination.page ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    html += `
      <button class="page-btn" ${pagination.page >= pagination.totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} data-page="${pagination.page + 1}">
        Next &raquo;
      </button>
    `;

    container.innerHTML = html;

    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = parseInt(btn.getAttribute('data-page'), 10);
        if (targetPage && targetPage !== Places.currentFilters.page) {
          Places.currentFilters.page = targetPage;
          Places.searchPlaces();
          window.scrollTo({ top: 150, behavior: 'smooth' });
        }
      });
    });
  },

  attachCardListeners(container) {
    container.querySelectorAll('.btn-view-place').forEach(btn => {
      btn.addEventListener('click', () => {
        const placeId = btn.getAttribute('data-id');
        Places.openPlaceDetail(placeId);
      });
    });
  },

  /**
   * Open Place Details Modal with verified accessibility breakdown and reviews
   */
  async openPlaceDetail(placeId) {
    const modal = document.getElementById('modal-place-detail');
    if (!modal) return;

    try {
      const response = await window.API.apiRequest(`/places/${placeId}`);
      if (!response.success || !response.place) {
        window.API.showToast('Unable to load place details', 'error');
        return;
      }

      const p = response.place;
      const reviews = response.reviews || [];
      const imageUrl = Places.getPlaceImage(p);

      document.getElementById('detail-modal-title').textContent = p.name;
      document.getElementById('detail-modal-category').textContent = `${Places.categoryIcons[p.category] || '📍'} ${p.category}`;

      const body = document.getElementById('detail-modal-body');
      body.innerHTML = `
        <div class="place-detail-hero">
          <img src="${imageUrl}" alt="Photo of ${window.API.escapeHtml(p.name)}" />
        </div>

        <div class="place-detail-meta">
          <div class="meta-item"><span>📍</span> <span><strong>City:</strong> ${window.API.escapeHtml(p.city)}</span></div>
          <div class="meta-item"><span>🏢</span> <span><strong>Address:</strong> ${window.API.escapeHtml(p.address)}</span></div>
          ${p.contactPhone ? `<div class="meta-item"><span>📞</span> <span><strong>Phone:</strong> ${window.API.escapeHtml(p.contactPhone)}</span></div>` : ''}
          ${p.contactEmail ? `<div class="meta-item"><span>✉️</span> <span><strong>Email:</strong> ${window.API.escapeHtml(p.contactEmail)}</span></div>` : ''}
          ${p.website ? `<div class="meta-item"><span>🌐</span> <a href="${window.API.escapeHtml(p.website)}" target="_blank" rel="noopener noreferrer">Visit Website</a></div>` : ''}
          <div class="meta-item"><span>🕒</span> <span><strong>Opening Hours:</strong> ${window.API.escapeHtml(p.openingHours || 'Contact location')}</span></div>
        </div>

        <h4 style="font-size:1.15rem; font-weight:700; margin-bottom:0.5rem;">About This Location</h4>
        <p style="font-size:1rem; line-height:1.6; color:var(--text-muted); margin-bottom:1.5rem;">
          ${window.API.escapeHtml(p.description)}
        </p>

        <h4 style="font-size:1.15rem; font-weight:700; margin-bottom:0.5rem;">Accessibility Facilities Checklist</h4>
        <div class="facility-checklist" aria-label="Facility checklist for ${window.API.escapeHtml(p.name)}">
          <div class="facility-check-item ${p.wheelchairAccessible ? 'verified' : 'missing'}">
            <span class="facility-check-icon">${p.wheelchairAccessible ? '✅' : '❌'}</span>
            <span>Wheelchair Accessible</span>
          </div>
          <div class="facility-check-item ${p.rampAvailable ? 'verified' : 'missing'}">
            <span class="facility-check-icon">${p.rampAvailable ? '✅' : '❌'}</span>
            <span>Ramp Availability</span>
          </div>
          <div class="facility-check-item ${p.accessibleWashroom ? 'verified' : 'missing'}">
            <span class="facility-check-icon">${p.accessibleWashroom ? '✅' : '❌'}</span>
            <span>Accessible Washroom</span>
          </div>
          <div class="facility-check-item ${p.elevatorAvailable ? 'verified' : 'missing'}">
            <span class="facility-check-icon">${p.elevatorAvailable ? '✅' : '❌'}</span>
            <span>Elevator Availability</span>
          </div>
          <div class="facility-check-item ${p.accessibleParking ? 'verified' : 'missing'}">
            <span class="facility-check-icon">${p.accessibleParking ? '✅' : '❌'}</span>
            <span>Accessible Parking</span>
          </div>
        </div>

        ${p.additionalAccessibility ? `
          <div style="background-color:var(--primary-light); padding:1rem; border-radius:var(--radius-md); border-left:4px solid var(--primary); margin:1.5rem 0;">
            <strong style="color:var(--primary-dark); display:block; margin-bottom:0.25rem;">♿ Additional Accessibility Details:</strong>
            <p style="font-size:0.95rem; color:var(--text-main); margin:0;">${window.API.escapeHtml(p.additionalAccessibility)}</p>
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; flex-wrap:wrap; gap:0.75rem;">
          <div>
            <span style="font-size:1.35rem; font-weight:800; color:var(--text-main);">
              ⭐ ${p.averageRating > 0 ? p.averageRating.toFixed(1) : 'New'} / 5.0
            </span>
            <span style="color:var(--text-muted); font-size:0.9rem; margin-left:0.5rem;">
              (${p.reviewCount} community review${p.reviewCount === 1 ? '' : 's'})
            </span>
          </div>
          <button class="btn btn-outline btn-sm btn-report-inaccuracy" data-id="${p._id}" data-name="${window.API.escapeHtml(p.name)}">
            🚩 Report Inaccurate Information
          </button>
        </div>

        <!-- Reviews & Submission Section -->
        <div class="reviews-section" id="detail-reviews-container">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h4 style="font-size:1.2rem; font-weight:700;">Community Reviews & Ratings</h4>
            <button class="btn btn-primary btn-sm btn-write-review" data-id="${p._id}">
              ✍️ Write a Review
            </button>
          </div>

          <!-- Add Review Form (hidden by default) -->
          <div id="review-form-wrapper" style="display:none; background-color:var(--bg-subtle); padding:1.25rem; border-radius:var(--radius-md); margin-bottom:1.5rem; border:1px solid var(--border-color);">
            <h5 style="font-weight:700; font-size:1rem; margin-bottom:0.75rem;">Submit Your Experience</h5>
            <form id="place-review-form">
              <input type="hidden" name="placeId" value="${p._id}" />
              <div class="form-group">
                <label class="form-label">Your Rating (1 to 5 Stars): <span class="required">*</span></label>
                <div class="star-rating-select" id="star-selector" role="radiogroup" aria-label="Star rating">
                  <span data-value="1" tabindex="0" role="radio" aria-label="1 Star" aria-checked="false">★</span>
                  <span data-value="2" tabindex="0" role="radio" aria-label="2 Stars" aria-checked="false">★</span>
                  <span data-value="3" tabindex="0" role="radio" aria-label="3 Stars" aria-checked="false">★</span>
                  <span data-value="4" tabindex="0" role="radio" aria-label="4 Stars" aria-checked="false">★</span>
                  <span data-value="5" tabindex="0" role="radio" aria-label="5 Stars" aria-checked="false">★</span>
                </div>
                <input type="hidden" id="review-rating-input" name="rating" value="5" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="review-comment-input">Review Comment & Accessibility Notes: <span class="required">*</span></label>
                <textarea id="review-comment-input" class="form-control" name="comment" rows="3" required placeholder="Describe entrance slopes, doorways, staff helpfulness, restroom maneuverability, etc."></textarea>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                <button type="button" class="btn btn-outline btn-sm" id="btn-cancel-review">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Submit Review</button>
              </div>
            </form>
          </div>

          <!-- Reviews List -->
          <div id="reviews-list">
            ${reviews.length > 0 ? reviews.map(r => `
              <div class="review-item">
                <div class="review-header">
                  <div class="review-author">
                    <span>👤</span>
                    <span>${window.API.escapeHtml(r.user ? r.user.name : 'Community Member')}</span>
                    ${r.user && r.user.role === 'admin' ? '<span class="status-badge status-investigating" style="font-size:0.65rem;">ADMIN</span>' : ''}
                  </div>
                  <div>
                    <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                    <span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <p class="review-comment">${window.API.escapeHtml(r.comment)}</p>
              </div>
            `).join('') : '<p style="color:var(--text-light); text-align:center; padding:1.5rem 0;">No reviews yet. Be the first to share your accessibility feedback!</p>'}
          </div>
        </div>
      `;

      // Attach Report Button Listener
      body.querySelector('.btn-report-inaccuracy').addEventListener('click', () => {
        if (window.Reports) {
          window.Reports.openReportModal(p._id, p.name);
        }
      });

      // Attach Write Review Button Listener
      const writeReviewBtn = body.querySelector('.btn-write-review');
      const reviewFormWrapper = body.querySelector('#review-form-wrapper');
      const cancelReviewBtn = body.querySelector('#btn-cancel-review');

      writeReviewBtn.addEventListener('click', () => {
        if (!window.Auth.isAuthenticated()) {
          window.API.showToast('Please login to submit a review', 'info');
          if (window.App) window.App.openLoginModal();
          return;
        }
        reviewFormWrapper.style.display = 'block';
        writeReviewBtn.style.display = 'none';
      });

      cancelReviewBtn.addEventListener('click', () => {
        reviewFormWrapper.style.display = 'none';
        writeReviewBtn.style.display = 'inline-flex';
      });

      // Interactive Star Rating Logic
      const starSelector = body.querySelector('#star-selector');
      const ratingInput = body.querySelector('#review-rating-input');
      const stars = starSelector.querySelectorAll('span');

      const updateStars = (val) => {
        ratingInput.value = val;
        stars.forEach((s, idx) => {
          if (idx < val) {
            s.classList.add('selected');
            s.setAttribute('aria-checked', 'true');
          } else {
            s.classList.remove('selected');
            s.setAttribute('aria-checked', 'false');
          }
        });
      };
      updateStars(5); // default 5 stars

      stars.forEach(s => {
        s.addEventListener('click', () => {
          const val = parseInt(s.getAttribute('data-value'), 10);
          updateStars(val);
        });
        s.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const val = parseInt(s.getAttribute('data-value'), 10);
            updateStars(val);
          }
        });
      });

      // Submit Review Form
      const reviewForm = body.querySelector('#place-review-form');
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = parseInt(ratingInput.value, 10);
        const comment = reviewForm.comment.value.trim();

        if (!comment) {
          window.API.showToast('Please enter your review comment', 'warning');
          return;
        }

        try {
          const revRes = await window.API.apiRequest(`/places/${p._id}/reviews`, {
            method: 'POST',
            body: JSON.stringify({ rating, comment })
          });

          if (revRes.success) {
            window.API.showToast(revRes.message || 'Review submitted!', 'success');
            // Reload place detail modal with updated reviews
            Places.openPlaceDetail(p._id);
            // Refresh place list in background
            Places.searchPlaces();
          }
        } catch (err) {
          window.API.showToast(err.message || 'Failed to submit review', 'error');
        }
      });

      // Show modal
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      window.API.showToast('Failed to load place details', 'error');
    }
  }
};

window.Places = Places;
