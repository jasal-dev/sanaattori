/**
 * Test for space key behavior bug
 * Scenario: type letter -> press space -> type letter
 * Expected: letters should be in positions 0 and 2, not 0 and 1
 */

import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import { act } from 'react';
import React from 'react';
import Board from '../Board';
import Keyboard from '../Keyboard';
import { GameProvider, useGame } from '../../context/GameContext';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    const translations: Record<string, string> = {
      won: '🎉 You won!',
      lost: `Game over! The word was: ${params?.word || 'WORD'}`,
      newGame: 'New Game',
    };
    return translations[key] || key;
  },
}));

// Mock API
jest.mock('../../utils/api', () => ({
  validateGuess: jest.fn().mockResolvedValue(true),
  getWord: jest.fn().mockResolvedValue('omena'),
}));

// Helper component to inspect game state
function GameStateInspector({ onStateChange }: { onStateChange: (state: any) => void }) {
  const { gameState } = useGame();
  
  // Call onStateChange whenever state changes
  React.useEffect(() => {
    onStateChange(gameState);
  }, [gameState, onStateChange]);
  
  return null;
}

describe('Space Key Behavior Bug', () => {
  it('should handle type-space-type correctly: letter at positions 0 and 2', async () => {
    let capturedState: any = null;
    const onStateChange = (state: any) => {
      capturedState = state;
    };

    const { container } = render(
      <GameProvider>
        <GameStateInspector onStateChange={onStateChange} />
        <Board />
        <Keyboard />
      </GameProvider>
    );

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Type 'a' - should go in position 0, select position 1
    act(() => {
      fireEvent.keyDown(window, { key: 'a' });
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify: selectedBoxIndex should be 1
    expect(capturedState.selectedBoxIndex).toBe(1);
    
    // Check that 'a' is in position 0 by inspecting the rendered boxes
    const boxes = container.querySelectorAll('.w-14.h-14');
    expect(boxes[0].textContent).toBe('a');
    expect(boxes[1].textContent).toBe('');

    // Press space - should skip position 1, select position 2
    act(() => {
      fireEvent.keyDown(window, { key: ' ' });
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify: selectedBoxIndex should be 2
    expect(capturedState.selectedBoxIndex).toBe(2);

    // Type 'b' - should go in position 2, select position 3
    act(() => {
      fireEvent.keyDown(window, { key: 'b' });
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify: the rendered boxes should show 'a' at 0, empty at 1, 'b' at 2
    expect(boxes[0].textContent).toBe('a');
    expect(boxes[1].textContent).toBe(''); // This should be empty!
    expect(boxes[2].textContent).toBe('b');
    expect(capturedState.selectedBoxIndex).toBe(3);
    
    console.log('Test passed! Letters are at correct positions: 0 and 2');
  });
});
