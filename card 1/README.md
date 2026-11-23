# Shahi Patra (Royale) - Royal Wedding Invitation Card

An exact, 1:1 replica of the **Aditi & Rahul** interactive digital wedding invitation card from Balcony (`https://www.itsbalcony.com/invite/shahi-patra-1d92be`).

---

## ✨ Features & Interactive Elements

- **Interactive Gate Opening**:
  - Tap or press space/enter on the sealed band to trigger the royal door opening.
  - Doors swing outward in 3D with golden elephants and floral sprigs.
  - Rectangular star-patterned flaps unroll to unveil the royal palace garden.
- **Background Music**:
  - Plays the royal track *Jashn-e-bahara (Instrumental)*.
  - Floating music control button in the corner to toggle play/mute at any time.
- **Hero Palace Garden Scene**:
  - Moving twilight palace garden video (`garden_palace.mp4`) with dusk mandap still for larger screens.
  - Elegant calligraphy featuring the couple's names: **Aditi & Rahul**.
- **Devanagari Sanskrit Invocation**:
  - Lord Ganesha golden emblem and sacred shloka: `श्री गणेशाय नमः`.
- **Royal Family Scrolls**:
  - Unrolls dynamically with traditional wooden knobs as the user scrolls into view.
  - Groom's family & Bride's family details, parents, and grandparents.
- **Interactive "Reveal the Date" Dial**:
  - Tap the golden plaque button to roll the mechanical dials and lock into **11 OCT 2026**.
- **Physics-Based Hanging Photo Gallery**:
  - Polaroid photo frames and story notes hanging from ropes.
  - Real-time pendulum swinging and 3D tilting driven by Lenis scroll speed and mouse movement.
- **Ceremonies & Itinerary**:
  - Arched cards for all functions: **Mehendi**, **Haldi**, **Sangeet**, **Vivaah**, and **Reception**.
  - Dates, timings, venue details (*Sharma Residence, Jaipur*), and direct Google Maps buttons.
- **Popups & Social Actions**:
  - Ceremony Locations popup with direct directions.
  - Add to Calendar button (.ics calendar export).
  - Instagram integration.
- **Compliments & Notes**:
  - "With Best Compliments From" family relatives scroll.
  - "Things to Note" card with valet parking information.
- **Outro Easel Board**:
  - Decorative painting easel in the royal garden with interactive parallax mouse follow.
  - *"Your Presence Means the World to Us"*.
- **Interactive RSVP Section**:
  - Guest RSVP form with attending/maybe/not-attending options for each ceremony.
  - Headcount counter, contact input, and custom wish/message input.

---

## 🚀 How to Run

### Method 1: Local HTTP Server (Recommended)
From the project folder `d:\Antigravity\Invitation_Card`, run:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js / npx
npx serve .
```

Then open in your browser:
- **`http://localhost:8080/index.html`** (Full platform iframe replica)
- **`http://localhost:8080/standalone.html`** (Direct standalone single-page card)

### Method 2: Direct File Viewing
You can open **`standalone.html`** directly in Chrome, Edge, Safari, or Firefox by double-clicking it. All styles, fonts, vector masks, and animations work out-of-the-box.

---

## 📁 File Structure

```text
├── index.html                 # Full replica matching itsbalcony.com/invite/shahi-patra-1d92be
├── standalone.html            # Direct standalone invitation card (zero iframe)
├── styles.css                 # Royal maroon & gold CSS styling and animations
├── app.js                     # Door swing & scroll unrolling triggers
├── config.js                  # Central wedding data & ceremony details
├── render.js                  # DOM rendering engine
├── date-reveal.js             # "Reveal the Date" mechanical dial animations
├── gallery.js                 # Hanging photo gallery pendulum physics
├── scroll.js                  # Smooth Lenis gliding and GSAP ScrollTrigger
├── social.js                  # Map, Calendar (.ics), and Instagram popups
├── outro.js                   # Garden easel mouse parallax
├── data.json                  # Complete decoded invitation JSON payload
├── media/                     # All 38 assets: videos, audio, SVGs, posters, and photos
├── _platform/                 # Shared RSVP form, music player, GSAP, Lenis, and fonts
├── symbols/                   # Sanskrit spiritual symbols (_ganesha.svg)
├── fonts/                     # Satoshi & web font typography
└── templates/                 # Modular template architecture
```
