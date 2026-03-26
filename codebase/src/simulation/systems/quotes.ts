/**
 * Quote System
 *
 * Periodically emits flavor quotes while a character is working.
 * Picks quotes contextually based on current pipeline phase.
 * Also fires a 'victory' quote when a pipeline step completes.
 *
 * Each entity tracks its own cooldown so quotes don't spam.
 * Uses the character's ID (from Identity.shortLabel mapped to CharacterDef.id)
 * to look up their personal QuotesBank.
 *
 * Reads: BehaviorState, PipelineState, Identity
 * Emits: 'log' events with type 'quote'
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { BehaviorState, PipelineState, Identity } from '@/simulation/components';
import { SIM_CLOCK } from '@/simulation/resources';
import { rng } from '@/utils/rng';
import {
  quotesRegistry, PHASE_QUOTE_MAP, GENERAL_CATEGORIES,
  type QuoteCategory,
} from '@/simulation/data/quotes';

/** Per-entity quote state tracked outside ECS (lightweight, system-internal) */
interface QuoteState {
  cooldown: number;        // seconds remaining until next quote
  lastCategory: string;    // avoid repeating same category twice
  lastQuoteIdx: number;    // avoid repeating exact same quote
  prevStep: number;        // detect step completion for victory quotes
}

const entityQuoteState = new Map<number, QuoteState>();

/** Cooldown range in real seconds (before speed scaling) */
const MIN_COOLDOWN = 15;
const MAX_COOLDOWN = 40;

/** Chance that a general category (hustle/doubt) fires instead of phase-specific */
const GENERAL_CHANCE = 0.3;

function nextCooldown(): number {
  return MIN_COOLDOWN + rng.next() * (MAX_COOLDOWN - MIN_COOLDOWN);
}

function getCharacterId(identity: Identity): string {
  // Map known roles to character IDs
  const roleMap: Record<string, string> = {
    'Founder': 'founder',
    'CEO / Founder': 'maya',
    'Content Strategist': 'alex',
    'Ads Manager': 'jordan',
    'Designer': 'sam',
  };
  return roleMap[identity.role] || identity.name.toLowerCase().replace(/\s+/g, '_');
}

function pickQuote(
  bank: Record<string, string[]>,
  category: QuoteCategory,
  state: QuoteState,
): string | null {
  const quotes = bank[category];
  if (!quotes || quotes.length === 0) return null;

  // Pick a random quote, avoiding the last one if possible
  let idx = rng.int(0, quotes.length - 1);
  if (quotes.length > 1 && idx === state.lastQuoteIdx && state.lastCategory === category) {
    idx = (idx + 1) % quotes.length;
  }

  state.lastQuoteIdx = idx;
  state.lastCategory = category;
  return quotes[idx];
}

export function quoteSystem(world: World, dt: number): void {
  const clock = world.getResource(SIM_CLOCK);
  if (clock.speed === 0) return;

  const scaledDt = (dt * clock.speed) / 1000; // real seconds, scaled

  const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
  const pipelines = world.getStore<PipelineState>(COMPONENTS.PIPELINE_STATE);
  const identities = world.getStore<Identity>(COMPONENTS.IDENTITY);

  const entities = world.query(COMPONENTS.PIPELINE_STATE, COMPONENTS.BEHAVIOR, COMPONENTS.IDENTITY);

  for (const entity of entities) {
    const beh = behaviors.get(entity)!;
    const pipe = pipelines.get(entity)!;
    const id = identities.get(entity)!;

    // Init state if needed
    if (!entityQuoteState.has(entity)) {
      entityQuoteState.set(entity, {
        cooldown: 5 + rng.next() * 10, // short initial delay
        lastCategory: '',
        lastQuoteIdx: -1,
        prevStep: pipe.currentStep,
      });
    }

    const state = entityQuoteState.get(entity)!;
    const charId = getCharacterId(id);
    const bank = quotesRegistry[charId];
    if (!bank) continue;

    // Check for step completion → victory quote
    if (pipe.currentStep !== state.prevStep || (pipe.pipelineComplete && state.prevStep !== 0)) {
      state.prevStep = pipe.currentStep;
      const victory = pickQuote(bank as Record<string, string[]>, 'victory', state);
      if (victory) {
        world.emit('log', { message: `${id.name}: "${victory}"`, type: 'quote' });
        state.cooldown = nextCooldown();
        continue;
      }
    }
    state.prevStep = pipe.currentStep;

    // Only emit ambient quotes while actively working
    if (beh.current !== 'working') continue;

    // Tick cooldown
    state.cooldown -= scaledDt;
    if (state.cooldown > 0) continue;

    // Pick category: phase-specific or general
    const phaseCategory = PHASE_QUOTE_MAP[pipe.phase] || 'hustle';
    let category: QuoteCategory;

    if (rng.next() < GENERAL_CHANCE) {
      category = rng.pick(GENERAL_CATEGORIES);
    } else {
      category = phaseCategory;
    }

    const quote = pickQuote(bank as Record<string, string[]>, category, state);
    if (quote) {
      world.emit('log', { message: `${id.name}: "${quote}"`, type: 'quote' });
    }

    state.cooldown = nextCooldown();
  }
}
