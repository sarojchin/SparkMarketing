/**
 * SimpleEngine v1
 *
 * Minimal business simulation: state mutations + random decisions.
 * No complex AI, no detailed campaign simulation.
 * Pure implementation of the GameEngine contract.
 *
 * This proves the architecture works. Later versions will be much more complex
 * but still implement the same interface.
 */

import type {
  GameEngine,
  GameState,
  GameDate,
  EngineCommand,
  Decision,
  DecisionOption,
  ClientSnapshot,
  ContractSnapshot,
  CampaignSnapshot,
  PersonSnapshot,
  FinancialSnapshot,
  Notification,
  LogEntry,
} from '../types';
import { SimulationManager } from '../SimulationManager';
import {
  CharacterSystem,
  BusinessProcessSystem,
  RandomizationSystem,
} from '../systems';

// Client entity with extended properties
interface ClientEntity {
  id: string;
  name: string;
  satisfaction: number;
  daysSinceClienthood: number; // track how long they've been a client
}

export class SimpleEngine implements GameEngine {
  private state!: GameState;
  private stateListeners = new Set<(state: GameState) => void>();
  private decisionCounter = 0;
  private clientEntities = new Map<string, ClientEntity>();
  private lastDecisionTime = 0;
  private decisionIntervalMs = 120000; // 2 minutes of game time (at 1x speed)
  private simManager: SimulationManager;

  async init() {
    console.log('🎮 Engine initializing...');
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

    // Initialize client entities
    for (const client of this.state.clients) {
      this.clientEntities.set(client.id, {
        id: client.id,
        name: client.name,
        satisfaction: client.satisfaction,
        daysSinceClienthood: 0,
      });
    }

    // Initialize SimulationManager with placeholder systems
    console.log('🎮 Initializing SimulationManager...');
    this.simManager = new SimulationManager();
    this.simManager.registerSystem('character', new CharacterSystem());
    this.simManager.registerSystem('business', new BusinessProcessSystem());
    this.simManager.registerSystem('randomization', new RandomizationSystem());
    await this.simManager.init(this.state);

    // Generate first decision
    console.log('🎮 Generating first decision...');
    this.generateRandomDecision();
    console.log('🎮 Engine init complete. Pending decisions:', this.state.pendingDecisions.length);
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

    // Tick contracts
    for (const contract of this.state.contracts) {
      if (contract.status === 'active') {
        contract.daysRemaining -= 1;

        // Every 10 days, client satisfaction might change
        if (contract.daysRemaining % 10 === 0) {
          const client = this.state.clients.find((c) => c.id === contract.clientId);
          if (client) {
            // Random satisfaction change
            const delta = (Math.random() - 0.5) * 20;
            client.satisfaction = Math.max(0, Math.min(100, client.satisfaction + delta));

            // Update risk level
            if (client.satisfaction < 40) {
              client.riskLevel = 'high';
              contract.status = 'at-risk';
              this.addLog(`${client.name} satisfaction critical!`, 'warning');
            } else if (client.satisfaction < 60) {
              client.riskLevel = 'medium';
            } else {
              client.riskLevel = 'low';
            }
          }
        }

        // Contract ends
        if (contract.daysRemaining <= 0) {
          contract.status = 'completed';
          const client = this.state.clients.find((c) => c.id === contract.clientId);
          if (client) {
            if (client.satisfaction > 70) {
              // Client renews or refers
              this.state.financials.cashOnHand += contract.monthlyValue * 3; // final payment
              this.addLog(`${client.name} contract completed successfully`, 'success');
            } else {
              this.state.financials.cashOnHand += contract.monthlyValue * 2; // reduced final payment
              this.addLog(`${client.name} contract completed (unhappy)`, 'warning');
            }
          }
        }
      }
    }

    // Tick financials
    const activeRevenue = this.state.contracts
      .filter((c) => c.status === 'active')
      .reduce((sum, c) => sum + c.monthlyValue, 0);
    const dailyRevenue = activeRevenue / 30;
    const dailyExpenses = this.state.financials.monthlyExpenses / 30;

    this.state.financials.monthlyRevenue = activeRevenue;
    this.state.financials.cashOnHand += dailyRevenue - dailyExpenses;

    // Calculate runway
    if (dailyExpenses > 0) {
      this.state.financials.runway = Math.ceil(
        this.state.financials.cashOnHand / (dailyExpenses * 30)
      );
    }

    // Tick client entities (increment time since clienthood)
    for (const entity of this.clientEntities.values()) {
      entity.daysSinceClienthood += 1;
    }

    // Sync client entities back to state
    for (const client of this.state.clients) {
      const entity = this.clientEntities.get(client.id);
      if (entity) {
        client.satisfaction = entity.satisfaction;
      }
    }

    // Generate decisions every 2 minutes of game time (120 seconds at 1x speed)
    const currentTimeMs = this.state.currentTick;
    if (
      currentTimeMs - this.lastDecisionTime >= this.decisionIntervalMs &&
      this.state.pendingDecisions.length === 0
    ) {
      this.lastDecisionTime = currentTimeMs;
      this.generateRandomDecision();
    }

    // Simulate team activity (random state changes)
    for (const person of this.state.team) {
      if (Math.random() < 0.1) {
        const states: PersonSnapshot['state'][] = [
          'working',
          'idle',
          'coffee',
          'thinking',
        ];
        person.state = states[Math.floor(Math.random() * states.length)];
      }
    }

    // Tick all registered systems
    this.simManager.tick(this.state, dt);

    this.emitStateChange();
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

        // Apply consequences based on decision type and option
        await this.applyDecisionConsequences(decision, option);

        // Remove decision
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
    await this.simManager.destroy();
  }

