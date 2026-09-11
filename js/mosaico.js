/* ============================================================
   rgb_lab — MOSAICO DE VÍDEOS
   ------------------------------------------------------------
   Uma grade de quadros, e um vídeo de verdade dentro de cada um.

   A tentação era fazer isto num shader: uma grade desenhada em GLSL
   sai em meia hora. Só que um mosaico de shader é um FILTRO — a
   grade come o clipe inteiro e nada dentro dela pode ser aparado,
   atrasado, mascarado ou receber efeito próprio. O que o Bruno
   pediu foi "inserir vídeos dentro desses mosaicos", no plural: o
   quadro 3 com um vídeo, o 7 com outro, o 11 vazio.

   Então cada célula aqui é um CLIPE. A grade é só geometria: ela
   calcula onde cada quadro cai e escreve isso no `motion` (posição
   e escala) e numa máscara de camada em caixa (o recorte exato da
   célula). Feito isso, a célula é um clipe como qualquer outro —
   entra na linha do tempo, aceita efeito, keyframe, transição e
   pode ser arrastada no tempo sem que a grade saiba.

   O que a grade guarda no clipe é uma etiqueta, `c.mosaico =
   {col, lin}`. É por ela que dá para mudar o número de colunas ou
   a borda DEPOIS de montado e ver tudo se reorganizar, em vez de
   ter que desmontar e montar de novo.

   Sobre pôr o MESMO arquivo em várias células em tempos diferentes:
   funciona, e não por acaso — `js/media.js` já clonava o elemento
   de vídeo por clipe (`elFor`). Cada célula ganha o seu decodificador.
   É também por isso que a janela avisa quando a conta passa de umas
   duas dúzias de células: aí são duas dúzias de vídeos tocando.
   ============================================================ */
