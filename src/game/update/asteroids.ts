import { wrapPointInPlace } from '../geometry/octagon';
import type { AsteroidState, OctagonGeometry } from '../types';

export function updateAsteroids(asteroids: AsteroidState[], geometry: OctagonGeometry, dt: number): void {
  for (const asteroid of asteroids) {
    asteroid.pos.x += asteroid.vel.x * dt;
    asteroid.pos.y += asteroid.vel.y * dt;
    asteroid.angle += asteroid.spin * dt;
    wrapPointInPlace(asteroid.pos, geometry);
  }
}
