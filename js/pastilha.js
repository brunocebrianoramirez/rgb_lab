/* ============================================================
   rgb_lab — PASTILHA: o letreiro de metrô assentado em ladrilhos
   ------------------------------------------------------------
   O motor. Recebe a MÁSCARA das letras (o texto como está no palco do
   LAB 03, em branco sobre nada — `VE.type.mascara`) e devolve um
   painel de pastilhas assentadas como um mosaiqueiro assenta:

   · risca-se uma linha paralela à borda da letra, meia pastilha para
     dentro, e assenta-se uma FIADA ao longo dela, cada pastilha virada
     para seguir a curva; risca-se a fiada seguinte uma pastilha mais para
     dentro, e assim até encher o traço. A fiada não atravessa a quina:
     para ali e recomeça, com o corte em meia-esquadria (o bisector).
   · quem corta cada pastilha ao tamanho da letra é o CAMPO DE DISTÂNCIA
     da máscara: cada pixel sabe a que fiada pertence (k = ⌊d/passo⌋) e
     se está no rejunte entre fiadas; a pastilha desenhada é recortada
     por isso. Onde duas fiadas se encontram (o miolo de uma haste), a
     pastilha assentada por último corta a anterior — como na obra.
   · o CAMPO em volta (modo PAINEL) é uma grade reta ou de tijolo, ou uma
     CALÇADA de pedras irregulares (a portuguesa, do Rio), ou os azulejos
     em módulo girado ao acaso (a lição do Bulcão), ou o ladrilho
     hidráulico — e uma MOLDURA de fiadas na beira do painel, com a onda
     de Copacabana entre os padrões.

   O que é diferente do gerador de referência (que é vetorial, com
   opentype + Clipper): aqui não há dependências; a geometria vem de um
   campo de distância (transformada exata, Felzenszwalb) e de marching
   squares sobre ele, e o recorte é por pixel. A saída é PNG e a fonte
   'type' da linha do tempo (a animação ASSENTAR põe as pastilhas uma a
   uma, na ordem em que o mosaiqueiro as põe).                          */
