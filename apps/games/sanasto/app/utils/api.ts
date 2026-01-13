/**
 * API client for the FastAPI backend
 */

/**
 * Get the API base URL based on environment or current hostname
 * This allows the app to work when accessed from different machines on the network
 */
function getApiBaseUrl(): string {
  // If explicitly set via environment variable, use that
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If running in the browser, use the current hostname with /api path
  // This works with the nginx reverse proxy setup
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    // Use the same host:port as the current page, with /api path
    const baseUrl = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
    return `${baseUrl}/api`;
  }

  // Fall back to localhost for server-side rendering
  return 'http://localhost:8000';
}

const API_BASE_URL = getApiBaseUrl();

// Track if we've already warned about API connectivity
let apiWarningShown = false;

export interface ValidateGuessRequest {
  language: string;
  wordLength: number;
  guess: string;
}

export interface ValidateGuessResponse {
  valid: boolean;
}

export interface GetWordResponse {
  word: string;
}

export async function validateGuess(
  guess: string,
  wordLength: number
): Promise<boolean> {
  try {
    // Add timeout to fetch request to avoid long waits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/validate-guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'fi',
        wordLength,
        guess,
      } as ValidateGuessRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (!apiWarningShown) {
        console.warn('API validation unavailable - all guesses will be accepted. Start the API server for word validation.');
        apiWarningShown = true;
      }
      return true; // Fail open - allow guess if API is down
    }

    const data: ValidateGuessResponse = await response.json();
    return data.valid;
  } catch (error) {
    // Only show warning once to avoid console spam
    if (!apiWarningShown) {
      console.warn('API validation unavailable - all guesses will be accepted. Start the API server for word validation.');
      apiWarningShown = true;
    }
    return true; // Fail open - allow guess if API is unreachable
  }
}

export async function getWord(wordLength: number): Promise<string> {
  try {
    // Add timeout to fetch request to avoid long waits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/word?wordLength=${wordLength}`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (!apiWarningShown) {
        console.warn('API unavailable - using fallback word. Start the API server for random words.');
        apiWarningShown = true;
      }
      // Fallback to local file loading if API is down
      return getFallbackWord(wordLength);
    }

    const data: GetWordResponse = await response.json();
    return data.word;
  } catch (error) {
    // Only show warning once to avoid console spam
    if (!apiWarningShown) {
      console.warn('API unavailable - using fallback word. Start the API server for random words.');
      apiWarningShown = true;
    }
    // Fallback to local file loading if API is unreachable
    return getFallbackWord(wordLength);
  }
}

async function getFallbackWord(wordLength: number): Promise<string> {
  try {
    const response = await fetch(`/data/processed/fi_solutions_${wordLength}.txt`);
    const text = await response.text();
    const words = text.trim().split('\n').filter(word => word.length === wordLength);
    
    if (words.length === 0) {
      throw new Error(`No solutions available for length ${wordLength}`);
    }
    
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex].toLowerCase();
  } catch (error) {
    console.error('Error loading solution:', error);
    // Fallback to a default word for each length
    const fallbacks: Record<number, string> = {
      5: 'omena',
      6: 'ajatus',
      7: 'ihminen',
    };
    return fallbacks[wordLength] || 'omena';
  }
}

// ==================== Authentication Endpoints ====================

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: number;
    username: string;
  };
}

export interface UserProfile {
  id: number;
  username: string;
  created_at: string;
}

export interface UserStats {
  played: number;
  won: number;
  lost: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
}

export interface GameResult {
  id: number;
  user_id: number;
  score: number;
  played_at: string;
}

export interface GameHistory {
  games: GameResult[];
  total: number;
  page: number;
  per_page: number;
}

export async function register(username: string, password: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: Include cookies
    body: JSON.stringify({ username, password } as RegisterRequest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: Include cookies
    body: JSON.stringify({ username, password } as LoginRequest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include', // Important: Include cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Logout failed');
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include', // Important: Include cookies
    });

    if (!response.ok) {
      return null; // Not authenticated
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function getUserStats(): Promise<UserStats | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/stats/me`, {
      method: 'GET',
      credentials: 'include', // Important: Include cookies
    });

    if (!response.ok) {
      return null; // Not authenticated or error
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}

export async function getUserGameHistory(page: number = 1, perPage: number = 20): Promise<GameHistory | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/games/me?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      credentials: 'include', // Important: Include cookies
    });

    if (!response.ok) {
      return null; // Not authenticated or error
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching game history:', error);
    return null;
  }
}

