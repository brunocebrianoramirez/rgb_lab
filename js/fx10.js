/* ============================================================
   rgb_lab — FAMÍLIA 06 · PINTURA / MATERIALIDADE
              FAMÍLIA 08 · INSTRUMENTOS DE VIDEOARTE
   ------------------------------------------------------------
   PINTURA não é "filtro de pintura a óleo". Cada um destes imita
   um COMPORTAMENTO de matéria: o pigmento que sangra na fibra do
   papel, o carvão que agarra na textura, a tinta que se acumula
   na borda da mancha, o guache que fecha a área em cor sólida.

   INSTRUMENTOS são a parte mais importante do laboratório: não são
   filtros, são máquinas. Recebem a imagem e devolvem um sistema.

     MOTOR DE REALIMENTAÇÃO   o quadro volta para dentro de si mesmo
     EROSÃO DE MATÉRIA        a imagem se deteriora organicamente
     CAMPO DE MOVIMENTO       o movimento vira um campo visível e usável
     PINTURA POR FLUXO        a tinta acompanha o movimento da imagem
     IMAGEM TEXTUAL           a imagem vira texto, com densidade e cor
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  var PIN = '#e2670f';
  var INS = '#16150f';

  /* ================================================================== */
  /* ====================== PINTURA / MATERIALIDADE =================== */
  /* ================================================================== */

  D({
    id: 'aquarela', name: 'Aquarela', cat: 'pintura', color: PIN,
    desc: 'pigmento que sangra na fibra, acumula na borda da mancha e deixa o papel aparecer',
    params: [
      { k: 'bleed', label: 'Sangramento', min: 0, max: 1, def: 0.5 },
      { k: 'grain', label: 'Fibra do papel', min: 0, max: 1, def: 0.4 },
      { k: 'gscale', label: 'Escala da fibra', min: 20, max: 400, def: 140 },
      { k: 'edge', label: 'Acúmulo na borda', min: 0, max: 1.5, def: 0.6 },
      { k: 'levels', label: 'Camadas de lavagem', min: 2, max: 16, step: 1, def: 6 },
      { k: 'wet', label: 'Molhado (difusão)', min: 0.5, max: 8, def: 3 },
      { k: 'sat', label: 'Saturação do pigmento', min: 0, max: 2, def: 1.15 },
      { k: 'paper', t: 'c', label: 'Papel', def: '#f4f1e6' },
      { k: 'white', label: 'Deixar o papel respirar', min: 0, max: 1, def: 0.35 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      /* 1. difusão: a cor caminha na fibra */
      '  vec2 t = texel()*max(u_wet, 0.5);',
      '  vec3 sum = vec3(0.0); float wsum = 0.0;',
      '  for(int i=0;i<12;i++){',
      '    float a = float(i)*(PI/6.0);',
      '    float r = 0.5 + hash11(float(i)*3.7)*1.6;',
      '    vec2 d = vec2(cos(a)/max(uAspect, 0.001), sin(a))*t*r;',
      '    float n = (fbm(uv*max(u_gscale, 20.0)*0.05 + float(i)) - 0.5)*u_bleed*0.02;',
      '    vec3 c = srccol(uv + d + n);',
      '    float w = 1.0/r;',
      '    sum += c*w; wsum += w;',
      '  }',
      '  vec3 wash = sum/max(wsum, 1e-3);',
      /* 2. lavagem: a aquarela é feita de poucas camadas, não de contínuo */
      '  float lv = max(2.0, floor(u_levels + 0.5));',
      '  vec3 hv = rgb2hsv(wash);',
      '  hv.z = floor(hv.z*lv + 0.5)/lv;',
      '  hv.y = clamp(hv.y*u_sat, 0.0, 1.0);',
      '  vec3 col = hsv2rgb(hv);',
      /* 3. acúmulo: o pigmento se junta onde a mancha termina */
      '  float g = length(gradient(uv, max(u_wet, 1.0)));',
      '  col *= 1.0 - clamp(g*1.2, 0.0, 1.0)*u_edge*0.55;',
      /* 4. fibra do papel */
      '  float fib = fbm(uv*vec2(max(uAspect, 0.001), 1.0)*max(u_gscale, 20.0));',
      '  col = mix(col, u_paper, clamp((fib - 0.45)*1.6, 0.0, 1.0)*u_grain*0.5);',
      /* 5. o branco do papel é cor: onde a imagem é clara, ele volta */
      '  col = mix(col, u_paper, smoothstep(0.72, 0.98, luma(wash))*u_white);',
      '  return col;',
      '}'
    ].join('\n')
  });

  D({
    id: 'tintaneg', name: 'Nanquim', cat: 'pintura', color: PIN,
    desc: 'contorno detectado e espalhado: a tinta agarra no traço e escorre no papel',
    params: [
      { k: 'thr', label: 'Limiar do traço', min: 0, max: 1, def: 0.16 },
      { k: 'weight', label: 'Peso do traço', min: 0.2, max: 8, def: 1.6 },
      { k: 'spread', label: 'Escorrer', min: 0, max: 1, def: 0.4 },
      { k: 'wash', label: 'Aguada de fundo', min: 0, max: 1, def: 0.3 },
      { k: 'levels', label: 'Tons da aguada', min: 2, max: 8, step: 1, def: 3 },
      { k: 'dry', label: 'Pincel seco', min: 0, max: 1, def: 0.3 },
      { k: 'ink', t: 'c', label: 'Tinta', def: '#101014' },
      { k: 'paper', t: 'c', label: 'Papel', def: '#efe9d8' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float g = 0.0;',
      /* o traço nasce da borda em três escalas: fino, médio e grosso */
      '  for(int i=0;i<3;i++){',
      '    float r = u_weight*(0.6 + float(i)*1.3);',
      '    g = max(g, length(gradient(uv, r))/(1.0 + float(i)*0.5));',
      '  }',
      '  float line = smoothstep(u_thr, u_thr + 0.12, g);',
      /* escorrer: o traço puxa tinta para baixo */
      '  if(u_spread > 0.001){',
      '    float run = 0.0;',
      '    for(int i=1;i<=6;i++){',
      '      vec2 d = vec2(0.0, float(i)*texel().y*3.0);',
      '      run = max(run, smoothstep(u_thr, u_thr + 0.12, length(gradient(uv + d, u_weight)))*(1.0 - float(i)/7.0));',
      '    }',
      '    line = max(line, run*u_spread);',
      '  }',
      /* pincel seco: a fibra do papel come parte do traço */
      '  float dry = fbm(uv*vec2(max(uAspect,0.001), 1.0)*220.0);',
      '  line *= 1.0 - smoothstep(0.45, 0.75, dry)*u_dry;',
      '  float lv = max(2.0, floor(u_levels + 0.5));',
      '  float wash = 1.0 - floor(luma(box3(uv, 3.0))*lv + 0.5)/lv;',
      '  vec3 col = mix(u_paper, u_ink, clamp(wash*u_wash, 0.0, 1.0)*0.7);',
      '  return mix(col, u_ink, clamp(line, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  D({
    id: 'carvao', name: 'Carvão', cat: 'pintura', color: PIN,
    desc: 'o carvão agarra na textura do papel e some no vinco — luminância virando pó',
    params: [
      { k: 'press', label: 'Pressão', min: 0.2, max: 3, def: 1.2 },
      { k: 'tooth', label: 'Grão do papel', min: 20, max: 400, def: 160 },
      { k: 'ang', label: 'Direção do traço (°)', min: 0, max: 180, step: 1, def: 40 },
      { k: 'hatch', label: 'Hachura', min: 0, max: 1, def: 0.45 },
      { k: 'freq', label: 'Frequência da hachura', min: 20, max: 500, def: 180 },
      { k: 'smudge', label: 'Esfumado', min: 0, max: 4, def: 1.4 },
      { k: 'edge', label: 'Reforçar contorno', min: 0, max: 2, def: 0.7 },
      { k: 'paper', t: 'c', label: 'Papel', def: '#e8e3d4' },
      { k: 'ink', t: 'c', label: 'Carvão', def: '#1a1a1c' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float l = luma(box3(uv, max(u_smudge, 0.5)));',
      '  float dens = pow(max(1.0 - clamp(l, 0.0, 1.0), 1e-6), max(u_press, 0.2));',
      '  float tooth = fbm(uv*vec2(max(uAspect, 0.001), 1.0)*max(u_tooth, 20.0));',
      '  dens *= 0.55 + 0.9*tooth;',
      '  if(u_hatch > 0.001){',
      '    float a = u_ang*PI/180.0;',
      '    vec2 p = rot2(uv*vec2(max(uAspect, 0.001), 1.0), a)*max(u_freq, 20.0);',
      '    float h = 0.5 + 0.5*sin(p.y*PI*2.0);',
      '    dens = mix(dens, dens*smoothstep(1.0 - dens - 0.25, 1.0 - dens + 0.25, h)*1.6, u_hatch);',
      '  }',
      '  float g = length(gradient(uv, 1.4));',
      '  dens += clamp(g, 0.0, 1.0)*u_edge*0.55;',
      '  return mix(u_paper, u_ink, clamp(dens, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  D({
    id: 'lapis', name: 'Lápis', cat: 'pintura', color: PIN,
    desc: 'contorno leve mais hachura cruzada em camadas — o desenho de estudo',
    params: [
      { k: 'lines', label: 'Camadas de hachura', min: 1, max: 4, step: 1, def: 3 },
      { k: 'freq', label: 'Frequência', min: 30, max: 700, def: 260 },
      { k: 'ang', label: 'Ângulo base (°)', min: 0, max: 180, step: 1, def: 35 },
      { k: 'spread', label: 'Abertura entre camadas (°)', min: 5, max: 90, step: 1, def: 40 },
      { k: 'press', label: 'Pressão', min: 0.2, max: 3, def: 1 },
      { k: 'jitter', label: 'Mão trêmula', min: 0, max: 1, def: 0.35 },
      { k: 'outline', label: 'Contorno', min: 0, max: 2, def: 0.8 },
      { k: 'paper', t: 'c', label: 'Papel', def: '#f2efe4' },
      { k: 'ink', t: 'c', label: 'Grafite', def: '#2a2a30' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float l = luma(box3(uv, 1.6));',
      '  float dens = pow(max(1.0 - clamp(l, 0.0, 1.0), 1e-6), max(u_press, 0.2));',
      '  float n = max(1.0, floor(u_lines + 0.5));',
      '  float ink = 0.0;',
      '  for(int i=0;i<4;i++){',
      '    if(float(i) >= n) break;',
      '    float lvl = (float(i) + 1.0)/(n + 1.0);',
      '    if(dens < lvl*0.85) continue;',
      '    float a = (u_ang + float(i)*u_spread)*PI/180.0;',
      '    vec2 p = rot2(uv*vec2(max(uAspect, 0.001), 1.0), a)*max(u_freq, 30.0);',
      '    p.y += (fbm(uv*90.0 + float(i)*7.0) - 0.5)*u_jitter*3.0;',
      '    float h = abs(fract(p.y) - 0.5)*2.0;',
      '    ink = max(ink, smoothstep(0.75, 0.2, h)*0.55);',
      '  }',
      '  float g = length(gradient(uv, 1.2));',
      '  ink = max(ink, clamp(g*u_outline, 0.0, 1.0));',
      '  return mix(u_paper, u_ink, clamp(ink, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  D({
    id: 'guache', name: 'Guache', cat: 'pintura', color: PIN,
    desc: 'áreas cromáticas sólidas, bordas duras e um leve relevo de tinta espessa',
    params: [
      { k: 'levels', label: 'Cores por canal', min: 2, max: 10, step: 1, def: 4 },
      { k: 'flat', label: 'Achatamento', min: 0, max: 6, def: 2.4 },
      { k: 'edge', label: 'Dureza da borda', min: 0, max: 2, def: 0.8 },
      { k: 'body', label: 'Corpo da tinta', min: 0, max: 1, def: 0.35 },
      { k: 'sat', label: 'Saturação', min: 0, max: 2, def: 1.2 },
      { k: 'warm', label: 'Esquentar as claras', min: 0, max: 1, def: 0.25 },
      { k: 'canvas', label: 'Trama da tela', min: 0, max: 1, def: 0.2 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      /* achata primeiro (média larga), depois quantiza: é o que dá a
         área chapada em vez de degradê posterizado                     */
      '  vec3 c = mix(srccol(uv), box3(uv, max(u_flat, 0.5)), 0.85);',
      '  vec3 hv = rgb2hsv(c);',
      '  hv.y = clamp(hv.y*u_sat, 0.0, 1.0);',
      '  c = hsv2rgb(hv);',
      '  float lv = max(2.0, floor(u_levels + 0.5));',
      '  c = floor(c*lv + 0.5)/lv;',
      '  float g = clamp(length(gradient(uv, 2.0))*u_edge, 0.0, 1.0);',
      '  c *= 1.0 - g*0.35;',
      /* corpo: a tinta espessa devolve um relevo sutil */
      '  if(u_body > 0.001){',
      '    vec2 gr = gradient(uv, 1.0);',
      '    c += (gr.x*0.6 + gr.y*0.4)*u_body*0.35;',
      '  }',
      '  c = mix(c, c*vec3(1.06, 1.0, 0.92), smoothstep(0.6, 1.0, luma(c))*u_warm);',
      '  float weave = (sin(uv.x*uRes.x*1.6) + sin(uv.y*uRes.y*1.6))*0.25 + 0.5;',
      '  return c*(1.0 - (1.0 - weave)*u_canvas*0.22);',
      '}'
    ].join('\n')
  });

  D({
    id: 'pastel', name: 'Pastel seco', cat: 'pintura', color: PIN,
    desc: 'cor comprimida, traço largo e o pó que fica solto por cima',
    params: [
      { k: 'levels', label: 'Compressão de cor', min: 2, max: 12, step: 1, def: 5 },
      { k: 'stroke', label: 'Largura do traço', min: 1, max: 40, def: 12 },
      { k: 'ang', label: 'Direção (°)', min: 0, max: 180, step: 1, def: 60 },
      { k: 'follow', label: 'Seguir a forma', min: 0, max: 1, def: 0.6 },
      { k: 'dust', label: 'Pó solto', min: 0, max: 1, def: 0.35 },
      { k: 'tooth', label: 'Grão do papel', min: 20, max: 400, def: 120 },
      { k: 'paper', t: 'c', label: 'Papel', def: '#e6e0cd' },
      { k: 'sat', label: 'Saturação', min: 0, max: 2, def: 1.1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      /* o traço acompanha a forma: perpendicular ao gradiente */
      '  vec2 g = gradient(uv, 2.0);',
      '  float a = mix(u_ang*PI/180.0, atan(g.y, g.x) + PI*0.5, u_follow);',
      '  vec2 dir = vec2(cos(a)/max(uAspect, 0.001), sin(a));',
      '  vec3 sum = vec3(0.0); float w = 0.0;',
      '  for(int i=-4;i<=4;i++){',
      '    float f = float(i)/4.0;',
      '    vec3 c = srccol(uv + dir*f*u_stroke*texel().y*3.0);',
      '    float k = 1.0 - abs(f)*0.7;',
      '    sum += c*k; w += k;',
      '  }',
      '  vec3 c = sum/max(w, 1e-3);',
      '  vec3 hv = rgb2hsv(c);',
      '  hv.y = clamp(hv.y*u_sat, 0.0, 1.0);',
      '  c = hsv2rgb(hv);',
      '  float lv = max(2.0, floor(u_levels + 0.5));',
      '  c = floor(c*lv + 0.5)/lv;',
      '  float tooth = fbm(uv*vec2(max(uAspect, 0.001), 1.0)*max(u_tooth, 20.0));',
      '  c = mix(c, u_paper, clamp((tooth - 0.5)*1.7, 0.0, 1.0)*0.45);',
      '  float dust = hash21(floor(uv*uRes/2.0));',
      '  c += (dust - 0.5)*u_dust*0.22;',
      '  return c;',
      '}'
    ].join('\n')
  });

  D({
    id: 'colagem', name: 'Colagem', cat: 'pintura', color: PIN,
    desc: 'o quadro rasgado em pedaços de papel, cada um deslocado, girado e com sombra',
    params: [
      { k: 'pieces', label: 'Pedaços', min: 2, max: 40, def: 9 },
      { k: 'tear', label: 'Irregularidade do rasgo', min: 0, max: 1, def: 0.55 },
      { k: 'shift', label: 'Deslocamento', min: 0, max: 0.2, def: 0.03 },
      { k: 'rot', label: 'Giro (°)', min: 0, max: 30, step: 0.5, def: 4 },
      { k: 'shadow', label: 'Sombra', min: 0, max: 1, def: 0.4 },
      { k: 'edge', label: 'Borda de papel', min: 0, max: 1, def: 0.5 },
      { k: 'tone', label: 'Variação de tom', min: 0, max: 1, def: 0.25 },
      { k: 'bg', t: 'c', label: 'Fundo', def: '#dfd9c8' },
      { k: 'seed', label: 'Semente', min: 0, max: 99, step: 1, def: 3 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv*vec2(max(uAspect, 0.001), 1.0)*max(u_pieces, 2.0)*0.5;',
      /* o rasgo: uma malha de Voronoi com a fronteira suja de ruído */
      '  p += (fbm(uv*22.0 + u_seed) - 0.5)*u_tear*1.4;',
      '  vec3 v = voronoi(p + u_seed*3.7);',
      '  float seed = v.y;',
      '  float ang = (seed - 0.5)*2.0*u_rot*PI/180.0;',
      '  vec2 off = (vec2(v.y, v.z) - 0.5)*2.0*u_shift;',
      '  vec2 q = 0.5 + rot2(uv - 0.5, ang) + off;',
      '  vec3 c = srccol(q);',
      '  c *= 1.0 + (v.z - 0.5)*u_tone*0.5;',
      /* borda: cada pedaço tem espessura e joga sombra no de baixo */
      '  float rim = smoothstep(0.60, 0.86, v.x);',
      '  c = mix(c, u_bg, rim*u_edge);',
      '  float sh = smoothstep(0.80, 1.0, v.x);',
      '  c *= 1.0 - sh*u_shadow*0.8;',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* ================================================================== */
  /* ==================== INSTRUMENTOS DE VIDEOARTE =================== */
  /* ================================================================== */

  /* ==================================================================
     MOTOR DE REALIMENTAÇÃO — ferramenta assinatura
     O quadro composto volta para dentro de si mesmo, transformado.
     É o instrumento clássico da videoarte generativa: câmera apontada
     para o próprio monitor, só que com a geometria na mão.
     ================================================================== */
  D({
    id: 'realimenta', name: 'Motor de realimentação', cat: 'instrumento', color: INS,
    desc: 'o quadro volta para dentro de si mesmo transformado — giro, escala, deriva e decaimento',
    params: [
      { k: 'feed', label: 'Realimentação', min: 0, max: 0.995, step: 0.005, def: 0.88 },
      { k: 'scale', label: 'Escala por volta', min: 0.8, max: 1.25, step: 0.001, def: 1.02 },
      { k: 'rot', label: 'Giro por volta (°)', min: -30, max: 30, step: 0.1, def: 1.5 },
      { k: 'dx', label: 'Deriva X', min: -0.05, max: 0.05, step: 0.0002, def: 0 },
      { k: 'dy', label: 'Deriva Y', min: -0.05, max: 0.05, step: 0.0002, def: 0 },
      { k: 'cx', label: 'Centro X', min: 0, max: 1, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: 0, max: 1, def: 0.5 },
      { k: 'decay', label: 'Decaimento', min: 0, max: 1, def: 0.06 },
      { k: 'hue', label: 'Girar matiz por volta', min: -0.2, max: 0.2, step: 0.001, def: 0.01 },
      { k: 'sat', label: 'Saturar por volta', min: -0.3, max: 0.3, step: 0.005, def: 0.03 },
      { k: 'blend', label: 'Como volta', t: 's', opts: ['Somar (luz)', 'Máximo', 'Sobrepor', 'Diferença', 'Média'], def: 0 },
      { k: 'warp', label: 'Ondular no caminho', min: 0, max: 0.06, step: 0.0005, def: 0 },
      { k: 'mirror', label: 'Espelhar a volta', t: 'b', def: 0 },
      { k: 'gate', label: 'Só o que é claro', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 cur = srccol(uv);',
      '  vec2 c = vec2(u_cx, u_cy);',
      '  vec2 p = uv - c; p.x *= uAspect;',
      '  p = rot2(p, u_rot*PI/180.0)/max(u_scale, 0.8);',
      '  p.x /= max(uAspect, 0.001);',
      '  p += c + vec2(u_dx, u_dy);',
      '  if(u_warp > 0.0001){',
      '    p += vec2(sin(uv.y*17.0 + uTime*0.9), cos(uv.x*15.0 - uTime*0.7))*u_warp;',
      '  }',
      '  if(u_mirror > 0.5) p.x = 1.0 - p.x;',
      '  vec3 mem = histcol(1, p);',
      '  if(abs(u_hue) > 0.0005 || abs(u_sat) > 0.002){',
      '    vec3 hv = rgb2hsv(mem);',
      '    hv.x = fract(hv.x + u_hue);',
      '    hv.y = clamp(hv.y*(1.0 + u_sat), 0.0, 1.0);',
      '    mem = hsv2rgb(hv);',
      '  }',
      '  mem *= (1.0 - u_decay)*clamp(u_feed, 0.0, 0.995);',
      '  if(u_gate > 0.001) mem *= mix(1.0, smoothstep(0.25, 0.7, luma(mem)), u_gate);',
      '  float m = floor(u_blend + 0.5);',
      '  if(m < 0.5)      return 1.0 - (1.0 - cur)*(1.0 - mem);',
      '  else if(m < 1.5) return max(cur, mem);',
      '  else if(m < 2.5) return mix(2.0*cur*mem, 1.0 - 2.0*(1.0 - cur)*(1.0 - mem), step(0.5, cur));',
      '  else if(m < 3.5) return abs(cur - mem);',
      '  return mix(cur, mem, clamp(u_feed, 0.0, 0.995)*0.5);',
      '}'
    ].join('\n')
  });

  D({
    id: 'realimentacaleido', name: 'Caleidoscópio realimentado', cat: 'instrumento', color: INS,
    desc: 'caleidoscópio somado a realimentação: a imagem se reproduz para dentro, sem fim',
    params: [
      { k: 'seg', label: 'Segmentos', min: 2, max: 24, step: 1, def: 8 },
      { k: 'feed', label: 'Realimentação', min: 0, max: 0.99, step: 0.005, def: 0.85 },
      { k: 'zoom', label: 'Escala por volta', min: 0.85, max: 1.2, step: 0.001, def: 1.04 },
      { k: 'spin', label: 'Giro por volta (°)', min: -20, max: 20, step: 0.1, def: 2.2 },
      { k: 'drift', label: 'Girar o espelho', min: -2, max: 2, def: 0.15 },
      { k: 'cx', label: 'Centro X', min: 0, max: 1, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: 0, max: 1, def: 0.5 },
      { k: 'hue', label: 'Girar matiz por volta', min: -0.1, max: 0.1, step: 0.001, def: 0.012 },
      { k: 'decay', label: 'Decaimento', min: 0, max: 1, def: 0.08 },
      { k: 'live', label: 'Peso do vivo', min: 0, max: 1, def: 0.4 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 c = vec2(u_cx, u_cy);',
      '  vec2 p = uv - c; p.x *= uAspect;',
      '  float n = max(2.0, floor(u_seg + 0.5));',
      '  float seg = 2.0*PI/n;',
      '  float a = atan(p.y, p.x) + uTime*u_drift;',
      '  float r = length(p);',
      '  float k = abs(mod(a, seg) - seg*0.5);',
      '  vec2 q = vec2(cos(k), sin(k))*r;',
      '  q.x /= max(uAspect, 0.001);',
      '  vec3 live = srccol(q + c);',
      '  vec2 f = uv - c; f.x *= uAspect;',
      '  f = rot2(f, u_spin*PI/180.0)/max(u_zoom, 0.85);',
      '  f.x /= max(uAspect, 0.001);',
      '  vec3 mem = histcol(1, f + c);',
      '  if(abs(u_hue) > 0.0005){ vec3 hv = rgb2hsv(mem); hv.x = fract(hv.x + u_hue); mem = hsv2rgb(hv); }',
      '  mem *= (1.0 - u_decay)*clamp(u_feed, 0.0, 0.99);',
      '  return 1.0 - (1.0 - live*u_live)*(1.0 - mem);',
      '}'
    ].join('\n')
  });

  /* ==================================================================
     EROSÃO DE MATÉRIA — ferramenta assinatura
     A imagem se deteriora organicamente: um limiar decide o que já
     está perdido, o ruído come a borda do que sobrou, e o que caiu
     escorre para fora do quadro.
     ================================================================== */
  D({
    id: 'erosao', name: 'Erosão de matéria', cat: 'instrumento', color: INS,
    desc: 'a imagem se deteriora: limiar, ruído comendo a borda e o que cai escorrendo',
    params: [
      { k: 'prog', label: 'Avanço', min: 0, max: 1.2, def: 0.4 },
      { k: 'by', label: 'Comandado por', t: 's', opts: ['Luminância', 'Ruído', 'Movimento', 'Radial', 'De baixo para cima', 'Saturação'], def: 0 },
      { k: 'scale', label: 'Escala do ruído', min: 1, max: 60, def: 12 },
      { k: 'speed', label: 'Evolução', min: 0, max: 3, def: 0.25 },
      { k: 'edge', label: 'Dureza da borda', min: 0.005, max: 0.5, def: 0.08 },
      { k: 'crumb', label: 'Migalha', min: 0, max: 1, def: 0.45 },
      { k: 'fall', label: 'Escorrer o que caiu', min: 0, max: 0.3, def: 0.06 },
      { k: 'fallang', label: 'Direção da queda (°)', min: 0, max: 360, step: 1, def: 270 },
      { k: 'gone', t: 'c', label: 'O que sobrou do vazio', def: '#0d0d10' },
      { k: 'ghost', label: 'Fantasma do que caiu', min: 0, max: 1, def: 0.25 },
      { k: 'inv', label: 'Inverter (crescimento)', t: 'b', def: 0 }
    ],
    glsl: [
      'float eroMap(vec2 uv){',
      '  float m = floor(u_by + 0.5);',
      '  vec3 c = srccol(uv);',
      '  if(m < 0.5) return luma(c);',
      '  if(m < 1.5) return fbm3(uv*vec2(max(uAspect,0.001),1.0)*max(u_scale,1.0), uTime*u_speed);',
      '  if(m < 2.5) return clamp(length(c - histcol(1, uv))*5.0, 0.0, 1.0);',
      '  if(m < 3.5){ vec2 p = uv - 0.5; p.x *= uAspect; return 1.0 - clamp(length(p)*1.8, 0.0, 1.0); }',
      '  if(m < 4.5) return uv.y;',
      '  return rgb2hsv(c).y;',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 cur = srccol(uv);',
      '  float k = eroMap(uv);',
      /* migalha: a fronteira não é lisa, ela se desfaz em grão */
      '  float crumb = (fbm3(uv*vec2(max(uAspect,0.001),1.0)*max(u_scale,1.0)*3.1, uTime*u_speed*1.7) - 0.5)*u_crumb*0.5;',
      '  float lvl = u_prog;',
      '  float alive = smoothstep(lvl - u_edge, lvl + u_edge, k + crumb);',
      '  if(u_inv > 0.5) alive = 1.0 - alive;',
      /* o que caiu escorre na direção da queda e vira fantasma */
      '  vec3 gone = u_gone;',
      '  if(u_ghost > 0.001){',
      '    float a = u_fallang*PI/180.0;',
      '    vec2 d = vec2(cos(a)/max(uAspect,0.001), sin(a));',
      '    vec3 g = vec3(0.0); float w = 0.0;',
      '    for(int i=1;i<=5;i++){',
      '      float f = float(i)/5.0;',
      '      g += srccol(uv - d*u_fall*f)*(1.0 - f); w += (1.0 - f);',
      '    }',
      '    gone = mix(u_gone, g/max(w, 1e-3), u_ghost);',
      '  }',
      '  return mix(gone, cur, clamp(alive, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  D({
    id: 'campomov', name: 'Campo de movimento', cat: 'instrumento', color: INS,
    desc: 'o movimento vira campo visível: setas, linhas ou cor — e pode arrastar a própria imagem',
    params: [
      { k: 'search', label: 'Alcance da busca', min: 0.002, max: 0.06, step: 0.0005, def: 0.014 },
      { k: 'view', label: 'Como mostrar', t: 's', opts: ['Setas', 'Cor do fluxo', 'Linhas', 'Arrastar a imagem', 'Só a diferença'], def: 0 },
      { k: 'dens', label: 'Densidade', min: 4, max: 90, step: 1, def: 26 },
      { k: 'gain', label: 'Ganho', min: 0.2, max: 8, def: 2.4 },
      { k: 'thr', label: 'Limiar', min: 0, max: 0.4, def: 0.02 },
      { k: 'over', label: 'Sobre a imagem', min: 0, max: 1, def: 0.4 },
      { k: 'ink', t: 'c', label: 'Cor do campo', def: '#f5d000' },
      { k: 'bg', t: 'c', label: 'Fundo', def: '#0d0e12' }
    ],
    glsl: [
      'vec2 mfFlow(vec2 uv){',
      '  vec3 c0 = box3(uv, 2.0);',
      '  vec2 best = vec2(0.0); float bd = 1e9;',
      '  for(int i=0;i<12;i++){',
      '    float a = float(i)*(PI/6.0);',
      '    for(int j=1;j<=2;j++){',
      '      vec2 d = vec2(cos(a)/max(uAspect,0.001), sin(a))*u_search*float(j)*0.6;',
      '      float e = dot(abs(c0 - histcol(1, uv + d)), vec3(1.0));',
      '      if(e < bd){ bd = e; best = d; }',
      '    }',
      '  }',
      '  float still = dot(abs(c0 - histcol(1, uv)), vec3(1.0));',
      '  if(still < u_thr) return vec2(0.0);',
      '  return -best;',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 base = srccol(uv);',
      '  float m = floor(u_view + 0.5);',
      '  float g = max(u_dens, 4.0);',
      '  vec2 cell = (floor(uv*g) + 0.5)/g;',
      '  vec2 fl = mfFlow(cell)*u_gain;',
      '  if(m > 2.5 && m < 3.5) return srccol(uv + mfFlow(uv)*u_gain);',
      '  if(m > 3.5) return vec3(clamp(length(base - histcol(1, uv))*4.0*u_gain, 0.0, 1.0));',
      '  vec3 outc = mix(u_bg, base, u_over);',
      '  if(m > 0.5 && m < 1.5){',
      '    vec2 f = mfFlow(uv)*u_gain;',
      '    float ang = atan(f.y, f.x)/(2.0*PI) + 0.5;',
      '    float mag = clamp(length(f)*22.0, 0.0, 1.0);',
      '    return mix(outc, hsv2rgb(vec3(ang, 1.0, mag)), mag);',
      '  }',
      /* setas e linhas: coordenada local dentro da célula */
      '  vec2 q = (fract(uv*g) - 0.5)*2.0;',
      '  q.x *= uAspect/max(uAspect, 0.001);',
      '  float len = length(fl)*g*1.6;',
      '  if(len < 0.02) return outc;',
      '  vec2 dir = normalize(fl + 1e-6);',
      '  float along = dot(q, dir);',
      '  float across = abs(dot(q, vec2(-dir.y, dir.x)));',
      '  float body = step(-1.0, along)*step(along, min(len, 1.0))*smoothstep(0.16, 0.03, across);',
      '  float head = 0.0;',
      '  if(m < 0.5){',
      '    float t = min(len, 1.0);',
      '    head = smoothstep(0.3, 0.0, across*2.2 + abs(along - t)*1.6)*step(along, t + 0.02);',
      '  }',
      '  return mix(outc, u_ink, clamp(body + head, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  D({
    id: 'pinturafluxo', name: 'Pintura por fluxo', cat: 'instrumento', color: INS,
    desc: 'a tinta é depositada e depois carregada pelo movimento da imagem — pintura que anda junto',
    params: [
      { k: 'search', label: 'Alcance da busca', min: 0.002, max: 0.06, step: 0.0005, def: 0.014 },
      { k: 'gain', label: 'Ganho do fluxo', min: 0.2, max: 6, def: 1.6 },
      { k: 'keep', label: 'Permanência da tinta', min: 0.5, max: 0.999, step: 0.001, def: 0.96 },
      { k: 'drop', label: 'Onde a tinta cai', t: 's', opts: ['Onde há movimento', 'Onde é claro', 'Onde é escuro', 'Nas bordas', 'Em toda parte'], def: 0 },
      { k: 'rate', label: 'Quanta tinta cai', min: 0, max: 1, def: 0.16 },
      { k: 'ink', t: 'c', label: 'Cor da tinta', def: '#ff2e63' },
      { k: 'fromimg', label: 'Tinta com a cor da imagem', min: 0, max: 1, def: 0.65 },
      { k: 'spread', label: 'Espalhar', min: 0, max: 3, def: 0.8 },
      { k: 'show', label: 'Deixar ver a imagem', min: 0, max: 1, def: 0.35 }
    ],
    glsl: [
      'vec2 pfFlow(vec2 uv){',
      '  vec3 c0 = box3(uv, 2.0);',
      '  vec2 best = vec2(0.0); float bd = 1e9;',
      '  for(int i=0;i<10;i++){',
      '    float a = float(i)*(PI/5.0);',
      '    vec2 d = vec2(cos(a)/max(uAspect,0.001), sin(a))*u_search;',
      '    float e = dot(abs(c0 - histcol(1, uv + d)), vec3(1.0));',
      '    if(e < bd){ bd = e; best = d; }',
      '  }',
      '  return best;',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 cur = srccol(uv);',
      '  vec2 fl = pfFlow(uv)*u_gain;',
      /* a tinta que já existe é buscada de onde ela ESTAVA */
      '  vec3 mem = histcol(1, uv + fl);',
      '  if(u_spread > 0.01) mem = mix(mem, box3(uv + fl, u_spread), 0.4);',
      '  mem *= clamp(u_keep, 0.5, 0.999);',
      '  float mv = clamp(length(cur - histcol(1, uv))*5.0, 0.0, 1.0);',
      '  float m = floor(u_drop + 0.5);',
      '  float gate;',
      '  if(m < 0.5)      gate = mv;',
      '  else if(m < 1.5) gate = smoothstep(0.55, 0.9, luma(cur));',
      '  else if(m < 2.5) gate = 1.0 - smoothstep(0.1, 0.45, luma(cur));',
      '  else if(m < 3.5) gate = clamp(length(gradient(uv, 1.5))*2.0, 0.0, 1.0);',
      '  else             gate = 1.0;',
      '  vec3 tint = mix(u_ink, cur, u_fromimg);',
      '  vec3 paint = 1.0 - (1.0 - mem)*(1.0 - tint*gate*u_rate);',
      '  return mix(paint, cur, u_show*(1.0 - clamp(luma(paint), 0.0, 1.0)*0.6));',
      '}'
    ].join('\n')
  });

  D({
    id: 'imagemtexto', name: 'Imagem textual', cat: 'instrumento', color: INS,
    desc: 'a imagem escrita com caracteres: densidade, cor e movimento decidem qual letra aparece',
    params: [
      { k: 'set', label: 'Conjunto', t: 's', opts: ['Blocos', 'Pontos', 'Letras', 'Números', 'Sinais', 'Barras'], def: 0 },
      { k: 'cols', label: 'Colunas', min: 8, max: 260, step: 1, def: 90 },
      { k: 'by', label: 'Densidade por', t: 's', opts: ['Luminância', 'Saturação', 'Movimento', 'Borda'], def: 0 },
      { k: 'con', label: 'Contraste', min: -1, max: 3, def: 0.5 },
      { k: 'colmode', label: 'Cor', t: 's', opts: ['Da imagem', 'Uma cor só', 'Duas cores', 'Matiz pelo movimento'], def: 0 },
      { k: 'c1', t: 'c', label: 'Cor 01', def: '#2ee6a8' },
      { k: 'c2', t: 'c', label: 'Cor 02', def: '#ff2e63' },
      { k: 'bg', t: 'c', label: 'Fundo', def: '#0b0c10' },
      { k: 'scan', label: 'Varredura', min: 0, max: 1, def: 0.15 },
      { k: 'jitter', label: 'Instabilidade', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      /* cada glifo é desenhado por fórmula: nada de atlas, nada de fonte
         instalada. `fam` escolhe a família, `g` (0..9) a densidade.     */
      'float itGlyph(int fam, int g, vec2 q){',
      '  vec2 d = abs(clamp(q, 0.0, 1.0) - 0.5);',
      '  float v = float(g)/9.0;',
      '  if(g <= 0) return 0.0;',
      '  if(fam == 0) return step(max(d.x, d.y), v*0.46);',                        /* blocos */
      '  if(fam == 1) return step(length(d), v*0.46);',                            /* pontos */
      '  if(fam == 2){',                                                           /* letras */
      '    if(g < 3) return step(min(d.x, d.y), 0.05)*step(max(d.x, d.y), 0.30);',
      '    if(g < 5) return step(abs(d.x - d.y), 0.08)*step(max(d.x, d.y), 0.34);',
      '    if(g < 7) return step(length(d), 0.34) - step(length(d), 0.34 - v*0.22);',
      '    return step(max(d.x, d.y), 0.38) - step(max(d.x, d.y), 0.38 - v*0.30);',
      '  }',
      '  if(fam == 3){',                                                           /* números */
      '    float r = step(max(d.x, d.y), 0.34) - step(max(d.x, d.y), 0.34 - v*0.16);',
      '    return max(r, step(d.x, 0.05)*step(d.y, 0.30)*step(0.4, v));',
      '  }',
      '  if(fam == 4){',                                                           /* sinais */
      '    float cross = max(step(d.y, v*0.10)*step(d.x, 0.36), step(d.x, v*0.10)*step(d.y, 0.36));',
      '    return max(cross, step(abs(d.x + d.y - 0.30), v*0.09));',
      '  }',
      '  return step(d.y, v*0.42)*step(d.x, 0.44);',                               /* barras */
      '}',
      'vec3 fx(vec2 uv){',
      '  float cols = max(8.0, floor(u_cols + 0.5));',
      '  float rows = max(4.0, floor(cols/max(uAspect, 0.2)*0.55));',
      '  vec2 g = vec2(cols, rows);',
      '  vec2 cell = floor(uv*g);',
      '  vec2 q = fract(uv*g);',
      '  if(u_jitter > 0.001){',
      '    float j = (hash21(cell + floor(uTime*12.0)) - 0.5)*u_jitter;',
      '    cell.x += floor(j*3.0);',
      '  }',
      '  vec2 cuv = (cell + 0.5)/g;',
      '  vec3 c = srccol(cuv);',
      '  float v;',
      '  float bm = floor(u_by + 0.5);',
      '  if(bm < 0.5)      v = luma(c);',
      '  else if(bm < 1.5) v = rgb2hsv(c).y;',
      '  else if(bm < 2.5) v = clamp(length(c - histcol(1, cuv))*5.0, 0.0, 1.0);',
      '  else              v = clamp(length(gradient(cuv, 1.5))*2.2, 0.0, 1.0);',
      '  v = clamp((v - 0.5)*(1.0 + u_con) + 0.5, 0.0, 1.0);',
      '  if(u_scan > 0.001) v *= 1.0 - u_scan*0.5*(0.5 + 0.5*sin((uv.y*rows - uTime*3.0)*PI*2.0));',
      '  int gi = int(floor(v*9.0 + 0.5));',
      '  float ink = itGlyph(int(floor(u_set + 0.5)), gi, q);',
      '  vec3 col;',
      '  float cm = floor(u_colmode + 0.5);',
      '  if(cm < 0.5)      col = c;',
      '  else if(cm < 1.5) col = u_c1;',
      '  else if(cm < 2.5) col = mix(u_c1, u_c2, v);',
      '  else {',
      '    float mv = clamp(length(c - histcol(1, cuv))*6.0, 0.0, 1.0);',
      '    col = hsv2rgb(vec3(fract(mv + uTime*0.05), 0.85, 0.5 + v*0.5));',
      '  }',
      '  return mix(u_bg, col, ink);',
      '}'
    ].join('\n')
  });

  D({
    id: 'ruidogerativo', name: 'Ruído generativo', cat: 'instrumento', color: INS,
    desc: 'perlin, fractal ou celular gerado aqui — e ligado a cor, opacidade ou deformação',
    params: [
      { k: 'kind', label: 'Ruído', t: 's', opts: ['Valor', 'Fractal', 'Celular', 'Turbulento', 'Listras', 'Cristais'], def: 1 },
      { k: 'scale', label: 'Escala', min: 0.5, max: 80, def: 8 },
      { k: 'speed', label: 'Evolução', min: 0, max: 3, def: 0.3 },
      { k: 'octaves', label: 'Oitavas', min: 1, max: 6, step: 1, def: 4 },
      { k: 'con', label: 'Contraste', min: -1, max: 4, def: 0.6 },
      { k: 'use', label: 'Ligado a', t: 's', opts: ['Cor (mistura)', 'Opacidade', 'Deformação', 'Máscara dura', 'Só o ruído'], def: 0 },
      { k: 'amt', label: 'Força', min: 0, max: 1, def: 0.5 },
      { k: 'warp', label: 'Deformação', min: 0, max: 0.3, step: 0.001, def: 0.05 },
      { k: 'c1', t: 'c', label: 'Cor baixa', def: '#16150f' },
      { k: 'c2', t: 'c', label: 'Cor alta', def: '#efede4' },
      { k: 'audio', label: 'Reagir ao som', min: 0, max: 3, def: 0 }
    ],
    glsl: [
      'float rgNoise(vec2 p, float t){',
      '  float m = floor(u_kind + 0.5);',
      '  if(m < 0.5) return vnoise(p + t);',
      '  if(m < 1.5){',
      '    float n = max(1.0, floor(u_octaves + 0.5));',
      '    float a = 0.5, s = 0.0;',
      '    for(int i=0;i<6;i++){ if(float(i) >= n) break; s += a*vnoise(p + t*(1.0 + float(i)*0.2)); p *= 2.03; a *= 0.5; }',
      '    return s;',
      '  }',
      '  if(m < 2.5) return 1.0 - voronoi(p + t).x;',
      '  if(m < 3.5) return abs(fbm3(p, t)*2.0 - 1.0);',
      '  if(m < 4.5) return 0.5 + 0.5*sin(p.x*3.0 + fbm3(p, t)*7.0);',
      '  return smoothstep(0.35, 0.42, voronoi(p + t).x);',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float sc = max(u_scale, 0.5)*(1.0 + uAudio.y*u_audio*0.5);',
      '  vec2 p = uv*vec2(max(uAspect, 0.001), 1.0)*sc;',
      '  float t = uTime*u_speed;',
      '  float n = rgNoise(p, t);',
      '  n = clamp((n - 0.5)*(1.0 + u_con) + 0.5, 0.0, 1.0);',
      '  n = clamp(n + uAudio.x*u_audio*0.25, 0.0, 1.0);',
      '  float m = floor(u_use + 0.5);',
      '  if(m < 0.5) return mix(c, mix(u_c1, u_c2, n), u_amt);',
      '  if(m < 1.5) return mix(c*n, c, 1.0 - u_amt);',
      '  if(m < 2.5){',
      '    float e = 0.004;',
      '    vec2 g = vec2(rgNoise(p + vec2(e, 0.0), t) - n, rgNoise(p + vec2(0.0, e), t) - n)*30.0;',
      '    return srccol(uv + g*u_warp);',
      '  }',
      '  if(m < 3.5) return mix(c, mix(u_c1, u_c2, step(0.5, n)), u_amt);',
      '  return mix(u_c1, u_c2, n);',
      '}'
    ].join('\n')
  });

  D({
    id: 'tipodesl', name: 'Tipografia como matéria', cat: 'instrumento', color: INS,
    desc: 'uma grade tipográfica deformada pela imagem: a letra vira textura que responde ao vídeo',
    params: [
      { k: 'cols', label: 'Colunas', min: 6, max: 160, step: 1, def: 40 },
      { k: 'weight', label: 'Peso do traço', min: 0.02, max: 0.5, def: 0.14 },
      { k: 'push', label: 'Empurrão da imagem', min: 0, max: 1, def: 0.55 },
      { k: 'scale', label: 'Corpo pela luz', min: 0, max: 1, def: 0.6 },
      { k: 'rot', label: 'Giro pela borda', min: 0, max: 1, def: 0.4 },
      { k: 'track', label: 'Entreletras', min: 0.4, max: 2, def: 1 },
      { k: 'kind', label: 'Sinal', t: 's', opts: ['Barra', 'Cruz', 'Anel', 'Cunha', 'Ponto', 'Traço duplo'], def: 0 },
      { k: 'ink', t: 'c', label: 'Tinta', def: '#efede4' },
      { k: 'bg', t: 'c', label: 'Fundo', def: '#16150f' },
      { k: 'fromimg', label: 'Tinta com a cor da imagem', min: 0, max: 1, def: 0.5 }
    ],
    glsl: [
      'float tdSign(int k, vec2 q, float w){',
      '  vec2 d = abs(q);',
      '  if(k == 0) return step(d.y, w)*step(d.x, 0.42);',
      '  if(k == 1) return max(step(d.y, w)*step(d.x, 0.36), step(d.x, w)*step(d.y, 0.36));',
      '  if(k == 2) return step(abs(length(q) - 0.28), w);',
      '  if(k == 3) return step(d.y, w + q.x*0.5 + 0.25)*step(d.x, 0.4)*step(-0.4, q.x);',
      '  if(k == 4) return step(length(q), w*2.2);',
      '  return step(min(abs(q.y - 0.14), abs(q.y + 0.14)), w*0.7)*step(d.x, 0.4);',
      '}',
      'vec3 fx(vec2 uv){',
      '  float cols = max(6.0, floor(u_cols + 0.5));',
      '  float rows = max(3.0, floor(cols/max(uAspect, 0.2)*0.6));',
      '  vec2 g = vec2(cols, rows)/max(u_track, 0.4);',
      '  vec2 cell = floor(uv*g);',
      '  vec2 cuv = (cell + 0.5)/g;',
      '  vec3 c = srccol(cuv);',
      '  float l = luma(c);',
      '  vec2 gr = gradient(cuv, 1.5);',
      '  vec2 q = (fract(uv*g) - 0.5)*2.0;',
      '  q -= gr*u_push*1.6;',
      '  float s = mix(1.0, 0.35 + l*1.5, u_scale);',
      '  q /= max(s, 0.15);',
      '  q = rot2(q, atan(gr.y, gr.x)*u_rot);',
      '  float ink = tdSign(int(floor(u_kind + 0.5)), q, max(u_weight, 0.02));',
      '  vec3 col = mix(u_ink, c*1.4, u_fromimg);',
      '  return mix(u_bg, col, clamp(ink, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

})(window.VE);
