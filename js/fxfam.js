/* ============================================================
   rgb_lab — AS OITO FAMÍLIAS
   ------------------------------------------------------------
   O catálogo cresceu demais para viver em seis categorias soltas
   (cor · luz · distorção · glitch · ascii · tempo). A partir daqui
   o laboratório é dividido em OITO FAMÍLIAS, e cada família é uma
   maneira diferente de tratar a imagem:

     01 COR / MATÉRIA        o que a cor É, e o que sobra quando ela vai
     02 TEMPO                o quadro como janela sobre vários instantes
     03 ESPAÇO / DISTORÇÃO   a imagem como superfície deformável
     04 GLITCH               mecanismos de falha, digitais e analógicos
     05 PIXEL / DIGITAL      a imagem como grade de valores discretos
     06 PINTURA / MATÉRIA    comportamentos de pigmento e de impressão
     07 PERCEPÇÃO            ver o que o olho não vê: borda, calor, relevo
     08 INSTRUMENTOS         não são filtros: são máquinas de videoarte

   Este arquivo carrega DEPOIS de todos os fx*.js. Ele não mexe em
   nenhum shader — só reetiqueta os efeitos antigos para as famílias
   novas e dá a cada família a sua cor. Efeito novo já nasce com a
   família certa no próprio `cat`.
   ============================================================ */
