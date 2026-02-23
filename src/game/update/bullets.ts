import { wrapPointInPlace } from '../geometry/octagon';
import type { BulletState, OctagonGeometry } from '../types';

export function updateBullets(bullets: BulletState[], geometry: OctagonGeometry, dt: number): void {
  for (const bullet of bullets) {
    bullet.prevPos.x = bullet.pos.x;
    bullet.prevPos.y = bullet.pos.y;
    bullet.pos.x += bullet.vel.x * dt;
    bullet.pos.y += bullet.vel.y * dt;
    const wrap = wrapPointInPlace(bullet.pos, geometry);
    bullet.prevPos.x += wrap.offset.x;
    bullet.prevPos.y += wrap.offset.y;
    bullet.ttl -= dt;
  }
}

export function pruneExpiredBullets(bullets: BulletState[]): BulletState[] {
  return bullets.filter((b) => b.ttl > 0);
}
