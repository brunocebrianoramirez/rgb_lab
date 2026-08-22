/* ============================================================
   rgb_lab — LINHA DO TEMPO
   ------------------------------------------------------------
   Uma mesa de edição não linear de verdade:

     · pistas V / A / FX, cada uma com vários clipes lado a lado
     · arrastar, mover entre pistas, aparar as bordas (trim)
     · cortar no cursor, ripple, apagar trecho
     · camadas de ajuste que alcançam tudo abaixo
     · keyframes visíveis e arrastáveis
     · transições nas bordas, com duração arrastável
     · ímã, marcadores, entrada/saída, zoom e rolagem independentes

   O desenho é HTML puro — nada de canvas — para que cada clipe continue
   sendo um elemento inspecionável, com foco, atalho e estado.
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var TL = VE.tl = {
    pps: 120,            /* pixels por segundo */
    snap: true,
    focusProp: null,     /* propriedade em foco: seus keyframes ficam grandes */
    tcMode: 'frames'     /* frames | seconds */
  };

  var elHeads, elScroll, elContent, elRuler, elLanes, elPlayhead, elMarq;
  var drag = null;
  var HEAD_H = 24;       /* altura da régua */

  /* ============================================================= UTIL ===== */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) {
      return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c];
    });
  }

  TL.timeToX = function (t) { return t * TL.pps; };
  TL.xToTime = function (x) { return Math.max(0, x / TL.pps); };

  /* timecode do projeto: 00:00:12:18 (h:m:s:frames) ou 00:12.18 */
  TL.tc = function (t, mode) {
    var fps = (VE.project && VE.project.fps) || 30;
    t = Math.max(0, t);
    if ((mode || TL.tcMode) === 'seconds') {
      var mm = Math.floor(t / 60), ss = t - mm * 60;
      return pad(mm) + ':' + (ss < 10 ? '0' : '') + ss.toFixed(2);
    }
    var total = Math.round(t * fps);
    var f = total % fps;
    var s = Math.floor(total / fps) % 60;
    var m = Math.floor(total / (fps * 60)) % 60;
    var h = Math.floor(total / (fps * 3600));
    return pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(f);
  };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  VE.fmtTime = function (t) { return TL.tc(t); };

  /* rótulo curto para a régua */
  function ruleLabel(t) {
    var fps = (VE.project && VE.project.fps) || 30;
    if (TL.pps > 400) {
      var f = Math.round(t * fps) % fps;
      return pad(Math.floor(t)) + ':' + pad(f);
    }
    var m = Math.floor(t / 60), s = t - m * 60;
    if (m > 0) return m + ':' + (s < 10 ? '0' : '') + s.toFixed(TL.pps > 200 ? 1 : 0);
    return s.toFixed(TL.pps > 200 ? 1 : 0) + 'S';
  }

  /* ========================================================= ÍMÃ (SNAP) === */
  TL.snapPoints = function (ignore) {
    var p = VE.project, pts = [0, p.duration, p.time];
    if (p.inPoint != null) pts.push(p.inPoint);
    if (p.outPoint != null) pts.push(p.outPoint);
    p.markers.forEach(function (m) { pts.push(m.t); });
    p.tracks.forEach(function (tr) {
      tr.clips.forEach(function (c) {
        if (ignore && ignore.indexOf(c.id) >= 0) return;
        pts.push(c.start, c.start + c.dur);
        /* keyframes também atraem — ajuda a casar movimento com corte */
        Object.keys(c.keys || {}).forEach(function (k) {
          c.keys[k].forEach(function (kf) { pts.push(c.start + kf.t); });
        });
      });
    });
    return pts;
  };

  function snapT(t, disable, ignore) {
    if (disable || !TL.snap) return t;
    var tol = 10 / TL.pps;
    var pts = TL.snapPoints(ignore);
    var best = t, bd = tol;
    for (var i = 0; i < pts.length; i++) {
      var d = Math.abs(pts[i] - t);
      if (d < bd) { bd = d; best = pts[i]; }
    }
    return best;
  }
  TL.snapT = snapT;

  /* alinha ao frame quando o zoom já mostra frames */
  function quant(t) {
    var fps = (VE.project && VE.project.fps) || 30;
    if (TL.pps < 240) return t;
    return Math.round(t * fps) / fps;
  }

  /* ============================================================== INIT ==== */

  TL.init = function () {
    elHeads = $('#tlHeads'); elScroll = $('#tlScroll'); elContent = $('#tlContent');
    elRuler = $('#tlRuler'); elLanes = $('#tlLanes'); elPlayhead = $('#playhead');
    elMarq = $('#tlMarquee');

    var zr = $('#zoomRange');
    if (zr) zr.addEventListener('input', function () { TL.pps = +zr.value; TL.render(); });

    elScroll.addEventListener('scroll', function () {
      elHeads.scrollTop = elScroll.scrollTop;
      TL.cull();
    });

    elScroll.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        var rect = elScroll.getBoundingClientRect();
        var mx = e.clientX - rect.left + elScroll.scrollLeft;
        var tAt = mx / TL.pps;
        TL.setZoom(TL.pps * (e.deltaY < 0 ? 1.18 : 0.85), false);
        elScroll.scrollLeft = Math.max(0, tAt * TL.pps - (e.clientX - rect.left));
      } else if (e.shiftKey) {
        e.preventDefault(); elScroll.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    /* ---- régua: arrastar o cursor, clicar com alt cria marcador ---- */
    elRuler.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      elRuler.setPointerCapture(e.pointerId);
      var move = function (ev) {
        var r = elContent.getBoundingClientRect();
        var t = TL.xToTime(ev.clientX - r.left);
        VE.app.seek(quant(snapT(t, ev.shiftKey)));
      };
      move(e);
      var up = function () {
        elRuler.removeEventListener('pointermove', move);
        elRuler.removeEventListener('pointerup', up);
      };
      elRuler.addEventListener('pointermove', move);
      elRuler.addEventListener('pointerup', up);
    });

    /* ---- soltar efeito vindo do catálogo ---- */
    elLanes.addEventListener('dragover', function (e) {
      if (!e.dataTransfer.types.includes('text/fx')) return;
      e.preventDefault();
      elLanes.querySelectorAll('.drop').forEach(function (l) { l.classList.remove('drop'); });
      var clip = e.target.closest('.clip');
      var lane = e.target.closest('.lane');
      (clip || lane || {}).classList && (clip || lane).classList.add('drop');
    });
    elLanes.addEventListener('dragleave', function () {
      elLanes.querySelectorAll('.drop').forEach(function (l) { l.classList.remove('drop'); });
    });
    elLanes.addEventListener('drop', function (e) {
      var fxId = e.dataTransfer.getData('text/fx');
      elLanes.querySelectorAll('.drop').forEach(function (l) { l.classList.remove('drop'); });
      if (!fxId) return;
      e.preventDefault();
      var clipEl = e.target.closest('.clip');
      var r = elContent.getBoundingClientRect();
      var t = Math.max(0, TL.xToTime(e.clientX - r.left));
      if (clipEl) {
        /* em cima de um clipe → o efeito pertence àquele clipe */
        var f = VE.findClip(clipEl.dataset.clip);
        if (f) {
          VE.addEffect(f.clip, fxId);
          VE.select([f.clip.id]);
          VE.app.toast('efeito no clipe ' + f.clip.name);
        }
      } else {
        /* na pista vazia → vira uma CAMADA DE AJUSTE, que alcança tudo abaixo */
        var laneEl = e.target.closest('.lane');
        var tr = laneEl ? VE.findTrack(laneEl.dataset.track) : null;
        var total = VE.duration();
        var c = VE.newAdjust(Math.min(t, total - 0.4), Math.max(0.5, total - t), fxId);
        c.name = (VE.FXBY[fxId] || {}).name || fxId;
        VE.insertClip(c, tr && tr.kind !== 'audio' ? tr : null);
        VE.select([c.id]);
        VE.app.toast('camada de ajuste — afeta tudo abaixo dela');
      }
      VE.pushHistory(); VE.emit('project');
    });

    /* ---- seleção por laço no fundo das pistas ---- */
    elLanes.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      if (e.target.closest('.clip')) return;
      var r = elContent.getBoundingClientRect();
      var x0 = e.clientX - r.left, y0 = e.clientY - r.top;
      if (!e.shiftKey) { VE.clearSelection(); TL.markSelection(); VE.emit('select'); }
      elLanes.setPointerCapture(e.pointerId);
      var moved = false;
      function mv(ev) {
        moved = true;
        var x1 = ev.clientX - r.left, y1 = ev.clientY - r.top;
        elMarq.classList.remove('hidden');
        elMarq.style.left = Math.min(x0, x1) + 'px';
        elMarq.style.top = Math.min(y0, y1) + 'px';
        elMarq.style.width = Math.abs(x1 - x0) + 'px';
        elMarq.style.height = Math.abs(y1 - y0) + 'px';
        marqueeSelect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0), ev.shiftKey);
      }
      function up(ev) {
        elLanes.removeEventListener('pointermove', mv);
        elLanes.removeEventListener('pointerup', up);
        elMarq.classList.add('hidden');
        if (!moved) VE.app.seek(quant(TL.xToTime(ev.clientX - r.left)));
        VE.emit('select');
      }
      elLanes.addEventListener('pointermove', mv);
      elLanes.addEventListener('pointerup', up);
    });

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('pointermove', onDragMove);
  };

  function marqueeSelect(x, y, w, h, add) {
    var ids = [];
    elLanes.querySelectorAll('.clip').forEach(function (el) {
      var l = el.offsetLeft, t = el.offsetParent === elLanes ? el.offsetTop : el.parentElement.offsetTop + el.offsetTop;
      var r2 = l + el.offsetWidth, b = t + el.offsetHeight;
      if (l < x + w && r2 > x && t < y + h && b > y) ids.push(el.dataset.clip);
    });
    VE.select(ids, add);
    TL.markSelection();
  }

  /* =============================================================== ZOOM === */
  TL.setZoom = function (pps, keepLeft) {
    TL.pps = Math.max(6, Math.min(2400, pps));
    var zr = $('#zoomRange');
    if (zr) zr.value = Math.min(zr.max, Math.max(zr.min, TL.pps));
    TL.render();
    if (keepLeft === false) return;
  };

  TL.fitSequence = function () {
    var w = elScroll.clientWidth - 24;
    TL.setZoom(w / Math.max(0.5, VE.duration()));
    elScroll.scrollLeft = 0;
  };

  TL.zoomToSelection = function () {
    var cs = VE.selectedClips();
    if (!cs.length) return TL.fitSequence();
    var a = Infinity, b = -Infinity;
    cs.forEach(function (c) { a = Math.min(a, c.start); b = Math.max(b, c.start + c.dur); });
    var w = elScroll.clientWidth - 40;
    TL.setZoom(w / Math.max(0.2, b - a));
    elScroll.scrollLeft = Math.max(0, TL.timeToX(a) - 20);
  };

  /* ============================================================ DESENHO === */

  TL.render = function () {
    if (!VE.project || !elLanes) return;
    var p = VE.project, total = VE.duration();
    var w = Math.max(total * TL.pps + 80, elScroll.clientWidth);
    elContent.style.width = w + 'px';

    var dur = $('#tlDur'); if (dur) dur.textContent = TL.tc(total);
    var zl = $('#tlZoomLbl'); if (zl) zl.textContent = TL.pps.toFixed(0) + ' PX/S';

    renderRuler(total, w);
    renderHeads();
    renderLanes(w);
    TL.setTime(p.time);
    TL.cull();
  };

  function renderRuler(total, w) {
    var p = VE.project;
    var steps = [1 / p.fps, 2 / p.fps, 5 / p.fps, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60];
    var step = steps[steps.length - 1];
    for (var s = 0; s < steps.length; s++) { if (steps[s] * TL.pps >= 64) { step = steps[s]; break; } }
    var html = '';
    for (var t = 0; t <= total + 0.0001; t += step) {
      html += '<div class="tick" style="left:' + TL.timeToX(t).toFixed(1) + 'px"><span>' + ruleLabel(t) + '</span></div>';
      if (step * TL.pps > 110) {
        for (var k = 1; k < 4; k++) {
          var tt = t + step * k / 4;
          if (tt > total) break;
          html += '<div class="tick minor" style="left:' + TL.timeToX(tt).toFixed(1) + 'px"></div>';
        }
      }
    }
    /* zona de entrada/saída */
    if (p.inPoint != null || p.outPoint != null) {
      var a = p.inPoint == null ? 0 : p.inPoint;
      var b = p.outPoint == null ? total : p.outPoint;
      html += '<div class="inout" style="left:' + TL.timeToX(a).toFixed(1) + 'px;width:' +
        Math.max(1, TL.timeToX(b - a)).toFixed(1) + 'px"></div>';
      if (p.inPoint != null) html += '<div class="iomark i" style="left:' + TL.timeToX(a).toFixed(1) + 'px">I</div>';
      if (p.outPoint != null) html += '<div class="iomark o" style="left:' + TL.timeToX(b).toFixed(1) + 'px">O</div>';
    }
    /* marcadores */
    p.markers.forEach(function (m) {
      html += '<div class="marker" data-marker="' + m.id + '" style="left:' + TL.timeToX(m.t).toFixed(1) + 'px" ' +
        'title="' + esc(m.name || 'MARCADOR') + ' · ' + TL.tc(m.t) + '"><i></i><span>' + esc(m.name || '') + '</span></div>';
    });
    elRuler.innerHTML = html;
    elRuler.style.width = w + 'px';

    elRuler.querySelectorAll('.marker').forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        var m = VE.project.markers.filter(function (x) { return x.id === el.dataset.marker; })[0];
        if (!m) return;
        if (e.altKey) { VE.removeMarker(m.id); VE.pushHistory(); VE.emit('project'); return; }
        startDrag({ mode: 'marker', marker: m, x0: e.clientX, t0: m.t });
      });
      el.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        var m = VE.project.markers.filter(function (x) { return x.id === el.dataset.marker; })[0];
        if (!m) return;
        var n = prompt('nome do marcador em ' + TL.tc(m.t) + ':', m.name || '');
        if (n !== null) { m.name = n; VE.pushHistory(); VE.emit('project'); }
      });
    });
  }

  /* ------------------------------------------------------ ÍCONES DA PISTA
     Os botões do cabeçalho eram quadradinhos de 15 px com um caractere
     dentro (▪ ▫ ◉ ◌) — dava para clicar, não dava para RECONHECER. Aqui
     eles viram desenho: olho, cadeado, alto-falante, seta. Traço em
     `currentColor`, então herdam a cor de ligado/desligado do botão.    */
  var SVG = function (d, extra) {
    return '<svg class="tsvg" viewBox="0 0 16 16" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + d + (extra || '') + '</g></svg>';
  };
  var RISCO = '<line x1="2.5" y1="13.5" x2="13.5" y2="2.5"/>';

  var IC = {
    olho: SVG('<path d="M1.2 8s2.6-4.3 6.8-4.3S14.8 8 14.8 8s-2.6 4.3-6.8 4.3S1.2 8 1.2 8z"/><circle cx="8" cy="8" r="1.9"/>'),
    olhoOff: SVG('<path d="M1.2 8s2.6-4.3 6.8-4.3S14.8 8 14.8 8s-2.6 4.3-6.8 4.3S1.2 8 1.2 8z"/><circle cx="8" cy="8" r="1.9"/>', RISCO),
    som: SVG('<path d="M3.2 6.2h2.2L8.6 3.4v9.2L5.4 9.8H3.2z"/><path d="M10.8 5.9a3 3 0 0 1 0 4.2"/><path d="M12.7 4.1a5.6 5.6 0 0 1 0 7.8"/>'),
    somOff: SVG('<path d="M3.2 6.2h2.2L8.6 3.4v9.2L5.4 9.8H3.2z"/><path d="M11 6.4l3.4 3.2M14.4 6.4L11 9.6"/>'),
    /* cadeado: fechado com o arco encostado no corpo, aberto com o arco
       levantado e girado. A diferença é visível a 20 px.               */
    cadeado: SVG('<rect x="3.2" y="7.1" width="9.6" height="6.4" rx="1.1"/><path d="M5.6 7.1V5.3a2.4 2.4 0 0 1 4.8 0v1.8"/>'),
    cadeadoOff: SVG('<rect x="3.2" y="7.1" width="9.6" height="6.4" rx="1.1"/><path d="M5.6 7.1V5.3a2.4 2.4 0 0 1 4.6-.7"/>'),
    solo: SVG('<path d="M8 1.9l1.75 3.9 4.25.45-3.2 2.85.92 4.2L8 11.15 4.28 13.3l.92-4.2L2 6.25l4.25-.45z"/>'),
    abrir: SVG('<path d="M4 6.2l4 3.9 4-3.9"/>'),
    fechar: SVG('<path d="M6.2 4l3.9 4-3.9 4"/>')
  };

  /* o mesmo cadeado serve à ficha do clipe, para não haver dois desenhos
     de "travado" no mesmo produto */
  TL.iconeCadeado = function (fechado) { return fechado ? IC.cadeado : IC.cadeadoOff; };

  /* ══════════════════════════════════════════════ FERRAMENTAS ═══════════
     A ilha de edição tem MODOS, e a mão aprende a tecla antes do botão.
     As letras são as de sempre (Premiere, Resolve, Avid usam as mesmas):

       V  seleção     mover, aparar, escolher
       C  tesoura     clicar num clipe corta ali
       H  mão         arrastar a linha do tempo
       B  ondulação   aparar fechando o vão que sobra

     Ctrl/Cmd+K corta no cursor sem trocar de ferramenta, que é como se
     corta na prática — o modo tesoura serve para cortar em vários pontos
     seguidos, olhando a imagem.                                        */
  TL.FERRAMENTAS = [
    { id: 'sel', tecla: 'V', nome: 'SELEÇÃO', dica: 'mover, aparar, escolher (V)', cursor: 'default' },
    { id: 'corte', tecla: 'C', nome: 'TESOURA', dica: 'clique num clipe para cortar ali (C)', cursor: 'crosshair' },
    { id: 'mao', tecla: 'H', nome: 'MÃO', dica: 'arrasta a linha do tempo (H)', cursor: 'grab' },
    { id: 'ondula', tecla: 'B', nome: 'ONDULAÇÃO', dica: 'apara fechando o vão (B)', cursor: 'ew-resize' }
  ];
  TL.ferramenta = 'sel';

  TL.setFerramenta = function (id) {
    if (!TL.FERRAMENTAS.some(function (f) { return f.id === id; })) return;
    TL.ferramenta = id;
    var body = document.querySelector('.tl-body');
    if (body) {
      TL.FERRAMENTAS.forEach(function (f) { body.classList.remove('tool-' + f.id); });
      body.classList.add('tool-' + id);
    }
    document.querySelectorAll('[data-ferr]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.ferr === id);
    });
    var f = TL.FERRAMENTAS.filter(function (x) { return x.id === id; })[0];
    if (f && VE.app && VE.app.toast) VE.app.toast(f.nome + ' · ' + f.dica);
  };

  /* ------------------------------------------------- cabeçalhos de pista */
  function renderHeads() {
    var p = VE.project;
    var h = '<div class="thead-pad" style="height:' + HEAD_H + 'px"></div>';
    p.tracks.forEach(function (tr) {
      var lab = VE.trackLabel(tr);
      var kind = tr.kind;
      var hgt = tr.expanded ? VE.TRACK_H_BIG : VE.TRACK_H;
      h += '<div class="thead k' + kind + (tr.legenda ? ' leg' : '') + (tr.locked ? ' locked' : '') + '" data-track="' + tr.id + '" style="height:' + hgt + 'px">' +
        '<span class="tno">' + lab + '</span>' +
        '<span class="tname" contenteditable="true" spellcheck="false" data-track="' + tr.id + '">' + esc(tr.name || '') + '</span>' +
        '<div class="tbtns">' +
        (kind === 'audio'
          ? '<button class="ticon' + (tr.muted ? ' off' : '') + '" data-act="mute" title="' + (tr.muted ? 'Mudo — clique para ouvir (M)' : 'Ouvindo — clique para calar (M)') + '">' + (tr.muted ? IC.somOff : IC.som) + '</button>' +
          '<button class="ticon' + (tr.solo ? ' act' : '') + '" data-act="solo" title="Só esta pista">' + IC.solo + '</button>'
          : '<button class="ticon' + (tr.visible ? '' : ' off') + '" data-act="vis" title="' + (tr.visible ? 'Visível — clique para esconder' : 'Escondida — clique para mostrar') + '">' + (tr.visible ? IC.olho : IC.olhoOff) + '</button>' +
          '<button class="ticon' + (tr.solo ? ' act' : '') + '" data-act="solo" title="Só esta pista">' + IC.solo + '</button>') +
        '<button class="ticon' + (tr.locked ? ' act' : '') + '" data-act="lock" title="' + (tr.locked ? 'Travada — clique para destravar' : 'Destravada — clique para travar') + '">' + (tr.locked ? IC.cadeado : IC.cadeadoOff) + '</button>' +
        '<button class="ticon' + (tr.expanded ? ' act' : '') + '" data-act="exp" title="' + (tr.expanded ? 'Encolher a pista' : 'Expandir a pista') + '">' + (tr.expanded ? IC.abrir : IC.fechar) + '</button>' +
        '</div></div>';
    });
    elHeads.innerHTML = h;

    elHeads.querySelectorAll('[data-act]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var tr = VE.findTrack(el.closest('.thead').dataset.track);
        if (!tr) return;
        var a = el.dataset.act;
        if (a === 'vis') tr.visible = !tr.visible;
        else if (a === 'mute') tr.muted = !tr.muted;
        else if (a === 'solo') tr.solo = !tr.solo;
        else if (a === 'lock') tr.locked = !tr.locked;
        else if (a === 'exp') { tr.expanded = !tr.expanded; tr.height = tr.expanded ? VE.TRACK_H_BIG : VE.TRACK_H; }
        VE.pushHistory(); VE.emit('project');
      });
    });
    elHeads.querySelectorAll('.tname').forEach(function (el) {
      el.addEventListener('blur', function () {
        var tr = VE.findTrack(el.dataset.track);
        if (tr) tr.name = el.textContent.trim();
        VE.pushHistory(); VE.emit('project');
      });
      el.addEventListener('keydown', function (e) {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      });
    });
    /* menu da pista pelo botão direito */
    elHeads.querySelectorAll('.thead').forEach(function (el) {
      el.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        var tr = VE.findTrack(el.dataset.track);
        if (tr) TL.trackMenu(tr, e.clientX, e.clientY);
      });
    });
  }

  /* --------------------------------------------------------------- pistas */
  function renderLanes(w) {
    var p = VE.project;
    var h = '';
    p.tracks.forEach(function (tr) {
      var hgt = tr.expanded ? VE.TRACK_H_BIG : VE.TRACK_H;
      h += '<div class="lane k' + tr.kind + (tr.legenda ? ' leg' : '') + (tr.locked ? ' locked' : '') + (VE.trackVisible(tr) || tr.kind === 'audio' ? '' : ' hiddenTrack') +
        '" data-track="' + tr.id + '" style="height:' + hgt + 'px">';
      tr.clips.forEach(function (c) { h += clipHtml(c, tr); });
      h += '</div>';
    });
    elLanes.innerHTML = h;
    elLanes.style.width = w + 'px';
    bindClips();
    /* a classe da ferramenta vive no corpo da linha do tempo e o CSS
       decide o cursor a partir dela */
    var corpo = document.querySelector('.tl-body');
    if (corpo && !corpo.classList.contains('tool-' + TL.ferramenta)) {
      TL.FERRAMENTAS.forEach(function (f) { corpo.classList.remove('tool-' + f.id); });
      corpo.classList.add('tool-' + TL.ferramenta);
    }
    TL.markSelection();
    drawWaveforms();
  }

  /* classe de cor de um clipe — os três canais do rgb_lab */
  function clipClass(c, tr) {
    if (c.kind === 'audio') return 'ch-audio';
    if (c.kind === 'legenda') return 'ch-legenda';
    if (c.kind === 'type') return 'ch-type';
    if (c.kind === 'adjust') return 'ch-adjust';
    if (c.kind === 'comp') return 'ch-comp';
    if (tr.kind === 'audio') return 'ch-audio';
    return 'ch-video';
  }

  function clipHtml(c, tr) {
    var x = TL.timeToX(c.start), w = Math.max(3, TL.timeToX(c.dur));
    var cls = 'clip ' + clipClass(c, tr);
    if (!c.enabled) cls += ' off';
    if (c.locked) cls += ' locked';
    if (VE.isSelected(c.id)) cls += ' sel';

    /* numa legenda, o que interessa ler no clipe é O TEXTO — não
       "LEGENDA 07". O nome fica na dica, o texto fica na cara.     */
    var ehLeg = (c.kind === 'legenda');
    var rotulo = ehLeg ? (String(c.texto || '').replace(/\s+/g, ' ').trim() || '(vazia)') : c.name;

    var h = '<div class="' + cls + '" data-clip="' + c.id + '" data-kind="' + c.kind + '" ' +
      'style="left:' + x.toFixed(1) + 'px;width:' + w.toFixed(1) + 'px" title="' + esc(rotulo) + ' · ' +
      TL.tc(c.start) + ' → ' + TL.tc(c.start + c.dur) + '">';

    h += '<div class="chandle l" data-h="l"></div>';
    h += '<div class="chandle r" data-h="r"></div>';

    /* rótulo + indicadores técnicos de estado */
    h += '<div class="clabel"><b>' + esc(rotulo) + '</b>' + stateFlags(c) + '</div>';
    h += '<div class="cbody">';
    if (c.kind === 'audio' || (c.kind === 'video' && tr.kind === 'audio')) {
      h += '<canvas class="wavecv" data-wave="' + c.id + '"></canvas>';
    }
    if (c.kind === 'adjust') h += '<div class="adjhatch"></div>';
    /* faixinhas de fade de opacidade / volume */
    if (c.fadeIn > 0.005) h += '<div class="fade in" style="width:' + TL.timeToX(c.fadeIn).toFixed(1) + 'px"></div>';
    if (c.fadeOut > 0.005) h += '<div class="fade out" style="width:' + TL.timeToX(c.fadeOut).toFixed(1) + 'px"></div>';
    h += '</div>';

    /* transições nas bordas */
    if (c.transIn) h += transHtml(c, 'in');
    if (c.transOut) h += transHtml(c, 'out');

    /* keyframes */
    h += keyHtml(c, tr);

    return h + '</div>';
  }

  function stateFlags(c) {
    var f = '';
    if (c.effects && c.effects.length) f += '<i class="fl fx" title="' + c.effects.length + ' efeito(s)">fx' + c.effects.length + '</i>';
    if (Object.keys(c.keys || {}).length) f += '<i class="fl kf" title="tem keyframes">◆</i>';
    if (c.transIn || c.transOut) f += '<i class="fl tr" title="tem transição">⇥</i>';
    if (c.locked) f += '<i class="fl lk" title="clipe travado">' + IC.cadeado + '</i>';
    if (!c.enabled) f += '<i class="fl no" title="desligado">×</i>';
    if (c.muted) f += '<i class="fl mu" title="mudo">M</i>';
    if (c.kind === 'comp') f += '<i class="fl cp" title="composição aninhada">▦</i>';
    return f;
  }

  function transHtml(c, side) {
    var tr = side === 'in' ? c.transIn : c.transOut;
    var d = VE.TRANSBY[tr.type] || { name: tr.type };
    var w = Math.max(6, TL.timeToX(tr.dur));
    return '<div class="ctrans ' + side + '" data-trans="' + side + '" style="width:' + w.toFixed(1) + 'px" ' +
      'title="' + esc(d.name) + ' · ' + tr.dur.toFixed(2) + 's"><span>' + esc(d.name.split('·').pop().trim()) + '</span>' +
      '<i class="tgrip"></i></div>';
  }

  function keyHtml(c, tr) {
    var keys = c.keys || {};
    var paths = Object.keys(keys);
    if (!paths.length) return '';
    var h = '';
    if (tr.expanded && VE.isSelected(c.id) && TL.focusProp && keys[TL.focusProp]) {
      /* pista expandida com propriedade em foco: gráfico de valor dentro do clipe */
      h += valueGraph(c, TL.focusProp);
    }
    paths.forEach(function (path) {
      var focus = (path === TL.focusProp);
      keys[path].forEach(function (k) {
        h += '<div class="kfdot' + (focus ? ' focus' : '') + '" data-kf="' + esc(path) + '" data-kt="' + k.t +
          '" data-ease="' + esc(k.ease || 'easeInOut') + '" title="' + esc(pathLabel(path)) + ' · ' + TL.tc(c.start + k.t) +
          '" style="left:' + TL.timeToX(k.t).toFixed(1) + 'px"></div>';
      });
    });
    return h;
  }

  function pathLabel(path) {
    if (VE.KEYPATH[path]) return VE.KEYPATH[path].label;
    if (path.indexOf('fx.') === 0) {
      var bits = path.split('.');
      return 'EFEITO · ' + bits[bits.length - 1].toUpperCase();
    }
    return path.toUpperCase();
  }
  TL.pathLabel = pathLabel;

  /* desenha a curva da propriedade em foco dentro do clipe */
  function valueGraph(c, path) {
    var ks = c.keys[path];
    if (!ks || ks.length < 2) return '';
    var lo = Infinity, hi = -Infinity;
    ks.forEach(function (k) { lo = Math.min(lo, k.v); hi = Math.max(hi, k.v); });
    if (hi - lo < 1e-6) { hi = lo + 1; }
    var n = Math.max(24, Math.min(240, Math.round(TL.timeToX(c.dur) / 3)));
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var lt = c.dur * i / n;
      var v = VE.valueAt(c, path, lt);
      pts.push((TL.timeToX(lt)).toFixed(1) + ',' + (100 - ((v - lo) / (hi - lo)) * 92 - 4).toFixed(1));
    }
    return '<svg class="kfgraph" preserveAspectRatio="none" viewBox="0 0 ' + Math.max(1, TL.timeToX(c.dur)).toFixed(1) + ' 100">' +
      '<polyline points="' + pts.join(' ') + '"/></svg>';
  }

  /* ------------------------------------------------------------- ondas */
  function drawWaveforms() {
    elLanes.querySelectorAll('canvas[data-wave]').forEach(function (cv) {
      var f = VE.findClip(cv.dataset.wave);
      if (!f) return;
      var s = VE.sources[f.clip.src];
      var W = Math.max(2, Math.round(cv.parentElement.clientWidth));
      var H = Math.max(2, Math.round(cv.parentElement.clientHeight));
      if (W < 2 || H < 2) return;
      cv.width = W; cv.height = H;
      var c = cv.getContext('2d');
      var css = getComputedStyle(document.documentElement);
      c.clearRect(0, 0, W, H);
      var peaks = s && VE.audio && VE.audio.peaksFor ? VE.audio.peaksFor(s) : null;
      c.fillStyle = css.getPropertyValue('--ch-audio').trim();
      c.globalAlpha = 0.55;
      if (!peaks) {
        /* sem onda decodificada: uma régua neutra, para não mentir */
        for (var x = 0; x < W; x += 3) c.fillRect(x, H / 2 - 1, 1, 2);
        return;
      }
      var dur = s.duration || 1;
      for (var px = 0; px < W; px++) {
        var tt = (f.clip.in + (px / W) * f.clip.dur) / dur;
        var i = Math.max(0, Math.min(peaks.length / 2 - 1, Math.floor(tt * (peaks.length / 2))));
        var mn = peaks[i * 2], mx = peaks[i * 2 + 1];
        var y1 = (1 - (mx * 0.9 + 1) / 2) * H, y2 = (1 - (mn * 0.9 + 1) / 2) * H;
        c.fillRect(px, y1, 1, Math.max(1, y2 - y1));
      }
      c.globalAlpha = 1;
    });
  }
  TL.drawWaveforms = drawWaveforms;

  /* =========================================== ATUALIZAÇÕES LEVES ========= */

  /* só reposiciona: usada durante o arraste, sem remontar o DOM */
  TL.renderLite = function () {
    var p = VE.project;
    p.tracks.forEach(function (tr) {
      var lane = elLanes.querySelector('.lane[data-track="' + tr.id + '"]');
      if (!lane) return;
      tr.clips.forEach(function (c) {
        var el = lane.querySelector('.clip[data-clip="' + c.id + '"]');
        if (!el) return;
        el.style.left = TL.timeToX(c.start).toFixed(1) + 'px';
        el.style.width = Math.max(3, TL.timeToX(c.dur)).toFixed(1) + 'px';
        var ti = el.querySelector('.ctrans.in'), to = el.querySelector('.ctrans.out');
        if (ti && c.transIn) ti.style.width = Math.max(6, TL.timeToX(c.transIn.dur)).toFixed(1) + 'px';
        if (to && c.transOut) to.style.width = Math.max(6, TL.timeToX(c.transOut.dur)).toFixed(1) + 'px';
      });
    });
  };

  TL.markSelection = function () {
    if (!elLanes) return;
    elLanes.querySelectorAll('.clip').forEach(function (el) {
      el.classList.toggle('sel', VE.isSelected(el.dataset.clip));
    });
    var n = VE.project ? VE.project.selection.length : 0;
    var el = $('#tlSel');
    if (el) el.textContent = n ? (n + ' SELECIONADO' + (n > 1 ? 'S' : '')) : '—';
  };

  TL.setTime = function (t) {
    if (!elPlayhead) return;
    var x = TL.timeToX(t);
    elPlayhead.style.left = x.toFixed(1) + 'px';
    var lbl = elPlayhead.querySelector('.ph-tc');
    if (lbl) lbl.textContent = TL.tc(t);
    if (VE.app && VE.app.playing) {
      var vw = elScroll.clientWidth;
      if (x < elScroll.scrollLeft + 30 || x > elScroll.scrollLeft + vw - 60) {
        elScroll.scrollLeft = Math.max(0, x - vw * 0.35);
      }
    }
  };

  /* virtualização horizontal: some com o que está fora da janela */
  TL.cull = function () {
    if (!elLanes) return;
    var l = elScroll.scrollLeft - 400, r = l + elScroll.clientWidth + 800;
    elLanes.querySelectorAll('.clip').forEach(function (el) {
      var a = el.offsetLeft, b = a + el.offsetWidth;
      el.style.visibility = (b < l || a > r) ? 'hidden' : '';
    });
  };

  /* ============================================================= ARRASTE == */

  /* ------------------------------------------------- ROLAR ARRASTANDO
     Levar um clipe para além da borda visível não pode exigir soltar,
     rolar e pegar de novo. Encostou na beirada, a linha do tempo anda
     sozinha — e quanto mais fundo na beirada, mais rápido ela anda.

     O detalhe que faz isto funcionar: quando o conteúdo rola, o ponteiro
     fica parado mas o TEMPO debaixo dele muda. Por isso a origem do
     arraste (`drag.x0`) anda o mesmo tanto, em sentido contrário. Sem
     isso o clipe fica para trás da rolagem, escorregando da mão.

     Vale nos dois eixos: horizontal para levar no tempo, vertical para
     alcançar uma pista que está fora da tela.                        */
  var rolagem = null;
  var ZONA = 56;          /* px de beirada que acionam */
  var PASSO = 22;         /* px por quadro na velocidade máxima */

  function pararRolagem() {
    if (!rolagem) return;
    cancelAnimationFrame(rolagem.raf);
    rolagem = null;
  }

  function velocidade(pos, ini, fim) {
    if (pos < ini + ZONA) return -Math.min(1, (ini + ZONA - pos) / ZONA);
    if (pos > fim - ZONA) return Math.min(1, (pos - (fim - ZONA)) / ZONA);
    return 0;
  }

  function rolarArrastando(ev) {
    if (!drag || !elScroll) { pararRolagem(); return; }
    var r = elScroll.getBoundingClientRect();
    if (!r.width) return;                       /* painel fechado: não há o que rolar */
    var vx = velocidade(ev.clientX, r.left, r.right);
    var vy = (elScroll.scrollHeight > elScroll.clientHeight + 1)
      ? velocidade(ev.clientY, r.top, r.bottom) : 0;
    if (!vx && !vy) { pararRolagem(); return; }
    if (rolagem) { rolagem.vx = vx; rolagem.vy = vy; rolagem.ev = ev; return; }
    rolagem = { vx: vx, vy: vy, ev: ev, raf: 0 };
    var passo = function () {
      if (!drag || !rolagem) { rolagem = null; return; }
      var x0 = elScroll.scrollLeft, y0 = elScroll.scrollTop;
      var maxX = Math.max(0, elScroll.scrollWidth - elScroll.clientWidth);
      var maxY = Math.max(0, elScroll.scrollHeight - elScroll.clientHeight);
      elScroll.scrollLeft = Math.max(0, Math.min(maxX, x0 + rolagem.vx * PASSO));
      elScroll.scrollTop = Math.max(0, Math.min(maxY, y0 + rolagem.vy * PASSO));
      var dx = elScroll.scrollLeft - x0;
      if (dx) {
        drag.x0 -= dx;                          /* o arraste acompanha o conteúdo */
        onDragMove(rolagem.ev);
      }
      rolagem.raf = requestAnimationFrame(passo);
    };
    rolagem.raf = requestAnimationFrame(passo);
  }

  function startDrag(d) { drag = d; document.body.classList.add('tl-dragging'); }

  function endDrag() {
    pararRolagem();
    if (!drag) return;
    var moved = drag.moved;
    var mode = drag.mode;
    drag = null;
    document.body.classList.remove('tl-dragging');
    elLanes && elLanes.querySelectorAll('.lane.over').forEach(function (l) { l.classList.remove('over'); });
    if (moved) {
      VE.growToFit();
      VE.pushHistory();
      VE.emit('project');
    } else if (mode === 'clip') {
      VE.emit('select');
    }
  }

  function onDragMove(ev) {
    if (!drag) return;
    rolarArrastando(ev);
    var dx = (ev.clientX - drag.x0) / TL.pps;
    if (Math.abs(ev.clientX - drag.x0) > 2 || Math.abs(ev.clientY - (drag.y0 || ev.clientY)) > 2) drag.moved = true;

    if (drag.mode === 'marker') {
      drag.marker.t = Math.max(0, quant(snapT(drag.t0 + dx, ev.shiftKey)));
      TL.render();
      return;
    }

    if (drag.mode === 'kf') {
      var c = drag.clip;
      var nt = Math.max(0, Math.min(c.dur, quant(drag.kt0 + dx)));
      VE.moveKey(c, drag.path, drag.ktCur, nt);
      drag.ktCur = nt;
      TL.render();
      VE.emit('livechange');
      return;
    }

    if (drag.mode === 'trans') {
      var cc = drag.clip;
      var base = drag.side === 'in' ? dx : -dx;
      VE.setTransitionDur(cc.id, drag.side, drag.d0 + base);
      TL.renderLite();
      VE.emit('livechange');
      return;
    }

    if (drag.mode === 'trim') {
      var t = drag.side === 'l' ? drag.edge0 + dx : drag.edge0 + dx;
      t = quant(snapT(t, ev.shiftKey, [drag.clip.id]));
      if (drag.ondula) VE.rippleTrim(drag.clip.id, drag.side, t);
      else VE.trimClip(drag.clip.id, drag.side, t);
      TL.renderLite();
      VE.emit('livechange');
      TL.hud((drag.ondula ? '≈ ' : '') +
        (drag.side === 'l' ? 'ENTRADA ' + TL.tc(drag.clip.start) : 'SAÍDA ' + TL.tc(drag.clip.start + drag.clip.dur)) +
        ' · ' + TL.tc(drag.clip.dur));
      return;
    }

    if (drag.mode === 'clip') {
      var target = quant(snapT(drag.start0 + dx, ev.shiftKey, drag.ids));
      var delta = target - drag.start0;
      /* pista de destino, se o ponteiro saiu da faixa original */
      var overLane = document.elementFromPoint(ev.clientX, ev.clientY);
      overLane = overLane && overLane.closest ? overLane.closest('.lane') : null;
      elLanes.querySelectorAll('.lane.over').forEach(function (l) { l.classList.remove('over'); });
      var newTrack = null;
      if (overLane && drag.items.length === 1) {
        newTrack = VE.findTrack(overLane.dataset.track);
        if (newTrack) overLane.classList.add('over');
      }
      drag.items.forEach(function (it) {
        it.clip.start = Math.max(0, it.s0 + delta);
      });
      if (newTrack && newTrack !== drag.items[0].track && !newTrack.locked) {
        var c1 = drag.items[0].clip;
        var isAudio = c1.kind === 'audio';
        if (isAudio === (newTrack.kind === 'audio')) {
          VE.moveClip(c1.id, c1.start, newTrack);
          drag.items[0].track = newTrack;
          TL.render();
          VE.emit('livechange');
          TL.hud(TL.tc(c1.start) + '  →  ' + VE.trackLabel(newTrack));
          return;
        }
      }
      TL.renderLite();
      VE.emit('livechange');
      TL.hud(TL.tc(drag.items[0].clip.start));
    }
  }

  /* leitura flutuante durante o arraste */
  TL.hud = function (txt) {
    var el = $('#tlHud');
    if (!el) return;
    el.textContent = txt;
    el.classList.remove('hidden');
    clearTimeout(TL._hudT);
    TL._hudT = setTimeout(function () { el.classList.add('hidden'); }, 900);
  };

  function bindClips() {
    elLanes.querySelectorAll('.clip').forEach(function (el) {
      var id = el.dataset.clip;

      el.addEventListener('pointerdown', function (e) {
        if (e.button === 2) return;
        var f = VE.findClip(id);
        if (!f) return;
        var c = f.clip;
        if (f.track.locked) { VE.app.toast('pista travada'); return; }

        /* seleção */
        if (e.shiftKey) VE.toggleSelect(id);
        else if (!VE.isSelected(id)) VE.select([id]);
        TL.markSelection();
        VE.emit('select');

        var tgt = e.target;
        e.preventDefault();

        /* — keyframe — */
        if (tgt.classList.contains('kfdot')) {
          var path = tgt.dataset.kf, kt = +tgt.dataset.kt;
          if (e.altKey || e.ctrlKey || e.metaKey) {
            VE.removeKey(c, path, kt);
            VE.pushHistory(); VE.emit('project');
            return;
          }
          TL.focusProp = path;
          startDrag({ mode: 'kf', clip: c, path: path, kt0: kt, ktCur: kt, x0: e.clientX, y0: e.clientY });
          return;
        }

        /* — borda de transição — */
        if (tgt.closest('.ctrans')) {
          var tel = tgt.closest('.ctrans');
          var side = tel.dataset.trans;
          var tr0 = side === 'in' ? c.transIn : c.transOut;
          if (!tr0) return;
          if (e.altKey) { VE.setTransition(c.id, side, null); VE.pushHistory(); VE.emit('project'); return; }
          startDrag({ mode: 'trans', clip: c, side: side, d0: tr0.dur, x0: e.clientX, y0: e.clientY });
          return;
        }

        /* — TESOURA: o clique corta aqui, e nada mais acontece —
           Vem antes de tudo porque no modo tesoura o clipe não se
           seleciona nem se arrasta: a ferramenta manda.            */
        if (TL.ferramenta === 'corte') {
          if (c.locked) { VE.app.toast('clipe travado', 'err'); return; }
          var r0 = el.getBoundingClientRect();
          var tCorte = c.start + ((e.clientX - r0.left) / Math.max(1, r0.width)) * c.dur;
          tCorte = quant(tCorte);
          var novo = VE.splitClip(c.id, tCorte);
          if (!novo) { VE.app.toast('muito perto da borda para cortar', 'err'); return; }
          VE.pushHistory(); VE.emit('project');
          VE.app.toast('cortado em ' + TL.tc(tCorte));
          return;
        }

        /* — aparar (trim) — */
        if (tgt.classList.contains('chandle')) {
          if (c.locked) return;
          var sd = tgt.dataset.h;
          startDrag({
            mode: 'trim', clip: c, side: sd,
            /* ONDULAÇÃO: aparar puxando o resto da pista junto, para não
               deixar buraco. É a diferença entre B e V no Premiere. */
            ondula: TL.ferramenta === 'ondula' || e.altKey,
            edge0: sd === 'l' ? c.start : c.start + c.dur,
            x0: e.clientX, y0: e.clientY
          });
          return;
        }

        /* — mover (com CTRL duplica antes de mover) — */
        if (c.locked) return;
        if (e.ctrlKey || e.metaKey) {
          var copy = VE.cloneClip(c);
          f.track.clips.push(copy);
          VE.select([copy.id]);
          TL.render();
          c = copy;
        }
        var clips = VE.selectedClips();
        if (clips.indexOf(c) < 0) clips = [c];
        startDrag({
          mode: 'clip',
          ids: clips.map(function (x) { return x.id; }),
          items: clips.map(function (x) {
            var ff = VE.findClip(x.id);
            return { clip: x, s0: x.start, track: ff ? ff.track : null };
          }),
          start0: c.start, x0: e.clientX, y0: e.clientY
        });
      });

      el.addEventListener('dblclick', function (e) {
        e.preventDefault();
        var f = VE.findClip(id);
        if (!f) return;
        f.clip.enabled = !f.clip.enabled;
        VE.pushHistory(); VE.emit('project');
      });

      el.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        var f = VE.findClip(id);
        if (f) TL.clipMenu(f.clip, e.clientX, e.clientY);
      });
    });
  }

  /* ============================================================ MENUS ===== */

  function menu(items, x, y) {
    var old = $('#tlMenu');
    if (old) old.remove();
    var d = document.createElement('div');
    d.id = 'tlMenu';
    d.className = 'ctxmenu';
    d.innerHTML = items.map(function (it) {
      if (it === '-') return '<div class="ctxsep"></div>';
      return '<button' + (it.disabled ? ' disabled' : '') + '>' + esc(it.label) +
        (it.hint ? '<i>' + esc(it.hint) + '</i>' : '') + '</button>';
    }).join('');
    document.body.appendChild(d);
    d.style.left = Math.min(x, window.innerWidth - d.offsetWidth - 8) + 'px';
    d.style.top = Math.min(y, window.innerHeight - d.offsetHeight - 8) + 'px';
    var bi = 0;
    items.forEach(function (it) {
      if (it === '-') return;
      var b = d.querySelectorAll('button')[bi++];
      b.addEventListener('click', function () { d.remove(); if (it.fn) it.fn(); });
    });
    setTimeout(function () {
      window.addEventListener('pointerdown', function close(ev) {
        if (!d.contains(ev.target)) { d.remove(); window.removeEventListener('pointerdown', close); }
      });
    }, 0);
  }
  TL.menu = menu;

  TL.clipMenu = function (c, x, y) {
    var t = VE.project.time;
    var inside = t > c.start && t < c.start + c.dur;
    menu([
      { label: 'Cortar no cursor', hint: 'S', disabled: !inside, fn: function () { VE.splitClip(c.id, t); VE.pushHistory(); VE.emit('project'); } },
      { label: 'Duplicar', hint: 'Ctrl+D', fn: function () { VE.duplicateClip(c.id); VE.pushHistory(); VE.emit('project'); } },
      { label: c.enabled ? 'Desligar' : 'Ligar', fn: function () { c.enabled = !c.enabled; VE.pushHistory(); VE.emit('project'); } },
      { label: c.locked ? 'Destravar' : 'Travar', fn: function () { c.locked = !c.locked; VE.pushHistory(); VE.emit('project'); } },
      '-',
      { label: 'Transição na entrada…', fn: function () { TL.transitionPicker(c.id, 'in'); } },
      { label: 'Transição na saída…', fn: function () { TL.transitionPicker(c.id, 'out'); } },
      '-',
      { label: 'Virar composição', hint: 'nesting', fn: function () { VE.nestSelection(); VE.pushHistory(); VE.emit('project'); } },
      { label: 'Zoom neste clipe', fn: function () { VE.select([c.id]); TL.zoomToSelection(); } },
      '-',
      { label: 'Apagar', hint: 'Del', fn: function () { VE.removeClip(c.id); VE.pushHistory(); VE.emit('project'); } },
      { label: 'Apagar e fechar o buraco', hint: 'ripple', fn: function () { VE.removeClip(c.id, true); VE.pushHistory(); VE.emit('project'); } }
    ], x, y);
  };

  TL.trackMenu = function (tr, x, y) {
    menu([
      { label: 'Nova pista de vídeo acima', fn: function () { VE.addTrack('video', tr.id, false); VE.pushHistory(); VE.emit('project'); } },
      { label: 'Nova pista de áudio', fn: function () { VE.addTrack('audio'); VE.pushHistory(); VE.emit('project'); } },
      { label: 'Nova pista de efeitos', fn: function () { VE.addTrack('fx'); VE.pushHistory(); VE.emit('project'); } },
      '-',
      { label: 'Subir pista', fn: function () { VE.moveTrack(tr.id, -1); VE.pushHistory(); VE.emit('project'); } },
      { label: 'Descer pista', fn: function () { VE.moveTrack(tr.id, 1); VE.pushHistory(); VE.emit('project'); } },
      '-',
      {
        label: 'Camada de ajuste nesta pista', disabled: tr.kind === 'audio', fn: function () {
          var c = VE.newAdjust(0, VE.duration());
          tr.clips.push(c); VE.select([c.id]); VE.pushHistory(); VE.emit('project');
        }
      },
      '-',
      { label: 'Apagar pista', fn: function () { if (!VE.removeTrack(tr.id)) VE.app.toast('precisa sobrar uma pista de cada tipo'); else { VE.pushHistory(); VE.emit('project'); } } }
    ], x, y);
  };

  /* escolhedor de transição, agrupado por família */
  TL.transitionPicker = function (clipId, side) {
    var items = [];
    VE.TRANSFAMS.forEach(function (fam) {
      items.push({ label: '· ' + fam + ' ·', disabled: true });
      VE.TRANSITIONS.filter(function (t) { return t.fam === fam; }).forEach(function (t) {
        items.push({
          label: t.name, hint: t.id.indexOf('mo_') === 0 ? 'MOTION' : '',
          fn: function () {
            VE.applyTransitionAtCut(clipId, side, t.id, 0.5);
            VE.pushHistory(); VE.emit('project');
            VE.app.toast(t.name + ' · arraste a borda para mudar a duração');
          }
        });
      });
    });
    items.push('-');
    items.push({ label: 'Remover transição', fn: function () { VE.setTransition(clipId, side, null); VE.pushHistory(); VE.emit('project'); } });
    var r = elLanes.getBoundingClientRect();
    menu(items, r.left + 60, Math.max(60, r.top - 240));
  };

})(window.VE);
