const fs = require('fs');
const path = require('path');
const NeuralNet = require('../src/NeuralNet');
const Game = require('../src/Game');
const Population = require('../src/Population');

const root = path.join(__dirname, '..');
const requiredFiles = [
  'index.html',
  'arena.html',
  'agents.html',
  'learn.html',
  'style.css',
  'app.js',
  'arena.js',
  'agents.js',
  'src/NeuralNet.js',
  'src/Game.js',
  'src/Population.js',
  'src/Renderer.js',
  'src/Storage.js',
  'src/UI.js',
  'future-expansion.md',
];

let failed = false;
for (const f of requiredFiles) {
  if (!fs.existsSync(path.join(root, f))) {
    console.error('Missing file:', f);
    failed = true;
  }
}

// Neural network sanity checks
const net = new NeuralNet([5, 8, 1]);
const out = net.forwardScalar([0.5, 0.5, 0, 0, 0.5]);
if (typeof out !== 'number' || isNaN(out)) {
  console.error('Neural network forward pass failed');
  failed = true;
}

const flat = net.flat();
if (flat.length !== net.weightCount()) {
  console.error('flat() length does not match weightCount()');
  failed = true;
}

const child = net.crossover(new NeuralNet([5, 8, 1]));
if (child.length !== flat.length) {
  console.error('crossover produced wrong genome length');
  failed = true;
}

// Game sanity checks
const game = new Game(760, 440);
if (game.ball.x !== 380) {
  console.error('Game reset positioned ball incorrectly');
  failed = true;
}

// Population sanity checks
const pop = new Population({ size: 10, layers: [5, 8, 1] });
if (pop.nets.length !== 10) {
  console.error('Population size mismatch');
  failed = true;
}

if (failed) process.exit(1);
console.log('PingPON v2 smoke tests passed');
