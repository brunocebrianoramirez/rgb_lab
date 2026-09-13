/* ============================================================
   rgb_lab — A FILMADORA · o motor
   ------------------------------------------------------------
   A traseira de uma câmera de filme. A BITOLA é a máquina: cada
   uma tem a sua película (o pacote de efeitos calibrado em
   js/fx5.js), a sua cadência, o seu visor, o seu couro. O FILME
   é o seletor: os nove olhares da família 8 MM do catálogo de
   filtros, mais o PURO (só a película da bitola). O botão
   vermelho GRAVA — e gravar aqui é a exportação do laboratório,
   com a película entrando como o último ajuste da cadeia.

   O QUE ESTE ARQUIVO SABE (a tela está em js/filmadoraui.js):
     · as quatro bitolas e o que cada uma muda
     · a cadeia de efeitos que entra na prévia e na exportação
       (`VE.filmadora.ops(t)`, chamada pelo js/app.js a cada quadro)
     · as TEXTURAS — couro, pintura martelada, rugosa, alumínio
       escovado — que são RELEVO calculado e iluminado, não foto
     · a gravação pelo exportador e os ROLOS que saem dela

   A CARCAÇA
   O couro de cada máquina é FOTO, e é fixo: os três couros que o Bruno
   mandou (assets/filmadora/couro/ — preto no 8 MM, marrom no SUPER 8,
   bege no 16 MM) e um metal escovado gerado para o 35 MM, no mesmo
   tamanho e na mesma pasta. Cada arquivo é um LADRILHO ESPELHADO 2×2
   (a foto inteira a 840 px em cada quadrante) — emenda sem costura e
   deixa o grão do couro na metade do tamanho da primeira versão, que
   ele achou "com muito zoom". A textura calculada (relevo iluminado)
   ficou só para o plástico da gaveta.
   ============================================================ */
