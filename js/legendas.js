/* ============================================================
   rgb_lab — LEGENDAS
   ------------------------------------------------------------
   COMO OS OUTROS FAZEM, e o que vale a pena copiar:

   · Premiere — a legenda NÃO é um gráfico. É uma faixa própria (C1),
     acima do vídeo, e cada legenda é um segmento com entrada, saída e
     texto. Um ESTILO DE FAIXA vale para todas de uma vez: mudar a fonte
     muda as duzentas. Divide-se e junta-se como clipe. Exporta embutida
     no vídeo ou como arquivo ao lado (.srt).
   · Resolve — igual: pista de legenda no mesmo tempo, estilo na ficha.
   · Editores de celular — acrescentam a marcação por PALAVRA, com a
     palavra falada acendendo dentro da frase.

   O QUE COPIAMOS, E O QUE NÃO:

   Copiamos as três ideias que fazem a diferença — segmento com tempo,
   UM estilo para a faixa inteira, e dividir no cursor. Copiamos também
   a palavra que acende.

   NÃO copiamos a transcrição automática: ela precisa mandar o áudio
   para um servidor, e o rgb_lab é local do começo ao fim (diz isso na
   barra de estado). No lugar dela há duas entradas honestas:
       · COLAR TEXTO  — um bloco de texto vira legendas cronometradas
                        pelo número de caracteres, e depois se acerta
                        arrastando as bordas, como qualquer clipe;
       · ABRIR .SRT   — se a transcrição foi feita fora, ela entra
                        inteira, com os tempos que já tem.

   COMO ISSO ENTRA NA CASA, sem segunda linha do tempo nem janela nova:

   Uma legenda é um CLIPE (`kind:'legenda'`) numa pista de vídeo comum
   marcada com `tr.legenda = 1`. Herda de graça arrastar, aparar, dividir,
   keyframes, opacidade, mistura e a etiqueta C1/C2 na cabeça da pista.
   O desenho sai de uma fonte só, de tipo `legenda`, que redesenha o texto
   DO CLIPE que está sendo montado — uma fonte, não uma por frase.
   ============================================================ */
