/* ============================================================
   rgb_lab — LETRAS RECORTADAS
   ------------------------------------------------------------
   Aquela mensagem montada com letras cortadas de jornal e revista.

   A ideia inteira está numa frase: CADA LETRA É UM PEDAÇO DE PAPEL
   DIFERENTE. Não é uma fonte — é um sorteio por letra, e é por isso que
   oito "A" seguidos saem oito vezes diferentes. Se duas letras iguais
   saíssem iguais, o efeito morre na hora: vira fonte com textura.

   Cada pedaço sorteia, a partir de uma SEMENTE própria:

       tipo de letra · peso · caixa · papel · tinta · textura
       tamanho · giro · sobra de papel em volta · recorte da borda

   A semente é guardada. Isso importa por dois motivos: o desenho é o
   mesmo a cada quadro (senão tremeria sozinho, sem se pedir), e a
   pessoa pode re-sortear UMA letra sem mexer nas outras.

   O papel não é um retângulo: é um polígono com as bordas ligeiramente
   irregulares, como tesoura em papel de jornal. Reto demais parece
   adesivo; irregular demais parece rasgado, que é outra coisa.

   Modelo e desenho ficam aqui. A interface fica em `recorteui.js` —
   mesma divisão de comp/compui e tinta/tintaui.
   ============================================================ */
