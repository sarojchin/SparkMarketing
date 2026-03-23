/**
 * Movement System
 * 
 * Processes entities with Position + PathFollower components.
 * Moves them along their path, updates facing direction,
 * and triggers animation state.
 */

import type { World } from '@/ecs';
import { COMPONENTS } from '@/simulation/components';
import type { Position, PathFollower, Facing, BehaviorState, Animation } from '@/simulation/components';

export function movementSystem(world: World, dt: number): void {
  const positions = world.getStore<Position>(COMPONENTS.POSITION);
  const paths = world.getStore<PathFollower>(COMPONENTS.PATH_FOLLOWER);
  const facings = world.getStore<Facing>(COMPONENTS.FACING);
  const behaviors = world.getStore<BehaviorState>(COMPONENTS.BEHAVIOR);
  const anims = world.getStore<Animation>(COMPONENTS.ANIMATION);

  const entities = world.query(COMPONENTS.POSITION, COMPONENTS.PATH_FOLLOWER);

  for (const entity of entities) {
    const pos = positions.get(entity)!;
    const pf = paths.get(entity)!;

    if (pf.path.length === 0) continue;

    const target = pf.path[0];
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = pf.speed * (dt / 1000);

    if (dist <= step) {
      // Arrived at waypoint
      pos.x = target.x;
      pos.y = target.y;
      pf.path.shift();

      if (pf.path.length === 0) {
        // Finished path — transition to next state
        const beh = behaviors.get(entity);
        if (beh && beh.nextState) {
          beh.current = beh.nextState;
          beh.nextState = null;
        }
        paths.delete(entity); // remove pathfollower when done
      }
    } else {
      // Move toward waypoint
      pos.x += (dx / dist) * step;
      pos.y += (dy / dist) * step;
    }

    // Update facing
    const facing = facings.get(entity);
    if (facing) {
      if (Math.abs(dx) > Math.abs(dy)) {
        facing.direction = dx > 0 ? 'right' : 'left';
      } else {
        facing.direction = dy > 0 ? 'down' : 'up';
      }
    }

    // Tick walk animation
    const anim = anims.get(entity);
    if (anim) {
      anim.timer += dt;
      if (anim.timer >= anim.speed) {
        anim.timer = 0;
        anim.frame = (anim.frame + 1) % anim.frameCount;
      }
    }
  }
}
