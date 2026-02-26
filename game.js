const arena = document.getElementById("arena");
const playerEl = document.getElementById("player");
const feverMeterEl = document.getElementById("feverMeter");
const stabilityMeterEl = document.getElementById("stabilityMeter");
const waveEl = document.getElementById("waveValue");
const scoreEl = document.getElementById("scoreValue");
const comboEl = document.getElementById("comboValue");
const upgradePointsEl = document.getElementById("upgradePointsValue");
const upgradeStateEl = document.getElementById("upgradeState");
const enemyTemplate = document.getElementById("enemyTemplate");
const particleTemplate = document.getElementById("particleTemplate");

const keys = new Set();
const config = {
  accel: 0.27,
  maxSpeed: 13,
  drag: 0.985,
  dashImpulse: 7.4,
  slamForce: 8,
  flickForce: 6,
};

const game = {
  player: { x: 180, y: 180, vx: 0, vy: 0, radius: 24 },
  score: 0,
  wave: 1,
  combo: 1,
  fever: 0,
  stability: 100,
  enemies: [],
  particles: [],
  lastTime: performance.now(),
  running: true,
  upgradePoints: 0,
  upgrades: { dash: 0, grip: 0, shield: 0 },
  progression: { enemyCount: 3, enemySpeed: 1.4 },
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
      x: Math.random() * (rect.width * 0.82) + rect.width * 0.09,
      y: Math.random() * (rect.height * 0.82) + rect.height * 0.09,
      vx: (Math.random() - 0.5) * game.progression.enemySpeed,
      vy: (Math.random() - 0.5) * game.progression.enemySpeed,
      radius: 20,
      pushTimer: Math.random() * 210,
    });
  }
}

function emitParticles(x, y, amount, hue = 190, spread = 8, sizeMin = 4, sizeMax = 10) {
  for (let i = 0; i < amount; i += 1) {
    const p = particleTemplate.content.firstElementChild.cloneNode(true);
    arena.appendChild(p);
    game.particles.push({
      el: p,
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: (Math.random() - 0.5) * spread,
      life: 1,
      hue,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
    });
  }
}

function emitImpactBurst(x, y, pSpeed) {
  const amount = Math.min(28, 10 + Math.floor(pSpeed * 1.4));
  emitParticles(x, y, amount, 172, 12, 3, 8);
  emitParticles(x, y, Math.floor(amount * 0.45), 320, 10, 2, 6);
}

function addScore(base) {
  const speedBoost = Math.hypot(game.player.vx, game.player.vy) / 3;
  const feverBoost = 1 + game.fever * 0.65;
  const gain = Math.round(base * game.combo * feverBoost + speedBoost);
  game.score += gain;
  scoreEl.textContent = game.score.toLocaleString();
}

function trackBounds(bounds) {
  return {
    left: bounds.width * 0.08,
    right: bounds.width * 0.92,
    top: bounds.height * 0.06,
    bottom: bounds.height * 0.94,
  };
}

function wrapTrack(entity, bounds, bounce = 0.96) {
  const t = trackBounds(bounds);
  let impact = false;

  if (entity.x < t.left + entity.radius) {
    entity.x = t.left + entity.radius;
    entity.vx = Math.abs(entity.vx) * bounce;
    impact = true;
  } else if (entity.x > t.right - entity.radius) {
    entity.x = t.right - entity.radius;
    entity.vx = -Math.abs(entity.vx) * bounce;
    impact = true;
  }

  if (entity.y < t.top + entity.radius) {
    entity.y = t.top + entity.radius;
    entity.vy = Math.abs(entity.vy) * bounce;
    impact = true;
  } else if (entity.y > t.bottom - entity.radius) {
    entity.y = t.bottom - entity.radius;
    entity.vy = -Math.abs(entity.vy) * bounce;
    impact = true;
  }

  return impact;
}

