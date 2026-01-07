/**
 * API client for the FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
