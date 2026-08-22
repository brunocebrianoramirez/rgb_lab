/* ==========================================================================
   rgb_lab — MODELO DE COMPOSIÇÃO POR CAMADAS
   --------------------------------------------------------------------------
   Este arquivo não desenha nada. Ele descreve O QUE uma camada é, para que
   o motor (compgl.js + gl.js) e a ficha da direita (compui.js) falem a mesma
   língua e ninguém precise adivinhar.

   Um CLIPE de vídeo passou a ser uma CAMADA DE COMPOSIÇÃO de verdade. A
   ordem em que as coisas acontecem é fixa e está documentada aqui porque é
   ela que explica todo o resto:

     FONTE
       ↓  transformar   posição, escala, rotação, âncora, espelho, corte
       ↓  efeitos       a pilha do clipe, exatamente como já era
       ↓  cor           exposição, contraste, gama, matiz, níveis…
       ↓  canais        misturador R/G/B, inversão, deslocamento cromático
       ↓  máscaras      várias, com somar / subtrair / intersectar
       ↓  matte         a silhueta emprestada de outra camada
       ↓  mesclar       modo de mistura, preenchimento, faixa de mescla
       ↓  compor        sobre o que já estava montado embaixo
     QUADRO

   Cada etapa é PULADA quando não muda nada. Uma camada recém-posta na linha
   do tempo custa exatamente o que custava antes deste arquivo existir: uma
   passada. Só quem usa é que paga.

   Por que essa ordem e não outra:
     · cor antes de máscara — para poder mascarar o resultado corrigido;
     · máscara antes de matte — a máscara é do artista, o matte vem de fora,
       e o de fora tem a última palavra sobre a silhueta;
     · faixa de mescla junto do modo — ela decide POR PIXEL se a camada
       existe naquele ponto, então precisa do fundo já montado.
   ========================================================================== */
