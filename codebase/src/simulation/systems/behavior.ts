/**
 * Behavior System
 * 
 * Each tick, checks entities with BehaviorState.
 * When their state timer expires, picks a new behavior
 * based on their personality weights and current context.
 * 
 * To add new behaviors: add a case to the decision function
 * and a handler that sets up the path/state/metadata.
 */

import type { World, EntityId } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type {
  Position, BehaviorState, PathFollower, StatusIndicator,
  Identity, Interactable, FurnitureTag, DeskAssignment,
} from '@/simulation/components';
import { findPath } from '@/utils/pathfinding';
import { rng } from '@/utils/rng';
import { useSimStore } from '@/hooks/useSimStore';

// Behavior weights per character (loaded from character data)
const behaviorWeights = new Map<EntityId, Record<string, number>>();

export function registerBehaviorWeights(entity: EntityId, weights: Record<string, number>) {
  behaviorWeights.set(entity, weights);
}

// Activity log messages by behavior
const WORK_TASKS: Record<string, string[]> = {
  'CEO / Founder': ['reviewing quarterly strategy', 'updating investor deck', 'writing team memo'],
  'Content Strategist': ['writing blog post', 'drafting email campaign', 'reviewing analytics', 'updating content calendar'],
  'Ads Manager': ['optimizing ad spend', 'reviewing CTR data', 'setting up A/B test', 'adjusting targeting'],
  'Designer': ['designing banner ads', 'updating brand assets', 'creating social graphics', 'revising landing page'],
};

