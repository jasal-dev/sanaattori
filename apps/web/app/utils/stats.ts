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
}

const STATS_KEY = 'sanaattori_stats_v1';

const DEFAULT_STATS: GameStats = {
  played: 0,
  won: 0,
  lost: 0,
  currentStreak: 0,
  maxStreak: 0,
};

export function getStats(): GameStats {
  if (typeof window === 'undefined') {
    return DEFAULT_STATS;
  }

  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading stats:', error);
  }

  return DEFAULT_STATS;
}

export function saveStats(stats: GameStats): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

export function updateStatsAfterGame(won: boolean): GameStats {
  const stats = getStats();

  stats.played += 1;

  if (won) {
    stats.won += 1;
    stats.currentStreak += 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  } else {
    stats.lost += 1;
    stats.currentStreak = 0;
  }

  saveStats(stats);
  return stats;
}

export function resetStats(): GameStats {
  const stats = { ...DEFAULT_STATS };
  saveStats(stats);
  return stats;
}
