# Refugio 🔥

**A campfire that only burns when people show up.**

A social multiplayer experience for **Decentraland (SDK7)**, built for the **Friendzone Hackathon** on DoraHacks. The campfire grows with the number of players present, and strangers keep it alive together through a cooperative mini-game — **no host, no scheduled event, no coordination required.**

- 🔗 Live scene: _`<añadir URL de la parcela publicada>`_
- 🎬 Demo video: _`<añadir link del video>`_
- 🏆 Public leaderboard (companion): **[wall-of-guardians.vercel.app](https://wall-of-guardians.vercel.app)** · repo [ALFA117/refugio-wall](https://github.com/ALFA117/refugio-wall)
- 📄 Submission (BUIDL page): [`docs/submission/buidl-page.md`](docs/submission/buidl-page.md)

---

## Why it exists

Most social spaces in the metaverse are **empty venues** — alive only during a hosted, scheduled event. Refugio is designed so the social moment **emerges from whoever walks in**, at any hour, with zero coordination. That's also this hackathon's hard requirement: an experience that depends on a host or scheduled event is disqualified.

## What's inside

| System | What it does | Runs on server |
|---|---|---|
| **Living Fire** | Fire intensity scales with players present | No |
| **Seats** | 8 logs in a circle, tap to sit/stand, occupancy synced | No (`syncEntity`) |
| **Guardians of the Fire** | 3-min cooperative round: firewood spawns, tap-to-feed, fire health | **Yes** |
| **Embers (brasas)** | Currency granted on round end, persisted per wallet | **Yes** |
| **Leaderboard** | Top 10 in world storage, shown in-world | **Yes** |
| **Referral** | `?ref=wallet` link, shared bonus after a round together | **Yes** |
| **Onboarding + HUD** | 3 skippable screens, live ember count, fire-health bar, connecting state | No (UI) |

## Architecture

Built on **Decentraland SDK7** with the **Multiplayer (authoritative) Server** (`@dcl/sdk@auth-server`) — Decentraland hosts the server automatically on publish, no external infrastructure.

- **`isServer()` split** — one codebase, a `src/client` branch and a `src/server` branch dispatched at runtime ([`src/index.ts`](src/index.ts)).
- **State sync** — `syncEntity` with stable enum IDs for seat occupancy and fire health.
- **Messaging** — a typed message room (`registerMessages` / `room.send` / `room.onMessage`) in [`src/shared/messages.ts`](src/shared/messages.ts).
- **Anti-cheat by design** — the server arbitrates the round it timed, validates every feed, and is the sole writer of persistent state. Clients never request rewards.
- **Persistence** — per-wallet ember balances (`Storage.player`) and the world leaderboard (`Storage`) survive sessions and redeploys.
- **UI** — `@dcl/sdk/react-ecs` for onboarding and the in-world HUD.

### Project structure

```
src/
  index.ts              # isServer() dispatcher
  client/               # everything rendered for players
    factory/            # fogata, seats, wood, flame entities + synced components
    systems/            # fogataSystem, seatSystem, minigame (messages + fire visual)
    ui/                 # react-ecs onboarding + HUD
    referral.ts         # reads ?ref= and registers the referral
  server/               # authoritative game loop
    index.ts            # round cycle: spawn wood, decay, validate feeds, end round
    brasas.ts           # ember rewards, referral bonus, Storage, leaderboard
  shared/               # code both branches import
    constants.ts        # tunables (all game numbers live here)
    messages.ts         # typed client↔server message room
    fire.ts             # FireHealth synced component
docs/                   # master prompt, tech spec, submission, planning
```

## Run it locally

Requires Node ≥ 16 and the [Decentraland Desktop Client](https://dcl.gg/explorer) to render the scene.

```bash
npm install
npm run start
```

This starts the preview server (`http://localhost:8000`) with the Multiplayer Server, and launches the explorer. To test the multiplayer / no-host behaviour, open **two** explorer windows on the same realm and watch seats, the fire, and the mini-game sync between them.

```bash
npm run build    # bundle + type-check (no explorer needed)
npm run deploy   # publish the scene to Decentraland
```

## Status

Full core experience (all seven systems) implemented and type-checking clean; runs against the local Multiplayer Server. Pending before final submission: multiplayer play-testing with 3+ real players, publishing, and the demo video. See [`docs/gestion/`](docs/gestion) for the checklist and planning.

---

*Refugio — because a fire is just light until someone sits down next to you.*
