/* ============================================================
   방 (픽셀아트 캔버스) — window.Room
   책상 · 프루티거 에어로 컴퓨터 · 창문(커튼/날씨/시간) · 어항(물고기)
   ============================================================ */
(function () {
  "use strict";
  const W = 320, H = 180;
  let canvas, ctx;
  let t = 0;                 // 프레임 카운터
  let weather = "sunny";
  let fish = [];
  let outPart = [];          // 창밖 비/눈 파티클
  let hotspots = [];
  let hover = null;
  let cb = {};               // {onAquarium, onComputer}
  let easter = {};           // 소품 흔들림 타이머
  let running = false;
  let editMode = false, drag = null;   // 꾸미기 편집
  let decorWob = {};                   // 데코 클릭 흔들림

  // ---- 팔레트 ----
  const C = {
    wallTop: "#dff4fb", wallMid: "#cfeaf6", wallLow: "#bfe0f0",
    floor: "#eaf6fb", floor2: "#d8edf6",
    deskTop: "#ffffff", deskFace: "#dceefc", deskEdge: "#b6d9f0",
    frame: "#ffffff", frameSh: "#bcd8ea",
    outline: "#3a5a72",
  };

  // ---- 픽셀 헬퍼 ----
  function P(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function line(x, y, w, h, col) { P(x, y, w, h, col); }

  // ============================================================
  //  물고기 스프라이트 (bubbles.js 와 공유)
  // ============================================================
  const FISH_TYPES = {
    nemo:   { body: "#ff8a3d", stripe: "#ffffff", edge: "#c94f1a", fin: "#ff7a2a", tall: 0.66 },
    dory:   { body: "#2f74d0", stripe: "#0e3f86", edge: "#153f7a", fin: "#ffd23f", tall: 0.6 },
    tang:   { body: "#ffd23f", stripe: "#f2b705", edge: "#c99406", fin: "#ffe17a", tall: 0.9 }, // 삼각(옐로탱)
    guppy:  { body: "#57c9c0", stripe: "#8f7ae0", edge: "#2f8f88", fin: "#b9a6ff", tall: 0.6 },
    coral:  { body: "#ff6f91", stripe: "#ffd9e2", edge: "#c94f6a", fin: "#ff9db1", tall: 0.62 },
    angel:  { body: "#f4f4f8", stripe: "#39424f", edge: "#c8ccd6", fin: "#ffd23f", tall: 1.0 }, // 삼각(엔젤)
  };

  function drawFish(g, type, x, y, s, dir, tt) {
    if (type === "shrimp") return drawShrimp(g, x, y, s, dir, tt);
    if (type === "crab")   return drawCrab(g, x, y, s, dir, tt);
    const p = FISH_TYPES[type] || FISH_TYPES.nemo;
    const th = (p.tall || 0.66);
    const wig = Math.sin(tt * 0.2 + x * 0.3) * (s * 0.12);
    g.save();
    g.translate(Math.round(x), Math.round(y));
    g.scale(dir, 1);
    // 꼬리
    g.fillStyle = p.fin;
    g.beginPath();
    g.moveTo(-s * 0.9, 0);
    g.lineTo(-s * 1.5, -s * 0.55 + wig);
    g.lineTo(-s * 1.5, s * 0.55 + wig);
    g.closePath(); g.fill();
    // 몸통
    g.fillStyle = p.body;
    g.beginPath();
    g.ellipse(0, 0, s, s * th, 0, 0, Math.PI * 2);
    g.fill();
    // 줄무늬
    g.fillStyle = p.stripe;
    if (type === "nemo") {
      g.fillRect(-s * 0.15, -s * 0.6, s * 0.22, s * 1.2);
      g.fillRect(s * 0.4, -s * 0.45, s * 0.16, s * 0.9);
      g.fillRect(-s * 0.7, -s * 0.4, s * 0.14, s * 0.8);
    } else if (type === "dory") {
      g.fillRect(-s * 0.6, -s * 0.1, s * 1.2, s * 0.5);
    } else if (type === "tang") {
      g.fillRect(-s * 0.2, -s * 0.7, s * 0.5, s * 0.35);
    } else if (type === "angel") {
      g.fillRect(-s * 0.4, -s * th, s * 0.28, s * th * 2);
      g.fillRect(s * 0.2, -s * th, s * 0.24, s * th * 2);
    } else {
      g.fillRect(-s * 0.5, -s * 0.1, s * 1.0, s * 0.22);
    }
    // 위 지느러미
    g.fillStyle = p.fin;
    g.beginPath();
    g.moveTo(-s * 0.2, -s * th - s * 0.02);
    g.lineTo(s * 0.3, -s * th - s * 0.02);
    g.lineTo(0, -s * th - s * 0.4);
    g.closePath(); g.fill();
    // 눈
    g.fillStyle = "#fff"; g.beginPath(); g.arc(s * 0.55, -s * 0.12, s * 0.2, 0, 7); g.fill();
    g.fillStyle = "#20303a"; g.beginPath(); g.arc(s * 0.6, -s * 0.12, s * 0.1, 0, 7); g.fill();
    g.restore();
  }

  // 새우
  function drawShrimp(g, x, y, s, dir, tt) {
    const c = "#ff9e7a", c2 = "#ff7e5a", e = "#c9543a";
    const fl = Math.sin(tt * 0.3) * s * 0.15;
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(dir, 1);
    // 꼬리 부채
    g.fillStyle = c2; g.beginPath(); g.moveTo(-s * 0.6, 0); g.lineTo(-s * 1.1, -s * 0.4 + fl); g.lineTo(-s * 1.1, s * 0.4 + fl); g.closePath(); g.fill();
    // 몸통 마디
    for (let i = 0; i < 5; i++) { const bx = -s * 0.5 + i * (s * 0.32); const by = Math.sin(i * 0.6) * s * 0.1; g.fillStyle = i % 2 ? c2 : c; g.beginPath(); g.arc(bx, by, s * 0.32 - i * s * 0.03, 0, 7); g.fill(); }
    // 더듬이
    g.strokeStyle = e; g.lineWidth = 1; g.beginPath(); g.moveTo(s * 0.6, -s * 0.1); g.lineTo(s * 1.3, -s * 0.5); g.moveTo(s * 0.6, 0); g.lineTo(s * 1.4, -s * 0.15); g.stroke();
    // 다리
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-s * 0.2 + i * s * 0.25, s * 0.2); g.lineTo(-s * 0.2 + i * s * 0.25, s * 0.45); g.stroke(); }
    // 눈
    g.fillStyle = "#20303a"; g.beginPath(); g.arc(s * 0.6, -s * 0.05, s * 0.1, 0, 7); g.fill();
    g.restore();
  }
  // 게
  function drawCrab(g, x, y, s, dir, tt) {
    const c = "#ff5a4a", c2 = "#e03a2e", e = "#a02418";
    const lm = Math.sin(tt * 0.4) * s * 0.12;
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(dir, 1);
    g.strokeStyle = c2; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const lx = -s * 0.5 + i * s * 0.5;
      g.beginPath(); g.moveTo(lx, s * 0.2); g.lineTo(lx - s * 0.35, s * 0.6 + (i % 2 ? lm : -lm)); g.stroke();
      g.beginPath(); g.moveTo(lx, s * 0.2); g.lineTo(lx + s * 0.35, s * 0.6 + (i % 2 ? -lm : lm)); g.stroke(); }
    g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, s, s * 0.6, 0, 0, 7); g.fill();
    g.fillStyle = c2; g.fillRect(-s, 0, s * 2, s * 0.18);
    g.fillStyle = c; g.beginPath(); g.arc(-s * 0.95, -s * 0.15, s * 0.36, 0, 7); g.fill(); g.beginPath(); g.arc(s * 0.95, -s * 0.15, s * 0.36, 0, 7); g.fill();
    g.strokeStyle = c2; g.beginPath(); g.moveTo(-s * 0.2, -s * 0.5); g.lineTo(-s * 0.2, -s * 0.85); g.moveTo(s * 0.2, -s * 0.5); g.lineTo(s * 0.2, -s * 0.85); g.stroke();
    g.fillStyle = "#20303a"; g.beginPath(); g.arc(-s * 0.2, -s * 0.9, s * 0.12, 0, 7); g.fill(); g.beginPath(); g.arc(s * 0.2, -s * 0.9, s * 0.12, 0, 7); g.fill();
    g.restore();
  }

  // ---- 행동 모드 ----
  function modeFor(type) {
    if (type === "shrimp" || type === "crab") return "bottom";
    if (type === "tang" || type === "angel") return "dart";
    if (type === "guppy" || type === "coral") return "drift";
    return "cruise";
  }
  function stepFishBeh(f, b, tt) {
    const sc = b.speed || 1;
    if (!f.mode) { f.mode = modeFor(f.type); f.timer = 0; }
    if (f.mode === "bottom") {
      f.y += ((b.y1 - f.s * 0.5) - f.y) * 0.25;   // 바닥에 딱 붙기
      if (--f.timer <= 0) { f.paused = !f.paused; f.timer = f.paused ? 40 + rnd(50) : 70 + rnd(90); if (!f.paused && Math.random() < 0.4) f.dir2 = -(f.dir2 || 1); }
      const tgt = f.paused ? 0 : (f.dir2 || 1) * 0.28 * sc;
      f.vx += (tgt - f.vx) * 0.1; f.x += f.vx;
    } else if (f.mode === "dart") {
      if (--f.timer <= 0) { f.bursting = !f.bursting; f.timer = f.bursting ? 16 + rnd(16) : 50 + rnd(70); if (f.bursting) { f.dir2 = Math.random() > 0.5 ? 1 : -1; f.vy = (Math.random() - 0.5) * 0.7 * sc; } }
      const tgt = f.bursting ? 1.2 * sc : 0.05 * sc;
      f.vx += (((f.dir2 || 1) * tgt) - f.vx) * 0.18; f.y += f.vy; f.vy *= 0.95; f.x += f.vx;
    } else if (f.mode === "drift") {
      f.phase = (f.phase || Math.random() * 6) + 0.03;
      f.vx = (f.dir2 || 1) * 0.22 * sc; f.x += f.vx; f.y += Math.sin(f.phase) * 0.35 * sc;
      if ((tt + (f.x | 0)) % 220 < 1) f.dir2 = -(f.dir2 || 1);
    } else { // cruise
      f.x += f.vx; f.y += f.vy;
      if ((tt + (f.x | 0)) % 120 < 1) f.vy = (Math.random() - 0.5) * 0.3 * sc;
      if ((tt + (f.y | 0)) % 200 < 1) f.vx = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.4) * sc;
    }
    if (f.x < b.x0 + f.s) { f.x = b.x0 + f.s; f.vx = Math.abs(f.vx) || 0.3; f.dir2 = 1; }
    if (f.x > b.x1 - f.s) { f.x = b.x1 - f.s; f.vx = -(Math.abs(f.vx) || 0.3); f.dir2 = -1; }
    const topY = f.mode === "bottom" ? b.y1 - f.s * 1.1 : b.y0 + f.s;
    const maxY = f.mode === "bottom" ? b.y1 - f.s * 0.3 : b.y1 - f.s;
    if (f.y < topY) { f.y = topY; f.vy = Math.abs(f.vy); }
    if (f.y > maxY) { f.y = maxY; f.vy = -Math.abs(f.vy); }
    f.dir = f.vx >= 0 ? 1 : -1;
  }

  window.FishSprite = { draw: drawFish, step: stepFishBeh, modeFor, types: Object.keys(FISH_TYPES) };

  // ============================================================
  //  시간 / 날씨 헬퍼
  // ============================================================
  function now() { return new Date(); }
  function isNight() { const h = now().getHours(); return h >= 19 || h < 6; }
  function isDusk() { const h = now().getHours(); return (h >= 17 && h < 19) || (h >= 6 && h < 8); }

  // ============================================================
  //  창밖 하늘
  // ============================================================
  const WIN = { x: 22, y: 24, w: 96, h: 78 };            // 창틀 바깥
  const WIN_IN = { x: WIN.x + 4, y: WIN.y + 4, w: WIN.w - 8, h: WIN.h - 8 };

  function skyColors() {
    const night = isNight(), dusk = isDusk();
    if (weather === "rain") return night ? ["#1b2530", "#2b3946"] : ["#5a6a78", "#8a99a6"];
    if (weather === "snow") return night ? ["#39435a", "#5a6678"] : ["#9fb0c2", "#cdd9e6"];
    // sunny / rainbow
    if (night) return ["#0b1e40", "#22406e"];
    if (dusk)  return ["#f7a65a", "#ffd59e"];
    return ["#4aa6e6", "#bfe8ff"];
  }

  function drawSky() {
    const [top, bot] = skyColors();
    // 밴드 그라데이션 (픽셀 느낌 6단)
    const bands = 6;
    for (let i = 0; i < bands; i++) {
      const f = i / (bands - 1);
      ctx.fillStyle = mix(top, bot, f);
      P(WIN_IN.x, WIN_IN.y + (WIN_IN.h * i / bands), WIN_IN.w, WIN_IN.h / bands + 1, ctx.fillStyle);
    }
    const night = isNight();

    // 해 / 달
    const cx = WIN_IN.x + WIN_IN.w * 0.68, cy = WIN_IN.y + WIN_IN.h * 0.28;
    if (weather === "sunny" || weather === "rainbow") {
      if (night) {
        P(cx - 6, cy - 6, 12, 12, "#f2f4ff");
        P(cx - 4, cy - 8, 8, 4, "#f2f4ff"); P(cx - 8, cy - 4, 4, 8, "#f2f4ff");
        P(cx + 4, cy - 4, 4, 8, "#f2f4ff"); P(cx - 4, cy + 4, 8, 4, "#f2f4ff");
        P(cx - 2, cy - 2, 5, 5, "#cfd6ff"); // 크레이터 음영
        // 별
        for (let s = 0; s < 10; s++) {
          const sx = WIN_IN.x + ((s * 37) % WIN_IN.w);
          const sy = WIN_IN.y + ((s * 53) % (WIN_IN.h * 0.6));
          if ((t >> 3) % 12 !== s) P(sx, sy, 1, 1, "#fff");
        }
      } else {
        P(cx - 6, cy - 6, 12, 12, "#fff4c2");
        P(cx - 5, cy - 7, 10, 14, "#ffe680");
        P(cx - 4, cy - 5, 8, 10, "#ffd23f");
      }
    }

    // 구름 (낮)
    if (!night && (weather === "sunny" || weather === "rainbow")) {
      const off = (t * 0.15) % (WIN_IN.w + 30) - 30;
      cloud(WIN_IN.x + off, WIN_IN.y + 12);
      cloud(WIN_IN.x + ((off + 55) % (WIN_IN.w + 30)) - 15, WIN_IN.y + 30);
    }

    // 새 (낮/맑음)
    if (!night && weather !== "rain" && weather !== "snow") {
      const bx = WIN_IN.x + ((t * 0.3) % (WIN_IN.w + 20)) - 10;
      const by = WIN_IN.y + 20 + Math.sin(t * 0.05) * 3;
      bird(bx, by); bird(bx + 8, by + 4);
    }

    // 무지개
    if (weather === "rainbow" && !night) drawRainbow();

    // 비 / 눈 (창 안)
    if (weather === "rain" || weather === "snow") drawOutParticles();
  }

  function cloud(x, y) {
    P(x, y, 14, 5, "#ffffff"); P(x + 3, y - 3, 9, 4, "#ffffff"); P(x + 6, y - 5, 6, 4, "#f2fbff");
  }
  function bird(x, y) {
    P(x, y, 2, 1, "#3a4a55"); P(x + 2, y - 1, 2, 1, "#3a4a55"); P(x + 4, y, 2, 1, "#3a4a55");
  }
  function drawRainbow() {
    const cols = ["#f06c6c", "#ffb45a", "#ffe878", "#7ad07a", "#5ac8eb", "#6e8ee0", "#a55ac8"];
    const cx = WIN_IN.x + WIN_IN.w / 2, cy = WIN_IN.y + WIN_IN.h + 6, r0 = WIN_IN.w * 0.42;
    ctx.save();
    ctx.beginPath();
    ctx.rect(WIN_IN.x, WIN_IN.y, WIN_IN.w, WIN_IN.h); ctx.clip();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < cols.length; i++) {
      ctx.strokeStyle = cols[i]; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r0 - i * 2, Math.PI, 0); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.restore();
  }

  function seedOut() {
    outPart = [];
    if (weather === "rain") {
      for (let i = 0; i < 26; i++) outPart.push({ x: rnd(WIN_IN.w), y: rnd(WIN_IN.h), v: 2 + rnd(2) });
    } else if (weather === "snow") {
      for (let i = 0; i < 22; i++) outPart.push({ x: rnd(WIN_IN.w), y: rnd(WIN_IN.h), v: 0.4 + rnd(0.6), s: rnd(6) });
    }
  }
  function drawOutParticles() {
    if (weather === "rain") {
      ctx.strokeStyle = "rgba(200,225,245,0.7)"; ctx.lineWidth = 1;
      for (const p of outPart) {
        ctx.beginPath(); ctx.moveTo(WIN_IN.x + p.x, WIN_IN.y + p.y);
        ctx.lineTo(WIN_IN.x + p.x - 1, WIN_IN.y + p.y + 4); ctx.stroke();
        p.y += p.v * 2; p.x -= 0.4;
        if (p.y > WIN_IN.h) { p.y = 0; p.x = rnd(WIN_IN.w); }
      }
    } else if (weather === "snow") {
      ctx.fillStyle = "#ffffff";
      for (const p of outPart) {
        P(WIN_IN.x + p.x, WIN_IN.y + p.y, 1 + (p.s > 3 ? 1 : 0), 1 + (p.s > 3 ? 1 : 0), "#fff");
        p.y += p.v; p.x += Math.sin((t + p.s * 10) * 0.05) * 0.3;
        if (p.y > WIN_IN.h) { p.y = 0; p.x = rnd(WIN_IN.w); }
      }
    }
  }

  // ============================================================
  //  창문 + 커튼
  // ============================================================
  function drawWindow() {
    // 창틀
    P(WIN.x - 2, WIN.y - 2, WIN.w + 4, WIN.h + 4, C.frameSh);
    P(WIN.x, WIN.y, WIN.w, WIN.h, C.frame);
    // 유리 영역: 스킨 모양(아치/라운드)대로 클립 → 하늘·커튼이 모서리 넘지 않음, 모서리는 창틀색 노출
    ctx.save();
    window.Skins.clipWindow(ctx, WIN_IN);
    window.WindowSky.draw(ctx, WIN_IN, weather, t);
    P(WIN.x + WIN.w / 2 - 1, WIN.y, 2, WIN.h, C.frame);          // 십자
    P(WIN.x, WIN.y + WIN.h / 2 - 1, WIN.w, 2, C.frame);
    ctx.fillStyle = "rgba(255,255,255,0.18)";                    // 유리 광택
    ctx.beginPath(); ctx.moveTo(WIN_IN.x, WIN_IN.y); ctx.lineTo(WIN_IN.x + 20, WIN_IN.y);
    ctx.lineTo(WIN_IN.x, WIN_IN.y + 20); ctx.closePath(); ctx.fill();
    ctx.restore();
    drawCurtains();   // 커튼(밸런스가 유리 위쪽) — 클립 밖에서
    // 창턱
    P(WIN.x - 4, WIN.y + WIN.h, WIN.w + 8, 4, "#eaf6fb");
    P(WIN.x - 4, WIN.y + WIN.h + 4, WIN.w + 8, 2, C.frameSh);
    if (weather === "snow") P(WIN.x - 4, WIN.y + WIN.h - 1, WIN.w + 8, 2, "#ffffff"); // 창턱 눈
  }

  function windStrength() {
    return (weather === "sunny" || weather === "rainbow") ? 1 : 0.15;
  }
  function drawCurtains() {
    const sway = Math.sin(t * 0.06) * 3 * windStrength();
    // 밸런스(윗단)
    P(WIN.x - 4, WIN.y - 6, WIN.w + 8, 8, "#cfe9fb");
    P(WIN.x - 4, WIN.y - 6, WIN.w + 8, 2, "#e7f6ff");
    // 좌우 커튼 패널 (물결치는 안쪽 가장자리)
    ctx.fillStyle = "rgba(206,233,251,0.92)";
    // 왼쪽
    for (let y = WIN.y; y < WIN.y + WIN.h; y += 2) {
      const w = 16 + Math.sin(y * 0.25 + t * 0.06) * (2 * windStrength());
      P(WIN.x - 2, y, w, 2, ctx.fillStyle);
    }
    // 오른쪽
    for (let y = WIN.y; y < WIN.y + WIN.h; y += 2) {
      const w = 16 + Math.sin(y * 0.25 + t * 0.06 + sway) * (2 * windStrength());
      P(WIN.x + WIN.w + 2 - w, y, w, 2, ctx.fillStyle);
    }
    // 커튼 세로 주름
    ctx.fillStyle = "rgba(150,195,225,0.35)";
    for (let i = 0; i < 3; i++) { P(WIN.x + 2 + i * 5, WIN.y, 1, WIN.h, ctx.fillStyle); P(WIN.x + WIN.w - 4 - i * 5, WIN.y, 1, WIN.h, ctx.fillStyle); }
  }

  // ============================================================
  //  벽시계 (아날로그, 실시간)
  // ============================================================
  function drawWallClock() {
    const o = boff("wallclock"), cx = 176 + o.dx, cy = 20 + o.dy, r = 11;
    P(cx - r - 1, cy - r - 1, (r + 1) * 2, (r + 1) * 2, "#bcd8ea"); // 그림자
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.strokeStyle = "#9cc2da"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    // 눈금
    ctx.fillStyle = "#5a7688";
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P(cx + Math.cos(a) * (r - 2) - 0.5, cy + Math.sin(a) * (r - 2) - 0.5, 1, 1, "#5a7688"); }
    const d = now(); const hh = d.getHours() % 12, mm = d.getMinutes();
    const ha = (hh + mm / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const ma = mm / 60 * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = "#2b4658"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * (r - 5), cy + Math.sin(ha) * (r - 5)); ctx.stroke();
    ctx.strokeStyle = "#3a6a90"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ma) * (r - 3), cy + Math.sin(ma) * (r - 3)); ctx.stroke();
    P(cx - 1, cy - 1, 2, 2, "#2b4658");
  }

  // ============================================================
  //  책상 · 컴퓨터 · 어항 · 소품
  // ============================================================
  const DESK_Y = 112;
  const COMP = { x: 150, y: 72, w: 60, h: 40 };     // 모니터
  const TANK = { x: 236, y: 66, w: 70, h: 46 };     // 어항

  function drawRoomBase() {
    // 벽 (벽지 스킨)
    const [wt, wm, wl] = window.Skins.wall(C.wallTop, C.wallMid, C.wallLow);
    const [fc, fc2] = window.Skins.floor(C.floor, C.floor2);
    P(0, 0, W, 60, wt); P(0, 60, W, 45, wm); P(0, 105, W, DESK_Y - 105, wl);
    // 걸레받이
    P(0, DESK_Y - 3, W, 3, "#a9cfe6");
    // 바닥 (바닥 스킨)
    P(0, DESK_Y, W, H - DESK_Y, fc);
    for (let i = 0; i < W; i += 16) P(i, DESK_Y + 8, 8, 1, fc2);   // 바닥 결
    // 러그
    if (!hb("rug")) {
      const o = boff("rug");
      ctx.fillStyle = "#bfe6d8"; ctx.beginPath(); ctx.ellipse(90 + o.dx, 168 + o.dy, 70, 12, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#a6dcc9"; ctx.beginPath(); ctx.ellipse(90 + o.dx, 168 + o.dy, 55, 8, 0, 0, 7); ctx.fill();
    }
  }

  function drawDesk() {
    // 책상 상판
    P(0, DESK_Y, W, 6, C.deskTop);
    P(0, DESK_Y, W, 1, "#ffffff");
    P(0, DESK_Y + 6, W, 2, C.deskEdge);
    // 앞면 다리(양쪽)
    P(18, DESK_Y + 8, 8, 40, C.deskFace); P(18, DESK_Y + 8, 2, 40, "#eef8ff");
    P(288, DESK_Y + 8, 8, 40, C.deskFace); P(294, DESK_Y + 8, 2, 40, C.deskEdge);
  }

  function drawComputer() {
    const { x, y, w, h } = COMP;
    const th = window.Skins.theme("computer");
    // 받침대
    P(x + w / 2 - 6, y + h, 12, 4, "#dfeefb"); P(x + w / 2 - 10, y + h + 4, 20, 3, "#c3ddf0");
    // 베젤 (스킨 색)
    P(x - 2, y - 2, w + 4, h + 4, th.bezel2);
    P(x, y, w, h, th.bezel);
    P(x, y, w, 2, th.bezel); P(x, y + h - 2, w, 2, th.shade);
    // 화면
    const sx = x + 5, sy = y + 5, sw = w - 10, sh = h - 12;
    if (th.screen === "terminal") {          // 레트로 초록 터미널
      P(sx, sy, sw, sh, "#08240f");
      ctx.fillStyle = "#37d16a";
      for (let i = 0; i < 4; i++) { const lw = 6 + ((i * 5 + (t >> 4)) % 3) * 4 + i * 2; ctx.fillRect(sx + 2, sy + 2 + i * 3, Math.min(sw - 4, lw), 1); }
      if ((t >> 4) % 2) P(sx + 2, sy + 2 + 4 * 3, 3, 1, "#8ff0a8");   // 커서 깜빡
      ctx.fillStyle = "rgba(0,0,0,0.12)"; for (let yy = sy; yy < sy + sh; yy += 2) ctx.fillRect(sx, yy, sw, 1); // 스캔라인
    } else if (th.screen === "sunset") {     // 핑크 노을
      for (let i = 0; i < sh; i++) { ctx.fillStyle = mix("#ffcf8a", "#ff8fb4", i / sh); ctx.fillRect(sx, sy + i, sw, 1); }
      ctx.fillStyle = "#fff0b0"; ctx.beginPath(); ctx.arc(sx + sw - 6, sy + 5, 3.4, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.28)"; for (let k = 0; k < 3; k++) P(sx + 2, sy + sh - 2 - k * 2, sw - 4, 1, "rgba(255,255,255,0.28)");
    } else {                                  // 기본 블리스 언덕
      P(sx, sy, sw, sh, "#7ec8f0");
      P(sx, sy, sw, sh * 0.5, "#63b7ee");
      ctx.fillStyle = "#6fbf4a"; ctx.beginPath();
      ctx.moveTo(sx, sy + sh); ctx.quadraticCurveTo(sx + sw * 0.5, sy + sh * 0.45, sx + sw, sy + sh); ctx.closePath(); ctx.fill();
      P(sx + 4, sy + 3, 5, 5, "#fff6c8");
    }
    // 화면 광택
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 12, sy); ctx.lineTo(sx, sy + 10); ctx.closePath(); ctx.fill();
    // 전원 LED
    P(x + w - 6, y + h - 5, 2, 2, (t >> 4) % 2 ? "#7CFC98" : "#3aa85a");
    // 키보드
    P(x + 4, DESK_Y - 4, w - 8, 5, "#eef7ff"); P(x + 4, DESK_Y - 4, w - 8, 1, "#ffffff");
    for (let i = 0; i < 6; i++) P(x + 7 + i * 8, DESK_Y - 3, 6, 3, "#d5e8f7");
  }

  function drawTank() {
    const { x, y, w, h } = TANK;
    const th = window.Skins.theme("aquarium");
    // 캐비닛/받침
    P(x + 2, y + h, w - 4, 4, th.cabinet);
    // 유리
    P(x - 1, y - 1, w + 2, h + 2, th.frame);
    P(x, y, w, h, "rgba(120,205,240,0.85)");
    // 물 그라데이션
    P(x, y, w, h * 0.4, "rgba(150,220,250,0.5)");
    // 자갈
    ctx.fillStyle = "#e6d9b8"; P(x, y + h - 6, w, 6, "#e6d9b8");
    for (let i = 0; i < w; i += 4) P(x + i, y + h - 6 - (i % 8 === 0 ? 1 : 0), 3, 2, "#d8c79e");
    // 수초
    plant(x + 8, y + h - 6, 12); plant(x + w - 12, y + h - 6, 16); plant(x + w / 2, y + h - 6, 10);
    // 물고기
    ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, w - 2, h - 7); ctx.clip();
    for (const f of fish) drawFish(ctx, f.type, f.x, f.y, f.s, f.dir, t);
    ctx.restore();
    // 유리 광택 & 테두리
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + 14, y + 2); ctx.lineTo(x + 2, y + 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = th.border; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // 작은 기포
    for (let i = 0; i < 3; i++) {
      const bx = x + 10 + i * 6, by = y + h - 8 - ((t * 0.6 + i * 20) % (h - 10));
      P(bx, by, 1, 1, "rgba(255,255,255,0.8)");
    }
  }
  function plant(x, base, hh) {
    ctx.fillStyle = "#3ba55a";
    for (let i = 0; i < hh; i += 2) {
      const off = Math.sin((base - i) * 0.4 + t * 0.05) * 2;
      P(x + off, base - i, 2, 2, i < hh * 0.4 ? "#57c97a" : "#3ba55a");
    }
  }

  function drawProps() {
    if (!hb("mug")) { // 머그컵
      const o = boff("mug"), mw = (easter.mug ? Math.sin(easter.mug * 0.5) * 1.5 : 0) + o.dx, my = o.dy;
      P(220 + mw, 102 + my, 9, 10, "#ff9ab0"); P(220 + mw, 102 + my, 9, 2, "#ffc2d0");
      P(229 + mw, 104 + my, 3, 5, "#ff9ab0"); P(222 + mw, 100 + my, 5, 2, "rgba(255,255,255,0.6)");
    }
    if (!hb("plant")) { // 화분
      const o = boff("plant"), ox = o.dx, oy = o.dy, pw = easter.plant ? Math.sin(easter.plant * 0.6) * 2 : 0;
      P(128 + ox, 100 + oy, 12, 12, "#e88f5a"); P(128 + ox, 100 + oy, 12, 3, "#f2a875");
      for (let i = 0; i < 5; i++) { const a = -1 + i * 0.5; P(134 + ox + Math.sin(a) * 5 + pw, 94 + oy - Math.abs(Math.cos(a)) * 6, 2, 8, "#4bb15f"); }
      P(133 + ox, 88 + oy, 4, 4, "#6fd07a");
    }
    if (!hb("frame")) { const o = boff("frame"); P(300 + o.dx, 96 + o.dy, 14, 16, "#ffffff"); P(302 + o.dx, 98 + o.dy, 10, 9, "#bfe6ff"); P(303 + o.dx, 104 + o.dy, 8, 3, "#7ec98a"); } // 탁상 액자
    if (!hb("lamp")) { const o = boff("lamp"); P(44 + o.dx, 88 + o.dy, 3, 24, "#cfe2f2"); P(40 + o.dx, 84 + o.dy, 11, 5, "#eaf5ff"); P(41 + o.dx, 88 + o.dy, 9, 2, "#ffe6a0"); } // 데스크 램프
  }

  // ============================================================
  //  천장 조명 (어항 위) — 스위치처럼 클릭 on/off
  // ============================================================
  const ROOMLIGHT = { x: 271, y: 15, hit: { x: 259, y: 0, w: 24, h: 24 } };  // 어항 위
  function lightOn() { const L = window.App.state.lights || {}; return L.room !== false; }
  function toggleLight() { const L = window.App.state.lights || (window.App.state.lights = {}); L.room = !lightOn(); window.App.save(); window.Audio2.blip(L.room ? 720 : 300); draw(); }
  function drawCeilingLamp() {
    const cx = ROOMLIGHT.x, sy = ROOMLIGHT.y, on = lightOn();
    P(cx, 0, 1, sy - 6, "#7a828c");                                          // 전선
    ctx.fillStyle = window.Skins.lamp("#d9dee4"); ctx.beginPath(); ctx.moveTo(cx - 9, sy + 2); ctx.lineTo(cx - 4, sy - 6); ctx.lineTo(cx + 5, sy - 6); ctx.lineTo(cx + 10, sy + 2); ctx.closePath(); ctx.fill(); // 갓(스킨)
    P(cx - 9, sy + 1, 19, 1, "#aab4bd"); P(cx - 4, sy - 6, 9, 1, "#eef2f6");
    P(cx - 2, sy + 2, 5, 3, on ? "#fff3b0" : "#8a8f97");                     // 전구
    if (on) { P(cx - 1, sy + 2, 3, 2, "#fffbe0"); }
  }
  // 조명 꺼졌을 때 창문으로 들어오는 은은한 빛 (밤=달빛 / 낮=햇빛)
  function windowGlow(r, night) {
    const moon = night > 0.5, col = moon ? "150,180,235" : "255,238,196", a = moon ? 0.20 : 0.15;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const gr = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(r.w, r.h) * 1.5);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(${col},${a * 0.55})`;   // 바닥으로 떨어지는 빛줄기
    ctx.beginPath(); ctx.moveTo(r.x + 2, r.y + r.h); ctx.lineTo(r.x + r.w - 2, r.y + r.h); ctx.lineTo(r.x + r.w + 18, H); ctx.lineTo(r.x - 18, H); ctx.closePath(); ctx.fill();
  }
  // ============================================================
  //  조명 오버레이 (조명 스위치 + 밤/비/눈)
  // ============================================================
  function drawLighting() {
    const night = window.WindowSky.nightness();   // 0 낮 → 1 밤 (연속)
    const on = lightOn();
    if (on) {
      // 천장에서 따뜻한 빛이 아래로 퍼짐
      const gr = ctx.createRadialGradient(ROOMLIGHT.x, ROOMLIGHT.y + 2, 8, ROOMLIGHT.x, ROOMLIGHT.y + 2, 170);
      gr.addColorStop(0, "rgba(255,244,206,0.30)"); gr.addColorStop(1, "rgba(255,244,206,0)");
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      if (night > 0.02) { ctx.fillStyle = `rgba(20,30,70,${0.10 * night})`; P(0, 0, W, H, ctx.fillStyle); } // 켜져 있어 밤에도 밝음
    } else {
      // 조명 꺼짐 → 어두움 (밤일수록 더) + 창문으로 은은한 달빛/햇빛
      ctx.fillStyle = `rgba(10,14,34,${0.34 + 0.28 * night})`; P(0, 0, W, H, ctx.fillStyle);
      windowGlow(WIN_IN, night);
    }
    // 데스크 램프·모니터 빛 (밤에 은은히 — 조명과 무관하게)
    if (night > 0.02) {
      const grd = ctx.createRadialGradient(45, 90, 4, 45, 90, 40);
      grd.addColorStop(0, `rgba(255,220,150,${0.35 * night})`); grd.addColorStop(1, "rgba(255,220,150,0)");
      ctx.fillStyle = grd; ctx.fillRect(0, 55, 100, 90);
      const gm = ctx.createRadialGradient(COMP.x + COMP.w / 2, COMP.y + 20, 4, COMP.x + COMP.w / 2, COMP.y + 20, 45);
      gm.addColorStop(0, `rgba(150,210,255,${0.25 * night})`); gm.addColorStop(1, "rgba(150,210,255,0)");
      ctx.fillStyle = gm; ctx.fillRect(COMP.x - 40, COMP.y - 20, COMP.w + 80, 90);
    }
    if (weather === "rain") { ctx.fillStyle = "rgba(40,60,80,0.18)"; P(0, 0, W, H, ctx.fillStyle); }
    else if (weather === "snow") { ctx.fillStyle = "rgba(200,220,240,0.12)"; P(0, 0, W, H, ctx.fillStyle); }
  }

  // ============================================================
  //  물고기 로직
  // ============================================================
  function seedFish() {
    fish = [];
    const roster = (window.App.state.aquarium.fish || ["nemo"]).slice(0, 14);
    for (let i = 0; i < roster.length; i++) {
      const type = roster[i];
      const small = (type === "shrimp" || type === "crab");
      fish.push({
        type,
        x: TANK.x + 10 + rnd(TANK.w - 20),
        y: TANK.y + 8 + rnd(TANK.h - 20),
        vx: (rnd(1) > 0.5 ? 1 : -1) * (0.25 + rnd(0.35)),
        vy: (rnd(1) - 0.5) * 0.2,
        s: small ? 3.5 + rnd(1.5) : 4 + rnd(2.5),
        dir: 1, dir2: rnd(1) > 0.5 ? 1 : -1,
      });
    }
  }
  const TANK_BOUNDS = { get x0() { return TANK.x + 4; }, get x1() { return TANK.x + TANK.w - 4; }, get y0() { return TANK.y + 5; }, get y1() { return TANK.y + TANK.h - 6; }, speed: 0.85 };
  function stepFish() { for (const f of fish) window.FishSprite.step(f, TANK_BOUNDS, t); }

  // ============================================================
  //  메인 렌더
  // ============================================================
  // ===== 꾸미기 데코 =====
  // 기존 소품(숨김 가능). 컴퓨터·어항은 기능이 있으므로 제외(고정)
  const BUILTINS = [
    { id: "mug", box: { x: 218, y: 99, w: 14, h: 14 } },
    { id: "plant", box: { x: 126, y: 86, w: 16, h: 27 } },
    { id: "frame", box: { x: 299, y: 95, w: 16, h: 18 } },
    { id: "lamp", box: { x: 39, y: 83, w: 13, h: 30 } },
    { id: "wallclock", box: { x: 163, y: 7, w: 26, h: 26 } },
    { id: "rug", box: { x: 22, y: 157, w: 136, h: 22 } },
  ];
  function hb(id) { const h = window.App.state.hiddenBuiltins || {}; return !!h[id]; }
  function boff(id) { const bp = window.App.state.builtinPos; return (bp && bp[id]) || { dx: 0, dy: 0 }; }
  function getOff(id) { const bp = window.App.state.builtinPos || (window.App.state.builtinPos = {}); return bp[id] || (bp[id] = { dx: 0, dy: 0 }); }
  function biBox(id) { const bi = BUILTINS.find((b) => b.id === id), o = boff(id); return { x: bi.box.x + o.dx, y: bi.box.y + o.dy, w: bi.box.w, h: bi.box.h }; }
  function decorBox(d) { return { x: d.x - 15, y: d.y - 28, w: 30, h: 32 }; }
  function drawDecor() {
    const decor = window.App.state.decor || {};
    for (const id in decor) {
      const d = decor[id]; if (!d.owned) continue;
      if (d.hidden || d.x == null) continue;   // 숨김/미배치는 안 그림
      const item = window.Decor.byId(id); if (!item) continue;
      const wob = decorWob[id] || 0;
      if (wob > 0 && item.squishy) {
        const st = Math.sin((wob / 18) * Math.PI);
        ctx.save(); ctx.translate(d.x, d.y); ctx.scale(1 + st * 0.42, 1 - st * 0.3); ctx.translate(-d.x, -d.y);
        item.draw(ctx, d.x, d.y); ctx.restore();
      } else {
        const wx = wob > 0 ? Math.sin(wob * 0.7) * 2 : 0, wy = wob > 0 ? -Math.abs(Math.sin(wob * 0.5)) : 0;
        item.draw(ctx, d.x + wx, d.y + wy);
      }
      if (editMode) {
        const b = decorBox(d);
        ctx.strokeStyle = (drag && drag.id === id) ? "#ffd23f" : "rgba(255,255,255,0.8)"; ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]); ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h); ctx.setLineDash([]);
      }
    }
    // 편집 중 기존 소품(보이는 것만) 이동 박스
    if (editMode) {
      for (const bi of BUILTINS) {
        if (hb(bi.id)) continue;   // 숨긴 소품은 안 보임 (팔레트로 다시 켜기)
        const b = biBox(bi.id), dragging = drag && drag.builtin === bi.id;
        ctx.strokeStyle = dragging ? "#ffd23f" : "rgba(120,210,255,0.9)"; ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]); ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h); ctx.setLineDash([]);
      }
    }
  }
  // 팔레트용 기본 소품 아이콘 (바닥 앵커 0,0)
  const BI_NAME = { mug: "머그컵", plant: "화분", frame: "액자", lamp: "램프", wallclock: "벽시계", rug: "러그" };
  function builtinIcon(id, g) {
    const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    if (id === "mug") { p(-4, -9, 9, 10, "#ff9ab0"); p(-4, -9, 9, 2, "#ffc2d0"); p(5, -7, 3, 5, "#ff9ab0"); }
    else if (id === "plant") { p(-6, -2, 12, 5, "#e88f5a"); p(-6, -2, 12, 2, "#f2a875"); for (let i = 0; i < 5; i++) { const a = -1 + i * 0.5; p(Math.sin(a) * 5, -4 - Math.abs(Math.cos(a)) * 8, 2, 9, "#4bb15f"); } }
    else if (id === "frame") { p(-7, -15, 14, 15, "#8a5a30"); p(-5, -13, 10, 11, "#bfe6ff"); p(-4, -6, 8, 4, "#7ec98a"); p(2, -11, 2, 2, "#ffe680"); }
    else if (id === "lamp") { p(-1, -14, 3, 14, "#cfe2f2"); p(-5, -18, 11, 5, "#eaf5ff"); p(-4, -14, 9, 2, "#ffe6a0"); }
    else if (id === "wallclock") { g.fillStyle = "#fff"; g.beginPath(); g.arc(0, -8, 8, 0, 7); g.fill(); g.strokeStyle = "#9cc2da"; g.lineWidth = 1; g.stroke(); g.strokeStyle = "#2b4658"; g.beginPath(); g.moveTo(0, -8); g.lineTo(0, -13); g.moveTo(0, -8); g.lineTo(4, -8); g.stroke(); }
    else if (id === "rug") { g.fillStyle = "#bfe6d8"; g.beginPath(); g.ellipse(0, -3, 13, 5, 0, 0, 7); g.fill(); g.fillStyle = "#a6dcc9"; g.beginPath(); g.ellipse(0, -3, 8, 3, 0, 0, 7); g.fill(); }
  }
  function pickDecor(vx, vy) {
    const decor = window.App.state.decor || {}; let hit = null;
    for (const id in decor) { const d = decor[id]; if (!d.owned || d.hidden) continue; const b = decorBox(d); if (vx >= b.x && vx <= b.x + b.w && vy >= b.y && vy <= b.y + b.h) hit = id; }
    return hit;   // 뒤쪽(위에 그려진) 것이 우선
  }
  function pickBuiltin(vx, vy) {
    for (let i = BUILTINS.length - 1; i >= 0; i--) { if (hb(BUILTINS[i].id)) continue; const b = biBox(BUILTINS[i].id); if (vx >= b.x && vx <= b.x + b.w && vy >= b.y && vy <= b.y + b.h) return BUILTINS[i].id; }
    return null;
  }
  function setEditMode(b) { editMode = b; if (!b) drag = null; draw(); }
  function placeItem(id) { const it = window.Decor.byId(id); if (!it) return; window.App.state.decor[id] = { owned: true, x: it.def.x, y: it.def.y, hidden: false }; window.App.save(); draw(); }
  function paletteList() {
    const list = [], decor = window.App.state.decor || {};
    for (const id in decor) { if (!decor[id] || !decor[id].owned) continue; const it = window.Decor.byId(id); if (!it) continue; list.push({ id, name: it.name, cat: it.cat, on: !decor[id].hidden, iconDraw: (g) => it.draw(g, 0, 0) }); }
    for (const bi of BUILTINS) list.push({ id: "@" + bi.id, name: BI_NAME[bi.id], cat: "builtin", on: !hb(bi.id), iconDraw: (g) => builtinIcon(bi.id, g) });
    return list;
  }
  function toggleItem(id) {
    if (id[0] === "@") { const bid = id.slice(1); const h = window.App.state.hiddenBuiltins || (window.App.state.hiddenBuiltins = {}); h[bid] = !h[bid]; window.App.save(); draw(); return !h[bid]; }
    const d = window.App.state.decor[id]; if (!d || !d.owned) return false;
    d.hidden = !d.hidden;
    if (!d.hidden && d.x == null) { const it = window.Decor.byId(id); if (it) { d.x = it.def.x; d.y = it.def.y; } }  // 좌표 없으면 기본 위치
    window.App.save(); draw(); return !d.hidden;
  }
  function revertRoom() {   // 꾸미기 물품 두기 전으로 (배치 아이템 끄고, 기본 소품 원위치·표시)
    const d = window.App.state.decor || {};
    for (const id in d) if (d[id] && d[id].owned) d[id].hidden = true;
    window.App.state.hiddenBuiltins = {}; window.App.state.builtinPos = {};
    window.App.save(); draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawRoomBase();
    drawWindow();
    if (!hb("wallclock")) drawWallClock();
    drawDesk();
    drawProps();
    drawComputer();
    drawTank();
    drawDecor();
    drawCeilingLamp();
    drawLighting();
  }

  let last = 0;
  function loop(ts) {
    if (!running) return;
    if (ts - last > 33) {                 // ~30fps
      last = ts; t++;
      stepFish();
      for (const k in easter) { if (easter[k] > 0) easter[k]--; else delete easter[k]; }
      for (const k in decorWob) { if (decorWob[k] > 0) decorWob[k]--; else delete decorWob[k]; }
      draw();
    }
    requestAnimationFrame(loop);
  }

  // ============================================================
  //  입력 (클릭 → 어항/컴퓨터/소품)
  // ============================================================
  function toVirtual(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * W;
    const y = (e.clientY - r.top) / r.height * H;
    return { x, y };
  }
  function inRect(px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }

  function onMove(e) {
    const { x, y } = toVirtual(e);
    if (editMode) { canvas.style.cursor = (pickDecor(x, y) || pickBuiltin(x, y)) ? "grab" : "default"; return; }
    let h = null;
    if (inRect(x, y, ROOMLIGHT.hit)) h = "light";
    else if (inRect(x, y, TANK)) h = "aquarium";
    else if (inRect(x, y, { x: COMP.x, y: COMP.y, w: COMP.w, h: COMP.h + 8 })) h = "computer";
    hover = h;
    canvas.style.cursor = h ? "pointer" : "default";
  }
  function onClick(e) {
    if (editMode) return;   // 편집 중엔 이동 안 함
    window.Audio2.ensure();
    const { x, y } = toVirtual(e);
    if (inRect(x, y, ROOMLIGHT.hit)) { toggleLight(); return; }   // 천장 조명 스위치
    if (inRect(x, y, TANK)) { window.Audio2.blip(660); cb.onAquarium && cb.onAquarium(); return; }
    if (inRect(x, y, { x: COMP.x, y: COMP.y, w: COMP.w, h: COMP.h + 8 })) { window.Audio2.blip(500); cb.onComputer && cb.onComputer(); return; }
    // 배치한 데코 상호작용(흔들+소리) — 러그 제외
    const did = pickDecor(x, y);
    if (did && !did.startsWith("rug")) { decorWob[did] = 18; const dit = window.Decor.byId(did); if (dit && dit.squishy) window.Audio2.squish(); else window.Audio2.blip(560 + (did.length % 4) * 70); return; }
    // 기존 소품 상호작용 — 현재 위치 기준 + 숨긴 건 반응/소리 없음
    const bhit = pickBuiltin(x, y);
    if (bhit && !hb(bhit) && bhit !== "rug") {
      if (bhit === "mug") { easter.mug = 20; window.Audio2.blip(880); }
      else if (bhit === "plant") { easter.plant = 20; window.Audio2.blip(440); }
      else window.Audio2.blip(640);
    }
  }
  // 편집: 드래그 이동 + 우클릭 숨김/보임
  function onDown(e) {
    if (!editMode) return;
    const { x, y } = toVirtual(e); const id = pickDecor(x, y);
    if (id) { const d = window.App.state.decor[id]; drag = { id, dx: d.x - x, dy: d.y - y }; canvas.style.cursor = "grabbing"; draw(); return; }
    const bid = pickBuiltin(x, y);
    if (bid) { const o = getOff(bid); drag = { builtin: bid, sx: x, sy: y, odx: o.dx, ody: o.dy }; canvas.style.cursor = "grabbing"; draw(); }
  }
  function onDrag(e) {
    if (!editMode || !drag) return;
    const { x, y } = toVirtual(e);
    if (drag.builtin) { const o = getOff(drag.builtin); o.dx = drag.odx + (x - drag.sx); o.dy = drag.ody + (y - drag.sy); draw(); return; }
    const d = window.App.state.decor[drag.id];
    d.x = Math.max(8, Math.min(W - 8, x + drag.dx)); d.y = Math.max(22, Math.min(H - 4, y + drag.dy));
    draw();
  }
  function onUp() { if (drag) { drag = null; window.App.save(); draw(); } }
  function onContext(e) {
    if (!editMode) return; e.preventDefault();
    const { x, y } = toVirtual(e); const id = pickDecor(x, y);
    if (id) { const d = window.App.state.decor[id]; d.hidden = !d.hidden; window.App.save(); draw(); return; }   // 숨김/보임 무음
    const bid = pickBuiltin(x, y);
    if (bid) { const h = window.App.state.hiddenBuiltins || (window.App.state.hiddenBuiltins = {}); h[bid] = !h[bid]; window.App.save(); draw(); }
  }

  // ============================================================
  //  유틸
  // ============================================================
  function rnd(n) { return Math.random() * n; }
  function mix(a, b, f) {
    const ca = hex(a), cb2 = hex(b);
    const r = Math.round(ca[0] + (cb2[0] - ca[0]) * f);
    const g = Math.round(ca[1] + (cb2[1] - ca[1]) * f);
    const bl = Math.round(ca[2] + (cb2[2] - ca[2]) * f);
    return `rgb(${r},${g},${bl})`;
  }
  function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  // ============================================================
  //  공개 API
  // ============================================================
  function setWeather(w) {
    weather = w;
    seedOut();
    if (ctx) draw();            // 즉시 1프레임 반영 (루프와 무관하게 반응)
    // 방에 있을 때 환경음
    if (running) applyAmbient();
  }
  function applyAmbient() {
    if (weather === "rain") window.Audio2.setAmbient("rain");
    else if (weather === "sunny" || weather === "rainbow") window.Audio2.setAmbient("wind");
    else window.Audio2.setAmbient("water");
  }

  window.Room = {
    init(callbacks) {
      cb = callbacks || {};
      canvas = document.getElementById("room-canvas");
      ctx = canvas.getContext("2d");
      canvas.width = W; canvas.height = H;
      ctx.imageSmoothingEnabled = false;
      weather = window.App.state.weather || "sunny";
      seedFish(); seedOut();
      canvas.addEventListener("mousemove", onMove);
      canvas.addEventListener("click", onClick);
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onDrag);
      window.addEventListener("pointerup", onUp);
      canvas.addEventListener("contextmenu", onContext);
      draw();
    },
    start() { seedFish(); if (!running) { running = true; last = 0; requestAnimationFrame(loop); applyAmbient(); } draw(); },
    stop() { running = false; editMode = false; drag = null; },
    setEditMode,
    placeItem,
    paletteList,
    toggleItem,
    revertRoom,
    get editing() { return editMode; },
    setWeather,
    get weather() { return weather; },
  };
})();
