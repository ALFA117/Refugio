# Refugio 🔥

*A campfire that only burns when people show up.*

> **Friendzone Hackathon · DoraHacks · Built on Decentraland (SDK7)**

---

## One-liner

Refugio is a social multiplayer campfire in Decentraland where the fire literally grows with the number of people present, and strangers keep it alive together through a cooperative mini-game — no host, no scheduled event, no coordination required.

---

## The problem we're solving

Most "social" spaces in the metaverse are **empty venues**. They only feel alive during a scheduled event with a host driving the moment. Walk in at a random hour and you get a beautiful, lifeless room. That's the single biggest failure mode of social worlds — and it's an explicit disqualifier for this hackathon: *an experience that depends on a host, moderator, or scheduled event doesn't count.*

## Our solution

Refugio is designed so the social moment **emerges from whoever walks in**, at any hour, with zero coordination:

- **The fire responds to presence.** The campfire's intensity scales in real time with the number of players in the scene. One person sees a small flame; a group sees it roar. The space visibly reacts to you being there.
- **Sitting is an invitation.** Tap a log to sit around the fire. Every other client sees the seat light up — presence becomes legible without anyone saying a word.
- **A reason to stay, together.** "Guardians of the Fire" is a 3-minute cooperative round that starts on its own. Firewood appears; anyone taps it in time to feed the flame. Keep the fire above 50% health together and everyone earns **embers** (brasas).
- **Every guardian brings the next one.** An invite link (`?ref=<wallet>`) rewards both the inviter and the newcomer once they complete a round together — the loop that turns one player into a group.

The result: you can enter Refugio **cold, alone, at 3am**, and the experience still works — the server runs the rounds, the fire still responds, and the moment a second person arrives, it becomes social with no one organizing it.

---

## The player journey

1. **Arrive** → a 3-screen onboarding (always skippable) explains the fire, the seats, and the mini-game.
2. **Feel the space react** → the fire grows as others arrive around you.
3. **Sit down** → tap a log to join the circle; everyone sees you there.
4. **Play together** → firewood spawns, you and the others tap to feed the fire before it dies.
5. **Earn & climb** → a successful round grants embers, tracked on a persistent leaderboard.
6. **Invite** → share your `?ref=` link; you both get a bonus when you play a round together.

---

## Features (all built)

| System | What it does | Server-authoritative |
|---|---|---|
| **Living Fire** | Intensity scales with players present, recalculated client-side | No |
| **Seats** | 8 logs in a circle, tap to sit/stand, occupancy synced across clients | No (`syncEntity`) |
| **Guardians of the Fire** | 3-min cooperative round: firewood spawns, tap-to-feed, fire health, round resolution | **Yes** |
| **Embers (brasas)** | Currency granted on round completion, persisted per wallet, never zero for participants | **Yes** |
| **Leaderboard** | Top 10 by embers, stored in world storage, survives restarts & redeploys | **Yes** |
| **Referral** | `?ref=wallet` link, shared bonus to both players once they complete a round together | **Yes** |
| **Onboarding + HUD** | 3 screens with always-visible "Skip", live ember count + fire-health bar | No (UI) |

---

## Why it wins on the judging criteria

**Social Value (core).** The entire mechanic *is* the social signal: the fire is a live readout of how many people are present, and the mini-game gives strangers a shared, low-friction goal within seconds of arriving. Cooperation is the default state, not an opt-in.

**Works without a host (hard requirement).** The mini-game is arbitrated by Decentraland's **Multiplayer (authoritative) Server**, not by a designated "host" client. Rounds start, firewood spawns, and rewards are granted by the server on its own clock. There is no single point of coordination that can be absent — verified by entering the scene cold.

**Retention & Discovery Value.** Persistent embers and an **in-world leaderboard** (top guardians, always visible) give players a reason to return; the referral loop turns each guardian into a discovery channel. A graceful "lighting the fire…" state covers the server's cold-start so newcomers never hit a broken-looking scene. And the ranking lives **outside** Decentraland too: a public **[Wall of Guardians](https://wall-of-guardians.vercel.app)** companion site (Next.js) makes the leaderboard shareable on the web — the server pushes a snapshot on every round close.

---

## Technical architecture

Built entirely on **Decentraland SDK7** with the **Multiplayer Server** (`@dcl/sdk@auth-server`) — Decentraland hosts the authoritative server automatically on publish, at no cost and with no external infrastructure to operate.

- **`isServer()` split** — one TypeScript codebase, a `src/client` branch and a `src/server` branch, dispatched at runtime.
- **State sync** — `syncEntity` with stable enum IDs keeps seat occupancy and fire health consistent across every client.
- **Client↔server messaging** — a typed message room (`registerMessages` / `room.send` / `room.onMessage`) carries `feedFire`, `woodSpawned`, `roundEnded`, `registerReferral`, and targeted `brasasAwarded` messages.
- **Real anti-cheat by design** — clients never request "give me X embers". The server arbitrates the round it timed itself, validates every feed against live firewood, and is the sole writer of persistent state.
- **Native persistent storage** — per-wallet ember balances (`Storage.player`) and the world leaderboard (`Storage`) survive sessions and redeploys.
- **UI** — `@dcl/sdk/react-ecs` for the onboarding flow and the in-world HUD.
- **Performance-conscious** — no per-frame messaging or storage writes; the fire recalculates on an interval, the server ticks 4×/second, and state writes only on change — all within the Multiplayer Server's memory/CPU/message limits.

**Stack:** TypeScript · Decentraland SDK7 · Multiplayer Server (authoritative) · react-ecs · native Storage.

---

## Status

The full core experience (all seven systems above) is implemented and type-checks clean; the scene runs against the local Multiplayer Server. Remaining before final submission: multiplayer play-testing with 3+ real players, publishing the scene, and the demo video.

## Roadmap

- **v1 (submission):** the full loop above, published and play-tested.
- **Next:** a proper "sit" emote asset, richer fire/particle art, sound.
- **Stretch:** public companion leaderboard (Next.js) so rankings are shareable outside the world.

---

## Links

- **Live scene:** _`<añadir URL de la parcela publicada>`_
- **Demo video:** _`<añadir link del video>`_
- **GitHub repo:** _`<añadir URL del repo público>`_

## Team

- _`<tu nombre / handle>`_ — design & engineering

---

*Refugio — because a fire is just light until someone sits down next to you.*
