// Utilities for anonymous game players: name generation and daily play limit.

const ANON_NAME_KEY = 'anon-display-name';
const DAILY_PREFIX  = 'game-daily-';

const FIRST = [
  'Cosmic', 'Nebula', 'Pulsar', 'Quasar', 'Stellar', 'Aurora',
  'Comet', 'Nova', 'Lunar', 'Astral', 'Zenith', 'Eclipse',
  'Photon', 'Galaxy', 'Orbit', 'Meteor', 'Solaris', 'Vega',
  'Lyra', 'Andromeda',
];

const SECOND = [
  'Wanderer', 'Explorer', 'Dreamer', 'Drifter', 'Gazer', 'Seeker',
  'Pilgrim', 'Scout', 'Ranger', 'Guide', 'Nomad', 'Voyager',
  'Observer', 'Mapper', 'Hunter', 'Whisper', 'Drifter', 'Chaser',
  'Watcher', 'Roamer',
];

/** Retrieve (or generate + persist) the anonymous display name. */
export function getAnonName(): string {
  const stored = localStorage.getItem(ANON_NAME_KEY);
  if (stored) return stored;
  const name =
    FIRST[Math.floor(Math.random() * FIRST.length)] +
    ' ' +
    SECOND[Math.floor(Math.random() * SECOND.length)];
  localStorage.setItem(ANON_NAME_KEY, name);
  return name;
}

/** Returns true if the anonymous user has not yet played today. */
export function canAnonPlayToday(gameId: string): boolean {
  const stored = localStorage.getItem(DAILY_PREFIX + gameId);
  if (!stored) return true;
  return stored !== new Date().toDateString();
}

/** Record that the anonymous user played today. */
export function markAnonPlayedToday(gameId: string): void {
  localStorage.setItem(DAILY_PREFIX + gameId, new Date().toDateString());
}
