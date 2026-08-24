/* ============================================================
   rgb_lab — motor de renderização WebGL2
   [camadas de mídia] → composição → [efeitos] → tela
   Suporta canal alpha do início ao fim.
   ============================================================ */
(function (VE) {
  'use strict';

  var VERT = [
    '#version 300 es',
    'in vec2 aPos;',
    'out vec2 vUv;',
    'void main(){ vUv = aPos*0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var COPY_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUv;',
    'out vec4 fragColor;',
    'uniform sampler2D uTex;',
    'void main(){ fragColor = texture(uTex, vUv); }'
  ].join('\n');

  /* ---------------------------------------------------------- COMPOSIÇÃO
     Os shaders de composição, cor e máscara moram em `compgl.js`. Eles
     saíram daqui porque são matemática de imagem, não motor: o motor só
     precisa saber em que ordem chamá-los e quando pode não chamar.   */
  var COMP_FS  = VE.GLSL.COMP_FS;
  var GRADE_FS = VE.GLSL.GRADE_FS;
  var MASK_FS  = VE.GLSL.MASK_FS;

  function hex2rgb(h) {
    if (typeof h !== 'string') return [1, 1, 1];
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return [1, 1, 1];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  VE.hex2rgb = hex2rgb;

  function Renderer(canvas) {
    this.canvas = canvas;
    var opts = {
      alpha: true, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'
    };
    var gl = canvas.getContext('webgl2', opts);
    if (!gl) { this.failed = true; return; }
    this.gl = gl;
    this.w = 0; this.h = 0;
    this.programs = {};
    this.atlases = {};
    this.textures = {};
    /* qual textura de fonte JÁ recebeu um quadro de verdade. Serve para
       repetir o último quadro bom enquanto o <video> está buscando —
       sem isso a camada some e o fundo transparente pisca na agulha. */
    this.texOk = {};
    this.ready = false;

    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.vao = vao;

    this.copyProg  = this.build('__copy',  COPY_FS);
    this.compProg  = this.build('__comp',  COMP_FS);
    this.gradeProg = this.build('__grade', GRADE_FS);
    this.maskProg  = this.build('__mask',  MASK_FS);

    this.fbo = [this.mkTarget(), this.mkTarget()];
    this.aux = this.mkTarget();
    /* ------------------------------------------------- MEMÓRIA DE QUADROS
       O motor guarda os QUATRO últimos quadros compostos, não só o último.
       É o que permite a família TEMPO existir de verdade: eco temporal com
       vários passos, acúmulo, borrão de movimento entre quadros e o
       deslocamento temporal, em que cada pixel vem de um instante diferente.

       É um ANEL: nada é copiado de um alvo para outro, só o índice gira.
         escrita deste quadro → ring[i]
         uPrev (t-1) → ring[i+3]   uH2 (t-2) → ring[i+2]
         uH3   (t-3) → ring[i+1]   uH4 (t-4) → ring[i]                     */
    this.ring = [this.mkTarget(), this.mkTarget(), this.mkTarget(), this.mkTarget()];
    this.ringIdx = 0;
    /* ------------------------------------------- MEMÓRIA DA FONTE
       O anel de cima guarda o quadro JÁ COMPOSTO, com os efeitos
       dentro — é o que o eco quer, porque eco é realimentação.

       Para um efeito que quer ver OUTRO MOMENTO da imagem isso é
       veneno: a tira lê a si mesma do quadro anterior, que leu a si
       mesma do anterior, e a recursão termina no preto com que o anel
       nasceu. Descobri isso medindo — sete das oito tiras saíam pretas.

       Este segundo anel guarda a imagem COMO ELA ENTROU na cadeia de
       efeitos. Quem declara `histFonte` na definição recebe este, e
       não aquele. Só é alimentado quando alguém pede.               */
    this.ringF = null;
    this.ringFIdx = 0;
    /* Quantas vagas o anel da fonte tem hoje, e em que resolução. Meia
       resolução porque quem lê este anel lê em pedaço estreito — uma tira
       de 20 px não cobra detalhe — e é o que permite ter DEZESSEIS vagas
       pelo mesmo preço de quatro em tamanho cheio.                       */
    this.vagasF = 4;
    this.vagasPedidas = 4;
    this.escalaF = 0.5;
    this.ringFW = 0; this.ringFH = 0;
    /* distância de LEITURA, em quadros: quanto tempo separa uma lembrança
       da seguinte. Não confundir com `subHist`, que é de quantos em
       quantos quadros um é GUARDADO.                                     */
    this.distHist = 1;
    this.subHist = 1;
    this.prev = this.ring[3];    /* apelido: o quadro anterior, para quem já usava */
    /* par de alvos usado quando um CLIPE tem cadeia de efeitos própria:
       o clipe é desenhado sozinho num quadro transparente, passa pelos
       efeitos dele e só então é misturado na composição.                 */
    this.clipA = this.mkTarget();
    this.clipB = this.mkTarget();
    /* quadros de trabalho dos efeitos de VÁRIAS PASSADAS: o shader roda
       N vezes alternando entre estes dois, e só a última escreve no alvo */
    this.mp = [this.mkTarget(), this.mkTarget()];
    /* silhueta emprestada por outra camada (track matte). Só é preenchida
       quando alguém pede — mas o alvo existe sempre, porque criar textura
       no meio do laço é a maneira mais fácil de engasgar a reprodução. */
    this.matteT = this.mkTarget();
    /* ------------------------------------------------------ CACHE DE CAMADA
       Uma camada PARADA — imagem ou tipografia, sem keyframe, sem áudio
       reativo e sem efeito que leia o tempo — desenha igual em todo quadro.
       Guardar o resultado dela e reusar é a diferença entre pagar a pilha
       de efeitos 30 vezes por segundo e pagá-la uma vez.
       Quatro vagas, descarte pelo menos usado. Mais que isso é trocar
       memória de vídeo por um ganho que já foi obtido.                  */
    this.cache = [];
    this.cacheMax = 4;
    this.stats = { passes: 0, camadas: 0, cacheOk: 0, cacheMiss: 0 };

    var info = gl.getExtension('WEBGL_debug_renderer_info');
    this.gpu = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'WEBGL2';
  }

  Renderer.prototype.mkTex = function () {
    var gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  Renderer.prototype.mkTarget = function () {
    var gl = this.gl;
    var tex = this.mkTex();
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex: tex, fb: fb };
  };

  Renderer.prototype.setSize = function (w, h) {
    w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h));
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h;
    this.canvas.width = w; this.canvas.height = h;
    var gl = this.gl;
    var all = [this.fbo[0], this.fbo[1], this.aux, this.clipA, this.clipB, this.matteT]
      .concat(this.mp).concat(this.ring)
      .concat(this.cache.map(function (c) { return c.alvo; }));
    this.cache.forEach(function (c) { c.sig = null; });
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    for (var i = 0; i < all.length; i++) {
      gl.bindTexture(gl.TEXTURE_2D, all[i].tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    this.realocarRingF();
  };

  Renderer.prototype.compile = function (src, type) {
    var gl = this.gl, s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('shader:\n' + gl.getShaderInfoLog(s) + '\n' +
        src.split('\n').map(function (l, i) { return (i + 1) + ': ' + l; }).join('\n'));
      gl.deleteShader(s); return null;
    }
    return s;
  };

  Renderer.prototype.build = function (key, fsSrc) {
    var gl = this.gl;
    if (this.programs[key]) return this.programs[key];
    var vs = this.compile(VERT, gl.VERTEX_SHADER);
    var fs = this.compile(fsSrc, gl.FRAGMENT_SHADER);
    if (!vs || !fs) { this.programs[key] = null; return null; }
    var p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('link ' + key + ': ' + gl.getProgramInfoLog(p));
      this.programs[key] = null; return null;
    }
    gl.deleteShader(vs); gl.deleteShader(fs);
    var obj = { p: p, u: {} };
    var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var info = gl.getActiveUniform(p, i);
      obj.u[info.name] = gl.getUniformLocation(p, info.name);
      /* um uniforme de vetor é reportado como `uM0[0]`. Guardar também sob
         `uM0` evita que cada chamada tenha de lembrar do sufixo.        */
      if (info.name.slice(-3) === '[0]') obj.u[info.name.slice(0, -3)] = obj.u[info.name];
    }
    this.programs[key] = obj;
    return obj;
  };

  Renderer.prototype.progFor = function (fxId) {
    if (this.programs[fxId] !== undefined) return this.programs[fxId];
    var def = VE.FXBY[fxId];
    if (!def) { this.programs[fxId] = null; return null; }
    var decl = [];
    def.params.forEach(function (p) {
      if (p.uni === false || p.t === 'txt') return;
      decl.push('uniform ' + (p.t === 'c' ? 'vec3' : 'float') + ' u_' + p.k + ';');
    });
    /* `pre` é um trecho GLSL compartilhado por vários efeitos (por exemplo o
       seletor de quadro da família TEMPO). Entra antes do corpo do efeito. */
    var main = (def.passes > 1) ? VE.MAINP : (def.alpha ? VE.MAIN4 : VE.MAIN);
    var src = VE.PRELUDE + '\n' + decl.join('\n') + '\n' +
      (def.pre ? def.pre + '\n' : '') + def.glsl + '\n' + main;
    return this.build(fxId, src);
  };

  /* ---------- texturas de fonte ---------- */
  Renderer.prototype.tex = function (key) {
    if (!this.textures[key]) this.textures[key] = this.mkTex();
    return this.textures[key];
  };

  Renderer.prototype.dropTex = function (key) {
    if (this.textures[key]) { this.gl.deleteTexture(this.textures[key]); delete this.textures[key]; }
    delete this.texOk[key];
  };

  Renderer.prototype.upload = function (key, source, flip) {
    var gl = this.gl;
    var t = this.tex(key);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip !== false);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } catch (e) { return null; }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.texOk[key] = 1;
    return t;
  };

  /* O último quadro bom desta fonte, ou nada se ela ainda não desenhou
     uma vez. Quem usa: a montagem do plano, enquanto o <video> busca. */
  Renderer.prototype.texUltima = function (key) {
    return this.texOk[key] ? this.textures[key] : null;
  };

  /* ---------- atlas de caracteres (ASCII) ---------- */
  var FONTS = ['ui-monospace, monospace', '"Courier New", Courier, monospace',
    'Consolas, "Lucida Console", monospace', '"Archivo", Arial, sans-serif', 'Georgia, serif'];

  Renderer.prototype.atlasFor = function (chars, fontIdx, bold) {
    chars = (chars && chars.length) ? chars : ' .:oO@';
    var arr = Array.from(chars);
    if (arr.length > 96) arr = arr.slice(0, 96);
    var key = fontIdx + '|' + (bold ? 1 : 0) + '|' + arr.join('');
    if (this.atlases[key]) return this.atlases[key];
    var CELL = 32, count = arr.length;
    var cols = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / cols);
    var cv = document.createElement('canvas');
    cv.width = cols * CELL; cv.height = rows * CELL;
    var c = cv.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = (bold ? 'bold ' : '') + Math.round(CELL * 0.82) + 'px ' + (FONTS[fontIdx | 0] || FONTS[0]);
    for (var i = 0; i < count; i++) {
      c.fillText(arr[i], (i % cols) * CELL + CELL / 2, Math.floor(i / cols) * CELL + CELL / 2 + 1);
    }
    var gl = this.gl, tex = this.mkTex();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    var a = { tex: tex, count: count, cols: cols, rows: rows };
    this.atlases[key] = a;
    return a;
  };

  /* ---------- atlas de EMOJI, com tabela de cor ----------
     Diferente do atlas de ascii em três pontos, e são os três que fazem o
     mosaico parecer a foto em vez de parecer texto colorido:

     1. o fundo fica TRANSPARENTE e as figuras entram com a cor delas —
        o shader não pinta nada, só compõe;
     2. cada figura tem a COR MÉDIA medida de volta do canvas;
     3. dessas médias sai uma tabela 16×16×16 (cor → figura mais parecida),
        para o shader escolher com uma leitura em vez de percorrer a lista.

     A comparação é feita em OKLab, não em RGB: em RGB o azul escuro e o
     verde escuro "distam" pouco e o mosaico embaralha os dois.

     A fonte é a do sistema. Num Mac ou iPhone o desenho é literalmente o
     da Apple; no Windows é o da Microsoft. Nenhuma fonte de emoji pode ser
     embutida aqui — são obras protegidas de terceiros.                  */
  var EMOJIFONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",' +
    '"Twemoji Mozilla","EmojiOne Color",sans-serif';

  /* separa por GRAFEMA: 👨‍👩‍👧 é um emoji só, e Array.from o quebraria em cinco */
  VE.grafemas = function (txt) {
    txt = txt || '';
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        var seg = new Intl.Segmenter('pt', { granularity: 'grapheme' });
        return Array.from(seg.segment(txt), function (s) { return s.segment; })
          .filter(function (s) { return s.trim() !== ''; });
      } catch (e) { }
    }
    return Array.from(txt).filter(function (s) { return s.trim() !== ''; });
  };

  /* sRGB → OKLab (só o que precisamos: comparar distância percebida) */
  function oklab(r, g, b) {
    function lin(u) { u /= 255; return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); }
    var R = lin(r), G = lin(g), B = lin(b);
    var l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    var m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    var s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    ];
  }

  Renderer.prototype.atlasEmoji = function (lista, pesoBrilho, pilha) {
    var arr = lista.slice(0, 64);
    if (!arr.length) arr = ['⬛'];
    var pw = Math.round(Math.max(0.2, Math.min(3, pesoBrilho === undefined ? 1 : pesoBrilho)) * 10) / 10;
    var fonte = pilha || EMOJIFONT;
    var key = 'E|' + pw + '|' + fonte + '|' + arr.join('');
    if (this.atlases[key]) return this.atlases[key];

    var CELL = 48, count = arr.length;
    var cols = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / cols);
    var cv = document.createElement('canvas');
    cv.width = cols * CELL; cv.height = rows * CELL;
    var c = cv.getContext('2d', { willReadFrequently: true });
    c.clearRect(0, 0, cv.width, cv.height);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    /* 0.78 da célula deixa uma borda: sem ela o filtro linear puxa cor da
       figura vizinha e cada peça do mosaico ganha uma auréola errada. */
    c.font = Math.round(CELL * 0.78) + 'px ' + fonte;
    for (var i = 0; i < count; i++) {
      c.fillText(arr[i], (i % cols) * CELL + CELL / 2, Math.floor(i / cols) * CELL + CELL / 2);
    }

    /* --- cor média de cada figura, ponderada pela cobertura --- */
    var img = c.getImageData(0, 0, cv.width, cv.height).data;
    var meias = [], usados = [];
    for (i = 0; i < count; i++) {
      var ox = (i % cols) * CELL, oy = Math.floor(i / cols) * CELL;
      var sr = 0, sg = 0, sb = 0, sa = 0;
      for (var y = 0; y < CELL; y += 2) {
        var lin0 = ((oy + y) * cv.width + ox) * 4;
        for (var x = 0; x < CELL; x += 2) {
          var o = lin0 + x * 4, a = img[o + 3] / 255;
          sr += img[o] * a; sg += img[o + 1] * a; sb += img[o + 2] * a; sa += a;
        }
      }
      /* figura que não desenhou nada (emoji ausente na fonte) sai da lista:
         deixá-la dentro criaria buracos transparentes no mosaico.        */
      if (sa < 4) continue;
      var col = [sr / sa, sg / sa, sb / sa];
      meias.push({ idx: i, lab: oklab(col[0], col[1], col[2]) });
      usados.push(i);
    }
    if (!meias.length) meias.push({ idx: 0, lab: [0, 0, 0] });

    /* --- tabela cor → figura, 16³ achatado em 256×16 --- */
    var lut = new Uint8Array(256 * 16 * 4);
    for (var b16 = 0; b16 < 16; b16++) {
      for (var g16 = 0; g16 < 16; g16++) {
        for (var r16 = 0; r16 < 16; r16++) {
          var alvo = oklab(r16 * 17, g16 * 17, b16 * 17);
          var melhor = 0, dmin = 1e9;
          for (var k = 0; k < meias.length; k++) {
            var L = meias[k].lab;
            var dl = (alvo[0] - L[0]) * pw, da = alvo[1] - L[1], db = alvo[2] - L[2];
            var d = dl * dl + da * da + db * db;
            if (d < dmin) { dmin = d; melhor = meias[k].idx; }
          }
          var p = ((g16 * 256) + (r16 + b16 * 16)) * 4;
          lut[p] = melhor; lut[p + 1] = 0; lut[p + 2] = 0; lut[p + 3] = 255;
        }
      }
    }

    var gl = this.gl;
    var tex = this.mkTex();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);

    var lt = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lt);
    /* a tabela é um índice, não uma cor: interpolar aqui inventaria
       figuras que não existem. NEAREST não é detalhe, é obrigatório. */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 256, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, lut);

    var a = { tex: tex, count: count, cols: cols, rows: rows, total: rows, lut: lt, usados: usados };
    this.atlases[key] = a;
    return a;
  };

  /* ---------- de quem é o atlas ----------
     Antes o motor perguntava `id === 'ascii'` em dois lugares. Agora
     pergunta ao próprio efeito: quem declara `atlas` na definição ganha
     um, e nenhum outro arquivo precisa saber que ele existe.           */
  Renderer.prototype.atlasPara = function (fxDef) {
    var def = VE.FXBY[fxDef.id];
    if (!def || !def.atlas) return null;
    try { return def.atlas.call(this, fxDef.params || {}, fxDef); }
    catch (e) { return null; }
  };

  VE.sortByInk = function (chars, fontIdx, bold) {
    var arr = Array.from(chars).filter(function (c, i, a) { return a.indexOf(c) === i; });
    var CELL = 24;
    var cv = document.createElement('canvas');
    cv.width = CELL; cv.height = CELL;
    var c = cv.getContext('2d', { willReadFrequently: true });
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = (bold ? 'bold ' : '') + Math.round(CELL * 0.82) + 'px ' + (FONTS[fontIdx | 0] || FONTS[0]);
    var scored = arr.map(function (ch) {
      c.fillStyle = '#000'; c.fillRect(0, 0, CELL, CELL);
      c.fillStyle = '#fff'; c.fillText(ch, CELL / 2, CELL / 2);
      var d = c.getImageData(0, 0, CELL, CELL).data, s = 0;
      for (var i = 0; i < d.length; i += 4) s += d[i];
      return { ch: ch, ink: s };
    });
    scored.sort(function (a, b) { return a.ink - b.ink; });
    return scored.map(function (o) { return o.ch; }).join('');
  };

  /* ---------- memória de quadros ----------
     Liga uPrev (t-1) e uH2/uH3/uH4 (t-2, t-3, t-4) nas unidades 1, 3, 4 e 5.
     A unidade 2 continua sendo o atlas de caracteres.
     Também entrega uAudio: nível, grave, médio e agudo do quadro atual,
     para quem quiser um efeito que responda ao som.                       */
  Renderer.prototype.histTex = function (n) {
    /* n = 1..4 quadros para trás */
    return this.ring[(this.ringIdx + (4 - (n % 4))) % 4].tex;
  };

  Renderer.prototype.bindHistory = function (p, daFonte) {
    var gl = this.gl;
    var self = this;
    var hist = daFonte ? function (n) { return self.histTexF(n); }
      : function (n) { return self.histTex(n); };
    if (p.u.uPrev) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, hist(1));
      gl.uniform1i(p.u.uPrev, 1);
    }
    if (p.u.uH2) {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, hist(2));
      gl.uniform1i(p.u.uH2, 3);
    }
    if (p.u.uH3) {
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, hist(3));
      gl.uniform1i(p.u.uH3, 4);
    }
    if (p.u.uH4) {
      gl.activeTexture(gl.TEXTURE5);
      gl.bindTexture(gl.TEXTURE_2D, hist(4));
      gl.uniform1i(p.u.uH4, 5);
    }
    if (p.u.uAudio) {
      var a = VE.reactive || {};
      gl.uniform4f(p.u.uAudio, a.level || 0, a.bass || 0, a.mid || 0, a.treble || 0);
    }
    if (p.u.uStab) {
      var s = (VE.stab && VE.stab.value) ? VE.stab.value() : null;
      gl.uniform3f(p.u.uStab, s ? s.x : 0, s ? s.y : 0, s ? s.conf : 0);
      /* só a prévia principal pede a medição. A galeria de filtros tem um
         renderizador próprio e não pode ligar a leitura de volta.        */
      if (VE.stab && this === VE.renderer) VE.stab.wanted = true;
    }
  };

  /* fecha o quadro: o resultado entra no anel e o índice gira */
  /* ------------------------------------------- A MEMÓRIA DA FONTE
     Um anel de quatro vagas cobre 66 milésimos a 60 quadros por segundo.
     Para uma colagem em tiras isso é NADA: as quatro lembranças caem no
     mesmo piscar e a colagem parece um corte, não duas fotos.

     A primeira saída foi girar o anel de N em N quadros. Cobria segundos
     e custava a fluidez, por aritmética e não por bug: se o anel só gira
     a cada 13 quadros, a tira atrasada só troca de imagem 3 vezes por
     segundo. Medido, e é exatamente o travamento que aparecia na tela.

     A saída certa é separar as duas coisas que estavam no mesmo número:

       distHist  DISTÂNCIA de leitura — quantos quadros separam uma
                 lembrança da seguinte. É o que dá o tempo.
       subHist   de quantos em quantos quadros um é GUARDADO. É o que
                 tira a fluidez, então queremos 1.

     Com V vagas e quatro níveis de lembrança, a distância pedida cabe
     inteira quando 4·dist <= V-1. Daí `subHist = ceil(4·dist/(V-1))`: só
     sobe quando não há vaga, e cada vaga a mais o empurra para baixo.

     E as vagas saem baratas porque o anel vive em MEIA RESOLUÇÃO — quem
     lê daqui lê em tira estreita. Dezesseis vagas a 960×540 custam os
     mesmos 33 MB que quatro a 1920×1080 custavam.

       vagas   sub com dist 13    trocas por segundo
        4              4                 5        (era isto)
       16              4                15
       32              2                30
       64              1                60                              */
  Renderer.prototype.dimHistF = function () {
    var e = this.escalaF || 0.5;
    return { w: Math.max(2, Math.round(this.w * e)), h: Math.max(2, Math.round(this.h * e)) };
  };

  Renderer.prototype.delTarget = function (t) {
    if (!t) return;
    var gl = this.gl;
    if (t.tex) gl.deleteTexture(t.tex);
    if (t.fb) gl.deleteFramebuffer(t.fb);
  };

  /* devolve o anel com o número de vagas pedido, no tamanho de hoje.
     Refaz só quando um dos dois muda — e refazer perde o conteúdo, que
     é o certo: lembrança de outro tamanho não é a mesma lembrança.  */
  Renderer.prototype.garantirRingF = function (vagas) {
    vagas = Math.max(4, Math.min(64, (vagas | 0) || this.vagasPedidas || 4));
    var d = this.dimHistF();
    if (this.ringF && this.vagasF === vagas && this.ringFW === d.w && this.ringFH === d.h) return this.ringF;
    var gl = this.gl, i;
    if (this.ringF) for (i = 0; i < this.ringF.length; i++) this.delTarget(this.ringF[i]);
    this.ringF = [];
    for (i = 0; i < vagas; i++) this.ringF.push(this.mkTarget());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    for (i = 0; i < vagas; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.ringF[i].tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, d.w, d.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    this.vagasF = vagas; this.ringFW = d.w; this.ringFH = d.h;
    this.ringFIdx = 0; this.histTickF = 0;
    return this.ringF;
  };

  /* chamada pelo setSize: se o anel existe, refaz no tamanho novo */
  Renderer.prototype.realocarRingF = function () {
    if (this.ringF) this.garantirRingF(this.vagasF);
  };

  /* uma vez por quadro, e no sub-passo pedido */
  Renderer.prototype.pushHistFonte = function (tex, marcaQuadro) {
    if (this.fonteNoQuadro === marcaQuadro) return;
    this.fonteNoQuadro = marcaQuadro;
    var anel = this.garantirRingF(this.vagasPedidas);
    var sub = Math.max(1, this.subHist | 0);
    this.histTickF = (this.histTickF || 0) + 1;
    if (sub > 1 && (this.histTickF % sub) !== 0) return;
    /* `downsample` e não `pass`: `pass` fixa o viewport no tamanho do
       render, e escrever com viewport grande num alvo pequeno guarda o
       canto de baixo da imagem em vez da imagem.                      */
    this.downsample(tex, anel[this.ringFIdx], this.ringFW, this.ringFH);
    this.ringFIdx = (this.ringFIdx + 1) % anel.length;
  };

  /* `n` é o NÍVEL da lembrança (1 a 4), não a vaga. A vaga sai da
     distância pedida convertida para passos do anel.                */
  Renderer.prototype.histTexF = function (n) {
    var anel = this.garantirRingF(this.vagasPedidas);
    var V = anel.length;
    var sub = Math.max(1, this.subHist | 0);
    /* `Math.max(n, ...)` garante que os quatro níveis caiam em vagas
       DISTINTAS mesmo quando o anel está apertado: sem ele, distância 13
       com quatro vagas manda os níveis 1 e 2 para a mesma vaga e duas
       tiras vizinhas mostram o mesmo instante. Medido.
       O teto é V e não V-1 porque a vaga V é a vaga 0 — a mais antiga,
       que é exatamente o que se quer quando não há mais lembrança.  */
    var vaga = Math.min(V, Math.max(n, Math.round(n * Math.max(1, this.distHist | 0) / sub)));
    return anel[((this.ringFIdx - vaga) % V + V) % V].tex;
  };

  /* O anel COMPOSTO guarda todo quadro, sempre. Ele serve ao eco e ao
     borrão, que são realimentação e querem o quadro imediatamente
     anterior; espaçá-lo era efeito colateral de um número compartilhado
     com a memória da fonte, e estragava o eco de quem estivesse no
     mesmo quadro que uma colagem em tiras.                            */
  Renderer.prototype.pushHistory = function (srcFb) {
    var gl = this.gl;
    var slot = this.ring[this.ringIdx];
    gl.bindFramebuffer(gl.FRAMEBUFFER, srcFb);
    gl.bindTexture(gl.TEXTURE_2D, slot.tex);
    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, this.w, this.h);
    this.ringIdx = (this.ringIdx + 1) % 4;
    this.prev = this.ring[(this.ringIdx + 3) % 4];
  };

  /* O passo é pedido pelos EFEITOS presentes no quadro: quem declara
     `hist` na definição diz de quantos em quantos quer guardar, e o
     maior pedido vence. Assim ninguém precisa mexer num ajuste global. */
  Renderer.prototype.ajustarPassoHist = function (plano) {
    var dist = 1, vagas = 4;
    (plano || []).forEach(function (op) {
      (op.effects || []).forEach(function (e) {
        var def = VE.FXBY[e.id];
        if (!def) return;
        var p = e.params || {};
        if (def.hist) { var d = def.hist(p); if (d > dist) dist = d; }
        if (def.vagas) { var v = def.vagas(p); if (v > vagas) vagas = v; }
      });
    });
    this.vagasPedidas = vagas;
    /* divide por V e não por V-1: a vaga V É a vaga 0, a mais antiga,
       e ela vale como lembrança. Reservá-la fazia o caso mais simples
       de todos — sem efeito nenhum, distância 1 — pedir sub 2 e pular
       um quadro a troco de nada.                                    */
    var sub = Math.max(1, Math.ceil((4 * dist) / Math.max(1, vagas)));
    if (dist !== this.distHist || sub !== this.subHist) {
      this.distHist = dist; this.subHist = sub; this.histTickF = 0;
    }
  };

  /* ---------- passes ---------- */
  Renderer.prototype.pass = function (prog, inputTex, target, setup) {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(prog.p);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTex);
    if (prog.u.uTex) gl.uniform1i(prog.u.uTex, 0);
    if (setup) setup(prog);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* desenha uma textura num alvo PEQUENO — usado pelo analisador do
     estabilizador, que precisa de uma versão minúscula do quadro para
     medir o tremor sem custo.                                          */
  Renderer.prototype.downsample = function (srcTex, target, w, h) {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
    gl.viewport(0, 0, w, h);
    gl.useProgram(this.copyProg.p);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    if (this.copyProg.u.uTex) gl.uniform1i(this.copyProg.u.uTex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  Renderer.prototype.clearTarget = function (target, r, g, b, a) {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(r || 0, g || 0, b || 0, a === undefined ? 0 : a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  /* ---------- render de um frame completo ----------
     layers: [{ tex, rect:{x,y,w,h}, angle, opacity, blend, flipX, flipY, crop }]
     clips : [{ id, params, mask, amount, local }]
  */
  Renderer.prototype.render = function (layers, clips, time, opts) {
    var gl = this.gl, self = this;
    opts = opts || {};
    var aspect = this.w / this.h;

    /* 1. composição das camadas de mídia */
    this.clearTarget(this.fbo[0], 0, 0, 0, 0);
    var base = 0;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      if (!L || !L.tex) continue;
      var src = this.fbo[base], dst = this.fbo[1 - base];
      /* eslint-disable no-loop-func */
      (function (L, src) {
        self.pass(self.compProg, L.tex, dst, function (p) {
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, src.tex);
          gl.uniform1i(p.u.uBack, 1);
          gl.uniform4f(p.u.uRect, L.rect.x, L.rect.y, L.rect.w, L.rect.h);
          gl.uniform1f(p.u.uAngle, (L.angle || 0) * Math.PI / 180);
          gl.uniform1f(p.u.uOpacity, L.opacity === undefined ? 1 : L.opacity);
          gl.uniform1f(p.u.uBlend, L.blend || 0);
          gl.uniform1f(p.u.uAspect, aspect);
          gl.uniform2f(p.u.uFlip, L.flipX ? 1 : 0, L.flipY ? 1 : 0);
          var cr = L.crop || { x: 0, y: 0, w: 1, h: 1 };
          gl.uniform4f(p.u.uCrop, cr.x, cr.y, cr.w, cr.h);
        });
      })(L, src);
      base = 1 - base;
    }

    var inputTex = this.fbo[base].tex;
    var cur = 1 - base;
    this.ready = true;

    if (opts.bypass) {
      this.pass(this.copyProg, inputTex, null, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return;
    }

    /* 2. cadeia de efeitos */
    for (var k = 0; k < clips.length; k++) {
      var cl = clips[k];
      var prog = this.progFor(cl.id);
      if (!prog) continue;
      var def = VE.FXBY[cl.id];
      var target = this.fbo[cur];
      var atlas = this.atlasPara(cl);
      var defFonte = !!(def && def.histFonte);
      if (defFonte) this.pushHistFonte(inputTex, this.marcaQuadro || 0);
      (function (cl, def, atlas, inTex, target) {
        self.pass(prog, inTex, target, function (p) {
          if (p.u.uRes) gl.uniform2f(p.u.uRes, self.w, self.h);
          if (p.u.uTime) gl.uniform1f(p.u.uTime, time);
          if (p.u.uLocal) gl.uniform1f(p.u.uLocal, cl.local);
          if (p.u.uAmount) gl.uniform1f(p.u.uAmount, cl.amount);
          if (p.u.uAspect) gl.uniform1f(p.u.uAspect, aspect);
          var m = cl.mask || {};
          if (p.u.uMaskA) gl.uniform4f(p.u.uMaskA, m.x != null ? m.x : 0.5, m.y != null ? m.y : 0.5,
            m.w != null ? m.w : 0.5, m.h != null ? m.h : 0.5);
          if (p.u.uMaskB) gl.uniform4f(p.u.uMaskB, (m.ang || 0) * Math.PI / 180,
            m.feather != null ? m.feather : 0.1, m.invert ? 1 : 0, m.shape || 0);
          self.bindHistory(p, defFonte);
          if (atlas && p.u.uAtlas) {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, atlas.tex);
            gl.uniform1i(p.u.uAtlas, 2);
            if (p.u.uAtlasInfo) gl.uniform4f(p.u.uAtlasInfo, atlas.count, atlas.cols, atlas.rows, atlas.total || atlas.rows);
            if (atlas.lut && p.u.uPalLut) {
              gl.activeTexture(gl.TEXTURE7);
              gl.bindTexture(gl.TEXTURE_2D, atlas.lut);
              gl.uniform1i(p.u.uPalLut, 7);
            }
          }
          def.params.forEach(function (pr) {
            if (pr.uni === false || pr.t === 'txt') return;
            var loc = p.u['u_' + pr.k];
            if (!loc) return;
            var v = cl.params[pr.k];
            if (v === undefined) v = pr.def;
            if (pr.t === 'c') { var rgb = hex2rgb(v); gl.uniform3f(loc, rgb[0], rgb[1], rgb[2]); }
            else gl.uniform1f(loc, typeof v === 'number' ? v : parseFloat(v) || 0);
          });
        });
      })(cl, def, atlas, inputTex, target);
      inputTex = target.tex;
      cur = 1 - cur;
    }

    /* 3. guarda o frame na memória de quadros (rastro, eco, tempo) */
    var lastFb = (inputTex === this.fbo[0].tex) ? this.fbo[0] : this.fbo[1];
    this.pushHistory(lastFb.fb);

    /* 4. tela */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.pass(this.copyProg, inputTex, null, null);
  };

  /* ================================================== PLANO DE COMPOSIÇÃO ====
     O motor deixou de receber "camadas + uma cadeia global" e passou a
     receber um PLANO: uma lista ordenada de operações, da base para o topo.

       { kind:'clip',   tex, rect, angle, opacity, blend, flipX, flipY,
                          crop, effects:[...] }
       { kind:'adjust', effects:[...] }

     Um clipe SEM efeitos é composto direto (uma passada).
     Um clipe COM efeitos é desenhado sozinho num quadro transparente, passa
     pela cadeia dele e só depois é misturado — assim o efeito pertence ao
     clipe e não contamina o resto do quadro.
     Uma operação de AJUSTE roda a cadeia sobre a composição inteira montada
     até ali: é exatamente o alcance de uma adjustment layer.              */

  Renderer.prototype.fxPass = function (fxDef, inTex, target, time) {
    var gl = this.gl, self = this;
    var prog = this.progFor(fxDef.id);
    if (!prog) return false;
    var def = VE.FXBY[fxDef.id];
    if (!def) return false;
    var atlas = this.atlasPara(fxDef);
    var aspect = this.w / this.h;
    /* efeito que quer ver OUTRO MOMENTO recebe a memória da FONTE, e é
       aqui que ela é alimentada: `inTex` é a imagem como ela entrou. */
    var daFonte = !!def.histFonte;
    if (daFonte) this.pushHistFonte(inTex, this.marcaQuadro || 0);

    /* REGIÃO POR TRAÇADO: o contorno chega em vértices com alça, é picado
       em segmentos aqui (uma vez por efeito, não uma por passada) e sobe
       para a MESMA textura de pontos que a máscara de camada usa. Se não
       couber ou não fechar, a região volta a ser TUDO — melhor efeito no
       quadro inteiro que recorte errado.                              */
    var POOL = (VE.MASK_POOL_PTS || 256);
    var mk = fxDef.mask || {}, ptsFx = null, nPtsFx = 0;
    if ((mk.shape | 0) === (VE.MASK_FX_PATH || 5) && mk.pts && mk.pts.length >= 3) {
      var achatadoFx = VE.maskTesselar(mk.pts, aspect, POOL);
      var cabeFx = achatadoFx.length >> 1;
      if (cabeFx >= 3) {
        ptsFx = new Float32Array(POOL * 4);
        for (var kf = 0; kf < cabeFx; kf++) {
          ptsFx[kf * 4] = achatadoFx[kf * 2];
          ptsFx[kf * 4 + 1] = achatadoFx[kf * 2 + 1];
        }
        nPtsFx = cabeFx;
      }
    }
    var formaFx = ((mk.shape | 0) === (VE.MASK_FX_PATH || 5) && !nPtsFx) ? 0 : (mk.shape || 0);

    /* uma passada do efeito. `src` é o que ele lê, `orig` é sempre a imagem
       que entrou na cadeia — nas passadas intermediárias de um efeito de
       várias passadas, `src` já é um buffer de trabalho e não a imagem.  */
    function uma(src, target, passIdx, passes) {
      self.pass(prog, src, target, function (p) {
        if (p.u.uRes) gl.uniform2f(p.u.uRes, self.w, self.h);
        if (p.u.uTime) gl.uniform1f(p.u.uTime, time);
        if (p.u.uLocal) gl.uniform1f(p.u.uLocal, fxDef.local || 0);
        if (p.u.uAmount) gl.uniform1f(p.u.uAmount, fxDef.amount === undefined ? 1 : fxDef.amount);
        if (p.u.uAspect) gl.uniform1f(p.u.uAspect, aspect);
        if (p.u.uPass) gl.uniform1f(p.u.uPass, passIdx);
        if (p.u.uPasses) gl.uniform1f(p.u.uPasses, passes);
        if (p.u.uOrig) {
          gl.activeTexture(gl.TEXTURE6);
          gl.bindTexture(gl.TEXTURE_2D, inTex);
          gl.uniform1i(p.u.uOrig, 6);
        }
        var m = fxDef.mask || {};
        if (p.u.uMaskA) gl.uniform4f(p.u.uMaskA, m.x != null ? m.x : 0.5, m.y != null ? m.y : 0.5,
          m.w != null ? m.w : 0.5, m.h != null ? m.h : 0.5);
        if (p.u.uMaskB) gl.uniform4f(p.u.uMaskB, (m.ang || 0) * Math.PI / 180,
          m.feather != null ? m.feather : 0.1, m.invert ? 1 : 0, formaFx);
        if (nPtsFx && p.u.uMaskPts) {
          gl.activeTexture(gl.TEXTURE8);
          gl.bindTexture(gl.TEXTURE_2D, self.texPontos(ptsFx, POOL));
          gl.uniform1i(p.u.uMaskPts, 8);
          if (p.u.uMaskC) gl.uniform4f(p.u.uMaskC, 0, nPtsFx, 0, 0);
        }
        self.bindHistory(p, daFonte);
        if (atlas && p.u.uAtlas) {
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, atlas.tex);
          gl.uniform1i(p.u.uAtlas, 2);
          if (p.u.uAtlasInfo) gl.uniform4f(p.u.uAtlasInfo, atlas.count, atlas.cols, atlas.rows, atlas.total || atlas.rows);
          if (atlas.lut && p.u.uPalLut) {
            gl.activeTexture(gl.TEXTURE7);
            gl.bindTexture(gl.TEXTURE_2D, atlas.lut);
            gl.uniform1i(p.u.uPalLut, 7);
          }
        }
        def.params.forEach(function (pr) {
          if (pr.uni === false || pr.t === 'txt') return;
          var loc = p.u['u_' + pr.k];
          if (!loc) return;
          var v = fxDef.params[pr.k];
          if (v === undefined) v = pr.def;
          if (pr.t === 'c') { var rgb = hex2rgb(v); gl.uniform3f(loc, rgb[0], rgb[1], rgb[2]); }
          else gl.uniform1f(loc, typeof v === 'number' ? v : parseFloat(v) || 0);
        });
      });
    }

    /* ------------------------------------------------- VÁRIAS PASSADAS
       Um efeito pode declarar `passes: N`. O motor roda o mesmo shader N
       vezes, alternando entre dois quadros de trabalho, e diz a ele em
       qual passada está (`uPass`) e quantas são (`uPasses`). A imagem que
       entrou continua acessível em `uOrig` do começo ao fim.

       É o que permite alcance grande com poucas amostras: cada passada
       multiplica o passo, então quatro passadas de quatro amostras
       cobrem 256 posições — e nenhum ponto de luz cai no vão.          */
    var N = def.passes | 0;
    if (N > 1) {
      var src = inTex;
      for (var i = 0; i < N; i++) {
        var dst = (i === N - 1) ? target : this.mp[i & 1];
        uma(src, dst, i, N);
        src = dst.tex;
      }
      return true;
    }
    uma(inTex, target, 0, 1);
    return true;
  };

  /* ======================================================= POSICIONAR E COMPOR
     Uma passada do shader de composição. Ela faz DUAS coisas conforme quem
     chama: quando `L.rect` é o retângulo do clipe, ela DESENHA a fonte no
     lugar dela dentro do quadro; quando `L.rect` é o quadro inteiro, ela
     MISTURA uma camada já pronta sobre o que estava embaixo.

     Os campos extras (`fill`, `espaco`, `desmult`, `matteModo`, `blendIf`)
     são opcionais. Sem eles o shader corre pelo caminho neutro, que é
     exatamente o que ele fazia antes de existir composição por camadas. */
  Renderer.prototype.placePass = function (L, backTex, target) {
    var gl = this.gl, self = this, aspect = this.w / this.h;
    this.stats.passes++;
    this.pass(this.compProg, L.tex, target, function (p) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, backTex);
      gl.uniform1i(p.u.uBack, 1);
      /* o matte fica na unidade 7 — as de 0 a 6 já têm dono */
      gl.activeTexture(gl.TEXTURE7);
      gl.bindTexture(gl.TEXTURE_2D, self.matteT.tex);
      if (p.u.uMatte) gl.uniform1i(p.u.uMatte, 7);
      gl.uniform4f(p.u.uRect, L.rect.x, L.rect.y, L.rect.w, L.rect.h);
      gl.uniform1f(p.u.uAngle, (L.angle || 0) * Math.PI / 180);
      gl.uniform1f(p.u.uOpacity, L.opacity === undefined ? 1 : L.opacity);
      gl.uniform1f(p.u.uBlend, L.blend || 0);
      gl.uniform1f(p.u.uAspect, aspect);
      gl.uniform2f(p.u.uFlip, L.flipX ? 1 : 0, L.flipY ? 1 : 0);
      var cr = L.crop || { x: 0, y: 0, w: 1, h: 1 };
      gl.uniform4f(p.u.uCrop, cr.x, cr.y, cr.w, cr.h);
      /* ---- composição por camadas ---- */
      gl.uniform1f(p.u.uFill, L.fill === undefined ? 1 : L.fill);
      gl.uniform1i(p.u.uLinear, L.espaco ? 1 : 0);
      gl.uniform1i(p.u.uDesmult, L.desmult ? 1 : 0);
      gl.uniform1i(p.u.uMatteModo, L.matteModo || 0);
      var bi = L.blendIf;
      gl.uniform1i(p.u.uIfOn, bi ? 1 : 0);
      gl.uniform1i(p.u.uIfCh, bi ? (bi.ch | 0) : 0);
      if (bi) {
        gl.uniform4f(p.u.uIfEsta, bi.esta[0], bi.esta[1], bi.esta[2], bi.esta[3]);
        gl.uniform4f(p.u.uIfFundo, bi.fundo[0], bi.fundo[1], bi.fundo[2], bi.fundo[3]);
      } else {
        gl.uniform4f(p.u.uIfEsta, 0, 0, 1, 1);
        gl.uniform4f(p.u.uIfFundo, 0, 0, 1, 1);
      }
    });
  };

  /* ------------------------------------------------------------ COR E CANAIS
     Correção de cor e misturador de canais numa passada só. Só é chamada
     quando `resolveLayer` decidiu que há algo diferente de neutro — não
     existe "passada de identidade" neste motor.                        */
  Renderer.prototype.gradePass = function (L, inTex, target) {
    var gl = this.gl, self = this;
    if (!this.gradeProg) return false;
    var c = L.cor, k = L.canais;
    this.stats.passes++;
    this.pass(this.gradeProg, inTex, target, function (p) {
      gl.uniform1f(p.u.uAspect, self.w / self.h);
      gl.uniform1i(p.u.uUsaCor, c ? 1 : 0);
      gl.uniform1i(p.u.uUsaCanais, k ? 1 : 0);
      if (c) {
        gl.uniform1f(p.u.uExpo, c.expo); gl.uniform1f(p.u.uContraste, c.contraste);
        gl.uniform1f(p.u.uGama, c.gama); gl.uniform1f(p.u.uSat, c.sat);
        gl.uniform1f(p.u.uVibr, c.vibr); gl.uniform1f(p.u.uMatiz, c.matiz);
        gl.uniform1f(p.u.uTemp, c.temp); gl.uniform1f(p.u.uTinte, c.tinte);
        gl.uniform1f(p.u.uAltas, c.altas); gl.uniform1f(p.u.uBaixas, c.baixas);
        gl.uniform1f(p.u.uBrancos, c.brancos); gl.uniform1f(p.u.uPretos, c.pretos);
        gl.uniform4f(p.u.uNiveis, c.entLo, c.entHi, c.saiLo, c.saiHi);
      } else {
        gl.uniform1f(p.u.uExpo, 0); gl.uniform1f(p.u.uContraste, 0);
        gl.uniform1f(p.u.uGama, 1); gl.uniform1f(p.u.uSat, 0);
        gl.uniform1f(p.u.uVibr, 0); gl.uniform1f(p.u.uMatiz, 0);
        gl.uniform1f(p.u.uTemp, 0); gl.uniform1f(p.u.uTinte, 0);
        gl.uniform1f(p.u.uAltas, 0); gl.uniform1f(p.u.uBaixas, 0);
        gl.uniform1f(p.u.uBrancos, 0); gl.uniform1f(p.u.uPretos, 0);
        gl.uniform4f(p.u.uNiveis, 0, 1, 0, 1);
      }
      if (k) {
        /* mat3 em WebGL é por COLUNA: a primeira coluna é o que o vermelho
           de ENTRADA espalha nas três saídas.                            */
        gl.uniformMatrix3fv(p.u.uMix, false, new Float32Array([
          k.rr, k.gr, k.br,
          k.rg, k.gg, k.bg,
          k.rb, k.gb, k.bb
        ]));
        gl.uniform3f(p.u.uOff, k.ro, k.go, k.bo);
        gl.uniform3f(p.u.uInv, k.invR, k.invG, k.invB);
        var a = (k.deslAng || 0) * Math.PI / 180, d = (k.desl || 0) * 0.02;
        gl.uniform2f(p.u.uDesl, Math.cos(a) * d, Math.sin(a) * d);
      } else {
        gl.uniformMatrix3fv(p.u.uMix, false, new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));
        gl.uniform3f(p.u.uOff, 0, 0, 0);
        gl.uniform3f(p.u.uInv, 0, 0, 0);
        gl.uniform2f(p.u.uDesl, 0, 0);
      }
    });
    return true;
  };

  /* ---------------------------------------------------------------- MÁSCARAS
     Até oito por camada, combinadas na ordem em que estão na lista. A
     primeira encontra o acumulador vazio; se ela for de SUBTRAIR ou
     INTERSECTAR isso daria sempre nada, então nesses dois casos o
     acumulador começa cheio — que é o que a pessoa quis dizer.        */
  Renderer.prototype.maskPass = function (masks, inTex, target) {
    var gl = this.gl, self = this;
    if (!this.maskProg || !masks || !masks.length) return false;
    var n = Math.min(8, masks.length);
    var m0 = new Float32Array(32), m1 = new Float32Array(32),
      m2 = new Float32Array(32), m3 = new Float32Array(32);
    /* Reservatório de pontos da CANETA. As curvas já chegam PICADAS em
       segmentos (`VE.maskTesselar` faz isso uma vez por quadro, na CPU):
       o shader continua medindo distância a um polígono, que é barato,
       e a curva vem de graça. Todas as máscaras de traçado livre da
       camada dividem estes pontos; cada uma leva no seu m3 onde a sua
       fatia começa e quantos pontos tem. Quem não couber simplesmente
       não desenha, em vez de invadir a fatia da vizinha.             */
    var POOL = (VE.MASK_POOL_PTS || 256);
    var pts = new Float32Array(POOL * 4), usados = 0, temCaneta = false;
    var aspect = this.w / Math.max(1, this.h);
    for (var i = 0; i < n; i++) {
      var m = masks[i], o = i * 4;
      m0[o] = m.shape; m0[o + 1] = m.modo; m0[o + 2] = m.invert; m0[o + 3] = m.opacidade;
      m1[o] = m.x; m1[o + 1] = m.y; m1[o + 2] = m.w; m1[o + 3] = m.h;
      m2[o] = (m.ang || 0) * Math.PI / 180; m2[o + 1] = m.feather;
      m2[o + 2] = m.expandir; m2[o + 3] = m.lados;
      m3[o] = m.canto;
      if ((m.shape | 0) === 7 && m.pts && m.pts.length >= 3) {
        var achatado = VE.maskTesselar(m.pts, aspect, POOL - usados);
        var cabe = achatado.length >> 1;
        if (cabe >= 3) {
          m3[o + 1] = usados; m3[o + 2] = cabe;
          for (var k = 0; k < cabe; k++) {
            pts[(usados + k) * 4] = achatado[k * 2];
            pts[(usados + k) * 4 + 1] = achatado[k * 2 + 1];
          }
          usados += cabe; temCaneta = true;
        } else { m0[o + 3] = 0; }        /* sem lugar: fica sem efeito */
      }
    }
    var acc0 = (masks[0].modo === 1 || masks[0].modo === 2) ? 1 : 0;
    this.stats.passes++;
    this.pass(this.maskProg, inTex, target, function (p) {
      gl.uniform1f(p.u.uAspect, self.w / self.h);
      gl.uniform1i(p.u.uN, n);
      gl.uniform1f(p.u.uAcc0, acc0);
      if (p.u.uM0) gl.uniform4fv(p.u.uM0, m0);
      if (p.u.uM1) gl.uniform4fv(p.u.uM1, m1);
      if (p.u.uM2) gl.uniform4fv(p.u.uM2, m2);
      if (p.u.uM3) gl.uniform4fv(p.u.uM3, m3);
      if (temCaneta && p.u.uPtsTex) {
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, self.texPontos(pts, POOL));
        gl.uniform1i(p.u.uPtsTex, 3);
      }
    });
    return true;
  };

  /* A linha de pontos da caneta, como textura de ponto flutuante.
     Uma só, reescrita a cada quadro — criar textura por quadro seria
     alocação à toa, e `texSubImage2D` não realoca nada.            */
  Renderer.prototype.texPontos = function (dados, largura) {
    var gl = this.gl;
    if (!this.ptsTex) {
      this.ptsTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.ptsTex);
      /* NEAREST não é preferência: `texelFetch` não filtra, e formato de
         ponto flutuante sem a extensão de filtro linear ficaria
         incompleto se pedisse LINEAR.                                */
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, largura, 1, 0, gl.RGBA, gl.FLOAT, null);
      this.ptsW = largura;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.ptsTex);
    if (this.ptsW !== largura) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, largura, 1, 0, gl.RGBA, gl.FLOAT, null);
      this.ptsW = largura;
    }
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, largura, 1, gl.RGBA, gl.FLOAT, dados);
    return this.ptsTex;
  };

  /* =================================================== A CAMADA ISOLADA =====
     Desenha um clipe SOZINHO num quadro transparente e leva ele por todas
     as etapas que pertencem a ele: efeitos, cor, canais, máscaras. Devolve
     o alvo onde a camada pronta ficou — quem chamou decide se compõe, se
     usa como matte, ou se guarda.

     Nada aqui sabe de modo de mistura ou de opacidade: essas duas coisas
     descrevem a RELAÇÃO da camada com o quadro, não a camada.          */
  Renderer.prototype.renderLayer = function (op, time, bypass) {
    var L = op.layer;
    var chain = bypass ? [] : (op.effects || []);

    /* --- o cache pode responder sem desenhar nada --- */
    var sig = null, slot = null;
    if (!bypass && op.cacheavel) {
      sig = VE.layerSig(op);
      for (var q = 0; q < this.cache.length; q++) {
        if (this.cache[q].clipId === op.clipId) { slot = this.cache[q]; break; }
      }
      if (slot && slot.sig === sig) {
        slot.uso = ++this.cacheRelogio;
        this.stats.cacheOk++;
        return slot.alvo;
      }
    }

    this.clearTarget(this.clipB, 0, 0, 0, 0);
    this.placePass({
      tex: op.tex, rect: op.rect, angle: op.angle, opacity: 1, blend: 0,
      flipX: op.flipX, flipY: op.flipY, crop: op.crop,
      desmult: L ? L.desmult : 0
    }, this.clipB.tex, this.clipA);

    var cur = this.clipA, other = this.clipB, sw;
    for (var k = 0; k < chain.length; k++) {
      if (this.fxPass(chain[k], cur.tex, other, time)) { sw = cur; cur = other; other = sw; }
    }
    if (L && (L.cor || L.canais)) {
      if (this.gradePass(L, cur.tex, other)) { sw = cur; cur = other; other = sw; }
    }
    if (L && L.masks) {
      if (this.maskPass(L.masks, cur.tex, other)) { sw = cur; cur = other; other = sw; }
    }

    /* --- guarda, se valia a pena guardar --- */
    if (sig !== null) {
      this.stats.cacheMiss++;
      if (!slot) {
        if (this.cache.length < this.cacheMax) {
          slot = { clipId: op.clipId, sig: null, uso: 0, alvo: this.mkTarget() };
          var gl0 = this.gl;
          gl0.bindTexture(gl0.TEXTURE_2D, slot.alvo.tex);
          gl0.texImage2D(gl0.TEXTURE_2D, 0, gl0.RGBA8, this.w, this.h, 0, gl0.RGBA, gl0.UNSIGNED_BYTE, null);
          this.cache.push(slot);
        } else {
          slot = this.cache[0];
          for (var z = 1; z < this.cache.length; z++) if (this.cache[z].uso < slot.uso) slot = this.cache[z];
          slot.clipId = op.clipId;
        }
      }
      this.pass(this.copyProg, cur.tex, slot.alvo, null);
      slot.sig = sig;
      slot.uso = ++this.cacheRelogio;
      return slot.alvo;
    }
    return cur;
  };

  /* ================================================== PLANO DE COMPOSIÇÃO ===
     A lista de operações chega da base para o topo. Para cada uma:

       ajuste        roda a cadeia sobre a composição inteira montada até ali
       clipe simples uma passada: desenha e mistura de uma vez
       clipe camada  isola, processa e só então mistura

     "Clipe simples" é o caso em que não há efeito, nem cor, nem máscara,
     nem matte, nem alfa pré-multiplicado — e continua custando UMA passada,
     como no primeiro dia. É o caminho por onde a maioria dos quadros passa.  */
  Renderer.prototype.renderPlan = function (ops, time, opts) {
    var gl = this.gl, self = this;
    opts = opts || {};
    var aspect = this.w / this.h;
    var FULL = { x: 0.5, y: 0.5, w: aspect, h: 1 };
    if (this.cacheRelogio === undefined) this.cacheRelogio = 0;
    this.stats.passes = 0; this.stats.camadas = 0;
    this.stats.cacheOk = 0; this.stats.cacheMiss = 0;
    /* quanto de tempo a memória de quadros precisa cobrir neste quadro */
    this.ajustarPassoHist(ops);
    this.marcaQuadro = (this.marcaQuadro || 0) + 1;

    /* --- quem empresta silhueta para quem --- */
    var porClip = {}, ehMatte = {};
    for (var n = 0; n < ops.length; n++) {
      var o = ops[n];
      if (o.clipId) porClip[o.clipId] = o;
      if (o.layer && o.layer.matte && o.layer.matte.de) ehMatte[o.layer.matte.de] = 1;
    }

    this.clearTarget(this.fbo[0], 0, 0, 0, 0);
    this.clearTarget(this.fbo[1], 0, 0, 0, 0);
    var acc = 0;
    this.ready = true;

    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];

      if (op.kind === 'adjust') {
        if (opts.bypass) continue;
        for (var a = 0; a < op.effects.length; a++) {
          if (this.fxPass(op.effects[a], this.fbo[acc].tex, this.fbo[1 - acc], time)) {
            acc = 1 - acc; this.stats.passes++;
          }
        }
        continue;
      }

      if (!op.tex) continue;
      /* uma camada que serve de matte não aparece sozinha — é a regra de
         qualquer compositor: ela virou recorte, deixou de ser imagem. */
      if (ehMatte[op.clipId]) continue;
      this.stats.camadas++;

      var L = op.layer;
      var chain = opts.bypass ? [] : (op.effects || []);
      var precisaIsolar = chain.length > 0 ||
        (L && (L.cor || L.canais || L.masks || L.desmult));

      /* ---- caminho rápido: desenha e mistura numa passada ---- */
      if (!precisaIsolar) {
        var direto = {
          tex: op.tex, rect: op.rect, angle: op.angle,
          opacity: op.opacity === undefined ? 1 : op.opacity,
          blend: op.blend || 0, flipX: op.flipX, flipY: op.flipY, crop: op.crop
        };
        if (L) {
          direto.fill = L.fill; direto.espaco = L.espaco;
          direto.blendIf = L.blendIf;
        }
        if (L && L.matte && porClip[L.matte.de]) {
          this.montarMatte(porClip[L.matte.de], time, opts.bypass);
          direto.matteModo = L.matte.modo;
        }
        this.placePass(direto, this.fbo[acc].tex, this.fbo[1 - acc]);
        acc = 1 - acc;
        continue;
      }

      /* ---- caminho completo ---- */
      /* o matte é montado ANTES, porque monta-se com os mesmos dois quadros
         de trabalho que a camada vai usar em seguida.                    */
      var matteModo = 0;
      if (L && L.matte && porClip[L.matte.de]) {
        this.montarMatte(porClip[L.matte.de], time, opts.bypass);
        matteModo = L.matte.modo;
      }
      var pronta = this.renderLayer(op, time, opts.bypass);
      this.placePass({
        tex: pronta.tex, rect: FULL, angle: 0,
        opacity: op.opacity === undefined ? 1 : op.opacity,
        blend: op.blend || 0, flipX: false, flipY: false, crop: null,
        fill: L ? L.fill : 1,
        espaco: L ? L.espaco : 0,
        blendIf: L ? L.blendIf : null,
        matteModo: matteModo
      }, this.fbo[acc].tex, this.fbo[1 - acc]);
      acc = 1 - acc;
    }

    /* o estabilizador mede o tremor DO QUADRO PRONTO. Como ele já saiu
       corrigido, o que sobra é o resíduo — a malha é fechada e estável.
       Só roda quando algum efeito de estabilização está no ar.          */
    if (VE.stab && VE.stab.wanted && this === VE.renderer) {
      try { VE.stab.analyze(this, this.fbo[acc]); } catch (e) { }
      VE.stab.wanted = false;
    }

    this.pushHistory(this.fbo[acc].fb);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.pass(this.copyProg, this.fbo[acc].tex, null, null);
    this.lastTex = this.fbo[acc].tex;
  };

  /* monta a camada que empresta a silhueta e copia para o alvo do matte */
  Renderer.prototype.montarMatte = function (op, time, bypass) {
    if (!op || !op.tex) { this.clearTarget(this.matteT, 0, 0, 0, 0); return; }
    var pronta = this.renderLayer(op, time, bypass);
    this.pass(this.copyProg, pronta.tex, this.matteT, null);
    this.stats.passes++;
  };

  /* limpa a memória inteira: obrigatório ao pular no tempo, senão os efeitos
     de realimentação misturam quadros de instantes que não se seguem.     */
  Renderer.prototype.clearPrev = function () {
    for (var i = 0; i < this.ring.length; i++) this.clearTarget(this.ring[i], 0, 0, 0, 0);
    this.ringIdx = 0;
    this.histTick = 0;
    this.histTickF = 0;
    if (this.ringF) {
      var gl = this.gl;
      for (var k = 0; k < this.ringF.length; k++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.ringF[k].fb);
        gl.viewport(0, 0, this.ringFW, this.ringFH);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.ringFIdx = 0;
    }
    this.prev = this.ring[3];
  };

  VE.Renderer = Renderer;
})(window.VE);
