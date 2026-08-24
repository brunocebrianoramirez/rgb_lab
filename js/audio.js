/* ============================================================
   rgb_lab — LABORATÓRIO 02 · ÁUDIO
   Buffer original → transformações → grafo offline → buffer final
   O mesmo caminho serve para tocar, exportar e mandar pra timeline.
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var A = VE.audio = {};
  var ctx = null, srcBuf = null, outBuf = null, node = null, analyser = null, gainNode = null;
  var playing = false, startedAt = 0, offset = 0, raf = null;
  var sel = { a: null, b: null }, dragSel = null;
  var name = '', rendering = false, dirty = false;
  var micStream = null, micRec = null, micChunks = [];

  /* ---------------- rack ---------------- */
  var MODULES = [
    {
      id: 'rate', name: 'VELOCIDADE & TOM', on: false, params: [
        { k: 'rate', label: 'Velocidade', min: 0.25, max: 4, step: 0.01, def: 1 },
        { k: 'semi', label: 'Semitons', min: -24, max: 24, step: 1, def: 0 }
      ]
    },
    { id: 'reverse', name: 'REVERSO', on: false, params: [] },
    {
      id: 'filter', name: 'FILTRO', on: false, params: [
        { k: 'type', t: 's', label: 'Tipo', def: 0, opts: ['Passa-baixa', 'Passa-alta', 'Passa-faixa', 'Notch'] },
        { k: 'freq', label: 'Frequência (Hz)', min: 40, max: 18000, step: 10, def: 1200 },
        { k: 'q', label: 'Ressonância', min: 0.1, max: 24, step: 0.1, def: 1.2 }
      ]
    },
    {
      id: 'dist', name: 'DISTORÇÃO', on: false, params: [
        { k: 'drive', label: 'Ganho de entrada', min: 1, max: 100, step: 1, def: 24 },
        { k: 'tone', label: 'Timbre', min: 200, max: 16000, step: 50, def: 6000 },
        { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 }
      ]
    },
    {
      id: 'crush', name: 'BITCRUSH', on: false, params: [
        { k: 'bits', label: 'Bits', min: 1, max: 16, step: 1, def: 6 },
        { k: 'down', label: 'Redução de taxa', min: 1, max: 64, step: 1, def: 8 },
        { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 }
      ]
    },
    {
      id: 'delay', name: 'ATRASO', on: false, params: [
        { k: 'time', label: 'Tempo (s)', min: 0.01, max: 1.5, step: 0.01, def: 0.24 },
        { k: 'fb', label: 'Realimentação', min: 0, max: 0.95, step: 0.01, def: 0.42 },
        { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 0.35 }
      ]
    },
    {
      id: 'reverb', name: 'REVERBERAÇÃO', on: false, params: [
        { k: 'size', label: 'Tamanho (s)', min: 0.1, max: 6, step: 0.1, def: 2.2 },
        { k: 'decay', label: 'Queda', min: 0.5, max: 8, step: 0.1, def: 2.4 },
        { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 0.35 }
      ]
    },
    {
      id: 'granular', name: 'GRANULAR', on: false, params: [
        { k: 'grain', label: 'Grão (ms)', min: 8, max: 400, step: 1, def: 90 },
        { k: 'dens', label: 'Densidade', min: 0.2, max: 4, step: 0.05, def: 1.4 },
        { k: 'spread', label: 'Dispersão', min: 0, max: 1, step: 0.01, def: 0.35 },
        { k: 'pitch', label: 'Variação de tom', min: 0, max: 12, step: 0.5, def: 0 }
      ]
    },
    {
      id: 'stutter', name: 'GAGUEIRA / GLITCH', on: false, params: [
        { k: 'slice', label: 'Fatia (ms)', min: 10, max: 500, step: 5, def: 120 },
        { k: 'rep', label: 'Repetições', min: 1, max: 8, step: 1, def: 3 },
        { k: 'prob', label: 'Probabilidade', min: 0, max: 1, step: 0.01, def: 0.35 },
        { k: 'rev', label: 'Chance de inverter', min: 0, max: 1, step: 0.01, def: 0.25 }
      ]
    },
    {
      id: 'trem', name: 'MODULAÇÃO', on: false, params: [
        { k: 'rate', label: 'Frequência (Hz)', min: 0.1, max: 40, step: 0.1, def: 5 },
        { k: 'depth', label: 'Profundidade', min: 0, max: 1, step: 0.01, def: 0.6 },
        { k: 'shape', t: 's', label: 'Forma', def: 0, opts: ['Senoide', 'Quadrada'] }
      ]
    },
    {
      id: 'noise', name: 'RUÍDO', on: false, params: [
        { k: 'amt', label: 'Quantidade', min: 0, max: 0.5, step: 0.005, def: 0.05 },
        { k: 'type', t: 's', label: 'Tipo', def: 0, opts: ['Branco', 'Chiado (rosa)', 'Crepitar'] }
      ]
    },
    {
      id: 'out', name: 'SAÍDA', on: true, params: [
        { k: 'gain', label: 'Ganho', min: 0, max: 3, step: 0.01, def: 1 },
        { k: 'pan', label: 'Panorama', min: -1, max: 1, step: 0.01, def: 0 },
        { k: 'norm', t: 'b', label: 'Normalizar', def: 1 }
      ]
    }
  ];
  A.modules = MODULES;

  function val(mod, k) {
    var m = MODULES.filter(function (x) { return x.id === mod; })[0];
    if (!m) return 0;
    if (m.values && m.values[k] !== undefined) return m.values[k];
    var p = m.params.filter(function (x) { return x.k === k; })[0];
    return p ? p.def : 0;
  }
  function isOn(mod) {
    var m = MODULES.filter(function (x) { return x.id === mod; })[0];
    return m && m.on;
  }
  MODULES.forEach(function (m) {
    m.values = {};
    m.params.forEach(function (p) { m.values[p.k] = p.def; });
  });

  /* ---------------- contexto ---------------- */
  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      gainNode = ctx.createGain();
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  A.context = ac;

  /* ---------------- picos para a onda da linha do tempo ----------------
     A timeline pede a onda de uma FONTE (não do laboratório de áudio).
     A decodificação é cara, então acontece uma vez por fonte, em segundo
     plano; enquanto não termina, devolve null e a pista mostra uma régua
     neutra em vez de inventar um desenho.                                */
  var PEAK_BUCKETS = 2000;
  A.peaksFor = function (src) {
    if (!src) return null;
    if (src.peaks) return src.peaks;
    if (src.peaksPending) return null;
    if (src.kind !== 'audio' && src.kind !== 'video') return null;
    var url = src.url || (src.el && src.el.src);
    if (!url) return null;
    src.peaksPending = true;
    fetch(url)
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (buf) { return ac().decodeAudioData(buf); })
      .then(function (ab) {
        var d = ab.getChannelData(0);
        var n = PEAK_BUCKETS;
        var step = Math.max(1, Math.floor(d.length / n));
        var out = new Float32Array(n * 2);
        for (var i = 0; i < n; i++) {
          var mn = 1, mx = -1;
          var base = i * step;
          for (var j = 0; j < step; j += Math.max(1, step >> 8)) {
            var v = d[base + j];
            if (v === undefined) break;
            if (v < mn) mn = v;
            if (v > mx) mx = v;
          }
          out[i * 2] = mn === 1 ? 0 : mn;
          out[i * 2 + 1] = mx === -1 ? 0 : mx;
        }
        src.peaks = out;
        src.peaksPending = false;
        if (VE.tl && VE.tl.drawWaveforms) VE.tl.drawWaveforms();
      })
      .catch(function () { src.peaksPending = false; src.peaks = null; src.peaksFailed = true; });
    return null;
  };

  /* ---------------- carregar ---------------- */
  A.loadFile = function (file) {
    name = file.name;
    return file.arrayBuffer().then(function (buf) { return ac().decodeAudioData(buf); })
      .then(function (b) { setBuffer(b, file.name); return b; });
  };

  A.loadFromVideoSource = function (srcId) {
    var s = VE.sources[srcId];
    if (!s || !s.url) return Promise.reject(new Error('fonte sem arquivo'));
    return fetch(s.url).then(function (r) { return r.arrayBuffer(); })
      .then(function (buf) { return ac().decodeAudioData(buf); })
      .then(function (b) { setBuffer(b, 'ÁUDIO DE ' + s.name); return b; });
  };

  A.makeTone = function () {
    var c = ac(), dur = 4, sr = c.sampleRate;
    var b = c.createBuffer(2, Math.floor(dur * sr), sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch);
      for (var i = 0; i < d.length; i++) {
        var t = i / sr;
        var f = 110 * Math.pow(2, (t / dur) * 3);
        var env = Math.min(1, t * 4) * Math.max(0, 1 - (t - dur + 0.4) / 0.4);
        d[i] = Math.sin(2 * Math.PI * f * t) * 0.35 * env +
          (Math.random() - 0.5) * 0.04 * env +
          (t % 0.5 < 0.02 ? (Math.random() - 0.5) * 0.5 : 0);
      }
    }
    setBuffer(b, 'TOM DE TESTE');
  };

  A.micStart = function () {
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      micStream = stream;
      micChunks = [];
      micRec = new MediaRecorder(stream);
      micRec.ondataavailable = function (e) { if (e.data.size) micChunks.push(e.data); };
      micRec.start();
      return true;
    });
  };

  A.micStop = function () {
    return new Promise(function (res, rej) {
      if (!micRec) { rej(new Error('não está gravando')); return; }
      micRec.onstop = function () {
        var blob = new Blob(micChunks, { type: micChunks[0] ? micChunks[0].type : 'audio/webm' });
        micStream.getTracks().forEach(function (t) { t.stop(); });
        micStream = null; micRec = null;
        blob.arrayBuffer().then(function (b) { return ac().decodeAudioData(b); })
          .then(function (ab) { setBuffer(ab, 'MICROFONE'); res(ab); }, rej);
      };
      micRec.stop();
    });
  };
  A.micRecording = function () { return !!micRec; };

  function setBuffer(b, n) {
    if (A.trab) A.trab.ligar();
    srcBuf = b; outBuf = b; name = n || 'ÁUDIO';
    sel.a = null; sel.b = null;
    stop();
    $('#auName').textContent = n;
    dirty = true;
    A.rerender();
    A.drawWave();
    updateInfo();
  }
  A.buffer = function () { return outBuf; };
  A.listen = 'b';
  /* A = como entrou · B = depois da cadeia. Trocar não desfaz nada. */
  function bufAtual() { return (A.listen === 'a' && srcBuf) ? srcBuf : outBuf; }
  A.bufAtual = bufAtual;
  A.hasAudio = function () { return !!srcBuf; };
  A.name = function () { return name; };

  function updateInfo() {
    if (!srcBuf) { $('#auInfo').textContent = '—'; return; }
    $('#auInfo').textContent = srcBuf.numberOfChannels + ' CANAIS · ' + srcBuf.sampleRate + ' HZ · ' +
      srcBuf.duration.toFixed(2) + 'S → ' + (outBuf ? outBuf.duration.toFixed(2) : '—') + 'S';
  }

  /* ---------------- transformações no buffer ---------------- */
  function sliceBuffer(b, t0, t1) {
    var c = ac(), sr = b.sampleRate;
    var s0 = Math.max(0, Math.floor(t0 * sr)), s1 = Math.min(b.length, Math.floor(t1 * sr));
    var len = Math.max(1, s1 - s0);
    var out = c.createBuffer(b.numberOfChannels, len, sr);
    for (var ch = 0; ch < b.numberOfChannels; ch++) {
      out.getChannelData(ch).set(b.getChannelData(ch).subarray(s0, s1));
    }
    return out;
  }

  function reverseBuffer(b) {
    var c = ac(), out = c.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
    for (var ch = 0; ch < b.numberOfChannels; ch++) {
      var s = b.getChannelData(ch), d = out.getChannelData(ch);
      for (var i = 0; i < s.length; i++) d[i] = s[s.length - 1 - i];
    }
    return out;
  }

  function crushBuffer(b, bits, down, mix) {
    var c = ac(), out = c.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
    var levels = Math.pow(2, bits) - 1;
    for (var ch = 0; ch < b.numberOfChannels; ch++) {
      var s = b.getChannelData(ch), d = out.getChannelData(ch), hold = 0;
      for (var i = 0; i < s.length; i++) {
        if (i % down === 0) hold = Math.round((s[i] * 0.5 + 0.5) * levels) / levels * 2 - 1;
        d[i] = s[i] * (1 - mix) + hold * mix;
      }
    }
    return out;
  }

  function granularBuffer(b, grainMs, dens, spread, pitch) {
    var c = ac(), sr = b.sampleRate;
    var g = Math.max(64, Math.floor(grainMs / 1000 * sr));
    var out = c.createBuffer(b.numberOfChannels, b.length, sr);
    var step = Math.max(32, Math.floor(g / Math.max(0.2, dens)));
    for (var ch = 0; ch < b.numberOfChannels; ch++) {
      var s = b.getChannelData(ch), d = out.getChannelData(ch);
      for (var pos = 0; pos < s.length; pos += step) {
        var jitter = (Math.random() - 0.5) * spread * g * 6;
        var read = Math.max(0, Math.min(s.length - g - 1, Math.floor(pos + jitter)));
        var rate = pitch ? Math.pow(2, (Math.random() * 2 - 1) * pitch / 12) : 1;
        for (var i = 0; i < g; i++) {
          var w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / g);
          var ri = read + Math.floor(i * rate);
          if (ri >= s.length) break;
          var wi = pos + i;
          if (wi >= d.length) break;
          d[wi] += s[ri] * w * 0.75;
        }
      }
    }
    return out;
  }

  function stutterBuffer(b, sliceMs, rep, prob, revChance) {
    var c = ac(), sr = b.sampleRate;
    var sl = Math.max(64, Math.floor(sliceMs / 1000 * sr));
    var out = c.createBuffer(b.numberOfChannels, b.length, sr);
    for (var ch = 0; ch < b.numberOfChannels; ch++) {
      var s = b.getChannelData(ch), d = out.getChannelData(ch);
      var w = 0;
      while (w < d.length) {
        var read = w;
        if (Math.random() < prob) {
          var back = Math.floor(Math.random() * rep) + 1;
          read = Math.max(0, w - back * sl);
        }
        var rev = Math.random() < revChance;
        for (var i = 0; i < sl && w + i < d.length; i++) {
          var ri = rev ? (read + sl - 1 - i) : (read + i);
          d[w + i] = (ri >= 0 && ri < s.length) ? s[ri] : 0;
        }
        w += sl;
      }
    }
    return out;
  }

  function noiseBuffer(b, amt, type) {
    var c = ac(), out = c.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
    for (var ch = 0; ch < b.numberOfChannels; ch++) {
      var s = b.getChannelData(ch), d = out.getChannelData(ch), last = 0;
      for (var i = 0; i < s.length; i++) {
        var n;
        if (type < 0.5) n = (Math.random() * 2 - 1);
        else if (type < 1.5) { last = (last + (Math.random() * 2 - 1) * 0.1) * 0.98; n = last * 3; }
        else n = (Math.random() < 0.0025) ? (Math.random() * 2 - 1) * 4 : 0;
        d[i] = s[i] + n * amt;
      }
    }
    return out;
  }

  function makeIR(size, decay) {
    var c = ac(), sr = c.sampleRate, len = Math.max(1, Math.floor(sr * size));
    var ir = c.createBuffer(2, len, sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return ir;
  }

  function distCurve(drive) {
    var n = 8192, curve = new Float32Array(n), k = drive;
    for (var i = 0; i < n; i++) {
      var x = i * 2 / n - 1;
      curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
    }
    return curve;
  }

  function normalize(b) {
    var peak = 0;
    for (var ch = 0; ch < b.numberOfChannels; ch++) {
      var d = b.getChannelData(ch);
      for (var i = 0; i < d.length; i++) { var a = Math.abs(d[i]); if (a > peak) peak = a; }
    }
    if (peak > 0.0001 && Math.abs(peak - 0.99) > 0.01) {
      var g = 0.99 / peak;
      for (var c2 = 0; c2 < b.numberOfChannels; c2++) {
        var dd = b.getChannelData(c2);
        for (var j = 0; j < dd.length; j++) dd[j] *= g;
      }
    }
    return b;
  }

  /* ============================================ PROCESSADORES ============
     Cada módulo do rack declara COMO processa, e nada mais. Existem dois
     jeitos, porque há coisas que o grafo do Web Audio faz melhor (filtro,
     convolução, atraso) e coisas que só dá para fazer amostra a amostra
     (granular, espectral, glitch, esticar o tempo):

       buf(b, v)              transforma o buffer direto e devolve outro
       node(off, last, v)     acrescenta um nó no grafo e devolve o novo fim
       tail(v)                quanto de cauda em segundos o módulo acrescenta
       rate(v)                fator de velocidade de leitura (só VELOCIDADE)

     O registro é aberto: js/audiofx.js acrescenta módulos aqui sem tocar
     em nada do que já existe.                                           */
  var PROC = A.PROC = {};

  /* acrescenta um módulo ao rack existente — NÃO cria outro rack */
  A.register = function (mod, proc) {
    mod.values = {};
    mod.params.forEach(function (p) { mod.values[p.k] = p.def; });
    if (mod.on === undefined) mod.on = false;
    /* SAÍDA continua sendo o último da pilha, sempre */
    var iOut = MODULES.map(function (m) { return m.id; }).indexOf('out');
    if (iOut >= 0) MODULES.splice(iOut, 0, mod); else MODULES.push(mod);
    PROC[mod.id] = proc || {};
    return mod;
  };

  /* ---- processadores dos módulos que já existiam, sem mudar o som ---- */
  PROC.reverse = { buf: function (b) { return reverseBuffer(b); } };
  PROC.crush = { buf: function (b, v) { return crushBuffer(b, v.bits, v.down, v.mix); } };
  PROC.granular = { buf: function (b, v) { return granularBuffer(b, v.grain, v.dens, v.spread, v.pitch); } };
  PROC.stutter = { buf: function (b, v) { return stutterBuffer(b, v.slice, v.rep, v.prob, v.rev); } };
  PROC.noise = { buf: function (b, v) { return noiseBuffer(b, v.amt, v.type); } };

  PROC.rate = { rate: function (v) { return v.rate * Math.pow(2, v.semi / 12); } };

  PROC.filter = {
    node: function (off, last, v) {
      var f = off.createBiquadFilter();
      f.type = ['lowpass', 'highpass', 'bandpass', 'notch'][v.type | 0];
      f.frequency.value = v.freq;
      f.Q.value = v.q;
      last.connect(f); return f;
    }
  };

  PROC.dist = {
    node: function (off, last, v) {
      var ws = off.createWaveShaper();
      ws.curve = distCurve(v.drive);
      ws.oversample = '4x';
      var tone = off.createBiquadFilter();
      tone.type = 'lowpass'; tone.frequency.value = v.tone;
      var dry = off.createGain(), wet = off.createGain(), sum = off.createGain();
      dry.gain.value = 1 - v.mix; wet.gain.value = v.mix;
      last.connect(dry); dry.connect(sum);
      last.connect(ws); ws.connect(tone); tone.connect(wet); wet.connect(sum);
      return sum;
    }
  };

  PROC.trem = {
    node: function (off, last, v) {
      var tg = off.createGain();
      tg.gain.value = 1 - v.depth * 0.5;
      var lfo = off.createOscillator();
      lfo.type = v.shape > 0.5 ? 'square' : 'sine';
      lfo.frequency.value = v.rate;
      var lg = off.createGain();
      lg.gain.value = v.depth * 0.5;
      lfo.connect(lg); lg.connect(tg.gain); lfo.start(0);
      last.connect(tg); return tg;
    }
  };

  PROC.delay = {
    tail: function (v) { return v.time * 4; },
    node: function (off, last, v) {
      var dl = off.createDelay(2);
      dl.delayTime.value = v.time;
      var fb = off.createGain(); fb.gain.value = v.fb;
      var dwet = off.createGain(); dwet.gain.value = v.mix;
      var dsum = off.createGain();
      last.connect(dsum);
      last.connect(dl); dl.connect(fb); fb.connect(dl);
      dl.connect(dwet); dwet.connect(dsum);
      return dsum;
    }
  };

  PROC.reverb = {
    tail: function (v) { return v.size; },
    node: function (off, last, v) {
      var cv = off.createConvolver();
      cv.buffer = makeIR(v.size, v.decay);
      var rwet = off.createGain(); rwet.gain.value = v.mix;
      var rsum = off.createGain();
      last.connect(rsum);
      last.connect(cv); cv.connect(rwet); rwet.connect(rsum);
      return rsum;
    }
  };

  PROC.out = {
    node: function (off, last, v) {
      var g = off.createGain();
      g.gain.value = v.gain;
      last.connect(g);
      if (off.createStereoPanner) {
        var pan = off.createStereoPanner();
        pan.pan.value = v.pan;
        g.connect(pan); return pan;
      }
      return g;
    }
  };

  /* ============================================ RENDER COMPLETO =========
     A cadeia é a ORDEM DO RACK. Antes a ordem estava escrita no código —
     reverso, depois bitcrush, depois granular… — e mudar a ordem era mudar
     o código. Agora a lista de módulos É a cadeia: subir um módulo no rack
     muda o som.

     Módulos de buffer e módulos de grafo não podem ser misturados numa
     passada só, então a cadeia é quebrada em TRECHOS de mesmo tipo, e cada
     trecho é processado inteiro antes do seguinte. Quem não intercala paga
     uma renderização só, como antes.                                     */

  function tailOf(m) {
    var p = PROC[m.id];
    return (p && p.tail) ? (p.tail(m.values) || 0) : 0;
  }

  function renderTrechoNode(b, mods) {
    var rate = 1, tail = 0;
    mods.forEach(function (m) {
      var p = PROC[m.id];
      if (p && p.rate) rate = p.rate(m.values) || 1;
      tail += tailOf(m);
    });
    rate = Math.max(0.05, Math.min(16, rate));
    var outLen = Math.ceil((b.duration / rate + tail) * b.sampleRate);
    var off = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      Math.max(1, b.numberOfChannels), Math.max(1, outLen), b.sampleRate);
    var src = off.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = rate;
    var last = src;
    mods.forEach(function (m) {
      var p = PROC[m.id];
      if (p && p.node) last = p.node(off, last, m.values, off) || last;
    });
    last.connect(off.destination);
    src.start(0);
    return off.startRendering();
  }

  /* teto de duração: um esticador em 8× num arquivo longo geraria um
     buffer de minutos e travaria a aba. O teto é o MESMO limite de
     composição que você define no laboratório de vídeo.              */
  function avisarAparado() {
    if (avisarAparado.avisou) return;
    avisarAparado.avisou = true;
    VE.app.toast('a cadeia passou de ' + VE.limitLabel() + ' e foi aparada — o limite é o mesmo da composição', 'err');
    setTimeout(function () { avisarAparado.avisou = false; }, 4000);
  }

  function aparar(b) {
    var teto = Math.max(2, VE.MAXDUR || 600) * b.sampleRate;
    if (b.length <= teto) return b;
    avisarAparado();
    return sliceBuffer(b, 0, teto / b.sampleRate);
  }

  /* processa um módulo por vez AQUI, devolvendo o passo ao navegador entre
     eles: sem isso o aviso PROCESSANDO nunca chega a ser desenhado.  */
  function renderTrechoBufAqui(b, mods) {
    var i = 0;
    function passo() {
      if (i >= mods.length) return Promise.resolve(b);
      var m = mods[i++];
      var p = PROC[m.id];
      if (p && p.buf) {
        marcarProcessando(true, (m.name || m.id) + ' (' + i + ' de ' + mods.length + ')');
        try { b = aparar(p.buf(b, m.values, m) || b); }
        catch (e) { console.error('módulo ' + m.id + ': ' + e.message); }
      }
      return new Promise(function (r) { setTimeout(r, 0); }).then(passo);
    }
    return passo();
  }

  /* O TRABALHADOR (js/audiotrab.js) roda a MESMA biblioteca fora da linha
     principal. Ele não conhece os cinco processadores que moram aqui dentro
     — reverso, bitcrush, granular da base, gagueira e ruído —, e por isso a
     corrida é quebrada em pedaços do que ele sabe e do que fica aqui, NA
     ORDEM: a cadeia é a da pessoa e não pode ser reordenada.

     Se o trabalhador não existir, ou falhar no meio, o pedaço é calculado
     aqui como sempre foi. Ele acelera; não é dependência.            */
  function renderTrechoBuf(b, mods) {
    var T = A.trab;
    if (!T || !T.podeTentar()) return renderTrechoBufAqui(b, mods);
    return T.ligar().then(function (ok) {
      if (!ok) return renderTrechoBufAqui(b, mods);
      var partes = [], atual = null;
      mods.forEach(function (m) {
        var la = T.faz(m.id);
        if (!atual || atual.la !== la) { atual = { la: la, mods: [] }; partes.push(atual); }
        atual.mods.push(m);
      });
      var passo = Promise.resolve(b);
      partes.forEach(function (pt) {
        passo = passo.then(function (cur) {
          if (!pt.la) return renderTrechoBufAqui(cur, pt.mods);
          return T.processar(cur, pt.mods, function (a) {
            marcarProcessando(true, a.nome + ' (' + (a.i + 1) + ' de ' + a.n + ')');
          }).then(function (r) {
            if (r.cortou) avisarAparado();
            (r.erros || []).forEach(function (msg) { console.error('módulo ' + msg); });
            return r.buffer;
          }).catch(function (e) {
            if (e && e.cancelado) throw e;
            console.error('trabalhador: ' + e.message + ' — este pedaço volta para a linha principal');
            return renderTrechoBufAqui(cur, pt.mods);
          });
        });
      });
      return passo;
    });
  }

  /* a cadeia ativa, na ordem do rack, quebrada em trechos de mesmo tipo */
  function trechos() {
    var out = [];
    MODULES.forEach(function (m) {
      if (!m.on) return;
      var p = PROC[m.id];
      if (!p) return;
      var kind = p.buf ? 'buf' : 'node';
      /* VELOCIDADE não tem nó nem transformação: ele muda a leitura do
         trecho de grafo em que estiver                                */
      if (!p.buf && !p.node && !p.rate) return;
      var ultimo = out[out.length - 1];
      if (ultimo && ultimo.kind === kind) ultimo.mods.push(m);
      else out.push({ kind: kind, mods: [m] });
    });
    return out;
  }
  A.trechos = trechos;

  A.rerender = function () {
    if (!srcBuf || rendering) { dirty = true; return Promise.resolve(outBuf); }
    rendering = true; dirty = false;
    marcarProcessando(true);
    var b = srcBuf;

    if (sel.a != null && sel.b != null && Math.abs(sel.b - sel.a) > 0.02) {
      b = sliceBuffer(b, Math.min(sel.a, sel.b), Math.max(sel.a, sel.b));
    }

    var lista = trechos();
    var passo = Promise.resolve(b);
    lista.forEach(function (t) {
      passo = passo.then(function (cur) {
        return t.kind === 'buf' ? renderTrechoBuf(cur, t.mods) : renderTrechoNode(cur, t.mods);
      });
    });

    return passo.then(function (rendered) {
      var mOut = MODULES.filter(function (x) { return x.id === 'out'; })[0];
      if (mOut && mOut.on && mOut.values.norm > 0.5) VE.adsp.normalizar(rendered);
      outBuf = rendered;
      rendering = false;
      marcarProcessando(false);
      A.drawWave();
      updateInfo();
      VE.emit('audio');
      if (dirty) A.rerender();
      return rendered;
    }).catch(function (e) {
      rendering = false;
      marcarProcessando(false);
      /* desistir de um cálculo velho não é falha: é o que se pediu */
      if (e && e.cancelado) { if (dirty) A.rerender(); return outBuf; }
      console.error(e);
      VE.app.toast('falha ao processar: ' + e.message, 'err');
      return outBuf;
    });
  };

  /* aviso de que a cadeia está sendo calculada. Espectral e granular são
     caros de verdade; sem aviso, a espera parece travamento.          */
  function marcarProcessando(on, detalhe) {
    var v = $('#viewAudio');
    if (v) v.classList.toggle('processando', !!on);
    var el = $('#auInfo');
    if (!el) return;
    if (on) {
      /* guardar o texto de antes UMA vez: o andamento repinta esta linha a
         cada módulo, e sem a guarda o "antes" viraria o próprio aviso */
      if (el.dataset.antes === undefined) el.dataset.antes = el.textContent;
      el.textContent = detalhe ? ('PROCESSANDO · ' + detalhe) : 'PROCESSANDO A CADEIA…';
    } else if (el.dataset.antes !== undefined) {
      el.textContent = el.dataset.antes; delete el.dataset.antes;
    }
  }

  var reTimer = null;
  A.queueRender = function () {
    clearTimeout(reTimer);
    /* o controle mudou: o que está sendo calculado lá fora já não vale.
       Sem isto, mexer num trilho durante um ESPECTRAL longo esperaria o
       cálculo velho terminar para só então começar o novo.          */
    if (A.trab && A.trab.ocupado()) { dirty = true; A.trab.cancelar(); }
    reTimer = setTimeout(function () {
      var wasPlaying = playing;
      A.rerender().then(function () { if (wasPlaying) { stop(); play(); } });
    }, 220);
  };

  /* ---------------- transporte ---------------- */
  function play() {
    var bAtual = bufAtual();
    if (!bAtual) return;
    var c = ac();
    stopNode();
    node = c.createBufferSource();
    node.buffer = bAtual;
    node.loop = $('#auLoop').checked;
    node.connect(gainNode);
    gainNode.gain.value = parseFloat($('#auGain').value);
    node.start(0, Math.max(0, Math.min(offset, bAtual.duration - 0.01)));
    startedAt = c.currentTime - offset;
    playing = true;
    $('#auPlayBtn').textContent = '❚❚';
    loop();
  }
  function stopNode() { if (node) { try { node.stop(); } catch (e) { } node.disconnect(); node = null; } }
  function stop() {
    stopNode(); playing = false; offset = 0;
    var b = $('#auPlayBtn'); if (b) b.textContent = '▶';
    cancelAnimationFrame(raf);
    var ph = $('#auPlay'); if (ph) ph.style.left = '0px';
  }
  function pause() {
    if (!playing) return;
    offset = (ctx.currentTime - startedAt) % ((bufAtual() || { duration: 1 }).duration || 1);
    stopNode(); playing = false;
    $('#auPlayBtn').textContent = '▶';
    cancelAnimationFrame(raf);
  }
  A.play = play; A.stop = stop; A.pause = pause;
  /* um só lugar decide o que a barra de espaço faz aqui: tocar se está
     parado, pausar se está tocando. O botão ▶ chama exatamente o mesmo. */
  A.toggle = function () {
    if (!bufAtual()) { VE.app.toast('carregue um áudio primeiro — coluna da esquerda'); return; }
    if (playing) pause(); else play();
  };
  A.voltarAoInicio = function () { offset = 0; if (playing) { stop(); play(); } };
  A.playing = function () { return playing; };

  function loop() {
    if (!playing) return;
    raf = requestAnimationFrame(loop);
    var t = (ctx.currentTime - startedAt);
    var bA = bufAtual();
    if (bA && t > bA.duration) {
      if ($('#auLoop').checked) { startedAt = ctx.currentTime; t = 0; }
      else { stop(); return; }
    }
    var wrap = $('#auWaveWrap');
    if (wrap && bA) {
      $('#auPlay').style.left = (t / bA.duration * wrap.clientWidth) + 'px';
      $('#auTime').textContent = fmt(t);
    }
    drawAnalyser();
  }

  function fmt(t) {
    var m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t % 1) * 100);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + (c < 10 ? '0' : '') + c;
  }

  /* ---------------- desenho ---------------- */
  A.drawWave = function () {
    var cv = $('#auWave'), wrap = $('#auWaveWrap');
    if (!cv || !wrap) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = wrap.clientWidth || 800, H = 186;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.height = H + 'px';
    var c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var css = getComputedStyle(document.documentElement);
    var paper = css.getPropertyValue('--paper').trim();
    var ink = css.getPropertyValue('--ink').trim();
    var rule = css.getPropertyValue('--rule').trim();
    c.fillStyle = paper; c.fillRect(0, 0, W, H);
    /* grade */
    c.strokeStyle = rule; c.lineWidth = 1;
    for (var i = 1; i < 10; i++) {
      c.beginPath(); c.moveTo(W * i / 10, 0); c.lineTo(W * i / 10, H); c.stroke();
    }
    c.beginPath(); c.moveTo(0, H / 2 + .5); c.lineTo(W, H / 2 + .5); c.stroke();
    var bDraw = bufAtual();
    if (!bDraw) {
      c.fillStyle = css.getPropertyValue('--ink-3').trim();
      c.font = '10px "JetBrains Mono", monospace';
      c.fillText('SEM ÁUDIO — CARREGUE UM ARQUIVO NA COLUNA DA ESQUERDA', 12, H / 2 - 8);
      return;
    }
    var d = bDraw.getChannelData(0);
    var step = Math.max(1, Math.floor(d.length / W));
    c.fillStyle = css.getPropertyValue('--ch-audio').trim() || ink;
    for (var x = 0; x < W; x++) {
      var mn = 1, mx = -1;
      for (var j = 0; j < step; j++) {
        var v = d[x * step + j] || 0;
        if (v < mn) mn = v; if (v > mx) mx = v;
      }
      var y1 = (1 - (mx * 0.92 + 1) / 2) * H, y2 = (1 - (mn * 0.92 + 1) / 2) * H;
      c.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }
    /* seleção */
    var s = $('#auSel');
    if (sel.a != null && sel.b != null && srcBuf) {
      var a = Math.min(sel.a, sel.b) / srcBuf.duration * W;
      var b2 = Math.max(sel.a, sel.b) / srcBuf.duration * W;
      s.classList.remove('hidden');
      s.style.left = a + 'px'; s.style.width = Math.max(1, b2 - a) + 'px';
      $('#auRange').textContent = 'SEL ' + fmt(Math.min(sel.a, sel.b)) + ' → ' + fmt(Math.max(sel.a, sel.b));
    } else {
      s.classList.add('hidden');
      $('#auRange').textContent = 'SEL —';
    }
  };

  /* ============================================ ANALISADOR ==============
     O mesmo painel de antes, com quatro leituras em vez de uma. Todas
     lêem o MESMO analisador do grafo — não há segunda cadeia de áudio.

       ESPECTRO       barras por faixa, escala perceptual
       ESPECTROGRAMA  o espectro rolando no tempo, como uma esteira
       MEDIDORES      pico, RMS e correlação estéreo, com retenção de pico
       OSCILOSCÓPIO   a forma de onda instantânea

     Este é também o lugar onde `VE.reactive` nasce: os valores que o
     laboratório de vídeo já consome como `uAudio` nos shaders.        */
  A.visMode = 'spectrum';
  var espectroImg = null, espectroCol = 0;
  var picoL = 0, picoR = 0, picoHoldL = 0, picoHoldR = 0;

  function limparEspectrograma() { espectroImg = null; espectroCol = 0; }
  A.limparVis = limparEspectrograma;

  function drawAnalyser() {
    var cv = $('#auAnalyser');
    if (!cv || !analyser) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = cv.parentElement.clientWidth, H = 52;
    if (cv.width !== Math.floor(W * dpr)) { cv.width = W * dpr; cv.height = H * dpr; limparEspectrograma(); }
    var c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var css = getComputedStyle(document.documentElement);
    var paper = css.getPropertyValue('--paper').trim();
    var verde = css.getPropertyValue('--ch-audio').trim();
    var ink3 = css.getPropertyValue('--ink-3').trim();

    var n = analyser.frequencyBinCount;
    var data = new Uint8Array(n);
    analyser.getByteFrequencyData(data);

    /* ---- os valores que alimentam o áudio reativo, sempre ---- */
    var bass = 0, mid = 0, treb = 0, bars = 96;
    for (var i = 0; i < bars; i++) {
      var idx = Math.floor(Math.pow(i / bars, 2) * n);
      var v = data[idx] / 255;
      if (i < bars * 0.15) bass += v; else if (i < bars * 0.5) mid += v; else treb += v;
    }
    var td = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(td);
    var somaQ = 0, pico = 0;
    for (var q = 0; q < td.length; q++) {
      var x = (td[q] - 128) / 128;
      somaQ += x * x;
      if (Math.abs(x) > pico) pico = Math.abs(x);
    }
    var rms = Math.sqrt(somaQ / td.length);
    /* transiente: o quanto o pico saltou desde o quadro anterior */
    var transiente = Math.max(0, pico - picoL) * 3;
    picoL = picoL * 0.72 + pico * 0.28;

    VE.reactive = {
      bass: bass / (bars * 0.15), mid: mid / (bars * 0.35), treble: treb / (bars * 0.5),
      level: (bass + mid + treb) / bars,
      rms: rms, peak: pico, transient: Math.min(1, transiente)
    };
    if (VE.reactMap) VE.reactMap.tick(VE.reactive);

    /* ------------------------------- desenho, conforme o modo escolhido */
    var modo = A.visMode;
    if (modo === 'spectrogram') {
      if (!espectroImg) { espectroImg = c.createImageData(1, Math.floor(H)); espectroCol = 0; }
      /* rola um pixel para a esquerda e desenha a coluna nova na direita */
      var img = c.getImageData(dpr, 0, cv.width - dpr, cv.height);
      c.putImageData(img, 0, 0);
      for (var y = 0; y < H; y++) {
        var f = 1 - y / H;
        var bin = Math.floor(Math.pow(f, 2.2) * n);
        var m = data[bin] / 255;
        /* papel → verde do canal → tinta: escala de densidade, não arco-íris */
        var r0 = 239 - m * 200, g0 = 237 - m * 110, b0 = 228 - m * 190;
        c.fillStyle = 'rgb(' + (r0 | 0) + ',' + (g0 | 0) + ',' + (b0 | 0) + ')';
        c.fillRect(W - 1, y, 1, 1);
      }
      return;
    }

    c.fillStyle = paper; c.fillRect(0, 0, W, H);

    if (modo === 'meters') {
      var canais = [{ p: pico, r: rms, y: 6, lbl: 'L' }, { p: pico, r: rms, y: 28, lbl: 'R' }];
      picoHoldL = Math.max(picoHoldL * 0.985, pico);
      picoHoldR = Math.max(picoHoldR * 0.985, rms);
      c.font = '8px "JetBrains Mono", monospace';
      canais.forEach(function (ch, k) {
        var x0 = 34, w = W - 46;
        c.fillStyle = ink3; c.fillText(ch.lbl, 10, ch.y + 11);
        c.strokeStyle = css.getPropertyValue('--rule').trim();
        c.strokeRect(x0 + 0.5, ch.y + 0.5, w, 14);
        var val = k === 0 ? ch.p : ch.r;
        c.fillStyle = verde;
        c.fillRect(x0 + 1, ch.y + 1, Math.max(0, val * (w - 2)), 13);
        /* últimos 3 dB em laranja: é o aviso de que vai estourar */
        if (val > 0.71) {
          c.fillStyle = css.getPropertyValue('--sys-orange').trim();
          c.fillRect(x0 + 1 + 0.71 * (w - 2), ch.y + 1, Math.max(0, (val - 0.71) * (w - 2)), 13);
        }
        var hold = k === 0 ? picoHoldL : picoHoldR;
        c.fillStyle = css.getPropertyValue('--ink').trim();
        c.fillRect(x0 + 1 + hold * (w - 2), ch.y + 1, 1.5, 13);
        var db = val > 0.0001 ? (20 * Math.log10(val)).toFixed(1) : '-∞';
        c.fillStyle = ink3;
        c.fillText((k === 0 ? 'PICO ' : 'RMS  ') + db + ' dB', W - 96, ch.y + 11);
      });
      return;
    }

    if (modo === 'scope') {
      c.strokeStyle = css.getPropertyValue('--rule').trim(); c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, H / 2 + 0.5); c.lineTo(W, H / 2 + 0.5); c.stroke();
      c.strokeStyle = verde; c.lineWidth = 1.2;
      c.beginPath();
      for (var s2 = 0; s2 < W; s2++) {
        var ti = Math.floor(s2 / W * td.length);
        var yv = H / 2 - ((td[ti] - 128) / 128) * (H / 2 - 3);
        if (s2 === 0) c.moveTo(s2, yv); else c.lineTo(s2, yv);
      }
      c.stroke();
      return;
    }

    /* espectro (padrão) */
    var bw = W / bars;
    c.fillStyle = verde;
    for (var j = 0; j < bars; j++) {
      var id2 = Math.floor(Math.pow(j / bars, 2) * n);
      var v2 = data[id2] / 255;
      c.fillRect(j * bw, H - v2 * H, Math.max(1, bw - 1), v2 * H);
    }
  }

  /* ============================================ INTERFACE DO RACK =======
     O mesmo rack de sempre: um cartão por módulo, com o interruptor no
     cabeçalho e os controles embaixo. O que mudou é que a lista cresceu,
     então ela ganhou filtro por família e busca; e que a ORDEM do rack é
     a ordem da cadeia, então cada cartão ganhou setas para subir e descer.
     ====================================================================== */

  var uidc = 0;
  function uidOf(m) { if (!m.uid) m.uid = 'm' + (++uidc); return m.uid; }
  MODULES.forEach(uidOf);

  var famAtual = 'todos', buscaAtual = '';
  A.trilha = [];          /* pilha de mutações, para o ↶ */

  /* um parâmetro pode depender de outro (`when`): só aparece quando o
     seletor dono está no valor certo. Sem isso, ESPECTRAL mostraria oito
     controles com cinco deles inertes — e controle inerte é controle falso. */
  function visivel(m, p) {
    if (!p.when) return true;
    var v = m.values[p.when.k];
    return p.when.vals.indexOf(v | 0) >= 0;
  }

  function paramHtml(m, p) {
    var u = uidOf(m);
    if (!visivel(m, p)) return '';
    var trava = (m.lock && m.lock[p.k]) ? ' on' : '';
    var cad = '<button class="mlock' + trava + '" data-lock="' + u + '|' + p.k + '" title="Travar contra a mutação">▪</button>';
    var dica = p.dica ? ' title="' + p.dica + '"' : '';
    var nota = p.nota ? '<div class="pnote">' + p.nota + '</div>' : '';

    if (p.t === 's') {
      /* O MENU OCUPA A LINHA INTEIRA. Espremido na coluna de 54 px ele
         virava um quadradinho onde não dava para ler "SUBAQUÁTICO" — e
         as doze opções pareciam não existir.                          */
      return '<div class="prow" style="grid-template-columns:1fr auto"><label' + dica + '>' + p.label + '</label>' + cad + '</div>' +
        '<div class="prow-slider"><select class="field" data-am="' + u + '" data-ak="' + p.k + '" style="width:100%">' +
        p.opts.map(function (o, j) { return '<option value="' + j + '"' + ((m.values[p.k] | 0) === j ? ' selected' : '') + '>' + o + '</option>'; }).join('') +
        '</select></div>' + nota;
    }
    if (p.t === 'b') {
      return '<div class="prow"><label' + dica + '>' + p.label + '</label>' +
        '<input type="checkbox" data-am="' + u + '" data-ak="' + p.k + '"' + (m.values[p.k] ? ' checked' : '') + '>' + cad + '</div>' + nota;
    }
    return '<div class="prow"><label' + dica + '>' + p.label + '</label>' +
      '<input class="field num" data-anum="' + u + '|' + p.k + '" value="' + m.values[p.k] + '">' + cad + '</div>' +
      '<div class="prow-slider"><input type="range" data-am="' + u + '" data-ak="' + p.k + '" min="' + p.min + '" max="' + p.max + '" step="' + p.step + '" value="' + m.values[p.k] + '"></div>' + nota;
  }

  function combina(m) {
    if (famAtual !== 'todos' && (m.fam || 'base') !== famAtual) return false;
    if (!buscaAtual) return true;
    return (m.name + ' ' + (m.desc || '') + ' ' + m.id).toLowerCase().indexOf(buscaAtual) >= 0;
  }

  A.renderRack = function () {
    var rack = $('#auRack');
    if (!rack) return;
    var vis = MODULES.filter(combina);
    rack.innerHTML = vis.map(function (m) {
      var u = uidOf(m), i = MODULES.indexOf(m);
      var h = '<div class="module" data-mod="' + u + '">' +
        '<div class="module-h"><span class="mno">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="mnm" title="' + (m.desc || m.name) + '">' + m.name + '</span>' +
        '<span class="mops">' +
        '<button data-move="' + u + '|-1" title="Subir na cadeia">↑</button>' +
        '<button data-move="' + u + '|1" title="Descer na cadeia">↓</button>' +
        '<button data-dup="' + u + '" title="Duplicar este módulo">⧉</button>' +
        (m.clone ? '<button data-del="' + u + '" title="Remover esta cópia">✕</button>' : '') +
        '</span>' +
        '<button class="mtog' + (m.on ? ' on' : '') + '" data-tog="' + u + '" title="Ligar / ignorar"></button></div>' +
        '<div class="module-b">';
      var corpo = m.params.map(function (p) { return paramHtml(m, p); }).join('');
      h += corpo || '<div class="pnote">liga/desliga</div>';
      return h + '</div></div>';
    }).join('') || '<div class="insp-empty">nenhum módulo com esse nome</div>';

    var cnt = $('#auFams');
    if (cnt) cnt.querySelectorAll('.chip').forEach(function (c) {
      c.classList.toggle('on', c.dataset.fam === famAtual);
    });
    ligarRack(rack);
    A.renderChain();
  };

  function porUid(u) { return MODULES.filter(function (m) { return m.uid === u; })[0]; }

  function ligarRack(rack) {
    rack.querySelectorAll('[data-tog]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = porUid(b.dataset.tog);
        m.on = !m.on;
        b.classList.toggle('on', m.on);
        A.renderChain();
        A.queueRender();
      });
    });
    rack.querySelectorAll('[data-move]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.dataset.move.split('|');
        A.mover(p[0], parseInt(p[1], 10));
      });
    });
    rack.querySelectorAll('[data-dup]').forEach(function (b) {
      b.addEventListener('click', function () { A.duplicar(b.dataset.dup); });
    });
    rack.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () { A.remover(b.dataset.del); });
    });
    rack.querySelectorAll('[data-lock]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.dataset.lock.split('|');
        var m = porUid(p[0]);
        m.lock = m.lock || {};
        m.lock[p[1]] = !m.lock[p[1]];
        b.classList.toggle('on', !!m.lock[p[1]]);
      });
    });
    rack.querySelectorAll('[data-am]').forEach(function (el) {
      var aplicar = function () {
        var m = porUid(el.dataset.am);
        if (!m) return;
        var v = el.type === 'checkbox' ? (el.checked ? 1 : 0) : parseFloat(el.value);
        m.values[el.dataset.ak] = v;
        var num = rack.querySelector('[data-anum="' + el.dataset.am + '|' + el.dataset.ak + '"]');
        if (num) num.value = v;
        /* um seletor pode revelar ou esconder outros controles */
        if (el.tagName === 'SELECT' && m.params.some(function (p) { return p.when && p.when.k === el.dataset.ak; })) {
          A.renderRack();
        }
        A.queueRender();
      };
      el.addEventListener('input', aplicar);
      el.addEventListener('change', aplicar);
    });
    rack.querySelectorAll('[data-anum]').forEach(function (el) {
      el.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') el.blur(); });
      el.addEventListener('change', function () {
        var parts = el.dataset.anum.split('|');
        var rng = rack.querySelector('[data-am="' + parts[0] + '"][data-ak="' + parts[1] + '"]');
        if (rng) { rng.value = el.value; rng.dispatchEvent(new Event('input')); }
      });
    });
  }

  /* ------------------------------------------------- ordem, cópia, remoção */
  A.mover = function (u, dir) {
    var m = porUid(u), i = MODULES.indexOf(m);
    var j = i + dir;
    if (i < 0 || j < 0 || j >= MODULES.length) return;
    MODULES.splice(i, 1);
    MODULES.splice(j, 0, m);
    A.renderRack();
    A.queueRender();
  };

  A.duplicar = function (u) {
    var m = porUid(u), i = MODULES.indexOf(m);
    var copia = {
      id: m.id, name: m.name, fam: m.fam, desc: m.desc, params: m.params,
      on: m.on, clone: true, values: JSON.parse(JSON.stringify(m.values)),
      lock: JSON.parse(JSON.stringify(m.lock || {}))
    };
    uidOf(copia);
    MODULES.splice(i + 1, 0, copia);
    A.renderRack();
    A.queueRender();
    VE.app.toast(m.name + ' duplicado — a cadeia passa duas vezes por ele');
  };

  A.remover = function (u) {
    var m = porUid(u);
    if (!m || !m.clone) return;
    MODULES.splice(MODULES.indexOf(m), 1);
    A.renderRack();
    A.queueRender();
  };

  /* ------------------------------------------------------------- MUTAÇÃO
     Sorteia novos valores para os parâmetros DESTRAVADOS dos módulos
     ligados. A semente manda: a mesma semente com a mesma cadeia devolve
     exatamente a mesma mutação, então dá para voltar a um achado.       */
  A.mutar = function (forca) {
    var ligados = MODULES.filter(function (m) { return m.on && m.id !== 'out'; });
    if (!ligados.length) { VE.app.toast('ligue ao menos um módulo para mutar', 'err'); return; }
    A.trilha.push(MODULES.map(function (m) { return { u: m.uid, v: JSON.parse(JSON.stringify(m.values)) }; }));
    if (A.trilha.length > 30) A.trilha.shift();
    var semente = parseInt(($('#auSeed') || {}).value, 10) || 7;
    var r = VE.adsp.rng(semente * 7919 + Math.floor(forca * 1000) + A.trilha.length * 31);
    var n = 0;
    ligados.forEach(function (m) {
      m.params.forEach(function (p) {
        if (p.k === 'seed') { m.values[p.k] = 1 + Math.floor(r() * 998); n++; return; }
        if (m.lock && m.lock[p.k]) return;
        if (!visivel(m, p)) return;
        if (p.t === 's') {
          if (r() < forca) { m.values[p.k] = Math.floor(r() * p.opts.length); n++; }
          return;
        }
        if (p.t === 'b') {
          if (r() < forca * 0.5) { m.values[p.k] = r() < 0.5 ? 0 : 1; n++; }
          return;
        }
        /* desvio proporcional à força, em torno do valor atual */
        var faixa = (p.max - p.min);
        var alvo = m.values[p.k] + (r() * 2 - 1) * faixa * forca;
        if (forca > 0.7 && r() < 0.4) alvo = p.min + r() * faixa;   /* salto */
        m.values[p.k] = Math.max(p.min, Math.min(p.max, Math.round(alvo / p.step) * p.step));
        n++;
      });
    });
    A.renderRack();
    A.queueRender();
    VE.app.toast(n + ' parâmetros mutados · semente ' + semente + ' · ↶ desfaz');
  };

  A.desmutar = function () {
    var snap = A.trilha.pop();
    if (!snap) { VE.app.toast('nada para desfazer'); return; }
    snap.forEach(function (s) {
      var m = porUid(s.u);
      if (m) m.values = s.v;
    });
    A.renderRack();
    A.queueRender();
  };

  /* --------------------------------------------------- CADEIA NA COLUNA
     O bloco CADEIA da coluna esquerda existia vazio desde sempre. Agora
     ele mostra o caminho do sinal na ordem real, e clicar leva ao módulo. */
  A.renderChain = function () {
    var box = $('#auChain');
    if (!box) return;
    /* SAÍDA não entra no laço: ela já é o último passo desenhado à mão.
       Sem este filtro ela aparecia duas vezes na cadeia.               */
    var ligados = MODULES.filter(function (m) { return m.on && m.id !== 'out'; });
    var h = '<div class="chain"><div class="chain-step chain-src">ÁUDIO</div>';
    ligados.forEach(function (m) {
      var p = PROC[m.id] || {};
      var tipo = p.buf ? 'buffer' : 'grafo';
      h += '<div class="chain-step" data-goto="' + m.uid + '" title="' + (m.desc || '') + ' · ' + tipo + '">' +
        '<i class="chain-k chain-' + tipo + '"></i>' + m.name + '</div>';
    });
    h += '<div class="chain-step chain-out">SAÍDA</div></div>';
    if (!ligados.length) h += '<div class="pnote">ligue módulos no rack — a ordem deles aqui é a ordem do processamento</div>';
    box.innerHTML = h;
    box.querySelectorAll('[data-goto]').forEach(function (el) {
      el.addEventListener('click', function () {
        var m = porUid(el.dataset.goto);
        if (!m) return;
        famAtual = 'todos'; buscaAtual = '';
        var busca = $('#auSearch'); if (busca) busca.value = '';
        A.renderRack();
        var card = document.querySelector('#auRack [data-mod="' + m.uid + '"]');
        if (card) {
          card.scrollIntoView({ block: 'center' });
          card.classList.add('module-pisca');
          setTimeout(function () { card.classList.remove('module-pisca'); }, 900);
        }
      });
    });
  };

  A.initUI = function () {
    /* seletor de famílias — mesmo componente dos chips do laboratório 01 */
    var fams = $('#auFams');
    if (fams) {
      fams.innerHTML = (A.FAMS || [{ id: 'todos', label: 'todos' }]).map(function (f) {
        var n = f.id === 'todos' ? MODULES.length : MODULES.filter(function (m) { return (m.fam || 'base') === f.id; }).length;
        return '<button class="chip fam-chip' + (f.id === famAtual ? ' on' : '') + '" data-fam="' + f.id + '">' +
          '<span class="chip-t">' + f.label + '</span><b class="chip-n">' + n + '</b></button>';
      }).join('');
      fams.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('.chip') : null;
        if (!b) return;
        famAtual = b.dataset.fam;
        A.renderRack();
      });
    }
    var busca = $('#auSearch');
    if (busca) busca.addEventListener('input', function () {
      buscaAtual = busca.value.trim().toLowerCase();
      A.renderRack();
    });
    document.querySelectorAll('[data-mut]').forEach(function (b) {
      b.addEventListener('click', function () { A.mutar(parseFloat(b.dataset.mut)); });
    });
    var un = $('#auUndoMut');
    if (un) un.addEventListener('click', A.desmutar);
    var sd = $('#auSeed');
    if (sd) sd.addEventListener('keydown', function (e) { e.stopPropagation(); });

    /* escuta A/B — o original contra o processado, sem desfazer a cadeia */
    var la = $('#auListenA'), lb = $('#auListenB');
    function escuta(qual) {
      A.listen = qual;
      if (la) la.classList.toggle('on', qual === 'a');
      if (lb) lb.classList.toggle('on', qual === 'b');
      A.drawWave();
      if (playing) { var t = offset; stop(); offset = t; play(); }
    }
    if (la) la.addEventListener('click', function () { escuta('a'); });
    if (lb) lb.addEventListener('click', function () { escuta('b'); });

    /* modo do analisador */
    var vis = $('#auVis');
    if (vis) vis.addEventListener('change', function () { A.visMode = vis.value; limparEspectrograma(); });

    A.renderRack();

    /* transporte */
    $('#auPlayBtn').addEventListener('click', function () {
      if (!outBuf) { VE.app.toast('carregue um áudio'); return; }
      playing ? pause() : play();
    });
    $('#auStop').addEventListener('click', stop);
    $('#auStart').addEventListener('click', function () { offset = 0; if (playing) { stop(); play(); } });
    $('#auGain').addEventListener('input', function () { if (gainNode) gainNode.gain.value = parseFloat(this.value); });
    $('#auClearSel').addEventListener('click', function () { sel.a = sel.b = null; A.queueRender(); A.drawWave(); });
    $('#auTrim').addEventListener('click', function () {
      if (sel.a == null || sel.b == null) { VE.app.toast('arraste na onda para selecionar'); return; }
      srcBuf = sliceBuffer(srcBuf, Math.min(sel.a, sel.b), Math.max(sel.a, sel.b));
      sel.a = sel.b = null;
      A.rerender();
      VE.app.toast('cortado', 'ok');
    });

    /* seleção na onda */
    var wrap = $('#auWaveWrap');
    wrap.addEventListener('pointerdown', function (e) {
      if (!srcBuf) return;
      wrap.setPointerCapture(e.pointerId);
      var r = wrap.getBoundingClientRect();
      var t = (e.clientX - r.left) / r.width * srcBuf.duration;
      dragSel = { start: t };
      sel.a = t; sel.b = t;
      A.drawWave();
    });
    wrap.addEventListener('pointermove', function (e) {
      if (!dragSel || !srcBuf) return;
      var r = wrap.getBoundingClientRect();
      sel.b = Math.max(0, Math.min(srcBuf.duration, (e.clientX - r.left) / r.width * srcBuf.duration));
      A.drawWave();
    });
    wrap.addEventListener('pointerup', function () {
      if (!dragSel) return;
      dragSel = null;
      if (sel.a != null && sel.b != null && Math.abs(sel.b - sel.a) < 0.02) { sel.a = sel.b = null; A.drawWave(); return; }
      A.queueRender();
    });

    window.addEventListener('resize', function () { A.drawWave(); });
    A.drawWave();
    renderPresets();
    VE.on('presets', renderPresets);
  };

  /* ================================================ PRESETS =============
     Duas listas no mesmo lugar: os PRONTOS que vêm com o laboratório e os
     SEUS, salvos no navegador. Um preset guarda a cadeia inteira — quais
     módulos, em que ORDEM, com que valores e o que está travado.        */

  function aplicarCadeia(lista) {
    /* apaga as cópias antigas e desliga tudo: o preset manda na cadeia */
    for (var i = MODULES.length - 1; i >= 0; i--) if (MODULES[i].clone) MODULES.splice(i, 1);
    MODULES.forEach(function (m) { if (m.id !== 'out') m.on = false; });

    var ordenados = [];
    lista.forEach(function (sv) {
      var base = MODULES.filter(function (x) { return x.id === sv.id && ordenados.indexOf(x) < 0; })[0];
      if (!base) {
        /* segunda ocorrência do mesmo módulo: entra como cópia */
        var molde = MODULES.filter(function (x) { return x.id === sv.id; })[0];
        if (!molde) return;
        base = {
          id: molde.id, name: molde.name, fam: molde.fam, desc: molde.desc,
          params: molde.params, clone: true, values: {}, lock: {}
        };
        molde.params.forEach(function (p) { base.values[p.k] = p.def; });
        MODULES.push(base);
      }
      base.on = sv.on !== false;
      Object.keys(sv.values || {}).forEach(function (k) {
        if (base.values[k] !== undefined) base.values[k] = sv.values[k];
      });
      base.lock = sv.lock || {};
      ordenados.push(base);
    });
    /* a ordem do preset vira a ordem do rack; o resto vai para o fim.
       SAÍDA é tirada da lista antes de remontar, senão ela entraria duas
       vezes: uma por vir no preset e outra por ser sempre a última.     */
    var meio = ordenados.filter(function (m) { return m.id !== 'out'; });
    var resto = MODULES.filter(function (m) { return meio.indexOf(m) < 0 && m.id !== 'out'; });
    var saida = MODULES.filter(function (m) { return m.id === 'out'; });
    MODULES.length = 0;
    meio.concat(resto, saida).forEach(function (m) { MODULES.push(m); });
    MODULES.forEach(function (m) { if (!m.uid) m.uid = 'm' + (++uidc); });
  }
  A.aplicarCadeia = aplicarCadeia;

  A.cadeiaAtual = function () {
    return MODULES.filter(function (m) { return m.on || m.id === 'out'; })
      .map(function (m) {
        return { id: m.id, on: m.on, values: JSON.parse(JSON.stringify(m.values)), lock: m.lock || {} };
      });
  };

  function renderPresets() {
    var box = $('#auPresets');
    if (!box) return;
    var lista = VE.presets.list('audio');
    var prontos = A.PRESETS || [];
    var grupos = {};
    prontos.forEach(function (p) { (grupos[p.grupo] = grupos[p.grupo] || []).push(p); });

    var h = '<div class="pad"><button class="cmd cmd-sm" id="auSavePreset" style="width:100%;justify-content:center">+ SALVAR ESTA CADEIA</button></div>';
    Object.keys(grupos).forEach(function (g) {
      h += '<div class="subhead">' + g + '</div>';
      h += grupos[g].map(function (p) {
        return '<div class="preset" data-pronto="' + p.id + '" title="' + (p.desc || '') + '">' +
          '<span class="pno">' + p.code + '</span><span class="pnm">' + p.name + '</span></div>';
      }).join('');
    });
    if (lista.length) {
      h += '<div class="subhead">SEUS</div>';
      h += lista.map(function (p) {
        return '<div class="preset" data-ap="' + p.id + '"><span class="pno">' + p.code + '</span>' +
          '<span class="pnm">' + p.name + '</span><button class="pdel" data-del="' + p.id + '">✕</button></div>';
      }).join('');
    }
    box.innerHTML = h;

    var sb = $('#auSavePreset');
    if (sb) sb.addEventListener('click', function () {
      var n = prompt('nome do preset de áudio:', 'CADEIA');
      if (!n) return;
      VE.presets.add('audio', n, A.cadeiaAtual());
    });
    box.querySelectorAll('[data-pronto]').forEach(function (el) {
      el.addEventListener('click', function () {
        var p = prontos.filter(function (x) { return x.id === el.dataset.pronto; })[0];
        if (!p) return;
        aplicarCadeia(p.chain);
        A.renderRack();
        A.queueRender();
        VE.app.toast(p.name + ' — ' + (p.desc || 'cadeia aplicada'));
      });
    });
    box.querySelectorAll('[data-ap]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.dataset.del) { VE.presets.remove(e.target.dataset.del); return; }
        var p = VE.presets.get(el.dataset.ap);
        if (!p) return;
        aplicarCadeia(p.data);
        A.renderRack();
        A.queueRender();
      });
    });
  }

  /* ---------------- WAV ---------------- */
  A.encodeWav = function (buf) {
    var ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
    var bytes = 44 + len * ch * 2;
    var ab = new ArrayBuffer(bytes), v = new DataView(ab);
    function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    str(0, 'RIFF'); v.setUint32(4, bytes - 8, true); str(8, 'WAVE');
    str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, len * ch * 2, true);
    var o = 44, chans = [];
    for (var c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
    for (var i = 0; i < len; i++) {
      for (var c2 = 0; c2 < ch; c2++) {
        var s = Math.max(-1, Math.min(1, chans[c2][i]));
        v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        o += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  };

  A.exportWav = function () {
    if (!outBuf) { VE.app.toast('nada para exportar'); return; }
    var blob = A.encodeWav(outBuf);
    VE.saveFile(VE.BRAND.slug + '-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.wav', blob);
  };

  A.sendToTimeline = function () {
    if (!outBuf) { VE.app.toast('nada para enviar'); return; }
    var blob = A.encodeWav(outBuf);
    VE.media.loadAudioBlob(blob, name.replace(/\.[^.]+$/, '') + '.wav').then(function (id) {
      VE.addMedia({ kind: 'audio', name: name, src: id, dur: Math.min(outBuf.duration, VE.MAXDUR) });
      VE.pushHistory(); VE.emit('project');
      VE.app.toast('áudio enviado para a linha do tempo', 'ok');
    });
  };

})(window.VE);
