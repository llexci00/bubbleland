/* ============================================================
   컴퓨터 화면 (Y2K 바탕화면) — window.Computer
   앱: 다이어리 · 오늘의 운세 · 설정(소리/글씨/바탕화면)
   ============================================================ */
(function () {
  "use strict";
  let desktop, clockEl;
  let diaryText, diaryList, diaryDate, diaryStatus, diaryReply, diaryReplyText;
  let selectedMood = "😊";

  // ---- 그림판 상태 ----
  let pcv, pctx, pColor = "#2b2b2b", pSize = 5, pErase = false, pDrawing = false, pLast = null, pReady = false;
  const PAINT_COLORS = ["#2b2b2b", "#e0492c", "#ff9a3e", "#ffd23f", "#6fbf4a", "#3aa0d8", "#7a5ad0", "#ff8fb3", "#8a5a2e", "#ffffff"];
  const PAINT_KEY = "bubbleland.paint", PAINT_BG = "#fffdf8";

  // ---- 타이머 상태 ----
  let tmReady = false, tmBell = "ding";
  let tmTotal = 600, tmLeft = 600, tmRun = false, tmIv = null, tmEnd = 0;         // 일반(카운트다운)
  let tmStRun = false, tmStIv = null, tmStBase = 0, tmStMs = 0;                    // 열공(스톱워치)
  const TM_MAX = 5 * 3600, TM_KEY = "bubbleland.study";
  const TM_BELLS = [{ id: "ding", name: "딩동" }, { id: "bell", name: "종" }, { id: "beep", name: "삐삐" }, { id: "chime", name: "차임" }];
  let cheerT = null;
  const CHEERS = [
    "화이팅! 💪", "조금만 더! 🔥", "집중 집중! 📚", "거의 다 왔어! ✨", "오늘도 화이팅! ⭐", "잘하고 있어! 🐰", "포기 없기! 💫",
    "넌 할 수 있어! 🌟", "지금이 제일 빛나! ✨", "한 걸음씩 가자! 🐢", "충분히 잘하고 있어 💗", "5분만 더 집중! ⏰",
    "네 노력은 배신 안 해 🌱", "오늘의 너, 최고야 🏆", "차근차근 하면 돼 🍀", "곧 쉬는 시간이야! ☕", "여기까지 온 것도 대단해 👏",
    "몰입 몰입! 🌊", "딱 한 페이지만 더! 📖", "네 페이스대로 가 🐾", "숨 한 번 쉬고, 다시! 🌬️", "끝까지 파이팅! 🚩",
    "작은 진전도 진전이야 🌼", "머리 아프면 물 한 잔 💧", "목표에 가까워지는 중 🎯", "너라면 해낼 거야 💖", "지금 집중력 최고조! ⚡",
    "미래의 네가 고마워할 거야 🌈", "천천히, 그러나 꾸준히 🐌", "잘 버티고 있어, 멋져 😎", "한 문제만 더 풀자 ✏️", "졸리면 스트레칭 한 번! 🙆",
    "네 자리에서 빛나는 중 💡", "포기는 배추 셀 때만! 🥬", "오늘도 성장하는 중 🌿", "집중하는 너, 반짝반짝 ✨", "조금 쉬어도 괜찮아 🫧",
    "여기서 한 번 더! 🌟", "네 하루가 자랑스러워 🐻",
  ];
  // 응원 동물 6종 (같은 하얀 머리띠 · 같은 포즈 · 빨간 점 없음)
  const ANIMALS = [
    { body: "#ffffff", line: "#e7cdd8", nose: "#e02e78",   // 토끼
      back: '<ellipse cx="24" cy="22" rx="6.5" ry="17" fill="#fff" stroke="#e7cdd8" stroke-width="1.6" transform="rotate(-11 24 22)"/><ellipse cx="40" cy="22" rx="6.5" ry="17" fill="#fff" stroke="#e7cdd8" stroke-width="1.6" transform="rotate(11 40 22)"/><ellipse cx="24" cy="23" rx="2.6" ry="10" fill="#ffc3d5" transform="rotate(-11 24 23)"/><ellipse cx="40" cy="23" rx="2.6" ry="10" fill="#ffc3d5" transform="rotate(11 40 23)"/>' },
    { body: "#b98a5a", line: "#916a3f", nose: "#5a3f28",   // 곰
      back: '<circle cx="17" cy="35" r="8" fill="#b98a5a" stroke="#916a3f" stroke-width="1.6"/><circle cx="47" cy="35" r="8" fill="#b98a5a" stroke="#916a3f" stroke-width="1.6"/><circle cx="17" cy="35" r="3.6" fill="#8a6038"/><circle cx="47" cy="35" r="3.6" fill="#8a6038"/>',
      extra: '<ellipse cx="32" cy="58" rx="9" ry="6.5" fill="#e8d1aa"/>' },
    { body: "#f0954a", line: "#d2762f", nose: "#3a2b2b",   // 여우
      back: '<path d="M13 41 L19 19 L29 37 Z" fill="#f0954a" stroke="#d2762f" stroke-width="1.6"/><path d="M51 41 L45 19 L35 37 Z" fill="#f0954a" stroke="#d2762f" stroke-width="1.6"/><path d="M17.5 37 L20 25 L25 35 Z" fill="#3a2b2b"/><path d="M46.5 37 L44 25 L39 35 Z" fill="#3a2b2b"/>',
      extra: '<ellipse cx="32" cy="59" rx="11" ry="7" fill="#fff"/>' },
    { body: "#f4a24a", line: "#cf7f2a", nose: "#3a2b2b",   // 호랑이
      back: '<circle cx="18" cy="36" r="7" fill="#f4a24a" stroke="#cf7f2a" stroke-width="1.6"/><circle cx="46" cy="36" r="7" fill="#f4a24a" stroke="#cf7f2a" stroke-width="1.6"/><circle cx="18" cy="36" r="3" fill="#3a2b2b"/><circle cx="46" cy="36" r="3" fill="#3a2b2b"/>',
      extra: '<ellipse cx="32" cy="59" rx="10" ry="6.5" fill="#fff"/><path d="M14 51 l6 1.5 M14 56 l6 0.5 M50 51 l-6 1.5 M50 56 l-6 0.5" stroke="#3a2b2b" stroke-width="1.6" stroke-linecap="round" fill="none"/>' },
    { body: "#f0d9a8", line: "#d4b57a", nose: "#c08a6a",   // 햄스터 (볼따구 없음)
      back: '<circle cx="20" cy="37" r="5.5" fill="#f0d9a8" stroke="#d4b57a" stroke-width="1.5"/><circle cx="44" cy="37" r="5.5" fill="#f0d9a8" stroke="#d4b57a" stroke-width="1.5"/><circle cx="20" cy="37" r="2.4" fill="#e6b8c0"/><circle cx="44" cy="37" r="2.4" fill="#e6b8c0"/>',
      extra: '<ellipse cx="32" cy="59" rx="7" ry="5" fill="#fff"/>' },
    { body: "#86cf6e", line: "#5aa84a", nose: "#3f7a30" },   // 거북이 (초록 얼굴만 · 몸통 제거)
  ];
  function animalSVG(a) {
    const band = '<path d="M50 43 l9 -4 M50 43 l8 5" stroke="#e6e6ee" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<rect x="11" y="40" width="42" height="6.5" rx="3.2" fill="#fbfbff" stroke="#d3d3dd" stroke-width="1"/>';
    const face = '<circle cx="24.5" cy="52" r="2.6" fill="#2f2320"/><circle cx="39.5" cy="52" r="2.6" fill="#2f2320"/>' +
      '<circle cx="25.4" cy="51.2" r="0.8" fill="#fff"/><circle cx="40.4" cy="51.2" r="0.8" fill="#fff"/>' +
      '<circle cx="18.5" cy="57" r="3" fill="#ffb0c4" opacity="0.85"/><circle cx="45.5" cy="57" r="3" fill="#ffb0c4" opacity="0.85"/>' +
      '<circle cx="32" cy="56" r="1.6" fill="' + (a.nose || "#7a5a4a") + '"/>' +
      '<path d="M32 57.5 q-2.5 2.2 -5 0.6 M32 57.5 q2.5 2.2 5 0.6" stroke="#a88" stroke-width="1.2" fill="none"/>';
    const paw = '<circle cx="13" cy="46" r="5" fill="' + (a.paw || a.body) + '" stroke="' + a.line + '" stroke-width="1.4"/>';
    return '<svg viewBox="0 0 64 74" class="tm-rabbit-svg" xmlns="http://www.w3.org/2000/svg"><g class="tmr-wiggle">' +
      (a.back || "") + '<ellipse cx="32" cy="50" rx="20" ry="19" fill="' + a.body + '" stroke="' + a.line + '" stroke-width="1.6"/>' +
      (a.extra || "") + band + face + paw + "</g></svg>";
  }

  // ============================================================
  //  창 열고 닫기
  // ============================================================
  function openWin(id) {
    const w = document.getElementById("win-" + id);
    if (w) { w.classList.remove("hidden"); bringFront(w); }
    window.Audio2.click(560);
    if (id === "diary") refreshDiary();
    if (id === "settings") syncSettings();
    if (id === "paint") openPaint();
    if (id === "timer") openTimer();
    if (id === "arcade") window.Arcade.open();
  }
  function closeWin(id) { const w = document.getElementById("win-" + id); if (w) w.classList.add("hidden"); if (id === "arcade") window.Arcade.close(); if (id === "timer") stopAllTimers(); window.Audio2.click(360); }
  let zTop = 30;
  function bringFront(w) { w.style.zIndex = ++zTop; }

  // ============================================================
  //  다이어리
  // ============================================================
  function fmtDate( d) {
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}. (${["일","월","화","수","목","금","토"][d.getDay()]})`;
  }
  function selectMood(m) {
    selectedMood = m;
    document.querySelectorAll("#mood-row .mood-btn").forEach((b) => b.classList.toggle("on", b.dataset.mood === m));
  }
  // 🐟 AI 친구 코멘트 (오프라인 규칙 기반 감성 분석)
  function friendComment(text, mood) {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    if (!text || !text.trim()) return pick(["오늘 있었던 일을 적어주면 내가 읽고 얘기해줄게! 🐟", "아직 비어 있네! 한 줄이라도 써볼래? ✏️"]);
    const has = (arr) => arr.some((w) => text.includes(w));
    const hard = ["힘들", "지치", "지쳐", "피곤", "우울", "슬프", "슬픔", "눈물", "울었", "짜증", "화나", "화가", "스트레스", "괴로", "외로", "불안", "걱정", "최악", "망했", "아프", "아파", "속상", "지겨", "포기"];
    const happy = ["행복", "기쁘", "좋았", "즐거", "재밌", "재미", "신나", "설레", "최고", "뿌듯", "성공", "해냈", "웃었", "사랑", "고마", "감사", "기분 좋", "행운"];
    const busy = ["바빠", "바쁘", "야근", "시험", "과제", "공부", "발표", "마감", "할 일", "할일"];
    const calm = ["그냥", "보통", "평범", "무난", "산책", "커피", "쉬었", "쉼", "느긋", "잔잔"];
    if (has(hard)) return pick([
      "오늘 정말 힘들었겠다… 그래도 하루를 버텨낸 네가 대단해. 오늘은 푹 쉬어 🫧",
      "많이 지쳤구나. 네 잘못이 아니야. 따뜻한 차 한 잔 어때? ☕",
      "속상한 일이 있었나 봐. 여기선 마음껏 털어놔도 돼, 내가 들어줄게 🐟",
      "울고 싶은 날엔 울어도 괜찮아. 내일은 조금 더 가벼워질 거야 🌙",
    ]);
    if (has(happy)) return pick([
      "우와, 오늘 정말 즐거웠나 보다! 나도 덩달아 기뻐 🎉",
      "좋은 하루였구나! 이런 날은 기억해두면 두고두고 힘이 돼 ✨",
      "행복이 글에서 뿜어져 나온다 ㅎㅎ 그 기분 오래 간직해! 🫧",
      "해냈구나! 정말 잘했어. 스스로를 마음껏 칭찬해줘 🏆",
    ]);
    if (has(busy)) return pick([
      "할 일이 많은 하루였네. 그걸 다 해낸 것만으로 충분해, 조금 쉬어가자 🍵",
      "바쁜 와중에도 기록을 남기다니 기특해! 오늘도 수고 많았어 🐟",
    ]);
    if (has(calm)) return pick([
      "잔잔하고 평온한 하루였구나. 그런 하루도 참 소중해 🌿",
      "무난한 하루도 잘 지나간 거야. 오늘도 애썼어 😊",
    ]);
    if (mood === "😢" || mood === "😔" || mood === "😡") return pick(["오늘은 마음이 좀 무거웠구나. 내가 옆에 있을게 🫧", "괜찮아, 그런 날도 있는 거야. 토닥토닥 🐟"]);
    if (mood === "🥰" || mood === "😊") return pick(["기분 좋은 하루였구나! 그 미소 잃지 마 ✨", "읽는 나까지 기분이 좋아졌어 ㅎㅎ 🐟"]);
    return pick([
      "오늘 하루도 살아내느라 애썼어 🐟 내일도 응원할게!",
      "이렇게 하루를 기록하는 너, 정말 멋져. 오늘도 고생했어 🌟",
      "네 하루를 들려줘서 고마워. 언제든 또 얘기해줘 🫧",
    ]);
  }

  function refreshDiary() {
    diaryDate.textContent = fmtDate(new Date());
    if (diaryReply) diaryReply.classList.add("hidden");
    selectMood("😊");
    const list = window.App.state.diary || [];
    diaryList.innerHTML = "";
    if (!list.length) { diaryList.innerHTML = '<div class="diary-empty">아직 기록이 없어요 ✨</div>'; return; }
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      const item = document.createElement("div");
      item.className = "diary-item";
      item.setAttribute("draggable", "true");
      item.dataset.idx = i;
      item.innerHTML = `<b>${e.mood || ""} ${e.date}</b><span>${e.text.replace(/</g, "&lt;").slice(0, 60)}${e.text.length > 60 ? "…" : ""}</span>`;
      item.addEventListener("click", () => { diaryText.value = e.text; if (e.mood) selectMood(e.mood); diaryText.focus(); });
      item.addEventListener("dragstart", (ev) => { ev.dataTransfer.setData("text/plain", String(i)); ev.dataTransfer.effectAllowed = "move"; item.classList.add("dragging"); });
      item.addEventListener("dragend", () => item.classList.remove("dragging"));
      diaryList.appendChild(item);
    }
  }
  function saveDiary() {
    const txt = diaryText.value.trim();
    if (!txt) { diaryText.focus(); return; }
    window.App.state.diary = window.App.state.diary || [];
    window.App.state.diary.push({ date: fmtDate(new Date()), text: txt, mood: selectedMood });
    window.App.save();
    diaryText.value = "";
    diaryStatus.textContent = "저장됐어요! 💾";
    setTimeout(() => (diaryStatus.textContent = ""), 1800);
    refreshDiary();
    window.Audio2.click(720);
  }

  // ---- 픽셀 데스크톱 아이콘 ----
  function drawIcon(cv, kind) {
    const g = cv.getContext("2d"); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 16, 16);
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const disc = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    if (kind === "diary") {
      R(3, 2, 10, 12, "#c94f6a"); R(3, 2, 2, 12, "#a03a52"); R(5, 3, 7, 10, "#fffdf5");
      [5, 7, 9, 11].forEach((y) => R(6, y, 5, 1, "#c9d2dc")); R(11, 2, 1, 6, "#ffd23f");
    } else if (kind === "paint") {
      disc(7, 9, 6, "#efe4cf"); disc(7, 9, 5.2, "#f7efdc");                              // 팔레트
      R(3, 5, 2, 2, "#e0492c"); R(7, 4, 2, 2, "#ffd23f"); R(10, 7, 2, 2, "#3aa0d8"); R(4, 10, 2, 2, "#6fbf4a"); R(8, 11, 2, 2, "#ff8fb3"); // 물감
      disc(6, 10, 1.4, "#c9b58a");                                                        // 엄지 구멍
      R(11, 1, 2, 8, "#b57a3e"); R(11, 1, 2, 2, "#d8dde2"); disc(12, 9, 1.6, "#e0492c");  // 붓
    } else if (kind === "settings") {
      disc(8, 8, 5, "#aeb8c4");
      [[7, 1, 2, 3], [7, 12, 2, 3], [1, 7, 3, 2], [12, 7, 3, 2], [3, 3, 2, 2], [11, 3, 2, 2], [3, 11, 2, 2], [11, 11, 2, 2]].forEach((r) => R(r[0], r[1], r[2], r[3], "#aeb8c4"));
      disc(8, 8, 2, "#5a6773");
    } else if (kind === "exit") {
      R(3, 2, 10, 13, "#8a5a2e"); R(4, 3, 8, 12, "#b57a3e");
      R(5, 4, 6, 4, "#9a6532"); R(5, 9, 6, 4, "#9a6532"); R(10, 8, 1, 2, "#ffd23f");
    } else if (kind === "timer") {
      R(7, 0, 2, 2, "#6e7681"); R(6, 1, 4, 1, "#8a929c");                                 // 상단 버튼
      disc(8, 9, 6, "#c0392b"); disc(8, 9, 5, "#e0492c"); disc(8, 9, 4, "#fff3ea");        // 몸통(빨간 타이머)
      g.strokeStyle = "#c0392b"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(8, 9); g.lineTo(8, 5.5); g.moveTo(8, 9); g.lineTo(10.5, 10); g.stroke(); // 바늘
      disc(8, 9, 1, "#c0392b");
    } else if (kind === "arcade") {
      R(3, 12, 10, 3, "#5a4a6a"); R(3, 12, 10, 1, "#7a6a8a");     // 베이스
      R(7, 5, 2, 7, "#8a7a9a");                                    // 스틱
      disc(8, 4, 2.4, "#e0492c"); R(7, 3, 1, 1, "#ff9a7a");        // 빨간 공
      R(3, 9, 2, 2, "#ffd23f"); R(11, 9, 2, 2, "#4aa0ee");         // 버튼
    }
  }

  // ============================================================
  //  그림판
  // ============================================================
  function initPaint() {
    pcv = document.getElementById("paint-canvas");
    if (!pcv) return;
    pctx = pcv.getContext("2d"); pctx.lineCap = "round"; pctx.lineJoin = "round";
    clearPaint(false); restorePaint(); pReady = true;
    // 색상 팔레트
    const wrap = document.getElementById("paint-colors");
    PAINT_COLORS.forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "pc-sw" + (i === 0 ? " on" : ""); b.style.background = c; b.title = c;
      b.addEventListener("click", () => {
        pColor = c; pErase = false;
        document.getElementById("paint-eraser").classList.remove("on");
        wrap.querySelectorAll(".pc-sw").forEach((s) => s.classList.toggle("on", s === b));
        window.Audio2.click(560);
      });
      wrap.appendChild(b);
    });
    // 굵기
    document.getElementById("paint-sizes").addEventListener("click", (e) => {
      const b = e.target.closest(".pt-size"); if (!b) return;
      pSize = +b.dataset.size;
      document.querySelectorAll("#paint-sizes .pt-size").forEach((s) => s.classList.toggle("on", s === b));
      window.Audio2.click(520);
    });
    document.getElementById("paint-eraser").addEventListener("click", (e) => {
      pErase = !pErase; e.currentTarget.classList.toggle("on", pErase);
      if (pErase) document.querySelectorAll("#paint-colors .pc-sw").forEach((s) => s.classList.remove("on"));
      window.Audio2.click(500);
    });
    document.getElementById("paint-clear").addEventListener("click", () => { clearPaint(true); window.Audio2.click(300); });
    document.getElementById("paint-save").addEventListener("click", savePaintDownload);
    // 그리기 (포인터 = 마우스/터치 공용)
    pcv.addEventListener("pointerdown", pStart);
    window.addEventListener("pointermove", pMove);
    window.addEventListener("pointerup", pEnd);
  }
  function openPaint() { if (!pReady) initPaint(); }
  function pPos(e) { const r = pcv.getBoundingClientRect(); return { x: (e.clientX - r.left) * pcv.width / r.width, y: (e.clientY - r.top) * pcv.height / r.height }; }
  function pStroke() { return pErase ? pSize * 2.4 : pSize; }
  function pDot(p) { pctx.fillStyle = pErase ? PAINT_BG : pColor; pctx.beginPath(); pctx.arc(p.x, p.y, pStroke() / 2, 0, 7); pctx.fill(); }
  function pStart(e) { pDrawing = true; pLast = pPos(e); pDot(pLast); e.preventDefault(); }
  function pMove(e) {
    if (!pDrawing) return; const p = pPos(e);
    pctx.strokeStyle = pErase ? PAINT_BG : pColor; pctx.lineWidth = pStroke();
    pctx.beginPath(); pctx.moveTo(pLast.x, pLast.y); pctx.lineTo(p.x, p.y); pctx.stroke(); pLast = p;
  }
  function pEnd() { if (pDrawing) { pDrawing = false; persistPaint(); } }
  function clearPaint(persist) { pctx.fillStyle = PAINT_BG; pctx.fillRect(0, 0, pcv.width, pcv.height); if (persist) persistPaint(); }
  function persistPaint() { try { localStorage.setItem(PAINT_KEY, pcv.toDataURL("image/png")); } catch (e) {} }
  function restorePaint() { try { const d = localStorage.getItem(PAINT_KEY); if (d) { const img = new Image(); img.onload = () => pctx.drawImage(img, 0, 0); img.src = d; } } catch (e) {} }
  function savePaintDownload() { try { const a = document.createElement("a"); a.download = "버블랜드-그림.png"; a.href = pcv.toDataURL("image/png"); a.click(); window.Audio2.click(720); } catch (e) {} }

  // ============================================================
  //  타이머 (일반 카운트다운 + 열공 스톱워치)
  // ============================================================
  function fmtHMS(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  function fmtDur(sec) {   // "1시간 23분 5초" (사람이 읽기 좋게)
    sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    let out = ""; if (h) out += h + "시간 "; if (m) out += m + "분 "; if (s || !out) out += s + "초"; return out.trim();
  }
  function initTimer() {
    if (tmReady || !document.getElementById("win-timer")) return; tmReady = true;
    // 모드 탭
    document.querySelectorAll(".tm-tab").forEach((b) => b.addEventListener("click", () => setTimerMode(b.dataset.mode)));
    // 일반: 시/분 조절
    document.getElementById("tm-setup").addEventListener("click", (e) => {
      const b = e.target.closest(".tm-btn"); if (!b || tmRun) return;
      let h = Math.floor(tmTotal / 3600), m = Math.floor((tmTotal % 3600) / 60);
      if (b.dataset.h) h += +b.dataset.h; if (b.dataset.m) m += +b.dataset.m;
      if (m >= 60) { h++; m -= 60; } if (m < 0) { h--; m += 60; }
      let tot = h * 3600 + m * 60; tot = Math.max(0, Math.min(TM_MAX, tot));
      tmTotal = tot; tmLeft = tot; updateNormalUI(); window.Audio2.click(560);
    });
    // 벨소리 선택 (누르면 미리듣기)
    const bw = document.getElementById("tm-bell-opts");
    TM_BELLS.forEach((be, i) => {
      const b = document.createElement("button"); b.className = "tm-bell-btn" + (i === 0 ? " on" : ""); b.textContent = be.name; b.dataset.bell = be.id;
      b.addEventListener("click", () => { tmBell = be.id; bw.querySelectorAll(".tm-bell-btn").forEach((x) => x.classList.toggle("on", x === b)); window.Audio2.ensure(); window.Audio2.bell(be.id); });
      bw.appendChild(b);
    });
    document.getElementById("tm-start").addEventListener("click", startNormal);
    document.getElementById("tm-stop").addEventListener("click", stopNormal);
    document.getElementById("tm-reset").addEventListener("click", resetNormal);
    document.getElementById("tm-study-start").addEventListener("click", startStudy);
    document.getElementById("tm-study-pause").addEventListener("click", pauseStudy);
    document.getElementById("tm-study-stop").addEventListener("click", stopStudy);
    document.getElementById("tm-cheer").addEventListener("click", cheerRabbit);
    updateNormalUI(); renderStudyRecords();
  }
  function openTimer() { initTimer(); renderStudyRecords(); }
  // 응원 토끼 튀어나오기
  function cheerRabbit() {
    const r = document.getElementById("tm-rabbit"), b = document.getElementById("tm-rabbit-bubble"), holder = document.getElementById("tm-animal");
    if (!r) return;
    holder.innerHTML = animalSVG(ANIMALS[(Math.random() * ANIMALS.length) | 0]);   // 랜덤 동물
    b.textContent = CHEERS[(Math.random() * CHEERS.length) | 0];
    r.classList.remove("show"); void r.offsetWidth; r.classList.add("show");
    window.Audio2.ensure(); window.Audio2.blip(920); window.Audio2.blip(1150);   // 뾰롱 귀여운 소리
    clearTimeout(cheerT); cheerT = setTimeout(() => r.classList.remove("show"), 2700);
  }
  function setTimerMode(mode) {
    document.querySelectorAll(".tm-tab").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    document.getElementById("tm-normal").classList.toggle("hidden", mode !== "normal");
    document.getElementById("tm-study").classList.toggle("hidden", mode !== "study");
    window.Audio2.click(540);
  }
  // --- 일반 카운트다운 ---
  function updateNormalUI() {
    document.getElementById("tm-normal-disp").textContent = fmtHMS(tmLeft);
    document.getElementById("tm-h").textContent = Math.floor(tmTotal / 3600);
    document.getElementById("tm-m").textContent = Math.floor((tmTotal % 3600) / 60);
  }
  function startNormal() {
    if (tmRun || tmLeft <= 0) return;
    if (tmIv) { clearInterval(tmIv); tmIv = null; }   // 방어: 남은 인터벌 정리
    window.Audio2.ensure(); window.Audio2.click(700);
    tmRun = true; tmEnd = Date.now() + tmLeft * 1000;
    document.getElementById("tm-setup").classList.add("lock");
    document.getElementById("tm-normal-disp").classList.remove("ring");
    tmIv = setInterval(() => {
      tmLeft = (tmEnd - Date.now()) / 1000;
      if (tmLeft <= 0) { tmLeft = 0; updateNormalUI(); stopNormal(); document.getElementById("tm-normal-disp").classList.add("ring"); window.Audio2.bell(tmBell); }
      else updateNormalUI();
    }, 250);
  }
  function stopNormal() { tmRun = false; if (tmIv) clearInterval(tmIv); tmIv = null; document.getElementById("tm-setup").classList.remove("lock"); }
  function resetNormal() { stopNormal(); tmTotal = 0; tmLeft = 0; updateNormalUI(); document.getElementById("tm-normal-disp").classList.remove("ring"); window.Audio2.click(360); }
  // 창 닫기 / 컴퓨터 나가기 → 타이머 완전 정지 (진행 중이던 열공 세션은 기록 없이 폐기)
  function stopAllTimers() {
    stopNormal();
    if (tmStIv) { clearInterval(tmStIv); tmStIv = null; }
    tmStRun = false; tmStMs = 0;
    const sd = document.getElementById("tm-study-disp"); if (sd) { sd.textContent = "00:00:00"; sd.classList.remove("paused"); sd.style.color = ""; }
  }
  // --- 열공 스톱워치 ---
  function startStudy() {
    if (tmStRun) return;
    if (tmStIv) { clearInterval(tmStIv); tmStIv = null; }   // 방어: 남은 인터벌 정리
    window.Audio2.ensure(); window.Audio2.click(700);
    tmStRun = true; tmStBase = Date.now() - tmStMs;
    { const sd = document.getElementById("tm-study-disp"); sd.classList.remove("paused"); sd.style.color = ""; }   // 시작 = 파랑(CSS)
    tmStIv = setInterval(() => { tmStMs = Date.now() - tmStBase; document.getElementById("tm-study-disp").textContent = fmtHMS(tmStMs / 1000); }, 200);
  }
  function pauseStudy() {   // 휴식: 시간 동결(기록·리셋 없음) → 시작 누르면 이어서
    if (!tmStRun) return;
    tmStRun = false; if (tmStIv) { clearInterval(tmStIv); tmStIv = null; }
    { const sd = document.getElementById("tm-study-disp"); sd.classList.add("paused"); sd.style.color = "#97a3af"; }   // 휴식 = 회색
    window.Audio2.click(440);   // tmStMs 유지
  }
  function stopStudy() {
    if (tmStIv) { clearInterval(tmStIv); tmStIv = null; }   // 항상 인터벌부터 정리 (누수 방지)
    const secs = tmStMs / 1000;
    if (secs < 1) { tmStRun = false; tmStMs = 0; document.getElementById("tm-study-disp").textContent = "00:00:00"; return; }   // 멈춤은 무음
    tmStRun = false;
    saveStudySession(secs); renderStudyRecords(true);   // 멈춤 시 소리 없음
    tmStMs = 0; const sd2 = document.getElementById("tm-study-disp"); sd2.textContent = "00:00:00"; sd2.classList.remove("paused"); sd2.style.color = "";
  }
  function studyData() {
    let d = null; try { d = JSON.parse(localStorage.getItem(TM_KEY)); } catch (e) {}
    const today = window.App.todayStr();
    if (!d || d.date !== today) d = { date: today, sessions: [] };
    return d;
  }
  function saveStudySession(secs) { const d = studyData(); d.sessions.push(Math.round(secs)); try { localStorage.setItem(TM_KEY, JSON.stringify(d)); } catch (e) {} }
  function renderStudyRecords(flash) {
    const d = studyData(), s = d.sessions;
    const best = document.getElementById("tm-rec-best"), min = document.getElementById("tm-rec-min"), tot = document.getElementById("tm-rec-total"), cnt = document.getElementById("tm-rec-cnt");
    if (!s.length) { best.textContent = "기록 없음"; min.textContent = "기록 없음"; tot.textContent = "0분"; cnt.textContent = ""; }
    else {
      best.textContent = fmtDur(Math.max.apply(null, s));
      min.textContent = fmtDur(Math.min.apply(null, s));
      tot.textContent = fmtDur(s.reduce((a, b) => a + b, 0));
      cnt.textContent = "(" + s.length + "회)";
    }
    if (flash) { const box = document.querySelector(".tm-records"); box.classList.remove("pop"); void box.offsetWidth; box.classList.add("pop"); }
  }

  // ============================================================
  //  설정
  // ============================================================
  function syncSettings() {
    const s = window.App.state.settings;
    segSet("set-sfx", s.sfx !== false ? "on" : "off");
    segSet("set-music", s.music !== false ? "on" : "off");
    segSet("set-ambient", s.ambient !== false ? "on" : "off");
    segSet("set-font", s.font);
    segSet("set-wp", String(s.wallpaper));
    segSet("set-bright", s.brightness || "m");
  }
  function segSet(id, val) {
    document.getElementById(id).querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.v === val));
  }
  function applyWallpaper(n) {
    if (String(n) === "custom" && window.App.state.settings.customWp) {
      desktop.className = "desktop wp-custom";
      desktop.style.backgroundImage = "url(" + window.App.state.settings.customWp + ")";
    } else {
      desktop.className = "desktop wp-" + n;
      desktop.style.backgroundImage = "";
    }
  }
  function pickWallpaperFile() { document.getElementById("set-wp-file").click(); }
  function applyFont(f) { document.documentElement.style.setProperty("--font-scale", { s: 0.85, m: 1, l: 1.2 }[f] || 1); }

  function initSettings() {
    document.getElementById("set-sfx").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      window.App.state.settings.sfx = b.dataset.v === "on";
      segSet("set-sfx", b.dataset.v);
      window.App.applySettings();
      if (window.App.state.settings.sfx) { window.Audio2.ensure(); window.Audio2.refreshAmbient(); window.Audio2.click(600); }
      else window.Audio2.stopAmbient();
    });
    document.getElementById("set-music").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      window.App.state.settings.music = b.dataset.v === "on";
      segSet("set-music", b.dataset.v);
      window.App.applySettings();
      window.Audio2.ensure(); window.Audio2.syncMusic();
    });
    document.getElementById("set-ambient").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      window.App.state.settings.ambient = b.dataset.v === "on";
      segSet("set-ambient", b.dataset.v);
      window.App.applySettings();
      window.Audio2.ensure(); window.Audio2.refreshAmbient();   // 켜면 복원 · 끄면 정지
      window.Audio2.click(560);
    });
    document.getElementById("set-font").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      window.App.state.settings.font = b.dataset.v; segSet("set-font", b.dataset.v);
      applyFont(b.dataset.v); window.App.applySettings(); window.Audio2.click(560);
    });
    document.getElementById("set-wp").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const v = b.dataset.v;
      if (v === "custom" && !window.App.state.settings.customWp) { pickWallpaperFile(); return; }   // 사진 없으면 바로 고르기
      window.App.state.settings.wallpaper = v; segSet("set-wp", v);
      applyWallpaper(v); window.App.applySettings(); window.Audio2.click(500);
    });
    // 배경화면: 내 사진 불러오기 (축소 후 저장)
    document.getElementById("set-wp-pick").addEventListener("click", pickWallpaperFile);
    document.getElementById("set-wp-file").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0]; e.target.value = ""; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxW = 1280; let w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          let data; try { data = c.toDataURL("image/jpeg", 0.82); } catch (err) { data = reader.result; }
          try { window.App.state.settings.customWp = data; window.App.state.settings.wallpaper = "custom"; window.App.save(); }
          catch (err) { alert("이미지가 너무 커서 저장할 수 없어요 😢 더 작은 사진을 골라봐요!"); return; }
          applyWallpaper("custom"); segSet("set-wp", "custom"); window.Audio2.click(660);
        };
        img.onerror = () => alert("이미지를 불러오지 못했어요 😢");
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    document.getElementById("set-wp-clear").addEventListener("click", () => {
      window.App.state.settings.customWp = null;
      if (String(window.App.state.settings.wallpaper) === "custom") { window.App.state.settings.wallpaper = "0"; applyWallpaper("0"); segSet("set-wp", "0"); }
      window.App.save(); window.Audio2.click(360);
    });
    document.getElementById("set-bright").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      window.App.state.settings.brightness = b.dataset.v; segSet("set-bright", b.dataset.v);
      window.App.applySettings(); window.Audio2.click(520);
    });
  }

  // ============================================================
  //  시계
  // ============================================================
  function tick() {
    const d = new Date();
    clockEl.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // ============================================================
  //  공개 API
  // ============================================================
  window.Computer = {
    init() {
      desktop = document.getElementById("desktop");
      clockEl = document.getElementById("os-clock");
      diaryText = document.getElementById("diary-text");
      diaryList = document.getElementById("diary-list");
      diaryDate = document.getElementById("diary-date");
      diaryStatus = document.getElementById("diary-status");
      diaryReply = document.getElementById("diary-reply");
      diaryReplyText = document.getElementById("diary-reply-text");

      // 아이콘
      document.querySelectorAll(".desk-icon").forEach((ic) => {
        ic.addEventListener("click", () => {
          const app = ic.dataset.app;
          if (app === "exit") { window.Arcade.close(); window.Main.showRoom(); return; }
          openWin(app);
        });
      });
      // 창 닫기 X
      document.querySelectorAll(".os-x").forEach((x) => x.addEventListener("click", () => closeWin(x.dataset.close)));
      // 다이어리 저장 + 기분 선택 + 친구 코멘트
      document.getElementById("diary-save").addEventListener("click", saveDiary);
      document.getElementById("diary-comment").addEventListener("click", () => {
        diaryReplyText.textContent = friendComment(diaryText.value, selectedMood);
        diaryReply.classList.remove("hidden");
        window.Audio2.click(660);
      });
      // 쓰레기통 드롭 → 삭제
      const trash = document.getElementById("diary-trash");
      trash.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; trash.classList.add("over"); });
      trash.addEventListener("dragleave", () => trash.classList.remove("over"));
      trash.addEventListener("drop", (e) => {
        e.preventDefault(); trash.classList.remove("over");
        const idx = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (!isNaN(idx) && window.App.state.diary[idx] !== undefined) {
          window.App.state.diary.splice(idx, 1); window.App.save(); refreshDiary(); window.Audio2.click(300);
        }
      });
      document.getElementById("mood-row").addEventListener("click", (e) => { const b = e.target.closest(".mood-btn"); if (b) { selectMood(b.dataset.mood); window.Audio2.click(620); } });
      // 픽셀 아이콘 그리기
      document.querySelectorAll(".di-canvas").forEach((cv) => drawIcon(cv, cv.dataset.icon));
      window.Arcade.init();
      // 그림판
      initPaint();
      // 타이머
      initTimer();
      // 시작 버튼
      document.getElementById("os-start").addEventListener("click", () => window.Audio2.click(700));
      initSettings();

      // 초기 설정 반영
      applyWallpaper(window.App.state.settings.wallpaper);
      applyFont(window.App.state.settings.font);

      tick(); setInterval(tick, 1000);
    },
    // 화면 진입/이탈
    enter() {
      window.Audio2.setAmbient("water");
      // 진입 시 바탕화면·아이콘 항상 다시 반영 (아이콘 사라짐 방지)
      applyWallpaper(window.App.state.settings.wallpaper);
      document.querySelectorAll(".di-canvas").forEach((cv) => drawIcon(cv, cv.dataset.icon));
    },
    leave() { if (window.Arcade) window.Arcade.close(); stopAllTimers(); },
  };
})();
