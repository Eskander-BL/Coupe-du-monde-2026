# World Cup 2026 live data integration

This project now supports importing real player stats through:

- `import-live-worldcup-data.mjs`
- `pnpm import:live-data`

## Required env vars

- `DATABASE_URL`: MySQL connection string
- `WC2026_API_BEARER_TOKEN` (optional): Bearer token for the feed API
- `WC2026_PROVIDER`: `feed` or `thestatsapi`

## Mode 1: Generic feed (`WC2026_PROVIDER=feed`)

Required:

- `WC2026_PLAYERS_FEED_URL`: URL returning JSON player rows

Expected payload shapes:

- `{ players: [...] }`
- `{ data: [...] }`
- `{ results: [...] }`
- `[ ... ]`

Per player, accepted fields:

- Name: `player_name` or `name` or `playerName`
- Photo URL: `photo_url` or `photoUrl` or `image` or `avatar`
- Team code: `team_code` or `teamCode` or `team`
- Goals: `goals` or `goal` or `total_goals`
- Assists: `assists` or `total_assists`
- Minutes: `minutesPlayed` or `minutes` or `total_minutes`
- Position: `position` (mapped to `GK`/`DF`/`MF`/`FW`)
- Shirt number: `number` or `shirt_number` or `shirtNumber`

## Mode 2: TheStatsAPI (`WC2026_PROVIDER=thestatsapi`)

Required:

- `WC2026_MATCHES_URL`  
  Example: `https://api.thestatsapi.com/api/football/matches?competition_id=comp_6107&season_id=sn_118868&limit=200`
- `WC2026_PLAYER_STATS_BY_MATCH_URL_TEMPLATE`  
  Example: `https://api.thestatsapi.com/api/football/matches/{MATCH_ID}/player-stats`

How it works:

- Fetches World Cup matches
- Keeps completed matches
- Fetches player stats per match
- Aggregates per player (goals, assists, minutes)
- Upserts into local `players` table

## Run

```bash
pnpm db:push
pnpm import:live-data
```

## Notes on sources

- Flashscore does not provide a widely documented official public API.
- For production-grade integration, use licensed feeds/providers and respect terms of service.
- You can use provider APIs that expose Flashscore-like coverage with `WC2026_PROVIDER=feed`.
