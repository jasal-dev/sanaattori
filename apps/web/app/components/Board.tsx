'use client';

import { useGame } from '../context/GameContext';

export default function Board() {
  const { gameState } = useGame();
  const { guesses, currentGuess, settings, gameStatus } = gameState;
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

  return (
    <div className="flex-1 flex items-center justify-center py-4">
      <div className="grid gap-1">
        {/* Render all attempt rows */}
        {Array.from({ length: maxAttempts }).map((_, rowIndex) => {
          const guess = guesses[rowIndex];
          const isCurrentRow = rowIndex === guesses.length;
          const letters = isCurrentRow
            ? currentGuess.split('')
            : guess?.letters.map((l) => l.char) || [];

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

                return (
                  <div
                    key={colIndex}
                    className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold uppercase transition-colors ${getLetterColor(
                      state
                    )} ${hasLetter && state === 'unknown' ? 'border-gray-500 dark:border-gray-400' : ''}`}
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
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-lg border-2 border-gray-300 dark:border-gray-600">
          <p className="text-lg font-bold">
            {gameStatus === 'won' ? '🎉 You won!' : `Game over! The word was: ${gameState.solution.toUpperCase()}`}
          </p>
        </div>
      )}
    </div>
  );
}
