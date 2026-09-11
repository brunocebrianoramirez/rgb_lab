/* ============================================================
   rgb_lab — MESA DE DIGITALIZAÇÃO (slit-scan de verdade)
   ------------------------------------------------------------
   O escâner de mesa como ele é: um cabeçote que anda UMA LINHA
   POR VEZ, e um filme que guarda o que estava embaixo dele no
   instante em que passou.

   A diferença para o efeito `scanner` (fx13.js) é inteira e vale
   dizer com todas as letras:

     scanner (efeito)   uma FÓRMULA aplicada ao quadro. Todo quadro
                        pode ser recalculado do zero, a qualquer
                        instante, e por isso ele serve de efeito de
                        linha do tempo — escrubável, exportável.
     mesa (esta)        uma GRAVAÇÃO. Cada linha do filme guarda o
                        que a fonte estava mostrando naquele
                        momento, e isso não dá para recalcular
                        depois: é performance, não parâmetro.

   É por ser gravação que ela mora numa janela e não numa ficha, e
   é por isso que o resultado vira uma FONTE do laboratório (como
   o FRAME da câmera em `media.js/camGrab`) em vez de um efeito.

   ------------------------------------------------------------
   COMO A DISTORÇÃO NASCE — e por que funciona em foto E em vídeo

   O cabeçote lê a linha `y` da fonte e escreve na linha `y` do
   filme. Parado, o filme sai igual à fonte. A arte aparece quando
   alguma coisa muda ENQUANTO ele anda:

     FOTO    a pessoa arrasta/gira/amplia a fonte durante o scan.
             Cada linha guarda a posição daquele instante, e a
             imagem escorre, rasga, estica.
     VÍDEO   a fonte anda sozinha: o vídeo TOCA durante o scan.
             Cada linha do filme é um QUADRO DIFERENTE — quem se
             mexeu vira um borrão contínuo, quem ficou parado sai
             nítido. É o slit-scan clássico da videoarte, e sai de
             graça: o mesmo laço, só que a fonte é um <video>.

   Os dois podem acontecer juntos — arrastar um vídeo enquanto ele
   toca soma as duas distorções.
   ============================================================ */
