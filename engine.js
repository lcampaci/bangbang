/* Bang! Bang! - game engine (pure logic), reconstructed from BANGBANG.EXE (Win 3.0, 1990).
   Numbers/formulas come from the disassembly; see NOTAS-ENGENHARIA-REVERSA.md */
(function (root) {
  'use strict';
  const FLOOR = 390;               // 0x186: row of the bottom line; heights are converted to rows = 390 - h
  const TOL = [4, 8, 16];          // hit tolerance by accuracy (Fine, Medium, Coarse) ds:0x2ee
  const CRATER = [1,4,6,7,7,8,8,8,9,8,8,8,7,7,6,4]; // ds:0x2f4
  const STEPS = [0.1, 1, 10];      // ds:0x6e
  const ENT_DEF = [ // id, xmin, xmax, ymin, ymargin  (ds:0x86 table, entities 1..12)
    [2,32,479,16,17],[6,32,479,16,17],[4,32,479,16,17],[4,32,479,16,17],[4,32,479,16,17],
    [8,16,496,16,50],[8,16,496,16,50],[8,16,496,16,50],[8,16,496,16,50],[8,16,496,16,50],[8,16,496,16,50],[8,16,496,16,50]];
  const CANNON_W = 32, CANNON_H = 32, FLAG_H = 64;
  const trunc = Math.trunc;

  // Microsoft C rand()
  function makeRng(seed) {
    let s = (seed >>> 0);
    const rand = () => { s = (Math.imul(s, 214013) + 2531011) >>> 0; return (s >>> 16) & 0x7fff; };
    rand.seed = (v) => { s = v >>> 0; };
    return rand;
  }

  function createState() {
    const S = {
      terrain: new Int16Array(513),
      cur: 0, other: 1, wind: 0, accuracy: 1,
      vel: [180, 180], ang: [45, 45], step: [1, 1],
      generated: false, divots: 1, windOpt: 1, onePlayer: 0,
      team: [0, 1].map(() => ({ dead: 0, x: 0, mx: 0, row: 0, edge: 0, shots: 0 })),
      ents: [{ id: 0, x: 100, y: 40 }],
      active: false, maxRow: 0,
    };
    for (let i = 0; i < 12; i++) S.ents.push({ id: ENT_DEF[i][0], x: 0, y: 0 });
    return S;
  }

  function newGame(S, rand) {
    const T = S.terrain;
    S.cur = rand() % 2; S.other = S.cur ^ 1;
    S.wind = S.windOpt ? (rand() % 101) - 50 : 0;
    const L = rand() % 116 + 78;
    const R = rand() % 116 + 318;
    S.team[0].edge = L; S.team[1].edge = R;
    const h = [0, 0];
    for (let t = 0; t < 2; t++) { S.team[t].dead = 0; h[t] = rand() % 216 + 8; S.team[t].shots = 0; }
    S.team[0].x = rand() % (L - 63) + 32;
    S.team[1].x = rand() % (448 - R) + R + 32;
    S.team[0].mx = S.team[0].x + (CANNON_W >> 1);
    S.team[1].mx = S.team[1].x - (CANNON_W >> 1);
    for (let i = 0; i <= L; i++) T[i] = h[0];
    for (let i = R; i <= 512; i++) T[i] = h[1];
    const di = rand() % (R - L - 75) + L + 38;
    const peak = rand() % 223 + 78;
    T[di] = peak;
    const a1 = trunc((peak - T[1]) / 2);
    const a2 = trunc((peak - T[512]) / 2);
    const PI = 3.141592;
    if (a1 === 0 && a2 === 0) {
      let th = 0; const st = PI / (R - L + 1);
      const a = trunc((T[1] - T[512]) / 2), b = a + T[512];
      for (let i = L + 1; i < R; i++) { th += st; T[i] = trunc(Math.cos(th) * a) + b; }
    } else {
      let th = -PI; let st = PI / (di - L + 1); const b1 = a1 + T[1];
      for (let i = L; i < di; i++) { th += st; T[i] = trunc(Math.cos(th) * a1) + b1; }
      th = 0; st = PI / (R - di + 1); const b2 = a2 + T[512];
      for (let i = di + 1; i < R; i++) { th += st; T[i] = trunc(Math.cos(th) * a2) + b2; }
    }
    for (let i = 0; i <= 512; i++) T[i] = FLOOR - T[i];
    S.team[0].row = FLOOR - h[0]; S.team[1].row = FLOOR - h[1];
    S.maxRow = maxRow(S);
    for (let k = 1; k <= 12; k++) {
      const d = ENT_DEF[k - 1], e = S.ents[k];
      e.x = rand() % (d[2] - d[1] + 1) + d[1];
      e.y = rand() % (S.maxRow - d[3] - d[4] + 1) + d[3];
    }
    S.generated = true;
  }

  function maxRow(S) { let m = 0; for (let i = 0; i <= 512; i++) if (S.terrain[i] > m) m = S.terrain[i]; return m; }

  // ---- shot -------------------------------------------------------------
  function startShot(S) {
    const t = S.cur, tm = S.team[t];
    tm.shots++;
    const w = S.wind * 0.0001;
    const ang = Math.abs(S.ang[t]) * 0.01745328888888889;
    const dir = -(2 * t - 1);
    const v = Math.abs(S.vel[t]);
    const sh = {
      t, w, dir, maxRow: maxRow(S), done: false, impact: false, hit: false,
      vx: (v * (Math.cos(ang) * dir)) * 0.01,
      vy: (v * Math.sin(ang)) * 0.01,
      x: tm.mx, y: (FLOOR - tm.row) + CANNON_H,
      xi: 0, yi: 0,
    };
    sh.xi = trunc(sh.x); sh.yi = trunc(sh.y);
    return sh;
  }
  // one physics step (loop body of the original). returns false when the flight ended
  function stepShot(S, sh) {
    sh.y += sh.vy; sh.vy -= 0.01; sh.x += sh.vx;
    const row = FLOOR - trunc(sh.y);
    if (row < sh.maxRow || sh.dir * sh.w >= 0) sh.vx += sh.w;
    sh.xi = trunc(sh.x); sh.yi = trunc(sh.y);
    const r = FLOOR - sh.yi;
    if (sh.xi - 8 < 0 || sh.xi + 8 > 512 || sh.y > 800 || !(S.terrain[sh.xi] > r)) { sh.done = true; return false; }
    return true;
  }
  // after the flight: did it land on the ground?
  function landed(S, sh) {
    const r = FLOOR - sh.yi;
    if (sh.xi < 0 || sh.xi > 512) return false;
    sh.impact = !(S.terrain[sh.xi] > r);
    sh.impactRow = r;
    return sh.impact;
  }
  function checkHit(S, sh) {
    const ox = S.team[sh.t ^ 1].x, tol = TOL[S.accuracy];
    sh.hit = (ox - tol <= sh.x) && (sh.x <= ox + tol);
    return sh.hit;
  }
  // carve the crater; returns true if the terrain changed
  function carve(S, sh) {
    if (!S.divots) return false;
    const T = S.terrain, ox = S.team[sh.t ^ 1].x, half = 32;
    let changed = false;
    for (let k = 0; k < 16; k++) {
      const col = sh.xi + k - 7;
      if (col < 0 || col > 512) continue;
      if (ox - half <= col && col <= ox + half) continue;
      const nr = FLOOR - sh.yi + CRATER[k];
      if (nr > T[col]) { T[col] = Math.min(nr, 0x17c); changed = true; }
    }
    return changed;
  }

  // ---- save format (0x45a bytes, DS:0x1184..0x15de) ---------------------
  const SAVE_SIZE = 0x45a;
  function serialize(S) {
    const b = new ArrayBuffer(SAVE_SIZE), d = new DataView(b);
    for (let i = 0; i <= 512; i++) d.setInt16(2 * (i + 8), S.terrain[i], true);
    d.setInt16(12, S.cur, true); d.setInt16(14, S.other, true);
    d.setInt16(0x412, S.wind, true); d.setInt16(0x414, S.accuracy, true);
    for (let t = 0; t < 2; t++) {
      d.setFloat64(0x416 + 8 * t, S.vel[t], true); d.setFloat64(0x426 + 8 * t, S.ang[t], true);
      d.setInt16(0x436 + 2 * t, S.step[t], true);
      const o = 0x442 + 12 * t, m = S.team[t];
      d.setInt16(o, m.dead, true); d.setInt16(o + 2, m.x, true); d.setInt16(o + 4, m.mx, true);
      d.setInt16(o + 6, m.row, true); d.setInt16(o + 8, m.edge, true); d.setInt16(o + 10, m.shots, true);
    }
    d.setInt16(0x43a, S.generated ? 1 : 0, true);
    d.setInt16(0x43c, S.divots, true); d.setInt16(0x43e, S.windOpt, true); d.setInt16(0x440, S.onePlayer, true);
    return new Uint8Array(b);
  }
  function deserialize(S, bytes) {
    if (bytes.length !== SAVE_SIZE) return false;
    const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const g = (o) => d.getInt16(o, true);
    const cur = g(12), oth = g(14), wind = g(0x412), acc = g(0x414);
    if (cur < 0 || cur > 1 || oth !== (cur ^ 1) || acc < 0 || acc > 2 || Math.abs(wind) > 50) return false;
    const tr = new Int16Array(513);
    for (let i = 0; i <= 512; i++) { tr[i] = g(2 * (i + 8)); if (tr[i] < 0 || tr[i] > FLOOR) return false; }
    const vel = [], ang = [], step = [], team = [];
    for (let t = 0; t < 2; t++) {
      vel[t] = d.getFloat64(0x416 + 8 * t, true); ang[t] = d.getFloat64(0x426 + 8 * t, true);
      step[t] = g(0x436 + 2 * t);
      if (!(vel[t] >= 50 && vel[t] <= 900 && ang[t] >= 0 && ang[t] <= 95) || step[t] < 0 || step[t] > 2) return false;
      const o = 0x442 + 12 * t;
      team[t] = { dead: g(o), x: g(o + 2), mx: g(o + 4), row: g(o + 6), edge: g(o + 8), shots: g(o + 10) };
    }
    S.terrain = tr; S.cur = cur; S.other = oth; S.wind = wind; S.accuracy = acc;
    S.vel = vel; S.ang = ang; S.step = step; S.team = team;
    S.generated = true; S.divots = g(0x43c); S.windOpt = g(0x43e); S.onePlayer = g(0x440);
    S.maxRow = maxRow(S);
    return true;
  }

  const API = { FLOOR, TOL, CRATER, STEPS, CANNON_W, CANNON_H, FLAG_H, makeRng, createState, newGame, maxRow,
    startShot, stepShot, landed, checkHit, carve, serialize, deserialize, SAVE_SIZE };
  if (typeof module !== 'undefined') module.exports = API; else root.BB = API;
})(typeof window !== 'undefined' ? window : globalThis);
