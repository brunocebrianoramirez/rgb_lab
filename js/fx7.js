/* ============================================================
   rgb_lab — FAMÍLIA 01 · COR / MATÉRIA   e   FAMÍLIA 07 · PERCEPÇÃO
   ------------------------------------------------------------
   Aqui a cor deixa de ser "filtro" e vira matéria manipulável:
   o que se preserva, o que se destrói, o que se separa em canais,
   o que se desloca por comprimento de onda.

   Três destes são FERRAMENTAS ASSINATURA do laboratório:

     MEMÓRIA DE COR        escolhe uma cor e destrói progressivamente
                           todas as outras — máscara perceptual, não
                           uma dessaturação global
     DESLOCAMENTO ESPECTRAL cada faixa de matiz recebe uma transformação
                           espacial diferente
     ESTRELAS DE LUZ       os pontos de luz viram estrelas de difração,
                           com pontas, giro, cintilância e cor por
                           comprimento de onda

   Convenções: cada efeito implementa `vec3 fx(vec2 uv)`. Máscara,
   intensidade, fades e keyframes vêm do framework.
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  var COR = '#ffb020';
  var PER = '#c9d400';

  /* ==================================================================
     ESTRELAS DE LUZ — o "kira kira"
     ------------------------------------------------------------------
     É um filtro CROSS-SCREEN: uma grade de fios finos na frente da lente
     difrata cada reflexo especular em raias retas, e quanto mais longe do
     centro, mais os comprimentos de onda se separam — por isso a ponta
     abre em arco-íris.

     COMO ISSO É FEITO AQUI, E POR QUE EM VÁRIAS PASSADAS
     ---------------------------------------------------
     O pixel que desenha um pedaço de raia precisa OLHAR ao longo da
     direção dela até encontrar o reflexo. Se as amostras ficarem mais
     espaçadas do que o reflexo é largo, ele cai no vão entre duas e a
     raia sai pontilhada. Reflexo em água tem 2 a 4 pixels; uma raia que
     atravessa meia tela tem 300 a 500. Amostrar de 2 em 2 pixels ao longo
     disso custa umas 250 amostras POR RAIA — inviável.

     A saída é varrer em POTÊNCIAS DE QUATRO. Cada passada olha só quatro
     posições, mas com o passo multiplicado por quatro:

       passada 0   0   1   2   3  ×  passo
       passada 1   0   4   8  12  ×  passo
       passada 2   0  16  32  48  ×  passo
       passada 3   0  64 128 192  ×  passo

     Somando uma escolha de cada passada chega-se a QUALQUER distância de
     0 a 255 passos — é contagem na base quatro. Com o passo valendo dois
     pixels, isso cobre 500 pixels de raia sem deixar um vão, usando 16
     amostras por direção em vez de 250.

     E o acúmulo é por MÁXIMO, não por soma: assim o brilho da raia a uma
     distância d é exatamente "brilho do reflexo × queda(d)", que é o que
     a óptica faz — e não muda com a resolução. Como o peso é exponencial
     na distância, o máximo composto ao longo das passadas dá o mesmo
     resultado de uma varredura fina: w^a · w^b = w^(a+b).

     As QUATRO LINHAS da estrela viajam empacotadas nos canais R, G, B e A
     do quadro de trabalho — uma linha por canal, cada uma bidirecional.
     Quatro linhas = oito pontas.
     ================================================================== */
  D({
    id: 'kirakira', name: 'Estrelas de luz (kira kira)', cat: 'cor', color: COR,
    passes: 5,   /* quatro varreduras + a composição final */
    desc: 'filtro cross-screen: cada reflexo vira uma estrela de raias finas com difração',
    params: [
      { k: 'thr', label: 'Limiar de luz', min: 0.3, max: 0.99, def: 0.72 },
      { k: 'hard', label: 'Seletividade', min: 0, max: 1, def: 0.45 },
      { k: 'arms', label: 'Pontas', t: 's', opts: ['2 · fenda', '4 · cruz', '6 · estrela', '8 · flor'], def: 1 },
      { k: 'sub', label: 'Comprimento das secundárias', min: 0.15, max: 1, def: 0.55 },
      { k: 'len', label: 'Comprimento', min: 0.02, max: 1.5, def: 0.55 },
      { k: 'tip', label: 'Brilho na ponta', min: 0.002, max: 0.6, def: 0.04 },
      { k: 'gain', label: 'Intensidade', min: 0, max: 5, def: 1.6 },
      { k: 'chroma', label: 'Difração (arco-íris)', min: 0, max: 1, def: 0.3 },
      { k: 'white', label: 'Branquear a raia', min: 0, max: 1, def: 0.6 },
      { k: 'ang', label: 'Ângulo (°)', min: 0, max: 180, step: 1, def: 0 },
      { k: 'spin', label: 'Girar no tempo', min: -2, max: 2, def: 0 },
      { k: 'twinkle', label: 'Cintilância', min: 0, max: 1, def: 0.25 },
      { k: 'core', label: 'Núcleo estourado', min: 0, max: 2, def: 0.55 },
      { k: 'col', t: 'c', label: 'Cor da estrela', def: '#ffffff' }
    ],
    glsl: [
      /* quantas LINHAS (cada uma dá duas pontas) e a direção de cada uma */
      'float kkLines(){ return floor(u_arms + 0.5) + 1.0; }',
      'vec2 kkDir(int c){',
      '  float a = u_ang*PI/180.0 + uTime*u_spin*0.7 + float(c)*(PI/kkLines());',
      '  return vec2(cos(a)/max(uAspect, 0.001), sin(a));',
      '}',
      /* as linhas ímpares são as secundárias: caem mais rápido, logo saem
         mais curtas. É o que dá a estrela de oito com quatro raias longas */
      'float kkTip(int c){',
      '  float base = max(u_tip, 0.002);',
      '  if(mod(float(c), 2.0) < 0.5) return base;',
      '  return pow(base, 1.0/max(u_sub, 0.15));',
      '}',
      /* quanto este pixel conta como reflexo */
      'float kkB(vec3 c){',
      '  float l = luma(c);',
      '  float b = max(l - u_thr, 0.0)/max(1.0 - u_thr, 0.04);',
      '  return pow(b, 1.0 + u_hard*5.0);',
      '}',
      'float kkPick(vec4 v, int c){',
      '  if(c == 0) return v.r;',
      '  if(c == 1) return v.g;',
      '  if(c == 2) return v.b;',
      '  return v.a;',
      '}',
      /* --------------------------------------------- passadas de trabalho */
      'vec4 fxStep(vec2 uv){',
      '  float lines = kkLines();',
      '  float L = max(u_len, 0.001);',
      '  float base = L/255.0;',
      '  float mul = pow(4.0, uPass);',
      '  bool first = (uPass < 0.5);',
      '  vec4 outv = vec4(0.0);',
      '  for(int c=0;c<4;c++){',
      '    if(float(c) >= lines) break;',
      '    vec2 d = kkDir(c)*base*mul;',
      /* peso por passo: na ponta da raia vale `tip` */
      '    float wb = pow(kkTip(c), mul/255.0);',
      '    float best = first ? kkB(texture(uOrig, uv).rgb) : kkPick(texture(uTex, uv), c);',
      '    for(int k=1;k<4;k++){',
      '      float w = pow(wb, float(k));',
      '      for(int s=0;s<2;s++){',
      '        vec2 p = uv + d*float(k)*(s == 0 ? 1.0 : -1.0);',
      '        if(p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) continue;',
      '        float v = first ? kkB(texture(uOrig, p).rgb) : kkPick(texture(uTex, p), c);',
      '        best = max(best, v*w);',
      '      }',
      '    }',
      '    if(c == 0) outv.r = best;',
      '    else if(c == 1) outv.g = best;',
      '    else if(c == 2) outv.b = best;',
      '    else outv.a = best;',
      '  }',
      '  return outv;',
      '}',
      /* -------------------------------------------------- passada final */
      'vec3 fxLast(vec2 uv){',
      '  vec3 base = texture(uOrig, uv).rgb;',
      '  vec4 acc = texture(uTex, uv);',
      '  float lines = kkLines();',
      '  float L = max(u_len, 0.001);',
      '  vec3 star = vec3(0.0);',
      '  for(int c=0;c<4;c++){',
      '    if(float(c) >= lines) break;',
      '    float v = kkPick(acc, c);',
      '    if(v <= 0.0015) continue;',
      /* o valor guardado é brilho×queda; como reflexo é quase branco, dá
         para voltar dele a distância percorrida — e é a distância que
         escolhe o comprimento de onda da difração                       */
      '    float f = clamp(log(max(v, 1e-5))/log(kkTip(c)), 0.0, 1.0);',
      /* a difração TINGE a raia, não a escurece: o arco-íris é normalizado
         para manter o brilho, senão a raia apaga onde os três canais caem */
      '    vec3 arco = 0.5 + 0.5*cos(6.28318*(f*1.9 + vec3(0.0, 0.33, 0.66)));',
      '    arco = max(arco, 0.12)/max(luma(max(arco, 0.12)), 0.25);',
      '    vec3 tint = mix(vec3(1.0), arco, u_chroma);',
      /* cada reflexo pisca com fase própria: a semente vem de onde ele está */
      '    float tw = 1.0;',
      '    if(u_twinkle > 0.004){',
      '      vec2 origem = uv + kkDir(c)*f*L;',
      '      float seed = hash21(floor(origem*uRes*0.12));',
      '      tw = mix(1.0, 0.5 + 0.5*sin(uTime*5.5 + seed*39.0), u_twinkle);',
      '    }',
      '    star += v*tint*tw;',
      '  }',
      '  star *= u_gain;',
      /* núcleo: o próprio reflexo estoura em branco e sangra um pouco */
      '  if(u_core > 0.004){',
      '    vec2 t = texel();',
      '    float h = 0.0;',
      '    for(int i=0;i<8;i++){',
      '      float a = float(i)*(PI/4.0);',
      '      vec2 p = uv + vec2(cos(a)/max(uAspect,0.001), sin(a))*t*2.6;',
      '      h = max(h, kkB(texture(uOrig, clamp(p, 0.0, 1.0)).rgb));',
      '    }',
      '    star += h*u_core;',
      '  }',
      '  star = mix(star*(base/max(luma(base), 0.10)), star, u_white);',
      '  star *= u_col;',
      '  return 1.0 - (1.0 - base)*(1.0 - clamp(star, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  /* ==================================================================
     COLORIZAR — devolver cor a um preto e branco
     Sem rede neural não existe adivinhação de cor real. O que existe, e
     funciona muito bem, é COLORIZAÇÃO POR REGIÃO: a imagem é separada
     em céu, vegetação, pele e matéria, usando luminância, aspereza
     local e posição no quadro; cada região recebe um matiz plausível e
     a luminância original é PRESERVADA. É o mesmo método do
     colorista de laboratório, feito por máscara.
     ================================================================== */
  D({
    id: 'colorize', name: 'Colorizar (P&B → cor)', cat: 'cor', color: COR,
    desc: 'devolve cor a um preto e branco por regiões: céu, vegetação, pele e matéria',
    params: [
      { k: 'cena', label: 'Cena', t: 's', opts: ['Automático', 'Paisagem', 'Retrato', 'Interior', 'Arquivo antigo'], def: 0 },
      { k: 'hor', label: 'Linha do horizonte', min: 0, max: 1, def: 0.55 },
      { k: 'sky', t: 'c', label: 'Céu', def: '#7fa8cf' },
      { k: 'veg', t: 'c', label: 'Vegetação', def: '#6d7f42' },
      { k: 'skin', t: 'c', label: 'Pele', def: '#d5a17c' },
      { k: 'earth', t: 'c', label: 'Matéria / terra', def: '#9a7a5e' },
      { k: 'amt', label: 'Força da cor', min: 0, max: 1.6, def: 0.85 },
      { k: 'sep', label: 'Separação das regiões', min: 0.2, max: 3, def: 1 },
      { k: 'temp', label: 'Temperatura', min: -1, max: 1, def: 0.06 },
      { k: 'shadow', label: 'Frio nas sombras', min: 0, max: 1, def: 0.35 },
      { k: 'vibr', label: 'Vivacidade', min: 0, max: 1.5, def: 0.45 },
      { k: 'keep', label: 'Respeitar cor existente', min: 0, max: 1, def: 0.5 }
    ],
    glsl: [
      /* devolve a cor com a LUMINÂNCIA da fonte preservada */
      'vec3 clzTone(vec3 tint, float l){',
      '  float tl = max(luma(tint), 0.04);',
      '  vec3 c = tint*(l/tl);',
      /* compressão suave no topo, senão o céu claro vira branco chapado */
      '  return c/(1.0 + max(c - 1.0, 0.0));',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 src = srccol(uv);',
      '  float l = luma(src);',
      '  float rough = roughness(uv, 1.4);',
      '  float sep = max(u_sep, 0.2);',
      /* a cena muda os pesos das quatro regiões */
      '  float m = floor(u_cena + 0.5);',
      '  float wSky  = 1.0, wVeg = 1.0, wSkin = 1.0;',
      '  if(m == 1.0){ wSky = 1.35; wVeg = 1.35; wSkin = 0.45; }',
      '  else if(m == 2.0){ wSky = 0.35; wVeg = 0.35; wSkin = 1.7; }',
      '  else if(m == 3.0){ wSky = 0.12; wVeg = 0.2;  wSkin = 1.35; }',
      '  else if(m == 4.0){ wSky = 0.9;  wVeg = 0.7;  wSkin = 0.9;  }',
      /* CÉU: acima do horizonte, claro e liso */
      '  float above = smoothstep(u_hor - 0.16, u_hor + 0.06, uv.y);',
      '  float sky = above*smoothstep(0.40, 0.78, l)*(1.0 - smoothstep(0.10, 0.34, rough));',
      '  sky = pow(clamp(sky, 1e-6, 1.0), 1.0/sep)*wSky;',
      /* VEGETAÇÃO: áspera, meia-luz, abaixo do horizonte */
      '  float veg = (1.0 - above*0.8)*smoothstep(0.16, 0.46, rough)',
      '            * smoothstep(0.06, 0.24, l)*(1.0 - smoothstep(0.52, 0.82, l));',
      '  veg = pow(clamp(veg, 1e-6, 1.0), 1.0/sep)*wVeg;',
      /* PELE: meia-luz alta, lisa, longe do topo do quadro */
      '  float skin = smoothstep(0.30, 0.52, l)*(1.0 - smoothstep(0.74, 0.95, l))',
      '             * (1.0 - smoothstep(0.09, 0.28, rough))*(1.0 - above*0.55);',
      '  skin = pow(clamp(skin, 1e-6, 1.0), 1.0/sep)*wSkin;',
      /* o resto é matéria */
      '  float tot = sky + veg + skin;',
      '  float rest = max(1.0 - tot, 0.0);',
      '  float norm = max(tot + rest, 1e-4);',
      '  vec3 tint = (u_sky*sky + u_veg*veg + u_skin*skin + u_earth*rest)/norm;',
      /* sombra fria / luz quente — o que dá relevo a uma colorização */
      '  float sh = 1.0 - smoothstep(0.0, 0.45, l);',
      '  tint = mix(tint, tint*vec3(0.72, 0.86, 1.18), sh*u_shadow);',
      '  tint.r *= 1.0 + u_temp*0.30;',
      '  tint.b *= 1.0 - u_temp*0.30;',
      '  vec3 col = clzTone(tint, l);',
      /* vivacidade: sobe a saturação só onde ela é baixa */
      '  vec3 hsv = rgb2hsv(col);',
      '  hsv.y = clamp(hsv.y*(1.0 + u_vibr*(1.0 - hsv.y)), 0.0, 1.0);',
      '  col = hsv2rgb(hsv);',
      '  col = mix(vec3(l), col, clamp(u_amt, 0.0, 1.6));',
      /* se a fonte JÁ tinha cor, ela tem prioridade — assim o efeito pode
         ficar ligado num corte misto de material colorido e P&B          */
      '  float chroma = length(src - vec3(l));',
      '  float had = smoothstep(0.012, 0.10, chroma)*u_keep;',
      '  return mix(col, src, had);',
      '}'
    ].join('\n')
  });

  /* ==================================================================
     MEMÓRIA DE COR — ferramenta assinatura
     O usuário escolhe UMA cor. O sistema constrói uma máscara perceptual
     em torno dela (matiz + saturação + luminância) e destrói
     progressivamente todo o resto: primeiro a saturação, depois o
     contraste, depois a própria imagem.
     ================================================================== */
  D({
    id: 'colormem', name: 'Memória de cor', cat: 'cor', color: COR,
    desc: 'protege uma cor e destrói progressivamente todas as outras',
    params: [
      { k: 'col', t: 'c', label: 'Cor lembrada', def: '#d0271b' },
      { k: 'tol', label: 'Tolerância de matiz', min: 0.01, max: 0.5, def: 0.09 },
      { k: 'soft', label: 'Suavidade da borda', min: 0.005, max: 0.4, def: 0.07 },
      { k: 'minsat', label: 'Saturação mínima', min: 0, max: 0.8, def: 0.14 },
      { k: 'stage', label: 'Estágio do esquecimento', min: 0, max: 1, def: 0.6 },
      { k: 'boost', label: 'Reforço da cor lembrada', min: 0, max: 1.5, def: 0.35 },
      { k: 'grey', t: 'c', label: 'Cinza do esquecido', def: '#8c8a80' },
      { k: 'grain', label: 'Ruído do esquecido', min: 0, max: 1, def: 0.22 },
      { k: 'erode', label: 'Erosão do esquecido', min: 0, max: 1, def: 0.3 },
      { k: 'inv', label: 'Inverter (esquecer só ela)', t: 'b', def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec3 hs = rgb2hsl(c);',
      '  vec3 th = rgb2hsl(u_col);',
      /* proximidade perceptual: matiz pesa mais, mas saturação e brilho
         entram — vermelho escuro e rosa claro não são a mesma memória  */
      '  float dh = huedist(hs.x, th.x);',
      '  float keep = 1.0 - smoothstep(u_tol, u_tol + u_soft, dh);',
      '  keep *= smoothstep(u_minsat*0.5, u_minsat + 0.10, hs.y);',
      '  keep *= 1.0 - smoothstep(0.86, 1.0, hs.z);',
      '  keep *= smoothstep(0.02, 0.12, hs.z);',
      '  if(u_inv > 0.5) keep = 1.0 - keep;',
      '  float forget = clamp((1.0 - keep)*u_stage, 0.0, 1.0);',
      /* 1º a cor vai embora */
      '  float l = luma(c);',
      '  vec3 grey = u_grey*(l/max(luma(u_grey), 0.05));',
      '  grey = grey/(1.0 + max(grey - 1.0, 0.0));',
      '  vec3 outc = mix(c, grey, smoothstep(0.0, 0.55, forget));',
      /* 2º o contraste desaba */
      '  float flat_ = smoothstep(0.4, 0.85, forget);',
      '  outc = mix(outc, vec3(mix(l, 0.5, 0.55)), flat_*0.8);',
      /* 3º a matéria se desfaz em ruído e erosão */
      '  float n = hash21(floor(uv*uRes/2.0) + floor(uTime*11.0));',
      '  outc += (n - 0.5)*u_grain*forget*0.55;',
      '  float er = fbm3(uv*vec2(uRes.x/uRes.y, 1.0)*10.0, uTime*0.12);',
      '  float eat = smoothstep(0.55, 0.95, forget)*u_erode;',
      '  outc = mix(outc, vec3(0.5), clamp((er - 0.42)*3.0, 0.0, 1.0)*eat);',
      /* a cor lembrada fica mais viva do que era */
      '  if(u_boost > 0.001){',
      '    vec3 hv = rgb2hsv(outc);',
      '    hv.y = clamp(hv.y*(1.0 + u_boost*keep), 0.0, 1.0);',
      '    outc = mix(outc, hsv2rgb(hv), keep);',
      '  }',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ==================================================================
     DESLOCAMENTO ESPECTRAL — ferramenta assinatura
     Cada faixa de matiz recebe uma transformação espacial diferente:
     o vermelho anda para um lado, o verde gira, o azul escala. A imagem
     se desmonta por comprimento de onda, não por canal RGB.
     ================================================================== */
  D({
    id: 'spectral', name: 'Deslocamento espectral', cat: 'cor', color: COR,
    desc: 'cada faixa de matiz recebe um deslocamento, giro e escala próprios',
    params: [
      { k: 'amt', label: 'Deslocamento', min: 0, max: 0.4, def: 0.06 },
      { k: 'rot', label: 'Giro por faixa (°)', min: -60, max: 60, step: 0.5, def: 6 },
      { k: 'scale', label: 'Escala por faixa', min: -0.5, max: 0.5, def: 0.05 },
      { k: 'bands', label: 'Faixas', min: 3, max: 12, step: 1, def: 6 },
      { k: 'spread', label: 'Abertura do leque (°)', min: 0, max: 360, step: 1, def: 180 },
      { k: 'base', label: 'Direção inicial (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'spin', label: 'Girar no tempo', min: -2, max: 2, def: 0 },
      { k: 'mixmode', label: 'Mistura', t: 's', opts: ['Somar (luz)', 'Média', 'Máximo', 'Sobre o original'], def: 0 },
      { k: 'sat', label: 'Só o que é saturado', min: 0, max: 1, def: 0.4 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 base = srccol(uv);',
      '  float n = max(3.0, floor(u_bands + 0.5));',
      '  vec3 acc = vec3(0.0);',
      '  float wsum = 0.0;',
      '  for(int i=0;i<12;i++){',
      '    if(float(i) >= n) break;',
      '    float f = float(i)/n;',
      '    float a = (u_base + u_spread*f)*PI/180.0 + uTime*u_spin*0.5;',
      '    vec2 d = vec2(cos(a)/max(uAspect, 0.001), sin(a))*u_amt*(0.35 + f);',
      '    vec2 p = uv + d;',
      '    p = (p - 0.5)*(1.0 - u_scale*(f - 0.5)*2.0) + 0.5;',
      '    p = 0.5 + rot2(p - 0.5, u_rot*PI/180.0*(f - 0.5)*2.0);',
      '    vec3 c = srccol(p);',
      '    vec3 hv = rgb2hsv(c);',
      /* peso: o quanto ESTE pixel pertence a ESTA faixa de matiz */
      '    float w = 1.0 - smoothstep(0.0, 1.0/n*1.35, huedist(hv.x, f));',
      '    w *= mix(1.0, hv.y, u_sat);',
      '    acc += c*w; wsum += w;',
      '  }',
      '  vec3 outc;',
      '  float mm = floor(u_mixmode + 0.5);',
      '  if(mm < 0.5)      outc = clamp(acc, 0.0, 1.0);',
      '  else if(mm < 1.5) outc = acc/max(wsum, 0.04);',
      '  else if(mm < 2.5) outc = max(base, clamp(acc, 0.0, 1.0));',
      '  else              outc = 1.0 - (1.0 - base)*(1.0 - clamp(acc, 0.0, 1.0));',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* =================== BYPASS DE BRANQUEAMENTO ====================== */
  D({
    id: 'bleach', name: 'Bypass de branqueamento', cat: 'cor', color: COR,
    desc: 'a prata fica na película: contraste alto, cor lavada, pretos densos',
    params: [
      { k: 'amt', label: 'Prata retida', min: 0, max: 1, def: 0.7 },
      { k: 'con', label: 'Contraste', min: 0, max: 2, def: 0.7 },
      { k: 'sat', label: 'Saturação restante', min: 0, max: 1, def: 0.35 },
      { k: 'dens', label: 'Densidade dos pretos', min: 0, max: 1, def: 0.4 },
      { k: 'halo', label: 'Halo de prata', min: 0, max: 1, def: 0.25 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float l = luma(c);',
      '  vec3 gray = vec3(l);',
      /* sobreposição da camada de prata sobre a camada de cor */
      '  vec3 over = mix(2.0*c*gray, 1.0 - 2.0*(1.0-c)*(1.0-gray), step(0.5, gray));',
      '  vec3 outc = mix(c, over, u_amt);',
      '  outc = mix(vec3(luma(outc)), outc, u_sat);',
      '  outc = (outc - 0.5)*(1.0 + u_con) + 0.5;',
      '  outc = pow(max(outc, 1e-6), vec3(1.0 + u_dens*0.55));',
      '  if(u_halo > 0.001){',
      '    vec3 b = box3(uv, 2.5);',
      '    outc += max(vec3(luma(b)) - 0.62, 0.0)*u_halo*0.9;',
      '  }',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ======================= PROCESSO CRUZADO ========================= */
  D({
    id: 'crossproc', name: 'Processo cruzado', cat: 'cor', color: COR,
    desc: 'revelação trocada: curva em S diferente em cada canal',
    params: [
      { k: 'rc', label: 'Curva no vermelho', min: -1, max: 1, def: 0.55 },
      { k: 'gc', label: 'Curva no verde', min: -1, max: 1, def: 0.15 },
      { k: 'bc', label: 'Curva no azul', min: -1, max: 1, def: -0.45 },
      { k: 'piv', label: 'Pivô', min: 0.2, max: 0.8, def: 0.5 },
      { k: 'lift', label: 'Levantar pretos', min: -0.1, max: 0.4, def: 0.06 },
      { k: 'sat', label: 'Saturação', min: -1, max: 2, def: 0.35 },
      { k: 'yellow', label: 'Amarelar altas', min: 0, max: 1, def: 0.3 }
    ],
    glsl: [
      'float cpS(float x, float k, float p){',
      '  x = clamp(x, 0.0, 1.0);',
      '  float t = clamp((x - p)/max(1e-3, (x > p ? 1.0 - p : p)), -1.0, 1.0);',
      '  float s = t*(1.0 + k*(1.0 - abs(t)));',
      '  return clamp(p + s*(x > p ? 1.0 - p : p), 0.0, 1.0);',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  c = vec3(cpS(c.r, u_rc, u_piv), cpS(c.g, u_gc, u_piv), cpS(c.b, u_bc, u_piv));',
      '  c = c*(1.0 - u_lift) + u_lift*vec3(0.94, 1.0, 1.06);',
      '  float l = luma(c);',
      '  c = mix(vec3(l), c, 1.0 + u_sat);',
      '  float hi = smoothstep(0.6, 1.0, l);',
      '  c = mix(c, c*vec3(1.10, 1.04, 0.78), hi*u_yellow);',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* ========================= SOLARIZAÇÃO =========================== */
  D({
    id: 'solariza', name: 'Solarização (Sabattier)', cat: 'cor', color: COR,
    desc: 'acima do limiar a imagem inverte — o efeito de luz no revelador',
    params: [
      { k: 'thr', label: 'Limiar', min: 0, max: 1, def: 0.55 },
      { k: 'soft', label: 'Transição', min: 0.001, max: 0.5, def: 0.09 },
      { k: 'mode', label: 'Modo', t: 's', opts: ['Luminância', 'Por canal', 'Só um canal', 'Senoide'], def: 0 },
      { k: 'ch', label: 'Canal', t: 's', opts: ['Vermelho', 'Verde', 'Azul'], def: 2 },
      { k: 'cycles', label: 'Ciclos (senoide)', min: 1, max: 8, step: 0.5, def: 2 },
      { k: 'amt', label: 'Profundidade', min: 0, max: 1, def: 1 }
    ],
    glsl: [
      'float solar1(float x, float t, float s){',
      '  float k = smoothstep(t - s, t + s, x);',
      '  return mix(x, 1.0 - x, k);',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec3 outc = c;',
      '  float m = floor(u_mode + 0.5);',
      '  if(m < 0.5){',
      '    float l = luma(c);',
      '    float k = smoothstep(u_thr - u_soft, u_thr + u_soft, l);',
      '    outc = mix(c, 1.0 - c, k);',
      '  } else if(m < 1.5){',
      '    outc = vec3(solar1(c.r, u_thr, u_soft), solar1(c.g, u_thr, u_soft), solar1(c.b, u_thr, u_soft));',
      '  } else if(m < 2.5){',
      '    float ci = floor(u_ch + 0.5);',
      '    if(ci < 0.5)      outc.r = solar1(c.r, u_thr, u_soft);',
      '    else if(ci < 1.5) outc.g = solar1(c.g, u_thr, u_soft);',
      '    else              outc.b = solar1(c.b, u_thr, u_soft);',
      '  } else {',
      '    outc = 0.5 - 0.5*cos(c*PI*u_cycles*2.0);',
      '  }',
      '  return mix(c, outc, u_amt);',
      '}'
    ].join('\n')
  });

  /* ======================== MESA DE CANAIS ========================== */
  D({
    id: 'chanmix', name: 'Mesa de canais', cat: 'cor', color: COR,
    desc: 'cada canal de saída é uma soma dos três de entrada — a matriz inteira na mão',
    params: [
      { k: 'rr', label: 'R ← R', min: -2, max: 2, def: 1 },
      { k: 'rg', label: 'R ← G', min: -2, max: 2, def: 0 },
      { k: 'rb', label: 'R ← B', min: -2, max: 2, def: 0 },
      { k: 'gr', label: 'G ← R', min: -2, max: 2, def: 0 },
      { k: 'gg', label: 'G ← G', min: -2, max: 2, def: 1 },
      { k: 'gb', label: 'G ← B', min: -2, max: 2, def: 0 },
      { k: 'br', label: 'B ← R', min: -2, max: 2, def: 0 },
      { k: 'bg', label: 'B ← G', min: -2, max: 2, def: 0 },
      { k: 'bb', label: 'B ← B', min: -2, max: 2, def: 1 },
      { k: 'off', label: 'Deslocamento', min: -0.5, max: 0.5, def: 0 },
      { k: 'norm', label: 'Manter brilho', t: 'b', def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec3 outc = vec3(',
      '    dot(c, vec3(u_rr, u_rg, u_rb)),',
      '    dot(c, vec3(u_gr, u_gg, u_gb)),',
      '    dot(c, vec3(u_br, u_bg, u_bb))) + u_off;',
      '  if(u_norm > 0.5){',
      '    float a = luma(c), b = max(luma(outc), 1e-4);',
      '    outc *= mix(1.0, a/b, 0.85);',
      '  }',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ========================== FALSA COR ============================= */
  D({
    id: 'falsecolor', name: 'Falsa cor (zonas)', cat: 'percepcao', color: PER,
    desc: 'cada faixa de exposição vira uma cor chapada — a leitura do monitor de set',
    params: [
      { k: 'zones', label: 'Zonas', min: 3, max: 14, step: 1, def: 9 },
      { k: 'mode', label: 'Paleta', t: 's', opts: ['Monitor de set', 'Térmica', 'Espectro', 'Duas cores'], def: 0 },
      { k: 'lo', label: 'Ponto de preto', min: 0, max: 0.5, def: 0.03 },
      { k: 'hi', label: 'Ponto de branco', min: 0.5, max: 1, def: 0.97 },
      { k: 'edge', label: 'Filete entre zonas', min: 0, max: 1, def: 0.25 },
      { k: 'blend', label: 'Deixar ver a imagem', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'vec3 fcPal(float z, float m){',
      '  if(m < 0.5){',                                   /* monitor de set */
      '    if(z < 0.06) return vec3(0.22, 0.10, 0.55);',
      '    if(z < 0.16) return vec3(0.10, 0.35, 0.85);',
      '    if(z < 0.34) return vec3(0.12, 0.68, 0.55);',
      '    if(z < 0.48) return vec3(0.55, 0.55, 0.55);',
      '    if(z < 0.62) return vec3(0.95, 0.72, 0.45);',
      '    if(z < 0.78) return vec3(0.98, 0.85, 0.18);',
      '    if(z < 0.92) return vec3(0.98, 0.42, 0.10);',
      '    return vec3(0.92, 0.10, 0.10);',
      '  }',
      '  if(m < 1.5) return clamp(vec3(z*2.2 - 0.35, pow(z, 1.5)*1.4 - 0.2, 0.7 - z*1.5), 0.0, 1.0);',
      '  if(m < 2.5) return 0.5 + 0.5*cos(6.28318*(z + vec3(0.0, 0.33, 0.66)));',
      '  return mix(vec3(0.06, 0.10, 0.24), vec3(0.98, 0.90, 0.62), z);',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float n = max(3.0, floor(u_zones + 0.5));',
      '  float l = clamp((luma(c) - u_lo)/max(1e-3, u_hi - u_lo), 0.0, 1.0);',
      '  float q = floor(l*n)/max(n - 1.0, 1.0);',
      '  vec3 outc = fcPal(clamp(q, 0.0, 1.0), floor(u_mode + 0.5));',
      '  if(u_edge > 0.001){',
      '    float g = length(gradient(uv, 1.0));',
      '    outc = mix(outc, vec3(0.0), clamp(g*1.4, 0.0, 1.0)*u_edge);',
      '  }',
      '  return mix(outc, c, u_blend);',
      '}'
    ].join('\n')
  });

  /* ======================= COR SELETIVA (HSL) ======================= */
  D({
    id: 'seletiva', name: 'Cor seletiva (HSL)', cat: 'cor', color: COR,
    desc: 'escolhe uma faixa de matiz e mexe só nela — matiz, saturação e brilho',
    params: [
      { k: 'hue', label: 'Matiz alvo (°)', min: 0, max: 360, step: 1, def: 20 },
      { k: 'range', label: 'Abertura (°)', min: 2, max: 180, step: 1, def: 40 },
      { k: 'soft', label: 'Suavidade (°)', min: 0, max: 90, step: 1, def: 22 },
      { k: 'dh', label: 'Girar matiz (°)', min: -180, max: 180, step: 1, def: 0 },
      { k: 'ds', label: 'Saturação', min: -1, max: 2, def: 0.4 },
      { k: 'dl', label: 'Brilho', min: -0.5, max: 0.5, def: 0 },
      { k: 'rest', label: 'Saturação do resto', min: -1, max: 1, def: 0 },
      { k: 'view', label: 'Ver a máscara', t: 'b', def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec3 hs = rgb2hsl(c);',
      '  float d = huedist(hs.x, u_hue/360.0)*180.0;',
      '  float k = 1.0 - smoothstep(u_range*0.5, u_range*0.5 + u_soft + 0.001, d);',
      '  k *= smoothstep(0.03, 0.16, hs.y);',
      '  if(u_view > 0.5) return vec3(k);',
      '  vec3 sel = hs;',
      '  sel.x = fract(sel.x + u_dh/360.0);',
      '  sel.y = clamp(sel.y*(1.0 + u_ds), 0.0, 1.0);',
      '  sel.z = clamp(sel.z + u_dl, 0.0, 1.0);',
      '  vec3 other = hs;',
      '  other.y = clamp(other.y*(1.0 + u_rest), 0.0, 1.0);',
      '  return hsl2rgb(mix(other, sel, k));',
      '}'
    ].join('\n')
  });

  /* ===================== P&B ESPECTRAL (FILTRO) ===================== */
  D({
    id: 'monoesp', name: 'P&B espectral', cat: 'cor', color: COR,
    desc: 'preto e branco como no filme: um filtro de lente decide o que fica claro',
    params: [
      { k: 'filt', label: 'Filtro de lente', t: 's', opts: ['Nenhum', 'Amarelo K2', 'Laranja', 'Vermelho 25', 'Verde X1', 'Azul C5', 'Infravermelho'], def: 1 },
      { k: 'mix', label: 'Força do filtro', min: 0, max: 1, def: 1 },
      { k: 'con', label: 'Contraste', min: -1, max: 2, def: 0.25 },
      { k: 'toe', label: 'Pé da curva', min: 0, max: 1, def: 0.2 },
      { k: 'shoulder', label: 'Ombro', min: 0, max: 1, def: 0.35 },
      { k: 'sil', label: 'Prata (micro-contraste)', min: 0, max: 1, def: 0.3 }
    ],
    glsl: [
      'vec3 mespW(float f){',
      '  if(f < 0.5) return vec3(0.2126, 0.7152, 0.0722);',
      '  if(f < 1.5) return vec3(0.42, 0.50, 0.08);',
      '  if(f < 2.5) return vec3(0.58, 0.38, 0.04);',
      '  if(f < 3.5) return vec3(0.82, 0.17, 0.01);',
      '  if(f < 4.5) return vec3(0.16, 0.74, 0.10);',
      '  if(f < 5.5) return vec3(0.10, 0.26, 0.64);',
      '  return vec3(0.62, 0.44, -0.06);',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec3 w = mespW(floor(u_filt + 0.5));',
      '  float l = mix(luma(c), dot(c, w)/max(w.r + w.g + w.b, 0.05), u_mix);',
      '  l = clamp((l - 0.5)*(1.0 + u_con) + 0.5, 0.0, 1.0);',
      '  l = l*(1.0 - u_toe*0.35) + u_toe*0.06;',
      '  l = 1.0 - (1.0 - l)/(1.0 + u_shoulder*(1.0 - l)*1.6);',
      '  if(u_sil > 0.001){',
      '    float b = luma(box3(uv, 2.0));',
      '    l += (l - b)*u_sil*1.3;',
      '  }',
      '  return vec3(clamp(l, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  /* ==================== INFRAVERMELHO FALSA-COR ===================== */
  D({
    id: 'aerocromo', name: 'Infravermelho falsa-cor', cat: 'percepcao', color: PER,
    desc: 'a vegetação responde no infravermelho e vira magenta — o mundo em outra faixa',
    params: [
      { k: 'nir', label: 'Resposta infravermelha', min: 0, max: 2, def: 1 },
      { k: 'shift', label: 'Rotação de camadas', min: 0, max: 1, def: 1 },
      { k: 'hue', t: 'c', label: 'Cor da vegetação', def: '#ff3d9a' },
      { k: 'sky', t: 'c', label: 'Cor do céu', def: '#1e4f8f' },
      { k: 'sat', label: 'Saturação', min: 0, max: 2, def: 1.1 },
      { k: 'halo', label: 'Halo (Wood)', min: 0, max: 1, def: 0.3 },
      { k: 'grain', label: 'Grão', min: 0, max: 1, def: 0.15 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      /* aproximação da resposta NIR: verde e vermelho da clorofila somados,
         menos o azul, que a folha absorve                                 */
      '  float nir = clamp((c.g*1.25 + c.r*0.55 - c.b*0.45)*u_nir, 0.0, 1.6);',
      '  float veg = clamp((c.g - max(c.r, c.b))*3.2, 0.0, 1.0);',
      /* a rotação clássica: NIR→vermelho, vermelho→verde, verde→azul */
      '  vec3 rot = vec3(nir, c.r, c.g);',
      '  vec3 outc = mix(c, rot, u_shift);',
      '  outc = mix(outc, u_hue*max(nir, 0.15), veg*0.75*u_shift);',
      '  float sky = clamp((c.b - max(c.r, c.g))*2.6, 0.0, 1.0)*smoothstep(0.35, 0.8, luma(c));',
      '  outc = mix(outc, u_sky*luma(c)*1.5, sky*0.7*u_shift);',
      '  if(u_halo > 0.001){',
      '    vec3 b = box3(uv, 3.0);',
      '    outc += max(b - 0.5, 0.0)*u_halo*0.9*vec3(1.0, 0.75, 0.9);',
      '  }',
      '  vec3 hv = rgb2hsv(outc);',
      '  hv.y = clamp(hv.y*u_sat, 0.0, 1.0);',
      '  outc = hsv2rgb(hv);',
      '  float n = hash21(floor(uv*uRes/1.5) + floor(uTime*23.0));',
      '  return outc + (n - 0.5)*u_grain*0.3;',
      '}'
    ].join('\n')
  });

  /* ===================== REGISTRO FORA DE ESQUADRO ================== */
  D({
    id: 'registro', name: 'Registro fora de esquadro', cat: 'cor', color: COR,
    desc: 'impressão desalinhada: cada tinta CMYK com deslocamento e giro próprios',
    params: [
      { k: 'cx', label: 'CIANO · X', min: -0.06, max: 0.06, step: 0.0005, def: 0.004 },
      { k: 'cy', label: 'CIANO · Y', min: -0.06, max: 0.06, step: 0.0005, def: 0.002 },
      { k: 'mx', label: 'MAGENTA · X', min: -0.06, max: 0.06, step: 0.0005, def: -0.005 },
      { k: 'my', label: 'MAGENTA · Y', min: -0.06, max: 0.06, step: 0.0005, def: 0.003 },
      { k: 'yx', label: 'AMARELO · X', min: -0.06, max: 0.06, step: 0.0005, def: 0.003 },
      { k: 'yy', label: 'AMARELO · Y', min: -0.06, max: 0.06, step: 0.0005, def: -0.004 },
      { k: 'kx', label: 'PRETO · X', min: -0.06, max: 0.06, step: 0.0005, def: 0 },
      { k: 'ky', label: 'PRETO · Y', min: -0.06, max: 0.06, step: 0.0005, def: 0 },
      { k: 'rot', label: 'Giro entre tintas (°)', min: -3, max: 3, step: 0.01, def: 0.3 },
      { k: 'scl', label: 'Escala entre tintas', min: -0.03, max: 0.03, step: 0.0005, def: 0.003 },
      { k: 'drift', label: 'Deriva no tempo', min: 0, max: 1, def: 0 },
      { k: 'ink', label: 'Densidade da tinta', min: 0, max: 1.5, def: 1 },
      { k: 'paper', t: 'c', label: 'Papel', def: '#efede4' }
    ],
    glsl: [
      'vec2 regUV(vec2 uv, vec2 d, float k){',
      '  vec2 p = uv + d;',
      '  p = 0.5 + rot2(p - 0.5, u_rot*PI/180.0*k);',
      '  p = (p - 0.5)*(1.0 + u_scl*k) + 0.5;',
      '  return p;',
      '}',
      'vec3 fx(vec2 uv){',
      '  float w = sin(uTime*1.7)*u_drift*0.012;',
      '  float c = 1.0 - srccol(regUV(uv, vec2(u_cx, u_cy) + vec2(w, 0.0), 1.0)).r;',
      '  float m = 1.0 - srccol(regUV(uv, vec2(u_mx, u_my) + vec2(0.0, w), -1.0)).g;',
      '  float y = 1.0 - srccol(regUV(uv, vec2(u_yx, u_yy) - vec2(w, w), 2.0)).b;',
      '  float l = luma(srccol(regUV(uv, vec2(u_kx, u_ky), 0.0)));',
      '  float k = clamp(1.0 - l - 0.12, 0.0, 1.0)*0.85;',
      '  c = max(c - k, 0.0); m = max(m - k, 0.0); y = max(y - k, 0.0);',
      '  vec3 outc = u_paper;',
      '  outc *= 1.0 - vec3(0.0, 1.0, 1.0)*c*u_ink;',
      '  outc *= 1.0 - vec3(1.0, 0.0, 1.0)*m*u_ink;',
      '  outc *= 1.0 - vec3(1.0, 1.0, 0.0)*y*u_ink;',
      '  outc *= 1.0 - k*u_ink;',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* =========================== RISOGRAFIA ========================== */
  D({
    id: 'riso', name: 'Risografia', cat: 'pintura', color: '#e2670f',
    desc: 'duas ou três tintas fluorescentes, trama grosseira e registro imperfeito',
    params: [
      { k: 'i1', t: 'c', label: 'Tinta 01', def: '#ff4d8d' },
      { k: 'i2', t: 'c', label: 'Tinta 02', def: '#0f7bd4' },
      { k: 'i3', t: 'c', label: 'Tinta 03', def: '#f5d000' },
      { k: 'inks', label: 'Quantas tintas', min: 1, max: 3, step: 1, def: 2 },
      { k: 'dot', label: 'Grão da trama (px)', min: 1.5, max: 20, def: 5 },
      { k: 'ang', label: 'Ângulo da trama (°)', min: 0, max: 90, step: 1, def: 45 },
      { k: 'off', label: 'Erro de registro', min: 0, max: 0.03, step: 0.0005, def: 0.005 },
      { k: 'ink', label: 'Carga de tinta', min: 0.2, max: 2, def: 1.05 },
      { k: 'paper', t: 'c', label: 'Papel', def: '#f2efe2' },
      { k: 'noise', label: 'Sujeira do rolo', min: 0, max: 1, def: 0.25 },
      { k: 'con', label: 'Contraste da chapa', min: -0.5, max: 2, def: 0.5 }
    ],
    glsl: [
      'float risoScreen(vec2 uv, float v, float ang, float dot_){',
      '  vec2 p = uv*uRes;',
      '  p = rot2(p, ang);',
      '  vec2 g = fract(p/max(dot_, 1.0)) - 0.5;',
      '  float d = length(g)*2.0;',
      '  return smoothstep(d - 0.35, d + 0.35, sqrt(clamp(v, 0.0, 1.0)));',
      '}',
      'float risoSep(vec3 c, vec3 ink){',
      '  vec3 n = ink/max(length(ink), 1e-3);',
      '  float amt = 1.0 - dot(c, n)/max(length(n)*1.0, 1e-3)*0.55;',
      '  return clamp((amt - 0.5)*(1.0 + u_con) + 0.5, 0.0, 1.0);',
      '}',
      'vec3 fx(vec2 uv){',
      '  float n = max(1.0, floor(u_inks + 0.5));',
      '  float a = u_ang*PI/180.0;',
      '  vec3 outc = u_paper;',
      '  for(int i=0;i<3;i++){',
      '    if(float(i) >= n) break;',
      '    vec3 ink = (i == 0) ? u_i1 : (i == 1 ? u_i2 : u_i3);',
      '    vec2 d = vec2(cos(float(i)*2.1), sin(float(i)*2.1))*u_off;',
      '    vec3 c = srccol(uv + d);',
      '    float amt = risoSep(c, ink);',
      '    float s = risoScreen(uv + d, amt, a + float(i)*0.55, u_dot);',
      '    float dirt = hash21(floor((uv + d)*uRes/1.7))*u_noise*0.35;',
      '    s = clamp(s*u_ink - dirt, 0.0, 1.0);',
      '    outc *= mix(vec3(1.0), ink, s);',
      '  }',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* =========================== SERIGRAFIA ========================== */
  D({
    id: 'serigrafia', name: 'Serigrafia', cat: 'pintura', color: '#e2670f',
    desc: 'separação em chapas com limiar duro, meio-tom por chapa e tinta sobreposta',
    params: [
      { k: 'plates', label: 'Chapas', min: 2, max: 6, step: 1, def: 4 },
      { k: 'thr', label: 'Limiar', min: 0, max: 1, def: 0.5 },
      { k: 'spread', label: 'Distância entre chapas', min: 0.02, max: 0.6, def: 0.18 },
      { k: 'dot', label: 'Trama (px)', min: 1, max: 24, def: 6 },
      { k: 'ang', label: 'Ângulo base (°)', min: 0, max: 90, step: 1, def: 15 },
      { k: 'c1', t: 'c', label: 'Chapa 01', def: '#16150f' },
      { k: 'c2', t: 'c', label: 'Chapa 02', def: '#d0271b' },
      { k: 'c3', t: 'c', label: 'Chapa 03', def: '#1b4fd8' },
      { k: 'c4', t: 'c', label: 'Chapa 04', def: '#f5d000' },
      { k: 'bg', t: 'c', label: 'Papel', def: '#efede4' },
      { k: 'bleed', label: 'Sangramento', min: 0, max: 1, def: 0.25 }
    ],
    glsl: [
      'vec3 sgPlate(int i){',
      '  if(i == 0) return u_c1;',
      '  if(i == 1) return u_c2;',
      '  if(i == 2) return u_c3;',
      '  return u_c4;',
      '}',
      'vec3 fx(vec2 uv){',
      '  float n = max(2.0, floor(u_plates + 0.5));',
      '  vec3 outc = u_bg;',
      '  for(int i=0;i<6;i++){',
      '    if(float(i) >= n) break;',
      '    float f = float(i)/max(n - 1.0, 1.0);',
      '    vec2 d = vec2(cos(float(i)*1.9), sin(float(i)*1.9))*u_spread*0.02;',
      '    vec3 c = srccol(uv + d);',
      '    float l = 1.0 - luma(c);',
      '    float lvl = u_thr + (f - 0.5)*u_spread*2.0;',
      '    float bleed = (fbm(uv*uRes/22.0) - 0.5)*u_bleed*0.16;',
      '    float on = smoothstep(lvl - 0.02 + bleed, lvl + 0.02 + bleed, l);',
      '    vec2 p = rot2((uv + d)*uRes, (u_ang + float(i)*22.0)*PI/180.0);',
      '    vec2 g = fract(p/max(u_dot, 1.0)) - 0.5;',
      '    float scr = smoothstep(length(g)*2.0 - 0.3, length(g)*2.0 + 0.3, sqrt(on));',
      '    outc = mix(outc, sgPlate(i), clamp(scr, 0.0, 1.0)*0.92);',
      '  }',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ==================== CINTILÂNCIA DE EXPOSIÇÃO ==================== */
  D({
    id: 'flicker', name: 'Cintilância de exposição', cat: 'cor', color: COR,
    desc: 'a exposição varia de quadro em quadro, como uma câmera de corda',
    params: [
      { k: 'amt', label: 'Variação', min: 0, max: 1, def: 0.28 },
      { k: 'rate', label: 'Velocidade', min: 0.5, max: 60, step: 0.5, def: 16 },
      { k: 'irreg', label: 'Irregularidade', min: 0, max: 1, def: 0.6 },
      { k: 'drop', label: 'Quadros queimados', min: 0, max: 1, def: 0.06 },
      { k: 'warm', label: 'Esquentar quando abre', min: 0, max: 1, def: 0.4 },
      { k: 'con', label: 'Contraste junto', min: 0, max: 1, def: 0.3 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float f = floor(uTime*max(u_rate, 0.5));',
      '  float a = hash11(f)*2.0 - 1.0;',
      '  float b = sin(uTime*max(u_rate, 0.5)*0.63);',
      '  float k = mix(b, a, u_irreg)*u_amt;',
      '  float burn = step(1.0 - u_drop*0.25, hash11(f + 91.7));',
      '  k += burn*0.9;',
      '  c *= pow(2.0, k);',
      '  c = (c - 0.5)*(1.0 + k*u_con) + 0.5;',
      '  c = mix(c, c*vec3(1.10, 1.0, 0.86), max(k, 0.0)*u_warm);',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* ======================= QUEIMA DE PELÍCULA ======================= */
  D({
    id: 'queima', name: 'Queima de película', cat: 'cor', color: COR,
    desc: 'a emulsão para no projetor e derrete: bolha, anel de brasa e furo branco',
    params: [
      { k: 'prog', label: 'Avanço da queima', min: 0, max: 1.4, def: 0.4 },
      { k: 'x', label: 'Foco X', min: 0, max: 1, def: 0.55 },
      { k: 'y', label: 'Foco Y', min: 0, max: 1, def: 0.5 },
      { k: 'irreg', label: 'Irregularidade', min: 0, max: 2, def: 1 },
      { k: 'edge', label: 'Largura da brasa', min: 0.01, max: 0.5, def: 0.12 },
      { k: 'hot', t: 'c', label: 'Cor da brasa', def: '#ff7a18' },
      { k: 'char', t: 'c', label: 'Cor da borda', def: '#3a1c08' },
      { k: 'hole', t: 'c', label: 'Cor do furo', def: '#fff6e2' },
      { k: 'boil', label: 'Fervura', min: 0, max: 3, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec2 p = (uv - vec2(u_x, u_y));',
      '  p.x *= uAspect;',
      '  float d = length(p);',
      '  float n = fbm3(uv*7.0, uTime*0.5*u_boil);',
      '  d += (n - 0.5)*u_irreg*0.30;',
      '  float r = u_prog*0.9;',
      '  float e = max(u_edge, 0.01);',
      '  float hole = 1.0 - smoothstep(r - e*0.25, r, d);',
      '  float ember = smoothstep(r - e, r - e*0.2, d)*(1.0 - smoothstep(r + e*0.35, r + e*1.5, d));',
      '  float charr = smoothstep(r + e*0.2, r + e*0.5, d)*(1.0 - smoothstep(r + e*1.4, r + e*3.0, d));',
      '  vec3 outc = c;',
      '  outc = mix(outc, u_char, charr*0.85);',
      '  outc = mix(outc, u_hot*(1.4 + n), ember);',
      '  outc = mix(outc, u_hole, hole);',
      '  return outc;',
      '}'
    ].join('\n')
  });

  /* ============================ RELEVO ============================= */
  D({
    id: 'relevo', name: 'Relevo com luz', cat: 'percepcao', color: PER,
    desc: 'a imagem vira superfície: a luminância é altura e uma luz raspa a superfície',
    params: [
      { k: 'height', label: 'Altura', min: 0, max: 4, def: 1.4 },
      { k: 'light', label: 'Direção da luz (°)', min: 0, max: 360, step: 1, def: 135 },
      { k: 'elev', label: 'Elevação da luz', min: 0.05, max: 1, def: 0.4 },
      { k: 'r', label: 'Escala do relevo', min: 0.5, max: 12, def: 2 },
      { k: 'amb', label: 'Luz ambiente', min: 0, max: 1, def: 0.35 },
      { k: 'spec', label: 'Brilho especular', min: 0, max: 2, def: 0.45 },
      { k: 'keep', label: 'Manter a cor', min: 0, max: 1, def: 0.35 },
      { k: 'mat', t: 'c', label: 'Cor do material', def: '#cfcab6' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec2 g = gradient(uv, u_r)*u_height;',
      '  vec3 nrm = normalize(vec3(-g.x, -g.y, 1.0));',
      '  float a = u_light*PI/180.0;',
      '  vec3 L = normalize(vec3(cos(a), sin(a), max(u_elev, 0.05)*2.0));',
      '  float dif = max(dot(nrm, L), 0.0);',
      '  vec3 V = vec3(0.0, 0.0, 1.0);',
      '  vec3 Hh = normalize(L + V);',
      '  float sp = pow(max(dot(nrm, Hh), 1e-6), 26.0)*u_spec;',
      '  vec3 mat = mix(u_mat, c, u_keep);',
      '  return mat*(u_amb + dif*(1.0 - u_amb)) + sp;',
      '}'
    ].join('\n')
  });

  /* ========================= CAMPO DE BORDAS ======================= */
  D({
    id: 'campoborda', name: 'Campo de bordas', cat: 'percepcao', color: PER,
    desc: 'a borda não é só detectada: vira uma estrutura de traços que anda com o tempo',
    params: [
      { k: 'thr', label: 'Limiar', min: 0, max: 1, def: 0.16 },
      { k: 'gain', label: 'Ganho', min: 0.2, max: 6, def: 1.8 },
      { k: 'r', label: 'Escala', min: 0.5, max: 8, def: 1.4 },
      { k: 'len', label: 'Comprimento do traço', min: 0, max: 30, def: 9 },
      { k: 'flow', label: 'Correr no tempo', min: 0, max: 3, def: 0.8 },
      { k: 'dens', label: 'Densidade', min: 2, max: 60, def: 18 },
      { k: 'bg', t: 'c', label: 'Fundo', def: '#0e0d0a' },
      { k: 'ink', t: 'c', label: 'Traço', def: '#efede4' },
      { k: 'keep', label: 'Deixar ver a imagem', min: 0, max: 1, def: 0 },
      { k: 'chan', label: 'Cor do traço pela imagem', min: 0, max: 1, def: 0.4 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 base = srccol(uv);',
      '  vec2 g = gradient(uv, u_r);',
      '  float mag = clamp((length(g) - u_thr)*u_gain, 0.0, 1.0);',
      /* a direção do traço acompanha a borda (perpendicular ao gradiente) */
      '  float a = atan(g.y, g.x) + PI*0.5;',
      '  vec2 dir = vec2(cos(a), sin(a));',
      '  vec2 p = uv*uRes/max(u_dens, 2.0);',
      /* coordenada ao longo da borda: risca contínua em vez de pontinhos */
      '  float s = dot(p, dir) + uTime*u_flow*2.0;',
      '  float across = dot(p, vec2(-dir.y, dir.x));',
      '  float line = smoothstep(0.42, 0.08, abs(fract(across) - 0.5));',
      '  float dash = u_len < 0.5 ? 1.0 : smoothstep(0.0, 0.35, fract(s/max(u_len*0.12, 0.05)));',
      '  float ink = clamp(mag*line*dash, 0.0, 1.0);',
      '  vec3 col = mix(u_ink, base*1.6, u_chan);',
      '  vec3 outc = mix(u_bg, col, ink);',
      '  return mix(outc, base, u_keep);',
      '}'
    ].join('\n')
  });

  /* ================= DESLOCAMENTO POR LUMINÂNCIA ================== */
  D({
    id: 'lumadesl', name: 'Deslocamento por luminância', cat: 'percepcao', color: PER,
    desc: 'a própria luz da imagem empurra os pixels: o claro vem, o escuro recua',
    params: [
      { k: 'amt', label: 'Deslocamento', min: -0.5, max: 0.5, def: 0.09 },
      { k: 'ang', label: 'Direção (°)', min: 0, max: 360, step: 1, def: 90 },
      { k: 'radial', label: 'Radial', min: 0, max: 1, def: 0 },
      { k: 'piv', label: 'Ponto neutro', min: 0, max: 1, def: 0.5 },
      { k: 'gamma', label: 'Curva', min: 0.2, max: 4, def: 1 },
      { k: 'sep', label: 'Separar canais', min: 0, max: 1, def: 0.25 },
      { k: 'steps', label: 'Passos (rastro)', min: 1, max: 12, step: 1, def: 1 },
      { k: 'blur', label: 'Suavizar o mapa', min: 0, max: 6, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float l = luma(u_blur > 0.05 ? box3(uv, u_blur) : srccol(uv));',
      '  float k = pow(clamp(l, 1e-6, 1.0), max(u_gamma, 0.05)) - u_piv;',
      '  float a = u_ang*PI/180.0;',
      '  vec2 dir = vec2(cos(a)/max(uAspect, 0.001), sin(a));',
      '  vec2 rad = normalize(uv - 0.5 + 1e-5);',
      '  rad.x /= max(uAspect, 0.001);',
      '  dir = mix(dir, rad, u_radial);',
      '  int n = int(max(1.0, floor(u_steps + 0.5)));',
      '  vec3 acc = vec3(0.0); float wsum = 0.0;',
      '  for(int i=0;i<12;i++){',
      '    if(i >= n) break;',
      '    float f = (float(i) + 1.0)/float(n);',
      '    vec2 d = dir*u_amt*k*f;',
      '    float w = 1.0 - f*0.55;',
      '    vec3 c;',
      '    if(u_sep > 0.001){',
      '      c = vec3(srccol(uv + d*(1.0 + u_sep)).r,',
      '               srccol(uv + d).g,',
      '               srccol(uv + d*(1.0 - u_sep)).b);',
      '    } else c = srccol(uv + d);',
      '    acc += c*w; wsum += w;',
      '  }',
      '  return acc/max(wsum, 1e-3);',
      '}'
    ].join('\n')
  });

  /* ======================= PROFUNDIDADE FALSA ====================== */
  D({
    id: 'profundidade', name: 'Profundidade falsa', cat: 'percepcao', color: PER,
    desc: 'o claro vem para a frente e o escuro recua: paralaxe, névoa e foco por camada',
    params: [
      { k: 'par', label: 'Paralaxe', min: 0, max: 0.25, def: 0.05 },
      { k: 'ang', label: 'Direção (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'sway', label: 'Balanço no tempo', min: 0, max: 2, def: 0.6 },
      { k: 'inv', label: 'Inverter profundidade', t: 'b', def: 0 },
      { k: 'fog', label: 'Névoa no fundo', min: 0, max: 1, def: 0.4 },
      { k: 'fogc', t: 'c', label: 'Cor da névoa', def: '#8fa6bb' },
      { k: 'dof', label: 'Desfoque do fundo', min: 0, max: 6, def: 2 },
      { k: 'plane', label: 'Plano de foco', min: 0, max: 1, def: 0.6 },
      { k: 'smooth', label: 'Suavizar o mapa', min: 0, max: 6, def: 2 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float d = luma(u_smooth > 0.05 ? box3(uv, u_smooth) : srccol(uv));',
      '  if(u_inv > 0.5) d = 1.0 - d;',
      '  float a = u_ang*PI/180.0 + sin(uTime*u_sway)*0.9;',
      '  vec2 dir = vec2(cos(a)/max(uAspect, 0.001), sin(a));',
      '  float amp = u_par*(d - 0.5)*2.0*(0.4 + 0.6*abs(sin(uTime*u_sway*0.7)));',
      '  vec2 p = uv + dir*amp;',
      '  float dd = luma(box3(p, max(u_smooth, 0.5)));',
      '  if(u_inv > 0.5) dd = 1.0 - dd;',
      '  float far = clamp(abs(dd - u_plane)*2.0, 0.0, 1.0);',
      '  vec3 c = u_dof > 0.05 ? mix(srccol(p), box3(p, u_dof), far) : srccol(p);',
      '  c = mix(c, u_fogc, (1.0 - dd)*u_fog*0.85);',
      '  return c;',
      '}'
    ].join('\n')
  });

})(window.VE);
