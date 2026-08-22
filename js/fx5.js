/* ============================================================
   rgb_lab — PELÍCULA
   ------------------------------------------------------------
   O pacote de câmera antiga: a JANELA (o formato do quadro, com o
   canto arredondado que a chapa deixa), os VAZAMENTOS DE LUZ, o
   FLASH de começo de rolo, o GRÃO por bitola, a SUJEIRA e o
   TREMOR DA JANELA.

   Nota honesta sobre bitolas: 32mm não existe como formato de
   captação. As bitolas reais que este pacote cobre são
   8mm · Super 8 · 16mm · 35mm — em ordem crescente de área de
   quadro, e portanto de grão cada vez mais fino.
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  /* trecho GLSL compartilhado: a geometria da janela de projeção.
     FMT: 0 = 8mm · 1 = Super 8 · 2 = 16mm · 3 = 35mm                  */
  var GATE = [
    /* devolve (largura, altura, raio do canto, proporção) da bitola */
    'vec4 gateSpec(float fmt){',
    '  if(fmt < 0.5)      return vec4(0.780, 0.700, 0.150, 1.33);',  /* 8mm regular */
    '  else if(fmt < 1.5) return vec4(0.840, 0.720, 0.115, 1.36);',  /* Super 8 */
    '  else if(fmt < 2.5) return vec4(0.885, 0.760, 0.070, 1.37);',  /* 16mm */
    '  return vec4(0.930, 0.800, 0.035, 1.37);',                     /* 35mm */
    '}',
    /* retângulo de canto redondo, com borda macia */
    'float roundBox(vec2 p, vec2 b, float r){',
    '  vec2 q = abs(p) - b + r;',
    '  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;',
    '}'
  ].join('\n');

  /* ============================================== JANELA DA CÂMERA ======== */
  D({
    id: 'filmgate', name: 'Janela da câmera (8/16/35mm)', cat: 'pelicula', color: '#c98b3a',
    desc: 'o formato do quadro com canto arredondado, perfurações e sangria',
    alpha: true,
    params: [
      { k: 'fmt', t: 's', label: 'Bitola', def: 1, opts: ['8 mm', 'SUPER 8', '16 mm', '35 mm'] },
      { k: 'zoom', label: 'Sangria (encher a janela)', min: 0.6, max: 1.6, def: 1.06 },
      { k: 'soft', label: 'Maciez da borda', min: 0, max: 0.12, def: 0.012 },
      { k: 'round', label: 'Canto arredondado', min: 0, max: 2, def: 1 },
      { k: 'holes', t: 'b', label: 'Perfurações na lateral', def: 0 },
      { k: 'holeSide', t: 's', label: 'Lado das perfurações', def: 0, opts: ['Esquerda', 'Direita', 'Os dois'] },
      { k: 'weave', label: 'Tremor da janela', min: 0, max: 1, def: 0.22 },
      { k: 'weaveSpd', label: 'Velocidade do tremor', min: 0.2, max: 8, def: 2.4 },
      { k: 'vig', label: 'Queda de luz nos cantos', min: 0, max: 1.5, def: 0.45 },
      { k: 'edge', t: 'c', label: 'Cor fora da janela', def: '#0b0a08' },
      { k: 'edgeA', label: 'Opacidade fora da janela', min: 0, max: 1, def: 1 }
    ],
    glsl: GATE + '\n' + [
      'vec4 fx4(vec2 uv){',
      '  vec4 spec = gateSpec(u_fmt);',
      '  vec2 half_ = vec2(spec.x, spec.y)*0.5;',
      '  float r = spec.z*u_round*min(half_.x, half_.y)*2.0;',
      /* tremor da janela: deriva lenta em 2 eixos + micro rotação */
      '  float t = uTime*u_weaveSpd;',
      '  vec2 wv = vec2(vnoise(vec2(t, 3.1)) - 0.5, vnoise(vec2(7.7, t)) - 0.5)*0.018*u_weave;',
      '  float wr = (vnoise(vec2(t*0.7, 11.0)) - 0.5)*0.010*u_weave;',
      '  vec2 p = uv - 0.5 - wv;',
      '  p = rot2(p, wr);',
      '  p.x *= uAspect;',
      /* a imagem é ampliada para não sobrar quadro branco na sangria */
      '  vec2 suv = (uv - 0.5 - wv)/max(u_zoom, 0.05) + 0.5;',
      '  vec4 col = src4(suv);',
      '  vec2 b = vec2(half_.x*uAspect, half_.y);',
      '  float d = roundBox(p, b, min(r, min(b.x, b.y)*0.98));',
      '  float m = 1.0 - smoothstep(0.0, max(u_soft, 0.0008), d);',
      /* perfurações: quadrados de canto redondo, ritmados na vertical */
      '  float hole = 0.0;',
      '  if(u_holes > 0.5){',
      '    float pitch = 0.145;',
      '    float yy = mod(uv.y - uTime*0.0 + 0.5, pitch) - pitch*0.5;',
      '    float hx = b.x + 0.055;',
      '    float dl = roundBox(vec2(p.x + hx, yy), vec2(0.026, 0.030), 0.010);',
      '    float dr = roundBox(vec2(p.x - hx, yy), vec2(0.026, 0.030), 0.010);',
      '    float useL = (u_holeSide < 0.5 || u_holeSide > 1.5) ? 1.0 : 0.0;',
      '    float useR = (u_holeSide > 0.5) ? 1.0 : 0.0;',
      '    hole = max(useL*(1.0 - smoothstep(0.0, 0.006, dl)), useR*(1.0 - smoothstep(0.0, 0.006, dr)));',
      '  }',
      /* queda de luz do canto — a lente barata da bitola pequena */
      '  float vd = length(p/max(b, vec2(0.001)));',
      '  float vig = 1.0 - smoothstep(0.45, 1.35, vd)*u_vig;',
      '  vec3 rgb = col.rgb*vig;',
      '  vec3 outside = u_edge;',
      '  float a = col.a*m;',
      '  rgb = mix(outside, rgb, m);',
      '  a = mix(u_edgeA, col.a, m);',
      /* a perfuração é sempre luz passando: branca e opaca */
      '  rgb = mix(rgb, vec3(0.94, 0.92, 0.86), hole);',
      '  a = max(a, hole);',
      '  return vec4(rgb, a);',
      '}'
    ].join('\n')
  });

  /* ============================================ VAZAMENTO DE LUZ ========== */
  D({
    id: 'lightleak', name: 'Vazamento de luz (overlay)', cat: 'pelicula', color: '#e2670f',
    desc: 'a luz entra pela lateral do chassi: vermelho, laranja, amarelo e branco',
    params: [
      { k: 'amt', label: 'Intensidade', min: 0, max: 2, def: 0.85 },
      { k: 'side', t: 's', label: 'Entrada', def: 0, opts: ['Esquerda', 'Direita', 'Topo', 'Base', 'Canto', 'Vaga'] },
      { k: 'width', label: 'Largura do vazamento', min: 0.05, max: 1.2, def: 0.45 },
      { k: 'spd', label: 'Velocidade', min: 0, max: 4, def: 0.55 },
      { k: 'flick', label: 'Pulsação', min: 0, max: 1, def: 0.35 },
      { k: 'c1', t: 'c', label: 'Cor quente', def: '#ff3a12' },
      { k: 'c2', t: 'c', label: 'Cor média', def: '#ffa521' },
      { k: 'c3', t: 'c', label: 'Cor clara', def: '#ffe9a8' },
      { k: 'bloom', label: 'Espalhar na luz', min: 0, max: 1, def: 0.5 },
      { k: 'grain', label: 'Textura do vazamento', min: 0, max: 1, def: 0.3 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float t = uTime*u_spd;',
      '  vec2 p = uv - 0.5; p.x *= uAspect;',
      '  float axis;',
      '  int sd = int(u_side + 0.5);',
      '  if(sd == 0)      axis = (uv.x);',
      '  else if(sd == 1) axis = (1.0 - uv.x);',
      '  else if(sd == 2) axis = (1.0 - uv.y);',
      '  else if(sd == 3) axis = (uv.y);',
      '  else if(sd == 4) axis = (uv.x + uv.y)*0.5;',
      '  else             axis = length(p)*0.9;',
      /* a borda do vazamento respira, nunca é uma reta */
      '  float wob = fbm(vec2(uv.y*2.6 + t*0.7, uv.x*1.4 - t*0.4))*0.30;',
      '  float w = max(u_width, 0.02);',
      '  float k = 1.0 - smoothstep(0.0, w, axis + wob*w);',
      '  k = pow(max(k, 1e-6), 1.5);',
      /* pulsação: a luz não é constante, ela treme */
      '  float fl = 1.0 + (vnoise(vec2(t*7.0, 2.0)) - 0.5)*2.0*u_flick;',
      '  k *= max(0.0, fl);',
      /* rampa de cor: quente na borda, clara no centro do vazamento */
      '  vec3 leak = mix(u_c1, u_c2, smoothstep(0.0, 0.55, k));',
      '  leak = mix(leak, u_c3, smoothstep(0.55, 1.0, k));',
      '  if(u_grain > 0.001) leak *= 1.0 + (hash21(uv*uRes*0.4 + floor(uTime*20.0)) - 0.5)*u_grain;',
      /* espalha só onde a imagem já tem luz — é o que a emulsão faz */
      '  float lm = luma(c);',
      '  float spread = mix(1.0, 0.55 + lm*0.9, u_bloom);',
      '  c = 1.0 - (1.0 - c)*(1.0 - leak*k*u_amt*spread);',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* =============================================== FLASH DE ROLO ========== */
  D({
    id: 'filmflash', name: 'Flash de rolo', cat: 'pelicula', color: '#f5d000',
    desc: 'o estouro branco/laranja de começo e fim de rolo, em pulsos',
    params: [
      { k: 'amt', label: 'Intensidade', min: 0, max: 2, def: 0.9 },
      { k: 'rate', label: 'Frequência (por segundo)', min: 0.05, max: 6, def: 0.6 },
      { k: 'len', label: 'Duração do pulso', min: 0.01, max: 1, def: 0.16 },
      { k: 'warm', label: 'Calor do estouro', min: 0, max: 1, def: 0.65 },
      { k: 'seed', label: 'Semente', min: 0, max: 99, step: 1, def: 5 },
      { k: 'burn', label: 'Queimar as bordas', min: 0, max: 1, def: 0.45 },
      { k: 'regular', t: 'b', label: 'Pulsos regulares', def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float slot = floor(uTime*u_rate);',
      '  float f = fract(uTime*u_rate);',
      '  float gate = u_regular > 0.5 ? 1.0 : step(0.55, hash11(slot + u_seed*13.7));',
      '  float env = gate*(1.0 - smoothstep(0.0, max(u_len, 0.005), f));',
      '  env *= env;',
      '  if(env < 0.001) return c;',
      /* a queima entra pela borda e avança para o centro */
      '  vec2 p = uv - 0.5; p.x *= uAspect;',
      '  float edge = smoothstep(0.15, 0.72, length(p));',
      '  float k = env*mix(1.0, edge, u_burn);',
      '  vec3 hot = mix(vec3(1.0), vec3(1.0, 0.72, 0.34), u_warm);',
      '  c = 1.0 - (1.0 - c)*(1.0 - hot*k*u_amt);',
      '  c += hot*k*u_amt*0.25;',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* ================================================= GRÃO POR BITOLA ====== */
  D({
    id: 'filmgrain', name: 'Grão por bitola', cat: 'pelicula', color: '#a5a292',
    desc: 'quanto menor a bitola, maior o grão — 8mm é grosso, 35mm é fino',
    params: [
      { k: 'fmt', t: 's', label: 'Bitola', def: 1, opts: ['8 mm', 'SUPER 8', '16 mm', '35 mm'] },
      { k: 'amt', label: 'Intensidade', min: 0, max: 1, def: 0.28 },
      { k: 'shadow', label: 'Mais grão nas sombras', min: 0, max: 1, def: 0.7 },
      { k: 'color', label: 'Grão colorido', min: 0, max: 1, def: 0.25 },
      { k: 'fps', label: 'Cadência do grão', min: 6, max: 60, step: 1, def: 18 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float sizes[4];',
      '  sizes[0] = 0.30; sizes[1] = 0.42; sizes[2] = 0.62; sizes[3] = 1.00;',
      '  float sc = sizes[int(clamp(u_fmt, 0.0, 3.0))];',
      '  vec2 gp = floor(uv*uRes*sc) + floor(uTime*u_fps);',
      '  float g = hash21(gp) - 0.5;',
      '  float gr = hash21(gp + 17.3) - 0.5;',
      '  float gb = hash21(gp + 91.7) - 0.5;',
      '  float lm = luma(c);',
      '  float w = mix(1.0, 1.0 - smoothstep(0.0, 0.75, lm) + 0.25, u_shadow);',
      '  vec3 n = mix(vec3(g), vec3(g, gr, gb), u_color);',
      '  return c + n*u_amt*w;',
      '}'
    ].join('\n')
  });

  /* ============================================= SUJEIRA E RISCOS ========= */
  D({
    id: 'dustscratch', name: 'Poeira e riscos', cat: 'pelicula', color: '#7b7869',
    desc: 'cabelo na janela, poeira no negativo e risco vertical do projetor',
    params: [
      { k: 'dust', label: 'Poeira', min: 0, max: 1, def: 0.35 },
      { k: 'dustSize', label: 'Tamanho da poeira', min: 0.2, max: 4, def: 1 },
      { k: 'scratch', label: 'Riscos verticais', min: 0, max: 1, def: 0.3 },
      { k: 'scLen', label: 'Comprimento do risco', min: 0, max: 1, def: 0.6 },
      { k: 'hair', label: 'Cabelo na janela', min: 0, max: 1, def: 0.15 },
      { k: 'fps', label: 'Cadência', min: 4, max: 30, step: 1, def: 14 },
      { k: 'dark', label: 'Sujeira escura', min: 0, max: 1, def: 0.5 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float fr = floor(uTime*u_fps);',
      /* poeira: pontos que trocam a cada quadro */
      '  if(u_dust > 0.001){',
      '    vec2 dp = uv*uRes/(9.0*max(u_dustSize, 0.05));',
      '    vec2 cell = floor(dp);',
      '    vec2 f = fract(dp) - 0.5;',
      '    vec2 off = hash22(cell + fr*3.7) - 0.5;',
      '    float pick = hash21(cell*1.7 + fr);',
      '    float on = step(1.0 - u_dust*0.12, pick);',
      '    float d = length(f - off*0.7);',
      '    float sp = on*(1.0 - smoothstep(0.06, 0.24, d));',
      '    c = mix(c, mix(vec3(1.0), vec3(0.03), step(0.5, hash21(cell + 5.1))*u_dark), sp);',
      '  }',
      /* riscos verticais: poucos, finos, tremendo de lado */
      '  if(u_scratch > 0.001){',
      '    for(int i=0;i<4;i++){',
      '      float fi = float(i);',
      '      float seed = fr*0.31 + fi*23.7;',
      '      float on = step(1.0 - u_scratch*0.55, hash11(floor(seed)));',
      '      if(on < 0.5) continue;',
      '      float sx = hash11(floor(seed) + 4.1);',
      '      sx += (vnoise(vec2(uv.y*6.0, seed)) - 0.5)*0.01;',
      '      float y0 = hash11(floor(seed) + 9.3)*(1.0 - u_scLen);',
      '      float inY = step(y0, uv.y)*step(uv.y, y0 + u_scLen);',
      '      float w = 0.0009 + hash11(floor(seed) + 2.2)*0.0016;',
      '      float k = (1.0 - smoothstep(0.0, w, abs(uv.x - sx)))*inY;',
      '      c = mix(c, mix(vec3(1.0), vec3(0.05), step(0.65, hash11(floor(seed) + 7.7))), k*0.85);',
      '    }',
      '  }',
      /* cabelo: uma curva fina presa na base do quadro */
      '  if(u_hair > 0.001){',
      '    float hs = floor(uTime*0.7);',
      '    float on = step(1.0 - u_hair, hash11(hs*3.3));',
      '    float bx = hash11(hs*1.9)*0.8 + 0.1;',
      '    float curve = bx + sin(uv.y*7.0 + hs)*0.05 + vnoise(vec2(uv.y*9.0, hs))*0.03;',
      '    float k = (1.0 - smoothstep(0.0, 0.0016, abs(uv.x - curve)))*smoothstep(0.0, 0.35, 1.0 - uv.y)*on;',
      '    c = mix(c, vec3(0.02), k*0.9);',
      '  }',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* ================================================== HALAÇÃO ============= */
  D({
    id: 'halation', name: 'Halação', cat: 'pelicula', color: '#ff8a2b',
    desc: 'o vermelho que sangra em volta das altas luzes na película',
    params: [
      { k: 'amt', label: 'Intensidade', min: 0, max: 3, def: 0.9 },
      { k: 'thr', label: 'Limiar da luz', min: 0, max: 1, def: 0.62 },
      { k: 'rad', label: 'Raio', min: 0.002, max: 0.09, def: 0.028 },
      { k: 'tint', t: 'c', label: 'Cor da halação', def: '#ff5a1e' },
      { k: 'soft', label: 'Maciez', min: 0, max: 1, def: 0.6 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec3 h = vec3(0.0);',
      '  float wsum = 0.0;',
      '  for(int i=0;i<16;i++){',
      '    float a = float(i)*0.3927;',
      '    float rr = mix(0.45, 1.0, fract(float(i)*0.618));',
      '    vec2 o = vec2(cos(a), sin(a))*u_rad*rr*vec2(1.0/uAspect, 1.0);',
      '    vec3 s = srccol(uv + o);',
      '    float w = mix(1.0, 1.0 - rr, u_soft);',
      '    h += max(s - u_thr, 0.0)*w;',
      '    wsum += w;',
      '  }',
      '  h /= max(wsum, 0.001);',
      '  return c + h*u_tint*u_amt*2.4;',
      '}'
    ].join('\n')
  });

  /* ================================================ TREMOR DA JANELA ====== */
  D({
    id: 'gateweave', name: 'Tremor de janela', cat: 'pelicula', color: '#c98b3a',
    desc: 'a deriva lenta do quadro que só a película tem — não é tremida de mão',
    params: [
      { k: 'amt', label: 'Deriva', min: 0, max: 1, def: 0.3 },
      { k: 'spd', label: 'Velocidade', min: 0.1, max: 8, def: 1.6 },
      { k: 'rot', label: 'Giro', min: 0, max: 1, def: 0.25 },
      { k: 'jump', label: 'Pulo de emenda', min: 0, max: 1, def: 0.12 },
      { k: 'jumpRate', label: 'Emendas por segundo', min: 0.05, max: 4, def: 0.35 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float t = uTime*u_spd;',
      '  vec2 d = vec2(vnoise(vec2(t, 1.7)) - 0.5, vnoise(vec2(5.3, t)) - 0.5)*0.016*u_amt;',
      '  float r = (vnoise(vec2(t*0.6, 9.1)) - 0.5)*0.012*u_rot;',
      /* de vez em quando o filme pula: uma emenda passando pela janela */
      '  float slot = floor(uTime*u_jumpRate);',
      '  float f = fract(uTime*u_jumpRate);',
      '  float hit = step(0.62, hash11(slot*7.13))*(1.0 - smoothstep(0.0, 0.09, f));',
      '  d.y += hit*0.09*u_jump;',
      '  vec2 p = uv - 0.5 - d;',
      '  p.x *= uAspect;',
      '  p = rot2(p, r);',
      '  p.x /= uAspect;',
      '  return srccol(p + 0.5);',
      '}'
    ].join('\n')
  });

  /* ============================================= MOTOR DE FILTRO ==========
     É o efeito que a GALERIA DE FILTROS pilota. Um único shader com todos
     os controles de uma emulsão: curva, corte de preto, tonalização
     dividida, temperatura, matiz seletivo, granulado e vinheta.          */
  D({
    id: 'filmstock', name: 'Filtro de cor (galeria)', cat: 'cor', color: '#ffb020',
    desc: 'a base dos filtros da galeria: curva, tonalização, temperatura e fade',
    params: [
      { k: 'exp', label: 'Exposição', min: -1.5, max: 1.5, def: 0 },
      { k: 'con', label: 'Contraste', min: -1, max: 1.5, def: 0.12 },
      { k: 'sat', label: 'Saturação', min: -1, max: 1.5, def: 0 },
      { k: 'temp', label: 'Temperatura', min: -1, max: 1, def: 0 },
      { k: 'tintg', label: 'Verde ↔ Magenta', min: -1, max: 1, def: 0 },
      { k: 'fade', label: 'Fade (levantar o preto)', min: 0, max: 0.6, def: 0.06 },
      { k: 'crush', label: 'Fechar as sombras', min: 0, max: 0.6, def: 0 },
      { k: 'roll', label: 'Suavizar as altas luzes', min: 0, max: 1, def: 0.35 },
      { k: 'shTint', t: 'c', label: 'Tom das sombras', def: '#16283a' },
      { k: 'hiTint', t: 'c', label: 'Tom das luzes', def: '#ffe7c9' },
      { k: 'split', label: 'Força da tonalização', min: 0, max: 1.4, def: 0.32 },
      { k: 'skin', label: 'Proteger a pele', min: 0, max: 1, def: 0.4 },
      { k: 'grain', label: 'Grão', min: 0, max: 0.5, def: 0.045 },
      { k: 'vig', label: 'Vinheta', min: 0, max: 1.2, def: 0.22 },
      { k: 'sharp', label: 'Micro-nitidez', min: 0, max: 1, def: 0.15 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      /* micro-nitidez antes da cor: é o que dá a impressão de "grão nítido" */
      '  if(u_sharp > 0.001){',
      '    vec2 px = 1.0/uRes;',
      '    vec3 blur = (srccol(uv + vec2(px.x,0.0)) + srccol(uv - vec2(px.x,0.0)) +',
      '                 srccol(uv + vec2(0.0,px.y)) + srccol(uv - vec2(0.0,px.y)))*0.25;',
      '    c += (c - blur)*u_sharp*1.6;',
      '  }',
      '  c *= pow(2.0, u_exp);',
      /* temperatura e matiz, em canais separados como num filtro de lente */
      '  c.r *= 1.0 + u_temp*0.22;',
      '  c.b *= 1.0 - u_temp*0.22;',
      '  c.g *= 1.0 + u_tintg*0.16;',
      '  c.r *= 1.0 - u_tintg*0.06;',
      '  c.b *= 1.0 - u_tintg*0.06;',
      /* curva: contraste em torno de 0.5 com ombro nas altas luzes */
      '  c = (c - 0.5)*(1.0 + u_con) + 0.5;',
      '  c = mix(c, 1.0 - exp(-max(c, 0.0)*1.9), u_roll);',
      '  c = max(c - u_crush, 0.0)/max(1.0 - u_crush, 0.05);',
      '  c = u_fade + c*(1.0 - u_fade);',
      /* saturação, com a faixa da pele segurada */
      '  float lm = luma(c);',
      '  vec3 hsv = rgb2hsv(c);',
      '  float skinMask = exp(-pow((hsv.x - 0.055)/0.075, 2.0))*hsv.y;',
      /* a proteção de pele só vale quando a saturação SOBE. Ao dessaturar
         ela não pode resistir, senão um P&B deixa a pele (e todo matiz
         alaranjado da cena) colorida e o resultado sai marrom.            */
      '  float prot = u_sat > 0.0 ? skinMask*u_skin : 0.0;',
      '  float satAmt = 1.0 + u_sat*(1.0 - prot);',
      '  c = mix(vec3(lm), c, satAmt);',
      /* A TONALIZAÇÃO VEM DEPOIS DA SATURAÇÃO, e não antes: tinge-se o que
         já está monocromático. Na ordem inversa um sépia (sat -0.92) tinha o
         próprio tom apagado pela dessaturação que vinha logo atrás.       */
      '  float l = luma(c);',
      '  vec3 sh = u_shTint/max(luma(u_shTint), 0.002);',
      '  vec3 hi = u_hiTint/max(luma(u_hiTint), 0.002);',
      '  float wS = 1.0 - smoothstep(0.0, 0.62, l);',
      '  float wH = smoothstep(0.38, 1.0, l);',
      '  c *= mix(vec3(1.0), sh, clamp(wS*u_split, 0.0, 1.0));',
      '  c *= mix(vec3(1.0), hi, clamp(wH*u_split, 0.0, 1.0));',
      '  if(u_vig > 0.001){',
      '    vec2 p = uv - 0.5; p.x *= uAspect;',
      '    c *= 1.0 - smoothstep(0.35, 0.95, length(p))*u_vig;',
      '  }',
      '  if(u_grain > 0.001){',
      '    float g = hash21(uv*uRes*0.55 + floor(uTime*20.0)) - 0.5;',
      '    c += g*u_grain*(1.2 - smoothstep(0.0, 0.85, luma(c))*0.6);',
      '  }',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* a categoria nova aparece nos chips do catálogo */
  if (VE.CATS && !VE.CATS.some(function (c) { return c.id === 'pelicula'; })) {
    VE.CATS.push({ id: 'pelicula', label: 'película', color: '#c98b3a' });
  }

})(window.VE);

/* ============================================================
   rgb_lab — PACOTES DE PELÍCULA
   Um clique monta a cadeia inteira de uma bitola: cor, grão,
   janela, sujeira e vazamento, já calibrados entre si.
   ============================================================ */
(function (VE) {
  'use strict';
  VE.STYLES.push(
    {
      id: 'p8mm', name: '8 mm caseiro', desc: 'grão grosso, janela pequena, luz vazando',
      fx: [
        ['filmstock', { exp: 0.08, con: 0.26, sat: 0.18, temp: 0.34, fade: 0.14, roll: 0.55, split: 0.55, shTint: '#31200f', hiTint: '#ffe0a8', vig: 0.42, grain: 0, sharp: 0.1 }],
        ['halation', { amt: 0.75, thr: 0.6, rad: 0.034, tint: '#ff6a22' }],
        ['filmgrain', { fmt: 0, amt: 0.4, shadow: 0.75, color: 0.35, fps: 16 }],
        ['dustscratch', { dust: 0.5, dustSize: 1.4, scratch: 0.35, hair: 0.2, fps: 14 }],
        ['gateweave', { amt: 0.5, spd: 2.2, rot: 0.45, jump: 0.25, jumpRate: 0.5 }],
        ['lightleak', { amt: 0.7, side: 0, width: 0.4, spd: 0.5, flick: 0.4 }],
        ['filmflash', { amt: 0.8, rate: 0.45, len: 0.18, warm: 0.7, burn: 0.5 }],
        ['filmgate', { fmt: 0, zoom: 1.08, soft: 0.014, round: 1.15, vig: 0.5, weave: 0.35 }]
      ]
    },
    {
      id: 'psuper8', name: 'Super 8', desc: 'quadro maior, cor mais saturada, ainda quente',
      fx: [
        ['filmstock', { exp: 0.05, con: 0.22, sat: 0.26, temp: 0.24, fade: 0.11, roll: 0.6, split: 0.45, shTint: '#241a12', hiTint: '#ffe9c4', vig: 0.3, grain: 0, sharp: 0.16 }],
        ['halation', { amt: 0.6, thr: 0.63, rad: 0.028, tint: '#ff5a1e' }],
        ['filmgrain', { fmt: 1, amt: 0.3, shadow: 0.7, color: 0.28, fps: 18 }],
        ['dustscratch', { dust: 0.34, dustSize: 1.1, scratch: 0.24, hair: 0.12, fps: 14 }],
        ['gateweave', { amt: 0.34, spd: 1.8, rot: 0.3, jump: 0.14, jumpRate: 0.35 }],
        ['lightleak', { amt: 0.55, side: 1, width: 0.34, spd: 0.45, flick: 0.3 }],
        ['filmgate', { fmt: 1, zoom: 1.06, soft: 0.012, round: 1, vig: 0.42, weave: 0.24 }]
      ]
    },
    {
      id: 'p16mm', name: '16 mm documentário', desc: 'grão médio, cor contida, canto quase reto',
      fx: [
        ['filmstock', { exp: 0, con: 0.3, sat: -0.04, temp: 0.08, fade: 0.07, roll: 0.4, split: 0.32, shTint: '#1a2228', hiTint: '#fff0da', vig: 0.24, grain: 0, sharp: 0.28 }],
        ['halation', { amt: 0.42, thr: 0.68, rad: 0.02, tint: '#ff5f2a' }],
        ['filmgrain', { fmt: 2, amt: 0.22, shadow: 0.65, color: 0.18, fps: 24 }],
        ['dustscratch', { dust: 0.2, dustSize: 0.8, scratch: 0.3, scLen: 0.75, hair: 0.06, fps: 16 }],
        ['gateweave', { amt: 0.2, spd: 1.4, rot: 0.18, jump: 0.08, jumpRate: 0.25 }],
        ['filmgate', { fmt: 2, zoom: 1.04, soft: 0.008, round: 0.9, vig: 0.34, weave: 0.16 }]
      ]
    },
    {
      id: 'p35mm', name: '35 mm', desc: 'grão fino, janela quase quadrada, halação suave',
      fx: [
        ['filmstock', { exp: 0.02, con: 0.24, sat: 0.06, temp: 0.04, fade: 0.05, roll: 0.45, split: 0.28, shTint: '#141a22', hiTint: '#fff3e4', vig: 0.18, grain: 0, sharp: 0.24 }],
        ['halation', { amt: 0.34, thr: 0.72, rad: 0.016, tint: '#ff5a2e', soft: 0.7 }],
        ['filmgrain', { fmt: 3, amt: 0.14, shadow: 0.6, color: 0.12, fps: 24 }],
        ['gateweave', { amt: 0.1, spd: 1.1, rot: 0.1, jump: 0.04, jumpRate: 0.15 }],
        ['filmgate', { fmt: 3, zoom: 1.02, soft: 0.006, round: 0.8, vig: 0.24, weave: 0.08 }]
      ]
    },
    {
      id: 'pprojecao', name: 'Projeção velha', desc: 'a cópia gasta: risco, poeira, flash e emenda',
      fx: [
        ['filmstock', { exp: -0.06, con: 0.18, sat: -0.2, temp: 0.2, fade: 0.2, roll: 0.55, split: 0.5, shTint: '#2b2415', hiTint: '#ffeec8', vig: 0.5, grain: 0 }],
        ['filmgrain', { fmt: 1, amt: 0.34, shadow: 0.8, color: 0.2, fps: 16 }],
        ['dustscratch', { dust: 0.75, dustSize: 1.6, scratch: 0.62, scLen: 0.9, hair: 0.35, fps: 12, dark: 0.65 }],
        ['gateweave', { amt: 0.62, spd: 2.6, rot: 0.5, jump: 0.5, jumpRate: 0.8 }],
        ['filmflash', { amt: 1.1, rate: 0.9, len: 0.12, warm: 0.55, burn: 0.6 }],
        ['filmgate', { fmt: 1, zoom: 1.1, soft: 0.02, round: 1.2, vig: 0.62, weave: 0.5 }]
      ]
    },
    {
      id: 'pchassi', name: 'Chassi aberto', desc: 'só os vazamentos de luz, sem tocar na imagem',
      fx: [
        ['lightleak', { amt: 1.0, side: 5, width: 0.6, spd: 0.7, flick: 0.5, bloom: 0.6 }],
        ['filmflash', { amt: 1.0, rate: 1.1, len: 0.14, warm: 0.75, burn: 0.35 }],
        ['halation', { amt: 0.6, thr: 0.6, rad: 0.03 }]
      ]
    }
  );
})(window.VE);
