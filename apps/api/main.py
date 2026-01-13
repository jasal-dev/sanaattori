from fastapi import FastAPI, HTTPException, Depends, Response, Cookie, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
from typing import Set, List, Optional, Annotated
from datetime import datetime, timedelta, timezone
import random
import os
from sqlalchemy.orm import Session as DBSession

# Import database and auth utilities
from database import get_db, engine, Base
from models import User, GameResult
import auth

app = FastAPI()

# Get environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Configure CORS
# Allow requests from frontend origins with credentials
if ENVIRONMENT == "production":
    # In production, use explicit origin list from environment variable
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Set-Cookie"],
    )
else:
    # In development, allow any host on port 3000 for local network access
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://[^/]+:3000",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Set-Cookie"],
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


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)


class RegisterResponse(BaseModel):
    id: int
    username: str
    created_at: str


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    message: str
    user: dict


class LogoutResponse(BaseModel):
    message: str


class SubmitGameResultRequest(BaseModel):
    score: int = Field(..., ge=0)


class GameResultResponse(BaseModel):
    id: int
    user_id: int
    score: int
    played_at: str


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    total_score: int
    games_played: int


class WeeklyLeaderboardResponse(BaseModel):
    period: str
    start_date: str
    end_date: str
    leaderboard: List[LeaderboardEntry]


class AllTimeLeaderboardResponse(BaseModel):
    period: str
    leaderboard: List[LeaderboardEntry]


class UserProfileResponse(BaseModel):
    id: int
    username: str
    created_at: str


class UserStatsResponse(BaseModel):
    played: int
    won: int
    lost: int
    winRate: float
    currentStreak: int
    maxStreak: int


class UserGameHistoryResponse(BaseModel):
    games: List[GameResultResponse]
    total: int
    page: int
    per_page: int


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


def get_current_user(
    session_token: Annotated[Optional[str], Cookie()] = None,
    db: DBSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from session cookie.
    Raises 401 if not authenticated or session is invalid/expired.
    """
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user = auth.validate_session(db, session_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    return user


@app.on_event("startup")
async def startup_event():
    """Initialize the app on startup."""
    # Create database tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")
    
    # Load word lists
    load_word_lists()
    
    # Clean up expired sessions on startup
    from database import SessionLocal
    db = SessionLocal()
    try:
        count = auth.cleanup_expired_sessions(db)
        print(f"Cleaned up {count} expired sessions")
    finally:
        db.close()


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


# ==================== Authentication Endpoints ====================

@app.post("/auth/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: DBSession = Depends(get_db)):
    """
    Register a new user account.
    
    - Passwords are hashed using argon2id
    - Username must be unique
    """
    user = auth.create_user(db, request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )
    
    return RegisterResponse(
        id=user.id,
        username=user.username,
        created_at=user.created_at.isoformat()
    )


@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response, db: DBSession = Depends(get_db)):
    """
    Authenticate user and create a session.
    
    Sets a secure HttpOnly cookie with the session token.
    """
    user = auth.authenticate_user(db, request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Create session
    token, session = auth.create_session(db, user.id)
    
    # Set secure cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=(ENVIRONMENT == "production"),
        samesite="lax",
        max_age=604800,  # 7 days
        path="/"
    )
    
    return LoginResponse(
        message="Login successful",
        user={"id": user.id, "username": user.username}
    )


@app.post("/auth/logout", response_model=LogoutResponse)
async def logout(
    response: Response,
    session_token: Annotated[Optional[str], Cookie()] = None,
    db: DBSession = Depends(get_db)
):
    """
    End the current session and clear the cookie.
    """
    if session_token:
        auth.delete_session(db, session_token)
    
    # Clear the cookie
    response.set_cookie(
        key="session_token",
        value="",
        httponly=True,
        secure=(ENVIRONMENT == "production"),
        samesite="lax",
        max_age=0,
        path="/"
    )
    
    return LogoutResponse(message="Logout successful")


@app.get("/auth/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get the current authenticated user's profile information.
    
    Requires valid session cookie.
    Returns basic profile information: id, username, created_at.
    """
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        created_at=current_user.created_at.isoformat()
    )


# ==================== Game Endpoints ====================