function applyPenalty(amount, reason) {
  const shieldFactor = Math.max(0.2, 1 - game.upgrades.shield * 0.22);
  const finalAmount = amount * shieldFactor;
  game.stability = Math.max(0, game.stability - finalAmount);
  game.combo = 1;
  comboEl.textContent = "x1";
  emitParticles(game.player.x, game.player.y, 14, 20, 10, 3, 8);
  if (reason === "wall") emitParticles(game.player.x, game.player.y, 6, 12, 6, 2, 5);
}

function spendUpgrade(slot) {
  if (game.upgradePoints <= 0) return;

  if (slot === "1" && game.upgrades.dash < 5) {
    game.upgrades.dash += 1;
    game.upgradePoints -= 1;
  }
  if (slot === "2" && game.upgrades.grip < 5) {
    game.upgrades.grip += 1;
    game.upgradePoints -= 1;
  }
  if (slot === "3" && game.upgrades.shield < 5) {
    game.upgrades.shield += 1;
    game.upgradePoints -= 1;
  }

  config.dashImpulse = 7.4 + game.upgrades.dash * 0.7;
  config.drag = 0.985 + game.upgrades.grip * 0.0025;
  upgradePointsEl.textContent = game.upgradePoints;
  upgradeStateEl.textContent = `Dash+${game.upgrades.dash} | Grip+${game.upgrades.grip} | Shield+${game.upgrades.shield}`;
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
  const maxSpeed = config.maxSpeed * (1 + game.fever * 0.35 + game.upgrades.grip * 0.03);
  if (speed > maxSpeed) {
    const clamp = maxSpeed / speed;
    game.player.vx *= clamp;
    game.player.vy *= clamp;
  }

  game.player.x += game.player.vx * dt;
  game.player.y += game.player.vy * dt;

  if (wrapTrack(game.player, bounds, 0.98)) {
    const impactSpeed = Math.hypot(game.player.vx, game.player.vy);
    emitParticles(game.player.x, game.player.y, 8, 338);
    if (impactSpeed > 8.5) applyPenalty(5 + impactSpeed * 0.35, "wall");
  }

  const stretch = Math.min(speed / 15, 0.52);
  const squashX = 1 + stretch;
  const squashY = 1 - stretch * 0.65;
  const rot = Math.atan2(game.player.vy, game.player.vx) * (180 / Math.PI);

  playerEl.style.left = `${game.player.x - game.player.radius}px`;
  playerEl.style.top = `${game.player.y - game.player.radius}px`;
  playerEl.style.transform = `rotate(${rot}deg) scale(${squashX}, ${squashY})`;

  if (speed < 0.8) playerEl.classList.add("idle");
  else playerEl.classList.remove("idle");

  if (speed > 8) {
    emitTrail();
    game.fever = Math.min(1, game.fever + 0.009 * dt);
  } else {
    game.fever = Math.max(0, game.fever - 0.0062 * dt);
  }

  // Passive recovery, punishes repeated mistakes but not permanent failure.
  game.stability = Math.min(100, game.stability + 0.035 * dt + game.upgrades.shield * 0.01 * dt);
}

