/**
 * SimpleEngine v1 - ECS Implementation
 *
 * This is a refactored version of SimpleEngine that uses an ECS architecture internally
 * while maintaining the exact same GameEngine interface and output.
 *
 * The ECS allows for:
 * - Easy addition of new behaviors (new systems)
 * - Easy modification of existing behaviors (update systems)
 * - Better testability (systems are pure functions)
 * - Scalability (add new entity types without modifying existing code)
 *
 * The GameState output remains unchanged, ensuring perfect compatibility with the UI.
 */

import type {
  GameEngine,
  GameState,
  GameDate,
  EngineCommand,
  Decision,
  DecisionOption,
  LogEntry,
} from '../types';
import { World } from '@/ecs/world';
import { SnapshotMapper } from '@/ecs/snapshots';
import { setupSystems } from '@/ecs/systems';
import type {
  EntityId,
  CharacterComponent,
  ClientComponent,
  ContractComponent,
  FinancialComponent,
  PositionComponent,
  StateComponent,
  EntityTypeComponent,
} from '@/ecs/world';

// Track clients for satisfaction logic
interface ClientEntity {
  id: string;
  entityId: EntityId;
}

export class SimpleEngineECS implements GameEngine {
  private state!: GameState;
  private stateListeners = new Set<(state: GameState) => void>();
  private decisionCounter = 0;
  private clientEntities = new Map<string, ClientEntity>();
  private characterIds: EntityId[] = [];
  private agencyEntityId!: EntityId;
  private lastDecisionTime = 0;
  private decisionIntervalMs = 120000; // 2 minutes of game time (at 1x speed)

  // ECS World
  private world = new World();
  private snapshotMapper!: SnapshotMapper;

  async init() {
    console.log('🎮 ECS Engine initializing...');

    // Initialize base game state (will be kept in sync with ECS world)
    this.state = {
      currentTick: 0,
      gameDate: { year: 1, month: 1, day: 1 },
      speedMultiplier: 1,

      clients: [
        {
          id: 'acme',
          name: 'ACME Corp',
          satisfaction: 75,
          contractValue: 5000,
          riskLevel: 'low',
        },
        {
          id: 'techstart',
          name: 'TechStart Inc',
          satisfaction: 60,
          contractValue: 3500,
          riskLevel: 'medium',
        },
      ],

      contracts: [
        {
          id: 'contract-1',
          clientId: 'acme',
          monthlyValue: 5000,
          status: 'active',
          daysRemaining: 90,
        },
        {
          id: 'contract-2',
          clientId: 'techstart',
          monthlyValue: 3500,
          status: 'active',
          daysRemaining: 60,
        },
      ],

      campaigns: [],
      team: [
        {
          entity: 1,
          name: 'Maya Chen',
          role: 'CEO',
          department: 'Leadership',
          state: 'working',
          x: 5,
          y: 5,
          color: '#f472b6',
        },
        {
          entity: 2,
          name: 'Alex Rivera',
          role: 'Content Strategist',
          department: 'Content',
          state: 'working',
          x: 7,
          y: 3,
          color: '#60a5fa',
        },
        {
          entity: 3,
          name: 'Jordan Park',
          role: 'Ads Manager',
          department: 'Paid Media',
          state: 'idle',
          x: 4,
          y: 7,
          color: '#4ade80',
        },
        {
          entity: 4,
          name: 'Sam Okafor',
          role: 'Designer',
          department: 'Creative',
          state: 'working',
          x: 9,
          y: 6,
          color: '#fbbf24',
        },
      ],

      financials: {
        cashOnHand: 50000,
        monthlyRevenue: 8500,
        monthlyExpenses: 6000,
        runway: 12,
        profitMargin: 30,
      },

      selectedEntity: null,
      hoveredEntity: null,
      pendingDecisions: [],
      notifications: [],
      log: [
        {
          id: 'init-1',
          message: '— Game Start —',
          type: 'system',
          time: '00:00',
          tick: 0,
        },
      ],

      isPaused: false,
    };

    // Initialize ECS World
    this.initializeECSWorld();

    // Setup ECS systems
    setupSystems(this.world);

    // Create snapshot mapper
    this.snapshotMapper = new SnapshotMapper(this.world);

    // Generate first decision
    console.log('🎮 Generating first decision...');
    this.generateRandomDecision();
    console.log('🎮 ECS Engine init complete. Pending decisions:', this.state.pendingDecisions.length);
  }

