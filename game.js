const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  keys: new Set(),
  player: {
    x: canvas.width * 0.5,
    y: canvas.height * 0.5,
    vx: 0,
    vy: 0,
    radius: 25,
    faceMood: 0,
    slamCooldown: 0,
    dashCooldown: 0,
    impact: 0,
    trail: [],
  },
  particles: [],
  enemies: [],
  wave: 1,
  score: 0,
  combo: 1,
  comboTimer: 0,
  fever: 0,
  feverTimer: 0,
  time: 0,
};

const world = {
  gravity: 0.2,
  drag: 0.995,
  accel: 0.65,
  maxSpeed: 20,
  dashImpulse: 7.5,
  slamForce: 10,
};

const surfaceDefs = [
  { type: 'rubber', color: '#55ffd2', bounce: 1.08, friction: 0.99 },
  { type: 'metal', color: '#b9c6ff', bounce: 0.96, friction: 0.997 },
  { type: 'gel', color: '#d26dff', bounce: 0.66, friction: 0.93 },
  { type: 'boost', color: '#ffe569', bounce: 1.02, friction: 1.04 },
];

const surfaces = [
  { x: 30, y: 30, w: 40, h: canvas.height - 60, kind: 'rubber' },
  { x: canvas.width - 70, y: 30, w: 40, h: canvas.height - 60, kind: 'metal' },
  { x: 70, y: canvas.height - 70, w: canvas.width - 140, h: 40, kind: 'gel' },
  { x: 70, y: 30, w: canvas.width - 140, h: 40, kind: 'boost' },
  { x: 390, y: 240, w: 500, h: 28, kind: 'metal' },
  { x: 300, y: 490, w: 670, h: 30, kind: 'rubber' },
];

function spawnWave() {
  const count = Math.min(4 + state.wave, 16);
  for (let i = 0; i < count; i += 1) {
    const typeRoll = Math.random();
    const type = typeRoll < 0.34 ? 'push' : typeRoll < 0.68 ? 'sticky' : 'laser';
    state.enemies.push({
      x: 120 + Math.random() * (canvas.width - 240),
      y: 120 + Math.random() * (canvas.height - 240),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      r: 18 + Math.random() * 12,
      type,
      pulse: Math.random() * Math.PI * 2,
      alive: true,
    });
  }
}

spawnWave();

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  state.keys.add(key);
  if (key === ' ') {
    event.preventDefault();
    slam();
  }
  if (key === 'shift') {
    dash();
  }
  if (key === 'j') {
    flick();
  }
});

window.addEventListener('keyup', (event) => state.keys.delete(event.key.toLowerCase()));
canvas.addEventListener('mousedown', flick);

function dash() {
  const player = state.player;
  if (player.dashCooldown > 0) return;

  const dir = inputVector();
  const intensity = Math.max(1, speed(player) / 8);
  player.vx += dir.x * world.dashImpulse * intensity;
  player.vy += dir.y * world.dashImpulse * intensity;
  player.dashCooldown = 0.45;
  player.impact = 1;
  spawnBurst(player.x, player.y, '#ffe571', 24, 4);
}

function slam() {
  const player = state.player;
  if (player.slamCooldown > 0) return;
  player.vy += world.slamForce;
  player.vx *= 0.95;
  player.slamCooldown = 0.65;
  spawnBurst(player.x, player.y, '#ff68cb', 18, 2.8);
}

function flick() {
  const player = state.player;
  const dir = inputVector();
  const force = 4.8 + Math.min(6, speed(player) * 0.2);
  player.vx += dir.x * force;
  player.vy += dir.y * force;
  player.faceMood = 1;
  spawnBurst(player.x, player.y, '#6effff', 10, 2);
}

function inputVector() {
  let x = 0;
  let y = 0;
  if (state.keys.has('w') || state.keys.has('arrowup')) y -= 1;
  if (state.keys.has('s') || state.keys.has('arrowdown')) y += 1;
  if (state.keys.has('a') || state.keys.has('arrowleft')) x -= 1;
  if (state.keys.has('d') || state.keys.has('arrowright')) x += 1;
  if (x === 0 && y === 0) return { x: 1, y: 0 };
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}

