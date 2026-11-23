/**
 * Universal Cloud Storage & Backend Sync Engine
 * Handles saving cards and uploading media to cloud storage.
 * Eliminates long base64 hashes from URLs across all templates.
 */
(function () {
  'use strict';

  var CloudStorage = {
    // Generate clean short URL for sharing
    getCleanInviteUrl: function (slug, coupleNames) {
      var origin = window.location.origin || 'https://invitation-card-umber-six.vercel.app';
      var url = origin + '/invite/?card=' + encodeURIComponent(slug);
      if (coupleNames) {
        url += '&names=' + encodeURIComponent(coupleNames);
      }
      return url;
    },

    // Upload standalone image to cloud
    uploadImage: function (base64OrDataUri) {
      return fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64OrDataUri })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Upload failed with status ' + res.status);
          return res.json();
        })
        .then(function (json) {
          return json.url;
        });
    },

    // Save card to cloud database & update local registry
    saveCard: function (slug, config, meta) {
      meta = meta || {};
      var origin = window.location.origin || 'https://invitation-card-umber-six.vercel.app';
      var cleanUrl = CloudStorage.getCleanInviteUrl(slug, meta.names || config.title || '');

      return fetch('/api/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug,
          cardId: meta.cardId,
          names: meta.names || config.title || '',
          data: config
        })
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (result) {
          var savedData = (result && result.data) ? result.data : config;
          
          // Save clean data in localStorage
          try {
            localStorage.setItem('card_' + slug, JSON.stringify(savedData));
          } catch (_) {}

          // Update admin registry with clean URL
          try {
            var reg = JSON.parse(localStorage.getItem('invitestory_cards_registry') || '[]');
            var idx = reg.findIndex(function (c) { return c.slug === slug; });
            var record = {
              slug: slug,
              cardId: meta.cardId || (idx >= 0 ? reg[idx].cardId : 102),
              templateName: meta.templateName || (idx >= 0 ? reg[idx].templateName : 'Royale'),
              names: meta.names || config.title || (idx >= 0 ? reg[idx].names : 'Invitation Card'),
              date: meta.date || (idx >= 0 ? reg[idx].date : ''),
              venue: meta.venue || (idx >= 0 ? reg[idx].venue : ''),
              url: cleanUrl,
              updatedAt: Date.now()
            };
            if (idx >= 0) {
              reg[idx] = Object.assign({}, reg[idx], record);
            } else {
              reg.unshift(record);
            }
            localStorage.setItem('invitestory_cards_registry', JSON.stringify(reg));
          } catch (_) {}

          return {
            success: true,
            slug: slug,
            url: cleanUrl,
            data: savedData
          };
        })
        .catch(function (err) {
          console.warn('Cloud save fallback to local:', err);
          // Fallback: save to local storage
          try {
            localStorage.setItem('card_' + slug, JSON.stringify(config));
          } catch (_) {}
          return {
            success: true,
            slug: slug,
            url: cleanUrl,
            data: config
          };
        });
    },

    // Fetch card from cloud database with local fallback
    getCard: function (slug) {
      return fetch('/api/card?slug=' + encodeURIComponent(slug) + '&v=' + Date.now())
        .then(function (res) {
          if (!res.ok) throw new Error('API fetch failed');
          return res.json();
        })
        .then(function (json) {
          if (json && json.data) {
            try {
              localStorage.setItem('card_' + slug, JSON.stringify(json.data));
            } catch (_) {}
            return json.data;
          }
          throw new Error('No data in API response');
        })
        .catch(function () {
          // Fallback 1: fetch from static cards/
          return fetch('/cards/' + encodeURIComponent(slug) + '.json?v=' + Date.now())
            .then(function (res) {
              if (!res.ok) throw new Error('Static fetch failed');
              return res.json();
            })
            .then(function (staticData) {
              try {
                localStorage.setItem('card_' + slug, JSON.stringify(staticData));
              } catch (_) {}
              return staticData;
            })
            .catch(function () {
              // Fallback 2: local storage
              try {
                var local = localStorage.getItem('card_' + slug);
                return local ? JSON.parse(local) : null;
              } catch (_) {
                return null;
              }
            });
        });
    }
  };

  window.CloudStorage = CloudStorage;
})();
