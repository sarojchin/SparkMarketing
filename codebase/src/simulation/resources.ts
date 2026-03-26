/**
 * Typed ECS Resources — global singletons owned by the World.
 *
 * Resources are the ECS way to store data that isn't per-entity:
 * the clock, the tilemap, configuration, etc.
 *
 * Each resource is accessed via a typed ResourceKey<T>, so
 * world.getResource(SIM_CLOCK) returns SimClock — no casts, no `any`.
 *
 * To add a new resource:
 *   1. Define the interface here
 *   2. Export a ResourceKey<YourType>
 *   3. Call world.setResource(YOUR_KEY, initialValue) in factory.ts
 */

import { ResourceKey } from '@/ecs';
import type { TileData } from '@/simulation/components';

// --- Simulation Clock ---

export interface SimClock {
  speed: number;       // 0 = paused, 1/3/8 = multiplier
  tick: number;        // raw accumulator (ms × speed)
  simMinutes: number;  // minutes since 9:00 AM (0–479)
  simDay: number;      // day counter
}

export const SIM_CLOCK = new ResourceKey<SimClock>('simClock');

// --- Tilemap ---

export interface TilemapResource {
  tiles: TileData[][];
  width: number;
  height: number;
}

export const TILEMAP = new ResourceKey<TilemapResource>('tilemap');

// --- Campaign / Production ---

export interface Campaign {
  campaignsShipped: number;
  grossIncome: number;     // lifetime total earned
  bank: number;            // current balance
  campaignValue: number;   // revenue per shipped campaign
  campaignNumber: number;  // current campaign # (for display)
}

export const CAMPAIGN = new ResourceKey<Campaign>('campaign');

// --- Player Directive ---

export interface PlayerDirective {
  /** Which phase the player has assigned, or null if waiting for orders */
  assignedPhase: string | null;
}

export const PLAYER_DIRECTIVE = new ResourceKey<PlayerDirective>('playerDirective');
