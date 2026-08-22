/* ============================================================
   rgb_lab — efeitos parte 3
   Transparência (alpha), tinta sobre papel, trama e sistemas
   de imagem. Efeitos marcados com alpha:true implementam
   vec4 fx4(vec2 uv) e podem alterar o canal alpha.
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  /* ===================== TRANSPARÊNCIA ===================== */

  D({
    id: 'removewhite', name: 'Remover fundo (alpha)', cat: 'alpha', color: '#d0271b', alpha: true,
    desc: 'transforma branco, preto ou uma cor em transparência',
    params: [
      { k: 'mode', t: 's', label: 'Remover', def: 0, opts: ['Branco → alpha', 'Preto → alpha', 'Rampa por brilho', 'Cor específica'] },
      { k: 'thr', label: 'Limiar', min: 0, max: 1, def: 0.88 },
      { k: 'soft', label: 'Suavidade da borda', min: 0.001, max: 0.5, step: 0.001, def: 0.09 },
      { k: 'black', label: 'Ponto opaco (rampa)', min: 0, max: 1, def: 0.1 },
      { k: 'gamma', label: 'Curva do alpha', min: 0.2, max: 4, def: 1 },
      { k: 'gain', label: 'Ganho do alpha', min: 0, max: 3, def: 1 },
      { k: 'key', t: 'c', label: 'Cor a remover', def: '#ffffff' },
      { k: 'spill', label: 'Reforçar tinta', min: 0, max: 1, def: 0 },
      { k: 'ink', t: 'c', label: 'Cor da tinta', def: '#16150f' }
    ],
    glsl: [
      'vec4 fx4(vec2 uv){',
      '  vec4 c = texture(uTex, uv);',
      '  float a = 1.0;',
      '  if(u_mode < 0.5){',
      '    float l = max(max(c.r, c.g), c.b);',
      '    a = 1.0 - smoothstep(u_thr - u_soft, u_thr + u_soft, l);',
      '  } else if(u_mode < 1.5){',
      '    float l = luma(c.rgb);',
      '    a = smoothstep(u_thr - u_soft, u_thr + u_soft, l);',
      '  } else if(u_mode < 2.5){',
      '    float l = luma(c.rgb);',
      '    a = clamp(1.0 - (l - u_black)/max(u_thr - u_black, 0.001), 0.0, 1.0);',
      '  } else {',
      '    float d = distance(c.rgb, u_key);',
      '    a = smoothstep(u_thr*0.6, u_thr*0.6 + u_soft + 0.002, d);',
      '  }',
      '  a = clamp(pow(clamp(a, 1e-6, 1.0), max(u_gamma, 0.05))*u_gain, 0.0, 1.0);',
      '  vec3 rgb = mix(c.rgb, u_ink, u_spill);',
      '  return vec4(rgb, c.a*a);',
      '}'
    ].join('\n')
  });

  D({
    id: 'alphaboard', name: 'Fundo sólido', cat: 'alpha', color: '#d0271b', alpha: true,
    desc: 'preenche a transparência com uma cor (achata o alpha)',
    params: [
      { k: 'col', t: 'c', label: 'Cor do fundo', def: '#efede4' },
      { k: 'keep', label: 'Manter alpha', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'vec4 fx4(vec2 uv){',
      '  vec4 c = texture(uTex, uv);',
      '  vec3 rgb = mix(u_col, c.rgb, c.a);',
      '  return vec4(rgb, mix(1.0, c.a, u_keep));',
      '}'
    ].join('\n')
  });

  /* ===================== TINTA SOBRE PAPEL ===================== */

  D({
    id: 'paperink', name: 'Tinta sobre papel', cat: 'impressao', color: '#1b4fd8',
    desc: 'duas tintas, grão de papel e registro deslocado',
    params: [
      { k: 'paper', t: 'c', label: 'Papel', def: '#efede4' },
      { k: 'ink', t: 'c', label: 'Tinta', def: '#16150f' },
      { k: 'ink2', t: 'c', label: 'Segunda tinta', def: '#1b4fd8' },
      { k: 'mix2', label: 'Quantidade da 2ª tinta', min: 0, max: 1, def: 0 },
      { k: 'con', label: 'Contraste', min: -1, max: 3, def: 0.5 },
      { k: 'lift', label: 'Ponto de papel', min: 0, max: 1, def: 0.1 },
      { k: 'grain', label: 'Grão do papel', min: 0, max: 1, def: 0.22 },
      { k: 'fiber', label: 'Fibra', min: 0, max: 1, def: 0.15 },
      { k: 'reg', label: 'Erro de registro', min: 0, max: 2, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 off = vec2(u_reg, -u_reg)*0.004;',
      '  float l1 = luma(srccol(uv));',
      '  float l2 = luma(srccol(uv + off));',
      '  l1 = clamp((l1-0.5)*(1.0+u_con)+0.5, 0.0, 1.0);',
      '  l2 = clamp((l2-0.5)*(1.0+u_con)+0.5, 0.0, 1.0);',
      '  float g = (hash21(uv*uRes*0.9 + floor(uTime*18.0))-0.5)*u_grain;',
      '  float fib = (vnoise(vec2(uv.x*uRes.x*0.35, uv.y*uRes.y*0.02))-0.5)*u_fiber;',
      '  vec3 paper = u_paper + g*0.4 + fib*0.25;',
      '  vec3 c = mix(u_ink, paper, clamp(l1 + g + u_lift, 0.0, 1.0));',
      '  vec3 c2 = mix(u_ink2, paper, clamp(l2 + g + u_lift, 0.0, 1.0));',
      '  return mix(c, min(c, c2), u_mix2);',
      '}'
    ].join('\n')
  });

  D({
    id: 'stipple', name: 'Pontilhado (stipple)', cat: 'impressao', color: '#1b4fd8',
    desc: 'densidade de pontos aleatórios pela luminância',
    params: [
      { k: 'size', label: 'Célula', min: 1, max: 20, step: 0.5, def: 4 },
      { k: 'dot', label: 'Tamanho do ponto', min: 0.05, max: 1.6, def: 0.72 },
      { k: 'gain', label: 'Densidade', min: 0.1, max: 3, def: 1.7 },
      { k: 'gamma', label: 'Curva', min: 0.2, max: 3, def: 1.1 },
      { k: 'jit', label: 'Desalinhamento', min: 0, max: 1, def: 0.85 },
      { k: 'anim', label: 'Refazer por frame', min: 0, max: 1, def: 0 },
      { k: 'ink', t: 'c', label: 'Tinta', def: '#16150f' },
      { k: 'paper', t: 'c', label: 'Papel', def: '#efede4' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float s = max(u_size, 1.0);',
      '  vec2 cell = vec2(s)/uRes;',
      '  vec2 id = floor(uv/cell);',
      '  vec2 f = fract(uv/cell);',
      '  float seed = (u_anim > 0.5) ? floor(uTime*24.0) : 0.0;',
      '  vec2 jit = (hash22(id + seed*7.3) - 0.5)*u_jit;',
      '  float l = luma(srccol((id+0.5)*cell));',
      '  l = pow(clamp(l, 1e-6, 1.0), max(u_gamma, 0.05));',
      '  float dens = clamp((1.0 - l)*u_gain, 0.0, 1.0);',
      '  float keep = step(1.0 - dens, hash21(id + 3.7 + seed));',
      '  float d = length(f - 0.5 - jit*0.5)*2.0;',
      '  float r = u_dot*sqrt(dens + 0.0001);',
      '  float ink = keep*(1.0 - smoothstep(r - 0.25, r + 0.25, d));',
      '  return mix(u_paper, u_ink, clamp(ink, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  D({
    id: 'blob', name: 'Trama que funde', cat: 'impressao', color: '#1b4fd8',
    desc: 'pontos de meio-tom que se juntam em massas orgânicas',
    params: [
      { k: 'size', label: 'Grade', min: 3, max: 60, step: 0.5, def: 13 },
      { k: 'gain', label: 'Ganho', min: 0.1, max: 3, def: 1.45 },
      { k: 'thr', label: 'Limiar da fusão', min: 0.2, max: 3, def: 0.85 },
      { k: 'soft', label: 'Borda', min: 0.001, max: 1, step: 0.001, def: 0.09 },
      { k: 'ang', label: 'Ângulo da grade', min: 0, max: 90, step: 1, def: 0 },
      { k: 'inv', t: 'b', label: 'Inverter', def: 0 },
      { k: 'ink', t: 'c', label: 'Tinta', def: '#1b4fd8' },
      { k: 'paper', t: 'c', label: 'Papel', def: '#efede4' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float s = max(u_size, 3.0);',
      '  vec2 px = uv*uRes;',
      '  vec2 rp = rot2(px, radians(u_ang));',
      '  vec2 id = floor(rp/s);',
      '  vec2 fp = rp/s;',
      '  float field = 0.0;',
      '  for(int j=-1;j<=1;j++){',
      '    for(int i=-1;i<=1;i++){',
      '      vec2 nid = id + vec2(float(i), float(j));',
      '      vec2 ctr = (nid + 0.5);',
      '      vec2 back = rot2(ctr*s, -radians(u_ang));',
      '      float l = luma(srccol(back/uRes));',
      '      if(u_inv > 0.5) l = 1.0 - l;',
      '      float r = clamp((1.0 - l)*u_gain, 0.0, 1.6)*0.8;',
      '      float d = length(fp - ctr) + 0.0001;',
      '      field += (r*r)/(d*d);',
      '    }',
      '  }',
      '  float ink = smoothstep(u_thr - u_soft, u_thr + u_soft, field);',
      '  return mix(u_paper, u_ink, ink);',
      '}'
    ].join('\n')
  });

  D({
    id: 'dotmatrix', name: 'Matriz de pontos', cat: 'impressao', color: '#1b4fd8',
    desc: 'impressora matricial: pontos em linhas com filetes',
    params: [
      { k: 'size', label: 'Passo', min: 2, max: 40, step: 0.5, def: 8 },
      { k: 'ar', label: 'Proporção', min: 0.3, max: 3, def: 1 },
      { k: 'dot', label: 'Ponto', min: 0.1, max: 1.4, def: 0.78 },
      { k: 'lev', label: 'Níveis', min: 2, max: 8, step: 1, def: 4 },
      { k: 'line', label: 'Filete entre linhas', min: 0, max: 1, def: 0.55 },
      { k: 'gamma', label: 'Curva', min: 0.2, max: 3, def: 1 },
      { k: 'ink', t: 'c', label: 'Tinta', def: '#16150f' },
      { k: 'paper', t: 'c', label: 'Papel', def: '#efede4' }
    ],
    glsl: [
      'const float BM[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);',
      'vec3 fx(vec2 uv){',
      '  float s = max(u_size, 2.0);',
      '  vec2 cell = vec2(s*u_ar, s)/uRes;',
      '  vec2 id = floor(uv/cell);',
      '  vec2 f = fract(uv/cell);',
      '  float l = luma(srccol((id+0.5)*cell));',
      '  l = pow(clamp(l, 1e-6, 1.0), max(u_gamma, 0.05));',
      '  int bi = int(mod(id.x, 4.0)) + int(mod(id.y, 4.0))*4;',
      '  float n = max(u_lev, 2.0);',
      '  float q = floor(l*n + BM[bi]/16.0)/n;',
      '  float r = (1.0 - clamp(q, 0.0, 1.0))*u_dot;',
      '  float d = length((f - 0.5)*vec2(1.0, 1.0))*2.0;',
      '  float ink = 1.0 - smoothstep(r - 0.16, r + 0.16, d);',
      '  float rule = (1.0 - smoothstep(0.0, 0.09, abs(f.y - 0.5)))*u_line*0.35;',
      '  return mix(u_paper, u_ink, clamp(max(ink, rule), 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  D({
    id: 'bitmap', name: 'Bitmap 1-bit', cat: 'impressao', color: '#1b4fd8',
    desc: 'preto e branco com trama ordenada e pixel grande',
    params: [
      { k: 'px', label: 'Pixel', min: 1, max: 24, step: 1, def: 3 },
      { k: 'thr', label: 'Limiar', min: 0, max: 1, def: 0.5 },
      { k: 'pat', t: 's', label: 'Trama', def: 0, opts: ['Bayer 4×4', 'Linhas', 'Cruz', 'Ruído'] },
      { k: 'scale', label: 'Escala da trama', min: 1, max: 12, step: 1, def: 4 },
      { k: 'ink', t: 'c', label: 'Tinta', def: '#16150f' },
      { k: 'paper', t: 'c', label: 'Papel', def: '#efede4' }
    ],
    glsl: [
      'const float BM2[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);',
      'vec3 fx(vec2 uv){',
      '  float px = max(u_px, 1.0);',
      '  vec2 p = floor(uv*uRes/px);',
      '  float l = luma(srccol((p+0.5)*px/uRes));',
      '  vec2 sp = floor(p/max(u_scale/4.0, 0.25));',
      '  float t;',
      '  if(u_pat < 0.5){ int bi = int(mod(sp.x,4.0)) + int(mod(sp.y,4.0))*4; t = (BM2[bi]+0.5)/16.0; }',
      '  else if(u_pat < 1.5){ t = fract(sp.y/u_scale); }',
      '  else if(u_pat < 2.5){ t = fract((sp.x+sp.y)/u_scale); }',
      '  else { t = hash21(sp); }',
      '  float ink = step(l + (t - 0.5)*0.9, u_thr);',
      '  return mix(u_paper, u_ink, ink);',
      '}'
    ].join('\n')
  });

  /* ===================== SISTEMAS DE IMAGEM ===================== */

  D({
    id: 'pixelsort', name: 'Pixel sort', cat: 'glitch', color: '#ff2e63',
    desc: 'arrasta o pixel mais claro (ou escuro) da faixa',
    params: [
      { k: 'len', label: 'Alcance', min: 0, max: 1, def: 0.3 },
      { k: 'thr', label: 'Limiar', min: 0, max: 1, def: 0.55 },
      { k: 'dir', t: 's', label: 'Direção', def: 0, opts: ['Direita', 'Esquerda', 'Baixo', 'Cima'] },
      { k: 'pick', t: 's', label: 'Pegar', def: 1, opts: ['Mais claro', 'Mais escuro'] },
      { k: 'band', label: 'Faixas afetadas', min: 0, max: 1, def: 0.7 },
      { k: 'spd', label: 'Movimento', min: 0, max: 8, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 dir = (u_dir < 0.5) ? vec2(-1.0, 0.0) : (u_dir < 1.5) ? vec2(1.0, 0.0) : (u_dir < 2.5) ? vec2(0.0, -1.0) : vec2(0.0, 1.0);',
      '  float rowSeed = (abs(dir.x) > 0.5) ? floor(uv.y*uRes.y) : floor(uv.x*uRes.x);',
      '  float onRow = step(1.0 - u_band, hash21(vec2(rowSeed, floor(uTime*u_spd))));',
      '  vec3 here = srccol(uv);',
      '  float hl = luma(here);',
      '  float gate = (u_pick < 0.5) ? step(u_thr, hl) : step(hl, u_thr);',
      '  onRow *= gate;',
      '  vec3 best = here;',
      '  float bl = hl;',
      '  vec2 step_ = dir/uRes;',
      '  for(int i=1;i<=22;i++){',
      '    float f = float(i)/22.0;',
      '    vec2 p = uv + step_*f*u_len*uRes.y*0.5;',
      '    vec3 s = srccol(p);',
      '    float sl = luma(s);',
      '    bool take = (u_pick < 0.5) ? (sl > bl && sl > u_thr) : (sl < bl && sl < u_thr);',
      '    if(take){ best = s; bl = sl; }',
      '  }',
      '  return mix(srccol(uv), best, onRow);',
      '}'
    ].join('\n')
  });

  D({
    id: 'thermal', name: 'Térmico', cat: 'cor', color: '#ffb020',
    desc: 'mapa de calor de câmera infravermelha',
    params: [
      { k: 'gain', label: 'Ganho', min: 0.2, max: 3, def: 1.2 },
      { k: 'off', label: 'Deslocamento', min: -0.5, max: 0.5, def: 0 },
      { k: 'steps', label: 'Faixas', min: 0, max: 16, step: 1, def: 0 },
      { k: 'blur', label: 'Suavizar', min: 0, max: 4, def: 0.8 }
    ],
    glsl: [
      'vec3 heat(float t){',
      '  t = clamp(t, 0.0, 1.0);',
      '  vec3 a = mix(vec3(0.02,0.0,0.15), vec3(0.35,0.0,0.6), smoothstep(0.0,0.28,t));',
      '  vec3 b = mix(a, vec3(0.95,0.15,0.1), smoothstep(0.25,0.55,t));',
      '  vec3 c = mix(b, vec3(1.0,0.75,0.0), smoothstep(0.5,0.8,t));',
      '  return mix(c, vec3(1.0,1.0,0.92), smoothstep(0.78,1.0,t));',
      '}',
      'vec3 fx(vec2 uv){',
      '  float l = 0.0;',
      '  for(int i=0;i<5;i++){',
      '    float a = float(i)*1.2566;',
      '    l += luma(srccol(uv + vec2(cos(a), sin(a))*u_blur/uRes*3.0));',
      '  }',
      '  l /= 5.0;',
      '  l = clamp(l*u_gain + u_off, 0.0, 1.0);',
      '  if(u_steps > 0.5) l = floor(l*u_steps)/max(u_steps - 1.0, 1.0);',
      '  return heat(l);',
      '}'
    ].join('\n')
  });

  D({
    id: 'nightvision', name: 'Visão noturna', cat: 'cor', color: '#ffb020',
    desc: 'intensificador de imagem verde com ruído e vinheta',
    params: [
      { k: 'gain', label: 'Ganho', min: 0.5, max: 5, def: 2.2 },
      { k: 'noise', label: 'Ruído', min: 0, max: 1, def: 0.28 },
      { k: 'scan', label: 'Linhas', min: 0, max: 1, def: 0.25 },
      { k: 'vig', label: 'Vinheta', min: 0, max: 2, def: 1 },
      { k: 'bloom', label: 'Estouro', min: 0, max: 2, def: 0.6 },
      { k: 'tint', t: 'c', label: 'Cor', def: '#7dff9b' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float l = luma(srccol(uv))*u_gain;',
      '  float b = 0.0;',
      '  for(int i=0;i<8;i++){',
      '    float a = float(i)*0.7854;',
      '    b += luma(srccol(uv + vec2(cos(a), sin(a))*0.006));',
      '  }',
      '  l += (b/8.0)*u_bloom*0.6;',
      '  l += (hash21(uv*uRes + floor(uTime*30.0)*17.0)-0.5)*u_noise;',
      '  l *= 1.0 - u_scan*0.4*step(0.5, fract(uv.y*uRes.y*0.4));',
      '  vec2 d = uv-0.5; d.x *= uAspect;',
      '  l *= 1.0 - smoothstep(0.25, 0.72, length(d))*u_vig;',
      '  return u_tint*clamp(l, 0.0, 1.4);',
      '}'
    ].join('\n')
  });

  D({
    id: 'scanlines', name: 'Broadcast / Scanlines', cat: 'glitch', color: '#ff2e63',
    desc: 'varredura de tv com sincronismo e barra rolante',
    params: [
      { k: 'dens', label: 'Densidade', min: 0.1, max: 3, def: 1 },
      { k: 'depth', label: 'Profundidade', min: 0, max: 1, def: 0.45 },
      { k: 'roll', label: 'Barra rolante', min: 0, max: 1, def: 0.3 },
      { k: 'spd', label: 'Velocidade', min: 0, max: 3, def: 0.35 },
      { k: 'sync', label: 'Erro de sincronismo', min: 0, max: 1, def: 0.15 },
      { k: 'bright', label: 'Brilho', min: 0.2, max: 3, def: 1.15 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float band = fract(uv.y - uTime*u_spd*0.2);',
      '  float sync = (hash11(floor(uv.y*uRes.y*0.5) + floor(uTime*20.0))-0.5)*u_sync*0.02;',
      '  vec3 c = srccol(uv + vec2(sync, 0.0));',
      '  float sl = 0.5 + 0.5*sin(uv.y*uRes.y*3.14159*u_dens);',
      '  c *= 1.0 - u_depth*sl;',
      '  c += smoothstep(0.94, 1.0, band)*u_roll*0.22;',
      '  return c*u_bright;',
      '}'
    ].join('\n')
  });

  /* ===================== ESTILOS ADICIONAIS ===================== */
  VE.STYLES.push(
    {
      id: 'papel', name: 'Tinta sobre papel', desc: 'preto sobre off-white com grão',
      fx: [['color', { con: 0.35, sat: -1 }], ['paperink', { grain: 0.24, fiber: 0.18, con: 0.6 }]]
    },
    {
      id: 'azulimpresso', name: 'Impressão azul', desc: 'trama que funde numa tinta só',
      fx: [['color', { con: 0.3, sat: -1 }], ['blob', { size: 13, gain: 1.25, ink: '#1b4fd8' }]]
    },
    {
      id: 'asciialpha', name: 'ASCII recortado', desc: 'ascii preto com fundo transparente',
      fx: [
        ['color', { con: 0.4, sat: -1 }],
        ['ascii', { cell: 10, cmode: 0, fg: '#16150f', bg: '#ffffff', ar: 0.6, glow: 0 }],
        ['removewhite', { mode: 0, thr: 0.86, soft: 0.1 }]
      ]
    },
    {
      id: 'emojifoto', name: 'Foto de emoji', desc: 'a imagem remontada em emoji, escolhidos pela cor',
      fx: [
        ['color', { con: 0.12, sat: 0.2 }],
        ['emoji', { set: 0, cell: 16, esc: 1, vib: 0.2, dim: 0.75, bgsrc: 0.35 }]
      ]
    },
    {
      id: 'emojirecorte', name: 'Emoji recortado', desc: 'só os emoji, com fundo transparente',
      fx: [
        ['emoji', { set: 1, cell: 20, esc: 0.94, vib: 0.5, recorte: 1, bgsrc: 0, dim: 1 }]
      ]
    },
    {
      id: 'matricial', name: 'Matricial', desc: 'impressora de agulhas em papel',
      fx: [['color', { con: 0.3, sat: -1 }], ['dotmatrix', { size: 7, line: 0.6 }]]
    },
    {
      id: 'termico', name: 'Térmico', desc: 'câmera de calor com faixas',
      fx: [['thermal', { gain: 1.3, steps: 10 }], ['scanlines', { depth: 0.3, dens: 1.2 }]]
    },
    {
      id: 'noturno', name: 'Visão noturna', desc: 'intensificador verde granulado',
      fx: [['nightvision', { gain: 2.4, noise: 0.3 }], ['crt', { curve: 0.5, scan: 0.3, vig: 0.5, bright: 1.1 }]]
    }
  );

  /* nomes das categorias novas */
  VE.CATS.push(
    { id: 'impressao', label: 'impressão', color: '#1b4fd8' },
    { id: 'alpha', label: 'alpha', color: '#d0271b' }
  );

})(window.VE);
