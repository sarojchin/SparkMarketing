/**
 * Task Production System
 *
 * Advances independent task counters for each character based on their
 * assigned task. Only ticks while the character is actively working at
 * their desk. Progress accumulates fractionally and increments the
 * relevant counter when it reaches 1.0.
 *
 * Reads: AssignedTask, ProductionCounters, BehaviorState, Identity, SimClock
 * Writes: AssignedTask (progress), ProductionCounters
 * Emits: 'log' events when a unit is produced
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { AssignedTask, ProductionCounters, BehaviorState, Identity } from '@/simulation/components';
import { SIM_CLOCK } from '@/simulation/resources';
import { TASK_DEFS } from '@/simulation/data/production';

/** Track last known taskKey per entity to detect assignment changes */
const lastTaskKey = new Map<number, string | null>();

export function taskProductionSystem(world: World, dt: number): void {
  const clock = world.getResource(SIM_CLOCK);
  if (clock.speed === 0) return;

  const scaledDt = dt * clock.speed;
  const dtSeconds = scaledDt / 1000;

  const tasks = world.getStore<AssignedTask>(COMPONENTS.ASSIGNED_TASK);
  const counters = world.getStore<ProductionCounters>(COMPONENTS.PRODUCTION_COUNTERS);
  const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
  const identities = world.getStore<Identity>(COMPONENTS.IDENTITY);

  const entities = world.query(
    COMPONENTS.ASSIGNED_TASK,
    COMPONENTS.PRODUCTION_COUNTERS,
    COMPONENTS.BEHAVIOR,
    COMPONENTS.IDENTITY,
  );

  for (const entity of entities) {
    const task = tasks.get(entity)!;
    const id = identities.get(entity)!;

    // Detect task assignment changes and log once
    const prev = lastTaskKey.get(entity) ?? null;
    if (task.taskKey !== prev) {
      lastTaskKey.set(entity, task.taskKey);
      if (task.taskKey) {
        const def = TASK_DEFS[task.taskKey];
        if (def) {
          world.emit('log', { message: `${id.name} ${def.startLog}`, type: 'action' });
        }
      }
    }

    const beh = behaviors.get(entity)!;
    if (!task.taskKey) continue;
    if (beh.current !== 'working') continue;

    const taskDef = TASK_DEFS[task.taskKey];
    if (!taskDef) continue;

    const counter = counters.get(entity)!;

    task.progress += taskDef.ratePerSecond * dtSeconds;

    while (task.progress >= 1.0) {
      task.progress -= 1.0;
      counter[taskDef.counterField]++;
    }
  }
}
