/* ============================================================
   rgb_lab — A FAMÍLIA VOZ (módulos do MESMO rack de áudio)
   ------------------------------------------------------------
   Este arquivo NÃO cria um segundo laboratório nem um segundo
   rack. Ele acrescenta uma família ao rack que já existe, pelo
   mesmo `VE.audio.register` dos vinte e seis anteriores, com os
   mesmos tipos de parâmetro e a mesma renderização.

   O que o navegador dá de verdade é TRANSFORMAÇÃO de voz — o que
   já foi gravado, mudado de tom, de corpo, de excitação e de
   canal. Clonar voz e ler texto em voz sintética não cabem aqui
   (ver a seção 12 do PROJETO.md); o que cabe é isto, e roda hoje,
   local, sem rede e sem download.

   Sete módulos:
     TOM E CORPO   o tom sobe sem a fala acelerar, e o corpo anda só
     MULTIPLICAR   a mesma voz por três, cinco, nove ou doze pessoas
     VOCODER       a voz manda no timbre de outra coisa
     SUSSURRO      troca a prega vocal por ar, e a fala continua legível
     TELEFONE      a banda estreita da linha, com o aperto que vem junto
     RÁDIO         a estação fora de sintonia
     CORO DE UM SÓ um naipe inteiro tirado de uma frase falada
   ============================================================ */