function updateEnemies(dt, bounds) {
  for (const enemy of game.enemies) {
    enemy.pushTimer -= dt;
    if (enemy.pushTimer <= 0) {
      enemy.pushTimer = Math.max(90, 175 - game.wave * 5);
      const dx = game.player.x - enemy.x;
      const dy = game.player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 200) {
        game.player.vx += (dx / dist) * -2.1;
        game.player.vy += (dy / dist) * -2.1;
        emitParticles(enemy.x, enemy.y, 6, 304);
      }
    }

    const targetSpeed = 0.85 + game.wave * 0.11;
    enemy.vx += (Math.random() - 0.5) * 0.04 * dt;
    enemy.vy += (Math.random() - 0.5) * 0.04 * dt;
    const enemySpeed = Math.hypot(enemy.vx, enemy.vy) || 1;
    enemy.vx = (enemy.vx / enemySpeed) * targetSpeed;
    enemy.vy = (enemy.vy / enemySpeed) * targetSpeed;

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    wrapTrack(enemy, bounds, 1);

    const dx = game.player.x - enemy.x;
    const dy = game.player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist < game.player.radius + enemy.radius) {
      const pSpeed = Math.hypot(game.player.vx, game.player.vy);
      if (pSpeed > 6) {
        addScore(100);
        game.combo = Math.min(15, game.combo + 1);

        enemy.x = Math.random() * (bounds.width * 0.76) + bounds.width * 0.12;
        enemy.y = Math.random() * (bounds.height * 0.76) + bounds.height * 0.12;
        enemy.vx = (Math.random() - 0.5) * 2;
        enemy.vy = (Math.random() - 0.5) * 2;

        const push = pSpeed * 0.22;
        game.player.vx += (dx / dist) * push;
        game.player.vy += (dy / dist) * push;
        emitImpactBurst(game.player.x, game.player.y, pSpeed);
      } else {
        applyPenalty(9 + game.wave * 0.5, "enemy");
      }
    }

    enemy.el.style.left = `${enemy.x - enemy.radius}px`;
    enemy.el.style.top = `${enemy.y - enemy.radius}px`;
  }

  comboEl.textContent = `x${game.combo}`;
}

function updateParticles(dt) {
  game.particles = game.particles.filter((p) => {
    p.life -= 0.016 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.968;
    p.vy *= 0.968;

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
  setTimeout(() => t.remove(), 170);
}

function maybeLevelUp() {
  const target = game.wave * 1450;
  if (game.score >= target) {
    game.wave += 1;
    game.upgradePoints += 1;
    waveEl.textContent = game.wave;
    upgradePointsEl.textContent = game.upgradePoints;
    game.progression.enemyCount = Math.min(14, game.progression.enemyCount + 1);
    game.progression.enemySpeed = Math.min(4.1, game.progression.enemySpeed + 0.28);
    spawnEnemies();
    emitParticles(game.player.x, game.player.y, 24, 62, 10, 3, 9);
  }
}

function updateUiFx() {
  feverMeterEl.style.width = `${game.fever * 100}%`;
  stabilityMeterEl.style.width = `${game.stability}%`;

  if (game.fever > 0.75) {
    arena.classList.add("fever");
    arena.style.filter = "saturate(1.35) contrast(1.08)";
  } else {
    arena.classList.remove("fever");
    arena.style.filter = "";
  }

  if (game.stability < 30) arena.classList.add("stability-low");
  else arena.classList.remove("stability-low");

  if (game.stability <= 0) {
    game.stability = 100;
    game.score = Math.max(0, game.score - 800);
    game.combo = 1;
    scoreEl.textContent = game.score.toLocaleString();
    comboEl.textContent = "x1";
    emitParticles(game.player.x, game.player.y, 40, 10, 14, 3, 11);
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
  updateUiFx();
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
    emitParticles(game.player.x, game.player.y, 12, 198, 10, 3, 8);
  }

  if (key === " ") {
    event.preventDefault();
    game.player.vy += config.slamForce;
    emitParticles(game.player.x, game.player.y + 12, 18, 22, 12, 2, 8);
  }

  if (key === "j") {
    const dir = getAimDirection(true);
    game.player.vx += dir.x * config.flickForce;
    game.player.vy += dir.y * config.flickForce;
    emitParticles(game.player.x, game.player.y, 10, 282, 9, 3, 7);
  }

  if (["1", "2", "3"].includes(key)) spendUpgrade(key);
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

arena.addEventListener("click", (event) => {
  const rect = arena.getBoundingClientRect();
  const dx = event.clientX - rect.left - game.player.x;
  const dy = event.clientY - rect.top - game.player.y;
  const dist = Math.hypot(dx, dy) || 1;
  game.player.vx += (dx / dist) * config.flickForce;
  game.player.vy += (dy / dist) * config.flickForce;
  emitParticles(game.player.x, game.player.y, 10, 260, 10, 3, 7);
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
