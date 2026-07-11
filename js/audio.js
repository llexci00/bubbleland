/* ============================================================
   사운드 (Web Audio · 파일 없이 합성) — window.Audio2
   ============================================================ */
(function () {
  "use strict";
  let ctx = null;
  let ambient = null;       // {nodes:[], stop()}
  let ambientKind = null;
  let bubbleTimer = null;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function sfxOn() { return !!(window.App && window.App.state.settings.sfx !== false); }   // 효과음
  function musicOn() { return !!(window.App && window.App.state.settings.music !== false); } // 노래
  function ambientOn() { return !!(window.App && window.App.state.settings.ambient !== false); } // 날씨/환경 소리

  function pop() {
    if (!sfxOn() || !ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(700, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.14);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.24);
  }
  function spawn() {
    if (!sfxOn() || !ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(720, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.2);
  }
  // UI 버튼 = 부드러운 물방울 "똑" (예전 삑삑 square → sine 물방울)
  function blip(freq) {
    if (!sfxOn() || !ensure()) return;
    const t = ctx.currentTime, f0 = freq || 520;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(f0 * 1.5, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.72, t + 0.08);   // 살짝 아래로 = 물방울
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.19);
  }
  // 컴퓨터 내부 클릭 = "딸깍" (짧은 노이즈 두 번)
  function click() {
    if (!sfxOn() || !ensure()) return;
    const tick = (dt, amp, freq) => {
      const t = ctx.currentTime + dt;
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer();
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);
      src.connect(f).connect(g).connect(ctx.destination); src.start(t); src.stop(t + 0.032);
    };
    tick(0, 0.13, 2600); tick(0.05, 0.08, 1800);
  }
  // 말랑이 누를 때 "몰캉" (피치가 쭉 내려갔다 살짝 올라옴)
  function squish() {
    if (!sfxOn() || !ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = "sine";
    o.frequency.setValueAtTime(380, t);
    o.frequency.exponentialRampToValueAtTime(130, t + 0.13);
    o.frequency.exponentialRampToValueAtTime(240, t + 0.24);
    f.type = "lowpass"; f.frequency.value = 850;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.27);
    o.connect(f).connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.29);
  }
  // 뚜벅 발소리 (상점 입장 전환용) — 또렷하게
  function footsteps(n) {
    if (!sfxOn() || !ensure()) return;
    n = n || 4;
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + 0.12 + i * 0.28;
      // 발바닥 '턱' (밴드패스 노이즈 = 또렷)
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer();
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; f.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      src.connect(f).connect(g).connect(ctx.destination); src.start(t); src.stop(t + 0.13);
      // 무게감 있는 저음 '쿵'
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.1);
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.32, t + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(og).connect(ctx.destination); o.start(t); o.stop(t + 0.15);
    }
  }
  // 위치 배경음악 서서히 줄이며 정지 (상점 입장 시 발소리 잘 들리게)
  function fadeOutLocation(ms) {
    if (!locEl || locEl.paused) return;
    const steps = 12, dt = (ms || 600) / steps, start = locEl.volume; let i = 0;
    const iv = setInterval(() => { i++; try { locEl.volume = Math.max(0, start * (1 - i / steps)); } catch (e) {} if (i >= steps) { clearInterval(iv); try { locEl.pause(); } catch (e) {} } }, dt);
  }
  // 냉장고 끼익
  function creak() {
    if (!sfxOn() || !ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.5);
    f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(f).connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.56);
  }
  // 책장 넘기는 소리
  function pageFlip() {
    if (!sfxOn() || !ensure()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer();
    const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    src.connect(f).connect(g).connect(ctx.destination); src.start(t); src.stop(t + 0.22);
  }
  // 야옹
  function meow() {
    if (!sfxOn() || !ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(520, t);
    o.frequency.linearRampToValueAtTime(780, t + 0.12);
    o.frequency.linearRampToValueAtTime(430, t + 0.34);
    f.type = "bandpass"; f.frequency.value = 950; f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(f).connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.42);
  }
  // 물결/파동
  function ripple() {
    if (!sfxOn() || !ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.36);
  }

  // ---- 환경음 (지속) : water / wind / rain ----
  function stopAmbient() {
    if (ambient) { try { ambient.stop(); } catch (e) {} ambient = null; }
    if (bubbleTimer) { clearInterval(bubbleTimer); bubbleTimer = null; }
    ambientKind = null;
  }
  // 보글보글 방울 소리 한 개
  function bubbleBlip() {
    if (!sfxOn() || !ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    const f0 = 300 + Math.random() * 500;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 2.2, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.16);
  }
  function noiseBuffer() {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function setAmbient(kind) {
    if (!ensure()) return;
    if (ambientKind === kind && ambient) return;
    stopAmbient();
    ambientKind = kind;
    if (!sfxOn() || !ambientOn() || !kind) return;   // 날씨 소리 끄면 재생 안 함

    const nodes = [];
    if (kind === "water") {
      // 부드러운 물/방울 패드: 저역 노이즈 + 느린 LFO
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
      const g = ctx.createGain(); g.gain.value = 0.05;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15;
      const lfoG = ctx.createGain(); lfoG.gain.value = 300;
      lfo.connect(lfoG).connect(f.frequency);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(); lfo.start();
      nodes.push(src, lfo);
    } else if (kind === "rain") {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1800;
      const g = ctx.createGain(); g.gain.value = 0.06;
      src.connect(f).connect(g).connect(ctx.destination); src.start();
      nodes.push(src);
    } else if (kind === "wind") {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 500; f.Q.value = 0.5;
      const g = ctx.createGain(); g.gain.value = 0.03;
      src.connect(f).connect(g).connect(ctx.destination); src.start();
      nodes.push(src);
    } else if (kind === "bubble") {
      // 잔잔한 물 패드 + 주기적 보글보글
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 600;
      const g = ctx.createGain(); g.gain.value = 0.035;
      src.connect(f).connect(g).connect(ctx.destination); src.start();
      nodes.push(src);
      bubbleTimer = setInterval(() => { if (Math.random() < 0.7) bubbleBlip(); }, 300);
    }
    ambient = { stop() { nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); } };
  }

  // 소리 껐을 때 환경음 즉시 중단, 켜면 마지막 것 복원
  function refreshAmbient() {
    const k = ambientKind;
    stopAmbient();
    if (sfxOn() && ambientOn() && k) setAmbient(k);
  }

  // ---- 라디오: 실제 음원(m4a) 재생 ----
  const SONGS = [
    { name: "🍅 Sunny Sprout", src: "music/tomato_main.m4a" },   // 밝고 통통 튀는 메인
    { name: "🥬 Mellow Meadow", src: "music/tomato_s2.m4a" },    // 길고 느긋한 탐험
    { name: "⚡ Turbo Tomato", src: "music/tomato_s3.m4a" },     // 148BPM 빠른 질주
    { name: "👋 See You Later", src: "music/tomato_ending.m4a" }, // 고조되는 피날레
  ];
  let musicEl = null, musicIdx = -1, musicVol = 0.3;
  let radioAllowed = true;   // 라디오(실내 곡)는 실내에서만 재생
  function ensureMusicEl() { if (!musicEl) { musicEl = new Audio(); musicEl.loop = true; musicEl.volume = musicVol; } return musicEl; }
  function playSong(i) {
    musicIdx = i;
    const el = ensureMusicEl();
    if (el.dataset.idx !== String(i)) { el.src = SONGS[i].src; el.dataset.idx = String(i); }
    el.volume = musicVol;
    if (musicOn() && radioAllowed) el.play().catch(() => {});
  }
  function stopSong() { if (musicEl) { musicEl.pause(); musicEl.currentTime = 0; } musicIdx = -1; }
  function setMusicVolume(v) { musicVol = v; if (musicEl) musicEl.volume = v; }
  function isPlaying() { return musicIdx >= 0 && radioAllowed && musicOn(); }
  // 라디오 허용 여부 (공원·상점에선 실내 곡 정지, 실내 복귀 시 이어재생)
  function setRadioAllowed(b) { radioAllowed = b; syncMusic(); }

  // ---- 위치 배경음악 (공원 낮/밤 · 상점) : 라디오와 별개 채널 ----
  let locEl = null, locSrc = null, locVol = 0.5;
  function ensureLocEl() { if (!locEl) { locEl = new Audio(); locEl.loop = true; locEl.volume = locVol; } return locEl; }
  function setLocationMusic(src) {
    if (src === locSrc) { if (src && musicOn()) ensureLocEl().play().catch(() => {}); return; }
    locSrc = src || null;
    if (!locSrc) { if (locEl) { locEl.pause(); locEl.currentTime = 0; } return; }
    const el = ensureLocEl(); el.src = locSrc; el.volume = locVol;
    if (musicOn()) el.play().catch(() => {});
  }
  function stopLocationMusic() { setLocationMusic(null); }
  function isLocPlaying() { return !!locSrc && locEl && !locEl.paused; }
  function setLocationVolume(v) { locVol = v; if (locEl) locEl.volume = v; }

  function syncMusic() {
    if (musicEl) { if (musicOn() && radioAllowed && musicIdx >= 0) musicEl.play().catch(() => {}); else musicEl.pause(); }
    if (locEl) { if (musicOn() && locSrc) locEl.play().catch(() => {}); else locEl.pause(); }
  }

  // ---- 타이머 벨소리 (알람이라 sfx 꺼져 있어도 울림) ----
  function bell(kind) {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    const note = (freq, start, dur, type, vol) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0 + start);
      g.gain.linearRampToValueAtTime(vol || 0.2, t0 + start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
      o.connect(g); g.connect(ctx.destination); o.start(t0 + start); o.stop(t0 + start + dur + 0.03);
    };
    if (kind === "beep") { for (let i = 0; i < 4; i++) note(1040, i * 0.22, 0.12, "square", 0.16); }              // 삐삐삐삐
    else if (kind === "chime") { [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.14, 0.55, "triangle", 0.2)); } // 도미솔도 차임
    else if (kind === "bell") { [784, 1176, 1568].forEach((f, i) => note(f, 0, 1.3, "sine", 0.16 / (i + 1))); note(784, 0.55, 1.0, "sine", 0.1); } // 종
    else { note(880, 0, 0.5, "sine", 0.22); note(660, 0.28, 0.75, "sine", 0.22); }                               // 딩동 (기본)
  }

  window.Audio2 = { ensure, pop, spawn, blip, click, squish, footsteps, ripple, creak, pageFlip, meow, bell, setAmbient, stopAmbient, refreshAmbient,
    SONGS, playSong, stopSong, setMusicVolume, isPlaying, syncMusic, setRadioAllowed,
    setLocationMusic, stopLocationMusic, isLocPlaying, setLocationVolume, fadeOutLocation,
    get musicIdx() { return musicIdx; }, get kind(){return ambientKind;},
    get locSrc(){ return locSrc; }, get radioAllowed(){ return radioAllowed; } };
})();
