/* ============================================================
   rgb_lab — efeitos parte 4
   Família construída a partir das referências da pasta EFEITOS:
   brinquedo, gravura, cianotipia, fotocópia, paleta retrô,
   pintura, brilho anamórfico, monocromo neon, tv 80, fumaça,
   desfoques e arte generativa.
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  /* ===================== BRINQUEDO ===================== */

  D({
    id: 'lego', name: 'Blocos de brinquedo', cat: 'impressao', color: '#e2670f',
    desc: 'peças encaixadas com pino e relevo',
    params: [
      { k: 'size', label: 'Tamanho da peça', min: 4, max: 90, step: 1, def: 18 },
      { k: 'stud', label: 'Pino', min: 0.05, max: 0.95, def: 0.52 },
      { k: 'relief', label: 'Relevo', min: 0, max: 2, def: 1 },
      { k: 'bevel', label: 'Bisel', min: 0.01, max: 0.5, step: 0.01, def: 0.16 },
      { k: 'gap', label: 'Vala entre peças', min: 0, max: 1, def: 0.45 },
      { k: 'quant', label: 'Níveis de cor', min: 0, max: 16, step: 1, def: 6 },
      { k: 'sat', label: 'Saturação', min: -1, max: 2, def: 0.35 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float s = max(u_size, 4.0);',
      '  vec2 cell = vec2(s)/uRes;',
      '  vec2 idx = floor(uv/cell);',
      '  vec2 f = fract(uv/cell);',
      '  vec3 c = srccol((idx+0.5)*cell);',
      '  float lm = luma(c); c = mix(vec3(lm), c, 1.0 + u_sat);',
      '  if(u_quant > 1.5){ float n = max(u_quant, 2.0); c = floor(clamp(c,0.0,0.999)*n)/(n-1.0); }',
      '  c = clamp(c, 0.0, 1.0);',
      '  vec2 p = f - 0.5;',
      '  float ex = max(abs(p.x), abs(p.y))*2.0;',
      '  float side = clamp((p.y - p.x)*1.6, -1.0, 1.0);',
      '  float bev = smoothstep(1.0, 1.0 - u_bevel, ex);',
      '  vec3 col = c*mix(1.0 - 0.28*side*u_relief, 1.0, bev);',
      '  col *= mix(1.0 - u_gap*0.55, 1.0, smoothstep(1.0, 0.94, ex));',
      '  float d = length(p)*2.0;',
      '  float r = clamp(u_stud, 0.05, 0.95);',
      '  float inStud = 1.0 - smoothstep(r, r + 0.06, d);',
      '  float ang = atan(p.y, p.x);',
      '  float top = 0.5 + 0.5*sin(ang + 2.356);',
      '  vec3 sc = c*(0.80 + 0.45*top*u_relief);',
      '  sc *= 1.0 + 0.16*(1.0 - d/max(r,0.05))*u_relief;',
      '  col = mix(col, sc, inStud);',
      '  float ring = smoothstep(r + 0.03, r, d) - smoothstep(r, r - 0.06, d);',
      '  col *= 1.0 - ring*0.3*u_relief;',
      '  return col;',
      '}'
    ].join('\n')
  });

  /* ===================== GRAVURA ===================== */
  /* A gravura de dois tons: uma ESPIRAL, LINHAS paralelas ou uma retícula
     de PONTOS cuja espessura (ou tamanho) segue a sombra da imagem — o que
     a Spiral Betty faz numa foto, aqui feito quadro a quadro, por pixel.
     As contas são as dela, lidas do próprio código (14/09/2026):
     · o escuro de um pixel: claridade (mistura com branco ou preto) →
       contraste (259(k+255)/(255(259−k))) → luma 0,30/0,59/0,11 → 1 − luma;
     · LINHAS: passo = lado/linhas; a meia-largura de cada lado da linha vai
       de 0,165 a 0,835 do meio-passo, amostrada 0,25 meio-passo para
       aquele lado (a linha engorda para o lado em que a imagem é escura);
     · ESPIRAL: raio = lado/2, passo = raio/(voltas+1), espiral de
       Arquimedes r = passo·θ/2π, começa em π/12 e dá 'voltas' voltas menos
       0,35 (1,5× mais quando não fica contida no disco); meia-espessura
       de cada lado = max(escuro·0,42·passo, 0,07·passo), amostrada 0,105
       passo para aquele lado;
     · PONTOS: malha hexagonal com passo = lado/(pontos+0,25) e linhas a
       passo·√3/2; o escuro do ponto é o centro (peso 4) mais quatro
       vizinhos a 0,65 do meio-passo; raio = meio-passo·(mín + escuro·(máx − mín)).
     O lado é o menor lado do quadro; o padrão cobre o quadro inteiro (o
     site recorta a foto num quadrado). As paletas são as dela, com nomes
     do laboratório; 'Para colorir' desenha só o contorno. A HACHURA
     CRUZADA de antes ficou como o quarto desenho.                        */

  var PALETAS_GRAVURA = [
    ['Ciano e ameixa', '#00e5c8', '#851f73'], ['Preto no branco', '#ffffff', '#000000'], ['Para colorir', '#ffffff', '#bbbbbb'],
    ['Amarelo e azul', '#ffd800', '#0055c5'], ['Palha e roxo', '#f3dd6d', '#810065'], ['Areia e carvão', '#d7c9b8', '#3d3536'],
    ['Ciano e anil', '#00fcff', '#0028e6'], ['Coral e marinho', '#ff4137', '#1c3c63'], ['Água e vinho', '#88dbdf', '#981012'],
    ['Limão e verde', '#fef08d', '#037a44'], ['Menta e marinho', '#43fd90', '#05407a'], ['Amarelo e rosa', '#fff809', '#dc51d2'],
    ['Verde-água e ameixa', '#90d3ca', '#513750'], ['Laranja e marinho', '#ff6436', '#1e3265'], ['Água e vermelho', '#9defe1', '#e72b3c'],
    ['Framboesa e marinho', '#f03061', '#2e3060'], ['Amarelo e violeta', '#fff639', '#4a1bcd'], ['Rosa e azul', '#f5ccd3', '#4539e5'],
    ['Verde e preto', '#71f85b', '#000000'], ['Cinza e chumbo', '#bcc3c4', '#43455a'], ['Gelo e preto', '#98f9ff', '#000000'],
    ['Salmão e magenta', '#f46864', '#a40360'], ['Turquesa e roxo', '#2dd9e7', '#900cb8'], ['Rosa-velho e ardósia', '#db9692', '#314454'],
    ['Ouro e preto', '#fbdc60', '#000000'], ['Branco e verde-mar', '#ffffff', '#48a9a8'], ['Azul-céu e vinho', '#4c9cfe', '#602237'],
    ['Céu e anil', '#50c7e6', '#110151'], ['Lilás e azul', '#e5ccfb', '#5630f9'], ['Lima e azul', '#c8e210', '#5392d9'],
    ['Verde e violeta', '#14ea66', '#6715e8'], ['Personalizada', null, null]
  ];
  function hex3(h) { return 'vec3(' + [1, 3, 5].map(function (i) { return (parseInt(h.substr(i, 2), 16) / 255).toFixed(4); }).join(',') + ')'; }
  var GL_PALETAS = ['void paletaGravura(int i, out vec3 papel, out vec3 tinta){', '  papel = u_paper; tinta = u_ink;']
    .concat(PALETAS_GRAVURA.filter(function (p) { return p[1]; }).map(function (p, i) {
      return '  if(i == ' + i + '){ papel = ' + hex3(p[1]) + '; tinta = ' + hex3(p[2]) + '; }';
    })).concat(['}']).join('\n');

  D({
    id: 'engrave', name: 'Gravura / Hachura', cat: 'impressao', color: '#1b4fd8',
    desc: 'espiral, linhas ou pontos que engrossam na sombra — a gravura de dois tons',
    params: [
      { k: 'modo', t: 's', label: 'Desenho', def: 0, opts: ['Linhas', 'Espiral', 'Pontos', 'Hachura cruzada'] },
      { k: 'linhas', label: 'Linhas · quantas', min: 7, max: 121, step: 2, def: 49 },
      { k: 'ang', label: 'Linhas · ângulo', min: 0, max: 180, step: 5, def: 30 },
      { k: 'voltas', label: 'Espiral · voltas', min: 8, max: 64, step: 2, def: 32 },
      { k: 'conter', t: 'b', label: 'Espiral · contida no disco', def: 1 },
      { k: 'pagina', t: 'b', label: 'Espiral · página branca em volta', def: 1 },
      { k: 'pontos', label: 'Pontos · quantos', min: 13, max: 105, step: 4, def: 57 },
      { k: 'pontoMin', label: 'Pontos · menor', min: 0, max: 1, step: 0.01, def: 0.4 },
      { k: 'pontoMax', label: 'Pontos · maior', min: 0, max: 1, step: 0.01, def: 0.9 },
      { k: 'forma', t: 's', label: 'Pontos · forma', def: 0, opts: ['Círculo', 'Coração', 'Triângulo', 'Faísca', 'Estrela', 'Quadrado', 'Confete'] },
      /* a largura de uma haste segue a imagem ponto a ponto; numa fonte de
         borda dura ela salta em degrau. Com suavidade, o escuro é a média
         AO LONGO da haste (ou do braço da espiral, ou em volta do ponto)
         numa janela de até um quarto do lado — a haste vira um fuso      */
      { k: 'suave', label: 'Hastes suaves (fuso)', min: 0, max: 1, step: 0.01, def: 0 },
      { k: 'claridade', label: 'Claridade', min: -50, max: 50, step: 1, def: 0 },
      { k: 'contraste', label: 'Contraste', min: -100, max: 100, step: 1, def: 0 },
      { k: 'inverter', t: 'b', label: 'Inverter', def: 0 },
      { k: 'paleta', t: 's', label: 'Paleta', def: 0, opts: PALETAS_GRAVURA.map(function (p) { return p[0]; }) },
      { k: 'ink', t: 'c', label: 'Tinta (personalizada)', def: '#1c3f5e' },
      { k: 'paper', t: 'c', label: 'Papel (personalizado)', def: '#dfeaee' },
      /* a hachura cruzada de antes, intacta */
      { k: 'pitch', label: 'Hachura · espaçamento', min: 2, max: 40, step: 0.5, def: 7 },
      { k: 'weight', label: 'Hachura · espessura', min: 0.1, max: 2.5, def: 1.15 },
      { k: 'cross', t: 'b', label: 'Hachura · cruzada', def: 1 },
      { k: 'crossAng', label: 'Hachura · ângulo do cruzamento', min: 10, max: 170, step: 1, def: 90 },
      { k: 'crossThr', label: 'Hachura · limiar do cruzamento', min: 0, max: 1, def: 0.42 },
      { k: 'warp', label: 'Hachura · ondulação', min: 0, max: 2, def: 0.55 },
      { k: 'warpScale', label: 'Hachura · escala da ondulação', min: 0.5, max: 20, step: 0.5, def: 5 },
      { k: 'black', label: 'Hachura · ponto preto', min: 0, max: 1, def: 0.05 },
      { k: 'white', label: 'Hachura · ponto branco', min: 0, max: 1.5, def: 0.95 },
      { k: 'gamma', label: 'Hachura · gama', min: 0.2, max: 3, def: 1 }
    ],
    glsl: [
      GL_PALETAS,
      /* o escuro de um pixel, na conta da referência */
      'float escuroGrav(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float t = u_claridade/100.0;',
      '  c = mix(c, vec3(t < 0.0 ? 0.0 : 1.0), abs(t));',
      '  float k = clamp(u_contraste, -100.0, 100.0);',
      '  float fc = 259.0*(k + 255.0)/(255.0*(259.0 - k));',
      '  c = clamp((c - 0.5)*fc + 0.5, 0.0, 1.0);',
      '  float d = 1.0 - dot(c, vec3(0.30, 0.59, 0.11));',
      '  return u_inverter > 0.5 ? 1.0 - d : d;',
      '}',
      /* a distância assinada (px, negativo = dentro) até a borda de um ponto
         de raio r, na forma pedida; as formas polares usam raio − R(φ)   */
      'float estrelaR(float phi, float r, float ri, float n, float fase){',
      '  float b = PI/n;',
      '  float a = phi - fase; a = a - floor(a/(2.0*b))*(2.0*b); a = b - abs(a - b);',   /* 0..b, do vértice de fora */
      '  return r*ri*sin(b)/max(ri*sin(b - a) + r*sin(a), 1e-4);',
      '}',
      /* o escuro médio ao longo de uma direção (px), em ±L, com peso de
         cosseno levantado — é o que faz a haste virar um fuso            */
      'float escuroAoLongo(vec2 q, vec2 dir, float L){',
      '  if(L < 0.5) return escuroGrav(q/uRes);',
      '  float soma = 0.0, peso = 0.0;',
      '  for(int i = -6; i <= 6; i++){',
      '    float t = float(i)/6.0;',
      '    float w = 0.5 + 0.5*cos(PI*t);',
      '    soma += w*escuroGrav((q + dir*(t*L))/uRes); peso += w;',
      '  }',
      '  return soma/peso;',
      '}',
      'float formaSD(vec2 rel, float r, int forma, vec2 semente){',
      '  if(forma == 6){',                              /* confete: forma e giro sorteados por ponto */
      '    float h = hash21(semente*0.173 + 3.1);',
      '    forma = int(floor(h*6.0));',
      '    float g = hash21(semente*0.371 + 7.7)*6.2832;',
      '    rel = vec2(cos(g)*rel.x - sin(g)*rel.y, sin(g)*rel.x + cos(g)*rel.y);',
      '  }',
      '  float d = length(rel);',
      '  if(forma == 0) return d - r;',
      '  float phi = (d > 1e-4) ? atan(rel.y, rel.x) : 0.0;',
      '  if(forma == 1){',                              /* coração: (x²+y²−1)³ − x²y³ */
      '    vec2 q = rel/max(r*0.92, 1e-3); q.y += 0.12;',
      '    float e = q.x*q.x + q.y*q.y - 1.0; float f = e*e*e - q.x*q.x*q.y*q.y*q.y;',
      /* o gradiente analítico (dFdx/dFdy salpicava a fronteira entre células) */
      '    vec2 gr = vec2(6.0*e*e*q.x - 2.0*q.x*q.y*q.y*q.y, 6.0*e*e*q.y - 3.0*q.x*q.x*q.y*q.y);',
      '    return f/max(length(gr), 1e-4)*(r*0.92);',
      '  }',
      '  if(forma == 2) return d - estrelaR(phi, r, r*0.5, 3.0, PI*0.5);',        /* triângulo: polígono de 3 (r interno = r·cos60°) */
      '  if(forma == 3){ float cc = abs(cos(2.0*phi)); return d - r*mix(0.22, 1.0, cc*cc*cc); }', /* faísca: quatro pontas côncavas */
      '  if(forma == 4) return d - estrelaR(phi, r, r*0.5, 5.0, PI*0.5);',        /* estrela de cinco pontas */
      '  return max(abs(rel.x), abs(rel.y)) - r*0.82;',                            /* quadrado */
      '}',
      'vec3 fx(vec2 uv){',
      '  vec2 px = uv*uRes;',
      '  float S = min(uRes.x, uRes.y);',
      '  vec2 cen = uRes*0.5;',
      '  vec2 p = px - cen;',
      '  int modo = int(u_modo + 0.5);',
      '  float sd = 1e5;',
      '  bool pagina = false;',
      '  if(modo == 0){',                                                 /* LINHAS */
      '    float a = radians(u_ang);',
      '    vec2 perp = vec2(-sin(a), cos(a));',
      '    float H = S/max(u_linhas, 1.0), G = H*0.5;',
      '    float c = dot(p, perp);',
      '    float d = c - floor(c/H + 0.5)*H;',
      '    float lado = d < 0.0 ? -1.0 : 1.0;',
      '    vec2 q = px - (d - lado*0.25*G)*perp;',
      '    float k = escuroAoLongo(q, vec2(cos(a), sin(a)), u_suave*S*0.25);',
      '    float meia = G*(0.165 + 0.67*k);',
      '    sd = abs(d) - meia;',
      '  } else if(modo == 1){',                                          /* ESPIRAL */
      '    float B = S*0.5;',
      '    float D = B/(max(u_voltas, 1.0) + 1.0), I = D/(2.0*PI);',
      '    float r = length(p);',
      '    float phi = (r > 1e-4) ? atan(p.y, p.x) : 0.0; if(phi < 0.0) phi += 2.0*PI;',
      '    float kk = floor((r/I - phi)/(2.0*PI) + 0.5);',
      '    float th = phi + 2.0*PI*kk;',
      '    float delta = r - I*th;',
      '    float w = u_voltas*(u_conter > 0.5 ? 1.0 : 1.5)*2.0*PI - PI*0.7;',
      '    float O = D*0.42, U = O*0.25;',
      '    vec2 dir = vec2(cos(phi), sin(phi));',
      '    float rl = I*th + (delta > 0.0 ? U : -U);',
      '    float k;',
      '    float L = u_suave*S*0.25;',
      '    if(L < 0.5) k = escuroGrav((cen + dir*rl)/uRes);',
      '    else {',                                                     /* pelo arco: dθ = t/r */
      '      float soma = 0.0, peso = 0.0;',
      '      for(int i = -6; i <= 6; i++){',
      '        float t = float(i)/6.0, w = 0.5 + 0.5*cos(PI*t);',
      '        float thi = th + clamp(t*L/max(rl, 1.0), -PI, PI);',
      '        vec2 qi = cen + vec2(cos(thi), sin(thi))*(I*thi + (delta > 0.0 ? U : -U));',
      '        soma += w*escuroGrav(qi/uRes); peso += w;',
      '      }',
      '      k = soma/peso;',
      '    }',
      '    float meia = max(k*O, O/6.0);',
      '    sd = abs(delta) - meia;',
      '    if(th < PI/12.0 || th > w) sd = 1e5;',
      '    if(u_conter > 0.5 && r > B*1.02) pagina = true;',
      '  } else if(modo == 2){',                                          /* PONTOS */
      '    float T = S/(max(u_pontos, 1.0) + 0.25), k2 = T*0.5, R = k2*1.7320508;',
      '    float jc = floor(p.y/R + 0.5);',
      '    float melhor = 1e9; vec2 bc = vec2(0.0);',
      '    for(int dj = -1; dj <= 1; dj++){',
      '      float j = jc + float(dj);',
      '      float par = j - 2.0*floor(j*0.5);',                          /* 0 ou 1, sem mod() */
      '      float off = par*0.5*T;',
      '      float i = floor((p.x - off)/T + 0.5);',
      '      vec2 c = vec2(i*T + off, j*R);',
      '      float dd = length(p - c);',
      '      if(dd < melhor){ melhor = dd; bc = c; }',
      '    }',
      '    vec2 cpx = cen + bc;',
      '    float Bm = 0.65*k2;',
      '    float kc = escuroGrav(cpx/uRes);',
      '    float ks = escuroGrav((cpx + vec2(Bm, 0.0))/uRes) + escuroGrav((cpx - vec2(Bm, 0.0))/uRes) + escuroGrav((cpx + vec2(0.0, Bm))/uRes) + escuroGrav((cpx - vec2(0.0, Bm))/uRes);',
      '    float k = (4.0*kc + ks)/8.0;',
      '    float Lp = u_suave*S*0.125;',
      '    if(Lp > 0.5){',                                              /* doze toques em dois anéis: o tamanho muda devagar entre pontos vizinhos */
      '      float soma = 2.0*k, peso = 2.0;',
      '      for(int i = 0; i < 6; i++){',
      '        float an = float(i)*1.0471976;',
      '        vec2 dv = vec2(cos(an), sin(an));',
      '        soma += escuroGrav((cpx + dv*Lp*0.5)/uRes) + escuroGrav((cpx + dv*Lp)/uRes); peso += 2.0;',
      '      }',
      '      k = soma/peso;',
      '    }',
      '    float mn = min(u_pontoMin, u_pontoMax), mx = max(u_pontoMin, u_pontoMax);',
      '    float rr = k2*(mn + k*(mx - mn));',
      '    sd = formaSD(p - bc, rr, int(u_forma + 0.5), bc);',
      '  } else {',                                                       /* HACHURA CRUZADA (a de antes) */
      '    float l = luma(srccol(uv));',
      '    l = clamp((l - u_black)/max(u_white - u_black, 0.02), 0.0, 1.0);',
      '    l = pow(l, max(u_gamma, 0.05));',
      '    float wob = (fbm(uv*u_warpScale) - 0.5)*u_warp*38.0;',
      '    float pitch = max(u_pitch, 2.0);',
      '    float c1 = rot2(px, radians(u_ang)).y + wob;',
      '    float t1 = abs(fract(c1/pitch) - 0.5)*2.0;',
      '    float ink = step(t1, (1.0 - l)*u_weight);',
      '    if(u_cross > 0.5){',
      '      float c2 = rot2(px, radians(u_ang + u_crossAng)).y + wob*0.7;',
      '      float t2 = abs(fract(c2/pitch) - 0.5)*2.0;',
      '      ink = max(ink, step(t2, max(0.0, (1.0 - l)*u_weight - u_crossThr)));',
      '    }',
      '    sd = ink > 0.5 ? -1.0 : 1.0;',
      '  }',
      '  vec3 papel, tinta;',
      '  int ip = int(u_paleta + 0.5);',
      '  paletaGravura(ip, papel, tinta);',
      '  float cob = 1.0 - smoothstep(-0.7, 0.7, sd);',
      '  vec3 col;',
      '  if(ip == 2){',                                                   /* para colorir: contorno cinza, miolo quase branco */
      '    float borda = clamp(cob - (1.0 - smoothstep(-0.7, 0.7, sd + 1.6)), 0.0, 1.0);',
      '    col = mix(papel, vec3(0.945), cob);',
      '    col = mix(col, tinta, borda);',
      '  } else col = mix(papel, tinta, cob);',
      '  if(pagina && u_pagina > 0.5) col = vec3(1.0);',
      '  return col;',
      '}'
    ].join('\n')
  });

  /* ===================== CIANOTIPIA ===================== */

  D({
    id: 'cyanotype', name: 'Cianotipia', cat: 'cor', color: '#1b4fd8',
    desc: 'papel sensibilizado — azul, verde, roxo ou sépia',
    params: [
      { k: 'tone', t: 's', label: 'Tom', def: 0, opts: ['Azul (clássico)', 'Verde', 'Roxo', 'Sépia', 'Vermelho', 'Personalizado'] },
      { k: 'inv', t: 'b', label: 'Inverter (negativo)', def: 0 },
      { k: 'black', label: 'Ponto preto', min: 0, max: 1, def: 0.06 },
      { k: 'white', label: 'Ponto branco', min: 0, max: 1.5, def: 0.94 },
      { k: 'gamma', label: 'Gama', min: 0.2, max: 3, def: 1.15 },
      { k: 'midAmt', label: 'Peso do meio-tom', min: 0, max: 1, def: 0.45 },
      { k: 'grain', label: 'Grão', min: 0, max: 1, def: 0.18 },
      { k: 'stain', label: 'Manchas', min: 0, max: 1, def: 0.3 },
      { k: 'stainScale', label: 'Escala das manchas', min: 0.5, max: 20, step: 0.5, def: 3.5 },
      { k: 'border', label: 'Borda de pincel', min: 0, max: 0.4, step: 0.005, def: 0.06 },
      { k: 'dark', t: 'c', label: 'Sombra (personalizado)', def: '#0b2f5c' },
      { k: 'mid', t: 'c', label: 'Meio (personalizado)', def: '#2f6fae' },
      { k: 'light', t: 'c', label: 'Papel (personalizado)', def: '#e3ecf2' }
    ],
    glsl: [
      'void toneOf(float t, out vec3 dk, out vec3 md, out vec3 lt){',
      '  if(t < 0.5)      { dk = vec3(0.043,0.184,0.361); md = vec3(0.184,0.435,0.682); lt = vec3(0.890,0.925,0.949); }',
      '  else if(t < 1.5) { dk = vec3(0.031,0.220,0.145); md = vec3(0.184,0.490,0.310); lt = vec3(0.902,0.937,0.886); }',
      '  else if(t < 2.5) { dk = vec3(0.145,0.055,0.267); md = vec3(0.420,0.247,0.627); lt = vec3(0.933,0.902,0.949); }',
      '  else if(t < 3.5) { dk = vec3(0.180,0.106,0.043); md = vec3(0.545,0.376,0.180); lt = vec3(0.949,0.925,0.867); }',
      '  else             { dk = vec3(0.243,0.031,0.055); md = vec3(0.678,0.176,0.157); lt = vec3(0.957,0.906,0.890); }',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 dk, md, lt;',
      '  if(u_tone > 4.5){ dk = u_dark; md = u_mid; lt = u_light; }',
      '  else toneOf(u_tone, dk, md, lt);',
      '  float l = luma(srccol(uv));',
      '  l = clamp((l - u_black)/max(u_white - u_black, 0.02), 0.0, 1.0);',
      '  l = pow(l, max(u_gamma, 0.05));',
      '  if(u_inv > 0.5) l = 1.0 - l;',
      '  float t = smoothstep(0.0, 1.0, l);',
      '  vec3 col = mix(dk, lt, t);',
      '  col = mix(col, md, (1.0 - abs(t*2.0 - 1.0))*u_midAmt);',
      '  col += (hash21(uv*uRes*0.85 + floor(uTime*14.0)) - 0.5)*u_grain*0.55;',
      '  col += (fbm(uv*u_stainScale) - 0.5)*u_stain*0.35;',
      '  if(u_border > 0.001){',
      '    vec2 e = min(uv, 1.0 - uv);',
      '    float edge = min(e.x, e.y) + (fbm(uv*26.0) - 0.5)*u_border*0.8;',
      '    col = mix(lt, col, smoothstep(0.0, u_border, edge));',
      '  }',
      '  return col;',
      '}'
    ].join('\n')
  });

  /* ===================== DESFOQUES ===================== */

  D({
    id: 'gauss', name: 'Desfoque gaussiano', cat: 'luz', color: '#ffe066',
    desc: 'borrão suave de verdade, com raio grande',
    params: [
      { k: 'rad', label: 'Raio (px)', min: 0, max: 60, step: 0.5, def: 6 },
      { k: 'mixv', label: 'Mistura', min: 0, max: 1, def: 1 },
      { k: 'bright', label: 'Ganho', min: 0.2, max: 3, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 t = u_rad/uRes/3.0;',
      '  vec3 sum = vec3(0.0); float w = 0.0;',
      '  for(int j=-3;j<=3;j++){',
      '    for(int i=-3;i<=3;i++){',
      '      vec2 o = vec2(float(i), float(j));',
      '      float g = exp(-dot(o,o)/8.0);',
      '      sum += srccol(uv + o*t)*g; w += g;',
      '    }',
      '  }',
      '  return mix(srccol(uv), sum/w*u_bright, u_mixv);',
      '}'
    ].join('\n')
  });

  D({
    id: 'motionblur', name: 'Desfoque de movimento', cat: 'tempo', color: '#00e5ff',
    desc: 'arrasto direcional com brilho — cinema motion',
    params: [
      { k: 'len', label: 'Comprimento', min: 0, max: 2, def: 0.35 },
      { k: 'ang', label: 'Ângulo', min: 0, max: 360, step: 1, def: 0 },
      { k: 'center', label: 'Centro do rastro', min: 0, max: 1, def: 0.5 },
      { k: 'fall', label: 'Decaimento', min: 0, max: 1, def: 0.35 },
      { k: 'glow', label: 'Brilho do rastro', min: 0, max: 3, def: 0.4 },
      { k: 'thr', label: 'Limiar do brilho', min: 0, max: 1, def: 0.6 },
      { k: 'ramp', label: 'Transição (rampa)', min: 0, max: 1, def: 0 },
      { k: 'rampPos', label: 'Posição da rampa', min: 0, max: 1, def: 0.5 },
      { k: 'mixv', label: 'Mistura', min: 0, max: 1, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float a = radians(u_ang);',
      '  vec2 dir = vec2(cos(a), sin(a))*u_len*0.5*vec2(1.0/uAspect, 1.0);',
      '  vec3 acc = vec3(0.0); float w = 0.0;',
      '  for(int i=0;i<28;i++){',
      '    float f = float(i)/27.0 - u_center;',
      '    vec3 s = srccol(uv + dir*f);',
      '    s += max(s - u_thr, 0.0)*u_glow;',
      '    float we = pow(max(1.0 - abs(f)*2.0*u_fall, 0.02), 2.0);',
      '    acc += s*we; w += we;',
      '  }',
      '  vec3 b = acc/max(w, 0.0001);',
      '  float m = 1.0;',
      '  if(u_ramp > 0.001) m = smoothstep(u_rampPos - u_ramp*0.5, u_rampPos + u_ramp*0.5, uv.x);',
      '  return mix(srccol(uv), b, clamp(u_mixv*m, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  D({
    id: 'smoke', name: 'Fumaça / Dissolução', cat: 'tempo', color: '#00e5ff',
    desc: 'a imagem se desfaz em correnteza — usa o frame anterior',
    params: [
      { k: 'amt', label: 'Quantidade', min: 0, max: 1, def: 0.82 },
      { k: 'len', label: 'Arrasto', min: 0, max: 3, def: 1 },
      { k: 'ang', label: 'Direção (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'push', label: 'Empurrão na direção', min: 0, max: 2, def: 0.5 },
      { k: 'turb', label: 'Turbulência', min: 0, max: 4, def: 1.6 },
      { k: 'scale', label: 'Escala do ruído', min: 0.5, max: 20, step: 0.5, def: 3 },
      { k: 'spd', label: 'Velocidade', min: 0, max: 4, def: 0.5 },
      { k: 'decay', label: 'Persistência', min: 0, max: 1, def: 0.97 },
      { k: 'thr', label: 'Limiar de brilho', min: 0, max: 1, def: 0.35 },
      { k: 'edge', label: 'Só nas áreas claras', min: 0, max: 1, def: 0.4 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float t = uTime*u_spd;',
      '  vec2 flow = vec2(fbm(uv*u_scale + vec2(t*0.3, 0.0)) - 0.5,',
      '                   fbm(uv*u_scale + vec2(0.0, t*0.25) + 11.3) - 0.5);',
      '  float a = radians(u_ang);',
      '  vec2 off = (vec2(cos(a), sin(a))*u_push + flow*u_turb)*u_len*0.03;',
      '  vec3 prev = texture(uPrev, clamp(uv - off, 0.0, 1.0)).rgb*u_decay;',
      '  vec3 cur = srccol(uv);',
      '  float keep = smoothstep(u_thr, u_thr + 0.3, luma(cur));',
      '  return mix(cur, prev, clamp(mix(u_amt, u_amt*keep, u_edge), 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  /* ===================== FOTOCÓPIA ===================== */

  D({
    id: 'xerox', name: 'Fotocópia / Scanner', cat: 'impressao', color: '#16150f',
    desc: 'toner, faixas arrastadas, poeira e risco',
    params: [
      { k: 'con', label: 'Contraste', min: 0, max: 4, def: 1.4 },
      { k: 'black', label: 'Ponto preto', min: 0, max: 1, def: 0.28 },
      { k: 'white', label: 'Ponto branco', min: 0, max: 1.5, def: 0.78 },
      { k: 'gamma', label: 'Gama', min: 0.2, max: 3, def: 1 },
      { k: 'bands', label: 'Nº de faixas', min: 2, max: 120, step: 1, def: 26 },
      { k: 'glitch', label: 'Faixas com falha', min: 0, max: 1, def: 0.35 },
      { k: 'slip', label: 'Deslize da faixa', min: 0, max: 2, def: 0.5 },
      { k: 'smear', label: 'Esticar a linha', min: 0, max: 1, def: 0.55 },
      { k: 'lines', label: 'Resolução do esticado', min: 4, max: 400, step: 1, def: 60 },
      { k: 'rate', label: 'Velocidade da falha', min: 0, max: 20, step: 0.5, def: 3 },
      { k: 'grain', label: 'Grão de toner', min: 0, max: 1, def: 0.3 },
      { k: 'dirt', label: 'Poeira e riscos', min: 0, max: 1, def: 0.35 },
      { k: 'ink', t: 'c', label: 'Tinta', def: '#141412' },
      { k: 'paper', t: 'c', label: 'Papel', def: '#f2f0ea' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float band = floor(uv.x*max(u_bands, 2.0));',
      '  float r = hash21(vec2(band, floor(uTime*u_rate)));',
      '  float on = step(1.0 - u_glitch, r);',
      '  vec2 p = uv + vec2(0.0, (r - 0.5)*u_slip*on*0.08);',
      '  if(on > 0.5 && u_smear > 0.001){',
      '    float n = max(u_lines, 4.0);',
      '    p.y = mix(p.y, (floor(p.y*n) + 0.5)/n, u_smear);',
      '  }',
      '  float l = luma(srccol(p));',
      '  l = clamp((l - u_black)/max(u_white - u_black, 0.02), 0.0, 1.0);',
      '  l = pow(l, max(u_gamma, 0.05));',
      '  l = clamp((l - 0.5)*(1.0 + u_con) + 0.5, 0.0, 1.0);',
      '  float fr = floor(uTime*20.0);',
      '  l += (hash21(uv*uRes*1.3 + fr*7.7) - 0.5)*u_grain;',
      '  l -= step(0.9986, hash21(floor(uv*uRes/2.0) + fr*31.0))*u_dirt;',
      '  l += step(0.9975, hash11(floor(uv.x*uRes.x*0.6) + floor(uTime*3.0)*17.0))*u_dirt*0.9;',
      '  return mix(u_ink, u_paper, clamp(l, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  /* ===================== PALETA RETRÔ ===================== */

  D({
    id: 'palette', name: 'Paleta retrô', cat: 'cor', color: '#ffb020',
    desc: 'quantiza para paletas de console e impressão',
    params: [
      { k: 'set', t: 's', label: 'Paleta', def: 0, opts: ['Game Boy', 'CGA', 'NES', 'Comodoro', 'Sépia', '1-bit', 'Neon', 'Papel'] },
      { k: 'px', label: 'Pixel', min: 1, max: 40, step: 1, def: 4 },
      { k: 'dither', label: 'Dither', min: 0, max: 1, def: 0.45 },
      { k: 'bright', label: 'Brilho', min: -0.5, max: 0.5, def: 0 },
      { k: 'con', label: 'Contraste', min: -1, max: 2, def: 0.2 }
    ],
    glsl: [
      'const float BM4[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);',
      'int palN(float s){',
      '  if(s < 0.5) return 4; if(s < 1.5) return 4; if(s < 2.5) return 8;',
      '  if(s < 3.5) return 8; if(s < 4.5) return 5; if(s < 5.5) return 2;',
      '  if(s < 6.5) return 6; return 5;',
      '}',
      'vec3 palC(float s, int i){',
      '  if(s < 0.5){',
      '    if(i==0) return vec3(0.059,0.220,0.059); if(i==1) return vec3(0.188,0.384,0.188);',
      '    if(i==2) return vec3(0.549,0.667,0.059); return vec3(0.608,0.737,0.059);',
      '  }',
      '  if(s < 1.5){',
      '    if(i==0) return vec3(0.0); if(i==1) return vec3(0.0,0.667,0.667);',
      '    if(i==2) return vec3(0.667,0.0,0.667); return vec3(1.0);',
      '  }',
      '  if(s < 2.5){',
      '    if(i==0) return vec3(0.05); if(i==1) return vec3(0.0,0.184,0.667);',
      '    if(i==2) return vec3(0.0,0.478,0.322); if(i==3) return vec3(0.667,0.0,0.129);',
      '    if(i==4) return vec3(0.902,0.494,0.0); if(i==5) return vec3(0.976,0.827,0.286);',
      '    if(i==6) return vec3(0.353,0.706,0.902); return vec3(0.96);',
      '  }',
      '  if(s < 3.5){',
      '    if(i==0) return vec3(0.0); if(i==1) return vec3(0.408,0.220,0.169);',
      '    if(i==2) return vec3(0.435,0.298,0.616); if(i==3) return vec3(0.404,0.647,0.412);',
      '    if(i==4) return vec3(0.753,0.702,0.427); if(i==5) return vec3(0.612,0.780,0.827);',
      '    if(i==6) return vec3(0.867,0.678,0.686); return vec3(1.0);',
      '  }',
      '  if(s < 4.5){',
      '    if(i==0) return vec3(0.129,0.086,0.055); if(i==1) return vec3(0.325,0.220,0.129);',
      '    if(i==2) return vec3(0.561,0.412,0.255); if(i==3) return vec3(0.788,0.667,0.482);',
      '    return vec3(0.945,0.902,0.812);',
      '  }',
      '  if(s < 5.5){ if(i==0) return vec3(0.086,0.082,0.059); return vec3(0.937,0.925,0.894); }',
      '  if(s < 6.5){',
      '    if(i==0) return vec3(0.043,0.020,0.106); if(i==1) return vec3(0.106,0.063,0.400);',
      '    if(i==2) return vec3(1.0,0.180,0.600);   if(i==3) return vec3(0.220,0.941,1.0);',
      '    if(i==4) return vec3(0.961,0.816,0.0);   return vec3(1.0);',
      '  }',
      '  if(i==0) return vec3(0.086,0.082,0.059); if(i==1) return vec3(0.475,0.451,0.396);',
      '  if(i==2) return vec3(0.706,0.678,0.600); if(i==3) return vec3(0.859,0.839,0.780);',
      '  return vec3(0.937,0.929,0.894);',
      '}',
      'vec3 fx(vec2 uv){',
      '  float s = max(u_px, 1.0);',
      '  vec2 cell = vec2(s)/uRes;',
      '  vec2 idx = floor(uv/cell);',
      '  vec3 c = srccol((idx + 0.5)*cell);',
      '  c = (c - 0.5)*(1.0 + u_con) + 0.5 + u_bright;',
      '  int bi = int(mod(idx.x, 4.0)) + int(mod(idx.y, 4.0))*4;',
      '  c += ((BM4[bi] + 0.5)/16.0 - 0.5)*u_dither*0.6;',
      '  c = clamp(c, 0.0, 1.0);',
      '  int n = palN(u_set);',
      '  float best = 1.0e9; vec3 bc = c;',
      '  for(int i=0;i<8;i++){',
      '    if(i >= n) break;',
      '    vec3 pc = palC(u_set, i);',
      '    float d = distance(c, pc);',
      '    if(d < best){ best = d; bc = pc; }',
      '  }',
      '  return bc;',
      '}'
    ].join('\n')
  });

  /* ===================== PINTURA ===================== */

  D({
    id: 'kuwahara', name: 'Pintura a óleo', cat: 'pintura', color: '#1c7a41',
    desc: 'achata a imagem em pinceladas — filtro de kuwahara',
    params: [
      { k: 'rad', label: 'Pincel', min: 1, max: 14, step: 0.5, def: 4 },
      { k: 'canvas', label: 'Textura de tela', min: 0, max: 1, def: 0.25 },
      { k: 'sat', label: 'Saturação', min: -1, max: 2, def: 0.25 },
      { k: 'edge', label: 'Contorno', min: 0, max: 2, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 t = u_rad/uRes;',
      '  vec3 m0 = vec3(0.0), m1 = vec3(0.0), m2 = vec3(0.0), m3 = vec3(0.0);',
      '  vec3 q0 = vec3(0.0), q1 = vec3(0.0), q2 = vec3(0.0), q3 = vec3(0.0);',
      '  float n = 0.0;',
      '  for(int j=0;j<=4;j++){',
      '    for(int i=0;i<=4;i++){',
      '      vec2 o = vec2(float(i), float(j))*t;',
      '      vec3 a = srccol(uv + vec2(-o.x, -o.y)); m0 += a; q0 += a*a;',
      '      vec3 b = srccol(uv + vec2( o.x, -o.y)); m1 += b; q1 += b*b;',
      '      vec3 c = srccol(uv + vec2(-o.x,  o.y)); m2 += c; q2 += c*c;',
      '      vec3 d = srccol(uv + vec2( o.x,  o.y)); m3 += d; q3 += d*d;',
      '      n += 1.0;',
      '    }',
      '  }',
      '  m0 /= n; m1 /= n; m2 /= n; m3 /= n;',
      '  vec3 v0 = abs(q0/n - m0*m0), v1 = abs(q1/n - m1*m1);',
      '  vec3 v2 = abs(q2/n - m2*m2), v3 = abs(q3/n - m3*m3);',
      '  float s0 = v0.r+v0.g+v0.b, s1 = v1.r+v1.g+v1.b;',
      '  float s2 = v2.r+v2.g+v2.b, s3 = v3.r+v3.g+v3.b;',
      '  vec3 res = m0; float mv = s0;',
      '  if(s1 < mv){ mv = s1; res = m1; }',
      '  if(s2 < mv){ mv = s2; res = m2; }',
      '  if(s3 < mv){ mv = s3; res = m3; }',
      '  float lm = luma(res); res = mix(vec3(lm), res, 1.0 + u_sat);',
      '  float weave = (sin(uv.x*uRes.x*1.7) + sin(uv.y*uRes.y*1.9))*0.25;',
      '  weave += (fbm(uv*uRes.y*0.02) - 0.5);',
      '  res *= 1.0 + weave*u_canvas*0.25;',
      '  if(u_edge > 0.001){',
      '    vec2 e = 1.5/uRes;',
      '    float lx = luma(srccol(uv+vec2(e.x,0.0))) - luma(srccol(uv-vec2(e.x,0.0)));',
      '    float ly = luma(srccol(uv+vec2(0.0,e.y))) - luma(srccol(uv-vec2(0.0,e.y)));',
      '    res *= 1.0 - clamp(length(vec2(lx,ly))*u_edge*2.5, 0.0, 1.0);',
      '  }',
      '  return res;',
      '}'
    ].join('\n')
  });

  D({
    id: 'smudge', name: 'Borrão / Esfumaçado', cat: 'pintura', color: '#1c7a41',
    desc: 'arrasta com ruído e realça o contorno — smudged texture',
    params: [
      { k: 'amt', label: 'Deslocamento', min: 0, max: 3, def: 0.8 },
      { k: 'len', label: 'Comprimento do borrão', min: 0, max: 3, def: 1 },
      { k: 'scale', label: 'Escala do ruído', min: 0.5, max: 20, step: 0.5, def: 3 },
      { k: 'spd', label: 'Velocidade', min: 0, max: 4, def: 0.2 },
      { k: 'edge', label: 'Realce de contorno', min: 0, max: 3, def: 1 },
      { k: 'grain', label: 'Grão', min: 0, max: 1, def: 0.35 },
      { k: 'dark', t: 'c', label: 'Sombra', def: '#0a0a3c' },
      { k: 'light', t: 'c', label: 'Luz', def: '#a8c8ff' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 nz = vec2(fbm(uv*u_scale + uTime*u_spd*0.1),',
      '                 fbm(uv*u_scale + 5.5 - uTime*u_spd*0.08)) - 0.5;',
      '  vec2 p = uv + nz*u_amt*0.06;',
      '  vec3 acc = vec3(0.0);',
      '  for(int i=0;i<12;i++){',
      '    acc += srccol(p + nz*u_len*0.04*(float(i)/11.0));',
      '  }',
      '  vec3 c = acc/12.0;',
      '  float l = luma(c);',
      '  vec2 t = 1.5/uRes;',
      '  float lx = luma(srccol(p+vec2(t.x,0.0))) - luma(srccol(p-vec2(t.x,0.0)));',
      '  float ly = luma(srccol(p+vec2(0.0,t.y))) - luma(srccol(p-vec2(0.0,t.y)));',
      '  l += length(vec2(lx, ly))*u_edge*4.0;',
      '  vec3 col = mix(u_dark, u_light, clamp(l, 0.0, 1.0));',
      '  col += (hash21(uv*uRes*1.5 + floor(uTime*24.0)) - 0.5)*u_grain;',
      '  return col;',
      '}'
    ].join('\n')
  });

  /* ===================== ARTE GENERATIVA ===================== */

  D({
    id: 'flowfield', name: 'Campo de fluxo', cat: 'pintura', color: '#1c7a41',
    desc: 'fios que correm seguindo a imagem — arte generativa',
    params: [
      { k: 'len', label: 'Comprimento do fio', min: 0.2, max: 8, def: 2.2 },
      { k: 'follow', label: 'Seguir a imagem', min: 0, max: 4, def: 1.6 },
      { k: 'ang', label: 'Direção base (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'turb', label: 'Turbulência', min: 0, max: 4, def: 0.8 },
      { k: 'scale', label: 'Escala do ruído', min: 0.5, max: 30, step: 0.5, def: 6 },
      { k: 'grain', label: 'Grossura do fio', min: 1, max: 12, step: 0.5, def: 2 },
      { k: 'contrast', label: 'Contraste', min: 0.05, max: 1, def: 0.5 },
      { k: 'colorize', label: 'Puxar cor do vídeo', min: 0, max: 1, def: 0 },
      { k: 'ink', t: 'c', label: 'Tinta', def: '#16150f' },
      { k: 'paper', t: 'c', label: 'Papel', def: '#efede4' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 p = uv;',
      '  vec2 t = 2.0/uRes;',
      '  float acc = 0.0, w = 0.0;',
      '  vec2 base = vec2(cos(radians(u_ang)), sin(radians(u_ang)))*0.004;',
      '  for(int i=0;i<22;i++){',
      '    float lx = luma(srccol(p + vec2(t.x,0.0))) - luma(srccol(p - vec2(t.x,0.0)));',
      '    float ly = luma(srccol(p + vec2(0.0,t.y))) - luma(srccol(p - vec2(0.0,t.y)));',
      '    vec2 g = vec2(-ly, lx)*u_follow + base;',
      '    g += (vec2(fbm(p*u_scale), fbm(p*u_scale + 9.1)) - 0.5)*u_turb*0.02;',
      '    if(length(g) > 1.0e-6) p += normalize(g)*u_len*0.0015;',
      '    float n = hash21(floor(p*uRes/max(u_grain, 1.0)));',
      '    float we = 1.0 - float(i)/22.0;',
      '    acc += n*we; w += we;',
      '  }',
      '  float v = acc/max(w, 0.0001);',
      '  v = smoothstep(0.5 - u_contrast*0.5, 0.5 + u_contrast*0.5, v);',
      '  vec3 col = mix(u_paper, u_ink, v);',
      '  return mix(col, col*srccol(uv)*2.0, u_colorize);',
      '}'
    ].join('\n')
  });

  D({
    id: 'contour', name: 'Curvas de nível', cat: 'pintura', color: '#1c7a41',
    desc: 'mapa topográfico feito do brilho da imagem',
    params: [
      { k: 'levels', label: 'Níveis', min: 2, max: 60, step: 1, def: 14 },
      { k: 'thick', label: 'Espessura', min: 0.2, max: 6, def: 1.4 },
      { k: 'soften', label: 'Suavizar antes', min: 0, max: 10, def: 2.5 },
      { k: 'fill', label: 'Preencher faixas', min: 0, max: 1, def: 0 },
      { k: 'warp', label: 'Ondulação', min: 0, max: 2, def: 0 },
      { k: 'ink', t: 'c', label: 'Linha', def: '#16150f' },
      { k: 'paper', t: 'c', label: 'Fundo', def: '#efede4' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 sf = u_soften/uRes;',
      '  float l = 0.0;',
      '  for(int i=0;i<9;i++){',
      '    float a = float(i)*0.6981;',
      '    l += luma(srccol(uv + vec2(cos(a), sin(a))*sf));',
      '  }',
      '  l /= 9.0;',
      '  l += (fbm(uv*6.0) - 0.5)*u_warp*0.15;',
      '  float bands = l*max(u_levels, 2.0);',
      '  float f = fract(bands);',
      '  float d = min(f, 1.0 - f);',
      '  float w = max(fwidth(bands), 0.0001)*u_thick;',
      '  float line = 1.0 - smoothstep(0.0, w, d);',
      '  vec3 fill = mix(u_paper, u_ink, floor(bands)/max(u_levels, 2.0)*u_fill);',
      '  return mix(fill, u_ink, clamp(line, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  /* ===================== LUZ E COR ===================== */

  D({
    id: 'glowstreak', name: 'Brilho anamórfico', cat: 'luz', color: '#ffe066',
    desc: 'estouro com riscos de luz — soft glow / neon',
    params: [
      { k: 'len', label: 'Comprimento do risco', min: 0, max: 2, def: 0.6 },
      { k: 'ang', label: 'Ângulo', min: 0, max: 180, step: 1, def: 0 },
      { k: 'cross', t: 'b', label: 'Cruzado', def: 0 },
      { k: 'thr', label: 'Limiar', min: 0, max: 1, def: 0.62 },
      { k: 'int', label: 'Intensidade', min: 0, max: 4, def: 1.1 },
      { k: 'fall', label: 'Decaimento', min: 0.2, max: 6, def: 1.6 },
      { k: 'soft', label: 'Estouro difuso', min: 0, max: 3, def: 0.6 },
      { k: 'tint', t: 'c', label: 'Cor do brilho', def: '#ffffff' }
    ],
    glsl: [
      'vec3 streakAt(vec2 uv, float ang){',
      '  vec2 dir = vec2(cos(ang), sin(ang))*vec2(1.0/uAspect, 1.0);',
      '  vec3 acc = vec3(0.0); float w = 0.0;',
      '  for(int i=1;i<=20;i++){',
      '    float f = float(i)/20.0;',
      '    float we = pow(max(1.0 - f, 1e-6), u_fall);',
      '    vec3 a = srccol(uv + dir*f*u_len*0.35);',
      '    vec3 b = srccol(uv - dir*f*u_len*0.35);',
      '    acc += (max(a - u_thr, 0.0) + max(b - u_thr, 0.0))*we;',
      '    w += we*2.0;',
      '  }',
      '  return acc/max(w, 0.0001);',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec3 g = streakAt(uv, radians(u_ang));',
      '  if(u_cross > 0.5) g += streakAt(uv, radians(u_ang + 90.0));',
      '  vec3 soft = vec3(0.0);',
      '  for(int i=0;i<12;i++){',
      '    float a = float(i)*0.5236;',
      '    float r = (0.4 + mod(float(i), 3.0)*0.3)*0.05;',
      '    soft += max(srccol(uv + vec2(cos(a), sin(a))*r*vec2(1.0/uAspect,1.0)) - u_thr, 0.0);',
      '  }',
      '  return c + (g*4.0 + soft/12.0*u_soft*2.0)*u_int*u_tint;',
      '}'
    ].join('\n')
  });

  D({
    id: 'mono', name: 'Monocromo neon', cat: 'cor', color: '#ffb020',
    desc: 'uma cor só com brilho de borda — raio-x, visão noturna, tela',
    params: [
      { k: 'tone', t: 's', label: 'Tom', def: 0, opts: ['Raio-X (ciano)', 'Neon azul', 'Noturno (verde)', 'Vermelho', 'Roxo', 'Âmbar', 'Personalizado'] },
      { k: 'inv', t: 'b', label: 'Inverter', def: 0 },
      { k: 'black', label: 'Ponto preto', min: 0, max: 1, def: 0.05 },
      { k: 'white', label: 'Ponto branco', min: 0, max: 1.5, def: 0.95 },
      { k: 'gamma', label: 'Gama', min: 0.2, max: 3, def: 1 },
      { k: 'edge', label: 'Brilho de borda', min: 0, max: 4, def: 1.2 },
      { k: 'glow', label: 'Brilho difuso', min: 0, max: 3, def: 0.8 },
      { k: 'glowR', label: 'Raio do brilho', min: 0.2, max: 6, def: 1.5 },
      { k: 'thr', label: 'Limiar do brilho', min: 0, max: 1, def: 0.5 },
      { k: 'grain', label: 'Grão', min: 0, max: 1, def: 0.15 },
      { k: 'vig', label: 'Vinheta', min: 0, max: 2, def: 0.5 },
      { k: 'dark', t: 'c', label: 'Fundo (personalizado)', def: '#04101a' },
      { k: 'light', t: 'c', label: 'Luz (personalizado)', def: '#7ff0ff' }
    ],
    glsl: [
      'void monoTone(float t, out vec3 dk, out vec3 lt){',
      '  if(t < 0.5)      { dk = vec3(0.016,0.063,0.098); lt = vec3(0.498,0.941,1.0); }',
      '  else if(t < 1.5) { dk = vec3(0.020,0.043,0.227); lt = vec3(0.220,0.941,1.0); }',
      '  else if(t < 2.5) { dk = vec3(0.016,0.071,0.039); lt = vec3(0.490,1.0,0.608); }',
      '  else if(t < 3.5) { dk = vec3(0.078,0.008,0.039); lt = vec3(1.0,0.302,0.369); }',
      '  else if(t < 4.5) { dk = vec3(0.075,0.020,0.153); lt = vec3(0.847,0.427,1.0); }',
      '  else             { dk = vec3(0.086,0.043,0.008); lt = vec3(1.0,0.741,0.290); }',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 dk, lt;',
      '  if(u_tone > 5.5){ dk = u_dark; lt = u_light; }',
      '  else monoTone(u_tone, dk, lt);',
      '  float l = luma(srccol(uv));',
      '  if(u_inv > 0.5) l = 1.0 - l;',
      '  l = clamp((l - u_black)/max(u_white - u_black, 0.02), 0.0, 1.0);',
      '  l = pow(l, max(u_gamma, 0.05));',
      '  float e = 0.0;',
      '  if(u_edge > 0.001){',
      '    vec2 t = 1.5/uRes;',
      '    float lx = luma(srccol(uv+vec2(t.x,0.0))) - luma(srccol(uv-vec2(t.x,0.0)));',
      '    float ly = luma(srccol(uv+vec2(0.0,t.y))) - luma(srccol(uv-vec2(0.0,t.y)));',
      '    e = length(vec2(lx, ly))*u_edge*3.0;',
      '  }',
      '  float b = 0.0;',
      '  for(int i=0;i<10;i++){',
      '    float a = float(i)*0.6283;',
      '    b += luma(srccol(uv + vec2(cos(a), sin(a))*u_glowR*0.012*vec2(1.0/uAspect,1.0)));',
      '  }',
      '  b = max(b/10.0 - u_thr, 0.0)*u_glow*2.0;',
      '  vec3 col = mix(dk, lt, clamp(l + b + e, 0.0, 1.0));',
      '  col += (hash21(uv*uRes + floor(uTime*24.0)) - 0.5)*u_grain;',
      '  vec2 d = uv - 0.5; d.x *= uAspect;',
      '  col *= 1.0 - smoothstep(0.35, 0.95, length(d))*u_vig;',
      '  return col;',
      '}'
    ].join('\n')
  });

  D({
    id: 'tv80', name: 'TV anos 80', cat: 'glitch', color: '#ff2e63',
    desc: 'lente macia, grade vertical e sangria de cor',
    params: [
      { k: 'chroma', label: 'Sangria de cor', min: 0, max: 4, def: 1.2 },
      { k: 'soft', label: 'Maciez', min: 0, max: 3, def: 1 },
      { k: 'grille', label: 'Grade vertical', min: 0, max: 1, def: 0.45 },
      { k: 'scan', label: 'Linhas horizontais', min: 0, max: 1, def: 0.3 },
      { k: 'dens', label: 'Densidade das linhas', min: 0.1, max: 2, def: 0.5 },
      { k: 'wob', label: 'Tremida', min: 0, max: 3, def: 0.4 },
      { k: 'lines', label: 'Frequência da tremida', min: 5, max: 300, step: 1, def: 60 },
      { k: 'bloom', label: 'Estouro', min: 0, max: 3, def: 0.7 },
      { k: 'thr', label: 'Limiar do estouro', min: 0, max: 1, def: 0.62 },
      { k: 'bright', label: 'Brilho', min: 0.2, max: 3, def: 1.15 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float wob = sin(uv.y*u_lines + uTime*2.0)*u_wob*0.0015;',
      '  vec2 p = uv + vec2(wob, 0.0);',
      '  float ca = u_chroma*0.003;',
      '  vec3 c;',
      '  c.r = srccol(p + vec2(ca, 0.0)).r;',
      '  c.g = srccol(p).g;',
      '  c.b = srccol(p - vec2(ca, 0.0)).b;',
      '  if(u_soft > 0.001){',
      '    vec3 soft = vec3(0.0);',
      '    for(int i=0;i<8;i++){',
      '      float a = float(i)*0.7854;',
      '      soft += srccol(p + vec2(cos(a), sin(a))*u_soft*0.0035);',
      '    }',
      '    c = mix(c, soft/8.0, 0.45);',
      '  }',
      '  c *= 1.0 - u_grille*0.32*(0.5 + 0.5*sin(uv.x*uRes.x*PI));',
      '  c *= 1.0 - u_scan*0.3*(0.5 + 0.5*sin(uv.y*uRes.y*PI*u_dens));',
      '  c += max(c - u_thr, 0.0)*u_bloom*2.0;',
      '  return c*u_bright;',
      '}'
    ].join('\n')
  });

  D({
    id: 'grade', name: 'Correção cinematográfica', cat: 'cor', color: '#ffb020',
    desc: 'lift/gama/ganho com tonalização e halação',
    params: [
      { k: 'lift', t: 'c', label: 'Sombras (lift)', def: '#0a1a16' },
      { k: 'gain', t: 'c', label: 'Luzes (gain)', def: '#cfe9dd' },
      { k: 'gamma', label: 'Gama', min: 0.2, max: 3, def: 1.05 },
      { k: 'liftAmt', label: 'Força do lift', min: 0, max: 1, def: 0.35 },
      { k: 'gainAmt', label: 'Força do gain', min: 0, max: 2, def: 0.8 },
      { k: 'split', label: 'Tonalização dividida', min: 0, max: 1, def: 0.45 },
      { k: 'shadow', t: 'c', label: 'Tom das sombras', def: '#123f4a' },
      { k: 'highlight', t: 'c', label: 'Tom das luzes', def: '#ffe6c4' },
      { k: 'sat', label: 'Saturação', min: -1, max: 2, def: 0 },
      { k: 'con', label: 'Contraste', min: -1, max: 2, def: 0.12 },
      { k: 'halation', label: 'Halação', min: 0, max: 2, def: 0.35 },
      { k: 'grain', label: 'Grão', min: 0, max: 0.5, def: 0.05 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  c = c + u_lift*(1.0 - c)*u_liftAmt;',
      '  c *= mix(vec3(1.0), u_gain*2.0, u_gainAmt*0.5);',
      '  c = pow(max(c, 1e-6), vec3(1.0/max(u_gamma, 0.05)));',
      '  c = (c - 0.5)*(1.0 + u_con) + 0.5;',
      '  float l = luma(c);',
      '  c = mix(c, c*u_shadow*2.2, (1.0 - smoothstep(0.0, 0.55, l))*u_split);',
      '  c = mix(c, c*u_highlight*1.6, smoothstep(0.45, 1.0, l)*u_split);',
      '  float lm = luma(c);',
      '  c = mix(vec3(lm), c, 1.0 + u_sat);',
      '  vec3 h = vec3(0.0);',
      '  for(int i=0;i<8;i++){',
      '    float a = float(i)*0.7854;',
      '    h += max(srccol(uv + vec2(cos(a), sin(a))*0.02*vec2(1.0/uAspect,1.0)) - 0.7, 0.0);',
      '  }',
      '  c += h/8.0*u_halation*vec3(1.0, 0.5, 0.3)*2.0;',
      '  c += (hash21(uv*uRes + floor(uTime*24.0)) - 0.5)*u_grain;',
      '  return c;',
      '}'
    ].join('\n')
  });

  D({
    id: 'colourpop', name: 'Colour pop', cat: 'cor', color: '#ffb020',
    desc: 'gradiente de cor varrendo a imagem',
    params: [
      { k: 'mode', t: 's', label: 'Mistura', def: 0, opts: ['Luz colorida', 'Tela', 'Multiplicar', 'Substituir matiz'] },
      { k: 'amt', label: 'Quantidade', min: 0, max: 1, def: 0.85 },
      { k: 'ang', label: 'Ângulo', min: 0, max: 360, step: 1, def: 45 },
      { k: 'freq', label: 'Repetições', min: 0.2, max: 6, def: 1 },
      { k: 'hue', label: 'Giro de matiz', min: 0, max: 360, step: 1, def: 0 },
      { k: 'sat', label: 'Saturação do gradiente', min: 0, max: 1, def: 0.85 },
      { k: 'spd', label: 'Movimento', min: 0, max: 4, def: 0 },
      { k: 'int', label: 'Intensidade', min: 0, max: 3, def: 1 },
      { k: 'grain', label: 'Grão', min: 0, max: 0.6, def: 0.12 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float l = luma(c);',
      '  float a = radians(u_ang);',
      '  float g = dot(uv - 0.5, vec2(cos(a), sin(a))) + 0.5;',
      '  g = fract(g*u_freq + uTime*u_spd*0.1);',
      '  vec3 grad = hsv2rgb(vec3(fract(g + u_hue/360.0), u_sat, 1.0));',
      '  vec3 mixed;',
      '  if(u_mode < 0.5) mixed = grad*l*2.0*u_int;',
      '  else if(u_mode < 1.5) mixed = 1.0 - (1.0 - c)*(1.0 - grad*u_int);',
      '  else if(u_mode < 2.5) mixed = c*grad*2.0*u_int;',
      '  else { vec3 h = rgb2hsv(c); vec3 gh = rgb2hsv(grad); mixed = hsv2rgb(vec3(gh.x, max(h.y, gh.y*0.7), h.z)); }',
      '  vec3 res = mix(c, mixed, u_amt);',
      '  res += (hash21(uv*uRes + floor(uTime*24.0)) - 0.5)*u_grain;',
      '  return res;',
      '}'
    ].join('\n')
  });

  /* ===================== CATEGORIA NOVA ===================== */
  VE.CATS.push({ id: 'pintura', label: 'pintura/generativa', color: '#1c7a41' });

  /* ===================== ESTILOS DAS REFERÊNCIAS ===================== */
  VE.STYLES.push(
    {
      id: 'toybrick', name: 'Blocos de brinquedo', desc: 'peças encaixadas coloridas',
      fx: [['color', { sat: 0.5, con: 0.25 }], ['lego', { size: 18, quant: 7 }]]
    },
    {
      id: 'gravura', name: 'Gravura', desc: 'hachura cruzada em tinta azul',
      fx: [['color', { con: 0.35, sat: -1 }], ['engrave', { modo: 3, paleta: 31 }]]
    },
    {
      id: 'espiral', name: 'Espiral', desc: 'a foto numa espiral que engrossa na sombra',
      fx: [['engrave', { modo: 1 }]]
    },
    {
      id: 'reticula', name: 'Retícula', desc: 'pontos que crescem na sombra, em dois tons',
      fx: [['engrave', { modo: 2 }]]
    },
    {
      id: 'cianotipia', name: 'Cianotipia', desc: 'papel azul de arquivo',
      fx: [['cyanotype', { tone: 0 }]]
    },
    {
      id: 'cianoverde', name: 'Cianotipia verde', desc: 'a mesma prova em verde',
      fx: [['cyanotype', { tone: 1, stain: 0.35 }]]
    },
    {
      id: 'cianoroxo', name: 'Cianotipia roxa', desc: 'prova em roxo',
      fx: [['cyanotype', { tone: 2, stain: 0.35 }]]
    },
    {
      id: 'raiox', name: 'Raio-X', desc: 'negativo ciano com brilho de borda',
      fx: [['mono', { tone: 0, inv: 1, edge: 1.6, glow: 1, grain: 0.18 }]]
    },
    {
      id: 'neonglow', name: 'Neon glow', desc: 'azul profundo com contorno aceso',
      fx: [['mono', { tone: 1, edge: 2, glow: 1.2, vig: 0.9, grain: 0.2 }], ['glowstreak', { len: 0.4, int: 0.7, tint: '#38f0ff' }]]
    },
    {
      id: 'noturnoverde', name: 'Imagem noturna', desc: 'verde de intensificador',
      fx: [['mono', { tone: 2, edge: 0.8, glow: 1, grain: 0.3, vig: 1 }]]
    },
    {
      id: 'negativoazul', name: 'Negativo azul', desc: 'inversão com tom frio',
      fx: [['invert', { mode: 0 }], ['grade', { lift: '#001a4d', gain: '#cfe0ff', liftAmt: 0.5, split: 0.3, con: 0.2 }]]
    },
    {
      id: 'posterflat', name: 'Poster', desc: 'cores chapadas de serigrafia',
      fx: [
        ['color', { exp: 0.2, con: 0.45, sat: 1.2 }],
        ['kuwahara', { rad: 3, canvas: 0, sat: 0.3 }],
        ['posterize', { lev: 5, dith: 0.05, sat: 0.5 }]
      ]
    },
    {
      id: 'grittyduo', name: 'Duotone áspero', desc: 'duas cores com grão pesado',
      fx: [
        ['color', { con: 0.7, sat: -1 }],
        ['threshold', { lev: 0.46, soft: 0.14, noise: 0.22, dark: '#16150f', light: '#7b76ee' }]
      ]
    },
    {
      id: 'retropixel', name: 'Retro pixel', desc: 'paleta de console e pixel grande',
      fx: [['color', { con: 0.3, sat: 0.4 }], ['palette', { set: 2, px: 5, dither: 0.5 }]]
    },
    {
      id: 'gameboy2', name: 'Game Boy', desc: 'quatro tons de verde',
      fx: [['color', { con: 0.35 }], ['palette', { set: 0, px: 5, dither: 0.6 }]]
    },
    {
      id: 'fotocopia', name: 'Fotocópia', desc: 'xerox com faixas e sujeira',
      fx: [['xerox', {}]]
    },
    {
      id: 'scannervelho', name: 'Scanner velho', desc: 'faixas esticadas e grão',
      fx: [['xerox', { bands: 14, glitch: 0.55, slip: 0.9, smear: 0.85, grain: 0.4, con: 1.8 }]]
    },
    {
      id: 'tv80s', name: 'TV anos 80', desc: 'tubo macio com grade e sangria',
      fx: [['tv80', {}], ['grade', { lift: '#1a0008', gain: '#ffd9d0', split: 0.4, halation: 0.6 }]]
    },
    {
      id: 'cinemaverde', name: 'Cinema verde', desc: 'grade teal com halação',
      fx: [['grade', { lift: '#0a1a16', gain: '#cfe9dd', split: 0.5, halation: 0.5, sat: -0.15 }], ['gauss', { rad: 2, mixv: 0.25 }]]
    },
    {
      id: 'sonhoblur', name: 'Motion sonho', desc: 'arrasto com brilho e grão',
      fx: [
        ['motionblur', { len: 0.4, ang: 0, glow: 0.8, ramp: 0.5, rampPos: 0.55 }],
        ['grade', { lift: '#141008', gain: '#f0e6d8', halation: 0.6, grain: 0.08 }]
      ]
    },
    {
      id: 'fumaca', name: 'Fumaça', desc: 'a imagem se desfaz em correnteza',
      fx: [['smoke', {}], ['grade', { lift: '#0a1020', gain: '#dfe8f5', sat: -0.4 }]]
    },
    {
      id: 'oleo', name: 'Pintura a óleo', desc: 'pinceladas sobre tela',
      fx: [['kuwahara', { rad: 5, canvas: 0.35, sat: 0.2 }], ['grade', { gain: '#f2ece0', liftAmt: 0.2, con: 0.15 }]]
    },
    {
      id: 'fluxo', name: 'Campo de fluxo', desc: 'fios de tinta seguindo a imagem',
      fx: [['color', { con: 0.4, sat: -1 }], ['flowfield', {}]]
    },
    {
      id: 'topografia', name: 'Topografia', desc: 'curvas de nível',
      fx: [['contour', { levels: 16, thick: 1.4 }]]
    },
    {
      id: 'colourpopstyle', name: 'Colour pop', desc: 'gradiente forte sobre o vídeo',
      fx: [['colourpop', {}], ['glowstreak', { len: 0.3, int: 0.5 }]]
    }
  );

})(window.VE);
