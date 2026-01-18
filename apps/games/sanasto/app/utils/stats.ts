/**
 * Statistics management for the game
 * Stores stats in localStorage
 */

export interface GameStats {
  played: number;
  won: number;
  lost: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>; // Maps guess count (1-6) to number of wins
}

export interface GameVariation {
  wordLength: 5 | 6 | 7;
  hardMode: boolean;
}

export interface VariationStats {
  [key: string]: GameStats; // Key format: "{wordLength}-{hardMode ? 'hard' : 'normal'}"
}

const STATS_KEY = 'sanaattori_stats_v2'; // Updated version for new format

const DEFAULT_STATS: GameStats = {
  played: 0,
  won: 0,
  lost: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: {},
};

function getVariationKey(variation: GameVariation): string {
  return `${variation.wordLength}-${variation.hardMode ? 'hard' : 'normal'}`;
}

function getAllVariationStats(): VariationStats {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading stats:', error);
  }

  return {};
}

function saveAllVariationStats(stats: VariationStats): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

export function getStats(variation: GameVariation): GameStats {
  const allStats = getAllVariationStats();
  const key = getVariationKey(variation);
  const stored = allStats[key];
  
  if (stored) {
    // Return a copy with a fresh guessDistribution object
    return {
      ...stored,
      guessDistribution: { ...stored.guessDistribution },
    };
  }
  
  // Return a fresh default stats object
  return {
    played: 0,
    won: 0,
    lost: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {},
  };
}

export function saveStats(variation: GameVariation, stats: GameStats): void {
  const allStats = getAllVariationStats();
  const key = getVariationKey(variation);
  allStats[key] = stats;
  saveAllVariationStats(allStats);
}

export function updateStatsAfterGame(
  variation: GameVariation,
  won: boolean,
  guessCount?: number
): GameStats {
  const stats = getStats(variation);

  stats.played += 1;

  if (won) {
    stats.won += 1;
    stats.currentStreak += 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    
    // Track guess distribution for wins
    if (guessCount && guessCount >= 1 && guessCount <= 6) {
      stats.guessDistribution[guessCount] = (stats.guessDistribution[guessCount] || 0) + 1;
    }
  } else {
    stats.lost += 1;
    stats.currentStreak = 0;
  }

  saveStats(variation, stats);
  return stats;
}

export function resetStats(variation: GameVariation): GameStats {
  const stats: GameStats = {
    played: 0,
    won: 0,
    lost: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {},
  };
  saveStats(variation, stats);
  return stats;
}

export function getAllVariations(): GameVariation[] {
  const variations: GameVariation[] = [];
  const wordLengths: (5 | 6 | 7)[] = [5, 6, 7];
  const modes = [false, true]; // normal and hard mode

  for (const wordLength of wordLengths) {
    for (const hardMode of modes) {
      variations.push({ wordLength, hardMode });
    }
  }

  return variations;
}
