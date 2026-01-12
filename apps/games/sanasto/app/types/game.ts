/**
 * Types for the Wordle-style game
 */

export type LetterState = 'correct' | 'present' | 'absent' | 'unknown';

export interface Letter {
  char: string;
  state: LetterState;
}

export interface Guess {
  word: string;
  letters: Letter[];
}

export interface GameSettings {
  wordLength: 5 | 6 | 7;
  hardMode: boolean;
  maxAttempts: number;
}

export interface GameState {
  solution: string;
  guesses: Guess[];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  settings: GameSettings;
  revealedLetters: Map<string, LetterState>;
  selectedBoxIndex: number | null;
}
