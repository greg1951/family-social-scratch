# RULES AND SCORING FOR CROKINOLE

## Crokinole Objective:
- Crokinole is a classic dexterity board game where players take turns flicking wooden discs to land in higher-scoring zones while knocking opponents' discs off the board.
- The primary goal is to be the first to reach 100 points.

## Basic Setup:
- Players: 2 (singles) or 4 (doubles, with partners sitting opposite each other).
- Discs:
  - In singles, each player gets 12 discs.
  - In doubles, each player gets 6 discs.
- The "One-Cheek" Rule: Players must remain seated while shooting; at least one cheek must be touching the chair at all times.

## Scoring:
- The 20-Point Hole: If a disc lands entirely flat inside the center hole, it is immediately removed from the board and set aside as a guaranteed 20 points for the end of the round.
- Ring Values: The board is divided into zones.
  - The central ring is worth 15 points.
  - The middle ring is worth 10 points.
  - The outer ring is worth 5 points.
- Line Rule: A disc touching a dividing line scores the value of the lower ring. Discs on or outside the outermost shooting line are worth zero and go to the ditch.
- End-of-Round Scoring: After all discs are shot, both sides total their points on the board. The higher-scoring side subtracts the lower score to determine points earned for that round. Example: 30 to 10 earns 20 round points.

## Winning the Game:
- Play continues across multiple rounds until one player (or team) reaches the target winning score, traditionally 100 points.

# REQUIREMENTS FOR CROKINOLE SCORECARD
- Track each player (or team) name and cumulative score across rounds.
- Display points scored in each round and running totals.
- Support both singles and doubles formats, including team names and combined team scores in doubles.
- Integrate with the existing Game Scoreboard guest-member flow for easy player management.
- Visually differentiate round winners (for example, by highlighting the winning side's score each round).
- Include a reset option to start a new game, clearing all scores and player names.

# ACCEPTANCE CRITERIA CHECKLIST
- [ ] The game selector includes Crokinole and opens a Crokinole scorecard view.
- [ ] The scorecard supports Singles and Doubles format selection.
- [ ] Singles mode supports two sides and lets the user assign one player per side.
- [ ] Doubles mode supports two teams and lets the user assign up to two players per team.
- [ ] Team names are editable and displayed in the scorecard.
- [ ] Round scoring accepts combined side/team scores for each round.
- [ ] Cumulative totals update correctly as rounds are entered.
- [ ] Round winner cells are visually highlighted for each completed round.
- [ ] Guest-player creation is available from Crokinole player selectors.
- [ ] Save persists Crokinole rounds and cumulative totals via the Game Scoreboard workflow.
- [ ] Load restores Crokinole game title, side selections, and entered rounds.
- [ ] Reset clears all entered round scores and side/team selections for Crokinole.
