/**
 * Tests for Board component box selection feature
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import Board from '../Board';
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

// Helper component to test game state
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      {children}
    </GameProvider>
  );
}

describe('Board Component - Box Selection', () => {
  it('allows clicking on boxes in the current row', () => {
    const { container } = render(
      <TestWrapper>
        <Board />
      </TestWrapper>
    );

    // Get all letter boxes
    const boxes = container.querySelectorAll('.w-14.h-14');
    expect(boxes.length).toBeGreaterThan(0);

    // Click on the first box in the first row (current row)
    act(() => {
      fireEvent.click(boxes[0]);
    });

    // The box should have the selected ring
    expect(boxes[0]).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('displays cursor pointer on current row boxes', () => {
    const { container } = render(
      <TestWrapper>
        <Board />
      </TestWrapper>
    );

    // Get boxes in the first row (current row)
    const boxes = container.querySelectorAll('.w-14.h-14');
    
    // Current row boxes should have cursor-pointer
    expect(boxes[0]).toHaveClass('cursor-pointer');
  });

  it('highlights the selected box', () => {
    const { container } = render(
      <TestWrapper>
        <Board />
      </TestWrapper>
    );

    const boxes = container.querySelectorAll('.w-14.h-14');
    
    // Click on the second box
    act(() => {
      fireEvent.click(boxes[1]);
    });

    // Second box should be highlighted
    expect(boxes[1]).toHaveClass('ring-2', 'ring-blue-500');
    
    // First box should not be highlighted
    expect(boxes[0]).not.toHaveClass('ring-2');
  });
});
