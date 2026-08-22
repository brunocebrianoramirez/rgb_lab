/* ============================================================
   rgb_lab — casca do sistema
   entrada em ascii → boot → índice → laboratórios
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var S = VE.shell = { view: 'home', entered: false };
  var introRaf = null, introState = { t: 0, collapse: 0, mx: 0.5, my: 0.5 };
  var CHARS = ' .·:-=+*#%@';
  var glyphs = null, glyphW = 0, glyphH = 0;

  /* ================= ENTRADA EM ASCII ================= */
  function buildGlyphs(cell, color, bg) {
    var c = document.createElement('canvas');
    var w = Math.ceil(cell * 0.62), h = cell;
    c.width = w * CHARS.length; c.height = h;
    var x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = color;
    x.font = '700 ' + Math.round(cell * 0.92) + 'px "JetBrains Mono", monospace';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    for (var i = 0; i < CHARS.length; i++) x.fillText(CHARS[i], i * w + w / 2, h / 2 + 1);
    glyphs = c; glyphW = w; glyphH = h;
  }

  function introDraw() {
    introRaf = requestAnimationFrame(introDraw);
    var cv = $('#introCanvas');
    if (!cv || $('#intro').classList.contains('hidden')) return;
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    var W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var c = cv.getContext('2d', { alpha: false });
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var css = getComputedStyle(document.documentElement);
    var paper = css.getPropertyValue('--paper').trim();
    var ink = css.getPropertyValue('--ink').trim();
    /* o amarelo saiu do desenho da entrada: cor agora e canal, nao enfeite */

    var cell = W < 700 ? 11 : 15;
    if (!glyphs || glyphH !== cell || glyphs.dataset === undefined) buildGlyphs(cell, ink, paper);

    c.fillStyle = paper;
    c.fillRect(0, 0, W, H);

    introState.t += 0.016;
    var t = introState.t;
    var cols = Math.ceil(W / glyphW), rows = Math.ceil(H / glyphH);
    var cx = introState.mx * cols, cy = introState.my * rows;

    var meta = $('#introRes');
    if (meta) meta.textContent = 'MATRIZ · ' + String(cols).padStart(3, '0') + '×' + String(rows).padStart(3, '0');

    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var u = i / cols, v = j / rows;
        /* campo procedural: interferência + varredura + atrator do cursor */
        var d = Math.hypot((i - cx) / cols * 2.2, (j - cy) / rows * 1.6);
        var f =
          Math.sin(u * 9 + t * 0.9) * 0.5 +
          Math.sin((u * 6 - v * 7) + t * 0.7) * 0.35 +
          Math.sin(Math.hypot(u - 0.5, v - 0.5) * 22 - t * 1.7) * 0.42 +
          Math.sin(v * 14 + Math.sin(u * 5 + t * 0.4) * 2.2) * 0.3 -
          d * 0.55;
        var scan = (Math.sin((v * rows - t * 26) * 0.42) > 0.93) ? 0.55 : 0;
        var lvl = (f + 1.35) / 2.7 + scan;
        if (introState.collapse > 0) {
          var k = introState.collapse;
          lvl -= k * (1.6 - Math.abs(v - 0.5) * 1.2);
        }
        lvl = Math.max(0, Math.min(0.999, lvl));
        var gi = Math.floor(lvl * CHARS.length);
        if (gi <= 0) continue;
        c.drawImage(glyphs, gi * glyphW, 0, glyphW, glyphH, i * glyphW, j * glyphH, glyphW, glyphH);
      }
    }
    /* marca de registro dos tres canais: azul / verde / vermelho,
       1px cada, com desencontro de meio pixel — registro fora de esquadro */
    var band = (t * 0.13) % 1.7 - 0.35;
    if (band > 0 && band < 1) {
      var y0 = Math.round(band * H);
      var chs = [
        [css.getPropertyValue("--ch-video").trim(), 0],
        [css.getPropertyValue("--ch-audio").trim(), 2],
        [css.getPropertyValue("--ch-type").trim(), 4]
      ];
      c.globalAlpha = 0.85;
      for (var ci = 0; ci < 3; ci++) {
        c.fillStyle = chs[ci][0];
        var off = Math.sin(t * 0.9 + ci * 2.1) * 6;
        c.fillRect(off, y0 + chs[ci][1], W, 1);
      }
      c.globalAlpha = 1;
    }
  }

  function initIntro() {
    var cv = $('#introCanvas');
    window.addEventListener('pointermove', function (e) {
      if ($('#intro').classList.contains('hidden')) return;
      introState.mx = e.clientX / window.innerWidth;
      introState.my = e.clientY / window.innerHeight;
    });
    var bars = $('#introBars');
    if (bars) bars.innerHTML = new Array(14).fill('<i></i>').join('');
    setInterval(function () {
      if ($('#intro').classList.contains('hidden')) return;
      var sig = $('#introSig');
      if (sig) sig.textContent = 'SIG · ' + Array.from({ length: 8 }, function () {
        return '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
      }).join('');
      if (bars) bars.querySelectorAll('i').forEach(function (b) {
        b.style.height = (3 + Math.random() * 11).toFixed(0) + 'px';
      });
    }, 220);
    setInterval(function () {
      var el = $('#introClock');
      if (el) el.textContent = new Date().toLocaleTimeString('pt-BR');
    }, 1000);
    introDraw();
    $('#enterBtn').addEventListener('click', enterLab);
    window.addEventListener('keydown', function (e) {
      if (!S.entered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); enterLab(); }
    });
  }

  /* ================= BOOT ================= */
  var BOOTLINES = [
    'RGB_LAB · LABORATÓRIO AUDIOVISUAL',
    'SYS 01 · BUILD 2411 · MODO EXPERIMENTAL',
    '',
    '01  VERIFICANDO NÚCLEO GRÁFICO ......... <b>WEBGL2 OK</b>',
    '02  CARREGANDO CATÁLOGO DE EFEITOS ..... <b>{FX} MÓDULOS</b>',
    '03  MONTANDO CADEIA DE ÁUDIO ........... <b>WEB AUDIO OK</b>',
    '04  ABRINDO MESA TIPOGRÁFICA .......... <b>OK</b>',
    '05  VERIFICANDO PROCESSAMENTO LOCAL .... <b>NENHUM ENVIO</b>',
    '06  MONTANDO INTERFACE ................. <b>PRONTO</b>',
    '',
    'ESTADO: <b>READY</b>'
  ];

  function enterLab() {
    if (S.entered) return;
    S.entered = true;
    var col = 0;
    var iv = setInterval(function () {
      col += 0.09;
      introState.collapse = col;
      if (col >= 1.6) {
        clearInterval(iv);
        cancelAnimationFrame(introRaf);
        $('#intro').classList.add('hidden');
        runBoot();
      }
    }, 16);
  }

  function runBoot() {
    var boot = $('#boot'), log = $('#bootLog');
    boot.classList.remove('hidden');
    log.innerHTML = '';
    var i = 0;
    var lines = BOOTLINES.map(function (l) { return l.replace('{FX}', String(VE.FX.length)); });
    var iv = setInterval(function () {
      log.innerHTML += lines[i] + '\n';
      i++;
      if (i >= lines.length) {
        clearInterval(iv);
        setTimeout(function () {
          boot.classList.add('hidden');
          $('#shell').classList.remove('hidden');
          reveal();
          S.go('home');
          VE.app.afterEnter();
        }, 260);
      }
    }, 78);
  }

  function reveal() {
    var els = [$('.hdr'), $('.rail'), $('#side'), $('#work'), $('#insp'), $('.status')];
    els.forEach(function (el, i) {
      if (!el) return;
      el.classList.add('boot-in');
      setTimeout(function () { el.classList.remove('boot-in'); }, 40 + i * 55);
    });
  }

  /* ================= ROTEAMENTO ================= */
  /* CANAIS DO RGB_LAB — as tres cores nao sao R/G/B literais: sao codigos
     de navegacao. Ver css/system.css, bloco 01b.                            */
  VE.CHANNELS = {
    video: { n: '01', label: 'VÍDEO',      ch: 'BLUE',  varName: '--ch-video' },
    audio: { n: '02', label: 'ÁUDIO',      ch: 'GREEN', varName: '--ch-audio' },
    type:  { n: '03', label: 'TIPOGRAFIA', ch: 'RED',   varName: '--ch-type' }
  };
  VE.chColor = function (key) {
    var c = VE.CHANNELS[key];
    if (!c) return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
    return getComputedStyle(document.documentElement).getPropertyValue(c.varName).trim();
  };

  var VIEWS = {
    home: { el: 'viewHome', side: 'sideHome', rail: 'ÍNDICE', lab: '—' },
    tutorial: { el: 'viewTutorial', side: 'sideTutorial', rail: 'MANUAL 01 · MÉTODO', lab: 'MANUAL 01' },
    video: { el: 'viewVideo', side: 'sideVideo', rail: 'LAB 01 · VÍDEO · BLUE', lab: '01 VÍDEO' },
    audio: { el: 'viewAudio', side: 'sideAudio', rail: 'LAB 02 · ÁUDIO · GREEN', lab: '02 ÁUDIO' },
    type: { el: 'viewType', side: 'sideType', rail: 'LAB 03 · TIPOGRAFIA · RED', lab: '03 TIPOGRAFIA' }
  };

  S.go = function (view) {
    if (!VIEWS[view]) view = 'home';
    S.view = view;
    /* uma unica troca repinta toda a interface no canal certo */
    document.documentElement.dataset.lab = view;
    Object.keys(VIEWS).forEach(function (k) {
      var v = VIEWS[k];
      var el = document.getElementById(v.el);
      var sd = document.getElementById(v.side);
      if (el) el.classList.toggle('hidden', k !== view);
      if (sd) sd.classList.toggle('hidden', k !== view);
    });
    document.querySelectorAll('#hdrNav button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.view === view);
    });
    document.querySelectorAll('.folder[data-view]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.view === view);
    });
    $('#railView').textContent = VIEWS[view].rail;
    $('#stLab').textContent = VIEWS[view].lab;

    if (view === 'video') {
      if (VE.view) { VE.view.apply(); if (VE.view.mode !== 'free') VE.view.applyMode(); }
      VE.tl.render();
      VE.panels.renderProps();
    } else if (view === 'audio') {
      VE.audio.drawWave();
      renderAudioInspector();
    } else if (view === 'type') {
      VE.type.renderInspector();
    } else if (view === 'tutorial') {
      renderTutorialInspector();
    } else {
      renderHomeInspector();
    }
    VE.emit('view', view);
  };

  /* ================= TUTORIAL · MANUAL 01 =================
     O sumário da coluna esquerda acompanha a rolagem da página. */
  var TOC = [
    ['tut-mapa', '00', 'O mapa inteiro'],
    ['tut-tema', '01', 'Tema'],
    ['tut-ref', '02', 'Referências'],
    ['tut-material', '03', 'Material'],
    ['tut-poetica', '04', 'A poética'],
    ['tut-edicao', '05', 'Edição'],
    ['tut-lembrar', '06', 'Lembrar'],
    ['tut-titulo', '07', 'Título'],
    ['tut-creditos', '08', 'Créditos'],
    ['tut-pratica', '09', 'Na prática'],
    ['tut-exercicio', '10', 'Exercício 60s'],
    ['tut-erros', '11', 'Onde se tropeça']
  ];

  function buildToc() {
    var box = $('#tutToc');
    if (!box || box.dataset.built) return;
    box.dataset.built = '1';
    box.innerHTML = TOC.map(function (t) {
      return '<button class="tocitem" data-goto="' + t[0] + '">' +
        '<span class="tocn">' + t[1] + '</span><span class="tocl">' + t[2] + '</span></button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-goto]');
      if (!b) return;
      var el = document.getElementById(b.dataset.goto);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    var view = $('#viewTutorial');
    if (!view) return;
    /* marca no sumário a seção que está na tela. Roda no evento de rolagem
       e também numa batida lenta, para o destaque já nascer certo ao abrir. */
    function spy() {
      if (S.view !== 'tutorial') return;
      var top = view.getBoundingClientRect().top + 90;
      var cur = TOC[0][0];
      TOC.forEach(function (t) {
        var el = document.getElementById(t[0]);
        if (el && el.getBoundingClientRect().top <= top) cur = t[0];
      });
      box.querySelectorAll('.tocitem').forEach(function (b2) {
        b2.classList.toggle('on', b2.dataset.goto === cur);
      });
    }
    view.addEventListener('scroll', spy, { passive: true });
    setInterval(spy, 260);
    spy();
  }

  function renderTutorialInspector() {
    buildToc();
    $('#inspTitle').textContent = 'FICHA · MANUAL 01';
    $('#inspId').textContent = 'MÉTODO';
    var h = '';
    h += '<div class="plate"><div class="plate-h"><span class="lbl">COMO FAZER UMA VIDEOARTE</span><i class="l"></i></div>';
    h += '<div class="pnote">manual em duas partes. a primeira é método: de onde vem a ideia e por que a montagem decide o sentido. a segunda é execução dentro do laboratório, etapa por etapa.</div></div>';
    h += '<div class="plate"><div class="plate-h"><span class="lbl">O CAMINHO</span><i class="l"></i></div>';
    h += kv('ENTRA', 'TEMA');
    h += kv('ENTRA', 'REFERÊNCIAS EXTERNAS');
    h += kv('ENTRA', 'MATERIAL CAPTADO');
    h += kv('SAI', 'POÉTICA');
    h += kv('DECIDE', 'A MONTAGEM');
    h += '</div>';
    h += '<div class="plate"><div class="plate-h"><span class="lbl">ONDE CADA ETAPA ACONTECE</span><i class="l"></i></div>';
    h += '<div class="prow chline"><span class="chtag v"></span><label>MATERIAL · MONTAGEM · EFEITO · EXPORTAÇÃO — LAB 01</label></div>';
    h += '<div class="prow chline"><span class="chtag a"></span><label>SILÊNCIO · RUÍDO · DISTORÇÃO — LAB 02</label></div>';
    h += '<div class="prow chline"><span class="chtag t"></span><label>TÍTULO · TEXTO · CRÉDITOS — LAB 03</label></div>';
    h += '</div>';
    h += '<div class="plate"><div class="plate-h"><span class="lbl">EXERCÍCIO</span><i class="l"></i></div>';
    h += '<div class="pnote">uma videoarte de 60 segundos, com no máximo um efeito de imagem no trabalho inteiro. a restrição é o que obriga a montagem a resolver.</div></div>';
    $('#props').innerHTML = h;
  }
  S.renderTutorialInspector = renderTutorialInspector;

  function renderHomeInspector() {
    $('#inspTitle').textContent = 'FICHA · SISTEMA';
    $('#inspId').textContent = 'SYS 01';
    var fxByCat = {};
    VE.FX.forEach(function (f) { fxByCat[f.cat] = (fxByCat[f.cat] || 0) + 1; });
    var h = '<div class="plate"><div class="plate-h"><span class="lbl">RGB_LAB</span><i class="l"></i></div>' +
      '<div class="pnote">rgb_lab — laboratório audiovisual experimental. Três mesas de trabalho — vídeo, áudio e tipografia — que compartilham a mesma composição, os mesmos presets e o mesmo sistema gráfico.</div></div>';
    h += '<div class="plate"><div class="plate-h"><span class="lbl">INVENTÁRIO</span><i class="l"></i></div>';
    h += kv('EFEITOS DE VÍDEO', VE.FX.length);
    Object.keys(fxByCat).forEach(function (k) { h += kv('· ' + k, fxByCat[k]); });
    h += kv('MÓDULOS DE ÁUDIO', VE.audio.modules.length);
    h += kv('ESTILOS PRONTOS', VE.STYLES.length);
    h += kv('CONJUNTOS ASCII', VE.CHARSETS.length);
    h += kv('LIMITE DE COMPOSIÇÃO', VE.limitLabel() + ' (ajustável)');
    h += '</div>';
    h += '<div class="plate"><div class="plate-h"><span class="lbl">MÁQUINA</span><i class="l"></i></div>';
    h += kv('GPU', (VE.renderer && VE.renderer.gpu ? String(VE.renderer.gpu).slice(0, 26) : '—'));
    h += kv('TELA', window.screen.width + '×' + window.screen.height);
    h += kv('NÚCLEOS', navigator.hardwareConcurrency || '—');
    h += kv('MEMÓRIA', (navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—'));
    h += '</div>';
    h += '<div class="plate"><div class="plate-h"><span class="lbl">ATALHOS</span><i class="l"></i></div>' +
      '<div class="pnote">' +
      'ESPAÇO tocar/pausar · ← → um frame · SHIFT+← → um segundo · ↑ ↓ corte anterior/seguinte · ' +
      'S cortar no cursor · M marcador · I/O entrada e saída · DEL apagar · SHIFT+DEL apagar e fechar · ' +
      'CTRL+D duplicar · CTRL+C/V copiar e colar · CTRL+A selecionar tudo · CTRL+G virar composição · ' +
      'CTRL+Z desfazer · CTRL+SHIFT+Z refazer · SHIFT+clique seleção múltipla · CTRL+arrastar duplica · ' +
      '+ − zoom da linha do tempo · \ enquadrar a sequência · F enquadrar a prévia · 0 prévia em 100% · ' +
      'ALT ao aparar faz ripple · CTRL+RODA zoom · ESPAÇO+ARRASTAR mover a tela' +
      '</div></div>';
    $('#props').innerHTML = h;
  }

  function kv(k, v) {
    return '<div class="prow" style="grid-template-columns:1fr auto"><label>' + k + '</label>' +
      '<span class="micro" style="color:var(--ink)">' + v + '</span></div>';
  }

  function renderAudioInspector() {
    $('#inspTitle').textContent = 'FICHA · ÁUDIO';
    $('#inspId').textContent = VE.audio.hasAudio() ? 'CARREGADO' : 'VAZIO';
    var b = VE.audio.buffer();
    var h = '<div class="plate"><div class="plate-h"><span class="lbl">' + (VE.audio.name() || 'SEM ÁUDIO') + '</span><i class="l"></i></div>';
    if (b) {
      h += kv('DURAÇÃO', b.duration.toFixed(2) + ' s');
      h += kv('CANAIS', b.numberOfChannels);
      h += kv('TAXA', b.sampleRate + ' Hz');
      h += kv('AMOSTRAS', b.length.toLocaleString('pt-BR'));
    } else {
      h += '<div class="pnote">carregue um arquivo, grave o microfone, gere um tom de teste ou puxe o áudio de um vídeo já carregado</div>';
    }
    h += '</div>';
    h += '<div class="plate"><div class="plate-h"><span class="lbl">CADEIA</span><i class="l"></i></div>';
    VE.audio.modules.forEach(function (m, i) {
      h += '<div class="prow" style="grid-template-columns:1fr auto"><label>' + String(i + 1).padStart(2, '0') + ' ' + m.name + '</label>' +
        '<span class="micro" style="color:' + (m.on ? 'var(--sys-green)' : 'var(--ink-4)') + '">' + (m.on ? 'ON' : 'OFF') + '</span></div>';
    });
    h += '<div class="pnote">os módulos são renderizados na ordem acima, sempre a partir do áudio original</div></div>';
    h += '<div class="plate"><div class="plate-h"><span class="lbl">SAÍDAS</span><i class="l"></i></div>' +
      '<div class="pbtns"><button class="cmd cmd-sm" id="auSend">MANDAR PRA TIMELINE</button>' +
      '<button class="cmd cmd-sm" id="auWav">EXPORTAR WAV</button></div></div>';
    $('#props').innerHTML = h;
    var s1 = $('#auSend'), s2 = $('#auWav');
    if (s1) s1.addEventListener('click', VE.audio.sendToTimeline);
    if (s2) s2.addEventListener('click', VE.audio.exportWav);
  }
  S.renderAudioInspector = renderAudioInspector;

  /* ================= CURSOR ================= */
  function initCursor() {
    var cur = $('#cursor'), txt = $('#curTxt');
    var zones = '.vp, .type-stage, .wave-wrap, .home, .labs';
    window.addEventListener('pointermove', function (e) {
      /* o alvo nem sempre é um elemento (eventos sintéticos, window) */
      var inZone = (e.target && e.target.closest) ? e.target.closest(zones) : null;
      if (!inZone || !S.entered) { cur.classList.add('hidden'); document.body.classList.remove('cursor-lock'); return; }
      cur.classList.remove('hidden');
      cur.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      var label = '';
      if (inZone.classList.contains('vp') && VE.project && VE.view) {
        var r = $('#vpStage').getBoundingClientRect();
        var px = Math.round((e.clientX - r.left) / VE.view.zoom);
        var py = Math.round((e.clientY - r.top) / VE.view.zoom);
        label = 'X:' + String(px).padStart(4, '0') + ' Y:' + String(py).padStart(4, '0');
        document.body.classList.add('cursor-lock');
      } else if (inZone.classList.contains('type-stage')) {
        label = 'TIPO'; document.body.classList.add('cursor-lock');
      } else if (inZone.classList.contains('wave-wrap')) {
        label = 'ONDA'; document.body.classList.add('cursor-lock');
      } else {
        label = String(Math.round(e.clientX)).padStart(4, '0') + '/' + String(Math.round(e.clientY)).padStart(4, '0');
        document.body.classList.remove('cursor-lock');
      }
      txt.textContent = label;
    });
    window.addEventListener('pointerleave', function () {
      cur.classList.add('hidden'); document.body.classList.remove('cursor-lock');
    });
  }

  /* ================= HOME: cartões animados ================= */
  function initHomeCards() {
    var cards = document.querySelectorAll('.lab-card');
    var t = 0;
    function tick() {
      requestAnimationFrame(tick);
      if (S.view !== 'home' || !S.entered) return;
      t += 0.03;
      cards.forEach(function (card, idx) {
        var cv = card.querySelector('canvas');
        if (!cv) return;
        var W = card.clientWidth, H = card.clientHeight;
        if (cv.width !== W) { cv.width = W; cv.height = H; }
        var c = cv.getContext('2d');
        var css = getComputedStyle(document.documentElement);
        /* cada cartao desenha no seu proprio canal: 01 azul, 02 verde, 03 vermelho */
        var chVar = ['--ch-video', '--ch-audio', '--ch-type'][idx] || '--ink';
        var ink = css.getPropertyValue(chVar).trim();
        c.clearRect(0, 0, W, H);
        c.fillStyle = ink;
        if (idx === 0) {
          for (var y = 0; y < H; y += 7) {
            for (var x = 0; x < W; x += 7) {
              var v = Math.sin(x * 0.04 + t) * Math.cos(y * 0.05 - t * 0.7);
              if (v > 0.25) c.fillRect(x, y, 3.4, 3.4);
            }
          }
        } else if (idx === 1) {
          c.strokeStyle = ink; c.lineWidth = 1.5;
          c.beginPath();
          for (var x2 = 0; x2 <= W; x2 += 3) {
            var a = Math.sin(x2 * 0.05 + t * 2) * Math.sin(x2 * 0.013 - t) * (H * 0.3);
            c.lineTo(x2, H / 2 + a);
          }
          c.stroke();
          for (var x3 = 0; x3 < W; x3 += 12) {
            var hgt = Math.abs(Math.sin(x3 * 0.07 + t * 3)) * H * 0.42;
            c.fillRect(x3, H - hgt, 5, hgt);
          }
        } else {
          c.font = '700 34px "Archivo", sans-serif';
          for (var i = 0; i < 12; i++) {
            var ch = 'RGB_LAB'[i % 7];
            c.save();
            c.translate(20 + (i * 47) % (W - 20), H / 2 + Math.sin(t + i) * 40);
            c.rotate(Math.sin(t * 0.6 + i) * 0.5);
            c.fillText(ch, 0, 0);
            c.restore();
          }
        }
      });
    }
    tick();
  }

  /* ================= RELÓGIO / STATUS ================= */
  function initChrome() {
    setInterval(function () {
      var el = $('#clock');
      if (el) el.textContent = new Date().toLocaleTimeString('pt-BR');
      var st = $('#homeStamp');
      if (st) st.textContent = new Date().toLocaleString('pt-BR').toUpperCase();
    }, 1000);

    /* modo claro (papel) / noturno (darkroom) */
    S.setMode = function (mode) {
      mode = (mode === 'darkroom') ? 'darkroom' : 'paper';
      document.documentElement.dataset.mode = mode;
      document.querySelectorAll('#modeSeg button').forEach(function (b) {
        b.classList.toggle('on', b.dataset.mode === mode);
      });
      try { localStorage.setItem('videorte.mode', mode); } catch (e) { }
      glyphs = null;                       /* o atlas do ascii da entrada é redesenhado */
      if (VE.audio) VE.audio.drawWave();
      if (VE.view) VE.view.drawRulers();
      if (VE.type && VE.shell.view === 'type') VE.type.draw();
    };
    document.querySelectorAll('#modeSeg button').forEach(function (b) {
      b.addEventListener('click', function () { S.setMode(b.dataset.mode); });
    });
    var savedMode = null;
    try { savedMode = localStorage.getItem('videorte.mode'); } catch (e) { }
    S.setMode(savedMode || 'paper');

    /* qualquer elemento com data-view navega — cartões, pastas, botões do manual */
    document.querySelectorAll('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { S.go(b.dataset.view); });
    });
    $('#navAbout').addEventListener('click', function () { S.go('home'); renderHomeInspector(); });
    $('#navPresets').addEventListener('click', function () {
      S.go('video');
      VE.app.toast('presets ficam na coluna da esquerda, embaixo do catálogo');
    });
    $('#navProjects').addEventListener('click', function () {
      VE.app.toast('use SALVAR PROJETO / ABRIR na barra de status');
    });

    var gpu = $('#homeGpu');
    if (gpu && VE.renderer) gpu.innerHTML = 'GPU <b class="lbl-ink">' + String(VE.renderer.gpu || '—').slice(0, 22).toUpperCase() + '</b>';
  }

  S.updateStatus = function () {
    var p = VE.project;
    var sc = $('#srcCount');
    if (sc) sc.textContent = String(Object.keys(VE.sources).length).padStart(2, '0');
    var clips = p ? VE.allClips() : [];
    var withSrc = clips.filter(function (c) { return c.src && VE.sources[c.src]; });
    $('#stSrc').textContent = withSrc.length ? (VE.sources[withSrc[0].src] || {}).name || '—' : 'NENHUMA';
    $('#stRes').textContent = p ? p.canvas.w + '×' + p.canvas.h : '—';
    $('#stLayers').textContent = p ? p.tracks.length : 0;
    $('#stFx').textContent = clips.reduce(function (a, c) { return a + (c.effects ? c.effects.length : 0); }, 0);
  };

  S.init = function () {
    initIntro();
    initCursor();
    initHomeCards();
    initChrome();
  };

})(window.VE);
