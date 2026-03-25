/**
 * SYSTEM REGISTRY
 *
 * Central registration point for all game systems.
 * Systems are ticked in registration order.
 *
 * Usage:
 *   const registry = new SystemRegistry();
 *   registry.register('characters', new CharacterSystem());
 *   registry.register('business', new BusinessProcessSystem());
 *
 *   // In tick loop:
 *   for (const system of registry.getAll()) {
 *     system.tick(state, dt, context);
 *   }
 *
 * Benefits:
 * - Add new mechanics by registering a new system
 * - Unregister to disable a mechanic (no code deletion)
 * - Clear execution order (systems tick in registration order)
 * - Easy to test each system in isolation
 */

import type { System } from './System';

export class SystemRegistry {
  private systems = new Map<string, System>();
  private registrationOrder: string[] = [];

  /**
   * Register a system
   * If ID already exists, replaces it and maintains order
   */
  register(id: string, system: System): void {
    // If already registered, remove from order
    if (this.systems.has(id)) {
      this.registrationOrder = this.registrationOrder.filter((s) => s !== id);
    }
    this.systems.set(id, system);
    this.registrationOrder.push(id);
    console.log(`✅ System registered: ${system.name} (${id})`);
  }

  /**
   * Unregister a system (call destroy if exists)
   */
  async unregister(id: string): Promise<void> {
    const system = this.systems.get(id);
    if (!system) return;
    if (system.destroy) {
      await system.destroy();
    }
    this.systems.delete(id);
    this.registrationOrder = this.registrationOrder.filter((s) => s !== id);
    console.log(`❌ System unregistered: ${system.name} (${id})`);
  }

  /**
   * Get a specific system by ID
   */
  get(id: string): System | undefined {
    return this.systems.get(id);
  }

  /**
   * Get all systems in registration order
   */
  getAll(): System[] {
    return this.registrationOrder.map((id) => this.systems.get(id)!);
  }

  /**
   * Check if a system is registered
   */
  has(id: string): boolean {
    return this.systems.has(id);
  }

  /**
   * Get system count
   */
  size(): number {
    return this.systems.size;
  }

  /**
   * Cleanup all systems
   */
  async destroy(): Promise<void> {
    for (const id of this.registrationOrder) {
      await this.unregister(id);
    }
  }
}
