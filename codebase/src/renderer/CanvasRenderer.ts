/**
 * Canvas Renderer
 * 
 * Reads from ECS world and draws everything.
 * Has ZERO simulation logic — it only reads component data and renders pixels.
 * 
 * To add a new visual: add a draw function here and call it in render().
 * To swap to WebGL/SVG later: replace this file, nothing else changes.
 */

import type { World, EntityId } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type {
  Position, Appearance, Animation, BehaviorState,
  StatusIndicator, FurnitureTag, Facing, ProductionTask,
} from '@/simulation/components';
import type { TileData } from '@/simulation/components';

const SCALE = 3;
const T = 16; // tile size in source pixels
const TS = T * SCALE; // tile size on screen

// Palette
const PAL = {
  bg:        '#e8e4dd',
  floor:     '#f0ece5',
  floorAlt:  '#e9e5dd',
  wall:      '#c9c3b8',
  wallTop:   '#d6d0c5',
  rug:       '#d4c8b8',
  desk:      '#b89a6e',
  deskTop:   '#d4b88a',
  monitor:   '#2d2d2d',
  monGlow:   '#4a9eff',
  chair:     '#8b8178',
  chairBack: '#9e958c',
  plantLeaf: '#4aba6a',
  plantDark: '#38945a',
  plantPot:  '#b89a6e',
  coffee:    '#9e958c',
  coffeeBtn: '#e05252',
  coffeeCup: '#ffffff',
  wbBoard:   '#ffffff',
  wbFrame:   '#9e958c',
  window:    '#a8d4f0',
  windowGlow:'#c8e6fa',
  doorFrame: '#b89a6e',
  doorInner: '#8b7452',
  doorKnob:  '#d4b88a',
  skin:      '#deb887',
  pants:     '#5c6370',
  shadow:    'rgba(0,0,0,0.08)',
};

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private cameraX = 0;
  private cameraY = 0;
  private now = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;
  }

  render(world: World, tilemap: TileData[][], mapW: number, mapH: number): void {
    this.now = performance.now();
    const ctx = this.ctx;

    // Center camera on map
    const viewH = this.height - 140; // bottom panel
    this.cameraX = Math.floor((this.width - mapW * TS) / 2);
    this.cameraY = Math.floor((viewH - mapH * TS) / 2);

    // Clear
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw layers in order
    this.drawTiles(tilemap, mapW, mapH);
    this.drawWindows(tilemap, mapW);
    this.drawFurniture(world);
    this.drawPeople(world);
  }

  // --- Helpers ---

  private px(tileX: number, tileY: number, offX = 0, offY = 0): [number, number] {
    return [
      this.cameraX + tileX * TS + offX * SCALE,
      this.cameraY + tileY * TS + offY * SCALE,
    ];
  }

  private rect(tileX: number, tileY: number, offX: number, offY: number, w: number, h: number, color: string): void {
    const [x, y] = this.px(tileX, tileY, offX, offY);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), w * SCALE, h * SCALE);
  }

  // --- Tiles ---

  private drawTiles(tilemap: TileData[][], mapW: number, mapH: number): void {
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const tile = tilemap[y]?.[x];
        if (!tile) continue;

        switch (tile.type) {
          case 'wall':
            this.rect(x, y, 0, 0, T, T, PAL.wall);
            // Top edge bevel
            if (y > 0 && tilemap[y - 1]?.[x]?.type !== 'wall') {
              this.rect(x, y, 0, 0, T, 2, PAL.wallTop);
            }
            break;
          case 'rug':
            this.rect(x, y, 0, 0, T, T, PAL.rug);
            break;
          case 'door':
            this.rect(x, y, 0, 0, T, T, PAL.floor);
            this.rect(x, y, 3, 0, 10, T, PAL.doorFrame);
            this.rect(x, y, 4, 1, 8, 14, PAL.doorInner);
            this.rect(x, y, 10, 7, 2, 2, PAL.doorKnob);
            break;
          default: // floor
            this.rect(x, y, 0, 0, T, T, tile.variant ? PAL.floorAlt : PAL.floor);
            break;
        }
      }
    }
  }

  private drawWindows(tilemap: TileData[][], mapW: number): void {
    for (let x = 2; x < mapW - 2; x += 3) {
      if (tilemap[0]?.[x]?.type !== 'wall') continue;

      const pulse = Math.sin(this.now * 0.001 + x) * 0.15 + 0.85;

      // Glow
      this.ctx.globalAlpha = pulse * 0.35;
      this.rect(x, 0, 3, 4, 10, 8, PAL.windowGlow);
      this.ctx.globalAlpha = 1;

      // Frame
      this.rect(x, 0, 2, 3, 12, 1, PAL.wbFrame);
      this.rect(x, 0, 2, 13, 12, 1, PAL.wbFrame);
      this.rect(x, 0, 2, 3, 1, 11, PAL.wbFrame);
      this.rect(x, 0, 13, 3, 1, 11, PAL.wbFrame);
      this.rect(x, 0, 7, 3, 1, 11, PAL.wbFrame);

      // Panes
      this.rect(x, 0, 3, 4, 4, 9, PAL.window);
      this.rect(x, 0, 8, 4, 5, 9, PAL.window);
    }
  }

  // --- Furniture ---

  private drawFurniture(world: World): void {
    const positions = world.getStore<Position>(COMPONENTS.POSITION);
    const appearances = world.getStore<Appearance>(COMPONENTS.APPEARANCE);
    const tags = world.getStore<FurnitureTag>(COMPONENTS.FURNITURE_TAG);

    // Collect and sort by zIndex
    const items: { entity: EntityId; pos: Position; app: Appearance }[] = [];
    for (const entity of world.query(COMPONENTS.POSITION, COMPONENTS.APPEARANCE, COMPONENTS.FURNITURE_TAG)) {
      items.push({
        entity,
        pos: positions.get(entity)!,
        app: appearances.get(entity)!,
      });
    }
    items.sort((a, b) => a.app.zIndex - b.app.zIndex || a.pos.y - b.pos.y);

    for (const { pos, app } of items) {
      this.drawSprite(app.spriteType, pos.x, pos.y, app);
    }
  }

  private drawSprite(type: string, x: number, y: number, app: Appearance): void {
    switch (type) {
      case 'desk':
        this.rect(x, y, 1, 4, 14, 10, PAL.desk);
        this.rect(x, y, 2, 3, 12, 2, PAL.deskTop);
        // Monitor
        this.rect(x, y, 4, 0, 8, 5, PAL.monitor);
        const glow = Math.sin(this.now * 0.002 + x * 3) * 0.3 + 0.7;
        this.ctx.globalAlpha = glow;
        this.rect(x, y, 5, 1, 6, 3, PAL.monGlow);
        this.ctx.globalAlpha = 1;
        this.rect(x, y, 7, 5, 2, 1, PAL.monitor);
        break;

      case 'chair':
        this.rect(x, y, 4, 4, 8, 8, PAL.chair);
        this.rect(x, y, 3, 2, 10, 4, PAL.chairBack);
        break;

      case 'plant':
        const sway = Math.sin(this.now * 0.0015 + x * 2) * 0.8;
        this.rect(x, y, 5, 9, 6, 5, PAL.plantPot);
        // Use camera offset directly for sway
        const [px1, py1] = this.px(x, y, 4 + sway, 2);
        this.ctx.fillStyle = PAL.plantLeaf;
        this.ctx.fillRect(px1, py1, 8 * SCALE, 7 * SCALE);
        const [px2, py2] = this.px(x, y, 6 + sway * 0.5, 0);
        this.ctx.fillStyle = PAL.plantDark;
        this.ctx.fillRect(px2, py2, 4 * SCALE, 5 * SCALE);
        break;

      case 'coffee_machine':
        this.rect(x, y, 3, 2, 10, 12, PAL.coffee);
        this.rect(x, y, 4, 3, 8, 5, '#292524');
        if (Math.sin(this.now * 0.003) > 0) {
          this.rect(x, y, 10, 4, 2, 2, PAL.coffeeBtn);
        }
        this.rect(x, y, 5, 10, 4, 3, PAL.coffeeCup);
        break;

      case 'whiteboard':
        this.rect(x, y, 1, 2, 14, 10, PAL.wbFrame);
        this.rect(x, y, 2, 3, 12, 8, PAL.wbBoard);
        this.rect(x, y, 3, 4, 5, 1, '#3b82f6');
        this.rect(x, y, 3, 6, 8, 1, '#ef4444');
        this.rect(x, y, 3, 8, 6, 1, '#22c55e');
        break;

      case 'rug':
        // Already drawn in tile pass
        break;
    }
  }

  // --- People ---

  private drawPeople(world: World): void {
    const positions = world.getStore<Position>(COMPONENTS.POSITION);
    const appearances = world.getStore<Appearance>(COMPONENTS.APPEARANCE);
    const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
    const animations = world.getStore<Animation>(COMPONENTS.ANIMATION);
    const statusIndicators = world.getStore<StatusIndicator>(COMPONENTS.STATUS_INDICATOR);
    const productionTasks = world.getStore<ProductionTask>(COMPONENTS.PRODUCTION_TASK);

    const people: { entity: EntityId; pos: Position; app: Appearance }[] = [];
    for (const entity of world.query(COMPONENTS.POSITION, COMPONENTS.APPEARANCE, COMPONENTS.BEHAVIOR)) {
      people.push({
        entity,
        pos: positions.get(entity)!,
        app: appearances.get(entity)!,
      });
    }
    // Sort by Y for depth ordering
    people.sort((a, b) => a.pos.y - b.pos.y);

    for (const { entity, pos, app } of people) {
      const beh = behaviors.get(entity);
      const anim = animations.get(entity);
      const status = statusIndicators.get(entity);
      const task = productionTasks.get(entity);

      this.drawPerson(pos.x, pos.y, app, beh, anim, status, task);
    }
  }

  private drawPerson(
    x: number,
    y: number,
    app: Appearance,
    beh: BehaviorState | undefined,
    anim: Animation | undefined,
    status: StatusIndicator | undefined,
    task: ProductionTask | undefined,
  ): void {
    const isWalking = beh?.current === 'walking';
    const isWorking = beh?.current === 'working';

    const bobY = isWalking
      ? Math.sin((anim?.frame || 0) * Math.PI) / SCALE
      : isWorking
      ? Math.sin(this.now * 0.003) * 0.1
      : 0;

    const drawY = y + bobY;

    // Shadow
    this.ctx.globalAlpha = 0.2;
    this.rect(x, drawY, 3, 13, 10, 3, '#000');
    this.ctx.globalAlpha = 1;

    // Body (shirt)
    this.rect(x, drawY, 4, 7, 8, 6, app.primaryColor);

    // Head
    this.rect(x, drawY, 5, 1, 6, 6, app.tertiaryColor); // skin

    // Hair
    this.rect(x, drawY, 5, 0, 6, 3, app.secondaryColor);

    // Eyes (with blinking)
    const blinkCycle = Math.floor(this.now / 3000) % 20;
    if (blinkCycle !== 0) {
      this.rect(x, drawY, 6, 3, 1, 1, '#1c1917');
      this.rect(x, drawY, 9, 3, 1, 1, '#1c1917');
    }

    // Legs
    const legOffset = isWalking ? ((anim?.frame || 0) % 2) : 0;
    this.rect(x, drawY, 5, 13, 3, 3, PAL.pants);
    this.rect(x, drawY, 8 + legOffset, 13, 3, 3, PAL.pants);

    // Arms
    this.rect(x, drawY, 2, 8, 2, 4, app.primaryColor);
    this.rect(x, drawY, 12, 8, 2, 4, app.primaryColor);

    // Status dot
    if (status?.visible) {
      const dotPulse = status.pulse ? Math.sin(this.now * 0.005) * 0.3 : 0;
      this.ctx.globalAlpha = 0.9 + dotPulse * 0.1;
      this.rect(x, drawY, 7, -2 + dotPulse, 2, 2, status.color);
      this.ctx.globalAlpha = 1;
    }

    // Progress bar (below character)
    if (task && !task.complete) {
      this.drawProgressBar(x, drawY, task.progress, app.primaryColor);
    }
  }

  private drawProgressBar(
    tileX: number,
    tileY: number,
    progress: number,
    fillColor: string,
  ): void {
    const barW = 12;  // source pixels
    const barH = 2;
    const offX = 2;   // center under 16px tile
    const offY = 17;  // just below feet

    // Background track
    this.rect(tileX, tileY, offX, offY, barW, barH, '#c9c3b8');

    // Fill
    const fillW = Math.max(1, Math.round(barW * progress));
    this.rect(tileX, tileY, offX, offY, fillW, barH, fillColor);
  }

  // --- Hit testing ---

  entityAtScreen(world: World, screenX: number, screenY: number): EntityId | null {
    const positions = world.getStore<Position>(COMPONENTS.POSITION);
    const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);

    for (const entity of world.query(COMPONENTS.POSITION, COMPONENTS.BEHAVIOR)) {
      const pos = positions.get(entity)!;
      const [px, py] = this.px(pos.x, pos.y);

      if (
        screenX >= px && screenX <= px + TS &&
        screenY >= py && screenY <= py + TS
      ) {
        return entity;
      }
    }
    return null;
  }
}
