/**
 * SIMULATION MANAGER
 *
 * Orchestrates all registered systems and converts ECS state → GameState snapshot.
 *
 * Responsibility:
 * 1. Hold the SystemRegistry
 * 2. Each tick: call tick() on all systems in order
 * 3. Build AgentContext for systems to query state
 * 4. (Future) Convert ECS world state to GameState snapshots
 *
 * Current integration: Works alongside SimpleEngine
 * Future: Replaces SimpleEngine logic entirely with systems-based approach
 */

import type { GameState, AgentContext } from './types';
import { SystemRegistry } from './systems/SystemRegistry';
import type { System } from './systems/System';

export class SimulationManager {
  private registry = new SystemRegistry();

  /**
   * Register a system for this simulation
   */
  registerSystem(id: string, system: System): void {
    this.registry.register(id, system);
  }

  /**
   * Unregister a system
   */
  async unregisterSystem(id: string): Promise<void> {
    await this.registry.unregister(id);
  }

  /**
   * Get system by ID
   */
  getSystem(id: string): System | undefined {
    return this.registry.get(id);
  }

  /**
   * Initialize all registered systems
   */
  async init(state: GameState): Promise<void> {
    console.log(`🚀 SimulationManager initializing with ${this.registry.size()} systems...`);
    for (const system of this.registry.getAll()) {
      if (system.init) {
        await system.init(state);
      }
    }
    console.log('✅ SimulationManager initialized');
  }

  /**
   * Main update loop
   * Ticks all registered systems in order
   */
  tick(state: GameState, dt: number): void {
    // Build context for systems to query state without mutating
    const context = this.buildContext(state);

    // Tick all systems in registration order
    for (const system of this.registry.getAll()) {
      system.tick(state, dt, context);
    }
  }

  /**
   * Build readonly context from current state
   * Used by systems to query state without direct mutation
   */
  private buildContext(state: GameState): AgentContext {
    return {
      gameTime: state.gameDate,
      currentTick: state.currentTick,
      financials: state.financials,
      clients: state.clients,
      contracts: state.contracts,
      campaigns: state.campaigns,
      team: state.team,
      teamCapacity: {
        totalHours: state.team.length * 8, // assuming 8 hour workday per person
        allocatedHours: 0, // TODO: track allocated hours
        available: state.team.length * 8,
      },
    };
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    console.log('🧹 SimulationManager cleaning up...');
    await this.registry.destroy();
    console.log('✅ SimulationManager destroyed');
  }
}
