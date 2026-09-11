/* ============================================================
   rgb_lab — o ESCRITOR DE WEBM (Matroska), para a exportação exata
   ------------------------------------------------------------
   O gravador do navegador (MediaRecorder) carimba cada quadro pelo
   RELÓGIO DE PAREDE: o quadro vale o instante em que chegou, não o
   instante que ele representa. Com um efeito pesado o quadro chega
   atrasado, e o arquivo sai esticado ou com quadro repetido — foi
   medido: 2 s de composição viraram 47 s de arquivo com 3 quadros
   distintos.

   O caminho certo é codificar cada quadro com o carimbo que ELE tem
   (`VideoEncoder`, do WebCodecs) e escrever o arquivo à mão. Este
   arquivo é a segunda metade: recebe os pedaços codificados, cada um
   com o seu tempo, e monta um WebM que qualquer navegador e qualquer
   editor abrem. É o mesmo espírito do escritor de ZIP do exporter.js:
   nenhuma biblioteca, só o formato, escrito por extenso.

   O que um WebM tem, e é só isto:

     EBML header          "isto é um webm"
     Segment
       Info               escala de tempo (1 ms) e duração
       Tracks             uma trilha de vídeo: VP9, largura, altura
       Cluster…           blocos de quadros, cada um com o seu tempo
       Cues               índice para a busca (onde cada cluster está)

   Os tamanhos são escritos por extenso (o arquivo é montado inteiro
   na memória, então se sabe o tamanho de tudo) — sem "tamanho
   desconhecido", que é o que deixa alguns leitores sem a duração.
   ============================================================ */
(function (VE) {
  'use strict';

  var W = VE.webm = {};

  /* ---------- os átomos do EBML ---------- */
  function bytesId(id) {
    /* o ID é escrito como está (os bits de comprimento já estão nele) */
    var out = [];
    if (id >= 0x1000000) out.push((id >>> 24) & 0xFF);
    if (id >= 0x10000) out.push((id >>> 16) & 0xFF);
    if (id >= 0x100) out.push((id >>> 8) & 0xFF);
    out.push(id & 0xFF);
    return out;
  }
  /* tamanho como inteiro de comprimento variável (vint) */
  function vint(n) {
    if (n < 0x7F) return [0x80 | n];
    if (n < 0x3FFF) return [0x40 | (n >>> 8), n & 0xFF];
    if (n < 0x1FFFFF) return [0x20 | (n >>> 16), (n >>> 8) & 0xFF, n & 0xFF];
    if (n < 0xFFFFFFF) return [0x10 | (n >>> 24), (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF];
    /* 8 bytes: até 2^56 — mais do que qualquer arquivo daqui */
    var hi = Math.floor(n / 4294967296), lo = n >>> 0;
    return [0x01, (hi >>> 16) & 0xFF, (hi >>> 8) & 0xFF, hi & 0xFF, (lo >>> 24) & 0xFF, (lo >>> 16) & 0xFF, (lo >>> 8) & 0xFF, lo & 0xFF];
  }
  function concat(parts) {
    var n = 0, i;
    for (i = 0; i < parts.length; i++) n += parts[i].length;
    var out = new Uint8Array(n), o = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
    return out;
  }
  /* um elemento: id + tamanho + conteúdo */
  function el(id, payload) {
    var p = (payload instanceof Uint8Array) ? payload : new Uint8Array(payload);
    return concat([new Uint8Array(bytesId(id)), new Uint8Array(vint(p.length)), p]);
  }
  function uint(id, v) {
    var b = [];
    if (v === 0) b = [0];
    else { var x = v; while (x > 0) { b.unshift(x % 256); x = Math.floor(x / 256); } }
    return el(id, b);
  }
  function str(id, s) { return el(id, Array.from(new TextEncoder().encode(s))); }
  function flt(id, v) { var dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, v); return el(id, new Uint8Array(dv.buffer)); }

  /* ---------- o arquivo ----------
     opts: { width, height, codec: 'V_VP9' | 'V_VP8' | 'V_AV1',
             description (Uint8Array, opcional),
             chunks: [{ data: Uint8Array, timestamp: µs, key: bool, duration: µs }],
             duration: s }                                              */
  W.mux = function (opts) {
    var chunks = opts.chunks || [];
    var durMs = Math.max(1, Math.round((opts.duration || 0) * 1000));
    var i;

    var header = el(0x1A45DFA3, concat([
      uint(0x4286, 1), uint(0x42F7, 1), uint(0x42F2, 4), uint(0x42F3, 8),
      str(0x4282, 'webm'), uint(0x4287, 4), uint(0x4285, 2)
    ]));

    var info = el(0x1549A966, concat([
      uint(0x2AD7B1, 1000000),                 /* 1 unidade = 1 ms */
      str(0x4D80, 'rgb_lab'), str(0x5741, 'rgb_lab'),
      flt(0x4489, durMs)
    ]));

    var trackPartes = [
      uint(0xD7, 1), uint(0x73C5, 1), uint(0x83, 1),
      str(0x86, opts.codec || 'V_VP9'),
      uint(0x9C, 0),                            /* sem laço de compensação */
      el(0xE0, concat([uint(0xB0, opts.width), uint(0xBA, opts.height)]))
    ];
    if (opts.description && opts.description.length) trackPartes.splice(4, 0, el(0x63A2, opts.description));
    var tracks = el(0x1654AE6B, el(0xAE, concat(trackPartes)));

    /* clusters: um novo a cada quadro-chave depois de 4 s, ou a cada 30 s */
    var clusters = [], cues = [], atual = null, atualT0 = 0;
    function fechar() { if (atual) { clusters.push({ t0: atualT0, bytes: el(0x1F43B675, concat(atual)) }); atual = null; } }
    for (i = 0; i < chunks.length; i++) {
      var c = chunks[i], tMs = Math.round(c.timestamp / 1000);
      if (!atual || (c.key && tMs - atualT0 >= 4000) || tMs - atualT0 >= 30000 || tMs - atualT0 > 32000) {
        fechar();
        atual = [uint(0xE7, tMs)]; atualT0 = tMs;
        if (c.key) cues.push({ t: tMs, idx: clusters.length });
      }
      var delta = tMs - atualT0;
      var cab = new Uint8Array([0x81, (delta >> 8) & 0xFF, delta & 0xFF, c.key ? 0x80 : 0x00]);
      atual.push(el(0xA3, concat([cab, c.data])));
    }
    fechar();

    /* posições dos clusters para o índice: relativas ao começo do
       conteúdo do Segment. Como o índice vem DEPOIS dos clusters, os
       tamanhos já estão todos fechados.                              */
    var corpo = [info, tracks], pos = info.length + tracks.length, posicoes = [];
    for (i = 0; i < clusters.length; i++) { posicoes.push(pos); pos += clusters[i].bytes.length; corpo.push(clusters[i].bytes); }
    var cuePts = cues.map(function (q) {
      return el(0xBB, concat([uint(0xB3, q.t), el(0xB7, concat([uint(0xF7, 1), uint(0xF1, posicoes[q.idx])]))]));
    });
    if (cuePts.length) corpo.push(el(0x1C53BB6B, concat(cuePts)));

    var segment = el(0x18538067, concat(corpo));
    return new Blob([header, segment], { type: 'video/webm' });
  };

})(window.VE);