  // --- Private methods ---

  private generateRandomDecision() {
    const roll = Math.random();
    console.log('🎮 generateRandomDecision roll:', roll);

    if (roll < 0.4) {
      console.log('🎮 Creating contract offer decision');
      this.createContractOfferDecision();
    } else if (roll < 0.7) {
      console.log('🎮 Creating strategy decision');
      this.createStrategyDecision();
    } else {
      console.log('🎮 Creating client crisis decision');
      this.createClientCrisisDecision();
    }

    console.log('🎮 Decision created. Pending count:', this.state.pendingDecisions.length);
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

    const chosen =
      decisions[Math.floor(Math.random() * decisions.length)];

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

  private async applyDecisionConsequences(
    decision: Decision,
    option: DecisionOption
  ) {
    // Contract offer
    if (decision.type === 'contract_offer') {
      if (option.id === 'accept') {
        // Extract value from description
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

    // Strategy question
    if (decision.type === 'strategy_question') {
      if (option.id === 'hire') {
        this.state.team.push({
          entity: Math.max(...this.state.team.map((p) => p.entity)) + 1,
          name: 'New Hire',
          role: 'Specialist',
          department: 'Operations',
          state: 'working',
          x: Math.random() * 20,
          y: Math.random() * 14,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });
        this.state.financials.monthlyExpenses += 6000;
        this.addLog('Hired new team member', 'success');
      } else if (option.id === 'tools') {
        this.state.financials.monthlyExpenses += 500;
        this.addLog('Invested in tools. Team efficiency increased.', 'success');
      } else {
        this.addLog('Saved cash for growth. Playing it safe.', 'info');
      }
    }

    // Crisis - use clientId from decision
    if (decision.type === 'crisis' && decision.clientId) {
      const clientEntity = this.clientEntities.get(decision.clientId);
      const clientSnapshot = this.state.clients.find((c) => c.id === decision.clientId);

      if (!clientEntity || !clientSnapshot) return;

      if (option.id === 'appease') {
        clientEntity.satisfaction = Math.min(100, clientEntity.satisfaction + 30);
        clientSnapshot.satisfaction = clientEntity.satisfaction;
        this.state.financials.cashOnHand -= 3000;
        this.addLog(`Appeased ${clientSnapshot.name}. Satisfaction +30.`, 'success');
      } else if (option.id === 'communicate') {
        clientEntity.satisfaction = Math.min(100, clientEntity.satisfaction + 10);
        clientSnapshot.satisfaction = clientEntity.satisfaction;
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
    // Keep only last 50 entries
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
