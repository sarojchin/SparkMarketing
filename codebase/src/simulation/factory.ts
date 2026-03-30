/**
 * World Factory
 *
 * Takes a MapDefinition + CharacterDefs and spawns everything
 * into an ECS World. Returns the configured world ready to tick.
 */

import { World } from '@/ecs';
import type { EntityId } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type {
  Position, Facing, Appearance, Animation, StatusIndicator,
  Identity, BehaviorState, Energy, Morale, Skills,
  DeskAssignment, Interactable, FurnitureTag, BehaviorWeights,
  PipelineState, Attributes, AssignedTask, ProductionCounters,
  ClientTag, ClientIdentity, ClientReputation,
} from '@/simulation/components';
import type { MapDefinition } from '@/simulation/data/maps';
import type { CharacterDef } from '@/simulation/data/characters';
import { STARTER_CLIENTS } from '@/simulation/data/clients';
import { SIM_CLOCK, TILEMAP, CAMPAIGN, PLAYER_DIRECTIVE, CLIENT_ROSTER, CLIENT_ACQUISITION } from '@/simulation/resources';
import {
  behaviorSystem, movementSystem, clockSystem, snapshotSystem,
  pipelineSystem, quoteSystem, taskProductionSystem, setupLogBridge,
  clientManagerSystem, clientAcquisitionSystem, setupClientAcquisitionBridge,
  workHandler, coffeeHandler, chatHandler, whiteboardHandler, wanderHandler,
} from '@/simulation/systems';
import { PIPELINE_STEPS, CAMPAIGN_VALUE } from '@/simulation/data/production';
import { behaviorRegistry } from '@/simulation/registries/behaviors';
import { useSimStore } from '@/hooks/useSimStore';

export interface WorldSetupResult {
  world: World;
  personEntities: Map<string, EntityId>;
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

  // --- Register resources ---
  world.setResource(SIM_CLOCK, {
    speed: 1,
    tick: 0,
    simMinutes: 0,
    simDay: 0,
  });

  world.setResource(TILEMAP, {
    tiles: mapDef.tiles,
    width: mapDef.width,
    height: mapDef.height,
  });

  world.setResource(CAMPAIGN, {
    campaignsShipped: 0,
    grossIncome: 0,
    bank: 0,
    campaignValue: CAMPAIGN_VALUE,
    campaignNumber: 0,
  });

  world.setResource(PLAYER_DIRECTIVE, {
    assignedPhase: null,
  });

  world.setResource(CLIENT_ROSTER, {
    activeClients: 0,
    totalClientsEver: 0,
    maxClients: 10,
  });

  world.setResource(CLIENT_ACQUISITION, {
    lastThresholdProcessed: 0,
    pendingResults: [],
  });

  // Also push tilemap to Zustand for the renderer (reads from store)
  useSimStore.getState().setTilemap(mapDef.tiles, mapDef.width, mapDef.height);

  // --- Wire event bridges ---
  setupLogBridge(world);
  setupClientAcquisitionBridge(world);

  // --- Register behaviors ---
  behaviorRegistry.register('work', workHandler);
  behaviorRegistry.register('coffee', coffeeHandler);
  behaviorRegistry.register('chat', chatHandler);
  behaviorRegistry.register('whiteboard', whiteboardHandler);
  behaviorRegistry.register('wander', wanderHandler);

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

    world.getStore<Position>(COMPONENTS.POSITION).set(entity, {
      x: spawn.x,
      y: spawn.y,
    });

    world.getStore<Facing>(COMPONENTS.FACING).set(entity, {
      direction: 'down',
    });

    world.getStore<Appearance>(COMPONENTS.APPEARANCE).set(entity, {
      spriteType: 'person',
      primaryColor: charDef.colors.primary,
      secondaryColor: charDef.colors.hair,
      tertiaryColor: charDef.colors.skin,
      zIndex: 10,
    });

    world.getStore<Animation>(COMPONENTS.ANIMATION).set(entity, {
      frame: 0,
      timer: 0,
      speed: 200,
      frameCount: 4,
    });

    world.getStore<StatusIndicator>(COMPONENTS.STATUS_INDICATOR).set(entity, {
      color: '#4ade80',
      visible: true,
      pulse: false,
    });

    world.getStore<Identity>(COMPONENTS.IDENTITY).set(entity, {
      name: charDef.name,
      role: charDef.role,
      department: charDef.department,
      shortLabel: charDef.shortLabel,
    });

    world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR).set(entity, {
      current: spawn.deskIndex !== undefined ? 'working' : 'idle',
      timer: 200 + Math.random() * 400,
      nextState: null,
      metadata: {},
    });

    world.getStore<Energy>(COMPONENTS.ENERGY).set(entity, {
      current: 85 + Math.random() * 15,
      max: 100,
      drainRate: 5,
      rechargeRate: 30,
    });

    world.getStore<Morale>(COMPONENTS.MORALE).set(entity, {
      current: 65 + Math.random() * 25,
    });

    world.getStore<Skills>(COMPONENTS.SKILLS).set(entity, {
      values: { ...charDef.skills },
    });

    world.getStore<BehaviorWeights>(COMPONENTS.BEHAVIOR_WEIGHTS).set(entity, {
      weights: { ...charDef.behaviorWeights },
    });

    world.getStore<Attributes>(COMPONENTS.ATTRIBUTES).set(entity, {
      grades: { ...charDef.attributes },
    });

    world.getStore<AssignedTask>(COMPONENTS.ASSIGNED_TASK).set(entity, {
      taskKey: null,
      progress: 0,
    });

    world.getStore<ProductionCounters>(COMPONENTS.PRODUCTION_COUNTERS).set(entity, {
      callsMade: 0,
      emailsSent: 0,
      campaignsCreated: 0,
    });

    // Desk assignment
    if (spawn.deskIndex !== undefined && deskEntities[spawn.deskIndex]) {
      world.getStore<DeskAssignment>(COMPONENTS.DESK_ASSIGNMENT).set(entity, {
        deskEntity: deskEntities[spawn.deskIndex],
        seatOffset: { x: 1, y: 0 },
      });
    }

    // Pipeline state — start at step 0
    const firstStep = PIPELINE_STEPS[0];
    world.getStore<PipelineState>(COMPONENTS.PIPELINE_STATE).set(entity, {
      currentStep: 0,
      stepProgress: 0,
      stepName: firstStep.name,
      phase: firstStep.phase,
      totalSteps: PIPELINE_STEPS.length,
      pipelineComplete: false,
    });
  }

  // --- Register systems (priority order: lower runs first) ---
  world.addSystem('clock', clockSystem, 1);
  world.addSystem('behavior', behaviorSystem, 10);
  world.addSystem('movement', movementSystem, 20);
  world.addSystem('pipeline', pipelineSystem, 30);
  world.addSystem('taskProduction', taskProductionSystem, 31);
  world.addSystem('quotes', quoteSystem, 35);
  world.addSystem('clientManager', clientManagerSystem, 40);
  world.addSystem('clientAcquisition', clientAcquisitionSystem, 41);
  world.addSystem('snapshot', snapshotSystem, 100);

  return { world, personEntities, furnitureEntities, deskEntities };
}
