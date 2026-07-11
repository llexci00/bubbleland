/* ============================================================
   거실 (픽셀 · 명암/디테일) — window.Living
   소파(좌·측면) → 탁자+라디오 → TV(우, 마주봄) · 맨오른쪽 큰 창문
   TV: 프루티거 에어 추상 패턴(클릭 시 랜덤) · 라디오: 곡+음표+멜로디
   ============================================================ */
(function () {
  "use strict";
  const W = 320, H = 180;
  let canvas, ctx, running = false, t = 0, last = 0;
  let weather = "sunny";
  let tvScene = 0, notes = [];
  let editMode = false, drag = null, decorWob = {};
  let radioPop, radioList, bookPop, book3d, bookClosed, pageTurn, bookTitle, bookAuthor, bookQuote;
  function dmap() { return window.App.state.decorLiving || (window.App.state.decorLiving = {}); }

  // 거실 기본물건(이동/제거 가능): 소파 · 러그
  const LBUILTINS = [
    { id: "sofa", box: { x: 38, y: 70, w: 116, h: 52 } },
    { id: "rug", box: { x: 58, y: 148, w: 184, h: 22 } },
  ];
  const LBI_NAME = { sofa: "소파", rug: "러그" };
  function lhb(id) { const h = window.App.state.hiddenBuiltinsLiving || {}; return !!h[id]; }
  function lboff(id) { const bp = window.App.state.builtinPosLiving; return (bp && bp[id]) || { dx: 0, dy: 0 }; }
  function lgetOff(id) { const bp = window.App.state.builtinPosLiving || (window.App.state.builtinPosLiving = {}); return bp[id] || (bp[id] = { dx: 0, dy: 0 }); }
  function lbiBox(id) { const bi = LBUILTINS.find((b) => b.id === id), o = lboff(id); return { x: bi.box.x + o.dx, y: bi.box.y + o.dy, w: bi.box.w, h: bi.box.h }; }
  function pickLBuiltin(x, y) { for (let i = LBUILTINS.length - 1; i >= 0; i--) { if (lhb(LBUILTINS[i].id)) continue; const b = lbiBox(LBUILTINS[i].id); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return LBUILTINS[i].id; } return null; }
  function lbuiltinIcon(id, g) {
    const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    if (id === "sofa") { const c = window.Skins.theme("sofa"); p(-11, -12, 22, 9, c.base); p(-11, -12, 22, 2, c.hi); p(-13, -10, 3, 10, c.base); p(10, -10, 3, 10, c.dark); p(-9, -5, 18, 5, c.lite); p(-9, -5, 18, 2, c.hi); }
    else if (id === "rug") { g.fillStyle = "#c98a9a"; g.beginPath(); g.ellipse(0, -3, 13, 5, 0, 0, 7); g.fill(); g.fillStyle = "#e0a7b4"; g.beginPath(); g.ellipse(0, -3, 8, 3, 0, 0, 7); g.fill(); }
  }

  // 천장 조명 (상단 중앙) — 클릭 on/off
  const LLIGHT = { x: 150, y: 14, hit: { x: 138, y: 0, w: 24, h: 24 } };
  function lLightOn() { const L = window.App.state.lights || {}; return L.living !== false; }
  function lToggleLight() { const L = window.App.state.lights || (window.App.state.lights = {}); L.living = !lLightOn(); window.App.save(); window.Audio2.blip(L.living ? 720 : 300); draw(); }
  function drawLLamp() {
    const cx = LLIGHT.x, sy = LLIGHT.y, on = lLightOn();
    P(cx, 0, 1, sy - 6, "#7a6a4a");                                          // 전선
    P(cx - 5, sy - 6, 10, 2, "#3a4048");                                     // 고정부
    ctx.fillStyle = window.Skins.lamp("#e6ded0"); ctx.beginPath(); ctx.moveTo(cx - 10, sy + 3); ctx.lineTo(cx - 5, sy - 4); ctx.lineTo(cx + 5, sy - 4); ctx.lineTo(cx + 10, sy + 3); ctx.closePath(); ctx.fill(); // 갓(스킨)
    P(cx - 10, sy + 2, 21, 1, "#c9bfa8"); P(cx - 5, sy - 4, 10, 1, "#f4efe2");
    P(cx - 2, sy + 3, 5, 3, on ? "#fff3b0" : "#8a8f97"); if (on) P(cx - 1, sy + 3, 3, 2, "#fffbe0"); // 전구
  }
  function drawLLighting() {
    const night = window.WindowSky.nightness(), on = lLightOn();
    if (on) {
      const gr = ctx.createRadialGradient(LLIGHT.x, LLIGHT.y + 2, 8, LLIGHT.x, LLIGHT.y + 2, 180);
      gr.addColorStop(0, "rgba(255,244,206,0.30)"); gr.addColorStop(1, "rgba(255,244,206,0)");
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      if (night > 0.02) { ctx.fillStyle = `rgba(20,30,60,${0.10 * night})`; ctx.fillRect(0, 0, W, H); }
    } else {
      ctx.fillStyle = `rgba(10,14,32,${0.34 + 0.28 * night})`; ctx.fillRect(0, 0, W, H);
      windowGlow(WIN, night);
    }
  }
  function windowGlow(r, night) {
    const moon = night > 0.5, col = moon ? "150,180,235" : "255,238,196", a = moon ? 0.20 : 0.15;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const gr = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(r.w, r.h) * 1.5);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(${col},${a * 0.55})`;
    ctx.beginPath(); ctx.moveTo(r.x + 2, r.y + r.h); ctx.lineTo(r.x + r.w - 2, r.y + r.h); ctx.lineTo(r.x + r.w + 14, H); ctx.lineTo(r.x - 14, H); ctx.closePath(); ctx.fill();
  }

  const SHELF = { x: 6, y: 44, w: 30, h: 74 };
  const SOFA = { x: 42, y: 70 };
  const TABLE = { x: 138, y: 126 };
  const RADIO = { x: 150, y: 112, w: 30, h: 14 };
  const TV = { x: 196, y: 70, w: 54, h: 36 };
  const SCREEN = { x: TV.x + 4, y: TV.y + 4, w: TV.w - 8, h: TV.h - 10 };
  const WIN = { x: 254, y: 16, w: 62, h: 92 };
  const DOOR = { x: 156, y: 52, w: 34, h: 64 };   // 밖으로 나가는 현관문
  const FLOOR_Y = 118;

  function P(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

  // ============================================================
  //  배경 (명암)
  // ============================================================
  function drawBase() {
    const [wt, wm] = window.Skins.wall("#ece0c8", "#e3d5ba", "#e3d5ba");
    const [fc, fc2] = window.Skins.floor("#c19a68", "#a9814f");
    P(0, 0, W, 40, wt); P(0, 40, W, FLOOR_Y - 40, wm);
    P(0, FLOOR_Y - 4, W, 4, "#cdbb95");               // 벽/바닥 경계 그림자
    // 바닥 (마루 + 명암)
    P(0, FLOOR_Y, W, H - FLOOR_Y, fc);
    for (let x = 0; x < W; x += 30) { P(x, FLOOR_Y, 1, H - FLOOR_Y, fc2); P(x + 1, FLOOR_Y, 14, 1, "rgba(255,255,255,0.14)"); }
    P(0, FLOOR_Y, W, 2, "rgba(255,255,255,0.18)");
  }
  function drawRug() {
    const o = lboff("rug"), cx = 150 + o.dx, cy = 158 + o.dy;
    ctx.fillStyle = "#c98a9a"; ctx.beginPath(); ctx.ellipse(cx, cy, 92, 16, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#e0a7b4"; ctx.beginPath(); ctx.ellipse(cx, cy - 1, 76, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#c98a9a"; ctx.beginPath(); ctx.ellipse(cx, cy - 2, 58, 8, 0, 0, 7); ctx.fill();
  }

  function drawShelf() {
    const { x, y, w, h } = SHELF;
    const th = window.Skins.theme("bookshelf");
    P(x - 2, y - 2, w + 4, h + 4, th.outer);          // 외곽
    P(x, y, w, h, th.frame); P(x, y, w, 2, th.top); P(x + w - 2, y, 2, h, th.outer);
    const cols = ["#e0492c", "#e8b04a", "#4bb15f", "#4a86c9", "#c98ae0", "#ff9ab0", "#5ac8c0"];
    for (let s = 0; s < 4; s++) {
      const sy = y + 6 + s * 17;
      P(x, sy + 13, w, 2, th.outer);                  // 선반
      for (let b = 0; b < 7; b++) { const bx = x + 3 + b * 3.6; const bh = 10 + ((b + s) % 3); P(bx, sy + 14 - bh, 3, bh, cols[(b + s * 2) % cols.length]); P(bx, sy + 14 - bh, 3, 1, "rgba(255,255,255,0.35)"); }
    }
  }

  let SOFA_C = { base: "#6fa8c4", lite: "#8fc4dc", hi: "#a9d6e8", dark: "#5788a0", sh: "#4d7d95" };
  function cushion(x, y, w, h) {
    const c = SOFA_C;
    P(x + 1, y, w - 2, h, c.lite); P(x, y + 1, w, h - 2, c.lite);      // 둥근 느낌
    P(x + 2, y + 1, w - 6, 2, c.hi);                                    // 윗 하이라이트
    P(x + 2, y + h - 2, w - 4, 1, c.base);                              // 아래 음영
    P(x + (w >> 1), y + 2, 1, h - 4, "rgba(70,120,150,0.22)");          // 가운데 주름
  }
  function armrest(x) {
    const c = SOFA_C;
    P(x + 2, 78, 12, 6, c.base); P(x + 3, 76, 10, 4, c.base);           // 둥근 위
    P(x, 82, 16, 36, c.base);                                           // 몸통
    P(x, 82, 3, 36, c.hi); P(x + 3, 76, 10, 2, c.hi);                   // 하이라이트
    P(x + 13, 82, 3, 36, c.dark);                                       // 그림자
    P(x + 3, 116, 4, 4, "#4a3626");                                     // 다리
  }
  function drawSofa() {
    const c = SOFA_C;
    // 등받이 (뒤 패널)
    P(54, 72, 84, 28, c.base); P(54, 72, 84, 3, c.hi); P(54, 97, 84, 3, c.dark);
    // 등쿠션 2 (통통)
    cushion(56, 74, 40, 22); cushion(98, 74, 40, 22);
    // 팔걸이 좌/우
    armrest(40); armrest(136);
    // 좌석 베이스
    P(54, 100, 84, 18, c.base); P(54, 100, 84, 2, c.lite); P(54, 116, 84, 2, c.sh);
    // 좌석 쿠션 2
    cushion(56, 96, 40, 13); cushion(98, 96, 40, 13);
    // 가운데 다리
    P(94, 116, 4, 4, "#4a3626");
  }

  function drawTableRadio() {
    const { x } = TABLE;
    // 낮은 탁자
    P(x, 126, 58, 4, "#a87a4a"); P(x, 126, 58, 1, "#c2905a"); P(x, 130, 58, 2, "#8a6238");
    P(x + 6, 132, 4, 15, "#8a6238"); P(x + 48, 132, 4, 15, "#8a6238");
    // 라디오
    const r = RADIO, rt = window.Skins.theme("radio");
    P(r.x + 1, r.y + 1, r.w, r.h, "rgba(60,40,20,0.2)");     // 그림자
    P(r.x, r.y, r.w, r.h, rt.body); P(r.x, r.y, r.w, 2, rt.topc); P(r.x, r.y + r.h - 2, r.w, 2, rt.bot);
    P(r.x + 3, r.y + 3, 12, r.h - 6, "#3a2e28");              // 스피커 그릴
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P(r.x + 4 + j * 4, r.y + 4 + i * 3, 2, 1, "#5a4a3a");
    P(r.x + 18, r.y + 4, 8, 4, "#e8d9b8"); P(r.x + 19, r.y + 5, 2, 2, "#c94f2a"); // 주파수창
    P(r.x + 20, r.y + 9, 5, 3, "#7a5a3a");                    // 다이얼
    P(r.x + r.w - 4, r.y - 5, 1, 6, "#8a97a3");               // 안테나
    if (window.Audio2.isPlaying()) { P(r.x + 4, r.y + 4, 10, 1, "#7CFC98"); } // 재생 표시
  }

  // ---- TV: 프루티거 에어 추상 패턴 ----
  function drawTV() {
    // 스탠드
    P(TV.x + 16, TV.y + TV.h, 22, 12, "#5a4a3a"); P(TV.x + 16, TV.y + TV.h, 22, 2, "#7a6448");
    P(TV.x + 24, TV.y + TV.h - 3, 6, 4, "#4a3c2e");
    // 베젤 (스킨 색)
    const th = window.Skins.theme("tv");
    P(TV.x - 1, TV.y - 1, TV.w + 2, TV.h + 2, th.bezel2);
    P(TV.x, TV.y, TV.w, TV.h, th.bezel); P(TV.x, TV.y, TV.w, 2, th.hi);
    // 화면
    ctx.save(); ctx.beginPath(); ctx.rect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h); ctx.clip();
    tvSceneDraw();
    // 유리 광택
    ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.beginPath(); ctx.moveTo(SCREEN.x, SCREEN.y); ctx.lineTo(SCREEN.x + 12, SCREEN.y); ctx.lineTo(SCREEN.x, SCREEN.y + 9); ctx.closePath(); ctx.fill();
    ctx.restore();
    P(TV.x + TV.w - 5, TV.y + TV.h - 5, 2, 2, (t >> 4) % 2 ? "#7CFC98" : "#3aa85a"); // LED
  }
  function tvSceneDraw() {
    const r = SCREEN, g = ctx;
    if (tvScene === 0) { // 버블
      for (let i = 0; i < r.h; i++) { g.fillStyle = mix("#7ec8f0", "#bfe8ff", i / r.h); g.fillRect(r.x, r.y + i, r.w, 1); }
      for (let i = 0; i < 7; i++) { const bx = r.x + (i * 9 + t * 0.2) % r.w; const by = r.y + r.h - ((t * 0.6 + i * 11) % (r.h + 6)); g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.arc(bx, by, 2 + (i % 2), 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.9)"; g.fillRect(bx - 1, by - 1, 1, 1); }
    } else if (tvScene === 1) { // 오로라
      for (let i = 0; i < r.h; i++) { const f = i / r.h; const c = mix("#2a6ad0", "#7ad0c0", (Math.sin(t * 0.05 + f * 4) + 1) / 2); g.fillStyle = c; g.fillRect(r.x, r.y + i, r.w, 1); }
      g.fillStyle = "rgba(180,255,230,0.25)"; for (let x = 0; x < r.w; x++) { const yy = r.y + r.h / 2 + Math.sin(x * 0.3 + t * 0.1) * r.h * 0.28; g.fillRect(r.x + x, yy, 1, 2); }
    } else if (tvScene === 2) { // 유리 스윕
      for (let i = 0; i < r.h; i++) { g.fillStyle = mix("#9fe0f5", "#4aa0e6", i / r.h); g.fillRect(r.x, r.y + i, r.w, 1); }
      const sx = r.x + (t * 0.8) % (r.w + 20) - 10; g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.moveTo(sx, r.y); g.lineTo(sx + 6, r.y); g.lineTo(sx - 4, r.y + r.h); g.lineTo(sx - 10, r.y + r.h); g.closePath(); g.fill();
    } else { // 블롭 (라바)
      g.fillStyle = "#123a6a"; g.fillRect(r.x, r.y, r.w, r.h);
      const cols = ["#4ad0c0", "#5ab0f0", "#a0e07a"];
      for (let i = 0; i < 3; i++) { const bx = r.x + r.w / 2 + Math.sin(t * 0.04 + i * 2) * r.w * 0.32; const by = r.y + r.h / 2 + Math.cos(t * 0.05 + i * 2.5) * r.h * 0.3; g.fillStyle = cols[i]; g.beginPath(); g.arc(bx, by, 4, 0, 7); g.fill(); }
    }
  }

  function drawWindow() {
    P(WIN.x - 4, WIN.y - 4, WIN.w + 8, WIN.h + 8, "#efe6d0");   // 프레임(유리 영역까지 채움 → 클립 모서리에 프레임색 노출)
    P(WIN.x - 4, WIN.y - 4, WIN.w + 8, 2, "#fdf7e6"); P(WIN.x - 4, WIN.y + WIN.h + 2, WIN.w + 8, 2, "#d6c8a8");
    // 유리: 스킨 모양대로 클립
    ctx.save();
    window.Skins.clipWindow(ctx, WIN);
    window.WindowSky.draw(ctx, WIN, weather, t);
    P(WIN.x + WIN.w / 2 - 1, WIN.y, 2, WIN.h, "#efe6d0"); P(WIN.x, WIN.y + WIN.h / 2 - 1, WIN.w, 2, "#efe6d0");
    ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.beginPath(); ctx.moveTo(WIN.x, WIN.y); ctx.lineTo(WIN.x + 16, WIN.y); ctx.lineTo(WIN.x, WIN.y + 16); ctx.closePath(); ctx.fill();
    ctx.restore();
    P(WIN.x - 6, WIN.y + WIN.h + 4, WIN.w + 12, 4, "#e3d5ba"); // 창턱
    // 커튼(양옆 살짝) — 창틀 밖으로 살짝 걸쳐 있으니 클립 밖에서
    P(WIN.x - 6, WIN.y - 4, 8, WIN.h + 8, "rgba(230,200,215,0.55)"); P(WIN.x + WIN.w - 2, WIN.y - 4, 8, WIN.h + 8, "rgba(230,200,215,0.55)");
  }

  // ---- 음표 애니메이션 ----
  function drawNote(x, y, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y + 3, 1.6, 0, 7); ctx.fill(); ctx.fillRect(x + 1, y - 3, 1, 6); ctx.fillRect(x + 1, y - 3, 3, 1); }
  function stepNotes() {
    if (window.Audio2.isPlaying() && t % 16 === 0) notes.push({ x: RADIO.x + 6 + Math.random() * 16, y: RADIO.y - 2, vx: (Math.random() - 0.5) * 0.4, life: 1, c: ["#4a86c9", "#e0658a", "#4bb15f", "#e8a63a"][(Math.random() * 4) | 0] });
    for (const n of notes) { n.y -= 0.7; n.x += n.vx; n.life -= 0.014; }
    notes = notes.filter((n) => n.life > 0);
  }

  function drawDoor() {
    const d = DOOR;
    P(d.x - 3, d.y - 2, d.w + 6, d.h + 4, "#8a5a30");                                  // 문틀
    P(d.x, d.y, d.w, d.h, "#a5763e"); P(d.x, d.y, d.w, 2, "#c2905a"); P(d.x + d.w - 2, d.y, 2, d.h, "#7a5228");
    P(d.x + 6, d.y + 4, d.w - 12, 10, "#bfe6ff"); P(d.x + d.w / 2 - 1, d.y + 4, 2, 10, "#a5763e"); // 상단 유리
    P(d.x + 4, d.y + 18, d.w - 8, 16, "#8a5f34"); P(d.x + 4, d.y + 38, d.w - 8, 22, "#8a5f34");     // 패널
    P(d.x + d.w - 8, d.y + d.h / 2, 3, 3, "#ffd23f");                                   // 손잡이
    ctx.fillStyle = "#c98a5a"; ctx.beginPath(); ctx.ellipse(d.x + d.w / 2, d.y + d.h + 3, d.w / 2 + 2, 3, 0, 0, 7); ctx.fill(); // 매트
    ctx.fillStyle = "#5a3a1a"; ctx.font = "6px sans-serif"; ctx.textAlign = "center"; ctx.fillText("밖으로", d.x + d.w / 2, d.y - 4); ctx.textAlign = "left";
  }
  function groundShadow(cx, cy, rx) { ctx.fillStyle = "rgba(35,55,30,0.16)"; ctx.beginPath(); ctx.ellipse(cx, cy, rx, 4, 0, 0, 7); ctx.fill(); }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    SOFA_C = window.Skins.theme("sofa");
    drawBase();
    drawLLamp();
    if (!lhb("rug")) drawRug();
    // 바닥 접촉 그림자
    groundShadow(21, FLOOR_Y + 2, 17); groundShadow(222, FLOOR_Y + 1, 24); groundShadow(166, 148, 30);
    if (!lhb("sofa")) { const o = lboff("sofa"); groundShadow(96 + o.dx, 126 + o.dy, 58); }
    drawShelf(); drawWindow();
    if (!lhb("sofa")) { const o = lboff("sofa"); ctx.save(); ctx.translate(o.dx, o.dy); drawSofa(); ctx.restore(); }
    drawTableRadio(); drawTV();
    for (const n of notes) { ctx.globalAlpha = Math.max(0, n.life); drawNote(n.x, n.y, n.c); } ctx.globalAlpha = 1;
    window.DecorLayer.render(ctx, dmap(), editMode, drag && drag.id, decorWob);
    if (editMode) {   // 기본물건(소파·러그) 편집 박스
      for (const bi of LBUILTINS) { if (lhb(bi.id)) continue; const b = lbiBox(bi.id), dr = drag && drag.builtin === bi.id; ctx.strokeStyle = dr ? "#ffd23f" : "rgba(120,210,255,0.9)"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h); ctx.setLineDash([]); }
    }
    drawLLighting();
  }
  function loop(ts) { if (!running) return; if (ts - last > 33) { last = ts; t++; stepNotes(); for (const k in decorWob) { if (decorWob[k] > 0) decorWob[k]--; else delete decorWob[k]; } draw(); } requestAnimationFrame(loop); }

  function mix(a, b, f) { const A = hx(a), B = hx(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * f)},${Math.round(A[1] + (B[1] - A[1]) * f)},${Math.round(A[2] + (B[2] - A[2]) * f)})`; }
  function hx(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  // ---- 입력 ----
  function toV(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function inR(px, py, r) { return px >= r.x && py >= r.y && px <= r.x + r.w && py <= r.y + r.h; }
  function onMove(e) { const { x, y } = toV(e); if (editMode) { canvas.style.cursor = (window.DecorLayer.pick(dmap(), x, y) || pickLBuiltin(x, y)) ? "grab" : "default"; return; } canvas.style.cursor = (inR(x, y, LLIGHT.hit) || inR(x, y, TV) || inR(x, y, RADIO) || inR(x, y, SHELF)) ? "pointer" : "default"; }
  // 꾸미기 편집
  function onDown(e) {
    if (!editMode) return; const { x, y } = toV(e);
    const id = window.DecorLayer.pick(dmap(), x, y);
    if (id) { const d = dmap()[id]; drag = { id, dx: d.x - x, dy: d.y - y }; canvas.style.cursor = "grabbing"; draw(); return; }
    const bid = pickLBuiltin(x, y); if (bid) { const o = lgetOff(bid); drag = { builtin: bid, sx: x, sy: y, odx: o.dx, ody: o.dy }; canvas.style.cursor = "grabbing"; draw(); }
  }
  function onDrag(e) {
    if (!editMode || !drag) return; const { x, y } = toV(e);
    if (drag.builtin) { const o = lgetOff(drag.builtin); o.dx = drag.odx + (x - drag.sx); o.dy = drag.ody + (y - drag.sy); draw(); return; }
    const d = dmap()[drag.id]; d.x = Math.max(8, Math.min(W - 8, x + drag.dx)); d.y = Math.max(22, Math.min(H - 4, y + drag.dy)); draw();
  }
  function onUp() { if (drag) { drag = null; window.App.save(); draw(); } }
  function onContext(e) {
    if (!editMode) return; e.preventDefault(); const { x, y } = toV(e);
    const id = window.DecorLayer.pick(dmap(), x, y); if (id) { const d = dmap()[id]; d.hidden = !d.hidden; window.App.save(); draw(); return; }
    const bid = pickLBuiltin(x, y); if (bid) { const h = window.App.state.hiddenBuiltinsLiving || (window.App.state.hiddenBuiltinsLiving = {}); h[bid] = !h[bid]; window.App.save(); draw(); }
  }
  function onClick(e) {
    if (editMode) return;
    window.Audio2.ensure();
    const { x, y } = toV(e);
    if (inR(x, y, LLIGHT.hit)) { lToggleLight(); return; }   // 천장 조명 스위치
    const did = window.DecorLayer.pick(dmap(), x, y);
    if (did && !did.startsWith("rug")) { decorWob[did] = 18; const dit = window.Decor.byId(did); if (dit && dit.squishy) window.Audio2.squish(); else window.Audio2.blip(560 + (did.length % 4) * 70); return; }
    if (inR(x, y, TV)) { let n; do { n = (Math.random() * 4) | 0; } while (n === tvScene); tvScene = n; window.Audio2.blip(520); draw(); return; }
    if (inR(x, y, RADIO)) { openRadio(); return; }
    if (inR(x, y, SHELF)) { openBook(); return; }
  }

  // ---- 책 추천 (진짜 책처럼) ----
  function loadBook() { const b = window.Books.random(); bookTitle.textContent = "『" + b.t + "』"; bookAuthor.textContent = b.a; bookQuote.textContent = "“" + b.q + "”"; }
  function openBook() { window.Audio2.ensure(); window.Audio2.pageFlip(); book3d.classList.remove("opened"); bookPop.classList.remove("hidden"); }

  // ---- 라디오 패널 ----
  function buildRadioList() {
    radioList.innerHTML = "";
    window.Audio2.SONGS.forEach((s, i) => {
      const b = document.createElement("button"); b.className = "radio-song" + (window.Audio2.musicIdx === i ? " on" : "");
      b.textContent = s.name;
      b.addEventListener("click", () => { window.Audio2.ensure(); window.Audio2.setMusicVolume(0.6); window.Audio2.playSong(i); buildRadioList(); });
      radioList.appendChild(b);
    });
  }
  function openRadio() { window.Audio2.blip(560); buildRadioList(); radioPop.classList.remove("hidden"); }

  window.Living = {
    init() {
      canvas = document.getElementById("living-canvas"); ctx = canvas.getContext("2d");
      canvas.width = W; canvas.height = H; ctx.imageSmoothingEnabled = false;
      weather = window.App.state.weather || "sunny";
      canvas.addEventListener("mousemove", onMove); canvas.addEventListener("click", onClick);
      canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onDrag); window.addEventListener("pointerup", onUp); canvas.addEventListener("contextmenu", onContext);
      radioPop = document.getElementById("radio-pop"); radioList = document.getElementById("radio-list");
      document.getElementById("radio-close").addEventListener("click", () => { radioPop.classList.add("hidden"); window.Audio2.blip(360); });
      document.getElementById("radio-stop").addEventListener("click", () => { window.Audio2.stopSong(); buildRadioList(); window.Audio2.blip(300); });
      bookPop = document.getElementById("book-pop"); book3d = document.getElementById("book3d");
      bookClosed = document.getElementById("book-closed"); pageTurn = document.getElementById("page-turn");
      bookTitle = document.getElementById("book-title"); bookAuthor = document.getElementById("book-author"); bookQuote = document.getElementById("book-quote");
      document.getElementById("book-close").addEventListener("click", () => { bookPop.classList.add("hidden"); book3d.classList.remove("opened"); window.Audio2.blip(360); });
      bookClosed.addEventListener("click", () => { if (book3d.classList.contains("opened")) return; loadBook(); book3d.classList.add("opened"); window.Audio2.pageFlip(); window.Audio2.blip(520); });
      document.getElementById("book-again").addEventListener("click", () => {
        window.Audio2.pageFlip();
        document.getElementById("pt-quote").textContent = bookQuote.textContent;  // 넘기는 페이지 앞면 = 현재 문장
        loadBook();                                                               // 아래 페이지 = 새 책
        pageTurn.classList.remove("flip"); void pageTurn.offsetWidth; pageTurn.classList.add("flip");
        setTimeout(() => pageTurn.classList.remove("flip"), 730);
      });
      draw();
    },
    start() { running = true; last = 0; editMode = false; drag = null; requestAnimationFrame(loop); window.Audio2.setAmbient(weather === "rain" ? "rain" : "wind"); window.Audio2.setMusicVolume(0.6); draw(); },
    stop() { running = false; editMode = false; drag = null; if (radioPop) radioPop.classList.add("hidden"); if (bookPop) { bookPop.classList.add("hidden"); book3d.classList.remove("opened"); } },
    setEditMode(b) { editMode = b; if (!b) drag = null; draw(); },
    get editing() { return editMode; },
    paletteList() {
      const list = [], dec = window.App.state.decor || {};
      for (const id in dec) { if (!dec[id] || !dec[id].owned) continue; const it = window.Decor.byId(id); if (!it) continue; const d = dmap()[id]; list.push({ id, name: it.name, cat: it.cat, on: !!(d && !d.hidden), iconDraw: (g) => it.draw(g, 0, 0) }); }
      for (const bi of LBUILTINS) list.push({ id: "@" + bi.id, name: LBI_NAME[bi.id], cat: "builtin", on: !lhb(bi.id), iconDraw: (g) => lbuiltinIcon(bi.id, g) });
      return list;
    },
    toggleItem(id) {
      if (id[0] === "@") { const bid = id.slice(1); const h = window.App.state.hiddenBuiltinsLiving || (window.App.state.hiddenBuiltinsLiving = {}); h[bid] = !h[bid]; window.App.save(); draw(); return !h[bid]; }
      const m = dmap(), d = m[id];
      if (d && !d.hidden) { d.hidden = true; window.App.save(); draw(); return false; }
      const it = window.Decor.byId(id); if (!it) return false;
      if (!m[id]) m[id] = { x: it.def.x, y: it.def.y, hidden: false }; else m[id].hidden = false;
      window.App.save(); draw(); return true;
    },
    revertRoom() {   // 꾸미기 전으로: 배치 아이템 제거 + 소파·러그 원위치·표시
      window.App.state.decorLiving = {};
      window.App.state.hiddenBuiltinsLiving = {}; window.App.state.builtinPosLiving = {};
      window.App.save(); draw();
    },
    setWeather(w) { weather = w; if (ctx) draw(); },
    get weather() { return weather; },
  };
})();