export function behaviorSystem(world: World, dt: number): void {
  const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
  const positions = world.getStore<Position>(COMPONENTS.POSITION);
  const identities = world.getStore<Identity>(COMPONENTS.IDENTITY);
  const paths = world.getStore<PathFollower>(COMPONENTS.PATH_FOLLOWER);
  const statusIndicators = world.getStore<StatusIndicator>(COMPONENTS.STATUS_INDICATOR);
  const deskAssignments = world.getStore<DeskAssignment>(COMPONENTS.DESK_ASSIGNMENT);

  const simStore = useSimStore.getState();
  const speed = simStore.speed;
  if (speed === 0) return;

  const entities = world.query(COMPONENTS.BEHAVIOR, COMPONENTS.POSITION, COMPONENTS.IDENTITY);

  for (const entity of entities) {
    const beh = behaviors.get(entity)!;
    const pos = positions.get(entity)!;
    const id = identities.get(entity)!;

    // Don't tick timer if currently walking (movement system handles transition)
    if (paths.has(entity) && paths.get(entity)!.path.length > 0) continue;

    // Tick down state timer
    beh.timer -= dt * speed * 0.06;

    if (beh.timer <= 0) {
      // Decide next behavior
      decideBehavior(world, entity, beh, pos, id);
    }

    // Update status indicator
    const indicator = statusIndicators.get(entity);
    if (indicator) {
      const stateColors: Record<string, string> = {
        working: '#4ade80',
        idle: '#fbbf24',
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

function decideBehavior(
  world: World,
  entity: EntityId,
  beh: BehaviorState,
  pos: Position,
  identity: Identity,
) {
  const weights = behaviorWeights.get(entity) || {
    work: 0.5, coffee: 0.15, wander: 0.15, chat: 0.15, whiteboard: 0.05,
  };

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

  const simStore = useSimStore.getState();
  const tilemap = simStore.tilemap;
  if (!tilemap) return;

  switch (chosen) {
    case 'work':
      goToWork(world, entity, beh, pos, identity, tilemap);
      break;
    case 'coffee':
      goToCoffee(world, entity, beh, pos, identity, tilemap);
      break;
    case 'chat':
      goChat(world, entity, beh, pos, identity, tilemap);
      break;
    case 'whiteboard':
      goWhiteboard(world, entity, beh, pos, identity, tilemap);
      break;
    case 'wander':
    default:
      goWander(world, entity, beh, pos, identity, tilemap);
      break;
  }
}

function goToWork(world: World, entity: EntityId, beh: BehaviorState, pos: Position, id: Identity, tilemap: any) {
  const desk = world.getStore<DeskAssignment>(COMPONENTS.DESK_ASSIGNMENT).get(entity);

  if (desk) {
    const deskPos = world.getStore<Position>(COMPONENTS.POSITION).get(desk.deskEntity);
    if (deskPos) {
      const target = { x: deskPos.x + desk.seatOffset.x, y: deskPos.y + desk.seatOffset.y };
      navigateTo(world, entity, pos, target.x, target.y, tilemap, 'working');
    }
  }

  beh.timer = 400 + rng.next() * 600;

  const tasks = WORK_TASKS[id.role] || ['working'];
  const task = rng.pick(tasks);
  useSimStore.getState().addLog(`${id.name} — ${task}`, 'action');
}

function goToCoffee(world: World, entity: EntityId, beh: BehaviorState, pos: Position, id: Identity, tilemap: any) {
  // Find coffee machine furniture entity
  const interactables = world.getStore<Interactable>(COMPONENTS.INTERACTABLE);
  const furnitureTags = world.getStore<FurnitureTag>(COMPONENTS.FURNITURE_TAG);
  const positions = world.getStore<Position>(COMPONENTS.POSITION);

  for (const fEntity of world.query(COMPONENTS.INTERACTABLE, COMPONENTS.FURNITURE_TAG, COMPONENTS.POSITION)) {
    const appearance = world.getStore(COMPONENTS.APPEARANCE).get(fEntity);
    if (appearance?.spriteType === 'coffee_machine') {
      const inter = interactables.get(fEntity)!;
      if (inter.interactionPoint) {
        navigateTo(world, entity, pos, inter.interactionPoint.x, inter.interactionPoint.y, tilemap, 'coffee');
        beh.timer = 80 + rng.next() * 80;
        useSimStore.getState().addLog(`${id.name} grabs a coffee`, 'chat');
        return;
      }
    }
  }

  // Fallback: just idle
  beh.current = 'idle';
  beh.timer = 60 + rng.next() * 100;
}

function goChat(world: World, entity: EntityId, beh: BehaviorState, pos: Position, id: Identity, tilemap: any) {
  // Find another person who is working (at their desk)
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

  // Go near them
  const chatX = Math.round(targetPos.x) + 1;
  const chatY = Math.round(targetPos.y);

  navigateTo(world, entity, pos, chatX, chatY, tilemap, 'chatting');
  beh.timer = 120 + rng.next() * 200;
  beh.metadata = { chatTarget: targetId.name };
  useSimStore.getState().addLog(`${id.name} chats with ${targetId.name}`, 'chat');
}

function goWhiteboard(world: World, entity: EntityId, beh: BehaviorState, pos: Position, id: Identity, tilemap: any) {
  for (const fEntity of world.query(COMPONENTS.INTERACTABLE, COMPONENTS.POSITION)) {
    const appearance = world.getStore(COMPONENTS.APPEARANCE).get(fEntity);
    if (appearance?.spriteType === 'whiteboard') {
      const inter = world.getStore<Interactable>(COMPONENTS.INTERACTABLE).get(fEntity)!;
      if (inter.interactionPoint) {
        navigateTo(world, entity, pos, inter.interactionPoint.x, inter.interactionPoint.y, tilemap, 'meeting');
        beh.timer = 150 + rng.next() * 250;
        useSimStore.getState().addLog(`${id.name} reviews strategy at whiteboard`, 'action');
        return;
      }
    }
  }
  beh.current = 'idle';
  beh.timer = 100;
}

function goWander(world: World, entity: EntityId, beh: BehaviorState, pos: Position, id: Identity, tilemap: any) {
  const tx = rng.int(2, tilemap[0].length - 3);
  const ty = rng.int(2, tilemap.length - 3);

  if (tilemap[ty] && tilemap[ty][tx] && tilemap[ty][tx].walkable) {
    navigateTo(world, entity, pos, tx, ty, tilemap, 'idle');
    beh.timer = 80 + rng.next() * 150;
  } else {
    beh.current = 'idle';
    beh.timer = 60 + rng.next() * 100;
  }
}

function navigateTo(world: World, entity: EntityId, pos: Position, tx: number, ty: number, tilemap: any, nextState: string) {
  const path = findPath(Math.round(pos.x), Math.round(pos.y), tx, ty, tilemap);
  if (path.length > 0) {
    world.getStore<PathFollower>(COMPONENTS.PATH_FOLLOWER).set(entity, {
      path,
      speed: 2.5, // tiles per second
    });
    const beh = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR).get(entity)!;
    beh.current = 'walking';
    beh.nextState = nextState as any;
  }
}