function spawnBurst(x, y, color, count, force) {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const v = Math.random() * force;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.35 + Math.random() * 0.55,
      color,
      s: 2 + Math.random() * 3,
    });
  }
}

function speed(entity) {
  return Math.hypot(entity.vx, entity.vy);
}

function update(dt) {
  state.time += dt;
  updatePlayer(dt);
  updateEnemies(dt);
  updateParticles(dt);

  if (state.enemies.filter((e) => e.alive).length === 0) {
    state.wave += 1;
    state.score += 500 * state.wave;
    spawnWave();
  }

  state.comboTimer = Math.max(0, state.comboTimer - dt);
  if (state.comboTimer === 0) state.combo = 1;

  const feverTarget = speed(state.player) > 11 ? 1 : 0;
  state.fever += (feverTarget - state.fever) * Math.min(1, dt * 3.5);
  if (state.fever > 0.8) {
    state.feverTimer += dt;
    state.score += Math.floor(12 * dt * state.combo);
    document.getElementById('toast').classList.add('on');
  } else {
    state.feverTimer = 0;
    document.getElementById('toast').classList.remove('on');
  }

  document.getElementById('wave').textContent = state.wave;
  document.getElementById('score').textContent = state.score;
  document.getElementById('combo').textContent = `x${state.combo.toFixed(1)}`;
  document.getElementById('fever').textContent = `${Math.round(state.fever * 100)}%`;
}

function updatePlayer(dt) {
  const p = state.player;
  const move = inputVector();

  p.vx += move.x * world.accel * dt * 60;
  p.vy += move.y * world.accel * dt * 60 + world.gravity * dt * 60;

  p.vx *= world.drag;
  p.vy *= world.drag;

  const s = speed(p);
  if (s > world.maxSpeed) {
    p.vx = (p.vx / s) * world.maxSpeed;
    p.vy = (p.vy / s) * world.maxSpeed;
  }

  p.x += p.vx;
  p.y += p.vy;

  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  p.slamCooldown = Math.max(0, p.slamCooldown - dt);
  p.faceMood = Math.max(0, p.faceMood - dt * 2.5);
  p.impact = Math.max(0, p.impact - dt * 4);

  collideWithSurfaces(p);

  p.trail.push({ x: p.x, y: p.y, s });
  if (p.trail.length > 16) p.trail.shift();
}

function collideWithSurfaces(p) {
  for (const surface of surfaces) {
    const d = surfaceDefs.find((s) => s.type === surface.kind);
    const withinX = p.x > surface.x - p.radius && p.x < surface.x + surface.w + p.radius;
    const withinY = p.y > surface.y - p.radius && p.y < surface.y + surface.h + p.radius;
    if (!withinX || !withinY) continue;

    const left = Math.abs(p.x - surface.x);
    const right = Math.abs(p.x - (surface.x + surface.w));
    const top = Math.abs(p.y - surface.y);
    const bottom = Math.abs(p.y - (surface.y + surface.h));
    const minPen = Math.min(left, right, top, bottom);

    if (minPen === left) {
      p.x = surface.x - p.radius;
      p.vx = -Math.abs(p.vx) * d.bounce;
    } else if (minPen === right) {
      p.x = surface.x + surface.w + p.radius;
      p.vx = Math.abs(p.vx) * d.bounce;
    } else if (minPen === top) {
      p.y = surface.y - p.radius;
      p.vy = -Math.abs(p.vy) * d.bounce;
    } else {
      p.y = surface.y + surface.h + p.radius;
      p.vy = Math.abs(p.vy) * d.bounce;
    }

    p.vx *= d.friction;
    p.vy *= d.friction;
    p.impact = 1;
    p.faceMood = 0.6;
    spawnBurst(p.x, p.y, d.color, 8, 2.2);
  }
}

