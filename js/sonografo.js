/* ============================================================
   rgb_lab — O SONÓGRAFO · o motor
   ------------------------------------------------------------
   O "music scanner": uma LINHA PARADA sobre o vídeo. Ela não anda.
   Quem anda é a imagem — e cada coisa que atravessa a linha vira
   nota. É exatamente a leitora óptica de um projetor de cinema:
   uma fenda fixa, o filme correndo, e o que passa por ali sai
   como som.

       vídeo → linha fixa → o que cruza → sensor → nota → som

   POR QUE ISTO É UM MOTOR SEM TELA
   Mesma divisão de mesa/mesaui, comp/compui, tinta/tintaui: aqui
   não há nenhum `document.getElementById`. Este arquivo lê pixel,
   decide o que é evento e devolve nota. Quem desenha é
   `js/sonografoui.js`.

   O QUE ELE LÊ, E O QUE NÃO LÊ (§19 do pedido)
   Não se analisa o quadro inteiro. Só uma BANDA fina em volta da
   linha, reamostrada para 64 células × 6 amostras = 384 pixels por
   quadro, qualquer que seja a resolução da fonte. Um vídeo 4K custa
   o mesmo que um 480p.

   A banda é lida por TRANSFORMAÇÃO, não por recorte: a matriz leva
   o retângulo orientado da linha direto para o canvas de leitura.
   É isso que faz a DIAGONAL custar o mesmo que a vertical — sem
   ela, diagonal viraria varredura pixel a pixel em JavaScript.

   COMO SE EVITA O DILÚVIO DE NOTAS
   Três freios, e nenhum deles é opcional:
     · LIMIAR com histerese — nasce em `limiar`, morre em 55 % dele,
       para que tremor em volta do limite não pique a nota em vinte;
     · REFRATÁRIO por célula — a mesma célula tem um tempo mínimo
       entre uma nota e a seguinte;
     · TETO POR QUADRO — só as N células mais ativas viram nota; o
       resto do quadro é descartado, não enfileirado.
   Sem os três, um vídeo de folhagem ao vento gera mil notas por
   segundo e o resultado é ruído branco com piano por cima.

   A NOTA VIVA
   Nota nasce quando a célula acende e só fecha quando ela apaga —
   a duração é o TEMPO REAL DE TRAVESSIA do objeto pela linha, que
   é o que o pedido descreve. Enquanto está viva ela cresce, e é
   por isso que o piano roll a mostra esticando.
   ============================================================ */
