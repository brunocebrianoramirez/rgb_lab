/* ============================================================
   rgb_lab — COLOR ENGINE · LOOKS
   ------------------------------------------------------------
   Cinco looks reconstruídos. Cada um é SÓ UM CONJUNTO DE
   PARÂMETROS: nenhuma matemática mora aqui. Isso é o que permite
   acrescentar um look novo sem tocar no motor, e é o que faz a
   força do look interpolar de verdade (engine.js · mixLook).

   ────────────────────────────────────────────────────────────
   PROCEDÊNCIA — leia antes de citar qualquer número daqui
   ────────────────────────────────────────────────────────────
   Estes NÃO são os parâmetros internos de nenhum produto. A VSCO
   não publica matriz, curva, LUT nem parâmetro de preset algum.

   O que foi usado como referência: a DIREÇÃO ESTÉTICA descrita
   publicamente pela própria VSCO para cada preset (categoria,
   comportamento tonal, comportamento cromático, finalidade) mais
   o comportamento observável. A matemática abaixo é um modelo
   independente construído a partir dessa direção.

   Classificação de cada look:  RECONSTRUCTED / APPROXIMATE.
   Nenhum é EXACT, e nenhum deve ser descrito como tal — não há
   imagem oficial de referência contra a qual medir equivalência.

   Nada foi extraído, decompilado ou copiado de software de
   terceiros.
   ============================================================ */
