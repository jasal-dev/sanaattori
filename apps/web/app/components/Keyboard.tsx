'use client';

import { useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function Keyboard() {
  const { gameState, addLetter, removeLetter, submitGuess } = useGame();
  const { revealedLetters, gameStatus } = gameState;

  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
  ];

  // Get the color for a key based on revealed letters
  const getKeyColor = (key: string) => {
    if (key === 'ENTER' || key === 'BACK') {
      return 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-500';
    }

    const state = revealedLetters.get(key.toLowerCase());
    switch (state) {
      case 'correct':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'present':
        return 'bg-yellow-600 text-white hover:bg-yellow-700';
      case 'absent':
        return 'bg-gray-500 text-white hover:bg-gray-600';
      default:
        return 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600';
    }
  };

  const handleKeyClick = (key: string) => {
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACK') {
      removeLetter();
    } else {
      addLetter(key);
    }
  };

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key === 'Backspace') {
        removeLetter();
      } else if (/^[a-zäöå]$/i.test(e.key)) {
        addLetter(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, submitGuess, removeLetter, addLetter]);

  return (
    <div className="w-full max-w-screen-sm mx-auto px-2 pb-4">
      <div className="flex flex-col gap-1.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-center">
            {row.map((key) => {
              const isSpecial = key === 'ENTER' || key === 'BACK';
              return (
                <button
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  className={`${
                    isSpecial ? 'px-3 text-xs' : 'w-9'
                  } h-14 rounded font-bold uppercase flex items-center justify-center transition-colors ${getKeyColor(
                    key
                  )}`}
                  disabled={gameStatus !== 'playing'}
                >
                  {key === 'BACK' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
