/* ============================================================
   rgb_lab — efeitos parte 16: VISÃO DE MÁQUINA
   ------------------------------------------------------------
   Dois efeitos da família PERCEPÇÃO que NÃO são fórmula de pixel:
   cada um tem um ANALISADOR fora do shader que lê a imagem de entrada
   e devolve o resultado como textura, pelo gancho do atlas — o mesmo
   que o ASCII usa para as letras e o cupom para o texto. O shader só
   pinta. (O motor entrega ao atlas a imagem de entrada e o tempo
   exatamente para isto — ver `atlasPara` em gl.js.)

   MAPA DE PROFUNDIDADE (I.A.)      js/profundidade.js
     o Depth Anything V2 dentro do navegador: perto claro, longe
     escuro, como o TOP de profundidade do TouchDesigner que virou
     estética. Também cor (turbo), névoa pela distância e recorte do
     perto ou do longe — o mapa como MATTE, que é o uso que importa
     numa composição.

   RASTREIO DE MANCHAS (blob)       js/manchas.js
     o Blob Track: manchas claras, escuras, em movimento ou de uma cor
     viram caixas numeradas, com coordenadas, ligadas por linhas — a
     sobreposição de visão de máquina.

   Os dois moram AQUI, e não nos módulos deles, pela regra do
   fxfam.js: o item precisa existir antes de as famílias serem
   etiquetadas, e os analisadores carregam depois. Os módulos só são
   tocados na hora de desenhar, nunca na carga.
   ============================================================ */
