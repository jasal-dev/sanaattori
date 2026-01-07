import { evaluateGuess, updateRevealedLetters } from '../evaluation';

describe('evaluateGuess', () => {
  it('should mark all letters as correct for exact match', () => {
    const result = evaluateGuess('kissa', 'kissa');
    
    expect(result).toHaveLength(5);
    expect(result.every(letter => letter.state === 'correct')).toBe(true);
    expect(result.map(l => l.char).join('')).toBe('kissa');
  });

  it('should mark letters as absent when not in solution', () => {
    const result = evaluateGuess('omena', 'kissa');
    
    expect(result).toHaveLength(5);
    // kissa = k-i-s-s-a (positions 0,1,2,3,4)
    // omena = o-m-e-n-a (positions 0,1,2,3,4)
    // 'a' at position 4 in both - should be correct!
    expect(result[0]).toEqual({ char: 'o', state: 'absent' });
    expect(result[1]).toEqual({ char: 'm', state: 'absent' });
    expect(result[2]).toEqual({ char: 'e', state: 'absent' });
    expect(result[3]).toEqual({ char: 'n', state: 'absent' });
    expect(result[4]).toEqual({ char: 'a', state: 'correct' }); // Same position!
  });

  it('should mark letters as present when in wrong position', () => {
    // Using a simpler example: guess 'koira', solution 'kissa'
    const result = evaluateGuess('koira', 'kissa');
    
    // k at position 0: correct
    expect(result[0]).toEqual({ char: 'k', state: 'correct' });
    // o at position 1: absent (not in kissa)
    expect(result[1]).toEqual({ char: 'o', state: 'absent' });
    // i at position 2: present (exists at position 1 and 4 in kissa)
    expect(result[2]).toEqual({ char: 'i', state: 'present' });
    // r at position 3: absent (not in kissa)
    expect(result[3]).toEqual({ char: 'r', state: 'absent' });
    // a at position 4: correct (matches position 4 in kissa)
    expect(result[4]).toEqual({ char: 'a', state: 'correct' });
  });

  it('should handle duplicate letters correctly', () => {
    // Guess has four 's', solution 'kissa' has two 's' (at positions 2 and 3)
    const result = evaluateGuess('ssss', 'kissa');
    
    // Two s's should be marked (one at position 2, one at position 3)
    // First two s's should get marked as present/correct
    // The other two should be absent
    const correctOrPresentCount = result.filter(r => r.state === 'correct' || r.state === 'present').length;
    expect(correctOrPresentCount).toBe(2); // Only 2 s's in solution
    
    // At least some should be absent
    const absentCount = result.filter(r => r.state === 'absent').length;
    expect(absentCount).toBe(2); // 2 extra s's should be absent
  });

  it('should handle Finnish characters', () => {
    const result = evaluateGuess('pöytä', 'pöytä');
    
    expect(result).toHaveLength(5);
    expect(result.every(letter => letter.state === 'correct')).toBe(true);
    expect(result.map(l => l.char).join('')).toBe('pöytä');
  });

  it('should be case insensitive', () => {
    const result1 = evaluateGuess('KISSA', 'kissa');
    const result2 = evaluateGuess('kissa', 'KISSA');
    
    expect(result1.every(letter => letter.state === 'correct')).toBe(true);
    expect(result2.every(letter => letter.state === 'correct')).toBe(true);
  });
});

describe('updateRevealedLetters', () => {
  it('should update revealed letters map', () => {
    const map = new Map();
    const letters = [
      { char: 'k', state: 'correct' as const },
      { char: 'i', state: 'present' as const },
      { char: 's', state: 'absent' as const },
    ];
    
    const updated = updateRevealedLetters(map, letters);
    
    expect(updated.get('k')).toBe('correct');
    expect(updated.get('i')).toBe('present');
    expect(updated.get('s')).toBe('absent');
  });

  it('should prioritize correct over present', () => {
    const map = new Map([['a', 'present' as const]]);
    const letters = [{ char: 'a', state: 'correct' as const }];
    
    const updated = updateRevealedLetters(map, letters);
    
    expect(updated.get('a')).toBe('correct');
  });

  it('should prioritize present over absent', () => {
    const map = new Map([['a', 'absent' as const]]);
    const letters = [{ char: 'a', state: 'present' as const }];
    
    const updated = updateRevealedLetters(map, letters);
    
    expect(updated.get('a')).toBe('present');
  });

  it('should not downgrade correct to present', () => {
    const map = new Map([['a', 'correct' as const]]);
    const letters = [{ char: 'a', state: 'present' as const }];
    
    const updated = updateRevealedLetters(map, letters);
    
    expect(updated.get('a')).toBe('correct');
  });
});