(function (VE) {
  'use strict';

  var E = VE.pastilha = {};

  /* ---------------------------------------------------- as paletas
     tinta = a pastilha da letra · papel = a do campo · aro = a fiada de
     contorno (e a moldura lisa). As doze primeiras são as do gerador de
     referência com nomes daqui; as brasileiras vêm depois.             */
  E.PALETAS = [
    { nome: 'Cobalto e areia', tinta: '#173272', papel: '#F1EEE4', aro: '#C9AD8C' },
    { nome: 'Sálvia e rosa', tinta: '#527461', papel: '#E7D3D0', aro: '#B8A58D' },
    { nome: 'Sangue-de-boi e marfim', tinta: '#4B1B1D', papel: '#EFE6CF', aro: '#B69870' },
    { nome: 'Meia-noite e cerâmica', tinta: '#10285D', papel: '#F1EDE1', aro: '#6D91A7' },
    { nome: 'Verde-garrafa', tinta: '#22372D', papel: '#EEE7D4', aro: '#7C322E' },
    { nome: 'Carvão e creme', tinta: '#2A2320', papel: '#F1E7D6', aro: '#77685A' },
    { nome: 'Cobalto e latão', tinta: '#16377D', papel: '#F2EDDE', aro: '#C4A85F' },
    { nome: 'Ocre e pedra', tinta: '#9D793D', papel: '#E8E4DA', aro: '#D1A34F' },
    { nome: 'Ardósia e rosa', tinta: '#151D1D', papel: '#D5B7A8', aro: '#617975' },
    { nome: 'Verdete', tinta: '#3D665A', papel: '#EDE7D8', aro: '#B68F6C' },
    { nome: 'Terracota', tinta: '#8B412E', papel: '#F0E7D8', aro: '#C89A72' },
    { nome: 'Pastilha da noite', tinta: '#14161A', papel: '#F0ECE0', aro: '#2B3038' },
    /* ---- as brasileiras ---- */
    { nome: 'Copacabana', tinta: '#1B1B1B', papel: '#F1ECE2', aro: '#8A8580', br: 1, campo: 3, moldura: 0 },
    { nome: 'Avenida Atlântica', tinta: '#1B1B1B', papel: '#EDE6D6', aro: '#8B3A2F', br: 1, campo: 2, moldura: 1 },
    { nome: 'Bulcão, Brasília', tinta: '#1E5AA8', papel: '#F4F1EA', aro: '#FFFFFF', br: 1, campo: 4, moldura: 0 },
    { nome: 'Azulejo colonial', tinta: '#24427A', papel: '#EFEADF', aro: '#C9A24A', br: 1 },
    { nome: 'Pastilha anos 50', tinta: '#2F7F73', papel: '#F1EAD8', aro: '#D9A5A0', br: 1 },
    { nome: 'Pastilha rosa', tinta: '#B3554F', papel: '#F6E7DF', aro: '#6FB3A8', br: 1 },
    { nome: 'Ladrilho hidráulico', tinta: '#B8563C', papel: '#EFE1C6', aro: '#4F6B4A', br: 1, campo: 5, moldura: 3 },
    { nome: 'Verde e amarelo', tinta: '#1B7A42', papel: '#F6C700', aro: '#153E8A', br: 1 },
    { nome: 'Pelourinho', tinta: '#2E5B9A', papel: '#F2B632', aro: '#B23A2F', br: 1 },
    { nome: 'Metrô de São Paulo', tinta: '#0A3D8F', papel: '#F2F2EE', aro: '#C8102E', br: 1 },
    { nome: 'Cerâmica da Bahia', tinta: '#2A5D9F', papel: '#E9B949', aro: '#F3E7C8', br: 1 },
    { nome: 'Noite tropical', tinta: '#0E0E0E', papel: '#C6E64A', aro: '#F26B8A', br: 1 },
    { nome: 'Personalizada', tinta: null, papel: null, aro: null }
  ];
  E.CAMPOS = ['Grade reta', 'Tijolo', 'Calçada portuguesa', 'Calçada de Copacabana', 'Azulejo (Bulcão)', 'Ladrilho hidráulico'];
  E.MOLDURAS = ['Nenhuma', 'Lisa', 'Onda de Copacabana', 'Xadrez', 'Diagonal'];
  E.MODOS = ['Só as letras', 'Painel inteiro'];

  E.novoP = function () {
    return {
      passo: 10,        /* % da altura das letras */
      rejunte: 8,       /* % do passo */
      cobertura: 15,    /* % da pastilha: menos que isso, o caco não se assenta */
      canto: 8,         /* % da pastilha: raio dos cantos */
      modo: 1,          /* 0 só as letras · 1 painel inteiro */
      campo: 0,         /* ver E.CAMPOS */
      aro: 1,           /* fiadas de contorno em volta da letra, na cor do aro */
      variacao: 10,     /* % de variação de tom por pastilha */
      moldura: 0,       /* ver E.MOLDURAS */
      molduraLarg: 2,   /* em pastilhas */
      paleta: 0,
      tinta: '#173272', papel: '#F1EEE4', aroCor: '#C9AD8C', rejunteCor: '',
      semente: 3,
      animar: 0, duracao: 3
    };
  };

  /* ---------------------------------------------------- utilidades */
  function hex2rgb(h) { h = (h || '#000000').replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb2hex(r) { return '#' + r.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function hash(a, b, c) { var x = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return x - Math.floor(x); }
  /* o rejunte, quando não é dado: o papel puxado para um cinza quente */
  E.corDoRejunte = function (P) {
    if (P.rejunteCor) return P.rejunteCor;
    return rgb2hex(mix(hex2rgb(P.papel), [150, 144, 134], 0.42));
  };
  /* a variação de tom: cada pastilha um degrau para o claro ou o escuro */
  function tom(hex, P, i, j, g) {
    if (!P.variacao) return hex;
    var t = (hash(i, j, g + P.semente * 7.1) * 2 - 1) * P.variacao / 100;
    var c = hex2rgb(hex), alvo = t > 0 ? [255, 255, 255] : [0, 0, 0];
    return rgb2hex(mix(c, alvo, Math.abs(t)));
  }

  /* ---------------------------------------------------- 1. o campo de distância
     Transformada de distância euclidiana exata (Felzenszvalb–Huttenlocher),
     duas passadas 1D. `dentro` é 1 onde a letra está. Devolve a distância,
     em pixels, de cada pixel de dentro até a borda (e, no segundo campo,
     de cada pixel de fora até a letra).                                 */
  function edt1d(f, n, d, v, z) {
    var k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
    for (var q = 1; q < n; q++) {
      var s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
    }
    k = 0;
    for (q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
  }
  function edt(dentro, W, H, inverter) {
    var INF = 1e12, g = new Float64Array(W * H), out = new Float32Array(W * H);
    var n = Math.max(W, H), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    var x, y, i;
    /* colunas */
    for (x = 0; x < W; x++) {
      for (y = 0; y < H; y++) { i = y * W + x; f[y] = (dentro[i] ? 1 : 0) === (inverter ? 0 : 1) ? INF : 0; }
      edt1d(f, H, d, v, z);
      for (y = 0; y < H; y++) g[y * W + x] = d[y];
    }
    /* linhas */
    for (y = 0; y < H; y++) {
      for (x = 0; x < W; x++) f[x] = g[y * W + x];
      edt1d(f, W, d, v, z);
      for (x = 0; x < W; x++) out[y * W + x] = Math.sqrt(d[x]);
    }
    return out;
  }

  /* ---------------------------------------------------- 2. as linhas riscadas
     Marching squares sobre o campo, no nível `nivel`: devolve laços
     fechados (listas de pontos) com interpolação linear na aresta. O
     campo é lido em passo `st` (1 ou 2) para não custar o quadro inteiro
     a cada fiada — meia pastilha de precisão já é mais do que se vê.    */
  function isolinhas(campo, W, H, nivel, st) {
    var w = Math.floor((W - 1) / st), h = Math.floor((H - 1) / st);
    var f = function (i, j) { return campo[(j * st) * W + i * st]; };
    var segs = [];
    var lerp = function (i0, j0, i1, j1, a, b) { var t = (nivel - a) / ((b - a) || 1e-9); return [(i0 + (i1 - i0) * t) * st, (j0 + (j1 - j0) * t) * st]; };
    for (var j = 0; j < h; j++) {
      for (var i = 0; i < w; i++) {
        var a = f(i, j), b = f(i + 1, j), c = f(i + 1, j + 1), d = f(i, j + 1);
        var m = (a >= nivel ? 8 : 0) | (b >= nivel ? 4 : 0) | (c >= nivel ? 2 : 0) | (d >= nivel ? 1 : 0);
        if (m === 0 || m === 15) continue;
        var T = lerp(i, j, i + 1, j, a, b), R = lerp(i + 1, j, i + 1, j + 1, b, c), B = lerp(i, j + 1, i + 1, j + 1, d, c), L = lerp(i, j, i, j + 1, a, d);
        switch (m) {
          case 1: case 14: segs.push([L, B]); break;
          case 2: case 13: segs.push([B, R]); break;
          case 3: case 12: segs.push([L, R]); break;
          case 4: case 11: segs.push([T, R]); break;
          case 5: segs.push([L, T]); segs.push([B, R]); break;
          case 6: case 9: segs.push([T, B]); break;
          case 7: case 8: segs.push([L, T]); break;
          case 10: segs.push([T, R]); segs.push([L, B]); break;
        }
      }
    }
    /* encadear os segmentos em laços */
    var chave = function (p) { return Math.round(p[0] * 4) + ',' + Math.round(p[1] * 4); };
    var porPonto = {};
    segs.forEach(function (s, k) { [chave(s[0]), chave(s[1])].forEach(function (c) { (porPonto[c] = porPonto[c] || []).push(k); }); });
    var usado = new Uint8Array(segs.length), lacos = [];
    for (var k = 0; k < segs.length; k++) {
      if (usado[k]) continue;
      usado[k] = 1;
      var laco = [segs[k][0], segs[k][1]], fim = chave(segs[k][1]), ini = chave(segs[k][0]);
      var guarda = 0;
      while (fim !== ini && guarda++ < 200000) {
        var cand = porPonto[fim], prox = -1;
        if (cand) for (var q = 0; q < cand.length; q++) if (!usado[cand[q]]) { prox = cand[q]; break; }
        if (prox < 0) break;
        usado[prox] = 1;
        var s2 = segs[prox], p = chave(s2[0]) === fim ? s2[1] : s2[0];
        laco.push(p); fim = chave(p);
      }
      if (laco.length >= 4) lacos.push(laco);
    }
    return lacos;
  }

  /* simplificar (Douglas–Peucker num laço fechado, aberto no ponto mais
     longe do primeiro) */
  function dp(pts, tol) {
    if (pts.length < 4) return pts;
    var out = [];
    (function rec(a, b) {
      var A = pts[a], B = pts[b], maxD = -1, idx = -1;
      var dx = B[0] - A[0], dy = B[1] - A[1], L = dx * dx + dy * dy;
      for (var i = a + 1; i < b; i++) {
        var P = pts[i], t = L > 0 ? ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
        var ex = A[0] + dx * t - P[0], ey = A[1] + dy * t - P[1], dd = ex * ex + ey * ey;
        if (dd > maxD) { maxD = dd; idx = i; }
      }
      if (maxD > tol * tol && idx > 0) { rec(a, idx); rec(idx, b); }
      else out.push(pts[a]);
    })(0, pts.length - 1);
    out.push(pts[pts.length - 1]);
    return out;
  }
  function simplificarLaco(laco, tol) {
    var far = 0, fd = -1;
    for (var i = 1; i < laco.length; i++) { var d = (laco[i][0] - laco[0][0]) * (laco[i][0] - laco[0][0]) + (laco[i][1] - laco[0][1]) * (laco[i][1] - laco[0][1]); if (d > fd) { fd = d; far = i; } }
    var a = dp(laco.slice(0, far + 1), tol), b = dp(laco.slice(far), tol);
    var out = a.concat(b.slice(1));
    if (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
    return out;
  }

  /* ---------------------------------------------------- 3. as fiadas
     Um laço vira CORRIDAS: quebra-se em cada quina (giro maior que o
     limite, medido com um passo de distância para não ver ruído) — a
     fiada não atravessa a quina. Cada corrida é reamostrada por
     comprimento de arco em `n` pastilhas iguais.                        */
  function comprimentos(pts, fechado) {
    var L = [0];
    for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    if (fechado) L.push(L[L.length - 1] + Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]));
    return L;
  }
  /* ponto e tangente no comprimento s de uma polilinha (aberta; a fechada
     chega com o primeiro ponto repetido no fim) */
  function noArco(pts, L, s) {
    var n = pts.length;
    if (s <= 0) return { p: pts[0], t: tang(pts[0], pts[1]) };
    if (s >= L[n - 1]) return { p: pts[n - 1], t: tang(pts[n - 2], pts[n - 1]) };
    var lo = 0, hi = n - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (L[mid] <= s) lo = mid; else hi = mid; }
    var seg = L[hi] - L[lo], t = seg > 0 ? (s - L[lo]) / seg : 0;
    return { p: [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t], t: tang(pts[lo], pts[hi]) };
  }
  function tang(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }

  function corridas(laco, passo, limGraus) {
    var n = laco.length, fechado = laco.concat([laco[0]]), L = comprimentos(fechado, false), total = L[n];
    if (total < passo * 1.5) return [];
    var lim = Math.cos(limGraus * Math.PI / 180), w = passo * 0.45;
    var quinas = [];
    for (var i = 0; i < n; i++) {
      var s = L[i];
      var a = noArco(fechado, L, ((s - w) % total + total) % total), b = noArco(fechado, L, (s + w) % total);
      var t1 = tang(a.p, laco[i]), t2 = tang(laco[i], b.p);
      if (t1[0] * t2[0] + t1[1] * t2[1] < lim) quinas.push(i);
    }
    /* quinas mais perto que uma pastilha são uma quina só */
    var q2 = [];
    quinas.forEach(function (q) { if (!q2.length || L[q] - L[q2[q2.length - 1]] > passo * 0.9) q2.push(q); });
    if (q2.length > 1 && total - L[q2[q2.length - 1]] + L[q2[0]] < passo * 0.9) q2.pop();
    if (!q2.length) return [{ pts: fechado, fechada: true }];
    var out = [];
    for (var k = 0; k < q2.length; k++) {
      var i0 = q2[k], i1 = q2[(k + 1) % q2.length], pts = [];
      var j = i0;
      do { pts.push(laco[j]); j = (j + 1) % n; } while (j !== i1);
      pts.push(laco[i1]);
      out.push({ pts: pts, fechada: false });
    }
    return out;
  }

  /* o lado de dentro: o campo cresce para onde a letra é mais funda */
  function normalDentro(campo, W, H, p, t) {
    var nx = -t[1], ny = t[0], e = 1.5;
    var a = ler(campo, W, H, p[0] + nx * e, p[1] + ny * e), b = ler(campo, W, H, p[0] - nx * e, p[1] - ny * e);
    return a >= b ? [nx, ny] : [-nx, -ny];
  }
  function ler(campo, W, H, x, y) {
    x = Math.max(0, Math.min(W - 1, Math.round(x))); y = Math.max(0, Math.min(H - 1, Math.round(y)));
    return campo[y * W + x];
  }

  /* corta um polígono por um meio-plano (fica o lado em que (p−c)·n ≤ 0) */
  function cortarMeioPlano(poly, c, nrm) {
    var out = [], n = poly.length;
    for (var i = 0; i < n; i++) {
      var a = poly[i], b = poly[(i + 1) % n];
      var da = (a[0] - c[0]) * nrm[0] + (a[1] - c[1]) * nrm[1], db = (b[0] - c[0]) * nrm[0] + (b[1] - c[1]) * nrm[1];
      if (da <= 0) out.push(a);
      if ((da <= 0) !== (db <= 0)) { var t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }

  /* as pastilhas de uma corrida: polígonos que seguem a curva, cada um
     com comprimento `passo − rejunte` ao longo e `passo − rejunte`
     através, centrados na linha riscada; nas pontas de uma corrida
     aberta, o corte em meia-esquadria                                  */
  function pastilhasDaCorrida(cor, campo, W, H, passo, rej, k, ordem0) {
    var pts = cor.pts, L = comprimentos(pts, false), total = L[L.length - 1];
    if (total < passo * 0.6) return [];
    var n = Math.max(1, Math.round(total / passo)), esp = total / n, meia = passo / 2 - rej / 2;
    var out = [];
    for (var i = 0; i < n; i++) {
      var s0 = i * esp + rej / 2, s1 = (i + 1) * esp - rej / 2;
      if (!cor.fechada && i === 0) s0 = 0;
      if (!cor.fechada && i === n - 1) s1 = total;
      if (s1 - s0 < rej) continue;
      var passos = Math.max(1, Math.ceil((s1 - s0) / (passo * 0.5)));
      var fora = [], dentro = [];
      for (var q = 0; q <= passos; q++) {
        var s = s0 + (s1 - s0) * q / passos, a = noArco(pts, L, s), nr = normalDentro(campo, W, H, a.p, a.t);
        fora.push([a.p[0] - nr[0] * meia, a.p[1] - nr[1] * meia]);
        dentro.push([a.p[0] + nr[0] * meia, a.p[1] + nr[1] * meia]);
      }
      var poly = fora.concat(dentro.reverse());
      /* meia-esquadria nas pontas: a linha do corte passa pela quina, na
         direção que bissecta a chegada e a saída; o rejunte fica metade
         de cada lado                                                   */
      if (!cor.fechada && i === 0 && cor.bisIni) poly = cortarMeioPlano(poly, [pts[0][0] + cor.bisIni.n[0] * rej / 2, pts[0][1] + cor.bisIni.n[1] * rej / 2], [-cor.bisIni.n[0], -cor.bisIni.n[1]]);
      if (!cor.fechada && i === n - 1 && cor.bisFim) poly = cortarMeioPlano(poly, [pts[pts.length - 1][0] - cor.bisFim.n[0] * rej / 2, pts[pts.length - 1][1] - cor.bisFim.n[1] * rej / 2], cor.bisFim.n);
      if (poly.length >= 3) out.push({ poly: poly, k: k, ordem: ordem0 + i, i: Math.round(poly[0][0] / 3), j: Math.round(poly[0][1] / 3) });
    }
    return out;
  }
  /* a bissetriz de cada quina, guardada nas corridas vizinhas */
  function bissetrizes(cors) {
    for (var k = 0; k < cors.length; k++) {
      var a = cors[k], b = cors[(k + 1) % cors.length];
      if (a.fechada) continue;
      var pa = a.pts, pb = b.pts;
      var tA = tang(pa[pa.length - 2], pa[pa.length - 1]), tB = tang(pb[0], pb[1]);
      var m = [tB[0] - tA[0], tB[1] - tA[1]], l = Math.hypot(m[0], m[1]);
      if (l < 1e-6) m = [-tA[1], tA[0]]; else m = [m[0] / l, m[1] / l];
      /* n aponta de A para B: normal à linha de corte, para o lado de B */
      var n = [-m[1], m[0]];
      if (n[0] * tA[0] + n[1] * tA[1] < 0) n = [-n[0], -n[1]];
      a.bisFim = { n: n }; b.bisIni = { n: n };
    }
  }

  /* ---------------------------------------------------- 4. assentar
     Devolve o painel: as pastilhas das letras (por fiada), as do aro (as
     fiadas de fora), e os campos de distância que recortam tudo.       */
  E.assentar = function (mascara, W, H, P) {
    var g2 = mascara.getContext('2d'), img = g2.getImageData(0, 0, W, H).data;
    var dentro = new Uint8Array(W * H), n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (var i = 0, p = 0; i < W * H; i++, p += 4) {
      if (img[p + 3] > 127) { dentro[i] = 1; n++; var x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    var t0 = performance.now();
    var pan = { W: W, H: H, vazio: n === 0, caixa: [x0, y0, x1, y1] };
    if (n === 0) { pan.passo = Math.max(4, Math.round(Math.min(W, H) * 0.05)); pan.tiles = []; pan.aro = []; pan.dIn = null; pan.dOut = null; return pan; }
    var alturaLetras = Math.max(8, y1 - y0 + 1);
    var passo = Math.max(3, alturaLetras * P.passo / 100);
    var rej = Math.max(0.6, passo * P.rejunte / 100);
    pan.passo = passo; pan.rejunte = rej; pan.altura = alturaLetras;
    var dIn = edt(dentro, W, H, false), dOut = edt(dentro, W, H, true);
    pan.dIn = dIn; pan.dOut = dOut; pan.dentro = dentro;
    var st = (W * H > 900000) ? 2 : 1;
    var tol = passo / 10;
    /* as fiadas de dentro */
    var tiles = [], ordem = 0, maxK = 0;
    for (var k = 0; k < 40; k++) {
      var lacos = isolinhas(dIn, W, H, (k + 0.5) * passo, st);
      if (!lacos.length) break;
      maxK = k;
      lacos.forEach(function (laco) {
        var s = simplificarLaco(laco, tol);
        if (s.length < 3) return;
        var cors = corridas(s, passo, 36);
        if (!cors.length) return;
        bissetrizes(cors);
        cors.forEach(function (c) { var ts = pastilhasDaCorrida(c, dIn, W, H, passo, rej, k, ordem); ordem += ts.length; tiles.push.apply(tiles, ts); });
      });
    }
    pan.K = maxK + 1; pan.tiles = tiles;
    /* as fiadas de fora (o aro), no campo de fora — a normal "de dentro"
       aponta para onde dOut cresce, ou seja, para longe da letra; é o que
       se quer: a fiada k do aro fica entre k e k+1 passos da letra       */
    var aro = [];
    for (var a = 0; a < (P.modo === 1 ? P.aro : 0); a++) {
      var lacosA = isolinhas(dOut, W, H, (a + 0.5) * passo + rej / 2, st);
      lacosA.forEach(function (laco) {
        var s = simplificarLaco(laco, tol);
        if (s.length < 3) return;
        var cors = corridas(s, passo, 36);
        bissetrizes(cors);
        cors.forEach(function (c) { var ts = pastilhasDaCorrida(c, dOut, W, H, passo, rej, a, 0); aro.push.apply(aro, ts); });
      });
    }
    pan.aro = aro;
    pan.ms = Math.round(performance.now() - t0);
    return pan;
  };

  /* ---------------------------------------------------- 5. desenhar
     Duas passadas por fiada: primeiro cada pastilha com uma cor de
     IDENTIDADE (para medir quanto dela sobrou depois do recorte — a
     cobertura), depois as que ficaram, com a cor de verdade. O recorte
     é por pixel, pelos campos de distância.                            */
  function caminho(ctx, poly, raio) {
    var n = poly.length;
    ctx.beginPath();
    if (raio < 0.5 || n < 3) { ctx.moveTo(poly[0][0], poly[0][1]); for (var i = 1; i < n; i++) ctx.lineTo(poly[i][0], poly[i][1]); ctx.closePath(); return; }
    for (var k = 0; k < n; k++) {
      var p0 = poly[(k + n - 1) % n], p1 = poly[k], p2 = poly[(k + 1) % n];
      var l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      var r = Math.min(raio, l1 * 0.45, l2 * 0.45);
      var ax = p1[0] + (p0[0] - p1[0]) * (l1 > 0 ? r / l1 : 0), ay = p1[1] + (p0[1] - p1[1]) * (l1 > 0 ? r / l1 : 0);
      if (k === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
      ctx.arcTo(p1[0], p1[1], p2[0], p2[1], r);
    }
    ctx.closePath();
  }
  function cvs(W, H) { var c = document.createElement('canvas'); c.width = W; c.height = H; return c; }

  /* a cor de identidade: o índice da pastilha em R e G, B=255 marca "é pastilha" */
  function idCor(i) { return 'rgb(' + ((i + 1) & 255) + ',' + (((i + 1) >> 8) & 255) + ',255)'; }
  function idDe(d, p) { return d[p + 2] === 255 && d[p + 3] === 255 ? (d[p] | (d[p + 1] << 8)) - 1 : -1; }

  /* A composição é feita UMA vez por jogo de cores (`compor`) e guardada
     no painel: a imagem cheia, a imagem de fundo (campo, aro, rejunte —
     sem as pastilhas da letra) e o MAPA DE ORDEM (a que pastilha cada
     pixel pertence, na ordem do assentamento). Um quadro da animação é
     só escolher, por pixel, entre a cheia e o fundo — barato o bastante
     para tocar na linha do tempo em tempo real.                        */
  function chaveCor(P) {
    return [P.tinta, P.papel, P.aroCor, P.rejunteCor, P.variacao, P.canto, P.campo, P.moldura, P.molduraLarg, P.semente, P.cobertura, P.modo, P.aro].join('|');
  }
  E.desenhar = function (ctx, pan, P, W, H, tempo) {
    if (pan.vazio) {
      var vazio = ctx.createImageData(W, H);
      if (P.modo === 1) { var rj0 = hex2rgb(E.corDoRejunte(P)); for (var q = 0; q < W * H * 4; q += 4) { vazio.data[q] = rj0[0]; vazio.data[q + 1] = rj0[1]; vazio.data[q + 2] = rj0[2]; vazio.data[q + 3] = 255; } }
      ctx.putImageData(vazio, 0, 0); return;
    }
    var chave = chaveCor(P) + '|' + W + 'x' + H;
    if (pan.cacheChave !== chave) { compor(ctx, pan, P, W, H); pan.cacheChave = chave; }
    var total = pan.tiles.length, limite = total;
    if (E.animado(P)) limite = Math.floor(Math.max(0, Math.min(1, (tempo || 0) / P.duracao)) * total);
    if (limite >= total) { ctx.putImageData(pan.imgCheia, 0, 0); return; }
    var out = ctx.createImageData(W, H), o = out.data, a = pan.imgCheia.data, b = pan.imgFundo.data, om = pan.ordemMapa;
    for (var i = 0, p = 0; i < W * H; i++, p += 4) {
      var src = (om[i] >= 0 && om[i] < limite) ? a : b;
      o[p] = src[p]; o[p + 1] = src[p + 1]; o[p + 2] = src[p + 2]; o[p + 3] = src[p + 3];
    }
    ctx.putImageData(out, 0, 0);
  };

  function compor(ctx, pan, P, W, H) {
    var papel = P.papel, tinta = P.tinta, aroCor = P.aroCor, rejunte = E.corDoRejunte(P);
    var passo = pan.passo, rej = pan.rejunte || 1, raio = passo * P.canto / 100;
    var painel = P.modo === 1;
    var saida = ctx.createImageData(W, H), o = saida.data;
    var rj = hex2rgb(rejunte);
    var dIn = pan.dIn, dOut = pan.dOut;
    /* o fundo: rejunte no painel; no modo só letras, o rejunte só dentro da letra */
    for (var i = 0, p = 0; i < W * H; i++, p += 4) {
      if (painel || pan.dentro[i]) { o[p] = rj[0]; o[p + 1] = rj[1]; o[p + 2] = rj[2]; o[p + 3] = 255; }
    }
    /* ---- o campo (fora das letras), no modo painel ---- */
    if (painel) camposDeFora(o, pan, P, W, H, papel, tinta, aroCor, rejunte, raio);

    /* ---- o aro: as fiadas de fora, na cor do aro ---- */
    if (painel && pan.aro.length) {
      var la = cvs(W, H), ca = la.getContext('2d');
      pan.aro.forEach(function (t) { ca.fillStyle = tom(aroCor, P, t.i, t.j, 40 + t.k); caminho(ca, t.poly, raio); ca.fill(); });
      var da = ca.getImageData(0, 0, W, H).data;
      for (var i2 = 0, p2 = 0; i2 < W * H; i2++, p2 += 4) {
        if (pan.dentro[i2]) continue;
        var d = dOut[i2], k = Math.floor((d - rej / 2) / passo);
        if (k < 0 || k >= P.aro) continue;
        var dk = d - rej / 2 - k * passo;
        if (dk > passo - rej) continue;                  /* rejunte entre fiadas */
        var al = da[p2 + 3] / 255; if (al <= 0) continue;
        o[p2] = o[p2] + (da[p2] - o[p2]) * al; o[p2 + 1] = o[p2 + 1] + (da[p2 + 1] - o[p2 + 1]) * al; o[p2 + 2] = o[p2 + 2] + (da[p2 + 2] - o[p2 + 2]) * al; o[p2 + 3] = 255;
      }
    }
    /* o fundo está pronto: guarda-se antes das pastilhas da letra */
    pan.imgFundo = new ImageData(new Uint8ClampedArray(o), W, H);

    /* ---- as letras: fiada por fiada ---- */
    var K = pan.K, porK = [];
    for (var kk = 0; kk < K; kk++) porK.push([]);
    pan.tiles.forEach(function (t, idx) { t.idx = idx; if (t.k < K) porK[t.k].push(t); });
    var minPx = passo * passo * P.cobertura / 100;
    var lid = cvs(W, H), cid = lid.getContext('2d'), lc = cvs(W, H), cc = lc.getContext('2d');
    /* quem foi reclamado por alguma pastilha (mesmo um caco descartado);
       o que sobrar sem dono dentro da letra vira caco de enchimento.
       E a ordem do dono de cada pixel, para a animação                 */
    var dono = new Uint8Array(W * H), ordemMapa = new Int32Array(W * H);
    for (var z = 0; z < W * H; z++) ordemMapa[z] = -1;
    for (var k2 = 0; k2 < K; k2++) {
      var ts = porK[k2]; if (!ts.length) continue;
      /* 1. identidade */
      cid.clearRect(0, 0, W, H);
      ts.forEach(function (t) { cid.fillStyle = idCor(t.idx); caminho(cid, t.poly, 0); cid.fill(); });
      var did = cid.getImageData(0, 0, W, H).data;
      var conta = {};
      var lo = k2 * passo + rej / 2, hi = (k2 + 1) * passo - rej / 2;
      for (var i3 = 0, p3 = 0; i3 < W * H; i3++, p3 += 4) {
        if (!pan.dentro[i3]) continue;
        var d3 = dIn[i3]; if (d3 < lo || d3 > hi) continue;
        var id = idDe(did, p3); if (id < 0) continue;
        dono[i3] = 1;
        conta[id] = (conta[id] || 0) + 1;
      }
      /* 2. as que ficam, com cor */
      cc.clearRect(0, 0, W, H);
      var fica = {};
      ts.forEach(function (t) {
        if ((conta[t.idx] || 0) < minPx) { t.caco = 1; return; }
        t.caco = 0; fica[t.idx] = 1;
        cc.fillStyle = tom(tinta, P, t.i, t.j, t.k); caminho(cc, t.poly, raio); cc.fill();
      });
      var dc = cc.getImageData(0, 0, W, H).data;
      for (var i4 = 0, p4 = 0; i4 < W * H; i4++, p4 += 4) {
        if (!pan.dentro[i4]) continue;
        var d4 = dIn[i4];
        if (d4 < lo || d4 > hi) continue;
        var al4 = dc[p4 + 3] / 255; if (al4 <= 0) continue;
        o[p4] = o[p4] + (dc[p4] - o[p4]) * al4; o[p4 + 1] = o[p4 + 1] + (dc[p4 + 1] - o[p4 + 1]) * al4; o[p4 + 2] = o[p4 + 2] + (dc[p4 + 2] - o[p4 + 2]) * al4; o[p4 + 3] = 255;
        var idd = idDe(did, p4);
        if (idd >= 0 && fica[idd] && al4 > 0.5) ordemMapa[i4] = pan.tiles[idd].ordem;
      }
    }
    /* os cacos de enchimento: o miolo fundo demais para uma fiada, as
       cunhas nas quinas — o mosaiqueiro corta um pedaço e enche. Aqui é
       a tinta, com um tom por célula para parecer pedaço e não mancha;
       na animação entram por último                                   */
    var tn2 = hex2rgb(tinta), cel = Math.max(2, passo * 0.5), ultimo = pan.tiles.length - 1;
    for (var i5 = 0, p5 = 0; i5 < W * H; i5++, p5 += 4) {
      if (!pan.dentro[i5] || dono[i5]) continue;
      var d5 = dIn[i5], k5 = Math.floor(d5 / passo), dk5 = d5 - k5 * passo;
      if (dk5 < rej / 2 || dk5 > passo - rej / 2) continue;         /* rejunte */
      if (d5 < rej / 2) continue;
      var x5 = i5 % W, y5 = (i5 / W) | 0;
      var h5 = (hash(Math.floor(x5 / cel), Math.floor(y5 / cel), P.semente + 11) * 2 - 1) * P.variacao / 100;
      var c5 = mix(tn2, h5 > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(h5));
      o[p5] = c5[0]; o[p5 + 1] = c5[1]; o[p5 + 2] = c5[2]; o[p5 + 3] = 255;
      ordemMapa[i5] = ultimo;
    }
    pan.imgCheia = saida; pan.ordemMapa = ordemMapa;
    pan.cacos = pan.tiles.filter(function (t) { return t.caco; }).length;
  }

  /* ---------------------------------------------------- 6. os campos de fora
     Grade reta, tijolo, calçada portuguesa (pedras irregulares — cada
     pixel pertence à pedra cujo centro está mais perto), azulejo em
     módulo girado (Bulcão) e ladrilho hidráulico; e a moldura na beira.
     Tudo recortado pela letra (dOut ≥ meio rejunte) e pelas fiadas do
     aro (dOut ≥ aro·passo).                                            */
  function camposDeFora(o, pan, P, W, H, papel, tinta, aroCor, rejunte, raio) {
    var passo = pan.passo, rej = pan.rejunte, dOut = pan.dOut;
    var limite = P.aro * passo + rej / 2;                      /* onde o campo começa */
    var lc = cvs(W, H), c = lc.getContext('2d');
    var ml = P.moldura ? P.molduraLarg * passo : 0;
    var tipo = P.campo;
    var i, j, x, y, p;
    var tile = passo - rej;
    var tn = hex2rgb(tinta), pp = hex2rgb(papel), ar = hex2rgb(aroCor);
    if (tipo === 2 || tipo === 3) {
      /* CALÇADA: sementes numa grade sacudida; cada pixel vai para a mais
         próxima; o rejunte é a fronteira entre pedras                  */
      var cel = passo * 0.95, nx = Math.ceil(W / cel) + 2, ny = Math.ceil(H / cel) + 2;
      var sx = new Float32Array(nx * ny), sy = new Float32Array(nx * ny);
      for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) { var h1 = hash(i, j, P.semente), h2 = hash(j, i, P.semente + 9); sx[j * nx + i] = (i - 1 + 0.5 + (h1 - 0.5) * 0.8) * cel; sy[j * nx + i] = (j - 1 + 0.5 + (h2 - 0.5) * 0.8) * cel; }
      var dono = new Int32Array(W * H);
      for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
        var ci = Math.floor(x / cel) + 1, cj = Math.floor(y / cel) + 1, best = 1e18, bi = -1;
        for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
          var q = (cj + dj) * nx + (ci + di); if (q < 0 || q >= nx * ny) continue;
          var ex = sx[q] - x, ey = sy[q] - y, dd = ex * ex + ey * ey;
          if (dd < best) { best = dd; bi = q; }
        }
        dono[y * W + x] = bi;
      }
      var meioRej = Math.max(1, Math.round(rej / 2));
      for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
        i = y * W + x; p = i * 4;
        if (pan.dentro[i] || dOut[i] < limite) continue;
        var d0 = dono[i], borda = false;
        for (var e = 1; e <= meioRej && !borda; e++) {
          if (x + e < W && dono[i + e] !== d0) borda = true;
          if (y + e < H && dono[i + e * W] !== d0) borda = true;
          if (x - e >= 0 && dono[i - e] !== d0) borda = true;
          if (y - e >= 0 && dono[i - e * W] !== d0) borda = true;
        }
        if (borda) continue;                                    /* fica o rejunte */
        var cor = corDaPedra(x, y, d0, P, W, H, ml, pp, tn, ar, passo, tipo === 3);
        o[p] = cor[0]; o[p + 1] = cor[1]; o[p + 2] = cor[2]; o[p + 3] = 255;
      }
      return;
    }
    /* os campos em grade: desenha-se a grade inteira num canvas e
       recorta-se por pixel                                             */
    var off = tipo === 1 ? 0.5 : 0;
    var n0 = Math.ceil(W / passo) + 2, m0 = Math.ceil(H / passo) + 2;
    for (j = -1; j < m0; j++) for (i = -1; i < n0; i++) {
      var cx = (i + (j & 1 ? off : 0)) * passo + passo / 2, cy = j * passo + passo / 2;
      var naMoldura = ml > 0 && (cx < ml || cy < ml || cx > W - ml || cy > H - ml);
      var base = papel;
      if (naMoldura) base = corDaMoldura(i, j, P, papel, tinta, aroCor, cx, cy, W, H, passo);
      c.fillStyle = tom(base, P, i, j, 100);
      var poly = [[cx - tile / 2, cy - tile / 2], [cx + tile / 2, cy - tile / 2], [cx + tile / 2, cy + tile / 2], [cx - tile / 2, cy + tile / 2]];
      caminho(c, poly, raio); c.fill();
      if (!naMoldura && (tipo === 4 || tipo === 5)) motivo(c, tipo, cx, cy, tile, i, j, P, tinta, papel);
    }
    var d = c.getImageData(0, 0, W, H).data;
    for (i = 0, p = 0; i < W * H; i++, p += 4) {
      if (pan.dentro[i] || dOut[i] < limite) continue;
      var al = d[p + 3] / 255; if (al <= 0) continue;
      o[p] = o[p] + (d[p] - o[p]) * al; o[p + 1] = o[p + 1] + (d[p + 1] - o[p + 1]) * al; o[p + 2] = o[p + 2] + (d[p + 2] - o[p + 2]) * al; o[p + 3] = 255;
    }
  }
  /* a onda de Copacabana: uma senoide larga que atravessa o painel */
  /* faixas largas e paralelas, cada uma ondulando: a fase é y mais um
     seno em x — é o desenho do calçadão de Copacabana (Burle Marx, 1970),
     com quatro passos de largura por faixa                              */
  function onda(x, y, W, H, passo) {
    var faixa = passo * 4.2, v = y / faixa + 0.55 * Math.sin(x / (passo * 5.5)) + 0.25 * Math.sin(x / (passo * 2.3) + 1.7);
    return (v - Math.floor(v)) < 0.5;
  }
  function corDaPedra(x, y, semente, P, W, H, ml, pp, tn, ar, passo, comOndas) {
    /* na calçada, a moldura é a onda; fora dela, o padrão da paleta: a
       pedra preta e branca do Rio quando a paleta pede (Copacabana), senão
       o papel com variação                                             */
    var naMoldura = ml > 0 && (x < ml || y < ml || x > W - ml || y > H - ml);
    var i = Math.floor(x / passo), j = Math.floor(y / passo);
    if (naMoldura) return hex2rgb(corDaMoldura(i, j, P, rgb2hex(pp), rgb2hex(tn), rgb2hex(ar), x, y, W, H, passo));
    var h = hash(semente, 3, P.semente), preta = comOndas ? onda(x, y, W, H, passo) : false;
    var base = preta ? tn : pp;
    var t = (h * 2 - 1) * P.variacao / 100;
    return mix(base, t > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(t));
  }
  function corDaMoldura(i, j, P, papel, tinta, aroCor, cx, cy, W, H, passo) {
    switch (P.moldura) {
      case 1: return aroCor;
      case 2: return onda(cx, cy, W, H, passo) ? tinta : papel;
      case 3: return ((i + j) & 1) ? tinta : papel;
      case 4: return (((i - j) % 4) + 4) % 4 < 2 ? tinta : papel;
    }
    return papel;
  }
  /* os módulos: Bulcão (um quarto de disco ou uma diagonal, girados ao
     acaso) e o ladrilho hidráulico (estrela de quatro pontas alternada) */
  function motivo(c, tipo, cx, cy, tile, i, j, P, tinta, papel) {
    var h = hash(i, j, P.semente + 4), r = Math.floor(h * 4), q = tile / 2;
    c.save(); c.translate(cx, cy); c.rotate(r * Math.PI / 2);
    c.fillStyle = tinta;
    if (tipo === 4) {
      if (hash(j, i, P.semente + 5) > 0.5) { c.beginPath(); c.moveTo(-q, -q); c.arc(-q, -q, tile, 0, Math.PI / 2); c.closePath(); c.fill(); }
      else { c.beginPath(); c.moveTo(-q, -q); c.lineTo(q, -q); c.lineTo(-q, q); c.closePath(); c.fill(); }
    } else {
      var par = ((i + j) & 1) === 0;
      c.fillStyle = par ? tinta : papel;
      c.beginPath();
      c.moveTo(0, -q * 0.9); c.lineTo(q * 0.25, -q * 0.25); c.lineTo(q * 0.9, 0); c.lineTo(q * 0.25, q * 0.25); c.lineTo(0, q * 0.9); c.lineTo(-q * 0.25, q * 0.25); c.lineTo(-q * 0.9, 0); c.lineTo(-q * 0.25, -q * 0.25); c.closePath(); c.fill();
      c.fillStyle = par ? papel : tinta; c.beginPath(); c.arc(0, 0, q * 0.22, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  /* a cor da paleta escolhida entra em P (a personalizada não mexe) */
  E.aplicarPaleta = function (P, idx) {
    var pal = E.PALETAS[idx]; if (!pal) return;
    P.paleta = idx;
    if (!pal.tinta) return;
    P.tinta = pal.tinta; P.papel = pal.papel; P.aroCor = pal.aro; P.rejunteCor = '';
    if (pal.campo != null) P.campo = pal.campo;
    if (pal.moldura != null) P.moldura = pal.moldura;
  };

  E.animado = function (P) { return !!(P.animar && P.duracao > 0); };

})(window.VE);