function updateEnemies(dt) {
  for (const e of state.enemies) {
    if (!e.alive) continue;
    e.pulse += dt * 4;

    if (e.type === 'push') {
      const dx = state.player.x - e.x;
      const dy = state.player.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 150 && Math.sin(e.pulse) > 0.98) {
        state.player.vx += (dx / (dist + 1)) * 2.4;
        state.player.vy += (dy / (dist + 1)) * 2.4;
      }
    }

    if (e.type === 'sticky') {
      const dx = state.player.x - e.x;
      const dy = state.player.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < e.r + state.player.radius + 10) {
        state.player.vx *= 0.94;
        state.player.vy *= 0.94;
      }
    }

    e.x += e.vx;
    e.y += e.vy;
    if (e.x < 100 || e.x > canvas.width - 100) e.vx *= -1;
    if (e.y < 100 || e.y > canvas.height - 100) e.vy *= -1;

    const dx = state.player.x - e.x;
    const dy = state.player.y - e.y;
    const dist = Math.hypot(dx, dy);
    const impactSpeed = speed(state.player);
    if (dist < e.r + state.player.radius && impactSpeed > 6) {
      e.alive = false;
      state.combo += 0.35;
      state.comboTimer = 2.3;
      const hitScore = Math.floor(120 * impactSpeed * state.combo);
      state.score += hitScore;
      spawnBurst(e.x, e.y, '#ffffff', 32, 5.8);
      state.player.vx -= (dx / dist) * 1.3;
      state.player.vy -= (dy / dist) * 1.3;
    }
  }
}

function updateParticles(dt) {
  state.particles = state.particles.filter((p) => {
    p.life -= dt;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.985;
    p.vy *= 0.985;
    return p.life > 0;
  });
}

function render() {
  const feverGlow = state.fever * 0.45;
  ctx.fillStyle = `rgba(${10 + feverGlow * 120}, ${6 + feverGlow * 20}, ${28 + feverGlow * 80}, 0.35)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawSurfaces();
  drawParticles();
  drawEnemies();
  drawPlayer();
}

function drawSurfaces() {
  for (const s of surfaces) {
    const def = surfaceDefs.find((d) => d.type === s.kind);
    const pulse = 0.4 + Math.abs(Math.sin(state.time * 2.2 + s.x * 0.01)) * 0.5;
    ctx.fillStyle = `${def.color}${Math.round(pulse * 120).toString(16).padStart(2, '0')}`;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
}

function drawEnemies() {
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const t = (Math.sin(e.pulse) + 1) * 0.5;
    const color = e.type === 'push' ? `rgba(255,90,153,${0.45 + t * 0.4})`
      : e.type === 'sticky' ? `rgba(117,255,233,${0.45 + t * 0.4})`
      : `rgba(255,227,116,${0.45 + t * 0.4})`;

    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + t * 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (e.type === 'laser') {
      ctx.strokeStyle = `rgba(255,227,116,${0.2 + t * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x - 80, e.y);
      ctx.lineTo(e.x + 80, e.y);
      ctx.stroke();
    }
  }
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillRect(p.x, p.y, p.s, p.s);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const p = state.player;
  const s = speed(p);

  for (let i = 0; i < p.trail.length; i += 1) {
    const t = p.trail[i];
    const alpha = i / p.trail.length;
    ctx.fillStyle = `rgba(109,255,255,${alpha * 0.28})`;
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, p.radius * (0.5 + alpha * 0.5), p.radius * (0.3 + alpha * 0.5), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const idleB = Math.sin(state.time * 6.8) * (s < 1.2 ? 0.16 : 0.03);
  const squash = 1 + Math.min(0.45, s * 0.02) - p.impact * 0.18;
  const stretch = 1 - Math.min(0.18, s * 0.012) + p.impact * 0.22 + idleB;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(p.vy, p.vx) * 0.12);

  ctx.beginPath();
  ctx.ellipse(0, 0, p.radius * squash, p.radius * stretch, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${185 + state.fever * 110}, 90%, ${60 + state.fever * 10}%)`;
  ctx.fill();

  const eyeOffset = 8;
  const blink = Math.abs(Math.sin(state.time * 2.8)) > 0.96 ? 1 : 0;
  ctx.fillStyle = '#16081f';
  ctx.beginPath();
  ctx.ellipse(-eyeOffset, -4, 3, blink ? 0.6 : 5, 0, 0, Math.PI * 2);
  ctx.ellipse(eyeOffset, -4, 3, blink ? 0.6 : 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const smile = 3 + p.faceMood * 6;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#16081f';
  ctx.beginPath();
  ctx.arc(0, 4, smile, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
