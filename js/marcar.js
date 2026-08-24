/* ============================================================
   rgb_lab — MARCAR OBJETO: a I.A. preenchendo o traçado da caneta
   ------------------------------------------------------------
   O rotoscópio é o trabalho mais chato do laboratório: contornar a mesma
   coisa quadro a quadro. Isto não substitui o artista — ele continua dono
   do traçado —, mas tira dele o PRIMEIRO contorno de cada quadro-chave.

   O caminho escolhido (pesquisa da seção 13 do PROJETO.md) é o
   `InteractiveSegmenter` do MediaPipe: recebe um CLIQUE e devolve a
   máscara do objeto ali. Roda em WASM+WebGL, DENTRO do navegador — é o
   único caminho que não fere a promessa de processamento local da barra
   de estado. Nenhum quadro sai desta máquina.

   COMO ISTO NÃO É UMA DEPENDÊNCIA
   -------------------------------
   A biblioteca e o modelo NÃO estão no arquivo único e nunca estarão:
   são alguns megabytes que só interessam a quem clicar no botão. Eles são
   buscados na primeira vez que o botão é usado, e se não der — sem rede,
   arquivo aberto do disco, CSP que barre o CDN — o laboratório continua
   inteiro e o botão explica o motivo. Mesma regra do trabalhador de
   áudio: acelera, não sustenta.

   O QUE ELE FAZ, E O QUE NÃO FAZ
   ------------------------------
   · traçado VAZIO   → MARCAR OBJETO: o contorno da coisa clicada vira os
                       vértices, simplificados até caber nos 48 da caneta;
   · traçado PRONTO  → SEGUIR: os vértices que já existem são encostados no
                       contorno do quadro atual, sem mudar a quantidade nem
                       perder as alças — que é o que mantém os keyframes
                       fazendo sentido.

   Ele é POR QUADRO. Não propaga máscara no tempo: o rotoscópio continua
   sendo do artista, a I.A. só adianta o primeiro contorno.
   ============================================================ */
