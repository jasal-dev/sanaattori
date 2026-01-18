import { updateStatsAfterGame, resetStats, getStats, type GameStats, type GameVariation } from '../stats';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const defaultVariation: GameVariation = {
  wordLength: 5,
  hardMode: false,
};

describe('updateStatsAfterGame', () => {
  beforeEach(() => {
    localStorageMock.clear();
    resetStats(defaultVariation); // Ensure clean state
  });

  it('should increment played and won on win', () => {
    const stats = updateStatsAfterGame(defaultVariation, true, 3);

    expect(stats.played).toBe(1);
    expect(stats.won).toBe(1);
    expect(stats.lost).toBe(0);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
    expect(stats.guessDistribution[3]).toBe(1);
  });

  it('should increment played and lost on loss', () => {
    const stats = updateStatsAfterGame(defaultVariation, false);

    expect(stats.played).toBe(1);
    expect(stats.won).toBe(0);
    expect(stats.lost).toBe(1);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(0);
  });

  it('should maintain current streak on consecutive wins', () => {
    updateStatsAfterGame(defaultVariation, true, 2); // Win 1
    updateStatsAfterGame(defaultVariation, true, 3); // Win 2
    const stats = updateStatsAfterGame(defaultVariation, true, 1); // Win 3

    expect(stats.played).toBe(3);
    expect(stats.won).toBe(3);
    expect(stats.currentStreak).toBe(3);
    expect(stats.maxStreak).toBe(3);
    expect(stats.guessDistribution[1]).toBe(1);
    expect(stats.guessDistribution[2]).toBe(1);
    expect(stats.guessDistribution[3]).toBe(1);
  });

  it('should reset current streak on loss but preserve max streak', () => {
    updateStatsAfterGame(defaultVariation, true, 4); // Win 1
    updateStatsAfterGame(defaultVariation, true, 5); // Win 2
    const stats = updateStatsAfterGame(defaultVariation, false); // Loss

    expect(stats.played).toBe(3);
    expect(stats.won).toBe(2);
    expect(stats.lost).toBe(1);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(2);
  });

  it('should track stats separately for different variations', () => {
    const variation5Normal = { wordLength: 5 as const, hardMode: false };
    const variation6Hard = { wordLength: 6 as const, hardMode: true };

    updateStatsAfterGame(variation5Normal, true, 3);
    updateStatsAfterGame(variation6Hard, true, 2);

    const stats5Normal = getStats(variation5Normal);
    const stats6Hard = getStats(variation6Hard);

    expect(stats5Normal.played).toBe(1);
    expect(stats5Normal.won).toBe(1);
    expect(stats6Hard.played).toBe(1);
    expect(stats6Hard.won).toBe(1);
  });
});

describe('resetStats', () => {
  beforeEach(() => {
    localStorageMock.clear();
    resetStats(defaultVariation); // Clean state
  });

  it('should reset all stats to zero', () => {
    // Set up some stats
    updateStatsAfterGame(defaultVariation, true, 2);
    updateStatsAfterGame(defaultVariation, true, 3);
    updateStatsAfterGame(defaultVariation, false);

    // Verify they're not zero
    let currentStats = getStats(defaultVariation);
    expect(currentStats.played).toBeGreaterThan(0);

    // Reset
    const stats = resetStats(defaultVariation);

    expect(stats.played).toBe(0);
    expect(stats.won).toBe(0);
    expect(stats.lost).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(0);
    expect(Object.keys(stats.guessDistribution).length).toBe(0);
  });
});
