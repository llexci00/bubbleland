/* ============================================================
   음식 픽셀 도감 — window.Foods
   한식20 · 일식20 · 중식20 · 양식20 = 80종
   32x32 캔버스에 픽셀로 그림 (scaled + pixelated)
   ============================================================ */
(function () {
  "use strict";

  // ---- 공통 픽셀 헬퍼 ----
  function P(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function disc(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  function dots(g, list, c) { g.fillStyle = c; for (const d of list) g.fillRect(d[0], d[1], d[2] || 1, d[3] || 1); }
  function mound(g, cx, cy, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.moveTo(cx - rx, cy); g.quadraticCurveTo(cx, cy - ry * 2, cx + rx, cy); g.closePath(); g.fill(); }

  function plate(g, rim, top) {
    g.fillStyle = rim || "#dbe3ec"; g.beginPath(); g.ellipse(16, 24, 13, 4.6, 0, 0, 7); g.fill();
    g.fillStyle = top || "#ffffff"; g.beginPath(); g.ellipse(16, 23, 11, 3.6, 0, 0, 7); g.fill();
  }
  function bowl(g, rim, surface) {
    g.fillStyle = rim || "#e8edf3";
    g.beginPath(); g.moveTo(3, 15); g.lineTo(29, 15); g.quadraticCurveTo(28, 29, 16, 29); g.quadraticCurveTo(4, 29, 3, 15); g.closePath(); g.fill();
    P(g, 3, 15, 26, 1, "rgba(255,255,255,0.55)");
    if (surface) { g.fillStyle = surface; g.beginPath(); g.ellipse(16, 15, 12, 3, 0, 0, 7); g.fill(); }
  }
  function pot(g, surface) {
    g.fillStyle = "#3a3f47"; g.beginPath(); g.moveTo(2, 15); g.lineTo(30, 15); g.quadraticCurveTo(29, 30, 16, 30); g.quadraticCurveTo(3, 30, 2, 15); g.closePath(); g.fill();
    P(g, 0, 14, 4, 3, "#2a2e34"); P(g, 28, 14, 4, 3, "#2a2e34"); // 손잡이
    g.fillStyle = surface; g.beginPath(); g.ellipse(16, 15, 13, 3.3, 0, 0, 7); g.fill();
  }
  function steam(g) { P(g, 12, 3, 1, 4, "rgba(255,255,255,0.5)"); P(g, 16, 2, 1, 5, "rgba(255,255,255,0.55)"); P(g, 20, 3, 1, 4, "rgba(255,255,255,0.5)"); }

  // ============================================================
  //  템플릿
  // ============================================================
  const T = {
    // 밥+토핑 덮밥
    riceBowl(g, p) {
      bowl(g, p.bowl || "#eef3f8");
      mound(g, 16, 16, 11, 6, "#fbfaf3");          // 밥
      dots(g, [[9, 12], [13, 10], [19, 11], [22, 13]], "#efeade");
      if (p.top) { g.fillStyle = p.top; g.beginPath(); g.ellipse(16, 11, 8, 2.5, 0, 0, 7); g.fill(); }
      if (p.top2) dots(g, [[11, 10, 2, 2], [15, 9, 2, 2], [19, 10, 2, 2]], p.top2);
      dots(g, [[13, 9], [17, 8], [20, 10]], "#2b2b2b"); // 깨/김
    },
    // 맑은/진한 국
    soupBowl(g, p) {
      bowl(g, p.bowl || "#f0ece0", p.broth || "#e7c98a");
      dots(g, [[10, 14, 2, 1], [15, 13, 3, 1], [20, 15, 2, 1]], p.bits || "#cf9b5a");
      dots(g, [[12, 13], [18, 14], [22, 13]], "#3ba55a"); // 파
      if (p.meat) dots(g, [[13, 15, 3, 2], [18, 16, 3, 2]], p.meat);
      steam(g);
    },
    // 국물면
    noodleSoup(g, p) {
      bowl(g, p.bowl || "#eef2f7", p.broth || "#e8b45a");
      g.strokeStyle = p.noodle || "#f6e6a8"; g.lineWidth = 1;
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(16, 15, 8 + i, 0.2, Math.PI - 0.2); g.stroke(); }
      P(g, 8, 12, 4, 4, "#fff4d0"); disc(g, 10, 14, 2, "#ffd23f"); // 계란
      dots(g, [[20, 12, 2, 3]], "#2b2b2b"); // 김
      dots(g, [[15, 11], [19, 13], [22, 12]], "#3ba55a"); // 파
      if (p.top) dots(g, [[13, 12, 3, 2], [18, 11, 3, 2]], p.top);
      steam(g);
    },
    // 볶음면 (접시)
    stirNoodle(g, p) {
      plate(g);
      g.strokeStyle = p.noodle || "#e7c86a"; g.lineWidth = 1.4;
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(7 + i, 22); g.quadraticCurveTo(16, 15 + i, 25 - i, 22); g.stroke(); }
      dots(g, [[11, 19, 2, 2], [16, 18, 2, 2], [21, 19, 2, 2]], p.veg || "#e0492c");
      dots(g, [[13, 20], [19, 19]], "#3ba55a");
    },
    // 볶음밥
    friedRice(g, p) {
      plate(g); mound(g, 16, 22, 11, 5, p.rice || "#f2e6bf");
      dots(g, [[11, 19], [14, 20], [18, 19], [21, 21], [16, 18]], "#e0492c");
      dots(g, [[12, 21], [17, 20], [20, 19]], "#3ba55a");
      dots(g, [[15, 19], [19, 21]], "#ffd23f");
    },
    // 초밥(니기리)
    nigiri(g, p) {
      plate(g, "#cfd8e2", "#e9eef4");
      g.fillStyle = "#fbfaf3"; g.beginPath(); g.ellipse(16, 21, 9, 3.4, 0, 0, 7); g.fill();
      g.fillStyle = p.fish || "#ff8a5a"; g.beginPath(); g.ellipse(16, 18, 9, 2.6, 0, 0, 7); g.fill();
      if (p.fish === "#ff8a5a") dots(g, [[10, 18, 8, 1]], "#ffd0b0"); // 연어 무늬
      P(g, 13, 17, 6, 1, "rgba(255,255,255,0.4)");
    },
    // 사시미
    sashimi(g, p) {
      plate(g);
      for (let i = 0; i < 3; i++) { g.fillStyle = i === 1 ? (p.fish2 || "#ff8a5a") : (p.fish || "#ff6a6a"); g.beginPath(); g.ellipse(10 + i * 6, 20, 3.4, 2.2, 0.4, 0, 7); g.fill(); }
      dots(g, [[22, 19, 2, 3]], "#4bb15f"); // 고추냉이 잎
    },
    // 김밥/롤 (슬라이스)
    rollRice(g, p) {
      plate(g);
      for (let i = 0; i < 3; i++) {
        const x = 9 + i * 7;
        disc(g, x, 20, 4, "#2b2b2b");            // 김
        disc(g, x, 20, 3, "#fbfaf3");            // 밥
        disc(g, x, 20, 1.4, p.fill || "#e0a94c"); // 속
        if (p.fill2) { g.fillStyle = p.fill2; g.fillRect(x - 1, 19, 1, 2); }
      }
    },
    // 오니기리
    onigiri(g) {
      plate(g);
      g.fillStyle = "#fbfaf3"; g.beginPath(); g.moveTo(16, 12); g.lineTo(25, 25); g.lineTo(7, 25); g.closePath(); g.fill();
      P(g, 11, 22, 10, 4, "#2b2b2b"); // 김
      dots(g, [[15, 16], [17, 18]], "#e0492c");
    },
    // 만두
    dumplings(g, p) {
      plate(g);
      const skin = p.skin || "#f3ead2";
      for (let i = 0; i < 3; i++) { const x = 9 + i * 7; g.fillStyle = skin; g.beginPath(); g.ellipse(x, 21, 3.6, 2.6, 0, 0, 7); g.fill(); dots(g, [[x - 2, 19], [x, 18], [x + 2, 19]], "#d8cba8"); }
      if (p.fried) P(g, 6, 23, 20, 1, "#c98a3a");
    },
    // 스프링롤/춘권/튀김롤
    springroll(g, p) {
      plate(g);
      for (let i = 0; i < 3; i++) { g.save(); g.translate(10 + i * 6, 21); g.rotate(-0.5); P(g, -2, -6, 4, 12, p.col || "#e0b466"); P(g, -2, -6, 4, 2, "#f0d69a"); g.restore(); }
    },
    // 타코야키/경단(공 3개 + 소스)
    balls(g, p) {
      plate(g);
      for (let i = 0; i < 3; i++) disc(g, 10 + i * 6, 20, 3, p.col || "#c98a4a");
      P(g, 8, 17, 16, 1, p.sauce || "#5a3a1a"); // 소스
      if (p.bonito) dots(g, [[11, 17], [17, 16], [21, 17]], "#f2c9a0");
    },
    // 구이 접시(불고기/삼겹살)
    grillPlate(g, p) {
      plate(g);
      for (let i = 0; i < 4; i++) { const x = 9 + i * 5, y = 20 + (i % 2); g.fillStyle = p.meat || "#8a4a2a"; g.beginPath(); g.ellipse(x, y, 3, 2, 0.3, 0, 7); g.fill(); if (p.fat) P(g, x - 2, y - 1, 4, 1, p.fat); }
      dots(g, [[13, 18], [19, 19]], "#3ba55a");
    },
    // 피자 조각
    pizza(g, p) {
      g.fillStyle = "#f2c869"; g.beginPath(); g.moveTo(16, 6); g.lineTo(27, 26); g.lineTo(5, 26); g.closePath(); g.fill();
      P(g, 5, 24, 22, 3, "#d9a24a"); // 크러스트 끝
      dots(g, [[13, 15, 3, 3], [18, 19, 3, 3], [15, 22, 2, 2]], p.top || "#d23a2a");
      dots(g, [[16, 12], [14, 18], [19, 16]], "#e8d98a"); // 치즈
    },
    // 버거
    burger(g) {
      mound(g, 16, 15, 10, 5, "#e7a95a"); dots(g, [[12, 11], [16, 10], [20, 11]], "#fff2c0"); // 참깨 번
      P(g, 6, 15, 20, 2, "#4bb15f"); // 상추
      P(g, 6, 17, 20, 3, "#7a4a2a"); // 패티
      P(g, 6, 20, 20, 1, "#ffd23f"); // 치즈
      mound(g, 16, 25, 10, 3, "#e0a054"); // 아래 번
    },
    // 샌드위치
    sandwich(g) {
      g.fillStyle = "#f3d79a"; g.beginPath(); g.moveTo(6, 24); g.lineTo(16, 8); g.lineTo(26, 24); g.closePath(); g.fill();
      P(g, 9, 19, 14, 2, "#4bb15f"); P(g, 10, 17, 12, 2, "#e0492c"); P(g, 11, 15, 10, 2, "#fff2c0");
    },
    // 튀김 커틀릿(돈카츠/탕수육)
    friedCutlet(g, p) {
      plate(g);
      for (let i = 0; i < 3; i++) { g.fillStyle = "#d9a24a"; g.beginPath(); g.ellipse(10 + i * 6, 20, 3.4, 2.6, 0.2, 0, 7); g.fill(); dots(g, [[9 + i * 6, 19], [11 + i * 6, 20]], "#b87a2a"); }
      if (p.sauce) P(g, 8, 18, 16, 1, p.sauce);
    },
    // 스테이크
    steak(g) {
      plate(g);
      g.fillStyle = "#6a3a24"; g.beginPath(); g.ellipse(14, 20, 6, 4, 0.2, 0, 7); g.fill();
      disc(g, 14, 20, 2, "#b5533a"); // 미디엄
      dots(g, [[20, 19, 2, 2], [23, 21, 2, 2]], "#3ba55a"); disc(g, 22, 19, 1.5, "#e0492c");
    },
    // 샐러드
    salad(g, p) {
      bowl(g, p.bowl || "#eef6ef");
      dots(g, [[9, 13, 3, 3], [13, 12, 3, 3], [17, 13, 3, 3], [21, 12, 3, 3], [15, 15, 3, 2]], "#4bb15f");
      disc(g, 12, 14, 1.5, "#e0492c"); disc(g, 20, 15, 1.5, "#e0492c"); disc(g, 16, 13, 1.3, "#ffb03a");
    },
    // 파스타
    pasta(g, p) {
      plate(g);
      g.strokeStyle = "#f0d878"; g.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(16, 20, 4 + i, 0.3, Math.PI - 0.3); g.stroke(); }
      g.fillStyle = p.sauce || "#d23a2a"; g.beginPath(); g.ellipse(16, 19, 8, 3, 0, 0, 7); g.fill();
      if (p.top) dots(g, [[12, 18, 2, 2], [19, 19, 2, 2]], p.top);
      dots(g, [[14, 17], [18, 18]], "#3ba55a");
    },
    // 카레라이스
    curryRice(g, p) {
      plate(g);
      g.fillStyle = "#fbfaf3"; g.beginPath(); g.ellipse(12, 21, 7, 3.4, 0, 0, 7); g.fill(); // 밥
      g.fillStyle = p.curry || "#b56a1e"; g.beginPath(); g.ellipse(20, 21, 7, 3.4, 0, 0, 7); g.fill(); // 카레
      dots(g, [[19, 20, 2, 2], [22, 22, 2, 2]], "#7a4a1a");
    },
    // 오믈렛/계란
    eggDish(g, p) {
      plate(g);
      g.fillStyle = p.egg || "#ffd257"; g.beginPath(); g.ellipse(16, 20, 9, 4, 0, 0, 7); g.fill();
      P(g, 10, 19, 12, 1, "#ffe58a");
      if (p.sauce) { g.strokeStyle = p.sauce; g.lineWidth = 1; g.beginPath(); g.moveTo(10, 20); g.lineTo(22, 20); g.stroke(); }
    },
    // 전골/훠궈
    hotpot(g, p) {
      pot(g, p.broth || "#d64027");
      dots(g, [[9, 13, 2, 2], [13, 14, 2, 2], [18, 13, 2, 2], [22, 14, 2, 2], [15, 12, 2, 2]], p.bits || "#e8e2d0");
      dots(g, [[11, 12], [17, 13], [21, 12]], "#3ba55a");
      dots(g, [[14, 14], [19, 14]], "#ffb03a");
      steam(g);
    },
    // 감자튀김
    fries(g) {
      P(g, 10, 18, 12, 12, "#e0492c"); P(g, 10, 18, 12, 2, "#c93a22"); // 케이스
      for (let i = 0; i < 5; i++) P(g, 9 + i * 2.6, 8 + (i % 2) * 2, 2, 12, "#f2c04a");
    },
    // 핫도그
    hotdog(g) {
      mound(g, 16, 20, 12, 4, "#e7b45a"); // 번
      P(g, 5, 18, 22, 3, "#c95a3a"); // 소시지
      g.strokeStyle = "#ffd23f"; g.lineWidth = 1; g.beginPath(); for (let x = 6; x < 26; x += 3) { g.moveTo(x, 17); g.lineTo(x + 1.5, 19); } g.stroke();
    },
    // 디저트(팬케이크/케이크)
    dessert(g, p) {
      plate(g);
      for (let i = 0; i < 3; i++) { g.fillStyle = p.col || "#e7b96a"; g.beginPath(); g.ellipse(16, 21 - i * 3, 8, 2.4, 0, 0, 7); g.fill(); }
      P(g, 12, 12, 8, 2, "#ffcf3a"); // 버터/시럽
      if (p.berry) disc(g, 16, 10, 1.6, p.berry);
    },
    // 전 (파전 등)
    jeon(g, p) {
      plate(g);
      g.fillStyle = p.col || "#e6b95a"; g.beginPath(); g.ellipse(16, 20, 10, 4, 0, 0, 7); g.fill();
      dots(g, [[11, 19, 3, 1], [16, 20, 4, 1], [20, 19, 3, 1]], "#3ba55a");
      dots(g, [[13, 20], [19, 21]], "#e0492c");
    },
    // 떡볶이
    tteok(g, p) {
      bowl(g, "#f0ece0", p.broth || "#e0492c");
      for (let i = 0; i < 4; i++) P(g, 8 + i * 4, 16 + (i % 2), 3, 6, "#f7f1e6"); // 떡
      P(g, 8, 16, 16, 6, "rgba(224,73,44,0.35)");
      dots(g, [[10, 15], [16, 16], [21, 15]], "#a52a1a");
    },
    // 타코/랩
    taco(g, p) {
      g.fillStyle = "#e7c06a"; g.beginPath(); g.arc(16, 22, 11, Math.PI, 0); g.fill(); // 쉘
      P(g, 6, 20, 20, 3, "#7a4a2a"); dots(g, [[9, 19], [13, 18], [18, 19], [22, 18]], "#4bb15f"); dots(g, [[11, 20], [20, 20]], "#e0492c");
    },
  };

  // ============================================================
  //  음식 목록 (80)
  // ============================================================
  const FOODS = [
    // ── 한식 20 ──
    { n: "김치찌개", c: "korean", t: "hotpot", p: { broth: "#d64027", bits: "#f0e6d0" } },
    { n: "된장찌개", c: "korean", t: "hotpot", p: { broth: "#b98a3a", bits: "#e8e2d0" } },
    { n: "비빔밥", c: "korean", t: "riceBowl", p: { top: "#e0492c", top2: "#3ba55a" } },
    { n: "불고기", c: "korean", t: "grillPlate", p: { meat: "#7a4526" } },
    { n: "삼겹살", c: "korean", t: "grillPlate", p: { meat: "#d98a7a", fat: "#f5e6df" } },
    { n: "김밥", c: "korean", t: "rollRice", p: { fill: "#e0a94c", fill2: "#e0492c" } },
    { n: "떡볶이", c: "korean", t: "tteok", p: {} },
    { n: "순두부찌개", c: "korean", t: "hotpot", p: { broth: "#e0532c", bits: "#fbfaf3" } },
    { n: "냉면", c: "korean", t: "noodleSoup", p: { broth: "#c9d2d8", noodle: "#d8cba8" } },
    { n: "갈비탕", c: "korean", t: "soupBowl", p: { broth: "#e9ddc4", meat: "#8a4a2a" } },
    { n: "제육볶음", c: "korean", t: "stirNoodle", p: { noodle: "#c94a2a", veg: "#e0492c" } },
    { n: "닭갈비", c: "korean", t: "grillPlate", p: { meat: "#c85a30" } },
    { n: "잡채", c: "korean", t: "stirNoodle", p: { noodle: "#b98a5a" } },
    { n: "부대찌개", c: "korean", t: "hotpot", p: { broth: "#d64027", bits: "#f0d0a0" } },
    { n: "감자탕", c: "korean", t: "hotpot", p: { broth: "#c14a2a", bits: "#e0c090" } },
    { n: "삼계탕", c: "korean", t: "soupBowl", p: { broth: "#f2eede", meat: "#e6dcc0" } },
    { n: "육개장", c: "korean", t: "hotpot", p: { broth: "#c9331e", bits: "#8a4a2a" } },
    { n: "파전", c: "korean", t: "jeon", p: { col: "#e6b95a" } },
    { n: "칼국수", c: "korean", t: "noodleSoup", p: { broth: "#eee3c9", noodle: "#f6efd6" } },
    { n: "돌솥비빔밥", c: "korean", t: "riceBowl", p: { bowl: "#5a5148", top: "#e0492c", top2: "#ffd23f" } },
    // ── 일식 20 ──
    { n: "초밥", c: "japanese", t: "nigiri", p: { fish: "#ff6a6a" } },
    { n: "연어초밥", c: "japanese", t: "nigiri", p: { fish: "#ff8a5a" } },
    { n: "라멘", c: "japanese", t: "noodleSoup", p: { broth: "#e0a850", top: "#c98a5a" } },
    { n: "우동", c: "japanese", t: "noodleSoup", p: { broth: "#e7d3a0", noodle: "#fbf6e6" } },
    { n: "소바", c: "japanese", t: "noodleSoup", p: { broth: "#cdd2d0", noodle: "#8a7a5a" } },
    { n: "규동", c: "japanese", t: "riceBowl", p: { top: "#8a5030" } },
    { n: "가츠동", c: "japanese", t: "riceBowl", p: { top: "#d9a24a", top2: "#ffd23f" } },
    { n: "텐동", c: "japanese", t: "riceBowl", p: { top: "#e0b466" } },
    { n: "오야코동", c: "japanese", t: "riceBowl", p: { top: "#ffd257", top2: "#e0a94c" } },
    { n: "돈카츠", c: "japanese", t: "friedCutlet", p: { sauce: "#5a3a1a" } },
    { n: "규카츠", c: "japanese", t: "friedCutlet", p: { sauce: "#7a4a2a" } },
    { n: "사시미", c: "japanese", t: "sashimi", p: { fish: "#ff6a6a", fish2: "#ff8a5a" } },
    { n: "오니기리", c: "japanese", t: "onigiri", p: {} },
    { n: "타코야키", c: "japanese", t: "balls", p: { col: "#c98a4a", sauce: "#5a3a1a", bonito: 1 } },
    { n: "오코노미야키", c: "japanese", t: "jeon", p: { col: "#c98a4a" } },
    { n: "야키소바", c: "japanese", t: "stirNoodle", p: { noodle: "#c98a4a" } },
    { n: "미소시루", c: "japanese", t: "soupBowl", p: { broth: "#c9955a", bits: "#e8e2d0" } },
    { n: "카레라이스", c: "japanese", t: "curryRice", p: { curry: "#a85e1e" } },
    { n: "텐푸라", c: "japanese", t: "friedCutlet", p: {} },
    { n: "나베", c: "japanese", t: "hotpot", p: { broth: "#e7d3a0", bits: "#fbfaf3" } },
    // ── 중식 20 ──
    { n: "짜장면", c: "chinese", t: "stirNoodle", p: { noodle: "#3a2e28", veg: "#5a4a3a" } },
    { n: "짬뽕", c: "chinese", t: "noodleSoup", p: { broth: "#d64027", top: "#e0492c" } },
    { n: "탕수육", c: "chinese", t: "friedCutlet", p: { sauce: "#d9542a" } },
    { n: "마파두부", c: "chinese", t: "hotpot", p: { broth: "#c9331e", bits: "#fbfaf3" } },
    { n: "유린기", c: "chinese", t: "friedCutlet", p: { sauce: "#7a9a2a" } },
    { n: "깐풍기", c: "chinese", t: "friedCutlet", p: { sauce: "#c9331e" } },
    { n: "볶음밥", c: "chinese", t: "friedRice", p: {} },
    { n: "양장피", c: "chinese", t: "salad", p: { bowl: "#eef2f7" } },
    { n: "팔보채", c: "chinese", t: "stirNoodle", p: { noodle: "#d9a24a", veg: "#3ba55a" } },
    { n: "마라탕", c: "chinese", t: "hotpot", p: { broth: "#b3241a", bits: "#e0c090" } },
    { n: "훠궈", c: "chinese", t: "hotpot", p: { broth: "#c9331e", bits: "#f0e6d0" } },
    { n: "딤섬", c: "chinese", t: "dumplings", p: { skin: "#f3ead2" } },
    { n: "샤오롱바오", c: "chinese", t: "dumplings", p: { skin: "#f6efdc" } },
    { n: "군만두", c: "chinese", t: "dumplings", p: { skin: "#e0b466", fried: 1 } },
    { n: "물만두", c: "chinese", t: "dumplings", p: { skin: "#eef2f7" } },
    { n: "춘권", c: "chinese", t: "springroll", p: { col: "#e0b466" } },
    { n: "마라샹궈", c: "chinese", t: "stirNoodle", p: { noodle: "#c9331e", veg: "#a52a1a" } },
    { n: "백짬뽕", c: "chinese", t: "noodleSoup", p: { broth: "#efe7d6", noodle: "#f6efd6" } },
    { n: "유산슬", c: "chinese", t: "stirNoodle", p: { noodle: "#b98a5a", veg: "#3ba55a" } },
    { n: "꿔바로우", c: "chinese", t: "friedCutlet", p: { sauce: "#d9542a" } },
    // ── 양식 20 ──
    { n: "피자", c: "western", t: "pizza", p: { top: "#d23a2a" } },
    { n: "토마토파스타", c: "western", t: "pasta", p: { sauce: "#d23a2a" } },
    { n: "크림파스타", c: "western", t: "pasta", p: { sauce: "#f2ead2", top: "#3ba55a" } },
    { n: "스테이크", c: "western", t: "steak", p: {} },
    { n: "햄버거", c: "western", t: "burger", p: {} },
    { n: "샌드위치", c: "western", t: "sandwich", p: {} },
    { n: "샐러드", c: "western", t: "salad", p: {} },
    { n: "리조또", c: "western", t: "riceBowl", p: { bowl: "#eef2f7", top: "#f2ead2" } },
    { n: "오믈렛", c: "western", t: "eggDish", p: { sauce: "#d23a2a" } },
    { n: "라자냐", c: "western", t: "pasta", p: { sauce: "#c14a2a", top: "#ffd23f" } },
    { n: "타코", c: "western", t: "taco", p: {} },
    { n: "부리토", c: "western", t: "springroll", p: { col: "#e7c06a" } },
    { n: "감자튀김", c: "western", t: "fries", p: {} },
    { n: "프라이드치킨", c: "western", t: "friedCutlet", p: {} },
    { n: "핫도그", c: "western", t: "hotdog", p: {} },
    { n: "팬케이크", c: "western", t: "dessert", p: { col: "#e7b96a", berry: "#e0492c" } },
    { n: "리소토", c: "western", t: "riceBowl", p: { bowl: "#f0ece0", top: "#ffd23f" } },
    { n: "뇨끼", c: "western", t: "pasta", p: { sauce: "#e8c95a", top: "#3ba55a" } },
    { n: "그라탕", c: "western", t: "eggDish", p: { egg: "#e8c96a", sauce: "#c14a2a" } },
    { n: "수프", c: "western", t: "soupBowl", p: { broth: "#e8b45a", bits: "#f0e6d0" } },
  ];

  function draw(cv, food) {
    const g = cv.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 32, 32);
    (T[food.t] || T.riceBowl)(g, food.p || {});
  }
  function random(cuisine) {
    const pool = cuisine && cuisine !== "all" ? FOODS.filter((f) => f.c === cuisine) : FOODS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  window.Foods = { FOODS, T, draw, random,
    label: { korean: "한식", japanese: "일식", chinese: "중식", western: "양식" } };
})();
