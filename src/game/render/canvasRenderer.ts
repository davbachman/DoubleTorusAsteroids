import { buildOctagonPath, getGhostOffsets } from '../geometry/octagon';
import { drawAsteroidWireframe, drawBulletWireframe, drawLifeShipIcon, drawShipWireframe, drawUfoWireframe } from './wireframes';
import type { GameConfig, GameState, Vec2 } from '../types';

export class CanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly size: number;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly config: GameConfig) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.size = config.logicalCanvasSize;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
  }

  render(state: GameState): void {
    const { ctx, size } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);

    this.drawWorld(state);
    this.drawBoundary(state);

    ctx.restore();

    this.drawHud(state);
    this.drawOverlay(state);
    this.drawCredit();
  }

  private drawWorld(state: GameState): void {
    const { ctx } = this;

    ctx.save();
    buildOctagonPath(ctx, state.octagon);
    ctx.clip();

    ctx.fillStyle = '#000';
    ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);

    this.drawStars(state);

    ctx.lineWidth = 1.75;
    ctx.strokeStyle = '#f5f5f5';

    for (const asteroid of state.asteroids) {
      this.drawWrapped(asteroid.pos, asteroid.radius + 3, (offset) => {
        ctx.save();
        ctx.translate(asteroid.pos.x + offset.x, asteroid.pos.y + offset.y);
        ctx.rotate(asteroid.angle);
        drawAsteroidWireframe(ctx, asteroid);
        ctx.restore();
      });
    }

    if (state.player.alive && this.isPlayerVisible(state)) {
      this.drawWrapped(state.player.pos, state.player.radius + 3, (offset) => {
        ctx.save();
        ctx.translate(state.player.pos.x + offset.x, state.player.pos.y + offset.y);
        ctx.rotate(state.player.angle);
        drawShipWireframe(ctx, state.player.radius, state.player.thrusting);
        ctx.restore();
      });
    }

    for (const bullet of state.playerBullets) {
      this.drawWrapped(bullet.pos, bullet.radius + 1, (offset) => {
        ctx.save();
        ctx.translate(bullet.pos.x + offset.x, bullet.pos.y + offset.y);
        drawBulletWireframe(ctx, bullet.radius);
        ctx.restore();
      });
    }

    for (const bullet of state.ufoBullets) {
      this.drawWrapped(bullet.pos, bullet.radius + 1, (offset) => {
        ctx.save();
        ctx.translate(bullet.pos.x + offset.x, bullet.pos.y + offset.y);
        drawBulletWireframe(ctx, bullet.radius);
        ctx.restore();
      });
    }

    if (state.ufo?.alive) {
      this.drawWrapped(state.ufo.pos, state.ufo.radius + 3, (offset) => {
        ctx.save();
        ctx.translate(state.ufo!.pos.x + offset.x, state.ufo!.pos.y + offset.y);
        drawUfoWireframe(ctx, state.ufo!);
        ctx.restore();
      });
    }

    ctx.restore();
  }

  private drawStars(state: GameState): void {
    const { ctx } = this;
    const count = 36;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < count; i += 1) {
      const t = i * 17.17;
      const x = (Math.sin(t * 12.9898) * 43758.5453) % 1;
      const y = (Math.sin(t * 78.233) * 19341.123) % 1;
      const px = ((x < 0 ? x + 1 : x) * 2 - 1) * state.octagon.apothem;
      const py = ((y < 0 ? y + 1 : y) * 2 - 1) * state.octagon.apothem;
      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(state.time * (0.5 + (i % 5) * 0.1) + i));
      ctx.globalAlpha = twinkle * 0.35;
      ctx.fillRect(px, py, 1.5, 1.5);
    }
    ctx.restore();
  }

  private drawBoundary(state: GameState): void {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = 2;
    buildOctagonPath(ctx, state.octagon);
    ctx.stroke();
    ctx.restore();
  }

  private drawHud(state: GameState): void {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#f5f5f5';
    ctx.font = '18px "Courier New", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE ${String(state.score).padStart(5, '0')}`, 18, 14);
    ctx.fillText(`WAVE ${state.wave}`, this.size - 130, 14);

    const livesToDraw = Math.max(0, state.lives - (state.player.alive ? 1 : 0));
    ctx.fillText('LIVES', 18, this.size - 36);
    ctx.save();
    ctx.translate(84, this.size - 24);
    for (let i = 0; i < livesToDraw; i += 1) {
      ctx.save();
      ctx.translate(i * 24, 0);
      drawLifeShipIcon(ctx, 8);
      ctx.restore();
    }
    ctx.restore();

    if (state.audio.muted) {
      ctx.fillText('MUTED', this.size - 92, this.size - 36);
    }

    if (state.mode === 'paused') {
      ctx.fillText('PAUSED', this.size / 2 - 36, 14);
    }
    ctx.restore();
  }

  private drawOverlay(state: GameState): void {
    if (state.mode === 'playing' || state.mode === 'respawning') return;
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, this.size, this.size);
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '30px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state.mode === 'start' || state.mode === 'boot') {
      ctx.fillText('OCTAGON ASTEROIDS', this.size / 2, this.size / 2 - 80);
      ctx.font = '16px "Courier New", monospace';
      const lines = [
        'ENTER START   P PAUSE   F FULLSCREEN   M MUTE',
        'ARROWS / A D W TO ROTATE / THRUST   SPACE FIRE',
        'SHIFT HYPERSPACE',
      ];
      lines.forEach((line, index) => ctx.fillText(line, this.size / 2, this.size / 2 - 18 + index * 26));
      ctx.fillText('PRESS ENTER', this.size / 2, this.size / 2 + 86);
    }

    if (state.mode === 'gameOver') {
      ctx.fillText('GAME OVER', this.size / 2, this.size / 2 - 30);
      ctx.font = '18px "Courier New", monospace';
      ctx.fillText(`FINAL SCORE ${state.score}`, this.size / 2, this.size / 2 + 8);
      ctx.fillText('PRESS ENTER TO RESTART', this.size / 2, this.size / 2 + 46);
    }

    ctx.restore();
  }

  private drawCredit(): void {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '12px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('By David Bachman and GPT 5.3 CODEX.', this.size - 16, this.size - 12);
    ctx.restore();
  }

  private isPlayerVisible(state: GameState): boolean {
    if (state.player.invulnerableTimer <= 0) return true;
    return Math.floor(state.player.blinkPhase) % 2 === 0;
  }

  private drawWrapped(point: Vec2, radius: number, draw: (offset: Vec2) => void): void {
    const offsets = getGhostOffsets(point, radius, this.currentStateOctagon!);
    for (const offset of offsets) draw(offset);
  }

  private currentStateOctagon: GameState['octagon'] | null = null;

  private setCurrentOctagon(octagon: GameState['octagon']): void {
    this.currentStateOctagon = octagon;
  }

  private clearCurrentOctagon(): void {
    this.currentStateOctagon = null;
  }

  private withOctagon<T>(state: GameState, fn: () => T): T {
    this.setCurrentOctagon(state.octagon);
    try {
      return fn();
    } finally {
      this.clearCurrentOctagon();
    }
  }

  // Wrap render to provide octagon for ghost offset helpers without threading through every call.
  renderWithState(state: GameState): void {
    this.withOctagon(state, () => this.render(state));
  }
}
