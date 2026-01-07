/**
 * API client for the FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
