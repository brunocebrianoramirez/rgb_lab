/* ============================================================
   rgb_lab — A AQUARELA · a tela
   ------------------------------------------------------------
   NÃO HÁ JANELA. Há a MESA DE LUZ de um animador flutuando no
   palco — a prancheta de madeira com o vidro aceso por baixo, a
   folha presa na barra de pinos, a caixa de tintas aberta à
   esquerda e a tira de quadros embaixo — na regra do polaroid e
   da filmadora: cada peça é uma função.

     a folha ........... o papel. Pinta-se nela com o ponteiro
                         (caneta com pressão, mouse, dedo)
     a luz (o botão) ... a mesa de luz: quanto do VÍDEO da
                         composição aparece por baixo do papel.
                         No fim do curso a luz vem POR TRÁS da
                         pintura (retroiluminação)
     o vegetal ......... o papel vegetal do animador: o quadro
                         anterior em azul e o seguinte em vermelho
     os godês .......... os oito pigmentos da paleta. Toque escolhe;
                         o ⇄ abre a gaveta dos 52
     os pincéis ........ quatro redondos (n.º 2, 6, 12 e 24)
     o pote ............ só água (molhar, diluir, floradas)
     a esponja ......... levanta tinta e água
     o pincel chato .... pincel SECO: só nas cristas do papel
     o saleiro ......... sal sobre a aguada molhada
     o conta-gotas ..... álcool: gotas que repelem o pigmento
     o secador ......... seca a folha agora
     ↶ ↷ .............. desfazer e refazer (Ctrl+Z, Ctrl+Y), doze passos
     CLARA·MÉDIA·FORTE  a diluição: quanta tinta o pincel leva
     a tira ............ os QUADROS: um por instante da composição.
                         ◀ ▶ andam (e a composição anda junto), a
                         roda do mouse sobre a tira também anda,
                         + cria, ⧉ copia o anterior, ▶ folheia
     EM 1s / 2s / 3s ... a cadência: um desenho por quadro, por
                         dois, por três — como se anima à mão
     USAR .............. a sequência vai para a linha do tempo,
                         POR CIMA do vídeo, em modo Multiplicar
     i / ⚙ ............. a plaqueta e os ajustes (o papel, a
                         secagem, a granulação, o modo código…)

   O motor é o js/aquarela.js. Aqui só há DOM.
   ============================================================ */
