/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNIVERSAL CARD ENGINE — InviteStory Platform Core
 * Royal Wedding-Style In-Place Visual Editor for ALL Cards (101, 102, 103, 104, 105)
 * 
 * Features:
 *  1. In-Place Visual Text Editing (contenteditable on names, dates, venues, mantras, blessings)
 *  2. Direct Photo Swapping & Canvas Compression (<1200px WebP/JPEG)
 *  3. Interactive Timeline & Ceremonies Manager (add/edit/delete ceremonies)
 *  4. Top Studio Floating Toolbar (Quick Edit, Timeline, Preview Toggle, Save, Share)
 *  5. Automatic Cover / Entrance Handling in Edit Mode
 *  6. Per-User Card Isolation (User 1 data stays isolated; User 2 starts fresh)
 *  7. Admin-Only Security (Guests see 100% clean, locked invitation; zero edit affordances)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // 1. TEMPLATE REGISTRY (Single Source of Truth)
  const CARD_TEMPLATES = [
    {
      id: 101,
      name: "Meghal’s Baby Shower · Wax Seal Royale",
      shortName: "Wax Seal Baby Shower",
      prefix: "palna",
      category: "Baby Shower",
      icon: "🍼",
      folder: "/card 3/templates/shahi-palna/",
      templatePath: "/card 3/templates/shahi-palna/index.html"
    },
    {
      id: 102,
      name: "The Royal Darbar 3D Wedding",
      shortName: "Royal Palace 3D",
      prefix: "shahi",
      category: "Wedding",
      icon: "🏰",
      folder: "/card 1/templates/royale/",
      templatePath: "/card 1/templates/royale/index.html"
    },
    {
      id: 103,
      name: "Lotus Palace & Papercut Royale",
      shortName: "Papercut Lotus",
      prefix: "lotus",
      category: "Wedding",
      icon: "🪷",
      folder: "/card 2/templates/papercut-magenta/",
      templatePath: "/card 2/templates/papercut-magenta/index.html"
    },
    {
      id: 104,
      name: "Ever After Bloom · Illustrated Storybook",
      shortName: "Ever After Bloom",
      prefix: "bloom",
      category: "Storybook Wedding",
      icon: "🌸",
      folder: "/card 4/templates/ever-after-bloom/",
      templatePath: "/card 4/templates/ever-after-bloom/index.html"
    },
    {
      id: 105,
      name: "Aabha (Mithril) · Luxury Key Heirloom",
      shortName: "Aabha Mithril",
      prefix: "mithril",
      category: "Luxury Heirloom",
      icon: "🗝️",
      folder: "/card 5/templates/mithril/",
      templatePath: "/card 5/templates/mithril/index.html"
    }
  ];

  window.INVITESTORY_TEMPLATES = CARD_TEMPLATES;

  // 2. HELPER UTILITIES
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));

  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (typeof base !== 'object' || base === null) return over !== undefined ? over : base;
    if (typeof over !== 'object' || over === null) return base;
    const out = {};
    Object.keys(base).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
    Object.keys(over).forEach((k) => { if (!(k in base)) out[k] = over[k]; });
    return out;
  }

  function getSafeOrigin() {
    const h = location.hostname;
    if (!h || h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.')) {
      return 'https://invitation-card-umber-six.vercel.app';
    }
    return (location.origin && location.origin !== 'null') ? location.origin : 'https://invitation-card-umber-six.vercel.app';
  }

  function isAdminLoggedIn() {
    try {
      return localStorage.getItem('invitestory_admin_session') === 'true';
    } catch (_) {
      return false;
    }
  }

  function randomSlug(len) {
    len = len || 6;
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  }

  function resolvePath(obj, path) {
    const parts = String(path).split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]];
    }
    return { obj: cur, key: parts[parts.length - 1] };
  }

  function getNestedVal(obj, path, def) {
    try {
      const parts = String(path).split('.');
      let cur = obj;
      for (let i = 0; i < parts.length; i++) {
        if (cur == null) return def;
        cur = cur[parts[i]];
      }
      return cur !== undefined ? cur : def;
    } catch (_) {
      return def;
    }
  }

  function setNestedVal(obj, path, val) {
    const r = resolvePath(obj, path);
    r.obj[r.key] = val;
  }

  // 3. DETECT TEMPLATE CONTEXT
  function detectTemplate() {
    const path = location.pathname.toLowerCase();
    if (path.indexOf('card 3') !== -1 || path.indexOf('palna') !== -1 || window.Palna) return CARD_TEMPLATES[0]; // 101
    if (path.indexOf('card 1') !== -1 || path.indexOf('royale') !== -1 || window.Royale) return CARD_TEMPLATES[1]; // 102
    if (path.indexOf('card 2') !== -1 || path.indexOf('papercut') !== -1 || window.Papercut) return CARD_TEMPLATES[2]; // 103
    if (path.indexOf('card 4') !== -1 || path.indexOf('bloom') !== -1 || path.indexOf('ever-after') !== -1 || window.INVITATION_CONFIG) return CARD_TEMPLATES[3]; // 104
    if (path.indexOf('card 5') !== -1 || path.indexOf('mithril') !== -1 || window.VERONA_CONFIG) return CARD_TEMPLATES[4]; // 105
    return CARD_TEMPLATES[1]; // Default fallback to 102
  }

  // 4. CONFIG READ / WRITE
  function getCurrentConfig(tpl) {
    if (tpl.id === 101 && window.Palna) return window.Palna.config || {};
    if (tpl.id === 102 && window.Royale) return window.Royale.config || {};
    if (tpl.id === 103 && window.Papercut) return window.Papercut.config || {};
    if (tpl.id === 104 && window.INVITATION_CONFIG) return window.INVITATION_CONFIG || {};
    if (tpl.id === 105 && window.VERONA_CONFIG) return window.VERONA_CONFIG || {};
    return window.CARD_CONFIG || {};
  }

  function setConfigBack(tpl, cfg) {
    if (tpl.id === 101 && window.Palna) window.Palna.config = cfg;
    if (tpl.id === 102 && window.Royale) window.Royale.config = cfg;
    if (tpl.id === 103 && window.Papercut) window.Papercut.config = cfg;
    if (tpl.id === 104) window.INVITATION_CONFIG = cfg;
    if (tpl.id === 105) window.VERONA_CONFIG = cfg;
    window.CARD_CONFIG = cfg;
  }

  function extractDelta(cfg) {
    if (!cfg || typeof cfg !== 'object') return {};
    const delta = {};
    const skipKeys = { 'version': true };
    for (let k in cfg) {
      if (Object.prototype.hasOwnProperty.call(cfg, k)) {
        if (!skipKeys[k] && cfg[k] !== undefined && cfg[k] !== null && typeof cfg[k] !== 'function') {
          delta[k] = cfg[k];
        }
      }
    }
    return delta;
  }

  // 5. UNIVERSAL TOAST NOTIFICATION
  let toastEl = null;
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'ue-floating-toast';
      toastEl.className = 'ue-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = msg;
    toastEl.classList.add('is-active');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toastEl) toastEl.classList.remove('is-active');
    }, 2400);
  }

  // 6. UNIVERSAL DOM RENDERER
  function renderTemplateDOM(tpl, cfg) {
    if (!cfg) return;

    // Card 1: Royale
    if (tpl.id === 102) {
      if (window.Royale && window.Royale.render && typeof window.Royale.render.all === 'function') {
        window.Royale.render.all();
      }
      const bName = cfg.brideName || 'Aayushi';
      const gName = cfg.groomName || 'Siddhant';
      const elB = document.getElementById('ryBrideName');
      if (elB) elB.textContent = bName;
      const elG = document.getElementById('ryGroomName');
      if (elG) elG.textContent = gName;
      const elInv = document.getElementById('ryInvocation');
      if (elInv && cfg.invocation) {
        elInv.textContent = cfg.invocation.custom || cfg.invocation.text || elInv.textContent;
      }
      const elNote = document.getElementById('ryIntroNote');
      if (elNote && cfg.introNote) elNote.textContent = cfg.introNote;
      return;
    }

    // Card 2: Papercut Lotus
    if (tpl.id === 103) {
      if (window.Papercut && window.Papercut.render && typeof window.Papercut.render.all === 'function') {
        window.Papercut.render.all();
      }
      const bName = cfg.brideName || 'Ankita';
      const gName = cfg.groomName || 'Kaushik';
      const elB = document.getElementById('pcBrideName');
      if (elB) elB.textContent = bName;
      const elG = document.getElementById('pcGroomName');
      if (elG) elG.textContent = gName;
      const elInv = document.getElementById('pcInvocation');
      if (elInv && cfg.invocation) {
        elInv.textContent = cfg.invocation.custom || cfg.invocation.text || elInv.textContent;
      }
      const elNote = document.getElementById('pcIntroNote');
      if (elNote && cfg.introNote) elNote.textContent = cfg.introNote;
      return;
    }

    // Card 3: Wax Seal Baby Shower
    if (tpl.id === 101) {
      const mom = cfg.momName || cfg.brideName || 'Meghal';
      const dad = cfg.dadName || cfg.groomName || 'Kaushal';
      const couple = [mom, dad].filter(Boolean).join(' & ') || 'Meghal & Kaushal';
      const dateStr = cfg.eventDateText || cfg.date || 'Sunday, 22 November 2026';
      const venueStr = cfg.venueName || cfg.venue || 'Adelaide SA, Klemzig Community Hall';
      const hostsStr = cfg.hosts || 'Patel Family';

      const elFirst = document.querySelector('.hero-name-first');
      if (elFirst) elFirst.textContent = mom;
      const elSecond = document.querySelector('.hero-name-second');
      if (elSecond) elSecond.textContent = dad;
      const elParents = document.querySelector('.parents-names');
      if (elParents) elParents.textContent = couple;

      const elOccasion = document.querySelector('.hero-occasion');
      if (elOccasion && cfg.occasion) elOccasion.textContent = cfg.occasion;
      const elHeroDate = document.querySelector('.hero-date');
      if (elHeroDate && cfg.heroDate) elHeroDate.textContent = cfg.heroDate;

      const elBlessing = document.querySelector('.hero-sacred-blessing span');
      if (elBlessing && cfg.sacredBlessing) elBlessing.textContent = cfg.sacredBlessing;

      const elVerse = document.querySelector('.verse-quote');
      if (elVerse && cfg.verseQuote) elVerse.innerHTML = esc(cfg.verseQuote).replace(/\n/g, '<br>');

      const elHostIntro = document.querySelector('.host-intro');
      if (elHostIntro && cfg.hostIntro) elHostIntro.textContent = cfg.hostIntro;

      const elHostText = document.querySelector('.host-text');
      if (elHostText) {
        if (cfg.hostText) {
          elHostText.textContent = cfg.hostText;
        } else if (cfg.eventTagline) {
          elHostText.textContent = cfg.eventTagline;
        } else {
          elHostText.textContent = 'Join us to shower mother-to-be ' + mom + ' and father-to-be ' + dad + ' with love, laughter, blessings, and unforgettable memories as we celebrate the upcoming arrival of our little baby.';
        }
      }

      const elLunch = document.querySelector('.event-lunch-badge');
      if (elLunch) {
        if (cfg.eventDateBadge) {
          elLunch.innerHTML = cfg.eventDateBadge;
        } else {
          elLunch.innerHTML = dateStr.toUpperCase() + '<br><span class="lunch-note">FOLLOWED BY LUNCH</span>';
        }
      }

      const elVenueTitle = document.querySelector('.venue-card-title');
      if (elVenueTitle) elVenueTitle.textContent = cfg.venueStreet || venueStr;
      const elVenuePlace = document.querySelector('.venue-card-place');
      if (elVenuePlace && cfg.venueSuburb) elVenuePlace.textContent = cfg.venueSuburb;
      const elVenueAddr = document.querySelector('.venue-card-addr');
      if (elVenueAddr && cfg.venueCity) elVenueAddr.textContent = cfg.venueCity;

      const elRsvp = document.querySelector('.rsvp-date-badge');
      if (elRsvp && cfg.rsvpDate) elRsvp.textContent = cfg.rsvpDate;

      const elFamily = document.querySelector('.footer-family');
      if (elFamily) elFamily.textContent = 'With love, ' + hostsStr;

      const elHash = document.querySelector('.footer-hash');
      if (elHash) {
        if (cfg.hashtags) {
          elHash.textContent = cfg.hashtags;
        } else {
          elHash.textContent = '#' + mom.replace(/[^a-zA-Z0-9]/g, '') + dad.replace(/[^a-zA-Z0-9]/g, '') + 'BabyShower • #BabyShower2026';
        }
      }

      if (cfg.sacredArtImg) {
        const elArt = document.querySelector('.sacred-art-img');
        if (elArt) elArt.src = cfg.sacredArtImg;
      }

      const btnMaps = document.querySelector('.btn-maps');
      if (btnMaps) btnMaps.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venueStr);
      return;
    }

    // Card 4: Ever After Bloom
    if (tpl.id === 104) {
      const couple = cfg.couple || {};
      const bride = couple.bride || 'Aarohi';
      const groom = couple.groom || 'Ishaan';
      const dateStr = cfg.dateLabel || 'Sunday, 14 February 2027';
      const timeStr = cfg.timeLabel || '6:30 in the evening';
      const venueObj = cfg.venue || {};
      const venueStr = (venueObj.name || venueObj.address || cfg.venueName || 'Amrit Mahal Palace, Jal Marg, Old City, Jaipur');
      const dress = cfg.dressCode || 'Festive Indian — pastels, ivory & gold';
      const blessing = (cfg.hero && cfg.hero.blessing) || cfg.blessing || 'Two rivers, one sky';

      const elHeroNames = document.getElementById('heroNames');
      if (elHeroNames) {
        elHeroNames.innerHTML = esc(bride) + '<span class="mx-3 font-script text-3xl italic sm:text-4xl">&amp;</span><br class="sm:hidden"/>' + esc(groom);
      }

      const elKicker = document.querySelector('p.font-sans.text-\\[0\\.62rem\\].tracking-\\[0\\.5em\\]');
      if (elKicker && (cfg.heroKicker || (cfg.hero && cfg.hero.kicker))) {
        elKicker.textContent = cfg.heroKicker || cfg.hero.kicker;
      }

      const elBlessing = document.querySelector('p.font-script.text-xl.text-primary\\/80');
      if (elBlessing) elBlessing.textContent = blessing;

      // Find The Day, The Hour, The Place, Dress Code
      document.querySelectorAll('.plate.paper-grain').forEach((card) => {
        const text = card.textContent || '';
        if (text.includes('The Day')) {
          const p = card.querySelector('.font-display');
          if (p) p.textContent = dateStr;
        } else if (text.includes('The Hour')) {
          const p = card.querySelector('.font-display');
          if (p) p.textContent = timeStr;
        } else if (text.includes('The Place')) {
          const p = card.querySelector('.font-display');
          if (p) p.textContent = venueStr;
        } else if (text.includes('Dress Code')) {
          const p = card.querySelector('.font-display');
          if (p) p.textContent = dress;
        }
      });

      // Chapter One Story names and text
      const storyHeaders = document.querySelectorAll('p.font-sans.text-\\[0\\.62rem\\].tracking-\\[0\\.4em\\]');
      storyHeaders.forEach(sh => {
        if (sh.textContent.includes('The Bride')) {
          const h = sh.nextElementSibling;
          if (h) h.textContent = bride;
          const p = h ? h.nextElementSibling : null;
          if (p && cfg.brideStory) p.textContent = cfg.brideStory;
        } else if (sh.textContent.includes('The Groom')) {
          const h = sh.nextElementSibling;
          if (h) h.textContent = groom;
          const p = h ? h.nextElementSibling : null;
          if (p && cfg.groomStory) p.textContent = cfg.groomStory;
        }
      });

      // Portraits
      if (cfg.bridePortrait) {
        const imgB = document.querySelector('img[src*="portrait-bride"]');
        if (imgB) imgB.src = cfg.bridePortrait;
      }
      if (cfg.groomPortrait) {
        const imgG = document.querySelector('img[src*="portrait-groom"]');
        if (imgG) imgG.src = cfg.groomPortrait;
      }

      // Footer signoff
      const footerLove = document.querySelector('footer p.font-display.text-lg.text-primary');
      if (footerLove) footerLove.textContent = cfg.closingLove || ('With all our love, ' + bride + ' & ' + groom);

      const footerDate = document.querySelector('footer p.font-sans.text-\\[0\\.6rem\\].tracking-\\[0\\.34em\\]');
      if (footerDate) footerDate.textContent = dateStr;

      const footerQuote = document.querySelector('footer h2.font-script');
      if (footerQuote && cfg.closingQuote) footerQuote.innerHTML = esc(cfg.closingQuote).replace(/\n/g, '<br>');

      // Gallery photos if custom gallery is present
      if (Array.isArray(cfg.gallery)) {
        const galleryImgs = document.querySelectorAll('.gallery-card img');
        cfg.gallery.forEach((item, idx) => {
          if (galleryImgs[idx] && item.src) {
            galleryImgs[idx].src = item.src;
            const btn = galleryImgs[idx].closest('.gallery-card');
            if (btn && item.caption) btn.dataset.caption = item.caption;
          }
        });
      }
      return;
    }

    // Card 5: Aabha Mithril
    if (tpl.id === 105) {
      const couple = cfg.couple || 'Kian & Aria';
      const dateStr = cfg.date || 'Sunday, 18 October 2026';
      const venueStr = cfg.venue || 'Jagmandir Island Palace, Udaipur';
      const timeStr = cfg.time || '7:00 PM';

      document.querySelectorAll('.vr-cover-names').forEach(el => el.textContent = couple);
      const heroTitle = document.querySelector('h1[data-hero]');
      if (heroTitle) heroTitle.textContent = couple;
      const heroSub = document.querySelector('p[data-hero]');
      if (heroSub && (cfg.heroSubtitle || (cfg.hero && cfg.hero.eyebrow))) {
        heroSub.textContent = cfg.heroSubtitle || cfg.hero.eyebrow;
      }
      const heroDate = document.querySelector('p.font-cormorant[data-hero]');
      if (heroDate && cfg.heroDate) heroDate.textContent = cfg.heroDate;

      const namesSpan = document.querySelector('span[data-v="P"]');
      if (namesSpan) namesSpan.textContent = couple;
      const scratchKicker = document.querySelector('.vr-scratch-card .font-cinzel.tracking-\\[0\\.28em\\]');
      if (scratchKicker) scratchKicker.textContent = "The Reception of " + couple;

      // Spans in invitation letter
      const spansE = document.querySelectorAll('#sections section:nth-of-type(1) span[data-v="E"]');
      if (spansE.length >= 4) {
        if (cfg.hostParents) spansE[0].textContent = cfg.hostParents;
        if (cfg.requestText) spansE[1].textContent = cfg.requestText;
        if (cfg.brideParents) spansE[2].textContent = cfg.brideParents;
        if (cfg.closingBlessing) spansE[3].textContent = cfg.closingBlessing;
      }

      // Scratch card internal text
      const scratchDate = document.querySelector('#vrScratch span.font-pinyon');
      if (scratchDate) scratchDate.textContent = dateStr;
      const scratchCinzel = document.querySelectorAll('#vrScratch span.font-cinzel');
      if (scratchCinzel && scratchCinzel.length > 0) {
        scratchCinzel[scratchCinzel.length - 1].textContent = timeStr + ' · ' + venueStr;
      }

      // The Evening venue & time section
      const eveningTime = document.querySelector('.mithril-v4-venue p.font-cinzel');
      if (eveningTime) eveningTime.textContent = timeStr;
      const eveningVenue = document.querySelector('.mithril-v4-venue p.font-cormorant');
      if (eveningVenue) eveningVenue.textContent = venueStr;
      const eveningMap = document.querySelector('.mithril-v4-venue a[href*="maps"]');
      if (eveningMap) eveningMap.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venueStr);

      const quoteEl = document.querySelector('p.vr-oneline');
      if (quoteEl && cfg.closingQuote) quoteEl.textContent = cfg.closingQuote;
      const noteEl = document.querySelector('p.font-pinyon:last-of-type');
      if (noteEl && cfg.closingNote) noteEl.textContent = cfg.closingNote;

      const portraitImg = document.querySelector('.mithril-v4-portrait img');
      if (portraitImg && cfg.couplePortrait) portraitImg.src = cfg.couplePortrait;

      const calNote = document.querySelector('.wc-note');
      if (calNote) {
        calNote.innerHTML = "The Reception of " + esc(couple) + "<br>" + esc(dateStr) + " · " + esc(timeStr) + "<br>" + esc(venueStr);
      }
      return;
    }
  }

  // 7. PERSISTENCE & CLOUD SYNC
  let saveDebounceTimer = null;
  function persistCardConfig(tpl, cfg, immediate) {
    const sp = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    let slug = sp.get('card') || sp.get('slug') || hashParams.get('card') || hashParams.get('slug') || '';

    if (!slug) {
      slug = tpl.prefix + '-' + randomSlug(6);
      sp.set('card', slug);
      sp.set('edit', '1');
      if (isAdminLoggedIn()) sp.set('admin', '1');
      try {
        history.replaceState(null, '', location.pathname + '?' + sp.toString() + location.hash);
      } catch (_) {}
    }

    const groom = (cfg.groomName || cfg.dadName || (cfg.couple && cfg.couple.groom) || '').trim();
    const bride = (cfg.brideName || cfg.momName || (cfg.couple && cfg.couple.bride) || '').trim();
    const couple = [groom, bride].filter(Boolean).join(' & ') || cfg.title || (typeof cfg.couple === 'string' ? cfg.couple : '') || tpl.shortName;

    function doSave() {
      // 1. LocalStorage by slug
      try {
        localStorage.setItem('card_' + slug, JSON.stringify(cfg));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      // 2. CloudStorage sync
      const meta = {
        cardId: tpl.id,
        templateName: tpl.name,
        names: couple,
        date: cfg.eventDateText || cfg.date || cfg.dateLabel || cfg.eventISO || '',
        venue: cfg.venueName || (cfg.venue && (cfg.venue.name || cfg.venue)) || ''
      };

      if (window.CloudStorage && typeof window.CloudStorage.saveCard === 'function') {
        window.CloudStorage.saveCard(slug, cfg, meta).catch(function () {});
      }

      // 3. Admin Registry sync
      try {
        let reg = [];
        try { reg = JSON.parse(localStorage.getItem('invitestory_cards_registry') || '[]'); } catch (_) {}
        const cleanUrl = getSafeOrigin() + '/invite/?card=' + encodeURIComponent(slug) + (couple ? '&names=' + encodeURIComponent(couple) : '');
        const existingIdx = reg.findIndex(c => c.slug === slug);
        const cardRecord = {
          slug: slug,
          cardId: tpl.id,
          templateName: tpl.name,
          names: couple,
          date: meta.date,
          venue: meta.venue,
          updatedAt: Date.now(),
          url: cleanUrl,
          config: cfg
        };
        if (existingIdx >= 0) {
          reg[existingIdx] = Object.assign({}, reg[existingIdx], cardRecord);
        } else {
          reg.unshift(cardRecord);
        }
        localStorage.setItem('invitestory_cards_registry', JSON.stringify(reg));
      } catch (_) {}

      // 4. Flash Saved Indicator
      const saveBtn = document.getElementById('ueBtnSave');
      if (saveBtn) {
        const origText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span>✓</span> Saved!';
        saveBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        setTimeout(() => {
          saveBtn.innerHTML = origText;
          saveBtn.style.background = '';
        }, 1800);
      }
      showToast('Changes saved live to client card ✓');
    }

    if (immediate) {
      clearTimeout(saveDebounceTimer);
      doSave();
    } else {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = setTimeout(doSave, 450);
    }
  }

  // 8. GENERATE SHAREABLE INVITE LINK (Universal & Clean)
  function generateUniversalInviteUrl() {
    const origin = getSafeOrigin();
    const sp = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const tpl = detectTemplate();
    let cardSlug = sp.get('card') || sp.get('slug') || hashParams.get('card') || '';

    if (!cardSlug) {
      cardSlug = tpl.prefix + '-' + randomSlug(6);
    }

    const currentCfg = getCurrentConfig(tpl);
    const groom = (currentCfg.groomName || currentCfg.dadName || (currentCfg.couple && currentCfg.couple.groom) || '').trim();
    const bride = (currentCfg.brideName || currentCfg.momName || (currentCfg.couple && currentCfg.couple.bride) || '').trim();
    const couple = [groom, bride].filter(Boolean).join(' & ') || currentCfg.title || (typeof currentCfg.couple === 'string' ? currentCfg.couple : '') || tpl.name;

    const finalUrl = origin + '/invite/?card=' + encodeURIComponent(cardSlug) + (couple ? '&names=' + encodeURIComponent(couple) : '');

    // Immediate save
    persistCardConfig(tpl, currentCfg, true);
    return finalUrl;
  }

  // 9. SHARE MODAL DIALOG
  function openUniversalShareModal(inviteLink) {
    const existing = document.getElementById('universal-share-modal');
    if (existing) existing.remove();

    const tpl = detectTemplate();
    const cfg = getCurrentConfig(tpl);
    const groom = (cfg.groomName || cfg.dadName || (cfg.couple && cfg.couple.groom) || '').trim();
    const bride = (cfg.brideName || cfg.momName || (cfg.couple && cfg.couple.bride) || '').trim();
    const couple = [groom, bride].filter(Boolean).join(' & ') || 'our celebration';

    const waText = encodeURIComponent('Namaste! 🙏✨\nWe cordially invite you to celebrate with us:\n💌 ' + couple + '\n👉 View your interactive invitation card:\n' + inviteLink);

    const overlay = document.createElement('div');
    overlay.id = 'universal-share-modal';
    overlay.className = 'ue-modal-overlay';
    overlay.innerHTML = `
      <div class="ue-modal-box">
        <div style="font-size: 38px; margin-bottom: 6px;">🎉</div>
        <h3 style="margin: 0 0 8px 0; font-size: 21px; font-weight: 700; color: #f7eedc;">Your Invitation Link is Ready!</h3>
        <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #c4b5a0; line-height: 1.5;">
          This clean, personalized link is ready to share with guests:
        </p>
        <div class="ue-link-row">
          <input type="text" id="ueShareLinkInput" readonly value="${esc(inviteLink)}" />
          <button type="button" id="ueCopyBtn" class="ue-btn ue-btn-copy">📋 Copy</button>
        </div>
        <div style="margin: 14px 0;">
          <a class="ue-btn ue-btn-whatsapp" href="https://api.whatsapp.com/send?text=${waText}" target="_blank">
            💬 Share on WhatsApp
          </a>
        </div>
        <div class="ue-actions-row">
          <a class="ue-btn ue-btn-primary" target="_blank" href="${esc(inviteLink)}">🌐 View Live Guest Card</a>
          <button type="button" class="ue-btn ue-btn-secondary" id="ueCloseBtn">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('ueShareLinkInput');
    const copyBtn = document.getElementById('ueCopyBtn');
    const closeBtn = document.getElementById('ueCloseBtn');

    copyBtn.onclick = function () {
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2200);
      }, () => {
        document.execCommand('copy');
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2200);
      });
    };

    closeBtn.onclick = function () { overlay.remove(); };
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
  }

  // 10. PHOTO UPLOAD & CANVAS COMPRESSION
  function pickAndCompressPhoto(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = function () {
      const file = input.files && input.files[0];
      if (!file) {
        input.remove();
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          const MAX = 1200;
          if (w > MAX || h > MAX) {
            if (w > h) {
              h = Math.round((h * MAX) / w);
              w = MAX;
            } else {
              w = Math.round((w * MAX) / h);
              h = MAX;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
          input.remove();
          callback(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }

  // 11. TIMELINE & CEREMONIES EDITOR
  function openCeremoniesManager() {
    const tpl = detectTemplate();
    const cfg = getCurrentConfig(tpl);
    const existing = document.getElementById('universal-ceremonies-modal');
    if (existing) existing.remove();

    if (!Array.isArray(cfg.ceremonies) || cfg.ceremonies.length === 0) {
      cfg.ceremonies = [
        { name: 'Mandap Muhurat', date: cfg.eventDateText || '2026-11-28', time: '07:00 AM', venue: cfg.venueName || 'Grand Palace Ballroom', mapUrl: '' },
        { name: 'Hasta Melap (Wedding Ceremony)', date: cfg.eventDateText || '2026-11-29', time: '06:00 PM', venue: cfg.venueName || 'Diwali-Ba Resort', mapUrl: '' },
        { name: 'Wedding Dinner & Reception', date: cfg.eventDateText || '2026-11-29', time: '07:30 PM', venue: cfg.venueName || 'Diwali-Ba Resort', mapUrl: '' }
      ];
    }

    function renderList() {
      const listEl = document.getElementById('ueCereList');
      if (!listEl) return;
      let html = '';
      cfg.ceremonies.forEach((c, idx) => {
        html += `
          <div class="ue-cere-item" data-idx="${idx}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 700; color: #f0c978; font-size: 13px;">#${idx + 1} ${esc(c.name || 'Ceremony')}</span>
              <button type="button" class="ue-btn-del" data-del="${idx}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px;">🗑️</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              <div>
                <label style="font-size: 10.5px; color: #aaa; text-transform: uppercase;">Title</label>
                <input type="text" class="ue-cere-inp" data-field="name" value="${esc(c.name || '')}" style="width: 100%;" />
              </div>
              <div>
                <label style="font-size: 10.5px; color: #aaa; text-transform: uppercase;">Time</label>
                <input type="text" class="ue-cere-inp" data-field="time" value="${esc(c.time || '')}" placeholder="07:00 PM" style="width: 100%;" />
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="font-size: 10.5px; color: #aaa; text-transform: uppercase;">Date</label>
                <input type="text" class="ue-cere-inp" data-field="date" value="${esc(c.date || '')}" placeholder="2026-11-29" style="width: 100%;" />
              </div>
              <div>
                <label style="font-size: 10.5px; color: #aaa; text-transform: uppercase;">Venue</label>
                <input type="text" class="ue-cere-inp" data-field="venue" value="${esc(c.venue || '')}" placeholder="Resort / Hall name" style="width: 100%;" />
              </div>
            </div>
          </div>
        `;
      });
      listEl.innerHTML = html;

      // Bind deletes
      listEl.querySelectorAll('[data-del]').forEach(btn => {
        btn.onclick = function () {
          const idx = parseInt(btn.dataset.del, 10);
          cfg.ceremonies.splice(idx, 1);
          renderList();
        };
      });

      // Bind inputs
      listEl.querySelectorAll('.ue-cere-inp').forEach(inp => {
        inp.oninput = function () {
          const itemWrap = inp.closest('.ue-cere-item');
          const idx = parseInt(itemWrap.dataset.idx, 10);
          const field = inp.dataset.field;
          if (cfg.ceremonies[idx]) {
            cfg.ceremonies[idx][field] = inp.value;
          }
        };
      });
    }

    const drawer = document.createElement('div');
    drawer.id = 'universal-ceremonies-modal';
    drawer.className = 'ue-drawer-overlay';
    drawer.innerHTML = `
      <div class="ue-drawer-panel">
        <div class="ue-drawer-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">📅</span>
            <h4 style="margin: 0; font-size: 17px; font-weight: 700; color: #f7eedc;">Timeline &amp; Ceremonies</h4>
          </div>
          <button type="button" class="ue-drawer-close" id="ueCereCloseBtn">✕</button>
        </div>
        <div class="ue-drawer-body">
          <p style="margin: 0 0 14px 0; font-size: 13px; color: #aaa; line-height: 1.4;">
            Add, reorder, or update dates, times, and venues for all ceremonies in this celebration.
          </p>
          <div id="ueCereList"></div>
          <button type="button" id="ueCereAddBtn" class="ue-btn" style="width: 100%; margin-top: 14px; justify-content: center; border-style: dashed;">
            ➕ Add Another Ceremony
          </button>
        </div>
        <div class="ue-drawer-footer">
          <button type="button" class="ue-btn ue-btn-secondary" id="ueCereCancelBtn">Cancel</button>
          <button type="button" class="ue-btn ue-btn-primary" id="ueCereSaveBtn">💾 Apply Timeline</button>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);
    renderList();

    document.getElementById('ueCereAddBtn').onclick = function () {
      cfg.ceremonies.push({
        name: 'New Celebration',
        date: cfg.eventDateText || '2026-11-29',
        time: '06:00 PM',
        venue: cfg.venueName || '',
        mapUrl: ''
      });
      renderList();
    };

    const close = () => drawer.remove();
    document.getElementById('ueCereCloseBtn').onclick = close;
    document.getElementById('ueCereCancelBtn').onclick = close;
    drawer.onclick = (e) => { if (e.target === drawer) close(); };

    document.getElementById('ueCereSaveBtn').onclick = function () {
      renderTemplateDOM(tpl, cfg);
      persistCardConfig(tpl, cfg, true);
      close();
      showToast('Ceremonies timeline updated ✓');
    };
  }

  // 12. QUICK EDIT DRAWER
  function openUniversalQuickEditModal() {
    const tpl = detectTemplate();
    const cfg = getCurrentConfig(tpl);
    const existing = document.getElementById('universal-quickedit-modal');
    if (existing) existing.remove();

    const isBaby = tpl.id === 101;
    const isEab = tpl.id === 104;
    const isMithril = tpl.id === 105;

    let fieldsHtml = '';

    if (isBaby) {
      fieldsHtml = `
        <div class="ue-form-group">
          <label>Mother's Name</label>
          <input type="text" id="qe-mom" value="${esc(cfg.momName || cfg.brideName || '')}" placeholder="Sou. Meghal Patel" />
        </div>
        <div class="ue-form-group">
          <label>Father's Name</label>
          <input type="text" id="qe-dad" value="${esc(cfg.dadName || cfg.groomName || '')}" placeholder="Chi. Kaushal Patel" />
        </div>
        <div class="ue-form-group">
          <label>Celebration Occasion / Title</label>
          <input type="text" id="qe-occasion" value="${esc(cfg.occasion || 'Baby Shower')}" placeholder="Baby Shower" />
        </div>
        <div class="ue-form-group">
          <label>Hero Date Label</label>
          <input type="text" id="qe-herodate" value="${esc(cfg.heroDate || '22.11.26')}" placeholder="22.11.26" />
        </div>
        <div class="ue-form-group">
          <label>Sacred Invocation Mantra</label>
          <input type="text" id="qe-sacred" value="${esc(cfg.sacredBlessing || '॥ SHREE GANESHAY NAMAH ॥')}" placeholder="॥ SHREE GANESHAY NAMAH ॥" />
        </div>
        <div class="ue-form-group">
          <label>Poetic Verse / Quote</label>
          <textarea id="qe-verse" rows="3" class="ue-textarea">${esc(cfg.verseQuote || 'Two Tiny Feet Waited to Greet,\nOur Little Baby Due Any Time Soon')}</textarea>
        </div>
        <div class="ue-form-group">
          <label>Invitation Letter Note</label>
          <textarea id="qe-hosttext" rows="3" class="ue-textarea">${esc(cfg.hostText || '')}</textarea>
        </div>
        <div class="ue-form-group">
          <label>Event Date & Lunch Badge</label>
          <input type="text" id="qe-badge" value="${esc(cfg.eventDateBadge || (cfg.eventDateText ? cfg.eventDateText.toUpperCase() + '<br><span class="lunch-note">FOLLOWED BY LUNCH</span>' : ''))}" placeholder="SUNDAY, 22 NOVEMBER 2026" />
        </div>
        <div class="ue-form-group">
          <label>Venue Street Address</label>
          <input type="text" id="qe-venue-street" value="${esc(cfg.venueStreet || cfg.venueName || '')}" placeholder="232 North East Road" />
        </div>
        <div class="ue-form-group">
          <label>Venue Suburb &amp; Postcode</label>
          <input type="text" id="qe-venue-suburb" value="${esc(cfg.venueSuburb || '')}" placeholder="Klemzig SA 5087" />
        </div>
        <div class="ue-form-group">
          <label>Venue City &amp; State</label>
          <input type="text" id="qe-venue-city" value="${esc(cfg.venueCity || '')}" placeholder="Adelaide, South Australia" />
        </div>
        <div class="ue-form-group">
          <label>RSVP Date Badge</label>
          <input type="text" id="qe-rsvp" value="${esc(cfg.rsvpDate || '')}" placeholder="6TH NOVEMBER 2026" />
        </div>
        <div class="ue-form-group">
          <label>Host Family Signoff</label>
          <input type="text" id="qe-hosts" value="${esc(cfg.hosts || 'Patel Family')}" placeholder="Patel Family" />
        </div>
        <div class="ue-form-group">
          <label>Social Hashtags</label>
          <input type="text" id="qe-hash" value="${esc(cfg.hashtags || '')}" placeholder="#MeghalKaushalBabyShower • #BabyShower2026" />
        </div>
      `;
    } else if (isEab) {
      const couple = cfg.couple || {};
      fieldsHtml = `
        <div class="ue-form-group">
          <label>Bride's Name</label>
          <input type="text" id="qe-bride" value="${esc(couple.bride || '')}" placeholder="Aarohi" />
        </div>
        <div class="ue-form-group">
          <label>Groom's Name</label>
          <input type="text" id="qe-groom" value="${esc(couple.groom || '')}" placeholder="Ishaan" />
        </div>
        <div class="ue-form-group">
          <label>Couple Tagline / Blessing</label>
          <input type="text" id="qe-blessing" value="${esc((cfg.hero && cfg.hero.blessing) || cfg.blessing || '')}" placeholder="Two rivers, one sky" />
        </div>
        <div class="ue-form-group">
          <label>Wedding Date Label</label>
          <input type="text" id="qe-date" value="${esc(cfg.dateLabel || cfg.date || '')}" placeholder="Sunday, 14 February 2027" />
        </div>
        <div class="ue-form-group">
          <label>Ceremony Time Label</label>
          <input type="text" id="qe-time" value="${esc(cfg.timeLabel || cfg.time || '')}" placeholder="6:30 in the evening" />
        </div>
        <div class="ue-form-group">
          <label>Venue Name &amp; Address</label>
          <input type="text" id="qe-venue" value="${esc((cfg.venue && cfg.venue.name) || cfg.venueName || '')}" placeholder="Amrit Mahal Palace, Jal Marg, Old City, Jaipur" />
        </div>
        <div class="ue-form-group">
          <label>Dress Code</label>
          <input type="text" id="qe-dress" value="${esc(cfg.dressCode || '')}" placeholder="Festive Indian — pastels, ivory & gold" />
        </div>
        <div class="ue-form-group">
          <label>Bride Story</label>
          <textarea id="qe-bridestory" rows="3" class="ue-textarea">${esc(cfg.brideStory || '')}</textarea>
        </div>
        <div class="ue-form-group">
          <label>Groom Story</label>
          <textarea id="qe-groomstory" rows="3" class="ue-textarea">${esc(cfg.groomStory || '')}</textarea>
        </div>
        <div class="ue-form-group">
          <label>Closing Send-off Quote</label>
          <textarea id="qe-closingquote" rows="2" class="ue-textarea">${esc(cfg.closingQuote || 'Come early. Stay late.\nDance badly with us.')}</textarea>
        </div>
      `;
    } else if (isMithril) {
      fieldsHtml = `
        <div class="ue-form-group">
          <label>Couple Names</label>
          <input type="text" id="qe-couple" value="${esc(cfg.couple || '')}" placeholder="Kian & Aria" />
        </div>
        <div class="ue-form-group">
          <label>Hero Subtitle</label>
          <input type="text" id="qe-subtitle" value="${esc(cfg.heroSubtitle || 'The Reception of')}" placeholder="The Reception of" />
        </div>
        <div class="ue-form-group">
          <label>Wedding Date Label</label>
          <input type="text" id="qe-date" value="${esc(cfg.date || '')}" placeholder="Sunday, 18 October 2026" />
        </div>
        <div class="ue-form-group">
          <label>Reception Time</label>
          <input type="text" id="qe-time" value="${esc(cfg.time || '')}" placeholder="7:00 PM" />
        </div>
        <div class="ue-form-group">
          <label>Venue Address</label>
          <input type="text" id="qe-venue" value="${esc(cfg.venue || '')}" placeholder="Jagmandir Island Palace, Udaipur" />
        </div>
        <div class="ue-form-group">
          <label>Host Parents Line</label>
          <input type="text" id="qe-hostparents" value="${esc(cfg.hostParents || 'Mr. & Mrs. Leon Ellis')}" placeholder="Mr. & Mrs. Leon Ellis" />
        </div>
        <div class="ue-form-group">
          <label>Invitation Request Line</label>
          <input type="text" id="qe-reqtext" value="${esc(cfg.requestText || 'request the pleasure of your company\nat the wedding reception of their son')}" />
        </div>
        <div class="ue-form-group">
          <label>Bride Parents Line</label>
          <input type="text" id="qe-brideparents" value="${esc(cfg.brideParents || 'daughter of Mr. & Mrs. Robert Hart.')}" />
        </div>
      `;
    } else {
      // Royale & Lotus
      fieldsHtml = `
        <div class="ue-form-group">
          <label>Groom's Name</label>
          <input type="text" id="qe-groom" value="${esc(cfg.groomName || '')}" placeholder="Chi. Kaushal" />
        </div>
        <div class="ue-form-group">
          <label>Bride's Name</label>
          <input type="text" id="qe-bride" value="${esc(cfg.brideName || '')}" placeholder="Sou. Meghal" />
        </div>
        <div class="ue-form-group">
          <label>Sacred Mantra</label>
          <input type="text" id="qe-mantra" value="${esc((cfg.invocation && cfg.invocation.custom) || '')}" placeholder="|| Shree Swaminarayan Namo Namah ||" />
        </div>
        <div class="ue-form-group">
          <label>Guest Greeting</label>
          <input type="text" id="qe-guestgreeting" value="${esc(cfg.guestGreeting || 'Dear Guest & Family')}" />
        </div>
        <div class="ue-form-group">
          <label>Invitation Letter Note</label>
          <textarea id="qe-intronote" rows="3" class="ue-textarea">${esc(cfg.introNote || '')}</textarea>
        </div>
        <div class="ue-form-group">
          <label>Wedding Date Text</label>
          <input type="text" id="qe-date" value="${esc(cfg.eventDateText || cfg.date || cfg.eventISO || '')}" placeholder="Sunday, 22nd November 2026" />
        </div>
        <div class="ue-form-group">
          <label>Venue / Location</label>
          <input type="text" id="qe-venue" value="${esc(cfg.venueName || (cfg.venue && cfg.venue.name) || '')}" placeholder="The Grand Palace, Adelaide" />
        </div>
        <div class="ue-form-group">
          <label>Send-off Closing Names</label>
          <input type="text" id="qe-closingnames" value="${esc(cfg.closingNames || 'Mr. Patidar and Family')}" />
        </div>
      `;
    }

    const drawer = document.createElement('div');
    drawer.id = 'universal-quickedit-modal';
    drawer.className = 'ue-drawer-overlay';
    drawer.innerHTML = `
      <div class="ue-drawer-panel">
        <div class="ue-drawer-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${tpl.icon}</span>
            <h4 style="margin: 0; font-size: 17px; font-weight: 700; color: #f7eedc;">Quick Edit: ${esc(tpl.shortName)}</h4>
          </div>
          <button type="button" class="ue-drawer-close" id="qeCloseBtn">✕</button>
        </div>
        <div class="ue-drawer-body">
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #aaa; line-height: 1.4;">
            Edit all key details below. You can also click directly on any text on the card to edit in-place!
          </p>
          ${fieldsHtml}
        </div>
        <div class="ue-drawer-footer">
          <button type="button" class="ue-btn ue-btn-secondary" id="qeCancelBtn">Cancel</button>
          <button type="button" class="ue-btn ue-btn-primary" id="qeSaveBtn">💾 Apply Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);

    const close = () => drawer.remove();
    document.getElementById('qeCloseBtn').onclick = close;
    document.getElementById('qeCancelBtn').onclick = close;
    drawer.onclick = (e) => { if (e.target === drawer) close(); };

    document.getElementById('qeSaveBtn').onclick = function () {
      if (isBaby) {
        cfg.momName = (document.getElementById('qe-mom')?.value || '').trim();
        cfg.brideName = cfg.momName;
        cfg.dadName = (document.getElementById('qe-dad')?.value || '').trim();
        cfg.groomName = cfg.dadName;
        cfg.occasion = (document.getElementById('qe-occasion')?.value || '').trim();
        cfg.heroDate = (document.getElementById('qe-herodate')?.value || '').trim();
        cfg.sacredBlessing = (document.getElementById('qe-sacred')?.value || '').trim();
        cfg.verseQuote = (document.getElementById('qe-verse')?.value || '').trim();
        cfg.hostText = (document.getElementById('qe-hosttext')?.value || '').trim();
        cfg.eventDateBadge = (document.getElementById('qe-badge')?.value || '').trim();
        cfg.venueStreet = (document.getElementById('qe-venue-street')?.value || '').trim();
        cfg.venueSuburb = (document.getElementById('qe-venue-suburb')?.value || '').trim();
        cfg.venueCity = (document.getElementById('qe-venue-city')?.value || '').trim();
        cfg.rsvpDate = (document.getElementById('qe-rsvp')?.value || '').trim();
        cfg.hosts = (document.getElementById('qe-hosts')?.value || '').trim();
        cfg.hashtags = (document.getElementById('qe-hash')?.value || '').trim();
      } else if (isEab) {
        if (!cfg.couple) cfg.couple = {};
        cfg.couple.bride = (document.getElementById('qe-bride')?.value || '').trim();
        cfg.couple.groom = (document.getElementById('qe-groom')?.value || '').trim();
        cfg.blessing = (document.getElementById('qe-blessing')?.value || '').trim();
        if (!cfg.hero) cfg.hero = {};
        cfg.hero.blessing = cfg.blessing;
        cfg.dateLabel = (document.getElementById('qe-date')?.value || '').trim();
        cfg.timeLabel = (document.getElementById('qe-time')?.value || '').trim();
        if (!cfg.venue) cfg.venue = {};
        cfg.venue.name = (document.getElementById('qe-venue')?.value || '').trim();
        cfg.venueName = cfg.venue.name;
        cfg.dressCode = (document.getElementById('qe-dress')?.value || '').trim();
        cfg.brideStory = (document.getElementById('qe-bridestory')?.value || '').trim();
        cfg.groomStory = (document.getElementById('qe-groomstory')?.value || '').trim();
        cfg.closingQuote = (document.getElementById('qe-closingquote')?.value || '').trim();
      } else if (isMithril) {
        cfg.couple = (document.getElementById('qe-couple')?.value || '').trim();
        cfg.heroSubtitle = (document.getElementById('qe-subtitle')?.value || '').trim();
        cfg.date = (document.getElementById('qe-date')?.value || '').trim();
        cfg.time = (document.getElementById('qe-time')?.value || '').trim();
        cfg.venue = (document.getElementById('qe-venue')?.value || '').trim();
        cfg.hostParents = (document.getElementById('qe-hostparents')?.value || '').trim();
        cfg.requestText = (document.getElementById('qe-reqtext')?.value || '').trim();
        cfg.brideParents = (document.getElementById('qe-brideparents')?.value || '').trim();
      } else {
        cfg.groomName = (document.getElementById('qe-groom')?.value || '').trim();
        cfg.brideName = (document.getElementById('qe-bride')?.value || '').trim();
        if (!cfg.invocation) cfg.invocation = {};
        cfg.invocation.custom = (document.getElementById('qe-mantra')?.value || '').trim();
        cfg.guestGreeting = (document.getElementById('qe-guestgreeting')?.value || '').trim();
        cfg.introNote = (document.getElementById('qe-intronote')?.value || '').trim();
        cfg.eventDateText = (document.getElementById('qe-date')?.value || '').trim();
        cfg.venueName = (document.getElementById('qe-venue')?.value || '').trim();
        cfg.closingNames = (document.getElementById('qe-closingnames')?.value || '').trim();
      }

      renderTemplateDOM(tpl, cfg);
      persistCardConfig(tpl, cfg, true);
      close();
      showToast('Quick edit applied &amp; saved ✓');
    };
  }

  // 13. IN-PLACE INLINE VISUAL EDITOR (The Royal Wedding Experience on Every Card)
  function initInPlaceInlineEditor(tpl, cfg) {
    // Target selectors map for every card template
    const TARGETS = {
      101: [
        { selector: '.hero-name-first', path: 'momName', placeholder: "Mother's Name", label: "Mother" },
        { selector: '.hero-name-second', path: 'dadName', placeholder: "Father's Name", label: "Father" },
        { selector: '.parents-names', path: 'coupleNames', placeholder: "Honoring Parents", label: "Parents" },
        { selector: '.hero-occasion', path: 'occasion', placeholder: "Baby Shower", label: "Occasion" },
        { selector: '.hero-date', path: 'heroDate', placeholder: "22.11.26", label: "Hero Date" },
        { selector: '.hero-sacred-blessing span', path: 'sacredBlessing', placeholder: "Sacred Invocation", label: "Blessing" },
        { selector: '.verse-quote', path: 'verseQuote', multiline: true, placeholder: "Poetic Verse Quote", label: "Verse" },
        { selector: '.host-intro', path: 'hostIntro', placeholder: "Dear Friends and Family", label: "Greeting" },
        { selector: '.host-text', path: 'hostText', multiline: true, placeholder: "Invitation letter text...", label: "Letter" },
        { selector: '.event-lunch-badge', path: 'eventDateBadge', multiline: true, placeholder: "Event Date Badge", label: "Date Badge" },
        { selector: '.venue-card-title', path: 'venueStreet', placeholder: "Street Address", label: "Venue Street" },
        { selector: '.venue-card-place', path: 'venueSuburb', placeholder: "Suburb / Postcode", label: "Venue Suburb" },
        { selector: '.venue-card-addr', path: 'venueCity', placeholder: "City / Country", label: "Venue City" },
        { selector: '.rsvp-date-badge', path: 'rsvpDate', placeholder: "RSVP Date", label: "RSVP Date" },
        { selector: '.footer-family', path: 'hosts', placeholder: "Patel Family", label: "Host Family" },
        { selector: '.footer-hash', path: 'hashtags', placeholder: "#Hashtag", label: "Hashtags" }
      ],
      102: [
        { selector: '#ryBrideName', path: 'brideName', placeholder: "Bride's Name", label: "Bride" },
        { selector: '#ryGroomName', path: 'groomName', placeholder: "Groom's Name", label: "Groom" },
        { selector: '#ryInvocation', path: 'invocation.custom', placeholder: "Sacred Mantra", label: "Mantra" },
        { selector: '#ryGuestGreeting', path: 'guestGreeting', placeholder: "Guest Greeting", label: "Greeting" },
        { selector: '#ryIntroNote', path: 'introNote', multiline: true, placeholder: "Invitation note...", label: "Letter Note" },
        { selector: '.royale-outro__names', path: 'closingNames', placeholder: "Host Names", label: "Closing Names" },
        { selector: '.royale-outro__line', path: 'closingLine', placeholder: "Send-off line", label: "Send-off" }
      ],
      103: [
        { selector: '#pcBrideName', path: 'brideName', placeholder: "Bride's Name", label: "Bride" },
        { selector: '#pcGroomName', path: 'groomName', placeholder: "Groom's Name", label: "Groom" },
        { selector: '#pcInvocation', path: 'invocation.custom', placeholder: "Sacred Mantra", label: "Mantra" },
        { selector: '#pcIntroNote', path: 'introNote', multiline: true, placeholder: "Invitation note...", label: "Letter Note" },
        { selector: '#pcGroomCard .card__names', path: 'groomFamilyNames', placeholder: "Groom's Family", label: "Groom Family" },
        { selector: '#pcBrideCard .card__names', path: 'brideFamilyNames', placeholder: "Bride's Family", label: "Bride Family" }
      ],
      104: [
        { selector: '#heroNames', path: 'coupleNames', placeholder: "Bride & Groom", label: "Couple" },
        { selector: 'p.font-script.text-xl.text-primary\\/80', path: 'blessing', placeholder: "Couple Blessing", label: "Blessing" },
        { selector: 'p.font-sans.text-\\[0\\.62rem\\].tracking-\\[0\\.5em\\]', path: 'heroKicker', placeholder: "Together with our families", label: "Header" },
        { selector: 'article:has(img[src*="portrait-bride"]) h3, p:contains("The Bride") + h3', path: 'couple.bride', placeholder: "Bride", label: "Bride Name" },
        { selector: 'article:has(img[src*="portrait-bride"]) p.text-sm', path: 'brideStory', multiline: true, placeholder: "Bride Story", label: "Bride Story" },
        { selector: 'article:has(img[src*="portrait-groom"]) h3, p:contains("The Groom") + h3', path: 'couple.groom', placeholder: "Groom", label: "Groom Name" },
        { selector: 'article:has(img[src*="portrait-groom"]) p.text-sm', path: 'groomStory', multiline: true, placeholder: "Groom Story", label: "Groom Story" },
        { selector: 'section#details .plate:nth-child(1) .font-display', path: 'dateLabel', placeholder: "The Day", label: "Day" },
        { selector: 'section#details .plate:nth-child(2) .font-display', path: 'timeLabel', placeholder: "The Hour", label: "Hour" },
        { selector: 'section#details .plate:nth-child(3) .font-display', path: 'venueName', placeholder: "The Place", label: "Place" },
        { selector: 'section#details .plate:nth-child(4) .font-display', path: 'dressCode', placeholder: "Dress Code", label: "Dress Code" },
        { selector: 'footer h2.font-script', path: 'closingQuote', multiline: true, placeholder: "Send-off Quote", label: "Send-off" },
        { selector: 'footer p.font-display.text-lg.text-primary', path: 'closingLove', placeholder: "With all our love...", label: "Love Signoff" }
      ],
      105: [
        { selector: 'h1[data-hero]', path: 'couple', placeholder: "Couple Names", label: "Couple Names" },
        { selector: 'p.font-cormorant[data-hero]', path: 'heroDate', placeholder: "18.10.26", label: "Hero Date" },
        { selector: 'p[data-hero]', path: 'heroSubtitle', placeholder: "The Reception of", label: "Subtitle" },
        { selector: '.vr-cover-names', path: 'couple', placeholder: "Couple Names", label: "Cover Names" },
        { selector: '.vr-scratch-card span.font-pinyon', path: 'date', placeholder: "Date", label: "Scratch Date" },
        { selector: '.mithril-v4-venue p.font-cinzel', path: 'time', placeholder: "7:00 PM", label: "Evening Time" },
        { selector: '.mithril-v4-venue p.font-cormorant', path: 'venue', multiline: true, placeholder: "Venue Address", label: "Evening Venue" },
        { selector: 'p.vr-oneline', path: 'closingQuote', placeholder: "Blessing Quote", label: "Blessing" },
        { selector: 'p.font-pinyon:last-of-type', path: 'closingNote', placeholder: "Closing Note", label: "Closing Note" }
      ]
    };

    const targetList = TARGETS[tpl.id] || [];

    targetList.forEach(t => {
      let elements = [];
      try {
        elements = Array.from(document.querySelectorAll(t.selector));
      } catch (_) {}

      elements.forEach(el => {
        if (!el || el.dataset.ueAttached) return;
        el.dataset.ueAttached = '1';
        el.dataset.uePath = t.path;
        el.dataset.ueLabel = t.label || t.path;
        el.setAttribute('contenteditable', 'plaintext-only');
        el.setAttribute('spellcheck', 'false');
        el.classList.add('ue-editable');

        // Tooltip / badge
        el.title = '✏️ Click to edit ' + (t.label || t.path);

        // Input listener with live propagation
        el.addEventListener('input', function () {
          let text = (t.multiline ? (el.innerText || '') : (el.textContent || el.innerText || '')).trim();
          if (!t.multiline) text = text.replace(/[\r\n]+/g, ' ').trim();
          setNestedVal(cfg, t.path, text);

          // Handle special couple name synchronization
          if (t.path === 'momName' || t.path === 'dadName') {
            const mom = cfg.momName || 'Meghal';
            const dad = cfg.dadName || 'Kaushal';
            const coupleStr = mom + ' & ' + dad;
            cfg.coupleNames = coupleStr;
            const elP = document.querySelector('.parents-names');
            if (elP) elP.textContent = coupleStr;
            const elH = document.querySelector('.footer-hash');
            if (elH && !cfg.hashtags) {
              elH.textContent = '#' + mom.replace(/[^a-zA-Z0-9]/g, '') + dad.replace(/[^a-zA-Z0-9]/g, '') + 'BabyShower • #BabyShower2026';
            }
          } else if (t.path === 'couple.bride' || t.path === 'couple.groom') {
            const bride = (cfg.couple && cfg.couple.bride) || 'Aarohi';
            const groom = (cfg.couple && cfg.couple.groom) || 'Ishaan';
            const elHN = document.getElementById('heroNames');
            if (elHN) {
              elHN.innerHTML = esc(bride) + '<span class="mx-3 font-script text-3xl italic sm:text-4xl">&amp;</span><br class="sm:hidden"/>' + esc(groom);
            }
          }

          persistCardConfig(tpl, cfg, false);
        });

        // Enter key handling
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !t.multiline) {
            e.preventDefault();
            el.blur();
          }
        });

        // Clean paste
        el.addEventListener('paste', function (e) {
          e.preventDefault();
          const plain = (e.clipboardData || window.clipboardData).getData('text/plain');
          document.execCommand('insertText', false, plain);
        });
      });
    });

    // Wire Photo Slots for Direct Canvas Crop/Swap
    wirePhotoUploader(tpl, cfg);
  }

  // 14. PHOTO UPLOADER WIRING
  function wirePhotoUploader(tpl, cfg) {
    const PHOTO_SELECTORS = {
      101: ['.sacred-art-img', '.baby-feet-img', '.venue-sketch'],
      102: ['.gframe__img', '.ryc-card__photo-img', '.royale-couple__img'],
      103: ['.gallery__img', '.couple__portrait'],
      104: ['img[src*="portrait-bride"]', 'img[src*="portrait-groom"]', '.gallery-card img', 'img[src*="couple-lanterns"]'],
      105: ['.mithril-v4-portrait img', 'img[src*="portrait"]', 'img[src*="key"]']
    };

    const selectors = PHOTO_SELECTORS[tpl.id] || [];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach((img, idx) => {
        if (!img || img.dataset.uePhotoAttached) return;
        img.dataset.uePhotoAttached = '1';

        const parent = img.parentElement;
        if (parent) {
          parent.classList.add('ue-photo-parent');
          const badge = document.createElement('div');
          badge.className = 'ue-photo-badge';
          badge.innerHTML = '📷 Change Photo';
          badge.title = 'Click to replace this photo';
          parent.appendChild(badge);

          badge.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            pickAndCompressPhoto((compressedUrl) => {
              img.src = compressedUrl;
              // Map to config
              if (tpl.id === 101) {
                if (sel.includes('sacred-art')) cfg.sacredArtImg = compressedUrl;
              } else if (tpl.id === 104) {
                if (sel.includes('portrait-bride')) cfg.bridePortrait = compressedUrl;
                else if (sel.includes('portrait-groom')) cfg.groomPortrait = compressedUrl;
                else if (sel.includes('gallery')) {
                  if (!Array.isArray(cfg.gallery)) cfg.gallery = [];
                  cfg.gallery[idx] = { src: compressedUrl, caption: '' };
                }
              } else if (tpl.id === 105) {
                cfg.couplePortrait = compressedUrl;
              }
              persistCardConfig(tpl, cfg, true);
              showToast('Photo replaced &amp; saved ✓');
            });
          };

          img.onclick = badge.onclick;
        }
      });
    });
  }

  // 15. HANDLE OVERLAYS & GATES IN EDIT MODE
  function handleCoversInEditMode(tpl) {
    // Dismiss full-screen gates so the admin can scroll and edit all content in place
    if (tpl.id === 101) {
      const overlay = document.getElementById('weiOverlay');
      const videoWrap = document.getElementById('weiVideoWrap');
      const inviteMain = document.getElementById('inviteMain');
      if (overlay) overlay.style.display = 'none';
      if (videoWrap) videoWrap.style.display = 'none';
      if (inviteMain) {
        inviteMain.classList.add('revealed');
        inviteMain.style.opacity = '1';
      }
    } else if (tpl.id === 102) {
      // Royale gate is styled via body.is-editing in editor.css
    } else if (tpl.id === 103) {
      const intro = document.getElementById('intro');
      if (intro) {
        intro.style.position = 'relative';
        intro.style.inset = 'auto';
        intro.style.minHeight = 'auto';
        intro.style.paddingBottom = '24px';
      }
    } else if (tpl.id === 104) {
      const overlay = document.getElementById('sealOverlay');
      if (overlay) overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    } else if (tpl.id === 105) {
      const cover = document.getElementById('cover');
      if (cover) cover.style.display = 'none';
      const musicWrap = document.getElementById('musicWrap');
      if (musicWrap) musicWrap.style.opacity = '1';
    }
  }

  // 16. INJECT UNIVERSAL TOP STUDIO TOOLBAR
  function injectStudioToolbar(tpl, cfg) {
    if (document.getElementById('universal-studio-toolbar')) return;

    const sp = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const slug = sp.get('card') || sp.get('slug') || hashParams.get('card') || 'new-card';

    // Inject Studio CSS Styles
    const style = document.createElement('style');
    style.id = 'universal-studio-styles';
    style.textContent = `
      #universal-studio-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 52px;
        background: rgba(18, 14, 12, 0.96);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-bottom: 1.5px solid rgba(212, 175, 55, 0.55);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.85);
        z-index: 9999999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #f7eedc;
      }
      .ue-tool-left, .ue-tool-center, .ue-tool-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ue-badge-crown {
        background: linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(184, 134, 11, 0.2));
        border: 1px solid rgba(212, 175, 55, 0.6);
        color: #f0c978;
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 11.5px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        letter-spacing: 0.4px;
      }
      .ue-slug-badge {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #ddd;
        padding: 4px 8px;
        border-radius: 6px;
        font-family: monospace;
        font-size: 11.5px;
      }
      .ue-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: #f7eedc;
        padding: 6px 13px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
      }
      .ue-btn:hover {
        background: rgba(255, 255, 255, 0.18);
        transform: translateY(-1px);
      }
      .ue-btn-primary {
        background: linear-gradient(135deg, #d4af37, #b8860b) !important;
        color: #16110a !important;
        font-weight: 700 !important;
        border: none !important;
        box-shadow: 0 4px 14px rgba(212, 175, 55, 0.4);
      }
      .ue-btn-primary:hover {
        box-shadow: 0 6px 20px rgba(212, 175, 55, 0.65);
      }
      .ue-btn-share {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
        color: #fff !important;
        border: none !important;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
      }
      .ue-btn-whatsapp {
        background: #25D366 !important;
        border-color: #25D366 !important;
        color: #fff !important;
        width: 100%;
        justify-content: center;
        padding: 10px 16px;
        font-size: 13.5px;
      }
      .ue-btn-copy {
        background: #d4af37;
        color: #1a0f05;
        font-weight: 700;
        border: none;
      }
      /* In-Place Contenteditable Styles */
      .ue-editable {
        outline: 1.5px dashed rgba(212, 175, 55, 0.5) !important;
        outline-offset: 4px !important;
        border-radius: 4px !important;
        cursor: text !important;
        transition: all 0.2s ease !important;
      }
      .ue-editable:hover {
        outline-color: #d4af37 !important;
        background-color: rgba(212, 175, 55, 0.08) !important;
      }
      .ue-editable:focus {
        outline: 2px solid #d4af37 !important;
        background-color: rgba(212, 175, 55, 0.12) !important;
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.35) !important;
      }
      /* Photo Target Styles */
      .ue-photo-parent {
        position: relative !important;
      }
      .ue-photo-badge {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(18, 14, 12, 0.9);
        border: 1px solid rgba(212, 175, 55, 0.6);
        color: #f0c978;
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        opacity: 0.85;
        transition: all 0.2s ease;
        z-index: 100;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
      }
      .ue-photo-parent:hover .ue-photo-badge {
        opacity: 1;
        transform: translateX(-50%) scale(1.05);
        background: #d4af37;
        color: #16110a;
      }
      /* Toast */
      .ue-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(40px);
        background: rgba(20, 16, 14, 0.95);
        border: 1px solid rgba(212, 175, 55, 0.5);
        color: #f7eedc;
        padding: 10px 22px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
        z-index: 10000001;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .ue-toast.is-active {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      /* Modal Styles */
      .ue-modal-overlay, .ue-drawer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(10, 8, 7, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 10000000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: ueFadeIn 0.25s ease;
      }
      @keyframes ueFadeIn { from { opacity: 0; } to { opacity: 1; } }
      .ue-modal-box {
        background: #1b1714;
        border: 1px solid rgba(212, 175, 55, 0.4);
        border-radius: 20px;
        padding: 26px;
        max-width: 480px;
        width: 100%;
        text-align: center;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);
      }
      .ue-link-row {
        background: #120f0d;
        border: 1px dashed rgba(212, 175, 55, 0.45);
        border-radius: 10px;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ue-link-row input {
        background: none;
        border: none;
        color: #f0c978;
        font-family: monospace;
        font-size: 12.5px;
        flex: 1;
        outline: none;
      }
      .ue-actions-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      /* Drawer */
      .ue-drawer-panel {
        background: #1b1714;
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 20px;
        max-width: 540px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .ue-drawer-header {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .ue-drawer-close {
        background: none;
        border: none;
        color: #aaa;
        font-size: 20px;
        cursor: pointer;
      }
      .ue-drawer-body {
        padding: 18px 20px;
        overflow-y: auto;
        flex: 1;
      }
      .ue-drawer-footer {
        padding: 14px 20px;
        background: #14110f;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .ue-form-group {
        margin-bottom: 14px;
        text-align: left;
      }
      .ue-form-group label {
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        color: #d4af37;
        font-weight: 700;
        margin-bottom: 5px;
      }
      .ue-form-group input, .ue-form-group textarea, .ue-textarea, .ue-cere-inp {
        width: 100%;
        background: #27211c;
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #fff;
        padding: 9px 12px;
        border-radius: 8px;
        font-size: 13.5px;
        box-sizing: border-box;
        font-family: inherit;
      }
      .ue-form-group input:focus, .ue-form-group textarea:focus, .ue-cere-inp:focus {
        border-color: #d4af37;
        outline: none;
      }
      .ue-cere-item {
        background: #221d18;
        border: 1px solid rgba(212, 175, 55, 0.25);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
      }
      /* Shift body down slightly when toolbar is mounted */
      body.ue-studio-active {
        padding-top: 52px !important;
      }
      body.ue-studio-active .edit-bar {
        display: none !important;
      }
      @media (max-width: 768px) {
        .ue-card-title { display: none; }
        .ue-slug-badge { display: none; }
        .ue-btn span { display: none; }
        #universal-studio-toolbar { padding: 0 10px; }
      }
    `;
    document.head.appendChild(style);
    document.body.classList.add('ue-studio-active', 'is-editing', 'is-admin');
    document.documentElement.classList.add('is-admin');

    const toolbar = document.createElement('div');
    toolbar.id = 'universal-studio-toolbar';
    toolbar.innerHTML = `
      <div class="ue-tool-left">
        <span class="ue-badge-crown">👑 Royal Studio</span>
        <span class="ue-slug-badge">${esc(slug)}</span>
      </div>
      <div class="ue-tool-center">
        <button type="button" class="ue-btn" id="ueBtnQuickEdit">
          <span>⚙️</span> Quick Edit
        </button>
        <button type="button" class="ue-btn" id="ueBtnCeremonies">
          <span>📅</span> Timeline
        </button>
        <button type="button" class="ue-btn" id="ueBtnPreview">
          <span>👁️</span> Preview
        </button>
      </div>
      <div class="ue-tool-right">
        <button type="button" class="ue-btn ue-btn-primary" id="ueBtnSave">
          <span>💾</span> Save
        </button>
        <button type="button" class="ue-btn ue-btn-share" id="ueBtnShare">
          <span>🚀</span> Share
        </button>
      </div>
    `;

    document.body.prepend(toolbar);

    document.getElementById('ueBtnQuickEdit').onclick = openUniversalQuickEditModal;
    document.getElementById('ueBtnCeremonies').onclick = openCeremoniesManager;

    document.getElementById('ueBtnPreview').onclick = function () {
      const searchParams = new URLSearchParams(location.search);
      const isPreview = searchParams.has('preview');
      if (isPreview) {
        searchParams.delete('preview');
        searchParams.set('edit', '1');
      } else {
        searchParams.delete('edit');
        searchParams.set('preview', '1');
      }
      location.search = '?' + searchParams.toString();
    };

    document.getElementById('ueBtnSave').onclick = function () {
      persistCardConfig(tpl, cfg, true);
    };

    document.getElementById('ueBtnShare').onclick = function () {
      const url = generateUniversalInviteUrl();
      openUniversalShareModal(url);
    };
  }

  // 17. INITIALIZATION LIFECYCLE
  function initEngine() {
    const sp = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const tpl = detectTemplate();
    const slug = sp.get('card') || sp.get('slug') || hashParams.get('card') || hashParams.get('slug') || '';
    const dParam = sp.get('d') || hashParams.get('d');
    const isAdmin = isAdminLoggedIn();
    const isEdit = sp.has('edit') && isAdmin;
    const isPreview = sp.has('preview') && isAdmin;

    let cfg = getCurrentConfig(tpl);

    // 1. Read existing saved card data by slug (User 1 vs User 2 isolation)
    if (slug) {
      try {
        const localSaved = JSON.parse(localStorage.getItem('card_' + slug) || 'null');
        if (localSaved && typeof localSaved === 'object') {
          cfg = deepMerge(cfg, localSaved);
        }
      } catch (_) {}
    }

    // 2. Decode legacy hash 'd' if present
    if (dParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(dParam.replace(/-/g, '+').replace(/_/g, '/')))));
        if (parsed && typeof parsed === 'object') {
          cfg = deepMerge(cfg, parsed);
          if (slug) {
            try {
              let existingLocal = {};
              try { existingLocal = JSON.parse(localStorage.getItem('card_' + slug) || '{}'); } catch (_) {}
              let mergedLocal = deepMerge(existingLocal, parsed);
              localStorage.setItem('card_' + slug, JSON.stringify(mergedLocal));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('UniversalCardEngine: d decode error', err);
      }
    }

    // Set configuration back
    setConfigBack(tpl, cfg);

    // Render DOM
    renderTemplateDOM(tpl, cfg);

    // Edit Mode initialization
    if (isEdit) {
      // 1. Open/dismiss covers in edit mode so full page is visible
      handleCoversInEditMode(tpl);

      // 2. Attach in-place visual contenteditable
      initInPlaceInlineEditor(tpl, cfg);

      // 3. Mount studio top toolbar
      injectStudioToolbar(tpl, cfg);
    } else {
      // Guest view: ensure no contenteditable or edit affordances exist
      document.querySelectorAll('.ue-editable').forEach(el => {
        el.removeAttribute('contenteditable');
        el.classList.remove('ue-editable');
      });
      const existingToolbar = document.getElementById('universal-studio-toolbar');
      if (existingToolbar) existingToolbar.remove();
      document.body.classList.remove('ue-studio-active', 'is-editing');
    }

    // Background cloud sync if slug present
    if (slug && window.CloudStorage && typeof window.CloudStorage.getCard === 'function') {
      window.CloudStorage.getCard(slug).then(cloudData => {
        if (cloudData && typeof cloudData === 'object') {
          cfg = deepMerge(cfg, cloudData);
          setConfigBack(tpl, cfg);
          renderTemplateDOM(tpl, cfg);
        }
      }).catch(() => {});
    }
  }

  // Auto-run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    setTimeout(initEngine, 50);
  }

  // Public API
  window.UniversalCardEngine = {
    templates: CARD_TEMPLATES,
    detectTemplate,
    getCurrentConfig,
    extractDelta,
    renderDOM: renderTemplateDOM,
    generateShareLink: generateUniversalInviteUrl,
    openShareModal: openUniversalShareModal,
    openQuickEdit: openUniversalQuickEditModal,
    openCeremonies: openCeremoniesManager,
    saveCard: persistCardConfig
  };

})();
