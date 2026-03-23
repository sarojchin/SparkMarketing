/**
 * World Factory
 * 
 * Takes a MapDefinition + CharacterDefs and spawns everything
 * into an ECS World. Returns the configured world ready to tick.
 * 
 * To add a new scenario: create a new MapDefinition + character list,
 * pass them here.
 */

import { World } from '@/ecs';
import type { EntityId } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type {
  Position, Facing, Appearance, Animation, StatusIndicator,
  Identity, BehaviorState, Energy, Morale, Skills,
  DeskAssignment, Interactable, FurnitureTag,
} from '@/simulation/components';
import type { MapDefinition } from '@/simulation/data/maps';
import type { CharacterDef } from '@/simulation/data/characters';
import { movementSystem, behaviorSystem, registerBehaviorWeights } from '@/simulation/systems';
import { useSimStore } from '@/hooks/useSimStore';

export interface WorldSetupResult {
  world: World;
  personEntities: Map<string, EntityId>;  // character id -> entity id
  furnitureEntities: EntityId[];
  deskEntities: EntityId[];
}

export function createWorld(
  mapDef: MapDefinition,
  characters: CharacterDef[],
): WorldSetupResult {
  const world = new World();
  const personEntities = new Map<string, EntityId>();
  const furnitureEntities: EntityId[] = [];
  const deskEntities: EntityId[] = [];

  // Store tilemap in sim store
  useSimStore.getState().setTilemap(mapDef.tiles, mapDef.width, mapDef.height);

  // --- Spawn furniture ---
  for (const f of mapDef.furniture) {
    const entity = world.spawn();
    furnitureEntities.push(entity);

    world.getStore<Position>(COMPONENTS.POSITION).set(entity, { x: f.x, y: f.y });

    world.getStore<Appearance>(COMPONENTS.APPEARANCE).set(entity, {
      spriteType: f.type,
      primaryColor: '#5a4a35',
      secondaryColor: '#3d3224',
      tertiaryColor: '#1a1c28',
      zIndex: f.type === 'rug' ? 0 : 5,
    });

    world.getStore<FurnitureTag>(COMPONENTS.FURNITURE_TAG).set(entity, {
      category: f.category,
    });

    if (f.interactionPoint) {
      world.getStore<Interactable>(COMPONENTS.INTERACTABLE).set(entity, {
        type: f.type === 'desk' ? 'sit' : 'use',
        interactionPoint: f.interactionPoint,
        inUseBy: null,
      });
    }

    if (f.type === 'desk') {
      deskEntities.push(entity);
    }
  }

  // --- Spawn people ---
  for (const charDef of characters) {
    const spawn = mapDef.spawns.find(s => s.id === charDef.id);
    if (!spawn) continue;

    const entity = world.spawn();
    personEntities.set(charDef.id, entity);

    // Position
    world.getStore<Position>(COMPONENTS.POSITION).set(entity, {
      x: spawn.x,
      y: spawn.y,
    });

    // Facing
    world.getStore<Facing>(COMPONENTS.FACING).set(entity, {
      direction: 'down',
    });

    // Appearance
    world.getStore<Appearance>(COMPONENTS.APPEARANCE).set(entity, {
      spriteType: 'person',
      primaryColor: charDef.colors.primary,
      secondaryColor: charDef.colors.hair,
      tertiaryColor: charDef.colors.skin,
      zIndex: 10,
    });

    // Animation
    world.getStore<Animation>(COMPONENTS.ANIMATION).set(entity, {
      frame: 0,
      timer: 0,
      speed: 200,
      frameCount: 4,
    });

    // Status indicator
    world.getStore<StatusIndicator>(COMPONENTS.STATUS_INDICATOR).set(entity, {
      color: '#4ade80',
      visible: true,
      pulse: false,
    });

    // Identity
    world.getStore<Identity>(COMPONENTS.IDENTITY).set(entity, {
      name: charDef.name,
      role: charDef.role,
      department: charDef.department,
      shortLabel: charDef.shortLabel,
    });

    // Behavior
    world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR).set(entity, {
      current: spawn.deskIndex !== undefined ? 'working' : 'idle',
      timer: 200 + Math.random() * 400,
      nextState: null,
      metadata: {},
    });

    // Energy
    world.getStore<Energy>(COMPONENTS.ENERGY).set(entity, {
      current: 85 + Math.random() * 15,
      max: 100,
      drainRate: 5,
      rechargeRate: 30,
    });

    // Morale
    world.getStore<Morale>(COMPONENTS.MORALE).set(entity, {
      current: 65 + Math.random() * 25,
    });

    // Skills
    world.getStore<Skills>(COMPONENTS.SKILLS).set(entity, {
      values: { ...charDef.skills },
    });

    // Desk assignment
    if (spawn.deskIndex !== undefined && deskEntities[spawn.deskIndex]) {
      world.getStore<DeskAssignment>(COMPONENTS.DESK_ASSIGNMENT).set(entity, {
        deskEntity: deskEntities[spawn.deskIndex],
        seatOffset: { x: 1, y: 0 }, // sit to the right of desk
      });
    }

    // Register behavior weights
    registerBehaviorWeights(entity, charDef.behaviorWeights);
  }

  // --- Register systems (order matters) ---
  world.addSystem('behavior', behaviorSystem, 10);
  world.addSystem('movement', movementSystem, 20);

  return { world, personEntities, furnitureEntities, deskEntities };
}
