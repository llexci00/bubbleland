/* ============================================================
   마을 상점 — window.Shop
   북극곰 점원(애니메이션) · 곰 클릭 → 구매창 · 커서 올리면 가격 안내
   카테고리 탭 · 선명한 말풍선(DOM)
   ============================================================ */
(function () {
  "use strict";
  const W = 320, H = 180;
  let canvas, ctx, running = false, t = 0, last = 0, grid, panel, bubble;
  let curCat = "all";
  const KEEPER = { x: 40, y: 88, w: 30, h: 44 };
  const SEQ = [["idle", 190], ["scratch", 70], ["idle", 150], ["clean", 150], ["idle", 170], ["wave", 60]];
  let bseq = 0, bstate = "idle", btimer = 190;
  const RADIO = { x: 66, y: 114, w: 20, h: 14 };
  const SHOP_TRACK = "music/shop_bear.m4a";
  let notes = [];

  function P(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function isClosed() { const h = new Date().getHours(); return h >= 22 || h < 8; }   // 밤 10시~아침 8시 마감

  // 셔터 내려간 '영업 종료' 모습
  function drawClosed() {
    const top = 34, bot = 150;
    P(0, top, W, bot - top, "rgba(25,30,40,0.42)");                 // 셔터 뒤 어둠
    P(18, top, W - 36, bot - top, "#8f99a3");                       // 롤업 셔터
    for (let y = top; y < bot; y += 5) { P(18, y, W - 36, 1, "#c2ccd4"); P(18, y + 3, W - 36, 1, "#6f7883"); }
    P(16, top, 3, bot - top, "#5a626b"); P(W - 19, top, 3, bot - top, "#5a626b"); // 레일
    P(W / 2 - 14, bot - 12, 28, 4, "#4a515a"); P(W / 2 - 14, bot - 12, 28, 1, "#7f8892"); // 손잡이
    // 매달린 CLOSED 팻말
    const cx = W / 2, sy = 50;
    ctx.strokeStyle = "#3a2e28"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 18, sy - 2); ctx.lineTo(cx - 2, sy + 10); ctx.moveTo(cx + 18, sy - 2); ctx.lineTo(cx + 2, sy + 10); ctx.stroke();
    P(cx - 25, sy + 10, 50, 24, "#8a3a2e"); P(cx - 25, sy + 10, 50, 2, "#a94a3a"); P(cx - 25, sy + 32, 50, 2, "#6a2a20"); P(cx - 25, sy + 10, 2, 24, "#a94a3a");
    ctx.fillStyle = "#fff4d8"; ctx.textAlign = "center";
    ctx.font = "bold 11px sans-serif"; ctx.fillText("CLOSED", cx, sy + 23);
    ctx.font = "7px sans-serif"; ctx.fillText("밤 10시 마감 · 아침 8시 오픈", cx, sy + 31);
    // Zzz (문 위 곰이 자는 느낌)
    ctx.fillStyle = "#e8eef4"; ctx.font = "italic 10px sans-serif"; ctx.fillText("z", cx + 34, sy + 4);
    ctx.font = "italic 8px sans-serif"; ctx.fillText("z", cx + 40, sy - 2); ctx.textAlign = "left";
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    P(0, 0, W, 120, "#f2e3c6"); P(0, 40, W, 2, "#e6d3ae");
    P(0, 120, W, H - 120, "#c49a63");
    for (let x = 0; x < W; x += 24) P(x, 120, 1, H - 120, "#a9814f");
    for (let x = 0; x < W; x += 24) P(x + 2, 128, 12, 1, "#d3b184");
    P(0, 118, W, 3, "#b98f58");
    for (let i = 0; i < W; i += 16) { P(i, 0, 8, 14, "#e0492c"); P(i + 8, 0, 8, 14, "#f6ecd8"); }
    P(0, 14, W, 3, "#b03a22"); P(0, 13, W, 1, "#ffffff");
    // 선반 상품
    const kinds = ["teddy", "vase", "lamp", "books", "plant", "clock", "cup"];
    for (let s = 0; s < 2; s++) {
      const surf = 46 + s * 34 + 16;
      P(24, surf, W - 48, 3, "#a2743e"); P(24, surf, W - 48, 1, "#c8985e"); P(24, surf + 3, W - 48, 1, "#7a5228");
      for (let i = 0; i < 7; i++) shelfItem(40 + i * 38, surf, kinds[(i + s * 3) % kinds.length]);
    }
    // 간판
    P(W / 2 - 34, 18, 68, 16, "#8a5a30"); P(W / 2 - 34, 18, 68, 2, "#a4764c");
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("SHOP", W / 2, 30); ctx.textAlign = "left";
    drawKeeper();
    // 카운터
    P(20, 128, 70, 26, "#a2743e"); P(20, 128, 70, 3, "#c8985e"); P(20, 150, 70, 4, "#7a5228");
    if (isClosed()) { drawClosed(); return; }
    drawShopRadio();
    drawRosemary(W - 44, 104);
    for (const n of notes) { ctx.globalAlpha = Math.max(0, n.life); drawNote(n.x, n.y, n.c); } ctx.globalAlpha = 1;
  }
  // 카운터 라디오 (거실처럼 음표가 떠오름)
  function drawShopRadio() {
    const r = RADIO;
    P(r.x + 1, r.y + 1, r.w, r.h, "rgba(60,40,20,0.25)");
    P(r.x, r.y, r.w, r.h, "#c98a4a"); P(r.x, r.y, r.w, 2, "#e0a860"); P(r.x, r.y + r.h - 2, r.w, 2, "#a5702f");
    P(r.x + 3, r.y + 3, 8, r.h - 6, "#3a2e28");                                  // 스피커 그릴
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P(r.x + 4 + j * 3, r.y + 4 + i * 3, 1, 1, "#5a4a3a");
    P(r.x + 13, r.y + 4, 5, 4, "#e8d9b8"); P(r.x + 14, r.y + 5, 2, 2, "#c94f2a");  // 주파수창
    P(r.x + 14, r.y + 10, 3, 2, "#7a5a3a");                                       // 다이얼
    P(r.x + r.w - 3, r.y - 5, 1, 6, "#8a97a3");                                   // 안테나
    if (window.Audio2.isLocPlaying()) P(r.x + 3, r.y + 3, 8, 1, "#7CFC98");       // 재생 표시
  }
  function drawNote(x, y, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y + 3, 1.6, 0, 7); ctx.fill(); ctx.fillRect(x + 1, y - 3, 1, 6); ctx.fillRect(x + 1, y - 3, 3, 1); }
  function stepNotes() {
    if (window.Audio2.isLocPlaying() && t % 8 === 0) notes.push({ x: RADIO.x + 5 + Math.random() * 10, y: RADIO.y - 2, vx: (Math.random() - 0.5) * 0.4, life: 1, c: ["#4a86c9", "#e0658a", "#4bb15f", "#e8a63a"][(Math.random() * 4) | 0] });
    for (const n of notes) { n.y -= 0.7; n.x += n.vx; n.life -= 0.014; }
    notes = notes.filter((n) => n.life > 0);
  }
  function inRadio(x, y) { return x >= RADIO.x && x <= RADIO.x + RADIO.w && y >= RADIO.y - 6 && y <= RADIO.y + RADIO.h; }
  function shortMsg(price) { const need = price - (window.App.state.coins || 0); return need < 50 ? "조금 부족하네요 😅" : "많이 부족해요 😢"; }   // 50코인 미만이면 조금
  // 로즈마리 화분 (줄기가 화분 흙에 붙어 위로 자람)
  function drawRosemary(px, py) {
    const pw = 14, cx = px + pw / 2, base = py + 2;
    P(px + 1, py + 1, pw - 2, 3, "#6b4a2a");                                   // 흙
    P(px, py + 2, pw, 14, "#c97a4a"); P(px, py + 2, pw, 2, "#e2a06a"); P(px, py + 14, pw, 2, "#a5602f"); P(px + 1, py + 4, 2, 9, "rgba(255,255,255,0.28)"); // 화분
    for (let s = 0; s < 3; s++) {
      const sx = cx - 4 + s * 4, top = base - (16 - Math.abs(s - 1) * 4);      // 가운데 줄기가 가장 큼
      ctx.strokeStyle = "#3f8a35"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx + 0.5, base); ctx.lineTo(sx + 0.5, top); ctx.stroke();
      for (let y = base - 2; y > top + 1; y -= 2) { P(sx - 2, y, 2, 1, "#5aa848"); P(sx + 1, y - 1, 2, 1, "#5aa848"); } // 바늘잎
      P(sx - 1, top - 1, 2, 2, "#7cc85a");                                     // 새순
    }
  }

  // ---- 북극곰 점원 (애니메이션) ----
  const CW = "#f6f2e8", CS = "#e2dccd", BL = "#3f7fc9", BLD = "#2f6fb0", CAP = "#3a72c0", CAPH = "#5a96d9";
  function bearHead(kx, hy, blink, tilt) {
    ctx.save(); ctx.translate(kx, hy); ctx.rotate(tilt || 0);
    ctx.fillStyle = CW; ctx.beginPath(); ctx.ellipse(0, 0, 9, 8, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-8, -4, 3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(8, -4, 3, 0, 7); ctx.fill();  // 귀
    ctx.fillStyle = CS; ctx.beginPath(); ctx.arc(-8, -3, 1.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(8, -3, 1.4, 0, 7); ctx.fill();
    ctx.fillStyle = "#fffdf6"; ctx.beginPath(); ctx.ellipse(0, 4, 5, 3.5, 0, 0, 7); ctx.fill();               // 주둥이
    P(-1, 1, 3, 2, "#3a2b22");                                                                                  // 코
    ctx.strokeStyle = "#3a2b22"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0.5, 3); ctx.lineTo(-1.5, 5); ctx.moveTo(0.5, 3); ctx.lineTo(2.5, 5); ctx.stroke();
    if (blink) { P(-5, -3, 3, 1, "#2b2b2b"); P(2, -3, 3, 1, "#2b2b2b"); }
    else { P(-5, -3, 3, 3, "#2b2b2b"); P(2, -3, 3, 3, "#2b2b2b"); P(-5, -3, 1, 1, "#fff"); P(2, -3, 1, 1, "#fff"); }
    P(-7, 2, 2, 1, "#ffc0d0"); P(6, 2, 2, 1, "#ffc0d0");
    // 파란 모자
    P(-10, -7, 20, 2, BLD); ctx.fillStyle = CAP; ctx.beginPath(); ctx.arc(0, -7, 8, Math.PI, 0); ctx.fill();
    P(-3, -12, 5, 2, CAPH); ctx.fillStyle = "#dfe9f5"; ctx.beginPath(); ctx.arc(0, -15, 1.6, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawKeeper() {
    const kx = 55, cty = 128, blink = (t % 160 < 6);
    if (bstate === "clean") {   // 뒤돌아 선반 청소
      ctx.fillStyle = CW; ctx.beginPath(); ctx.ellipse(kx, cty - 8, 11, 10, 0, 0, 7); ctx.fill();
      P(kx - 9, cty - 9, 18, 9, BL); P(kx - 9, cty - 9, 18, 2, CAPH);                 // 멜빵바지 뒤
      ctx.strokeStyle = BLD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(kx - 6, cty - 17); ctx.lineTo(kx + 4, cty - 9); ctx.moveTo(kx + 6, cty - 17); ctx.lineTo(kx - 4, cty - 9); ctx.stroke(); // X끈
      ctx.fillStyle = CW; ctx.beginPath(); ctx.ellipse(kx, cty - 23, 9, 8, 0, 0, 7); ctx.fill();  // 뒤통수
      ctx.beginPath(); ctx.arc(kx - 8, cty - 27, 3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(kx + 8, cty - 27, 3, 0, 7); ctx.fill();
      P(kx - 10, cty - 30, 20, 2, BLD); ctx.fillStyle = CAP; ctx.beginPath(); ctx.arc(kx, cty - 30, 8, Math.PI, 0); ctx.fill(); P(kx - 2, cty - 32, 4, 2, BLD); // 모자 뒤
      // 걸레질 팔 (위아래 왕복)
      const wy = Math.sin(t * 0.4) * 4;
      P(kx + 9, cty - 18 + wy, 6, 5, CW); P(kx + 14, cty - 20 + wy, 5, 4, "#ffe27a"); // 팔+걸레
      return;
    }
    // 앞모습
    ctx.fillStyle = CW; ctx.beginPath(); ctx.ellipse(kx, cty - 8, 11, 10, 0, 0, 7); ctx.fill();
    P(kx - 9, cty - 9, 18, 9, BL); P(kx - 9, cty - 9, 18, 2, CAPH);
    P(kx - 6, cty - 17, 3, 9, BL); P(kx + 3, cty - 17, 3, 9, BL);
    P(kx - 5, cty - 13, 2, 2, "#ffd23f"); P(kx + 3, cty - 13, 2, 2, "#ffd23f");
    // 팔: 왼팔은 카운터, 오른팔은 상태별
    P(kx - 13, cty - 9, 5, 6, CW); P(kx - 13, cty - 4, 5, 3, CS);
    if (bstate === "scratch") { const sy = Math.sin(t * 0.5) * 1.5; P(kx + 7, cty - 30 + sy, 5, 6, CW); }        // 머리 긁기
    else if (bstate === "wave") { const wy = Math.sin(t * 0.5) * 3; P(kx + 9, cty - 26 - Math.abs(wy), 5, 6, CW); } // 손 흔들기
    else { P(kx + 8, cty - 9, 5, 6, CW); P(kx + 8, cty - 4, 5, 3, CS); }
    bearHead(kx, cty - 23, blink, 0);   // 고개 회전 X (픽셀 깨짐 방지)
  }

  function shelfItem(x, by, kind) {
    if (kind === "teddy") { P(x - 4, by - 8, 8, 8, "#b07a4a"); P(x - 3, by - 6, 6, 5, "#c99a6a"); P(x - 4, by - 14, 8, 7, "#b07a4a"); P(x - 5, by - 15, 3, 3, "#b07a4a"); P(x + 2, by - 15, 3, 3, "#b07a4a"); P(x - 3, by - 12, 1, 1, "#222"); P(x + 2, by - 12, 1, 1, "#222"); P(x - 1, by - 10, 2, 1, "#222"); }
    else if (kind === "vase") { P(x - 3, by - 8, 6, 8, "#6fb0d0"); P(x - 3, by - 8, 2, 8, "#8fd0ee"); P(x - 1, by - 14, 2, 6, "#4a9e4a"); P(x - 3, by - 15, 2, 2, "#ff7aa0"); P(x + 1, by - 15, 2, 2, "#ffd23f"); P(x, by - 17, 2, 2, "#ff9ab8"); }
    else if (kind === "lamp") { P(x - 1, by - 8, 2, 8, "#b8925a"); P(x - 4, by - 2, 8, 2, "#8a6a3a"); P(x - 4, by - 13, 8, 6, "#ffd98a"); P(x - 4, by - 13, 8, 2, "#ffe9b8"); }
    else if (kind === "books") { P(x - 5, by - 4, 10, 4, "#e0492c"); P(x - 4, by - 8, 9, 4, "#4a86c9"); P(x - 3, by - 12, 8, 4, "#4bb15f"); P(x - 5, by - 4, 10, 1, "rgba(255,255,255,0.3)"); }
    else if (kind === "plant") { P(x - 3, by - 6, 6, 6, "#e88f5a"); P(x - 3, by - 6, 6, 2, "#f2a875"); for (let i = 0; i < 4; i++) { const a = -1.1 + i * 0.7; P(x + Math.sin(a) * 4, by - 8 - Math.abs(Math.cos(a)) * 7, 2, 8, "#4bb15f"); } }
    else if (kind === "clock") { ctx.fillStyle = "#f4ecd8"; ctx.beginPath(); ctx.arc(x, by - 7, 6, 0, 7); ctx.fill(); ctx.strokeStyle = "#8a6a3a"; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = "#333"; ctx.beginPath(); ctx.moveTo(x, by - 7); ctx.lineTo(x, by - 11); ctx.moveTo(x, by - 7); ctx.lineTo(x + 3, by - 7); ctx.stroke(); P(x - 1, by - 1, 2, 1, "#8a6a3a"); }
    else if (kind === "cup") { P(x - 3, by - 6, 7, 6, "#ff9ab0"); P(x - 3, by - 6, 7, 2, "#ffc2d0"); P(x + 4, by - 5, 2, 3, "#ff9ab0"); }
  }

  function loop(ts) {
    if (!running) return;
    if (ts - last > 55) { last = ts; t++; if (--btimer <= 0) { bseq = (bseq + 1) % SEQ.length; bstate = SEQ[bseq][0]; btimer = SEQ[bseq][1]; } stepNotes(); draw(); }
    requestAnimationFrame(loop);
  }

  function positionBubble() {
    if (!canvas || !bubble || bubble.classList.contains("hidden")) return;
    const r = canvas.getBoundingClientRect();
    const bx = r.left + (55 / W) * r.width;         // 곰 머리 x
    const by = r.top + (88 / H) * r.height;         // 곰 머리(모자) 위 y
    bubble.style.left = Math.round(bx - 24) + "px";
    bubble.style.top = Math.round(by - bubble.offsetHeight - 8) + "px";
  }
  function keeperSay(text) { bubble.textContent = text; bubble.classList.remove("hidden"); positionBubble(); }

  function buildShop() {
    if (curCat === "theme") return buildThemes();
    if (curCat === "skin") return buildSkins();
    grid.innerHTML = "";
    const coins = window.App.state.coins;
    for (const it of window.Decor.ITEMS) {
      if (curCat !== "all" && it.cat !== curCat) continue;
      const owned = !!(window.App.state.decor[it.id] && window.App.state.decor[it.id].owned);
      const cell = document.createElement("div"); cell.className = "shop-cell";
      const cv = document.createElement("canvas"); cv.width = 40; cv.height = 40; cv.className = "shop-ico";
      const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; g.translate(20, 32); it.draw(g, 0, 0); cell.appendChild(cv);
      const nm = document.createElement("div"); nm.className = "shop-name"; nm.textContent = it.name; cell.appendChild(nm);
      const btn = document.createElement("button"); btn.className = "shop-buy";
      if (owned) { btn.textContent = "보유중 ✓"; btn.classList.add("owned"); btn.disabled = true; }
      else if (coins >= it.price) { btn.textContent = "구매하기"; btn.addEventListener("click", () => buy(it)); }
      else { btn.textContent = "코인 부족"; btn.classList.add("poor"); btn.disabled = true; }
      cell.appendChild(btn);
      // 커서 올리면 곰이 가격 안내
      cell.addEventListener("mouseenter", () => { keeperSay(owned ? `${it.name}은/는 이미 있어요! 🐻` : (coins >= it.price ? `${it.name}은/는 🪙${it.price}코인이에요!` : `${it.name}은/는 🪙${it.price}코인… ${shortMsg(it.price)}`)); });
      grid.appendChild(cell);
    }
  }
  // ---- 스킨(기능 아이템 외형) ----
  function buildSkins() {
    grid.innerHTML = "";
    const coins = window.App.state.coins;
    for (const meta of window.Skins.ITEMS) {
      const arr = window.Skins.THEMES[meta.item];
      for (let idx = 0; idx < arr.length; idx++) {
        const th = arr[idx];
        const owned = window.Skins.isOwned(meta.item, idx);
        const equipped = window.Skins.cur(meta.item) === idx;
        const cell = document.createElement("div"); cell.className = "shop-cell";
        const cv = document.createElement("canvas"); cv.width = 40; cv.height = 40; cv.className = "shop-ico";
        const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; window.Skins.drawIcon(meta.item, idx, g); cell.appendChild(cv);
        const nm = document.createElement("div"); nm.className = "shop-name"; nm.textContent = meta.label + " · " + th.name; cell.appendChild(nm);
        const btn = document.createElement("button"); btn.className = "shop-buy";
        if (equipped) { btn.textContent = "적용중 ✓"; btn.classList.add("owned"); btn.disabled = true; }
        else if (owned) { btn.textContent = "적용하기"; btn.addEventListener("click", () => { window.Skins.equip(meta.item, idx); window.Audio2.click(); keeperSay(`${meta.label} 스킨을 바꿨어요! (${meta.room}에서 확인!) 🐻`); buildSkins(); }); }
        else if (coins >= th.price) { btn.textContent = "구매하기"; btn.addEventListener("click", () => buySkin(meta, idx)); }
        else { btn.textContent = "코인 부족"; btn.classList.add("poor"); btn.disabled = true; }
        cell.appendChild(btn);
        cell.addEventListener("mouseenter", () => {
          keeperSay(equipped ? `${meta.label}에 지금 쓰는 스킨이에요 🐻`
            : owned ? `${meta.label} · ${th.name}, 적용할 수 있어요!`
            : (coins >= th.price ? `${meta.label} · ${th.name} 🪙${th.price}코인이에요!` : `${th.name}… 🪙${th.price}코인, ${shortMsg(th.price)}`));
        });
        grid.appendChild(cell);
      }
    }
  }
  function buySkin(meta, idx) {
    if (!window.Skins.buy(meta.item, idx)) return;
    window.Skins.equip(meta.item, idx);           // 사면 바로 적용
    window.Main.updateCoins(); window.Audio2.blip(760);
    keeperSay(`구매 완료! ${meta.room}에 바로 적용했어요 🎁`);
    setTimeout(() => { if (running) keeperSay("무엇을 찾으세요?"); }, 1900);
    buildSkins();
  }

  // ---- 방 전체 테마 (벽지·바닥·창문·전등 프리셋) ----
  const THEME_PRICE = 100;
  function buildThemes() {
    grid.innerHTML = "";
    const cur = window.App.state.roomTheme, coins = window.App.state.coins || 0;
    const owned = window.App.state.themesOwned || (window.App.state.themesOwned = {});
    // 테마 없음(개별 스킨)
    const off = document.createElement("div"); off.className = "shop-cell";
    const ocv = document.createElement("canvas"); ocv.width = 40; ocv.height = 40; ocv.className = "shop-ico";
    const og = ocv.getContext("2d"); og.imageSmoothingEnabled = false; og.fillStyle = "#eef1f5"; og.fillRect(0, 0, 40, 40); og.fillStyle = "#8a97a3"; og.font = "18px sans-serif"; og.textAlign = "center"; og.fillText("✕", 20, 26); off.appendChild(ocv);
    const onm = document.createElement("div"); onm.className = "shop-name"; onm.textContent = "테마 없음"; off.appendChild(onm);
    const obtn = document.createElement("button"); obtn.className = "shop-buy";
    if (!cur) { obtn.textContent = "사용중 ✓"; obtn.classList.add("owned"); obtn.disabled = true; }
    else { obtn.textContent = "개별 스킨"; obtn.addEventListener("click", () => { window.Skins.setTheme(null); window.Audio2.click(); keeperSay("개별 스킨으로 돌아갔어요 🐻"); buildThemes(); }); }
    off.appendChild(obtn); off.addEventListener("mouseenter", () => keeperSay("테마를 끄고 개별 스킨을 써요"));
    grid.appendChild(off);
    // 16종
    for (const th of window.Skins.ROOM_THEMES) {
      const active = cur === th.id, have = !!owned[th.id];
      const cell = document.createElement("div"); cell.className = "shop-cell";
      const cv = document.createElement("canvas"); cv.width = 40; cv.height = 40; cv.className = "shop-ico";
      const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; window.Skins.drawThemeIcon(th, g); cell.appendChild(cv);
      const nm = document.createElement("div"); nm.className = "shop-name"; nm.textContent = (th.concept === "aero" ? "에어로" : "모던") + "·" + th.name; cell.appendChild(nm);
      const btn = document.createElement("button"); btn.className = "shop-buy";
      if (active) { btn.textContent = "사용중 ✓"; btn.classList.add("owned"); btn.disabled = true; }
      else if (have) { btn.textContent = "적용하기"; btn.addEventListener("click", () => { window.Skins.setTheme(th.id); window.Audio2.click(); keeperSay(`${th.name} 테마 적용! 방에서 확인해요 🐻`); buildThemes(); }); }
      else if (coins >= THEME_PRICE) { btn.textContent = "구매하기"; btn.addEventListener("click", () => buyTheme(th)); }
      else { btn.textContent = "코인 부족"; btn.classList.add("poor"); btn.disabled = true; }
      cell.appendChild(btn);
      cell.addEventListener("mouseenter", () => {
        const concept = th.concept === "aero" ? "프루티거 에어로" : "모던";
        keeperSay(active ? `${th.name} — 지금 쓰는 테마예요 🐻` : have ? `${concept} · ${th.name}, 적용할 수 있어요!` : (coins >= THEME_PRICE ? `${concept} · ${th.name} 🪙${THEME_PRICE}코인이에요!` : `${th.name} 🪙${THEME_PRICE}코인… ${shortMsg(THEME_PRICE)}`));
      });
      grid.appendChild(cell);
    }
  }
  function buyTheme(th) {
    if ((window.App.state.coins || 0) < THEME_PRICE) return;
    window.App.state.coins -= THEME_PRICE;
    (window.App.state.themesOwned || (window.App.state.themesOwned = {}))[th.id] = true;
    window.Skins.setTheme(th.id);
    window.App.save(); window.Main.updateCoins(); window.Audio2.blip(760);
    keeperSay(`${th.name} 테마 구매 완료! 방에 바로 적용됐어요 🎁`);
    setTimeout(() => { if (running) keeperSay("무엇을 찾으세요?"); }, 2000);
    buildThemes();
  }

  function buy(it) {
    if (window.App.state.coins < it.price) return;
    window.App.state.coins -= it.price;
    window.App.state.decor[it.id] = { owned: true, x: it.def.x, y: it.def.y, hidden: true }; // 자동 배치 X (꾸미기에서 사용자가 켬)
    window.App.save(); window.Main.updateCoins(); window.Audio2.blip(760);
    keeperSay("구매 완료! 방·거실·부엌 꾸미기에서 꺼내 놓아보세요 🎁"); setTimeout(() => { if (running) keeperSay("무엇을 찾으세요?"); }, 2200);
    buildShop();
  }
  function openPanel() { window.Audio2.ensure(); window.Audio2.click(); buildShop(); panel.classList.remove("hidden"); keeperSay("무엇을 찾으세요?"); bstate = "wave"; btimer = 60; }

  function toV(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function onMove(e) { if (isClosed()) { canvas.style.cursor = "default"; return; } const { x, y } = toV(e); const inK = (x >= KEEPER.x && x <= KEEPER.x + KEEPER.w && y >= KEEPER.y && y <= KEEPER.y + KEEPER.h); canvas.style.cursor = (inK || inRadio(x, y)) ? "pointer" : "default"; }
  function onClick(e) {
    const { x, y } = toV(e);
    if (isClosed()) { window.Audio2.ensure(); window.Audio2.blip(220); keeperSay("😴 문 닫았어요~ 아침 8시에 만나요! (밤 10시 마감)"); return; }
    if (inRadio(x, y)) {   // 라디오 클릭 → 가게 노래 켜고/끄기
      window.Audio2.ensure();
      if (window.Audio2.isLocPlaying()) { window.Audio2.setLocationMusic(null); window.Audio2.blip(300); keeperSay("노래를 껐어요 🔇"); }
      else { window.Audio2.setLocationMusic(SHOP_TRACK); window.Audio2.blip(560); keeperSay("🎵 노래를 틀었어요~"); }
      return;
    }
    if (x >= KEEPER.x && x <= KEEPER.x + KEEPER.w && y >= KEEPER.y && y <= KEEPER.y + KEEPER.h) openPanel();
  }

  window.Shop = {
    init() {
      canvas = document.getElementById("shop-canvas"); ctx = canvas.getContext("2d"); canvas.width = W; canvas.height = H; ctx.imageSmoothingEnabled = false;
      grid = document.getElementById("shop-grid"); panel = document.getElementById("shop-panel"); bubble = document.getElementById("keeper-bubble");
      canvas.addEventListener("mousemove", onMove); canvas.addEventListener("click", onClick);
      window.addEventListener("resize", positionBubble);
      document.getElementById("shop-panel-close").addEventListener("click", () => { panel.classList.add("hidden"); window.Audio2.click(); keeperSay("천천히 둘러보세요~ 🐻"); });
      document.getElementById("shop-grid").addEventListener("mouseleave", () => { if (!panel.classList.contains("hidden")) keeperSay("무엇을 찾으세요?"); });
      document.getElementById("shop-cats").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; curCat = b.dataset.cat; document.querySelectorAll("#shop-cats button").forEach((x) => x.classList.toggle("on", x === b)); window.Audio2.click(); buildShop(); });
      draw();
    },
    start() {
      running = true; last = 0; notes = []; panel.classList.add("hidden"); window.Audio2.setAmbient(null);
      if (isClosed()) { window.Audio2.setLocationMusic(null); keeperSay("😴 지금은 영업 종료예요~ 아침 8시에 다시 열어요! (밤 10시 마감)"); requestAnimationFrame(loop); draw(); return; }
      bstate = "wave"; btimer = 60; keeperSay("어서오세요! 상점으로 들어오면 귀여운 게 많아요~ 🐻"); requestAnimationFrame(loop); window.Audio2.setLocationMusic(SHOP_TRACK); draw();
    },
    stop() { running = false; notes = []; window.Audio2.stopLocationMusic(); if (panel) panel.classList.add("hidden"); if (bubble) bubble.classList.add("hidden"); },
    setWeather() {},
  };
})();
