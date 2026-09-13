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

   SEGUNDA VOLTA (11/09/2026): o Bruno achou os pacotes de 8 mm,
   Super 8 e 16 mm "muito forçados, horríveis", e mandou os prints do
   app 8mm Vintage Camera (e do Super 16) como régua. Ele tinha razão:
   cada pacote empilhava OITO efeitos, todos no talo — grão grosso e
   colorido, poeira, riscos, cabelo, tremor contínuo, vazamento
   pulsando, flash de rolo a cada dois segundos, halação, duas vinhetas.
   O app faz quase nada, e é por isso que parece filme:

     · a JANELA de canto redondo com uma SOMBRA MACIA que acompanha a
       borda (não uma vinheta radial), preto fora;
     · a cor DESBOTADA: preto levantado, altas luzes comprimidas,
       saturação contida, e um tom por filme (60s: sombras magenta e
       luzes amarelo-esverdeadas; Two-Color: sombras teal e luzes
       rosadas; 1920, Siena, Sakura, Indigo, XPro, Noir…);
     · imagem MACIA, grão FINO e baixo, cintilação leve, um vazamento
       discreto na borda esquerda de vez em quando, jitter raro;
     · e a CADÊNCIA: 18 quadros por segundo no 8 mm e no Super 8, 24 no
       16 mm. É o tranco que mais diz "filme", e não existia aqui.

   Daí: a janela ganhou SOMBRA e CINTILAÇÃO; o grão ganhou SUAVIDADE;
   entrou a CADÊNCIA (memória própria do motor, gl.js); os pacotes foram
   refeitos com metade dos efeitos e um décimo dos valores; e os filmes
   do app viraram a família 8 MM da galeria de filtros (filters.js).
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
      /* LARGA: a janela é uma fração do quadro, seja ele qual for (o desenho
         antigo). DA BITOLA: a janela tem a proporção do filme (4:3 no 8 mm)
         pela altura do quadro — é o que o app faz, com as barras pretas
         dos lados num vídeo 16:9. A imagem é recortada, não espremida.  */
      { k: 'forma', t: 's', label: 'Forma da janela', def: 0, opts: ['LARGA (do quadro)', 'DA BITOLA (4:3 no 8 mm)'] },
      { k: 'tam', label: 'Tamanho (da altura do quadro)', min: 0.4, max: 1, def: 0.88 },
      { k: 'zoom', label: 'Sangria (encher a janela)', min: 0.6, max: 1.6, def: 1.06 },
      { k: 'soft', label: 'Maciez da borda', min: 0, max: 0.12, def: 0.012 },
      { k: 'round', label: 'Canto arredondado', min: 0, max: 2, def: 1 },
      { k: 'holes', t: 'b', label: 'Perfurações na lateral', def: 0 },
      { k: 'holeSide', t: 's', label: 'Lado das perfurações', def: 0, opts: ['Esquerda', 'Direita', 'Os dois'] },
      { k: 'weave', label: 'Tremor da janela', min: 0, max: 1, def: 0.22 },
      { k: 'weaveSpd', label: 'Velocidade do tremor', min: 0.2, max: 8, def: 2.4 },
      { k: 'vig', label: 'Queda de luz nos cantos', min: 0, max: 1.5, def: 0.2 },
      /* a sombra do app: escurece a faixa junto da borda, seguindo o canto
         redondo — é o que faz a janela parecer uma janela e não um recorte */
      { k: 'sombra', label: 'Sombra da borda', min: 0, max: 1, def: 0.5 },
      { k: 'sombraW', label: 'Largura da sombra', min: 0.01, max: 0.3, def: 0.08 },
      { k: 'flick', label: 'Cintilação', min: 0, max: 1, def: 0.06 },
      { k: 'flickHz', label: 'Ritmo da cintilação', min: 4, max: 48, step: 1, def: 18 },
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
      /* da bitola: altura = tam do quadro, largura pela proporção do filme,
         nas mesmas unidades (a altura do quadro vale 1 depois do uAspect) */
      '  if(u_forma > 0.5){ b = vec2(u_tam*spec.w, u_tam)*0.5; r = spec.z*u_round*min(b.x, b.y)*2.0; }',
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
      /* a sombra da borda: d é a distância com sinal ao canto redondo
         (negativa dentro); a faixa de largura sombraW junto da borda
         escurece, com a mesma forma da janela                          */
      '  float sombra = 1.0 - smoothstep(-max(u_sombraW, 0.005), 0.0, d)*u_sombra;',
      /* cintilação: o obturador e a lâmpada, quadro a quadro */
      '  float cint = 1.0 + (hash11(floor(uTime*u_flickHz)) - 0.5)*u_flick*0.5;',
      '  vec3 rgb = col.rgb*vig*sombra*cint;',
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
      { k: 'grain', label: 'Textura do vazamento', min: 0, max: 1, def: 0.3 },
      /* no filme de verdade o vazamento não é permanente: entra e sai, em
         alguns trechos do rolo. Com 0, é constante (o desenho antigo). */
      { k: 'raro', label: 'Vem e vai (chance por trecho)', min: 0, max: 1, def: 0 }
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
      /* vem e vai: trechos de ~3 s; em cada um, ou aparece (uma subida e
         descida macias) ou não aparece                                  */
      '  if(u_raro > 0.001){',
      '    float sl = floor(uTime*0.3);',
      '    float on = step(1.0 - u_raro, hash11(sl*3.7 + 0.5));',
      '    k *= on*sin(fract(uTime*0.3)*3.14159);',
      '  }',
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

  /* QUEIMADURA DE FILME — o "film burn" das vinhetas de estoque, RECONSTRUÍDO
     pela medida de um clipe de referência (13/09/2026, 5,5 s a 15 leituras
     por segundo): nada; uma BANDA VERTICAL quente que sobe em 0,5 s, segura
     0,5 s e atravessa o quadro (coluna 11/32 → 31/32 em 0,9 s) enquanto um
     halo largo alaranja tudo; apaga em 0,4 s; depois a BRASA — borrões
     vermelhos fracos pulsando por ~1,5 s — e às vezes um RELÂMPAGO de um
     quadro só na beira por onde a banda saiu. A paleta é uma rampa de
     calor lida do próprio clipe: (60,12,9) → (155,25,0) → (247,90,0) →
     (255,215,30) → quase branco. É um efeito de TEMPO: cada evento é
     sorteado num intervalo (FREQUÊNCIA eventos por 10 s) e entre eles não
     há nada — como no rolo de verdade.                                 */
  VE.def({
    id: 'queimadura', name: 'Queimadura de filme', cat: 'pelicula', color: '#ff7a1a',
    desc: 'o film burn: a banda de fogo que atravessa o quadro, o halo laranja, a brasa que fica e o relâmpago na beira — vem e vai',
    params: [
      { k: 'amt', label: 'Intensidade', min: 0, max: 2, def: 1 },
      { k: 'freq', label: 'Frequência (eventos por 10 s)', min: 0.2, max: 8, step: 0.1, def: 2.5 },
      { k: 'dur', label: 'Duração de cada queimadura (s)', min: 0.3, max: 4, def: 1.3 },
      { k: 'lado', t: 's', label: 'Sentido', def: 0, opts: ['Sorteado', 'Da esquerda', 'Da direita'] },
      { k: 'halo', label: 'Halo (o quadro inteiro alaranja)', min: 0, max: 1, def: 0.5 },
      { k: 'brasa', label: 'Brasa depois (borrões que pulsam)', min: 0, max: 1, def: 0.6 },
      { k: 'beira', label: 'Relâmpago na beira', min: 0, max: 1, def: 0.6 },
      { k: 'tremer', label: 'A banda treme', min: 0, max: 1, def: 0.5 },
      { k: 'quente', label: 'Calor (mais amarelo)', min: 0, max: 1, def: 0.5 },
      { k: 'semente', label: 'Semente', min: 0, max: 99, step: 1, def: 3 }
    ],
    glsl: [
      /* envelope de um evento: sobe rápido, segura, apaga */
      'float qEnv(float u){ return smoothstep(0.0, 0.34, u)*(1.0 - smoothstep(0.66, 1.0, u)); }',
      /* a rampa de calor, lida do clipe: preto → vermelho fundo → laranja → amarelo → quase branco */
      'vec3 qCalor(float i, float q){',
      '  vec3 c = mix(vec3(0.0), vec3(0.24, 0.05, 0.035), smoothstep(0.0, 0.22, i));',
      '  c = mix(c, vec3(0.61, 0.10, 0.0), smoothstep(0.22, 0.5, i));',
      '  c = mix(c, vec3(0.97, 0.36, 0.0), smoothstep(0.5, 0.78, i));',
      '  c = mix(c, mix(vec3(1.0, 0.62, 0.05), vec3(1.0, 0.86, 0.14), q), smoothstep(0.78, 1.0, i));',
      '  c = mix(c, vec3(1.0, 0.97, 0.86), smoothstep(1.0, 1.35, i));',
      '  return c;',
      '}',
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float P = 10.0/max(u_freq, 0.1);',
      '  float I = 0.0;',
      /* dois eventos podem se sobrepor: o desta vaga e o da anterior */
      '  for(int k = 0; k < 2; k++){',
      '    float j = floor(uTime/P) - float(k) + u_semente*97.0;',
      '    float t0 = (j - u_semente*97.0)*P + hash11(j*3.7 + 0.5)*P*0.55;',
      '    float dur = u_dur*(0.7 + 0.6*hash11(j*5.1 + 0.9));',
      '    float u = (uTime - t0)/dur;',
      '    if(u < 0.0 || u > 2.4) continue;',
      /* o sentido: sorteado, ou o pedido */
      '    float dir = (u_lado < 0.5) ? (step(0.5, hash11(j*2.3 + 0.7))*2.0 - 1.0) : (u_lado < 1.5 ? 1.0 : -1.0);',
      '    float e = qEnv(min(u, 1.0));',
      /* a VARREDURA: a banda quente atravessa de fora a fora; a borda dela
         treme (ruído em y, andando no tempo)                            */
      '    float x0 = 0.5 + dir*(u*1.4 - 0.7);',
      /* a borda da banda é irregular (fbm, não senoide) e a banda é LARGA e
         macia, como no clipe: o miolo ocupa ~20% do quadro, o halo vai
         atrás dela mais longe do que na frente (o rastro)               */
      '    float wob = (fbm(vec2(uv.y*1.7 + j*0.37, uTime*0.9)) - 0.5)*0.34*u_tremer;',
      '    float dx = (uv.x - x0 - wob)*dir;',
      '    float sb = dx < 0.0 ? 0.16 : 0.11;',
      '    float banda = exp(-dx*dx/(2.0*sb*sb));',
      '    float sh = dx < 0.0 ? 0.55 : 0.34;',
      '    float halo = exp(-dx*dx/(2.0*sh*sh));',
      '    float vert = 0.8 + 0.4*vnoise(vec2(uv.y*1.3 + j, uTime*0.5));',
      '    float text = 0.85 + 0.3*fbm(vec2(uv.x*2.0 + uTime*0.4, uv.y*2.0 + j));',
      '    I += e*vert*(0.78*banda + 0.62*halo*u_halo*text);',
      /* a BRASA: depois da varredura, um borrão que pulsa e esfria */
      '    float ub = (uTime - t0 - dur)/(dur*1.3);',
      '    if(ub > 0.0 && ub < 1.0){',
      '      vec2 pb = vec2(hash11(j*4.4 + 0.2), hash11(j*6.6 + 0.4))*0.6 + 0.2;',
      '      float db = length((uv - pb)*vec2(1.0, 1.4));',
      '      float pulsa = 0.6 + 0.4*vnoise(vec2(uTime*2.6, j*1.7));',
      '      I += u_brasa*(1.0 - ub)*pulsa*0.42*exp(-db*db/(2.0*0.24*0.24));',
      '    }',
      /* o RELÂMPAGO na beira por onde a banda saiu: um quadro só, quase branco */
      '    if(u_beira > 0.001 && hash11(j*8.8 + 0.3) < u_beira){',
      '      float ue = (uTime - t0 - dur*0.96)/(dur*0.07);',
      '      float xe = dir > 0.0 ? 1.0 : 0.0;',
      '      I += smoothstep(0.0, 0.5, ue)*(1.0 - smoothstep(0.5, 1.0, ue))*1.15*exp(-abs(uv.x - xe)*18.0);',
      '    }',
      '  }',
      '  I *= u_amt;',
      '  if(I < 0.002) return c;',
      '  vec3 q = qCalor(I, u_quente);',
      /* a luz da queimadura ENTRA na imagem: tela (o que já é claro fica
         claro) e o miolo estoura para o branco                         */
      '  c = 1.0 - (1.0 - c)*(1.0 - q);',
      '  c += q*q*0.35;',
      '  return clamp(c, 0.0, 1.0);',
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
      { k: 'amt', label: 'Intensidade', min: 0, max: 1, def: 0.14 },
      { k: 'shadow', label: 'Mais grão nas sombras', min: 0, max: 1, def: 0.7 },
      { k: 'color', label: 'Grão colorido', min: 0, max: 1, def: 0.1 },
      /* o "smoothness" do Super 16: grão duro é ruído de sensor; grão de
         prata é uma nuvem — o suave mistura o ruído de valor, contínuo */
      { k: 'suave', label: 'Suavidade do grão', min: 0, max: 1, def: 0.4 },
      { k: 'fps', label: 'Cadência do grão', min: 6, max: 60, step: 1, def: 18 },
      /* desligado, o grão não é sorteado de novo: fica FIXO no filme (e
         anda com ele, porque o tremor da janela vem depois na cadeia) */
      { k: 'ferver', t: 'b', label: 'Grão vivo (sorteia a cada quadro)', def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      /* célula do grão em pixels do quadro: 1/sc. Era 3,3 px no 8 mm (0,30)
         — grosso demais para 1080p; o app tem grão de 1–2 px, macio.     */
      '  float sizes[4];',
      '  sizes[0] = 0.55; sizes[1] = 0.68; sizes[2] = 0.84; sizes[3] = 1.00;',
      '  float sc = sizes[int(clamp(u_fmt, 0.0, 3.0))];',
      /* O QUADRO NOVO É OUTRO SORTEIO, NÃO O MESMO DESLOCADO. O desenho
         antigo somava o número do quadro à coordenada (`floor(uv*uRes*sc)
         + tk`): a rede de ruído andava UMA CÉLULA NA DIAGONAL por quadro,
         e o grão inteiro "voava" de um canto ao outro — 60 px/s no 8 mm.
         Agora o quadro entra como um SALTO aleatório grande na rede: cada
         quadro é um grão novo, parado no lugar.                          */
      '  float tk = u_ferver > 0.5 ? floor(uTime*u_fps) : 0.0;',
      '  vec2 salto = floor(vec2(hash11(tk*1.31 + 0.7), hash11(tk*2.17 + 0.3))*1024.0);',
      '  vec2 gp = floor(uv*uRes*sc) + salto;',
      '  float g = hash21(gp) - 0.5;',
      '  float gr = hash21(gp + 17.3) - 0.5;',
      '  float gb = hash21(gp + 91.7) - 0.5;',
      '  if(u_suave > 0.001){',
      '    vec2 q = uv*uRes*sc*0.5 + salto*0.37;',
      '    float sm = (vnoise(q) - 0.5)*2.2;',
      '    g = mix(g, sm, u_suave); gr = mix(gr, (vnoise(q + 31.0) - 0.5)*2.2, u_suave); gb = mix(gb, (vnoise(q + 67.0) - 0.5)*2.2, u_suave);',
      '  }',
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
      /* poeira: pontos que trocam a cada quadro — o quadro entra como um
         salto aleatório na rede de células, não somado a ela (ver o grão) */
      '  if(u_dust > 0.001){',
      '    vec2 dp = uv*uRes/(9.0*max(u_dustSize, 0.05));',
      '    vec2 salto = floor(vec2(hash11(fr*1.77 + 0.2), hash11(fr*2.93 + 0.6))*512.0);',
      '    vec2 cell = floor(dp) + salto;',
      '    vec2 f = fract(dp) - 0.5;',
      '    vec2 off = hash22(cell) - 0.5;',
      '    float pick = hash21(cell*1.7);',
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

  /* ================================================== CADÊNCIA ============
     O 8 mm roda a 18 quadros por segundo e a tela a 60: o que mais diz
     "filme" é o tranco. Este efeito SEGURA o quadro pelo ritmo pedido —
     com a memória própria do motor (gl.js): a passada 0 guarda o quadro
     no instante em que o relógio vira, e devolve o guardado nos outros;
     a última passada só o mostra. Vale na prévia e na exportação (que
     anda pelo tempo da composição, não pelo da tela).
     O alfa do quadro guardado é o índice do relógio, então o alfa que
     sai é o do quadro ATUAL — só importa em clipe transparente em
     movimento.                                                          */
  D({
    id: 'cadencia', name: 'Cadência de projeção', cat: 'pelicula', color: '#c98b3a',
    passes: 2, memoria: true, memPass: 0, tempo: true,
    desc: 'segura o quadro no ritmo da câmera: 18 por segundo no 8 mm e no Super 8, 24 no 16 mm — o tranco que diz filme',
    params: [
      { k: 'fps', label: 'Quadros por segundo', min: 4, max: 30, step: 1, def: 18 }
    ],
    glsl: [
      'float cdQuadro(){ float fq = floor(uTime*max(u_fps, 1.0)); return (fq - 255.0*floor(fq/255.0) + 1.0)/255.0; }',
      'vec4 fxStep(vec2 uv){',
      '  vec4 old = texture(uMem, uv);',
      '  float idx = cdQuadro();',
      '  if(old.a > 0.0 && abs(idx - old.a) < 0.5/255.0) return old;',
      '  return vec4(texture(uOrig, uv).rgb, idx);',
      '}',
      'vec3 fxLast(vec2 uv){ return texture(uTex, uv).rgb; }'
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
  /* Os quatro pacotes de bitola, pela régua do 8mm Vintage Camera: metade
     dos efeitos, um décimo dos valores. A ordem importa — a cadência
     primeiro (segura o quadro), a maciez e a cor no quadro seguro, o grão
     por cima, e a janela por último, que é quem enquadra tudo.          */
  VE.STYLES.push(
    {
      id: 'p8mm', name: '8 mm caseiro', desc: '18 quadros por segundo, imagem macia, cor desbotada e a janela com sombra — o 8mm Vintage Camera',
      fx: [
        /* MEDIDO na saída do app (12/09/2026, a carta de calibração filmada):
           borda 10–90% de 10 px em 960 (σ ≈ 3,6 px → raio 0,3), grão com
           desvio ≈ 1 nível e célula de 2 px, cintilação 0,06% (nada),
           tremor só vertical e esporádico (≤ 0,5% da altura), a janela
           preta quase no limite do quadro com sombra de ~3% — e nada de
           beira de filme nem perfuração (ele pediu para tirar).       */
        ['cadencia', { fps: 18 }],
        ['blur', { rad: 0.3, mixv: 0.6 }],
        ['filmstock', { exp: 0.03, con: 0.02, sat: -0.1, temp: 0.16, tintg: -0.05, fade: 0.11, roll: 0.5, split: 0.36, shTint: '#33262f', hiTint: '#f7eec2', vig: 0.08, grain: 0, sharp: 0 }],
        ['filmgrain', { fmt: 0, amt: 0.035, shadow: 0.6, color: 0.15, suave: 0.3, fps: 18 }],
        ['dustscratch', { dust: 0.02, dustSize: 0.3, scratch: 0, hair: 0.008, fps: 12 }],
        ['gateweave', { amt: 0.02, spd: 1.0, rot: 0, jump: 0.06, jumpRate: 2.5 }],
        ['lightleak', { amt: 0.3, side: 0, width: 0.22, spd: 0.25, flick: 0.15, bloom: 0.7, raro: 0.35 }],
        ['filmgate', { fmt: 0, forma: 1, tam: 0.97, zoom: 1.0, soft: 0.008, round: 0.6, vig: 0.12, sombra: 0.8, sombraW: 0.04, flick: 0.005, flickHz: 18, weave: 0.02 }]
      ]
    },
    {
      id: 'psuper8', name: 'Super 8', desc: 'o mesmo tranco de 18, quadro maior, um pouco mais nítido e quente',
      fx: [
        ['cadencia', { fps: 18 }],
        ['blur', { rad: 0.24, mixv: 0.5 }],
        ['filmstock', { exp: 0.03, con: 0.06, sat: -0.04, temp: 0.2, tintg: -0.03, fade: 0.1, roll: 0.5, split: 0.34, shTint: '#30241e', hiTint: '#ffeec8', vig: 0.06, grain: 0, sharp: 0 }],
        ['filmgrain', { fmt: 1, amt: 0.03, shadow: 0.6, color: 0.15, suave: 0.3, fps: 18 }],
        ['dustscratch', { dust: 0.016, dustSize: 0.3, scratch: 0, hair: 0.006, fps: 12 }],
        ['gateweave', { amt: 0.015, spd: 1.0, rot: 0, jump: 0.05, jumpRate: 2 }],
        ['lightleak', { amt: 0.22, side: 0, width: 0.2, spd: 0.2, flick: 0.12, bloom: 0.7, raro: 0.25 }],
        ['filmgate', { fmt: 1, forma: 1, tam: 0.97, zoom: 1.0, soft: 0.008, round: 0.55, vig: 0.1, sombra: 0.75, sombraW: 0.035, flick: 0.005, flickHz: 18, weave: 0.02 }]
      ]
    },
    {
      id: 'p16mm', name: '16 mm documentário', desc: '24 por segundo, cor neutra de negativo (250D), grão fino — o Super 16',
      fx: [
        ['cadencia', { fps: 24 }],
        ['blur', { rad: 0.04, mixv: 0.4 }],
        ['filmstock', { exp: 0, con: 0.12, sat: -0.02, temp: 0.04, fade: 0.07, roll: 0.4, split: 0.24, shTint: '#1e2428', hiTint: '#fff2de', vig: 0.06, grain: 0, sharp: 0.1 }],
        ['filmgrain', { fmt: 2, amt: 0.06, shadow: 0.6, color: 0.08, suave: 0.4, fps: 24 }],
        ['gateweave', { amt: 0.025, spd: 1.0, rot: 0.02, jump: 0.02, jumpRate: 0.06 }],
        ['filmgate', { fmt: 2, zoom: 1.02, soft: 0.007, round: 0.9, vig: 0.06, sombra: 0.35, sombraW: 0.06, flick: 0.01, flickHz: 24, weave: 0.02, holes: 0 }]
      ]
    },
    {
      id: 'p35mm', name: '35 mm', desc: 'grão fino, janela quase quadrada, quase nada além da cor',
      fx: [
        ['filmstock', { exp: 0.02, con: 0.16, sat: 0.04, temp: 0.04, fade: 0.05, roll: 0.45, split: 0.26, shTint: '#141a22', hiTint: '#fff3e4', vig: 0.06, grain: 0, sharp: 0.15 }],
        ['halation', { amt: 0.18, thr: 0.74, rad: 0.014, tint: '#ff5a2e', soft: 0.7 }],
        ['filmgrain', { fmt: 3, amt: 0.06, shadow: 0.6, color: 0.08, suave: 0.4, fps: 24 }],
        ['filmgate', { fmt: 3, zoom: 1.015, soft: 0.006, round: 0.8, vig: 0.05, sombra: 0.25, sombraW: 0.05, flick: 0.02, flickHz: 24, weave: 0.02 }]
      ]
    },
    {
      id: 'pprojecao', name: 'Projeção velha', desc: 'a cópia gasta: risco, poeira, flash e emenda',
      fx: [
        ['filmstock', { exp: -0.06, con: 0.18, sat: -0.2, temp: 0.2, fade: 0.2, roll: 0.55, split: 0.5, shTint: '#2b2415', hiTint: '#ffeec8', vig: 0.5, grain: 0 }],
        ['filmgrain', { fmt: 1, amt: 0.34, shadow: 0.8, color: 0.2, fps: 16 }],
        ['dustscratch', { dust: 0.75, dustSize: 1.6, scratch: 0.62, scLen: 0.9, hair: 0.35, fps: 12, dark: 0.65 }],
        ['gateweave', { amt: 0.62, spd: 2.6, rot: 0.5, jump: 0.5, jumpRate: 0.8 }],
        ['filmflash', { amt: 0.7, rate: 0.25, len: 0.12, warm: 0.55, burn: 0.6 }],
        ['filmgate', { fmt: 1, zoom: 1.1, soft: 0.02, round: 1.2, vig: 0.3, sombra: 0.6, sombraW: 0.1, flick: 0.18, weave: 0.35 }]
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
