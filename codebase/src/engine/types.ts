/**
 * ENGINE CONTRACT
 *
 * These types define the boundary between frontend and simulation engine.
 * All engines must implement GameEngine and work with these types.
 * Frontend never touches engine internals — only communicates via this contract.
 */

// --- Time ---

export interface GameDate {
  year: number;
  month: number;
  day: number;
}

// --- Snapshots (what frontend sees) ---

export interface ClientSnapshot {
  id: string;
  name: string;
  satisfaction: number; // 0-100
  contractValue: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ContractSnapshot {
  id: string;
  clientId: string;
  monthlyValue: number;
  status: 'active' | 'completed' | 'lost' | 'at-risk';
  daysRemaining: number;
  deliverablesMet?: number; // 0-100
}

export interface CampaignSnapshot {
  id: string;
  contractId: string;
  name: string;
  phase: 'strategy' | 'creative' | 'production' | 'launch' | 'reporting';
  progress: number; // 0-100 within current phase
  status: 'active' | 'completed' | 'blocked';
}

export interface PersonSnapshot {
  entity: number; // EntityId
  name: string;
  role: string;
  department: string;
  state: 'working' | 'idle' | 'walking' | 'coffee' | 'meeting' | 'chatting' | 'thinking' | 'away';
  action: string; // Current action being performed
  x: number;
  y: number;
  color: string;
}

export interface FinancialSnapshot {
  cashOnHand: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  runway: number; // months until out of cash (-1 if infinite)
  profitMargin: number; // 0-100
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'action' | 'event' | 'chat' | 'system' | 'decision' | 'success' | 'warning' | 'error' | 'info';
  time: string;
  tick: number;
}

// --- Decisions (engine asks user to choose) ---

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  consequences?: string; // flavor text about outcomes
}

export interface Decision {
  id: string;
  type: 'contract_offer' | 'campaign_opportunity' | 'hiring_choice' | 'strategy_question' | 'crisis' | 'custom';
  title: string;
  description: string;
  options: DecisionOption[];
  deadline?: GameDate;
  clientId?: string; // which client this decision is about (if applicable)
  contractId?: string; // which contract (if applicable)
  metadata?: Record<string, any>; // engine-specific data
}

// --- Notifications ---

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  autoClose?: boolean;
  autoCloseDuration?: number; // ms
}

// --- Complete Game State (frontend receives this) ---

export interface GameState {
  // Time
  currentTick: number;
  gameDate: GameDate;
  speedMultiplier: number;

  // World
  clients: ClientSnapshot[];
  contracts: ContractSnapshot[];
  campaigns: CampaignSnapshot[];
  team: PersonSnapshot[];
  financials: FinancialSnapshot;

  // UI state
  selectedEntity: string | null;
  hoveredEntity: string | null;

  // What engine is asking frontend to do
  pendingDecisions: Decision[];
  notifications: Notification[];
  log: LogEntry[];

  // Metadata
  isPaused: boolean;
}

// --- Commands (frontend sends to engine) ---

export type EngineCommand =
  | { type: 'tick'; dt: number }
  | { type: 'decision_made'; decisionId: string; optionId: string }
  | { type: 'set_speed'; multiplier: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'save_game'; slotId?: string }
  | { type: 'load_game'; slotId: string }
  | { type: 'reset' }
  | { type: 'custom_action'; name: string; payload: any };

// --- Engine Interface (what frontend uses) ---

export interface GameEngine {
  // Lifecycle
  init(): Promise<void>;
  tick(dt: number): Promise<void>;
  destroy(): Promise<void>;

  // State
  getState(): GameState;

  // Commands
  executeCommand(cmd: EngineCommand): Promise<void>;

  // Events
  onStateChange(callback: (state: GameState) => void): () => void;
}

// --- Context (engine uses this to understand the game) ---

export interface AgentContext {
  gameTime: GameDate;
  currentTick: number;
  financials: FinancialSnapshot;
  clients: ClientSnapshot[];
  contracts: ContractSnapshot[];
  campaigns: CampaignSnapshot[];
  team: PersonSnapshot[];
  teamCapacity: {
    totalHours: number;
    allocatedHours: number;
    available: number;
  };
}
