// game.js — versión con viento programado y rebote original 

const START_TEXT = '';
const baseLetters = [
  'a','b','c','d',
  'e','f','g','h',
  'i','j','k','l',
  'm','n', 'ñ','o',
  'p','q','r','s',
  't','u','v','x',
  'w','y','z'
];
let letters = [...baseLetters];

const nameDisplay = document.getElementById('nameDisplay');
const gameArea = document.getElementById('gameArea');
const bird = document.getElementById('bird');
const countdownDisplay = document.getElementById('countdown');

let nameStr = START_TEXT;
nameDisplay.textContent = nameStr;

// --- Cuenta regresiva y mezcla ---
let countdown = 10;
function startCountdown() {
  countdown = 10;
  countdownDisplay.textContent = `Reordenando en: ${countdown}`;
  setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      shuffleLetters();
      countdown = 10;
    }
    updateHUD();
  }, 1000);
}

// --- Variables de viento ---
let windCountdown = 20; // segundos hasta la próxima corriente
let windActive = false;
let windDuration = 0;
let windDir = 1; // 1 = derecha, -1 = izquierda
let windBoost = 0;

// --- Mezclar letras ---
function shuffleLetters() {
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  buildUI();
}
startCountdown();

// --- Construir interfaz ---
function buildUI() {
  gameArea.innerHTML = '';

  const topBar = document.createElement('div');
  topBar.className = 'top-bar';

  const deleteZone = document.createElement('div');
  deleteZone.className = 'button-zone delete';
  deleteZone.id = 'deleteZone';
  deleteZone.textContent = 'Borrar';

  const acceptZone = document.createElement('div');
  acceptZone.className = 'button-zone accept';
  acceptZone.id = 'acceptZone';
  acceptZone.textContent = 'Aceptar';

  topBar.appendChild(deleteZone);
  topBar.appendChild(acceptZone);
  gameArea.appendChild(topBar);

  const lettersContainer = document.createElement('div');
  lettersContainer.className = 'letters-container';
  letters.forEach(letter => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.letter = letter;
    tile.textContent = letter;
    lettersContainer.appendChild(tile);
  });
  gameArea.appendChild(lettersContainer);
  gameArea.appendChild(bird);
}
buildUI();

// --- Bird física ---
let px = 60, py = 100;
let vx = 120; // velocidad base
let vy = 0;
const gravity = 900;
const jumpImpulse = -340;
let lastTime = null;
const birdW = 36, birdH = 36;
let interactionCooldown = 0;

// --- HUD actualizado ---
function updateHUD() {
  countdownDisplay.textContent =
    `Reordenando en: ${countdown} | Viento en: ${windCountdown}s`;
}

// --- Corriente de aire ---
function triggerWind() {
  windActive = true;
  // Activar efecto visual de viento en las letras
  document.querySelectorAll('.tile').forEach(t => t.classList.add('windy'));

  windDuration = 3; // dura 3 segundos
  windBoost = 1.6; // multiplicador de velocidad
  windDir *= -1; // cambia de sentido del viento (y del movimiento)

  // invertir dirección actual
  vx = -Math.abs(vx) * Math.sign(windDir);

  // Efecto visual 
    const windLabel = document.createElement('div');
    windLabel.textContent = windDir === 1 ? ' → VIENTO → ' : ' ← VIENTO ← ';
    windLabel.style.position = 'fixed';
    windLabel.style.left = '40px';        // margen desde el borde izquierdo
    windLabel.style.top = '50%';          // centrado verticalmente
    windLabel.style.transform = 'translateY(-50%)';
    windLabel.style.fontSize = '1.6rem';
    windLabel.style.fontWeight = '700';
    windLabel.style.opacity = '0.9';
    windLabel.style.color = windDir === 1 ? '#66ccff' : '#ff6699';
    windLabel.style.pointerEvents = 'none';
    windLabel.style.transition = 'opacity 1s';
    windLabel.style.textShadow = '0 0 10px rgba(255,255,255,0.4)';
    document.body.appendChild(windLabel);
    setTimeout(() => (windLabel.style.opacity = '0'), 2000);
    setTimeout(() => windLabel.remove(), 3000);

}

// --- Temporizador global ---
setInterval(() => {
  countdown--;
  if (countdown <= 0) {
    shuffleLetters();
    countdown = 10;
  }

  windCountdown--;
  if (windCountdown <= 0) {
    triggerWind();
    windCountdown = 15;
  }

  updateHUD();
}, 1000);

function getBounds() {
  const rect = gameArea.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function setBirdPos() {
  bird.style.left = `${px}px`;
  bird.style.top = `${py}px`;
}

window.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    vy = jumpImpulse;
    e.preventDefault();
  }
});

// --- Colisiones ---
function handleCollisions() {
  const birdRect = bird.getBoundingClientRect();
  const tiles = Array.from(document.querySelectorAll('.tile, .button-zone'));

  tiles.forEach(tile => {
    const rect = tile.getBoundingClientRect();
    const isColliding =
      birdRect.left < rect.right &&
      birdRect.right > rect.left &&
      birdRect.top < rect.bottom &&
      birdRect.bottom > rect.top;

    if (isColliding) {
      tile.classList.add('hit');
      setTimeout(() => tile.classList.remove('hit'), 150);

      if (tile.classList.contains('tile')) {
        nameStr += tile.dataset.letter;
        nameDisplay.textContent = nameStr;
      } else if (tile.id === 'deleteZone') {
        nameStr = '';
        nameDisplay.textContent = nameStr;
      } else if (tile.id === 'acceptZone') {
        alert('Texto ingresado: ' + (nameStr || '(vacío)'));
      }

      interactionCooldown = 0.4;
    }
  });
}

// --- Loop principal ---
function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min(0.032, (ts - lastTime) / 1000);
  lastTime = ts;

  const b = getBounds();

  // --- Movimiento horizontal ---
  if (windActive) {
    windDuration -= dt;
    const decay = Math.max(0, windDuration / 3); // decae suavemente
    vx = 120 * windBoost * decay * windDir;
    if (windDuration <= 0) {
      windActive = false;
      vx = 120 * windDir;
      windBoost = 1;
      // Quitar efecto de viento de las letras
      document.querySelectorAll('.tile').forEach(t => t.classList.remove('windy'));
    }
  }

  px += vx * dt;

  // Rebote en muros
  if (px - birdW / 2 < 0) {
    px = birdW / 2;
    vx *= -1;
    windDir = Math.sign(vx);
  } else if (px + birdW / 2 > b.width) {
    px = b.width - birdW / 2;
    vx *= -1;
    windDir = Math.sign(vx);
  }

  // --- Movimiento vertical ---
  vy += gravity * dt;
  py += vy * dt;
  if (py - birdH / 2 < 0) { py = birdH / 2; vy = Math.max(0, vy); }
  if (py + birdH / 2 > b.height) { py = b.height - birdH / 2; vy = 0; }

  setBirdPos();

  // "scroll" interno
  const viewHeight = window.innerHeight;
  const targetY = Math.min(0, viewHeight / 2 - py);
  gameArea.style.transform = `translateY(${targetY}px)`;

  // detección inmediata
  if (interactionCooldown <= 0) handleCollisions();

  if (interactionCooldown > 0) {
    interactionCooldown -= dt;
    if (interactionCooldown < 0) interactionCooldown = 0;
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
  
