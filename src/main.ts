import * as Phaser from 'phaser';
import { initAudio } from './audio';
import { EventBus } from './core/events';
import { Input } from './core/input';
import { loadTuning, tuning } from './core/tuning';
import { initTuningPanel } from './debug/tuningPanel';
import { LabScene } from './scenes/LabScene';
import { initUI } from './ui';

loadTuning();

const bus = new EventBus();
const input = new Input();
initUI(bus);
initAudio(bus);

const scene = new LabScene(bus, input);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#0b0d14',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [scene],
});

initTuningPanel(bus, () => scene.sim?.reset());
bus.emit('mode:change', { assist: tuning.assist });
