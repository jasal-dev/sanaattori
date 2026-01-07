'use client';

import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useTranslations } from 'next-intl';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tGame = useTranslations('game');
  const { gameState, updateSettings, startNewGame } = useGame();
  const [wordLength, setWordLength] = useState<5 | 6 | 7>(gameState.settings.wordLength);
  const [hardMode, setHardMode] = useState(gameState.settings.hardMode);

  if (!isOpen) return null;

  const handleWordLengthChange = async (length: 5 | 6 | 7) => {
    setWordLength(length);
    updateSettings({ wordLength: length });
    // Start a new game when word length changes
    await startNewGame();
  };

  const handleHardModeToggle = () => {
    const newHardMode = !hardMode;
    setHardMode(newHardMode);
    updateSettings({ hardMode: newHardMode });
  };

  const handleNewGame = async () => {
    await startNewGame();
    onClose();
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

        <div className="space-y-6">
          {/* Word Length Selector */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('wordLength')}</h3>
            <div className="flex gap-3">
              {([5, 6, 7] as const).map((length) => (
                <button
                  key={length}
                  onClick={() => handleWordLengthChange(length)}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
                    wordLength === length
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {length}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {t('wordLengthHint')}
            </p>
          </div>

          {/* Hard Mode Toggle */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t('hardMode')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('hardModeDescription')}
                </p>
              </div>
              <button
                onClick={handleHardModeToggle}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  hardMode ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    hardMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* New Game Button */}
          <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
            <button
              onClick={handleNewGame}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              {tGame('newGame')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}