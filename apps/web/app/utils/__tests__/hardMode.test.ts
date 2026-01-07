import { getHardModeConstraints, validateHardMode } from '../hardMode';
import { type Guess } from '../../types/game';

describe('getHardModeConstraints', () => {
  it('should extract constraints from green letters', () => {
    const guesses: Guess[] = [
      {
        word: 'kissa',
        letters: [
          { char: 'k', state: 'correct' },
          { char: 'i', state: 'absent' },
          { char: 's', state: 'absent' },
          { char: 's', state: 'absent' },
          { char: 'a', state: 'absent' },
        ],
      },
    ];

    const constraints = getHardModeConstraints(guesses);

    expect(constraints).toHaveLength(1);
    expect(constraints[0].letter).toBe('k');
    expect(constraints[0].mustInclude).toBe(true);
    expect(constraints[0].positions).toContainEqual({ index: 0, mustBeHere: true });
  });

  it('should extract constraints from yellow letters', () => {
    const guesses: Guess[] = [
      {
        word: 'omena',
        letters: [
          { char: 'o', state: 'present' },
          { char: 'm', state: 'absent' },
          { char: 'e', state: 'absent' },
          { char: 'n', state: 'absent' },
          { char: 'a', state: 'absent' },
        ],
      },
    ];

    const constraints = getHardModeConstraints(guesses);

    expect(constraints).toHaveLength(1);
    expect(constraints[0].letter).toBe('o');
    expect(constraints[0].mustInclude).toBe(true);
    expect(constraints[0].positions).toContainEqual({ index: 0, mustBeHere: false });
  });

  it('should not add constraints for gray letters', () => {
    const guesses: Guess[] = [
      {
        word: 'omena',
        letters: [
          { char: 'o', state: 'absent' },
          { char: 'm', state: 'absent' },
          { char: 'e', state: 'absent' },
          { char: 'n', state: 'absent' },
          { char: 'a', state: 'absent' },
        ],
      },
    ];

    const constraints = getHardModeConstraints(guesses);

    expect(constraints).toHaveLength(0);
  });
});

describe('validateHardMode', () => {
  it('should return null for valid guess with green constraint', () => {
    const constraints = [
      {
        letter: 'k',
        mustInclude: true,
        positions: [{ index: 0, mustBeHere: true }],
      },
    ];

    const result = validateHardMode('kissa', constraints);

    expect(result).toBeNull();
  });

  it('should return error if green letter not in correct position', () => {
    const constraints = [
      {
        letter: 'k',
        mustInclude: true,
        positions: [{ index: 0, mustBeHere: true }],
      },
    ];

    const result = validateHardMode('iskka', constraints);

    expect(result).toBe('K must be in position 1');
  });

  it('should return error if yellow letter is missing', () => {
    const constraints = [
      {
        letter: 'o',
        mustInclude: true,
        positions: [{ index: 0, mustBeHere: false }],
      },
    ];

    const result = validateHardMode('kissa', constraints);

    expect(result).toBe('Must include "O"');
  });

  it('should return error if yellow letter in same position', () => {
    const constraints = [
      {
        letter: 'o',
        mustInclude: true,
        positions: [{ index: 0, mustBeHere: false }],
      },
    ];

    const result = validateHardMode('omena', constraints);

    expect(result).toBe('O cannot be in position 1');
  });

  it('should allow yellow letter in different position', () => {
    const constraints = [
      {
        letter: 'o',
        mustInclude: true,
        positions: [{ index: 0, mustBeHere: false }],
      },
    ];

    const result = validateHardMode('koira', constraints);

    expect(result).toBeNull();
  });
});
