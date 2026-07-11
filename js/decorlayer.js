/* ============================================================
   공용 꾸미기 레이어 — window.DecorLayer
   방/거실/부엌이 각자 배치 맵을 넘겨 렌더/히트테스트에 사용
   map: { id: { x, y, hidden } }
   ============================================================ */
(function () {
  "use strict";
  function box(d) { return { x: d.x - 15, y: d.y - 28, w: 30, h: 32 }; }
  function render(ctx, map, editMode, dragId, wobMap) {
    for (const id in map) {
      const d = map[id], item = window.Decor.byId(id); if (!item) continue;
      if (d.hidden) continue;   // 숨긴 아이템은 아예 안 그림 (편집 중에도)
      const wob = (wobMap && wobMap[id]) || 0;
      if (wob > 0 && item.squishy) {   // 말랑이: 옆으로 쫀득하게 늘어남
        const st = Math.sin((wob / 18) * Math.PI);
        ctx.save(); ctx.translate(d.x, d.y); ctx.scale(1 + st * 0.42, 1 - st * 0.3); ctx.translate(-d.x, -d.y);
        item.draw(ctx, d.x, d.y); ctx.restore();
      } else {
        const wx = wob > 0 ? Math.sin(wob * 0.7) * 2 : 0, wy = wob > 0 ? -Math.abs(Math.sin(wob * 0.5)) : 0;
        item.draw(ctx, d.x + wx, d.y + wy);
      }
      if (editMode) {
        const b = box(d);
        ctx.strokeStyle = (dragId === id) ? "#ffd23f" : "rgba(255,255,255,0.8)"; ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]); ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h); ctx.setLineDash([]);
      }
    }
  }
  function pick(map, x, y) { let hit = null; for (const id in map) { if (map[id].hidden) continue; const b = box(map[id]); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) hit = id; } return hit; }
  function ownedIds() { const d = window.App.state.decor || {}; return Object.keys(d).filter((id) => d[id] && d[id].owned); }
  window.DecorLayer = { box, render, pick, ownedIds };
})();
