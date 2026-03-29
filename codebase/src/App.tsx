import { useEffect, useRef, useState, useCallback } from 'react';
import { World } from '@/ecs';
import { createWorld } from '@/simulation/factory';
import { STARTER_OFFICE_MAP } from '@/simulation/data/maps';
import { SOLO_FOUNDER } from '@/simulation/data/characters';
import { SIM_CLOCK, PLAYER_DIRECTIVE } from '@/simulation/resources';
import { COMPONENTS } from '@/simulation/components';
import type { AssignedTask } from '@/simulation/components';
import { CanvasRenderer } from '@/renderer/CanvasRenderer';
import { useSimStore } from '@/hooks/useSimStore';

import { HUD } from '@/ui/overlays/HUD';
import { Tooltip } from '@/ui/overlays/Tooltip';
import { TeamPanel } from '@/ui/panels/TeamPanel';
import { InfoPanel } from '@/ui/panels/InfoPanel';
import { LogPanel } from '@/ui/panels/LogPanel';
import { PipelinePanel } from '@/ui/panels/PipelinePanel';
import { CharacterPanel } from '@/ui/panels/CharacterPanel';
import { OutreachPanel } from '@/ui/panels/OutreachPanel';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // --- Init ---
  useEffect(() => {
    if (!canvasRef.current) return;

    const { world } = createWorld(STARTER_OFFICE_MAP, SOLO_FOUNDER);
    worldRef.current = world;

    const renderer = new CanvasRenderer(canvasRef.current);
    rendererRef.current = renderer;

    // Initial log via event bus (no direct store access)
    world.emit('log', { message: '— Day 1 begins —', type: 'event' });
    world.emit('log', { message: 'Alex opens the office', type: 'action' });
    world.emit('log', { message: 'Awaiting your orders, boss.', type: 'system' });

    // Resize handler
    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    // Sync speed changes from UI back into ECS resource
    let prevSpeed = useSimStore.getState().speed;
    const unsubSpeed = useSimStore.subscribe((state) => {
      if (state.speed !== prevSpeed) {
        prevSpeed = state.speed;
        if (worldRef.current) {
          worldRef.current.getResource(SIM_CLOCK).speed = state.speed;
        }
      }
    });

    // Sync player directive changes from UI into ECS resource
    let prevDirective = useSimStore.getState().directive;
    const unsubDirective = useSimStore.subscribe((state) => {
      if (state.directive !== prevDirective) {
        prevDirective = state.directive;
        if (worldRef.current) {
          worldRef.current.getResource(PLAYER_DIRECTIVE).assignedPhase = state.directive;
        }
      }
    });

    // Drain pending task assignments from UI into ECS
    const unsubTasks = useSimStore.subscribe((state) => {
      if (state.pendingTasks.length > 0 && worldRef.current) {
        const taskStore = worldRef.current.getStore<AssignedTask>(COMPONENTS.ASSIGNED_TASK);
        for (const { entity, taskKey } of state.pendingTasks) {
          const existing = taskStore.get(entity);
          if (existing) {
            existing.taskKey = taskKey;
            existing.progress = 0;
          }
        }
        state.clearPendingTasks();
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubSpeed();
      unsubDirective();
      unsubTasks();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // --- Game loop ---
  useEffect(() => {
    const loop = (time: number) => {
      const dt = lastTimeRef.current ? Math.min(time - lastTimeRef.current, 100) : 16;
      lastTimeRef.current = time;

      const world = worldRef.current;
      const renderer = rendererRef.current;
      const store = useSimStore.getState();

      if (world && renderer && store.speed > 0) {
        // Tick all ECS systems (clock, behavior, movement, snapshot)
        world.tick(dt);
      }

      // Always render (even paused — for hover effects etc)
      if (renderer && store.tilemap) {
        renderer.render(world!, store.tilemap, store.mapWidth, store.mapHeight);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // --- Mouse interaction ---
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    const renderer = rendererRef.current;
    const world = worldRef.current;
    if (!renderer || !world) return;

    const entity = renderer.entityAtScreen(world, e.clientX, e.clientY);
    useSimStore.getState().setHoveredEntity(entity);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const renderer = rendererRef.current;
    const world = worldRef.current;
    if (!renderer || !world) return;

    const entity = renderer.entityAtScreen(world, e.clientX, e.clientY);
    useSimStore.getState().setSelectedEntity(entity);
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
          onClick={handleClick}
        />
        <HUD />
        <Tooltip x={mousePos.x} y={mousePos.y} />
        <PipelinePanel />
        <CharacterPanel />
      </div>

      {/* Bottom panel */}
      <div className="h-[140px] flex-shrink-0 bg-sim-surface border-t-2 border-sim-border flex">
        <div className="w-[240px] border-r border-sim-border overflow-y-auto">
          <TeamPanel />
        </div>
        <div className="w-[140px] border-r border-sim-border">
          <InfoPanel />
        </div>
        <div className="w-[140px] border-r border-sim-border">
          <OutreachPanel />
        </div>
        <div className="flex-1 overflow-y-auto">
          <LogPanel />
        </div>
      </div>
    </div>
  );
}
