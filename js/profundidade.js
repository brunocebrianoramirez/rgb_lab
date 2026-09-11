/* ============================================================
   rgb_lab — MAPA DE PROFUNDIDADE (I.A.), o analisador
   ------------------------------------------------------------
   O shader `profundidade_ia` (fx16.js) só PINTA o mapa. Quem o
   calcula é este arquivo, com um modelo de profundidade monocular
   rodando DENTRO do navegador: o Depth Anything V2 (small), pela
   Transformers.js, em WebGPU quando há, em WASM quando não há.

   É o mesmo contrato do MARCAR OBJETO (marcar.js): a biblioteca e o
   modelo NÃO estão no arquivo único e nunca estarão — são 18 MB que
   só interessam a quem arrastar o efeito. São buscados na primeira
   vez, ficam no cache do navegador, e se não der (sem rede, arquivo
   aberto do disco) o efeito continua na ficha explicando o motivo e
   pinta um mapa de mentira pelo brilho. Acelera, não sustenta.
   Nenhum quadro sai desta máquina.

   O TRABALHADOR (11/09/2026, segunda volta)
   -----------------------------------------
   Na primeira volta o modelo rodava na linha principal e o vídeo
   TRAVAVA — o Bruno viu. Não era o tempo da GPU: era o JavaScript da
   biblioteca (despachar centenas de kernels, converter tensores) que
   segurava a linha principal de 50 a 150 ms a cada análise, e a
   compilação dos shaders na primeira inferência, que segurava por
   cinco segundos. Agora tudo isso vive num Worker de módulo (o mesmo
   caminho do trabalhador de áudio, audiotrab.js): a linha principal só
   lê a imagem de entrada (uma leitura pequena), manda o buffer por
   transferência e recebe o mapa pronto. O que continua dividido é a
   GPU — quando ela está com o modelo, o quadro do WebGL espera um
   pouco. Por isso há o RITMO: a cada quadro possível, 2 ou 1 por
   segundo, ou só com o vídeo parado.

   Como funciona
   -------------
   1. A imagem que ENTRA no efeito é reduzida e lida de volta, com as
      linhas invertidas — o WebGL entrega de baixo para cima e o modelo
      quer de cima para baixo, e a orientação IMPORTA para um modelo
      que aprendeu que o céu fica em cima.
   2. O worker devolve profundidade RELATIVA (maior = mais perto), no
      tamanho pedido: 154, 252 ou 378 de altura, já normalizada em 8
      bits. Medido no navegador daqui (Intel Gen12, WebGPU, q4f16):
      0,46 s · 1,1 s · ~2,5 s por quadro.
   3. O mapa sobe como textura; o shader lê com filtro linear.
   Só um quadro por vez: enquanto o worker está ocupado, os quadros
   novos são ignorados e o mapa anterior continua na tela.
   ============================================================ */
