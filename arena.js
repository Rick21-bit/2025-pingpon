/**
 * Human vs trained AI arena.
 */
(function () {
  'use strict';

  const CW = 760;
  const CH = 440;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = CW;
  canvas.height = CH;

  const game = new Game(CW, CH);
  let ai = null;

  const keys = { up: false, down: false };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  });

  function loadBestBrain() {
    const session = Storage.load();
    if (session && session.best && session.best.weights) {
      try {
        ai = NeuralNet.fromWeights(session.options.layers, session.best.weights);
        document.getElementById('bestGen').textContent = session.generation;
        document.getElementById('bestFit').textContent = Math.round(session.best.fitness);
        return;
      } catch (e) {
        console.warn('Failed to load best brain', e);
      }
    }
    // Fallback: create a random brain so the arena still functions.
    ai = new NeuralNet([5, 8, 1]);
    document.getElementById('bestGen').textContent = 'random';
    document.getElementById('bestFit').textContent = '-';
  }

  function importBrain(brain) {
    try {
      ai = NeuralNet.fromWeights(brain.options.layers, brain.weights);
      document.getElementById('bestGen').textContent = brain.generation || 'imported';
      document.getElementById('bestFit').textContent = Math.round(brain.fitness || 0);
      game.reset();
    } catch (e) {
      alert('Invalid brain file');
    }
  }

  document.getElementById('reset').addEventListener('click', () => {
    game.reset();
    loadBestBrain();
  });

  const fileInput = document.getElementById('brain-file');
  document.getElementById('import-brain').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      Storage.importBrain(e.target.files[0]).then(importBrain).catch(() => alert('Could not read brain file'));
    }
  });

  function loop() {
    const humanControl = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const aiControl = ai ? ai.forwardScalar(game.normalizedInputs(true)) : 0;
    game.update(aiControl, humanControl);
    game.draw(ctx);

    document.getElementById('leftScore').textContent = game.left.score;
    document.getElementById('rightScore').textContent = game.right.score;

    requestAnimationFrame(loop);
  }

  loadBestBrain();
  loop();
})();
