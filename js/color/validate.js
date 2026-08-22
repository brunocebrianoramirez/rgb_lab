/* ============================================================
   rgb_lab — COLOR ENGINE · MEDIÇÃO
   ------------------------------------------------------------
   O QUE ESTES NÚMEROS SÃO — e o que eles não são.

   Não existe imagem oficial de referência contra a qual comparar.
   Portanto NENHUMA medida aqui prova equivalência com produto
   nenhum, e a classificação dos cinco looks continua sendo
   RECONSTRUCTED / APPROXIMATE. §24 e §25 da spec.

   O que dá para medir de verdade, e é o que este arquivo mede:

   1. CONCORDÂNCIA GPU × REFERÊNCIA
      O shader e o motor em JS são duas implementações da mesma
      matemática. Se discordarem, o LUT exportado mente. Esta é a
      única medida aqui que tem certo e errado — alvo: ΔE2000 < 1.

   2. MAGNITUDE DO LOOK
      Quanto cada look move a imagem. Serve para comparar os cinco
      entre si e pegar exagero, não para julgar acerto.

   3. ESTABILIDADE DE PELE
      Quanto o matiz da pele girou em OKLCH. É o número que responde
      "a pele virou laranja?". Alvo: giro < 4° e ΔE de pele abaixo
      da média geral do look.

   4. PERDA DO LUT 33³
      Quanto a quantização do .cube custa em relação à matemática
      contínua.
   ============================================================ */
