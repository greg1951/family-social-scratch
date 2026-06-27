## BACKGROUND

A new game has been added to game_metadata named "Cricket" (American darts).

Core gameplay:
- Two sides compete: either 2 players (1v1) or 4 players (2 teams of 2).
- Each turn consists of 3 darts.
- Cricket targets are: 20, 19, 18, 17, 16, 15, Bull.
- A side "closes" a target when it reaches 3 hits on that target.
- After a side closes a target, additional hits on that target score points until the opposing side also closes that target.
- Winner is the first side that has:
  1. closed all targets, and
  2. score greater than or equal to the opponent.

Reference layout:
- Use ai-reqs/cricket-layout.png as the UI layout contract.
- The graphic defines:
  - Board structure (center Cricket targets with mirrored side columns)
  - Data presentation (marks, side bonus cells, bottom totals)
  - Turn/readability cues (active side placement and row behavior)
  - Mode hints (player mode vs team mode)


## FUNCTIONAL REQUIREMENTS

1) Game modes
- Support two modes:
  - Player mode: 1 player per side (2 total).
  - Team mode: 2 players per side (4 total), with players alternating throws within each team.

2) Turn system
- Enforce turn-based play.
- Each turn allows exactly 3 darts.
- UI must clearly show whose turn it is.
- Closed games must be read-only until a new game starts or state is reset.

3) Scoreboard rows and cells
- Targets are displayed as rows in this order:
  - 20, 19, 18, 17, 16, 15, Bull.
- Each side has mirrored mark cells as shown in the layout graphic.
- Mark cells use spinner values 0-3:
  - 0 = blank
  - 1 = "/"
  - 2 = "X"
  - 3 = "O" (closed)
- Spinner input must clamp to valid values and never allow values outside 0-3.

4) Hit tracking and closure
- Track hits per side per target.
- A target is closed for a side at 3 hits.
- Additional hits beyond 3 are potential scoring hits.

5) Bonus and total scoring
- Bonus/score cells are numeric inputs or computed numeric displays aligned with the layout.
- Scoring rule:
  - If side A has closed target T and side B has not closed T,
  - then each hit by side A on T beyond 3 scores target value points.
- Formula for target bonus contribution:
  - max(0, hitsA[T] - 3) * targetValue(T), only while opponent is not closed on T.
- targetValue(Bull) must be explicitly defined in implementation (commonly 25).
- Side total score updates in real time as marks change.

6) Winner and game completion
- A game ends when one side has all targets closed and score >= opponent score.
- On completion:
  - mark game as closed/completed,
  - display winner,
  - prevent further turn/mark edits unless reset/new game flow is used.

7) Actions and lifecycle
- Allow start new game.
- Allow reset game state (clear marks/scores and restart).
- Allow archive for closed games.
- Allow delete for games users do not want in history.


## LEADERBOARD AND GAME HISTORY

1) Leaderboard updates
- Include Cricket in leaderboard views.
- Show both player-mode and team-mode performance records.
- Minimum stats:
  - name (player or team)
  - wins
  - losses
  - total points scored

2) Game history updates
- Record each completed Cricket game.
- Include:
  - participants (players/teams)
  - final score for each side
  - winner indicator
  - date/time
- Support loading a historical game in read-only or replay/edit-safe mode per product rules.


## ACCEPTANCE CRITERIA

- User can create a Cricket game in player or team mode.
- User can enter marks via 0-3 spinners for each target row.
- UI renders "/", "X", "O" correctly from spinner state.
- Side totals update correctly when extra hits occur on closed targets.
- Game completes only when closure + score condition is satisfied.
- Completed game blocks new turns unless reset/new game is initiated.
- Closed game can be archived.
- Any game can be deleted.
- Leaderboard includes Cricket stats.
- Game history shows winner and final scores for Cricket games.

