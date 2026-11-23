// Ever After Bloom - Illustrated Wedding Invitation Configuration
// aarohi & ishaan - An Illustrated Wedding Storybook
(function () {
  const config = {
    couple: {
      bride: "Aarohi",
      groom: "Ishaan",
      initials: "A & I"
    },
    dateISO: "2027-02-14T18:30:00+05:30",
    dateLabel: "Sunday, 14 February 2027",
    timeLabel: "6:30 in the evening",
    venue: {
      name: "Amrit Mahal Palace",
      address: "Jal Marg, Old City, Jaipur, Rajasthan",
      mapsQuery: "Amrit Mahal Palace Jaipur Rajasthan"
    },
    dressCode: "Festive Indian — pastels, ivory & gold",
    hero: {
      kicker: "Together with our families",
      eyebrow: "Save the Date",
      blessing: "Two rivers, one sky"
    },
    story: {
      title: "The Two of Them",
      subtitle: "A love story in three brushstrokes",
      bride: {
        name: "Aarohi",
        role: "The Bride",
        text: "Grew up chasing monsoon light with a sketchbook under her arm. She still stops mid-sentence for a good sunset, and she laughs before the joke has finished landing."
      },
      groom: {
        name: "Ishaan",
        role: "The Groom",
        text: "Learned to cook from his grandmother and to be patient from long train rides. He remembers every song he has ever loved, and hums them slightly wrong on purpose."
      }
    },
    chapters: [
      {
        no: "I",
        title: "A Courtyard in Winter",
        when: "December 2021",
        text: "They met beside a fountain at a friend's mehndi, arguing gently about whether the marigolds were orange or gold. Neither of them won."
      },
      {
        no: "II",
        title: "Letters and Long Calls",
        when: "2022 — 2024",
        text: "Two cities, one time zone, and a habit of narrating ordinary evenings to each other until the ordinary began to feel rare."
      },
      {
        no: "III",
        title: "The Lanterns",
        when: "October 2025",
        text: "On a rooftop above the old city, he asked. She had already said yes somewhere around the second lantern."
      },
      {
        no: "IV",
        title: "And Now, You",
        when: "February 2027",
        text: "The palace gates open, the sky turns rose, and the story waits for the people who made it possible."
      }
    ],
    gallery: [
      {
        src: "media/scene-walking.jpg",
        alt: "The couple walking hand in hand through a palace garden",
        caption: "Through palace gardens hand in hand"
      },
      {
        src: "media/scene-dancing.jpg",
        alt: "The couple dancing under strings of warm lights",
        caption: "Under strings of warm lights"
      },
      {
        src: "media/scene-hands.jpg",
        alt: "Two joined hands, one painted with henna",
        caption: "Two joined hands in love"
      },
      {
        src: "media/scene-balcony.jpg",
        alt: "The couple seated on a marble balcony at golden hour",
        caption: "Golden hour upon the marble balcony"
      }
    ],
    footer: {
      line1: "Come early. Stay late.",
      line2: "Dance badly with us.",
      signoff: "With all our love, Aarohi & Ishaan",
      date: "Sunday, 14 February 2027"
    }
  };

  // Local storage support for visual edits
  const STORAGE_KEY = 'eab_card4_config';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      Object.assign(config, JSON.parse(saved));
    }
  } catch (e) {}

  window.INVITATION_CONFIG = config;
})();
