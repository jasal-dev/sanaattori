/**
 * Tests for LanguageSwitcher component
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageSwitcher from '../LanguageSwitcher';
import { LocaleProvider } from '../../context/LocaleContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders the language switcher button', async () => {
    render(
      <LocaleProvider>
        <LanguageSwitcher />
      </LocaleProvider>
    );

    // Wait for the component to mount and load locale from storage
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /change language/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('shows language dropdown when clicked', async () => {
    render(
      <LocaleProvider>
        <LanguageSwitcher />
      </LocaleProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /change language/i });
      fireEvent.click(button);
    });

    // Check that all language options are visible
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Suomi')).toBeInTheDocument();
      expect(screen.getByText('Svenska')).toBeInTheDocument();
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
    });
  });

  it('changes language when option is clicked', async () => {
    render(
      <LocaleProvider>
        <LanguageSwitcher />
      </LocaleProvider>
    );

    // Open dropdown
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /change language/i });
      fireEvent.click(button);
    });

    // Click on Finnish
    await waitFor(() => {
      const finnishOption = screen.getByText('Suomi');
      fireEvent.click(finnishOption);
    });

    // Check that locale was stored
    await waitFor(() => {
      expect(localStorageMock.getItem('sanaattori-locale')).toBe('fi');
    });
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <LocaleProvider>
        <div data-testid="outside">
          <LanguageSwitcher />
        </div>
      </LocaleProvider>
    );

    // Open dropdown
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /change language/i });
      fireEvent.click(button);
    });

    // Verify dropdown is open
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    // Click outside
    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    // Verify dropdown is closed
    await waitFor(() => {
      expect(screen.queryByText('English')).not.toBeInTheDocument();
    });
  });
});
