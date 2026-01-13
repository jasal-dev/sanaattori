'use client';

import { useState, useEffect } from 'react';
import { getStats, resetStats, type GameStats } from '../utils/stats';
import { getUserStats, type UserStats } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTranslations } from 'next-intl';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const t = useTranslations('statistics');
  const tCommon = useTranslations('common');
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<GameStats>({
    played: 0,
    won: 0,
    lost: 0,
    currentStreak: 0,
    maxStreak: 0,
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, isAuthenticated]);

  const loadStats = async () => {
    if (isAuthenticated) {
      // Fetch stats from backend
      setIsLoading(true);
      try {
        const backendStats = await getUserStats();
        if (backendStats) {
          setStats({
            played: backendStats.played,
            won: backendStats.won,
            lost: backendStats.lost,
            currentStreak: backendStats.currentStreak,
            maxStreak: backendStats.maxStreak,
          });
        }
      } catch (error) {
        console.error('Error loading stats from backend:', error);
        // Fall back to localStorage
        setStats(getStats());
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use localStorage stats
      setStats(getStats());
    }
  };

  if (!isOpen) return null;

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  const handleReset = () => {
    if (!isAuthenticated) {
      // Only allow reset for local stats (not backend stats)
      const newStats = resetStats();
      setStats(newStats);
    }
    setShowResetConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            {tCommon('close')}
          </button>
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

        {isAuthenticated && (
          <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-center text-sm">
            {t('backendStats') || 'Statistics synced from your account'}
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