(function (VE) {
  'use strict';

  var C = VE.color = VE.color || {};

  /* =============================================== CIELAB ============== */
  var XYZ_D65 = [0.95047, 1.0, 1.08883];

  C.linToXYZ = function (c) {
    return [
      0.4124564 * c[0] + 0.3575761 * c[1] + 0.1804375 * c[2],
      0.2126729 * c[0] + 0.7151522 * c[1] + 0.0721750 * c[2],
      0.0193339 * c[0] + 0.1191920 * c[1] + 0.9503041 * c[2]
    ];
  };

  C.xyzToLab = function (X) {
    function fx(t) { return t > 0.008856451679 ? Math.cbrt(t) : (903.2962962 * t + 16) / 116; }
    var x = fx(X[0] / XYZ_D65[0]), y = fx(X[1] / XYZ_D65[1]), z = fx(X[2] / XYZ_D65[2]);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };

  C.srgbToLab = function (rgb) {
    return C.xyzToLab(C.linToXYZ(rgb.map(C.TF.srgb.decode)));
  };

  /* ============================================== ΔE2000 ===============
     CIE 2000, fórmula completa. kL=kC=kH=1.                             */
  C.deltaE2000 = function (l1, l2) {
    var L1 = l1[0], a1 = l1[1], b1 = l1[2];
    var L2 = l2[0], a2 = l2[1], b2 = l2[2];
    var rad = Math.PI / 180, deg = 180 / Math.PI;
    var C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
    var Cb = (C1 + C2) / 2;
    var G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
    var ap1 = (1 + G) * a1, ap2 = (1 + G) * a2;
    var Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
    var hp1 = (Math.atan2(b1, ap1) * deg + 360) % 360;
    var hp2 = (Math.atan2(b2, ap2) * deg + 360) % 360;
    if (Cp1 === 0) hp1 = 0;
    if (Cp2 === 0) hp2 = 0;

    var dL = L2 - L1, dC = Cp2 - Cp1;
    var dh;
    if (Cp1 * Cp2 === 0) dh = 0;
    else {
      dh = hp2 - hp1;
      if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
    }
    var dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dh / 2 * rad);

    var Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2;
    var hpb;
    if (Cp1 * Cp2 === 0) hpb = hp1 + hp2;
    else {
      hpb = hp1 + hp2;
      if (Math.abs(hp1 - hp2) > 180) hpb += (hpb < 360) ? 360 : -360;
      hpb /= 2;
    }
    var T = 1 - 0.17 * Math.cos((hpb - 30) * rad) + 0.24 * Math.cos(2 * hpb * rad)
      + 0.32 * Math.cos((3 * hpb + 6) * rad) - 0.20 * Math.cos((4 * hpb - 63) * rad);
    var dTh = 30 * Math.exp(-Math.pow((hpb - 275) / 25, 2));
    var Rc = 2 * Math.sqrt(Math.pow(Cpb, 7) / (Math.pow(Cpb, 7) + Math.pow(25, 7)));
    var Sl = 1 + (0.015 * Math.pow(Lb - 50, 2)) / Math.sqrt(20 + Math.pow(Lb - 50, 2));
    var Sc = 1 + 0.045 * Cpb;
    var Sh = 1 + 0.015 * Cpb * T;
    var Rt = -Math.sin(2 * dTh * rad) * Rc;

    return Math.sqrt(
      Math.pow(dL / Sl, 2) + Math.pow(dC / Sc, 2) + Math.pow(dH / Sh, 2) +
      Rt * (dC / Sc) * (dH / Sh)
    );
  };

  /* ΔE em OKLab — perceptualmente mais estável para croma alto */
  C.deltaEOK = function (rgb1, rgb2) {
    var a = C.linToOklab(rgb1.map(C.TF.srgb.decode));
    var b = C.linToOklab(rgb2.map(C.TF.srgb.decode));
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100;
  };

  /* =========================================== CARTA DE TESTE ==========
     Os valores de pele, céu, folhagem e primárias vêm dos patches
     publicados do ColorChecker; os demais são cores de trabalho escolhidas
     para cobrir os casos que a spec pede em §23.                        */
  var CHART = [
    { n: 'PELE CLARA', skin: 1, c: [194, 150, 130] },
    { n: 'PELE PARDA', skin: 1, c: [160, 110, 85] },
    { n: 'PELE ESCURA', skin: 1, c: [115, 82, 68] },
    { n: 'PELE MUITO ESCURA', skin: 1, c: [78, 54, 44] },
    { n: 'CÉU AZUL', c: [91, 122, 156] },
    { n: 'FOLHAGEM', c: [67, 108, 87] },
    { n: 'VERDE VIVO', c: [86, 148, 60] },
    { n: 'PAREDE BRANCA', c: [243, 243, 242] },
    { n: 'CINZA MÉDIO', c: [122, 122, 121] },
    { n: 'PRETO', c: [52, 52, 52] },
    { n: 'VERMELHO SAT.', c: [175, 54, 60] },
    { n: 'AMARELO', c: [231, 199, 31] },
    { n: 'LARANJA', c: [214, 126, 44] },
    { n: 'AZUL PRIMÁRIO', c: [56, 61, 150] },
    { n: 'NEON MAGENTA', c: [255, 0, 180] },
    { n: 'NEON CIANO', c: [0, 220, 255] },
    { n: 'BAIXA LUZ', c: [28, 30, 36] },
    { n: 'HIGH KEY', c: [238, 236, 230] },
    { n: 'CONTRALUZ', c: [250, 244, 214] },
    { n: 'LOW KEY', c: [16, 18, 22] }
  ];
  CHART.forEach(function (p) { p.rgb = p.c.map(function (v) { return v / 255; }); });
  C.CHART = CHART;

  /* desenha a carta num canvas — é a fonte do teste na GPU */
  C.chartCanvas = function (cell) {
    cell = cell || 24;
    var cols = 5, rows = Math.ceil(CHART.length / cols);
    var cv = document.createElement('canvas');
    cv.width = cols * cell; cv.height = rows * cell;
    var x = cv.getContext('2d');
    CHART.forEach(function (p, i) {
      x.fillStyle = 'rgb(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ')';
      x.fillRect((i % cols) * cell, Math.floor(i / cols) * cell, cell, cell);
    });
    return { canvas: cv, cell: cell, cols: cols, rows: rows };
  };

  /* ====================== 1 · CONCORDÂNCIA GPU × REFERÊNCIA ============ */
  var tr = null, tcv = null;

  function gpu() {
    if (tr) return tr;
    tcv = document.createElement('canvas');
    tr = new VE.Renderer(tcv);
    if (tr.failed) { tr = null; return null; }
    return tr;
  }

  /* roda a carta pelo shader e devolve o sRGB de cada patch */
  C.gpuChart = function (lookIndex, strength, profIndex) {
    var r = gpu();
    if (!r) return null;
    var ch = C.chartCanvas(24);
    var W = ch.canvas.width, H = ch.canvas.height;
    r.setSize(W, H);
    /* flip=true: o canvas 2D tem origem em cima e o framebuffer embaixo.
       Sem isso, a leitura sai espelhada e cada patch é comparado com outro. */
    var tex = r.upload('chart', ch.canvas, true);
    if (!tex) return null;
    var aspect = W / H;
    var params = VE.defaults('labgrade');
    params.look = lookIndex;
    params.strength = strength;
    params.prof = profIndex || 0;
    r.renderPlan([
      { kind: 'clip', tex: tex, rect: { x: 0.5, y: 0.5, w: aspect, h: 1 }, angle: 0, opacity: 1, blend: 0, effects: [] },
      { kind: 'adjust', effects: [{ id: 'labgrade', params: params, amount: 1, local: 0, mask: VE.newMask() }] }
    ], 0, {});
    /* lê o centro de cada patch */
    var out = document.createElement('canvas');
    out.width = W; out.height = H;
    out.getContext('2d').drawImage(tcv, 0, 0);
    var d = out.getContext('2d').getImageData(0, 0, W, H).data;
    return CHART.map(function (p, i) {
      var cx = (i % ch.cols) * ch.cell + (ch.cell >> 1);
      var cy = Math.floor(i / ch.cols) * ch.cell + (ch.cell >> 1);
      var k = (cy * W + cx) * 4;
      return [d[k] / 255, d[k + 1] / 255, d[k + 2] / 255];
    });
  };

  /* ================================================ RELATÓRIO ========== */
  C.validate = function (opts) {
    opts = opts || {};
    var strength = opts.strength === undefined ? 1 : opts.strength;
    var lutSize = opts.lutSize || 33;
    var rows = [];

    C.LOOKS.forEach(function (L) {
      var ref = CHART.map(function (p) {
        return C.pipeline(p.rgb, 'srgb', L, strength);
      });
      var got = C.gpuChart(L.index, strength, 0);
      var lut = C.makeLUT3D(L.id, { size: lutSize, strength: strength, domain: 'srgb' });

      var agree = [], magE = [], magOK = [], se = [], sHue = [], lutErr = [], rmse = 0;
      var clipped = 0;   /* §9: filme superexposto comprime, não corta */

      CHART.forEach(function (p, i) {
        var o = C.srgbToLab(p.rgb);
        var rl = C.srgbToLab(ref[i]);
        /* 2 · magnitude do look */
        magE.push(C.deltaE2000(o, rl));
        magOK.push(C.deltaEOK(p.rgb, ref[i]));
        /* só conta o que passou a estourar: branco e neon já entram no limite */
        var wasClip = p.rgb.some(function (v) { return v >= 0.999 || v <= 0.001; });
        if (!wasClip && ref[i].some(function (v) { return v >= 0.999; })) clipped++;
        /* 1 · concordância GPU × JS */
        if (got) {
          agree.push(C.deltaE2000(rl, C.srgbToLab(got[i])));
          for (var k = 0; k < 3; k++) rmse += Math.pow(ref[i][k] - got[i][k], 2);
        }
        /* 3 · estabilidade de pele */
        if (p.skin) {
          se.push(C.deltaE2000(o, rl));
          var h0 = C.oklabToLch(C.linToOklab(p.rgb.map(C.TF.srgb.decode)))[2];
          var h1 = C.oklabToLch(C.linToOklab(ref[i].map(C.TF.srgb.decode)))[2];
          var dh = Math.abs(h1 - h0); if (dh > 180) dh = 360 - dh;
          sHue.push(dh);
        }
        /* 4 · perda do LUT 33³ */
        if (lut) lutErr.push(C.deltaE2000(rl, C.srgbToLab(C.sampleLUT3D(lut, p.rgb))));
      });

      function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
      function max(a) { return a.length ? Math.max.apply(null, a) : 0; }

      rows.push({
        code: L.code, name: L.name, status: L.status,
        gpuMean: mean(agree), gpuMax: max(agree),
        rmse: got ? Math.sqrt(rmse / (CHART.length * 3)) : null,
        magMean: mean(magE), magMax: max(magE), magOK: mean(magOK), clipped: clipped,
        skinMean: mean(se), skinHueMax: max(sHue),
        lutMean: mean(lutErr), lutMax: max(lutErr),
        ok: max(agree) < 1.0 && max(sHue) < 6.0 && clipped === 0
      });
    });
    return { strength: strength, lutSize: lutSize, rows: rows, chart: CHART.length };
  };

  /* imprime bonito no console */
  C.report = function (opts) {
    var v = C.validate(opts);
    var pad = function (s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); };
    var out = [];
    out.push('rgb_lab · color engine — medição em ' + v.chart + ' amostras, força ' + v.strength);
    out.push('');
    out.push(pad('LOOK', 18) + pad('GPU×REF', 18) + pad('MAGNITUDE', 16) + pad('PELE', 20) + pad('LUT ' + v.lutSize + '³', 14));
    out.push('-'.repeat(86));
    v.rows.forEach(function (r) {
      out.push(
        pad(r.code + ' ' + r.name, 18) +
        pad('méd ' + r.gpuMean.toFixed(2) + ' máx ' + r.gpuMax.toFixed(2), 18) +
        pad('ΔE ' + r.magMean.toFixed(1) + '/' + r.magMax.toFixed(1), 16) +
        pad('ΔE ' + r.skinMean.toFixed(1) + ' giro ' + r.skinHueMax.toFixed(1) + '°', 20) +
        pad('méd ' + r.lutMean.toFixed(2), 14) +
        (r.ok ? 'OK' : 'CONFERIR')
      );
    });
    out.push('');
    out.push('GPU×REF  = shader contra a referência em JS. É a única coluna com certo e errado (alvo < 1.0).');
    out.push('MAGNITUDE= quanto o look move a imagem. Comparação entre looks, não medida de acerto.');
    out.push('PELE     = desvio nas 4 amostras de pele e maior giro de matiz (alvo < 4°).');
    out.push('LUT      = perda da quantização 33³ contra a matemática contínua.');
    out.push('');
    out.push('Os cinco looks são RECONSTRUCTED. Não há imagem oficial de referência,');
    out.push('portanto nada aqui prova equivalência com produto de terceiros.');
    console.log(out.join('\n'));
    return v;
  };

})(window.VE);