(function (VE) {
  'use strict';

  var P = VE.profundidade = {};

  P.CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js';
  P.MODELO = 'onnx-community/depth-anything-v2-small';
  P.TAMANHOS = [154, 252, 378];
  /* intervalo mínimo entre análises, por ritmo: sempre · 2/s · 1/s · parado */
  P.RITMOS = [0, 500, 1000, -1];

  var estado = 'frio';      /* frio · carregando · pronto · sem */
  var motivo = '', progresso = 0, dispositivo = '';
  var worker = null, carga = null, resolverCarga = null;
  var ocupado = false, tex = null, texW = 0, texH = 0, ultimoMs = 0, quadros = 0, ultimaAnalise = 0;
  var alvo = null, pixels = null, alvoW = 0, alvoH = 0, linha = null, glDaTex = null;

  P.estado = function () { return estado; };
  P.motivo = function () { return motivo; };
  P.progresso = function () { return progresso; };
  P.dispositivo = function () { return dispositivo; };
  P.ultimoMs = function () { return ultimoMs; };
  P.quadros = function () { return quadros; };
  P.pronto = function () { return estado === 'pronto'; };

  /* ================================================ O TRABALHADOR =====
     O código do worker vive aqui como texto e vira um Blob: assim ele
     entra no arquivo único junto com o resto, sem um arquivo a mais.
     É um worker de MÓDULO, porque só módulo pode fazer `import()` da
     biblioteca no CDN.                                                */
  var CODIGO = [
    'let tf = null, model = null, processor = null, dispositivo = "";',
    'self.onmessage = async (ev) => {',
    '  const m = ev.data;',
    '  try {',
    '    if (m.tipo === "carregar") {',
    '      tf = await import(m.cdn);',
    '      try { tf.env.allowLocalModels = false; } catch (e) {}',
    '      const temGPU = !!(self.navigator && self.navigator.gpu);',
    '      dispositivo = temGPU ? "WebGPU" : "WASM (CPU)";',
    '      model = await tf.AutoModel.from_pretrained(m.modelo, {',
    '        device: temGPU ? "webgpu" : "wasm", dtype: temGPU ? "q4f16" : "q8",',
    '        progress_callback: p => { if (p && typeof p.progress === "number") self.postMessage({ tipo: "progresso", v: p.progress / 100, dispositivo }); }',
    '      });',
    '      processor = await tf.AutoProcessor.from_pretrained(m.modelo);',
    '      self.postMessage({ tipo: "pronto", dispositivo });',
    '    } else if (m.tipo === "analisar") {',
    '      const t0 = performance.now();',
    '      const img = new tf.RawImage(new Uint8ClampedArray(m.dados), m.w, m.h, 4);',
    '      try { processor.image_processor.size = { width: m.alt, height: m.alt }; } catch (e) {}',
    '      const res = await model(await processor(img));',
    '      const d = res.predicted_depth, data = d.data, dims = d.dims;',
    '      const H = dims[dims.length - 2], W = dims[dims.length - 1], n = W * H;',
    '      let mn = Infinity, mx = -Infinity;',
    '      for (let i = 0; i < n; i++) { if (data[i] < mn) mn = data[i]; if (data[i] > mx) mx = data[i]; }',
    '      const esc = mx > mn ? 255 / (mx - mn) : 0, out = new Uint8Array(n * 4);',
    '      for (let i = 0; i < n; i++) { const v = Math.round((data[i] - mn) * esc); out[i * 4] = v; out[i * 4 + 1] = v; out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }',
    '      self.postMessage({ tipo: "mapa", dados: out.buffer, W, H, ms: performance.now() - t0 }, [out.buffer]);',
    '    }',
    '  } catch (e) { self.postMessage({ tipo: "erro", fase: m.tipo, motivo: String((e && e.message) || e) }); }',
    '};'
  ].join('\n');

  function atualizarNota() {
    var el = document.querySelector('[data-nota-ia]');
    if (el) el.textContent = P.nota();
  }

  /* a ficha do efeito mostra o estado da I.A.; quando ele muda de vez
     (pronta, ou indisponível), a ficha é redesenhada para acompanhar */
  function redesenharFicha() {
    try { if (VE.panels && VE.panels.renderProps) VE.panels.renderProps(); } catch (e) { }
  }

  function aoReceber(ev) {
    var m = ev.data || {};
    if (m.tipo === 'progresso') { progresso = m.v; if (m.dispositivo) dispositivo = m.dispositivo; atualizarNota(); }
    else if (m.tipo === 'pronto') { estado = 'pronto'; progresso = 1; dispositivo = m.dispositivo || dispositivo; if (resolverCarga) resolverCarga(true); redesenharFicha(); }
    else if (m.tipo === 'mapa') { subirMapa(m); ocupado = false; atualizarNota(); }
    else if (m.tipo === 'erro') {
      ocupado = false;
      motivo = m.motivo || 'erro no trabalhador';
      if (m.fase === 'carregar') { estado = 'sem'; if (resolverCarga) resolverCarga(false); redesenharFicha(); }
      else atualizarNota();
    }
  }

  P.carregar = function () {
    if (estado === 'pronto') return Promise.resolve(true);
    if (estado === 'sem') return Promise.resolve(false);
    if (estado === 'carregando') return carga;
    if (location.protocol === 'file:') {
      estado = 'sem';
      motivo = 'o arquivo foi aberto direto do disco — a I.A. precisa de servidor para buscar o modelo';
      return Promise.resolve(false);
    }
    estado = 'carregando'; progresso = 0; dispositivo = '';
    carga = new Promise(function (resolve) { resolverCarga = resolve; });
    try {
      var url = URL.createObjectURL(new Blob([CODIGO], { type: 'text/javascript' }));
      worker = new Worker(url, { type: 'module' });
      worker.onmessage = aoReceber;
      worker.onerror = function (e) {
        estado = 'sem';
        motivo = (e && e.message) ? e.message : 'o trabalhador não abriu';
        if (resolverCarga) resolverCarga(false);
        redesenharFicha();
      };
      worker.postMessage({ tipo: 'carregar', cdn: P.CDN, modelo: P.MODELO });
    } catch (e) {
      estado = 'sem';
      motivo = (e && e.message) ? e.message : String(e);
      if (resolverCarga) resolverCarga(false);
    }
    return carga;
  };

  /* ============================================== A ANÁLISE =========== */
  function garantirTex(gl) {
    if (tex && glDaTex === gl) return tex;
    tex = gl.createTexture(); glDaTex = gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  function subirMapa(m) {
    var gl = glDaTex || (VE.renderer && VE.renderer.gl);
    if (!gl) return;
    var t = garantirTex(gl);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, m.W, m.H, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(m.dados));
    texW = m.W; texH = m.H; ultimoMs = m.ms; quadros++;
  }

  /* lê a imagem de entrada em tamanho reduzido, de cima para baixo */
  function lerEntrada(renderer, inTex, w, h) {
    var gl = renderer.gl;
    if (!alvo || alvoW !== w || alvoH !== h) {
      if (alvo) renderer.delTarget(alvo);
      alvo = renderer.mkTarget();
      gl.bindTexture(gl.TEXTURE_2D, alvo.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      pixels = new Uint8Array(w * h * 4);
      linha = new Uint8Array(w * 4);
      alvoW = w; alvoH = h;
    }
    renderer.downsample(inTex, alvo, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, alvo.fb);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    /* inverte as linhas: o modelo quer o céu em cima */
    var L = w * 4;
    for (var y = 0; y < (h >> 1); y++) {
      var a = y * L, b = (h - 1 - y) * L;
      linha.set(pixels.subarray(a, a + L));
      pixels.copyWithin(a, b, b + L);
      pixels.set(linha, b);
    }
    return pixels;
  }

  /* Pede uma análise se o trabalhador estiver livre e o ritmo deixar;
     devolve a textura que existe AGORA (pode ser a do quadro anterior).
     `tam` é o índice em P.TAMANHOS; `ritmo`, em P.RITMOS.
     Nunca espera: o laço de desenho não pode parar.                   */
  P.analisar = function (renderer, inTex, tam, ritmo) {
    var gl = renderer.gl;
    if (!gl || !inTex) return null;
    glDaTex = glDaTex || gl;
    if (estado === 'frio') P.carregar();
    if (estado !== 'pronto' || ocupado) return P.atual(gl);
    var minimo = P.RITMOS[ritmo | 0];
    if (minimo === undefined) minimo = 0;
    var agora = performance.now();
    /* SÓ PARADO: com o vídeo tocando, o mapa que existe continua */
    if (minimo < 0 && VE.app && VE.app.playing) return P.atual(gl);
    if (minimo > 0 && agora - ultimaAnalise < minimo) return P.atual(gl);
    ultimaAnalise = agora;
    ocupado = true;
    var alt = P.TAMANHOS[tam | 0] || P.TAMANHOS[0];
    var w = Math.min(640, Math.max(64, Math.round(alt * renderer.w / Math.max(1, renderer.h)))), h = alt;
    var dados;
    try { dados = lerEntrada(renderer, inTex, w, h); }
    catch (e) { ocupado = false; return P.atual(gl); }
    /* o buffer vai por TRANSFERÊNCIA (custa zero cópia); por isso é uma
       cópia do nosso, que continua servindo para a próxima leitura   */
    var copia = new Uint8Array(dados).buffer;
    try { worker.postMessage({ tipo: 'analisar', dados: copia, w: w, h: h, alt: alt }, [copia]); }
    catch (e) { ocupado = false; motivo = (e && e.message) ? e.message : String(e); }
    return P.atual(gl);
  };

  P.atual = function (gl) {
    if (!tex || !texW) return null;
    return { tex: tex, count: 1, cols: texW, rows: texH, total: 1 };
  };

  /* uma frase para a ficha do efeito */
  P.nota = function () {
    if (estado === 'frio') return 'I.A.: o modelo (18 MB) é buscado quando o efeito entra no ar, e fica guardado no navegador';
    if (estado === 'carregando') return 'I.A.: carregando o modelo… ' + Math.round(progresso * 100) + '%' + (dispositivo ? ' (' + dispositivo + ')' : '');
    if (estado === 'sem') return 'I.A. indisponível: ' + motivo + ' — o mapa abaixo é de mentira, pelo brilho';
    return 'I.A. pronta em ' + dispositivo + ', fora da linha principal' + (quadros ? ' · ' + Math.round(ultimoMs) + ' ms por quadro · ' + texW + '×' + texH : ' · a primeira análise compila os shaders (uns segundos)');
  };

})(window.VE);
