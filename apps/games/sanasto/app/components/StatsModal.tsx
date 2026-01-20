'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStats, resetStats, getAllVariations, type GameStats, type GameVariation } from '../utils/stats';
import { getUserStats } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslations } from 'next-intl';
import { useGame } from '../context/GameContext';
import BarChart from './BarChart';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const t = useTranslations('statistics');
  const tCommon = useTranslations('common');
  const { isAuthenticated } = useAuth();
  const { gameState } = useGame();
  
  // Current variation from game settings
  const [selectedVariation, setSelectedVariation] = useState<GameVariation>({
    wordLength: gameState.settings.wordLength,
    hardMode: gameState.settings.hardMode,
  });
  
  const [stats, setStats] = useState<GameStats>({
    played: 0,
    won: 0,
    lost: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {},
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (isAuthenticated) {
      // Fetch stats from backend
      setIsLoading(true);
      try {
        const backendStats = await getUserStats(
          selectedVariation.wordLength,
          selectedVariation.hardMode
        );
        if (backendStats) {
          setStats({
            played: backendStats.played,
            won: backendStats.won,
            lost: backendStats.lost,
            currentStreak: backendStats.currentStreak,
            maxStreak: backendStats.maxStreak,
            guessDistribution: backendStats.guessDistribution || {},
          });
        }
      } catch (error) {
        console.error('Error loading stats from backend:', error);
        // Fall back to localStorage
        setStats(getStats(selectedVariation));
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use localStorage stats
      setStats(getStats(selectedVariation));
    }
  }, [isAuthenticated, selectedVariation]);

  // Update selected variation when modal opens or game settings change
  useEffect(() => {
    if (isOpen) {
      setSelectedVariation({
        wordLength: gameState.settings.wordLength,
        hardMode: gameState.settings.hardMode,
      });
    }
  }, [isOpen, gameState.settings.wordLength, gameState.settings.hardMode]);

  // Load stats when modal opens or selected variation changes
  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, loadStats]);

  if (!isOpen) return null;

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  const handleReset = () => {
    if (!isAuthenticated) {
      // Only allow reset for local stats (not backend stats)
      const newStats = resetStats(selectedVariation);
      setStats(newStats);
    }
    setShowResetConfirm(false);
  };

  const getVariationLabel = (variation: GameVariation): string => {
    const modeLabel = variation.hardMode ? t('hardMode') : t('normalMode');
    return `${t('letters', { count: variation.wordLength })} - ${modeLabel}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-modal-title"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="stats-modal-title" className="text-2xl font-bold">{t('title')}</h2>
          <button
            onClick={onClose}
            aria-label={tCommon('close')}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            {tCommon('close')}
          </button>
        </div>

        {/* Variation Filter Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">{t('variation')}</label>
          <select
            value={`${selectedVariation.wordLength}-${selectedVariation.hardMode ? 'hard' : 'normal'}`}
            onChange={(e) => {
              const [wordLength, mode] = e.target.value.split('-');
              setSelectedVariation({
                wordLength: parseInt(wordLength) as 5 | 6 | 7,
                hardMode: mode === 'hard',
              });
            }}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {getAllVariations().map((variation) => (
              <option
                key={`${variation.wordLength}-${variation.hardMode ? 'hard' : 'normal'}`}
                value={`${variation.wordLength}-${variation.hardMode ? 'hard' : 'normal'}`}
              >
                {getVariationLabel(variation)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-3xl font-bold">{isLoading ? '...' : stats.played}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('played')}</div>
          </div>
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-3xl font-bold">{isLoading ? '...' : `${winRate}%`}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('winRate')}</div>
          </div>
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-3xl font-bold">{isLoading ? '...' : stats.currentStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('currentStreak')}</div>
          </div>
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-3xl font-bold">{isLoading ? '...' : stats.maxStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('maxStreak')}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{isLoading ? '...' : stats.won}</div>
            <div className="text-sm text-green-600 dark:text-green-400">{t('won')}</div>
          </div>
          <div className="text-center p-4 bg-red-100 dark:bg-red-900 rounded-lg">
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{isLoading ? '...' : stats.lost}</div>
            <div className="text-sm text-red-600 dark:text-red-400">{t('lost')}</div>
          </div>
        </div>

        {/* Guess Distribution Bar Chart */}
        {stats.won > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{t('guessDistribution')}</h3>
            <BarChart data={stats.guessDistribution} maxAttempts={6} />
          </div>
        )}

        {isAuthenticated && (
          <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-center text-sm">
            Statistics synced from your account
          </div>
        )}

        {!isAuthenticated && !showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
          >
            {t('resetStats')}
          </button>
        ) : !isAuthenticated ? (
          <div className="space-y-2">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {t('resetConfirm')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReset}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                {t('resetYes')}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-2 px-4 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 font-bold rounded-lg transition-colors"
              >
                {t('resetCancel')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}