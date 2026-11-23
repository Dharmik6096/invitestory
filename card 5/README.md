# Card 5 - Aabha (Mithril) · Luxury Heirloom Invitation

An exact, 1:1 replica of the **Kian & Aria** interactive digital wedding reception invitation card from InviteStory (`https://www.invitestory.in/previews/mithril/`).

---

## 🌟 Highlights & Interactive Features

- **Interactive Key Unlock Reveal:**
  - Golden antique key and lock animation sequence (`opening-v3.mp4`).
  - Visitor taps "Tap to unlock" or clicks the seal to unlock and open the card.
- **Ambient Background Music & Hero Video:**
  - Plays the soothing background melody (`music.mp3`) with floating play/pause controls.
  - Video background (`hero.mp4`) featuring couples in twilight luxury aesthetics.
- **Save the Date — Interactive Scratch Card:**
  - Real-time scratch-off canvas mechanic (`wed-scratch.js`) where guests interactively scratch to unveil the celebration date (**Sunday, 18 October 2026**).
  - One-tap "Add to calendar" button (.ics / Google Calendar export).
- **Live Event Countdown:**
  - Real-time ticking counter showing Days, Hours, Minutes, and Seconds remaining until the celebration.
- **The Evening / Event Venues:**
  - Venue card (*Jagmandir Island Palace, Udaipur*) with direct Google Maps integration.
- **Dress Code Swatches:**
  - Visual color palette recommendations (`#e8d6be`, `#d3b896`, `#a6ada1`, `#5e6a5c`) with elegant typography.
- **Interactive RSVP:**
  - Guest response selector (Joyfully accept / Regretfully decline), headcount selector, and guest name input.
- **Heirloom Closing & Brand Signature:**
  - "Two hearts, one beautiful journey" closing blessing and pearl heirloom signature (*Aabha — An heirloom of light*).
- **Dual View Modes:**
  - Desktop luxury iPhone preview stage with Dynamic Island and dock controls.
  - Fullscreen responsive mode on mobile devices.

---

## 🚀 How to Run & View

1. **Through Local Web Server:**
   - Open `http://localhost:8080/card%205/index.html` or `http://localhost:8080/card5/`
2. **Standalone Direct Version:**
   - Double-click `card 5/standalone.html` in your browser.
3. **Template Direct Version:**
   - Open `card 5/templates/mithril/index.html`.

---

## 🎨 How to Customize

Open **`card 5/config.js`** (or `card 5/templates/mithril/assets/js/config.js`) to customize:
- `hero.couple` — Couple names (e.g., *Kian & Aria*)
- `invitation.lines` — Host and family invitation text
- `scratch` — Date, day, time, venue, and calendar ISO dates
- `countdown.targetIso` — Target countdown timestamp
- `celebration.events` — Event names, venues, addresses, and Google Maps links
- `dressCode.swatches` — Dress code color hex codes
- `music.src` — Background audio track
