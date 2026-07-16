/**
 * Drawing helpers for the game, neural network, and training graph.
 */
class Renderer {
  constructor(gameCanvas, netCanvas, graphCanvas) {
    this.gameCtx = gameCanvas.getContext('2d');
    this.netCtx = netCanvas ? netCanvas.getContext('2d') : null;
    this.graphCtx = graphCanvas ? graphCanvas.getContext('2d') : null;
  }

  clear(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
  }

  drawGame(game) {
    game.draw(this.gameCtx);
  }

  drawNet(net) {
    if (!this.netCtx) return;
    const ctx = this.netCtx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    this.clear(ctx, w, h);

    const layers = net.layers;
    const layerX = layers.length === 3 ? [40, w / 2, w - 40] : layers.map((_, i) => 40 + i * ((w - 80) / (layers.length - 1)));
    const positions = [];
    for (let l = 0; l < layers.length; l++) {
      const yGap = h / (layers[l] + 1);
      for (let n = 0; n < layers[l]; n++) {
        positions.push({ x: layerX[l], y: yGap * (n + 1), layer: l, index: n });
      }
    }

    // Draw weights
    let weightIndex = 0;
    const flat = net.flat();
    for (let l = 0; l < net.weights.length; l++) {
      const rows = net.weights[l].length;
      const cols = net.weights[l][0].length;
      for (let i = 0; i < rows; i++) {
        const node = positions.find(p => p.layer === l + 1 && p.index === i);
        for (let j = 0; j < cols; j++) {
          const inputNode = positions.find(p => p.layer === l && p.index === j);
          const weight = flat[weightIndex++];
          const alpha = Math.min(1, Math.abs(weight) / 1.5);
          const color = weight > 0 ? `rgba(34,211,238,${alpha})` : `rgba(248,113,113,${alpha})`;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1 + alpha * 1.5;
          ctx.beginPath();
          ctx.moveTo(inputNode.x, inputNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.stroke();
        }
      }
      // bias weight not rendered; just advance pointer
      weightIndex += net.biases[l].length;
    }

    // Draw nodes
    for (const p of positions) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = p.layer === 0 ? '#2563eb' : p.layer === layers.length - 1 ? '#10b981' : '#f0f1f3';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#1f232b';
      ctx.stroke();
    }
  }

  drawGraph(history, maxGens = 100) {
    if (!this.graphCtx || history.length < 2) return;
    const ctx = this.graphCtx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    this.clear(ctx, w, h);

    const padding = 24;
    const usableW = w - padding * 2;
    const usableH = h - padding * 2;

    // Background grid
    ctx.strokeStyle = '#1f232b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * usableH;
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const data = history.slice(-maxGens);
    const max = Math.max(...data.map(d => Math.max(d.best, d.average)), 1);
    const count = data.length;

    const xFor = (i) => padding + (i / (count - 1)) * usableW;
    const yFor = (v) => padding + usableH - (v / max) * usableH;

    // Average line
    ctx.strokeStyle = '#8b909a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = xFor(i);
      const y = yFor(d.average);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Best line
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = xFor(i);
      const y = yFor(d.best);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Legend
    ctx.fillStyle = '#8b909a';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('avg', padding + 8, h - 8);
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('best', padding + 60, h - 8);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer;
}
