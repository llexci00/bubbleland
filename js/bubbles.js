/* ============================================================
   어항 속 할일 화면 — window.Bubbles
   · 픽셀 유리 어항 배경(자갈/수초/집/보물상자/뒷유리 반사/물결빛)
   · 완료할 때마다 물고기 추가, 개수 달성 시 특별 생물/장식 해금
   · 방울: 느긋한 배회 · 부드러운 충돌 · 배경 클릭 파동
   ============================================================ */
(function () {
  "use strict";

  let layer, fishCv, fctx, ripCv, rctx;
  let bubbles = [], fishBg = [], ripples = [], airBub = [];
  let running = false, t = 0;
  let AQW = 300, AQH = 170;

  let modal, modalTitle, taskInput, impRow, doneCountEl;
  let editingId = null, pendingImp = 3;

  const IMP = {
    1: { r: 42,  tint: "rgba(150, 220, 255, 0.55)" },
    2: { r: 56,  tint: "rgba(140, 235, 180, 0.55)" },
    3: { r: 72,  tint: "rgba(255, 235, 140, 0.55)" },
    4: { r: 90,  tint: "rgba(255, 190, 120, 0.58)" },
    5: { r: 112, tint: "rgba(255, 140, 150, 0.60)" },
  };
  const MAX_SPEED = 0.95;
  const fontScale = () => ({ s: 0.85, m: 1, l: 1.2 }[window.App.state.settings.font] || 1);

  // ============================================================
  //  방울
  // ============================================================
  function makeBubble(data, anim) {
    const spec = IMP[data.imp] || IMP[3];
    const el = document.createElement("div");
    el.className = "bubble";
    el.style.setProperty("--tint", spec.tint);
    el.style.width = el.style.height = spec.r * 2 + "px";
    el.style.fontSize = Math.max(11, Math.round(spec.r * 0.28 * fontScale())) + "px";
    el.style.transform = `translate(${data.x - spec.r}px, ${data.y - spec.r}px)`; // 즉시 제자리
    const txt = document.createElement("span");
    txt.className = "txt"; txt.textContent = data.text;
    el.appendChild(txt);
    layer.appendChild(el);
    // 은은하게 페이드인 (transform 은 건드리지 않음 → 구석 튐 방지)
    if (anim) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: "ease-out" });

    const b = { id: data.id, text: data.text, imp: data.imp, r: spec.r,
      x: data.x, y: data.y, vx: data.vx, vy: data.vy, wob: Math.random() * 6.28, el, txt, popped: false };
    el.addEventListener("click", (e) => { e.stopPropagation(); popBubble(b); });
    el.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); openModal(b); });
    bubbles.push(b);
    return b;
  }

  function spawnBubble(text, imp) {
    const spec = IMP[imp] || IMP[3], r = spec.r;
    const x = r + 20 + Math.random() * (innerWidth - r * 2 - 40);
    const y = r + 70 + Math.random() * (innerHeight - r * 2 - 140);
    const a = Math.random() * 6.28, sp = 0.3 + Math.random() * 0.4;
    window.Audio2.ensure(); window.Audio2.spawn();
    return makeBubble({ id: window.App.nextId(), text, imp, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp }, true);
  }

  function popBubble(b) {
    if (b.popped) return;
    b.popped = true;
    window.Audio2.ensure(); window.Audio2.pop();
    splash(b);
    // 제자리에서 터지도록 현재 위치(translate)를 유지한 채 스케일/페이드
    const px = b.x - b.r, py = b.y - b.r;
    b.el.style.pointerEvents = "none";
    b.el.animate([
      { transform: `translate(${px}px,${py}px) scale(1)`, opacity: 1 },
      { transform: `translate(${px}px,${py}px) scale(1.25)`, opacity: 0.9, offset: 0.4 },
      { transform: `translate(${px}px,${py}px) scale(1.7)`, opacity: 0 },
    ], { duration: 420, easing: "ease-out", fill: "forwards" });
    if (window.App.state.doneStamp !== window.App.todayStr()) { window.App.state.doneStamp = window.App.todayStr(); window.App.state.doneToday = 0; }
    window.App.state.doneToday++;
    doneCountEl.textContent = window.App.state.doneToday;
    // 🪙 코인 획득 (중요도가 클수록 더 많이)
    const gain = b.imp * 2;
    window.App.state.coins = (window.App.state.coins || 0) + gain;   // 코인은 조용히 적립 (토스트 없음)
    if (window.Main && window.Main.updateCoins) window.Main.updateCoins();
    setTimeout(() => { b.el.remove(); bubbles = bubbles.filter((x) => x !== b); persist(); }, 430);
  }

  function coinToast(x, y, n) {
    const el = document.createElement("div"); el.className = "coin-toast"; el.textContent = "+" + n + " 🪙";
    el.style.left = x + "px"; el.style.top = (y - 24) + "px"; layer.appendChild(el);
    el.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-42px)", opacity: 0 }], { duration: 950, easing: "ease-out" }).onfinish = () => el.remove();
  }
  function splash(b) {
    const n = 8 + Math.floor(b.r / 14);
    for (let i = 0; i < n; i++) {
      const bit = document.createElement("div"); bit.className = "splash-bit";
      const sz = 4 + Math.random() * (b.r * 0.14);
      bit.style.width = bit.style.height = sz + "px";
      bit.style.left = (b.x - sz / 2) + "px"; bit.style.top = (b.y - sz / 2) + "px";
      layer.appendChild(bit);
      const a = Math.random() * 6.28, d = b.r * (0.6 + Math.random() * 0.9);
      bit.animate(
        [{ transform: "translate(0,0) scale(1)", opacity: 1 },
         { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d - b.r * 0.3}px) scale(0.2)`, opacity: 0 }],
        { duration: 500 + Math.random() * 220, easing: "cubic-bezier(.2,.7,.3,1)" }
      ).onfinish = () => bit.remove();
    }
  }

  // ============================================================
  //  배경 물고기 (픽셀 · 행동 다양)
  // ============================================================
  function bounds() { return { x0: 6, x1: AQW - 6, y0: 8, y1: AQH - 6, speed: 1 }; }
  function newFish(type, fromEdge) {
    const small = (type === "shrimp" || type === "crab");
    return {
      type,
      x: fromEdge ? -6 : 8 + Math.random() * (AQW - 16),
      y: 12 + Math.random() * (AQH - 30),
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.5),
      vy: (Math.random() - 0.5) * 0.25,
      s: small ? 5 + Math.random() * 2 : 7 + Math.random() * 4,
      dir: 1, dir2: Math.random() > 0.5 ? 1 : -1,
    };
  }
  function seedFish() {
    fishBg = [];
    for (const type of (window.App.state.aquarium.fish || ["nemo"])) fishBg.push(newFish(type, false));
  }
  function addFishLive(type) { if (running) fishBg.push(newFish(type, true)); }

  // ============================================================
  //  픽셀 어항 렌더
  // ============================================================
  function resize() {
    AQW = 300;
    AQH = Math.max(120, Math.round(AQW * innerHeight / innerWidth));
    fishCv.width = AQW; fishCv.height = AQH;
    fctx.imageSmoothingEnabled = false;
    ripCv.width = innerWidth; ripCv.height = innerHeight;
    if (!airBub.length) for (let i = 0; i < 18; i++) airBub.push({ x: Math.random() * AQW, y: Math.random() * AQH, r: 0.6 + Math.random() * 1.6, v: 0.2 + Math.random() * 0.5 });
  }

  function drawAquarium() {
    const g = fctx, gy = AQH - 8;
    g.clearRect(0, 0, AQW, AQH);
    // 물 밴드
    const top = "#8fd8f5", mid = "#4fb0e8", bot = "#2b86c4";
    const bands = 10;
    for (let i = 0; i < bands; i++) {
      const f = i / (bands - 1);
      g.fillStyle = f < 0.5 ? mix(top, mid, f * 2) : mix(mid, bot, (f - 0.5) * 2);
      g.fillRect(0, Math.floor(AQH * i / bands), AQW, Math.ceil(AQH / bands) + 1);
    }
    // 뒷유리 물결빛(caustics)
    g.globalAlpha = 0.14;
    for (let i = 0; i < 5; i++) {
      const cx = (t * 0.3 + i * 70) % (AQW + 40) - 20;
      const cy = 20 + i * (AQH / 6) + Math.sin(t * 0.03 + i) * 6;
      g.fillStyle = "#ffffff";
      g.beginPath(); g.ellipse(cx, cy, 22, 6, 0.5, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // 수면(waterline)
    for (let x = 0; x < AQW; x += 2) { const wy = 3 + Math.sin(x * 0.2 + t * 0.08) * 1.2; g.fillStyle = "rgba(230,250,255,0.7)"; g.fillRect(x, wy, 2, 2); }

    // 자갈
    g.fillStyle = "#e6d9b8"; g.fillRect(0, gy, AQW, AQH - gy);
    const peb = ["#d8c79e", "#efe3c4", "#cbb98c", "#e0cfa4"];
    for (let x = 0; x < AQW; x += 4) { g.fillStyle = peb[(x >> 2) % peb.length]; g.fillRect(x, gy + ((x >> 2) % 2), 3, 3); }

    // 장식 (물고기 뒤)
    drawDecor(g, gy);

    // 물고기
    const b = bounds();
    for (const f of fishBg) { window.FishSprite.step(f, b, t); window.FishSprite.draw(g, f.type, f.x, f.y, f.s, f.dir, t); }

    // 상승 기포
    g.fillStyle = "rgba(255,255,255,0.7)";
    for (const a of airBub) { a.y -= a.v; a.x += Math.sin(a.y * 0.1) * 0.2; if (a.y < 2) { a.y = AQH - 6; a.x = Math.random() * AQW; } g.fillRect(a.x | 0, a.y | 0, Math.max(1, a.r | 0), Math.max(1, a.r | 0)); }

    // ===== 앞유리 반사(진짜 유리 느낌) =====
    // 대각선 하이라이트
    g.globalAlpha = 0.10; g.fillStyle = "#ffffff";
    g.beginPath(); g.moveTo(0, 0); g.lineTo(AQW * 0.5, 0); g.lineTo(0, AQH * 0.55); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(AQW, AQH * 0.1); g.lineTo(AQW, AQH * 0.5); g.lineTo(AQW * 0.6, AQH); g.lineTo(AQW * 0.85, AQH); g.closePath(); g.fill();
    g.globalAlpha = 1;
    // 좌우 유리 모서리 하이라이트
    g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(2, 2, 1, AQH - 4); g.fillRect(AQW - 3, 2, 1, AQH - 4);
    // 실리콘 프레임(어두운 테두리)
    g.strokeStyle = "rgba(30,60,80,0.55)"; g.lineWidth = 2; g.strokeRect(1, 1, AQW - 2, AQH - 2);
    // 상단 유리 림
    g.fillStyle = "rgba(210,240,255,0.35)"; g.fillRect(0, 0, AQW, 2);
  }

  // ---- 장식들 ----
  const SEAWEED_X = [0.12, 0.28, 0.68, 0.86, 0.5, 0.4, 0.78];
  function drawDecor(g, gy) {
    const decor = window.App.state.aquarium.decor || [];
    let sw = 0;
    for (const d of decor) {
      if (d === "seaweed") { const x = SEAWEED_X[sw % SEAWEED_X.length] * AQW; drawSeaweed(g, x, gy + 2, 22 + (sw % 3) * 8, sw); sw++; }
      else if (d === "castle") drawCastle(g, AQW * 0.5, gy + 2);
      else if (d === "chest") drawChest(g, AQW * 0.8, gy + 2);
    }
  }
  function drawSeaweed(g, x, base, h, seed) {
    for (let i = 0; i < h; i += 2) {
      const off = Math.sin((base - i) * 0.35 + t * 0.05 + seed) * 3;
      g.fillStyle = i < h * 0.4 ? "#63c97a" : "#3ba55a";
      g.fillRect((x + off) | 0, (base - i) | 0, 3, 2);
    }
  }
  function drawCastle(g, x, base) {
    x = x | 0;
    g.fillStyle = "#e7c98a";           // 본체
    g.fillRect(x - 12, base - 14, 24, 14);
    g.fillStyle = "#d6b46e";
    g.fillRect(x - 12, base - 14, 24, 2);
    g.fillStyle = "#e7c98a";           // 탑
    g.fillRect(x - 16, base - 20, 6, 20); g.fillRect(x + 10, base - 20, 6, 20);
    // 성가퀴
    g.fillRect(x - 16, base - 22, 2, 2); g.fillRect(x - 12, base - 22, 2, 2);
    g.fillRect(x + 10, base - 22, 2, 2); g.fillRect(x + 14, base - 22, 2, 2);
    // 문/창
    g.fillStyle = "#7a5a30"; g.fillRect(x - 3, base - 8, 6, 8);
    g.fillStyle = "#5a86c9"; g.fillRect(x - 14, base - 14, 2, 3); g.fillRect(x + 12, base - 14, 2, 3);
    // 깃발
    g.fillStyle = "#ff5a7a"; g.fillRect(x - 14, base - 26, 4, 3); g.fillStyle = "#8a6a3a"; g.fillRect(x - 14, base - 26, 1, 6);
  }
  function drawChest(g, x, base) {
    x = x | 0;
    g.fillStyle = "#8a5a2e"; g.fillRect(x - 9, base - 8, 18, 8);      // 몸통
    g.fillStyle = "#6e4522"; g.fillRect(x - 9, base - 12, 18, 5);      // 뚜껑
    g.fillStyle = "#e8c95a";                                          // 금테
    g.fillRect(x - 9, base - 8, 18, 1); g.fillRect(x - 1, base - 12, 2, 12);
    g.fillStyle = "#fff2a8"; g.fillRect(x - 1, base - 6, 2, 2);        // 자물쇠
    // 반짝임
    if ((t >> 4) % 2) { g.fillStyle = "#fffbe0"; g.fillRect(x + 4, base - 14, 1, 1); g.fillRect(x - 6, base - 13, 1, 1); }
  }

  // ============================================================
  //  물리
  // ============================================================
  function physics() {
    const Wd = innerWidth, Hd = innerHeight;
    for (const b of bubbles) {
      if (b.popped) continue;
      b.wob += 0.02;
      b.vx += Math.cos(b.wob) * 0.006 + (Math.random() - 0.5) * 0.004;
      b.vy += Math.sin(b.wob * 1.3) * 0.006 + (Math.random() - 0.5) * 0.004;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAX_SPEED) { b.vx *= MAX_SPEED / sp; b.vy *= MAX_SPEED / sp; }
      b.vx *= 0.995; b.vy *= 0.995;
      b.x += b.vx; b.y += b.vy;
      if (b.x - b.r < 0)  { b.x = b.r;      b.vx = Math.abs(b.vx) * 0.8; }
      if (b.x + b.r > Wd) { b.x = Wd - b.r; b.vx = -Math.abs(b.vx) * 0.8; }
      if (b.y - b.r < 0)  { b.y = b.r;      b.vy = Math.abs(b.vy) * 0.8; }
      if (b.y + b.r > Hd) { b.y = Hd - b.r; b.vy = -Math.abs(b.vy) * 0.8; }
    }
    for (let i = 0; i < bubbles.length; i++) {
      const a = bubbles[i]; if (a.popped) continue;
      for (let j = i + 1; j < bubbles.length; j++) {
        const c = bubbles[j]; if (c.popped) continue;
        const dx = c.x - a.x, dy = c.y - a.y, dist = Math.hypot(dx, dy), min = a.r + c.r;
        if (dist > 0 && dist < min) {
          const nx = dx / dist, ny = dy / dist, overlap = (min - dist) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap; c.x += nx * overlap; c.y += ny * overlap;
          const av = a.vx * nx + a.vy * ny, cv = c.vx * nx + c.vy * ny, diff = (cv - av) * 0.7;
          a.vx += diff * nx; a.vy += diff * ny; c.vx -= diff * nx; c.vy -= diff * ny;
          a.vx -= nx * 0.05; a.vy -= ny * 0.05; c.vx += nx * 0.05; c.vy += ny * 0.05;
        }
      }
    }
  }

  // ============================================================
  //  파동
  // ============================================================
  function makeRipple(x, y) {
    ripples.push({ x, y, r: 0, life: 1 });
    window.Audio2.ensure(); window.Audio2.ripple();
    for (const b of bubbles) {
      if (b.popped) continue;
      const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy);
      if (d < 260 && d > 0.1) { const f = (1 - d / 260) * 3.2; b.vx += (dx / d) * f; b.vy += (dy / d) * f; }
    }
  }
  function drawRipples() {
    rctx.clearRect(0, 0, ripCv.width, ripCv.height);
    for (const rp of ripples) {
      rp.r += 5; rp.life -= 0.018;
      rctx.strokeStyle = `rgba(255,255,255,${0.5 * rp.life})`; rctx.lineWidth = 2;
      rctx.beginPath(); rctx.arc(rp.x, rp.y, rp.r, 0, 6.283); rctx.stroke();
      rctx.strokeStyle = `rgba(180,230,255,${0.35 * rp.life})`;
      rctx.beginPath(); rctx.arc(rp.x, rp.y, rp.r * 0.6, 0, 6.283); rctx.stroke();
    }
    ripples = ripples.filter((r) => r.life > 0);
  }

  // ============================================================
  //  루프
  // ============================================================
  function render() { for (const b of bubbles) if (!b.popped) b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px)`; }
  function loop() { if (!running) return; t++; physics(); render(); drawAquarium(); drawRipples(); requestAnimationFrame(loop); }

  // ============================================================
  //  모달
  // ============================================================
  function selectImp(v) { pendingImp = v; impRow.querySelectorAll(".imp-btn").forEach((btn) => btn.classList.toggle("imp-selected", +btn.dataset.imp === v)); }
  function openModal(b) {
    editingId = b ? b.id : null;
    modalTitle.textContent = b ? "✏️ 할일 수정" : "🫧 새 할일";
    taskInput.value = b ? b.text : ""; selectImp(b ? b.imp : 3);
    modal.classList.remove("hidden"); setTimeout(() => taskInput.focus(), 30);
  }
  function closeModal() { modal.classList.add("hidden"); editingId = null; }
  function commit() {
    const text = taskInput.value.trim(); if (!text) { taskInput.focus(); return; }
    if (editingId != null) {
      const b = bubbles.find((x) => x.id === editingId);
      if (b) { b.text = text; b.imp = pendingImp; const spec = IMP[pendingImp]; b.r = spec.r;
        b.el.style.setProperty("--tint", spec.tint); b.el.style.width = b.el.style.height = spec.r * 2 + "px";
        b.el.style.fontSize = Math.max(11, Math.round(spec.r * 0.28 * fontScale())) + "px"; b.txt.textContent = text; }
    } else spawnBubble(text, pendingImp);
    persist(); closeModal();
  }

  function persist() {
    window.App.state.bubbles = bubbles.filter((b) => !b.popped).map((b) => ({ id: b.id, text: b.text, imp: b.imp, x: b.x, y: b.y, vx: b.vx, vy: b.vy }));
    window.App.save();
  }
  function refreshFont() { for (const b of bubbles) b.el.style.fontSize = Math.max(11, Math.round(b.r * 0.28 * fontScale())) + "px"; }
  function mix(a, b, f) { const ca = hx(a), cb = hx(b); return `rgb(${Math.round(ca[0] + (cb[0] - ca[0]) * f)},${Math.round(ca[1] + (cb[1] - ca[1]) * f)},${Math.round(ca[2] + (cb[2] - ca[2]) * f)})`; }
  function hx(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  // ============================================================
  //  공개 API
  // ============================================================
  window.Bubbles = {
    init() {
      layer = document.getElementById("bubble-layer");
      fishCv = document.getElementById("fish-canvas"); fctx = fishCv.getContext("2d");
      ripCv = document.getElementById("ripple-canvas"); rctx = ripCv.getContext("2d");
      doneCountEl = document.getElementById("done-count");
      modal = document.getElementById("modal");
      modalTitle = document.getElementById("modal-title-text");
      taskInput = document.getElementById("task-input");
      impRow = document.getElementById("importance-row");

      const screen = document.getElementById("screen-bubbles");
      screen.addEventListener("pointerdown", (e) => {
        if (e.target === layer || e.target === ripCv || e.target === fishCv || e.target === screen || e.target.classList.contains("water-rays")) makeRipple(e.clientX, e.clientY);
      });

      impRow.addEventListener("click", (e) => { const b = e.target.closest(".imp-btn"); if (b) selectImp(+b.dataset.imp); });
      document.getElementById("btn-add").addEventListener("click", () => { window.Audio2.ensure(); openModal(null); });
      document.getElementById("modal-ok").addEventListener("click", commit);
      document.getElementById("modal-cancel").addEventListener("click", closeModal);
      document.getElementById("modal-close").addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
      taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") closeModal(); });
      window.addEventListener("resize", () => { if (running) resize(); });
      window.App.onSettings(() => refreshFont());

      doneCountEl.textContent = window.App.state.doneToday;
      for (const d of (window.App.state.bubbles || [])) makeBubble(d, false);
      // 예시 방울 없음 — 빈 어항에서 시작
    },
    start() { running = true; resize(); seedFish(); drawAquarium(); window.Audio2.setMusicVolume(0); window.Audio2.setAmbient("bubble"); requestAnimationFrame(loop); },
    stop() { running = false; persist(); },
  };
})();
