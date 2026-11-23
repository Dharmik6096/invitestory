// Card 5 - Aabha (Mithril) Luxury Heirloom Controller
// Clean, dependency-free interactive engine for key unlock, music, scratch foil, countdown & calendar.

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    applyConfigOverrides();
    initCoverUnlock();
    initAudio();
    initScratchCard();
    initCountdown();
    initCalendarModal();
    initScrollAnimations();
  }

  function applyConfigOverrides() {
    const cfg = window.VERONA_CONFIG;
    if (!cfg) return;
    if (cfg.hero && cfg.hero.couple) {
      const coupleText = cfg.hero.couple;
      document.querySelectorAll('.vr-cover-names').forEach(el => el.textContent = coupleText);
      const heroTitle = document.querySelector('h1[data-hero]');
      if (heroTitle) heroTitle.textContent = coupleText;
      const namesSpan = document.querySelector('span[data-v="P"]');
      if (namesSpan) namesSpan.textContent = coupleText;
      const scratchKicker = document.querySelector('.vr-scratch-card .font-cinzel.tracking-\\[0\\.28em\\]');
      if (scratchKicker) scratchKicker.textContent = "The Reception of " + coupleText;
      const calNote = document.querySelector('.wc-note');
      if (calNote) {
        calNote.innerHTML = "The Reception of " + coupleText + "<br>" + (cfg.scratch && cfg.scratch.date ? cfg.scratch.date : 'Sunday, 18 October 2026') + " · " + (cfg.scratch && cfg.scratch.time ? cfg.scratch.time : '7:00 PM');
      }
    }
  }

  // --- 1. Antique Key Cover Unlock ---
  function initCoverUnlock() {
    const cover = document.getElementById('cover');
    const lockVideo = document.getElementById('lockVideo');
    const coverText = document.getElementById('coverText');
    const heroStage = document.getElementById('heroStage');
    const heroVideo = document.getElementById('heroVideo');
    const heroPoster = document.getElementById('heroPoster');
    const musicWrap = document.getElementById('musicWrap');
    const music = document.getElementById('music');

    if (!cover) return;

    let isUnlocking = false;

    function unlockInvitation() {
      if (isUnlocking) return;
      isUnlocking = true;

      if (coverText) coverText.style.opacity = '0';

      // Prime and attempt audio play
      if (music) {
        music.muted = false;
        music.volume = 0.8;
        music.play().then(() => {
          updateMusicUI(true);
        }).catch(() => {
          updateMusicUI(false);
        });
      }

      function revealCard() {
        cover.style.opacity = '0';
        cover.style.transform = 'scale(1.05)';
        cover.style.pointerEvents = 'none';

        if (heroStage) heroStage.style.transform = 'none';
        if (heroVideo) {
          heroVideo.style.opacity = '1';
          heroVideo.play().catch(() => {});
        }
        if (heroPoster) heroPoster.style.opacity = '0';
        if (musicWrap) {
          musicWrap.style.opacity = '1';
          musicWrap.style.pointerEvents = 'auto';
        }
        if (music && music.paused) {
          music.muted = false;
          music.volume = 0.8;
          music.play().then(() => updateMusicUI(true)).catch(() => {});
        }

        setTimeout(() => {
          if (cover.parentNode) cover.remove();
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }, 1200);
      }

      if (lockVideo) {
        lockVideo.playbackRate = 1;
        lockVideo.play().catch(revealCard);
        lockVideo.addEventListener('ended', revealCard, { once: true });
        // Fallback watchdog in case video stalls
        setTimeout(revealCard, 4500);
      } else {
        revealCard();
      }
    }

    cover.addEventListener('click', unlockInvitation);
    cover.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        unlockInvitation();
      }
    });
  }

  // --- 2. Ambient Audio Controller ---
  function updateMusicUI(isPlaying) {
    const mutedIcon = document.getElementById('musicIconMuted');
    const playingIcon = document.getElementById('musicIconPlaying');
    if (mutedIcon && playingIcon) {
      if (isPlaying) {
        mutedIcon.classList.add('hidden');
        playingIcon.classList.remove('hidden');
      } else {
        mutedIcon.classList.remove('hidden');
        playingIcon.classList.add('hidden');
      }
    }
  }

  function initAudio() {
    const musicBtn = document.getElementById('musicBtn');
    const music = document.getElementById('music');
    if (!musicBtn || !music) return;

    musicBtn.addEventListener('click', () => {
      if (music.paused) {
        music.play().then(() => updateMusicUI(true)).catch(() => updateMusicUI(false));
      } else {
        music.pause();
        updateMusicUI(false);
      }
    });
  }

  // --- 3. Interactive Scratch Card Canvas ---
  function initScratchCard() {
    const container = document.getElementById('vrScratch');
    if (!container) return;

    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('role', 'button');
      canvas.setAttribute('tabindex', '0');
      canvas.setAttribute('aria-label', 'Scratch to reveal the date');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:5;cursor:crosshair;touch-action:none;border-radius:inherit;transition:opacity 0.8s cubic-bezier(0.22,1,0.36,1),transform 0.8s cubic-bezier(0.22,1,0.36,1);';
      container.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let isDrawing = false;
    let isRevealed = false;
    let totalPixels = 0;
    let moveCount = 0;

    function resizeCanvas() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(dpr, dpr);
      drawFoil(rect.width, rect.height);
      totalPixels = rect.width * rect.height;
    }

    function drawFoil(w, h) {
      // Metallic luxury pearl-gold gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#e8d8be');
      grad.addColorStop(0.35, '#d3b896');
      grad.addColorStop(0.65, '#f4e8d3');
      grad.addColorStop(1, '#caa980');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Shimmer texture lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = -w; i < w + h; i += 18) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
      }

      // Border outline
      ctx.strokeStyle = 'rgba(180, 140, 90, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      // Centered guide text
      ctx.font = '500 11px Cinzel, serif';
      ctx.fillStyle = '#655846';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '0.18em';
      ctx.fillText('✦  SCRATCH TO REVEAL  ✦', w / 2, h / 2);
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function scratch(pos) {
      if (isRevealed) return;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
      ctx.fill();

      moveCount++;
      if (moveCount % 12 === 0) {
        checkClearedPercent();
      }
    }

    function checkClearedPercent() {
      if (isRevealed) return;
      try {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width;
        const h = canvas.height;
        // Sample every 8th pixel
        const imgData = ctx.getImageData(0, 0, w, h).data;
        let cleared = 0;
        const total = (w * h) / 64;
        for (let i = 3; i < imgData.length; i += 64 * 4) {
          if (imgData[i] === 0) cleared++;
        }
        const pct = cleared / total;
        if (pct > 0.42) {
          revealAll();
        }
      } catch (_) {}
    }

    function revealAll() {
      if (isRevealed) return;
      isRevealed = true;
      canvas.style.opacity = '0';
      canvas.style.transform = 'scale(0.96)';
      canvas.style.pointerEvents = 'none';
      setTimeout(() => {
        if (canvas.parentNode) canvas.remove();
      }, 900);
    }

    // Pointer events
    canvas.addEventListener('pointerdown', (e) => {
      isDrawing = true;
      scratch(getPos(e));
    });
    window.addEventListener('pointermove', (e) => {
      if (!isDrawing) return;
      scratch(getPos(e));
    });
    window.addEventListener('pointerup', () => {
      if (isDrawing) {
        isDrawing = false;
        checkClearedPercent();
      }
    });

    window.addEventListener('resize', () => {
      if (!isRevealed) resizeCanvas();
    });

    setTimeout(resizeCanvas, 200);
  }

  // --- 4. Live Event Countdown Timer ---
  function initCountdown() {
    const targetIso = (window.VERONA_CONFIG && window.VERONA_CONFIG.countdown && window.VERONA_CONFIG.countdown.targetIso)
      || "2026-10-18T19:00:00+05:30";
    const targetDate = new Date(targetIso).getTime();

    const elDays = document.querySelector('[data-unit="days"]');
    const elHours = document.querySelector('[data-unit="hours"]');
    const elMinutes = document.querySelector('[data-unit="minutes"]');
    const elSeconds = document.querySelector('[data-unit="seconds"]');

    if (!elDays) return;

    function tick() {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      elDays.textContent = String(d).padStart(2, '0');
      elHours.textContent = String(h).padStart(2, '0');
      elMinutes.textContent = String(m).padStart(2, '0');
      elSeconds.textContent = String(s).padStart(2, '0');
    }

    tick();
    setInterval(tick, 1000);
  }

  // --- 5. Add to Calendar Modal & Links ---
  function initCalendarModal() {
    const btn = document.getElementById('vrCal');
    const modal = document.getElementById('calendarModal');
    const closeBtn = document.getElementById('calClose');
    const linkGoogle = document.getElementById('calGoogle');
    const linkIcs = document.getElementById('calIcs');
    const linkYahoo = document.getElementById('calYahoo');

    if (!btn || !modal) return;

    const eventTitle = "Reception of Kian & Aria";
    const eventDetails = "We warmly request your presence at our wedding reception.";
    const eventLocation = "Jagmandir Island Palace, Udaipur, Rajasthan, India";
    // 18 Oct 2026, 19:00 IST (13:30 UTC) to 22:30 IST (17:00 UTC)
    const startIso = "20261018T133000Z";
    const endIso = "20261018T170000Z";

    if (linkGoogle) {
      linkGoogle.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(eventLocation)}`;
    }

    if (linkYahoo) {
      linkYahoo.href = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(eventTitle)}&st=${startIso}&et=${endIso}&desc=${encodeURIComponent(eventDetails)}&in_loc=${encodeURIComponent(eventLocation)}`;
    }

    if (linkIcs) {
      linkIcs.addEventListener('click', (e) => {
        e.preventDefault();
        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//InviteStory//Mithril Card 5//EN',
          'BEGIN:VEVENT',
          `SUMMARY:${eventTitle}`,
          `DESCRIPTION:${eventDetails}`,
          `LOCATION:${eventLocation}`,
          `DTSTART:${startIso}`,
          `DTEND:${endIso}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kian-aria-reception.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    btn.addEventListener('click', () => {
      modal.classList.add('wc-on');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('wc-on');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('wc-on');
    });
  }

  // --- 6. Scroll Animations ---
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-v], [data-g], [data-hero]');
    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
  }

})();

  if (location.search.includes('mode=fullscreen') || location.hash.includes('fullscreen')) {
    const music = document.getElementById('music');
    if (music) {
      music.muted = false;
      music.volume = 0.8;
      music.play().then(() => updateMusicUI(true)).catch(() => {});
    }
  }

  window.addEventListener('message', function (e) {
    var musicEl = document.getElementById('music');
    if (e.data && (e.data.type === 'INVITESTORY_PLAY_AUDIO' || e.data.type === 'PLAY_AUDIO')) {
      if (musicEl) {
        musicEl.muted = false;
        musicEl.volume = 0.8;
        musicEl.play().then(function() {
          var mutedIcon = document.getElementById('musicIconMuted');
          var playingIcon = document.getElementById('musicIconPlaying');
          if (mutedIcon && playingIcon) {
            mutedIcon.classList.add('hidden');
            playingIcon.classList.remove('hidden');
          }
        }).catch(function(){});
      }
    } else if (e.data && (e.data.type === 'INVITESTORY_PAUSE_AUDIO' || e.data.type === 'PAUSE_AUDIO')) {
      if (musicEl) {
        musicEl.pause();
        var mutedIcon = document.getElementById('musicIconMuted');
        var playingIcon = document.getElementById('musicIconPlaying');
        if (mutedIcon && playingIcon) {
          mutedIcon.classList.remove('hidden');
          playingIcon.classList.add('hidden');
        }
      }
    }
  });
