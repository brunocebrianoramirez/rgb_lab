/* ============================================================
   rgb_lab — RASTREIO DE MANCHAS (blob tracking), o analisador
   ------------------------------------------------------------
   O shader `manchas` (fx16.js) só DESENHA as caixas. Quem acha as
   manchas é este arquivo — na CPU, como o estabilizador (stab.js).

   Como funciona
   -------------
   1. A imagem que ENTRA no efeito é reduzida a uma grade de 128 de
      largura (72 de altura num 16:9) e lida de volta: 37 KB por
      quadro, só quando o efeito está no ar.
   2. Cada célula vira SIM ou NÃO conforme a fonte escolhida: clara,
      escura, em movimento (contra a grade do quadro anterior) ou de
      uma cor (distância de matiz).
   3. As células SIM vizinhas (8 vizinhos) viram uma MANCHA: área,
      caixa e centro. Só sobrevivem as maiores que o mínimo, e só as N
      maiores.
   4. RASTREIO: cada mancha procura, entre as do quadro anterior, a de
      centro mais próximo, e herda o NÚMERO dela. É o que faz o rótulo
      "07" continuar sendo o mesmo objeto enquanto ele anda. A caixa
      é suavizada com a anterior para não tremer.
   5. Cada mancha guarda as duas vizinhas mais próximas — as LINHAS que
      ligam as caixas na tela saem daí.

   Tudo sobe para a GPU numa textura de ponto flutuante de 128×20:
     linha 0   caixa de cada mancha (x0, y0, x1, y1) em uv
     linha 1   número, área, centro da vizinha 1 (x, y)
     linhas 2+ os glifos dos dígitos (0-9 : ,), 10×16 cada, para o
               shader escrever "07" e "x,y" sem precisar de fonte
     linha 18  centro da vizinha 2 (x, y), e se ela existe
   O estado (números, caixas anteriores, grade anterior) é POR
   INSTÂNCIA do efeito: dois rastreios em dois clipes não se misturam.
   ============================================================ */
