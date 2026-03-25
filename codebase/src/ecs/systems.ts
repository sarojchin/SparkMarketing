/**
 * ECS SYSTEMS
 *
 * Systems define behavior by querying entities with specific components
 * and updating their state. Each system is independent and composable.
 *
 * This makes it easy to:
 * - Add new behaviors (just add a new system)
 * - Modify behaviors (just update the system)
 * - Remove behaviors (just disable the system)
 * - Test behaviors (systems are pure functions)
 */

import type { World, EntityId } from './world';
import type {
  PositionComponent,
  StateComponent,
  CharacterComponent,
  ClientComponent,
  ContractComponent,
  FinancialComponent,
} from './world';

/**
 * CHARACTER SYSTEM
 *
 * Manages character-specific behaviors:
 * - State transitions (working -> idle -> coffee, etc.)
 * - Energy/fatigue (future)
 * - Skill growth (future)
 * - Morale changes (future)
 */
export function createCharacterSystem(world: World) {
  return (dt: number) => {
    const characters = world.query('character', 'state');

    const stateStore = world.getStore<StateComponent>('state');

    for (const entityId of characters) {
      const state = stateStore.get(entityId);
      if (!state) continue;

      // Random state changes
      if (Math.random() < 0.1) {
        const states: StateComponent['state'][] = [
          'working',
          'idle',
          'coffee',
          'thinking',
        ];
        state.state = states[Math.floor(Math.random() * states.length)];
      }
    }
  };
}

/**
 * CLIENT SYSTEM
 *
 * Manages client behaviors:
 * - Satisfaction decay
 * - Risk level updates
 * - Client retention (future)
 */
export function createClientSystem(world: World) {
  return (dt: number) => {
    const clients = world.query('client');
    const clientStore = world.getStore<ClientComponent>('client');

    for (const entityId of clients) {
      const client = clientStore.get(entityId);
      if (!client) continue;

      // Increment days since clienthood
      client.daysSinceClienthood += 1;

      // Every 10 days, satisfaction changes slightly
      if (client.daysSinceClienthood % 10 === 0) {
        const delta = (Math.random() - 0.5) * 20;
        client.satisfaction = Math.max(0, Math.min(100, client.satisfaction + delta));

        // Update risk level based on satisfaction
        if (client.satisfaction < 40) {
          client.riskLevel = 'high';
        } else if (client.satisfaction < 60) {
          client.riskLevel = 'medium';
        } else {
          client.riskLevel = 'low';
        }
      }
    }
  };
}

/**
 * FINANCIAL SYSTEM
 *
 * Manages financial calculations:
 * - Revenue from active contracts
 * - Expense calculations
 * - Runway projections (future)
 * - Profitability tracking
 */
export function createFinancialSystem(world: World) {
  return (dt: number) => {
    const agencies = world.query('agency', 'financial');
    const financialStore = world.getStore<FinancialComponent>('financial');
    const contractStore = world.getStore<ContractComponent>('contract');

    for (const agencyId of agencies) {
      const financials = financialStore.get(agencyId);
      if (!financials) continue;

      // Calculate active revenue
      let activeRevenue = 0;
      for (const contractId of contractStore.all()) {
        const contract = contractStore.get(contractId);
        if (contract && contract.status === 'active') {
          activeRevenue += contract.monthlyValue;
        }
      }

      const dailyRevenue = activeRevenue / 30;
      const dailyExpenses = financials.monthlyExpenses / 30;

      financials.monthlyRevenue = activeRevenue;
      financials.cashOnHand += dailyRevenue - dailyExpenses;

      // Calculate runway
      if (dailyExpenses > 0) {
        financials.runway = Math.ceil(financials.cashOnHand / (dailyExpenses * 30));
      }

      // Calculate profit margin
      if (activeRevenue > 0) {
        financials.profitMargin = Math.round(((activeRevenue - financials.monthlyExpenses) / activeRevenue) * 100);
      }
    }
  };
}

/**
 * CONTRACT SYSTEM
 *
 * Manages contract lifecycle:
 * - Days remaining countdown
 * - Contract completion
 * - Contract failure/loss
 * - Deliverables tracking (future)
 */
export function createContractSystem(world: World) {
  return (dt: number) => {
    const contracts = world.query('contract');
    const contractStore = world.getStore<ContractComponent>('contract');

    for (const entityId of contracts) {
      const contract = contractStore.get(entityId);
      if (!contract) continue;

      if (contract.status === 'active') {
        contract.daysRemaining -= 1;

        // Contract ends
        if (contract.daysRemaining <= 0) {
          contract.status = 'completed';
        }
      }
    }
  };
}

/**
 * SETUP SYSTEMS
 *
 * Convenience function to register all systems with the world
 */
export function setupSystems(world: World): void {
  world.addSystem('character', createCharacterSystem(world), 0);
  world.addSystem('client', createClientSystem(world), 1);
  world.addSystem('contract', createContractSystem(world), 2);
  world.addSystem('financial', createFinancialSystem(world), 3);
}
