/* ==========================================================================
   rgb_lab — GLSL DA COMPOSIÇÃO
   --------------------------------------------------------------------------
   Os três shaders que fazem uma camada virar composição. Ficam aqui, longe
   do motor, porque são MATEMÁTICA e a matemática precisa poder ser lida
   sem o barulho do WebGL em volta.

   Convenções, válidas para o arquivo inteiro:
     · alfa DIREITO (não pré-multiplicado) da entrada à saída;
     · Cb / αb  = o que já estava montado embaixo (backdrop);
     · Cs / αs  = a camada que está entrando (source);
     · toda função de mistura devolve só a COR. O alfa é resolvido depois,
       uma vez só, pela equação de composição — e é isso que evita halo.

   A equação de composição é a do W3C (Compositing and Blending Level 1):

       Cs' = (1 − αb)·Cs + αb·B(Cb, Cs)
       αo  = αs + αb·(1 − αs)
       Co  = ( αs·Cs' + αb·Cb·(1 − αs) ) / αo

   O detalhe que quase todo mundo erra é o `(1 − αb)·Cs`: onde o fundo é
   transparente a mistura NÃO acontece, a camada aparece como ela é. Sem
   isso, um "multiplicar" sobre nada resultaria em preto, e é daí que vêm
   as bordas sujas e as auréolas em PNG e vídeo com transparência.
   ========================================================================== */
