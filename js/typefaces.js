/* ============================================================
   rgb_lab — TIPOS DO LABORATÓRIO
   ------------------------------------------------------------
   Estas letras não são um arquivo de fonte: são DESENHADAS POR CÓDIGO.
   Cada glifo é um esqueleto — um caminho de traço, não um contorno — e a
   família nasce de PARÂMETROS aplicados sobre esse esqueleto:

       peso · largura · inclinação · ponta · junta · vazado ·
       recorte de estêncil · quantização em grade · tremor

   Duas consequências práticas:

   1. As famílias são originais do rgb_lab. Nada foi decalcado, convertido
      ou renomeado a partir de fonte de terceiros — o que também significa
      que nenhuma delas colide com nome registrado de foundry.

   2. Como o glifo é um TRAÇO com comprimento conhecido, dá para revelá-lo
      progressivamente. É isso que faz a animação de escrita à mão existir:
      a letra é literalmente desenhada, do início ao fim do traço.

   Sistema de coordenadas de um glifo:
       x  → 0 até a largura de avanço
       y  → 0 no topo da maiúscula, 100 na linha de base,
            ~48 na altura-x, até 128 na descendente
   ============================================================ */
(function (VE) {
  'use strict';

  var TF = VE.typefaces = {};

  /* ============================================ ESQUELETO GEOMÉTRICO ======
     Alfabeto de traço único, construção geométrica: circunferências,
     retas e junções em ângulo fechado. É a base de quase toda a família.  */

  var GEO = {
    'A': [70, 'M0,100 L35,0 L70,100 M12,68 L58,68'],
    'B': [68, 'M0,0 L0,100 M0,0 L38,0 Q62,0 62,25 Q62,50 38,50 L0,50 M0,50 L42,50 Q66,50 66,75 Q66,100 42,100 L0,100'],
    'C': [68, 'M66,18 Q52,0 34,0 Q0,0 0,50 Q0,100 34,100 Q52,100 66,82'],
    'D': [70, 'M0,0 L0,100 M0,0 L32,0 Q68,0 68,50 Q68,100 32,100 L0,100'],
    'E': [62, 'M62,0 L0,0 L0,100 L62,100 M0,50 L52,50'],
    'F': [62, 'M62,0 L0,0 L0,100 M0,50 L50,50'],
    'G': [68, 'M66,18 Q52,0 34,0 Q0,0 0,50 Q0,100 34,100 Q66,100 66,68 L66,56 L38,56'],
    'H': [66, 'M0,0 L0,100 M66,0 L66,100 M0,50 L66,50'],
    'I': [16, 'M8,0 L8,100'],
    'J': [52, 'M50,0 L50,74 Q50,100 25,100 Q0,100 0,78'],
    'K': [62, 'M0,0 L0,100 M60,0 L4,54 M22,38 L62,100'],
    'L': [58, 'M0,0 L0,100 L58,100'],
    'M': [80, 'M0,100 L0,0 L40,62 L80,0 L80,100'],
    'N': [66, 'M0,100 L0,0 L66,100 L66,0'],
    'O': [68, 'M34,0 Q68,0 68,50 Q68,100 34,100 Q0,100 0,50 Q0,0 34,0 Z'],
    'P': [64, 'M0,100 L0,0 L38,0 Q64,0 64,28 Q64,56 38,56 L0,56'],
    'Q': [70, 'M34,0 Q68,0 68,50 Q68,100 34,100 Q0,100 0,50 Q0,0 34,0 Z M42,70 L72,110'],
    'R': [66, 'M0,100 L0,0 L38,0 Q64,0 64,28 Q64,56 38,56 L0,56 M34,56 L66,100'],
    'S': [68, 'M62,16 Q52,0 32,0 Q4,0 4,26 Q4,48 34,52 Q66,56 66,76 Q66,100 34,100 Q12,100 2,84'],
    'T': [64, 'M0,0 L64,0 M32,0 L32,100'],
    'U': [66, 'M0,0 L0,68 Q0,100 33,100 Q66,100 66,68 L66,0'],
    'V': [68, 'M0,0 L34,100 L68,0'],
    'W': [96, 'M0,0 L22,100 L48,26 L74,100 L96,0'],
    'X': [64, 'M0,0 L64,100 M64,0 L0,100'],
    'Y': [66, 'M0,0 L33,52 L66,0 M33,52 L33,100'],
    'Z': [62, 'M0,0 L62,0 L0,100 L62,100'],

    '0': [62, 'M31,0 Q62,0 62,50 Q62,100 31,100 Q0,100 0,50 Q0,0 31,0 Z'],
    '1': [40, 'M4,20 L28,0 L28,100'],
    '2': [62, 'M2,20 Q6,0 32,0 Q60,0 60,26 Q60,46 34,62 L2,100 L62,100'],
    '3': [62, 'M4,16 Q12,0 34,0 Q60,0 60,25 Q60,48 32,50 Q62,52 62,76 Q62,100 34,100 Q10,100 2,84'],
    '4': [62, 'M46,100 L46,0 L0,72 L62,72'],
    '5': [62, 'M58,0 L10,0 L4,44 Q20,36 34,38 Q62,42 62,70 Q62,100 32,100 Q10,100 2,86'],
    '6': [60, 'M56,12 Q46,0 30,0 Q0,0 0,54 Q0,100 31,100 Q60,100 60,72 Q60,46 32,46 Q6,46 2,66'],
    '7': [62, 'M0,0 L62,0 L24,100'],
    '8': [60, 'M30,0 Q58,0 58,24 Q58,46 30,48 Q2,50 2,74 Q2,100 30,100 Q58,100 58,74 Q58,50 30,48 Q2,46 2,24 Q2,0 30,0 Z'],
    '9': [60, 'M4,88 Q14,100 30,100 Q60,100 60,46 Q60,0 29,0 Q0,0 0,28 Q0,54 28,54 Q54,54 58,34'],

    '.': [22, 'M6,97 L6,100'],
    ',': [22, 'M8,94 L2,118'],
    ':': [22, 'M6,52 L6,55 M6,97 L6,100'],
    ';': [22, 'M6,52 L6,55 M8,94 L2,118'],
    '!': [22, 'M6,0 L6,68 M6,97 L6,100'],
    '?': [52, 'M2,20 Q4,0 26,0 Q50,0 50,24 Q50,44 26,54 L26,70 M26,97 L26,100'],
    '-': [42, 'M2,54 L40,54'],
    '–': [56, 'M2,54 L54,54'],
    '_': [60, 'M0,112 L60,112'],
    '/': [44, 'M2,110 L42,-10'],
    '\\': [44, 'M2,-10 L42,110'],
    '|': [20, 'M10,-6 L10,110'],
    '(': [30, 'M26,-8 Q0,50 26,108'],
    ')': [30, 'M4,-8 Q30,50 4,108'],
    '[': [28, 'M26,-6 L8,-6 L8,108 L26,108'],
    ']': [28, 'M2,-6 L20,-6 L20,108 L2,108'],
    '{': [32, 'M28,-6 Q14,-6 14,22 Q14,48 2,50 Q14,52 14,78 Q14,106 28,106'],
    '}': [32, 'M4,-6 Q18,-6 18,22 Q18,48 30,50 Q18,52 18,78 Q18,106 4,106'],
    '&': [70, 'M66,100 L20,44 Q6,26 20,10 Q38,-6 48,10 Q56,24 34,42 L10,60 Q-4,78 12,92 Q34,110 56,80'],
    '#': [56, 'M18,0 L8,100 M44,0 L34,100 M2,32 L54,32 M2,68 L54,68'],
    '*': [42, 'M21,8 L21,58 M2,20 L40,46 M40,20 L2,46'],
    '+': [44, 'M22,26 L22,78 M2,52 L42,52'],
    '=': [44, 'M2,38 L42,38 M2,66 L42,66'],
    '<': [44, 'M40,24 L4,52 L40,80'],
    '>': [44, 'M4,24 L40,52 L4,80'],
    '@': [84, 'M64,74 Q46,86 34,74 Q22,60 34,44 Q46,30 54,44 L54,76 Q56,88 70,82 Q86,70 78,40 Q68,4 36,4 Q2,4 2,52 Q2,100 42,100 Q58,100 70,94'],
    '$': [62, 'M58,18 Q48,4 30,4 Q4,4 4,28 Q4,48 32,52 Q62,56 62,76 Q62,98 32,98 Q10,98 2,84 M31,-8 L31,110'],
    '%': [64, 'M56,0 L8,100 M14,4 Q26,4 26,18 Q26,32 14,32 Q2,32 2,18 Q2,4 14,4 Z M50,68 Q62,68 62,82 Q62,96 50,96 Q38,96 38,82 Q38,68 50,68 Z'],
    "'": [20, 'M9,0 L9,28'],
    '"': [32, 'M8,0 L8,28 M24,0 L24,28'],
    '“': [34, 'M8,4 L4,28 M26,4 L22,28'],
    '”': [34, 'M4,4 L8,28 M22,4 L26,28'],
    '·': [22, 'M6,50 L6,53'],
    ' ': [34, ''],

    /* acentos e cedilha, para o português funcionar de verdade */
    'Á': [70, 'M0,100 L35,0 L70,100 M12,68 L58,68 M28,-30 L48,-46'],
    'À': [70, 'M0,100 L35,0 L70,100 M12,68 L58,68 M46,-30 L26,-46'],
    'Â': [70, 'M0,100 L35,0 L70,100 M12,68 L58,68 M22,-30 L35,-46 L48,-30'],
    'Ã': [70, 'M0,100 L35,0 L70,100 M12,68 L58,68 M18,-32 Q28,-46 36,-38 Q44,-30 54,-42'],
    'É': [62, 'M62,0 L0,0 L0,100 L62,100 M0,50 L52,50 M24,-30 L44,-46'],
    'Ê': [62, 'M62,0 L0,0 L0,100 L62,100 M0,50 L52,50 M18,-30 L31,-46 L44,-30'],
    'Í': [26, 'M13,0 L13,100 M6,-30 L26,-46'],
    'Ó': [68, 'M34,0 Q68,0 68,50 Q68,100 34,100 Q0,100 0,50 Q0,0 34,0 Z M26,-30 L46,-46'],
    'Ô': [68, 'M34,0 Q68,0 68,50 Q68,100 34,100 Q0,100 0,50 Q0,0 34,0 Z M21,-30 L34,-46 L47,-30'],
    'Õ': [68, 'M34,0 Q68,0 68,50 Q68,100 34,100 Q0,100 0,50 Q0,0 34,0 Z M17,-32 Q27,-46 35,-38 Q43,-30 53,-42'],
    'Ú': [66, 'M0,0 L0,68 Q0,100 33,100 Q66,100 66,68 L66,0 M26,-30 L46,-46'],
    'Ç': [68, 'M66,18 Q52,0 34,0 Q0,0 0,50 Q0,100 34,100 Q52,100 66,82 M34,100 L34,116 Q34,128 20,124']
  };

  /* ================================================ ESQUELETO CURSIVO =====
     Minúsculas de traço contínuo, com entrada e saída na linha de base
     para que as letras se encontrem. É o esqueleto da família manuscrita. */

  var SCRIPT = {
    'a': [58, 'M46,58 Q42,48 28,48 Q6,48 6,74 Q6,100 26,100 Q42,100 46,88 L46,48 L46,92 Q46,100 58,100'],
    'b': [56, 'M8,0 L8,92 Q8,100 22,100 Q48,100 48,74 Q48,48 26,48 Q13,48 8,58'],
    'c': [54, 'M46,60 Q40,48 26,48 Q6,48 6,74 Q6,100 26,100 Q42,100 50,90'],
    'd': [58, 'M46,0 L46,92 Q46,100 58,100 M46,58 Q42,48 28,48 Q6,48 6,74 Q6,100 26,100 Q42,100 46,88'],
    'e': [54, 'M6,76 L44,76 Q46,48 25,48 Q6,48 6,74 Q6,100 26,100 Q42,100 50,90'],
    'f': [46, 'M34,100 L34,14 Q34,-2 48,2 M12,48 L48,48'],
    'g': [56, 'M46,58 Q42,48 28,48 Q6,48 6,74 Q6,100 26,100 Q42,100 46,88 L46,48 L46,110 Q46,128 24,128 Q10,128 4,116'],
    'h': [56, 'M8,0 L8,100 M8,64 Q16,48 32,48 Q48,48 48,68 L48,100'],
    'i': [28, 'M9,48 L9,92 Q9,100 21,100 M9,22 L9,26'],
    'j': [34, 'M22,48 L22,110 Q22,128 2,124 M22,22 L22,26'],
    'k': [54, 'M8,0 L8,100 M44,48 L8,78 M20,70 L46,100'],
    'l': [30, 'M9,0 L9,92 Q9,100 22,100'],
    'm': [78, 'M6,100 L6,48 M6,64 Q13,48 25,48 Q38,48 38,68 L38,100 M38,64 Q45,48 57,48 Q70,48 70,68 L70,100'],
    'n': [54, 'M6,100 L6,48 M6,64 Q13,48 27,48 Q44,48 44,68 L44,100'],
    'o': [56, 'M28,48 Q48,48 48,74 Q48,100 28,100 Q8,100 8,74 Q8,48 28,48 Z'],
    'p': [56, 'M6,48 L6,128 M6,60 Q13,48 27,48 Q48,48 48,74 Q48,100 27,100 Q13,100 6,88'],
    'q': [56, 'M48,48 L48,128 M48,60 Q41,48 27,48 Q6,48 6,74 Q6,100 27,100 Q41,100 48,88'],
    'r': [46, 'M6,100 L6,48 M6,66 Q13,48 31,48 Q41,48 46,55'],
    's': [50, 'M44,56 Q37,48 24,48 Q8,48 8,62 Q8,72 26,74 Q46,76 46,88 Q46,100 24,100 Q9,100 3,91'],
    't': [42, 'M20,10 L20,92 Q20,100 34,100 M3,48 L39,48'],
    'u': [56, 'M6,48 L6,84 Q6,100 23,100 Q40,100 44,86 L44,48 L44,92 Q44,100 56,100'],
    'v': [52, 'M4,48 L25,100 L48,48'],
    'w': [76, 'M4,48 L21,100 L38,56 L55,100 L72,48'],
    'x': [52, 'M6,48 L46,100 M46,48 L6,100'],
    'y': [52, 'M6,48 L6,84 Q6,100 23,100 Q40,100 44,86 L44,48 L44,110 Q44,128 23,128 Q10,128 5,118'],
    'z': [52, 'M6,48 L46,48 L6,100 L48,100'],
    'á': [58, 'M46,58 Q42,48 28,48 Q6,48 6,74 Q6,100 26,100 Q42,100 46,88 L46,48 L46,92 Q46,100 58,100 M20,26 L38,12'],
    'à': [58, 'M46,58 Q42,48 28,48 Q6,48 6,74 Q6,100 26,100 Q42,100 46,88 L46,48 L46,92 Q46,100 58,100 M38,26 L20,12'],
    'â': [58, 'M46,58 Q42,48 28,48 Q6,48 6,74 Q6,100 26,100 Q42,100 46,88 L46,48 L46,92 Q46,100 58,100 M16,26 L28,12 L40,26'],
    'ã': [58, 'M46,58 Q42,48 28,48 Q6,48 6,74 Q6,100 26,100 Q42,100 46,88 L46,48 L46,92 Q46,100 58,100 M12,24 Q22,10 30,18 Q38,26 46,14'],
    'é': [54, 'M6,76 L44,76 Q46,48 25,48 Q6,48 6,74 Q6,100 26,100 Q42,100 50,90 M18,26 L36,12'],
    'ê': [54, 'M6,76 L44,76 Q46,48 25,48 Q6,48 6,74 Q6,100 26,100 Q42,100 50,90 M14,26 L26,12 L38,26'],
    'í': [28, 'M9,48 L9,92 Q9,100 21,100 M2,26 L20,12'],
    'ó': [56, 'M28,48 Q48,48 48,74 Q48,100 28,100 Q8,100 8,74 Q8,48 28,48 Z M20,26 L38,12'],
    'ô': [56, 'M28,48 Q48,48 48,74 Q48,100 28,100 Q8,100 8,74 Q8,48 28,48 Z M16,26 L28,12 L40,26'],
    'õ': [56, 'M28,48 Q48,48 48,74 Q48,100 28,100 Q8,100 8,74 Q8,48 28,48 Z M12,24 Q22,10 30,18 Q38,26 46,14'],
    'ú': [56, 'M6,48 L6,84 Q6,100 23,100 Q40,100 44,86 L44,48 L44,92 Q44,100 56,100 M18,26 L36,12'],
    'ç': [54, 'M46,60 Q40,48 26,48 Q6,48 6,74 Q6,100 26,100 Q42,100 50,90 M26,100 L26,116 Q26,128 12,124']
  };

  /* ==================================================== FAMÍLIAS ==========
     Cada família é uma leitura diferente do mesmo esqueleto. Os nomes são
     do laboratório: nada aqui deriva de fonte de terceiros.               */

  var FACES = [
    {
      id: 'lab-grotesk', n: 'LAB GROTESK', desc: 'grotesca de laboratório, junta em ângulo',
      set: 'geo', weight: 15, widthK: 1, slant: 0, cap: 'butt', join: 'miter'
    },
    {
      id: 'lab-round', n: 'LAB ROUND', desc: 'traço grosso de ponta redonda',
      set: 'geo', weight: 24, widthK: 1.04, slant: 0, cap: 'round', join: 'round'
    },
    {
      id: 'lab-wide', n: 'LAB WIDE', desc: 'extra larga, técnica, quase um painel',
      set: 'geo', weight: 13, widthK: 1.62, slant: 0, cap: 'round', join: 'round'
    },
    {
      id: 'lab-narrow', n: 'LAB NARROW', desc: 'condensada, para títulos altos',
      set: 'geo', weight: 19, widthK: 0.58, slant: 0, cap: 'butt', join: 'miter'
    },
    {
      id: 'lab-hairline', n: 'LAB HAIRLINE', desc: 'fio de cabelo, contraste zero',
      set: 'geo', weight: 3, widthK: 1.12, slant: 0, cap: 'butt', join: 'miter'
    },
    {
      id: 'lab-oblique', n: 'LAB OBLIQUE', desc: 'inclinada 14°, sem redesenho',
      set: 'geo', weight: 16, widthK: 0.96, slant: -14, cap: 'butt', join: 'miter'
    },
    {
      id: 'lab-stencil', n: 'LAB STENCIL', desc: 'traço cortado, como chapa vazada',
      set: 'geo', weight: 24, widthK: 1.02, slant: 0, cap: 'butt', join: 'miter', stencil: 0.16
    },
    {
      id: 'lab-bitmap', n: 'LAB BITMAP', desc: 'esqueleto encaixado numa grade',
      set: 'geo', weight: 16, widthK: 1, slant: 0, cap: 'butt', join: 'miter', quant: 11
    },
    {
      id: 'lab-hollow', n: 'LAB HOLLOW', desc: 'vazada: contorno duplo do traço',
      set: 'geo', weight: 26, widthK: 1.02, slant: 0, cap: 'butt', join: 'miter', hollow: 0.42
    },
    {
      id: 'lab-script', n: 'LAB SCRIPT', desc: 'manuscrita ligada, monolinear',
      set: 'script', weight: 14, widthK: 1, slant: -8, cap: 'round', join: 'round', join_: true
    },
    {
      id: 'lab-marker', n: 'LAB MARKER', desc: 'manuscrita de marcador grosso',
      set: 'script', weight: 30, widthK: 1.05, slant: -6, cap: 'round', join: 'round', wobble: 1.1
    },
    {
      id: 'lab-brush', n: 'LAB BRUSH', desc: 'pincel: o traço engrossa no meio',
      set: 'script', weight: 22, widthK: 1.02, slant: -10, cap: 'round', join: 'round', pressure: 0.75
    }
  ];

  TF.FACES = FACES;
  TF.FACEBY = {};
  FACES.forEach(function (f) { TF.FACEBY[f.id] = f; });

  /* ================================================= CACHE DE GLIFOS ======
     Path2D para desenhar, e um <path> de SVG fora da tela só para medir o
     comprimento — é o comprimento que faz a animação de escrita andar.    */

  var cache = {};
  var svgNS = 'http://www.w3.org/2000/svg';
  var measurer = null;

  function measurePath(d) {
    if (!measurer) {
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
      svg.style.position = 'absolute'; svg.style.opacity = '0'; svg.style.pointerEvents = 'none';
      measurer = document.createElementNS(svgNS, 'path');
      svg.appendChild(measurer);
      document.body.appendChild(svg);
    }
    measurer.setAttribute('d', d);
    try { return measurer.getTotalLength(); } catch (e) { return 0; }
  }

  /* separa o caminho em subcaminhos: cada 'M' começa um traço novo */
  function splitSub(d) {
    if (!d) return [];
    return d.split(/(?=M)/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* quantiza as coordenadas numa grade — a família BITMAP nasce daqui */
  function quantize(d, grid) {
    return d.replace(/-?\d+(\.\d+)?/g, function (n) {
      return String(Math.round(parseFloat(n) / grid) * grid);
    });
  }

  /* encolhe cada subtraço pelas pontas: é o corte do estêncil */
  function stencilSub(sub, frac) {
    return { d: sub, trim: frac };
  }

  TF.glyph = function (faceId, ch) {
    var key = faceId + '|' + ch;
    if (cache[key]) return cache[key];
    var face = TF.FACEBY[faceId];
    if (!face) return null;

    var table = face.set === 'script' ? SCRIPT : GEO;
    var entry = table[ch];
    /* a família manuscrita usa o esqueleto geométrico nas maiúsculas */
    if (!entry && face.set === 'script') entry = GEO[ch] || GEO[ch.toUpperCase()];
    /* as geométricas são caixa-alta: minúscula vira versalete */
    var smallCap = false;
    if (!entry) {
      var up = ch.toUpperCase();
      if (GEO[up]) { entry = GEO[up]; smallCap = (up !== ch); }
    }
    if (!entry) entry = GEO['?'];

    var adv = entry[0], d = entry[1];
    if (face.quant) d = quantize(d, face.quant);

    var subs = splitSub(d).map(function (sd) {
      var lens = measurePath(sd);
      return { d: sd, path: new Path2D(sd), len: lens };
    });
    var total = subs.reduce(function (a, s) { return a + s.len; }, 0);

    var g = {
      adv: adv, subs: subs, total: total, smallCap: smallCap,
      face: face
    };
    cache[key] = g;
    return g;
  };

  /* largura de avanço já com os parâmetros da família */
  TF.advance = function (faceId, ch, tracking) {
    var g = TF.glyph(faceId, ch);
    if (!g) return 0;
    var face = g.face;
    var k = face.widthK * (g.smallCap ? 0.78 : 1);
    return g.adv * k + (face.weight * 0.5) + (tracking || 0);
  };

  /* ==================================================== DESENHO ===========
     opts = {
       size      corpo em px (altura da maiúscula)
       color     cor do traço
       progress  0..1 — quanto do glifo já foi escrito (1 = inteiro)
       weightK   multiplicador de peso (para pesos animados)
       fillMode  'stroke' | 'both'
     }                                                                     */

  TF.drawGlyph = function (cx, faceId, ch, opts) {
    var g = TF.glyph(faceId, ch);
    if (!g || !g.subs.length) return 0;
    var face = g.face;
    var size = opts.size || 100;
    var scale = size / 100;
    var k = face.widthK * (g.smallCap ? 0.78 : 1);
    var prog = opts.progress === undefined ? 1 : Math.max(0, Math.min(1, opts.progress));
    if (prog <= 0) return g.adv * k * scale;

    var w = face.weight * (opts.weightK === undefined ? 1 : opts.weightK);

    cx.save();
    cx.scale(scale, scale);
    if (face.slant) cx.transform(1, 0, Math.tan(-face.slant * Math.PI / 180), 1, 0, 0);
    if (g.smallCap) cx.scale(0.78, 0.78);
    cx.scale(k / (g.smallCap ? 0.78 : 1), 1);

    cx.lineCap = face.cap || 'butt';
    cx.lineJoin = face.join || 'miter';
    cx.miterLimit = 3;
    cx.strokeStyle = opts.color || '#000';

    /* quanto de comprimento total já foi escrito */
    var budget = g.total * prog;

    for (var i = 0; i < g.subs.length; i++) {
      var s = g.subs[i];
      if (budget <= 0) break;
      var shown = Math.min(s.len, budget);
      budget -= shown;

      /* estêncil: some com um pedacinho das duas pontas de cada traço */
      var dash = null, off = 0;
      if (face.stencil) {
        var cut = s.len * face.stencil * 0.5;
        dash = [Math.max(1, s.len - cut * 2)];
        off = -cut;
      }

      if (shown < s.len - 0.5) {
        /* traço parcial: risca só o pedaço já escrito */
        cx.setLineDash([shown, s.len + 2]);
        cx.lineDashOffset = 0;
      } else if (dash) {
        cx.setLineDash(dash);
        cx.lineDashOffset = off;
      } else {
        cx.setLineDash([]);
      }

      if (face.pressure) {
        /* pincel: o traço engrossa no meio, como pressão de mão */
        var steps = 7;
        for (var st = 0; st < steps; st++) {
          var f0 = st / steps, f1 = (st + 1) / steps;
          var mid = (f0 + f1) / 2;
          var press = 1 - face.pressure * Math.pow(Math.abs(mid * 2 - 1), 1.7);
          cx.lineWidth = w * press;
          var segLen = Math.min(shown, s.len) ;
          cx.setLineDash([0, segLen * f0, segLen * (f1 - f0), s.len + 2]);
          cx.stroke(s.path);
        }
        cx.setLineDash([]);
        continue;
      }

      if (face.hollow) {
        cx.lineWidth = w;
        cx.stroke(s.path);
        cx.save();
        cx.globalCompositeOperation = 'destination-out';
        cx.lineWidth = w * face.hollow;
        cx.stroke(s.path);
        cx.restore();
        continue;
      }

      if (face.wobble) {
        /* marcador: duas passadas levemente fora de registro */
        cx.lineWidth = w;
        cx.stroke(s.path);
        cx.save();
        cx.translate(face.wobble, -face.wobble * 0.6);
        cx.globalAlpha = (cx.globalAlpha || 1) * 0.5;
        cx.lineWidth = w * 0.7;
        cx.stroke(s.path);
        cx.restore();
        continue;
      }

      cx.lineWidth = w;
      cx.stroke(s.path);
    }
    cx.setLineDash([]);
    cx.restore();
    return g.adv * k * scale;
  };

  /* comprimento total de traço de um texto — usado para repartir o tempo
     de escrita proporcionalmente ao desenho de cada letra                 */
  TF.textLength = function (faceId, text) {
    var total = 0;
    Array.from(text || '').forEach(function (ch) {
      var g = TF.glyph(faceId, ch);
      if (g) total += g.total;
    });
    return total;
  };

  TF.glyphLength = function (faceId, ch) {
    var g = TF.glyph(faceId, ch);
    return g ? g.total : 0;
  };

  /* Onde a ponta da caneta está num dado ponto da escrita.
     É o que permite desenhar o "bico" que acompanha o traço.             */
  TF.penPoint = function (faceId, ch, progress) {
    var g = TF.glyph(faceId, ch);
    if (!g || !g.total) return null;
    var budget = g.total * Math.max(0, Math.min(1, progress));
    for (var i = 0; i < g.subs.length; i++) {
      var s = g.subs[i];
      if (budget <= s.len || i === g.subs.length - 1) {
        measurePath(s.d);
        try {
          var pt = measurer.getPointAtLength(Math.min(budget, s.len));
          var face = g.face;
          var k = face.widthK * (g.smallCap ? 0.78 : 1);
          return { x: pt.x * k, y: pt.y * (g.smallCap ? 0.78 : 1) };
        } catch (e) { return null; }
      }
      budget -= s.len;
    }
    return null;
  };

})(window.VE);
