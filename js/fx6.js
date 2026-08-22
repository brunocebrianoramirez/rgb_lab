/* ============================================================
   rgb_lab — COLOR ENGINE · IMPLEMENTAÇÃO EM GPU
   ------------------------------------------------------------
   O gêmeo em GLSL de js/color/engine.js. Uma passada de fragment
   por look — decode, espaço de trabalho, look criativo, transform
   de saída, tudo no mesmo shader.

   As TABELAS de look e de perfil são GERADAS a partir dos registros
   (js/color/looks.js e profiles.js) na hora de montar o shader. Por
   isso acrescentar um look é acrescentar uma entrada no registro:
   o shader se refaz sozinho e o núcleo não muda.

   A força do look interpola PARÂMETROS dentro do shader (mixLookP),
   não a saída. É o que faz 50% de um look parecer com o look pela
   metade, e não com uma dissolução entre duas imagens.

   Grão, fade e vinheta NÃO moram aqui: são ferramentas separadas,
   aplicadas depois, como no fluxo que a spec pediu.
   ============================================================ */
(function (VE) {
  'use strict';

  var C = VE.color;
  if (!C || !C.LOOKS) { console.error('fx6: color engine não carregou antes'); return; }

  /* ================= geradores de tabela ================= */

  function f(v) {
    var s = (+v).toFixed(6);
    return (s.indexOf('.') < 0 && s.indexOf('e') < 0) ? s + '.0' : s;
  }

  /* JS guarda a matriz em linha; GLSL constrói mat3 por coluna */
  function glslMat3(m) {
    return 'mat3(' + [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]].map(f).join(',') + ')';
  }

  var TFI = { srgb: 0, bt1886: 1, rec709: 2, pq: 3, hlg: 4, slog3: 5, logc3: 6, clog3: 7, bmdfilm5: 8, applelog: 9 };

  /* --- tabela de perfis de entrada --- */
  function profileTables() {
    var s = 'void profParams(int P, out mat3 M, out float rng, out int tfi, out float isHdr){\n';
    s += '  M = mat3(1.0); rng = 0.0; tfi = 0; isHdr = 0.0;\n';
    C.PROFILES.forEach(function (p, i) {
      s += (i === 0 ? '  if' : '  else if') + '(P==' + i + '){ M=' + glslMat3(C.profileMatrix(p.id)) +
        '; rng=' + f(p.range === 'limited' ? 1 : 0) + '; tfi=' + TFI[p.tf] + '; isHdr=' + f(p.hdr ? 1 : 0) + '; }\n';
    });
    s += '}\n';
    return s;
  }

  /* --- tabela de looks --- */
  function lookTables() {
    var s = 'void lookParams(int K, out LookP P){\n  P = identityLookP();\n';
    C.LOOKS.forEach(function (L, i) {
      s += (i === 0 ? '  if' : '  else if') + '(K==' + i + '){\n';
      s += '    P.expo=' + f(L.exposure) + '; P.temp=' + f(L.temp) + '; P.tint=' + f(L.tint) + ';\n';
      s += '    P.con=' + f(L.contrast) + '; P.piv=' + f(L.pivot) + '; P.toe=' + f(L.toe) + '; P.sho=' + f(L.shoulder) + ';\n';
      s += '    P.lift=vec3(' + L.lift.map(f).join(',') + '); P.gam=vec3(' + L.gamma.map(f).join(',') +
        '); P.gain=vec3(' + L.gain.map(f).join(',') + ');\n';
      s += '    P.mtx=' + glslMat3(L.mtx) + ';\n';
      s += '    P.satG=' + f(L.satGlobal) + '; P.satS=' + f(L.satShadow) + '; P.satM=' + f(L.satMid) + '; P.satH=' + f(L.satHigh) + ';\n';
      s += '    P.skinC=' + f(L.skinCenter) + '; P.skinW=' + f(L.skinWidth) + '; P.skinP=' + f(L.skinProtect) + ';\n';
      s += '    P.sShH=' + f(L.splitShH) + '; P.sShS=' + f(L.splitShS) + '; P.sHiH=' + f(L.splitHiH) + '; P.sHiS=' + f(L.splitHiS) + ';\n';
      s += '    P.hlR=' + f(L.hlRoll) + '; P.hlK=' + f(L.hlKnee) + '; P.fade=' + f(L.fade) + ';\n';
      s += '    P.nb=' + L.bands.length + ';\n';
      L.bands.forEach(function (b, j) {
        s += '    P.bA[' + j + ']=vec4(' + [b.c, b.w, b.dh, b.ds].map(f).join(',') + '); P.bL[' + j + ']=' + f(b.dl) + ';\n';
      });
      s += '  }\n';
    });
    s += '}\n';
    return s;
  }

  /* ================= GLSL comum ================= */

  var PRE = [
    '#define CEPS 1e-6',
    '#define NB 8',
    'struct LookP {',
    '  float expo, temp, tint;',
    '  float con, piv, toe, sho;',
    '  vec3 lift, gam, gain;',
    '  mat3 mtx;',
    '  float satG, satS, satM, satH;',
    '  int nb;',
    '  vec4 bA[NB];',        /* centro, largura, deslocamento de matiz, croma */
    '  float bL[NB];',       /* luminância */
    '  float skinC, skinW, skinP;',
    '  float sShH, sShS, sHiH, sHiS;',
    '  float hlR, hlK, fade;',
    '};',

    'LookP identityLookP(){',
    '  LookP P;',
    '  P.expo=0.0; P.temp=0.0; P.tint=0.0;',
    '  P.con=0.0; P.piv=0.5; P.toe=0.0; P.sho=0.0;',
    '  P.lift=vec3(0.0); P.gam=vec3(1.0); P.gain=vec3(1.0);',
    '  P.mtx=mat3(1.0);',
    '  P.satG=1.0; P.satS=1.0; P.satM=1.0; P.satH=1.0;',
    '  P.nb=0;',
    '  for(int i=0;i<NB;i++){ P.bA[i]=vec4(0.0,30.0,0.0,1.0); P.bL[i]=1.0; }',
    '  P.skinC=40.0; P.skinW=26.0; P.skinP=0.0;',
    '  P.sShH=0.0; P.sShS=0.0; P.sHiH=0.0; P.sHiS=0.0;',
    '  P.hlR=0.0; P.hlK=0.75; P.fade=0.0;',
    '  return P;',
    '}',

    /* §21 — a força interpola PARÂMETRO, não saída */
    'LookP mixLookP(LookP a, LookP b, float t){',
    '  LookP o = identityLookP();',
    '  o.expo=mix(a.expo,b.expo,t); o.temp=mix(a.temp,b.temp,t); o.tint=mix(a.tint,b.tint,t);',
    '  o.con=mix(a.con,b.con,t); o.piv=mix(a.piv,b.piv,t); o.toe=mix(a.toe,b.toe,t); o.sho=mix(a.sho,b.sho,t);',
    '  o.lift=mix(a.lift,b.lift,t); o.gam=mix(a.gam,b.gam,t); o.gain=mix(a.gain,b.gain,t);',
    '  o.mtx[0]=mix(a.mtx[0],b.mtx[0],t); o.mtx[1]=mix(a.mtx[1],b.mtx[1],t); o.mtx[2]=mix(a.mtx[2],b.mtx[2],t);',
    '  o.satG=mix(a.satG,b.satG,t); o.satS=mix(a.satS,b.satS,t);',
    '  o.satM=mix(a.satM,b.satM,t); o.satH=mix(a.satH,b.satH,t);',
    '  o.skinC=mix(a.skinC,b.skinC,t); o.skinW=mix(a.skinW,b.skinW,t); o.skinP=mix(a.skinP,b.skinP,t);',
    '  o.sShH=mix(a.sShH,b.sShH,t); o.sShS=mix(a.sShS,b.sShS,t);',
    '  o.sHiH=mix(a.sHiH,b.sHiH,t); o.sHiS=mix(a.sHiS,b.sHiS,t);',
    '  o.hlR=mix(a.hlR,b.hlR,t); o.hlK=mix(a.hlK,b.hlK,t); o.fade=mix(a.fade,b.fade,t);',
    '  o.nb=b.nb;',
    '  for(int i=0;i<NB;i++){',
    '    o.bA[i]=vec4(b.bA[i].x, b.bA[i].y, b.bA[i].z*t, mix(1.0, b.bA[i].w, t));',
    '    o.bL[i]=mix(1.0, b.bL[i], t);',
    '  }',
    '  return o;',
    '}',

    /* ---- funções de transferência (decode → luz linear) ---- */
    'float pqDecode(float v){',
    '  float m1=0.1593017578125, m2=78.84375, c1=0.8359375, c2=18.8515625, c3=18.6875;',
    '  float p = pow(max(v,0.0), 1.0/m2);',
    '  return pow(max(p-c1,0.0)/(c2 - c3*p), 1.0/m1);',
    '}',
    'float hlgDecode(float v){',
    '  float a=0.17883277, b=1.0-4.0*0.17883277, c=0.5-0.17883277*log(4.0*0.17883277);',
    '  return v <= 0.5 ? (v*v)/3.0 : (exp((v-c)/a)+b)/12.0;',
    '}',
    'float slog3Decode(float v){',
    '  return v >= 171.2102946929/1023.0',
    '    ? pow(10.0, (v*1023.0 - 420.0)/261.5)*(0.18+0.01) - 0.01',
    '    : (v*1023.0 - 95.0)*0.01125/(171.2102946929 - 95.0);',
    '}',
    'float logc3Decode(float v){',
    '  float a=5.555556, b=0.052272, c=0.247190, d=0.385537, e=5.367655, ff=0.092809, cut=0.010591;',
    '  return v > e*cut + ff ? (pow(10.0,(v-d)/c) - b)/a : (v-ff)/e;',
    '}',
    'float clog3Decode(float v){',
    '  if(v < 0.097465473) return -(pow(10.0,(0.07623209 - v)/0.36726845) - 1.0)/14.98325;',
    '  if(v <= 0.15277891) return (v - 0.12783901)/1.9754798;',
    '  return (pow(10.0,(v - 0.12240537)/0.36726845) - 1.0)/14.98325;',
    '}',
    'float bmdDecode(float v){',
    '  float A=0.08692876065491224, B=0.005494072432257808, Cc=0.5300133392291939;',
    '  float D=8.283605932402494, E=0.09246575342465753, cut=0.005;',
    '  return v < D*cut + E ? (v-E)/D : exp((v-Cc)/A) - B;',
    '}',
    'float appleDecode(float v){',
    '  float R0=-0.05641088, Rt=0.01, cc=47.28711236, be=0.00964052, ga=0.08550478, de=0.69336945;',
    '  float pt = cc*(Rt-R0)*(Rt-R0);',
    '  if(v < 0.0) return R0;',
    '  if(v < pt) return sqrt(v/cc) + R0;',
    '  return pow(10.0,(v-de)/ga) - be;',
    '}',
    'float decodeTF(int t, float x){',
    '  if(t==0) return x <= 0.04045 ? x/12.92 : pow((x+0.055)/1.055, 2.4);',
    '  if(t==1) return pow(max(x,0.0), 2.4);',
    '  if(t==2) return x < 0.081 ? x/4.5 : pow((x+0.099)/1.099, 1.0/0.45);',
    '  if(t==3) return pqDecode(x);',
    '  if(t==4) return hlgDecode(x);',
    '  if(t==5) return slog3Decode(x);',
    '  if(t==6) return logc3Decode(x);',
    '  if(t==7) return clog3Decode(x);',
    '  if(t==8) return bmdDecode(x);',
    '  return appleDecode(x);',
    '}',
    'float srgbEncode(float x){',
    '  return x <= 0.0031308 ? x*12.92 : 1.055*pow(max(x,0.0), 1.0/2.4) - 0.055;',
    '}',

    /* ---- domínio log de trabalho ---- */
    'float logEnc(float x){ return (log2(max(x,CEPS)/0.18) + 6.5)/13.0; }',
    'float logDec(float y){ return 0.18*exp2(y*13.0 - 6.5); }',
    /* branco de exibição no domínio log — NÃO é 1.0 */
    '#define LOG_WHITE 0.690302',

    /* ---- OKLab / OKLCH ---- */
    'float cbrtf(float x){ return sign(x)*pow(abs(x), 1.0/3.0); }',
    'vec3 linToOklab(vec3 c){',
    '  float l = 0.4122214708*c.r + 0.5363325363*c.g + 0.0514459929*c.b;',
    '  float m = 0.2119034982*c.r + 0.6806995451*c.g + 0.1073969566*c.b;',
    '  float s = 0.0883024619*c.r + 0.2817188376*c.g + 0.6299787005*c.b;',
    '  float l_=cbrtf(l), m_=cbrtf(m), s_=cbrtf(s);',
    '  return vec3(',
    '    0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,',
    '    1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,',
    '    0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_);',
    '}',
    'vec3 oklabToLin(vec3 L){',
    '  float l_ = L.x + 0.3963377774*L.y + 0.2158037573*L.z;',
    '  float m_ = L.x - 0.1055613458*L.y - 0.0638541728*L.z;',
    '  float s_ = L.x - 0.0894841775*L.y - 1.2914855480*L.z;',
    '  float l=l_*l_*l_, m=m_*m_*m_, s=s_*s_*s_;',
    '  return vec3(',
    '    +4.0767416621*l - 3.3077115913*m + 0.2309699292*s,',
    '    -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,',
    '    -0.0041960863*l - 0.7034186147*m + 1.7076147010*s);',
    '}',
    'vec3 oklabToLch(vec3 L){',
    '  float h = degrees(atan(L.z, L.y));',
    '  if(h < 0.0) h += 360.0;',
    '  return vec3(L.x, length(L.yz), h);',
    '}',
    'vec3 lchToOklab(vec3 p){',
    '  float r = radians(p.z);',
    '  return vec3(p.x, p.y*cos(r), p.y*sin(r));',
    '}',

    /* ---- peso gaussiano de banda de matiz (nunca limiar duro) ---- */
    'float hueW(float hue, float center, float width){',
    '  float d = abs(hue - center);',
    '  if(d > 180.0) d = 360.0 - d;',
    '  float k = d/max(width, 1e-3);',
    '  return exp(-k*k*2.0);',
    '}',

    'float sstep(float a, float b, float x){',
    '  float t = clamp((x-a)/max(b-a, CEPS), 0.0, 1.0);',
    '  return t*t*(3.0-2.0*t);',
    '}',

    /* ---- curva fílmica no domínio log ---- */
    'float filmCurve(float x, float con, float piv, float toe, float sho){',
    '  float d = x - piv;',
    '  float y = piv + d*(1.0 + con);',
    '  if(toe > CEPS){',
    '    float t = clamp((piv - y)/max(piv, CEPS), 0.0, 1.0);',
    '    y -= toe*t*t*piv*0.5;',
    '  }',
    '  if(sho > CEPS){',
    '    float knee = piv + (LOG_WHITE - piv)*(1.0 - clamp(sho, 0.0, 1.0)*0.9);',
    '    if(y > knee){',
    '      float span = max(LOG_WHITE - knee, CEPS);',
    '      y = knee + span*(1.0 - exp(-(y - knee)/span));',
    '    }',
    '  }',
    '  return y;',
    '}',
    'float lggf(float x, float lift, float gm, float gn){',
    '  float y = x*gn + lift;',
    '  if(abs(gm - 1.0) > 1e-4) y = sign(y)*pow(abs(y) + CEPS, 1.0/max(gm, 0.05));',
    '  return y;',
    '}',
    'float hlRoll(float x, float amount, float knee){',
    '  if(amount <= CEPS || x <= knee) return x;',
    '  float e = x - knee;',
    '  return knee + e/(1.0 + e*amount);',
    '}',
    'float reinhard(float x, float w){ return x*(1.0 + x/(w*w))/(1.0 + x); }',
    /* compressão de gamute — ver js/color/engine.js */
    'vec3 gamutCompress(vec3 c){',
    '  float lum = clamp(dot(c, vec3(0.2126,0.7152,0.0722)), 0.0, 1.0);',
    '  float mx = max(c.r, max(c.g, c.b));',
    '  float mn = min(c.r, min(c.g, c.b));',
    '  float t = 1.0;',
    '  if(mx > 1.0) t = min(t, (1.0 - lum)/max(mx - lum, CEPS));',
    '  if(mn < 0.0) t = min(t, lum/max(lum - mn, CEPS));',
    '  t = clamp(t, 0.0, 1.0);',
    '  return vec3(lum) + (c - vec3(lum))*t;',
    '}'
  ].join('\n');

  /* ================= o núcleo da cadeia ================= */

  var CORE = [
    'vec3 applyLookP(vec3 c, LookP P){',
    '  vec3 lchIn = oklabToLch(linToOklab(c));',
    /* 1 · exposição — linear */
    '  c *= exp2(P.expo);',
    /* 2 · temperatura e matiz — ganho por canal */
    '  c.r *= 1.0 + P.temp*0.28;',
    '  c.b *= 1.0 - P.temp*0.28;',
    '  c.g *= 1.0 + P.tint*0.20;',
    '  c.r *= 1.0 - P.tint*0.07;',
    '  c.b *= 1.0 - P.tint*0.07;',
    /* 3 · matriz criativa — linear, perto da identidade */
    '  c = P.mtx * c;',
    /* 4 · curvas — domínio log */
    '  vec3 lg = vec3(logEnc(max(c.r,0.0)), logEnc(max(c.g,0.0)), logEnc(max(c.b,0.0)));',
    '  lg.r = lggf(filmCurve(lg.r, P.con, P.piv, P.toe, P.sho), P.lift.r, P.gam.r, P.gain.r);',
    '  lg.g = lggf(filmCurve(lg.g, P.con, P.piv, P.toe, P.sho), P.lift.g, P.gam.g, P.gain.g);',
    '  lg.b = lggf(filmCurve(lg.b, P.con, P.piv, P.toe, P.sho), P.lift.b, P.gam.b, P.gain.b);',
    '  c = vec3(logDec(lg.r), logDec(lg.g), logDec(lg.b));',
    /* 5 · matiz e saturação seletivos — OKLCH */
    '  vec3 lch = oklabToLch(linToOklab(c));',
    '  float Lum = clamp(lch.x, 0.0, 1.2);',
    '  float skin = P.skinP > 1e-4 ? hueW(lchIn.z, P.skinC, P.skinW)*P.skinP : 0.0;',
    '  float dh = 0.0, ds = 1.0, dl = 1.0;',
    '  for(int i=0;i<NB;i++){',
    '    if(i >= P.nb) break;',
    '    float w = hueW(lch.z, P.bA[i].x, P.bA[i].y);',
    /* a pele não é arrastada junto com verde/azul */
    '    float isSkin = step(0.6, hueW(P.bA[i].x, P.skinC, P.skinW));',
    '    w *= mix(1.0 - skin, 1.0, isSkin);',
    '    dh += P.bA[i].z*w;',
    '    ds *= mix(1.0, P.bA[i].w, w);',
    '    dl *= mix(1.0, P.bL[i], w);',
    '  }',
    '  float wSh = 1.0 - sstep(0.0, 0.45, Lum);',
    '  float wHi = sstep(0.55, 1.0, Lum);',
    '  float wMid = max(1.0 - wSh - wHi, 0.0);',
    '  float satL = P.satS*wSh + P.satM*wMid + P.satH*wHi;',
    '  lch.z = mod(lch.z + dh + 360.0, 360.0);',
    '  lch.y *= ds*P.satG*satL;',
    '  lch.x *= dl;',
    /* âncora de pele — ver js/color/engine.js */
    '  if(skin > 1e-4){',
    '    float kH = skin*0.92, kC = skin*0.80;',
    '    float dAng = mod(lchIn.z - lch.z + 540.0, 360.0) - 180.0;',
    '    lch.z = mod(lch.z + dAng*kH + 360.0, 360.0);',
    '    float ratio = lchIn.x > 1e-4 ? clamp(lch.x/lchIn.x, 0.4, 2.5) : 1.0;',
    '    lch.y = mix(lch.y, lchIn.y*ratio, kC);',
    '  }',
    '  c = oklabToLin(lchToOklab(lch));',
    /* 6 · compressão de altas luzes — nunca clampa */
    '  c = vec3(hlRoll(c.r, P.hlR, P.hlK), hlRoll(c.g, P.hlR, P.hlK), hlRoll(c.b, P.hlR, P.hlK));',
    /* 7 · tonalização dividida */
    '  if(P.sShS > 1e-4 || P.sHiS > 1e-4){',
    '    float lum = dot(c, vec3(0.2126,0.7152,0.0722));',
    '    float t = sstep(0.0, 1.0, pow(clamp(lum,0.0,1.0), 1.0/2.2));',
    '    vec3 sh = oklabToLin(lchToOklab(vec3(0.5, P.sShS*0.25, P.sShH)));',
    '    vec3 hi = oklabToLin(lchToOklab(vec3(0.5, P.sHiS*0.25, P.sHiH)));',
    '    float nS = dot(sh, vec3(0.2126,0.7152,0.0722)) + CEPS;',
    '    float nH = dot(hi, vec3(0.2126,0.7152,0.0722)) + CEPS;',
    '    c *= mix(vec3(1.0), sh/nS, (1.0-t)*P.sShS);',
    '    c *= mix(vec3(1.0), hi/nH, t*P.sHiS);',
    '  }',
    /* 8 · fade */
    '  if(P.fade > 1e-4) c = c*(1.0 - P.fade) + P.fade*0.055;',
    '  return gamutCompress(c);',
    '}'
  ].join('\n');

  /* ================= o efeito ================= */

  var lookOpts = C.LOOKS.map(function (l) { return C.lookLabel(l); });
  var profOpts = C.PROFILES.map(function (p) { return p.name; });

  VE.def({
    id: 'labgrade', name: 'Look de cor (engine)', cat: 'look', color: '#8ab4ff',
    desc: 'cadeia completa: perfil de entrada → luz linear → look → saída',
    params: [
      { k: 'look', t: 's', label: 'Look', def: 0, opts: lookOpts },
      { k: 'strength', label: 'Força do look', min: 0, max: 1, def: 1 },
      { k: 'prof', t: 's', label: 'Perfil de entrada', def: 0, opts: profOpts },
      { k: 'expo', label: 'Exposição', min: -2, max: 2, def: 0 },
      { k: 'con', label: 'Contraste', min: -0.6, max: 0.6, def: 0 },
      { k: 'col', label: 'Cor', min: -1, max: 1, def: 0 },
      { k: 'tone', label: 'Tom', min: -1, max: 1, def: 0 },
      { k: 'fade', label: 'Fade', min: 0, max: 0.4, def: 0 }
    ],
    glsl: PRE + '\n' + profileTables() + '\n' + lookTables() + '\n' + CORE + '\n' + [
      'vec3 fx(vec2 uv){',
      '  vec3 raw = srccol(uv);',
      /* ---- perfil de entrada: o que estes números significam ---- */
      '  mat3 M; float rng; int tfi; float isHdr;',
      '  profParams(int(u_prof + 0.5), M, rng, tfi, isHdr);',
      '  vec3 v = mix(raw, (raw*255.0 - 16.0)/219.0, rng);',
      '  v = vec3(decodeTF(tfi, v.r), decodeTF(tfi, v.g), decodeTF(tfi, v.b));',
      '  vec3 lin = M * v;',
      /* HDR precisa de tone map ANTES do look — nunca clamp direto */
      '  if(isHdr > 0.5) lin = vec3(reinhard(lin.r,4.0), reinhard(lin.g,4.0), reinhard(lin.b,4.0));',
      /* ---- look, com a força interpolando parâmetros ---- */
      '  LookP full; lookParams(int(u_look + 0.5), full);',
      '  LookP P = mixLookP(identityLookP(), full, clamp(u_strength, 0.0, 1.0));',
      /* ---- os quatro ajustes do painel, somados depois da força ---- */
      '  P.expo += u_expo;',
      '  P.con  += u_con;',
      '  float k = 1.0 + u_col;',
      '  P.satG *= k; P.satS *= k; P.satM *= k; P.satH *= k;',
      '  P.fade += max(0.0, -u_tone)*0.10 + u_fade;',
      '  P.sho  += max(0.0, -u_tone)*0.5;',
      '  P.toe  += max(0.0,  u_tone)*0.6;',
      '  P.con  += max(0.0,  u_tone)*0.12;',
      '  vec3 outc = applyLookP(lin, P);',
      /* ---- transform de saída ---- */
      '  return vec3(srgbEncode(outc.r), srgbEncode(outc.g), srgbEncode(outc.b));',
      '}'
    ].join('\n')
  });

  /* a categoria nova aparece nos chips do catálogo */
  if (VE.CATS && !VE.CATS.some(function (c) { return c.id === 'look'; })) {
    VE.CATS.push({ id: 'look', label: 'look', color: '#8ab4ff' });
  }

})(window.VE);
