/**
 * Tests for Board component with New Game button
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Board from '../Board';
import { GameProvider } from '../../context/GameContext';

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

describe('Board Component', () => {
  it('renders the game board with empty cells', () => {
    const { container } = render(
      <GameProvider>
        <Board />
      </GameProvider>
    );

    // Board should render with letter cells
    const cells = container.querySelectorAll('.w-14.h-14');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('does not show New Game button during active game', () => {
    render(
      <GameProvider>
        <Board />
      </GameProvider>
    );

    // New Game button should not be visible during gameplay
    const newGameButton = screen.queryByRole('button', { name: /new game/i });
    expect(newGameButton).not.toBeInTheDocument();
  });
});
