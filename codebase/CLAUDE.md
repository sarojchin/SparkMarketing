# PROJECT OVERVIEW — Spark Agency Sim

> **This is the stable reference for what this project is and where it's going.**
> Read this first before exploring the codebase. Do not repeatedly re-analyze the project to figure out its purpose — use this document.

---

## What Is This?

A **business simulation game** where the player controls a marketing agency founder. Starting solo in a tiny office, the player directs their character's actions — cold calling prospects, writing outreach emails, creating campaign content — to acquire clients, earn revenue, and grow the business.

The long-term arc: **hire employees, take on more demanding clients, manage office politics, make rent and payroll, and build an empire.**

## Core Fantasy

You are Alex Chen, a scrappy founder who quit their job to start a marketing agency. You have no clients, no team, and rent is due at the end of the month. Every dollar is earned through hustle. As the business grows, the challenge shifts from "can I get a single client?" to "can I manage 15 employees, 8 demanding clients, and an office that's falling apart?"

## Style & Tone

- **Fun, quirky, lighthearted** — not a spreadsheet simulator
- Pixel art aesthetic, procedural sprites, Canvas 2D rendering
- Characters have personality (quotes, behavior quirks, relationship dynamics)
- Player has **freedom of choice** in how they manage — no single "right" strategy
- Inspired by **Dwarf Fortress** (emergent stories, indirect control at scale) and **FTL** (tough resource decisions, random events, tension between safe play and risk)

---

## Game Loop

### Early Game (Solo Founder)
1. Player assigns Alex to tasks (cold calls, emails, content creation)
2. Cold calls/emails generate prospects → some convert to clients
3. Content creation produces campaigns for clients
4. Delivered campaigns go through client review → payment received
5. Revenue covers rent, funds growth

### Mid Game (Small Team)
- Hire specialists (designer, ads manager, content writer)
- Delegate tasks — each employee has different strengths
- Manage morale, energy, and interpersonal dynamics
- Take on multiple clients simultaneously
- Balance quality vs. speed vs. employee wellbeing

### Late Game (Agency Empire)
- Multiple offices, departments with team leads
- High-profile clients with demanding requirements
- Compete with rival agencies
- Strategic decisions: specialize or diversify, premium or volume, grow or consolidate

---

## Character System

### Attributes (Static, RPG-Style Letter Grades)
Each character has 4 permanent attributes rated **F → D → C → B → A → S → S+ → S++**:

| Attribute | What It Affects |
|-----------|----------------|
| **Persistence** | Willingness to work without burning out |
| **Empathy** | Impact on group morale and cohesion |
| **Genius** | Quality of work produced |
| **Speed** | How fast they work and function |

Each grade has a numeric multiplier (F=0.1 → S++=2.0) for gameplay calculations.

### Skills (Leveling, Experience-Based) — NOT YET IMPLEMENTED
Skills represent domain expertise and improve through use:
- **Sales** — cold calling effectiveness, close rate
- **Writing** — email/content quality
- **Design** — visual asset quality
- **Ads** — paid media campaign performance
- **Strategy** — campaign planning quality

Skills level up via an experience system: doing the work earns XP in the relevant skill.

### Dynamic Stats
| Stat | Description |
|------|-------------|
| **Morale** (0–100) | Affected by events, relationships, workload. Low morale → poor performance, quitting |
| **Energy** (0–100) | Drained by work, recharged by rest/coffee. Low energy → slower, mistakes |

### Production Statistics
Each character tracks individual output:
- Calls made, emails sent, campaigns created
- (Future: quality scores, client satisfaction ratings)

---

## Revenue Model

### Client Acquisition Pipeline
1. **Cold Calls / Emails** — 1 per game-minute while working
2. **Responses** — 1 in ~150 calls gets a response (NOT YET IMPLEMENTED)
3. **Client Conversion** — 1 in ~5 responses becomes a client (NOT YET IMPLEMENTED)
4. **Campaign Creation** — content creation task, ~3 game-days per campaign
5. **Client Review** — variable wait (20–30 game-minutes) (NOT YET IMPLEMENTED)
6. **Payment** — $5,000 per delivered campaign

