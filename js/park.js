/* ============================================================
   공원 (마을) — window.Park
   구불구불 길 · 여러 그루 나무(사실적+그림자) · 큰 연못(겨울엔 얼음)
   가로등 · 눈사람(겨울) · 원경(산·집·나무)으로 공간감 · 긴 그림자
   걸어다니는 고양이(야옹) · 오리(클릭 시 날아감)
   ============================================================ */
(function () {
  "use strict";
  const W = 320, H = 180;
  let canvas, ctx, running = false, t = 0, last = 0;
  let weather = "sunny";
  let petals = [], hearts = [], flowers = [], birds = [], birdsAway = false, respawn = 0;
  let fireflies = [], firefliesActive = false;
  let snowCover = 0, wxFade = 0, leaves = [];   // 눈 쌓임(0~1) · 날씨전환 페이드 · 낙엽
  let SH = { dayF: 1, len: 1, dir: 1 };
  const HZ = 72;
  const POND = { cx: 234, cy: 92, rx: 46, ry: 11 };
  const BENCH = { x: 188, y: 150, w: 46 };   // 길 오른쪽으로 이동
  const LAMP = { x: 262, base: 152, s: 1 };      // 근경(우)
  const LAMP2 = { x: 88, base: 112, s: 0.62 };   // 원경(좌)
  const SIGN = { x: 116, base: 158 };         // 상점 표지판
  const SNOWMAN = { x: 92, base: 158 };
  const TREES = [ { x: 44, base: 152, s: 48 }, { x: 292, base: 158, s: 42 } ]; // 근경 좌/우
  const BG_TREES = [ { x: 22, base: 84, s: 19 }, { x: 54, base: 79, s: 16 }, { x: 150, base: 82, s: 16 }, { x: 196, base: 80, s: 15 }, { x: 236, base: 79, s: 17 }, { x: 289, base: 83, s: 18 }, { x: 315, base: 78, s: 15 } ]; // 먼 언덕 (왼쪽·가운데·연못 뒤(236)·오른쪽 끝)
  const FBEAR = { x: 138, base: 114 };   // 점쟁이 갈색 곰돌이 (검은 원 위치)
  const cat = { x: 130, y: 166, dir: 1, dir2: 1, phase: 0, state: "walk", timer: 90, blink: 0, pet: 0 };

  function P(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function snowSel() { return weather === "snow"; }          // 눈 선택됨(로직용)
  function isSnow() { return snowCover > 0.5; }               // 실제 설경 표시(쌓임 기준)
  function rnd(n) { return Math.random() * n; }
  function hx(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mixCol(a, b, f) { const A = hx(a), B = hx(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * f)},${Math.round(A[1] + (B[1] - A[1]) * f)},${Math.round(A[2] + (B[2] - A[2]) * f)})`; }
  function birdsAllowed() { const h = new Date().getHours(); return h >= 6 && h < 18 && weather !== "rain" && !snowSel(); }  // 낮(6~18시)에만, 비·눈 제외
  function catSleeping() { const h = new Date().getHours(); return h >= 21 || h < 6; }                            // 밤9시~아침6시 취침

  // ============================================================
  //  그림자(해 방향/길이)
  // ============================================================
  function shadowParams() {
    const nn = window.WindowSky.nightness(); const dayF = 1 - nn;
    const d = new Date(); const h = d.getHours() + d.getMinutes() / 60;
    const ext = Math.min(1, Math.abs(h - 13) / 6.5);       // 정오=0, 아침/저녁=1
    return { dayF, len: dayF * (0.4 + ext * 2.6), dir: h < 13 ? 1 : -1 };
  }
  function castShadow(bx, by, halfW, objH) {
    if (SH.dayF < 0.06) return;
    const L = halfW + objH * SH.len * 0.5;
    ctx.fillStyle = `rgba(30,55,30,${0.18 * SH.dayF})`;
    ctx.beginPath(); ctx.ellipse(bx + SH.dir * L * 0.5, by, L, Math.max(3, halfW * 0.5), 0, 0, 7); ctx.fill();
  }

  // ============================================================
  //  원경 (공간감)
  // ============================================================
  function drawFar() {
    // 부드러운 먼 언덕 실루엣 (뾰족한 '동굴' 느낌 제거)
    ctx.fillStyle = isSnow() ? "#cdd8e6" : "#a7c6b0";
    ctx.beginPath(); ctx.moveTo(0, HZ);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, HZ - 9 - Math.sin(x * 0.025) * 6 - Math.sin(x * 0.011 + 1) * 4);
    ctx.lineTo(W, HZ); ctx.closePath(); ctx.fill();
    // 더 앞의 나지막한 언덕
    ctx.fillStyle = isSnow() ? "#dbe4ef" : "#8fb894";
    ctx.beginPath(); ctx.moveTo(0, HZ);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, HZ - 4 - Math.abs(Math.sin(x * 0.02 + 2)) * 5);
    ctx.lineTo(W, HZ); ctx.closePath(); ctx.fill();
  }
  function litColor() {
    const nn = window.WindowSky.nightness();
    if (nn <= 0.4) return "#bfe6ff";                 // 낮: 밝은 창
    const h = new Date().getHours();
    return (h >= 18 && h < 24) ? "#ffe27a" : "#3b4a60"; // 저녁~자정 전 켜짐, 자정 지나면 소등
  }
  function roofTri(x, top, w, col) { ctx.fillStyle = isSnow() ? "#eef4fb" : col; ctx.beginPath(); ctx.moveTo(x - 2, top); ctx.lineTo(x + w / 2, top - w * 0.5); ctx.lineTo(x + w + 2, top); ctx.closePath(); ctx.fill(); ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.beginPath(); ctx.moveTo(x + w / 2, top - w * 0.5); ctx.lineTo(x + w + 2, top); ctx.lineTo(x + w / 2, top); ctx.closePath(); ctx.fill(); }
  function bldgHouse(cx, gy, w, wall, roof) {
    const x = cx - w / 2, h = Math.round(w * 0.95), top = gy - h;
    P(x, top, w, h, wall); P(x, top, w, 1, "rgba(255,255,255,0.25)"); P(x + w - 1, top, 1, h, "rgba(0,0,0,0.1)");
    // 굴뚝 + 연기
    P(x + w * 0.66, top - h * 0.35, 3, h * 0.4, "#8a6a58");
    if (isSnow()) P(x + w * 0.66, top - h * 0.35 - 1, 3, 2, "#fff");
    else { ctx.fillStyle = "rgba(225,225,225,0.55)"; for (let k = 0; k < 3; k++) P(x + w * 0.66 + (k % 2), top - h * 0.35 - 4 - k * 3, 2, 2, "rgba(225,225,225,0.5)"); }
    roofTri(x, top, w, roof);
    P(cx - 2, gy - h * 0.42, 4, h * 0.42, "#6e4a30");                       // 문
    const lw = litColor(); P(x + 2, top + 3, 3, 3, lw); P(x + w - 5, top + 3, 3, 3, lw); // 창
  }
  function bldgChurch(cx, gy, w) {
    const x = cx - w / 2, h = w, top = gy - h;
    P(x, top + 5, w, h - 5, "#e8dfca"); P(x, top + 5, w, 1, "#d6ccb2");
    roofTri(x, top + 5, w, "#8a9ab0");
    // 첨탑
    const tw = 7, tx = cx - tw / 2, ttop = gy - h - 12;
    P(tx, ttop + 6, tw, gy - (ttop + 6), "#ded4be"); P(tx, ttop + 6, 1, gy - (ttop + 6), "rgba(255,255,255,0.3)");
    ctx.fillStyle = isSnow() ? "#eef4fb" : "#6a7a90"; ctx.beginPath(); ctx.moveTo(tx - 2, ttop + 6); ctx.lineTo(cx, ttop - 4); ctx.lineTo(tx + tw + 2, ttop + 6); ctx.closePath(); ctx.fill();
    P(cx, ttop - 11, 1, 6, "#c9a94a"); P(cx - 2, ttop - 9, 5, 1, "#c9a94a");   // 십자가
    P(tx + 2, ttop + 9, 3, 3, litColor());                                     // 종탑 창
    ctx.fillStyle = "#5aa0d0"; ctx.beginPath(); ctx.arc(cx, top + 12, 2.4, 0, 7); ctx.fill();  // 스테인드글라스
    ctx.fillStyle = "#6e4a30"; ctx.beginPath(); ctx.arc(cx, gy - 4, 3, Math.PI, 0); ctx.fill(); P(cx - 3, gy - 4, 6, 4, "#6e4a30"); // 아치문
  }
  function bldgBakery(cx, gy, w) {
    const x = cx - w / 2, h = Math.round(w * 0.8), top = gy - h;
    P(x, top, w, h, "#f0dcc0"); P(x, top, w, 1, "rgba(255,255,255,0.25)");
    roofTri(x, top, w, "#c07a4a");
    for (let i = 0; i < w - 2; i += 4) { P(x + 1 + i, gy - 8, 2, 4, "#e0492c"); P(x + 3 + i, gy - 8, 2, 4, "#fff5ea"); } // 차양
    P(x + 2, gy - 8 + 4, w - 4, 4, "#a9d8ee");                               // 진열창
    P(x + 3, gy - 4, 3, 2, "#e0a860"); P(x + 7, gy - 4, 2, 2, "#d98a3a"); P(x + w - 7, gy - 4, 3, 2, "#e8b874"); // 빵
    ctx.strokeStyle = "#b07a3a"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, top + 4, 2.2, 0.4, 5.6); ctx.stroke(); // 프레첼 간판
  }
  function drawHorizon() {   // 마을(원경) — 근경 나무(x18-70,86-130,266-318)와 안 겹치게 중앙 뒤쪽에
    bldgHouse(78, HZ, 15, "#e0d3bd", "#b06a4a");
    bldgBakery(140, HZ, 20);
    bldgChurch(180, HZ, 20);
    bldgHouse(214, HZ, 16, "#d8cbb5", "#8a9ab0");
    bldgHouse(246, HZ, 13, "#e2d6c0", "#a08060");
    ctx.fillStyle = isSnow() ? "#c6d4c0" : "#5f9e4a";
    for (const x of [10, 122, 260]) { ctx.beginPath(); ctx.arc(x, HZ - 4, 5, 0, 7); ctx.fill(); P(x - 1, HZ - 4, 2, 6, "#6a5230"); }
    // 원경 벤치
    const bxr = 156; P(bxr, HZ - 3, 10, 2, isSnow() ? "#c8c2b2" : "#9a7a4a"); P(bxr, HZ - 6, 10, 2, isSnow() ? "#c8c2b2" : "#9a7a4a"); P(bxr + 1, HZ - 3, 1, 4, "#7a5a30"); P(bxr + 8, HZ - 3, 1, 4, "#7a5a30");
  }
  function drawSign() {
    const x = SIGN.x, b = SIGN.base;
    castShadow(x, b, 4, 22);
    P(x - 1, b - 22, 3, 22, "#8a5a30"); P(x - 1, b - 22, 1, 22, "#a4764c");                           // 기둥
    P(x - 16, b - 35, 32, 14, "#7a4e28"); P(x - 16, b - 35, 32, 2, "#9a6a38"); P(x - 16, b - 21, 32, 2, "#5f3c1e"); // 진한 나무 판
    ctx.fillStyle = "#fff4d8"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("상점", x - 3, b - 28); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff4d8"; ctx.beginPath(); ctx.moveTo(x + 9, b - 33); ctx.lineTo(x + 14, b - 28); ctx.lineTo(x + 9, b - 23); ctx.closePath(); ctx.fill(); // 화살표
  }

  // ============================================================
  //  땅 · 울타리 · 구불구불 길
  // ============================================================
  function pathCx(f) { return 160 + Math.sin(f * 3.4 + 0.5) * 32 * (0.35 + 0.65 * f); }
  function drawGround() {
    const sc = snowCover;   // 0 잔디 → 1 설원 (서서히 쌓임)
    // 언덕 (중경)
    ctx.fillStyle = mixCol("#6fc94e", "#dfe9f2", sc); ctx.beginPath(); ctx.ellipse(70, HZ + 4, 90, 20, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(260, HZ + 6, 100, 24, 0, Math.PI, 0); ctx.fill();
    drawHorizon();   // 언덕 위 집·나무
    // 잔디 → 설원 블렌드
    P(0, HZ, W, H - HZ, mixCol("#63bf45", "#eef4fb", sc));
    if (sc < 0.6) { ctx.globalAlpha = 1 - sc; P(0, HZ, W, 3, "#7fd05a"); for (let i = 0; i < W; i += 7) P(i, HZ + 6 + (i % 14), 2, 2, "#4fa838"); ctx.globalAlpha = 1; } // 잔디 결(쌓일수록 사라짐)
    if (sc > 0.05) { ctx.globalAlpha = sc; drawSnowMounds(); ctx.globalAlpha = 1; }                                                                                   // 눈두둑(쌓일수록 진해짐)
    drawFence();
    // 구불구불 길
    for (let y = HZ; y < H; y += 2) {
      const f = (y - HZ) / (H - HZ), cx = pathCx(f), hw = 5 + f * 30;
      P(cx - hw, y, hw * 2, 2, mixCol("#d8c69a", "#e6eef7", sc));
      if (sc < 0.5 && y % 8 < 2) P(cx - hw + 2, y, hw * 2 - 4, 1, "#c9b585");
      if (sc > 0.5) P(cx - hw, y, 2, 2, "#cfdcea"); // 길 가장자리 음영
    }
  }
  function drawSnowMounds() {
    ctx.fillStyle = "#ffffff";
    for (let x = -6; x < W + 10; x += 30) { ctx.beginPath(); ctx.ellipse(x, HZ + 8, 20, 8, 0, 0, 7); ctx.fill(); }
    for (let x = 12; x < W + 10; x += 34) { ctx.beginPath(); ctx.ellipse(x, H - 12, 24, 10, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = "rgba(180,205,230,0.5)"; for (let i = 0; i < 30; i++) P((i * 53) % W, HZ + 16 + (i * 37) % (H - HZ - 18), 1, 1, "rgba(180,205,230,0.6)");
  }
  function drawFence() {
    for (let i = 4; i < W; i += 15) {
      if (isSnow()) P(i + 3, HZ - 6, 2, 8, "rgba(120,145,170,0.4)");  // 눈 위 그림자
      P(i, HZ - 8, 3, 10, isSnow() ? "#f6faff" : "#f0ece0"); P(i, HZ - 8, 1, 10, "#ffffff"); P(i + 2, HZ - 8, 1, 10, isSnow() ? "#d3e0ee" : "#d8d3c4");
    }
    if (isSnow()) P(0, HZ + 2, W, 1, "rgba(150,175,200,0.35)");
    P(0, HZ - 6, W, 2, isSnow() ? "#eef4fb" : "#e6e1d2"); P(0, HZ - 2, W, 2, isSnow() ? "#e2ebf5" : "#ddd7c6");
  }

  // ============================================================
  //  연못 (여름=물+오리 / 겨울=얼음)
  // ============================================================
  function seedBirds() { birds = []; birdsAway = false; if (!birdsAllowed()) return; for (let i = 0; i < 3; i++) birds.push({ ox: (i - 1) * 20 + rnd(8), oy: rnd(6) - 3, state: "swim", vx: 0, vy: 0, flap: rnd(6), sw: rnd(6) }); }
  function drawPond() {
    const { cx, cy, rx, ry } = POND;
    if (isSnow()) {
      // 얼음
      ctx.fillStyle = "#aec6d6"; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#dcebf4"; ctx.beginPath(); ctx.ellipse(cx, cy - 1, rx - 3, ry - 2, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(150,180,205,0.8)"; ctx.lineWidth = 1;                 // 균열
      ctx.beginPath(); ctx.moveTo(cx - 20, cy - 2); ctx.lineTo(cx - 4, cy + 2); ctx.lineTo(cx + 14, cy - 3); ctx.moveTo(cx - 4, cy + 2); ctx.lineTo(cx + 2, cy + 6); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.ellipse(cx - 14, cy - 3, 12, 2, -0.2, 0, 7); ctx.fill(); // 반짝임
      P(cx - rx, cy + ry - 2, rx * 2, 2, "#f4f9ff");                                 // 눈 테두리
      return;
    }
    ctx.fillStyle = "#3aa0d8"; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#5bc0ef"; ctx.beginPath(); ctx.ellipse(cx, cy - 1, rx - 4, ry - 2, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1; const rr = (t * 0.5) % 20;
    ctx.beginPath(); ctx.ellipse(cx - 6, cy, rr, rr * 0.28, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.beginPath(); ctx.ellipse(cx - rx + 14, cy - 3, 7, 1.4, -0.15, 0, 7); ctx.fill();   // 부드러운 물빛 반사(타원)
    if (weather === "rain") {   // 빗방울 파동 여러 개 (여기저기 톡톡)
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const ph = (t * 0.05 + i * 0.57) % 1, R = ph * rx * 0.4;
        const px = cx + Math.sin(i * 2.7 + 1) * rx * 0.6, py = cy + Math.cos(i * 1.9) * ry * 0.55;
        ctx.globalAlpha = (1 - ph) * 0.55;
        ctx.beginPath(); ctx.ellipse(px, py, R, R * 0.3, 0, 0, 7); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    for (const b of birds) { if (b.state === "swim") { const dx = cx + b.ox + Math.sin(t * 0.03 + b.sw) * 4; drawDuck(dx, cy + b.oy); } else drawFlyBird(b.x, b.y, b.flap); }
  }
  function drawDuck(x, y) { P(x - 4, y - 3, 9, 5, "#fbf7ee"); P(x - 4, y, 9, 2, "#e6ddc8"); P(x + 4, y - 6, 4, 5, "#fbf7ee"); P(x + 8, y - 5, 2, 2, "#ffb03a"); P(x + 6, y - 5, 1, 1, "#2b2b2b"); }
  function drawFlyBird(x, y, flap) { const up = Math.sin(flap) > 0; ctx.strokeStyle = "#f4f0e6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 5, y + (up ? 2 : -2)); ctx.lineTo(x, y); ctx.lineTo(x + 5, y + (up ? 2 : -2)); ctx.stroke(); P(x - 1, y - 1, 3, 2, "#f4f0e6"); }

  // ============================================================
  //  나무 (사실적 + 그림자)
  // ============================================================
  function branch(x, y, ang, len, w, depth) {   // 겨울 나뭇가지 (결정적 → 깜빡임 없음)
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#6f4a28"; ctx.lineWidth = Math.max(1, w); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = Math.max(1, w * 0.5); ctx.beginPath(); ctx.moveTo(x, y - w * 0.45); ctx.lineTo(x2, y2 - w * 0.45); ctx.stroke(); // 눈
    ctx.lineCap = "butt";
    if (depth > 0) {
      branch(x2, y2, ang - 0.52, len * 0.74, w * 0.66, depth - 1);
      branch(x2, y2, ang + 0.5, len * 0.72, w * 0.66, depth - 1);
      if (depth > 1) branch(x2, y2, ang - 0.03, len * 0.8, w * 0.6, depth - 1);
    }
  }
  function drawTree(tx, tb, s) {
    castShadow(tx, tb, s * 0.5, s * 1.5);
    const tw = Math.max(4, Math.round(s * 0.13));
    // 기둥
    P(tx - tw / 2, tb - s * 1.15, tw, s * 1.15, "#6f4a28");
    P(tx - tw / 2, tb - s * 1.15, 2, s * 1.15, "#8a5f36"); P(tx + tw / 2 - 2, tb - s * 1.15, 2, s * 1.15, "#573a20");
    P(tx - tw / 2, tb - s * 0.6, tw, 1, "#573a20"); P(tx - tw / 2, tb - s * 0.9, tw, 1, "#573a20"); // 나이테
    P(tx - tw / 2 - 3, tb - 2, 4, 2, "#6f4a28"); P(tx + tw / 2 - 1, tb - 2, 4, 2, "#6f4a28");        // 뿌리
    if (isSnow()) {
      branch(tx, tb - s * 1.1, -Math.PI / 2 - 0.15, s * 0.52, tw * 0.9, 3);
      branch(tx, tb - s * 0.95, -Math.PI / 2 + 0.35, s * 0.42, tw * 0.75, 2);
      branch(tx, tb - s * 0.8, -Math.PI / 2 - 0.55, s * 0.4, tw * 0.7, 2);
      return;
    }
    const leaf = (weather === "sunny" || weather === "rainbow") ? "#5fbb42" : "#4a9636";
    const leafL = (weather === "sunny" || weather === "rainbow") ? "#78cf58" : "#5aa845";
    const leafD = "#3a7f2c";
    const cy = tb - s * 1.35;
    const canopy = [[tx, cy, s * 0.55], [tx - s * 0.42, cy + s * 0.28, s * 0.4], [tx + s * 0.42, cy + s * 0.24, s * 0.42], [tx - s * 0.2, cy + s * 0.5, s * 0.36], [tx + s * 0.24, cy + s * 0.5, s * 0.36], [tx, cy + s * 0.62, s * 0.34]];
    const sway = weather === "rain" ? Math.sin(t * 0.13 + tx * 0.05) * 2.4 : 0;     // 비바람에 나무 흔들림
    if (sway) for (const c of canopy) c[0] += sway;
    canopy.forEach((c) => { ctx.fillStyle = leafD; ctx.beginPath(); ctx.arc(c[0] + 1, c[1] + 2, c[2], 0, 7); ctx.fill(); });      // 그림자면
    canopy.forEach((c) => { ctx.fillStyle = leaf; ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, 7); ctx.fill(); });                // 본체
    canopy.forEach((c) => { ctx.fillStyle = leafL; ctx.beginPath(); ctx.arc(c[0] - c[2] * 0.35, c[1] - c[2] * 0.4, c[2] * 0.5, 0, 7); ctx.fill(); }); // 하이라이트
    // 결정적 잎 텍스처 (각도 시드는 sway와 무관 → 흔들려도 잎에 붙어 함께 이동, 안 튐)
    canopy.forEach((c, ci) => { for (let k = 0; k < 4; k++) { const a = k * 1.9 + ci * 1.3 + tx; P(c[0] + Math.cos(a) * c[2] * 0.5, c[1] + Math.sin(a) * c[2] * 0.5, 1, 1, leafD); } });
    if (weather === "rainbow") for (let i = 0; i < s * 0.4; i++) { const a = i * 2.4, rr = s * 0.2 + (i % 5) * s * 0.08; P(tx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8, 2, 2, i % 2 ? "#ffb3cd" : "#ff9ab8"); }   // 무지개일 때만 나무에 꽃
  }

  // ============================================================
  //  벤치 · 가로등 · 눈사람
  // ============================================================
  function drawBench() {
    const { x, y, w } = BENCH;
    const wood = "#a97e46", woodH = "#c69456", woodM = "#956a3a", woodS = "#6e4522", iron = "#2f343b", ironH = "#4a515a";
    castShadow(x + w / 2, y + 13, w / 2 + 4, 13);
    // 주철 옆 프레임(좌/우): 등기둥 + 좌판지지 + 앞뒤다리 + 발 + 팔걸이 스크롤
    function sideFrame(fx) {
      P(fx, y - 16, 3, 16, iron); P(fx, y - 16, 1, 16, ironH);      // 등기둥
      P(fx - 1, y - 1, 5, 3, iron);                                  // 좌판 지지
      P(fx - 1, y + 3, 3, 9, iron); P(fx - 1, y + 3, 1, 9, ironH);   // 앞다리
      P(fx + 3, y + 3, 2, 9, iron);                                  // 뒷다리
      P(fx - 2, y + 11, 6, 2, "#20242a");                            // 발
      P(fx - 2, y - 5, 6, 2, iron); P(fx + 3, y - 7, 2, 3, iron); P(fx + 3, y - 7, 2, 1, ironH); // 팔걸이 곡선
    }
    sideFrame(x - 1); sideFrame(x + w - 4);
    // 등받이 슬랫 3개 (둥근 끝 + 위 하이라이트/아래 음영)
    for (let i = 0; i < 3; i++) {
      const sy = y - 15 + i * 4;
      P(x + 4, sy, w - 8, 3, i === 1 ? woodM : wood);
      P(x + 4, sy, w - 8, 1, woodH);
      P(x + 4, sy + 2, w - 8, 1, woodS);
      P(x + 4, sy, 1, 3, woodS); P(x + w - 5, sy, 1, 3, woodS);      // 슬랫 끝 음영(둥근 느낌)
    }
    // 좌판 슬랫 + 앞면(두께)
    for (let i = 0; i < 2; i++) { const sy = y + i * 3; P(x + 2, sy, w - 4, 2, i ? woodM : wood); P(x + 2, sy, w - 4, 1, woodH); }
    P(x + 2, y + 6, w - 4, 2, woodS); P(x + 2, y + 6, w - 4, 1, wood); // 앞면
    if (isSnow()) { P(x + 2, y - 16, w - 4, 2, "#f4faff"); P(x + 2, y - 1, w - 4, 2, "#f4faff"); }
  }
  // 클래식 가로등 (파라메트릭 · s=배율)
  function drawLampAt(lx, lb, s) {
    const P2 = (dx, dy, dw, dh, c) => P(lx + dx * s, lb - dy * s, dw * s, dh * s, c);
    const D = "#23272d", M = "#3a4048", MH = "#5a616a", GLASS = "#ffe6a0";
    castShadow(lx, lb, 4 * s, 50 * s);
    // 받침 (계단식)
    P2(-6, 2, 12, 3, D); P2(-4, 4, 8, 3, "#2f343b"); P2(-3, 6, 6, 2, M);
    // 기둥 (하이라이트/음영)
    P2(-2, 46, 4, 44, M); P2(-2, 46, 1.4, 44, MH); P2(1, 46, 1, 44, D);
    P2(-3, 24, 6, 2, D);                                   // 장식 링
    // 팔/십자 지지
    P2(-5, 46, 10, 2, D);
    // 랜턴 지붕(뾰족)
    ctx.fillStyle = D; ctx.beginPath();
    ctx.moveTo(lx - 7 * s, lb - 57 * s); ctx.lineTo(lx, lb - 64 * s); ctx.lineTo(lx + 7 * s, lb - 57 * s); ctx.closePath(); ctx.fill();
    P2(-7, 57, 14, 1.5, M);
    P2(-0.6, 67, 1.2, 3, M); ctx.fillStyle = M; ctx.beginPath(); ctx.arc(lx, lb - 68 * s, 1.4 * s, 0, 7); ctx.fill(); // 피니얼
    // 랜턴 몸통 (사다리꼴 유리)
    ctx.fillStyle = D; ctx.beginPath();
    ctx.moveTo(lx - 6 * s, lb - 57 * s); ctx.lineTo(lx + 6 * s, lb - 57 * s); ctx.lineTo(lx + 4.5 * s, lb - 47 * s); ctx.lineTo(lx - 4.5 * s, lb - 47 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = GLASS; ctx.beginPath();
    ctx.moveTo(lx - 4.6 * s, lb - 56 * s); ctx.lineTo(lx + 4.6 * s, lb - 56 * s); ctx.lineTo(lx + 3.4 * s, lb - 48 * s); ctx.lineTo(lx - 3.4 * s, lb - 48 * s); ctx.closePath(); ctx.fill();
    const lit = window.WindowSky.nightness();
    if (lit > 0.12) { ctx.fillStyle = `rgba(255,247,205,${0.5 + 0.5 * lit})`; ctx.beginPath(); ctx.moveTo(lx - 3.4 * s, lb - 55 * s); ctx.lineTo(lx + 3.4 * s, lb - 55 * s); ctx.lineTo(lx + 2.5 * s, lb - 49 * s); ctx.lineTo(lx - 2.5 * s, lb - 49 * s); ctx.closePath(); ctx.fill(); } // 켜진 유리 코어
    P2(-0.5, 56, 1, 8, "rgba(70,55,30,0.55)"); P2(-4.4, 52, 8.8, 0.8, "rgba(70,55,30,0.5)"); // 유리 창살(십자)
    P2(-4.6, 48, 9.2, 1.5, M);                            // 아랫단
    if (isSnow()) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(lx - 7 * s, lb - 57 * s); ctx.lineTo(lx, lb - 64 * s); ctx.lineTo(lx + 2 * s, lb - 61 * s); ctx.closePath(); ctx.fill(); }
  }
  function drawLampGlowAt(lx, lb, s) {
    const nn = window.WindowSky.nightness(); if (nn < 0.08) return;
    const gy = lb - 52 * s, R = 46 * s;
    // 도넛형 글로우: 중심(램프 유리)은 투명 → 램프 하드웨어가 안 가려지고 또렷
    const gr = ctx.createRadialGradient(lx, gy, 6 * s, lx, gy, R);
    gr.addColorStop(0, "rgba(255,228,150,0)"); gr.addColorStop(0.28, `rgba(255,228,150,${0.42 * nn})`); gr.addColorStop(1, "rgba(255,228,150,0)");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(lx, gy, R, 0, 7); ctx.fill();
    ctx.fillStyle = `rgba(255,236,175,${0.16 * nn})`; ctx.beginPath();
    ctx.moveTo(lx - 6 * s, gy + 5 * s); ctx.lineTo(lx + 6 * s, gy + 5 * s); ctx.lineTo(lx + 24 * s, lb + 6); ctx.lineTo(lx - 24 * s, lb + 6); ctx.closePath(); ctx.fill();
  }
  function drawLamp() { drawLampAt(LAMP.x, LAMP.base, LAMP.s); }
  function drawLampGlow() { drawLampGlowAt(LAMP2.x, LAMP2.base, LAMP2.s); drawLampGlowAt(LAMP.x, LAMP.base, LAMP.s); }
  // 점쟁이 갈색 곰돌이 (공원 안, 작게)
  function drawFortuneBear() {
    const x = FBEAR.x, b = FBEAR.base, c = "#a9764a", cd = "#7a5230", cl = "#c49a6a";
    castShadow(x, b, 8, 10);
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, b - 6, 8, 7, 0, 0, 7); ctx.fill();          // 몸통(앉음)
    ctx.fillStyle = cl; ctx.beginPath(); ctx.ellipse(x, b - 4, 5, 4, 0, 0, 7); ctx.fill();          // 배
    P(x - 7, b - 3, 4, 3, c); P(x + 3, b - 3, 4, 3, c);                                              // 다리
    P(x - 8, b - 9, 4, 4, c); P(x + 4, b - 9, 4, 4, c);                                              // 팔
    const gr = ctx.createRadialGradient(x - 1, b - 11, 1, x, b - 9, 4); gr.addColorStop(0, "#f0f8ff"); gr.addColorStop(1, "#a9c6e8");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, b - 10, 3.6, 0, 7); ctx.fill(); P(x - 1, b - 11, 1, 1, "#fff"); // 수정구
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, b - 16, 6, 0, 7); ctx.fill();                     // 머리
    ctx.beginPath(); ctx.arc(x - 5, b - 20, 2.6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + 5, b - 20, 2.6, 0, 7); ctx.fill(); // 귀
    ctx.fillStyle = cd; ctx.beginPath(); ctx.arc(x - 5, b - 20, 1.2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + 5, b - 20, 1.2, 0, 7); ctx.fill();
    ctx.fillStyle = "#f2e4d0"; ctx.beginPath(); ctx.ellipse(x, b - 14, 3.4, 2.4, 0, 0, 7); ctx.fill(); // 주둥이
    P(x - 1, b - 15, 2, 1, "#3a2b22"); P(x - 3, b - 17, 1, 1, "#2b2b2b"); P(x + 2, b - 17, 1, 1, "#2b2b2b");
    // 마법사 별 모자
    ctx.fillStyle = "#6a4ac8"; ctx.beginPath(); ctx.moveTo(x - 6, b - 21); ctx.lineTo(x, b - 32); ctx.lineTo(x + 6, b - 21); ctx.closePath(); ctx.fill();
    P(x - 7, b - 22, 14, 2, "#8a6ae0"); P(x - 1, b - 28, 2, 2, "#ffd23f"); P(x, b - 30, 1, 2, "#ffe680");
    if (snowSel()) {   // 하늘색 담요
      ctx.fillStyle = "#9ecdf0"; ctx.beginPath(); ctx.moveTo(x - 8, b - 8); ctx.quadraticCurveTo(x, b - 12, x + 8, b - 8); ctx.lineTo(x + 9, b - 1); ctx.quadraticCurveTo(x, b - 3, x - 9, b - 1); ctx.closePath(); ctx.fill();
      P(x - 8, b - 8, 16, 1, "#c3e4f8");
    }
    if (weather === "rain") {   // 나뭇잎 우산
      ctx.strokeStyle = "#6ea043"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 5, b - 9); ctx.lineTo(x + 2, b - 25); ctx.stroke();
      ctx.save(); ctx.translate(x + 1, b - 29); ctx.rotate(-0.12); ctx.scale(0.32, 0.32);
      ctx.fillStyle = "#5fbb42"; ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(46, -6, 0, 30); ctx.quadraticCurveTo(-46, -6, 0, -20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#7fd05a"; ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(46, -6, 0, 30); ctx.lineTo(0, -20); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#3a7f2c"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 28); ctx.stroke();
      ctx.restore();
    }
  }
  function nearFBear(px, py) { return Math.abs(px - FBEAR.x) < 12 && py > FBEAR.base - 34 && py < FBEAR.base + 4; }

  // ---- 곰돌이 점집 (클릭 → 화면 확대) ----
  let fortuneMode = false, bfUi, bfSay, bfBuy, fortuneAnim = 0;   // fortuneAnim: 우산 펴기/담요 걸치기 진행(0~1)
  let readState = "idle", readT = 0, pendingFortune = "";   // 점보기 연출: idle→reading(쓰다듬+빛)→done(결과)
  const READ_DUR = 54;   // 쓰다듬+빛나는 연출 길이(프레임, ≈30fps → 1.8초)
  const BEAR_FORTUNES = [
    "오늘은 예상 못한 행운이 스며드는 날이야. 마음을 활짝 열어둬~ 🍀",
    "작은 친절이 큰 보답으로 돌아올 거야. 곰이 보증하지! 🐻",
    "망설이던 그 한 걸음, 오늘 내디디면 별이 도와줄 거란다 ⭐",
    "잠깐의 휴식이 큰 힘이 될 거야. 오늘은 나에게 다정하게 💗",
    "곧 반가운 소식이 창문을 두드릴 거야. 기대해도 좋아 ✉️",
    "지나간 일은 강물처럼 흘려보내렴. 오늘의 넌 충분히 빛나 ✨",
    "행운의 색은 하늘색. 파란 무언가를 곁에 두면 좋은 일이 생겨~ 💙",
    "누군가 조용히 널 응원하고 있어. 꾸준함이 결국 답이란다 🌙",
  ];
  function openFortune() {
    window.Audio2.ensure(); window.Audio2.blip(560);
    fortuneMode = true; fortuneAnim = 0; readState = "idle"; readT = 0;   // 처음부터
    bfSay.textContent = "어서와~ 🪙10코인을 주면 오늘의 점을 봐줄게 🐻🔮";
    bfBuy.textContent = "🪙 10코인 · 점 보기";
    bfUi.classList.remove("hidden");
    canvas.classList.remove("bfort-zoom"); void canvas.offsetWidth; canvas.classList.add("bfort-zoom");
    draw();
  }
  function closeFortune() { fortuneMode = false; readState = "idle"; if (bfUi) bfUi.classList.add("hidden"); canvas.classList.remove("bfort-zoom"); window.Audio2.blip(360); draw(); }
  function buyFortune() {
    window.Audio2.ensure();
    if (readState === "reading") return;   // 연출 중엔 중복 방지
    if ((window.App.state.coins || 0) < 10) { bfSay.textContent = "앗, 코인이 부족해~ (🪙10코인 필요) 할일을 완료하고 오렴 😢"; window.Audio2.blip(220); return; }
    window.App.state.coins -= 10; window.App.save(); if (window.Main.updateCoins) window.Main.updateCoins();
    // 결과는 미리 정해두고, 쓰다듬+빛나는 연출 후 표시
    pendingFortune = "🔮 " + BEAR_FORTUNES[(Math.random() * BEAR_FORTUNES.length) | 0];
    bfSay.textContent = "✨ 수정구를 쓰다듬는 중...";
    bfBuy.textContent = "🔮 보는 중...";
    readState = "reading"; readT = 0; window.Audio2.blip(620);
  }
  // 점보기 연출 진행 (매 프레임)
  function stepFortuneRead() {
    if (readState !== "reading") return;
    readT++;
    if (readT === READ_DUR - 8) window.Audio2.blip(960);   // 빛 터지는 순간
    if (readT >= READ_DUR) {
      readState = "done";
      bfSay.textContent = pendingFortune;
      bfBuy.textContent = "🪙 한 번 더 보기 (10코인)";
      window.Audio2.blip(880);
    }
  }
  // 확대된 점집 장면 (풀스크린 · 계절·시간·날씨 반영 하늘 + 마을 + 큰 곰돌이)
  function drawFortuneScene() {
    const sh = 108, sc = snowCover;
    window.WindowSky.draw(ctx, { x: 0, y: 0, w: W, h: sh }, weather, t);   // 계절·시간·날씨 하늘 (노을/밤/구름/해·달)
    // 언덕 (눈이면 희끗)
    ctx.fillStyle = mixCol("#8fc27a", "#d6e2ee", sc); ctx.beginPath(); ctx.moveTo(0, sh);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, sh - 8 - Math.sin(x * 0.025) * 6); ctx.lineTo(W, sh); ctx.closePath(); ctx.fill();
    fscHouse(30, sh, 26, mixCol("#e0d3bd", "#eef3f8", sc), mixCol("#b06a4a", "#cbd4de", sc));
    fscHouse(86, sh, 24, mixCol("#d8cbb5", "#eef3f8", sc), mixCol("#8a9ab0", "#cbd4de", sc));
    fscChurch(152, sh, 28, sc);
    fscHouse(230, sh, 26, mixCol("#e2d6c0", "#eef3f8", sc), mixCol("#a08060", "#cbd4de", sc));
    fscHouse(292, sh, 22, mixCol("#d8cbb5", "#eef3f8", sc), mixCol("#8a9ab0", "#cbd4de", sc));
    for (let i = 4; i < W; i += 18) { P(i, sh - 9, 4, 15, "#f2eee2"); P(i, sh - 9, 1, 15, "#ffffff"); P(i + 3, sh - 9, 1, 15, "#d8d3c4"); } // 울타리
    P(0, sh - 6, W, 3, "#e6e1d2");
    P(0, sh, W, H - sh, mixCol("#63bf45", "#eef4fb", sc)); P(0, sh, W, 3, mixCol("#7fd05a", "#dfeaf5", sc)); // 잔디/설원
    if (fortuneAnim < 1) fortuneAnim = Math.min(1, fortuneAnim + 0.045);   // 우산 펴기 / 담요 걸치기 진행
    stepFortuneRead();   // 점보기(쓰다듬+빛) 연출 진행
    // 그림자는 땅에 고정 (곰만 흔들림) — 흔들려도 그림자 안 움직임
    ctx.save(); ctx.translate(W / 2, H - 4); ctx.scale(1.4, 1.4); ctx.translate(-(W / 2), -(H - 4));
    ctx.fillStyle = "rgba(30,20,10,0.25)"; ctx.beginPath(); ctx.ellipse(W / 2, H - 4, 34, 7, 0, 0, 7); ctx.fill();
    ctx.restore();
    // 큰 곰돌이 (숨쉬듯 살짝 흔들 + 비=나뭇잎 우산 / 눈=하늘색 담요)
    const bob = Math.sin(t * 0.06) * 1.2;
    ctx.save(); ctx.translate(W / 2, H - 4 + bob); ctx.scale(1.4, 1.4); ctx.translate(-(W / 2), -(H - 4));
    drawBigBear(W / 2, H - 4, true);   // 그림자 생략(위에서 이미 그림)
    if (snowSel()) drawBearBlanket(W / 2, H - 4, fortuneAnim);
    drawCrystalBall(W / 2, H - 4);      // 수정구·받침·쓰다듬 (담요 위 = 모든 날씨 동일)
    if (weather === "rain") drawBearUmbrella(W / 2, H - 4, fortuneAnim);
    ctx.restore();
    drawFortuneWx();   // 비/눈 파티클 (씬 전체)
    const nn = nightAmt(); if (nn > 0.03) { ctx.fillStyle = `rgba(12,18,45,${0.42 * nn})`; ctx.fillRect(0, 0, W, H); } // 밤 어둡게
  }
  // 확대 점집 날씨 파티클 (애니메이션)
  function drawFortuneWx() {
    if (weather === "rain") {
      ctx.strokeStyle = "rgba(200,225,245,0.55)"; ctx.lineWidth = 1;
      for (let i = 0; i < 70; i++) { const x = (((i * 47 - t * 6) % W) + W) % W, y = ((i * 53 + t * 11) % H); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 8); ctx.stroke(); }
    } else if (weather === "snow") {
      for (let i = 0; i < 55; i++) { const x = (((i * 41 + Math.sin((t + i * 30) * 0.03) * 10) % W) + W) % W, y = ((i * 37 + t * 1.4) % H); P(x, y, 2, 2, "#fff"); }
    }
  }
  // 하늘색 담요 (겨울 · 어깨에 걸친 숄처럼 · 위에서 스윽 걸치는 애니메이션)
  function drawBearBlanket(x, b, p) {
    const g = ctx; p = p == null ? 1 : p;
    const ease = 1 - Math.pow(1 - p, 3);
    const drop = (1 - ease) * 18;   // 처음엔 위에 떠 있다가 어깨로 내려앉음
    g.save(); g.globalAlpha = Math.min(1, p * 1.6); g.translate(0, -drop);
    // 몸을 감싸고 양 어깨까지 덮는 담요 (앞 목은 살짝 트여 얼굴은 안 가림)
    g.fillStyle = "#9ecdf0"; g.beginPath();
    g.moveTo(x - 30, b - 24);                              // 왼 옆구리 위
    g.quadraticCurveTo(x - 31, b - 40, x - 16, b - 41);    // 왼 어깨 위로 감쌈
    g.quadraticCurveTo(x - 8, b - 41, x - 6, b - 34);      // 어깨 → 앞 넥라인
    g.quadraticCurveTo(x, b - 32, x + 6, b - 34);          // 목 앞(살짝 트임)
    g.quadraticCurveTo(x + 8, b - 41, x + 16, b - 41);     // 오른 어깨 위로 감쌈
    g.quadraticCurveTo(x + 31, b - 40, x + 30, b - 24);    // 오른 옆구리
    g.quadraticCurveTo(x + 35, b - 12, x + 30, b - 1);     // 오른 아래 → 바닥
    g.lineTo(x - 30, b - 1);
    g.quadraticCurveTo(x - 35, b - 12, x - 30, b - 24);    // 왼 아래
    g.closePath(); g.fill();
    // 어깨 밝은 접힘 + 칼라
    g.fillStyle = "#c3e4f8";
    g.beginPath(); g.moveTo(x - 16, b - 41); g.quadraticCurveTo(x - 8, b - 41, x - 6, b - 34); g.quadraticCurveTo(x - 12, b - 38, x - 16, b - 38); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x + 16, b - 41); g.quadraticCurveTo(x + 8, b - 41, x + 6, b - 34); g.quadraticCurveTo(x + 12, b - 38, x + 16, b - 38); g.closePath(); g.fill();
    g.fillStyle = "#b3daf2"; g.beginPath(); g.ellipse(x - 25, b - 30, 6, 5, -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 25, b - 30, 6, 5, 0.4, 0, 7); g.fill();   // 어깨 접힘
    g.strokeStyle = "#7fb4de"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, b - 33); g.lineTo(x, b - 2); g.stroke();   // 앞 여밈선
    g.strokeStyle = "rgba(120,175,218,0.6)"; g.lineWidth = 1;                 // 좌우 주름
    g.beginPath(); g.moveTo(x - 15, b - 29); g.lineTo(x - 22, b - 3); g.moveTo(x + 15, b - 29); g.lineTo(x + 22, b - 3); g.stroke();
    g.fillStyle = "#7fb4de"; g.fillRect(x - 30, b - 3, 60, 3);                // 아래 그림자단
    g.fillStyle = "rgba(255,255,255,0.85)";                                   // 눈송이 무늬
    for (const s of [[-18, -24], [17, -22], [-23, -11], [22, -13], [-10, -6], [11, -7]]) { const px = x + s[0], py = b + s[1]; g.fillRect(px - 1, py, 3, 1); g.fillRect(px, py - 1, 1, 3); }
    g.restore();
  }
  // 나뭇잎 우산 (비 · 큰 잎을 펴서 씀 · 펴지는 애니메이션)
  function drawBearUmbrella(x, b, p) {
    const g = ctx; p = p == null ? 1 : p;
    const ease = 1 - Math.pow(1 - p, 3);
    const sc = 0.18 + 0.82 * ease;   // 접혔다 펴짐
    const ly = b - 92 - (1 - ease) * 6;
    // 잎자루(줄기) = 손잡이
    g.strokeStyle = "#6ea043"; g.lineWidth = 2.4; g.lineCap = "round";
    g.beginPath(); g.moveTo(x + 14, b - 28); g.quadraticCurveTo(x + 17, b - 52, x + 2, ly + 26 * sc); g.stroke();
    // 큰 나뭇잎 (펼쳐지며 곰 위를 덮음)
    g.save(); g.translate(x + 2, ly); g.rotate(-0.12 * ease); g.scale(sc, sc);
    g.fillStyle = "#5fbb42"; g.beginPath();                    // 잎 본체 (끝이 뾰족한 잎)
    g.moveTo(0, -20); g.quadraticCurveTo(46, -6, 0, 30); g.quadraticCurveTo(-46, -6, 0, -20); g.closePath(); g.fill();
    g.fillStyle = "#7fd05a"; g.beginPath();                    // 오른쪽 밝은 반쪽
    g.moveTo(0, -20); g.quadraticCurveTo(46, -6, 0, 30); g.lineTo(0, -20); g.closePath(); g.fill();
    g.strokeStyle = "#3a7f2c"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -16); g.lineTo(0, 26); g.stroke();   // 주맥
    g.lineWidth = 1; for (const [vy, vx] of [[-4, 16], [6, 15], [15, 10]]) { g.beginPath(); g.moveTo(0, vy); g.lineTo(vx, vy - 7); g.moveTo(0, vy); g.lineTo(-vx, vy - 7); g.stroke(); }   // 측맥(잎 안쪽)
    g.restore();
    if (p > 0.85) for (const dx of [-20, -6, 8, 20]) P(x + 2 + dx, b - 82, 1, 3, "rgba(200,225,245,0.7)");   // 잎끝 낙수
    g.lineCap = "butt";
  }
  function fscHouse(cx, gy, w, wall, roof) {
    const x = cx - w / 2, h = Math.round(w * 0.9), top = gy - h;
    P(x, top, w, h, wall); P(x + w - 2, top, 2, h, "rgba(0,0,0,0.1)");
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 2, top); ctx.lineTo(cx, top - w * 0.5); ctx.lineTo(x + w + 2, top); ctx.closePath(); ctx.fill();
    P(x + 2, top + 3, 3, 3, "#ffe27a"); P(x + w - 5, top + 3, 3, 3, "#ffe27a"); P(cx - 2, gy - h * 0.42, 4, h * 0.42, "#6e4a30");
  }
  function fscChurch(cx, gy, w, sc) {
    sc = sc || 0;
    const x = cx - w / 2, h = w, top = gy - h;
    P(x, top + 4, w, h - 4, mixCol("#e8dfca", "#eef3f8", sc));
    ctx.fillStyle = mixCol("#8a9ab0", "#cbd4de", sc); ctx.beginPath(); ctx.moveTo(x, top + 4); ctx.lineTo(cx, top - 4); ctx.lineTo(x + w, top + 4); ctx.closePath(); ctx.fill();
    P(cx - 1, top - 11, 2, 6, "#c9a94a"); P(cx - 3, top - 9, 6, 2, "#c9a94a");
    ctx.fillStyle = "#5aa0d0"; ctx.beginPath(); ctx.arc(cx, top + 14, 2.6, 0, 7); ctx.fill();
  }
  function bfStar(px, py) { P(px - 1, py, 3, 1, "#ffe680"); P(px, py - 1, 1, 3, "#ffe680"); }
  function drawBigBear(x, b, skipShadow) {
    const g = ctx, c = "#a9764a", cd = "#7a5230", cl = "#c49a6a";
    if (!skipShadow) { g.fillStyle = "rgba(30,20,10,0.25)"; g.beginPath(); g.ellipse(x, b, 34, 7, 0, 0, 7); g.fill(); }
    g.fillStyle = c; g.beginPath(); g.ellipse(x, b - 24, 26, 24, 0, 0, 7); g.fill();
    g.fillStyle = cl; g.beginPath(); g.ellipse(x, b - 18, 16, 14, 0, 0, 7); g.fill();
    g.fillStyle = c; g.beginPath(); g.ellipse(x - 16, b - 4, 8, 6, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 16, b - 4, 8, 6, 0, 0, 7); g.fill();
    g.fillStyle = cl; g.beginPath(); g.ellipse(x - 16, b - 3, 4, 3, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 16, b - 3, 4, 3, 0, 0, 7); g.fill();
    // 팔 (어깨에서 수정구 쪽으로 뻗음) — 수정구/손은 drawCrystalBall에서 (담요 위에 그림)
    g.fillStyle = c; g.beginPath(); g.ellipse(x - 17, b - 28, 6, 9, 0.55, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 17, b - 28, 6, 9, -0.55, 0, 7); g.fill();
    g.fillStyle = c; g.beginPath(); g.arc(x, b - 54, 18, 0, 7); g.fill();
    g.beginPath(); g.arc(x - 14, b - 64, 7, 0, 7); g.fill(); g.beginPath(); g.arc(x + 14, b - 64, 7, 0, 7); g.fill();
    g.fillStyle = cd; g.beginPath(); g.arc(x - 14, b - 64, 3.4, 0, 7); g.fill(); g.beginPath(); g.arc(x + 14, b - 64, 3.4, 0, 7); g.fill();
    g.fillStyle = "#f2e4d0"; g.beginPath(); g.ellipse(x, b - 49, 9, 7, 0, 0, 7); g.fill();
    g.fillStyle = "#3a2b22"; g.beginPath(); g.ellipse(x, b - 52, 2.4, 1.8, 0, 0, 7); g.fill();
    // 눈 (수정구를 내려다봄 + 가끔 깜박)
    const blink = (t % 210) < 7;
    g.fillStyle = "#3a2b22";
    if (blink) { g.fillRect(x - 8, b - 55, 5, 1); g.fillRect(x + 3, b - 55, 5, 1); }   // 감은 눈
    else {
      g.beginPath(); g.ellipse(x - 6, b - 55, 1.9, 2.3, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 6, b - 55, 1.9, 2.3, 0, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.fillRect(x - 7, b - 56, 1, 1); g.fillRect(x + 5, b - 56, 1, 1);   // 반짝
      g.fillStyle = "rgba(58,43,34,0.55)"; g.fillRect(x - 8, b - 58, 5, 1); g.fillRect(x + 3, b - 58, 5, 1);   // 윗눈꺼풀(내려봄)
    }
    g.fillStyle = "#ffb3c6"; g.fillRect(x - 11, b - 50, 2, 2); g.fillRect(x + 9, b - 50, 2, 2);
    g.fillStyle = "#6a4ac8"; g.beginPath(); g.moveTo(x - 16, b - 66); g.lineTo(x + 4, b - 92); g.lineTo(x + 16, b - 66); g.closePath(); g.fill();  // 별 모자
    g.fillStyle = "#8a6ae0"; g.fillRect(x - 18, b - 68, 36, 4);
    for (const s of [[-4, -74], [6, -82], [-2, -88]]) bfStar(x + s[0], b + s[1]);
  }
  // 수정구 + 받침(땅 위) + 쓰다듬는 손 + 빛나는 연출 — 모든 날씨(겨울엔 담요 위에 그림)
  function drawCrystalBall(x, b) {
    const g = ctx, c = "#a9764a", cl = "#c49a6a";
    const bx = x, by = b - 25, R = 13, reading = readState === "reading";
    const glow = reading ? 0.25 + 0.7 * (readT / READ_DUR) : (readState === "done" ? 0.55 : 0.4) + 0.14 * Math.sin(t * 0.12);
    const flash = reading && readT > READ_DUR - 12 ? (readT - (READ_DUR - 12)) / 12 : 0;
    // 받침 (갈색 나무 · 땅 위)
    g.fillStyle = "#5a3c24"; g.beginPath(); g.ellipse(bx, b - 1, 15, 4.5, 0, 0, 7); g.fill();
    g.fillStyle = "#7a5230"; g.beginPath(); g.ellipse(bx, b - 2, 13, 3.8, 0, 0, 7); g.fill();
    g.fillStyle = "#5a3c24"; g.fillRect(bx - 4, b - 13, 8, 11); g.fillStyle = "#8a5f38"; g.fillRect(bx - 4, b - 13, 2.5, 11);   // 기둥
    g.fillStyle = "#6e4a2e"; g.beginPath(); g.ellipse(bx, b - 13, 9, 3.2, 0, 0, 7); g.fill(); g.fillStyle = "#8a5f38"; g.beginPath(); g.ellipse(bx, b - 14, 8, 2.6, 0, 0, 7); g.fill();   // 컵
    // 후광 (읽는 중 상승 + 막판 플래시)
    const hR = R + 15 + flash * 24; const hgr = g.createRadialGradient(bx, by, 2, bx, by, hR);
    hgr.addColorStop(0, `rgba(190,232,255,${0.42 * glow + flash * 0.55})`); hgr.addColorStop(1, "rgba(190,232,255,0)");
    g.fillStyle = hgr; g.beginPath(); g.arc(bx, by, hR, 0, 7); g.fill();
    // 수정구 본체
    const cgr = g.createRadialGradient(bx - 4, by - 4, 2, bx, by, R);
    cgr.addColorStop(0, "#f7fbff"); cgr.addColorStop(0.5, mixCol("#c2dbf2", "#eaf7ff", glow)); cgr.addColorStop(1, mixCol("#7fa8d8", "#a9d0f0", glow));
    g.fillStyle = cgr; g.beginPath(); g.arc(bx, by, R, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.arc(bx - 4.5, by - 4.5, 3, 0, 7); g.fill();   // 하이라이트
    g.fillStyle = `rgba(255,255,255,${0.45 + 0.5 * glow})`;                                               // 내부 반짝임
    for (const st of [[4, 2], [-3, -6], [6, -3], [-6, 4]]) { const a = t * 0.15 + st[0]; g.fillRect(bx + st[0] + Math.cos(a) * 0.6, by + st[1] + Math.sin(a) * 0.6, 1, 1); }
    // 쓰다듬는 손 (읽는 중 수정구 위를 문지름 · 평소엔 살랑)
    const stroke = reading ? Math.sin(readT * 0.45) * 5 : Math.sin(t * 0.05) * 1.2;
    g.fillStyle = c;
    g.beginPath(); g.ellipse(bx - 11 + stroke * 0.35, by - 5, 5, 4.5, 0.3, 0, 7); g.fill();
    g.beginPath(); g.ellipse(bx + 11 - stroke * 0.35, by - 4, 5, 4.5, -0.3, 0, 7); g.fill();
    g.fillStyle = cl;
    g.beginPath(); g.ellipse(bx - 11 + stroke * 0.35, by - 6, 2.2, 1.8, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(bx + 11 - stroke * 0.35, by - 5, 2.2, 1.8, 0, 0, 7); g.fill();
    if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash * 0.5})`; g.beginPath(); g.arc(bx, by, R + 2, 0, 7); g.fill(); }   // 플래시
  }

  function drawSnowman() {
    const sx = SNOWMAN.x, sy = SNOWMAN.base;
    castShadow(sx, sy, 9, 20);
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(sx, sy - 7, 8, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(sx, sy - 19, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#dfeaf5"; ctx.beginPath(); ctx.arc(sx + 2, sy - 6, 6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(sx + 2, sy - 18, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(sx - 1, sy - 8, 6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(sx - 1, sy - 20, 4.5, 0, 7); ctx.fill();
    P(sx - 3, sy - 20, 1, 1, "#2b2b2b"); P(sx, sy - 20, 1, 1, "#2b2b2b");   // 눈
    P(sx, sy - 18, 3, 1, "#ff8a3a");                                        // 코(당근)
    P(sx - 1, sy - 9, 1, 1, "#2b2b2b"); P(sx - 1, sy - 6, 1, 1, "#2b2b2b"); // 단추
    ctx.strokeStyle = "#7a5230"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx - 7, sy - 10); ctx.lineTo(sx - 13, sy - 14); ctx.moveTo(sx + 7, sy - 10); ctx.lineTo(sx + 13, sy - 13); ctx.stroke(); // 팔
    P(sx - 5, sy - 27, 10, 3, "#c0392b"); P(sx - 4, sy - 31, 8, 4, "#c0392b");  // 모자
  }

  // ============================================================
  //  고양이
  // ============================================================
  function drawHead(hx, hy, blink) {
    const c = "#e79a4a", d = "#c9772a", lo = "#f2b877";
    P(hx - 7, hy - 1, 2, 3, c); P(hx + 5, hy - 1, 2, 3, c);            // 볼 털
    P(hx - 6, hy - 5, 12, 10, c);                                      // 얼굴
    P(hx - 6, hy + 3, 12, 2, lo);                                      // 턱 밝게
    P(hx - 6, hy - 9, 4, 5, c); P(hx + 2, hy - 9, 4, 5, c);            // 귀
    P(hx - 5, hy - 7, 2, 3, "#ff9ab0"); P(hx + 3, hy - 7, 2, 3, "#ff9ab0"); // 귀 안
    P(hx - 4, hy - 4, 1, 3, d); P(hx - 1, hy - 5, 1, 3, d); P(hx + 2, hy - 4, 1, 3, d); // 이마 줄무늬
    if (blink) { P(hx - 4, hy - 1, 3, 1, "#3a2a1a"); P(hx + 2, hy - 1, 3, 1, "#3a2a1a"); }
    else {
      P(hx - 4, hy - 2, 3, 3, "#3a6b3a"); P(hx + 2, hy - 2, 3, 3, "#3a6b3a");     // 초록 눈
      P(hx - 3, hy - 1, 1, 2, "#0a0a0a"); P(hx + 3, hy - 1, 1, 2, "#0a0a0a");     // 동공
      P(hx - 4, hy - 2, 1, 1, "#ffffff"); P(hx + 2, hy - 2, 1, 1, "#ffffff");     // 반짝
    }
    P(hx - 1, hy + 1, 2, 1, "#ff8aa8");                                // 코
    ctx.strokeStyle = "#c9772a"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(hx, hy + 2); ctx.lineTo(hx - 2, hy + 3); ctx.moveTo(hx, hy + 2); ctx.lineTo(hx + 2, hy + 3); ctx.stroke(); // 입
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 0.5; ctx.beginPath();
    ctx.moveTo(hx - 4, hy + 1); ctx.lineTo(hx - 10, hy); ctx.moveTo(hx - 4, hy + 2); ctx.lineTo(hx - 10, hy + 3);
    ctx.moveTo(hx + 4, hy + 1); ctx.lineTo(hx + 10, hy); ctx.moveTo(hx + 4, hy + 2); ctx.lineTo(hx + 10, hy + 3); ctx.stroke(); // 수염 양쪽
  }
  function drawCat() {
    const c = "#e79a4a", d = "#c9772a", l = "#f2b877", dk = "#a85f1f";
    castShadow(cat.x, cat.y + 2, 12, 8);
    ctx.save(); ctx.translate(Math.round(cat.x), cat.y); ctx.scale(cat.dir, 1);
    if (cat.state === "sleep") {
      const br = Math.sin(t * 0.06) * 0.5;                                                        // 숨쉬기
      // 웅크린 몸통(둥근 로프)
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(1, -6, 12, 7.5 + br, 0, 0, 7); ctx.fill();
      ctx.fillStyle = d; ctx.beginPath(); ctx.ellipse(3, -9, 8.5, 4.5, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); // 등 그늘
      for (const sx of [-2, 2, 6]) P(sx, -13, 1, 3, "#c9772a");                                   // 등 줄무늬
      // 꼬리: 몸 앞을 부드럽게 감쌈
      ctx.lineCap = "round";
      ctx.strokeStyle = c; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(1, -5, 11, 0.15, 2.15); ctx.stroke();
      ctx.strokeStyle = d; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(1, -5, 11, 1.85, 2.2); ctx.stroke();       // 꼬리 끝
      ctx.lineCap = "butt";
      // 앞발 (머리 아래로 살짝)
      ctx.fillStyle = l; ctx.beginPath(); ctx.ellipse(-8, 0, 6, 2.4, 0, 0, 7); ctx.fill();
      // 머리 (앞발에 얹고 잠)
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-9, -4, 6.5, 0, 7); ctx.fill();
      ctx.fillStyle = l; ctx.beginPath(); ctx.ellipse(-9, -1.5, 5, 3, 0, 0, 7); ctx.fill();        // 볼·주둥이 밝게
      // 귀 (삼각)
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(-13, -12); ctx.lineTo(-9, -8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(-5, -12); ctx.lineTo(-3, -7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ff9ab0"; P(-12, -9, 1, 2, "#ff9ab0"); P(-6, -9, 1, 2, "#ff9ab0");
      // 감은 눈 (아래로 굽은 곡선 = 편안)
      ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(-11, -4.5, 1.7, 0.35, 2.79); ctx.stroke();
      ctx.beginPath(); ctx.arc(-6.5, -4.5, 1.7, 0.35, 2.79); ctx.stroke();
      // 코 + 수염
      P(-9, -2, 2, 1, "#ff8aa8");
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(-9, -1); ctx.lineTo(-15, -2); ctx.moveTo(-9, 0); ctx.lineTo(-15, 1); ctx.stroke();
      ctx.restore();
      // Zzz (숨결)
      const zf = (t % 90) / 90;                                                                   // 0→1 떠오름
      ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - zf)})`; ctx.textAlign = "left";
      ctx.font = "italic 8px sans-serif"; ctx.fillText("z", cat.x + 7 + zf * 3, cat.y - 14 - zf * 6);
      ctx.font = "italic 6px sans-serif"; ctx.fillText("z", cat.x + 12, cat.y - 18);
      return;
    }
    if (cat.state === "sit") {
      const tw = Math.sin(t * 0.1) * 3;
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-7, -2); ctx.quadraticCurveTo(-14, -6, -9 + tw, -16); ctx.stroke();
      ctx.strokeStyle = d; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9 + tw, -14); ctx.lineTo(-9 + tw, -16); ctx.stroke();  // 꼬리 끝
      P(-7, -16, 14, 16, c); P(-4, -9, 8, 9, l);                        // 몸 + 가슴 털
      P(-3, -18, 3, 2, d); P(1, -18, 3, 2, d);                          // 등 줄무늬
      P(-5, -3, 4, 3, c); P(1, -3, 4, 3, c); P(-5, -2, 4, 1, l); P(1, -2, 4, 1, l);  // 앞발
      drawHead(0, -21, cat.blink);
    } else {
      const bob = Math.abs(Math.sin(cat.phase)) * 1, tw = Math.sin(t * 0.18) * 3;
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-11, -8 - bob); ctx.quadraticCurveTo(-17, -12, -13 + tw, -20); ctx.stroke();
      ctx.strokeStyle = d; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-13 + tw, -18); ctx.lineTo(-13 + tw, -20); ctx.stroke(); // 꼬리 끝
      // 다리: 엉덩이(몸)에서 바닥까지 이어지고 발은 땅에 붙어 앞뒤로 흔들림 (대각 걸음)
      const legX = [-8, -5, 4, 7];
      for (let i = 0; i < 4; i++) {
        const sw = Math.sin(cat.phase + ((i === 0 || i === 3) ? 0 : Math.PI)) * 2.4;
        const footX = legX[i] + sw;
        ctx.strokeStyle = dk; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(legX[i], -6 - bob); ctx.lineTo(footX, 0); ctx.stroke(); // 다리
        P(footX - 1, -1, 3, 2, c); // 발
      } // 다리 + 발
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -10 - bob, 12, 7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = l; ctx.beginPath(); ctx.ellipse(-2, -8 - bob, 10, 4, 0, 0, 7); ctx.fill(); // 배 밝게
      P(-6, -15 - bob, 3, 1, d); P(-1, -16 - bob, 3, 1, d); P(4, -15 - bob, 3, 1, d);           // 등 줄무늬
      drawHead(9, -14 - bob, cat.blink);
    }
    ctx.restore();
  }
  function stepCat() {
    if (catSleeping()) { cat.state = "sleep"; cat.dir = 1; cat.pet = 0; return; }   // 밤엔 잠
    if (cat.state === "sleep") { cat.state = "sit"; cat.timer = 60; }                // 깨어남
    if (t % 150 < 3) cat.blink = 3; else if (cat.blink > 0) cat.blink--;
    if (cat.pet > 0) { cat.pet--; cat.state = "sit"; cat.timer = Math.max(cat.timer, cat.pet); if (t % 8 === 0) hearts.push({ x: cat.x - 4 + rnd(8), y: cat.y - 26, life: 1 }); return; }
    cat.timer--;
    if (cat.timer <= 0) { if (cat.state === "walk") { cat.state = "sit"; cat.timer = 60 + rnd(90); } else { cat.state = "walk"; cat.timer = 90 + rnd(120); cat.dir2 = rnd(1) > 0.5 ? 1 : -1; } }
    if (cat.state === "walk") { cat.phase += 0.28; cat.dir = cat.dir2; cat.x += cat.dir2 * 0.55; if (cat.x < 34) { cat.x = 34; cat.dir2 = 1; } if (cat.x > 286) { cat.x = 286; cat.dir2 = -1; } }
  }

  // ============================================================
  //  파티클/하트
  // ============================================================
  function seedPetals() { petals = []; if (weather === "rainbow") for (let i = 0; i < 18; i++) petals.push({ x: rnd(W), y: rnd(H), vy: 0.3 + rnd(0.5), sw: rnd(6.28) }); }   // 무지개일 때만 꽃잎
  function seedFlowers() { flowers = []; const cols = ["#ff7aa0", "#ffd23f", "#ff9ab8", "#c98ae0", "#ffffff"]; for (let i = 0; i < 26; i++) { const x = rnd(W), y = HZ + 22 + rnd(H - HZ - 26); if (Math.abs(x - pathCx((y - HZ) / (H - HZ))) < 24) continue; flowers.push({ x, y, c: cols[i % cols.length] }); } }
  function drawFlowers() { for (const f of flowers) { P(f.x, f.y, 1, 2, "#4a8a2e"); P(f.x - 1, f.y - 2, 3, 2, f.c); P(f.x, f.y - 1, 1, 1, "#ffe680"); } }
  function drawWeatherFx() {
    if (weather === "rainbow") { for (const p of petals) { p.y += p.vy; p.sw += 0.05; p.x += Math.sin(p.sw) * 0.4; if (p.y > H) { p.y = -4; p.x = rnd(W); } P(p.x, p.y, 2, 2, "#ffc0d8"); } }
    else if (weather === "rain") { ctx.strokeStyle = "rgba(200,225,245,0.6)"; ctx.lineWidth = 1; for (let i = 0; i < 44; i++) { const x = (i * 37 - t * 4) % W, y = (i * 53 + t * 8) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 6); ctx.stroke(); } }
    else if (weather === "snow") { ctx.fillStyle = "#fff"; for (let i = 0; i < 36; i++) { const x = (i * 29 + Math.sin((t + i * 8) * 0.05) * 6) % W, y = (i * 41 + t * 1.4) % H; P(x, y, 2, 2, "#fff"); } }
  }
  function drawHearts() { for (const h of hearts) { h.y -= 0.8; h.life -= 0.02; ctx.globalAlpha = Math.max(0, h.life); ctx.fillStyle = "#ff6f91"; P(h.x, h.y + 1, 3, 2, "#ff6f91"); P(h.x, h.y, 1, 1, "#ff6f91"); P(h.x + 2, h.y, 1, 1, "#ff6f91"); ctx.globalAlpha = 1; } hearts = hearts.filter((h) => h.life > 0); }

  // ---- 밤 어둡게 + 반딧불이 ----
  function nightAmt() { return window.WindowSky.nightness(); }
  function drawNightOverlay() { const nn = nightAmt(); if (nn > 0.03) { ctx.fillStyle = `rgba(12,18,45,${0.5 * nn})`; ctx.fillRect(0, 0, W, H); } }
  function newFirefly() { return { x: 16 + rnd(W - 32), y: HZ + 14 + rnd(H - HZ - 22), vx: (rnd(1) - 0.5) * 0.3, vy: (rnd(1) - 0.5) * 0.2, ph: rnd(6.28), life: 1 }; }
  function fireflyWeatherOk() { return !snowSel() && weather !== "rain"; }
  function seedFireflies() {   // 입장 시: 밤이면 일정 확률로 반딧불이 등장 (비·눈 제외)
    fireflies = [];
    firefliesActive = (nightAmt() > 0.55 && fireflyWeatherOk() && Math.random() < 0.65);
    if (firefliesActive) { const n = 3 + ((Math.random() * 4) | 0); for (let i = 0; i < n; i++) fireflies.push(newFirefly()); }
  }
  function stepFireflies() {
    const night = nightAmt() > 0.55 && fireflyWeatherOk();
    if (!night) firefliesActive = false;
    if (firefliesActive && night && fireflies.length < 9 && Math.random() < 0.04) fireflies.push(newFirefly());
    for (const f of fireflies) {
      f.x += f.vx + Math.sin(f.ph * 0.7) * 0.2; f.y += f.vy + Math.cos(f.ph * 0.5) * 0.14; f.ph += 0.05;
      if (f.x < 8) f.vx = Math.abs(f.vx); if (f.x > W - 8) f.vx = -Math.abs(f.vx);
      if (f.y < HZ + 8) f.vy = Math.abs(f.vy); if (f.y > H - 6) f.vy = -Math.abs(f.vy);
      if (!night) f.life -= 0.02;                 // 낮/눈 오면 서서히 사라짐
    }
    fireflies = fireflies.filter((f) => f.life > 0);
  }
  function drawFireflies() {
    for (const f of fireflies) {
      const glow = ((Math.sin(f.ph) + 1) / 2) * f.life;   // 반짝반짝
      if (glow < 0.05) continue;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 5);
      g.addColorStop(0, `rgba(212,255,140,${0.7 * glow})`); g.addColorStop(1, "rgba(212,255,140,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(240,255,190,${glow})`; ctx.fillRect(f.x | 0, f.y | 0, 1, 1);
    }
  }

  // ============================================================
  //  씬 조립 (원경 → 근경)
  // ============================================================
  function draw() {
    if (fortuneMode) { ctx.clearRect(0, 0, W, H); drawFortuneScene(); return; }   // 곰돌이 점집 확대 화면
    ctx.clearRect(0, 0, W, H);
    SH = shadowParams();
    window.WindowSky.draw(ctx, { x: 0, y: 0, w: W, h: HZ }, weather, t);
    drawFar();
    drawGround();
    drawLampAt(LAMP2.x, LAMP2.base, LAMP2.s);   // 원경(좌) 가로등
    for (const tr of BG_TREES) drawTree(tr.x, tr.base, tr.s);   // 가로등 왼쪽 나무 무리 (연못 뒤)
    drawPond();
    if (!isSnow()) drawFlowers();
    drawFortuneBear();                                 // 점쟁이 곰돌이
    if (isSnow()) drawSnowman();
    drawTree(TREES[0].x, TREES[0].base, TREES[0].s);   // 근경 나무 (좌)
    drawTree(TREES[1].x, TREES[1].base, TREES[1].s);   // 근경 나무 (우)
    drawBench();
    drawSign();
    drawLamp();
    drawCat();
    drawLeaves();              // 떨어지는 낙엽 (눈 전환 시)
    drawWeatherFx(); drawHearts();
    drawWxFade();              // 날씨 전환 은은한 페이드
    drawNightOverlay();        // 밤엔 씬 어둡게
    drawFireflies();           // 반딧불이 (어둠 위에서 반짝)
    drawLampGlow();            // 가로등 불빛
  }
  // 낙엽 (눈 오기 시작할 때 우수수 · 페이드 인/아웃 + 스태거)
  function spawnLeaves(n) {
    const cols = ["#e0742c", "#d94f2c", "#e8b04a", "#c98a3a", "#9aa83a", "#d98a3a"];
    for (let i = 0; i < n; i++) { const tr = TREES[i % TREES.length]; leaves.push({ x: tr.x - tr.s * 0.5 + rnd(tr.s), y: tr.base - tr.s * 1.35 + rnd(tr.s * 0.6), vy: 0.35 + rnd(0.5), vx: (rnd(1) - 0.5) * 0.5, sw: rnd(6.28), c: cols[(rnd(cols.length)) | 0], t: -i * 4 - (rnd(6) | 0), gy: H - 5 - rnd(12), grounded: 0 }); } // t<0 = 등장 대기(스태거)
  }
  function stepLeaves() {
    for (const lf of leaves) {
      lf.t++; if (lf.t < 0) continue;                                  // 아직 등장 전
      lf.sw += 0.08;
      if (lf.grounded > 0 || lf.y >= lf.gy) { lf.grounded++; lf.x += Math.sin(lf.sw) * 0.05; } // 착지 후 정지(눈에 묻힘)
      else { lf.x += lf.vx + Math.sin(lf.sw) * 0.7; lf.y += lf.vy; }
    }
    leaves = leaves.filter((lf) => lf.grounded < 55);
  }
  function drawLeaves() {
    for (const lf of leaves) {
      if (lf.t < 0) continue;
      const fin = Math.min(1, (lf.t + 1) / 16);                        // 페이드 인
      const fout = lf.grounded > 0 ? Math.max(0, 1 - lf.grounded / 55) : 1; // 착지 후 서서히 사라짐
      const a = fin * fout; if (a <= 0.02) continue;
      ctx.globalAlpha = a;
      const s = Math.sin(lf.sw);
      P(lf.x, lf.y, 2 + (s > 0 ? 1 : 0), 2, lf.c); P(lf.x + (s > 0 ? 1 : 0), lf.y - 1, 1, 1, "#7a5a2a");
    }
    ctx.globalAlpha = 1;
  }
  function drawWxFade() {
    if (wxFade <= 0.01) return;
    const tint = weather === "snow" ? "255,255,255" : weather === "rain" ? "90,110,135" : weather === "rainbow" ? "255,235,255" : "255,244,210";
    ctx.fillStyle = `rgba(${tint},${0.35 * wxFade})`; ctx.fillRect(0, 0, W, H);
  }

  function updateParkMusic() {
    if (!running) return;
    const night = window.WindowSky.nightness() > 0.5;
    window.Audio2.setLocationMusic(night ? "music/park_night.m4a" : "music/park_day.m4a"); // 같은 트랙이면 내부에서 무시
  }

  function loop(ts) {
    if (!running) return;
    if (ts - last > 33) {
      last = ts; t++; stepCat(); stepFireflies(); stepLeaves();
      snowCover += ((snowSel() ? 1 : 0) - snowCover) * 0.04;   // 눈 서서히 쌓임/녹음
      if (wxFade > 0) wxFade = Math.max(0, wxFade - 0.035);     // 날씨 전환 페이드
      if (t % 30 === 0) { updateParkMusic(); if (!birdsAllowed() && birds.length) birds = []; }  // 저녁6시/비/눈이면 새 떠남
      if (birdsAway) for (const b of birds) { if (b.state === "fly") { b.x += b.vx; b.y += b.vy; b.vy -= 0.02; b.flap += 0.4; } }  // 날아가기만, 자동 복귀 없음
      draw();
    }
    requestAnimationFrame(loop);
  }

  // ============================================================
  //  입력
  // ============================================================
  function toV(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function nearCat(px, py) { return Math.abs(px - cat.x) < 16 && py > cat.y - 30 && py < cat.y + 6; }
  function inPond(px, py) { const { cx, cy, rx, ry } = POND; return ((px - cx) ** 2) / (rx * rx) + ((py - cy) ** 2) / (ry * ry) <= 1.3; }
  function inSign(px, py) { return px >= SIGN.x - 16 && px <= SIGN.x + 16 && py >= SIGN.base - 36 && py <= SIGN.base - 19; }
  function onMove(e) { const { x, y } = toV(e); const pond = inPond(x, y) && !isSnow() && birds.some((b) => b.state === "swim"); canvas.style.cursor = ((nearCat(x, y) && !catSleeping()) || pond || inSign(x, y) || nearFBear(x, y)) ? "pointer" : "default"; }
  function onClick(e) {
    window.Audio2.ensure();
    const { x, y } = toV(e);
    if (nearFBear(x, y)) { openFortune(); return; }             // 점쟁이 곰돌이 → 확대 점집
    if (inSign(x, y)) { window.Main.walkTo("shop"); return; }   // 페이드+발소리 후 상점
    if (nearCat(x, y)) { if (catSleeping()) return; cat.pet = 45; cat.state = "sit"; cat.timer = 50; window.Audio2.meow(); return; }   // 자는 중엔 상호작용 X
    if (inPond(x, y) && !isSnow() && !birdsAway && birds.some((b) => b.state === "swim")) {
      birdsAway = true; window.Audio2.blip(600);
      for (const b of birds) { if (b.state === "swim") { b.state = "fly"; b.x = POND.cx + b.ox; b.y = POND.cy + b.oy; b.vx = (rnd(1) > 0.5 ? 1 : -1) * (1 + rnd(1.5)); b.vy = -(1.5 + rnd(1)); } }
    }
  }

  window.Park = {
    init() {
      canvas = document.getElementById("park-canvas"); ctx = canvas.getContext("2d");
      canvas.width = W; canvas.height = H; ctx.imageSmoothingEnabled = false;
      weather = window.App.state.weather || "sunny";
      canvas.addEventListener("mousemove", onMove); canvas.addEventListener("click", onClick);
      // 곰돌이 점집 (화면 확대 + 하단 UI)
      bfUi = document.getElementById("bfort-ui"); bfSay = document.getElementById("bfort-say"); bfBuy = document.getElementById("bfort-buy");
      document.getElementById("bfort-close").addEventListener("click", closeFortune);
      bfBuy.addEventListener("click", buyFortune);
      seedPetals(); seedFlowers(); seedBirds(); draw();
    },
    start() { running = true; last = 0; seedBirds(); seedFireflies(); requestAnimationFrame(loop); window.Audio2.setAmbient(weather === "rain" ? "rain" : "wind"); updateParkMusic(); draw(); },  // 재입장 시 새·반딧불이 다시
    stop() { running = false; fortuneMode = false; if (bfUi) bfUi.classList.add("hidden"); if (canvas) canvas.classList.remove("bfort-zoom"); },
    setWeather(w) {
      const prev = weather; weather = w;
      wxFade = 1;                                          // 은은한 전환 페이드
      if (w === "snow" && prev !== "snow") spawnLeaves(16); // 눈 오면 낙엽 우수수
      seedPetals();
      if (birdsAllowed()) { if (birds.length === 0) seedBirds(); } else birds = [];  // 새 조건 갱신
      seedFireflies();
      if (ctx) draw();
    },
    get weather() { return weather; },
  };
})();
