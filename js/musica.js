/* ============================================================
   rgb_lab — O NÚCLEO MUSICAL
   ------------------------------------------------------------
   Escalas, vozes, síntese, .mid e renderização em áudio. É o que
   TODO instrumento do laboratório precisa e nenhum deveria ter
   cópia própria.

   POR QUE ISTO SAIU DE DENTRO DO SONÓGRAFO
   Nasceu lá, quando havia um instrumento só. Ao aparecer o
   segundo, a escolha era copiar duzentas linhas de sintetizador,
   escritor de MIDI e tabela de escalas — ou promovê-las. Copiar
   significaria dois bancos de timbre que divergem no primeiro
   conserto, e dois escritores de .mid dos quais só um teria o
   comprimento de etiqueta corrigido. Então promoveu-se.

   O sonógrafo continua expondo os mesmos nomes de sempre
   (`VE.sonografo.VOZES`, `.tocar`, `.midi`, `.render`): lá dentro
   agora são apelidos daqui. Nada que já funcionava mudou de
   endereço.

   A REGRA QUE ORGANIZA ESTE ARQUIVO: só entra o que MAIS DE UM
   instrumento usa hoje. Acordes, campo harmônico e inversões são
   teoria tão geral quanto escalas, e mesmo assim ficaram em
   `js/cifra.js`, porque só um instrumento os usa. Quando o
   segundo precisar, sobem para cá — e não antes.
   ============================================================ */
