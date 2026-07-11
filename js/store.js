/* ============================================================
   공유 상태 저장소 (localStorage) — window.App
   ============================================================ */
(function () {
  "use strict";
  const KEY = "frutigerRoom.v4";   // 배포용 클린 시작(전체 초기화 · 100골드)

  const defaults = {
    weather: "sunny",
    settings: { sfx: true, music: true, ambient: true, font: "m", wallpaper: 0, brightness: "m", customWp: null },
    bubbles: [],            // {id,text,imp,x,y,vx,vy}
    doneToday: 0,
    doneStamp: "",
    diary: [],              // {date, text, mood}
    fortune: null,          // {stamp, ...}
    aquarium: { fish: ["nemo"], decor: [], total: 0 },  // 처음엔 니모 1마리
    coins: 100,             // 시작 코인(골드) 100 · 이후 할일 완료로 획득
    decor: {},              // 방(침실) 꾸미기 + 보유 목록: id -> { owned, x, y, hidden }
    decorLiving: {},        // 거실 배치: id -> { x, y, hidden }
    decorKitchen: {},       // 부엌 배치: id -> { x, y, hidden }
    hiddenBuiltins: {},     // 방(침실) 소품 숨김: id -> true
    builtinPos: {},         // 방(침실) 소품 이동: id -> { dx, dy }
    hiddenBuiltinsLiving: {}, builtinPosLiving: {},   // 거실 기본물건(소파·러그)
    hiddenBuiltinsKitchen: {}, builtinPosKitchen: {}, // 부엌 기본물건(식물)
    skins: {},              // 기능 아이템 스킨: item -> idx (예: computer:1)
    skinsOwned: {},         // 구매한 스킨: "item:idx" -> true
    lights: { room: true, living: true, kitchen: true }, // 천장 조명 on/off
    palettePos: null,       // 꾸미기 팔레트 이동 위치 {x,y} (null=기본 중앙하단)
    arcade: { snake: 0 },   // 아케이드 최고점수
    roomTheme: null,        // 방 전체 테마 프리셋 id (null=개별 스킨)
    themesOwned: {},        // 구매한 방 테마: id -> true
    welcomeHidden: false,   // "다시 보지 않기" 누르면 true. 그 전엔 접속(새 창)마다 표시
    _uid: 1,
  };

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  const App = {
    state: JSON.parse(JSON.stringify(defaults)),
    listeners: [],

    load() {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
      if (saved) {
        this.state = Object.assign(JSON.parse(JSON.stringify(defaults)), saved);
        this.state.settings = Object.assign({}, defaults.settings, saved.settings || {});
        // 옛 통합 'sound' → 효과음/노래 분리 마이그레이션
        const ss = saved.settings || {};
        if (ss.sound !== undefined) {
          if (ss.sfx === undefined) this.state.settings.sfx = ss.sound;
          if (ss.music === undefined) this.state.settings.music = ss.sound;
        }
        delete this.state.settings.sound;
      }
      // 완료 카운트 날짜 리셋
      if (this.state.doneStamp !== todayStr()) {
        this.state.doneStamp = todayStr();
        this.state.doneToday = 0;
      }
      // 어항 고정 구성: 니모·블루탱·옐로탱·줄무늬(엔젤) + 바닥 새우2·작은 게1, 모래성·해초 유지
      this.state.aquarium = { fish: ["nemo", "dory", "tang", "angel", "shrimp", "shrimp", "crab"], decor: ["castle", "seaweed", "seaweed"] };
      return this.state;
    },

    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) {}
    },

    nextId() { return this.state._uid++; },
    todayStr,

    // 설정 변경 시 구독자에게 알림
    onSettings(fn) { this.listeners.push(fn); },
    applySettings() { this.listeners.forEach((fn) => fn(this.state.settings)); this.save(); },
  };

  window.App = App;
})();