(function (VE) {
  'use strict';

  var C = VE.color = VE.color || {};

  /* Os nomes de exibição são do rgb_lab. O campo `ref` guarda a
     referência estética, para o trabalho ficar rastreável.
     Trocar para true mostra os códigos de referência na interface —
     o que traz junto a questão de usar nome de produto alheio.      */
  C.SHOW_REF_NAMES = false;

  /* ============================== AJUDANTES DE MATRIZ ==================
     Toda matriz criativa nasce da identidade e sofre perturbação pequena.
     Nunca uma matriz arbitrária: isso destrói a neutralidade da imagem. */

  var LUMA = [0.2126, 0.7152, 0.0722];

  /* mute > 0  puxa cada canal na direção da luma  → cor mais contida
     mute < 0  afasta da luma                      → separação cromática
     warm > 0  ganho no vermelho, perda no azul                        */
  function mtx(mute, warm, extra) {
    var m = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      m[r * 3 + c] = (1 - mute) * (r === c ? 1 : 0) + mute * LUMA[c];
    }
    m[0] *= 1 + warm;
    m[8] *= 1 - warm;
    if (extra) for (var i = 0; i < 9; i++) m[i] += extra[i];
    return m;
  }

  /* matizes de referência em OKLCH, medidos das primárias sRGB */
  var H = {
    /* medidos das primárias sRGB em OKLCH, não estimados:
       ver js/color/validate.js. A pele de 4 tons cai entre 44° e 46°. */
    red: 29, orange: 62, skin: 46, yellow: 108,
    green: 142, cyan: 195, blue: 264, magenta: 328
  };
  C.HUES = H;

  var L = C.fillLook;

  /* ==================================================================== */
  var LOOKS = [

    /* ───────────────────────────────────────────── 01 · ANÁLOGO ───────
       Direção documentada: aparência analógica, tons cremosos, azuis
       sutis, contraste moderado com peso nos meios-tons, aparência
       natural, saturação contida, alguns tons aquecidos.

       Decisões: o pivô fica ABAIXO de 0.5 no domínio log para que a
       inclinação caia nos meios-tons e não na imagem inteira; o pé
       fecha pouco (sombras "densas", não pretas); a matriz é apenas 6%
       na direção da luma. Não é teal-and-orange: os deslocamentos de
       matiz são de 5 a 6 graus, não de 20.                             */
    L({
      id: 'l01', code: 'L01', name: 'ANÁLOGO', family: 'LOOK',
      ref: 'direção estética: VSCO A6 (reconstrução independente)',
      status: 'RECONSTRUCTED',
      desc: 'analógico cremoso, meios-tons com peso, azuis sutis',
      exposure: 0, temp: 0.04, tint: 0,
      contrast: 0.16, pivot: 0.46, toe: 0.22, shoulder: 0.30,
      lift: [0.004, 0.002, 0.008], gamma: [1.0, 1.0, 0.99], gain: [1.005, 1.0, 0.995],
      mtx: mtx(0.06, 0.012),
      satGlobal: 0.92, satShadow: 0.98, satMid: 0.95, satHigh: 0.88,
      bands: [
        { c: H.red, w: 26, dh: +5, ds: 1.00 },
        { c: H.skin, w: 24, dh: 0, ds: 1.00 },
        { c: H.yellow, w: 28, dh: -6, ds: 0.96 },
        { c: H.green, w: 40, dh: 0, ds: 0.84, dl: 0.99 },
        { c: H.cyan, w: 34, dh: +6, ds: 0.92 },
        { c: H.blue, w: 40, dh: 0, ds: 0.90, dl: 1.01 }
      ],
      skinCenter: H.skin, skinWidth: 24, skinProtect: 0.70,
      splitShH: 250, splitShS: 0.10, splitHiH: 70, splitHiS: 0.10, splitBal: 0.5,
      hlRoll: 0.50, hlKnee: 0.70, fade: 0.020
    }),

    /* ───────────────────────────────────────────── 02 · VIVO ──────────
       Direção documentada: "Vibrant Classic" — cor aumentada porém
       controlada, brilho elevado, contraste médio/forte, altas luzes
       puxando para rosa, sombras azul-esverdeadas, aparência de filme
       superexposto.

       Decisões: a exposição sobe pouco (+0.14 stop) e o OMBRO sobe
       junto, senão a imagem estoura — filme superexposto comprime, não
       corta. A matriz usa mute NEGATIVO: afasta da luma e abre a
       separação cromática, que é diferente de simplesmente saturar.    */
    L({
      id: 'l02', code: 'L02', name: 'VIVO', family: 'LOOK',
      ref: 'direção estética: VSCO C1 (reconstrução independente)',
      status: 'RECONSTRUCTED',
      desc: 'vibrante clássico, luz alta, sombra azul-esverdeada',
      exposure: 0.08, temp: 0, tint: 0,
      contrast: 0.30, pivot: 0.48, toe: 0.30, shoulder: 0.45,
      lift: [0.002, 0.002, 0.004], gamma: [1.0, 1.0, 1.0], gain: [1.010, 1.0, 1.005],
      mtx: mtx(-0.10, 0.004),
      satGlobal: 1.12, satShadow: 1.10, satMid: 1.14, satHigh: 1.05,
      bands: [
        { c: H.red, w: 26, dh: 0, ds: 1.16 },
        { c: H.skin, w: 24, dh: 0, ds: 1.02 },
        { c: H.yellow, w: 28, dh: -3, ds: 1.10 },
        { c: H.green, w: 40, dh: 0, ds: 1.08, dl: 0.99 },
        { c: H.cyan, w: 34, dh: 0, ds: 1.10 },
        { c: H.blue, w: 42, dh: 0, ds: 1.18 }
      ],
      skinCenter: H.skin, skinWidth: 24, skinProtect: 0.88,
      splitShH: 205, splitShS: 0.20, splitHiH: 10, splitHiS: 0.12, splitBal: 0.5,
      hlRoll: 0.45, hlKnee: 0.70, fade: 0.015
    }),

    /* ───────────────────────────────────────────── 03 · FERRUGEM ──────
       Direção documentada: claro e quente, clareia e aquece a imagem,
       ferrugem sutil, altas luzes esmaecidas, cores aprofundadas e
       dessaturadas, equilíbrio forte e silencioso.

       Decisões: "ferrugem" é amarelo puxado PARA o laranja com croma
       reduzido — não é sépia, porque verde e azul continuam existindo
       (só ficam contidos). "Cores aprofundadas" vira saturação MAIOR
       nas sombras e MENOR nas altas luzes, que é o oposto de baixar a
       saturação global e chega em outro lugar.                         */
    L({
      id: 'l03', code: 'L03', name: 'FERRUGEM', family: 'LOOK',
      ref: 'direção estética: VSCO M5 (reconstrução independente)',
      status: 'RECONSTRUCTED',
      desc: 'claro e quente, ferrugem sutil, altas luzes esmaecidas',
      exposure: 0.16, temp: 0.16, tint: 0.02,
      contrast: 0.12, pivot: 0.44, toe: 0.30, shoulder: 0.50,
      lift: [0.010, 0.006, 0.002], gamma: [1.0, 0.995, 0.985], gain: [1.010, 0.998, 0.965],
      mtx: mtx(0.14, 0.030),
      satGlobal: 0.84, satShadow: 1.06, satMid: 0.86, satHigh: 0.70,
      bands: [
        { c: H.red, w: 28, dh: +7, ds: 0.94 },
        { c: H.skin, w: 24, dh: 0, ds: 0.98 },
        { c: H.yellow, w: 30, dh: -10, ds: 0.82 },
        { c: H.green, w: 44, dh: 0, ds: 0.68, dl: 0.97 },
        { c: H.cyan, w: 34, dh: -10, ds: 0.66 },
        { c: H.blue, w: 44, dh: -12, ds: 0.66 }
      ],
      skinCenter: H.skin, skinWidth: 24, skinProtect: 0.85,
      splitShH: 40, splitShS: 0.10, splitHiH: 60, splitHiS: 0.16, splitBal: 0.5,
      hlRoll: 0.55, hlKnee: 0.68, fade: 0.020
    }),

    /* ───────────────────────────────────────────── 04 · RETRATO ───────
       Direção documentada: preset de retrato, atenção especial a verdes
       e azuis, melhora do contraste entre pele e ambiente, sombras mais
       densas, pele cremosa e natural, contraste sutil.

       Decisões: a proteção de pele é a característica que define este
       look — 0.92, quase total. Verde e azul são deslocados PARA LONGE
       do matiz da pele (verde vai para o ciano-verde), criando a
       separação; a pele em si quase não é tocada. A faixa magenta é
       puxada na direção do vermelho para tirar o excesso de magenta que
       aparece em pele sob luz mista. Pele não vira laranja: o
       deslocamento na faixa da pele é de 1 grau.                       */
    L({
      id: 'l04', code: 'L04', name: 'RETRATO', family: 'LOOK',
      ref: 'direção estética: VSCO G3 (reconstrução independente)',
      status: 'RECONSTRUCTED',
      desc: 'retrato: separa pele de verde e azul, sombra densa',
      exposure: 0, temp: 0.05, tint: -0.02,
      contrast: 0.13, pivot: 0.47, toe: 0.34, shoulder: 0.25,
      lift: [0.002, 0.001, 0.003], gamma: [1.0, 1.0, 1.0], gain: [1.004, 1.0, 0.998],
      mtx: mtx(0.05, 0.012),
      satGlobal: 0.97, satShadow: 0.95, satMid: 0.98, satHigh: 0.94,
      bands: [
        { c: H.red, w: 24, dh: +4, ds: 0.96 },
        { c: H.magenta, w: 30, dh: +10, ds: 0.88 },
        { c: H.skin, w: 26, dh: +1, ds: 1.02, dl: 1.01 },
        { c: H.yellow, w: 26, dh: -4, ds: 0.94 },
        { c: H.green, w: 46, dh: +10, ds: 0.78, dl: 0.96 },
        { c: H.cyan, w: 34, dh: +4, ds: 0.90 },
        { c: H.blue, w: 42, dh: -4, ds: 0.88, dl: 0.98 }
      ],
      skinCenter: H.skin, skinWidth: 26, skinProtect: 0.92,
      splitShH: 240, splitShS: 0.08, splitHiH: 60, splitHiS: 0.08, splitBal: 0.5,
      hlRoll: 0.35, hlKnee: 0.78, fade: 0.012
    }),

    /* ───────────────────────────────────────────── 05 · FAROL ─────────
       Direção documentada: "High Beam" — contraste mais elevado, sombras
       profundas, azuis mais presentes, vermelhos quentes preservados,
       aparência moderna, funciona bem em retrato.

       Decisões: o pé é o mais fechado dos cinco (0.52) — é daí que vêm
       as "sombras profundas". O azul ganha croma (×1.24) e perde um
       pouco de luminância, que é o que faz um azul "presente" sem virar
       néon. O vermelho não é deslocado: fica quente onde está. Isso e a
       proteção de pele em 0.8 são o que impede o resultado de virar um
       LUT teal-and-orange.                                             */
    L({
      id: 'l05', code: 'L05', name: 'FAROL', family: 'LOOK',
      ref: 'direção estética: VSCO HB2 (reconstrução independente)',
      status: 'RECONSTRUCTED',
      desc: 'contraste alto, sombra profunda, azul presente, vermelho quente',
      exposure: -0.04, temp: -0.03, tint: 0,
      contrast: 0.34, pivot: 0.48, toe: 0.52, shoulder: 0.28,
      lift: [-0.002, -0.002, 0.002], gamma: [1.0, 1.0, 1.005], gain: [1.0, 0.998, 1.010],
      mtx: mtx(-0.04, -0.015),
      satGlobal: 1.06, satShadow: 1.02, satMid: 1.06, satHigh: 1.00,
      bands: [
        { c: H.red, w: 26, dh: -2, ds: 1.06 },
        { c: H.skin, w: 24, dh: 0, ds: 1.00 },
        { c: H.yellow, w: 28, dh: 0, ds: 0.94 },
        { c: H.green, w: 42, dh: +6, ds: 0.86, dl: 0.97 },
        { c: H.cyan, w: 36, dh: +8, ds: 1.06 },
        { c: H.blue, w: 44, dh: -4, ds: 1.24, dl: 0.97 }
      ],
      skinCenter: H.skin, skinWidth: 24, skinProtect: 0.80,
      splitShH: 258, splitShS: 0.20, splitHiH: 50, splitHiS: 0.05, splitBal: 0.5,
      hlRoll: 0.45, hlKnee: 0.72, fade: 0.0
    })
  ];

  C.LOOKS = LOOKS;
  C.LOOKBY = {};
  LOOKS.forEach(function (l, i) { l.index = i; C.LOOKBY[l.id] = l; });

  C.lookLabel = function (l) {
    if (!C.SHOW_REF_NAMES) return l.code + ' · ' + l.name;
    return l.code + ' · ' + l.name + '  [' + (l.ref.match(/VSCO\s+(\S+)/) || [, '?'])[1] + ']';
  };

})(window.VE);
