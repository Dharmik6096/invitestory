/* Homepage composition only. Product selection, totals and checkout remain in the shared flow. */
function setupHomeCollectionCards(container) {
  if (!container) return;
  const examples = [101, 102, 103];
  container.querySelectorAll('.pricing-card').forEach((card, index) => {
    if (card.querySelector('.atelier-collection-art')) return;
    const item = (typeof TEMPLATE_DATABASE !== 'undefined') ? TEMPLATE_DATABASE.find(design => design.id === examples[index]) : null;
    if (!item) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'atelier-collection-art';
    button.setAttribute('aria-label', `Preview ${typeof packageName === 'function' ? packageName(item.tier) : item.name} with ${item.name}`);
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = `${item.name} invitation design`;
    image.loading = 'lazy';
    image.width = 230;
    image.height = 280;
    button.appendChild(image);
    button.addEventListener('click', () => {
      if (typeof openPreview === 'function') openPreview(item.id);
    });
    card.prepend(button);
  });
}

function setupHomeShowroom() {
  if (!document.body.classList.contains('atelier-home')) return;
  const floatingWhatsApp = document.getElementById('floating-whatsapp');
  if (floatingWhatsApp) {
    let promptSeen = false;
    try { promptSeen = sessionStorage.getItem('invitestory-whatsapp-prompt-seen') === '1'; } catch (_) {}
    // Starts collapsed so it never covers the hero's price and buttons. Expand once,
    // after the visitor scrolls past the hero, then collapse again.
    const hero = document.getElementById('invitation-archive');
    const expandOnce = () => {
      floatingWhatsApp.classList.remove('is-collapsed');
      try { sessionStorage.setItem('invitestory-whatsapp-prompt-seen', '1'); } catch (_) {}
      window.setTimeout(() => floatingWhatsApp.classList.add('is-collapsed'), 6500);
    };
    if (!promptSeen && hero && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => !entry.isIntersecting && entry.boundingClientRect.bottom < 0)) { observer.disconnect(); expandOnce(); }
      });
      observer.observe(hero);
    }
  }

  const mobileLayout = window.matchMedia('(max-width: 991px)');
  const setCurrencyLabels = () => {
    for (const code of ['INR', 'USD']) {
      const button = document.getElementById(`currency-${code.toLowerCase()}`);
      if (!button) continue;
      const fullLabel = code === 'INR' ? 'INR (₹)' : 'USD ($)';
      button.setAttribute('aria-label', fullLabel);
      button.textContent = fullLabel;
    }
  };
  setCurrencyLabels();
  mobileLayout.addEventListener('change', setCurrencyLabels);

  const currencySwitch = document.querySelector('.currency-switch-container');
  const adminBtn = document.getElementById('admin-header-trigger');
  const headerActions = document.querySelector('.header-actions');
  const nav = document.getElementById('home-navigation');
  let mobileDrawerControls = document.getElementById('mobile-nav-controls');
  
  if (!mobileDrawerControls && nav) {
    mobileDrawerControls = document.createElement('div');
    mobileDrawerControls.id = 'mobile-nav-controls';
    mobileDrawerControls.className = 'mobile-nav-controls';
    nav.appendChild(mobileDrawerControls);
  }

  const placeControls = () => {
    if (mobileLayout.matches) {
      if (mobileDrawerControls) {
        if (currencySwitch && currencySwitch.parentNode !== mobileDrawerControls) {
          mobileDrawerControls.appendChild(currencySwitch);
        }
        if (adminBtn && adminBtn.parentNode !== mobileDrawerControls) {
          mobileDrawerControls.appendChild(adminBtn);
        }
      }
    } else {
      if (headerActions) {
        if (adminBtn && adminBtn.parentNode !== headerActions) {
          headerActions.prepend(adminBtn);
        }
        if (currencySwitch && currencySwitch.parentNode !== headerActions) {
          if (adminBtn && adminBtn.nextSibling) {
            headerActions.insertBefore(currencySwitch, adminBtn.nextSibling);
          } else {
            headerActions.prepend(currencySwitch);
          }
        }
      }
    }
  };
  placeControls();
  mobileLayout.addEventListener('change', placeControls);

  const menu = document.querySelector('.atelier-menu-toggle');
  if (menu && nav) {
    const closeMenu = () => {
      menu.setAttribute('aria-expanded', 'false');
      const span = menu.querySelector('span');
      if (span) span.textContent = '+';
      nav.classList.remove('is-open');
    };
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      const span = menu.querySelector('span');
      if (span) span.textContent = open ? '✕' : '+';
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => { 
      if (event.target.closest('a')) closeMenu(); 
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !menu.contains(event.target) && nav.classList.contains('is-open')) {
        closeMenu();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menu.focus();
      }
    });
  }

  const openingVideo = document.getElementById('hero-opening-video');
  if (openingVideo) {
    const stillOnly = window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData;
    const previewModal = document.getElementById('preview-modal');
    let inView = false;
    const syncPlayback = () => {
      const previewOpen = previewModal?.classList.contains('is-open');
      if (inView && !stillOnly && !document.hidden && !previewOpen) openingVideo.play().catch(() => {});
      else openingVideo.pause();
    };
    document.addEventListener('visibilitychange', syncPlayback);
    window.addEventListener('pagehide', () => openingVideo.pause());
    if (previewModal) new MutationObserver(syncPlayback).observe(previewModal, { attributes: true, attributeFilter: ['class'] });
    new IntersectionObserver(entries => {
      inView = entries[entries.length - 1].isIntersecting;
      syncPlayback();
    }, { threshold: 0.4 }).observe(openingVideo);
  }
  setupHomeCollectionCards(document.getElementById('pricing'));
}
document.addEventListener('DOMContentLoaded', setupHomeShowroom);
