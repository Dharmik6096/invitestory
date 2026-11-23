// Ever After Bloom - Illustrated Wedding Invitation Controller
// Faithfully matches https://ever-after-bloom.invitestory.in/
(function () {
  'use strict';

  const cfg = window.INVITATION_CONFIG || {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initSealOpening();
    initCountdown();
    initHeroLanterns();
    initCalendar();
    initGalleryLightbox();
    initWishLanterns();
    initWeddingCarScroll();
    initAudio();
  }

  // --- 1. Wax Seal Video Unboxing (7.15s Film Transition) ---
  function initSealOpening() {
    const overlay = document.getElementById('sealOverlay');
    const sealBtn = document.getElementById('sealBtn');
    const sealVideo = document.getElementById('sealVideo');
    const skipBtn = document.getElementById('skipBtn');

    if (!overlay) return;

    let unboxed = false;
    let videoStarted = false;

    // Lock body during seal viewing
    document.body.style.overflow = 'hidden';

    function openInvitation() {
      if (unboxed || videoStarted) return;
      videoStarted = true;

      // Start ambient audio right away on user click
      playAudioIfAvailable();

      // Fade out seal button smoothly (duration: 0.5s)
      if (sealBtn) {
        sealBtn.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        sealBtn.style.opacity = '0';
        sealBtn.style.transform = 'scale(1.02)';
        sealBtn.style.pointerEvents = 'none';
      }

      if (sealVideo) {
        sealVideo.style.opacity = '1';
        sealVideo.currentTime = 0;
        const playPromise = sealVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(function (err) {
            console.log('Video autoplay caught:', err);
            // If video playback fails, finish unboxing gracefully
            finishUnboxing();
          });
        }

        // Live site cuts at currentTime >= 7.15s
        sealVideo.addEventListener('timeupdate', function () {
          if (sealVideo.currentTime >= 7.15) {
            finishUnboxing();
          }
        });

        sealVideo.addEventListener('ended', finishUnboxing);
        sealVideo.addEventListener('error', finishUnboxing);

        // Fallback timer in case video stalls
        setTimeout(finishUnboxing, 7800);
      } else {
        finishUnboxing();
      }
    }

    function finishUnboxing() {
      if (unboxed) return;
      unboxed = true;

      // 1.2s smooth cubic fade matching live React transition
      overlay.style.transition = 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';

      // Ensure hero elements are crisp and visible
      const h1 = document.getElementById('heroNames');
      const divider = document.getElementById('heroDivider');
      if (h1) {
        h1.style.opacity = '1';
        h1.style.filter = 'none';
        h1.style.transform = 'none';
      }
      if (divider) {
        divider.style.opacity = '1';
        divider.style.transform = 'none';
      }

      setTimeout(function () {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      }, 1300);

      playAudioIfAvailable();
    }

    if (sealBtn) {
      sealBtn.addEventListener('click', openInvitation);
      sealBtn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        openInvitation();
      }, { passive: false });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        finishUnboxing();
      });
    }
  }

  // --- 2. Live Countdown Timer ---
  function initCountdown() {
    const elDays = document.getElementById('cdDays');
    const elHours = document.getElementById('cdHours');
    const elMinutes = document.getElementById('cdMinutes');
    const elSeconds = document.getElementById('cdSeconds');

    if (!elDays) return;

    const targetDate = new Date(cfg.dateISO || '2027-02-14T18:30:00+05:30').getTime();

    function update() {
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

    update();
    setInterval(update, 1000);
  }

  // --- 3. Floating Wish Lanterns in Hero ---
  function initHeroLanterns() {
    const container = document.getElementById('heroLanterns');
    if (!container) return;

    const lanternSrc = 'media/lantern.png';
    const positions = [
      { left: 7.5, size: 28, bottom: 6, delay: 0, opacity: 0.7 },
      { left: 19.5, size: 30, bottom: 28, delay: 1.2, opacity: 0.8 },
      { left: 31.5, size: 32, bottom: 50, delay: 2.4, opacity: 0.75 },
      { left: 43.5, size: 34, bottom: 8, delay: 0.8, opacity: 0.85 },
      { left: 55.5, size: 32, bottom: 32, delay: 1.8, opacity: 0.7 },
      { left: 67.5, size: 36, bottom: 56, delay: 2.1, opacity: 0.8 },
      { left: 79.5, size: 35, bottom: 10, delay: 0.5, opacity: 0.85 },
      { left: 88.5, size: 29, bottom: 38, delay: 1.5, opacity: 0.65 }
    ];

    container.innerHTML = '';
    positions.forEach(function (pos) {
      const img = document.createElement('img');
      img.src = lanternSrc;
      img.alt = '';
      img.className = 'absolute will-change-transform float-drift';
      img.style.left = pos.left + '%';
      img.style.width = pos.size + 'px';
      img.style.bottom = pos.bottom + '%';
      img.style.opacity = pos.opacity;
      img.style.filter = 'drop-shadow(0 0 16px rgba(212, 175, 55, 0.55))';
      img.style.animationDelay = pos.delay + 's';
      img.style.pointerEvents = 'none';
      container.appendChild(img);
    });
  }

  // --- 4. Add to Calendar (ICS) ---
  function initCalendar() {
    const btn = document.getElementById('btnAddToCalendar');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      // Allow default download behavior or create fallback
      if (!btn.getAttribute('download')) {
        e.preventDefault();
        const icsData = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//InviteStory//Ever After Bloom//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          'UID:aarohi-ishaan-wedding-2027@invitestory.in',
          'DTSTAMP:20261119T120000Z',
          'DTSTART:20270214T130000Z',
          'DTEND:20270214T180000Z',
          'SUMMARY:Aarohi & Ishaan — Wedding Celebration',
          'DESCRIPTION:Join Aarohi and Ishaan on Sunday, 14 February 2027 at Amrit Mahal Palace, Jaipur.',
          'LOCATION:Amrit Mahal Palace, Jal Marg, Old City, Jaipur, Rajasthan',
          'STATUS:CONFIRMED',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Aarohi-Ishaan-Wedding.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }
    });
  }

  // --- 5. Interactive Photo Album Lightbox ---
  function initGalleryLightbox() {
    const lightbox = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    const cards = document.querySelectorAll('.gallery-card');

    if (!lightbox) return;

    function openLightbox(src, alt, caption) {
      lightboxImg.src = src;
      lightboxImg.alt = alt;
      lightboxCaption.textContent = caption || alt || '';
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        const img = card.querySelector('img');
        const caption = card.getAttribute('data-caption') || (img ? img.alt : '');
        if (img) openLightbox(img.src, img.alt, caption);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('eab-lightbox')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // --- 6. Release a Wish Lantern (Exact Blessings from Live Site) ---
  function initWishLanterns() {
    const btn = document.getElementById('btnReleaseLantern');
    const container = document.getElementById('wishesContainer');
    if (!btn || !container) return;

    const blessings = [
      'May your evenings always be unhurried.',
      'May the tea be hot and the arguments short.',
      'May you keep choosing each other.',
      'May your house be loud with the right people.',
      'May the monsoon always find you together.'
    ];

    btn.addEventListener('click', function () {
      const lantern = document.createElement('div');
      const randomLeft = 18 + Math.random() * 64; // 18% to 82%
      const blessing = blessings[Math.floor(Math.random() * blessings.length)];

      lantern.className = 'pointer-events-none absolute bottom-12 z-20 flex w-48 flex-col items-center text-center wish-lantern-anim';
      lantern.style.left = randomLeft + '%';

      lantern.innerHTML = [
        '<img src="media/lantern.png" alt="" width="52" height="68" class="w-10 drop-shadow-[0_0_18px_rgba(212,175,55,0.85)]" />',
        '<span class="mt-2 font-script text-sm text-primary italic font-semibold px-2 py-1 rounded bg-[color-mix(in_oklab,var(--ivory)_85%,transparent)] backdrop-blur shadow-sm">' + blessing + '</span>'
      ].join('');

      container.appendChild(lantern);

      setTimeout(function () {
        if (lantern.parentNode) lantern.parentNode.removeChild(lantern);
      }, 7600);
    });
  }

  // --- 7. Map Wedding Car Entrance on Scroll ---
  function initWeddingCarScroll() {
    const car = document.getElementById('weddingCar');
    if (!car) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            car.style.transform = 'translateX(24px)';
            car.style.opacity = '1';
            observer.unobserve(car);
          }
        });
      }, { threshold: 0.2 });
      observer.observe(car);
    } else {
      car.style.transform = 'translateX(24px)';
      car.style.opacity = '1';
    }
  }

  // --- 8. Ambient Music Player ---
  let audioEl = null;
  let isPlaying = false;

  function initAudio() {
    audioEl = document.getElementById('bgAudio');
    const toggleBtn = document.getElementById('audioToggle');
    if (!audioEl || !toggleBtn) return;

    toggleBtn.addEventListener('click', function () {
      if (isPlaying) {
        audioEl.pause();
        isPlaying = false;
        toggleBtn.classList.remove('playing');
        toggleBtn.querySelector('.audio-text').textContent = 'Play Music';
      } else {
        audioEl.play().then(function () {
          isPlaying = true;
          toggleBtn.classList.add('playing');
          toggleBtn.querySelector('.audio-text').textContent = 'Mute';
        }).catch(function (e) {
          console.log('Audio autoplay prevented:', e);
        });
      }
    });
  }

  function playAudioIfAvailable() {
    if (!audioEl) audioEl = document.getElementById('bgAudio');
    if (!audioEl || isPlaying) return;

    const toggleBtn = document.getElementById('audioToggle');
    audioEl.play().then(function () {
      isPlaying = true;
      if (toggleBtn) {
        toggleBtn.classList.add('playing');
        toggleBtn.querySelector('.audio-text').textContent = 'Mute';
      }
    }).catch(function () {
      // Silent catch if browser requires manual click on audio button
    });
  }

})();