(function (VE) {
  'use strict';

  var M = VE.mesa = {};

  /* Um estado só, porque uma mesa só. Guardado fora da janela para a
     sessão sobreviver a fechar e reabrir — quem escaneou metade de um
     filme não perde o que já gravou ao fechar sem querer.            */
  M.est = null;

  M.PADRAO = {
    velocidade: 1,      /* linhas por quadro — 0,5 a 8, como na referência */
    direcao: 'Y',       /* 'Y' de cima para baixo · 'X' da esquerda para a direita */
    cor: 1,             /* 1 cor · 0 preto e branco */
    fundo: '#ffffff',
    /* FUNDO TRANSPARENTE: onde a fonte não cobriu, o filme fica com
       alfa ZERO em vez de cor. É o que faz a digitalização servir de
       CAMADA — o recorte irregular que o cabeçote deixou nas bordas
       passa a deixar ver o que está embaixo na linha do tempo.      */
    transp: 0,
    ruido: 40,          /* 0..100 — grão do sensor */
    onda: 0,            /* 0..100 px — a oscilação senoidal do cabeçote */
    info: 1             /* queima a ficha técnica no canto do filme */
  };

  /* ------------------------------------------------------------------
     ABRIR A MESA
     `fonte` é o que vai ser digitalizado. Aceita o que o laboratório já
     sabe produzir: um <img>, um <canvas> ou um <video>. O vídeo entra
     TOCANDO — é dele que vem a distorção temporal.                   */
  M.abrir = function (fonte, nome, w, h) {
    /* O filme nasce do tamanho da COMPOSIÇÃO, não de uma folha fixa.
       A metáfora do escâner pedia uma folha retrato, mas um filme
       900×1200 largado numa composição 16:9 entra com tarja dos dois
       lados — e o lugar deste resultado é a linha do tempo. Seguindo a
       tela do projeto, ele entra encaixado. Sem projeto aberto, cai na
       folha retrato de antes.                                       */
    var W = 900, H = 1200;
    if (VE.project && VE.project.canvas && VE.project.canvas.w) {
      W = VE.project.canvas.w; H = VE.project.canvas.h;
    }
    var filme = document.createElement('canvas');
    filme.width = W; filme.height = H;
    var est = {
      fonte: fonte, nome: nome || 'DIGITALIZAÇÃO', fw: w || 0, fh: h || 0,
      filme: filme, fctx: filme.getContext('2d', { willReadFrequently: true }),
      pos: 0, rodando: false,
      par: JSON.parse(JSON.stringify(M.PADRAO)),
      /* a fonte na mesa: deslocamento em px do filme, escala e giro */
      t: { x: 0, y: 0, esc: 1, giro: 0 },
      comecou: null
    };
    M.est = est;
    M.enquadrar();
    M.limparFilme();
    return est;
  };

  M.fechada = function () { return !M.est; };

  /* enquadra a fonte no filme, com uma folga — o ponto de partida de
     qualquer digitalização, e o que a tecla R devolve                */
  M.enquadrar = function () {
    var e = M.est; if (!e) return;
    var fw = M.larguraFonte(), fh = M.alturaFonte();
    if (!fw || !fh) return;
    var esc = Math.min(e.filme.width / fw, e.filme.height / fh) * 0.86;
    e.t.esc = esc; e.t.giro = 0;
    e.t.x = (e.filme.width - fw * esc) / 2;
    e.t.y = (e.filme.height - fh * esc) / 2;
  };

  M.larguraFonte = function () {
    var e = M.est; if (!e || !e.fonte) return 0;
    return e.fonte.videoWidth || e.fonte.naturalWidth || e.fonte.width || e.fw || 0;
  };
  M.alturaFonte = function () {
    var e = M.est; if (!e || !e.fonte) return 0;
    return e.fonte.videoHeight || e.fonte.naturalHeight || e.fonte.height || e.fh || 0;
  };

  /* ------------------------------------------------------------------
     O FILME EM BRANCO
     Não é "apagar": é pôr folha nova. A cor de fundo é a mesma que vai
     aparecer onde a fonte não cobrir durante o scan, senão a folha
     mudaria de cor no meio da digitalização.                         */
  M.limparFilme = function () {
    var e = M.est; if (!e) return;
    e.fctx.setTransform(1, 0, 0, 1, 0, 0);
    e.fctx.globalAlpha = 1;
    if (e.par.transp) e.fctx.clearRect(0, 0, e.filme.width, e.filme.height);
    else {
      e.fctx.fillStyle = e.par.fundo;
      e.fctx.fillRect(0, 0, e.filme.width, e.filme.height);
    }
    e.pos = 0;
    e.comecou = null;
  };

  M.reiniciar = function () {
    var e = M.est; if (!e) return;
    e.pos = 0; e.rodando = false; e.comecou = null;
  };

  M.comprimento = function () {
    var e = M.est; if (!e) return 0;
    return e.par.direcao === 'Y' ? e.filme.height : e.filme.width;
  };

  M.terminou = function () {
    var e = M.est;
    return !!e && e.pos >= M.comprimento();
  };

  /* ══════════════════════════════════════════════════ O CABEÇOTE ═══
     Um passo = `velocidade` linhas. Cada linha é desenhada SOZINHA,
     recortada numa faixa de um pixel, com a fonte no estado em que ela
     está AGORA. É esse recorte por faixa que faz o slit-scan: o resto
     da imagem existe, mas não é escrito.

     Desenhar a imagem inteira e recortar parece desperdício, e é —
     mas é o único jeito que respeita escala e giro sem reimplementar
     amostragem à mão, e o navegador resolve isso na GPU. Medido: 1200
     linhas de uma foto de 4000 px saem em poucos segundos.          */
  M.passo = function () {
    var e = M.est;
    if (!e || !e.rodando) return false;
    var fim = M.comprimento();
    if (e.pos >= fim) { e.rodando = false; return false; }
    if (e.comecou == null) e.comecou = Date.now();

    var vel = Math.max(0.5, Math.min(8, e.par.velocidade));
    var alvo = Math.min(fim, e.pos + vel);
    /* linhas inteiras: o resto fica para o próximo passo, senão uma
       velocidade fracionária deixaria vãos não escritos entre faixas */
    var de = Math.floor(e.pos), ate = Math.floor(alvo);
    for (var L = de; L < ate; L++) M.linha(L);
    e.pos = alvo;
    if (e.pos >= fim) e.rodando = false;
    return true;
  };

  /* uma linha do filme */
  M.linha = function (L) {
    var e = M.est; if (!e) return;
    var vertical = (e.par.direcao === 'Y');
    var W = e.filme.width, H = e.filme.height;
    var c = e.fctx;

    /* a oscilação do cabeçote: desloca a leitura no eixo PERPENDICULAR
       ao avanço, que é como um motor trepidando de verdade            */
    var onda = 0;
    if (e.par.onda > 0.001) {
      onda = Math.sin(L * 0.035) * e.par.onda;
    }

    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    /* a faixa de UM pixel — tudo que for desenhado agora só existe aqui */
    c.beginPath();
    if (vertical) c.rect(0, L, W, 1); else c.rect(L, 0, 1, H);
    c.clip();

    /* folha por baixo: onde a fonte não chegar, fica o fundo — ou nada,
       se a folha for transparente. `clearRect` respeita o recorte, então
       ele só apaga esta faixa e não o que já foi gravado.            */
    if (e.par.transp) {
      if (vertical) c.clearRect(0, L, W, 1); else c.clearRect(L, 0, 1, H);
    } else {
      c.fillStyle = e.par.fundo;
      if (vertical) c.fillRect(0, L, W, 1); else c.fillRect(L, 0, 1, H);
    }

    /* a fonte, no estado deste instante */
    var fw = M.larguraFonte(), fh = M.alturaFonte();
    if (fw && fh) {
      c.translate(e.t.x + (vertical ? onda : 0), e.t.y + (vertical ? 0 : onda));
      if (e.t.giro) {
        c.translate(fw * e.t.esc / 2, fh * e.t.esc / 2);
        c.rotate(e.t.giro * Math.PI / 180);
        c.translate(-fw * e.t.esc / 2, -fh * e.t.esc / 2);
      }
      c.scale(e.t.esc, e.t.esc);
      try { c.drawImage(e.fonte, 0, 0); } catch (err) { /* quadro ainda não decodificado */ }
    }
    c.restore();

    /* grão e preto-e-branco: uma leitura por linha, não pelo filme
       inteiro — é o que mantém o custo constante enquanto o scan anda */
    var precisaPixel = (e.par.ruido > 0.5) || !e.par.cor;
    if (!precisaPixel) return;
    var x0 = vertical ? 0 : L, y0 = vertical ? L : 0;
    var lw = vertical ? W : 1, lh = vertical ? 1 : H;
    var im = c.getImageData(x0, y0, lw, lh);
    var d = im.data, g = e.par.ruido * 0.85;
    for (var i = 0; i < d.length; i += 4) {
      /* pixel vazio da folha transparente fica INTOCADO. Pôr grão nele
         escreveria cor por baixo de alfa zero, e é dessa cor escondida
         que nascem os halos quando a camada é composta lá na frente. */
      if (d[i + 3] === 0) continue;
      if (!e.par.cor) {
        var y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = y;
      }
      if (g > 0.5) {
        var n = (Math.random() - 0.5) * g;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
      }
    }
    c.putImageData(im, x0, y0);
  };

  /* ------------------------------------------------------------------
     A FICHA TÉCNICA QUEIMADA NO CANTO
     Desenhada só na hora de entregar o filme, nunca durante o scan —
     se fosse escrita antes, o cabeçote passaria por cima dela.      */
  M.comFicha = function () {
    var e = M.est; if (!e) return null;
    if (!e.par.info) return e.filme;
    var cv = document.createElement('canvas');
    cv.width = e.filme.width; cv.height = e.filme.height;
    var c = cv.getContext('2d');
    c.drawImage(e.filme, 0, 0);
    var linhas = [
      e.par.direcao === 'Y' ? 'VERTICAL' : 'HORIZONTAL',
      e.par.velocidade.toFixed(1) + ' PX/QUADRO',
      e.par.cor ? 'COR' : 'PRETO E BRANCO',
      'GRÃO ' + Math.round(e.par.ruido) + '%',
      'ONDA ' + Math.round(e.par.onda) + ' PX'
    ];
    c.font = '11px ui-monospace, monospace';
    c.textBaseline = 'top';
    var x = 16, y = cv.height - 16 - linhas.length * 13;
    linhas.forEach(function (t, i) {
      c.fillStyle = 'rgba(255,255,255,.75)';
      c.fillText(t, x + 1, y + i * 13 + 1);
      c.fillStyle = 'rgba(0,0,0,.85)';
      c.fillText(t, x, y + i * 13);
    });
    return cv;
  };

  /* ------------------------------------------------------------------
     O FILME VIRA FONTE DO LABORATÓRIO
     O mesmo caminho do FRAME da câmera (`media.js/camGrab`): uma
     imagem registrada em `VE.sources`, que a linha do tempo já sabe
     usar. Nada de exportador próprio nem de formato novo.           */
  M.paraFonte = function () {
    var e = M.est; if (!e) return null;
    var pronto = M.comFicha();
    var cv = document.createElement('canvas');
    cv.width = pronto.width; cv.height = pronto.height;
    cv.getContext('2d').drawImage(pronto, 0, 0);
    return VE.media.register({
      kind: 'image', name: 'MESA ' + new Date().toLocaleTimeString('pt-BR'),
      el: cv, w: cv.width, h: cv.height, duration: 0
    });
  };

  /* baixar como PNG — o "exportar arte" da referência */
  M.baixar = function () {
    var pronto = M.comFicha(); if (!pronto) return;
    pronto.toBlob(function (b) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'rgb_lab-mesa-' + Date.now() + '.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, 'image/png');
  };

})(window.VE);
