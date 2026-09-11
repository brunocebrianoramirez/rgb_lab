/* ============================================================
   rgb_lab — O POLAROID · motor
   ------------------------------------------------------------
   Mesma divisão de mesa/mesaui e mosaico/mosaicoui: aqui não há
   uma linha de DOM. Este arquivo sabe revelar uma foto; quem
   desenha a câmera é `polaroidui.js`.

   O QUE É UM POLAROID, PARA EFEITO DE CÓDIGO
   Três coisas empilhadas, e nenhuma delas é um filtro CSS:

     1. a MOLDURA é um escaneamento de papel de verdade. Não é um
        retângulo branco desenhado: é uma folha com trama, sujeira
        e um leve amarelado que muda de canto para canto. Por isso
        as molduras moram em assets/polaroid/molduras e vêm com a
        JANELA medida — o retângulo da emulsão dentro da folha.

     2. o FILME é uma curva por canal, não uma dominante. O que faz
        um polaroid parecer polaroid é o PRETO LEVANTADO: o canal
        azul começa em 0,42 em vez de 0, e é isso que dá o cinza
        leitoso no lugar da sombra. Medido nos originais do Bruno:
        `original-01` tem preto em r106 g133 b180 — o azul três
        vezes mais alto que o vermelho.

     3. o PAPEL VOLTA POR CIMA. A foto não é colada sobre a folha,
        ela é revelada DENTRO dela: depois de compor a imagem, o
        recorte da janela é redesenhado em multiply e screen fracos,
        e a trama do papel reaparece através da emulsão. É a
        diferença entre uma foto com borda branca e um polaroid.

   AMOSTRAR
   `amostrar()` lê um original e devolve um filme com a assinatura
   dele. A conta é direta, e é a razão de a pasta de originais ser
   importante: com out = lift + (1-lift)·in^gama·ganho, basta ler
   três percentis por canal (1%, 50%, 99%) para achar os três
   números. Preto do original vira lift, branco vira ganho, e o
   meio resolve o gama. Nada de "parece com" — é a curva medida.
   ============================================================ */
