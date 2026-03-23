import { useEffect, useRef, useState, useCallback } from 'react';
import { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { Position, Appearance, BehaviorState, Identity } from '@/simulation/components';
import { createWorld } from '@/simulation/factory';
import { SPARK_AGENCY_MAP } from '@/simulation/data/maps';
import { SPARK_TEAM } from '@/simulation/data/characters';
import { CanvasRenderer } from '@/renderer/CanvasRenderer';
import { useSimStore } from '@/hooks/useSimStore';
import type { PersonSnapshot } from '@/hooks/useSimStore';

import { HUD } from '@/ui/overlays/HUD';
import { Tooltip } from '@/ui/overlays/Tooltip';
import { TeamPanel } from '@/ui/panels/TeamPanel';
import { InfoPanel } from '@/ui/panels/InfoPanel';
import { LogPanel } from '@/ui/panels/LogPanel';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Snapshot sync interval — update React every ~200ms, not every frame
  const snapshotTimerRef = useRef<number>(0);

  const syncSnapshot = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;

    const positions = world.getStore<Position>(COMPONENTS.POSITION);
    const appearances = world.getStore<Appearance>(COMPONENTS.APPEARANCE);
    const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
    const identities = world.getStore<Identity>(COMPONENTS.IDENTITY);

    const people: PersonSnapshot[] = [];

    for (const entity of world.query(
      COMPONENTS.POSITION,
      COMPONENTS.APPEARANCE,
      COMPONENTS.BEHAVIOR,
      COMPONENTS.IDENTITY,
    )) {
      const pos = positions.get(entity)!;
      const app = appearances.get(entity)!;
      const beh = behaviors.get(entity)!;
      const id = identities.get(entity)!;

      people.push({
        entity,
        name: id.name,
        role: id.role,
        department: id.department,
        color: app.primaryColor,
        state: beh.current,
        x: pos.x,
        y: pos.y,
      });
    }

    useSimStore.getState().updatePeople(people);
  }, []);

  // --- Init ---
  useEffect(() => {
    if (!canvasRef.current) return;

    const { world } = createWorld(SPARK_AGENCY_MAP, SPARK_TEAM);
    worldRef.current = world;

    const renderer = new CanvasRenderer(canvasRef.current);
    rendererRef.current = renderer;

    // Initial log
    const store = useSimStore.getState();
    store.addLog('— Monday begins —', 'event');
    store.addLog('Maya opens the office', 'action');
    store.addLog('Team arrives for the day', 'event');

    // Initial snapshot
    syncSnapshot();

    // Resize handler
    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [syncSnapshot]);

  // --- Game loop ---
  useEffect(() => {
    const loop = (time: number) => {
      const dt = lastTimeRef.current ? Math.min(time - lastTimeRef.current, 100) : 16;
      lastTimeRef.current = time;

      const world = worldRef.current;
      const renderer = rendererRef.current;
      const store = useSimStore.getState();

      if (world && renderer && store.speed > 0) {
        // Tick ECS
        world.tick(dt * store.speed);

        // Advance sim clock
        store.advanceTime(dt);

        // Sync React state (throttled)
        snapshotTimerRef.current += dt;
        if (snapshotTimerRef.current > 200) {
          snapshotTimerRef.current = 0;
          syncSnapshot();
        }
      }

      // Always render (even paused — for hover effects etc)
      if (renderer && store.tilemap) {
        renderer.render(world!, store.tilemap, store.mapWidth, store.mapHeight);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [syncSnapshot]);

  // --- Mouse interaction ---
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    const renderer = rendererRef.current;
    const world = worldRef.current;
    if (!renderer || !world) return;

    const entity = renderer.entityAtScreen(world, e.clientX, e.clientY);
    useSimStore.getState().setHoveredEntity(entity);
  }, []);

  const handleMouseLeave = useCallback(() => {
    useSimStore.getState().setHoveredEntity(null);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-sim-bg flex flex-col">
      {/* Canvas + HUD layer */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ imageRendering: 'pixelated' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        <HUD />
        <Tooltip x={mousePos.x} y={mousePos.y} />
      </div>

      {/* Bottom panel */}
      <div className="h-[140px] flex-shrink-0 bg-sim-surface border-t-2 border-sim-border flex">
        <div className="w-[240px] border-r border-sim-border overflow-y-auto">
          <TeamPanel />
        </div>
        <div className="w-[160px] border-r border-sim-border">
          <InfoPanel />
        </div>
        <div className="flex-1 overflow-y-auto">
          <LogPanel />
        </div>
      </div>
    </div>
  );
}
