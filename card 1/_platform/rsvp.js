// Balcony platform RSVP - the shared, template-agnostic guest RSVP section.
//
// RSVP is a common platform feature: the host defines RSVP events (Mehendi,
// Haldi, …) from their dashboard, and this one module renders them + collects
// responses identically on EVERY template. A template opts in with a single
// mount point:  <div id="balcony-rsvp"></div>  and includes this script.
(function () {
  var mount = document.getElementById('balcony-rsvp');
  if (!mount) return; // template didn't opt in

  var STATUS_LABEL = { attending: 'Yes', maybe: 'Maybe', 'not-attending': 'No' };

  var GLYPH = {
    name: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14Z"/>',
    contact: '<path d="M6.6 3h3l1.5 4-2.2 1.6a12 12 0 0 0 5.5 5.5L16 11.9l4 1.5v3A2.5 2.5 0 0 1 17.5 19 14.5 14.5 0 0 1 5 6.5 2.5 2.5 0 0 1 6.6 3Z"/>',
    schedule: '<path d="M7 2v2M17 2v2M3.5 8h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 21H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    message: '<path d="M3.5 6.5h17v11h-17z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m3.5 7 8.5 6 8.5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    heart: '<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z"/>',
    day: '<path d="M7 2v2M17 2v2M3.5 8h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 21H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  };

  var MIN_PEOPLE = 1;
  var MAX_PEOPLE = 10;

  var DEFAULT_PAYLOAD = {
    event: {
      id: 1,
      title: "Siddhant & Aayushi",
      rsvpAccent: "#4a0e2e",
      rsvpEvents: [
        { id: "e1", key: "1", name: "Mandap Muhurat", date: "2026-11-28" },
        { id: "e2", key: "2", name: "Jaan Prasthan / Baraat", date: "2026-11-29" },
        { id: "e3", key: "3", name: "Hasta Melap (Wedding Ceremony)", date: "2026-11-29" },
        { id: "e4", key: "4", name: "Wedding Dinner & Reception", date: "2026-11-29" }
      ]
    },
    guest: null
  };

  function decodePayload() {
    var m = /[#&]platform=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!m) return DEFAULT_PAYLOAD;
    try {
      var b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b64)))) || DEFAULT_PAYLOAD;
    } catch (_) {
      return DEFAULT_PAYLOAD;
    }
  }

  function peopleHtml(value, dis) {
    return '<div class="brsvp-stepper">' +
      '<button type="button" class="brsvp-stepper__btn" data-step="-1" aria-label="One person fewer"' + dis + '>&minus;</button>' +
      '<input type="number" class="brsvp-stepper__value" inputmode="numeric" min="' + MIN_PEOPLE + '" max="' + MAX_PEOPLE + '" value="' + value + '"' + dis + '>' +
      '<button type="button" class="brsvp-stepper__btn" data-step="1" aria-label="One person more"' + dis + '>+</button>' +
      '</div>';
  }

  var params = new URLSearchParams(location.search);
  var mode = params.has('edit') ? 'edit' : params.has('preview') ? 'preview' : 'view';
  var payload = decodePayload();

  var accent = readAccent(payload);
  if (accent) mount.style.setProperty('--brsvp-accent-set', accent);

  var events = (payload && payload.event && payload.event.rsvpEvents) || [];
  var canManage = !!(payload && payload.event && payload.event.rsvpManageable);
  var manageEvents = (payload && payload.event && payload.event.rsvpManageEvents) || events;
  var autoManaged = !!(payload && payload.event && payload.event.rsvpAutoManaged);

  if (mode === 'edit') {
    if (canManage) { if (autoManaged) renderAutoEdit(events); else renderHostEdit(manageEvents); }
    else renderNote(events);
    return;
  }

  var guest = (payload && payload.guest) || null;
  var toName = (params.get('to') || params.get('guest') || params.get('name') || '').trim();

  if (events.length) {
    renderForm(events, (guest && guest.rsvpResponses) || {}, (guest && guest.rsvpMessage) || '', {
      guestName: toName,
      needsName: true,
      needsContact: false,
      contact: (guest && guest.rsvpContact) || '',
      preview: false,
    });
  } else if (!payload) {
    renderPreview();
  } else {
    mount.hidden = true;
  }

  // ---- helpers -------------------------------------------------------------

  function renderPreview() {
    var FALLBACK = [
      { id: 'p1', key: '1', name: 'Mandap Muhurat', date: '2026-11-28' },
      { id: 'p2', key: '2', name: 'Jaan Prasthan / Baraat', date: '2026-11-29' },
      { id: 'p3', key: '3', name: 'Hasta Melap (Wedding Ceremony)', date: '2026-11-29' },
      { id: 'p4', key: '4', name: 'Wedding Dinner & Reception', date: '2026-11-29' },
    ];

    function paint(list) {
      var evs = (list && list.length ? list : FALLBACK).map(function (e, i) {
        return { id: e.id || ('p' + i), key: e.key || null, name: e.name, date: e.date || null };
      });

      renderForm(evs, {}, '', {
        guestName: toName,
        needsName: true,
        needsContact: false,
        contact: '',
        preview: false,
      });
    }

    var answered = false;
    document.addEventListener('balcony:rsvp-events-changed', function (ev) {
      answered = true;
      paint((ev.detail && ev.detail.events) || []);
    });
    document.dispatchEvent(new CustomEvent('balcony:rsvp-events-request'));
    if (!answered) paint(null);
  }

  function readAccent(p) {
    var v = p && p.event && p.event.rsvpAccent;
    return typeof v === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()) ? v.trim() : null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function renderNote(evs) {
    var list = evs.length
      ? '<ul class="brsvp-note__list">' + evs.map(function (e) {
        return '<li>' + esc(e.name) + (e.date ? ' <span>· ' + esc(fmtDate(e.date)) + '</span>' : '') + '</li>';
      }).join('') + '</ul>'
      : '<p class="brsvp-note__empty">No RSVP events yet - add them from your dashboard’s RSVP page.</p>';
    mount.innerHTML =
      '<div class="brsvp brsvp-note">' +
      headerHtml('') +
      '<p class="brsvp-note__lead">Guests will reply to these events. Manage them from your RSVP dashboard.</p>' +
      list + '</div>';
  }

  function renderAutoEdit(evs) {
    function paint(list) {
      var rows = list.map(function (e) {
        return '<div class="brsvp-event">' +
          '<div class="brsvp-event__head">' +
          '<span class="brsvp-event__name">' + esc(e.name) + '</span>' +
          (e.date ? '<span class="brsvp-event__date">' + glyph('day', 'brsvp-event__cal') + esc(fmtDate(e.date)) + '</span>' : '') +
          '</div>' +
          '<div class="brsvp-opts">' +
          ['attending', 'maybe', 'not-attending'].map(function (st) {
            return '<label class="brsvp-opt"><input type="radio" name="s-auto-' + esc(e.key || e.id) + '" value="' + st + '" disabled><span>' + STATUS_LABEL[st] + '</span></label>';
          }).join('') +
          '</div></div>';
      }).join('') || '<p class="brsvp-note__empty">No events included yet - turn one on above.</p>';

      mount.innerHTML =
        '<div class="brsvp brsvp-host">' +
        headerHtml('') +
        '<p class="brsvp-host__lead">This is what your guests see. It updates automatically from the event schedule above.</p>' +
        '<div class="brsvp-host__preview">' + identityHtml(true, true, '', ' disabled', '') + '</div>' +
        '<div class="brsvp-headcount brsvp-host__preview">' +
        '<span class="brsvp-headcount__label">How many of you are coming?</span>' +
        peopleHtml(MIN_PEOPLE, ' disabled') +
        '<span class="brsvp-headcount__hint">Counts for every event a guest says Yes or Maybe to, below. Up to ' + MAX_PEOPLE + ' people.</span></div>' +
        '<div class="brsvp-events">' + rows + '</div>' +
        '<div class="brsvp-host__preview">' +
        fieldHtml('message',
          '<textarea class="brsvp-input brsvp-message__box" rows="3" aria-label="Message or wishes for the couple" placeholder="Leave the couple a wish (optional)" disabled></textarea>') +
        '</div>' +
        '</div>';
    }

    paint(evs);
    document.addEventListener('balcony:rsvp-events-changed', function (ev) {
      paint((ev.detail && ev.detail.events) || []);
    });
    document.dispatchEvent(new CustomEvent('balcony:rsvp-events-request'));
  }

  function renderHostEdit(evs) {
    mount.innerHTML =
      '<div class="brsvp brsvp-host">' +
      headerHtml('') +
      '<p class="brsvp-host__lead">This is what your guests see. Edit each event’s name and date.</p>' +
      '<div class="brsvp-host__preview">' + identityHtml(true, true, '', ' disabled', '') + '</div>' +
      '<div class="brsvp-headcount brsvp-host__preview">' +
      '<span class="brsvp-headcount__label">How many of you are coming?</span>' +
      peopleHtml(MIN_PEOPLE, ' disabled') +
      '<span class="brsvp-headcount__hint">Counts for every event a guest says Yes or Maybe to, below. Up to ' + MAX_PEOPLE + ' people.</span></div>' +
      '<div class="brsvp-events"></div>' +
      '<div class="brsvp-host__preview">' +
      fieldHtml('message',
        '<textarea class="brsvp-input brsvp-message__box" rows="3" aria-label="Message or wishes for the couple" placeholder="Leave the couple a wish (optional)" disabled></textarea>') +
      '</div>' +
      '</div>';

    var eventsEl = mount.querySelector('.brsvp-events');
    var pending = {};

    evs.forEach(function (e) {
      eventsEl.appendChild(eventColumn({ id: e.id, name: e.name, date: e.date || null }));
    });

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'brsvp-host__add';
    addBtn.setAttribute('aria-label', 'Add event');
    addBtn.innerHTML = '<span class="brsvp-host__plus" aria-hidden="true">+</span><span>Add event</span>';
    addBtn.addEventListener('click', function () {
      var col = eventColumn({ id: null, name: '', date: null });
      eventsEl.insertBefore(col, addBtn);
      col.querySelector('.brsvp-host__name').focus();
    });
    eventsEl.appendChild(addBtn);

    window.addEventListener('message', function (ev) {
      if (ev.source !== window.parent) return;
      var m = ev.data;
      if (!m || m.type !== 'balcony:rsvp-added' || !pending[m.tempId]) return;
      pending[m.tempId].id = m.id;
      var col = eventsEl.querySelector('[data-tempid="' + m.tempId + '"]');
      if (col) { col.dataset.id = m.id; col.removeAttribute('data-tempid'); }
      delete pending[m.tempId];
    });

    function eventColumn(e) {
      var col = document.createElement('div');
      col.className = 'brsvp-event brsvp-host__event';
      if (e.id) col.dataset.id = e.id;
      var gid = e.id || ('n' + Math.random().toString(36).slice(2, 7));
      col.innerHTML =
        '<div class="brsvp-event__head brsvp-host__head">' +
        '<button type="button" class="brsvp-host__del" title="Remove event" aria-label="Remove event">×</button>' +
        '<input class="brsvp-host__name" type="text" maxlength="120" placeholder="Event name" value="' + esc(e.name || '') + '">' +
        '<input class="brsvp-host__date" type="date" value="' + esc(e.date || '') + '">' +
        '</div>' +
        '<div class="brsvp-opts">' +
        ['attending', 'maybe', 'not-attending'].map(function (st) {
          return '<label class="brsvp-opt"><input type="radio" name="s-' + gid + '" value="' + st + '" disabled><span>' + STATUS_LABEL[st] + '</span></label>';
        }).join('') +
        '</div>';

      var nameEl = col.querySelector('.brsvp-host__name');
      var dateEl = col.querySelector('.brsvp-host__date');

      function commit() {
        var name = nameEl.value.trim();
        var date = dateEl.value || null;
        if (!e.id) {
          if (!name || col.dataset.tempid) return;
          e.name = name; e.date = date;
          var tempId = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
          col.dataset.tempid = tempId;
          pending[tempId] = e;
          window.parent.postMessage({ type: 'balcony:rsvp-add', name: name, date: date, tempId: tempId }, '*');
        } else {
          if (!name) { nameEl.value = e.name; return; }
          if (name !== e.name || date !== e.date) {
            e.name = name; e.date = date;
            window.parent.postMessage({ type: 'balcony:rsvp-update', id: e.id, name: name, date: date, enabled: true }, '*');
          }
        }
      }

      nameEl.addEventListener('change', commit);
      dateEl.addEventListener('change', commit);
      nameEl.addEventListener('blur', function () {
        if (!e.id && !col.dataset.tempid && !nameEl.value.trim()) col.remove();
      });

      col.querySelector('.brsvp-host__del').addEventListener('click', function () {
        if (e.id) {
          if (!window.confirm('Delete “' + (e.name || 'this event') + '” and all its responses?')) return;
          window.parent.postMessage({ type: 'balcony:rsvp-delete', id: e.id }, '*');
        }
        col.remove();
      });

      return col;
    }
  }

  // ---- Chrome ---------------------------------------------------------------

  function glyph(key, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + (GLYPH[key] || '') + '</svg>';
  }

  function iconSlot(key) {
    return '<span class="brsvp-ico" aria-hidden="true">' +
      glyph(key, 'brsvp-ico__svg') + '</span>';
  }

  function flourish(cls) {
    return '<svg class="' + cls + '" viewBox="0 0 48 12" fill="none" aria-hidden="true">' +
      '<path d="M2 6c8-5 14 5 22 0M24 6c8-5 14 5 22 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' +
      '<circle cx="24" cy="6" r="1.6" fill="currentColor"/></svg>';
  }

  function headerHtml(lead) {
    return '<div class="brsvp__head">' +
      '<div class="brsvp__title">' + flourish('brsvp__title-mark') +
      '<span class="brsvp__title-text">Your Presence Matters</span>' + flourish('brsvp__title-mark brsvp__title-mark--flip') + '</div>' +
      (lead ? '<p class="brsvp__lead">' + lead + '</p>' : '') +
      glyph('heart', 'brsvp__head-heart') +
      '</div>';
  }

  function sectionHeadHtml(title, sub) {
    return '<div class="brsvp-section">' + iconSlot('schedule') +
      '<div><span class="brsvp-section__title">' + title + '</span>' +
      (sub ? '<span class="brsvp-section__sub">' + sub + '</span>' : '') +
      '</div></div>';
  }

  function fieldHtml(icon, control, note) {
    return '<div class="brsvp-field">' +
      '<div class="brsvp-field__row">' + iconSlot(icon) + control + '</div>' +
      (note ? '<span class="brsvp-field__hint">' + note + '</span>' : '') +
      '</div>';
  }

  function identityHtml(needsName, needsContact, contact, dis, defaultName) {
    if (!needsName && !needsContact) return '';

    return '<div class="brsvp-identity">' +
      (needsName
        ? fieldHtml('name',
          '<input type="text" class="brsvp-input brsvp-identity__name" maxlength="255" autocomplete="name" aria-label="Your name" placeholder="Your name or Family name" value="' + esc(defaultName || '') + '"' + dis + '>')
        : '') +
      (needsContact
        ? fieldHtml('contact',
          '<input type="tel" class="brsvp-input brsvp-identity__contact" maxlength="20" inputmode="numeric" autocomplete="tel" aria-label="Contact number" placeholder="10-digit mobile number (optional)" value="' + esc(contact || '') + '"' + dis + '>',
          'Optional: Phone number for updates')
        : '') +
      '</div>';
  }

  function renderForm(evs, saved, savedMessage, who) {
    var initialCount = 1;
    evs.forEach(function (e) {
      var mine = saved[e.id] || {};
      if ((mine.status === 'attending' || mine.status === 'maybe') && mine.guestCount) {
        initialCount = mine.guestCount;
      }
    });

    var rows = evs.map(function (e) {
      var mine = saved[e.id] || {};
      // Default to "attending" (Yes) if unselected
      var cur = mine.status || 'attending';
      var opts = ['attending', 'maybe', 'not-attending'].map(function (st) {
        var on = cur === st ? ' checked' : '';
        return '<label class="brsvp-opt"><input type="radio" name="s-' + e.id + '" value="' + st + '"' + on + '>' +
          '<span>' + STATUS_LABEL[st] + '</span></label>';
      }).join('');

      return '<div class="brsvp-event" data-id="' + e.id + '">' +
        '<div class="brsvp-event__head">' +
        '<span class="brsvp-event__name">' + esc(e.name) + '</span>' +
        (e.date ? '<span class="brsvp-event__date">' + glyph('day', 'brsvp-event__cal') + esc(fmtDate(e.date)) + '</span>' : '') +
        '</div>' +
        '<div class="brsvp-opts">' + opts + '</div>' +
        '</div>';
    }).join('');

    mount.innerHTML =
      '<div class="brsvp">' +
      headerHtml('Let us know so we can make the arrangements just right.') +
      '<form class="brsvp__form">' +
      identityHtml(who.needsName, who.needsContact, who.contact, '', who.guestName) +
      '<div class="brsvp-headcount">' +
      '<span class="brsvp-headcount__label">How many of you are coming?</span>' +
      peopleHtml(initialCount, '') +
      '<span class="brsvp-headcount__hint">Counts for every event you say Yes or Maybe to, below. Up to ' + MAX_PEOPLE + ' people.</span>' +
      '</div>' +
      '<div class="brsvp-rule">' + flourish('brsvp-rule__mark') + '</div>' +
      sectionHeadHtml('Event Schedule', 'Let us know which events you’ll be joining.') +
      '<div class="brsvp-events">' + rows + '</div>' +
      fieldHtml('message',
        '<textarea class="brsvp-input brsvp-message__box" rows="3" maxlength="1000" aria-label="Message or wishes for the couple" placeholder="Leave the couple a wish (optional)">' + esc(savedMessage || '') + '</textarea>') +
      '<p class="brsvp__error" hidden></p>' +
      '<button type="submit" class="brsvp__submit">' + glyph('heart', 'brsvp__submit-heart') + 'Send RSVP</button>' +
      '<p class="brsvp__footnote">Thank you! Your response means a lot to us.</p>' +
      '</form>' +
      '<div class="brsvp__result" hidden><div class="brsvp__thanks"></div>' +
      '<button type="button" class="brsvp__change">✏️ Change or Update Response</button></div>' +
      '</div>';

    var form = mount.querySelector('.brsvp__form');
    var result = mount.querySelector('.brsvp__result');
    var errEl = mount.querySelector('.brsvp__error');
    var headcountEl = mount.querySelector('.brsvp-headcount');
    var peopleEl = headcountEl.querySelector('.brsvp-stepper__value');

    function setPeople(n) {
      n = Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, parseInt(n, 10) || MIN_PEOPLE));
      peopleEl.value = n;
      Array.prototype.forEach.call(headcountEl.querySelectorAll('.brsvp-stepper__btn'), function (btn) {
        var next = n + parseInt(btn.dataset.step, 10);
        btn.disabled = next < MIN_PEOPLE || next > MAX_PEOPLE;
      });
      return n;
    }

    headcountEl.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.brsvp-stepper__btn');
      if (btn) setPeople(parseInt(peopleEl.value, 10) + parseInt(btn.dataset.step, 10));
    });
    peopleEl.addEventListener('change', function () { setPeople(peopleEl.value); });
    setPeople(peopleEl.value);

    form.addEventListener('change', function (ev) {
      if (!ev.target.closest('input[type="radio"]')) return;
      errEl.hidden = true;
    });

    Array.prototype.forEach.call(form.querySelectorAll('.brsvp-opt'), function (label) {
      var radio = label.querySelector('input[type="radio"]');
      if (!radio) return;
      label.addEventListener('pointerdown', function () { radio._wasChecked = radio.checked; });
      radio.addEventListener('click', function () {
        if (radio._wasChecked) {
          radio.checked = false;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    var nameEl = form.querySelector('.brsvp-identity__name');
    var contactEl = form.querySelector('.brsvp-identity__contact');

    function fail(msg, focusEl) {
      errEl.textContent = msg;
      errEl.hidden = false;
      if (focusEl) focusEl.focus();
    }

    form.addEventListener('input', function (ev) {
      if (ev.target === nameEl || ev.target === contactEl) errEl.hidden = true;
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var enteredName = nameEl ? nameEl.value.trim() : '';
      var finalGuestName = enteredName || who.guestName || 'Guest & Family';

      // Ensure every ceremony has a selection; default unselected to 'attending'
      evs.forEach(function (e) {
        var checked = form.querySelector('input[name="s-' + e.id + '"]:checked');
        if (!checked) {
          var yesRadio = form.querySelector('input[name="s-' + e.id + '"][value="attending"]');
          if (yesRadio) yesRadio.checked = true;
        }
      });

      var count = setPeople(peopleEl.value);

      var responses = evs.map(function (e) {
        var checked = form.querySelector('input[name="s-' + e.id + '"]:checked');
        var val = checked ? checked.value : 'attending';
        var isGoing = val === 'attending' || val === 'maybe';
        return { rsvpEventId: e.id, name: e.name, date: e.date, status: val, guestCount: isGoing ? count : null };
      });

      var messageEl = form.querySelector('.brsvp-message__box');
      var message = messageEl ? messageEl.value.trim() : '';
      var contact = contactEl ? contactEl.value.replace(/\D+/g, '') : '';

      // Save locally to localStorage so it persists on reload
      try {
        var rsvpRecord = {
          name: finalGuestName,
          contact: contact,
          guestCount: count,
          message: message,
          responses: responses,
          date: new Date().toISOString()
        };
        var stored = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
        stored.push(rsvpRecord);
        localStorage.setItem('wedding_rsvps', JSON.stringify(stored));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      // Hand off to parent page via postMessage bridge
      try {
        window.parent.postMessage({
          type: 'balcony:rsvp',
          name: finalGuestName,
          contact: contact,
          guestCount: count,
          responses: responses,
          message: message,
        }, '*');
      } catch (_) {}

      showResult(responses, finalGuestName, message, count);
    });

    mount.querySelector('.brsvp__change').addEventListener('click', function () {
      result.hidden = true;
      form.hidden = false;
    });

    function showResult(responses, finalGuestName, message, count) {
      var byId = {};
      responses.forEach(function (r) { byId[r.rsvpEventId] = r; });
      var lines = evs.map(function (e) {
        var r = byId[e.id] || {};
        var st = r.status || 'attending';
        var badgeColor = st === 'attending' ? '#2e7d32' : (st === 'maybe' ? '#b45309' : '#6b7280');
        var badgeBg = st === 'attending' ? '#e8f5e9' : (st === 'maybe' ? '#fef3c7' : '#f3f4f6');
        var extra = (st === 'attending' || st === 'maybe') && count ? ' (' + count + ' guests)' : '';
        return '<li style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-top:1px solid rgba(0,0,0,0.06); font-size:14px;">' +
          '<span style="font-weight:600; color:var(--brsvp-ink);">' + esc(e.name) + '</span>' +
          '<span style="display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:700; background:' + badgeBg + '; color:' + badgeColor + ';">' +
          (STATUS_LABEL[st] || 'Yes') + extra + '</span></li>';
      }).join('');

      var whatsappSummary = responses.map(function (r) {
        return '• ' + (r.name || 'Event') + ': ' + (STATUS_LABEL[r.status] || 'Yes');
      }).join('\n');

      var waText = 'Namaste! 🙏\n\n' +
        '*Wedding RSVP Confirmation*\n' +
        '🌸 *Siddhant weds Aayushi* 🌸\n\n' +
        '👤 *Guest:* ' + finalGuestName + '\n' +
        '👥 *Guests Attending:* ' + count + '\n\n' +
        '📅 *Ceremonies:*\n' + whatsappSummary + '\n' +
        (message ? '\n💌 *Message:* "' + message + '"\n' : '\n') +
        '\nLooking forward to celebrating this auspicious occasion together! ✨';

      var waUrl = 'https://api.whatsapp.com/send?phone=919727910473&text=' + encodeURIComponent(waText);

      mount.querySelector('.brsvp__thanks').innerHTML =
        '<div style="text-align:center; padding:8px 0 16px;">' +
          '<div style="display:inline-block; background:#e8f5e9; color:#2e7d32; font-weight:700; font-size:14px; padding:6px 18px; border-radius:999px; margin-bottom:12px; border:1px solid rgba(46,125,50,0.2);">🎉 RSVP Confirmed!</div>' +
          '<h3 style="font-size:21px; font-weight:700; color:var(--brsvp-accent); margin:0 0 8px; font-family:\'Cormorant Garamond\', Georgia, serif;">Your RSVP Has Been Received</h3>' +
          '<p style="font-size:15px; color:var(--brsvp-ink); margin:0 0 14px; line-height:1.4;">Thank you, <strong style="color:var(--brsvp-accent);">' + esc(finalGuestName) + '</strong>! Your response has been recorded with joy.</p>' +
        '</div>' +
        '<div style="background:var(--brsvp-wash, #fdf8f5); border:1px solid var(--brsvp-line, #f0e2d5); border-radius:16px; padding:12px 16px; margin-bottom:18px;">' +
          '<div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; color:var(--brsvp-muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">' +
            '<span>Event Schedule</span>' +
            '<span>Status</span>' +
          '</div>' +
          '<ul style="list-style:none; margin:0; padding:0;">' + lines + '</ul>' +
        '</div>' +
        (message ? '<div style="background:rgba(255,255,255,0.7); border-left:3px solid var(--brsvp-accent); padding:10px 14px; border-radius:0 12px 12px 0; margin-bottom:18px; font-style:italic; font-size:14px; color:var(--brsvp-ink);">“' + esc(message) + '”</div>' : '') +
        '<div style="margin:20px 0 10px; text-align:center;">' +
          '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:15px 20px; background:#25D366; color:#ffffff; font-weight:700; font-size:16px; border-radius:999px; text-decoration:none; box-shadow:0 6px 20px rgba(37,211,102,0.35); box-sizing:border-box; transition:transform 0.15s ease;">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="flex-shrink:0;"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.36 7.34 9.09 7.4 8.87 7.65C8.65 7.89 8.02 8.48 8.02 9.69C8.02 10.9 8.91 12.06 9.03 12.23C9.15 12.4 10.74 14.86 13.18 15.92C15.21 16.8 15.62 16.63 16.07 16.59C16.52 16.54 17.51 16 17.72 15.42C17.93 14.84 17.93 14.34 17.87 14.24C17.81 14.14 17.65 14.08 17.4 13.96C17.15 13.84 15.93 13.24 15.7 13.16C15.47 13.08 15.31 13.04 15.14 13.28C14.97 13.53 14.5 14.08 14.35 14.24C14.21 14.41 14.07 14.43 13.82 14.31C13.57 14.19 12.77 13.93 11.82 13.08C11.08 12.42 10.58 11.61 10.44 11.36C10.3 11.12 10.42 10.99 10.55 10.86C10.66 10.75 10.8 10.56 10.92 10.42C11.05 10.28 11.09 10.17 11.17 10.01C11.25 9.84 11.21 9.7 11.15 9.58C11.09 9.45 10.59 8.24 10.39 7.74C10.19 7.25 9.98 7.32 9.82 7.31C9.68 7.31 9.53 7.34 9.53 7.34Z"/></svg>' +
            '<span>💬 Send RSVP Confirmation on WhatsApp</span>' +
          '</a>' +
          '<div style="font-size:12px; color:var(--brsvp-muted); margin-top:8px;">Sends 1-click confirmation directly to Siddhant / Pravinbhai Patel</div>' +
        '</div>';

      form.hidden = true;
      result.hidden = false;
    }
  }
})();