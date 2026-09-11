/* ============================================================
   rgb_lab — A CÂMERA POLAROID · a tela
   ------------------------------------------------------------
   NÃO HÁ JANELA. Há uma câmera flutuando num palco escuro, e
   **fora a telinha de ajustes, todo comando é uma peça da máquina**:

     lente ............ por onde a imagem entra → CARREGA a foto
                        (dois cliques: pega o clipe da linha do tempo)
     disparador ....... dispara → a foto sai e FICA PENDURADA
     barra do flash ... flash → estoura a luz do disparo
     botão esquerdo ... a roda claro/escuro → arrasta em volta dele
     botão direito .... EDITAR → a telinha se desdobra para o lado
     faixa arco-íris .. a marca do filme → clique troca o filme
     porta do filme ... por onde se carrega o pacote → abre a câmara e
                        leva à página PAPEL, que é o que o pacote decide
     plaqueta ......... o modelo → filme, papel e foto, ao passar o rato
     fenda ............ por onde a foto sai → e onde se larga arquivo
     A FOTO PENDURADA . passe o rato: baixar PNG e usar na linha do
                        tempo. Arraste para reenquadrar, roda para
                        aproximar. As anteriores ficam atrás dela.

   OS DOIS BOTÕES ONDE HAVIA UM
   O 3D original traz UM botão redondo à direita da lente — o olho
   elétrico. O Bruno pediu dois ali, um menor que o outro para caberem.
   Não dava para "encolher" um desenho que é imagem: então a chapa é
   REMENDADA naquele ponto (o corpo é liso e de uma cor só ali, medido:
   rgb(224,224,201) constante em toda a faixa) e os dois botões nascem
   em CSS, com o mesmo material do original — centro escuro, aro
   claro, sombra por baixo, tudo lido dos pixels dele.

   O RECORTE
   `assets/polaroid/camera.png` aparece TRÊS vezes, partida nas alturas
   medidas dentro do próprio arquivo: corpo (0→66,92%), porta
   (66,92→87,61%) e base (87,61→100%). A foto fica ENTRE a base e o
   corpo — some por trás da máquina, aparece na fenda e passa por cima
   do lábio, que é como um polaroid sai de verdade.
   ============================================================ */
