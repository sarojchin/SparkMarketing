/**
 * Pipeline System
 *
 * Advances each person through their campaign pipeline while working.
 * Steps are sequential within a phase, but phases only advance when
 * the player assigns a directive via the PipelinePanel.
 *
 * When a phase completes, the directive is cleared and Alex waits
 * for the player to assign the next phase.
 *
 * Reads: BehaviorState, PipelineState, SimClock, PlayerDirective
 * Writes: PipelineState, Campaign resource, PlayerDirective
 * Emits: 'log' events for step/phase transitions and campaign shipment
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { BehaviorState, PipelineState, Identity } from '@/simulation/components';
import { SIM_CLOCK, CAMPAIGN, PLAYER_DIRECTIVE } from '@/simulation/resources';
import { PIPELINE_STEPS } from '@/simulation/data/production';

/** Track the last directive per entity to detect when player assigns a new phase */
const lastDirective = new Map<number, string | null>();

/** Check if the next step is in a different phase than the current one */
function isPhaseEnd(stepIndex: number): boolean {
  const current = PIPELINE_STEPS[stepIndex];
  const next = PIPELINE_STEPS[stepIndex + 1];
  return !next || next.phase !== current.phase;
}

export function pipelineSystem(world: World, dt: number): void {
  const clock = world.getResource(SIM_CLOCK);
  if (clock.speed === 0) return;

  const directive = world.getResource(PLAYER_DIRECTIVE);
  const scaledDt = dt * clock.speed;
  const dtSeconds = scaledDt / 1000;

  const pipelines = world.getStore<PipelineState>(COMPONENTS.PIPELINE_STATE);
  const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
  const identities = world.getStore<Identity>(COMPONENTS.IDENTITY);

  const entities = world.query(COMPONENTS.PIPELINE_STATE, COMPONENTS.BEHAVIOR, COMPONENTS.IDENTITY);

  for (const entity of entities) {
    const pipe = pipelines.get(entity)!;
    const beh = behaviors.get(entity)!;
    const id = identities.get(entity)!;

    if (pipe.pipelineComplete) continue;

    const stepDef = PIPELINE_STEPS[pipe.currentStep];
    if (!stepDef) continue;

    // Detect when player assigns a new directive — emit start log
    const prevDirective = lastDirective.get(entity) ?? null;
    if (directive.assignedPhase !== prevDirective) {
      lastDirective.set(entity, directive.assignedPhase);
      if (directive.assignedPhase && stepDef.phase === directive.assignedPhase) {
        world.emit('log', { message: `${id.name} ${stepDef.startLog}`, type: 'action' });
      }
    }

    // Only advance progress while actively working at desk
    if (beh.current !== 'working') continue;

    // No directive = waiting for player orders. Don't advance.
    if (!directive.assignedPhase) continue;

    // Only advance if the current step's phase matches the player's directive
    if (stepDef.phase !== directive.assignedPhase) continue;

    pipe.stepProgress = Math.min(1, pipe.stepProgress + stepDef.rate * dtSeconds);

    if (pipe.stepProgress >= 1) {
      // Step complete
      world.emit('log', { message: `${id.name} ${stepDef.completeLog}`, type: 'event' });

      const nextStep = pipe.currentStep + 1;

      if (nextStep >= PIPELINE_STEPS.length) {
        // All steps done — ship campaign
        pipe.pipelineComplete = true;
        shipCampaign(world, entity, id.name);

        // Reset pipeline for next campaign
        const firstStep = PIPELINE_STEPS[0];
        pipe.currentStep = 0;
        pipe.stepProgress = 0;
        pipe.stepName = firstStep.name;
        pipe.phase = firstStep.phase;
        pipe.pipelineComplete = false;

        // Clear directive — player must assign the first phase again
        directive.assignedPhase = null;

        world.emit('log', {
          message: `${id.name} is ready for new orders`,
          type: 'system',
        });
      } else if (isPhaseEnd(pipe.currentStep)) {
        // Phase complete — advance to next step but clear directive
        const next = PIPELINE_STEPS[nextStep];
        pipe.currentStep = nextStep;
        pipe.stepProgress = 0;
        pipe.stepName = next.name;
        pipe.phase = next.phase;

        directive.assignedPhase = null;

        world.emit('log', {
          message: `${id.name} finished ${PHASE_LABELS[stepDef.phase]}. Awaiting orders.`,
          type: 'event',
        });
      } else {
        // Advance to next step within same phase
        const next = PIPELINE_STEPS[nextStep];
        pipe.currentStep = nextStep;
        pipe.stepProgress = 0;
        pipe.stepName = next.name;
        pipe.phase = next.phase;

        world.emit('log', { message: `${id.name} ${next.startLog}`, type: 'action' });
      }
    }
  }
}

const PHASE_LABELS: Record<string, string> = {
  prospecting: 'Outreach',
  sales: 'Sales',
  production: 'Production',
  delivery: 'Delivery',
};

function shipCampaign(world: World, _entity: number, name: string): void {
  const campaign = world.getResource(CAMPAIGN);

  campaign.campaignsShipped++;
  campaign.grossIncome += campaign.campaignValue;
  campaign.bank += campaign.campaignValue;
  campaign.campaignNumber++;

  world.emit('log', {
    message: `Campaign #${campaign.campaignsShipped} delivered! +$${campaign.campaignValue.toLocaleString()}`,
    type: 'event',
  });
}