  /**
   * Populate the ECS world with entities from the initial state
   */
  private initializeECSWorld() {
    const charStore = this.world.getStore<CharacterComponent>('character');
    const posStore = this.world.getStore<PositionComponent>('position');
    const stateStore = this.world.getStore<StateComponent>('state');
    const typeStore = this.world.getStore<EntityTypeComponent>('entity_type');

    // Create character entities
    for (const person of this.state.team) {
      const entityId = this.world.spawn();
      this.characterIds.push(entityId);

      charStore.set(entityId, {
        name: person.name,
        role: person.role,
        department: person.department,
        color: person.color,
      });

      posStore.set(entityId, {
        x: person.x,
        y: person.y,
      });

      stateStore.set(entityId, {
        state: person.state,
      });

      typeStore.set(entityId, { type: 'character' });
    }

    // Create client entities
    const clientStore = this.world.getStore<ClientComponent>('client');
    for (const client of this.state.clients) {
      const entityId = this.world.spawn();
      this.clientEntities.set(client.id, { id: client.id, entityId });

      clientStore.set(entityId, {
        name: client.name,
        satisfaction: client.satisfaction,
        contractValue: client.contractValue,
        riskLevel: client.riskLevel,
        daysSinceClienthood: 0,
      });

      typeStore.set(entityId, { type: 'client' });
    }

    // Create contract entities
    const contractStore = this.world.getStore<ContractComponent>('contract');
    for (const contract of this.state.contracts) {
      const entityId = this.world.spawn();
      const clientEntity = this.clientEntities.get(contract.clientId);
      if (!clientEntity) continue;

      contractStore.set(entityId, {
        clientId: clientEntity.entityId,
        monthlyValue: contract.monthlyValue,
        status: contract.status,
        daysRemaining: contract.daysRemaining,
      });

      typeStore.set(entityId, { type: 'contract' });
    }

    // Create agency entity
    const financialStore = this.world.getStore<FinancialComponent>('financial');
    this.agencyEntityId = this.world.spawn();

    financialStore.set(this.agencyEntityId, {
      cashOnHand: this.state.financials.cashOnHand,
      monthlyRevenue: this.state.financials.monthlyRevenue,
      monthlyExpenses: this.state.financials.monthlyExpenses,
      runway: this.state.financials.runway,
      profitMargin: this.state.financials.profitMargin,
    });

    typeStore.set(this.agencyEntityId, { type: 'agency' });
  }

  /**
   * Synchronize GameState from ECS world
   */
  private syncFromECS() {
    // Update team from character entities
    this.state.team = this.snapshotMapper.getCharacterSnapshots();

    // Update clients from client entities
    this.state.clients = this.snapshotMapper.getClientSnapshots();

    // Update contracts from contract entities
    this.state.contracts = this.snapshotMapper.getContractSnapshots();

    // Update campaigns from campaign entities
    this.state.campaigns = this.snapshotMapper.getCampaignSnapshots();

    // Update financials from agency entity
    const financials = this.snapshotMapper.getFinancialSnapshot();
    if (financials) {
      this.state.financials = financials;
    }
  }

