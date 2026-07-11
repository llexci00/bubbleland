/* ============================================================
   창문 하늘 엔진 — window.WindowSky
   시간에 따라 색이 "연속으로" 보간되어 낮→노을→밤이 자연스럽게 전환
   날씨(맑음/비/눈/무지개) 반영, 해·달은 부드럽게 페이드
   ============================================================ */
(function () {
  "use strict";

  function hourF() { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
  function hx(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lerp(a, b, f) { return a + (b - a) * f; }
  function mixA(A, B, f) { return [lerp(A[0], B[0], f), lerp(A[1], B[1], f), lerp(A[2], B[2], f)]; }         // 배열 보간
  function toRGB(a) { return `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`; }
  function mixHex(a, b, f) { return toRGB(mixA(hx(a), hx(b), f)); }                                          // hex 두 개 보간 (해/달 색용)
  function wrap(v, m) { return ((v % m) + m) % m; }
  function ramp(h, a, b) { return h <= a ? 0 : h >= b ? 1 : (h - a) / (b - a); }

  // 시간대별 하늘색 키프레임 [시각, 위쪽, 아래쪽]
  const STOPS = {
    sunny: [
      [0.0, "#0b1e40", "#22406e"], [5.0, "#0b1e40", "#22406e"],
      [6.2, "#2b3466", "#6a5a86"],          // 여명(보랏빛)
      [7.2, "#e0703a", "#ffcf9e"],          // 일출(주황·핑크)
      [8.6, "#57a0e0", "#d2ecff"],          // 아침
      [12.0, "#4aa6e6", "#bfe8ff"], [16.0, "#4aa6e6", "#bfe8ff"], // 한낮
      [17.6, "#e8944a", "#ffd7a6"],         // 금빛 오후
      [19.0, "#d55f38", "#ffb277"],         // 노을
      [20.2, "#5a3f70", "#9a6a86"],         // 땅거미
      [21.2, "#0b1e40", "#22406e"], [24.0, "#0b1e40", "#22406e"],
    ],
    rain: [
      [0.0, "#141c26", "#2b3946"], [6.0, "#141c26", "#2b3946"],
      [7.5, "#4a5560", "#7a8590"], [12.0, "#5a6a78", "#8a99a6"], [17.0, "#5a6a78", "#8a99a6"],
      [19.0, "#48454f", "#7a6f78"], [20.5, "#141c26", "#2b3946"], [24.0, "#141c26", "#2b3946"],
    ],
    snow: [
      [0.0, "#2a3242", "#4a5568"], [6.0, "#2a3242", "#4a5568"],
      [7.5, "#8a94a8", "#c2ccdc"], [12.0, "#9fb0c2", "#cdd9e6"], [17.0, "#9fb0c2", "#cdd9e6"],
      [19.0, "#8a8296", "#b8aec8"], [20.5, "#2a3242", "#4a5568"], [24.0, "#2a3242", "#4a5568"],
    ],
  };
  function skyColors(weather, h) {   // → [topRGBArr, botRGBArr]
    const key = (weather === "rainbow") ? "sunny" : (STOPS[weather] ? weather : "sunny");
    const s = STOPS[key];
    let i = 0; while (i < s.length - 2 && h >= s[i + 1][0]) i++;
    const f = (h - s[i][0]) / (s[i + 1][0] - s[i][0] || 1);
    return [mixA(hx(s[i][1]), hx(s[i + 1][1]), f), mixA(hx(s[i][2]), hx(s[i + 1][2]), f)];
  }

  function draw(g, r, weather, t) {
    const h = hourF();
    const [top, bot] = skyColors(weather, h);
    const bands = 8;
    for (let i = 0; i < bands; i++) { g.fillStyle = toRGB(mixA(top, bot, i / (bands - 1))); g.fillRect(r.x, Math.floor(r.y + r.h * i / bands), r.w, Math.ceil(r.h / bands) + 1); }

    g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
    const clear = (weather === "sunny" || weather === "rainbow");

    // 해/달 알파 (부드러운 교대)
    const sunA = ramp(h, 5.8, 7.3) * (1 - ramp(h, 18.2, 20.2));
    const moonA = h < 12 ? (1 - ramp(h, 4.6, 6.4)) : ramp(h, 19.3, 21.2);
    // 노을/여명 글로우
    const glow = Math.max(ramp(h, 6.0, 7.2) * (1 - ramp(h, 7.6, 9.0)), ramp(h, 17.0, 19.0) * (1 - ramp(h, 19.4, 20.6)));

    if (clear && glow > 0.01) {
      const grd = g.createLinearGradient(0, r.y + r.h * 0.35, 0, r.y + r.h);
      grd.addColorStop(0, "rgba(255,150,80,0)");
      grd.addColorStop(1, `rgba(255,120,80,${0.5 * glow})`);
      g.fillStyle = grd; g.fillRect(r.x, r.y, r.w, r.h);
    }
    if (clear) {
      if (moonA > 0.02) { g.globalAlpha = moonA; drawMoon(g, r, h); drawStars(g, r, t, moonA); g.globalAlpha = 1; }
      if (sunA > 0.02) { g.globalAlpha = sunA; drawSun(g, r, h); g.globalAlpha = 1; }
      // 구름 (낮일수록 진하게)
      if (sunA > 0.1) { g.globalAlpha = 0.35 + 0.6 * sunA; cloud(g, r.x + wrap(t * 0.15, r.w + 40) - 20, r.y + r.h * 0.18); cloud(g, r.x + wrap(t * 0.15 + r.w * 0.55, r.w + 40) - 20, r.y + r.h * 0.36); g.globalAlpha = 1; }
      // 새 (한낮)
      if (sunA > 0.7) { const bx = r.x + wrap(t * 0.3, r.w + 20) - 10, by = r.y + r.h * 0.28 + Math.sin(t * 0.05) * 3; bird(g, bx, by); bird(g, bx + 8, by + 4); }
      // 무지개
      if (weather === "rainbow" && sunA > 0.3) rainbow(g, r);
    }
    if (weather === "rain") rain(g, r, t); else if (weather === "snow") snow(g, r, t);
    g.restore();
  }

  function drawSun(g, r, h) {
    const frac = Math.max(0, Math.min(1, (h - 6) / 12));
    const x = r.x + r.w * (0.14 + 0.72 * frac), y = r.y + r.h * (0.66 - Math.sin(frac * Math.PI) * 0.5);
    const dayish = ramp(h, 7.6, 9.2) * (1 - ramp(h, 16.5, 18.2));   // 한낮이면 노랑, 아침저녁이면 주황
    g.fillStyle = "rgba(255,230,150,0.22)"; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
    g.fillStyle = mixHex("#ff9a4a", "#ffe680", dayish); g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
    g.fillStyle = mixHex("#ffd9a0", "#fff4c2", dayish); g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
  }
  function drawMoon(g, r, h) {
    const hn = h < 6 ? h + 24 : h, frac = Math.max(0, Math.min(1, (hn - 19) / 11));
    const x = r.x + r.w * (0.16 + 0.7 * frac), y = r.y + r.h * (0.5 - Math.sin(frac * Math.PI) * 0.32);
    g.fillStyle = "#eef2ff"; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
    g.fillStyle = "#d2dbf2"; g.beginPath(); g.arc(x + 2, y - 1, 1.2, 0, 7); g.fill(); g.beginPath(); g.arc(x - 1, y + 2, 1, 0, 7); g.fill();
  }
  function drawStars(g, r, t, a) { g.fillStyle = "#fff"; for (let i = 0; i < 14; i++) { const sx = r.x + ((i * 47) % r.w), sy = r.y + ((i * 29) % (r.h * 0.6)); if ((Math.floor(t / 8) + i) % 9 !== 0) g.fillRect(sx, sy, 1, 1); } }
  function cloud(g, x, y) { g.fillStyle = "#ffffff"; g.fillRect(x, y, 14, 4); g.fillRect(x + 3, y - 3, 9, 4); g.fillRect(x + 6, y - 5, 6, 4); g.fillStyle = "rgba(210,230,245,0.7)"; g.fillRect(x, y + 4, 12, 1); }
  function bird(g, x, y) { g.fillStyle = "#3a4a55"; g.fillRect(x, y, 2, 1); g.fillRect(x + 2, y - 1, 2, 1); g.fillRect(x + 4, y, 2, 1); }
  function rainbow(g, r) {
    const cols = ["#f06c6c", "#ffb45a", "#ffe878", "#7ad07a", "#5ac8eb", "#6e8ee0", "#a55ac8"];
    const cx = r.x + r.w / 2, cy = r.y + r.h + 6, r0 = r.w * 0.5;
    g.save(); g.globalAlpha = 0.5; g.lineWidth = 2;
    for (let i = 0; i < cols.length; i++) { g.strokeStyle = cols[i]; g.beginPath(); g.arc(cx, cy, r0 - i * 2, Math.PI, 0); g.stroke(); }
    g.restore();
  }
  function rain(g, r, t) { g.strokeStyle = "rgba(205,228,246,0.7)"; g.lineWidth = 1; for (let i = 0; i < 16; i++) { const x = r.x + wrap(i * 23 - t, r.w), y = r.y + wrap(t * 3 + i * 37, r.h); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y + 4); g.stroke(); } }
  function snow(g, r, t) { g.fillStyle = "#fff"; for (let i = 0; i < 16; i++) { const x = r.x + wrap(i * 29 + Math.sin((t + i * 10) * 0.05) * 3, r.w), y = r.y + wrap(t * 1 + i * 31, r.h); g.fillRect(x, y, 1, 1); } }

  function isNightNow() { const h = hourF(); return h >= 20 || h < 6; }
  function nightness() { const h = hourF(); const day = ramp(h, 6.2, 7.8) * (1 - ramp(h, 18.0, 20.5)); return 1 - day; }  // 0 낮 → 1 밤 (연속)
  window.WindowSky = { draw, isNight: isNightNow, nightness, phase: () => { const h = hourF(); return h < 6 || h >= 20 ? "night" : h < 8 ? "dawn" : h < 17 ? "day" : "dusk"; } };
})();
