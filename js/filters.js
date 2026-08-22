/* ============================================================
   rgb_lab — GALERIA DE FILTROS
   ------------------------------------------------------------
   Uma prateleira de emulsões. Cada filtro é um conjunto de valores
   do efeito `filmstock` — nenhum deles copia curva de produto
   nenhum: são construídos aqui, com nome e código de arquivo.

   A galeria mostra MINIATURAS AO VIVO: o quadro que está no cursor,
   passado por cada filtro num renderizador pequeno e separado, para
   não atrapalhar a prévia principal.
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var F = VE.filters = {};

  /* base: o que não for declarado num filtro vem daqui */
  var BASE = {
    exp: 0, con: 0.12, sat: 0, temp: 0, tintg: 0, fade: 0.05, crush: 0,
    roll: 0.35, shTint: '#16283a', hiTint: '#ffe7c9', split: 0.3, skin: 0.4,
    grain: 0.04, vig: 0.2, sharp: 0.15
  };

  function f(id, name, fam, o) {
    var p = {};
    Object.keys(BASE).forEach(function (k) { p[k] = BASE[k]; });
    Object.keys(o).forEach(function (k) { p[k] = o[k]; });
    return { id: id, name: name, fam: fam, params: p };
  }

  /* ---------------------------------------------------------- CADEIA -----
     Um filtro pode ser uma CADEIA de efeitos, e não só um jogo de valores
     do `filmstock`. É o que permite reconstruir processos de laboratório
     que dependem de matriz de canais, curva por canal ou separação de cor
     — bicromia, tricromia, branqueamento, revelação trocada.
     `steps` é uma lista de { fx, p }: o id do efeito e o que muda nele.  */
  function c(id, name, desc, steps) {
    var fam = (id.charAt(0) === 'o') ? 'ÓPTICA' : 'PROCESSO';
    return {
      id: id, name: name, fam: fam, kind: 'chain', desc: desc,
      steps: steps.map(function (s) {
        var p = VE.defaults(s.fx);
        Object.keys(s.p || {}).forEach(function (k) { p[k] = s.p[k]; });
        return { fx: s.fx, params: p };
      })
    };
  }

  /* ------------------------------------------------------------- catálogo */
  var LIST = [
    /* ---- NEUTROS: mexem pouco, servem de ponto de partida ---- */
    f('n01', 'PAPEL', 'NEUTRO', { con: 0.06, sat: -0.05, fade: 0.09, split: 0.18, hiTint: '#fff2df', shTint: '#2a2a26', vig: 0.14 }),
    f('n02', 'FICHA', 'NEUTRO', { con: 0.2, sat: -0.12, fade: 0.03, split: 0.12, shTint: '#1d2126', hiTint: '#f6f2e8', sharp: 0.3 }),
    f('n03', 'CLARO', 'NEUTRO', { exp: 0.22, con: 0.02, sat: 0.05, fade: 0.12, roll: 0.55, vig: 0.06, split: 0.2, hiTint: '#fff6ea' }),
    f('n04', 'ESCURO', 'NEUTRO', { exp: -0.25, con: 0.28, crush: 0.06, fade: 0.02, vig: 0.4, split: 0.28, shTint: '#111318' }),
    f('n05', 'PLANO', 'NEUTRO', { con: -0.18, sat: -0.18, fade: 0.16, roll: 0.7, split: 0.1, vig: 0.05, grain: 0.02 }),
    f('n06', 'DURO', 'NEUTRO', { con: 0.55, sat: 0.1, crush: 0.1, fade: 0, roll: 0.15, sharp: 0.4, vig: 0.28 }),

    /* ---- FRIOS ---- */
    f('c01', 'CHUMBO', 'FRIO', { temp: -0.3, sat: -0.25, con: 0.22, fade: 0.08, split: 0.42, shTint: '#18242e', hiTint: '#e8eef2' }),
    f('c02', 'ÁGUA', 'FRIO', { temp: -0.42, tintg: 0.12, sat: 0.05, con: 0.1, fade: 0.12, split: 0.5, shTint: '#0f2a33', hiTint: '#dff0f2' }),
    f('c03', 'NOITE', 'FRIO', { exp: -0.4, temp: -0.5, con: 0.34, crush: 0.12, split: 0.6, shTint: '#0b1a2c', hiTint: '#b9cfe4', vig: 0.55, grain: 0.07 }),
    f('c04', 'VIDRO', 'FRIO', { temp: -0.2, tintg: -0.18, sat: -0.3, con: 0.05, fade: 0.18, roll: 0.6, split: 0.35, shTint: '#232a34', hiTint: '#f0eef6' }),
    f('c05', 'NEVE', 'FRIO', { exp: 0.3, temp: -0.22, sat: -0.35, con: -0.05, fade: 0.2, roll: 0.75, vig: 0.04, split: 0.24, hiTint: '#f4f9ff' }),
    f('c06', 'AÇO', 'FRIO', { temp: -0.35, tintg: 0.2, sat: -0.4, con: 0.38, crush: 0.08, split: 0.3, shTint: '#1a2426', hiTint: '#dde6e6', sharp: 0.35 }),

    /* ---- QUENTES ---- */
    f('q01', 'TARDE', 'QUENTE', { temp: 0.32, sat: 0.12, con: 0.1, fade: 0.1, split: 0.45, shTint: '#2a1c14', hiTint: '#ffe2b4', vig: 0.24 }),
    f('q02', 'FERRUGEM', 'QUENTE', { temp: 0.45, tintg: -0.12, sat: -0.1, con: 0.26, fade: 0.06, split: 0.55, shTint: '#2b1a12', hiTint: '#ffd39a', grain: 0.07 }),
    f('q03', 'MEL', 'QUENTE', { exp: 0.18, temp: 0.4, sat: 0.2, con: 0.04, fade: 0.14, roll: 0.62, split: 0.4, shTint: '#332314', hiTint: '#fff0c8', vig: 0.12 }),
    f('q04', 'DESERTO', 'QUENTE', { temp: 0.28, tintg: 0.16, sat: -0.18, con: 0.22, fade: 0.11, split: 0.42, shTint: '#2e2a1a', hiTint: '#fff4d6', vig: 0.3 }),
    f('q05', 'BRASA', 'QUENTE', { exp: -0.15, temp: 0.55, sat: 0.28, con: 0.38, crush: 0.08, split: 0.62, shTint: '#3a1408', hiTint: '#ffcb84', vig: 0.45, grain: 0.06 }),
    f('q06', 'PELE', 'QUENTE', { temp: 0.18, sat: 0.08, con: 0.08, fade: 0.09, skin: 0.9, split: 0.3, shTint: '#2a2019', hiTint: '#ffeedb', sharp: 0.1 }),

    /* ---- CRUZADOS: sombra e luz puxando para lados opostos ---- */
    f('x01', 'CRUZADO A', 'CRUZADO', { temp: -0.1, sat: 0.18, con: 0.24, fade: 0.14, split: 0.75, shTint: '#0e2f36', hiTint: '#ffd9a6' }),
    f('x02', 'CRUZADO B', 'CRUZADO', { temp: 0.12, sat: 0.1, con: 0.18, fade: 0.16, split: 0.8, shTint: '#2a1233', hiTint: '#d9f2c8' }),
    f('x03', 'REVELAÇÃO', 'CRUZADO', { exp: 0.1, sat: -0.05, con: 0.32, fade: 0.22, crush: 0.02, split: 0.9, shTint: '#123021', hiTint: '#ffe0d0', grain: 0.08 }),
    f('x04', 'VENCIDO', 'CRUZADO', { temp: 0.2, tintg: 0.3, sat: -0.22, con: -0.08, fade: 0.26, roll: 0.7, split: 0.7, shTint: '#2c3320', hiTint: '#ffeccc', grain: 0.1, vig: 0.35 }),
    f('x05', 'LOMO', 'CRUZADO', { sat: 0.45, con: 0.42, crush: 0.1, fade: 0.04, split: 0.5, shTint: '#101f30', hiTint: '#fff0c0', vig: 0.85, sharp: 0.3 }),
    f('x06', 'POLAROIDE', 'CRUZADO', { exp: 0.16, temp: 0.14, sat: -0.08, con: -0.06, fade: 0.3, roll: 0.78, split: 0.55, shTint: '#2a2a3a', hiTint: '#fff4e2', vig: 0.18, grain: 0.05 }),

    /* ---- PRETO E BRANCO ---- */
    f('b01', 'P&B NEUTRO', 'P&B', { skin: 0, sat: -1, con: 0.22, fade: 0.06, split: 0, grain: 0.05, sharp: 0.25 }),
    f('b02', 'P&B DURO', 'P&B', { skin: 0, split: 0, sat: -1, con: 0.72, crush: 0.14, fade: 0, roll: 0.1, grain: 0.07, vig: 0.35, sharp: 0.45 }),
    f('b03', 'P&B SUAVE', 'P&B', { skin: 0, split: 0, sat: -1, con: -0.1, fade: 0.2, roll: 0.7, grain: 0.03, vig: 0.1 }),
    f('b04', 'SÉPIA', 'P&B', { skin: 0, sat: -0.92, con: 0.2, fade: 0.12, split: 0.95, shTint: '#2b1d10', hiTint: '#ffe3b0', grain: 0.06, vig: 0.3 }),
    f('b05', 'AZULADO', 'P&B', { skin: 0, sat: -0.9, con: 0.24, fade: 0.1, split: 0.9, shTint: '#101c2e', hiTint: '#cfe0f2', grain: 0.05, vig: 0.28 }),
    f('b06', 'PRATA', 'P&B', { skin: 0, sat: -1, exp: 0.1, con: 0.4, crush: 0.06, fade: 0.03, split: 0.2, shTint: '#1a1c1e', hiTint: '#f2f4f4', sharp: 0.5, grain: 0.08 }),

    /* ================================================== PROCESSO ==========
       A família que faltava: cada um destes é um PROCESSO de laboratório
       cinematográfico, não um "preset". Os nomes descrevem o processo —
       bicromia, tricromia, reversão, branqueamento — porque é isso que
       está sendo reconstruído aqui, com a cadeia de efeitos inteira.
       Alguns precisam mexer na MATRIZ DE CANAIS, coisa que a curva sozinha
       não faz: por isso esta família usa cadeia (`chain`) em vez de um
       efeito só.                                                          */

    /* bicromia: as duas matrizes do processo de duas cores. Sem registro
       do azul — o céu fecha em ciano e a pele puxa para o rosa-tijolo. */
    c('p01', 'BICROMIA', 'processo de duas cores · vermelho-laranja + ciano-verde', [
      { fx: 'chanmix', p: { rr: 1.0, rg: 0.30, rb: -0.10, gr: 0.06, gg: 0.86, gb: 0.16, br: -0.18, bg: 0.42, bb: 0.62, norm: 1 } },
      { fx: 'filmstock', p: { con: 0.28, sat: 0.35, temp: 0.1, split: 0.62, shTint: '#0f3436', hiTint: '#ffc9a4', fade: 0.07, roll: 0.45, grain: 0.06, vig: 0.3, skin: 0.2 } }
    ]),
    /* tricromia: três matrizes, primárias densas, preto profundo */
    c('p02', 'TRICROMIA', 'processo de três cores · primárias densas e saturadas', [
      { fx: 'chanmix', p: { rr: 1.22, rg: -0.14, rb: -0.08, gr: -0.10, gg: 1.20, gb: -0.10, br: -0.06, bg: -0.16, bb: 1.22, norm: 1 } },
      { fx: 'filmstock', p: { con: 0.4, sat: 0.55, crush: 0.06, fade: 0.02, roll: 0.28, split: 0.3, shTint: '#0e1626', hiTint: '#fff0d8', grain: 0.05, vig: 0.34, sharp: 0.3, skin: 0.3 } }
    ]),
    /* reversão: o filme positivo. Latitude curta, preto que fecha, cor firme */
    c('p03', 'REVERSÃO', 'filme reversível · latitude curta e preto que fecha', [
      { fx: 'filmstock', p: { con: 0.55, sat: 0.42, crush: 0.12, fade: 0, roll: 0.18, split: 0.34, shTint: '#101a2a', hiTint: '#fff3dc', grain: 0.05, vig: 0.4, sharp: 0.34, skin: 0.35 } }
    ]),
    /* revelação trocada: negativo revelado como positivo */
    c('p04', 'REVELAÇÃO TROCADA', 'negativo revelado em banho de positivo', [
      { fx: 'crossproc', p: { rc: 0.6, gc: 0.18, bc: -0.5, piv: 0.48, lift: 0.08, sat: 0.3, yellow: 0.35 } },
      { fx: 'filmstock', p: { con: 0.2, sat: 0.1, fade: 0.13, split: 0.5, shTint: '#123a2c', hiTint: '#ffe6bd', grain: 0.07, vig: 0.36, roll: 0.5 } }
    ]),
    /* branqueamento parcial: a prata fica */
    c('p05', 'BRANQUEAMENTO', 'a prata fica na película · contraste alto, cor lavada', [
      { fx: 'bleach', p: { amt: 0.72, con: 0.55, sat: 0.32, dens: 0.4, halo: 0.22 } },
      { fx: 'filmstock', p: { con: 0.1, sat: -0.05, fade: 0.03, split: 0.22, shTint: '#1b1f24', hiTint: '#f4efe4', grain: 0.08, vig: 0.35, sharp: 0.4 } }
    ]),
    /* toscana: sol baixo, ocre, sombra quente */
    c('p06', 'TOSCANA', 'sol baixo · ocre, poeira e sombra quente', [
      { fx: 'filmstock', p: { exp: 0.1, con: 0.1, sat: -0.05, temp: 0.34, tintg: 0.1, fade: 0.17, roll: 0.66, split: 0.5, shTint: '#3a2a18', hiTint: '#ffeec6', grain: 0.06, vig: 0.3, skin: 0.7 } }
    ]),
    /* índigo: frio de anilina, sombra azul-tinta */
    c('p07', 'ÍNDIGO', 'frio de anilina · sombra azul-tinta e luz de papel', [
      { fx: 'filmstock', p: { con: 0.24, sat: -0.1, temp: -0.42, tintg: -0.08, fade: 0.12, roll: 0.55, split: 0.6, shTint: '#101d3c', hiTint: '#e9f1ff', grain: 0.05, vig: 0.3 } }
    ]),
    /* duas cores: só duas famílias de matiz no quadro inteiro */
    c('p08', 'DUAS CORES', 'só dois matizes no quadro · sombra fria, luz quente', [
      { fx: 'colormem', p: { col: '#e2670f', tol: 0.16, soft: 0.2, minsat: 0.1, stage: 0.35, boost: 0.25, grey: '#5f7f92', grain: 0, erode: 0 } },
      { fx: 'filmstock', p: { con: 0.3, sat: 0.18, fade: 0.08, split: 0.8, shTint: '#0d2b3d', hiTint: '#ffcf95', roll: 0.42, grain: 0.05, vig: 0.36 } }
    ]),
    /* noir: filme rápido, preto e branco duro */
    c('p09', 'NOIR', 'preto e branco duro · filtro amarelo e prata seca', [
      { fx: 'monoesp', p: { filt: 1, mix: 1, con: 0.62, toe: 0.16, shoulder: 0.28, sil: 0.45 } },
      { fx: 'filmstock', p: { skin: 0, sat: -1, con: 0.3, crush: 0.1, fade: 0.01, split: 0.14, shTint: '#15171a', hiTint: '#f4f4f2', grain: 0.09, vig: 0.5, sharp: 0.4 } }
    ]),
    /* alta sensibilidade: o P&B rápido de reportagem, grão aberto */
    c('p10', 'ALTA SENSIBILIDADE', 'p&b rápido de reportagem · grão aberto e meio-tom curto', [
      { fx: 'monoesp', p: { filt: 0, mix: 1, con: 0.35, toe: 0.35, shoulder: 0.5, sil: 0.6 } },
      { fx: 'filmstock', p: { skin: 0, sat: -1, con: 0.28, fade: 0.05, split: 0.1, shTint: '#191919', hiTint: '#efeeea', grain: 0.26, vig: 0.38, sharp: 0.3 } }
    ]),
    /* anos sessenta: pastel desbotado de revista */
    c('p11', 'ANOS SESSENTA', 'pastel de revista · magenta esmaecido e preto lavado', [
      { fx: 'filmstock', p: { exp: 0.14, con: -0.06, sat: -0.16, temp: 0.16, tintg: -0.16, fade: 0.28, roll: 0.74, split: 0.55, shTint: '#3a2b39', hiTint: '#fff0e4', grain: 0.07, vig: 0.22 } }
    ]),
    /* neutro de laboratório: o ponto de partida honesto */
    c('p12', 'LABORATÓRIO', 'ponto de partida neutro · densidade de sala de exibição', [
      { fx: 'filmstock', p: { con: 0.16, sat: 0.06, fade: 0.04, roll: 0.42, split: 0.2, shTint: '#1c2028', hiTint: '#fff4e6', grain: 0.03, vig: 0.16, sharp: 0.22, skin: 0.5 } }
    ]),

    /* ================================================== ÓPTICA ============
       Estes não mexem só na cor: mexem na LUZ. Halo, estrela de difração,
       vazamento e queima. Ficam na galeria porque é onde se escolhe olhando. */
    c('o01', 'ESTRELA', 'pontos de luz viram estrelas de quatro pontas', [
      { fx: 'kirakira', p: { thr: 0.72, arms: 1, len: 0.4, gain: 1.4, decay: 0.6, hard: 0.5, chroma: 0.3, twinkle: 0.3, core: 0.3, col: '#ffffff' } },
      { fx: 'filmstock', p: { con: 0.16, sat: 0.12, fade: 0.05, split: 0.28, shTint: '#141c2c', hiTint: '#fff2df', roll: 0.5, grain: 0.03, vig: 0.24 } }
    ]),
    c('o02', 'ESTRELA DE SEIS', 'seis pontas, giro lento e difração forte', [
      { fx: 'kirakira', p: { thr: 0.66, arms: 2, len: 0.55, gain: 1.7, decay: 0.68, hard: 0.4, chroma: 0.65, spin: 0.25, twinkle: 0.5, core: 0.4, col: '#fff3e0' } },
      { fx: 'filmstock', p: { con: 0.2, sat: 0.2, fade: 0.06, split: 0.34, shTint: '#101828', hiTint: '#ffeccd', roll: 0.45, grain: 0.04, vig: 0.3 } }
    ]),
    c('o03', 'HALO', 'halação forte e ombro longo: a luz sangra na emulsão', [
      { fx: 'halation', p: {} },
      { fx: 'filmstock', p: { exp: 0.08, con: 0.1, sat: 0.1, fade: 0.12, roll: 0.72, split: 0.4, shTint: '#221a20', hiTint: '#ffe0c0', grain: 0.05, vig: 0.28 } }
    ]),
    c('o04', 'RETALHO', 'o quadro picado em pedaços que vêm de outro instante', [
      { fx: 'cubik', p: { cols: 5, rows: 4, depth: 2, split: 0.55, dens: 0.45, rate: 4, jump: 0.3, zoom: 0.5, timeb: 1.5, rgb: 0.4, flip: 0.2, gap: 0.15 } }
    ]),
    c('o05', 'COLORIR', 'devolve cor a um preto e branco, por regiões', [
      { fx: 'colorize', p: { cena: 0, hor: 0.55, amt: 0.9, sep: 1, temp: 0.06, shadow: 0.35, vibr: 0.5, keep: 0.5 } },
      { fx: 'filmstock', p: { con: 0.14, sat: 0.08, fade: 0.05, roll: 0.5, split: 0.24, shTint: '#182432', hiTint: '#fff0dc', grain: 0.04, vig: 0.22 } }
    ])
  ];

  /* ================================ LOOKS DO COLOR ENGINE ==============
     Os cinco de js/color/looks.js. Diferente dos filtros acima, cada um
     passa pela cadeia completa — perfil de entrada, luz linear, look,
     transform de saída — e tem força própria que interpola parâmetros.  */
  (VE.color && VE.color.LOOKS ? VE.color.LOOKS : []).forEach(function (L) {
    LIST.push({
      id: L.id, name: L.name, fam: 'LOOK', kind: 'look',
      lookIndex: L.index, desc: L.desc, status: L.status
    });
  });

  F.LIST = LIST;
  F.BY = {};
  LIST.forEach(function (x) { F.BY[x.id] = x; });
  F.FAMS = [];
  LIST.forEach(function (x) { if (F.FAMS.indexOf(x.fam) < 0) F.FAMS.push(x.fam); });
  /* LOOK primeiro: é a família com cadeia de cor completa */
  var ORDEM = ['LOOK', 'PROCESSO', 'ÓPTICA'];
  F.FAMS.sort(function (a, b) {
    var ia = ORDEM.indexOf(a), ib = ORDEM.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  /* ============================================ APLICAR ==================
     Um filtro pode entrar de duas formas:
     · no CLIPE selecionado — vira mais um efeito da pilha dele;
     · sem seleção — vira uma camada de ajuste sobre a sequência inteira. */

  F.apply = function (id, replace) {
    var d = F.BY[id];
    if (!d || !VE.project) return null;
    var target = VE.selected();
    if (!target) {
      var c = VE.newAdjust(0, VE.duration());
      c.name = (d.kind === 'look' ? 'LOOK ' : 'FILTRO ') + d.name;
      var tr = VE.tracksOfClass('fx').filter(function (t) { return !VE.overlaps(t, 0, VE.duration()); })[0] || VE.addTrack('fx');
      tr.clips.push(c);
      VE.select([c.id]);
      target = c;
    }
    /* trocar de filtro não empilha dois: substitui o que já estava */
    if (replace !== false) {
      target.effects.slice().forEach(function (e) {
        if (e.__filter) VE.removeEffect(target, e.id);
      });
    }
    var eff;
    if (d.kind === 'look') {
      eff = VE.addEffect(target, 'labgrade');
      eff.name = 'LOOK · ' + d.name;
      eff.params.look = d.lookIndex;
      eff.params.strength = 1;
      eff.__filter = id;
    } else if (d.kind === 'chain') {
      /* a cadeia entra inteira, na ordem, e toda ela fica marcada como
         pertencente a este filtro — para que a próxima troca a remova   */
      d.steps.forEach(function (st, i) {
        var e = VE.addEffect(target, st.fx);
        e.name = (i === 0 ? 'PROCESSO · ' : '· ') + d.name;
        Object.keys(st.params).forEach(function (k) { e.params[k] = st.params[k]; });
        e.__filter = id;
        eff = e;
      });
    } else {
      eff = VE.addEffect(target, 'filmstock');
      eff.name = 'FILTRO · ' + d.name;
      Object.keys(d.params).forEach(function (k) { eff.params[k] = d.params[k]; });
      eff.__filter = id;
    }
    VE.pushHistory();
    VE.emit('project');
    F.markApplied();
    VE.app.toast('filtro ' + d.name + ' → ' + target.name);
    return eff;
  };

  /* ============================================ MINIATURAS ===============
     Um renderizador próprio, minúsculo, só para a galeria. Ele nunca toca na
     prévia principal: recebe um quadro como textura e devolve uma imagem por
     filtro.

     A fonte da miniatura é, em ordem:
       1. o quadro que está no cursor, se houver mídia no ar;
       2. uma CARTA DE REFERÊNCIA desenhada aqui — céu, pele, luz estourada,
          preto, cinza médio e uma rampa de cor.
     Antes, sem mídia carregada, a galeria virava 30 quadrados pretos: não dava
     para escolher nada.                                                     */

  var tr = null, tcv = null, chart = null;
  var TW = 168, TH = 126;

  function thumbRenderer() {
    if (tr) return tr;
    tcv = document.createElement('canvas');
    tcv.width = TW; tcv.height = TH;
    tr = new VE.Renderer(tcv);
    if (tr.failed) { tr = null; return null; }
    tr.setSize(TW, TH);
    return tr;
  }

  /* carta de referência: o mínimo para julgar um filtro sem ter mídia */
  function refChart() {
    if (chart) return chart;
    var W = 336, H = 252;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');

    /* céu, do azul ao claro */
    var sky = x.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, '#2f5f96');
    sky.addColorStop(1, '#c9d9e4');
    x.fillStyle = sky; x.fillRect(0, 0, W, H * 0.55);

    /* chão quente */
    var ground = x.createLinearGradient(0, H * 0.55, 0, H);
    ground.addColorStop(0, '#8a6a44');
    ground.addColorStop(1, '#2b1f16');
    x.fillStyle = ground; x.fillRect(0, H * 0.55, W, H * 0.45);

    /* sol estourado — testa o ombro das altas luzes e a halação */
    var sun = x.createRadialGradient(W * 0.76, H * 0.2, 2, W * 0.76, H * 0.2, H * 0.22);
    sun.addColorStop(0, '#ffffff');
    sun.addColorStop(0.4, '#fff3d0');
    sun.addColorStop(1, 'rgba(255,240,200,0)');
    x.fillStyle = sun; x.fillRect(0, 0, W, H);

    /* faixa de pele — a proteção de matiz da pele se vê aqui */
    x.fillStyle = '#d9a07a'; x.fillRect(W * 0.06, H * 0.42, W * 0.2, H * 0.34);
    x.fillStyle = '#b57b58'; x.fillRect(W * 0.06, H * 0.62, W * 0.2, H * 0.14);

    /* degraus de cinza, do preto ao branco */
    for (var i = 0; i < 6; i++) {
      var v = Math.round(255 * i / 5);
      x.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
      x.fillRect(W * 0.34 + i * (W * 0.11), H * 0.78, W * 0.11, H * 0.22);
    }
    /* barras de cor saturada */
    ['#c0392b', '#1c7a41', '#1b4fd8', '#e2670f', '#7d3f9c', '#f5d000'].forEach(function (col, j) {
      x.fillStyle = col;
      x.fillRect(W * 0.34 + j * (W * 0.11), H * 0.60, W * 0.11, H * 0.18);
    });

    chart = c;
    return c;
  }

  /* há algum clipe visível no cursor? */
  function hasFrame() {
    if (!VE.project || !VE.renderer) return false;
    var ops = VE.resolveOps(VE.project.time);
    return ops.some(function (o) { return o.kind === 'clip'; });
  }

  var busy = false, pending = false;
  var frozenAt = null, frozenLive = null;

  /* a galeria foi remontada (troca de família, primeira abertura) e as
     miniaturas ainda não foram desenhadas nesta lista de botões           */
  F.invalidate = function () { frozenAt = null; frozenLive = null; };

  /* algum botão da lista está sem imagem? então a galeria PRECISA desenhar,
     mesmo que o cursor não tenha andado. Era exatamente esse o buraco: ao
     abrir a aba ou trocar de família o HTML era refeito com <img> vazio, e
     o guarda de "quadro congelado" mandava não redesenhar — só o ↻ salvava. */
  function missingThumbs(box) {
    var items = box.querySelectorAll('.filt .fthumb');
    for (var i = 0; i < items.length; i++) {
      if (!items[i].getAttribute('src')) return true;
    }
    return items.length === 0;
  }

  F.refreshThumbs = function (force) {
    var box = $('#filterGrid');
    if (!box) return;
    /* não gasta GPU com a aba fechada — mas anota que ficou devendo */
    if (VE.shell.view !== 'video') { F.invalidate(); return; }
    if (VE.panels && VE.panels.tab !== 'filters') { F.invalidate(); return; }
    if (busy) { pending = true; return; }
    var r = thumbRenderer();
    if (!r) return;

    /* nunca redesenha tocando: o quadro muda a cada passada e a galeria
       inteira pisca. Parado, só refaz se o cursor realmente andou —
       ou se ainda há miniatura em branco na tela.                        */
    var tNow = VE.project ? VE.project.time : 0;
    var liveNow = hasFrame();
    if (missingThumbs(box)) force = true;
    if (!force) {
      if (VE.app && VE.app.playing) return;
      if (frozenAt !== null && Math.abs(frozenAt - tNow) < 0.001 && frozenLive === liveNow) return;
    }
    busy = true;
    frozenAt = tNow; frozenLive = liveNow;

    var live = liveNow;
    /* garante que a prévia tem MESMO o quadro do cursor desenhado: com a
       composição pausada o laço pode não ter passado ainda. Sem isso, o ↻
       às vezes copiava um quadro velho — ou nenhum.                      */
    if (live) {
      var keepPv = F.preview;
      F.preview = null;                 /* a prévia sob o cursor não entra na miniatura */
      try { VE.app.renderNow(); } catch (e) { live = false; }
      F.preview = keepPv;
    }
    var source = live ? document.getElementById('gl') : refChart();
    var foot = $('#filterFoot');
    if (foot) {
      foot.textContent = live
        ? 'QUADRO FIXO EM ' + VE.tl.tc(tNow) + ' · ↻ PARA ATUALIZAR'
        : 'SEM MÍDIA NO CURSOR — MOSTRANDO A CARTA DE REFERÊNCIA';
    }

    var tex = r.upload('src', source, !live);
    if (!tex) { busy = false; return; }
    var aspect = TW / TH;
    var FULL = { x: 0.5, y: 0.5, w: aspect, h: 1 };
    var t = VE.project ? VE.project.time : 0;

    var items = box.querySelectorAll('.filt');
    for (var i = 0; i < items.length; i++) {
      var d = F.BY[items[i].dataset.filt];
      if (!d) continue;
      r.renderPlan([
        { kind: 'clip', tex: tex, rect: FULL, angle: 0, opacity: 1, blend: 0, effects: [] },
        { kind: 'adjust', effects: chainOf(d) }
      ], t, {});
      var img = items[i].querySelector('.fthumb');
      try { img.src = tcv.toDataURL('image/jpeg', 0.78); } catch (e) { }
    }
    busy = false;
    if (pending) { pending = false; setTimeout(F.refreshThumbs, 40); }
  };

  /* ============================================ PRÉVIA AO PASSAR ==========
     Passar o mouse mostra o filtro na prévia GRANDE, sem aplicar nada. Sair
     desfaz. É a diferença entre escolher no escuro e escolher vendo.      */
  F.preview = null;

  F.setPreview = function (id) {
    var chk = $('#filterHover');
    if (chk && !chk.checked) return;
    if (F.preview === id) return;
    F.preview = id;
    var box = $('#filterGrid');
    if (box) box.querySelectorAll('.filt').forEach(function (el) {
      el.classList.toggle('previewing', el.dataset.filt === id);
    });
  };

  F.clearPreview = function () {
    if (F.preview === null) return;
    F.preview = null;
    var box = $('#filterGrid');
    if (box) box.querySelectorAll('.filt.previewing').forEach(function (el) {
      el.classList.remove('previewing');
    });
  };

  /* a operação extra que o motor recebe enquanto a prévia está ligada */
  /* a cadeia de efeitos que ESTE filtro representa, pronta para o motor.
     Serve para a prévia ao passar o mouse e para as miniaturas.        */
  function chainOf(d) {
    if (!d) return [];
    if (d.kind === 'look') {
      var lp = VE.defaults('labgrade');
      lp.look = d.lookIndex;
      lp.strength = 1;
      return [{ id: 'labgrade', params: lp, amount: 1, local: 0, mask: VE.newMask() }];
    }
    if (d.kind === 'chain') {
      return d.steps.map(function (st) {
        return { id: st.fx, params: st.params, amount: 1, local: 0, mask: VE.newMask() };
      });
    }
    return [{ id: 'filmstock', params: d.params, amount: 1, local: 0, mask: VE.newMask() }];
  }
  F.chainOf = chainOf;

  F.previewOp = function () {
    if (!F.preview) return null;
    var chain = chainOf(F.BY[F.preview]);
    if (!chain.length) return null;
    return { kind: 'adjust', effects: chain };
  };

  /* ================================================ INTERFACE ============ */
  var curFam = 'TODOS';

  /* qual filtro já está aplicado no clipe selecionado */
  function appliedId() {
    var c = VE.selected();
    if (!c || !c.effects) return null;
    for (var i = c.effects.length - 1; i >= 0; i--) {
      var fx = c.effects[i].fx;
      if ((fx === 'filmstock' || fx === 'labgrade') && c.effects[i].__filter) return c.effects[i].__filter;
    }
    return null;
  }

  F.markApplied = function () {
    var box = $('#filterGrid');
    if (!box) return;
    var cur = appliedId();
    box.querySelectorAll('.filt').forEach(function (el) {
      el.classList.toggle('on', el.dataset.filt === cur);
    });
  };

  F.render = function () {
    var box = $('#filterGrid');
    var fams = $('#filterFams');
    if (!box) return;
    if (fams && !fams.dataset.built) {
      fams.dataset.built = '1';
      fams.innerHTML = ['TODOS'].concat(F.FAMS).map(function (fm) {
        return '<button class="chip' + (fm === curFam ? ' on' : '') + '" data-fam="' + fm + '">' + fm + '</button>';
      }).join('');
      fams.addEventListener('click', function (e) {
        var b = e.target.closest('.chip');
        if (!b) return;
        curFam = b.dataset.fam;
        fams.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c === b); });
        F.render();
      });
    }
    var items = LIST.filter(function (x) { return curFam === 'TODOS' || x.fam === curFam; });
    var cnt = $('#filtCount');
    if (cnt) cnt.textContent = String(items.length).padStart(2, '0');

    box.innerHTML = items.map(function (x) {
      var tip = x.name + ' · ' + x.fam + (x.desc ? ' — ' + x.desc : '');
      return '<button class="filt" data-filt="' + x.id + '" title="' + tip.replace(/"/g, '') + '">' +
        '<img class="fthumb" alt="" draggable="false">' +
        '<span class="fcap"><span class="fcode">' + x.id.toUpperCase() + '</span>' +
        '<span class="fname">' + x.name + '</span></span></button>';
    }).join('');

    box.querySelectorAll('.filt').forEach(function (el) {
      el.addEventListener('click', function () { F.apply(el.dataset.filt); });
      el.addEventListener('pointerenter', function () { F.setPreview(el.dataset.filt); });
      el.addEventListener('pointerleave', function () { F.clearPreview(); });
    });
    box.addEventListener('pointerleave', F.clearPreview);

    F.markApplied();
    /* lista nova = miniaturas novas. Sem isto, trocar de família devolvia
       trinta retângulos vazios até alguém apertar ↻.                    */
    F.invalidate();
    F.refreshThumbs(true);
  };

  F.init = function () {
    var btn = $('#filterRefresh');
    if (btn) btn.addEventListener('click', function () { F.refreshThumbs(true); });
    var chk = $('#filterHover');
    if (chk) chk.addEventListener('change', function () { if (!chk.checked) F.clearPreview(); });
    F.render();

    /* as miniaturas se refazem quando o cursor para de andar */
    var timer = null;
    VE.on('project', function () {
      clearTimeout(timer);
      F.markApplied();
      timer = setTimeout(function () { F.refreshThumbs(); }, 500);
    });
    VE.on('select', F.markApplied);
    /* mover o cursor com a composição parada refaz o quadro de referência */
    var seekTimer = null;
    VE.on('seek', function () {
      clearTimeout(seekTimer);
      seekTimer = setTimeout(function () { F.refreshThumbs(); }, 350);
    });
    VE.on('view', function (v) { if (v === 'video') setTimeout(F.refreshThumbs, 320); });
  };

})(window.VE);