  async tick(dt: number) {
    if (this.state.isPaused) return;

    this.state.currentTick++;

    // Advance game time
    this.state.gameDate.day += 1;
    if (this.state.gameDate.day > 20) {
      this.state.gameDate.day = 1;
      this.state.gameDate.month += 1;
    }
    if (this.state.gameDate.month > 12) {
      this.state.gameDate.month = 1;
      this.state.gameDate.year += 1;
    }

    // Run ECS systems
    this.world.tick(dt);

    // Sync state from ECS
    this.syncFromECS();

    // Handle contract logic (currently separate - can be moved to system later)
    this.handleContractTick();

    // Handle client logic (currently separate - can be moved to system later)
    this.handleClientTick();

    // Generate decisions
    const currentTimeMs = this.state.currentTick;
    if (
      currentTimeMs - this.lastDecisionTime >= this.decisionIntervalMs &&
      this.state.pendingDecisions.length === 0
    ) {
      this.lastDecisionTime = currentTimeMs;
      this.generateRandomDecision();
    }

    this.emitStateChange();
  }

  /**
   * Handle contract-related logic
   */
  private handleContractTick() {
    const contractStore = this.world.getStore<ContractComponent>('contract');
    const clientStore = this.world.getStore<ClientComponent>('client');

    for (const contractId of contractStore.all()) {
      const contract = contractStore.get(contractId);
      if (!contract || contract.status !== 'active') continue;

      // Every 10 days, check client satisfaction
      if (contract.daysRemaining % 10 === 0) {
        const clientEntity = clientStore.get(contract.clientId);
        if (clientEntity) {
          if (clientEntity.satisfaction < 40) {
            contract.status = 'at-risk';
          }
        }
      }

      // Handle contract completion
      if (contract.daysRemaining <= 0) {
        contract.status = 'completed';
        const clientEntity = clientStore.get(contract.clientId);
        if (clientEntity) {
          if (clientEntity.satisfaction > 70) {
            this.state.financials.cashOnHand += contract.monthlyValue * 3;
            this.addLog(`${clientEntity.name} contract completed successfully`, 'success');
          } else {
            this.state.financials.cashOnHand += contract.monthlyValue * 2;
            this.addLog(`${clientEntity.name} contract completed (unhappy)`, 'warning');
          }
        }
      }
    }
  }

  /**
   * Handle client-related logic
   */
  private handleClientTick() {
    // Client logic is now in ClientSystem
    // This is here as a placeholder for any additional logic
  }

  async executeCommand(cmd: EngineCommand) {
    switch (cmd.type) {
      case 'decision_made': {
        const decisionIdx = this.state.pendingDecisions.findIndex(
          (d) => d.id === cmd.decisionId
        );
        if (decisionIdx === -1) return;

        const decision = this.state.pendingDecisions[decisionIdx];
        const option = decision.options.find((o) => o.id === cmd.optionId);
        if (!option) return;

        await this.applyDecisionConsequences(decision, option);
        this.state.pendingDecisions.splice(decisionIdx, 1);
        this.emitStateChange();
        break;
      }

      case 'set_speed':
        this.state.speedMultiplier = cmd.multiplier;
        this.emitStateChange();
        break;

      case 'pause':
        this.state.isPaused = true;
        this.emitStateChange();
        break;

      case 'resume':
        this.state.isPaused = false;
        this.emitStateChange();
        break;

      case 'reset':
        await this.init();
        this.emitStateChange();
        break;

      default:
        break;
    }
  }

  getState(): GameState {
    return this.state;
  }

