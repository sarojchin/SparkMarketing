/**
 * Client Definitions — static data for client entities.
 *
 * Each ClientDef becomes an ECS entity at world creation.
 * To add a new starter client, just append to STARTER_CLIENTS.
 */

export interface ClientDef {
  id: string;
  name: string;
  industry: string;
  size: number;       // number of employees
  reputation: number; // 0-100
}

export const STARTER_CLIENTS: ClientDef[] = [
  { id: 'greenleaf', name: 'GreenLeaf Organics', industry: 'Food & Beverage', size: 25, reputation: 50 },
  { id: 'bytewise', name: 'ByteWise Solutions', industry: 'Technology', size: 120, reputation: 60 },
  { id: 'urban-threads', name: 'Urban Threads', industry: 'Fashion & Retail', size: 15, reputation: 45 },
];

export interface ProspectDef {
  name: string;
  industry: string;
  size: number;
  reputation: number;
  project: string;
}

export const PROSPECT_POOL: ProspectDef[] = [
  { name: 'Maple & Co', industry: 'Real Estate', size: 30, reputation: 55, project: 'Brand awareness campaign for new listings' },
  { name: 'Neon Fitness', industry: 'Health & Wellness', size: 12, reputation: 40, project: 'Social media growth strategy' },
  { name: 'Ironclad Law', industry: 'Legal', size: 8, reputation: 70, project: 'Thought leadership content series' },
  { name: 'Sable & Slate', industry: 'Interior Design', size: 5, reputation: 50, project: 'Instagram & Pinterest launch' },
  { name: 'FrostByte Games', industry: 'Gaming', size: 45, reputation: 65, project: 'Influencer outreach campaign' },
  { name: 'Harbor Foods', industry: 'Food & Beverage', size: 60, reputation: 48, project: 'Product launch email sequence' },
  { name: 'Lumina Medical', industry: 'Healthcare', size: 200, reputation: 72, project: 'Compliance-safe digital ad campaign' },
  { name: 'Verdant Threads', industry: 'Fashion & Retail', size: 18, reputation: 44, project: 'Sustainability story campaign' },
  { name: 'Axon Analytics', industry: 'Technology', size: 85, reputation: 68, project: 'B2B lead generation funnel' },
  { name: 'Pebble Park Hotels', industry: 'Hospitality', size: 150, reputation: 58, project: 'Seasonal promotions & retargeting ads' },
  { name: 'Crestwood Finance', industry: 'Finance', size: 40, reputation: 75, project: 'Trust-building brand content' },
  { name: 'OrbitEd', industry: 'Education', size: 25, reputation: 52, project: 'Student enrolment campaign' },
];
