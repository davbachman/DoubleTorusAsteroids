import './styles.css';
import { attachAdvanceTime } from './game/debug/advanceTime';
import { Game } from './game/game';

declare global {
  interface Window {
    advanceTime: (ms: number) => void;
    render_game_to_text: () => string;
    gameDebug?: {
      getState: () => unknown;
      game: Game;
    };
  }
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app container');

const shell = document.createElement('div');
shell.className = 'game-shell';
const canvas = document.createElement('canvas');
canvas.width = 960;
canvas.height = 960;
shell.appendChild(canvas);
app.appendChild(shell);

async function toggleFullscreen(): Promise<void> {
  if (!document.fullscreenElement) {
    await shell.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

const game = new Game(canvas, { toggleFullscreen });
attachAdvanceTime((ms) => game.advanceTime(ms));
window.render_game_to_text = () => game.renderGameToText();
window.gameDebug = {
  getState: () => game.getDebugState(),
  game,
};

game.start();