(function (VE) {
  'use strict';

  var U = VE.aquarelaui = {};
  var A = null;                 /* VE.aquarela, resolvido na abertura */
  var M = null;                 /* o motor aberto */
  var est = null;

  function el(id) { return document.getElementById(id); }
  function $(s, raiz) { return (raiz || document).querySelector(s); }
  function $$(s, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m, t) { if (VE.app && VE.app.toast) VE.app.toast(m, t); }

  var ICO = {
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    info: '<path d="M12 4.6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9.6 9.4h3.6v7.4h1.7v2H9.3v-2h1.7v-5.4H9.6z"/>',
    eng: '<path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3H9l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L4.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h6l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>',
    desfazer: '<path d="M9 7.5V4L3.5 9 9 14v-3.5c4 0 7 1.5 8.5 5 .3-4.7-3-8-8.5-8z"/>',
    refazer: '<path d="M15 7.5V4l5.5 5-5.5 5v-3.5c-4 0-7 1.5-8.5 5-.3-4.7 3-8 8.5-8z"/>',
    ant: '<path d="M15.5 5v14L7 12z"/>',
    prox: '<path d="M8.5 5v14L17 12z"/>',
    play: '<path d="M8 5.2v13.6L18.6 12z"/>',
    pausa: '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
    mais: '<path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/>',
    copiar: '<path d="M8 4h10v12h-2V6H8zM6 8h10v12H6z"/>',
    lixo: '<path d="M7 7h10l-.8 12.2a1.5 1.5 0 0 1-1.5 1.4H9.3a1.5 1.5 0 0 1-1.5-1.4zM9.5 3.5h5l.8 2H8.7zM5 5.5h14v1.6H5z"/>',
    baixar: '<path d="M11 3h2v9.2l3.2-3.1 1.4 1.4L12 16.1 6.4 10.5l1.4-1.4 3.2 3.1zM4 17h16v3H4z"/>',
    usar: '<path d="M4 6h16v12H4zm2 2v8h12V8zm3 1.5l5 2.5-5 2.5z"/>',
    clipe: '<path d="M3 6h18v12H3zm2 2v8h14V8zM6 5h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zM6 17h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2z"/>'
  };
  function svg(n) { return '<svg viewBox="0 0 24 24">' + ICO[n] + '</svg>'; }

  var PINCEIS = [
    { n: 2, raio: 2.2 }, { n: 6, raio: 5 }, { n: 12, raio: 10 }, { n: 24, raio: 20 }
  ];
  var FERR_NOME = { pincel: 'PINCEL', agua: 'SÓ ÁGUA', seco: 'PINCEL SECO', esponja: 'ESPONJA', sal: 'SAL', alcool: 'ÁLCOOL' };

  /* ==================================================================
     ABRIR / FECHAR                                                  */
  U.abrir = function (opts) {
    A = VE.aquarela;
    if (!A) { toast('o motor da aquarela não carregou', 'err'); return; }
    montar();
    if (!est) {
      est = {
        raf: 0, tela: null, gaveta: false, pincel: 2, ferr: 'pincel', slot: 0,
        folheando: 0, fundoPedido: -1, secagem: 'normal', defin: 1024, base: 24,
        vegetal: true, vegForca: 0.55, codigo: false, arr: null, ultPasso: 0,
        luzKnob: 0.55, diluicao: 'media', ultRolagem: 0
      };
      carregarPrefs();
    }
    el('aqPalco').classList.remove('hidden');
    /* com a mesa aberta o laboratório não precisa desenhar a composição a
       cada quadro: o fundo é pedido quando o quadro muda (pedirFundo), pelo
       mesmo caminho da exportação. pauseLoop também pausa a reprodução. */
    if (VE.app && VE.app.pauseLoop) VE.app.pauseLoop(); else if (VE.app && VE.app.playing) VE.app.pause();
    prepararFolha(opts && opts.reabrir);
    vestir();
    pintarCaixa(); pintarPinceis(); pintarTira(); pintarLuz();
    A.codigo.ligado = est.codigo; A.codigo.ouvinte = pintarCodigo;
    el('aqCodigo').classList.toggle('hidden', !est.codigo);
    pedirFundo();
    if (!est.raf) laco();
  };
  U.fechar = function () {
    if (!est) return;
    if (est.folheando) pararFolhear();
    el('aqPalco').classList.add('hidden');
    fecharTela(); fecharGaveta();
    cancelAnimationFrame(est.raf); est.raf = 0;
    A.codigo.ouvinte = null;
    if (VE.app && VE.app.resumeLoop) VE.app.resumeLoop();
    guardarPrefs();
  };
  U.aberta = function () { return !!(est && el('aqPalco') && !el('aqPalco').classList.contains('hidden')); };

  /* a folha nasce do tamanho da composição (a proporção dela, com o lado
     maior na DEFINIÇÃO escolhida); sem projeto, 16:9                 */
  function tamanhoDaFolha() {
    var p = VE.project, cw = p ? p.canvas.w : 1920, ch = p ? p.canvas.h : 1080, lado = est.defin;
    var esc = lado / Math.max(cw, ch);
    return { w: Math.max(64, Math.round(cw * esc / 2) * 2), h: Math.max(64, Math.round(ch * esc / 2) * 2) };
  }
  function prepararFolha(reabrir) {
    var t = tamanhoDaFolha(), cv = el('aqFolha');
    var novo = !M || !M.gl || M.w !== t.w || M.h !== t.h;
    if (novo) {
      M = A.abrirMotor(cv, t.w, t.h, { papel: est.papel || 'frio', paleta: est.paleta });
      if (M.falhou) { toast('aquarela: ' + M.falhou, 'err'); return; }
      aplicarAjustes();
      A.novoFilme(t.w, t.h);
      var F = A.filme;
      F.fps = est.base / (F.passo || 2);
      F.inicio = VE.project ? Math.floor(VE.project.time * F.fps + 1e-6) / F.fps : 0;
      F.modo = est.modo || 'video';
    }
    aplicarFerramenta();
    ajustarVidro();
  }

  /* ==================================================================
     A MONTAGEM — uma vez                                            */
  function montar() {
    if (el('aqPalco')) return;
    var d = document.createElement('div');
    d.className = 'aq-palco hidden';
    d.id = 'aqPalco';
    d.innerHTML =
      '<button class="aq-sair" id="aqFechar" title="Fechar (Esc)">' + svg('x') + '</button>' +
      '<div class="aq-conjunto" id="aqConjunto">' +
        '<div class="aq-mesa" id="aqMesa">' +
          '<i class="aq-parafuso" style="left:1.4%;top:2.4%"></i><i class="aq-parafuso" style="right:1.4%;top:2.4%"></i>' +
          '<i class="aq-parafuso" style="left:1.4%;bottom:2.6%"></i><i class="aq-parafuso" style="right:1.4%;bottom:2.6%"></i>' +

          /* ---- a caixa de tintas ---- */
          '<div class="aq-caixa" id="aqCaixa">' +
            '<div class="aq-caixa-tampa"><b>AQUARELA</b><span>52 PIGMENTOS · KUBELKA-MUNK</span>' +
              '<button class="aq-mini" id="aqDesfazer" title="Desfazer (Ctrl+Z)">' + svg('desfazer') + '</button>' +
              '<button class="aq-mini" id="aqRefazer" title="Refazer (Ctrl+Y)">' + svg('refazer') + '</button></div>' +
            '<div class="aq-godes" id="aqGodes"></div>' +
            '<div class="aq-pinceis" id="aqPinceis"></div>' +
            '<div class="aq-diluicao" id="aqDiluicao" title="Quanta tinta o pincel leva: aguada clara, normal ou carregada">' +
              '<button data-dil="clara">CLARA</button><button data-dil="media" class="on">MÉDIA</button><button data-dil="forte">FORTE</button></div>' +
            '<div class="aq-utensilios">' +
              '<button class="aq-ut aq-pote" data-ferr="agua" title="Só água: molhar o papel, diluir, fazer floradas"><i></i><small>ÁGUA</small></button>' +
              '<button class="aq-ut aq-esponja" data-ferr="esponja" title="Esponja: levanta a tinta molhada (a que mancha resiste)"><i></i><small>ESPONJA</small></button>' +
              '<button class="aq-ut aq-seco" data-ferr="seco" title="Pincel seco: a tinta pega só nas cristas do papel"><i></i><small>SECO</small></button>' +
              '<button class="aq-ut aq-saleiro" data-ferr="sal" title="Sal sobre a aguada molhada: os cristais bebem a água e deixam estrelas claras"><i></i><small>SAL</small></button>' +
              '<button class="aq-ut aq-gotas" data-ferr="alcool" title="Álcool: cada gota repele o pigmento e abre um olho claro de borda escura"><i></i><small>ÁLCOOL</small></button>' +
              '<button class="aq-ut aq-secador" id="aqSecar" title="Secar a folha agora"><i></i><small>SECAR</small></button>' +
            '</div>' +
            '<div class="aq-ferr-nome" id="aqFerrNome">PINCEL N.º 12</div>' +
          '</div>' +

          /* ---- a mesa de luz ---- */
          '<div class="aq-vidro" id="aqVidro">' +
            '<div class="aq-pinos"><i></i><i class="fenda"></i><i></i></div>' +
            '<div class="aq-papel" id="aqPapel"><canvas id="aqFolha"></canvas><canvas class="aq-folhear hidden" id="aqFolhear"></canvas>' +
              '<div class="aq-cursor" id="aqCursor"></div></div>' +
            '<div class="aq-carimbo" id="aqCarimbo">QUADRO 01</div>' +
          '</div>' +

          /* ---- a coluna da direita ---- */
          '<div class="aq-coluna">' +
            '<div class="aq-luz" id="aqLuz" title="A mesa de luz: arraste. Quanto do vídeo aparece por baixo do papel; no fim do curso a luz vem por trás da pintura">' +
              '<i class="aq-knob"><b></b></i><small>LUZ</small></div>' +
            '<button class="aq-chave" id="aqVegetal" title="Papel vegetal: o quadro anterior em azul, o seguinte em vermelho"><i></i><small>VEGETAL</small></button>' +
            '<button class="aq-bt" id="aqInfo" title="O que cada peça faz">' + svg('info') + '</button>' +
            '<button class="aq-bt" id="aqAjustes" title="Ajustes: papel, secagem, granulação, modo código">' + svg('eng') + '</button>' +
            '<div class="aq-espaco"></div>' +
            '<button class="aq-bt" id="aqDoClipe" title="Abrir a aquarela do clipe escolhido na linha do tempo, para continuar">' + svg('clipe') + '</button>' +
            '<button class="aq-bt" id="aqBaixar" title="Baixar os quadros em PNG (.zip)">' + svg('baixar') + '</button>' +
            '<button class="aq-usar" id="aqUsar" title="Usar na linha do tempo: a sequência entra por cima do vídeo">' + svg('usar') + '<small>USAR</small></button>' +
          '</div>' +

          /* ---- a tira de quadros ---- */
          '<div class="aq-tira" id="aqTira">' +
            '<div class="aq-tira-nav">' +
              '<button class="aq-nav" id="aqAnt" title="Quadro anterior (←)">' + svg('ant') + '</button>' +
              '<div class="aq-contador" id="aqContador"><b>01</b><span>/ 01</span><i>0:00.00</i></div>' +
              '<button class="aq-nav" id="aqProx" title="Quadro seguinte (→)">' + svg('prox') + '</button>' +
            '</div>' +
            '<div class="aq-tira-lista" id="aqLista"></div>' +
            '<div class="aq-tira-acoes">' +
              '<button class="aq-nav" id="aqNovo" title="Quadro novo depois deste">' + svg('mais') + '</button>' +
              '<button class="aq-nav" id="aqCopiar" title="Copiar o quadro anterior para este">' + svg('copiar') + '</button>' +
              '<button class="aq-nav" id="aqApagar" title="Apagar este quadro">' + svg('lixo') + '</button>' +
              '<button class="aq-nav aq-folhear-bt" id="aqFolheia" title="Folhear: tocar a sequência (espaço)">' + svg('play') + '</button>' +
              '<div class="aq-cadencia" id="aqCadencia">' +
                '<button data-passo="1">EM 1s</button><button data-passo="2" class="on">EM 2s</button><button data-passo="3">EM 3s</button></div>' +
            '</div>' +
          '</div>' +

          '<div class="aq-codigo hidden" id="aqCodigo"><b>MODO CÓDIGO</b><pre id="aqCodigoTxt"></pre></div>' +
        '</div>' +

        /* ---- a telinha ---- */
        '<div class="aq-tela" id="aqTela">' +
          '<div class="aq-tela-h"><i class="aq-led"></i><h4 id="aqTelaTit">AJUSTES</h4>' +
            '<button class="aq-tela-x" id="aqTelaX" title="Fechar">' + svg('x') + '</button></div>' +
          '<div class="aq-tela-pag" id="aqTelaPag"></div>' +
        '</div>' +
      '</div>' +

      /* ---- a gaveta dos pigmentos ---- */
      '<div class="aq-gaveta" id="aqGaveta">' +
        '<div class="aq-gav-h"><b>OS 52 PIGMENTOS</b><span id="aqGavPara">para o godê 1</span><button class="aq-tela-x" id="aqGavX" title="Fechar">' + svg('x') + '</button></div>' +
        '<div class="aq-gav-lista" id="aqGavLista"></div>' +
      '</div>';
    document.body.appendChild(d);
    ligar();
  }

  /* ==================================================================
     A PELE — madeira calculada (veios) para a mesa                 */
  function madeira(D) {
    var Wd = D, Hd = Math.round(D * 0.6);
    var cv = document.createElement('canvas'); cv.width = Wd; cv.height = Hd;
    var c = cv.getContext('2d'), im = c.createImageData(Wd, Hd), d = im.data;
    function h2(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
    function ru(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      var a = h2(xi, yi), b = h2(xi + 1, yi), cc = h2(xi, yi + 1), dd = h2(xi + 1, yi + 1);
      return a + (b - a) * fx + (cc - a) * fy + (a - b - cc + dd) * fx * fy;
    }
    for (var y = 0; y < Hd; y++) for (var x = 0; x < Wd; x++) {
      /* veios AO COMPRIDO: faixas em y, onduladas devagar em x (a primeira
         versão dobrava em zigue-zague e parecia espinha de peixe)     */
      var wob = ru(x / 210, y / 70) * 22 + ru(x / 60, y / 22) * 4;
      var v = 0.5 + 0.5 * Math.sin((y + wob) * 0.21);
      v = Math.pow(v, 1.5);
      var grao = ru(x / 1.3, y / 7) * 0.14 + ru(x / 9, y / 2.2) * 0.06;
      var l = 0.44 + v * 0.28 + grao;
      var i = (y * Wd + x) * 4;
      d[i] = Math.round(176 * l); d[i + 1] = Math.round(122 * l); d[i + 2] = Math.round(78 * l); d[i + 3] = 255;
    }
    c.putImageData(im, 0, 0);
    return cv.toDataURL('image/jpeg', 0.86);
  }
  function vestir() {
    var p = el('aqPalco');
    if (!p.style.getPropertyValue('--aq-madeira')) p.style.setProperty('--aq-madeira', 'url(' + madeira(1200) + ')');
  }

  /* o vidro tem a proporção da folha, dentro da caixa que a mesa dá */
  function ajustarVidro() {
    var vidro = el('aqVidro'), pap = el('aqPapel');
    var r = vidro.getBoundingClientRect(); if (!r.width || !M) return;
    var padX = r.width * 0.045, padT = r.height * 0.13, padB = r.height * 0.06;
    var aw = r.width - padX * 2, ah = r.height - padT - padB, ar = M.w / M.h, w = aw, h = aw / ar;
    if (h > ah) { h = ah; w = ah * ar; }
    pap.style.width = w + 'px'; pap.style.height = h + 'px';
    pap.style.top = (padT + (ah - h) / 2) + 'px';
    var fl = el('aqFolhear'); fl.width = M.w; fl.height = M.h;
  }

  /* ==================================================================
     O LAÇO — o motor dá passos e a folha se redesenha                */
  function laco() {
    est.raf = requestAnimationFrame(laco);
    if (!U.aberta() || !M || !M.gl) return;
    if (est.folheando) return;
    var t0 = performance.now();
    var deu = M.passo();
    if (deu && performance.now() - t0 < 7) M.passo();
    if (M.molhada || est.sujo || est.redesenha) { M.desenhar(); est.redesenha = false; }
    if (M.molhada) est.sujo = true;
    if (!M.molhada && est.sujo) { est.sujo = false; A.filme.quadros[A.filme.atual].sujo = true; M.desenhar(); }
    if ((est.ultPasso++ & 7) === 0) pintarDesfazer();
  }

  /* o fundo: a composição no instante do quadro, lida do #gl depois de
     uma busca exata (a mesma mecânica da exportação)                 */
  function pedirFundo() {
    var F = A.filme, i = F.atual, gl = el('gl');
    if (!VE.project || !gl || !M) { if (M) M.setFundo(null); est.redesenha = true; return; }
    var t = A.tempoDoQuadro(i);
    if (t > VE.duration()) { M.setFundo(null); est.redesenha = true; return; }
    var pedido = ++est.fundoPedido;
    VE.project.time = Math.min(VE.duration(), t);
    VE.tl && VE.tl.setTime && VE.tl.setTime(VE.project.time);
    VE.media.seekAll(VE.project.time).then(function () {
      if (pedido !== est.fundoPedido || !U.aberta()) return;
      VE.app.renderNow();
      M.setFundo(gl);
      est.redesenha = true;
    }).catch(function () { });
  }

  /* ==================================================================
     A CAIXA DE TINTAS                                               */
  function pintarCaixa() {
    var g = el('aqGodes');
    g.innerHTML = M.paleta.map(function (id, i) {
      var p = A.PIGBY[id];
      if (!p) return '<button class="aq-gode vazio" data-gode="' + i + '" title="Godê vazio: toque para escolher um pigmento"><i></i><small>—</small></button>';
      var cor = A.corDaAguada(id, 1.2), cor2 = A.corDaAguada(id, 3.5);
      return '<button class="aq-gode' + (i === est.slot ? ' on' : '') + '" data-gode="' + i + '" style="--c1:' + cor + ';--c2:' + cor2 + '" title="' + esc(p.nome + ' · ' + p.ci) + '">' +
        '<i></i><small>' + esc(p.nome.split(' ')[0] === 'Amarelo' || p.nome.split(' ')[0] === 'Azul' || p.nome.split(' ')[0] === 'Verde' || p.nome.split(' ')[0] === 'Vermelho' ? p.nome.split(' ').slice(0, 2).join(' ') : p.nome.split(' ')[0]) + '</small>' +
        '<u class="aq-trocar" data-trocar="' + i + '" title="Trocar o pigmento deste godê">⇄</u></button>';
    }).join('');
  }
  function pintarPinceis() {
    el('aqPinceis').innerHTML = PINCEIS.map(function (p, i) {
      return '<button class="aq-pincel' + (est.pincel === i && est.ferr === 'pincel' ? ' on' : '') + '" data-pincel="' + i + '" style="--n:' + (i + 1) + '" title="Pincel redondo n.º ' + p.n + '"><i></i><small>' + p.n + '</small></button>';
    }).join('');
    $$('.aq-ut', el('aqCaixa')).forEach(function (b) { b.classList.toggle('on', b.dataset.ferr === est.ferr); });
    var nome = est.ferr === 'pincel' ? 'PINCEL N.º ' + PINCEIS[est.pincel].n : FERR_NOME[est.ferr];
    var pig = A.PIGBY[M.paleta[est.slot]];
    if ((est.ferr === 'pincel' || est.ferr === 'seco') && pig) nome += ' · ' + pig.nome.toUpperCase();
    el('aqFerrNome').textContent = nome;
    $$('#aqDiluicao button').forEach(function (b) { b.classList.toggle('on', b.dataset.dil === est.diluicao); });
    pintarDesfazer();
  }
  function pintarDesfazer() {
    if (!M) return;
    el('aqDesfazer').disabled = !M.podeDesfazer();
    el('aqRefazer').disabled = !M.podeRefazer();
  }
  /* a diluição: quanta tinta (e quanta água) o pincel leva a cada toque.
     Uma pincelada normal sobrepõe uns três toques: MÉDIA dá espessura
     ~2 (cor cheia), CLARA ~1 (a aguada), FORTE ~3,5 (quase massa)     */
  var DILUICAO = { clara: { carga: 0.35, agua: 0.42 }, media: { carga: 0.75, agua: 0.30 }, forte: { carga: 1.3, agua: 0.20 } };
  function aplicarFerramenta() {
    if (!M) return;
    var r = PINCEIS[est.pincel].raio, dil = DILUICAO[est.diluicao] || DILUICAO.media;
    var o = { raio: r, slot: est.slot, carga: dil.carga, agua: dil.agua };
    if (est.ferr === 'agua') { o.raio = r * 1.3; o.agua = 0.5; }
    if (est.ferr === 'esponja') o.raio = r * 1.6;
    if (est.ferr === 'seco') o.raio = r * 1.2;
    if (est.ferr === 'sal') o.raio = Math.max(14, r * 2.2);
    if (est.ferr === 'alcool') o.raio = Math.max(6, r * 0.9);
    M.ferramenta(est.ferr, o);
    est.raioTela = o.raio;
  }

  /* a gaveta dos 52 */
  function abrirGaveta(slot) {
    est.gaveta = slot;
    el('aqGavPara').textContent = 'para o godê ' + (slot + 1);
    var lista = el('aqGavLista'), h = '';
    A.GRUPOS.forEach(function (gr, gi) {
      h += '<div class="aq-gav-grupo">' + gr + '</div><div class="aq-gav-linha">';
      A.PIGMENTOS.filter(function (p) { return p.grupo === gi; }).forEach(function (p) {
        var na = M.paleta.indexOf(p.id);
        h += '<button class="aq-tubo' + (na >= 0 ? ' na-paleta' : '') + '" data-pig="' + p.id + '" style="--c1:' + A.corDaAguada(p.id, 1.2) + ';--c2:' + A.corDaAguada(p.id, 3.5) + '" title="' + esc(p.nome + ' · ' + p.ci + ' · densidade ' + p.dens + ' · mancha ' + p.mancha + ' · granulação ' + p.gran) + '">' +
          '<i></i><b>' + esc(p.nome) + '</b><small>' + esc(p.ci) + (p.gran >= 0.5 ? ' · GRANULA' : '') + (p.mancha >= 2.8 ? ' · MANCHA' : '') + (na >= 0 ? ' · GODÊ ' + (na + 1) : '') + '</small></button>';
      });
      h += '</div>';
    });
    lista.innerHTML = h;
    el('aqGaveta').classList.add('aberta');
  }
  function fecharGaveta() { est.gaveta = false; el('aqGaveta').classList.remove('aberta'); }

  /* ==================================================================
     A LUZ                                                           */
  function pintarLuz() {
    var k = est.luzKnob, knob = $('.aq-knob', el('aqLuz'));
    knob.style.setProperty('--ang', (-135 + k * 270) + 'deg');
    el('aqLuz').style.setProperty('--glow', Math.min(1, k * 1.6).toFixed(2));
    el('aqVidro').style.setProperty('--glow', Math.min(1, k * 1.4).toFixed(2));
    el('aqVegetal').classList.toggle('on', est.vegetal);
    if (!M) return;
    /* 0..0,7 é o vídeo por baixo; de 0,7 a 1 a luz passa para trás da pintura */
    M.luz = Math.min(1, k / 0.7);
    M.retro = k <= 0.7 ? 0 : (k - 0.7) / 0.3;
    M.vegA = est.vegetal ? est.vegForca : 0; M.vegP = est.vegetal ? est.vegForca * 0.8 : 0;
    est.redesenha = true;
  }

  /* ==================================================================
     A TIRA DE QUADROS                                               */
  function pintarTira() {
    var F = A.filme, n = F.quadros.length, i = F.atual;
    el('aqContador').innerHTML = '<b>' + String(i + 1).padStart(2, '0') + '</b><span>/ ' + String(n).padStart(2, '0') + '</span><i>' + tc(A.tempoDoQuadro(i)) + '</i>';
    el('aqCarimbo').textContent = 'QUADRO ' + String(i + 1).padStart(2, '0') + ' · ' + F.fps + ' Q/S';
    var L = el('aqLista');
    L.innerHTML = F.quadros.map(function (q, k) {
      return '<button class="aq-quadro' + (k === i ? ' on' : '') + (q.thumb ? '' : ' vazio') + '" data-q="' + k + '" title="Quadro ' + (k + 1) + ' · ' + tc(A.tempoDoQuadro(k)) + '">' +
        (q.thumb ? '<img src="' + q.thumb + '" alt="">' : '<i></i>') + '<small>' + (k + 1) + '</small></button>';
    }).join('');
    var on = $('.aq-quadro.on', L);
    if (on) { var lr = L.getBoundingClientRect(), orr = on.getBoundingClientRect(); if (orr.left < lr.left || orr.right > lr.right) on.scrollIntoView({ inline: 'center', block: 'nearest' }); }
    $$('#aqCadencia button').forEach(function (b) { b.classList.toggle('on', +b.dataset.passo === F.passo); });
    el('aqAnt').disabled = i <= 0;
  }
  function tc(t) {
    var m = Math.floor(t / 60), s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
  }
  var trocando = false;
  function irPara(i) {
    if (trocando || !M) return;
    if (i < 0) return;
    trocando = true;
    var F = A.filme;
    A.irPara(i).then(function () {
      trocando = false;
      vegetais();
      pintarTira(); pedirFundo();
      est.redesenha = true;
    }).catch(function (e) { trocando = false; toast('não consegui trocar de quadro: ' + (e && e.message), 'err'); });
  }
  /* o vegetal: o anterior e o seguinte, dos bitmaps já decodificados */
  function vegetais() {
    var F = A.filme, a = F.quadros[F.atual - 1], p = F.quadros[F.atual + 1];
    M.setVegetal('ant', a && a.bitmap ? a.bitmap : null);
    M.setVegetal('prox', p && p.bitmap ? p.bitmap : null);
  }
  function novoQuadro() {
    var F = A.filme;
    if (trocando) return;
    F.quadros.splice(F.atual + 1, 0, {});
    irPara(F.atual + 1);
  }
  function apagarQuadro() {
    var F = A.filme;
    if (trocando || F.quadros.length <= 1) { if (F.quadros.length <= 1) { M.limpar(); F.quadros[0] = {}; pintarTira(); est.redesenha = true; } return; }
    trocando = true;
    A.apagarQuadro(F.atual).then(function () { trocando = false; vegetais(); pintarTira(); pedirFundo(); est.redesenha = true; });
  }
  function copiarAnterior() {
    if (trocando) return;
    A.copiarAnterior().then(function (ok) {
      if (!ok) { toast('não há quadro anterior com pintura', 'err'); return; }
      est.redesenha = true; pintarDesfazer(); toast('o quadro anterior foi copiado para este');
    });
  }
  function mudarPasso(p) {
    var F = A.filme;
    F.passo = p; F.fps = est.base / p;
    F.inicio = Math.floor(F.inicio * F.fps + 1e-6) / F.fps;
    pintarTira(); pedirFundo();
  }

  /* folhear: a sequência toca no vidro (os PNGs guardados, sobre o papel) */
  function folhear() {
    var F = A.filme;
    if (est.folheando) { pararFolhear(); return; }
    A.guardarAtual().then(function () {
      var prontos = F.quadros.filter(function (q) { return q.bitmap; }).length;
      if (prontos < 2) { toast('pinte pelo menos dois quadros para folhear'); return; }
      var cv = el('aqFolhear'), c = cv.getContext('2d'), i = 0, t0 = performance.now();
      cv.classList.remove('hidden');
      el('aqFolheia').innerHTML = svg('pausa');
      est.folheando = 1;
      function quadro() {
        if (!est.folheando) return;
        var k = Math.floor((performance.now() - t0) / 1000 * F.fps) % F.quadros.length, q = F.quadros[k];
        c.fillStyle = '#f2efe6'; c.fillRect(0, 0, cv.width, cv.height);
        if (q && q.bitmap) c.drawImage(q.bitmap, 0, 0, cv.width, cv.height);
        el('aqContador').innerHTML = '<b>' + String(k + 1).padStart(2, '0') + '</b><span>/ ' + String(F.quadros.length).padStart(2, '0') + '</span><i>' + tc(A.tempoDoQuadro(k)) + '</i>';
        est.folheando = requestAnimationFrame(quadro);
      }
      quadro();
    });
  }
  function pararFolhear() {
    cancelAnimationFrame(est.folheando); est.folheando = 0;
    el('aqFolhear').classList.add('hidden');
    el('aqFolheia').innerHTML = svg('play');
    pintarTira(); est.redesenha = true;
  }

  /* ==================================================================
     USAR, BAIXAR, DO CLIPE                                          */
  function usar() {
    if (trocando) return;
    var F = A.filme;
    A.guardarAtual().then(function () {
      var pintados = F.quadros.filter(function (q) { return q.png; }).length;
      if (!pintados) { toast('pinte alguma coisa primeiro', 'err'); return; }
      var n = Object.keys(VE.sources).filter(function (k) { return VE.sources[k].kind === 'quadros'; }).length + 1;
      var id = A.registrarFonte('AQUARELA ' + String(n).padStart(2, '0'));
      if (!id) { toast('não consegui montar a sequência', 'err'); return; }
      var s = VE.sources[id], primeiro = !VE.project;
      VE.app.ensureProject(s.w, s.h, Math.max(4, F.inicio + s.duration + 1));
      if (primeiro) VE.setCanvas(s.w, s.h, 'src');
      var c = VE.addMedia({ kind: 'quadros', name: s.name, src: id, start: F.inicio, dur: s.duration, fit: 'contain', over: true });
      /* sobre o vídeo, a aguada é uma TRANSPARÊNCIA: Multiplicar (índice 3 em VE.BLENDS) */
      if (F.modo === 'video') c.blend = 3;
      if (F.inicio + s.duration > VE.duration()) VE.setDuration(F.inicio + s.duration);
      VE.pushHistory(); VE.emit('project'); VE.emit('sources');
      U.fechar();
      VE.shell.go('video');
      if (VE.view && VE.view.fit) VE.view.fit();
      toast('a aquarela virou camada por cima do vídeo — ' + pintados + ' quadro' + (pintados > 1 ? 's' : '') + ' a ' + F.fps + ' q/s' + (F.modo === 'video' ? ', em Multiplicar' : ', no papel'), 'ok');
    }).catch(function (e) { toast('não deu: ' + (e && e.message), 'err'); });
  }
  function baixar() {
    var F = A.filme;
    A.guardarAtual().then(function () {
      var files = [];
      F.quadros.forEach(function (q, i) { if (q.png) files.push({ name: 'aquarela-' + String(i + 1).padStart(3, '0') + '.png', data: q.png }); });
      if (!files.length) { toast('não há quadro pintado', 'err'); return; }
      if (!VE.zip) { toast('o escritor de zip não carregou', 'err'); return; }
      VE.saveFile('rgb_lab-aquarela-' + F.fps + 'qps-' + files.length + 'quadros.zip', VE.zip(files));
    });
  }
  /* abrir do clipe: a sequência de um clipe 'quadros' volta para a mesa */
  function doClipe() {
    var sel = VE.selected && VE.selected();
    var s = sel && VE.sources[sel.src];
    if (!s || s.kind !== 'quadros') { toast('escolha na linha do tempo um clipe de AQUARELA', 'err'); return; }
    if (!s.blob) { toast('esse clipe não guarda o rolo', 'err'); return; }
    A.desempacotarRolo(s.blob).then(function (r) {
      if (!r.estados) { toast('esse rolo não tem os estados — só os quadros prontos', 'err'); return; }
      var t = { w: r.cab.w, h: r.cab.h };
      M = A.abrirMotor(el('aqFolha'), t.w, t.h, { papel: est.papel || 'frio', paleta: r.cab.paleta || est.paleta });
      if (r.cab.paleta) M.paleta = r.cab.paleta.slice(0, 8);
      aplicarAjustes(); aplicarFerramenta(); ajustarVidro();
      A.novoFilme(t.w, t.h);
      var F = A.filme;
      F.fps = r.cab.fps; F.passo = Math.max(1, Math.round(est.base / r.cab.fps)); F.inicio = sel.start; F.modo = s.modo || 'video';
      F.quadros = r.quadros.map(function (q, i) { return { png: q.png, blob: q.blob, w: q.w, h: q.h, estado: r.estados[i] }; });
      return Promise.all(F.quadros.map(function (q) { return A.miniatura(q); })).then(function () {
        F.atual = 0;
        return A.reporQuadro(0);
      }).then(function () { pintarCaixa(); pintarPinceis(); vegetais(); pintarTira(); pedirFundo(); est.redesenha = true; toast('a aquarela do clipe está na mesa: ' + F.quadros.length + ' quadros'); });
    }).catch(function (e) { toast('não consegui abrir: ' + (e && e.message), 'err'); });
  }

  /* ==================================================================
     A TELINHA                                                       */
  function abrirTela(qual) {
    if (est.tela === qual) { fecharTela(); return; }
    est.tela = qual; fecharGaveta();
    el('aqTelaTit').textContent = qual === 'ajustes' ? 'AQUARELA · AJUSTES' : 'AQUARELA · A PLAQUETA';
    if (qual === 'ajustes') paginaAjustes(); else paginaSobre();
    el('aqTela').classList.add('aberta'); el('aqPalco').classList.add('com-tela');
  }
  function fecharTela() { est.tela = null; el('aqTela').classList.remove('aberta'); el('aqPalco').classList.remove('com-tela'); }

  var AJ = [
    ['granMul', 'GRANULAÇÃO', 0, 2, 'quanto o pigmento assenta nos vales do papel. 1 é o pigmento como ele é'],
    ['borda', 'BORDA ESCURA', 0, 2, 'a água escoa para a beira da mancha e o pigmento vai atrás — a assinatura da aquarela'],
    ['floradas', 'FLORADAS', 0, 1, 'a água que caminha pelo papel molha de novo o que estava secando e empurra o pigmento (os "blooms")'],
    ['vegForca', 'VEGETAL', 0, 1, 'a força do papel vegetal']
  ];
  function paginaAjustes() {
    var pag = el('aqTelaPag'), aj = est.aj || (est.aj = { granMul: 1, borda: 1, floradas: 1 });
    pag.innerHTML =
      '<div class="aq-sub">O PAPEL</div>' +
      '<div class="aq-pilulas">' + Object.keys(A.PAPEIS).map(function (k) { return '<button class="aq-pil' + ((est.papel || 'frio') === k ? ' on' : '') + '" data-papel="' + k + '">' + A.PAPEIS[k].nome + '</button>'; }).join('') + '</div>' +
      '<div class="aq-nota">Trocar o papel troca o relevo da folha inteira: o que já foi pintado continua, mas assenta noutro grão daqui em diante.</div>' +
      '<div class="aq-sub">A ÁGUA</div>' +
      '<div class="aq-pilulas">' + [['rapida', 'SECAGEM RÁPIDA'], ['normal', 'NORMAL'], ['lenta', 'LENTA']].map(function (s) { return '<button class="aq-pil' + (est.secagem === s[0] ? ' on' : '') + '" data-secagem="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div>' +
      AJ.map(function (a) {
        var v = a[0] === 'vegForca' ? est.vegForca : aj[a[0]];
        return '<div class="aq-ctrl"><label>' + a[1] + '</label><div class="aq-ctrl-l">' +
          '<input type="range" min="' + a[2] + '" max="' + a[3] + '" step="0.01" value="' + v + '" data-aj="' + a[0] + '">' +
          '<input class="aq-num" type="number" min="' + a[2] + '" max="' + a[3] + '" step="0.05" value="' + (+v).toFixed(2) + '" data-ajn="' + a[0] + '"></div><i>' + a[4] + '</i></div>';
      }).join('') +
      '<div class="aq-sub">OS QUADROS</div>' +
      '<div class="aq-pilulas">' + [24, 25, 30].map(function (b) { return '<button class="aq-pil' + (est.base === b ? ' on' : '') + '" data-base="' + b + '">' + b + ' Q/S</button>'; }).join('') + '</div>' +
      '<div class="aq-nota">A cadência da composição. EM 1s pinta um desenho por quadro; EM 2s, um a cada dois (12 q/s a 24) — é como se anima à mão.</div>' +
      '<div class="aq-pilulas">' + [512, 768, 1024, 1280].map(function (d) { return '<button class="aq-pil' + (est.defin === d ? ' on' : '') + '" data-defin="' + d + '">' + d + ' PX</button>'; }).join('') + '</div>' +
      '<div class="aq-nota">A definição da folha (o lado maior). Mais pixels, mais detalhe e mais lento; a mudança vale para uma folha NOVA.</div>' +
      '<div class="aq-sub">A SAÍDA</div>' +
      '<div class="aq-pilulas">' +
        '<button class="aq-pil' + ((est.modo || 'video') === 'video' ? ' on' : '') + '" data-modo="video">SOBRE O VÍDEO</button>' +
        '<button class="aq-pil' + (est.modo === 'papel' ? ' on' : '') + '" data-modo="papel">NO PAPEL</button></div>' +
      '<div class="aq-nota">SOBRE O VÍDEO: a aguada vai transparente, em Multiplicar, e o vídeo aparece através dela. NO PAPEL: o quadro sai opaco, com o papel — a animação por si.</div>' +
      '<div class="aq-sub">MODO CÓDIGO</div>' +
      '<div class="aq-pilulas"><button class="aq-pil' + (est.codigo ? ' on' : '') + '" data-codigo="1">LIGADO</button><button class="aq-pil' + (!est.codigo ? ' on' : '') + '" data-codigo="0">DESLIGADO</button></div>' +
      '<div class="aq-nota">Mostra na mesa as chamadas que o simulador faz enquanto se pinta — as de verdade, com os números de verdade.</div>' +
      '<button class="aq-pil aq-repor" id="aqLimpar">LIMPAR A FOLHA DESTE QUADRO</button>';

    function encher(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + '%'); }
    $$('[data-aj]', pag).forEach(function (r) {
      encher(r);
      r.addEventListener('input', function () {
        var k = r.dataset.aj, v = parseFloat(r.value);
        if (k === 'vegForca') est.vegForca = v; else aj[k] = v;
        encher(r); $('[data-ajn="' + k + '"]', pag).value = v.toFixed(2);
        aplicarAjustes(); pintarLuz();
      });
    });
    $$('[data-ajn]', pag).forEach(function (n) {
      n.addEventListener('change', function () {
        var k = n.dataset.ajn, v = parseFloat(n.value); if (!isFinite(v)) return;
        var r = $('[data-aj="' + k + '"]', pag); r.value = v; r.dispatchEvent(new Event('input'));
      });
    });
    $$('[data-papel]', pag).forEach(function (b) { b.addEventListener('click', function () { est.papel = b.dataset.papel; M.setPapel(est.papel); est.redesenha = true; paginaAjustes(); }); });
    $$('[data-secagem]', pag).forEach(function (b) { b.addEventListener('click', function () { est.secagem = b.dataset.secagem; aplicarAjustes(); paginaAjustes(); }); });
    $$('[data-base]', pag).forEach(function (b) { b.addEventListener('click', function () { est.base = +b.dataset.base; mudarPasso(A.filme.passo); paginaAjustes(); }); });
    $$('[data-defin]', pag).forEach(function (b) { b.addEventListener('click', function () { est.defin = +b.dataset.defin; paginaAjustes(); toast('vale para a próxima folha nova (LIMPAR ou reabrir a mesa)'); }); });
    $$('[data-modo]', pag).forEach(function (b) { b.addEventListener('click', function () { est.modo = b.dataset.modo; A.filme.modo = est.modo; A.filme.quadros.forEach(function (q) { if (q.png) q.sujo = true; }); paginaAjustes(); }); });
    $$('[data-codigo]', pag).forEach(function (b) { b.addEventListener('click', function () { est.codigo = b.dataset.codigo === '1'; A.codigo.ligado = est.codigo; el('aqCodigo').classList.toggle('hidden', !est.codigo); pintarCodigo(); paginaAjustes(); }); });
    el('aqLimpar').addEventListener('click', function () {
      var t = tamanhoDaFolha();
      if (M.w !== t.w || M.h !== t.h) { A.novoFilme(t.w, t.h); prepararFolha(); pintarCaixa(); pintarPinceis(); pintarTira(); pedirFundo(); }
      M.guardarDesfazer();                     /* o limpar se desfaz */
      M.limpar(); A.filme.quadros[A.filme.atual] = {}; est.redesenha = true; pintarTira(); pintarDesfazer();
    });
  }
  function aplicarAjustes() {
    if (!M) return;
    var aj = est.aj || { granMul: 1, borda: 1, floradas: 1 };
    M.par.granMul = aj.granMul; M.par.borda = aj.borda; M.par.floradas = aj.floradas > 0.05 ? 1 : 0;
    /* FLORADAS: quanta água a beira precisa para invadir o papel ao lado —
       0,2 é o padrão; menos água exigida = sangra e floresce mais      */
    M.par.sangra = 0.2 / Math.max(0.05, aj.floradas);
    /* a secagem: evaporação e escoamento de borda andam juntos (6,7:1) */
    M.par.evap = est.secagem === 'rapida' ? 0.0018 : (est.secagem === 'lenta' ? 0.00025 : 0.0006);
    M.par.eta = M.par.evap * 4.2;
  }
  function paginaSobre() {
    el('aqTelaPag').innerHTML =
      '<div class="aq-sub">A MESA DE LUZ</div>' +
      '<div class="aq-nota">Uma aquarela por FÍSICA: a água anda pelo papel, leva o pigmento, seca pela beira — e a cor é Kubelka-Munk, o modelo que diz como pigmentos de verdade se misturam. É o modelo de Curtis e outros ("Computer-Generated Watercolor", SIGGRAPH 1997).</div>' +
      '<div class="aq-lista">' + [
        ['A FOLHA', 'pinte com o ponteiro. Caneta com pressão muda o traço e a carga.'],
        ['A LUZ', 'arraste: quanto do vídeo da composição aparece por baixo. No fim do curso a luz vem por trás da pintura (retroiluminação).'],
        ['VEGETAL', 'o papel vegetal do animador: o quadro anterior em azul, o seguinte em vermelho.'],
        ['GODÊS', 'os oito pigmentos da paleta. Toque escolhe; ⇄ abre a gaveta dos 52.'],
        ['PINCÉIS', 'quatro redondos: 2, 6, 12 e 24. [ e ] mudam o tamanho.'],
        ['ÁGUA', 'só água: molhe antes de pintar (molhado sobre molhado), dilua, provoque floradas.'],
        ['ESPONJA', 'levanta tinta e água. Pigmento que MANCHA (ftalos, quinacridonas) resiste; o que granula sai fácil.'],
        ['SECO', 'o pincel quase sem água: a tinta pega só nas cristas do papel.'],
        ['SAL', 'sobre a aguada ainda molhada: os cristais bebem a água e deixam estrelas claras de borda escura.'],
        ['ÁLCOOL', 'gotas que repelem o pigmento: olhos claros com a borda escura.'],
        ['SECAR', 'seca a folha agora. Trocar de quadro também seca.'],
        ['↶ ↷', 'desfazer e refazer, doze passos: pincelada, sal, álcool, secar, limpar, copiar. Trocar de quadro zera o histórico.'],
        ['CLARA · MÉDIA · FORTE', 'a diluição: quanta tinta o pincel leva. CLARA é a aguada; FORTE é quase tinta de tubo.'],
        ['A TIRA', 'os quadros da sequência. ◀ ▶ andam, e a composição anda junto — cada quadro é um instante do vídeo. A roda do mouse sobre a tira também anda.'],
        ['EM 1s · 2s · 3s', 'a cadência: um desenho por quadro, por dois, por três.'],
        ['+ · ⧉ · 🗑 · ▶', 'quadro novo, copiar o anterior, apagar, folhear.'],
        ['USAR', 'a sequência entra na linha do tempo por cima do vídeo, em Multiplicar — a aguada como transparência. Em NO PAPEL (ajustes) entra opaca.'],
        ['DO CLIPE', 'com um clipe de aquarela escolhido na linha do tempo, traz a sequência de volta para continuar.'],
        ['TECLAS', '← → quadros · espaço folheia · Ctrl+Z desfaz · Ctrl+Y refaz · [ ] pincel · Esc fecha.']
      ].map(function (l) { return '<div class="aq-item"><b>' + l[0] + '</b><span>' + l[1] + '</span></div>'; }).join('') + '</div>';
  }

  /* ==================================================================
     O MODO CÓDIGO                                                   */
  function pintarCodigo() {
    if (!est || !est.codigo) return;
    var L = A.codigo.linhas.slice(-9);
    el('aqCodigoTxt').textContent = L.map(function (l) { return l.txt + (l.n > 1 ? '   × ' + l.n : ''); }).join('\n') || '// pinte alguma coisa';
  }

  /* ==================================================================
     PREFERÊNCIAS                                                    */
  var PREF = 'rgblab.aquarela';
  function guardarPrefs() {
    try {
      localStorage.setItem(PREF, JSON.stringify({ paleta: M ? M.paleta : est.paleta, papel: est.papel, secagem: est.secagem, defin: est.defin, base: est.base, vegetal: est.vegetal, vegForca: est.vegForca, codigo: est.codigo, aj: est.aj, modo: est.modo, luz: est.luzKnob, pincel: est.pincel, diluicao: est.diluicao }));
    } catch (e) { }
  }
  function carregarPrefs() {
    try {
      var p = JSON.parse(localStorage.getItem(PREF) || 'null'); if (!p) return;
      ['papel', 'secagem', 'defin', 'base', 'vegetal', 'vegForca', 'codigo', 'aj', 'modo', 'pincel', 'diluicao'].forEach(function (k) { if (p[k] !== undefined) est[k] = p[k]; });
      if (p.paleta && p.paleta.length === 8) est.paleta = p.paleta;
      if (typeof p.luz === 'number') est.luzKnob = p.luz;
    } catch (e) { }
  }

  /* ==================================================================
     OS COMANDOS                                                     */
  function ligar() {
    el('aqFechar').addEventListener('click', U.fechar);
    el('aqPalco').addEventListener('pointerdown', function (ev) {
      if (ev.target !== el('aqPalco')) return;
      if (est.tela) { fecharTela(); return; }
      if (est.gaveta !== false) { fecharGaveta(); return; }
      U.fechar();
    });
    document.addEventListener('keydown', function (ev) {
      if (!U.aberta()) return;
      var tag = (ev.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); if (est.tela) fecharTela(); else if (est.gaveta !== false) fecharGaveta(); else U.fechar(); return; }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); ev.stopPropagation(); irPara(A.filme.atual + 1); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); irPara(A.filme.atual - 1); }
      if (ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); folhear(); }
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !ev.shiftKey) { ev.preventDefault(); ev.stopPropagation(); if (M.desfazer()) est.redesenha = true; pintarDesfazer(); return; }
      if ((ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === 'y' || (ev.key.toLowerCase() === 'z' && ev.shiftKey))) { ev.preventDefault(); ev.stopPropagation(); if (M.refazer()) est.redesenha = true; pintarDesfazer(); return; }
      if (ev.key === ']') { est.pincel = Math.min(3, est.pincel + 1); aplicarFerramenta(); pintarPinceis(); }
      if (ev.key === '[') { est.pincel = Math.max(0, est.pincel - 1); aplicarFerramenta(); pintarPinceis(); }
    }, true);
    el('aqPalco').addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) b.blur(); });
    window.addEventListener('resize', function () { if (U.aberta()) ajustarVidro(); });

    /* ---- a folha: o ponteiro pinta ---- */
    var folha = el('aqFolha'), cur = el('aqCursor');
    function pos(ev) {
      var r = folha.getBoundingClientRect();
      return { x: (ev.clientX - r.left) / r.width * M.w, y: (1 - (ev.clientY - r.top) / r.height) * M.h, r: r };
    }
    function pressao(ev) { return ev.pointerType === 'mouse' ? 0.5 : (ev.pressure > 0 ? ev.pressure : 0.5); }
    function cursor(ev) {
      var r = folha.getBoundingClientRect(), esc = r.width / M.w;
      cur.style.left = (ev.clientX - r.left) + 'px'; cur.style.top = (ev.clientY - r.top) + 'px';
      var d = est.raioTela * 2 * esc * (est.arr ? (0.55 + 0.9 * pressao(ev)) : 1);
      cur.style.width = d + 'px'; cur.style.height = d + 'px';
      cur.classList.remove('hidden');
    }
    folha.addEventListener('pointerdown', function (ev) {
      if (!M || !M.gl || est.folheando) return;
      /* o ESTADO primeiro; a captura do ponteiro depois, dentro de try —
         ela pode ser recusada e a exceção não sobe (ver as armadilhas) */
      est.arr = { id: ev.pointerId };
      var p = pos(ev);
      M.tocar(p.x, p.y, pressao(ev));
      est.sujo = true; pintarDesfazer();
      try { folha.setPointerCapture(ev.pointerId); } catch (e) { }
      cursor(ev);
      ev.preventDefault();
    });
    folha.addEventListener('pointermove', function (ev) {
      if (!M || !M.gl) return;
      cursor(ev);
      if (!est.arr || est.arr.id !== ev.pointerId) return;
      var evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [];
      if (!evs.length) evs = [ev];                 /* lista vazia é valor válido */
      for (var i = 0; i < evs.length; i++) { var p = pos(evs[i]); M.arrastar(p.x, p.y, pressao(evs[i])); }
    });
    function soltar(ev) {
      if (!est.arr) return;
      est.arr = null; M.soltar();
      try { folha.releasePointerCapture(ev.pointerId); } catch (e) { }
    }
    folha.addEventListener('pointerup', soltar);
    folha.addEventListener('pointercancel', soltar);
    folha.addEventListener('pointerleave', function () { cur.classList.add('hidden'); });
    document.addEventListener('pointerup', function (ev) { if (est && est.arr) soltar(ev); });

    /* ---- a caixa ---- */
    el('aqGodes').addEventListener('click', function (ev) {
      var tr = ev.target.closest('[data-trocar]');
      if (tr) { ev.stopPropagation(); abrirGaveta(+tr.dataset.trocar); return; }
      var g = ev.target.closest('[data-gode]'); if (!g) return;
      var i = +g.dataset.gode;
      if (!M.paleta[i]) { abrirGaveta(i); return; }
      est.slot = i;
      if (est.ferr !== 'pincel' && est.ferr !== 'seco') est.ferr = 'pincel';
      aplicarFerramenta(); pintarCaixa(); pintarPinceis();
    });
    el('aqGavLista').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-pig]'); if (!b || est.gaveta === false) return;
      var slot = est.gaveta, id = b.dataset.pig, ja = M.paleta.indexOf(id);
      if (ja >= 0 && ja !== slot) M.paleta[ja] = M.paleta[slot];    /* troca de lugar, sem duplicar */
      M.paleta[slot] = id;
      est.slot = slot; est.ferr = est.ferr === 'seco' ? 'seco' : 'pincel';
      est.paleta = M.paleta.slice();
      fecharGaveta(); aplicarFerramenta(); pintarCaixa(); pintarPinceis(); est.redesenha = true;
      A.registrar('paleta', [slot, id]);
      guardarPrefs();
    });
    el('aqGavX').addEventListener('click', fecharGaveta);
    el('aqPinceis').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-pincel]'); if (!b) return;
      est.pincel = +b.dataset.pincel;
      if (est.ferr !== 'seco') est.ferr = 'pincel';
      aplicarFerramenta(); pintarPinceis();
    });
    $$('.aq-ut[data-ferr]', el('aqCaixa')).forEach(function (b) {
      b.addEventListener('click', function () {
        est.ferr = (est.ferr === b.dataset.ferr && b.dataset.ferr !== 'pincel') ? 'pincel' : b.dataset.ferr;
        aplicarFerramenta(); pintarPinceis();
      });
    });
    el('aqSecar').addEventListener('click', function () { M.guardarDesfazer(); M.secar(); est.redesenha = true; est.sujo = false; A.filme.quadros[A.filme.atual].sujo = true; pintarDesfazer(); toast('folha seca'); });
    el('aqDesfazer').addEventListener('click', function () { if (M.desfazer()) est.redesenha = true; else toast('nada para desfazer'); pintarDesfazer(); });
    el('aqRefazer').addEventListener('click', function () { if (M.refazer()) est.redesenha = true; else toast('nada para refazer'); pintarDesfazer(); });
    el('aqDiluicao').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-dil]'); if (!b) return;
      est.diluicao = b.dataset.dil; aplicarFerramenta(); pintarPinceis(); guardarPrefs();
    });

    /* ---- a luz: arrasto vertical no botão ---- */
    var luz = el('aqLuz');
    luz.addEventListener('pointerdown', function (ev) {
      var y0 = ev.clientY, k0 = est.luzKnob;
      function mv(e) { est.luzKnob = Math.max(0, Math.min(1, k0 + (y0 - e.clientY) / 160)); pintarLuz(); }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); guardarPrefs(); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
      ev.preventDefault();
    });
    luz.addEventListener('wheel', function (ev) { ev.preventDefault(); est.luzKnob = Math.max(0, Math.min(1, est.luzKnob - Math.sign(ev.deltaY) * 0.05)); pintarLuz(); }, { passive: false });
    el('aqVegetal').addEventListener('click', function () { est.vegetal = !est.vegetal; pintarLuz(); guardarPrefs(); });
    el('aqInfo').addEventListener('click', function () { abrirTela('sobre'); });
    el('aqAjustes').addEventListener('click', function () { abrirTela('ajustes'); });
    el('aqTelaX').addEventListener('click', fecharTela);
    el('aqDoClipe').addEventListener('click', doClipe);
    el('aqBaixar').addEventListener('click', baixar);
    el('aqUsar').addEventListener('click', usar);

    /* ---- a tira ---- */
    el('aqAnt').addEventListener('click', function () { irPara(A.filme.atual - 1); });
    el('aqProx').addEventListener('click', function () { irPara(A.filme.atual + 1); });
    el('aqNovo').addEventListener('click', novoQuadro);
    el('aqCopiar').addEventListener('click', copiarAnterior);
    el('aqApagar').addEventListener('click', apagarQuadro);
    el('aqFolheia').addEventListener('click', folhear);
    el('aqLista').addEventListener('click', function (ev) { var b = ev.target.closest('[data-q]'); if (b) irPara(+b.dataset.q); });
    el('aqCadencia').addEventListener('click', function (ev) { var b = ev.target.closest('[data-passo]'); if (b) mudarPasso(+b.dataset.passo); });
    /* a roda do mouse sobre a tira anda um quadro por dente (com um respiro
       de 140 ms, senão uma rolada de trackpad atravessa a sequência)    */
    el('aqTira').addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var agora = performance.now();
      if (agora - est.ultRolagem < 140 || trocando) return;
      var d = Math.abs(ev.deltaY) >= Math.abs(ev.deltaX) ? ev.deltaY : ev.deltaX;
      if (!d) return;
      est.ultRolagem = agora;
      irPara(A.filme.atual + (d > 0 ? 1 : -1));
    }, { passive: false });
  }

  /* para os testes: o estado e o motor */
  U.__est = function () { return est; };
  U.__motor = function () { return M; };
})(window.VE);
