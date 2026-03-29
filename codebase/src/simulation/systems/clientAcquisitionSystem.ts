/**
 * Client Acquisition System (Priority 41)
 *
 * Watches total calls made across all employees. Every 150 calls,
 * a prospect is "reached" and enters a 1-sim-minute pending window.
 * After that window, a 20% chance converts them to an active client.
 *
 * Reads: ProductionCounters, CLIENT_ACQUISITION, CLIENT_ROSTER, SIM_CLOCK
 * Writes: CLIENT_ACQUISITION, CLIENT_ROSTER, spawns client entities
 * Emits: 'log', 'client:acquired'
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { ProductionCounters, ClientTag, ClientIdentity, ClientReputation } from '@/simulation/components';
import { SIM_CLOCK, CLIENT_ROSTER, CLIENT_ACQUISITION } from '@/simulation/resources';
import { PROSPECT_POOL } from '@/simulation/data/clients';
import { useSimStore } from '@/hooks/useSimStore';

// Track which prospect indices have been queued so we don't repeat the same prospect
const usedProspectIndices = new Set<number>();

function pickRandomProspect(): number | null {
  const available = PROSPECT_POOL
    .map((_, i) => i)
    .filter(i => !usedProspectIndices.has(i));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function clientAcquisitionSystem(world: World, _dt: number): void {
  const clock = world.getResource(SIM_CLOCK);
  if (clock.speed === 0) return;

  const acquisition = world.getResource(CLIENT_ACQUISITION);
  const roster = world.getResource(CLIENT_ROSTER);
  const counterStore = world.getStore<ProductionCounters>(COMPONENTS.PRODUCTION_COUNTERS);

  // --- 1. Aggregate total calls across all employees ---
  let totalCalls = 0;
  for (const entity of world.query(COMPONENTS.PRODUCTION_COUNTERS)) {
    totalCalls += counterStore.get(entity)!.callsMade;
  }

  // --- 2. Process newly crossed 150-call thresholds ---
  const currentThreshold = Math.floor(totalCalls / 150);
  while (acquisition.lastThresholdProcessed < currentThreshold) {
    acquisition.lastThresholdProcessed++;

    const idx = pickRandomProspect();
    if (idx === null) {
      world.emit('log', { message: 'No new prospects in the pipeline — keep dialing!', type: 'event' });
      break;
    }

    usedProspectIndices.add(idx);
    const prospect = PROSPECT_POOL[idx];
    const absoluteMinute = clock.simDay * 480 + clock.simMinutes;

    acquisition.pendingResults.push({
      prospectIndex: idx,
      resolveAtAbsoluteMinute: absoluteMinute + 1,
    });

    world.emit('log', {
      message: `Reached ${prospect.name} — following up...`,
      type: 'event',
    });
  }

  // --- 3. Resolve pending acquisitions ---
  const currentAbsoluteMinute = clock.simDay * 480 + clock.simMinutes;
  const stillPending: typeof acquisition.pendingResults = [];

  for (const pending of acquisition.pendingResults) {
    if (currentAbsoluteMinute < pending.resolveAtAbsoluteMinute) {
      stillPending.push(pending);
      continue;
    }

    const prospect = PROSPECT_POOL[pending.prospectIndex];

    if (Math.random() < 0.2) {
      // --- SOLD ---
      const entity = world.spawn();
      world.getStore<ClientTag>(COMPONENTS.CLIENT_TAG).set(entity, { _brand: 'client' });
      world.getStore<ClientIdentity>(COMPONENTS.CLIENT_IDENTITY).set(entity, {
        name: prospect.name,
        industry: prospect.industry,
        size: prospect.size,
      });
      world.getStore<ClientReputation>(COMPONENTS.CLIENT_REPUTATION).set(entity, {
        score: prospect.reputation,
      });

      roster.totalClientsEver++;

      world.emit('log', {
        message: `New client acquired: ${prospect.name}!`,
        type: 'event',
      });

      world.emit('client:acquired', {
        entity,
        name: prospect.name,
        industry: prospect.industry,
        size: prospect.size,
        project: prospect.project,
      });
    } else {
      // --- NOT SOLD ---
      world.emit('log', {
        message: `${prospect.name} — no deal this time`,
        type: 'event',
      });
    }
  }

  acquisition.pendingResults = stillPending;
}

export function setupClientAcquisitionBridge(world: World): void {
  world.on('client:acquired', (payload) => {
    useSimStore.getState().notifyClientAcquired({
      name: payload.name,
      industry: payload.industry,
      size: payload.size,
      project: payload.project,
    });
  });
}
