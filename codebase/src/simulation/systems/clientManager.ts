/**
 * Client Manager System
 *
 * Keeps the CLIENT_ROSTER resource in sync with actual client entities.
 * Future client mechanics (acquisition, satisfaction, billing) plug in
 * alongside this system at nearby priorities.
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import { SIM_CLOCK, CLIENT_ROSTER } from '@/simulation/resources';

export function clientManagerSystem(world: World, dt: number): void {
  const clock = world.getResource(SIM_CLOCK);
  if (clock.speed === 0) return;

  const roster = world.getResource(CLIENT_ROSTER);
  const clients = world.query(COMPONENTS.CLIENT_TAG);
  roster.activeClients = clients.length;
}
