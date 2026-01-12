import { updateStatsAfterGame, resetStats, getStats, type GameStats } from '../stats';

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

describe('updateStatsAfterGame', () => {
  beforeEach(() => {
    localStorageMock.clear();
    resetStats(); // Ensure clean state
  });

  it('should increment played and won on win', () => {
    const stats = updateStatsAfterGame(true);

    expect(stats.played).toBe(1);
    expect(stats.won).toBe(1);
    expect(stats.lost).toBe(0);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
  });

  it('should increment played and lost on loss', () => {
    const stats = updateStatsAfterGame(false);

    expect(stats.played).toBe(1);
    expect(stats.won).toBe(0);
    expect(stats.lost).toBe(1);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(0);
  });

  it('should maintain current streak on consecutive wins', () => {
    updateStatsAfterGame(true); // Win 1
    updateStatsAfterGame(true); // Win 2
    const stats = updateStatsAfterGame(true); // Win 3

    expect(stats.played).toBe(3);
    expect(stats.won).toBe(3);
    expect(stats.currentStreak).toBe(3);
    expect(stats.maxStreak).toBe(3);
  });

  it('should reset current streak on loss but preserve max streak', () => {
    updateStatsAfterGame(true); // Win 1
    updateStatsAfterGame(true); // Win 2
    const stats = updateStatsAfterGame(false); // Loss

    expect(stats.played).toBe(3);
    expect(stats.won).toBe(2);
    expect(stats.lost).toBe(1);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(2);
  });
});

describe('resetStats', () => {
  beforeEach(() => {
    localStorageMock.clear();
    resetStats(); // Clean state
  });

  it('should reset all stats to zero', () => {
    // Set up some stats
    updateStatsAfterGame(true);
    updateStatsAfterGame(true);
    updateStatsAfterGame(false);

    // Verify they're not zero
    let currentStats = getStats();
    expect(currentStats.played).toBeGreaterThan(0);

    // Reset
    const stats = resetStats();

    expect(stats.played).toBe(0);
    expect(stats.won).toBe(0);
    expect(stats.lost).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(0);
  });
});