(function (VE) {
  'use strict';

  var F = VE.filmadora = {};

  /* ================================================================
     AS BITOLAS
     `ppf` é quadros por pé de filme, `rolo` o comprimento do carregador
     em pés — os dois só servem ao CONTADOR, mas são os números de
     verdade: 50 pés de Super 8 a 18 q/s são 3 min 20 s.
     `visor` é a proporção da janela por onde se olha; nas de 8 mm ela é
     4:3 e recorta as barras pretas que a película deixa num vídeo 16:9,
     que é como a janela de uma câmera de verdade enquadra.           */
  F.BITOLAS = [
    { id: '8mm', nome: '8 MM', rotulo: 'REGULAR 8', pack: 'p8mm', fps: 18, ppf: 80, rolo: 25, visor: 4 / 3,
      carcaca: 'assets/filmadora/couro/couro-preto.jpg', tinta: 'escura', desc: 'a caseira: 18 quadros, imagem macia, cor desbotada, janela com sombra' },
    { id: 's8', nome: 'SUPER 8', rotulo: 'SUPER 8', pack: 'psuper8', fps: 18, ppf: 72, rolo: 50, visor: 4 / 3,
      carcaca: 'assets/filmadora/couro/couro-marrom.jpg', tinta: 'escura', desc: 'o mesmo tranco de 18, quadro maior, um pouco mais nítido e quente' },
    { id: '16mm', nome: '16 MM', rotulo: 'SUPER 16', pack: 'p16mm', fps: 24, ppf: 40, rolo: 100, visor: 5 / 3,
      carcaca: 'assets/filmadora/couro/couro-bege.jpg', tinta: 'clara', desc: 'a de documentário: 24 quadros, negativo neutro, grão fino' },
    { id: '35mm', nome: '35 MM', rotulo: 'CINEMA', pack: 'p35mm', fps: 24, ppf: 16, rolo: 400, visor: 1.85,
      carcaca: 'assets/filmadora/couro/metal-escovado.jpg', tinta: 'clara', desc: 'a de cinema: grão fino, quase nada além da cor e da halação' }
  ];
  F.bitola = function (id) {
    return F.BITOLAS.filter(function (b) { return b.id === id; })[0] || F.BITOLAS[0];
  };

  /* ================================================================
     OS FILMES DO SELETOR
     PURO é a película da bitola como ela vem. Os outros são os dez
     filmes da família 8 MM do catálogo (js/filters.js) — cada um uma
     CADEIA (curva por canal ou mesa de canais, e depois o filmstock)
     ajustada por medida à saída do app, na ordem do seletor dele. O
     seletor troca a COR da película, e só a cor — grão, janela e
     cadência continuam sendo os da bitola.                          */
  F.filmes = function () {
    var lista = [{ id: 'puro', nome: 'PURO', cor1: '#2a2a2a', cor2: '#d8d2c0', cadeia: null }];
    var cat = (VE.filters && VE.filters.LIST) || [];
    cat.forEach(function (d) {
      if (d.fam !== '8 MM') return;
      var stock = d.kind === 'chain' ? (d.steps.filter(function (s) { return s.fx === 'filmstock'; })[0] || {}).params : d.params;
      lista.push({ id: d.id, nome: d.name, cor1: (stock && stock.shTint) || '#333', cor2: (stock && stock.hiTint) || '#eee',
        cadeia: VE.filters.chainOf ? VE.filters.chainOf(d) : null });
    });
    return lista;
  };
  F.filme = function (id) {
    var l = F.filmes();
    return l.filter(function (x) { return x.id === id; })[0] || l[0];
  };

  /* ================================================================
     O ESTADO
     Guardado entre sessões (bitola, filme, ajustes) porque uma câmera
     lembra como foi deixada. Os rolos NÃO: são arquivos na memória. */
  var CHAVE = 'rgb_lab.filmadora';
  var AJ_PADRAO = { cor: 1, maciez: 1, grao: 1, sujeira: 1, tremor: 1, vazamento: 1, janela: 1 };
  var est = F.est = {
    ativa: false,          /* a máquina está aberta: a película entra na cadeia */
    bitola: '8mm',
    filme: 'm01',
    lente: 0,              /* a LENTE do app: 0 limpa · 1 vazamento · 2 halo */
    tremor: true,          /* o botão no centro da roda (o "frame jitter" do app) */
    som: false,            /* o botão da grade: grava em tempo real, com o áudio */
    cadencia: true,        /* o tranco da bitola; desligado, o vídeo anda como veio */
    aj: {},
    gravando: null,        /* { ini, dur, thumb } enquanto o rolo roda */
    rolos: []
  };
  Object.keys(AJ_PADRAO).forEach(function (k) { est.aj[k] = AJ_PADRAO[k]; });

  F.carregar = function () {
    try {
      var g = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (!g) return;
      if (F.bitola(g.bitola).id === g.bitola) est.bitola = g.bitola;
      if (g.filme) est.filme = g.filme;
      if (g.lente === 0 || g.lente === 1 || g.lente === 2) est.lente = g.lente;
      if (typeof g.tremor === 'boolean') est.tremor = g.tremor;
      if (typeof g.som === 'boolean') est.som = g.som;
      if (typeof g.cadencia === 'boolean') est.cadencia = g.cadencia;
      if (g.aj) Object.keys(AJ_PADRAO).forEach(function (k) {
        var v = parseFloat(g.aj[k]); if (isFinite(v)) est.aj[k] = Math.max(0, Math.min(2, v));
      });
    } catch (e) { /* sem memória: a máquina abre como nova */ }
  };
  F.guardar = function () {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({
        bitola: est.bitola, filme: est.filme, lente: est.lente, tremor: est.tremor,
        som: est.som, cadencia: est.cadencia, aj: est.aj
      }));
    } catch (e) { /* sem espaço: paciência */ }
  };

  /* a carcaça de uma bitola: a foto e a tinta (escura = glifos creme,
     clara = glifos pretos em plaquetas) */
  F.carcacaDe = function (bitolaId) { var b = F.bitola(bitolaId); return { url: b.carcaca, tinta: b.tinta }; };
  F.reporAjustes = function () {
    Object.keys(AJ_PADRAO).forEach(function (k) { est.aj[k] = AJ_PADRAO[k]; });
    est.lente = 0; est.tremor = true; est.cadencia = true;
    F.guardar();
  };
  F.AJ_PADRAO = AJ_PADRAO;

  F.ativa = function () { return est.ativa; };

  /* ================================================================
     A CADEIA
     Chamada pelo js/app.js a cada quadro, na prévia E na exportação —
     é assim que o botão vermelho grava com a película. A bitola dá o
     pacote (js/fx5.js); os ajustes são MULTIPLICADORES sobre ele, para
     que o "1" de cada um seja sempre a calibração da bitola e não um
     número solto. O filme do seletor entra no lugar do `filmstock` do
     pacote como uma CADEIA (a curva por canal e o filmstock ajustados
     à saída do app), e a COR é o quanto dessa cadeia entra. A LENTE
     decide o vazamento (1) ou o halo (2); o TREMOR liga o gateweave. */
  F.ops = function (t) {
    if (!est.ativa) return [];
    var b = F.bitola(est.bitola);
    var st = (VE.STYLES || []).filter(function (s) { return s.id === b.pack; })[0];
    if (!st) return [];
    var filme = F.filme(est.filme), aj = est.aj, fx = [];
    st.fx.forEach(function (par) {
      var id = par[0], p = VE.defaults(id), amount = 1, k;
      for (k in par[1]) p[k] = par[1][k];
      switch (id) {
        case 'cadencia':
          if (!est.cadencia) return;
          break;
        case 'blur':
          p.rad *= aj.maciez;
          if (p.rad < 0.002) return;
          break;
        case 'filmstock':
          amount = Math.max(0, Math.min(1, aj.cor));
          if (filme.cadeia && filme.cadeia.length) {
            if (amount < 0.005) return;
            /* a cadeia do filme, passo a passo, cada um com a COR */
            filme.cadeia.forEach(function (passo, i) {
              var pp = {}; for (k in passo.params) pp[k] = passo.params[k];
              if (passo.id === 'filmstock') { pp.grain = 0; pp.sharp = 0; pp.vig = 0; }
              fx.push({ id: passo.id, effId: 'fil-filme-' + i, params: pp, amount: amount, local: t, mask: VE.newMask() });
            });
            halo();
            return;
          }
          amount = 1;
          break;
        case 'filmgrain':
          p.amt *= aj.grao;
          if (p.amt < 0.002) return;
          break;
        case 'dustscratch':
          p.dust *= aj.sujeira; p.hair *= aj.sujeira; p.scratch *= aj.sujeira;
          if (p.dust + p.hair + p.scratch < 0.002) return;
          break;
        case 'gateweave':
          if (!est.tremor) return;
          p.amt *= aj.tremor; p.rot *= aj.tremor; p.jump *= aj.tremor;
          if (p.amt + p.jump < 0.002) return;
          break;
        case 'lightleak':
          /* a LENTE 1 é a QUEIMADURA DE FILME (o film burn medido), no lugar
             do vazamento fixo do pacote; o ajuste VAZAMENTO dosa ela      */
          if (est.lente !== 1) return;
          id = 'queimadura'; p = VE.defaults('queimadura');
          p.amt = 1.0*aj.vazamento;
          if (p.amt < 0.005) return;
          break;
        case 'halation':
          /* a lente HALO acrescenta halação onde o pacote não tem */
          break;
        case 'filmgate':
          p.sombra *= aj.janela;
          if (est.lente === 2) p.vig = Math.min(1.5, (p.vig || 0) + 0.35);
          break;
      }
      fx.push({ id: id, effId: 'fil-' + id, params: p, amount: amount, local: t, mask: VE.newMask() });
      if (id === 'filmstock') halo();
    });
    /* a lente HALO: a halação entra logo depois da cor, antes do grão */
    function halo() {
      if (est.lente !== 2 || st.fx.some(function (q) { return q[0] === 'halation'; })) return;
      var ph = VE.defaults('halation'); ph.amt = 0.32; ph.thr = 0.7; ph.rad = 0.02; ph.soft = 0.7;
      fx.push({ id: 'halation', effId: 'fil-halo', params: ph, amount: 1, local: t, mask: VE.newMask() });
    }
    return fx.length ? [{ kind: 'adjust', effects: fx }] : [];
  };

  /* ================================================================
     AS TEXTURAS
     Três relevos e um metal, todos periódicos. O relevo é um mapa de
     altura; a luz vem de cima e da esquerda (como a de uma mesa), com
     brilho de superfície (Blinn) — é o brilho nos altos do couro que
     faz couro parecer couro numa cor quase preta.                    */
  var texCache = {};

  function Semente(s) {
    var n = (s | 0) + 1;
    return function () {
      n = Math.imul(n ^ (n >>> 15), 2246822519); n = Math.imul(n ^ (n >>> 13), 3266489917);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    };
  }
  /* ruído de valor PERIÓDICO: `per` ciclos por ladrilho, em qualquer
     eixo — é isso que faz a borda direita emendar na esquerda      */
  function ruidoPer(x, y, per, sem) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    function h(i, j) {
      i = ((i % per) + per) % per; j = ((j % per) + per) % per;
      var n = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(sem + 7, 1274126177);
      n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
      return (n >>> 0) / 4294967296;
    }
    var a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
    var t = a + (b - a) * sx, u = c + (d - c) * sx;
    return t + (u - t) * sy;
  }
  function suave(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }

  /* couro: pastilhas (o ponto mais próximo de uma grade tremida) com
     um vinco macio entre elas e um leve domo em cada uma             */
  function alturaCouro(S, cel, sem) {
    var r = Semente(sem), G = S / cel, pts = [], H = new Float32Array(S * S);
    var i, j, x, y;
    for (j = 0; j < cel; j++) for (i = 0; i < cel; i++) {
      pts.push([(i + 0.5 + (r() - 0.5) * 0.9) * G, (j + 0.5 + (r() - 0.5) * 0.9) * G]);
    }
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      var ci = Math.floor(x / G), cj = Math.floor(y / G), d1 = 1e9, d2 = 1e9;
      for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
        var qi = ci + di, qj = cj + dj;
        var p = pts[((qj + cel) % cel) * cel + ((qi + cel) % cel)];
        var dx = x - p[0], dy = y - p[1];
        if (qi < 0) dx += S; else if (qi >= cel) dx -= S;
        if (qj < 0) dy += S; else if (qj >= cel) dy -= S;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      var v = (d2 - d1) / G;
      var h = suave(0, 0.34, v);
      h *= 1 - 0.3 * Math.min(1, (d1 / G) * (d1 / G) * 2.4);
      h += 0.09 * (ruidoPer(x / S * 22, y / S * 22, 22, sem) - 0.5) + 0.05 * (ruidoPer(x / S * 64, y / S * 64, 64, sem + 1) - 0.5);
      H[y * S + x] = h;
    }
    return H;
  }
  /* rugosa (pintura enrugada): cristas finas de ruído em três oitavas */
  function alturaRugosa(S, sem) {
    var H = new Float32Array(S * S), x, y;
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      var h = 0, amp = 1, f = 14, o;
      for (o = 0; o < 3; o++) {
        h += amp * (1 - Math.abs(2 * ruidoPer(x / S * f, y / S * f, f, sem + o) - 1));
        amp *= 0.55; f *= 2;
      }
      H[y * S + x] = h / 1.85;
    }
    return H;
  }
  /* martelada: covas rasas que se sobrepõem, como a pintura das
     câmeras de cinema; a mais funda manda em cada ponto           */
  function alturaMartelada(S, sem) {
    var r = Semente(sem), H = new Float32Array(S * S), n = Math.round(S * S / 260), k, x, y;
    for (k = 0; k < S * S; k++) H[k] = 0.15 * (ruidoPer((k % S) / S * 40, Math.floor(k / S) / S * 40, 40, sem) - 0.5);
    for (k = 0; k < n; k++) {
      var cx = r() * S, cy = r() * S, rad = S * (0.018 + r() * 0.03), prof = 0.55 + r() * 0.45;
      var x0 = Math.floor(cx - rad), x1 = Math.ceil(cx + rad), y0 = Math.floor(cy - rad), y1 = Math.ceil(cy + rad);
      for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
        var dx = x - cx, dy = y - cy, q = (dx * dx + dy * dy) / (rad * rad);
        if (q >= 1) continue;
        var i = (((y % S) + S) % S) * S + (((x % S) + S) % S);
        var v = -prof * (1 - q);
        if (v < H[i]) H[i] = v;
      }
    }
    return H;
  }

  /* a luz: vem de cima e da esquerda; `amp` é quanto o relevo se
     inclina (a altura está em fração, isto a converte em pixels)     */
  function sombrear(H, S, cor, o) {
    var cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    var c = cv.getContext('2d'), img = c.createImageData(S, S), d = img.data;
    var L = [-0.48, -0.62, 0.62], ln = Math.sqrt(L[0] * L[0] + L[1] * L[1] + L[2] * L[2]);
    L[0] /= ln; L[1] /= ln; L[2] /= ln;
    var Hv = [L[0], L[1], L[2] + 1], hn = Math.sqrt(Hv[0] * Hv[0] + Hv[1] * Hv[1] + Hv[2] * Hv[2]);
    Hv[0] /= hn; Hv[1] /= hn; Hv[2] /= hn;
    var amb = o.amb, amp = o.amp, spec = o.spec, shin = o.shin, x, y;
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      var i = y * S + x;
      var hl = H[y * S + ((x - 1 + S) % S)], hr = H[y * S + ((x + 1) % S)];
      var hu = H[((y - 1 + S) % S) * S + x], hd = H[((y + 1) % S) * S + x];
      var nx = (hl - hr) * amp, ny = (hu - hd) * amp, nz = 1;
      var nn = Math.sqrt(nx * nx + ny * ny + 1); nx /= nn; ny /= nn; nz /= nn;
      var dif = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      var sp = Math.pow(Math.max(0, nx * Hv[0] + ny * Hv[1] + nz * Hv[2]), shin) * spec;
      var alb = o.albMin + (1 - o.albMin) * Math.max(0, Math.min(1, H[i] + 0.5 * (1 - o.rel)));
      var luz = amb + (1 - amb) * dif;
      d[i * 4] = Math.min(255, cor[0] * alb * luz + 255 * sp);
      d[i * 4 + 1] = Math.min(255, cor[1] * alb * luz + 255 * sp);
      d[i * 4 + 2] = Math.min(255, cor[2] * alb * luz + 255 * sp);
      d[i * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    return cv;
  }

  /* a pele de cada bitola, como um url() pronto para o CSS */
  F.pele = function (tipo, cor, sem) {
    var chave = tipo + ':' + cor.join(',');
    if (texCache[chave]) return texCache[chave];
    var S = 320, H, cv;
    /* O couro de câmera é um grão FINO e FOSCO: 32 pastilhas por lado
       (4–5 px na tela) e pouco brilho. A primeira versão tinha 18 e o
       triplo do brilho — e parecia plástico bolha, não couro.         */
    if (tipo === 'couro') {
      H = alturaCouro(S, 32, sem || 3);
      cv = sombrear(H, S, cor, { amb: 0.5, amp: 3.0, spec: 0.12, shin: 16, albMin: 0.5, rel: 1 });
    } else if (tipo === 'rugosa') {
      H = alturaRugosa(S, sem || 5);
      cv = sombrear(H, S, cor, { amb: 0.52, amp: 2.6, spec: 0.14, shin: 12, albMin: 0.62, rel: 1 });
    } else if (tipo === 'martelada') {
      H = alturaMartelada(S, sem || 9);
      cv = sombrear(H, S, cor, { amb: 0.52, amp: 3.4, spec: 0.22, shin: 30, albMin: 0.72, rel: 0 });
    } else {
      /* pontilhada: o plástico claro, com salpicos de dois tons */
      var r = Semente(sem || 11);
      cv = document.createElement('canvas'); cv.width = S; cv.height = S;
      var c = cv.getContext('2d'), img = c.createImageData(S, S), d = img.data, k;
      for (k = 0; k < S * S; k++) {
        var n = (r() - 0.5) * 9, s = r();
        var v = s < 0.012 ? -46 : (s < 0.02 ? 22 : 0);
        d[k * 4] = cor[0] + n + v; d[k * 4 + 1] = cor[1] + n + v; d[k * 4 + 2] = cor[2] + n + v; d[k * 4 + 3] = 255;
      }
      c.putImageData(img, 0, 0);
    }
    texCache[chave] = 'url(' + cv.toDataURL('image/png') + ')';
    return texCache[chave];
  };

  /* o disco de alumínio torneado do seletor: risco circular (ruído em
     função do ângulo), um arco de luz e a borda que escurece        */
  F.discoTorneado = function (D) {
    var cv = document.createElement('canvas'); cv.width = D; cv.height = D;
    var c = cv.getContext('2d'), img = c.createImageData(D, D), d = img.data, x, y;
    var R = D / 2, P = 110;
    for (y = 0; y < D; y++) for (x = 0; x < D; x++) {
      var i = y * D + x, dx = x + 0.5 - R, dy = y + 0.5 - R, r = Math.sqrt(dx * dx + dy * dy) / R;
      if (r > 1) { d[i * 4 + 3] = 0; continue; }
      var a = Math.atan2(dy, dx), ac = (a + Math.PI) / (2 * Math.PI);
      var risco = 0.55 * (ruidoPer(ac * P, r * 3, P, 4) - 0.5) + 0.3 * (ruidoPer(ac * P * 3, r * 9, P * 3, 6) - 0.5);
      var anel = 0.08 * (ruidoPer(r * 90, 0.5, 90, 8) - 0.5);
      var luz = 0.5 + 0.2 * Math.cos(a - 0.85) + 0.1 * Math.cos(2 * a + 0.6);
      var v = (luz + risco * 0.28 + anel) * 255;
      if (r > 0.94) v *= 1 - (r - 0.94) / 0.06 * 0.55;
      v = Math.max(0, Math.min(255, v));
      d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v * 0.985; d[i * 4 + 3] = r > 0.995 ? 0 : 255;
    }
    c.putImageData(img, 0, 0);
    return cv;
  };

  /* ================================================================
     A GRAVAÇÃO
     O botão vermelho é a exportação do laboratório, sem a janela dela:
     modo exato (quadro a quadro, codificador) ou, com o SOM ligado,
     tempo real com o áudio. Os campos da janela de exportação são
     usados como estão — resolução cheia e o fps que o Bruno deixou lá —
     e devolvidos no fim.                                             */
  var guardaCampos = null;
  F.gravar = function () {
    var EX = VE.exporter;
    if (!EX || !VE.project) { VE.app.toast('não há composição para gravar', 'err'); return false; }
    if (EX.emAndamento && EX.emAndamento()) { EX.cancelar(); return false; }
    var mode = document.getElementById('expMode'), res = document.getElementById('expRes'),
        fmt = document.getElementById('expFormat');
    if (!mode || !res || !fmt) return false;
    guardaCampos = [mode.value, res.value, fmt.value];
    var modo = est.som ? 'realtime' : 'precise';
    mode.value = modo; res.value = '1';
    if (EX.formatoParaModo) EX.formatoParaModo(modo);
    var faixa = EX.faixa();
    est.gravando = { ini: faixa.ini, dur: faixa.fim - faixa.ini, thumb: null, bitola: est.bitola, filme: est.filme };
    EX.aoTerminar = terminou;
    EX.start();
    if (!(EX.emAndamento && EX.emAndamento())) { est.gravando = null; devolverCampos(); return false; }
    return true;
  };
  function devolverCampos() {
    if (!guardaCampos) return;
    var mode = document.getElementById('expMode'), res = document.getElementById('expRes'),
        fmt = document.getElementById('expFormat');
    if (mode) mode.value = guardaCampos[0];
    if (res) res.value = guardaCampos[1];
    if (fmt) fmt.value = guardaCampos[2];
    guardaCampos = null;
  }
  function terminou(r) {
    var g = est.gravando;
    est.gravando = null;
    devolverCampos();
    if (!g || !r || !r.blob) { F.aoMudar && F.aoMudar('cancelado'); return; }
    var rolo = {
      id: VE.uid('r'), blob: r.blob, url: URL.createObjectURL(r.blob), ext: r.fmt.ext,
      nome: 'rgb_lab-filmadora-' + F.bitola(g.bitola).id + '-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.' + r.fmt.ext,
      dur: g.dur, bitola: g.bitola, filme: g.filme, data: new Date(), thumb: g.thumb, som: est.som
    };
    est.rolos.unshift(rolo);
    if (F.aoMudar) F.aoMudar('rolo', rolo);
  }
  F.gravando = function () { return est.gravando; };
  F.marcarThumb = function (dataUrl) { if (est.gravando && !est.gravando.thumb) est.gravando.thumb = dataUrl; };

  /* os rolos: baixar, usar na linha do tempo, apagar */
  F.rolo = function (id) { return est.rolos.filter(function (r) { return r.id === id; })[0]; };
  F.baixar = function (id) {
    var r = F.rolo(id); if (!r) return;
    VE.saveFile(r.nome, r.blob, r.url);
  };
  F.usar = function (id) {
    var r = F.rolo(id); if (!r) return false;
    if (!VE.app.addVideo) { VE.app.toast('o laboratório não expõe a entrada de vídeo', 'err'); return false; }
    var tipo = r.ext === 'mp4' ? 'video/mp4' : 'video/webm';
    VE.app.addVideo(new File([r.blob], r.nome, { type: tipo }), true);
    return true;
  };
  F.apagar = function (id) {
    var r = F.rolo(id); if (!r) return;
    URL.revokeObjectURL(r.url);
    est.rolos = est.rolos.filter(function (x) { return x.id !== id; });
    if (F.aoMudar) F.aoMudar('rolos');
  };

  /* o contador: pés de filme que este tempo consome nesta bitola */
  F.pes = function (segundos, bitolaId) {
    var b = F.bitola(bitolaId || est.bitola);
    return segundos * b.fps / b.ppf;
  };

  F.carregar();
})(window.VE);
