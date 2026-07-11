/* ============================================================
   기능 아이템 스킨 — window.Skins
   컴퓨터·어항·TV·책장·소파·라디오·냉장고·전자레인지·개수대 + 벽지·바닥·창문
   각 방 모듈이 draw 시 Skins.theme(item) / wall() / floor() / winShape() 를 읽어 분기
   idx 0 = 기본(무료). 벽지·바닥·창문은 idx0 이면 각 방의 원래 모습 유지.
   ============================================================ */
(function () {
  "use strict";
  function P(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function hx(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, f) { const A = hx(a), B = hx(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * f)},${Math.round(A[1] + (B[1] - A[1]) * f)},${Math.round(A[2] + (B[2] - A[2]) * f)})`; }

  // item → 방 이름/라벨 (상점 표시 순서)
  const ITEMS = [
    { item: "wallpaper", label: "벽지", room: "모든 방" },
    { item: "floor", label: "바닥", room: "모든 방" },
    { item: "window", label: "창문", room: "모든 방" },
    { item: "light", label: "전등", room: "모든 방" },
    { item: "computer", label: "컴퓨터", room: "방" },
    { item: "aquarium", label: "어항", room: "방" },
    { item: "tv", label: "TV", room: "거실" },
    { item: "bookshelf", label: "책장", room: "거실" },
    { item: "sofa", label: "소파", room: "거실" },
    { item: "radio", label: "라디오", room: "거실" },
    { item: "fridge", label: "냉장고", room: "부엌" },
    { item: "microwave", label: "전자레인지", room: "부엌" },
    { item: "sink", label: "개수대", room: "부엌" },
  ];

  const THEMES = {
    wallpaper: [
      { name: "기본", price: 0 },
      { name: "파스텔 핑크", price: 200, top: "#ffe6f1", mid: "#ffd4e6", low: "#f7c0da" },
      { name: "포근한 민트", price: 200, top: "#e4f6ee", mid: "#d2f0e2", low: "#c0e6d6" },
      { name: "맑은 하늘", price: 200, top: "#e6f3fb", mid: "#d2eaf6", low: "#c2e2f0" },
    ],
    floor: [
      { name: "기본", price: 0 },
      { name: "다크 우드", price: 200, main: "#8a5e3a", line: "#6e4526" },
      { name: "화이트 타일", price: 200, main: "#e6e0d2", line: "#cfc6b1" },
      { name: "핑크 카펫", price: 200, main: "#dcaeba", line: "#c896a4" },
    ],
    window: [
      { name: "기본(사각)", price: 0, corner: null },
      { name: "아치형", price: 200, corner: "arch" },
      { name: "라운드", price: 200, corner: "round" },
    ],
    light: [
      { name: "기본", price: 0 },
      { name: "골드", price: 200, shade: "#ecd28e" },
      { name: "로즈", price: 200, shade: "#f2c2d4" },
      { name: "미드나잇", price: 200, shade: "#516079" },
    ],
    computer: [
      { name: "에어로 화이트", price: 0, bezel: "#ffffff", bezel2: "#eaf5ff", shade: "#cfe2f2", screen: "bliss" },
      { name: "레트로 베이지", price: 200, bezel: "#dccbaa", bezel2: "#e9dcc0", shade: "#b6a47c", screen: "terminal" },
      { name: "핑크 파스텔", price: 200, bezel: "#ffd0e4", bezel2: "#ffe6f2", shade: "#f0a6ca", screen: "sunset" },
    ],
    aquarium: [
      { name: "실버 글래스", price: 0, frame: "#bfe4f5", cabinet: "#cfe2f2", border: "#e9f7ff" },
      { name: "우드 캐비닛", price: 200, frame: "#a5763e", cabinet: "#7a5228", border: "#c9945a" },
      { name: "로즈 핑크", price: 200, frame: "#f2b4cf", cabinet: "#e08fb4", border: "#ffdcec" },
    ],
    tv: [
      { name: "클래식 블랙", price: 0, bezel: "#2c313a", bezel2: "#1e2126", hi: "#3f4650" },
      { name: "모던 화이트", price: 200, bezel: "#e7ecf1", bezel2: "#c2ccd4", hi: "#ffffff" },
      { name: "우드 프레임", price: 200, bezel: "#8a5f34", bezel2: "#5a3c22", hi: "#a5763e" },
    ],
    bookshelf: [
      { name: "월넛", price: 0, frame: "#8a5e34", outer: "#5a3c22", top: "#a4764c" },
      { name: "화이트", price: 200, frame: "#e8edf2", outer: "#c2ccd4", top: "#ffffff" },
      { name: "민트", price: 200, frame: "#a8d8c8", outer: "#79b6a2", top: "#c8ecdf" },
    ],
    sofa: [
      { name: "오션 블루", price: 0, base: "#6fa8c4", lite: "#8fc4dc", hi: "#a9d6e8", dark: "#5788a0", sh: "#4d7d95" },
      { name: "코랄", price: 200, base: "#e0908f", lite: "#eeb0af", hi: "#f6cbca", dark: "#c07675", sh: "#a56362" },
      { name: "민트", price: 200, base: "#7cc0a8", lite: "#9ad8c2", hi: "#b6e6d6", dark: "#5fa088", sh: "#4f8d76" },
    ],
    radio: [
      { name: "우드", price: 0, body: "#c98a4a", topc: "#e0a860", bot: "#a5702f" },
      { name: "레드 클래식", price: 200, body: "#d05a4a", topc: "#e8806f", bot: "#a5402f" },
      { name: "크림", price: 200, body: "#e8d9b8", topc: "#f4ead0", bot: "#c9b48f" },
    ],
    fridge: [
      { name: "화이트", price: 0, body: "#f5f8fb", edge: "#d0dbe4", hi: "#ffffff" },
      { name: "민트", price: 200, body: "#d3efe4", edge: "#a6d5c4", hi: "#e8f8f1" },
      { name: "레몬", price: 200, body: "#f6efc2", edge: "#ddd086", hi: "#fbf6dc" },
    ],
    microwave: [
      { name: "실버", price: 0, body: "#e7ecf1", hi: "#f6f9fc", edge: "#c9d2da" },
      { name: "블랙", price: 200, body: "#3a3f47", hi: "#4a505a", edge: "#25282e" },
      { name: "민트", price: 200, body: "#cdeee2", hi: "#e4f6ee", edge: "#a6d5c4" },
    ],
    sink: [
      { name: "스테인리스", price: 0, metal: "#c6d0d8", metalHi: "#e4ebf0", faucet: "#cdd8e2" },
      { name: "골드", price: 200, metal: "#d8c088", metalHi: "#f0e0a8", faucet: "#e0c890" },
      { name: "매트 블랙", price: 200, metal: "#5a636e", metalHi: "#7a838e", faucet: "#6a737e" },
    ],
  };

  // 아이템별 스킨 가격 (idx0=기본 무료, 나머지 변형은 아래 가격)
  const SKIN_PRICE = { wallpaper: 50, floor: 60, window: 40, light: 40, computer: 80, aquarium: 80, tv: 80, bookshelf: 70, sofa: 85, radio: 60, fridge: 85, microwave: 60, sink: 50 };
  for (const it in SKIN_PRICE) { if (THEMES[it]) THEMES[it].forEach((v, i) => { if (i > 0) v.price = SKIN_PRICE[it]; }); }

  // ===== 방 전체 테마 프리셋 (벽지·바닥·창문·전등 한 번에) =====
  const ROOM_THEMES = [
    // 프루티거 에어로 8 (밝고 유리 같은 물빛 · 둥근 창)
    { id: "aero1", concept: "aero", name: "아쿠아", wall: { top: "#dff4fb", mid: "#c6ecfa", low: "#aee2f5" }, floor: { main: "#bfe0ee", line: "#a5cfe0" }, window: "round", light: "#cfeaf6" },
    { id: "aero2", concept: "aero", name: "버블", wall: { top: "#eaf6ff", mid: "#d6ecff", low: "#c2e2fb" }, floor: { main: "#cfe2f2", line: "#b6d2e6" }, window: "round", light: "#ffffff" },
    { id: "aero3", concept: "aero", name: "스카이", wall: { top: "#cfeaff", mid: "#a9d6f5", low: "#8fc4ee" }, floor: { main: "#b6d8ee", line: "#9cc2de" }, window: "arch", light: "#dff2fb" },
    { id: "aero4", concept: "aero", name: "민트 프레시", wall: { top: "#e0f5ec", mid: "#cdeee0", low: "#b8e4d2" }, floor: { main: "#c0e6d6", line: "#a6d5c4" }, window: "round", light: "#e8f8f1" },
    { id: "aero5", concept: "aero", name: "선샤인", wall: { top: "#fff6d8", mid: "#ffe9b0", low: "#ffdd8a" }, floor: { main: "#f0dcae", line: "#d8c68e" }, window: "arch", light: "#fff0b0" },
    { id: "aero6", concept: "aero", name: "오션", wall: { top: "#c5e8e3", mid: "#9ed6d0", low: "#7ec6bf" }, floor: { main: "#6fb0a8", line: "#5a9a92" }, window: "round", light: "#cdeee8" },
    { id: "aero7", concept: "aero", name: "글라스", wall: { top: "#eef6fb", mid: "#dfeef7", low: "#cfe4f0" }, floor: { main: "#cdd8e2", line: "#b3c2d0" }, window: "round", light: "#f4f9fc" },
    { id: "aero8", concept: "aero", name: "네이처", wall: { top: "#dbeed6", mid: "#c2e2ba", low: "#a8d69e" }, floor: { main: "#8ac06a", line: "#6faa50" }, window: "arch", light: "#e0f0d8" },
    // 모던 8 (플랫하고 차분한 · 각진 창)
    { id: "mod1", concept: "modern", name: "미니멀 화이트", wall: { top: "#f4f5f7", mid: "#e8eaed", low: "#dcdfe3" }, floor: { main: "#e0ddd6", line: "#cac6bd" }, window: null, light: "#f0f2f4" },
    { id: "mod2", concept: "modern", name: "웜 뉴트럴", wall: { top: "#efe7da", mid: "#e2d7c4", low: "#d3c5ac" }, floor: { main: "#c8b394", line: "#ac9670" }, window: null, light: "#efe6d0" },
    { id: "mod3", concept: "modern", name: "세이지", wall: { top: "#dfe6dc", mid: "#cdd6c6", low: "#b8c4ae" }, floor: { main: "#a8b096", line: "#8f987c" }, window: null, light: "#d8e0d2" },
    { id: "mod4", concept: "modern", name: "다크 모드", wall: { top: "#3a4048", mid: "#2f343b", low: "#262a30" }, floor: { main: "#33373d", line: "#25282e" }, window: null, light: "#4a515a" },
    { id: "mod5", concept: "modern", name: "테라코타", wall: { top: "#f0ded2", mid: "#e2c4b0", low: "#d0a88e" }, floor: { main: "#b57a5a", line: "#9a6244" }, window: null, light: "#e8c8b4" },
    { id: "mod6", concept: "modern", name: "콘크리트", wall: { top: "#e2e4e6", mid: "#d0d3d6", low: "#bcc0c4" }, floor: { main: "#b0b4b8", line: "#96999d" }, window: null, light: "#dfe2e4" },
    { id: "mod7", concept: "modern", name: "블러시", wall: { top: "#f4e6e6", mid: "#ecd2d2", low: "#e0bcbc" }, floor: { main: "#cf9ca6", line: "#b6828c" }, window: null, light: "#f2dede" },
    { id: "mod8", concept: "modern", name: "네이비", wall: { top: "#cdd6e2", mid: "#aebccf", low: "#8fa2bc" }, floor: { main: "#5f6f8a", line: "#4a5870" }, window: null, light: "#d0dae6" },
  ];
  function activeTheme() { const id = window.App.state.roomTheme; if (!id) return null; return ROOM_THEMES.find((t) => t.id === id) || null; }
  function setTheme(id) { window.App.state.roomTheme = id || null; window.App.save(); }
  function drawThemeIcon(th, g) {
    g.clearRect(0, 0, 40, 40);
    P(g, 0, 0, 40, 9, th.wall.top); P(g, 0, 9, 40, 9, th.wall.mid); P(g, 0, 18, 40, 9, th.wall.low);
    P(g, 0, 27, 40, 13, th.floor.main); for (let x = 0; x < 40; x += 8) P(g, x, 27, 1, 13, th.floor.line);
    P(g, 23, 5, 13, 12, "#8fd0f5"); P(g, 23, 11, 13, 6, "#6fbf4a");                          // 창문
    if (th.window) { P(g, 23, 5, 2, 2, th.wall.top); P(g, 34, 5, 2, 2, th.wall.top); if (th.window === "round") { P(g, 23, 15, 2, 2, th.wall.low); P(g, 34, 15, 2, 2, th.wall.low); } }
    P(g, 10, 0, 2, 4, "#8a8f97"); P(g, 7, 4, 8, 3, th.light);                                  // 전등
  }

  function cur(item) { const s = window.App.state.skins || {}; return s[item] || 0; }
  function theme(item) { const a = THEMES[item]; return a[Math.min(cur(item), a.length - 1)]; }
  function isOwned(item, idx) { if (idx === 0) return true; const o = window.App.state.skinsOwned || {}; return !!o[item + ":" + idx]; }
  function equip(item, idx) { const s = window.App.state.skins || (window.App.state.skins = {}); s[item] = idx; window.App.save(); }
  function buy(item, idx) {
    const th = THEMES[item][idx];
    if ((window.App.state.coins || 0) < th.price) return false;
    window.App.state.coins -= th.price;
    const o = window.App.state.skinsOwned || (window.App.state.skinsOwned = {});
    o[item + ":" + idx] = true; window.App.save(); return true;
  }
  function labelOf(item) { const it = ITEMS.find((i) => i.item === item); return it ? it.label : item; }
  function roomOf(item) { const it = ITEMS.find((i) => i.item === item); return it ? it.room : ""; }

  // ---- 전역 스킨 헬퍼 (벽/바닥/창문) : idx0 이면 각 방 기본값 그대로 ----
  function wall(defTop, defMid, defLow) { const rt = activeTheme(); if (rt) return [rt.wall.top, rt.wall.mid, rt.wall.low]; const i = cur("wallpaper"); if (!i) return [defTop, defMid, defLow]; const th = THEMES.wallpaper[i]; return [th.top, th.mid, th.low]; }
  function floor(defMain, defLine) { const rt = activeTheme(); if (rt) return [rt.floor.main, rt.floor.line]; const i = cur("floor"); if (!i) return [defMain, defLine]; const th = THEMES.floor[i]; return [th.main, th.line]; }
  function winShape() { const rt = activeTheme(); if (rt) return rt.window; const i = cur("window"); return i ? THEMES.window[i].corner : null; }
  function lamp(defShade) { const rt = activeTheme(); if (rt) return rt.light; const i = cur("light"); return i ? THEMES.light[i].shade : defShade; }   // 전등 갓 색
  // 창문 모서리 깎기 (벽색으로 덮어 아치/라운드 모양 연출)
  function winCorners(ctx, r, wallCol) {
    const c = winShape(); if (!c) return;
    const R = Math.min(r.w, r.h) * 0.30;
    ctx.fillStyle = wallCol;
    const notch = (cx, cy, sx, sy) => {   // (cx,cy)=코너, sx/sy = 안쪽 방향(+1/-1)
      const ccx = cx + sx * R, ccy = cy + sy * R;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + sx * R, cy);
      ctx.arc(ccx, ccy, R, sy > 0 ? -Math.PI / 2 : Math.PI / 2, sx > 0 ? Math.PI : 0, sx * sy > 0);
      ctx.closePath(); ctx.fill();
    };
    notch(r.x, r.y, 1, 1); notch(r.x + r.w, r.y, -1, 1);          // 위 좌/우 (아치·라운드 공통)
    if (c === "round") { notch(r.x, r.y + r.h, 1, -1); notch(r.x + r.w, r.y + r.h, -1, -1); }  // 아래 좌/우
  }
  // 유리 영역을 스킨 모양(아치=위만 둥글게 / 라운드=네 모서리)대로 클립 (호출부에서 save/restore)
  function clipWindow(ctx, r) {
    const c = winShape(); if (!c) return;                        // 기본(사각)이면 클립 안 함
    const R = Math.min(r.w, r.h) * 0.22, bR = c === "round" ? R : 0;
    const x = r.x, y = r.y, w = r.w, h = r.h;
    ctx.beginPath();
    ctx.moveTo(x + R, y); ctx.lineTo(x + w - R, y); ctx.arcTo(x + w, y, x + w, y + R, R);       // 위
    ctx.lineTo(x + w, y + h - bR); if (bR) ctx.arcTo(x + w, y + h, x + w - bR, y + h, bR); else ctx.lineTo(x + w, y + h); // 우
    ctx.lineTo(x + bR, y + h); if (bR) ctx.arcTo(x, y + h, x, y + h - bR, bR); else ctx.lineTo(x, y + h);                 // 아래
    ctx.lineTo(x, y + R); ctx.arcTo(x, y, x + R, y, R); ctx.closePath();                        // 좌
    ctx.clip();
  }

  // ---- 상점 미리보기 아이콘 (40×40 캔버스, 절대 좌표) ----
  function drawIcon(item, idx, g) {
    g.clearRect(0, 0, 40, 40);
    const th = THEMES[item][idx];
    if (item === "wallpaper") {
      const top = th.top || "#dff4fb", mid = th.mid || "#cfeaf6", low = th.low || "#bfe0f0";
      P(g, 8, 8, 24, 8, top); P(g, 8, 16, 24, 8, mid); P(g, 8, 24, 24, 8, low);
      if (idx === 0) { g.fillStyle = "#7aa8c0"; g.font = "9px sans-serif"; g.textAlign = "center"; g.fillText("기본", 20, 23); g.textAlign = "left"; }
    } else if (item === "floor") {
      const main = th.main || "#caa878", line = th.line || "#a98a5a";
      P(g, 7, 12, 26, 18, main);
      for (let x = 7; x < 33; x += 6) P(g, x, 12, 1, 18, line);
      P(g, 7, 12, 26, 1, "rgba(255,255,255,0.4)");
      if (idx === 0) { g.fillStyle = "#8a6a4a"; g.font = "9px sans-serif"; g.textAlign = "center"; g.fillText("기본", 20, 24); g.textAlign = "left"; }
    } else if (item === "window") {
      P(g, 8, 8, 24, 24, "#efe6d0");
      const inx = 11, iny = 11, inw = 18, inh = 18;
      P(g, inx, iny, inw, inh, "#8fd0f5"); P(g, inx, iny + inh / 2, inw, inh / 2, "#6fbf4a");
      if (th.corner === "arch") { g.fillStyle = "#efe6d0"; g.beginPath(); g.moveTo(inx, iny); g.lineTo(inx + 7, iny); g.arc(inx + 7, iny + 7, 7, -Math.PI / 2, Math.PI, true); g.closePath(); g.fill(); g.beginPath(); g.moveTo(inx + inw, iny); g.lineTo(inx + inw - 7, iny); g.arc(inx + inw - 7, iny + 7, 7, -Math.PI / 2, 0, false); g.closePath(); g.fill(); }
      else if (th.corner === "round") { g.fillStyle = "#efe6d0"; g.globalAlpha = 1; [[inx, iny, 1, 1], [inx + inw, iny, -1, 1], [inx, iny + inh, 1, -1], [inx + inw, iny + inh, -1, -1]].forEach(([cx, cy, sx, sy]) => { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * 6, cy); g.arc(cx + sx * 6, cy + sy * 6, 6, sy > 0 ? -Math.PI / 2 : Math.PI / 2, sx > 0 ? Math.PI : 0, sx * sy > 0); g.closePath(); g.fill(); }); }
      P(g, inx + inw / 2 - 1, iny, 2, inh, "#efe6d0"); P(g, inx, iny + inh / 2 - 1, inw, 2, "#efe6d0");
    } else if (item === "light") {
      const shade = th.shade || "#dfe6ec";
      P(g, 19, 6, 2, 8, "#8a8f97");                                           // 전선
      g.fillStyle = shade; g.beginPath(); g.moveTo(9, 22); g.lineTo(15, 13); g.lineTo(25, 13); g.lineTo(31, 22); g.closePath(); g.fill(); // 갓
      P(g, 9, 21, 22, 1, "rgba(0,0,0,0.15)"); P(g, 15, 13, 10, 1, "rgba(255,255,255,0.5)");
      P(g, 17, 22, 6, 4, "#fff3b0");                                          // 전구
      const gr = g.createRadialGradient(20, 26, 1, 20, 26, 12); gr.addColorStop(0, "rgba(255,240,180,0.6)"); gr.addColorStop(1, "rgba(255,240,180,0)");
      g.fillStyle = gr; g.fillRect(6, 20, 28, 16);
    } else if (item === "computer") {
      P(g, 7, 9, 26, 19, th.bezel2); P(g, 9, 11, 22, 15, th.bezel);
      const sx = 12, sy = 13, sw = 16, sh = 11;
      if (th.screen === "bliss") { P(g, sx, sy, sw, sh, "#7ec8f0"); g.fillStyle = "#6fbf4a"; g.beginPath(); g.moveTo(sx, sy + sh); g.quadraticCurveTo(sx + sw / 2, sy + sh * 0.4, sx + sw, sy + sh); g.closePath(); g.fill(); P(g, sx + 2, sy + 2, 3, 3, "#fff6c8"); }
      else if (th.screen === "terminal") { P(g, sx, sy, sw, sh, "#08240f"); for (let i = 0; i < 3; i++) P(g, sx + 2, sy + 2 + i * 3, 6 + i * 3, 1, "#37d16a"); P(g, sx + 2, sy + 2 + 9, 3, 1, "#8ff0a8"); }
      else { for (let i = 0; i < sh; i++) { g.fillStyle = mix("#ffcf8a", "#ff8fb4", i / sh); g.fillRect(sx, sy + i, sw, 1); } g.fillStyle = "#fff0b0"; g.beginPath(); g.arc(sx + sw - 5, sy + 4, 3, 0, 7); g.fill(); }
      P(g, 18, 28, 4, 3, th.shade); P(g, 14, 31, 12, 2, th.bezel);
    } else if (item === "aquarium") {
      P(g, 7, 11, 26, 19, th.frame); P(g, 9, 13, 22, 15, "rgba(120,205,240,0.9)");
      P(g, 9, 24, 22, 4, "#e6d9b8"); P(g, 13, 20, 2, 6, "#3ba55a"); P(g, 27, 19, 2, 7, "#3ba55a");
      g.fillStyle = "#ff8a3d"; g.beginPath(); g.ellipse(20, 19, 3.4, 2.2, 0, 0, 7); g.fill(); P(g, 22, 18, 1, 1, "#fff");
      P(g, 9, 30, 22, 3, th.cabinet); g.strokeStyle = th.border; g.lineWidth = 1; g.strokeRect(9.5, 13.5, 21, 14);
    } else if (item === "tv") {
      P(g, 7, 11, 26, 17, th.bezel2); P(g, 9, 13, 22, 13, th.bezel); P(g, 9, 13, 22, 2, th.hi);
      P(g, 12, 15, 16, 9, "#7ec8f0"); g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.moveTo(12, 15); g.lineTo(17, 15); g.lineTo(12, 20); g.closePath(); g.fill();
      P(g, 18, 28, 4, 3, th.bezel2); P(g, 14, 31, 12, 2, th.hi);
    } else if (item === "bookshelf") {
      P(g, 10, 7, 20, 27, th.outer); P(g, 12, 9, 16, 23, th.frame); P(g, 12, 9, 16, 2, th.top);
      const cols = ["#e0492c", "#4a86c9", "#4bb15f", "#e8b04a", "#c98ae0", "#ff9ab0"];
      for (let s = 0; s < 3; s++) { const sy = 11 + s * 7; for (let b = 0; b < 4; b++) { const bh = 4 + ((b + s) % 2); P(g, 13 + b * 4, sy + 6 - bh, 3, bh, cols[(b + s * 2) % cols.length]); } P(g, 12, sy + 6, 16, 1, th.outer); }
    } else if (item === "sofa") {
      P(g, 8, 14, 24, 10, th.base); P(g, 8, 14, 24, 2, th.hi); P(g, 6, 16, 4, 12, th.base); P(g, 30, 16, 4, 12, th.dark);
      P(g, 10, 22, 20, 8, th.lite); P(g, 10, 22, 20, 2, th.hi); P(g, 20, 23, 1, 6, th.sh);
      P(g, 9, 30, 3, 3, "#4a3626"); P(g, 28, 30, 3, 3, "#4a3626");
    } else if (item === "radio") {
      P(g, 8, 14, 24, 16, th.body); P(g, 8, 14, 24, 2, th.topc); P(g, 8, 28, 24, 2, th.bot);
      P(g, 11, 17, 9, 10, "#3a2e28"); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P(g, 12 + j * 3, 18 + i * 3, 1, 1, "#5a4a3a");
      P(g, 22, 17, 7, 4, "#e8d9b8"); P(g, 23, 18, 2, 2, "#c94f2a"); P(g, 24, 23, 4, 2, "#7a5a3a"); P(g, 30, 9, 1, 6, "#8a97a3");
    } else if (item === "fridge") {
      P(g, 13, 6, 14, 28, th.edge); P(g, 14, 7, 12, 26, th.body); P(g, 14, 7, 12, 1, th.hi);
      P(g, 14, 17, 12, 1, th.edge); P(g, 24, 10, 1, 5, "#aab8c4"); P(g, 24, 20, 1, 8, "#aab8c4");
    } else if (item === "microwave") {
      P(g, 7, 12, 26, 16, th.edge); P(g, 8, 13, 24, 14, th.body); P(g, 8, 13, 24, 2, th.hi);
      P(g, 11, 16, 13, 9, "#23272d"); P(g, 26, 16, 4, 9, th.edge); for (let i = 0; i < 3; i++) P(g, 27, 17 + i * 3, 2, 2, "#8894a0");
    } else if (item === "sink") {
      P(g, 8, 20, 24, 8, th.metal); P(g, 8, 20, 24, 2, th.metalHi); P(g, 10, 23, 20, 3, "#8f9aa4");
      P(g, 19, 8, 3, 13, th.faucet); P(g, 12, 8, 10, 3, th.faucet); P(g, 12, 8, 3, 8, th.faucet); P(g, 19, 8, 1, 13, th.metalHi);
    }
  }

  window.Skins = { ITEMS, THEMES, cur, theme, isOwned, equip, buy, drawIcon, labelOf, roomOf, wall, floor, winShape, winCorners, clipWindow, lamp,
    ROOM_THEMES, activeTheme, setTheme, drawThemeIcon };
})();
