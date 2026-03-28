/**
 * Campaign Pipeline — sequential steps from prospecting to delivery.
 *
 * One person does all steps in order. Each step has a duration
 * expressed as a progress rate (progress per second while working).
 * Lower rate = longer step.
 *
 * At 1x speed, ~1 sim-day ≈ 8 sim-hours ≈ 480 sim-minutes.
 * Clock ticks 1 sim-minute per 500ms real time at 1x.
 * So 1 sim-day ≈ 240 seconds real time at 1x.
 * Target: full pipeline ≈ 14 sim-days ≈ ~56 minutes real time at 1x.
 *
 * Progress rate = 1 / (desired_seconds_at_1x)
 * 1 sim-day of work ≈ person works ~60% of time ≈ 144 real seconds working
 */

export interface PipelineStepDef {
  name: string;
  phase: 'prospecting' | 'sales' | 'production' | 'delivery';
  /** progress per second while working. Lower = longer. */
  rate: number;
  /** Log message when step begins */
  startLog: string;
  /** Log message when step completes */
  completeLog: string;
}

// ~144 real seconds of working per sim-day at 1x
// rate = 1 / (days * 144)
const DAY = 144;

export const PIPELINE_STEPS: PipelineStepDef[] = [
  // Phase 1: Prospecting (~3.5 sim-days)
  {
    name: 'Research Leads',
    phase: 'prospecting',
    rate: 1 / (1 * DAY),
    startLog: 'is researching potential clients',
    completeLog: 'compiled a lead list',
  },
  {
    name: 'Write Outreach Emails',
    phase: 'prospecting',
    rate: 1 / (1 * DAY),
    startLog: 'is writing outreach emails',
    completeLog: 'sent outreach emails to prospects',
  },
  {
    name: 'Cold Calls & Follow-ups',
    phase: 'prospecting',
    rate: 1 / (1.5 * DAY),
    startLog: 'is making cold calls',
    completeLog: 'booked a discovery call with a prospect',
  },

  // Phase 2: Sales (~3 sim-days)
  {
    name: 'Client Discovery Call',
    phase: 'sales',
    rate: 1 / (1 * DAY),
    startLog: 'is on a discovery call',
    completeLog: 'finished discovery call — client is interested',
  },
  {
    name: 'Write Proposal',
    phase: 'sales',
    rate: 1 / (1.5 * DAY),
    startLog: 'is writing a proposal',
    completeLog: 'sent the proposal to the client',
  },
  {
    name: 'Close Deal',
    phase: 'sales',
    rate: 1 / (0.5 * DAY),
    startLog: 'is negotiating the deal',
    completeLog: 'closed the deal! Client signed',
  },

  // Phase 3: Production (~6 sim-days)
  {
    name: 'Strategy & Brief',
    phase: 'production',
    rate: 1 / (1 * DAY),
    startLog: 'is writing the campaign strategy',
    completeLog: 'campaign strategy is locked in',
  },
  {
    name: 'Content Creation',
    phase: 'production',
    rate: 1 / (2 * DAY),
    startLog: 'is creating content',
    completeLog: 'content is ready for review',
  },
  {
    name: 'Design Assets',
    phase: 'production',
    rate: 1 / (2 * DAY),
    startLog: 'is designing campaign assets',
    completeLog: 'design assets are complete',
  },
  {
    name: 'Campaign Setup & QA',
    phase: 'production',
    rate: 1 / (1 * DAY),
    startLog: 'is setting up the campaign & running QA',
    completeLog: 'campaign is set up and tested',
  },

  // Phase 4: Delivery (~1.5 sim-days)
  {
    name: 'Client Review & Revisions',
    phase: 'delivery',
    rate: 1 / (1 * DAY),
    startLog: 'is handling client review & revisions',
    completeLog: 'client approved all deliverables',
  },
  {
    name: 'Launch Campaign',
    phase: 'delivery',
    rate: 1 / (0.5 * DAY),
    startLog: 'is launching the campaign',
    completeLog: 'campaign is live!',
  },
];

/** Revenue per campaign (solo founder pricing) */
export const CAMPAIGN_VALUE = 5000;

// --- Independent Task Definitions ---

export interface TaskDef {
  key: string;
  label: string;
  icon: string;
  /** Which counter field to increment on ProductionCounters */
  counterField: 'callsMade' | 'emailsSent' | 'campaignsCreated';
  /**
   * Progress per speed-scaled second while working.
   * 1 sim-minute = 0.5 real seconds at 1x.
   * Calls/Emails: 1 per sim-minute of work → rate = 2.0
   * Campaigns: 1 per 3 sim-days of work → 1440 sim-minutes → rate = 1/720
   */
  ratePerSecond: number;
  /** Log message when a unit is produced */
  completeLog: string;
}

export const TASK_DEFS: Record<string, TaskDef> = {
  outreach_calls: {
    key: 'outreach_calls',
    label: 'Cold Calls',
    icon: '📞',
    counterField: 'callsMade',
    ratePerSecond: 2.0,
    completeLog: 'made a cold call',
  },
  outreach_emails: {
    key: 'outreach_emails',
    label: 'Emails',
    icon: '📧',
    counterField: 'emailsSent',
    ratePerSecond: 2.0,
    completeLog: 'sent an outreach email',
  },
  content_creation: {
    key: 'content_creation',
    label: 'Content Creation',
    icon: '🎨',
    counterField: 'campaignsCreated',
    ratePerSecond: 1 / 720,
    completeLog: 'finished a campaign!',
  },
};

// Keep old exports for backwards compat with SPARK_TEAM if ever needed
export const ROLE_TASKS: Record<string, string[]> = {
  'Founder': PIPELINE_STEPS.map(s => s.name),
};

export const BASE_PROGRESS_RATE = PIPELINE_STEPS[0].rate;
