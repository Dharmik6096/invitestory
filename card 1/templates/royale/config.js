// Royale - the invitation's config: the single source of truth for everything
// a host can edit. Loads their saved edits over the template defaults and
// exposes the shared helpers render.js / editor.js / ceremonies.js use.
//
// Modes (from the URL), as papercut and rose-invitation:
//   ?edit=1     - the host edits the invitation in place
//   ?preview=1  - the host previews it as a guest sees it
//   (nothing)   - the final invitation; ?to=Guest%20Name personalises it
(function () {
  const params = new URLSearchParams(location.search);
  const isAdmin = (function () {
    try {
      return (localStorage.getItem('invitestory_admin_session') === 'true') || params.get('admin') === '1' || params.has('admin');
    } catch (_) {
      return false;
    }
  })();
  if (isAdmin) {
    document.documentElement.classList.add('is-admin');
    if (document.body) document.body.classList.add('is-admin');
  }
  const mode = (isAdmin && params.has('edit')) ? 'edit' : (isAdmin && params.has('preview')) ? 'preview' : 'view';

  const trial = false;
  const TRIAL_EDITABLE = [];

  // The trial gets its own storage key: it still has to persist (tapping
  // Preview navigates the page and the config is re-read on load), but it must
  // not write over the real key, or a shopper's trial edits would bleed into
  // the marketplace preview everyone else sees.
  const STORAGE_KEY = trial ? 'royaleTrialConfig' : 'royaleConfig';

  // ---- Opening invocation ----------------------------------------------
  // The same table papercut and rose-invitation offer, so a host meets the
  // identical choice in every template. Add a tradition, script or symbol in
  // one and add it to the others.
  const SYMBOLS = [
    { id: 'swaminarayan', label: 'Swaminarayan', src: '../symbols/_swaminarayan.svg' },
    { id: 'ganesha', label: 'Ganesha', src: '../symbols/_ganesha.svg' },
    { id: 'buddha', label: 'Buddha', src: '../symbols/_buddha.svg' },
    { id: 'sindhi', label: 'Jhulelal', src: '../symbols/_sindhi.svg' },
    { id: 'sikh', label: 'Ik Onkar', src: '../symbols/_sikh.svg' },
    { id: 'jain', label: 'Ahimsa symbol', src: '../symbols/_jain.svg' },
    { id: 'buddhist', label: 'Dharma wheel', src: '../symbols/_buddhist.svg' },
    { id: 'parsi', label: 'Faravahar', src: '../symbols/_parsi.svg' },
    { id: 'christian', label: 'Cross', src: '../symbols/_christian.svg' },
    { id: 'none', label: 'None', src: '' },
  ];

  const INVOCATIONS = {
    swaminarayan: {
      label: 'Swaminarayan',
      english: 'Shree Swaminarayan Namo Namah',
      scripts: {
        gujarati: { label: 'Gujarati', text: '|| Shree Swaminarayan Namo Namah ||', font: '' },
        devanagari: { label: 'Devanagari', text: '॥ श्री स्वामिनारायण नमो नमः ॥', font: 'Tiro Devanagari Sanskrit' },
      },
    },
    hindu: {
      label: 'Hindu',
      english: 'Shri Ganeshaya Namah',
      scripts: {
        devanagari: { label: 'Devanagari (Hindi/Marathi/Sanskrit/Nepali)', text: 'श्री गणेशाय नमः', font: 'Tiro Devanagari Sanskrit' },
        bengali: { label: 'Bengali', text: 'শ্রী গণেশায় নমঃ', font: 'Noto Sans Bengali' },
        gujarati: { label: 'Gujarati', text: '|| Shree Ganeshaya Namah ||', font: '' },
        gurmukhi: { label: 'Gurmukhi (Punjabi)', text: 'ਸ਼੍ਰੀ ਗਣੇਸ਼ਾਯ ਨਮਃ', font: 'Noto Sans Gurmukhi' },
        odia: { label: 'Odia', text: 'ଶ୍ରୀ ଗଣେଶାୟ ନମଃ', font: 'Noto Sans Oriya' },
        tamil: { label: 'Tamil', text: 'ஸ்ரீ கணேசாய நமஹ', font: 'Noto Sans Tamil' },
        telugu: { label: 'Telugu', text: 'శ్రీ గణేశాయ నమః', font: 'Noto Sans Telugu' },
        kannada: { label: 'Kannada', text: 'ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ', font: 'Noto Sans Kannada' },
        malayalam: { label: 'Malayalam', text: 'ശ്രീ ഗണേശായ നമഃ', font: 'Noto Sans Malayalam' },
      },
    },
    sikh: {
      label: 'Sikh',
      english: 'Ik Onkar, Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh',
      scripts: {
        gurmukhi: { label: 'Gurmukhi', text: 'ੴ ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ', font: 'Noto Sans Gurmukhi' },
      },
    },
    sindhi: {
      label: 'Sindhi',
      english: 'Jay Jhulelal',
      scripts: {
        devanagari: { label: 'Devanagari', text: 'जय झूलेलाल', font: 'Tiro Devanagari Sanskrit' },
        sindhi: { label: 'Sindhi', text: 'جھولےلال جي', font: 'Noto Naskh Arabic', rtl: true },
      },
    },
    jain: {
      label: 'Jain',
      english: 'Namo Arihantanam',
      scripts: {
        devanagari: { label: 'Devanagari', text: 'णमो अरिहंताणं', font: 'Tiro Devanagari Sanskrit' },
      },
    },
    buddhist: {
      label: 'Buddhist',
      english: 'Buddham Sharanam Gachhami',
      scripts: {
        devanagari: { label: 'Devanagari', text: 'बुद्धं शरणं गच्छामि', font: 'Tiro Devanagari Sanskrit' },
      },
    },
    christian: {
      label: 'Christian',
      english: 'In the name of the Father, the Son, and the Holy Spirit',
      scripts: {},
    },
    muslim: {
      label: 'Muslim',
      english: 'Bismillah ir-Rahman ir-Raheem',
      scripts: {
        arabic: { label: 'Arabic', text: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', font: 'Noto Naskh Arabic', rtl: true },
      },
    },
    parsi: {
      label: 'Parsi',
      english: 'Humata, Hukhta, Hvarshta',
      scripts: {},
    },
  };

  function symbolById(id) {
    for (let i = 0; i < SYMBOLS.length; i++) if (SYMBOLS[i].id === id) return SYMBOLS[i];
    return SYMBOLS[SYMBOLS.length - 1]; // 'none' - never the first artwork
  }

  /**
   * The one line the opening card shows, resolved from { religion, script }.
   * 'custom' is the host's own words; 'blank' is no line at all. A saved
   * religion or script that no longer exists falls back to the tradition's
   * first script rather than breaking the card.
   */
  function invocationLines(inv) {
    const sel = inv && inv.script;

    if (sel === 'custom') {
      return {
        religion: (inv && inv.religion) || 'hindu', script: 'custom',
        text: (inv && inv.custom) || '', font: '', rtl: false, isEnglish: false, isCustom: true,
      };
    }
    if (sel === 'blank') {
      return {
        religion: (inv && inv.religion) || 'hindu', script: 'blank',
        text: '', font: '', rtl: false, isEnglish: false, isBlank: true,
      };
    }

    const religion = INVOCATIONS[(inv && inv.religion)] ? inv.religion : 'hindu';
    const rel = INVOCATIONS[religion];
    const scriptKeys = Object.keys(rel.scripts);

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

  // ---- Default wedding date ---------------------------------------------
  // 15 days out from whenever the invitation is created, as papercut: a fixed
  // date would eventually be in the past, and the date reveal and the ceremony
  // schedule would both open looking stale.
  function isoDaysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Pure calendar-component arithmetic (Date.UTC/getUTC*, no timezone
  // conversion): `new Date(iso)` reads a bare yyyy-mm-dd as UTC and lands a
  // day early anywhere west of Greenwich.
  function addDaysISO(iso, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    d.setUTCDate(d.getUTCDate() + days);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }

  // The wedding date IS the Vivaah date - every other rite is scheduled
  // relative to it, in the order the rites actually run (the same offsets the
  // editor re-applies when the host moves the date).
  const VIVAAH_ISO = isoDaysFromNow(15);

  /**
   * The frames a gallery starts with. How many of them are taken depends on who
   * is looking, and the two readers want opposite things.
   *
   * A HOST opening the editor gets the first three - one portrait, one
   * landscape, one words card. Eight frames read as a fixed layout to be filled
   * in; three read as "these are the kinds, add what you want", which is what
   * the Add tile on the rail is for. The order below is why the cut is a plain
   * slice: the first three are already one of each.
   *
   * A SHOPPER previewing the template gets the lot. They are not filling
   * anything in - they are deciding whether they like it - and a full rope
   * shows the gallery doing what it was designed to do. Nobody edits this set,
   * so the generosity costs the host nothing: the moment they start editing,
   * their own three are what load.
   */
  const GALLERY_STARTERS = [
    { type: 'portrait', image: '', placeholder: true, caption: '#howitstarted', hang: 118 },
    { type: 'landscape', image: '', placeholder: true, caption: '#adventures', hang: 150 },
    { type: 'story', text: 'Some stories begin with grand gestures. Ours started with a simple conversation.', hang: 86 },
    { type: 'portrait', image: '', placeholder: true, caption: '#thelittlethings', hang: 132 },
    { type: 'landscape', image: '', placeholder: true, caption: '#everyday', hang: 100 },
    { type: 'story', text: "Friendship grew into something more, and we realized life's best moments were the ones we shared together.", hang: 120 },
    { type: 'portrait', image: '', placeholder: true, caption: '#foreverbegins', hang: 150 },
    { type: 'landscape', image: '', placeholder: true, caption: '#usforever', hang: 92 },
  ];

    const DEFAULTS = {
    version: 1,
    finalized: true,

    invocation: { symbol: 'ganesha', religion: 'hindu', script: 'english', custom: '' },

    groomName: 'Siddhant Patel',
    brideName: 'Aayushi Lunagariya',
    // Derived (see syncDerived) - kept flat for the platform's own EventData.
    title: 'Siddhant & Aayushi',
    hostNames: ['Siddhant', 'Aayushi'],

    // The gate's card, under the invocation.
    introNote: 'With the divine blessings of Lord Shree Ganesh, we cordially invite you and your family to celebrate the auspicious wedding ceremony of Siddhant and Aayushi.',

    // The date the three plaques roll to (date-reveal.js).
    eventISO: '2026-11-29',
    revealButton: 'Reveal the Date',
    revealAfter: 'Save the Date • 29-11-2026',

    // The two family scrolls.
    groomFamily: {
      enabled: true,
      name: 'Chi. Siddhant Patel',
      relLabel: 'Son of',
      parentA: 'Shri Pravinbhai P. Patel',
      parentB: 'Smt. Kavitaben Patel',
      parentJoin: '&',
      grandLabel: 'Grandson of (With Blessings of)',
      grandA: 'Late Shri Pragjibhai G. Patel',
      grandB: 'Late Smt. Madhuben Patel',
      grandJoin: '&',
    },
    brideFamily: {
      enabled: true,
      name: 'Chi. Aayushi Lunagariya',
      relLabel: 'Daughter of',
      parentA: 'Shri Sanjaybhai G. Lunagariya',
      parentB: 'Smt. Dakshaben Lunagariya',
      parentJoin: '&',
      grandLabel: 'Granddaughter of (With Blessings of)',
      grandA: 'Late Shri Tribhovandas G. Patel',
      grandB: 'Late Smt. Champaben Patel',
      grandJoin: '&',
    },

    gallery: {
      enabled: true,
      items: [
        {
          type: 'portrait',
          image: 'media/user_uploaded_shahi_1.jpg',
          placeholder: false,
          caption: '#SiddhantWedsAayushi',
          hang: 118,
          zoom: 1,
          posX: 50,
          posY: 50
        },
        {
          type: 'story',
          text: 'A joyful celebration of love, union, and togetherness. Two families united with the divine blessings of Lord Shree Swaminarayan.',
          hang: 86
        },
        {
          type: 'landscape',
          image: 'media/user_uploaded_shahi_2.jpg',
          placeholder: false,
          caption: '#ShubhVivah',
          hang: 150,
          posY: 47.603305785123965,
          zoom: 1.08,
          posX: 60.05291005291006
        },
        {
          type: 'story',
          text: 'As we embark on this sacred journey of seven vows and lifelong companionship, we request the honor of your presence and heartfelt blessings.',
          hang: 120
        },
        {
          type: 'portrait',
          image: 'media/user_uploaded_shahi_3.jpg',
          placeholder: false,
          caption: '#TogetherForever',
          hang: 100,
          zoom: 1,
          posX: 50,
          posY: 50
        }
      ]
    },

    ceremonies: [
      { name: 'Mandap Muhurat', art: 'media/ring_ceremony.webp', date: '2026-11-28', time: '07:00 AM', venue: 'A-302 Vedant Antilia, Opp. Devasya School, New Vastral, Ahmedabad', mapUrl: '', enabled: true, venueCustom: true },
      { name: 'Baraat / Jaan Prasthan', art: 'media/mehendi.webp', date: '2026-11-29', time: '05:00 AM', venue: 'Departure to Derdi Kumbhaji, Gondal', mapUrl: '', enabled: true, venueCustom: true },
      { name: 'Hasta Melap (Wedding Ceremony)', art: 'media/vivaah.webp', date: '2026-11-29', time: '06:00 PM', venue: 'Diwali-Ba Resort, Derdi Kumbhaji, Gondal, Rajkot', mapUrl: '', enabled: true, venueCustom: true },
      { name: 'Wedding Dinner & Reception', art: 'media/reception.webp', date: '2026-11-29', time: '07:30 PM', venue: 'Diwali-Ba Resort, Vasavad Road, Derdi Kumbhaji', mapUrl: '', enabled: true, venueCustom: true },
    ],

    compliments: {
      enabled: true,
      lead: 'With Best Compliments From:',
      lines: [
        'Shri Vishnubhai T. Patel & Smt. Rekhaben Patel (Ahmedabad)',
        'Shri Ashokbhai T. Patel & Smt. Tejalben Patel (Ahmedabad)',
        'Shri Umang V. Patel & Shri Vivek A. Patel',
        'Little Blessings: Aayansh & Hiyan',
        'Devnandan Medical Agency & Patel Pan Parlour',
      ],
    },

    note: {
      enabled: true,
      lead: 'Host & Venue Details',
      text: 'Host: Shri Pravinbhai P. Patel (+91 94294 36186) & Siddhant Patel (+91 94292 58126) | Residence: A-302, Vedant Antilia, Opp. Devasya School, New Vastral, Ahmedabad. Wedding Venue: Diwali-Ba Resort, Vasavad Road, Derdi Kumbhaji, Taluka Gondal, Dist. Rajkot.',
    },

    farewell: { line: 'Warm welcome to grace the occasion and bless the newlyweds • Your Presence & Blessings Mean the World to Us' },

    social: { instagram: true, instagramUrl: '' },

    music: { enabled: true, src: 'media/Jashn-e-bahara Instrumental.mp3', volume: 0.5 },
  };

  // Arrays are replaced wholesale rather than merged index by index, so an
  // invitation that has saved its own gallery or ceremonies keeps exactly what
  // it saved and never inherits a later default.
  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (typeof base !== 'object' || base === null) return over !== undefined ? over : base;
    if (typeof over !== 'object' || over === null) return base;
    const out = {};
    Object.keys(base).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
    Object.keys(over).forEach((k) => { if (!(k in base)) out[k] = over[k]; });
    return out;
  }

  // User-specific card data isolation & fallback logic:
  // Pristine DEFAULTS are NEVER overwritten. Each unique card link stores and loads
  // its own customizations under 'card_<cardId>' and from the URL 'd' payload.
  function load() {
    let result = deepMerge(DEFAULTS, {});

    // Dynamic URL parameters for shared custom templates
    try {
      const sp = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
      const urlCard = sp.get('card') || sp.get('slug') || hashParams.get('card') || hashParams.get('slug');
      const dParam = sp.get('d') || hashParams.get('d');
      let localSaved = null;

      // 1. Encoded payload in URL ('d') in query or hash for cross-device sharing & newest state
      if (dParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(escape(atob(dParam.replace(/-/g, '+').replace(/_/g, '/')))));
          if (parsed && typeof parsed === 'object') {
            result = deepMerge(result, parsed);
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

      // 2. User-specific localStorage for this card or server preset fallback
      if (urlCard) {
        try {
          localSaved = JSON.parse(localStorage.getItem('card_' + urlCard) || 'null');
        } catch (_) {}

        if (!dParam) {
          // 1. Try Cloud Database API first (always fetch latest edits)
          try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/api/card/?slug=' + encodeURIComponent(urlCard) + '&v=' + Date.now(), false);
            xhr.send(null);
            if (xhr.status === 200 && xhr.responseText) {
              var apiRes = JSON.parse(xhr.responseText);
              if (apiRes && apiRes.data) {
                localSaved = Object.assign({}, localSaved || {}, apiRes.data);
                try { localStorage.setItem('card_' + urlCard, JSON.stringify(localSaved)); } catch(_) {}
              }
            }
          } catch (_) {}

          // 2. Fallback to static cards/ JSON
          if (!localSaved) {
            try {
              var xhr2 = new XMLHttpRequest();
              xhr2.open('GET', '/cards/' + encodeURIComponent(urlCard) + '.json?v=' + Date.now(), false);
              xhr2.send(null);
              if (xhr2.status === 200 && xhr2.responseText) {
                var fresh = JSON.parse(xhr2.responseText);
                if (fresh && typeof fresh === 'object') {
                  localSaved = Object.assign({}, localSaved || {}, fresh);
                  try { localStorage.setItem('card_' + urlCard, JSON.stringify(fresh)); } catch(_) {}
                }
              }
            } catch (_) {}
          }
        }

        if (localSaved && typeof localSaved === 'object') {
          result = Object.assign(result, localSaved);
        }
      }

      // 3. Parameter overrides (only if not already provided by payload or localSaved)
      let urlNames = sp.get('names') || sp.get('couple') || hashParams.get('names');
      if (!urlNames && location.search.indexOf('names=') !== -1) {
        const m = location.search.match(/[?&]names=([^&#]+)/i);
        if (m) {
          try { urlNames = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch(_) { urlNames = m[1]; }
        }
      }
      if (urlNames && !dParam && !localSaved) {
        let parts = urlNames.split(/&|\band\b/i).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          result.groomName = parts[0];
          result.brideName = parts[1];
          result.title = urlNames;
          result.hostNames = parts;
        } else if (parts.length === 1 && !result.groomName) {
          result.groomName = parts[0];
        }
      }
      if (sp.get('bride') && !dParam && !localSaved) result.brideName = sp.get('bride');
      if (sp.get('groom') && !dParam && !localSaved) result.groomName = sp.get('groom');
      if (sp.get('date') && !dParam && !localSaved) {
        result.eventISO = sp.get('date');
      }
      if (sp.get('venue') && !dParam && !localSaved) {
        const v = sp.get('venue');
        if (Array.isArray(result.ceremonies)) {
          result.ceremonies = result.ceremonies.map(c => Object.assign({}, c, { venue: v }));
        }
      }
      if (sp.get('music')) {
        if (!result.music) result.music = {};
        result.music.track = sp.get('music');
      }
    } catch (err) {
      console.warn('load() exception:', err);
    }

    return result;
  }

  // The flat fields the platform reads (see RoyaleRuntime) are derived from
  // the couple's names on every save, so they can never drift from them.
  function syncDerived() {
    const cfg = window.Royale.config;
    const groom = (cfg.groomName || '').trim();
    const bride = (cfg.brideName || '').trim();
    cfg.title = [groom, bride].filter(Boolean).join(' & ');
    cfg.hostNames = [groom, bride].filter(Boolean);
  }

  function save() {
    syncDerived();
    try {
      const sp = new URLSearchParams(location.search);
      const urlCard = sp.get('card') || sp.get('slug');
      if (urlCard) {
        localStorage.setItem('card_' + urlCard, JSON.stringify(window.Royale.config));
        window.dispatchEvent(new CustomEvent('card:saved', { detail: { cardId: urlCard, config: window.Royale.config } }));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.Royale.config));
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

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));

  const nl2br = (s) => esc(s).replace(/\n/g, '<br />');

  function guestName() {
    return (params.get('to') || '').trim().slice(0, 80);
  }

  // '2026-02-08' -> 'Sun, 8 Feb 2026' / '19:30' -> '7:30 PM', for the ceremony
  // cards and anything else that prints one of them.
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtTime(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!m) return '';
    return new Date(2000, 0, 1, +m[1], +m[2])
      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  /** An explicit maps link if the host set one, else a search for the venue. */
  function mapLink(c) {
    const own = ((c && c.mapUrl) || '').trim();
    if (own) return own;
    const venue = ((c && c.venue) || '').trim();
    return venue ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venue) : '';
  }

  // ---- Ceremonies the couple adds themselves -------------------------------
  // Beyond the six rites the template ships with, a host may add up to this
  // many of their own (custom: true), each with a photo they upload in place
  // of the template's artwork. Keep in step with CUSTOM_CEREMONY_MAX in
  // EventEditorController, which refuses a save carrying more.
  //
  // An added ceremony carries a permanent `id`, which is its RSVP key (see
  // RoyaleRuntime::rsvpEvents). The six built-in ones keep the array position
  // they have always been keyed by, so nothing already replied to moves.
  const CUSTOM_CEREMONY_MAX = 5;

  // How far an added ceremony's photo may be zoomed out: below 1 it no
  // longer covers its area, so a cut-out picture can be shown whole. (Zooming
  // in stops at 3, as a gallery picture's does.)
  const CEREMONY_ZOOM_MIN = 0.3;

  /**
   * Does a guest see this ceremony? A built-in one unless the host switched it
   * off. An added one also needs its name and its photo: it has no artwork of
   * its own to fall back on, so until both are in it stays on the host's side.
   * The cards, the locations and calendar popups and the RSVP list all ask
   * this same question (the last in RoyaleRuntime, in PHP).
   */
  function ceremonyLive(c) {
    if (!c || c.enabled === false) return false;
    if (!c.custom) return true;
    return !!((c.art || '').trim() && (c.name || '').trim());
  }

  /**
   * The ceremonies in the order they happen - by date, then time - which is
   * how they are drawn. A copy: the stored array keeps its own order, since
   * that order is what the built-in ceremonies' RSVP keys are. No date sorts
   * last, no time first on its day; equal ones keep their stored order.
   */
  function ceremoniesByDate(list) {
    const when = (c) => (/^\d{4}-\d{2}-\d{2}$/.test(c.date || '') ? c.date : '9999-99-99') + ' ' + (c.time || '');
    return (Array.isArray(list) ? list : []).slice().sort((a, b) => when(a).localeCompare(when(b)));
  }

  // Real-time live update message listener from Studio Editor
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'card:update_live') return;
    const d = e.data;
    const cfg = window.Royale ? window.Royale.config : null;
    if (!cfg) return;

    if (d.names) {
      const parts = d.names.split(/&|\band\b/i).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        cfg.groomName = parts[0];
        cfg.brideName = parts[1];
      } else if (parts.length === 1) {
        cfg.groomName = parts[0];
      }
      cfg.title = d.names;
      cfg.hostNames = parts;
    }
    if (d.date) {
      cfg.eventISO = d.date;
    }
    if (d.venue && Array.isArray(cfg.ceremonies)) {
      cfg.ceremonies.forEach(c => { c.venue = d.venue; });
    }
    if (d.music) {
      if (!cfg.music) cfg.music = {};
      cfg.music.track = d.music;
    }
    syncDerived();
    save();
    if (window.Royale && window.Royale.render && typeof window.Royale.render.all === 'function') {
      window.Royale.render.all();
    }
  });

  window.Royale = {
    mode,
    trial,
    TRIAL_EDITABLE,
    /** Can this config path be edited in the current mode? Fully unlocked for admin studio! */
    canEdit: function (path) {
      return mode === 'edit';
    },
    config: load(),
    DEFAULTS,
    SYMBOLS,
    INVOCATIONS,
    symbolById,
    invocationLines,
    STORAGE_KEY,
    addDaysISO,
    save,
    reset,
    syncDerived,
    esc,
    nl2br,
    guestName,
    fmtDate,
    fmtTime,
    mapLink,
    CUSTOM_CEREMONY_MAX,
    CEREMONY_ZOOM_MIN,
    ceremonyLive,
    ceremoniesByDate,
  };

  if (mode === 'edit') document.body.classList.add('is-editing');
  if (mode === 'preview') document.body.classList.add('is-previewing');
  if (trial) document.body.classList.add('is-trial');
})();
