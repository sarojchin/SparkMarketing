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
    }

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

      // Body
      ctx.fillStyle = person.color;
      ctx.fillRect(x - 6, y - 5, 12, 20);

      // Name label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(person.name.split(' ')[0], x, y + 25);
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
