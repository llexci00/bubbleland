/* ============================================================
   아케이드 (컴퓨터 앱) — window.Arcade
   게임 목록 → 선택하면 캔버스에서 플레이. 현재: 🐍 스네이크
   (목록은 GAMES 배열에 추가만 하면 확장됨)
   ============================================================ */
(function () {
  "use strict";
  let listEl, gameEl, canvas, ctx, scoreEl, bestEl, overEl, overScoreEl;
  let raf = null, keyHandler = null, curGame = null;

  const GAMES = [
    { id: "snake", name: "스네이크", emoji: "🐍", desc: "물고기를 먹고 자라요", start: startSnake },
  ];

  // ============================================================
  //  공통
  // ============================================================
  function bestKey(id) { const a = window.App.state.arcade || (window.App.state.arcade = {}); return a; }
  function getBest(id) { const a = bestKey(); return a[id] || 0; }
  function setBest(id, v) { const a = bestKey(); if (v > (a[id] || 0)) { a[id] = v; window.App.save(); } }

  function stopGame() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (keyHandler) { document.removeEventListener("keydown", keyHandler); keyHandler = null; }
    curGame = null;
  }
  function showList() {
    stopGame();
    gameEl.classList.add("hidden"); listEl.classList.remove("hidden");
    overEl.classList.add("hidden");
  }
  function buildList() {
    listEl.innerHTML = "";
    for (const g of GAMES) {
      const b = document.createElement("button"); b.className = "arcade-card";
      b.innerHTML = `<span class="ac-emoji">${g.emoji}</span><span class="ac-name">${g.name}</span><span class="ac-desc">${g.desc}</span><span class="ac-best">최고 ${getBest(g.id)}</span>`;
      b.addEventListener("click", () => { window.Audio2.ensure(); window.Audio2.click(); launch(g); });
      listEl.appendChild(b);
    }
  }
  function launch(g) {
    listEl.classList.add("hidden"); gameEl.classList.remove("hidden"); overEl.classList.add("hidden");
    bestEl.textContent = getBest(g.id); scoreEl.textContent = "0";
    curGame = g; g.start();
  }

  // ============================================================
  //  🐍 스네이크
  // ============================================================
  function startSnake() {
    const N = 15, CELL = 240 / N;            // 15x15 그리드, 셀 16px
    let snake, dir, nextDir, food, score, tickMs, acc, lastTs, dead;

    function reset() {
      snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
      dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
      score = 0; tickMs = 190; acc = 0; lastTs = 0; dead = false;
      placeFood(); scoreEl.textContent = "0"; overEl.classList.add("hidden");
    }
    function placeFood() {
      let p; do { p = { x: (Math.random() * N) | 0, y: (Math.random() * N) | 0 }; } while (snake.some((s) => s.x === p.x && s.y === p.y));
      food = p;
    }
    function setDir(dx, dy) { if (dx === -dir.x && dy === -dir.y) return; nextDir = { x: dx, y: dy }; }

    keyHandler = (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") setDir(0, -1);
      else if (k === "arrowdown" || k === "s") setDir(0, 1);
      else if (k === "arrowleft" || k === "a") setDir(-1, 0);
      else if (k === "arrowright" || k === "d") setDir(1, 0);
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", keyHandler);
    Arcade._setDir = setDir;   // 화면 버튼(dpad)용

    function step() {
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= N || head.y < 0 || head.y >= N || snake.some((s) => s.x === head.x && s.y === head.y)) {
        gameOver(); return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++; scoreEl.textContent = score; window.Audio2.blip(760 + score * 6);
        tickMs = Math.max(80, tickMs - 4); placeFood();
      } else snake.pop();
    }
    function gameOver() {
      dead = true; window.Audio2.blip(200); setTimeout(() => window.Audio2.blip(150), 110);
      setBest("snake", score); bestEl.textContent = getBest("snake");
      overScoreEl.textContent = `점수 ${score}` + (score >= getBest("snake") ? " · 최고 기록! 🏆" : "");
      overEl.classList.remove("hidden");
    }

    function draw() {
      // 배경 격자
      ctx.fillStyle = "#0d2a3a"; ctx.fillRect(0, 0, 240, 240);
      for (let i = 0; i <= N; i++) { ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(i * CELL, 0, 1, 240); ctx.fillRect(0, i * CELL, 240, 1); }
      // 먹이 (물고기)
      drawFish(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.42);
      // 뱀
      for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i], px = s.x * CELL, py = s.y * CELL;
        const head = i === 0;
        ctx.fillStyle = head ? "#7ee0a0" : (i % 2 ? "#4bb884" : "#57c992");
        rr(px + 1, py + 1, CELL - 2, CELL - 2, 4);
        if (head) {
          ctx.fillStyle = "#0d2a3a";
          const ex = px + CELL / 2 + dir.x * 3, ey = py + CELL / 2 + dir.y * 3;
          ctx.fillRect(ex - 3, ey - 3, 2, 2); ctx.fillRect(ex + 1, ey - 3 + (dir.x ? 0 : 0), 2, 2);
        }
      }
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); }
    function drawFish(cx, cy, s) {
      ctx.fillStyle = "#ff8a3d"; ctx.beginPath(); ctx.ellipse(cx, cy, s, s * 0.66, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - s * 0.8, cy); ctx.lineTo(cx - s * 1.5, cy - s * 0.6); ctx.lineTo(cx - s * 1.5, cy + s * 0.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillRect(cx + s * 0.3, cy - s * 0.25, 2, 2);
    }

    function loop(ts) {
      if (!curGame) return;
      if (!lastTs) lastTs = ts;
      if (!dead) { acc += ts - lastTs; while (acc >= tickMs) { acc -= tickMs; step(); if (dead) break; } }
      lastTs = ts; draw();
      raf = requestAnimationFrame(loop);
    }
    reset(); draw(); raf = requestAnimationFrame(loop);   // 즉시 첫 프레임
    Arcade._retry = function () { reset(); draw(); };
  }

  // ============================================================
  //  공개 API
  // ============================================================
  const Arcade = {
    init() {
      listEl = document.getElementById("arcade-list");
      gameEl = document.getElementById("arcade-game");
      canvas = document.getElementById("arcade-canvas"); ctx = canvas.getContext("2d"); ctx.imageSmoothingEnabled = false;
      scoreEl = document.getElementById("arcade-score");
      bestEl = document.getElementById("arcade-best");
      overEl = document.getElementById("arcade-over");
      overScoreEl = document.getElementById("arcade-over-score");
      document.getElementById("arcade-back").addEventListener("click", () => { window.Audio2.click(); showList(); buildList(); });
      document.getElementById("arcade-retry").addEventListener("click", () => { window.Audio2.click(); if (Arcade._retry) Arcade._retry(); });
      document.querySelectorAll("#win-arcade .dp-btn").forEach((b) => b.addEventListener("click", () => {
        const d = b.dataset.dir; const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        if (Arcade._setDir && map[d]) { Arcade._setDir(map[d][0], map[d][1]); window.Audio2.click(); }
      }));
    },
    open() { buildList(); showList(); },
    close() { stopGame(); },
  };
  window.Arcade = Arcade;
})();
