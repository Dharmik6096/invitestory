/* ==========================================================================
   WAX SEAL ROYALE — BABY SHOWER CONTROLLER
   Recreating exact mechanics of https://wax-seal-royale.invitestory.in/
   ========================================================================== */

(function () {
  'use strict';

  var overlay    = document.getElementById('weiOverlay');
  var videoWrap  = document.getElementById('weiVideoWrap');
  var video      = document.getElementById('weiVideo');
  var audio      = document.getElementById('weiAudio');
  var audioBtn   = document.getElementById('weiAudioBtn');
  var iconPause  = document.getElementById('weiIconPause');
  var iconPlay   = document.getElementById('weiIconPlay');
  var inviteMain = document.getElementById('inviteMain');
  var done       = false;

  // 1. START OPENING TRANSITION
  function startVideo() {
    if (done) return;
    done = true;

    // Fade out closed envelope
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(function () { overlay.style.display = 'none'; }, 1400);
    }

    // Play cracking wax seal & unfolding flap video
    if (videoWrap && video) {
      videoWrap.classList.add('wei-video-in');
      var vp = video.play();
      if (vp && vp.catch) vp.catch(function(){});
    }

    // Play background instrumental music
    if (audio) {
      audio.muted = false;
      audio.volume = 0.9;
      var ap = audio.play();
      if (ap && ap.catch) ap.catch(function(){});
    }
  }

  // 2. REVEAL INVITATION AFTER FLAP OPENS
  function endSequence() {
    // Fade out opening video smoothly
    if (videoWrap) {
      videoWrap.classList.remove('wei-video-in');
      videoWrap.classList.add('wei-video-out');
      setTimeout(function () { videoWrap.style.display = 'none'; }, 1400);
    }

    // Reveal the full scenic archway & inside invitation
    if (inviteMain) {
      inviteMain.classList.add('revealed');
    }

    // Play background video of swans & lake
    var heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
      var hp = heroVideo.play();
      if (hp && hp.catch) hp.catch(function(){});
    }

    // Reveal floating royal audio toggle button
    if (audioBtn) {
      audioBtn.style.visibility = 'visible';
      audioBtn.style.opacity = '1';
    }
    if (audio && audio.paused) {
      audio.muted = false;
      audio.volume = 0.9;
      audio.play().catch(function(){});
    }
  }

  // Tap/click envelope to begin
  if (overlay) {
    overlay.addEventListener('click', startVideo);
    overlay.addEventListener('touchstart', startVideo, { passive: true });
  }

  // Fade opening video 0.8s before end
  if (video) {
    video.addEventListener('timeupdate', function () {
      if (video.duration && video.currentTime >= video.duration - 0.8 && !video.dataset.fading) {
        video.dataset.fading = '1';
        endSequence();
      }
    });

    video.addEventListener('ended', function () {
      if (!video.dataset.fading) {
        video.dataset.fading = '1';
        endSequence();
      }
    });
  }

  // 3. AUDIO BUTTON TOGGLE
  if (audioBtn && audio) {
    audioBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (audio.paused) {
        audio.play().then(function () {
          if (iconPlay) iconPlay.style.display = 'none';
          if (iconPause) iconPause.style.display = 'block';
        }).catch(function(){});
      } else {
        audio.pause();
        if (iconPlay) iconPlay.style.display = 'block';
        if (iconPause) iconPause.style.display = 'none';
      }
    });
  }

  // 4. LIVE COUNTDOWN TIMER WITH GOLD SHIMMER
  (function initCountdown() {
    // Target event date: Sunday, Nov 22, 2026 at 09:30 AM
    var eventDate = new Date(2026, 10, 22, 9, 30, 0);
    var elDays  = document.getElementById('days');
    var elHours = document.getElementById('hours');
    var elMins  = document.getElementById('minutes');
    var elSecs  = document.getElementById('seconds');
    var countdownBox = document.getElementById('countdownContainer');

    if (!elDays || !elHours || !elMins || !elSecs || !countdownBox) return;

    var prev = { days: null, hours: null, minutes: null, seconds: null };
    var revealed = false;

    function flip(el, newVal) {
      if (el.textContent === newVal) return;
      el.classList.add('flip-out');
      setTimeout(function () {
        el.textContent = newVal;
        el.classList.remove('flip-out');
        el.classList.add('flip-in');
        void el.offsetHeight;
        el.classList.remove('flip-in');
      }, 150);
    }

    function tick() {
      var now = new Date();
      var dist = eventDate - now;

      if (dist < 0) {
        countdownBox.innerHTML = '<div style="font-family:\'NewFonts\',Arial;font-size:26px;color:#a67d2b;padding:12px;">Celebrating Today!</div>';
        return;
      }

      var d = String(Math.floor(dist / 86400000));
      var h = String(Math.floor((dist % 86400000) / 3600000)).padStart(2, '0');
      var m = String(Math.floor((dist % 3600000) / 60000)).padStart(2, '0');
      var s = String(Math.floor((dist % 60000) / 1000)).padStart(2, '0');

      if (d !== prev.days)    { flip(elDays, d);    prev.days = d; }
      if (h !== prev.hours)   { flip(elHours, h);   prev.hours = h; }
      if (m !== prev.minutes) { flip(elMins, m);    prev.minutes = m; }
      if (s !== prev.seconds) { flip(elSecs, s);    prev.seconds = s; }
    }

    tick();
    setInterval(tick, 1000);

    function doReveal() {
      if (revealed) return;
      revealed = true;
      document.querySelectorAll('.number').forEach(function (el) {
        el.classList.add('revealed');
      });
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0] && entries[0].isIntersecting) {
          doReveal();
          observer.disconnect();
        }
      }, { threshold: 0.3 });
      observer.observe(countdownBox);
    } else {
      doReveal();
    }
  })();

  // 5. WHATSAPP RSVP BUTTON ROBUST HANDLER
  function triggerWhatsApp(customText) {
    var cfg = (window.Palna && window.Palna.config) ? window.Palna.config : {};
    var mom = cfg.momName || cfg.brideName || 'Meghal';
    var dad = cfg.dadName || cfg.groomName || 'Kaushal';
    var coupleText = [mom, dad].filter(Boolean).join(' & ') || 'Meghal & Kaushal';
    var eventDateStr = cfg.eventDateText || 'Sunday, 22 November 2026';
    var phone = (cfg.whatsappRsvp || (cfg.rsvp && cfg.rsvp.phone) || '919727910473').replace(/\D/g, '');
    if (!phone) phone = '919727910473';

    var defaultMsg = 'Dear ' + coupleText + ', we are delighted to attend your Baby Shower celebration on ' + eventDateStr + '!';
    var textToSend = customText || defaultMsg;
    var waUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(textToSend);

    try {
      var win = window.open(waUrl, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        if (window.top && window.top !== window) {
          window.top.location.href = waUrl;
        } else {
          window.location.href = waUrl;
        }
      }
    } catch (err) {
      if (window.top && window.top !== window) {
        window.top.location.href = waUrl;
      } else {
        window.location.href = waUrl;
      }
    }
  }

  var btnWa = document.getElementById('btnWhatsappRsvp');
  if (btnWa) {
    btnWa.addEventListener('click', function (e) {
      e.preventDefault();
      triggerWhatsApp();
    });
  }

  // 6. GUESTBOOK BLESSING FORM WITH 1-CLICK WHATSAPP FORWARDING
  var wishesForm = document.getElementById('wishesForm');
  var wishesSuccess = document.getElementById('wishesSuccess');

  if (wishesForm) {
    wishesForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var cfg = (window.Palna && window.Palna.config) ? window.Palna.config : {};
      var mom = cfg.momName || cfg.brideName || 'Meghal';
      var dad = cfg.dadName || cfg.groomName || 'Kaushal';
      var coupleText = [mom, dad].filter(Boolean).join(' & ') || 'Meghal & Kaushal';

      var nameInput = document.getElementById('guestName');
      var statusSelect = document.getElementById('guestStatus');
      var msgInput = document.getElementById('guestMessage');

      var nameVal = nameInput ? nameInput.value.trim() : 'Guest';
      var statusVal = statusSelect ? statusSelect.value : 'Attending';
      var msgVal = msgInput ? msgInput.value.trim() : '';

      var formattedWaMsg = 'Namaste ' + coupleText + '! 🙏✨\n\n' +
        '🍼 *Baby Shower RSVP & Blessing*\n\n' +
        '👤 *Guest:* ' + nameVal + '\n' +
        '✨ *Status:* ' + (statusVal === 'Attending' ? 'Joyfully Attending 🎉' : 'Regretfully Unable to Attend') + '\n' +
        (msgVal ? '💌 *Blessing:* "' + msgVal + '"\n' : '') +
        '\nLooking forward to celebrating this joyous milestone with you! 💖';

      if (wishesSuccess) {
        wishesSuccess.innerHTML =
          '<div style="text-align:center; padding: 6px 0;">' +
            '<div style="font-size: 16px; font-weight: 700; color: #5A0F1B; margin-bottom: 6px;">✨ Thank You, ' + nameVal + '!</div>' +
            '<p style="font-size: 14px; color: #6E5646; line-height: 1.4; margin-bottom: 14px;">Your sweet blessings for ' + coupleText + ' and baby have been saved.</p>' +
            '<button type="button" id="btnSendWaCustom" style="display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:12px 16px; background:#25D366; color:#ffffff; font-family:\'Cinzel\',serif; font-size:11px; letter-spacing:0.14em; font-weight:700; border:none; border-radius:24px; cursor:pointer; box-shadow:0 4px 14px rgba(37,211,102,0.35);">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.05 20.15C10.57 20.15 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.69 12.05 3.69C14.25 3.69 16.32 4.55 17.88 6.11C19.44 7.67 20.3 9.74 20.3 11.94C20.29 16.48 16.59 20.15 12.05 20.15Z"/></svg>' +
              'SEND ON WHATSAPP NOW' +
            '</button>' +
          '</div>';
        wishesSuccess.style.display = 'block';
        wishesForm.style.display = 'none';

        var btnCustomWa = document.getElementById('btnSendWaCustom');
        if (btnCustomWa) {
          btnCustomWa.addEventListener('click', function () {
            triggerWhatsApp(formattedWaMsg);
          });
        }
      }
    });
  }

  // Apply Palna.config to DOM elements
  function renderPalnaConfig() {
    var cfg = (window.Palna && window.Palna.config) ? window.Palna.config : {};
    var mom = cfg.momName || cfg.brideName || 'Meghal';
    var dad = cfg.dadName || cfg.groomName || 'Kaushal';
    var coupleText = [mom, dad].filter(Boolean).join(' & ') || 'Meghal & Kaushal';
    var dateStr = cfg.eventDateText || cfg.date || 'Sunday, 22 November 2026';
    var venueStr = cfg.venueName || cfg.venue || 'Adelaide SA, Klemzig Community Hall';
    var hostsStr = cfg.hosts || 'Patel Family';

    var elFirst = document.querySelector('.hero-name-first');
    if (elFirst) elFirst.textContent = mom;
    var elSecond = document.querySelector('.hero-name-second');
    if (elSecond) elSecond.textContent = dad;
    var elParents = document.querySelector('.parents-names');
    if (elParents) elParents.textContent = coupleText;

    var elHostText = document.querySelector('.host-text');
    if (elHostText && cfg.eventTagline) {
      elHostText.textContent = cfg.eventTagline;
    } else if (elHostText && (cfg.momName || cfg.dadName)) {
      elHostText.textContent = 'Join us to shower mother-to-be ' + mom + ' and father-to-be ' + dad + ' with love, laughter, blessings, and unforgettable memories as we celebrate the upcoming arrival of our little baby.';
    }

    var elLunchBadge = document.querySelector('.event-lunch-badge');
    if (elLunchBadge) {
      elLunchBadge.innerHTML = dateStr.toUpperCase() + '<br><span class="lunch-note">FOLLOWED BY LUNCH</span>';
    }

    var elVenueTitle = document.querySelector('.venue-card-title');
    if (elVenueTitle) elVenueTitle.textContent = venueStr;

    var elFooterFamily = document.querySelector('.footer-family');
    if (elFooterFamily) elFooterFamily.textContent = 'With love, ' + hostsStr;

    var elFooterHash = document.querySelector('.footer-hash');
    if (elFooterHash) {
      elFooterHash.textContent = '#' + mom.replace(/[^a-zA-Z0-9]/g, '') + dad.replace(/[^a-zA-Z0-9]/g, '') + 'BabyShower • #BabyShower2026';
    }

    if (cfg.sacredArtImg) {
      var elArt = document.querySelector('.sacred-art-img');
      if (elArt) {
        elArt.src = cfg.sacredArtImg;
        elArt.setAttribute('src', cfg.sacredArtImg);
      }
    }
    if (cfg.babyFeetImg) {
      var elFeet = document.querySelector('.baby-feet-img');
      if (elFeet) {
        elFeet.src = cfg.babyFeetImg;
        elFeet.setAttribute('src', cfg.babyFeetImg);
      }
    }
    if (cfg.venueSketchImg) {
      var elSketch = document.querySelector('.venue-sketch');
      if (elSketch) {
        elSketch.src = cfg.venueSketchImg;
        elSketch.setAttribute('src', cfg.venueSketchImg);
      }
    }

    var btnMaps = document.querySelector('.btn-maps');
    if (btnMaps) {
      btnMaps.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venueStr);
    }
  }
  renderPalnaConfig();

})();

  if (location.search.includes('mode=fullscreen') || location.hash.includes('fullscreen')) {
    var a = document.getElementById('weiAudio');
    if (a) {
      a.muted = false;
      a.volume = 0.9;
      var p = a.play();
      if (p && p.catch) p.catch(function(){});
    }
  }

  window.addEventListener('message', function (e) {
    var a = document.getElementById('weiAudio');
    if (e.data && (e.data.type === 'INVITESTORY_PLAY_AUDIO' || e.data.type === 'PLAY_AUDIO')) {
      if (a) {
        a.muted = false;
        a.volume = 0.9;
        a.play().catch(function(){});
      }
    } else if (e.data && (e.data.type === 'INVITESTORY_PAUSE_AUDIO' || e.data.type === 'PAUSE_AUDIO')) {
      if (a) {
        a.pause();
      }
    }
  });
