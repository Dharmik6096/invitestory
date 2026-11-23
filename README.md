# Royal Wedding Invitation Cards Manager

A modular multi-card repository for digital wedding invitations. Each card is packaged in its own 100% self-contained folder (`card 1`, `card 2`, etc.), allowing you to customize and manage multiple wedding invitation designs independently.

---

## 🗂️ Cards Overview

| Card Folder | Template Name | Couple Names | Style & Theme |
| :--- | :--- | :--- | :--- |
| **`card 1/`** | **Shahi Patra (Royale)** | Siddhant & Aayushi | Royal Palace Garden, 3D Door Swing, Golden Elephants, Scroll Unroll, Hanging Polaroids |
| **`card 2/`** | **Papercut Magenta** | Ankita & Kaushik | Papercut Lotus Aesthetic, Multi-Layered Arch Reveal, Blooming Date Wheel, Ceremony Carousel |
| **`card 3/`** | **Shahi Palna (Baby Shower)** | Priya & Aarav | 3D Royal Doors, 3D Swinging Golden Cradle (Palna), Drifting Petals, Godh Bharai / Seemantham, WhatsApp RSVP |

---

## 🚀 How to Run & View

### 1. One-Click Run (Windows)
Simply double-click **`start_server.bat`** in the main folder!
It will automatically launch the local web server and open your browser at **http://localhost:8080**.

### 2. Manual Command Line
Open PowerShell or Terminal in this folder and run:
```bash
python -m http.server 8080
```

Then open in your browser:
- **Cards Manager Portal**: [http://localhost:8080/](http://localhost:8080/)
- **Card 1 (Full Platform)**: [http://localhost:8080/card%201/index.html](http://localhost:8080/card%201/index.html)
- **Card 1 (Direct Standalone)**: [http://localhost:8080/card%201/standalone.html](http://localhost:8080/card%201/standalone.html)
- **Card 2 (Full Platform)**: [http://localhost:8080/card%202/index.html](http://localhost:8080/card%202/index.html)
- **Card 2 (Direct Standalone)**: [http://localhost:8080/card%202/standalone.html](http://localhost:8080/card%202/standalone.html)
- **Card 3 (Full Platform - Baby Shower)**: [http://localhost:8080/card%203/index.html](http://localhost:8080/card%203/index.html)
- **Card 3 (Direct Standalone - Baby Shower)**: [http://localhost:8080/card%203/standalone.html](http://localhost:8080/card%203/standalone.html)

### 2. View Directly (No Server Needed)
Double-click either **`card 1/standalone.html`** or **`card 2/standalone.html`** in Windows File Explorer to open directly in any web browser.

---

## 💡 How to Customize or Add More Cards

### To Customize an Existing Card:
- Open `card 1/config.js` or `card 2/config.js`.
- Edit names, dates, venues, ceremony schedules, and photos.

### To Create a New Card (e.g. `card 3`):
1. Duplicate either `card 1` or `card 2` folder and rename it `card 3`.
2. Edit `card 3/config.js` with your new details.
3. Every card is 100% self-contained and completely independent!