(function (VE) {
  'use strict';

  var A = VE.audio, D = VE.adsp;
  var reg = A.register;

  /* a família entra na lista que já existe — sem mexer nas outras */
  if (A.FAMS) {
    var tem = false;
    for (var fi = 0; fi < A.FAMS.length; fi++) if (A.FAMS[fi].id === 'voz') tem = true;
    if (!tem) A.FAMS.push({ id: 'voz', label: 'voz' });
  }

  /* ==================================================================
     1. O ENVELOPE ESPECTRAL, que é onde a identidade da voz mora
     ------------------------------------------------------------------
     A magnitude de um quadro de voz tem duas coisas somadas: o PENTE
     dos harmônicos, que diz a nota, e a FORMA por cima dele, que diz
     que boca produziu o som. A forma são os formantes.

     A primeira versão disto alisava a magnitude com uma média móvel de
     largura proporcional à frequência. MEDIDO, não serve — e falha de
     um jeito que parece funcionar: a média larga o bastante para apagar
     o pente de uma voz grave é estreita demais para uma aguda, e aí o
     "envelope" passa a seguir o próprio pente. Transplantar um envelope
     que É o pente não move o corpo da voz: move a NOTA. Na medida, uma
     oitava acima com o corpo guardado voltava a 131 Hz em vez de 240 —
     o módulo desfazia o próprio pitch shift, em silêncio.

     O CEPSTRO separa as duas por construção. No logaritmo do espectro,
     envelope e pente estão SOMADOS; a transformada disso põe a forma nas
     quefrências baixas e o pente num pico único em q = sr/F0. Zerar de Q
     para cima deixa só a forma, seja qual for a nota — que é justamente
     o que a média móvel não conseguia prometer.

     Q = 100 a 44,1 kHz apaga tudo que se repete mais rápido que 441 Hz:
     o pente de qualquer voz com fundamental abaixo disso, que é toda voz
     falada e quase toda cantada.
     ================================================================== */
  function envelopeCepstral(mag, bins, Q, env, re, im) {
    var N = bins * 2, k;
    for (k = 0; k < bins; k++) {
      var m = mag[k] > 1e-8 ? mag[k] : 1e-8;
      var L = Math.log(m);
      re[k] = L; im[k] = 0;
      if (k > 0) { re[N - k] = L; im[N - k] = 0; }
    }
    re[bins] = re[bins - 1]; im[bins] = 0;
    D.fft(re, im, true);
    /* fora as quefrências altas: é ali que mora o pente */
    for (var q = Q; q <= N - Q; q++) { re[q] = 0; im[q] = 0; }
    D.fft(re, im, false);
    for (k = 0; k < bins; k++) env[k] = Math.exp(re[k]);
  }

  /* o controle na tela é "alisar" (0,04 a 0,40); o motor quer a
     quefrência de corte. Mais alisamento = corte mais cedo.        */
  function qDeAlisar(alisar) {
    var q = Math.round(12 / Math.max(0.02, alisar === undefined ? 0.12 : alisar));
    return q < 24 ? 24 : (q > 220 ? 220 : q);
  }

  function lerEnv(env, x, bins) {
    if (x <= 0) return env[0];
    if (x >= bins - 1) return env[bins - 1];
    var i = x | 0, f = x - i;
    return env[i] * (1 - f) + env[i + 1] * f;
  }

  /* ------------------------------------------------------------------
     MOVER OS FORMANTES SEM MEXER NO TOM.

     Mudar o tom é um pitch shift de FITA com a duração corrigida: relê
     o som mais rápido e estica de volta, e nesse caminho leva o corpo
     junto. Uma oitava acima com `D.tom` não é a mesma pessoa cantando
     agudo — é a mesma fita rodando rápido, e o ouvido sabe a diferença
     na hora.

     Aqui o espectro fino fica onde está e só a FORMA é deslocada: para
     cada bin, o ganho é a razão entre o envelope que se quer ali e o
     que está ali. Deslocar o envelope para cima é lê-lo mais embaixo,
     daí `k / r`.

     Com isto os dois gestos que a voz pede ficam independentes:
       tom sem corpo  →  D.tom(+s) seguido de moverFormante(−s)
       corpo sem tom  →  moverFormante(+s)
     ------------------------------------------------------------------ */
  D.moverFormante = function (b, semitons, alisar, N) {
    if (Math.abs(semitons) < 0.01) return b;
    var r = Math.pow(2, semitons / 12);
    var Q = qDeAlisar(alisar);
    var env = null, re = null, im = null;
    return D.stftGanho(b, N || 2048, 4, function (mag, ganho, quadro, bins) {
      if (!env || env.length !== bins) {
        env = new Float32Array(bins);
        re = new Float32Array(bins * 2);
        im = new Float32Array(bins * 2);
      }
      envelopeCepstral(mag, bins, Q, env, re, im);
      for (var k = 0; k < bins; k++) {
        var atual = env[k];
        if (atual < 1e-7) { ganho[k] = 0; continue; }
        var g = lerEnv(env, k / r, bins) / atual;
        /* o teto precisa ser ALTO. Medido: com teto 8, um pedido de
           sete semitons de corpo chegava como 4,7 — o ganho saturava
           justamente onde o formante novo precisa nascer, num lugar do
           espectro onde ainda não havia energia. Com 64 o pedido de +7
           sai como +7,0. O que protege de amplificar silêncio não é o
           teto e sim o corte de `atual` logo acima.                */
        ganho[k] = g > 64 ? 64 : (g < 0.01 ? 0.01 : g);
      }
    });
  };

  /* ==================================================================
     MUDAR O TOM SEM ARRASTAR RAIAS JUNTO (WSOLA)
     ------------------------------------------------------------------
     `D.tom` estica por sobreposição-adição e relê mais rápido. A ideia
     é certa e a execução tem um furo: o OLA cola cada grão na posição
     que a conta manda, sem olhar a FASE do que já está escrito. Num som
     com altura definida as fases não casam, e o descasamento periódico
     vira modulação — raias novas, espaçadas pela taxa de grãos, que não
     existiam no som original.

     Medido, numa senoide de 200 Hz, com o grão de 55 ms que a voz pede:

       pedido      esperado      `D.tom` devolve
       +12 st        400 Hz          345 Hz     (10,6 semitons)
        +5 st        267 Hz          297 Hz     (6,9 semitons)
       -12 st        100 Hz           91 Hz
        -5 st        150 Hz          145 Hz

     Não é erro de arredondamento: é a raia lateral em 200+n·72,8 Hz
     ficando mais forte que a fundamental deslocada. Para material real,
     com ruído e transitório, isso soa como "granulado" e passa; para a
     voz, que é o assunto desta família, o tom simplesmente sai errado.

     O WSOLA conserta pelo lado certo: em vez de ler sempre no passo
     teórico, ele PROCURA, numa janelinha em volta dele, o pedaço que
     melhor continua o que já foi escrito, e cola ali. O passo médio
     continua sendo o pedido — o que muda é que cada emenda cai em fase.

     Isto NÃO substitui `D.esticar` nem `D.tom`: os módulos TEMPO
     ELÁSTICO e GRANULAR continuam com o motor que sempre tiveram, e o
     som deles não muda. Quem usa este é a família VOZ.
     ================================================================== */
  D.esticarVoz = function (b, fator, grao, busca) {
    fator = Math.max(0.05, fator);
    var sr = b.sampleRate;
    var g = Math.max(256, Math.floor((grao || 0.055) * sr));
    /* meia janela de Hann por passo: a soma das janelas dá exatamente 1,
       então não há ganho para corrigir depois                        */
    var hopOut = g >> 1;
    var hopIn = Math.max(1, Math.round(hopOut / fator));
    var maxBusca = Math.floor((busca === undefined ? 0.5 : busca) * hopIn);
    if (maxBusca > hopOut) maxBusca = hopOut;
    /* a busca só precisa cobrir UM período da voz mais grave — 12 ms
       chega a 83 Hz. Varrer meio grão inteiro, como a conta pedia ao
       descer de tom, era procurar onde a resposta não podia estar, e
       custava o triplo do tempo pelo mesmo resultado.               */
    var teto = Math.floor(0.012 * sr);
    if (maxBusca > teto) maxBusca = teto;
    var len = Math.max(8, Math.floor(b.length * fator));
    var out = D.like(b, len);
    var w = D.hann(g);
    for (var c = 0; c < b.numberOfChannels; c++) {
      var s = b.getChannelData(c), d = out.getChannelData(c);
      var rp = 0, wp = 0;
      while (wp + g < len) {
        var desloc = 0;
        if (maxBusca > 1 && wp > 0) {
          var melhorR = -Infinity;
          for (var dl = -maxBusca; dl <= maxBusca; dl += 3) {
            var p = rp + dl;
            if (p < 0 || p + hopOut >= s.length) continue;
            var soma = 0, ener = 1e-9;
            /* correlaciona só o pedaço que SOBREPÕE o grão anterior:
               é ali que a emenda acontece e é ali que a fase importa */
            for (var i = 0; i < hopOut; i += 6) {
              var x = s[p + i];
              soma += x * d[wp + i];
              ener += x * x;
            }
            var r = soma / Math.sqrt(ener);
            if (r > melhorR) { melhorR = r; desloc = dl; }
          }
        }
        var pos = rp + desloc;
        if (pos < 0) pos = 0;
        if (pos + g >= s.length) pos = Math.max(0, s.length - g - 1);
        for (var j = 0; j < g; j++) d[wp + j] += s[pos + j] * w[j];
        wp += hopOut;
        rp = pos + hopIn;
      }
    }
    return out;
  };

  /* o tom, pelo mesmo caminho de sempre: estica pelo inverso e relê
     mais rápido — mas com o esticamento que casa as fases.        */
  D.tomVoz = function (b, semitons, grao) {
    if (Math.abs(semitons) < 0.01) return b;
    var razao = Math.pow(2, semitons / 12);
    var esticado = D.esticarVoz(b, razao, grao || 0.055);
    var out = D.like(b);
    for (var c = 0; c < b.numberOfChannels; c++) {
      var s = esticado.getChannelData(Math.min(c, esticado.numberOfChannels - 1));
      var d = out.getChannelData(c);
      for (var i = 0; i < d.length; i++) d[i] = D.readLin(s, i * razao);
    }
    return out;
  };

  /* casa o nível da saída com o da entrada. Todo módulo que reconstrói
     o som (vocoder, sussurro) sai com energia arbitrária, e um módulo
     que muda o volume junto com o timbre é um módulo que mente sobre o
     que faz — a pessoa mexe num controle e ouve outro.              */
  function casarNivel(src, dst) {
    function rms(b) {
      var soma = 0, n = 0;
      for (var c = 0; c < b.numberOfChannels; c++) {
        var d = b.getChannelData(c);
        for (var i = 0; i < d.length; i += 7) { soma += d[i] * d[i]; n++; }
      }
      return n ? Math.sqrt(soma / n) : 0;
    }
    var a = rms(src), b2 = rms(dst);
    if (b2 < 1e-9 || a < 1e-9) return dst;
    var g = a / b2;
    if (g > 64) g = 64;
    for (var c2 = 0; c2 < dst.numberOfChannels; c2++) {
      var d2 = dst.getChannelData(c2);
      for (var j = 0; j < d2.length; j++) d2[j] *= g;
    }
    return dst;
  }

  /* ==================================================================
     2. BANCO DE BANDAS — o motor do vocoder e do sussurro
     ================================================================== */
  function freqsDasBandas(n, f0, f1, sr) {
    var lista = [], lim = sr * 0.45;
    for (var i = 0; i < n; i++) {
      var f = f0 * Math.pow(f1 / f0, i / Math.max(1, n - 1));
      lista.push(f > lim ? lim : f);
    }
    return lista;
  }

  /* passa-banda de segunda ordem: escreve SÓ a banda em dst. Não é o
     `D.ressonar`, que soma o pico ao sinal inteiro — aqui a banda
     precisa sair isolada, senão o vocoder soma a voz de volta.     */
  function passaBanda(src, dst, hz, q, sr) {
    var f = hz; if (f < 20) f = 20; if (f > sr * 0.45) f = sr * 0.45;
    var w0 = 2 * Math.PI * f / sr;
    var alpha = Math.sin(w0) / (2 * Math.max(0.3, q));
    var a0 = 1 + alpha;
    var b0 = alpha / a0, b2 = -alpha / a0;
    var a1 = (-2 * Math.cos(w0)) / a0, a2 = (1 - alpha) / a0;
    var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (var i = 0; i < src.length; i++) {
      var x = src[i];
      var y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      dst[i] = y;
    }
  }

  /* ------------------------------------------------------------------
     A BANDA DA LINHA, EM CASCATA.

     `D.passaBaixa` e `D.passaAlta` são de um polo: 6 dB por oitava. Isso
     é uma inclinação, não um corte — e um telefone não é uma inclinação.
     Medido com ruído branco na entrada, um estágio deixava 42% da energia
     ACIMA de 3,4 kHz, e o que o ouvido lê nesses 42% é "voz abafada",
     não "voz no telefone".

     Três estágios dão 18 dB por oitava. Em cascata, cada estágio tira
     3 dB na frequência de corte, então a banda encolheria; o fator
     `1/sqrt(2^(1/N) − 1)` afasta o corte de cada estágio o tanto que
     devolve os −3 dB no lugar pedido. É a correção de sempre, e sem ela
     um telefone de 300 a 3400 vira um de 590 a 1730.
     ------------------------------------------------------------------ */
  function correcaoDeOrdem(N) {
    return 1 / Math.sqrt(Math.pow(2, 1 / Math.max(1, N)) - 1);
  }

  function banda(b, grave, agudo, ordem) {
    var k = correcaoDeOrdem(ordem), i;
    var o = b;
    for (i = 0; i < ordem; i++) o = D.passaAlta(o, grave / k);
    for (i = 0; i < ordem; i++) o = D.passaBaixa(o, agudo * k);
    return o;
  }

  var PORTADORAS = ['SERRA', 'PULSO DE GLOTE', 'RUÍDO', 'SOPRO', 'O PRÓPRIO SOM'];

  function gerarPortadora(b, tipo, hz, sopro, semente) {
    var sr = b.sampleRate;
    if ((tipo | 0) === 4) return b;
    var out = D.like(b);
    var rnd = D.rng(semente || 3);
    var nCh = out.numberOfChannels;
    for (var c = 0; c < nCh; c++) {
      var d = out.getChannelData(c);
      /* as duas metades do estéreo saem levemente desafinadas: é o que
         tira o vocoder de dentro da cabeça e o põe entre as caixas */
      var f = hz * (c === 0 ? 1 : 1.006);
      var fase = 0, passo = f / sr;
      for (var i = 0; i < d.length; i++) {
        fase += passo; if (fase >= 1) fase -= 1;
        var v = 0;
        if ((tipo | 0) === 0) v = fase * 2 - 1;                       /* serra */
        else if ((tipo | 0) === 1) v = fase < 0.06 ? 1 : -0.06;       /* pulso */
        else if ((tipo | 0) === 2) v = rnd() * 2 - 1;                 /* ruído */
        else v = (rnd() * 2 - 1) * 0.6;                               /* sopro */
        d[i] = v;
      }
      /* o SOPRO é ruído sem grave: é o ar, não o trovão */
      if ((tipo | 0) === 3) {
        var z = 0, k = 1 - Math.exp(-2 * Math.PI * 1800 / sr);
        for (var j = 0; j < d.length; j++) { z += (d[j] - z) * k; d[j] = d[j] - z; }
      }
    }
    /* uma dose de ruído junto da portadora afinada é o que devolve as
       consoantes: sem ela o vocoder canta bonito e não se entende  */
    if (sopro > 0.001 && (tipo | 0) < 2) {
      var rnd2 = D.rng((semente || 3) + 17);
      for (var c2 = 0; c2 < nCh; c2++) {
        var dd = out.getChannelData(c2);
        for (var m = 0; m < dd.length; m++) dd[m] += (rnd2() * 2 - 1) * sopro;
      }
    }
    return out;
  }

  /* o vocoder propriamente dito: o envelope de cada banda da VOZ manda
     no volume da mesma banda da PORTADORA.                          */
  function vocodar(b, portadora, p) {
    var sr = b.sampleRate;
    var out = D.like(b, b.length);
    var fs = freqsDasBandas(p.n | 0, p.f0, p.f1, sr);
    var mb = new Float32Array(b.length), cb = new Float32Array(b.length);
    var ka = Math.exp(-1 / Math.max(1, p.ataque * sr));
    var kr = Math.exp(-1 / Math.max(1, p.solta * sr));
    for (var c = 0; c < out.numberOfChannels; c++) {
      var s = b.getChannelData(Math.min(c, b.numberOfChannels - 1));
      var cs = portadora.getChannelData(Math.min(c, portadora.numberOfChannels - 1));
      var d = out.getChannelData(c);
      for (var k = 0; k < fs.length; k++) {
        passaBanda(s, mb, fs[k], p.q, sr);
        passaBanda(cs, cb, fs[k], p.q, sr);
        /* NORMALIZA a banda da portadora antes de usá-la.
           Um passa-banda de Q fixo é mais largo em Hz quanto mais agudo
           for, então uma portadora de energia plana entrega muito mais
           sinal nas bandas de cima. Sem esta correção o timbre da saída
           é o da PORTADORA e não o da voz: medido, o sussurro saía com
           centróide 3051 onde a voz tinha 1200 — legível, mas era outra
           pessoa. Dividindo cada banda pela própria energia, quem manda
           no volume de cada faixa volta a ser só o envelope da voz.  */
        var pot = 0;
        for (var e = 0; e < cb.length; e += 5) pot += cb[e] * cb[e];
        var norma = pot > 1e-12 ? 1 / Math.sqrt(pot / Math.ceil(cb.length / 5)) : 0;
        var env = 0;
        for (var j = 0; j < d.length; j++) {
          var a = mb[j]; if (a < 0) a = -a;
          env = a + (env - a) * (a > env ? ka : kr);
          d[j] += cb[j] * norma * env;
        }
      }
    }
    return casarNivel(b, out);
  }

  /* ==================================================================
     MÓDULO 1 — TOM E CORPO
     ================================================================== */
  reg({
    id: 'voztom', name: 'VOZ · TOM E CORPO', fam: 'voz',
    desc: 'o tom sobe sem a fala acelerar, e o corpo do timbre anda por conta',
    params: [
      { k: 'tom', label: 'Tom (semitons)', min: -24, max: 24, step: 0.5, def: 0 },
      { k: 'corpo', label: 'Corpo do timbre (semitons)', min: -12, max: 12, step: 0.5, def: 0 },
      { k: 'guardar', t: 'b', label: 'Guardar o corpo ao mudar o tom', def: 1 },
      { k: 'grao', label: 'Grão (s)', min: 0.02, max: 0.2, step: 0.005, def: 0.055 },
      { k: 'alisar', label: 'Alisar o timbre', min: 0.04, max: 0.4, step: 0.01, def: 0.12 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 }
    ]
  }, {
    buf: function (b, v) {
      var o = b;
      /* Os dois gestos SOMAM num deslocamento só de formante. Fazer duas
         passadas — uma para desfazer o que o tom levou, outra para o
         corpo pedido — não dá o mesmo resultado: a segunda trabalha
         sobre um envelope que a primeira já mexeu, e o efeito acumula
         além da soma. Medido: tom +7 com corpo −4 saía como corpo −8,4.
         Uma passada com a soma custa metade e chega no lugar certo. */
      var desloca = 0;
      if (Math.abs(v.tom) > 0.01) {
        o = D.tomVoz(o, v.tom, v.grao);
        /* sem isto, uma oitava acima soa fita acelerada e não pessoa */
        if (v.guardar > 0.5) desloca -= v.tom;
      }
      desloca += v.corpo;
      if (Math.abs(desloca) > 0.01) o = D.moverFormante(o, desloca, v.alisar);
      if (o === b) return b;
      return v.mix >= 0.999 ? o : D.blend(b, o, v.mix);
    }
  });

  /* ==================================================================
     MÓDULO 2 — MULTIPLICAR (o pedido das 3, 5, 9 e 12 vozes)
     ------------------------------------------------------------------
     Uma cópia com atraso fixo é a MESMA pessoa duas vezes: o ouvido
     soma e ouve uma voz com eco. O que faz virar gente diferente são
     três desvios ao mesmo tempo — cada cópia entra num instante
     próprio, desafina por conta e ocupa um lugar entre as caixas.

     A desafinação não vem de um pitch shift por voz (doze shifts num
     arquivo de três minutos custariam mais do que o resultado vale):
     vem de uma linha de atraso que RESPIRA. Atraso que muda no tempo
     é mudança de tom — é como o coro de fita sempre foi feito. A
     conta está em `ampDoLFO`, e o controle está em cents porque cent
     é a unidade em que se pensa desafinação.

     E os CORPOS: com `corpos` acima de zero, o buffer é processado
     UMA vez para cima e UMA para baixo, e as vozes se repartem entre
     as três versões. Duas passadas de formante, não doze — o custo
     não cresce com o número de vozes.
     ================================================================== */
  var QUANTAS = [2, 3, 5, 9, 12, 16];

  /* atraso que oscila a `taxa` Hz produz desvio de tom; para pedir o
     desvio em cents, a amplitude do balanço sai desta conta.        */
  function ampDoLFO(cents, taxa, sr) {
    if (cents <= 0 || taxa <= 0) return 0;
    var razao = Math.pow(2, cents / 1200) - 1;
    return (razao / (2 * Math.PI * taxa)) * sr;
  }

  reg({
    id: 'vozmult', name: 'VOZ · MULTIPLICAR', fam: 'voz',
    desc: 'a mesma voz cantada por três, cinco, nove ou doze pessoas',
    params: [
      { k: 'vozes', t: 's', label: 'Quantas vozes', def: 2, opts: ['2', '3', '5', '9', '12', '16'] },
      { k: 'desafinar', label: 'Desafinação (cents)', min: 0, max: 60, step: 1, def: 14 },
      { k: 'espalhar', label: 'Espalhar no tempo (ms)', min: 0, max: 90, step: 1, def: 26 },
      { k: 'balanco', label: 'Balanço (Hz)', min: 0.05, max: 3, step: 0.05, def: 0.45 },
      { k: 'abertura', label: 'Abertura entre as caixas', min: 0, max: 1, step: 0.01, def: 0.85 },
      { k: 'corpos', label: 'Corpos diferentes (semitons)', min: 0, max: 6, step: 0.5, def: 1.5 },
      { k: 'alisar', label: 'Alisar o timbre', min: 0.04, max: 0.4, step: 0.01, def: 0.12 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 0.75 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 5 }
    ]
  }, {
    buf: function (b, v) {
      var N = QUANTAS[v.vozes | 0] || 3;
      var base = D.estereo(b);
      var sr = base.sampleRate;
      var rnd = D.rng(v.seed);

      /* as três versões de corpo, calculadas UMA vez cada */
      var fontes = [base];
      if (v.corpos > 0.01) {
        fontes.push(D.estereo(D.moverFormante(b, v.corpos, v.alisar)));
        fontes.push(D.estereo(D.moverFormante(b, -v.corpos, v.alisar)));
      }

      var out = D.make(2, base.length, sr);
      var L = out.getChannelData(0), R = out.getChannelData(1);
      var ganho = 1 / Math.sqrt(N);
      var espalhoMax = (v.espalhar / 1000) * sr;

      for (var i = 0; i < N; i++) {
        var fonte = fontes[i % fontes.length];
        var sL = fonte.getChannelData(0);
        var sR = fonte.getChannelData(Math.min(1, fonte.numberOfChannels - 1));
        /* cada voz com o seu relógio: taxas iguais fariam as vozes
           respirarem juntas, que é exatamente o som de UMA voz    */
        var taxa = Math.max(0.02, v.balanco * (0.55 + 0.9 * rnd()));
        var fase = rnd() * Math.PI * 2;
        var amp = ampDoLFO(v.desafinar * (0.4 + 1.2 * rnd()), taxa, sr);
        var atraso = espalhoMax * (0.15 + 0.85 * rnd());
        /* a primeira voz fica no centro e sem atraso: é a âncora que
           impede o conjunto de soar deslocado do resto da mistura  */
        if (i === 0) { atraso = 0; amp *= 0.25; }
        var pan = N > 1 ? ((i / (N - 1)) * 2 - 1) * v.abertura : 0;
        var ang = (pan + 1) * Math.PI / 4;
        var gL = Math.cos(ang) * ganho, gR = Math.sin(ang) * ganho;
        var w = 2 * Math.PI * taxa / sr;
        for (var j = 0; j < L.length; j++) {
          var d = atraso + amp * Math.sin(w * j + fase);
          var pos = j - d;
          L[j] += D.readLin(sL, pos) * gL;
          R[j] += D.readLin(sR, pos) * gR;
        }
      }
      return v.mix >= 0.999 ? out : D.blend(base, out, v.mix);
    }
  });

  /* ==================================================================
     MÓDULO 3 — VOCODER
     ================================================================== */
  reg({
    id: 'vocoder', name: 'VOZ · VOCODER', fam: 'voz',
    desc: 'a voz manda no timbre de outra coisa, banda por banda',
    params: [
      { k: 'porta', t: 's', label: 'O que a voz vai tocar', def: 0, opts: PORTADORAS },
      { k: 'nota', label: 'Nota da portadora (Hz)', min: 40, max: 600, step: 1, def: 110 },
      { k: 'n', label: 'Quantas bandas', min: 6, max: 40, step: 1, def: 18 },
      { k: 'f0', label: 'Banda mais grave (Hz)', min: 60, max: 600, step: 10, def: 160 },
      { k: 'f1', label: 'Banda mais aguda (Hz)', min: 2000, max: 12000, step: 100, def: 7000 },
      { k: 'q', label: 'Estreiteza das bandas', min: 1, max: 20, step: 0.5, def: 7 },
      { k: 'ataque', label: 'Ataque (s)', min: 0.001, max: 0.08, step: 0.001, def: 0.004 },
      { k: 'solta', label: 'Solta (s)', min: 0.005, max: 0.4, step: 0.005, def: 0.03 },
      { k: 'sopro', label: 'Sopro (devolve as consoantes)', min: 0, max: 0.6, step: 0.01, def: 0.12 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 3 }
    ]
  }, {
    buf: function (b, v) {
      var port = gerarPortadora(b, v.porta, v.nota, v.sopro, v.seed);
      var o = vocodar(b, port, v);
      return v.mix >= 0.999 ? o : D.blend(b, o, v.mix);
    }
  });

  /* ==================================================================
     MÓDULO 4 — SUSSURRO
     ------------------------------------------------------------------
     Sussurrar não é falar baixo: é falar SEM a prega vocal. A boca
     continua fazendo tudo o que fazia — os formantes estão lá, as
     consoantes estão lá — e o que era nota virou ar.

     É o mesmo motor de bandas do vocoder com a portadora trocada por
     ruído: o envelope da fala continua mandando, e o que ele manda é
     sopro. Daí a fala continuar legível.

     MEDIDO: a periodicidade cai de 1,00 para 0,08 — a prega vocal sai,
     que é o efeito inteiro. O brilho, porém, sai no DOBRO do da voz
     (centróide 2570 contra 1200), e isso não é o realce de proximidade
     nem a banda mais aguda: com os dois desligados o número mal se
     move. É do banco de filtros — bandas de Q fixo vazam umas nas
     outras, e o envelope nunca chega a zero numa banda vizinha a um
     formante, então o ruído normalizado toca ali. Sussurro de verdade
     TAMBÉM é mais brilhante que voz sonora; se o dobro é demais ou
     está bom é ouvido, e ouvido eu não tenho. Baixar o "Perto do
     ouvido" e a "Banda mais aguda" é por onde escurecer.
     ================================================================== */
  reg({
    id: 'sussurro', name: 'VOZ · SUSSURRO', fam: 'voz',
    desc: 'troca a prega vocal por ar, e a fala continua se entendendo',
    params: [
      { k: 'ar', label: 'Quantidade de ar', min: 0, max: 1, step: 0.01, def: 0.8 },
      { k: 'n', label: 'Quantas bandas', min: 10, max: 48, step: 1, def: 26 },
      { k: 'f0', label: 'Banda mais grave (Hz)', min: 80, max: 700, step: 10, def: 220 },
      /* Medido: com o topo em 8,5 kHz o sussurro saía com centróide
         2,3 vezes o da voz — legível, e de outra pessoa. Sussurro tem
         mesmo o brilho mais alto que a voz sonora, mas não tanto: o
         topo em 5,5 kHz é onde a fala sussurrada ainda tem conteúdo. */
      { k: 'f1', label: 'Banda mais aguda (Hz)', min: 3000, max: 14000, step: 100, def: 5500 },
      { k: 'q', label: 'Estreiteza das bandas', min: 1, max: 24, step: 0.5, def: 9 },
      { k: 'ataque', label: 'Ataque (s)', min: 0.001, max: 0.05, step: 0.001, def: 0.003 },
      { k: 'solta', label: 'Solta (s)', min: 0.005, max: 0.3, step: 0.005, def: 0.02 },
      { k: 'proximo', label: 'Perto do ouvido', min: 0, max: 1, step: 0.01, def: 0.35 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 11 }
    ]
  }, {
    buf: function (b, v) {
      var port = gerarPortadora(b, 2, 100, 0, v.seed);
      var o = vocodar(b, port, v);
      /* "perto do ouvido" é o realce de 4 a 7 kHz que a boca colada no
         microfone produz — é ele que dá a intimidade do sussurro   */
      if (v.proximo > 0.01) {
        o = D.ressonar(o, 5200, 1.1, v.proximo * 0.9);
        o = casarNivel(b, o);
      }
      /* o ar que sobra por cima do que as bandas reconstruíram */
      if (v.ar < 0.999) {
        var seco = D.copy(b);
        o = D.blend(seco, o, 0.35 + 0.65 * v.ar);
      }
      return v.mix >= 0.999 ? o : D.blend(b, o, v.mix);
    }
  });

  /* ==================================================================
     MÓDULO 5 — TELEFONE
     ================================================================== */
  reg({
    id: 'telefone', name: 'VOZ · TELEFONE', fam: 'voz',
    desc: 'a banda estreita da linha, com o aperto e a sujeira que vêm junto',
    params: [
      { k: 'grave', label: 'Corte no grave (Hz)', min: 100, max: 900, step: 10, def: 300 },
      { k: 'agudo', label: 'Corte no agudo (Hz)', min: 1200, max: 6000, step: 50, def: 3400 },
      { k: 'aperto', label: 'Aperto (compressão)', min: 0, max: 1, step: 0.01, def: 0.55 },
      { k: 'suja', label: 'Sujeira da linha', min: 0, max: 1, step: 0.01, def: 0.25 },
      { k: 'capsula', label: 'Pico da cápsula (Hz)', min: 700, max: 3000, step: 50, def: 1700 },
      { k: 'chiado', label: 'Chiado', min: 0, max: 0.2, step: 0.002, def: 0.015 },
      { k: 'quedas', label: 'Quedas de sinal', min: 0, max: 1, step: 0.01, def: 0 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 13 }
    ]
  }, {
    buf: function (b, v) {
      var sr = b.sampleRate;
      /* a cápsula do fone tem um pico no meio da fala, e é ele que faz
         a voz de telefone soar de telefone mesmo depois do corte  */
      var o = D.ressonar(b, v.capsula, 2.2, 0.8);
      var rnd = D.rng(v.seed);
      var ka = Math.exp(-1 / (0.003 * sr)), kr = Math.exp(-1 / (0.12 * sr));
      for (var c = 0; c < o.numberOfChannels; c++) {
        var d = o.getChannelData(c);
        var env = 0;
        /* queda de sinal: janelas de silêncio como as do celular */
        var mudo = 0, prox = 0;
        for (var i = 0; i < d.length; i++) {
          var x = d[i];
          /* aperto: compressão de faixa larga, que é o que a linha faz */
          if (v.aperto > 0.001) {
            var a = x < 0 ? -x : x;
            env = a + (env - a) * (a > env ? ka : kr);
            var g = env > 0.08 ? Math.pow(0.08 / env, v.aperto * 0.7) : 1;
            x *= g * (1 + v.aperto * 0.8);
          }
          /* sujeira: recorte macio, que traz o timbre de codec ruim */
          if (v.suja > 0.001) {
            var drive = 1 + v.suja * 9;
            x = Math.tanh(x * drive) / Math.tanh(drive * 0.8);
          }
          if (v.chiado > 0.0001) x += (rnd() * 2 - 1) * v.chiado;
          if (v.quedas > 0.001) {
            if (i >= prox) {
              prox = i + Math.floor((0.25 + rnd() * 2.2) * sr / Math.max(0.05, v.quedas));
              mudo = i + Math.floor((0.02 + rnd() * 0.16) * sr * v.quedas);
            }
            if (i < mudo) x *= 0.02;
          }
          d[i] = x;
        }
      }
      /* A BANDA POR ÚLTIMO: o recorte macio inventa harmônicos e o
         chiado é ruído de faixa larga, e num canal telefônico os dois
         passam pelo mesmo funil que a voz.

         Honestamente: MEDIR isto quase não mudou o número — 70,2% da
         energia na banda filtrando antes, 69,5% filtrando depois. O que
         sobra acima de 3,4 kHz não é a sujeira, é a inclinação do
         próprio filtro, que com três polos de um polo cada ainda leva
         uma oitava para chegar aos 18 dB. Fica na ordem certa porque é
         a ordem certa, não porque salvou o resultado.               */
      o = banda(o, v.grave, Math.max(v.grave + 200, v.agudo), 3);
      o = casarNivel(b, o);
      return v.mix >= 0.999 ? o : D.blend(b, o, v.mix);
    }
  });

  /* ==================================================================
     MÓDULO 6 — RÁDIO
     ================================================================== */
  reg({
    id: 'vozradio', name: 'VOZ · RÁDIO', fam: 'voz',
    desc: 'a estação quase sintonizada, com estática e assobio',
    params: [
      { k: 'grave', label: 'Corte no grave (Hz)', min: 60, max: 700, step: 10, def: 180 },
      { k: 'agudo', label: 'Corte no agudo (Hz)', min: 1500, max: 9000, step: 100, def: 4500 },
      { k: 'sintonia', label: 'Fora da estação', min: 0, max: 1, step: 0.01, def: 0.2 },
      { k: 'estatica', label: 'Estática', min: 0, max: 1, step: 0.01, def: 0.25 },
      { k: 'assobio', label: 'Assobio (heterodino)', min: 0, max: 1, step: 0.01, def: 0.15 },
      { k: 'assobiohz', label: 'Altura do assobio (Hz)', min: 400, max: 6000, step: 50, def: 2600 },
      { k: 'am', label: 'Oscilação de força', min: 0, max: 1, step: 0.01, def: 0.3 },
      { k: 'amhz', label: 'Velocidade da oscilação (Hz)', min: 0.05, max: 8, step: 0.05, def: 0.7 },
      { k: 'caixa', label: 'Pico do alto-falante (Hz)', min: 400, max: 3000, step: 50, def: 1300 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 1 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 23 }
    ]
  }, {
    buf: function (b, v) {
      var sr = b.sampleRate;
      var o = D.ressonar(b, v.caixa, 2.6, 0.7);
      var rnd = D.rng(v.seed);
      /* a estática não é constante: ela ANDA, e é o andar dela que faz
         a estação parecer distante em vez de suja                  */
      var passeio = 0, alvo = 0;
      for (var c = 0; c < o.numberOfChannels; c++) {
        var d = o.getChannelData(c);
        var faseA = 0, faseS = 0;
        var wA = 2 * Math.PI * v.amhz / sr;
        var wS = 2 * Math.PI * v.assobiohz / sr;
        for (var i = 0; i < d.length; i++) {
          if ((i & 1023) === 0) alvo = rnd();
          passeio += (alvo - passeio) * 0.0015;
          var x = d[i];
          /* fora da estação: o sinal enfraquece e a estática toma */
          var forca = 1 - v.sintonia * (0.35 + 0.65 * passeio);
          x *= forca;
          if (v.am > 0.001) {
            faseA += wA;
            x *= 1 - v.am * 0.5 * (0.5 + 0.5 * Math.sin(faseA));
          }
          if (v.estatica > 0.001) {
            x += (rnd() * 2 - 1) * v.estatica * 0.28 * (0.4 + 0.6 * passeio) *
              (0.3 + 0.7 * v.sintonia);
          }
          if (v.assobio > 0.001) {
            faseS += wS;
            x += Math.sin(faseS) * v.assobio * 0.12 * (0.3 + 0.7 * passeio);
          }
          d[i] = x;
        }
      }
      /* a banda por último, pelo mesmo motivo do TELEFONE: a estática e o
         assobio chegam pelo aparelho, e o alto-falante do aparelho é que
         define o que se ouve                                        */
      o = banda(o, v.grave, Math.max(v.grave + 300, v.agudo), 3);
      o = casarNivel(b, o);
      return v.mix >= 0.999 ? o : D.blend(b, o, v.mix);
    }
  });

  /* ==================================================================
     MÓDULO 7 — CORO DE UM SÓ
     ------------------------------------------------------------------
     Multiplicar dá a mesma nota várias vezes. Isto dá o ACORDE: cada
     naipe entra num intervalo, e uma frase falada vira um coro.
     O corpo de cada naipe é corrigido para o intervalo, senão o baixo
     sai como fita lenta e o soprano como desenho animado.
     ================================================================== */
  var ACORDES = [
    { n: 'OITAVAS', g: [-12, 0, 12] },
    { n: 'QUINTAS', g: [-12, -5, 0, 7] },
    { n: 'MAIOR', g: [-12, 0, 4, 7] },
    { n: 'MENOR', g: [-12, 0, 3, 7] },
    { n: 'MAIOR COM SÉTIMA', g: [-12, 0, 4, 7, 11] },
    { n: 'MENOR COM SÉTIMA', g: [-12, 0, 3, 7, 10] },
    { n: 'SUSPENSO', g: [-12, 0, 5, 7] },
    { n: 'NAIPE INTEIRO', g: [-24, -12, -5, 0, 4, 7, 12] }
  ];

  reg({
    id: 'vozcoro', name: 'VOZ · CORO DE UM SÓ', fam: 'voz',
    desc: 'uma frase falada vira naipe: cada voz num grau do acorde',
    params: [
      { k: 'acorde', t: 's', label: 'Acorde', def: 2, opts: ACORDES.map(function (a) { return a.n; }) },
      { k: 'guardar', t: 'b', label: 'Guardar o corpo de cada voz', def: 1 },
      { k: 'espalhar', label: 'Espalhar no tempo (ms)', min: 0, max: 90, step: 1, def: 18 },
      { k: 'desafinar', label: 'Desafinação (cents)', min: 0, max: 40, step: 1, def: 9 },
      { k: 'balanco', label: 'Balanço (Hz)', min: 0.05, max: 3, step: 0.05, def: 0.4 },
      { k: 'abertura', label: 'Abertura entre as caixas', min: 0, max: 1, step: 0.01, def: 0.9 },
      { k: 'grao', label: 'Grão (s)', min: 0.02, max: 0.2, step: 0.005, def: 0.055 },
      { k: 'alisar', label: 'Alisar o timbre', min: 0.04, max: 0.4, step: 0.01, def: 0.12 },
      { k: 'mix', label: 'Mistura', min: 0, max: 1, step: 0.01, def: 0.8 },
      { k: 'seed', label: 'Semente', min: 1, max: 999, step: 1, def: 9 }
    ]
  }, {
    buf: function (b, v) {
      var graus = (ACORDES[v.acorde | 0] || ACORDES[2]).g;
      var base = D.estereo(b);
      var sr = base.sampleRate;
      var rnd = D.rng(v.seed);
      var out = D.make(2, base.length, sr);
      var L = out.getChannelData(0), R = out.getChannelData(1);
      var ganho = 1 / Math.sqrt(graus.length);
      var espalhoMax = (v.espalhar / 1000) * sr;

      for (var i = 0; i < graus.length; i++) {
        var g = graus[i];
        var voz = b;
        if (Math.abs(g) > 0.01) {
          voz = D.tomVoz(b, g, v.grao);
          if (v.guardar > 0.5) voz = D.moverFormante(voz, -g, v.alisar);
        }
        voz = D.estereo(voz);
        var sL = voz.getChannelData(0);
        var sR = voz.getChannelData(Math.min(1, voz.numberOfChannels - 1));
        var taxa = Math.max(0.02, v.balanco * (0.55 + 0.9 * rnd()));
        var amp = ampDoLFO(v.desafinar * (0.4 + 1.2 * rnd()), taxa, sr);
        var atraso = espalhoMax * (0.15 + 0.85 * rnd());
        var fase = rnd() * Math.PI * 2;
        if (g === 0) { atraso = 0; amp *= 0.25; }
        var pan = graus.length > 1 ? ((i / (graus.length - 1)) * 2 - 1) * v.abertura : 0;
        var ang = (pan + 1) * Math.PI / 4;
        var gL = Math.cos(ang) * ganho, gR = Math.sin(ang) * ganho;
        var w = 2 * Math.PI * taxa / sr;
        var n = Math.min(L.length, sL.length + Math.ceil(atraso) + 4);
        for (var j = 0; j < n; j++) {
          var dd = atraso + amp * Math.sin(w * j + fase);
          L[j] += D.readLin(sL, j - dd) * gL;
          R[j] += D.readLin(sR, j - dd) * gR;
        }
      }
      out = casarNivel(base, out);
      return v.mix >= 0.999 ? out : D.blend(base, out, v.mix);
    }
  });

})(window.VE);