(function (VE) {
  'use strict';

  /* ======================================================= MODOS DE MISTURA
     27 modos, nos seis grupos em que o mundo inteiro os agrupa. A ordem
     desta lista É o número gravado em `clip.blend` e É o número que o
     shader recebe em `uBlend`. Mexer na ordem quebra projetos salvos:
     se um dia precisar, acrescente no fim e nunca no meio.               */
  var G = function (nome, cor, modos) { return { nome: nome, cor: cor, modos: modos }; };

  VE.BLEND_GRUPOS = [
    G('NORMAL', '#7b7869', [
      ['Normal', 'a de cima cobre a de baixo. o ponto de partida.'],
      ['Dissolver', 'em vez de ficar translúcida, a camada perde pixels sorteados. opacidade vira granulação.']
    ]),
    G('ESCURECER', '#1b4fd8', [
      ['Escurecer', 'fica o mais escuro dos dois, canal a canal.'],
      ['Multiplicar', 'multiplica os dois. branco some, preto manda. é a sombra, a tinta, o carimbo.'],
      ['Subexpor cor', 'escurece o fundo aumentando o contraste. queima os meios-tons.'],
      ['Subexpor linear', 'escurece somando −1. mais duro e mais previsível que o anterior.'],
      ['Cor mais escura', 'compara o pixel INTEIRO e fica com o mais escuro. não mistura canais.']
    ]),
    G('CLAREAR', '#00e5ff', [
      ['Clarear', 'fica o mais claro dos dois, canal a canal.'],
      ['Tela', 'o inverso de multiplicar. preto some, branco manda. é a luz, a projeção, o vazamento.'],
      ['Superexpor cor', 'clareia o fundo aumentando o contraste. estoura os brilhos.'],
      ['Somar', 'soma pura. é a luz de verdade — fogo, faísca, brilho especular.'],
      ['Cor mais clara', 'compara o pixel INTEIRO e fica com o mais claro.']
    ]),
    G('CONTRASTE', '#7c5cff', [
      ['Sobrepor', 'multiplica o que é escuro e faz tela no que é claro. contraste sem perder cor.'],
      ['Luz suave', 'como sobrepor, mas com a mão leve. o mais elegante do grupo.'],
      ['Luz forte', 'o mesmo que sobrepor, mas quem decide é a camada de cima.'],
      ['Luz brilhante', 'subexpõe ou superexpõe conforme a camada de cima. muito agressivo.'],
      ['Luz linear', 'clareia ou escurece somando. queima rápido, ótimo para vazamento de luz.'],
      ['Luz pontual', 'troca pixels inteiros por limiar. faz manchas duras, bom para textura.'],
      ['Mistura dura', 'joga tudo para 0 ou 255. seis cores e nada mais. cartaz, serigrafia.']
    ]),
    G('COMPARAÇÃO', '#ff2fb0', [
      ['Diferença', 'a distância entre as duas. igual vira preto. é o modo do negativo e do glitch.'],
      ['Exclusão', 'como diferença, porém sem contraste nos meios-tons. mais suave.'],
      ['Subtrair', 'tira a de cima da de baixo. escurece rápido.'],
      ['Dividir', 'divide a de baixo pela de cima. clareia e estoura.']
    ]),
    G('COMPONENTE', '#e2670f', [
      ['Matiz', 'pega só a COR da camada de cima. o brilho e a saturação vêm de baixo.'],
      ['Saturação', 'pega só a intensidade de cor de cima.'],
      ['Cor', 'pega matiz e saturação de cima, luminosidade de baixo. é como se colore preto e branco.'],
      ['Luminosidade', 'pega só o brilho de cima. a cor toda vem de baixo.']
    ])
  ];

  /* lista plana — o índice é o valor gravado */
  VE.BLENDS = [];
  VE.BLEND_INFO = [];
  VE.BLEND_GRUPO_DE = [];
  VE.BLEND_GRUPOS.forEach(function (g, gi) {
    g.base = VE.BLENDS.length;
    g.modos.forEach(function (m) {
      VE.BLENDS.push(m[0]);
      VE.BLEND_INFO.push(m[1]);
      VE.BLEND_GRUPO_DE.push(gi);
    });
  });

  /* -------------------------------------------------------------- migração
     Antes existiam 21 modos numa ordem própria. Projetos salvos guardam
     aquele número. Este mapa traduz o número velho para o novo — sem ele,
     um projeto antigo abriria com o modo trocado.                        */
  var MIGRA = [0, 3, 8, 10, 19, 12, 2, 7, 21, 22, 9, 4, 14, 13, 20, 16, 23, 24, 25, 26, 17];
  VE.migraBlend = function (n) {
    n = n | 0;
    return (n >= 0 && n < MIGRA.length) ? MIGRA[n] : 0;
  };

  /* ============================================================== A CAMADA */

  /* Faixa de mescla — o "Blend If" do Photoshop.
     Quatro pontos por lado, em 0..1:
       lo0 → onde a camada começa a sumir no escuro
       lo1 → onde ela já está inteira
       hi0 → onde ela começa a sumir no claro
       hi1 → onde já sumiu
     Com lo0 = lo1 o corte é seco; afastando-os a transição fica macia. */
  VE.newBlendIf = function () {
    return {
      on: 0, ch: 0,                     /* 0 cinza · 1 vermelho · 2 verde · 3 azul */
      estaLo0: 0, estaLo1: 0, estaHi0: 1, estaHi1: 1,
      fundoLo0: 0, fundoLo1: 0, fundoHi0: 1, fundoHi1: 1
    };
  };

  /* Correção de cor da camada — tudo em GPU, tudo animável. */
  VE.newColorGrade = function () {
    return {
      on: 0,
      expo: 0, contraste: 0, gama: 1,
      sat: 0, vibr: 0, matiz: 0,
      temp: 0, tinte: 0,
      altas: 0, baixas: 0, brancos: 0, pretos: 0,
      entLo: 0, entHi: 1, saiLo: 0, saiHi: 1     /* níveis */
    };
  };

  /* Misturador de canais: cada saída é uma combinação das três entradas.
     A identidade é a matriz identidade — por isso rr/gg/bb começam em 1. */
  VE.newChannels = function () {
    return {
      on: 0,
      rr: 1, rg: 0, rb: 0, ro: 0,
      gr: 0, gg: 1, gb: 0, go: 0,
      br: 0, bg: 0, bb: 1, bo: 0,
      invR: 0, invG: 0, invB: 0,
      desl: 0, deslAng: 0                        /* deslocamento cromático */
    };
  };

  /* O bloco de composição inteiro de um clipe. */
  VE.newLayer = function () {
    return {
      fill: 1,                 /* preenchimento — ver nota longa abaixo */
      espaco: 0,               /* 0 perceptivo (sRGB) · 1 luz linear */
      desmult: 0,              /* fonte com alfa pré-multiplicado */
      matte: { de: '', modo: 0 },   /* modo 0 nenhum 1 alfa 2 alfa inv 3 luma 4 luma inv */
      blendIf: VE.newBlendIf(),
      cor: VE.newColorGrade(),
      canais: VE.newChannels()
    };
  };

  /* ------------------------------------------------------------- MÁSCARAS
     A máscara de EFEITO (uma por efeito, dentro do shader) continua onde
     estava. Estas são as máscaras DA CAMADA: várias, combináveis, e elas
     recortam a camada inteira depois de tudo o que ela sofreu.

     shape 0 retângulo · 1 elipse · 2 polígono · 3 faixa H · 4 faixa V
           5 rampa linear · 6 rampa radial · 7 CANETA (traçado livre)
     modo  0 somar · 1 subtrair · 2 intersectar · 3 diferença

     A CANETA é a única com forma variável: em vez de largura e altura, ela
     tem uma lista de PONTOS (`pts`), em coordenadas do quadro (0..1). Cada
     ponto é animável por keyframe pelo caminho `masks.<i>.pts.<j>.x` — é
     assim que o recorte acompanha um objeto que anda na cena.

     Nela `x`,`y` deslocam o traçado inteiro (partindo de 0,5 / 0,5),
     `ang` gira e `w` escala. `h` não é usada.                          */
  VE.MASK_SHAPES = ['RETÂNGULO', 'ELIPSE', 'POLÍGONO', 'FAIXA H', 'FAIXA V', 'RAMPA', 'RAMPA RADIAL', 'CANETA'];
  VE.MASK_MODOS = ['SOMAR', 'SUBTRAIR', 'INTERSECTAR', 'DIFERENÇA'];
  VE.MASK_CANETA = 7;
  VE.MASK_MAX_PTS = 48;        /* vértices por máscara */
  VE.MASK_POOL_PTS = 256;      /* pontos JÁ ACHATADOS, somados, na textura */
  VE.MASK_SEG = 12;            /* pedaços em que uma curva é picada */

  VE.newLayerMask = function (shape) {
    var m = {
      on: 1, shape: shape === undefined ? 1 : shape, modo: 0,
      x: 0.5, y: 0.5, w: 0.42, h: 0.42, ang: 0,
      feather: 0.12, expandir: 0, opacidade: 1, invert: 0,
      lados: 6, canto: 0
    };
    if (m.shape === VE.MASK_CANETA) {
      m.w = 1; m.h = 1; m.feather = 0.02;
      m.pts = [];              /* nasce VAZIA: a pessoa clica e desenha */
      m.aberta = 1;            /* 1 = ainda desenhando, sem fechar */
    }
    return m;
  };

  VE.ehCaneta = function (m) { return m && (m.shape | 0) === VE.MASK_CANETA; };

  /* ------------------------------------------------------ UM VÉRTICE
     Além do lugar, cada vértice carrega DUAS alças — a que puxa a curva
     que chega (`hi`) e a que puxa a curva que sai (`ho`), guardadas
     como deslocamento a partir do próprio ponto. Zero nas duas quer
     dizer canto vivo, e é assim que ele nasce.

     `canto` diz se as alças são independentes. Fora dele, mexer numa
     espelha a outra — que é o que mantém a curva lisa ao atravessar o
     vértice, e é o comportamento que se espera de uma caneta.       */
  VE.newMaskPt = function (x, y) {
    return { x: x, y: y, hix: 0, hiy: 0, hox: 0, hoy: 0, canto: 0 };
  };

  VE.ptTemCurva = function (p) {
    return !!(p && (Math.abs(p.hix) + Math.abs(p.hiy) + Math.abs(p.hox) + Math.abs(p.hoy)) > 1e-6);
  };

  /* ---------------------------------------------------- SUAVIZAR
     Dá alças a um traçado de cantos vivos, na tangente de Catmull-Rom:
     a alça de cada vértice aponta na direção da reta que liga o vizinho
     de trás ao vizinho da frente. É o "suavizar nó" de qualquer editor
     de curva, e é o que transforma o polígono em contorno de uma vez. */
  VE.maskSuavizar = function (m, tensao) {
    if (!VE.ehCaneta(m) || !m.pts || m.pts.length < 3) return false;
    var p = m.pts, n = p.length, k = (tensao === undefined ? 1 : tensao) / 6;
    var orig = p.map(function (q) { return { x: q.x, y: q.y }; });
    for (var i = 0; i < n; i++) {
      var a = orig[(i - 1 + n) % n], b = orig[i], c = orig[(i + 1) % n];
      var tx = (c.x - a.x) * k, ty = (c.y - a.y) * k;
      p[i].hox = tx; p[i].hoy = ty;
      p[i].hix = -tx; p[i].hiy = -ty;
      p[i].canto = 0;
    }
    return true;
  };

  VE.maskRetificar = function (m) {
    if (!VE.ehCaneta(m) || !m.pts) return false;
    m.pts.forEach(function (q) { q.hix = q.hiy = q.hox = q.hoy = 0; });
    return true;
  };

  /* ------------------------------------------------- ACHATAR A CURVA
     O shader mede distância a um POLÍGONO. Em vez de ensiná-lo Bézier
     — que é caro por pixel — a curva é picada em pedacinhos aqui, uma
     vez por quadro, e o que sobe é polígono. Trecho sem alça continua
     sendo um segmento só: quem faz reta não paga curva.

     A picagem é adaptativa pelo tamanho do trecho: um contorno pequeno
     na tela não gasta doze pedaços para nada.                       */
  VE.maskTesselar = function (pts, aspect, teto) {
    var n = pts.length;
    if (n < 3) return [];
    aspect = aspect || 1;
    teto = teto || VE.MASK_POOL_PTS;
    var out = [];
    for (var i = 0; i < n && out.length < teto; i++) {
      var a = pts[i], b = pts[(i + 1) % n];
      out.push(a.x, a.y);
      var reto = !VE.ptTemCurva(a) && !VE.ptTemCurva(b);
      if (reto) continue;
      var c1x = a.x + (a.hox || 0), c1y = a.y + (a.hoy || 0);
      var c2x = b.x + (b.hix || 0), c2y = b.y + (b.hiy || 0);
      /* comprimento aproximado pela poligonal de controle */
      var L = Math.hypot((c1x - a.x) * aspect, c1y - a.y) +
        Math.hypot((c2x - c1x) * aspect, c2y - c1y) +
        Math.hypot((b.x - c2x) * aspect, b.y - c2y);
      var seg = Math.max(2, Math.min(VE.MASK_SEG, Math.ceil(L * 26)));
      for (var s = 1; s < seg && out.length < teto; s++) {
        var t = s / seg, u = 1 - t;
        var w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
        out.push(w0 * a.x + w1 * c1x + w2 * c2x + w3 * b.x,
          w0 * a.y + w1 * c1y + w2 * c2y + w3 * b.y);
      }
    }
    return out;
  };

  /* --------- editar os pontos --------- */
  VE.maskPtAdd = function (m, x, y, onde) {
    if (!VE.ehCaneta(m)) return null;
    m.pts = m.pts || [];
    if (m.pts.length >= VE.MASK_MAX_PTS) return null;
    var p = VE.newMaskPt(x, y);
    if (onde == null || onde >= m.pts.length) m.pts.push(p);
    else m.pts.splice(onde, 0, p);
    return p;
  };

  /* Ponto velho, salvo antes das alças existirem, não tem os campos.
     Completa em silêncio em vez de espalhar `|| 0` pelo código todo. */
  VE.maskPtsOk = function (m) {
    if (!VE.ehCaneta(m) || !m.pts) return;
    m.pts.forEach(function (p) {
      if (p.hix === undefined) { p.hix = 0; p.hiy = 0; p.hox = 0; p.hoy = 0; p.canto = 0; }
    });
  };

  /* Apagar um ponto renumera os que vêm depois — e os keyframes ficariam
     apontando para o ponto errado, mudando o traçado sozinho no meio da
     animação. Por isso os keyframes andam junto.                      */
  VE.maskPtDel = function (clip, mi, j) {
    var m = (clip.masks || [])[mi];
    if (!VE.ehCaneta(m) || !m.pts || m.pts.length <= 3) return false;
    m.pts.splice(j, 1);
    var pre = 'masks.' + mi + '.pts.';
    var k = clip.keys || {}, novo = {};
    Object.keys(k).forEach(function (path) {
      if (path.indexOf(pre) !== 0) { novo[path] = k[path]; return; }
      var resto = path.slice(pre.length).split('.');
      var idx = +resto[0];
      if (idx === j) return;                       /* some com o ponto */
      if (idx > j) novo[pre + (idx - 1) + '.' + resto[1]] = k[path];
      else novo[path] = k[path];
    });
    clip.keys = novo;
    return true;
  };

  /* O ponto está DENTRO do traçado? Cruzamento de raio sobre o contorno
     já achatado — o mesmo que o shader mede, então a resposta bate com o
     recorte. É o que permite arrastar por dentro e mover tudo junto. */
  VE.maskContem = function (m, x, y, aspect) {
    if (!VE.ehCaneta(m) || !m.pts || m.pts.length < 3) return false;
    var pl = VE.maskTesselar(m.pts, aspect || 1);
    var n = pl.length >> 1, dentro = false;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = pl[i * 2], yi = pl[i * 2 + 1], xj = pl[j * 2], yj = pl[j * 2 + 1];
      if (((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi)) dentro = !dentro;
    }
    return dentro;
  };

  /* O ponto mais perto de um lado — é onde um clique acrescenta vértice.
     Devolve {i, d} com o índice em que o ponto novo deve entrar.      */
  VE.maskLadoPerto = function (m, x, y, aspect) {
    if (!VE.ehCaneta(m) || !m.pts || m.pts.length < 2) return null;
    aspect = aspect || 1;
    var melhor = null;
    for (var i = 0; i < m.pts.length; i++) {
      var a = m.pts[i], b = m.pts[(i + 1) % m.pts.length];
      var ex = (b.x - a.x) * aspect, ey = b.y - a.y;
      var wx = (x - a.x) * aspect, wy = y - a.y;
      var n2 = ex * ex + ey * ey;
      var t = n2 > 1e-9 ? Math.max(0, Math.min(1, (wx * ex + wy * ey) / n2)) : 0;
      var qx = wx - t * ex, qy = wy - t * ey;
      var d = Math.sqrt(qx * qx + qy * qy);
      if (!melhor || d < melhor.d) melhor = { i: i + 1, d: d, t: t };
    }
    return melhor;
  };

  VE.MATTE_MODOS = ['NENHUM', 'ALFA', 'ALFA INVERTIDO', 'LUMA', 'LUMA INVERTIDO'];
  VE.ESPACOS = ['PERCEPTIVO (sRGB)', 'LUZ LINEAR'];
  VE.BLENDIF_CANAIS = ['CINZA', 'VERMELHO', 'VERDE', 'AZUL'];

  /* ================================================== LEITURA E ESCRITA ====
     Os caminhos animáveis desta parte:
       layer.fill                      layer.cor.expo, layer.cor.gama, …
       layer.blendIf.estaLo0, …        layer.canais.rr, …
       masks.<i>.x, masks.<i>.feather, …
     `VE.readProp`/`writeProp` em state.js delegam para cá quando o caminho
     começa por `layer.` ou `masks.`.                                     */
  VE.layerRead = function (clip, path) {
    var b = path.split('.');
    if (b[0] === 'masks') {
      var m = (clip.masks || [])[+b[1]];
      if (!m) return 0;
      /* masks.<i>.pts.<j>.x — o vértice da caneta é propriedade animável
         como qualquer outra, e é isso que faz o recorte acompanhar. */
      if (b[2] === 'pts') {
        var pt = (m.pts || [])[+b[3]];
        return pt ? pt[b[4]] : 0;
      }
      return m[b[2]];
    }
    var L = clip.layer;
    if (!L) return 0;
    if (b.length === 2) return L[b[1]];
    var sub = L[b[1]];
    return sub ? sub[b[2]] : 0;
  };

  VE.layerWrite = function (clip, path, v) {
    var b = path.split('.');
    if (b[0] === 'masks') {
      var m = (clip.masks || [])[+b[1]];
      if (!m) return;
      if (b[2] === 'pts') {
        var pt = (m.pts || [])[+b[3]];
        if (pt) pt[b[4]] = v;
        return;
      }
      m[b[2]] = v;
      return;
    }
    if (!clip.layer) clip.layer = VE.newLayer();
    var L = clip.layer;
    if (b.length === 2) { L[b[1]] = v; return; }
    if (!L[b[1]]) return;
    L[b[1]][b[2]] = v;
  };

  /* garante que um clipe vindo de projeto antigo tenha o bloco novo */
  VE.ensureLayer = function (clip) {
    if (!clip) return null;
    if (!clip.layer) clip.layer = VE.newLayer();
    else {
      var L = clip.layer, d = VE.newLayer();
      /* completa campos que a versão anterior do arquivo não tinha */
      Object.keys(d).forEach(function (k) {
        if (L[k] === undefined) L[k] = d[k];
        else if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) {
          Object.keys(d[k]).forEach(function (k2) {
            if (L[k][k2] === undefined) L[k][k2] = d[k][k2];
          });
        }
      });
    }
    if (!clip.masks) clip.masks = [];
    return clip.layer;
  };

  /* =============================================== RESOLVER NUM INSTANTE ===
     Devolve os valores JÁ animados (keyframes + áudio reativo) de tudo o
     que a composição precisa, no tempo local do clipe. É o que o motor
     recebe — o motor nunca lê o clipe direto.

     Devolve `null` quando a camada está em estado neutro, e é esse `null`
     que faz o motor pular todas as etapas novas e correr como antes.    */
  function v(clip, path, lt, def) {
    var r = VE.valueAt(clip, path, lt);
    return (typeof r === 'number' && isFinite(r)) ? r : def;
  }

  var NEUTRA_COR = { expo: 0, contraste: 0, gama: 1, sat: 0, vibr: 0, matiz: 0, temp: 0, tinte: 0, altas: 0, baixas: 0, brancos: 0, pretos: 0, entLo: 0, entHi: 1, saiLo: 0, saiHi: 1 };
  var NEUTRA_CAN = { rr: 1, rg: 0, rb: 0, ro: 0, gr: 0, gg: 1, gb: 0, go: 0, br: 0, bg: 0, bb: 1, bo: 0, invR: 0, invG: 0, invB: 0, desl: 0, deslAng: 0 };

  function neutro(obj, ref) {
    for (var k in ref) if (Math.abs((obj[k] === undefined ? ref[k] : obj[k]) - ref[k]) > 1e-6) return false;
    return true;
  }

  VE.resolveLayer = function (clip, lt) {
    var L = clip.layer;
    if (!L) return null;
    var out = {
      fill: Math.max(0, Math.min(1, v(clip, 'layer.fill', lt, L.fill === undefined ? 1 : L.fill))),
      espaco: L.espaco | 0,
      desmult: L.desmult | 0,
      matte: null, blendIf: null, cor: null, canais: null, masks: null
    };

    /* --- matte --- */
    if (L.matte && (L.matte.modo | 0) > 0 && L.matte.de) {
      out.matte = { de: L.matte.de, modo: L.matte.modo | 0 };
    }

    /* --- faixa de mescla --- */
    var bi = L.blendIf;
    if (bi && bi.on) {
      out.blendIf = {
        ch: bi.ch | 0,
        esta: [v(clip, 'layer.blendIf.estaLo0', lt, bi.estaLo0), v(clip, 'layer.blendIf.estaLo1', lt, bi.estaLo1),
        v(clip, 'layer.blendIf.estaHi0', lt, bi.estaHi0), v(clip, 'layer.blendIf.estaHi1', lt, bi.estaHi1)],
        fundo: [v(clip, 'layer.blendIf.fundoLo0', lt, bi.fundoLo0), v(clip, 'layer.blendIf.fundoLo1', lt, bi.fundoLo1),
        v(clip, 'layer.blendIf.fundoHi0', lt, bi.fundoHi0), v(clip, 'layer.blendIf.fundoHi1', lt, bi.fundoHi1)]
      };
    }

    /* --- cor --- */
    if (L.cor && L.cor.on) {
      var c = {};
      Object.keys(NEUTRA_COR).forEach(function (k) { c[k] = v(clip, 'layer.cor.' + k, lt, L.cor[k]); });
      if (!neutro(c, NEUTRA_COR)) out.cor = c;
    }

    /* --- canais --- */
    if (L.canais && L.canais.on) {
      var q = {};
      Object.keys(NEUTRA_CAN).forEach(function (k) { q[k] = v(clip, 'layer.canais.' + k, lt, L.canais[k]); });
      if (!neutro(q, NEUTRA_CAN)) out.canais = q;
    }

    /* --- máscaras --- */
    var ms = (clip.masks || []).filter(function (m) { return m.on; });
    if (ms.length) {
      out.masks = ms.map(function (m) {
        var i = clip.masks.indexOf(m), pre = 'masks.' + i + '.';
        var o = {
          shape: m.shape | 0, modo: m.modo | 0, invert: m.invert ? 1 : 0,
          x: v(clip, pre + 'x', lt, m.x), y: v(clip, pre + 'y', lt, m.y),
          w: v(clip, pre + 'w', lt, m.w), h: v(clip, pre + 'h', lt, m.h),
          ang: v(clip, pre + 'ang', lt, m.ang),
          feather: v(clip, pre + 'feather', lt, m.feather),
          expandir: v(clip, pre + 'expandir', lt, m.expandir),
          opacidade: v(clip, pre + 'opacidade', lt, m.opacidade),
          lados: Math.max(3, Math.round(v(clip, pre + 'lados', lt, m.lados || 6))),
          canto: v(clip, pre + 'canto', lt, m.canto || 0)
        };
        /* CANETA: os vértices, já animados, viajam junto. Cada um passa
           por `valueAt`, então um ponto com keyframe anda e os outros
           ficam parados — que é como se rotoscopia de verdade.      */
        if (VE.ehCaneta(m)) {
          VE.maskPtsOk(m);
          /* As ALÇAS também passam por `valueAt`: sem isso, animar um
             traçado curvo moveria os vértices e deixaria as curvas para
             trás — o contorno se deformaria sozinho no meio da cena. */
          o.pts = (m.pts || []).slice(0, VE.MASK_MAX_PTS).map(function (p, j) {
            var q = pre + 'pts.' + j + '.';
            return {
              x: v(clip, q + 'x', lt, p.x), y: v(clip, q + 'y', lt, p.y),
              hix: v(clip, q + 'hix', lt, p.hix || 0), hiy: v(clip, q + 'hiy', lt, p.hiy || 0),
              hox: v(clip, q + 'hox', lt, p.hox || 0), hoy: v(clip, q + 'hoy', lt, p.hoy || 0)
            };
          });
          if (o.pts.length < 3) return null;       /* menos que isso não fecha */
        }
        return o;
      }).filter(Boolean).slice(0, 8);   /* o shader carrega oito; além disso é ilusão */
      if (!out.masks.length) out.masks = null;
    }

    /* neutro de verdade? então o motor nem olha para isto */
    if (out.fill > 0.999 && !out.espaco && !out.desmult && !out.matte &&
      !out.blendIf && !out.cor && !out.canais && !out.masks) return null;
    return out;
  };

  /* ============================================================ ASSINATURA
     Uma string curta que muda sempre que algo que afeta o desenho da
     camada muda. O motor guarda a textura pronta de camadas ESTÁTICAS
     (imagem ou tipografia, sem efeito que dependa do tempo) e só redesenha
     quando esta assinatura muda. É o cache de dependências: mexer na
     opacidade não refaz a cor, nem os efeitos, nem o recorte.          */
  VE.layerSig = function (op) {
    var s = [op.clipId, op.rect.x.toFixed(4), op.rect.y.toFixed(4),
    op.rect.w.toFixed(4), op.rect.h.toFixed(4), (op.angle || 0).toFixed(3),
    op.flipX ? 1 : 0, op.flipY ? 1 : 0];
    var cr = op.crop;
    if (cr) s.push(cr.x.toFixed(4), cr.y.toFixed(4), cr.w.toFixed(4), cr.h.toFixed(4));
    (op.effects || []).forEach(function (e) {
      s.push(e.id, e.amount);
      var d = VE.FXBY[e.id];
      if (d) d.params.forEach(function (pr) { s.push(e.params[pr.k]); });
      var m = e.mask;
      if (m) s.push(m.shape, m.x, m.y, m.w, m.h, m.ang, m.feather, m.invert ? 1 : 0);
    });
    var L = op.layer;
    if (L) {
      if (L.cor) s.push('C', JSON.stringify(L.cor));
      if (L.canais) s.push('K', JSON.stringify(L.canais));
      if (L.masks) s.push('M', JSON.stringify(L.masks));
      s.push(L.espaco, L.desmult);
    }
    return s.join('|');
  };

  /* Uma camada só pode ser guardada em cache se nada dentro dela anda
     sozinho: fonte parada, nenhum efeito que leia o tempo, o quadro
     anterior ou o áudio, e nenhum keyframe em nada. */
  VE.layerCacheavel = function (op, clip) {
    if (!op.estatico) return false;
    if (clip && clip.keys && Object.keys(clip.keys).length) return false;
    if (clip && clip.react && clip.react.length) return false;
    var fx = op.effects || [];
    for (var i = 0; i < fx.length; i++) {
      var d = VE.FXBY[fx[i].id];
      if (!d) return false;
      if (d.tempo) return false;                       /* declarou depender do tempo */
      var g = d.glsl || '';
      if (/uTime|uPrev|uH2|uH3|uH4|uAudio|uStab/.test(g)) return false;
    }
    return true;
  };

})(window.VE);
