/* ============================================================
   rgb_lab — FAMÍLIA 02 · TEMPO   e   FAMÍLIA 03 · ESPAÇO / DISTORÇÃO
   ------------------------------------------------------------
   TEMPO aqui não é "câmera lenta". É manipulação temporal como
   linguagem: o quadro deixa de ser um instante e passa a ser uma
   janela sobre vários instantes ao mesmo tempo.

   Isto só existe porque o motor guarda os QUATRO últimos quadros
   compostos (uPrev, uH2, uH3, uH4) — ver o anel em js/gl.js.

     DESLOCAMENTO TEMPORAL   ferramenta assinatura: uma máscara decide
                             de qual instante cada pixel vem
     ESTABILIZADOR           mede o tremor do quadro e o cancela

   ESPAÇO trata a imagem como superfície deformável: polar, esfera,
   túnel, dobra, fita de Möbius, líquido, turbulência.
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  var TMP = '#00e5ff';
  var ESP = '#7c5cff';

  /* ------------------------------------------------------------------
     Trecho GLSL comum: escolher um quadro da memória com índice REAL,
     interpolando entre os dois vizinhos. Assim "1,7 quadros atrás"
     existe, e o deslocamento temporal fica contínuo em vez de pular.
     ------------------------------------------------------------------ */
  var PICK = [
    'vec3 pickFrame(float f, vec2 uv){',
    '  f = clamp(f, 0.0, 4.0);',
    '  if(f <= 0.0) return srccol(uv);',
    '  float i0 = floor(f), t = f - i0;',
    '  vec3 a = (i0 < 0.5) ? srccol(uv) : histcol(int(i0), uv);',
    '  vec3 b = histcol(int(min(i0 + 1.0, 4.0)), uv);',
    '  return mix(a, b, t);',
    '}'
  ].join('\n');

  /* ================================================================== */
  /* ============================== TEMPO ============================= */
  /* ================================================================== */

  D({
    id: 'ecotemporal', name: 'Eco temporal', cat: 'tempo', color: TMP,
    desc: 'o quadro atual somado aos anteriores — a imagem deixa rastro de si mesma',
    params: [
      { k: 'taps', label: 'Quantos quadros', min: 1, max: 4, step: 1, def: 4 },
      { k: 'decay', label: 'Decaimento', min: 0.05, max: 0.99, def: 0.6 },
      { k: 'mode', label: 'Mistura', t: 's', opts: ['Média', 'Somar (luz)', 'Máximo', 'Diferença', 'Escurecer'], def: 0 },
      { k: 'dx', label: 'Deslocar X por passo', min: -0.08, max: 0.08, step: 0.0005, def: 0 },
      { k: 'dy', label: 'Deslocar Y por passo', min: -0.08, max: 0.08, step: 0.0005, def: 0 },
      { k: 'zoom', label: 'Escala por passo', min: -0.1, max: 0.1, step: 0.001, def: 0 },
      { k: 'rot', label: 'Giro por passo (°)', min: -20, max: 20, step: 0.1, def: 0 },
      { k: 'hue', label: 'Girar matiz por passo', min: 0, max: 0.5, def: 0 },
      { k: 'amt', label: 'Peso do rastro', min: 0, max: 1, def: 0.8 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 cur = srccol(uv);',
      '  float n = max(1.0, floor(u_taps + 0.5));',
      '  vec3 acc = cur; float wsum = 1.0;',
      '  for(int i=1;i<=4;i++){',
      '    if(float(i) > n) break;',
      '    float f = float(i);',
      '    vec2 p = uv - vec2(u_dx, u_dy)*f;',
      '    p = (p - 0.5)/(1.0 + u_zoom*f) + 0.5;',
      '    p = 0.5 + rot2(p - 0.5, u_rot*PI/180.0*f);',
      '    vec3 c = histcol(i, p);',
      '    if(u_hue > 0.0001){ vec3 hv = rgb2hsv(c); hv.x = fract(hv.x + u_hue*f); c = hsv2rgb(hv); }',
      '    float w = pow(clamp(u_decay, 0.05, 0.99), f);',
      '    float m = floor(u_mode + 0.5);',
      '    if(m < 0.5)      { acc += c*w; wsum += w; }',
      '    else if(m < 1.5) { acc = 1.0 - (1.0 - acc)*(1.0 - c*w); }',
      '    else if(m < 2.5) { acc = max(acc, c*w); }',
      '    else if(m < 3.5) { acc = mix(acc, abs(acc - c), w*0.9); }',
      '    else             { acc = min(acc, mix(vec3(1.0), c, w)); }',
      '  }',
      '  float m2 = floor(u_mode + 0.5);',
      '  vec3 outc = (m2 < 0.5) ? acc/max(wsum, 1e-3) : acc;',
      '  return mix(cur, outc, u_amt);',
      '}'
    ].join('\n')
  });

  D({
    id: 'acumulo', name: 'Acúmulo de quadros', cat: 'tempo', color: TMP,
    desc: 'dezenas ou centenas de quadros somados: água, fumaça, gente andando',
    params: [
      { k: 'keep', label: 'Retenção', min: 0.5, max: 0.999, step: 0.001, def: 0.94 },
      { k: 'gain', label: 'Ganho do novo', min: 0, max: 1, def: 0.16 },
      { k: 'mode', label: 'Como acumula', t: 's', opts: ['Somar (luz)', 'Máximo', 'Mínimo', 'Média longa', 'Diferença'], def: 1 },
      { k: 'sel', label: 'Só o que é claro', min: 0, max: 1, def: 0 },
      { k: 'move', label: 'Só o que se moveu', min: 0, max: 1, def: 0 },
      { k: 'drift', label: 'Deriva do acumulado', min: 0, max: 0.02, step: 0.0002, def: 0 },
      { k: 'ang', label: 'Direção da deriva (°)', min: 0, max: 360, step: 1, def: 90 },
      { k: 'fade', t: 'c', label: 'Cor do esvaziamento', def: '#000000' },
      { k: 'show', label: 'Ver o vivo por cima', min: 0, max: 1, def: 0.25 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 cur = srccol(uv);',
      '  float a = u_ang*PI/180.0;',
      '  vec2 d = vec2(cos(a)/max(uAspect, 0.001), sin(a))*u_drift;',
      '  vec3 mem = histcol(1, uv - d);',
      '  mem = mix(u_fade, mem, clamp(u_keep, 0.5, 0.999));',
      '  vec3 add = cur*u_gain;',
      '  float gate = 1.0;',
      '  if(u_sel > 0.001) gate *= mix(1.0, smoothstep(0.35, 0.8, luma(cur)), u_sel);',
      '  if(u_move > 0.001){',
      '    float mv = clamp(length(cur - histcol(1, uv))*4.0, 0.0, 1.0);',
      '    gate *= mix(1.0, mv, u_move);',
      '  }',
      '  add *= gate;',
      '  float m = floor(u_mode + 0.5);',
      '  vec3 outc;',
      '  if(m < 0.5)      outc = 1.0 - (1.0 - mem)*(1.0 - add);',
      '  else if(m < 1.5) outc = max(mem, cur*gate);',
      '  else if(m < 2.5) outc = min(mem + (1.0 - u_keep), mix(vec3(1.0), cur, gate));',
      '  else if(m < 3.5) outc = mix(mem, cur, u_gain*gate);',
      '  else             outc = clamp(mem + abs(cur - histcol(1, uv))*gate*2.0, 0.0, 1.0);',
      '  return mix(outc, cur, u_show);',
      '}'
    ].join('\n')
  });

  D({
    id: 'borratempo', name: 'Borrão temporal', cat: 'tempo', color: TMP,
    desc: 'em vez de duplicar quadros, mistura o movimento entre eles',
    params: [
      { k: 'amt', label: 'Força', min: 0, max: 1, def: 0.75 },
      { k: 'taps', label: 'Quadros usados', min: 2, max: 4, step: 1, def: 4 },
      { k: 'steps', label: 'Passos entre quadros', min: 1, max: 8, step: 1, def: 4 },
      { k: 'search', label: 'Busca de movimento', min: 0, max: 0.06, step: 0.0005, def: 0.012 },
      { k: 'shutter', label: 'Ângulo do obturador', min: 0.1, max: 2, def: 1 },
      { k: 'edge', label: 'Só onde há movimento', min: 0, max: 1, def: 0.3 }
    ],
    glsl: [
      /* estimativa grosseira de para onde este pedaço de imagem foi:
         testa oito direções e fica com a que mais se parece            */
      'vec2 bfFlow(vec2 uv, float r){',
      '  if(r < 0.0002) return vec2(0.0);',
      '  vec3 c0 = box3(uv, 1.5);',
      '  vec2 best = vec2(0.0); float bd = 1e9;',
      '  for(int i=0;i<8;i++){',
      '    float a = float(i)*(PI/4.0);',
      '    vec2 d = vec2(cos(a)/max(uAspect, 0.001), sin(a))*r;',
      '    vec3 c1 = histcol(1, uv + d);',
      '    float e = dot(abs(c0 - c1), vec3(1.0));',
      '    if(e < bd){ bd = e; best = d; }',
      '  }',
      '  return best;',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 cur = srccol(uv);',
      '  vec2 flow = bfFlow(uv, u_search)*u_shutter;',
      '  float n = max(2.0, floor(u_taps + 0.5));',
      '  float sp = max(1.0, floor(u_steps + 0.5));',
      '  vec3 acc = vec3(0.0); float wsum = 0.0;',
      '  for(int i=0;i<4;i++){',
      '    if(float(i) >= n) break;',
      '    for(int j=0;j<8;j++){',
      '      if(float(j) >= sp) break;',
      '      float t = (float(i) + float(j)/sp);',
      '      vec2 p = uv + flow*t;',
      '      vec3 c = pickFrame(t, p);',
      '      float w = 1.0 - t/(n + 0.5);',
      '      acc += c*w; wsum += w;',
      '    }',
      '  }',
      '  vec3 outc = acc/max(wsum, 1e-3);',
      '  float mv = clamp(length(cur - histcol(1, uv))*5.0, 0.0, 1.0);',
      '  float k = u_amt*mix(1.0, mv, u_edge);',
      '  return mix(cur, outc, clamp(k, 0.0, 1.0));',
      '}'
    ].join('\n'),
    pre: PICK
  });

  D({
    id: 'tempodesl', name: 'Deslocamento temporal', cat: 'tempo', color: TMP,
    desc: 'uma máscara decide de qual instante cada pixel vem — o quadro deixa de ter uma só hora',
    params: [
      { k: 'src', label: 'O que controla', t: 's', opts: ['Horizontal', 'Vertical', 'Radial', 'Luminância', 'Ruído', 'Diagonal', 'Faixas'], def: 0 },
      { k: 'depth', label: 'Profundidade (quadros)', min: 0, max: 4, def: 4 },
      { k: 'bias', label: 'Deslocar o mapa', min: -1, max: 1, def: 0 },
      { k: 'gamma', label: 'Curva do mapa', min: 0.2, max: 4, def: 1 },
      { k: 'bands', label: 'Degraus (0 = contínuo)', min: 0, max: 32, step: 1, def: 0 },
      { k: 'scale', label: 'Escala do mapa', min: 0.5, max: 40, def: 6 },
      { k: 'flow', label: 'Correr o mapa', min: -2, max: 2, def: 0 },
      { k: 'inv', label: 'Inverter', t: 'b', def: 0 },
      { k: 'seam', label: 'Costura visível', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'float tdMap(vec2 uv){',
      '  float m = floor(u_src + 0.5);',
      '  float t = uTime*u_flow;',
      '  if(m < 0.5) return fract(uv.x + t);',
      '  if(m < 1.5) return fract(uv.y + t);',
      '  if(m < 2.5){ vec2 p = uv - 0.5; p.x *= uAspect; return clamp(length(p)*1.7 + t, 0.0, 1.0); }',
      '  if(m < 3.5) return luma(box3(uv, 2.0));',
      '  if(m < 4.5) return fbm3(uv*max(u_scale, 0.5), t);',
      '  if(m < 5.5) return fract((uv.x + uv.y)*0.5 + t);',
      '  return fract(uv.y*max(u_scale, 0.5)*0.5 + t);',
      '}',
      'vec3 fx(vec2 uv){',
      '  float k = clamp(tdMap(uv) + u_bias, 0.0, 1.0);',
      '  k = pow(k, max(u_gamma, 0.05));',
      '  if(u_inv > 0.5) k = 1.0 - k;',
      '  if(u_bands >= 1.0){ float n = floor(u_bands + 0.5); k = floor(k*n)/max(n - 1.0, 1.0); }',
      '  vec3 outc = pickFrame(k*u_depth, uv);',
      '  if(u_seam > 0.001){',
      '    float e = abs(fract(k*max(u_bands, 8.0)) - 0.5);',
      '    outc = mix(outc, vec3(0.0), (1.0 - smoothstep(0.42, 0.5, e))*u_seam);',
      '  }',
      '  return outc;',
      '}'
    ].join('\n'),
    pre: PICK
  });

  D({
    id: 'sangriatempo', name: 'Sangria de tempo', cat: 'tempo', color: TMP,
    desc: 'um quadro invade o seguinte por dentro, como tinta atravessando o papel',
    params: [
      { k: 'amt', label: 'Quanto invade', min: 0, max: 1, def: 0.6 },
      { k: 'scale', label: 'Escala da mancha', min: 1, max: 30, def: 7 },
      { k: 'speed', label: 'Velocidade da mancha', min: 0, max: 3, def: 0.5 },
      { k: 'depth', label: 'De quantos quadros atrás', min: 1, max: 4, def: 2 },
      { k: 'edge', label: 'Dureza da borda', min: 0.01, max: 1, def: 0.25 },
      { k: 'push', label: 'Empurrão espacial', min: 0, max: 0.1, step: 0.001, def: 0.012 },
      { k: 'tint', t: 'c', label: 'Tinta da costura', def: '#ffffff' },
      { k: 'seam', label: 'Brilho da costura', min: 0, max: 1, def: 0.2 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float n = fbm3(uv*max(u_scale, 1.0), uTime*u_speed);',
      '  float k = smoothstep(0.5 - u_edge, 0.5 + u_edge, n + (u_amt - 0.5)*1.4);',
      '  vec2 g = vec2(dFdx(n), dFdy(n))*u_push*60.0;',
      '  vec3 old = pickFrame(u_depth, uv + g);',
      '  vec3 cur = srccol(uv);',
      '  vec3 outc = mix(cur, old, k);',
      '  float band = 1.0 - smoothstep(0.0, u_edge*0.8 + 0.01, abs(k - 0.5));',
      '  return outc + u_tint*band*u_seam;',
      '}'
    ].join('\n'),
    pre: PICK
  });

  D({
    id: 'congelaparcial', name: 'Congelamento parcial', cat: 'tempo', color: TMP,
    desc: 'parte do quadro congela e o resto continua andando',
    params: [
      { k: 'src', label: 'O que congela', t: 's', opts: ['Metade esquerda', 'Metade de cima', 'Fora do centro', 'O que é escuro', 'O que é claro', 'O parado', 'Ruído'], def: 0 },
      { k: 'pos', label: 'Corte', min: 0, max: 1, def: 0.5 },
      { k: 'soft', label: 'Suavidade', min: 0.001, max: 0.4, def: 0.02 },
      { k: 'hold', label: 'Firmeza do congelamento', min: 0.5, max: 1, step: 0.001, def: 0.985 },
      { k: 'scale', label: 'Escala (ruído)', min: 1, max: 30, def: 8 },
      { k: 'inv', label: 'Inverter', t: 'b', def: 0 },
      { k: 'line', label: 'Marcar a fronteira', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 cur = srccol(uv);',
      '  vec3 mem = histcol(1, uv);',
      '  float m = floor(u_src + 0.5);',
      '  float k;',
      '  if(m < 0.5)      k = smoothstep(u_pos - u_soft, u_pos + u_soft, 1.0 - uv.x);',
      '  else if(m < 1.5) k = smoothstep(u_pos - u_soft, u_pos + u_soft, uv.y);',
      '  else if(m < 2.5){ vec2 p = uv - 0.5; p.x *= uAspect; k = smoothstep(u_pos*0.7 - u_soft, u_pos*0.7 + u_soft, length(p)); }',
      '  else if(m < 3.5) k = 1.0 - smoothstep(u_pos - u_soft, u_pos + u_soft, luma(cur));',
      '  else if(m < 4.5) k = smoothstep(u_pos - u_soft, u_pos + u_soft, luma(cur));',
      '  else if(m < 5.5) k = 1.0 - smoothstep(0.02, 0.02 + u_soft + 0.06, length(cur - mem));',
      '  else             k = smoothstep(u_pos - u_soft, u_pos + u_soft, fbm(uv*max(u_scale, 1.0)));',
      '  if(u_inv > 0.5) k = 1.0 - k;',
      '  vec3 outc = mix(cur, mix(cur, mem, clamp(u_hold, 0.5, 1.0)), k);',
      '  if(u_line > 0.001){',
      '    float e = 1.0 - smoothstep(0.0, 0.12, abs(k - 0.5));',
      '    outc = mix(outc, vec3(1.0, 0.85, 0.0), e*u_line);',
      '  }',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ==================================================================
     ESTABILIZADOR
     O shader só aplica a correção; quem MEDE o tremor é o analisador em
     js/stab.js, que compara o quadro com o anterior por perfis de
     projeção e entrega a correção pronta no uniform uStab.
     Com o analisador desligado, uStab é zero e sobra o corte de
     segurança — nada quebra.
     ================================================================== */
  D({
    id: 'estabilizador', name: 'Estabilizador de vídeo', cat: 'tempo', color: TMP,
    desc: 'mede o tremor do quadro e o cancela, com corte de segurança nas bordas',
    params: [
      { k: 'amt', label: 'Força', min: 0, max: 1, def: 0.85 },
      { k: 'crop', label: 'Corte de segurança', min: 0, max: 0.3, def: 0.06 },
      { k: 'axis', label: 'Eixos', t: 's', opts: ['X e Y', 'Só horizontal', 'Só vertical'], def: 0 },
      { k: 'edge', label: 'Bordas', t: 's', opts: ['Esticar', 'Espelhar', 'Preto', 'Quadro anterior'], def: 0 },
      { k: 'show', label: 'Ver a medição', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 s = uStab.xy*u_amt;',
      '  float ax = floor(u_axis + 0.5);',
      '  if(ax > 0.5 && ax < 1.5) s.y = 0.0;',
      '  if(ax > 1.5) s.x = 0.0;',
      '  float z = 1.0 + max(u_crop, 0.0)*2.0;',
      '  vec2 p = (uv - 0.5)/z + 0.5 + s;',
      '  vec3 outc;',
      '  float e = floor(u_edge + 0.5);',
      '  bool fora = (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0);',
      '  if(e < 0.5)      outc = srccol(clamp(p, 0.0, 1.0));',
      '  else if(e < 1.5){ vec2 q = abs(fract(p*0.5)*2.0 - 1.0); outc = srccol(q); }',
      '  else if(e < 2.5) outc = fora ? vec3(0.0) : srccol(p);',
      '  else             outc = fora ? histcol(1, clamp(p, 0.0, 1.0)) : srccol(p);',
      /* leitura na tela: uma cruz que mostra o quanto foi corrigido e um
         retângulo com o corte de segurança                              */
      '  if(u_show > 0.001){',
      '    vec2 c = uv - 0.5;',
      '    vec2 sc = uStab.xy*8.0;',
      '    float arm = (1.0 - smoothstep(0.0, 0.0016, abs(c.y - sc.y)))*step(abs(c.x - sc.x), 0.03)',
      '              + (1.0 - smoothstep(0.0, 0.0016, abs(c.x - sc.x)))*step(abs(c.y - sc.y), 0.03);',
      '    float m = max(u_crop, 0.0);',
      '    vec2 b = abs(c) - vec2(0.5 - m*0.5);',
      '    float box = (1.0 - smoothstep(0.0, 0.0016, abs(max(b.x, b.y))))*step(max(b.x, b.y), 0.004);',
      '    outc = mix(outc, vec3(1.0, 0.82, 0.0), clamp(arm + box, 0.0, 1.0)*u_show);',
      '  }',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ================================================================== */
  /* ====================== ESPAÇO / DISTORÇÃO ======================== */
  /* ================================================================== */

  D({
    id: 'liquido', name: 'Líquido', cat: 'espaco', color: ESP,
    desc: 'a imagem se comporta como água: ondulação, refração e brilho de superfície',
    params: [
      { k: 'amp', label: 'Amplitude', min: 0, max: 0.2, step: 0.001, def: 0.03 },
      { k: 'scale', label: 'Escala das ondas', min: 0.5, max: 30, def: 6 },
      { k: 'speed', label: 'Velocidade', min: 0, max: 4, def: 0.7 },
      { k: 'layers', label: 'Camadas', min: 1, max: 4, step: 1, def: 3 },
      { k: 'refr', label: 'Refração cromática', min: 0, max: 1, def: 0.25 },
      { k: 'spec', label: 'Brilho da superfície', min: 0, max: 2, def: 0.45 },
      { k: 'lightc', t: 'c', label: 'Cor do brilho', def: '#ffffff' },
      { k: 'depth', label: 'Escurecer o fundo', min: 0, max: 1, def: 0.2 }
    ],
    glsl: [
      'vec2 liqField(vec2 uv, float t){',
      '  float n = max(1.0, floor(u_layers + 0.5));',
      '  vec2 d = vec2(0.0);',
      '  for(int i=0;i<4;i++){',
      '    if(float(i) >= n) break;',
      '    float s = max(u_scale, 0.5)*pow(1.9, float(i));',
      '    float ph = t*(1.0 + float(i)*0.37);',
      '    d += vec2(sin(uv.y*s + ph)*cos(uv.x*s*0.8 - ph*0.7),',
      '              cos(uv.x*s - ph*1.1)*sin(uv.y*s*0.9 + ph*0.6))/pow(1.7, float(i));',
      '  }',
      '  return d;',
      '}',
      'vec3 fx(vec2 uv){',
      '  float t = uTime*u_speed;',
      '  vec2 d = liqField(uv, t)*u_amp;',
      '  vec3 c;',
      '  if(u_refr > 0.001){',
      '    c = vec3(srccol(uv + d*(1.0 + u_refr*0.35)).r,',
      '             srccol(uv + d).g,',
      '             srccol(uv + d*(1.0 - u_refr*0.35)).b);',
      '  } else c = srccol(uv + d);',
      /* a inclinação da superfície vira brilho especular */
      '  vec2 e = vec2(0.004, 0.0);',
      '  float hx = length(liqField(uv + e.xy, t)) - length(liqField(uv - e.xy, t));',
      '  float hy = length(liqField(uv + e.yx, t)) - length(liqField(uv - e.yx, t));',
      '  vec3 nrm = normalize(vec3(-hx, -hy, 0.06));',
      '  float sp = pow(max(dot(nrm, normalize(vec3(0.5, 0.7, 0.5))), 0.0), 12.0);',
      '  c = mix(c, c*(1.0 - u_depth), clamp(-hy*4.0, 0.0, 1.0));',
      '  return c + u_lightc*sp*u_spec;',
      '}'
    ].join('\n')
  });

  D({
    id: 'calor', name: 'Distorção de calor', cat: 'espaco', color: ESP,
    desc: 'miragem: o ar quente sobe e a imagem treme em faixas horizontais',
    params: [
      { k: 'amp', label: 'Amplitude', min: 0, max: 0.08, step: 0.0005, def: 0.012 },
      { k: 'scale', label: 'Escala', min: 2, max: 60, def: 22 },
      { k: 'speed', label: 'Subida', min: 0, max: 6, def: 1.6 },
      { k: 'anis', label: 'Achatar na horizontal', min: 0, max: 1, def: 0.75 },
      { k: 'grad', label: 'Só perto do chão', min: 0, max: 1, def: 0.5 },
      { k: 'hot', label: 'Só nas áreas quentes', min: 0, max: 1, def: 0 },
      { k: 'shimmer', label: 'Cintilância', min: 0, max: 1, def: 0.2 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 s = vec2(max(u_scale, 2.0)*(1.0 - u_anis*0.85), max(u_scale, 2.0));',
      '  float n1 = vnoise(uv*s + vec2(0.0, -uTime*u_speed));',
      '  float n2 = vnoise(uv*s*2.1 + vec2(11.3, -uTime*u_speed*1.7));',
      '  float k = (n1*0.7 + n2*0.3 - 0.5)*2.0;',
      '  float gate = mix(1.0, 1.0 - smoothstep(0.0, 0.7, uv.y), u_grad);',
      '  if(u_hot > 0.001) gate *= mix(1.0, smoothstep(0.4, 0.85, luma(srccol(uv))), u_hot);',
      '  vec2 d = vec2(k, k*0.55)*u_amp*gate;',
      '  vec3 c = srccol(uv + d);',
      '  c *= 1.0 + k*u_shimmer*0.25*gate;',
      '  return c;',
      '}'
    ].join('\n')
  });

  D({
    id: 'turbulencia', name: 'Turbulência', cat: 'espaco', color: ESP,
    desc: 'ruído fractal move os pixels — a imagem entra em regime turbulento',
    params: [
      { k: 'amp', label: 'Força', min: 0, max: 0.3, step: 0.001, def: 0.05 },
      { k: 'scale', label: 'Escala', min: 0.5, max: 24, def: 4 },
      { k: 'octaves', label: 'Oitavas', min: 1, max: 6, step: 1, def: 3 },
      { k: 'speed', label: 'Evolução', min: 0, max: 3, def: 0.35 },
      { k: 'curl', label: 'Rotacional (vórtice)', min: 0, max: 1, def: 0.7 },
      { k: 'iter', label: 'Iterações', min: 1, max: 5, step: 1, def: 2 },
      { k: 'sep', label: 'Separar canais', min: 0, max: 1, def: 0.15 }
    ],
    glsl: [
      'vec2 turbField(vec2 p, float t){',
      '  float n = max(1.0, floor(u_octaves + 0.5));',
      '  float a = 0.5; vec2 d = vec2(0.0);',
      '  for(int i=0;i<6;i++){',
      '    if(float(i) >= n) break;',
      '    float e = 0.01;',
      '    float c0 = vnoise(p + vec2(t, 0.0));',
      '    float cx = vnoise(p + vec2(e + t, 0.0));',
      '    float cy = vnoise(p + vec2(t, e));',
      '    vec2 g = vec2(cx - c0, cy - c0)/e;',
      '    vec2 cu = vec2(g.y, -g.x);',
      '    d += mix(g, cu, u_curl)*a;',
      '    p *= 2.03; a *= 0.55; t *= 1.3;',
      '  }',
      '  return d;',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv*vec2(max(uAspect, 0.001), 1.0)*max(u_scale, 0.5);',
      '  float t = uTime*u_speed;',
      '  vec2 q = uv;',
      '  int it = int(max(1.0, floor(u_iter + 0.5)));',
      '  for(int i=0;i<5;i++){',
      '    if(i >= it) break;',
      '    q += turbField(p + q*max(u_scale, 0.5), t)*u_amp/float(it);',
      '  }',
      '  vec2 d = q - uv;',
      '  if(u_sep > 0.001){',
      '    return vec3(srccol(uv + d*(1.0 + u_sep)).r, srccol(uv + d).g, srccol(uv + d*(1.0 - u_sep)).b);',
      '  }',
      '  return srccol(q);',
      '}'
    ].join('\n')
  });

  D({
    id: 'polar', name: 'Polar ↔ cartesiano', cat: 'espaco', color: ESP,
    desc: 'converte o quadro entre coordenadas retas e circulares — abre um mundo de formas',
    params: [
      { k: 'dir', label: 'Sentido', t: 's', opts: ['Reto → circular', 'Circular → reto'], def: 0 },
      { k: 'amt', label: 'Interpolar', min: 0, max: 1, def: 1 },
      { k: 'cx', label: 'Centro X', min: -0.5, max: 1.5, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: -0.5, max: 1.5, def: 0.5 },
      { k: 'turns', label: 'Voltas', min: 0.1, max: 6, def: 1 },
      { k: 'zoom', label: 'Raio', min: 0.1, max: 4, def: 1 },
      { k: 'spin', label: 'Girar (°)', min: -360, max: 360, step: 1, def: 0 },
      { k: 'roll', label: 'Girar no tempo', min: -2, max: 2, def: 0 },
      { k: 'rep', label: 'Repetir o anel', t: 'b', def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 c = vec2(u_cx, u_cy);',
      '  vec2 p = uv - c; p.x *= uAspect;',
      '  float sp = u_spin*PI/180.0 + uTime*u_roll;',
      '  vec2 q;',
      '  if(u_dir < 0.5){',
      '    float r = length(p)/max(u_zoom, 0.05);',
      '    float a = (atan(p.y, p.x) + sp)/(2.0*PI)*max(u_turns, 0.1);',
      '    q = vec2(fract(a + 0.5), clamp(r, 0.0, 1.0));',
      '    if(u_rep < 0.5 && (r > 1.0)) return vec3(0.0);',
      '  } else {',
      '    float a = (uv.x - 0.5)*2.0*PI*max(u_turns, 0.1) + sp;',
      '    float r = uv.y*max(u_zoom, 0.05)*0.7;',
      '    q = c + vec2(cos(a)*r/max(uAspect, 0.001), sin(a)*r);',
      '  }',
      '  return mix(srccol(uv), srccol(q), u_amt);',
      '}'
    ].join('\n')
  });

  D({
    id: 'esfera', name: 'Esfera', cat: 'espaco', color: ESP,
    desc: 'o quadro é enrolado numa superfície esférica, com refração na borda',
    params: [
      { k: 'r', label: 'Raio', min: 0.05, max: 1.2, def: 0.45 },
      { k: 'cx', label: 'Centro X', min: -0.5, max: 1.5, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: -0.5, max: 1.5, def: 0.5 },
      { k: 'ior', label: 'Refração', min: 0.2, max: 3, def: 1.35 },
      { k: 'out_', label: 'Fora da esfera', t: 's', opts: ['Original', 'Escuro', 'Espelhado', 'Repetido'], def: 0 },
      { k: 'shade', label: 'Sombreado', min: 0, max: 1, def: 0.4 },
      { k: 'spin', label: 'Girar (°)', min: -360, max: 360, step: 1, def: 0 },
      { k: 'chrom', label: 'Aberração', min: 0, max: 1, def: 0.15 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 c = vec2(u_cx, u_cy);',
      '  vec2 p = uv - c; p.x *= uAspect;',
      '  float d = length(p)/max(u_r, 0.05);',
      '  if(d > 1.0){',
      '    float o = floor(u_out_ + 0.5);',
      '    if(o < 0.5) return srccol(uv);',
      '    if(o < 1.5) return srccol(uv)*0.25;',
      '    if(o < 2.5){ vec2 q = c + (p/max(d*d, 1e-3))*vec2(1.0/max(uAspect,0.001), 1.0)*max(u_r,0.05); return srccol(q); }',
      '    return srccol(fract(uv*2.0));',
      '  }',
      '  float z = sqrt(max(1.0 - d*d, 0.0));',
      '  vec2 n = p/max(length(p), 1e-5);',
      '  float bend = asin(clamp(d, 0.0, 1.0)) - asin(clamp(d/max(u_ior, 0.2), 0.0, 1.0));',
      '  vec2 off = n*tan(bend)*max(u_r, 0.05)*z;',
      '  off = rot2(off, u_spin*PI/180.0);',
      '  off.x /= max(uAspect, 0.001);',
      '  vec3 col;',
      '  if(u_chrom > 0.001){',
      '    col = vec3(srccol(uv + off*(1.0 + u_chrom*0.12)).r,',
      '               srccol(uv + off).g,',
      '               srccol(uv + off*(1.0 - u_chrom*0.12)).b);',
      '  } else col = srccol(uv + off);',
      '  float lit = mix(1.0, 0.35 + 0.9*z, u_shade);',
      '  float rim = smoothstep(0.86, 1.0, d);',
      '  return col*lit + rim*0.12*u_shade;',
      '}'
    ].join('\n')
  });

  D({
    id: 'tunel', name: 'Túnel', cat: 'espaco', color: ESP,
    desc: 'profundidade falsa: o quadro se repete para dentro, indo embora',
    params: [
      { k: 'speed', label: 'Velocidade', min: -3, max: 3, def: 0.5 },
      { k: 'rep', label: 'Repetições', min: 0.5, max: 12, def: 3 },
      { k: 'twist', label: 'Torção', min: -4, max: 4, def: 0.4 },
      { k: 'cx', label: 'Centro X', min: 0, max: 1, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: 0, max: 1, def: 0.5 },
      { k: 'fade', label: 'Escurecer ao longe', min: 0, max: 1, def: 0.6 },
      { k: 'fog', t: 'c', label: 'Cor do longe', def: '#0a0a0c' },
      { k: 'ring', label: 'Anéis', min: 0, max: 1, def: 0.2 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv - vec2(u_cx, u_cy); p.x *= uAspect;',
      '  float r = max(length(p), 1e-4);',
      '  float a = atan(p.y, p.x);',
      '  float depth = 1.0/r;',
      '  float z = fract(depth*max(u_rep, 0.5)*0.12 + uTime*u_speed*0.25);',
      '  float ang = a/(2.0*PI) + u_twist*depth*0.05;',
      '  vec2 q = vec2(fract(ang + 0.5), z);',
      '  vec3 c = srccol(q);',
      '  float far = clamp(1.0 - r*2.4, 0.0, 1.0);',
      '  c = mix(c, u_fog, far*u_fade);',
      '  c *= 1.0 + sin(z*PI*2.0)*u_ring*0.4;',
      '  return c;',
      '}'
    ].join('\n')
  });

  D({
    id: 'dobra', name: 'Dobra', cat: 'espaco', color: ESP,
    desc: 'o espaço se dobra sobre si mesmo — origami feito de imagem',
    params: [
      { k: 'n', label: 'Dobras', min: 1, max: 10, step: 1, def: 3 },
      { k: 'ang', label: 'Ângulo (°)', min: 0, max: 360, step: 1, def: 30 },
      { k: 'off', label: 'Posição do vinco', min: -1, max: 1, def: 0 },
      { k: 'scale', label: 'Escala por dobra', min: 0.5, max: 1.6, def: 1 },
      { k: 'spin', label: 'Girar por dobra (°)', min: -90, max: 90, step: 1, def: 0 },
      { k: 'roll', label: 'Girar no tempo', min: -2, max: 2, def: 0 },
      { k: 'crease', label: 'Marcar o vinco', min: 0, max: 1, def: 0.15 },
      { k: 'zoom', label: 'Aproximar', min: 0.2, max: 3, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv - 0.5; p.x *= uAspect;',
      '  p /= max(u_zoom, 0.2);',
      '  float n = max(1.0, floor(u_n + 0.5));',
      '  float cre = 0.0;',
      '  for(int i=0;i<10;i++){',
      '    if(float(i) >= n) break;',
      '    float a = (u_ang + float(i)*180.0/n)*PI/180.0 + uTime*u_roll*0.4;',
      '    vec2 nn = vec2(cos(a), sin(a));',
      '    float d = dot(p, nn) - u_off*0.3;',
      '    cre = max(cre, 1.0 - smoothstep(0.0, 0.02, abs(d)));',
      '    p -= 2.0*min(d, 0.0)*nn;',
      '    p *= u_scale;',
      '    p = rot2(p, u_spin*PI/180.0);',
      '  }',
      '  p.x /= max(uAspect, 0.001);',
      '  vec3 c = srccol(p + 0.5);',
      '  return mix(c, vec3(0.0), cre*u_crease);',
      '}'
    ].join('\n')
  });

  D({
    id: 'mobius', name: 'Möbius', cat: 'espaco', color: ESP,
    desc: 'transformação conforme: a imagem vira uma fita sem lado de dentro',
    params: [
      { k: 'ax', label: 'Ponto A · X', min: -1.5, max: 1.5, def: -0.35 },
      { k: 'ay', label: 'Ponto A · Y', min: -1.5, max: 1.5, def: 0 },
      { k: 'bx', label: 'Ponto B · X', min: -1.5, max: 1.5, def: 0.35 },
      { k: 'by', label: 'Ponto B · Y', min: -1.5, max: 1.5, def: 0 },
      { k: 'twist', label: 'Torção', min: -4, max: 4, def: 1 },
      { k: 'zoom', label: 'Escala', min: 0.1, max: 4, def: 1 },
      { k: 'spin', label: 'Girar no tempo', min: -2, max: 2, def: 0.2 },
      { k: 'tile', label: 'Repetir', t: 'b', def: 1 }
    ],
    glsl: [
      'vec2 cdiv(vec2 a, vec2 b){ float d = dot(b, b) + 1e-6; return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y)/d; }',
      'vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }',
      'vec2 clog(vec2 z){ return vec2(log(max(length(z), 1e-6)), atan(z.y, z.x)); }',
      'vec2 cexp(vec2 z){ return exp(z.x)*vec2(cos(z.y), sin(z.y)); }',
      'vec3 fx(vec2 uv){',
      '  vec2 z = (uv - 0.5)*2.0; z.x *= uAspect;',
      '  z /= max(u_zoom, 0.1);',
      '  vec2 a = vec2(u_ax, u_ay), b = vec2(u_bx, u_by);',
      /* leva os dois pontos para 0 e ∞ e aplica um logaritmo torcido */
      '  vec2 w = cdiv(z - a, z - b);',
      '  vec2 lw = clog(w);',
      '  float t = uTime*u_spin;',
      '  lw = cmul(lw, vec2(cos(u_twist*0.5), sin(u_twist*0.5)));',
      '  lw.y += t;',
      '  if(u_tile > 0.5){ lw.x = fract(lw.x*0.5)*2.0 - 1.0; lw.y = fract(lw.y/(2.0*PI))*2.0*PI - PI; }',
      '  vec2 q = cexp(lw);',
      /* volta pelo caminho inverso: z = (a - b·w)/(1 - w) */
      '  vec2 zz = cdiv(a - cmul(b, q), vec2(1.0, 0.0) - q);',
      '  vec2 p = zz; p.x /= max(uAspect, 0.001);',
      '  return srccol(p*0.5 + 0.5);',
      '}'
    ].join('\n')
  });

  D({
    id: 'lente', name: 'Lente (barril · almofada)', cat: 'espaco', color: ESP,
    desc: 'distorção geométrica de lente com aberração cromática e vinheta óptica',
    params: [
      { k: 'k1', label: 'Distorção k1', min: -1, max: 1, def: 0.25 },
      { k: 'k2', label: 'Distorção k2', min: -1, max: 1, def: 0 },
      { k: 'fish', label: 'Olho de peixe', min: 0, max: 1, def: 0 },
      { k: 'chrom', label: 'Aberração cromática', min: 0, max: 1, def: 0.2 },
      { k: 'zoom', label: 'Escala', min: 0.3, max: 2.5, def: 1 },
      { k: 'cx', label: 'Centro X', min: 0, max: 1, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: 0, max: 1, def: 0.5 },
      { k: 'vig', label: 'Vinheta óptica', min: 0, max: 1, def: 0.25 },
      { k: 'edge', label: 'Fora do círculo', t: 's', opts: ['Esticar', 'Preto', 'Espelhar'], def: 0 }
    ],
    glsl: [
      'vec3 lenSample(vec2 p, float e){',
      '  bool fora = (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0);',
      '  if(!fora) return srccol(p);',
      '  if(e < 0.5) return srccol(clamp(p, 0.0, 1.0));',
      '  if(e < 1.5) return vec3(0.0);',
      '  return srccol(abs(fract(p*0.5)*2.0 - 1.0));',
      '}',
      'vec2 lenWarp(vec2 uv, float k){',
      '  vec2 c = vec2(u_cx, u_cy);',
      '  vec2 p = uv - c; p.x *= uAspect;',
      '  float r2 = dot(p, p);',
      '  float f = 1.0 + u_k1*k*r2 + u_k2*k*r2*r2;',
      '  if(u_fish > 0.001){',
      '    float r = sqrt(r2);',
      '    float th = atan(r*max(u_fish, 0.001)*2.2);',
      '    f = mix(f, r > 1e-5 ? (th/max(r, 1e-5))*0.7 : 1.0, u_fish);',
      '  }',
      '  p *= f/max(u_zoom, 0.3);',
      '  p.x /= max(uAspect, 0.001);',
      '  return p + c;',
      '}',
      'vec3 fx(vec2 uv){',
      '  float e = floor(u_edge + 0.5);',
      '  vec3 col;',
      '  if(u_chrom > 0.001){',
      '    col = vec3(lenSample(lenWarp(uv, 1.0 + u_chrom*0.10), e).r,',
      '               lenSample(lenWarp(uv, 1.0), e).g,',
      '               lenSample(lenWarp(uv, 1.0 - u_chrom*0.10), e).b);',
      '  } else col = lenSample(lenWarp(uv, 1.0), e);',
      '  vec2 p = uv - vec2(u_cx, u_cy); p.x *= uAspect;',
      '  col *= 1.0 - smoothstep(0.35, 0.95, length(p))*u_vig;',
      '  return col;',
      '}'
    ].join('\n')
  });

  D({
    id: 'mapadesl', name: 'Mapa de deslocamento', cat: 'espaco', color: ESP,
    desc: 'um mapa comanda a deformação: canal da imagem, ruído, xadrez ou o quadro anterior',
    params: [
      { k: 'map', label: 'Mapa', t: 's', opts: ['Luminância', 'Vermelho', 'Verde', 'Azul', 'Ruído fractal', 'Celular', 'Xadrez', 'Quadro anterior', 'Bordas'], def: 0 },
      { k: 'amt', label: 'Força', min: -0.4, max: 0.4, step: 0.001, def: 0.08 },
      { k: 'scale', label: 'Escala do mapa', min: 0.5, max: 40, def: 5 },
      { k: 'speed', label: 'Evolução', min: 0, max: 3, def: 0.2 },
      { k: 'mode', label: 'Direção', t: 's', opts: ['Gradiente do mapa', 'Horizontal', 'Vertical', 'Radial', 'Fixa'], def: 0 },
      { k: 'ang', label: 'Ângulo fixo (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'sep', label: 'Separar canais', min: 0, max: 1, def: 0.1 },
      { k: 'view', label: 'Ver o mapa', t: 'b', def: 0 }
    ],
    glsl: [
      'float dmMap(vec2 uv){',
      '  float m = floor(u_map + 0.5);',
      '  float s = max(u_scale, 0.5);',
      '  float t = uTime*u_speed;',
      '  if(m < 0.5) return luma(srccol(uv));',
      '  if(m < 1.5) return srccol(uv).r;',
      '  if(m < 2.5) return srccol(uv).g;',
      '  if(m < 3.5) return srccol(uv).b;',
      '  if(m < 4.5) return fbm3(uv*vec2(uAspect, 1.0)*s, t);',
      '  if(m < 5.5) return voronoi(uv*vec2(uAspect, 1.0)*s + t).x;',
      '  if(m < 6.5) return mod(floor(uv.x*s) + floor(uv.y*s), 2.0);',
      '  if(m < 7.5) return luma(histcol(1, uv));',
      '  return clamp(length(gradient(uv, 1.5))*2.0, 0.0, 1.0);',
      '}',
      'vec3 fx(vec2 uv){',
      '  float v = dmMap(uv);',
      '  if(u_view > 0.5) return vec3(v);',
      '  vec2 dir;',
      '  float md = floor(u_mode + 0.5);',
      '  if(md < 0.5){',
      '    float e = 2.0/max(uRes.x, 1.0);',
      '    dir = vec2(dmMap(uv + vec2(e, 0.0)) - v, dmMap(uv + vec2(0.0, e)) - v)*40.0;',
      '  } else if(md < 1.5) dir = vec2(v - 0.5, 0.0)*2.0;',
      '  else if(md < 2.5)   dir = vec2(0.0, v - 0.5)*2.0;',
      '  else if(md < 3.5){ vec2 p = uv - 0.5; p.x *= uAspect; dir = normalize(p + 1e-5)*(v - 0.5)*2.0; }',
      '  else { float a = u_ang*PI/180.0; dir = vec2(cos(a), sin(a))*(v - 0.5)*2.0; }',
      '  dir.x /= max(uAspect, 0.001);',
      '  vec2 d = dir*u_amt;',
      '  if(u_sep > 0.001){',
      '    return vec3(srccol(uv + d*(1.0 + u_sep)).r, srccol(uv + d).g, srccol(uv + d*(1.0 - u_sep)).b);',
      '  }',
      '  return srccol(uv + d);',
      '}'
    ].join('\n')
  });

  D({
    id: 'caleidolab', name: 'Caleidoscópio de laboratório', cat: 'espaco', color: ESP,
    desc: 'segmentos, centro, deslocamento e giro — o caleidoscópio com todos os parâmetros abertos',
    params: [
      { k: 'seg', label: 'Segmentos', min: 2, max: 24, step: 1, def: 6 },
      { k: 'rot', label: 'Girar o espelho (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'spin', label: 'Girar no tempo', min: -3, max: 3, def: 0.2 },
      { k: 'cx', label: 'Centro X', min: -0.5, max: 1.5, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: -0.5, max: 1.5, def: 0.5 },
      { k: 'ox', label: 'Deslocar a fonte X', min: -1, max: 1, def: 0 },
      { k: 'oy', label: 'Deslocar a fonte Y', min: -1, max: 1, def: 0 },
      { k: 'zoom', label: 'Aproximar', min: 0.1, max: 4, def: 1 },
      { k: 'rings', label: 'Anéis concêntricos', min: 0, max: 6, step: 1, def: 0 },
      { k: 'mirror', label: 'Espelhar o segmento', t: 'b', def: 1 },
      { k: 'seam', label: 'Marcar as costuras', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv - vec2(u_cx, u_cy); p.x *= uAspect;',
      '  float n = max(2.0, floor(u_seg + 0.5));',
      '  float a = atan(p.y, p.x) + u_rot*PI/180.0 + uTime*u_spin;',
      '  float r = length(p)/max(u_zoom, 0.1);',
      '  float seg = 2.0*PI/n;',
      '  float k = mod(a, seg);',
      '  if(u_mirror > 0.5) k = abs(k - seg*0.5);',
      '  if(u_rings >= 1.0){',
      '    float rn = floor(u_rings + 0.5);',
      '    float rr = r*rn;',
      '    r = abs(fract(rr) - 0.5)*2.0/rn;',
      '  }',
      '  vec2 q = vec2(cos(k), sin(k))*r;',
      '  q.x /= max(uAspect, 0.001);',
      '  vec3 c = srccol(q + vec2(0.5 + u_ox*0.5, 0.5 + u_oy*0.5));',
      '  if(u_seam > 0.001){',
      '    float e = 1.0 - smoothstep(0.0, 0.02, min(k, abs(k - seg*0.5)));',
      '    c = mix(c, vec3(0.0), e*u_seam);',
      '  }',
      '  return c;',
      '}'
    ].join('\n')
  });

})(window.VE);
