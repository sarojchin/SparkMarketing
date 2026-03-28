/**
 * Snapshot System
 *
 * Periodically syncs ECS entity state into the Zustand store
 * so React UI components can read it without querying the World directly.
 *
 * This is the ONLY system that writes to useSimStore.
 * All other systems communicate via the World's event bus or resources.
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { Position, Appearance, BehaviorState, Identity, PipelineState, Morale, Energy, Attributes, AssignedTask, ProductionCounters } from '@/simulation/components';
import { SIM_CLOCK, CAMPAIGN, PLAYER_DIRECTIVE } from '@/simulation/resources';
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
  const pipelines = world.getStore<PipelineState>(COMPONENTS.PIPELINE_STATE);
  const morales = world.getStore<Morale>(COMPONENTS.MORALE);
  const energies = world.getStore<Energy>(COMPONENTS.ENERGY);
  const attributeStore = world.getStore<Attributes>(COMPONENTS.ATTRIBUTES);
  const assignedTasks = world.getStore<AssignedTask>(COMPONENTS.ASSIGNED_TASK);
  const productionCounters = world.getStore<ProductionCounters>(COMPONENTS.PRODUCTION_COUNTERS);

  const DEFAULT_ATTRS = { persistence: 'C' as const, empathy: 'C' as const, genius: 'C' as const, speed: 'C' as const };

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
    const pipe = pipelines.get(entity);

    people.push({
      entity,
      name: id.name,
      role: id.role,
      department: id.department,
      color: app.primaryColor,
      state: beh.current,
      x: pos.x,
      y: pos.y,
      stepName: pipe?.stepName ?? '',
      stepProgress: pipe?.stepProgress ?? 0,
      phase: pipe?.phase ?? '',
      currentStep: pipe?.currentStep ?? 0,
      totalSteps: pipe?.totalSteps ?? 0,
      morale: morales.get(entity)?.current ?? 50,
      energy: energies.get(entity)?.current ?? 100,
      attributes: attributeStore.get(entity)?.grades ?? DEFAULT_ATTRS,
      assignedTaskKey: assignedTasks.get(entity)?.taskKey ?? null,
      taskProgress: assignedTasks.get(entity)?.progress ?? 0,
      callsMade: productionCounters.get(entity)?.callsMade ?? 0,
      emailsSent: productionCounters.get(entity)?.emailsSent ?? 0,
      campaignsCreated: productionCounters.get(entity)?.campaignsCreated ?? 0,
    });
  }

  // Aggregate production counters across all entities
  let totalCalls = 0, totalEmails = 0, totalCampaigns = 0;
  for (const p of people) {
    totalCalls += p.callsMade;
    totalEmails += p.emailsSent;
    totalCampaigns += p.campaignsCreated;
  }

  // Sync people + clock + campaign state to Zustand
  const clock = world.getResource(SIM_CLOCK);
  const campaign = world.getResource(CAMPAIGN);
  const store = useSimStore.getState();
  store.updatePeople(people);
  store.syncClock(clock.tick, clock.simMinutes, clock.simDay, clock.speed);
  store.syncCampaign(campaign.campaignsShipped, campaign.grossIncome, campaign.bank);
  store.syncTotalCounters(totalCalls, totalEmails, totalCampaigns);

  const directive = world.getResource(PLAYER_DIRECTIVE);
  store.syncDirective(directive.assignedPhase);
}
