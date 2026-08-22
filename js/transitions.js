/* ============================================================
   rgb_lab — interpolação, curvas e transições
   ------------------------------------------------------------
   Duas coisas moram aqui:

   1. VE.EASE — as curvas de aceleração dos keyframes.
      LINEAR / EASE IN / EASE OUT / EASE IN-OUT / BÉZIER / HOLD.

   2. VE.TRANSITIONS — o catálogo de transições. Cada transição é uma
      FUNÇÃO PURA que recebe (lado, progresso, parâmetros) e devolve um
      MODIFICADOR de camada: deslocamento, escala, rotação, opacidade,
      recorte e — quando faz sentido — um efeito injetado na cadeia.

      Nenhuma transição precisa de shader próprio: elas reaproveitam a
      geometria da composição e o catálogo de efeitos que já existe.
      Por isso são baratas e por isso o usuário pode arrastar a borda de
      uma transição e ver a duração mudar em tempo real.
   ============================================================ */
(function (VE) {
  'use strict';

  /* ================================================== CURVAS ================ */

  function bez1d(p1, p2, t) {
    /* componente de uma cúbica de Bézier com âncoras em 0 e 1 */
    var u = 1 - t;
    return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
  }

  /* resolve x(t)=alvo por bisseção — 18 passos dão precisão de sobra para tela */
  function bezEase(x1, y1, x2, y2, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var lo = 0, hi = 1, t = x, v;
    for (var i = 0; i < 18; i++) {
      t = (lo + hi) / 2;
      v = bez1d(x1, x2, t);
      if (v < x) lo = t; else hi = t;
    }
    return bez1d(y1, y2, t);
  }

  VE.EASE = {
    linear: { id: 'linear', label: 'LINEAR', f: function (t) { return t; } },
    easeIn: { id: 'easeIn', label: 'EASE IN', f: function (t) { return t * t; } },
    easeOut: { id: 'easeOut', label: 'EASE OUT', f: function (t) { return 1 - (1 - t) * (1 - t); } },
    easeInOut: { id: 'easeInOut', label: 'EASE IN/OUT', f: function (t) { return t * t * (3 - 2 * t); } },
    /* alias histórico: os projetos antigos interpolavam sempre em smoothstep */
    smooth: { id: 'easeInOut', label: 'EASE IN/OUT', f: function (t) { return t * t * (3 - 2 * t); } },
    hold: { id: 'hold', label: 'HOLD', f: function () { return 0; } },
    bezier: { id: 'bezier', label: 'BÉZIER', f: null }   /* usa os handles do keyframe */
  };

  VE.EASE_LIST = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'bezier', 'hold'];

  /* aplica a curva de um keyframe ao fator normalizado entre ele e o próximo */
  VE.easeFactor = function (key, f) {
    var e = (key && key.ease) || 'easeInOut';
    if (e === 'bezier') {
      var b = (key && key.bez) || [0.42, 0, 0.58, 1];
      return bezEase(b[0], b[1], b[2], b[3], f);
    }
    var def = VE.EASE[e] || VE.EASE.easeInOut;
    return def.f ? def.f(f) : f;
  };

  /* ============================================== TRANSIÇÕES ================ */
  /* Um MODIFICADOR é sempre este objeto (tudo opcional):
       { op:number     multiplicador de opacidade
         dx,dy:number  deslocamento em unidades de quadro (1 = altura do quadro)
         sc:number     multiplicador de escala
         scx,scy       escala por eixo (para flip/fold)
         rot:number    graus somados à rotação
         crop:{x,y,w,h}  recorte revelado, em 0..1 do próprio clipe
         fx:{id,params,amount}  efeito injetado no topo da cadeia do clipe }   */

  var T = [];
  function def(o) {
    o.params = o.params || [];
    o.params.forEach(function (p) {
      if (p.min === undefined) p.min = 0;
      if (p.max === undefined) p.max = 1;
      if (p.step === undefined) p.step = 0.01;
    });
    T.push(o);
    return o;
  }

  /* curvas usadas pelas próprias transições */
  var E = {
    lin: function (t) { return t; },
    io: function (t) { return t * t * (3 - 2 * t); },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    in_: function (t) { return t * t * t; },
    /* mola: ultrapassa e volta — o coração das transições MOTION */
    spring: function (t, k) {
      k = k === undefined ? 5.2 : k;
      if (t >= 1) return 1;
      return 1 - Math.pow(2, -9 * t) * Math.cos(t * k * Math.PI);
    },
    /* estouro curto, sem oscilação */
    back: function (t, s) {
      s = s === undefined ? 1.7 : s;
      var u = t - 1;
      return u * u * ((s + 1) * u + s) + 1;
    }
  };
  VE.TCURVES = E;

  function curveOf(params) {
    var m = { LINEAR: E.lin, SUAVE: E.io, SAÍDA: E.out, ENTRADA: E.in_, MOLA: E.spring, ESTOURO: E.back };
    var names = ['LINEAR', 'SUAVE', 'SAÍDA', 'ENTRADA', 'MOLA', 'ESTOURO'];
    var i = Math.round(params && params.ease !== undefined ? params.ease : 1);
    return m[names[Math.max(0, Math.min(5, i))]] || E.io;
  }
  VE.TEASE_NAMES = ['LINEAR', 'SUAVE', 'SAÍDA', 'ENTRADA', 'MOLA', 'ESTOURO'];

  var EASE_PARAM = { k: 'ease', label: 'Curva', min: 0, max: 5, step: 1, def: 1, t: 'sel', opts: VE.TEASE_NAMES };

  /* --------------------------------------------------- FAMÍLIA · DISSOLVER */

  def({
    id: 'dissolve', name: 'Dissolver', fam: 'DISSOLVE',
    desc: 'a imagem que sai desaparece enquanto a que entra aparece',
    params: [EASE_PARAM],
    mod: function (side, p, prm) {
      var c = curveOf(prm), f = c(p);
      return { op: side === 'in' ? f : 1 - f };
    }
  });

  def({
    id: 'fade', name: 'Fade pelo fundo', fam: 'DISSOLVE',
    desc: 'os dois lados passam pelo vazio antes de trocar',
    params: [EASE_PARAM],
    mod: function (side, p) {
      /* a saída some na primeira metade, a entrada nasce na segunda */
      if (side === 'out') return { op: Math.max(0, 1 - p * 2) };
      return { op: Math.max(0, p * 2 - 1) };
    }
  });

  def({
    id: 'filmburn', name: 'Queima de película', fam: 'DISSOLVE',
    desc: 'a emulsão estoura de branco no ponto de corte',
    params: [EASE_PARAM, { k: 'heat', label: 'Estouro', def: 0.8, max: 2 }],
    mod: function (side, p, prm) {
      var f = curveOf(prm)(p);
      var peak = 1 - Math.abs(p * 2 - 1);
      return {
        op: side === 'in' ? f : 1 - f,
        fx: { id: 'color', params: { exp: peak * (prm.heat === undefined ? 0.8 : prm.heat) * 2.2, con: -peak * 0.5, sat: -peak * 0.8, bri: peak * 0.25, gam: 1, lift: peak * 0.3 }, amount: 1 }
      };
    }
  });

  /* ------------------------------------------------------- FAMÍLIA · WIPE */

  function wipeMod(dir) {
    return function (side, p, prm) {
      var f = curveOf(prm)(p);
      var a = side === 'in' ? f : 1;          /* quem sai continua inteiro embaixo */
      if (side === 'out') return {};
      var c = { x: 0, y: 0, w: 1, h: 1 };
      if (dir === 'l') { c.w = a; }
      else if (dir === 'r') { c.w = a; c.x = 1 - a; }
      else if (dir === 'u') { c.h = a; c.y = 1 - a; }
      else { c.h = a; }
      return { crop: c };
    };
  }

  ['l', 'r', 'u', 'd'].forEach(function (d, i) {
    var nm = ['Cortina · esquerda→direita', 'Cortina · direita→esquerda', 'Cortina · baixo→cima', 'Cortina · cima→baixo'][i];
    def({
      id: 'wipe' + d, name: nm, fam: 'WIPE',
      desc: 'a imagem nova é revelada por uma borda reta',
      params: [EASE_PARAM],
      mod: wipeMod(d)
    });
  });

  def({
    id: 'wipeband', name: 'Cortina em faixas', fam: 'WIPE',
    desc: 'a revelação acontece em várias faixas ao mesmo tempo',
    params: [EASE_PARAM, { k: 'bands', label: 'Faixas', min: 2, max: 24, step: 1, def: 8 }],
    mod: function (side, p, prm) {
      if (side === 'out') return {};
      var f = curveOf(prm)(p);
      /* usa o efeito de persiana já existente como máscara de revelação */
      return { op: f < 0.02 ? 0 : 1, fx: { id: 'slice', params: { count: prm.bands || 8, amt: (1 - f) * 0.9, dir: 0, rand: 0, spd: 0, wavey: 0 }, amount: 1 } };
    }
  });

  /* ------------------------------------------------ FAMÍLIA · SLIDE / PUSH */

  function slideMod(ax, sgn, push) {
    return function (side, p, prm) {
      var f = curveOf(prm)(p);
      var d = (side === 'in') ? (1 - f) : (push ? -f : 0);
      if (side === 'out' && !push) return { op: 1 };
      var m = {};
      var amt = d * sgn * 1.25;
      if (ax === 'x') m.dx = amt; else m.dy = amt;
      return m;
    };
  }

  [['slideL', 'Deslizar ← ', 'x', -1], ['slideR', 'Deslizar →', 'x', 1],
  ['slideU', 'Deslizar ↑', 'y', -1], ['slideD', 'Deslizar ↓', 'y', 1]].forEach(function (o) {
    def({
      id: o[0], name: o[1], fam: 'SLIDE',
      desc: 'a imagem nova entra por cima, deslizando',
      params: [EASE_PARAM], mod: slideMod(o[2], o[3], false)
    });
  });

  [['pushL', 'Empurrar ←', 'x', -1], ['pushR', 'Empurrar →', 'x', 1],
  ['pushU', 'Empurrar ↑', 'y', -1], ['pushD', 'Empurrar ↓', 'y', 1]].forEach(function (o) {
    def({
      id: o[0], name: o[1], fam: 'PUSH',
      desc: 'a imagem nova empurra a antiga para fora do quadro',
      params: [EASE_PARAM], mod: slideMod(o[2], o[3], true)
    });
  });

  /* ------------------------------------------------------- FAMÍLIA · ZOOM */

  def({
    id: 'zoomin', name: 'Zoom de entrada', fam: 'ZOOM',
    desc: 'a nova imagem cresce a partir do centro',
    params: [EASE_PARAM, { k: 'amt', label: 'Alcance', min: 1, max: 6, def: 2.4, step: 0.05 }],
    mod: function (side, p, prm) {
      var f = curveOf(prm)(p), a = prm.amt === undefined ? 2.4 : prm.amt;
      if (side === 'in') return { sc: 1 / (1 + (a - 1) * (1 - f)), op: f };
      return { sc: 1 + (a - 1) * f, op: 1 - f };
    }
  });

  def({
    id: 'zoomout', name: 'Zoom de saída', fam: 'ZOOM',
    desc: 'a imagem antiga recua e revela a nova',
    params: [EASE_PARAM, { k: 'amt', label: 'Alcance', min: 1, max: 6, def: 2.4, step: 0.05 }],
    mod: function (side, p, prm) {
      var f = curveOf(prm)(p), a = prm.amt === undefined ? 2.4 : prm.amt;
      if (side === 'in') return { sc: 1 + (a - 1) * (1 - f), op: f };
      return { sc: 1 / (1 + (a - 1) * f), op: 1 - f };
    }
  });

  /* ============================================== FAMÍLIA · MOTION ==========
     Estas são as transições próprias do rgb_lab: têm inércia, ultrapassam o
     ponto de chegada e voltam. Cada uma abre parâmetros de verdade
     (duração vem da timeline; ângulo, direção, intensidade e curva daqui).  */

  def({
    id: 'mo_pull', name: 'MOTION · PULL', fam: 'MOTION',
    desc: 'puxão lateral com inércia — a imagem passa do ponto e volta',
    params: [
      { k: 'dir', label: 'Direção', min: 0, max: 3, step: 1, def: 0, t: 'sel', opts: ['←', '→', '↑', '↓'] },
      { k: 'force', label: 'Intensidade', min: 0.2, max: 3, def: 1.15, step: 0.01 },
      { k: 'over', label: 'Ultrapasse', min: 0, max: 1, def: 0.34, step: 0.01 }
    ],
    mod: function (side, p, prm) {
      var d = Math.round(prm.dir || 0);
      var force = prm.force === undefined ? 1.15 : prm.force;
      var over = prm.over === undefined ? 0.34 : prm.over;
      var f = E.back(p, 1 + over * 3);
      var travel = (side === 'in' ? (1 - f) : -f) * force;
      var sgn = (d === 0 || d === 2) ? -1 : 1;
      var m = { op: side === 'in' ? Math.min(1, p * 3) : 1 };
      if (d < 2) m.dx = travel * sgn; else m.dy = travel * sgn;
      return m;
    }
  });

  def({
    id: 'mo_block', name: 'MOTION · BLOCK', fam: 'MOTION',
    desc: 'a troca acontece em blocos retangulares, aos saltos',
    params: [
      { k: 'grid', label: 'Blocos', min: 2, max: 40, step: 1, def: 12 },
      { k: 'hard', label: 'Dureza', min: 0, max: 1, def: 0.7 }
    ],
    mod: function (side, p, prm) {
      var f = E.io(p);
      var g = Math.max(2, Math.round(prm.grid || 12));
      if (side === 'out') {
        return { op: 1 - f, fx: { id: 'pixelate', params: { size: 2 + f * g * 3, ar: 1, shape: 0, gap: prm.hard === undefined ? 0.7 : prm.hard, bg: '#000000' }, amount: 1 } };
      }
      return { op: f, fx: { id: 'pixelate', params: { size: 2 + (1 - f) * g * 3, ar: 1, shape: 0, gap: prm.hard === undefined ? 0.7 : prm.hard, bg: '#000000' }, amount: 1 } };
    }
  });

  def({
    id: 'mo_travel', name: 'MOTION · TRAVEL', fam: 'MOTION',
    desc: 'viagem com rastro: desloca, borra na direção e assenta',
    params: [
      { k: 'dir', label: 'Direção', min: 0, max: 3, step: 1, def: 1, t: 'sel', opts: ['←', '→', '↑', '↓'] },
      { k: 'dist', label: 'Distância', min: 0.2, max: 3, def: 1.1, step: 0.01 },
      { k: 'blur', label: 'Rastro', min: 0, max: 1, def: 0.55 }
    ],
    mod: function (side, p, prm) {
      var d = Math.round(prm.dir === undefined ? 1 : prm.dir);
      var dist = prm.dist === undefined ? 1.1 : prm.dist;
      var f = E.out(p);
      var v = (side === 'in' ? (1 - f) : -f) * dist;
      var sgn = (d === 0 || d === 2) ? -1 : 1;
      var speed = Math.abs(side === 'in' ? (1 - f) : f);
      var m = {
        op: 1,
        fx: { id: 'motionblur', params: { len: speed * (prm.blur === undefined ? 0.55 : prm.blur) * 1.6, ang: d < 2 ? 0 : 90, center: 0.5, fall: 0.35, glow: 0.2, thr: 0.7, ramp: 0, rampPos: 0.5, mixv: 1 }, amount: 1 }
      };
      if (d < 2) m.dx = v * sgn; else m.dy = v * sgn;
      return m;
    }
  });

  def({
    id: 'mo_spin', name: 'MOTION · SPIN', fam: 'MOTION',
    desc: 'giro com escala — a imagem gira para dentro do quadro',
    params: [
      { k: 'ang', label: 'Ângulo', min: 15, max: 1080, step: 5, def: 180 },
      { k: 'dir', label: 'Sentido', min: 0, max: 1, step: 1, def: 0, t: 'sel', opts: ['HORÁRIO', 'ANTI-HORÁRIO'] },
      { k: 'zoom', label: 'Escala', min: 0, max: 1, def: 0.55 },
      EASE_PARAM
    ],
    mod: function (side, p, prm) {
      var f = curveOf(prm)(p);
      var ang = (prm.ang === undefined ? 180 : prm.ang) * (Math.round(prm.dir || 0) ? -1 : 1);
      var z = prm.zoom === undefined ? 0.55 : prm.zoom;
      if (side === 'in') return { rot: -ang * (1 - f), sc: 1 - z * (1 - f), op: f };
      return { rot: ang * f, sc: 1 - z * f, op: 1 - f };
    }
  });

  def({
    id: 'mo_flip', name: 'MOTION · FLIP', fam: 'MOTION',
    desc: 'a imagem vira como uma placa — a nova está do outro lado',
    params: [
      { k: 'axis', label: 'Eixo', min: 0, max: 1, step: 1, def: 0, t: 'sel', opts: ['HORIZONTAL', 'VERTICAL'] },
      { k: 'persp', label: 'Perspectiva', min: 0, max: 1, def: 0.4 }
    ],
    mod: function (side, p, prm) {
      var v = Math.round(prm.axis || 0);
      var pe = prm.persp === undefined ? 0.4 : prm.persp;
      var f = E.io(p);
      /* metade da virada é o clipe que sai, metade o que entra */
      var k = side === 'out' ? Math.cos(f * Math.PI / 2) : Math.cos((1 - f) * Math.PI / 2);
      var m = { op: (side === 'out' ? (f < 0.5 ? 1 : 0) : (f < 0.5 ? 0 : 1)), sc: 1 - pe * (1 - k) * 0.4 };
      if (v) m.scy = Math.max(0.001, k); else m.scx = Math.max(0.001, k);
      return m;
    }
  });

  def({
    id: 'mo_spring', name: 'MOTION · SPRING', fam: 'MOTION',
    desc: 'entra em mola: passa do ponto, oscila e assenta',
    params: [
      { k: 'k', label: 'Rigidez', min: 1, max: 12, def: 5.2, step: 0.1 },
      { k: 'from', label: 'Escala inicial', min: 0, max: 2, def: 0.55, step: 0.01 },
      { k: 'dir', label: 'Direção', min: 0, max: 4, step: 1, def: 0, t: 'sel', opts: ['CENTRO', '←', '→', '↑', '↓'] }
    ],
    mod: function (side, p, prm) {
      var f = E.spring(p, prm.k === undefined ? 5.2 : prm.k);
      var from = prm.from === undefined ? 0.55 : prm.from;
      var d = Math.round(prm.dir || 0);
      var m = {};
      if (side === 'in') {
        m.sc = from + (1 - from) * f;
        m.op = Math.min(1, p * 4);
        if (d === 1) m.dx = -(1 - f) * 0.7;
        else if (d === 2) m.dx = (1 - f) * 0.7;
        else if (d === 3) m.dy = -(1 - f) * 0.7;
        else if (d === 4) m.dy = (1 - f) * 0.7;
      } else {
        m.op = 1 - E.in_(p);
        m.sc = 1 + E.in_(p) * 0.12;
      }
      return m;
    }
  });

  def({
    id: 'mo_pop', name: 'MOTION · POP', fam: 'MOTION',
    desc: 'estouro curto e seco, sem oscilação',
    params: [
      { k: 'from', label: 'Escala inicial', min: 0, max: 1.5, def: 0.2, step: 0.01 },
      { k: 'over', label: 'Ultrapasse', min: 0, max: 1.2, def: 0.5, step: 0.01 }
    ],
    mod: function (side, p, prm) {
      var over = prm.over === undefined ? 0.5 : prm.over;
      var from = prm.from === undefined ? 0.2 : prm.from;
      var f = E.back(p, 1 + over * 2.4);
      if (side === 'in') return { sc: from + (1 - from) * f, op: Math.min(1, p * 5) };
      return { sc: 1 + f * 0.25, op: 1 - E.in_(p) };
    }
  });

  def({
    id: 'mo_fold', name: 'MOTION · FOLD', fam: 'MOTION',
    desc: 'a imagem dobra sobre si mesma e some pela dobra',
    params: [
      { k: 'axis', label: 'Eixo', min: 0, max: 1, step: 1, def: 1, t: 'sel', opts: ['HORIZONTAL', 'VERTICAL'] },
      { k: 'slide', label: 'Arrasto', min: 0, max: 1, def: 0.35 }
    ],
    mod: function (side, p, prm) {
      var v = Math.round(prm.axis === undefined ? 1 : prm.axis);
      var sl = prm.slide === undefined ? 0.35 : prm.slide;
      var f = E.io(p);
      var m = {};
      if (side === 'out') {
        if (v) { m.scy = Math.max(0.001, 1 - f); m.dy = -f * sl; }
        else { m.scx = Math.max(0.001, 1 - f); m.dx = -f * sl; }
        m.op = 1;
      } else {
        if (v) { m.scy = Math.max(0.001, f); m.dy = (1 - f) * sl; }
        else { m.scx = Math.max(0.001, f); m.dx = (1 - f) * sl; }
        m.op = 1;
      }
      return m;
    }
  });

  /* ------------------------------------------------------ FAMÍLIA · GLITCH */

  def({
    id: 'gl_tear', name: 'GLITCH · Rasgo', fam: 'GLITCH',
    desc: 'o sinal se rompe em linhas no ponto de corte',
    params: [{ k: 'force', label: 'Intensidade', min: 0, max: 1, def: 0.75 }],
    mod: function (side, p, prm) {
      var peak = 1 - Math.abs(p * 2 - 1);
      var force = prm.force === undefined ? 0.75 : prm.force;
      return {
        op: side === 'in' ? (p > 0.5 ? 1 : 0) : (p > 0.5 ? 0 : 1),
        fx: { id: 'glitch', params: { amt: peak * force, len: 0.45, rows: 40, spd: 5, cs: peak * force * 1.6, blocky: peak * 1.4, blocks: 26 }, amount: 1 }
      };
    }
  });

  def({
    id: 'gl_rgb', name: 'GLITCH · Separação RGB', fam: 'GLITCH',
    desc: 'os três canais se separam e voltam ao registro',
    params: [{ k: 'force', label: 'Separação', min: 0, max: 1, def: 0.6 }],
    mod: function (side, p, prm) {
      var peak = 1 - Math.abs(p * 2 - 1);
      var f = E.io(p);
      return {
        op: side === 'in' ? f : 1 - f,
        fx: { id: 'rgbsplit', params: { amt: peak * (prm.force === undefined ? 0.6 : prm.force), ang: 0, mode: 1, jit: peak * 0.4, spd: 24 }, amount: 1 }
      };
    }
  });

  def({
    id: 'gl_dissolvepx', name: 'GLITCH · Dissolver em pixels', fam: 'GLITCH',
    desc: 'a imagem se desfaz em blocos antes de trocar',
    params: [{ k: 'size', label: 'Bloco', min: 2, max: 80, step: 1, def: 26 }],
    mod: function (side, p, prm) {
      var f = E.io(p);
      var s = prm.size === undefined ? 26 : prm.size;
      if (side === 'out') return { op: 1 - f, fx: { id: 'pixelate', params: { size: 2 + f * s, ar: 1, shape: 0, gap: 1, bg: '#000000' }, amount: 1 } };
      return { op: f, fx: { id: 'pixelate', params: { size: 2 + (1 - f) * s, ar: 1, shape: 0, gap: 1, bg: '#000000' }, amount: 1 } };
    }
  });

  /* ------------------------------------------------------- FAMÍLIA · CORTE */

  def({
    id: 'cut', name: 'Corte seco', fam: 'CUT',
    desc: 'sem transição — existe para poder zerar um ponto de corte',
    params: [],
    mod: function (side, p) { return { op: side === 'in' ? (p >= 0.5 ? 1 : 0) : (p < 0.5 ? 1 : 0) }; }
  });

  /* --------------------------------------------------------------- registro */
  VE.TRANSITIONS = T;
  VE.TRANSBY = {};
  T.forEach(function (o) { VE.TRANSBY[o.id] = o; });

  VE.TRANSFAMS = [];
  T.forEach(function (o) { if (VE.TRANSFAMS.indexOf(o.fam) < 0) VE.TRANSFAMS.push(o.fam); });

  VE.transDefaults = function (id) {
    var d = VE.TRANSBY[id], o = {};
    if (!d) return o;
    d.params.forEach(function (p) { o[p.k] = p.def; });
    return o;
  };

  /* avalia uma transição e devolve o modificador já normalizado */
  VE.transMod = function (trans, side, p) {
    var d = trans && VE.TRANSBY[trans.type];
    if (!d) return null;
    var prm = {};
    (d.params || []).forEach(function (pp) {
      prm[pp.k] = (trans.params && trans.params[pp.k] !== undefined) ? trans.params[pp.k] : pp.def;
    });
    var m = d.mod(side, Math.max(0, Math.min(1, p)), prm) || {};
    return m;
  };

})(window.VE);
