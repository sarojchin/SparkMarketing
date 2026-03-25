import { useEffect, useRef } from 'react';
import type { GameState } from '@/engine/types';

export function OfficeCanvas({ gameState }: { gameState: GameState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    console.log('🎨 OfficeCanvas rendering, canvas:', canvas);
    if (!canvas) {
      console.error('🎨 Canvas ref is null!');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('🎨 Failed to get 2D context');
      return;
    }

    console.log('🎨 Canvas context ready, drawing office...');
    ctx.imageSmoothingEnabled = false;

    // Clear
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw floor grid
    ctx.fillStyle = '#1e2028';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

    ctx.fillStyle = '#1c1d25';
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.fillRect(i, canvas.height * 0.7, 20, canvas.height * 0.3);
    }

    // Draw desks
    ctx.fillStyle = '#3d3224';
    for (let i = 1; i < 5; i++) {
      const deskX = (i * canvas.width) / 5 - 30;
      const deskY = canvas.height * 0.65;
      ctx.fillRect(deskX, deskY, 60, 30);

      // Desk top highlight
      ctx.fillStyle = '#5a4a35';
      ctx.fillRect(deskX + 2, deskY + 2, 56, 10);
      ctx.fillStyle = '#3d3224';

      // Monitor
      ctx.fillStyle = '#1a1c28';
      ctx.fillRect(deskX + 15, deskY - 15, 30, 20);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(deskX + 17, deskY - 13, 26, 16);

      // Keyboard
      ctx.fillStyle = '#2d2d2d';
      ctx.fillRect(deskX + 10, deskY + 5, 40, 8);
    }

    // Coffee machine (right side)
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(canvas.width - 50, canvas.height * 0.5, 40, 50);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(canvas.width - 48, canvas.height * 0.52, 36, 20);
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(canvas.width - 42, canvas.height * 0.75, 24, 15);

    // Water cooler (left side)
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(20, canvas.height * 0.45, 30, 60);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(25, canvas.height * 0.5, 20, 35);
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(28, canvas.height * 0.53, 14, 15);

    // Filing cabinets (back)
    ctx.fillStyle = '#5a4a35';
    for (let i = 0; i < 3; i++) {
      const cabinetX = 100 + i * 100;
      ctx.fillRect(cabinetX, canvas.height * 0.3, 35, 50);
      // Drawers
      ctx.fillStyle = '#3d3224';
      ctx.fillRect(cabinetX + 3, canvas.height * 0.35, 29, 12);
      ctx.fillRect(cabinetX + 3, canvas.height * 0.50, 29, 12);
      ctx.fillStyle = '#5a4a35';
    }

    // Printer/Copier
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(canvas.width - 100, canvas.height * 0.35, 50, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(canvas.width - 95, canvas.height * 0.38, 40, 25);

    // Draw window
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 10, canvas.width, 80);
    ctx.fillStyle = '#60a5fa';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(i * (canvas.width / 6) + 5, 15, canvas.width / 6 - 10, 35);
      ctx.fillRect(i * (canvas.width / 6) + 5, 55, canvas.width / 6 - 10, 30);
    }

    // Draw people (team members)
    gameState.team.forEach((person, idx) => {
      const x = ((idx + 1) * canvas.width) / (gameState.team.length + 1);
      const y = canvas.height * 0.55;

      // Head
      ctx.fillStyle = '#deb887';
      ctx.beginPath();
      ctx.arc(x, y - 15, 8, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (for expression)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x - 3, y - 17, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 3, y - 17, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = person.color;
      ctx.fillRect(x - 6, y - 5, 12, 20);

      // Arms
      ctx.strokeStyle = '#deb887';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x - 12, y + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 6, y);
      ctx.lineTo(x + 12, y + 5);
      ctx.stroke();

      // Name label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(person.name.split(' ')[0], x, y + 25);

      // Role and action (below name)
      ctx.fillStyle = '#a0aec0';
      ctx.font = '7px monospace';
      ctx.fillText(person.role, x, y + 33);

      // Action (smaller text, color-coded by state)
      const stateColors: Record<string, string> = {
        working: '#4ade80',
        idle: '#fbbf24',
        coffee: '#d946ef',
        meeting: '#ec4899',
        chatting: '#f59e0b',
        thinking: '#06b6d4',
        walking: '#8b5cf6',
        away: '#6b7280',
      };
      ctx.fillStyle = stateColors[person.state] || '#a0aec0';
      ctx.font = '6px monospace';
      ctx.fillText(person.action, x, y + 40);
    });
  }, [gameState]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: '#0b0c10',
        }}
      />
    </div>
  );
}