### Expenses (NOT YET IMPLEMENTED)
- Monthly rent and utilities
- Employee salaries (weekly)
- Software licenses, equipment
- Bankruptcy = game over

---

## Technical Architecture

### Stack
- **React 18** + **TypeScript 5** + **Vite**
- **Zustand** for UI state (read-only bridge from ECS)
- **Canvas 2D** for rendering (pixel art, 3x scale, procedural sprites)
- **Custom ECS engine** for simulation logic

### ECS (Entity Component System)
The simulation runs on a custom ECS where:
- **Entities** are numeric IDs (people, furniture, clients)
- **Components** are pure data structs attached to entities
- **Systems** are functions that run each tick in priority order, operating on entities by component signature
- **Resources** are typed global singletons (clock, tilemap, campaign stats)
- **Event Bus** decouples systems (log events, notifications)

The ECS is completely isolated from React. The **snapshot system** syncs ECS state → Zustand store every 200ms. UI reads from Zustand, never from the World directly.

### Component Categories

**Spatial**: `Position` (x/y pixel), `TilePosition` (tileX/tileY), `Facing` (direction)

**Visual**: `Appearance` (spriteType, colors, zIndex), `Animation` (frame, timer, speed, frameCount), `StatusIndicator` (color, visible, pulse), `SpeechBubble` (text, remaining, duration)

**Identity**: `Identity` (name, role, department, shortLabel)

**Employee State**: `BehaviorState` (current, timer, nextState, metadata), `Energy` (current/max, drainRate, rechargeRate), `Morale` (current 0–100), `Attributes` (grades: AttributeGrades)

**Task / Production**: `AssignedTask` (taskKey, progress), `ProductionCounters` (callsMade, emailsSent, campaignsCreated), `PipelineState` (currentStep, stepProgress, stepName, phase, pipelineComplete)

**Movement / AI**: `PathFollower` (path[], speed), `DeskAssignment` (deskEntity, seatOffset), `BehaviorWeights` (weights: Record<string, number>)

**Furniture**: `Interactable` (type: sit/use/look, interactionPoint, inUseBy), `FurnitureTag`

**Client**: `ClientTag` (query marker), `ClientIdentity` (name, industry, size), `ClientReputation` (score 0–100)

### Key Directories
```
src/
├── ecs/                    # Core ECS engine (World, ComponentStore, ResourceKey, typed event bus)
├── simulation/
│   ├── components/         # All component type definitions + COMPONENTS name constants
│   ├── data/               # Static game data (characters, maps, clients, pipeline, attributes, quotes)
│   ├── systems/            # ECS tick systems + log-bridge event subscriber
│   │   ├── clock.ts        # priority 1
│   │   ├── behavior.ts     # priority 10
│   │   ├── movement.ts     # priority 20
│   │   ├── production.ts   # priority 30 (pipeline)
│   │   ├── taskProduction.ts # priority 31
│   │   ├── quotes.ts       # priority 35
│   │   ├── clientManager.ts  # priority 40
│   │   ├── clientAcquisitionSystem.ts  # priority 41 (acquisition funnel + bridge)
│   │   ├── snapshot.ts     # priority 100
│   │   └── log-bridge.ts   # event subscriber (not a tick system)
│   ├── registries/         # Pluggable behavior handler registry
│   ├── resources.ts        # Typed resource definitions
│   └── factory.ts          # World setup — spawns entities, registers systems + resources
├── renderer/               # Canvas 2D rendering (tiles, sprites, speech bubbles)
├── hooks/                  # Zustand store (useSimStore) — read-only ECS bridge
├── ui/
│   ├── overlays/           # HUD, Tooltip (floating over canvas)
│   └── panels/             # Bottom bar panels (Pipeline, Character, Team, Info, Outreach, Client, Log)
└── utils/                  # Seeded PRNG (seed 12345), BFS pathfinding
```

