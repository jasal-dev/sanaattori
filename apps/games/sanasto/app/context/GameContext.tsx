'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type GameState, type GameSettings, type Guess, type LetterState } from '../types/game';
import { evaluateGuess, updateRevealedLetters, getRandomSolution } from '../utils/evaluation';
import { updateStatsAfterGame } from '../utils/stats';
import { getHardModeConstraints, validateHardMode } from '../utils/hardMode';
import { validateGuess as apiValidateGuess, submitGameResult as apiSubmitGameResult } from '../utils/api';

interface GameContextType {
  gameState: GameState;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => Promise<void>;
  startNewGame: () => Promise<void>;
  updateSettings: (settings: Partial<GameSettings>) => void;
  hardModeError: string | null;
  clearHardModeError: () => void;
  setSelectedBoxIndex: (index: number | null) => void;
  shouldShake: boolean;
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
    selectedBoxIndex: 0, // Default to first box
  });
  const [initialized, setInitialized] = useState(false);
  const [hardModeError, setHardModeError] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState(false);

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
      selectedBoxIndex: 0, // Default to first box
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

  const setSelectedBoxIndex = useCallback((index: number | null) => {
    setGameState(prev => {
      if (prev.gameStatus !== 'playing') return prev;
      return {
        ...prev,
        selectedBoxIndex: index,
      };
    });
  }, []);

  // Helper function to remove trailing null characters from guess array
  const trimGuessArray = (guessArray: string[]): string => {
    let lastNonEmpty = -1;
    for (let i = guessArray.length - 1; i >= 0; i--) {
      if (guessArray[i] !== '' && guessArray[i] !== '\0') {
        lastNonEmpty = i;
        break;
      }
    }
    // Keep null characters for positions before the last letter
    const trimmed = guessArray.slice(0, lastNonEmpty + 1);
    return trimmed.join('');
  };

  const addLetter = useCallback((letter: string) => {
    setGameState(prev => {
      // Don't add if game is over
      if (prev.gameStatus !== 'playing') return prev;
      
      const { currentGuess, settings, selectedBoxIndex } = prev;
      const wordLength = settings.wordLength;
      
      // selectedBoxIndex should always be set, but default to 0 as safety
      const targetIndex = selectedBoxIndex ?? 0;
      
      // If there's a target box, insert letter there
      if (targetIndex >= 0 && targetIndex < wordLength) {
        // Convert currentGuess to fixed-length array, using '\0' for empty positions
        const guessArray = currentGuess.split('');
        
        // Pad with null characters to maintain position
        while (guessArray.length < wordLength) {
          guessArray.push('\0');
        }
        
        // Insert the letter at the target position
        guessArray[targetIndex] = letter.toLowerCase();
        
        // Move to the next empty box or deselect if at the end
        let nextIndex: number | null = null;
        for (let i = targetIndex + 1; i < wordLength; i++) {
          if (!guessArray[i] || guessArray[i] === '\0') {
            nextIndex = i;
            break;
          }
        }
        
        // Join array, keeping null characters to preserve positions
        return {
          ...prev,
          currentGuess: guessArray.join(''),
          selectedBoxIndex: nextIndex,
        };
      }
      
      // Fallback: append to the end if not at max length
      if (currentGuess.length >= wordLength) return prev;
      
      return {
        ...prev,
        currentGuess: currentGuess + letter.toLowerCase(),
      };
    });
  }, []);

  const removeLetter = useCallback(() => {
    setGameState(prev => {
      if (prev.gameStatus !== 'playing') return prev;
      
      const { currentGuess, selectedBoxIndex, settings } = prev;
      const wordLength = settings.wordLength;
      
      if (currentGuess.replace(/\0/g, '').length === 0) return prev; // No real letters
      
      // selectedBoxIndex should always be set
      if (selectedBoxIndex !== null && selectedBoxIndex >= 0 && selectedBoxIndex < wordLength) {
        const guessArray = currentGuess.split('');
        
        // Pad with null characters if needed
        while (guessArray.length < wordLength) {
          guessArray.push('\0');
        }
        
        // Check if there's a letter at the selected position
        if (guessArray[selectedBoxIndex] && guessArray[selectedBoxIndex] !== '\0') {
          // Remove the letter at the selected position
          guessArray[selectedBoxIndex] = '\0';
          
          return {
            ...prev,
            currentGuess: trimGuessArray(guessArray),
            // Keep the same box selected
          };
        } else if (selectedBoxIndex > 0) {
          // If current box is empty, just move selection to the previous box
          // This allows users to step through empty boxes with backspace
          return {
            ...prev,
            selectedBoxIndex: selectedBoxIndex - 1,
          };
        }
        
        return prev;
      }
      
      // Fallback: remove from the end and select the previous position
      const newGuess = currentGuess.slice(0, -1);
      const newSelectedIndex = newGuess.replace(/\0/g, '').length > 0 ? newGuess.length - 1 : 0;
      
      return {
        ...prev,
        currentGuess: newGuess,
        selectedBoxIndex: newSelectedIndex,
      };
    });
  }, []);

  const submitGuess = useCallback(async () => {
    const { currentGuess, solution, guesses, settings, revealedLetters } = gameState;
    
    // Strip null characters for validation
    const cleanGuess = currentGuess.replace(/\0/g, '');
    
    // Validate guess length
    if (cleanGuess.length !== settings.wordLength) {
      return;
    }
    
    // Hard mode validation
    if (settings.hardMode && guesses.length > 0) {
      const constraints = getHardModeConstraints(guesses);
      const error = validateHardMode(cleanGuess, constraints);
      if (error) {
        setHardModeError(error);
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
        return; // Don't submit if hard mode violation
      }
    }
    
    // API validation - check if the guess is a valid word
    const isValidWord = await apiValidateGuess(cleanGuess, settings.wordLength);
    if (!isValidWord) {
      setHardModeError('Not in word list');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return; // Don't submit if not a valid word
    }
    
    // Evaluate the guess
    const letters = evaluateGuess(cleanGuess, solution);
    const newGuess: Guess = {
      word: cleanGuess,
      letters,
    };
    
    // Update revealed letters
    const newRevealedLetters = updateRevealedLetters(revealedLetters, letters);
    
    // Check if won (use cleaned guess)
    const won = cleanGuess.toLowerCase() === solution.toLowerCase();
    const newGuesses = [...guesses, newGuess];
    const lost = !won && newGuesses.length >= settings.maxAttempts;
    
    // Update stats if game ended
    if (won || lost) {
      // Calculate score: number of guesses for win, 0 for loss
      const score = won ? newGuesses.length : 0;
      
      // Submit to backend (will fail silently if not authenticated)
      apiSubmitGameResult(score, settings.wordLength, settings.hardMode).catch(err => {
        console.log('Failed to submit game result to backend:', err);
      });
      
      // Also update localStorage stats with variation tracking
      const variation = {
        wordLength: settings.wordLength,
        hardMode: settings.hardMode,
      };
      updateStatsAfterGame(variation, won, won ? newGuesses.length : undefined);
    }
    
    setGameState(prev => ({
      ...prev,
      guesses: newGuesses,
      currentGuess: '',
      gameStatus: won ? 'won' : lost ? 'lost' : 'playing',
      revealedLetters: newRevealedLetters,
      selectedBoxIndex: 0, // Default to first box for new row
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
        setSelectedBoxIndex,
        shouldShake,
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
