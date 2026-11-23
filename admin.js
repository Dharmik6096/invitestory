/* ═══════════════════════════════════════════════════════════════════
   ADMIN SYSTEM SCRIPT — Authentication, Live Card Editor & State
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const ADMIN_SESSION_KEY = 'invitestory_admin_session';
  const REGISTRY_KEY = 'invitestory_cards_registry';

  // ─────────────────────────────────────────────────────────────────
  // 1. CARDS REGISTRY HELPERS (Multi-user isolation & persistence)
  // ─────────────────────────────────────────────────────────────────

  window.getSavedUserCards = function () {
    try {
      var raw = localStorage.getItem(REGISTRY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  };

  window.saveUserCardToRegistry = function (cardRecord) {
    try {
      var list = getSavedUserCards();
      var idx = list.findIndex(function (c) { return c.slug === cardRecord.slug; });
      if (idx >= 0) {
        list[idx] = Object.assign({}, list[idx], cardRecord, { updatedAt: Date.now() });
      } else {
        cardRecord.createdAt = cardRecord.createdAt || Date.now();
        cardRecord.updatedAt = Date.now();
        list.unshift(cardRecord);
      }
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(list));
      updateSavedCardsCountUI();
      populateAdminSavedCardsDropdown();
      return true;
    } catch (e) {
      console.warn('Failed to save to registry:', e);
      return false;
    }
  };

  window.deleteUserCardFromRegistry = function (slug) {
    try {
      var list = getSavedUserCards().filter(function (c) { return c.slug !== slug; });
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(list));
      localStorage.removeItem('card_' + slug);
      updateSavedCardsCountUI();
      populateAdminSavedCardsDropdown();
      renderAdminSavedCardsList();
      showAdminToast('🗑️ Card ' + slug + ' deleted.');
    } catch (e) {
      console.warn('Failed to delete card:', e);
    }
  };

  window.getUserCardBySlug = function (slug) {
    var list = getSavedUserCards();
    var found = list.find(function (c) { return c.slug === slug; });
    if (found) return found;

    // Fallback: check localStorage directly
    try {
      var raw = localStorage.getItem('card_' + slug);
      if (raw) {
        var cfg = JSON.parse(raw);
        var tplInfo = detectTemplateFromSlug(slug);
        return {
          slug: slug,
          cardId: tplInfo.cardId,
          templateName: tplInfo.templateName,
          names: cfg.title || cfg.couple || [cfg.groomName || cfg.dadName, cfg.brideName || cfg.momName].filter(Boolean).join(' & ') || slug,
          date: cfg.eventDateText || cfg.date || cfg.dateLabel || '',
          venue: cfg.venueName || (cfg.venue && cfg.venue.name) || cfg.venue || '',
          updatedAt: Date.now(),
          config: cfg
        };
      }
    } catch (_) {}
    return null;
  };

  function detectTemplateFromSlug(slug) {
    var s = (slug || '').toLowerCase();
    if (s.indexOf('palna') !== -1 || s.indexOf('baby') !== -1 || s.indexOf('wax') !== -1) {
      return { cardId: 101, templateName: 'Wax Seal Baby Shower', prefix: 'palna' };
    } else if (s.indexOf('lotus') !== -1 || s.indexOf('papercut') !== -1) {
      return { cardId: 103, templateName: 'Papercut Lotus', prefix: 'lotus' };
    } else if (s.indexOf('bloom') !== -1 || s.indexOf('ever-after') !== -1 || s.indexOf('eab') !== -1) {
      return { cardId: 104, templateName: 'Ever After Bloom', prefix: 'bloom' };
    } else if (s.indexOf('mithril') !== -1 || s.indexOf('aabha') !== -1) {
      return { cardId: 105, templateName: 'Aabha Mithril', prefix: 'mithril' };
    }
    return { cardId: 102, templateName: 'Royal Palace 3D', prefix: 'shahi' };
  }

  function getTemplateMetaById(cardId) {
    switch (cardId) {
      case 101: return { id: 101, templateName: 'Wax Seal Baby Shower', prefix: 'palna', folder: '/card 3/templates/shahi-palna/' };
      case 103: return { id: 103, templateName: 'Papercut Lotus', prefix: 'lotus', folder: '/card 2/templates/papercut-magenta/' };
      case 104: return { id: 104, templateName: 'Ever After Bloom', prefix: 'bloom', folder: '/card 4/templates/ever-after-bloom/' };
      case 105: return { id: 105, templateName: 'Aabha Mithril', prefix: 'mithril', folder: '/card 5/templates/mithril/' };
      default: return { id: 102, templateName: 'Royal Palace 3D', prefix: 'shahi', folder: '/card 1/templates/royale/' };
    }
  }

  function updateSavedCardsCountUI() {
    var countEls = document.querySelectorAll('#admin-saved-cards-count, .admin-saved-cards-count');
    var list = getSavedUserCards();
    countEls.forEach(function (el) {
      el.textContent = list.length;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. AUTHENTICATION & SESSION
  // ─────────────────────────────────────────────────────────────────

  window.isAdminLoggedIn = function () {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  };

  window.adminLogin = function (event) {
    if (event) event.preventDefault();
    const user = document.getElementById('admin-username')?.value.trim();
    const pass = document.getElementById('admin-password')?.value.trim();
    const errorEl = document.getElementById('admin-login-error');

    if (user && user.toLowerCase() === 'dharmik' && pass === 'Dharmik@401') {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      if (errorEl) errorEl.style.display = 'none';
      closeAdminLoginModal();
      updateAdminUI();
      showAdminToast('👑 Admin Mode Activated! Welcome, Dharmik.');
    } else {
      if (errorEl) {
        errorEl.textContent = 'Invalid username or password. Please try again.';
        errorEl.style.display = 'block';
      }
    }
    return false;
  };

  window.adminLogout = function () {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    updateAdminUI();
    closeAdminEditorModal();
    closeAdminSavedCardsModal();
    showAdminToast('Logged out. Switched to guest view.');
  };

  window.updateAdminUI = function () {
    const loggedIn = isAdminLoggedIn();
    document.body.classList.toggle('is-admin', loggedIn);

    const headerBtn = document.getElementById('admin-header-trigger');
    if (headerBtn) {
      if (loggedIn) {
        headerBtn.innerHTML = '<span>Admin 👑</span>';
        headerBtn.title = 'Admin options active';
      } else {
        headerBtn.innerHTML = '<span>Admin Login 🔒</span>';
        headerBtn.title = 'Sign in as administrator';
      }
    }

    const previewAdminBtn = document.getElementById('preview-admin-edit-btn');
    if (previewAdminBtn) {
      previewAdminBtn.style.display = loggedIn ? 'inline-flex' : 'none';
    }

    updateSavedCardsCountUI();

    if (typeof renderCatalogue === 'function') {
      renderCatalogue();
    }
  };

  window.showAdminToast = function (msg) {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1b1714;border:1px solid #d4af37;color:#f7eedc;padding:12px 20px;border-radius:12px;font-size:13.5px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,0.5);z-index:1000010;transition:all 0.3s ease;transform:translateY(100px);opacity:0;display:flex;align-items:center;gap:8px;font-family:sans-serif;';
      document.body.appendChild(toast);
    }
    toast.innerHTML = msg;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 3500);
  };

  // ─────────────────────────────────────────────────────────────────
  // 3. CARD EDITOR STATE & ROUTING
  // ─────────────────────────────────────────────────────────────────

  let currentEditingCardId = 102;
  let currentEditingCardSlug = null; // null = Fresh card for new user; string = Existing user card slug

  window.openAdminModal = function () {
    if (isAdminLoggedIn()) {
      openAdminEditor(102);
    } else {
      openAdminLoginModal();
    }
  };

  window.openAdminLoginModal = function () {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
      modal.classList.add('is-open');
      const input = document.getElementById('admin-username');
      if (input) input.focus();
    }
  };

  window.closeAdminLoginModal = function () {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('is-open');
  };

  window.openAdminEditor = function (cardId, slug) {
    if (!isAdminLoggedIn()) {
      openAdminLoginModal();
      return;
    }
    currentEditingCardId = cardId || 102;
    const modal = document.getElementById('admin-card-editor-modal');
    if (modal) {
      modal.classList.add('is-open');
      populateAdminSavedCardsDropdown();
      if (slug) {
        onAdminSelectSavedCard(slug);
      } else if (!currentEditingCardSlug) {
        startFreshNewCard(currentEditingCardId);
      } else {
        switchAdminEditorTab(currentEditingCardId);
      }
    }
  };

  window.closeAdminEditorModal = function () {
    const modal = document.getElementById('admin-card-editor-modal');
    if (modal) modal.classList.remove('is-open');
  };

  // ─────────────────────────────────────────────────────────────────
  // 3b. RESPONSIVE TOP BANNER TEMPLATES DROPDOWN
  // ─────────────────────────────────────────────────────────────────

  window.toggleAdminTemplatesDropdown = function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const menu = document.getElementById('adminTemplatesDropdownMenu');
    if (menu) {
      menu.classList.toggle('is-open');
    }
  };

  window.closeAdminTemplatesDropdown = function () {
    const menu = document.getElementById('adminTemplatesDropdownMenu');
    if (menu) {
      menu.classList.remove('is-open');
    }
  };

  // Close dropdown on outside click or ESC key
  document.addEventListener('click', function (e) {
    const wrap = document.querySelector('.admin-dropdown-wrap');
    if (wrap && !wrap.contains(e.target)) {
      window.closeAdminTemplatesDropdown();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.closeAdminTemplatesDropdown();
    }
  });

  window.openCurrentPreviewEditor = function () {
    const currentItem = (typeof previewState !== 'undefined' && previewState.currentIndex !== -1 && typeof TEMPLATE_DATABASE !== 'undefined')
      ? TEMPLATE_DATABASE[previewState.currentIndex]
      : null;
    openAdminEditor(currentItem ? currentItem.id : 102);
  };

  window.switchAdminEditorTab = function (cardId) {
    currentEditingCardId = cardId;
    document.querySelectorAll('.admin-card-tab').forEach(tab => {
      tab.classList.toggle('active', parseInt(tab.dataset.cardId, 10) === cardId);
    });

    const formBaby = document.getElementById('editor-fields-baby');
    const formRoyal = document.getElementById('editor-fields-royal');
    const formLotus = document.getElementById('editor-fields-lotus');
    const formEab = document.getElementById('editor-fields-eab');
    const formMithril = document.getElementById('editor-fields-mithril');

    if (formBaby) formBaby.style.display = cardId === 101 ? 'block' : 'none';
    if (formRoyal) formRoyal.style.display = cardId === 102 ? 'block' : 'none';
    if (formLotus) formLotus.style.display = cardId === 103 ? 'block' : 'none';
    if (formEab) formEab.style.display = cardId === 104 ? 'block' : 'none';
    if (formMithril) formMithril.style.display = cardId === 105 ? 'block' : 'none';

    // If we're editing a saved card of a different template, reset to fresh for this template
    if (currentEditingCardSlug) {
      var saved = getUserCardBySlug(currentEditingCardSlug);
      if (saved && saved.cardId !== cardId) {
        startFreshNewCard(cardId);
      }
    }
  };

  // Populate the dropdown in the editor modal
  function populateAdminSavedCardsDropdown() {
    const picker = document.getElementById('admin-user-card-picker');
    if (!picker) return;

    const cards = getSavedUserCards();
    picker.innerHTML = '<option value="__NEW__">➕ New User Card (Start Fresh)</option>';

    if (cards.length > 0) {
      const optGroup = document.createElement('optgroup');
      optGroup.label = '── Saved Existing Client Cards ──';
      cards.forEach(card => {
        const opt = document.createElement('option');
        opt.value = card.slug;
        opt.textContent = (card.names || card.slug) + ' [' + (card.templateName || 'Card') + ' · ' + card.slug + ']';
        optGroup.appendChild(opt);
      });
      picker.appendChild(optGroup);
    }

    picker.value = currentEditingCardSlug || '__NEW__';
  }

  // START FRESH FOR NEW USERS
  window.startFreshNewCard = function (cardId) {
    if (cardId) currentEditingCardId = cardId;
    currentEditingCardSlug = null;

    const picker = document.getElementById('admin-user-card-picker');
    if (picker) picker.value = '__NEW__';

    // Update status badge
    const statusEl = document.getElementById('admin-editor-card-status');
    if (statusEl) {
      statusEl.className = 'admin-editor-card-status is-fresh';
      statusEl.innerHTML = '🟢 <strong>Creating Fresh Card for New User:</strong> Pristine template defaults loaded. No conflict with existing client cards.';
    }

    // Update save button text
    const saveBtn = document.getElementById('admin-save-card-btn');
    if (saveBtn) {
      saveBtn.innerHTML = '🚀 Save &amp; Generate Unique Link for New User';
    }

    switchAdminEditorTab(currentEditingCardId);
    loadDefaultCardValues(currentEditingCardId);
  };

  // EDIT EXISTING SAVED USER CARD
  window.onAdminSelectSavedCard = function (slug) {
    if (!slug || slug === '__NEW__') {
      startFreshNewCard();
      return;
    }

    const card = getUserCardBySlug(slug);
    if (!card) {
      showAdminToast('⚠️ Card not found: ' + slug);
      startFreshNewCard();
      return;
    }

    currentEditingCardSlug = slug;
    currentEditingCardId = card.cardId || detectTemplateFromSlug(slug).cardId;

    const picker = document.getElementById('admin-user-card-picker');
    if (picker) picker.value = slug;

    // Update status badge
    const statusEl = document.getElementById('admin-editor-card-status');
    if (statusEl) {
      statusEl.className = 'admin-editor-card-status is-editing';
      statusEl.innerHTML = '✏️ <strong>Editing Existing Card:</strong> ' + (card.names || slug) + ' <span class="admin-slug-badge">(' + slug + ')</span> · Changes will update this link directly without affecting any other user.';
    }

    // Update save button text
    const saveBtn = document.getElementById('admin-save-card-btn');
    if (saveBtn) {
      saveBtn.innerHTML = '💾 Save Changes &amp; Update User Link (' + slug + ')';
    }

    switchAdminEditorTab(currentEditingCardId);
    populateFormWithConfig(currentEditingCardId, card.config || {});
    showAdminToast('📂 Loaded ' + (card.names || slug) + ' for editing.');
  };

  // Fill form with clean pristine defaults for a new card
  function loadDefaultCardValues(cardId) {
    if (cardId === 101) {
      // Baby Shower Defaults
      const mom = document.getElementById('edit-baby-mom'); if (mom) mom.value = 'Meghal Patel';
      const dad = document.getElementById('edit-baby-dad'); if (dad) dad.value = 'Kaushal Patel';
      const date = document.getElementById('edit-baby-date'); if (date) date.value = 'Sunday, 22nd November 2026';
      const venue = document.getElementById('edit-baby-venue'); if (venue) venue.value = 'Adelaide SA, Klemzig Community Hall';
      const wa = document.getElementById('edit-baby-wa'); if (wa) wa.value = '0431 386 636';
      const hosts = document.getElementById('edit-baby-hosts'); if (hosts) hosts.value = 'Patel Family';
      const tag = document.getElementById('edit-baby-tagline'); if (tag) tag.value = 'Two Tiny Feet • Welcoming Little Miracles';
    } else if (cardId === 102) {
      // Royale Wedding Defaults
      const groom = document.getElementById('edit-royal-groom'); if (groom) groom.value = 'Chi. Kaushal';
      const bride = document.getElementById('edit-royal-bride'); if (bride) bride.value = 'Sou. Meghal';
      const date = document.getElementById('edit-royal-date'); if (date) date.value = 'Sunday, 22nd November 2026';
      const venue = document.getElementById('edit-royal-venue'); if (venue) venue.value = 'The Grand Darbar Palace, Adelaide';
      const wa = document.getElementById('edit-royal-wa'); if (wa) wa.value = '0431 386 636';
    } else if (cardId === 103) {
      // Lotus Palace Defaults
      const groom = document.getElementById('edit-lotus-groom'); if (groom) groom.value = 'Kaushal';
      const bride = document.getElementById('edit-lotus-bride'); if (bride) bride.value = 'Meghal';
      const date = document.getElementById('edit-lotus-date'); if (date) date.value = 'Sunday, 22nd November 2026';
      const venue = document.getElementById('edit-lotus-venue'); if (venue) venue.value = 'The Lotus Palace & Gardens';
      const wa = document.getElementById('edit-lotus-wa'); if (wa) wa.value = '0431 386 636';
    } else if (cardId === 104) {
      // Ever After Bloom Defaults
      const bride = document.getElementById('edit-eab-bride'); if (bride) bride.value = 'Aarohi';
      const groom = document.getElementById('edit-eab-groom'); if (groom) groom.value = 'Ishaan';
      const date = document.getElementById('edit-eab-date'); if (date) date.value = 'Sunday, 14 February 2027';
      const time = document.getElementById('edit-eab-time'); if (time) time.value = '6:30 in the evening';
      const venue = document.getElementById('edit-eab-venue'); if (venue) venue.value = 'Amrit Mahal Palace, Jal Marg, Old City, Jaipur';
      const dress = document.getElementById('edit-eab-dress'); if (dress) dress.value = 'Festive Indian — pastels, ivory & gold';
      const bless = document.getElementById('edit-eab-blessing'); if (bless) bless.value = 'Two rivers, one sky';
    } else if (cardId === 105) {
      // Aabha Mithril Defaults
      const couple = document.getElementById('edit-mithril-couple'); if (couple) couple.value = 'Kian & Aria';
      const date = document.getElementById('edit-mithril-date'); if (date) date.value = 'Sunday, 18 October 2026';
      const venue = document.getElementById('edit-mithril-venue'); if (venue) venue.value = 'Jagmandir Island Palace, Udaipur';
      const time = document.getElementById('edit-mithril-time'); if (time) time.value = '7:00 PM';
    }
  }

  // Populate form with existing user's saved data
  function populateFormWithConfig(cardId, cfg) {
    if (!cfg) return;
    if (cardId === 101) {
      document.getElementById('edit-baby-mom').value = cfg.momName || cfg.brideName || '';
      document.getElementById('edit-baby-dad').value = cfg.dadName || cfg.groomName || '';
      document.getElementById('edit-baby-date').value = cfg.eventDateText || '';
      document.getElementById('edit-baby-venue').value = cfg.venueName || '';
      document.getElementById('edit-baby-wa').value = cfg.whatsappRsvp || '';
      document.getElementById('edit-baby-hosts').value = cfg.hosts || '';
      document.getElementById('edit-baby-tagline').value = cfg.eventTagline || '';
    } else if (cardId === 102) {
      document.getElementById('edit-royal-groom').value = cfg.groomName || '';
      document.getElementById('edit-royal-bride').value = cfg.brideName || '';
      document.getElementById('edit-royal-date').value = cfg.eventDateText || '';
      document.getElementById('edit-royal-venue').value = cfg.venueName || '';
      document.getElementById('edit-royal-wa').value = cfg.whatsappRsvp || '';
    } else if (cardId === 103) {
      document.getElementById('edit-lotus-groom').value = cfg.groomName || '';
      document.getElementById('edit-lotus-bride').value = cfg.brideName || '';
      document.getElementById('edit-lotus-date').value = cfg.eventDateText || '';
      document.getElementById('edit-lotus-venue').value = cfg.venueName || '';
      document.getElementById('edit-lotus-wa').value = cfg.whatsappRsvp || '';
    } else if (cardId === 104) {
      const couple = cfg.couple || {};
      const venue = cfg.venue || {};
      const hero = cfg.hero || {};
      document.getElementById('edit-eab-bride').value = couple.bride || '';
      document.getElementById('edit-eab-groom').value = couple.groom || '';
      document.getElementById('edit-eab-date').value = cfg.dateLabel || cfg.date || '';
      document.getElementById('edit-eab-time').value = cfg.timeLabel || cfg.time || '';
      document.getElementById('edit-eab-venue').value = venue.name || cfg.venueName || '';
      document.getElementById('edit-eab-dress').value = cfg.dressCode || '';
      document.getElementById('edit-eab-blessing').value = hero.blessing || '';
    } else if (cardId === 105) {
      document.getElementById('edit-mithril-couple').value = cfg.couple || '';
      document.getElementById('edit-mithril-date').value = cfg.date || '';
      document.getElementById('edit-mithril-venue').value = cfg.venue || '';
      document.getElementById('edit-mithril-time').value = cfg.time || '';
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. URL GENERATION & PAYLOAD COMPRESSION (Prevents URI_TOO_LONG)
  // ─────────────────────────────────────────────────────────────────

  let currentShareData = {
    slug: '',
    names: '',
    baseUrl: '',
    dParam: '',
    fullUrl: ''
  };

  function generateUniqueSlug(prefix) {
    var rand = Math.random().toString(36).substring(2, 8);
    return prefix + '-' + rand;
  }

  function encodePayload(data) {
    try {
      var json = JSON.stringify(data);
      return btoa(unescape(encodeURIComponent(json)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch (e) {
      return '';
    }
  }

  // SAVE ADMIN CARD EDITS
  window.saveAdminCardEdits = function () {
    var origin = (window.location.origin && window.location.origin !== 'null')
      ? window.location.origin
      : 'https://invitation-card-umber-six.vercel.app';

    var meta = getTemplateMetaById(currentEditingCardId);
    var slugPrefix = meta.prefix;
    var overrides = {};
    var coupleNames = 'Wedding Invitation';
    var eventDate = '';
    var eventVenue = '';

    if (currentEditingCardId === 101) {
      var mom = (document.getElementById('edit-baby-mom')?.value || '').trim();
      var dad = (document.getElementById('edit-baby-dad')?.value || '').trim();
      var date = (document.getElementById('edit-baby-date')?.value || '').trim();
      var venue = (document.getElementById('edit-baby-venue')?.value || '').trim();
      var wa = (document.getElementById('edit-baby-wa')?.value || '').trim();
      var hosts = (document.getElementById('edit-baby-hosts')?.value || '').trim();
      var tagline = (document.getElementById('edit-baby-tagline')?.value || '').trim();

      coupleNames = [mom, dad].filter(Boolean).join(' & ') || 'Baby Shower Celebration';
      eventDate = date;
      eventVenue = venue;
      if (mom) { overrides.momName = mom; overrides.brideName = mom; }
      if (dad) { overrides.dadName = dad; overrides.groomName = dad; }
      if (date) { overrides.eventDateText = date; }
      if (venue) { overrides.venueName = venue; }
      if (wa) { overrides.whatsappRsvp = wa; }
      if (hosts) { overrides.hosts = hosts; }
      if (tagline) { overrides.eventTagline = tagline; }
      overrides.title = coupleNames + ' - Baby Shower & Godh Bharai';

    } else if (currentEditingCardId === 102) {
      var groom = (document.getElementById('edit-royal-groom')?.value || '').trim();
      var bride = (document.getElementById('edit-royal-bride')?.value || '').trim();
      var date = (document.getElementById('edit-royal-date')?.value || '').trim();
      var venue = (document.getElementById('edit-royal-venue')?.value || '').trim();
      var wa = (document.getElementById('edit-royal-wa')?.value || '').trim();

      coupleNames = [groom, bride].filter(Boolean).join(' & ') || 'Siddhant & Aayushi';
      eventDate = date;
      eventVenue = venue;
      if (groom) overrides.groomName = groom;
      if (bride) overrides.brideName = bride;
      if (date) overrides.eventDateText = date;
      if (venue) overrides.venueName = venue;
      if (wa) overrides.whatsappRsvp = wa;
      overrides.title = coupleNames;
      overrides.hostNames = [groom, bride].filter(Boolean);

    } else if (currentEditingCardId === 103) {
      var groom = (document.getElementById('edit-lotus-groom')?.value || '').trim();
      var bride = (document.getElementById('edit-lotus-bride')?.value || '').trim();
      var date = (document.getElementById('edit-lotus-date')?.value || '').trim();
      var venue = (document.getElementById('edit-lotus-venue')?.value || '').trim();
      var wa = (document.getElementById('edit-lotus-wa')?.value || '').trim();

      coupleNames = [groom, bride].filter(Boolean).join(' & ') || 'Kaushik & Ankita';
      eventDate = date;
      eventVenue = venue;
      if (groom) overrides.groomName = groom;
      if (bride) overrides.brideName = bride;
      if (date) overrides.eventDateText = date;
      if (venue) overrides.venueName = venue;
      if (wa) overrides.whatsappRsvp = wa;
      overrides.title = coupleNames;
      overrides.hostNames = [groom, bride].filter(Boolean);

    } else if (currentEditingCardId === 104) {
      var bride = (document.getElementById('edit-eab-bride')?.value || '').trim();
      var groom = (document.getElementById('edit-eab-groom')?.value || '').trim();
      var date = (document.getElementById('edit-eab-date')?.value || '').trim();
      var time = (document.getElementById('edit-eab-time')?.value || '').trim();
      var venue = (document.getElementById('edit-eab-venue')?.value || '').trim();
      var dress = (document.getElementById('edit-eab-dress')?.value || '').trim();
      var bless = (document.getElementById('edit-eab-blessing')?.value || '').trim();

      coupleNames = [bride, groom].filter(Boolean).join(' & ') || 'Aarohi & Ishaan';
      eventDate = date;
      eventVenue = venue;
      overrides.couple = {};
      if (bride) overrides.couple.bride = bride;
      if (groom) overrides.couple.groom = groom;
      if (date) overrides.dateLabel = date;
      if (time) overrides.timeLabel = time;
      if (venue) overrides.venue = { name: venue };
      if (dress) overrides.dressCode = dress;
      if (bless) overrides.hero = { blessing: bless };

    } else if (currentEditingCardId === 105) {
      var couple = (document.getElementById('edit-mithril-couple')?.value || '').trim();
      var date = (document.getElementById('edit-mithril-date')?.value || '').trim();
      var venue = (document.getElementById('edit-mithril-venue')?.value || '').trim();
      var time = (document.getElementById('edit-mithril-time')?.value || '').trim();

      coupleNames = couple || 'Kian & Aria';
      eventDate = date;
      eventVenue = venue;
      if (couple) overrides.couple = couple;
      if (date) overrides.date = date;
      if (venue) overrides.venue = venue;
      if (time) overrides.time = time;
    }

    // Reuse existing slug if editing an existing user card, or generate fresh for a new user
    var isNewUser = !currentEditingCardSlug;
    var finalSlug = currentEditingCardSlug || generateUniqueSlug(slugPrefix);
    currentEditingCardSlug = finalSlug;

    // Compact payload encoding (prevents URI_TOO_LONG)
    var dParam = encodePayload(overrides);

    // Save isolated user config to localStorage
    try {
      localStorage.setItem('card_' + finalSlug, JSON.stringify(overrides));
    } catch (_) {}

    // Clean Short URL without bloated query hashes
    var shareUrl = origin + '/invite/?card=' + encodeURIComponent(finalSlug);
    if (coupleNames) shareUrl += '&names=' + encodeURIComponent(coupleNames);

    // Persist to CloudStorage
    if (window.CloudStorage && typeof window.CloudStorage.saveCard === 'function') {
      window.CloudStorage.saveCard(finalSlug, overrides, {
        cardId: currentEditingCardId,
        templateName: meta.templateName,
        names: coupleNames,
        date: eventDate,
        venue: eventVenue
      });
    }

    // Register card in admin directory
    saveUserCardToRegistry({
      slug: finalSlug,
      cardId: currentEditingCardId,
      templateName: meta.templateName,
      names: coupleNames,
      date: eventDate,
      venue: eventVenue,
      url: shareUrl,
      config: overrides
    });

    currentShareData = {
      slug: finalSlug,
      names: coupleNames,
      baseUrl: origin + '/invite/?card=' + finalSlug,
      dParam: '',
      fullUrl: shareUrl
    };

    closeAdminEditorModal();
    openAdminShareModal(shareUrl, coupleNames);

    var toastMsg = isNewUser
      ? '🎉 Unique Link Ready for New User: ' + coupleNames + '!'
      : '✅ Changes Saved! Updated Link for ' + coupleNames + '.';
    showAdminToast(toastMsg);
  };

  // Launch Full In-Place Interactive Visual Studio Editor in a new tab
  window.launchVisualEditor = function () {
    var meta = getTemplateMetaById(currentEditingCardId);
    var slug = currentEditingCardSlug;

    if (!slug) {
      slug = generateUniqueSlug(meta.prefix);
      currentEditingCardSlug = slug;
      // Pre-seed registry
      saveUserCardToRegistry({
        slug: slug,
        cardId: currentEditingCardId,
        templateName: meta.templateName,
        names: 'New Invitation Card',
        updatedAt: Date.now(),
        config: {}
      });
    }

    var url = meta.folder + 'index.html?edit=1&admin=1&card=' + encodeURIComponent(slug);
    window.open(url, '_blank');
  };

  // ─────────────────────────────────────────────────────────────────
  // 5. SAVED USER CARDS MANAGER MODAL
  // ─────────────────────────────────────────────────────────────────

  window.openAdminSavedCardsModal = function () {
    if (!isAdminLoggedIn()) {
      openAdminLoginModal();
      return;
    }
    const modal = document.getElementById('admin-saved-cards-modal');
    if (modal) {
      modal.classList.add('is-open');
      renderAdminSavedCardsList();
    }
  };

  window.closeAdminSavedCardsModal = function () {
    const modal = document.getElementById('admin-saved-cards-modal');
    if (modal) modal.classList.remove('is-open');
  };

  window.renderAdminSavedCardsList = function () {
    const container = document.getElementById('admin-saved-cards-list');
    if (!container) return;

    const cards = getSavedUserCards();
    const searchInp = document.getElementById('admin-saved-cards-search');
    const q = (searchInp?.value || '').toLowerCase().trim();

    const filtered = cards.filter(card => {
      if (!q) return true;
      var matchName = (card.names || '').toLowerCase().indexOf(q) !== -1;
      var matchSlug = (card.slug || '').toLowerCase().indexOf(q) !== -1;
      var matchTpl = (card.templateName || '').toLowerCase().indexOf(q) !== -1;
      return matchName || matchSlug || matchTpl;
    });

    if (filtered.length === 0) {
      container.innerHTML =
        '<div class="admin-empty-saved-cards">' +
        (q ? '🔍 No cards match "' + q + '".' : '📂 No saved user cards yet. Click "➕ New User Card" to create your first client card!') +
        '</div>';
      return;
    }

    let html = '<div class="admin-saved-cards-grid">';
    filtered.forEach(card => {
      var dateStr = card.updatedAt ? new Date(card.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';
      var origin = window.location.origin || 'https://invitation-card-umber-six.vercel.app';
      var liveUrl = card.url || (origin + '/invite/?card=' + card.slug);
      var meta = getTemplateMetaById(card.cardId || 102);
      var studioUrl = meta.folder + 'index.html?edit=1&admin=1&card=' + card.slug;

      html +=
        '<div class="admin-saved-card-row">' +
          '<div class="admin-saved-card-info">' +
            '<div class="admin-saved-card-header">' +
              '<h4 class="admin-saved-card-names">' + (card.names || 'Invitation Card') + '</h4>' +
              '<span class="admin-template-badge">' + (card.templateName || 'Royale') + '</span>' +
            '</div>' +
            '<div class="admin-saved-card-meta">' +
              '<span>Slug: <code>' + card.slug + '</code></span>' +
              (card.date ? '<span>• ' + card.date + '</span>' : '') +
              '<span>• Updated: ' + dateStr + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="admin-saved-card-actions">' +
            '<button type="button" class="admin-btn-row-action admin-btn-row-edit" onclick="editAdminSavedCard(\'' + card.slug + '\')">✏️ Edit Details</button>' +
            '<a href="' + studioUrl + '" target="_blank" class="admin-btn-row-action admin-btn-row-studio">🎨 Visual Studio</a>' +
            '<a href="' + liveUrl + '" target="_blank" class="admin-btn-row-action admin-btn-row-live">🌐 View Live</a>' +
            '<button type="button" class="admin-btn-row-action admin-btn-row-copy" onclick="copyCardLink(\'' + liveUrl + '\', this)">📋 Copy Link</button>' +
            '<button type="button" class="admin-btn-row-action admin-btn-row-del" onclick="if(confirm(\'Delete card for ' + (card.names || card.slug) + '? This cannot be undone.\')) deleteUserCardFromRegistry(\'' + card.slug + '\')">🗑️</button>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  };

  window.editAdminSavedCard = function (slug) {
    closeAdminSavedCardsModal();
    openAdminEditor(null, slug);
  };

  window.copyCardLink = function (url, btn) {
    navigator.clipboard.writeText(url).then(function () {
      var prev = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.style.color = '#22c55e';
      setTimeout(function () {
        btn.textContent = prev;
        btn.style.color = '';
      }, 2000);
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // 6. SHARE MODAL (Your Invitation is Ready!)
  // ─────────────────────────────────────────────────────────────────

  window.openAdminShareModal = function (url, names) {
    var modal = document.getElementById('admin-share-modal');
    if (!modal) return;

    var linkEl = document.getElementById('admin-share-link-text');
    var openBtn = document.getElementById('admin-open-live-btn');
    var guestInp = document.getElementById('admin-guest-input');

    if (linkEl) linkEl.textContent = url;
    if (openBtn) openBtn.href = url;
    if (guestInp) guestInp.value = '';

    updateAdminGuestUrl();
    modal.classList.add('is-open');
  };

  window.closeAdminShareModal = function () {
    var modal = document.getElementById('admin-share-modal');
    if (modal) modal.classList.remove('is-open');
  };

  window.updateAdminGuestUrl = function () {
    var guestInp = document.getElementById('admin-guest-input');
    var guestName = (guestInp?.value || '').trim();
    var linkEl = document.getElementById('admin-share-link-text');
    var openBtn = document.getElementById('admin-open-live-btn');
    var waBtn = document.getElementById('admin-whatsapp-btn');

    var finalUrl = currentShareData.baseUrl || window.location.origin + '/invite/';
    if (currentShareData.names) finalUrl += '&names=' + encodeURIComponent(currentShareData.names);
    if (guestName) finalUrl += '&guest=' + encodeURIComponent(guestName);

    if (currentShareData.dParam) {
      if (currentShareData.dParam.length <= 1500) {
        finalUrl += '&d=' + currentShareData.dParam;
      } else {
        finalUrl += '#d=' + currentShareData.dParam;
      }
    }

    if (linkEl) linkEl.textContent = finalUrl;
    if (openBtn) openBtn.href = finalUrl;

    if (waBtn) {
      var waMsg = 'Namaste! 🙏✨\n\n' +
        (guestName ? 'Special Invitation for ' + guestName + ':\n\n' : '') +
        'We joyfully invite you to celebrate with us!\n\n' +
        '💌 Open your interactive invitation card here:\n' +
        finalUrl;
      waBtn.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(waMsg);
    }
  };

  window.copyAdminShareLink = function () {
    var linkEl = document.getElementById('admin-share-link-text');
    var copyBtn = document.getElementById('admin-copy-link-btn');
    if (!linkEl) return;

    var text = linkEl.textContent;
    navigator.clipboard.writeText(text).then(function () {
      if (copyBtn) {
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = '#22c55e';
        copyBtn.style.color = '#fff';
        setTimeout(function () {
          copyBtn.textContent = '📋 Copy';
          copyBtn.style.background = '';
          copyBtn.style.color = '';
        }, 2500);
      }
    }).catch(function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (copyBtn) {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(function () { copyBtn.textContent = '📋 Copy'; }, 2500);
      }
    });
  };

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    updateAdminUI();
  });

})();
