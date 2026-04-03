// Constellation data for the True North navigation game.
// Coordinates are derived from real RA/Dec data via gnomonic (tangent-plane) projection,
// centred on each constellation and normalised so max |coord| ≈ 0.75.
// x: east = left (negative), west = right (positive)  →  mirrors a north-up sky chart
// y: north = up (positive), south = down (negative)
// The canonical orientation therefore has North = up (+y), matching the game invariant.

export interface Star {
  x: number;
  y: number;
  magnitude: number; // 1 = brightest, 6 = dimmest
  name?: string;
  color?: string;    // optional CSS hex color for the star's core (spectral type hint)
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
      { x: -0.75, y: -0.22, magnitude: 1.85, name: "Alkaid" },
      { x: -0.48, y:  0.02, magnitude: 2.23, name: "Mizar" },
      { x: -0.25, y:  0.04, magnitude: 1.76, name: "Alioth" },
      { x:  0.03, y:  0.08, magnitude: 3.31, name: "Megrez" },
      { x:  0.47, y:  0.39, magnitude: 1.79, name: "Dubhe",  color: "#ffe8cc" },
      { x:  0.56, y:  0.12, magnitude: 2.37, name: "Merak" },
      { x:  0.20, y: -0.09, magnitude: 2.44, name: "Phecda" },
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
      { x: -0.02, y:  0.75, magnitude: 1.97, name: "Polaris",     color: "#fff5e0" },
      { x: -0.07, y:  0.48, magnitude: 4.36, name: "Yildun" },
      { x: -0.05, y:  0.16, magnitude: 4.23, name: "Epsilon UMi" },
      { x:  0.14, y: -0.11, magnitude: 4.32, name: "Zeta UMi" },
      { x:  0.02, y: -0.26, magnitude: 4.95, name: "Eta UMi" },
      { x:  0.33, y: -0.48, magnitude: 3.05, name: "Pherkad" },
      { x:  0.42, y: -0.29, magnitude: 2.08, name: "Kochab",      color: "#ffddaa" },
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
      { x:  0.75, y: -0.03, magnitude: 2.27, name: "Caph" },
      { x:  0.32, y: -0.38, magnitude: 2.23, name: "Schedar",    color: "#ffddaa" },
      { x:  0.06, y:  0.07, magnitude: 2.47, name: "Gamma Cas" },
      { x: -0.34, y:  0.04, magnitude: 2.68, name: "Ruchbah" },
      { x: -0.66, y:  0.48, magnitude: 3.38, name: "Segin" },
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
      { x: -0.36, y:  0.53, magnitude: 0.42, name: "Betelgeuse", color: "#ff6633" },
      { x:  0.20, y:  0.45, magnitude: 1.64, name: "Bellatrix",  color: "#cce4ff" },
      { x:  0.07, y: -0.04, magnitude: 2.23, name: "Al Amilam" },
      { x: -0.01, y: -0.11, magnitude: 1.69, name: "Alnilam" },
      { x: -0.09, y: -0.17, magnitude: 1.77, name: "Alnitak" },
      { x: -0.22, y: -0.75, magnitude: 2.07, name: "Saiph",      color: "#cce4ff" },
      { x:  0.40, y: -0.64, magnitude: 0.18, name: "Rigel",      color: "#cce4ff" },
      { x:  0.01, y:  0.72, magnitude: 3.33, name: "Meissa" },
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
      { x: -0.37, y:  0.51, magnitude: 1.25, name: "Deneb",     color: "#e8f2ff" },
      { x: -0.13, y:  0.13, magnitude: 2.20, name: "Sadr" },
      { x:  0.70, y: -0.75, magnitude: 3.09, name: "Albireo",   color: "#ffee88" },
      { x: -0.50, y: -0.31, magnitude: 2.46, name: "Gienah" },
      { x:  0.37, y:  0.50, magnitude: 2.87, name: "Delta Cyg" },
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
      { x:  0.28, y:  0.12, magnitude: 2.01, name: "Algieba",  color: "#ffddaa" },
      { x:  0.40, y: -0.03, magnitude: 3.48, name: "Eta Leo" },
      { x:  0.32, y:  0.29, magnitude: 3.44, name: "Adhafera" },
      { x:  0.44, y: -0.26, magnitude: 1.36, name: "Regulus",  color: "#e8f0ff" },
      { x: -0.32, y:  0.15, magnitude: 2.56, name: "Zosma" },
      { x: -0.75, y: -0.11, magnitude: 2.14, name: "Denebola" },
      { x: -0.39, y: -0.09, magnitude: 3.34, name: "Chort" },
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
      { x:  0.56, y:  0.75, magnitude: 3.76, name: "Miram" },
      { x:  0.07, y:  0.64, magnitude: 1.79, name: "Mirfak",       color: "#fff0dd" },
      { x: -0.09, y:  0.48, magnitude: 3.01, name: "Delta Per" },
      { x:  0.31, y:  0.00, magnitude: 2.09, name: "Algol",        color: "#e8f4ff" },
      { x: -0.37, y: -0.67, magnitude: 2.84, name: "Zeta Per" },
      { x: -0.21, y: -0.39, magnitude: 4.04, name: "Xi Per",       color: "#cce4ff" },
      { x: -0.31, y: -0.65, magnitude: 2.84, name: "Atik" },
      { x: -0.14, y: -0.08, magnitude: 2.89, name: "Epsilon Per" },
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
      { x:  0.57, y:  0.70, magnitude: 0.03, name: "Vega",      color: "#e8f2ff" },
      { x: -0.04, y: -0.60, magnitude: 3.52, name: "Sheliak" },
      { x: -0.48, y: -0.75, magnitude: 3.26, name: "Sulafat" },
      { x: -0.33, y:  0.25, magnitude: 4.22, name: "Delta Lyr" },
      { x:  0.23, y:  0.41, magnitude: 4.34, name: "Zeta Lyr" },
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
      { x:  0.31, y: -0.62, magnitude: -0.05, name: "Arcturus", color: "#ffbb55" },
      { x: -0.12, y: -0.12, magnitude:  2.70, name: "Izar",     color: "#ffddaa" },
      { x:  0.06, y: -0.68, magnitude:  2.68, name: "Muphrid",  color: "#fff0dd" },
      { x:  0.05, y:  0.60, magnitude:  3.03, name: "Seginus" },
      { x:  0.08, y:  0.09, magnitude:  3.58, name: "Rho Boo" },
      { x: -0.32, y:  0.75, magnitude:  3.49, name: "Nekkar" },
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
      { x:  0.65, y:  0.65, magnitude: 2.62, name: "Graffias" },
      { x:  0.70, y:  0.47, magnitude: 2.29, name: "Dschubba" },
      { x:  0.28, y:  0.27, magnitude: 1.09, name: "Antares",     color: "#ff4422" },
      { x:  0.19, y:  0.17, magnitude: 2.82, name: "Tau Sco" },
      { x: -0.02, y: -0.19, magnitude: 2.29, name: "Epsilon Sco", color: "#ffcc88" },
      { x: -0.52, y: -0.75, magnitude: 1.86, name: "Sargas",      color: "#fff0dd" },
      { x: -0.51, y: -0.39, magnitude: 1.63, name: "Shaula",      color: "#cce4ff" },
      { x: -0.48, y: -0.39, magnitude: 2.70, name: "Lesath" },
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
      { x: -0.45, y:  0.75, magnitude: 1.58, name: "Castor",    color: "#e8f2ff" },
      { x: -0.68, y:  0.42, magnitude: 1.14, name: "Pollux",    color: "#ffcc88" },
      { x: -0.03, y: -0.09, magnitude: 3.53, name: "Delta Gem" },
      { x: -0.59, y:  0.09, magnitude: 3.57, name: "Kappa Gem" },
      { x:  0.37, y: -0.29, magnitude: 3.06, name: "Mebsuda",   color: "#fff0dd" },
      { x:  0.13, y: -0.09, magnitude: 2.87, name: "Mu Gem",    color: "#ff9944" },
      { x:  0.65, y: -0.07, magnitude: 3.79, name: "Propus" },
      { x:  0.70, y: -0.62, magnitude: 1.93, name: "Alhena",    color: "#e8f4ff" },
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
      { x: -0.03, y:  0.24, magnitude: 0.76, name: "Altair",      color: "#f0f4ff" },
      { x:  0.05, y:  0.36, magnitude: 2.72, name: "Tarazed",     color: "#ffcc88" },
      { x: -0.11, y:  0.06, magnitude: 3.71, name: "Alshain",     color: "#fff0dd" },
      { x:  0.16, y: -0.17, magnitude: 3.36, name: "Delta Aql" },
      { x: -0.26, y: -0.34, magnitude: 3.24, name: "Theta Aql" },
      { x: -0.12, y:  0.60, magnitude: 2.99, name: "Zeta Aql" },
      { x:  0.30, y: -0.75, magnitude: 3.43, name: "Lambda Aql" },
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
      { x:  0.06, y: -0.13, magnitude: 0.87, name: "Aldebaran",  color: "#ffaa44" },
      { x:  0.15, y:  0.02, magnitude: 3.53, name: "Ain",        color: "#fff0dd" },
      { x:  0.21, y: -0.16, magnitude: 3.84, name: "Theta Tau" },
      { x:  0.26, y:  0.02, magnitude: 3.53, name: "Prima Hya" },
      { x:  0.25, y: -0.07, magnitude: 3.76, name: "Delta Tau" },
      { x: -0.57, y:  0.57, magnitude: 1.65, name: "Elnath",     color: "#e8f4ff" },
      { x: -0.75, y:  0.16, magnitude: 3.00, name: "Zeta Tau",   color: "#cce4ff" },
      { x:  0.43, y: -0.34, magnitude: 3.47, name: "Lambda Tau" },
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
