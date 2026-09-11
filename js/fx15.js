/* ============================================================
   rgb_lab — efeitos parte 15: PAPEL TÉRMICO (o cupom)
   ------------------------------------------------------------
   A foto impressa numa impressora de cupom fiscal: a referência é a
   série de fotos em papel de recibo (FamilyMart, Saizeriya) que
   circula como estética — o retrato em pontos, o cabeçalho da loja,
   a data, os itens, o total, o código de barras.

   A impressora térmica não tem tinta: tem uma linha de resistências
   que QUEIMAM o papel ponto a ponto, uma linha por vez, enquanto o
   papel avança. Disso saem todos os traços que este efeito reproduz:

     1 · a RÉGUA é o papel        80 mm = 576 pontos · 58 mm = 384
                                   (203 dpi), e o efeito é contado em
                                   pontos, não em pixels de tela — a
                                   mesma imagem em qualquer resolução
     2 · um BIT por ponto          queimou ou não queimou. O tom vem da
                                   TRAMA (difusão de erro, ordenada ou
                                   limiar seco)
     3 · a resistência QUEIMADA    uma coluna que nunca imprime — a
                                   linha branca vertical de todo cupom
                                   velho; e a resistência fraca, que
                                   imprime cinza
     4 · o papel que ESCORREGA     faixas horizontais mais claras
     5 · a QUEIMA que espalha      o ponto quente aquece o vizinho: o
                                   preto engorda e escorre no sentido
                                   do avanço
     6 · o TEXTO da impressora     fonte monoespaçada de 12×24, o
                                   título em dobro, separadores, o
                                   total em negrito, o código de barras

   O texto é desenhado num canvas do tamanho do papel (um pixel = um
   ponto) e sobe como ATLAS do efeito — o mesmo gancho que o ASCII usa
   para as letras. O shader lê o ponto exato com `texelFetch`. A trama
   de difusão vem de um ladrilho de ruído azul de 128×128 gerado uma
   vez (ruído branco ordenado por passa-alta, seis voltas): dá o
   grão orgânico da difusão de erro sem a dependência sequencial dela,
   que um shader não tem como fazer.

   É uma FÓRMULA (recalcula do zero em qualquer instante): o vídeo
   passa dentro do cupom, escrubável e exportável. Com alfa real: fora
   do papel é transparente — a sombra é alfa também — e o papel se
   compõe sobre o que estiver embaixo na linha do tempo.
   ============================================================ */
