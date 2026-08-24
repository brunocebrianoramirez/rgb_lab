/* ============================================================
   rgb_lab — O TRABALHADOR DO ÁUDIO
   ------------------------------------------------------------
   ESPECTRAL, GRANULAR e a família VOZ custam de 100 a 500 ms por
   segundo de áudio. Num arquivo de três minutos isso é mais de um
   minuto de conta — e, feita na linha principal, é um minuto com a
   aba dura: o aviso PROCESSANDO aparece e nada mais responde.

   Este arquivo NÃO reescreve a biblioteca de áudio. Ele monta um
   Web Worker com o CÓDIGO QUE JÁ EXISTE — `audiodsp.js`, `audiofx.js`
   e `audiovoz.js`, os mesmos arquivos, o mesmo texto — e do lado de lá
   troca a única coisa que prendia a biblioteca à página:

       D.make  →  VE.audio.context().createBuffer(...)

   O contexto de lá é um objeto de dez linhas que devolve um AudioBuffer
   de mentira: `numberOfChannels`, `length`, `sampleRate`, `duration` e
   `getChannelData`. É tudo o que a biblioteca inteira usa de um buffer.
   Por isso não existe uma segunda versão de nenhum efeito para sair de
   sincronia com a primeira — mexeu num módulo, o trabalhador mudou junto.

   De onde sai o texto dos três arquivos:
     · no site, buscando os arquivos (mesma origem);
     · no ARQUIVO ÚNICO, cortando o script embutido pelos marcadores que
       o `build-arquivo-unico.js` já escreve antes de cada arquivo.

   E se nada disso der certo — file:// sem servidor, CSP que barre Worker
   de blob, navegador antigo — o laboratório continua exatamente como
   antes, calculando na linha principal. O trabalhador é uma ACELERAÇÃO,
   nunca uma dependência.
   ============================================================ */
