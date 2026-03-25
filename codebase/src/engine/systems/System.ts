/**
 * BASE SYSTEM INTERFACE
 *
 * All game mechanics (systems) implement this interface.
 * Systems are stateless transformers: they receive game state, apply mutations, and return it.
 * The SimulationManager ticks all registered systems each frame.
 *
 * Pattern: Register once, tick every frame, no cross-system coupling.
 */

import type { GameState, AgentContext } from '../types';

export interface System {
  /** System identifier (must be unique in registry) */
  id: string;

  /** Human-readable name for debugging */
  name: string;

  /**
   * Initialize system with initial game state (optional)
   * Called once at engine startup
   */
  init?(state: GameState): Promise<void>;

  /**
   * Core update loop
   * Receives current state + delta time, mutates state in-place, optional return
   *
   * @param state - Current game state (mutate freely)
   * @param dt - Delta time since last tick (seconds)
   * @param context - Readonly context about game (for querying without mutation)
   */
  tick(state: GameState, dt: number, context: AgentContext): void;

  /**
   * Cleanup (optional)
   * Called when system is unregistered or engine destroyed
   */
  destroy?(): Promise<void>;
}
