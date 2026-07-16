/**
 * PingPON physics engine.
 */
class Game {
  constructor(width = 760, height = 440) {
    this.w = width;
    this.h = height;
    this.paddleW = 12;
    this.paddleH = 72;
    this.ballR = 7;
    this.baseSpeed = 7;
    this.reset();
  }

  reset() {
    this.left = { x: 16, y: this.h / 2 - this.paddleH / 2, w: this.paddleW, h: this.paddleH, vy: 0, score: 0 };
    this.right = { x: this.w - 28, y: this.h / 2 - this.paddleH / 2, w: this.paddleW, h: this.paddleH, vy: 0, score: 0 };
    this.respawn(Math.random() < 0.5 ? 1 : -1);
    this.frames = 0;
    this.hits = 0;
    this.misses = 0;
  }

  respawn(dir) {
    this.ball = {
      x: this.w / 2,
      y: this.h / 2,
      vx: dir * Game.random(4, 7),
      vy: Game.random(-4, 4),
      r: this.ballR,
      speed: this.baseSpeed,
    };
    this.left.y = this.h / 2 - this.paddleH / 2;
    this.right.y = this.h / 2 - this.paddleH / 2;
  }

  /**
   * @param {number} rightControl - between -1 and 1
   * @param {number|null} leftControl - between -1 and 1, null means auto-pilot
   */
  update(rightControl = 0, leftControl = null) {
    const b = this.ball;

    // Move ball
    b.x += b.vx;
    b.y += b.vy;

    // Wall bounces
    if (b.y - b.r < 0) { b.y = b.r; b.vy *= -1; }
    if (b.y + b.r > this.h) { b.y = this.h - b.r; b.vy *= -1; }

    // Left paddle
    const l = this.left;
    if (leftControl === null) {
      // Simple tracking "teacher" AI
      const target = b.y - l.h / 2;
      l.y += (target - l.y) * 0.18;
    } else {
      l.y += leftControl * 9;
    }
    l.y = Game.clamp(l.y, 0, this.h - l.h);

    // Right paddle
    const r = this.right;
    r.y += rightControl * 9;
    r.y = Game.clamp(r.y, 0, this.h - r.h);

    // Collisions
    if (this.collide(b, l)) {
      b.vx = Math.abs(b.vx) * 1.05;
      b.x = l.x + l.w + b.r;
      this.applyPaddleSpin(b, l);
    }
    if (this.collide(b, r)) {
      b.vx = -Math.abs(b.vx) * 1.05;
      b.x = r.x - b.r;
      this.applyPaddleSpin(b, r);
      this.hits++;
    }

    // Cap speed
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > 22) {
      b.vx *= 0.95;
      b.vy *= 0.95;
    }

    // Scoring
    if (b.x < 0) {
      this.right.score++;
      this.misses++;
      this.respawn(1);
    }
    if (b.x > this.w) {
      this.left.score++;
      this.respawn(-1);
    }

    this.frames++;
  }

  collide(b, p) {
    return b.x - b.r < p.x + p.w && b.x + b.r > p.x && b.y + b.r > p.y && b.y - b.r < p.y + p.h;
  }

  applyPaddleSpin(b, p) {
    const center = p.y + p.h / 2;
    const offset = (b.y - center) / (p.h / 2); // -1 to 1
    b.vy += offset * 4;
    b.vx *= 1.02;
    return b;
  }

  draw(ctx) {
    // Background
    ctx.fillStyle = '#08090d';
    ctx.fillRect(0, 0, this.w, this.h);

    // Center dotted line
    ctx.strokeStyle = '#1f232b';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.w / 2, 0);
    ctx.lineTo(this.w / 2, this.h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(this.left.x, this.left.y, this.left.w, this.left.h);
    ctx.fillRect(this.right.x, this.right.y, this.right.w, this.right.h);

    // Ball
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee';
    ctx.fill();

    // Scores
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.left.score} - ${this.right.score}`, this.w / 2, 28);
    ctx.textAlign = 'left';
    ctx.fillText(`Hits: ${this.hits}`, 12, this.h - 12);
  }

  normalizedInputs(isRight = true) {
    const p = isRight ? this.right : this.left;
    return [
      this.ball.x / this.w,
      this.ball.y / this.h,
      this.ball.vx / 15,
      this.ball.vy / 15,
      (p.y + p.h / 2) / this.h,
    ];
  }

  static clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  static random(min, max) { return Math.random() * (max - min) + min; }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Game;
}
