const arena = document.getElementById("arena");
const playerEl = document.getElementById("player");
const feverMeterEl = document.getElementById("feverMeter");
const waveEl = document.getElementById("waveValue");
const scoreEl = document.getElementById("scoreValue");
const comboEl = document.getElementById("comboValue");
const enemyTemplate = document.getElementById("enemyTemplate");
const particleTemplate = document.getElementById("particleTemplate");

const keys = new Set();
const config = {
  accel: 0.28,
  maxSpeed: 13,
  drag: 0.986,
  dashImpulse: 7.5,
  slamForce: 8,
  flickForce: 6,
};

const game = {
  player: {
    x: 180,
    y: 180,
    vx: 0,
    vy: 0,
    radius: 24,
    lastImpactAt: 0,
  },
  score: 0,
  wave: 1,
  combo: 1,
  fever: 0,
  enemies: [],
  particles: [],
  lastTime: performance.now(),
  running: true,
  progression: {
    enemyCount: 3,
    enemySpeed: 1.5,
  },
};

function spawnEnemies(count = game.progression.enemyCount) {
  game.enemies.forEach((enemy) => enemy.el.remove());
  game.enemies = [];
  const rect = arena.getBoundingClientRect();

  for (let i = 0; i < count; i += 1) {
    const el = enemyTemplate.content.firstElementChild.cloneNode(true);
    arena.appendChild(el);
    game.enemies.push({
      el,
      x: Math.random() * (rect.width - 80) + 20,
      y: Math.random() * (rect.height - 80) + 20,
      vx: (Math.random() - 0.5) * game.progression.enemySpeed,
      vy: (Math.random() - 0.5) * game.progression.enemySpeed,
      radius: 20,
      type: i % 3,
      pushTimer: Math.random() * 220,
    });
  }
}

function emitParticles(x, y, amount, hue = 190) {
  for (let i = 0; i < amount; i += 1) {
    const p = particleTemplate.content.firstElementChild.cloneNode(true);
    arena.appendChild(p);
    game.particles.push({
      el: p,
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1,
      hue,
      size: 4 + Math.random() * 7,
    });
  }
}

function addScore(base) {
  const speedBoost = Math.hypot(game.player.vx, game.player.vy) / 3;
  const feverBoost = 1 + game.fever * 0.6;
  const gain = Math.round(base * game.combo * feverBoost + speedBoost);
  game.score += gain;
  scoreEl.textContent = game.score.toLocaleString();
}

function wrapWalls(entity, bounds, bounce = 0.94) {
  let impact = false;
  if (entity.x < entity.radius) {
    entity.x = entity.radius;
    entity.vx = Math.abs(entity.vx) * bounce;
    impact = true;
  } else if (entity.x > bounds.width - entity.radius) {
    entity.x = bounds.width - entity.radius;
    entity.vx = -Math.abs(entity.vx) * bounce;
    impact = true;
  }

  if (entity.y < entity.radius) {
    entity.y = entity.radius;
    entity.vy = Math.abs(entity.vy) * bounce;
    impact = true;
  } else if (entity.y > bounds.height - entity.radius) {
    entity.y = bounds.height - entity.radius;
    entity.vy = -Math.abs(entity.vy) * bounce;
    impact = true;
  }
  return impact;
}

function updatePlayer(dt, bounds) {
  let ix = 0;
  let iy = 0;
  if (keys.has("w") || keys.has("arrowup")) iy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) iy += 1;
  if (keys.has("a") || keys.has("arrowleft")) ix -= 1;
  if (keys.has("d") || keys.has("arrowright")) ix += 1;

  const angle = Math.atan2(iy, ix);
  const movingInput = ix || iy;
  if (movingInput) {
    const accel = config.accel * (1 + game.fever * 0.35);
    game.player.vx += Math.cos(angle) * accel * dt;
    game.player.vy += Math.sin(angle) * accel * dt;
  }

  game.player.vx *= config.drag;
  game.player.vy *= config.drag;

  const speed = Math.hypot(game.player.vx, game.player.vy);
  if (speed > config.maxSpeed * (1 + game.fever * 0.4)) {
    const clamp = (config.maxSpeed * (1 + game.fever * 0.4)) / speed;
    game.player.vx *= clamp;
    game.player.vy *= clamp;
  }

  game.player.x += game.player.vx * dt;
  game.player.y += game.player.vy * dt;

  if (wrapWalls(game.player, bounds, 0.98)) {
    game.player.lastImpactAt = performance.now();
    emitParticles(game.player.x, game.player.y, 8, 330);
  }

  const stretch = Math.min(speed / 15, 0.52);
  const squashX = 1 + stretch;
  const squashY = 1 - stretch * 0.65;
  const rot = Math.atan2(game.player.vy, game.player.vx) * (180 / Math.PI);

  playerEl.style.left = `${game.player.x - game.player.radius}px`;
  playerEl.style.top = `${game.player.y - game.player.radius}px`;
  playerEl.style.transform = `rotate(${rot}deg) scale(${squashX}, ${squashY})`;

  if (speed < 0.8) {
    playerEl.classList.add("idle");
  } else {
    playerEl.classList.remove("idle");
  }

  if (speed > 8) {
    emitTrail();
    game.fever = Math.min(1, game.fever + 0.008 * dt);
  } else {
    game.fever = Math.max(0, game.fever - 0.006 * dt);
  }
}