(function (VE) {
  'use strict';

  var M = VE.manchas = {};
  var GW = 128;                 /* largura da grade de análise */
  var MAXM = 32;                /* manchas no máximo (a textura tem 128) */
  var TEXW = 128, TEXH = 20, DIG_W = 10, DIG_H = 16, DIG_Y = 2;
  var GLIFOS = '0123456789:,';

  var estados = {};             /* por instância: { prev: [...], grade: Float32Array, proximoId } */
  var alvo = null, pixels = null, GHatual = 0;
  var tex = null, dados = new Float32Array(TEXW * 2 * 4), dados2 = new Float32Array(TEXW * 4), glifosOk = false;

  function estadoDe(chave) {
    if (!estados[chave]) estados[chave] = { prev: [], grade: null, proximoId: 1 };
    return estados[chave];
  }

  /* --------------------------------------------------- os dígitos ----
     Desenhados uma vez num canvas, lidos como 0/1 e guardados nas
     linhas 2..17 da textura: dígito d ocupa as colunas d*10 .. d*10+9 */
  function glifos() {
    var cv = document.createElement('canvas');
    cv.width = DIG_W * GLIFOS.length; cv.height = DIG_H;
    var c = cv.getContext('2d', { willReadFrequently: true });
    c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 15px "Consolas","Courier New",monospace';
    for (var i = 0; i < GLIFOS.length; i++) c.fillText(GLIFOS[i], i * DIG_W + DIG_W / 2, DIG_H / 2 + 1);
    var d = c.getImageData(0, 0, cv.width, cv.height).data;
    var out = new Float32Array(TEXW * DIG_H * 4);
    for (var y = 0; y < DIG_H; y++) for (var x = 0; x < cv.width; x++) {
      var v = d[(y * cv.width + x) * 4] / 255;
      /* a textura é lida com y para baixo a partir da linha DIG_Y: a
         linha 0 do canvas é a de cima do glifo                       */
      var o = (y * TEXW + x) * 4;
      out[o] = v; out[o + 1] = v; out[o + 2] = v; out[o + 3] = 1;
    }
    return out;
  }

  function garantirTex(gl) {
    if (tex) return tex;
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TEXW, TEXH, 0, gl.RGBA, gl.FLOAT, null);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, DIG_Y, TEXW, DIG_H, gl.RGBA, gl.FLOAT, glifos());
    glifosOk = true;
    return tex;
  }

  /* ------------------------------------------------- a análise -------
     Devolve o descritor de atlas que o shader lê, ou null sem GL. */
  M.analisar = function (renderer, inTex, chave, p) {
    var gl = renderer.gl;
    if (!gl || !inTex) return null;
    var GH = Math.max(8, Math.round(GW * renderer.h / Math.max(1, renderer.w)));
    if (!alvo || GH !== GHatual) {
      if (alvo) renderer.delTarget(alvo);
      alvo = renderer.mkTarget();
      gl.bindTexture(gl.TEXTURE_2D, alvo.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, GW, GH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      pixels = new Uint8Array(GW * GH * 4);
      GHatual = GH;
    }
    renderer.downsample(inTex, alvo, GW, GH);
    gl.bindFramebuffer(gl.FRAMEBUFFER, alvo.fb);
    gl.readPixels(0, 0, GW, GH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var est = estadoDe(chave);
    var N = GW * GH;
    var fonte = p.fonte | 0, limiar = +p.limiar || 0.5;
    var luma = new Float32Array(N), sim = new Uint8Array(N), i, x, y;
    for (i = 0; i < N; i++) {
      var o = i * 4;
      luma[i] = (pixels[o] * 0.2126 + pixels[o + 1] * 0.7152 + pixels[o + 2] * 0.0722) / 255;
    }
    if (fonte === 2) {
      /* MOVIMENTO: o que mudou desde a grade anterior */
      if (est.grade) for (i = 0; i < N; i++) sim[i] = Math.abs(luma[i] - est.grade[i]) > limiar * 0.5 ? 1 : 0;
      est.grade = luma;
    } else if (fonte === 3) {
      /* COR: matiz perto do pedido, com alguma saturação */
      var alvoH = ((+p.matiz || 0) % 360) / 360, tol = Math.max(0.02, (+p.tolerancia || 0.1));
      for (i = 0; i < N; i++) {
        var r = pixels[i * 4] / 255, g = pixels[i * 4 + 1] / 255, b = pixels[i * 4 + 2] / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        if (mx < 0.12 || d / Math.max(mx, 1e-5) < 0.25) continue;
        var h = d < 1e-5 ? 0 : (mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? ((b - r) / d + 2) : ((r - g) / d + 4)) / 6;
        var dh = Math.abs(h - alvoH); dh = Math.min(dh, 1 - dh);
        sim[i] = dh < tol ? 1 : 0;
      }
    } else if (fonte === 1) {
      for (i = 0; i < N; i++) sim[i] = luma[i] < 1 - limiar ? 1 : 0;
    } else {
      for (i = 0; i < N; i++) sim[i] = luma[i] > limiar ? 1 : 0;
    }

    /* ---- componentes conexos, 8 vizinhos, com pilha ---- */
    var rot = new Int32Array(N), manchas = [], pilha = new Int32Array(N), nr = 0;
    for (i = 0; i < N; i++) {
      if (!sim[i] || rot[i]) continue;
      nr++;
      var area = 0, sx = 0, sy = 0, x0 = GW, x1 = -1, y0 = GH, y1 = -1, sp = 0;
      pilha[sp++] = i; rot[i] = nr;
      while (sp) {
        var c = pilha[--sp];
        var cx = c % GW, cy = (c / GW) | 0;
        area++; sx += cx; sy += cy;
        if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          var nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
          var n = ny * GW + nx;
          if (sim[n] && !rot[n]) { rot[n] = nr; pilha[sp++] = n; }
        }
      }
      manchas.push({ area: area / N, cx: (sx / area + 0.5) / GW, cy: (sy / area + 0.5) / GH,
        x0: x0 / GW, x1: (x1 + 1) / GW, y0: y0 / GH, y1: (y1 + 1) / GH });
    }
    var minimo = Math.max(0, (+p.minimo || 0) / 100);
    manchas = manchas.filter(function (m) { return m.area >= minimo; });
    manchas.sort(function (a, b) { return b.area - a.area; });
    manchas = manchas.slice(0, Math.max(1, Math.min(MAXM, p.maximo | 0 || 12)));

    /* ---- rastreio: herda o número da mancha anterior mais perto ---- */
    var usados = {}, suave = Math.max(0, Math.min(1, +p.suave || 0)), k = 1 - suave * 0.85;
    manchas.forEach(function (m) {
      var melhor = null, md = 0.12;
      est.prev.forEach(function (q) {
        if (usados[q.id]) return;
        var d = Math.hypot(q.cx - m.cx, q.cy - m.cy);
        if (d < md) { md = d; melhor = q; }
      });
      if (melhor) {
        m.id = melhor.id; usados[melhor.id] = 1;
        m.x0 = melhor.x0 + (m.x0 - melhor.x0) * k; m.x1 = melhor.x1 + (m.x1 - melhor.x1) * k;
        m.y0 = melhor.y0 + (m.y0 - melhor.y0) * k; m.y1 = melhor.y1 + (m.y1 - melhor.y1) * k;
        m.cx = melhor.cx + (m.cx - melhor.cx) * k; m.cy = melhor.cy + (m.cy - melhor.cy) * k;
      } else {
        m.id = est.proximoId++; if (est.proximoId > 99) est.proximoId = 1;
      }
    });
    est.prev = manchas;

    /* ---- vizinhas: as duas mais perto de cada uma ---- */
    manchas.forEach(function (m, a) {
      var lista = manchas.map(function (q, b) { return { b: b, d: a === b ? 9 : Math.hypot(q.cx - m.cx, q.cy - m.cy) }; })
        .sort(function (u, v) { return u.d - v.d; });
      m.v1 = lista.length > 1 ? lista[0].b : -1;
      m.v2 = lista.length > 2 ? lista[1].b : -1;
    });

    /* ---- sobe: os centros das vizinhas vão prontos, para o shader não
       ter de buscar a caixa da vizinha (uma leitura a menos por mancha) */
    dados.fill(0); dados2.fill(0);
    manchas.forEach(function (m, j) {
      var o = j * 4;
      dados[o] = m.x0; dados[o + 1] = m.y0; dados[o + 2] = m.x1; dados[o + 3] = m.y1;
      var o2 = (TEXW + j) * 4, v1 = m.v1 >= 0 ? manchas[m.v1] : null, v2 = m.v2 >= 0 ? manchas[m.v2] : null;
      dados[o2] = m.id; dados[o2 + 1] = m.area; dados[o2 + 2] = v1 ? v1.cx : -1; dados[o2 + 3] = v1 ? v1.cy : -1;
      dados2[o] = v2 ? v2.cx : -1; dados2[o + 1] = v2 ? v2.cy : -1; dados2[o + 2] = m.cx; dados2[o + 3] = m.cy;
    });
    var t = garantirTex(gl);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEXW, 2, gl.RGBA, gl.FLOAT, dados);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 18, TEXW, 1, gl.RGBA, gl.FLOAT, dados2);
    M.ultimas = manchas;
    return { tex: t, count: manchas.length, cols: DIG_Y, rows: TEXH, total: DIG_W };
  };

  M.limpar = function (chave) { if (chave) delete estados[chave]; else estados = {}; };

})(window.VE);
