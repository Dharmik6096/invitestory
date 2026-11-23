// Card 5 - Aabha (Mithril) Luxury Key Unlock Invitation Configuration
// Edit this file to customize the invitation details for Kian & Aria or your own celebration.

window.VERONA_CONFIG = {
  "meta": {
    "title": "Kian & Aria — Reception Invitation · Aabha",
    "description": "You are warmly invited to the Reception of Kian & Aria · Sunday, 18 October 2026."
  },
  "sections": [
    "invitation",
    "portrait",
    "scratch",
    "countdown",
    "interlude",
    "celebration",
    "dressCode",
    "closing"
  ],
  "cover": {
    "hint": "Tap to unlock"
  },
  "hero": {
    "eyebrow": "The Reception of",
    "couple": "Kian & Aria",
    "dateShort": "18.10.26"
  },
  "invitation": {
    "lines": [
      {
        "kind": "label",
        "text": "Mr. & Mrs.\nLeon Ellis"
      },
      {
        "kind": "body",
        "text": "request the pleasure of your company\nat the wedding reception of their son",
        "measure": "wide"
      },
      {
        "kind": "names",
        "text": "Kian & Aria"
      },
      {
        "kind": "body",
        "text": "daughter of Mr. & Mrs. Robert Hart.",
        "measure": "wide"
      },
      {
        "kind": "body",
        "text": "Your presence and good wishes would make this day even more meaningful."
      }
    ]
  },
  "scratch": {
    "heading": "Save the Date",
    "note": "Scratch the card to reveal the date",
    "kicker": "The Reception of Kian & Aria",
    "day": "Sunday",
    "date": "18 October 2026",
    "time": "7:00 PM · Jagmandir Island Palace",
    "calendar": "Add to calendar",
    "startIso": "2026-10-18T19:00:00+05:30",
    "endIso": "2026-10-18T22:30:00+05:30"
  },
  "countdown": {
    "heading": "Time left",
    "targetIso": "2026-10-18T19:00:00+05:30",
    "days": "Days",
    "hours": "Hours",
    "minutes": "Minutes",
    "seconds": "Seconds"
  },
  "celebration": {
    "heading": "The Evening",
    "mapLabel": "View on map",
    "events": [
      {
        "label": "Wedding Reception",
        "time": "7:00 PM",
        "venue": "Jagmandir Island Palace",
        "address": "Udaipur, Rajasthan, India",
        "mapHref": "https://www.google.com/maps/search/?api=1&query=Jagmandir%20Island%20Palace%2C%20Udaipur%2C%20Rajasthan%2C%20India",
        "image": "./assets/images/venue-v2.webp"
      }
    ]
  },
  "dressCode": {
    "heading": "Dress code",
    "notes": [
      "We kindly ask you to \nwear elegant attire",
      "in the colours of the palette below."
    ],
    "swatches": [
      "#e8d6be",
      "#d3b896",
      "#a6ada1",
      "#5e6a5c"
    ]
  },
  "rsvp": {
    "heading": "RSVP",
    "note": "Please confirm your presence by October 10",
    "nameLabel": "First Name, Last Name",
    "guestsLabel": "Number of guests",
    "yesText": "I'll be there with joy.",
    "noText": "I won't be able to attend.",
    "confirm": "Confirm",
    "sending": "Sending…",
    "thanks": "Thank you — your reply has been sent.",
    "error": "Your reply could not be sent. Please check your connection and try again.",
    "endpoint": ""
  },
  "closing": {
    "script": {
      "lang": "en",
      "text": "Two hearts, one beautiful journey."
    },
    "line": "We look forward to seeing you.",
    "date": "18 · 10 · 2026"
  },
  "music": {
    "src": "./assets/audio/music.mp3",
    "playAria": "Play background music",
    "pauseAria": "Pause background music"
  },
  "media": {
    "lockVideo": "./assets/video/opening-v3.mp4",
    "openingPoster": "./assets/images/opening-poster-v3.webp",
    "heroVideo": "./assets/video/hero.mp4",
    "heroPoster": "./assets/images/hero-poster-playback-v4.jpg",
    "interlude": "./assets/images/interlude-v2.webp",
    "portrait": "./assets/images/portrait-v2.webp",
    "crystals": "./assets/images/crystals-v2.webp",
    "divider": "./assets/images/divider-v2.webp",
    "dressCode": "./assets/images/dresscode-v2.webp",
    "closingCover": "./assets/images/footer-cover-v2.webp",
    "closingKey": "./assets/images/key-v2.webp"
  }
};