function updateEnemies(dt, bounds) {
  for (const enemy of game.enemies) {
    enemy.pushTimer -= dt;
    if (enemy.pushTimer <= 0) {
      enemy.pushTimer = 180 - game.wave * 5;
      const dx = game.player.x - enemy.x;
      const dy = game.player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 180) {
        game.player.vx += (dx / dist) * -1.8;
        game.player.vy += (dy / dist) * -1.8;
        emitParticles(enemy.x, enemy.y, 5, 310);
      }
    }

    const targetSpeed = 0.9 + game.wave * 0.1;
    enemy.vx += (Math.random() - 0.5) * 0.04 * dt;
    enemy.vy += (Math.random() - 0.5) * 0.04 * dt;
    const enemySpeed = Math.hypot(enemy.vx, enemy.vy) || 1;
    enemy.vx = (enemy.vx / enemySpeed) * targetSpeed;
    enemy.vy = (enemy.vy / enemySpeed) * targetSpeed;

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    wrapWalls(enemy, bounds, 1);

    const dx = game.player.x - enemy.x;
    const dy = game.player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist < game.player.radius + enemy.radius) {
      const pSpeed = Math.hypot(game.player.vx, game.player.vy);
      if (pSpeed > 6) {
        addScore(100);
        game.combo = Math.min(12, game.combo + 1);
        enemy.x = Math.random() * (bounds.width - 80) + 40;
        enemy.y = Math.random() * (bounds.height - 80) + 40;
        enemy.vx = (Math.random() - 0.5) * 2;
        enemy.vy = (Math.random() - 0.5) * 2;
        const push = pSpeed * 0.2;
        game.player.vx += (dx / dist) * push;
        game.player.vy += (dy / dist) * push;
        emitParticles(game.player.x, game.player.y, 14, 160);
      } else {
        game.combo = 1;
      }
    }

    enemy.el.style.left = `${enemy.x - enemy.radius}px`;
    enemy.el.style.top = `${enemy.y - enemy.radius}px`;
  }

  comboEl.textContent = `x${game.combo}`;
}

function updateParticles(dt) {
  game.particles = game.particles.filter((p) => {
    p.life -= 0.015 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.97;
    p.vy *= 0.97;

    if (p.life <= 0) {
      p.el.remove();
      return false;
    }

    p.el.style.left = `${p.x}px`;
    p.el.style.top = `${p.y}px`;
    p.el.style.opacity = p.life;
    p.el.style.width = `${p.size}px`;
    p.el.style.height = `${p.size}px`;
    p.el.style.color = `hsl(${p.hue}, 100%, 68%)`;
    return true;
  });
}

function emitTrail() {
  const t = document.createElement("div");
  t.className = "trail";
  t.style.left = `${game.player.x - 10}px`;
  t.style.top = `${game.player.y - 4}px`;
  const angle = Math.atan2(game.player.vy, game.player.vx) * (180 / Math.PI);
  t.style.transform = `rotate(${angle}deg)`;
  arena.appendChild(t);
  setTimeout(() => t.remove(), 180);
}

function maybeLevelUp() {
  const target = game.wave * 1300;
  if (game.score >= target) {
    game.wave += 1;
    waveEl.textContent = game.wave;
    game.progression.enemyCount = Math.min(13, game.progression.enemyCount + 1);
    game.progression.enemySpeed = Math.min(3.8, game.progression.enemySpeed + 0.3);
    spawnEnemies();
    emitParticles(game.player.x, game.player.y, 25, 56);
  }
}

function updateFeverFx() {
  feverMeterEl.style.width = `${game.fever * 100}%`;
  if (game.fever > 0.75) {
    arena.classList.add("fever");
    arena.style.filter = "saturate(1.35) contrast(1.1)";
  } else {
    arena.classList.remove("fever");
    arena.style.filter = "";
  }
}

function frame(now) {
  if (!game.running) return;

  const dt = Math.min(2.2, (now - game.lastTime) / 16.6);
  game.lastTime = now;
  const bounds = arena.getBoundingClientRect();

  updatePlayer(dt, bounds);
  updateEnemies(dt, bounds);
  updateParticles(dt);
  updateFeverFx();
  maybeLevelUp();

  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);

  if (key === "shift") {
    const dir = getAimDirection();
    game.player.vx += dir.x * config.dashImpulse;
    game.player.vy += dir.y * config.dashImpulse;
    emitParticles(game.player.x, game.player.y, 12, 200);
  }

  if (key === " ") {
    event.preventDefault();
    game.player.vy += config.slamForce;
    emitParticles(game.player.x, game.player.y + 12, 20, 24);
  }

  if (key === "j") {
    const dir = getAimDirection(true);
    game.player.vx += dir.x * config.flickForce;
    game.player.vy += dir.y * config.flickForce;
    emitParticles(game.player.x, game.player.y, 10, 280);
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

arena.addEventListener("click", (event) => {
  const rect = arena.getBoundingClientRect();
  const dx = event.clientX - rect.left - game.player.x;
  const dy = event.clientY - rect.top - game.player.y;
  const dist = Math.hypot(dx, dy) || 1;
  game.player.vx += (dx / dist) * config.flickForce;
  game.player.vy += (dy / dist) * config.flickForce;
  emitParticles(game.player.x, game.player.y, 10, 260);
});

function getAimDirection(forceForward = false) {
  let x = 0;
  let y = 0;
  if (keys.has("w") || keys.has("arrowup")) y -= 1;
  if (keys.has("s") || keys.has("arrowdown")) y += 1;
  if (keys.has("a") || keys.has("arrowleft")) x -= 1;
  if (keys.has("d") || keys.has("arrowright")) x += 1;

  if (x === 0 && y === 0) {
    if (forceForward) {
      const speed = Math.hypot(game.player.vx, game.player.vy);
      if (speed > 0.2) return { x: game.player.vx / speed, y: game.player.vy / speed };
    }
    return { x: 1, y: 0 };
  }

  const m = Math.hypot(x, y);
  return { x: x / m, y: y / m };
}

spawnEnemies();
requestAnimationFrame(frame);
