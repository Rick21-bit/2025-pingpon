/**
 * DOM bindings and UI state for the training page.
 */
class UI {
  constructor() {
    this.elements = {
      gen: document.getElementById('gen'),
      member: document.getElementById('member'),
      hits: document.getElementById('hits'),
      best: document.getElementById('best'),
      avg: document.getElementById('avg'),
      mode: document.getElementById('mode'),
      speed: document.getElementById('speed'),
      pause: document.getElementById('pause'),
      reset: document.getElementById('reset'),
      newSession: document.getElementById('new-session'),
      saveBrain: document.getElementById('save-brain'),
    };
  }

  updateStats(population, game) {
    if (this.elements.gen) this.elements.gen.textContent = population.generation;
    if (this.elements.member) this.elements.member.textContent = `${population.current + 1} / ${population.size}`;
    if (this.elements.hits) this.elements.hits.textContent = game.hits;
    if (this.elements.best) this.elements.best.textContent = Math.round(population.best.fitness);

    const last = population.history[population.history.length - 1];
    if (this.elements.avg && last) this.elements.avg.textContent = Math.round(last.average);
  }

  bindPause(toggleFn) {
    if (this.elements.pause) {
      this.elements.pause.addEventListener('click', () => {
        const paused = toggleFn();
        this.elements.pause.textContent = paused ? 'Resume' : 'Pause';
      });
    }
  }

  bindSpeed(changeFn) {
    if (this.elements.speed) {
      this.elements.speed.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        const label = document.getElementById('speedVal');
        if (label) label.textContent = v;
        changeFn(v);
      });
    }
  }

  bindMode(changeFn) {
    if (this.elements.mode) {
      this.elements.mode.addEventListener('change', (e) => changeFn(e.target.value));
    }
  }

  bindReset(resetFn) {
    if (this.elements.reset) this.elements.reset.addEventListener('click', resetFn);
  }

  bindNewSession(fn) {
    if (this.elements.newSession) this.elements.newSession.addEventListener('click', fn);
  }

  bindSaveBrain(fn) {
    if (this.elements.saveBrain) this.elements.saveBrain.addEventListener('click', fn);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UI;
}