(function (VE) {
  'use strict';

  var L = VE.sonografo = {};

  /* Quantas células ao longo da linha, e quantas amostras através
     dela. 64 é o número em que a nota ainda tem endereço claro na
     imagem: com 128 duas células caem na mesma nota depois da
     quantização e o custo dobra à toa.                            */
  var CEL = 64;
  var LARG = 6;
  L.CEL = CEL;

  /* ══════════════════════ O NÚCLEO É COMPARTILHADO ════════════
     Escalas, vozes, síntese, .mid e renderização moram em
     `js/musica.js` desde que apareceu o segundo instrumento. Aqui
     ficam só APELIDOS, e eles existem por um motivo concreto: o
     resto do sonógrafo — e as medições que o provaram — chamam
     `L.tocar`, `L.VOZES`, `L.nomeNota`. Mudar esses nomes de
     lugar seria reescrever código verificado para não ganhar nada.

     O que é DAQUI e não sobe para o núcleo: o detector, a geometria
     da linha e o quarteto de matiz. São do scanner, não da música. */
  var MU = VE.musica;
  L.ESCALAS  = MU.ESCALAS;
  L.NOMES    = MU.NOMES;
  L.escalaDe = MU.escalaDe;
  L.quantizar= MU.quantizar;
  L.nomeNota = MU.nomeNota;
  L.freq     = MU.freq;
  L.VOZES    = MU.VOZES;
  L.vozDe    = MU.vozDe;
  L.tocar    = MU.tocar;


  /* O quarteto do "matiz decide": vermelho percute, verde é madeira,
     azul é eletrônico, magenta é corda esfregada. A ordem é a do
     círculo de matiz, para que a passagem de uma cor à vizinha seja
     também uma passagem de timbre vizinho.                        */
  L.QUARTETO = ['percussao', 'marimba', 'sintetizador', 'cordas'];

  /* Qual voz toca a nota. É do sonógrafo e não do núcleo porque
     depende do MAPEAMENTO daqui: com "o matiz decide", a cor da
     coisa que cruzou a linha escolhe o timbre. Usada nos três
     lugares que produzem som — o ao vivo, o .mid e o render — e é
     por isso que os três soam igual.                             */
  L.vozDoCanal = function (est, canal) {
    return est.mapa.inst === 0 ? L.QUARTETO[canal & 3] : est.vozId;
  };

  /* ══════════════════════════════════ ESTADO ═══════════════════ */
  L.novoEstado = function () {
    var est = {
      fonte: null,               /* {el, nome, kind, w, h, dur} */
      linha: { orient: 0, pos: .5, ang: 0, comp: 1 },
      sensores: { luz: true, cor: false, mov: false, borda: false },
      mapa: { pitch: 0, dur: 0, vel: 0, inst: 1 },
      escala: 'menor', tom: 9, notaMin: 24, notaMax: 72,
      sens: .60, densidade: .55, suav: .45,
      bpm: 120, grade: 0, velBase: .80, vozId: 'piano',
      gravando: true, laco: false, taxa: 1, somDaFonte: false,
      varreDur: 8,               /* modo imagem: segundos de varredura */
      notas: [], t: 0, ultimoT: -1, cel: null
    };
    zerarCelulas(est);
    return est;
  };

  function zerarCelulas(est) {
    var a = new Array(CEL);
    for (var i = 0; i < CEL; i++) {
      a[i] = { luz: 0, luzS: 0, luzAnt: 0, fundo: 0, hue: 0, hueF: 0, sat: 0,
               mov: 0, borda: 0, at: 0, viva: null, ultimo: -9, recup: -9, pronta: false };
    }
    est.cel = a;
  }

  L.limpar = function (est) {
    est.notas = [];
    zerarCelulas(est);
    est.ultimoT = -1;
    est._posAnt = null;
  };

  /* ═════════════════════════ GEOMETRIA DA LINHA ════════════════
     Devolve tudo em PIXEL DA FONTE: centro, ângulo, comprimento e
     espessura da banda. A tela nunca entra nesta conta — quem
     desenha converte depois. Assim o resultado não muda quando a
     janela muda de tamanho.

     A célula 0 é sempre a ponta DE CIMA da linha (à esquerda, na
     horizontal). É o que permite dizer "topo = agudo" sem um `if`
     por orientação espalhado pelo resto do código.               */
  L.geometria = function (est, W, H) {
    var lin = est.linha, p = lin.pos, ang, cx, cy, comp;
    if (lin.orient === 0) { ang = Math.PI / 2; cx = p * W; cy = H / 2; comp = H; }
    else if (lin.orient === 1) { ang = 0; cx = W / 2; cy = p * H; comp = W; }
    else {
      ang = (lin.orient === 2 ? 3 * Math.PI / 4 : Math.PI / 4) + lin.ang;
      var dx = Math.cos(ang), dy = Math.sin(ang);
      var nx = -dy, ny = dx;
      var E = Math.abs(W * nx) + Math.abs(H * ny);
      cx = W / 2 + nx * (p - .5) * E;
      cy = H / 2 + ny * (p - .5) * E;
      comp = (Math.abs(W * dx) + Math.abs(H * dy)) * lin.comp;
    }
    return { ang: ang, cx: cx, cy: cy, comp: Math.max(8, comp),
             banda: Math.max(3, Math.min(W, H) / 120) };
  };

  /* A conta inversa: onde o dedo está → que posição de linha é essa.
     Sem ela o arrasto teria de ser um caso por orientação.        */
  L.posDoPonto = function (est, W, H, px, py) {
    var lin = est.linha;
    if (lin.orient === 0) return Math.max(0, Math.min(1, px / W));
    if (lin.orient === 1) return Math.max(0, Math.min(1, py / H));
    var ang = (lin.orient === 2 ? 3 * Math.PI / 4 : Math.PI / 4) + lin.ang;
    var nx = -Math.sin(ang), ny = Math.cos(ang);
    var E = Math.abs(W * nx) + Math.abs(H * ny);
    var d = (px - W / 2) * nx + (py - H / 2) * ny;
    return Math.max(0, Math.min(1, .5 + d / E));
  };

  L.tamanho = function (est) {
    var f = est.fonte;
    if (!f || !f.el) return { w: 0, h: 0 };
    var e = f.el;
    return { w: e.videoWidth || e.naturalWidth || e.width || f.w || 0,
             h: e.videoHeight || e.naturalHeight || e.height || f.h || 0 };
  };

  /* ═══════════════════════════ A LEITURA DA BANDA ══════════════
     A matriz leva o retângulo ORIENTADO da linha (comprimento ao
     longo dela, espessura através dela) para o canvas 6×64. Ela é
     escrita à mão porque `setTransform` é a única forma de fazer o
     navegador reamostrar uma faixa girada de graça, na GPU.

       x_canvas = (LARG/banda) · ( (p−c)·n + banda/2 )
       y_canvas = (CEL/comp)   · ( (p−c)·d + comp/2  )

     com d = (cos a, sen a) ao longo da linha e n = (−sen a, cos a)
     através dela. O que sobra fora do quadro fica preto — constante,
     e portanto sem atividade nenhuma, que é o comportamento certo. */
  function lerBanda(est, W, H) {
    var cv = est._cv;
    if (!cv) { cv = est._cv = document.createElement('canvas'); cv.width = LARG; cv.height = CEL; }
    var g = est._g;
    if (!g) g = est._g = cv.getContext('2d', { willReadFrequently: true });
    var G = L.geometria(est, W, H);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#000';
    g.fillRect(0, 0, LARG, CEL);
    var s = Math.sin(G.ang), c = Math.cos(G.ang);
    var kx = LARG / G.banda, ky = CEL / G.comp;
    g.setTransform(kx * (-s), ky * c, kx * c, ky * s,
                   kx * (G.cx * s - G.cy * c + G.banda / 2),
                   ky * (-G.cx * c - G.cy * s + G.comp / 2));
    try { g.drawImage(est.fonte.el, 0, 0, W, H); }
    catch (e) { g.setTransform(1, 0, 0, 1, 0, 0); return null; }
    g.setTransform(1, 0, 0, 1, 0, 0);
    try { return g.getImageData(0, 0, LARG, CEL).data; }
    catch (e) { return null; }
  }

  /* matiz e saturação sem tabela: o suficiente para separar cor de
     cor, que é tudo que o mapeamento precisa                      */
  function matiz(r, v, b) {
    var mx = Math.max(r, v, b), mn = Math.min(r, v, b), d = mx - mn;
    if (d < 1e-4) return { h: 0, s: 0 };
    var h;
    if (mx === r) h = ((v - b) / d + 6) % 6;
    else if (mx === v) h = (b - r) / d + 2;
    else h = (r - v) / d + 4;
    return { h: h / 6, s: d / Math.max(mx, 1e-4) };
  }

  function distMatiz(a, b) {
    var d = Math.abs(a - b);
    return d > .5 ? 1 - d : d;
  }

  /* ═══════════════════════════ UM PASSO DO SCAN ════════════════
     Chamado uma vez por quadro com o tempo do vídeo. Devolve as
     notas que NASCERAM neste passo (a interface as toca) — as que
     morreram já foram fechadas dentro de `est.notas`.            */
  L.passo = function (est, t) {
    if (!est.fonte || !est.fonte.el) return [];
    var tam = L.tamanho(est);
    if (!tam.w || !tam.h) return [];

    /* voltar no tempo (rebobinar, laço) apaga a memória dos
       sensores: sem isso a primeira volta do laço dispara o quadro
       inteiro de uma vez, porque tudo mudou "de repente"          */
    var dt = t - est.ultimoT;
    if (est.ultimoT < 0 || dt < 0 || dt > 1.5) {
      for (var z = 0; z < CEL; z++) {
        est.cel[z].pronta = false;
        /* os dois relógios da célula são ABSOLUTOS, no tempo do vídeo:
           rebobinar sem zerá-los deixa a célula cega até o ponto de
           onde ela veio, e a primeira volta do laço sai muda        */
        est.cel[z].recup = -9;
        est.cel[z].ultimo = -9;
      }
      dt = 0;
    }
    est.ultimoT = t;
    est.t = t;

    var dados = lerBanda(est, tam.w, tam.h);
    if (!dados) return [];

    var cel = est.cel, i, k;
    var kSuav = 1 - est.suav * .85;          /* mais suavização = resposta mais lenta */
    /* O FUNDO É A MEMÓRIA DO QUE ESTAVA ALI ANTES, e ele CONGELA
       enquanto há evento. Os dois números abaixo foram medidos, não
       escolhidos, e cada um conserta um defeito visto na medida:

       1. Fundo rápido demais (0,1/quadro, ~0,4 s) alcançava o objeto
          NO MEIO da travessia: a nota fechava, a saída do objeto
          abria outra, e uma passagem de carro virava duas notas com
          duração mentirosa. Pior, invertia o botão de SENSIBILIDADE
          — medido: 42 notas no padrão contra 21 no "muito sensível".

       2. Só desacelerar não resolve, e isso também foi medido: o
          fundo sobe um pouco durante a travessia e, quando o objeto
          sai, a diferença que sobra mantém a nota aberta. Uma
          travessia de 0,4 s soava por 1,77 s.

       A correção é congelar: célula com nota viva (ou ainda acima do
       limiar de desligar) mal atualiza o fundo — 5 % do passo. Aí,
       quando o objeto sai, a célula volta EXATAMENTE ao valor que o
       fundo guardou, a atividade cai a zero e a nota fecha na hora.
       Os 5 % que sobram não são zero de propósito: uma mudança
       PERMANENTE (um corte de cena) precisa ser absorvida em uns dez
       segundos, senão a linha inteira fica presa acesa para sempre. */
    var kFundo = .02 + (1 - est.suav) * .06;

    /* QUANDO É A LINHA QUE ANDA, O FUNDO NÃO PODE CONGELAR.
       Todo o raciocínio acima supõe uma linha PARADA: o fundo é a
       memória do que estava naquele lugar antes. No modo imagem (§18)
       — e também quando a mão arrasta a linha sobre o vídeo — o lugar
       muda a cada quadro, e "antes" passa a ser outro pedaço da
       imagem. Aí congelar trava tudo: medido numa varredura de 2 s
       sobre uma imagem listrada, saíram QUATRO notas no total, porque
       as células abriam na primeira leitura e ficavam vivas para
       sempre, cada uma segurando o próprio fundo.

       Com a linha andando, a referência certa é o quadro anterior, e
       não a memória longa. É o que este passo rápido faz.          */
    var andou = est._posAnt == null ? 0 : Math.abs(est.linha.pos - est._posAnt);
    est._posAnt = est.linha.pos;
    var linhaAndando = andou > 1e-4;

    /* --- 1. medida: cor média de cada célula --- */
    for (i = 0; i < CEL; i++) {
      var r = 0, v = 0, b = 0, o = i * LARG * 4;
      for (k = 0; k < LARG; k++) { r += dados[o + k * 4]; v += dados[o + k * 4 + 1]; b += dados[o + k * 4 + 2]; }
      r /= LARG * 255; v /= LARG * 255; b /= LARG * 255;
      var c = cel[i];
      var lz = .2126 * r + .7152 * v + .0722 * b;
      var hs = matiz(r, v, b);
      c.luzAnt = c.luzS;
      if (!c.pronta) { c.luzS = lz; c.fundo = lz; c.luzAnt = lz; c.hueF = hs.h; c.pronta = true; }
      else c.luzS += (lz - c.luzS) * kSuav;
      c.luz = lz; c.hue = hs.h; c.sat = hs.s;
      c.mov = Math.abs(c.luzS - c.luzAnt);
    }

    /* --- 2. atividade: cada sensor ligado tem voto, e o maior vence --- */
    var S = est.sensores;
    for (i = 0; i < CEL; i++) {
      var cc = cel[i], a = 0;
      if (S.luz) a = Math.max(a, Math.abs(cc.luzS - cc.fundo));
      if (S.mov) a = Math.max(a, cc.mov * 7);
      if (S.cor) a = Math.max(a, distMatiz(cc.hue, cc.hueF) * 2 * Math.min(1, cc.sat * 2.2));
      if (S.borda) {
        var esq = cel[Math.max(0, i - 1)].luzS, dir = cel[Math.min(CEL - 1, i + 1)].luzS;
        cc.borda = Math.abs(dir - esq) * .5;
        a = Math.max(a, cc.borda * (cc.mov * 14 + .25));
      }
      cc.at = a;
    }

    /* --- 3. eventos, com os três freios --- */
    var limiar = .012 + (1 - est.sens) * (1 - est.sens) * .42;
    /* O LIMIAR DE DESLIGAR TEM PISO, e o piso não é enfeite: no topo
       da sensibilidade o limiar de ligar vale 0,013 e a metade dele é
       menos do que o resíduo que sobra depois do objeto sair (a
       suavização leva uns dez quadros para voltar ao fundo). Sem
       piso, a nota ficava presa nesse resíduo — medido: travessia de
       0,4 s soando 1,70 s, e o número de notas dobrando de novo. */
    var desliga = Math.max(.018, limiar * .55);
    /* Teto de duração. Acima disto não é mais travessia, é drone —
       e quem chega no teto ganha o fundo REZERADO (ver adiante).  */
    var TETO_DUR = 3;
    var refrat = .30 - est.densidade * .245;
    var teto = 1 + Math.round(est.densidade * 6);
    var novas = [];
    var candidatas = [];

    for (i = 0; i < CEL; i++) {
      var e = cel[i];
      if (e.viva) {
        /* nota viva: cresce, e só morre com histerese                */
        e.viva.dur = Math.max(.04, t - e.viva.t0);
        /* fecha por atividade que caiu, ou por teto: passou do teto
           não é mais travessia, é o mundo que MUDOU e ficou assim —
           um corte de cena, a luz que acendeu                       */
        if (e.at < desliga || e.viva.dur > TETO_DUR) fecharNota(est, e, t);
        continue;
      }
      if (e.at > limiar && t > e.recup && (t - e.ultimo) > refrat) candidatas.push(i);
    }
    /* teto por quadro: as mais ativas primeiro, o resto some       */
    candidatas.sort(function (x, y) { return cel[y].at - cel[x].at; });
    for (k = 0; k < candidatas.length && novas.length < teto; k++) {
      var n = abrirNota(est, candidatas[k], t, limiar);
      if (n) novas.push(n);
    }

    /* --- 4. o fundo persegue, sempre depois de decidir ---
       O matiz é um CÍRCULO: perseguir 0,02 a partir de 0,98 pelo
       caminho reto faz o fundo atravessar o disco inteiro e o sensor
       de cor dispara sozinho na passagem do vermelho. Daí a correção
       de meia volta antes de andar.                                */
    for (i = 0; i < CEL; i++) {
      var cf = cel[i];
      /* três marchas: congelado durante o evento (o fundo é a memória
         do ANTES, e o evento não pode reescrevê-la), depressa na
         recuperação (é justamente quando ele TEM de reaprender o
         repouso), e no passo normal no resto do tempo             */
      var kc = linhaAndando ? .40
             : cf.viva ? kFundo * .05
             : (t < cf.recup ? .5
             : (cf.at > desliga ? kFundo * .05 : kFundo));
      cf.fundo += (cf.luzS - cf.fundo) * kc;
      var dh = cf.hue - cf.hueF;
      if (dh > .5) dh -= 1; else if (dh < -.5) dh += 1;
      cf.hueF = (cf.hueF + dh * kc + 1) % 1;
    }
    return novas;
  };

  /* A grade musical só age sobre o INÍCIO gravado, nunca sobre o som
     ao vivo: encaixar o disparo na grade exigiria tocar depois do
     tempo, e a coisa toda existe para que o som saia NO instante em
     que o objeto cruza a linha. Ao vivo soa quando cruza; no piano
     roll, no .mid e no áudio renderizado, encaixa na grade.       */
  /* Quanto tempo a célula fica cega depois de fechar uma nota, para o
     transiente assentar. 0,22 s é folga de sobra para a suavização
     mais lenta (0,15 por quadro ≈ 0,2 s) e ainda deixa passar
     travessias rápidas seguidas — a mais curta que o motor produz é
     de 0,06 s.                                                     */
  var RECUP = .22;

  var GRADES = [0, 4, 8, 16, 2];   /* livre, 1/4, 1/8, 1/16, 1/2 */
  L.GRADES_NOME = ['Livre', '1/4', '1/8', '1/16', '1/2'];
  function naGrade(est, t) {
    var g = GRADES[est.grade | 0] || 0;
    if (!g) return t;
    var passo = (60 / est.bpm) * (4 / g);
    return Math.round(t / passo) * passo;
  }
  L.naGrade = naGrade;

  function abrirNota(est, i, t, limiar) {
    var c = est.cel[i], m = est.mapa;
    var u = 1 - i / (CEL - 1);                    /* topo da linha = 1 */
    if (est.linha.orient === 1) u = i / (CEL - 1); /* horizontal: esquerda = grave */

    var x;
    if (m.pitch === 1) x = c.luzS;
    else if (m.pitch === 2) x = c.hue;
    else if (m.pitch === 3) x = Math.min(1, c.mov * 9);
    else x = u;
    var nota = L.quantizar(est.notaMin + x * (est.notaMax - est.notaMin), est.escala, est.tom);

    var vx;
    if (m.vel === 1) vx = Math.min(1, c.at / Math.max(limiar * 3, .04));
    else if (m.vel === 2) vx = Math.min(1, c.mov * 9);
    else vx = c.luzS;
    var vel = Math.max(.08, Math.min(1, (.20 + vx * .80) * est.velBase));

    var canal = 0;
    if (m.inst === 0) canal = Math.max(0, Math.min(3, Math.floor(((c.hue + .0625) % 1) * 4)));

    var n = { t: naGrade(est, t), t0: t, dur: .12, nota: nota, vel: vel,
              canal: canal, cel: i, viva: true };
    if (est.gravando) { est.notas.push(n); c.viva = n; }
    else { c.viva = n; }
    c.ultimo = t;
    return n;
  }

  function fecharNota(est, c, t) {
    var n = c.viva;
    c.viva = null;
    /* AO FECHAR, A CÉLULA ENTRA EM RECUPERAÇÃO — e esta é a peça que
       conserta um travamento que só a medida pega, um laço fechado:
       depois da travessia sobrava um resíduo de ~0,025 entre a célula
       e o fundo (o fundo subiu um pouco durante o evento); com a
       sensibilidade alta esse resíduo passava do limiar e ABRIA uma
       segunda nota; a segunda nota congelava o fundo de novo; e o
       fundo congelado preservava o resíduo que a sustentava. A nota
       fantasma só morria no teto. Medido na célula 30, sensibilidade
       95: travessia de 0,43 s seguida de um fantasma de 1,80 s.

       Não bastou copiar o valor de agora para o fundo: no instante do
       fecho a célula ainda está CAINDO (medido: 0,096 a caminho de
       0,064), e copiar no meio da queda deixa resíduo igual. Por isso
       é uma janela, não um instante — por RECUP segundos a célula não
       pode disparar e o fundo persegue depressa. Quando ela sai da
       recuperação, o repouso já assentou e o fundo É ele.          */
    c.recup = t + RECUP;
    if (!n) return;
    n.viva = false;
    var m = est.mapa;
    if (m.dur === 2) n.dur = .25;                     /* fixa */
    else if (m.dur === 1) n.dur = Math.max(.08, Math.min(2, n.dur * 1.0));
    else n.dur = Math.max(.06, Math.min(6, t - n.t0)); /* travessia real */
    var g = GRADES[est.grade | 0] || 0;
    if (g) {
      var passo = (60 / est.bpm) * (4 / g);
      n.dur = Math.max(passo, Math.round(n.dur / passo) * passo);
    }
  }
  L.fecharTodas = function (est, t) {
    for (var i = 0; i < CEL; i++) if (est.cel[i].viva) fecharNota(est, est.cel[i], t);
  };
  /* ══════════════════════ AS DUAS SAÍDAS ══════════════════════
     O núcleo escreve .mid e renderiza áudio a partir de uma LISTA
     DE NOTAS. O que é do sonógrafo é só dizer qual voz toca cada
     uma — que aqui depende do matiz, quando o mapeamento manda. */
  L.midi = function (est) {
    return MU.midi(est.notas, {
      bpm: est.bpm, etiqueta: 'rgb_lab sonografo',
      voz: function (n) { return L.vozDoCanal(est, n.canal); }
    });
  };
  L.render = function (est) {
    return MU.render(est.notas, {
      voz: function (n) { return L.vozDoCanal(est, n.canal); }
    });
  };

})(window.VE);
