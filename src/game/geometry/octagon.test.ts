import { describe, expect, it } from 'vitest';
import { createOctagonGeometry, containsPoint, getGhostOffsets, wrapPointInPlace } from './octagon';

const geom = createOctagonGeometry(100);

describe('octagon geometry', () => {
  it('contains inside points and rejects outside points', () => {
    expect(containsPoint({ x: 0, y: 0 }, geom)).toBe(true);
    expect(containsPoint({ x: 99, y: 0 }, geom)).toBe(true);
    expect(containsPoint({ x: 101, y: 0 }, geom)).toBe(false);
    expect(containsPoint({ x: 90, y: 90 }, geom)).toBe(false);
  });

  it('wraps points across axis-aligned edges', () => {
    const p = { x: 105, y: 12 };
    const result = wrapPointInPlace(p, geom);
    expect(result.offset.x).toBeCloseTo(-200, 6);
    expect(result.offset.y).toBeCloseTo(0, 6);
    expect(p.x).toBeCloseTo(-95, 6);
    expect(p.y).toBeCloseTo(12, 6);
    expect(containsPoint(p, geom)).toBe(true);
  });

  it('wraps points across diagonal edges', () => {
    const n = geom.normals[2];
    const p = { x: n.x * 105, y: n.y * 105 };
    wrapPointInPlace(p, geom);
    expect(Math.abs((p.x * n.x + p.y * n.y) - (-95))).toBeLessThan(1e-6);
    expect(containsPoint(p, geom)).toBe(true);
  });

  it('resolves corner-crossing points with multiple wrap passes', () => {
    const p = { x: 140, y: 140 };
    const result = wrapPointInPlace(p, geom);
    expect(result.passes).toBeGreaterThan(0);
    expect(containsPoint(p, geom)).toBe(true);
  });

  it('produces ghost offsets near seams including corner combinations', () => {
    const nearRight = { x: 96, y: 0 };
    const offsets = getGhostOffsets(nearRight, 10, geom);
    expect(offsets).toEqual(expect.arrayContaining([{ x: 0, y: 0 }, { x: -200, y: 0 }]));

    const vertex = geom.vertices[0];
    const cornerOffsets = getGhostOffsets(vertex, 2, geom);
    expect(cornerOffsets.length).toBeGreaterThan(2);
    const hasCombo = cornerOffsets.some((o) => Math.abs(o.x) > 150 && Math.abs(o.y) > 50);
    expect(hasCombo).toBe(true);
  });
});