(function (VE) {
  'use strict';

  var R = VE.recorte = {};

  /* ------------------------------------------------ AS FONTES DO QUIOSQUE
     Escolhidas por CONTRASTE entre si e por existirem em qualquer
     máquina. Uma banca de jornal tem serifada de livro, manchete gorda,
     máquina de escrever e condensada de classificado — é essa mistura
     que faz a mensagem parecer recortada de lugares diferentes.       */
  R.FONTES = [
    { n: 'manchete', f: 'Impact, "Arial Black", "Archivo Black", sans-serif', peso: 400, apertar: 0.92 },
    { n: 'serifada', f: 'Georgia, "Times New Roman", serif', peso: 700, apertar: 1 },
    { n: 'livro', f: '"Palatino Linotype", Palatino, Georgia, serif', peso: 400, apertar: 1 },
    { n: 'grotesca', f: 'Arial, Helvetica, sans-serif', peso: 700, apertar: 1 },
    { n: 'condensada', f: '"Arial Narrow", "Archivo Narrow", Arial, sans-serif', peso: 700, apertar: 0.96 },
    { n: 'máquina', f: '"Courier New", Courier, monospace', peso: 700, apertar: 1 },
    { n: 'console', f: '"Lucida Console", Consolas, monospace', peso: 400, apertar: 1 },
    { n: 'humanista', f: '"Trebuchet MS", "Segoe UI", sans-serif', peso: 700, apertar: 1 },
    { n: 'antiga', f: '"Book Antiqua", Georgia, serif', peso: 400, apertar: 1 },
    { n: 'gorda', f: '"Arial Black", Impact, sans-serif', peso: 900, apertar: 0.94 }
  ];

  /* ------------------------------------------------------- OS PAPÉIS
     Papel e tinta andam JUNTOS: recorte de jornal é preto sobre creme,
     manchete de revista é branco sobre cor chapada. Sortear os dois
     separado dá combinação ilegível — amarelo sobre creme.           */
  R.PAPEIS = [
    { n: 'jornal', papel: '#e8e2d2', tinta: '#1a1a18', peso: 26, textura: 'jornal' },
    { n: 'jornal velho', papel: '#ddd2b8', tinta: '#25201a', peso: 16, textura: 'jornal' },
    { n: 'branco', papel: '#f7f5f0', tinta: '#111111', peso: 14, textura: 'liso' },
    { n: 'preto', papel: '#141414', tinta: '#f4f1e8', peso: 12, textura: 'liso' },
    { n: 'kraft', papel: '#c8a074', tinta: '#2a1c10', peso: 6, textura: 'fibra' },
    { n: 'magenta', papel: '#e8127c', tinta: '#ffffff', peso: 6, textura: 'trama' },
    { n: 'vermelho', papel: '#d81f26', tinta: '#fdfaf2', peso: 6, textura: 'trama' },
    { n: 'amarelo', papel: '#f5c400', tinta: '#161616', peso: 5, textura: 'trama' },
    { n: 'ciano', papel: '#2bb6c4', tinta: '#0d2124', peso: 5, textura: 'trama' },
    { n: 'laranja', papel: '#e8722a', tinta: '#fffaf0', peso: 4, textura: 'trama' },
    { n: 'roxo', papel: '#8a6bbf', tinta: '#f6f2ff', peso: 3, textura: 'trama' },
    { n: 'cinza', papel: '#a8a49c', tinta: '#15150f', peso: 4, textura: 'fibra' },
    { n: 'negativo', papel: '#1c1c1c', tinta: '#e6e0d0', peso: 5, textura: 'jornal' }
  ];

  /* sorteio com peso: jornal tem de sair muito mais que roxo, senão a
     mensagem vira arco-íris e perde o ar de recorte                  */
  var PESO_TOTAL = R.PAPEIS.reduce(function (a, p) { return a + p.peso; }, 0);

  /* ------------------------------------------------------ ALEATÓRIO FIXO
     Gerador próprio, semeado. `Math.random` não serve: o desenho tem de
     sair igual a cada quadro, e uma letra tem de poder ser re-sorteada
     sozinha.                                                          */
  function rng(semente) {
    var s = (semente >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  R.rng = rng;

  /* ============================================== O PEDAÇO DE PAPEL ====== */

  R.novoPedaco = function (ch, semente) {
    return {
      ch: ch,
      semente: semente >>> 0,
      dx: 0, dy: 0,          /* deslocamento posto pela mão, em px de tela */
      giroMao: 0,            /* giro posto pela mão, somado ao sorteado */
      preso: 0               /* 1 = a mão mexeu; o re-sorteio geral respeita */
    };
  };

  /* Traduz a semente nas escolhas. É uma função PURA da semente: mesma
     semente, mesmo pedaço, sempre.                                    */
  R.sortear = function (p, P) {
    var r = rng(p.semente * 2654435761 + 12345);
    var f = R.FONTES[Math.floor(r() * R.FONTES.length)];

    var alvo = r() * PESO_TOTAL, acc = 0, pap = R.PAPEIS[0];
    for (var i = 0; i < R.PAPEIS.length; i++) {
      acc += R.PAPEIS[i].peso;
      if (alvo <= acc) { pap = R.PAPEIS[i]; break; }
    }

    var caixa = r();
    return {
      fonte: f,
      papel: pap,
      /* caixa alta em mais da metade: recorte de manchete é maiúscula */
      maiuscula: caixa < (P.maiusculas === undefined ? 0.62 : P.maiusculas),
      escala: 1 + (r() - 0.5) * 2 * (P.varTam === undefined ? 0.34 : P.varTam),
      giro: (r() - 0.5) * 2 * (P.varGiro === undefined ? 9 : P.varGiro),
      sobraX: 0.16 + r() * 0.26,     /* papel em volta da letra */
      sobraY: 0.14 + r() * 0.3,
      subir: (r() - 0.5) * 2 * (P.varAltura === undefined ? 0.18 : P.varAltura),
      sombra: 0.4 + r() * 0.6,
      /* a irregularidade da tesoura, doze números fixos por pedaço */
      corte: [r(), r(), r(), r(), r(), r(), r(), r(), r(), r(), r(), r()],
      grao: r()
    };
  };

  /* =============================================== O RECORTE DA BORDA ====
     Quatro lados, três pontos cada, deslocados para dentro e para fora.
     Tesoura em papel de jornal não faz linha reta nem faz rasgo — faz
     uma reta com hesitação. É esse meio-termo que engana o olho.     */
  function caminhoPapel(cx, w, h, corte, forca) {
    var f = (forca === undefined ? 1 : forca) * Math.min(w, h) * 0.035;
    var k = 0;
    function d() { return (corte[(k++) % corte.length] - 0.5) * 2 * f; }
    cx.beginPath();
    cx.moveTo(-w / 2 + d(), -h / 2 + d());
    cx.lineTo(-w / 6 + d(), -h / 2 + d());
    cx.lineTo(w / 6 + d(), -h / 2 + d());
    cx.lineTo(w / 2 + d(), -h / 2 + d());
    cx.lineTo(w / 2 + d(), 0 + d());
    cx.lineTo(w / 2 + d(), h / 2 + d());
    cx.lineTo(w / 6 + d(), h / 2 + d());
    cx.lineTo(-w / 6 + d(), h / 2 + d());
    cx.lineTo(-w / 2 + d(), h / 2 + d());
    cx.lineTo(-w / 2 + d(), 0 + d());
    cx.closePath();
  }

  /* ============================================== TEXTURA DO PAPEL ======
     Feita uma vez por combinação e guardada. Desenhar trama ponto a
     ponto em cada letra, em cada quadro, derruba a taxa na hora.    */
  var texCache = {};
  function texturaDe(tipo, corPapel) {
    var chave = tipo + '|' + corPapel;
    if (texCache[chave]) return texCache[chave];
    var S = 64;
    var cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    var c = cv.getContext('2d');
    c.fillStyle = corPapel; c.fillRect(0, 0, S, S);
    var r = rng(1234567);
    if (tipo === 'jornal') {
      /* pontinhos de rotogravura, irregulares e claros */
      for (var i = 0; i < 900; i++) {
        var a = r() * 0.16;
        c.fillStyle = 'rgba(0,0,0,' + a.toFixed(3) + ')';
        c.fillRect(r() * S, r() * S, 1, 1);
      }
    } else if (tipo === 'fibra') {
      for (var j = 0; j < 220; j++) {
        c.strokeStyle = 'rgba(0,0,0,' + (r() * 0.08).toFixed(3) + ')';
        c.lineWidth = 1;
        var x = r() * S, y = r() * S, L = 3 + r() * 12, ang = r() * 6.283;
        c.beginPath(); c.moveTo(x, y);
        c.lineTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L); c.stroke();
      }
    } else if (tipo === 'trama') {
      /* meio-tom de revista: pontos em grade, alinhados */
      for (var y2 = 2; y2 < S; y2 += 4) {
        for (var x2 = 2; x2 < S; x2 += 4) {
          c.fillStyle = 'rgba(255,255,255,' + (0.05 + r() * 0.07).toFixed(3) + ')';
          c.beginPath(); c.arc(x2, y2, 1.1, 0, 6.283); c.fill();
        }
      }
    }
    var pat = c.createPattern ? null : null;
    texCache[chave] = cv;
    return cv;
  }
  R.texturaDe = texturaDe;

  /* ============================================== MEDIR E DESENHAR ====== */

  /* O tamanho do pedaço sai da letra DE VERDADE, medida na fonte
     sorteada — acento incluído. Medir por altura fixa cortaria o til do
     Ã e deixaria o "o" nadando num papelão.                          */
  R.medir = function (cx, p, P, corpo) {
    var s = R.sortear(p, P);
    var ch = s.maiuscula ? p.ch.toUpperCase() : p.ch;
    var tam = corpo * s.escala;
    cx.font = s.fonte.peso + ' ' + tam + 'px ' + s.fonte.f;
    var m = cx.measureText(ch);
    var largura = m.width * s.fonte.apertar;
    /* alturas reais do glifo, com acento e com descida */
    var acima = (m.actualBoundingBoxAscent !== undefined) ? m.actualBoundingBoxAscent : tam * 0.72;
    var abaixo = (m.actualBoundingBoxDescent !== undefined) ? m.actualBoundingBoxDescent : tam * 0.22;
    var alturaGlifo = Math.max(4, acima + abaixo);
    return {
      s: s, ch: ch, tam: tam,
      glifoW: largura, glifoH: alturaGlifo, acima: acima, abaixo: abaixo,
      w: largura + tam * s.sobraX * 2,
      h: alturaGlifo + tam * s.sobraY * 2
    };
  };

  /* Desenha UM pedaço com o centro em (x, y). `tremor` é o deslocamento
     da animação, que não entra no sorteio — assim tremer não re-sorteia. */
  R.desenharPedaco = function (cx, p, P, corpo, x, y, tremor) {
    var m = R.medir(cx, p, P, corpo);
    var s = m.s;
    var tr = tremor || { dx: 0, dy: 0, rot: 0, esc: 1 };

    cx.save();
    cx.translate(x + p.dx + tr.dx, y + p.dy + tr.dy);
    cx.rotate((s.giro + p.giroMao + tr.rot) * Math.PI / 180);
    if (tr.esc && tr.esc !== 1) cx.scale(tr.esc, tr.esc);

    /* --- sombra do papel sobre o fundo --- */
    if (P.sombra) {
      cx.save();
      cx.shadowColor = 'rgba(0,0,0,' + (0.34 * s.sombra * P.sombra).toFixed(3) + ')';
      cx.shadowBlur = corpo * 0.09 * P.sombra;
      cx.shadowOffsetX = corpo * 0.02 * P.sombra;
      cx.shadowOffsetY = corpo * 0.035 * P.sombra;
      caminhoPapel(cx, m.w, m.h, s.corte, P.corte);
      cx.fillStyle = s.papel.papel;
      cx.fill();
      cx.restore();
    }

    /* --- o papel --- */
    caminhoPapel(cx, m.w, m.h, s.corte, P.corte);
    cx.save();
    cx.clip();
    cx.fillStyle = s.papel.papel;
    cx.fillRect(-m.w, -m.h, m.w * 2, m.h * 2);
    /* textura, deslocada pela semente para dois pedaços não repetirem */
    if (P.textura > 0.01) {
      var tex = texturaDe(s.papel.textura, s.papel.papel);
      cx.globalAlpha = P.textura;
      var ox = -m.w / 2 - s.grao * 40, oy = -m.h / 2 - s.corte[0] * 40;
      for (var ty = oy; ty < m.h; ty += 64) {
        for (var tx = ox; tx < m.w; tx += 64) cx.drawImage(tex, tx, ty);
      }
      cx.globalAlpha = 1;
    }

    /* --- a letra --- */
    cx.font = s.fonte.peso + ' ' + m.tam + 'px ' + s.fonte.f;
    cx.textAlign = 'center';
    cx.textBaseline = 'alphabetic';
    cx.fillStyle = s.papel.tinta;
    cx.save();
    if (s.fonte.apertar !== 1) cx.scale(s.fonte.apertar, 1);
    /* a linha de base sai da medida real: o glifo fica centrado no papel
       mesmo quando tem acento em cima ou perna embaixo */
    var base = (m.acima - m.abaixo) / 2;
    cx.fillText(m.ch, 0, base);
    cx.restore();
    cx.restore();

    /* --- vinco do papel: uma sombra fina de um lado --- */
    if (P.vinco > 0.01) {
      cx.save();
      caminhoPapel(cx, m.w, m.h, s.corte, P.corte);
      cx.clip();
      var g = cx.createLinearGradient(-m.w / 2, -m.h / 2, m.w / 2, m.h / 2);
      g.addColorStop(0, 'rgba(0,0,0,' + (0.16 * P.vinco).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,' + (0.1 * P.vinco).toFixed(3) + ')');
      cx.fillStyle = g;
      cx.fillRect(-m.w, -m.h, m.w * 2, m.h * 2);
      cx.restore();
    }

    cx.restore();
    return m;
  };

  /* ============================================== A COMPOSIÇÃO ==========
     Devolve a lista de pedaços já POSICIONADOS. Serve para desenhar e
     serve para o mouse achar em quem clicou — um lugar só decide onde
     cada letra está, e por isso o clique nunca discorda do desenho.  */
  /* AUTO-AJUSTE. Sem isto, escrever uma frase com o tamanho de uma
     palavra joga metade das letras para fora do quadro — e o pedaço que
     sai não avisa, some. Mede a linha mais larga e a mais alta e encolhe
     o corpo até caber, nunca o aumenta.                              */
  R.corpoQueCabe = function (cx, texto, P, W, H) {
    var corpo = P.corpo * Math.min(W, H);
    if (!P.ajustar) return corpo;
    var linhas = String(texto || '').split('\n');
    var maior = 0;
    linhas.forEach(function (linha, li) {
      var larg = 0, n = 0;
      Array.from(linha).forEach(function (ch) {
        if (ch === ' ') { larg += corpo * (0.3 + P.espacoLetra); return; }
        var p = R.achar(P, contarAte(P, texto, li, n), ch);
        larg += R.medir(cx, p, P, corpo).w + corpo * P.espacoLetra;
        n++;
      });
      if (larg > maior) maior = larg;
    });
    var alturaTotal = linhas.length * corpo * (1 + P.entrelinha);
    var k = Math.min(
      maior > 0 ? (W * 0.94) / maior : 1,
      alturaTotal > 0 ? (H * 0.94) / alturaTotal : 1,
      1
    );
    return corpo * (isFinite(k) && k > 0 ? k : 1);
  };

  /* quantas letras (sem espaço) vieram antes da posição `n` da linha `li` */
  function contarAte(P, texto, li, n) {
    var linhas = String(texto || '').split('\n'), c = 0;
    for (var i = 0; i < li; i++) {
      c += Array.from(linhas[i]).filter(function (x) { return x !== ' '; }).length;
    }
    return c + n;
  }

  R.montar = function (cx, texto, P, W, H) {
    var corpo = R.corpoQueCabe(cx, texto, P, W, H);
    var linhas = String(texto || '').split('\n');
    var itens = [], idx = 0;
    var alturaLinha = corpo * (1 + P.entrelinha);
    var totalH = linhas.length * alturaLinha;
    var y0 = H / 2 - totalH / 2 + alturaLinha / 2;

    linhas.forEach(function (linha, li) {
      var chars = Array.from(linha);
      /* mede tudo antes para poder centralizar */
      var medidas = [], larg = 0;
      chars.forEach(function (ch) {
        if (ch === ' ') { medidas.push(null); larg += corpo * (0.3 + P.espacoLetra); return; }
        var p = R.achar(P, idx + medidas.filter(function (x) { return x !== null; }).length, ch);
        var m = R.medir(cx, p, P, corpo);
        medidas.push({ p: p, m: m });
        larg += m.w + corpo * P.espacoLetra;
      });
      var x = W / 2 - larg / 2;
      medidas.forEach(function (it) {
        if (!it) { x += corpo * (0.3 + P.espacoLetra); return; }
        var cxx = x + it.m.w / 2;
        var cyy = y0 + li * alturaLinha + it.m.s.subir * corpo;
        itens.push({ p: it.p, m: it.m, x: cxx, y: cyy });
        x += it.m.w + corpo * P.espacoLetra;
        idx++;
      });
    });
    return itens;
  };

  /* o pedaço da posição `i` com o caractere `ch` — cria se não existir,
     e re-cria se o caractere daquela posição mudou (a pessoa digitou) */
  R.achar = function (P, i, ch) {
    P.pedacos = P.pedacos || [];
    var p = P.pedacos[i];
    if (!p || p.ch !== ch) {
      p = R.novoPedaco(ch, (P.semente + i * 7919) >>> 0);
      P.pedacos[i] = p;
    }
    return p;
  };

  /* ============================================== ANIMAÇÃO ==============
     Dois estilos, os mesmos que se vê em stop motion de papel:

       CAOS        a letra TROCA de recorte e treme
       STOP MOTION só treme, o recorte fica

     DESSINCRONIZAR dá a cada letra um relógio próprio. Com tudo no mesmo
     compasso parece máquina; fora de compasso parece mão.            */
  R.ESTILOS = ['CAOS (troca + treme)', 'STOP MOTION (só treme)', 'PULSO (troca no tempo)', 'PARADO'];

  R.quadroDe = function (P, tempo, i) {
    var passo = Math.max(0.02, 1 / Math.max(0.5, P.velocidade * 12));
    var fase = P.dessinc ? (i * 0.37) % 1 : 0;
    return Math.floor(tempo / passo + fase);
  };

  R.tremorDe = function (P, tempo, i, p) {
    if (P.estilo === 3) return { dx: 0, dy: 0, rot: 0, esc: 1 };
    var q = R.quadroDe(P, tempo, i);
    var r = rng((p.semente ^ (q * 2246822519)) >>> 0);
    var amp = P.tremor;
    return {
      dx: (r() - 0.5) * 2 * amp,
      dy: (r() - 0.5) * 2 * amp,
      rot: (r() - 0.5) * 2 * amp * 0.35,
      esc: 1 + (r() - 0.5) * 2 * amp * 0.008
    };
  };

  /* No CAOS e no PULSO a semente do sorteio muda com o quadro — é isso
     que TROCA o recorte. A semente da mão (`p.semente`) fica intacta,
     então voltar para PARADO devolve o recorte original.            */
  R.pedacoNoTempo = function (P, p, tempo, i) {
    if (P.estilo === 0 || P.estilo === 2) {
      var q = R.quadroDe(P, tempo, i);
      return {
        ch: p.ch, dx: p.dx, dy: p.dy, giroMao: p.giroMao, preso: p.preso,
        semente: (p.semente ^ (q * 668265263)) >>> 0
      };
    }
    return p;
  };

  R.desenhar = function (cx, texto, P, W, H, tempo) {
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, W, H);
    if (P.fundoOn) { cx.fillStyle = P.fundo; cx.fillRect(0, 0, W, H); }
    var corpo = R.corpoQueCabe(cx, texto, P, W, H);
    var itens = R.montar(cx, texto, P, W, H);
    itens.forEach(function (it, i) {
      var pt = R.pedacoNoTempo(P, it.p, tempo || 0, i);
      var tr = R.tremorDe(P, tempo || 0, i, it.p);
      R.desenharPedaco(cx, pt, P, corpo, it.x, it.y, tr);
    });
    return itens;
  };

  /* ============================================== OS AJUSTES ============ */
  R.novoP = function () {
    return {
      corpo: 0.13,            /* fração da menor dimensão */
      ajustar: 1,             /* encolhe para caber no quadro */
      espacoLetra: 0.06,
      entrelinha: 0.28,
      varTam: 0.34,
      varGiro: 9,
      varAltura: 0.18,
      maiusculas: 0.62,
      textura: 0.85,
      sombra: 1,
      vinco: 0.5,
      corte: 1,
      fundoOn: 0, fundo: '#efede4',
      /* animação */
      estilo: 0,
      velocidade: 1,
      tremor: 3,
      dessinc: 0,
      semente: (Math.random() * 4294967296) >>> 0,
      pedacos: []
    };
  };

  /* re-sorteia tudo o que a mão não prendeu */
  R.resortear = function (P) {
    P.semente = (Math.random() * 4294967296) >>> 0;
    (P.pedacos || []).forEach(function (p, i) {
      if (!p) return;
      if (p.preso) { p.semente = (P.semente + i * 7919) >>> 0; return; }
      p.semente = (P.semente + i * 7919) >>> 0;
      p.dx = 0; p.dy = 0; p.giroMao = 0;
    });
  };

  R.resortearUm = function (P, i) {
    var p = (P.pedacos || [])[i];
    if (!p) return;
    p.semente = (Math.random() * 4294967296) >>> 0;
  };

})(window.VE);
