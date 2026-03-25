/**
 * Production System
 *
 * Advances each person's ProductionTask progress while they are working.
 * When all tasks are complete, ships a campaign (generates revenue)
 * and resets all tasks with new assignments.
 *
 * Reads: BehaviorState, ProductionTask, SimClock
 * Writes: ProductionTask, Campaign resource
 * Emits: 'log' events for task completion and campaign shipment
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { BehaviorState, ProductionTask, Identity } from '@/simulation/components';
import { SIM_CLOCK, CAMPAIGN } from '@/simulation/resources';
import { ROLE_TASKS } from '@/simulation/data/production';

export function productionSystem(world: World, dt: number): void {
  const clock = world.getResource(SIM_CLOCK);
  if (clock.speed === 0) return;

  const scaledDt = dt * clock.speed;
  const dtSeconds = scaledDt / 1000;

  const tasks = world.getStore<ProductionTask>(COMPONENTS.PRODUCTION_TASK);
  const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
  const identities = world.getStore<Identity>(COMPONENTS.IDENTITY);

  const entities = world.query(COMPONENTS.PRODUCTION_TASK, COMPONENTS.BEHAVIOR, COMPONENTS.IDENTITY);

  let allComplete = true;
  let anyWorker = false;

  for (const entity of entities) {
    const task = tasks.get(entity)!;
    const beh = behaviors.get(entity)!;

    anyWorker = true;

    if (task.complete) continue;

    allComplete = false;

    // Only advance progress while actively working at desk
    if (beh.current === 'working') {
      task.progress = Math.min(1, task.progress + task.progressRate * dtSeconds);

      if (task.progress >= 1) {
        task.complete = true;
        const id = identities.get(entity)!;
        world.emit('log', { message: `${id.name} finished: ${task.taskName}`, type: 'event' });
      }
    }
  }

  // Check if all tasks complete → ship campaign
  if (anyWorker && allComplete) {
    shipCampaign(world, entities);
  }
}

function shipCampaign(world: World, entities: number[]): void {
  const campaign = world.getResource(CAMPAIGN);
  const tasks = world.getStore<ProductionTask>(COMPONENTS.PRODUCTION_TASK);
  const identities = world.getStore<Identity>(COMPONENTS.IDENTITY);

  campaign.campaignsShipped++;
  campaign.revenue += campaign.campaignValue;
  campaign.campaignNumber++;

  world.emit('log', {
    message: `Campaign #${campaign.campaignsShipped} shipped! +$${campaign.campaignValue.toLocaleString()}`,
    type: 'event',
  });

  // Reset all tasks with new assignments
  for (const entity of entities) {
    const id = identities.get(entity)!;
    const prev = tasks.get(entity)!;
    const roleTasks = ROLE_TASKS[id.role];
    const taskName = roleTasks
      ? roleTasks[campaign.campaignNumber % roleTasks.length]
      : 'General work';

    tasks.set(entity, {
      taskName,
      progress: 0,
      progressRate: prev.progressRate,
      complete: false,
    });
  }
}
