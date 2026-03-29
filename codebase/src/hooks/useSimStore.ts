/**
 * Simulation Store (Zustand)
 * 
 * This is the bridge between the ECS world and React.
 * The ECS world is the source of truth for simulation state.
 * This store holds:
 *   - UI state (selected entity, active panel, speed)
 *   - Derived snapshots from ECS (for React to render without 
 *     directly querying the world every frame)
 *   - The tilemap reference
 *   - Activity log
 */

import { create } from 'zustand';
import type { EntityId } from '@/ecs';
import type { TileData, AgentState } from '@/simulation/components';
import type { AttributeGrades } from '@/simulation/data/attributes';

export interface PersonSnapshot {
  entity: EntityId;
  name: string;
  role: string;
  department: string;
  color: string;
  state: AgentState;
  x: number;
  y: number;
  stepName: string;
  stepProgress: number;
  phase: string;
  currentStep: number;
  totalSteps: number;
  morale: number;
  energy: number;
  attributes: AttributeGrades;
  assignedTaskKey: string | null;
  taskProgress: number;
  callsMade: number;
  emailsSent: number;
  campaignsCreated: number;
}

export interface ClientSnapshot {
  entity: EntityId;
  name: string;
  industry: string;
  size: number;
  reputation: number;
}

export interface LogEntry {
  message: string;
  type: 'action' | 'event' | 'chat' | 'system' | 'quote';
  time: string;
  tick: number;
}

interface SimState {
  // Time
  speed: number;
  tick: number;
  simMinutes: number; // minutes since 9am
  simDay: number;

  // Map
  tilemap: TileData[][] | null;
  mapWidth: number;
  mapHeight: number;

  // Entity snapshots (updated every N frames for UI)
  people: PersonSnapshot[];
  clients: ClientSnapshot[];
  activeClientCount: number;

  // UI
  selectedEntity: EntityId | null;
  hoveredEntity: EntityId | null;
  selectedClientEntity: EntityId | null;

  // Production
  campaignsShipped: number;
  grossIncome: number;
  bank: number;

  // Player directive
  directive: string | null; // assigned phase or null

  // Task assignments (pending UI → ECS sync)
  pendingTasks: Array<{ entity: number; taskKey: string | null }>;

  // Global production counters (aggregated across all characters)
  totalCallsMade: number;
  totalEmailsSent: number;
  totalCampaignsCreated: number;

  // Log
  log: LogEntry[];

  // Client acquisition popup
  acquiredClient: {
    name: string;
    industry: string;
    size: number;
    project: string;
  } | null;
  notifyClientAcquired: (payload: { name: string; industry: string; size: number; project: string }) => void;
  dismissClientAcquired: () => void;

  // Actions
  setSpeed: (speed: number) => void;
  setTilemap: (tiles: TileData[][], w: number, h: number) => void;
  updatePeople: (people: PersonSnapshot[]) => void;
  setSelectedEntity: (entity: EntityId | null) => void;
  setHoveredEntity: (entity: EntityId | null) => void;
  setSelectedClientEntity: (entity: EntityId | null) => void;
  advanceTime: (dt: number) => void;
  syncClock: (tick: number, simMinutes: number, simDay: number, speed: number) => void;
  syncCampaign: (campaignsShipped: number, grossIncome: number, bank: number) => void;
  setDirective: (phase: string | null) => void;
  syncDirective: (phase: string | null) => void;
  assignEntityTask: (entity: number, taskKey: string | null) => void;
  clearPendingTasks: () => void;
  syncTotalCounters: (calls: number, emails: number, campaigns: number) => void;
  updateClients: (clients: ClientSnapshot[]) => void;
  syncClientRoster: (active: number, total: number, max: number) => void;
  addLog: (message: string, type: LogEntry['type']) => void;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(9 + h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const useSimStore = create<SimState>((set, get) => ({
  speed: 1,
  tick: 0,
  simMinutes: 0,
  simDay: 0,

  tilemap: null,
  mapWidth: 0,
  mapHeight: 0,

  people: [],
  clients: [],
  activeClientCount: 0,

  selectedEntity: null,
  hoveredEntity: null,
  selectedClientEntity: null,

  campaignsShipped: 0,
  grossIncome: 0,
  bank: 0,

  directive: null,

  pendingTasks: [],

  totalCallsMade: 0,
  totalEmailsSent: 0,
  totalCampaignsCreated: 0,

  log: [],

  acquiredClient: null,

  notifyClientAcquired: (payload) => set({ acquiredClient: payload }),

  dismissClientAcquired: () => set({ acquiredClient: null }),

  setSpeed: (speed) => set({ speed }),

  setTilemap: (tiles, w, h) => set({ tilemap: tiles, mapWidth: w, mapHeight: h }),

  updatePeople: (people) => set({ people }),

  setSelectedEntity: (entity) => set({ selectedEntity: entity }),

  setHoveredEntity: (entity) => set({ hoveredEntity: entity }),

  setSelectedClientEntity: (entity) => set({ selectedClientEntity: entity }),

  syncClock: (tick, simMinutes, simDay, speed) => set({ tick, simMinutes, simDay, speed }),

  syncCampaign: (campaignsShipped, grossIncome, bank) => set({ campaignsShipped, grossIncome, bank }),

  setDirective: (phase) => set({ directive: phase }),

  syncDirective: (phase) => set({ directive: phase }),

  assignEntityTask: (entity, taskKey) => set((state) => ({
    pendingTasks: [...state.pendingTasks, { entity, taskKey }],
  })),

  clearPendingTasks: () => set({ pendingTasks: [] }),

  syncTotalCounters: (calls, emails, campaigns) => set({
    totalCallsMade: calls,
    totalEmailsSent: emails,
    totalCampaignsCreated: campaigns,
  }),

  updateClients: (clients) => set({ clients }),

  syncClientRoster: (active, _total, _max) => set({ activeClientCount: active }),

  advanceTime: (dt) => {
    const state = get();
    const speed = state.speed;
    if (speed === 0) return;

    // 1 sim-minute per 500ms at 1x
    const newTick = state.tick + dt * speed;
    const minuteThreshold = 500;
    const elapsed = Math.floor(newTick / minuteThreshold) - Math.floor(state.tick / minuteThreshold);

    let newMinutes = state.simMinutes + elapsed;
    let newDay = state.simDay;

    if (newMinutes >= 480) { // 8 hour day
      newMinutes = 0;
      newDay++;
    }

    set({
      tick: newTick,
      simMinutes: newMinutes,
      simDay: newDay,
    });
  },

  addLog: (message, type) => {
    const state = get();
    const time = formatTime(state.simMinutes);
    set({
      log: [
        { message, type, time, tick: Math.floor(state.tick) },
        ...state.log.slice(0, 50),
      ],
    });
  },
}));