(function (VE) {
  'use strict';

  var M = VE.marcar = {};

  /* De onde vêm a biblioteca e o modelo. Ficam aqui em cima, à vista,
     porque é a única coisa deste laboratório que vem de fora. */
  M.CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10';
  M.MODELO = 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/' +
    'magic_touch/float32/1/magic_touch.tflite';

  var estado = 'frio';       /* frio · carregando · pronto · sem */
  var motivo = '';
  var seg = null, carga = null;

  M.estado = function () { return estado; };
  M.motivo = function () { return motivo; };
  M.pronto = function () { return estado === 'pronto'; };
  M.podeTentar = function () { return estado !== 'sem'; };

  /* ============================================== A BIBLIOTECA ========= */
  M.carregar = function () {
    if (estado === 'pronto') return Promise.resolve(true);
    if (estado === 'sem') return Promise.resolve(false);
    if (estado === 'carregando') return carga;
    if (location.protocol === 'file:') {
      estado = 'sem';
      motivo = 'o arquivo foi aberto direto do disco — a I.A. precisa de servidor para buscar o modelo';
      return Promise.resolve(false);
    }
    estado = 'carregando';
    carga = import(/* webpackIgnore: true */ M.CDN)
      .then(function (mod) {
        return mod.FilesetResolver.forVisionTasks(M.CDN + '/wasm').then(function (fs) {
          return mod.InteractiveSegmenter.createFromOptions(fs, {
            baseOptions: { modelAssetPath: M.MODELO },
            outputCategoryMask: true,
            outputConfidenceMasks: false
          });
        });
      })
      .then(function (s) { seg = s; estado = 'pronto'; return true; })
      .catch(function (e) {
        estado = 'sem';
        motivo = (e && e.message) ? e.message : String(e);
        return false;
      });
    return carga;
  };

  /* Segmenta o que está sob o ponto (x,y em 0..1) de uma imagem qualquer
     que o navegador saiba desenhar. Devolve a máscara em bytes. */
  M.segmentar = function (imagem, x, y) {
    if (estado !== 'pronto' || !seg) return Promise.reject(new Error('a I.A. não está carregada'));
    return new Promise(function (ok, falha) {
      try {
        seg.segment(imagem, { keypoint: { x: x, y: y } }, function (r) {
          var cm = r && (r.categoryMask || (r.confidenceMasks && r.confidenceMasks[0]));
          if (!cm) { falha(new Error('a I.A. não devolveu máscara')); return; }
          var w = cm.width, h = cm.height;
          var dados = cm.getAsUint8Array ? cm.getAsUint8Array() : cm.getAsFloat32Array();
          var bin = new Uint8Array(w * h);
          var sx = Math.max(0, Math.min(w - 1, Math.round(x * w)));
          var sy = Math.max(0, Math.min(h - 1, Math.round(y * h)));
          var i;
          if (dados instanceof Uint8Array) {
            /* MEDIDO, não suposto: o `magic_touch` devolve a categoria do
               OBJETO em 0 e o fundo em 255 — o contrário do que se espera.
               Com ruído branco de teste, 87,5% do quadro vinha marcado e o
               ponto clicado vinha zero.

               Em vez de escrever a convenção na pedra (que muda com o
               modelo e com a versão), o objeto é DEFINIDO pelo clique: é a
               categoria que estiver embaixo do dedo. Assim a polaridade se
               corrige sozinha.                                        */
            var alvo = dados[sy * w + sx];
            for (i = 0; i < bin.length; i++) bin[i] = (dados[i] === alvo) ? 1 : 0;
          } else {
            for (i = 0; i < bin.length; i++) bin[i] = dados[i] >= 0.5 ? 1 : 0;
          }
          if (cm.close) cm.close();
          ok({ dados: bin, w: w, h: h });
        });
      } catch (e) { falha(e); }
    });
  };

  /* ====================================== O CONTORNO, SEM I.A. NENHUMA ==
     Daqui para baixo é geometria pura sobre um mapa de bits: dá para
     testar sem rede, sem modelo e sem GPU — e foi assim que foi testado. */

  /* A ILHA que contém o ponto clicado. A máscara pode ter respingos soltos;
     contornar o maior borrão da imagem daria o objeto errado quando a
     pessoa clica no menor. Espalhamento em quatro vizinhos, com fila
     própria — recursão estoura a pilha num quadro de dois megapixels. */
  M.ilha = function (mapa, w, h, sx, sy) {
    var i0 = sy * w + sx;
    if (!mapa[i0]) return null;
    var vis = new Uint8Array(w * h);
    var fila = new Int32Array(w * h), ini = 0, fim = 0;
    fila[fim++] = i0; vis[i0] = 1;
    var n = 1, minx = sx, maxx = sx, miny = sy, maxy = sy;
    while (ini < fim) {
      var p = fila[ini++], px = p % w, py = (p / w) | 0;
      if (px < minx) minx = px; if (px > maxx) maxx = px;
      if (py < miny) miny = py; if (py > maxy) maxy = py;
      if (px > 0 && mapa[p - 1] && !vis[p - 1]) { vis[p - 1] = 1; fila[fim++] = p - 1; n++; }
      if (px < w - 1 && mapa[p + 1] && !vis[p + 1]) { vis[p + 1] = 1; fila[fim++] = p + 1; n++; }
      if (py > 0 && mapa[p - w] && !vis[p - w]) { vis[p - w] = 1; fila[fim++] = p - w; n++; }
      if (py < h - 1 && mapa[p + w] && !vis[p + w]) { vis[p + w] = 1; fila[fim++] = p + w; n++; }
    }
    return { mapa: vis, n: n, caixa: [minx, miny, maxx, maxy] };
  };

  /* Contorno pela vizinhança de Moore: anda pela borda da ilha como quem
     segue uma parede com a mão. Devolve os pixels da borda em ordem. */
  M.contorno = function (ilha, w, h) {
    var mapa = ilha.mapa, cx = ilha.caixa;
    /* o primeiro pixel da borda: o mais acima e, nele, o mais à esquerda */
    var ini = -1;
    for (var y = cx[1]; y <= cx[3] && ini < 0; y++) {
      for (var x = cx[0]; x <= cx[2]; x++) { if (mapa[y * w + x]) { ini = y * w + x; break; } }
    }
    if (ini < 0) return [];
    var dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    var out = [], px = ini % w, py = (ini / w) | 0;
    var x0 = px, y0 = py, d = 6, giros = 0;
    var teto = 8 * (w + h) + 16;      /* qualquer borda cabe nisso */
    do {
      out.push({ x: px, y: py });
      var achou = false;
      for (var k = 0; k < 8; k++) {
        var dd = (d + 6 + k) % 8;      /* começa olhando para trás e gira */
        var nx = px + dirs[dd][0], ny = py + dirs[dd][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (mapa[ny * w + nx]) { px = nx; py = ny; d = dd; achou = true; break; }
      }
      if (!achou) break;               /* um pixel sozinho */
      giros++;
    } while ((px !== x0 || py !== y0) && giros < teto);
    return out;
  };

  /* Douglas–Peucker: tira os pontos que não mudam a forma. */
  function rdp(pts, ini, fim, tol, marca) {
    var ax = pts[ini].x, ay = pts[ini].y, bx = pts[fim].x, by = pts[fim].y;
    var ex = bx - ax, ey = by - ay, ll = ex * ex + ey * ey;
    var pior = -1, iPior = -1;
    for (var i = ini + 1; i < fim; i++) {
      var wx = pts[i].x - ax, wy = pts[i].y - ay;
      var t = ll > 1e-9 ? Math.max(0, Math.min(1, (wx * ex + wy * ey) / ll)) : 0;
      var dx = wx - ex * t, dy = wy - ey * t;
      var d = dx * dx + dy * dy;
      if (d > pior) { pior = d; iPior = i; }
    }
    if (pior > tol * tol && iPior > 0) {
      marca[iPior] = 1;
      rdp(pts, ini, iPior, tol, marca);
      rdp(pts, iPior, fim, tol, marca);
    }
  }

  M.simplificar = function (pts, tol) {
    if (!pts || pts.length < 3) return pts || [];
    var marca = new Uint8Array(pts.length);
    marca[0] = 1; marca[pts.length - 1] = 1;
    rdp(pts, 0, pts.length - 1, tol, marca);
    var out = [];
    for (var i = 0; i < pts.length; i++) if (marca[i]) out.push(pts[i]);
    return out;
  };

  /* Simplifica até caber. A tolerância certa não se adivinha — ela depende
     do tamanho do objeto na tela —, então é achada por bisseção. */
  M.ateCaber = function (pts, teto) {
    var n = teto || 48;
    if (!pts || pts.length <= n) return M.simplificar(pts, 0.6);
    var lo = 0.2, hi = Math.max(8, Math.sqrt(pts.length)) * 4, melhor = null;
    for (var k = 0; k < 24; k++) {
      var mid = (lo + hi) / 2;
      var s = M.simplificar(pts, mid);
      if (s.length > n) lo = mid; else { melhor = s; hi = mid; }
      if (hi - lo < 0.05) break;
    }
    return melhor || pts.slice(0, n);
  };

  /* pixels → uv do quadro */
  M.paraUv = function (pts, w, h) {
    return pts.map(function (p) { return { x: (p.x + 0.5) / w, y: (p.y + 0.5) / h }; });
  };

  /* ============================================ ENCOSTAR (o SEGUIR) ====
     Cada vértice que já existe anda até o ponto mais perto do contorno
     novo. A QUANTIDADE não muda e as alças não são tocadas: é isso que
     mantém os keyframes de pé — um traçado que muda de número de vértices
     no meio da animação não tem como ser interpolado.               */
  function centroide(p) {
    var sx = 0, sy = 0;
    for (var i = 0; i < p.length; i++) { sx += p[i].x; sy += p[i].y; }
    return { x: sx / p.length, y: sy / p.length };
  }
  function raioMedio(p, c) {
    var s = 0;
    for (var i = 0; i < p.length; i++) s += Math.sqrt((p[i].x - c.x) * (p[i].x - c.x) + (p[i].y - c.y) * (p[i].y - c.y));
    return s / p.length;
  }

  M.encostar = function (pts, contorno) {
    if (!pts || !pts.length || !contorno || contorno.length < 2) return null;
    /* ALINHAR ANTES DE ENCOSTAR.

       Encostar cada vértice no ponto mais perto parece bastar, e não basta:
       MEDIDO, com o objeto andando 0,2 da largura (mais que o próprio raio),
       o traçado inteiro desabou na borda mais próxima — o centro foi de
       0,427 para 0,486 quando o objeto tinha ido para 0,62. Metade dos
       vértices achou a beirada de perto e ficou lá.

       O conserto é o que qualquer rastreador faz: primeiro o grosso
       (transladar e escalar pelo centro e pelo raio médio), depois o fino
       (encostar). Assim o vértice já chega perto do lugar dele e o mais
       perto passa a ser o certo.                                      */
    var ca = centroide(pts), cb = centroide(contorno);
    var ra = raioMedio(pts, ca), rb = raioMedio(contorno, cb);
    var k = (ra > 1e-6 && rb > 1e-6) ? rb / ra : 1;
    k = Math.max(0.25, Math.min(4, k));
    var alinhados = pts.map(function (p) {
      return { x: cb.x + (p.x - ca.x) * k, y: cb.y + (p.y - ca.y) * k };
    });
    return alinhados.map(function (p) {
      var melhor = null, dMelhor = 1e9;
      for (var i = 0; i < contorno.length; i++) {
        var a = contorno[i], b = contorno[(i + 1) % contorno.length];
        var ex = b.x - a.x, ey = b.y - a.y, ll = ex * ex + ey * ey;
        var t = ll > 1e-12 ? Math.max(0, Math.min(1, ((p.x - a.x) * ex + (p.y - a.y) * ey) / ll)) : 0;
        var qx = a.x + ex * t, qy = a.y + ey * t;
        var dx = p.x - qx, dy = p.y - qy, d = dx * dx + dy * dy;
        if (d < dMelhor) { dMelhor = d; melhor = { x: qx, y: qy }; }
      }
      return melhor;
    });
  };

  /* ================================================== O TRABALHO TODO ==
     Da imagem e do clique até os vértices em uv, sem tocar no modelo do
     projeto — quem grava é quem chamou, porque só ele sabe se o traçado
     está animado.                                                   */
  M.pontosDe = function (imagem, x, y, teto) {
    return M.segmentar(imagem, x, y).then(function (mk) {
      var sx = Math.max(0, Math.min(mk.w - 1, Math.round(x * mk.w)));
      var sy = Math.max(0, Math.min(mk.h - 1, Math.round(y * mk.h)));
      var ilha = M.ilha(mk.dados, mk.w, mk.h, sx, sy);
      if (!ilha || ilha.n < 12) throw new Error('não achei objeto neste ponto');
      /* a I.A. às vezes devolve o quadro inteiro como uma categoria só —
         contornar isso daria a moldura da tela, que não serve a ninguém */
      if (ilha.n > 0.92 * mk.w * mk.h) throw new Error('a seleção pegou o quadro inteiro — clique em cima do objeto');
      var borda = M.contorno(ilha, mk.w, mk.h);
      if (borda.length < 8) throw new Error('o contorno saiu pequeno demais');
      return {
        pts: M.paraUv(M.ateCaber(borda, teto || 48), mk.w, mk.h),
        contorno: M.paraUv(borda, mk.w, mk.h),
        area: ilha.n / (mk.w * mk.h)
      };
    });
  };

})(window.VE);
