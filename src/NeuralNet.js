/**
 * A small feed-forward neural network with tanh activation.
 * Supports arbitrary layer shapes and genetic operators.
 */
class NeuralNet {
  constructor(layers = [5, 8, 1]) {
    if (!layers || layers.length < 2) throw new Error('Need at least input and output layers');
    this.layers = layers.slice();
    this.weights = [];
    this.biases = [];
    this.randomize();
  }

  static fromWeights(layers, flatWeights) {
    const net = new NeuralNet(layers);
    net.setFlat(flatWeights);
    return net;
  }

  randomize() {
    this.weights = [];
    this.biases = [];
    for (let i = 1; i < this.layers.length; i++) {
      const rows = this.layers[i];
      const cols = this.layers[i - 1];
      this.weights.push(
        Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => Math.random() * 2 - 1)
        )
      );
      this.biases.push(Array.from({ length: rows }, () => Math.random() * 2 - 1));
    }
  }

  forward(inputs) {
    let a = inputs;
    for (let l = 0; l < this.weights.length; l++) {
      const w = this.weights[l];
      const b = this.biases[l];
      a = w.map((row, i) => NeuralNet.tanh(row.reduce((sum, v, j) => sum + v * a[j], 0) + b[i]));
    }
    return a;
  }

  forwardScalar(inputs) {
    const out = this.forward(inputs);
    return out.length === 1 ? out[0] : out;
  }

  flat() {
    const flat = [];
    for (const w of this.weights) {
      for (const row of w) {
        for (const v of row) flat.push(v);
      }
    }
    for (const b of this.biases) {
      for (const v of b) flat.push(v);
    }
    return flat;
  }

  setFlat(flat) {
    let p = 0;
    for (let l = 0; l < this.weights.length; l++) {
      for (let i = 0; i < this.weights[l].length; i++) {
        for (let j = 0; j < this.weights[l][i].length; j++) {
          this.weights[l][i][j] = flat[p++];
        }
      }
      for (let i = 0; i < this.biases[l].length; i++) {
        this.biases[l][i] = flat[p++];
      }
    }
  }

  clone() {
    const n = new NeuralNet(this.layers.slice());
    n.setFlat(this.flat().slice());
    return n;
  }

  mutate(rate = 0.15, strength = 0.3) {
    const flat = this.flat().map(v => (Math.random() < rate ? v + (Math.random() * 2 - 1) * strength : v));
    this.setFlat(flat);
  }

  crossover(partner) {
    const a = this.flat();
    const b = partner.flat();
    const child = a.map((v, i) => (Math.random() < 0.5 ? v : b[i]));
    return child;
  }

  weightCount() {
    return this.flat().length;
  }

  static tanh(x) {
    return Math.tanh(x);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NeuralNet;
}
