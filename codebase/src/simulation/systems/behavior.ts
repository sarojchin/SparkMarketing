/**
 * Behavior System
 *
 * Each tick, checks entities with BehaviorState.
 * When their state timer expires, picks a new behavior
 * based on their BehaviorWeights component and dispatches
 * to the registered handler via the behavior registry.
 *
 * This system has ZERO imports from React/Zustand.
 * It communicates outward via world.emit('log', ...).
 *
 * To add new behaviors: register a handler in the behavior registry
 * and add weights to character definitions.
 */

import type { World, EntityId } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type {
  Position, Appearance, BehaviorState, PathFollower, StatusIndicator,
  Identity, Interactable, DeskAssignment, BehaviorWeights, AssignedTask,
} from '@/simulation/components';
import { SIM_CLOCK, TILEMAP } from '@/simulation/resources';
import { findPath } from '@/utils/pathfinding';
import { rng } from '@/utils/rng';
import { behaviorRegistry } from '@/simulation/registries/behaviors';
import type { BehaviorContext } from '@/simulation/registries/behaviors';

// Activity log messages by behavior
const WORK_TASKS: Record<string, string[]> = {
  'CEO / Founder': ['reviewing quarterly strategy', 'updating investor deck', 'writing team memo'],
  'Content Strategist': ['writing blog post', 'drafting email campaign', 'reviewing analytics', 'updating content calendar'],
  'Ads Manager': ['optimizing ad spend', 'reviewing CTR data', 'setting up A/B test', 'adjusting targeting'],
  'Designer': ['designing banner ads', 'updating brand assets', 'creating social graphics', 'revising landing page'],
};

const DEFAULT_WEIGHTS: Record<string, number> = {
  work: 0.5, coffee: 0.15, wander: 0.15, chat: 0.15, whiteboard: 0.05,
};

export function behaviorSystem(world: World, dt: number): void {
  const clock = world.getResource(SIM_CLOCK);
  if (clock.speed === 0) return;

  const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
  const positions = world.getStore<Position>(COMPONENTS.POSITION);
  const identities = world.getStore<Identity>(COMPONENTS.IDENTITY);
  const paths = world.getStore<PathFollower>(COMPONENTS.PATH_FOLLOWER);
  const statusIndicators = world.getStore<StatusIndicator>(COMPONENTS.STATUS_INDICATOR);
  const weightsStore = world.getStore<BehaviorWeights>(COMPONENTS.BEHAVIOR_WEIGHTS);
  const assignedTasks = world.getStore<AssignedTask>(COMPONENTS.ASSIGNED_TASK);

  const entities = world.query(COMPONENTS.BEHAVIOR, COMPONENTS.POSITION, COMPONENTS.IDENTITY);

  for (const entity of entities) {
    const beh = behaviors.get(entity)!;
    const pos = positions.get(entity)!;
    const id = identities.get(entity)!;

    // No task assigned → stay idle
    const task = assignedTasks.get(entity);
    if (!task?.taskKey) {
      if (beh.current !== 'idle') {
        beh.current = 'idle';
        beh.timer = 0;
      }
      const indicator = statusIndicators.get(entity);
      if (indicator) {
        indicator.color = '#f97316'; // orange for idle
        indicator.pulse = false;
      }
      continue;
    }

    // Don't tick timer if currently walking (movement system handles transition)
    if (paths.has(entity) && paths.get(entity)!.path.length > 0) continue;

    // Tick down state timer
    beh.timer -= dt * clock.speed * 0.06;

    if (beh.timer <= 0) {
      // Get weights from component (falls back to defaults)
      const weightsComp = weightsStore.get(entity);
      const weights = weightsComp?.weights || DEFAULT_WEIGHTS;

      // Weighted random selection
      const roll = rng.next();
      let cumulative = 0;
      let chosen = 'work';

      for (const [behavior, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (roll < cumulative) {
          chosen = behavior;
          break;
        }
      }

      // Dispatch to registered handler
      const handler = behaviorRegistry.get(chosen);
      if (handler) {
        const tilemap = world.getResource(TILEMAP);
        const ctx: BehaviorContext = { world, entity, position: pos, identity: id, tilemap };
        handler(ctx);
      } else {
        // Fallback: idle
        beh.current = 'idle';
        beh.timer = 60 + rng.next() * 100;
      }
    }

    // Update status indicator
    const indicator = statusIndicators.get(entity);
    if (indicator) {
      const stateColors: Record<string, string> = {
        working: '#4ade80',   // green
        idle: '#f97316',      // orange
        walking: '#60a5fa',
        coffee: '#a78bfa',
        meeting: '#f472b6',
        chatting: '#fbbf24',
        thinking: '#60a5fa',
      };
      indicator.color = stateColors[beh.current] || '#5a5d6e';
      indicator.pulse = beh.current === 'working';
    }
  }
}

// --- Built-in behavior handlers ---
// These are registered in factory.ts via behaviorRegistry.register()

export function workHandler(ctx: BehaviorContext): void {
  const { world, entity, position: pos, identity: id, tilemap } = ctx;
  const beh = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR).get(entity)!;
  const desk = world.getStore<DeskAssignment>(COMPONENTS.DESK_ASSIGNMENT).get(entity);

  if (desk) {
    const deskPos = world.getStore<Position>(COMPONENTS.POSITION).get(desk.deskEntity);
    if (deskPos) {
      const target = { x: deskPos.x + desk.seatOffset.x, y: deskPos.y + desk.seatOffset.y };
      navigateTo(world, entity, pos, target.x, target.y, tilemap.tiles, 'working');
    }
  }

  beh.timer = 400 + rng.next() * 600;

  const tasks = WORK_TASKS[id.role] || ['working'];
  const task = rng.pick(tasks);
  world.emit('log', { message: `${id.name} — ${task}`, type: 'action' });
}

