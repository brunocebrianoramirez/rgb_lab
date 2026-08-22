/* ============================================================
   rgb_lab — COLOR ENGINE · PERFIS DE ENTRADA
   ------------------------------------------------------------
   Um PERFIL DE ENTRADA não é um look. Ele responde a uma única
   pergunta: "o que estes números significam?" — e transforma o
   sinal que chegou num espaço de trabalho linear e conhecido.

       SINAL DA CÂMERA
            ↓  função de transferência (decode)
       LUZ LINEAR nas primárias da câmera
            ↓  matriz de primárias
       LUZ LINEAR no espaço de trabalho
            ↓  ←── só aqui o look criativo entra
       ...

   Por isso o mesmo look aplicado a um Rec.709 já convertido NÃO é
   matematicamente igual ao mesmo look aplicado a um S-Log3 cru.
   Quem normaliza é este arquivo; quem interpreta é looks.js.

   PROCEDÊNCIA DOS NÚMEROS
   Todas as funções de transferência abaixo vêm de documentação
   pública (norma ou white paper do fabricante). Cada perfil declara
   o próprio grau de confiança em `conf`:
       'alta'  — norma pública, conferida
       'media' — white paper do fabricante, transcrito de memória:
                 CONFERIR antes de usar em produção
   Nada aqui foi extraído de software proprietário.
   ============================================================ */
