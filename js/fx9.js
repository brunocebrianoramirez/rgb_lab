/* ============================================================
   rgb_lab — FAMÍLIA 04 · GLITCH   e   FAMÍLIA 05 · PIXEL / DIGITAL
   ------------------------------------------------------------
   O glitch genérico — separar RGB, riscar a tela e jogar ruído — é
   fácil e cansa rápido. Aqui cada efeito imita um MECANISMO real de
   falha, e todos os parâmetros do mecanismo ficam na mão:

     digital   quantização de bits, blocos de compressão, vetores de
               movimento presos, colapso de taxa
     analógico fita esticada, perda de trilha, chaveamento de cabeça,
               sangria de croma, rasgo horizontal

   CUBIK é o retalho: o quadro é picado numa grade irregular e cada
   pedaço vem de outro lugar e de outro instante.
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  var GLI = '#ff2e63';
  var PIX = '#2ee6a8';

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

  /* ==================================================================
     CUBIK — o quadro picado numa grade irregular
     A subdivisão é binária: cada célula pode se partir ao meio, na
     horizontal ou na vertical, algumas vezes. Cada pedaço resultante
     sorteia origem, escala, instante e separação de canais.
     ================================================================== */
  D({
    id: 'cubik', name: 'Cubik (retalho)', cat: 'glitch', color: GLI,
    desc: 'o quadro é picado numa grade irregular; cada pedaço vem de outro lugar e outro instante',
    params: [
      { k: 'cols', label: 'Colunas', min: 1, max: 16, step: 1, def: 5 },
      { k: 'rows', label: 'Linhas', min: 1, max: 16, step: 1, def: 4 },
      { k: 'depth', label: 'Subdivisões', min: 0, max: 4, step: 1, def: 2 },
      { k: 'split', label: 'Chance de partir', min: 0, max: 1, def: 0.55 },
      { k: 'dens', label: 'Quantos pedaços entram', min: 0, max: 1, def: 0.5 },
      { k: 'rate', label: 'Trocas por segundo', min: 0, max: 30, step: 0.5, def: 4 },
      { k: 'jump', label: 'Salto da origem', min: 0, max: 1, def: 0.35 },
      { k: 'zoom', label: 'Variação de escala', min: 0, max: 2, def: 0.5 },
      { k: 'timeb', label: 'Salto no tempo', min: 0, max: 4, def: 1.5 },
      { k: 'rgb', label: 'Separação de canais', min: 0, max: 1, def: 0.35 },
      { k: 'flip', label: 'Espelhar pedaços', min: 0, max: 1, def: 0.25 },
      { k: 'gap', label: 'Filete entre pedaços', min: 0, max: 1, def: 0.15 },
      { k: 'gapc', t: 'c', label: 'Cor do filete', def: '#0d0d0f' },
      { k: 'seed', label: 'Semente', min: 0, max: 99, step: 1, def: 7 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 base = srccol(uv);',
      '  float step_ = (u_rate < 0.05) ? 0.0 : floor(uTime*u_rate);',
      '  vec2 g = vec2(max(1.0, floor(u_cols + 0.5)), max(1.0, floor(u_rows + 0.5)));',
      '  vec2 idx = floor(uv*g);',
      '  vec2 lo = idx/g, hi = (idx + 1.0)/g;',
      /* subdivisão binária: cada nível pode partir a célula ao meio */
      '  for(int i=0;i<4;i++){',
      '    if(float(i) >= u_depth) break;',
      '    float h = hash21(lo*167.3 + hi*61.7 + vec2(float(i)*13.0 + u_seed, step_*3.1));',
      '    if(h > u_split) break;',
      '    vec2 mid = (lo + hi)*0.5;',
      '    if(h < u_split*0.5){ if(uv.x < mid.x) hi.x = mid.x; else lo.x = mid.x; }',
      '    else               { if(uv.y < mid.y) hi.y = mid.y; else lo.y = mid.y; }',
      '  }',
      '  vec2 size = max(hi - lo, vec2(1e-4));',
      '  vec2 local = (uv - lo)/size;',
      '  vec2 key = lo*211.7 + hi*43.9 + u_seed;',
      '  float s0 = hash21(key + vec2(step_, 0.0));',
      '  float s1 = hash21(key + vec2(0.0, step_) + 19.3);',
      '  float s2 = hash21(key + vec2(step_, step_) + 71.1);',
      '  if(s0 > u_dens) return base;',
      /* o pedaço olha para outro lugar do quadro, com escala própria */
      '  vec2 l2 = local;',
      '  if(s2 < u_flip) l2.x = 1.0 - l2.x;',
      '  if(s2 > 1.0 - u_flip*0.5) l2.y = 1.0 - l2.y;',
      '  float z = 1.0 + (s1 - 0.5)*u_zoom;',
      '  vec2 src = lo + size*0.5 + (l2 - 0.5)*size/max(z, 0.15);',
      '  src += (vec2(s1, s2) - 0.5)*u_jump*0.7;',
      '  float tf = floor(s2*u_timeb*1.4);',
      '  vec3 c;',
      '  float sep = (s1 > 1.0 - u_rgb) ? (0.004 + s2*0.02)*u_rgb : 0.0;',
      '  if(sep > 0.0001){',
      '    c = vec3(pickFrame(tf, src + vec2(sep, 0.0)).r,',
      '             pickFrame(tf, src).g,',
      '             pickFrame(tf, src - vec2(sep, 0.0)).b);',
      '  } else c = pickFrame(tf, src);',
      /* filete: a costura entre os pedaços é parte do desenho */
      '  if(u_gap > 0.001){',
      '    vec2 px = texel()/size;',
      '    float w = u_gap*2.2;',
      '    float e = min(min(local.x, 1.0 - local.x)/max(px.x, 1e-5),',
      '                  min(local.y, 1.0 - local.y)/max(px.y, 1e-5));',
      '    c = mix(u_gapc, c, smoothstep(0.0, max(w, 0.001), e));',
      '  }',
      '  return c;',
      '}'
    ].join('\n'),
    pre: PICK
  });

  /* ======================== QUANTIZAÇÃO DE BITS ==================== */
  D({
    id: 'bitcrush', name: 'Esmagamento de bits', cat: 'pixel', color: PIX,
    desc: 'menos bits por canal, com dithering ordenado — a cor perde resolução, não nitidez',
    params: [
      { k: 'rb', label: 'Bits no vermelho', min: 1, max: 8, step: 1, def: 3 },
      { k: 'gb', label: 'Bits no verde', min: 1, max: 8, step: 1, def: 3 },
      { k: 'bb', label: 'Bits no azul', min: 1, max: 8, step: 1, def: 2 },
      { k: 'dith', label: 'Dithering', min: 0, max: 1, def: 0.6 },
      { k: 'dmode', label: 'Trama do dither', t: 's', opts: ['Bayer 4×4', 'Bayer 8×8', 'Ruído', 'Linhas'], def: 0 },
      { k: 'px', label: 'Pixel (px)', min: 1, max: 40, def: 1 },
      { k: 'gam', label: 'Gama antes', min: 0.2, max: 3, def: 1 }
    ],
    glsl: [
      'float bayer4(vec2 p){',
      '  int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0));',
      '  int i = y*4 + x;',
      '  float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);',
      '  return m[i]/16.0;',
      '}',
      'float bayer8(vec2 p){',
      '  float a = bayer4(p);',
      '  float b = bayer4(floor(p/4.0));',
      '  return (a + b/16.0)*(16.0/17.0);',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec2 q = uv;',
      '  if(u_px > 1.05){ vec2 g = uRes/max(u_px, 1.0); q = (floor(uv*g) + 0.5)/g; }',
      '  vec3 c = pow(max(srccol(q), 1e-6), vec3(max(u_gam, 0.05)));',
      '  vec2 pp = uv*uRes;',
      '  float d = 0.5;',
      '  float dm = floor(u_dmode + 0.5);',
      '  if(dm < 0.5)      d = bayer4(pp);',
      '  else if(dm < 1.5) d = bayer8(pp);',
      '  else if(dm < 2.5) d = hash21(floor(pp));',
      '  else              d = fract(pp.y*0.5);',
      '  vec3 lv = vec3(exp2(floor(u_rb + 0.5)) - 1.0, exp2(floor(u_gb + 0.5)) - 1.0, exp2(floor(u_bb + 0.5)) - 1.0);',
      '  vec3 outc = floor(c*lv + (d - 0.5)*u_dith + 0.5)/max(lv, vec3(1.0));',
      '  return pow(max(outc, 1e-6), vec3(1.0/max(u_gam, 0.05)));',
      '}'
    ].join('\n')
  });

  D({
    id: 'bitplane', name: 'Plano de bits', cat: 'pixel', color: PIX,
    desc: 'isola ou embaralha um bit do valor de cada pixel — a imagem por dentro',
    params: [
      { k: 'bit', label: 'Bit', min: 0, max: 7, step: 1, def: 6 },
      { k: 'mode', label: 'Modo', t: 's', opts: ['Isolar', 'Trocar com o vizinho', 'Zerar', 'XOR com posição'], def: 0 },
      { k: 'chan', label: 'Canais', t: 's', opts: ['Todos', 'Vermelho', 'Verde', 'Azul', 'Luminância'], def: 0 },
      { k: 'amt', label: 'Mistura', min: 0, max: 1, def: 1 },
      { k: 'shift', label: 'Deslocar no tempo', min: 0, max: 8, def: 0 }
    ],
    glsl: [
      'float bpBit(float v, float b){ return mod(floor(v*255.0/exp2(b)), 2.0); }',
      'float bpApply(float v){',
      '  float b = floor(u_bit + 0.5) + floor(uTime*u_shift);',
      '  b = mod(b, 8.0);',
      '  float m = floor(u_mode + 0.5);',
      '  float n = floor(v*255.0);',
      '  float bit = bpBit(v, b);',
      '  if(m < 0.5) return bit;',
      '  if(m < 1.5){',
      '    float o = mod(b + 1.0, 8.0);',
      '    float b2 = bpBit(v, o);',
      '    n = n - bit*exp2(b) - b2*exp2(o) + b2*exp2(b) + bit*exp2(o);',
      '    return n/255.0;',
      '  }',
      '  if(m < 2.5) return (n - bit*exp2(b))/255.0;',
      '  return abs(bit - 1.0);',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float ch = floor(u_chan + 0.5);',
      '  vec3 outc = c;',
      '  if(ch < 0.5)      outc = vec3(bpApply(c.r), bpApply(c.g), bpApply(c.b));',
      '  else if(ch < 1.5) outc.r = bpApply(c.r);',
      '  else if(ch < 2.5) outc.g = bpApply(c.g);',
      '  else if(ch < 3.5) outc.b = bpApply(c.b);',
      '  else              outc = vec3(bpApply(luma(c)));',
      '  return mix(c, outc, u_amt);',
      '}'
    ].join('\n')
  });

  /* ===================== COLAPSO DE COMPRESSÃO ===================== */
  D({
    id: 'compressao', name: 'Colapso de compressão', cat: 'glitch', color: GLI,
    desc: 'blocos de 8 pixels, croma amostrado por baixo, tremor nas bordas: o vídeo desistindo',
    params: [
      { k: 'block', label: 'Bloco (px)', min: 2, max: 64, step: 1, def: 8 },
      { k: 'quant', label: 'Quantização', min: 0, max: 1, def: 0.55 },
      { k: 'chroma', label: 'Croma amostrado por baixo', min: 0, max: 1, def: 0.7 },
      { k: 'ring', label: 'Tremor nas bordas', min: 0, max: 1, def: 0.45 },
      { k: 'detail', label: 'Detalhe que sobra', min: 0, max: 1, def: 0.35 },
      { k: 'blocky', label: 'Blocos perdidos', min: 0, max: 1, def: 0.1 },
      { k: 'rate', label: 'Trocas por segundo', min: 0, max: 30, step: 0.5, def: 6 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float B = max(2.0, floor(u_block + 0.5));',
      '  vec2 g = uRes/B;',
      '  vec2 cell = floor(uv*g);',
      '  vec2 cuv = (cell + 0.5)/g;',
      /* média do bloco = o termo DC que a compressão preserva */
      '  vec3 dc = vec3(0.0);',
      '  for(int j=0;j<4;j++) for(int i=0;i<4;i++){',
      '    dc += srccol(cuv + (vec2(float(i), float(j)) - 1.5)/g*0.42);',
      '  }',
      '  dc /= 16.0;',
      '  vec3 c = srccol(uv);',
      '  vec3 detail = c - dc;',
      /* quantiza o detalhe: é o que a taxa de bits corta primeiro */
      '  float q = mix(64.0, 3.0, clamp(u_quant, 0.0, 1.0));',
      '  detail = floor(detail*q + 0.5)/q;',
      '  vec3 outc = dc + detail*u_detail;',
      /* croma em resolução menor que a luminância */
      '  if(u_chroma > 0.001){',
      '    vec2 cg = g/mix(1.0, 4.0, u_chroma);',
      '    vec3 cc = srccol((floor(uv*cg) + 0.5)/cg);',
      '    float l = luma(outc);',
      '    outc = mix(outc, vec3(l) + (cc - vec3(luma(cc))), u_chroma);',
      '  }',
      /* tremor: onde o bloco tem borda forte, a energia vaza */
      '  if(u_ring > 0.001){',
      '    float e = clamp(length(gradient(cuv, 2.0))*1.6, 0.0, 1.0);',
      '    float w = sin((uv.x + uv.y)*uRes.x*0.55/B*6.0);',
      '    outc += w*e*u_ring*0.16;',
      '  }',
      /* blocos que simplesmente não chegaram */
      '  if(u_blocky > 0.001){',
      '    float st = (u_rate < 0.05) ? 0.0 : floor(uTime*u_rate);',
      '    float h = hash21(cell + st*7.7);',
      '    if(h < u_blocky*0.35) outc = histcol(1, uv + (hash22(cell + st) - 0.5)*0.08);',
      '  }',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ======================== MACROBLOCO PRESO ======================= */
  D({
    id: 'macrobloco', name: 'Macrobloco preso', cat: 'glitch', color: GLI,
    desc: 'os vetores de movimento continuam sem a imagem nova: o datamosh, com controle',
    params: [
      { k: 'block', label: 'Bloco (px)', min: 4, max: 96, step: 1, def: 20 },
      { k: 'gain', label: 'Intensidade do vetor', min: 0, max: 4, def: 1.2 },
      { k: 'ang', label: 'Direção imposta (°)', min: -1, max: 360, step: 1, def: -1 },
      { k: 'persist', label: 'Persistência', min: 0, max: 0.995, step: 0.005, def: 0.9 },
      { k: 'decay', label: 'Decaimento da cor', min: 0, max: 1, def: 0.12 },
      { k: 'thresh', label: 'Limiar de movimento', min: 0, max: 0.5, def: 0.03 },
      { k: 'keyframe', label: 'Quadro-chave a cada (s)', min: 0, max: 8, def: 0 },
      { k: 'smear', label: 'Arrasto', min: 0, max: 1, def: 0.6 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float B = max(4.0, floor(u_block + 0.5));',
      '  vec2 g = uRes/B;',
      '  vec2 cell = floor(uv*g);',
      '  vec2 cuv = (cell + 0.5)/g;',
      '  if(u_keyframe > 0.05 && fract(uTime/u_keyframe) < 0.06) return srccol(uv);',
      /* vetor de movimento do bloco: oito direções, a que menos difere */
      '  vec2 mv = vec2(0.0);',
      '  if(u_ang < 0.0){',
      '    vec3 c0 = box3(cuv, 2.0);',
      '    float bd = 1e9;',
      '    for(int i=0;i<8;i++){',
      '      float a = float(i)*(PI/4.0);',
      '      vec2 d = vec2(cos(a)/max(uAspect, 0.001), sin(a))/g*0.9;',
      '      float e = dot(abs(c0 - histcol(1, cuv + d)), vec3(1.0));',
      '      if(e < bd){ bd = e; mv = d; }',
      '    }',
      '    if(bd < u_thresh) mv = vec2(0.0);',
      '  } else {',
      '    float a = u_ang*PI/180.0;',
      '    mv = vec2(cos(a)/max(uAspect, 0.001), sin(a))/g;',
      '  }',
      '  vec2 p = uv + mv*u_gain*u_smear;',
      '  vec3 prev = histcol(1, p);',
      '  vec3 cur = srccol(uv);',
      '  vec3 outc = mix(cur, prev*(1.0 - u_decay*0.12), clamp(u_persist, 0.0, 0.995));',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ========================= FITA ESTICADA ======================== */
  D({
    id: 'fitaestica', name: 'Fita esticada', cat: 'glitch', color: GLI,
    desc: 'a fita passou tantas vezes que perdeu a forma: onda lenta, arrasto e perda de trilha',
    params: [
      { k: 'wow', label: 'Onda lenta', min: 0, max: 0.1, step: 0.0005, def: 0.02 },
      { k: 'flutter', label: 'Tremulação rápida', min: 0, max: 0.05, step: 0.0002, def: 0.006 },
      { k: 'rate', label: 'Velocidade', min: 0.05, max: 8, def: 0.8 },
      { k: 'stretch', label: 'Alongamento vertical', min: 0, max: 0.4, def: 0.06 },
      { k: 'drop', label: 'Perda de trilha', min: 0, max: 1, def: 0.25 },
      { k: 'droph', label: 'Altura da perda', min: 0.002, max: 0.2, def: 0.02 },
      { k: 'smear', label: 'Arrasto horizontal', min: 0, max: 0.2, def: 0.05 },
      { k: 'chroma', label: 'Croma atrasado', min: 0, max: 0.06, step: 0.0005, def: 0.012 },
      { k: 'noise', label: 'Chuvisco', min: 0, max: 1, def: 0.25 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float t = uTime*u_rate;',
      '  float wow = sin(uv.y*3.1 + t*0.7)*u_wow + sin(uv.y*1.3 - t*0.41)*u_wow*0.6;',
      '  float fl = sin(uv.y*180.0 + t*33.0)*u_flutter;',
      '  vec2 p = uv;',
      '  p.x += wow + fl;',
      '  p.y = (p.y - 0.5)*(1.0 + sin(t*0.5)*u_stretch) + 0.5;',
      /* arrasto: a cabeça continua lendo o que já leu */
      '  vec3 c = vec3(0.0); float w = 0.0;',
      '  int N = 6;',
      '  for(int i=0;i<6;i++){',
      '    float f = float(i)/float(N);',
      '    float k = 1.0 - f;',
      '    c += srccol(p - vec2(f*u_smear, 0.0))*k; w += k;',
      '  }',
      '  c /= max(w, 1e-3);',
      '  c = vec3(srccol(p + vec2(u_chroma, 0.0)).r, c.g, srccol(p - vec2(u_chroma, 0.0)).b);',
      /* faixas em que o sinal simplesmente sumiu */
      '  float band = floor(uv.y/max(u_droph, 0.002));',
      '  float h = hash21(vec2(band, floor(t*6.0)));',
      '  if(h < u_drop*0.22){',
      '    float n = hash21(vec2(floor(uv.x*uRes.x/2.0), band + floor(t*30.0)));',
      '    c = mix(c, vec3(n*0.85 + 0.1), 0.85);',
      '  }',
      '  float sn = hash21(floor(uv*uRes/1.5) + floor(uTime*47.0));',
      '  return c + (sn - 0.5)*u_noise*0.35;',
      '}'
    ].join('\n')
  });

  /* ==================== CHAVEAMENTO DE CABEÇA ===================== */
  D({
    id: 'headswitch', name: 'Chaveamento de cabeça', cat: 'glitch', color: GLI,
    desc: 'a faixa rasgada no pé da imagem, onde o tambor troca de cabeça',
    params: [
      { k: 'y', label: 'Altura da faixa', min: 0, max: 0.4, def: 0.045 },
      { k: 'shift', label: 'Deslocamento', min: 0, max: 0.3, def: 0.09 },
      { k: 'noise', label: 'Ruído na faixa', min: 0, max: 1, def: 0.8 },
      { k: 'jitter', label: 'Instabilidade', min: 0, max: 1, def: 0.4 },
      { k: 'lines', label: 'Linhas visíveis', min: 1, max: 40, step: 1, def: 8 },
      { k: 'top', label: 'No topo também', min: 0, max: 1, def: 0 },
      { k: 'sync', label: 'Perda de sincronia', min: 0, max: 1, def: 0.2 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float t = uTime;',
      '  float band = smoothstep(u_y, 0.0, uv.y);',
      '  band = max(band, smoothstep(1.0 - u_y*0.6, 1.0, uv.y)*u_top);',
      '  float j = (hash11(floor(t*24.0)) - 0.5)*u_jitter;',
      '  vec2 p = uv;',
      '  p.x += band*(u_shift + j*0.08);',
      /* perda de sincronia: o quadro inteiro escorrega de vez em quando */
      '  if(u_sync > 0.001){',
      '    float roll = step(1.0 - u_sync*0.14, hash11(floor(t*3.0)));',
      '    p.y = fract(p.y + roll*fract(t*0.9));',
      '  }',
      '  vec3 c = srccol(p);',
      '  if(band > 0.001){',
      '    float ln = floor(uv.y*max(u_lines, 1.0)/max(u_y, 0.002));',
      '    float n = hash21(vec2(floor(uv.x*uRes.x/2.5), ln + floor(t*38.0)));',
      '    c = mix(c, vec3(n), band*u_noise);',
      '  }',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* ======================== SANGRIA DE CROMA ====================== */
  D({
    id: 'sangriacroma', name: 'Sangria de croma', cat: 'glitch', color: GLI,
    desc: 'a cor escorre para a direita e não acompanha o contorno — croma de largura de banda curta',
    params: [
      { k: 'len', label: 'Comprimento', min: 0, max: 0.2, def: 0.05 },
      { k: 'ang', label: 'Direção (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'sat', label: 'Saturação do croma', min: 0, max: 3, def: 1.5 },
      { k: 'delay', label: 'Atraso do croma', min: 0, max: 0.06, step: 0.0005, def: 0.008 },
      { k: 'bw', label: 'Largura de banda', min: 1, max: 24, step: 1, def: 10 },
      { k: 'over', label: 'Estourar a cor', min: 0, max: 1, def: 0.3 },
      { k: 'keepl', label: 'Manter a luminância', min: 0, max: 1, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float l = luma(c);',
      '  float a = u_ang*PI/180.0;',
      '  vec2 dir = vec2(cos(a)/max(uAspect, 0.001), sin(a));',
      '  int N = int(max(1.0, floor(u_bw + 0.5)));',
      '  vec3 acc = vec3(0.0); float w = 0.0;',
      '  for(int i=0;i<24;i++){',
      '    if(i >= N) break;',
      '    float f = float(i)/float(N);',
      '    vec3 s = srccol(uv - dir*(u_len*f + u_delay));',
      '    float k = 1.0 - f;',
      '    acc += (s - vec3(luma(s)))*k; w += k;',
      '  }',
      '  vec3 chroma = acc/max(w, 1e-3)*u_sat;',
      '  vec3 outc = vec3(mix(l, luma(c), u_keepl)) + chroma;',
      '  if(u_over > 0.001){',
      '    vec3 hv = rgb2hsv(clamp(outc, 0.0, 4.0));',
      '    hv.y = clamp(hv.y*(1.0 + u_over*1.5), 0.0, 1.0);',
      '    outc = mix(outc, hsv2rgb(hv), u_over);',
      '  }',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ========================== PERDA DE SINAL ====================== */
  D({
    id: 'perdasinal', name: 'Perda de sinal', cat: 'glitch', color: GLI,
    desc: 'o sinal cai por instantes: neve, barra de cor, congelamento e volta',
    params: [
      { k: 'prob', label: 'Frequência da queda', min: 0, max: 1, def: 0.22 },
      { k: 'len', label: 'Duração da queda', min: 0.01, max: 1.5, def: 0.12 },
      { k: 'rate', label: 'Ritmo', min: 0.2, max: 12, step: 0.1, def: 2.5 },
      { k: 'kind', label: 'O que aparece', t: 's', opts: ['Neve', 'Barras de cor', 'Preto', 'Quadro congelado', 'Sorteia'], def: 4 },
      { k: 'partial', label: 'Cai só em parte do quadro', min: 0, max: 1, def: 0.5 },
      { k: 'hum', label: 'Zumbido na imagem', min: 0, max: 1, def: 0.3 }
    ],
    glsl: [
      'vec3 psBars(vec2 uv){',
      '  float i = floor(uv.x*7.0);',
      '  vec3 b[7] = vec3[7](vec3(0.75), vec3(0.75,0.75,0.0), vec3(0.0,0.75,0.75), vec3(0.0,0.75,0.0),',
      '                      vec3(0.75,0.0,0.75), vec3(0.75,0.0,0.0), vec3(0.0,0.0,0.75));',
      '  vec3 c = b[int(clamp(i, 0.0, 6.0))];',
      '  if(uv.y < 0.22) c *= 0.35;',
      '  return c;',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float slot = floor(uTime*u_rate);',
      '  float h = hash11(slot*3.77);',
      '  float inSlot = fract(uTime*u_rate);',
      '  float on = step(h, u_prob)*step(inSlot, clamp(u_len, 0.01, 1.5));',
      '  if(on < 0.5) return c;',
      '  float region = 1.0;',
      '  if(u_partial > 0.001){',
      '    float y0 = hash11(slot + 5.1), hh = 0.1 + hash11(slot + 8.3)*0.6;',
      '    float band = step(y0, uv.y)*step(uv.y, y0 + hh);',
      '    region = mix(1.0, band, u_partial);',
      '  }',
      '  float kind = floor(u_kind + 0.5);',
      '  if(kind > 3.5) kind = floor(hash11(slot + 13.9)*4.0);',
      '  vec3 lost;',
      '  if(kind < 0.5){',
      '    float n = hash21(floor(uv*uRes/1.4) + floor(uTime*61.0));',
      '    lost = vec3(n);',
      '  } else if(kind < 1.5) lost = psBars(uv);',
      '  else if(kind < 2.5)   lost = vec3(0.0);',
      '  else                  lost = histcol(4, uv);',
      '  vec3 outc = mix(c, lost, region);',
      '  if(u_hum > 0.001) outc *= 1.0 + sin(uv.y*uRes.y*0.35 + uTime*40.0)*u_hum*0.12;',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ========================= RASGO HORIZONTAL ==================== */
  D({
    id: 'rasgo', name: 'Rasgo horizontal', cat: 'glitch', color: GLI,
    desc: 'faixas do quadro escorregam para os lados, cada uma no seu tempo',
    params: [
      { k: 'bands', label: 'Faixas', min: 2, max: 200, step: 1, def: 28 },
      { k: 'amt', label: 'Deslocamento', min: 0, max: 0.6, def: 0.1 },
      { k: 'prob', label: 'Quantas escorregam', min: 0, max: 1, def: 0.3 },
      { k: 'rate', label: 'Trocas por segundo', min: 0, max: 40, step: 0.5, def: 8 },
      { k: 'wrap', label: 'Dar a volta', t: 'b', def: 1 },
      { k: 'rgb', label: 'Separar canais no rasgo', min: 0, max: 1, def: 0.4 },
      { k: 'skew', label: 'Inclinar a faixa', min: 0, max: 1, def: 0.2 },
      { k: 'dark', label: 'Escurecer o rasgo', min: 0, max: 1, def: 0.1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float n = max(2.0, floor(u_bands + 0.5));',
      '  float b = floor(uv.y*n);',
      '  float st = (u_rate < 0.05) ? 0.0 : floor(uTime*u_rate);',
      '  float h = hash21(vec2(b, st));',
      '  if(h > u_prob) return srccol(uv);',
      '  float s = (hash21(vec2(b + 17.0, st)) - 0.5)*2.0*u_amt;',
      '  s += (fract(uv.y*n) - 0.5)*u_skew*u_amt;',
      '  vec2 p = uv + vec2(s, 0.0);',
      '  if(u_wrap > 0.5) p.x = fract(p.x);',
      '  vec3 c;',
      '  float sep = u_rgb*0.02*(0.4 + h);',
      '  if(sep > 0.0002) c = vec3(srccol(p + vec2(sep, 0.0)).r, srccol(p).g, srccol(p - vec2(sep, 0.0)).b);',
      '  else c = srccol(p);',
      '  return c*(1.0 - u_dark*h);',
      '}'
    ].join('\n')
  });

  /* ======================= ERRO DE TRILHA ========================= */
  D({
    id: 'tracking', name: 'Erro de trilha', cat: 'glitch', color: GLI,
    desc: 'a barra de trilha sobe pela imagem levando ruído e deformação com ela',
    params: [
      { k: 'speed', label: 'Velocidade da barra', min: -3, max: 3, def: 0.35 },
      { k: 'h', label: 'Altura da barra', min: 0.01, max: 0.5, def: 0.1 },
      { k: 'push', label: 'Empurrão', min: 0, max: 0.3, def: 0.06 },
      { k: 'noise', label: 'Ruído', min: 0, max: 1, def: 0.6 },
      { k: 'bright', label: 'Clarear', min: 0, max: 1, def: 0.3 },
      { k: 'lines', label: 'Linhas dentro da barra', min: 0, max: 120, step: 1, def: 40 },
      { k: 'count', label: 'Quantas barras', min: 1, max: 5, step: 1, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv;',
      '  float acc = 0.0;',
      '  float n = max(1.0, floor(u_count + 0.5));',
      '  for(int i=0;i<5;i++){',
      '    if(float(i) >= n) break;',
      '    float y = fract(uTime*u_speed*0.2 + float(i)/n);',
      '    float d = abs(fract(uv.y - y + 0.5) - 0.5);',
      '    float k = 1.0 - smoothstep(0.0, max(u_h, 0.01)*0.5, d);',
      '    acc = max(acc, k);',
      '  }',
      '  p.x += acc*u_push*(0.6 + 0.4*sin(uv.y*220.0));',
      '  vec3 c = srccol(p);',
      '  if(acc > 0.001){',
      '    float ln = u_lines < 1.0 ? 1.0 : (0.5 + 0.5*sin(uv.y*u_lines*40.0));',
      '    float nz = hash21(floor(vec2(uv.x*uRes.x/2.0, uv.y*uRes.y)) + floor(uTime*53.0));',
      '    c = mix(c, vec3(nz*ln), acc*u_noise);',
      '    c += acc*u_bright*0.35;',
      '  }',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* ================== PIXEL AVANÇADO (FORMA E LIMIAR) ============= */
  D({
    id: 'pixelforma', name: 'Pixel com forma', cat: 'pixel', color: PIX,
    desc: 'mosaico com forma escolhida, folga entre células e limiar por célula',
    params: [
      { k: 'size', label: 'Tamanho (px)', min: 2, max: 120, def: 18 },
      { k: 'shape', label: 'Forma', t: 's', opts: ['Quadrado', 'Círculo', 'Losango', 'Hexágono', 'Triângulo', 'Cruz', 'Barra'], def: 1 },
      { k: 'gap', label: 'Folga', min: 0, max: 0.9, def: 0.12 },
      { k: 'thr', label: 'Limiar do tamanho', min: 0, max: 1, def: 0.55 },
      { k: 'scale', label: 'Tamanho pela luz', min: 0, max: 1, def: 0.5 },
      { k: 'rot', label: 'Girar a grade (°)', min: 0, max: 90, step: 1, def: 0 },
      { k: 'stagger', label: 'Desencontrar linhas', min: 0, max: 1, def: 0 },
      { k: 'bg', t: 'c', label: 'Fundo', def: '#16150f' },
      { k: 'keep', label: 'Deixar ver a imagem', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'float pfShape(vec2 q, float s){',
      '  float m = floor(u_shape + 0.5);',
      '  q = abs(q);',
      '  if(m < 0.5) return step(max(q.x, q.y), s);',
      '  if(m < 1.5) return step(length(q), s);',
      '  if(m < 2.5) return step(q.x + q.y, s*1.35);',
      '  if(m < 3.5) return step(max(q.x*0.866 + q.y*0.5, q.y), s);',
      '  if(m < 4.5) return step(max(q.x*1.15 + q.y*0.6, -q.y*1.2 + 0.001), s);',
      '  if(m < 5.5) return step(min(q.x, q.y), s*0.42);',
      '  return step(q.y, s*0.5);',
      '}',
      'vec3 fx(vec2 uv){',
      '  float S = max(2.0, u_size);',
      '  vec2 g = uRes/S;',
      '  vec2 r = rot2(uv - 0.5, u_rot*PI/180.0) + 0.5;',
      '  vec2 gp = r*g;',
      '  gp.x += floor(gp.y)*u_stagger*0.5;',
      '  vec2 cell = floor(gp);',
      '  vec2 q = fract(gp) - 0.5;',
      '  vec2 cuv = rot2((cell + 0.5)/g - 0.5, -u_rot*PI/180.0) + 0.5;',
      '  vec3 c = srccol(cuv);',
      '  float l = luma(c);',
      '  float s = (0.5 - u_gap*0.5)*mix(1.0, smoothstep(0.0, u_thr + 0.001, l), u_scale);',
      '  float on = pfShape(q, s);',
      '  vec3 outc = mix(u_bg, c, on);',
      '  return mix(outc, srccol(uv), u_keep);',
      '}'
    ].join('\n')
  });

  /* ==================== ORDENAÇÃO DE PIXELS ANIMADA =============== */
  D({
    id: 'pixelsortlab', name: 'Ordenação de pixels', cat: 'pixel', color: PIX,
    desc: 'os pixels de cada linha se organizam por brilho, matiz ou canal — com o limiar andando no tempo',
    params: [
      { k: 'dir', label: 'Direção', t: 's', opts: ['Horizontal', 'Vertical', 'Diagonal'], def: 0 },
      { k: 'by', label: 'Ordenar por', t: 's', opts: ['Luminância', 'Matiz', 'Saturação', 'Vermelho', 'Verde', 'Azul'], def: 0 },
      { k: 'lo', label: 'Limiar de baixo', min: 0, max: 1, def: 0.25 },
      { k: 'hi', label: 'Limiar de cima', min: 0, max: 1, def: 0.8 },
      { k: 'move', label: 'Limiar anda no tempo', min: 0, max: 2, def: 0.35 },
      { k: 'len', label: 'Comprimento máximo', min: 0.01, max: 1, def: 0.35 },
      { k: 'steps', label: 'Amostras', min: 4, max: 48, step: 1, def: 22 },
      { k: 'rev', label: 'Inverter a ordem', t: 'b', def: 0 },
      { k: 'amt', label: 'Mistura', min: 0, max: 1, def: 1 }
    ],
    glsl: [
      'float psKey(vec3 c){',
      '  float m = floor(u_by + 0.5);',
      '  if(m < 0.5) return luma(c);',
      '  if(m < 1.5) return rgb2hsv(c).x;',
      '  if(m < 2.5) return rgb2hsv(c).y;',
      '  if(m < 3.5) return c.r;',
      '  if(m < 4.5) return c.g;',
      '  return c.b;',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 base = srccol(uv);',
      '  float lo = clamp(u_lo + sin(uTime*u_move)*0.18, 0.0, 1.0);',
      '  float hi = clamp(u_hi + cos(uTime*u_move*0.77)*0.18, 0.0, 1.0);',
      '  float k = psKey(base);',
      '  if(k < min(lo, hi) || k > max(lo, hi)) return base;',
      '  float d = floor(u_dir + 0.5);',
      '  vec2 dir = (d < 0.5) ? vec2(1.0, 0.0) : (d < 1.5 ? vec2(0.0, 1.0) : normalize(vec2(1.0, 1.0)));',
      '  int N = int(max(4.0, floor(u_steps + 0.5)));',
      /* posição relativa deste pixel dentro do trecho ordenado */
      '  float pos = dot(uv, dir);',
      '  float seg = max(u_len, 0.01);',
      '  float t0 = floor(pos/seg)*seg;',
      /* conta quantos vizinhos do trecho têm chave menor: esse é o índice
         final do pixel numa ordenação — sem precisar ordenar de verdade  */
      '  float rank = 0.0; float cnt = 0.0;',
      '  for(int i=0;i<48;i++){',
      '    if(i >= N) break;',
      '    float f = (float(i) + 0.5)/float(N);',
      '    vec2 p = uv + dir*(t0 + f*seg - pos);',
      '    float kk = psKey(srccol(p));',
      '    if(kk < k) rank += 1.0;',
      '    cnt += 1.0;',
      '  }',
      '  float target = rank/max(cnt, 1.0);',
      '  if(u_rev > 0.5) target = 1.0 - target;',
      '  vec2 q = uv + dir*(t0 + target*seg - pos);',
      '  return mix(base, srccol(q), u_amt);',
      '}'
    ].join('\n')
  });

  /* ======================== MOSAICO CELULAR ======================= */
  D({
    id: 'celular', name: 'Mosaico celular', cat: 'pixel', color: PIX,
    desc: 'a imagem quebrada em células irregulares de Voronoi, com filete e deriva',
    params: [
      { k: 'scale', label: 'Densidade', min: 2, max: 120, def: 26 },
      { k: 'drift', label: 'Deriva', min: 0, max: 2, def: 0.25 },
      { k: 'edge', label: 'Filete', min: 0, max: 1, def: 0.25 },
      { k: 'edgec', t: 'c', label: 'Cor do filete', def: '#16150f' },
      { k: 'jitter', label: 'Origem sorteada', min: 0, max: 1, def: 0.35 },
      { k: 'shade', label: 'Sombrear a célula', min: 0, max: 1, def: 0.25 },
      { k: 'flat', label: 'Cor chapada', min: 0, max: 1, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv*vec2(max(uAspect, 0.001), 1.0)*max(u_scale, 2.0);',
      '  p += vec2(sin(uTime*u_drift*0.7), cos(uTime*u_drift*0.53))*u_drift;',
      '  vec3 v = voronoi(p);',
      /* centro aproximado da célula, de volta em uv */
      '  vec2 cuv = uv + (vec2(v.y, v.z) - 0.5)*u_jitter/max(u_scale, 2.0);',
      '  vec3 c = mix(srccol(uv), srccol(cuv), u_flat);',
      '  c *= 1.0 - v.x*u_shade;',
      /* a distância ao núcleo cresce em direção à fronteira: o filete é
         o anel mais externo de cada célula                              */
      '  float rim = smoothstep(0.52, 0.80, v.x);',
      '  return mix(c, u_edgec, rim*u_edge);',
      '}'
    ].join('\n')
  });

  /* ====================== DESLOCAMENTO DE BITS ==================== */
  D({
    id: 'bitshift', name: 'Deslocamento de bits', cat: 'pixel', color: PIX,
    desc: 'a aritmética inteira aplicada à cor: deslocar, somar módulo, comparar bit a bit',
    params: [
      { k: 'op', label: 'Operação', t: 's', opts: ['Deslocar ←', 'Deslocar →', 'XOR entre canais', 'Somar módulo', 'E lógico', 'OU lógico'], def: 0 },
      { k: 'n', label: 'Quantidade', min: 0, max: 7, step: 1, def: 2 },
      { k: 'mask', label: 'Máscara', min: 0, max: 255, step: 1, def: 255 },
      { k: 'amt', label: 'Mistura', min: 0, max: 1, def: 1 },
      { k: 'pos', label: 'Somar a posição', min: 0, max: 1, def: 0 },
      { k: 'time', label: 'Somar o tempo', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  ivec3 n = ivec3(clamp(c, 0.0, 1.0)*255.0);',
      '  int k = int(floor(u_n + 0.5));',
      '  int msk = int(floor(u_mask + 0.5));',
      '  if(u_pos > 0.001) n += ivec3(vec3(uv.x, uv.y, uv.x + uv.y)*255.0*u_pos);',
      '  if(u_time > 0.001) n += ivec3(vec3(fract(uTime*0.3), fract(uTime*0.17), fract(uTime*0.11))*255.0*u_time);',
      '  n = n & ivec3(255);',
      '  int m = int(floor(u_op + 0.5));',
      '  ivec3 r = n;',
      '  if(m == 0)      r = (n << k) & ivec3(255);',
      '  else if(m == 1) r = n >> k;',
      '  else if(m == 2) r = ivec3(n.r ^ n.g, n.g ^ n.b, n.b ^ n.r);',
      '  else if(m == 3) r = (n + ivec3(k*32)) & ivec3(255);',
      '  else if(m == 4) r = n & ivec3(msk);',
      '  else            r = n | ivec3(msk & 63);',
      '  vec3 outc = vec3(r)/255.0;',
      '  return mix(c, outc, u_amt);',
      '}'
    ].join('\n')
  });

})(window.VE);
