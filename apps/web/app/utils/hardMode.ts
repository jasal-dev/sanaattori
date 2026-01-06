/**
 * Hard mode validation logic
 * 
 * Hard mode rules:
 * - Green letters must stay in the same position
 * - Yellow/green letters must be used in future guesses
 * - Must meet minimum counts for duplicate letters
 */

import { type Guess, type Letter } from '../types/game';

export interface HardModeConstraint {
  letter: string;
  mustInclude: boolean; // Must be present somewhere in word
  positions: {
    index: number;
    mustBeHere: boolean; // true for green, false for yellow
  }[];
}

/**
 * Extract constraints from previous guesses
 */
export function getHardModeConstraints(guesses: Guess[]): HardModeConstraint[] {
  const constraints = new Map<string, HardModeConstraint>();

  for (const guess of guesses) {
    for (let i = 0; i < guess.letters.length; i++) {
      const letter = guess.letters[i];
      const char = letter.char.toLowerCase();

      if (letter.state === 'absent') {
        continue; // Gray letters don't add constraints
      }

      if (!constraints.has(char)) {
        constraints.set(char, {
          letter: char,
          mustInclude: false,
          positions: [],
        });
      }

      const constraint = constraints.get(char)!;

      if (letter.state === 'correct') {
        // Green: must be in this exact position
        constraint.mustInclude = true;
        const existingPos = constraint.positions.find((p) => p.index === i);
        if (existingPos) {
          existingPos.mustBeHere = true;
        } else {
          constraint.positions.push({ index: i, mustBeHere: true });
        }
      } else if (letter.state === 'present') {
        // Yellow: must be somewhere, but not here
        constraint.mustInclude = true;
        const existingPos = constraint.positions.find((p) => p.index === i);
        if (!existingPos) {
          constraint.positions.push({ index: i, mustBeHere: false });
        }
      }
    }
  }

  return Array.from(constraints.values());
}

/**
 * Validate a guess against hard mode constraints
 * Returns null if valid, or an error message if invalid
 */
export function validateHardMode(guess: string, constraints: HardModeConstraint[]): string | null {
  const guessLower = guess.toLowerCase();

  for (const constraint of constraints) {
    // Check if letter must be included
    if (constraint.mustInclude) {
      const count = guessLower.split(constraint.letter).length - 1;
      if (count === 0) {
        return `Must include "${constraint.letter.toUpperCase()}"`;
      }
    }

    // Check position constraints
    for (const pos of constraint.positions) {
      if (pos.mustBeHere) {
        // Green: must be in this exact position
        if (guessLower[pos.index] !== constraint.letter) {
          return `${constraint.letter.toUpperCase()} must be in position ${pos.index + 1}`;
        }
      } else {
        // Yellow: must NOT be in this position (but somewhere else)
        if (guessLower[pos.index] === constraint.letter) {
          return `${constraint.letter.toUpperCase()} cannot be in position ${pos.index + 1}`;
        }
      }
    }
  }

  return null; // Valid
}
