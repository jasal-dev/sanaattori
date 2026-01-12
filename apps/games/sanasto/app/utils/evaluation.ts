/**
 * Wordle evaluation logic
 * 
 * This implements the standard Wordle rules:
 * - Green (correct): letter is in the correct position
 * - Yellow (present): letter is in the word but in the wrong position
 * - Gray (absent): letter is not in the word
 * 
 * Special handling for duplicate letters:
 * - If a letter appears multiple times in the guess but fewer times in the solution,
 *   only the correct positions and the first wrong positions get marked as correct/present
 */

import { type Letter, type LetterState } from '../types/game';

export function evaluateGuess(guess: string, solution: string): Letter[] {
  const guessChars = guess.toLowerCase().split('');
  const solutionChars = solution.toLowerCase().split('');
  const result: Letter[] = [];
  
  // Track which solution positions have been matched
  const solutionUsed = new Array(solutionChars.length).fill(false);
  
  // First pass: Mark correct letters (green)
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === solutionChars[i]) {
      result[i] = { char: guessChars[i], state: 'correct' };
      solutionUsed[i] = true;
    } else {
      result[i] = { char: guessChars[i], state: 'absent' };
    }
  }
  
  // Second pass: Mark present letters (yellow)
  for (let i = 0; i < guessChars.length; i++) {
    // Skip if already marked as correct
    if (result[i].state === 'correct') {
      continue;
    }
    
    // Check if the letter exists elsewhere in the solution
    const char = guessChars[i];
    for (let j = 0; j < solutionChars.length; j++) {
      if (!solutionUsed[j] && solutionChars[j] === char) {
        result[i] = { char, state: 'present' };
        solutionUsed[j] = true;
        break;
      }
    }
  }
  
  return result;
}

/**
 * Update the keyboard state based on the revealed letters from all guesses
 */
export function updateRevealedLetters(
  revealedLetters: Map<string, LetterState>,
  letters: Letter[]
): Map<string, LetterState> {
  const updated = new Map(revealedLetters);
  
  for (const letter of letters) {
    const char = letter.char.toLowerCase();
    const currentState = updated.get(char);
    
    // Priority: correct > present > absent
    if (letter.state === 'correct') {
      updated.set(char, 'correct');
    } else if (letter.state === 'present' && currentState !== 'correct') {
      updated.set(char, 'present');
    } else if (letter.state === 'absent' && !currentState) {
      updated.set(char, 'absent');
    }
  }
  
  return updated;
}

/**
 * Get a random solution from the backend API
 */
export async function getRandomSolution(wordLength: number): Promise<string> {
  const { getWord } = await import('./api');
  return getWord(wordLength);
}
