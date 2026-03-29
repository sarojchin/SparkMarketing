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

### Key Directories
```
src/
├── ecs/                    # Core ECS engine (World, ComponentStore, ResourceKey)
├── simulation/
│   ├── components/         # All component type definitions
│   ├── data/               # Static game data (characters, maps, pipeline, attributes, quotes)
│   ├── systems/            # All ECS systems (clock, behavior, movement, production, etc.)
│   ├── registries/         # Pluggable behavior handler registry
│   ├── resources.ts        # Typed resource definitions (SimClock, Campaign, etc.)
│   └── factory.ts          # World setup — spawns entities, registers systems
├── renderer/               # Canvas 2D rendering (tiles, sprites, speech bubbles)
├── hooks/                  # Zustand store (useSimStore)
├── ui/
│   ├── overlays/           # HUD, Tooltip (floating over canvas)
│   └── panels/             # Bottom bar panels (Team, Info, Outreach, Campaign, Log, Pipeline)
└── utils/                  # Seeded PRNG, BFS pathfinding
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
| 100 | snapshot | Syncs ECS → Zustand every 200ms |

### Resources
| Key | Type | Purpose |
|-----|------|---------|
| SIM_CLOCK | SimClock | Time: speed, tick, simMinutes, simDay |
| TILEMAP | TilemapResource | Map grid for rendering + pathfinding |
| CAMPAIGN | Campaign | Revenue tracking: bank, gross income, campaigns shipped |
| PLAYER_DIRECTIVE | PlayerDirective | Currently assigned phase (legacy, being superseded by per-entity tasks) |

### Data Flow
```
Player clicks UI (React)
  → Zustand store action (e.g., assignEntityTask)
  → App.tsx subscription drains to ECS component
  → Systems process each tick
  → Snapshot system syncs back to Zustand (every 200ms)
  → React re-renders from store
```

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
- [x] UI panels: HUD, Pipeline, Character, Team, Info, Outreach, Campaign, Log

## What's NOT Built Yet

- [ ] **Client entities** — clients as ECS entities with name, reputation, demandingness
- [ ] **Client acquisition funnel** — calls → responses → conversions → active clients
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

## Design Principles

1. **ECS purity** — simulation logic lives in systems, never in React components
2. **Zustand is read-only** — the store is a snapshot, not the source of truth
3. **New mechanic = new system file** — drop in at a priority level, don't modify existing systems
4. **Behaviors are pluggable** — register a handler, add weights to characters
5. **Data-driven** — characters, maps, pipeline steps, tasks all defined as static data
6. **Seeded PRNG** — deterministic simulation for debugging and reproducibility
