/* ============================================================
   rgb_lab — COLOR ENGINE · LUT 3D
   ------------------------------------------------------------
   Gera o LUT do LOOK, não da cadeia inteira. É a diferença que
   a spec pede em §16:

       PERFIL DE ENTRADA → ESPAÇO DE TRABALHO → [ LUT ] → SAÍDA

   e nunca VÍDEO → LUT direto, porque um .cube não sabe o que os
   números que recebe significam. Por isso o cabeçalho do arquivo
   declara em que domínio ele espera receber a imagem: quem aplicar
   o LUT precisa ter feito a normalização antes.

   Dois domínios possíveis:
     'srgb'  — o de sempre: a imagem já em Rec.709/sRGB de exibição.
               É o que Resolve, Premiere e afins esperam de um LUT
               criativo. Padrão.
     'log'   — domínio log do motor (0.18 → 0.5). Mais precisão nas
               sombras; exige que a entrada esteja nesse mesmo log.
   ============================================================ */
(function (VE) {
  'use strict';

  var C = VE.color = VE.color || {};

  /* codifica/decodifica o domínio do LUT */
  function domDecode(v, domain) {
    if (domain === 'log') return C.logDec(v);
    return C.TF.srgb.decode(v);          /* sRGB de exibição → linear */
  }
  function domEncode(v, domain) {
    if (domain === 'log') return C.logEnc(Math.max(v, 1e-6));
    return C.TF.srgb.encode(Math.max(v, 0));
  }

  /* ================================================ GERAÇÃO =============
     size³ amostras. 33 é o padrão da indústria; 65 para conferência.    */
  C.makeLUT3D = function (lookId, opts) {
    opts = opts || {};
    var size = opts.size || 33;
    var domain = opts.domain || 'srgb';
    var strength = opts.strength === undefined ? 1 : opts.strength;
    var look = C.LOOKBY[lookId];
    if (!look) return null;
    var L = C.resolveLook(look, strength, opts.adv);

    var n = size * size * size;
    var out = new Float32Array(n * 3);
    var i = 0;
    /* ordem do .cube: vermelho varia mais rápido, depois verde, depois azul */
    for (var b = 0; b < size; b++) {
      for (var g = 0; g < size; g++) {
        for (var r = 0; r < size; r++) {
          var lin = [
            domDecode(r / (size - 1), domain),
            domDecode(g / (size - 1), domain),
            domDecode(b / (size - 1), domain)
          ];
          var c = C.applyLook(lin, L);
          out[i++] = domEncode(c[0], domain);
          out[i++] = domEncode(c[1], domain);
          out[i++] = domEncode(c[2], domain);
        }
      }
    }
    return { data: out, size: size, domain: domain, look: look, strength: strength };
  };

  /* ================================================ .cube =============== */
  C.lutToCube = function (lut) {
    var L = lut.look;
    var h = [];
    h.push('# rgb_lab — color engine');
    h.push('# look: ' + L.code + ' ' + L.name + '  (' + L.status + ')');
    h.push('# ' + L.ref);
    h.push('#');
    h.push('# ESTE LUT E O LOOK CRIATIVO, NAO A CADEIA INTEIRA.');
    h.push('# Aplique somente depois de normalizar a entrada:');
    h.push('#   perfil de entrada -> espaco de trabalho -> [este LUT] -> saida');
    h.push('# Dominio esperado na entrada: ' + (lut.domain === 'log'
      ? 'log do motor (0.18 -> 0.5, 13 stops)'
      : 'Rec.709 / sRGB de exibicao'));
    h.push('# Espaco de trabalho: linear ' + C.WORKING);
    h.push('# Forca do look: ' + lut.strength.toFixed(3));
    h.push('# Grao, fade e vinheta NAO estao inclusos: sao ferramentas separadas.');
    h.push('#');
    h.push('TITLE "rgb_lab ' + L.code + ' ' + L.name + '"');
    h.push('LUT_3D_SIZE ' + lut.size);
    h.push('DOMAIN_MIN 0.0 0.0 0.0');
    h.push('DOMAIN_MAX 1.0 1.0 1.0');
    h.push('');
    var d = lut.data, body = new Array(lut.size * lut.size * lut.size);
    for (var i = 0, j = 0; i < body.length; i++, j += 3) {
      body[i] = d[j].toFixed(6) + ' ' + d[j + 1].toFixed(6) + ' ' + d[j + 2].toFixed(6);
    }
    return h.join('\n') + '\n' + body.join('\n') + '\n';
  };

  /* ============================================ LUT 1D DE CURVA =========
     §15 pede as curvas amostradas em 1024 pontos. Aqui estão — geradas a
     partir da mesma forma analítica que o shader avalia.                */
  C.curveLUT = function (lookId, strength, n) {
    var look = C.LOOKBY[lookId];
    if (!look) return null;
    var L = C.resolveLook(look, strength === undefined ? 1 : strength);
    return {
      n: n || 1024,
      master: C.sampleCurve(L, 1, n || 1024),   /* verde ≈ mestre */
      r: C.sampleCurve(L, 0, n || 1024),
      g: C.sampleCurve(L, 1, n || 1024),
      b: C.sampleCurve(L, 2, n || 1024)
    };
  };

  /* ============================================== EXPORTAR ==============
     Salva um .cube por look. Usa o mesmo VE.saveFile do resto do sistema. */
  C.exportCube = function (lookId, opts) {
    var lut = C.makeLUT3D(lookId, opts);
    if (!lut) return false;
    var txt = C.lutToCube(lut);
    var name = 'rgb_lab-' + lut.look.code + '-' + lut.look.name.toLowerCase() +
      '-' + lut.size + (lut.domain === 'log' ? '-log' : '') + '.cube';
    VE.saveFile(name, new Blob([txt], { type: 'text/plain' }));
    return name;
  };

  C.exportAllCubes = function (opts) {
    var names = [];
    C.LOOKS.forEach(function (l) { names.push(C.exportCube(l.id, opts)); });
    return names;
  };

  /* =========================== APLICAR UM LUT (para conferência) ========
     Interpolação trilinear, igual à que uma GPU faria. Serve para medir
     quanto o LUT de 33³ perde em relação à matemática contínua.         */
  C.sampleLUT3D = function (lut, rgb) {
    var s = lut.size, d = lut.data;
    var p = [0, 1, 2].map(function (i) {
      return C.clamp(rgb[i], 0, 1) * (s - 1);
    });
    var i0 = p.map(Math.floor).map(function (v) { return Math.min(v, s - 2); });
    var fr = [0, 1, 2].map(function (i) { return p[i] - i0[i]; });
    function at(x, y, z) {
      var k = ((z * s + y) * s + x) * 3;
      return [d[k], d[k + 1], d[k + 2]];
    }
    var out = [0, 0, 0];
    for (var c = 0; c < 8; c++) {
      var dx = c & 1, dy = (c >> 1) & 1, dz = (c >> 2) & 1;
      var w = (dx ? fr[0] : 1 - fr[0]) * (dy ? fr[1] : 1 - fr[1]) * (dz ? fr[2] : 1 - fr[2]);
      if (w <= 0) continue;
      var v = at(i0[0] + dx, i0[1] + dy, i0[2] + dz);
      out[0] += v[0] * w; out[1] += v[1] * w; out[2] += v[2] * w;
    }
    return out;
  };

})(window.VE);