(function (VE) {
  'use strict';

  /* `label` é o que cabe no chip da coluna, que é estreito.
     `nome` é o nome inteiro da família, usado na dica e na documentação. */
  var FAM = [
    { id: 'todos', label: 'todos', nome: 'todos os efeitos', note: 'as oito famílias juntas' },
    { id: 'cor', label: '01 COR', nome: 'cor / matéria', color: '#ffb020', note: 'película, halação, canais, cor seletiva, memória de cor, estrelas de luz, colorizar' },
    { id: 'tempo', label: '02 TEMPO', nome: 'tempo', color: '#00e5ff', note: 'eco, acúmulo, borrão entre quadros, deslocamento temporal, estabilizador' },
    { id: 'espaco', label: '03 ESPAÇO', nome: 'espaço / distorção', color: '#7c5cff', note: 'polar, esfera, túnel, dobra, Möbius, líquido, turbulência, lente' },
    { id: 'glitch', label: '04 GLITCH', nome: 'glitch', color: '#ff2e63', note: 'cubik, compressão, macrobloco, fita, trilha, rasgo, perda de sinal' },
    { id: 'pixel', label: '05 PIXEL', nome: 'pixel / digital', color: '#2ee6a8', note: 'mosaico, bits, ordenação de pixels, ascii, celular' },
    { id: 'pintura', label: '06 PINTURA', nome: 'pintura / materialidade', color: '#e2670f', note: 'aquarela, nanquim, carvão, lápis, guache, riso, serigrafia' },
    { id: 'percepcao', label: '07 PERCEPÇÃO', nome: 'realidade / percepção', color: '#c9d400', note: 'borda, relevo, térmico, raio-x, falsa cor, profundidade' },
    { id: 'instrumento', label: '08 MÁQUINAS', nome: 'instrumentos de videoarte', color: '#16150f', note: 'realimentação, erosão, campo de movimento, pintura por fluxo, imagem textual' }
  ];

  VE.CATS = FAM;
  VE.FAMS = FAM.filter(function (f) { return f.id !== 'todos'; });
  VE.FAMBY = {};
  FAM.forEach(function (f) { VE.FAMBY[f.id] = f; });

  /* ------------------------------------------------------------------
     Reetiquetagem dos efeitos que existiam antes das famílias.
     Só o que precisa mudar de casa aparece aqui; o resto cai na regra
     de conversão dos nomes antigos, logo abaixo.
     ------------------------------------------------------------------ */
  var MOVE = {
    /* ---- 01 COR / MATÉRIA ---- */
    color: 'cor', hue: 'cor', duotone: 'cor', gradmap: 'cor', invert: 'cor',
    grade: 'cor', colourpop: 'cor', colourpopstyle: 'cor', cinemaverde: 'cor',
    bloom: 'cor', halation: 'cor', vignette: 'cor', glowstreak: 'cor',
    film: 'cor', super8: 'cor', filmgate: 'cor', lightleak: 'cor', filmflash: 'cor',
    filmgrain: 'cor', dustscratch: 'cor', gateweave: 'cor', filmstock: 'cor',
    p8mm: 'cor', psuper8: 'cor', p16mm: 'cor', p35mm: 'cor', pprojecao: 'cor',
    pchassi: 'cor', labgrade: 'cor', noir: 'cor', mono: 'cor', neonglow: 'cor',
    negativoazul: 'cor', cyanotype: 'cor', cianotipia: 'cor', cianoverde: 'cor',
    cianoroxo: 'cor', azulimpresso: 'cor', vapor: 'cor', cyber: 'cor', sonho: 'cor',
    sonhoblur: 'cor', palette: 'cor', grittyduo: 'cor', flash: 'cor', rave: 'cor',

    /* ---- 02 TEMPO ---- */
    echo: 'tempo', motionblur: 'tempo', smoke: 'tempo', fumaca: 'tempo',
    shake: 'tempo', smudge: 'tempo',

    /* ---- 03 ESPAÇO ---- */
    wave: 'espaco', twirl: 'espaco', fisheye: 'espaco', kaleido: 'espaco',
    caleido: 'espaco', noisedisp: 'espaco', mirror: 'espaco', slice: 'espaco',
    zoomblur: 'espaco', blur: 'espaco', gauss: 'espaco',

    /* ---- 04 GLITCH ---- */
    glitch: 'glitch', datamosh: 'glitch', mosh: 'glitch', vhs: 'glitch',
    vhs94: 'glitch', crt: 'glitch', tv80: 'glitch', tv80s: 'glitch',
    glitchcore: 'glitch', rgbsplit: 'glitch', scanlines: 'glitch',

    /* ---- 05 PIXEL / DIGITAL ---- */
    pixelate: 'pixel', dither: 'pixel', bitmap: 'pixel', pixelsort: 'pixel',
    gameboy: 'pixel', gameboy2: 'pixel', retropixel: 'pixel', lego: 'pixel',
    toybrick: 'pixel', dotmatrix: 'pixel', matricial: 'pixel', blob: 'pixel',
    ascii: 'pixel', terminal: 'pixel', matrix: 'pixel', asciialpha: 'pixel',
    emoji: 'pixel', emojifoto: 'pixel', emojirecorte: 'pixel',

    /* ---- vidro e radiografia (fx11) ---- */
    vidro: 'espaco', vidrochanfro: 'espaco', raioxglow: 'percepcao', tiras: 'tempo',

    /* ---- 06 PINTURA / MATERIALIDADE ---- */
    halftone: 'pintura', stipple: 'pintura', paperink: 'pintura', papel: 'pintura',
    engrave: 'pintura', gravura: 'pintura', xerox: 'pintura', fotocopia: 'pintura',
    scannervelho: 'pintura', kuwahara: 'pintura', oleo: 'pintura', popart: 'pintura',
    posterflat: 'pintura', posterize: 'pintura',

    /* ---- 07 PERCEPÇÃO ---- */
    edge: 'percepcao', contour: 'percepcao', topografia: 'percepcao',
    threshold: 'percepcao', thermal: 'percepcao', termico: 'percepcao',
    nightvision: 'percepcao', noturno: 'percepcao', noturnoverde: 'percepcao',
    raiox: 'percepcao', sharpen: 'percepcao',

    /* ---- 08 INSTRUMENTOS ---- */
    flowfield: 'instrumento', fluxo: 'instrumento',

    /* ---- alpha: continua onde faz sentido ---- */
    removewhite: 'instrumento', alphaboard: 'instrumento'
  };

  /* nomes antigos → família, para o que não estiver na lista acima */
  var LEGACY = {
    cor: 'cor', luz: 'cor', distorcao: 'espaco', glitch: 'glitch',
    ascii: 'pixel', tempo: 'tempo', alpha: 'instrumento'
  };

  VE.FX.forEach(function (f) {
    var novo = MOVE[f.id] || LEGACY[f.cat] || f.cat;
    if (!VE.FAMBY[novo]) novo = 'cor';
    f.fam0 = f.cat;              /* guarda a categoria antiga, para migração */
    f.cat = novo;
    /* a cor do item no catálogo passa a ser a da família — assim a lista
       inteira lê como um sistema, e não como 70 cores diferentes         */
    f.famColor = VE.FAMBY[novo].color;
  });

  /* quantos efeitos em cada família — usado na ficha e no catálogo */
  VE.famCount = function (id) {
    return VE.FX.filter(function (f) { return f.cat === id; }).length;
  };

  /* migração de projeto: um efeito salvo guarda só o id, então nada
     quebra. Esta função existe para quem tiver salvo uma BUSCA por
     categoria antiga em preset.                                       */
  VE.famDeLegado = function (antigo) { return LEGACY[antigo] || antigo; };

})(window.VE);
