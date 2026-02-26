const arena = document.getElementById("arena");
const playerEl = document.getElementById("player");
const distanceEl = document.getElementById("distanceValue");
const speedEl = document.getElementById("speedValue");
const feverMeterEl = document.getElementById("feverMeter");
const hpMeterEl = document.getElementById("hpMeter");
const pointsEl = document.getElementById("pointsValue");
const unlockStateEl = document.getElementById("unlockState");
const particleTemplate = document.getElementById("particleTemplate");
const deathOverlay = document.getElementById("deathOverlay");
const deathSummary = document.getElementById("deathSummary");
const restartBtn = document.getElementById("restartBtn");

const keys = new Set();
const MAX_PARTICLES = 100;

const game = {
  gravity: 0.52,
  distance: 0,
  speed: 4.3,
  fever: 0,
  hp: 100,
  particles: [],
  points: 0,
  dead: false,
  lastTime: performance.now(),
  worldX: 0,
  player: {
    x: 170,
    y: 0,
    vy: 0,
    radius: 24,
    onGround: false,
    bounciness: 0.2,
  },
  unlocks: { boost: false, explosion: false, split: false },
};

function terrainHeight(worldX, arenaHeight) {
  const base = arenaHeight * 0.68;
  const rolling = Math.sin(worldX * 0.005) * 35;
  const rampUp = Math.max(0, Math.sin((worldX - 900) * 0.003)) * 48;
  const rampDown = Math.max(0, Math.sin((worldX - 1700) * 0.003)) * 32;
  return base - rolling - rampUp + rampDown;
}

function updateUnlocks() {
  if (game.distance > 350 && !game.unlocks.boost) game.unlocks.boost = true;
  if (game.distance > 900 && !game.unlocks.explosion) game.unlocks.explosion = true;
  if (game.distance > 1600 && !game.unlocks.split) game.unlocks.split = true;

  unlockStateEl.textContent = `Boost ${game.unlocks.boost ? "✅" : "🔒"} | Explosion ${game.unlocks.explosion ? "✅" : "🔒"} | Split ${game.unlocks.split ? "✅" : "🔒"}`;
}

function emitParticles(x, y, amount, hue = 190, spread = 7) {
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
      size: 2 + Math.random() * 4,
    });
  }
}

function updateParticles(dt) {
  game.particles = game.particles.filter((p) => {
    p.life -= 0.03 * dt;
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

function triggerDeath(reason) {
  game.dead = true;
  deathSummary.textContent = `${reason} • Distance: ${Math.floor(game.distance)}m`;
  deathOverlay.classList.remove("hidden");
}

function doJump() {
  if (!game.player.onGround || game.dead) return;
  game.player.vy = -11.5 - game.fever * 2.8;
  game.player.onGround = false;
  emitParticles(game.player.x, game.player.y + 18, 8, 190, 8);
}

function doBoost() {
  if (!game.unlocks.boost || game.dead) return;
  game.speed = Math.min(12, game.speed + 1.8);
  emitParticles(game.player.x, game.player.y, 10, 290, 10);
}

function doExplosion() {
  if (!game.unlocks.explosion || game.dead) return;
  game.speed = Math.max(3.5, game.speed - 0.7);
  game.hp = Math.max(0, game.hp - 4);
  emitParticles(game.player.x, game.player.y, 24, 20, 14);
}

function doSplit() {
  if (!game.unlocks.split || game.dead) return;
  game.points += 1;
  pointsEl.textContent = game.points;
  game.fever = Math.max(0, game.fever - 0.2);
  emitParticles(game.player.x, game.player.y, 14, 130, 11);
}

function updatePlayer(dt, arenaRect) {
  game.worldX += game.speed * dt * 5;
  game.distance += game.speed * dt * 0.45;

  const ground = terrainHeight(game.worldX, arenaRect.height);
  game.player.vy += game.gravity * dt;
  game.player.y += game.player.vy * dt;

  if (game.player.y + game.player.radius >= ground) {
    const impact = Math.abs(game.player.vy);
    game.player.y = ground - game.player.radius;
    game.player.onGround = true;

    const feverBounce = game.fever * 0.5;
    const bouncePower = (game.player.bounciness + feverBounce) * impact;

    if (impact > 4.8) {
      game.player.vy = -Math.min(10, bouncePower);
      emitParticles(game.player.x, game.player.y + game.player.radius, 6, 170, 7);
      game.hp = Math.max(0, game.hp - Math.max(0, impact - 8));
    } else {
      game.player.vy = 0;
    }
  } else {
    game.player.onGround = false;
  }

  // fever grows with speed and hard landings
  game.fever = Math.min(1, game.fever + (game.speed / 260) * dt);
  if (game.player.onGround && Math.abs(game.player.vy) < 0.1) {
    game.fever = Math.max(0, game.fever - 0.003 * dt);
  }

  // auto-speed growth
  game.speed = Math.min(11.5, game.speed + 0.0016 * dt);

  // death conditions
  if (game.hp <= 0) triggerDeath("You took too much impact damage");
  if (game.player.y - game.player.radius > arenaRect.height + 60) triggerDeath("You fell off the track");

  const stretch = Math.min(Math.abs(game.player.vy) / 15 + game.speed / 22, 0.45);
  const sx = 1 + stretch;
  const sy = 1 - stretch * 0.6;
  const rot = game.speed * 20;

  playerEl.style.left = `${game.player.x - game.player.radius}px`;
  playerEl.style.top = `${game.player.y - game.player.radius}px`;
  playerEl.style.transform = `rotate(${rot}deg) scale(${sx}, ${sy})`;
}

function updateUi() {
  distanceEl.textContent = `${Math.floor(game.distance)}m`;
  speedEl.textContent = game.speed.toFixed(1);
  feverMeterEl.style.width = `${game.fever * 100}%`;
  hpMeterEl.style.width = `${game.hp}%`;

  const bgNear = document.getElementById("bgNear");
  const bgMid = document.getElementById("bgMid");
  const bgFar = document.getElementById("bgFar");
  bgNear.style.animationDuration = `${Math.max(0.2, 0.55 - game.speed * 0.022)}s`;
  bgMid.style.animationDuration = `${Math.max(0.45, 1.2 - game.speed * 0.05)}s`;
  bgFar.style.animationDuration = `${Math.max(1.2, 2.4 - game.speed * 0.09)}s`;

  if (game.fever > 0.78) {
    arena.style.filter = "saturate(1.26) contrast(1.08)";
  } else {
    arena.style.filter = "";
  }
}

function frame(now) {
  const dt = Math.min(1.05, (now - game.lastTime) / 16.6667);
  game.lastTime = now;

  if (!game.dead) {
    const bounds = arena.getBoundingClientRect();
    updatePlayer(dt, bounds);
    updateParticles(dt);
    updateUnlocks();
    updateUi();
  }

  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (key === " ") { event.preventDefault(); doJump(); }
  if (key === "shift") doBoost();
  if (key === "e") doExplosion();
  if (key === "q") doSplit();
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

restartBtn.addEventListener("click", () => window.location.reload());

// initial placement on terrain
const initialBounds = arena.getBoundingClientRect();
game.player.y = terrainHeight(0, initialBounds.height) - game.player.radius;
pointsEl.textContent = "0";
updateUnlocks();
updateUi();
requestAnimationFrame(frame);