(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    var hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    var urlCard = params.get('card') || params.get('slug');
    var names = params.get('names') || params.get('couple');
    var dParam = params.get('d') || hashParams.get('d');
    var overrides = {};

    if (urlCard) {
      try {
        var cardSaved = JSON.parse(localStorage.getItem('card_' + urlCard) || 'null');
        // Always check Cloud API for freshest updates
        try {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', '/api/card/?slug=' + encodeURIComponent(urlCard) + '&v=' + Date.now(), false);
          xhr.send(null);
          if (xhr.status === 200 && xhr.responseText) {
            var apiData = JSON.parse(xhr.responseText);
            if (apiData && apiData.data) {
              cardSaved = Object.assign({}, cardSaved || {}, apiData.data);
              try { localStorage.setItem('card_' + urlCard, JSON.stringify(cardSaved)); } catch(_) {}
            }
          }
        } catch (_) {}
        if (cardSaved && typeof cardSaved === 'object') {
          overrides = Object.assign({}, cardSaved, overrides);
        }
      } catch (_) {}
    } else {
      var saved = localStorage.getItem('mithrilConfig');
      if (saved) {
        try {
          var savedObj = JSON.parse(saved);
          overrides = Object.assign({}, savedObj, overrides);
        } catch (_) {}
      }
    }

    if (dParam) {
      try {
        var parsed = JSON.parse(decodeURIComponent(escape(atob(dParam.replace(/-/g, '+').replace(/_/g, '/'))))) || {};
        overrides = Object.assign({}, overrides, parsed);
        if (urlCard) {
          try {
            var existingLocal = {};
            try { existingLocal = JSON.parse(localStorage.getItem('card_' + urlCard) || '{}'); } catch(_) {}
            var mergedLocal = Object.assign({}, existingLocal, parsed);
            localStorage.setItem('card_' + urlCard, JSON.stringify(mergedLocal));
          } catch (_) {}
        }
      } catch (_) {}
    }

    if (names) overrides.couple = decodeURIComponent(names);

    if (overrides.couple) {
      window.VERONA_CONFIG.hero.couple = overrides.couple;
      window.VERONA_CONFIG.meta.title = overrides.couple + " — Reception Invitation · Aabha";
      window.VERONA_CONFIG.scratch.kicker = "The Reception of " + overrides.couple;
    }
    if (overrides.date) {
      window.VERONA_CONFIG.scratch.date = overrides.date;
    }
    if (overrides.venue) {
      if (window.VERONA_CONFIG.celebration && window.VERONA_CONFIG.celebration.events && window.VERONA_CONFIG.celebration.events[0]) {
        window.VERONA_CONFIG.celebration.events[0].venue = overrides.venue;
      }
    }
    if (overrides.time) {
      window.VERONA_CONFIG.scratch.time = overrides.time;
      if (window.VERONA_CONFIG.celebration && window.VERONA_CONFIG.celebration.events && window.VERONA_CONFIG.celebration.events[0]) {
        window.VERONA_CONFIG.celebration.events[0].time = overrides.time;
      }
    }
    if (overrides.couplePortrait) {
      window.VERONA_CONFIG.couplePortrait = overrides.couplePortrait;
      if (window.VERONA_CONFIG.media) window.VERONA_CONFIG.media.portrait = overrides.couplePortrait;
    }
  } catch (e) {}
})();