(function (VE) {
  'use strict';

  var A = VE.audio;
  var T = A.trab = {};

  /* os três arquivos que o trabalhador precisa, na ordem de carga */
  var ARQUIVOS = ['audiodsp.js', 'audiofx.js', 'audiovoz.js'];

  var estado = 'frio';        /* frio · montando · pronto · sem */
  var motivo = '';            /* por que não deu, quando não dá */
  var w = null;               /* o Worker */
  var capaz = null;           /* { id: 1 } — o que ele sabe processar */
  var fonteGuardada = null;   /* o texto já montado, para remontar rápido */
  var montagem = null;
  var job = null, seq = 0;

  /* ============================================ DE ONDE SAI O CÓDIGO ==== */

  /* O marcador que o build escreve antes de cada arquivo. Montado por
     expressão, e não escrito à mão, para o próprio audiotrab.js não virar
     um falso marcador quando ele também estiver dentro do arquivo único. */
  function marcadorDe(nome) {
    return new RegExp('/\\* =+ ' + nome.replace(/[.\/]/g, '\\$&') + ' =+ \\*/');
  }
  var QUALQUER = /\/\* =+ [\w.\/-]+\.js =+ \*\//g;

  function daPagina() {
    var scripts = document.querySelectorAll('script:not([src])');
    for (var i = 0; i < scripts.length; i++) {
      var txt = scripts[i].textContent || '';
      if (!marcadorDe(ARQUIVOS[0]).test(txt)) continue;
      var cortes = [], m;
      QUALQUER.lastIndex = 0;
      while ((m = QUALQUER.exec(txt)) !== null) {
        cortes.push({ ini: m.index, fim: m.index + m[0].length, txt: m[0] });
      }
      var saida = [];
      for (var k = 0; k < ARQUIVOS.length; k++) {
        var re = marcadorDe(ARQUIVOS[k]), achou = -1;
        for (var j = 0; j < cortes.length; j++) {
          if (re.test(cortes[j].txt)) { achou = j; break; }
        }
        if (achou < 0) return null;
        var fim = (achou + 1 < cortes.length) ? cortes[achou + 1].ini : txt.length;
        saida.push(txt.slice(cortes[achou].fim, fim));
      }
      return saida;
    }
    return null;
  }

  function pelaRede() {
    if (typeof fetch !== 'function') return Promise.reject(new Error('este navegador não tem fetch'));
    return Promise.all(ARQUIVOS.map(function (n) {
      return fetch('js/' + n).then(function (r) {
        if (!r.ok) throw new Error(n + ' respondeu ' + r.status);
        return r.text();
      });
    }));
  }

  function fontes() {
    var daqui = daPagina();
    if (daqui) return Promise.resolve(daqui);
    return pelaRede();
  }

  /* ================================================ O LADO DE LÁ ======== */

  /* O laboratório de mentira: só o que a biblioteca de áudio pede. */
  var PRELUDIO = [
    'self.window = self;',
    'var VE = self.VE = {};',
    '',
    '/* O AudioBuffer de lá: quatro propriedades e um método, que é tudo o',
    '   que audiodsp, audiofx e audiovoz usam de um buffer de verdade. */',
    'function Bufe(ch, len, sr) {',
    '  this.numberOfChannels = Math.max(1, ch | 0);',
    '  this.length = Math.max(1, Math.floor(len));',
    '  this.sampleRate = sr;',
    '  this.duration = this.length / sr;',
    '  this._c = [];',
    '  for (var i = 0; i < this.numberOfChannels; i++) this._c.push(new Float32Array(this.length));',
    '}',
    'Bufe.prototype.getChannelData = function (c) {',
    '  return this._c[Math.min(c | 0, this._c.length - 1)];',
    '};',
    '',
    'var CTX = {',
    '  sampleRate: 48000,',
    '  createBuffer: function (ch, len, sr) { return new Bufe(ch, len, sr || CTX.sampleRate); }',
    '};',
    '',
    'var PROC = {};',
    'VE.adsp = {};',
    'VE.audio = {',
    '  modules: [],',
    '  FAMS: [],',
    '  PROC: PROC,',
    '  context: function () { return CTX; },',
    '  register: function (mod, proc) {',
    '    mod.values = {};',
    '    (mod.params || []).forEach(function (p) { mod.values[p.k] = p.def; });',
    '    VE.audio.modules.push(mod);',
    '    PROC[mod.id] = proc || {};',
    '    return mod;',
    '  }',
    '};'
  ].join('\n');

  /* O recado: recebe canais, roda os módulos na ordem, devolve canais. */
  var RODAPE = [
    'function daMensagem(d) {',
    '  var b = new Bufe(d.canais.length, d.canais[0].length, d.taxa);',
    '  for (var c = 0; c < d.canais.length; c++) b._c[c] = d.canais[c];',
    '  return b;',
    '}',
    '',
    '/* O mesmo teto de duração da página: um esticador em 8x geraria',
    '   minutos de áudio, e a memória iria junto. */',
    'function aparado(b, teto) {',
    '  if (!teto || b.length <= teto) return b;',
    '  var o = new Bufe(b.numberOfChannels, teto, b.sampleRate);',
    '  for (var c = 0; c < b.numberOfChannels; c++) {',
    '    o.getChannelData(c).set(b.getChannelData(c).subarray(0, teto));',
    '  }',
    '  return o;',
    '}',
    '',
    'self.onmessage = function (e) {',
    '  var d = e.data;',
    '  if (d.t === "quem") {',
    '    postMessage({ t: "quem", ids: Object.keys(PROC).filter(function (k) {',
    '      return typeof PROC[k].buf === "function";',
    '    }) });',
    '    return;',
    '  }',
    '  if (d.t !== "faz") return;',
    '  CTX.sampleRate = d.taxa;',
    '  var b = daMensagem(d), cortou = false, erros = [];',
    '  var t0 = (self.performance && performance.now) ? performance.now() : Date.now();',
    '  for (var i = 0; i < d.mods.length; i++) {',
    '    var m = d.mods[i], p = PROC[m.id];',
    '    postMessage({ t: "andando", seq: d.seq, i: i, n: d.mods.length, nome: m.nome || m.id });',
    '    if (!p || typeof p.buf !== "function") continue;',
    '    try {',
    '      var novo = p.buf(b, m.values) || b;',
    '      var antes = novo.length;',
    '      b = aparado(novo, d.teto);',
    '      if (b.length < antes) cortou = true;',
    '    } catch (err) { erros.push(m.id + ": " + err.message); }',
    '  }',
    '  var canais = [], leva = [];',
    '  for (var c = 0; c < b.numberOfChannels; c++) {',
    '    var f = b.getChannelData(c);',
    '    canais.push(f); leva.push(f.buffer);',
    '  }',
    '  var t1 = (self.performance && performance.now) ? performance.now() : Date.now();',
    '  postMessage({ t: "pronto", seq: d.seq, canais: canais, taxa: b.sampleRate,',
    '    cortou: cortou, erros: erros, ms: Math.round(t1 - t0) }, leva);',
    '};',
    'postMessage({ t: "vivo" });'
  ].join('\n');

  /* ================================================ MONTAR E DESLIGAR === */

  function desligar() {
    if (w) { try { w.terminate(); } catch (e) { } }
    w = null;
  }

  function aoRecado(e) {
    var d = e.data;
    if (!job || d.seq !== job.seq) return;
    if (d.t === 'andando') { if (job.aoAndar) job.aoAndar(d); return; }
    if (d.t !== 'pronto') return;
    var j = job; job = null;
    try {
      var c = A.context();
      var out = c.createBuffer(d.canais.length, d.canais[0].length, d.taxa);
      for (var i = 0; i < d.canais.length; i++) out.getChannelData(i).set(d.canais[i]);
      j.ok({ buffer: out, cortou: d.cortou, erros: d.erros, ms: d.ms });
    } catch (err) { j.falha(err); }
  }

  function aoErro(ev) {
    var e = new Error(ev.message || 'o trabalhador parou');
    estado = 'sem'; motivo = e.message;
    var j = job; job = null;
    desligar();
    if (j) j.falha(e);
  }

  /* Idempotente: chamar de novo devolve a mesma promessa. */
  T.ligar = function () {
    if (estado === 'pronto') return Promise.resolve(true);
    if (estado === 'sem') return Promise.resolve(false);
    if (estado === 'montando') return montagem;
    if (typeof Worker !== 'function' || typeof Blob !== 'function' ||
        !window.URL || !URL.createObjectURL) {
      estado = 'sem'; motivo = 'este navegador não monta Worker de blob';
      return Promise.resolve(false);
    }
    estado = 'montando';
    montagem = (fonteGuardada ? Promise.resolve(null) : fontes().then(function (partes) {
      fonteGuardada = PRELUDIO + '\n' + partes.join('\n') + '\n' + RODAPE;
      return null;
    })).then(function () {
      var url = URL.createObjectURL(new Blob([fonteGuardada], { type: 'text/javascript' }));
      w = new Worker(url);
      URL.revokeObjectURL(url);
      return new Promise(function (ok, falha) {
        var relogio = setTimeout(function () {
          falha(new Error('o trabalhador não respondeu em 8 s'));
        }, 8000);
        w.onerror = function (ev) {
          clearTimeout(relogio);
          falha(new Error(ev.message || 'erro ao montar o trabalhador'));
        };
        w.onmessage = function (e) {
          if (e.data.t === 'vivo') { w.postMessage({ t: 'quem' }); return; }
          if (e.data.t !== 'quem') return;
          clearTimeout(relogio);
          capaz = {};
          e.data.ids.forEach(function (k) { capaz[k] = 1; });
          w.onmessage = aoRecado;
          w.onerror = aoErro;
          estado = 'pronto';
          ok(true);
        };
      });
    }).catch(function (e) {
      estado = 'sem'; motivo = e.message || String(e);
      desligar();
      return false;
    });
    return montagem;
  };

  T.ligado = function () { return estado === 'pronto'; };
  T.podeTentar = function () { return estado !== 'sem'; };
  T.motivo = function () { return motivo; };
  T.ocupado = function () { return !!job; };
  T.faz = function (id) { return !!(capaz && capaz[id]); };
  T.quantos = function () { return capaz ? Object.keys(capaz).length : 0; };

  /* ==================================================== O TRABALHO ====== */

  /* Manda o buffer e a lista de módulos; volta um AudioBuffer novo.
     Os canais vão como CÓPIA doada: o buffer da página não pode ser
     esvaziado, e copiar 34 MB é muito mais barato que esperar um minuto. */
  T.processar = function (b, mods, aoAndar) {
    if (estado !== 'pronto' || !w) return Promise.reject(new Error('o trabalhador não está ligado'));
    if (job) return Promise.reject(new Error('já há um trabalho em curso'));
    var meu = ++seq;
    var canais = [], leva = [];
    for (var c = 0; c < b.numberOfChannels; c++) {
      var f = new Float32Array(b.getChannelData(c));
      canais.push(f); leva.push(f.buffer);
    }
    return new Promise(function (ok, falha) {
      job = { seq: meu, ok: ok, falha: falha, aoAndar: aoAndar };
      w.postMessage({
        t: 'faz', seq: meu, canais: canais, taxa: b.sampleRate,
        teto: Math.max(2, VE.MAXDUR || 600) * b.sampleRate,
        mods: mods.map(function (m) {
          return { id: m.id, nome: m.name, values: JSON.parse(JSON.stringify(m.values || {})) };
        })
      }, leva);
    });
  };

  /* Desistir de um trabalho longo. Não existe "pare" para um laço que já
     está rodando lá dentro: a única forma é encerrar o trabalhador e montar
     outro — e montar outro é rápido, porque o texto fica guardado. */
  T.cancelar = function () {
    if (!job) return false;
    var j = job; job = null;
    desligar();
    estado = 'frio'; montagem = null;
    var e = new Error('trabalho cancelado');
    e.cancelado = true;
    j.falha(e);
    return true;
  };

})(window.VE);