(function (VE) {
  'use strict';

  var M = VE.musica = {};

  /* ══════════════════════════════════ ESCALAS ══════════════════ */
  M.ESCALAS = [
    { id: 'cromatica', nome: 'Cromática',         g: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    { id: 'maior',     nome: 'Maior',             g: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'menor',     nome: 'Menor natural',     g: [0, 2, 3, 5, 7, 8, 10] },
    { id: 'menorh',    nome: 'Menor harmônica',   g: [0, 2, 3, 5, 7, 8, 11] },
    { id: 'pentam',    nome: 'Pentatônica maior', g: [0, 2, 4, 7, 9] },
    { id: 'pentan',    nome: 'Pentatônica menor', g: [0, 3, 5, 7, 10] },
    { id: 'blues',     nome: 'Blues',             g: [0, 3, 5, 6, 7, 10] },
    { id: 'dorico',    nome: 'Dórico',            g: [0, 2, 3, 5, 7, 9, 10] },
    { id: 'mixo',      nome: 'Mixolídio',         g: [0, 2, 4, 5, 7, 9, 10] },
    { id: 'frigio',    nome: 'Frígio',            g: [0, 1, 3, 5, 7, 8, 10] },
    { id: 'lidio',     nome: 'Lídio',             g: [0, 2, 4, 6, 7, 9, 11] },
    { id: 'insen',     nome: 'In sen',            g: [0, 1, 5, 7, 8] },
    { id: 'hijaz',     nome: 'Hijaz',             g: [0, 1, 4, 5, 7, 8, 11] },
    { id: 'inteiros',  nome: 'Tons inteiros',     g: [0, 2, 4, 6, 8, 10] }
  ];
  M.NOMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  M.escalaDe = function (id) {
    for (var i = 0; i < M.ESCALAS.length; i++) if (M.ESCALAS[i].id === id) return M.ESCALAS[i];
    return M.ESCALAS[0];
  };

  /* Arredonda para o grau mais perto DENTRO da escala. A volta pela
     oitava de cima entra na disputa — sem isso, um B numa escala que
     termina em A# despencava uma sétima em vez de subir um semitom. */
  M.quantizar = function (nota, escId, tom) {
    var g = M.escalaDe(escId).g;
    var n = Math.round(nota);
    var rel = n - tom;
    var oct = Math.floor(rel / 12);
    var pc = rel - oct * 12;
    var melhor = g[0], d = 99;
    for (var i = 0; i < g.length; i++) {
      var dd = Math.abs(g[i] - pc);
      if (dd < d) { d = dd; melhor = g[i]; }
    }
    if (Math.abs(12 - pc) < d) melhor = 12;
    return tom + oct * 12 + melhor;
  };

  M.nomeNota = function (n) {
    return M.NOMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
  };
  M.freq = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };

  /* ══════════════════════════════════ VOZES ════════════════════
     Instrumentos sintetizados, não amostras. É decisão de escopo:
     um banco de sons é MUITO arquivo, e sintetizar dá dez timbres
     que funcionam offline, no arquivo único e dentro do
     OfflineAudioContext da exportação, com o MESMO código do que
     se ouve ao vivo. O banco de amostras entra depois, por cima
     disto, sem reescrever nada.

     `gm` é o programa General MIDI equivalente, usado só na
     exportação .mid — quem abrir no DAW ouve algo parecido.      */
  M.VOZES = [
    { id: 'piano',        nome: 'Piano',          gm: 0,  ondas: ['triangle', 'sine'], corte: 4200, atk: .004, dec: 1.7, sus: 0,   rel: .12, g: .50 },
    { id: 'eletrico',     nome: 'Piano elétrico', gm: 4,  ondas: ['sine'], fm: 2.0,  fmi: 2.2, corte: 3200, atk: .004, dec: 1.3, sus: .05, rel: .14, g: .48 },
    { id: 'sintetizador', nome: 'Sintetizador',   gm: 81, ondas: ['sawtooth', 'sawtooth'], det: 7, corte: 2200, atk: .012, dec: .70, sus: .45, rel: .20, g: .30 },
    { id: 'baixo',        nome: 'Baixo',          gm: 38, ondas: ['sine', 'triangle'], oit2: -12, corte: 700, atk: .006, dec: .60, sus: .55, rel: .12, g: .55 },
    { id: 'cordas',       nome: 'Cordas',         gm: 48, ondas: ['sawtooth', 'sawtooth'], det: 9, corte: 2600, atk: .30, dec: .50, sus: .75, rel: .50, g: .26 },
    { id: 'sopro',        nome: 'Sopro',          gm: 73, ondas: ['sine'], ruido: .06, corte: 3000, atk: .13, dec: .30, sus: .80, rel: .24, g: .34 },
    { id: 'sino',         nome: 'Sino',           gm: 14, ondas: ['sine'], fm: 3.53, fmi: 4.5, corte: 6000, atk: .002, dec: 2.6, sus: 0, rel: .30, g: .34 },
    { id: 'marimba',      nome: 'Marimba',        gm: 12, ondas: ['sine', 'sine'], oit2: 12, corte: 5000, atk: .002, dec: .38, sus: 0, rel: .06, g: .52 },
    { id: 'pluck',        nome: 'Corda pinçada',  gm: 45, ondas: ['sawtooth'], corte: 3200, varre: .12, atk: .002, dec: .36, sus: 0, rel: .07, g: .40 },
    { id: 'percussao',    nome: 'Percussão',      gm: -1, perc: true, atk: .001, dec: .20, sus: 0, rel: .05, g: .60 }
  ];
  M.vozDe = function (id) {
    for (var i = 0; i < M.VOZES.length; i++) if (M.VOZES[i].id === id) return M.VOZES[i];
    return M.VOZES[0];
  };

  /* ══════════════════════════════ SÍNTESE ══════════════════════
     Uma função só, usada por DOIS contextos: o ao vivo (AudioContext
     do laboratório) e o da exportação (OfflineAudioContext). É a
     razão de o áudio exportado ser idêntico ao que se ouviu — não
     há um segundo sintetizador para divergir do primeiro.

     Com `dur` nulo devolve um punho: a nota fica presa até alguém
     chamar `soltar(t)`. É assim que uma tecla segurada soa
     enquanto o dedo está em cima dela.                           */
  function ruidoDe(ctx) {
    if (ctx._musRuido) return ctx._musRuido;
    var n = Math.floor(ctx.sampleRate * .5);
    var b = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    ctx._musRuido = b;
    return b;
  }

  M.tocar = function (ctx, dest, vozId, nota, t0, dur, vel) {
    var V = M.vozDe(vozId);
    var f = M.freq(nota);
    var env = ctx.createGain();
    var pico = Math.max(.0015, V.g * vel);
    var fontes = [];

    if (V.perc) {
      var s = ctx.createBufferSource();
      s.buffer = ruidoDe(ctx);
      s.loop = true;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = Math.max(60, Math.min(9000, f * 2));
      bp.Q.value = 1.6 + vel * 5;
      s.connect(bp); bp.connect(env);
      fontes.push(s);
    } else {
      var filtro = ctx.createBiquadFilter();
      filtro.type = 'lowpass';
      filtro.Q.value = .7;
      var corte = Math.max(220, Math.min(ctx.sampleRate / 2 - 1000, (V.corte || 3000) * (.5 + vel)));
      filtro.frequency.setValueAtTime(corte, t0);
      if (V.varre) filtro.frequency.exponentialRampToValueAtTime(Math.max(220, corte * .18), t0 + V.varre);
      filtro.connect(env);

      (V.ondas || ['sine']).forEach(function (onda, idx) {
        var o = ctx.createOscillator();
        o.type = onda;
        var ff = f * (idx === 1 && V.oit2 ? Math.pow(2, V.oit2 / 12) : 1);
        o.frequency.value = ff;
        if (V.det && idx === 1) o.detune.value = V.det;
        else if (V.det && idx === 0) o.detune.value = -V.det;
        var gm = ctx.createGain();
        gm.gain.value = idx === 0 ? 1 : .5;
        o.connect(gm); gm.connect(filtro);
        fontes.push(o);
        /* FM: um oscilador modula a frequência do primeiro. Índice em
           HERTZ (fmi × f), que é como a modulação acompanha a altura
           em vez de virar grave demais no agudo.                    */
        if (V.fm && idx === 0) {
          var mo = ctx.createOscillator();
          mo.type = 'sine';
          mo.frequency.value = ff * V.fm;
          var mg = ctx.createGain();
          mg.gain.setValueAtTime(ff * V.fmi * (.4 + vel * .6), t0);
          mg.gain.exponentialRampToValueAtTime(Math.max(1, ff * .02), t0 + Math.min(2, V.dec));
          mo.connect(mg); mg.connect(o.frequency);
          fontes.push(mo);
        }
      });
      if (V.ruido) {
        var rs = ctx.createBufferSource();
        rs.buffer = ruidoDe(ctx); rs.loop = true;
        var rg = ctx.createGain(); rg.gain.value = V.ruido;
        rs.connect(rg); rg.connect(filtro);
        fontes.push(rs);
      }
    }

    /* envelope: ataque linear, queda exponencial até o sustento     */
    var piso = Math.max(.0002, pico * .0008);
    env.gain.setValueAtTime(piso, t0);
    env.gain.linearRampToValueAtTime(pico, t0 + V.atk);
    var alvo = Math.max(piso, pico * V.sus);
    env.gain.exponentialRampToValueAtTime(alvo, t0 + V.atk + V.dec);
    env.connect(dest);

    var fim = 0;
    function soltar(tf) {
      if (fim) return fim;
      var ts = Math.max(tf, t0 + V.atk + .005);
      env.gain.cancelScheduledValues(ts);
      /* preserva o valor que a curva tinha em ts — sem isto o
         `cancelScheduledValues` congela no último ponto AGENDADO e a
         nota dá um salto de volume ao soltar                        */
      var passado = Math.min(1, (ts - t0 - V.atk) / Math.max(.001, V.dec));
      var atual = Math.max(piso, pico * Math.pow(Math.max(alvo / pico, 1e-4), passado));
      env.gain.setValueAtTime(atual, ts);
      env.gain.exponentialRampToValueAtTime(piso, ts + V.rel);
      fim = ts + V.rel + .02;
      fontes.forEach(function (s) { try { s.stop(fim); } catch (e) { } });
      return fim;
    }

    fontes.forEach(function (s) { try { s.start(t0); } catch (e) { } });
    if (dur != null) { soltar(t0 + dur); return null; }
    return { soltar: soltar };
  };

  /* ══════════════════════════════ MIDI ═════════════════════════
     Arquivo padrão formato 0, 480 pulsos por semínima. Recebe uma
     LISTA DE NOTAS — `{t, dur, nota, vel, canal}` — e não o estado
     de um instrumento: é por isso que serve aos dois.

     `opc.voz(n)` diz qual voz toca cada nota; daí sai o programa
     General MIDI e o canal. Percussão vai para o canal 10, que é
     onde todo DAW espera bateria.                                */
  function vlq(n) {
    var b = [n & 0x7f];
    n >>= 7;
    while (n > 0) { b.unshift((n & 0x7f) | 0x80); n >>= 7; }
    return b;
  }
  function be32(n) { return [(n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function be16(n) { return [(n >> 8) & 255, n & 255]; }
  function texto(s) { var a = []; for (var i = 0; i < s.length; i++) a.push(s.charCodeAt(i) & 127); return a; }

  M.midi = function (notas, opc) {
    opc = opc || {};
    var bpm = opc.bpm || 120;
    var vozDa = opc.voz || function () { return 'piano'; };
    var TPQ = 480, spb = 60 / bpm;
    var canalDa = function (n) {
      var vz = M.vozDe(vozDa(n));
      return vz.gm < 0 ? 9 : (n.canal || 0);
    };

    var ev = [];
    notas.forEach(function (n) {
      var ch = canalDa(n);
      var t0 = Math.round(n.t / spb * TPQ);
      var t1 = Math.max(t0 + 12, Math.round((n.t + n.dur) / spb * TPQ));
      var v = Math.max(1, Math.min(127, Math.round(n.vel * 127)));
      ev.push({ t: t0, o: 1, d: [0x90 | ch, n.nota & 127, v] });
      ev.push({ t: t1, o: 0, d: [0x80 | ch, n.nota & 127, 0] });
    });
    ev.sort(function (a, b) { return a.t - b.t || a.o - b.o; });

    var trilha = [];
    /* O NOME DA TRILHA É ASCII E TEM O COMPRIMENTO CONTADO. Já esteve
       escrito à mão como `vlq(9)` na frente de um texto de 17 bytes:
       o leitor acreditava no 9, seguia oito bytes adiantado e o resto
       do arquivo virava lixo — zero notas lidas num arquivo que
       parecia certo por fora (MThd e MTrk no lugar, formato 0, 480
       pulsos). Nada nesta casa avisa: só abrindo o .mid e contando os
       eventos é que aparece.                                       */
    var etiqueta = texto(opc.etiqueta || 'rgb_lab');
    trilha = trilha.concat([0, 0xFF, 0x03], vlq(etiqueta.length), etiqueta);
    var us = Math.round(60000000 / bpm);
    trilha = trilha.concat([0, 0xFF, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255]);
    /* um programa por canal usado, para o arquivo abrir soando certo */
    var vistos = {};
    notas.forEach(function (n) {
      var vz = M.vozDe(vozDa(n));
      if (vz.gm < 0) return;
      var ch = canalDa(n);
      if (vistos[ch]) return;
      vistos[ch] = 1;
      trilha = trilha.concat([0, 0xC0 | ch, vz.gm & 127]);
    });
    var ant = 0;
    ev.forEach(function (e) {
      trilha = trilha.concat(vlq(Math.max(0, e.t - ant)), e.d);
      ant = e.t;
    });
    trilha = trilha.concat([0, 0xFF, 0x2F, 0]);

    var bytes = [].concat(
      texto('MThd'), be32(6), be16(0), be16(1), be16(TPQ),
      texto('MTrk'), be32(trilha.length), trilha);
    return new Blob([new Uint8Array(bytes)], { type: 'audio/midi' });
  };

  /* ══════════════════════════ ÁUDIO RENDERIZADO ════════════════
     Mesma síntese do ao vivo, num OfflineAudioContext. A cauda de
     dois segundos existe porque a última nota ainda está soando
     quando a peça acaba — cortar em `fim` decepa o sino.         */
  M.render = function (notas, opc) {
    opc = opc || {};
    if (!notas || !notas.length) return Promise.reject(new Error('sem notas'));
    var vozDa = opc.voz || function () { return 'piano'; };
    var fim = 0;
    notas.forEach(function (n) { fim = Math.max(fim, n.t + n.dur); });
    var sr = 44100, dur = Math.min(60 * 10, fim + (opc.cauda != null ? opc.cauda : 2));
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var off = new OC(2, Math.ceil(sr * dur), sr);
    var mestre = off.createGain();
    /* teto por polifonia: 30 notas juntas num piano estouram o zero
       dBFS e o WAV sai clipado. O ganho cai com a densidade real. */
    var pico = Math.max(1, notas.length / Math.max(1, dur));
    mestre.gain.value = Math.min(.9, 1.6 / Math.sqrt(pico + 3));
    var lim = off.createDynamicsCompressor();
    lim.threshold.value = -6; lim.knee.value = 6; lim.ratio.value = 8;
    mestre.connect(lim); lim.connect(off.destination);
    notas.forEach(function (n) {
      M.tocar(off, mestre, vozDa(n), n.nota, n.t, n.dur, n.vel);
    });
    return off.startRendering();
  };

})(window.VE);
