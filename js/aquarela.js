/* ============================================================
   rgb_lab — A AQUARELA · o motor
   ------------------------------------------------------------
   Um simulador de aquarela por FÍSICA, não por filtro: o modelo
   de Curtis, Anderson, Seims, Fleischer e Salesin ("Computer-
   Generated Watercolor", SIGGRAPH 1997), inteiro na GPU.

   Cada célula do papel guarda:
     água       u, v (velocidade), p (cópia da altura, para leitura),
                M (molhado, com o contador de secagem dentro)
     capilar    s (saturação do papel), sal, álcool, w (a ÁGUA da
                célula: anda com o fluxo, evapora, é absorvida, some
                pela beira)
     pigmento   g₀…g₇ (na água) e d₀…d₇ (depositado no papel)
     papel      h (relevo), c (capacidade), fibra

   A cada passo (js: A.passo):
     1. mover a água — velocidades (viscosidade, o gradiente da ALTURA
        da água, o declive do papel, o puxão do sal, arrasto). Aqui a
        água é RASA e finita, não o fluido incompressível do artigo: a
        relaxação de divergência de Curtis fecha a mancha e impede o
        escoamento para a beira num modelo em que a água acaba. Com a
        altura no lugar da pressão, a beira que seca primeiro puxa a
        água do miolo — e o pigmento vai atrás (o escurecimento de
        borda, a assinatura da aquarela)
     2. mover o pigmento — transporte em fluxo, conservativo
     3. transferir — depositar/levantar, com DENSIDADE, MANCHA e
        GRANULAÇÃO por pigmento, contra o relevo do papel
     4. capilar — o papel absorve, a água caminha de célula em
        célula, e onde a saturação passa do limiar a área molhada
        CRESCE (os "blooms", as floradas)

   A COR é Kubelka-Munk: cada pigmento tem K (absorção) e S
   (espalhamento) por canal, calculados de duas cores — a aguada
   sobre branco e a mesma camada sobre preto (o método do próprio
   artigo, seção 4.4). A pilha compõe camada sobre camada:
     R = R₁ + T₁² R₂ / (1 − R₁ R₂),   T = T₁ T₂ / (1 − R₁ R₂)
   e é por isso que amarelo com azul dá verde, e não cinza.

   Os 52 PIGMENTOS são pigmentos de verdade (o índice de cor está
   em cada um), com nome do laboratório em português.

   OS QUADROS: a folha pode ser UMA pintura ou uma SEQUÊNCIA — um
   quadro por instante da composição. Cada quadro terminado é
   guardado seco (só o depositado, 8 canais quantizados e
   comprimidos) e renderizado (PNG com alfa). A sequência vira uma
   FONTE do laboratório (`kind: 'quadros'`) que devolve o quadro
   certo para cada instante — e é assim que a pintura vira uma
   animação em cima da animação.

   Nada aqui toca o DOM: a tela é o js/aquarelaui.js.
   ============================================================ */
