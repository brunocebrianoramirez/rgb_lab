/* ============================================================
   rgb_lab — COLOR ENGINE · NÚCLEO
   ------------------------------------------------------------
   Implementação de REFERÊNCIA em JS de toda a cadeia criativa.
   O shader em js/fx6.js é o gêmeo dela em GLSL; js/color/validate.js
   mede a diferença entre os dois e falha se passar de 1 ΔE2000.

   Por que existir duas vezes:
   · o shader roda por pixel, em tempo real, na GPU;
   · esta versão gera os LUT .cube, roda os testes de ΔE e serve de
     verdade quando os dois discordam.

   EM QUE DOMÍNIO CADA OPERAÇÃO ACONTECE — e por quê:

     exposição, matriz, saturação, matiz  →  LUZ LINEAR
        são operações físicas; em gamma elas distorcem o matiz.
     contraste e curvas                   →  DOMÍNIO LOG
        curva em S aplicada em linear estoura; em log ela se comporta
        como emulsão. 0.18 vira 0.5, ~13 stops de alcance.
     tonalização dividida, fade           →  DOMÍNIO DE EXIBIÇÃO
        são gestos de laboratório, não de cena.

   Nada aqui foi extraído de software de terceiros. Os parâmetros dos
   looks (js/color/looks.js) são um modelo independente construído a
   partir da direção estética descrita publicamente.
   ============================================================ */
