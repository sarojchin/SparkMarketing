/**
 * Office Map Data
 * 
 * The map is a 2D grid of tiles. Each tile has a type and walkability.
 * Furniture, spawn points, and interaction zones are defined separately
 * and placed on top of the tile grid.
 * 
 * To add a new room: extend the ASCII map, add furniture entries.
 * To add a new office: create a new MapDefinition.
 */

import type { TileData, SpriteType } from '@/simulation/components';

export interface FurniturePlacement {
  type: SpriteType;
  x: number;
  y: number;
  interactionPoint?: { x: number; y: number };
  category: 'workspace' | 'social' | 'utility' | 'decoration';
}

export interface SpawnPoint {
  id: string;
  x: number;
  y: number;
  role: string;
  deskIndex?: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileData[][];
  furniture: FurniturePlacement[];
  spawns: SpawnPoint[];
}

// --- ASCII Map Parser ---

const TILE_CHARS: Record<string, TileData> = {
  'W': { walkable: false, type: 'wall', variant: 0 },
  '.': { walkable: true,  type: 'floor', variant: 0 },
  'R': { walkable: true,  type: 'rug', variant: 0 },
  'O': { walkable: true,  type: 'door', variant: 0 },
  'D': { walkable: false, type: 'floor', variant: 0 }, // desk (unwalkable)
  'C': { walkable: true,  type: 'floor', variant: 0 }, // chair position (walkable — person sits here)
  'P': { walkable: false, type: 'floor', variant: 0 }, // plant
  'K': { walkable: false, type: 'floor', variant: 0 }, // coffee machine
  'B': { walkable: false, type: 'floor', variant: 0 }, // whiteboard
  'S': { walkable: false, type: 'floor', variant: 0 }, // bookshelf
  'L': { walkable: true,  type: 'floor', variant: 0 }, // couch
};

function parseAsciiMap(ascii: string[]): {
  tiles: TileData[][];
  furniture: FurniturePlacement[];
} {
  const tiles: TileData[][] = [];
  const furniture: FurniturePlacement[] = [];

  for (let y = 0; y < ascii.length; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < ascii[y].length; x++) {
      const ch = ascii[y][x];
      row.push({ ...TILE_CHARS[ch] || TILE_CHARS['.'] });

      // Add floor checker variant
      if (row[row.length - 1].type === 'floor') {
        row[row.length - 1].variant = (x + y) % 2;
      }

      // Extract furniture from map chars
      switch (ch) {
        case 'D':
          furniture.push({
            type: 'desk', x, y,
            interactionPoint: { x: x + 1, y },
            category: 'workspace',
          });
          break;
        case 'P':
          furniture.push({ type: 'plant', x, y, category: 'decoration' });
          break;
        case 'K':
          furniture.push({
            type: 'coffee_machine', x, y,
            interactionPoint: { x: x - 1, y },
            category: 'social',
          });
          break;
        case 'B':
          furniture.push({
            type: 'whiteboard', x, y,
            interactionPoint: { x, y: y + 1 },
            category: 'utility',
          });
          break;
        case 'S':
          furniture.push({ type: 'bookshelf', x, y, category: 'decoration' });
          break;
        case 'L':
          furniture.push({
            type: 'couch', x, y,
            interactionPoint: { x, y: y + 1 },
            category: 'social',
          });
          break;
      }
    }
    tiles.push(row);
  }

  return { tiles, furniture };
}

// ============================================================
// SPARK AGENCY — Small Marketing Office
// ============================================================

const SPARK_ASCII = [
  'WWWWWWWWWWWWWWWWWWWW',
  'W........O.........W',
  'W..................W',
  'W..DC..DC....B.....W',
  'W..................W',
  'W..DC..........DC..W',
  'W..................W',
  'W......RRR.........W',
  'W......RRR...P.....W',
  'W......RRR.........W',
  'W..P...........K...W',
  'W..................W',
  'W..................W',
  'WWWWWWWWWWWWWWWWWWWW',
];

const sparkParsed = parseAsciiMap(SPARK_ASCII);

export const SPARK_AGENCY_MAP: MapDefinition = {
  id: 'spark-agency',
  name: 'Spark Agency',
  width: 20,
  height: 14,
  tiles: sparkParsed.tiles,
  furniture: sparkParsed.furniture,
  spawns: [
    { id: 'maya',   x: 7,  y: 7,  role: 'ceo' },
    { id: 'alex',   x: 4,  y: 3,  role: 'content',  deskIndex: 0 },
    { id: 'jordan', x: 7,  y: 3,  role: 'ads',      deskIndex: 1 },
    { id: 'sam',    x: 4,  y: 5,  role: 'design',   deskIndex: 2 },
  ],
};

// Export all available maps
export const ALL_MAPS: MapDefinition[] = [SPARK_AGENCY_MAP];