(function (VE) {
  'use strict';

  var A = VE.aquarela = {};

  /* ================================================== PIGMENTOS ========
     Cada um: nome do laboratório, índice de cor, grupo, a AGUADA sobre
     branco, a mesma camada sobre PRETO (é dela que sai a opacidade),
     densidade ρ (o quanto assenta), mancha ω (o quanto agarra no
     papel — quanto maior, menos levanta) e granulação γ.            */
  var P = function (id, nome, ci, grupo, branco, preto, dens, mancha, gran) {
    return { id: id, nome: nome, ci: ci, grupo: grupo, branco: branco, preto: preto, dens: dens, mancha: mancha, gran: gran };
  };
  A.GRUPOS = ['AMARELOS', 'LARANJAS E VERMELHOS', 'VIOLETAS', 'AZUIS', 'VERDES', 'TERRAS E PRETOS'];
  A.PIGMENTOS = [
    /* amarelos */
    P('hansa', 'Amarelo Hansa', 'PY3', 0, '#f4f279', '#3a3a08', 0.30, 2.2, 0.05),
    P('cadmio-claro', 'Amarelo de Cádmio Claro', 'PY35', 0, '#fff08a', '#7a6a12', 0.60, 1.2, 0.20),
    P('azo-niquel', 'Amarelo Azo de Níquel', 'PY150', 0, '#f1e39a', '#3e2f06', 0.30, 3.0, 0.05),
    P('ouro-verde', 'Verde Dourado', 'PY129', 0, '#dbe07a', '#25300a', 0.30, 3.0, 0.10),
    P('ouro-quinacridona', 'Ouro de Quinacridona', 'PO49', 0, '#f6dfa0', '#4a2c08', 0.35, 2.8, 0.10),
    P('ocre', 'Ocre Amarelo', 'PY43', 0, '#ead28f', '#5a4210', 0.70, 1.3, 0.55),
    P('siena-natural', 'Siena Natural', 'PBr7', 0, '#e8cd8a', '#4a3410', 0.70, 1.4, 0.50),
    P('napoles', 'Amarelo de Nápoles', 'PBr24', 0, '#fbeab8', '#a08a50', 0.80, 1.1, 0.20),
    /* laranjas e vermelhos */
    P('cadmio-laranja', 'Laranja de Cádmio', 'PO20', 1, '#ffc27f', '#7c3a0a', 0.65, 1.2, 0.20),
    P('pirrol-laranja', 'Laranja Pirrol', 'PO73', 1, '#ffb07c', '#4a1806', 0.30, 3.0, 0.05),
    P('quin-laranja', 'Laranja Queimado de Quinacridona', 'PO48', 1, '#eeb28c', '#3a1608', 0.40, 2.6, 0.15),
    P('cadmio-vermelho', 'Vermelho de Cádmio', 'PR108', 1, '#ff9d8c', '#6a1010', 0.65, 1.3, 0.15),
    P('pirrol-vermelho', 'Vermelho Pirrol', 'PR254', 1, '#ff8e84', '#3c0a0a', 0.30, 3.2, 0.05),
    P('perileno-marrom', 'Marrom Perileno', 'PR179', 1, '#e69c93', '#2a0c0c', 0.40, 3.0, 0.10),
    P('alizarina', 'Carmim Alizarina', 'PR206', 1, '#f19da6', '#2e0810', 0.30, 3.0, 0.05),
    P('quin-rosa', 'Rosa de Quinacridona', 'PV19', 1, '#f7abc3', '#30081a', 0.35, 3.0, 0.05),
    P('quin-magenta', 'Magenta de Quinacridona', 'PR122', 1, '#f39fca', '#2e0a22', 0.35, 3.0, 0.05),
    P('rosa-oleiro', 'Rosa de Oleiro', 'PR233', 1, '#f1cbc2', '#4a2a26', 0.85, 1.1, 0.85),
    P('indiano', 'Vermelho Indiano', 'PR101', 1, '#e2aa9c', '#4a1c14', 0.80, 1.4, 0.50),
    P('caput', 'Caput Mortuum', 'PR101', 1, '#d9acab', '#2a1014', 0.80, 1.4, 0.60),
    /* violetas */
    P('dioxazina', 'Violeta Dioxazina', 'PV23', 2, '#b9a4d5', '#12061e', 0.30, 3.5, 0.05),
    P('ultramar-violeta', 'Violeta Ultramar', 'PV15', 2, '#cbbfe3', '#241c3e', 0.80, 1.5, 0.75),
    P('manganes-violeta', 'Violeta de Manganês', 'PV16', 2, '#d7bad8', '#2c1a32', 0.80, 1.4, 0.70),
    P('perileno-violeta', 'Violeta Perileno', 'PV29', 2, '#c9a3a7', '#1c0e12', 0.40, 3.0, 0.10),
    /* azuis */
    P('ultramar', 'Azul Ultramar Francês', 'PB29', 3, '#aab9ef', '#0c1440', 0.80, 1.5, 0.75),
    P('cobalto', 'Azul Cobalto', 'PB28', 3, '#aac5ee', '#0e2450', 0.75, 1.4, 0.55),
    P('ceruleo', 'Azul Cerúleo', 'PB35', 3, '#b9dcef', '#1a3e58', 0.85, 1.2, 0.70),
    P('ftalo-azul', 'Azul Ftalo', 'PB15:3', 3, '#93d0ec', '#041a34', 0.25, 3.8, 0.00),
    P('prussia', 'Azul da Prússia', 'PB27', 3, '#a2c1d8', '#06121c', 0.30, 3.2, 0.10),
    P('indantreno', 'Azul Indantreno', 'PB60', 3, '#aab5d1', '#0c1024', 0.40, 2.4, 0.20),
    P('indigo', 'Índigo', 'PB66', 3, '#aab1c1', '#0a0e16', 0.45, 2.2, 0.25),
    P('cobalto-turquesa', 'Turquesa de Cobalto', 'PB36', 3, '#b0e3e3', '#0c343a', 0.85, 1.3, 0.60),
    P('manganes-azul', 'Azul de Manganês', 'PB33', 3, '#b7e5f1', '#12404e', 0.85, 1.2, 0.65),
    P('ftalo-turquesa', 'Turquesa Ftalo', 'PB16', 3, '#a8e1de', '#062a2a', 0.30, 3.5, 0.05),
    /* verdes */
    P('ftalo-verde', 'Verde Ftalo', 'PG7', 4, '#a0ddc1', '#03221a', 0.25, 3.8, 0.00),
    P('viridiano', 'Viridiano', 'PG18', 4, '#bae3d3', '#10342a', 0.60, 1.6, 0.45),
    P('cobalto-verde', 'Verde Cobalto', 'PG50', 4, '#b8decb', '#143828', 0.80, 1.3, 0.60),
    P('seiva', 'Verde Seiva', 'PG7+PY150', 4, '#c7da8c', '#1c2a0a', 0.35, 2.6, 0.10),
    P('hooker', 'Verde Hooker', 'PG36+PY110', 4, '#b7d59b', '#122210', 0.40, 2.4, 0.15),
    P('terra-verde', 'Terra Verde', 'PG23', 4, '#d6dcc3', '#343e2a', 0.70, 1.2, 0.50),
    P('perileno-verde', 'Verde Perileno', 'PBk31', 4, '#b6c3b1', '#0a100c', 0.40, 3.0, 0.15),
    /* terras e pretos */
    P('siena-queimada', 'Siena Queimada', 'PBr7', 5, '#ecc1a1', '#3a160a', 0.70, 1.6, 0.45),
    P('sombra-queimada', 'Sombra Queimada', 'PBr7', 5, '#d9c2ac', '#1e120a', 0.70, 1.6, 0.50),
    P('sombra-natural', 'Sombra Natural', 'PBr7', 5, '#d6ceb8', '#22200f', 0.70, 1.5, 0.50),
    P('vandyck', 'Marrom Van Dyck', 'NBr8', 5, '#dac6b2', '#180e08', 0.50, 2.0, 0.30),
    P('payne', 'Cinza de Payne', 'PB29+PBk', 5, '#b9c1cd', '#0e121a', 0.50, 2.2, 0.30),
    P('neutra', 'Tinta Neutra', 'PBk+PV', 5, '#c1bfc5', '#0e0d12', 0.50, 2.2, 0.20),
    P('fumo', 'Negro de Fumo', 'PBk7', 5, '#bdbdbd', '#060606', 0.35, 3.0, 0.10),
    P('lunar', 'Preto Lunar', 'PBk11', 5, '#c6c3be', '#141311', 0.90, 1.3, 0.95),
    P('hematita', 'Hematita', 'PR101 gen.', 5, '#d7b9a9', '#2a1410', 0.90, 1.3, 0.90),
    P('sodalita', 'Sodalita', 'genuína', 5, '#bdbdd1', '#12121e', 0.90, 1.3, 0.90),
    P('titanio', 'Branco de Titânio', 'PW6', 5, '#fdfdfd', '#c8c8c8', 0.70, 1.0, 0.10)
  ];
  A.PIGBY = {};
  A.PIGMENTOS.forEach(function (p) { A.PIGBY[p.id] = p; });

  /* a paleta de fábrica: oito godês — as duplas de primárias e as terras */
  A.PALETA_PADRAO = ['hansa', 'ocre', 'pirrol-vermelho', 'quin-rosa', 'ultramar', 'ftalo-azul', 'seiva', 'siena-queimada'];

  /* ------------------------------------------------ cor: sRGB ↔ linear */
  function hex2lin(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) {
      v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
  }
  function lin2hex(c) {
    return '#' + c.map(function (v) {
      v = Math.max(0, Math.min(1, v));
      v = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
      var s = Math.round(v * 255).toString(16); return s.length < 2 ? '0' + s : s;
    }).join('');
  }
  A.hex2lin = hex2lin; A.lin2hex = lin2hex;

  /* ---------------------------------------------- Kubelka-Munk (JS) ----
     De (R_w, R_b) — a camada sobre branco e sobre preto — saem a, b, S e
     K por canal (Curtis, 4.4). O caso inválido (a camada sobre preto
     clara demais para a mesma camada sobre branco) é corrigido
     escurecendo o preto até a conta fechar; o teste de nó avisa quais. */
  function ksCanal(Rw, Rb) {
    Rw = Math.min(0.995, Math.max(0.02, Rw));
    Rb = Math.min(Rw - 0.01, Math.max(0.0015, Rb));
    var a, b, z, corrigido = 0;
    for (var tent = 0; tent < 40; tent++) {
      a = 0.5 * (Rw + (Rb - Rw + 1) / Rb);
      b = Math.sqrt(Math.max(a * a - 1, 1e-9));
      z = (1 / Rb - a) / b;
      if (z > 1.0005) break;
      Rb *= 0.9; corrigido++;
    }
    var S = 0.5 * Math.log((z + 1) / (z - 1)) / b;     /* arccoth(z)/b */
    var K = S * (a - 1);
    return { a: a, b: b, S: S, K: K, corrigido: corrigido, Rb: Rb };
  }
  A.ks = function (pig) {
    if (pig.__ks) return pig.__ks;
    var w = hex2lin(pig.branco), k = hex2lin(pig.preto), out = { a: [], b: [], S: [], K: [], corrigido: 0 };
    for (var c = 0; c < 3; c++) {
      var r = ksCanal(w[c], k[c]);
      out.a.push(r.a); out.b.push(r.b); out.S.push(r.S); out.K.push(r.K); out.corrigido += r.corrigido;
    }
    pig.__ks = out;
    return out;
  };
  /* uma camada de espessura x: reflectância e transmitância por canal */
  A.kmCamada = function (ks, x) {
    var R = [], T = [];
    for (var c = 0; c < 3; c++) {
      var y = Math.min(30, ks.b[c] * ks.S[c] * x), e = Math.exp(-2 * y);
      var den = ks.a[c] * (1 - e) + ks.b[c] * (1 + e);
      R.push((1 - e) / den); T.push(2 * ks.b[c] * Math.exp(-y) / den);
    }
    return { R: R, T: T };
  };
  /* a pilha: camadas [{ks, x}] de baixo para cima, sobre um fundo (linear) */
  A.kmCompor = function (camadas, fundo) {
    var Rt = fundo.slice();
    camadas.forEach(function (cam) {
      var l = A.kmCamada(cam.ks, cam.x);
      for (var c = 0; c < 3; c++) Rt[c] = l.R[c] + l.T[c] * l.T[c] * Rt[c] / (1 - l.R[c] * Rt[c]);
    });
    return Rt;
  };
  /* a cor de uma aguada de espessura x sobre papel branco, em hex (para
     godês, gavetas e miniaturas)                                        */
  A.corDaAguada = function (id, x) {
    var p = A.PIGBY[id]; if (!p) return '#000';
    return lin2hex(A.kmCompor([{ ks: A.ks(p), x: x == null ? 1 : x }], [0.92, 0.91, 0.88]));
  };

  /* ====================================================== O PAPEL ======
     Relevo calculado (ruído de valor em oitavas): três grãos. `h` em
     0..1 é o relevo; a CAPACIDADE `c` segue o relevo (Curtis: c = h·(cmax
     − cmin) + cmin); a fibra é um segundo ruído fino, para as formas do
     sal e o grão seco não saírem redondos.                             */
  A.PAPEIS = {
    liso: { nome: 'PRENSADO A QUENTE', esc: 2.6, amp: 0.35, oit: 3 },
    frio: { nome: 'PRENSADO A FRIO', esc: 5.5, amp: 0.75, oit: 4 },
    rugoso: { nome: 'RUGOSO', esc: 9.5, amp: 1.0, oit: 4 }
  };
  function hash2(x, y, s) {
    var n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function ruidoValor(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  A.gerarPapel = function (w, h, tipo, semente) {
    var pp = A.PAPEIS[tipo] || A.PAPEIS.frio, s = (semente || 7) * 1.37;
    var out = new Float32Array(w * h * 4), i = 0;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var v = 0, amp = 1, esc = pp.esc, tot = 0;
      for (var o = 0; o < pp.oit; o++) { v += ruidoValor(x / esc, y / esc, s + o) * amp; tot += amp; amp *= 0.5; esc *= 0.5; }
      v /= tot;
      /* o relevo: centrado em 0,5, amplitude do papel */
      var rel = 0.5 + (v - 0.5) * pp.amp * 1.9;
      rel = Math.max(0, Math.min(1, rel));
      var fibra = ruidoValor(x / 1.7, y / 1.7, s + 11) * 0.7 + ruidoValor(x / 0.9, y / 0.9, s + 13) * 0.3;
      out[i++] = rel;                          /* h */
      out[i++] = 0.7 + rel * 0.3;              /* c: capacidade (pouco relevo: senão todo pigmento granula) */
      out[i++] = fibra;                        /* fibra */
      out[i++] = 1;
    }
    return out;
  };

  /* ===================================================== O MOTOR (GPU) =
     Um contexto WebGL2 próprio, no canvas da folha. Texturas RGBA32F em
     par (ping-pong); todos os passos são um quad de tela inteira.      */
  var VS = [
    '#version 300 es',
    'in vec2 aPos; out vec2 vUv;',
    'void main(){ vUv = aPos*0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var PRE = [
    '#version 300 es',
    'precision highp float; precision highp int; precision highp sampler2D;',
    'in vec2 vUv;',
    'uniform ivec2 uTam;',
    'ivec2 IJ(){ return ivec2(gl_FragCoord.xy); }',
    'ivec2 CL(ivec2 q){ return clamp(q, ivec2(0), uTam - 1); }',
    'float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }'
  ].join('\n');

  /* 1. as velocidades ------------------------------------------------ */
  var FS_VEL = [
    PRE,
    'uniform sampler2D uAgua, uPapel, uSat, uMasc;',
    'uniform float uMu, uKappa, uDeclive, uSalPuxa, uPressao;',
    'out vec4 o;',
    'void main(){',
    '  ivec2 ij = IJ();',
    '  vec4 c = texelFetch(uAgua, ij, 0);',
    '  float M = c.a;',
    '  if(M < 0.5){ o = vec4(0.0, 0.0, 0.0, 0.0); return; }',
    '  vec4 L = texelFetch(uAgua, CL(ij + ivec2(-1,0)), 0), R = texelFetch(uAgua, CL(ij + ivec2(1,0)), 0);',
    '  vec4 D = texelFetch(uAgua, CL(ij + ivec2(0,-1)), 0), U = texelFetch(uAgua, CL(ij + ivec2(0,1)), 0);',
    '  float u = c.r, v = c.g;',
    /* viscosidade: difusão */
    '  u += uMu*(L.r + R.r + D.r + U.r - 4.0*c.r);',
    '  v += uMu*(L.g + R.g + D.g + U.g - 4.0*c.g);',
    /* a altura da água empurra pela face (célula i para i+1): água rasa */
    '  float w0 = texelFetch(uSat, ij, 0).a, wR = texelFetch(uSat, CL(ij + ivec2(1,0)), 0).a, wU = texelFetch(uSat, CL(ij + ivec2(0,1)), 0).a;',
    '  u += (w0 - wR)*uPressao;',
    '  v += (w0 - wU)*uPressao;',
    /* o declive do papel empurra a água para os vales */
    '  vec4 pp = texelFetch(uPapel, ij, 0);',
    '  float hR = texelFetch(uPapel, CL(ij + ivec2(1,0)), 0).r, hU = texelFetch(uPapel, CL(ij + ivec2(0,1)), 0).r;',
    '  u += (pp.r - hR)*uDeclive;',
    '  v += (pp.r - hU)*uDeclive;',
    /* o SAL puxa a água para o cristal (sobe o gradiente do sal borrado) */
    '  float sR = texelFetch(uMasc, CL(ij + ivec2(1,0)), 0).g, sU = texelFetch(uMasc, CL(ij + ivec2(0,1)), 0).g, s0 = texelFetch(uMasc, ij, 0).g;',
    '  u += (sR - s0)*uSalPuxa;',
    '  v += (sU - s0)*uSalPuxa;',
    /* arrasto */
    '  u *= (1.0 - uKappa); v *= (1.0 - uKappa);',
    /* contorno: a face com uma célula seca não deixa passar água */
    '  if(R.a < 0.5) u = 0.0;',
    '  if(U.a < 0.5) v = 0.0;',
    /* CFL: no máximo 0,24 célula por passo, para o transporte conservar massa */
    '  u = clamp(u, -0.24, 0.24); v = clamp(v, -0.24, 0.24);',
    '  o = vec4(u, v, w0, M);',
    '}'
  ].join('\n');

  /* 2. (a relaxação de divergência do artigo saiu daqui — ver o cabeçalho) (Curtis, uma iteração por passada) ------ */
  /* 3. transporte do pigmento (fluxo pelas faces, conservativo) ------- */
  var FS_PIG = [
    PRE,
    'uniform sampler2D uPig, uAgua, uSat;',
    'uniform int uSoAgua;',   /* 1 = transportar só a ÁGUA (o canal a de uSat), os outros passam */
    'out vec4 o;',
    'float molhada(ivec2 q){ return smoothstep(0.0, 0.01, texelFetch(uSat, q, 0).a); }',
    'void main(){',
    '  ivec2 ij = IJ();',
    '  vec4 g = texelFetch(uPig, ij, 0);',
    '  vec4 a = texelFetch(uAgua, ij, 0);',
    '  if(a.a < 0.5){ o = g; return; }',
    '  float uR = a.r, vU = a.g;',
    '  ivec2 qL = CL(ij + ivec2(-1,0)), qR = CL(ij + ivec2(1,0)), qD = CL(ij + ivec2(0,-1)), qU = CL(ij + ivec2(0,1));',
    '  float uL = texelFetch(uAgua, qL, 0).r, vD = texelFetch(uAgua, qD, 0).g;',
    '  float sai = (max(uR, 0.0) + max(-uL, 0.0) + max(vU, 0.0) + max(-vD, 0.0))*molhada(ij);',
    '  vec4 entra = max(uL, 0.0)*molhada(qL)*texelFetch(uPig, qL, 0)',
    '             + max(-uR, 0.0)*molhada(qR)*texelFetch(uPig, qR, 0)',
    '             + max(vD, 0.0)*molhada(qD)*texelFetch(uPig, qD, 0)',
    '             + max(-vU, 0.0)*molhada(qU)*texelFetch(uPig, qU, 0);',
    '  vec4 novo = max(g*(1.0 - sai) + entra, vec4(0.0));',
    '  if(uSoAgua == 1){ o = vec4(g.rgb, novo.a); return; }',
    '  o = novo;',
    '}'
  ].join('\n');

  /* 4. transferir: depositar e levantar ------------------------------ */
  var FS_TRANS = [
    PRE,
    'uniform sampler2D uPig, uDep, uPapel, uAgua, uSat, uMasc;',
    'uniform vec4 uDens, uMancha, uGran;',
    'uniform float uTaxa;',
    'layout(location=0) out vec4 oPig;',
    'layout(location=1) out vec4 oDep;',
    'void main(){',
    '  ivec2 ij = IJ();',
    '  vec4 g = texelFetch(uPig, ij, 0), d = texelFetch(uDep, ij, 0);',
    '  vec4 a = texelFetch(uAgua, ij, 0), pp = texelFetch(uPapel, ij, 0), st = texelFetch(uSat, ij, 0);',
    '  if(a.a < 0.5){ oPig = vec4(0.0); oDep = (st.g > 0.5) ? d : d + g; return; }',   /* secou: tudo assenta — menos o que o cristal de sal levou */
    '  float h = pp.r;',
    /* com água por cima o pigmento fica em suspensão e VIAJA; é quando a
       água vai embora que ele assenta — é isso que leva pigmento à beira */
    '  float agua = clamp(st.a/0.15, 0.0, 1.0);',
    '  vec4 desce = g*(1.0 - h*uGran)*uDens*uTaxa*(0.12 + 0.88*(1.0 - agua));',
    '  vec4 sobe  = d*(1.0 + (h - 1.0)*uGran)*uDens/uMancha*uTaxa*agua;',
    /* o álcool repele: onde há álcool o pigmento não assenta */
    '  desce *= (1.0 - 0.85*clamp(st.b, 0.0, 1.0));',
    /* o sal: o cristal captura a água com o pigmento (fica claro); na
       orla, o pigmento que a água trouxe assenta mais (fica escuro)   */
    '  float sb = texelFetch(uMasc, ij, 0).g;',
    '  float orla = smoothstep(0.02, 0.12, sb)*(1.0 - smoothstep(0.12, 0.5, sb))*(1.0 - step(0.5, st.g));',
    '  desce *= (1.0 + 2.5*orla);',
    '  if(st.g > 0.5){ desce *= 0.1; sobe = min(sobe + d*0.03, d); g *= 0.85; }',   /* o cristal bebe a água e fica com o pigmento */
    '  desce = min(desce, g); sobe = min(sobe, d);',
    '  oPig = max(g - desce + sobe, vec4(0.0));',
    '  oDep = max(d + desce - sobe, vec4(0.0));',
    '}'
  ].join('\n');

  /* 5. capilar, evaporação, escoamento de borda, secagem, floradas --- */
  var FS_CAP = [
    PRE,
    'uniform sampler2D uSat, uAgua, uPapel, uMasc;',
    'uniform float uAlfa, uEps, uSigma, uEvap, uEta, uSecaP, uSalBebe, uSangra;',
    'layout(location=0) out vec4 oSat;',
    'layout(location=1) out vec4 oAgua;',
    'void main(){',
    '  ivec2 ij = IJ();',
    '  vec4 st = texelFetch(uSat, ij, 0), a = texelFetch(uAgua, ij, 0), pp = texelFetch(uPapel, ij, 0);',
    '  float s = st.r, c = pp.g, p = a.b, M = a.a, w = st.a;',
    /* absorção: da água rasa para dentro do papel */
    '  if(M > 0.5){ float ab = min(min(uAlfa, max(c - s, 0.0)), w); s += ab; w -= ab; }',
    /* difusão capilar entre vizinhas (forma de coleta, conservativa) */
    '  ivec2 viz[4]; viz[0] = ivec2(-1,0); viz[1] = ivec2(1,0); viz[2] = ivec2(0,-1); viz[3] = ivec2(0,1);',
    '  float s0 = st.r, ds = 0.0;',
    '  for(int k = 0; k < 4; k++){',
    '    ivec2 q = CL(ij + viz[k]);',
    '    float sn = texelFetch(uSat, q, 0).r, cn = texelFetch(uPapel, q, 0).g;',
    '    if(sn > uEps && sn > s0) ds += max(0.0, min(sn - s0, c - s0))*0.25;',
    '    if(s0 > uEps && s0 > sn) ds -= max(0.0, min(s0 - sn, cn - sn))*0.25;',
    '  }',
    '  s += ds;',
    /* o papel também seca, devagar */
    '  s = max(s - uEvap*0.4, 0.0);',        /* o papel fica úmido muito depois de a água de cima ir embora */
    /* evaporação da água; o álcool evapora depressa; o sal bebe; e a beira
       da mancha seca primeiro — na PRESSÃO isso não tem piso (Curtis): é o
       que mantém a água a escoar para fora e o pigmento a ir atrás     */
    '  if(M > 0.5){',
    '    float mb = texelFetch(uMasc, ij, 0).r;',
    '    float beira = uEta*(1.0 - mb);',
    '    w -= uEvap*(1.0 + 3.0*st.b) + beira;',
    '    if(st.g > 0.5) w -= uSalBebe;',
    '    w = max(w, 0.0);',
    '    p -= beira;',
    '  }',
    /* secagem: sem água por uns passos (e as vizinhas também sem), a célula
       deixa de estar molhada. O contador vive no próprio M: 1 é molhada,
       cai a cada passo seco, abaixo de 0,7 seca de vez                 */
    '  float wv = max(max(texelFetch(uSat, CL(ij + ivec2(-1,0)), 0).a, texelFetch(uSat, CL(ij + ivec2(1,0)), 0).a), max(texelFetch(uSat, CL(ij + ivec2(0,-1)), 0).a, texelFetch(uSat, CL(ij + ivec2(0,1)), 0).a));',
    '  if(M > 0.5){',
    '    if(w <= 0.0008 && wv <= 0.0008) M -= 0.3/uSecaP; else M = 1.0;',
    '    if(M < 0.7){ M = 0.0; p = 0.0; w = 0.0; }',
    '  } else {',
    /* o SANGRADO e a FLORADA: a célula seca ao lado de uma molhada com
       água bastante molha também — a água livre invade o papel vizinho. A
       água que isso exige (uSangra) cai quase a zero em papel ainda ÚMIDO
       (saturação alta): é por isso que uma gota sobre uma aguada que está
       secando corre longe e empurra o pigmento (a florada), e sobre papel
       seco o traço só sangra um ou dois pixels.                        */
    '    bool vizM = texelFetch(uAgua, CL(ij + ivec2(-1,0)), 0).a > 0.5 || texelFetch(uAgua, CL(ij + ivec2(1,0)), 0).a > 0.5 || texelFetch(uAgua, CL(ij + ivec2(0,-1)), 0).a > 0.5 || texelFetch(uAgua, CL(ij + ivec2(0,1)), 0).a > 0.5;',
    '    float limiar = uSangra*(1.0 - 0.85*clamp(s/uSigma, 0.0, 1.0));',
    /* e o papel CHEIO (saturação acima de σ, Curtis) devolve água à
       superfície ao lado de uma célula molhada — a florada corre por aí */
    '    if(vizM && (wv > limiar || s > uSigma)){ M = 1.0; w = max(0.02, (s - uSigma)*0.5); p = w; s = min(s, uSigma); }',
    '    else w = max(w - uEvap, 0.0);',
    '  }',
    '  float alc = st.b*0.985;',
    '  oSat = vec4(s, st.g, alc, w);',
    '  oAgua = vec4(a.r, a.g, p, M);',
    '}'
  ].join('\n');

  /* 6. borrão separável (M e sal) ------------------------------------ */
  var FS_BLUR = [
    PRE,
    'uniform sampler2D uSrc;',
    'uniform ivec2 uDir;',   /* direção E passo: (1,0), (0,1), (3,0), (0,3) */
    'uniform int uModo;',   /* 0 = ler M (agua.a) e sal (sat.g) de duas texturas; 1 = borrar a textura já montada */
    'uniform sampler2D uSat;',
    'out vec4 o;',
    'vec2 ler(ivec2 q){',
    '  if(uModo == 0) return vec2(texelFetch(uSrc, q, 0).a, step(0.5, texelFetch(uSat, q, 0).g));',
    '  return texelFetch(uSrc, q, 0).rg;',
    '}',
    'void main(){',
    '  ivec2 ij = IJ();',
    '  float w[7]; w[0] = 0.1994; w[1] = 0.1760; w[2] = 0.1210; w[3] = 0.0648; w[4] = 0.0270; w[5] = 0.0088; w[6] = 0.0022;',
    '  vec2 acc = ler(ij)*w[0];',
    '  for(int k = 1; k < 7; k++) acc += (ler(CL(ij + uDir*k)) + ler(CL(ij - uDir*k)))*w[k];',
    '  o = vec4(acc, 0.0, 1.0);',
    '}'
  ].join('\n');

  /* 7. as ferramentas: um lote de toques por passada ------------------ */
  var FS_TOOL = [
    PRE,
    'uniform sampler2D uAgua, uSat, uPig0, uPig1, uDep0, uDep1, uPapel;',
    'uniform vec4 uDab[48];',      /* x, y (px), raio, força */
    'uniform int uN, uFerr, uSlot;',
    'uniform float uAgua1, uCarga, uLev, uSalQ;',
    'uniform vec4 uMancha0, uMancha1;',
    'layout(location=0) out vec4 oAgua;',
    'layout(location=1) out vec4 oSat;',
    'layout(location=2) out vec4 oPig0;',
    'layout(location=3) out vec4 oPig1;',
    'layout(location=4) out vec4 oDep0;',
    'layout(location=5) out vec4 oDep1;',
    'void main(){',
    '  ivec2 ij = IJ();',
    '  vec2 p = gl_FragCoord.xy;',
    '  vec4 ag = texelFetch(uAgua, ij, 0), st = texelFetch(uSat, ij, 0);',
    '  vec4 g0 = texelFetch(uPig0, ij, 0), g1 = texelFetch(uPig1, ij, 0), d0 = texelFetch(uDep0, ij, 0), d1 = texelFetch(uDep1, ij, 0);',
    '  vec4 pp = texelFetch(uPapel, ij, 0);',
    '  float cob = 0.0, cobDura = 0.0, cobSoma = 0.0; vec2 dirImp = vec2(0.0); float anel = 0.0;',
    '  for(int k = 0; k < 48; k++){',
    '    if(k >= uN) break;',
    '    vec4 d = uDab[k];',
    '    float dist = distance(p, d.xy);',
    '    float r = max(d.z, 0.6);',
    '    float c = (1.0 - smoothstep(r*0.86, r, dist))*d.w;',
    /* cerdas: a borda do pincel não é um círculo perfeito */
    '    c *= 0.9 + 0.1*pp.b;',
    '    cob = max(cob, c); cobSoma += c;',
    '    cobDura = max(cobDura, step(dist, r)*d.w);',
    '    float an = smoothstep(r*0.35, r*0.9, dist)*(1.0 - smoothstep(r*0.9, r*1.25, dist));',
    '    if(an > anel){ anel = an; dirImp = normalize(p - d.xy + vec2(1e-3)); }',
    '  }',
    '  cobSoma = min(cobSoma, 1.6);',
    '  vec4 sel0 = vec4(equal(ivec4(uSlot), ivec4(0,1,2,3)));',
    '  vec4 sel1 = vec4(equal(ivec4(uSlot), ivec4(4,5,6,7)));',
    '  if(uFerr == 0 || uFerr == 1){',            /* pincel molhado / só água */
    /* água nova sobre área já molhada entra em parte: senão cada toque
       faz um morro de água que dispara o fluxo e leva o pigmento embora
       (medido: 92% do pigmento sumia do cruzamento de dois traços)   */
    '    if(cob > 0.02){ float add = uAgua1*cobSoma*(1.0 - 0.6*clamp(st.a/0.3, 0.0, 1.0)); ag.a = 1.0; ag.b += add; st.a += add; }',
    '    st.r = min(st.r + uAgua1*cobSoma*2.0, pp.g);',
    '    if(uFerr == 0){ g0 += sel0*uCarga*cobSoma; g1 += sel1*uCarga*cobSoma; }',
    '  } else if(uFerr == 2){',                    /* pincel seco: só nas cristas do papel */
    '    float crista = smoothstep(0.5, 0.78, pp.r);',
    '    d0 += sel0*uCarga*cob*crista*1.6; d1 += sel1*uCarga*cob*crista*1.6;',
    '  } else if(uFerr == 3){',                    /* esponja / pano: levanta */
    '    ag.b -= uLev*cob*1.5; st.a = max(st.a - uLev*cob*1.5, 0.0);',
    '    g0 *= (1.0 - 0.85*cob); g1 *= (1.0 - 0.85*cob);',
    '    d0 *= (1.0 - uLev*cob/uMancha0); d1 *= (1.0 - uLev*cob/uMancha1);',
    '  } else if(uFerr == 4){',                    /* sal: cristais */
    '    if(cobDura > 0.5 && pp.b*0.6 + hash21(p*0.37)*0.4 > 0.45) st.g = 1.0;',
    '  } else if(uFerr == 5){',                    /* álcool: gota que repele */
    '    if(cob > 0.02){ ag.a = 1.0; }',
    '    st.b = max(st.b, cob);',
    '    ag.rg += dirImp*anel*0.22;',
    '    ag.b += 0.12*cob; st.a += 0.12*cob;',
    '    g0 *= (1.0 - 0.7*cob); g1 *= (1.0 - 0.7*cob);',
    '  }',
    '  oAgua = ag; oSat = st; oPig0 = g0; oPig1 = g1; oDep0 = d0; oDep1 = d1;',
    '}'
  ].join('\n');

  /* 8. a cor: Kubelka-Munk, a pilha de até oito pigmentos ------------ */
  var GL_KM = [
    'uniform vec3 uKa[8], uKb[8], uKs[8];',
    'vec3 kmR(int k, float x, out vec3 T){',
    '  vec3 a = uKa[k], b = uKb[k];',
    '  vec3 y = clamp(b*uKs[k]*x, vec3(0.0), vec3(30.0));',
    '  vec3 e = exp(-2.0*y);',
    '  vec3 den = a*(1.0 - e) + b*(1.0 + e);',
    '  T = 2.0*b*exp(-y)/den;',
    '  return (1.0 - e)/den;',
    '}',
    /* compõe a pilha sobre o fundo `Rt`; devolve R total e escreve T total */
    'vec3 pilha(vec4 x0, vec4 x1, vec3 Rt, out vec3 Tt){',
    '  Tt = vec3(1.0);',
    '  for(int k = 0; k < 8; k++){',
    '    float x = (k < 4) ? x0[k] : x1[k - 4];',
    '    if(x < 1e-4) continue;',
    '    vec3 T; vec3 R = kmR(k, x, T);',
    '    vec3 den = max(1.0 - R*Rt, vec3(1e-4));',
    '    Tt = Tt*T/den;',
    '    Rt = R + T*T*Rt/den;',
    '  }',
    '  return Rt;',
    '}',
    'vec3 aLin(vec3 c){ return mix(c/12.92, pow(max((c + 0.055)/1.055, vec3(1e-4)), vec3(2.4)), step(0.04045, c)); }',
    'vec3 aSrgb(vec3 c){ c = max(c, vec3(0.0)); return mix(c*12.92, 1.055*pow(max(c, vec3(1e-6)), vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }',
    'vec3 papelBase(ivec2 ij, sampler2D pap){',
    '  vec4 pp = texelFetch(pap, ij, 0);',
    '  float hR = texelFetch(pap, CL(ij + ivec2(1,0)), 0).r, hU = texelFetch(pap, CL(ij + ivec2(0,1)), 0).r;',
    '  float sh = 1.0 + 0.16*(pp.r - hR) + 0.10*(pp.r - hU) + 0.025*(pp.b - 0.5);',
    '  return vec3(0.905, 0.895, 0.865)*sh;',
    '}'
  ].join('\n');

  var FS_VER = [
    PRE,
    'uniform sampler2D uDep0, uDep1, uPig0, uPig1, uPapel, uAgua, uSat, uFundo, uVegAnt, uVegProx;',
    'uniform float uLuz, uRetro, uVegA, uVegP, uMostraAgua;',
    'uniform int uTemFundo;',
    GL_KM,
    'out vec4 o;',
    'void main(){',
    '  ivec2 ij = IJ();',
    '  vec4 x0 = texelFetch(uDep0, ij, 0) + texelFetch(uPig0, ij, 0);',
    '  vec4 x1 = texelFetch(uDep1, ij, 0) + texelFetch(uPig1, ij, 0);',
    '  vec3 base = papelBase(ij, uPapel);',
    '  vec3 fundo = base;',
    '  if(uTemFundo == 1){ vec3 vid = aLin(texture(uFundo, vUv).rgb); fundo = mix(base, vid*base/vec3(0.905,0.895,0.865)*0.98 + 0.02, uLuz); }',
    '  vec3 Tt; vec3 R = pilha(x0, x1, fundo, Tt);',
    '  vec4 a = texelFetch(uAgua, ij, 0); float w = texelFetch(uSat, ij, 0).a;',
    /* a água à vista: a mancha molhada é um pouco mais escura e brilha */
    '  float molh = a.a*clamp(w*3.0, 0.0, 1.0)*uMostraAgua;',
    '  R *= (1.0 - 0.09*molh);',
    '  R += 0.03*molh*vec3(1.0);',
    '  vec3 cor = R;',
    /* retroiluminação: a luz vem por trás do papel, o que se vê é o que ATRAVESSA */
    '  if(uRetro > 0.001){ vec3 Tp; pilha(x0, x1, vec3(0.0), Tp); vec3 luz = Tp*vec3(1.0, 0.98, 0.94)*1.15 + 0.06*R; cor = mix(cor, luz, uRetro); }',
    /* o papel vegetal: o quadro anterior em azul, o seguinte em vermelho */
    '  if(uVegA > 0.001){ vec3 pa = aLin(texture(uVegAnt, vUv).rgb); float t = 1.0 - min(min(pa.r, pa.g), pa.b); cor *= mix(vec3(1.0), mix(vec3(1.0), vec3(0.45, 0.6, 1.0), clamp(t*1.4, 0.0, 1.0)), uVegA); }',
    '  if(uVegP > 0.001){ vec3 pr = aLin(texture(uVegProx, vUv).rgb); float t2 = 1.0 - min(min(pr.r, pr.g), pr.b); cor *= mix(vec3(1.0), mix(vec3(1.0), vec3(1.0, 0.5, 0.45), clamp(t2*1.4, 0.0, 1.0)), uVegP); }',
    '  o = vec4(aSrgb(cor), 1.0);',
    '}'
  ].join('\n');

  /* 9. a saída: o quadro para o laboratório (invertido em y = PNG) ----- */
  var FS_EXP = [
    PRE,
    'uniform sampler2D uDep0, uDep1, uPig0, uPig1, uPapel;',
    'uniform int uModo;',     /* 0 = sobre o vídeo (C_w + alfa) · 1 = no papel (opaco) */
    GL_KM,
    'out vec4 o;',
    'void main(){',
    '  ivec2 ij = ivec2(int(gl_FragCoord.x), uTam.y - 1 - int(gl_FragCoord.y));',
    '  vec4 x0 = texelFetch(uDep0, ij, 0) + texelFetch(uPig0, ij, 0);',
    '  vec4 x1 = texelFetch(uDep1, ij, 0) + texelFetch(uPig1, ij, 0);',
    '  vec3 Tt;',
    '  if(uModo == 0){',
    '    vec3 Cw = pilha(x0, x1, vec3(1.0), Tt);',
    '    float cob = clamp((1.0 - min(min(Cw.r, Cw.g), Cw.b))*12.0, 0.0, 1.0);',
    '    o = vec4(aSrgb(Cw), cob);',
    '  } else {',
    '    vec3 R = pilha(x0, x1, papelBase(ij, uPapel), Tt);',
    '    o = vec4(aSrgb(R), 1.0);',
    '  }',
    '}'
  ].join('\n');

  /* 10. empacotar / desempacotar o estado (8 canais → dois RGBA8) ----- */
  var FS_PACK = [
    PRE,
    'uniform sampler2D uSrc;',
    'out vec4 o;',
    'void main(){',
    '  ivec2 ij = ivec2(int(gl_FragCoord.x), uTam.y - 1 - int(gl_FragCoord.y));',
    '  o = clamp(texelFetch(uSrc, ij, 0)*0.25, 0.0, 1.0);',
    '}'
  ].join('\n');
  var FS_UNPACK = [
    PRE,
    'uniform sampler2D uSrc;',
    'out vec4 o;',
    'void main(){',
    '  ivec2 ij = ivec2(int(gl_FragCoord.x), uTam.y - 1 - int(gl_FragCoord.y));',
    '  o = texelFetch(uSrc, ij, 0)*4.0;',
    '}'
  ].join('\n');
  /* 11. os instantâneos do desfazer: cada textura de estado cabe em RGBA8
     com uma escala e um deslocamento por canal (velocidade ±0,5, pigmento
     0..4, o resto 0..1) — o erro é o de um degrau, e só na volta        */
  var FS_SNAP = [
    PRE,
    'uniform sampler2D uSrc;',
    'uniform vec4 uEsc, uDesl;',
    'out vec4 o;',
    'void main(){ o = clamp(texelFetch(uSrc, IJ(), 0)*uEsc + uDesl, 0.0, 1.0); }'
  ].join('\n');
  var FS_UNSNAP = [
    PRE,
    'uniform sampler2D uSrc;',
    'uniform vec4 uEsc, uDesl;',
    'out vec4 o;',
    'void main(){ o = (texelFetch(uSrc, IJ(), 0) - uDesl)/uEsc; }'
  ].join('\n');
  var FS_ZERO = [PRE, 'out vec4 o;', 'void main(){ o = vec4(0.0); }'].join('\n');
  var FS_COPY = [PRE, 'uniform sampler2D uSrc;', 'out vec4 o;', 'void main(){ o = texelFetch(uSrc, IJ(), 0); }'].join('\n');

  /* ------------------------------------------------ a fábrica do motor */
  function Motor(canvas, w, h, opts) {
    var self = this;
    opts = opts || {};
    this.w = w; this.h = h; this.canvas = canvas;
    canvas.width = w; canvas.height = h;
    var gl = this.gl = canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false, depth: false, stencil: false, alpha: false });
    if (!gl) { this.falhou = 'sem WebGL2'; return; }
    if (!gl.getExtension('EXT_color_buffer_float')) { this.falhou = 'a placa não renderiza em texturas float'; return; }
    this.progs = {};
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);

    /* as texturas de estado, em par */
    var T = this.tex = {};
    ['agua', 'sat', 'pig0', 'pig1', 'dep0', 'dep1'].forEach(function (n) { T[n] = [self.mkTex(gl.RGBA32F), self.mkTex(gl.RGBA32F)]; });
    T.masc = [this.mkTex(gl.RGBA32F), this.mkTex(gl.RGBA32F)];
    T.papel = this.mkTex(gl.RGBA32F);
    T.fundo = this.mkTex(gl.RGBA8); T.vegAnt = this.mkTex(gl.RGBA8); T.vegProx = this.mkTex(gl.RGBA8);
    T.u8 = [this.mkTex(gl.RGBA8), this.mkTex(gl.RGBA8)];
    /* desfazer e refazer: um histórico de instantâneos em RGBA8 (14 MB cada
       a 1024×576), até HIST no total, com uma reserva de jogos de textura
       para não alocar a cada pincelada                                   */
    this.hist = []; this.refaz = []; this.reserva = [];
    this.fbo = gl.createFramebuffer();
    this.temFundo = 0;
    this.papelTipo = opts.papel || 'frio';
    this.setPapel(this.papelTipo, opts.semente || 7);
    this.paleta = (opts.paleta || A.PALETA_PADRAO).slice(0, 8);
    while (this.paleta.length < 8) this.paleta.push(null);
    this.ferr = 'pincel';
    this.slot = 0;
    this.raio = 9; this.agua1 = 0.30; this.carga = 0.42; this.lev = 0.55;
    /* as constantes do modelo — os nomes são os do artigo */
    this.par = {
      mu: 0.10, kappa: 0.06, pressao: 0.4, declive: 0.001,
      alfa: 0.0004, eps: 0.10, sigma: 0.5, sangra: 0.2, eta: 0.0025, evap: 0.0006,
      secaP: 10, taxa: 0.05, salPuxa: 0.35, salBebe: 0.012,
      granMul: 1, floradas: 1, borda: 1
    };
    this.passos = 0; this.ultimoToque = -1e9;
    this.fila = []; this.ultimoDab = null;
    this.luz = 0.55; this.retro = 0; this.vegA = 0; this.vegP = 0;
    this.limpar();
  }

  /* As de estado são RGBA32F e sem filtro: com meia precisão (16F) o
     transporte perdia 2,3% do pigmento em 40 passos — a fração que entra
     numa célula ficava abaixo do último bit e sumia. Medido.          */
  Motor.prototype.mkTex = function (fmt) {
    var gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    var flt = (fmt === gl.RGBA32F) ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, flt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, flt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (fmt === gl.RGBA32F) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.w, this.h, 0, gl.RGBA, gl.FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.w, this.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
  };

  Motor.prototype.prog = function (nome, fs) {
    if (this.progs[nome]) return this.progs[nome];
    var gl = this.gl;
    function sh(tipo, src) {
      var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('aquarela/' + nome + ': ' + gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('aquarela/' + nome + ' link: ' + gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var inf = gl.getActiveUniform(p, i); var nm = inf.name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(p, inf.name); }
    this.progs[nome] = { p: p, u: u };
    return this.progs[nome];
  };

  /* uma passada: programa, texturas de entrada {nome: tex}, alvos [tex…]
     (null = a tela), e uma função que arma os uniformes restantes     */
  Motor.prototype.passar = function (pr, entradas, alvos, arma) {
    var gl = this.gl;
    gl.useProgram(pr.p);
    if (alvos) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      var bufs = [];
      for (var i = 0; i < 8; i++) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, i < alvos.length ? alvos[i] : null, 0);
        if (i < alvos.length) bufs.push(gl.COLOR_ATTACHMENT0 + i);
      }
      gl.drawBuffers(bufs);
    } else gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h);
    var un = 0;
    Object.keys(entradas).forEach(function (k) {
      if (pr.u[k] === undefined) return;
      gl.activeTexture(gl.TEXTURE0 + un); gl.bindTexture(gl.TEXTURE_2D, entradas[k]); gl.uniform1i(pr.u[k], un); un++;
    });
    if (pr.u.uTam) gl.uniform2i(pr.u.uTam, this.w, this.h);
    if (arma) arma(pr.u, gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  Motor.prototype.troca = function (n) { var t = this.tex[n]; var a = t[0]; t[0] = t[1]; t[1] = a; };
  Motor.prototype.copiar = function (src, dst) { this.passar(this.prog('copy', FS_COPY), { uSrc: src }, [dst]); };
  Motor.prototype.zerar = function (dst) { this.passar(this.prog('zero', FS_ZERO), {}, [dst]); };

  /* ------------------------------------------------------- o papel */
  Motor.prototype.setPapel = function (tipo, semente) {
    var gl = this.gl;
    this.papelTipo = A.PAPEIS[tipo] ? tipo : 'frio';
    this.papelSemente = semente || this.papelSemente || 7;
    var dados = A.gerarPapel(this.w, this.h, this.papelTipo, this.papelSemente);
    gl.bindTexture(gl.TEXTURE_2D, this.tex.papel);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.w, this.h, 0, gl.RGBA, gl.FLOAT, dados);
  };

  /* ---------------------------------------------- limpar a folha */
  Motor.prototype.limpar = function () {
    var self = this;
    ['agua', 'sat', 'pig0', 'pig1', 'dep0', 'dep1', 'masc'].forEach(function (n) { self.zerar(self.tex[n][0]); self.zerar(self.tex[n][1]); });
    this.fila = []; this.ultimoDab = null; this.molhada = false; this.passos = 0;
    registrar('limpar', []);
  };

  /* ------------------------------------------------ os pigmentos */
  Motor.prototype.armarKM = function (u, gl) {
    var a = [], b = [], s = [], dens = [], man = [], gran = [];
    for (var k = 0; k < 8; k++) {
      var p = A.PIGBY[this.paleta[k]];
      var ks = p ? A.ks(p) : { a: [1.5, 1.5, 1.5], b: [1.1, 1.1, 1.1], S: [0.0001, 0.0001, 0.0001] };
      a.push(ks.a[0], ks.a[1], ks.a[2]); b.push(ks.b[0], ks.b[1], ks.b[2]); s.push(ks.S[0], ks.S[1], ks.S[2]);
      dens.push(p ? p.dens : 0.5); man.push(p ? p.mancha : 2); gran.push(p ? Math.min(0.98, p.gran * this.par.granMul) : 0);
    }
    if (u.uKa) { gl.uniform3fv(u.uKa, a); gl.uniform3fv(u.uKb, b); gl.uniform3fv(u.uKs, s); }
    this.__dens = dens; this.__man = man; this.__gran = gran;
  };

  /* ---------------------------------------------- as ferramentas */
  var FERR = { pincel: 0, agua: 1, seco: 2, esponja: 3, sal: 4, alcool: 5 };
  Motor.prototype.ferramenta = function (nome, o) {
    if (FERR[nome] === undefined) return;
    this.ferr = nome;
    o = o || {};
    if (o.raio != null) this.raio = o.raio;
    if (o.agua != null) this.agua1 = o.agua;
    if (o.carga != null) this.carga = o.carga;
    if (o.lev != null) this.lev = o.lev;
    if (o.slot != null) this.slot = o.slot;
  };

  /* um toque: (x, y) em pixels da folha, pressão 0..1. Entre dois toques
     o motor semeia pontos com o espaçamento do pincel                 */
  Motor.prototype.tocar = function (x, y, pr) {
    this.guardarDesfazer();
    this.ultimoDab = null;
    this.arrastar(x, y, pr);
  };
  Motor.prototype.arrastar = function (x, y, pr) {
    pr = (pr == null || pr <= 0) ? 0.5 : pr;
    var r = this.raio * (0.55 + 0.9 * pr), f = (0.5 + pr);
    var esp = Math.max(1.2, r * 0.32);
    if (this.ferr === 'sal' || this.ferr === 'alcool') esp = Math.max(esp, r * 0.9);
    if (!this.ultimoDab) { this.fila.push([x, y, r, f]); }
    else {
      var lx = this.ultimoDab[0], ly = this.ultimoDab[1], dx = x - lx, dy = y - ly, d = Math.sqrt(dx * dx + dy * dy);
      if (d < esp) return;
      var n = Math.floor(d / esp);
      for (var i = 1; i <= n; i++) { var t = i * esp / d; this.fila.push([lx + dx * t, ly + dy * t, r, f]); }
      var rest = d - n * esp;
      if (rest > esp * 0.5) { this.fila.push([x, y, r, f]); }
      else { x = lx + dx * (n * esp / d); y = ly + dy * (n * esp / d); }
    }
    this.ultimoDab = [x, y, r, f];
    this.ultimoToque = this.passos;
    if (this.fila.length >= 48) this.aplicar();
  };
  Motor.prototype.soltar = function () { this.aplicar(); this.ultimoDab = null; };

  Motor.prototype.aplicar = function () {
    if (!this.fila.length) return;
    var self = this, gl = this.gl, T = this.tex;
    var lote = this.fila.splice(0, 48), n = lote.length;
    if (this.ferr === 'sal') {
      /* cristais: pontos sorteados dentro do toque, poucos e pequenos */
      var cr = [];
      lote.forEach(function (d) {
        var q = Math.max(2, Math.round(d[2] * d[2] * 0.012));
        for (var i = 0; i < q && cr.length < 48; i++) {
          var ang = Math.random() * 6.2832, rr = Math.sqrt(Math.random()) * d[2];
          cr.push([d[0] + Math.cos(ang) * rr, d[1] + Math.sin(ang) * rr, 0.9 + Math.random() * 1.1, 1]);
        }
      });
      lote = cr; n = cr.length;
      if (!n) return;
    }
    var arr = new Float32Array(48 * 4);
    for (var i = 0; i < n; i++) { arr[i * 4] = lote[i][0]; arr[i * 4 + 1] = lote[i][1]; arr[i * 4 + 2] = lote[i][2]; arr[i * 4 + 3] = lote[i][3]; }
    var pr = this.prog('tool', FS_TOOL);
    this.passar(pr, { uAgua: T.agua[0], uSat: T.sat[0], uPig0: T.pig0[0], uPig1: T.pig1[0], uDep0: T.dep0[0], uDep1: T.dep1[0], uPapel: T.papel },
      [T.agua[1], T.sat[1], T.pig0[1], T.pig1[1], T.dep0[1], T.dep1[1]], function (u) {
        gl.uniform4fv(u.uDab, arr); gl.uniform1i(u.uN, n);
        gl.uniform1i(u.uFerr, FERR[self.ferr]); gl.uniform1i(u.uSlot, self.slot);
        gl.uniform1f(u.uAgua1, self.agua1); gl.uniform1f(u.uCarga, self.carga); gl.uniform1f(u.uLev, self.lev);
        var man = [], k;
        for (k = 0; k < 8; k++) { var p = A.PIGBY[self.paleta[k]]; man.push(p ? p.mancha : 2); }
        gl.uniform4fv(u.uMancha0, man.slice(0, 4)); gl.uniform4fv(u.uMancha1, man.slice(4, 8));
      });
    ['agua', 'sat', 'pig0', 'pig1', 'dep0', 'dep1'].forEach(function (k) { self.troca(k); });
    this.molhada = true;
    var pig = this.paleta[this.slot];
    registrar(this.ferr, [Math.round(lote[0][0]), Math.round(lote[0][1]), +lote[0][2].toFixed(1), n, this.ferr === 'pincel' || this.ferr === 'seco' ? pig : undefined]);
  };

  /* ------------------------------------------------------ o passo */
  Motor.prototype.passo = function () {
    if (!this.molhada) return false;
    var self = this, gl = this.gl, T = this.tex, P = this.par;
    this.aplicar();
    /* o borrão da máscara e do sal (só a cada 2 passos: muda devagar) */
    if (this.passos % 2 === 0) {
      var pb = this.prog('blur', FS_BLUR);
      this.passar(pb, { uSrc: T.agua[0], uSat: T.sat[0] }, [T.masc[1]], function (u) { gl.uniform2i(u.uDir, 1, 0); gl.uniform1i(u.uModo, 0); });
      this.passar(pb, { uSrc: T.masc[1], uSat: T.sat[0] }, [T.masc[0]], function (u) { gl.uniform2i(u.uDir, 0, 1); gl.uniform1i(u.uModo, 1); });
      this.passar(pb, { uSrc: T.masc[0], uSat: T.sat[0] }, [T.masc[1]], function (u) { gl.uniform2i(u.uDir, 3, 0); gl.uniform1i(u.uModo, 1); });
      this.passar(pb, { uSrc: T.masc[1], uSat: T.sat[0] }, [T.masc[0]], function (u) { gl.uniform2i(u.uDir, 0, 3); gl.uniform1i(u.uModo, 1); });
    }
    /* 1. a água */
    this.passar(this.prog('vel', FS_VEL), { uAgua: T.agua[0], uPapel: T.papel, uSat: T.sat[0], uMasc: T.masc[0] }, [T.agua[1]], function (u) {
      gl.uniform1f(u.uMu, P.mu); gl.uniform1f(u.uKappa, P.kappa); gl.uniform1f(u.uDeclive, P.declive); gl.uniform1f(u.uSalPuxa, P.salPuxa); gl.uniform1f(u.uPressao, P.pressao);
    });
    this.troca('agua');
    /* 2. o pigmento anda com a água */
    var pp = this.prog('pig', FS_PIG);
    this.passar(pp, { uPig: T.pig0[0], uAgua: T.agua[0], uSat: T.sat[0] }, [T.pig0[1]], function (u) { gl.uniform1i(u.uSoAgua, 0); }); this.troca('pig0');
    this.passar(pp, { uPig: T.pig1[0], uAgua: T.agua[0], uSat: T.sat[0] }, [T.pig1[1]], function (u) { gl.uniform1i(u.uSoAgua, 0); }); this.troca('pig1');
    /* a própria água anda com o fluxo */
    this.passar(pp, { uPig: T.sat[0], uAgua: T.agua[0], uSat: T.sat[0] }, [T.sat[1]], function (u) { gl.uniform1i(u.uSoAgua, 1); }); this.troca('sat');
    /* 3. deposita e levanta */
    var pt = this.prog('trans', FS_TRANS);
    this.armarKM({}, gl);
    var dens = this.__dens, man = this.__man, gran = this.__gran;
    [0, 1].forEach(function (b) {
      var pg = 'pig' + b, dp = 'dep' + b;
      self.passar(pt, { uPig: T[pg][0], uDep: T[dp][0], uPapel: T.papel, uAgua: T.agua[0], uSat: T.sat[0], uMasc: T.masc[0] }, [T[pg][1], T[dp][1]], function (u) {
        gl.uniform4fv(u.uDens, dens.slice(b * 4, b * 4 + 4)); gl.uniform4fv(u.uMancha, man.slice(b * 4, b * 4 + 4)); gl.uniform4fv(u.uGran, gran.slice(b * 4, b * 4 + 4));
        gl.uniform1f(u.uTaxa, P.taxa);
      });
      self.troca(pg); self.troca(dp);
    });
    /* 4. capilar, evaporação, borda, secagem */
    this.passar(this.prog('cap', FS_CAP), { uSat: T.sat[0], uAgua: T.agua[0], uPapel: T.papel, uMasc: T.masc[0] }, [T.sat[1], T.agua[1]], function (u) {
      gl.uniform1f(u.uAlfa, P.alfa); gl.uniform1f(u.uEps, P.eps); gl.uniform1f(u.uSigma, P.sigma);
      gl.uniform1f(u.uEvap, P.evap); gl.uniform1f(u.uEta, P.eta * P.borda); gl.uniform1f(u.uSecaP, P.secaP); gl.uniform1f(u.uSalBebe, P.salBebe);
      gl.uniform1f(u.uSangra, P.floradas ? P.sangra : 9.0);
    });
    this.troca('sat'); this.troca('agua');
    this.passos++;
    if (this.passos % 120 === 0) registrar('passo', [this.passos]);
    /* passado o tempo de secagem sem toque, a folha está seca: seca de vez */
    if (this.passos - this.ultimoToque > this.secagemPassos()) this.secar();
    return true;
  };
  Motor.prototype.secagemPassos = function () { return Math.round(1.1 / Math.max(this.par.evap, 1e-4)); };

  /* secar de vez: a água some, o que estava nela assenta, o sal sai */
  Motor.prototype.secar = function () {
    var self = this, gl = this.gl, T = this.tex;
    this.aplicar();
    var pt = this.prog('trans', FS_TRANS);
    this.armarKM({}, gl);
    this.zerar(T.agua[1]); this.troca('agua');              /* M = 0, p = 0, u = v = 0 */
    var dens = this.__dens, man = this.__man, gran = this.__gran;
    [0, 1].forEach(function (b) {
      var pg = 'pig' + b, dp = 'dep' + b;
      self.passar(pt, { uPig: T[pg][0], uDep: T[dp][0], uPapel: T.papel, uAgua: T.agua[0], uSat: T.sat[0], uMasc: T.masc[0] }, [T[pg][1], T[dp][1]], function (u) {
        gl.uniform4fv(u.uDens, dens.slice(b * 4, b * 4 + 4)); gl.uniform4fv(u.uMancha, man.slice(b * 4, b * 4 + 4)); gl.uniform4fv(u.uGran, gran.slice(b * 4, b * 4 + 4));
        gl.uniform1f(u.uTaxa, self.par.taxa);
      });
      self.troca(pg); self.troca(dp);
    });
    this.zerar(T.sat[1]); this.troca('sat');                /* o sal sai com a escova, depois de levar o que levou */
    this.molhada = false;
    registrar('secar', []);
  };

  /* ------------------------------------------- desfazer e refazer
     Um histórico linear: `hist` guarda os estados ANTERIORES a cada ação
     (pincelada, secar, limpar, copiar), `refaz` os que o desfazer tirou.
     Uma ação nova esvazia o refazer. Os jogos de textura voltam para a
     reserva e são reaproveitados. Tudo em RGBA8 quantizado — o que se
     paga é um degrau (1/64 no pigmento, 1/500 na velocidade), uma vez. */
  var ESTADO = ['agua', 'sat', 'pig0', 'pig1', 'dep0', 'dep1'];
  var SNAP = {
    agua: { esc: [2, 2, 1, 1], desl: [0.5, 0.5, 0, 0] },
    sat: { esc: [1, 1, 1, 1], desl: [0, 0, 0, 0] },
    pig0: { esc: [0.25, 0.25, 0.25, 0.25], desl: [0, 0, 0, 0] }, pig1: { esc: [0.25, 0.25, 0.25, 0.25], desl: [0, 0, 0, 0] },
    dep0: { esc: [0.25, 0.25, 0.25, 0.25], desl: [0, 0, 0, 0] }, dep1: { esc: [0.25, 0.25, 0.25, 0.25], desl: [0, 0, 0, 0] }
  };
  Motor.HIST = 12;
  Motor.prototype.jogo = function () {
    if (this.reserva.length) return this.reserva.pop();
    var self = this, gl = this.gl, n = {};
    ESTADO.forEach(function (k) { n[k] = self.mkTex(gl.RGBA8); });
    return n;
  };
  Motor.prototype.instantaneo = function () {
    var self = this, gl = this.gl, n = this.jogo(), pr = this.prog('snap', FS_SNAP);
    ESTADO.forEach(function (k) {
      self.passar(pr, { uSrc: self.tex[k][0] }, [n[k]], function (u) { gl.uniform4fv(u.uEsc, SNAP[k].esc); gl.uniform4fv(u.uDesl, SNAP[k].desl); });
    });
    n.molhada = this.molhada; n.ultimoToque = this.ultimoToque;
    return n;
  };
  Motor.prototype.repor = function (n) {
    var self = this, gl = this.gl, pr = this.prog('unsnap', FS_UNSNAP);
    ESTADO.forEach(function (k) {
      self.passar(pr, { uSrc: n[k] }, [self.tex[k][0]], function (u) { gl.uniform4fv(u.uEsc, SNAP[k].esc); gl.uniform4fv(u.uDesl, SNAP[k].desl); });
    });
    this.molhada = !!n.molhada; this.ultimoToque = this.passos; this.fila = []; this.ultimoDab = null;
  };
  /* guardar o estado de AGORA como o passo anterior da próxima ação */
  Motor.prototype.guardarDesfazer = function () {
    var self = this;
    this.aplicar();
    this.hist.push(this.instantaneo());
    while (this.refaz.length) this.reserva.push(this.refaz.pop());
    while (this.hist.length > Motor.HIST) this.reserva.push(this.hist.shift());
  };
  Motor.prototype.desfazer = function () {
    if (!this.hist.length) return false;
    this.aplicar();
    this.refaz.push(this.instantaneo());
    var n = this.hist.pop();
    this.repor(n); this.reserva.push(n);
    registrar('desfazer', []);
    return true;
  };
  Motor.prototype.refazer = function () {
    if (!this.refaz.length) return false;
    this.aplicar();
    this.hist.push(this.instantaneo());
    var n = this.refaz.pop();
    this.repor(n); this.reserva.push(n);
    registrar('refazer', []);
    return true;
  };
  Motor.prototype.podeDesfazer = function () { return this.hist.length > 0; };
  Motor.prototype.podeRefazer = function () { return this.refaz.length > 0; };
  /* trocar de quadro é outra folha: o histórico não atravessa */
  Motor.prototype.limparHistorico = function () {
    while (this.hist.length) this.reserva.push(this.hist.pop());
    while (this.refaz.length) this.reserva.push(this.refaz.pop());
  };

  /* --------------------------------------------- o fundo e o vegetal */
  Motor.prototype.setFundo = function (fonte) {
    var gl = this.gl;
    if (!fonte) { this.temFundo = 0; return; }
    gl.bindTexture(gl.TEXTURE_2D, this.tex.fundo);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, fonte); this.temFundo = 1; }
    catch (e) { this.temFundo = 0; }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  };
  Motor.prototype.setVegetal = function (qual, fonte) {
    var gl = this.gl, t = qual === 'prox' ? this.tex.vegProx : this.tex.vegAnt;
    if (!fonte) { if (qual === 'prox') this.temVegP = 0; else this.temVegA = 0; return; }
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, fonte); if (qual === 'prox') this.temVegP = 1; else this.temVegA = 1; }
    catch (e) { }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  };

  /* ------------------------------------------------------- desenhar */
  Motor.prototype.desenhar = function () {
    var self = this, gl = this.gl, T = this.tex;
    this.aplicar();
    this.passar(this.prog('ver', FS_VER), { uDep0: T.dep0[0], uDep1: T.dep1[0], uPig0: T.pig0[0], uPig1: T.pig1[0], uPapel: T.papel, uAgua: T.agua[0], uSat: T.sat[0], uFundo: T.fundo, uVegAnt: T.vegAnt, uVegProx: T.vegProx }, null, function (u) {
      self.armarKM(u, gl);
      gl.uniform1f(u.uLuz, self.luz); gl.uniform1f(u.uRetro, self.retro);
      gl.uniform1f(u.uVegA, self.temVegA ? self.vegA : 0); gl.uniform1f(u.uVegP, self.temVegP ? self.vegP : 0);
      gl.uniform1f(u.uMostraAgua, self.mostraAgua === false ? 0 : 1);
      gl.uniform1i(u.uTemFundo, self.temFundo);
    });
  };

  /* ------------------------------------- ler de volta (para testes) */
  Motor.prototype.ler = function (nome, x, y, w, h) {
    var gl = this.gl, t = nome === 'papel' ? this.tex.papel : this.tex[nome][0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    for (var i = 1; i < 8; i++) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    w = w || this.w; h = h || this.h;
    var out = new Float32Array(w * h * 4);
    gl.readPixels(x || 0, y || 0, w, h, gl.RGBA, gl.FLOAT, out);
    return out;
  };
  /* a tela, em bytes (RGBA, de baixo para cima como o GL) */
  Motor.prototype.lerTela = function () {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    var out = new Uint8Array(this.w * this.h * 4);
    gl.readPixels(0, 0, this.w, this.h, gl.RGBA, gl.UNSIGNED_BYTE, out);
    return out;
  };

  /* --------------------------------------------- a saída do quadro */
  Motor.prototype.exportar = function (modo) {
    var self = this, gl = this.gl, T = this.tex;
    this.passar(this.prog('exp', FS_EXP), { uDep0: T.dep0[0], uDep1: T.dep1[0], uPig0: T.pig0[0], uPig1: T.pig1[0], uPapel: T.papel }, [T.u8[0]], function (u) {
      self.armarKM(u, gl); gl.uniform1i(u.uModo, modo === 'papel' ? 1 : 0);
    });
    var out = new Uint8Array(this.w * this.h * 4);
    gl.readPixels(0, 0, this.w, this.h, gl.RGBA, gl.UNSIGNED_BYTE, out);
    return out;
  };
  /* o estado seco (só o depositado), dois RGBA8 de cima para baixo */
  Motor.prototype.empacotar = function () {
    var gl = this.gl, T = this.tex, pr = this.prog('pack', FS_PACK), out = new Uint8Array(this.w * this.h * 8);
    this.passar(pr, { uSrc: T.dep0[0] }, [T.u8[0]]);
    gl.readPixels(0, 0, this.w, this.h, gl.RGBA, gl.UNSIGNED_BYTE, out.subarray(0, this.w * this.h * 4));
    this.passar(pr, { uSrc: T.dep1[0] }, [T.u8[0]]);
    gl.readPixels(0, 0, this.w, this.h, gl.RGBA, gl.UNSIGNED_BYTE, out.subarray(this.w * this.h * 4));
    return out;
  };
  Motor.prototype.desempacotar = function (bytes) {
    var self = this, gl = this.gl, T = this.tex, pr = this.prog('unpack', FS_UNPACK), n = this.w * this.h * 4;
    this.limparHistorico();
    this.limpar();
    [0, 1].forEach(function (b) {
      gl.bindTexture(gl.TEXTURE_2D, T.u8[1]);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, self.w, self.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes.subarray(b * n, b * n + n));
      self.passar(pr, { uSrc: T.u8[1] }, [T['dep' + b][0]]);
    });
    this.molhada = false;
  };
  Motor.prototype.destruir = function () {
    var gl = this.gl; if (!gl) return;
    try { gl.getExtension('WEBGL_lose_context').loseContext(); } catch (e) { }
  };

  A.Motor = Motor;
  A.motor = null;
  A.abrirMotor = function (canvas, w, h, opts) {
    if (A.motor && A.motor.gl && A.motor.w === w && A.motor.h === h && A.motor.canvas === canvas) return A.motor;
    if (A.motor) A.motor.destruir();
    A.motor = new Motor(canvas, w, h, opts);
    return A.motor;
  };

  /* ============================================== MODO CÓDIGO ==========
     Cada chamada de motor que importa passa por aqui. Com o modo ligado,
     as linhas ficam num anel e a tela as mostra enquanto se pinta —
     são as chamadas de verdade, com os números de verdade.            */
  A.codigo = { ligado: false, linhas: [], ouvinte: null };
  function registrar(nome, args) {
    if (!A.codigo.ligado) return;
    var txt = 'aquarela.' + nome + '(' + args.filter(function (a) { return a !== undefined; }).map(function (a) {
      return typeof a === 'string' ? "'" + a + "'" : String(a);
    }).join(', ') + ')';
    var L = A.codigo.linhas, ult = L[L.length - 1];
    if (ult && ult.txt === txt) { ult.n++; }
    else { L.push({ txt: txt, n: 1 }); if (L.length > 60) L.shift(); }
    if (A.codigo.ouvinte) A.codigo.ouvinte();
  }
  A.registrar = registrar;

  /* =========================================== DEFLATE E PNG ==========
     O estado de um quadro vai comprimido (deflate do navegador) e o
     quadro renderizado vai em PNG escrito à mão — sem canvas no meio,
     para o alfa não ser pré-multiplicado por ninguém.                  */
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
    return t;
  })();
  function crc32(buf, ini, fim) {
    var c = 0xFFFFFFFF;
    for (var i = ini; i < fim; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function comprimir(bytes, formato) {
    if (typeof CompressionStream === 'undefined') return Promise.reject(new Error('sem CompressionStream'));
    var cs = new CompressionStream(formato || 'deflate');
    var w = cs.writable.getWriter(); w.write(bytes); w.close();
    return new Response(cs.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function descomprimir(bytes, formato) {
    var ds = new DecompressionStream(formato || 'deflate');
    var w = ds.writable.getWriter(); w.write(bytes); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  A.comprimir = comprimir; A.descomprimir = descomprimir;

  A.png = function (w, h, rgba) {
    var linha = w * 4 + 1, raw = new Uint8Array(linha * h);
    for (var y = 0; y < h; y++) { raw[y * linha] = 0; raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * linha + 1); }
    return comprimir(raw, 'deflate').then(function (idat) {
      function chunk(tipo, dados) {
        var out = new Uint8Array(12 + dados.length), dv = new DataView(out.buffer);
        dv.setUint32(0, dados.length);
        for (var i = 0; i < 4; i++) out[4 + i] = tipo.charCodeAt(i);
        out.set(dados, 8);
        dv.setUint32(8 + dados.length, crc32(out, 4, 8 + dados.length));
        return out;
      }
      var ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
      dv.setUint32(0, w); dv.setUint32(4, h); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
      var partes = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))];
      var tot = 0; partes.forEach(function (p) { tot += p.length; });
      var out = new Uint8Array(tot), off = 0;
      partes.forEach(function (p) { out.set(p, off); off += p.length; });
      return out;
    });
  };

  /* ================================================== OS QUADROS =======
     A sequência. Cada quadro: { estado (deflate dos dois RGBA8), png
     (bytes), thumb (data-url) }. O quadro ATUAL vive na GPU; trocar de
     quadro seca, empacota e guarda o que estava, e repõe o de destino. */
  A.filme = { quadros: [], atual: 0, fps: 12, passo: 2, inicio: 0, w: 0, h: 0, modo: 'video' };

  A.guardarAtual = function () {
    var m = A.motor, F = A.filme; if (!m || !m.gl) return Promise.resolve();
    if (m.molhada) m.secar();
    var q = F.quadros[F.atual]; if (!q) { q = F.quadros[F.atual] = {}; }
    var estado = m.empacotar(), rgba = m.exportar(F.modo);
    q.w = m.w; q.h = m.h; q.sujo = false;
    return Promise.all([comprimir(estado, 'deflate'), A.png(m.w, m.h, rgba)]).then(function (r) {
      q.estado = r[0]; q.png = r[1];
      q.blob = new Blob([q.png], { type: 'image/png' });
      if (q.bitmap) { try { q.bitmap.close(); } catch (e) { } q.bitmap = null; }
      return A.miniatura(q);
    });
  };
  A.miniatura = function (q) {
    return createImageBitmap(q.blob).then(function (bm) {
      var cv = document.createElement('canvas'), w = 160, h = Math.max(1, Math.round(160 * q.h / q.w));
      cv.width = w; cv.height = h;
      var c = cv.getContext('2d');
      c.fillStyle = '#f2efe6'; c.fillRect(0, 0, w, h);
      c.drawImage(bm, 0, 0, w, h);
      q.thumb = cv.toDataURL('image/jpeg', 0.8);
      q.bitmap = bm;
      return q;
    }).catch(function () { return q; });
  };
  A.reporQuadro = function (i) {
    var m = A.motor, F = A.filme, q = F.quadros[i];
    F.atual = i;
    if (!q || !q.estado) { m.limparHistorico(); m.limpar(); return Promise.resolve(); }
    return descomprimir(q.estado, 'deflate').then(function (bytes) { m.desempacotar(bytes); });
  };
  /* ir para um quadro: guarda o atual, repõe o destino (cria se não existir) */
  A.irPara = function (i) {
    var F = A.filme;
    i = Math.max(0, i | 0);
    registrar('quadro', [i]);
    var ida = (A.motor && F.quadros[F.atual] !== undefined || (A.motor && A.motor.molhada)) ? A.guardarAtual() : Promise.resolve();
    return ida.then(function () {
      while (F.quadros.length <= i) F.quadros.push({});
      return A.reporQuadro(i);
    });
  };
  A.apagarQuadro = function (i) {
    var F = A.filme; if (F.quadros.length <= 1) return Promise.resolve();
    var q = F.quadros[i];
    if (q && q.bitmap) { try { q.bitmap.close(); } catch (e) { } }
    F.quadros.splice(i, 1);
    if (F.atual > i) F.atual--;
    if (F.atual >= F.quadros.length) F.atual = F.quadros.length - 1;
    return A.reporQuadro(F.atual);
  };
  /* copiar o quadro anterior para o atual (animar por cima do que já havia) */
  A.copiarAnterior = function () {
    var F = A.filme, q = F.quadros[F.atual - 1];
    if (!q || !q.estado) return Promise.resolve(false);
    return descomprimir(q.estado, 'deflate').then(function (bytes) {
      var m = A.motor, antes = m.instantaneo();          /* o copiar se desfaz */
      m.desempacotar(bytes); m.hist.push(antes);
      F.quadros[F.atual].sujo = true; return true;
    });
  };
  A.novoFilme = function (w, h) {
    var F = A.filme;
    F.quadros.forEach(function (q) { if (q.bitmap) { try { q.bitmap.close(); } catch (e) { } } });
    F.quadros = [{}]; F.atual = 0; F.w = w; F.h = h;
  };
  A.tempoDoQuadro = function (i) { return A.filme.inicio + i / A.filme.fps; };

  /* ============================================ A FONTE 'quadros' ======
     O laboratório recebe a sequência como uma fonte que sabe desenhar o
     quadro certo para cada instante. A imagem é decodificada sob demanda
     e guardada num cache pequeno; enquanto o quadro pedido não chega, o
     último fica na tela (nunca pisca).                                */
  function fonteDeQuadros(quadros, fps, w, h, nome) {
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    var cache = {}, ordem = [], MAX = 40, ultimo = -1;
    function pedir(i) {
      var q = quadros[i]; if (!q || cache[i] !== undefined) return;
      cache[i] = null;
      createImageBitmap(q.blob).then(function (bm) {
        cache[i] = bm; ordem.push(i);
        while (ordem.length > MAX) { var v = ordem.shift(); if (cache[v]) { try { cache[v].close(); } catch (e) { } } delete cache[v]; }
      }).catch(function () { delete cache[i]; });
    }
    var s = {
      kind: 'quadros', name: nome || 'AQUARELA', el: cv, w: w, h: h, duration: quadros.length / fps, fps: fps, n: quadros.length,
      quadros: quadros, live: true, animado: true,
      render: function (tSrc) {
        var i = Math.max(0, Math.min(quadros.length - 1, Math.floor(tSrc * fps + 1e-4)));
        for (var k = 0; k < 4; k++) pedir(Math.min(quadros.length - 1, i + k));
        if (i === ultimo) return;
        var bm = cache[i];
        if (!bm) return;               /* ainda decodificando: fica o último */
        c.clearRect(0, 0, w, h); c.drawImage(bm, 0, 0, w, h);
        ultimo = i;
      }
    };
    s.render(0);
    return s;
  }
  A.fonteDeQuadros = fonteDeQuadros;

  /* o ROLO: um arquivo só com todos os quadros — cabeçalho JSON e os PNGs
     em fila. É o `blob` da fonte, o que a sessão guardada e o arquivo de
     projeto gravam e devolvem.                                          */
  A.empacotarRolo = function (quadros, fps, w, h, paleta) {
    var cab = JSON.stringify({
      app: 'rgb_lab', tipo: 'aquarela', v: 1, fps: fps, w: w, h: h, n: quadros.length,
      paleta: paleta || null,
      tamanhos: quadros.map(function (q) { return q.png.length; }),
      /* os estados (o depositado, comprimido) vão junto: é o que deixa o
         DO CLIPE trazer a sequência de volta para a mesa, editável      */
      tamanhosEstado: quadros.map(function (q) { return q.estado ? q.estado.length : 0; })
    });
    var enc = new TextEncoder().encode(cab), head = new Uint8Array(8);
    new DataView(head.buffer).setUint32(0, 0x52474241); new DataView(head.buffer).setUint32(4, enc.length);
    var partes = [head, enc];
    quadros.forEach(function (q) { partes.push(q.png); });
    quadros.forEach(function (q) { if (q.estado) partes.push(q.estado); });
    return new Blob(partes, { type: 'application/x-rgblab-aquarela' });
  };
  A.desempacotarRolo = function (blob) {
    return blob.arrayBuffer().then(function (buf) {
      var dv = new DataView(buf);
      if (dv.getUint32(0) !== 0x52474241) throw new Error('não é um rolo de aquarela');
      var n = dv.getUint32(4), cab = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, n)));
      var off = 8 + n, quadros = [], estados = [];
      cab.tamanhos.forEach(function (t) {
        var png = new Uint8Array(buf, off, t); off += t;
        quadros.push({ png: png, blob: new Blob([png], { type: 'image/png' }), w: cab.w, h: cab.h });
      });
      (cab.tamanhosEstado || []).forEach(function (t) {
        if (!t) { estados.push(null); return; }
        estados.push(new Uint8Array(buf, off, t)); off += t;
      });
      return { cab: cab, quadros: quadros, estados: cab.tamanhosEstado ? estados : null };
    });
  };
  /* registrar a sequência atual como fonte (o USAR da máquina chama isto) */
  A.registrarFonte = function (nome) {
    var F = A.filme, quadros = F.quadros.filter(function (q) { return q && q.png; });
    if (!quadros.length) return null;
    var w = quadros[0].w, h = quadros[0].h;
    var s = fonteDeQuadros(quadros, F.fps, w, h, nome);
    s.blob = A.empacotarRolo(quadros, F.fps, w, h, A.motor ? A.motor.paleta : null);
    s.modo = F.modo;
    return VE.media.register(s);
  };
  /* remontar uma fonte a partir do rolo guardado (media.js/recriar) */
  A.recriarFonte = function (blob, nome) {
    return A.desempacotarRolo(blob).then(function (r) {
      var s = fonteDeQuadros(r.quadros, r.cab.fps, r.cab.w, r.cab.h, nome);
      s.blob = blob;
      return VE.media.register(s);
    });
  };

})(window.VE);
