const arena = document.getElementById("arena");
const playerEl = document.getElementById("player");
const feverMeterEl = document.getElementById("feverMeter");
const stabilityMeterEl = document.getElementById("stabilityMeter");
const waveEl = document.getElementById("waveValue");
const scoreEl = document.getElementById("scoreValue");
const comboEl = document.getElementById("comboValue");
const upgradePointsEl = document.getElementById("upgradePointsValue");
const upgradeStateEl = document.getElementById("upgradeState");
const unlockStateEl = document.getElementById("unlockState");
const enemyTemplate = document.getElementById("enemyTemplate");
const particleTemplate = document.getElementById("particleTemplate");

const keys = new Set();
const MAX_PARTICLES = 140;

const config = {
  accel: 0.24,
  maxSpeed: 11.8,
  drag: 0.989,
  dashImpulse: 6.8,
  slamForce: 6.2,
  flickForce: 4.8,
};

const game = {
  player: { x: 180, y: 180, vx: 0, vy: 0, radius: 24, renderX: 180, renderY: 180 },
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
  unlocks: { slam: false, flick: false },
  progression: { enemyCount: 3, enemySpeed: 1.2 },
};

function updateUnlockHud() {
  unlockStateEl.textContent = `Dash ✅ | Slam ${game.unlocks.slam ? "✅" : "🔒(Wave 2)"} | Flick ${game.unlocks.flick ? "✅" : "🔒(Wave 3)"}`;
}

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
      radius: 18,
      pushTimer: Math.random() * 220,
    });
  }
}

function cullParticlesIfNeeded() {
  while (game.particles.length > MAX_PARTICLES) {
    const p = game.particles.shift();
    if (p) p.el.remove();
  }
}

