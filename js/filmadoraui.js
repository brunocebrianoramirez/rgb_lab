/* ============================================================
   rgb_lab — A FILMADORA · a tela
   ------------------------------------------------------------
   NÃO HÁ JANELA. Há a traseira de uma câmera de filme flutuando
   num palco escuro, e — fora a telinha de ajustes — todo comando
   é uma peça da máquina, na regra que o Bruno escreveu para o
   polaroid: cada coisa tridimensional corresponde a uma função.

     visor ............ a composição, já com a película. Clique
                        toca e pausa (a barra de espaço também)
     botão vermelho ... GRAVA: a exportação, com a película. A
                        lâmpada pisca e o contador conta os pés
     contador ......... pés de filme desta bitola (50 pés de Super
                        8 a 18 q/s são 3 min 20 s — é conta real)
     porta do rolo .... abre os ROLOS gravados: baixar, usar na
                        linha do tempo, apagar
     seletor (a roda) . o FILME: PURO ou um dos nove olhares 8 MM
                        do catálogo. Arrasta, rola, ou toca
     i ................ a plaqueta: o que cada peça faz
     película ......... a gaveta das BITOLAS — 8 mm, Super 8,
                        16 mm, 35 mm. Cada uma é outra máquina
     rebobinar ........ volta a composição ao início
     relâmpago ........ o vazamento de luz, liga e desliga
     grade ............ SOM: grava em tempo real, com o áudio
                        (desligado, grava exato, quadro a quadro)
     engrenagem ....... a telinha de ajustes (grão, sujeira,
                        tremor, cor…), no desenho do laboratório
   ============================================================ */
