// Constellation data for the True North navigation game.
// Coordinates are normalized -1 to 1 (x: left=-1, right=1; y: bottom=-1, top=1).
// The canonical orientation has North = up (positive y).

export interface Star {
  x: number;
  y: number;
  magnitude: number; // 1 = brightest, 6 = dimmest
  name?: string;
}

export interface ConstellationLine {
  from: number; // index into stars array
  to: number;
}

export interface Constellation {
  id: string;
  name: string;
  description: string;
  navigationTip: string;
  stars: Star[];
  lines: ConstellationLine[];
}

export const CONSTELLATIONS: Constellation[] = [
  {
    id: "ursa-major",
    name: "Ursa Major (Big Dipper)",
    description: "The Great Bear — its distinctive 'dipper' shape is one of the most recognized patterns in the northern sky.",
    navigationTip: "The two stars at the outer edge of the Dipper's bowl (Dubhe and Merak, the 'pointer stars') form a line pointing directly to Polaris — true North. Extend the line about 5 times the distance between them.",
    stars: [
      { x: -0.65, y: -0.35, magnitude: 2.4, name: "Alkaid" },   // 0 handle tip
      { x: -0.35, y: -0.20, magnitude: 2.3, name: "Mizar" },    // 1 handle mid
      { x: -0.05, y: -0.10, magnitude: 1.8, name: "Alioth" },   // 2 handle-bowl join
      { x:  0.20, y: -0.05, magnitude: 2.4, name: "Megrez" },   // 3 bowl top-left
      { x:  0.55, y:  0.10, magnitude: 2.5, name: "Dubhe" },    // 4 bowl top-right (pointer)
      { x:  0.55, y: -0.35, magnitude: 2.4, name: "Merak" },    // 5 bowl bot-right (pointer)
      { x:  0.20, y: -0.40, magnitude: 2.4, name: "Phecda" },   // 6 bowl bot-left
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 3 },
    ],
  },
  {
    id: "ursa-minor",
    name: "Ursa Minor (Little Dipper)",
    description: "The Little Bear — its handle tip, Polaris, sits almost exactly at the celestial north pole.",
    navigationTip: "Polaris at the tip of the Little Dipper's handle marks true North with less than 1° of error. Once you find it, it never moves — all other stars rotate around it through the night.",
    stars: [
      { x:  0.00,  y:  0.75, magnitude: 2.0, name: "Polaris" }, // 0 handle tip = North!
      { x: -0.15,  y:  0.30, magnitude: 4.2, name: "Yildun" },  // 1
      { x: -0.25,  y: -0.05, magnitude: 4.3 },                   // 2
      { x: -0.30,  y: -0.35, magnitude: 3.0, name: "Epsilon UMi" }, // 3 bowl
      { x: -0.05,  y: -0.55, magnitude: 4.2, name: "Delta UMi" },   // 4 bowl
      { x:  0.25,  y: -0.40, magnitude: 4.3, name: "Zeta UMi" },    // 5 bowl
      { x:  0.20,  y: -0.15, magnitude: 2.1, name: "Kochab" },       // 6 bowl top-right
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 2 },
    ],
  },
  {
    id: "cassiopeia",
    name: "Cassiopeia",
    description: "The Queen — a striking W (or M) shape that sits opposite the Big Dipper across Polaris.",
    navigationTip: "Cassiopeia's W shape straddles the Milky Way and always appears on the opposite side of Polaris from the Big Dipper. Draw a line from the Big Dipper through Polaris and you'll find Cassiopeia on the other side. The W points toward North.",
    stars: [
      { x: -0.65,  y:  0.10, magnitude: 2.7, name: "Caph" },      // 0 left
      { x: -0.30,  y: -0.20, magnitude: 2.2, name: "Schedar" },   // 1
      { x:  0.00,  y:  0.10, magnitude: 2.5, name: "Gamma Cas" }, // 2 center
      { x:  0.30,  y: -0.15, magnitude: 2.7, name: "Ruchbah" },   // 3
      { x:  0.65,  y:  0.15, magnitude: 3.4, name: "Segin" },     // 4 right
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
    ],
  },
  {
    id: "orion",
    name: "Orion",
    description: "The Hunter — one of the most conspicuous and recognizable constellations, visible from most of Earth.",
    navigationTip: "Orion's Belt (three stars in a row) rises almost exactly due East and sets almost exactly due West worldwide. The Belt points eastward toward Sirius (the brightest star) and westward toward Aldebaran in Taurus. In the northern hemisphere, Orion arcs low in the South.",
    stars: [
      { x: -0.45,  y:  0.55, magnitude: 0.1, name: "Betelgeuse" }, // 0 left shoulder
      { x:  0.40,  y:  0.55, magnitude: 1.6, name: "Bellatrix" },  // 1 right shoulder
      { x: -0.25,  y:  0.15, magnitude: 2.2, name: "Al Amilam" }, // 2 belt left
      { x:  0.00,  y:  0.10, magnitude: 1.7, name: "Alnilam" },    // 3 belt center
      { x:  0.25,  y:  0.05, magnitude: 2.1, name: "Alnitak" },    // 4 belt right
      { x: -0.45, y: -0.50, magnitude: 2.8, name: "Saiph" },       // 5 left knee
      { x:  0.40, y: -0.45, magnitude: 0.2, name: "Rigel" },       // 6 right foot
      { x:  0.00,  y:  0.80, magnitude: 2.8, name: "Meissa" },     // 7 head
    ],
    lines: [
      { from: 0, to: 1 }, // shoulders
      { from: 0, to: 2 }, // left shoulder to belt
      { from: 1, to: 4 }, // right shoulder to belt
      { from: 2, to: 3 }, // belt
      { from: 3, to: 4 },
      { from: 2, to: 5 }, // belt to knees
      { from: 4, to: 6 },
      { from: 0, to: 7 }, // shoulder to head
      { from: 1, to: 7 },
    ],
  },
  {
    id: "cygnus",
    name: "Cygnus (Northern Cross)",
    description: "The Swan — its bright stars form a prominent cross shape along the Milky Way, also known as the Northern Cross.",
    navigationTip: "Deneb, Cygnus's brightest star, is one corner of the Summer Triangle (with Vega and Altair). Cygnus flies along the Milky Way, and its long axis (the cross-bar) points roughly North-South when the constellation is upright. Deneb is almost directly overhead from mid-northern latitudes.",
    stars: [
      { x:  0.00,  y:  0.75, magnitude: 1.3, name: "Deneb" },   // 0 tail (top)
      { x:  0.00,  y:  0.15, magnitude: 2.5, name: "Sadr" },    // 1 center
      { x:  0.00, y: -0.55, magnitude: 2.9, name: "Albireo" },  // 2 head (bottom)
      { x: -0.55,  y:  0.15, magnitude: 2.9, name: "Gienah" },  // 3 left wing
      { x:  0.55,  y:  0.10, magnitude: 3.8, name: "Delta Cyg" }, // 4 right wing
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 3, to: 1 },
      { from: 1, to: 4 },
    ],
  },
  {
    id: "leo",
    name: "Leo",
    description: "The Lion — a spring constellation with a distinctive backward question-mark (the Sickle) forming the lion's head.",
    navigationTip: "Leo is a spring constellation visible in the south from northern latitudes. The two stars of the Big Dipper's bowl on the side opposite the handle (Phecda and Megrez) point toward Regulus, Leo's brightest star. Regulus lies almost exactly on the ecliptic, very close to the celestial equator.",
    stars: [
      { x: -0.05,  y:  0.65, magnitude: 2.1, name: "Algieba" },  // 0 mane
      { x: -0.30,  y:  0.30, magnitude: 3.1, name: "Eta Leo" },  // 1
      { x: -0.55,  y: -0.10, magnitude: 3.4, name: "Adhafera" }, // 2
      { x: -0.50, y: -0.50, magnitude: 1.4, name: "Regulus" },   // 3 heart / brightest
      { x:  0.20,  y:  0.30, magnitude: 2.6, name: "Zosma" },   // 4 back
      { x:  0.55,  y:  0.05, magnitude: 2.1, name: "Denebola" },// 5 tail
      { x:  0.30, y: -0.35, magnitude: 3.3, name: "Chort" },    // 6 hip
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 0 }, // close the Sickle loop
      { from: 0, to: 4 },
      { from: 4, to: 5 },
      { from: 4, to: 6 },
      { from: 6, to: 3 },
    ],
  },
  {
    id: "perseus",
    name: "Perseus",
    description: "The Hero — a rich constellation in the Milky Way, famous for the Perseid meteor shower radiating from near its border.",
    navigationTip: "Perseus lies between Cassiopeia (to its north) and the Pleiades (to its south). Mirfak, its brightest star, sits in a rich star field. The Perseid meteors in August appear to radiate from Perseus, which is in the northeast sky during the peak of the shower.",
    stars: [
      { x:  0.00,  y:  0.75, magnitude: 3.8, name: "Miram" },   // 0 top
      { x: -0.15,  y:  0.40, magnitude: 1.8, name: "Mirfak" },  // 1 alpha (bright)
      { x:  0.20,  y:  0.20, magnitude: 2.9, name: "Delta Per" },// 2
      { x:  0.40,  y:  0.00, magnitude: 2.1, name: "Algol" },   // 3 right (eclipsing binary)
      { x: -0.40,  y:  0.10, magnitude: 2.8, name: "Zeta Per" },// 4 left
      { x: -0.50, y: -0.30, magnitude: 3.0, name: "Xi Per" },   // 5
      { x: -0.10, y: -0.55, magnitude: 2.8, name: "Atik" },     // 6 foot
      { x:  0.30, y: -0.35, magnitude: 3.8, name: "Epsilon Per" }, // 7
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 1, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
      { from: 7, to: 2 },
    ],
  },
  {
    id: "lyra",
    name: "Lyra",
    description: "The Lyre — small but brilliant, anchored by Vega, one of the brightest stars in the night sky and part of the Summer Triangle.",
    navigationTip: "Vega in Lyra is the second brightest star visible from most of the northern hemisphere and nearly overhead in summer. Vega, Deneb (Cygnus), and Altair (Aquila) form the prominent Summer Triangle, which is a useful landmark for navigating the summer sky.",
    stars: [
      { x:  0.00,  y:  0.65, magnitude: 0.0, name: "Vega" },    // 0 top (very bright)
      { x: -0.30,  y: -0.10, magnitude: 3.5, name: "Sheliak" }, // 1 left
      { x:  0.30,  y: -0.10, magnitude: 4.3, name: "Sulafat" }, // 2 right
      { x: -0.15, y: -0.50, magnitude: 4.4, name: "Delta Lyr" }, // 3 bottom-left
      { x:  0.15, y: -0.50, magnitude: 4.0, name: "Zeta Lyr" }, // 4 bottom-right
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 1, to: 2 },
    ],
  },
  {
    id: "bootes",
    name: "Boötes (The Herdsman)",
    description: "The Herdsman — a kite-shaped constellation anchored by Arcturus, the fourth-brightest star in the sky and the brightest in the northern celestial hemisphere.",
    navigationTip: "Follow the arc of the Big Dipper's handle to 'arc to Arcturus' — one of the most useful mnemonics in astronomy. Continue the arc further to 'speed to Spica' in Virgo. Arcturus's distinctive orange-yellow color makes it unmistakable in the spring sky.",
    stars: [
      { x:  0.00, y: -0.60, magnitude: -0.1, name: "Arcturus" }, // 0 very bright, bottom of kite
      { x: -0.30, y:  0.10, magnitude: 2.7, name: "Izar" },      // 1 left middle
      { x:  0.20, y:  0.05, magnitude: 2.7, name: "Muphrid" },   // 2 right middle
      { x: -0.40, y:  0.50, magnitude: 3.0, name: "Seginus" },   // 3 upper left
      { x:  0.40, y:  0.50, magnitude: 2.7, name: "Rho Boo" },   // 4 upper right
      { x:  0.00, y:  0.75, magnitude: 3.5, name: "Nekkar" },    // 5 top of kite
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 5 },
    ],
  },
  {
    id: "scorpius",
    name: "Scorpius",
    description: "The Scorpion — a summer constellation with a distinctive S-curve from head to sting, anchored by the brilliant red supergiant Antares.",
    navigationTip: "Scorpius lies opposite Orion in the sky — ancient myths say they never appear together. Antares (meaning 'rival of Mars') glows unmistakably red-orange low in the summer southern sky. Shaula and Lesath mark the stinger tip. The Scorpion's tail curls toward the Milky Way core.",
    stars: [
      { x: -0.25, y:  0.65, magnitude: 2.6, name: "Graffias" },   // 0 head left
      { x:  0.10, y:  0.60, magnitude: 2.3, name: "Dschubba" },   // 1 head right
      { x: -0.10, y:  0.30, magnitude: 1.1, name: "Antares" },    // 2 heart (very bright)
      { x:  0.15, y:  0.00, magnitude: 2.9, name: "Tau Sco" },    // 3 body
      { x:  0.30, y: -0.25, magnitude: 2.9, name: "Epsilon Sco"}, // 4 body
      { x:  0.38, y: -0.50, magnitude: 1.9, name: "Sargas" },     // 5 tail
      { x:  0.20, y: -0.68, magnitude: 1.6, name: "Shaula" },     // 6 stinger (bright)
      { x:  0.05, y: -0.62, magnitude: 2.7, name: "Lesath" },     // 7 stinger pair
    ],
    lines: [
      { from: 0, to: 2 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
      { from: 5, to: 7 },
      { from: 6, to: 7 },
    ],
  },
  {
    id: "gemini",
    name: "Gemini (The Twins)",
    description: "The Twins — two parallel chains of stars representing Castor and Pollux, the immortal brothers of Greek myth, each leading their own figure down through the winter sky.",
    navigationTip: "Castor and Pollux mark the two heads of the Twins and are easy to spot as a close bright pair in the winter sky. Orion's Belt extended northeast points toward them. Pollux (the slightly brighter and closer twin) lies almost exactly on the ecliptic, making it a useful reference for the zodiac band.",
    stars: [
      { x: -0.35, y:  0.70, magnitude: 1.6, name: "Castor" },    // 0 head left
      { x:  0.20, y:  0.65, magnitude: 1.1, name: "Pollux" },    // 1 head right (brighter)
      { x: -0.50, y:  0.25, magnitude: 3.5, name: "Delta Gem" }, // 2 Castor mid
      { x:  0.05, y:  0.18, magnitude: 3.2, name: "Kappa Gem" }, // 3 Pollux mid
      { x: -0.55, y: -0.15, magnitude: 2.9, name: "Mebsuda" },  // 4 Castor lower
      { x:  0.00, y: -0.22, magnitude: 3.2, name: "Mu Gem" },    // 5 Pollux lower
      { x: -0.45, y: -0.58, magnitude: 3.7, name: "Propus" },   // 6 Castor foot
      { x:  0.25, y: -0.58, magnitude: 1.9, name: "Alhena" },   // 7 Pollux foot (bright)
    ],
    lines: [
      { from: 0, to: 1 }, // connecting heads
      { from: 0, to: 2 }, // Castor chain
      { from: 2, to: 4 },
      { from: 4, to: 6 },
      { from: 1, to: 3 }, // Pollux chain
      { from: 3, to: 5 },
      { from: 5, to: 7 },
      { from: 2, to: 3 }, // connecting shoulders
    ],
  },
  {
    id: "aquila",
    name: "Aquila (The Eagle)",
    description: "The Eagle — soaring along the Milky Way with Altair as its brilliant heart. Altair is one of the closest naked-eye stars to Earth, just 17 light-years away.",
    navigationTip: "Altair forms one vertex of the Summer Triangle (with Vega in Lyra and Deneb in Cygnus), a huge asterism that dominates summer nights. Altair rises almost exactly due East and lies near the celestial equator, making it a useful east-west reference year-round for observers in the northern hemisphere.",
    stars: [
      { x:  0.00, y:  0.15, magnitude: 0.8, name: "Altair" },    // 0 center (bright)
      { x: -0.20, y:  0.35, magnitude: 2.7, name: "Tarazed" },   // 1 upper left flanker
      { x:  0.20, y:  0.33, magnitude: 3.7, name: "Alshain" },   // 2 upper right flanker
      { x: -0.55, y: -0.10, magnitude: 3.4, name: "Delta Aql" }, // 3 left wing
      { x:  0.50, y:  0.00, magnitude: 3.2, name: "Theta Aql" }, // 4 right wing
      { x: -0.15, y: -0.55, magnitude: 3.4, name: "Zeta Aql" },  // 5 tail
      { x:  0.10, y: -0.68, magnitude: 2.7, name: "Lambda Aql"}, // 6 tail tip
    ],
    lines: [
      { from: 1, to: 0 },
      { from: 0, to: 2 },
      { from: 3, to: 0 },
      { from: 0, to: 4 },
      { from: 0, to: 5 },
      { from: 5, to: 6 },
    ],
  },
  {
    id: "taurus",
    name: "Taurus (The Bull)",
    description: "The Bull — its V-shaped face (the Hyades cluster) and fiery orange eye (Aldebaran) are among the most distinctive sights in the winter sky.",
    navigationTip: "Orion's Belt points northwest directly toward Aldebaran, the orange eye of the Bull — one of the longest pointer lines in the sky. The Pleiades star cluster (Seven Sisters) lies just northwest of the V-tip, and the long horns of the Bull point eastward toward the twin stars Castor and Pollux in Gemini.",
    stars: [
      { x: -0.05, y: -0.05, magnitude: 0.9, name: "Aldebaran" }, // 0 eye (very bright, orange)
      { x: -0.35, y:  0.20, magnitude: 3.4, name: "Ain" },        // 1 V left arm
      { x:  0.30, y:  0.18, magnitude: 3.5, name: "Theta Tau" }, // 2 V right arm
      { x: -0.55, y:  0.42, magnitude: 2.7, name: "Prima Hya" }, // 3 V left tip
      { x:  0.55, y:  0.38, magnitude: 3.8, name: "Delta Tau" }, // 4 V right tip
      { x: -0.30, y:  0.72, magnitude: 1.7, name: "Elnath" },    // 5 north horn (bright)
      { x:  0.55, y:  0.72, magnitude: 3.0, name: "Zeta Tau" },  // 6 south horn
      { x:  0.00, y: -0.60, magnitude: 2.9, name: "Lambda Tau"}, // 7 body below
    ],
    lines: [
      { from: 0, to: 1 },
      { from: 1, to: 3 },
      { from: 0, to: 2 },
      { from: 2, to: 4 },
      { from: 3, to: 5 }, // left arm to horn
      { from: 4, to: 6 }, // right arm to horn
      { from: 0, to: 7 }, // body downward
    ],
  },
];