@app.post("/games/submit", response_model=GameResultResponse, status_code=status.HTTP_201_CREATED)
async def submit_game_result(
    request: SubmitGameResultRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    Submit a game result (requires authentication).
    
    The played_at timestamp is automatically set to the current time.
    """
    game_result = GameResult(
        user_id=current_user.id,
        score=request.score
    )
    db.add(game_result)
    db.commit()
    db.refresh(game_result)
    
    return GameResultResponse(
        id=game_result.id,
        user_id=game_result.user_id,
        score=game_result.score,
        played_at=game_result.played_at.isoformat()
    )


@app.get("/stats/me", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    Get statistics for the current authenticated user.
    
    Calculates and returns:
    - played: Total games played
    - won: Games won (score 1-6)
    - lost: Games lost (score 0 or > 6)
    - winRate: Percentage of games won (0-100)
    - currentStreak: Current consecutive wins
    - maxStreak: Maximum consecutive wins achieved
    
    Win/loss is determined by score:
    - Score 1-6: Win (won in that many guesses)
    - Score 0 or > 6: Loss
    """
    from sqlalchemy import func, and_
    
    # Get all game results for the user, ordered by played_at
    games = db.query(GameResult).filter(
        GameResult.user_id == current_user.id
    ).order_by(GameResult.played_at.asc()).all()
    
    # Calculate statistics
    played = len(games)
    won = sum(1 for g in games if 1 <= g.score <= 6)
    lost = played - won
    win_rate = (won / played * 100) if played > 0 else 0.0
    
    # Calculate streaks
    current_streak = 0
    max_streak = 0
    temp_streak = 0
    
    for game in games:
        is_win = 1 <= game.score <= 6
        if is_win:
            temp_streak += 1
            max_streak = max(max_streak, temp_streak)
        else:
            temp_streak = 0
    
    # Current streak is the streak at the end
    current_streak = temp_streak
    
    return UserStatsResponse(
        played=played,
        won=won,
        lost=lost,
        winRate=round(win_rate, 2),
        currentStreak=current_streak,
        maxStreak=max_streak
    )


@app.get("/games/me", response_model=UserGameHistoryResponse)
async def get_user_game_history(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
    page: int = 1,
    per_page: int = 20
):
    """
    Get game history for the current authenticated user.
    
    Returns paginated list of all game results for the logged-in user.
    Results are ordered by played_at (most recent first).
    
    Query parameters:
    - page: Page number (default: 1)
    - per_page: Results per page (default: 20, max: 100)
    """
    from sqlalchemy import func
    
    # Validate pagination parameters
    page = max(1, page)
    per_page = min(max(1, per_page), 100)
    
    # Get total count
    total = db.query(func.count(GameResult.id)).filter(
        GameResult.user_id == current_user.id
    ).scalar()
    
    # Get paginated results
    offset = (page - 1) * per_page
    games = db.query(GameResult).filter(
        GameResult.user_id == current_user.id
    ).order_by(GameResult.played_at.desc()).limit(per_page).offset(offset).all()
    
    # Convert to response format
    game_responses = [
        GameResultResponse(
            id=game.id,
            user_id=game.user_id,
            score=game.score,
            played_at=game.played_at.isoformat()
        )
        for game in games
    ]
    
    return UserGameHistoryResponse(
        games=game_responses,
        total=total or 0,
        page=page,
        per_page=per_page
    )


# ==================== Leaderboard Endpoints ====================

@app.get("/leaderboard/weekly", response_model=WeeklyLeaderboardResponse)
async def get_weekly_leaderboard(
    limit: int = 10,
    db: DBSession = Depends(get_db)
):
    """
    Get the weekly leaderboard (top players in the last 7 days).
    """
    from sqlalchemy import func
    
    # Calculate the date 7 days ago (use naive datetime for SQLite compatibility)
    seven_days_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=7)
    
    # Query to get top players by total score in the last 7 days
    results = db.query(
        User.username,
        func.sum(GameResult.score).label('total_score'),
        func.count(GameResult.id).label('games_played')
    ).join(
        GameResult, User.id == GameResult.user_id
    ).filter(
        GameResult.played_at >= seven_days_ago
    ).group_by(
        User.id, User.username
    ).order_by(
        func.sum(GameResult.score).desc(),
        func.count(GameResult.id).asc()
    ).limit(min(limit, 100)).all()
    
    # Build leaderboard with ranks
    leaderboard = [
        LeaderboardEntry(
            rank=idx + 1,
            username=result.username,
            total_score=result.total_score,
            games_played=result.games_played
        )
        for idx, result in enumerate(results)
    ]
    
    return WeeklyLeaderboardResponse(
        period="weekly",
        start_date=seven_days_ago.isoformat(),
        end_date=datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
        leaderboard=leaderboard
    )


@app.get("/leaderboard/alltime", response_model=AllTimeLeaderboardResponse)
async def get_alltime_leaderboard(
    limit: int = 10,
    db: DBSession = Depends(get_db)
):
    """
    Get the all-time leaderboard (top players of all time).
    """
    from sqlalchemy import func
    
    # Query to get top players by total score all-time
    results = db.query(
        User.username,
        func.sum(GameResult.score).label('total_score'),
        func.count(GameResult.id).label('games_played')
    ).join(
        GameResult, User.id == GameResult.user_id
    ).group_by(
        User.id, User.username
    ).order_by(
        func.sum(GameResult.score).desc(),
        func.count(GameResult.id).asc()
    ).limit(min(limit, 100)).all()
    
    # Build leaderboard with ranks
    leaderboard = [
        LeaderboardEntry(
            rank=idx + 1,
            username=result.username,
            total_score=result.total_score,
            games_played=result.games_played
        )
        for idx, result in enumerate(results)
    ]
    
    return AllTimeLeaderboardResponse(
        period="all-time",
        leaderboard=leaderboard
    )

