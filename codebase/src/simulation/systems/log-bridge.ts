/**
 * Log Bridge
 *
 * Listens to 'log' events on the World event bus and pushes them
 * into the Zustand store for the React LogPanel to display.
 *
 * This is NOT a per-tick system — it's a one-time event listener
 * set up during world creation.
 */

import type { World } from '@/ecs';
import { useSimStore } from '@/hooks/useSimStore';

export function setupLogBridge(world: World): void {
  world.on('log', (payload) => {
    useSimStore.getState().addLog(payload.message, payload.type);
  });
}
