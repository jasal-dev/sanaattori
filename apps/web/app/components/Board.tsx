'use client';

import { useGame } from '../context/GameContext';
import { useTranslations } from 'next-intl';

export default function Board() {
  const t = useTranslations('game');
  const { gameState, startNewGame, setSelectedBoxIndex } = useGame();
  const { guesses, currentGuess, settings, gameStatus, selectedBoxIndex } = gameState;
  const { wordLength, maxAttempts } = settings;

  // Get the state color for a letter
  const getLetterColor = (state: string) => {
    switch (state) {
      case 'correct':
        return 'bg-green-600 border-green-600 text-white';
      case 'present':
        return 'bg-yellow-600 border-yellow-600 text-white';
      case 'absent':
        return 'bg-gray-500 border-gray-500 text-white';
      default:
        return 'border-gray-300 dark:border-gray-600';
    }
  };

  const handleBoxClick = (rowIndex: number, colIndex: number) => {
    // Only allow clicking on the current row
    const isCurrentRow = rowIndex === guesses.length;
    if (isCurrentRow && gameStatus === 'playing') {
      setSelectedBoxIndex(colIndex);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-4">
      <div className="grid gap-1">
        {/* Render all attempt rows */}
        {Array.from({ length: maxAttempts }).map((_, rowIndex) => {
          const guess = guesses[rowIndex];
          const isCurrentRow = rowIndex === guesses.length;
          
          // For the current row, convert currentGuess to an array with proper spacing
          let letters: string[];
          if (isCurrentRow) {
            const guessArray = currentGuess.split('');
            letters = Array.from({ length: wordLength }, (_, i) => guessArray[i] || '');
          } else {
            letters = guess?.letters.map((l) => l.char) || [];
          }

          return (
            <div
              key={rowIndex}
              className={`grid gap-1`}
              style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: wordLength }).map((_, colIndex) => {
                const letter = letters[colIndex] || '';
                const state = guess?.letters[colIndex]?.state || 'unknown';
                const hasLetter = letter !== '';
                const isSelected = isCurrentRow && selectedBoxIndex === colIndex && gameStatus === 'playing';

                return (
                  <div
                    key={colIndex}
                    onClick={() => handleBoxClick(rowIndex, colIndex)}
                    className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold uppercase transition-colors ${getLetterColor(
                      state
                    )} ${hasLetter && state === 'unknown' ? 'border-gray-500 dark:border-gray-400' : ''} ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                    } ${isCurrentRow && gameStatus === 'playing' ? 'cursor-pointer hover:border-blue-300' : ''}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      
      {/* Game status message */}
      {gameStatus !== 'playing' && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-lg border-2 border-gray-300 dark:border-gray-600">
          <p className="text-lg font-bold mb-3 text-center">
            {gameStatus === 'won' ? t('won') : t('lost', { word: gameState.solution.toUpperCase() })}
          </p>
          <button
            onClick={startNewGame}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
          >
            {t('newGame')}
          </button>
        </div>
      )}
    </div>
  );
}
