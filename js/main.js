/* ============================================================
   화면 매니저 · 상단바 · 방 이동 · 날씨 · 부팅 — window.Main
   ============================================================ */
(function () {
  "use strict";
  const HOUSE = ["room", "living", "kitchen", "park", "shop"];
  const mod = { room: () => window.Room, living: () => window.Living, kitchen: () => window.Kitchen, park: () => window.Park, shop: () => window.Shop };
  let curHouse = "room", curScreen = "room";
  let topbar, tbWx, tbWxDrop, clockEl, transition, guide;

  // ============================================================
  //  픽셀 UI 아이콘
  // ============================================================
  function drawUIIcon(cv, kind, on) {
    const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 16, 16);
    const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const disc = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    switch (kind) {
      case "room": // 침대
        P(2, 8, 12, 5, "#c98a8a"); P(2, 6, 4, 4, "#f4ecd8"); P(6, 7, 8, 3, "#8fbfe0");
        P(2, 12, 2, 3, "#8a5a5a"); P(12, 12, 2, 3, "#8a5a5a"); break;
      case "living": // 소파
        P(2, 7, 12, 6, "#7bb0c9"); P(2, 5, 12, 3, "#8fc4dc"); P(1, 7, 2, 6, "#8fc4dc"); P(13, 7, 2, 6, "#8fc4dc");
        P(3, 12, 2, 2, "#5f97b0"); P(11, 12, 2, 2, "#5f97b0"); break;
      case "kitchen": // 냄비
        P(3, 7, 10, 6, "#9198a0"); P(2, 6, 12, 2, "#a6adb5"); P(7, 3, 2, 3, "#a6adb5");
        P(1, 8, 2, 2, "#8a8f97"); P(13, 8, 2, 2, "#8a8f97"); P(6, 2, 1, 3, "rgba(255,255,255,0.6)"); break;
      case "park": // 나무
        P(7, 9, 2, 6, "#7a5230"); disc(8, 6, 5, "#3d8a2e"); disc(5, 8, 3, "#4fa838"); disc(11, 8, 3, "#4fa838"); disc(8, 6, 4, "#5aba45");
        P(2, 14, 12, 2, "#6cbf4a"); break;
      case "shop": // 상점(차양)
        for (let i = 1; i < 15; i += 4) { P(i, 4, 2, 4, "#e0492c"); P(i + 2, 4, 2, 4, "#f4ecd8"); }
        P(2, 8, 12, 7, "#e8dcc0"); P(6, 10, 4, 5, "#8a5a30"); P(2, 8, 12, 1, "#c9b48f"); break;
      case "sound":
        P(3, 6, 2, 4, "#294a5e"); g.fillStyle = "#294a5e"; g.beginPath(); g.moveTo(5, 5); g.lineTo(8, 3); g.lineTo(8, 13); g.lineTo(5, 11); g.closePath(); g.fill();
        if (on) { g.strokeStyle = "#294a5e"; g.lineWidth = 1; g.beginPath(); g.arc(9, 8, 3, -1, 1); g.stroke(); g.beginPath(); g.arc(9, 8, 5, -1, 1); g.stroke(); }
        else { g.strokeStyle = "#c23b3b"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(10, 5); g.lineTo(14, 11); g.moveTo(14, 5); g.lineTo(10, 11); g.stroke(); } break;
      case "help":
        disc(8, 8, 6, "#4aa0ee"); P(6, 4, 4, 2, "#fff"); P(9, 5, 2, 2, "#fff"); P(8, 7, 2, 2, "#fff"); P(7, 9, 2, 2, "#fff"); P(7, 11, 2, 2, "#fff"); break;
      case "menu":
        P(3, 4, 10, 2, "#294a5e"); P(3, 7, 10, 2, "#294a5e"); P(3, 10, 10, 2, "#294a5e"); break;
      case "bright": {
        const lvl = (window.App.state.settings.brightness) || "m";
        if (lvl === "d") {   // 어둡게 = 초승달
          disc(9, 8, 5, "#c9d4e2"); g.globalCompositeOperation = "destination-out"; disc(12, 6, 4.2, "#000"); g.globalCompositeOperation = "source-over";
        } else {             // 보통/밝게 = 해 (밝게일수록 광선 많음)
          disc(8, 8, lvl === "b" ? 4.2 : 3.4, "#ffd23f");
          g.strokeStyle = "#ffb03a"; g.lineWidth = 1; const n = lvl === "b" ? 8 : 4, r0 = lvl === "b" ? 6 : 5.4;
          for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.beginPath(); g.moveTo(8 + Math.cos(a) * r0, 8 + Math.sin(a) * r0); g.lineTo(8 + Math.cos(a) * (r0 + 2), 8 + Math.sin(a) * (r0 + 2)); g.stroke(); }
        }
        break;
      }
      case "sunny":
        disc(8, 8, 4, "#ffd23f"); g.strokeStyle = "#ffb03a"; g.lineWidth = 1;
        [[8, 1, 8, 3], [8, 13, 8, 15], [1, 8, 3, 8], [13, 8, 15, 8]].forEach((l) => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); }); break;
      case "rain":
        disc(6, 7, 3, "#aeb8c4"); disc(10, 7, 3, "#aeb8c4"); P(5, 6, 6, 3, "#aeb8c4");
        P(5, 12, 1, 3, "#4aa0ee"); P(8, 12, 1, 3, "#4aa0ee"); P(11, 12, 1, 3, "#4aa0ee"); break;
      case "snow":
        g.strokeStyle = "#7fc6ef"; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(8, 2); g.lineTo(8, 14); g.moveTo(2, 8); g.lineTo(14, 8); g.moveTo(4, 4); g.lineTo(12, 12); g.moveTo(12, 4); g.lineTo(4, 12); g.stroke(); break;
      case "rainbow":
        const cs = ["#f06c6c", "#ffb45a", "#7ad07a", "#5ac8eb", "#a55ac8"]; g.lineWidth = 1;
        for (let i = 0; i < cs.length; i++) { g.strokeStyle = cs[i]; g.beginPath(); g.arc(8, 13, 6 - i, Math.PI, 0); g.stroke(); } break;
    }
  }
  function drawAllIcons() {
    document.querySelectorAll(".ui-ico").forEach((cv) => {
      const k = cv.dataset.icon;
      const s = window.App.state.settings;
      drawUIIcon(cv, k, k === "sound" ? (s.sfx !== false || s.music !== false) : true);
    });
  }

  // ============================================================
  //  화면 전환
  // ============================================================
  function showScreen(name) {
    if (curScreen === "computer" && name !== "computer" && window.Computer && window.Computer.leave) window.Computer.leave();   // 컴퓨터 떠날 때 타이머 정지
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + name));
    curScreen = name;
    const isHouse = HOUSE.includes(name);
    topbar.classList.toggle("hidden", !isHouse);
    tbWx.style.display = (name === "kitchen" || name === "shop") ? "none" : "";
    // 꾸미기 버튼은 방에서만
    const canDecor = (name === "room" || name === "living" || name === "kitchen");
    const eb = document.getElementById("decor-edit-btn"); if (eb) eb.style.display = canDecor ? "" : "none";
    // 밖(공원/상점)에서는 방 탭 숨기고 이동 버튼 표시
    const isOutside = (name === "park" || name === "shop");
    document.querySelector(".tb-rooms").style.display = isOutside ? "none" : "";
    document.getElementById("outside-nav").classList.toggle("hidden", !isOutside);
    document.getElementById("nav-home").classList.toggle("hidden", name !== "park");   // 공원: 집으로
    document.getElementById("nav-exit").classList.toggle("hidden", name !== "shop");   // 상점: 나가기
    document.getElementById("go-out-btn").classList.toggle("hidden", name !== "living"); // 거실: 밖으로
    if (isHouse) document.querySelectorAll(".room-tab").forEach((b) => b.classList.toggle("active", b.dataset.room === name));
  }
  function toggleEdit(on) {
    const m = mod[curHouse] && mod[curHouse]();
    if (m && m.setEditMode) m.setEditMode(on);
    const btn = document.getElementById("decor-edit-btn");
    btn.textContent = on ? "✅ 완료" : "🎨 꾸미기";
    btn.classList.toggle("editing", on);
    const pal = document.getElementById("decor-palette");
    if (on) { palCat = "all"; buildPalette(); }
    pal.classList.toggle("hidden", !on);
  }
  const PAL_CATS = [["all", "전체"], ["furniture", "가구"], ["plant", "식물"], ["wall", "벽장식"], ["floor", "바닥"], ["toy", "장난감"], ["builtin", "기본"], ["skin", "✨스킨"]];
  const ROOM_SKIN_ITEMS = { room: ["computer", "aquarium"], living: ["tv", "bookshelf", "sofa", "radio"], kitchen: ["fridge", "microwave", "sink"] };
  const GLOBAL_SKIN_ITEMS = ["wallpaper", "floor", "window", "light"];
  function ownedSkinIdxs(item) { const a = window.Skins.THEMES[item]; const r = []; for (let i = 0; i < a.length; i++) if (window.Skins.isOwned(item, i)) r.push(i); return r; }
  let palCat = "all";
  function applyPalettePos() {
    const pal = document.getElementById("decor-palette"); const p = window.App.state.palettePos;
    if (p) { pal.style.left = p.x + "px"; pal.style.top = p.y + "px"; pal.style.bottom = "auto"; pal.style.transform = "none"; }
    else { pal.style.left = ""; pal.style.top = ""; pal.style.bottom = ""; pal.style.transform = ""; }
  }
  let palDrag = null;
  function palStartDrag(e) {
    const pal = document.getElementById("decor-palette"); const r = pal.getBoundingClientRect();
    palDrag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    pal.style.transform = "none"; pal.style.bottom = "auto";
    window.addEventListener("pointermove", palMoveDrag); window.addEventListener("pointerup", palEndDrag);
    e.preventDefault();
  }
  function palMoveDrag(e) {
    if (!palDrag) return;
    const pal = document.getElementById("decor-palette"), w = pal.offsetWidth, h = pal.offsetHeight;
    const x = Math.max(4, Math.min(window.innerWidth - w - 4, e.clientX - palDrag.dx));
    const y = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - palDrag.dy));
    pal.style.left = x + "px"; pal.style.top = y + "px"; window.App.state.palettePos = { x, y };
  }
  function palEndDrag() { palDrag = null; window.removeEventListener("pointermove", palMoveDrag); window.removeEventListener("pointerup", palEndDrag); window.App.save(); }
  function palResetPos() { window.App.state.palettePos = null; window.App.save(); applyPalettePos(); window.Audio2.blip(420); }

  function buildPalette() {
    const pal = document.getElementById("decor-palette"); pal.innerHTML = "";
    const m = mod[curHouse]();
    // 헤더: 이동 손잡이(드래그·더블클릭=기본) + 처음으로 되돌리기
    const head = document.createElement("div"); head.className = "pal-head";
    const grip = document.createElement("div"); grip.className = "pal-grip";
    grip.innerHTML = '<span class="dots">⠿</span><span>이동</span>';
    grip.addEventListener("pointerdown", palStartDrag);
    grip.addEventListener("dblclick", palResetPos);
    const rev = document.createElement("button"); rev.className = "pal-revert"; rev.textContent = "↩ 처음으로";
    rev.title = "꾸미기 물품을 두기 전으로 되돌려요";
    rev.addEventListener("click", () => { const m = mod[curHouse](); if (m && m.revertRoom) { m.revertRoom(); window.Audio2.click(); palCat = "all"; buildPalette(); } });
    head.appendChild(grip); head.appendChild(rev);
    pal.appendChild(head);
    applyPalettePos();
    const itemsRow = document.createElement("div"); itemsRow.className = "pal-items";
    if (palCat === "skin") {
      // 기능 아이템 스킨 변경 (보유한 스킨 순환)
      const items = GLOBAL_SKIN_ITEMS.concat(ROOM_SKIN_ITEMS[curHouse] || []);
      for (const item of items) {
        const curIdx = window.Skins.cur(item), th = window.Skins.THEMES[item][curIdx], owned = ownedSkinIdxs(item);
        const b = document.createElement("button"); b.className = "pal-item skin";
        b.title = window.Skins.labelOf(item) + " · " + th.name + (owned.length > 1 ? " (탭해서 변경)" : " (상점에서 더 구매)");
        const cv = document.createElement("canvas"); cv.width = 40; cv.height = 40; const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; window.Skins.drawIcon(item, curIdx, g); b.appendChild(cv);
        b.addEventListener("click", () => {
          const ow = ownedSkinIdxs(item);
          if (ow.length <= 1) { window.Audio2.blip(300); return; }        // 보유 스킨이 하나뿐
          const pos = ow.indexOf(window.Skins.cur(item));
          window.Skins.equip(item, ow[(pos + 1) % ow.length]); window.Audio2.blip(620); buildPalette();
        });
        itemsRow.appendChild(b);
      }
    } else {
      const list = (m.paletteList && m.paletteList()) || [];
      const shown = list.filter((e) => palCat === "all" || e.cat === palCat);
      if (!list.length) itemsRow.innerHTML = '<span class="pal-empty">🏪 상점에서 아이템을 사면 여기 목록에 떠요!</span>';
      else if (!shown.length) itemsRow.innerHTML = '<span class="pal-empty">이 카테고리엔 가진 게 없어요 🍃</span>';
      else for (const e of shown) {
        const b = document.createElement("button"); b.className = "pal-item" + (e.on ? " on" : ""); b.title = e.name;
        const cv = document.createElement("canvas"); cv.width = 34; cv.height = 34; const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; g.translate(17, 27); e.iconDraw(g); b.appendChild(cv);
        b.addEventListener("click", () => { const now = m.toggleItem ? m.toggleItem(e.id) : false; window.Audio2.blip(now ? 620 : 380); buildPalette(); });
        itemsRow.appendChild(b);
      }
    }
    pal.appendChild(itemsRow);
    // 하단 카테고리 바 (상점처럼)
    const cats = document.createElement("div"); cats.className = "pal-cats";
    for (const [key, label] of PAL_CATS) {
      const cb = document.createElement("button"); cb.textContent = label; if (key === palCat) cb.classList.add("on");
      cb.addEventListener("click", () => { palCat = key; window.Audio2.click(); buildPalette(); });
      cats.appendChild(cb);
    }
    pal.appendChild(cats);
  }
  function updateCoins() { const el = document.getElementById("tb-coins"); if (el) el.textContent = "🪙 " + (window.App.state.coins || 0); }
  function applyBrightness() { const b = window.App.state.settings.brightness || "m"; const v = b === "d" ? 0.82 : b === "b" ? 1.18 : 1; const app = document.getElementById("app"); if (app) app.style.filter = v === 1 ? "none" : "brightness(" + v + ")"; }

  function gotoRoom(name) {
    if (mod[curHouse] && mod[curHouse]().editing) toggleEdit(false);   // 편집 종료 후 이동
    window.Bubbles.stop();
    HOUSE.forEach((r) => { if (r !== name) mod[r]().stop(); });
    curHouse = name;
    showScreen(name);
    mod[name]().start();
    // 라디오(실내 곡)는 실내에서만. 공원·상점은 위치 배경음악(각 모듈 start에서 설정)
    const inside = (name === "room" || name === "living" || name === "kitchen");
    window.Audio2.setRadioAllowed(inside);
    if (inside) window.Audio2.setLocationMusic(null);
    window.Audio2.setMusicVolume(name === "living" ? 0.6 : 0.2); // 라디오는 거실이 가장 크게
    closeWxDrop();
  }

  // ---- 어항 줌인 ----
  function zoomTo(name, then) {
    transition.className = "transition zooming"; window.Audio2.blip(680);
    setTimeout(() => { then && then(); showScreen(name); transition.className = "transition fadeout"; setTimeout(() => (transition.className = "transition hidden"), 260); }, 300);
  }

  // ---- 상점 입장: 어두워짐 → 뚜벅뚜벅 발소리 → 밝아지며 상점 ----
  function walkTo(name) {
    window.Audio2.ensure();
    window.Audio2.fadeOutLocation(500);   // 공원 브금 서서히 줄이며 끔
    window.Audio2.stopAmbient();           // 바람소리도 멈춰 발소리 또렷하게
    window.Audio2.footsteps(4);
    transition.className = "transition walk-out";                 // 페이드 아웃(어두워짐)
    setTimeout(() => {
      gotoRoom(name);                                            // 어둠 뒤에서 화면 전환
      transition.className = "transition walk-in";               // 페이드 인(밝아짐)
      setTimeout(() => (transition.className = "transition hidden"), 520);
    }, 780);
  }

  const Main = {
    gotoRoom,
    walkTo,
    showRoom() { gotoRoom("room"); },
    showBubbles() { window.Room.stop(); zoomTo("bubbles", () => window.Bubbles.start()); },
    showComputer() { window.Room.stop(); window.Audio2.setMusicVolume(0); window.Computer.enter(); showScreen("computer"); },
    updateCoins,
  };
  window.Main = Main;

  // ============================================================
  //  날씨 (방·거실 창문 반영)
  // ============================================================
  function setWeather(w) {
    window.App.state.weather = w; window.App.save();
    window.Room.setWeather(w);
    window.Living.setWeather(w);
    window.Kitchen.setWeather(w);
    window.Park.setWeather(w);
    document.querySelectorAll("#tb-wx-drop button").forEach((b) => b.classList.toggle("active", b.dataset.weather === w));
  }
  function closeWxDrop() { tbWxDrop.classList.add("hidden"); }

  // ============================================================
  //  도움말 (방마다 내용 다름)
  // ============================================================
  const GUIDE = {
    room: { title: "🛏️ 방 사용법", items: [
      "🐠 <b>어항</b>을 클릭 → 할일(비눗방울) 화면으로 들어가요.",
      "💻 <b>컴퓨터</b>를 클릭 → 다이어리·운세·<b>아케이드(게임)</b>·설정.",
      "☀️ 오른쪽 위 <b>날씨 메뉴(≡)</b>로 창밖 날씨를 바꿔요. (시간대 반영)",
      "🫧 방울 <b>좌클릭=완료</b>(코인 획득·물고기가 늘어나요!) · <b>우클릭=수정</b> · 빈 물 클릭=파동",
      "💡 <b>천장 조명</b>(어항 위)을 눌러 켜고/끄고, 소품(머그·화분 등)도 눌러보세요!",
    ] },
    living: { title: "🛋️ 거실 사용법", items: [
      "📺 <b>TV</b>를 클릭 → 프루티거 에어 추상 패턴이 랜덤으로 바뀌어요.",
      "📻 <b>라디오</b>를 클릭 → 곡을 고르면 ♪ 음표가 떠오르고 음악이 흘러요. (실내에서만)",
      "📚 <b>책장</b>을 클릭 → 책장 넘기는 소리와 함께 고전문학 <b>명구</b>를 추천해줘요.",
      "🛋️ <b>소파·러그</b>는 꾸미기에서 옮기거나 치울 수 있어요.",
      "☀️ 오른쪽 위 <b>날씨 메뉴(≡)</b>로 큰 창문의 날씨가 바뀌어요. (낮·노을·밤 반영)",
    ] },
    park: { title: "🌳 공원 사용법", items: [
      "🐱 <b>길고양이</b>를 클릭하면 쓰다듬어 줄 수 있어요 (야옹~). 밤 9시엔 잠들어요.",
      "🦆 <b>연못</b>을 클릭하면 오리들이 놀라서 <b>날아가요</b>. (저녁·비·눈엔 없어요)",
      "🌙 밤엔 어두워지고 <b>반딧불이</b>가 반짝여요 (맑은 밤).",
      "☀️ 오른쪽 위 날씨 메뉴로 공원 날씨·시간대가 바뀌어요. (눈 오면 소복이!)",
      "🪧 <b>표지판</b>을 누르면 상점으로 가요.",
    ] },
    shop: { title: "🏪 상점 사용법", items: [
      "🐻 <b>곰돌이 점원</b>을 클릭 → 구매창이 열려요.",
      "🪙 모은 코인으로 꾸미기 아이템과 <b>스킨</b>(가구·벽지·바닥·전등 등)을 사요.",
      "🎨 산 것은 <b>방·거실·부엌</b>에서 왼쪽 아래 <b>꾸미기</b>로 배치·이동·숨김 할 수 있어요.",
      "⏰ 상점은 <b>밤 10시~아침 8시엔 문을 닫아요.</b>",
    ] },
    kitchen: { title: "🍳 부엌 사용법", items: [
      "🧊 <b>냉장고</b>를 클릭 → 문이 열리며 <b>오늘의 메뉴</b>를 추천해줘요! (한·일·중·양 80가지)",
      "🎲 팝업에서 <b>다시 추천하기</b>로 다른 메뉴를 뽑고, 위 탭으로 종류를 골라요.",
      "🔥 <b>가스레인지</b>·<b>전자레인지</b>·<b>개수대</b>를 눌러보고, 창가 <b>식물</b>도 옮겨보세요.",
    ] },
  };
  // 환영창 물속 방울 배경
  function spawnWelcomeBubbles() {
    const wrap = document.getElementById("welcome-bubbles"); if (!wrap) return; wrap.innerHTML = "";
    for (let i = 0; i < 18; i++) {
      const b = document.createElement("div"); b.className = "wbub";
      const size = 8 + Math.random() * 40;
      b.style.width = b.style.height = size + "px";
      b.style.left = (Math.random() * 100) + "%";
      b.style.animationDuration = (7 + Math.random() * 10) + "s";
      b.style.animationDelay = (-Math.random() * 14) + "s";
      wrap.appendChild(b);
    }
  }

  function openGuide() {
    const gd = GUIDE[curHouse] || GUIDE.room;
    document.getElementById("guide-title").textContent = gd.title;
    document.getElementById("guide-list").innerHTML = gd.items.map((x) => `<li>${x}</li>`).join("");
    guide.classList.remove("hidden");
  }

  // ============================================================
  //  시계
  // ============================================================
  function tick() {
    const d = new Date();
    clockEl.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    // 하루 지나면 완료 개수 리셋 (앱을 켜둔 채 자정을 넘겨도)
    if (window.App.state.doneStamp !== window.App.todayStr()) {
      window.App.state.doneStamp = window.App.todayStr();
      window.App.state.doneToday = 0; window.App.save();
      const dc = document.getElementById("done-count"); if (dc) dc.textContent = "0";
    }
  }

  // ============================================================
  //  부팅
  // ============================================================
  function boot() {
    window.App.load();
    document.documentElement.style.setProperty("--font-scale", { s: 0.85, m: 1, l: 1.2 }[window.App.state.settings.font] || 1);

    topbar = document.getElementById("topbar");
    tbWx = document.getElementById("tb-wx");
    tbWxDrop = document.getElementById("tb-wx-drop");
    clockEl = document.getElementById("tb-clock");
    transition = document.getElementById("transition");
    guide = document.getElementById("guide");

    window.Room.init({ onAquarium: Main.showBubbles, onComputer: Main.showComputer });
    window.Living.init();
    window.Kitchen.init();
    window.Park.init();
    window.Shop.init();
    window.Bubbles.init();
    window.Computer.init();

    drawAllIcons();
    updateCoins();
    applyBrightness();
    window.App.onSettings(applyBrightness);
    document.getElementById("decor-edit-btn").addEventListener("click", () => { window.Audio2.ensure(); window.Audio2.click(); const m = mod[curHouse](); toggleEdit(!(m && m.editing)); });
    // 밖 이동 버튼
    document.getElementById("nav-home").addEventListener("click", () => { window.Audio2.ensure(); window.Audio2.click(); gotoRoom("living"); });
    document.getElementById("nav-exit").addEventListener("click", () => { window.Audio2.ensure(); window.Audio2.click(); gotoRoom("park"); });
    document.getElementById("go-out-btn").addEventListener("click", () => { window.Audio2.ensure(); window.Audio2.click(); gotoRoom("park"); });

    // 방 전환 탭
    document.querySelectorAll(".room-tab").forEach((b) => b.addEventListener("click", () => { window.Audio2.ensure(); window.Audio2.click(); gotoRoom(b.dataset.room); }));

    // 날씨 햄버거
    document.getElementById("tb-wx-toggle").addEventListener("click", (e) => { e.stopPropagation(); window.Audio2.ensure(); window.Audio2.click(); tbWxDrop.classList.toggle("hidden"); });
    tbWxDrop.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { window.Audio2.ensure(); window.Audio2.click(); setWeather(b.dataset.weather); closeWxDrop(); }));
    document.addEventListener("click", (e) => { if (!tbWx.contains(e.target)) closeWxDrop(); });

    // 소리 토글
    document.getElementById("tb-sound").addEventListener("click", () => {
      window.Audio2.ensure();
      const s = window.App.state.settings;
      const nv = !(s.sfx !== false || s.music !== false);   // 하나라도 켜져있으면 전체 끄기, 다 꺼졌으면 전체 켜기
      s.sfx = nv; s.music = nv;
      window.App.applySettings();
      drawAllIcons();
      if (nv) window.Audio2.refreshAmbient(); else window.Audio2.stopAmbient();
      window.Audio2.syncMusic();
      if (nv) window.Audio2.click();   // 켤 때 딸깍
    });
    window.App.onSettings(() => drawAllIcons());

    // 도움말
    document.getElementById("tb-help").addEventListener("click", () => { window.Audio2.ensure(); window.Audio2.click(); openGuide(); });
    document.getElementById("guide-x").addEventListener("click", () => guide.classList.add("hidden"));
    guide.addEventListener("click", (e) => { if (e.target === guide) guide.classList.add("hidden"); });

    // 어항 화면 → 방으로
    document.getElementById("btn-back-room").addEventListener("click", Main.showRoom);

    // 사용법 창: "다시 보지 않기" 전엔 접속(새 창)마다 표시
    if (!window.App.state.welcomeHidden) { document.getElementById("welcome-overlay").classList.remove("hidden"); spawnWelcomeBubbles(); }
    document.getElementById("welcome-start").addEventListener("click", () => {   // 이번만 닫기 (다음 접속 땐 다시 뜸)
      document.getElementById("welcome-overlay").classList.add("hidden");
      window.Audio2.ensure(); window.Audio2.blip(680);
    });
    document.getElementById("welcome-hide").addEventListener("click", () => {    // 다시 보지 않기 (영구)
      document.getElementById("welcome-overlay").classList.add("hidden");
      window.App.state.welcomeHidden = true; window.App.save();
      window.Audio2.ensure(); window.Audio2.blip(420);
    });

    setWeather(window.App.state.weather || "sunny");
    tick(); setInterval(tick, 1000);
    window.addEventListener("beforeunload", () => window.App.save());
    setInterval(() => window.App.save(), 5000);

    gotoRoom("room");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
