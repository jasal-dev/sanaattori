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

  // If running in the browser, use the current hostname with port 8000
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8000`;
  }

  // Fall back to localhost for server-side rendering
  return 'http://localhost:8000';
}

const API_BASE_URL = getApiBaseUrl();

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
    });

    if (!response.ok) {
      console.error('API validation failed:', response.statusText);
      return true; // Fail open - allow guess if API is down
    }

    const data: ValidateGuessResponse = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Error validating guess:', error);
    return true; // Fail open - allow guess if API is unreachable
  }
}