function emitParticles(x, y, amount, hue = 190, spread = 7, sizeMin = 3, sizeMax = 6) {
  const budget = Math.max(0, MAX_PARTICLES - game.particles.length);
  const count = Math.min(amount, budget);
  for (let i = 0; i < count; i += 1) {
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
  cullParticlesIfNeeded();
}

function emitImpactBurst(x, y, pSpeed) {
  const amount = Math.min(10, 4 + Math.floor(pSpeed * 0.45));
  emitParticles(x, y, amount, 172, 9, 2, 5);
  emitParticles(x, y, Math.floor(amount * 0.4), 320, 8, 2, 4);
}

function addScore(base) {
  const speedBoost = Math.hypot(game.player.vx, game.player.vy) / 3.2;
  const feverBoost = 1 + game.fever * 0.5;
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

function wrapTrack(entity, bounds, bounce = 0.97) {
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

function applyPenalty(amount) {
  const shieldFactor = Math.max(0.3, 1 - game.upgrades.shield * 0.2);
  game.stability = Math.max(0, game.stability - amount * shieldFactor);
  game.combo = 1;
  comboEl.textContent = "x1";
  emitParticles(game.player.x, game.player.y, 4, 16, 6, 2, 4);
}

function spendUpgrade(slot) {
  if (game.upgradePoints <= 0) return;

  if (slot === "1" && game.upgrades.dash < 5) { game.upgrades.dash += 1; game.upgradePoints -= 1; }
  if (slot === "2" && game.upgrades.grip < 5) { game.upgrades.grip += 1; game.upgradePoints -= 1; }
  if (slot === "3" && game.upgrades.shield < 5) { game.upgrades.shield += 1; game.upgradePoints -= 1; }

  config.dashImpulse = 6.8 + game.upgrades.dash * 0.65;
  config.drag = 0.989 + game.upgrades.grip * 0.0017;
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

  const movingInput = ix || iy;
  if (movingInput) {
    const angle = Math.atan2(iy, ix);
    const accel = config.accel * (1 + game.fever * 0.22);
    game.player.vx += Math.cos(angle) * accel * dt;
    game.player.vy += Math.sin(angle) * accel * dt;
  }

  game.player.vx *= config.drag;
  game.player.vy *= config.drag;

  const speed = Math.hypot(game.player.vx, game.player.vy);
  const maxSpeed = config.maxSpeed * (1 + game.fever * 0.25 + game.upgrades.grip * 0.02);
  if (speed > maxSpeed) {
    const clamp = maxSpeed / speed;
    game.player.vx *= clamp;
    game.player.vy *= clamp;
  }

  game.player.x += game.player.vx * dt;
  game.player.y += game.player.vy * dt;

  if (wrapTrack(game.player, bounds, 0.985)) {
    const impactSpeed = Math.hypot(game.player.vx, game.player.vy);
    if (impactSpeed > 8.5) applyPenalty(4.5);
  }

  const stretch = Math.min(speed / 16, 0.35);
  const squashX = 1 + stretch;
  const squashY = 1 - stretch * 0.55;
  const rot = Math.atan2(game.player.vy, game.player.vx) * (180 / Math.PI);

  // render smoothing to reduce jumpy look
  const smoothing = 0.22;
  game.player.renderX += (game.player.x - game.player.renderX) * smoothing;
  game.player.renderY += (game.player.y - game.player.renderY) * smoothing;

  playerEl.style.left = `${game.player.renderX - game.player.radius}px`;
  playerEl.style.top = `${game.player.renderY - game.player.radius}px`;
  playerEl.style.transform = `rotate(${rot}deg) scale(${squashX}, ${squashY})`;

  if (speed < 0.8) playerEl.classList.add("idle");
  else playerEl.classList.remove("idle");

  if (speed > 8) {
    emitTrail();
    game.fever = Math.min(1, game.fever + 0.005 * dt);
  } else {
    game.fever = Math.max(0, game.fever - 0.0045 * dt);
  }

  game.stability = Math.min(100, game.stability + 0.03 * dt + game.upgrades.shield * 0.009 * dt);
}

function updateEnemies(dt, bounds) {
  for (const enemy of game.enemies) {
    enemy.pushTimer -= dt;
    if (enemy.pushTimer <= 0) {
      enemy.pushTimer = Math.max(120, 200 - game.wave * 5);
      const dx = game.player.x - enemy.x;
      const dy = game.player.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 180) {
        game.player.vx += (dx / dist) * -1.3;
        game.player.vy += (dy / dist) * -1.3;
        emitParticles(enemy.x, enemy.y, 2, 300, 5, 2, 3);
      }
    }

    const targetSpeed = 0.7 + game.wave * 0.08;
    enemy.vx += (Math.random() - 0.5) * 0.025 * dt;
    enemy.vy += (Math.random() - 0.5) * 0.025 * dt;
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
      if (pSpeed > 5.8) {
        addScore(100);
        game.combo = Math.min(15, game.combo + 1);

        enemy.x = Math.random() * (bounds.width * 0.76) + bounds.width * 0.12;
        enemy.y = Math.random() * (bounds.height * 0.76) + bounds.height * 0.12;
        enemy.vx = (Math.random() - 0.5) * 1.3;
        enemy.vy = (Math.random() - 0.5) * 1.3;

        emitImpactBurst(game.player.x, game.player.y, pSpeed);
      } else {
        applyPenalty(8.5);
      }
    }

    enemy.el.style.left = `${enemy.x - enemy.radius}px`;
    enemy.el.style.top = `${enemy.y - enemy.radius}px`;
  }

  comboEl.textContent = `x${game.combo}`;
}

function updateParticles(dt) {
  game.particles = game.particles.filter((p) => {
    p.life -= 0.025 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.95;
    p.vy *= 0.95;

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
  if (Math.random() > 0.4) return;
  const t = document.createElement("div");
  t.className = "trail";
  t.style.left = `${game.player.renderX - 10}px`;
  t.style.top = `${game.player.renderY - 4}px`;
  const angle = Math.atan2(game.player.vy, game.player.vx) * (180 / Math.PI);
  t.style.transform = `rotate(${angle}deg)`;
  arena.appendChild(t);
  setTimeout(() => t.remove(), 140);
}

function maybeLevelUp() {
  const target = game.wave * 1450;
  if (game.score >= target) {
    game.wave += 1;
    game.upgradePoints += 1;
    if (game.wave >= 2) game.unlocks.slam = true;
    if (game.wave >= 3) game.unlocks.flick = true;

    waveEl.textContent = game.wave;
    upgradePointsEl.textContent = game.upgradePoints;
    updateUnlockHud();

    game.progression.enemyCount = Math.min(10, game.progression.enemyCount + 1);
    game.progression.enemySpeed = Math.min(2.8, game.progression.enemySpeed + 0.16);
    spawnEnemies();
    emitParticles(game.player.x, game.player.y, 8, 62, 8, 2, 5);
  }
}

function updateUiFx() {
  feverMeterEl.style.width = `${game.fever * 100}%`;
  stabilityMeterEl.style.width = `${game.stability}%`;

  if (game.fever > 0.8) {
    arena.classList.add("fever");
    arena.style.filter = "saturate(1.2) contrast(1.05)";
  } else {
    arena.classList.remove("fever");
    arena.style.filter = "";
  }

  if (game.stability < 30) arena.classList.add("stability-low");
  else arena.classList.remove("stability-low");

  if (game.stability <= 0) {
    game.stability = 100;
    game.score = Math.max(0, game.score - 600);
    game.combo = 1;
    scoreEl.textContent = game.score.toLocaleString();
    comboEl.textContent = "x1";
    emitParticles(game.player.x, game.player.y, 10, 12, 8, 2, 5);
  }
}

function frame(now) {
  if (!game.running) return;

  // tighter dt cap for smoother stepping
  const dt = Math.min(1.05, (now - game.lastTime) / 16.6667);
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
    emitParticles(game.player.x, game.player.y, 4, 198, 7, 2, 4);
  }

  if (key === " " && game.unlocks.slam) {
    event.preventDefault();
    game.player.vy += config.slamForce;
    emitParticles(game.player.x, game.player.y + 12, 5, 22, 7, 2, 4);
  }

  if (key === "j" && game.unlocks.flick) {
    const dir = getAimDirection(true);
    game.player.vx += dir.x * config.flickForce;
    game.player.vy += dir.y * config.flickForce;
    emitParticles(game.player.x, game.player.y, 4, 282, 7, 2, 4);
  }

  if (["1", "2", "3"].includes(key)) spendUpgrade(key);
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

arena.addEventListener("click", (event) => {
  if (!game.unlocks.flick) return;
  const rect = arena.getBoundingClientRect();
  const dx = event.clientX - rect.left - game.player.x;
  const dy = event.clientY - rect.top - game.player.y;
  const dist = Math.hypot(dx, dy) || 1;
  game.player.vx += (dx / dist) * config.flickForce;
  game.player.vy += (dy / dist) * config.flickForce;
  emitParticles(game.player.x, game.player.y, 4, 260, 7, 2, 4);
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

updateUnlockHud();
spawnEnemies();
requestAnimationFrame(frame);
