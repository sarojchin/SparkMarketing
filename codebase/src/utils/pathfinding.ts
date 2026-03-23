/**
 * Pathfinding — BFS on tile grid.
 * Simple and fast enough for our scale (< 1000 tiles).
 * If we ever need 10,000+ tiles, swap to A*.
 */

import type { TileData } from '@/simulation/components';

export interface PathNode {
  x: number;
  y: number;
}

export function findPath(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  tilemap: TileData[][],
  occupiedTiles?: Set<string>,
): PathNode[] {
  if (sx === ex && sy === ey) return [];

  const h = tilemap.length;
  const w = tilemap[0]?.length || 0;

  const key = (x: number, y: number) => `${x},${y}`;
  const queue: { x: number; y: number; path: PathNode[] }[] = [
    { x: sx, y: sy, path: [] },
  ];
  const visited = new Set<string>();
  visited.add(key(sx, sy));

  const dirs: [number, number][] = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
  ];

  while (queue.length > 0) {
    const { x, y, path } = queue.shift()!;

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;

      // Reached target
      if (nx === ex && ny === ey) {
        return [...path, { x: nx, y: ny }];
      }

      // Bounds check
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

      // Walkable check
      if (!tilemap[ny][nx].walkable) continue;

      // Already visited
      const k = key(nx, ny);
      if (visited.has(k)) continue;

      // Occupied check (optional — for avoiding standing people)
      if (occupiedTiles?.has(k)) continue;

      visited.add(k);
      queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
    }
  }

  return []; // no path found
}

/** Convert tile coords to a set key */
export function tileKey(x: number, y: number): string {
  return `${Math.round(x)},${Math.round(y)}`;
}