(function (VE) {
  'use strict';

  var U = VE.filmadoraui = {};
  var F = null;                    /* VE.filmadora, resolvido na abertura */
  var est = null;

  function el(id) { return document.getElementById(id); }
  /* url() dentro de uma variável CSS resolve pela FOLHA que a usa, não pelo
     documento: 'assets/…' virava 'css/assets/…' e a foto não aparecia.
     A variável recebe sempre o endereço absoluto.                     */
  /* aspas SIMPLES: o valor também vai dentro de style="…" nas gavetas */
  function urlCss(u) { return "url('" + (u.indexOf('data:') === 0 ? u : new URL(u, document.baseURI).href) + "')"; }
  function $(s, raiz) { return (raiz || document).querySelector(s); }

  /* a cor dos glifos, dos botões e da tinta gravada, por pele */
  /* a tinta de uma carcaça de FOTO: escura (creme) ou clara (preta, em plaquetas) */
  var TINTAS = {
    escura: { glifo: '#e8d9a8', bt1: '#4c4c4c', bt2: '#121212', tinta: '#e8d9a8', bisel: 'rgba(255,255,255,.16)', sombraTinta: 'rgba(0,0,0,.7)' },
    clara: { glifo: '#1a1c1e', bt1: '#efefed', bt2: '#b9bab6', tinta: '#111', bisel: 'rgba(255,255,255,.55)', sombraTinta: 'rgba(255,255,255,.5)', halo: 'rgba(255,255,255,.9)', placa: 'rgba(238,238,234,.88)' }
  };
  var PELES = {
    '8mm':  { glifo: '#e8d9a8', bt1: '#4c4c4c', bt2: '#121212', tinta: '#e8d9a8', bisel: 'rgba(255,255,255,.16)', sombraTinta: 'rgba(0,0,0,.7)' },
    's8':   { glifo: '#f1e2b4', bt1: '#5c4b3e', bt2: '#1a1410', tinta: '#f1e2b4', bisel: 'rgba(255,255,255,.18)', sombraTinta: 'rgba(0,0,0,.7)' },
    '16mm': { glifo: '#f0b060', bt1: '#4c4d4f', bt2: '#151617', tinta: '#f0b060', bisel: 'rgba(255,255,255,.14)', sombraTinta: 'rgba(0,0,0,.7)' },
    /* na pele clara a tinta é preta e ganha um HALO branco: sem ele o
       nome gravado some na pintura martelada                          */
    '35mm': { glifo: '#1a1c1e', bt1: '#efefed', bt2: '#b9bab6', tinta: '#111', bisel: 'rgba(255,255,255,.55)', sombraTinta: 'rgba(255,255,255,.5)', halo: 'rgba(255,255,255,.9)', placa: 'rgba(238,238,234,.88)' }
  };

  var ICO = {
    info: '<path d="M12 4.6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9.6 9.4h3.6v7.4h1.7v2H9.3v-2h1.7v-5.4H9.6z"/>',
    pelicula: '<path fill-rule="evenodd" d="M3 5h18v14H3zM5.4 7v2h2.2V7zm0 4v2h2.2v-2zm0 4v2h2.2v-2zm11 -8v2h2.2V7zm0 4v2h2.2v-2zm0 4v2h2.2v-2zM9.4 7.8h5.2v8.4H9.4z"/>',
    rebobinar: '<path d="M12 5.2V2.4L7.2 6l4.8 3.6V6.9a5.1 5.1 0 1 1-5.1 5.1H5.2A6.8 6.8 0 1 0 12 5.2z"/>',
    luz: '<path d="M13.4 2.4 5.6 13.2h5.1L9.4 21.6l8-11.2h-5.2z"/>',
    som: '<path fill-rule="evenodd" d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm-4 5.3v1.7h8V8.3zm-1.6 3.2v1.7h11.2v-1.7zm1.6 3.2v1.7h8v-1.7z"/>',
    eng: '<path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3H9l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L4.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h6l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>',
    play: '<path d="M8 5.2v13.6L18.6 12z"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>'
  };
  function svg(nome) { return '<svg viewBox="0 0 24 24">' + ICO[nome] + '</svg>'; }

  /* ==================================================================
     ABRIR / FECHAR                                                  */
  U.abrir = function () {
    F = VE.filmadora;
    if (!F) { VE.app.toast('o motor da filmadora não carregou', 'err'); return; }
    montar();
    if (!est) est = { raf: 0, tela: null, gaveta: null, arr: null, ultimoTc: '' };
    F.est.ativa = true;
    el('filPalco').classList.remove('hidden');
    vestir();
    pintarSeletor();
    pintarBotoes();
    pintarRolos();
    ajustarVisor();
    if (!est.raf) laco();
  };

  U.fechar = function () {
    if (!est) return;
    if (F.est.gravando) { VE.app.toast('a filmadora está gravando — o botão vermelho cancela', 'err'); return; }
    F.est.ativa = false;
    el('filPalco').classList.add('hidden');
    fecharTela(); fecharGaveta();
    cancelAnimationFrame(est.raf); est.raf = 0;
  };
  U.aberta = function () { return !!(est && !el('filPalco').classList.contains('hidden')); };

  /* ==================================================================
     A MONTAGEM — uma vez                                            */
  function montar() {
    if (el('filPalco')) return;
    var d = document.createElement('div');
    d.className = 'fil-palco hidden';
    d.id = 'filPalco';
    d.innerHTML =
      '<button class="fil-sair" id="filFechar" title="Fechar (Esc)">' + svg('x') + '</button>' +
      '<div class="fil-conjunto" id="filConjunto">' +
        '<div class="fil-cam" id="filCam">' +
          '<i class="fil-parafuso" style="--r:20deg;left:calc(var(--u)*1.7);top:calc(var(--u)*1.7)"></i>' +
          '<i class="fil-parafuso" style="--r:-35deg;left:calc(var(--u)*96.7);top:calc(var(--u)*1.7)"></i>' +
          '<i class="fil-parafuso" style="--r:60deg;left:calc(var(--u)*1.7);top:calc(var(--u)*52.9)"></i>' +

          '<div class="fil-visor" id="filVisor" title="Tocar e pausar (espaço)">' +
            '<div class="fil-visor-janela" id="filJanela"><canvas id="filImagem"></canvas>' +
              '<div class="fil-visor-vidro"></div>' +
              '<div class="fil-play">' + svg('play') + '</div>' +
            '</div>' +
          '</div>' +

          '<div class="fil-botoes">' +
            '<button class="fil-bt" id="filInfo" title="O que cada peça faz">' + svg('info') + '<small>INFO</small></button>' +
            '<button class="fil-bt" id="filPelicula" title="A bitola: 8 mm, Super 8, 16 mm, 35 mm">' + svg('pelicula') + '<small>BITOLA</small></button>' +
            '<button class="fil-bt" id="filRebobinar" title="Rebobinar: volta ao início">' + svg('rebobinar') + '<small>REBOB.</small></button>' +
            '<button class="fil-bt" id="filVazamento" title="Vazamento de luz">' + svg('luz') + '<small>LUZ</small></button>' +
            '<button class="fil-bt" id="filSom" title="Som: grava em tempo real, com o áudio">' + svg('som') + '<small>SOM</small></button>' +
          '</div>' +

          '<div class="fil-contador" id="filContador"><b><span id="filPes">000.0</span><small>FT</small></b><span id="filTc">00:00</span></div>' +
          '<div class="fil-plaqueta" id="filPlaqueta"><b>FILMADORA</b><span id="filPlacaTxt">8 MM · 18 Q/S</span></div>' +

          '<button class="fil-porta" id="filRolos" title="Os rolos gravados"><i></i><b id="filRolosN" class="hidden">0</b><small>ROLOS</small></button>' +
          '<button class="fil-rec" id="filRec" title="Gravar a composição num rolo"><i></i></button>' +
          '<i class="fil-lampada" id="filLampada"></i>' +
          '<button class="fil-bt fil-eng" id="filAjustes" title="Ajustes da película">' + svg('eng') + '</button>' +

          '<div class="fil-seletor" id="filSeletor">' +
            '<div class="fil-roda" id="filRoda" title="O filme: arraste, role ou toque"><canvas id="filDisco"></canvas><i class="fil-roda-marca"></i><i class="fil-roda-tampa"></i></div>' +
            '<div class="fil-rotulo" id="filRotulo" title="Próximo filme">60s</div>' +
          '</div>' +
        '</div>' +

        '<div class="fil-tela" id="filTela">' +
          '<div class="fil-tela-h"><i class="fil-led"></i><h4 id="filTelaTit">AJUSTES</h4>' +
            '<button class="fil-tela-x" id="filTelaX" title="Fechar">' + svg('x') + '</button></div>' +
          '<div class="fil-tela-pag" id="filTelaPag"></div>' +
        '</div>' +
      '</div>' +

      '<div class="fil-gaveta fil-gaveta-pel" id="filGavetaPel"></div>' +
      '<div class="fil-gaveta fil-gaveta-rolos" id="filGavetaRolos">' +
        '<div class="fil-gav-h"><b>ROLOS</b><span id="filGavN"></span><button class="fil-tela-x" id="filGavX" title="Fechar">' + svg('x') + '</button></div>' +
        '<div class="fil-rolos" id="filLista"></div>' +
      '</div>';
    document.body.appendChild(d);
    ligar();
  }

  /* ==================================================================
     A PELE — a bitola veste a máquina                               */
  function vestir() {
    var b = F.bitola(F.est.bitola), p = PELES[b.id] || PELES['8mm'], cam = el('filCam');
    /* a carcaça: foto (os couros do Bruno, ou a do PC) ou a calculada */
    var carc = F.carcacaDe(b.id);
    if (carc.url) p = TINTAS[carc.tinta] || TINTAS.escura;
    cam.className = 'fil-cam pele-' + b.id + (carc.url ? ' foto' : '');
    cam.style.setProperty('--fil-pele', carc.url ? urlCss(carc.url) : F.pele(b.pele, b.cor));
    /* a gaveta dos rolos veste o mesmo couro, quando é foto escura */
    el('filPalco').style.setProperty('--fil-couro', (carc.url && carc.tinta === 'escura') ? urlCss(carc.url) : F.pele('couro', [30, 29, 28]));
    el('filGavetaRolos').classList.toggle('foto', !!(carc.url && carc.tinta === 'escura'));
    cam.style.setProperty('--fil-glifo', p.glifo);
    cam.style.setProperty('--fil-bt1', p.bt1);
    cam.style.setProperty('--fil-bt2', p.bt2);
    cam.style.setProperty('--fil-tinta', p.tinta);
    cam.style.setProperty('--fil-bisel', p.bisel);
    cam.style.setProperty('--fil-sombra-tinta', p.sombraTinta);
    cam.style.setProperty('--fil-halo', p.halo || 'rgba(0,0,0,0)');
    cam.style.setProperty('--fil-op', p.halo ? '1' : '');
    cam.style.setProperty('--fil-placa', p.placa || (carc.url ? 'rgba(8,8,8,.62)' : 'transparent'));
    el('filPlacaTxt').textContent = b.nome + ' · ' + b.fps + ' Q/S';
    el('filPalco').style.setProperty('--fil-plastico', F.pele('pontilhada', [224, 224, 220]));
    /* o disco torneado do seletor, no tamanho em que aparece */
    var disco = el('filDisco'), D = Math.round(Math.min(2, window.devicePixelRatio || 1) * disco.getBoundingClientRect().width) || 240;
    if (disco.width !== D) {
      var cv = F.discoTorneado(D);
      disco.width = D; disco.height = D;
      disco.getContext('2d').drawImage(cv, 0, 0);
    }
  }

  /* o visor tem a proporção da bitola: 4:3 nas de 8 mm — recorta as
     barras pretas que a película deixa num vídeo largo, que é como a
     janela de uma câmera de verdade enquadra                        */
  function ajustarVisor() {
    var visor = el('filVisor'), jan = el('filJanela'), cv = el('filImagem');
    var r = visor.getBoundingClientRect();
    if (!r.width) return;
    var pad = r.width * 0.045, aw = r.width - pad * 2, ah = r.height - pad * 2;
    var ar = F.bitola(F.est.bitola).visor, w = aw, h = aw / ar;
    if (h > ah) { h = ah; w = ah * ar; }
    jan.style.width = w + 'px'; jan.style.height = h + 'px';
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  }

  /* ==================================================================
     O LAÇO — o visor espelha o canvas do laboratório a cada quadro
     (o motor desenha com preserveDrawingBuffer, então dá para copiar
     a qualquer hora), e o contador e a lâmpada seguem a gravação    */
  function laco() {
    est.raf = requestAnimationFrame(laco);
    if (!U.aberta()) return;
    desenharVisor();
    var EX = VE.exporter, gravando = !!(EX && EX.emAndamento && EX.emAndamento() && F.est.gravando);
    el('filCam').classList.toggle('gravando', gravando);
    el('filRec').classList.toggle('gravando', gravando);
    el('filVisor').classList.toggle('parado', !(VE.app && VE.app.playing) && !gravando);
    contador(gravando);
  }

  function desenharVisor() {
    var gl = el('gl'), cv = el('filImagem');
    if (!gl || !gl.width || !cv.width) return;
    var c = cv.getContext('2d');
    var sa = gl.width / gl.height, va = cv.width / cv.height, sx = 0, sy = 0, sw = gl.width, sh = gl.height;
    if (sa > va) { sw = gl.height * va; sx = (gl.width - sw) / 2; } else { sh = gl.width / va; sy = (gl.height - sh) / 2; }
    try { c.drawImage(gl, sx, sy, sw, sh, 0, 0, cv.width, cv.height); } catch (e) { return; }
    /* a miniatura do rolo: um quadro de dentro da gravação, não o último */
    var g = F.gravando();
    if (g && !g.thumb && VE.project && VE.project.time - g.ini > Math.min(0.5, g.dur * 0.25)) {
      F.marcarThumb(miniatura(cv));
    }
  }
  function miniatura(cv) {
    var m = document.createElement('canvas'), w = 320, h = Math.round(320 * cv.height / cv.width);
    m.width = w; m.height = h;
    m.getContext('2d').drawImage(cv, 0, 0, w, h);
    return m.toDataURL('image/jpeg', 0.82);
  }

  function contador(gravando) {
    var t = VE.project ? VE.project.time : 0, g = F.gravando();
    var s = (gravando && g) ? Math.max(0, t - g.ini) : t;
    var pes = F.pes(s);
    var txt = (pes < 1000 ? ('00' + pes.toFixed(1)).slice(-5) : Math.round(pes) + '');
    var mm = Math.floor(s / 60), ss = Math.floor(s % 60);
    var tc = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
    if (txt !== est.ultimoPes) { el('filPes').textContent = txt; est.ultimoPes = txt; }
    if (tc !== est.ultimoTc) { el('filTc').textContent = tc; est.ultimoTc = tc; }
  }

  /* ==================================================================
     OS COMANDOS                                                     */
  function ligar() {
    el('filFechar').addEventListener('click', U.fechar);
    el('filPalco').addEventListener('pointerdown', function (ev) {
      if (ev.target !== el('filPalco')) return;
      if (est.tela) { fecharTela(); return; }
      if (est.gaveta) { fecharGaveta(); return; }
      U.fechar();
    });
    document.addEventListener('keydown', function (ev) {
      if (!U.aberta()) return;
      var tag = (ev.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (ev.key === 'Escape') {
        ev.preventDefault(); ev.stopPropagation();
        if (est.tela) fecharTela(); else if (est.gaveta) fecharGaveta(); else U.fechar();
      }
      /* as setas são do seletor enquanto a máquina está aberta — e param
         aqui, senão o laboratório atrás anda um quadro a cada filme  */
      if (ev.key === 'ArrowRight') { ev.preventDefault(); ev.stopPropagation(); mudarFilme(1); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); mudarFilme(-1); }
    }, true);
    /* Botão clicado perde o foco na hora. A barra de espaço toca e pausa
       o vídeo (js/app.js) — e um botão com foco também DISPARA no espaço:
       apertar o vermelho e depois espaço cancelaria a gravação.       */
    el('filPalco').addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (b) b.blur();
    });
    window.addEventListener('resize', function () { if (U.aberta()) { ajustarVisor(); vestir(); } });

    /* o visor toca e pausa */
    el('filVisor').addEventListener('click', function () {
      if (!VE.project) { VE.app.toast('não há composição aberta — carregue um vídeo primeiro', 'err'); return; }
      if (F.est.gravando) return;
      VE.app.toggle();
    });

    /* os cinco botões */
    el('filInfo').addEventListener('click', function () { abrirTela('sobre'); });
    el('filPelicula').addEventListener('click', function () { gaveta('pel'); });
    el('filRebobinar').addEventListener('click', function () {
      if (!VE.project || F.est.gravando) return;
      VE.app.seek(0);
      var b = el('filRebobinar'); b.classList.remove('gira'); void b.offsetWidth; b.classList.add('gira');
    });
    el('filVazamento').addEventListener('click', function () {
      F.est.vazamento = !F.est.vazamento; F.guardar(); pintarBotoes();
    });
    el('filSom').addEventListener('click', function () {
      if (F.est.gravando) return;
      F.est.som = !F.est.som; F.guardar(); pintarBotoes();
      VE.app.toast(F.est.som ? 'SOM: grava em tempo real, com o áudio (o gravador do navegador)' : 'SEM SOM: grava exato, quadro a quadro (o codificador)');
    });

    /* a porta, o vermelho, a engrenagem */
    el('filRolos').addEventListener('click', function () { gaveta('rolos'); });
    el('filAjustes').addEventListener('click', function () { abrirTela('ajustes'); });
    el('filRec').addEventListener('click', function () {
      if (F.est.gravando) { F.gravar(); VE.app.toast('gravação cancelada'); return; }
      if (F.gravar()) {
        pintarRolos();
        VE.app.toast('gravando ' + F.bitola(F.est.bitola).nome + ' · ' + F.filme(F.est.filme).nome + (F.est.som ? ' · com som' : ' · exato'));
      }
    });
    F.aoMudar = function (tipo, rolo) {
      pintarRolos();
      if (tipo === 'rolo') { gaveta('rolos', true); VE.app.toast('rolo pronto: ' + rolo.dur.toFixed(1) + 's · ' + (rolo.blob.size / 1048576).toFixed(1) + ' MB', 'ok'); }
      if (tipo === 'cancelado') VE.app.toast('nada foi gravado');
    };

    /* o seletor: arrastar em volta do centro, rolar, tocar */
    var roda = el('filRoda');
    function angulo(ev) {
      var r = roda.getBoundingClientRect();
      return Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    }
    roda.addEventListener('pointerdown', function (ev) {
      roda.setPointerCapture(ev.pointerId);
      est.arr = { a0: angulo(ev), acc: 0, andou: 0 };
    });
    roda.addEventListener('pointermove', function (ev) {
      if (!est.arr) return;
      var a = angulo(ev), d = a - est.arr.a0;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      est.arr.a0 = a; est.arr.acc += d; est.arr.andou += Math.abs(d);
      var passo = 360 / F.filmes().length;
      while (est.arr.acc > passo * 0.5) { mudarFilme(1); est.arr.acc -= passo; }
      while (est.arr.acc < -passo * 0.5) { mudarFilme(-1); est.arr.acc += passo; }
    });
    roda.addEventListener('pointerup', function () {
      if (est.arr && est.arr.andou < 4) mudarFilme(1);
      est.arr = null;
    });
    roda.addEventListener('pointercancel', function () { est.arr = null; });
    roda.addEventListener('wheel', function (ev) { ev.preventDefault(); mudarFilme(ev.deltaY > 0 ? 1 : -1); }, { passive: false });
    el('filRotulo').addEventListener('click', function () { mudarFilme(1); });

    /* a gaveta dos rolos */
    el('filGavX').addEventListener('click', fecharGaveta);
    el('filLista').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-acao]'); if (!b) return;
      var id = b.closest('[data-rolo]').dataset.rolo, acao = b.dataset.acao;
      if (acao === 'baixar') F.baixar(id);
      else if (acao === 'usar') {
        if (F.usar(id)) { U.fechar(); VE.app.toast('o rolo entrou na linha do tempo, por cima do cursor', 'ok'); }
      }
      else if (acao === 'apagar') F.apagar(id);
    });

    /* a telinha */
    el('filTelaX').addEventListener('click', fecharTela);
  }

  function mudarFilme(dir) {
    var l = F.filmes(), i = 0, k;
    for (k = 0; k < l.length; k++) if (l[k].id === F.est.filme) i = k;
    est.giro = (est.giro || 0) + dir;
    i = ((i + dir) % l.length + l.length) % l.length;
    F.est.filme = l[i].id; F.guardar();
    pintarSeletor();
  }

  /* ==================================================================
     PINTAR                                                          */
  function pintarSeletor() {
    var f = F.filme(F.est.filme), l = F.filmes(), rot = el('filRotulo');
    rot.textContent = f.nome;
    /* nome comprido, letra menor — TWO-COLOR não cabe no corpo do 60s */
    rot.style.setProperty('--rot-fs', f.nome.length > 8 ? 1.45 : (f.nome.length > 5 ? 1.7 : 2.05));
    rot.style.setProperty('--c1', f.cor1);
    rot.style.setProperty('--c2', f.cor2);
    /* a roda gira um dente por filme — e continua girando no mesmo
       sentido, em vez de voltar 324° ao passar do último ao primeiro */
    el('filRoda').style.setProperty('--ang', ((est.giro || 0) * 360 / l.length) + 'deg');
    if (est.tela === 'sobre') paginaSobre();
  }
  function pintarBotoes() {
    el('filVazamento').classList.toggle('on', !!F.est.vazamento);
    el('filSom').classList.toggle('on', !!F.est.som);
  }

  /* ==================================================================
     AS GAVETAS — a das bitolas sobe do chão do palco; a dos rolos
     entra pela direita                                              */
  function gaveta(qual, forcar) {
    if (est.gaveta === qual && !forcar) { fecharGaveta(); return; }
    fecharGaveta();
    est.gaveta = qual;
    if (qual === 'pel') { pintarBitolas(); el('filGavetaPel').classList.add('aberta'); }
    if (qual === 'rolos') { pintarRolos(); el('filGavetaRolos').classList.add('aberta'); }
  }
  function fecharGaveta() {
    est.gaveta = null;
    el('filGavetaPel').classList.remove('aberta');
    el('filGavetaRolos').classList.remove('aberta');
  }

  function peleDe(b) {
    var c = F.carcacaDe(b.id);
    return c.url ? urlCss(c.url) : F.pele(b.pele, b.cor);
  }
  function pintarBitolas() {
    var g = el('filGavetaPel'), atual = F.bitola(F.est.bitola), esc = F.carcacaDe(atual.id);
    var lista = F.CARCACAS.slice();
    if (F.est.propria) lista.splice(3, 0, { id: 'propria', nome: 'DO PC', url: F.est.propria.url });
    g.innerHTML =
      '<div class="fil-gav-linha">' + F.BITOLAS.map(function (b) {
        return '<button class="fil-mini' + (b.id === F.est.bitola ? ' on' : '') + '" data-bitola="' + b.id + '" title="' + b.desc + '">' +
          '<i style="--pele:' + peleDe(b) + ';--ar:' + b.visor.toFixed(3) + '"' + (F.carcacaDe(b.id).url ? ' class="foto"' : '') + '></i>' +
          '<span>' + b.nome + '</span><em>' + b.rotulo + ' · ' + b.fps + ' Q/S</em></button>';
      }).join('') + '</div>' +
      /* a CARCAÇA da máquina escolhida: os couros da pasta, a do PC, a
         calculada — e o botão que sobe uma foto nova                  */
      '<div class="fil-gav-linha fil-carcacas"><b>CARCAÇA · ' + atual.nome + '</b>' + lista.map(function (c) {
        var pele = c.url ? urlCss(c.url) : F.pele(atual.pele, atual.cor);
        return '<button class="fil-carc' + (c.id === esc.id ? ' on' : '') + '" data-carcaca="' + c.id + '" title="' + (c.id === 'calculada' ? 'relevo calculado, sem arquivo' : c.nome) + '">' +
          '<i style="--pele:' + pele + '"' + (c.url ? ' class="foto"' : '') + '></i><span>' + c.nome + '</span></button>';
      }).join('') +
      '<button class="fil-carc fil-carc-subir" id="filSubir" title="Uma foto de couro, tecido, metal — qualquer imagem do seu computador">' +
        '<i><svg viewBox="0 0 24 24"><path d="M12 3.5l5 5.2h-3.2v6.3h-3.6V8.7H7z"/><path d="M4.5 15.5v4.2h15v-4.2h-2.2v2h-10.6v-2z"/></svg></i><span>SUBIR DO PC</span></button>' +
      '<input type="file" id="filSubirArq" accept="image/*" hidden></div>';
    g.querySelectorAll('[data-bitola]').forEach(function (bt) {
      bt.addEventListener('click', function () {
        if (F.est.gravando) { VE.app.toast('termine a gravação antes de trocar a bitola', 'err'); return; }
        F.est.bitola = bt.dataset.bitola; F.guardar();
        vestir(); ajustarVisor(); pintarBitolas();
        if (VE.app.clearFeedback) VE.app.clearFeedback();
        if (est.tela === 'sobre') paginaSobre();
      });
    });
    g.querySelectorAll('[data-carcaca]').forEach(function (bt) {
      bt.addEventListener('click', function () {
        F.escolherCarcaca(F.est.bitola, bt.dataset.carcaca);
        vestir(); pintarBitolas();
      });
    });
    var arq = el('filSubirArq');
    el('filSubir').addEventListener('click', function () { arq.value = ''; arq.click(); });
    arq.addEventListener('change', function () {
      var f = arq.files && arq.files[0]; if (!f) return;
      F.subirCarcaca(f).then(function (p) {
        F.escolherCarcaca(F.est.bitola, 'propria');
        vestir(); pintarBitolas();
        VE.app.toast('carcaça nova: ' + p.nome + (p.tinta === 'clara' ? ' (clara — glifos pretos)' : ''), 'ok');
      }).catch(function (e) { VE.app.toast(e.message, 'err'); });
    });
  }

  function carimbo(d) {
    var yy = ('' + d.getFullYear()).slice(-2), mm = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
    return '’' + yy + ' ' + mm + ' ' + dd;
  }
  function pintarRolos() {
    var rolos = F.est.rolos, lista = el('filLista'), g = F.gravando(), n = el('filRolosN');
    n.textContent = rolos.length;
    n.classList.toggle('hidden', !rolos.length);
    el('filGavN').textContent = rolos.length ? rolos.length + (rolos.length === 1 ? ' ROLO' : ' ROLOS') : '';
    var h = '';
    if (g) {
      h += '<div class="fil-rolo rodando"><div class="fil-rolo-quadro"><span class="fil-carimbo">' + carimbo(new Date()) + '</span>' +
        '<span class="fil-rodando">GRAVANDO…</span></div>' +
        '<div class="fil-rolo-info"><b>' + F.bitola(g.bitola).nome + ' · ' + F.filme(g.filme).nome + '</b><span>' + g.dur.toFixed(1) + ' s</span></div></div>';
    }
    if (!rolos.length && !g) {
      h += '<div class="fil-vazio">NENHUM ROLO AINDA.<br>O BOTÃO VERMELHO GRAVA A COMPOSIÇÃO INTEIRA — OU O TRECHO ENTRE AS MARCAS I E O — COM A PELÍCULA DESTA BITOLA. O QUE SAIR APARECE AQUI.</div>';
    }
    h += rolos.map(function (r) {
      return '<div class="fil-rolo" data-rolo="' + r.id + '">' +
        '<div class="fil-rolo-quadro">' + (r.thumb ? '<img src="' + r.thumb + '" alt="">' : '') +
          '<span class="fil-carimbo">' + carimbo(r.data) + '</span></div>' +
        '<div class="fil-rolo-info"><b>' + F.bitola(r.bitola).nome + ' · ' + F.filme(r.filme).nome + '</b>' +
          '<span>' + r.dur.toFixed(1) + ' s · ' + (r.som ? 'COM SOM' : 'EXATO') + ' · ' + (r.blob.size / 1048576).toFixed(1) + ' MB</span></div>' +
        '<div class="fil-rolo-acoes"><button data-acao="baixar">↓ BAIXAR ' + r.ext.toUpperCase() + '</button>' +
          '<button data-acao="usar">USAR NA LINHA DO TEMPO</button>' +
          '<button data-acao="apagar" class="apagar" title="Apagar este rolo">' + svg('x') + '</button></div>' +
      '</div>';
    }).join('');
    lista.innerHTML = h;
  }

  /* ==================================================================
     A TELINHA — duas páginas, no desenho do laboratório             */
  function abrirTela(qual) {
    if (est.tela === qual) { fecharTela(); return; }
    est.tela = qual;
    fecharGaveta();
    el('filTelaTit').textContent = qual === 'ajustes' ? 'FILMADORA · AJUSTES' : 'FILMADORA · A PLAQUETA';
    if (qual === 'ajustes') paginaAjustes(); else paginaSobre();
    el('filTela').classList.add('aberta');
    el('filPalco').classList.add('com-tela');
  }
  function fecharTela() {
    est.tela = null;
    el('filTela').classList.remove('aberta');
    el('filPalco').classList.remove('com-tela');
  }

  var AJUSTES = [
    ['cor', 'COR DO FILME', 0, 1, 'quanto do olhar do seletor entra. Em 0 a cor é a da bitola'],
    ['maciez', 'MACIEZ', 0, 2, 'o desfoque da lente; 1 é a calibração da bitola'],
    ['grao', 'GRÃO', 0, 2, ''],
    ['sujeira', 'SUJEIRA', 0, 2, 'poeira e fiapos na janela'],
    ['tremor', 'TREMOR', 0, 2, 'o quadro dançando na janela'],
    ['vazamento', 'VAZAMENTO', 0, 2, 'a luz que entra pelo chassi (o relâmpago liga e desliga)'],
    ['janela', 'SOMBRA DA JANELA', 0, 2, 'a borda escura do quadro']
  ];
  function paginaAjustes() {
    var pag = el('filTelaPag'), aj = F.est.aj;
    pag.innerHTML =
      '<div class="fil-sub">A PELÍCULA · ' + F.bitola(F.est.bitola).nome + '</div>' +
      '<div class="fil-nota">Cada valor MULTIPLICA a calibração da bitola: 1 é ela como veio, 0 desliga, 2 é o dobro.</div>' +
      AJUSTES.map(function (a) {
        return '<div class="fil-ctrl"><label>' + a[1] + '</label><div class="fil-ctrl-l">' +
          '<input type="range" min="' + a[2] + '" max="' + a[3] + '" step="0.01" value="' + aj[a[0]] + '" data-aj="' + a[0] + '">' +
          '<input class="fil-num" type="number" min="' + a[2] + '" max="' + a[3] + '" step="0.05" value="' + (+aj[a[0]]).toFixed(2) + '" data-ajn="' + a[0] + '"></div>' +
          (a[4] ? '<i>' + a[4] + '</i>' : '') + '</div>';
      }).join('') +
      '<div class="fil-sub">CADÊNCIA</div>' +
      '<div class="fil-pilulas">' +
        '<button class="fil-pil' + (F.est.cadencia ? ' on' : '') + '" data-cad="1">DA BITOLA · ' + F.bitola(F.est.bitola).fps + ' Q/S</button>' +
        '<button class="fil-pil' + (!F.est.cadencia ? ' on' : '') + '" data-cad="0">DO VÍDEO, COMO VEIO</button></div>' +
      '<div class="fil-sub">GRAVAÇÃO</div>' +
      '<div class="fil-pilulas">' +
        '<button class="fil-pil' + (!F.est.som ? ' on' : '') + '" data-som="0">EXATO · SEM SOM</button>' +
        '<button class="fil-pil' + (F.est.som ? ' on' : '') + '" data-som="1">TEMPO REAL · COM SOM</button></div>' +
      '<div class="fil-nota">EXATO grava quadro a quadro pelo codificador: o arquivo sai certo mesmo com efeito pesado. TEMPO REAL toca a composição gravando a saída com o áudio; máquina lenta perde quadros.</div>' +
      '<div class="fil-sub">SAÍDA</div>' +
      '<div class="fil-nota">Resolução cheia da composição, no formato e fps da janela EXPORTAR. O trecho entre as marcas I e O, quando existe; senão a sequência inteira.</div>' +
      '<button class="fil-pil fil-repor" id="filRepor">REPOR OS AJUSTES DA BITOLA</button>';

    /* a linha É o campo: a barra se enche até onde o valor está */
    function encher(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + '%'); }
    pag.querySelectorAll('[data-aj]').forEach(function (r) {
      encher(r);
      r.addEventListener('input', function () {
        var k = r.dataset.aj, v = parseFloat(r.value);
        F.est.aj[k] = v; F.guardar(); encher(r);
        var n = pag.querySelector('[data-ajn="' + k + '"]'); if (n) n.value = v.toFixed(2);
      });
    });
    pag.querySelectorAll('[data-ajn]').forEach(function (n) {
      n.addEventListener('change', function () {
        var k = n.dataset.ajn, v = parseFloat(n.value);
        if (!isFinite(v)) return;
        v = Math.max(+n.min, Math.min(+n.max, v));
        F.est.aj[k] = v; F.guardar(); n.value = v.toFixed(2);
        var r = pag.querySelector('[data-aj="' + k + '"]'); if (r) { r.value = v; encher(r); }
      });
    });
    pag.querySelectorAll('[data-cad]').forEach(function (b) {
      b.addEventListener('click', function () { F.est.cadencia = b.dataset.cad === '1'; F.guardar(); paginaAjustes(); });
    });
    pag.querySelectorAll('[data-som]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (F.est.gravando) return;
        F.est.som = b.dataset.som === '1'; F.guardar(); pintarBotoes(); paginaAjustes();
      });
    });
    el('filRepor').addEventListener('click', function () { F.reporAjustes(); pintarBotoes(); paginaAjustes(); });
  }

  function paginaSobre() {
    var b = F.bitola(F.est.bitola), f = F.filme(F.est.filme);
    el('filTelaPag').innerHTML =
      '<div class="fil-sub">A MÁQUINA</div>' +
      '<div class="fil-nota"><b>' + b.nome + '</b> — ' + b.desc + '. Filme no seletor: <b>' + f.nome + '</b>. ' +
        'Um carregador de ' + b.rolo + ' pés dura ' + Math.round(b.rolo * b.ppf / b.fps) + ' s a ' + b.fps + ' q/s.</div>' +
      '<div class="fil-sub">AS PEÇAS</div>' +
      '<div class="fil-lista">' +
        linha('VISOR', 'a composição com a película. Clique toca e pausa; a barra de espaço também.') +
        linha('BOTÃO VERMELHO', 'grava a composição (ou o trecho I–O) num rolo, com a película. Apertar de novo cancela.') +
        linha('CONTADOR', 'pés de filme desta bitola. A ' + b.fps + ' q/s, ' + b.ppf + ' quadros fazem um pé.') +
        linha('PORTA', 'os rolos gravados: baixar, usar na linha do tempo, apagar.') +
        linha('SELETOR', 'o filme: PURO é a película da bitola; os outros são os olhares 8 MM do catálogo. Arraste, role ou toque. ← → também.') +
        linha('BITOLA', 'a gaveta das máquinas: 8 mm, Super 8, 16 mm, 35 mm. Embaixo, a CARCAÇA: os couros da pasta, a calculada, ou uma foto que você sobe do PC.') +
        linha('REBOB.', 'volta ao início.') +
        linha('LUZ', 'o vazamento pelo chassi, liga e desliga.') +
        linha('SOM', 'grava em tempo real com o áudio; desligado, grava exato, sem som.') +
        linha('ENGRENAGEM', 'a telinha de ajustes.') +
      '</div>' +
      '<div class="fil-sub">DE ONDE VEM</div>' +
      '<div class="fil-nota">A película é o pacote da bitola em ESTILOS (' + b.pack + '), calibrado pela régua do 8mm Vintage Camera: metade dos efeitos, um décimo dos valores. Ela entra como o último ajuste da cadeia enquanto a máquina está aberta — na prévia e no rolo — e some ao fechar. Nada é gravado na linha do tempo sem você pedir.</div>';
  }
  function linha(nome, txt) { return '<div class="fil-item"><b>' + nome + '</b><span>' + txt + '</span></div>'; }

})(window.VE);