(function (VE) {
  'use strict';

  var GL = VE.GLSL = {};

  /* ====================================================== ESPAÇO DE COR ====
     Misturar em sRGB e misturar em luz linear dão resultados diferentes, e
     nenhum dos dois é "o certo": o sRGB é o que o Photoshop faz e o que a
     mão do artista espera; a luz linear é o que a física faz e o que
     parece correto em soma, tela e desfoque de brilho.

     O motor oferece os dois. A conversão é a sRGB de verdade, com o trecho
     linear perto do preto — a aproximação `pow(x, 2.2)` erra justamente na
     sombra, que é onde o vídeo mora.                                     */
  GL.espaco = [
    'vec3 aLinear(vec3 c){',
    '  return mix(c/12.92, pow((c + 0.055)/1.055, vec3(2.4)), step(0.04045, c));',
    '}',
    'vec3 aSrgb(vec3 c){',
    '  c = max(c, 0.0);',
    '  return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c));',
    '}'
  ].join('\n');

  /* ======================================================== MISTURA ========
     27 modos. Os índices são os de `VE.BLENDS` e não podem ser trocados.
     Fórmulas conforme a especificação do W3C e a documentação pública da
     Adobe; onde as duas divergem, a escolha está anotada na linha.     */
  GL.blend = [
    'float bLum(vec3 c){ return dot(c, vec3(0.30, 0.59, 0.11)); }',
    'float bSat(vec3 c){ return max(max(c.r,c.g),c.b) - min(min(c.r,c.g),c.b); }',
    /* recolocar luminosidade sem estourar o gamute — o algoritmo "clip color"
       da especificação: puxa a cor para dentro de 0..1 mantendo o matiz.  */
    'vec3 bSetLum(vec3 c, float l){',
    '  c += (l - bLum(c));',
    '  float n = bLum(c);',
    '  float lo = min(min(c.r,c.g),c.b), hi = max(max(c.r,c.g),c.b);',
    '  if(lo < 0.0) c = n + (c - n)*n/max(n - lo, 1e-4);',
    '  if(hi > 1.0) c = n + (c - n)*(1.0 - n)/max(hi - n, 1e-4);',
    '  return c;',
    '}',
    'vec3 bSetSat(vec3 c, float s){',
    '  float mn = min(min(c.r,c.g),c.b), mx = max(max(c.r,c.g),c.b);',
    '  return (mx > mn) ? (c - mn)*s/(mx - mn) : vec3(0.0);',
    '}',
    /* peças reaproveitadas pelos modos de contraste */
    'vec3 bBurn(vec3 b, vec3 s){',
    '  return mix(1.0 - min(vec3(1.0), (1.0 - b)/max(s, vec3(1e-4))), vec3(0.0), step(s, vec3(0.0)));',
    '}',
    'vec3 bDodge(vec3 b, vec3 s){',
    '  return mix(min(vec3(1.0), b/max(1.0 - s, vec3(1e-4))), vec3(1.0), step(vec3(1.0), s));',
    '}',
    'vec3 bHard(vec3 b, vec3 s){',
    '  return mix(2.0*s*b, 1.0 - 2.0*(1.0 - s)*(1.0 - b), step(0.5, s));',
    '}',
    'vec3 bVivid(vec3 b, vec3 s){',
    '  return mix(bBurn(b, 2.0*s), bDodge(b, 2.0*(s - 0.5)), step(0.5, s));',
    '}',
    'vec3 blendMode(vec3 b, vec3 s, float m){',
    '  int i = int(m + 0.5);',
    /* ---- NORMAL ---- */
    '  if(i <= 1) return s;',                                   /* normal · dissolver (o sorteio é no alfa) */
    /* ---- ESCURECER ---- */
    '  if(i == 2) return min(b, s);',
    '  if(i == 3) return b*s;',
    '  if(i == 4) return bBurn(b, s);',
    '  if(i == 5) return clamp(b + s - 1.0, 0.0, 1.0);',
    '  if(i == 6) return (bLum(b) < bLum(s)) ? b : s;',
    /* ---- CLAREAR ---- */
    '  if(i == 7) return max(b, s);',
    '  if(i == 8) return b + s - b*s;',
    '  if(i == 9) return bDodge(b, s);',
    '  if(i == 10) return min(b + s, vec3(1.0));',
    '  if(i == 11) return (bLum(b) > bLum(s)) ? b : s;',
    /* ---- CONTRASTE ---- */
    '  if(i == 12) return bHard(s, b);',                        /* sobrepor = luz forte com os papéis trocados */
    '  if(i == 13){',
    '    vec3 d = mix(((16.0*b - 12.0)*b + 4.0)*b, sqrt(max(b, 0.0)), step(0.25, b));',
    '    return mix(b - (1.0 - 2.0*s)*b*(1.0 - b), b + (2.0*s - 1.0)*(d - b), step(0.5, s));',
    '  }',
    '  if(i == 14) return bHard(b, s);',
    '  if(i == 15) return bVivid(b, s);',
    '  if(i == 16) return clamp(b + 2.0*s - 1.0, 0.0, 1.0);',
    '  if(i == 17) return mix(min(b, 2.0*s), max(b, 2.0*s - 1.0), step(0.5, s));',
    '  if(i == 18) return step(vec3(0.5), bVivid(b, s));',      /* mistura dura = luz brilhante no limiar */
    /* ---- COMPARAÇÃO ---- */
    '  if(i == 19) return abs(b - s);',
    '  if(i == 20) return b + s - 2.0*b*s;',
    '  if(i == 21) return max(b - s, vec3(0.0));',
    '  if(i == 22) return clamp(b/max(s, vec3(4.0/255.0)), 0.0, 1.0);',
    /* ---- COMPONENTE ---- */
    '  if(i == 23) return bSetLum(bSetSat(s, bSat(b)), bLum(b));',
    '  if(i == 24) return bSetLum(bSetSat(b, bSat(s)), bLum(b));',
    '  if(i == 25) return bSetLum(s, bLum(b));',
    '  return bSetLum(b, bLum(s));',                            /* 26 luminosidade */
    '}',
    /* os quatro modos de COMPONENTE são definidos sobre a percepção, não
       sobre a energia. Calculá-los em luz linear devolve cores erradas —
       então eles ignoram o botão de espaço de cor, de propósito.        */
    'bool blendPerceptivo(float m){ return m > 22.5; }'
  ].join('\n');

  /* ============================================= FAIXA DE MESCLA (BLEND IF)
     Decide, pixel a pixel, se esta camada tem direito de existir naquele
     ponto — com base no tom da própria camada e no tom do que está embaixo.

     Quatro pontos por lado. Juntos, o corte é seco; afastados, a passagem
     é macia. É com isso que se tira um céu branco sem recortar nada, que
     se casa uma textura com a imagem e que se faz dupla exposição.     */
  GL.faixa = [
    'float faixaAbaixo(float x, float a, float b){',
    '  if(b <= 0.0005) return 0.0;',                 /* piso no mínimo = não corta */
    '  if(b <= a) return 1.0 - step(a, x);',
    '  return 1.0 - clamp((x - a)/(b - a), 0.0, 1.0);',
    '}',
    'float faixaAcima(float x, float a, float b){',
    '  if(a >= 0.9995) return 0.0;',                 /* teto no máximo = não corta */
    '  if(b <= a) return step(a, x);',
    '  return clamp((x - a)/(b - a), 0.0, 1.0);',
    '}',
    'float faixaFator(float x, vec4 p){',
    '  return (1.0 - faixaAbaixo(x, p.x, p.y)) * (1.0 - faixaAcima(x, p.z, p.w));',
    '}',
    'float faixaCanal(vec3 c, int ch){',
    '  if(ch == 1) return c.r;',
    '  if(ch == 2) return c.g;',
    '  if(ch == 3) return c.b;',
    '  return dot(c, vec3(0.30, 0.59, 0.11));',
    '}'
  ].join('\n');

  /* ======================================================== SORTEIO ========
     Dissolver precisa de um sorteio ESTÁVEL: o mesmo pixel tem de cair do
     mesmo lado em todo quadro, senão vira chuvisco. Por isso o valor vem
     só das coordenadas do pixel — nada de tempo aqui dentro.           */
  GL.hash = [
    'float hash21(vec2 p){',
    '  p = fract(p*vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x*p.y);',
    '}'
  ].join('\n');

  /* ================================================== MÁSCARAS DA CAMADA ===
     Sete formas, quatro maneiras de combinar. Tudo por distância assinada:
     a forma devolve "quão dentro" o pixel está, e a suavidade transforma
     isso em cobertura. Expandir soma na distância — é dilatar ou corroer
     a forma sem mudar o desenho dela.                                   */
  GL.mascara = [
    'vec2 mRot(vec2 p, float a){ float c=cos(a), s=sin(a); return vec2(p.x*c - p.y*s, p.x*s + p.y*c); }',
    'float sdCaixa(vec2 p, vec2 h){',
    '  vec2 q = abs(p) - h;',
    '  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);',
    '}',
    'float sdElipse(vec2 p, vec2 h){',
    '  h = max(h, vec2(1e-4));',
    '  float k = length(p/h);',
    '  return (k - 1.0) * min(h.x, h.y);',
    '}',
    'float sdPoligono(vec2 p, float r, float n, float canto){',
    '  float a = atan(p.x, p.y);',
    '  float b = 6.28318530718/max(n, 3.0);',
    '  float d = cos(floor(0.5 + a/b)*b - a)*length(p) - r;',
    '  return d - canto*r*0.5;',                    /* arredondar = encolher e engordar */
    '}',
    /* ------------------------------------------------------- CANETA
       Distância COM SINAL a um polígono de vértices livres. Negativa
       dentro, positiva fora — e é o sinal que dá o recorte, enquanto o
       módulo alimenta a suavização e a expansão, iguais às das outras
       formas. Sem isso a caneta seria um recorte de borda dura e não
       conversaria com os controles que já existem.

       Os vértices de TODAS as máscaras de caneta da camada moram num
       reservatório só (`uPts`); cada máscara diz onde começa a sua fatia
       e quantos pontos tem. Assim oito máscaras cabem em um uniforme.

       A referência dos vértices é FIXA em (0,5 / 0,5) enquanto a do
       ponto lido é `x`,`y`. Se as duas se movessem juntas, arrastar a
       máscara não moveria nada — as duas se cancelariam.            */
    /* Os pontos vêm de uma TEXTURA, não de um uniforme. Uniforme tem
       teto baixo (o mínimo garantido são 224 vetores no total, e as
       outras linhas da máscara já comem trinta e duas), e a curva
       picada em pedacinhos gasta ponto depressa. Textura não tem esse
       teto, e `texelFetch` lê o texel exato, sem filtro nem borda. */
    'vec2 lePt(int i){ return texelFetch(uPtsTex, ivec2(i, 0), 0).xy; }',
    'vec2 refPt(vec2 pt, float aspect){ vec2 q = pt - vec2(0.5); q.x *= aspect; return q; }',
    'float sdCaneta(vec2 p, int ini, int n, float aspect){',
    '  float d = 1e9, s = 1.0;',
    '  vec2 b = refPt(lePt(ini + n - 1), aspect);',
    '  for(int k = 0; k < 256; k++){',
    '    if(k >= n) break;',
    '    vec2 a = refPt(lePt(ini + k), aspect);',
    '    vec2 e = b - a, w = p - a;',
    '    float t = clamp(dot(w, e)/max(dot(e, e), 1e-9), 0.0, 1.0);',
    '    vec2 q = w - e*t;',
    '    d = min(d, dot(q, q));',
    /* cruzamento de raio: cada aresta que o raio horizontal atravessa
       inverte o sinal. É o teste de dentro/fora, sem ramo caro.     */
    '    bvec3 c = bvec3(p.y >= a.y, p.y < b.y, e.x*w.y > e.y*w.x);',
    '    if(all(c) || all(not(c))) s = -s;',
    '    b = a;',
    '  }',
    '  return s*sqrt(d);',
    '}',
    /* cobertura de UMA máscara. `m0..m3` são as quatro linhas de uniforme:
       m0 = shape, modo, invert, opacidade
       m1 = x, y, w, h            (na caneta, w é ESCALA e h não é usada)
       m2 = ang, feather, expandir, lados
       m3 = canto, início no reservatório, nº de pontos, —              */
    'float mascaraUma(vec2 uv, float aspect, vec4 m0, vec4 m1, vec4 m2, vec4 m3){',
    '  int shape = int(m0.x + 0.5);',
    '  vec2 p = uv - m1.xy;',
    '  p.x *= aspect;',
    '  p = mRot(p, -m2.x);',
    '  vec2 h = max(m1.zw*0.5, vec2(1e-4));',
    '  h.x *= aspect;',
    '  float sd;',
    '  float cov = -1.0;',
    '  if(shape == 0)      sd = sdCaixa(p, h);',
    '  else if(shape == 1) sd = sdElipse(p, h);',
    '  else if(shape == 2) sd = sdPoligono(p, min(h.x, h.y), m2.w, m3.x);',
    '  else if(shape == 3) sd = abs(p.y) - h.y;',
    '  else if(shape == 4) sd = abs(p.x) - h.x;',
    '  else if(shape == 5){',                        /* rampa linear: cobertura direta */
    '    cov = clamp(0.5 - p.x/max(m1.z*aspect, 1e-4), 0.0, 1.0);',
    '    sd = 0.0;',
    '  } else if(shape == 6){',                      /* rampa radial */
    '    cov = 1.0 - clamp(length(p/h), 0.0, 1.0);',
    '    sd = 0.0;',
    '  } else {',                                    /* 7 — caneta */
    /* a escala vive em m1.z: dividimos o ponto lido e multiplicamos a
       distância de volta, senão a suavização encolheria junto      */
    '    float esc = max(m1.z, 1e-4);',
    '    sd = sdCaneta(p/esc, int(m3.y + 0.5), int(m3.z + 0.5), aspect)*esc;',
    '  }',
    '  if(cov < 0.0){',
    '    float f = max(m2.y, 0.0005)*0.5;',
    '    cov = 1.0 - smoothstep(-f, f, sd - m2.z);',
    '  } else if(m2.y > 0.0005){',
    '    cov = smoothstep(0.5 - m2.y*0.5, 0.5 + m2.y*0.5, cov);',
    '  }',
    '  if(m0.z > 0.5) cov = 1.0 - cov;',
    '  return clamp(cov, 0.0, 1.0)*clamp(m0.w, 0.0, 1.0);',
    '}',
    /* combinação: união suave, subtração, interseção e diferença. */
    'float mascaraJunta(float acc, float cov, int modo){',
    '  if(modo == 1) return acc*(1.0 - cov);',
    '  if(modo == 2) return acc*cov;',
    '  if(modo == 3) return abs(acc - cov);',
    '  return acc + cov - acc*cov;',
    '}'
  ].join('\n');

  /* ===================================================== COR E CANAIS ======
     Uma passada só resolve correção de cor e mistura de canais. Cada bloco
     é pulado por `if` de uniforme — quando a camada não usa cor, o custo é
     uma comparação e nada mais.

     A ordem interna também não é arbitrária:
       exposição (luz)  →  níveis  →  contraste  →  gama
       →  temperatura/tinte  →  matiz  →  saturação/vibração
       →  altas/baixas/brancos/pretos
     Luz primeiro porque é a única operação verdadeiramente física; o resto
     é escolha de aparência e trabalha sobre o resultado dela.           */
  GL.cor = [
    'vec3 rgb2hsv(vec3 c){',
    '  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);',
    '  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));',
    '  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));',
    '  float d = q.x - min(q.w, q.y);',
    '  return vec3(abs(q.z + (q.w - q.y)/(6.0*d + 1e-10)), d/(q.x + 1e-10), q.x);',
    '}',
    'vec3 hsv2rgb(vec3 c){',
    '  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);',
    '  vec3 p = abs(fract(c.xxx + K.xyz)*6.0 - K.www);',
    '  return c.z*mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);',
    '}',
    'vec3 corGrade(vec3 c, float expo, float contraste, float gama,',
    '              float sat, float vibr, float matiz,',
    '              float temp, float tinte,',
    '              float altas, float baixas, float brancos, float pretos,',
    '              vec4 niveis){',
    /* --- luz: exposição em PARADAS, feita em linear, que é onde ela vive */
    '  if(abs(expo) > 0.0005){',
    '    vec3 lin = aLinear(clamp(c, 0.0, 1.0));',
    '    c = aSrgb(lin*exp2(expo));',
    '  }',
    /* --- níveis: entrada, depois saída */
    '  if(niveis.x > 0.0005 || niveis.y < 0.9995){',
    '    c = clamp((c - niveis.x)/max(niveis.y - niveis.x, 1e-3), 0.0, 1.0);',
    '  }',
    '  if(niveis.z > 0.0005 || niveis.w < 0.9995){',
    '    c = niveis.z + c*(niveis.w - niveis.z);',
    '  }',
    /* --- contraste em torno do cinza médio */
    '  if(abs(contraste) > 0.0005) c = clamp((c - 0.5)*(1.0 + contraste) + 0.5, 0.0, 1.0);',
    /* --- gama */
    '  if(abs(gama - 1.0) > 0.0005) c = pow(max(c, 1e-5), vec3(1.0/max(gama, 0.05)));',
    /* --- temperatura e tinte: o eixo âmbar/azul e o eixo verde/magenta */
    '  if(abs(temp) > 0.0005 || abs(tinte) > 0.0005){',
    '    c *= vec3(1.0 + temp*0.35, 1.0 + tinte*0.30, 1.0 - temp*0.35);',
    '    c = clamp(c, 0.0, 1.0);',
    '  }',
    /* --- matiz, saturação e vibração num só passeio por HSV */
    '  if(abs(matiz) > 0.0005 || abs(sat) > 0.0005 || abs(vibr) > 0.0005){',
    '    vec3 h = rgb2hsv(clamp(c, 0.0, 1.0));',
    '    h.x = fract(h.x + matiz);',
    /* vibração pesa mais onde há POUCA cor — é o que impede pele de virar cenoura */
    '    float g = 1.0 + sat + vibr*(1.0 - h.y);',
    '    h.y = clamp(h.y*g, 0.0, 1.0);',
    '    c = hsv2rgb(h);',
    '  }',
    /* --- as quatro zonas de tom, por pesos suaves que somam ~1 */
    '  if(abs(altas) > 0.0005 || abs(baixas) > 0.0005 || abs(brancos) > 0.0005 || abs(pretos) > 0.0005){',
    '    float l = dot(c, vec3(0.30, 0.59, 0.11));',
    '    float wS = 1.0 - smoothstep(0.0, 0.55, l);',
    '    float wH = smoothstep(0.45, 1.0, l);',
    '    float wP = 1.0 - smoothstep(0.0, 0.25, l);',
    '    float wB = smoothstep(0.75, 1.0, l);',
    '    c += baixas*wS*0.5 + altas*wH*0.5 + pretos*wP*0.5 + brancos*wB*0.5;',
    '    c = clamp(c, 0.0, 1.0);',
    '  }',
    '  return clamp(c, 0.0, 1.0);',
    '}'
  ].join('\n');

  /* =============================================== SHADER: COR + CANAIS ====
     Uma passada. Lê a camada isolada e devolve a mesma camada corrigida.
     O deslocamento cromático precisa AMOSTRAR a textura em três lugares —
     por isso ele mora aqui e não numa função pura de cor.               */
  GL.GRADE_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUv;',
    'out vec4 fragColor;',
    'uniform sampler2D uTex;',
    'uniform float uAspect;',
    'uniform int   uUsaCor;',
    'uniform int   uUsaCanais;',
    'uniform float uExpo, uContraste, uGama, uSat, uVibr, uMatiz, uTemp, uTinte;',
    'uniform float uAltas, uBaixas, uBrancos, uPretos;',
    'uniform vec4  uNiveis;',
    'uniform mat3  uMix;',
    'uniform vec3  uOff;',
    'uniform vec3  uInv;',
    'uniform vec2  uDesl;',
    GL.espaco,
    GL.cor,
    'void main(){',
    '  vec4 c;',
    /* --- deslocamento cromático: cada canal vem de um ponto diferente --- */
    '  if(uUsaCanais == 1 && (abs(uDesl.x) > 0.00002 || abs(uDesl.y) > 0.00002)){',
    '    vec2 d = uDesl;',
    '    vec4 a = texture(uTex, vUv + d);',
    '    vec4 b = texture(uTex, vUv);',
    '    vec4 e = texture(uTex, vUv - d);',
    '    c = vec4(a.r, b.g, e.b, max(max(a.a, b.a), e.a));',
    '  } else {',
    '    c = texture(uTex, vUv);',
    '  }',
    '  vec3 col = c.rgb;',
    '  if(uUsaCor == 1){',
    '    col = corGrade(col, uExpo, uContraste, uGama, uSat, uVibr, uMatiz,',
    '                   uTemp, uTinte, uAltas, uBaixas, uBrancos, uPretos, uNiveis);',
    '  }',
    '  if(uUsaCanais == 1){',
    '    col = clamp(uMix*col + uOff, 0.0, 1.0);',
    '    col = mix(col, 1.0 - col, clamp(uInv, 0.0, 1.0));',
    '  }',
    '  fragColor = vec4(col, c.a);',
    '}'
  ].join('\n');

  /* ===================================================== SHADER: MÁSCARA ===
     Multiplica a cobertura combinada no ALFA da camada. Não toca na cor:
     alfa direito significa que a cor de um pixel invisível continua lá,
     inteira, e é isso que impede a borda escura quando ele reaparece.   */
  GL.MASK_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUv;',
    'out vec4 fragColor;',
    'uniform sampler2D uTex;',
    'uniform float uAspect;',
    'uniform int   uN;',
    'uniform vec4  uM0[8];',
    'uniform vec4  uM1[8];',
    'uniform vec4  uM2[8];',
    'uniform vec4  uM3[8];',
    'uniform float uAcc0;',
    /* reservatório de pontos da CANETA, partilhado pelas oito máscaras.
       Uma linha de textura de ponto flutuante: 256 pontos, sem o teto
       de uniforme e sem custo quando não há caneta nenhuma.          */
    'uniform highp sampler2D uPtsTex;',
    GL.mascara,
    'void main(){',
    '  vec4 c = texture(uTex, vUv);',
    '  float acc = uAcc0;',
    '  for(int i = 0; i < 8; i++){',
    '    if(i >= uN) break;',
    '    float cov = mascaraUma(vUv, uAspect, uM0[i], uM1[i], uM2[i], uM3[i]);',
    '    acc = mascaraJunta(acc, cov, int(uM0[i].y + 0.5));',
    '  }',
    '  fragColor = vec4(c.rgb, c.a*clamp(acc, 0.0, 1.0));',
    '}'
  ].join('\n');

  /* ================================================== SHADER: COMPOSIÇÃO ===
     O que era `COMP_FS`. Continua fazendo o posicionamento (retângulo,
     rotação, espelho, corte) porque isso é o desenho da camada dentro do
     quadro — e ganhou o resto: modo, preenchimento, espaço, faixa de
     mescla, matte e a equação de composição correta.

     Todo bloco novo está atrás de um `if` de UNIFORME. Um clipe recém-posto
     na linha do tempo passa por este shader tocando exatamente as mesmas
     linhas que tocava antes.                                            */
  GL.COMP_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUv;',
    'out vec4 fragColor;',
    'uniform sampler2D uTex;',
    'uniform sampler2D uBack;',
    'uniform sampler2D uMatte;',
    'uniform vec4  uRect;',     /* cx, cy, w, h — normalizado, já corrigido pelo aspecto */
    'uniform float uAngle;',
    'uniform float uOpacity;',
    'uniform float uFill;',
    'uniform float uBlend;',
    'uniform float uAspect;',
    'uniform vec2  uFlip;',
    'uniform vec4  uCrop;',
    'uniform int   uLinear;',   /* 1 = misturar em luz linear */
    'uniform int   uDesmult;',  /* 1 = a fonte chega com alfa pré-multiplicado */
    'uniform int   uMatteModo;',/* 0 nenhum · 1 alfa · 2 alfa inv · 3 luma · 4 luma inv */
    'uniform int   uIfOn;',
    'uniform int   uIfCh;',
    'uniform vec4  uIfEsta;',
    'uniform vec4  uIfFundo;',
    GL.espaco,
    GL.blend,
    GL.faixa,
    GL.hash,
    'vec2 rot2(vec2 p, float a){ float c=cos(a), s=sin(a); return vec2(p.x*c - p.y*s, p.x*s + p.y*c); }',
    'void main(){',
    '  vec4 back = texture(uBack, vUv);',
    '  vec2 p = vUv - uRect.xy;',
    '  p.x *= uAspect;',
    '  p = rot2(p, -uAngle);',
    '  vec2 luv = p/max(uRect.zw, vec2(0.0001)) + 0.5;',
    '  luv = mix(luv, 1.0 - luv, step(0.5, uFlip));',
    '  if(luv.x < 0.0 || luv.x > 1.0 || luv.y < 0.0 || luv.y > 1.0){ fragColor = back; return; }',
    '',
    '  vec2 suv = uCrop.xy + luv*uCrop.zw;',
    '  vec4 s = texture(uTex, suv);',
    /* --- alfa pré-multiplicado → alfa direito, antes de qualquer conta --- */
    '  if(uDesmult == 1 && s.a > 0.0035) s.rgb /= s.a;',
    '  s.rgb = clamp(s.rgb, 0.0, 1.0);',
    '',
    '  float as = s.a*clamp(uOpacity, 0.0, 1.0);',
    /* --- dissolver: em vez de translúcido, sorteado. limiar fixo por pixel */
    '  if(uBlend > 0.5 && uBlend < 1.5){',
    '    as = step(hash21(gl_FragCoord.xy), as);',
    '  }',
    /* --- matte: a silhueta vem de outra camada --- */
    '  if(uMatteModo > 0){',
    '    vec4 mt = texture(uMatte, vUv);',
    '    float k;',
    '    if(uMatteModo == 1) k = mt.a;',
    '    else if(uMatteModo == 2) k = 1.0 - mt.a;',
    '    else if(uMatteModo == 3) k = dot(mt.rgb, vec3(0.30,0.59,0.11))*mt.a;',
    '    else k = 1.0 - dot(mt.rgb, vec3(0.30,0.59,0.11))*mt.a;',
    '    as *= clamp(k, 0.0, 1.0);',
    '  }',
    /* --- faixa de mescla: o tom decide se a camada existe aqui --- */
    '  if(uIfOn == 1){',
    '    float xa = faixaCanal(s.rgb, uIfCh);',
    '    float xb = faixaCanal(back.rgb, uIfCh);',
    '    as *= faixaFator(xa, uIfEsta)*faixaFator(xb, uIfFundo);',
    '  }',
    '  if(as <= 0.0){ fragColor = back; return; }',
    '',
    /* --- a mistura, no espaço escolhido --- */
    '  vec3 Cb = back.rgb, Cs = s.rgb;',
    '  bool lin = (uLinear == 1) && !blendPerceptivo(uBlend);',
    '  if(lin){ Cb = aLinear(Cb); Cs = aLinear(Cs); }',
    '  vec3 B = blendMode(Cb, Cs, uBlend);',
    /* PREENCHIMENTO: quanto do resultado da mistura substitui o fundo.
       Em 1 a mistura vale inteira; em 0 a camada volta a ser ela mesma,
       sem conversar com o que está embaixo. É diferente de opacidade —
       opacidade tira a camada, preenchimento tira a CONVERSA.          */
    '  float fl = clamp(uFill, 0.0, 1.0);',
    '  if(fl < 0.999) B = mix(Cs, B, fl);',
    /* --- a equação do W3C. onde o fundo é transparente, não há mistura --- */
    '  float ab = back.a;',
    '  vec3 Csl = (1.0 - ab)*Cs + ab*B;',
    '  float ao = as + ab*(1.0 - as);',
    '  vec3 Co = (as*Csl + ab*Cb*(1.0 - as))/max(ao, 1e-4);',
    '  if(lin) Co = aSrgb(Co);',
    '  fragColor = vec4(clamp(Co, 0.0, 1.0), clamp(ao, 0.0, 1.0));',
    '}'
  ].join('\n');

})(window.VE);
