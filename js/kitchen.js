/* ============================================================
   부엌 (픽셀 · 명암/디테일) — window.Kitchen
   냉장고(냉장/냉동 2칸, 아랫칸 유리로 음식) · 싱크대 · 전자레인지 · 가스레인지
   간이 창문(날씨+시간대 반영)
   ============================================================ */
(function () {
  "use strict";
  const W = 320, H = 180;
  let canvas, ctx, running = false, t = 0, last = 0;
  let weather = "sunny";
  let fridgeAnim = 0, fridgeTarget = 0, foodShown = false;
  let microFlash = 0, stoveOn = false, sinkSplash = 0;
  let curCuisine = "all", currentFood = null, recentFood = [];
  let editMode = false, drag = null, decorWob = {};
  let pop, foodCanvas, foodName, foodCuisine;
  function dmap() { return window.App.state.decorKitchen || (window.App.state.decorKitchen = {}); }

  // 부엌 기본물건(이동/제거 가능): 창가 식물
  const KBUILTINS = [{ id: "plant", box: { x: 145, y: 62, w: 18, h: 18 } }];
  const KBI_NAME = { plant: "식물" };
  function khb(id) { const h = window.App.state.hiddenBuiltinsKitchen || {}; return !!h[id]; }
  function kboff(id) { const bp = window.App.state.builtinPosKitchen; return (bp && bp[id]) || { dx: 0, dy: 0 }; }
  function kgetOff(id) { const bp = window.App.state.builtinPosKitchen || (window.App.state.builtinPosKitchen = {}); return bp[id] || (bp[id] = { dx: 0, dy: 0 }); }
  function kbiBox(id) { const bi = KBUILTINS.find((b) => b.id === id), o = kboff(id); return { x: bi.box.x + o.dx, y: bi.box.y + o.dy, w: bi.box.w, h: bi.box.h }; }
  function pickKBuiltin(x, y) { for (let i = KBUILTINS.length - 1; i >= 0; i--) { if (khb(KBUILTINS[i].id)) continue; const b = kbiBox(KBUILTINS[i].id); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return KBUILTINS[i].id; } return null; }
  // 창가 화분 (오프셋 적용). ax,ay = 화분 좌하단 기준 근처
  function drawKPlant() {
    const o = kboff("plant"), ax = 148 + o.dx, ay = WIN.y + WIN.h - 2 + o.dy;
    P(ax, ay, 10, 6, "#e88f5a"); P(ax, ay, 10, 2, "#f2a875");                        // 화분
    for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.6; P(ax + 3 + Math.sin(a) * 4, ay - 6 - Math.abs(Math.cos(a)) * 5, 2, 7, "#4bb15f"); }
    P(ax + 3, ay - 9, 2, 2, "#ff9ab0"); P(ax + 6, ay - 8, 2, 2, "#ffd23f");           // 꽃
  }
  function kbuiltinIcon(id, g) {
    if (id === "plant") { g.fillStyle = "#e88f5a"; g.fillRect(-6, -2, 12, 5); g.fillStyle = "#f2a875"; g.fillRect(-6, -2, 12, 2); for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.6; g.fillStyle = "#4bb15f"; g.fillRect(-2 + Math.sin(a) * 5, -6 - Math.abs(Math.cos(a)) * 6, 2, 8); } g.fillStyle = "#ff9ab0"; g.fillRect(-1, -10, 2, 2); }
  }

  // 천장 조명 (상단 좌측, 창문 피함) — 클릭 on/off
  const KLIGHT = { x: 108, y: 14, hit: { x: 96, y: 0, w: 24, h: 24 } };
  function kLightOn() { const L = window.App.state.lights || {}; return L.kitchen !== false; }
  function kToggleLight() { const L = window.App.state.lights || (window.App.state.lights = {}); L.kitchen = !kLightOn(); window.App.save(); window.Audio2.blip(L.kitchen ? 720 : 300); draw(); }
  function drawKLamp() {
    const cx = KLIGHT.x, sy = KLIGHT.y, on = kLightOn();
    P(cx, 0, 1, sy - 6, "#8a97a3");
    P(cx - 5, sy - 6, 10, 2, "#33373d");
    ctx.fillStyle = window.Skins.lamp("#eef2f6"); ctx.beginPath(); ctx.moveTo(cx - 10, sy + 3); ctx.lineTo(cx - 5, sy - 4); ctx.lineTo(cx + 5, sy - 4); ctx.lineTo(cx + 10, sy + 3); ctx.closePath(); ctx.fill(); // 갓(주방등·스킨)
    P(cx - 10, sy + 2, 21, 1, "#c9d2da"); P(cx - 5, sy - 4, 10, 1, "#ffffff");
    P(cx - 2, sy + 3, 5, 3, on ? "#fff3b0" : "#8a8f97"); if (on) P(cx - 1, sy + 3, 3, 2, "#fffbe0");
  }
  function drawKLighting() {
    const night = window.WindowSky.nightness(), on = kLightOn();
    if (on) {
      const gr = ctx.createRadialGradient(KLIGHT.x, KLIGHT.y + 2, 8, KLIGHT.x, KLIGHT.y + 2, 180);
      gr.addColorStop(0, "rgba(255,246,214,0.30)"); gr.addColorStop(1, "rgba(255,246,214,0)");
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      if (night > 0.02) { ctx.fillStyle = `rgba(20,30,60,${0.10 * night})`; ctx.fillRect(0, 0, W, H); }
    } else {
      ctx.fillStyle = `rgba(10,14,32,${0.32 + 0.28 * night})`; ctx.fillRect(0, 0, W, H);
      windowGlow(WIN, night);
    }
  }
  function windowGlow(r, night) {
    const moon = night > 0.5, col = moon ? "150,180,235" : "255,238,196", a = moon ? 0.20 : 0.15;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const gr = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(r.w, r.h) * 1.6);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(${col},${a * 0.55})`;
    ctx.beginPath(); ctx.moveTo(r.x + 2, r.y + r.h); ctx.lineTo(r.x + r.w - 2, r.y + r.h); ctx.lineTo(r.x + r.w + 16, H); ctx.lineTo(r.x - 16, H); ctx.closePath(); ctx.fill();
  }

  const FRIDGE = { x: 16, y: 28, w: 58, h: 122 };
  const SINK = { x: 86, y: 80, w: 48, h: 26 };
  const MICRO = { x: 150, y: 82, w: 52, h: 22 };
  const STOVE = { x: 232, y: 90, w: 66, h: 14 };
  const WIN = { x: 150, y: 24, w: 70, h: 48 };
  const COUNTER_Y = 104, FLOOR_Y = 150;

  function P(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

  // ============================================================
  //  벽 · 백스플래시 · 바닥 (명암)
  // ============================================================
  function drawBase() {
    // 벽 (벽지 스킨)
    const [wt, wm] = window.Skins.wall("#ece2cf", "#e4d9c2", "#e4d9c2");
    const [fc, fc2] = window.Skins.floor("#caa878", "#bd9968");
    P(0, 0, W, 40, wt); P(0, 40, W, 34, wm);
    // 백스플래시 타일
    P(0, 74, W, COUNTER_Y - 74, "#dfe8ec");
    for (let x = 0; x <= W; x += 12) P(x, 74, 1, COUNTER_Y - 74, "#c8d6dc");
    for (let y = 74; y <= COUNTER_Y; y += 10) P(0, y, W, 1, "#c8d6dc");
    for (let x = 2; x < W; x += 12) P(x, 76, 4, 1, "rgba(255,255,255,0.6)"); // 타일 하이라이트
    // 바닥 (체크 타일 + 명암)
    P(0, FLOOR_Y, W, H - FLOOR_Y, fc);
    for (let y = FLOOR_Y; y < H; y += 10) for (let x = ((y - FLOOR_Y) / 10 % 2) * 10; x < W; x += 20) P(x, y, 10, 10, fc2);
    P(0, FLOOR_Y, W, 2, "#a98a5a");                 // 걸레받이 그림자
    P(0, FLOOR_Y - 2, W, 2, "#d8c6a0");
  }

  function drawCounter() {
    // 상판 (하이라이트+그림자)
    P(78, COUNTER_Y - 4, W - 78, 4, "#e7edf2"); P(78, COUNTER_Y - 4, W - 78, 1, "#ffffff");
    P(78, COUNTER_Y, W - 78, 2, "#b9c4cd");
    // 하부장
    P(78, COUNTER_Y + 2, W - 78, FLOOR_Y - COUNTER_Y - 2, "#c7b088");
    P(78, COUNTER_Y + 2, W - 78, 2, "#d6c298");
    for (let x = 96; x < W; x += 44) { P(x, COUNTER_Y + 6, 2, FLOOR_Y - COUNTER_Y - 10, "#a98a5a"); P(x - 20, COUNTER_Y + 6, 40, 2, "#b89a6a"); }
    for (let x = 110; x < W; x += 44) P(x, COUNTER_Y + 16, 4, 2, "#8a6a3a"); // 손잡이
  }

  function drawSink() {
    const cy = COUNTER_Y, bx = 110, st = window.Skins.theme("sink"); // 앞에서 본 싱크 + 수도꼭지
    // 카운터 위 개수구(앞모습)
    P(90, cy - 5, 42, 5, st.metal); P(90, cy - 5, 42, 1, st.metalHi); P(92, cy - 3, 38, 2, "#8f9aa4");
    // 수도꼭지: 세로 파이프
    P(bx, cy - 24, 3, 24, st.faucet); P(bx, cy - 24, 1, 24, st.metalHi);
    // 굽은 목(앞으로) + 스파우트(아래로)
    P(bx - 13, cy - 24, 16, 3, st.faucet); P(bx - 13, cy - 24, 16, 1, st.metalHi);
    P(bx - 13, cy - 24, 3, 12, st.faucet); P(bx - 13, cy - 24, 1, 12, st.metalHi);
    // 밸브 손잡이
    P(bx + 3, cy - 18, 6, 3, st.metal); P(bx + 3, cy - 18, 6, 1, st.metalHi);
    // 물줄기(수도꼭지에서 아래로)
    if (sinkSplash > 0) {
      const sx = bx - 12;
      for (let yy = cy - 12; yy < cy - 3; yy += 2) P(sx, yy, 2, 2, "rgba(150,215,245,0.9)");
      P(sx - 2, cy - 4, 6, 1, "rgba(190,232,248,0.85)");
      P(sx - 3, cy - 6, 1, 1, "rgba(190,232,248,0.7)"); P(sx + 4, cy - 6, 1, 1, "rgba(190,232,248,0.7)");
    }
  }

  function drawWindow() {
    // 창틀 (입체)
    P(WIN.x - 4, WIN.y - 4, WIN.w + 8, WIN.h + 8, "#efe8da");
    P(WIN.x - 4, WIN.y - 4, WIN.w + 8, 2, "#fdfaf2"); P(WIN.x - 4, WIN.y + WIN.h + 2, WIN.w + 8, 2, "#d8cdb8");
    const inner = { x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h };
    // 유리: 스킨 모양(아치/라운드)대로 클립 → 모서리는 창틀색 노출
    ctx.save();
    window.Skins.clipWindow(ctx, inner);
    window.WindowSky.draw(ctx, inner, weather, t);
    P(WIN.x + WIN.w / 2 - 1, WIN.y, 2, WIN.h, "#efe8da"); P(WIN.x, WIN.y + WIN.h / 2 - 1, WIN.w, 2, "#efe8da");   // 십자
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.beginPath(); ctx.moveTo(WIN.x, WIN.y); ctx.lineTo(WIN.x + 16, WIN.y); ctx.lineTo(WIN.x, WIN.y + 16); ctx.closePath(); ctx.fill();   // 유리 광택
    ctx.restore();
    // 창턱 (화분은 별도 drawKPlant 로)
    P(WIN.x - 6, WIN.y + WIN.h + 4, WIN.w + 12, 4, "#e7dcc4"); P(WIN.x - 6, WIN.y + WIN.h + 8, WIN.w + 12, 2, "#c9b48f");
  }

  // ============================================================
  //  냉장고 (냉장/냉동 2칸 · 아랫칸 유리)
  // ============================================================
  // 냉장고 속 식재료
  function apple(px, py) { P(px, py, 7, 7, "#e0402c"); P(px + 1, py - 1, 5, 2, "#e0402c"); P(px + 3, py - 3, 1, 3, "#6a4a2a"); P(px + 4, py - 3, 2, 1, "#4bb15f"); P(px + 1, py + 1, 2, 1, "rgba(255,255,255,0.45)"); }
  function carrot(px, py) { ctx.fillStyle = "#f08a2a"; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 5, py); ctx.lineTo(px + 2, py + 9); ctx.closePath(); ctx.fill(); P(px + 1, py - 3, 1, 3, "#4bb15f"); P(px + 3, py - 3, 1, 3, "#4bb15f"); P(px + 2, py - 2, 1, 2, "#57c97a"); }
  function tomato(px, py) { P(px, py, 7, 6, "#e0492c"); P(px + 2, py - 1, 3, 1, "#4bb15f"); P(px + 1, py, 2, 1, "rgba(255,255,255,0.45)"); }
  function milk(px, py) { P(px, py, 8, 12, "#f4f8fb"); P(px + 1, py - 2, 6, 2, "#e8eef4"); P(px + 2, py - 4, 4, 2, "#e8eef4"); P(px, py + 5, 8, 3, "#5a9bd4"); P(px, py, 1, 12, "rgba(255,255,255,0.5)"); }
  function cabbage(px, py) {   // 양배추
    ctx.fillStyle = "#3f9e4f"; ctx.beginPath(); ctx.arc(px + 5, py + 5, 5, 0, 7); ctx.fill();        // 겉잎
    ctx.fillStyle = "#7bc86a"; ctx.beginPath(); ctx.arc(px + 5, py + 5, 3.4, 0, 7); ctx.fill();      // 속
    ctx.strokeStyle = "#4fae5c"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px + 5, py + 1); ctx.lineTo(px + 5, py + 9); ctx.moveTo(px + 1, py + 5); ctx.lineTo(px + 9, py + 5); ctx.stroke(); // 잎맥
    P(px + 3, py + 2, 2, 1, "rgba(255,255,255,0.4)");
  }
  function eggs(px, py) { P(px, py, 16, 6, "#e8e2d0"); for (let i = 0; i < 3; i++) { ctx.fillStyle = "#fffdf5"; ctx.beginPath(); ctx.ellipse(px + 3 + i * 5, py + 3, 2, 2.5, 0, 0, 7); ctx.fill(); } }
  function bottle(px, py) { P(px + 1, py, 5, 4, "#cdd8e2"); P(px + 2, py - 3, 3, 3, "#aab8c4"); P(px + 1, py + 4, 5, 10, "#f0a53a"); P(px + 2, py + 5, 1, 8, "rgba(255,255,255,0.45)"); }
  function fridgeFood(fx, fy) {
    const ix = fx + 6, s0 = fy + 30, s1 = fy + 60, s2 = fy + 90, floor = fy + 116;  // 선반 윗면 / 바닥
    // 각 아이템 바닥이 선반(또는 바닥)에 닿도록 배치
    apple(ix + 2, s0 - 7); carrot(ix + 16, s0 - 9); tomato(ix + 31, s0 - 6);
    milk(ix + 2, s1 - 12); cabbage(ix + 24, s1 - 10);
    eggs(ix + 2, s2 - 6); bottle(ix + 30, s2 - 14);
    carrot(ix + 4, floor - 9); cabbage(ix + 16, floor - 10); apple(ix + 32, floor - 7);
  }

  function drawFridge() {
    const { x, y, w, h } = FRIDGE;
    const th = window.Skins.theme("fridge");
    P(x + 3, y + 4, w, h, "rgba(60,80,90,0.12)");               // 그림자
    P(x + 2, y + 2, w - 4, h - 4, "#eef4f8");                   // 내부 배경
    if (fridgeAnim > 0.05) {                                    // 열렸을 때 내부
      ctx.fillStyle = `rgba(255,244,200,${0.5 * fridgeAnim})`; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      for (let i = 0; i < 3; i++) { P(x + 4, y + 30 + i * 30, w - 8, 2, "#d4e2ec"); P(x + 4, y + 32 + i * 30, w - 8, 1, "#bcd0dc"); }
      fridgeFood(x, y);
      ctx.fillStyle = `rgba(255,246,205,${0.35 * fridgeAnim})`;  // 빛줄기
      ctx.beginPath(); ctx.moveTo(x + w, y + 8); ctx.lineTo(x + w + 48 * fridgeAnim, y - 10); ctx.lineTo(x + w + 48 * fridgeAnim, y + h + 14); ctx.lineTo(x + w, y + h - 6); ctx.closePath(); ctx.fill();
    }
    // 문 (하얀 불투명, 열리면 폭 축소)
    const dw = (w - 2) * (1 - fridgeAnim * 0.86);
    if (dw > 1) {
      const fh = Math.round(h * 0.36);
      P(x, y, dw, fh, th.body); P(x, y, Math.min(dw, 2), fh, th.hi); P(x + dw - 2, y, 2, fh, th.edge); // 냉동칸
      P(x, y + fh - 2, dw, 2, th.edge);
      const by = y + fh, bh = h - fh;
      P(x, by, dw, bh, th.body); P(x, by, Math.min(dw, 2), bh, th.hi); P(x + dw - 2, by, 2, bh, th.edge); // 냉장칸
      if (dw > 12) { P(x + dw - 6, y + 8, 2, fh - 16, "#aab8c4"); P(x + dw - 6, by + 10, 2, bh - 20, "#aab8c4"); } // 손잡이
      if (dw > 16) P(x + 6, by + 8, dw - 16, 1, "#e4ecf2");     // 살짝 라벨선
    }
    P(x, y, w, 1, th.hi); P(x, y, 1, h, th.hi); P(x + w - 1, y, 1, h, th.edge); P(x, y + h - 1, w, 1, th.edge);
  }

  function drawMicro() {
    const { x, y, w, h } = MICRO, mt = window.Skins.theme("microwave");
    P(x + 2, y + 2, w, h, "rgba(60,80,90,0.12)");     // 그림자
    P(x, y, w, h, mt.body); P(x, y, w, 2, mt.hi); P(x, y + h - 2, w, 2, mt.edge);
    P(x + 3, y + 4, w - 20, h - 7, "#23272d");        // 창(어둠)
    P(x + 4, y + 5, w - 22, 2, "#3a4048");
    if (microFlash > 0) { ctx.fillStyle = `rgba(255,220,120,${microFlash / 22})`; ctx.fillRect(x + 4, y + 5, w - 22, h - 9); }
    P(x + w - 14, y + 4, 10, h - 8, mt.edge);          // 키패드
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) P(x + w - 12 + j * 4, y + 6 + i * 4, 2, 2, "#8894a0");
  }

  function drawFlame(cx, baseY) {
    // baseY = 화구 표면. 불꽃은 그 위(y가 작아지는 방향)로 솟는다.
    ctx.fillStyle = "rgba(255,160,60,0.18)"; ctx.beginPath(); ctx.arc(cx, baseY - 6, 9, 0, 7); ctx.fill(); // 빛무리
    for (let i = -1; i <= 1; i++) {
      const fx = cx + i * 3;
      const hh = 8 + ((t + i * 5) % 3) + (i === 0 ? 3 : 0);   // 가운데가 더 큼 + 깜빡
      ctx.fillStyle = "#ff8a2a"; ctx.beginPath(); ctx.moveTo(fx - 2, baseY); ctx.quadraticCurveTo(fx, baseY - hh - 2, fx + 2, baseY); ctx.closePath(); ctx.fill(); // 주황 몸통
      ctx.fillStyle = "#ffe14a"; ctx.beginPath(); ctx.moveTo(fx - 1, baseY); ctx.quadraticCurveTo(fx, baseY - hh + 1, fx + 1, baseY); ctx.closePath(); ctx.fill(); // 노랑 심
      ctx.fillStyle = "#4aa0ee"; ctx.fillRect(fx - 2, baseY - 2, 4, 2);  // 파란 밑동
    }
  }
  function drawStove() {
    const { x, y, w, h } = STOVE;
    // 몸체
    P(x, y, w, h, "#464b53"); P(x, y, w, 2, "#565d66"); P(x, y + h - 2, w, 2, "#33373d");
    // 화구 2개 (쿡탑 윗면에 얹힘) — 불꽃은 이 위로
    [x + 18, x + 48].forEach((bx) => {
      ctx.fillStyle = "#2a2e34"; ctx.beginPath(); ctx.ellipse(bx, y + 1, 8, 2.5, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "#565d66"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(bx, y + 1, 5, 1.5, 0, 0, 7); ctx.stroke();
      if (stoveOn) drawFlame(bx, y);
    });
    // 노브 (앞면)
    P(x + 10, y + h - 4, 5, 4, stoveOn ? "#ff7a3a" : "#cdd6de"); P(x + w - 15, y + h - 4, 5, 4, "#cdd6de");
    P(x + 11, y + h - 3, 1, 2, "#8894a0"); P(x + w - 14, y + h - 3, 1, 2, "#8894a0");
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBase();
    drawKLamp();
    drawWindow();
    if (!khb("plant")) drawKPlant();
    drawCounter();
    drawSink();
    drawMicro();
    drawStove();
    drawFridge();
    window.DecorLayer.render(ctx, dmap(), editMode, drag && drag.id, decorWob);
    if (editMode) {   // 기본물건(식물) 편집 박스
      for (const bi of KBUILTINS) { if (khb(bi.id)) continue; const b = kbiBox(bi.id), dr = drag && drag.builtin === bi.id; ctx.strokeStyle = dr ? "#ffd23f" : "rgba(120,210,255,0.9)"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h); ctx.setLineDash([]); }
    }
    drawKLighting();
  }

  function loop(ts) {
    if (!running) return;
    if (ts - last > 33) { last = ts; t++; fridgeAnim += (fridgeTarget - fridgeAnim) * 0.2; if (microFlash > 0) microFlash--; if (sinkSplash > 0) sinkSplash--; for (const k in decorWob) { if (decorWob[k] > 0) decorWob[k]--; else delete decorWob[k]; } draw(); }
    requestAnimationFrame(loop);
  }

  // ---- 음식 추천 ----
  function showFood() {
    const pool = curCuisine === "all" ? window.Foods.FOODS : window.Foods.FOODS.filter((f) => f.c === curCuisine);
    let f, tries = 0;
    do { f = pool[Math.floor(Math.random() * pool.length)]; tries++; }
    while (recentFood.includes(f.n) && tries < 30 && pool.length > recentFood.length);
    recentFood.push(f.n);
    while (recentFood.length > Math.min(10, pool.length - 1)) recentFood.shift();  // 최근 것 회피
    currentFood = f;
    window.Foods.draw(foodCanvas, currentFood);
    foodName.textContent = `오늘은 '${currentFood.n}' 어때요?`;
    foodCuisine.textContent = window.Foods.label[currentFood.c];
    pop.classList.remove("hidden");
  }
  function openFridge() { window.Audio2.ensure(); window.Audio2.creak(); fridgeTarget = 1; foodShown = false; setTimeout(() => { if (fridgeTarget === 1) { foodShown = true; showFood(); } }, 460); }
  function closeFridge() { fridgeTarget = 0; }

  // ---- 입력 ----
  function toVirtual(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function inRect(px, py, r) { return px >= r.x && py >= r.y && px <= r.x + r.w && py <= r.y + r.h; }
  function onMove(e) { const { x, y } = toVirtual(e); if (editMode) { canvas.style.cursor = (window.DecorLayer.pick(dmap(), x, y) || pickKBuiltin(x, y)) ? "grab" : "default"; return; } const s = inRect(x, y, KLIGHT.hit) || inRect(x, y, FRIDGE) || inRect(x, y, MICRO) || inRect(x, y, STOVE) || inRect(x, y, SINK); canvas.style.cursor = s ? "pointer" : "default"; }
  function onDown(e) {
    if (!editMode) return; const { x, y } = toVirtual(e);
    const id = window.DecorLayer.pick(dmap(), x, y);
    if (id) { const d = dmap()[id]; drag = { id, dx: d.x - x, dy: d.y - y }; canvas.style.cursor = "grabbing"; draw(); return; }
    const bid = pickKBuiltin(x, y); if (bid) { const o = kgetOff(bid); drag = { builtin: bid, sx: x, sy: y, odx: o.dx, ody: o.dy }; canvas.style.cursor = "grabbing"; draw(); }
  }
  function onDrag(e) {
    if (!editMode || !drag) return; const { x, y } = toVirtual(e);
    if (drag.builtin) { const o = kgetOff(drag.builtin); o.dx = drag.odx + (x - drag.sx); o.dy = drag.ody + (y - drag.sy); draw(); return; }
    const d = dmap()[drag.id]; d.x = Math.max(8, Math.min(W - 8, x + drag.dx)); d.y = Math.max(22, Math.min(H - 4, y + drag.dy)); draw();
  }
  function onUp() { if (drag) { drag = null; window.App.save(); draw(); } }
  function onContext(e) {
    if (!editMode) return; e.preventDefault(); const { x, y } = toVirtual(e);
    const id = window.DecorLayer.pick(dmap(), x, y); if (id) { const d = dmap()[id]; d.hidden = !d.hidden; window.App.save(); draw(); return; }
    const bid = pickKBuiltin(x, y); if (bid) { const h = window.App.state.hiddenBuiltinsKitchen || (window.App.state.hiddenBuiltinsKitchen = {}); h[bid] = !h[bid]; window.App.save(); draw(); }
  }
  function onClick(e) {
    window.Audio2.ensure();
    const { x, y } = toVirtual(e);
    if (editMode) return;
    if (inRect(x, y, KLIGHT.hit)) { kToggleLight(); return; }   // 천장 조명 스위치
    const did = window.DecorLayer.pick(dmap(), x, y);
    if (did && !did.startsWith("rug")) { decorWob[did] = 18; const dit = window.Decor.byId(did); if (dit && dit.squishy) window.Audio2.squish(); else window.Audio2.blip(560 + (did.length % 4) * 70); return; }
    if (inRect(x, y, FRIDGE)) return openFridge();
    if (inRect(x, y, MICRO)) { microFlash = 22; window.Audio2.blip(880); setTimeout(() => window.Audio2.blip(880), 140); return; }
    if (inRect(x, y, STOVE)) { stoveOn = !stoveOn; window.Audio2.blip(stoveOn ? 320 : 200); draw(); return; }
    if (inRect(x, y, SINK)) { sinkSplash = 30; window.Audio2.blip(620); return; }
  }

  window.Kitchen = {
    init() {
      canvas = document.getElementById("kitchen-canvas"); ctx = canvas.getContext("2d");
      canvas.width = W; canvas.height = H; ctx.imageSmoothingEnabled = false;
      weather = window.App.state.weather || "sunny";
      canvas.addEventListener("mousemove", onMove); canvas.addEventListener("click", onClick);
      canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onDrag); window.addEventListener("pointerup", onUp); canvas.addEventListener("contextmenu", onContext);
      pop = document.getElementById("food-pop"); foodCanvas = document.getElementById("food-canvas");
      foodName = document.getElementById("food-name"); foodCuisine = document.getElementById("food-cuisine");
      document.getElementById("food-again").addEventListener("click", () => { window.Audio2.blip(560); showFood(); });
      document.getElementById("food-close").addEventListener("click", () => { pop.classList.add("hidden"); closeFridge(); window.Audio2.blip(360); });
      document.getElementById("food-tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; curCuisine = b.dataset.c; document.querySelectorAll("#food-tabs button").forEach((x) => x.classList.toggle("on", x === b)); window.Audio2.blip(500); showFood(); });
      draw();
    },
    start() { running = true; last = 0; editMode = false; drag = null; requestAnimationFrame(loop); window.Audio2.setAmbient(null); draw(); },
    stop() { running = false; editMode = false; drag = null; fridgeTarget = 0; fridgeAnim = 0; foodShown = false; if (pop) pop.classList.add("hidden"); },
    setEditMode(b) { editMode = b; if (!b) drag = null; draw(); },
    get editing() { return editMode; },
    paletteList() {
      const list = [], dec = window.App.state.decor || {};
      for (const id in dec) { if (!dec[id] || !dec[id].owned) continue; const it = window.Decor.byId(id); if (!it) continue; const d = dmap()[id]; list.push({ id, name: it.name, cat: it.cat, on: !!(d && !d.hidden), iconDraw: (g) => it.draw(g, 0, 0) }); }
      for (const bi of KBUILTINS) list.push({ id: "@" + bi.id, name: KBI_NAME[bi.id], cat: "builtin", on: !khb(bi.id), iconDraw: (g) => kbuiltinIcon(bi.id, g) });
      return list;
    },
    toggleItem(id) {
      if (id[0] === "@") { const bid = id.slice(1); const h = window.App.state.hiddenBuiltinsKitchen || (window.App.state.hiddenBuiltinsKitchen = {}); h[bid] = !h[bid]; window.App.save(); draw(); return !h[bid]; }
      const m = dmap(), d = m[id];
      if (d && !d.hidden) { d.hidden = true; window.App.save(); draw(); return false; }
      const it = window.Decor.byId(id); if (!it) return false;
      if (!m[id]) m[id] = { x: it.def.x, y: it.def.y, hidden: false }; else m[id].hidden = false;
      window.App.save(); draw(); return true;
    },
    revertRoom() {   // 꾸미기 전으로: 배치 아이템 제거 + 식물 원위치·표시
      window.App.state.decorKitchen = {};
      window.App.state.hiddenBuiltinsKitchen = {}; window.App.state.builtinPosKitchen = {};
      window.App.save(); draw();
    },
    setWeather(w) { weather = w; if (ctx) draw(); },
    get weather() { return weather; },
  };
})();
