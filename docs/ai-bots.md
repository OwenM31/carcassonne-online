# AI Bots

## Overview
The game currently supports two AI profiles:

- `RANDY`: baseline random bot.
- `MARTIN`: heuristic bot that tries to score aggressively.

AI players can be added in lobby sessions, and disconnected human turns can be auto-played by a configurable takeover bot (`RANDY` or `MARTIN`).

## RANDY behavior
- Draws and places normally when it is active.
- Tile placement:
  - Picks a random rotation bucket.
  - Picks a random legal placement from that rotation.
  - Falls back to any random legal placement.
- Meeple placement:
  - Uniform random over `[no meeple, legal meeple options...]`.
  - Gives equal chance to skipping meeple.

## MARTIN behavior
- Designed to be stronger than pure randomness while staying fast.
- Tile placement:
  - Evaluates all legal tile placements.
  - Simulates each candidate plus best follow-up meeple decision.
  - Scores candidates by projected near-term gain plus board-connectivity pressure.
- Meeple placement:
  - Simulates `skip` and each legal meeple option.
  - Prioritizes immediate scoring.
  - Prefers placing meeples when value is positive (aggressive style).
  - Applies a small penalty for low-impact placements when meeple supply is low.
- Tie-breaking:
  - Seeded hash tie-break for stable-but-varied choices.

## Takeover bot behavior
- Each session has a `takeoverBot` setting (`RANDY` by default).
- If an active human disconnects, their turn is automated using that takeover profile.
- AI seats always use their own profile (e.g., `ai-martin-*` always runs MARTIN).

## Running simulations
Use the match simulator to compare bots over many games:

```bash
npm run simulate:ai -- --matches=200 --deck=standard --maxTicks=30000
```

Options:
- `--matches=<n>`: number of games (default `100`)
- `--deck=standard|small`: deck size (default `standard`)
- `--maxTicks=<n>`: safety loop budget (default `30000`)

Output includes:
- Win counts and win rates for RANDY and MARTIN
- Tie count/rate
- Average final score per bot
