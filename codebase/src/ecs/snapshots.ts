/**
 * SNAPSHOT MAPPER
 *
 * Converts ECS world data into GameState snapshots for the frontend.
 * This is the bridge between the internal ECS architecture and the UI.
 *
 * By keeping snapshots in a separate module, we can change the ECS structure
 * without affecting the UI, and vice versa.
 */

import type { World, EntityId } from './world';
import type {
  CharacterComponent,
  ClientComponent,
  ContractComponent,
  CampaignComponent,
  FinancialComponent,
  PositionComponent,
  StateComponent,
  EntityTypeComponent,
} from './world';
import type {
  PersonSnapshot,
  ClientSnapshot,
  ContractSnapshot,
  CampaignSnapshot,
  FinancialSnapshot,
} from '@/engine/types';

/**
 * Extract entity snapshots from the ECS world
 */
export class SnapshotMapper {
  constructor(private world: World) {}

  /**
   * Get all character snapshots from the world
   */
  getCharacterSnapshots(): PersonSnapshot[] {
    const characters = this.world.query('character', 'position', 'state');
    const charStore = this.world.getStore<CharacterComponent>('character');
    const posStore = this.world.getStore<PositionComponent>('position');
    const stateStore = this.world.getStore<StateComponent>('state');

    const snapshots: PersonSnapshot[] = [];
    for (const entityId of characters) {
      const char = charStore.get(entityId);
      const pos = posStore.get(entityId);
      const state = stateStore.get(entityId);

      if (char && pos && state) {
        snapshots.push({
          entity: entityId,
          name: char.name,
          role: char.role,
          department: char.department,
          state: state.state,
          x: pos.x,
          y: pos.y,
          color: char.color,
        });
      }
    }
    return snapshots;
  }

  /**
   * Get all client snapshots from the world
   */
  getClientSnapshots(): ClientSnapshot[] {
    const clients = this.world.query('client');
    const clientStore = this.world.getStore<ClientComponent>('client');

    const snapshots: ClientSnapshot[] = [];
    for (const entityId of clients) {
      const client = clientStore.get(entityId);
      if (client) {
        snapshots.push({
          id: String(entityId),
          name: client.name,
          satisfaction: client.satisfaction,
          contractValue: client.contractValue,
          riskLevel: client.riskLevel,
        });
      }
    }
    return snapshots;
  }

  /**
   * Get all contract snapshots from the world
   */
  getContractSnapshots(): ContractSnapshot[] {
    const contracts = this.world.query('contract');
    const contractStore = this.world.getStore<ContractComponent>('contract');

    const snapshots: ContractSnapshot[] = [];
    for (const entityId of contracts) {
      const contract = contractStore.get(entityId);
      if (contract) {
        snapshots.push({
          id: String(entityId),
          clientId: String(contract.clientId),
          monthlyValue: contract.monthlyValue,
          status: contract.status,
          daysRemaining: contract.daysRemaining,
          deliverablesMet: contract.deliverablesMet,
        });
      }
    }
    return snapshots;
  }

  /**
   * Get all campaign snapshots from the world
   */
  getCampaignSnapshots(): CampaignSnapshot[] {
    const campaigns = this.world.query('campaign');
    const campaignStore = this.world.getStore<CampaignComponent>('campaign');

    const snapshots: CampaignSnapshot[] = [];
    for (const entityId of campaigns) {
      const campaign = campaignStore.get(entityId);
      if (campaign) {
        snapshots.push({
          id: String(entityId),
          contractId: String(campaign.contractId),
          name: campaign.name,
          phase: campaign.phase,
          progress: campaign.progress,
          status: campaign.status,
        });
      }
    }
    return snapshots;
  }

  /**
   * Get the agency financial snapshot
   */
  getFinancialSnapshot(): FinancialSnapshot | null {
    const agencies = this.world.query('agency', 'financial');
    if (agencies.length === 0) return null;

    const financialStore = this.world.getStore<FinancialComponent>('financial');
    const financials = financialStore.get(agencies[0]);

    if (!financials) return null;

    return {
      cashOnHand: financials.cashOnHand,
      monthlyRevenue: financials.monthlyRevenue,
      monthlyExpenses: financials.monthlyExpenses,
      runway: financials.runway,
      profitMargin: financials.profitMargin,
    };
  }

  /**
   * Debug: print all entities and their components
   */
  debugPrint(): void {
    console.log('=== ECS World Snapshot ===');
    console.log(`Total entities: ${this.world.entityCount()}`);

    const allEntities = this.world.allEntities();
    for (const entityId of allEntities) {
      const typeStore = this.world.getStore<EntityTypeComponent>('entity_type');
      const type = typeStore.get(entityId);
      console.log(`  Entity ${entityId}: ${type?.type || 'unknown'}`);
    }
  }
}
