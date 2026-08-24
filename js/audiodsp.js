/* ============================================================
   rgb_lab — BIBLIOTECA DE PROCESSAMENTO DE ÁUDIO
   ------------------------------------------------------------
   Funções puras que operam sobre AudioBuffer. Nada aqui desenha,
   nada aqui conhece a interface: só matemática de sinal.

   Existe para que os MÓDULOS do rack de áudio (js/audiofx.js)
   sejam declarações curtas, e para que cada controle mexa em
   processamento de verdade — não há controle decorativo.

   Convenções
   ----------
   · toda função recebe e devolve AudioBuffer;
   · o contexto vem de fora (`VE.audio.context()`), porque quem
     manda na taxa de amostragem é o laboratório;
   · aleatoriedade SEMPRE por semente: a mesma semente com os
     mesmos parâmetros devolve exatamente o mesmo áudio.
   ============================================================ */
(function (VE) {
  'use strict';

  var D = VE.adsp = {};

  /* ================================================== ALEATÓRIO COM SEMENTE
     Nada usa Math.random. Sem isso, MUTATE e os módulos generativos
     dariam um resultado diferente a cada re-render, e o áudio mudaria
     sozinho ao mexer num controle que nada tem a ver.                 */
  D.rng = function (seed) {
    var a = (seed | 0) >>> 0 || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ---------------------------------------------------------- utilidades */
  function ctxOf() { return VE.audio.context(); }

  D.make = function (ch, len, sr) {
    return ctxOf().createBuffer(Math.max(1, ch), Math.max(1, Math.floor(len)), sr);
  };

  D.like = function (b, len) {
    return D.make(b.numberOfChannels, len === undefined ? b.length : len, b.sampleRate);
  };

  D.copy = function (b) {
    var o = D.like(b);
    for (var c = 0; c < b.numberOfChannels; c++) o.getChannelData(c).set(b.getChannelData(c));
    return o;
  };

  /* leitura com interpolação linear — usada por tudo que lê fora da grade */
  function readLin(s, pos) {
    if (pos <= 0) return s[0] || 0;
    if (pos >= s.length - 1) return s[s.length - 1] || 0;
    var i = pos | 0, f = pos - i;
    return s[i] * (1 - f) + s[i + 1] * f;
  }
  D.readLin = readLin;

  /* janela de Hann, memorizada por tamanho */
  var hannCache = {};
  function hann(n) {
    if (hannCache[n]) return hannCache[n];
    var w = new Float32Array(n);
    for (var i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n);
    hannCache[n] = w;
    return w;
  }
  D.hann = hann;

  D.mixInto = function (dst, wet, mix) {
    var n = Math.min(dst.length, wet.length);
    for (var c = 0; c < dst.numberOfChannels; c++) {
      var a = dst.getChannelData(c);
      var b = wet.getChannelData(Math.min(c, wet.numberOfChannels - 1));
      for (var i = 0; i < n; i++) a[i] = a[i] * (1 - mix) + b[i] * mix;
    }
    return dst;
  };

  /* mistura seca/molhada respeitando comprimentos diferentes */
  D.blend = function (dry, wet, mix) {
    var len = Math.max(dry.length, wet.length);
    var o = D.make(Math.max(dry.numberOfChannels, wet.numberOfChannels), len, dry.sampleRate);
    for (var c = 0; c < o.numberOfChannels; c++) {
      var d = o.getChannelData(c);
      var a = dry.getChannelData(Math.min(c, dry.numberOfChannels - 1));
      var b = wet.getChannelData(Math.min(c, wet.numberOfChannels - 1));
      for (var i = 0; i < len; i++) {
        d[i] = (i < a.length ? a[i] : 0) * (1 - mix) + (i < b.length ? b[i] : 0) * mix;
      }
    }
    return o;
  };

  /* ================================================================ FFT
     Radix-2 iterativa, no lugar. É a base de tudo que é espectral e do
     deslocamento de frequência. Tabelas de seno/cosseno memorizadas por
     tamanho, porque a mesma janela é usada milhares de vezes seguidas. */
  var twCache = {};
  function twiddles(n) {
    if (twCache[n]) return twCache[n];
    var cos = new Float32Array(n / 2), sin = new Float32Array(n / 2);
    for (var i = 0; i < n / 2; i++) {
      cos[i] = Math.cos(-2 * Math.PI * i / n);
      sin[i] = Math.sin(-2 * Math.PI * i / n);
    }
    var t = { cos: cos, sin: sin };
    twCache[n] = t;
    return t;
  }

  /* transformada no lugar. inv = true faz a inversa (sem o 1/n) */
  D.fft = function (re, im, inv) {
    var n = re.length;
    if (n < 2) return;
    /* inversão de bits */
    for (var i = 1, j = 0; i < n; i++) {
      var bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        var tr = re[i]; re[i] = re[j]; re[j] = tr;
        var ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
    }
    var tw = twiddles(n);
    for (var len = 2; len <= n; len <<= 1) {
      var step = n / len;
      for (var k = 0; k < n; k += len) {
        for (var m = 0; m < len / 2; m++) {
          var idx = m * step;
          var wr = tw.cos[idx], wi = inv ? -tw.sin[idx] : tw.sin[idx];
          var a = k + m, b = k + m + len / 2;
          var xr = re[b] * wr - im[b] * wi;
          var xi = re[b] * wi + im[b] * wr;
          re[b] = re[a] - xr; im[b] = im[a] - xi;
          re[a] += xr; im[a] += xi;
        }
      }
    }
    if (inv) for (var q = 0; q < n; q++) { re[q] /= n; im[q] /= n; }
  };

  /* =========================================================== STFT
     Percorre o canal em janelas sobrepostas, chama `fn` com o espectro
     (magnitude e fase) de cada quadro e remonta o sinal por soma com
     sobreposição. É o motor de toda a família ESPECTRAL.

     fn(mag, phase, frameIndex, bins, state) pode reescrever mag/phase.  */
  D.stft = function (b, N, hopDiv, fn) {
    N = N || 2048;
    var hop = Math.max(1, Math.floor(N / (hopDiv || 4)));
    var w = hann(N);
    var out = D.like(b);
    var bins = N / 2;
    var re = new Float32Array(N), im = new Float32Array(N);
    var mag = new Float32Array(bins), ph = new Float32Array(bins);
    /* soma dos quadrados da janela: normaliza a soma com sobreposição */
    var norm = 0;
    for (var q = 0; q < N; q += hop) norm += w[q] * w[q];
    norm = norm || 1;

    for (var c = 0; c < b.numberOfChannels; c++) {
      var s = b.getChannelData(c), d = out.getChannelData(c);
      var state = { ch: c, frames: 0 };
      var frame = 0;
      for (var pos = 0; pos + N <= s.length + hop; pos += hop) {
        for (var i = 0; i < N; i++) {
          var si = pos + i;
          re[i] = (si < s.length ? s[si] : 0) * w[i];
          im[i] = 0;
        }
        D.fft(re, im, false);
        for (var k = 0; k < bins; k++) {
          mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
          ph[k] = Math.atan2(im[k], re[k]);
        }
        fn(mag, ph, frame, bins, state);
        for (var k2 = 0; k2 < bins; k2++) {
          var m = mag[k2], p = ph[k2];
          re[k2] = m * Math.cos(p); im[k2] = m * Math.sin(p);
          if (k2 > 0 && k2 < bins) {
            re[N - k2] = re[k2]; im[N - k2] = -im[k2];
          }
        }
        re[bins] = 0; im[bins] = 0;
        im[0] = 0;
        D.fft(re, im, true);
        for (var j = 0; j < N; j++) {
          var di = pos + j;
          if (di >= 0 && di < d.length) d[di] += re[j] * w[j] / norm;
        }
        frame++;
      }
    }
    return out;
  };

  /* ============================================ RESPOSTAS IMPULSIVAS
     Doze espaços, cada um com uma lei de decaimento, densidade de
     reflexões, cor e comportamento estéreo próprios. Nenhum é ruído
     branco com envelope: a diferença entre uma sala e uma catedral
     está no atraso das primeiras reflexões e no amortecimento do agudo. */
  var ESPACOS = ['ar', 'nevoa', 'sonho', 'subaquatico', 'distante', 'catedral',
    'infinito', 'vazio', 'sala', 'caverna', 'tunel', 'espaco'];
  D.ESPACOS = ESPACOS;
  D.ESPACOS_NOMES = ['AR', 'NÉVOA', 'SONHO', 'SUBAQUÁTICO', 'DISTANTE', 'CATEDRAL',
    'INFINITO', 'VAZIO', 'SALA', 'CAVERNA', 'TÚNEL', 'ESPAÇO'];

  var RECEITA = {
    /*             seg  decai  denso  amort  larg  pré   modo */
    ar: [0.7, 3.4, 0.55, 0.30, 0.55, 0.004],
    nevoa: [2.6, 1.8, 0.95, 0.80, 0.85, 0.020],
    sonho: [4.0, 1.2, 0.90, 0.62, 1.00, 0.055],
    subaquatico: [2.0, 2.2, 0.98, 0.95, 0.45, 0.010],
    distante: [1.8, 2.6, 0.70, 0.72, 0.75, 0.090],
    catedral: [5.5, 1.5, 0.88, 0.42, 0.95, 0.038],
    infinito: [9.0, 0.7, 0.99, 0.30, 1.00, 0.030],
    vazio: [3.0, 2.0, 0.20, 0.20, 0.60, 0.070],
    sala: [0.9, 3.0, 0.75, 0.55, 0.50, 0.007],
    caverna: [4.2, 1.6, 0.65, 0.66, 0.90, 0.045],
    tunel: [3.2, 2.0, 0.45, 0.50, 0.35, 0.028],
    espaco: [7.0, 1.0, 0.35, 0.18, 1.00, 0.120]
  };

  /* quanto dura a resposta impulsiva deste espaço, em segundos. Serve
     para o rack reservar a cauda CERTA: reservar seis segundos para uma
     sala de 0,9 s fazia a renderização custar sete vezes mais.        */
  D.impulsoDur = function (tipo, tamanho) {
    var r = RECEITA[tipo] || RECEITA.sala;
    return Math.max(0.05, r[0] * (tamanho === undefined ? 1 : tamanho)) + r[5];
  };

  /* a mesma resposta impulsiva é pedida a cada re-render; gerá-la custa
     milhões de operações. Guardamos as últimas por parâmetro.         */
  var irCache = {}, irOrdem = [];
  D.impulso = function (tipo, tamanho, queda, amort, largura, semente) {
    var chave = [tipo, tamanho, queda, amort, largura, semente].join(":");
    if (irCache[chave]) return irCache[chave];
    var ir = D.impulsoGerar(tipo, tamanho, queda, amort, largura, semente);
    irCache[chave] = ir;
    irOrdem.push(chave);
    if (irOrdem.length > 8) delete irCache[irOrdem.shift()];
    return ir;
  };

  D.impulsoGerar = function (tipo, tamanho, queda, amort, largura, semente) {
    var c = ctxOf(), sr = c.sampleRate;
    var r = RECEITA[tipo] || RECEITA.sala;
    var seg = Math.max(0.05, r[0] * (tamanho === undefined ? 1 : tamanho));
    var dec = r[1] * (queda === undefined ? 1 : queda);
    var densidade = r[2];
    var damp = Math.min(0.98, r[3] * (amort === undefined ? 1 : amort));
    var larg = r[4] * (largura === undefined ? 1 : largura);
    var pre = r[5];
    var len = Math.max(8, Math.floor(sr * seg));
    var ir = c.createBuffer(2, len, sr);
    var rnd = D.rng((semente || 7) * 2654435761);
    var preN = Math.floor(pre * sr);

    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch);
      var lp = 0;
      /* deslocamento estéreo: os dois ouvidos não recebem a mesma reflexão */
      var desloc = Math.floor(larg * 0.004 * sr * (ch ? 1 : -1));
      for (var i = 0; i < len; i++) {
        var t = i / len;
        if (i < preN) { d[i] = 0; continue; }
        /* densidade: nem toda amostra é uma reflexão. Espaço "vazio" tem
           reflexões esparsas e por isso soa oco em vez de cheio.        */
        var bate = rnd() < (0.12 + densidade * 0.88);
        var v = bate ? (rnd() * 2 - 1) : 0;
        var env = Math.pow(Math.max(1 - t, 1e-6), dec);
        v *= env;
        /* amortecimento: o agudo morre antes do grave, como no ar real */
        lp += (v - lp) * (1 - damp * (0.35 + t * 0.6));
        var idx = i + desloc;
        if (idx >= 0 && idx < len) d[idx] += lp * (0.6 + larg * 0.4);
      }
      /* primeiras reflexões marcadas: é o que dá tamanho ao espaço */
      var nRef = 6 + Math.floor(densidade * 10);
      for (var k = 0; k < nRef; k++) {
        var pos = preN + Math.floor(rnd() * len * 0.22);
        if (pos < len) d[pos] += (rnd() * 2 - 1) * 0.6 * Math.pow(1 - pos / len, dec * 0.6);
      }
    }
    return ir;
  };

  /* ==================================================== ESTICAR O TEMPO
     Sobreposição de grãos com passo de leitura diferente do de escrita:
     o tempo muda e o TOM não. É o mesmo princípio do granular, mas com
     posição de leitura ordenada em vez de sorteada.                    */
  D.esticar = function (b, fator, grao, sobrepor) {
    var sr = b.sampleRate;
    var g = Math.max(128, Math.floor((grao || 0.09) * sr));
    var ov = Math.max(2, Math.floor(sobrepor || 4));
    var hopOut = Math.max(32, Math.floor(g / ov));
    var hopIn = Math.max(1, hopOut / Math.max(0.05, fator));
    var len = Math.max(8, Math.floor(b.length * Math.max(0.05, fator)));
    var out = D.like(b, len);
    var w = hann(g);
    var ganho = 2 / ov;
    for (var c = 0; c < b.numberOfChannels; c++) {
      var s = b.getChannelData(c), d = out.getChannelData(c);
      var rp = 0;
      for (var wp = 0; wp < len; wp += hopOut) {
        for (var i = 0; i < g; i++) {
          var di = wp + i;
          if (di >= len) break;
          d[di] += readLin(s, rp + i) * w[i] * ganho;
        }
        rp += hopIn;
        if (rp > s.length - g) rp = Math.max(0, s.length - g - 1);
      }
    }
    return out;
  };

  /* ------------------------------------------- mudar o tom sem mudar a duração */
  D.tom = function (b, semitons, grao) {
    if (Math.abs(semitons) < 0.01) return b;
    var razao = Math.pow(2, semitons / 12);
    /* estica pelo inverso e depois relê mais rápido: sobra a mesma duração */
    var esticado = D.esticar(b, razao, grao || 0.08, 4);
    var out = D.like(b);
    for (var c = 0; c < b.numberOfChannels; c++) {
      var s = esticado.getChannelData(Math.min(c, esticado.numberOfChannels - 1));
      var d = out.getChannelData(c);
      for (var i = 0; i < d.length; i++) d[i] = readLin(s, i * razao);
    }
    return out;
  };

  /* ================================================== MOTOR GRANULAR
     Um grão é um pedaço curto com janela, lido de uma posição da fonte e
     escrito noutra do destino. Tudo o que faz um sistema granular ser um
     INSTRUMENTO e não um efeito está nos desvios: posição, tom, duração,
     panorama e sentido, cada um com a sua própria dose de sorteio.     */
  D.granular = function (b, p) {
    var sr = b.sampleRate;
    var rnd = D.rng(p.seed || 1);
    var dur = Math.max(0.05, p.dur || 1);
    var len = Math.max(8, Math.floor(b.length * dur));
    var out = D.like(b, len);
    var gBase = Math.max(64, Math.floor((p.grain || 0.08) * sr));
    var dens = Math.max(0.05, p.dens || 1);
    var passo = Math.max(16, Math.floor(gBase / dens));
    var nCh = out.numberOfChannels;
    var canais = [];
    for (var c = 0; c < nCh; c++) canais.push(out.getChannelData(c));
    var fonte = [];
    for (var c2 = 0; c2 < b.numberOfChannels; c2++) fonte.push(b.getChannelData(c2));

    for (var wp = 0; wp < len; wp += passo) {
      /* tamanho do grão, com desvio */
      var g = Math.max(32, Math.floor(gBase * (1 + (rnd() * 2 - 1) * (p.grainJit || 0))));
      var w = hann(g);
      /* posição de leitura: segue o tempo, ou fica presa (congelar) */
      var base;
      if (p.freeze > 0.5) base = (p.pos || 0) * (b.length - g - 1);
      else base = (wp / Math.max(1, len)) * (b.length - g - 1) + (p.pos || 0) * (b.length - g - 1);
      /* spray: o quanto a posição pode se afastar */
      base += (rnd() * 2 - 1) * (p.spray || 0) * b.length * 0.5;
      base = Math.max(0, Math.min(b.length - g - 1, base));
      /* tom do grão */
      var semi = (p.pitch || 0) + (rnd() * 2 - 1) * (p.pitchJit || 0);
      var razao = Math.pow(2, semi / 12);
      var rev = (p.rev || 0) > 0 && rnd() < p.rev;
      /* panorama do grão */
      var pan = (rnd() * 2 - 1) * (p.pan || 0);
      var gl = nCh > 1 ? Math.cos((pan + 1) * Math.PI / 4) : 1;
      var gr = nCh > 1 ? Math.sin((pan + 1) * Math.PI / 4) : 1;
      /* textura: quanto menor, mais o grão vira um clique seco */
      var forma = p.tex === undefined ? 1 : p.tex;

      for (var i = 0; i < g; i++) {
        var di = wp + i;
        if (di >= len) break;
        var ri = rev ? (g - 1 - i) : i;
        var pos = base + ri * razao;
        var env = Math.pow(w[i], Math.max(0.15, forma));
        for (var ch = 0; ch < nCh; ch++) {
          var s = fonte[Math.min(ch, fonte.length - 1)];
          var v = readLin(s, pos) * env * (ch === 0 ? gl : gr);
          canais[ch][di] += v;
        }
      }
    }
    /* densidade alta soma muitos grãos: compensa para não estourar */
    var comp = 1 / Math.sqrt(Math.max(1, dens * (p.overlap || 1)));
    for (var c3 = 0; c3 < nCh; c3++) {
      var d = canais[c3];
      for (var j = 0; j < d.length; j++) d[j] *= comp;
    }
    return out;
  };

  /* ============================================ STFT POR GANHO
     A versão acima reconstrói o quadro a partir de magnitude e fase, o
     que custa um atan2 e um par seno/cosseno POR FAIXA E POR QUADRO —
     num arquivo de 24 segundos são mais de treze milhões de chamadas
     trigonométricas, e a renderização passava de dez segundos.

     Quase toda operação espectral, porém, só quer ESCALAR faixas. Para
     essas, o quadro não precisa ser reconstruído: basta multiplicar a
     parte real e a imaginária pelo mesmo ganho. Zero trigonometria.

     fn(mag, ganho, quadro, faixas, estado) — lê `mag`, escreve `ganho`. */
  D.stftGanho = function (b, N, hopDiv, fn) {
    N = N || 2048;
    var hop = Math.max(1, Math.floor(N / (hopDiv || 4)));
    var w = hann(N);
    var out = D.like(b);
    var bins = N / 2;
    var re = new Float32Array(N), im = new Float32Array(N);
    var mag = new Float32Array(bins), ganho = new Float32Array(bins);
    var norm = 0;
    for (var q = 0; q < N; q += hop) norm += w[q] * w[q];
    norm = norm || 1;

    for (var c = 0; c < b.numberOfChannels; c++) {
      var s = b.getChannelData(c), d = out.getChannelData(c);
      var estado = { ch: c };
      var quadro = 0;
      for (var pos = 0; pos + N <= s.length + hop; pos += hop) {
        for (var i = 0; i < N; i++) {
          var si = pos + i;
          re[i] = (si < s.length ? s[si] : 0) * w[i];
          im[i] = 0;
        }
        D.fft(re, im, false);
        for (var k = 0; k < bins; k++) {
          mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
          ganho[k] = 1;
        }
        fn(mag, ganho, quadro, bins, estado);
        for (var k2 = 1; k2 < bins; k2++) {
          var g = ganho[k2];
          re[k2] *= g; im[k2] *= g;
          re[N - k2] = re[k2]; im[N - k2] = -im[k2];
        }
        re[0] *= ganho[0]; im[0] = 0;
        re[bins] = 0; im[bins] = 0;
        D.fft(re, im, true);
        for (var j = 0; j < N; j++) {
          var di = pos + j;
          if (di < d.length) d[di] += re[j] * w[j] / norm;
        }
        quadro++;
      }
    }
    return out;
  };

  /* ================================================== ESPECTRAL
     Todas as operações acontecem sobre o espectro de cada quadro.
     `tipo` escolhe a operação; os parâmetros são os mesmos.           */
  D.ESPECTRAL = ['congelar', 'borrar', 'desfocar', 'esticar', 'deslocar',
    'porta', 'filtrar', 'moldar', 'freqcongelar', 'harmonico', 'ruido'];
  D.ESPECTRAL_NOMES = ['CONGELAR', 'BORRAR', 'DESFOCAR', 'ESTICAR', 'DESLOCAR',
    'PORTA', 'FILTRAR', 'MOLDAR', 'CONGELAR FAIXA', 'SÓ HARMÔNICOS', 'SÓ RUÍDO'];

  function ganhoPara(alvo, atual) {
    return alvo <= 0 ? 0 : (atual > 1e-9 ? Math.min(64, alvo / atual) : 0);
  }

  D.espectral = function (b, p) {
    var tipo = D.ESPECTRAL[(p.tipo | 0)] || 'congelar';
    var N = [512, 1024, 2048, 4096][Math.max(0, Math.min(3, p.janela | 0))];
    var amt = p.amt === undefined ? 1 : p.amt;
    var quadroCongela = Math.max(0, Math.floor((p.pos || 0.3) * 40));

    /* ---- DESLOCAR move faixas de lugar: precisa de magnitude E fase ---- */
    if (tipo === 'deslocar') {
      var sh = Math.round((p.shift === undefined ? 0.2 : p.shift) * (N / 2) * 0.25);
      var tm = null, tp = null;
      return D.stft(b, N, 4, function (mag, ph, frame, bins) {
        if (!tm || tm.length !== bins) { tm = new Float32Array(bins); tp = new Float32Array(bins); }
        tm.set(mag); tp.set(ph);
        for (var i = 0; i < bins; i++) {
          var q = i - sh;
          var dentro = (q >= 0 && q < bins);
          mag[i] = dentro ? tm[q] * amt + tm[i] * (1 - amt) : tm[i] * (1 - amt);
          ph[i] = dentro ? tp[q] : tp[i];
        }
      });
    }

    /* ---- todo o resto é escala de faixa: caminho por ganho ---- */
    var guardado = null, mem = null, tmp = null, med = null;
    return D.stftGanho(b, N, 4, function (mag, ganho, frame, bins, st) {
      var i, j;
      if (frame === 0) { guardado = null; mem = null; }

      if (tipo === 'congelar') {
        if (frame === quadroCongela || (guardado && guardado.length !== bins)) guardado = mag.slice(0);
        if (guardado && frame >= quadroCongela) {
          for (i = 0; i < bins; i++) ganho[i] = ganhoPara(mag[i] * (1 - amt) + guardado[i] * amt, mag[i]);
        }
      } else if (tipo === 'borrar') {
        if (!mem || mem.length !== bins) mem = new Float32Array(bins);
        var k = 0.55 + amt * 0.44;
        for (i = 0; i < bins; i++) {
          mem[i] = mem[i] * k + mag[i] * (1 - k);
          ganho[i] = ganhoPara(Math.max(mag[i], mem[i]), mag[i]);
        }
      } else if (tipo === 'desfocar') {
        var r = Math.max(1, Math.floor(amt * 24));
        if (!tmp || tmp.length !== bins) tmp = new Float32Array(bins);
        tmp.set(mag);
        /* média móvel por soma corrente: O(n) em vez de O(n·r) */
        var soma = 0, n = 0;
        for (i = 0; i <= r && i < bins; i++) { soma += tmp[i]; n++; }
        for (i = 0; i < bins; i++) {
          ganho[i] = ganhoPara(soma / Math.max(1, n), mag[i]);
          var sai = i - r, entra = i + r + 1;
          if (sai >= 0) { soma -= tmp[sai]; n--; }
          if (entra < bins) { soma += tmp[entra]; n++; }
        }
      } else if (tipo === 'esticar') {
        var f = 0.25 + amt * 3.5;
        if (!tmp || tmp.length !== bins) tmp = new Float32Array(bins);
        tmp.set(mag);
        for (i = 0; i < bins; i++) {
          var sb = i / f, i0 = sb | 0, fr = sb - i0;
          var alvo = (tmp[i0] || 0) * (1 - fr) + (tmp[i0 + 1] || 0) * fr;
          ganho[i] = ganhoPara(alvo, mag[i]);
        }
      } else if (tipo === 'porta') {
        var pico = 0;
        for (i = 0; i < bins; i++) if (mag[i] > pico) pico = mag[i];
        var lim = pico * amt * 0.5;
        for (i = 0; i < bins; i++) if (mag[i] < lim) ganho[i] = 0;
      } else if (tipo === 'filtrar') {
        var lo = Math.floor((p.lo === undefined ? 0 : p.lo) * bins);
        var hi = Math.floor((p.hi === undefined ? 1 : p.hi) * bins);
        for (i = 0; i < bins; i++) if (i < lo || i > hi) ganho[i] = 1 - amt;
      } else if (tipo === 'moldar') {
        for (i = 0; i < bins; i++) {
          var curva = Math.pow(1 - i / bins, 1.6);
          ganho[i] = (1 - amt) + amt * curva * 4;
        }
      } else if (tipo === 'freqcongelar') {
        var lo2 = Math.floor((p.lo === undefined ? 0.05 : p.lo) * bins);
        var hi2 = Math.floor((p.hi === undefined ? 0.3 : p.hi) * bins);
        if (frame === quadroCongela || (guardado && guardado.length !== bins)) guardado = mag.slice(0);
        if (guardado && frame >= quadroCongela) {
          for (i = lo2; i <= hi2 && i < bins; i++) {
            ganho[i] = ganhoPara(guardado[i] * amt + mag[i] * (1 - amt), mag[i]);
          }
        }
      } else if (tipo === 'harmonico' || tipo === 'ruido') {
        /* mediana móvel aproximada por média corrente: acima dela é tom,
           abaixo é chiado. Separar os dois é o que permite ficar só com um. */
        if (!med || med.length !== bins) med = new Float32Array(bins);
        var r2 = 12, soma2 = 0, n2 = 0;
        for (i = 0; i <= r2 && i < bins; i++) { soma2 += mag[i]; n2++; }
        for (i = 0; i < bins; i++) {
          med[i] = soma2 / Math.max(1, n2);
          var sai2 = i - r2, ent2 = i + r2 + 1;
          if (sai2 >= 0) { soma2 -= mag[sai2]; n2--; }
          if (ent2 < bins) { soma2 += mag[ent2]; n2++; }
        }
        for (j = 0; j < bins; j++) {
          var ehTom = mag[j] > med[j] * 1.35;
          var manter = (tipo === 'harmonico') ? ehTom : !ehTom;
          if (!manter) ganho[j] = 1 - amt;
        }
      }
    });
  };

  /* ============================================ DESLOCAMENTO DE FREQUÊNCIA
     Não é mudar o tom: é somar N Hz a TODAS as parciais, o que destrói a
     relação harmônica e produz aquele som metálico de rádio desafinado.
     Feito com sinal analítico: zera as frequências negativas via FFT e
     multiplica por uma exponencial complexa.                            */
  D.deslocarFreq = function (b, hz) {
    if (Math.abs(hz) < 0.01) return b;
    var sr = b.sampleRate;
    var N = 1 << Math.ceil(Math.log2(Math.min(b.length, 1 << 20)));
    var out = D.like(b);
    for (var c = 0; c < b.numberOfChannels; c++) {
      var s = b.getChannelData(c), d = out.getChannelData(c);
      var re = new Float32Array(N), im = new Float32Array(N);
      for (var i = 0; i < N; i++) re[i] = i < s.length ? s[i] : 0;
      D.fft(re, im, false);
      /* sinal analítico: dobra o positivo, zera o negativo */
      for (var k = 1; k < N / 2; k++) { re[k] *= 2; im[k] *= 2; }
      for (var k2 = N / 2 + 1; k2 < N; k2++) { re[k2] = 0; im[k2] = 0; }
      D.fft(re, im, true);
      var w = 2 * Math.PI * hz / sr;
      for (var j = 0; j < d.length; j++) {
        d[j] = re[j] * Math.cos(w * j) - im[j] * Math.sin(w * j);
      }
    }
    return out;
  };

  /* ================================================== FILTRO SIMPLES
     Um passa-baixa e um passa-alta de um polo, para uso dentro dos
     processadores de buffer (o rack já tem um biquad de verdade no
     grafo; estes servem para colorir matéria e espaço).               */
  D.passaBaixa = function (b, hz) {
    var out = D.copy(b);
    var k = 1 - Math.exp(-2 * Math.PI * Math.max(20, hz) / b.sampleRate);
    for (var c = 0; c < out.numberOfChannels; c++) {
      var d = out.getChannelData(c), z = 0;
      for (var i = 0; i < d.length; i++) { z += (d[i] - z) * k; d[i] = z; }
    }
    return out;
  };

  D.passaAlta = function (b, hz) {
    var out = D.copy(b);
    var k = 1 - Math.exp(-2 * Math.PI * Math.max(20, hz) / b.sampleRate);
    for (var c = 0; c < out.numberOfChannels; c++) {
      var d = out.getChannelData(c), z = 0;
      for (var i = 0; i < d.length; i++) { z += (d[i] - z) * k; d[i] = d[i] - z; }
    }
    return out;
  };

  /* ================================================== SEGUNDA ORDEM =====
     Os dois filtros acima são de UM POLO: 6 dB por oitava. Isso é uma
     inclinação, não um corte — e foi medido o que ela custa: o TELEFONE,
     com três estágios de um polo, ainda deixava 30% da energia fora da
     banda de 300 a 3400 Hz (seção 4v do PROJETO.md).

     Aqui está o biquad de verdade, na forma do cookbook do Robert
     Bristow-Johnson: dois polos e dois zeros, 12 dB por oitava por
     estágio, com Q e ganho. Serve ao TELEFONE, ao RÁDIO e a qualquer
     módulo que precise de banda de verdade.

     A conta é feita em DIRETA TRANSPOSTA II: menos estado, menos erro
     acumulado em buffer longo que a direta I.                        */
  D.BIQ = ['baixa', 'alta', 'banda', 'rejeita', 'pico', 'pratGrave', 'pratAgudo'];

  D.biquadCoef = function (tipo, hz, sr, q, ganhoDb) {
    var f = Math.max(10, Math.min(sr * 0.49, hz));
    var Q = Math.max(0.05, q === undefined ? Math.SQRT1_2 : q);
    var A = Math.pow(10, (ganhoDb || 0) / 40);
    var w0 = 2 * Math.PI * f / sr;
    var cw = Math.cos(w0), sw = Math.sin(w0);
    var alpha = sw / (2 * Q);
    var b0, b1, b2, a0, a1, a2;
    switch (tipo) {
      case 1:  /* passa-alta */
        b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0;
        a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
        break;
      case 2:  /* passa-banda, ganho unitário no pico */
        b0 = alpha; b1 = 0; b2 = -alpha;
        a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
        break;
      case 3:  /* rejeita-banda */
        b0 = 1; b1 = -2 * cw; b2 = 1;
        a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
        break;
      case 4:  /* pico */
        b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A;
        a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A;
        break;
      case 5: {  /* prateleira grave */
        var s5 = 2 * Math.sqrt(A) * alpha;
        b0 = A * ((A + 1) - (A - 1) * cw + s5);
        b1 = 2 * A * ((A - 1) - (A + 1) * cw);
        b2 = A * ((A + 1) - (A - 1) * cw - s5);
        a0 = (A + 1) + (A - 1) * cw + s5;
        a1 = -2 * ((A - 1) + (A + 1) * cw);
        a2 = (A + 1) + (A - 1) * cw - s5;
        break;
      }
      case 6: {  /* prateleira aguda */
        var s6 = 2 * Math.sqrt(A) * alpha;
        b0 = A * ((A + 1) + (A - 1) * cw + s6);
        b1 = -2 * A * ((A - 1) + (A + 1) * cw);
        b2 = A * ((A + 1) + (A - 1) * cw - s6);
        a0 = (A + 1) - (A - 1) * cw + s6;
        a1 = 2 * ((A - 1) - (A + 1) * cw);
        a2 = (A + 1) - (A - 1) * cw - s6;
        break;
      }
      default: /* 0 = passa-baixa */
        b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0;
        a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
    }
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
  };

  /* aplica um estágio já calculado, em todos os canais */
  D.biquadEm = function (b, k) {
    for (var c = 0; c < b.numberOfChannels; c++) {
      var d = b.getChannelData(c), z1 = 0, z2 = 0;
      for (var i = 0; i < d.length; i++) {
        var x = d[i];
        var y = k.b0 * x + z1;
        z1 = k.b1 * x - k.a1 * y + z2;
        z2 = k.b2 * x - k.a2 * y;
        d[i] = y;
      }
    }
    return b;
  };

  D.biquad = function (b, tipo, hz, q, ganhoDb) {
    return D.biquadEm(D.copy(b), D.biquadCoef(tipo, hz, b.sampleRate, q, ganhoDb));
  };

  /* ---------------------------------------------------------------------
     CASCATA BUTTERWORTH, em POLOS.

     Cada biquad dá dois polos. Os Q de uma Butterworth de ordem n saem
     dos ângulos dos polos: Q_k = 1/(2·cos((2k+1)π/2n)) — 0,707 para dois
     polos; 0,541 e 1,307 para quatro. Com os Q certos o −3 dB cai
     EXATAMENTE na frequência pedida, sem fator de correção nenhum, que é
     o que a cascata de um polo precisava para não encolher a banda.

     Ordem ímpar ganha um estágio de um polo no fim, que é o filtro
     simples que já existia aqui.                                      */
  D.butter = function (b, tipo, hz, polos) {
    var n = Math.max(1, Math.round(polos || 2));
    var pares = Math.floor(n / 2);
    var out = D.copy(b);
    for (var k = 0; k < pares; k++) {
      var q = 1 / (2 * Math.cos((2 * k + 1) * Math.PI / (2 * n)));
      D.biquadEm(out, D.biquadCoef(tipo === 1 ? 1 : 0, hz, b.sampleRate, q, 0));
    }
    if (n % 2 === 1) out = (tipo === 1) ? D.passaAlta(out, hz) : D.passaBaixa(out, hz);
    return out;
  };

  /* ressonador: um pico agudo numa frequência, é o que dá "material" */
  D.ressonar = function (b, hz, q, ganho) {
    var out = D.copy(b);
    var sr = b.sampleRate;
    var w0 = 2 * Math.PI * Math.max(20, Math.min(sr / 2 - 100, hz)) / sr;
    var alpha = Math.sin(w0) / (2 * Math.max(0.3, q));
    var b0 = alpha, b1 = 0, b2 = -alpha;
    var a0 = 1 + alpha, a1 = -2 * Math.cos(w0), a2 = 1 - alpha;
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    for (var c = 0; c < out.numberOfChannels; c++) {
      var d = out.getChannelData(c);
      var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (var i = 0; i < d.length; i++) {
        var x = d[i];
        var y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = x; y2 = y1; y1 = y;
        d[i] = x + y * ganho;
      }
    }
    return out;
  };

  /* ------------------------------------------------------ atraso simples */
  D.atrasar = function (b, seg, mix, fb) {
    var sr = b.sampleRate;
    var n = Math.max(1, Math.floor(seg * sr));
    var out = D.copy(b);
    for (var c = 0; c < out.numberOfChannels; c++) {
      var d = out.getChannelData(c);
      for (var i = n; i < d.length; i++) d[i] += d[i - n] * (fb === undefined ? 0.4 : fb) * mix;
    }
    return out;
  };

  D.normalizar = function (b, alvo) {
    var pico = 0;
    for (var c = 0; c < b.numberOfChannels; c++) {
      var d = b.getChannelData(c);
      for (var i = 0; i < d.length; i++) { var a = Math.abs(d[i]); if (a > pico) pico = a; }
    }
    if (pico > 1e-5) {
      var g = (alvo === undefined ? 0.99 : alvo) / pico;
      for (var c2 = 0; c2 < b.numberOfChannels; c2++) {
        var dd = b.getChannelData(c2);
        for (var j = 0; j < dd.length; j++) dd[j] *= g;
      }
    }
    return b;
  };

  /* garante dois canais — espacial e psicoacústica precisam de estéreo */
  D.estereo = function (b) {
    if (b.numberOfChannels >= 2) return b;
    var out = D.make(2, b.length, b.sampleRate);
    var s = b.getChannelData(0);
    out.getChannelData(0).set(s);
    out.getChannelData(1).set(s);
    return out;
  };

})(window.VE);
