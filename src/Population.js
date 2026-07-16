/**
 * Genetic algorithm population that evolves a group of NeuralNets.
 */
const NeuralNetFactory = typeof require !== 'undefined' ? require('./NeuralNet') : (typeof NeuralNet !== 'undefined' ? NeuralNet : null);

class Population {
  constructor(options = {}) {
    this.size = options.size || 20;
    this.layers = options.layers || [5, 8, 1];
    this.eliteRatio = options.eliteRatio || 0.2;
    this.mutationRate = options.mutationRate || 0.12;
    this.mutationStrength = options.mutationStrength || 0.3;

    this.nets = Array.from({ length: this.size }, () => new NeuralNetFactory(this.layers));
    this.fitness = new Array(this.size).fill(-Infinity);
    this.current = 0;
    this.generation = 1;
    this.best = { net: this.nets[0].clone(), fitness: -Infinity };
    this.history = [];
  }

  static fromSession(session) {
    const pop = new Population(session.options);
    pop.generation = session.generation;
    pop.history = session.history || [];
    if (session.best && session.best.weights) {
      pop.best = {
        fitness: session.best.fitness,
        net: NeuralNet.fromWeights(session.options.layers, session.best.weights),
      };
    }
    return pop;
  }

  evaluate(fitness) {
    this.fitness[this.current] = fitness;
    if (fitness > this.best.fitness) {
      this.best = { net: this.nets[this.current].clone(), fitness };
    }
  }

  nextGenome() {
    this.current++;
    if (this.current >= this.size) {
      this.evolve();
      this.current = 0;
      return true;
    }
    return false;
  }

  evolve() {
    const ranked = this.nets
      .map((net, i) => ({ net, fitness: this.fitness[i] }))
      .sort((a, b) => b.fitness - a.fitness);

    const best = ranked[0];
    if (best.fitness > this.best.fitness) {
      this.best = { net: best.net.clone(), fitness: best.fitness };
    }

    const avg = this.fitness.reduce((a, b) => a + b, 0) / this.fitness.length;
    this.history.push({ generation: this.generation, best: best.fitness, average: avg });

    const eliteCount = Math.max(2, Math.floor(this.size * this.eliteRatio));
    const elite = ranked.slice(0, eliteCount).map(r => r.net);

    const next = [];
    while (next.length < this.size) {
      const a = elite[Math.floor(Math.random() * eliteCount)];
      const b = elite[Math.floor(Math.random() * eliteCount)];
      const childWeights = a.crossover(b);
      const child = new NeuralNetFactory(this.layers);
      child.setFlat(childWeights);
      child.mutate(this.mutationRate, this.mutationStrength);
      next.push(child);
    }

    this.nets = next;
    this.fitness.fill(-Infinity);
    this.generation++;
  }

  currentNet() {
    return this.nets[this.current];
  }

  serialize() {
    return {
      options: {
        size: this.size,
        layers: this.layers,
        eliteRatio: this.eliteRatio,
        mutationRate: this.mutationRate,
        mutationStrength: this.mutationStrength,
      },
      generation: this.generation,
      current: this.current,
      fitness: this.fitness,
      best: this.best.fitness > -Infinity
        ? { fitness: this.best.fitness, weights: this.best.net.flat() }
        : null,
      history: this.history,
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Population;
}
