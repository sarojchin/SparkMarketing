/**
 * Snapshot System
 *
 * Periodically syncs ECS entity state into the Zustand store
 * so React UI components can read it without querying the World directly.
 *
 * This is the ONLY system that writes to useSimStore.
 * All other systems communicate via the World's event bus or resources.
 *
 * Scaling note: This can be replaced with reactive/dirty-flag based
 * syncing when entity counts grow large enough to matter.
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { Position, Appearance, BehaviorState, Identity } from '@/simulation/components';
import { SIM_CLOCK } from '@/simulation/resources';
import { useSimStore } from '@/hooks/useSimStore';
import type { PersonSnapshot } from '@/hooks/useSimStore';

const SYNC_INTERVAL_MS = 200;
let accumulator = 0;

export function snapshotSystem(world: World, dt: number): void {
  accumulator += dt;
  if (accumulator < SYNC_INTERVAL_MS) return;
  accumulator = 0;

  const positions = world.getStore<Position>(COMPONENTS.POSITION);
  const appearances = world.getStore<Appearance>(COMPONENTS.APPEARANCE);
  const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
  const identities = world.getStore<Identity>(COMPONENTS.IDENTITY);

  const people: PersonSnapshot[] = [];

  for (const entity of world.query(
    COMPONENTS.POSITION,
    COMPONENTS.APPEARANCE,
    COMPONENTS.BEHAVIOR,
    COMPONENTS.IDENTITY,
  )) {
    const pos = positions.get(entity)!;
    const app = appearances.get(entity)!;
    const beh = behaviors.get(entity)!;
    const id = identities.get(entity)!;

    people.push({
      entity,
      name: id.name,
      role: id.role,
      department: id.department,
      color: app.primaryColor,
      state: beh.current,
      x: pos.x,
      y: pos.y,
    });
  }

  // Sync people + clock state to Zustand in one batch
  const clock = world.getResource(SIM_CLOCK);
  const store = useSimStore.getState();
  store.updatePeople(people);
  store.syncClock(clock.tick, clock.simMinutes, clock.simDay, clock.speed);
}
