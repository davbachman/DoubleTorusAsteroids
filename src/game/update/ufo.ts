import { GAME_CONFIG } from '../config';
import { wrapPointInPlace } from '../geometry/octagon';
import { randRange, randSign } from '../math/random';
import { normalize, scale } from '../math/vector';
import type { OctagonGeometry, UfoState } from '../types';

export function updateUfoMovement(ufo: UfoState, geometry: OctagonGeometry, dt: number): void {
  ufo.pos.x += ufo.vel.x * dt;
  ufo.pos.y += ufo.vel.y * dt;
  wrapPointInPlace(ufo.pos, geometry);
  ufo.courseTimer -= dt;
  ufo.fireCooldown -= dt;
}

export function retargetUfoCourse(ufo: UfoState, rng = Math.random): void {
  const speed = Math.hypot(ufo.vel.x, ufo.vel.y) || randRange(GAME_CONFIG.ufo.speedRange[0], GAME_CONFIG.ufo.speedRange[1], rng);
  const toCenter = normalize({ x: -ufo.pos.x, y: -ufo.pos.y });
  const lateral = { x: -toCenter.y * randSign(rng), y: toCenter.x * randSign(rng) };
  const mix = ufo.type === 'large' ? 0.85 : 0.45;
  const dir = normalize({ x: toCenter.x * mix + lateral.x * (1 - mix), y: toCenter.y * mix + lateral.y * (1 - mix) });
  ufo.vel = scale(dir, speed);
  ufo.courseTimer = randRange(GAME_CONFIG.ufo.courseChangeInterval[0], GAME_CONFIG.ufo.courseChangeInterval[1], rng);
}