### Systems (Run Order)
| Priority | System | Purpose |
|----------|--------|---------|
| 1 | clock | Advances simulation time |
| 10 | behavior | AI behavior selection + dispatch |
| 20 | movement | Pathfinding + animation |
| 30 | pipeline | Sequential campaign pipeline (phase-gated) |
| 31 | taskProduction | Independent task counters (calls, emails, campaigns) |
| 35 | quotes | Flavor text speech bubbles |
| 40 | clientManager | Syncs CLIENT_ROSTER.activeClients from actual client entities |
| 41 | clientAcquisitionSystem | Watches call thresholds; spawns acquired client entities; emits `client:acquired` |
| 100 | snapshot | Syncs ECS → Zustand every 200ms |
| — | log-bridge | Event subscriber (not a tick system): forwards `log` events → Zustand |

### Resources
| Key | Type | Purpose |
|-----|------|---------|
| SIM_CLOCK | SimClock | Time: speed, tick, simMinutes, simDay |
| TILEMAP | TilemapResource | Map grid for rendering + pathfinding |
| CAMPAIGN | Campaign | Revenue tracking: bank, grossIncome, campaignsShipped, campaignValue |
| PLAYER_DIRECTIVE | PlayerDirective | Assigned phase (legacy; being superseded by per-entity AssignedTask) |
| CLIENT_ROSTER | ClientRoster | activeClients, totalClientsEver, maxClients |

### Client Architecture

Clients are ECS entities (not UI-side objects) spawned exclusively through the acquisition funnel — **not** at world creation. The game starts with zero clients.

**Static data**: `src/simulation/data/clients.ts` exports `STARTER_CLIENTS` (kept as reference) and `PROSPECT_POOL` — 12 prospects that `clientAcquisitionSystem` draws from when a conversion fires.

**Components on a client entity**: `ClientTag` (query marker), `ClientIdentity` (name, industry, size), `ClientReputation` (score 0–100)

**Resource**: `CLIENT_ROSTER` tracks { activeClients, totalClientsEver, maxClients }. `clientManager` system updates `activeClients` each tick by counting entities with `ClientTag`.

**Acquisition flow**: Every 150 cold calls, `clientAcquisitionSystem` picks a random prospect and queues a 1-minute pending acquisition. After 1 game-minute, there's a 20% chance the prospect converts — spawning a new entity with `ClientTag` + identity + reputation, emitting `client:acquired`, and triggering the `ClientAcquisitionPopup`. The `ClientPanel` in the bottom bar lists all active (acquired) clients.

### Data Flow
```
Player clicks UI (React)
  → Zustand store action (e.g., assignEntityTask)
  → App.tsx subscription drains to ECS component
  → Systems process each tick
  → Snapshot system syncs back to Zustand (every 200ms)
  → React re-renders from store
```

### Event Bus

The World exposes a typed event bus (`world.on` / `world.emit`). All events are defined in `WorldEvents` in `src/ecs/world.ts`.

| Event | Payload | Emitted by |
|-------|---------|------------|
| `log` | `{ message, type: action\|event\|chat\|system\|quote }` | Any system |
| `entity:spawned` | `{ entity }` | `world.spawn()` (automatic) |
| `entity:despawned` | `{ entity }` | `world.despawn()` (automatic) |
| `behavior:changed` | `{ entity, from, to }` | behavior system |
| `client:acquired` | `{ entity, name, industry, size, project }` | clientAcquisitionSystem |
| `client:lost` | `{ entity, name, reason }` | reserved — not yet fired |

`log-bridge` (`src/simulation/systems/log-bridge.ts`) is the only subscriber outside the ECS layer. It subscribes to `log` and pushes messages to `useSimStore.addLog()`.

