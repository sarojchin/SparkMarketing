/**
 * Pipeline System
 *
 * Advances each person through their campaign pipeline while working.
 * Steps are sequential — each must complete before the next begins.
 * When the final step completes, the campaign ships, revenue is earned,
 * and the pipeline resets for the next campaign.
 *
 * Reads: BehaviorState, PipelineState, SimClock
 * Writes: PipelineState, Campaign resource
 * Emits: 'log' events for every step start/completion and campaign shipment
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { BehaviorState, PipelineState, Identity } from '@/simulation/components';
import { SIM_CLOCK, CAMPAIGN } from '@/simulation/resources';
import { PIPELINE_STEPS } from '@/simulation/data/production';

export function pipelineSystem(world: World, dt: number): void {
  const clock = world.getResource(SIM_CLOCK);
  if (clock.speed === 0) return;

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

    // Only advance progress while actively working at desk
    if (beh.current !== 'working') continue;

    const stepDef = PIPELINE_STEPS[pipe.currentStep];
    if (!stepDef) continue;

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

        world.emit('log', { message: `${id.name} ${firstStep.startLog}`, type: 'action' });
      } else {
        // Advance to next step
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

  world.emit('log', {
    message: `${name} starts prospecting for the next client`,
    type: 'action',
  });
}
