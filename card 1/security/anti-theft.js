/**
 * Aamantran Studio - Enhanced Anti-Theft & Inspection Protection Shield
 * Actively prevents DevTools inspection, source viewing, hotlinking, and media downloading.
 */
(function () {
  'use strict';

  // 1. Disable Context Menu (Right Click)
  document.addEventListener('contextmenu', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    e.stopPropagation();
    showSecurityToast('🔒 Content Protected - Right-click inspection is disabled.');
    return false;
  }, { capture: true });

  // 2. Disable DevTools & Source Keyboard Shortcuts
  document.addEventListener('keydown', function (e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
    const key = (e.key || '').toLowerCase();
    const code = e.keyCode || e.which;

    // F12
    if (e.key === 'F12' || code === 123) {
      blockAction(e, '🔒 Developer Tools (F12) is disabled.');
      triggerDebuggerTrap();
      return false;
    }

    // Ctrl+Shift+I / J / C (Inspect / Console / Element Picker)
    if (ctrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || code === 73 || code === 74 || code === 67)) {
      blockAction(e, '🔒 Developer Inspection tools are blocked.');
      triggerDebuggerTrap();
      return false;
    }

    // Ctrl+U (View Source)
    if (ctrlOrCmd && (key === 'u' || code === 85)) {
      blockAction(e, '🔒 Viewing page source is disabled.');
      return false;
    }

    // Ctrl+S (Save Webpage)
    if (ctrlOrCmd && (key === 's' || code === 83)) {
      blockAction(e, '🔒 Saving offline template files is disabled.');
      return false;
    }

    // Ctrl+P (Print Page / Save PDF)
    if (ctrlOrCmd && (key === 'p' || code === 80)) {
      blockAction(e, '🔒 Printing / PDF scraping is disabled.');
      return false;
    }
  }, { capture: true });

  function blockAction(e, msg) {
    e.preventDefault();
    e.stopPropagation();
    showSecurityToast(msg);
  }

  // 3. Prevent dragging images, videos, audio, SVGs
  document.addEventListener('dragstart', function (e) {
    const tag = (e.target.tagName || '').toUpperCase();
    if (tag === 'IMG' || tag === 'VIDEO' || tag === 'AUDIO' || tag === 'SVG') {
      e.preventDefault();
      return false;
    }
  }, { capture: true });

  // 4. Secure all media elements (disable download controls, PiP)
  function secureMediaElements() {
    const elements = document.querySelectorAll('video, audio');
    elements.forEach(function (el) {
      el.setAttribute('controlsList', 'nodownload noplaybackrate');
      el.setAttribute('disablePictureInPicture', 'true');
      el.oncontextmenu = function () { return false; };
    });
  }

  // 5. Anti-DevTools Debugger Trap
  // Uses timing detection and conditional debugger freeze
  let devToolsDetected = false;
  function triggerDebuggerTrap() {
    try {
      const startTime = performance.now();
      // Debugger freeze if devtools is open
      (function() {
        var dummy = new Function('debugger');
        dummy();
      })();
      const elapsed = performance.now() - startTime;
      if (elapsed > 100) {
        devToolsDetected = true;
        document.body.style.filter = 'blur(10px)';
        showSecurityToast('⚠️ DevTools detected. Execution paused for security.');
      }
    } catch (err) {}
  }

  // Window dimension threshold monitor
  setInterval(function () {
    const threshold = 160;
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > threshold || heightDiff > threshold) {
      triggerDebuggerTrap();
    } else if (devToolsDetected) {
      devToolsDetected = false;
      document.body.style.filter = 'none';
    }
  }, 1200);

  // 6. Security Notification Toast
  let toastTimeout = null;
  function showSecurityToast(msg) {
    let toast = document.getElementById('aamantran-sec-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'aamantran-sec-toast';
      toast.style.cssText = [
        'position: fixed',
        'bottom: 24px',
        'left: 50%',
        'transform: translateX(-50%) translateY(20px)',
        'background: #1e1b24',
        'color: #f7e6d0',
        'border: 1px solid #d4af37',
        'padding: 11px 24px',
        'border-radius: 30px',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'font-size: 13px',
        'font-weight: 600',
        'box-shadow: 0 12px 35px rgba(0,0,0,0.5)',
        'z-index: 99999999',
        'pointer-events: none',
        'opacity: 0',
        'transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      ].join(';');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2500);
  }

  // Auto-run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', secureMediaElements);
  } else {
    secureMediaElements();
  }

  window.AamantranSecurity = {
    triggerTrap: triggerDebuggerTrap,
    toast: showSecurityToast
  };
})();
