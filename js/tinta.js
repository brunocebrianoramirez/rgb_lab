/* ============================================================
   rgb_lab — TINTA: escrever com a mão
   ------------------------------------------------------------
   As famílias LAB são traço, não contorno — cada glifo é um caminho com
   comprimento conhecido, e é por isso que a ESCRITA À MÃO existe no
   laboratório de tipografia: dá para revelar o traço aos poucos.

   Aqui a ideia é a mesma, com a fonte trocada: em vez de o caminho vir
   do alfabeto, ele vem do DEDO. A pessoa escreve na tela, o traço vira
   um caminho medido, e a mesma revelação progressiva desenha de volta.

   Três decisões que valem explicação:

   1. O traço bruto tem ruído de mão e de leitura do aparelho. Ele passa
      por dois tratamentos antes de virar caminho: MÉDIA MÓVEL (tira o
      tremor) e SIMPLIFICAÇÃO (tira os pontos que não mudam a forma).
      Sem isso um "a" vira duzentos pontos e o navegador engasga.
   2. O caminho é guardado em CURVAS, não em retas: quatro pontos viram
      uma curva Catmull-Rom convertida em Bézier. Um traço de retas
      parece escada quando cresce numa tela 4K.
   3. Tudo é guardado em fração de tela (0..1). O mesmo desenho serve a
      1080 vertical e a 4K horizontal sem redesenhar.

   O que sai daqui é uma camada como qualquer outra: PNG com alpha por
   cima do vídeo, com início, duração e keyframes.
   ============================================================ */
