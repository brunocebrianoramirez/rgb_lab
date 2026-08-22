/* ============================================================
   rgb_lab — PRESETS ARTÍSTICOS DO RACK DE ÁUDIO
   ------------------------------------------------------------
   Cada preset é uma CADEIA: quais módulos, em que ordem e com
   que valores. Nenhum deles inventa processamento — todos usam
   os módulos que existem no rack, e depois de aplicar tudo
   continua aberto para você mexer.

   Aparecem na mesma caixa PRESETS da coluna esquerda, acima dos
   seus. Aplicar um preset REORDENA o rack: a ordem listada aqui
   é a ordem em que o sinal passa.
   ============================================================ */
(function (VE) {
  'use strict';
  var A = VE.audio;
  var n = 0;

  function p(grupo, name, desc, chain) {
    n++;
    return {
      id: 'ap' + n, code: 'A' + String(n).padStart(2, '0'),
      grupo: grupo, name: name, desc: desc,
      chain: chain.concat([{ id: 'out', on: true, values: { gain: 1, pan: 0, norm: 1 } }])
    };
  }
  function m(id, values) { return { id: id, on: true, values: values || {} }; }

  A.PRESETS = [
    /* ---------------------------------------------------- CINEMÁTICO */
    p('CINEMÁTICO', 'ESPAÇO DE SONHO', 'granular leve dentro de um salão que não fecha',
      [m('granlab', { grain: 0.12, dens: 1.6, spray: 0.12, pitchJit: 1.5, pan: 0.5, mix: 0.6, dur: 1 }),
      m('atmos', { tipo: 2, size: 1.4, decay: 0.9, damp: 1.1, width: 1.3, pre: 0.05, mix: 0.55 })]),
    p('CINEMÁTICO', 'SALA ESCURA', 'perto, abafado e com o agudo comido',
      [m('filter', { type: 0, freq: 2600, q: 0.9 }),
      m('atmos', { tipo: 8, size: 0.8, decay: 1.3, damp: 1.6, width: 0.6, mix: 0.3 })]),
    p('CINEMÁTICO', 'SALÃO INFINITO', 'a cauda não termina; o espectro escorre',
      [m('atmos', { tipo: 6, size: 1.3, decay: 0.55, damp: 0.7, width: 1.6, pre: 0.03, mix: 0.65 }),
      m('spectral', { tipo: 1, amt: 0.5, janela: 2, mix: 0.5 })]),
    p('CINEMÁTICO', 'MEMÓRIA DISTANTE', 'fita cansada, ouvida de longe',
      [m('tape', { wow: 0.4, flutter: 0.35, sat: 0.35, hiss: 0.02, stop: 0 }),
      m('crush', { bits: 9, down: 3, mix: 0.4 }),
      m('atmos', { tipo: 4, size: 1.2, decay: 1.1, damp: 1.4, width: 0.9, pre: 0.09, mix: 0.45 })]),

    /* -------------------------------------------------- EXPERIMENTAL */
    p('EXPERIMENTAL', 'COLAPSO DIGITAL', 'o arquivo desiste no meio da reprodução',
      [m('dropout', { tipo: 5, prob: 0.45, bloco: 45, dur: 2.2, seed: 21 }),
      m('crush', { bits: 4, down: 12, mix: 0.8 }),
      m('chop', { slice: 70, rep: 0.45, skip: 0.25, rev: 0.3, gate: 0.15, seed: 33 })]),
    p('EXPERIMENTAL', 'FANTASMA ESPECTRAL', 'um acorde preso no ar, sem fonte',
      [m('spectral', { tipo: 0, amt: 0.95, janela: 3, pos: 0.25, mix: 1 }),
      m('atmos', { tipo: 7, size: 1.6, decay: 0.8, damp: 0.9, width: 1.2, pre: 0.07, mix: 0.5 })]),
    p('EXPERIMENTAL', 'MÁQUINA LÍQUIDA', 'matéria que escorre e volta em atraso',
      [m('material', { tipo: 5, forca: 1.3, afin: 0.8, corpo: 1.2, gran: 0.4, mix: 0.85 }),
      m('granlab', { grain: 0.05, dens: 3.2, spray: 0.25, pitchJit: 4, pan: 0.6, mix: 0.7, dur: 1 }),
      m('delay', { time: 0.33, fb: 0.55, mix: 0.4 })]),
    p('EXPERIMENTAL', 'MEMÓRIA QUEBRADA', 'um trecho curto preso, apodrecendo',
      [m('mloop', { len: 340, pos: 0.2, drift: 0.25, cross: 30, freeze: 0 }),
      m('tape', { wow: 0.55, flutter: 0.4, sat: 0.4, hiss: 0.03 }),
      m('atmos', { tipo: 1, size: 1.1, decay: 1, damp: 1.5, width: 1, mix: 0.4 })]),
    p('EXPERIMENTAL', 'TEMPESTADE DE DADOS', 'o sistema decide sozinho e não pergunta',
      [m('caos', { rand: 0.8, inten: 0.75, prob: 0.7, speed: 6, alvo: 0, seed: 77 }),
      m('dropout', { tipo: 4, prob: 0.35, bloco: 25, dur: 1, seed: 5 }),
      m('crush', { bits: 5, down: 6, mix: 0.6 })]),

    /* --------------------------------------------------------- GLITCH */
    p('GLITCH', 'CORRUPÇÃO VHS', 'fita gasta com os dados trocados',
      [m('tape', { wow: 0.5, flutter: 0.6, sat: 0.45, hiss: 0.04 }),
      m('dropout', { tipo: 3, prob: 0.3, bloco: 30, dur: 1.2, seed: 11 }),
      m('crush', { bits: 7, down: 4, mix: 0.5 })]),
    p('GLITCH', 'FALHA DE BUFFER', 'o mesmo bloco tocando enquanto o resto some',
      [m('dropout', { tipo: 1, prob: 0.5, bloco: 80, dur: 3, seed: 3 }),
      m('chop', { slice: 120, rep: 0.6, skip: 0.1, rev: 0.15, gate: 0.05, seed: 9 })]),
    p('GLITCH', 'POEIRA DIGITAL', 'sujeira fina por cima, sem destruir o som',
      [m('noise', { amt: 0.03, type: 2 }),
      m('crush', { bits: 8, down: 2, mix: 0.35 }),
      m('chop', { slice: 25, rep: 0.12, skip: 0.05, rev: 0.08, gate: 0.03, seed: 44 })]),
    p('GLITCH', 'SINAL QUEBRADO', 'rajadas de dados e a fase saindo do lugar',
      [m('dropout', { tipo: 4, prob: 0.28, bloco: 18, dur: 0.8, seed: 66 }),
      m('psico', { tipo: 5, amt: 0.8 })]),

    /* -------------------------------------------------------- TEXTURA */
    p('TEXTURA', 'VIDRO', 'ressonâncias altas e longas',
      [m('material', { tipo: 1, forca: 1.4, afin: 1, corpo: 0.5, gran: 0.2, mix: 0.9 }),
      m('atmos', { tipo: 0, size: 0.9, decay: 1.2, damp: 0.6, width: 1.2, mix: 0.3 })]),
    p('TEXTURA', 'METAL', 'batida que continua soando depois de acabar',
      [m('material', { tipo: 0, forca: 1.5, afin: 1, corpo: 0.8, gran: 0.3, mix: 0.9 }),
      m('atmos', { tipo: 10, size: 1.3, decay: 0.9, damp: 0.8, width: 0.8, mix: 0.4 })]),
    p('TEXTURA', 'FUMAÇA', 'sem contorno, só massa',
      [m('material', { tipo: 7, forca: 1.1, afin: 1, corpo: 1.4, gran: 0.6, mix: 0.9 }),
      m('spectral', { tipo: 2, amt: 0.55, janela: 2, mix: 0.7 }),
      m('atmos', { tipo: 1, size: 1.5, decay: 0.9, damp: 1.4, width: 1.4, mix: 0.5 })]),
    p('TEXTURA', 'LÍQUIDO', 'grave que dobra e escorre',
      [m('material', { tipo: 5, forca: 1.2, afin: 0.7, corpo: 1.5, gran: 0.35, mix: 0.9 }),
      m('pdrift', { amp: 1.2, rate: 0.5, caos: 0.6, seed: 18 })]),
    p('TEXTURA', 'PEDRA', 'grave seco, sem brilho nenhum',
      [m('material', { tipo: 2, forca: 1.3, afin: 1, corpo: 1.6, gran: 0.25, mix: 0.95 }),
      m('atmos', { tipo: 9, size: 1.1, decay: 1.3, damp: 1.5, width: 0.7, mix: 0.35 })]),

    /* ---------------------------------------------------------- ESPAÇO
       Os três pedem FONE DE OUVIDO: em caixas o HRTF perde quase tudo,
       porque o som de cada caixa chega aos dois ouvidos.               */
    p('ESPAÇO', 'ÓRBITA', 'a fonte dá voltas em torno da sua cabeça',
      [m('orbit3d', { traj: 0, rate: 0.3, raio: 2.5, alt: 0, frente: 0.8, queda: 0.8, dop: 0.4, ar: 0.35, mix: 1 }),
      m('atmos', { tipo: 8, size: 0.9, decay: 1.1, damp: 1.2, width: 1.1, mix: 0.25 })]),
    p('ESPAÇO', 'SOBREVOO', 'passa por cima e vai embora, com doppler',
      [m('orbit3d', { traj: 6, rate: 0.18, raio: 7, alt: 5, frente: 0, queda: 1.4, dop: 0.85, ar: 0.6, mix: 1 }),
      m('atmos', { tipo: 11, size: 1.2, decay: 0.8, damp: 0.6, width: 1.5, pre: 0.06, mix: 0.35 })]),
    p('ESPAÇO', 'DENTRO DA CABEÇA', 'binaural fechado, sem lugar no mundo',
      [m('psico', { tipo: 0, amt: 0.85, rate: 0.15 }),
      m('orbit3d', { traj: 3, rate: 0.12, raio: 0.6, alt: 0, frente: -0.4, queda: 0.3, dop: 0.15, ar: 0, mix: 0.7 })]),

    /* ------------------------------------------------------- VIDEOARTE */
    p('VIDEOARTE', 'DISSOLUÇÃO LENTA', 'o mesmo material, quatro vezes mais longo',
      [m('tstretch', { fator: 4, grain: 0.12, ov: 5, tom: 0 }),
      m('atmos', { tipo: 6, size: 1.8, decay: 0.6, damp: 0.9, width: 1.5, mix: 0.55 })]),
    p('VIDEOARTE', 'MEMÓRIA', 'um pedaço que volta, cada vez mais longe',
      [m('mloop', { len: 900, pos: 0.15, drift: 0.4, cross: 60, freeze: 0 }),
      m('tape', { wow: 0.3, flutter: 0.2, sat: 0.25, hiss: 0.015 }),
      m('atmos', { tipo: 4, size: 1.4, decay: 1, damp: 1.3, width: 1.1, pre: 0.08, mix: 0.5 })]),
    p('VIDEOARTE', 'FRAGMENTAÇÃO', 'o som picado e remontado fora de ordem',
      [m('chop', { slice: 90, rep: 0.4, skip: 0.35, rev: 0.35, gate: 0.12, tom: 3, seed: 12 }),
      m('caos', { rand: 0.5, inten: 0.4, prob: 0.45, speed: 4, alvo: 4, seed: 8 })]),
    p('VIDEOARTE', 'COLAPSO TEMPORAL', 'o tempo estica e o espectro estica junto',
      [m('tstretch', { fator: 6, grain: 0.16, ov: 6, tom: -5 }),
      m('spectral', { tipo: 3, amt: 0.6, janela: 3, mix: 0.7 })]),
    p('VIDEOARTE', 'QUADRO FANTASMA', 'um instante congelado que continua respirando',
      [m('spectral', { tipo: 8, amt: 0.9, janela: 3, pos: 0.2, lo: 0.02, hi: 0.35, mix: 0.9 }),
      m('granlab', { grain: 0.2, dens: 0.8, spray: 0.05, pan: 0.7, mix: 0.5, dur: 1, freeze: 1 }),
      m('atmos', { tipo: 2, size: 1.6, decay: 0.8, damp: 1, width: 1.4, mix: 0.5 })])
  ];

})(window.VE);
