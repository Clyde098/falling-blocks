/* ============================================
   Falling Blocks — Core Game Engine
   Vanilla JS, Canvas, no dependencies.
   ============================================ */

(() => {
  'use strict';

  // ==========================================
  // CONSTANTS
  // ==========================================
  const COLS = 10;
  const ROWS = 20;
  const CELL = 30;                    // logical cell size for main canvas
  const NEXT_CELL = 24;               // cell size for preview canvases
  const HOLD_CELL = 24;
  const LOCK_DELAY = 500;             // ms
  const MAX_LOCK_RESETS = 15;
  const SOFT_DROP_INTERVAL = 50;      // ms
  const DAS = 160;                    // delayed auto shift (ms)
  const ARR = 40;                     // auto repeat rate (ms)

  // Piece definitions — SRS spawn orientations
  // Each piece is a 4x4 matrix (or 3x3 for I/O simplified) with rotation states
  const PIECES = {
    I: {
      color: 'var(--c-i)',
      cells: [
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // 0
        [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]], // R
        [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]], // 2
        [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]  // L
      ]
    },
    O: {
      color: 'var(--c-o)',
      cells: [
        [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
        [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
        [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
        [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]]
      ]
    },
    T: {
      color: 'var(--c-t)',
      cells: [
        [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]], // 0
        [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]], // R
        [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]], // 2
        [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]  // L
      ]
    },
    S: {
      color: 'var(--c-s)',
      cells: [
        [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
        [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
        [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]
      ]
    },
    Z: {
      color: 'var(--c-z)',
      cells: [
        [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
        [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
        [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
        [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]]
      ]
    },
    J: {
      color: 'var(--c-j)',
      cells: [
        [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
        [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
        [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
        [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]]
      ]
    },
    L: {
      color: 'var(--c-l)',
      cells: [
        [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
        [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
        [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]]
      ]
    }
  };

  const PIECE_TYPES = ['I','O','T','S','Z','J','L'];

  // SRS Wall Kick Data — JLSTZ
  const KICKS_JLSTZ = {
    '0>R': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    'R>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    'R>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    '2>R': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '2>L': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    'L>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    'L>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '0>L': [[0,0],[1,0],[1,1],[0,-2],[1,-2]]
  };

  // SRS Wall Kick Data — I piece
  const KICKS_I = {
    '0>R': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    'R>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    'R>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
    '2>R': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    '2>L': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    'L>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    'L>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    '0>L': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
  };

  const ROTATION_NAMES = ['0','R','2','L'];

  // Scoring table
  const SCORE_TABLE = {
    single: 100,
    double: 300,
    triple: 500,
    tetris: 800,
    tspin: 400,
    tspinSingle: 800,
    tspinDouble: 1200,
    tspinTriple: 1600
  };

  // ==========================================
  // GAME STATE
  // ==========================================
  const game = {
    board: [],            // 2D array of null or color string
    current: null,        // { type, rotation, x, y }
    hold: null,           // held piece type or null
    canHold: true,
    nextQueue: [],        // array of piece types
    bag: [],              // current 7-bag
    score: 0,
    level: 1,
    lines: 0,
    highScore: 0,
    combo: -1,
    backToBack: false,
    gameOver: false,
    paused: false,
    started: false,
    dropTimer: 0,
    dropInterval: 1000,
    lockTimer: 0,
    lockResets: 0,
    isLocking: false,
    softDropping: false,
    lastActionWasRotation: false,
    lastRotationKick: 0,
    particles: [],
    lineClearAnim: null,
    shake: { intensity: 0, duration: 0 },
    lastTime: 0,
    dasTimer: 0,
    arrTimer: 0,
    activeDirection: 0,
    soundEnabled: true,
    reducedMotion: false,
    ghostEnabled: true,
    colorblind: false,
    keyMap: {
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
      down: ['ArrowDown'],
      rotateCW: ['ArrowUp', 'X', 'E'],
      rotateCCW: ['Z', 'Q'],
      hardDrop: ['Space'],
      hold: ['C', 'Shift'],
      pause: ['P', 'Escape'],
      restart: ['R']
    }
  };

  // ==========================================
  // DOM REFERENCES
  // ==========================================
  const $ = (id) => document.getElementById(id);
  const menuScreen = $('menu-screen');
  const settingsScreen = $('settings-screen');
  const helpScreen = $('help-screen');
  const gameScreen = $('game-screen');
  const gameCanvas = $('game-canvas');
  const ctx = gameCanvas.getContext('2d');
  const holdCanvas = $('hold-canvas');
  const holdCtx = holdCanvas.getContext('2d');
  const nextCanvas = $('next-canvas');
  const nextCtx = nextCanvas.getContext('2d');
  const pauseOverlay = $('pause-overlay');
  const gameoverOverlay = $('gameover-overlay');
  const statScore = $('stat-score');
  const statLevel = $('stat-level');
  const statLines = $('stat-lines');
  const statHigh = $('stat-high');
  const menuHighScore = $('menu-high-score');
  const finalScore = $('final-score');
  const finalLines = $('final-lines');
  const finalLevel = $('final-level');
  const newHighEl = $('new-high');

  // ==========================================
  // AUDIO (Web Audio API — simple synth)
  // ==========================================
  let audioCtx = null;

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* audio not supported */ }
  }

  function playTone(freq, duration, type = 'square', gain = 0.05) {
    if (!game.soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* ignore audio errors */ }
  }

  const SFX = {
    move: () => playTone(200, 0.05, 'square', 0.03),
    rotate: () => playTone(350, 0.06, 'square', 0.04),
    drop: () => playTone(120, 0.1, 'sawtooth', 0.06),
    lineClear: () => {
      playTone(523, 0.1, 'square', 0.06);
      setTimeout(() => playTone(659, 0.1, 'square', 0.06), 60);
      setTimeout(() => playTone(784, 0.15, 'square', 0.07), 120);
    },
    tetris: () => {
      playTone(523, 0.08, 'square', 0.07);
      setTimeout(() => playTone(659, 0.08, 'square', 0.07), 50);
      setTimeout(() => playTone(784, 0.08, 'square', 0.07), 100);
      setTimeout(() => playTone(1047, 0.2, 'square', 0.08), 150);
    },
    hold: () => playTone(440, 0.08, 'triangle', 0.05),
    gameOver: () => {
      playTone(300, 0.2, 'sawtooth', 0.06);
      setTimeout(() => playTone(250, 0.2, 'sawtooth', 0.06), 200);
      setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.07), 400);
    },
    levelUp: () => {
      playTone(440, 0.1, 'square', 0.06);
      setTimeout(() => playTone(554, 0.1, 'square', 0.06), 80);
      setTimeout(() => playTone(659, 0.2, 'square', 0.07), 160);
    }
  };

  // ==========================================
  // BOARD UTILITIES
  // ==========================================
  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function isValidPosition(board, piece, x, y) {
    const cells = PIECES[piece.type].cells[piece.rotation];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!cells[r][c]) continue;
        const bx = x + c;
        const by = y + r;
        if (bx < 0 || bx >= COLS || by >= ROWS) return false;
        if (by >= 0 && board[by][bx]) return false;
      }
    }
    return true;
  }

  // ==========================================
  // 7-BAG RANDOMIZER
  // ==========================================
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function refillBag() {
    game.bag = shuffleArray(PIECE_TYPES);
  }

  function nextFromBag() {
    if (game.bag.length === 0) refillBag();
    return game.bag.pop();
  }

  function fillQueue() {
    while (game.nextQueue.length < 5) {
      game.nextQueue.push(nextFromBag());
    }
  }

  // ==========================================
  // PIECE SPAWN
  // ==========================================
  function spawnPiece(type) {
    const piece = {
      type: type || game.nextQueue.shift(),
      rotation: 0,
      x: Math.floor((COLS - 4) / 2),
      y: -1
    };
    fillQueue();

    // If spawn position is invalid, try moving up (for pieces spawning above board)
    if (!isValidPosition(game.board, piece, piece.x, piece.y)) {
      piece.y = -2;
      if (!isValidPosition(game.board, piece, piece.x, piece.y)) {
        // Game over
        triggerGameOver();
        return null;
      }
    }

    game.current = piece;
    game.canHold = true;
    game.lockTimer = 0;
    game.lockResets = 0;
    game.isLocking = false;
    game.lastActionWasRotation = false;
    return piece;
  }

  // ==========================================
  // ROTATION WITH SRS WALL KICKS
  // ==========================================
  function rotatePiece(direction) {
    if (!game.current || game.paused || game.gameOver) return false;

    const piece = game.current;
    const fromRot = piece.rotation;
    const toRot = (fromRot + (direction === 'cw' ? 1 : 3)) % 4;

    // O piece doesn't rotate
    if (piece.type === 'O') return false;

    const kickTable = piece.type === 'I' ? KICKS_I : KICKS_JLSTZ;
    const key = `${ROTATION_NAMES[fromRot]}>${ROTATION_NAMES[toRot]}`;
    const kicks = kickTable[key] || [[0, 0]];

    const testPiece = { ...piece, rotation: toRot };

    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      const newX = piece.x + dx;
      const newY = piece.y + dy;
      if (isValidPosition(game.board, testPiece, newX, newY)) {
        piece.rotation = toRot;
        piece.x = newX;
        piece.y = newY;
        game.lastActionWasRotation = true;
        game.lastRotationKick = i;
        game.lockResets = 0; // successful rotation resets lock
        game.isLocking = false;
        game.lockTimer = 0;
        SFX.rotate();
        return true;
      }
    }
    return false;
  }

  // ==========================================
  // MOVEMENT
  // ==========================================
  function movePiece(dx, dy) {
    if (!game.current || game.paused || game.gameOver) return false;
    const piece = game.current;
    if (isValidPosition(game.board, piece, piece.x + dx, piece.y + dy)) {
      piece.x += dx;
      piece.y += dy;
      if (dx !== 0) {
        game.lastActionWasRotation = false;
        game.lockResets = 0;
        game.isLocking = false;
        game.lockTimer = 0;
      }
      return true;
    }
    return false;
  }

  function softDrop() {
    if (!game.current || game.paused || game.gameOver) return;
    if (movePiece(0, 1)) {
      game.score += 1;
      updateUI();
      game.isLocking = false;
      game.lockTimer = 0;
    } else {
      startLock();
    }
  }

  function hardDrop() {
    if (!game.current || game.paused || game.gameOver) return;
    const piece = game.current;
    let dropped = 0;
    while (isValidPosition(game.board, piece, piece.x, piece.y + 1)) {
      piece.y++;
      dropped++;
    }
    game.score += dropped * 2;
    SFX.drop();
    addShake(4, 150);
    lockPiece();
  }

  // ==========================================
  // LOCKING
  // ==========================================
  function startLock() {
    if (game.isLocking) return;
    game.isLocking = true;
    game.lockTimer = 0;
  }

  function lockPiece() {
    const piece = game.current;
    if (!piece) return;

    // Place cells on board
    const cells = PIECES[piece.type].cells[piece.rotation];
    let highestRow = ROWS;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!cells[r][c]) continue;
        const by = piece.y + r;
        const bx = piece.x + c;
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
          game.board[by][bx] = piece.type;
          if (by < highestRow) highestRow = by;
        }
      }
    }

    // Check for game over (piece locked above visible board)
    if (piece.y < 0) {
      triggerGameOver();
      return;
    }

    // T-spin detection
    const isTSpin = detectTSpin(piece);

    // Clear lines
    const cleared = clearLines();

    // Scoring
    scoreLines(cleared, isTSpin);

    // Spawn next piece
    game.current = null;
    spawnPiece();

    updateUI();
  }

  function detectTSpin(piece) {
    if (piece.type !== 'T' || !game.lastActionWasRotation) return false;
    // Check 4 corners around T center
    const cx = piece.x + 1;
    const cy = piece.y + 1;
    const corners = [
      [cx - 1, cy - 1], [cx + 1, cy - 1],
      [cx - 1, cy + 1], [cx + 1, cy + 1]
    ];
    let filled = 0;
    for (const [x, y] of corners) {
      if (x < 0 || x >= COLS || y >= ROWS) { filled++; continue; }
      if (y >= 0 && game.board[y][x]) filled++;
    }
    return filled >= 3;
  }

  // ==========================================
  // LINE CLEARING
  // ==========================================
  function clearLines() {
    const fullRows = [];
    for (let r = 0; r < ROWS; r++) {
      if (game.board[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }
    if (fullRows.length === 0) return 0;

    // Animation data
    game.lineClearAnim = {
      rows: [...fullRows],
      timer: 0,
      duration: game.reducedMotion ? 0 : 200
    };

    // Remove rows (defer actual removal until animation completes if not reduced motion)
    const delay = game.reducedMotion ? 0 : 200;
    setTimeout(() => {
      for (const r of fullRows) {
        game.board.splice(r, 1);
        game.board.unshift(Array(COLS).fill(null));
      }
      game.lineClearAnim = null;
      // Spawn particles
      if (!game.reducedMotion) {
        for (const r of fullRows) {
          spawnLineParticles(r);
        }
      }
      updateUI();
    }, delay);

    return fullRows.length;
  }

  function scoreLines(cleared, isTSpin) {
    if (cleared === 0 && !isTSpin) {
      game.combo = -1;
      return;
    }

    let baseScore = 0;
    let isDifficult = false;

    if (isTSpin) {
      isDifficult = true;
      switch (cleared) {
        case 0: baseScore = SCORE_TABLE.tspin; break;
        case 1: baseScore = SCORE_TABLE.tspinSingle; break;
        case 2: baseScore = SCORE_TABLE.tspinDouble; break;
        case 3: baseScore = SCORE_TABLE.tspinTriple; break;
      }
    } else {
      switch (cleared) {
        case 1: baseScore = SCORE_TABLE.single; break;
        case 2: baseScore = SCORE_TABLE.double; break;
        case 3: baseScore = SCORE_TABLE.triple; break;
        case 4: baseScore = SCORE_TABLE.tetris; isDifficult = true; break;
      }
    }

    // Combo
    if (cleared > 0) {
      game.combo++;
      if (game.combo > 0) {
        baseScore += 50 * game.combo * game.level;
      }
    }

    // Back-to-back
    if (isDifficult && game.backToBack) {
      baseScore = Math.floor(baseScore * 1.5);
    }
    if (cleared > 0) {
      game.backToBack = isDifficult;
    }

    game.score += baseScore * game.level;

    if (cleared > 0) {
      game.lines += cleared;
      // Level up every 10 lines
      const newLevel = Math.floor(game.lines / 10) + 1;
      if (newLevel > game.level) {
        game.level = newLevel;
        game.dropInterval = Math.max(50, 1000 - (game.level - 1) * 80);
        SFX.levelUp();
      }

      if (cleared === 4) SFX.tetris();
      else SFX.lineClear();

      if (!game.reducedMotion) {
        addShake(cleared * 2, 150 + cleared * 30);
      }
    }

    // Update high score
    if (game.score > game.highScore) {
      game.highScore = game.score;
      localStorage.setItem('fallingBlocksHighScore', game.highScore);
    }
  }

  // ==========================================
  // PARTICLES
  // ==========================================
  function spawnLineParticles(row) {
    for (let c = 0; c < COLS; c++) {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue(`--c-${(game.board[row]?.[c] || 'i').toLowerCase()}`) || '#00f0ff';
      for (let i = 0; i < 3; i++) {
        game.particles.push({
          x: c * CELL + CELL / 2,
          y: row * CELL + CELL / 2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 1) * 5,
          life: 1,
          decay: 0.02 + Math.random() * 0.02,
          size: 2 + Math.random() * 4,
          color: color.trim()
        });
      }
    }
  }

  function updateParticles(dt) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i];
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      p.vy += 0.15 * dt * 0.06;
      p.life -= p.decay * dt * 0.06;
      if (p.life <= 0) game.particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of game.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ==========================================
  // SCREEN SHAKE
  // ==========================================
  function addShake(intensity, duration) {
    if (game.reducedMotion) return;
    game.shake.intensity = Math.max(game.shake.intensity, intensity);
    game.shake.duration = Math.max(game.shake.duration, duration);
  }

  function applyShake() {
    if (game.shake.duration <= 0) return { x: 0, y: 0 };
    const s = game.shake.intensity * (game.shake.duration / 300);
    return {
      x: (Math.random() - 0.5) * s * 2,
      y: (Math.random() - 0.5) * s * 2
    };
  }

  // ==========================================
  // GHOST PIECE
  // ==========================================
  function getGhostY() {
    if (!game.current || !game.ghostEnabled) return game.current ? game.current.y : 0;
    const piece = game.current;
    let ghostY = piece.y;
    while (isValidPosition(game.board, piece, piece.x, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  // ==========================================
  // RENDERING
  // ==========================================
  function drawCell(context, x, y, size, color, alpha = 1, border = true) {
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.fillRect(x + 1, y + 1, size - 2, size - 2);
    if (border) {
      context.strokeStyle = 'rgba(255,255,255,0.15)';
      context.lineWidth = 1;
      context.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }
    context.globalAlpha = 1;
  }

  function getPieceColor(type) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--c-${type.toLowerCase()}`).trim() || '#ffffff';
  }

  function render() {
    const shakeOffset = applyShake();
    const sx = shakeOffset.x;
    const sy = shakeOffset.y;

    ctx.save();
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctx.translate(sx, sy);

    // Draw grid background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(-10, -10, gameCanvas.width + 20, gameCanvas.height + 20);

    // Grid lines
    ctx.strokeStyle = 'rgba(42, 42, 90, 0.4)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(COLS * CELL, r * CELL);
      ctx.stroke();
    }

    // Draw locked cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (game.board[r][c]) {
          drawCell(ctx, c * CELL, r * CELL, CELL, getPieceColor(game.board[r][c]));
        }
      }
    }

    // Draw line clear animation (flash)
    if (game.lineClearAnim) {
      const progress = game.lineClearAnim.timer / game.lineClearAnim.duration;
      const alpha = Math.sin(progress * Math.PI) * 0.8;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      for (const r of game.lineClearAnim.rows) {
        ctx.fillRect(0, r * CELL, COLS * CELL, CELL);
      }
    }

    // Draw ghost piece
    if (game.current && game.ghostEnabled && !game.gameOver) {
      const ghostY = getGhostY();
      const cells = PIECES[game.current.type].cells[game.current.rotation];
      const color = getPieceColor(game.current.type);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!cells[r][c]) continue;
          const bx = (game.current.x + c) * CELL;
          const by = (ghostY + r) * CELL;
          if (ghostY + r >= 0) {
            drawCell(ctx, bx, by, CELL, color, 0.18, false);
          }
        }
      }
    }

    // Draw current piece
    if (game.current && !game.gameOver) {
      const cells = PIECES[game.current.type].cells[game.current.rotation];
      const color = getPieceColor(game.current.type);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!cells[r][c]) continue;
          const bx = (game.current.x + c) * CELL;
          const by = (game.current.y + r) * CELL;
          if (game.current.y + r >= 0) {
            drawCell(ctx, bx, by, CELL, color);
          }
        }
      }
    }

    // Draw particles
    drawParticles();

    ctx.restore();
  }

  function renderHold() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (!game.hold) return;
    const cells = PIECES[game.hold].cells[0];
    const color = getPieceColor(game.hold);
    const offsetX = (holdCanvas.width - 4 * HOLD_CELL) / 2;
    const offsetY = (holdCanvas.height - 4 * HOLD_CELL) / 2;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!cells[r][c]) continue;
        drawCell(holdCtx, offsetX + c * HOLD_CELL, offsetY + r * HOLD_CELL, HOLD_CELL, color);
      }
    }
  }

  function renderNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const previewCount = Math.min(3, game.nextQueue.length);
    for (let i = 0; i < previewCount; i++) {
      const type = game.nextQueue[i];
      if (!type) continue;
      const cells = PIECES[type].cells[0];
      const color = getPieceColor(type);
      const offsetX = (nextCanvas.width - 4 * NEXT_CELL) / 2;
      const offsetY = i * (4 * NEXT_CELL) + 10;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!cells[r][c]) continue;
          drawCell(nextCtx, offsetX + c * NEXT_CELL, offsetY + r * NEXT_CELL, NEXT_CELL, color);
        }
      }
    }
  }

  // ==========================================
  // HOLD
  // ==========================================
  function holdPiece() {
    if (!game.current || !game.canHold || game.paused || game.gameOver) return;
    const currentType = game.current.type;

    if (game.hold) {
      const heldType = game.hold;
      game.hold = currentType;
      game.current = null;
      spawnPiece(heldType);
    } else {
      game.hold = currentType;
      game.current = null;
      spawnPiece();
    }

    game.canHold = false;
    SFX.hold();
    renderHold();
    updateUI();
  }

  // ==========================================
  // GAME LOOP
  // ==========================================
  function gameLoop(timestamp) {
    if (!game.started) return;

    const dt = timestamp - game.lastTime;
    game.lastTime = timestamp;

    if (!game.paused && !game.gameOver) {
      // Drop timer
      game.dropTimer += dt;
      if (game.dropTimer >= game.dropInterval) {
        game.dropTimer = 0;
        if (game.current) {
          if (!movePiece(0, 1)) {
            startLock();
          } else {
            game.isLocking = false;
            game.lockTimer = 0;
          }
        }
      }

      // Lock delay
      if (game.isLocking && game.current) {
        game.lockTimer += dt;
        if (game.lockTimer >= LOCK_DELAY) {
          lockPiece();
          game.isLocking = false;
          game.lockTimer = 0;
        }
      }

      // DAS/ARR handling
      if (game.activeDirection !== 0) {
        game.dasTimer += dt;
        if (game.dasTimer >= DAS) {
          game.arrTimer += dt;
          if (game.arrTimer >= ARR) {
            game.arrTimer = 0;
            movePiece(game.activeDirection, 0);
          }
        }
      }

      // Line clear animation timer
      if (game.lineClearAnim) {
        game.lineClearAnim.timer += dt;
      }

      // Particles
      updateParticles(dt);

      // Screen shake
      if (game.shake.duration > 0) {
        game.shake.duration -= dt;
        if (game.shake.duration <= 0) {
          game.shake.intensity = 0;
        }
      }
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // UI UPDATES
  // ==========================================
  function updateUI() {
    statScore.textContent = game.score.toLocaleString();
    statLevel.textContent = game.level;
    statLines.textContent = game.lines;
    statHigh.textContent = game.highScore.toLocaleString();
    renderNext();
    renderHold();
  }

  // ==========================================
  // GAME STATE TRANSITIONS
  // ==========================================
  function startGame() {
    game.board = createBoard();
    game.current = null;
    game.hold = null;
    game.canHold = true;
    game.nextQueue = [];
    game.bag = [];
    game.score = 0;
    game.level = 1;
    game.lines = 0;
    game.combo = -1;
    game.backToBack = false;
    game.gameOver = false;
    game.paused = false;
    game.started = true;
    game.dropTimer = 0;
    game.dropInterval = 1000;
    game.lockTimer = 0;
    game.lockResets = 0;
    game.isLocking = false;
    game.particles = [];
    game.lineClearAnim = null;
    game.shake = { intensity: 0, duration: 0 };
    game.activeDirection = 0;

    refillBag();
    fillQueue();
    spawnPiece();

    pauseOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');

    updateUI();
    showScreen('game');

    if (!audioCtx) initAudio();
    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  function triggerGameOver() {
    game.gameOver = true;
    game.started = false;
    SFX.gameOver();

    const isNewHigh = game.score >= game.highScore && game.score > 0;
    if (isNewHigh) {
      localStorage.setItem('fallingBlocksHighScore', game.score);
    }

    finalScore.textContent = game.score.toLocaleString();
    finalLines.textContent = game.lines;
    finalLevel.textContent = game.level;
    newHighEl.classList.toggle('hidden', !isNewHigh);

    gameoverOverlay.classList.remove('hidden');
    menuHighScore.textContent = game.highScore.toLocaleString();
  }

  function togglePause() {
    if (!game.started || game.gameOver) return;
    game.paused = !game.paused;
    pauseOverlay.classList.toggle('hidden', !game.paused);
  }

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (name === 'menu') menuScreen.classList.add('active');
    else if (name === 'settings') settingsScreen.classList.add('active');
    else if (name === 'help') helpScreen.classList.add('active');
    else if (name === 'game') gameScreen.classList.add('active');
  }

  // ==========================================
  // INPUT HANDLING
  // ==========================================
  function handleKeyDown(e) {
    const key = e.key;
    const km = game.keyMap;

    if (km.left.includes(key)) {
      e.preventDefault();
      if (!game.paused && !game.gameOver) {
        game.activeDirection = -1;
        game.dasTimer = 0;
        game.arrTimer = 0;
        movePiece(-1, 0);
        SFX.move();
      }
      return;
    }
    if (km.right.includes(key)) {
      e.preventDefault();
      if (!game.paused && !game.gameOver) {
        game.activeDirection = 1;
        game.dasTimer = 0;
        game.arrTimer = 0;
        movePiece(1, 0);
        SFX.move();
      }
      return;
    }
    if (km.down.includes(key)) {
      e.preventDefault();
      if (!game.paused && !game.gameOver) {
        softDrop();
        game.softDropping = true;
      }
      return;
    }
    if (km.rotateCW.includes(key)) {
      e.preventDefault();
      if (!game.paused && !game.gameOver) rotatePiece('cw');
      return;
    }
    if (km.rotateCCW.includes(key)) {
      e.preventDefault();
      if (!game.paused && !game.gameOver) rotatePiece('ccw');
      return;
    }
    if (km.hardDrop.includes(key)) {
      e.preventDefault();
      if (!game.paused && !game.gameOver) hardDrop();
      return;
    }
    if (km.hold.includes(key)) {
      e.preventDefault();
      if (!game.paused && !game.gameOver) holdPiece();
      return;
    }
    if (km.pause.includes(key)) {
      e.preventDefault();
      togglePause();
      return;
    }
    if (km.restart.includes(key)) {
      e.preventDefault();
      if (game.started) startGame();
      return;
    }
  }

  function handleKeyUp(e) {
    const key = e.key;
    const km = game.keyMap;
    if (km.left.includes(key) && game.activeDirection === -1) {
      game.activeDirection = 0;
    }
    if (km.right.includes(key) && game.activeDirection === 1) {
      game.activeDirection = 0;
    }
    if (km.down.includes(key)) {
      game.softDropping = false;
    }
  }

  // Touch controls
  function setupTouchControls() {
    document.querySelectorAll('.touch-btn').forEach(btn => {
      const action = btn.dataset.action;
      let intervalId = null;

      const startAction = (e) => {
        e.preventDefault();
        if (game.paused || game.gameOver) return;
        switch (action) {
          case 'left': movePiece(-1, 0); break;
          case 'right': movePiece(1, 0); break;
          case 'soft-drop': softDrop(); break;
          case 'hard-drop': hardDrop(); break;
          case 'rotate-cw': rotatePiece('cw'); break;
          case 'rotate-ccw': rotatePiece('ccw'); break;
          case 'hold': holdPiece(); break;
        }
      };

      const endAction = (e) => {
        e.preventDefault();
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
      };

      btn.addEventListener('touchstart', startAction, { passive: false });
      btn.addEventListener('touchend', endAction);
      btn.addEventListener('mousedown', startAction);
      btn.addEventListener('mouseup', endAction);
      btn.addEventListener('mouseleave', endAction);
    });
  }

  // Swipe gestures on canvas
  function setupSwipe() {
    let startX = 0, startY = 0, startTime = 0;
    gameCanvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; startTime = Date.now();
    }, { passive: true });

    gameCanvas.addEventListener('touchend', (e) => {
      if (game.paused || game.gameOver) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startTime;
      const absDx = Math.abs(dx), absDy = Math.abs(dy);
      const threshold = 30;

      if (absDx < threshold && absDy < threshold && dt < 250) {
        // Tap = rotate
        rotatePiece('cw');
      } else if (absDx > absDy && absDx > threshold) {
        // Horizontal swipe
        const moves = Math.floor(absDx / 40);
        const dir = dx > 0 ? 1 : -1;
        for (let i = 0; i < moves; i++) movePiece(dir, 0);
      } else if (absDy > absDx && absDy > threshold) {
        if (dy > 60) {
          hardDrop();
        } else if (dy > 0) {
          softDrop();
        }
      }
    }, { passive: true });
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  function loadSettings() {
    game.soundEnabled = localStorage.getItem('fb_sound') !== 'false';
    game.reducedMotion = localStorage.getItem('fb_motion') === 'true';
    game.colorblind = localStorage.getItem('fb_colorblind') === 'true';
    game.ghostEnabled = localStorage.getItem('fb_ghost') !== 'false';
    game.highScore = parseInt(localStorage.getItem('fallingBlocksHighScore') || '0', 10);

    $('setting-sound').checked = game.soundEnabled;
    $('setting-motion').checked = game.reducedMotion;
    $('setting-colorblind').checked = game.colorblind;
    $('setting-ghost').checked = game.ghostEnabled;

    document.body.classList.toggle('reduced-motion', game.reducedMotion);
    document.body.classList.toggle('colorblind', game.colorblind);
    menuHighScore.textContent = game.highScore.toLocaleString();
  }

  function saveSettings() {
    localStorage.setItem('fb_sound', game.soundEnabled);
    localStorage.setItem('fb_motion', game.reducedMotion);
    localStorage.setItem('fb_colorblind', game.colorblind);
    localStorage.setItem('fb_ghost', game.ghostEnabled);
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  function bindEvents() {
    // Menu
    $('btn-play').addEventListener('click', () => { initAudio(); startGame(); });
    $('btn-settings').addEventListener('click', () => showScreen('settings'));
    $('btn-help').addEventListener('click', () => showScreen('help'));

    // Settings
    $('btn-settings-back').addEventListener('click', () => {
      game.soundEnabled = $('setting-sound').checked;
      game.reducedMotion = $('setting-motion').checked;
      game.colorblind = $('setting-colorblind').checked;
      game.ghostEnabled = $('setting-ghost').checked;
      document.body.classList.toggle('reduced-motion', game.reducedMotion);
      document.body.classList.toggle('colorblind', game.colorblind);
      saveSettings();
      showScreen('menu');
    });

    $('btn-remap').addEventListener('click', () => {
      alert('Key remapping: Press keys when prompted.\n(Simplified: edit KEY_MAP in script.js for full custom mapping.)');
    });

    // Help
    $('btn-help-back').addEventListener('click', () => showScreen('menu'));

    // Pause
    $('btn-resume').addEventListener('click', togglePause);
    $('btn-restart-pause').addEventListener('click', startGame);
    $('btn-quit').addEventListener('click', () => {
      game.started = false;
      game.paused = false;
      pauseOverlay.classList.add('hidden');
      showScreen('menu');
    });

    // Game over
    $('btn-restart-gameover').addEventListener('click', startGame);
    $('btn-menu-gameover').addEventListener('click', () => showScreen('menu'));

    // Keyboard
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Touch controls
    setupTouchControls();
    setupSwipe();

    // Prevent context menu on canvas
    gameCanvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  // ==========================================
  // SERVICE WORKER REGISTRATION
  // ==========================================
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {
        // Service worker failed — offline won't work, but game still functions
      });
    }
  }

  // ==========================================
  // INIT
  // ==========================================
  function init() {
    loadSettings();
    bindEvents();
    showScreen('menu');
    registerServiceWorker();

    // Detect touch device and show mobile controls
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      $('mobile-controls').classList.remove('hidden');
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();