(function (VE) {
  'use strict';

  var D = VE.def;
  var PER = '#c9d400';

  /* ================================================== PROFUNDIDADE ===== */
  D({
    id: 'profundidade_ia', name: 'Mapa de profundidade (I.A.)', cat: 'percepcao', color: PER,
    alpha: true, tempo: true,
    desc: 'a profundidade estimada por I.A. dentro do navegador (Depth Anything V2): perto claro, longe escuro. Ou em cor, névoa pela distância, e o recorte do perto — o mapa como matte. O modelo (18 MB) é buscado na primeira vez e roda fora da linha principal; em vídeo o mapa atrasa meio segundo',
    atlas: function (params, fxDef, inTex) {
      if (!VE.profundidade || !inTex || this !== VE.renderer) return null;
      return VE.profundidade.analisar(this, inTex, params.tamanho | 0, params.ritmo | 0);
    },
    nota: function () { return VE.profundidade ? VE.profundidade.nota() : ''; },
    notaChave: 'data-nota-ia',
    params: [
      { k: 'modo', t: 's', label: 'Mostrar', def: 0, opts: ['MAPA — perto claro', 'MAPA — perto escuro', 'COR (turbo)', 'NÉVOA pela distância', 'SÓ O PERTO (recorte)', 'SÓ O LONGE (recorte)'] },
      { k: 'tamanho', t: 's', label: 'Análise', def: 0, uni: false, opts: ['RÁPIDA — 154 px', 'MÉDIA — 252 px', 'FINA — 378 px (lenta)'] },
      /* a GPU é uma só: enquanto o modelo pensa, o quadro do vídeo espera.
         O ritmo decide quantas vezes por segundo isso acontece         */
      { k: 'ritmo', t: 's', label: 'Ritmo da análise', def: 1, uni: false, opts: ['SEMPRE QUE DER', '2 POR SEGUNDO', '1 POR SEGUNDO', 'SÓ COM O VÍDEO PARADO'] },
      { k: 'contraste', label: 'Contraste do mapa', min: 0, max: 3, def: 1 },
      { k: 'gama', label: 'Gama do mapa', min: 0.3, max: 3, def: 1 },
      { k: 'deslocar', label: 'Deslocar (mais perto / mais longe)', min: -1, max: 1, def: 0 },
      { k: 'nevoa', t: 'c', label: 'Cor da névoa', def: '#ffffff' },
      { k: 'corte', label: 'Onde corta (recorte)', min: 0, max: 1, def: 0.5 },
      { k: 'borda', label: 'Borda do recorte', min: 0.005, max: 0.5, def: 0.08 }
    ],
    glsl: [
      /* sem I.A. (carregando, ou indisponível) o mapa vem do brilho —
         é o aviso da ficha que diz qual dos dois está na tela        */
      'float dpLer(vec2 uv){',
      '  if(uAtlasInfo.x < 0.5) return luma(srccol(uv));',
      '  return texture(uAtlas, vec2(uv.x, 1.0 - uv.y)).r;',
      '}',
      'float dpAjusta(float d){',
      '  d = (d - 0.5)*u_contraste + 0.5 + u_deslocar;',
      '  return pow(clamp(d, 0.0, 1.0), max(u_gama, 0.05));',
      '}',
      /* o mapa de cor TURBO (Google), por polinômios */
      'vec3 dpTurbo(float t){',
      '  t = clamp(t, 0.0, 1.0);',
      '  vec4 k1 = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);',
      '  vec4 k2 = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);',
      '  vec4 k3 = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);',
      '  vec2 r1 = vec2(-152.94239396, 59.28637943);',
      '  vec2 g1 = vec2(4.27729857, 2.82956604);',
      '  vec2 b1 = vec2(-89.90310912, 27.34824973);',
      '  vec4 v4 = vec4(1.0, t, t*t, t*t*t);',
      '  vec2 v2 = v4.zw*v4.z;',
      '  return vec3(dot(v4, k1) + dot(v2, r1), dot(v4, k2) + dot(v2, g1), dot(v4, k3) + dot(v2, b1));',
      '}',
      'vec4 fx4(vec2 uv){',
      '  vec4 s = src4(uv);',
      '  float d = dpAjusta(dpLer(uv));',
      '  if(u_modo < 0.5) return vec4(vec3(d), s.a);',
      '  if(u_modo < 1.5) return vec4(vec3(1.0 - d), s.a);',
      '  if(u_modo < 2.5) return vec4(clamp(dpTurbo(d), 0.0, 1.0), s.a);',
      '  if(u_modo < 3.5) return vec4(mix(s.rgb, u_nevoa, 1.0 - d), s.a);',
      '  float b = max(u_borda, 0.002);',
      '  float perto = smoothstep(u_corte - b, u_corte + b, d);',
      '  if(u_modo < 4.5) return vec4(s.rgb, s.a*perto);',
      '  return vec4(s.rgb, s.a*(1.0 - perto));',
      '}'
    ].join('\n')
  });

  /* ================================================== MANCHAS ========== */
  D({
    id: 'manchas', name: 'Rastreio de manchas (blob)', cat: 'percepcao', color: PER,
    tempo: true,
    desc: 'visão de máquina: as manchas claras, escuras, em movimento ou de uma cor viram caixas numeradas com coordenadas, ligadas por linhas. O número acompanha o objeto enquanto ele anda',
    atlas: function (params, fxDef, inTex) {
      if (!VE.manchas || !inTex || this !== VE.renderer) return null;
      return VE.manchas.analisar(this, inTex, fxDef.effId || 'x', params);
    },
    params: [
      { k: 'fonte', t: 's', label: 'O que é mancha', def: 0, uni: false, opts: ['O CLARO (brilho)', 'O ESCURO', 'O QUE SE MEXE', 'UMA COR (matiz)'] },
      { k: 'limiar', label: 'Limiar', min: 0, max: 1, def: 0.6, uni: false },
      { k: 'matiz', label: 'Matiz (°) — só para UMA COR', min: 0, max: 360, step: 1, def: 0, uni: false },
      { k: 'tolerancia', label: 'Tolerância do matiz', min: 0.02, max: 0.5, def: 0.08, uni: false },
      { k: 'minimo', label: 'Tamanho mínimo (% do quadro)', min: 0, max: 10, def: 0.3, uni: false },
      { k: 'maximo', label: 'Quantas manchas (máx.)', min: 1, max: 32, step: 1, def: 12, uni: false },
      { k: 'suave', label: 'Suavizar as caixas', min: 0, max: 1, def: 0.5, uni: false },
      { k: 'estilo', t: 's', label: 'Desenho', def: 1, opts: ['CAIXA', 'CANTOS', 'CRUZ', 'CÍRCULO'] },
      { k: 'linhas', t: 'b', label: 'Ligar as manchas', def: 1 },
      { k: 'rotulo', t: 'b', label: 'Número e coordenadas', def: 1 },
      { k: 'centro', t: 'b', label: 'Ponto no centro', def: 1 },
      { k: 'cor', t: 'c', label: 'Cor do traço', def: '#ffffff' },
      { k: 'esp', label: 'Espessura (numa linha de 720)', min: 0.5, max: 6, def: 1.5 },
      { k: 'escala', label: 'Tamanho do rótulo', min: 0.5, max: 3, def: 1.2 },
      { k: 'preencher', label: 'Preencher a caixa', min: 0, max: 1, def: 0 },
      { k: 'escurecer', label: 'Escurecer o vídeo', min: 0, max: 1, def: 0.15 }
    ],
    glsl: [
      'vec4 mLer(int i, int lin){ return texelFetch(uAtlas, ivec2(i, lin), 0); }',
      'float mSeg(vec2 p, vec2 a, vec2 b){',
      '  vec2 pa = p - a, ba = b - a;',
      '  float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-6), 0.0, 1.0);',
      '  return length(pa - ba*h);',
      '}',
      /* um glifo (0-9, :, ,) da tira de dígitos; p em 0..1 na célula */
      'float mGlifo(int g, vec2 p){',
      '  if(p.x < 0.0 || p.x >= 1.0 || p.y < 0.0 || p.y >= 1.0) return 0.0;',
      '  ivec2 t = ivec2(g*int(uAtlasInfo.w) + int(p.x*uAtlasInfo.w), int(uAtlasInfo.y) + int((1.0 - p.y)*16.0));',
      '  return texelFetch(uAtlas, t, 0).r;',
      '}',
      /* escreve um inteiro de `nd` dígitos a partir do canto de baixo à
         esquerda `org`, em células `cel` — só lê a tira quando o pixel
         está dentro da caixa do texto                                 */
      'float mNumero(vec2 px, vec2 org, float valor, int nd, vec2 cel){',
      '  vec2 q = px - org;',
      '  if(q.x < 0.0 || q.y < 0.0 || q.y >= cel.y || q.x >= cel.x*float(nd)) return 0.0;',
      '  int k = int(q.x/cel.x);',
      '  int v = int(valor + 0.5);',
      '  int div = 1;',
      '  for(int j = 0; j < 8; j++){ if(j < nd - 1 - k) div *= 10; }',
      '  int dig = (v/div) - 10*((v/div)/10);',
      '  return mGlifo(dig, vec2(q.x - float(k)*cel.x, q.y)/cel);',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec2 px = uv*uRes;',
      '  float s = uRes.x/720.0;',
      '  float e = max(u_esp*s, 0.75);',
      '  vec3 col = srccol(uv)*(1.0 - u_escurecer);',
      '  int n = int(uAtlasInfo.x + 0.5);',
      '  float cov = 0.0, fill = 0.0, lin = 0.0;',
      '  vec2 cel = vec2(10.0, 16.0)*0.7*u_escala*s;',
      '  for(int i = 0; i < 32; i++){',
      '    if(i >= n) break;',
      '    vec4 b = mLer(i, 0);',
      '    vec2 p0 = b.xy*uRes, p1 = b.zw*uRes;',
      '    vec2 c = (p0 + p1)*0.5, hw = max((p1 - p0)*0.5, vec2(1.0));',
      '    vec2 q = abs(px - c) - hw;',
      '    float dBox = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);',
      /* longe da caixa e do rótulo: nada a fazer com esta mancha */
      '    bool perto = abs(dBox) < e + 2.0 || (px.y > p1.y && px.y < p1.y + 4.0*s + cel.y + 2.0) || (px.y < p0.y && px.y > p0.y - 4.0*s - cel.y - 2.0);',
      '    if(dBox < 0.0 && u_preencher > 0.001) fill = max(fill, u_preencher);',
      '    if(u_centro > 0.5) cov = max(cov, 1.0 - smoothstep(e*1.2, e*1.2 + 1.0, length(px - c)));',
      '    if(u_linhas > 0.5){',
      '      vec4 m = mLer(i, 1); vec4 m2 = mLer(i, 18);',
      '      vec2 cc = m2.zw*uRes;',
      '      if(m.z >= 0.0) lin = max(lin, 1.0 - smoothstep(e*0.3, e*0.3 + 1.0, mSeg(px, cc, m.zw*uRes)));',
      '      if(m2.x >= 0.0) lin = max(lin, 1.0 - smoothstep(e*0.3, e*0.3 + 1.0, mSeg(px, cc, m2.xy*uRes)));',
      '    }',
      '    if(!perto) continue;',
      '    float borda = 1.0 - smoothstep(e*0.5, e*0.5 + 1.0, abs(dBox));',
      '    if(u_estilo < 0.5) cov = max(cov, borda);',
      '    else if(u_estilo < 1.5){',
      /* cantos: a borda, só perto de um canto — a marca corre L ao longo
         de cada aresta a partir dele                                   */
      '      float L = clamp(min(hw.x, hw.y)*0.5, 6.0*s, 40.0*s);',
      '      vec2 dc = hw - abs(px - c);',
      '      cov = max(cov, borda*step(max(dc.x, dc.y), L));',
      '    } else if(u_estilo < 2.5){',
      '      float L = 12.0*s; vec2 d = abs(px - c);',
      '      cov = max(cov, max(step(d.y, e*0.5)*step(d.x, L), step(d.x, e*0.5)*step(d.y, L)));',
      '    } else {',
      '      cov = max(cov, 1.0 - smoothstep(e*0.5, e*0.5 + 1.0, abs(length(px - c) - max(hw.x, hw.y))));',
      '    }',
      '    if(u_rotulo > 0.5){',
      '      vec4 m = mLer(i, 1);',
      '      cov = max(cov, mNumero(px, vec2(p0.x, p1.y + 3.0*s), m.x, 2, cel));',
      '      vec2 org = vec2(p0.x, p0.y - 3.0*s - cel.y);',
      '      float cx3 = floor(clamp((b.x + b.z)*0.5, 0.0, 0.999)*1000.0);',
      '      float cy3 = floor(clamp(1.0 - (b.y + b.w)*0.5, 0.0, 0.999)*1000.0);',
      '      cov = max(cov, mNumero(px, org, cx3, 3, cel));',
      '      cov = max(cov, mGlifo(11, (px - org - vec2(3.0*cel.x, 0.0))/cel));',
      '      cov = max(cov, mNumero(px, org + vec2(4.0*cel.x, 0.0), cy3, 3, cel));',
      '    }',
      '  }',
      '  col = mix(col, u_cor, clamp(fill*0.35, 0.0, 1.0));',
      '  col = mix(col, u_cor*0.85, lin);',
      '  col = mix(col, u_cor, cov);',
      '  return col;',
      '}'
    ].join('\n')
  });

  VE.STYLES.push(
    {
      id: 'visaomaquina', name: 'Visão de máquina', desc: 'as manchas claras rastreadas com cantos, números e linhas, sobre o vídeo escurecido',
      fx: [['manchas', { fonte: 0, limiar: 0.55, estilo: 1, linhas: 1, rotulo: 1, cor: '#ffffff', escurecer: 0.3 }]]
    },
    {
      id: 'profundidadeia', name: 'Profundidade (I.A.)', desc: 'o mapa de profundidade em cinza — perto claro, longe escuro',
      fx: [['profundidade_ia', { modo: 0, contraste: 1.2 }]]
    }
  );

})(window.VE);
