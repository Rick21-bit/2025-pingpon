/**
 * OpenClaw vs Hermes agent battle.
 * Both agents control a paddle using neural networks and log their reasoning.
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
  let openclawBrain = null;
  let hermesBrain = null;

  const openclawLog = document.getElementById('openclaw-stream');
  const hermesLog = document.getElementById('hermes-stream');

  const openclawTools = [
    'perceive(game.ball, game.leftPaddle)',
    'memory.query("pingpong strategy")',
    'skill.pong.predict("move_up")',
    'tool.use("paddle.move", { direction: -1 })'
  ];

  const hermesTools = [
    'perceive(game.ball, game.rightPaddle)',
    'memory.recall("defensive line")',
    'skill.pong.compute("intercept")',
    'tool.use("right_paddle.move", { direction: 1 })'
  ];

  function logPanel(panel, agent, text, type = 'info') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    line.innerHTML = `<time>${time}</time> <span>${text}</span>`;
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
    if (panel.children.length > 40) panel.removeChild(panel.firstChild);
  }

  function randomLog(agent, panel, tools) {
    const tool = tools[Math.floor(Math.random() * tools.length)];
    logPanel(panel, agent, `> ${tool}`);
  }

  function loadBestBrains() {
    const session = Storage.load();
    if (session && session.best && session.best.weights) {
      try {
        openclawBrain = NeuralNet.fromWeights(session.options.layers, session.best.weights);
        hermesBrain = NeuralNet.fromWeights(session.options.layers, session.best.weights);
        document.getElementById('leftBrain').textContent = `gen ${session.generation}`;
        document.getElementById('rightBrain').textContent = `gen ${session.generation}`;
        logPanel(openclawLog, 'OpenClaw', `Loaded trained brain from generation ${session.generation}.`);
        logPanel(hermesLog, 'Hermes', `Loaded same brain. Mirroring for fair duel.`);
        return;
      } catch (e) {
        console.warn('Failed to load best brain', e);
      }
    }
    openclawBrain = new NeuralNet([5, 8, 1]);
    hermesBrain = new NeuralNet([5, 8, 1]);
    document.getElementById('leftBrain').textContent = 'random';
    document.getElementById('rightBrain').textContent = 'random';
    logPanel(openclawLog, 'OpenClaw', 'No trained brain found. Using random initialization.');
    logPanel(hermesLog, 'Hermes', 'No trained brain found. Using random initialization.');
  }

  function importBrain(brain) {
    try {
      openclawBrain = NeuralNet.fromWeights(brain.options.layers, brain.weights);
      hermesBrain = NeuralNet.fromWeights(brain.options.layers, brain.weights);
      document.getElementById('leftBrain').textContent = brain.generation || 'imported';
      document.getElementById('rightBrain').textContent = brain.generation || 'imported';
      game.reset();
      logPanel(openclawLog, 'OpenClaw', `Imported brain ${brain.generation || 'imported'}.`);
      logPanel(hermesLog, 'Hermes', `Imported brain ${brain.generation || 'imported'}.`);
    } catch (e) {
      alert('Invalid brain file');
    }
  }

  document.getElementById('reset').addEventListener('click', () => {
    game.reset();
    loadBestBrains();
  });

  const fileInput = document.getElementById('brain-file');
  document.getElementById('import-brain').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      Storage.importBrain(e.target.files[0]).then(importBrain).catch(() => alert('Could not read brain file'));
    }
  });

  let lastBallX = 0;
  let logTimer = 0;

  function loop() {
    const openclawControl = openclawBrain ? openclawBrain.forwardScalar(game.normalizedInputs(false)) : 0;
    const hermesControl = hermesBrain ? hermesBrain.forwardScalar(game.normalizedInputs(true)) : 0;
    // Game.update signature is (rightControl, leftControl)
    game.update(hermesControl, openclawControl);
    game.draw(ctx);

    document.getElementById('leftScore').textContent = game.left.score;
    document.getElementById('rightScore').textContent = game.right.score;

    // Log when ball direction changes or periodically.
    logTimer++;
    if (Math.sign(game.ball.vx) !== Math.sign(lastBallX) || logTimer > 90) {
      if (game.ball.vx > 0) {
        randomLog('Hermes', hermesLog, hermesTools);
      } else {
        randomLog('OpenClaw', openclawLog, openclawTools);
      }
      logTimer = 0;
    }
    lastBallX = game.ball.vx;

    if (game.hits > 0 && game.hits % 5 === 0) {
      logPanel(openclawLog, 'OpenClaw', `Rally sustained (${game.hits} volleys).`, 'success');
      logPanel(hermesLog, 'Hermes', `Rally sustained (${game.hits} volleys).`, 'success');
    }

    requestAnimationFrame(loop);
  }

  // Seed initial logs.
  logPanel(openclawLog, 'OpenClaw', 'Connecting to PingPON arena...');
  logPanel(hermesLog, 'Hermes', 'Handshaking with OpenClaw over shared game state...');
  setTimeout(() => {
    logPanel(openclawLog, 'OpenClaw', 'Connection established. Waiting for first serve.');
    logPanel(hermesLog, 'Hermes', 'Connection established. Competing via neural policies.');
  }, 600);

  loadBestBrains();
  loop();
})();
