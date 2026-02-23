import type { OctagonGeometry, Vec2 } from '../types';
import { dot, length, normalize, perp, scale, vec } from '../math/vector';

const SQRT1_2 = Math.SQRT1_2;

export function createOctagonGeometry(apothem: number): OctagonGeometry {
  const normals: Vec2[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: SQRT1_2, y: SQRT1_2 },
    { x: SQRT1_2, y: -SQRT1_2 },
  ];
  const portalVectors = normals.map((n) => ({ x: n.x * apothem * 2, y: n.y * apothem * 2 }));
  const circumradius = apothem / Math.cos(Math.PI / 8);
  const vertices: Vec2[] = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.PI / 8 + (i * Math.PI) / 4;
    vertices.push({ x: Math.cos(angle) * circumradius, y: Math.sin(angle) * circumradius });
  }
  return { apothem, circumradius, normals, portalVectors, vertices };
}

export function containsPoint(point: Vec2, geometry: OctagonGeometry, margin = 0): boolean {
  const limit = geometry.apothem - margin;
  if (limit < 0) return false;
  for (const n of geometry.normals) {
    if (Math.abs(dot(n, point)) > limit) return false;
  }
  return true;
}

export interface WrapResult {
  offset: Vec2;
  passes: number;
}

export function wrapPointInPlace(point: Vec2, geometry: OctagonGeometry, maxPasses = 4): WrapResult {
  const offset = vec(0, 0);
  let passes = 0;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    for (const n of geometry.normals) {
      const d = dot(n, point);
      if (d > geometry.apothem) {
        const dx = 2 * geometry.apothem * n.x;
        const dy = 2 * geometry.apothem * n.y;
        point.x -= dx;
        point.y -= dy;
        offset.x -= dx;
        offset.y -= dy;
        changed = true;
      } else if (d < -geometry.apothem) {
        const dx = 2 * geometry.apothem * n.x;
        const dy = 2 * geometry.apothem * n.y;
        point.x += dx;
        point.y += dy;
        offset.x += dx;
        offset.y += dy;
        changed = true;
      }
    }
    if (!changed) break;
    passes += 1;
  }
  return { offset, passes };
}

export function buildOctagonPath(ctx: CanvasRenderingContext2D, geometry: OctagonGeometry): void {
  const [first, ...rest] = geometry.vertices;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (const v of rest) ctx.lineTo(v.x, v.y);
  ctx.closePath();
}

export function randomPointInOctagon(
  geometry: OctagonGeometry,
  rng = Math.random,
  margin = 0,
): Vec2 {
  const bound = geometry.apothem - margin;
  for (let i = 0; i < 400; i += 1) {
    const p = {
      x: (rng() * 2 - 1) * bound,
      y: (rng() * 2 - 1) * bound,
    };
    if (containsPoint(p, geometry, margin)) return p;
  }
  return { x: 0, y: 0 };
}

export function getGhostOffsets(point: Vec2, radius: number, geometry: OctagonGeometry): Vec2[] {
  const triggers: Vec2[] = [];
  geometry.normals.forEach((n) => {
    const d = dot(n, point);
    const distToPlus = geometry.apothem - d;
    const distToMinus = geometry.apothem + d;
    if (distToPlus <= radius) {
      triggers.push({ x: -2 * geometry.apothem * n.x, y: -2 * geometry.apothem * n.y });
    }
    if (distToMinus <= radius) {
      triggers.push({ x: 2 * geometry.apothem * n.x, y: 2 * geometry.apothem * n.y });
    }
  });

  if (triggers.length === 0) return [vec(0, 0)];

  const offsets: Vec2[] = [vec(0, 0)];
  for (const t of triggers) {
    const snapshot = [...offsets];
    for (const o of snapshot) {
      offsets.push({ x: o.x + t.x, y: o.y + t.y });
    }
  }

  const dedup = new Map<string, Vec2>();
  for (const o of offsets) {
    const key = `${o.x.toFixed(4)},${o.y.toFixed(4)}`;
    if (!dedup.has(key)) dedup.set(key, o);
  }
  return [...dedup.values()];
}

export function nearestEdgeNormal(point: Vec2, geometry: OctagonGeometry): Vec2 {
  let bestNormal = geometry.normals[0];
  let bestDistance = Infinity;
  for (const n of geometry.normals) {
    const d = Math.abs(geometry.apothem - Math.abs(dot(n, point)));
    if (d < bestDistance) {
      bestDistance = d;
      bestNormal = n;
    }
  }
  return { x: bestNormal.x, y: bestNormal.y };
}

export function pointOnRandomEdge(geometry: OctagonGeometry, rng = Math.random): { point: Vec2; inward: Vec2 } {
  const idx = Math.floor(rng() * geometry.vertices.length);
  const a = geometry.vertices[idx];
  const b = geometry.vertices[(idx + 1) % geometry.vertices.length];
  const t = rng();
  const point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  const inward = normalize(scale(point, -1));
  return { point, inward: length(inward) > 0 ? inward : perp(normalize({ x: b.x - a.x, y: b.y - a.y })) };
}