  onStateChange(callback: (state: GameState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  async destroy() {
    this.stateListeners.clear();
  }

  // --- Private Methods ---

  private generateRandomDecision() {
    const roll = Math.random();
    if (roll < 0.4) {
      this.createContractOfferDecision();
    } else if (roll < 0.7) {
      this.createStrategyDecision();
    } else {
      this.createClientCrisisDecision();
    }
  }

  private createContractOfferDecision() {
    const opportunities = [
      {
        name: 'BigCorp Media',
        value: 8000,
        effort: 'high',
        desc: '3-month campaign, requires 2 designers on retainer',
      },
      {
        name: 'LocalShop Co',
        value: 2500,
        effort: 'low',
        desc: 'Social media management, 10 hours/week',
      },
      {
        name: 'Enterprise SaaS',
        value: 12000,
        effort: 'very high',
        desc: 'Full marketing ops, needs entire team involvement',
      },
    ];

    const opp = opportunities[Math.floor(Math.random() * opportunities.length)];

    const decision: Decision = {
      id: `decision-${++this.decisionCounter}`,
      type: 'contract_offer',
      title: `New opportunity: ${opp.name}`,
      description: `${opp.name} wants to hire us. ${opp.desc}`,
      options: [
        {
          id: 'accept',
          label: 'Accept',
          description: 'Sign the contract',
          consequences: `+$${opp.value}/month, but team needs to ${opp.effort === 'high' ? 'be busy' : 'work extra'}`,
        },
        {
          id: 'negotiate',
          label: 'Counter-offer',
          description: 'Try to adjust terms',
          consequences: 'Risk: they might walk away, reward: better deal',
        },
        {
          id: 'decline',
          label: 'Decline',
          description: 'Pass on this opportunity',
          consequences: 'No risk, but miss out on revenue',
        },
      ],
    };

    this.state.pendingDecisions.push(decision);
  }

  private createStrategyDecision() {
    const decisions = [
      {
        title: 'How should we spend our cash?',
        desc: 'You have $15k available. What is your priority?',
        options: [
          {
            id: 'hire',
            label: 'Hire another person',
            description: 'Hire another person',
            consequences: 'Add capacity, but +$5-7k/month in payroll',
          },
          {
            id: 'tools',
            label: 'Invest in better tools',
            description: 'Invest in better tools',
            consequences: 'Improve efficiency, -$500/month recurring',
          },
          {
            id: 'save',
            label: 'Keep as cash buffer',
            description: 'Keep as cash buffer',
            consequences: 'Safety first, but slower growth',
          },
        ],
      },
      {
        title: 'Should we raise prices?',
        desc: 'Current margins are healthy but tight.',
        options: [
          {
            id: 'raise_20',
            label: 'Raise 20%',
            description: 'Raise prices by 20%',
            consequences: 'More margin, but risk losing price-sensitive clients',
          },
          {
            id: 'raise_10',
            label: 'Raise 10%',
            description: 'Raise prices by 10%',
            consequences: 'Modest improvement, low risk of churn',
          },
          {
            id: 'hold',
            label: 'Keep current prices',
            description: 'Keep current prices',
            consequences: 'Stay competitive, rely on volume growth',
          },
        ],
      },
    ];

    const chosen = decisions[Math.floor(Math.random() * decisions.length)];

    this.state.pendingDecisions.push({
      id: `decision-${++this.decisionCounter}`,
      type: 'strategy_question',
      title: chosen.title,
      description: chosen.desc,
      options: chosen.options as any[],
    });
  }

  private createClientCrisisDecision() {
    const clients = this.state.clients.filter((c) => c.satisfaction < 70);
    if (clients.length === 0) return;

    const client = clients[Math.floor(Math.random() * clients.length)];

    this.state.pendingDecisions.push({
      id: `decision-${++this.decisionCounter}`,
      type: 'crisis',
      clientId: client.id,
      title: `${client.name} is unhappy`,
      description: `Satisfaction dropped to ${Math.round(client.satisfaction)}. They're threatening to leave.`,
      options: [
        {
          id: 'appease',
          label: 'Appease them',
          description: 'Offer free services next month',
          consequences: 'Free services next month (-$3k), but satisfaction +30',
        },
        {
          id: 'communicate',
          label: 'Have a call',
          description: 'Explain your roadmap to them',
          consequences: 'Explain roadmap, satisfaction +10, no cost',
        },
        {
          id: 'let_go',
          label: 'Let them leave',
          description: 'Accept the contract loss',
          consequences: 'Lost contract, but frees up team capacity',
        },
      ],
    });
  }

  private async applyDecisionConsequences(decision: Decision, option: DecisionOption) {
    if (decision.type === 'contract_offer') {
      if (option.id === 'accept') {
        const match = decision.description.match(/\$(\d+)/);
        const value = match ? parseInt(match[1], 10) : 5000;

        this.state.contracts.push({
          id: `contract-${Date.now()}`,
          clientId: `client-${Date.now()}`,
          monthlyValue: value,
          status: 'active',
          daysRemaining: 90,
        });

        this.addLog(`New contract signed: +$${value}/month`, 'success');
      } else if (option.id === 'negotiate') {
        if (Math.random() > 0.5) {
          this.addLog('Negotiation failed. Opportunity lost.', 'warning');
        } else {
          this.addLog('Negotiation successful! Better terms agreed.', 'success');
        }
      } else {
        this.addLog('Opportunity declined.', 'info');
      }
    }

    if (decision.type === 'strategy_question') {
      if (option.id === 'hire') {
        const charStore = this.world.getStore<CharacterComponent>('character');
        const posStore = this.world.getStore<PositionComponent>('position');
        const stateStore = this.world.getStore<StateComponent>('state');
        const typeStore = this.world.getStore<EntityTypeComponent>('entity_type');

        const newEntityId = this.world.spawn();
        charStore.set(newEntityId, {
          name: 'New Hire',
          role: 'Specialist',
          department: 'Operations',
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });
        posStore.set(newEntityId, { x: Math.random() * 20, y: Math.random() * 14 });
        stateStore.set(newEntityId, { state: 'working' });
        typeStore.set(newEntityId, { type: 'character' });

        this.state.financials.monthlyExpenses += 6000;
        this.addLog('Hired new team member', 'success');
      } else if (option.id === 'tools') {
        this.state.financials.monthlyExpenses += 500;
        this.addLog('Invested in tools. Team efficiency increased.', 'success');
      } else {
        this.addLog('Saved cash for growth. Playing it safe.', 'info');
      }
    }

    if (decision.type === 'crisis' && decision.clientId) {
      const clientStore = this.world.getStore<ClientComponent>('client');
      const clientEntity = this.clientEntities.get(decision.clientId);
      const clientSnapshot = this.state.clients.find((c) => c.id === decision.clientId);

      if (!clientEntity || !clientSnapshot) return;

      const client = clientStore.get(clientEntity.entityId);
      if (!client) return;

      if (option.id === 'appease') {
        client.satisfaction = Math.min(100, client.satisfaction + 30);
        clientSnapshot.satisfaction = client.satisfaction;
        this.state.financials.cashOnHand -= 3000;
        this.addLog(`Appeased ${clientSnapshot.name}. Satisfaction +30.`, 'success');
      } else if (option.id === 'communicate') {
        client.satisfaction = Math.min(100, client.satisfaction + 10);
        clientSnapshot.satisfaction = client.satisfaction;
        this.addLog(`Had a good call with ${clientSnapshot.name}. Satisfaction +10.`, 'success');
      } else if (option.id === 'let_go') {
        this.state.contracts = this.state.contracts.filter(
          (c) => c.clientId !== decision.clientId
        );
        this.addLog(`Lost contract with ${clientSnapshot.name}.`, 'error');
      }
    }
  }

  private addLog(message: string, type: LogEntry['type']) {
    const time = this.formatGameTime(this.state.gameDate);
    this.state.log.unshift({
      id: `log-${Date.now()}-${Math.random()}`,
      message,
      type,
      time,
      tick: this.state.currentTick,
    });
    if (this.state.log.length > 50) {
      this.state.log.pop();
    }
  }

  private formatGameTime(date: GameDate): string {
    return `M${date.month} D${date.day}`;
  }

  private emitStateChange() {
    this.stateListeners.forEach((cb) => cb(this.state));
  }
}
