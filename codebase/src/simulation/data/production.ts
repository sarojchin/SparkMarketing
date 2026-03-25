/**
 * Production task definitions by role.
 *
 * Each role cycles through these tasks across campaigns.
 * Every campaign requires one deliverable from each team member.
 */

export const ROLE_TASKS: Record<string, string[]> = {
  'CEO / Founder': [
    'Campaign Brief',
    'Client Pitch Deck',
    'Strategy Memo',
    'Brand Guidelines',
  ],
  'Content Strategist': [
    'Blog Post',
    'Email Sequence',
    'Social Copy Pack',
    'Content Calendar',
  ],
  'Ads Manager': [
    'Ad Campaign Setup',
    'Audience Targeting',
    'A/B Test Plan',
    'Performance Report',
  ],
  'Designer': [
    'Banner Ad Set',
    'Social Graphics',
    'Landing Page',
    'Brand Assets',
  ],
};

/** Base progress rate (progress per second while working). Tuned so
 *  a single work session (~6–10 real seconds at 1x) fills ~15-25%. */
export const BASE_PROGRESS_RATE = 0.02;
