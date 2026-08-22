/* ============================================================
   rgb_lab — ANALISADOR DO ESTABILIZADOR
   ------------------------------------------------------------
   O shader `estabilizador` só APLICA a correção. Quem mede o tremor
   é este arquivo.

   Como funciona
   -------------
   1. O quadro pronto é reduzido a uma grade de 64×64 e lido de volta
      para a CPU (uma leitura de 16 KB por quadro — só quando o efeito
      está no ar).
   2. Dessa grade saem dois PERFIS DE PROJEÇÃO: a soma de cada linha e
      a soma de cada coluna. Duas curvas de 64 números.
   3. Cada perfil é comparado com o do quadro anterior, procurando o
      deslocamento que melhor encaixa (soma de diferenças absolutas),
      com refinamento por parábola para dar resolução de sub-pixel.
      Perfil de coluna → deslocamento horizontal.
      Perfil de linha  → deslocamento vertical.
   4. O deslocamento medido entra num controlador de primeira ordem:

        correcao += medido × força        cancela o que acabou de tremer
        correcao *= (1 − vazamento)       devolve devagar, para que um
                                          movimento INTENCIONAL de câmera
                                          continue passando

   Como a medição é feita no quadro JÁ CORRIGIDO, o que se mede é o
   resíduo: a malha é fechada e não oscila para força entre 0 e 1.

   Custo: uma leitura pequena por quadro e ~2 mil comparações. Nada
   perto de um passe de shader.
   ============================================================ */
(function (VE) {
  'use strict';

  var N = 64;              /* lado da grade de análise */
  var RANGE = 10;          /* busca de ±10 células ≈ ±16% do quadro */

  var S = VE.stab = {
    wanted: false,         /* ligado pelo motor quando uStab aparece */
    forca: 0.85,
    vazamento: 0.03,
    limite: 0.14,          /* correção máxima, em fração do quadro */
    cur: { x: 0, y: 0, conf: 0 },
    medido: { x: 0, y: 0 },
    ativo: false
  };

  var target = null, pixels = null;
  var prevCol = null, prevRow = null;
  var curCol = new Float32Array(N), curRow = new Float32Array(N);

  S.value = function () { return S.cur; };

  S.reset = function () {
    S.cur.x = 0; S.cur.y = 0; S.cur.conf = 0;
    S.medido.x = 0; S.medido.y = 0;
    prevCol = null; prevRow = null;
  };

  /* melhor deslocamento entre dois perfis, por soma de diferenças
     absolutas, com refino por parábola nos três pontos do fundo do vale */
  function melhorDeslocamento(a, b) {
    var best = 0, bestE = Infinity, soma = 0, n = 0;
    var custo = new Float32Array(RANGE * 2 + 1);
    for (var d = -RANGE; d <= RANGE; d++) {
      var e = 0, cnt = 0;
      for (var i = 0; i < N; i++) {
        var j = i - d;
        if (j < 0 || j >= N) continue;
        e += Math.abs(a[i] - b[j]);
        cnt++;
      }
      if (!cnt) { custo[d + RANGE] = Infinity; continue; }
      e /= cnt;
      custo[d + RANGE] = e;
      soma += e; n++;
      if (e < bestE) { bestE = e; best = d; }
    }
    if (!n || !isFinite(bestE)) return { d: 0, conf: 0 };

    /* refino de sub-célula: parábola pelos três pontos em volta */
    var k = best + RANGE;
    var sub = 0;
    if (k > 0 && k < custo.length - 1) {
      var y0 = custo[k - 1], y1 = custo[k], y2 = custo[k + 1];
      var den = (y0 - 2 * y1 + y2);
      if (isFinite(den) && Math.abs(den) > 1e-9) {
        sub = 0.5 * (y0 - y2) / den;
        if (!isFinite(sub) || Math.abs(sub) > 1) sub = 0;
      }
    }
    /* confiança: quanto o vale é mais fundo que a média do custo */
    var media = soma / n;
    var conf = media > 1e-6 ? Math.max(0, Math.min(1, (media - bestE) / media * 2.2)) : 0;
    return { d: best + sub, conf: conf };
  }

  S.analyze = function (renderer, fboFinal) {
    var gl = renderer.gl;
    if (!gl) return;
    if (!target) {
      target = renderer.mkTarget();
      gl.bindTexture(gl.TEXTURE_2D, target.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      pixels = new Uint8Array(N * N * 4);
    }
    renderer.downsample(fboFinal.tex, target, N, N);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
    gl.readPixels(0, 0, N, N, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    curCol.fill(0); curRow.fill(0);
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var o = (y * N + x) * 4;
        var l = (pixels[o] * 0.2126 + pixels[o + 1] * 0.7152 + pixels[o + 2] * 0.0722) / 255;
        curCol[x] += l;
        curRow[y] += l;
      }
    }

    if (!prevCol) {
      prevCol = new Float32Array(curCol);
      prevRow = new Float32Array(curRow);
      S.ativo = true;
      return;
    }

    var mx = melhorDeslocamento(curCol, prevCol);
    var my = melhorDeslocamento(curRow, prevRow);
    prevCol.set(curCol); prevRow.set(curRow);

    /* célula → fração do quadro. O eixo Y da leitura é o do WebGL,
       que já bate com o uv do shader.                                */
    var dx = mx.d / N, dy = my.d / N;
    var conf = Math.min(mx.conf, my.conf);
    S.medido.x = dx; S.medido.y = dy;

    /* movimento absurdo (corte, mudança de plano) não é tremor */
    if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25 || conf < 0.05) {
      S.cur.conf = conf;
      S.cur.x *= (1 - S.vazamento * 4);
      S.cur.y *= (1 - S.vazamento * 4);
      return;
    }

    var f = S.forca * (0.35 + 0.65 * conf);
    S.cur.x = (S.cur.x + dx * f) * (1 - S.vazamento);
    S.cur.y = (S.cur.y + dy * f) * (1 - S.vazamento);
    var lim = S.limite;
    S.cur.x = Math.max(-lim, Math.min(lim, S.cur.x));
    S.cur.y = Math.max(-lim, Math.min(lim, S.cur.y));
    S.cur.conf = conf;
    S.ativo = true;
  };

  /* pular no tempo invalida a comparação: dois quadros que não se
     seguem produziriam um "tremor" gigante que não existiu.          */
  if (VE.on) {
    VE.on('seek', S.reset);
    VE.on('project', function () { /* mantém: corte de clipe já é tratado pela confiança */ });
  }

})(window.VE);
