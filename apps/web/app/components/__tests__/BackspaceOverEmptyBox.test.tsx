/**
 * Test for backspace behavior over empty boxes
 * Scenario: type KI_SA (with empty box at position 2) then backspace should work across empty boxes
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
  
  React.useEffect(() => {
    onStateChange(gameState);
  }, [gameState, onStateChange]);
  
  return null;
}

describe('Backspace Over Empty Box', () => {
  it('should handle backspace correctly when there are empty boxes: KI_SA -> backspace through all', async () => {
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

    const boxes = container.querySelectorAll('.w-14.h-14');

    // Type 'K' at position 0
    act(() => {
      fireEvent.keyDown(window, { key: 'k' });
    });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 50)));

    // Type 'I' at position 1
    act(() => {
      fireEvent.keyDown(window, { key: 'i' });
    });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 50)));

    // Press space to skip position 2
    act(() => {
      fireEvent.keyDown(window, { key: ' ' });
    });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 50)));

    // Type 'S' at position 3
    act(() => {
      fireEvent.keyDown(window, { key: 's' });
    });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 50)));

    // Type 'A' at position 4
    act(() => {
      fireEvent.keyDown(window, { key: 'a' });
    });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 50)));

    // Verify we have KI_SA
    expect(boxes[0].textContent).toBe('k');
    expect(boxes[1].textContent).toBe('i');
    expect(boxes[2].textContent).toBe(''); // empty
    expect(boxes[3].textContent).toBe('s');
    expect(boxes[4].textContent).toBe('a');
    expect(capturedState.selectedBoxIndex).toBe(null); // No next empty box

    // Now test backspace behavior
    // First backspace with selectedBoxIndex = null should remove last letter 'A'
    act(() => {
      fireEvent.keyDown(window, { key: 'Backspace' });
    });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 50)));

    expect(boxes[4].textContent).toBe(''); // 'A' removed
    expect(capturedState.selectedBoxIndex).toBe(3); // Should select where 'S' is

    // Press backspace again - should remove 'S' and select position 3
    act(() => {
      fireEvent.keyDown(window, { key: 'Backspace' });
    });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 50)));

    expect(boxes[3].textContent).toBe(''); // 'S' removed
    expect(capturedState.selectedBoxIndex).toBe(3); // Stays at position 3

    // Press backspace again - should SKIP empty position 2 and remove 'I', select position 1
    act(() => {
      fireEvent.keyDown(window, { key: 'Backspace' });
    });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 50)));

    expect(boxes[2].textContent).toBe(''); // Still empty
    expect(boxes[1].textContent).toBe(''); // 'I' removed
    expect(capturedState.selectedBoxIndex).toBe(1); // Selected position 1

    // Press backspace again - should remove 'K' and select position 0
    act(() => {
      fireEvent.keyDown(window, { key: 'Backspace' });
    });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 50)));

    expect(boxes[0].textContent).toBe(''); // 'K' removed
    expect(capturedState.selectedBoxIndex).toBe(0);
  });
});
