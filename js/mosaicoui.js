/* ============================================================
   rgb_lab — A JANELA DO MOSAICO
   ------------------------------------------------------------
   A interface da grade que `mosaico.js` monta. Mesma divisão de
   mesa/mesaui, tinta/tintaui e recorte/recorteui: o motor não sabe
   que existe tela, a tela não desenha geometria nenhuma.

   A janela é um MAPA da grade, em tamanho de miniatura e com a
   proporção da composição. Cada quadrado do mapa é o quadrado que
   vai sair — mexer na borda ou no formato reorganiza o mapa na
   hora, antes de qualquer clipe existir.

   O gesto de encher a grade é o de uma paleta: escolhe-se a fonte
   à direita e pinta-se nos quadrados, arrastando. Foi por aí em vez
   de um menu por célula porque um mosaico de trinta quadros com
   menu é trinta menus; com pincel, é um arrasto.
   ============================================================ */
(function (VE) {
  'use strict';

  var U = VE.mosaicoui = {};
  var cfg = null;
  var celulas = [];        /* id da fonte por quadro, na ordem da grade */
  var pincel = null;       /* a fonte escolhida na paleta; null = borracha */
  var pintando = 0;

  function el(id) { return document.getElementById(id); }

  function nQuadros() { return Math.max(1, Math.round(cfg.cols)) * Math.max(1, Math.round(cfg.linhas)); }

  /* A grade mudou de tamanho: o que já estava pintado tem de continuar no
     MESMO quadrado, não escorregar. Por isso a remontagem é por coluna e
     linha, e não por índice — um vetor reindexado embaralharia o desenho
     inteiro toda vez que se acrescentasse uma coluna.                  */
  function redimensionar(cAntes, lAntes) {
    var C = Math.max(1, Math.round(cfg.cols)), L = Math.max(1, Math.round(cfg.linhas));
    var novo = new Array(C * L);
    for (var j = 0; j < L; j++) {
      for (var i = 0; i < C; i++) {
        novo[j * C + i] = (i < cAntes && j < lAntes) ? celulas[j * cAntes + i] : null;
      }
    }
    celulas = novo;
  }

  U.abrir = function () {
    if (!VE.project) {
      VE.app.toast('carregue uma fonte primeiro — o mosaico monta dentro de uma composição', 'err');
      return;
    }
    if (!cfg) {
      cfg = VE.mosaico.novaCfg();
      celulas = new Array(nQuadros()).fill(null);
      /* a grade nasce cheia com a fonte do clipe escolhido, se houver uma:
         o caso mais comum é um vídeo só repetido, e ninguém quer pintar
         doze quadrados na mão para descobrir se gostou do formato      */
      var sel = VE.selected && VE.selected();
      var inicial = (sel && sel.src) ? sel.src : Object.keys(VE.sources)[0];
      if (inicial) { celulas = celulas.map(function () { return inicial; }); pincel = inicial; }
    }
    montar();
    el('mosModal').classList.remove('hidden');
    pintar();
  };

  U.fechar = function () {
    var m = el('mosModal');
    if (m) m.classList.add('hidden');
  };

  /* ------------------------------------------------------------------ */
  function linhaNum(k, rot, min, max, passo, un) {
    return '<div class="prow"><label>' + rot + '</label>' +
      '<input class="field num" data-mosnum="' + k + '" value="0">' +
      '<span class="micro">' + un + '</span></div>' +
      '<div class="prow-slider"><input type="range" data-mosrange="' + k + '" min="' + min +
      '" max="' + max + '" step="' + passo + '" value="0"></div>';
  }

  function montar() {
    if (el('mosModal')) return;
    var d = document.createElement('div');
    d.className = 'modal hidden';
    d.id = 'mosModal';
    d.innerHTML =
      '<div class="modal-card mos-card">' +
      '<div class="modal-h"><span class="dot"></span><h3>MOSAICO DE VÍDEOS</h3>' +
      '<button class="cmd cmd-sm" id="mosFechar">FECHAR</button></div>' +

      '<div class="modal-b mos-b">' +

      '<section class="mos-cx">' +
      '<div class="mos-cxh"><span class="lbl lbl-ink">A. A GRADE</span>' +
      '<span class="micro" id="mosInfo">—</span></div>' +
      '<div class="mos-mapa" id="mosMapa"></div>' +
      '<div class="mos-cxf">' +
      '<button class="cmd cmd-sm" id="mosTudo">PREENCHER TUDO</button>' +
      '<button class="cmd cmd-sm" id="mosAlternar">ALTERNAR</button>' +
      '<button class="cmd cmd-sm" id="mosSorteio">SORTEAR VAZIOS</button>' +
      '<button class="cmd cmd-sm cmd-danger" id="mosLimpar">ESVAZIAR</button>' +
      '</div>' +
      '</section>' +

      '<div class="mos-ctrl">' +

      '<div class="mos-col">' +
      '<div class="subhead">1. QUANTOS QUADRADOS</div>' +
      linhaNum('cols', 'Colunas', 1, 16, 1, '') +
      linhaNum('linhas', 'Linhas', 1, 16, 1, '') +
      '<div class="pnote" id="mosAviso"></div>' +
      '</div>' +

      '<div class="mos-col">' +
      '<div class="subhead">2. FORMATO DO QUADRADO</div>' +
      '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-mosfmt="0">PREENCHER A TELA</button>' +
      '<button class="cmd cmd-sm" data-mosfmt="1">QUADRADO</button>' +
      '<button class="cmd cmd-sm" data-mosfmt="2">LIVRE</button>' +
      '</div>' +
      '<div id="mosLinhaProp">' +
      linhaNum('prop', 'Proporção (largura ÷ altura)', 0.15, 6, 0.01, '') +
      '<div class="pnote">Abaixo de 1 o quadro fica em pé e fino; acima, deitado.</div>' +
      '</div>' +
      '</div>' +

      '<div class="mos-col">' +
      '<div class="subhead">3. BORDA ENTRE OS QUADRADOS</div>' +
      linhaNum('borda', 'Espessura (% da largura)', 0, 12, 0.1, '%') +
      '<div class="prow"><label>Moldura em volta da grade</label>' +
      '<input type="checkbox" id="mosFora" checked><span></span></div>' +
      '<div class="pnote">A borda não é pintada: é VÃO. O que aparecer nela é a camada de baixo — ou o fundo da composição.</div>' +
      '</div>' +

      '<div class="mos-col">' +
      '<div class="subhead">4. O VÍDEO DENTRO DO QUADRO</div>' +
      '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-mosaj="0">PREENCHER (CORTA)</button>' +
      '<button class="cmd cmd-sm" data-mosaj="1">CABER INTEIRO</button>' +
      '<button class="cmd cmd-sm" data-mosaj="2">ESTICAR</button>' +
      '</div>' +
      linhaNum('defasagem', 'Defasagem entre quadros', 0, 10, 0.05, 's') +
      '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-mosord="0">LEITURA</button>' +
      '<button class="cmd cmd-sm" data-mosord="1">COLUNAS</button>' +
      '<button class="cmd cmd-sm" data-mosord="2">SORTEADA</button>' +
      '</div>' +
      '<div class="pnote">Com defasagem, cada quadro mostra o mesmo vídeo num momento diferente.</div>' +
      '</div>' +

      '<div class="mos-col mos-paleta">' +
      '<div class="subhead">5. QUAL VÍDEO EM QUAL QUADRO</div>' +
      '<div class="pnote">Escolha uma fonte e pinte nos quadrados. A borracha esvazia.</div>' +
      '<div class="mos-fontes" id="mosFontes"></div>' +
      '</div>' +

      '</div></div>' +

      '<div class="modal-f">' +
      '<span class="micro" id="mosResumo">—</span>' +
      '<span class="spacer"></span>' +
      '<button class="cmd cmd-sm" id="mosAplicar">REORGANIZAR O QUE JÁ EXISTE</button>' +
      '<button class="cmd cmd-solid" id="mosMontar">MONTAR NA COMPOSIÇÃO</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(d);
    ligar();
  }

  /* ================================================== O MAPA DA GRADE ==
     Desenhado com a proporção da composição, para que um quadro "quadrado"
     no mapa seja quadrado no vídeo. Um mapa em proporção livre mentiria
     justamente no controle que existe para escolher a proporção.       */
  function pintarMapa() {
    var mapa = el('mosMapa');
    var cels = VE.mosaico.grade(cfg);
    var asp = VE.mosaico.aspecto();
    var larg = mapa.clientWidth || 420;
    var alt = Math.max(80, Math.round(larg / asp));
    mapa.style.height = alt + 'px';
    var h = '';
    cels.forEach(function (c, k) {
      var id = celulas[k];
      var s = id ? VE.sources[id] : null;
      var nome = s ? (s.name || '').replace(/\.[a-z0-9]+$/i, '').slice(0, 10) : '';
      h += '<button class="mos-q' + (s ? ' cheio' : '') + '" data-mosq="' + k + '"' +
        ' style="left:' + ((c.cx - c.w / 2) * 100).toFixed(3) + '%;' +
        'top:' + ((c.cy - c.h / 2) * 100).toFixed(3) + '%;' +
        'width:' + (c.w * 100).toFixed(3) + '%;' +
        'height:' + (c.h * 100).toFixed(3) + '%;' +
        (s ? 'background:' + corDe(id) + ';' : '') + '"' +
        ' title="' + (c.lin + 1) + '×' + (c.col + 1) + (s ? ' · ' + (s.name || '') : ' · vazio') + '">' +
        '<i>' + nome + '</i></button>';
    });
    mapa.innerHTML = h;
  }

  /* cada fonte ganha uma cor estável, tirada do próprio id: no mapa, o que
     importa é ver ONDE cada vídeo está, não ler o nome dele            */
  function corDe(id) {
    var n = 0;
    for (var i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) % 360;
    return 'hsl(' + n + ',52%,46%)';
  }

  function pintarPaleta() {
    var box = el('mosFontes');
    var ks = Object.keys(VE.sources).filter(function (k) {
      var s = VE.sources[k];
      return s.kind === 'video' || s.kind === 'image' || s.kind === 'type' || s.kind === 'webcam';
    });
    var h = '<button class="mos-f' + (pincel === null ? ' on' : '') + '" data-mosf="">' +
      '<i style="background:repeating-linear-gradient(45deg,var(--rule) 0 4px,transparent 4px 8px)"></i>' +
      '<span>BORRACHA</span></button>';
    ks.forEach(function (k) {
      var s = VE.sources[k];
      var usadas = celulas.filter(function (x) { return x === k; }).length;
      h += '<button class="mos-f' + (pincel === k ? ' on' : '') + '" data-mosf="' + k + '">' +
        '<i style="background:' + corDe(k) + '"></i>' +
        '<span>' + (s.name || 'FONTE') + '</span>' +
        '<b>' + (usadas || '') + '</b></button>';
    });
    if (!ks.length) h += '<div class="pnote">Nenhuma fonte carregada ainda.</div>';
    box.innerHTML = h;
  }

  function pintar() {
    if (!el('mosModal')) return;
    /* números e sliders */
    ['cols', 'linhas', 'prop', 'borda', 'defasagem'].forEach(function (k) {
      var v = k === 'borda' ? cfg.borda * 100 : cfg[k];
      var n = document.querySelector('[data-mosnum="' + k + '"]');
      var r = document.querySelector('[data-mosrange="' + k + '"]');
      if (n && document.activeElement !== n) n.value = (k === 'cols' || k === 'linhas') ? v : (+v).toFixed(2);
      if (r) r.value = v;
    });
    el('mosFora').checked = !!cfg.bordaFora;
    document.querySelectorAll('[data-mosfmt]').forEach(function (b) {
      b.classList.toggle('on', +b.dataset.mosfmt === cfg.formato);
    });
    document.querySelectorAll('[data-mosaj]').forEach(function (b) {
      b.classList.toggle('on', +b.dataset.mosaj === cfg.ajuste);
    });
    document.querySelectorAll('[data-mosord]').forEach(function (b) {
      b.classList.toggle('on', +b.dataset.mosord === cfg.ordemDefasagem);
    });
    el('mosLinhaProp').style.display = cfg.formato === 2 ? '' : 'none';

    var cels = VE.mosaico.grade(cfg);
    var p = VE.project.canvas;
    var px = Math.round(cels[0].w * p.w) + '×' + Math.round(cels[0].h * p.h) + ' px';
    el('mosInfo').textContent = cfg.cols + ' × ' + cfg.linhas + ' · quadro de ' + px;

    var cheios = celulas.filter(Boolean).length;
    el('mosResumo').textContent = cheios + ' de ' + nQuadros() + ' quadros com vídeo';

    /* Dois avisos, e os dois nascem de medida, não de palpite. O primeiro:
       nos formatos de proporção fixa a grade pode ser mais alta que a tela
       — dizer isso é melhor que deixar a pessoa descobrir com o mosaico
       montado e as pontas cortadas. O segundo: cada quadro cheio é um
       decodificador de vídeo, e por volta de duas dúzias a prévia engasga. */
    var passou = cels.some(function (c) { return c.cy - c.h / 2 < -0.002 || c.cy + c.h / 2 > 1.002; });
    var avisos = [];
    if (passou) avisos.push('A grade é mais alta que a tela neste formato: as linhas de cima e de baixo vão sair cortadas. Diminua as linhas, a proporção ou a borda.');
    if (cheios > 24) avisos.push(cheios + ' quadros são ' + cheios + ' vídeos tocando ao mesmo tempo — a prévia engasga daqui para cima. Exportar continua exato.');
    el('mosAviso').textContent = avisos.join(' ');
    pintarMapa();
    pintarPaleta();
  }

  /* ------------------------------------------------------------------ */
  function ligar() {
    el('mosFechar').addEventListener('click', U.fechar);
    el('mosModal').addEventListener('pointerdown', function (ev) {
      if (ev.target === el('mosModal')) U.fechar();
    });

    function mudar(k, v) {
      if (k === 'cols' || k === 'linhas') {
        var cA = Math.max(1, Math.round(cfg.cols)), lA = Math.max(1, Math.round(cfg.linhas));
        cfg[k] = Math.max(1, Math.min(16, Math.round(v)));
        redimensionar(cA, lA);
      } else if (k === 'borda') {
        cfg.borda = Math.max(0, Math.min(0.12, v / 100));
      } else {
        cfg[k] = v;
      }
      pintar();
    }
    el('mosModal').addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.mosrange) mudar(t.dataset.mosrange, +t.value);
      else if (t.dataset.mosnum) mudar(t.dataset.mosnum, +t.value);
    });

    el('mosModal').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mosfmt],[data-mosaj],[data-mosord],[data-mosf]');
      if (!b) return;
      if (b.dataset.mosfmt !== undefined) cfg.formato = +b.dataset.mosfmt;
      else if (b.dataset.mosaj !== undefined) cfg.ajuste = +b.dataset.mosaj;
      else if (b.dataset.mosord !== undefined) cfg.ordemDefasagem = +b.dataset.mosord;
      else pincel = b.dataset.mosf || null;
      pintar();
    });

    el('mosFora').addEventListener('change', function () {
      cfg.bordaFora = el('mosFora').checked; pintar();
    });

    /* ---- pintar os quadros arrastando ---- */
    var mapa = el('mosMapa');
    mapa.addEventListener('pointerdown', function (e) {
      var q = e.target.closest('[data-mosq]');
      if (!q) return;
      e.preventDefault();
      pintando = 1;
      try { mapa.setPointerCapture(e.pointerId); } catch (x) { }
      aplicarPincel(+q.dataset.mosq);
    });
    mapa.addEventListener('pointermove', function (e) {
      if (!pintando) return;
      var alvo = document.elementFromPoint(e.clientX, e.clientY);
      var q = alvo && alvo.closest ? alvo.closest('[data-mosq]') : null;
      if (q) aplicarPincel(+q.dataset.mosq);
    });
    mapa.addEventListener('pointerup', function () { pintando = 0; });
    mapa.addEventListener('pointercancel', function () { pintando = 0; });

    /* PINTAR UM QUADRO SÓ.
       A primeira versão chamava `pintar()`, que remonta o mapa inteiro e a
       paleta. Num arrasto por uma grade de 11×8 isso é oitenta e oito
       remontagens de oitenta e oito botões — medido: a página parou por
       mais de trinta segundos. Aqui só o quadro tocado muda de dono, e a
       contagem (que é o único número que depende de todos) fica para o
       quadro seguinte do navegador.                                     */
    var contaPendente = 0;
    function aplicarPincel(k) {
      if (celulas[k] === pincel) return;
      celulas[k] = pincel;
      var q = document.querySelector('[data-mosq="' + k + '"]');
      if (q) {
        var s = pincel ? VE.sources[pincel] : null;
        q.classList.toggle('cheio', !!s);
        q.style.background = s ? corDe(pincel) : '';
        q.querySelector('i').textContent = s ? (s.name || '').replace(/\.[a-z0-9]+$/i, '').slice(0, 10) : '';
      }
      if (!contaPendente) {
        contaPendente = requestAnimationFrame(function () {
          contaPendente = 0;
          var cheios = celulas.filter(Boolean).length;
          el('mosResumo').textContent = cheios + ' de ' + nQuadros() + ' quadros com vídeo';
          pintarPaleta();
        });
      }
    }

    el('mosTudo').addEventListener('click', function () {
      celulas = celulas.map(function () { return pincel; }); pintar();
    });
    el('mosLimpar').addEventListener('click', function () {
      celulas = celulas.map(function () { return null; }); pintar();
    });
    el('mosAlternar').addEventListener('click', function () {
      /* xadrez com a fonte do pincel: o jeito mais rápido de chegar ao
         desenho das referências, em que metade dos quadros é vazia    */
      var C = Math.max(1, Math.round(cfg.cols));
      celulas = celulas.map(function (v, k) {
        var lin = Math.floor(k / C), col = k % C;
        return ((lin + col) % 2) ? null : pincel;
      });
      pintar();
    });
    el('mosSorteio').addEventListener('click', function () {
      celulas = celulas.map(function (v) { return Math.random() < 0.62 ? pincel : null; });
      pintar();
    });

    el('mosMontar').addEventListener('click', function () {
      var feitos = VE.mosaico.montar(cfg, celulas, { mudo: true });
      if (!feitos.length) { VE.app.toast('nenhum quadro tem vídeo — pinte pelo menos um', 'err'); return; }
      VE.select(feitos.map(function (c) { return c.id; }));
      VE.pushHistory(); VE.emit('project');
      U.fechar();
      VE.shell.go('video');
      if (VE.view && VE.view.fit) VE.view.fit();
      VE.app.toast(feitos.length + ' quadros montados — cada um é um clipe, com corte e efeito próprios', 'ok');
    });

    el('mosAplicar').addEventListener('click', function () {
      var sobrando = VE.mosaico.reorganizar(cfg);
      VE.pushHistory(); VE.emit('project');
      VE.app.toast(sobrando.length
        ? 'grade reorganizada — ' + sobrando.length + ' quadro(s) ficaram fora dela e continuam na linha do tempo'
        : 'grade reorganizada', sobrando.length ? 'err' : 'ok');
    });
  }

})(window.VE);
