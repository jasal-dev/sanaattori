# Score Payload Format and Client Trust Assumptions

## Score Payload Format

When submitting a game result to the backend, the client sends a simple JSON payload:

```json
{
  "score": 100
}
```

### Fields

- **score** (required, integer): The numeric score for the game
  - Must be a positive integer
  - Represents the player's achievement in the game
  - No maximum value enforced at API level

### Auto-Generated Fields

The backend automatically adds the following fields when storing the result:

- **user_id**: Extracted from the authenticated session
- **played_at**: Current server timestamp (UTC)
- **id**: Auto-incremented primary key

## Client Trust Assumptions

### Current Implementation: Trusted Client

**The current implementation trusts client-submitted scores without verification.**

This means:
- The backend accepts any score value sent by the client
- No server-side validation of game logic or moves
- No anti-cheat mechanisms are in place
- Players can potentially submit inflated or false scores

### Rationale

This approach is acceptable for the initial version because:
1. The game is primarily for fun and personal achievement
2. Implementing server-side game validation would require:
   - Duplicating game logic on the server
   - Tracking game state throughout gameplay
   - Significant complexity for moves, words, and scoring
3. The leaderboard is not tied to real-world rewards or rankings that matter

### Limitations and Future Considerations

**Known Limitations:**
- Leaderboard rankings may not reflect legitimate gameplay
- Malicious users can submit arbitrary scores
- No way to detect or prevent cheating

**If server-side validation is needed in the future:**

To properly validate scores, the server would need:

1. **Game State Tracking:**
   ```json
   {
     "game_id": "uuid-here",
     "word_to_guess": "encrypted-or-hashed",
     "guesses": [
       { "word": "koira", "result": [2, 0, 1, 0, 2] }
     ],
     "score": 100
   }
   ```

2. **Server-Side Logic:**
   - Maintain game sessions with the correct word
   - Validate each guess against the word list
   - Verify the evaluation results match the target word
   - Calculate the score independently and compare

3. **Payload Structure:**
   ```json
   {
     "game_id": "550e8400-e29b-41d4-a716-446655440000",
     "guesses": [
       { "guess": "koira", "evaluation": [2, 0, 1, 0, 2] },
       { "guess": "kissa", "evaluation": [2, 1, 0, 0, 2] }
     ],
     "final_score": 100,
     "completed": true
   }
   ```

4. **Validation Steps:**
   - Verify game_id exists and belongs to the user
   - Confirm all guesses are valid words
   - Recalculate evaluations server-side
   - Recompute score based on game rules
   - Compare client score with server score
   - Reject if mismatch detected

**Trade-offs:**
- **Complexity**: Requires full game logic on backend
- **Latency**: Each guess needs server round-trip
- **Resources**: Server must track all active game sessions
- **Benefits**: Prevents cheating, ensures fair leaderboards

## Recommendation

For the current scope (Milestone 1.3):
- ✅ Use simple trusted client approach
- ✅ Accept scores as-is from authenticated users
- ✅ Focus on core features and user experience

For future enhancements:
- Consider server-side validation if:
  - Leaderboards become competitive
  - Real rewards or achievements are added
  - Cheating becomes a problem
  - User feedback indicates concern about fairness
