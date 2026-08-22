/* ============================================================
   rgb_lab — MÓDULOS NOVOS DO RACK DE ÁUDIO
   ------------------------------------------------------------
   Este arquivo NÃO cria um segundo laboratório de áudio. Ele
   acrescenta módulos ao rack que já existe, pelo mesmo registro
   que os doze originais usam (`VE.audio.register`), com os mesmos
   tipos de parâmetro e a mesma renderização.

   Cada módulo declara `buf` (transforma o buffer) ou `node`
   (entra no grafo). Nenhum controle é decorativo: todo parâmetro
   entra na conta.

   As famílias servem só para filtrar a lista no rack:
     base · atmosfera · deformação · glitch · matéria · espacial
     psicoacústica · granular · espectral · generativo
   ============================================================ */
(function (VE) {
  'use strict';

  var A = VE.audio, D = VE.adsp;
  var reg = A.register;

  /* as famílias, na ordem em que aparecem no seletor do rack */
  A.FAMS = [
    { id: 'todos', label: 'todos' },
    { id: 'base', label: 'base' },
    { id: 'atm', label: 'atmosfera' },
    { id: 'def', label: 'deformação' },
    { id: 'gli', label: 'glitch' },
    { id: 'mat', label: 'matéria' },
    { id: 'esp', label: 'espacial' },
    { id: 'psi', label: 'psicoacústica' },
    { id: 'gra', label: 'granular' },
    { id: 'spc', label: 'espectral' },
    { id: 'ger', label: 'generativo' }
  ];

  /* os doze que já existiam entram na família BASE */
  A.modules.forEach(function (m) { if (!m.fam) m.fam = 'base'; });

  /* =================================================== ATMOSFERA ======== */
  reg({
    id: 'atmos', name: 'ATMOSFERA', fam: 'atm',
    desc: 'doze espaços, cada um com a sua lei de decaimento e cor',
    params: [
      { k: 'tipo', t: 's', label: 'Espaço', def: 8, opts: D.ESPACOS_NOMES },
      { k: 'size', label: 'Tamanho', min: 0.15, max: 3, step: 0.01, def: 1 },
      { k: 'decay', label: 'Queda', min: 0.2, max: 3, step: 0.01, def: 1 },
      { k: 'damp', label: 'Amortecer o agudo', min: 0, max: 2, step: 0.01, def: 1 },
      { k: 'width', label: 'Largura', min: 0, max: 2, step: 0.01, def: 1 },
      { k: 'pre', label: 'Pré-atraso (s)', min: 0, max: 0.4, step: 0.005, def: 0 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 0.4 }
    ]
  }, {
    /* a cauda reservada é a duração REAL da resposta impulsiva deste
       espaço — uma sala não precisa de seis segundos de silêncio.   */
    tail: function (v) { return D.impulsoDur(D.ESPACOS[v.tipo | 0], v.size) + v.pre; },
    node: function (off, last, v) {
      var cv = off.createConvolver();
      cv.buffer = D.impulso(D.ESPACOS[v.tipo | 0], v.size, v.decay, v.damp, v.width, 7);
      var pre = off.createDelay(1);
      pre.delayTime.value = v.pre;
      var wet = off.createGain(); wet.gain.value = v.mix;
      var sum = off.createGain();
      last.connect(sum);
      last.connect(pre); pre.connect(cv); cv.connect(wet); wet.connect(sum);
      return sum;
    }
  });

  /* =================================================== DEFORMAÇÃO ======= */
  reg({
    id: 'tstretch', name: 'TEMPO ELÁSTICO', fam: 'def',
    desc: 'estica ou comprime a duração sem mexer no tom',
    params: [
      { k: 'fator', label: 'Fator de tempo', min: 0.1, max: 8, step: 0.01, def: 2 },
      { k: 'grain', label: 'Grão (s)', min: 0.01, max: 0.4, step: 0.005, def: 0.09 },
      { k: 'ov', label: 'Sobreposição', min: 2, max: 8, step: 1, def: 4 },
      { k: 'tom', label: 'Tom junto (semitons)', min: -24, max: 24, step: 0.5, def: 0 }
    ]
  }, {
    buf: function (b, v) {
      var o = D.esticar(b, v.fator, v.grain, v.ov);
      if (Math.abs(v.tom) > 0.01) o = D.tom(o, v.tom, v.grain);
      return o;
    }
  });

  reg({
    id: 'tape', name: 'FITA', fam: 'def',
    desc: 'wow, flutter, saturação e a parada de rolo',
    params: [
      { k: 'wow', label: 'Wow (lento)', min: 0, max: 1, step: 0.01, def: 0.25 },
      { k: 'flutter', label: 'Flutter (rápido)', min: 0, max: 1, step: 0.01, def: 0.2 },
      { k: 'stop', label: 'Parada de rolo', min: 0, max: 1, step: 0.01, def: 0 },
      { k: 'sat', label: 'Saturação', min: 0, max: 1, step: 0.01, def: 0.3 },
      { k: 'hiss', label: 'Chiado', min: 0, max: 0.2, step: 0.002, def: 0.01 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 7 }
    ]
  }, {
    buf: function (b, v) {
      var sr = b.sampleRate, out = D.like(b);
      var rnd = D.rng(v.seed);
      /* deriva lenta e irregular: o wow de fita nunca é uma senoide pura */
      var alvo = 0, atual = 0;
      var deriva = new Float32Array(Math.ceil(b.length / 512) + 2);
      for (var i = 0; i < deriva.length; i++) {
        if (i % 12 === 0) alvo = (rnd() * 2 - 1);
        atual += (alvo - atual) * 0.08;
        deriva[i] = atual;
      }
      for (var c = 0; c < b.numberOfChannels; c++) {
        var s = b.getChannelData(c), d = out.getChannelData(c);
        var pos = 0;
        for (var j = 0; j < d.length; j++) {
          var t = j / sr;
          var w = deriva[(j / 512) | 0] * v.wow * 0.03;
          var f = Math.sin(2 * Math.PI * 21.7 * t) * v.flutter * 0.006 +
            Math.sin(2 * Math.PI * 47.3 * t + 1.1) * v.flutter * 0.003;
          /* parada de rolo: a velocidade cai a zero no fim */
          var parar = 1;
          if (v.stop > 0.001) {
            var inicio = 1 - v.stop;
            var k = (j / d.length - inicio) / Math.max(0.02, v.stop);
            if (k > 0) parar = Math.max(0, 1 - k * k);
          }
          var vel = (1 + w + f) * parar;
          pos += vel;
          var x = D.readLin(s, pos);
          if (v.sat > 0.001) {
            /* saturação como mistura seco/molhado: a fita comprime, não
               empurra o nível para cima. Sem a mistura, 30% de saturação
               dobrava o volume e o resto da cadeia recebia o sinal quente. */
            var g = 1 + v.sat * 9;
            var xs = Math.tanh(x * g) / Math.tanh(g);
            x = x * (1 - v.sat) + xs * v.sat;
          }
          d[j] = x + (rnd() * 2 - 1) * v.hiss;
        }
      }
      return out;
    }
  });

  reg({
    id: 'pdrift', name: 'DERIVA DE TOM', fam: 'def',
    desc: 'o tom escorrega no tempo — desafinação lenta ou nervosa',
    params: [
      { k: 'amp', label: 'Alcance (semitons)', min: 0, max: 12, step: 0.1, def: 2 },
      { k: 'rate', label: 'Velocidade (Hz)', min: 0.01, max: 12, step: 0.01, def: 0.35 },
      { k: 'caos', label: 'Irregularidade', min: 0, max: 1, step: 0.01, def: 0.4 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 12 }
    ]
  }, {
    buf: function (b, v) {
      var sr = b.sampleRate, out = D.like(b);
      var rnd = D.rng(v.seed);
      var passo = 256;
      var n = Math.ceil(b.length / passo) + 2;
      var curva = new Float32Array(n), alvo = 0, atual = 0;
      for (var i = 0; i < n; i++) {
        var t = i * passo / sr;
        var senoide = Math.sin(2 * Math.PI * v.rate * t);
        if (i % 8 === 0) alvo = rnd() * 2 - 1;
        atual += (alvo - atual) * 0.06;
        curva[i] = senoide * (1 - v.caos) + atual * v.caos;
      }
      for (var c = 0; c < b.numberOfChannels; c++) {
        var s = b.getChannelData(c), d = out.getChannelData(c);
        var pos = 0;
        for (var j = 0; j < d.length; j++) {
          var semi = curva[(j / passo) | 0] * v.amp;
          pos += Math.pow(2, semi / 12);
          d[j] = D.readLin(s, pos);
        }
      }
      return out;
    }
  });

  reg({
    id: 'melt', name: 'DERRETER', fam: 'def',
    desc: 'a velocidade de leitura muda ao longo do arquivo: o som escorre',
    params: [
      { k: 'amt', label: 'Quanto derrete', min: 0, max: 1, step: 0.01, def: 0.5 },
      { k: 'curva', t: 's', label: 'Curva', def: 0, opts: ['Desacelera', 'Acelera', 'Vai e volta', 'Ondas', 'Sorteada'] },
      { k: 'ondas', label: 'Ondas', min: 1, max: 24, step: 1, def: 5 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 5 }
    ]
  }, {
    buf: function (b, v) {
      var out = D.like(b), rnd = D.rng(v.seed);
      var modo = v.curva | 0;
      var sorteio = [];
      for (var q = 0; q < 64; q++) sorteio.push(rnd() * 2 - 1);
      for (var c = 0; c < b.numberOfChannels; c++) {
        var s = b.getChannelData(c), d = out.getChannelData(c);
        var pos = 0;
        for (var j = 0; j < d.length; j++) {
          var t = j / d.length, k;
          if (modo === 0) k = 1 - t * v.amt * 0.9;
          else if (modo === 1) k = 1 + t * v.amt * 3;
          else if (modo === 2) k = 1 + Math.sin(t * Math.PI) * v.amt * 2 - v.amt;
          else if (modo === 3) k = 1 + Math.sin(t * Math.PI * 2 * v.ondas) * v.amt * 0.8;
          else k = 1 + sorteio[(t * 63) | 0] * v.amt;
          pos += Math.max(0.05, k);
          d[j] = D.readLin(s, pos);
        }
      }
      return out;
    }
  });

  reg({
    id: 'mloop', name: 'MICRO-LOOP', fam: 'def',
    desc: 'prende um trecho curto e repete — congelamento com deriva',
    params: [
      { k: 'len', label: 'Tamanho (ms)', min: 5, max: 2000, step: 5, def: 180 },
      { k: 'pos', label: 'Posição', min: 0, max: 1, step: 0.001, def: 0 },
      { k: 'drift', label: 'Deriva', min: 0, max: 1, step: 0.01, def: 0.15 },
      { k: 'cross', label: 'Emenda (ms)', min: 0, max: 200, step: 1, def: 12 },
      { k: 'freeze', t: 'b', label: 'Congelar de vez', def: 0 }
    ]
  }, {
    buf: function (b, v) {
      var sr = b.sampleRate, out = D.like(b);
      var L = Math.max(64, Math.floor(v.len / 1000 * sr));
      var xf = Math.min(Math.floor(L / 2), Math.floor(v.cross / 1000 * sr));
      for (var c = 0; c < b.numberOfChannels; c++) {
        var s = b.getChannelData(c), d = out.getChannelData(c);
        var base = Math.floor(v.pos * Math.max(0, s.length - L - 1));
        for (var j = 0; j < d.length; j++) {
          var volta = Math.floor(j / L);
          var i = j % L;
          var b0 = v.freeze > 0.5 ? base : base + Math.floor(volta * L * v.drift);
          b0 = Math.max(0, Math.min(s.length - L - 1, b0));
          var x = s[b0 + i] || 0;
          /* emenda: cruza o fim do laço com o começo, senão estala */
          if (xf > 0 && i >= L - xf) {
            var f = (i - (L - xf)) / xf;
            x = x * (1 - f) + (s[b0 + (i - (L - xf))] || 0) * f;
          }
          d[j] = x;
        }
      }
      return out;
    }
  });

  /* ====================================================== GLITCH ======== */
  reg({
    id: 'dropout', name: 'FALHA DIGITAL', fam: 'gli',
    desc: 'perda de pacote, congelamento, salto e corrupção de dados',
    params: [
      { k: 'tipo', t: 's', label: 'Falha', def: 0, opts: ['Perda de pacote', 'Congelamento', 'Salto', 'Corrupção', 'Rajada de dados', 'Sorteia'] },
      { k: 'prob', label: 'Frequência', min: 0, max: 1, step: 0.01, def: 0.25 },
      { k: 'bloco', label: 'Bloco (ms)', min: 2, max: 500, step: 1, def: 60 },
      { k: 'dur', label: 'Duração da falha', min: 0.2, max: 6, step: 0.1, def: 1.5 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 21 }
    ]
  }, {
    buf: function (b, v) {
      var sr = b.sampleRate, out = D.copy(b);
      var N = Math.max(32, Math.floor(v.bloco / 1000 * sr));
      var rnd = D.rng(v.seed);
      var nCh = out.numberOfChannels;
      for (var p = 0; p < out.length; p += N) {
        if (rnd() >= v.prob) continue;
        var tipo = (v.tipo | 0) === 5 ? Math.floor(rnd() * 5) : (v.tipo | 0);
        var comp = Math.max(1, Math.floor(N * v.dur));
        var congelaEm = Math.max(0, p - N);
        for (var c = 0; c < nCh; c++) {
          var d = out.getChannelData(c), s = b.getChannelData(c);
          for (var i = 0; i < comp; i++) {
            var j = p + i;
            if (j >= d.length) break;
            if (tipo === 0) d[j] = 0;
            else if (tipo === 1) d[j] = s[congelaEm + (i % N)] || 0;
            else if (tipo === 2) d[j] = s[Math.min(s.length - 1, j + N * 4)] || 0;
            else if (tipo === 3) {
              var x = s[j] || 0;
              var n255 = Math.round((x * 0.5 + 0.5) * 255) ^ 0x2D;
              d[j] = (n255 / 255) * 2 - 1;
            } else {
              d[j] = (rnd() * 2 - 1) * 0.7;
            }
          }
        }
      }
      return out;
    }
  });

  reg({
    id: 'chop', name: 'PICOTE', fam: 'gli',
    desc: 'corta em fatias e sorteia o que fazer com cada uma',
    params: [
      { k: 'slice', label: 'Fatia (ms)', min: 5, max: 1000, step: 5, def: 110 },
      { k: 'rep', label: 'Repetir', min: 0, max: 1, step: 0.01, def: 0.3 },
      { k: 'skip', label: 'Pular', min: 0, max: 1, step: 0.01, def: 0.15 },
      { k: 'rev', label: 'Inverter', min: 0, max: 1, step: 0.01, def: 0.2 },
      { k: 'gate', label: 'Silenciar', min: 0, max: 1, step: 0.01, def: 0.1 },
      { k: 'tom', label: 'Tom sorteado', min: 0, max: 12, step: 0.5, def: 0 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 33 }
    ]
  }, {
    buf: function (b, v) {
      var sr = b.sampleRate, out = D.like(b);
      var N = Math.max(64, Math.floor(v.slice / 1000 * sr));
      var rnd = D.rng(v.seed);
      var nCh = out.numberOfChannels;
      var w = 0, ultimo = 0;
      while (w < out.length) {
        var leitura = w;
        var r1 = rnd();
        if (r1 < v.rep) leitura = ultimo;
        else if (r1 < v.rep + v.skip) leitura = Math.min(b.length - N - 1, w + N * (1 + Math.floor(rnd() * 3)));
        leitura = Math.max(0, Math.min(Math.max(0, b.length - N - 1), leitura));
        var inverter = rnd() < v.rev;
        var mudo = rnd() < v.gate;
        var razao = v.tom > 0.01 ? Math.pow(2, (rnd() * 2 - 1) * v.tom / 12) : 1;
        for (var c = 0; c < nCh; c++) {
          var s = b.getChannelData(Math.min(c, b.numberOfChannels - 1));
          var d = out.getChannelData(c);
          for (var i = 0; i < N; i++) {
            var j = w + i;
            if (j >= d.length) break;
            if (mudo) { d[j] = 0; continue; }
            var ri = inverter ? (N - 1 - i) : i;
            /* rampa curta nas pontas: sem isso cada fatia estala */
            var env = Math.min(1, Math.min(i, N - 1 - i) / Math.max(1, N * 0.02));
            d[j] = D.readLin(s, leitura + ri * razao) * env;
          }
        }
        ultimo = leitura;
        w += N;
      }
      return out;
    }
  });

  /* ====================================================== MATÉRIA ======= */
  var MATERIAIS = ['METAL', 'VIDRO', 'PEDRA', 'PAPEL', 'PLÁSTICO', 'LÍQUIDO',
    'AREIA', 'FUMAÇA', 'BORRACHA', 'MADEIRA', 'GELO'];
  /* cada matéria é um conjunto de ressonâncias, um corte e um caráter de
     transiente. Metal ressoa alto e longo; papel é seco e curto; areia é
     quase só ruído; gelo tem um agudo cristalino e um estalo.          */
  var RECEITA_MAT = {
    0: { res: [1400, 2900, 5300, 8100], q: 26, g: 0.9, lp: 16000, hp: 200, ruido: 0.02, corpo: 0.25 },
    1: { res: [2200, 4400, 7900, 11000], q: 34, g: 0.75, lp: 18000, hp: 500, ruido: 0.01, corpo: 0.1 },
    2: { res: [180, 420, 900], q: 8, g: 0.55, lp: 4200, hp: 60, ruido: 0.03, corpo: 0.6 },
    3: { res: [900, 2600, 6400], q: 4, g: 0.3, lp: 9000, hp: 400, ruido: 0.12, corpo: 0.05 },
    4: { res: [700, 1800, 3200], q: 9, g: 0.4, lp: 7000, hp: 180, ruido: 0.04, corpo: 0.2 },
    5: { res: [320, 760, 1500], q: 14, g: 0.5, lp: 3000, hp: 90, ruido: 0.06, corpo: 0.45 },
    6: { res: [2400, 5600], q: 2, g: 0.2, lp: 12000, hp: 900, ruido: 0.30, corpo: 0.02 },
    7: { res: [220, 540], q: 3, g: 0.25, lp: 1800, hp: 40, ruido: 0.18, corpo: 0.5 },
    8: { res: [120, 280, 620], q: 6, g: 0.45, lp: 2600, hp: 50, ruido: 0.03, corpo: 0.7 },
    9: { res: [240, 620, 1350, 2700], q: 12, g: 0.6, lp: 6000, hp: 80, ruido: 0.04, corpo: 0.4 },
    10: { res: [3100, 6200, 9800], q: 40, g: 0.8, lp: 19000, hp: 700, ruido: 0.05, corpo: 0.08 }
  };

  reg({
    id: 'material', name: 'MATÉRIA', fam: 'mat',
    desc: 'onze materiais: ressonâncias, corte e caráter de transiente',
    params: [
      { k: 'tipo', t: 's', label: 'Material', def: 0, opts: MATERIAIS },
      { k: 'forca', label: 'Força', min: 0, max: 2, step: 0.01, def: 1 },
      { k: 'afin', label: 'Afinar as ressonâncias', min: 0.25, max: 4, step: 0.01, def: 1 },
      { k: 'corpo', label: 'Corpo', min: 0, max: 2, step: 0.01, def: 1 },
      { k: 'gran', label: 'Granulação', min: 0, max: 1, step: 0.01, def: 0.3 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 0.8 }
    ]
  }, {
    buf: function (b, v) {
      var r = RECEITA_MAT[v.tipo | 0] || RECEITA_MAT[0];
      var wet = D.copy(b);
      wet = D.passaAlta(wet, r.hp);
      wet = D.passaBaixa(wet, r.lp);
      for (var i = 0; i < r.res.length; i++) {
        wet = D.ressonar(wet, r.res[i] * v.afin, r.q, r.g * v.forca * (1 - i * 0.12));
      }
      /* corpo: um grave próprio da matéria */
      if (r.corpo > 0.01 && v.corpo > 0.01) {
        var grave = D.passaBaixa(D.copy(b), 220);
        for (var c = 0; c < wet.numberOfChannels; c++) {
          var d = wet.getChannelData(c);
          var g = grave.getChannelData(Math.min(c, grave.numberOfChannels - 1));
          for (var j = 0; j < d.length; j++) d[j] += g[j] * r.corpo * v.corpo * 0.8;
        }
      }
      /* granulação: a textura da superfície */
      if (r.ruido > 0.001 && v.gran > 0.001) {
        var rnd = D.rng(1234 + (v.tipo | 0));
        for (var c2 = 0; c2 < wet.numberOfChannels; c2++) {
          var dd = wet.getChannelData(c2);
          var sd = b.getChannelData(Math.min(c2, b.numberOfChannels - 1));
          for (var k = 0; k < dd.length; k++) {
            var env = Math.abs(sd[k]);
            dd[k] += (rnd() * 2 - 1) * r.ruido * v.gran * env * 3;
          }
        }
      }
      D.normalizar(wet, 0.95);
      return D.blend(b, wet, v.mix);
    }
  });

  /* ===================================================== ESPACIAL ======= */
  reg({
    id: 'spatial', name: 'ESPACIAL', fam: 'esp',
    desc: 'órbita, doppler, espiral, largura e distância — a fonte se move',
    params: [
      { k: 'tipo', t: 's', label: 'Movimento', def: 0, opts: ['Órbita', 'Doppler', 'Espiral', 'Deriva estéreo', 'Distância', 'Largura', 'Rotação'] },
      { k: 'rate', label: 'Velocidade (Hz)', min: 0.01, max: 12, step: 0.01, def: 0.4 },
      { k: 'amt', label: 'Alcance', min: 0, max: 1, step: 0.01, def: 0.8 },
      { k: 'dist', label: 'Distância', min: 0, max: 1, step: 0.01, def: 0.3 },
      { k: 'doppler', label: 'Doppler', min: 0, max: 1, step: 0.01, def: 0.4 }
    ]
  }, {
    buf: function (b, v) {
      var src = D.estereo(b);
      var sr = src.sampleRate;
      var out = D.like(src);
      var L = src.getChannelData(0), R = src.getChannelData(1);
      var dL = out.getChannelData(0), dR = out.getChannelData(1);
      var tipo = v.tipo | 0;
      var maxAtraso = Math.floor(0.02 * sr);
      var posL = 0, posR = 0;
      for (var i = 0; i < out.length; i++) {
        var t = i / sr;
        var ang;
        if (tipo === 2) ang = 2 * Math.PI * v.rate * t * (1 + t * 0.05);
        else ang = 2 * Math.PI * v.rate * t;
        var x, prof;
        if (tipo === 3) { x = Math.sin(ang) * v.amt; prof = 0; }
        else if (tipo === 5) { x = 0; prof = 0; }
        else if (tipo === 6) { x = Math.sin(ang) * v.amt; prof = Math.cos(ang) * v.amt; }
        else { x = Math.sin(ang) * v.amt; prof = Math.cos(ang) * v.amt; }

        /* panorama de potência constante */
        var pan = Math.max(-1, Math.min(1, x));
        var gl = Math.cos((pan + 1) * Math.PI / 4);
        var gr = Math.sin((pan + 1) * Math.PI / 4);
        /* distância: mais longe = mais baixo e mais abafado */
        var d0 = 0.5 + v.dist * 2 + prof * v.dist;
        var atenua = 1 / Math.max(0.4, d0);
        /* doppler: aproximar sobe o tom, afastar desce */
        var vel = (tipo === 1 || tipo === 0 || tipo === 2) ?
          (-Math.sin(ang) * v.rate * v.doppler * 0.06) : 0;
        posL += 1 + vel;
        posR += 1 + vel;
        /* atraso interaural: o ouvido mais longe recebe depois */
        var itd = pan * maxAtraso * 0.5;
        var xl = D.readLin(L, posL - Math.max(0, itd));
        var xr = D.readLin(R, posR - Math.max(0, -itd));
        if (tipo === 5) {
          /* largura: mexe no meio/lado, não no panorama */
          var m = (xl + xr) * 0.5, s2 = (xl - xr) * 0.5 * (1 + v.amt * 2);
          dL[i] = m + s2; dR[i] = m - s2;
        } else {
          dL[i] = xl * gl * atenua;
          dR[i] = xr * gr * atenua;
        }
      }
      if (v.dist > 0.02 && (v.tipo | 0) !== 5) out = D.passaBaixa(out, 18000 - v.dist * 15000);
      return out;
    }
  });

  /* ================================================ PSICOACÚSTICA ======= */
  reg({
    id: 'psico', name: 'PSICOACÚSTICA', fam: 'psi',
    desc: 'ilusões de espaço e de altura: binaural, Haas, Shepard, deslocamento',
    params: [
      { k: 'tipo', t: 's', label: 'Ilusão', def: 0, opts: ['Binaural', 'Haas', 'Centro fantasma', 'Shepard', 'Deslocar frequência', 'Fase invertida', 'Desorientação'] },
      { k: 'amt', label: 'Intensidade', min: 0, max: 1, step: 0.01, def: 0.6 },
      { k: 'hz', label: 'Deslocamento (Hz)', min: -400, max: 400, step: 1, def: 60 },
      { k: 'rate', label: 'Velocidade (Hz)', min: 0.01, max: 4, step: 0.01, def: 0.25 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 9 }
    ]
  }, {
    buf: function (b, v) {
      var src = D.estereo(b), sr = src.sampleRate;
      var tipo = v.tipo | 0;
      if (tipo === 4) return D.deslocarFreq(src, v.hz * v.amt);

      var out = D.like(src);
      var L = src.getChannelData(0), R = src.getChannelData(1);
      var dL = out.getChannelData(0), dR = out.getChannelData(1);
      var rnd = D.rng(v.seed);

      if (tipo === 0) {
        /* binaural: atraso e sombra de cabeça girando em volta do ouvinte */
        var maxITD = 0.00065 * sr;
        var escuro = D.passaBaixa(D.copy(src), 2200);
        var eL = escuro.getChannelData(0), eR = escuro.getChannelData(1);
        for (var i = 0; i < out.length; i++) {
          var a = 2 * Math.PI * v.rate * (i / sr);
          var pan = Math.sin(a) * v.amt;
          var itd = pan * maxITD;
          var sombraL = pan > 0 ? v.amt * Math.abs(pan) : 0;
          var sombraR = pan < 0 ? v.amt * Math.abs(pan) : 0;
          dL[i] = D.readLin(L, i - Math.max(0, itd)) * (1 - sombraL * 0.5) + eL[i] * sombraL * 0.5;
          dR[i] = D.readLin(R, i - Math.max(0, -itd)) * (1 - sombraR * 0.5) + eR[i] * sombraR * 0.5;
        }
      } else if (tipo === 1) {
        /* Haas: 8 a 35 ms num canal só. O ouvido junta os dois e localiza
           a fonte do lado que chegou primeiro, sem perceber o eco.      */
        var n = Math.floor((0.008 + v.amt * 0.027) * sr);
        for (var j = 0; j < out.length; j++) {
          dL[j] = L[j];
          dR[j] = (j - n >= 0 ? R[j - n] : 0) * 0.92 + R[j] * 0.08;
        }
      } else if (tipo === 2) {
        /* centro fantasma: reforça o que é igual nos dois canais */
        for (var k = 0; k < out.length; k++) {
          var m = (L[k] + R[k]) * 0.5, s2 = (L[k] - R[k]) * 0.5;
          m *= 1 + v.amt * 1.5; s2 *= 1 - v.amt * 0.6;
          dL[k] = m + s2; dR[k] = m - s2;
        }
      } else if (tipo === 3) {
        /* Shepard: oitavas empilhadas com envelope que desliza. A escala
           parece subir para sempre porque a de cima some enquanto a de
           baixo nasce.                                                  */
        var oct = [-12, 0, 12];
        var camadas = oct.map(function (semi) { return D.tom(src, semi + v.hz * 0.02 * v.amt, 0.06); });
        for (var q = 0; q < out.length; q++) {
          var fase = (q / sr) * v.rate;
          var acL = 0, acR = 0;
          for (var c2 = 0; c2 < camadas.length; c2++) {
            var g = 0.5 - 0.5 * Math.cos(2 * Math.PI * ((fase + c2 / camadas.length) % 1));
            acL += camadas[c2].getChannelData(0)[q] * g;
            acR += camadas[c2].getChannelData(1)[q] * g;
          }
          dL[q] = acL / camadas.length * 1.6;
          dR[q] = acR / camadas.length * 1.6;
        }
      } else if (tipo === 5) {
        /* fase invertida: o som deixa de ter lugar */
        for (var p = 0; p < out.length; p++) {
          dL[p] = L[p];
          dR[p] = R[p] * (1 - v.amt) + (-R[p]) * v.amt;
        }
      } else {
        /* desorientação: a fonte pula de lugar em intervalos sorteados */
        var bloco = Math.floor(sr * (0.05 + (1 - v.rate / 4) * 0.4));
        var pan2 = 0;
        for (var z = 0; z < out.length; z++) {
          if (z % bloco === 0) pan2 = (rnd() * 2 - 1) * v.amt;
          var gl = Math.cos((pan2 + 1) * Math.PI / 4), gr = Math.sin((pan2 + 1) * Math.PI / 4);
          dL[z] = L[z] * gl * 1.4; dR[z] = R[z] * gr * 1.4;
        }
      }
      return out;
    }
  });

  /* ====================================================== GRANULAR ====== */
  reg({
    id: 'granlab', name: 'GRANULAR (LABORATÓRIO)', fam: 'gra',
    desc: 'motor granular completo: tamanho, densidade, posição, spray, tom e sentido',
    params: [
      { k: 'grain', label: 'Tamanho do grão (s)', min: 0.002, max: 0.5, step: 0.001, def: 0.08 },
      { k: 'grainJit', label: 'Desvio do tamanho', min: 0, max: 1, step: 0.01, def: 0.2 },
      { k: 'dens', label: 'Densidade', min: 0.05, max: 12, step: 0.05, def: 2 },
      { k: 'pos', label: 'Posição', min: -1, max: 1, step: 0.001, def: 0 },
      { k: 'spray', label: 'Dispersão da posição', min: 0, max: 1, step: 0.01, def: 0.08 },
      { k: 'pitch', label: 'Tom (semitons)', min: -24, max: 24, step: 0.5, def: 0 },
      { k: 'pitchJit', label: 'Desvio do tom', min: 0, max: 24, step: 0.5, def: 0 },
      { k: 'dur', label: 'Duração final', min: 0.1, max: 8, step: 0.05, def: 1 },
      { k: 'pan', label: 'Espalhar no estéreo', min: 0, max: 1, step: 0.01, def: 0.3 },
      { k: 'rev', label: 'Grãos invertidos', min: 0, max: 1, step: 0.01, def: 0 },
      { k: 'tex', label: 'Textura do envelope', min: 0.15, max: 4, step: 0.05, def: 1 },
      { k: 'freeze', t: 'b', label: 'Congelar a posição', def: 0 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 1 }
    ]
  }, {
    buf: function (b, v) {
      var src = D.estereo(b);
      var wet = D.granular(src, v);
      if (v.mix >= 0.999) return wet;
      return D.blend(src, wet, v.mix);
    }
  });

  /* ===================================================== ESPECTRAL ====== */
  reg({
    id: 'spectral', name: 'ESPECTRAL', fam: 'spc',
    desc: 'congelar, borrar, esticar e filtrar no domínio da frequência',
    params: [
      { k: 'tipo', t: 's', label: 'Operação', def: 0, opts: D.ESPECTRAL_NOMES },
      { k: 'amt', label: 'Intensidade', min: 0, max: 1, step: 0.01, def: 0.8 },
      { k: 'janela', t: 's', label: 'Janela', def: 2, opts: ['512 · rápida', '1024', '2048 · equilíbrio', '4096 · fina'] },
      { k: 'pos', label: 'Posição do congelamento', min: 0, max: 1, step: 0.01, def: 0.3 },
      { k: 'shift', label: 'Deslocamento', min: -1, max: 1, step: 0.01, def: 0.2 },
      { k: 'lo', label: 'Faixa · grave', min: 0, max: 1, step: 0.01, def: 0 },
      { k: 'hi', label: 'Faixa · agudo', min: 0, max: 1, step: 0.01, def: 1 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 3 }
    ]
  }, {
    buf: function (b, v) {
      var wet = D.espectral(b, v);
      if (v.mix >= 0.999) return wet;
      return D.blend(b, wet, v.mix);
    }
  });

  /* =================================================== ÓRBITA 3D =========
     O módulo ESPACIAL põe o som à esquerda ou à direita: é panorâmica com
     atraso interaural. Isso resolve o eixo horizontal e só ele.

     Aqui a fonte tem POSIÇÃO no espaço — x, y, z — e o navegador aplica
     HRTF: o mesmo filtro que o seu crânio, as suas orelhas e os seus
     ombros aplicam ao som antes de ele chegar ao tímpano. É o que faz o
     ouvido distinguir FRENTE de TRÁS e ACIMA de ABAIXO, coisa que
     panorâmica nenhuma consegue.

     Em fones de ouvido a diferença é gritante; em caixas, bem menor.

     O doppler é feito à parte, com um atraso que acompanha a distância:
     o efeito doppler da Web Audio foi retirado da especificação, e o que
     restou seria um controle falso. Atraso que encurta enquanto a fonte
     se aproxima sobe o tom sozinho — é o fenômeno, não a imitação dele.
     ====================================================================== */
  var TRAJETOS = ['Círculo', 'Espiral', 'Oito', 'Vaivém', 'Elevação',
    'Aproximar e afastar', 'Sobrevoo', 'Sorteada'];

  reg({
    id: 'orbit3d', name: 'ÓRBITA 3D (HRTF)', fam: 'esp',
    desc: 'a fonte tem posição no espaço e o ouvido distingue frente, trás e altura',
    params: [
      { k: 'traj', t: 's', label: 'Trajeto', def: 0, opts: TRAJETOS },
      { k: 'rate', label: 'Voltas por segundo', min: 0.01, max: 6, step: 0.01, def: 0.35 },
      { k: 'raio', label: 'Raio (m)', min: 0.3, max: 12, step: 0.1, def: 2.5 },
      { k: 'alt', label: 'Altura', min: -6, max: 6, step: 0.1, def: 0 },
      { k: 'frente', label: 'Empurrar para frente', min: -6, max: 6, step: 0.1, def: 0 },
      { k: 'queda', label: 'Perda com a distância', min: 0, max: 3, step: 0.01, def: 1 },
      { k: 'dop', label: 'Doppler', min: 0, max: 1, step: 0.01, def: 0.35 },
      { k: 'ar', label: 'Absorção do ar', min: 0, max: 1, step: 0.01, def: 0.3 },
      { k: 'fase', label: 'Ponto de partida', min: 0, max: 1, step: 0.01, def: 0 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 4 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 }
    ]
  }, {
    node: function (off, last, v) {
      var dur = off.length / off.sampleRate;
      var N = Math.max(8, Math.min(48000, Math.ceil(dur * 240)));   /* 240 pontos por segundo */
      var px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
      var atraso = new Float32Array(N);
      var rnd = D.rng(v.seed);
      var modo = v.traj | 0;
      var r = Math.max(0.3, v.raio);

      /* pontos sorteados do trajeto "Sorteada", suavizados depois */
      var wp = [];
      for (var w = 0; w < 12; w++) wp.push([rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]);

      for (var i = 0; i < N; i++) {
        var t = i / (N - 1) * dur;
        var a = 2 * Math.PI * (v.rate * t + v.fase);
        var x = 0, y = v.alt, z = -v.frente;

        if (modo === 0) {                       /* círculo em volta da cabeça */
          x = Math.sin(a) * r; z = Math.cos(a) * r - v.frente;
        } else if (modo === 1) {                /* espiral: sobe enquanto gira */
          var k = t / Math.max(0.01, dur);
          x = Math.sin(a) * r * (0.25 + k);
          z = Math.cos(a) * r * (0.25 + k) - v.frente;
          y = v.alt * (k * 2 - 1);
        } else if (modo === 2) {                /* oito deitado */
          x = Math.sin(a) * r; z = Math.sin(2 * a) * r * 0.5 - v.frente;
        } else if (modo === 3) {                /* vaivém de um lado ao outro */
          x = Math.sin(a) * r; z = -v.frente;
        } else if (modo === 4) {                /* sobe e desce à frente */
          y = Math.sin(a) * Math.abs(v.alt || r); z = -Math.abs(v.frente || r);
        } else if (modo === 5) {                /* chega e vai embora */
          z = -(0.4 + (0.5 - 0.5 * Math.cos(a)) * r * 2) - v.frente;
        } else if (modo === 6) {                /* sobrevoo: passa por cima */
          z = (Math.cos(a) * r * 1.6) - v.frente;
          y = Math.max(0, Math.sin(a)) * (Math.abs(v.alt) || r * 0.8);
          x = Math.sin(a * 0.5) * r * 0.4;
        } else {                                /* sorteada, com curva suave */
          var f = (t / Math.max(0.01, dur)) * (wp.length - 1);
          var i0 = Math.min(wp.length - 2, f | 0), fr = f - i0;
          fr = fr * fr * (3 - 2 * fr);
          x = (wp[i0][0] * (1 - fr) + wp[i0 + 1][0] * fr) * r;
          y = (wp[i0][1] * (1 - fr) + wp[i0 + 1][1] * fr) * Math.abs(v.alt || 1);
          z = (wp[i0][2] * (1 - fr) + wp[i0 + 1][2] * fr) * r - v.frente;
        }

        px[i] = x; py[i] = y; pz[i] = z;
        atraso[i] = Math.sqrt(x * x + y * y + z * z);   /* por ora, a distância */
      }

      /* ------------------------------------------------------- DOPPLER
         O atraso de propagação é distância ÷ 343 m/s, e é a VARIAÇÃO dele
         que muda o tom: encurtar enquanto a fonte se aproxima comprime as
         ondas. Em escala real isso dá 36 ms no pior caso — inaudível.

         Exagerar por um fator fixo estourava o atraso máximo do nó e o
         doppler travava no teto: o tom caía uma vez e ficava parado. O
         fator agora é calculado a partir da MAIOR distância do trajeto,
         de modo que a excursão inteira caiba sem saturar.               */
      var distMax = 0;
      for (var q0 = 0; q0 < N; q0++) if (atraso[q0] > distMax) distMax = atraso[q0];
      var escala = distMax > 0.01 ? Math.min(14, 0.18 * 343 / distMax) : 0;
      for (var q1 = 0; q1 < N; q1++) atraso[q1] = (atraso[q1] / 343) * escala * v.dop;

      var pan = off.createPanner();
      pan.panningModel = 'HRTF';
      pan.distanceModel = 'inverse';
      pan.refDistance = 1;
      pan.maxDistance = 100;
      pan.rolloffFactor = v.queda;

      var entrada = last;
      /* doppler por atraso variável: encurtar o atraso sobe o tom */
      if (v.dop > 0.004) {
        var dl = off.createDelay(0.25);
        try { dl.delayTime.setValueCurveAtTime(atraso, 0, Math.max(0.01, dur)); }
        catch (e) { dl.delayTime.value = atraso[0]; }
        entrada.connect(dl);
        entrada = dl;
      }

      /* absorção do ar: o agudo se perde antes do grave com a distância */
      if (v.ar > 0.004) {
        var lp = off.createBiquadFilter();
        lp.type = 'lowpass';
        var corte = new Float32Array(N);
        for (var q = 0; q < N; q++) {
          var d2 = Math.sqrt(px[q] * px[q] + py[q] * py[q] + pz[q] * pz[q]);
          corte[q] = Math.max(600, 20000 - v.ar * d2 * 1600);
        }
        try { lp.frequency.setValueCurveAtTime(corte, 0, Math.max(0.01, dur)); }
        catch (e2) { lp.frequency.value = corte[0]; }
        entrada.connect(lp);
        entrada = lp;
      }

      /* posição no tempo. Onde positionX for AudioParam dá para automatizar
         a trajetória inteira de uma vez; onde não for, sobra o ponto inicial. */
      if (pan.positionX && pan.positionX.setValueCurveAtTime) {
        var t0 = Math.max(0.01, dur);
        try {
          pan.positionX.setValueCurveAtTime(px, 0, t0);
          pan.positionY.setValueCurveAtTime(py, 0, t0);
          pan.positionZ.setValueCurveAtTime(pz, 0, t0);
        } catch (e3) { pan.setPosition(px[0], py[0], pz[0]); }
      } else if (pan.setPosition) {
        pan.setPosition(px[0], py[0], pz[0]);
      }

      entrada.connect(pan);
      if (v.mix >= 0.999) return pan;
      var seco = off.createGain(); seco.gain.value = 1 - v.mix;
      var molhado = off.createGain(); molhado.gain.value = v.mix;
      var soma = off.createGain();
      last.connect(seco); seco.connect(soma);
      pan.connect(molhado); molhado.connect(soma);
      return soma;
    }
  });

  /* ==================================================== GENERATIVO ====== */
  reg({
    id: 'caos', name: 'CAOS / GENERATIVO', fam: 'ger',
    desc: 'o sistema decide sozinho — tom, filtro, panorama e fragmentação por sorteio',
    params: [
      { k: 'rand', label: 'Aleatoriedade', min: 0, max: 1, step: 0.01, def: 0.5 },
      { k: 'inten', label: 'Intensidade', min: 0, max: 1, step: 0.01, def: 0.5 },
      { k: 'prob', label: 'Probabilidade', min: 0, max: 1, step: 0.01, def: 0.5 },
      { k: 'speed', label: 'Velocidade', min: 0.05, max: 20, step: 0.05, def: 2 },
      { k: 'alvo', t: 's', label: 'O que muda', def: 0, opts: ['Tudo', 'Tom', 'Filtro', 'Panorama', 'Fragmento', 'Realimentação'] },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 42 }
    ]
  }, {
    buf: function (b, v) {
      var src = D.estereo(b), sr = src.sampleRate;
      var out = D.like(src);
      var rnd = D.rng(v.seed);
      var L = src.getChannelData(0), R = src.getChannelData(1);
      var dL = out.getChannelData(0), dR = out.getChannelData(1);
      var bloco = Math.max(64, Math.floor(sr / Math.max(0.05, v.speed)));
      var alvo = v.alvo | 0;
      var pos = 0, razao = 1, pan = 0, corte = 1, mudo = false;
      var zL = 0, zR = 0;
      for (var i = 0; i < out.length; i++) {
        if (i % bloco === 0) {
          if (rnd() < v.prob) {
            var q = rnd();
            if (alvo === 0 || alvo === 1) razao = Math.pow(2, (rnd() * 2 - 1) * v.inten * 12 / 12);
            if (alvo === 0 || alvo === 2) corte = 0.02 + Math.pow(rnd(), 2) * (1 - v.inten * 0.7) + 0.03;
            if (alvo === 0 || alvo === 3) pan = (rnd() * 2 - 1) * v.inten;
            if (alvo === 0 || alvo === 4) {
              mudo = q < v.inten * 0.2;
              if (q > 1 - v.rand * 0.4) pos = rnd() * Math.max(0, L.length - bloco - 1);
            }
            if (alvo === 5) razao = 1;
          } else if (v.rand > 0.5 && rnd() < v.rand * 0.2) {
            razao = 1; pan = 0; corte = 1; mudo = false;
          }
        }
        pos += razao;
        if (pos >= L.length - 1) pos -= (L.length - 1);
        var xl = mudo ? 0 : D.readLin(L, pos);
        var xr = mudo ? 0 : D.readLin(R, pos);
        /* filtro de um polo com corte sorteado */
        zL += (xl - zL) * corte; zR += (xr - zR) * corte;
        xl = corte < 0.999 ? zL : xl; xr = corte < 0.999 ? zR : xr;
        /* realimentação: o que já saiu volta a entrar */
        if (alvo === 5) {
          var atras = i - Math.floor(bloco * 0.5);
          if (atras > 0) { xl += dL[atras] * v.inten * 0.6; xr += dR[atras] * v.inten * 0.6; }
        }
        var gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
        dL[i] = Math.max(-1.5, Math.min(1.5, xl * gl * 1.4));
        dR[i] = Math.max(-1.5, Math.min(1.5, xr * gr * 1.4));
      }
      return out;
    }
  });


  /* ================================================ DICAS DOS CONTROLES
     Alguns nomes são de oficina, não de português: SEMENTE, MISTURA,
     JANELA. Em vez de renomear e perder a precisão, cada um ganha uma
     explicação — `dica` aparece ao passar o mouse no rótulo, e `nota`
     fica escrita embaixo do controle, para quem não passa o mouse.
     ==================================================================== */
  var EXPLICA = {
    seed: {
      label: 'Semente do sorteio',
      dica: 'Troque o número e o sorteio muda. O mesmo número devolve sempre o mesmo resultado.',
      nota: 'o sorteio deste módulo. troque o número para um resultado diferente; volte ao número e o som volta igualzinho.'
    },
    mix: { dica: 'Quanto do som processado se mistura ao original. 0 = só o original, 1 = só o processado.' },
    janela: { dica: 'Tamanho do pedaço analisado por vez. Janela maior = mais detalhe na frequência e mais lento.' },
    amt: { dica: 'A força do efeito.' },
    inten: { dica: 'A força do efeito.' },
    prob: { dica: 'A chance de acontecer. 0 = nunca, 1 = a toda hora.' },
    rate: { dica: 'Quantas vezes por segundo.' },
    tipo: { dica: 'Escolha aqui — cada opção é um efeito diferente dentro deste módulo.' },
    traj: { dica: 'O caminho que a fonte de som percorre em volta de você.' },
    dop: { dica: 'O tom sobe quando a fonte se aproxima e desce quando se afasta, como uma ambulância passando.' },
    tail: { dica: 'Quanto tempo o som continua depois de acabar.' }
  };

  A.modules.forEach(function (m) {
    m.params.forEach(function (p) {
      var e = EXPLICA[p.k];
      if (!e) return;
      if (e.label && p.k === 'seed') p.label = e.label;
      if (e.dica && !p.dica) p.dica = e.dica;
      if (e.nota && !p.nota) p.nota = e.nota;
    });
  });

  /* o seletor que abre as variações do módulo é o controle mais
     importante do cartão: ele ganha um aviso, porque foi o que passou
     despercebido — doze ambientes escondidos atrás de um menu.        */
  A.modules.forEach(function (m) {
    var primeiro = m.params[0];
    if (!primeiro || primeiro.t !== 's') return;
    if (primeiro.opts && primeiro.opts.length >= 4 && !primeiro.nota) {
      primeiro.nota = primeiro.opts.length + ' opções neste menu — cada uma é um efeito diferente';
    }
  });

})(window.VE);
