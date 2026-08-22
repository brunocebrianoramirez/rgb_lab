/* ============================================================
   rgb_lab — LABORATÓRIO 03 · TIPOGRAFIA
   Cada letra é um objeto com transformação própria.
   Ferramentas nomeadas alteram o conjunto; o inspetor abre o detalhe.
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var T = VE.type = {};
  var cv, cx, W = 1080, H = 1080, raf = null, t0 = performance.now();
  /* `filter` no canvas 2D é o que dá desfoque e giro de matiz por letra.
     Onde não existir, as animações continuam — só sem esses dois.      */
  var SUPORTA_FILTRO = (function () {
    try {
      var c = document.createElement('canvas').getContext('2d');
      return typeof c.filter === 'string';
    } catch (e) { return false; }
  })();
  var mouse = { x: -9999, y: -9999, down: false };
  var selLetter = -1;

  /* As famílias marcadas com "proc" são desenhadas por código (js/typefaces.js):
     esqueleto de traço + parâmetros. São originais do laboratório e, por serem
     traço, podem ser ESCRITAS letra a letra na animação.                      */
  var FONTS = [
    { n: 'ARCHIVO', f: '"Archivo", Helvetica, Arial, sans-serif' },
    { n: 'MONO', f: '"JetBrains Mono", ui-monospace, monospace' },
    { n: 'ARIAL', f: 'Arial, Helvetica, sans-serif' },
    { n: 'TIMES', f: '"Times New Roman", Times, serif' },
    { n: 'GEORGIA', f: 'Georgia, serif' },
    { n: 'COURIER', f: '"Courier New", monospace' }
  ];
  (VE.typefaces ? VE.typefaces.FACES : []).forEach(function (fc) {
    FONTS.push({ n: fc.n, f: '"Archivo", sans-serif', proc: fc.id, desc: fc.desc });
  });

  function faceId() { return FONTS[P.font] && FONTS[P.font].proc; }
  function isProc() { return !!faceId(); }
  /* corpo do traço: as famílias de código medem pela altura da maiúscula */
  function capSize() { return size() * 0.72; }
  /* o peso do painel (200..700) vira multiplicador do traço */
  function procWeightK() { return 0.40 + (P.weight / 700) * 1.15; }

  var P = T.params = {
    text: 'rgb_lab',
    font: 0, weight: 700, size: 230, tracking: 0, leading: 1, align: 1, caseMode: 1, autofit: 1,
    waveAmp: 0, waveFreq: 1.2, waveSpeed: 0.6,
    rotAmp: 0, rotFreq: 1,
    scaleAmp: 0, scaleFreq: 1,
    jitPos: 0, jitRot: 0, jitScale: 0, seed: 7,
    repeat: 1, repDx: 12, repDy: 12, repRot: 0, repScale: 1, repFade: 0.5,
    outline: 0, fill: 1,
    shX: 0, shY: 0, shBlur: 0,
    slice: 0, sliceOff: 0, sliceProb: 0.5,
    rgb: 0,
    colorMode: 0, c1: '#16150f', c2: '#d0271b', shColor: '#f5d000',
    bg: '#efede4', bgAlpha: 0,
    mouseK: 0, mouseR: 260,
    stroke: 4,
    /* ESCRITA — só nas famílias de traço: a letra é desenhada de verdade */
    writeMode: 0,        /* 0 nada · 1 escrita · 2 máquina de escrever · 3 desmonte */
    writeDur: 2.6,       /* segundos para o texto inteiro */
    writeStagger: 0.08,  /* 0 = uma letra por vez · 1 = todas juntas */
    writeLoop: 1,
    writePen: 1,         /* mostra a ponta da caneta enquanto escreve */
    /* ================================================== ANIMAÇÃO DE TEXTO
       Três camadas independentes, como nos editores de celular:
         ENTRADA  como cada letra chega ao lugar
         LAÇO     o que ela faz enquanto está lá
         SAÍDA    como ela vai embora
       As três se somam. A ORDEM decide quem entra primeiro: da esquerda,
       da direita, do meio para fora, das pontas para o meio ou sorteada.  */
    entryMode: 0,
    entryDur: 1.1,
    entryStagger: 0.06,
    entryAmp: 1,
    entryOrder: 0,       /* 0 →  · 1 ←  · 2 do meio · 3 para o meio · 4 sorteada */
    exitMode: 0,
    exitDur: 0.9,
    exitStagger: 0.05,
    exitAmp: 1,
    loopMode: 0,
    loopAmp: 1,
    loopSpeed: 1,
    animDur: 4           /* duração total da peça — a saída acontece no fim */
  };

  /* nomes das três listas, usados no inspetor e nas ferramentas */
  T.ENTRADAS = [
    'Nenhuma', 'Salto (mola)', 'Giro', 'Estouro', 'Subir do rodapé', 'Aparecer',
    'Cair do topo', 'Deslizar da esquerda', 'Deslizar da direita', 'Sair do desfoque',
    'Máquina de escrever', 'Cortina de baixo', 'Virar (eixo vertical)', 'Elástico',
    'Persiana', 'Cascata', 'Rolar', 'Espremer', 'Chegar tremendo', 'Desenrolar'
  ];
  T.SAIDAS = [
    'Nenhuma', 'Sumir', 'Cair', 'Subir', 'Encolher', 'Explodir', 'Entrar no desfoque',
    'Deslizar para a esquerda', 'Deslizar para a direita', 'Girar e sumir',
    'Cortina para cima', 'Apagar letra a letra'
  ];
  T.LACOS = [
    'Nenhum', 'Onda', 'Tremor', 'Pulso', 'Piscar', 'Arco-íris',
    'Flutuar', 'Respirar', 'Neon', 'Letreiro (correr)', 'Balançar'
  ];

  var letters = [];   /* {ch, ox, oy, dx, dy, rot, scale, color, line, i} */

  /* ---------------- histórico (ctrl+z / ctrl+y) ---------------- */
  var hist = [], hidx = -1, histTimer = null;

  function snapshot() {
    return JSON.stringify({
      p: P,
      l: letters.map(function (L) {
        return { ch: L.ch, dx: L.dx, dy: L.dy, rot: L.rot, scale: L.scale, color: L.color };
      })
    });
  }

  T.push = function () {
    var s = snapshot();
    if (hidx >= 0 && hist[hidx] === s) return;
    hist = hist.slice(0, hidx + 1);
    hist.push(s);
    if (hist.length > 60) hist.shift();
    hidx = hist.length - 1;
  };

  T.pushLater = function () {
    clearTimeout(histTimer);
    histTimer = setTimeout(T.push, 400);
  };

  function restoreState(s) {
    var o = JSON.parse(s);
    Object.keys(o.p).forEach(function (k) { P[k] = o.p[k]; });
    var ta = $('#tyText');
    if (ta) ta.value = P.text;
    build();
    (o.l || []).forEach(function (sv, i) {
      if (!letters[i]) return;
      letters[i].dx = sv.dx; letters[i].dy = sv.dy;
      letters[i].rot = sv.rot; letters[i].scale = sv.scale; letters[i].color = sv.color;
    });
    renderLetterChips();
    T.renderInspector();
  }

  T.undo = function () {
    if (hidx <= 0) return false;
    hidx--; restoreState(hist[hidx]); return true;
  };
  T.redo = function () {
    if (hidx >= hist.length - 1) return false;
    hidx++; restoreState(hist[hidx]); return true;
  };

  /* ---------------- ferramentas ---------------- */
  /* g = grupo na lista lateral: 'forma' mexe no desenho, 'anim' no tempo */
  var TOOLS = [
    { id: 'reset', g: 'forma', n: 'BASE', d: 'linha limpa', set: { waveAmp: 0, rotAmp: 0, scaleAmp: 0, jitPos: 0, jitRot: 0, jitScale: 0, repeat: 1, slice: 0, rgb: 0, outline: 0, fill: 1 } },
    { id: 'onda', g: 'forma', n: 'ONDA', d: 'senoide vertical', set: { waveAmp: 70, waveFreq: 1.4, waveSpeed: 0.8, rotAmp: 12, rotFreq: 1.4 } },
    { id: 'explosao', g: 'forma', n: 'EXPLOSÃO', d: 'espalha as letras', set: { jitPos: 90, jitRot: 26, jitScale: 0.35 } },
    { id: 'escada', g: 'forma', n: 'ESCADA', d: 'degraus regulares', set: { waveAmp: 0, jitPos: 0, rotAmp: 0, scaleAmp: 0 }, custom: 'stairs' },
    { id: 'rastro', g: 'forma', n: 'RASTRO', d: 'repetição em fuga', set: { repeat: 8, repDx: 18, repDy: 10, repRot: 2, repScale: 1.02, repFade: 0.72 } },
    { id: 'contorno', g: 'forma', n: 'CONTORNO', d: 'só a linha', set: { outline: 1, fill: 0, stroke: 3 } },
    { id: 'corte', g: 'forma', n: 'CORTE', d: 'fatias deslocadas', set: { slice: 9, sliceOff: 26, sliceProb: 0.7 } },
    { id: 'rgb', g: 'forma', n: 'RGB', d: 'separação de canais', set: { rgb: 14 } },
    { id: 'pilha', g: 'forma', n: 'PILHA', d: 'uma letra por linha', custom: 'stack' },
    { id: 'espelho', g: 'forma', n: 'ESPELHO', d: 'reflexo invertido', custom: 'mirror' },
    { id: 'peso', g: 'forma', n: 'PESO', d: 'variação de escala', set: { scaleAmp: 0.45, scaleFreq: 1.1 } },
    { id: 'imã', g: 'forma', n: 'ÍMÃ', d: 'reage ao cursor', set: { mouseK: 120, mouseR: 320 } },
    /* ---- animações de traço: só valem nas famílias LAB (desenhadas por código) ---- */
    { id: 'escrita', g: 'anim', n: 'ESCRITA À MÃO', d: 'a letra é desenhada', needsProc: 1, face: 'lab-script', set: { writeMode: 1, writeDur: 2.8, writeStagger: 0.05, writeLoop: 1, writePen: 1, entryMode: 0 } },
    { id: 'marcador', g: 'anim', n: 'MARCADOR', d: 'escrita de ponta grossa', needsProc: 1, face: 'lab-marker', set: { writeMode: 1, writeDur: 2.2, writeStagger: 0.04, writeLoop: 1, writePen: 1 } },
    { id: 'pincel', g: 'anim', n: 'PINCEL', d: 'pressão de mão no traço', needsProc: 1, face: 'lab-brush', set: { writeMode: 1, writeDur: 3.2, writeStagger: 0.06, writeLoop: 1, writePen: 0 } },
    { id: 'maquina', g: 'anim', n: 'MÁQUINA', d: 'uma letra por vez, seca', needsProc: 1, set: { writeMode: 2, writeDur: 2.0, writeStagger: 0, writeLoop: 1, writePen: 0 } },
    { id: 'desmonte', g: 'anim', n: 'DESMONTE', d: 'o traço se apaga', needsProc: 1, set: { writeMode: 3, writeDur: 2.4, writeStagger: 0.1, writeLoop: 1, writePen: 0 } },
    { id: 'salto', g: 'anim', n: 'SALTO', d: 'cada letra cai com mola', set: { entryMode: 1, entryDur: 1.1, entryStagger: 0.05, entryAmp: 1 } },
    { id: 'giro', g: 'anim', n: 'GIRO', d: 'entram girando', set: { entryMode: 2, entryDur: 1.2, entryStagger: 0.05, entryAmp: 1 } },
    { id: 'estouro', g: 'anim', n: 'ESTOURO', d: 'estouram de dentro', set: { entryMode: 3, entryDur: 0.9, entryStagger: 0.04, entryAmp: 1 } },
    { id: 'subida', g: 'anim', n: 'SUBIDA', d: 'sobem do rodapé', set: { entryMode: 4, entryDur: 1.3, entryStagger: 0.06, entryAmp: 1 } },

    /* ---- ENTRADAS: o repertório que se espera de um editor de vídeo ----
       Cada uma é um jogo pronto de entrada + ordem + tempo. Depois de
       aplicar, tudo continua editável no inspetor.                      */
    { id: 'e_queda', g: 'anim', n: 'QUEDA', d: 'caem do topo, uma a uma', set: { entryMode: 6, entryDur: 0.9, entryStagger: 0.07, entryAmp: 1, entryOrder: 0 } },
    { id: 'e_esq', g: 'anim', n: 'ENTRA ESQ', d: 'deslizam da esquerda', set: { entryMode: 7, entryDur: 0.9, entryStagger: 0.05, entryAmp: 1, entryOrder: 0 } },
    { id: 'e_dir', g: 'anim', n: 'ENTRA DIR', d: 'deslizam da direita', set: { entryMode: 8, entryDur: 0.9, entryStagger: 0.05, entryAmp: 1, entryOrder: 1 } },
    { id: 'e_foco', g: 'anim', n: 'FOCO', d: 'saem do desfoque', set: { entryMode: 9, entryDur: 1.1, entryStagger: 0.04, entryAmp: 1 } },
    { id: 'e_maquina', g: 'anim', n: 'DATILOGRAFIA', d: 'uma letra por vez, seca', set: { entryMode: 10, entryDur: 1.6, entryStagger: 0.12, entryOrder: 0 } },
    { id: 'e_cortina', g: 'anim', n: 'CORTINA', d: 'a letra é revelada de baixo', set: { entryMode: 11, entryDur: 1.0, entryStagger: 0.06 } },
    { id: 'e_virar', g: 'anim', n: 'VIRAR', d: 'giram no eixo vertical', set: { entryMode: 12, entryDur: 0.9, entryStagger: 0.06 } },
    { id: 'e_elastico', g: 'anim', n: 'ELÁSTICO', d: 'esticam e assentam', set: { entryMode: 13, entryDur: 1.2, entryStagger: 0.05, entryAmp: 1 } },
    { id: 'e_persiana', g: 'anim', n: 'PERSIANA', d: 'abrem em faixas', set: { entryMode: 14, entryDur: 1.0, entryStagger: 0.05 } },
    { id: 'e_cascata', g: 'anim', n: 'CASCATA', d: 'caem em leque', set: { entryMode: 15, entryDur: 1.1, entryStagger: 0.12, entryAmp: 1, entryOrder: 0 } },
    { id: 'e_rolar', g: 'anim', n: 'ROLAR', d: 'entram rolando', set: { entryMode: 16, entryDur: 1.1, entryStagger: 0.05, entryAmp: 1 } },
    { id: 'e_espremer', g: 'anim', n: 'ESPREMER', d: 'abrem na horizontal', set: { entryMode: 17, entryDur: 0.8, entryStagger: 0.05 } },
    { id: 'e_tremer', g: 'anim', n: 'CHEGAR TREMENDO', d: 'chegam tremendo', set: { entryMode: 18, entryDur: 1.0, entryStagger: 0.04, entryAmp: 1 } },
    { id: 'e_meio', g: 'anim', n: 'DO MEIO', d: 'do centro para as pontas', set: { entryMode: 3, entryDur: 1.0, entryStagger: 0.09, entryOrder: 2 } },

    /* ---- SAÍDAS ---- */
    { id: 's_sumir', g: 'anim', n: 'SAÍDA · SUMIR', d: 'desaparecem no lugar', set: { exitMode: 1, exitDur: 0.8, exitStagger: 0.05, animDur: 4 } },
    { id: 's_cair', g: 'anim', n: 'SAÍDA · CAIR', d: 'caem para fora', set: { exitMode: 2, exitDur: 0.9, exitStagger: 0.06, animDur: 4 } },
    { id: 's_explodir', g: 'anim', n: 'SAÍDA · EXPLODIR', d: 'crescem e somem', set: { exitMode: 5, exitDur: 0.7, exitStagger: 0.04, animDur: 4 } },
    { id: 's_desfoque', g: 'anim', n: 'SAÍDA · DESFOQUE', d: 'entram no desfoque', set: { exitMode: 6, exitDur: 0.9, exitStagger: 0.05, animDur: 4 } },
    { id: 's_apagar', g: 'anim', n: 'SAÍDA · APAGAR', d: 'apagam letra a letra', set: { exitMode: 11, exitDur: 1.2, exitStagger: 0.12, animDur: 4 } },

    /* ---- LAÇOS: o que a letra faz enquanto está na tela ---- */
    { id: 'l_onda', g: 'anim', n: 'LAÇO · ONDA', d: 'sobem e descem em fase', set: { loopMode: 1, loopAmp: 1, loopSpeed: 1 } },
    { id: 'l_tremor', g: 'anim', n: 'LAÇO · TREMOR', d: 'vibram no lugar', set: { loopMode: 2, loopAmp: 1, loopSpeed: 1 } },
    { id: 'l_pulso', g: 'anim', n: 'LAÇO · PULSO', d: 'batem como coração', set: { loopMode: 3, loopAmp: 1, loopSpeed: 1 } },
    { id: 'l_piscar', g: 'anim', n: 'LAÇO · PISCAR', d: 'piscam fora de compasso', set: { loopMode: 4, loopAmp: 1, loopSpeed: 1 } },
    { id: 'l_arco', g: 'anim', n: 'LAÇO · ARCO-ÍRIS', d: 'o matiz corre pelas letras', set: { loopMode: 5, loopSpeed: 1 } },
    { id: 'l_flutuar', g: 'anim', n: 'LAÇO · FLUTUAR', d: 'boiam devagar', set: { loopMode: 6, loopAmp: 1, loopSpeed: 0.7 } },
    { id: 'l_respirar', g: 'anim', n: 'LAÇO · RESPIRAR', d: 'crescem e voltam', set: { loopMode: 7, loopAmp: 1, loopSpeed: 0.6 } },
    { id: 'l_neon', g: 'anim', n: 'LAÇO · NEON', d: 'falham como letreiro velho', set: { loopMode: 8, loopSpeed: 1 } },
    { id: 'l_letreiro', g: 'anim', n: 'LAÇO · LETREIRO', d: 'atravessam o quadro', set: { loopMode: 9, loopAmp: 1, loopSpeed: 1 } },
    { id: 'l_balancar', g: 'anim', n: 'LAÇO · BALANÇAR', d: 'giram de leve, sem sair', set: { loopMode: 10, loopAmp: 1, loopSpeed: 1 } },

    /* ---- combinações prontas ---- */
    { id: 'c_titulo', g: 'anim', n: 'TÍTULO', d: 'entra do desfoque, respira, some', set: { entryMode: 9, entryDur: 1.0, entryStagger: 0.04, loopMode: 7, loopAmp: 0.6, loopSpeed: 0.5, exitMode: 1, exitDur: 0.8, animDur: 5 } },
    { id: 'c_legenda', g: 'anim', n: 'LEGENDA', d: 'datilografa e apaga', set: { entryMode: 10, entryDur: 1.4, entryStagger: 0.12, exitMode: 11, exitDur: 1.0, exitStagger: 0.1, animDur: 5 } },
    { id: 'c_impacto', g: 'anim', n: 'IMPACTO', d: 'estoura, treme e explode', set: { entryMode: 3, entryDur: 0.55, entryStagger: 0.03, loopMode: 2, loopAmp: 0.35, loopSpeed: 1, exitMode: 5, exitDur: 0.5, animDur: 3 } },
    { id: 'c_cartaz', g: 'anim', n: 'CARTAZ', d: 'persiana, arco-íris e cortina', set: { entryMode: 14, entryDur: 1.0, entryStagger: 0.06, loopMode: 5, loopSpeed: 0.8, exitMode: 10, exitDur: 0.9, animDur: 6 } }
  ];

  /* ---------------- inicialização ---------------- */
  T.init = function () {
    cv = $('#tyCanvas');
    cx = cv.getContext('2d');
    setSize('1080x1080');

    $('#tyText').addEventListener('input', function () { P.text = this.value; build(); T.pushLater(); });
    $('#tySize').addEventListener('change', function () { setSize(this.value); });
    $('#tyAlpha').addEventListener('change', function () { P.bgAlpha = this.checked ? 1 : 0; });
    $('#tyExplode').addEventListener('click', function () { applyTool('explosao'); });
    $('#tyReset').addEventListener('click', function () { applyTool('reset'); });
    $('#tyRandom').addEventListener('click', randomize);
    $('#tyPng').addEventListener('click', exportPng);
    $('#tySvg').addEventListener('click', exportSvg);
    $('#tySeq').addEventListener('click', exportSequence);
    $('#tyToTimeline').addEventListener('click', sendToTimeline);

    renderTools();
    var tsearch = $('#tySearch');
    if (tsearch) tsearch.addEventListener('input', function () {
      toolSearch = tsearch.value.toLowerCase();
      renderTools();
    });

    cv.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width * W;
      mouse.y = (e.clientY - r.top) / r.height * H;
    });
    cv.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    cv.addEventListener('pointerdown', function (e) {
      var r = cv.getBoundingClientRect();
      var mx = (e.clientX - r.left) / r.width * W, my = (e.clientY - r.top) / r.height * H;
      var best = -1, bd = 1e9;
      letters.forEach(function (L, i) {
        var d = Math.hypot(L.ox + L.dx - mx, L.oy + L.dy - my);
        if (d < bd) { bd = d; best = i; }
      });
      if (bd < size() * 0.7) { selLetter = best; renderLetterChips(); T.renderInspector(); }
    });

    build();
    T.push();
    renderPresets();
    VE.on('presets', renderPresets);
    loop();
  };

  function setSize(v) {
    var p = v.split('x');
    W = +p[0]; H = +p[1];
    cv.width = W; cv.height = H;
    build();
  }

  /* ---------------- construção das letras ---------------- */
  function caseText(s) {
    if (P.caseMode === 1) return s.toUpperCase();
    if (P.caseMode === 2) return s.toLowerCase();
    if (P.caseMode === 3) return Array.from(s).map(function (c, i) { return i % 2 ? c.toLowerCase() : c.toUpperCase(); }).join('');
    return s;
  }

  function rnd(i, salt) {
    var x = Math.sin((i + 1) * 12.9898 + P.seed * 78.233 + (salt || 0) * 3.17) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  }

  /* ---------------- lista lateral de ferramentas ----------------
     São 21: sem agrupar e sem rolagem, a lista media 809px numa coluna de
     644 e empurrava a saída para fora da tela.                          */
  var toolSearch = '';
  var TOOLGROUPS = [
    { g: 'forma', label: 'FORMA · desenho da letra' },
    { g: 'anim', label: 'ANIMAÇÃO · a letra no tempo' }
  ];

  function renderTools() {
    var box = $('#tyTools');
    if (!box) return;
    var hits = TOOLS.filter(function (t) {
      if (!toolSearch) return true;
      return (t.n + ' ' + t.d).toLowerCase().indexOf(toolSearch) >= 0;
    });
    var cnt = $('#tyToolCount');
    if (cnt) cnt.textContent = String(hits.length).padStart(2, '0');

    var h = '';
    TOOLGROUPS.forEach(function (grp) {
      var list = hits.filter(function (t) { return (t.g || 'forma') === grp.g; });
      if (!list.length) return;
      h += '<div class="tygroup">' + grp.label + '<i></i>' + list.length + '</div>';
      list.forEach(function (t) {
        h += '<button class="fxitem" data-tool="' + t.id + '" title="' + t.d + '">' +
          '<span class="fxno">' + String(TOOLS.indexOf(t) + 1).padStart(2, '0') + '</span>' +
          '<span class="fxtxt"><span class="fxnm">' + t.n + '</span>' +
          '<span class="fxds">' + t.d + '</span></span>' +
          (t.needsProc ? '<span class="fxreq">LAB</span>' : '<span class="fxcat" style="background:var(--ch-type)"></span>') +
          '</button>';
      });
    });
    box.innerHTML = h || '<div class="insp-empty">nada encontrado</div>';
    box.querySelectorAll('[data-tool]').forEach(function (b) {
      b.addEventListener('click', function () { applyTool(b.dataset.tool); });
    });
  }
  T.renderTools = renderTools;

  /* largura de um caractere na família atual */
  function measureCh(ch) {
    if (isProc()) return VE.typefaces.advance(faceId(), ch, 0) * capSize() / 100;
    return cx.measureText(ch).width;
  }

  /* comprimentos de traço acumulados — repartem o tempo de escrita */
  var writeLens = [], writeTotal = 0;
  function computeWriteLens() {
    writeLens = []; writeTotal = 0;
    if (!isProc()) return;
    var fid = faceId();
    letters.forEach(function (L) {
      var len = L.ch === ' ' ? 0 : VE.typefaces.glyphLength(fid, L.ch);
      writeLens.push({ start: writeTotal, len: len });
      writeTotal += len;
    });
  }

  /* 0..1 — quanto desta letra já foi escrita neste instante */
  function writeProgress(i, time) {
    if (!P.writeMode || !isProc() || !writeTotal) return 1;
    var D = Math.max(0.1, P.writeDur);
    var tt = P.writeLoop ? (time % (D * 1.35)) : time;
    var w = writeLens[i] || { start: 0, len: 0 };
    var s0 = w.start / writeTotal;
    var span = Math.max(0.0001, w.len / writeTotal);
    var ov = Math.max(0, Math.min(1, P.writeStagger));
    var st = s0 * (1 - ov);
    var sp = span + ov * (1 - span);
    var pr = (tt / D - st) / sp;
    pr = Math.max(0, Math.min(1, pr));
    if (P.writeMode === 2) pr = pr > 0.5 ? 1 : 0;        /* máquina de escrever */
    if (P.writeMode === 3) pr = 1 - pr;                   /* desmonte */
    return pr;
  }

  /* ==================================================================
     ANIMAÇÃO DE TEXTO — entrada, laço e saída
     ------------------------------------------------------------------
     Uma função só devolve tudo o que muda numa letra num instante:
       dx dy      deslocamento
       rot        giro
       sc scx scy escala geral e por eixo
       a          opacidade
       blur       desfoque em pixels
       hue        giro de matiz (°)
       reveal     0..1 do quanto da letra aparece
       rmode      0 nada · 1 de baixo · 2 da esquerda · 3 persiana · 4 do meio
     ================================================================== */

  /* qual é a POSIÇÃO desta letra na fila de entrada */
  function ordem(i, n) {
    if (n <= 1) return 0;
    var m = P.entryOrder | 0;
    if (m === 1) return (n - 1 - i) / (n - 1);
    if (m === 2) return Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
    if (m === 3) return 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
    if (m === 4) return Math.abs(rnd(i, 91));
    return i / (n - 1);
  }

  function progresso(pos, time, dur, stagger, t0off) {
    var D = Math.max(0.05, dur);
    var st = pos * Math.min(0.95, stagger * 8);
    var t = (time - (t0off || 0)) / D - st;
    return Math.max(0, Math.min(1, t / Math.max(0.05, 1 - st)));
  }

  function animAt(i, time) {
    var r = { dx: 0, dy: 0, rot: 0, sc: 1, scx: 1, scy: 1, a: 1, blur: 0, hue: 0, reveal: 1, rmode: 0 };
    var n = Math.max(1, letters.length);
    var pos = ordem(i, n);
    var S = size();

    /* ------------------------------------------------------- ENTRADA */
    if (P.entryMode) {
      var pr = progresso(pos, time, P.entryDur, P.entryStagger);
      var amp = P.entryAmp;
      var m = P.entryMode | 0;
      if (m === 1) { var f = VE.TCURVES.spring(pr, 6); r.dy = (1 - f) * -140 * amp; r.a = Math.min(1, pr * 4); }
      else if (m === 2) { var g = VE.TCURVES.back(pr, 2.2); r.rot = (1 - g) * 220 * amp; r.sc = 0.25 + 0.75 * g; r.a = Math.min(1, pr * 3); }
      else if (m === 3) { var b = VE.TCURVES.back(pr, 2.6); r.sc = 0.05 + 0.95 * b; r.a = Math.min(1, pr * 5); }
      else if (m === 4) { var o = VE.TCURVES.out(pr); r.dy = (1 - o) * 220 * amp; r.a = o; }
      else if (m === 5) { var io = VE.TCURVES.io(pr); r.sc = 0.86 + 0.14 * io; r.a = io; }
      else if (m === 6) { var o6 = VE.TCURVES.out(pr); r.dy = (1 - o6) * -220 * amp; r.a = o6; }
      else if (m === 7) { var o7 = VE.TCURVES.out(pr); r.dx = (1 - o7) * -S * 2.2 * amp; r.a = Math.min(1, pr * 2.4); }
      else if (m === 8) { var o8 = VE.TCURVES.out(pr); r.dx = (1 - o8) * S * 2.2 * amp; r.a = Math.min(1, pr * 2.4); }
      else if (m === 9) { var o9 = VE.TCURVES.out(pr); r.blur = (1 - o9) * 26 * amp; r.a = Math.min(1, pr * 1.6); r.sc = 1.10 - 0.10 * o9; }
      else if (m === 10) { r.a = pr > 0.5 ? 1 : 0; }
      else if (m === 11) { r.reveal = VE.TCURVES.out(pr); r.rmode = 1; r.a = pr > 0.001 ? 1 : 0; }
      else if (m === 12) { var o12 = VE.TCURVES.out(pr); r.scx = Math.max(0.02, Math.abs(Math.cos((1 - o12) * Math.PI * 0.5))); r.a = Math.min(1, pr * 3); }
      else if (m === 13) {
        var e = VE.TCURVES.spring(pr, 9);
        r.sc = 0.3 + 0.7 * e; r.scy = 1 + (1 - e) * 0.55 * amp; r.a = Math.min(1, pr * 4);
      }
      else if (m === 14) { r.reveal = VE.TCURVES.out(pr); r.rmode = 3; r.a = pr > 0.001 ? 1 : 0; }
      else if (m === 15) {
        var o15 = VE.TCURVES.out(pr);
        r.dy = (1 - o15) * -180 * amp; r.rot = (1 - o15) * 24 * amp * (i % 2 ? 1 : -1); r.a = o15;
      }
      else if (m === 16) { var o16 = VE.TCURVES.out(pr); r.rot = (1 - o16) * 360 * amp; r.dy = (1 - o16) * 120 * amp; r.a = Math.min(1, pr * 2.5); }
      else if (m === 17) { var o17 = VE.TCURVES.back(pr, 1.9); r.scx = 0.02 + 0.98 * o17; r.a = Math.min(1, pr * 4); }
      else if (m === 18) {
        var o18 = VE.TCURVES.out(pr);
        var sh = (1 - o18) * 26 * amp;
        r.dx = Math.sin(time * 46 + i) * sh; r.dy = Math.cos(time * 39 + i * 1.7) * sh; r.a = Math.min(1, pr * 3);
      }
      else if (m === 19) { var o19 = VE.TCURVES.out(pr); r.scy = 0.02 + 0.98 * o19; r.a = Math.min(1, pr * 4); }
    }

    /* --------------------------------------------------------- SAÍDA */
    if (P.exitMode) {
      var inicio = Math.max(0.05, P.animDur - P.exitDur);
      var pe = progresso(pos, time, P.exitDur, P.exitStagger, inicio);
      if (pe > 0) {
        var q = VE.TCURVES.in_(pe);
        var ax = P.exitAmp;
        var x = P.exitMode | 0;
        if (x === 1) r.a *= 1 - pe;
        else if (x === 2) { r.dy += q * 260 * ax; r.a *= 1 - pe * pe; }
        else if (x === 3) { r.dy += q * -260 * ax; r.a *= 1 - pe * pe; }
        else if (x === 4) { r.sc *= 1 - q * 0.98; r.a *= 1 - pe; }
        else if (x === 5) { r.sc *= 1 + q * 1.6 * ax; r.a *= 1 - pe; }
        else if (x === 6) { r.blur += q * 30 * ax; r.a *= 1 - pe * 0.9; }
        else if (x === 7) { r.dx += q * -S * 2.4 * ax; r.a *= 1 - pe * pe; }
        else if (x === 8) { r.dx += q * S * 2.4 * ax; r.a *= 1 - pe * pe; }
        else if (x === 9) { r.rot += q * 240 * ax; r.sc *= 1 - q * 0.9; r.a *= 1 - pe; }
        else if (x === 10) { r.reveal = Math.min(r.reveal, 1 - pe); r.rmode = r.rmode || 1; }
        else if (x === 11) { if (pe > 0.5) r.a = 0; }
      }
    }

    /* ----------------------------------------------------------- LAÇO */
    if (P.loopMode) {
      var la = P.loopAmp, ls = P.loopSpeed, tt = time * ls;
      var L = P.loopMode | 0;
      var fase = i * 0.42;
      if (L === 1) r.dy += Math.sin(tt * 3.2 + fase) * 18 * la;
      else if (L === 2) { r.dx += rnd(i * 7 + Math.floor(tt * 24), 3) * 9 * la; r.dy += rnd(i * 13 + Math.floor(tt * 24), 4) * 9 * la; }
      else if (L === 3) r.sc *= 1 + Math.sin(tt * 5.0 + fase) * 0.09 * la;
      else if (L === 4) r.a *= (Math.sin(tt * 7.0 + fase) > -0.2) ? 1 : 0.12;
      else if (L === 5) r.hue = (tt * 90 + i * 22) % 360;
      else if (L === 6) { r.dy += Math.sin(tt * 1.7 + fase) * 12 * la; r.rot += Math.sin(tt * 1.1 + fase) * 3 * la; }
      else if (L === 7) r.sc *= 1 + Math.sin(tt * 1.5) * 0.05 * la;
      else if (L === 8) {
        var fl = 0.75 + 0.25 * Math.sin(tt * 30 + i);
        if (rnd(Math.floor(tt * 9) + i, 8) > 0.42) fl *= 0.35;
        r.a *= fl;
      }
      else if (L === 9) r.dx += ((tt * 160 * la) % (W + S * 2)) - (W / 2 + S);
      else if (L === 10) r.rot += Math.sin(tt * 2.6 + fase) * 9 * la;
    }
    return r;
  }

  /* duração total da peça animada, para prévia, sequência e timeline */
  T.animTotal = function () {
    var base = Math.max(
      P.writeMode ? P.writeDur * 1.2 : 0,
      P.entryMode ? P.entryDur * 1.35 : 0,
      P.animDur || 0, 1
    );
    if (P.exitMode) base = Math.max(base, P.animDur);
    return base;
  };

  /* apelido antigo — o resto do arquivo chamava assim */
  function entryAt(i, time) { return animAt(i, time); }

  function build() {
    var txt = caseText(P.text || '');
    var lines = txt.split('\n');
    /* auto-ajuste: reduz o corpo até a linha mais larga caber no quadro */
    T.fitScale = 1;
    if (P.autofit) {
      cx.font = weightStr() + ' ' + size() + 'px ' + FONTS[P.font].f;
      var widest = 0;
      lines.forEach(function (line) {
        var chars = Array.from(line);
        var w = chars.reduce(function (a, c) { return a + measureCh(c); }, 0) +
          P.tracking * Math.max(0, chars.length - 1);
        if (w > widest) widest = w;
      });
      var maxH = H * 0.92 / Math.max(1, lines.length * P.leading);
      T.fitScale = Math.min(1, widest > 0 ? (W * 0.9) / widest : 1, maxH / P.size);
      /* medida acima já usou fitScale = 1; uma passada basta para caber */
      if (!isFinite(T.fitScale) || T.fitScale <= 0) T.fitScale = 1;
    }
    cx.font = weightStr() + ' ' + size() + 'px ' + FONTS[P.font].f;
    var old = letters;
    letters = [];
    var lineH = size() * P.leading;
    var totalH = lines.length * lineH;
    var idx = 0;
    lines.forEach(function (line, li) {
      var chars = Array.from(line);
      var widths = chars.map(function (c) { return measureCh(c); });
      var total = widths.reduce(function (a, b) { return a + b; }, 0) + P.tracking * Math.max(0, chars.length - 1);
      var x = P.align === 1 ? (W - total) / 2 : (P.align === 2 ? W - total - 40 : 40);
      var y = (H - totalH) / 2 + lineH * (li + 0.5);
      chars.forEach(function (ch, ci) {
        var prev = old[idx];
        letters.push({
          ch: ch, i: idx, line: li, col: ci,
          ox: x + widths[ci] / 2, oy: y,
          dx: prev && prev.ch === ch ? prev.dx : 0,
          dy: prev && prev.ch === ch ? prev.dy : 0,
          rot: prev && prev.ch === ch ? prev.rot : 0,
          scale: prev && prev.ch === ch ? prev.scale : 1,
          color: prev && prev.ch === ch ? prev.color : null
        });
        x += widths[ci] + P.tracking;
        idx++;
      });
    });
    if (selLetter >= letters.length) selLetter = -1;
    computeWriteLens();
    renderLetterChips();
    updateInfo();
  }
  T.build = build;

  function weightStr() { return String(Math.round(P.weight / 100) * 100); }
  function size() { return P.size * (T.fitScale || 1); }
  T.fitScale = 1;

  function updateInfo() {
    var el = $('#tyInfo');
    if (el) el.textContent = W + '×' + H + ' · ' + letters.length + ' LETRAS · ' + FONTS[P.font].n;
  }

  function renderLetterChips() {
    var box = $('#tyLetters');
    if (!box) return;
    box.innerHTML = letters.map(function (L, i) {
      var mod = L.dx || L.dy || L.rot || L.scale !== 1 || L.color;
      return '<button class="letter' + (i === selLetter ? ' on' : '') + (mod ? ' mod' : '') + '" data-l="' + i + '">' +
        (L.ch === ' ' ? '␣' : L.ch) + '</button>';
    }).join('');
    box.querySelectorAll('[data-l]').forEach(function (b) {
      b.addEventListener('click', function () {
        selLetter = (selLetter === +b.dataset.l) ? -1 : +b.dataset.l;
        renderLetterChips();
        T.renderInspector();
      });
    });
  }

  /* ---------------- ferramentas ---------------- */
  function applyTool(id) {
    var t = TOOLS.filter(function (x) { return x.id === id; })[0];
    if (t && t.face) {
      var fi = FONTS.findIndex(function (f) { return f.proc === t.face; });
      if (fi >= 0) P.font = fi;
    } else if (t && t.needsProc && !isProc()) {
      var fj = FONTS.findIndex(function (f) { return f.proc === 'lab-grotesk'; });
      if (fj >= 0) P.font = fj;
      if (VE.app) VE.app.toast('esta animação desenha o traço — troquei para uma família LAB');
    }
    if (!t) return;
    if (t.set) Object.keys(t.set).forEach(function (k) { P[k] = t.set[k]; });
    if (id === 'reset') letters.forEach(function (L) { L.dx = L.dy = L.rot = 0; L.scale = 1; L.color = null; });
    if (t.custom === 'stairs') letters.forEach(function (L, i) { L.dy = i * P.size * 0.18; L.dx = 0; L.rot = 0; });
    if (t.custom === 'stack') {
      P.text = Array.from(P.text.replace(/\n/g, '')).join('\n');
      $('#tyText').value = P.text;
      P.size = Math.max(40, Math.min(P.size, Math.floor(H / Math.max(1, P.text.split('\n').length) * 0.8)));
      P.leading = 0.92;
    }
    if (t.custom === 'mirror') {
      letters.forEach(function (L, i) { L.scale = (i % 2) ? -1 : 1; });
    }
    build();
    T.push();
    T.renderInspector();
  }

  function randomize() {
    P.seed = Math.floor(Math.random() * 999);
    P.waveAmp = Math.random() * 90;
    P.waveFreq = 0.5 + Math.random() * 2.5;
    P.rotAmp = Math.random() * 30;
    P.jitPos = Math.random() * 60;
    P.jitScale = Math.random() * 0.4;
    P.repeat = 1 + Math.floor(Math.random() * 6);
    P.slice = Math.random() < 0.4 ? Math.floor(Math.random() * 10) : 0;
    P.rgb = Math.random() < 0.4 ? Math.random() * 18 : 0;
    P.colorMode = Math.floor(Math.random() * 3);
    build();
    T.push();
    T.renderInspector();
  }

  /* ---------------- desenho ---------------- */
  function letterColor(L, i) {
    if (L.color) return L.color;
    if (P.colorMode === 0) return P.c1;
    if (P.colorMode === 1) {
      var pal = ['#16150f', '#d0271b', '#1b4fd8', '#1c7a41', '#f5d000', '#e2670f'];
      return pal[i % pal.length];
    }
    var f = letters.length > 1 ? i / (letters.length - 1) : 0;
    return mixHex(P.c1, P.c2, f);
  }

  function mixHex(a, b, f) {
    var A = VE.hex2rgb(a), B = VE.hex2rgb(b);
    return 'rgb(' + Math.round((A[0] + (B[0] - A[0]) * f) * 255) + ',' +
      Math.round((A[1] + (B[1] - A[1]) * f) * 255) + ',' +
      Math.round((A[2] + (B[2] - A[2]) * f) * 255) + ')';
  }

  function drawGlyph(L, i, time, colorOverride) {
    var wave = Math.sin((L.col * 0.6) * P.waveFreq + time * P.waveSpeed) ;
    var rotw = Math.sin((L.col * 0.6) * P.rotFreq + time * P.waveSpeed * 0.8);
    var scw = Math.sin((L.col * 0.6) * P.scaleFreq + time * P.waveSpeed * 0.6);
    var x = L.ox + L.dx + rnd(i, 1) * P.jitPos;
    var y = L.oy + L.dy + wave * P.waveAmp + rnd(i, 2) * P.jitPos;
    var rot = (L.rot + rotw * P.rotAmp + rnd(i, 3) * P.jitRot) * Math.PI / 180;
    var sc = L.scale * (1 + scw * P.scaleAmp + rnd(i, 4) * P.jitScale);

    if (P.mouseK && mouse.x > -9000) {
      var dx = x - mouse.x, dy = y - mouse.y, d = Math.hypot(dx, dy);
      if (d < P.mouseR && d > 0.01) {
        var f = (1 - d / P.mouseR) * P.mouseK;
        x += dx / d * f; y += dy / d * f;
      }
    }

    /* animação da letra: entrada + laço + saída, todas somadas */
    var en = animAt(i, time);
    if (en.a <= 0.002) return;
    x += en.dx; y += en.dy;
    rot += en.rot * Math.PI / 180;
    sc *= en.sc;

    var col = colorOverride || letterColor(L, i);
    cx.save();
    cx.globalAlpha = (cx.globalAlpha === undefined ? 1 : cx.globalAlpha) * en.a;
    /* desfoque e giro de matiz — o filtro do canvas dá conta dos dois */
    if (SUPORTA_FILTRO && (en.blur > 0.05 || en.hue)) {
      var fl = [];
      if (en.blur > 0.05) fl.push('blur(' + en.blur.toFixed(2) + 'px)');
      if (en.hue) fl.push('hue-rotate(' + en.hue.toFixed(1) + 'deg)');
      cx.filter = fl.join(' ');
    }
    cx.translate(x, y);
    cx.rotate(rot);
    /* revelação: a letra aparece por dentro de uma janela que cresce */
    if (en.rmode && en.reveal < 0.999) {
      var Sz = size();
      cx.beginPath();
      if (en.rmode === 1) {
        cx.rect(-Sz, Sz * 0.78 - Sz * 1.6 * en.reveal, Sz * 2, Sz * 1.6 * en.reveal);
      } else if (en.rmode === 2) {
        cx.rect(-Sz, -Sz, Sz * 2 * en.reveal, Sz * 2);
      } else if (en.rmode === 3) {
        var nb = 6, bh = Sz * 1.6 / nb;
        for (var bi = 0; bi < nb; bi++) {
          cx.rect(-Sz, -Sz * 0.82 + bi * bh, Sz * 2, bh * en.reveal);
        }
      } else {
        cx.rect(-Sz * en.reveal, -Sz * en.reveal, Sz * 2 * en.reveal, Sz * 2 * en.reveal);
      }
      cx.clip();
    }
    cx.scale(sc * en.scx, Math.abs(sc) * en.scy);
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.font = weightStr() + ' ' + size() + 'px ' + FONTS[P.font].f;

    /* ---- famílias de traço: a letra é DESENHADA, não impressa ---- */
    if (isProc()) {
      var fid = faceId();
      var cap = capSize();
      var advPx = VE.typefaces.advance(fid, L.ch, 0) * cap / 100;
      var prog = writeProgress(i, time);
      cx.save();
      cx.translate(-advPx / 2, -cap / 2);
      if (P.shBlur || P.shX || P.shY) {
        cx.save();
        cx.shadowColor = P.shColor; cx.shadowBlur = P.shBlur;
        cx.shadowOffsetX = P.shX; cx.shadowOffsetY = P.shY;
        VE.typefaces.drawGlyph(cx, fid, L.ch, { size: cap, color: col, progress: prog, weightK: procWeightK() });
        cx.restore();
      }
      if (P.rgb > 0) {
        cx.globalCompositeOperation = 'multiply';
        cx.save(); cx.translate(-P.rgb, 0);
        VE.typefaces.drawGlyph(cx, fid, L.ch, { size: cap, color: '#00ffff', progress: prog, weightK: procWeightK() });
        cx.restore();
        cx.save(); cx.translate(P.rgb, 0);
        VE.typefaces.drawGlyph(cx, fid, L.ch, { size: cap, color: '#ff00ff', progress: prog, weightK: procWeightK() });
        cx.restore();
        cx.save(); cx.translate(0, P.rgb * 0.6);
        VE.typefaces.drawGlyph(cx, fid, L.ch, { size: cap, color: '#ffff00', progress: prog, weightK: procWeightK() });
        cx.restore();
        cx.globalCompositeOperation = 'source-over';
      } else {
        VE.typefaces.drawGlyph(cx, fid, L.ch, { size: cap, color: col, progress: prog, weightK: procWeightK() });
      }
      /* ponta da caneta: onde o traço está exatamente agora */
      if (P.writePen && P.writeMode === 1 && prog > 0.001 && prog < 0.999) {
        var pt = VE.typefaces.penPoint(fid, L.ch, prog);
        if (pt) {
          cx.save();
          cx.fillStyle = col;
          cx.beginPath();
          cx.arc(pt.x * cap / 100, pt.y * cap / 100, Math.max(2, cap * 0.028), 0, 6.2832);
          cx.fill();
          cx.restore();
        }
      }
      cx.restore();
      cx.restore();
      return;
    }

    if (P.shBlur || P.shX || P.shY) {
      cx.save();
      cx.shadowColor = P.shColor; cx.shadowBlur = P.shBlur;
      cx.shadowOffsetX = P.shX; cx.shadowOffsetY = P.shY;
      cx.fillStyle = col;
      cx.fillText(L.ch, 0, 0);
      cx.restore();
    }

    if (P.slice > 0) {
      var n = Math.max(1, Math.round(P.slice));
      var hh = size() * 1.25 / n;
      for (var s = 0; s < n; s++) {
        var off = (Math.abs(rnd(i * 31 + s, 5)) < P.sliceProb) ? rnd(i * 17 + s, 6) * P.sliceOff : 0;
        cx.save();
        cx.beginPath();
        cx.rect(-size(), -size() * 0.72 + s * hh, size() * 2, hh);
        cx.clip();
        if (P.fill) { cx.fillStyle = col; cx.fillText(L.ch, off, 0); }
        if (P.outline) { cx.strokeStyle = col; cx.lineWidth = P.stroke; cx.strokeText(L.ch, off, 0); }
        cx.restore();
      }
    } else if (P.rgb > 0) {
      cx.globalCompositeOperation = 'multiply';
      cx.fillStyle = '#00ffff'; cx.fillText(L.ch, -P.rgb, 0);
      cx.fillStyle = '#ff00ff'; cx.fillText(L.ch, P.rgb, 0);
      cx.fillStyle = '#ffff00'; cx.fillText(L.ch, 0, P.rgb * 0.6);
      cx.globalCompositeOperation = 'source-over';
    } else {
      if (P.fill) { cx.fillStyle = col; cx.fillText(L.ch, 0, 0); }
      if (P.outline) { cx.strokeStyle = col; cx.lineWidth = P.stroke; cx.strokeText(L.ch, 0, 0); }
    }
    cx.restore();
  }

  T.draw = function (time) {
    if (!cx) return;
    time = time === undefined ? (performance.now() - t0) / 1000 : time;
    if (!$('#tyAnim') || !$('#tyAnim').checked) time = 0;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, W, H);
    if (!P.bgAlpha) { cx.fillStyle = P.bg; cx.fillRect(0, 0, W, H); }
    var rep = Math.max(1, Math.round(P.repeat));
    for (var r = rep - 1; r >= 0; r--) {
      cx.save();
      cx.globalAlpha = r === 0 ? 1 : Math.pow(P.repFade, r);
      cx.translate(P.repDx * r, P.repDy * r);
      cx.translate(W / 2, H / 2);
      cx.rotate(P.repRot * r * Math.PI / 180);
      cx.scale(Math.pow(P.repScale, r), Math.pow(P.repScale, r));
      cx.translate(-W / 2, -H / 2);
      letters.forEach(function (L, i) {
        if (L.ch === ' ') return;
        drawGlyph(L, i, time, r === 0 ? null : letterColor(L, i));
      });
      cx.restore();
    }
    if (selLetter >= 0 && letters[selLetter]) {
      var L = letters[selLetter];
      cx.save();
      cx.strokeStyle = '#f5d000'; cx.lineWidth = 3;
      cx.strokeRect(L.ox + L.dx - size() * 0.42, L.oy + L.dy - size() * 0.58, size() * 0.84, size() * 1.16);
      cx.restore();
    }
  };

  function loop() {
    raf = requestAnimationFrame(loop);
    if (VE.shell && VE.shell.view !== 'type') return;
    T.draw();
  }

  /* ---------------- inspetor ---------------- */
  T.renderInspector = function () {
    var box = $('#props');
    if (!box) return;
    $('#inspTitle').textContent = selLetter >= 0 ? ('LETRA · ' + letters[selLetter].ch) : 'FICHA · TIPOGRAFIA';
    $('#inspId').textContent = W + '×' + H;
    var h = '';

    if (selLetter >= 0) {
      var L = letters[selLetter];
      h += '<div class="plate"><div class="plate-h"><span class="lbl">LETRA ' + (selLetter + 1) + ' · ' + L.ch + '</span><i class="l"></i>' +
        '<button class="cmd cmd-sm" data-ty="deselect">TODAS</button></div>';
      h += num('L.dx', 'Deslocar X', L.dx, -800, 800, 1);
      h += num('L.dy', 'Deslocar Y', L.dy, -800, 800, 1);
      h += num('L.rot', 'Rotação (°)', L.rot, -180, 180, 1);
      h += num('L.scale', 'Escala', L.scale, -3, 3, 0.01);
      h += '<div class="prow" style="grid-template-columns:1fr auto"><label>Cor só desta letra</label>' +
        '<input type="color" data-ty="L.color" value="' + (L.color || P.c1) + '"></div>';
      h += '<div class="pbtns"><button class="cmd cmd-sm" data-ty="clearColor">SEM COR PRÓPRIA</button>' +
        '<button class="cmd cmd-sm" data-ty="zero">ZERAR LETRA</button></div></div>';
    }

    h += '<div class="plate"><div class="plate-h"><span class="lbl">TIPO</span><i class="l"></i></div>';
    h += sel('font', 'Fonte', P.font, FONTS.map(function (f) { return f.n; }));
    if (FONTS[P.font].desc) h += '<div class="pnote">' + FONTS[P.font].desc + ' · família própria do rgb_lab</div>';
    h += num('size', 'Corpo', P.size, 12, 600, 1);
    h += chk('autofit', 'Ajustar ao quadro', P.autofit);
    h += num('weight', 'Peso', P.weight, 200, 700, 100);
    h += num('tracking', 'Entreletra', P.tracking, -120, 300, 1);
    h += num('leading', 'Entrelinha', P.leading, 0.4, 3, 0.01);
    h += sel('align', 'Alinhamento', P.align, ['Esquerda', 'Centro', 'Direita']);
    h += sel('caseMode', 'Caixa', P.caseMode, ['Como digitado', 'MAIÚSCULAS', 'minúsculas', 'AlTeRnAdA']);
    h += '</div>';

    h += '<div class="plate"><div class="plate-h"><span class="lbl">ANIMAÇÃO</span><i class="l"></i></div>';
    h += num('animDur', 'Duração da peça (s)', P.animDur, 0.5, 30, 0.1);
    h += '<div class="subhead">ENTRADA</div>';
    h += sel('entryMode', 'Como as letras chegam', P.entryMode, T.ENTRADAS);
    if (P.entryMode) {
      h += sel('entryOrder', 'Ordem', P.entryOrder,
        ['Da esquerda', 'Da direita', 'Do meio para fora', 'Das pontas para o meio', 'Sorteada']);
      h += num('entryDur', 'Duração da entrada (s)', P.entryDur, 0.1, 6, 0.05);
      h += num('entryStagger', 'Atraso entre letras', P.entryStagger, 0, 0.4, 0.005);
      h += num('entryAmp', 'Alcance', P.entryAmp, 0, 3, 0.01);
    }
    h += '<div class="subhead">LAÇO</div>';
    h += sel('loopMode', 'O que fazem enquanto estão lá', P.loopMode, T.LACOS);
    if (P.loopMode) {
      h += num('loopAmp', 'Intensidade', P.loopAmp, 0, 3, 0.01);
      h += num('loopSpeed', 'Velocidade', P.loopSpeed, 0.05, 4, 0.01);
    }
    h += '<div class="subhead">SAÍDA</div>';
    h += sel('exitMode', 'Como vão embora', P.exitMode, T.SAIDAS);
    if (P.exitMode) {
      h += num('exitDur', 'Duração da saída (s)', P.exitDur, 0.1, 6, 0.05);
      h += num('exitStagger', 'Atraso entre letras', P.exitStagger, 0, 0.4, 0.005);
      h += num('exitAmp', 'Alcance', P.exitAmp, 0, 3, 0.01);
      h += '<div class="pnote">a saída acontece nos últimos <b>' + (+P.exitDur).toFixed(1) +
        ' s</b> da peça, que tem <b>' + (+P.animDur).toFixed(1) + ' s</b>. mude a duração da peça acima.</div>';
    }
    if (isProc()) {
      h += sel('writeMode', 'Escrita do traço', P.writeMode, ['Nenhuma', 'Escrever à mão', 'Máquina de escrever', 'Desmontar']);
      if (P.writeMode) {
        h += num('writeDur', 'Duração da escrita (s)', P.writeDur, 0.2, 12, 0.05);
        h += num('writeStagger', 'Sobreposição das letras', P.writeStagger, 0, 1, 0.01);
        h += chk('writeLoop', 'Repetir', P.writeLoop);
        h += chk('writePen', 'Mostrar a ponta da caneta', P.writePen);
      }
      h += '<div class="pnote">a família <b>' + FONTS[P.font].n + '</b> é desenhada por código: o traço tem começo e fim, então dá para escrevê-lo de verdade</div>';
    } else {
      h += '<div class="pnote">escolha uma família <b>LAB</b> em TIPO para liberar a escrita à mão — as fontes do sistema não têm traço, só contorno</div>';
    }
    h += '</div>';

    h += '<div class="plate"><div class="plate-h"><span class="lbl">DEFORMAÇÃO</span><i class="l"></i></div>';
    h += num('waveAmp', 'Onda (altura)', P.waveAmp, 0, 400, 1);
    h += num('waveFreq', 'Onda (frequência)', P.waveFreq, 0, 6, 0.01);
    h += num('waveSpeed', 'Onda (velocidade)', P.waveSpeed, 0, 6, 0.01);
    h += num('rotAmp', 'Rotação por letra', P.rotAmp, 0, 90, 0.5);
    h += num('scaleAmp', 'Escala por letra', P.scaleAmp, 0, 1.5, 0.01);
    h += num('jitPos', 'Bagunça de posição', P.jitPos, 0, 300, 1);
    h += num('jitRot', 'Bagunça de rotação', P.jitRot, 0, 90, 0.5);
    h += num('jitScale', 'Bagunça de escala', P.jitScale, 0, 1, 0.01);
    h += num('seed', 'Semente', P.seed, 0, 999, 1);
    h += '</div>';

    h += '<div class="plate"><div class="plate-h"><span class="lbl">REPETIÇÃO</span><i class="l"></i></div>';
    h += num('repeat', 'Cópias', P.repeat, 1, 24, 1);
    h += num('repDx', 'Passo X', P.repDx, -120, 120, 1);
    h += num('repDy', 'Passo Y', P.repDy, -120, 120, 1);
    h += num('repRot', 'Giro por cópia', P.repRot, -30, 30, 0.5);
    h += num('repScale', 'Escala por cópia', P.repScale, 0.8, 1.3, 0.005);
    h += num('repFade', 'Esmaecer', P.repFade, 0, 1, 0.01);
    h += '</div>';

    h += '<div class="plate"><div class="plate-h"><span class="lbl">TRATAMENTO</span><i class="l"></i></div>';
    h += chk('fill', 'Preenchimento', P.fill);
    h += chk('outline', 'Contorno', P.outline);
    h += num('stroke', 'Espessura do contorno', P.stroke, 0.5, 40, 0.5);
    h += num('slice', 'Fatias', P.slice, 0, 24, 1);
    h += num('sliceOff', 'Deslocamento das fatias', P.sliceOff, 0, 200, 1);
    h += num('sliceProb', 'Probabilidade', P.sliceProb, 0, 1, 0.01);
    h += num('rgb', 'Separação RGB', P.rgb, 0, 60, 0.5);
    h += num('shX', 'Sombra X', P.shX, -100, 100, 1);
    h += num('shY', 'Sombra Y', P.shY, -100, 100, 1);
    h += num('shBlur', 'Sombra (borrão)', P.shBlur, 0, 100, 1);
    h += '</div>';

    h += '<div class="plate"><div class="plate-h"><span class="lbl">COR</span><i class="l"></i></div>';
    h += sel('colorMode', 'Modo', P.colorMode, ['Uma cor', 'Paleta do sistema', 'Gradiente']);
    h += color('c1', 'Cor 1', P.c1);
    h += color('c2', 'Cor 2', P.c2);
    h += color('shColor', 'Cor da sombra', P.shColor);
    h += color('bg', 'Fundo', P.bg);
    h += '<div class="pnote">marque FUNDO TRANSPARENTE na barra de cima para exportar png com alpha</div></div>';

    h += '<div class="plate"><div class="plate-h"><span class="lbl">CURSOR</span><i class="l"></i></div>';
    h += num('mouseK', 'Força', P.mouseK, -300, 300, 1);
    h += num('mouseR', 'Raio', P.mouseR, 20, 900, 5);
    h += '<div class="pnote">passe o mouse sobre a composição</div></div>';

    box.innerHTML = h;
    bind(box);
  };

  function num(k, label, v, min, max, step) {
    return '<div class="prow"><label>' + label + '</label>' +
      '<input class="field num" data-tynum="' + k + '" value="' + v + '"><span></span></div>' +
      '<div class="prow-slider"><input type="range" data-ty="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '"></div>';
  }
  function sel(k, label, v, opts) {
    return '<div class="prow"><label>' + label + '</label><select class="field" data-ty="' + k + '" style="grid-column:2/4">' +
      opts.map(function (o, i) { return '<option value="' + i + '"' + (v === i ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>';
  }
  function chk(k, label, v) {
    return '<div class="prow"><label>' + label + '</label><input type="checkbox" data-ty="' + k + '"' + (v ? ' checked' : '') + '><span></span></div>';
  }
  function color(k, label, v) {
    return '<div class="prow" style="grid-template-columns:1fr auto"><label>' + label + '</label>' +
      '<input type="color" data-ty="' + k + '" value="' + v + '"></div>';
  }

  function bind(box) {
    box.querySelectorAll('[data-ty]').forEach(function (el) {
      var k = el.dataset.ty;
      var apply = function () {
        if (k === 'deselect') { selLetter = -1; renderLetterChips(); T.renderInspector(); return; }
        if (k === 'clearColor') { letters[selLetter].color = null; renderLetterChips(); T.renderInspector(); return; }
        if (k === 'zero') {
          var L0 = letters[selLetter];
          L0.dx = L0.dy = L0.rot = 0; L0.scale = 1; L0.color = null;
          renderLetterChips(); T.renderInspector(); return;
        }
        var v = el.type === 'checkbox' ? (el.checked ? 1 : 0) :
          (el.type === 'color' ? el.value : parseFloat(el.value));
        if (k.indexOf('L.') === 0) {
          if (selLetter < 0) return;
          letters[selLetter][k.slice(2)] = v;
          renderLetterChips();
        } else {
          P[k] = v;
          if (['font', 'size', 'weight', 'tracking', 'leading', 'align', 'caseMode', 'autofit'].indexOf(k) >= 0) build();
          if (['font', 'entryMode', 'exitMode', 'loopMode', 'writeMode'].indexOf(k) >= 0) T.renderInspector();
        }
        var n = box.querySelector('[data-tynum="' + k + '"]');
        if (n && typeof v === 'number') n.value = v;
      };
      if (el.tagName === 'BUTTON') el.addEventListener('click', function(){ apply(); T.push(); });
      else { el.addEventListener('input', apply); el.addEventListener('change', function(){ apply(); T.push(); }); }
    });
    box.querySelectorAll('[data-tynum]').forEach(function (el) {
      el.addEventListener('change', function () {
        var rng = box.querySelector('[data-ty="' + el.dataset.tynum + '"]');
        if (rng) { rng.value = el.value; rng.dispatchEvent(new Event('input')); }
      });
    });
  }

  /* ---------------- presets ---------------- */
  function renderPresets() {
    var box = $('#tyPresets');
    if (!box) return;
    var list = VE.presets.list('type');
    box.innerHTML = '<div class="pad"><button class="cmd cmd-sm" id="tySave" style="width:100%;justify-content:center">+ SALVAR ESTADO</button></div>' +
      list.map(function (p) {
        return '<div class="preset" data-tp="' + p.id + '"><span class="pno">' + p.code + '</span>' +
          '<span class="pnm">' + p.name + '</span><button class="pdel" data-del="' + p.id + '">✕</button></div>';
      }).join('');
    var sb = $('#tySave');
    if (sb) sb.addEventListener('click', function () {
      var n = prompt('nome do preset tipográfico:', 'TIPO');
      if (!n) return;
      VE.presets.add('type', n, { params: JSON.parse(JSON.stringify(P)), letters: letters.map(function (L) { return { dx: L.dx, dy: L.dy, rot: L.rot, scale: L.scale, color: L.color }; }) });
    });
    box.querySelectorAll('[data-tp]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.dataset.del) { VE.presets.remove(e.target.dataset.del); return; }
        var p = VE.presets.get(el.dataset.tp);
        if (!p) return;
        Object.keys(p.data.params).forEach(function (k) { P[k] = p.data.params[k]; });
        $('#tyText').value = P.text;
        build();
        (p.data.letters || []).forEach(function (s, i) {
          if (!letters[i]) return;
          letters[i].dx = s.dx; letters[i].dy = s.dy; letters[i].rot = s.rot;
          letters[i].scale = s.scale; letters[i].color = s.color;
        });
        renderLetterChips();
        T.renderInspector();
      });
    });
  }

  /* ---------------- exportação ---------------- */
  /* desenha um quadro SEM fundo, seja qual for o estado do painel */
  function drawTransparent(time) {
    var keep = P.bgAlpha;
    var keepSel = selLetter;
    P.bgAlpha = 1;                 /* 1 = sem fundo */
    selLetter = -1;                /* a marca de seleção não vai para o arquivo */
    T.draw(time);
    P.bgAlpha = keep;
    selLetter = keepSel;
  }
  T.drawTransparent = drawTransparent;

  function exportPng() {
    drawTransparent();
    cv.toBlob(function (b) {
      if (!b) return;
      VE.saveFile(VE.BRAND.slug + '-tipo-' + Date.now().toString(36) + '.png', b);
      VE.app.toast('png ' + W + '×' + H + ' com fundo transparente', 'ok');
      T.draw();
    }, 'image/png');
  }

  /* sequência PNG da animação — a escrita à mão sai quadro a quadro,
     sempre com alpha, pronta para entrar em qualquer montagem           */
  function exportSequence() {
    var fps = 30;
    var dur = T.animTotal();
    var n = Math.min(300, Math.round(dur * fps));
    if (!n) return VE.app.toast('ligue uma animação primeiro', 'err');
    VE.app.toast('gerando ' + n + ' quadros com alpha…');
    var files = [];
    var i = 0;
    function step() {
      drawTransparent(i / fps);
      cv.toBlob(function (b) {
        if (b) {
          var fr = new FileReader();
          fr.onload = function () {
            files.push({ name: 'tipo_' + String(i).padStart(4, '0') + '.png', data: new Uint8Array(fr.result) });
            next();
          };
          fr.readAsArrayBuffer(b);
        } else next();
      }, 'image/png');
      function next() {
        i++;
        if (i < n) { setTimeout(step, 0); return; }
        var zip = VE.zip(files);
        VE.saveFile(VE.BRAND.slug + '-tipo-sequencia-' + Date.now().toString(36) + '.zip', zip);
        VE.app.toast(n + ' quadros png com alpha num zip', 'ok');
        T.draw();
      }
    }
    step();
  }

  function exportSvg() {
    var time = 0;
    var parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">'];
    if (!P.bgAlpha) parts.push('<rect width="' + W + '" height="' + H + '" fill="' + P.bg + '"/>');
    var rep = Math.max(1, Math.round(P.repeat));
    for (var r = rep - 1; r >= 0; r--) {
      parts.push('<g opacity="' + (r === 0 ? 1 : Math.pow(P.repFade, r)).toFixed(3) + '" transform="translate(' +
        (P.repDx * r) + ',' + (P.repDy * r) + ')">');
      letters.forEach(function (L, i) {
        if (L.ch === ' ') return;
        var wave = Math.sin((L.col * 0.6) * P.waveFreq + time * P.waveSpeed);
        var rotw = Math.sin((L.col * 0.6) * P.rotFreq);
        var scw = Math.sin((L.col * 0.6) * P.scaleFreq);
        var x = L.ox + L.dx + rnd(i, 1) * P.jitPos;
        var y = L.oy + L.dy + wave * P.waveAmp + rnd(i, 2) * P.jitPos;
        var rot = (L.rot + rotw * P.rotAmp + rnd(i, 3) * P.jitRot);
        var sc = L.scale * (1 + scw * P.scaleAmp + rnd(i, 4) * P.jitScale);
        var col = letterColor(L, i);
        parts.push('<text x="0" y="0" transform="translate(' + x.toFixed(2) + ',' + y.toFixed(2) + ') rotate(' +
          rot.toFixed(2) + ') scale(' + sc.toFixed(3) + ',' + Math.abs(sc).toFixed(3) + ')" ' +
          'font-family="' + FONTS[P.font].f.replace(/"/g, "'") + '" font-size="' + P.size + '" font-weight="' + weightStr() + '" ' +
          'text-anchor="middle" dominant-baseline="central" ' +
          (P.fill ? 'fill="' + col + '"' : 'fill="none"') +
          (P.outline ? ' stroke="' + col + '" stroke-width="' + P.stroke + '"' : '') + '>' +
          L.ch.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text>');
      });
      parts.push('</g>');
    }
    parts.push('</svg>');
    var blob = new Blob([parts.join('\n')], { type: 'image/svg+xml' });
    VE.saveFile(VE.BRAND.slug + '-tipo-' + Date.now().toString(36) + '.svg', blob);
    VE.app.toast('svg usa a fonte instalada na máquina de quem abrir', 'ok');
  }

  function sendToTimeline() {
    /* a camada que vai para a linha do tempo é SEMPRE desenhada sem fundo:
       PNG com alpha, para o texto entrar por cima do vídeo               */
    var id = VE.media.registerTypeSource(cv, 'TEXTO · ' + P.text.slice(0, 12), function (localTime) {
      drawTransparent(($('#tyAnim') && $('#tyAnim').checked) ? localTime : 0);
    });
    if (!VE.project) VE.app.ensureProject(W, H);
    var dur = Math.min(VE.MAXDUR, T.animTotal());
    /* numeração sequencial: TYPE_001, TYPE_002… */
    var n = VE.allClips().filter(function (x) { return x.kind === 'type'; }).length + 1;
    var c = VE.addMedia({
      kind: 'type', name: 'TYPE_' + String(n).padStart(3, '0'), src: id,
      dur: dur, fit: 'contain', over: true
    });
    VE.pushHistory(); VE.emit('project');
    var f = VE.findClip(c.id);
    VE.app.toast('texto em ' + VE.tl.tc(c.start) + ' na pista ' + (f ? VE.trackLabel(f.track) : '—') +
      ' — png com alpha, por cima do vídeo', 'ok');
    return c;
  }

  T.canvasEl = function () { return cv; };

})(window.VE);