(function (VE) {
  'use strict';

  var D = VE.def;
  var PIN = '#e2670f';

  /* ---------------------------------------------------- ruído azul ---
     Ladrilho de 128×128 com valores 0..1 espalhados: começa em ruído
     branco e, seis vezes, reordena os pontos pelo que sobra depois de
     um passa-baixa — o que empurra os aglomerados para longe uns dos
     outros. Não é void-and-cluster, mas chega perto o bastante para a
     trama não formar vermes nem grades.                              */
  var RUIDO = null, RN = 128;
  function ruidoAzul() {
    if (RUIDO) return RUIDO;
    var N = RN * RN, w = new Float32Array(N), lp = new Float32Array(N), idx = new Int32Array(N), i, it, x, y;
    var seed = 1234567;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    for (i = 0; i < N; i++) { w[i] = rnd(); idx[i] = i; }
    var K = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    for (it = 0; it < 6; it++) {
      for (y = 0; y < RN; y++) for (x = 0; x < RN; x++) {
        var s = 0, k = 0;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          s += K[k++] * w[((y + dy + RN) % RN) * RN + ((x + dx + RN) % RN)];
        }
        lp[y * RN + x] = s / 16;
      }
      var arr = Array.prototype.slice.call(idx);
      arr.sort(function (a, b) { return (w[a] - lp[a]) - (w[b] - lp[b]); });
      for (i = 0; i < N; i++) w[arr[i]] = (i + 0.5) / N;
    }
    RUIDO = w;
    return w;
  }

  /* ------------------------------------------------- o texto do cupom ---
     Desenha cabeçalho e rodapé num canvas com um pixel por ponto. As
     três bandas da textura: ruído (128 linhas), cabeçalho, rodapé.   */
  var CEL_W = 12, CEL_H = 24;
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function desenharCupom(papelW, titulo, linhas, comCodigo) {
    var cols = Math.floor((papelW - 48) / CEL_W);
    var itens = String(linhas || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    var hH = 8 + 48 + 8 + CEL_H * 3;                       /* título dobrado + 3 linhas */
    var fH = CEL_H + itens.length * CEL_H + CEL_H + 48 + 8 + (comCodigo ? 64 + CEL_H : 0) + CEL_H + 24;
    var cv = document.createElement('canvas');
    cv.width = papelW; cv.height = RN + hH + fH;
    var c = cv.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    /* banda 0: o ruído azul, no canto */
    var img = c.createImageData(RN, RN), rd = ruidoAzul();
    for (var i = 0; i < RN * RN; i++) { var v = Math.round(rd[i] * 255); img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    c.putImageData(img, 0, 0);
    c.fillStyle = '#fff'; c.textBaseline = 'top';
    var mono = '"Consolas","Courier New","Lucida Console",monospace';
    function linha(txt, y, dobro, negrito, alinhar) {
      var cw = dobro ? CEL_W * 2 : CEL_W, ch = dobro ? CEL_H * 2 : CEL_H;
      c.font = (negrito ? 'bold ' : '') + Math.round(ch * 0.82) + 'px ' + mono;
      var max = Math.floor((papelW - 48) / cw);
      txt = String(txt).slice(0, max);
      var w = txt.length * cw;
      var x = alinhar === 'centro' ? Math.floor((papelW - w) / 2) : (alinhar === 'dir' ? papelW - 24 - w : 24);
      for (var k = 0; k < txt.length; k++) {
        c.fillText(txt[k], x + k * cw + Math.round(cw * 0.08), y + Math.round(ch * 0.1));
      }
    }
    function tracejado(y) { for (var x = 24; x < papelW - 24; x += CEL_W) c.fillRect(x + 2, y + CEL_H / 2, CEL_W - 4, 2); }
    function itemLinha(txt, y, negrito) {
      /* "NOME 1x 0,00": o último pedaço vai para a direita se for número */
      var m = txt.match(/^(.*?)(\s+)([\d.,]+)$/);
      if (m) { linha(m[1], y, false, negrito, 'esq'); linha(m[3], y, false, negrito, 'dir'); }
      else linha(txt, y, false, negrito, 'esq');
    }
    /* ---- cabeçalho ---- */
    var y = RN + 8;
    linha(titulo || 'RGB_LAB', y, true, true, 'centro'); y += 48 + 8;
    linha('CUPOM NAO FISCAL', y, false, false, 'centro'); y += CEL_H;
    var d = new Date();
    linha(pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() + '  ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + '  N.' + pad2(d.getSeconds()) + pad2(d.getMinutes()), y, false, false, 'esq'); y += CEL_H;
    tracejado(y); y += CEL_H;
    /* ---- rodapé ---- */
    y = RN + hH;
    tracejado(y); y += CEL_H;
    var total = 0;
    itens.forEach(function (t) {
      var m = t.match(/([\d]+[.,]\d{2})\s*$/); if (m) total += parseFloat(m[1].replace(',', '.'));
      itemLinha(t, y, false); y += CEL_H;
    });
    tracejado(y); y += CEL_H;
    linha('TOTAL', y, true, true, 'esq');
    linha(total.toFixed(2).replace('.', ','), y, true, true, 'dir'); y += 48 + 8;
    if (comCodigo) {
      /* código de barras: barras de 1 a 3 pontos sorteadas pelo título */
      var h = 0; String(titulo || 'x').split('').forEach(function (ch) { h = (h * 31 + ch.charCodeAt(0)) >>> 0; });
      var x = 40, fim = papelW - 40, s = h || 7;
      while (x < fim) {
        s = (s * 1103515245 + 12345) >>> 0;
        var bw = 1 + (s >>> 16) % 3, gap = 1 + (s >>> 8) % 3;
        c.fillRect(x, y, bw, 56); x += bw + gap;
      }
      y += 64;
      var num = ''; s = h || 7; for (var q = 0; q < 13; q++) { s = (s * 1103515245 + 12345) >>> 0; num += (s >>> 16) % 10; if (q === 0 || q === 6) num += ' '; }
      linha(num, y, false, false, 'centro'); y += CEL_H;
    }
    linha('OBRIGADO . VOLTE SEMPRE', y, false, false, 'centro');
    return { cv: cv, hH: hH, fH: fH, W: papelW };
  }

  var PAPEIS = [576, 384];

  D({
    id: 'cupom', name: 'Papel térmico / cupom', cat: 'pintura', color: PIN,
    alpha: true, tempo: true,
    desc: 'a foto impressa em cupom fiscal: um bit por ponto de 203 dpi, cabeçalho, itens, total e código de barras — com a resistência queimada, a faixa clara e a queima que escorre. Fora do papel é transparente',
    /* o atlas é o TEXTO desenhado no tamanho do papel + o ladrilho de ruído.
       Guardado por conteúdo: só redesenha quando o texto ou o papel mudam. */
    atlas: function (params) {
      var W = PAPEIS[params.papel | 0] || PAPEIS[0];
      var key = W + '|' + (params.titulo || '') + '|' + (params.linhas || '') + '|' + (params.codigo > 0.5 ? 1 : 0);
      this.__cupom = this.__cupom || {};
      if (this.__cupom[key]) return this.__cupom[key];
      var d = desenharCupom(W, params.titulo, params.linhas, params.codigo > 0.5);
      var gl = this.gl, tex = this.mkTex();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, d.cv);
      /* count = altura do cabeçalho · cols = altura do rodapé ·
         rows = altura da textura · total = largura do papel em pontos */
      var a = { tex: tex, count: d.hH, cols: d.fH, rows: d.cv.height, total: d.W };
      /* só o último atlas fica guardado: texto muda pouco e cada um custa
         uma textura do tamanho do papel — o anterior é apagado da GPU */
      var velho = this.__cupom, self = this;
      Object.keys(velho).forEach(function (k) { try { self.gl.deleteTexture(velho[k].tex); } catch (e) { } });
      this.__cupom = {}; this.__cupom[key] = a;
      return a;
    },
    params: [
      { k: 'papel', t: 's', label: 'Papel', def: 0, uni: false, opts: ['80 mm — 576 pontos', '58 mm — 384 pontos'] },
      { k: 'altura', label: 'Altura do cupom (do quadro)', min: 0.3, max: 1.4, def: 0.96 },
      { k: 'posx', label: 'Posição X', min: -0.2, max: 1.2, def: 0.5 },
      { k: 'titulo', t: 'txt', label: 'Cabeçalho (nome da loja)', def: 'RGB_LAB', uni: false },
      { k: 'linhas', t: 'txt', label: 'Itens (separe com |)', def: 'IMAGEM TERMICA 1x 0,00|FOTO EM PAPEL 1x 0,00|TEMPO DE EXPOSICAO 1x 0,00', uni: false },
      { k: 'textoOn', t: 'b', label: 'Imprimir o texto', def: 1 },
      { k: 'codigo', t: 'b', label: 'Código de barras', def: 1, uni: false },
      { k: 'trama', t: 's', label: 'Trama', def: 0, opts: ['DIFUSÃO (orgânica)', 'ORDENADA (grade 8×8)', 'LIMIAR SECO'] },
      { k: 'contraste', label: 'Contraste', min: -0.5, max: 2, def: 0.45 },
      { k: 'gama', label: 'Gama', min: 0.3, max: 3, def: 1.15 },
      { k: 'escuro', label: 'Cinza do preto', min: 0, max: 1, def: 0.12 },
      { k: 'corPapel', t: 'c', label: 'Cor do papel', def: '#f3efe4' },
      { k: 'desgaste', label: 'Desgaste (colunas mortas, faixas)', min: 0, max: 1, def: 0.3 },
      { k: 'queima', label: 'Queima (o preto engorda e escorre)', min: 0, max: 1, def: 0.3 },
      { k: 'sombra', label: 'Sombra do cupom', min: 0, max: 1, def: 0.5 },
      { k: 'imprimir', label: 'Imprimir ao vivo (pontos/s · 0 = pronto)', min: 0, max: 2000, step: 10, def: 0 }
    ],
    glsl: [
      '#define CP_MARG 24.0',
      '#define CP_GAP 12.0',
      'float cpW(){ return max(uAtlasInfo.w, 64.0); }',
      'float cpTexto(){ return step(0.5, u_textoOn); }',
      'float cpImgW(){ return cpW() - 2.0*CP_MARG; }',
      'float cpImgH(){ return floor(cpImgW()/max(uAspect, 0.05)); }',
      'float cpImgTop(){ return 8.0 + uAtlasInfo.x*cpTexto() + CP_GAP; }',
      'float cpFootTop(){ return cpImgTop() + cpImgH() + CP_GAP; }',
      'float cpAltura(){ return cpFootTop() + uAtlasInfo.y*cpTexto() + 32.0; }',
      /* Bayer 8×8 por entrelaçamento de bits — a grade clássica */
      'float cpBayer(ivec2 p){',
      '  p = p & 7; int x = p.x ^ p.y; int y = p.y;',
      '  int v = ((x & 1) << 5) | ((y & 1) << 4) | ((x & 2) << 2) | ((y & 2) << 1) | ((x & 4) >> 1) | ((y & 4) >> 2);',
      '  return (float(v) + 0.5)/64.0;',
      '}',
      'float cpRuido(ivec2 p){ return texelFetch(uAtlas, ivec2(p.x & 127, p.y & 127), 0).r; }',
      /* o ponto (dx, dy) queimou? 0 ou 1 — o cupom é um bit por ponto */
      'float cpTinta(vec2 d){',
      '  float dx = d.x, dy = d.y;',
      '  if(dx < 0.0 || dx >= cpW() || dy < 0.0 || dy >= cpAltura()) return 0.0;',
      '  ivec2 ip = ivec2(int(dx), int(dy));',
      /* cabeçalho e rodapé: o atlas, já em pontos */
      '  if(cpTexto() > 0.5){',
      '    float hTop = 8.0;',
      '    if(dy >= hTop && dy < hTop + uAtlasInfo.x){',
      '      return step(0.5, texelFetch(uAtlas, ivec2(ip.x, 128 + int(dy - hTop)), 0).r);',
      '    }',
      '    float fTop = cpFootTop();',
      '    if(dy >= fTop && dy < fTop + uAtlasInfo.y){',
      '      return step(0.5, texelFetch(uAtlas, ivec2(ip.x, 128 + int(uAtlasInfo.x) + int(dy - fTop)), 0).r);',
      '    }',
      '  }',
      /* a imagem: um sample por ponto, tramado */
      '  float it = cpImgTop();',
      '  if(dy >= it && dy < it + cpImgH() && dx >= CP_MARG && dx < CP_MARG + cpImgW()){',
      '    vec2 suv = vec2((dx + 0.5 - CP_MARG)/cpImgW(), 1.0 - (dy + 0.5 - it)/cpImgH());',
      '    vec4 s = src4(suv);',
      '    float l = luma(s.rgb);',
      '    l = (l - 0.5)*(1.0 + u_contraste) + 0.5;',
      '    l = pow(clamp(l, 0.0, 1.0), max(u_gama, 0.05));',
      '    l = mix(1.0, l, s.a);',
      '    float th = (u_trama < 0.5) ? cpRuido(ip) : (u_trama < 1.5 ? cpBayer(ip) : 0.5);',
      '    return step(l, th);',
      '  }',
      '  return 0.0;',
      '}',
      'vec4 fx4(vec2 uv){',
      '  vec2 px = uv*uRes;',
      '  float alt = cpAltura();',
      '  float s = u_altura*uRes.y/alt;',
      '  float W = cpW();',
      '  float left = u_posx*uRes.x - W*s*0.5;',
      '  float topPx = uRes.y*0.5 + alt*s*0.5;',
      '  float dx = (px.x - left)/s, dy = (topPx - px.y)/s;',
      /* fora do papel: só a sombra, em alfa */
      '  if(dx < 0.0 || dx >= W || dy < 0.0 || dy >= alt){',
      '    if(u_sombra < 0.001) return vec4(0.0);',
      '    vec2 o = vec2(6.0, 9.0);',
      '    float ex = max(max(o.x - dx, dx - o.x - W), 0.0);',
      '    float ey = max(max(o.y - dy, dy - o.y - alt), 0.0);',
      '    float dist = length(vec2(ex, ey))*s;',
      '    float a = (1.0 - smoothstep(0.0, 28.0, dist))*u_sombra*0.75;',
      '    return vec4(0.0, 0.0, 0.0, a);',
      '  }',
      /* o papel, com a fibra */
      '  vec3 papel = u_corPapel*(1.0 - 0.05*fbm(vec2(dx, dy)*0.33));',
      '  vec2 d0 = floor(vec2(dx, dy));',
      /* impressão ao vivo: o cabeçote só chegou até aqui */
      '  float impresso = (u_imprimir > 0.5) ? step(dy, uLocal*u_imprimir) : 1.0;',
      '  float tinta = cpTinta(d0)*impresso;',
      /* a queima espalha: o vizinho quente engorda o ponto, e o avanço do
         papel escorre o preto para a linha seguinte                     */
      '  if(u_queima > 0.001){',
      '    float viz = max(cpTinta(d0 + vec2(1.0, 0.0)), cpTinta(d0 - vec2(1.0, 0.0)));',
      '    float acima = cpTinta(d0 - vec2(0.0, 1.0));',
      '    tinta = max(tinta, max(viz*0.75, acima)*u_queima*impresso);',
      '  }',
      /* desgaste: a resistência morta (coluna branca), a fraca (cinza),
         a faixa onde o papel escorregou e o pontilhado solto             */
      '  float forca = 1.0;',
      '  if(u_desgaste > 0.001){',
      '    float col = hash11(d0.x*0.37 + 11.1);',
      '    if(col < u_desgaste*0.025) tinta = 0.0;',
      '    else if(col < u_desgaste*0.09) forca *= 0.45;',
      '    float faixa = smoothstep(0.55, 0.9, fbm(vec2(dy*0.02, 4.2)));',
      '    forca *= 1.0 - u_desgaste*0.7*faixa;',
      '    if(hash21(d0 + 7.0) < u_desgaste*0.003) tinta = max(tinta, 0.6*impresso);',
      '  }',
      '  vec3 corTinta = vec3(0.09, 0.09, 0.12) + u_escuro*0.7;',
      '  vec3 cor = mix(papel, corTinta, clamp(tinta*forca, 0.0, 1.0));',
      '  return vec4(cor, 1.0);',
      '}'
    ].join('\n')
  });

  VE.STYLES.push(
    {
      id: 'cupomfiscal', name: 'Cupom fiscal', desc: 'a foto no papel de recibo, com a loja, os itens e o código de barras',
      fx: [['cupom', { papel: 0, altura: 0.96, trama: 0, contraste: 0.45, desgaste: 0.3, queima: 0.3 }]]
    },
    {
      id: 'cupomvelho', name: 'Cupom desbotado', desc: 'papel amarelado, resistências mortas e faixas — o recibo achado no bolso',
      fx: [['cupom', { papel: 1, altura: 0.98, trama: 0, contraste: 0.2, gama: 1.3, escuro: 0.3, corPapel: '#e9dcc0', desgaste: 0.85, queima: 0.5 }]]
    }
  );

})(window.VE);
