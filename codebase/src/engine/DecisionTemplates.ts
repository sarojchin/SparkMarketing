/**
 * DECISION TEMPLATES
 *
 * Data-driven decision system. Instead of hardcoding decision logic,
 * define decisions as JSON/objects with templates, options, and consequences.
 *
 * This allows:
 * - Non-programmers to design game balance
 * - Easy A/B testing (swap JSON file)
 * - No code changes to add/remove decision types
 * - Weighted randomization from config
 *
 * Usage (future):
 *   const template = templates.get('contract_offer');
 *   const decision = template.generate(gameState);
 *   // Returns fully hydrated Decision with random parameters filled in
 */

import type { Decision, DecisionOption } from './types';

/**
 * Template for a single decision type
 *
 * weight: probability of this decision type being chosen
 * generate: function that creates a Decision instance
 */
export interface DecisionTemplate {
  id: string;
  name: string;
  weight: number; // relative weight for random selection
  generate: (gameState: any) => Decision; // TODO: type properly
}

/**
 * Template registry
 * Future: Load from JSON config files
 */
export class DecisionTemplates {
  private templates = new Map<string, DecisionTemplate>();
  private totalWeight = 0;

  /**
   * Register a decision template
   */
  register(template: DecisionTemplate): void {
    this.templates.set(template.id, template);
    this.totalWeight += template.weight;
    console.log(`✅ Decision template registered: ${template.name} (weight: ${template.weight})`);
  }

  /**
   * Get template by ID
   */
  get(id: string): DecisionTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAll(): DecisionTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Select random template by weight
   */
  selectRandomTemplate(): DecisionTemplate | undefined {
    if (this.templates.size === 0) return undefined;

    let random = Math.random() * this.totalWeight;
    for (const template of this.templates.values()) {
      random -= template.weight;
      if (random <= 0) return template;
    }

    // Fallback (shouldn't happen)
    return this.getAll()[0];
  }

  /**
   * Generate a decision from random template
   */
  generateRandomDecision(gameState: any): Decision | undefined {
    const template = this.selectRandomTemplate();
    if (!template) return undefined;
    return template.generate(gameState);
  }
}

// Placeholder: Default empty templates
// TODO: Load from config or define builtins
export const defaultTemplates = new DecisionTemplates();
