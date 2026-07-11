/* ============================================================
   방 꾸미기 아이템 — window.Decor
   상점에서 코인으로 사고, 방 캔버스에 배치/이동/숨김
   각 draw(g,x,y): (x,y)=바닥 기준 앵커, 320x180 방 좌표
   ============================================================ */
(function () {
  "use strict";
  function P(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); }

  const ITEMS = [
    {
      id: "cactus", name: "선인장", price: 15, def: { x: 210, y: 150 },
      draw(g, x, y) {
        P(g, x - 5, y - 6, 10, 6, "#d98a5a"); P(g, x - 5, y - 6, 10, 2, "#e8a878");   // 화분
        P(g, x - 3, y - 18, 6, 12, "#4bae5a"); P(g, x - 2, y - 17, 2, 10, "#6ec97a"); // 몸통
        P(g, x - 7, y - 16, 3, 6, "#4bae5a"); P(g, x + 4, y - 18, 3, 7, "#4bae5a");    // 팔
        P(g, x - 1, y - 21, 4, 3, "#ff7aa0"); P(g, x, y - 20, 2, 1, "#ffd23f");        // 꽃
      },
    },
    {
      id: "bear", name: "곰인형", price: 30, def: { x: 252, y: 152 },
      draw(g, x, y) {
        P(g, x - 5, y - 10, 10, 10, "#b07a4a"); P(g, x - 3, y - 8, 6, 7, "#c99a6a");   // 몸+배
        P(g, x - 5, y - 18, 10, 9, "#b07a4a"); P(g, x - 6, y - 19, 3, 3, "#8a5a30"); P(g, x + 3, y - 19, 3, 3, "#8a5a30"); // 머리+귀
        P(g, x - 3, y - 15, 1, 1, "#2b2b2b"); P(g, x + 2, y - 15, 1, 1, "#2b2b2b"); P(g, x - 1, y - 13, 2, 1, "#2b2b2b"); // 얼굴
        P(g, x - 7, y - 8, 3, 4, "#8a5a30"); P(g, x + 4, y - 8, 3, 4, "#8a5a30");       // 팔
      },
    },
    {
      id: "frame", name: "액자", price: 20, def: { x: 42, y: 150 },
      draw(g, x, y) {
        P(g, x - 8, y - 16, 16, 16, "#8a5a30"); P(g, x - 6, y - 14, 12, 12, "#f4ecd8"); // 프레임
        P(g, x - 5, y - 13, 10, 6, "#8fd0f5"); P(g, x - 5, y - 7, 10, 4, "#6fbf4a");     // 풍경
        P(g, x + 2, y - 12, 2, 2, "#ffe680"); P(g, x - 1, y, 2, 3, "#6e4522");           // 해+받침
      },
    },
    {
      id: "rug", name: "러그", price: 25, def: { x: 160, y: 166 },
      draw(g, x, y) {
        g.fillStyle = "#c98a9a"; g.beginPath(); g.ellipse(x, y, 18, 6, 0, 0, 7); g.fill();
        g.fillStyle = "#e0a7b4"; g.beginPath(); g.ellipse(x, y, 13, 4, 0, 0, 7); g.fill();
        g.fillStyle = "#f2c9d4"; g.beginPath(); g.ellipse(x, y, 7, 2, 0, 0, 7); g.fill();
      },
    },
    {
      id: "moodlamp", name: "무드등", price: 35, def: { x: 292, y: 150 },
      draw(g, x, y) {
        const gr = g.createRadialGradient(x, y - 14, 2, x, y - 14, 16);
        gr.addColorStop(0, "rgba(255,220,150,0.5)"); gr.addColorStop(1, "rgba(255,220,150,0)");
        g.fillStyle = gr; g.fillRect(x - 16, y - 30, 32, 32);
        P(g, x - 6, y - 20, 12, 8, "#ffd98a"); P(g, x - 6, y - 20, 12, 2, "#ffe9b8");     // 갓
        P(g, x - 1, y - 12, 2, 10, "#b8925a"); P(g, x - 4, y - 2, 8, 2, "#8a6a3a");        // 기둥+받침
      },
    },
    {
      id: "plush_cat", name: "고양이 인형", price: 30, def: { x: 118, y: 158 },
      draw(g, x, y) {
        P(g, x - 5, y - 9, 10, 9, "#f2f2f2"); P(g, x - 5, y - 16, 10, 8, "#f2f2f2");       // 몸+머리
        P(g, x - 5, y - 18, 3, 3, "#f2f2f2"); P(g, x + 2, y - 18, 3, 3, "#f2f2f2");         // 귀
        P(g, x - 4, y - 17, 1, 1, "#ffb3c6"); P(g, x + 3, y - 17, 1, 1, "#ffb3c6");
        P(g, x - 3, y - 13, 1, 1, "#2b2b2b"); P(g, x + 2, y - 13, 1, 1, "#2b2b2b"); P(g, x - 1, y - 12, 2, 1, "#ffb3c6");
        P(g, x + 5, y - 6, 4, 2, "#d8d8d8");
      },
    },
    {
      id: "balloon", name: "풍선", price: 15, def: { x: 68, y: 74 },
      draw(g, x, y) {
        g.strokeStyle = "#aab"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 9); g.stroke();
        g.fillStyle = "#ff6f91"; g.beginPath(); g.ellipse(x, y - 16, 7, 9, 0, 0, 7); g.fill();
        P(g, x - 3, y - 20, 2, 3, "rgba(255,255,255,0.55)");
        g.fillStyle = "#ff6f91"; g.beginPath(); g.moveTo(x - 2, y - 8); g.lineTo(x + 2, y - 8); g.lineTo(x, y - 6); g.closePath(); g.fill();
      },
    },
    {
      id: "garland", name: "전구 가랜드", price: 40, def: { x: 160, y: 34 },
      draw(g, x, y) {
        g.strokeStyle = "#6a5a3a"; g.lineWidth = 1; g.beginPath();
        for (let i = 0; i <= 6; i++) { const px = x - 24 + i * 8, py = y + Math.sin(i) * 2; if (i === 0) g.moveTo(px, py); else g.quadraticCurveTo(px - 4, py + 3, px, py); } g.stroke();
        const cols = ["#ff6f6f", "#ffd23f", "#7ad07a", "#5ac8eb", "#c98ae0", "#ff9ab0", "#ffb45a"];
        for (let i = 0; i < 7; i++) { P(g, x - 25 + i * 8, y + 3, 2, 3, cols[i]); }
      },
    },
    {
      id: "rug2", name: "동그란 러그", price: 22, def: { x: 200, y: 166 },
      draw(g, x, y) {
        g.fillStyle = "#6fa8c4"; g.beginPath(); g.ellipse(x, y, 42, 11, 0, 0, 7); g.fill();
        g.fillStyle = "#8fc4dc"; g.beginPath(); g.ellipse(x, y, 32, 8, 0, 0, 7); g.fill();
        g.fillStyle = "#b6ddef"; g.beginPath(); g.ellipse(x, y, 20, 5, 0, 0, 7); g.fill();
        g.fillStyle = "#d8eef8"; g.beginPath(); g.ellipse(x, y, 8, 2, 0, 0, 7); g.fill();
      },
    },
    {
      id: "poster", name: "포스터", price: 18, def: { x: 62, y: 66 },
      draw(g, x, y) {
        P(g, x - 8, y - 20, 16, 20, "#f4ecd8"); P(g, x - 8, y - 20, 16, 2, "#d8cdb2");
        P(g, x - 6, y - 17, 12, 8, "#8fd0f5"); P(g, x - 6, y - 9, 12, 5, "#6fbf4a"); P(g, x + 2, y - 15, 2, 2, "#ffe680");
        P(g, x - 6, y - 3, 12, 2, "#c98ae0");
      },
    },
    {
      id: "cushion", name: "쿠션", price: 14, def: { x: 252, y: 162 },
      draw(g, x, y) {
        P(g, x - 9, y - 14, 18, 14, "#ff9ab8"); P(g, x - 9, y - 14, 18, 3, "#ffbdd2");
        P(g, x - 1, y - 8, 2, 2, "#ff7aa0");
        P(g, x - 10, y - 14, 2, 2, "#ffd0e0"); P(g, x + 8, y - 14, 2, 2, "#ffd0e0"); P(g, x - 10, y - 2, 2, 2, "#ffd0e0"); P(g, x + 8, y - 2, 2, 2, "#ffd0e0");
      },
    },
    {
      id: "vase", name: "꽃병", price: 24, def: { x: 118, y: 150 },
      draw(g, x, y) {
        g.fillStyle = "#7ec9c0"; g.beginPath(); g.moveTo(x - 4, y - 10); g.quadraticCurveTo(x - 7, y, x - 4, y); g.lineTo(x + 4, y); g.quadraticCurveTo(x + 7, y, x + 4, y - 10); g.closePath(); g.fill();
        P(g, x - 4, y - 10, 3, 10, "#a0e0d8");
        g.strokeStyle = "#4a9e4a"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x, y - 22); g.moveTo(x, y - 14); g.lineTo(x - 5, y - 20); g.moveTo(x, y - 14); g.lineTo(x + 5, y - 19); g.stroke();
        P(g, x - 1, y - 24, 3, 3, "#ff7aa0"); P(g, x - 6, y - 22, 3, 3, "#ffd23f"); P(g, x + 4, y - 21, 3, 3, "#ff9ab8");
      },
    },
    {
      id: "wclock", name: "벽시계", price: 28, def: { x: 64, y: 46 },
      draw(g, x, y) {
        g.fillStyle = "#f4ecd8"; g.beginPath(); g.arc(x, y - 6, 7, 0, 7); g.fill(); g.strokeStyle = "#8a6a3a"; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = "#8a6a3a"; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; P(g, x + Math.cos(a) * 6 - 0.5, y - 6 + Math.sin(a) * 6 - 0.5, 1, 1, "#8a6a3a"); }
        g.strokeStyle = "#333"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x, y - 11); g.moveTo(x, y - 6); g.lineTo(x + 4, y - 6); g.stroke();
      },
    },

    // ===== 러그 (바닥) =====
    { id: "rug_bear", name: "곰 러그", price: 40, def: { x: 120, y: 166 },
      draw(g, x, y) {
        g.fillStyle = "#a9764a"; g.beginPath(); g.ellipse(x, y, 20, 8, 0, 0, 7); g.fill();
        g.fillStyle = "#c49a6a"; g.beginPath(); g.ellipse(x, y, 13, 5, 0, 0, 7); g.fill();
        for (const dx of [-15, -6, 6, 15]) { g.fillStyle = "#a9764a"; g.beginPath(); g.ellipse(x + dx, y + 4, 4, 3, 0, 0, 7); g.fill(); }   // 발
        g.fillStyle = "#a9764a"; g.beginPath(); g.arc(x, y - 9, 6, 0, 7); g.fill();
        g.beginPath(); g.arc(x - 5, y - 13, 2.6, 0, 7); g.fill(); g.beginPath(); g.arc(x + 5, y - 13, 2.6, 0, 7); g.fill();  // 귀
        P(g, x - 6, y - 10, 12, 4, "#c49a6a");
        P(g, x - 3, y - 10, 1, 1, "#2b2b2b"); P(g, x + 2, y - 10, 1, 1, "#2b2b2b"); P(g, x - 1, y - 8, 2, 1, "#2b2b2b");
      } },
    { id: "rug_giraffe", name: "기린 러그", price: 40, def: { x: 200, y: 166 },
      draw(g, x, y) {
        g.fillStyle = "#f0c85a"; g.beginPath(); g.ellipse(x, y, 20, 8, 0, 0, 7); g.fill();
        for (const dx of [-15, -6, 6, 15]) { g.fillStyle = "#f0c85a"; g.beginPath(); g.ellipse(x + dx, y + 4, 4, 3, 0, 0, 7); g.fill(); }
        g.fillStyle = "#c98a3a"; for (const s of [[-10, -1], [-2, 2], [6, -2], [12, 1], [2, -3]]) { g.beginPath(); g.arc(x + s[0], y + s[1], 2.3, 0, 7); g.fill(); }
        P(g, x - 1, y - 15, 3, 9, "#f0c85a");                                          // 목
        g.fillStyle = "#f0c85a"; g.beginPath(); g.ellipse(x + 1, y - 17, 4, 3, 0, 0, 7); g.fill();
        P(g, x - 1, y - 20, 1, 2, "#8a5a30"); P(g, x + 2, y - 20, 1, 2, "#8a5a30");     // 뿔
        P(g, x + 1, y - 17, 1, 1, "#2b2b2b");
      } },
    { id: "rug_dino", name: "공룡 러그", price: 45, def: { x: 160, y: 166 },
      draw(g, x, y) {
        g.fillStyle = "#6cbf4a"; g.beginPath(); g.ellipse(x, y, 20, 8, 0, 0, 7); g.fill();
        g.fillStyle = "#8ad066"; g.beginPath(); g.ellipse(x, y, 13, 5, 0, 0, 7); g.fill();
        for (const dx of [-14, 12]) { g.fillStyle = "#6cbf4a"; g.beginPath(); g.ellipse(x + dx, y + 4, 4, 3, 0, 0, 7); g.fill(); }
        g.fillStyle = "#4a9e3a"; for (const dx of [-8, -3, 2, 7]) { g.beginPath(); g.moveTo(x + dx - 2, y - 4); g.lineTo(x + dx, y - 9); g.lineTo(x + dx + 2, y - 4); g.closePath(); g.fill(); }  // 등가시
        g.fillStyle = "#6cbf4a"; g.beginPath(); g.arc(x - 16, y - 3, 5, 0, 7); g.fill();  // 머리
        P(g, x - 17, y - 4, 1, 1, "#2b2b2b");
      } },

    // ===== 식물 =====
    { id: "gerbera", name: "거베라", price: 22, def: { x: 210, y: 150 },
      draw(g, x, y) {
        P(g, x - 5, y - 7, 10, 7, "#e88f5a"); P(g, x - 5, y - 7, 10, 2, "#f2a875");
        P(g, x - 1, y - 15, 2, 8, "#4a9e3a");
        g.fillStyle = "#ff6f91"; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.beginPath(); g.ellipse(x + Math.cos(a) * 5, y - 19 + Math.sin(a) * 5, 2.4, 1.5, a, 0, 7); g.fill(); }
        g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(x, y - 19, 2.6, 0, 7); g.fill();
      } },
    { id: "tulip", name: "튤립", price: 20, def: { x: 118, y: 150 },
      draw(g, x, y) {
        P(g, x - 5, y - 7, 10, 7, "#7ec9c0"); P(g, x - 5, y - 7, 10, 2, "#a0e0d8");
        P(g, x - 3, y - 13, 2, 7, "#4a9e3a"); P(g, x + 1, y - 14, 2, 8, "#4a9e3a");
        P(g, x - 7, y - 11, 4, 2, "#57c97a"); P(g, x + 3, y - 12, 4, 2, "#57c97a");        // 잎
        g.fillStyle = "#f06f8f"; g.beginPath(); g.ellipse(x - 2, y - 17, 3, 4.5, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 2, y - 18, 3, 4.5, 0, 0, 7); g.fill();
        g.fillStyle = "#e85a7a"; g.beginPath(); g.ellipse(x, y - 17, 2.6, 5, 0, 0, 7); g.fill();
        P(g, x - 1, y - 22, 2, 2, "#ff9ab8");
      } },
    { id: "orange_tree", name: "오렌지나무", price: 35, def: { x: 292, y: 150 },
      draw(g, x, y) {
        P(g, x - 6, y - 6, 12, 6, "#c97a4a"); P(g, x - 6, y - 6, 12, 2, "#e2a06a");
        P(g, x - 1, y - 14, 3, 8, "#8a5a30");
        g.fillStyle = "#3ba55a"; g.beginPath(); g.arc(x, y - 20, 8, 0, 7); g.fill();
        g.fillStyle = "#57c97a"; g.beginPath(); g.arc(x - 3, y - 22, 4, 0, 7); g.fill();
        g.fillStyle = "#ff9a3a"; for (const o of [[-4, -18], [3, -20], [-1, -24], [5, -16]]) { g.beginPath(); g.arc(x + o[0], y + o[1], 2, 0, 7); g.fill(); }
      } },

    // ===== 벽 장식 =====
    { id: "mirror", name: "거울", price: 26, def: { x: 62, y: 70 },
      draw(g, x, y) {
        g.fillStyle = "#c9a86a"; g.beginPath(); g.ellipse(x, y - 12, 9, 13, 0, 0, 7); g.fill();
        g.fillStyle = "#dff2fb"; g.beginPath(); g.ellipse(x, y - 12, 6.5, 10.5, 0, 0, 7); g.fill();
        g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.moveTo(x - 4, y - 18); g.lineTo(x - 1, y - 18); g.lineTo(x - 4, y - 8); g.closePath(); g.fill();
        P(g, x - 2, y - 1, 4, 2, "#a5763e");
      } },
    { id: "lark_clock", name: "종달새 시계", price: 32, def: { x: 160, y: 40 },
      draw(g, x, y) {
        P(g, x - 9, y - 8, 18, 14, "#8a5a30"); P(g, x - 9, y - 8, 18, 2, "#a4764c");
        g.fillStyle = "#6e4522"; g.beginPath(); g.moveTo(x - 11, y - 8); g.lineTo(x, y - 16); g.lineTo(x + 11, y - 8); g.closePath(); g.fill();
        g.fillStyle = "#f4ecd8"; g.beginPath(); g.arc(x, y - 1, 5, 0, 7); g.fill();
        g.strokeStyle = "#333"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - 1); g.lineTo(x, y - 4); g.moveTo(x, y - 1); g.lineTo(x + 3, y - 1); g.stroke();
        P(g, x - 2, y - 11, 4, 3, "#ffd23f"); P(g, x + 2, y - 12, 2, 1, "#e0a020"); P(g, x + 2, y - 10, 1, 1, "#2b2b2b");   // 종달새
        P(g, x - 4, y + 6, 2, 3, "#c9a94a"); P(g, x + 3, y + 6, 2, 3, "#c9a94a");   // 추
      } },

    // ===== 장난감 (말랑이는 눌러서 쫀득! ) =====
    { id: "console", name: "게임기", price: 30, def: { x: 250, y: 158 },
      draw(g, x, y) {
        P(g, x - 7, y - 12, 14, 12, "#a9b6c4"); P(g, x - 7, y - 12, 14, 2, "#c2cdd8");
        P(g, x - 5, y - 10, 10, 6, "#2a3a2e"); P(g, x - 4, y - 9, 8, 4, "#7CFC98");
        P(g, x - 5, y - 3, 2, 2, "#3a4a58"); P(g, x + 3, y - 3, 2, 2, "#e0492c"); P(g, x + 1, y - 2, 2, 2, "#4aa0ee");
      } },
    { id: "squish_dumpling", name: "만두 말랑이", price: 18, squishy: true, def: { x: 118, y: 158 },
      draw(g, x, y) {
        g.fillStyle = "#f2e6c8"; g.beginPath(); g.ellipse(x, y - 5, 9, 6, 0, 0, 7); g.fill();
        g.fillStyle = "#e6d5aa"; g.beginPath(); g.ellipse(x, y - 2, 9, 3, 0, 0, 7); g.fill();
        g.strokeStyle = "#d8c398"; g.lineWidth = 1; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * 3, y - 9); g.lineTo(x + i * 3, y - 6); g.stroke(); }
        P(g, x - 3, y - 5, 1, 1, "#3a2a1a"); P(g, x + 2, y - 5, 1, 1, "#3a2a1a");
        P(g, x - 4, y - 4, 1, 1, "#ffb3c6"); P(g, x + 3, y - 4, 1, 1, "#ffb3c6");
      } },
    { id: "squish_butter", name: "버터 말랑이", price: 16, squishy: true, def: { x: 210, y: 158 },
      draw(g, x, y) {
        P(g, x - 9, y - 8, 18, 8, "#ffe27a"); P(g, x - 9, y - 8, 18, 2, "#fff0b0"); P(g, x - 9, y - 2, 18, 2, "#e8c860");
        P(g, x - 4, y - 6, 1, 1, "#7a5a2a"); P(g, x + 3, y - 6, 1, 1, "#7a5a2a"); P(g, x, y - 4, 1, 1, "#e0902a");
      } },
    { id: "squish_soap", name: "비누 말랑이", price: 16, squishy: true, def: { x: 68, y: 158 },
      draw(g, x, y) {
        P(g, x - 9, y - 8, 18, 8, "#a9dcef"); P(g, x - 9, y - 8, 18, 2, "#cdeefa"); P(g, x - 8, y - 3, 16, 1, "#8ac4e0");
        g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.arc(x - 4, y - 5, 1.5, 0, 7); g.fill(); g.beginPath(); g.arc(x + 3, y - 6, 1, 0, 7); g.fill();
        P(g, x - 3, y - 5, 1, 1, "#3a5a68"); P(g, x + 2, y - 5, 1, 1, "#3a5a68");
      } },
    { id: "squish_lemon", name: "레몬 말랑이", price: 16, squishy: true, def: { x: 160, y: 158 },
      draw(g, x, y) {
        g.fillStyle = "#ffe14a"; g.beginPath(); g.ellipse(x, y - 5, 9, 6, 0, 0, 7); g.fill();
        g.fillStyle = "#ffef8a"; g.beginPath(); g.ellipse(x - 2, y - 7, 4, 2.5, 0, 0, 7); g.fill();
        P(g, x - 11, y - 5, 2, 1, "#c9a020"); P(g, x + 9, y - 5, 2, 1, "#c9a020");
        P(g, x - 3, y - 5, 1, 1, "#7a5a10"); P(g, x + 2, y - 5, 1, 1, "#7a5a10");
        g.strokeStyle = "#7a5a10"; g.lineWidth = 0.6; g.beginPath(); g.arc(x, y - 3, 2, 0.2, 2.9); g.stroke();
      } },
  ];

  const CAT = { cactus: "plant", bear: "toy", frame: "wall", moodlamp: "furniture", plush_cat: "toy", balloon: "toy", garland: "wall", rug: "floor", rug2: "floor", poster: "wall", cushion: "furniture", vase: "plant", wclock: "wall",
    rug_bear: "floor", rug_giraffe: "floor", rug_dino: "floor", gerbera: "plant", tulip: "plant", orange_tree: "plant", mirror: "wall", lark_clock: "wall",
    console: "toy", squish_dumpling: "toy", squish_butter: "toy", squish_soap: "toy", squish_lemon: "toy" };
  ITEMS.forEach((it) => (it.cat = CAT[it.id] || "furniture"));
  const map = {}; ITEMS.forEach((it) => (map[it.id] = it));
  window.Decor = { ITEMS, byId: (id) => map[id] };
})();
