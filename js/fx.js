/* ============================================================
   rgb_lab — registro de efeitos (parte 1: base, cor e luz)
   Cada efeito é um fragment shader que implementa vec3 fx(vec2 uv).
   O framework cuida de: máscara (região), intensidade e fades.
   ============================================================ */
window.VE = window.VE || {};
(function (VE) {
  'use strict';

  VE.CATS = [
    { id: 'todos', label: 'todos' },
    { id: 'cor', label: 'cor', color: '#ffb020' },
    { id: 'luz', label: 'luz/textura', color: '#ffe066' },
    { id: 'distorcao', label: 'distorção', color: '#7c5cff' },
    { id: 'glitch', label: 'glitch', color: '#ff2e63' },
    { id: 'ascii', label: 'ascii', color: '#2ee6a8' },
    { id: 'tempo', label: 'tempo/movimento', color: '#00e5ff' }
  ];

  VE.FX = [];
  VE.FXBY = {};

  /* helper de registro */
  VE.def = function (o) {
    o.params = o.params || [];
    o.params.forEach(function (p) {
      if (p.t === undefined) p.t = 'f';
      if (p.t === 'f') {
        if (p.min === undefined) p.min = 0;
        if (p.max === undefined) p.max = 1;
        if (p.step === undefined) p.step = 0.01;
      }
    });
    VE.FX.push(o);
    VE.FXBY[o.id] = o;
    return o;
  };

  /* valores padrão de um efeito */
  VE.defaults = function (id) {
    var f = VE.FXBY[id], o = {};
    if (!f) return o;
    f.params.forEach(function (p) { o[p.k] = p.def; });
    return o;
  };

  /* ---------------- PRELUDE GLSL comum a todos os efeitos ---------------- */
  VE.PRELUDE = [
    '#version 300 es',
    'precision highp float;',
    'precision highp sampler2D;',
    'in vec2 vUv;',
    'out vec4 fragColor;',
    'uniform sampler2D uTex;',
    'uniform sampler2D uPrev;',
    'uniform sampler2D uAtlas;',
    /* memória de quadros: uPrev é t-1; uH2/uH3/uH4 são t-2, t-3 e t-4.
       É o que sustenta a família TEMPO — eco, acúmulo, borrão entre
       quadros e o deslocamento temporal.                                */
    'uniform sampler2D uH2;',
    'uniform sampler2D uH3;',
    'uniform sampler2D uH4;',
    /* som do instante: x = nível, y = grave, z = médio, w = agudo */
    'uniform vec4  uAudio;',
    /* correção do estabilizador: xy = deslocamento medido, z = confiança */
    'uniform vec3  uStab;',
    /* efeitos de VÁRIAS PASSADAS: a imagem que entrou na cadeia continua
       aqui do começo ao fim, e uPass diz em qual passada o shader está  */
    'uniform sampler2D uOrig;',
    'uniform float uPass;',
    'uniform float uPasses;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform float uLocal;',
    'uniform float uAmount;',
    'uniform float uAspect;',
    'uniform vec4  uMaskA;',   // cx, cy, w, h
    'uniform vec4  uMaskB;',   // ang(rad), feather, invert, shape
    'uniform vec4  uAtlasInfo;', // count, cols, rows, altura total do atlas
    /* Tabela de cor → figura. Um cubo 16×16×16 achatado em 256×16: dado
       um RGB, uma leitura devolve QUAL figura do atlas é a mais parecida.
       É o que faz o mosaico de emoji escolher por COR e não por brilho —
       e faz isso com uma busca só, em vez de comparar com a lista toda. */
    'uniform sampler2D uPalLut;',
    /* Linha e coluna da figura `gi` num atlas de `cols` colunas.
       NÃO usar `mod(gi, cols)`: nesta GPU, quando gi é múltiplo exato de
       cols, mod devolve cols em vez de 0 — a leitura cai fora do atlas,
       o alfa volta zero e o QUADRO INTEIRO fica preto. Um efeito ficou
       assim até a medida mostrar que só a cor de índice 21 sumia.      */
    'vec2 celulaAtlas(float gi, float cols){',
    '  float c = max(cols, 1.0);',
    '  float lin = floor(gi/c + 0.5/c);',
    '  return vec2(clamp(gi - lin*c, 0.0, c - 1.0), lin);',
    '}',
    'float figuraDaCor(vec3 c){',
    '  c = clamp(c, 0.0, 1.0);',
    '  vec3 q = floor(c*15.0 + 0.5);',
    '  vec2 uv = (vec2(q.r + q.b*16.0, q.g) + 0.5)/vec2(256.0, 16.0);',
    '  return floor(texture(uPalLut, uv).r*255.0 + 0.5);',
    '}',
    '#define PI 3.141592653589793',
    'vec3 srccol(vec2 uv){ return texture(uTex, clamp(uv, 0.0, 1.0)).rgb; }',
    'vec4 src4(vec2 uv){ return texture(uTex, clamp(uv, 0.0, 1.0)); }',
    'float luma(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }',
    'float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }',
    'float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }',
    'vec2 hash22(vec2 p){ return vec2(hash21(p), hash21(p+19.19)); }',
    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f*f*(3.0-2.0*f);',
    '  return mix(mix(hash21(i), hash21(i+vec2(1,0)), u.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), u.x), u.y);',
    '}',
    'float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s += a*vnoise(p); p*=2.02; a*=0.5; } return s; }',
    'vec3 rgb2hsv(vec3 c){',
    '  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);',
    '  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));',
    '  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));',
    '  float d = q.x - min(q.w, q.y); float e = 1.0e-10;',
    '  return vec3(abs(q.z + (q.w - q.y)/(6.0*d + e)), d/(q.x + e), q.x);',
    '}',
    'vec3 hsv2rgb(vec3 c){',
    '  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);',
    '  vec3 p = abs(fract(c.xxx + K.xyz)*6.0 - K.www);',
    '  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);',
    '}',
    'vec2 rot2(vec2 p, float a){ float c=cos(a), s=sin(a); return vec2(p.x*c - p.y*s, p.x*s + p.y*c); }',
    /* ---------------- utilidades comuns às famílias novas ---------------- */
    'vec2 texel(){ return 1.0/max(uRes, vec2(1.0)); }',
    /* quadro guardado: n = 1..4 passos para trás */
    'vec3 histcol(int n, vec2 uv){',
    '  vec2 q = clamp(uv, 0.0, 1.0);',
    '  if(n <= 1) return texture(uPrev, q).rgb;',
    '  if(n == 2) return texture(uH2, q).rgb;',
    '  if(n == 3) return texture(uH3, q).rgb;',
    '  return texture(uH4, q).rgb;',
    '}',
    'vec4 hist4(int n, vec2 uv){',
    '  vec2 q = clamp(uv, 0.0, 1.0);',
    '  if(n <= 1) return texture(uPrev, q);',
    '  if(n == 2) return texture(uH2, q);',
    '  if(n == 3) return texture(uH3, q);',
    '  return texture(uH4, q);',
    '}',
    /* média 3x3 — base de textura local, nitidez e detecção de matéria */
    'vec3 box3(vec2 uv, float r){',
    '  vec2 t = texel()*max(r, 0.5);',
    '  vec3 s = vec3(0.0);',
    '  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++) s += srccol(uv + vec2(float(i), float(j))*t);',
    '  return s/9.0;',
    '}',
    /* quanto de detalhe existe em volta deste pixel (0 liso · 1 áspero) */
    'float roughness(vec2 uv, float r){',
    '  return clamp(abs(luma(srccol(uv)) - luma(box3(uv, r)))*14.0, 0.0, 1.0);',
    '}',
    /* gradiente de luminância por Sobel — direção e força da borda */
    'vec2 gradient(vec2 uv, float r){',
    '  vec2 t = texel()*max(r, 0.5);',
    '  float tl=luma(srccol(uv+vec2(-t.x, t.y))), tc=luma(srccol(uv+vec2(0.0, t.y))), tr=luma(srccol(uv+t));',
    '  float ml=luma(srccol(uv+vec2(-t.x,0.0))),                                      mr=luma(srccol(uv+vec2(t.x,0.0)));',
    '  float bl=luma(srccol(uv-t)),               bc=luma(srccol(uv-vec2(0.0, t.y))), br=luma(srccol(uv+vec2(t.x,-t.y)));',
    '  float gx = (tr + 2.0*mr + br) - (tl + 2.0*ml + bl);',
    '  float gy = (tl + 2.0*tc + tr) - (bl + 2.0*bc + br);',
    '  return vec2(gx, gy);',
    '}',
    /* HSL — a saturação de HSV mente em altas luzes; para cor seletiva é HSL */
    'vec3 rgb2hsl(vec3 c){',
    '  float mx = max(max(c.r,c.g),c.b), mn = min(min(c.r,c.g),c.b);',
    '  float l = (mx+mn)*0.5, h = 0.0, s = 0.0;',
    '  float d = mx-mn;',
    '  if(d > 1e-5){',
    '    s = l > 0.5 ? d/max(2.0-mx-mn, 1e-5) : d/max(mx+mn, 1e-5);',
    '    if(mx == c.r)      h = (c.g-c.b)/d + (c.g < c.b ? 6.0 : 0.0);',
    '    else if(mx == c.g) h = (c.b-c.r)/d + 2.0;',
    '    else               h = (c.r-c.g)/d + 4.0;',
    '    h /= 6.0;',
    '  }',
    '  return vec3(h, s, l);',
    '}',
    'float hue2rgb(float p, float q, float t){',
    '  t = fract(t);',
    '  if(t < 1.0/6.0) return p + (q-p)*6.0*t;',
    '  if(t < 0.5)     return q;',
    '  if(t < 2.0/3.0) return p + (q-p)*(2.0/3.0 - t)*6.0;',
    '  return p;',
    '}',
    'vec3 hsl2rgb(vec3 c){',
    '  if(c.y < 1e-5) return vec3(c.z);',
    '  float q = c.z < 0.5 ? c.z*(1.0+c.y) : c.z + c.y - c.z*c.y;',
    '  float p = 2.0*c.z - q;',
    '  return vec3(hue2rgb(p,q,c.x+1.0/3.0), hue2rgb(p,q,c.x), hue2rgb(p,q,c.x-1.0/3.0));',
    '}',
    /* distância angular entre dois matizes, 0..1 */
    'float huedist(float a, float b){ float d = abs(fract(a-b+0.5)-0.5); return d*2.0; }',
    /* ruído celular (Worley/Voronoi): devolve distância e semente da célula */
    'vec3 voronoi(vec2 p){',
    '  vec2 n = floor(p), f = fract(p);',
    '  float md = 8.0; vec2 mp = vec2(0.0); vec2 mc = vec2(0.0);',
    '  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){',
    '    vec2 g = vec2(float(i), float(j));',
    '    vec2 o = hash22(n+g);',
    '    vec2 r = g + o - f;',
    '    float d = dot(r, r);',
    '    if(d < md){ md = d; mp = r; mc = n+g; }',
    '  }',
    '  return vec3(sqrt(md), hash21(mc), hash21(mc+7.7));',
    '}',
    /* ruído fractal com deriva no tempo — usado por turbulência e erosão */
    'float fbm3(vec2 p, float t){',
    '  float a = 0.5, s = 0.0;',
    '  for(int i=0;i<5;i++){ s += a*vnoise(p + t*float(i+1)*0.13); p = p*2.03 + 11.7; a *= 0.5; }',
    '  return s;',
    '}',
    'float maskValue(vec2 uv){',
    '  float shape = uMaskB.w;',
    '  if(shape < 0.5) return 1.0;',
    '  vec2 c = uMaskA.xy;',
    '  vec2 s = max(uMaskA.zw, vec2(0.002));',
    '  float f = max(uMaskB.y, 0.0015);',
    '  vec2 p = uv - c; p.x *= uAspect;',
    '  p = rot2(p, -uMaskB.x);',
    '  vec2 sc = vec2(s.x*uAspect, s.y)*0.5;',
    '  float d;',
    '  if(shape < 1.5)      { vec2 q = abs(p)/sc; d = max(q.x, q.y); }',
    '  else if(shape < 2.5) { d = length(p/sc); }',
    '  else if(shape < 3.5) { d = abs(p.y)/sc.y; }',
    '  else                 { d = abs(p.x)/sc.x; }',
    '  float m = 1.0 - smoothstep(1.0 - f, 1.0 + f, d);',
    '  if(uMaskB.z > 0.5) m = 1.0 - m;',
    '  return clamp(m, 0.0, 1.0);',
    '}'
  ].join('\n');

  /* efeitos comuns: mexem no RGB, o alpha atravessa intacto */
  VE.MAIN = [
    'void main(){',
    '  vec2 uv = vUv;',
    '  vec4 base = texture(uTex, uv);',
    '  float m = maskValue(uv) * clamp(uAmount, 0.0, 1.0);',
    '  vec3 col = base.rgb;',
    '  if(m > 0.0008) col = fx(uv);',
    '  fragColor = vec4(clamp(mix(base.rgb, col, m), 0.0, 1.0), base.a);',
    '}'
  ].join('\n');

  /* ------------------------------------------------ VÁRIAS PASSADAS
     Um efeito com `passes: N` implementa DUAS funções:
       vec4 fxStep(vec2 uv)   as passadas de trabalho — o que sai daqui
                              é lido pela passada seguinte, e não é imagem
       vec3 fxLast(vec2 uv)   a última passada, que compõe o resultado
                              sobre `uOrig`, a imagem que entrou
     Só a última respeita máscara e intensidade; as de trabalho não podem,
     senão o buffer intermediário seria misturado com a imagem.          */
  VE.MAINP = [
    'void main(){',
    '  vec2 uv = vUv;',
    /* as N-1 primeiras são de trabalho; a ÚLTIMA (uPass == uPasses-1) compõe */
    '  if(uPass < uPasses - 1.5){ fragColor = fxStep(uv); return; }',
    '  vec4 base = texture(uOrig, uv);',
    '  float m = maskValue(uv) * clamp(uAmount, 0.0, 1.0);',
    '  vec3 col = base.rgb;',
    '  if(m > 0.0008) col = fxLast(uv);',
    '  fragColor = vec4(clamp(mix(base.rgb, col, m), 0.0, 1.0), base.a);',
    '}'
  ].join('\n');

  /* efeitos com alpha: implementam vec4 fx4(vec2 uv) */
  VE.MAIN4 = [
    'void main(){',
    '  vec2 uv = vUv;',
    '  vec4 base = texture(uTex, uv);',
    '  float m = maskValue(uv) * clamp(uAmount, 0.0, 1.0);',
    '  vec4 col = base;',
    '  if(m > 0.0008) col = fx4(uv);',
    '  fragColor = clamp(mix(base, col, m), 0.0, 1.0);',
    '}'
  ].join('\n');

  var D = VE.def;

  /* ================= COR ================= */

  D({
    id: 'color', name: 'Correção de cor', cat: 'cor', color: '#ffb020',
    desc: 'exposição, contraste, saturação, gama',
    params: [
      { k: 'exp', label: 'Exposição', min: -2, max: 2, def: 0 },
      { k: 'con', label: 'Contraste', min: -1, max: 2, def: 0.2 },
      { k: 'sat', label: 'Saturação', min: -1, max: 2, def: 0.2 },
      { k: 'bri', label: 'Brilho', min: -0.5, max: 0.5, def: 0 },
      { k: 'gam', label: 'Gama', min: 0.2, max: 3, def: 1 },
      { k: 'lift', label: 'Levantar pretos', min: -0.2, max: 0.4, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  c *= pow(2.0, u_exp);',
      '  c = (c - 0.5)*(1.0 + u_con) + 0.5 + u_bri;',
      '  c = c*(1.0 - u_lift) + u_lift;',
      '  float l = luma(c);',
      '  c = mix(vec3(l), c, 1.0 + u_sat);',
      '  return pow(max(c, 1e-6), vec3(1.0/max(u_gam, 0.05)));',
      '}'
    ].join('\n')
  });

  D({
    id: 'hue', name: 'Matiz & temperatura', cat: 'cor', color: '#ffb020',
    desc: 'gira as cores, esquenta ou esfria',
    params: [
      { k: 'hue', label: 'Matiz (°)', min: -180, max: 180, step: 1, def: 40 },
      { k: 'spd', label: 'Girar no tempo', min: 0, max: 2, def: 0 },
      { k: 'sat', label: 'Saturação', min: -1, max: 2, def: 0.3 },
      { k: 'temp', label: 'Temperatura', min: -1, max: 1, def: 0 },
      { k: 'tint', label: 'Verde / magenta', min: -1, max: 1, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec3 h = rgb2hsv(c);',
      '  h.x = fract(h.x + u_hue/360.0 + uTime*u_spd*0.1);',
      '  h.y = clamp(h.y*(1.0+u_sat), 0.0, 1.0);',
      '  c = hsv2rgb(h);',
      '  c.r *= 1.0 + u_temp*0.35; c.b *= 1.0 - u_temp*0.35;',
      '  c.g *= 1.0 + u_tint*0.22; c.r *= 1.0 - u_tint*0.08; c.b *= 1.0 - u_tint*0.08;',
      '  return c;',
      '}'
    ].join('\n')
  });

  D({
    id: 'duotone', name: 'Duotone', cat: 'cor', color: '#ffb020',
    desc: 'duas cores mapeadas no brilho',
    params: [
      { k: 'dark', t: 'c', label: 'Cor escura', def: '#1b0b3a' },
      { k: 'light', t: 'c', label: 'Cor clara', def: '#00e5ff' },
      { k: 'con', label: 'Contraste', min: -1, max: 3, def: 0.4 },
      { k: 'gam', label: 'Gama', min: 0.2, max: 3, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float l = luma(srccol(uv));',
      '  l = clamp((l-0.5)*(1.0+u_con)+0.5, 0.0, 1.0);',
      '  l = pow(l, max(u_gam,0.05));',
      '  return mix(u_dark, u_light, l);',
      '}'
    ].join('\n')
  });

  D({
    id: 'gradmap', name: 'Mapa de gradiente', cat: 'cor', color: '#ffb020',
    desc: 'três cores nas sombras, meios e luzes',
    params: [
      { k: 'c1', t: 'c', label: 'Sombras', def: '#12002e' },
      { k: 'c2', t: 'c', label: 'Meios-tons', def: '#ff2e63' },
      { k: 'c3', t: 'c', label: 'Luzes', def: '#ffe066' },
      { k: 'gain', label: 'Ganho', min: 0.2, max: 3, def: 1 },
      { k: 'gam', label: 'Gama', min: 0.2, max: 3, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float l = clamp(pow(luma(srccol(uv))*u_gain, max(u_gam,0.05)), 0.0, 1.0);',
      '  return (l < 0.5) ? mix(u_c1, u_c2, l*2.0) : mix(u_c2, u_c3, (l-0.5)*2.0);',
      '}'
    ].join('\n')
  });

  D({
    id: 'posterize', name: 'Posterizar', cat: 'cor', color: '#ffb020',
    desc: 'reduz o número de cores',
    params: [
      { k: 'lev', label: 'Níveis', min: 2, max: 24, step: 1, def: 5 },
      { k: 'dith', label: 'Ruído (dither)', min: 0, max: 2, def: 0.2 },
      { k: 'sat', label: 'Saturação', min: -1, max: 2, def: 0.3 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  float l = luma(c); c = mix(vec3(l), c, 1.0+u_sat);',
      '  float n = max(u_lev, 2.0);',
      '  float d = (hash21(uv*uRes + floor(uTime*24.0))-0.5)*u_dith/n;',
      '  return clamp(floor((c+d)*n + 0.5)/n, 0.0, 1.0);',
      '}'
    ].join('\n')
  });

  D({
    id: 'threshold', name: 'Preto e branco duro', cat: 'cor', color: '#ffb020',
    desc: 'corte de luminância em duas cores',
    params: [
      { k: 'lev', label: 'Corte', min: 0, max: 1, def: 0.45 },
      { k: 'soft', label: 'Suavidade', min: 0.001, max: 0.4, step: 0.001, def: 0.03 },
      { k: 'dark', t: 'c', label: 'Cor escura', def: '#000000' },
      { k: 'light', t: 'c', label: 'Cor clara', def: '#ffffff' },
      { k: 'noise', label: 'Granulado no corte', min: 0, max: 0.4, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float l = luma(srccol(uv));',
      '  l += (hash21(uv*uRes + floor(uTime*24.0))-0.5)*u_noise;',
      '  float t = smoothstep(u_lev-u_soft, u_lev+u_soft, l);',
      '  return mix(u_dark, u_light, t);',
      '}'
    ].join('\n')
  });

  D({
    id: 'invert', name: 'Negativo', cat: 'cor', color: '#ffb020',
    desc: 'inverte cores, brilho ou matiz',
    params: [
      { k: 'mode', t: 's', label: 'Modo', def: 0, opts: ['RGB (negativo)', 'Só brilho', 'Só matiz (180°)', 'Solarizar'] }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  if(u_mode < 0.5) return 1.0 - c;',
      '  if(u_mode < 1.5){ float l = luma(c); return clamp(c + (1.0 - 2.0*l), 0.0, 1.0); }',
      '  if(u_mode < 2.5){ vec3 h = rgb2hsv(c); h.x = fract(h.x+0.5); return hsv2rgb(h); }',
      '  return abs(1.0 - 2.0*c);',
      '}'
    ].join('\n')
  });

  D({
    id: 'vhs', name: 'VHS', cat: 'cor', color: '#ffb020',
    desc: 'sangramento de cor, ruído e tracking',
    params: [
      { k: 'bleed', label: 'Sangramento de cor', min: 0, max: 3, def: 1 },
      { k: 'track', label: 'Tracking (barras)', min: 0, max: 1, def: 0.35 },
      { k: 'wob', label: 'Tremida horizontal', min: 0, max: 3, def: 0.6 },
      { k: 'lines', label: 'Frequência da tremida', min: 5, max: 400, step: 1, def: 90 },
      { k: 'noise', label: 'Chuvisco', min: 0, max: 1, def: 0.18 },
      { k: 'scan', label: 'Linhas de varredura', min: 0, max: 1, def: 0.25 },
      { k: 'sat', label: 'Saturação', min: -1, max: 2, def: 0.25 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float t = uTime;',
      '  float wob = sin(uv.y*u_lines + t*6.0)*u_wob*0.006 + sin(uv.y*u_lines*0.31 - t*2.0)*u_wob*0.004;',
      '  float bandPos = fract(uv.y*1.15 - t*0.26);',
      '  float band = smoothstep(0.985, 1.0, bandPos)*u_track;',
      '  vec2 duv = uv + vec2(wob + band*0.09*hash11(floor(t*12.0)), 0.0);',
      '  float bl = u_bleed*0.012;',
      '  vec3 c;',
      '  c.r = srccol(duv + vec2(bl, 0.0)).r;',
      '  c.g = srccol(duv).g;',
      '  c.b = srccol(duv - vec2(bl*0.7, 0.0)).b;',
      '  c.r += srccol(duv + vec2(bl*2.0, 0.0)).r*0.35*u_bleed*0.4;',
      '  c += (hash21(uv*uRes*0.7 + t*97.0)-0.5)*u_noise;',
      '  c *= 1.0 - u_scan*0.45*step(0.5, fract(uv.y*uRes.y*0.5));',
      '  c += band*0.12;',
      '  float l = luma(c);',
      '  return mix(vec3(l), c, 1.0+u_sat);',
      '}'
    ].join('\n')
  });

  D({
    id: 'film', name: 'Filme antigo', cat: 'cor', color: '#ffb020',
    desc: 'sépia, grão, riscos, cintilação e vinheta',
    params: [
      { k: 'sepia', label: 'Sépia', min: 0, max: 1, def: 0.7 },
      { k: 'grain', label: 'Grão', min: 0, max: 0.6, def: 0.14 },
      { k: 'scratch', label: 'Riscos', min: 0, max: 1, def: 0.35 },
      { k: 'flick', label: 'Cintilação', min: 0, max: 1, def: 0.18 },
      { k: 'vig', label: 'Vinheta', min: 0, max: 1.5, def: 0.7 },
      { k: 'con', label: 'Contraste', min: -1, max: 2, def: 0.25 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  c = (c-0.5)*(1.0+u_con)+0.5;',
      '  float l = luma(c);',
      '  c = mix(c, vec3(l*1.08, l*0.93, l*0.72), u_sepia);',
      '  float fr = floor(uTime*22.0);',
      '  c *= 1.0 + (hash11(fr)-0.5)*u_flick;',
      '  c += (hash21(uv*uRes + fr*13.7)-0.5)*u_grain;',
      '  float sx = hash11(floor(uv.x*180.0)*1.7 + fr*57.0);',
      '  c += step(0.997 - u_scratch*0.006, sx)*0.5*u_scratch;',
      '  float dust = step(0.9994, hash21(floor(uv*uRes/3.0) + fr*31.0));',
      '  c -= dust*u_scratch*0.9;',
      '  vec2 d = uv-0.5; d.x *= uAspect;',
      '  c *= 1.0 - smoothstep(0.33, 0.8, length(d))*u_vig;',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* ================= LUZ / TEXTURA ================= */

  D({
    id: 'bloom', name: 'Brilho / Neon glow', cat: 'luz', color: '#ffe066',
    desc: 'espalha a luz das áreas claras',
    params: [
      { k: 'thr', label: 'Limiar', min: 0, max: 1, def: 0.55 },
      { k: 'rad', label: 'Raio', min: 0.1, max: 6, def: 1.4 },
      { k: 'int', label: 'Intensidade', min: 0, max: 4, def: 1.1 },
      { k: 'tint', t: 'c', label: 'Cor do brilho', def: '#ffffff' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 c = srccol(uv);',
      '  vec3 sum = vec3(0.0);',
      '  for(int i=0;i<24;i++){',
      '    float fi = float(i);',
      '    float a = fi*2.39996;',
      '    float r = sqrt((fi+0.5)/24.0)*u_rad*0.05;',
      '    vec2 o = vec2(cos(a), sin(a))*r*vec2(1.0/uAspect, 1.0);',
      '    vec3 s = srccol(uv+o);',
      '    sum += s*max(luma(s)-u_thr, 0.0);',
      '  }',
      '  sum /= 24.0;',
      '  return c + sum*u_int*4.0*u_tint;',
      '}'
    ].join('\n')
  });

  D({
    id: 'blur', name: 'Desfoque', cat: 'luz', color: '#ffe066',
    desc: 'suaviza a imagem (ou só uma região)',
    params: [
      { k: 'rad', label: 'Raio', min: 0, max: 8, def: 1.6 },
      { k: 'mixv', label: 'Mistura', min: 0, max: 1, def: 1 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec3 sum = vec3(0.0);',
      '  for(int i=0;i<20;i++){',
      '    float fi = float(i);',
      '    float a = fi*2.39996;',
      '    float r = sqrt((fi+0.5)/20.0)*u_rad*0.02;',
      '    sum += srccol(uv + vec2(cos(a), sin(a))*r*vec2(1.0/uAspect, 1.0));',
      '  }',
      '  return mix(srccol(uv), sum/20.0, u_mixv);',
      '}'
    ].join('\n')
  });

  D({
    id: 'sharpen', name: 'Nitidez', cat: 'luz', color: '#ffe066',
    desc: 'realça bordas e detalhes',
    params: [
      { k: 'amt', label: 'Força', min: 0, max: 3, def: 0.8 },
      { k: 'rad', label: 'Raio', min: 0.5, max: 6, def: 1.2 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 t = vec2(u_rad)/uRes;',
      '  vec3 c = srccol(uv)*(1.0 + 4.0*u_amt);',
      '  c -= (srccol(uv+vec2(t.x,0.0)) + srccol(uv-vec2(t.x,0.0)) + srccol(uv+vec2(0.0,t.y)) + srccol(uv-vec2(0.0,t.y)))*u_amt;',
      '  return c;',
      '}'
    ].join('\n')
  });

  D({
    id: 'vignette', name: 'Vinheta', cat: 'luz', color: '#ffe066',
    desc: 'escurece (ou colore) as bordas',
    params: [
      { k: 'size', label: 'Tamanho', min: 0, max: 1, def: 0.36 },
      { k: 'soft', label: 'Suavidade', min: 0.01, max: 1, def: 0.4 },
      { k: 'int', label: 'Intensidade', min: 0, max: 1, def: 0.85 },
      { k: 'col', t: 'c', label: 'Cor', def: '#000000' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 d = uv-0.5; d.x *= uAspect;',
      '  float v = smoothstep(u_size, u_size+max(u_soft,0.01), length(d));',
      '  return mix(srccol(uv), u_col, v*u_int);',
      '}'
    ].join('\n')
  });

  D({
    id: 'halftone', name: 'Meio-tom (bolinhas)', cat: 'luz', color: '#ffe066',
    desc: 'impressão de jornal / pop art',
    params: [
      { k: 'size', label: 'Tamanho do ponto', min: 2, max: 40, step: 0.5, def: 7 },
      { k: 'ang', label: 'Ângulo', min: 0, max: 180, step: 1, def: 30 },
      { k: 'scale', label: 'Cheio', min: 0.2, max: 2, def: 1 },
      { k: 'col', t: 'b', label: 'Manter cor original', def: 0 },
      { k: 'ink', t: 'c', label: 'Cor da tinta', def: '#0a0a0a' },
      { k: 'bg', t: 'c', label: 'Cor do papel', def: '#f2ede0' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float s = max(u_size, 2.0);',
      '  float a = radians(u_ang);',
      '  vec2 p = uv*uRes;',
      '  vec2 r = rot2(p, a);',
      '  vec2 g = mod(r, s) - s*0.5;',
      '  vec2 back = rot2(r - g, -a);',
      '  vec3 src = srccol(back/uRes);',
      '  float l = luma(src);',
      '  float rad = (1.0-l)*s*0.72*u_scale;',
      '  float d = 1.0 - smoothstep(rad-1.1, rad+1.1, length(g));',
      '  vec3 ink = mix(u_ink, src, u_col);',
      '  return mix(u_bg, ink, d);',
      '}'
    ].join('\n')
  });

  D({
    id: 'dither', name: 'Dither / 8-bit', cat: 'luz', color: '#ffe066',
    desc: 'padrão de pontos estilo console antigo',
    params: [
      { k: 'px', label: 'Pixel', min: 1, max: 16, step: 1, def: 3 },
      { k: 'lev', label: 'Níveis de cor', min: 2, max: 8, step: 1, def: 3 },
      { k: 'mono', t: 'b', label: 'Duas cores', def: 0 },
      { k: 'dark', t: 'c', label: 'Cor escura', def: '#0f1c0f' },
      { k: 'light', t: 'c', label: 'Cor clara', def: '#9bff6a' }
    ],
    glsl: [
      'const float BAYER[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);',
      'vec3 fx(vec2 uv){',
      '  float px = max(u_px, 1.0);',
      '  vec2 p = floor(uv*uRes/px);',
      '  vec3 c = srccol((p+0.5)*px/uRes);',
      '  int bi = int(mod(p.x,4.0)) + int(mod(p.y,4.0))*4;',
      '  float th = (BAYER[bi]+0.5)/16.0;',
      '  if(u_mono > 0.5){ return mix(u_dark, u_light, step(th, luma(c))); }',
      '  float n = max(u_lev, 2.0) - 1.0;',
      '  return clamp(floor(c*n + th)/n, 0.0, 1.0);',
      '}'
    ].join('\n')
  });

  D({
    id: 'edge', name: 'Contorno (Sobel)', cat: 'luz', color: '#ffe066',
    desc: 'só as linhas — estilo desenho / raio-x',
    params: [
      { k: 'w', label: 'Espessura', min: 0.5, max: 5, def: 1.3 },
      { k: 'gain', label: 'Ganho', min: 0.2, max: 8, def: 2.4 },
      { k: 'thr', label: 'Limiar', min: 0, max: 1, def: 0.18 },
      { k: 'keep', label: 'Manter vídeo ao fundo', min: 0, max: 1, def: 0 },
      { k: 'srccol', label: 'Linha com cor do vídeo', min: 0, max: 1, def: 0 },
      { k: 'line', t: 'c', label: 'Cor da linha', def: '#00ffc8' },
      { k: 'bg', t: 'c', label: 'Cor do fundo', def: '#000000' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 t = vec2(u_w)/uRes;',
      '  float a=luma(srccol(uv+vec2(-t.x,-t.y))), b=luma(srccol(uv+vec2(0.0,-t.y))), c=luma(srccol(uv+vec2(t.x,-t.y)));',
      '  float d=luma(srccol(uv+vec2(-t.x,0.0))),                                       f=luma(srccol(uv+vec2(t.x,0.0)));',
      '  float g=luma(srccol(uv+vec2(-t.x,t.y))),  h=luma(srccol(uv+vec2(0.0,t.y))),  i=luma(srccol(uv+vec2(t.x,t.y)));',
      '  float gx = -a -2.0*d -g + c + 2.0*f + i;',
      '  float gy = -a -2.0*b -c + g + 2.0*h + i;',
      '  float e = smoothstep(u_thr, u_thr+0.25, length(vec2(gx,gy))*u_gain);',
      '  vec3 bg = mix(u_bg, srccol(uv), u_keep);',
      '  vec3 ln = mix(u_line, srccol(uv), u_srccol);',
      '  return mix(bg, ln, e);',
      '}'
    ].join('\n')
  });

  D({
    id: 'flash', name: 'Flash / Strobe', cat: 'luz', color: '#ffe066',
    desc: 'piscadas ritmadas — cuidado com fotossensibilidade',
    params: [
      { k: 'freq', label: 'Piscadas por segundo', min: 0.2, max: 20, step: 0.1, def: 4 },
      { k: 'duty', label: 'Duração do flash', min: 0.02, max: 1, def: 0.25 },
      { k: 'fall', label: 'Decaimento', min: 0, max: 1, def: 0.8 },
      { k: 'int', label: 'Intensidade', min: 0, max: 3, def: 1 },
      { k: 'mode', t: 's', label: 'Tipo', def: 0, opts: ['Brilho (soma)', 'Cor cheia', 'Negativo piscando', 'Superexposição'] },
      { k: 'col', t: 'c', label: 'Cor do flash', def: '#ffffff' }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  float duty = clamp(u_duty, 0.02, 1.0);',
      '  float ph = fract(uLocal*max(u_freq, 0.05));',
      '  float on = step(ph, duty);',
      '  float env = on*(1.0 - (ph/duty)*u_fall);',
      '  vec3 c = srccol(uv);',
      '  if(u_mode < 0.5) return c + u_col*env*u_int;',
      '  if(u_mode < 1.5) return mix(c, u_col, clamp(env*u_int, 0.0, 1.0));',
      '  if(u_mode < 2.5) return mix(c, 1.0-c, clamp(env*u_int, 0.0, 1.0));',
      '  return c*(1.0 + env*u_int*3.0);',
      '}'
    ].join('\n')
  });

})(window.VE);