(function (VE) {
  'use strict';

  var U = VE.polaroidui = {};
  var P = null;                    /* VE.polaroid, resolvido na abertura */

  /* ------------------------------------------------------------------
     GEOMETRIA MEDIDA — fração da imagem da câmera (798×662)
     px originais no comentário, para conferência                    */
  var GEO = {
    lente:      { x: .3847, y: .0740, w: .2519, h: .3127 },  /* 307, 49,201,207 */
    disparador: { x: .1554, y: .3248, w: .1053, h: .1254 },  /* 124,215, 84, 83 */
    flash:      { x: .7544, y: .0619, w: .1529, h: .1828 },  /* 602, 41,122,121 */
    arcoiris:   { x: .4662, y: .3988, w: .1090, h: .2704 },  /* 372,264, 87,179 */
    plaqueta:   { x: .1065, y: .0604, w: .2055, h: .2266 },  /* a placa Supercolor */
    porta:      { x: .0000, y: .6692, w: 1.000, h: .2069 },  /* do vinco à fenda */
    fenda:      { x: .0789, y: .8761, w: .8434, h: .0665 },  /*  63,580,673, 44 */
    /* o remendo cobre o olho elétrico original (578..660 × 226..308) e
       a sombra dele; o corpo em volta é liso — 224,224,201 constante */
    remendo:    { x: .6867, y: .3051, w: .1804, h: .1964 },  /* 548,202,144,130 */
    expo:       { x: .7043, y: .3474, w: .0952, h: .1148 },  /* 562,230, 76, 76 */
    editar:     { x: .8296, y: .3474, w: .0952, h: .1148 }   /* 662,230, 76, 76 */
  };
  var CORTE_PORTA = GEO.porta.y;    /* 66,92% */
  var CORTE_FENDA = GEO.fenda.y;    /* 87,61% */

  /* Quanto da folha fica PARA FORA quando ela pendura. É este número
     que decide o tamanho da câmera, porque o conjunto inteiro mede
     1,662 vez a largura dela e a tela é o que é. Foi a 0,70 até o
     Bruno pedir a foto "praticamente visível ao sair": em 0,90 a
     janela da emulsão inteira e quase toda a tarja aparecem. Quem
     mexer aqui mexe também em `--larg`, no `margin-bottom` de
     `.pol-cam.com-folha` e no `bottom` da calha. */
  var PENDURA = .90;

  var est = null;

  function el(id) { return document.getElementById(id); }
  function estilo(n, g) {
    n.style.left = (g.x * 100) + '%'; n.style.top = (g.y * 100) + '%';
    n.style.width = (g.w * 100) + '%'; n.style.height = (g.h * 100) + '%';
  }

  /* ==================================================================
     ABRIR / FECHAR                                                  */
  U.abrir = function () {
    P = VE.polaroid;
    if (!P) { VE.app.toast('o motor do polaroid não carregou', 'err'); return; }
    montar();
    if (!est) {
      est = {
        cfg: P.novaCfg(), foto: null, fotoNome: '', molduraImg: null,
        pilha: [], pendente: 0, disparando: 0, pendurada: 0,
        aba: null, ultima: 'filme'
      };
      P.carregarPastas().then(function () {
        if (!P.moldura(est.cfg.moldura)) est.cfg.moldura = P.molduras[0].id;
        trocarMoldura(est.cfg.moldura);
        pintarTela();
      });
      trocarMoldura(est.cfg.moldura);
    }
    el('polPalco').classList.remove('hidden');
    pintarTudo();
    if (!est.foto) daLinhaDoTempo(true);
  };

  U.fechar = function () {
    var m = el('polPalco');
    if (m) { m.classList.add('hidden'); m.classList.remove('com-tela'); }
    var c = el('polCam');
    if (c) { c.classList.remove('com-tela', 'porta-aberta'); }
  };

  /* a porta pública: qualquer parte do laboratório pode pôr uma imagem
     na lente sem passar pelo seletor de arquivo */
  U.carregar = function (img, nome) { if (est) porFoto(img, nome); };
  U.disparar = function () { if (est) disparar(); };

  /* ==================================================================
     DE ONDE VEM A FOTO                                              */
  function daLinhaDoTempo(silencioso) {
    if (!VE.project) { if (!silencioso) VE.app.toast('não há composição aberta', 'err'); return false; }
    var c = VE.selected && VE.selected();
    var s = c && c.src && VE.sources ? VE.sources[c.src] : null;
    var e = s && (s.el || (VE.media.elFor ? VE.media.elFor(c.src) : null));
    if (!e) { if (!silencioso) VE.app.toast('escolha um clipe na linha do tempo primeiro', 'err'); return false; }
    if (s.kind === 'video' && !e.videoWidth) { if (!silencioso) VE.app.toast('o vídeo ainda não abriu', 'err'); return false; }
    /* de vídeo entra o QUADRO parado: um polaroid é um instante */
    if (s.kind === 'video') {
      var cv = document.createElement('canvas');
      cv.width = e.videoWidth; cv.height = e.videoHeight;
      cv.getContext('2d').drawImage(e, 0, 0);
      porFoto(cv, (s.name || 'CLIPE') + ' · quadro');
    } else porFoto(e, s.name || 'CLIPE');
    return true;
  }

  function pedirArquivo() {
    var i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*';
    i.onchange = function () { if (i.files[0]) lerArquivo(i.files[0]); };
    i.click();
  }

  function lerArquivo(f) {
    if (!f || f.type.indexOf('image/') !== 0) { VE.app.toast('a lente só aceita imagem', 'err'); return; }
    var img = new Image();
    img.onload = function () { porFoto(img, f.name); };
    img.onerror = function () { VE.app.toast('não consegui abrir ' + f.name, 'err'); };
    img.src = URL.createObjectURL(f);
  }

  function porFoto(img, nome) {
    est.foto = img;
    est.fotoNome = (nome || 'SEM NOME').replace(/\.[a-z0-9]+$/i, '');
    est.cfg.zoom = 1; est.cfg.dx = 0; est.cfg.dy = 0;
    pintarLente(); pintarPlaqueta();
    el('polCam').classList.add('carregada');
    redesenhar();
  }

  /* ==================================================================
     MONTAGEM                                                        */
  function montar() {
    if (el('polPalco')) return;

    var d = document.createElement('div');
    d.className = 'pol-palco hidden';
    d.id = 'polPalco';
    d.innerHTML =

      '<button class="pol-sair" id="polFechar" title="Fechar (Esc)">' +
        '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>' +

      '<div class="pol-conjunto">' +
        '<div class="pol-cam" id="polCam">' +
          '<div class="pol-piso"></div>' +
          '<div class="pol-camara"><b>FILME</b><span>O PAPEL VEM DAQUI</span></div>' +
          '<img class="pol-chapa pol-chapa-baixo" id="polChapaBaixo" alt="">' +

          /* a calha por onde a foto anda; o overflow dela é o que
             esconde a foto guardada dentro da máquina */
          '<div class="pol-tubo" id="polTubo">' +
            '<div class="pol-pilha" id="polPilha"></div>' +
            '<div class="pol-saindo" id="polSaindo">' +
              '<canvas id="polCv"></canvas>' +
              '<div class="pol-emulsao" id="polEmulsao"></div>' +
              '<div class="pol-acoes">' +
                '<button class="pol-a" id="polBaixar">BAIXAR PNG</button>' +
                '<button class="pol-a pol-a-forte" id="polUsar">USAR NA LINHA DO TEMPO</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<img class="pol-chapa pol-chapa-alto" id="polChapaAlto" alt="a câmera polaroid">' +

          /* o remendo do corpo, por cima da chapa e por baixo dos
             botões novos: é ele que apaga o olho elétrico original */
          '<div class="pol-remendo" id="polRemendo"></div>' +

          /* os pontos funcionais, todos por cima da chapa */
          '<button class="pol-h pol-lente" id="polLente">' +
            '<canvas id="polOlhoMagico"></canvas><i class="pol-brilho"></i>' +
            '<span class="pol-lente-alvo"><svg viewBox="0 0 24 24"><path d="M12 7v10M7 12h10"/></svg></span>' +
          '</button>' +
          '<button class="pol-h pol-disp" id="polDisp"><i></i></button>' +
          '<button class="pol-h pol-flash" id="polFlash"><i></i></button>' +

          '<button class="pol-h pol-bt pol-expo" id="polExpo">' +
            '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/>' +
            '<path d="M12 3.4v2.2M12 18.4v2.2M3.4 12h2.2M18.4 12h2.2M6 6l1.5 1.5M16.5 16.5L18 18M18 6l-1.5 1.5M7.5 16.5L6 18"/></svg>' +
            '<b></b></button>' +

          '<button class="pol-h pol-bt pol-editar" id="polEditar">' +
            '<svg viewBox="0 0 24 24"><path d="M4 8h11M18 8h2M4 16h5M12 16h8"/>' +
            '<circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/></svg></button>' +

          '<button class="pol-h pol-arco" id="polArco"><i></i></button>' +
          '<div class="pol-h pol-plaq" id="polPlaq"></div>' +
          '<button class="pol-h pol-porta" id="polPorta"><img id="polChapaPorta" alt="">' +
            '<span class="pol-porta-dica">PACOTE NOVO</span></button>' +
          '<div class="pol-h pol-fenda" id="polFenda"></div>' +

          /* ------------------------------------------- A TELINHA
             Presa por duas dobradiças na lateral da câmera. Fechada,
             fica dobrada ATRÁS dela; ao abrir, desdobra para o lado e
             vem para a frente. O desenho é o do laboratório —
             monoespaçada em caixa alta, filete fino, o azul do canal
             de vídeo no que está aberto. */
          '<div class="pol-dobra" id="polDobra"><i></i><i></i></div>' +
          '<div class="pol-tela" id="polTela">' +
            '<div class="pol-tela-h">' +
              '<span class="pol-led"></span>' +
              '<h4 id="polTelaTit">CONFIGURAÇÕES</h4>' +
              '<button class="pol-tela-x" id="polTelaFechar"></button>' +
            '</div>' +
            '<div class="pol-tela-pag" id="polPag"></div>' +
          '</div>' +

        '</div>' +
      '</div>';

    document.body.appendChild(d);

    /* O RECORTE — três faixas da MESMA chapa. A porta não é recortada
       por clip-path: ela GIRA, e clip-path não gira com o elemento.
       Ela é uma caixa com overflow e a chapa inteira dentro.      */
    var cAlto = el('polChapaAlto'), cBaixo = el('polChapaBaixo'), cPorta = el('polChapaPorta');
    cAlto.src = cBaixo.src = cPorta.src = 'assets/polaroid/camera.png';
    cAlto.style.clipPath = 'inset(0 0 ' + ((1 - CORTE_PORTA) * 100).toFixed(3) + '% 0)';
    cBaixo.style.clipPath = 'inset(' + (CORTE_FENDA * 100).toFixed(3) + '% 0 0 0)';
    var hPorta = CORTE_FENDA - CORTE_PORTA;
    cPorta.style.height = (100 / hPorta).toFixed(2) + '%';
    cPorta.style.top = (-CORTE_PORTA / hPorta * 100).toFixed(2) + '%';

    /* cada ponto funcional cai exatamente em cima da peça medida */
    estilo(el('polLente'), GEO.lente);
    estilo(el('polDisp'), GEO.disparador);
    estilo(el('polFlash'), GEO.flash);
    estilo(el('polRemendo'), GEO.remendo);
    estilo(el('polExpo'), GEO.expo);
    estilo(el('polEditar'), GEO.editar);
    estilo(el('polArco'), GEO.arcoiris);
    estilo(el('polPlaq'), GEO.plaqueta);
    estilo(el('polPorta'), GEO.porta);
    estilo(el('polFenda'), GEO.fenda);

    /* A CALHA é mais larga que a fenda de propósito. Ela precisa cortar
       PARA CIMA (o que está acima dela está dentro da máquina) e não
       para os lados — com a largura exata da fenda, as fotos anteriores,
       que ficam um pouco tortas atrás da da frente, eram decepadas na
       vertical pelo `overflow`. A folga lateral é FOLGA: `--pad` e
       `--folha` recolocam a folha no meio.                          */
    var PAD = .07;
    var largTubo = GEO.fenda.w + 2 * PAD;
    var t = el('polTubo');
    t.style.left = ((GEO.fenda.x - PAD) * 100) + '%';
    t.style.width = (largTubo * 100) + '%';
    t.style.top = (GEO.fenda.y * 100) + '%';
    t.style.setProperty('--pad', (PAD / largTubo * 100).toFixed(3) + '%');
    t.style.setProperty('--folha', (GEO.fenda.w / largTubo * 100).toFixed(3) + '%');

    /* A posição de repouso da foto pendurada sai do MESMO número que a
       animação usa — um só lugar decide o quanto ela fica de fora. Vai
       na CALHA, e não na foto, porque as anteriores (que são irmãs
       dela, não filhas) precisam herdar a mesma medida. */
    t.style.setProperty('--pendura', (-(1 - PENDURA) * 100).toFixed(1) + '%');

    ligar();
  }

  /* ==================================================================
     OS GESTOS — um por peça                                         */
  function ligar() {
    var cam = el('polCam');

    el('polFechar').addEventListener('click', U.fechar);
    el('polPalco').addEventListener('pointerdown', function (ev) {
      if (ev.target === el('polPalco')) U.fechar();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !el('polPalco').classList.contains('hidden')) U.fechar();
    });

    /* LENTE — é por onde a imagem entra. Um clique pede o arquivo;
       dois cliques pegam o clipe escolhido na linha do tempo.     */
    var lente = el('polLente'), toqueLente = null;
    lente.addEventListener('click', function () {
      if (toqueLente) return;
      toqueLente = setTimeout(function () { toqueLente = null; pedirArquivo(); }, 230);
    });
    lente.addEventListener('dblclick', function () {
      clearTimeout(toqueLente); toqueLente = null;
      daLinhaDoTempo(false);
    });

    /* a câmera inteira aceita arquivo largado — a fenda também é boca */
    ['dragenter', 'dragover'].forEach(function (n) {
      cam.addEventListener(n, function (ev) { ev.preventDefault(); cam.classList.add('recebendo'); });
    });
    ['dragleave', 'drop'].forEach(function (n) {
      cam.addEventListener(n, function (ev) { ev.preventDefault(); cam.classList.remove('recebendo'); });
    });
    cam.addEventListener('drop', function (ev) {
      var f = ev.dataTransfer && ev.dataTransfer.files[0];
      if (f) lerArquivo(f);
    });

    /* DISPARADOR */
    el('polDisp').addEventListener('click', disparar);

    /* FLASH */
    el('polFlash').addEventListener('click', function () {
      est.cfg.flash = est.cfg.flash ? 0 : 1;
      cam.classList.toggle('com-flash', !!est.cfg.flash);
      VE.app.toast(est.cfg.flash ? 'flash armado — a próxima foto sai estourada de luz' : 'flash desligado', 'ok');
      redesenhar();
    });

    /* BOTÃO ESQUERDO — a roda claro/escuro: arrasta em volta do centro */
    var expo = el('polExpo'), girando = null;
    expo.addEventListener('pointerdown', function (ev) {
      var r = expo.getBoundingClientRect();
      girando = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, a0: 0, v0: est.cfg.exposicao, mexeu: 0 };
      girando.a0 = Math.atan2(ev.clientY - girando.cy, ev.clientX - girando.cx);
      expo.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    expo.addEventListener('pointermove', function (ev) {
      if (!girando) return;
      var a = Math.atan2(ev.clientY - girando.cy, ev.clientX - girando.cx);
      var dd = a - girando.a0;
      while (dd > Math.PI) dd -= 2 * Math.PI;
      while (dd < -Math.PI) dd += 2 * Math.PI;
      girando.mexeu = 1;
      est.cfg.exposicao = Math.max(-1, Math.min(1, girando.v0 + dd / (Math.PI * .9)));
      pintarExpo(); redesenhar();
    });
    expo.addEventListener('pointerup', function () { girando = null; });
    expo.addEventListener('pointercancel', function () { girando = null; });
    expo.addEventListener('dblclick', function () { est.cfg.exposicao = 0; pintarExpo(); redesenhar(); });

    /* BOTÃO DIREITO — EDITAR: a telinha se desdobra para o lado */
    el('polEditar').addEventListener('click', alternarTela);
    el('polTelaFechar').addEventListener('click', function () {
      if (est.aba) { est.aba = null; pintarTela(); return; }   /* volta ao índice */
      fecharTela();
    });

    /* FAIXA ARCO-ÍRIS — o filme */
    el('polArco').addEventListener('click', function () {
      var i = 0;
      for (var k = 0; k < P.FILMES.length; k++) if (P.FILMES[k].id === est.cfg.filme) i = k;
      var f = P.FILMES[(i + 1) % P.FILMES.length];
      est.cfg.filme = f.id; est.cfg.filmeAmostrado = null;
      cam.classList.add('trocou-filme');
      setTimeout(function () { cam.classList.remove('trocou-filme'); }, 420);
      VE.app.toast('filme ' + f.nome + ' — ' + f.nota, 'ok');
      pintarPlaqueta(); pintarTela(); redesenhar();
    });

    /* PORTA DO FILME — é por ela que se carrega o pacote, e o pacote é
       que decide em QUE PAPEL a foto sai. Então ela abre, mostra a
       câmara, e leva direto à página PAPEL da telinha.

       Antes ela "punha um pacote novo de 8 poses": um contador que só
       servia para, de oito em oito fotos, obrigar a um clique. O Bruno
       perguntou para que servia; não servia para nada, e saiu inteiro. */
    el('polPorta').addEventListener('click', function () {
      cam.classList.add('porta-aberta');
      setTimeout(function () { cam.classList.remove('porta-aberta'); }, 1000);
      est.aba = est.ultima = 'papel';
      abrirTela();
    });

    /* A FOTO PENDURADA — arrastar reenquadra, roda aproxima */
    var pend = el('polSaindo'), mov = null;
    pend.addEventListener('pointerdown', function (ev) {
      if (!est.foto || !est.pendurada || ev.target.closest('button')) return;
      mov = { x: ev.clientX, y: ev.clientY, dx: est.cfg.dx, dy: est.cfg.dy, w: pend.offsetWidth };
      pend.setPointerCapture(ev.pointerId); pend.classList.add('arrastando');
    });
    pend.addEventListener('pointermove', function (ev) {
      if (!mov) return;
      est.cfg.dx = mov.dx + (ev.clientX - mov.x) / mov.w;
      est.cfg.dy = mov.dy + (ev.clientY - mov.y) / mov.w;
      redesenhar();
    });
    pend.addEventListener('pointerup', function () { mov = null; pend.classList.remove('arrastando'); });
    pend.addEventListener('wheel', function (ev) {
      if (!est.foto || !est.pendurada) return;
      ev.preventDefault();
      est.cfg.zoom = Math.max(.4, Math.min(4, est.cfg.zoom * (ev.deltaY < 0 ? 1.06 : 1 / 1.06)));
      redesenhar();
    }, { passive: false });

    /* AS DUAS SAÍDAS — na própria foto, porque é dela que se trata */
    el('polBaixar').addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (!est.pendurada) return;
      var t = P.tamanho(est.molduraImg);
      P.baixar(P.render(est.cfg, est.foto, est.molduraImg, 1),
               'rgb_lab-polaroid-' + (est.fotoNome || Date.now()));
      VE.app.toast('polaroid salvo em tamanho de folha (' + t.w + '×' + t.h + ')', 'ok');
    });

    el('polUsar').addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (!est.pendurada) return;
      var cv = P.render(est.cfg, est.foto, est.molduraImg, 1);
      var id = P.paraFonte(cv, 'POLAROID · ' + (est.fotoNome || ''));
      var s = VE.sources[id];
      var primeiro = !VE.project;
      VE.app.ensureProject(s.w, s.h, 10);
      if (primeiro) VE.setCanvas(s.w, s.h, 'src');
      VE.addMedia({ kind: 'image', name: s.name, src: id, dur: VE.duration(), fit: 'contain' });
      VE.pushHistory(); VE.emit('project'); VE.emit('sources');
      U.fechar();
      VE.shell.go('video');
      if (VE.view && VE.view.fit) VE.view.fit();
      VE.app.toast('o polaroid virou camada na linha do tempo', 'ok');
    });
  }

  /* ==================================================================
     O DISPARO
     A foto sai pela fenda e FICA PENDURADA nela. A que estava
     pendurada antes recua para trás, como um maço na mão.           */
  function disparar() {
    if (!est.foto) { VE.app.toast('a lente está vazia — clique nela e escolha uma foto', 'err'); return; }
    if (est.disparando) return;

    est.disparando = 1;
    var cam = el('polCam');
    cam.classList.add('disparando');
    setTimeout(function () { cam.classList.remove('disparando'); }, 220);

    if (est.pendurada) guardarNaPilha();

    var pend = el('polSaindo');
    est.pendurada = 1;
    pend.classList.add('tem');
    /* a câmera abre espaço embaixo de si no mesmo instante em que a
       folha começa a descer: ela sobe enquanto a foto desce */
    cam.classList.add('com-folha');
    redesenhar(true);

    pend.classList.remove('pendurada', 'saindo');
    void pend.offsetWidth;
    pend.classList.add('saindo');

    var emu = el('polEmulsao');
    emu.style.background = corDaEmulsao();
    emu.classList.remove('revelando');
    void emu.offsetWidth;

    setTimeout(function () {
      pend.classList.remove('saindo');
      pend.classList.add('pendurada');
      est.disparando = 0;
      /* a revelação começa quando a foto PARA de sair, não antes: a
         química só corre depois que a folha passou pelos roletes */
      emu.classList.add('revelando');
      pend.classList.remove('revelado'); void pend.offsetWidth;
      pend.classList.add('revelado');
    }, 1150);
  }

  function corDaEmulsao() {
    /* um polaroid não revela do branco: revela de um cinza esverdeado
       que é a cor do reagente antes de a imagem subir */
    return est.cfg.moldura === 'preta' ? '#161a17' : '#d9dcd2';
  }

  /* ------------------------------------------------------------------
     A PILHA — as anteriores continuam penduradas, atrás. Não é
     enfeite: é como se comparam duas revelações do mesmo quadro.   */
  function guardarNaPilha() {
    var mini = P.render(est.cfg, est.foto, est.molduraImg, .22);
    est.pilha.unshift({
      url: mini.toDataURL('image/jpeg', .84),
      cfg: JSON.parse(JSON.stringify(est.cfg)),
      nome: est.fotoNome
    });
    if (est.pilha.length > 3) est.pilha.pop();
    pintarPilha();
  }

  function pintarPilha() {
    var p = el('polPilha'); if (!p) return;
    p.innerHTML = est.pilha.map(function (f, i) {
      return '<button class="pol-atras" data-pol-atras="' + i + '" style="--i:' + (i + 1) + '"' +
        ' title="' + f.nome + ' — clique para voltar aos ajustes desta"><img src="' + f.url + '" alt=""></button>';
    }).join('');
    p.querySelectorAll('[data-pol-atras]').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var f = est.pilha[+b.dataset.polAtras];
        if (!f) return;
        est.cfg = JSON.parse(JSON.stringify(f.cfg));
        trocarMoldura(est.cfg.moldura);
        pintarTudo(); pintarTela();
        VE.app.toast('voltei aos ajustes de ' + f.nome, 'ok');
      });
    });
  }

  /* ==================================================================
     PINTURA DAS PEÇAS                                               */
  function pintarTudo() { pintarLente(); pintarExpo(); pintarPlaqueta(); pintarPilha(); redesenhar(); }

  /* a lente mostra o que ela está vendo — a foto, através do vidro */
  function pintarLente() {
    var c = el('polOlhoMagico'); if (!c) return;
    var n = 140; c.width = n; c.height = n;
    var x = c.getContext('2d');
    x.clearRect(0, 0, n, n);
    if (!est.foto) return;
    var fw = est.foto.naturalWidth || est.foto.width, fh = est.foto.naturalHeight || est.foto.height;
    if (!fw || !fh) return;
    var e = Math.max(n / fw, n / fh);
    x.save();
    x.beginPath(); x.arc(n / 2, n / 2, n / 2, 0, 7); x.clip();
    x.drawImage(est.foto, n / 2 - fw * e / 2, n / 2 - fh * e / 2, fw * e, fh * e);
    /* o vidro escurece e esverdeia o que passa por ele */
    x.fillStyle = 'rgba(18,30,24,.42)'; x.fillRect(0, 0, n, n);
    x.restore();
  }

  function pintarExpo() {
    var o = el('polExpo'); if (!o) return;
    o.querySelector('b').style.transform = 'rotate(' + (est.cfg.exposicao * 148).toFixed(1) + 'deg)';
    o.dataset.val = 'EXPOSIÇÃO ' + (est.cfg.exposicao > .02 ? '+' : '') + est.cfg.exposicao.toFixed(2);
    o.classList.toggle('mexido', Math.abs(est.cfg.exposicao) > .02);
  }

  /* A plaqueta NÃO escreve por cima da arte: o "Supercolor 1000" já
     está impresso ali. O contador aparece ao passar o rato.        */
  function pintarPlaqueta() {
    var f = est.cfg.filmeAmostrado || P.filme(est.cfg.filme);
    el('polPlaq').dataset.val = f.nome +
      ' · ' + (P.moldura(est.cfg.moldura).nome || '').toLowerCase() +
      (est.fotoNome ? ' · ' + est.fotoNome.slice(0, 16) : '');
    el('polArco').dataset.val = 'FILME ' + f.nome;
  }

  /* ==================================================================
     A FOTO
     Um redesenho por quadro, no máximo: mexer num controle deslizante
     dispara dezenas de eventos e o passe de pixel não é de graça.   */
  function redesenhar(agora) {
    if (agora) {
      /* `agora` desenha NESTE instante. A primeira versão agendava um
         quadro e em seguida cancelava o que tinha acabado de agendar —
         de modo que a revelação começava com a folha em branco. */
      if (est.pendente) { cancelAnimationFrame(est.pendente); est.pendente = 0; }
      pintarFoto();
      return;
    }
    if (est.pendente) return;
    est.pendente = requestAnimationFrame(function () { est.pendente = 0; pintarFoto(); });
  }

  function pintarFoto() {
    var cv = el('polCv'); if (!cv) return;
    var t = P.tamanho(est.molduraImg);
    /* resolução fixa e generosa: quem manda no tamanho na tela é o CSS */
    var e = 620 / t.w;
    cv.width = Math.round(t.w * e); cv.height = Math.round(t.h * e);
    if (est.foto) P.desenhar(cv, est.cfg, est.foto, est.molduraImg);
    else cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
  }

  function trocarMoldura(id) {
    est.cfg.moldura = id;
    P.carregarMoldura(id).then(function (r) { est.molduraImg = r.img; redesenhar(); });
  }

  /* ==================================================================
     A TELINHA
     Presa por duas dobradiças na lateral da câmera. Fechada, fica
     dobrada ATRÁS dela; ao abrir, desdobra e vem para a frente.

     Dois níveis, como no desenho do Bruno: um ÍNDICE de seis linhas
     (ícone, nome, seta) e a página de cada uma. O × do cabeçalho
     volta um nível de cada vez — só fecha a telinha quando já está
     no índice.                                                     */
  var ABAS = [
    { id: 'filme',   rot: 'FILME',
      ico: 'M4 6h16v12H4z M9.3 6v12 M14.7 6v12' },
    { id: 'ajuste',  rot: 'AJUSTES',
      ico: 'M4 7.5h9M17 7.5h3M4 16.5h4M12 16.5h8 M15 7.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0 M8 16.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0' },
    { id: 'legenda', rot: 'LEGENDA',
      ico: 'M5 7.5V5.5h14v2 M12 5.5v13 M9 18.5h6' },
    { id: 'quadro',  rot: 'QUADRO',
      ico: 'M4 4h16v16H4z M4 12h16 M12 4v16' },
    { id: 'papel',   rot: 'PAPEL',
      ico: 'M6.5 3.5h11v17h-11z M8.5 5.5h7v9h-7z' },
    { id: 'preset',  rot: 'PRESETS',
      ico: 'M12 3.6l2.2 5.6 6 .4-4.6 3.9 1.5 5.8-5.1-3.2-5.1 3.2 1.5-5.8-4.6-3.9 6-.4z' }
  ];

  function alternarTela() {
    if (el('polTela').classList.contains('aberta')) fecharTela();
    else abrirTela();
  }
  function abrirTela() {
    el('polTela').classList.add('aberta');
    el('polCam').classList.add('com-tela');
    el('polPalco').classList.add('com-tela');
    pintarTela();
  }
  function fecharTela() {
    el('polTela').classList.remove('aberta');
    el('polCam').classList.remove('com-tela');
    el('polPalco').classList.remove('com-tela');
  }

  function pintarTela() {
    var pag = el('polPag'); if (!pag) return;
    var atual = est.aba && ABAS.filter(function (a) { return a.id === est.aba; })[0];
    el('polTelaTit').textContent = atual ? atual.rot : 'CONFIGURAÇÕES';
    /* Ícone DESENHADO, não glifo de fonte: '✕' e '‹' saem de tamanhos e
       alturas de base diferentes em cada fonte, e era por isso que o
       símbolo aparecia pequeno num caso e torto no outro. */
    el('polTelaFechar').innerHTML = atual
      ? '<svg viewBox="0 0 24 24"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M6.8 6.8l10.4 10.4M17.2 6.8L6.8 17.2"/></svg>';
    el('polTelaFechar').title = atual ? 'voltar ao índice' : 'fechar';

    if (!atual) { pag.innerHTML = indice(); pag.classList.add('e-indice'); }
    else {
      pag.classList.remove('e-indice');
      pag.innerHTML = ({ filme: pagFilme, ajuste: pagAjuste, legenda: pagLegenda,
                         quadro: pagQuadro, papel: pagPapel, preset: pagPreset }[est.aba])();
    }
    ligarPagina();
  }

  /* O índice é o desenho que o Bruno mandou: ícone, nome e seta, e uma
     linha acesa. A acesa é a ÚLTIMA que ele abriu — assim a telinha
     lembra onde ele estava, em vez de acender uma qualquer. */
  function indice() {
    return '<div class="pol-lista">' + ABAS.map(function (a) {
      return '<button class="pol-linha' + (a.id === est.ultima ? ' on' : '') + '" data-pol-aba="' + a.id + '">' +
        '<svg viewBox="0 0 24 24"><path d="' + a.ico + '"/></svg>' +
        '<span>' + a.rot + '</span>' +
        '<em>›</em></button>';
    }).join('') + '</div>';
  }

  /* a linha de controle: rótulo, barra e caixa numérica */
  function desl(k, rot, min, max, passo, nota) {
    var v = est.cfg[k];
    return '<div class="pol-ctrl">' +
      '<label>' + rot + '</label>' +
      '<div class="pol-ctrl-l">' +
        '<input type="range" data-pol-r="' + k + '" min="' + min + '" max="' + max + '" step="' + passo + '" value="' + v + '">' +
        '<input class="pol-num" data-pol-n="' + k + '" value="' + v + '">' +
      '</div>' +
      (nota ? '<i>' + nota + '</i>' : '') +
      '</div>';
  }

  function pagFilme() {
    var atual = est.cfg.filmeAmostrado ? '__amostra' : est.cfg.filme;
    var h = '<div class="pol-cartoes">';
    P.FILMES.forEach(function (f) {
      h += '<button class="pol-cartao' + (f.id === atual ? ' on' : '') + '" data-pol-filme="' + f.id + '">' +
        '<i style="background:' + amostraCor(f) + '"></i>' +
        '<b>' + f.nome + '</b><span>' + f.nota + '</span></button>';
    });
    if (est.cfg.filmeAmostrado) {
      var a = est.cfg.filmeAmostrado;
      h += '<button class="pol-cartao on" data-pol-filme="__amostra"><i style="background:' + amostraCor(a) + '"></i>' +
        '<b>' + a.nome + '</b><span>' + a.nota + '</span></button>';
    }
    h += '</div>';

    h += '<div class="pol-sub">ORIGINAIS DA PASTA</div>' +
         '<p class="pol-nota">O laboratório LÊ a cor destes escaneamentos e monta um filme com a assinatura deles.</p>';
    if (!P.originais.length) {
      h += '<p class="pol-nota">Nada em <code>assets/polaroid/filmes/</code>.</p>';
    } else {
      h += '<div class="pol-orig">' + P.originais.map(function (o, i) {
        return '<button class="pol-o" data-pol-orig="' + i + '" title="amostrar ' + o.nome + '">' +
          '<img src="' + o.arquivo + '" alt=""><span>' + o.nome + '</span></button>';
      }).join('') + '</div>';
    }
    return h + '<div class="pol-rodape"><button class="pol-b" id="polAmostrarArq">AMOSTRAR ARQUIVO…</button></div>';
  }

  /* a bolinha de cada filme é a curva aplicada a um cinza médio:
     mostra a dominante DE VERDADE, e não uma cor escolhida à mão */
  function amostraCor(f) {
    var v = [0, 0, 0];
    for (var c = 0; c < 3; c++) {
      var x = Math.pow(.55, f.gama[c]) * f.ganho[c];
      x = f.lift[c] + (1 - f.lift[c]) * x;
      x = x * (1 + (f.temp || 0) * .16 * (c === 0 ? 1 : c === 1 ? .18 : -1));
      v[c] = Math.round(Math.max(0, Math.min(1, x)) * 255);
    }
    if (f.mono) { var y = Math.round((v[0] + v[1] + v[2]) / 3); v = [y, y, y]; }
    return 'rgb(' + v.join(',') + ')';
  }

  function pagAjuste() {
    return '<div class="pol-sub">COLORAÇÃO · 100 É NÃO TER MEXIDO</div>' +
      desl('temperatura', 'Temperatura', 0, 200, 1) +
      desl('brilho', 'Brilho', 0, 200, 1) +
      desl('contraste', 'Contraste', 0, 200, 1) +
      desl('vintage', 'Vintage', 0, 200, 1, 'levanta o preto e fecha o branco — é papel desbotando') +
      desl('saturacao', 'Saturação', 0, 200, 1) +
      '<div class="pol-sub">DEPOIS DA CURVA</div>' +
      desl('halo', 'Halo', 0, 200, 1) +
      desl('vinheta', 'Vinheta', 0, 200, 1) +
      desl('grao', 'Grão', 0, 200, 1) +
      desl('vazamento', 'Vazamento', 0, 200, 1) +
      desl('desfoque', 'Desfoque', 0, 100, 1) +
      '<div class="pol-rodape"><button class="pol-b" id="polResetar">RESETAR</button></div>';
  }

  function pagLegenda() {
    return '<div class="pol-sub">A TARJA DE BAIXO</div>' +
      '<textarea class="pol-txt" id="polLeg" rows="2" placeholder="escreva na tarja…" spellcheck="false">' +
        (est.cfg.legenda || '') + '</textarea>' +
      '<div class="pol-ctrl"><label>Letra</label><div class="pol-pilulas">' +
        botoes('legFonte', [['mao', 'À MÃO'], ['sans', 'ARCHIVO'], ['mono', 'MONO']]) + '</div></div>' +
      '<div class="pol-ctrl"><label>Alinhamento</label><div class="pol-pilulas">' +
        botoes('legAlinha', [['esq', 'ESQ'], ['centro', 'CENTRO'], ['dir', 'DIR']]) + '</div></div>' +
      desl('legTam', 'Tamanho', 40, 180, 1) +
      '<div class="pol-ctrl"><label>Cor da tinta</label>' +
        '<input type="color" class="pol-cor" data-pol-cor="legCor" value="' + est.cfg.legCor + '"></div>';
  }

  function pagQuadro() {
    return '<div class="pol-sub">FORMATO</div>' +
      '<div class="pol-pilulas pol-pilulas-l">' +
        botoes('formato', [['quadrado', 'QUADRADO'], ['retrato', 'RETRATO'], ['paisagem', 'PAISAGEM'], ['wide', 'WIDE']]) +
      '</div>' +
      '<p class="pol-nota">O que sobra não fica preto: fica papel.</p>' +
      '<div class="pol-sub">GIRO</div>' +
      '<div class="pol-pilulas">' + botoes('giro', [[0, '0°'], [90, '90°'], [180, '180°'], [270, '270°']], 1) + '</div>' +
      '<div class="pol-sub">ENQUADRAMENTO</div>' +
      '<p class="pol-nota">Na foto pendurada: arraste para mover, roda do rato para aproximar.</p>' +
      '<div class="pol-rodape"><button class="pol-b" id="polCentrar">CENTRAR</button></div>';
  }

  function pagPapel() {
    var h = '<div class="pol-cartoes">';
    P.molduras.forEach(function (m) {
      h += '<button class="pol-cartao' + (m.id === est.cfg.moldura ? ' on' : '') + '" data-pol-mold="' + m.id + '">' +
        (m.arquivo ? '<img src="' + m.arquivo + '" alt="">' : '<i style="background:' + (m.tom || '#eee') + '"></i>') +
        '<b>' + m.nome + '</b><span>' + (m.nota || '') + '</span></button>';
    });
    return h + '</div><p class="pol-nota">Molduras novas: ponha o escaneamento em ' +
      '<code>assets/polaroid/molduras/</code>. A janela da emulsão é MEDIDA no arquivo.</p>';
  }

  /* ------------------------------------------------------------------
     PRESETS
     Guardados no MESMO cofre dos presets de efeito, áudio e tipografia
     (`js/presets.js`, `kind:'polaroid'`) — assim saem no mesmo .json
     quando ele exporta os presets do laboratório.

     Um preset guarda a RECEITA: filme, coloração, papel e o jeito da
     letra. Não guarda o enquadramento nem o texto — zoom, deslocamento
     e legenda são daquela foto.                                    */
  var SO_DA_FOTO = ['zoom', 'dx', 'dy', 'legenda'];

  function pagPreset() {
    if (!VE.presets) return '<p class="pol-nota">o cofre de presets não carregou nesta página.</p>';
    var lista = VE.presets.list('polaroid');
    var h = '<div class="pol-sub">GUARDAR A RECEITA DE AGORA</div>' +
      '<input class="pol-nome" id="polPresetNome" placeholder="nome do preset" spellcheck="false">' +
      '<div class="pol-rodape"><button class="pol-b pol-b-forte" id="polPresetGuardar">GUARDAR</button></div>' +
      '<p class="pol-nota">Guarda filme, coloração, papel e o jeito da letra. Não guarda enquadramento nem texto.</p>' +
      '<div class="pol-sub">GUARDADOS</div>';
    if (!lista.length) return h + '<p class="pol-nota">Nenhum ainda.</p>';
    return h + '<div class="pol-cartoes">' + lista.map(function (p) {
      var f = P.filme((p.data && p.data.filme) || '600');
      return '<div class="pol-cartao pol-cartao-p"><i style="background:' + amostraCor(f) + '"></i>' +
        '<b>' + p.name + '</b><span>' + f.nome + '</span>' +
        '<div class="pol-cartao-b"><button class="pol-b" data-pol-pset="' + p.id + '">APLICAR</button>' +
        '<button class="pol-b pol-b-x" data-pol-pdel="' + p.id + '">APAGAR</button></div></div>';
    }).join('') + '</div>';
  }

  function botoes(k, lista, num) {
    return lista.map(function (p) {
      var on = String(est.cfg[k]) === String(p[0]);
      return '<button class="pol-pil' + (on ? ' on' : '') + '" data-pol-set="' + k +
        '" data-pol-v="' + p[0] + '"' + (num ? ' data-pol-num="1"' : '') + '>' + p[1] + '</button>';
    }).join('');
  }

  function ligarPagina() {
    var pag = el('polPag');

    pag.querySelectorAll('[data-pol-aba]').forEach(function (b) {
      b.addEventListener('click', function () { est.aba = est.ultima = b.dataset.polAba; pintarTela(); });
    });

    /* barra e caixa numérica andam juntas, nos dois sentidos */
    pag.querySelectorAll('[data-pol-r]').forEach(function (r) {
      r.addEventListener('input', function () {
        var k = r.dataset.polR;
        est.cfg[k] = +r.value;
        var n = pag.querySelector('[data-pol-n="' + k + '"]');
        if (n) n.value = r.value;
        redesenhar();
      });
    });
    pag.querySelectorAll('[data-pol-n]').forEach(function (n) {
      n.addEventListener('change', function () {
        var k = n.dataset.polN;
        var r = pag.querySelector('[data-pol-r="' + k + '"]');
        var v = Math.max(+r.min, Math.min(+r.max, +n.value || 0));
        n.value = v; r.value = v; est.cfg[k] = v;
        redesenhar();
      });
    });
    pag.querySelectorAll('[data-pol-set]').forEach(function (b) {
      b.addEventListener('click', function () {
        est.cfg[b.dataset.polSet] = b.dataset.polNum ? +b.dataset.polV : b.dataset.polV;
        pintarTela(); redesenhar();
      });
    });
    pag.querySelectorAll('[data-pol-cor]').forEach(function (i) {
      i.addEventListener('input', function () { est.cfg[i.dataset.polCor] = i.value; redesenhar(); });
    });
    pag.querySelectorAll('[data-pol-filme]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.polFilme === '__amostra') return;
        est.cfg.filme = b.dataset.polFilme; est.cfg.filmeAmostrado = null;
        pintarTela(); pintarPlaqueta(); redesenhar();
      });
    });
    pag.querySelectorAll('[data-pol-mold]').forEach(function (b) {
      b.addEventListener('click', function () { trocarMoldura(b.dataset.polMold); pintarTela(); });
    });
    pag.querySelectorAll('[data-pol-orig]').forEach(function (b) {
      b.addEventListener('click', function () {
        var o = P.originais[+b.dataset.polOrig];
        P.carregarImagem(o.arquivo).then(function (img) {
          est.cfg.filmeAmostrado = P.amostrar(img, o.nome);
          pintarTela(); pintarPlaqueta(); redesenhar();
          VE.app.toast('filme amostrado de ' + o.nome + ' — ' + est.cfg.filmeAmostrado.nota, 'ok');
        }).catch(function () { VE.app.toast('não consegui abrir ' + o.nome, 'err'); });
      });
    });

    var guardar = el('polPresetGuardar');
    if (guardar) guardar.addEventListener('click', function () {
      var nome = (el('polPresetNome').value || '').trim();
      if (!nome) { VE.app.toast('dê um nome ao preset', 'err'); return; }
      var receita = JSON.parse(JSON.stringify(est.cfg));
      SO_DA_FOTO.forEach(function (k) { delete receita[k]; });
      VE.presets.add('polaroid', nome, receita);
      pintarTela();
      VE.app.toast('preset ' + nome.toUpperCase() + ' guardado', 'ok');
    });
    pag.querySelectorAll('[data-pol-pset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = VE.presets.get(b.dataset.polPset);
        if (!p) return;
        Object.keys(p.data).forEach(function (k) { est.cfg[k] = p.data[k]; });
        trocarMoldura(est.cfg.moldura);
        pintarTela(); pintarPlaqueta(); redesenhar();
        VE.app.toast('preset ' + p.name + ' aplicado', 'ok');
      });
    });
    pag.querySelectorAll('[data-pol-pdel]').forEach(function (b) {
      b.addEventListener('click', function () { VE.presets.remove(b.dataset.polPdel); pintarTela(); });
    });

    var lg = el('polLeg');
    if (lg) lg.addEventListener('input', function () { est.cfg.legenda = lg.value; redesenhar(); });

    var rst = el('polResetar');
    if (rst) rst.addEventListener('click', function () {
      var novo = P.novaCfg();
      ['temperatura', 'brilho', 'contraste', 'vintage', 'saturacao',
       'halo', 'vinheta', 'grao', 'vazamento', 'desfoque'].forEach(function (k) { est.cfg[k] = novo[k]; });
      pintarTela(); redesenhar();
    });

    var ctr = el('polCentrar');
    if (ctr) ctr.addEventListener('click', function () {
      est.cfg.zoom = 1; est.cfg.dx = 0; est.cfg.dy = 0; redesenhar();
    });

    var am = el('polAmostrarArq');
    if (am) am.addEventListener('click', function () {
      var i = document.createElement('input');
      i.type = 'file'; i.accept = 'image/*';
      i.onchange = function () {
        var f = i.files[0]; if (!f) return;
        var img = new Image();
        img.onload = function () {
          est.cfg.filmeAmostrado = P.amostrar(img, f.name.replace(/\.[a-z0-9]+$/i, ''));
          pintarTela(); pintarPlaqueta(); redesenhar();
          VE.app.toast('filme amostrado — ' + est.cfg.filmeAmostrado.nota, 'ok');
        };
        img.src = URL.createObjectURL(f);
      };
      i.click();
    });
  }

})(window.VE);
