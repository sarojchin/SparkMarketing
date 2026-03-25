/**
 * ECS CORE TYPES
 *
 * Entity Component System architecture for scalable game simulation.
 * Separates data (components) from behavior (systems) for easy extension.
 */

// --- Entity ---

export type EntityId = number & { readonly __brand: 'EntityId' };

export function createEntityId(id: number): EntityId {
  return id as EntityId;
}

// --- Component ---

export interface Component {
  readonly type: string;
}

export type ComponentMap = Record<string, Component>;

// --- Component Types ---

/** Position in the office */
export interface PositionComponent extends Component {
  readonly type: 'position';
  x: number;
  y: number;
}

/** Current activity state */
export interface StateComponent extends Component {
  readonly type: 'state';
  state: 'working' | 'idle' | 'walking' | 'coffee' | 'meeting' | 'chatting' | 'thinking' | 'away';
}

/** Role/Title */
export interface RoleComponent extends Component {
  readonly type: 'role';
  name: string;
  role: string;
  department: string;
}

/** Display/Visual properties */
export interface DisplayComponent extends Component {
  readonly type: 'display';
  color: string;
}

/** Entity owner type (what is this entity?) */
export interface OwnerComponent extends Component {
  readonly type: 'owner';
  entityType: 'character' | 'client' | 'contract' | 'campaign' | 'agency';
}

/** Financial properties */
export interface FinancialComponent extends Component {
  readonly type: 'financial';
  cashOnHand: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  profitMargin: number;
}

/** Client properties */
export interface ClientComponent extends Component {
  readonly type: 'client';
  satisfaction: number;
  contractValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  daysSinceClienthood: number;
}

/** Contract properties */
export interface ContractComponent extends Component {
  readonly type: 'contract';
  clientId: EntityId;
  monthlyValue: number;
  status: 'active' | 'completed' | 'lost' | 'at-risk';
  daysRemaining: number;
  deliverablesMet?: number;
}

/** Campaign properties */
export interface CampaignComponent extends Component {
  readonly type: 'campaign';
  contractId: EntityId;
  name: string;
  phase: 'strategy' | 'creative' | 'production' | 'launch' | 'reporting';
  progress: number;
  status: 'active' | 'completed' | 'blocked';
}

// --- System ---

export interface System {
  readonly id: string;
  readonly name: string;

  init(world: EntityWorld): Promise<void>;
  tick(world: EntityWorld, dt: number): void;
  destroy(): Promise<void>;
}

// --- Entity World ---

export interface EntityWorld {
  // Entity management
  createEntity(): EntityId;
  destroyEntity(id: EntityId): void;
  hasEntity(id: EntityId): boolean;

  // Component management
  addComponent<T extends Component>(entityId: EntityId, component: T): void;
  removeComponent(entityId: EntityId, type: string): void;
  getComponent<T extends Component>(entityId: EntityId, type: string): T | undefined;
  hasComponent(entityId: EntityId, type: string): boolean;
  getComponents(entityId: EntityId): ComponentMap;

  // Query entities by components
  queryEntities(...componentTypes: string[]): EntityId[];

  // Metadata
  getAllEntities(): EntityId[];
  getEntityCount(): number;
}

// --- Event System (for future) ---

export interface GameEvent {
  readonly type: string;
  readonly entityId?: EntityId;
  readonly timestamp: number;
}

export interface EventBus {
  publish(event: GameEvent): void;
  subscribe(eventType: string, handler: (event: GameEvent) => void): () => void;
}
