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

  /* ====================================================== VHS =============
     Reconstruído pela CADEIA DE SINAL, não por aparência. A fita não é um
     filtro de cor com barras: é uma gravação com pouca banda, com a cor
     gravada em separado e atrasada, com a mecânica errando o tempo de cada
     linha e com a cabeça trocando no rodapé do quadro.

     O que a fita faz, na ordem em que faz:

       1. a MECÂNICA erra                a linha inteira anda para o lado
          · erro de base de tempo          ruído rápido, linha a linha, com
                                           algumas linhas indo MUITO longe
          · ondulação                      onda lenta ao longo da altura
          · vinco da fita                  uma faixa que empurra e clareia
          · tracking                       a faixa que perde o sincronismo
          · troca de cabeça                as últimas linhas do quadro
          · salto vertical                 o quadro inteiro pula
          · BORDA RASGADA                  a linha empurrada para fora do
                                           quadro mostra a beira da fita:
                                           preto com sujeira de cor. É o
                                           dente irregular nos dois lados, e
                                           é o que mais entrega o formato
       2. a LUZ perde banda              VHS resolve ~240 linhas na horizontal
       3. a LUZ ARRASTA para a direita   o rabo do amplificador da cabeça
       4. a COR perde MUITO mais banda   cerca de sete vezes mais que a luz
       5. a COR chega ATRASADA           por isso ela escorre para a direita
       6. o DECK realça a borda          o halo claro que todo VHS tem
       7. a FITA suja                    chuvisco, perda de fita, cintilação

     TUDO EM UNIDADES DE FITA, e isto é a correção mais importante desta
     segunda volta: uma fita não sabe quantos pixels você tem. Antes o
     atraso da cor era "6 pixels de tela" — 1,9% da largura numa prévia de
     320 e 0,3% num quadro de 1920, ou seja, o MESMO ajuste dava fitas
     diferentes conforme o tamanho do projeto. Agora a régua é a fita:

       720 amostras por linha  ·  480 linhas
       o atraso, o realce, a suavidade, o grão, os riscos e as listras são
       frações DISSO, e o resultado é o mesmo em 320 ou em 4K.

     TRÊS PASSADAS, porque borrão largo com poucas amostras deixa buraco:
       0 · mecânica + luz com pouca banda   (lê a imagem que entrou)
       1 · cor com muito menos banda        (lê a passada 0)
       2 · rabo, atraso, franja, realce, sujeira  (compõe)

     Entre as passadas o sinal viaja em YIQ — luz num canal, cor em dois —
     porque é assim que a fita guarda, e é o que permite borrar a cor sem
     borrar a luz. Como o quadro de trabalho é de 8 bits, I e Q vão
     deslocados para 0..1 e voltam na última passada.

     Os SETE parâmetros antigos continuam com as mesmas chaves: um projeto
     salvo com este efeito continua achando `bleed`, `track`, `wob`,
     `lines`, `noise`, `scan` e `sat`.
     ====================================================================== */
  D({
    id: 'vhs', name: 'VHS', cat: 'cor', color: '#ffb020',
    passes: 3,
    desc: 'a cadeia da fita: pouca banda, cor atrasada, borda rasgada e a cabeça trocando',
    params: [
      { k: 'res', label: 'Resolução (linhas)', min: 40, max: 640, step: 1, def: 250 },
      { k: 'soft', label: 'Suavidade', min: 0, max: 3, def: 1.15 },
      { k: 'sharp', label: 'Realce do deck', min: 0, max: 2, def: 0.3 },
      { k: 'smear', label: 'Rabo de luz', min: 0, max: 2, def: 0.35 },
      { k: 'cdelay', label: 'Atraso da cor', min: -12, max: 30, step: 0.1, def: 8 },
      { k: 'bleed', label: 'Sangramento da cor', min: 0, max: 3, def: 0.7 },
      { k: 'fring', label: 'Franja de cor', min: 0, max: 3, def: 1 },
      { k: 'cshift', label: 'Desvio de matiz', min: -1, max: 1, def: 0.04 },
      { k: 'sat', label: 'Saturação', min: -1, max: 2, def: 0.45 },
      { k: 'wob', label: 'Ondulação', min: 0, max: 3, def: 0.7 },
      { k: 'lines', label: 'Frequência da onda', min: 5, max: 400, step: 1, def: 90 },
      { k: 'tbe', label: 'Erro de base de tempo', min: 0, max: 3, def: 0.5 },
      { k: 'tear', label: 'Borda rasgada', min: 0, max: 2, def: 1 },
      { k: 'vjump', label: 'Salto vertical', min: 0, max: 1, def: 0.06 },
      { k: 'crease', label: 'Vinco da fita', min: 0, max: 2, def: 0.5 },
      { k: 'track', label: 'Tracking (barras)', min: 0, max: 2, def: 0.35 },
      { k: 'head', label: 'Troca de cabeça', min: 0, max: 2, def: 0.8 },
      { k: 'drop', label: 'Perda de fita', min: 0, max: 2, def: 0.5 },
      { k: 'noise', label: 'Chuvisco', min: 0, max: 1, def: 0.09 },
      { k: 'flick', label: 'Cintilação', min: 0, max: 1, def: 0.08 },
      { k: 'scan', label: 'Linhas de varredura', min: 0, max: 1, def: 0.15 },
      { k: 'gen', label: 'Geração da cópia', min: 0, max: 3, def: 0.4 }
    ],
    glsl: [
      /* ------------------------------------------- a régua é a FITA ---- */
      '#define VHS_AMOSTRAS 720.0',
      '#define VHS_LINHAS 480.0',
      /* --------------------------------------------------- luz e cor ---- */
      'vec3 vhsYIQ(vec3 c){',
      '  return vec3(dot(c, vec3(0.299, 0.587, 0.114)),',
      '              dot(c, vec3(0.596, -0.274, -0.322)),',
      '              dot(c, vec3(0.211, -0.523, 0.312)));',
      '}',
      'vec3 vhsRGB(vec3 y){',
      '  return vec3(y.x + 0.956*y.y + 0.621*y.z,',
      '              y.x - 0.272*y.y - 0.647*y.z,',
      '              y.x - 1.106*y.y + 1.703*y.z);',
      '}',
      'float vhsGer(){ return clamp(u_gen, 0.0, 3.0); }',
      'float vhsLargL(){',
      '  float r = max(u_res, 24.0)/(1.0 + vhsGer()*0.45);',
      '  return 1.0/max(r, 12.0);',
      '}',
      'float vhsLargC(){ return vhsLargL()*(1.0 + u_bleed*6.5)*(1.0 + vhsGer()*0.5); }',
      /* o quadro da FITA: 30 por segundo, para o ruído não tremer no ritmo
         da tela em vez do ritmo da fita */
      'float vhsQuadro(){ return floor(uTime*30.0); }',
      /* ------------------------------------------------- a mecânica ----- */
      'float vhsBanda(){ return fract(uTime*0.11 + 0.37); }',
      'float vhsVinco(){ return fract(uTime*0.043 + 0.12); }',
      /* Quanto esta altura está dentro do rodapé, onde a cabeça troca.
         MEDIDO, não suposto: com `head` no máximo, a sujeira caiu nas dez
         PRIMEIRAS linhas da tela quando o teste era "y perto de 1". Ou seja
         y = 0 é a base da tela, e é lá que a cabeça troca num VHS.       */
      'float vhsCabeca(float y){',
      '  float faixa = 0.012 + 0.02*clamp(u_head, 0.0, 2.0);',
      '  return smoothstep(faixa, 0.0, y);',
      '}',
      'float vhsSaltoY(float fr){',
      '  float lento = (vnoise(vec2(fr*0.06, 3.3)) - 0.5)*0.03;',
      '  float pulo = step(0.985, hash11(fr*1.7 + 5.0))*(hash11(fr*2.9) - 0.5)*0.22;',
      '  return (lento + pulo)*u_vjump;',
      '}',
      /* TUDO o que empurra uma linha para o lado, somado. A mesma função é
         usada na passada da mecânica e na do acabamento, para a sujeira
         cair exatamente onde a imagem foi empurrada.

         A cauda LONGA é o que faz o dente da borda: a maioria das linhas
         anda pouco (a imagem parece firme) e uma em cada catorze vai muito
         longe. Sem isso, ou o quadro inteiro treme, ou não há rasgo.    */
      'float vhsDesloc(float y, float fr){',
      '  float lin = floor(y*VHS_LINHAS);',
      '  float n1 = hash21(vec2(lin, fr)) - 0.5;',
      '  float n2 = hash21(vec2(floor(lin/7.0), fr*1.7)) - 0.5;',
      '  float tbe = (n1*0.62 + n2*0.38)*u_tbe*0.006;',
      '  float u = hash21(vec2(lin, fr*5.0 + 11.0));',
      '  float lado = hash21(vec2(lin, fr*7.0 + 3.0)) - 0.5;',
      '  tbe += sign(lado)*pow(u, 3.0)*u_tbe*0.02;',
      '  float w = sin(y*u_lines*0.35 + uTime*2.7) + 0.55*sin(y*u_lines*0.11 - uTime*1.3);',
      '  float wob = w*u_wob*0.004;',
      '  float dv = y - vhsVinco();',
      '  float vinco = exp(-dv*dv*9000.0)*clamp(u_crease, 0.0, 2.0);',
      '  float sv = vinco*(0.02 + 0.05*hash11(fr*0.37));',
      '  float db = y - vhsBanda();',
      '  float banda = exp(-db*db*2000.0)*clamp(u_track, 0.0, 2.0);',
      '  float sb = banda*(hash21(vec2(lin, fr*3.1)) - 0.5)*0.10;',
      '  float hs = vhsCabeca(y);',
      '  float sh = hs*(0.03 + 0.06*(hash11(fr) - 0.5))*clamp(u_head, 0.0, 2.0);',
      '  return tbe + wob + sv + sb + sh;',
      '}',
      /* A BEIRA DA FITA: o que existe fora da imagem gravada. Não é preto
         chapado — é preto com a sujeira de cor do sinal que sobra ali, e é
         por isso que o dente sai magenta e laranja, e não cinza.

         A LARGURA da beira é sorteada POR LINHA, com lei de potência:
         quase toda linha mostra um fio e uma em cada dez mostra um dente
         longo. Isso é o que estava errado na primeira tentativa — eu fazia
         o dente empurrando a linha inteira, e então a imagem tinha de
         tremer para a borda existir. Na fita são duas coisas separadas: o
         quadro fica firme e a beira é que é irregular.                 */
      'float vhsBeiraLarg(float lin, float fr, float lado){',
      '  float u = hash21(vec2(lin*1.7 + lado*311.0, fr*2.3));',
      '  return (0.004 + pow(u, 3.0)*0.085)*clamp(u_tear, 0.0, 2.0);',
      '}',
      'vec3 vhsBeira(float px, float lin, float fr){',
      '  float r = hash21(vec2(floor(px*VHS_AMOSTRAS), lin + fr*3.0));',
      '  float claro = step(0.86, r)*r;',
      '  return vec3(r*0.10 + claro*0.7,',
      '              (hash11(r*31.0 + lin*0.13) - 0.5)*1.1,',
      '              (hash11(r*57.0 + lin*0.29) - 0.5)*1.1);',
      '}',
      /* ============================== PASSADA 0 · mecânica e banda de luz */
      'vec4 vhsFita(vec2 uv){',
      '  float fr = vhsQuadro();',
      '  vec2 p = uv;',
      '  p.y = clamp(p.y + vhsSaltoY(fr), 0.0, 1.0);',
      '  float dx = vhsDesloc(p.y, fr);',
      '  float lin = floor(p.y*VHS_LINHAS);',
      '  float passo = vhsLargL()/8.0;',
      '  float rasga = clamp(u_tear, 0.0, 2.0);',
      '  float esq = vhsBeiraLarg(lin, fr, 0.0);',
      '  float dir = 1.0 - vhsBeiraLarg(lin, fr, 1.0);',
      '  vec3 acc = vec3(0.0);',
      '  for(int i=0;i<8;i++){',
      '    float px = p.x + dx + (float(i) - 3.5)*passo;',
      '    float xt = uv.x + (float(i) - 3.5)*passo;',
      '    bool beira = (rasga > 0.01) && (xt < esq || xt > dir || px < 0.0 || px > 1.0);',
      '    if(beira){',
      '      acc += vhsBeira(xt, lin, fr);',
      '    } else {',
      '      acc += vhsYIQ(texture(uOrig, vec2(clamp(px, 0.0, 1.0), p.y)).rgb);',
      '    }',
      '  }',
      '  vec3 yiq = acc/8.0;',
      '  return vec4(yiq.x, yiq.y*0.5 + 0.5, yiq.z*0.5 + 0.5, 1.0);',
      '}',
      /* ================================ PASSADA 1 · a cor perde a banda */
      'vec4 vhsCroma(vec2 uv){',
      '  float passo = vhsLargC()/8.0;',
      '  vec2 iq = vec2(0.0);',
      '  for(int i=0;i<8;i++){',
      '    float o = (float(i) - 3.5)*passo;',
      '    iq += texture(uTex, clamp(vec2(uv.x + o, uv.y), 0.0, 1.0)).yz;',
      '  }',
      '  iq /= 8.0;',
      /* a fita também é macia no vertical, e isso é da cabeça, não da banda */
      '  float sv = u_soft*1.1/VHS_LINHAS;',
      '  float y = texture(uTex, uv).x*0.44',
      '          + texture(uTex, clamp(vec2(uv.x, uv.y + sv), 0.0, 1.0)).x*0.28',
      '          + texture(uTex, clamp(vec2(uv.x, uv.y - sv), 0.0, 1.0)).x*0.28;',
      '  return vec4(y, iq, 1.0);',
      '}',
      /* ===================================== PASSADA 2 · o acabamento */
      'vec3 vhsFim(vec2 uv){',
      '  float fr = vhsQuadro();',
      '  float ger = vhsGer();',
      '  float am = 1.0/VHS_AMOSTRAS;',
      '  float Y = texture(uTex, uv).x;',
      /* O RABO DE LUZ: o amplificador da cabeça não acompanha o degrau e
         arrasta o que passou para a direita. É assimétrico de propósito —
         só olha para trás — e é o que faz o objeto claro deixar cauda.  */
      '  if(u_smear > 0.005){',
      '    float soma = 0.0, w = 0.0;',
      '    for(int i=1;i<=6;i++){',
      '      float wi = exp(-float(i)*0.55);',
      '      soma += texture(uTex, clamp(vec2(uv.x - float(i)*u_smear*5.0*am, uv.y), 0.0, 1.0)).x*wi;',
      '      w += wi;',
      '    }',
      '    Y = mix(Y, soma/max(w, 1e-4), clamp(u_smear, 0.0, 1.0)*0.6);',
      '  }',
      /* a cor chega depois da luz: é por isso que ela escorre para a direita */
      '  float d = u_cdelay*am;',
      '  vec2 iq0 = texture(uTex, clamp(vec2(uv.x - d, uv.y), 0.0, 1.0)).yz*2.0 - 1.0;',
      '  vec2 iq1 = texture(uTex, clamp(vec2(uv.x - d - 3.0*am, uv.y), 0.0, 1.0)).yz*2.0 - 1.0;',
      /* franja: a diferença entre dois instantes da cor, realçada. Em área
         chapada é zero; na borda de cor vira o halo que a fita faz.      */
      '  vec2 iq = iq0 + u_fring*0.9*(iq0 - iq1);',
      /* erro de fase: a matiz inteira gira */
      '  float a = u_cshift*PI;',
      '  float ca = cos(a), sa = sin(a);',
      '  iq = vec2(iq.x*ca - iq.y*sa, iq.x*sa + iq.y*ca);',
      '  iq *= 1.0 + u_sat;',
      /* o realce de borda do deck: horizontal, como o circuito faz */
      '  float ya = texture(uTex, clamp(vec2(uv.x - 2.0*am, uv.y), 0.0, 1.0)).x;',
      '  float yb = texture(uTex, clamp(vec2(uv.x + 2.0*am, uv.y), 0.0, 1.0)).x;',
      '  Y += u_sharp*1.5*(Y - (ya + yb)*0.5);',
      '  Y *= 1.0 + (hash11(fr*1.13) - 0.5)*u_flick*0.8;',
      '  float dv = uv.y - vhsVinco();',
      '  Y += exp(-dv*dv*9000.0)*clamp(u_crease, 0.0, 2.0)*0.10;',
      /* chuvisco: o grão é da FITA, então tem o tamanho da amostra e não do
         pixel — a mesma imagem em 4K não fica com grão mais fino */
      '  float ruido = u_noise*(1.0 + ger*0.5);',
      '  vec2 gr = floor(uv*vec2(VHS_AMOSTRAS, VHS_LINHAS));',
      '  Y += (hash21(gr + fr*71.0) - 0.5)*ruido*(1.10 - 0.55*clamp(Y, 0.0, 1.0));',
      '  iq += (hash22(floor(uv*vec2(180.0, 240.0)) + fr*29.0) - 0.5)*ruido*0.18;',
      /* perda de fita: risco claro e curto, de UMA linha de fita */
      '  float lf = floor(uv.y*VHS_LINHAS);',
      '  float ds = hash21(vec2(lf, fr*3.7));',
      '  float lim = 1.0 - clamp(u_drop, 0.0, 2.0)*(1.0 + ger*0.8)*0.05;',
      '  if(ds > lim){',
      '    float x0 = hash11(ds*57.3 + 1.0);',
      '    float len = 0.006 + hash11(ds*91.7 + 2.0)*0.10;',
      '    float dentro = step(x0, uv.x)*step(uv.x, x0 + len);',
      '    Y = mix(Y, 1.0, dentro*0.92);',
      '    iq = mix(iq, vec2(0.0), dentro*0.88);',
      '  }',
      /* tracking: dentro da faixa o sinal vira ruído e a cor some */
      '  float db = uv.y - vhsBanda();',
      '  float banda = exp(-db*db*2000.0)*clamp(u_track, 0.0, 2.0);',
      '  if(banda > 0.002){',
      '    float r = hash21(vec2(floor(uv.x*180.0), lf + fr*13.0));',
      '    float k = min(banda, 1.0);',
      '    Y = mix(Y, r*0.85 + 0.12, k*0.85);',
      '    iq = mix(iq, vec2(0.0), k*0.92);',
      '  }',
      /* troca de cabeça: o rabo do quadro, onde a cabeça deixa a fita */
      '  float hs = vhsCabeca(uv.y);',
      '  if(hs > 0.001){',
      '    float r = hash21(vec2(floor(uv.x*360.0), lf + fr*17.0));',
      '    float k = clamp(hs*clamp(u_head, 0.0, 2.0), 0.0, 1.0);',
      '    Y = mix(Y, r, k*0.9);',
      '    iq = mix(iq, vec2(0.0), k*0.95);',
      '  }',
      '  vec3 c = vhsRGB(vec3(Y, iq));',
      /* a listra é da varredura de 480 linhas, não da grade de pixels */
      '  c *= 1.0 - u_scan*0.45*step(0.5, fract(uv.y*VHS_LINHAS*0.5));',
      '  return c;',
      '}',
      /* --------------------------------------------------- as passadas -- */
      'vec4 fxStep(vec2 uv){',
      '  if(uPass < 0.5) return vhsFita(uv);',
      '  return vhsCroma(uv);',
      '}',
      'vec3 fxLast(vec2 uv){ return vhsFim(uv); }'
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
