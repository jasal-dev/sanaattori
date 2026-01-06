'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type GameState, type GameSettings, type Guess, type LetterState } from '../types/game';
import { evaluateGuess, updateRevealedLetters, getRandomSolution } from '../utils/evaluation';
import { updateStatsAfterGame } from '../utils/stats';
import { getHardModeConstraints, validateHardMode } from '../utils/hardMode';

interface GameContextType {
  gameState: GameState;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => Promise<void>;
  startNewGame: () => Promise<void>;
  updateSettings: (settings: Partial<GameSettings>) => void;
  hardModeError: string | null;
  clearHardModeError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const DEFAULT_SETTINGS: GameSettings = {
  wordLength: 5,
  hardMode: false,
  maxAttempts: 6,
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({
    solution: '',
    guesses: [],
    currentGuess: '',
    gameStatus: 'playing',
    settings: DEFAULT_SETTINGS,
    revealedLetters: new Map(),
  });
  const [initialized, setInitialized] = useState(false);
  const [hardModeError, setHardModeError] = useState<string | null>(null);

  const clearHardModeError = useCallback(() => {
    setHardModeError(null);
  }, []);

  const startNewGame = useCallback(async () => {
    const wordLength = gameState.settings.wordLength || 5;
    const solution = await getRandomSolution(wordLength);
    
    setGameState(prev => ({
      ...prev,
      solution,
      guesses: [],
      currentGuess: '',
      gameStatus: 'playing',
      revealedLetters: new Map(),
    }));
  }, [gameState.settings.wordLength]);

  // Initialize game on mount
  useEffect(() => {
    if (!initialized) {
      startNewGame();
      setInitialized(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setGameState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  const addLetter = useCallback((letter: string) => {
    setGameState(prev => {
      // Don't add if game is over
      if (prev.gameStatus !== 'playing') return prev;
      
      // Don't add if current guess is already at max length
      if (prev.currentGuess.length >= prev.settings.wordLength) return prev;
      
      return {
        ...prev,
        currentGuess: prev.currentGuess + letter.toLowerCase(),
      };
    });
  }, []);

  const removeLetter = useCallback(() => {
    setGameState(prev => {
      if (prev.gameStatus !== 'playing') return prev;
      if (prev.currentGuess.length === 0) return prev;
      
      return {
        ...prev,
        currentGuess: prev.currentGuess.slice(0, -1),
      };
    });
  }, []);

  const submitGuess = useCallback(async () => {
    const { currentGuess, solution, guesses, settings, revealedLetters } = gameState;
    
    // Validate guess length
    if (currentGuess.length !== settings.wordLength) {
      return;
    }
    
    // Hard mode validation
    if (settings.hardMode && guesses.length > 0) {
      const constraints = getHardModeConstraints(guesses);
      const error = validateHardMode(currentGuess, constraints);
      if (error) {
        setHardModeError(error);
        return; // Don't submit if hard mode violation
      }
    }
    
    // Evaluate the guess
    const letters = evaluateGuess(currentGuess, solution);
    const newGuess: Guess = {
      word: currentGuess,
      letters,
    };
    
    // Update revealed letters
    const newRevealedLetters = updateRevealedLetters(revealedLetters, letters);
    
    // Check if won
    const won = currentGuess.toLowerCase() === solution.toLowerCase();
    const newGuesses = [...guesses, newGuess];
    const lost = !won && newGuesses.length >= settings.maxAttempts;
    
    // Update stats if game ended
    if (won || lost) {
      updateStatsAfterGame(won);
    }
    
    setGameState(prev => ({
      ...prev,
      guesses: newGuesses,
      currentGuess: '',
      gameStatus: won ? 'won' : lost ? 'lost' : 'playing',
      revealedLetters: newRevealedLetters,
    }));
  }, [gameState]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        addLetter,
        removeLetter,
        submitGuess,
        startNewGame,
        updateSettings,
        hardModeError,
        clearHardModeError,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