### Data-Driven Conventions

- **Maps**: ASCII grids parsed by `parseAsciiMap()` in `src/simulation/data/maps.ts`. Tile codes: `W`=wall, `.`=floor, `R`=rug, `O`=door, `D`=desk, `C`=chair, `K`=coffee machine, `B`=whiteboard, `P`=plant, `S`=bookshelf, `L`=couch.
- **PRNG**: Global `rng` in `src/utils/rng.ts`, seeded `12345`. Use `rng` (not `Math.random()`) in all simulation code for deterministic runs.
- **Pathfinding**: BFS in `src/utils/pathfinding.ts`. Accepts optional `occupiedTiles: Set<string>` to route around currently-occupied tiles.

---

## Current State (What Works)

- [x] ECS engine with entities, components, systems, resources, events
- [x] Simulation clock with speed control (1x / 3x / 8x / pause)
- [x] Behavior system (work, coffee, wander, chat, whiteboard)
- [x] BFS pathfinding + smooth movement
- [x] Canvas 2D rendering (tiles, furniture, animated people, speech bubbles)
- [x] Per-character task assignment (cold calls, emails, content creation)
- [x] Production counters (calls, emails, campaigns per character)
- [x] Character attributes (F→S++ grades, displayed in CharacterPanel)
- [x] Morale and energy bars (displayed, but static — no drain/recharge yet)
- [x] Flavor quotes with phase-specific categories
- [x] Activity log with timestamps
- [x] UI panels: HUD (overlay), Tooltip (hover overlay), Pipeline, Character, Team, Info, Outreach, Client, Log
- [x] Client acquisition funnel — every 150 calls triggers a prospect; 1-min pending window; 20% conversion spawns a `ClientTag` entity; `ClientAcquisitionPopup` fires; `ClientPanel` lists acquired clients (shows "None" at start)

## What's NOT Built Yet

- [ ] **Client review + payment cycle** — deliver campaign → review period → get paid
- [ ] **Monthly expenses** — rent, utilities, salaries due monthly
- [ ] **Hiring system** — recruit new employees from a candidate pool
- [ ] **Skill XP + leveling** — skills improve through use
- [ ] **Dynamic morale/energy** — drain from work, recharge from rest, affected by events
- [ ] **Attribute gameplay effects** — Speed→work rate, Genius→quality, etc.
- [ ] **Random events** — choose-your-own-adventure cards with consequences
- [ ] **Multiple offices/maps** — upgrade from starter office
- [ ] **Employee relationships** — synergies, conflicts, social dynamics
- [ ] **Campaign quality system** — output quality varies by who works on it
- [ ] **Save/load** — persist game state
- [ ] **Notifications/popups** — toast system for milestone events

---

## Maintenance

**This document must stay current.** Whenever an architectural change is made — new system, component, resource, UI panel, data file, behavior, or change to the data flow — CLAUDE.md must be updated to reflect it.

### How to Update

When making architecture changes, spawn a subagent with this task:
1. Read the modified/added source files
2. Read the current `CLAUDE.md`
3. Identify exactly which section(s) are affected (systems table, resources table, component categories, client architecture, key directories, what works/not built, etc.)
4. Apply targeted edits — do not rewrite sections that haven't changed

This keeps updates minimal (low token cost per change) while ensuring the doc never drifts from the codebase.

---

## Design Principles

1. **ECS purity** — simulation logic lives in systems, never in React components
2. **Zustand is read-only** — the store is a snapshot, not the source of truth
3. **New mechanic = new system file** — drop in at a priority level, don't modify existing systems
4. **Behaviors are pluggable** — register a handler, add weights to characters
5. **Data-driven** — characters, maps, pipeline steps, tasks all defined as static data
6. **Seeded PRNG** — deterministic simulation for debugging and reproducibility