(function (VE) {
  'use strict';

  var T = VE.tinta = {};

  /* ============================================== O MODELO =============== */

  T.novo = function () {
    return {
      tracos: [],                 /* cada um: {pts:[[x,y]…], d:'M…', len:n} */
      cor: '#16150f', espessura: 0.011,   /* fração da MENOR dimensão */
      ponta: 'round',             /* round · butt · square */
      pressao: 0.35,              /* engrossa no meio, como pincel */
      contorno: 0, contornoCor: '#ffffff', contornoK: 2.2,
      sombra: 0, sombraCor: '#00000060',
      escrever: 1,                /* revela o traço enquanto o clipe corre */
      dur: 2.6,                   /* segundos do desenho inteiro */
      atraso: 0.06,               /* vão entre um traço e o seguinte */
      laco: 0,                    /* repete */
      caneta: 1,                  /* mostra a ponta enquanto escreve */
      canetaCor: '#d0271b',
      fica: 1                     /* depois de desenhado, continua na tela */
    };
  };

  /* ============================================== SUAVIZAR =============== */

  /* média móvel de três: tira o tremor sem arredondar o desenho */
  function suavizar(pts, voltas) {
    voltas = voltas === undefined ? 2 : voltas;
    for (var v = 0; v < voltas; v++) {
      if (pts.length < 3) return pts;
      var out = [pts[0]];
      for (var i = 1; i < pts.length - 1; i++) {
        out.push([
          (pts[i - 1][0] + pts[i][0] * 2 + pts[i + 1][0]) / 4,
          (pts[i - 1][1] + pts[i][1] * 2 + pts[i + 1][1]) / 4
        ]);
      }
      out.push(pts[pts.length - 1]);
      pts = out;
    }
    return pts;
  }

  /* Ramer–Douglas–Peucker: joga fora o ponto que não muda a forma.
     É o que faz um traço de 400 leituras virar 40 sem perder o desenho. */
  function simplificar(pts, tol) {
    if (pts.length < 3) return pts;
    var manter = new Array(pts.length);
    manter[0] = manter[pts.length - 1] = true;
    var pilha = [[0, pts.length - 1]];
    while (pilha.length) {
      var par = pilha.pop(), a = par[0], b = par[1];
      var ax = pts[a][0], ay = pts[a][1], bx = pts[b][0], by = pts[b][1];
      var dx = bx - ax, dy = by - ay;
      var n2 = dx * dx + dy * dy;
      var pior = -1, dmax = 0;
      for (var i = a + 1; i < b; i++) {
        var px = pts[i][0] - ax, py = pts[i][1] - ay;
        var d;
        if (n2 < 1e-12) d = Math.sqrt(px * px + py * py);
        else {
          var t = Math.max(0, Math.min(1, (px * dx + py * dy) / n2));
          var qx = px - t * dx, qy = py - t * dy;
          d = Math.sqrt(qx * qx + qy * qy);
        }
        if (d > dmax) { dmax = d; pior = i; }
      }
      if (dmax > tol && pior > 0) {
        manter[pior] = true;
        pilha.push([a, pior]); pilha.push([pior, b]);
      }
    }
    return pts.filter(function (_, i) { return manter[i]; });
  }

  /* Catmull-Rom → Bézier cúbica: caminho liso a partir dos pontos que
     sobraram. É o que impede a escada quando o desenho cresce.        */
  function caminho(pts) {
    if (!pts.length) return '';
    if (pts.length === 1) {
      /* um toque só ainda é um traço: um risco mínimo, para aparecer */
      return 'M' + f(pts[0][0]) + ',' + f(pts[0][1]) +
        ' L' + f(pts[0][0] + 0.0006) + ',' + f(pts[0][1]);
    }
    if (pts.length === 2) {
      return 'M' + f(pts[0][0]) + ',' + f(pts[0][1]) + ' L' + f(pts[1][0]) + ',' + f(pts[1][1]);
    }
    var d = 'M' + f(pts[0][0]) + ',' + f(pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i > 0 ? i - 1 : 0], p1 = pts[i], p2 = pts[i + 1];
      var p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + f(c1x) + ',' + f(c1y) + ' ' + f(c2x) + ',' + f(c2y) + ' ' + f(p2[0]) + ',' + f(p2[1]);
    }
    return d;
  }
  function f(n) { return Math.round(n * 10000) / 10000; }

  /* medidor de comprimento: um <path> fora da tela, como em typefaces.js */
  var medidor = null;
  function medir(d) {
    if (!medidor) {
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
      svg.style.position = 'absolute'; svg.style.opacity = '0'; svg.style.pointerEvents = 'none';
      medidor = document.createElementNS(ns, 'path');
      svg.appendChild(medidor);
      document.body.appendChild(svg);
    }
    medidor.setAttribute('d', d || 'M0,0');
    try { return medidor.getTotalLength(); } catch (e) { return 0; }
  }
  T.medir = medir;

  /* transforma os pontos crus num traço pronto: suave, simples e medido */
  T.fecharTraco = function (pts, tol) {
    if (!pts || !pts.length) return null;
    var s = suavizar(pts, 2);
    s = simplificar(s, tol === undefined ? 0.0022 : tol);
    var d = caminho(s);
    var comp = medir(d);
    if (!(comp > 0)) comp = 0.001;
    return { pts: s, d: d, len: comp, path: new Path2D(d) };
  };

  /* ao reabrir um projeto, o Path2D não vem no JSON: refaz-se aqui */
  T.reidratar = function (obj) {
    if (!obj || !obj.tracos) return obj;
    obj.tracos.forEach(function (tr) {
      if (!tr.path && tr.d) tr.path = new Path2D(tr.d);
      if (!tr.len && tr.d) tr.len = medir(tr.d) || 0.001;
    });
    return obj;
  };

  /* ============================================== O DESENHO ==============
     Tudo em fração: o caminho está em 0..1, e a escala vem da tela. */

  T.desenhar = function (cx, obj, W, H, tempo) {
    if (!obj || !obj.tracos.length) return;
    T.reidratar(obj);
    var menor = Math.min(W, H);
    var total = obj.tracos.reduce(function (a, t) { return a + t.len; }, 0) || 1;

    /* quanto do desenho já foi escrito neste instante */
    var prog = 1;
    if (obj.escrever) {
      var dur = Math.max(0.05, obj.dur);
      var t = tempo || 0;
      if (obj.laco) t = t % (dur + Math.max(0, obj.atraso) * obj.tracos.length + 0.35);
      prog = Math.max(0, Math.min(1, t / dur));
      if (!obj.fica && t > dur) prog = 1;
    }
    var orcamento = total * prog;
    var esc = obj.espessura * menor;

    /* O caminho vive em 0..1 e a tela raramente é quadrada. Escalar o
       CANVAS por (W,H) deixaria o traço oval — grosso na horizontal,
       fino na vertical. Então escalamos só a GEOMETRIA (o Path2D entra
       numa DOMMatrix) e deixamos a espessura em pixels de verdade.
       Nada de `setTransform` aqui: quem chama pode ter a sua própria
       transformação, e apagá-la seria decidir pelo outro.            */
    var esc2 = escalaDe(W, H);

    cx.save();
    cx.lineCap = obj.ponta || 'round';
    cx.lineJoin = 'round';
    cx.miterLimit = 2;

    obj.tracos.forEach(function (tr) {
      if (obj.escrever && orcamento <= 0) return;
      var mostra = obj.escrever ? Math.min(tr.len, orcamento) : tr.len;
      if (obj.escrever) orcamento -= mostra;
      if (mostra <= 0) return;

      var p2 = escalado(tr, W, H);
      /* o comprimento medido está em 0..1; o tracejado precisa dele em
         pixels. `fatorDe` dá a razão exata deste traço nesta tela. */
      var fator = fatorDe(tr, W, H);
      var comprPx = tr.len * fator;
      var mostraPx = mostra * fator;
      var parcial = mostra < tr.len - 1e-6;

      if (obj.sombra) {
        cx.shadowColor = obj.sombraCor; cx.shadowBlur = esc * 0.9;
        cx.shadowOffsetY = esc * 0.28;
      } else { cx.shadowColor = 'transparent'; cx.shadowBlur = 0; cx.shadowOffsetY = 0; }

      if (obj.contorno) {
        cx.setLineDash(parcial ? [mostraPx, comprPx + 2] : []);
        cx.lineWidth = esc * Math.max(1.05, obj.contornoK);
        cx.strokeStyle = obj.contornoCor;
        cx.stroke(p2);
      }
      cx.shadowColor = 'transparent'; cx.shadowBlur = 0; cx.shadowOffsetY = 0;

      cx.strokeStyle = obj.cor;
      if (obj.pressao > 0.01) {
        /* pincel: sete passadas com espessura variando, como pressão de
           mão. Cada passada risca só a sua fatia do traço já escrito. */
        var passos = 7;
        for (var s = 0; s < passos; s++) {
          var a = s / passos, b = (s + 1) / passos, meio = (a + b) / 2;
          var press = 1 - obj.pressao * Math.pow(Math.abs(meio * 2 - 1), 1.7);
          cx.lineWidth = Math.max(0.4, esc * press);
          cx.setLineDash([0, mostraPx * a, mostraPx * (b - a), comprPx + 2]);
          cx.stroke(p2);
        }
      } else {
        cx.setLineDash(parcial ? [mostraPx, comprPx + 2] : []);
        cx.lineWidth = esc;
        cx.stroke(p2);
      }
      cx.setLineDash([]);

      /* a ponta da caneta, no traço que está sendo escrito agora */
      if (obj.caneta && obj.escrever && parcial) {
        var pt = pontoEm(tr, mostra / tr.len);
        if (pt) {
          cx.beginPath();
          cx.arc(pt.x * W, pt.y * H, esc * 0.62, 0, Math.PI * 2);
          cx.fillStyle = obj.canetaCor;
          cx.fill();
        }
      }
    });
    cx.restore();
  };

  /* --- caminho já escalado para a tela, guardado por tamanho de tela --- */
  function escalaDe(W, H) { return W + 'x' + H; }

  function escalado(tr, W, H) {
    var k = escalaDe(W, H);
    if (!tr.__px) tr.__px = {};
    if (!tr.__px[k]) {
      var p2 = new Path2D();
      p2.addPath(tr.path, new DOMMatrix().scale(W, H));
      tr.__px[k] = p2;
    }
    return tr.__px[k];
  }

  /* Razão entre o comprimento na tela e o comprimento em 0..1. Sai da
     poligonal dos pontos: a curva alonga os dois lados na mesma
     proporção, então a razão é a mesma — e custa quase nada.        */
  function fatorDe(tr, W, H) {
    var k = escalaDe(W, H);
    if (!tr.__f) tr.__f = {};
    if (tr.__f[k]) return tr.__f[k];
    var u = 0, px = 0, p = tr.pts || [];
    for (var i = 1; i < p.length; i++) {
      var dx = p[i][0] - p[i - 1][0], dy = p[i][1] - p[i - 1][1];
      u += Math.sqrt(dx * dx + dy * dy);
      var ex = dx * W, ey = dy * H;
      px += Math.sqrt(ex * ex + ey * ey);
    }
    var f2 = (u > 1e-9) ? px / u : (W + H) / 2;
    tr.__f[k] = f2;
    return f2;
  }

  function pontoEm(tr, frac) {
    medir(tr.d);
    try {
      var L = medidor.getTotalLength();
      var p = medidor.getPointAtLength(L * Math.max(0, Math.min(1, frac)));
      return { x: p.x, y: p.y };
    } catch (e) { return null; }
  }
  T.pontoEm = pontoEm;

  /* quanto tempo o desenho inteiro leva (para dar duração ao clipe) */
  T.duracao = function (obj) {
    if (!obj) return 2;
    return obj.escrever ? Math.max(0.4, obj.dur) + 0.35 : 2;
  };

  /* ============================================== A CAPTURA ==============
     Um <canvas> por cima do palco do laboratório de tipografia. Ponteiro
     serve para os três: mouse, caneta e dedo — `setPointerCapture` faz o
     traço continuar mesmo quando o dedo sai do quadro.               */

  var cap = null;

  T.capturando = function () { return !!(cap && cap.ativo); };

  T.ligarCaptura = function (alvo, obj, aoMudar) {
    if (cap && cap.alvo === alvo) { cap.obj = obj; return cap; }
    cap = { alvo: alvo, obj: obj, ativo: false, pts: null, aoMudar: aoMudar };

    function frac(ev) {
      var r = alvo.getBoundingClientRect();
      return [
        (ev.clientX - r.left) / Math.max(1, r.width),
        (ev.clientY - r.top) / Math.max(1, r.height)
      ];
    }
    alvo.addEventListener('pointerdown', function (ev) {
      if (!cap.obj) return;
      ev.preventDefault();
      try { alvo.setPointerCapture(ev.pointerId); } catch (e) { }
      cap.ativo = true;
      cap.pts = [frac(ev)];
      cap.parcial = null;
      if (cap.aoMudar) cap.aoMudar('comecou');
    });
    alvo.addEventListener('pointermove', function (ev) {
      if (!cap.ativo) return;
      ev.preventDefault();
      /* eventos coalescidos: num movimento rápido o navegador junta
         várias leituras num evento só. Pegá-las todas é o que faz a
         curva sair lisa em vez de facetada.

         A lista pode vir VAZIA — e uma lista vazia é um valor válido em
         JavaScript, então `|| [ev]` não a substituiria. O traço ficava
         com um ponto só e o desenho sumia. Testar o tamanho, não a
         existência.                                                  */
      var lista = ev.getCoalescedEvents ? ev.getCoalescedEvents() : null;
      if (!lista || !lista.length) lista = [ev];
      lista.forEach(function (e2) {
        var p = frac(e2);
        var u = cap.pts[cap.pts.length - 1];
        if (!u || Math.abs(p[0] - u[0]) + Math.abs(p[1] - u[1]) > 0.0012) cap.pts.push(p);
      });
      if (cap.aoMudar) cap.aoMudar('andando');
    });
    function soltar(ev) {
      if (!cap.ativo) return;
      cap.ativo = false;
      var tr = T.fecharTraco(cap.pts);
      cap.pts = null;
      if (tr && cap.obj) {
        cap.obj.tracos.push(tr);
        if (cap.aoMudar) cap.aoMudar('traco');
      } else if (cap.aoMudar) cap.aoMudar('nada');
    }
    alvo.addEventListener('pointerup', soltar);
    alvo.addEventListener('pointercancel', soltar);
    alvo.addEventListener('pointerleave', soltar);
    return cap;
  };

  T.desligarCaptura = function () {
    if (cap) { cap.obj = null; cap.ativo = false; }
  };

  /* o traço que está sendo feito AGORA, ainda sem soltar o dedo */
  T.tracoEmCurso = function () {
    if (!cap || !cap.ativo || !cap.pts || cap.pts.length < 2) return null;
    return { pts: cap.pts, d: caminho(cap.pts) };
  };

  T.desfazer = function (obj) {
    if (obj && obj.tracos.length) { obj.tracos.pop(); return true; }
    return false;
  };
  T.limpar = function (obj) { if (obj) obj.tracos = []; };

  /* ============================================== SAÍDA ==================
     Um canvas próprio, do tamanho da composição, redesenhado a cada
     quadro. É o mesmo contrato das outras camadas de tipografia.     */

  T.paraTimeline = function (obj, nome) {
    if (!obj || !obj.tracos.length) { VE.app.toast('desenhe alguma coisa primeiro', 'err'); return null; }
    if (!VE.project) VE.app.ensureProject();
    var W = VE.project.canvas.w, H = VE.project.canvas.h;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var cx = cv.getContext('2d');
    /* cópia própria: mexer no laboratório depois não muda o que já foi */
    var meu = JSON.parse(JSON.stringify(obj));
    meu.tracos.forEach(function (t) { delete t.path; });
    T.reidratar(meu);

    var id = VE.media.registerTypeSource(cv, nome || 'TINTA', function (local) {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, W, H);
      T.desenhar(cx, meu, W, H, local);
    });
    VE.sources[id].animado = !!meu.escrever;
    VE.sources[id].tinta = meu;              /* fica no objeto, para a ficha */

    var n = VE.allClips().filter(function (x) { return (x.name || '').indexOf('TINTA') === 0; }).length + 1;
    var c = VE.addMedia({
      kind: 'type', name: 'TINTA_' + String(n).padStart(3, '0'), src: id,
      dur: Math.min(VE.MAXDUR, T.duracao(meu)), fit: 'contain', over: true
    });
    VE.pushHistory(); VE.emit('project');
    return c;
  };

  /* PNG do desenho pronto, com fundo transparente */
  T.png = function (obj, W, H) {
    W = W || 1080; H = H || 1080;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    T.desenhar(cv.getContext('2d'), obj, W, H, 1e6);
    return cv;
  };

  /* SVG: o traço é vetor de verdade, então sai como vetor */
  T.svg = function (obj, W, H) {
    W = W || 1080; H = H || 1080;
    var menor = Math.min(W, H);
    var p = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">'];
    p.push('<g transform="scale(' + W + ',' + H + ')" fill="none" stroke="' + obj.cor +
      '" stroke-linecap="' + (obj.ponta || 'round') + '" stroke-linejoin="round" stroke-width="' +
      (obj.espessura * menor / ((W + H) / 2)) + '">');
    obj.tracos.forEach(function (t) { p.push('<path d="' + t.d + '"/>'); });
    p.push('</g></svg>');
    return p.join('\n');
  };

})(window.VE);
