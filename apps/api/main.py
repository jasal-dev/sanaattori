from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import Set

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Word lists loaded at startup
word_lists: dict[int, Set[str]] = {}


class ValidateGuessRequest(BaseModel):
    language: str
    wordLength: int
    guess: str


class ValidateGuessResponse(BaseModel):
    valid: bool


def load_word_lists():
    """Load word lists for different lengths at startup."""
    global word_lists
    
    # Get the path to the data directory
    # Assuming the API is run from the apps/api directory
    data_dir = Path(__file__).parent.parent.parent / 'data' / 'processed'
    
    for length in [5, 6, 7]:
        word_file = data_dir / f'fi_allowed_{length}.txt'
        if word_file.exists():
            with open(word_file, 'r', encoding='utf-8') as f:
                words = set(line.strip().lower() for line in f if line.strip())
                word_lists[length] = words
                print(f"Loaded {len(words)} words for length {length}")
        else:
            print(f"Warning: Word list not found: {word_file}")
            word_lists[length] = set()


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

