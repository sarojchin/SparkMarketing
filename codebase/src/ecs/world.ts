/**
 * Entity Component System — core engine
 *
 * Entities: just numeric IDs
 * Components: plain typed data objects, stored in Maps keyed by entity ID
 * Systems: functions that query entities by component signature and process them
 * Resources: typed singletons for global state (clock, tilemap, config)
 * Events: typed event bus for decoupled cross-system communication
 *
 * This pattern lets us add new behaviors (processes, AI, animation)
 * without touching existing code — just add components and systems.
 *
 * Scaling notes (each is a modular swap, no system changes needed):
 * - ComponentStore internals can be replaced with archetype-based storage
 * - query() can be backed by a bitmask index
 * - Resources can be extended with change-detection wrappers
 */

export type EntityId = number;

export class ComponentStore<T> {
  private data = new Map<EntityId, T>();

  set(entity: EntityId, value: T): void {
    this.data.set(entity, value);
  }

  get(entity: EntityId): T | undefined {
    return this.data.get(entity);
  }

  has(entity: EntityId): boolean {
    return this.data.has(entity);
  }

  delete(entity: EntityId): void {
    this.data.delete(entity);
  }

  entries(): IterableIterator<[EntityId, T]> {
    return this.data.entries();
  }

  values(): IterableIterator<T> {
    return this.data.values();
  }

  keys(): IterableIterator<EntityId> {
    return this.data.keys();
  }

  get size(): number {
    return this.data.size;
  }

  /** Get all entities that have this component */
  all(): EntityId[] {
    return [...this.data.keys()];
  }
}

export type SystemFn = (world: World, dt: number) => void;

export interface System {
  id: string;
  fn: SystemFn;
  priority: number; // lower runs first
  enabled: boolean;
}

// --- Typed Event Definitions ---

export interface WorldEvents {
  'log': { message: string; type: 'action' | 'event' | 'chat' | 'system' | 'quote' };
  'entity:spawned': { entity: EntityId };
  'entity:despawned': { entity: EntityId };
  'behavior:changed': { entity: EntityId; from: string; to: string };
  'client:acquired': { entity: EntityId; name: string; industry: string; size: number; project: string };
  'client:lost': { entity: EntityId; name: string; reason: string };
}

export type EventKey = keyof WorldEvents;

// --- Resource Key ---
// Typed resource keys ensure type-safe access to world resources.
// To add a new resource: add an entry to ResourceMap and call world.setResource().

export class ResourceKey<T> {
  constructor(public readonly id: string) {}
}

export class World {
  private nextEntityId: EntityId = 1;
  private entities = new Set<EntityId>();
  private systems: System[] = [];
  private componentStores = new Map<string, ComponentStore<any>>();

  // Typed resource storage — singletons accessed by ResourceKey<T>
  private resources = new Map<string, unknown>();

  // Typed event bus — keyed by WorldEvents interface
  private typedListeners = new Map<string, Set<(payload: any) => void>>();

  // --- Entity management ---

  spawn(): EntityId {
    const id = this.nextEntityId++;
    this.entities.add(id);
    this.emit('entity:spawned', { entity: id });
    return id;
  }

  despawn(entity: EntityId): void {
    this.entities.delete(entity);
    for (const store of this.componentStores.values()) {
      store.delete(entity);
    }
    this.emit('entity:despawned', { entity });
  }

  exists(entity: EntityId): boolean {
    return this.entities.has(entity);
  }

  entityCount(): number {
    return this.entities.size;
  }

  allEntities(): EntityId[] {
    return [...this.entities];
  }

  // --- Component management ---

  registerComponent<T>(name: string): ComponentStore<T> {
    if (this.componentStores.has(name)) {
      return this.componentStores.get(name)!;
    }
    const store = new ComponentStore<T>();
    this.componentStores.set(name, store);
    return store;
  }

  getStore<T>(name: string): ComponentStore<T> {
    let store = this.componentStores.get(name);
    if (!store) {
      store = new ComponentStore<T>();
      this.componentStores.set(name, store);
    }
    return store;
  }

  /** Query entities that have ALL of the specified components */
  query(...componentNames: string[]): EntityId[] {
    const stores = componentNames.map(n => this.componentStores.get(n));
    if (stores.some(s => !s)) return [];

    // Start with smallest store for efficiency
    const sorted = stores
      .map((s, i) => ({ store: s!, name: componentNames[i] }))
      .sort((a, b) => a.store.size - b.store.size);

    const result: EntityId[] = [];
    for (const entity of sorted[0].store.keys()) {
      if (sorted.every(s => s.store.has(entity))) {
        result.push(entity);
      }
    }
    return result;
  }

  // --- Resource management (typed singletons) ---

  setResource<T>(key: ResourceKey<T>, value: T): void {
    this.resources.set(key.id, value);
  }

  getResource<T>(key: ResourceKey<T>): T {
    const value = this.resources.get(key.id);
    if (value === undefined) {
      throw new Error(`Resource "${key.id}" not found. Register it with world.setResource() before use.`);
    }
    return value as T;
  }

  hasResource<T>(key: ResourceKey<T>): boolean {
    return this.resources.has(key.id);
  }

  // --- System management ---

  addSystem(id: string, fn: SystemFn, priority = 0): void {
    this.systems.push({ id, fn, priority, enabled: true });
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  removeSystem(id: string): void {
    this.systems = this.systems.filter(s => s.id !== id);
  }

  enableSystem(id: string, enabled: boolean): void {
    const sys = this.systems.find(s => s.id === id);
    if (sys) sys.enabled = enabled;
  }

  tick(dt: number): void {
    for (const system of this.systems) {
      if (system.enabled) {
        system.fn(this, dt);
      }
    }
  }

  // --- Typed event bus ---

  on<K extends EventKey>(event: K, handler: (payload: WorldEvents[K]) => void): () => void {
    if (!this.typedListeners.has(event)) {
      this.typedListeners.set(event, new Set());
    }
    this.typedListeners.get(event)!.add(handler);
    return () => this.typedListeners.get(event)?.delete(handler);
  }

  emit<K extends EventKey>(event: K, payload: WorldEvents[K]): void {
    this.typedListeners.get(event)?.forEach(fn => fn(payload));
  }
}