(function (VE) {
  'use strict';

  var M = VE.mosaico = {};

  M.PADRAO = {
    cols: 4,
    linhas: 3,
    formato: 0,        /* 0 preencher a tela · 1 quadrado · 2 proporção livre */
    prop: 1,           /* largura ÷ altura da célula, só no formato LIVRE */
    borda: 0.012,      /* espessura da borda, em fração da LARGURA da tela */
    bordaFora: true,   /* a moldura em volta da grade inteira */
    ajuste: 0,         /* 0 preencher a célula (corta) · 1 caber inteiro · 2 esticar */
    defasagem: 0,      /* segundos que cada célula anda no tempo da fonte */
    ordemDefasagem: 0  /* 0 leitura (esq→dir) · 1 colunas · 2 sorteada */
  };

  M.cfg = null;

  M.novaCfg = function () {
    var o = {};
    Object.keys(M.PADRAO).forEach(function (k) { o[k] = M.PADRAO[k]; });
    return o;
  };

  /* ============================================================ GRADE ====
     Devolve uma célula por quadro, já em fração de tela: `cx`/`cy` são o
     centro contado a partir do canto SUPERIOR esquerdo, `w` é fração da
     largura e `h` fração da altura.

     A borda é escrita em fração da LARGURA e convertida para a vertical
     multiplicando pela proporção da tela. Sem isso, uma borda de 1% num
     quadro 16:9 sai com 19px na horizontal e 11px na vertical — o olho
     lê na hora que a moldura está torta.                                */
  M.grade = function (cfg, aspecto) {
    cfg = cfg || M.cfg || M.novaCfg();
    var asp = aspecto || M.aspecto();
    var C = Math.max(1, Math.round(cfg.cols));
    var L = Math.max(1, Math.round(cfg.linhas));
    var b = Math.max(0, cfg.borda);
    var bv = b * asp;                       /* a mesma borda, em fração da ALTURA */
    var fora = cfg.bordaFora ? 1 : 0;

    var cw = (1 - b * (C - 1 + 2 * fora)) / C;
    var ch;
    if (cfg.formato === 1)      ch = cw * asp;                    /* quadrado de verdade */
    else if (cfg.formato === 2) ch = cw * asp / Math.max(0.05, cfg.prop);
    else                        ch = (1 - bv * (L - 1 + 2 * fora)) / L;

    cw = Math.max(0.002, cw);
    ch = Math.max(0.002, ch);

    /* nos formatos de proporção fixa a grade pode não encher a tela na
       vertical — ou passar dela. Centralizada nos dois casos: sobrando,
       fica uma tarja em cima e embaixo; faltando, corta igual dos dois
       lados, que é o que se espera de uma grade centrada.               */
    var altura = L * ch + bv * (L - 1 + 2 * fora);
    var y0 = (1 - altura) / 2 + bv * fora;
    var x0 = b * fora;

    var cels = [];
    for (var j = 0; j < L; j++) {
      for (var i = 0; i < C; i++) {
        cels.push({
          col: i, lin: j, i: j * C + i,
          cx: x0 + i * (cw + b) + cw / 2,
          cy: y0 + j * (ch + bv) + ch / 2,
          w: cw, h: ch
        });
      }
    }
    return cels;
  };

  M.aspecto = function () {
    var p = VE.project && VE.project.canvas;
    if (!p || !p.h) return 16 / 9;
    return p.w / p.h;
  };

  /* ordem em que as células recebem a defasagem de tempo */
  function ordemDe(cels, cfg, C) {
    var idx = cels.map(function (c, k) { return k; });
    if (cfg.ordemDefasagem === 1) {
      idx.sort(function (a, b2) {
        var A = cels[a], B = cels[b2];
        return (A.col - B.col) || (A.lin - B.lin);
      });
    } else if (cfg.ordemDefasagem === 2) {
      /* sorteio ESTÁVEL: a mesma grade dá sempre a mesma bagunça, senão
         mexer na borda reembaralharia o tempo de todo mundo             */
      idx.sort(function (a, b2) {
        return hash(cels[a].i * 7 + C) - hash(cels[b2].i * 7 + C);
      });
    }
    var pos = {};
    idx.forEach(function (k, n) { pos[k] = n; });
    return pos;
  }
  function hash(n) {
    var x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  /* ================================================ APLICAR NUM CLIPE ====
     Põe UM clipe dentro de UMA célula. Não cria nada e não mexe no tempo:
     é só geometria, e por isso serve tanto para montar quanto para
     reorganizar um mosaico que já existe.                               */
  M.encaixar = function (clip, cel, cfg, asp) {
    cfg = cfg || M.cfg || M.novaCfg();
    asp = asp || M.aspecto();
    var s = VE.sources[clip.src];
    var sa = (s && s.w && s.h) ? (s.w / s.h) : asp;

    clip.mosaico = { col: cel.col, lin: cel.lin };

    /* `esticar` é o único ajuste em que a fonte se deforma; nele o clipe
       ocupa a célula na marra. Nos outros dois, a proporção é mantida e o
       que muda é se sobra fora (corta) ou dentro (cabe).                */
    if (cfg.ajuste === 2) {
      clip.fit = 'stretch';
      clip.motion.sx = cel.w;
      clip.motion.sy = cel.h;
    } else {
      /* base do `contain`: o maior retângulo com a proporção da fonte que
         cabe na TELA. Daqui se calcula o fator que o leva até a célula. */
      clip.fit = 'contain';
      var bw = (sa > asp) ? 1 : (sa / asp);       /* fração da largura da tela */
      var bh = (sa > asp) ? (asp / sa) : 1;       /* fração da altura  da tela */
      var kx = cel.w / bw, ky = cel.h / bh;
      var k = cfg.ajuste === 0 ? Math.max(kx, ky) : Math.min(kx, ky);
      clip.motion.sx = k;
      clip.motion.sy = k;
    }
    clip.motion.scale = 1;
    clip.motion.x = cel.cx - 0.5;
    clip.motion.y = 0.5 - cel.cy;
    clip.motion.ax = 0; clip.motion.ay = 0;

    /* O RECORTE. Sem ele, o ajuste "preencher" derrama a sobra em cima da
       célula vizinha e a grade vira uma pilha de retângulos sobrepostos.
       A máscara em caixa é o que garante que cada quadro termina onde o
       quadro acaba — e o que abre a borda, porque fora dela não fica
       imagem nenhuma: fica o que estiver na camada de baixo.            */
    var mk = (clip.masks || []).filter(function (m) { return m.__mosaico; })[0];
    if (!mk) {
      mk = VE.newLayerMask(0);
      mk.__mosaico = 1;
      clip.masks = clip.masks || [];
      clip.masks.push(mk);
    }
    mk.shape = 0; mk.on = 1; mk.modo = 0; mk.invert = 0;
    mk.feather = 0; mk.expandir = 0; mk.opacidade = 1; mk.ang = 0;
    mk.x = cel.cx;
    mk.y = 1 - cel.cy;                    /* a máscara conta o y de baixo para cima */
    mk.w = cel.w;
    mk.h = cel.h;
    return clip;
  };

  /* ================================================== MONTAR A GRADE ====
     `celulas` é um vetor do tamanho de colunas×linhas, com o id da fonte
     de cada quadro (ou nada, para quadro vazio). Devolve os clipes
     criados. Quadro vazio não vira clipe nenhum — a grade não existe como
     objeto, ela é só a soma dos quadros cheios.                        */
  M.montar = function (cfg, celulas, opt) {
    if (!VE.project) return [];
    opt = opt || {};
    cfg = cfg || M.cfg || M.novaCfg();
    var asp = M.aspecto();
    var cels = M.grade(cfg, asp);
    var C = Math.max(1, Math.round(cfg.cols));
    var pos = ordemDe(cels, cfg, C);
    var total = VE.duration();
    var feitos = [];

    cels.forEach(function (cel, k) {
      var srcId = celulas && celulas[k];
      if (!srcId || !VE.sources[srcId]) return;
      var s = VE.sources[srcId];
      var dur = s.duration ? Math.min(s.duration, total || VE.MAXDUR) : (total || 10);
      var atraso = cfg.defasagem * (pos[k] || 0);
      /* a defasagem dá a volta na fonte: passar do fim e cair no preto
         seria a metade do mosaico apagada, que não é o que se pede quando
         se pede "cada quadro num momento diferente"                     */
      var entrada = s.duration ? (atraso % Math.max(0.04, s.duration)) : 0;

      var c = VE.newClipObj({
        kind: s.kind === 'image' ? 'image' : (s.kind === 'audio' ? 'audio' : 'video'),
        name: 'M' + (cel.lin + 1) + 'x' + (cel.col + 1) + ' ' + (s.name || ''),
        src: srcId,
        start: 0,
        dur: Math.max(0.2, Math.min(dur, total || dur)),
        in: entrada,
        srcDur: s.duration || 0,
        fit: 'contain'
      });
      c.muted = !!opt.mudo;
      M.encaixar(c, cel, cfg, asp);
      VE.insertClip(c);
      feitos.push(c);
    });
    M.cfg = cfg;
    return feitos;
  };

  /* ================================================ REORGANIZAR ========
     Mudar colunas, borda ou formato DEPOIS de montado. Os clipes que já
     têm etiqueta são reencaixados na grade nova; os que sobram (a grade
     encolheu) ficam de fora e são devolvidos, para a janela decidir se
     apaga ou deixa. Decidir aqui seria apagar trabalho sem perguntar. */
  M.clipes = function () {
    if (!VE.project) return [];
    return VE.allClips().filter(function (c) { return c.mosaico; });
  };

  M.reorganizar = function (cfg) {
    cfg = cfg || M.cfg || M.novaCfg();
    var asp = M.aspecto();
    var cels = M.grade(cfg, asp);
    var C = Math.max(1, Math.round(cfg.cols));
    var L = Math.max(1, Math.round(cfg.linhas));
    var porIndice = {};
    cels.forEach(function (cel) { porIndice[cel.lin * C + cel.col] = cel; });

    var sobrando = [];
    M.clipes().forEach(function (c) {
      var col = c.mosaico.col, lin = c.mosaico.lin;
      if (col >= C || lin >= L) { sobrando.push(c); return; }
      M.encaixar(c, porIndice[lin * C + col], cfg, asp);
    });
    M.cfg = cfg;
    return sobrando;
  };

  /* tira a célula da grade: some a etiqueta, some o recorte, e o clipe
     volta a ser um clipe comum ocupando a tela inteira                 */
  M.soltar = function (clip) {
    if (!clip) return;
    delete clip.mosaico;
    if (clip.masks) clip.masks = clip.masks.filter(function (m) { return !m.__mosaico; });
    clip.motion.x = 0; clip.motion.y = 0;
    clip.motion.sx = 1; clip.motion.sy = 1; clip.motion.scale = 1;
    clip.fit = 'contain';
  };

})(window.VE);