export function coffeeHandler(ctx: BehaviorContext): void {
  const { world, entity, position: pos, identity: id, tilemap } = ctx;
  const beh = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR).get(entity)!;
  const interactables = world.getStore<Interactable>(COMPONENTS.INTERACTABLE);

  for (const fEntity of world.query(COMPONENTS.INTERACTABLE, COMPONENTS.FURNITURE_TAG, COMPONENTS.POSITION)) {
    const appearance = world.getStore<Appearance>(COMPONENTS.APPEARANCE).get(fEntity);
    if (appearance?.spriteType === 'coffee_machine') {
      const inter = interactables.get(fEntity)!;
      if (inter.interactionPoint) {
        navigateTo(world, entity, pos, inter.interactionPoint.x, inter.interactionPoint.y, tilemap.tiles, 'coffee');
        beh.timer = 80 + rng.next() * 80;
        world.emit('log', { message: `${id.name} grabs a coffee`, type: 'chat' });
        return;
      }
    }
  }

  // Fallback: just idle
  beh.current = 'idle';
  beh.timer = 60 + rng.next() * 100;
}

export function chatHandler(ctx: BehaviorContext): void {
  const { world, entity, position: pos, identity: id, tilemap } = ctx;
  const beh = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR).get(entity)!;

  const others = world.query(COMPONENTS.BEHAVIOR, COMPONENTS.POSITION, COMPONENTS.IDENTITY)
    .filter(e => e !== entity);

  if (others.length === 0) {
    beh.current = 'idle';
    beh.timer = 100;
    return;
  }

  const target = rng.pick(others);
  const targetPos = world.getStore<Position>(COMPONENTS.POSITION).get(target)!;
  const targetId = world.getStore<Identity>(COMPONENTS.IDENTITY).get(target)!;

  const chatX = Math.round(targetPos.x) + 1;
  const chatY = Math.round(targetPos.y);

  navigateTo(world, entity, pos, chatX, chatY, tilemap.tiles, 'chatting');
  beh.timer = 120 + rng.next() * 200;
  beh.metadata = { chatTarget: targetId.name };
  world.emit('log', { message: `${id.name} chats with ${targetId.name}`, type: 'chat' });
}

export function whiteboardHandler(ctx: BehaviorContext): void {
  const { world, entity, position: pos, identity: id, tilemap } = ctx;
  const beh = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR).get(entity)!;

  for (const fEntity of world.query(COMPONENTS.INTERACTABLE, COMPONENTS.POSITION)) {
    const appearance = world.getStore<Appearance>(COMPONENTS.APPEARANCE).get(fEntity);
    if (appearance?.spriteType === 'whiteboard') {
      const inter = world.getStore<Interactable>(COMPONENTS.INTERACTABLE).get(fEntity)!;
      if (inter.interactionPoint) {
        navigateTo(world, entity, pos, inter.interactionPoint.x, inter.interactionPoint.y, tilemap.tiles, 'meeting');
        beh.timer = 150 + rng.next() * 250;
        world.emit('log', { message: `${id.name} reviews strategy at whiteboard`, type: 'action' });
        return;
      }
    }
  }
  beh.current = 'idle';
  beh.timer = 100;
}

export function wanderHandler(ctx: BehaviorContext): void {
  const { world, entity, position: pos, identity: id, tilemap } = ctx;
  const beh = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR).get(entity)!;

  const tx = rng.int(2, tilemap.tiles[0].length - 3);
  const ty = rng.int(2, tilemap.tiles.length - 3);

  if (tilemap.tiles[ty] && tilemap.tiles[ty][tx] && tilemap.tiles[ty][tx].walkable) {
    navigateTo(world, entity, pos, tx, ty, tilemap.tiles, 'idle');
    beh.timer = 80 + rng.next() * 150;
  } else {
    beh.current = 'idle';
    beh.timer = 60 + rng.next() * 100;
  }
}

// --- Shared navigation helper ---

function navigateTo(world: World, entity: EntityId, pos: Position, tx: number, ty: number, tilemap: any, nextState: string) {
  const path = findPath(Math.round(pos.x), Math.round(pos.y), tx, ty, tilemap);
  if (path.length > 0) {
    world.getStore<PathFollower>(COMPONENTS.PATH_FOLLOWER).set(entity, {
      path,
      speed: 2.5,
    });
    const beh = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR).get(entity)!;
    beh.current = 'walking';
    beh.nextState = nextState as any;
  }
}
