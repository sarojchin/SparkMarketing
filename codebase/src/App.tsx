import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameEngine, GameState } from '@/engine/types';
import { SimpleEngine } from '@/engine/v1_simple/SimpleEngine';
import { useSimStore } from '@/hooks/useSimStore';

import { HUD } from '@/ui/overlays/HUD';
import { Tooltip } from '@/ui/overlays/Tooltip';
import { DecisionDialog } from '@/ui/overlays/DecisionDialog';
import { TeamPanel } from '@/ui/panels/TeamPanel';
import { InfoPanel } from '@/ui/panels/InfoPanel';
import { LogPanel } from '@/ui/panels/LogPanel';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // --- Initialize engine ---
  useEffect(() => {
    const initEngine = async () => {
      const engine = new SimpleEngine();
      await engine.init();
      engineRef.current = engine;

      // Set initial state
      setGameState(engine.getState());

      // Listen to state changes
      const unsubscribe = engine.onStateChange((state) => {
        setGameState(state);
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | null = null;
    initEngine().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  // --- Game loop ---
  useEffect(() => {
    if (!engineRef.current) return;

    const loop = async (time: number) => {
      const dt = lastTimeRef.current
        ? Math.min(time - lastTimeRef.current, 100)
        : 16;
      lastTimeRef.current = time;

      const engine = engineRef.current;
      if (!engine) return;
      const state = engine.getState();

      // Tick engine at scaled speed
      await engine.executeCommand({
        type: 'tick',
        dt: dt * state.speedMultiplier,
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // --- Handle decisions ---
  const handleDecision = useCallback((decisionId: string, optionId: string) => {
    if (!engineRef.current) return;
    engineRef.current.executeCommand({
      type: 'decision_made',
      decisionId,
      optionId,
    });
  }, []);

  // --- Handle speed change ---
  const handleSpeedChange = useCallback((speed: number) => {
    if (!engineRef.current) return;
    engineRef.current.executeCommand({
      type: 'set_speed',
      multiplier: speed,
    });
  }, []);

  if (!gameState) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-sim-bg">
        <div className="text-sim-green font-pixel text-lg">
          Initializing simulation...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-sim-bg flex flex-col">
      {/* Main game area */}
      <div className="flex-1 relative">
        {/* Placeholder for canvas/visuals */}
        <div className="absolute inset-0 bg-sim-bg flex items-center justify-center text-sim-textDim font-pixel text-sm">
          Visual rendering (canvas) coming next
        </div>

        {/* HUD overlay */}
        <HUDWithState gameState={gameState} onSpeedChange={handleSpeedChange} />
        <Tooltip x={mousePos.x} y={mousePos.y} />
      </div>

      {/* Bottom info panels */}
      <div className="h-[140px] flex-shrink-0 bg-sim-surface border-t-2 border-sim-border flex">
        <div className="w-[240px] border-r border-sim-border overflow-y-auto">
          <TeamPanelWithState gameState={gameState} />
        </div>
        <div className="w-[160px] border-r border-sim-border">
          <InfoPanelWithState gameState={gameState} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <LogPanelWithState gameState={gameState} />
        </div>
      </div>

      {/* Decision dialog (if pending) */}
      {gameState.pendingDecisions.length > 0 && (
        <DecisionDialog
          decision={gameState.pendingDecisions[0]}
          onChoose={handleDecision}
        />
      )}
    </div>
  );
}

// --- Wrapped components that accept gameState ---

function HUDWithState({
  gameState,
  onSpeedChange,
}: {
  gameState: GameState;
  onSpeedChange: (speed: number) => void;
}) {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const SPEEDS = [1, 3, 8] as const;

  const day = DAYS[gameState.gameDate.month % 5] || 'Monday';
  const hours = Math.floor(gameState.gameDate.day / 3);
  const minutes = (gameState.gameDate.day % 3) * 20;
  const timeStr = `${String(9 + hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return (
    <>
      {/* Top left — title */}
      <div className="fixed top-3 left-3.5 z-10 pointer-events-none">
        <div
          className="text-[10px] font-pixel text-sim-green tracking-[2px]"
          style={{ textShadow: '0 0 8px rgba(74,222,128,0.3)' }}
        >
          SPARK AGENCY TYCOON
        </div>
        <div className="text-[7px] font-pixel text-sim-textDim tracking-[1px] mt-0.5">
          Business Simulation · Est. 2024
        </div>
      </div>

      {/* Top right — clock + speed */}
      <div className="fixed top-3 right-3.5 z-10 text-right">
        <div className="text-[10px] font-pixel text-sim-text tracking-[1px]">
          {timeStr}
        </div>
        <div className="text-[7px] font-pixel text-sim-textDim mt-0.5">
          Y{gameState.gameDate.year} M{gameState.gameDate.month} D
          {gameState.gameDate.day}
        </div>
        <div className="flex gap-0.5 mt-1.5 justify-end">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-1.5 py-0.5 text-[7px] font-pixel border transition-colors
                ${
                  gameState.speedMultiplier === s
                    ? 'text-sim-green border-sim-green'
                    : 'text-sim-textDim border-sim-border hover:border-sim-textDim'
                }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function TeamPanelWithState({ gameState }: { gameState: GameState }) {
  const STATE_STYLES: Record<string, { label: string; class: string }> = {
    working: { label: 'working', class: 'text-sim-green' },
    idle: { label: 'idle', class: 'text-sim-yellow' },
    walking: { label: 'walking', class: 'text-sim-blue' },
    coffee: { label: 'coffee', class: 'text-sim-purple' },
    meeting: { label: 'meeting', class: 'text-sim-pink' },
    chatting: { label: 'chatting', class: 'text-sim-yellow' },
    thinking: { label: 'thinking', class: 'text-sim-blue' },
    away: { label: 'away', class: 'text-sim-textDim' },
  };

  return (
    <div className="p-3">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Team
      </div>
      <div className="space-y-1.5">
        {gameState.team.map((person) => {
          const style = STATE_STYLES[person.state] || STATE_STYLES.idle;
          return (
            <div key={person.entity} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: person.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[8px] text-sim-text font-pixel truncate">
                  {person.name}
                </div>
                <div className="text-[7px] text-sim-textDim font-pixel">
                  {person.role}
                </div>
                <div className={`text-[7px] font-pixel ${style.class}`}>
                  {style.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoPanelWithState({ gameState }: { gameState: GameState }) {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const working = gameState.team.filter((p) => p.state === 'working').length;
  const day = DAYS[gameState.gameDate.month % 5] || 'Monday';

  return (
    <div className="p-3">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Agency
      </div>
      <div className="space-y-1">
        {[
          ['Cash', `$${Math.round(gameState.financials.cashOnHand / 1000)}k`],
          ['Revenue', `$${gameState.financials.monthlyRevenue}`],
          ['Team Size', String(gameState.team.length)],
          ['Working', String(working)],
          ['Runway', `${gameState.financials.runway}m`],
          ['Speed', `${gameState.speedMultiplier}x`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between text-[8px] font-pixel"
          >
            <span className="text-sim-textDim">{label}</span>
            <span className="text-sim-text">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogPanelWithState({ gameState }: { gameState: GameState }) {
  return (
    <div className="p-3">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Activity Log
      </div>
      <div className="space-y-1 text-[7px] font-pixel">
        {gameState.log.map((entry) => (
          <div
            key={entry.id}
            className={`
              ${
                entry.type === 'success'
                  ? 'text-sim-green'
                  : entry.type === 'warning'
                    ? 'text-sim-yellow'
                    : entry.type === 'error'
                      ? 'text-sim-pink'
                      : 'text-sim-textDim'
              }
            `}
          >
            <span className="text-sim-textDim">[{entry.time}]</span> {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
}
