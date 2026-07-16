/**
 * PingPON application entry point.
 * Orchestrates the game loop, neuro-evolution, rendering, and user controls.
 */
(function () {
  'use strict';

  const CW = 760;
  const CH = 440;

  const canvas = document.getElementById('game');
  const netCanvas = document.getElementById('net-canvas');
  const graphCanvas = document.getElementById('graph-canvas');

  canvas.width = CW;
  canvas.height = CH;
  if (netCanvas) { netCanvas.width = 320; netCanvas.height = 240; }
  if (graphCanvas) { graphCanvas.width = graphCanvas.clientWidth || 320; graphCanvas.height = graphCanvas.clientHeight || 160; }

  const renderer = new Renderer(canvas, netCanvas, graphCanvas);
  const game = new Game(CW, CH);
  const ui = new UI();

  const config = {
    layers: [5, 12, 1],
    populationSize: 24,
    eliteRatio: 0.25,
    mutationRate: 0.12,
    mutationStrength: 0.25,
    framesPerEval: 600,
  };

  let population = buildPopulation();
  let mode = 'train';
  let paused = false;
  let speed = 1;
  let steps = 0;

  function buildPopulation() {
    const saved = Storage.load();
    if (saved && saved.options && JSON.stringify(saved.options.layers) === JSON.stringify(config.layers)) {
      try {
        return Population.fromSession(saved);
      } catch (e) {
        console.warn('Could not restore session, starting fresh', e);
      }
    }
    return new Population({
      size: config.populationSize,
      layers: config.layers,
      eliteRatio: config.eliteRatio,
      mutationRate: config.mutationRate,
      mutationStrength: config.mutationStrength,
    });
  }

  function runTrainingStep() {
    const net = population.currentNet();
    const inputs = game.normalizedInputs(true);
    const control = net.forwardScalar(inputs);
    game.update(control);

    if (game.frames >= config.framesPerEval) {
      const fitness = game.hits * 100 + game.frames * 0.2 - game.misses * 250;
      population.evaluate(fitness);
      const evolved = population.nextGenome();
      game.reset();
      if (evolved) {
        Storage.save(population.serialize());
      }
    }
  }

  function runBestStep() {
    if (population.best.fitness === -Infinity) return;
    const net = population.best.net;
    const inputs = game.normalizedInputs(true);
    const control = net.forwardScalar(inputs);
    game.update(control);
  }

  function runAiVsAiStep() {
    if (population.best.fitness === -Infinity) return;
    const net = population.best.net;
    // Right side uses the net directly; left side uses a mirrored version.
    const rightInputs = game.normalizedInputs(true);
    const leftInputs = [
      1 - game.ball.x / game.w,
      game.ball.y / game.h,
      -game.ball.vx / 15,
      game.ball.vy / 15,
      (game.left.y + game.left.h / 2) / game.h,
    ];
    const rightControl = net.forwardScalar(rightInputs);
    const leftControl = net.forwardScalar(leftInputs);
    game.update(rightControl, leftControl);
  }

  function loop() {
    if (!paused) {
      for (let s = 0; s < speed; s++) {
        if (mode === 'train') runTrainingStep();
        else if (mode === 'best') runBestStep();
        else if (mode === 'ai-vs-ai') runAiVsAiStep();
      }
    }

    renderer.drawGame(game);
    if (mode === 'train') {
      renderer.drawNet(population.currentNet());
      renderer.drawGraph(population.history);
    } else if (population.best.fitness > -Infinity) {
      renderer.drawNet(population.best.net);
      renderer.drawGraph(population.history);
    }

    if (steps % 10 === 0) {
      ui.updateStats(population, game);
    }
    steps++;
    requestAnimationFrame(loop);
  }

  // Controls
  ui.bindPause(() => { paused = !paused; return paused; });
  ui.bindSpeed((v) => { speed = Math.max(1, Math.min(v, 32)); });
  ui.bindMode((m) => { mode = m; game.reset(); });
  ui.bindReset(() => { game.reset(); });
  ui.bindNewSession(() => {
    if (confirm('Start a new training session?')) {
      Storage.clear();
      population = new Population({
        size: config.populationSize,
        layers: config.layers,
        eliteRatio: config.eliteRatio,
        mutationRate: config.mutationRate,
        mutationStrength: config.mutationStrength,
      });
      game.reset();
    }
  });
  ui.bindSaveBrain(() => {
    if (population.best.fitness === -Infinity) return alert('No trained brain yet.');
    Storage.exportBrain({
      options: population.serialize().options,
      fitness: population.best.fitness,
      generation: population.generation,
      weights: population.best.net.flat(),
    });
  });

  window.addEventListener('resize', () => {
    if (graphCanvas) {
      graphCanvas.width = graphCanvas.clientWidth || 320;
      graphCanvas.height = graphCanvas.clientHeight || 160;
    }
  });

  ui.updateStats(population, game);
  loop();
})();
