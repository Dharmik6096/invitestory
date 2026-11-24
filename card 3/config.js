// Shahi Palna - Baby Shower & Godh Bharai Invitation Configuration
// The single source of truth for everything a host can edit.
(function () {
  const params = new URLSearchParams(location.search);
  const isAdmin = (function () {
    try {
      return localStorage.getItem('invitestory_admin_session') === 'true';
    } catch (_) {
      return false;
    }
  })();
  const mode = (isAdmin && params.has('edit')) ? 'edit' : (isAdmin && params.has('preview')) ? 'preview' : 'view';
  const trial = false;
  const TRIAL_EDITABLE = [];
  const STORAGE_KEY = 'palnaConfig';

  // ---- Opening invocation ----------------------------------------------
  const SYMBOLS = [
    { id: 'ganesha', label: 'Ganesha', src: '../symbols/_ganesha.svg' },
    { id: 'swaminarayan', label: 'Swaminarayan', src: '../symbols/_swaminarayan.svg' },
    { id: 'buddha', label: 'Buddha', src: '../symbols/_buddha.svg' },
    { id: 'sindhi', label: 'Jhulelal', src: '../symbols/_sindhi.svg' },
    { id: 'sikh', label: 'Ik Onkar', src: '../symbols/_sikh.svg' },
    { id: 'jain', label: 'Ahimsa symbol', src: '../symbols/_jain.svg' },
    { id: 'christian', label: 'Cross', src: '../symbols/_christian.svg' },
    { id: 'none', label: 'None', src: '' },
  ];

  const INVOCATIONS = {
    hindu: {
      label: 'Hindu',
      english: 'Shree Ganeshaya Namah',
      scripts: {
        devanagari: { label: 'Devanagari', text: '॥ श्री गणेशाय नमः ॥', font: 'Tiro Devanagari Sanskrit' },
        gujarati: { label: 'Gujarati', text: '॥ શ્રી ગણેશાય નમઃ ॥', font: 'Noto Sans Gujarati' },
      },
    },
    swaminarayan: {
      label: 'Swaminarayan',
      english: 'Shree Swaminarayan Namo Namah',
      scripts: {
        gujarati: { label: 'Gujarati', text: '॥ શ્રી સ્વામિનારાયણ નમો નમઃ ॥', font: 'Noto Sans Gujarati' },
        devanagari: { label: 'Devanagari', text: '॥ श्री स्वामिनारायण नमो नमः ॥', font: 'Tiro Devanagari Sanskrit' },
      },
    },
    krishna: {
      label: 'Bal Gopal / Krishna',
      english: 'Shree Krishnay Namah',
      scripts: {
        devanagari: { label: 'Devanagari', text: '॥ श्री कृष्णाय नमः ॥', font: 'Tiro Devanagari Sanskrit' },
        gujarati: { label: 'Gujarati', text: '॥ શ્રી કૃષ્ણાય નમઃ ॥', font: 'Noto Sans Gujarati' },
      },
    },
    jain: {
      label: 'Jain',
      english: 'Namo Arihantanam',
      scripts: {
        devanagari: { label: 'Devanagari', text: '॥ णमो अरिहंताणं ॥', font: 'Tiro Devanagari Sanskrit' },
      },
    },
    sikh: {
      label: 'Sikh',
      english: 'Ik Onkar',
      scripts: {
        gurmukhi: { label: 'Gurmukhi', text: 'ੴ ਸਤਿਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ', font: 'Noto Sans Gurmukhi' },
      },
    },
    christian: {
      label: 'Christian',
      english: 'God Bless Our Little Miracle',
      scripts: {
        english: { label: 'English', text: 'God Bless Our Little Miracle', font: '' },
      },
    },
  };

  function resolveInvocation(cfg) {
    const raw = (cfg && cfg.invocation) || {};
    const religion = raw.religion && INVOCATIONS[raw.religion] ? raw.religion : 'hindu';
    const rel = INVOCATIONS[religion];
    const scriptKeys = rel ? Object.keys(rel.scripts) : [];
    const sel = raw.script;
    let chosen;
    if (sel === 'english') chosen = 'english';
    else if (sel && rel.scripts[sel]) chosen = sel;
    else chosen = scriptKeys.length ? scriptKeys[0] : 'english';

    if (chosen === 'english') {
      return { religion: religion, script: 'english', text: rel.english || '', font: '', rtl: false, isEnglish: true };
    }
    const scr = rel.scripts[chosen];
    return { religion: religion, script: chosen, text: scr.text, font: scr.font, rtl: !!scr.rtl, isEnglish: false };
  }

  const DEFAULTS = {
    version: 1,
    finalized: true,

    invocation: { symbol: 'ganesha', religion: 'hindu', script: 'devanagari', custom: '॥ श्री गणेशाय नमः ॥' },

    momName: 'Meghal Patel',
    dadName: 'Kaushal Patel',
    brideName: 'Meghal Patel',
    groomName: 'Kaushal Patel',
    title: 'Meghal & Kaushal - Baby Shower & Godh Bharai',
    eventName: 'Godh Bharai & Baby Shower',
    eventTagline: 'શ્રી સીમંત સંસ્કાર મહોત્સવ • Welcoming Little Miracles',

    introNote: 'Two tiny feet waited to greet, our little baby due any time soon. We cordially invite you and your family to celebrate the auspicious Godh Bharai & Baby Shower ceremony of Meghal & Kaushal.',

    eventISO: '2026-11-22',
    revealButton: 'Reveal Celebration Date',
    revealAfter: 'Save the Date • 22-11-2026',

    momFamily: {
      enabled: true,
      name: 'Sou. Ka. Dr. Priya Patel',
      relLabel: 'Beloved Daughter of',
      parentA: 'Shri Pravinbhai P. Patel',
      parentB: 'Smt. Rekhaben Patel',
      parentJoin: '&',
      grandLabel: 'Granddaughter of (With Blessings of)',
      grandA: 'Late Shri Mohanlal G. Patel',
      grandB: 'Smt. Gangaben Patel',
      grandJoin: '&',
    },
    brideFamily: {
      enabled: true,
      name: 'Sou. Ka. Dr. Priya Patel',
      relLabel: 'Beloved Daughter of',
      parentA: 'Shri Pravinbhai P. Patel',
      parentB: 'Smt. Rekhaben Patel',
      parentJoin: '&',
      grandLabel: 'Granddaughter of (With Blessings of)',
      grandA: 'Late Shri Mohanlal G. Patel',
      grandB: 'Smt. Gangaben Patel',
      grandJoin: '&',
    },
    dadFamily: {
      enabled: true,
      name: 'Chi. Aarav Patel',
      relLabel: 'Beloved Son of',
      parentA: 'Shri Jayeshbhai K. Patel',
      parentB: 'Smt. Dharmishthaben Patel',
      parentJoin: '&',
      grandLabel: 'Grandson of (With Blessings of)',
      grandA: 'Late Shri Hirabhai B. Patel',
      grandB: 'Smt. Kamlaben Patel',
      grandJoin: '&',
    },
    groomFamily: {
      enabled: true,
      name: 'Chi. Aarav Patel',
      relLabel: 'Beloved Son of',
      parentA: 'Shri Jayeshbhai K. Patel',
      parentB: 'Smt. Dharmishthaben Patel',
      parentJoin: '&',
      grandLabel: 'Grandson of (With Blessings of)',
      grandA: 'Late Shri Hirabhai B. Patel',
      grandB: 'Smt. Kamlaben Patel',
      grandJoin: '&',
    },

    gallery: {
      enabled: true,
      frames: [
        {
          type: 'portrait',
          image: 'media/gallery_1.jpg',
          caption: '#ParentsToBe',
          hang: 118,
          zoom: 1
        },
        {
          type: 'landscape',
          image: 'media/gallery_2.jpg',
          caption: '#MaternityGlow',
          hang: 150,
          zoom: 1.2
        },
        {
          type: 'story',
          text: 'A tiny ray of sunshine, a sweet bundle of love. We can hardly wait to welcome our little angel into this wonderful world!',
          hang: 120
        },
        {
          type: 'portrait',
          image: 'media/gallery_3.jpg',
          caption: '#BlessedJourney',
          hang: 132,
          zoom: 1
        }
      ]
    },

    ceremonies: [
      {
        name: 'Ganesh Pujan & Godh Bharai Vidhi',
        art: 'media/ring_ceremony.webp',
        date: '2026-12-20',
        time: '10:30 AM',
        venue: 'The Royal Heritage Grand Palace, Ahmedabad',
        description: 'Vedic rituals, Ganesh Pujan, and the traditional lap-filling blessing by aunts, mothers & elders with sweets and dry fruits.',
        enabled: true
      },
      {
        name: 'Palna Sajaavat & Cradle Lullabies',
        art: 'media/mehendi.webp',
        date: '2026-12-20',
        time: '01:00 PM',
        venue: 'The Royal Heritage Grand Palace, Ahmedabad',
        description: 'Adorning the golden cradle with fresh fragrant jasmine & marigold flowers, accompanied by traditional folk songs and blessings.',
        enabled: true
      },
      {
        name: 'Baby Games, Diaper Raffle & High Tea',
        art: 'media/haldi.webp',
        date: '2026-12-20',
        time: '04:30 PM',
        venue: 'The Royal Heritage Grand Palace, Ahmedabad',
        description: 'Fun interactive games: guessing the baby arrival date, baby trivia, photo booth memories, and artisanal high tea & snacks.',
        enabled: true
      },
      {
        name: 'Aashirwad & Grand Royal Feast',
        art: 'media/reception.webp',
        date: '2026-12-20',
        time: '07:30 PM',
        venue: 'The Royal Heritage Grand Palace, Ahmedabad',
        description: 'Elders shower their sacred blessings on the mother-to-be, followed by a lavish royal celebratory banquet dinner.',
        enabled: true
      },
    ],

    compliments: {
      enabled: true,
      lead: 'With Best Compliments & Blessings From:',
      lines: [
        'Patel & Shah Families',
        'Shri Vishnubhai & Smt. Minakshiben Patel',
        'Shri Ashokbhai & Smt. Tejalben Patel',
        'Eager Big Cousins: Aayansh, Hiyan & Diya',
      ],
    },

    venueDetails: {
      name: 'The Royal Heritage Grand Palace & Banquet',
      address: 'Near Vaishnodevi Circle, S.G. Highway, Ahmedabad, Gujarat',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Ahmedabad+Grand+Palace',
      phone: '+91 97279 10473'
    },

    rsvp: {
      enabled: true,
      contactName: 'Priya & Aarav Patel',
      phone: '+919727910473',
      deadline: '2026-12-15'
    },

    farewell: {
      line: 'Warm welcome to shower your heartfelt blessings on the mother and the unborn baby! • Your Presence is our Greatest Gift'
    }
  };

  function deepMerge(base, over) {
    if (over === undefined) return base;
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (typeof base !== 'object' || base === null) return over !== undefined ? over : base;
    if (typeof over !== 'object' || over === null) return base;
    const out = {};
    Object.keys(base).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
    Object.keys(over).forEach((k) => { if (!(k in base)) out[k] = over[k]; });
    return out;
  }

  // Load from user-specific key, URL payload 'd', or local storage with pristine fallback to DEFAULTS
  function loadConfig() {
    let cfg = deepMerge(DEFAULTS, {});
    try {
      const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
      const urlCard = params.get('card') || params.get('slug');

      // 1. User-specific localStorage for this card
      if (urlCard) {
        try {
          const localSaved = JSON.parse(localStorage.getItem('card_' + urlCard) || 'null');
          if (localSaved && typeof localSaved === 'object') {
            cfg = deepMerge(cfg, localSaved);
          }
        } catch (_) {}
      }

      // 2. URL encoded payload 'd' in query or hash takes precedence
      const dParam = params.get('d') || hashParams.get('d');
      if (dParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(escape(atob(dParam.replace(/-/g, '+').replace(/_/g, '/')))));
          if (parsed && typeof parsed === 'object') {
            cfg = deepMerge(cfg, parsed);
            if (urlCard) {
              try {
                let existingLocal = {};
                try { existingLocal = JSON.parse(localStorage.getItem('card_' + urlCard) || '{}'); } catch(_) {}
                let mergedLocal = deepMerge(existingLocal, parsed);
                localStorage.setItem('card_' + urlCard, JSON.stringify(mergedLocal));
              } catch (_) {}
            }
          }
        } catch (e) {
          console.warn('d payload decode error:', e);
        }
      }

      // 3. Query param overrides
      if (params.has('to') || params.has('guest')) {
        cfg.guestName = params.get('to') || params.get('guest');
      }
      if (params.has('mom')) { cfg.momName = params.get('mom'); cfg.brideName = params.get('mom'); }
      if (params.has('dad')) { cfg.dadName = params.get('dad'); cfg.groomName = params.get('dad'); }
      if (params.has('names')) {
        let parts = params.get('names').split(/&|\band\b/i).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          cfg.momName = parts[0]; cfg.brideName = parts[0];
          cfg.dadName = parts[1]; cfg.groomName = parts[1];
        } else if (parts.length === 1) {
          cfg.momName = parts[0]; cfg.brideName = parts[0];
        }
      }
      if (params.has('date')) cfg.eventDateText = params.get('date');
      if (params.has('venue')) cfg.venueName = params.get('venue');
    } catch (_) {}

    return cfg;
  }

  const liveConfig = loadConfig();

  function save() {
    try {
      const sp = new URLSearchParams(location.search);
      const urlCard = sp.get('card') || sp.get('slug');
      if (urlCard) {
        localStorage.setItem('card_' + urlCard, JSON.stringify(window.Palna.config));
        window.dispatchEvent(new CustomEvent('card:saved', { detail: { cardId: urlCard, config: window.Palna.config } }));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.Palna.config));
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function reset() {
    try {
      const sp = new URLSearchParams(location.search);
      const urlCard = sp.get('card') || sp.get('slug');
      if (urlCard) {
        localStorage.removeItem('card_' + urlCard);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) { /* ignore */ }
  }

  window.Palna = {
    mode: mode,
    trial: trial,
    STORAGE_KEY: STORAGE_KEY,
    config: liveConfig,
    defaults: DEFAULTS,
    symbols: SYMBOLS,
    invocations: INVOCATIONS,
    resolveInvocation: resolveInvocation,
    symbolById: function (id) {
      return SYMBOLS.find(s => s.id === id) || SYMBOLS[0];
    },
    invocationLines: function (inv) {
      return resolveInvocation({ invocation: inv });
    },
    canEdit: function (path) {
      if (!trial) return true;
      return TRIAL_EDITABLE.indexOf(path) !== -1;
    },
    esc: function (s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    save: save,
    reset: reset
  };
  window.Royale = window.Palna;

  if (mode === 'edit') document.body.classList.add('is-editing');
  if (mode === 'preview') document.body.classList.add('is-previewing');
})();
