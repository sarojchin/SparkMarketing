/**
 * Components — pure data attached to entities.
 * 
 * Design principle: components are SMALL and SINGLE-PURPOSE.
 * An employee entity might have: Position, Appearance, Role, Energy, 
 * BehaviorState, PathFollower, etc. Furniture has: Position, Appearance, 
 * Interactable. This lets systems operate on exactly the data they need.
 */

// --- Spatial ---

export interface Position {
  x: number;
  y: number;
}

export interface TilePosition {
  tileX: number;
  tileY: number;
}

export interface Facing {
  direction: 'up' | 'down' | 'left' | 'right';
}

// --- Visual ---

export type SpriteType =
  | 'person'
  | 'desk'
  | 'chair'
  | 'plant'
  | 'coffee_machine'
  | 'whiteboard'
  | 'door'
  | 'rug'
  | 'bookshelf'
  | 'printer'
  | 'couch';

export interface Appearance {
  spriteType: SpriteType;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  zIndex: number;
}

export interface Animation {
  frame: number;
  timer: number;
  speed: number; // ms per frame
  frameCount: number;
}

export interface StatusIndicator {
  color: string;
  visible: boolean;
  pulse: boolean;
}

// --- Identity ---

export interface Identity {
  name: string;
  role: string;
  department: string;
  shortLabel: string;
}

// --- Employee state ---

export type AgentState =
  | 'idle'
  | 'working'
  | 'walking'
  | 'coffee'
  | 'meeting'
  | 'chatting'
  | 'thinking'
  | 'away';

export interface BehaviorState {
  current: AgentState;
  timer: number;          // ms remaining in current state
  nextState: AgentState | null;
  metadata: Record<string, any>; // e.g. { chatTarget: 'maya' }
}

export interface Energy {
  current: number;  // 0-100
  max: number;
  drainRate: number;    // per work-hour
  rechargeRate: number; // per rest-hour
}

export interface Morale {
  current: number; // 0-100
}

export interface Skills {
  values: Record<string, number>; // skill name -> 0-100
}

// --- Movement ---

export interface PathFollower {
  path: { x: number; y: number }[];
  speed: number; // tiles per second
}

export interface DeskAssignment {
  deskEntity: number; // entity ID of the desk
  seatOffset: { x: number; y: number }; // where to sit relative to desk
}

// --- AI ---

export interface BehaviorWeights {
  weights: Record<string, number>; // behavior name -> probability weight
}

// --- Production ---

export interface ProductionTask {
  taskName: string;       // e.g. "Blog Post", "Ad Creative"
  progress: number;       // 0–1
  progressRate: number;   // progress per second while working
  complete: boolean;
}

// --- Furniture ---

export interface Interactable {
  type: 'sit' | 'use' | 'look';
  interactionPoint: { x: number; y: number }; // where a person stands to interact
  inUseBy: number | null; // entity ID
}

export interface FurnitureTag {
  category: 'workspace' | 'social' | 'utility' | 'decoration';
}

// --- Map ---

export interface TileData {
  walkable: boolean;
  type: 'floor' | 'wall' | 'rug' | 'door';
  variant: number; // for visual variation
}

// Component name constants — prevents typos
export const COMPONENTS = {
  POSITION: 'position',
  TILE_POSITION: 'tilePosition',
  FACING: 'facing',
  APPEARANCE: 'appearance',
  ANIMATION: 'animation',
  STATUS_INDICATOR: 'statusIndicator',
  IDENTITY: 'identity',
  BEHAVIOR: 'behaviorState',
  ENERGY: 'energy',
  MORALE: 'morale',
  SKILLS: 'skills',
  PATH_FOLLOWER: 'pathFollower',
  DESK_ASSIGNMENT: 'deskAssignment',
  INTERACTABLE: 'interactable',
  FURNITURE_TAG: 'furnitureTag',
  BEHAVIOR_WEIGHTS: 'behaviorWeights',
  PRODUCTION_TASK: 'productionTask',
} as const;
