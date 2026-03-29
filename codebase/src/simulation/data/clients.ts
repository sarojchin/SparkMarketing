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