(function (VE) {
  'use strict';

  var C = VE.color = VE.color || {};

  var EPS = 1e-6;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function mix(a, b, t) { return a + (b - a) * t; }
  C.clamp = clamp; C.mix = mix;

  /* =========================================== DOMÍNIO LOG ==============
     Cineon-like: 0.18 (cinza médio) → 0.5, cerca de 13 stops úteis.     */
  var LOG_MID = 0.18, LOG_RANGE = 13.0, LOG_OFF = 6.5;

  C.logEnc = function (x) {
    return (Math.log2(Math.max(x, EPS) / LOG_MID) + LOG_OFF) / LOG_RANGE;
  };
  C.logDec = function (y) {
    return LOG_MID * Math.pow(2, y * LOG_RANGE - LOG_OFF);
  };

  /* Onde o BRANCO DE EXIBIÇÃO (1.0 linear) cai neste log. Note que NÃO é
     1.0: o topo do domínio log é 16× o cinza médio, não branco. Toda a
     curva se ancora aqui — foi confundir os dois que fazia o branco sair
     em 1.74 linear e ser cortado.                                       */
  var LOG_WHITE = (Math.log2(1 / LOG_MID) + LOG_OFF) / LOG_RANGE;   /* ≈ 0.6903 */
  C.LOG_WHITE = LOG_WHITE;

  /* =============================================== OKLab ================
     Björn Ottosson, publicado. Recebe RGB LINEAR (primárias sRGB).      */

  C.linToOklab = function (c) {
    var l = 0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2];
    var m = 0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2];
    var s = 0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2];
    var l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    return [
      0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    ];
  };

  C.oklabToLin = function (L) {
    var l_ = L[0] + 0.3963377774 * L[1] + 0.2158037573 * L[2];
    var m_ = L[0] - 0.1055613458 * L[1] - 0.0638541728 * L[2];
    var s_ = L[0] - 0.0894841775 * L[1] - 1.2914855480 * L[2];
    var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    return [
      +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    ];
  };

  /* OKLCH: L, croma, matiz em graus */
  C.oklabToLch = function (L) {
    var h = Math.atan2(L[2], L[1]) * 180 / Math.PI;
    if (h < 0) h += 360;
    return [L[0], Math.sqrt(L[1] * L[1] + L[2] * L[2]), h];
  };
  C.lchToOklab = function (p) {
    var r = p[2] * Math.PI / 180;
    return [p[0], p[1] * Math.cos(r), p[1] * Math.sin(r)];
  };

  /* ===================================== PESO DE BANDA DE MATIZ =========
     Nunca use limiar duro: cria borda visível entre cores vizinhas.
     Aqui, gaussiana na distância angular — suave e periódica em 360°.   */
  C.hueWeight = function (hue, center, width) {
    var d = Math.abs(hue - center);
    if (d > 180) d = 360 - d;
    var k = d / Math.max(width, 1e-3);
    return Math.exp(-k * k * 2.0);
  };

  /* ============================================ CURVA TONAL =============
     Curva fílmica paramétrica no domínio log. Escolhida no lugar de uma
     spline amostrada porque PARÂMETRO INTERPOLA e LUT amostrada não —
     e a intensidade do look precisa interpolar parâmetros (ver mixLook).

       contrast  inclinação em torno do pivô
       toe       quanto o pé da curva fecha as sombras
       shoulder  quanto o ombro segura as altas luzes                    */

  C.filmCurve = function (x, contrast, pivot, toe, shoulder) {
    var d = x - pivot;
    var y = pivot + d * (1.0 + contrast);
    /* pé: comprime abaixo do pivô */
    if (toe > EPS) {
      var t = clamp((pivot - y) / Math.max(pivot, EPS), 0, 1);
      y -= toe * t * t * pivot * 0.5;
    }
    /* ombro: compressão assintótica em direção ao BRANCO DE EXIBIÇÃO.
       · o joelho anda entre o pivô e o branco conforme `shoulder`;
       · acima do joelho a curva se aproxima do branco e nunca passa;
       · abaixo do joelho nada é tocado — sem isso a sombra inteira era
         achatada no valor do pivô.                                     */
    if (shoulder > EPS) {
      var knee = pivot + (LOG_WHITE - pivot) * (1 - clamp(shoulder, 0, 1) * 0.9);
      if (y > knee) {
        var span = Math.max(LOG_WHITE - knee, EPS);
        y = knee + span * (1 - Math.exp(-(y - knee) / span));
      }
    }
    return y;
  };

  /* lift / gamma / gain por canal, no domínio log */
  C.lgg = function (x, lift, gamma, gain) {
    var y = x * gain + lift;
    if (Math.abs(gamma - 1) > 1e-4) y = Math.sign(y) * Math.pow(Math.abs(y) + EPS, 1 / Math.max(gamma, 0.05));
    return y;
  };

  /* ============================== COMPRESSÃO DE ALTAS LUZES =============
     Roll-off em linear: nunca clampa, comprime assintoticamente.        */
  C.highlightRoll = function (x, amount, knee) {
    if (amount <= EPS || x <= knee) return x;
    var e = x - knee;
    return knee + e / (1.0 + e * amount);
  };

  /* ============================================ LOOK IDENTIDADE ========= */
  C.identityLook = function () {
    return {
      id: '__id', name: 'IDENTIDADE',
      exposure: 0, temp: 0, tint: 0,
      contrast: 0, pivot: 0.5, toe: 0, shoulder: 0,
      lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1],
      mtx: C.MAT_ID.slice(),
      satGlobal: 1, satShadow: 1, satMid: 1, satHigh: 1,
      bands: [],
      skinCenter: 40, skinWidth: 26, skinProtect: 0,
      splitShH: 0, splitShS: 0, splitHiH: 0, splitHiS: 0, splitBal: 0.5,
      hlRoll: 0, hlKnee: 0.75,
      fade: 0, black: 0
    };
  };

  /* completa um look parcial com os padrões da identidade */
  C.fillLook = function (o) {
    var base = C.identityLook();
    Object.keys(o).forEach(function (k) { base[k] = o[k]; });
    base.bands = (o.bands || []).map(function (b) {
      return { c: b.c, w: b.w === undefined ? 30 : b.w, dh: b.dh || 0, ds: b.ds === undefined ? 1 : b.ds, dl: b.dl === undefined ? 1 : b.dl };
    });
    return base;
  };

  /* ================================ INTERPOLAÇÃO DE PARÂMETROS =========
     §21: a força do look interpola OS PARÂMETROS, não a saída. Misturar
     a saída (mix(orig, look, s)) produz matiz intermediário estranho e
     achata o contraste de um jeito que preset nenhum faz.               */
  C.mixLook = function (a, b, t) {
    var o = C.identityLook();
    o.id = b.id; o.name = b.name;
    ['exposure', 'temp', 'tint', 'contrast', 'pivot', 'toe', 'shoulder',
      'satGlobal', 'satShadow', 'satMid', 'satHigh',
      'skinCenter', 'skinWidth', 'skinProtect',
      'splitShH', 'splitShS', 'splitHiH', 'splitHiS', 'splitBal',
      'hlRoll', 'hlKnee', 'fade', 'black'].forEach(function (k) {
        o[k] = mix(a[k], b[k], t);
      });
    ['lift', 'gamma', 'gain'].forEach(function (k) {
      o[k] = [0, 1, 2].map(function (i) { return mix(a[k][i], b[k][i], t); });
    });
    o.mtx = a.mtx.map(function (v, i) { return mix(v, b.mtx[i], t); });
    /* bandas: as do look, com o efeito indo a zero */
    o.bands = b.bands.map(function (bd) {
      return { c: bd.c, w: bd.w, dh: bd.dh * t, ds: mix(1, bd.ds, t), dl: mix(1, bd.dl, t) };
    });
    return o;
  };

  /* aplica o look em força `s`, com os ajustes manuais do painel */
  C.resolveLook = function (look, s, adv) {
    var L = C.mixLook(C.identityLook(), look, clamp(s, 0, 1));
    adv = adv || {};
    /* os quatro controles avançados de §26, somados depois da força */
    if (adv.exposure) L.exposure += adv.exposure;
    if (adv.contrast) L.contrast += adv.contrast;
    if (adv.color) {
      var k = 1 + adv.color;
      L.satGlobal *= k; L.satShadow *= k; L.satMid *= k; L.satHigh *= k;
    }
    if (adv.tone) {
      /* TONE: negativo abre as sombras e apaga as altas luzes (fade) */
      L.fade += Math.max(0, -adv.tone) * 0.10;
      L.shoulder += Math.max(0, -adv.tone) * 0.5;
      L.toe += Math.max(0, adv.tone) * 0.6;
      L.contrast += Math.max(0, adv.tone) * 0.12;
    }
    if (adv.fade) L.fade += adv.fade;
    return L;
  };

  /* ================================================ A CADEIA ============
     rgbIn: já em LUZ LINEAR no espaço de trabalho (profiles.js fez isso).
     Devolve luz linear; quem codifica para exibição é o chamador.       */

  C.applyLook = function (rgbIn, L) {
    var c = [rgbIn[0], rgbIn[1], rgbIn[2]];
    var i;
    /* matiz e croma de ENTRADA — a âncora de pele volta para cá */
    var lchIn = C.oklabToLch(C.linToOklab(rgbIn));

    /* 1 · exposição — linear, é uma multiplicação de luz */
    if (Math.abs(L.exposure) > 1e-5) {
      var e = Math.pow(2, L.exposure);
      c[0] *= e; c[1] *= e; c[2] *= e;
    }

    /* 2 · temperatura e matiz — ganho por canal, aproximação de von Kries */
    if (Math.abs(L.temp) > 1e-5 || Math.abs(L.tint) > 1e-5) {
      c[0] *= 1 + L.temp * 0.28;
      c[2] *= 1 - L.temp * 0.28;
      c[1] *= 1 + L.tint * 0.20;
      c[0] *= 1 - L.tint * 0.07;
      c[2] *= 1 - L.tint * 0.07;
    }

    /* 3 · matriz criativa — em linear, perto da identidade */
    c = C.matApply(L.mtx, c);

    /* 4 · curvas — no domínio LOG */
    var lg = [C.logEnc(Math.max(c[0], 0)), C.logEnc(Math.max(c[1], 0)), C.logEnc(Math.max(c[2], 0))];
    for (i = 0; i < 3; i++) {
      lg[i] = C.filmCurve(lg[i], L.contrast, L.pivot, L.toe, L.shoulder);
      lg[i] = C.lgg(lg[i], L.lift[i], L.gamma[i], L.gain[i]);
    }
    c = [C.logDec(lg[0]), C.logDec(lg[1]), C.logDec(lg[2])];

    /* 5 · matiz e saturação seletivos — em OKLCH, perceptual */
    var lab = C.linToOklab(c);
    var lch = C.oklabToLch(lab);
    var Lum = clamp(lch[0], 0, 1.2);

    /* proteção de pele: peso que anula os ajustes dentro da faixa da pele */
    /* medido no matiz de ENTRADA: depois das curvas o matiz já andou, e
       identificar pele pelo valor deslocado deixa a proteção instável.  */
    var skin = L.skinProtect > 1e-4
      ? C.hueWeight(lchIn[2], L.skinCenter, L.skinWidth) * L.skinProtect : 0;

    var dh = 0, ds = 1, dl = 1;
    for (i = 0; i < L.bands.length; i++) {
      var b = L.bands[i];
      var w = C.hueWeight(lch[2], b.c, b.w);
      /* a pele não é arrastada junto com verde/azul */
      var isSkinBand = C.hueWeight(b.c, L.skinCenter, L.skinWidth) > 0.6;
      if (!isSkinBand) w *= (1 - skin);
      dh += b.dh * w;
      ds *= mix(1, b.ds, w);
      dl *= mix(1, b.dl, w);
    }

    /* saturação por faixa de luminância */
    var wSh = 1 - smooth(0, 0.45, Lum);
    var wHi = smooth(0.55, 1.0, Lum);
    var wMid = 1 - wSh - wHi;
    var satL = L.satShadow * wSh + L.satMid * Math.max(wMid, 0) + L.satHigh * wHi;

    lch[2] = (lch[2] + dh + 360) % 360;
    lch[1] *= ds * L.satGlobal * satL;
    lch[0] *= dl;

    /* ÂNCORA DE PELE — puxa matiz e croma de volta ao que entraram.
       O croma volta para o valor de entrada REESCALADO pela mudança de
       luminância: assim clarear a pele não a deixa lavada, nem escurecer
       a deixa carregada. A luminância em si não é ancorada.            */
    if (skin > 1e-4) {
      var kH = skin * 0.92, kC = skin * 0.80;
      var dAng = ((lchIn[2] - lch[2] + 540) % 360) - 180;
      lch[2] = (lch[2] + dAng * kH + 360) % 360;
      var ratio = lchIn[0] > 1e-4 ? clamp(lch[0] / lchIn[0], 0.4, 2.5) : 1;
      lch[1] = mix(lch[1], lchIn[1] * ratio, kC);
    }

    c = C.oklabToLin(C.lchToOklab(lch));

    /* 6 · compressão de altas luzes — linear, nunca clampa */
    if (L.hlRoll > 1e-4) {
      for (i = 0; i < 3; i++) c[i] = C.highlightRoll(c[i], L.hlRoll, L.hlKnee);
    }

    /* 7 · tonalização dividida — gesto de laboratório, domínio de exibição */
    if (L.splitShS > 1e-4 || L.splitHiS > 1e-4) {
      var lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      var t = smooth(0, 1, Math.pow(clamp(lum, 0, 1), 1 / 2.2));
      var wS = (1 - t) * (1 - L.splitBal * 0.0);
      var wH = t;
      var sh = C.oklabToLin(C.lchToOklab([0.5, L.splitShS * 0.25, L.splitShH]));
      var hi = C.oklabToLin(C.lchToOklab([0.5, L.splitHiS * 0.25, L.splitHiH]));
      var nS = 0.2126 * sh[0] + 0.7152 * sh[1] + 0.0722 * sh[2] + EPS;
      var nH = 0.2126 * hi[0] + 0.7152 * hi[1] + 0.0722 * hi[2] + EPS;
      for (i = 0; i < 3; i++) {
        c[i] *= mix(1, sh[i] / nS, wS * L.splitShS);
        c[i] *= mix(1, hi[i] / nH, wH * L.splitHiS);
      }
    }

    /* 8 · fade e ponto de preto — o último gesto */
    if (L.fade > 1e-4 || Math.abs(L.black) > 1e-4) {
      for (i = 0; i < 3; i++) {
        c[i] = c[i] * (1 - L.fade) + L.fade * 0.055 + L.black;
      }
    }
    /* 9 · o que não cabe no gamute encolhe, não é cortado */
    return C.gamutCompress(c);
  };

  /* ================================= COMPRESSÃO DE GAMUTE ==============
     Encolhe o croma até a cor caber em [0,1], preservando luminância e
     matiz. Chamada no fim da cadeia, antes do transform de saída.       */
  C.gamutCompress = function (c) {
    var lum = clamp(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], 0, 1);
    var mx = Math.max(c[0], c[1], c[2]);
    var mn = Math.min(c[0], c[1], c[2]);
    var t = 1;
    if (mx > 1) t = Math.min(t, (1 - lum) / Math.max(mx - lum, EPS));
    if (mn < 0) t = Math.min(t, lum / Math.max(lum - mn, EPS));
    t = clamp(t, 0, 1);
    if (t >= 1) return c;
    return [lum + (c[0] - lum) * t, lum + (c[1] - lum) * t, lum + (c[2] - lum) * t];
  };

  function smooth(a, b, x) {
    var t = clamp((x - a) / Math.max(b - a, EPS), 0, 1);
    return t * t * (3 - 2 * t);
  }
  C.smooth = smooth;

  /* ====================== CADEIA COMPLETA, DO SINAL À TELA ==============
     É esta função que os testes e o gerador de LUT usam.                */
  C.pipeline = function (rgbEncoded, profileId, look, strength, adv) {
    var lin = C.toWorking(rgbEncoded, profileId);
    var p = C.PROFBY[profileId];
    /* material referido à cena precisa de tone map antes do look */
    /* branco de referência 4.0: com 1.0 o Reinhard estendido vira identidade */
    if (p && p.hdr) lin = lin.map(function (x) { return C.toneMapReinhard(x, 4.0); });
    var L = C.resolveLook(look, strength, adv);
    var out = C.applyLook(lin, L);
    return C.toDisplay(out).map(function (x) { return clamp(x, 0, 1); });
  };

  /* tone map só para entrada HDR: comprime para o alcance de exibição */
  C.toneMapReinhard = function (x, white) {
    var w = Math.max(white, 0.1);
    return x * (1 + x / (w * w)) / (1 + x);
  };

  /* ================== AMOSTRAGEM DE CURVA EM 1024 PONTOS ================
     §15 pede curvas de 1024 amostras. Elas existem — geradas a partir da
     forma analítica — e são o que vai para o .cube e para os testes.    */
  C.sampleCurve = function (L, channel, n) {
    n = n || 1024;
    var out = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = i / (n - 1);
      var lg = C.filmCurve(C.logEnc(Math.max(x, EPS)), L.contrast, L.pivot, L.toe, L.shoulder);
      lg = C.lgg(lg, L.lift[channel], L.gamma[channel], L.gain[channel]);
      out[i] = C.logDec(lg);
    }
    return out;
  };

})(window.VE);
