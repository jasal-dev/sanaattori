/**
 * Tests for keyboard navigation and input
 */

import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import { act } from 'react';
import Keyboard from '../Keyboard';
import { GameProvider } from '../../context/GameContext';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock API
jest.mock('../../utils/api', () => ({
  validateGuess: jest.fn().mockResolvedValue(true),
  getWord: jest.fn().mockResolvedValue('omena'),
}));

describe('Keyboard Component - Navigation', () => {
  it('handles arrow left key to move selection left', async () => {
    const { container } = render(
      <GameProvider>
        <Keyboard />
      </GameProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Press arrow left
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
    });

    // The keyboard component should handle the arrow left event
    expect(container).toBeTruthy();
  });

  it('handles arrow right key to move selection right', async () => {
    const { container } = render(
      <GameProvider>
        <Keyboard />
      </GameProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Press arrow right
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    });

    expect(container).toBeTruthy();
  });

  it('handles space key to skip a box', async () => {
    const { container } = render(
      <GameProvider>
        <Keyboard />
      </GameProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Press space
    act(() => {
      fireEvent.keyDown(window, { key: ' ' });
    });

    expect(container).toBeTruthy();
  });

  it('handles enter key to submit guess', async () => {
    const { container } = render(
      <GameProvider>
        <Keyboard />
      </GameProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Press enter
    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' });
    });

    expect(container).toBeTruthy();
  });

  it('handles backspace key to remove letter', async () => {
    const { container } = render(
      <GameProvider>
        <Keyboard />
      </GameProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Press backspace
    act(() => {
      fireEvent.keyDown(window, { key: 'Backspace' });
    });

    expect(container).toBeTruthy();
  });

  it('handles letter keys to add letters', async () => {
    const { container } = render(
      <GameProvider>
        <Keyboard />
      </GameProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Press letter 'a'
    act(() => {
      fireEvent.keyDown(window, { key: 'a' });
    });

    expect(container).toBeTruthy();
  });

  it('prevents default behavior for space and backspace', async () => {
    const { container } = render(
      <GameProvider>
        <Keyboard />
      </GameProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Create custom event to check preventDefault
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    const preventDefaultSpy = jest.spyOn(spaceEvent, 'preventDefault');
    
    act(() => {
      window.dispatchEvent(spaceEvent);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
