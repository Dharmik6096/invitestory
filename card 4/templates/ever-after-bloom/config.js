// Ever After Bloom - Illustrated Wedding Invitation Configuration
// aarohi & ishaan - An Illustrated Wedding Storybook
(function () {
  const config = {
    couple: {
      bride: "Aarohi",
      groom: "Ishaan",
      initials: "A & I"
    },
    dateISO: "2027-02-14T18:30:00+05:30",
    dateLabel: "Sunday, 14 February 2027",
    timeLabel: "6:30 in the evening",
    venue: {
      name: "Amrit Mahal Palace",
      address: "Jal Marg, Old City, Jaipur, Rajasthan",
      mapsQuery: "Amrit Mahal Palace Jaipur Rajasthan"
    },
    dressCode: "Festive Indian — pastels, ivory & gold",
    hero: {
      kicker: "Together with our families",
      eyebrow: "Save the Date",
      blessing: "Two rivers, one sky"
    },
    story: {
      title: "The Two of Them",
      subtitle: "A love story in three brushstrokes",
      bride: {
        name: "Aarohi",
        role: "The Bride",
        text: "Grew up chasing monsoon light with a sketchbook under her arm. She still stops mid-sentence for a good sunset, and she laughs before the joke has finished landing."
      },
      groom: {
        name: "Ishaan",
        role: "The Groom",
        text: "Learned to cook from his grandmother and to be patient from long train rides. He remembers every song he has ever loved, and hums them slightly wrong on purpose."
      }
    },
    chapters: [
      {
        no: "I",
        title: "A Courtyard in Winter",
        when: "December 2021",
        text: "They met beside a fountain at a friend's mehndi, arguing gently about whether the marigolds were orange or gold. Neither of them won."
      },
      {
        no: "II",
        title: "Letters and Long Calls",
        when: "2022 — 2024",
        text: "Two cities, one time zone, and a habit of narrating ordinary evenings to each other until the ordinary began to feel rare."
      },
      {
        no: "III",
        title: "The Lanterns",
        when: "October 2025",
        text: "On a rooftop above the old city, he asked. She had already said yes somewhere around the second lantern."
      },
      {
        no: "IV",
        title: "And Now, You",
        when: "February 2027",
        text: "The palace gates open, the sky turns rose, and the story waits for the people who made it possible."
      }
    ],
    gallery: [
      {
        src: "media/scene-walking.jpg",
        alt: "The couple walking hand in hand through a palace garden",
        caption: "Through palace gardens hand in hand"
      },
      {
        src: "media/scene-dancing.jpg",
        alt: "The couple dancing under strings of warm lights",
        caption: "Under strings of warm lights"
      },
      {
        src: "media/scene-hands.jpg",
        alt: "Two joined hands, one painted with henna",
        caption: "Two joined hands in love"
      },
      {
        src: "media/scene-balcony.jpg",
        alt: "The couple seated on a marble balcony at golden hour",
        caption: "Golden hour upon the marble balcony"
      }
    ],
    footer: {
      line1: "Come early. Stay late.",
      line2: "Dance badly with us.",
      signoff: "With all our love, Aarohi & Ishaan",
      date: "Sunday, 14 February 2027"
    }
  };

  // Local storage & URL payload support for visual edits and share links
  const STORAGE_KEY = 'eab_card4_config';
  try {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const urlCard = params.get('card') || params.get('slug');

    // 1. User-specific localStorage for this card
    if (urlCard) {
      try {
        let localSaved = JSON.parse(localStorage.getItem('card_' + urlCard) || 'null');
        // Always check Cloud API for freshest updates
        try {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', '/api/card/?slug=' + encodeURIComponent(urlCard) + '&v=' + Date.now(), false);
          xhr.send(null);
          if (xhr.status === 200 && xhr.responseText) {
            var apiData = JSON.parse(xhr.responseText);
            if (apiData && apiData.data) {
              localSaved = Object.assign({}, localSaved || {}, apiData.data);
              try { localStorage.setItem('card_' + urlCard, JSON.stringify(localSaved)); } catch(_) {}
            }
          }
        } catch (_) {}
        if (localSaved && typeof localSaved === 'object') Object.assign(config, localSaved);
      } catch (_) {}
    }

    // 2. URL encoded payload 'd' (query or hash) takes precedence
    const dParam = params.get('d') || hashParams.get('d');
    if (dParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(dParam.replace(/-/g, '+').replace(/_/g, '/')))));
        if (parsed && typeof parsed === 'object') {
          Object.assign(config, parsed);
          if (urlCard) {
            try {
              let existingLocal = {};
              try { existingLocal = JSON.parse(localStorage.getItem('card_' + urlCard) || '{}'); } catch(_) {}
              let mergedLocal = Object.assign({}, existingLocal, parsed);
              localStorage.setItem('card_' + urlCard, JSON.stringify(mergedLocal));
            } catch (_) {}
          }
        }
      } catch (e) {}
    }

    // 3. Query param overrides
    const urlNames = params.get('names') || params.get('couple');
    if (urlNames) {
      let parts = urlNames.split(/&|\band\b/i).map(s => s.trim()).filter(Boolean);
      if (!config.couple) config.couple = {};
      if (parts.length >= 2) {
        config.couple.bride = parts[0];
        config.couple.groom = parts[1];
      } else if (parts.length === 1) {
        config.couple.bride = parts[0];
      }
      config.couple.initials = (config.couple.bride[0] || 'A') + ' & ' + (config.couple.groom[0] || 'I');
    }
    if (params.get('bride')) { if (!config.couple) config.couple = {}; config.couple.bride = params.get('bride'); }
    if (params.get('groom')) { if (!config.couple) config.couple = {}; config.couple.groom = params.get('groom'); }
    if (params.get('date')) config.dateLabel = params.get('date');
    if (params.get('venue')) { if (!config.venue) config.venue = {}; config.venue.name = params.get('venue'); }
  } catch (e) {}

  window.INVITATION_CONFIG = config;
})();
