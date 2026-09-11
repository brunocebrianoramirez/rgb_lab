/* ============================================================
   rgb_lab 2.0 — o que o CSS não alcança
   ------------------------------------------------------------
   O 2.0 é uma REPAGINAÇÃO: a estrutura do index.html continua
   inteira, cada painel no mesmo lugar, e quase tudo é resolvido
   em `css/lab2.css`. Este arquivo existe só para as duas coisas
   que folha de estilo nenhuma faz:

     · a MINIATURA dentro do clipe da linha do tempo — é o que
       faz a mesa parecer uma mesa e não uma fileira de barras
       com nome;
     · o RÓTULO curto da pista ("MEDIA 1", "AUDIO 1"), que nas
       referências fica fora da faixa, à esquerda.

   Nada aqui move elemento de lugar, esconde botão ou troca
   comportamento. Se este arquivo não carregar, o laboratório
   continua funcionando igual — só sem miniatura.
   ============================================================ */
(function (VE) {
  'use strict';
  if (document.documentElement.dataset.ui !== '2') return;

  var L = VE.lab2 = {};

  function $(s) { return document.querySelector(s); }

  /* ====================================================== MINIATURAS ====
     A conta é feita uma vez por FONTE, não por clipe: uma folha de doze
     quadros lidos do arquivo, guardada. Depois disso, desenhar o clipe é
     recortar dessa folha o trecho que ele usa — barato o bastante para
     rodar a cada redesenho da mesa, inclusive durante um arrasto.       */
  var folhas = {};
  var TH_W = 160, TH_H = 90, TH_N = 12;

  function folhaDe(srcId, aoFicarPronta) {
    var f = folhas[srcId];
    if (f) return f === 'fazendo' ? null : f;
    var s = VE.sources[srcId];
    if (!s || !s.el) return null;

    if (s.kind !== 'video') {
      /* imagem, tipo, webcam: um quadro só, e ele já está na mão */
      var cv1 = document.createElement('canvas');
      cv1.width = TH_W; cv1.height = TH_H;
      try { cobrir(cv1.getContext('2d'), s.el, 0, 0, TH_W, TH_H); } catch (e) { }
      folhas[srcId] = { cv: cv1, n: 1 };
      return folhas[srcId];
    }

    folhas[srcId] = 'fazendo';
    /* um elemento PRÓPRIO: mexer no `currentTime` do elemento da fonte
       arrastaria a prévia junto, e o laboratório inteiro piscaria      */
    var v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
    var cv = document.createElement('canvas');
    cv.width = TH_W * TH_N; cv.height = TH_H;
    var cx = cv.getContext('2d');
    var i = 0, dur = 0;

    function proximo() {
      if (i >= TH_N) return fim();
      try { v.currentTime = ((i + 0.5) / TH_N) * dur; } catch (e) { fim(); }
    }
    function fim() {
      folhas[srcId] = { cv: cv, n: Math.max(1, i) };
      v.removeAttribute('src');
      if (aoFicarPronta) aoFicarPronta();
    }
    v.addEventListener('loadeddata', function () {
      dur = v.duration || s.duration || 1;
      if (!isFinite(dur) || dur <= 0) dur = 1;
      proximo();
    });
    v.addEventListener('seeked', function () {
      try { cobrir(cx, v, i * TH_W, 0, TH_W, TH_H); } catch (e) { }
      i++; proximo();
    });
    v.addEventListener('error', fim);
    v.src = s.url || s.el.src || '';
    return null;
  }

  /* recorta para PREENCHER a caixa, como `cover` — miniatura deformada
     mente sobre o enquadramento do plano                                */
  function cobrir(cx, fonte, x, y, w, h) {
    var sw = fonte.videoWidth || fonte.naturalWidth || fonte.width;
    var sh = fonte.videoHeight || fonte.naturalHeight || fonte.height;
    if (!sw || !sh) return;
    var k = Math.max(w / sw, h / sh);
    var dw = sw * k, dh = sh * k;
    cx.drawImage(fonte, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function pintarClipes() {
    if (!VE.project) return;
    var lanes = $('#tlLanes');
    if (!lanes) return;
    lanes.querySelectorAll('.clip').forEach(function (elc) {
      var kind = elc.dataset.kind;
      if (kind === 'audio' || kind === 'adjust') return;   /* onda e hachura já contam a história */
      var achado = VE.findClip(elc.dataset.clip);
      var c = achado && achado.clip;
      if (!c || !c.src) return;

      var f = folhaDe(c.src, pintarClipes);
      if (!f) return;

      var cv = elc.querySelector('canvas.l2thumbs');
      if (!cv) {
        cv = document.createElement('canvas');
        cv.className = 'l2thumbs';
        var corpo = elc.querySelector('.cbody') || elc;
        corpo.insertBefore(cv, corpo.firstChild);
      }
      var w = Math.max(2, Math.round(elc.clientWidth));
      var h = Math.max(2, Math.round(elc.clientHeight));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      var cx = cv.getContext('2d');
      cx.clearRect(0, 0, w, h);

      var largura = Math.max(26, Math.round(h * 16 / 9));
      var quantas = Math.max(1, Math.ceil(w / largura));
      var sDur = (VE.sources[c.src] || {}).duration || 0;
      for (var k = 0; k < quantas; k++) {
        var frac = quantas === 1 ? 0.5 : k / (quantas - 1 || 1);
        var t = c.in + frac * c.dur * (c.speed || 1);
        var col = f.n === 1 ? 0
          : Math.min(f.n - 1, Math.max(0, Math.round((sDur ? t / sDur : frac) * (f.n - 1))));
        try { cx.drawImage(f.cv, col * TH_W, 0, TH_W, TH_H, k * largura, 0, largura, h); } catch (e) { }
      }
    });
  }
  L.pintarClipes = pintarClipes;

  /* ============================================== RÓTULO DA PISTA ======
     Nas referências a faixa tem uma etiqueta curta fora dela — MEDIA 1,
     AUDIO 1, TEXT 1 — e é ela que dá a leitura de relance. A cabeça de
     pista do laboratório já tem número e nome; aqui só se acrescenta a
     etiqueta curta, como atributo, para o CSS poder desenhá-la.       */
  function rotularPistas() {
    if (!VE.project) return;
    var heads = $('#tlHeads');
    if (!heads) return;
    var n = { video: 0, audio: 0, fx: 0 };
    heads.querySelectorAll('.thead').forEach(function (h) {
      var k = h.classList.contains('kaudio') ? 'audio'
        : h.classList.contains('kfx') ? 'fx' : 'video';
      n[k]++;
      var nome = k === 'audio' ? 'AUDIO' : k === 'fx' ? 'FX' : 'MEDIA';
      h.dataset.l2 = nome + ' ' + n[k];
    });
  }

  /* ========================================== MINIATURA DE EFEITO =======
     A galeria de FILTROS já tinha miniatura ao vivo desde sempre; a lista de
     EFEITOS era texto. São 147 — nome e uma linha de descrição não bastam
     para escolher entre "erosão" e "campo de movimento".

     A conta é a mesma dos filtros, e por isso `js/filters.js` passou a
     expor a máquina (`VE.filters.mini`): o renderizador pequeno, a carta de
     referência para quando não há mídia no cursor, e o desenho de uma
     cadeia sobre a fonte. Nada foi duplicado.

     SOB DEMANDA, e este é o ponto: desenhar as 147 de uma vez significa
     compilar 147 shaders no mesmo quadro, e a página trava. Um observador
     de interseção pinta só o que entrou na tela, poucas por quadro.     */
  var pendentes = [], pintando = false, obs = null;

  function fila() {
    if (pintando) return;
    pintando = true;
    requestAnimationFrame(function passo() {
      var F = VE.filters;
      if (!F || !F.mini || !pendentes.length) { pintando = false; return; }
      var r = F.mini.renderer();
      if (!r) { pendentes.length = 0; pintando = false; return; }
      var f = F.mini.fonte();
      var tex = r.upload('src', f.el, !f.live);
      if (!tex) { pintando = false; return; }
      var t = VE.project ? VE.project.time : 0;

      /* TRÊS por quadro: o custo real é a compilação do shader na primeira
         vez que um efeito aparece, e ela não dá para dividir. Três mantém
         a rolagem fluida e enche a tela em menos de um segundo.        */
      var n = 0;
      while (pendentes.length && n < 3) {
        var el = pendentes.shift();
        if (!el.isConnected) continue;
        var id = el.dataset.fx;
        if (!id || !VE.FXBY[id]) continue;
        var img = el.querySelector('img.l2fxthumb');
        if (!img) {
          img = document.createElement('img');
          img.className = 'l2fxthumb';
          img.alt = '';
          el.insertBefore(img, el.firstChild);
        }
        var url = null;
        try {
          url = F.mini.render(r, tex, [{
            id: id, params: VE.defaults(id), amount: 1, local: 0, mask: VE.newMask()
          }], t);
        } catch (e) { }
        if (url) { img.src = url; el.dataset.l2pronto = '1'; }
        n++;
      }
      if (pendentes.length) requestAnimationFrame(passo);
      else pintando = false;
    });
  }

  function observarEfeitos() {
    var lista = $('#fxList');
    if (!lista) return;
    if (!obs && window.IntersectionObserver) {
      obs = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (!e.isIntersecting) return;
          if (e.target.dataset.l2pronto) { obs.unobserve(e.target); return; }
          if (pendentes.indexOf(e.target) < 0) pendentes.push(e.target);
        });
        fila();
      }, { root: lista.parentElement || lista, rootMargin: '160px' });
    }
    lista.querySelectorAll('.fxitem').forEach(function (el) {
      if (obs) obs.observe(el);
      else if (pendentes.indexOf(el) < 0) pendentes.push(el);
    });
    if (!obs) fila();
  }
  L.observarEfeitos = observarEfeitos;

  /* a lista se refaz a cada busca e a cada troca de família; as miniaturas
     dos itens novos entram logo depois                                   */
  function engatarCatalogo() {
    if (!VE.panels || !VE.panels.showTab) { setTimeout(engatarCatalogo, 60); return; }
    var lista = $('#fxList');
    if (lista) {
      new MutationObserver(function () { setTimeout(observarEfeitos, 0); })
        .observe(lista, { childList: true });
      observarEfeitos();
    }
    var orig = VE.panels.showTab;
    VE.panels.showTab = function (nome) {
      var r = orig.apply(this, arguments);
      if (nome === 'fx') setTimeout(observarEfeitos, 30);
      return r;
    };
  }

  /* ============================================ TORRE DE CATEGORIAS =====
     A coluna da esquerda empilhava tudo, e a lista de 147 efeitos sobrava
     com um terço da altura. A torre resolve isso: cada categoria abre a
     coluna ao lado INTEIRA.

     CADA LABORATÓRIO TEM A SUA. A primeira versão montou uma torre só, com
     as categorias do vídeo, e ela aparecia no índice e nos outros dois
     laboratórios — onde nenhum daqueles botões faz sentido. As categorias
     saem das seções que a coluna daquele laboratório já tem.

     No ÍNDICE não há torre: ali a coluna é um sumário (laboratórios,
     arquivo, manual), não um catálogo, e não há o que revezar.

     A torre NÃO substitui nada: no vídeo ela chama a mesma
     `VE.panels.showTab` das abas, que continuam no documento.          */
  var ICO = {
    midia: 'M4 5h6l2 3h8v11H4z',
    efeitos: 'M12 3l2.2 5.6L20 10l-4.4 3.2L17 19l-5-3-5 3 1.4-5.8L4 10l5.8-1.4z',
    filtros: 'M4 5h16l-6 7v6l-4 2v-8z',
    estilos: 'M4 19h16M6.5 15l5.5-10 5.5 10',
    presets: 'M4 6h16M4 12h16M4 18h11',
    onda: 'M3 12h2l2.5-7 3 14 3-11 2.5 4H21',
    cadeia: 'M9 12a3 3 0 0 1 3-3h3a3 3 0 0 1 0 6h-1M15 12a3 3 0 0 1-3 3H9a3 3 0 0 1 0-6h1',
    texto: 'M5 6V4h14v2M12 4v16M9 20h6',
    saida: 'M12 4v11M8 11l4 4 4-4M5 19h14',
    /* a televisão: caixa, antenas e o pé. Desenhada em traços separados
       porque a chave inglesa anterior dizia "conserto", e o que está nesta
       aba é o contrário — são instrumentos de FAZER imagem.             */
    tools: 'M3 9h18v11H3zM8.5 9 6 4.5M15.5 9 18 4.5M9 20v1.5M15 20v1.5'
  };

  /* `sec` é o índice da seção da coluna daquele laboratório; `tab` é uma das
     abas do catálogo de vídeo. Um ou outro, nunca os dois.              */
  var TORRES = {
    video: [
      { id: 'media', rot: 'MÍDIA', ic: 'midia', sec: 0 },
      /* FERRAMENTAS mostra a MESMA seção que MÍDIA — o que muda é quais
         botões dela aparecem, e isso é decidido no CSS pelo `data-l2cat`.
         Separar de verdade exigiria mover os botões no index.html, e o
         index.html é o arquivo que o Classic também usa.

         A divisão é por natureza: em MÍDIA fica o que TRAZ material de fora
         (arquivo, webcam, imagem, texto, legenda, áudio, carta de teste); em
         FERRAMENTAS fica o que FABRICA material a partir do que já existe —
         escâner, mosaico e sobreposição. Eram três instrumentos escondidos
         no meio de uma grade de importação.                              */
      { id: 'ferr', rot: 'TOOLS', ic: 'tools', sec: 0 },
      { id: 'fx', rot: 'EFEITOS', ic: 'efeitos', tab: 'fx' },
      { id: 'filters', rot: 'FILTROS', ic: 'filtros', tab: 'filters' },
      { id: 'styles', rot: 'ESTILOS', ic: 'estilos', tab: 'styles' },
      { id: 'presets', rot: 'PRESETS', ic: 'presets', tab: 'presets' }
    ],
    /* O `sec` é a POSIÇÃO da seção dentro do `#sideAudio`, contada no
       documento. Isso faz dele um número frágil: acrescentar uma seção
       nova no meio empurra todas as de baixo e a torre passa a abrir a
       vizinha, calada. Foi o que aconteceu ao inserir FERRAMENTAS entre
       FONTE e CADEIA — CADEIA abria FERRAMENTAS, PRESETS abria CADEIA, e
       PRESETS ficou sem porta nenhuma. Nada avisa: os botões continuam
       lá e cada um abre alguma coisa.

       Quem mexer nas seções do `#sideAudio` no index.html tem de contar
       de novo aqui. É a mesma disciplina das duas listas do TOOLS de
       vídeo, e pela mesma razão.                                      */
    audio: [
      { id: 'afonte', rot: 'FONTE', ic: 'onda', sec: 0 },
      { id: 'aferr', rot: 'TOOLS', ic: 'tools', sec: 1 },
      { id: 'acadeia', rot: 'CADEIA', ic: 'cadeia', sec: 2 },
      { id: 'apresets', rot: 'PRESETS', ic: 'presets', sec: 3 }
    ],
    type: [
      { id: 'tferr', rot: 'LETRA', ic: 'texto', sec: 0 },
      { id: 'tpresets', rot: 'PRESETS', ic: 'presets', sec: 1 },
      { id: 'tsaida', rot: 'SAÍDA', ic: 'saida', sec: 2 }
    ]
  };

  var PANE = { video: '#sideVideo', audio: '#sideAudio', type: '#sideType' };
  var escolhido = {};        /* qual categoria em cada laboratório */

  function montarTorre(lab) {
    var side = $('#side');
    if (!side) return;
    var velha = $('#l2rail');
    var cats = TORRES[lab];

    /* índice e manual não têm torre */
    if (!cats) { if (velha) velha.remove(); side.removeAttribute('data-l2cat'); return; }

    if (velha && velha.dataset.lab === lab) { aplicar(lab, escolhido[lab] || cats[0].id); return; }
    if (velha) velha.remove();

    var nav = document.createElement('nav');
    nav.id = 'l2rail'; nav.className = 'l2rail'; nav.dataset.lab = lab;
    nav.innerHTML = cats.map(function (c) {
      return '<button class="l2r" data-l2cat="' + c.id + '" title="' + c.rot + '">' +
        '<svg viewBox="0 0 24 24"><path d="' + (ICO[c.ic] || '') + '"/></svg>' +
        '<span>' + c.rot + '</span></button>';
    }).join('');
    side.insertBefore(nav, side.firstChild);

    nav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-l2cat]');
      if (b) aplicar(lab, b.dataset.l2cat);
    });
    aplicar(lab, escolhido[lab] || cats[0].id);
  }

  /* mostra a seção (ou a aba) daquela categoria e esconde as outras */
  function aplicar(lab, catId) {
    var cats = TORRES[lab];
    if (!cats) return;
    var cat = cats.filter(function (c) { return c.id === catId; })[0] || cats[0];
    escolhido[lab] = cat.id;

    var pane = $(PANE[lab]);
    if (pane) {
      var secs = [].slice.call(pane.children).filter(function (n) {
        return n.classList.contains('side-sec');
      });
      secs.forEach(function (n, i) { n.classList.toggle('l2off', cat.sec !== i); });
      /* no vídeo, as abas e o catálogo entram no lugar da grade FONTE */
      var caixa = pane.querySelector('.side-tabbox');
      var abas = pane.querySelector('.side-tabs');
      if (caixa) caixa.classList.toggle('l2off', cat.sec !== undefined);
      if (abas) abas.classList.toggle('l2off', cat.sec !== undefined);
    }
    if (cat.tab && VE.panels && VE.panels.showTab) VE.panels.showTab(cat.tab);

    /* o título da seção diz FONTE, que é verdade em MÍDIA e mentira em
       FERRAMENTAS. Como as duas dividem a mesma seção, quem troca a palavra
       é isto aqui — e devolve a original ao sair.                        */
    if (pane) {
      var tit = pane.querySelector('.side-sec .side-sec-h .lbl');
      if (tit) {
        if (!tit.dataset.l2orig) tit.dataset.l2orig = tit.textContent;
        tit.textContent = (cat.id === 'ferr') ? 'TOOLS' : tit.dataset.l2orig;
      }
    }

    var side = $('#side');
    if (side) side.dataset.l2cat = cat.id;
    document.querySelectorAll('#l2rail [data-l2cat]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.l2cat === cat.id);
    });
    if (cat.tab === 'fx') setTimeout(observarEfeitos, 30);
    if (cat.tab === 'styles') setTimeout(observarEstilos, 30);
  }
  L.torre = montarTorre;

  /* a torre se refaz a cada troca de laboratório */
  function engatarRota() {
    if (!VE.shell || !VE.shell.go) { setTimeout(engatarRota, 60); return; }
    var orig = VE.shell.go;
    VE.shell.go = function (v) {
      var r = orig.apply(this, arguments);
      setTimeout(function () { montarTorre(v); }, 0);
      return r;
    };
  }
  engatarRota();



  /* ============================================== A GRADE DO VISOR ======
     O laboratório não tinha grade — nem terços, nem área segura. Nas
     referências ela é o que transforma a prévia em MESA DE ENQUADRAMENTO:
     dá para ver se o horizonte está torto e se o rosto caiu na linha.

     Ela é medida a partir do CANVAS, não do palco. Grade que cobre o palco
     inteiro é enfeite por cima do vídeo; grade que cobre o quadro é
     ferramenta. Como o canvas muda de tamanho a cada zoom e a cada troca de
     tela, a medida acompanha.

     Quatro estados, num botão só: desligada → terços → grade fina →
     área segura. Um botão com quatro paradas cabe na barra; quatro botões
     não.                                                                 */
  var MODOS = ['off', 'tercos', 'fina', 'segura'];
  var ROT = { off: 'GRADE', tercos: 'TERÇOS', fina: 'GRADE', segura: 'SEGURA' };
  var modoGrade = 0;

  function grade() {
    var el = $('#l2grade');
    if (el) return el;
    var palco = $('#vp');
    if (!palco) return null;
    el = document.createElement('div');
    el.id = 'l2grade';
    el.className = 'l2grade off';
    palco.appendChild(el);
    return el;
  }

  function medirGrade() {
    var g = grade(), cv = $('#gl'), palco = $('#vp');
    if (!g || !cv || !palco) return;
    if (MODOS[modoGrade] === 'off') { g.className = 'l2grade off'; return; }
    var r = cv.getBoundingClientRect(), p = palco.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) { g.className = 'l2grade off'; return; }
    g.className = 'l2grade ' + MODOS[modoGrade];
    g.style.left = (r.left - p.left) + 'px';
    g.style.top = (r.top - p.top) + 'px';
    g.style.width = r.width + 'px';
    g.style.height = r.height + 'px';
  }
  L.medirGrade = medirGrade;

  function botaoDaGrade() {
    if ($('#l2gridBt')) return;
    var alvo = $('#pxToggle');            /* ao lado de PX, que é o vizinho de assunto */
    if (!alvo || !alvo.parentElement) return;
    var b = document.createElement('button');
    b.id = 'l2gridBt';
    b.className = 'zbtn l2grid-bt';
    b.textContent = 'GRADE';
    b.title = 'Grade do quadro: terços · grade fina · área segura';
    alvo.parentElement.insertBefore(b, alvo.nextSibling);
    b.addEventListener('click', function () {
      modoGrade = (modoGrade + 1) % MODOS.length;
      b.textContent = ROT[MODOS[modoGrade]];
      b.classList.toggle('on', MODOS[modoGrade] !== 'off');
      medirGrade();
      if (VE.app && VE.app.toast && MODOS[modoGrade] !== 'off') {
        VE.app.toast('grade: ' + ROT[MODOS[modoGrade]].toLowerCase());
      }
    });
  }

  /* a grade acompanha zoom, enquadramento e troca de tela */
  function engatarGrade() {
    if (!VE.view || !VE.view.apply) { setTimeout(engatarGrade, 60); return; }
    botaoDaGrade();
    var orig = VE.view.apply;
    VE.view.apply = function () {
      var r = orig.apply(this, arguments);
      medirGrade();
      return r;
    };
    window.addEventListener('resize', medirGrade);
    VE.on('canvas', function () { setTimeout(medirGrade, 30); });
    setTimeout(medirGrade, 200);
  }
  engatarGrade();

  /* ============================================== O PLAYER, REFEITO ======
     O transporte usava CARACTERES — ⏮ ◀ ▶ ⏭ ❚❚ — e caractere não é ícone:
     cada um tem métrica própria, linha de base própria e largura própria.
     Era por isso que o triângulo do botão de tocar aparecia pequeno e
     empurrado para cima dentro do círculo. Não dá para centrar com CSS o
     que o tipo já desenhou torto.

     Agora são FORMAS: SVG com o mesmo quadro de 24×24 para todos, o que faz
     os cinco botões terem o mesmo peso óptico e o mesmo centro.

     O botão de tocar é o único que o `js/app.js` reescreve (ele troca o
     texto entre ▶ e ❚❚). Em vez de disputar com ele, um observador escuta a
     troca e marca uma classe — o app continua mandando, e a forma acompanha.
     Assim nada em app.js precisa mudar.                                  */
  var FORMAS = {
    ini:   '<path d="M7 5v14M19 5l-9 7 9 7z"/>',
    passoT:'<path d="M17 5l-9 7 9 7z"/>',
    passoF:'<path d="M7 5l9 7-9 7z"/>',
    fim:   '<path d="M17 5v14M5 5l9 7-9 7z"/>',
    tocar: '<path d="M7 4.5l13 7.5-13 7.5z"/>',
    pausa: '<path d="M8.5 5h3.2v14H8.5zM12.3 5h3.2v14h-3.2z"/>',
    parar: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>'
  };
  function svgDe(nome, cls) {
    return '<svg class="l2ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' +
      FORMAS[nome] + '</svg>';
  }

  /* os botões que o app NÃO reescreve recebem a forma uma vez só */
  var FIXOS = {
    '#goStart': 'ini', '#stepBack': 'passoT', '#stepFwd': 'passoF', '#goEnd': 'fim',
    '#auStart': 'ini', '#auStop': 'parar'
  };

  function refazerPlayer() {
    Object.keys(FIXOS).forEach(function (sel) {
      var b = $(sel);
      if (!b || b.dataset.l2ic) return;
      b.innerHTML = svgDe(FIXOS[sel]);
      b.dataset.l2ic = '1';
      b.classList.add('l2circ');
    });

    ['#playBtn', '#auPlayBtn'].forEach(function (sel) {
      var b = $(sel);
      if (!b || b.dataset.l2play) return;
      b.dataset.l2play = '1';
      b.classList.add('l2circ', 'l2play');
      /* a forma vive num filho próprio; o texto do app fica escondido pelo
         CSS (font-size:0) e continua sendo a fonte da verdade do estado  */
      var i = document.createElement('i');
      i.className = 'l2forma';
      b.appendChild(i);
      /* O GUARDA. Sem ele isto é um laço infinito, e não em teoria: o
         observador escreve dentro do botão, a escrita é uma mutação, a
         mutação chama o observador. Travou a página na primeira medida.

         Duas defesas. Só escreve quando o estado MUDOU — assim a segunda
         passada não escreve nada e a coisa converge. E o observador não olha
         a subárvore, para a escrita dentro do <i> nem chegar a ser notada. */
      var ultimo = null;
      var ler = function () {
        var t = (b.textContent || '').replace(/\s/g, '');
        var tocando = t.indexOf('❚') >= 0 || t.indexOf('‖') >= 0 || t.indexOf('||') >= 0;
        if (tocando === ultimo && b.contains(i)) return;
        ultimo = tocando;
        b.classList.toggle('l2tocando', tocando);
        i.innerHTML = svgDe(tocando ? 'pausa' : 'tocar');
        if (!b.contains(i)) b.appendChild(i);   /* o app apagou: volta */
      };
      ler();
      new MutationObserver(ler).observe(b, { childList: true, characterData: true });
    });
  }

  function engatarPlayer() {
    if (!$('#playBtn')) { setTimeout(engatarPlayer, 80); return; }
    refazerPlayer();
  }
  engatarPlayer();

  /* ======================================= O GIF DE CADA CARTÃO =========
     Cada cartão do índice ganhou um gif, e ele entra COLORIDO, no fundo. Por
     cima continua a animação que o cartão sempre teve — os pontos no 01, a
     onda no 02, as letras no 03 —, desenhada na cor do canal pelo Classic.
     São duas camadas com funções diferentes: o gif dá a matéria, o desenho
     dá a assinatura. Nenhuma das duas substitui a outra.

     Houve uma versão que convertia o gif em ascii branco. Estava errada de
     partida: transformava as duas camadas numa só e jogava fora a cor, que é
     justamente o que o gif tem a acrescentar. Fica registrado porque o
     caminho de volta custou — e porque a lição não é sobre gif: quando duas
     coisas boas disputam o mesmo lugar, o problema quase sempre é o lugar,
     não as coisas.

     O gif entra por `background-image` num pseudo-elemento, não por `<img>`.
     Assim o degradê que segura a leitura do texto mora na MESMA camada, sem
     um terceiro elemento por cartão — e um gif de fundo anima igual.

     Aqui só se descobre o caminho do arquivo e se confirma que ele existe. O
     resto é CSS. Se o gif não carregar — e no arquivo único não carrega,
     porque lá não há pasta de assets — nada é marcado e o cartão continua
     exatamente como era.                                                 */
  function porGifNosCartoes() {
    var cards = document.querySelectorAll('.lab-card');
    if (!cards.length) { setTimeout(porGifNosCartoes, 200); return; }
    cards.forEach(function (card, idx) {
      if (card.dataset.l2gif) return;            /* já resolvido neste cartão */
      var url = 'assets/labs/lab0' + (idx + 1) + '.gif';

      /* ABSOLUTO, e é aqui que o gif tinha ficado invisível.

         Um url() dentro de variável CSS resolve pela FOLHA DE ESTILO que o
         CONSOME, não pelo documento nem por quem escreveu a variável. Ela é
         escrita aqui e lida em css/lab2.css, então o navegador ia buscar em
         "css/assets/labs/lab01.gif" — 404, calado, sem erro no console.

         E o teste logo abaixo resolvia pelo documento, onde o arquivo existe:
         dava 200. Ou seja, a verificação passava e a tela continuava vazia —
         é o tipo de defeito que só aparece olhando a rede.

         Resolvido contra location.href, o caminho sai pronto e deixa de
         importar de qual arquivo .css a variável é lida.                 */
      var abs = new URL(url, location.href).href;
      var teste = new Image();
      /* a marca só entra DEPOIS de carregar: cartão com fundo declarado e
         arquivo faltando mostraria um vão escuro no lugar da animação */
      teste.onload = function () {
        card.style.setProperty('--l2gif', 'url("' + abs + '")');
        card.dataset.l2gif = '1';
      };
      teste.src = abs;
    });
  }
  porGifNosCartoes();

  /* ================================= O ASCII POR CIMA DO GIF =============
     A animação de cada cartão continua sendo a do js/shell.js — os pontos no
     01, a onda no 02, as letras no 03, cada uma na cor do seu canal. O que
     muda é o acabamento: em vez de aparecer como forma cheia, ela é lida de
     volta e reescrita em CARACTERES, por cima do gif.

     E é lida de volta, literalmente. Eu podia ter reescrito as três animações
     aqui em versão ascii, mas seriam duas cópias da mesma ideia envelhecendo
     em arquivos diferentes: mexer no desenho do Classic deixaria de mexer no
     do 2.0. Em vez disso, o canvas do Classic vira a FONTE — ele desenha
     escondido, eu encolho o que ele desenhou até o tamanho da grade de
     caracteres e converto. Qualquer mudança lá aparece aqui de graça.

     Encolher com drawImage é o que dá as meias-tintas: uma linha de 1,5px
     reduzida cinco vezes não vira "tem ou não tem", vira uma cobertura
     fracionada — e é dela que sai a rampa de caracteres em vez de um
     liga-desliga.

     A densidade vem do ALFA, não da luminância: o Classic desenha numa cor
     só sobre transparente, então o alfa é exatamente quanto daquela célula
     foi pintado. A cor quem põe sou eu, do canal, para o verde continuar
     verde e o vermelho continuar vermelho.                               */
  var RAMPA = ' .·:-=+*#%@';

  /* GANHO E GAMA, medidos e não chutados. Encolher o desenho até a grade
     espalha a tinta: o alfa que chega tem média 0,08 e máximo 0,64, então a
     rampa crua usaria só o terço de baixo — 72% das células caíam em espaço
     e o caractere mais forte que aparecia era "*", uma vez em 2975.

     O ganho estica o que existe até o topo da rampa; a gama levanta os
     meios-tons para o desenho ter corpo em vez de só extremos. A zona morta
     segura o fundo: célula praticamente vazia continua vazia, e é ela que
     preserva o desenho pontilhado em vez de encardir o cartão inteiro.

     A conta é feita UMA VEZ, numa tabela de 256 entradas. Ela é sempre a
     mesma — de byte de alfa para caractere — e fazê-la por célula custava
     quase nove mil `Math.pow` por quadro.                                */
  var GANHO = 2.4, GAMA = 0.8, MORTO = 4;      /* MORTO em bytes, não em 0..1 */
  var TABELA = (function () {
    var t = new Array(256), ult = RAMPA.length - 1;
    for (var i = 0; i < 256; i++) {
      if (i < MORTO) { t[i] = ' '; continue; }
      var e = Math.pow(Math.min(1, (i / 255) * GANHO), GAMA);
      t[i] = RAMPA[Math.min(ult, (e * RAMPA.length) | 0)];
    }
    return t;
  })();

  /* UMA leitura para os três cartões, não três.

     `getImageData` custou 1,36ms por cartão medido — e não pelo tamanho (são
     2975 pixels), e sim porque cada chamada é uma parada para buscar o que
     está do outro lado. Empilhando as três fontes num canvas só, a parada
     acontece uma vez: 4ms viram 1,4.                                      */
  var leitor = null, ultimaGrade = null;

  /* ---- O CARTÃO 03 DESENHA A PRÓPRIA FONTE ----

     Os outros dois leem o canvas do js/shell.js e convertem. Este não: a
     animação que o Classic faz ali são doze letras de 34px giradas, e a 34px
     numa grade de 8px cada letra vira meia dúzia de caracteres — 4% de
     cobertura contra 16 e 21 dos vizinhos. Some no meio do gif, e num cartão
     que é justamente o da TIPOGRAFIA.

     O que entra no lugar é uma amostra: glifos altos, ocupando quatro
     quintos da altura, atravessando o cartão, cada um numa família
     diferente. Uns cheios, outros só de contorno — o contorno é o que deixa
     ver o esqueleto da letra em caracteres, que é o assunto do laboratório.

     A sequência é derivada da POSIÇÃO, não sorteada por quadro: o glifo de
     índice k tem sempre a mesma família, o mesmo corpo e a mesma letra. Por
     isso a fita rola sem nada piscar, e o que entra pela direita já entrou
     antes na mesma forma.

     O canvas do Classic continua desenhando escondido para este cartão. É
     desperdício, e é o preço de não mexer no js/shell.js — que é o mesmo
     arquivo do Classic.                                                   */
  var FAMILIAS = [
    { f: '"Archivo", Helvetica, sans-serif', p: '800 ', i: '' },
    { f: '"Times New Roman", Times, serif', p: '400 ', i: 'italic ' },
    { f: '"JetBrains Mono", ui-monospace, monospace', p: '700 ', i: '' },
    { f: 'Georgia, serif', p: '700 ', i: '' },
    { f: '"Courier New", monospace', p: '400 ', i: '' },
    { f: 'Arial, Helvetica, sans-serif', p: '900 ', i: '' },
    { f: '"Archivo", Helvetica, sans-serif', p: '300 ', i: 'italic ' },
    { f: 'Georgia, serif', p: '400 ', i: 'italic ' }
  ];
  var LETRAS = 'RGBLAB&aQ8g?@Kw';

  /* Sorteio SEM sorteio: a mesma entrada devolve sempre o mesmo número.
     Precisa ser assim porque cada quadro redesenha do zero — com
     `Math.random()` a letra mudaria 20 vezes por segundo em vez de 12, e
     nenhuma delas duraria o bastante para ser lida como letra.          */
  function azar(a) {
    var x = Math.sin(a * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  /* O ALFA VAI NA COR, NUNCA NO `globalAlpha`.

     Medido, e a diferença é de outra ordem: o mesmo desenho com o fantasma
     em `globalAlpha` custa 5,18ms; com o alfa embutido na cor, 0,18ms. Vinte
     e nove vezes.

     A razão é a combinação, não cada peça: texto GIRADO custa 0,19ms,
     `globalAlpha` custa 0,16ms, e os dois juntos custam 8,24 — girar e
     compor com transparência tira o desenho do caminho rápido e obriga o
     navegador a montar uma camada só para aquela letra.

     Como as três cores de canal não mudam, a conversão fica guardada.   */
  var alfaCache = {};
  function comAlfa(cor, a) {
    var chave = cor + '|' + a.toFixed(2);
    if (alfaCache[chave]) return alfaCache[chave];
    var m = /^#([0-9a-f]{6})$/i.exec(cor);
    var v = m
      ? 'rgba(' + parseInt(m[1].slice(0, 2), 16) + ',' + parseInt(m[1].slice(2, 4), 16) +
        ',' + parseInt(m[1].slice(4, 6), 16) + ',' + a.toFixed(2) + ')'
      : cor;                                  /* cor em outro formato: sem véu */
    alfaCache[chave] = v;
    return v;
  }
  var tela03 = null, relogio03 = performance.now();

  /* Desenhada JÁ PEQUENA, e é a diferença entre 14,6ms e caber no orçamento.

     O destino é uma grade de 85×35 caracteres. Desenhar glifos de 229px num
     canvas de 411×286 para depois encolher tudo até 85×35 é rasterizar seis
     vezes mais pixels do que alguém vai olhar. Com o dobro da grade já sobra
     resolução para o encolhimento dar meias-tintas boas.

     A proporção do cartão é mantida, senão as letras sairiam espremidas.  */
  function fonteDaTipografia(Wc, Hc, cor, cols) {
    var W = Math.min(Wc, Math.round(cols * 1.5));
    var H = Math.max(8, Math.round(W * Hc / Wc));
    if (!tela03) tela03 = document.createElement('canvas');
    if (tela03.width !== W || tela03.height !== H) { tela03.width = W; tela03.height = H; }
    var c = tela03.getContext('2d');
    c.clearRect(0, 0, W, H);
    c.fillStyle = cor; c.strokeStyle = cor;
    c.textAlign = 'center'; c.textBaseline = 'middle';

    var t = (performance.now() - relogio03) / 1000;
    var passo = H * 0.60;                  /* distância entre um glifo e o próximo */
    var anda = t * H * 0.62;               /* rápido: a fita atravessa, não passeia */
    var primeiro = Math.floor(anda / passo);
    var sobra = anda - primeiro * passo;
    var quantos = Math.ceil(W / passo) + 2;

    /* A BATIDA. Tudo que é frenético aqui pende dela.

       O sorteio não é por quadro nem por glifo: é por (glifo, batida). Dentro
       da mesma batida a letra fica parada; na virada, ela troca inteira — de
       caractere, de família, de corpo, de inclinação. É o que dá o estalo. Se
       cada quadro sorteasse de novo, as letras não trocariam: ficariam
       vibrando no lugar, e vibração lida como chiado, não como agitação.

       12 por segundo contra os 20 quadros do ascii: a troca cai um pouco
       fora do compasso de propósito, senão o olho decora o intervalo.    */
    var batida = Math.floor(t * 12);
    var dentro = (t * 12) - batida;        /* 0..1 dentro da batida atual */

    for (var n = 0; n < quantos; n++) {
      var k = primeiro + n;
      var r1 = azar(k * 7.3 + batida * 1.7);
      var r2 = azar(k * 3.1 + batida * 5.9);
      var r3 = azar(k * 11.7 + batida * 2.3);
      var r4 = azar(k * 5.5 + batida * 9.1);

      var fam = FAMILIAS[Math.floor(r1 * FAMILIAS.length) % FAMILIAS.length];
      var ch = LETRAS[Math.floor(r2 * LETRAS.length) % LETRAS.length];

      /* O CORPO SALTA A CADA BATIDA, MAS EM DEGRAUS.

         A primeira versão fazia ele decair continuamente dentro da batida —
         a letra entrava estourada e murchava. Ficava bom e custava caro: com
         o corpo mudando a cada quadro, a string da fonte é NOVA toda vez, e
         string de fonte nova joga fora o cache de glifos do navegador.

         Em degraus de 6px o conjunto de tamanhos possíveis é pequeno e se
         repete, o cache volta a valer, e o salto de uma batida para a outra
         continua sendo salto — só perdeu o murchar, que a 20 quadros por
         segundo quase não dava tempo de ver.                              */
      var corpo = Math.round(H * (0.55 + 0.55 * r3) / 6) * 6;

      /* a fita continua andando; o tremor entra por cima dela. Sem a fita,
         o quadro vira ruído parado — com ela, é ruído que atravessa.    */
      var x = n * passo - sobra + passo * 0.5 + (r1 - 0.5) * passo * 0.55;
      var y = H * 0.5
        + Math.sin(k * 0.9 + t * 7.5) * H * 0.17
        + (r4 - 0.5) * H * 0.26;

      c.font = fam.i + fam.p + Math.round(corpo) + 'px ' + fam.f;
      c.fillStyle = cor;

      /* Todo mundo tomba. Cheguei a girar só os de contorno achando que o
         giro é que estava caro — não era, era a string da fonte. Texto
         girado custou 0,7ms nos três cartões; o corpo variando por quadro
         custava nove.                                                     */
      c.save();
      c.translate(x, y);
      c.rotate((r3 - 0.5) * 1.35);
      if (r4 > 0.58) {
        /* o contorno mostra o esqueleto da letra; a espessura acompanha o
           corpo para não sumir nos glifos pequenos                        */
        c.lineWidth = Math.max(1, corpo * 0.045);
        c.strokeText(ch, 0, 0);
      } else {
        c.fillText(ch, 0, 0);
      }
      c.restore();

      /* O RASTRO: a letra da batida ANTERIOR, deslocada e fraca. Sem ele uma
         troca de doze por segundo lê como cintilação de tela quebrada; com
         ele lê como coisa que passou por ali.

         O alfa vai na COR, nunca no `globalAlpha`: texto girado com
         `globalAlpha` sai do caminho rápido do navegador e obriga a montar
         uma camada só para aquela letra.                                  */
      if (r2 > 0.45) {
        var rf = azar(k * 3.1 + (batida - 1) * 5.9);
        c.save();
        c.fillStyle = comAlfa(cor, 0.20 + 0.24 * (1 - dentro));
        c.translate(x - passo * 0.24, y + (rf - 0.5) * H * 0.22);
        c.rotate((rf - 0.5) * 1.0);
        /* também em degraus, senão volta o mesmo problema da fonte nova a
           cada quadro que custou nove milissegundos                       */
        c.font = fam.i + fam.p + (Math.round(corpo * 0.78 / 6) * 6) + 'px ' + fam.f;
        c.fillText(LETRAS[Math.floor(rf * LETRAS.length) % LETRAS.length], 0, 0);
        c.restore();
      }

    }
    return tela03;
  }

  function pintarCartoes(cards, cores) {
    var n = cards.length;
    if (!n) return;
    var W = cards[0].clientWidth, H = cards[0].clientHeight;
    if (W < 24 || H < 24) return;

    var cell = W < 200 ? 6 : (W < 300 ? 7 : 8);
    var cw = cell * 0.6;                    /* a monoespaçada é mais alta que larga */
    var cols = Math.max(6, Math.floor(W / cw));
    var linhas = Math.max(4, Math.floor(H / cell));
    ultimaGrade = cols + '×' + linhas;

    if (!leitor) {
      leitor = document.createElement('canvas');
      leitor.__cx = leitor.getContext('2d', { willReadFrequently: true });
    }
    if (leitor.width !== cols || leitor.height !== linhas * n) {
      leitor.width = cols; leitor.height = linhas * n;
    }
    var lx = leitor.__cx;
    lx.clearRect(0, 0, cols, linhas * n);
    lx.imageSmoothingEnabled = true;
    lx.imageSmoothingQuality = 'high';

    var fontes = [], i;
    for (i = 0; i < n; i++) {
      /* o da tipografia desenha a própria; os outros dois leem o do Classic */
      var f = cards[i].dataset.lab === 'type'
        ? fonteDaTipografia(W, H, cores[i] || '#fff', cols)
        : cards[i].querySelector('canvas:not(.l2cv)');
      fontes.push(f);
      if (f && f.width && cards[i].clientWidth === W) {
        try { lx.drawImage(f, 0, i * linhas, cols, linhas); } catch (e) { }
      }
    }
    var d;
    try { d = lx.getImageData(0, 0, cols, linhas * n).data; } catch (e) { return; }

    for (i = 0; i < n; i++) {
      var card = cards[i];
      if (!fontes[i] || !fontes[i].width) continue;
      var meu = card.querySelector('canvas.l2cv');
      if (!meu) {
        /* CANVAS PRÓPRIO, e no FIM da lista. A animação do Classic acha o
           canvas do cartão com querySelector('canvas'), que devolve o
           PRIMEIRO — inserindo o meu na frente, era no meu que ela desenhava
           e o ascii era repintado por cima no mesmo quadro. No fim, ela
           continua com o dela (escondida pelo CSS) e serve de fonte.     */
        meu = document.createElement('canvas');
        meu.className = 'l2cv';
        card.appendChild(meu);
      }
      if (meu.width !== W || meu.height !== H) { meu.width = W; meu.height = H; }

      var c = meu.getContext('2d');
      c.clearRect(0, 0, W, H);
      c.font = '700 ' + Math.round(cell * 0.94) + 'px "JetBrains Mono", monospace';
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillStyle = cores[i] || '#fff';

      var base = i * linhas * cols * 4, vivo = false;
      for (var y = 0; y < linhas; y++) {
        var linha = '', off = base + y * cols * 4 + 3;
        for (var x = 0; x < cols; x++) {
          var b = d[off + x * 4];
          if (b >= MORTO) vivo = true;
          linha += TABELA[b];
        }
        /* uma chamada de texto por LINHA, não por caractere: com 85 colunas
           e 35 linhas isso é 35 chamadas em vez de 2975, por cartão      */
        c.fillText(linha, 0, y * cell);
      }
      if (vivo) card.dataset.l2ascii = '1'; else delete card.dataset.l2ascii;
    }
  }
  L.pintarCartoes = pintarCartoes;
  L.gradeDoAscii = function () { return ultimaGrade; };

  function engatarAscii() {
    var cards = document.querySelectorAll('.lab-card');
    if (!cards.length) { setTimeout(engatarAscii, 200); return; }
    var CANAIS = ['--ch-video', '--ch-audio', '--ch-type'];
    var lista = [].slice.call(cards), cores = [], quadro = 0, modo = null;
    (function laco() {
      requestAnimationFrame(laco);
      if (!VE.shell || VE.shell.view !== 'home') return;
      /* 20fps. Medido: a conversão custa 8ms para os três cartões num
         cartão de 411px, e a animação do Classic que serve de fonte custa
         outros 16 — juntas não cabem em 16,7ms. Como isto é textura de
         fundo, e não o vídeo do usuário, um quadro a cada três é
         indistinguível e devolve um terço do custo.                     */
      if ((quadro++ % 3) !== 0) return;
      /* a cor do canal só muda quando o modo muda — ler o estilo calculado a
         cada quadro força o navegador a recalcular layout de graça       */
      var m = document.documentElement.dataset.mode;
      if (m !== modo) {
        modo = m;
        var css = getComputedStyle(document.documentElement);
        cores = lista.map(function (_, i) {
          return css.getPropertyValue(CANAIS[i] || '--ch-video').trim() || '#fff';
        });
      }
      pintarCartoes(lista, cores);
    })();
  }
  engatarAscii();

  /* ============================ A GROSSURA DA COLUNA, POR LABORATÓRIO =====
     Uma medida só para as quatro telas não serve: o índice tem uma lista de
     pastas e o laboratório de vídeo tem a torre de ícones MAIS o catálogo ao
     lado. A mesma largura deixa um sobrando e o outro apertado.

     O arrasto continua igual — quem arrasta manda, e a medida fica guardada.
     Só que agora fica guardada NA TELA em que foi arrastada. Sair do vídeo e
     voltar devolve a largura do vídeo, não a última que alguém usou noutro
     lugar.

     O js/app.js segue dono do arrasto e da variável; aqui só se lê o valor
     depois que o dedo levanta, e se reescreve na troca de tela.          */
  var LARG_KEY = 'rgblab2.colunas';
  var LARG_PADRAO = { home: 214, video: 320, audio: 320, type: 320 };
  var largs = {};
  try { largs = JSON.parse(localStorage.getItem(LARG_KEY)) || {}; } catch (e) { largs = {}; }

  function larguraDe(vista) {
    var v = largs[vista];
    return (typeof v === 'number' && v >= 120) ? v : (LARG_PADRAO[vista] || 268);
  }
  function aplicarLargura(vista) {
    document.documentElement.style.setProperty('--side-w', larguraDe(vista) + 'px');
  }
  function guardarLargura() {
    var vista = VE.shell && VE.shell.view;
    if (!vista) return;
    var w = Math.round(parseFloat(
      document.documentElement.style.getPropertyValue('--side-w')) || 0);
    if (!w || w === largs[vista]) return;
    largs[vista] = w;
    try { localStorage.setItem(LARG_KEY, JSON.stringify(largs)); } catch (e) { }
  }

  function engatarLarguras() {
    if (!VE.shell || !VE.shell.go) { setTimeout(engatarLarguras, 40); return; }
    var ir = VE.shell.go;
    VE.shell.go = function () {
      var r = ir.apply(this, arguments);
      aplicarLargura(VE.shell.view);
      if (VE.tl && VE.tl.render) VE.tl.render();
      if (VE.view) { if (VE.view.mode !== 'free') VE.view.applyMode(); else VE.view.apply(); }
      return r;
    };
    /* o js/app.js escreve a variável durante o arrasto; aqui só se lê o que
       ficou, no fim — sem disputar o controle com ele                    */
    var esq = document.querySelector('.vsplit[data-side="left"]');
    if (esq) esq.addEventListener('pointerup', function () { setTimeout(guardarLargura, 0); });
    aplicarLargura((VE.shell && VE.shell.view) || 'home');
  }
  engatarLarguras();


  /* ================================ AS MINIATURAS DOS ESTILOS ============
     Cada estilo é uma CADEIA de efeitos — VHS 1994 são três, Vaporwave são
     cinco. O nome e a descrição dizem o que ele promete; a miniatura mostra
     o que ele faz. É a diferença entre escolher pela palavra e escolher pela
     imagem, e num catálogo de 57 estilos a palavra não dá conta.

     O QUADRO DE TESTE ERA UM PÔR DO SOL — céu em degradê, sol listrado,
     grade em fuga. Ele mostrava cor, mas mentia sobre tudo o que um estilo
     faz com uma IMAGEM DE VERDADE: não tinha pele, não tinha um preto real,
     não tinha detalhe fino o bastante para o grão e o desfoque aparecerem, e
     não tinha rosto — que é o que quase todo plano tem.

     Agora é um OLHO em close, desenhado aqui em código, e ele é uma carta de
     teste melhor por seis motivos ao mesmo tempo:

       · PELE, o tom mais difícil de qualquer tratamento de cor — se um
         estilo estraga a pele, aparece na hora;
       · PRETO REAL na pupila e BRANCO ESTOURADO no reflexo, os dois
         extremos numa imagem só: é onde se vê o ombro das altas luzes e o
         pé das sombras;
       · CÍLIOS, linhas de um pixel — é o que mostra nitidez, grão, halação
         e qualquer coisa que borre ou rasgue;
       · A ÍRIS, com fibras finas e anel escuro: detalhe circular, que
         denuncia deslocamento de canal e aberração;
       · a ESCLERA, um branco quase neutro grande o bastante para qualquer
         dominante de cor aparecer;
       · e o CONTRASTE de uma imagem fotográfica, não de um cartaz.

     PRETO E BRANCO À ESQUERDA, COR À DIREITA. As duas metades são o mesmo
     olho, no mesmo lugar — o que muda é só a saturação. Assim a mesma
     miniatura responde às duas perguntas que se faz de um estilo: o que ele
     faz com a COR, e o que ele faz com o TOM quando a cor sai da conta.
     Quem quiser o cartão inteiro colorido põe `PB = 0` logo abaixo.

     Desenhado no DOBRO da medida e reduzido na hora de virar textura: cílio
     de um pixel desenhado em 168px de largura vira um borrão cinza.     */
  var PB = 0.5;                 /* onde acaba o preto e branco (0 = tudo cor) */
  var ZOOM = 0.62;              /* quanto do quadro o olho ocupa (1 = de canto a canto) */
  var cartao = null, cartaoW = 0;

  function cartao80(W, H) {
    if (cartao && cartaoW === W) return cartao;
    cartaoW = W;

    var S = 2;                                       /* o dobro da medida */
    var w = W * S, h = H * S;
    cartao = document.createElement('canvas');
    cartao.width = w; cartao.height = h;
    var c = cartao.getContext('2d');

    /* O OLHO AFASTADO. Desenhado assim ele enchia o quadro de canto a canto,
       e num cartão de 84px isso vira textura: sem saber onde começa a cara,
       não dá para ler que é um olho. Um passo atrás resolve — sobra pele em
       volta, a forma fecha, e o cartão volta a ser uma FOTO.
       O afastamento é uma escala em torno do centro, e não uma mudança nas
       marcas do desenho: as proporções do olho continuam as mesmas, só o
       enquadramento abre.                                              */
    c.save();
    c.translate(w / 2, h / 2); c.scale(ZOOM, ZOOM); c.translate(-w / 2, -h / 2);
    olho(c, w, h, S);
    c.restore();
    if (PB > 0) dessaturar(c, w, h, Math.round(w * PB));
    return cartao;
  }

  /* ------------------------------------------------------------- o olho -- */
  function olho(c, w, h, S) {
    /* as marcas do desenho, em fração do quadro. Tudo abaixo se apoia
       nelas — mexer numa move a cara inteira junto, sem descolar.       */
    var cx = w * 0.50, cy = h * 0.47;                /* centro da íris */
    var R = w * 0.168;                               /* raio da íris */
    var rp = R * 0.42;                               /* raio da pupila */
    var iC = { x: w * 0.115, y: h * 0.575 };         /* canto interno (lacrimal) */
    var oC = { x: w * 0.945, y: h * 0.425 };         /* canto externo */

    /* ---- a pele, base de tudo. Degradê diagonal: a testa pega mais luz
       que a maçã do rosto, e é isso que dá volume sem sombra desenhada. */
    /* o degradê acompanha o quadro AFASTADO, não o original: com o passo
       atrás, o canto de cima à esquerda cai fora do trecho pintado e a pele
       lá vira chapada.                                                 */
    var pele = c.createLinearGradient(-w * 0.32, -h * 0.32, w * 0.62, h * 1.3);
    pele.addColorStop(0, '#f0d3c0');
    pele.addColorStop(0.42, '#e6bfa8');
    pele.addColorStop(1, '#d3a68d');
    c.fillStyle = pele; c.fillRect(-w, -h, w * 3, h * 3);

    /* a órbita: uma sombra larguíssima e fraca em volta do olho. Sem ela a
       pele fica de plástico — é a única coisa que dá profundidade.      */
    var orb = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, w * 1.05);
    orb.addColorStop(0, 'rgba(120,72,52,.30)');
    orb.addColorStop(0.34, 'rgba(150,96,70,.13)');
    orb.addColorStop(0.72, 'rgba(150,96,70,.05)');
    orb.addColorStop(1, 'rgba(96,54,38,.34)');
    c.fillStyle = orb; c.fillRect(-w, -h, w * 3, h * 3);

    /* o poro: ruído fino e claro sobre a pele. É o que a miniatura precisa
       para o grão de um estilo ter contra o que competir.               */
    c.save();
    for (var g = 0; g < 2600; g++) {
      var gx = Math.abs(Math.sin(g * 12.9898) * 43758.5453) % 1;
      var gy = Math.abs(Math.sin(g * 78.233) * 12345.6789) % 1;
      var gv = Math.abs(Math.sin(g * 4.1414) * 9871.23) % 1;
      c.fillStyle = gv > 0.5 ? 'rgba(255,240,230,.16)' : 'rgba(120,80,62,.12)';
      c.fillRect((gx * 3 - 1) * w, (gy * 3 - 1) * h, S, S);
    }
    c.restore();

    /* ---- a abertura do olho: duas curvas do canto interno ao externo. É a
       forma de amêndoa, e tudo que é OLHO fica recortado dentro dela.   */
    function abertura() {
      c.beginPath();
      c.moveTo(iC.x, iC.y);
      c.bezierCurveTo(w * 0.26, h * 0.20, w * 0.66, h * 0.145, oC.x, oC.y);
      c.bezierCurveTo(w * 0.70, h * 0.82, w * 0.32, h * 0.86, iC.x, iC.y);
      c.closePath();
    }

    c.save();
    abertura();
    c.clip();

    /* a esclera não é branca: é cinza-azulada nas bordas e quente perto do
       lacrimal. Branco chapado aqui apaga metade do que um estilo faz.  */
    var esc = c.createRadialGradient(cx, cy - h * 0.04, R * 0.3, cx, cy, w * 0.52);
    esc.addColorStop(0, '#fbfaf9');
    esc.addColorStop(0.60, '#f0edeb');
    esc.addColorStop(1, '#d6cfcc');
    c.fillStyle = esc; c.fillRect(0, 0, w, h);

    /* dois vasinhos, do canto para dentro */
    c.strokeStyle = 'rgba(196,96,86,.34)'; c.lineWidth = S * 0.9;
    c.beginPath();
    c.moveTo(iC.x + w * 0.01, iC.y - h * 0.02);
    c.quadraticCurveTo(w * 0.22, h * 0.50, w * 0.30, h * 0.56);
    c.moveTo(oC.x - w * 0.02, oC.y + h * 0.05);
    c.quadraticCurveTo(w * 0.80, h * 0.56, w * 0.72, h * 0.60);
    c.stroke();

    /* ---- a íris. Quatro camadas: fundo, fibras, anel interno quente e
       anel limbal escuro. É a parte com detalhe circular fino, e é ela
       que denuncia deslocamento de canal e aberração de lente.          */
    var iris = c.createRadialGradient(cx - R * 0.15, cy - R * 0.15, rp * 0.8, cx, cy, R);
    iris.addColorStop(0, '#9fb0b4');
    iris.addColorStop(0.40, '#7d949e');
    iris.addColorStop(0.78, '#5c7684');
    iris.addColorStop(1, '#3d525f');
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
    c.fillStyle = iris; c.fillRect(cx - R, cy - R, R * 2, R * 2);

    /* as fibras: 130 raios do centro para fora, claros e escuros
       alternando por ruído. Cada um tem menos de um pixel na miniatura
       final — é exatamente esse o teste.                                */
    c.lineWidth = S * 0.75;
    for (var i = 0; i < 130; i++) {
      var a = (i / 130) * Math.PI * 2;
      var n = Math.abs(Math.sin(i * 7.13) * 1000) % 1;
      var r0 = rp * (1.02 + n * 0.22);
      var r1 = R * (0.80 + ((Math.abs(Math.sin(i * 3.71) * 733) % 1)) * 0.20);
      c.strokeStyle = n > 0.5
        ? 'rgba(226,236,238,' + (0.16 + n * 0.30) + ')'
        : 'rgba(28,44,54,' + (0.16 + n * 0.34) + ')';
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      c.stroke();
    }
    /* o colarinho: o anel dourado junto da pupila */
    var col = c.createRadialGradient(cx, cy, rp * 0.95, cx, cy, R * 0.56);
    col.addColorStop(0, 'rgba(176,146,74,.72)');
    col.addColorStop(1, 'rgba(176,146,74,0)');
    c.fillStyle = col; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    c.restore();

    /* o anel limbal: a borda escura da íris. É o preto mais "cheio" da
       imagem depois da pupila.                                          */
    c.strokeStyle = 'rgba(22,32,40,.85)'; c.lineWidth = R * 0.10;
    c.beginPath(); c.arc(cx, cy, R * 0.955, 0, Math.PI * 2); c.stroke();

    /* ---- a pupila: preto de verdade, com a borda mordida de leve */
    c.fillStyle = '#08080a';
    c.beginPath(); c.arc(cx, cy, rp, 0, Math.PI * 2); c.fill();

    /* ---- o reflexo: branco estourado, e o segundo, pequeno, embaixo.
       Estes dois pontos são o topo da escala inteira do quadro.        */
    c.fillStyle = 'rgba(255,255,255,.97)';
    c.beginPath();
    c.ellipse(cx + rp * 0.34, cy - rp * 0.46, rp * 0.32, rp * 0.42, -0.35, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)';
    c.beginPath(); c.arc(cx - rp * 0.58, cy + rp * 0.66, rp * 0.15, 0, Math.PI * 2); c.fill();

    /* a sombra da pálpebra de cima cai sobre o globo — é o que impede o
       olho de parecer colado em cima da cara                            */
    var somb = c.createLinearGradient(0, h * 0.14, 0, h * 0.44);
    somb.addColorStop(0, 'rgba(58,34,26,.58)');
    somb.addColorStop(1, 'rgba(58,34,26,0)');
    c.fillStyle = somb; c.fillRect(0, 0, w, h * 0.46);

    c.restore();                                    /* sai do recorte */

    /* ---- o lacrimal, no canto interno: rosa, molhado, com um brilho */
    c.save();
    c.beginPath();
    c.moveTo(iC.x - w * 0.055, iC.y - h * 0.035);
    c.quadraticCurveTo(iC.x + w * 0.035, iC.y - h * 0.06, iC.x + w * 0.045, iC.y + h * 0.005);
    c.quadraticCurveTo(iC.x + w * 0.01, iC.y + h * 0.055, iC.x - w * 0.055, iC.y - h * 0.035);
    c.closePath();
    c.fillStyle = '#d98b84'; c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath();
    c.ellipse(iC.x - w * 0.012, iC.y - h * 0.012, w * 0.014, h * 0.016, -0.5, 0, Math.PI * 2);
    c.fill();
    c.restore();

    /* ---- a linha d'água de baixo: um filete claro, quase branco, logo
       abaixo da abertura. Some se não estiver lá, e o olho seca.        */
    c.strokeStyle = 'rgba(255,250,246,.40)'; c.lineWidth = S * 1.3;
    c.beginPath();
    c.moveTo(iC.x + w * 0.02, iC.y + h * 0.012);
    c.bezierCurveTo(w * 0.34, h * 0.87, w * 0.70, h * 0.83, oC.x - w * 0.02, oC.y + h * 0.012);
    c.stroke();

    /* ---- as pálpebras por cima: a de cima com o rebordo escuro e a prega
       lá em cima; a de baixo com a dobra e o brilho do rebordo.         */
    /* rebordo de cima */
    c.strokeStyle = 'rgba(48,26,20,.80)'; c.lineWidth = S * 2.6;
    c.beginPath();
    c.moveTo(iC.x, iC.y);
    c.bezierCurveTo(w * 0.26, h * 0.20, w * 0.66, h * 0.145, oC.x, oC.y);
    c.stroke();
    /* a prega, mais alta e mais fraca */
    c.strokeStyle = 'rgba(120,78,60,.38)'; c.lineWidth = S * 1.4;
    c.beginPath();
    c.moveTo(w * 0.10, h * 0.30);
    c.bezierCurveTo(w * 0.30, h * 0.03, w * 0.72, h * 0.00, w * 0.99, h * 0.20);
    c.stroke();
    /* a dobra de baixo */
    c.strokeStyle = 'rgba(150,102,80,.34)'; c.lineWidth = S * 1.4;
    c.beginPath();
    c.moveTo(w * 0.06, h * 0.66);
    c.bezierCurveTo(w * 0.32, h * 1.02, w * 0.72, h * 0.98, w * 1.0, h * 0.60);
    c.stroke();

    /* ---- OS CÍLIOS. São o detalhe mais fino do quadro inteiro e o motivo
       de o cartão ser desenhado no dobro da medida: cada um é uma curva de
       menos de um pixel na miniatura pronta. Nitidez, grão, halação e
       desfoque aparecem AQUI antes de aparecer em qualquer outro lugar. */
    function cilios(n, t0, t1, comp, dir, alfa) {
      for (var k = 0; k < n; k++) {
        var t = t0 + (t1 - t0) * (k / (n - 1));
        var jit = (Math.abs(Math.sin(k * 17.31) * 5417.9) % 1);
        var px = w * t;
        /* segue a mesma curva da pálpebra, aproximada por parábola */
        var py = dir < 0
          ? h * (0.235 + 1.30 * (t - 0.52) * (t - 0.52) + (t < 0.2 ? 0.28 * (0.2 - t) : 0))
          : h * (0.775 - 1.10 * (t - 0.52) * (t - 0.52) - (t < 0.2 ? 0.24 * (0.2 - t) : 0));
        var L = h * comp * (0.62 + jit * 0.55);
        var incl = (t - 0.5) * 1.5;                 /* abrem para os cantos */
        c.strokeStyle = 'rgba(16,12,12,' + (alfa * (0.55 + jit * 0.45)) + ')';
        c.lineWidth = S * (0.7 + jit * 0.7);
        c.beginPath();
        c.moveTo(px, py);
        c.quadraticCurveTo(
          px + incl * L * 0.5, py + dir * L * 0.62,
          px + incl * L * 1.5, py + dir * L * (dir < 0 ? 1.0 : 0.86)
        );
        c.stroke();
      }
    }
    c.lineCap = 'round';
    cilios(46, 0.09, 0.96, 0.20, -1, 0.95);          /* os de cima, longos */
    cilios(34, 0.16, 0.92, 0.10, 1, 0.72);           /* os de baixo, curtos */
  }

  /* ------------------------------------- a metade em preto e branco ------
     Pixel a pixel, com a luminância de vídeo (Rec.709). Podia ser um
     `globalCompositeOperation:'saturation'`, mas a conta do navegador para
     esse modo é em HSL e escurece o azul da íris — a luminância é a mesma
     que o motor do laboratório usa, e as duas metades continuam casando no
     tom.                                                                */
  function dessaturar(c, w, h, ate) {
    var d;
    try { d = c.getImageData(0, 0, ate, h); } catch (e) { return; }
    var p = d.data;
    for (var i = 0; i < p.length; i += 4) {
      var y = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
      p[i] = p[i + 1] = p[i + 2] = y;
    }
    c.putImageData(d, 0, 0);
  }
  L.cartao80 = cartao80;

  var stPend = [], stPintando = false, stObs = null;

  function cadeiaDoEstilo(st) {
    return st.fx.map(function (par) {
      var pr = VE.defaults(par[0]);
      Object.keys(par[1]).forEach(function (k) { pr[k] = par[1][k]; });
      return { id: par[0], params: pr, amount: 1, local: 0, mask: VE.newMask() };
    });
  }

  function filaEstilos() {
    if (stPintando) return;
    stPintando = true;
    requestAnimationFrame(function passo() {
      var F = VE.filters;
      if (!F || !F.mini || !stPend.length) { stPintando = false; return; }
      var r = F.mini.renderer();
      if (!r) { stPend.length = 0; stPintando = false; return; }
      var tex = r.upload('src', cartao80(F.mini.W, F.mini.H), true);
      if (!tex) { stPintando = false; return; }

      /* dois por quadro: uma cadeia de estilo compila VÁRIOS shaders de uma
         vez, e é a compilação que pesa — não o desenho                   */
      var n = 0;
      while (stPend.length && n < 2) {
        var el = stPend.shift();
        if (!el.isConnected) continue;
        var st = VE.STYLES.filter(function (x) { return x.id === el.dataset.style; })[0];
        if (!st) continue;
        var img = el.querySelector('img.l2stthumb');
        if (!img) {
          img = document.createElement('img');
          img.className = 'l2stthumb';
          img.alt = '';
          el.insertBefore(img, el.firstChild);
        }
        var url = null;
        try { url = F.mini.render(r, tex, cadeiaDoEstilo(st), 0); } catch (e) { }
        if (url) { img.src = url; el.dataset.l2pronto = '1'; }
        n++;
      }
      if (stPend.length) requestAnimationFrame(passo);
      else stPintando = false;
    });
  }

  function observarEstilos() {
    var lista = $('#styleList');
    if (!lista) return;
    if (!stObs && window.IntersectionObserver) {
      stObs = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (!e.isIntersecting) return;
          if (e.target.dataset.l2pronto) { stObs.unobserve(e.target); return; }
          if (stPend.indexOf(e.target) < 0) stPend.push(e.target);
        });
        filaEstilos();
      }, { root: lista.parentElement || lista, rootMargin: '160px' });
    }
    lista.querySelectorAll('.styleitem').forEach(function (el) {
      if (stObs) stObs.observe(el);
      else if (stPend.indexOf(el) < 0) stPend.push(el);
    });
    if (!stObs) filaEstilos();
  }

  /* a lista se refaz a cada busca; as miniaturas dos itens novos entram
     logo depois, no mesmo quadro, para não piscar célula vazia         */
  function engatarEstilos() {
    if (!VE.panels || !VE.panels.renderStyles) { setTimeout(engatarEstilos, 60); return; }
    var orig = VE.panels.renderStyles;
    VE.panels.renderStyles = function () {
      var r = orig.apply(this, arguments);
      stPend.length = 0;
      setTimeout(observarEstilos, 0);
      return r;
    };
    observarEstilos();
  }
  engatarEstilos();

  /* ============================ A ASSINATURA SOBE PARA O CABEÇALHO =======
     Ela estava no rodapé, e o rodapé só aparece se o conteúdo couber. Grudar
     o rodapé no fundo resolvia isso e criava outro problema: uma barra fixa
     atravessando a página, que é peso demais para uma linha de crédito.

     Subir é a saída melhor. Ao lado de "Laboratório Audiovisual
     Experimental" ela não depende de rolagem nenhuma, e fica onde a leitura
     começa em vez de onde ela termina.

     É uma MUDANÇA DE LUGAR, não uma cópia: o mesmo elemento sai do rodapé e
     entra no cabeçalho. Duas assinaturas na mesma página seriam uma a mais.   */
  function subirAssinatura() {
    var hero = document.querySelector('.home-hero');
    var foot = document.querySelector('.home-foot');
    if (!hero || !foot) { setTimeout(subirAssinatura, 200); return; }
    var by = foot.querySelector('.byline');
    var sub = hero.querySelector('.home-sub');
    if (!by || !sub || by.dataset.l2subiu) return;
    by.dataset.l2subiu = '1';

    /* uma CAIXA para as duas, e não uma ao lado da outra soltas.

       Pôr as duas como `inline` na mesma linha quase funcionou: ficavam lado
       a lado e 6px fora de prumo. `vertical-align:middle` alinha pela linha
       de base do texto, não pelo centro das caixas — e como uma tem corpo
       maior que a outra, os centros não coincidem.

       Numa caixa flex com `align-items:center` o alinhamento é pelo centro
       de verdade, que é o que o olho compara quando as duas dividem a linha. */
    var linha = document.createElement('div');
    linha.className = 'l2subline';
    sub.parentNode.insertBefore(linha, sub);
    linha.appendChild(sub);
    linha.appendChild(by);
  }
  subirAssinatura();

  /* a mesa se redesenha inteira a cada mudança; miniatura e etiqueta
     entram logo depois, no mesmo quadro, para não piscar barra vazia  */
  function engatar() {
    if (!VE.tl || !VE.tl.render) { setTimeout(engatar, 40); return; }
    var orig = VE.tl.render;
    VE.tl.render = function () {
      var r = orig.apply(this, arguments);
      rotularPistas();
      pintarClipes();
      return r;
    };
  }
  engatar();
  engatarCatalogo();

  /* e uma vez na entrada, para o primeiro laboratório aberto */
  (function esperar(){
    if(!$("#side") || $("#shell").classList.contains("hidden")){ setTimeout(esperar, 80); return; }
    montarTorre(VE.shell.view);
  })();


  /* ================== A MINIATURA DENTRO DA PILHA DE EFEITOS =============
     O catálogo da esquerda ganhou miniatura e a pilha da direita continuou
     uma lista de nomes. É o lugar ERRADO para faltar imagem: no catálogo
     você escolhe, na pilha você EDITA — e editar "erosão" sem ver o que a
     erosão está fazendo no seu plano é mexer no escuro.

     Duas diferenças em relação à do catálogo, e as duas importam:

       · a do catálogo desenha o efeito com os valores DE FÁBRICA, porque
         ali ele ainda não é seu. Aqui ela desenha com os valores QUE VOCÊ
         PÔS — intensidade, parâmetros, tudo. Mexeu no controle deslizante,
         a miniatura acompanha. É a resposta que faltava;
       · e ela se refaz sozinha, porque a ficha inteira é reescrita a cada
         toque. Daí o cache: a conta só roda quando a cadeia realmente
         mudou, e não a cada redesenho da coluna.

     A REGIÃO fica de fora do desenho de propósito. A máscara é medida no
     quadro do clipe, e a miniatura é medida no quadro da COMPOSIÇÃO — as
     duas quase nunca coincidem, e uma miniatura com a máscara no lugar
     errado é pior do que uma sem máscara nenhuma. Aqui ela mostra o efeito;
     a prévia grande mostra onde ele cai.

     NADA disto toca no `js/motion.js`: o HTML da pilha continua o mesmo, e
     a imagem entra depois, por fora. Se este arquivo não carregar, a pilha
     volta a ser a lista de nomes de sempre.                             */
  var pilhaCache = {};          /* chave da cadeia → jpeg pronto */
  var pilhaPend = [], pilhaPintando = false, pilhaTimer = 0;

  /* o clipe cuja ficha está aberta: o ÚLTIMO da seleção, que é o mesmo que
     o `js/motion.js` usa para montar a coluna                            */
  function clipeDaFicha() {
    var p = VE.project;
    if (!p || !p.selection || !p.selection.length) return null;
    var f = VE.findClip(p.selection[p.selection.length - 1]);
    return f ? f.clip : null;
  }

  /* os valores de fábrica com os seus por cima: o efeito guardado só tem o
     que foi mexido, e o motor precisa da lista inteira                   */
  function paramsCheios(e) {
    var pr = VE.defaults(e.fx);
    var meus = e.params || {};
    Object.keys(meus).forEach(function (k) { pr[k] = meus[k]; });
    return pr;
  }

  function pintarPilha() {
    var box = document.getElementById('props');
    if (!box) return;
    var linhas = box.querySelectorAll('.fxrow[data-eff]');
    if (!linhas.length) return;

    var clip = clipeDaFicha();
    if (!clip || !clip.effects) return;

    /* o quadro do cursor muda a carta inteira; entra na chave para a
       miniatura velha não sobreviver a uma troca de plano               */
    var F = VE.filters;
    if (!F || !F.mini) return;
    var quadro = (VE.project ? VE.project.time : 0).toFixed(2);

    linhas.forEach(function (li) {
      var e = clip.effects.filter(function (x) { return x.id === li.dataset.eff; })[0];
      if (!e || !VE.FXBY[e.fx]) return;

      var img = li.querySelector('img.l2pilhathumb');
      if (!img) {
        img = document.createElement('img');
        img.className = 'l2pilhathumb';
        img.alt = '';
        li.insertBefore(img, li.firstChild);
      }
      var pr = paramsCheios(e);
      var chave = quadro + '|' + e.fx + '|' + (e.amount == null ? 1 : e.amount) +
        '|' + JSON.stringify(pr);

      /* JÁ PINTADA. `data-chave` só é escrito DEPOIS de a imagem existir —
         se fosse escrito ao entrar na fila, o próximo passo do observador
         (que dispara por causa do <img> recém-inserido) leria "pronta" e
         jogaria fora o trabalho ainda por fazer. Foi esse o defeito: a
         pilha ficava com três quadrados pretos para sempre.           */
      if (img.dataset.chave === chave) return;
      if (pilhaCache[chave]) {
        img.src = pilhaCache[chave]; img.dataset.chave = chave; return;
      }
      /* na fila com a chave velha (o valor mudou no meio): sai */
      for (var i = pilhaPend.length - 1; i >= 0; i--) {
        if (pilhaPend[i].img === img) {
          if (pilhaPend[i].chave === chave) return;   /* já pedida, igualzinha */
          pilhaPend.splice(i, 1);
        }
      }
      pilhaPend.push({ img: img, chave: chave, fx: e.fx, pr: pr,
                       amount: e.amount == null ? 1 : e.amount });
    });
    if (pilhaPend.length) filaPilha();
  }

  function filaPilha() {
    if (pilhaPintando) return;
    /* tocando, o quadro muda a cada passada e a pilha inteira piscaria.
       Não é desistir: volta a tentar quando o transporte parar.       */
    if (VE.app && VE.app.playing) { setTimeout(filaPilha, 400); return; }
    pilhaPintando = true;
    requestAnimationFrame(function passo() {
      var F = VE.filters;
      if (!F || !F.mini || !pilhaPend.length) { pilhaPintando = false; return; }
      var r = F.mini.renderer();
      if (!r) { pilhaPend.length = 0; pilhaPintando = false; return; }
      var f = F.mini.fonte();
      var tex = r.upload('src', f.el, !f.live);
      if (!tex) { pilhaPintando = false; return; }
      var t = VE.project ? VE.project.time : 0;

      /* uma pilha tem dez efeitos no pior caso, não cento e quarenta e
         sete — duas por quadro chega antes de o olho notar              */
      var n = 0;
      while (pilhaPend.length && n < 2) {
        var job = pilhaPend.shift();
        if (!job.img.isConnected) continue;
        var url = null;
        try {
          url = F.mini.render(r, tex, [{
            id: job.fx, params: job.pr, amount: job.amount,
            local: 0, mask: VE.newMask()
          }], t);
        } catch (err) { }
        if (url) {
          pilhaCache[job.chave] = url;
          /* o cache não pode crescer para sempre numa sessão longa */
          var ks = Object.keys(pilhaCache);
          if (ks.length > 120) delete pilhaCache[ks[0]];
          job.img.src = url;
          job.img.dataset.chave = job.chave;
        }
        n++;
      }
      if (pilhaPend.length) requestAnimationFrame(passo);
      else pilhaPintando = false;
    });
  }

  /* a ficha se reescreve inteira a cada toque — inclusive a cada passo de
     um controle deslizante. O adiamento junta a rajada num desenho só.  */
  function agendarPilha() {
    clearTimeout(pilhaTimer);
    pilhaTimer = setTimeout(pintarPilha, 90);
  }

  function engatarPilha() {
    var box = document.getElementById('props');
    if (!box) { setTimeout(engatarPilha, 120); return; }
    new MutationObserver(agendarPilha).observe(box, { childList: true, subtree: true });
    agendarPilha();
  }
  engatarPilha();


  /* ============================ OS ÍCONES CHEIOS DA GRADE FONTE ==========
     Os ícones da grade vinham de traço fino — 1,25px de contorno num quadro
     de 17px. Sobre o cartão escuro do Classic isso funciona; dentro de uma
     pastilha CHEIA da cor do canal, não: traço branco sobre azul a 30px lê
     como rabisco, e o desenho some antes de o olho reconhecer a forma. A
     referência é clara — silhueta MACIÇA, sem contorno.

     O DESENHO ENTRA POR AQUI, NÃO PELO index.html, e o motivo é o mesmo de
     sempre neste arquivo: o `index.html` é o documento que o Classic também
     carrega, e lá os ícones de traço estão certos. Trocar na fonte mudaria
     os dois; trocar aqui muda só o 2.0.

     Cada ícone é a marcação INTEIRA de dentro do <svg> — não só um `d` —
     porque nem todo desenho é uma silhueta só. O quadro é o mesmo `viewBox`
     de 24×24 que já estava lá, então nada muda de tamanho nem de alinhamento.
     Onde a forma pede um ANEL (a moldura da imagem, da legenda, do escâner),
     o traço grosso é o desenho, não o contorno de um desenho.          */
  var CHEIOS = {
    /* a folha com o canto dobrado: a diagonal no alto à direita é o dobrão,
       e é ela que diferencia "documento" de "retângulo"                  */
    srcFile:
      '<path d="M6.6 2.4h6.9l4.5 4.5v12.5a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V4.6a2.2 2.2 0 0 1 2.2-2.2z"/>',

    /* a câmera: corpo em pastilha e a lente em cunha, encostada nele */
    srcCam:
      '<rect x="2.4" y="6.4" width="13.4" height="11.2" rx="2.8"/>' +
      '<path d="M17.4 10.9l3.5-2.4a.9.9 0 0 1 1.5.8v5.4a.9.9 0 0 1-1.5.8l-3.5-2.4z"/>',

    /* a foto: moldura em anel, com o sol e a serra maciços por dentro */
    srcImage:
      '<rect x="2.5" y="4.4" width="19" height="15.2" rx="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
      '<circle cx="8.5" cy="9.7" r="1.8"/>' +
      '<path d="M4.5 18.5l3.6-4.3a1.1 1.1 0 0 1 1.7 0l2 2.4 2.4-3a1.1 1.1 0 0 1 1.7 0l3.6 4.9z"/>',

    /* o T de serifa: barra, haste e pé. Três pastilhas que se encontram —
       um T sem pé lê como cruz, e um T sem serifa some no cartão      */
    srcType:
      '<rect x="3.6" y="3.4" width="16.8" height="3.2" rx="1"/>' +
      '<rect x="10.3" y="4.4" width="3.4" height="16" rx="1"/>' +
      '<rect x="7.4" y="17.4" width="9.2" height="3" rx="1"/>',

    /* a legenda: a mesma moldura em anel, com três linhas de texto — a
       última mais curta, que é o que faz ler LINHA e não listra      */
    srcLegenda:
      '<rect x="2.5" y="4.6" width="19" height="14.8" rx="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
      '<rect x="6" y="8.6" width="12" height="1.8" rx=".9"/>' +
      '<rect x="6" y="12" width="12" height="1.8" rx=".9"/>' +
      '<rect x="6" y="15.4" width="7.2" height="1.8" rx=".9"/>',

    /* a onda em barras, como na referência: sete pastilhas verticais, altura
       crescendo e caindo. Onda de traço fino desaparece; barra não.    */
    srcAudio:
      '<rect x="2.6" y="8.5" width="1.9" height="7" rx=".95"/>' +
      '<rect x="5.7" y="5.5" width="1.9" height="13" rx=".95"/>' +
      '<rect x="8.8" y="2.5" width="1.9" height="19" rx=".95"/>' +
      '<rect x="11.9" y="1" width="1.9" height="22" rx=".95"/>' +
      '<rect x="15" y="3.5" width="1.9" height="17" rx=".95"/>' +
      '<rect x="18.1" y="6.5" width="1.9" height="11" rx=".95"/>' +
      '<rect x="21.2" y="9.5" width="1.9" height="5" rx=".95"/>',

    /* a carta de teste: a moldura e os campos dentro dela */
    srcTest:
      '<rect x="2.5" y="3.6" width="19" height="16.8" rx="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
      '<rect x="5.9" y="7" width="4.6" height="10" rx="1.3"/>' +
      '<rect x="13.5" y="7" width="4.6" height="5.6" rx="1.3"/>' +
      '<rect x="13.5" y="14.4" width="4.6" height="2.6" rx="1.3"/>',

    /* o escâner: a moldura, o cabeçote aceso no meio e o que ele já leu
       e o que ainda falta, apagados                                    */
    srcMesa:
      '<rect x="2.5" y="4.6" width="19" height="14.8" rx="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
      '<rect x="5.4" y="11.1" width="13.2" height="1.8" rx=".9"/>' +
      '<rect x="7.6" y="7.4" width="8.8" height="1.6" rx=".8" opacity=".5"/>' +
      '<rect x="7.6" y="15" width="8.8" height="1.6" rx=".8" opacity=".5"/>',

    /* o mosaico: quatro quadros cheios */
    srcMosaico:
      '<rect x="2.8" y="2.8" width="8.4" height="8.4" rx="2.2"/>' +
      '<rect x="12.8" y="2.8" width="8.4" height="8.4" rx="2.2"/>' +
      '<rect x="2.8" y="12.8" width="8.4" height="8.4" rx="2.2"/>' +
      '<rect x="12.8" y="12.8" width="8.4" height="8.4" rx="2.2"/>',

    /* o sonógrafo: a moldura em anel, a LINHA FIXA atravessando o quadro de
       ponta a ponta (é ela que sai por fora em cima e embaixo — a linha não
       está dentro do vídeo, o vídeo é que passa por ela) e a nota que nasce
       do outro lado. Três coisas, que são exatamente as três da ferramenta:
       imagem, linha, som.                                               */
    srcSonografo:
      '<rect x="2.5" y="4.6" width="19" height="14.8" rx="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
      '<rect x="8.1" y="1.4" width="1.9" height="21.2" rx=".95"/>' +
      '<ellipse cx="13.6" cy="15.7" rx="2.5" ry="1.95" transform="rotate(-18 13.6 15.7)"/>' +
      '<rect x="15.2" y="7.2" width="1.9" height="8.6" rx=".95"/>' +
      '<path d="M17.1 7.2l3.5-1.05v2.5L17.1 9.7z"/>',

    /* a filmadora: os dois carretéis em cima do corpo e a lente em cunha
       — a silhueta que diz CÂMERA DE FILME sem precisar de rótulo     */
    srcFilmadora:
      '<circle cx="7.1" cy="5.4" r="3.3"/>' +
      '<circle cx="14.1" cy="5.4" r="3.3"/>' +
      '<rect x="2.6" y="9.6" width="13.8" height="10.4" rx="2.6"/>' +
      '<path d="M17.8 13.4l3.5-2.3a.9.9 0 0 1 1.4.8v5.8a.9.9 0 0 1-1.4.8l-3.5-2.3z"/>',

    /* sobrepor: dois quadros, o de trás mais apagado. A transparência é o
       desenho — é ela que diz "um POR CIMA do outro"                   */
    srcOver:
      '<rect x="2.4" y="8.4" width="13.2" height="13.2" rx="3" opacity=".5"/>' +
      '<rect x="8.4" y="2.4" width="13.2" height="13.2" rx="3"/>',

    /* ---------------------------------------------- laboratório de áudio */
    auFile: null,                 /* a mesma folha do vídeo, preenchida abaixo */
    /* o microfone: cápsula e arco, maciços */
    auMic:
      '<rect x="8.7" y="1.9" width="6.6" height="12" rx="3.3"/>' +
      '<path d="M5.4 10.9a1.15 1.15 0 0 1 1.15 1.15 5.45 5.45 0 0 0 10.9 0 1.15 1.15 0 0 1 2.3 0 7.75 7.75 0 0 1-6.6 7.66v1.14a1.15 1.15 0 0 1-2.3 0v-1.14a7.75 7.75 0 0 1-6.6-7.66A1.15 1.15 0 0 1 5.4 10.9z"/>',
    /* o tom de teste: a senoide. Aqui o traço É a forma — mas grosso e de
       ponta redonda, do peso das silhuetas ao lado                     */
    auTone:
      '<path d="M2.6 12c2.6-8 5.2 8 7.8 0s5.2-8 7.8 0" fill="none" stroke="currentColor" ' +
      'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="20.2" y="10.7" width="2.4" height="2.6" rx="1.2"/>',
    /* do vídeo: a mesma câmera, para dizer que o som vem de lá */
    auFromVideo: null
  };
  CHEIOS.auFile = CHEIOS.srcFile;
  CHEIOS.auFromVideo = CHEIOS.srcCam;
  CHEIOS.auSonografo = CHEIOS.srcSonografo;
  /* a cifra: três cabeças de nota numa haste só — um ACORDE, que é o
     que o instrumento entrega ao apertar uma pastilha              */
  CHEIOS.auCifra =
    '<ellipse cx="7.4" cy="17.3" rx="3.1" ry="2.4" transform="rotate(-18 7.4 17.3)"/>' +
    '<ellipse cx="7.4" cy="11.9" rx="3.1" ry="2.4" transform="rotate(-18 7.4 11.9)"/>' +
    '<ellipse cx="7.4" cy="6.5" rx="3.1" ry="2.4" transform="rotate(-18 7.4 6.5)"/>' +
    '<rect x="9.7" y="3.4" width="1.9" height="14.2" rx=".95"/>' +
    '<path d="M11.6 3.4l6.4-1.05v2.5L11.6 5.9z"/>';

  /* Troca o miolo do <svg> que já está no botão. Não mexe no <svg> em si —
     o `viewBox`, a classe e o lugar continuam os do documento; o que muda é
     o desenho. E `fill`/`stroke` vão no elemento raiz porque a folha do
     Classic manda `fill:none` nele: sem isto a silhueta não aparece.   */
  function encherIcones() {
    var achou = 0;
    Object.keys(CHEIOS).forEach(function (id) {
      var bt = document.getElementById(id);
      if (!bt || bt.dataset.l2icone) return;
      var svg = bt.querySelector('svg');
      if (!svg) return;
      svg.innerHTML = CHEIOS[id];
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('stroke', 'none');
      bt.dataset.l2icone = '1';
      achou++;
    });
    return achou;
  }
  L.encherIcones = encherIcones;

  /* a grade é HTML fixo do documento: uma passada basta. A espera é só para
     o caso de este arquivo correr antes de o corpo estar montado.      */
  (function esperarIcones(tentativa) {
    if (encherIcones() === 0 && (tentativa || 0) < 40) {
      setTimeout(function () { esperarIcones((tentativa || 0) + 1); }, 100);
    }
  })(0);


  /* ══════════════════════════════════════════════════════════════════════
     A SCANNER STATION — a mesa de digitalização vira APARELHO
     ----------------------------------------------------------------------
     A janela da mesa tinha tudo o que precisa e a cara de uma caixa de
     diálogo: dois retângulos e quatro colunas de formulário. O que ela é, na
     verdade, é um INSTRUMENTO — um cabeçote que anda linha a linha enquanto
     a mão mexe na bancada. Instrumento se opera, não se preenche.

     Aqui ela é remontada como um aparelho de bancada: chassi de metal,
     tampa articulada com as duas telas, dobradiça, mesa de controle com
     knobs de verdade e um pé com o LED de estado.

     TRÊS REGRAS QUE ESTA REPAGINAÇÃO SEGUE

     1. NADA DE FUNÇÃO NOVA ESCONDIDA NUM ENFEITE. Cada peça tridimensional
        opera um controle que já existe: os três knobs são os três
        deslizadores (velocidade, grão, onda) e continuam falando com eles
        pelo evento `input` — quem responde é o mesmo `js/mesaui.js` de
        sempre. O quarto knob é a MANIVELA, e ela usa `VE.mesa.linha`, a
        mesma primitiva que o motor usa para gravar uma linha.

     2. NADA DE MEXER NO MOTOR. `js/mesa.js` não é tocado. `js/mesaui.js`
        ganhou uma linha — expor `pintar` — e nada mais.

     3. NADA DE `transform` NAS SUPERFÍCIES QUE A MÃO USA. Inclinar o
        aparelho com `rotateX` daria a perspectiva de graça e quebraria a
        bancada: o arrasto e a roda medem `getBoundingClientRect` para
        converter pixel de tela em pixel de filme, e num plano girado essa
        conta deixa de ser linear. A profundidade aqui é construída com
        ESPESSURA, sombra de contato e chanfro — que é como um objeto real
        se dá a ver de qualquer jeito. A leitura de "visto um pouco de cima"
        fica por conta das peças que não recebem toque: a aresta da tampa e
        o pé, ambos levemente trapezoidais.
     ══════════════════════════════════════════════════════════════════════ */

  var knobs = [];              /* todos, para ressincronizar de uma vez */

  function cria(cls, dentro) {
    var d = document.createElement('div');
    d.className = cls;
    if (dentro != null) d.innerHTML = dentro;
    return d;
  }

  /* ------------------------------------------------------ O KNOB ------- */
  /* Um knob é uma peça: aro de metal, tampa escura, marca de posição e um
     anel que acende quando o valor sai do zero. O corpo é focável e
     responde a arrasto, roda e teclado — quem não usa mouse continua
     tendo o deslizador logo ao lado, que não saiu de cena.            */
  function fazerKnob(rot, tam, dica) {
    var d = cria('l2sc-knob l2sc-knob-' + tam);
    d.innerHTML =
      '<span class="l2sc-knob-rot">' + rot + '</span>' +
      '<div class="l2sc-knob-corpo" tabindex="0" role="slider" title="' + (dica || rot) + '"' +
      ' aria-label="' + rot + '">' +
      '<div class="l2sc-knob-cap"><i></i></div>' +
      '<div class="l2sc-knob-luz"></div>' +
      '</div>' +
      '<div class="l2sc-knob-esc"><span>−</span><span>+</span></div>';
    return d;
  }

  /* o gesto, igual nos dois tipos de knob: arrastar para cima sobe.
     `chamar(delta)` recebe o quanto girou, na unidade de quem chamou. */
  function gesto(d, curso, chamar, aoSoltar) {
    var corpo = d.querySelector('.l2sc-knob-corpo');
    var arr = null;

    function mover(ev) {
      if (!arr) return;
      var dy = arr.y - ev.clientY;
      if (!dy) return;
      arr.y = ev.clientY;
      chamar(dy * curso);
    }
    function solta() {
      if (!arr) return;
      arr = null; d.classList.remove('l2sc-girando');
      document.removeEventListener('pointermove', mover);
      document.removeEventListener('pointerup', solta);
      document.removeEventListener('pointercancel', solta);
      if (aoSoltar) aoSoltar();
    }

    corpo.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      /* O ESTADO PRIMEIRO, A CAPTURA DEPOIS — e dentro de um try.

         Estava ao contrário, e o defeito era silencioso: quando
         `setPointerCapture` recusa o ponteiro (lança NotFoundError), a
         exceção interrompia o ouvinte ANTES de `arr` ser criado, e o knob
         não girava mais. Sem erro no console, porque exceção dentro de
         ouvinte de evento não sobe para lugar nenhum — só um botão que
         parou de responder.

         A captura é conveniência: ela mantém o gesto vivo quando o dedo sai
         de cima do knob. Quem faz o gesto acontecer é o ouvinte no
         DOCUMENTO, que vale com captura ou sem ela.                    */
      arr = { y: ev.clientY };
      d.classList.add('l2sc-girando');
      try { corpo.setPointerCapture(ev.pointerId); } catch (x) { }
      document.addEventListener('pointermove', mover);
      document.addEventListener('pointerup', solta);
      document.addEventListener('pointercancel', solta);
    });
    corpo.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      chamar((ev.deltaY < 0 ? 1 : -1) * curso * 12);
    }, { passive: false });
    corpo.addEventListener('keydown', function (ev) {
      var k = ev.key, n = 0;
      if (k === 'ArrowUp' || k === 'ArrowRight') n = 1;
      else if (k === 'ArrowDown' || k === 'ArrowLeft') n = -1;
      else if (k === 'PageUp') n = 10;
      else if (k === 'PageDown') n = -10;
      else return;
      ev.preventDefault(); ev.stopPropagation();
      chamar(n * curso * 10);
    });
  }

  /* ---- knob amarrado a um deslizador que já existe ------------------- */
  /* Quem manda continua sendo o <input type=range>: o knob escreve nele e
     dispara `input`. O ouvinte do js/mesaui.js faz o resto — parâmetro,
     redesenho, tudo. Se este arquivo sumir, os deslizadores continuam.  */
  function knobDoRange(rot, tam, range, dica) {
    var d = fazerKnob(rot, tam, dica);
    var corpo = d.querySelector('.l2sc-knob-corpo');
    var cap = d.querySelector('.l2sc-knob-cap');
    var min = parseFloat(range.min), max = parseFloat(range.max);
    var passo = parseFloat(range.step) || 1;
    var faixa = (max - min) || 1;
    var casas = (String(passo).split('.')[1] || '').length;

    /* O ÂNGULO CONTÍNUO, E O VALOR QUANTIZADO.

       `bruto` guarda a posição real do eixo, com casas decimais; o
       deslizador recebe só o valor arredondado no passo dele. Sem isso o
       knob tinha um defeito que só aparece no arrasto LENTO: um passo de
       1px vale 0,42 no grão, arredondar dava o mesmo número de antes, e a
       peça girava para nada. Com o mouse rápido funcionava e com a mão
       parada não — que é o pior tipo de defeito, porque parece capricho do
       aparelho.                                                        */
    var bruto = null, ultimo = null;

    function mostrar() {
      var v = parseFloat(range.value);
      if (!isFinite(v)) v = min;
      /* alguém mexeu no deslizador (ou trocou a fonte): o eixo se
         reposiciona em cima do valor novo em vez de continuar de onde
         estava                                                        */
      if (ultimo === null || v !== ultimo) { bruto = v; ultimo = v; }
      var f = Math.max(0, Math.min(1, (v - min) / faixa));
      cap.style.setProperty('--g', (-140 + f * 280).toFixed(1) + 'deg');
      corpo.setAttribute('aria-valuemin', String(min));
      corpo.setAttribute('aria-valuemax', String(max));
      corpo.setAttribute('aria-valuenow', String(v));
      d.classList.toggle('l2sc-aceso', f > 0.004);
    }
    function mexer(dv) {
      if (bruto === null) {
        bruto = parseFloat(range.value);
        if (!isFinite(bruto)) bruto = min;
      }
      bruto = Math.max(min, Math.min(max, bruto + dv));
      var v = parseFloat((Math.round(bruto / passo) * passo).toFixed(casas));
      if (String(v) === String(range.value)) return;
      range.value = v;
      ultimo = v;
      range.dispatchEvent(new Event('input', { bubbles: true }));
      mostrar();
    }
    /* o curso: 240px de arrasto varrem a faixa inteira */
    gesto(d, faixa / 240, mexer);
    /* mexer no deslizador move o knob junto — os dois são o mesmo controle */
    range.addEventListener('input', mostrar);
    knobs.push(mostrar);
    mostrar();
    return d;
  }

  /* ---- a MANIVELA: escanear com a mão, linha a linha ----------------- */
  /* O único knob que não espelha um deslizador, e mesmo assim não inventa
     função: ele chama `VE.mesa.linha`, a mesma primitiva que o motor usa a
     cada quadro. Girar para a direita anda com o cabeçote e GRAVA o que
     estiver embaixo dele — é o scan feito no ritmo da mão, que é
     exatamente o que esta mesa serve para fazer.

     Para a esquerda não faz nada, e isso é honesto: o filme é uma
     GRAVAÇÃO, não um parâmetro. Não há como desgravar uma linha — quem
     quiser voltar tem FOLHA NOVA e VOLTAR O CABEÇOTE ao lado.        */
  function knobManivela() {
    var d = fazerKnob('MANIVELA', 'jog',
      'Gire para a direita: o cabeçote anda e grava, uma linha por vez. ' +
      'Para a esquerda não volta — o filme é gravação, não parâmetro.');
    var cap = d.querySelector('.l2sc-knob-cap');
    var ang = 0, resto = 0;

    function andar(dv) {
      var e = VE.mesa && VE.mesa.est;
      if (!e) return;
      ang += dv * 3.2;
      cap.style.setProperty('--g', ang.toFixed(1) + 'deg');
      if (!e.fonte) return;
      resto += dv;
      var n = Math.trunc(resto);
      if (!n) return;
      resto -= n;
      if (n > 0) {
        var fim = VE.mesa.comprimento();
        for (var i = 0; i < n && e.pos < fim; i++) {
          VE.mesa.linha(Math.floor(e.pos));
          e.pos += 1;
        }
        if (e.pos > fim) e.pos = fim;
      }
      if (VE.mesaui && VE.mesaui.pintar) VE.mesaui.pintar();
    }
    gesto(d, 0.32, andar);
    d.classList.add('l2sc-aceso');
    return d;
  }

  /* ------------------------------------------------- A MONTAGEM ------- */
  function aparelhar() {
    var m = document.getElementById('mesaModal');
    if (!m || m.dataset.l2sc) return;

    var card = m.querySelector('.mesa-card');
    var cabeca = m.querySelector('.modal-h');
    var corpo = m.querySelector('.mesa-b');
    var topo = m.querySelector('.mesa-topo');
    var ctrl = m.querySelector('.mesa-ctrl');
    if (!card || !cabeca || !corpo || !topo || !ctrl) return;

    m.dataset.l2sc = '1';
    m.classList.add('l2sc');

    /* ---- 1. o bisel de cima: marca, dica, leitura, LED e a tecla de sair */
    var marca = cria('l2sc-marca',
      '<span class="l2sc-nome"><b>RGB</b>LAB</span>' +
      '<span class="l2sc-sub">SCANNER STATION</span>');
    cabeca.insertBefore(marca, cabeca.firstChild);

    var dica = cria('l2sc-dica');
    dica.textContent = 'ARRASTE PARA MOVER · RODA AMPLIA · R REENQUADRA';
    var leitura = cria('l2sc-leitura');
    leitura.textContent = '—';

    var sair = document.getElementById('mesaFechar');
    var dot = document.getElementById('mesaDot');
    cabeca.insertBefore(dica, sair);
    cabeca.insertBefore(leitura, sair);
    if (dot) cabeca.insertBefore(dot, sair);      /* o LED de gravação, ao lado da leitura */

    /* A leitura do alto ESPELHA a da caixa do filme em vez de recalcular:
       duas contas para o mesmo número dão dois números diferentes no dia em
       que uma delas mudar.                                            */
    var prog = document.getElementById('mesaProg');
    if (prog) {
      var copiar = function () { leitura.textContent = prog.textContent; };
      copiar();
      new MutationObserver(copiar).observe(prog, {
        childList: true, characterData: true, subtree: true
      });
    }

    /* ---- 2. as duas peças: tampa e base -------------------------------
       Nasceu com mais duas — uma dobradiça de três cilindros entre elas e um
       pé com as inscrições técnicas e o LED. As duas saíram a pedido, e o
       argumento é bom: somadas custavam ~50px de altura para dizer o que a
       ARESTA da tampa e a sombra de contato já dizem sozinhas. Numa
       ferramenta em que se olha a imagem, 50px de enfeite são 50px que a
       tela não tem.                                                     */
    var tampa = cria('l2sc-tampa');
    var base = cria('l2sc-base');

    tampa.appendChild(cabeca);
    tampa.appendChild(topo);
    base.appendChild(ctrl);
    corpo.appendChild(tampa);
    corpo.appendChild(base);

    /* ---- 3. os knobs, cada um no seu posto ---------------------------- */
    var cols = ctrl.querySelectorAll('.mesa-col');
    var rVel = m.querySelector('[data-mesarange="vel"]');
    var rRui = m.querySelector('[data-mesarange="ruido"]');
    var rOnd = m.querySelector('[data-mesarange="onda"]');

    /* 2. AVANÇO — a velocidade é o controle principal da coluna */
    if (cols[1] && rVel) {
      var caixaVel = cria('l2sc-posto');
      caixaVel.appendChild(knobDoRange('VELOCIDADE', 'g', rVel,
        'Linhas por quadro — o mesmo controle do deslizador acima'));
      cols[1].appendChild(caixaVel);
    }

    /* 3. COR, GRÃO E ONDA — os dois knobs vão para um trilho à direita, e
       para isso o miolo da coluna (tudo menos o título) entra num bloco */
    if (cols[2] && rRui && rOnd) {
      var col = cols[2];
      col.classList.add('l2sc-col-dupla');
      var sub = col.querySelector('.subhead');
      var miolo = cria('l2sc-colcorpo');
      var n = sub ? sub.nextSibling : col.firstChild;
      while (n) { var prox = n.nextSibling; miolo.appendChild(n); n = prox; }
      col.appendChild(miolo);
      var trilho = cria('l2sc-trilho');
      trilho.appendChild(knobDoRange('GRÃO', 'p', rRui, 'Grão do filme'));
      trilho.appendChild(knobDoRange('ONDA DO CABEÇOTE', 'p', rOnd,
        'Quanto o cabeçote serpenteia enquanto anda'));
      col.appendChild(trilho);
    }

    /* 4. CABEÇOTE — a manivela fecha a coluna que comanda o scan */
    if (cols[3]) {
      var caixaJog = cria('l2sc-posto');
      caixaJog.appendChild(knobManivela());
      cols[3].appendChild(caixaJog);
    }

  }

  /* Reabrir a janela pode ter trocado os valores (fonte nova zera os
     parâmetros). Os knobs voltam a bater com os deslizadores.        */
  function sincronizarKnobs() {
    knobs.forEach(function (f) { try { f(); } catch (e) { } });
  }

  function engatarScanner() {
    if (!VE.mesaui || !VE.mesaui.abrir) { setTimeout(engatarScanner, 120); return; }
    var orig = VE.mesaui.abrir;
    VE.mesaui.abrir = function () {
      var r = orig.apply(this, arguments);
      try { aparelhar(); } catch (e) { }
      sincronizarKnobs();
      return r;
    };
  }
  engatarScanner();
})(window.VE);
