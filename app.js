/* Bang! Bang! - UI / rendering / flow (reconstructed from BANGBANG.EXE) */
(function () {
  'use strict';
  const E = window.BB, FLOOR = E.FLOOR;
  const rand = E.makeRng((Date.now() / 1000) | 0);
  const S = E.createState();
  const TEAM = ['VERDE', 'VERMELHO'], TCOL = ['#0f0', '#f00'];
  const DICT = {
    'File':'Arquivo','Open...':'Abrir...','Save...':'Salvar...','Exit':'Sair','Game':'Jogo','New':'Novo','Stop':'Parar','Configure...':'Configurar...','Aim!':'Mirar!','Help':'Ajuda','Index':'Índice','Using Help':'Como usar a ajuda','About Bang! Bang!...':'Sobre Bang! Bang!...',
    'Unable to open file!':'Não foi possível abrir o arquivo!','Unable to save game file!':'Não foi possível salvar o jogo!','Not a valid game file!':'Arquivo de jogo inválido!','Abandon game in progress?':'Deseja abandonar a partida em andamento?','Overwrite existing save file?':'Substituir o arquivo salvo existente?','Invalid angle (must be 0° - 95°)!':'Ângulo inválido (deve ser de 0° a 95°)!','Invalid velocity (must be 50 - 900 km/h)!':'Velocidade inválida (deve ser de 50 a 900 km/h)!','Invalid or missing file name!':'Nome de arquivo inválido ou ausente!','No wind':'Sem vento','Wind speed is ':'Velocidade do vento: ',
    'The Cannon-fire Game for':'O jogo de artilharia para','Version 1.00':'Versão 1.00','This program is distributed as shareware.  It':'Este programa é distribuído como shareware. Ele','may be copied and distributed freely, providing':'pode ser copiado e distribuído livremente, desde que','no changes are made to the program.':'nenhuma alteração seja feita no programa.','If you like this program, and intend to keep a':'Se você gostou deste programa e pretende continuar','copy of it, please be supportive of the author\'s':'usando-o, apoie o trabalho do autor','efforts by sending a donation of $10 to:':'enviando uma contribuição de US$ 10 para:','Thank you for your support.':'Agradecemos seu apoio.','...And thus the battle ends!!':'...E assim termina a batalha!!','The GREEN team is victorious!':'A equipe VERDE venceu!','The RED team is victorious!':'A equipe VERMELHA venceu!','To the victor goes the spoils.':'Ao vencedor, as honras da vitória.','Bang! Bang! Configuration':'Configuração do Bang! Bang!','Hit Accuracy':'Precisão do acerto','Options':'Opções','Fine (Hardest)':'Precisa (mais difícil)','Medium':'Média','Coarse (Easiest)':'Ampla (mais fácil)','Wind':'Vento','Divots':'Crateras','1 Player':'1 jogador','Cancel':'Cancelar','Angle':'Ângulo','Velocity':'Velocidade','Fire!':'Atirar!','Save File Name:':'Nome do arquivo para salvar:','Open File Name:':'Nome do arquivo para abrir:','Path:':'Caminho:','Save':'Salvar','Open':'Abrir','Export':'Exportar','Import':'Importar','Bang! Bang! Help':'Ajuda do Bang! Bang!','Two cannons face each other across a hill. Each player in turn picks an angle (0-95°) and a velocity (50-900 km/h) with the Aim! menu, then presses Fire!. The wind (Game > Configure) pushes the shot; the flags show its direction. A shot that lands near the enemy cannon destroys it and you win. Divots dig craters. Hit Accuracy sets how near the shot must land. 1 Player keeps the same cannon firing.':'Dois canhões se enfrentam em lados opostos de uma colina. Em cada turno, escolha um ângulo (0° a 95°) e uma velocidade (50 a 900 km/h) no menu Mirar! e pressione Atirar!. O vento (Jogo > Configurar) desvia o disparo; as bandeiras indicam sua direção. Acerte perto do canhão inimigo para destruí-lo e vencer. Os impactos podem abrir crateras. A opção Precisão define o quão perto o tiro precisa cair. Em 1 jogador, o mesmo canhão continua atirando.','Reabrir Bang! Bang!':'Reabrir Bang! Bang!','Escala':'Escala','Velocidade do tiro':'Velocidade do tiro','Tela cheia':'Tela cheia','Sair da tela cheia':'Sair da tela cheia','<u>F</u>ine (Hardest)':'<u>P</u>recisa (mais difícil)','<u>M</u>edium':'<u>M</u>édia','Coarse (<u>E</u>asiest)':'Ampla (<u>F</u>ácil)','<u>W</u>ind':'<u>V</u>ento','<u>D</u>ivots':'<u>C</u>rateras','1 <u>P</u>layer':'1 <u>J</u>ogador','<u>C</u>ancel':'<u>C</u>ancelar','<u>O</u>K':'<u>O</u>K','E&xit':'&Sair','S&top':'&Parar'
  };
  let language = localStorage.getItem('bb-language') || 'pt';
  const tr = (s) => language === 'en' ? s : (DICT[s] || s);
  function translateMarkup(s) { if (language === 'en') return s; let out=s; for (const [a,b] of Object.entries(DICT).sort((x,y)=>y[0].length-x[0].length)) out=out.split(a).join(b); return out; }

  const MSG = { 7: 'Invalid angle (must be 0° - 95°)!', 8: 'Invalid velocity (must be 50 - 900 km/h)!', 9: 'Invalid or missing file name!', 11: 'Unable to open file!', 12: 'Unable to save game file!', 13: 'Not a valid game file!', 14: 'Abandon game in progress?', 15: 'Overwrite existing save file?' };
  const ID = { 0: 'sun', 2: 'cloud1', 4: 'cloud2', 6: 'cloud3', 8: 'bird', 10: 'greenflag', 11: 'redflag', 13: 'bang', 15: 'kaboom', 16: 'cannon', 18: 'rubble', 19: 'ball' };
  const $ = (s) => document.querySelector(s);
  const cv = $('#cv'), ctx = cv.getContext('2d');
  const base = document.createElement('canvas'); base.width = 512; base.height = 391;
  const bctx = base.getContext('2d');
  const IMG = {};
  let busy = false, ended = false, bang = null, ball = null, extra = [];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  let audio;
  function beep() { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 800; g.gain.value = .1; o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + .12); } catch (e) {} }

  // ---------- rendering -------------------------------------------------
  function sprite(c, id, cx, cy, mirror) {
    const im = IMG[ID[id]]; const x = cx - (im.width >> 1), y = cy - (im.height >> 1);
    if (mirror === -1) { c.save(); c.translate(x + im.width, y); c.scale(-1, 1); c.drawImage(im, 0, 0); c.restore(); } else c.drawImage(im, x, y);
  }
  function terrainLayer() {
    const id = bctx.createImageData(512, 391), d = id.data, T = S.terrain;
    const put = (x, y, r, g, b) => { if (x < 0 || x > 511 || y < 0 || y > 390) return; const o = (y * 512 + x) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255; };
    for (let y = 0; y < 391; y++) for (let x = 0; x < 512; x++) put(x, y, 0, 255, 255);
    for (let x = 0; x < 512; x++) for (let y = T[Math.max(x, 1)] + 1; y < 390; y++) put(x, y, 0, 128, 0);
    const line = (x0, y0, x1, y1) => { let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, er = dx + dy;
      for (;;) { put(x0, y0, 0, 0, 0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * er; if (e2 >= dy) { er += dy; x0 += sx; } if (e2 <= dx) { er += dx; y0 += sy; } } };
    line(0, 390, 512, 390); line(0, 390, 0, T[1]);
    let px = 0, py = T[1];
    for (let x = 1; x <= 512; x++) { line(px, py, x, T[x]); px = x; py = T[x]; }
    return id;
  }
  function redrawBase() {
    bctx.putImageData(terrainLayer(), 0, 0);
    for (const e of S.ents) sprite(bctx, e.id, e.x, e.y, 1);
    for (let t = 0; t < 2; t++) {
      const m = S.team[t];
      if (!m.dead) {
        sprite(bctx, 10 + t, m.x, m.row - 32, S.wind < 0 ? 1 : -1);
        sprite(bctx, 16, m.x, m.row - 16, t === 0 ? 1 : -1);
      } else sprite(bctx, 18, m.x, m.row - 32, 1);
    }
    present();
  }
  function present() {
    ctx.drawImage(base, 0, 0);
    for (const x of extra) sprite(ctx, x.id, x.x, x.y, 1);
    if (ball) sprite(ctx, 19, ball.x, ball.y, 1);
    if (bang) sprite(ctx, 13, bang.x, bang.y, 1);
  }
  function updateStatus() {
    $('#wind').textContent = S.wind === 0 ? ' ' + tr('No wind') : ' ' + tr('Wind speed is ') + Math.abs(S.wind) + ' km/h';
    $('#chip').style.background = TCOL[S.cur];
  }

  // ---------- menus -----------------------------------------------------
  const MENUS = [
    ['&File', [['&Open...', 105], ['&Save...', 106], '-', ['E&xit', 101]]],
    ['&Game', [['&New', 102], ['S&top', 109], ['&Configure...', 104]]],
    ['&Aim!', 103],
    ['&Help', [['&Index', 107], ['&Using Help', 108], '-', ['&About Bang! Bang!...', 100]]],
  ];
  const disabled = new Set([103, 106, 109]);
  const lab = (s) => s.replace(/&(.)/, '<u>$1</u>');
  let openMenu = null;
  function buildMenu() {
    const mb = $('#menubar'); mb.innerHTML = '';
    MENUS.forEach((m) => {
      const el = document.createElement('div'); el.className = 'mi'; el.innerHTML = lab(translateMarkup(m[0]));
      if (typeof m[1] === 'number') { el.dataset.cmd = m[1]; if (disabled.has(m[1])) el.classList.add('dis'); el.onclick = () => { closeMenus(); if (!disabled.has(m[1])) command(m[1]); }; }
      else {
        el.onclick = (ev) => { ev.stopPropagation(); toggleMenu(el, m); };
      }
      mb.appendChild(el);
    });
  }
  function toggleMenu(el, m) {
    const was = openMenu === el; closeMenus(); if (was) return;
    openMenu = el; el.classList.add('open');
    const dr = document.createElement('div'); dr.className = 'drop';
    m[1].forEach((it) => {
      if (it === '-') { dr.appendChild(document.createElement('hr')); return; }
      const d = document.createElement('div'); d.className = 'it' + (disabled.has(it[1]) ? ' dis' : ''); d.innerHTML = lab(translateMarkup(it[0]));
      d.onclick = (ev) => { ev.stopPropagation(); closeMenus(); if (!disabled.has(it[1])) command(it[1]); };
      dr.appendChild(d);
    });
    el.appendChild(dr);
  }
  function closeMenus() { document.querySelectorAll('.drop').forEach((d) => d.remove()); document.querySelectorAll('.mi.open').forEach((e) => e.classList.remove('open')); openMenu = null; }
  document.addEventListener('click', closeMenus);
  function enableMenus(flag) { // 2590(): flag=1 game in progress
    [103, 106, 109].forEach((i) => (flag ? disabled.delete(i) : disabled.add(i)));
    flag ? disabled.add(104) : disabled.delete(104);
    S.active = !!flag; buildMenu();
  }

  // ---------- dialogs ---------------------------------------------------
  const px = (v) => v * 2 + 'px';
  function modal(wd, hd, opts) {
    const ov = $('#overlay'); ov.hidden = false;
    const win = $('#win').getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'dlg';
    d.style.width = px(wd); d.style.height = px(hd);
    const sc = $('#cv').getBoundingClientRect().width / 512;
    const pos = opts && opts.pos ? opts.pos : { x: win.left + (win.width - wd * 2 * sc) / 2, y: win.top + 60 * sc };
    d.style.left = pos.x + 'px'; d.style.top = pos.y + 'px';
    if (sc !== 1) { d.style.transform = 'scale(' + sc + ')'; d.style.transformOrigin = '0 0'; }
    ov.appendChild(d);
    const close = () => { d.remove(); if (!ov.children.length) ov.hidden = true; };
    return { d, close };
  }
  function add(d, tag, cls, x, y, w, h, html) {
    const e = document.createElement(tag); e.className = cls; e.style.left = px(x); e.style.top = px(y); e.style.width = px(w); e.style.height = px(h);
    e.style.lineHeight = h * 2 + 'px'; if (html != null) e.innerHTML = translateMarkup(html); d.appendChild(e); return e;
  }
  function msgbox(text, ok2) { // MessageBox, resolves true on OK
    return new Promise((res) => {
      const { d, close } = modal(150, 60);
      add(d, 'div', 'st mbtxt', 8, 8, 134, 24, text).style.lineHeight = '16px';
      const ok = add(d, 'button', 'btn def', ok2 ? 22 : 55, 40, 40, 14, 'OK'); ok.onclick = () => { close(); res(true); };
      if (ok2) { const c = add(d, 'button', 'btn', 88, 40, 40, 14, 'Cancel'); c.onclick = () => { close(); res(false); }; }
      ok.focus();
    });
  }
  const mb = (id, ok2) => msgbox(MSG[id], ok2);

  function dlgAbout() {
    return new Promise((res) => {
      const { d, close } = modal(162, 104);
      const L = [[8, 'Bang! Bang!'], [20, 'The Cannon-fire Game for'], [28, 'Microsoft Windows 3.0'], [40, 'Version 1.00'], [48, '(07-October-90)'], [88, 'Copyright © 1990, David B. Lutton II']];
      L.forEach(([y, t]) => add(d, 'div', 'st c', 6, y, 150, 8, t));
      const ic = add(d, 'img', '', 10, 12, 16, 16); ic.src = 'icons/icon-32.png'; ic.style.imageRendering = 'pixelated';
      const ok = add(d, 'button', 'btn def', 40, 66, 80, 14, 'OK'); ok.onclick = () => { close(); res(); };
    });
  }
  function dlgShare() {
    return new Promise((res) => {
      const { d, close } = modal(190, 116);
      [[8, 'This program is distributed as shareware.  It'], [16, 'may be copied and distributed freely, providing'], [24, 'no changes are made to the program.'], [40, 'If you like this program, and intend to keep a'], [48, "copy of it, please be supportive of the author's"], [56, 'efforts by sending a donation of $10 to:'], [100, 'Thank you for your support.']].forEach(([y, t]) => add(d, 'div', 'st', 12, y, 174, 8, t));
      const g = add(d, 'div', 'grp', 12, 68, 98, 28);
      [[70, 'David B. Lutton II'], [78, 'R.D. Box 1195'], [86, 'Cambridge,  VT   05444']].forEach(([y, t]) => add(d, 'div', 'st', 22, y, 85, 8, t));
      const ok = add(d, 'button', 'btn def', 135, 76, 32, 24, 'OK'); ok.onclick = () => { close(); res(); };
    });
  }
  function dlgEnd(team) {
    return new Promise((res) => {
      const { d, close } = modal(138, 64);
      add(d, 'div', 'st c', 4, 6, 130, 8, '...And thus the battle ends!!');
      add(d, 'div', 'st c', 4, 18, 130, 8, language === 'pt' ? 'A equipe ' + TEAM[team] + ' venceu!' : 'The ' + (team === 0 ? 'GREEN' : 'RED') + ' team is victorious!');
      add(d, 'div', 'st c', 4, 30, 130, 8, 'To the victor goes the spoils.');
      const ok = add(d, 'button', 'btn def', 42, 44, 52, 14, '<u>O</u>K'); ok.onclick = () => { close(); res(); };
    });
  }
  function dlgConfig() {
    return new Promise((res) => {
      const { d, close } = modal(152, 98);
      add(d, 'div', 'st c', 4, 4, 144, 8, 'Bang! Bang! Configuration');
      const hr = add(d, 'div', '', 6, 16, 140, 2, ''); hr.style.borderTop = '1px solid #808080'; hr.style.borderBottom = '1px solid #fff';
      const g1 = add(d, 'div', 'grp', 7, 22, 80, 48, '<span>Hit Accuracy</span>');
      const g2 = add(d, 'div', 'grp', 92, 22, 54, 48, '<span>Options</span>');
      const rads = ['<u>F</u>ine (Hardest)', '<u>M</u>edium', 'Coarse (<u>E</u>asiest)'].map((t, i) => {
        const r = add(d, 'label', 'rad', 12, 34 + 10 * i, 70, 10, '<input type="radio" name="acc"' + (S.accuracy === i ? ' checked' : '') + '>' + t); return r.firstChild; });
      const chk = [['<u>W</u>ind', S.windOpt], ['<u>D</u>ivots', S.divots], ['1 <u>P</u>layer', S.onePlayer]].map(([t, v], i) =>
        add(d, 'label', 'chk', 98, 34 + 10 * i, 44, 10, '<input type="checkbox"' + (v ? ' checked' : '') + '>' + t).firstChild);
      const ok = add(d, 'button', 'btn def', 25, 78, 44, 14, '<u>O</u>K'), cn = add(d, 'button', 'btn', 83, 78, 44, 14, '<u>C</u>ancel');
      ok.onclick = () => { S.accuracy = rads.findIndex((r) => r.checked); S.windOpt = +chk[0].checked; S.divots = +chk[1].checked; S.onePlayer = +chk[2].checked; close(); res(); };
      cn.onclick = () => { close(); res(); };
    });
  }
  // Fire control (modal, no cancel - like the original)
  function dlgFire() {
    return new Promise((res) => {
      const t = S.cur, w = 140;
      const win = $('#cv').getBoundingClientRect(), sc = win.width / 512;
      const x0 = (506 - w * 2) * t + 3;
      const { d, close } = modal(w, 68, { pos: { x: win.left + x0 * sc, y: win.top + 3 * sc } });
      add(d, 'div', 'st c', 18, 2, 102, 10, (language === 'pt' ? 'Canhão ' + TEAM[t] + ' - Controle de tiro' : (t === 0 ? 'GREEN' : 'RED') + ' Cannon Fire Control')).style.left = '0';
      d.lastChild.style.width = '100%';
      add(d, 'div', 'st r', 10, 16, 28, 8, 'Angle'); add(d, 'div', 'st r', 10, 32, 29, 8, 'Velocity');
      const ea = add(d, 'input', 'edt', 59, 14, 25, 12), ev = add(d, 'input', 'edt', 59, 30, 25, 12);
      ea.style.lineHeight = ev.style.lineHeight = 'normal';
      const bt = (id, x, y, tx) => { const b = add(d, 'button', 'btn', x, y, 15, 12, tx); return b; };
      const ap = bt(201, 43, 14, '+'), am = bt(203, 85, 14, '−'), vp = bt(204, 43, 30, '+'), vm = bt(206, 85, 30, '−');
      const fire = add(d, 'button', 'btn def', 44, 46, 56, 16, 'Fire!');
      const c1 = add(d, 'div', '', 10, 46, 30, 16), c2 = add(d, 'div', '', 103, 46, 30, 16);
      c1.style.background = c2.style.background = TCOL[t]; c1.style.border = c2.style.border = '1px solid #000';
      const radios = ['0.1', '1', '10'].map((tx, i) => add(d, 'label', 'rad', 108, 12 + 10 * i, 24, 10, '<input type="radio" name="st"' + (S.step[t] === i ? ' checked' : '') + '>' + tx).firstChild);
      const show = () => { ea.value = S.ang[t].toFixed(2); ev.value = S.vel[t].toFixed(2); };
      const read = () => { // 11ae: read radios + edits (stored as float32 like sscanf %f)
        S.step[t] = Math.max(0, radios.findIndex((r) => r.checked));
        const a = parseFloat(ea.value), v = parseFloat(ev.value);
        if (!isNaN(a)) S.ang[t] = Math.fround(a); if (!isNaN(v)) S.vel[t] = Math.fround(v);
      };
      const st = () => E.STEPS[S.step[t]];
      ap.onclick = () => { read(); const n = S.ang[t] + st(); if (n > 95) { beep(); S.ang[t] = 95; } else S.ang[t] = n; show(); };
      am.onclick = () => { read(); if (st() > S.ang[t]) { beep(); S.ang[t] = 0; } else S.ang[t] -= st(); show(); };
      vp.onclick = () => { read(); const n = S.vel[t] + st(); if (n > 900) { beep(); S.vel[t] = 900; } else S.vel[t] = n; show(); };
      vm.onclick = () => { read(); const n = S.vel[t] - st(); if (n < 50) { beep(); S.vel[t] = 50; } else S.vel[t] = n; show(); };
      fire.onclick = async () => {
        read();
        if (!(S.ang[t] >= 0 && S.ang[t] <= 95)) { await mb(7); show(); return; }
        if (!(S.vel[t] >= 50 && S.vel[t] <= 900)) { await mb(8); show(); return; }
        close(); res();
      };
      show(); fire.focus();
    });
  }
  // Open / Save "file" dialogs (browser storage + import/export of the original 1114-byte .SAV format)
  const KEY = 'bangbang.sav.';
  const listSaves = () => Object.keys(localStorage).filter((k) => k.startsWith(KEY)).map((k) => k.slice(KEY.length)).sort();
  const b64 = (u8) => btoa(String.fromCharCode(...u8)), unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  function dlgFile(save) {
    return new Promise((res) => {
      const { d, close } = modal(150, 138);
      add(d, 'div', 'st', 10, 8, 80, 10, save ? 'Save File &Name:'.replace('&', '') : 'Open File Name:');
      const ed = add(d, 'input', 'edt', 10, 18, 130, 12); ed.style.lineHeight = 'normal'; ed.value = save ? 'BANGBANG.SAV' : '*.SAV';
      add(d, 'div', 'st', 10, 36, 20, 8, 'Path:'); add(d, 'div', 'st', 32, 36, 108, 8, 'C:\\BANGBANG');
      const ls = add(d, 'div', 'lst', 10, 46, 76, 81); ls.style.lineHeight = '16px';
      const fill = () => { ls.innerHTML = ''; listSaves().forEach((n) => { const r = document.createElement('div'); r.textContent = n; r.onclick = () => { ed.value = n; ls.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); r.classList.add('sel'); }; r.ondblclick = () => go.onclick(); ls.appendChild(r); }); };
      fill();
      const go = add(d, 'button', 'btn def', 100, 90 - 22, 40, 14, save ? '<u>S</u>ave' : '<u>O</u>pen'), cn = add(d, 'button', 'btn', 100, 90, 40, 14, '<u>C</u>ancel');
      const ex = add(d, 'button', 'btn', 100, 112, 40, 14, save ? 'Export' : 'Import');
      const norm = (n) => { n = n.trim().toUpperCase(); if (!n || n.includes('*')) return ''; return /\.[A-Z0-9]{1,3}$/.test(n) ? n : n + '.SAV'; };
      go.onclick = async () => {
        const n = norm(ed.value); if (!n) { await mb(9); return; }
        if (save) {
          if (localStorage[KEY + n] && !(await mb(15, true))) return;
          try { localStorage[KEY + n] = b64(E.serialize(S)); } catch (e) { await mb(12); return; }
          close(); res(true);
        } else {
          const s = localStorage[KEY + n]; if (!s) { await mb(11); return; }
          if (!E.deserialize(S, unb64(s))) { await mb(13); return; }
          close(); res(true);
        }
      };
      cn.onclick = () => { close(); res(false); };
      ex.onclick = () => {
        if (save) { const a = document.createElement('a'); const n = norm(ed.value) || 'BANGBANG.SAV'; a.href = URL.createObjectURL(new Blob([E.serialize(S)])); a.download = n; a.click(); }
        else { const f = document.createElement('input'); f.type = 'file'; f.accept = '.sav,.SAV'; f.onchange = async () => { const u = new Uint8Array(await f.files[0].arrayBuffer()); if (!E.deserialize(S, u)) { await mb(13); return; } close(); res(true); }; f.click(); }
      };
    });
  }
  function dlgHelp() {
    return new Promise((res) => {
      const { d, close } = modal(190, 150);
      add(d, 'div', 'st c', 4, 4, 182, 8, 'Bang! Bang! Help');
      const t = add(d, 'div', 'st', 10, 18, 172, 100, 'Two cannons face each other across a hill. Each player in turn picks an angle (0-95°) and a velocity (50-900 km/h) with the Aim! menu, then presses Fire!. The wind (Game > Configure) pushes the shot; the flags show its direction. A shot that lands near the enemy cannon destroys it and you win. Divots dig craters. Hit Accuracy sets how near the shot must land. 1 Player keeps the same cannon firing.');
      t.style.whiteSpace = 'normal'; t.style.lineHeight = '16px';
      const ok = add(d, 'button', 'btn def', 75, 128, 40, 14, 'OK'); ok.onclick = () => { close(); res(); };
    });
  }

  // ---------- game flow -------------------------------------------------
  function fresh() { E.newGame(S, rand); redrawBase(); updateStatus(); }
  async function shot() {
    busy = true; ended = false;
    const sh = E.startShot(S);
    const spf = () => +$('#speed').value;
    let alive = true;
    ball = { x: sh.xi, y: FLOOR - sh.yi }; present();
    while (alive) {
      for (let i = 0; i < spf() && alive; i++) alive = E.stepShot(S, sh);
      ball = { x: sh.xi, y: FLOOR - sh.yi }; present(); await frame();
    }
    ball = null; present(); await sleep(50);
    if (E.landed(S, sh)) {
      bang = { x: sh.xi, y: sh.impactRow }; present(); await sleep(300); bang = null;
      E.checkHit(S, sh);
      if (E.carve(S, sh)) redrawBase();
      if (sh.hit) {
        const o = S.team[S.other];
        enableMenus(0);
        extra = [{ id: 15, x: o.x, y: o.row - 32 }]; present(); o.dead = 1; await sleep(500); extra = [];
        redrawBase(); await dlgEnd(S.cur); ended = true; busy = false; return;
      }
    }
    redrawBase();
    if (!S.onePlayer) { S.cur ^= 1; S.other = S.cur ^ 1; }
    updateStatus(); busy = false;
  }
  async function command(id) {
    if (busy || !$('#overlay').hidden) return;
    switch (id) {
      case 100: await dlgAbout(); await dlgShare(); break;
      case 101: if (S.active && !(await mb(14, true))) break; closeApp(); break;
      case 102: fresh(); enableMenus(1); break;
      case 103: await dlgFire(); await shot(); break;
      case 104: await dlgConfig(); break;
      case 105: if (S.active && !(await mb(14, true))) break; if (await dlgFile(false)) { enableMenus(1); redrawBase(); updateStatus(); } break;
      case 106: await dlgFile(true); break;
      case 107: case 108: await dlgHelp(); break;
      case 109: enableMenus(0); break;
    }
  }
  function closeApp() {
    $('#win').style.display = 'none'; $('#tools').style.display = 'none';
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Reabrir Bang! Bang!'; b.style.cssText = 'padding:6px 14px;font:bold 14px Arial';
    b.onclick = () => { b.remove(); $('#win').style.display = ''; $('#tools').style.display = ''; };
    $('#desk').appendChild(b);
  }
  document.addEventListener('keydown', (e) => {
    if (!$('#overlay').hidden) { if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName === 'INPUT') { const df = $('#overlay .btn.def:last-of-type') ; } return; }
    if (e.altKey) { const k = e.key.toLowerCase(); const i = { f: 0, g: 1, h: 3 }[k]; if (k === 'a') { e.preventDefault(); if (!disabled.has(103)) command(103); } else if (i != null) { e.preventDefault(); document.querySelectorAll('.mi')[i].click(); } }
  });

  // ---------- idioma e tela cheia ---------------------------------------
  const langSelect = $('#language'); langSelect.value = language;
  langSelect.addEventListener('change', () => {
    language = langSelect.value; localStorage.setItem('bb-language', language);
    $('#fullscreen').querySelector('span:last-child').textContent = language === 'pt' ? (document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia') : (document.fullscreenElement ? 'Exit full screen' : 'Full screen');
    $('.side-title').textContent = language === 'pt' ? 'Painel do jogo' : 'Game panel';
    $('.side-subtitle').textContent = language === 'pt' ? 'PREFERÊNCIAS' : 'PREFERENCES';
    $('.section-title').textContent = language === 'pt' ? 'EXIBIÇÃO' : 'DISPLAY';
    $('.tool-label[for=language]').textContent = language === 'pt' ? 'Idioma' : 'Language';
    $('.tool-label[for=speed]').firstChild.textContent = language === 'pt' ? 'Velocidade do tiro ' : 'Shot speed ';
    $('.range-hints').innerHTML = language === 'pt' ? '<span>Lento</span><span>Rápido</span>' : '<span>Slow</span><span>Fast</span>';
    $('#next').textContent = language === 'pt' ? 'Próximo tiro:' : 'Next shot:';
    buildMenu(); updateStatus();
  });
  const fsButton = $('#fullscreen');
  fsButton.addEventListener('click', async () => {
    try { if (!document.fullscreenElement) await $('#desk').requestFullscreen(); else await document.exitFullscreen(); }
    catch (err) { /* tela cheia pode ser bloqueada pelo navegador */ }
  });
  document.addEventListener('fullscreenchange', () => { fsButton.querySelector('span:last-child').textContent = language === 'pt' ? (document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia') : (document.fullscreenElement ? 'Exit full screen' : 'Full screen'); });
  $('.side-title').textContent = language === 'pt' ? 'Painel do jogo' : 'Game panel';
  $('.side-subtitle').textContent = language === 'pt' ? 'PREFERÊNCIAS' : 'PREFERENCES';
  $('.section-title').textContent = language === 'pt' ? 'EXIBIÇÃO' : 'DISPLAY';
  $('.tool-label[for=language]').textContent = language === 'pt' ? 'Idioma' : 'Language';
  $('.tool-label[for=speed]').firstChild.textContent = language === 'pt' ? 'Velocidade do tiro ' : 'Shot speed ';
  $('.range-hints').innerHTML = language === 'pt' ? '<span>Lento</span><span>Rápido</span>' : '<span>Slow</span><span>Fast</span>';
  $('#next').textContent = language === 'pt' ? 'Próximo tiro:' : 'Next shot:';
  $('#speed-value').textContent = $('#speed').value;
  $('#speed').addEventListener('input', () => { $('#speed-value').textContent = $('#speed').value; });

  // ---------- boot ------------------------------------------------------
  let n = 0; const names = Object.keys(window.ASSETS);
  names.forEach((k) => { const im = new Image(); im.onload = () => { if (++n === names.length) boot(); }; im.src = 'data:image/png;base64,' + window.ASSETS[k].png; IMG[k] = im; });
  function boot() {
    buildMenu(); fresh();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
