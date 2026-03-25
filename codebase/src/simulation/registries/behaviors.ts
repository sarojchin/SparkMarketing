/**
 * Behavior Registry
 *
 * Pluggable behavior handlers for the behavior system.
 * Instead of a switch statement, behaviors register themselves here.
 *
 * To add a new behavior:
 *   1. Write a BehaviorHandler function
 *   2. Call behaviorRegistry.register('yourBehavior', handler)
 *   3. Add the weight to character definitions
 *
 * The behavior system uses weighted random selection from the entity's
 * BehaviorWeights component, then dispatches to the registered handler.
 */

import type { World, EntityId } from '@/ecs';
import type { Position, Identity } from '@/simulation/components';
import type { TilemapResource } from '@/simulation/resources';

export interface BehaviorContext {
  world: World;
  entity: EntityId;
  position: Position;
  identity: Identity;
  tilemap: TilemapResource;
}

export type BehaviorHandler = (ctx: BehaviorContext) => void;

class BehaviorRegistry {
  private handlers = new Map<string, BehaviorHandler>();

  register(name: string, handler: BehaviorHandler): void {
    this.handlers.set(name, handler);
  }

  get(name: string): BehaviorHandler | undefined {
    return this.handlers.get(name);
  }

  has(name: string): boolean {
    return this.handlers.has(name);
  }

  /** List all registered behavior names */
  names(): string[] {
    return [...this.handlers.keys()];
  }
}

export const behaviorRegistry = new BehaviorRegistry();
