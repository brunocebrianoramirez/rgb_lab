/* ============================================================
   rgb_lab — registro de efeitos (parte 2: distorção, glitch,
   movimento e ASCII art)
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  /* ================= DISTORÇÃO ================= */

  D({
    id: 'rgbsplit', name: 'RGB Split', cat: 'distorcao', color: '#7c5cff',
    desc: 'aberração cromática — separa os canais',
    params: [
      { k: 'amt', label: 'Força', min: 0, max: 1, def: 0.12 },
      { k: 'ang', label: 'Ângulo', min: 0, max: 360, step: 1, def: 0 },
      { k: 'mode', t: 's', label: 'Direção', def: 0, opts: ['Reta', 'Radial (do centro)'] },
      { k: 'jit', label: 'Tremida', min: 0, max: 1, def: 0 },
      { k: 'spd', label: 'Velocidade da tremida', min: 1, max: 60, step: 1, def: 24 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 dir;',
      '  if(u_mode < 0.5){ float a = radians(u_ang); dir = vec2(cos(a), sin(a)); }',
      '  else { vec2 d = uv-0.5; dir = d*2.0; }',
      '  float jt = (hash11(floor(uTime*u_spd))-0.5)*u_jit*2.0;',
      '  vec2 o = dir*(u_amt*0.06)*(1.0+jt)*vec2(1.0/uAspect, 1.0);',
      '  return vec3(srccol(uv+o).r, srccol(uv).g, srccol(uv-o).b);',
      '}'
    ].join('\n')
  });

  D({
    id: 'wave', name: 'Onda / Ondulação', cat: 'distorcao', color: '#7c5cff',
    desc: 'deforma como água, bandeira ou ruído',
    params: [
      { k: 'type', t: 's', label: 'Tipo', def: 0, opts: ['Senoidal', 'Ruído orgânico', 'Círculos (água)'] },
      { k: 'amp', label: 'Amplitude', min: 0, max: 4, def: 1 },
      { k: 'freq', label: 'Frequência', min: 1, max: 120, step: 0.5, def: 22 },
      { k: 'spd', label: 'Velocidade', min: 0, max: 12, def: 3 },
      { k: 'vert', label: 'Componente vertical', min: 0, max: 2, def: 0.5 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float t = uTime*u_spd;',
      '  vec2 o = vec2(0.0);',
      '  if(u_type < 0.5){',
      '    o.x = sin(uv.y*u_freq + t)*u_amp*0.02;',
      '    o.y = cos(uv.x*u_freq*0.8 + t*1.13)*u_amp*0.02*u_vert;',
      '  } else if(u_type < 1.5){',
      '    o = (vec2(fbm(uv*u_freq*0.25 + t*0.35), fbm(uv*u_freq*0.25 + 31.4 - t*0.3))-0.5)*u_amp*0.09;',
      '  } else {',
      '    vec2 d = uv-0.5; d.x *= uAspect; float r = length(d);',
      '    o = normalize(d + 1e-6)*sin(r*u_freq - t*3.0)*u_amp*0.02;',
      '  }',
      '  return srccol(uv+o);',
      '}'
    ].join('\n')
  });

  D({
    id: 'twirl', name: 'Redemoinho', cat: 'distorcao', color: '#7c5cff',
    desc: 'torce a imagem em espiral',
    params: [
      { k: 'str', label: 'Força', min: -4, max: 4, def: 1.4 },
      { k: 'rad', label: 'Raio', min: 0.02, max: 1.2, def: 0.45 },
      { k: 'spin', label: 'Girar no tempo', min: -3, max: 3, def: 0 },
      { k: 'cx', label: 'Centro X', min: 0, max: 1, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: 0, max: 1, def: 0.5 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 c = vec2(u_cx, u_cy);',
      '  vec2 d = uv-c; d.x *= uAspect;',
      '  float r = length(d);',
      '  float f = smoothstep(u_rad, 0.0, r);',
      '  d = rot2(d, f*u_str*3.0 + uTime*u_spin*f);',
      '  d.x /= uAspect;',
      '  return srccol(c+d);',
      '}'
    ].join('\n')
  });

  D({
    id: 'fisheye', name: 'Olho de peixe / Barril', cat: 'distorcao', color: '#7c5cff',
    desc: 'lente curva, para dentro ou para fora',
    params: [
      { k: 'amt', label: 'Curvatura', min: -1.5, max: 1.5, def: 0.5 },
      { k: 'amt2', label: 'Curvatura 2ª ordem', min: -1, max: 1, def: 0 },
      { k: 'zoom', label: 'Zoom', min: 0.3, max: 2.5, def: 1 },
      { k: 'edge', t: 'b', label: 'Bordas pretas', def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 d = uv-0.5; d.x *= uAspect;',
      '  float r2 = dot(d,d);',
      '  d *= 1.0 + u_amt*r2 + u_amt2*r2*r2;',
      '  d /= max(u_zoom, 0.05); d.x /= uAspect;',
      '  vec2 p = d+0.5;',
      '  if(u_edge > 0.5 && (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0)) return vec3(0.0);',
      '  return srccol(p);',
      '}'
    ].join('\n')
  });

  D({
    id: 'pixelate', name: 'Pixelar / Mosaico', cat: 'distorcao', color: '#7c5cff',
    desc: 'blocos, bolinhas ou losangos',
    params: [
      { k: 'size', label: 'Tamanho', min: 2, max: 90, step: 1, def: 14 },
      { k: 'ar', label: 'Proporção', min: 0.3, max: 3, def: 1 },
      { k: 'shape', t: 's', label: 'Forma', def: 0, opts: ['Quadrado cheio', 'Bolinha', 'Quadrado com borda', 'Losango'] },
      { k: 'gap', label: 'Espaço entre blocos', min: 0, max: 1, def: 0.8 },
      { k: 'bg', t: 'c', label: 'Cor do fundo', def: '#000000' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float s = max(u_size, 2.0);',
      '  vec2 cell = vec2(s*u_ar, s)/uRes;',
      '  vec2 idx = floor(uv/cell);',
      '  vec2 f = fract(uv/cell) - 0.5;',
      '  vec3 c = srccol((idx+0.5)*cell);',
      '  if(u_shape > 0.5){',
      '    float d;',
      '    if(u_shape < 1.5) d = length(f)*2.0;',
      '    else if(u_shape < 2.5) d = max(abs(f.x), abs(f.y))*2.0;',
      '    else d = (abs(f.x)+abs(f.y))*2.0;',
      '    c = mix(u_bg, c, 1.0 - smoothstep(u_gap, u_gap+0.14, d));',
      '  }',
      '  return c;',
      '}'
    ].join('\n')
  });

  D({
    id: 'kaleido', name: 'Caleidoscópio', cat: 'distorcao', color: '#7c5cff',
    desc: 'espelha em fatias radiais',
    params: [
      { k: 'seg', label: 'Fatias', min: 2, max: 24, step: 1, def: 6 },
      { k: 'rot', label: 'Rotação (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'spin', label: 'Girar no tempo', min: -3, max: 3, def: 0.2 },
      { k: 'zoom', label: 'Zoom', min: 0.2, max: 4, def: 1 },
      { k: 'cx', label: 'Centro X', min: 0, max: 1, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: 0, max: 1, def: 0.5 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 ctr = vec2(u_cx, u_cy);',
      '  vec2 d = uv-ctr; d.x *= uAspect;',
      '  float r = length(d)*u_zoom;',
      '  float a = atan(d.y, d.x) + radians(u_rot) + uTime*u_spin;',
      '  float seg = 6.283185307/max(u_seg, 2.0);',
      '  a = mod(a, seg);',
      '  a = abs(a - seg*0.5);',
      '  vec2 p = vec2(cos(a), sin(a))*r;',
      '  p.x /= uAspect; p += ctr;',
      '  p = abs(fract(p*0.5)*2.0 - 1.0);',
      '  return srccol(p);',
      '}'
    ].join('\n')
  });

  D({
    id: 'noisedisp', name: 'Deslocamento por ruído', cat: 'distorcao', color: '#7c5cff',
    desc: 'derrete a imagem organicamente',
    params: [
      { k: 'amt', label: 'Força', min: 0, max: 3, def: 0.8 },
      { k: 'scale', label: 'Escala do ruído', min: 0.5, max: 40, step: 0.5, def: 4 },
      { k: 'spd', label: 'Velocidade', min: 0, max: 5, def: 0.6 },
      { k: 'dirx', label: 'Peso X', min: 0, max: 2, def: 1 },
      { k: 'diry', label: 'Peso Y', min: 0, max: 2, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float t = uTime*u_spd;',
      '  vec2 o;',
      '  o.x = (fbm(uv*u_scale + vec2(t, 0.0)) - 0.5)*u_dirx;',
      '  o.y = (fbm(uv*u_scale + vec2(0.0, t) + 17.3) - 0.5)*u_diry;',
      '  return srccol(uv + o*u_amt*0.2);',
      '}'
    ].join('\n')
  });

  D({
    id: 'mirror', name: 'Espelho', cat: 'distorcao', color: '#7c5cff',
    desc: 'reflete metade da imagem',
    params: [
      { k: 'mode', t: 's', label: 'Modo', def: 0, opts: ['Esquerda → direita', 'Direita → esquerda', 'Cima → baixo', 'Baixo → cima', 'Quatro cantos'] },
      { k: 'pos', label: 'Posição do eixo', min: 0, max: 1, def: 0.5 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv;',
      '  if(u_mode < 0.5)      p.x = (p.x < u_pos) ? p.x : 2.0*u_pos - p.x;',
      '  else if(u_mode < 1.5) p.x = (p.x > u_pos) ? p.x : 2.0*u_pos - p.x;',
      '  else if(u_mode < 2.5) p.y = (p.y < u_pos) ? p.y : 2.0*u_pos - p.y;',
      '  else if(u_mode < 3.5) p.y = (p.y > u_pos) ? p.y : 2.0*u_pos - p.y;',
      '  else p = abs(uv*2.0 - 1.0);',
      '  return srccol(p);',
      '}'
    ].join('\n')
  });

  D({
    id: 'slice', name: 'Fatias deslizantes', cat: 'distorcao', color: '#7c5cff',
    desc: 'corta em tiras e desloca cada uma',
    params: [
      { k: 'count', label: 'Nº de fatias', min: 2, max: 120, step: 1, def: 16 },
      { k: 'amt', label: 'Deslocamento', min: 0, max: 1, def: 0.25 },
      { k: 'dir', t: 's', label: 'Direção', def: 0, opts: ['Horizontal', 'Vertical'] },
      { k: 'rand', t: 'b', label: 'Aleatório', def: 1 },
      { k: 'spd', label: 'Velocidade', min: 0, max: 30, step: 0.5, def: 6 },
      { k: 'wavey', label: 'Onda suave', min: 0, max: 2, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float n = max(u_count, 2.0);',
      '  float idx = (u_dir < 0.5) ? floor(uv.y*n) : floor(uv.x*n);',
      '  float r = (u_rand > 0.5) ? (hash21(vec2(idx, floor(uTime*u_spd)))-0.5) : (mod(idx, 2.0)-0.5);',
      '  float off = r*u_amt*0.6 + sin(uTime*u_spd*0.6 + idx*0.7)*u_wavey*0.06;',
      '  vec2 p = uv + ((u_dir < 0.5) ? vec2(off, 0.0) : vec2(0.0, off));',
      '  return srccol(fract(p));',
      '}'
    ].join('\n')
  });

  /* ================= GLITCH ================= */

  D({
    id: 'glitch', name: 'Glitch digital', cat: 'glitch', color: '#ff2e63',
    desc: 'linhas rasgadas, blocos e ruído de dados',
    params: [
      { k: 'amt', label: 'Intensidade', min: 0, max: 1, def: 0.35 },
      { k: 'len', label: 'Tamanho do rasgo', min: 0, max: 1, def: 0.3 },
      { k: 'rows', label: 'Nº de linhas', min: 4, max: 200, step: 1, def: 40 },
      { k: 'spd', label: 'Velocidade', min: 0.2, max: 8, def: 2 },
      { k: 'cs', label: 'Separação de cor', min: 0, max: 2, def: 0.7 },
      { k: 'blocky', label: 'Blocos coloridos', min: 0, max: 2, def: 0.5 },
      { k: 'blocks', label: 'Densidade dos blocos', min: 4, max: 80, step: 1, def: 22 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float t = floor(uTime*u_spd*10.0);',
      '  float rows = max(u_rows, 4.0);',
      '  float row = floor(uv.y*rows);',
      '  float r = hash21(vec2(row, t));',
      '  float on = step(1.0-u_amt, r);',
      '  float shift = (hash21(vec2(row*3.1, t*1.7))-0.5)*u_len*on;',
      '  vec2 duv = vec2(fract(uv.x + shift), uv.y);',
      '  vec3 c = srccol(duv);',
      '  float cs = u_cs*on*0.02;',
      '  c.r = srccol(duv + vec2(cs, 0.0)).r;',
      '  c.b = srccol(duv - vec2(cs, 0.0)).b;',
      '  vec2 bl = floor(uv*vec2(u_blocks, u_blocks*0.55));',
      '  float br = hash21(bl + t*7.3);',
      '  if(br > 1.0 - u_amt*0.3*u_blocky){',
      '    vec3 rnd = vec3(hash21(bl+1.0), hash21(bl+2.0), hash21(bl+3.0));',
      '    c = mix(c, step(0.5, rnd)*rnd*1.4, 0.75);',
      '  }',
      '  return c;',
      '}'
    ].join('\n')
  });

  D({
    id: 'datamosh', name: 'Datamosh', cat: 'glitch', color: '#ff2e63',
    desc: 'macroblocos travados arrastando o frame anterior',
    params: [
      { k: 'amt', label: 'Blocos travados', min: 0, max: 1, def: 0.55 },
      { k: 'block', label: 'Tamanho do bloco', min: 2, max: 160, step: 1, def: 24 },
      { k: 'len', label: 'Comprimento do arrasto', min: 0, max: 3, def: 0.5 },
      { k: 'ang', label: 'Direção (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'follow', label: 'Seguir o contorno', min: 0, max: 2, def: 0.45 },
      { k: 'decay', label: 'Persistência', min: 0, max: 1, def: 0.92 },
      { k: 'rate', label: 'Troca de blocos (Hz)', min: 0.5, max: 30, step: 0.5, def: 8 },
      { k: 'scatter', label: 'Bagunça dos blocos', min: 0, max: 2, def: 0.4 },
      { k: 'chrom', label: 'Deriva de cor', min: 0, max: 2, def: 0.3 },
      { k: 'edge', label: 'Arrasto geral', min: 0, max: 1, def: 0.15 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 cur = srccol(uv);',
      '  vec2 px = 1.0/uRes;',
      '  float a = radians(u_ang);',
      '  vec2 dir = vec2(cos(a), sin(a));',
      /* vetor de movimento aproximado pelo gradiente da imagem */
      '  float lx = luma(srccol(uv + vec2(px.x*2.0, 0.0))) - luma(srccol(uv - vec2(px.x*2.0, 0.0)));',
      '  float ly = luma(srccol(uv + vec2(0.0, px.y*2.0))) - luma(srccol(uv - vec2(0.0, px.y*2.0)));',
      '  vec2 flow = (dir + vec2(lx, ly)*u_follow*10.0)*u_len*0.045*vec2(1.0/uAspect, 1.0);',
      /* macroblocos: alguns travam e continuam repetindo o frame anterior */
      '  vec2 blk = floor(uv*uRes/max(u_block, 2.0));',
      '  float t = floor(uTime*u_rate);',
      '  vec2 jit = (hash22(blk + t*3.1) - 0.5)*u_scatter*0.02;',
      '  vec3 prev = texture(uPrev, clamp(uv - flow + jit, 0.0, 1.0)).rgb;',
      '  if(u_chrom > 0.001){ vec3 h = rgb2hsv(prev); h.x = fract(h.x + u_chrom*0.02); prev = hsv2rgb(h); }',
      '  float lock = step(1.0 - u_amt, hash21(blk*1.7 + t));',
      '  vec3 smear = mix(cur, prev, u_decay);',
      '  return mix(cur, smear, clamp(max(lock, u_edge), 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  D({
    id: 'crt', name: 'CRT / Tubão', cat: 'glitch', color: '#ff2e63',
    desc: 'tela curva, linhas e máscara de fósforo',
    params: [
      { k: 'curve', label: 'Curvatura', min: 0, max: 2, def: 0.6 },
      { k: 'scan', label: 'Linhas', min: 0, max: 1, def: 0.5 },
      { k: 'slf', label: 'Densidade das linhas', min: 0.1, max: 2, def: 0.5 },
      { k: 'mask', label: 'Máscara RGB', min: 0, max: 1, def: 0.4 },
      { k: 'flick', label: 'Cintilação', min: 0, max: 1, def: 0.1 },
      { k: 'vig', label: 'Vinheta', min: 0, max: 1, def: 0.6 },
      { k: 'bright', label: 'Brilho', min: 0.2, max: 3, def: 1.35 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv*2.0 - 1.0;',
      '  float r2 = dot(p, p);',
      '  p *= 1.0 + r2*u_curve*0.22;',
      '  vec2 t = p*0.5 + 0.5;',
      '  if(t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) return vec3(0.0);',
      '  vec3 c = srccol(t);',
      '  float sl = 0.5 + 0.5*sin(t.y*uRes.y*PI*u_slf);',
      '  c *= 1.0 - u_scan*0.55*sl;',
      '  float m = mod(floor(t.x*uRes.x), 3.0);',
      '  vec3 grille = vec3(step(m, 0.5), step(abs(m-1.0), 0.5), step(abs(m-2.0), 0.5))*0.6 + 0.7;',
      '  c *= mix(vec3(1.0), grille, u_mask);',
      '  c *= 1.0 + (hash11(floor(uTime*30.0))-0.5)*u_flick;',
      '  c *= mix(1.0, 1.0 - smoothstep(0.55, 1.4, length(p)), u_vig);',
      '  return c*u_bright;',
      '}'
    ].join('\n')
  });

  /* ================= TEMPO / MOVIMENTO ================= */

  D({
    id: 'zoomblur', name: 'Desfoque radial / zoom', cat: 'tempo', color: '#00e5ff',
    desc: 'sensação de velocidade a partir de um ponto',
    params: [
      { k: 'amt', label: 'Força', min: 0, max: 2, def: 0.5 },
      { k: 'spin', label: 'Rotação', min: -2, max: 2, def: 0 },
      { k: 'fall', label: 'Decaimento', min: 0, max: 1, def: 0.4 },
      { k: 'cx', label: 'Centro X', min: 0, max: 1, def: 0.5 },
      { k: 'cy', label: 'Centro Y', min: 0, max: 1, def: 0.5 },
      { k: 'chrom', label: 'Franja colorida', min: 0, max: 2, def: 0.3 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 c = vec2(u_cx, u_cy);',
      '  vec3 acc = vec3(0.0); float w = 0.0;',
      '  for(int i=0;i<20;i++){',
      '    float f = float(i)/19.0;',
      '    vec2 d = uv - c; d.x *= uAspect;',
      '    d = rot2(d, f*u_spin*0.25);',
      '    d *= 1.0 - f*u_amt*0.3;',
      '    d.x /= uAspect;',
      '    vec3 s = srccol(c + d);',
      '    vec3 h = rgb2hsv(s); h.x = fract(h.x + f*u_chrom*0.06); s = hsv2rgb(h);',
      '    float we = 1.0 - f*u_fall;',
      '    acc += s*we; w += we;',
      '  }',
      '  return acc/max(w, 0.0001);',
      '}'
    ].join('\n')
  });

  D({
    id: 'echo', name: 'Rastro / Eco', cat: 'tempo', color: '#00e5ff',
    desc: 'guarda o frame anterior — trilhas e feedback',
    params: [
      { k: 'decay', label: 'Persistência', min: 0, max: 1, def: 0.85 },
      { k: 'zoom', label: 'Zoom do rastro', min: 0.9, max: 1.1, step: 0.001, def: 1.005 },
      { k: 'rot', label: 'Rotação do rastro (°)', min: -10, max: 10, step: 0.1, def: 0 },
      { k: 'hue', label: 'Deriva de matiz', min: 0, max: 5, def: 0 },
      { k: 'mode', t: 's', label: 'Mistura', def: 0, opts: ['Máximo', 'Tela (screen)', 'Soma', 'Média'] },
      { k: 'mixv', label: 'Peso do rastro (média)', min: 0, max: 1, def: 0.5 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 c = vec2(0.5);',
      '  vec2 d = uv - c; d.x *= uAspect;',
      '  d = rot2(d, radians(u_rot))/max(u_zoom, 0.01);',
      '  d.x /= uAspect;',
      '  vec3 prev = texture(uPrev, clamp(c+d, 0.0, 1.0)).rgb*u_decay;',
      '  if(u_hue > 0.001){ vec3 h = rgb2hsv(prev); h.x = fract(h.x + u_hue*0.004); prev = hsv2rgb(h); }',
      '  vec3 cur = srccol(uv);',
      '  if(u_mode < 0.5) return max(cur, prev);',
      '  if(u_mode < 1.5) return 1.0 - (1.0-cur)*(1.0-prev);',
      '  if(u_mode < 2.5) return cur + prev;',
      '  return mix(cur, prev, u_mixv);',
      '}'
    ].join('\n')
  });

  D({
    id: 'shake', name: 'Tremor de câmera', cat: 'tempo', color: '#00e5ff',
    desc: 'balança, gira e dá zoom sem sair do lugar',
    params: [
      { k: 'amt', label: 'Deslocamento', min: 0, max: 2, def: 0.35 },
      { k: 'rot', label: 'Rotação (°)', min: 0, max: 30, step: 0.5, def: 2 },
      { k: 'spd', label: 'Velocidade', min: 0.5, max: 40, step: 0.5, def: 12 },
      { k: 'steps', label: 'Travado em frames', min: 0, max: 60, step: 1, def: 0 },
      { k: 'zoom', label: 'Zoom', min: 0.7, max: 1.6, def: 1.06 },
      { k: 'pulse', label: 'Pulsar zoom', min: 0, max: 0.5, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float t = (u_steps > 0.5) ? floor(uTime*u_steps)/u_steps : uTime;',
      '  t *= u_spd;',
      '  vec2 o = vec2(vnoise(vec2(t, 3.1)), vnoise(vec2(9.7, t)))-0.5;',
      '  float a = (vnoise(vec2(t*0.7, 5.0))-0.5)*radians(u_rot)*2.0;',
      '  float z = u_zoom*(1.0 + sin(t*1.7)*u_pulse);',
      '  vec2 p = uv + o*u_amt*0.12 - 0.5;',
      '  p.x *= uAspect;',
      '  p = rot2(p, a)/max(z, 0.05);',
      '  p.x /= uAspect;',
      '  return srccol(p + 0.5);',
      '}'
    ].join('\n')
  });

  /* ================= ASCII ================= */

  VE.CHARSETS = [
    { id: 'padrao', label: 'Clássico', chars: ' .:-=+*#%@' },
    { id: 'denso', label: 'Denso (70 níveis)', chars: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$' },
    { id: 'blocos', label: 'Blocos', chars: ' ░▒▓█' },
    { id: 'blocosgeo', label: 'Blocos geométricos', chars: ' ▗▖▄▌▞▙█' },
    { id: 'minimo', label: 'Mínimo', chars: ' .*#' },
    { id: 'binario', label: 'Binário', chars: ' 01' },
    { id: 'hash', label: 'Hashes', chars: ' ...---+++###' },
    { id: 'katakana', label: 'Katakana (matrix)', chars: ' アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ' },
    { id: 'braille', label: 'Braille', chars: '⠀⠁⠃⠇⡇⡏⡟⡿⣿' },
    { id: 'coracoes', label: 'Corações', chars: ' ·♡♥❤' },
    { id: 'setas', label: 'Setas', chars: ' ·←↑→↓↔↕⇔◆' },
    { id: 'matematico', label: 'Matemático', chars: ' ·÷±≠≡∫∑∞■' },
    { id: 'emoji', label: 'Emoji sombra', chars: ' ░○●◉⬤' },
    { id: 'custom', label: '✏ Personalizado…', chars: ' .:oO@' }
  ];

  D({
    id: 'ascii', name: 'ASCII ART', cat: 'ascii', color: '#2ee6a8',
    desc: 'transforma o vídeo em texto — 14 conjuntos, 8 modos de cor',
    /* o motor pergunta ao efeito qual atlas ele quer; antes essa escolha
       vivia dentro do gl.js em dois `if` iguais.                       */
    atlas: function (params) {
      var cs = VE.CHARSETS[params.set | 0] || VE.CHARSETS[0];
      var chars = (cs.id === 'custom') ? (params.custom || ' .:oO@') : cs.chars;
      return this.atlasFor(chars, params.font | 0, params.bold > 0.5);
    },
    params: [
      { k: 'cell', label: 'Tamanho da letra', min: 3, max: 48, step: 0.5, def: 10 },
      { k: 'ar', label: 'Proporção da célula', min: 0.35, max: 1.6, def: 0.6 },
      { k: 'set', t: 's', label: 'Conjunto', def: 0, uni: false, opts: VE.CHARSETS.map(function (c) { return c.label; }) },
      { k: 'custom', t: 'txt', label: 'Caracteres (do escuro ao claro)', def: ' .:oO@', uni: false },
      { k: 'font', t: 's', label: 'Fonte', def: 0, uni: false, opts: ['Monospace', 'Courier', 'Consolas', 'Sans', 'Serif'] },
      { k: 'bold', t: 'b', label: 'Negrito', def: 1, uni: false },
      { k: 'inv', t: 'b', label: 'Inverter claro/escuro', def: 0 },
      { k: 'black', label: 'Ponto preto', min: 0, max: 1, def: 0.02 },
      { k: 'white', label: 'Ponto branco', min: 0, max: 1.5, def: 0.95 },
      { k: 'gamma', label: 'Gama', min: 0.2, max: 3, def: 1 },
      { k: 'cmode', t: 's', label: 'Cor do texto', def: 1, opts: ['Uma cor só', 'Cor do vídeo', 'Gradiente 2 cores', 'Arco-íris animado', 'Matrix (verde)', 'Térmico', 'Neon', 'Vídeo saturado'] },
      { k: 'fg', t: 'c', label: 'Cor do texto', def: '#2ee6a8' },
      { k: 'c1', t: 'c', label: 'Gradiente — escuro', def: '#ff2e63' },
      { k: 'c2', t: 'c', label: 'Gradiente — claro', def: '#00e5ff' },
      { k: 'bg', t: 'c', label: 'Cor do fundo', def: '#000000' },
      { k: 'bgsrc', label: 'Fundo com o vídeo', min: 0, max: 1, def: 0 },
      { k: 'dim', label: 'Escurecer o fundo', min: 0, max: 1, def: 0.25 },
      { k: 'blend', label: 'Misturar com o vídeo', min: 0, max: 1, def: 0 },
      { k: 'glow', label: 'Brilho do texto', min: 0, max: 2, def: 0 }
    ],
    glsl: [
      'vec3 asciiColor(float l, vec3 s, vec2 idx){',
      '  if(u_cmode < 0.5) return u_fg;',
      '  if(u_cmode < 1.5) return s;',
      '  if(u_cmode < 2.5) return mix(u_c1, u_c2, l);',
      '  if(u_cmode < 3.5) return hsv2rgb(vec3(fract(idx.x*0.018 + idx.y*0.01 + uTime*0.12), 0.9, 1.0));',
      '  if(u_cmode < 4.5){',
      '    float fl = 0.45 + 0.55*hash21(vec2(idx.x, floor(uTime*7.0 + idx.y*0.35)));',
      '    return vec3(0.1, 1.0, 0.35)*fl*(0.6 + 0.8*l);',
      '  }',
      '  if(u_cmode < 5.5){',
      '    vec3 a = mix(vec3(0.0,0.0,0.35), vec3(0.85,0.0,0.55), smoothstep(0.0,0.4,l));',
      '    return mix(a, mix(vec3(1.0,0.55,0.0), vec3(1.0,1.0,0.85), smoothstep(0.7,1.0,l)), smoothstep(0.35,0.8,l));',
      '  }',
      '  if(u_cmode < 6.5) return mix(vec3(1.0,0.12,0.6), vec3(0.1,0.95,1.0), l);',
      '  vec3 h = rgb2hsv(s); h.y = min(h.y*2.0, 1.0); h.z = max(h.z, 0.6); return hsv2rgb(h);',
      '}',
      'vec3 fx(vec2 uv){',
      '  float cs = max(u_cell, 3.0);',
      '  vec2 cell = vec2(cs*u_ar, cs)/uRes;',
      '  vec2 idx = floor(uv/cell);',
      '  vec2 f = fract(uv/cell);',
      '  vec2 ctr = (idx+0.5)*cell;',
      '  vec3 s = srccol(ctr);',
      '  s += srccol(ctr + vec2(cell.x*0.32, 0.0));',
      '  s += srccol(ctr - vec2(cell.x*0.32, 0.0));',
      '  s += srccol(ctr + vec2(0.0, cell.y*0.32));',
      '  s += srccol(ctr - vec2(0.0, cell.y*0.32));',
      '  s /= 5.0;',
      '  float l = luma(s);',
      '  l = clamp((l - u_black)/max(u_white - u_black, 0.02), 0.0, 1.0);',
      '  l = pow(l, max(u_gamma, 0.05));',
      '  if(u_inv > 0.5) l = 1.0 - l;',
      '  float n = max(uAtlasInfo.x - 1.0, 1.0);',
      '  float gi = floor(l*n + 0.5);',
      '  float cols = max(uAtlasInfo.y, 1.0);',
      '  float rows = max(uAtlasInfo.z, 1.0);',
      /* mesma armadilha do mosaico: mod() erra no múltiplo exato e apaga
         a letra. Aqui o sintoma era um nível de cinza que saía vazio. */
      '  vec2 g = celulaAtlas(gi, cols);',
      '  vec2 auv = (g + vec2(f.x, 1.0-f.y))/vec2(cols, rows);',
      '  float glyph = texture(uAtlas, auv).r;',
      '  vec3 fg = asciiColor(l, s, idx);',
      '  vec3 bg = mix(u_bg, s*(1.0-u_dim), u_bgsrc);',
      '  vec3 col = mix(bg, fg, glyph);',
      '  col += fg*glyph*u_glow*0.8;',
      '  return mix(col, srccol(uv), u_blend);',
      '}'
    ].join('\n')
  });

  /* ================= MOSAICO DE EMOJI =================
     Primo do ASCII, com uma diferença que muda tudo: o ASCII escolhe a
     figura pelo BRILHO da célula, e este escolhe pela COR. Por isso a
     imagem continua sendo a imagem — céu com figuras azuis, fogo com
     figuras laranjas — em vez de virar uma rampa colorida.

     A figura entra com a cor dela própria, sobre fundo que pode ser
     opaco, o vídeo escurecido, ou transparente de verdade (`alpha`).

     Sobre "emoji do iOS": o desenho vem da fonte de emoji do sistema.
     Num Mac ou num iPhone, é literalmente o conjunto da Apple; num PC,
     é o da Microsoft. As duas são fontes protegidas — não dá para
     embutir a da Apple no arquivo, e por isso não embutimos nenhuma.  */

  /* ------------------------------------------------ QUAL DESENHO SAI
     O emoji não é imagem nossa: é uma FONTE do sistema, e cada sistema
     tem a sua. A da Apple só existe em máquina da Apple e não pode ser
     embutida aqui — é obra protegida. Então a escolha é honesta: usar a
     que a máquina tem, e deixar apontar para outra se ela for instalada.

     Esta lista mora AQUI e não em `gl.js` porque `fx2.js` carrega antes
     dele, e é aqui que ela é lida para montar o seletor do efeito. Se
     morasse lá, o seletor nasceria vazio.

     Ordem importa: a primeira que existir na máquina é a que desenha. */
  VE.EMOJIFONT_BASE = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",' +
    '"Twemoji Mozilla","EmojiOne Color",sans-serif';

  VE.EMOJIFONTES = [
    { id: 'sistema', n: 'DO SISTEMA', fam: null },
    { id: 'apple', n: 'APPLE (só em Mac/iPhone)', fam: '"Apple Color Emoji"' },
    { id: 'segoe', n: 'MICROSOFT (Segoe UI Emoji)', fam: '"Segoe UI Emoji"' },
    { id: 'noto', n: 'GOOGLE (Noto Color Emoji)', fam: '"Noto Color Emoji"' },
    { id: 'twemoji', n: 'TWEMOJI', fam: '"Twemoji Mozilla","Twemoji"' },
    { id: 'openmoji', n: 'OPENMOJI', fam: '"OpenMoji","OpenMoji Color"' },
    { id: 'custom', n: '✏ Outra instalada…', fam: null }
  ];

  VE.emojiFontStack = function (id, custom) {
    var base = VE.EMOJIFONT_BASE;
    var f = VE.EMOJIFONTES.filter(function (x) { return x.id === id; })[0];
    if (!f || f.id === 'sistema') return base;
    if (f.id === 'custom') {
      var nome = String(custom || '').trim();
      if (!nome) return base;
      /* aspas só se o nome tiver espaço e ainda não estiver entre aspas */
      if (nome.indexOf('"') < 0 && nome.indexOf(' ') >= 0) nome = '"' + nome + '"';
      return nome + ',' + base;
    }
    /* a escolhida na frente, a do sistema atrás: se ela não existir, o
       mosaico continua desenhando em vez de sair em quadradinhos.   */
    return f.fam + ',' + base;
  };

  /* ------------------------------------------- O QUE MUDA O DESENHO
     `document.fonts.check` NÃO serve aqui: ele devolve verdadeiro sempre
     que o navegador consegue desenhar o caractere de algum jeito — e o
     emoji sempre tem um recurso de reserva. A primeira versão disto
     jurava que a fonte da Apple estava instalada num PC.

     Detecção de família por nome é terreno movediço no navegador. Então
     não perguntamos "está instalada?", que é difícil e pouco útil:
     perguntamos **"escolher esta muda o desenho?"**, que é a pergunta
     que interessa e se responde DESENHANDO e comparando os pixels.   */
  VE.emojiFontesDisponiveis = function () {
    var amostra = '😀🟥🌊🔥';
    function pinta(pilha) {
      var cv = document.createElement('canvas');
      cv.width = 160; cv.height = 40;
      var c = cv.getContext('2d', { willReadFrequently: true });
      c.clearRect(0, 0, 160, 40);
      c.textBaseline = 'middle';
      c.font = '32px ' + pilha;
      c.fillText(amostra, 2, 20);
      return c.getImageData(0, 0, 160, 40).data;
    }
    function difere(a, b) {
      if (a.length !== b.length) return true;
      var n = 0;
      for (var i = 0; i < a.length; i += 4) {
        if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) +
          Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) > 24) n++;
      }
      return n > 60;               /* algumas dezenas de pixels de diferença */
    }
    var base = pinta(VE.EMOJIFONT_BASE);
    return VE.EMOJIFONTES.filter(function (f) { return f.fam; }).map(function (f) {
      var muda = false;
      try { muda = difere(pinta(VE.emojiFontStack(f.id)), base); } catch (e) { }
      return {
        id: f.id, nome: f.n, mudaODesenho: muda,
        recado: muda ? 'existe nesta máquina e desenha diferente'
          : 'aqui sai igual ao do sistema — ou não está instalada'
      };
    });
  };

  VE.EMOJISETS = [
    {
      id: 'retrato', label: 'Retrato (variado)',
      chars: '🔥🌸🌹🍁🍂🌻🌼🌺🍀🌿🌳🌊💧💦🧊❄️⭐🌟✨💫☀️🌙🌈☁️⛅🍎🍊🍋🍌🍉🍇🍓🥝🥑🍆🌽🥕🍞🧀🍫🍬🐝🦋🐞🐟🐠🕊️👁️💋👑💎🎈🎀⬛⬜🟦🟩🟨🟧🟥🟪🟫🔵🟢'
    },
    {
      id: 'cores', label: 'Cores chapadas',
      chars: '🟥🟧🟨🟩🟦🟪🟫⬛⬜🔴🟠🟡🟢🔵🟣🟤⚫⚪❤️🧡💛💚💙💜🤎🖤🤍🔶🔷🔸🔹🔺🔻💠♦️♥️♠️♣️'
    },
    {
      id: 'natureza', label: 'Natureza',
      chars: '🌱🌿🍀☘️🌳🌲🌴🌵🍃🍂🍁🌾🌻🌼🌷🌹🌸💐🏵️🌺🔥💧🌊❄️🧊⛰️🌋🏜️🏝️🌅🌄☀️🌙⭐☁️🌈🐝🦋🐞🐛🐌🦊🐻🐼🐨🐸🐢🐍🐟🐠🐡🐬🐳🌰🍄🪨🪵'
    },
    {
      id: 'comida', label: 'Comida',
      chars: '🍎🍏🍊🍋🍌🍉🍇🍓🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶️🌽🥕🧄🧅🥔🥐🍞🥖🥨🧀🥚🍳🥞🧇🥓🍖🍗🥩🌭🍔🍟🍕🥪🌮🌯🥗🍝🍜🍣🍤🍙🍚🍦🍩🍪🎂🍰🧁🍫🍬🍭'
    },
    {
      id: 'rostos', label: 'Rostos',
      chars: '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭😴'
    },
    {
      id: 'cinza', label: 'Preto e branco',
      chars: '⬛⬜◼️◻️◾◽▪️▫️🌑🌒🌓🌔🌕🌖🌗🌘⚫⚪🖤🤍☁️🌫️⛄🎱🏳️🏴'
    },
    {
      id: 'bolhas', label: 'Bolhas e brilhos',
      chars: '⚪⚫🔴🟠🟡🟢🔵🟣🟤💧💦🫧✨💫⭐🌟🔆🔅💠🔘🕳️🌕🌑🎱🥎⚽🏀🏐🎾🪩'
    },
    { id: 'personalizado', label: '✏ Personalizado…', chars: '🟥🟧🟨🟩🟦🟪⬛⬜' }
  ];

  D({
    id: 'emoji', name: 'MOSAICO DE EMOJI', cat: 'ascii', color: '#ffb020',
    desc: 'reconstrói o quadro com emoji escolhidos pela cor de cada célula',
    alpha: true,
    atlas: function (params) {
      var cs = VE.EMOJISETS[params.set | 0] || VE.EMOJISETS[0];
      var txt = (cs.id === 'personalizado') ? (params.custom || cs.chars) : cs.chars;
      var lista = VE.grafemas(txt);
      if (!lista.length) lista = VE.grafemas(VE.EMOJISETS[0].chars);
      var f = VE.EMOJIFONTES[params.fonte | 0] || VE.EMOJIFONTES[0];
      return this.atlasEmoji(lista, params.peso, VE.emojiFontStack(f.id, params.fontefam));
    },
    params: [
      { k: 'cell', label: 'Tamanho da peça', min: 5, max: 72, step: 0.5, def: 18 },
      { k: 'ar', label: 'Proporção da célula', min: 0.4, max: 1.8, def: 1 },
      { k: 'set', t: 's', label: 'Conjunto', def: 0, uni: false, opts: VE.EMOJISETS.map(function (c) { return c.label; }) },
      { k: 'custom', t: 'txt', label: 'Emoji (cole os seus)', def: '🟥🟧🟨🟩🟦🟪⬛⬜', uni: false },
      /* O desenho vem da fonte de emoji INSTALADA. A do sistema é a que
         quase sempre serve; as outras só valem se existirem na máquina. */
      { k: 'fonte', t: 's', label: 'Desenho do emoji', def: 0, uni: false, opts: VE.EMOJIFONTES.map(function (f) { return f.n; }) },
      { k: 'fontefam', t: 'txt', label: 'Nome da fonte instalada', def: '', uni: false },
      { k: 'peso', label: 'Peso do brilho na escolha', min: 0.3, max: 3, step: 0.05, def: 1, uni: false },
      { k: 'esc', label: 'Tamanho do desenho', min: 0.4, max: 1.5, def: 1 },
      /* a vibração mexe na COR QUE VAI À BUSCA, não na que aparece: subir
         demais joga a cor para o canto do cubo, onde a paleta de emoji não
         tem vizinho perto, e a escolha desanda. Por isso começa em zero. */
      { k: 'vib', label: 'Vibração da cor lida', min: -1, max: 2, def: 0 },
      { k: 'gamma', label: 'Gama da leitura', min: 0.2, max: 3, def: 1 },
      { k: 'tint', label: 'Puxar para a cor do vídeo', min: 0, max: 1, def: 0 },
      { k: 'bg', t: 'c', label: 'Cor do fundo', def: '#000000' },
      { k: 'bgsrc', label: 'Fundo com o vídeo', min: 0, max: 1, def: 0 },
      { k: 'dim', label: 'Escurecer o fundo', min: 0, max: 1, def: 0.7 },
      { k: 'recorte', t: 'b', label: 'Recortar o fundo (transparente)', def: 0 },
      { k: 'blend', label: 'Misturar com o vídeo', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'vec4 fx4(vec2 uv){',
      '  float cs = max(u_cell, 4.0);',
      '  vec2 cell = vec2(cs*u_ar, cs)/uRes;',
      '  vec2 idx = floor(uv/cell);',
      '  vec2 f = fract(uv/cell);',
      '  vec2 ctr = (idx+0.5)*cell;',
      /* cinco amostras: só o centro faria a peça pular com o granulado */
      '  vec3 s = srccol(ctr);',
      '  s += srccol(ctr + vec2(cell.x*0.30, 0.0));',
      '  s += srccol(ctr - vec2(cell.x*0.30, 0.0));',
      '  s += srccol(ctr + vec2(0.0, cell.y*0.30));',
      '  s += srccol(ctr - vec2(0.0, cell.y*0.30));',
      '  s /= 5.0;',
      /* a cor que VAI À BUSCA é temperada antes; a cor que aparece no
         fundo continua sendo a do vídeo, sem tempero.                */
      '  vec3 hv = rgb2hsv(clamp(s, 0.0, 1.0));',
      '  hv.y = clamp(hv.y*(1.0 + u_vib), 0.0, 1.0);',
      '  hv.z = clamp(pow(max(hv.z, 1e-6), max(u_gamma, 0.05)), 0.0, 1.0);',
      '  float gi = figuraDaCor(hsv2rgb(hv));',
      '  float cols = max(uAtlasInfo.y, 1.0);',
      '  float rowsT = max(uAtlasInfo.w, 1.0);',
      '  vec2 g = celulaAtlas(gi, cols);',
      '  vec2 fq = (f - 0.5)/max(u_esc, 0.05) + 0.5;',
      '  vec4 fig = vec4(0.0);',
      '  if(fq.x > 0.0 && fq.x < 1.0 && fq.y > 0.0 && fq.y < 1.0){',
      '    vec2 auv = (g + vec2(fq.x, 1.0 - fq.y))/vec2(cols, rowsT);',
      '    fig = texture(uAtlas, auv);',
      '  }',
      '  vec3 figc = mix(fig.rgb, s, clamp(u_tint, 0.0, 1.0));',
      '  vec3 bg = mix(u_bg, s*(1.0 - u_dim), u_bgsrc);',
      '  vec3 col = mix(bg, figc, fig.a);',
      '  float a = mix(1.0, fig.a, step(0.5, u_recorte));',
      '  col = mix(col, srccol(uv), u_blend);',
      '  a = mix(a, 1.0, u_blend);',
      '  return vec4(col, a);',
      '}'
    ].join('\n')
  });

  /* ================= ESTILOS PRONTOS ================= */
  /* cada item: lista de efeitos com parâmetros já ajustados */
  VE.STYLES = [
    {
      id: 'vhs94', name: 'VHS 1994', desc: 'fita gasta, cor sangrando e tracking',
      fx: [
        ['color', { con: 0.15, sat: 0.35, gam: 1.05 }],
        ['vhs', { res: 200, bleed: 1.2, track: 0.5, wob: 0.9, noise: 0.18, scan: 0.25,
                  cdelay: 9, fring: 1.1, crease: 0.6, drop: 0.9, head: 0.9, gen: 0.9,
                  sharp: 0.5, soft: 1.2, tbe: 1.0, tear: 1.1, smear: 0.7 }],
        ['vignette', { size: 0.42, int: 0.6 }]
      ]
    },
    {
      id: 'fitaruim', name: 'Fita ruim', desc: 'a fita judiada: borda rasgada, cor escorrendo e riscos',
      fx: [
        ['vhs', { res: 170, soft: 1.8, sharp: 0.3, smear: 1.1, cdelay: 11, bleed: 1.6,
                  fring: 1.6, cshift: 0.06, sat: 0.8, wob: 1.4, tbe: 1.6, tear: 1.6,
                  vjump: 0.08, crease: 0.9, track: 1.0, head: 1.2, drop: 1.3,
                  noise: 0.26, flick: 0.1, scan: 0.1, gen: 1.6 }]
      ]
    },
    {
      id: 'terminal', name: 'Terminal ASCII', desc: 'verde de monitor antigo, tudo em texto',
      fx: [
        ['color', { con: 0.4, sat: -0.4 }],
        ['ascii', { cell: 9, cmode: 0, fg: '#39ff7d', bg: '#020602', ar: 0.58 }],
        ['crt', { curve: 0.7, scan: 0.45, mask: 0.25, vig: 0.7 }]
      ]
    },
    {
      id: 'matrix', name: 'Matrix', desc: 'katakana verde cintilante',
      fx: [
        ['ascii', { cell: 12, set: 7, cmode: 4, bg: '#000500', ar: 0.72, gamma: 1.4, glow: 0.6 }],
        ['bloom', { thr: 0.35, rad: 1.2, int: 0.8, tint: '#39ff7d' }]
      ]
    },
    {
      id: 'vapor', name: 'Vaporwave', desc: 'rosa/ciano, espelho e brilho',
      fx: [
        ['hue', { hue: -25, sat: 0.6, temp: 0.15 }],
        ['rgbsplit', { amt: 0.18, ang: 0 }],
        ['mirror', { mode: 0, pos: 0.5 }],
        ['bloom', { thr: 0.55, rad: 1.8, int: 1.1, tint: '#ff7ae0' }],
        ['gradmap', { c1: '#1b0140', c2: '#ff2e9a', c3: '#7ef9ff', gain: 1.1 }]
      ]
    },
    {
      id: 'glitchcore', name: 'Glitch pesado', desc: 'rasgos, blocos e separação de cor',
      fx: [
        ['glitch', { amt: 0.55, len: 0.4, rows: 60, spd: 3, cs: 1.2, blocky: 1.2 }],
        ['rgbsplit', { amt: 0.25, jit: 0.8 }],
        ['datamosh', { amt: 0.4, block: 18, len: 0.35, decay: 0.85, rate: 12, edge: 0.2 }]
      ]
    },
    {
      id: 'noir', name: 'Cinema P&B', desc: 'preto e branco contrastado com grão',
      fx: [
        ['color', { con: 0.55, sat: -1, gam: 0.95 }],
        ['film', { sepia: 0.15, grain: 0.1, scratch: 0.08, flick: 0.06, vig: 0.9 }],
        ['sharpen', { amt: 0.5 }]
      ]
    },
    {
      id: 'rave', name: 'Rave / Strobe', desc: 'flashes coloridos e tremor',
      fx: [
        ['flash', { freq: 6, duty: 0.22, int: 1.2, mode: 0, col: '#ffffff' }],
        ['hue', { spd: 0.8, sat: 0.7 }],
        ['shake', { amt: 0.5, rot: 3, spd: 18, zoom: 1.08 }],
        ['bloom', { thr: 0.5, int: 1.4, rad: 2 }]
      ]
    },
    {
      id: 'cyber', name: 'Cyberpunk neon', desc: 'roxo e ciano com brilho forte',
      fx: [
        ['color', { con: 0.35, sat: 0.5, lift: 0.05 }],
        ['duotone', { dark: '#12002e', light: '#00e5ff', con: 0.5 }],
        ['bloom', { thr: 0.45, rad: 2.2, int: 1.5, tint: '#c86bff' }],
        ['edge', { keep: 1, srccol: 0, line: '#ff2e9a', gain: 3, thr: 0.25 }]
      ]
    },
    {
      id: 'super8', name: 'Super 8', desc: 'película doméstica dos anos 70',
      fx: [
        ['film', { sepia: 0.75, grain: 0.2, scratch: 0.45, flick: 0.25, vig: 0.85, con: 0.2 }],
        ['shake', { amt: 0.12, rot: 0.6, spd: 20, steps: 18, zoom: 1.04 }],
        ['blur', { rad: 0.6, mixv: 0.4 }]
      ]
    },
    {
      id: 'mosh', name: 'Datamosh', desc: 'vídeo derretendo e arrastando',
      fx: [
        ['datamosh', { amt: 0.7, block: 32, len: 0.9, follow: 0.8, decay: 0.95, rate: 6, chrom: 0.8, scatter: 0.6 }],
        ['noisedisp', { amt: 0.5, scale: 3, spd: 0.4 }],
        ['echo', { decay: 0.6, zoom: 1.01, mode: 0 }]
      ]
    },
    {
      id: 'popart', name: 'Pop art', desc: 'meio-tom colorido de quadrinho',
      fx: [
        ['color', { exp: 0.4, con: 0.25, sat: 1, lift: 0.06, gam: 1.15 }],
        ['posterize', { lev: 5, sat: 0.9, dith: 0.15 }],
        ['halftone', { size: 7, ang: 30, col: 1, scale: 0.72, bg: '#fdf6e3', ink: '#16150f' }],
        ['edge', { keep: 1, srccol: 0, line: '#16150f', gain: 2.4, thr: 0.42, w: 1.4 }]
      ]
    },
    {
      id: 'gameboy', name: 'Game Boy', desc: '4 tons de verde, tudo pixelado',
      fx: [
        ['pixelate', { size: 6, shape: 0 }],
        ['dither', { px: 1, mono: 1, dark: '#0f380f', light: '#9bbc0f', lev: 4 }],
        ['vignette', { size: 0.5, int: 0.4 }]
      ]
    },
    {
      id: 'sonho', name: 'Sonho', desc: 'suave, estourado e quente',
      fx: [
        ['bloom', { thr: 0.35, rad: 3, int: 1.2, tint: '#ffd9f2' }],
        ['blur', { rad: 1.2, mixv: 0.35 }],
        ['color', { exp: 0.25, con: -0.1, sat: 0.25, lift: 0.1 }],
        ['vignette', { size: 0.45, soft: 0.6, int: 0.5, col: '#ff9ad5' }]
      ]
    },
    {
      id: 'caleido', name: 'Caleidoscópio', desc: 'mandala girando',
      fx: [
        ['kaleido', { seg: 8, spin: 0.25, zoom: 1.2 }],
        ['hue', { spd: 0.3, sat: 0.5 }],
        ['bloom', { thr: 0.6, int: 0.9 }]
      ]
    }
  ];

})(window.VE);