(function (VE) {
  'use strict';

  var C = VE.color = VE.color || {};

  /* ============================================ ÁLGEBRA DE MATRIZ ======== */

  C.matMul = function (a, b) {
    var o = new Array(9);
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    }
    return o;
  };

  C.matApply = function (m, v) {
    return [
      m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
      m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
      m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
    ];
  };

  C.matInv = function (m) {
    var a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5], g = m[6], h = m[7], i = m[8];
    var A = e * i - f * h, B = -(d * i - f * g), Cc = d * h - e * g;
    var det = a * A + b * B + c * Cc;
    if (Math.abs(det) < 1e-12) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    var id = 1 / det;
    return [
      A * id, -(b * i - c * h) * id, (b * f - c * e) * id,
      B * id, (a * i - c * g) * id, -(a * f - c * d) * id,
      Cc * id, -(a * h - b * g) * id, (a * e - b * d) * id
    ];
  };

  C.MAT_ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  /* ==================================== PRIMÁRIAS → XYZ (D65) ============
     Construídas a partir das coordenadas xy publicadas de cada gamut,
     pelo método padrão de Bradford-free (RGB→XYZ via ponto branco).      */

  var WP = {
    D65: [0.3127, 0.3290],
    D60: [0.32168, 0.33767]      /* ACES */
  };

  function rgbToXYZ(prim, wp) {
    /* prim = [[xr,yr],[xg,yg],[xb,yb]] ; wp = [xw,yw] */
    var X = [], Y = [], Z = [];
    for (var i = 0; i < 3; i++) {
      var x = prim[i][0], y = prim[i][1];
      X.push(x / y); Y.push(1); Z.push((1 - x - y) / y);
    }
    var M = [X[0], X[1], X[2], Y[0], Y[1], Y[2], Z[0], Z[1], Z[2]];
    var Xw = wp[0] / wp[1], Yw = 1, Zw = (1 - wp[0] - wp[1]) / wp[1];
    var S = C.matApply(C.matInv(M), [Xw, Yw, Zw]);
    return [
      X[0] * S[0], X[1] * S[1], X[2] * S[2],
      Y[0] * S[0], Y[1] * S[1], Y[2] * S[2],
      Z[0] * S[0], Z[1] * S[1], Z[2] * S[2]
    ];
  }
  C.rgbToXYZ = rgbToXYZ;

  /* gamuts publicados */
  var GAMUTS = {
    rec709: { prim: [[0.640, 0.330], [0.300, 0.600], [0.150, 0.060]], wp: WP.D65, conf: 'alta' },
    rec2020: { prim: [[0.708, 0.292], [0.170, 0.797], [0.131, 0.046]], wp: WP.D65, conf: 'alta' },
    p3d65: { prim: [[0.680, 0.320], [0.265, 0.690], [0.150, 0.060]], wp: WP.D65, conf: 'alta' },
    /* gamuts de câmera — coordenadas dos white papers dos fabricantes */
    sgamut3cine: { prim: [[0.766, 0.275], [0.225, 0.800], [0.089, -0.087]], wp: WP.D65, conf: 'media' },
    arriwg3: { prim: [[0.6840, 0.3130], [0.2210, 0.8480], [0.0861, -0.1020]], wp: WP.D65, conf: 'media' },
    canoncinema: { prim: [[0.7400, 0.2700], [0.1700, 1.1400], [0.0800, -0.1000]], wp: WP.D65, conf: 'media' },
    bmdwg4: { prim: [[0.7177, 0.3171], [0.2280, 0.8616], [0.1006, -0.0820]], wp: WP.D65, conf: 'media' },
    acescg: { prim: [[0.713, 0.293], [0.165, 0.830], [0.128, 0.044]], wp: WP.D60, conf: 'alta' }
  };
  C.GAMUTS = GAMUTS;

  /* adaptação cromática de Bradford, para gamuts que não são D65 */
  var BRADFORD = [0.8951, 0.2664, -0.1614, -0.7502, 1.7135, 0.0367, 0.0389, -0.0685, 1.0296];
  function adaptD65(m, wp) {
    if (wp[0] === WP.D65[0] && wp[1] === WP.D65[1]) return m;
    var src = [wp[0] / wp[1], 1, (1 - wp[0] - wp[1]) / wp[1]];
    var dst = [WP.D65[0] / WP.D65[1], 1, (1 - WP.D65[0] - WP.D65[1]) / WP.D65[1]];
    var s = C.matApply(BRADFORD, src), d = C.matApply(BRADFORD, dst);
    var scale = [d[0] / s[0], 0, 0, 0, d[1] / s[1], 0, 0, 0, d[2] / s[2]];
    var adapt = C.matMul(C.matInv(BRADFORD), C.matMul(scale, BRADFORD));
    return C.matMul(adapt, m);
  }

  /* matriz de conversão entre dois gamuts, já adaptada para D65 */
  C.gamutMatrix = function (from, to) {
    var a = GAMUTS[from], b = GAMUTS[to];
    if (!a || !b) return C.MAT_ID.slice();
    var A = adaptD65(rgbToXYZ(a.prim, a.wp), a.wp);
    var B = adaptD65(rgbToXYZ(b.prim, b.wp), b.wp);
    return C.matMul(C.matInv(B), A);
  };

  /* ============================== FUNÇÕES DE TRANSFERÊNCIA ==============
     decode: sinal codificado → luz linear (relativa, 0.18 = cinza médio)
     encode: o caminho de volta                                          */

  var TF = {};

  /* --- sRGB (IEC 61966-2-1) — norma pública -------------------------- */
  TF.srgb = {
    conf: 'alta', scene: false,
    decode: function (v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); },
    encode: function (v) { return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; },
    glslDecode: 'x <= 0.04045 ? x/12.92 : pow((x + 0.055)/1.055, 2.4)',
    glslEncode: 'x <= 0.0031308 ? x*12.92 : 1.055*pow(max(x,0.0), 1.0/2.4) - 0.055'
  };

  /* --- BT.1886 — EOTF de referência de um monitor Rec.709 ------------ */
  TF.bt1886 = {
    conf: 'alta', scene: false,
    decode: function (v) { return Math.pow(Math.max(v, 0), 2.4); },
    encode: function (v) { return Math.pow(Math.max(v, 0), 1 / 2.4); },
    glslDecode: 'pow(max(x,0.0), 2.4)',
    glslEncode: 'pow(max(x,0.0), 1.0/2.4)'
  };

  /* --- Rec.709 OETF de câmera (ITU-R BT.709) ------------------------- */
  TF.rec709 = {
    conf: 'alta', scene: false,
    decode: function (v) { return v < 0.081 ? v / 4.5 : Math.pow((v + 0.099) / 1.099, 1 / 0.45); },
    encode: function (v) { return v < 0.018 ? v * 4.5 : 1.099 * Math.pow(v, 0.45) - 0.099; },
    glslDecode: 'x < 0.081 ? x/4.5 : pow((x + 0.099)/1.099, 1.0/0.45)',
    glslEncode: 'x < 0.018 ? x*4.5 : 1.099*pow(max(x,0.0), 0.45) - 0.099'
  };

  /* --- PQ / SMPTE ST 2084 (BT.2100) — devolve nits/10000 ------------- */
  var m1 = 2610 / 16384, m2 = 2523 / 4096 * 128, c1 = 3424 / 4096, c2 = 2413 / 4096 * 32, c3 = 2392 / 4096 * 32;
  TF.pq = {
    conf: 'alta', scene: false, hdr: true, peak: 10000,
    decode: function (v) {
      var p = Math.pow(Math.max(v, 0), 1 / m2);
      return Math.pow(Math.max(p - c1, 0) / (c2 - c3 * p), 1 / m1);
    },
    encode: function (v) {
      var y = Math.pow(Math.max(v, 0), m1);
      return Math.pow((c1 + c2 * y) / (1 + c3 * y), m2);
    },
    glslDecode: 'pqDecode(x)', glslEncode: 'pqEncode(x)'
  };

  /* --- HLG (BT.2100) ------------------------------------------------- */
  var ha = 0.17883277, hb = 1 - 4 * ha, hc = 0.5 - ha * Math.log(4 * ha);
  TF.hlg = {
    conf: 'alta', scene: true, hdr: true,
    decode: function (v) { return v <= 0.5 ? (v * v) / 3 : (Math.exp((v - hc) / ha) + hb) / 12; },
    encode: function (v) { return v <= 1 / 12 ? Math.sqrt(3 * v) : ha * Math.log(12 * v - hb) + hc; },
    glslDecode: 'hlgDecode(x)', glslEncode: 'hlgEncode(x)'
  };

  /* --- Sony S-Log3 (white paper Sony) -------------------------------- */
  TF.slog3 = {
    conf: 'media', scene: true,
    decode: function (v) {
      return v >= 171.2102946929 / 1023
        ? Math.pow(10, (v * 1023 - 420) / 261.5) * (0.18 + 0.01) - 0.01
        : (v * 1023 - 95) * 0.01125000 / (171.2102946929 - 95);
    },
    encode: function (v) {
      return v >= 0.01125000
        ? (420 + Math.log10((v + 0.01) / (0.18 + 0.01)) * 261.5) / 1023
        : (v * (171.2102946929 - 95) / 0.01125000 + 95) / 1023;
    },
    glslDecode: 'slog3Decode(x)', glslEncode: 'slog3Encode(x)'
  };

  /* --- ARRI LogC3, EI 800 (white paper ARRI) ------------------------- */
  var LC = { a: 5.555556, b: 0.052272, c: 0.247190, d: 0.385537, e: 5.367655, f: 0.092809, cut: 0.010591 };
  TF.logc3 = {
    conf: 'media', scene: true,
    decode: function (v) {
      return v > LC.e * LC.cut + LC.f
        ? (Math.pow(10, (v - LC.d) / LC.c) - LC.b) / LC.a
        : (v - LC.f) / LC.e;
    },
    encode: function (v) {
      return v > LC.cut ? LC.c * Math.log10(LC.a * v + LC.b) + LC.d : LC.e * v + LC.f;
    },
    glslDecode: 'logc3Decode(x)', glslEncode: 'logc3Encode(x)'
  };

  /* --- Canon C-Log3 (white paper Canon) ------------------------------ */
  TF.clog3 = {
    conf: 'media', scene: true,
    decode: function (v) {
      if (v < 0.097465473) return -(Math.pow(10, (0.07623209 - v) / 0.36726845) - 1) / 14.98325;
      if (v <= 0.15277891) return (v - 0.12783901) / 1.9754798;
      return (Math.pow(10, (v - 0.12240537) / 0.36726845) - 1) / 14.98325;
    },
    encode: function (v) {
      if (v < -0.014) return -0.36726845 * Math.log10(1 - 14.98325 * v) + 0.07623209;
      if (v <= 0.014) return 1.9754798 * v + 0.12783901;
      return 0.36726845 * Math.log10(14.98325 * v + 1) + 0.12240537;
    },
    glslDecode: 'clog3Decode(x)', glslEncode: 'clog3Encode(x)'
  };

  /* --- Blackmagic Film Generation 5 ---------------------------------- */
  var BM = {
    A: 0.08692876065491224, B: 0.005494072432257808, C: 0.5300133392291939,
    D: 8.283605932402494, E: 0.09246575342465753, cut: 0.005
  };
  TF.bmdfilm5 = {
    conf: 'media', scene: true,
    decode: function (v) {
      return v < BM.D * BM.cut + BM.E ? (v - BM.E) / BM.D : Math.exp((v - BM.C) / BM.A) - BM.B;
    },
    encode: function (v) {
      return v < BM.cut ? BM.D * v + BM.E : BM.A * Math.log(v + BM.B) + BM.C;
    },
    glslDecode: 'bmdDecode(x)', glslEncode: 'bmdEncode(x)'
  };

  /* --- Apple Log (white paper Apple, 2023) --------------------------- */
  var AP = { R0: -0.05641088, Rt: 0.01, c: 47.28711236, beta: 0.00964052, gamma: 0.08550478, delta: 0.69336945 };
  TF.applelog = {
    conf: 'media', scene: true,
    decode: function (v) {
      var pt = AP.c * Math.pow(AP.Rt - AP.R0, 2);
      if (v < 0) return AP.R0;
      if (v < pt) return Math.sqrt(v / AP.c) + AP.R0;
      return Math.pow(10, (v - AP.delta) / AP.gamma) - AP.beta;
    },
    encode: function (v) {
      if (v < AP.R0) return 0;
      if (v < AP.Rt) return AP.c * Math.pow(v - AP.R0, 2);
      return AP.gamma * Math.log10(v + AP.beta) + AP.delta;
    },
    glslDecode: 'appleDecode(x)', glslEncode: 'appleEncode(x)'
  };

  C.TF = TF;

  /* ======================================== PERFIS DE ENTRADA ==========
     Um perfil junta: primárias + transferência + faixa + ponto branco.  */

  function prof(o) { return o; }

  var PROFILES = [
    prof({
      id: 'srgb', name: 'sRGB / DISPLAY', gamut: 'rec709', tf: 'srgb', range: 'full',
      desc: 'o que o navegador entrega na maioria das vezes', conf: 'alta', scene: false
    }),
    prof({
      id: 'rec709', name: 'REC.709 (BT.1886)', gamut: 'rec709', tf: 'bt1886', range: 'limited',
      desc: 'vídeo de câmera padrão, faixa 16–235', conf: 'alta', scene: false
    }),
    prof({
      id: 'rec709full', name: 'REC.709 FULL', gamut: 'rec709', tf: 'bt1886', range: 'full',
      desc: 'rec.709 já expandido para 0–255', conf: 'alta', scene: false
    }),
    prof({
      id: 'rec709cam', name: 'REC.709 OETF', gamut: 'rec709', tf: 'rec709', range: 'limited',
      desc: 'curva de câmera, não de monitor', conf: 'alta', scene: false
    }),
    prof({
      id: 'p3', name: 'DISPLAY P3', gamut: 'p3d65', tf: 'srgb', range: 'full',
      desc: 'material de celular recente', conf: 'alta', scene: false
    }),
    prof({
      id: 'slog3', name: 'SONY S-LOG3', gamut: 'sgamut3cine', tf: 'slog3', range: 'limited',
      desc: 'S-Gamut3.Cine · referido à cena', conf: 'media', scene: true
    }),
    prof({
      id: 'logc3', name: 'ARRI LOGC3', gamut: 'arriwg3', tf: 'logc3', range: 'limited',
      desc: 'ARRI Wide Gamut 3 · EI 800', conf: 'media', scene: true
    }),
    prof({
      id: 'clog3', name: 'CANON C-LOG3', gamut: 'canoncinema', tf: 'clog3', range: 'limited',
      desc: 'Canon Cinema Gamut', conf: 'media', scene: true
    }),
    prof({
      id: 'bmdfilm', name: 'BLACKMAGIC FILM G5', gamut: 'bmdwg4', tf: 'bmdfilm5', range: 'full',
      desc: 'BMD Wide Gamut · Gen 5', conf: 'media', scene: true
    }),
    prof({
      id: 'applelog', name: 'APPLE LOG', gamut: 'rec2020', tf: 'applelog', range: 'full',
      desc: 'iPhone 15 Pro em diante', conf: 'media', scene: true
    }),
    prof({
      id: 'pq', name: 'HDR · PQ (ST 2084)', gamut: 'rec2020', tf: 'pq', range: 'full',
      desc: 'HDR — precisa de tone mapping antes do look', conf: 'alta', scene: false, hdr: true
    }),
    prof({
      id: 'hlg', name: 'HDR · HLG', gamut: 'rec2020', tf: 'hlg', range: 'full',
      desc: 'HDR — precisa de tone mapping antes do look', conf: 'alta', scene: true, hdr: true
    })
  ];

  C.PROFILES = PROFILES;
  C.PROFBY = {};
  PROFILES.forEach(function (p, i) { p.index = i; C.PROFBY[p.id] = p; });

  /* espaço de trabalho: Rec.709 linear por padrão.
     Trocar aqui muda o espaço de TODA a cadeia — matrizes, bandas e LUTs. */
  C.WORKING = 'rec709';

  /* matriz do perfil para o espaço de trabalho, já pronta */
  C.profileMatrix = function (id) {
    var p = C.PROFBY[id];
    if (!p) return C.MAT_ID.slice();
    return C.gamutMatrix(p.gamut, C.WORKING);
  };

  /* faixa limitada (16–235 em 8 bits) → 0–1 */
  C.expandRange = function (v, range) {
    if (range !== 'limited') return v;
    return (v * 255 - 16) / (235 - 16);
  };

  /* decodifica um pixel do perfil até luz linear no espaço de trabalho */
  C.toWorking = function (rgb, profileId) {
    var p = C.PROFBY[profileId] || C.PROFBY.srgb;
    var tf = TF[p.tf];
    var v = rgb.map(function (x) { return C.expandRange(x, p.range); });
    v = v.map(tf.decode);
    /* HLG é referido à cena mas normalizado: 1.0 = branco de referência */
    if (p.id === 'hlg') v = v.map(function (x) { return x * 12 / 12; });
    return C.matApply(C.profileMatrix(p.id), v);
  };

  /* volta do espaço de trabalho para sRGB de exibição */
  C.toDisplay = function (lin) {
    var m = C.gamutMatrix(C.WORKING, 'rec709');
    var v = C.matApply(m, lin);
    return v.map(TF.srgb.encode);
  };

})(window.VE);