(function (VE) {
  'use strict';

  var P = VE.polaroid = {};

  var BASE = 'assets/polaroid/';
  var LARG_PADRAO = 1000, ALT_PADRAO = 1232;   /* a folha escaneada */

  /* ==================================================================
     1. OS FILMES
     Cada filme é a curva, não um nome bonito. `lift` é onde o preto
     começa, `ganho` onde o branco termina, `gama` a barriga da curva.
     Os quatro últimos números são o que acontece DEPOIS da curva.  */
  P.FILMES = [
    { id: '600', nome: '600', nota: 'o de todo mundo — quente, contraste médio, preto que nunca fecha',
      lift: [.055, .048, .062], ganho: [1.00, .985, .945], gama: [.96, 1.00, 1.05],
      sat: 1.05, temp: .18, halo: .18, vinheta: .22, grao: .30, vaz: 0, mono: 0 },

    { id: 'sx70', nome: 'SX-70', nota: 'macio, sombra puxando para o magenta, branco sem estourar',
      lift: [.085, .060, .090], ganho: [.965, .955, .960], gama: [1.02, 1.06, 1.00],
      sat: .92, temp: .06, halo: .26, vinheta: .28, grao: .26, vaz: .10, mono: 0 },

    { id: 'timezero', nome: 'TIME-ZERO', nota: 'esmaecido e quente, como quem guardou a foto na gaveta',
      lift: [.125, .105, .075], ganho: [.955, .920, .845], gama: [.92, .98, 1.10],
      sat: .82, temp: .42, halo: .22, vinheta: .34, grao: .38, vaz: .16, mono: 0 },

    { id: '779', nome: '779', nota: 'frio, azulado, o mais limpo da caixa',
      lift: [.040, .055, .105], ganho: [.930, .965, 1.00], gama: [1.06, 1.00, .93],
      sat: 1.00, temp: -.30, halo: .14, vinheta: .20, grao: .24, vaz: 0, mono: 0 },

    { id: '669', nome: '669', nota: 'peel-apart: contraste alto, preto quase fechado',
      lift: [.020, .018, .028], ganho: [1.02, 1.00, .975], gama: [.82, .84, .86],
      sat: 1.12, temp: .10, halo: .10, vinheta: .16, grao: .34, vaz: 0, mono: 0 },

    { id: 'pb', nome: 'P&B', nota: 'preto e branco de verdade, com o creme do papel por baixo',
      lift: [.070, .066, .060], ganho: [.975, .970, .955], gama: [.94, .94, .96],
      sat: 0, temp: .14, halo: .18, vinheta: .30, grao: .46, vaz: 0, mono: 1 },

    { id: 'expirado', nome: 'EXPIRADO', nota: 'pacote fora da validade: dominante ciano e vazamento pela borda',
      lift: [.090, .180, .210], ganho: [.905, .960, 1.00], gama: [1.10, .98, .90],
      sat: .78, temp: -.22, halo: .30, vinheta: .40, grao: .52, vaz: .62, mono: 0 },

    { id: 'estourado', nome: 'ESTOURADO', nota: 'luz demais no disparo — o branco come a foto pelas bordas',
      lift: [.300, .330, .390], ganho: [1.00, 1.00, 1.00], gama: [.70, .70, .66],
      sat: .70, temp: .04, halo: .58, vinheta: 0, grao: .22, vaz: .24, mono: 0 }
  ];

  /* Molduras desenhadas, para quando a pasta ainda está vazia ou o
     site foi aberto sem servidor. Não competem com o escaneamento —
     existem para o laboratório nunca abrir sem papel nenhum.       */
  P.MOLDURAS_INTERNAS = [
    { id: 'branco', nome: 'PAPEL BRANCO', desenhada: 1, tom: '#f4f3ef', emulsao: '#e9e6dc',
      nota: 'desenhada aqui dentro — serve enquanto a pasta de molduras não tem escaneamento',
      janela: { x: .0546, y: .0543, w: .8891, h: .7414 } },
    { id: 'velho', nome: 'PAPEL ENVELHECIDO', desenhada: 1, tom: '#e8e1cd', emulsao: '#ddd3b8',
      nota: 'a mesma folha amarelada pelo tempo',
      janela: { x: .0546, y: .0543, w: .8891, h: .7414 } }
  ];

  P.molduras = P.MOLDURAS_INTERNAS.slice();   /* cresce quando a pasta carrega */
  P.originais = [];                            /* os escaneamentos do Bruno */

  P.filme = function (id) {
    for (var i = 0; i < P.FILMES.length; i++) if (P.FILMES[i].id === id) return P.FILMES[i];
    return P.FILMES[0];
  };
  P.moldura = function (id) {
    for (var i = 0; i < P.molduras.length; i++) if (P.molduras[i].id === id) return P.molduras[i];
    return P.molduras[0];
  };

  /* ==================================================================
     2. A CONFIGURAÇÃO
     Os cinco primeiros ajustes são 0..200 com 100 no meio — a mesma
     escala da referência, porque é a que o Bruno já conhece.       */
  P.novaCfg = function () {
    return {
      filme: '600',
      moldura: 'papel',
      /* ajustes, 100 = não mexi em nada */
      temperatura: 100, brilho: 100, contraste: 100, vintage: 100, saturacao: 100,
      /* os que a referência não tem e o polaroid pede */
      grao: 100, vinheta: 100, halo: 100, vazamento: 100, desfoque: 0,
      /* enquadramento dentro da janela */
      formato: 'quadrado',      /* quadrado | retrato | paisagem | wide */
      zoom: 1, dx: 0, dy: 0, giro: 0, tortoOffset: 0,
      /* legenda escrita na tarja de baixo */
      legenda: '', legFonte: 'mao', legCor: '#1f1c17', legTam: 100, legAlinha: 'centro',
      /* o disparo */
      flash: 0, exposicao: 0     /* exposicao -1..+1, a roda do olho elétrico */
    };
  };

  /* ==================================================================
     3. CARREGAR AS PASTAS
     A pasta manda. Se o servidor local responder, a lista vem dele e
     basta jogar arquivo lá dentro; sem servidor, cai no manifesto.  */
  var cacheImg = {};
  function carregarImagem(url) {
    if (cacheImg[url]) return cacheImg[url];
    cacheImg[url] = new Promise(function (ok, erro) {
      var i = new Image();
      i.onload = function () { ok(i); };
      i.onerror = function () { erro(new Error('não achei ' + url)); };
      i.src = url;
    });
    return cacheImg[url];
  }
  P.carregarImagem = carregarImagem;

  function pegarJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status); return r.json();
    });
  }

  /* Mede a janela de um escaneamento que veio sem ela: o papel de fora
     tem uma cor, a emulsão tem outra. Procura-se a MAIOR corrida
     contígua de colunas (e linhas) que destoam do papel — pegar a
     primeira e a última acendia a textura solta das pontas e devolvia
     a folha inteira.                                               */
  P.medirJanela = function (img) {
    var m = Math.min(1, 560 / Math.max(img.naturalWidth, img.naturalHeight));
    var c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(img.naturalWidth * m));
    c.height = Math.max(2, Math.round(img.naturalHeight * m));
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, c.width, c.height);
    var d = x.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
    var amostra = [[], [], []], i, j;
    for (i = 0; i < W; i += 3) for (j = 1; j < Math.max(3, H * .012); j++) {
      var k = (j * W + i) * 4;
      amostra[0].push(d[k]); amostra[1].push(d[k + 1]); amostra[2].push(d[k + 2]);
    }
    var pap = amostra.map(function (v) { v.sort(function (a, b) { return a - b; }); return v[v.length >> 1]; });
    var col = new Array(W).fill(0), lin = new Array(H).fill(0);
    for (j = 0; j < H; j++) for (i = 0; i < W; i++) {
      var p = (j * W + i) * 4;
      if (Math.abs(d[p] - pap[0]) + Math.abs(d[p + 1] - pap[1]) + Math.abs(d[p + 2] - pap[2]) > 30) { col[i]++; lin[j]++; }
    }
    function corrida(perf, tot) {
      var lim = tot * .5, mA = -1, mB = -2, a = -1;
      for (var i = 0; i < perf.length; i++) {
        if (perf[i] > lim) { if (a < 0) a = i; if (i - a > mB - mA) { mA = a; mB = i; } }
        else a = -1;
      }
      return [mA, mB];
    }
    var fx = corrida(col, H), fy = corrida(lin, W);
    if (fx[0] < 0 || fy[0] < 0) return { x: .0546, y: .0543, w: .8891, h: .7414 };
    return { x: fx[0] / W, y: fy[0] / H, w: (fx[1] - fx[0] + 1) / W, h: (fy[1] - fy[0] + 1) / H };
  };

  /* Uma leitura só das pastas por aba, e todo o resto ESPERA por ela.
     Sem isto havia uma janela de meio segundo em que `P.molduras` só
     tinha as folhas desenhadas: pedir 'creme' nesse instante devolvia
     silenciosamente a desenhada (o `P.moldura` cai no primeiro item
     quando não acha), e quem exportasse ali levava uma folha lisa, sem
     trama nenhuma, sem nada avisar. */
  var pastas = null;

  P.carregarPastas = function () {
    if (pastas) return pastas;
    var tarefas = [];

    /* MOLDURAS — o manifesto manda, porque a janela é medida e vale
       mais que qualquer varredura automática. Só o que a pasta tem a
       mais é que entra por listagem.                               */
    tarefas.push(
      pegarJSON(BASE + 'molduras/molduras.json').then(function (j) {
        var vindas = (j.molduras || []).map(function (m) {
          return { id: m.id, nome: m.nome, nota: m.nota || '', arquivo: BASE + 'molduras/' + m.arquivo,
                   janela: m.janela || null, papel: m.papel || '#e9e7e0',
                   realce: m.realce === undefined ? 1 : m.realce };
        });
        return fetch('api/polaroid/molduras', { cache: 'no-cache' })
          .then(function (r) { return r.ok ? r.json() : { arquivos: [] }; })
          .catch(function () { return { arquivos: [] }; })
          .then(function (lista) {
            (lista.arquivos || []).forEach(function (nome) {
              var jaTem = vindas.some(function (v) { return v.arquivo.indexOf('/' + nome) >= 0; });
              if (jaTem) return;
              vindas.push({ id: 'p_' + nome.replace(/\W+/g, '_'), nome: nome.replace(/\.[a-z0-9]+$/i, '').toUpperCase(),
                            nota: 'escaneamento da pasta — janela medida na hora',
                            arquivo: BASE + 'molduras/' + nome, janela: null, papel: '#e9e7e0' });
            });
            P.molduras = vindas.concat(P.MOLDURAS_INTERNAS);
          });
      }).catch(function () { /* sem manifesto: fica só com as desenhadas */ })
    );

    /* ORIGINAIS — aqui é a listagem que manda: a promessa feita ao
       Bruno é "jogo as fotos na pasta e aparecem".                 */
    tarefas.push(
      fetch('api/polaroid/filmes', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('sem api'); return r.json(); })
        .then(function (l) {
          P.originais = (l.arquivos || []).map(function (n) {
            return { arquivo: BASE + 'filmes/' + n, nome: n.replace(/\.[a-z0-9]+$/i, '').toUpperCase() };
          });
        })
        .catch(function () {
          return pegarJSON(BASE + 'filmes/filmes.json').then(function (j) {
            P.originais = (j.originais || []).map(function (o) {
              return { arquivo: BASE + 'filmes/' + o.arquivo, nome: o.nome || o.arquivo };
            });
          }).catch(function () { P.originais = []; });
        })
    );

    pastas = Promise.all(tarefas);
    return pastas;
  };

  /* Carrega a folha de uma moldura e, se ela veio sem janela medida,
     mede AGORA e guarda no descritor — a medição custa um passe de
     560px e acontece uma vez por moldura, na vida inteira da aba.

     Espera as pastas de propósito: pedir uma moldura antes de saber
     quais existem é como pedir um livro antes de a estante chegar. */
  P.carregarMoldura = function (id) {
    return P.carregarPastas().then(function () {
      var m = P.moldura(id);
      if (!m || !m.arquivo) return { desc: m, img: null };
      return carregarImagem(m.arquivo).then(function (img) {
        if (!m.janela) m.janela = P.medirJanela(img);
        return { desc: m, img: img };
      }).catch(function () { return { desc: m, img: null }; });
    });
  };

  /* ==================================================================
     3b. A TRAMA DO PAPEL
     Medida por autocorrelação no próprio escaneamento, na faixa branca:

       amplitude do que restou  desvio padrão 2,35   ← quase nada

     A autocorrelação também deu um período, 23 × 13,5 px, e esse número
     estava ERRADO: num sinal cuja amplitude é 2,35 o que ela mede é
     sobretudo o bloco do JPEG, não a trama. O período bom — 10 × 7,5 px
     em 1000 px de largura — veio de casar o desenho, lado a lado, com
     um recorte limpo do papel que o Bruno mandou. Medir um sinal que
     já não existe devolve o ruído dele com cara de resposta.

     Esses 2,35 são a chave da história. A trama ESTAVA no papel, mas a
     compressão do JPEG comeu quase tudo, e o que sobrou já não é trama:
     é bloco de compressão. A primeira tentativa aqui foi uma máscara de
     nitidez em cima disso — e ela fez o que era de esperar, AMPLIOU O
     DEFEITO. Vista a 1:1, dava mancha quadriculada, não papel; e foi
     por isso que o Bruno continuou dizendo, com razão, que não havia
     textura nenhuma.

     Então a trama é RECONSTRUÍDA, com a geometria que foi medida no
     papel dele. O escaneamento continua mandando em tudo o resto — a
     cor, o amarelado que muda de canto para canto, as manchas, a linha
     da emulsão, as bordas. Só volta o que a compressão apagou.

     O relevo é gravado como relevo de verdade: um campo de altura em
     losango, iluminado de cima à esquerda. Cada losango ganha um lado
     claro e um lado escuro, que é o que faz o olho ler PAPEL e não
     desenho. Uma ondulação lenta desalinha a grade o suficiente para
     não parecer estampa de impressora, e um fio de grão fino por cima
     dá a fibra.                                                     */
  var TRAMA = {
    px: 23, py: 13,     /* período do losango, em 1000 px de largura */
    alt: 9.5,           /* profundidade do relevo, em níveis de 255 */
    /* A LUZ TEM DE SER DE LADO, e isso não é gosto: com h = cos u + cos v,
       a inclinação decompõe-se exatamente nas duas famílias de onda,
       pesadas por (lx+ly) e (lx-ly). Numa luz diagonal (-,62 -,78) isso
       dá 1,40 contra 0,16 — uma família nove vezes mais forte que a
       outra, e o que se vê são LISTRAS, não losangos. Só com lx·ly = 0
       as duas pesam igual e a trama cruza. */
    luz: [-1, 0],
    harm: .60,          /* 2.ª harmónica: fecha o losango em vez de ondular */
    fibra: 2.1          /* o grão fino da fibra do papel */
  };
  /* Uma tabela de seno em vez de Math.sin: o relevo pede seis senos por
     pixel, e numa folha de 1000×1232 isso são sete milhões e meio de
     chamadas — 925 ms medidos. Com a tabela de 4096 entradas cai para
     um índice e uma leitura, e a diferença não se vê num relevo. */
  var SENO = null;
  function tabSeno() {
    if (SENO) return SENO;
    SENO = new Float32Array(4096);
    for (var i = 0; i < 4096; i++) SENO[i] = Math.sin(i * Math.PI * 2 / 4096);
    return SENO;
  }
  P.TRAMA = TRAMA;                       /* exposto para afinação */
  var cacheRealce = { chave: null, cv: null };
  P.limparCacheTrama = function () { cacheRealce.chave = null; cacheRealce.cv = null; };

  P.realce = function (mold, img, W, H) {
    var chave = (mold && mold.id) + ':' + W + 'x' + H;
    if (cacheRealce.chave === chave) return cacheRealce.cv;

    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var c = cv.getContext('2d', { willReadFrequently: true });
    c.imageSmoothingQuality = 'high';
    c.drawImage(img, 0, 0, W, H);

    /* A FOLHA QUE JÁ TEM TRAMA NÃO LEVA MAIS NADA.
       O `papel.png` que o Bruno pôs na pasta traz o relevo do papel
       intacto — é PNG, não passou por compressão que o comesse.
       Nesse caso o melhor tratamento é NENHUM: desenha-se o
       escaneamento e acabou. A reconstrução fica reservada às folhas em
       JPEG, onde ela existe porque não sobrou outra coisa. */
    if (mold && mold.realce === 0) {
      cacheRealce.chave = chave; cacheRealce.cv = cv;
      return cv;
    }

    var im = c.getImageData(0, 0, W, H), d = im.data;
    /* os períodos acompanham o tamanho de saída, para a trama ter o
       mesmo tamanho aparente na prévia e no arquivo salvo */
    var e = W / 1000;
    var kx = 2 * Math.PI / (TRAMA.px * e), ky = 2 * Math.PI / (TRAMA.py * e);
    var lx = TRAMA.luz[0], ly = TRAMA.luz[1], amp = TRAMA.alt / 2;
    var T = tabSeno(), ESC = 4096 / (Math.PI * 2), h2 = TRAMA.harm * 2;
    function sen(t) { return T[((t * ESC) | 0) & 4095]; }
    var x, y, i = 0;

    for (y = 0; y < H; y++) {
      for (x = 0; x < W; x++, i += 4) {
        /* a grade não é perfeita: duas ondas lentas e incomensuráveis
           entortam-na de leve, como entorta um tecido de verdade */
        var wob = .34 * sen(x * .0131 + y * .0074) +
                  .22 * sen(x * .0053 - y * .0169);
        var u = x * kx + y * ky + wob;
        var v = x * kx - y * ky - wob * .8;

        /* campo de altura h = cos u + cos v; o que se pinta é a
           inclinação dele contra a luz, que é o que dá relevo */
        var su = sen(u), sv = sen(v);
        /* a 2.ª harmónica aperta o vale entre os losangos: sem ela o
           relevo é uma ondulação mole, com ela lê-se a célula */
        var gu = su + h2 * sen(2 * u);
        var gv = sv + h2 * sen(2 * v);
        var gx = -(gu + gv), gy = -(gu - gv);
        var s = (gx * lx + gy * ly) * amp;

        /* a fibra: ruído fino determinista, para o cache continuar
           valendo e a folha não mudar de cara a cada redesenho */
        var n = ((x * 374761393 + y * 668265263) ^ 0x5bf03635) >>> 0;
        n = ((n ^ (n >>> 13)) * 1274126177) >>> 0;
        s += ((n & 255) / 255 - .5) * TRAMA.fibra;

        d[i] += s; d[i + 1] += s; d[i + 2] += s;
      }
    }
    c.putImageData(im, 0, 0);

    cacheRealce.chave = chave; cacheRealce.cv = cv;
    return cv;
  };

  /* ==================================================================
     4. AMOSTRAR UM ORIGINAL
     Três percentis por canal viram os três números da curva. É a conta
     invertida de `curva()`, e é por isso que ela fecha: o filme
     amostrado, aplicado a uma rampa, devolve o preto, o meio e o
     branco do original.                                            */
  P.amostrar = function (img, nome) {
    var m = Math.min(1, 360 / Math.max(img.naturalWidth, img.naturalHeight));
    var c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(img.naturalWidth * m));
    c.height = Math.max(2, Math.round(img.naturalHeight * m));
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, c.width, c.height);
    var d = x.getImageData(0, 0, c.width, c.height).data, n = c.width * c.height;

    var hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
    for (var i = 0; i < n; i++) { hist[0][d[i * 4]]++; hist[1][d[i * 4 + 1]]++; hist[2][d[i * 4 + 2]]++; }
    function pct(h, p) {
      var alvo = p * n, ac = 0;
      for (var v = 0; v < 256; v++) { ac += h[v]; if (ac >= alvo) return v; }
      return 255;
    }
    var lift = [], ganho = [], gama = [];
    for (var ch = 0; ch < 3; ch++) {
      var p1 = pct(hist[ch], .01) / 255, p50 = pct(hist[ch], .5) / 255, p99 = pct(hist[ch], .99) / 255;
      var L = Math.min(.72, Math.max(0, p1));
      var G = Math.max(.35, Math.min(1.35, (p99 - L) / Math.max(.02, 1 - L)));
      var meio = (p50 - L) / Math.max(.02, (1 - L) * G);
      meio = Math.min(.97, Math.max(.03, meio));
      lift.push(L); ganho.push(G); gama.push(Math.log(meio) / Math.log(.5));
    }
    /* saturação e temperatura vêm da MESMA leitura: se o canal azul
       tem o preto mais alto que o vermelho, a foto é fria — não é
       preciso um segundo passe para descobrir isso.               */
    var frio = (lift[2] - lift[0]);
    return {
      id: 'amostra_' + Date.now(), nome: (nome || 'AMOSTRA').toUpperCase(), amostrado: 1,
      nota: 'assinatura lida de ' + (nome || 'um original') + ' — preto ' +
            Math.round(lift[0] * 255) + '/' + Math.round(lift[1] * 255) + '/' + Math.round(lift[2] * 255),
      lift: lift, ganho: ganho, gama: gama,
      sat: .95, temp: -frio * 1.6, halo: Math.min(.6, Math.max(0, (lift[0] + lift[1] + lift[2]) / 3 * 1.5)),
      vinheta: .22, grao: .30, vaz: .12, mono: 0
    };
  };

  /* ==================================================================
     5. A CURVA
     Uma tabela de 256 por canal, montada uma vez por desenho. O laço
     de pixel não faz conta nenhuma além de ler a tabela e cruzar os
     canais para a saturação — que é a única coisa que a tabela não
     pode fazer sozinha, porque depende dos três ao mesmo tempo.    */
  function esc(v) { return (v - 100) / 100; }   /* 0..200 → -1..+1 */

  function montarLUT(f, cfg) {
    var lut = [new Uint8ClampedArray(256), new Uint8ClampedArray(256), new Uint8ClampedArray(256)];
    var bri = esc(cfg.brilho) * .42;
    var con = 1 + esc(cfg.contraste) * .55;
    var vin = Math.max(0, esc(cfg.vintage));      /* abaixo de 100 tira o desbotado do filme */
    var vinNeg = Math.min(0, esc(cfg.vintage));
    var tmp = esc(cfg.temperatura) * .5 + f.temp * .5;
    var expo = (cfg.exposicao || 0) * .30 + (cfg.flash ? .16 : 0);

    for (var ch = 0; ch < 3; ch++) {
      /* o vintage LEVANTA o preto e fecha o branco: é desbotar papel,
         não baixar contraste — foi assim que o esmaecido das
         referências apareceu sem virar cinza chapado */
      var L = Math.min(.72, f.lift[ch] * (1 + vin * 1.5) + vin * .10 + vinNeg * f.lift[ch] * .9);
      var G = f.ganho[ch] * (1 - vin * .10);
      var g = f.gama[ch];
      /* temperatura: vermelho sobe e azul desce, o verde quase parado */
      var k = ch === 0 ? 1 : (ch === 1 ? .18 : -1);
      var mult = 1 + tmp * .16 * k;

      for (var i = 0; i < 256; i++) {
        var v = i / 255;
        v = Math.pow(v, g) * G;
        v = L + (1 - L) * v;
        v = (v - .5) * con + .5;               /* contraste em torno do meio */
        v = v * mult + bri + expo;
        lut[ch][i] = v * 255;
      }
    }
    return lut;
  }

  /* ==================================================================
     6. DESENHAR
     `alvo` é um canvas já do tamanho da folha. `foto` é qualquer
     coisa que o canvas saiba desenhar (Image, canvas, vídeo).
     `molduraImg` pode ser null: aí a folha é desenhada.            */
  P.desenhar = function (alvo, cfg, foto, molduraImg) {
    var ctx = alvo.getContext('2d');
    var W = alvo.width, H = alvo.height;
    var mold = P.moldura(cfg.moldura);
    var jan = mold.janela || { x: .0546, y: .0543, w: .8891, h: .7414 };

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* --- a folha, com a trama realçada ---------------------------- */
    var folha = molduraImg ? P.realce(mold, molduraImg, W, H) : null;
    if (folha) ctx.drawImage(folha, 0, 0);
    else desenharFolha(ctx, W, H, mold, jan);

    var jx = Math.round(jan.x * W), jy = Math.round(jan.y * H),
        jw = Math.round(jan.w * W), jh = Math.round(jan.h * H);

    /* --- a área da emulsão, conforme o formato escolhido ---------- */
    var prop = { quadrado: jw / jh, retrato: 4 / 5, paisagem: 5 / 4, wide: 16 / 9 }[cfg.formato] || (jw / jh);
    var ew = jw, eh = jh;
    if (prop > jw / jh) eh = Math.round(jw / prop); else ew = Math.round(jh * prop);
    var ex = jx + ((jw - ew) >> 1), ey = jy + ((jh - eh) >> 1);

    if (foto && ew > 1 && eh > 1) {
      var em = revelar(cfg, foto, ew, eh);
      ctx.drawImage(em, ex, ey);

      /* --- o papel VOLTA por cima ------------------------------------
         Sem isto a foto fica colada na folha; com isto ela é revelada
         dentro dela. Dois passes fracos: multiply escurece onde a
         trama do papel é sombra, screen clareia onde é brilho.     */
      if (folha) {
        /* a folha realçada já está no tamanho de saída, então o recorte
           é o MESMO retângulo — não há conversão de escala para errar */
        ctx.save();
        ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .19;
        ctx.drawImage(folha, ex, ey, ew, eh, ex, ey, ew, eh);
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .12;
        ctx.drawImage(folha, ex, ey, ew, eh, ex, ey, ew, eh);
        ctx.restore();
      }

      /* a emulsão não encosta na borda: tem uma sombra fina de um lado
         e uma linha clara do outro, que é o rebaixo do papel */
      ctx.save();
      ctx.globalAlpha = .3; ctx.lineWidth = Math.max(1, W / 500);
      ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.strokeRect(ex + .5, ey + .5, ew - 1, eh - 1);
      ctx.restore();
    }

    /* --- a legenda, na tarja de baixo ---------------------------- */
    if (cfg.legenda) escreverLegenda(ctx, cfg, W, H, jy + jh);

    ctx.restore();
    return alvo;
  };

  /* A folha desenhada — só entra em cena quando não há escaneamento.
     A trama é ruído fino em duas frequências, porque uma só vira
     chuvisco de televisão e não papel.                            */
  function desenharFolha(ctx, W, H, mold, jan) {
    ctx.fillStyle = mold.tom || '#f4f3ef';
    ctx.fillRect(0, 0, W, H);
    var n = Math.max(1, Math.round(W * H / 900));
    ctx.save();
    for (var i = 0; i < n; i++) {
      var x = Math.random() * W, y = Math.random() * H, a = Math.random();
      ctx.fillStyle = a > .5 ? 'rgba(0,0,0,.030)' : 'rgba(255,255,255,.055)';
      ctx.fillRect(x, y, 1 + (a > .82 ? 1 : 0), 1);
    }
    ctx.restore();
    var jx = jan.x * W, jy = jan.y * H, jw = jan.w * W, jh = jan.h * H;
    var g = ctx.createLinearGradient(0, jy, 0, jy + jh);
    g.addColorStop(0, mold.emulsao || '#e9e6dc');
    g.addColorStop(1, 'rgba(0,0,0,.06)');
    ctx.fillStyle = mold.emulsao || '#e9e6dc';
    ctx.fillRect(jx, jy, jw, jh);
    ctx.fillStyle = g; ctx.globalAlpha = .5; ctx.fillRect(jx, jy, jw, jh); ctx.globalAlpha = 1;
  }

  /* ==================================================================
     7. REVELAR — a foto virando emulsão
     Devolve um canvas de ew×eh já com filme, grão, vinheta e halo.  */
  function revelar(cfg, foto, ew, eh) {
    var f = cfg.filmeAmostrado || P.filme(cfg.filme);
    var cv = document.createElement('canvas');
    cv.width = ew; cv.height = eh;
    var c = cv.getContext('2d', { willReadFrequently: true });

    /* --- enquadrar: cobre a área, depois zoom, deslocamento e giro - */
    var fw = foto.naturalWidth || foto.videoWidth || foto.width;
    var fh = foto.naturalHeight || foto.videoHeight || foto.height;
    if (!fw || !fh) return cv;
    var giro = ((cfg.giro % 360) + 360) % 360;
    var trocado = (giro === 90 || giro === 270);
    var lw = trocado ? fh : fw, lh = trocado ? fw : fh;
    var esc0 = Math.max(ew / lw, eh / lh) * (cfg.zoom || 1);

    c.save();
    c.translate(ew / 2 + (cfg.dx || 0) * ew, eh / 2 + (cfg.dy || 0) * eh);
    c.rotate(giro * Math.PI / 180);
    c.imageSmoothingQuality = 'high';
    c.drawImage(foto, -fw * esc0 / 2, -fh * esc0 / 2, fw * esc0, fh * esc0);
    c.restore();

    /* --- desfoque: o polaroid nunca foi lente boa ----------------- */
    if (cfg.desfoque > 0) {
      var b = document.createElement('canvas'); b.width = ew; b.height = eh;
      var bc = b.getContext('2d');
      bc.filter = 'blur(' + (cfg.desfoque / 100 * ew / 90).toFixed(2) + 'px)';
      bc.drawImage(cv, 0, 0);
      c.clearRect(0, 0, ew, eh); c.drawImage(b, 0, 0);
    }

    /* --- a curva, pixel a pixel ---------------------------------- */
    var img = c.getImageData(0, 0, ew, eh), d = img.data;
    var lut = montarLUT(f, cfg);
    var sat = f.sat * (cfg.saturacao / 100);
    var mono = f.mono;
    var n = ew * eh, i, r, g2, b2, y;
    for (i = 0; i < n; i++) {
      var k = i * 4;
      r = lut[0][d[k]]; g2 = lut[1][d[k + 1]]; b2 = lut[2][d[k + 2]];
      if (mono || sat !== 1) {
        y = .2126 * r + .7152 * g2 + .0722 * b2;
        if (mono) { r = y; g2 = y; b2 = y; }
        if (sat !== 1) { r = y + (r - y) * sat; g2 = y + (g2 - y) * sat; b2 = y + (b2 - y) * sat; }
      }
      d[k] = r; d[k + 1] = g2; d[k + 2] = b2;
    }
    c.putImageData(img, 0, 0);

    /* --- halo: a luz sangra do branco para os lados --------------- */
    var halo = f.halo * (cfg.halo / 100);
    if (halo > .01) {
      var h = document.createElement('canvas'); h.width = ew; h.height = eh;
      var hc = h.getContext('2d');
      hc.filter = 'blur(' + Math.max(2, ew / 40).toFixed(1) + 'px) brightness(1.5) contrast(2.4)';
      hc.drawImage(cv, 0, 0);
      c.save();
      c.globalCompositeOperation = 'screen';
      c.globalAlpha = Math.min(.7, halo * .55);
      c.drawImage(h, 0, 0);
      c.restore();
    }

    /* --- vinheta: o canto do quadro sempre morre um pouco --------- */
    var vinh = f.vinheta * (cfg.vinheta / 100);
    if (vinh > .01) {
      var vg = c.createRadialGradient(ew / 2, eh / 2, Math.min(ew, eh) * .30,
                                      ew / 2, eh / 2, Math.max(ew, eh) * .78);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(24,18,32,' + Math.min(.75, vinh * .85).toFixed(3) + ')');
      c.fillStyle = vg; c.fillRect(0, 0, ew, eh);
    }

    /* --- vazamento: entra por UMA borda, como entra na vida real -- */
    var vaz = f.vaz * (cfg.vazamento / 100);
    if (vaz > .01) {
      var lg = c.createLinearGradient(ew, 0, ew * .45, eh * .35);
      lg.addColorStop(0, 'rgba(255,196,120,' + Math.min(.8, vaz * .75).toFixed(3) + ')');
      lg.addColorStop(.45, 'rgba(255,120,90,' + (vaz * .22).toFixed(3) + ')');
      lg.addColorStop(1, 'rgba(255,120,90,0)');
      c.save(); c.globalCompositeOperation = 'screen';
      c.fillStyle = lg; c.fillRect(0, 0, ew, eh); c.restore();
    }

    /* --- o flash bate no meto e estoura ao redor ------------------ */
    if (cfg.flash) {
      var fg = c.createRadialGradient(ew / 2, eh * .42, 0, ew / 2, eh * .42, Math.max(ew, eh) * .62);
      fg.addColorStop(0, 'rgba(255,252,242,.30)');
      fg.addColorStop(.55, 'rgba(255,250,238,.10)');
      fg.addColorStop(1, 'rgba(255,250,238,0)');
      c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = fg;
      c.fillRect(0, 0, ew, eh); c.restore();
    }

    /* --- grão: por último, senão o desfoque come ------------------ */
    var grao = f.grao * (cfg.grao / 100);
    if (grao > .01) {
      var gi = c.getImageData(0, 0, ew, eh), gd = gi.data, amp = grao * 26;
      for (i = 0; i < n; i++) {
        var ru = (Math.random() - .5) * amp;
        var kk = i * 4;
        gd[kk] += ru; gd[kk + 1] += ru; gd[kk + 2] += ru;
      }
      c.putImageData(gi, 0, 0);
    }
    return cv;
  }

  /* ==================================================================
     8. A LEGENDA
     Escrita na tarja de baixo, que é a razão de a tarja existir.   */
  var FONTES = {
    mao: '"Segoe Script","Bradley Hand","Brush Script MT",cursive',
    sans: 'Archivo, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace'
  };
  function escreverLegenda(ctx, cfg, W, H, fimJanela) {
    var tarja = H - fimJanela;
    var tam = (tarja * .30) * (cfg.legTam / 100);
    ctx.save();
    ctx.font = (cfg.legFonte === 'mao' ? '' : '500 ') + tam.toFixed(1) + 'px ' + (FONTES[cfg.legFonte] || FONTES.mao);
    ctx.fillStyle = cfg.legCor || '#1f1c17';
    ctx.textBaseline = 'middle';
    ctx.textAlign = cfg.legAlinha === 'esq' ? 'left' : (cfg.legAlinha === 'dir' ? 'right' : 'center');
    var margem = W * .10;
    var x = cfg.legAlinha === 'esq' ? margem : (cfg.legAlinha === 'dir' ? W - margem : W / 2);
    var linhas = String(cfg.legenda).split('\n').slice(0, 3);
    var alt = tam * 1.18;
    var y0 = fimJanela + tarja / 2 - (linhas.length - 1) * alt / 2;
    /* a tinta de caneta não é opaca: some um pouco no papel */
    ctx.globalAlpha = .92;
    for (var i = 0; i < linhas.length; i++) ctx.fillText(linhas[i], x, y0 + i * alt);
    ctx.restore();
  }

  /* ==================================================================
     9. SAÍDAS
     O mesmo caminho do FRAME da câmera e do filme da mesa: uma imagem
     em VE.sources, que a linha do tempo já sabe usar.              */
  P.tamanho = function (molduraImg) {
    if (molduraImg && molduraImg.naturalWidth) {
      return { w: molduraImg.naturalWidth, h: molduraImg.naturalHeight };
    }
    return { w: LARG_PADRAO, h: ALT_PADRAO };
  };

  P.render = function (cfg, foto, molduraImg, escala) {
    var t = P.tamanho(molduraImg);
    var e = escala || 1;
    var cv = document.createElement('canvas');
    cv.width = Math.max(2, Math.round(t.w * e));
    cv.height = Math.max(2, Math.round(t.h * e));
    return P.desenhar(cv, cfg, foto, molduraImg);
  };

  P.paraFonte = function (cv, nome) {
    return VE.media.register({
      kind: 'image', name: nome || ('POLAROID ' + new Date().toLocaleTimeString('pt-BR')),
      el: cv, w: cv.width, h: cv.height, duration: 0
    });
  };

  P.baixar = function (cv, nome) {
    cv.toBlob(function (b) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = (nome || 'rgb_lab-polaroid-' + Date.now()) + '.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, 'image/png');
  };

})(window.VE);