(function (VE) {
  'use strict';

  var L = VE.legendas = {};

  /* ============================================== ESTILO DA FAIXA ========
     Um objeto por PISTA. É o "estilo de faixa" do Premiere: mexer aqui
     mexe em todas as legendas daquela pista ao mesmo tempo.            */

  L.FONTES = [
    { id: 'sans', n: 'SEM SERIFA', f: '"Archivo", "Segoe UI", Arial, sans-serif' },
    { id: 'mono', n: 'MONOESPAÇADA', f: 'ui-monospace, Consolas, "Courier New", monospace' },
    { id: 'serif', n: 'COM SERIFA', f: 'Georgia, "Times New Roman", serif' },
    { id: 'cond', n: 'ESTREITA', f: '"Archivo Narrow", "Arial Narrow", Arial, sans-serif' }
  ];

  L.FUNDOS = ['NENHUM', 'CAIXA', 'CAIXA POR LINHA', 'FAIXA DE PONTA A PONTA'];
  L.ALINHA = ['ESQUERDA', 'CENTRO', 'DIREITA'];

  L.novoEstilo = function (o) {
    o = o || {};
    return {
      fonte: 0, corpo: 0.052, peso: 700, caixaAlta: 0,
      cor: '#ffffff', contorno: '#000000', larguraContorno: 0.16,
      sombra: 1, sombraCor: '#000000',
      fundo: 1, fundoCor: '#000000', fundoAlfa: 0.62, respiro: 0.55, arredondar: 0.12,
      alinhar: 1, posY: 0.86, margem: 0.08, entrelinha: 1.18,
      maxLinha: 42, maxLinhas: 2,
      acender: 0, acenderCor: '#f5d000',   /* palavra que acende (karaokê) */
      entrada: 1, entradaDur: 0.14,        /* 0 nada · 1 aparecer · 2 subir · 3 por palavra */
      opacidade: 1,
      nome: o.nome || 'PADRÃO'
    };
  };

  /* prontos, para não começar do zero */
  L.PRESETS = [
    { id: 'caixa', n: 'CAIXA PRETA', d: 'o padrão de televisão: branco em caixa preta', set: {} },
    {
      id: 'limpo', n: 'SEM CAIXA', d: 'branco com contorno, sem fundo',
      set: { fundo: 0, larguraContorno: 0.2, sombra: 1 }
    },
    {
      id: 'faixa', n: 'FAIXA INTEIRA', d: 'tarja de ponta a ponta, como noticiário',
      set: { fundo: 3, fundoAlfa: 0.8, posY: 0.88, respiro: 0.7 }
    },
    {
      id: 'reels', n: 'REELS', d: 'grande, centralizada, palavra acesa',
      set: {
        corpo: 0.072, posY: 0.62, fundo: 0, larguraContorno: 0.22,
        acender: 1, caixaAlta: 1, maxLinha: 22, entrada: 3
      }
    },
    {
      id: 'amarela', n: 'AMARELA', d: 'amarelo de cinema, contorno duro',
      set: { cor: '#f5d000', fundo: 0, larguraContorno: 0.2, corpo: 0.055 }
    },
    {
      id: 'terminal', n: 'TERMINAL', d: 'monoespaçada verde sobre preto',
      set: { fonte: 1, cor: '#2ee6a8', fundoCor: '#020602', fundoAlfa: 0.85, larguraContorno: 0, peso: 500 }
    }
  ];

  L.aplicarPreset = function (estilo, id) {
    var p = L.PRESETS.filter(function (x) { return x.id === id; })[0];
    if (!p) return estilo;
    var base = L.novoEstilo();
    Object.keys(base).forEach(function (k) { estilo[k] = base[k]; });
    Object.keys(p.set).forEach(function (k) { estilo[k] = p.set[k]; });
    estilo.nome = p.n;
    return estilo;
  };

  /* ============================================== A PISTA ================ */

  L.pistas = function () {
    if (!VE.project) return [];
    return VE.project.tracks.filter(function (t) { return t.legenda; });
  };

  /* Devolve a pista de legenda, criando-a acima das de vídeo se preciso.
     Fica sendo uma pista de vídeo comum — por isso arrastar, aparar e
     dividir continuam funcionando sem uma linha de código a mais.     */
  L.pista = function () {
    var ja = L.pistas()[0];
    if (ja) return ja;
    var p = VE.project;
    if (!p) return null;
    var tr = VE.newTrackObj('video', 'LEGENDA');
    tr.legenda = 1;
    tr.estilo = L.novoEstilo();
    /* entra logo abaixo das pistas de efeito, acima do vídeo — é onde o
       olho procura, e é onde o Premiere põe a C1                      */
    var at = 0;
    while (at < p.tracks.length && p.tracks[at].kind === 'fx') at++;
    p.tracks.splice(at, 0, tr);
    return tr;
  };

  L.estiloDe = function (clip) {
    var f = VE.findClip(clip.id);
    var tr = f ? f.track : null;
    if (tr && !tr.estilo) tr.estilo = L.novoEstilo();
    return tr ? tr.estilo : L.novoEstilo();
  };

  /* ============================================== A FONTE DE DESENHO =====
     Uma só para o projeto inteiro. `render` recebe o clipe porque cada
     legenda tem o seu texto; a textura já é por clipe no motor.        */

  var cv = null, cx = null, fonteId = null;

  function tela() {
    var p = VE.project;
    var W = p ? p.canvas.w : 1920, H = p ? p.canvas.h : 1080;
    if (!cv) { cv = document.createElement('canvas'); cx = cv.getContext('2d'); }
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    return cv;
  }

  L.fonte = function () {
    tela();
    if (fonteId && VE.sources[fonteId]) {
      var s = VE.sources[fonteId];
      s.w = cv.width; s.h = cv.height;
      return fonteId;
    }
    fonteId = VE.media.register({
      kind: 'legenda', name: 'LEGENDAS', el: cv, w: cv.width, h: cv.height,
      duration: 0, live: true,
      render: function (local, clip) { L.desenhar(clip, local); }
    });
    return fonteId;
  };

  /* Ao reabrir um projeto (arquivo ou sessão guardada), os clipes de
     legenda apontam para um id de fonte que não existe mais nesta aba.
     Aqui o pincel volta a existir COM AQUELE id — e como é um só para
     todas, basta o primeiro que aparecer.                            */
  L.reporFonte = function (proj) {
    var alvo = null;
    (proj && proj.tracks || []).forEach(function (t) {
      (t.clips || []).forEach(function (c) { if (!alvo && c.kind === 'legenda' && c.src) alvo = c.src; });
    });
    if (!alvo || VE.sources[alvo]) return null;
    tela();
    fonteId = alvo;
    VE.media.register({
      id: alvo, kind: 'legenda', name: 'LEGENDAS', el: cv, w: cv.width, h: cv.height,
      duration: 0, live: true,
      render: function (local, clip) { L.desenhar(clip, local); }
    });
    return alvo;
  };

  /* ============================================== O DESENHO ==============
     Tudo em fração da altura da tela: uma legenda montada em 1080 tem de
     sair igual quando a composição vira 4K ou vertical.                */

  function quebrar(cx2, texto, maxPx, maxLinhas) {
    var palavras = String(texto || '').replace(/\s+/g, ' ').trim().split(' ');
    var linhas = [], atual = '';
    for (var i = 0; i < palavras.length; i++) {
      var tenta = atual ? atual + ' ' + palavras[i] : palavras[i];
      if (atual && cx2.measureText(tenta).width > maxPx) { linhas.push(atual); atual = palavras[i]; }
      else atual = tenta;
    }
    if (atual) linhas.push(atual);
    if (maxLinhas > 0 && linhas.length > maxLinhas) {
      /* não corta palavra: junta o excesso na última linha permitida */
      var sobra = linhas.slice(maxLinhas - 1).join(' ');
      linhas = linhas.slice(0, maxLinhas - 1); linhas.push(sobra);
    }
    return linhas;
  }
  L.quebrar = quebrar;

  function hexA(hex, a) {
    var h = String(hex || '#000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function caixaRedonda(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, h / 2, w / 2));
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  L.desenhar = function (clip, local) {
    tela();
    var W = cv.width, H = cv.height;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, W, H);
    if (!clip) return;
    var e = L.estiloDe(clip);
    var texto = clip.texto || '';
    if (!texto.trim()) return;
    if (e.caixaAlta) texto = texto.toUpperCase();

    var corpo = Math.max(8, e.corpo * H);
    var face = (L.FONTES[e.fonte | 0] || L.FONTES[0]).f;
    cx.font = (e.peso || 700) + ' ' + corpo + 'px ' + face;
    cx.textBaseline = 'alphabetic';

    var margem = e.margem * W;
    var maxPx = W - margem * 2;
    var linhas = quebrar(cx, texto, maxPx, e.maxLinhas | 0);
    var lh = corpo * e.entrelinha;
    var alturaTotal = linhas.length * lh;

    /* ---- entrada: 0 nada · 1 aparecer · 2 subir · 3 por palavra ---- */
    var dur = Math.max(0.001, e.entradaDur);
    var t = Math.max(0, Math.min(1, (local || 0) / dur));
    var alfa = e.opacidade, sobe = 0;
    if (e.entrada === 1) alfa *= t;
    else if (e.entrada === 2) { alfa *= t; sobe = (1 - t) * corpo * 0.6; }
    cx.globalAlpha = Math.max(0, Math.min(1, alfa));

    /* onde a última linha se apoia */
    var baseY = e.posY * H - sobe;
    var topo = baseY - alturaTotal + lh * 0.78;

    /* ---- fundo ---- */
    var respiro = corpo * e.respiro;
    if (e.fundo === 3) {
      cx.fillStyle = hexA(e.fundoCor, e.fundoAlfa);
      cx.fillRect(0, topo - lh * 0.78 - respiro * 0.6, W, alturaTotal + respiro * 1.2);
    } else if (e.fundo === 1) {
      var larg = 0;
      linhas.forEach(function (li) { larg = Math.max(larg, cx.measureText(li).width); });
      var bw = larg + respiro * 2, bh = alturaTotal + respiro * 1.2;
      var bx = e.alinhar === 0 ? margem : (e.alinhar === 2 ? W - margem - bw : (W - bw) / 2);
      cx.fillStyle = hexA(e.fundoCor, e.fundoAlfa);
      caixaRedonda(cx, bx, topo - lh * 0.78 - respiro * 0.6, bw, bh, corpo * e.arredondar);
      cx.fill();
    }

    /* ---- a palavra que acende: reparte o tempo do clipe entre as
           palavras, proporcional ao tamanho de cada uma ---- */
    var acesa = -1;
    if (e.acender) {
      var pal = texto.replace(/\s+/g, ' ').trim().split(' ');
      var tot = pal.reduce(function (a, w) { return a + w.length + 1; }, 0);
      var alvo = (local || 0) / Math.max(0.2, clip.dur) * tot, acc = 0;
      for (var i = 0; i < pal.length; i++) {
        acc += pal[i].length + 1;
        if (alvo <= acc) { acesa = i; break; }
      }
      if (acesa < 0) acesa = pal.length - 1;
    }

    /* ---- as linhas ---- */
    var contorno = e.larguraContorno * corpo;
    var jaPalavras = 0;
    linhas.forEach(function (linha, li) {
      var y = topo + li * lh;
      var larguraLinha = cx.measureText(linha).width;
      var x0 = e.alinhar === 0 ? margem : (e.alinhar === 2 ? W - margem - larguraLinha : (W - larguraLinha) / 2);

      if (e.fundo === 2) {
        cx.fillStyle = hexA(e.fundoCor, e.fundoAlfa);
        caixaRedonda(cx, x0 - respiro * 0.7, y - corpo * 0.82, larguraLinha + respiro * 1.4,
          corpo * 1.18, corpo * e.arredondar);
        cx.fill();
      }

      /* desenha palavra a palavra: é o que permite acender uma delas */
      var palavras = linha.split(' ');
      var x = x0;
      palavras.forEach(function (pw, pi) {
        var idxGlobal = jaPalavras + pi;
        var acende = (e.acender && idxGlobal === acesa);
        /* por palavra: a frase aparece do começo até a palavra do momento */
        if (e.entrada === 3 && e.acender === 0) {
          var totalPal = texto.replace(/\s+/g, ' ').trim().split(' ').length;
          var mostra = Math.ceil(Math.min(1, (local || 0) / Math.max(0.2, dur * 3)) * totalPal);
          if (idxGlobal >= mostra) { x += cx.measureText(pw + ' ').width; return; }
        }
        if (e.sombra) {
          cx.shadowColor = hexA(e.sombraCor, 0.85);
          cx.shadowBlur = corpo * 0.16; cx.shadowOffsetX = 0; cx.shadowOffsetY = corpo * 0.06;
        } else { cx.shadowColor = 'transparent'; cx.shadowBlur = 0; cx.shadowOffsetY = 0; }
        if (contorno > 0.4) {
          cx.lineJoin = 'round'; cx.miterLimit = 2;
          cx.lineWidth = contorno; cx.strokeStyle = e.contorno;
          cx.strokeText(pw, x, y);
        }
        cx.shadowColor = 'transparent'; cx.shadowBlur = 0; cx.shadowOffsetY = 0;
        cx.fillStyle = acende ? e.acenderCor : e.cor;
        cx.fillText(pw, x, y);
        x += cx.measureText(pw + ' ').width;
      });
      jaPalavras += palavras.length;
    });
    cx.globalAlpha = 1;
  };

  /* ============================================== CRIAR E EDITAR ========= */

  L.nova = function (texto, inicio, dur) {
    var p = VE.project;
    if (!p) { VE.app.toast('carregue uma fonte primeiro', 'err'); return null; }
    var tr = L.pista();
    var src = L.fonte();
    inicio = inicio == null ? p.time : inicio;
    dur = dur || 2.2;
    var c = VE.newClipObj({
      kind: 'legenda', name: 'LEGENDA', src: src,
      start: inicio, dur: dur, fit: 'stretch'
    });
    c.texto = texto || '';
    tr.clips.push(c);
    tr.clips.sort(function (a, b) { return a.start - b.start; });
    VE.growToFit && VE.growToFit();
    return c;
  };

  L.ehLegenda = function (c) { return c && c.kind === 'legenda'; };

  /* Dividir no cursor é o gesto mais usado de todos: uma frase longa
     vira duas, e o texto vai junto, repartido pelo mesmo lugar.     */
  L.dividir = function (clip, t) {
    if (!clip || !L.ehLegenda(clip)) return null;
    t = t == null ? VE.project.time : t;
    if (t <= clip.start + 0.03 || t >= clip.start + clip.dur - 0.03) return null;
    var frac = (t - clip.start) / clip.dur;
    var palavras = String(clip.texto || '').replace(/\s+/g, ' ').trim().split(' ');
    var corte = Math.max(1, Math.min(palavras.length - 1, Math.round(palavras.length * frac)));
    /* VE.splitClip devolve a SEGUNDA metade já na pista, com tudo clonado */
    var seg = VE.splitClip(clip.id, t);
    if (!seg) return null;
    clip.texto = palavras.slice(0, corte).join(' ');
    seg.texto = palavras.slice(corte).join(' ');
    return seg;
  };

  /* juntar duas legendas vizinhas numa só */
  L.juntar = function (a, b) {
    if (!a || !b) return null;
    var ini = Math.min(a.start, b.start), fim = Math.max(a.start + a.dur, b.start + b.dur);
    var pa = a.start <= b.start ? a : b, pb = a.start <= b.start ? b : a;
    pa.texto = (pa.texto + ' ' + pb.texto).replace(/\s+/g, ' ').trim();
    pa.start = ini; pa.dur = fim - ini;
    VE.removeClip(pb.id);
    return pa;
  };

  /* ============================================== TEXTO → LEGENDAS =======
     Sem transcrição automática (que exigiria servidor), o caminho honesto
     é este: um bloco de texto entra e sai cronometrado. A conta é a que
     as legendarias usam — caracteres por segundo, com piso e teto — e
     depois é só arrastar as bordas, porque cada legenda é um clipe.   */

  L.deTexto = function (bloco, opts) {
    opts = opts || {};
    var cps = opts.cps || 15;             /* caracteres por segundo de leitura */
    var minDur = opts.min || 1.0;
    var maxDur = opts.max || 6.0;
    var vao = opts.vao === undefined ? 0.08 : opts.vao;
    var inicio = opts.inicio == null ? (VE.project ? VE.project.time : 0) : opts.inicio;
    var maxLinha = opts.maxLinha || 42, maxLinhas = opts.maxLinhas || 2;
    var teto = maxLinha * maxLinhas;

    /* 1. parte em frases; 2. frase comprida demais parte na vírgula;
       3. o que ainda sobrar parte no espaço mais perto do limite.    */
    var frases = String(bloco || '')
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?…:;])\s+/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);

    var pedacos = [];
    frases.forEach(function (fr) {
      if (fr.length <= teto) { pedacos.push(fr); return; }
      var partes = fr.split(/(?<=,)\s+/);
      partes.forEach(function (pt) {
        while (pt.length > teto) {
          var corte = pt.lastIndexOf(' ', teto);
          if (corte < teto * 0.5) corte = teto;
          pedacos.push(pt.slice(0, corte).trim());
          pt = pt.slice(corte).trim();
        }
        if (pt) pedacos.push(pt);
      });
    });

    var t = inicio, feitos = [];
    pedacos.forEach(function (txt) {
      var d = Math.max(minDur, Math.min(maxDur, txt.length / cps));
      var c = L.nova(txt, t, d);
      if (c) feitos.push(c);
      t += d + vao;
    });
    if (feitos.length) { VE.pushHistory(); VE.emit('project'); }
    return feitos;
  };

  /* ============================================== SRT / VTT ==============
     Os dois formatos que todo mundo lê. O .srt separa com vírgula, o .vtt
     com ponto e começa com WEBVTT. O resto é o mesmo.                  */

  function tcParaSeg(s) {
    var m = String(s).trim().match(/(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/);
    if (!m) return null;
    return (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / Math.pow(10, m[4].length);
  }

  function segParaTc(t, vtt) {
    t = Math.max(0, t);
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60);
    var s = Math.floor(t % 60), ms = Math.round((t - Math.floor(t)) * 1000);
    if (ms === 1000) { ms = 0; s++; }
    function z(n, k) { return String(n).padStart(k || 2, '0'); }
    return z(h) + ':' + z(m) + ':' + z(s) + (vtt ? '.' : ',') + z(ms, 3);
  }
  L.segParaTc = segParaTc;

  L.lerSRT = function (txt) {
    var linhas = String(txt).replace(/\r/g, '').split('\n');
    var saida = [], atual = null;
    for (var i = 0; i < linhas.length; i++) {
      var li = linhas[i];
      var seta = li.indexOf('-->');
      if (seta > -1) {
        var a = tcParaSeg(li.slice(0, seta)), b = tcParaSeg(li.slice(seta + 3));
        if (a != null && b != null) { atual = { inicio: a, fim: b, texto: '' }; saida.push(atual); }
        continue;
      }
      if (!atual) continue;
      if (!li.trim()) { atual = null; continue; }
      /* número de ordem solto, antes do tempo: ignora */
      if (!atual.texto && /^\d+$/.test(li.trim())) continue;
      atual.texto = atual.texto ? atual.texto + '\n' + li.trim() : li.trim();
    }
    return saida.filter(function (c) { return c.texto; });
  };

  L.importar = function (txt) {
    var itens = L.lerSRT(txt);
    if (!itens.length) { VE.app.toast('não achei legendas nesse arquivo', 'err'); return []; }
    if (!VE.project) VE.app.ensureProject();
    var feitos = [];
    itens.forEach(function (it) {
      var c = L.nova(it.texto.replace(/\n/g, ' '), it.inicio, Math.max(0.2, it.fim - it.inicio));
      if (c) feitos.push(c);
    });
    /* a composição precisa alcançar a última legenda */
    var fim = itens[itens.length - 1].fim;
    if (VE.project.duration < fim) VE.project.duration = Math.min(VE.MAXDUR, fim + 0.5);
    VE.pushHistory(); VE.emit('project');
    return feitos;
  };

  L.todas = function () {
    var out = [];
    L.pistas().forEach(function (t) {
      t.clips.forEach(function (c) { if (L.ehLegenda(c)) out.push(c); });
    });
    return out.sort(function (a, b) { return a.start - b.start; });
  };

  L.exportar = function (vtt) {
    var cs = L.todas();
    var partes = vtt ? ['WEBVTT', ''] : [];
    cs.forEach(function (c, i) {
      if (!vtt) partes.push(String(i + 1));
      partes.push(segParaTc(c.start, vtt) + ' --> ' + segParaTc(c.start + c.dur, vtt));
      var e = L.estiloDe(c);
      var texto = c.texto || '';
      /* a quebra em duas linhas vai junto: é assim que o arquivo é lido */
      tela();
      cx.font = (e.peso || 700) + ' ' + (e.corpo * cv.height) + 'px ' +
        (L.FONTES[e.fonte | 0] || L.FONTES[0]).f;
      var lin = quebrar(cx, texto, cv.width - e.margem * cv.width * 2, e.maxLinhas | 0);
      partes.push(lin.join('\n'));
      partes.push('');
    });
    return partes.join('\n');
  };

  /* ============================================== A FICHA ================
     Duas placas, e a divisão entre elas é a ideia inteira:

       FICHA · LEGENDA   o que é só desta frase — o texto
       ESTILO DA FAIXA   o que vale para TODAS as legendas da pista

     É o que faz trocar a fonte de duzentas legendas ser um clique.    */

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[<>&"]/g, function (m) {
      return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[m];
    });
  };

  function linha(k, rot, val, min, max, passo) {
    return '<div class="prow"><label title="' + esc(rot) + '">' + esc(rot) + '</label>' +
      '<input class="field num" data-legnum="' + k + '" value="' + (Math.round(val * 1000) / 1000) + '"><span></span></div>' +
      '<div class="prow-slider"><input type="range" data-legrange="' + k + '" min="' + min +
      '" max="' + max + '" step="' + passo + '" value="' + val + '"></div>';
  }
  function escolha(k, rot, val, opts) {
    return '<div class="prow"><label>' + esc(rot) + '</label>' +
      '<select class="field" data-legsel="' + k + '" style="grid-column:2/4">' +
      opts.map(function (o, i) { return '<option value="' + i + '"' + ((val | 0) === i ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
      '</select></div>';
  }
  function cor(k, rot, val) {
    return '<div class="prow" style="grid-template-columns:1fr auto"><label>' + esc(rot) + '</label>' +
      '<input type="color" data-legcor="' + k + '" value="' + (val || '#ffffff') + '"></div>';
  }
  function marca(k, rot, val) {
    return '<div class="prow"><label>' + esc(rot) + '</label>' +
      '<input type="checkbox" data-legchk="' + k + '"' + (val ? ' checked' : '') + '><span></span></div>';
  }

  L.fichaHtml = function (clip) {
    var e = L.estiloDe(clip);
    var P = VE.panels;
    var txt = clip.texto || '';
    var cps = txt.length / Math.max(0.2, clip.dur);

    /* ---------- o texto desta legenda ---------- */
    var b = '<div class="prow wide"><label>Texto que aparece na tela</label></div>' +
      '<div class="prow-slider"><textarea class="legtxt" data-legtexto spellcheck="true">' + esc(txt) + '</textarea></div>' +
      '<div class="prow wide"><span class="legcount' + (cps > 21 ? ' longa' : '') + '">' +
      txt.length + ' caracteres · ' + cps.toFixed(1) + ' por segundo' +
      (cps > 21 ? ' · RÁPIDA DEMAIS PARA LER — alongue o clipe' : '') + '</span></div>';
    b += '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-legact="dividir" title="Parte a frase no cursor, e o texto vai junto">DIVIDIR NO CURSOR</button>' +
      '<button class="cmd cmd-sm" data-legact="juntar" title="Funde com a legenda seguinte">JUNTAR COM A SEGUINTE</button>' +
      '</div>';
    b += '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-legact="antes">‹ ANTERIOR</button>' +
      '<button class="cmd cmd-sm" data-legact="depois">SEGUINTE ›</button>' +
      '<button class="cmd cmd-sm" data-legact="nova">+ NOVA AQUI</button>' +
      '</div>';
    var h = P.plate('FICHA · LEGENDA', b);

    /* ---------- estilo da faixa ---------- */
    var s = '<div class="pnote">o que muda aqui muda <b>todas as legendas desta pista</b> — é o estilo da faixa.</div>';
    s += '<div class="pbtns">' + L.PRESETS.map(function (p) {
      return '<button class="cmd cmd-sm' + (e.nome === p.n ? ' active' : '') +
        '" data-legpreset="' + p.id + '" title="' + esc(p.d) + '">' + p.n + '</button>';
    }).join('') + '</div>';

    s += '<div class="subhead">LETRA</div>';
    s += escolha('fonte', 'Família', e.fonte, L.FONTES.map(function (f) { return f.n; }));
    s += linha('corpo', 'Corpo (fração da altura)', e.corpo, 0.02, 0.16, 0.002);
    s += linha('peso', 'Peso', e.peso, 200, 900, 50);
    s += marca('caixaAlta', 'Tudo em maiúscula', e.caixaAlta);
    s += cor('cor', 'Cor da letra', e.cor);
    s += cor('contorno', 'Cor do contorno', e.contorno);
    s += linha('larguraContorno', 'Espessura do contorno', e.larguraContorno, 0, 0.4, 0.01);
    s += marca('sombra', 'Sombra por baixo', e.sombra);

    s += '<div class="subhead">FUNDO</div>';
    s += escolha('fundo', 'Tipo', e.fundo, L.FUNDOS);
    s += cor('fundoCor', 'Cor do fundo', e.fundoCor);
    s += linha('fundoAlfa', 'Opacidade do fundo', e.fundoAlfa, 0, 1, 0.01);
    s += linha('respiro', 'Respiro em volta', e.respiro, 0, 1.5, 0.01);
    s += linha('arredondar', 'Cantos arredondados', e.arredondar, 0, 1, 0.01);

    s += '<div class="subhead">LUGAR NA TELA</div>';
    s += escolha('alinhar', 'Alinhamento', e.alinhar, L.ALINHA);
    s += linha('posY', 'Altura da base', e.posY, 0.1, 0.98, 0.005);
    s += linha('margem', 'Margem lateral', e.margem, 0, 0.3, 0.005);
    s += linha('entrelinha', 'Entrelinha', e.entrelinha, 0.9, 2, 0.01);
    s += linha('maxLinhas', 'Máximo de linhas', e.maxLinhas, 1, 4, 1);
    s += linha('opacidade', 'Opacidade geral', e.opacidade, 0, 1, 0.01);

    s += '<div class="subhead">MOVIMENTO</div>';
    s += escolha('entrada', 'Como entra', e.entrada, ['NADA', 'APARECER', 'SUBIR', 'PALAVRA A PALAVRA']);
    s += linha('entradaDur', 'Tempo de entrada (s)', e.entradaDur, 0.02, 1.2, 0.01);
    s += marca('acender', 'Acender a palavra falada', e.acender);
    s += cor('acenderCor', 'Cor da palavra acesa', e.acenderCor);

    s += '<div class="subhead">SAÍDA EM ARQUIVO</div>';
    s += '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-legact="srt">EXPORTAR .SRT</button>' +
      '<button class="cmd cmd-sm" data-legact="vtt">EXPORTAR .VTT</button>' +
      '</div>';
    s += '<div class="pnote">o arquivo sai ao lado do vídeo, com os tempos e a quebra de linha. ' +
      'para gravar a legenda DENTRO da imagem, é só exportar o vídeo normalmente — ela é uma camada como outra qualquer.</div>';

    h += P.plate('ESTILO DA FAIXA', s, '', { key: 'LEG_ESTILO', count: L.todas().length });

    /* ---------- trazer texto de fora ---------- */
    var t = '<div class="pnote">o rgb_lab não manda o seu áudio para servidor nenhum, então não há ' +
      'transcrição automática aqui. As duas entradas honestas são estas — e depois é só arrastar as ' +
      'bordas, porque cada legenda é um clipe como outro qualquer.</div>';
    t += '<div class="prow wide"><label>Cole aqui o texto inteiro</label></div>' +
      '<div class="prow-slider"><textarea class="legtxt" data-legbloco spellcheck="true" ' +
      'placeholder="Um parágrafo, uma fala, um roteiro. Cada frase vira uma legenda, cronometrada pelo tamanho."></textarea></div>';
    t += linha('__cps', 'Velocidade de leitura (car./s)', 15, 8, 25, 0.5);
    t += linha('__maxl', 'Caracteres por linha', 42, 16, 60, 1);
    t += '<div class="pbtns">' +
      '<button class="cmd cmd-sm cmd-solid" data-legact="bloco">TRANSFORMAR EM LEGENDAS</button>' +
      '<button class="cmd cmd-sm" data-legact="abrir">ABRIR .SRT / .VTT</button>' +
      '</div>';
    h += P.plate('TRAZER TEXTO DE FORA', t, '', { key: 'LEG_ENTRADA' });
    return h;
  };

  /* Ligação. Fica aqui, e não no motion.js, para não repetir a armadilha
     de campo que aparece na ficha e não faz nada.                      */
  L.ligarFicha = function (box, clip, commit) {
    if (!L.ehLegenda(clip)) return;
    var e = L.estiloDe(clip);

    var ta = box.querySelector('[data-legtexto]');
    if (ta) {
      /* enquanto digita, a prévia acompanha; o histórico só no fim */
      ta.addEventListener('input', function () { clip.texto = ta.value; VE.tl.renderLite(); });
      ta.addEventListener('change', function () { clip.texto = ta.value; commit(); });
      ta.addEventListener('keydown', function (ev) { ev.stopPropagation(); });
    }

    box.querySelectorAll('[data-legnum]').forEach(function (el) {
      el.addEventListener('change', function () {
        var v = parseFloat(el.value); if (isNaN(v)) return;
        e[el.dataset.legnum] = v; commit();
      });
      el.addEventListener('keydown', function (ev) { ev.stopPropagation(); });
    });
    box.querySelectorAll('[data-legrange]').forEach(function (el) {
      el.addEventListener('input', function () {
        e[el.dataset.legrange] = parseFloat(el.value);
        var par = box.querySelector('[data-legnum="' + el.dataset.legrange + '"]');
        if (par) par.value = Math.round(parseFloat(el.value) * 1000) / 1000;
        VE.emit('livechange');
      });
      el.addEventListener('change', function () { commit(); });
    });
    box.querySelectorAll('[data-legsel]').forEach(function (el) {
      el.addEventListener('change', function () { e[el.dataset.legsel] = +el.value; commit(); });
    });
    box.querySelectorAll('[data-legcor]').forEach(function (el) {
      /* os dois eventos ESCREVEM. Guardar só no `input` parece funcionar
         enquanto se arrasta o seletor, e perde a cor quando o navegador
         manda apenas `change` — que é o caso de escolher pelo teclado. */
      var poe = function (fim) {
        return function () {
          e[el.dataset.legcor] = el.value;
          if (fim) commit(); else VE.emit('livechange');
        };
      };
      el.addEventListener('input', poe(false));
      el.addEventListener('change', poe(true));
    });
    box.querySelectorAll('[data-legchk]').forEach(function (el) {
      el.addEventListener('change', function () { e[el.dataset.legchk] = el.checked ? 1 : 0; commit(); });
    });
    box.querySelectorAll('[data-legpreset]').forEach(function (b) {
      b.addEventListener('click', function () {
        L.aplicarPreset(e, b.dataset.legpreset);
        commit(); VE.panels.renderProps();
      });
    });

    box.querySelectorAll('[data-legact]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.legact, todas = L.todas();
        var i = todas.indexOf(clip);
        if (a === 'dividir') {
          var novo = L.dividir(clip, VE.project.time);
          if (!novo) { VE.app.toast('ponha o cursor no meio da legenda', 'err'); return; }
          commit(); VE.panels.renderProps(); return;
        }
        if (a === 'juntar') {
          var prox = todas[i + 1];
          if (!prox) { VE.app.toast('não há legenda depois desta', 'err'); return; }
          var j = L.juntar(clip, prox); VE.select([j.id]); commit(); VE.panels.renderProps(); return;
        }
        if (a === 'antes' || a === 'depois') {
          var alvo = todas[a === 'antes' ? i - 1 : i + 1];
          if (!alvo) { VE.app.toast(a === 'antes' ? 'esta é a primeira' : 'esta é a última'); return; }
          VE.select([alvo.id]); VE.app.seek(alvo.start + 0.02); VE.panels.renderProps(); return;
        }
        if (a === 'nova') {
          var c = L.nova('', VE.project.time, 2);
          if (c) { VE.select([c.id]); commit(); VE.panels.renderProps(); }
          return;
        }
        if (a === 'srt') { L.baixar(false); return; }
        if (a === 'vtt') { L.baixar(true); return; }
        if (a === 'bloco') {
          var ta2 = box.querySelector('[data-legbloco]');
          var bloco = ta2 ? ta2.value.trim() : '';
          if (!bloco) { VE.app.toast('cole um texto no campo acima', 'err'); return; }
          function num(k, def) {
            var el = box.querySelector('[data-legnum="' + k + '"]');
            var v = el ? parseFloat(el.value) : NaN;
            return isNaN(v) ? def : v;
          }
          var feitos = L.deTexto(bloco, {
            cps: num('__cps', 15), maxLinha: num('__maxl', 42),
            maxLinhas: e.maxLinhas | 0, inicio: VE.project.time
          });
          if (ta2) ta2.value = '';
          VE.app.toast(feitos.length + ' legenda(s) criadas a partir de ' +
            VE.tl.tc(VE.project.time) + ' — arraste as bordas para acertar', 'ok');
          VE.panels.renderProps();
          return;
        }
        if (a === 'abrir') { L.abrirArquivo(); return; }
      });
    });
  };

  /* abre um .srt/.vtt do disco — um <input> escondido, criado na hora */
  L.abrirArquivo = function () {
    var inp = document.getElementById('legFile');
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'file'; inp.id = 'legFile'; inp.accept = '.srt,.vtt,.txt,text/plain';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        var fr = new FileReader();
        fr.onload = function () {
          var feitos = L.importar(String(fr.result));
          if (feitos.length) {
            VE.app.toast(feitos.length + ' legendas de ' + f.name, 'ok');
            VE.select([feitos[0].id]); VE.panels.renderProps();
          }
        };
        fr.readAsText(f, 'utf-8');
        inp.value = '';
      });
    }
    inp.click();
  };

  /* o que o botão LEGENDA da coluna de fontes faz */
  L.comecar = function () {
    if (!VE.project) VE.app.ensureProject();
    var tr = L.pista();
    var t = VE.project.time;
    /* já existe uma legenda debaixo do cursor? então é ela que se edita */
    var sob = tr.clips.filter(function (c) {
      return L.ehLegenda(c) && t >= c.start - 0.001 && t < c.start + c.dur;
    })[0];
    var c = sob || L.nova('', t, 2.2);
    if (!c) return null;
    VE.select([c.id]);
    VE.pushHistory(); VE.emit('project');
    VE.panels.renderProps();
    if (!sob) {
      VE.app.toast('legenda em ' + VE.tl.tc(c.start) + ' na pista ' + VE.trackLabel(tr) +
        ' — escreva na ficha à direita, ou cole um texto inteiro em TRAZER TEXTO DE FORA', 'ok');
    }
    return c;
  };

  L.baixar = function (vtt) {
    var cs = L.todas();
    if (!cs.length) { VE.app.toast('não há legendas para exportar', 'err'); return; }
    var txt = L.exportar(vtt);
    var blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    VE.saveFile((VE.BRAND ? VE.BRAND.slug : 'rgb_lab') + '-legendas.' + (vtt ? 'vtt' : 'srt'), blob);
    VE.app.toast(cs.length + ' legenda(s) em .' + (vtt ? 'vtt' : 'srt'), 'ok');
  };

})(window.VE);
