/**
 * Clock System
 *
 * Advances the SimClock resource each tick.
 * Owns all time logic — speed, minutes, day rollover.
 *
 * The Zustand store reads from SimClock (via snapshotSystem),
 * but this system is the single source of truth for time.
 */

import type { World } from '@/ecs';
import { SIM_CLOCK } from '@/simulation/resources';

export function clockSystem(world: World, dt: number): void {
  const clock = world.getResource(SIM_CLOCK);
  if (clock.speed === 0) return;

  const scaledDt = dt * clock.speed;

  const prevTick = clock.tick;
  clock.tick += scaledDt;

  // 1 sim-minute per 500ms of scaled time
  const minuteThreshold = 500;
  const elapsed = Math.floor(clock.tick / minuteThreshold) - Math.floor(prevTick / minuteThreshold);

  clock.simMinutes += elapsed;

  // 8-hour day rollover (480 minutes)
  if (clock.simMinutes >= 480) {
    clock.simMinutes = 0;
    clock.simDay++;
  }
}
