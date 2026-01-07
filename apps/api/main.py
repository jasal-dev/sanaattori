from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import Set, List
import random

app = FastAPI()

# Configure CORS
# Allow requests from any host on port 3000 (for local network access)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://[^/]+:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Word lists loaded at startup
word_lists: dict[int, Set[str]] = {}
solution_lists: dict[int, List[str]] = {}


class ValidateGuessRequest(BaseModel):
    language: str
    wordLength: int
    guess: str


class ValidateGuessResponse(BaseModel):
    valid: bool


class GetWordResponse(BaseModel):
    word: str


def load_word_lists():
    """Load word lists for different lengths at startup."""
    global word_lists, solution_lists
    
    # Get the path to the data directory
    # Assuming the API is run from the apps/api directory
    data_dir = Path(__file__).parent.parent.parent / 'data' / 'processed'
    
    for length in [5, 6, 7]:
        # Load allowed words
        word_file = data_dir / f'fi_allowed_{length}.txt'
        if word_file.exists():
            with open(word_file, 'r', encoding='utf-8') as f:
                words = set(line.strip().lower() for line in f if line.strip())
                word_lists[length] = words
                print(f"Loaded {len(words)} allowed words for length {length}")
        else:
            print(f"Warning: Word list not found: {word_file}")
            word_lists[length] = set()
        
        # Load solution words
        solution_file = data_dir / f'fi_solutions_{length}.txt'
        if solution_file.exists():
            with open(solution_file, 'r', encoding='utf-8') as f:
                solutions = [line.strip().lower() for line in f if line.strip()]
                solution_lists[length] = solutions
                print(f"Loaded {len(solutions)} solution words for length {length}")
        else:
            print(f"Warning: Solution list not found: {solution_file}")
            solution_lists[length] = []


@app.on_event("startup")
async def startup_event():
    """Load word lists when the app starts."""
    load_word_lists()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/validate-guess", response_model=ValidateGuessResponse)
async def validate_guess(request: ValidateGuessRequest):
    """
    Validate a Finnish word guess.
    
    Checks:
    - Correct length
    - Contains only allowed characters (a-z, ä, ö, å)
    - Word exists in the allowed word list
    """
    guess = request.guess.lower().strip()
    
    # Check if the language is supported (only Finnish for now)
    if request.language != "fi":
        return ValidateGuessResponse(valid=False)
    
    # Check if the word length is correct
    if len(guess) != request.wordLength:
        return ValidateGuessResponse(valid=False)
    
    # Check if word length is supported
    if request.wordLength not in word_lists:
        return ValidateGuessResponse(valid=False)
    
    # Check if contains only allowed characters
    import re
    if not re.match(r'^[a-zäöå]+$', guess):
        return ValidateGuessResponse(valid=False)
    
    # Check if word exists in the allowed list
    valid = guess in word_lists[request.wordLength]
    
    return ValidateGuessResponse(valid=valid)


@app.get("/word", response_model=GetWordResponse)
async def get_word(wordLength: int = 5):
    """
    Get a random word from the solution list for the specified word length.
    
    Parameters:
    - wordLength: The length of the word to retrieve (default: 5)
    
    Returns a random word from the solution list.
    """
    # Check if word length is supported
    if wordLength not in solution_lists:
        # Return a fallback word for unsupported lengths
        fallbacks = {5: "omena", 6: "ajatus", 7: "ihminen"}
        return GetWordResponse(word=fallbacks.get(wordLength, "omena"))
    
    # Check if there are any solutions available
    solutions = solution_lists[wordLength]
    if not solutions:
        # Return a fallback word if no solutions are available
        fallbacks = {5: "omena", 6: "ajatus", 7: "ihminen"}
        return GetWordResponse(word=fallbacks.get(wordLength, "omena"))
    
    # Return a random word from the solutions
    word = random.choice(solutions)
    return GetWordResponse(word=word)

