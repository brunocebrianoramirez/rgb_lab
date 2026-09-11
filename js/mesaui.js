/* ============================================================
   rgb_lab — A JANELA DA MESA DE DIGITALIZAÇÃO
   ------------------------------------------------------------
   A interface da gravação que `mesa.js` executa. Mesma divisão de
   comp/compui, tinta/tintaui e recorte/recorteui: o motor não sabe
   que existe tela, a tela não sabe desenhar linha nenhuma.

   O desenho segue a referência (bancada à esquerda, filme à
   direita, controles embaixo) mas com o vocabulário daqui: papel,
   traço de 1 px, monoespaçada em caixa alta, sombra dura. Nada de
   cartão arredondado — a janela é irmã de EXPORTAR COMPOSIÇÃO.

   A bancada é uma PRÉVIA VIVA da fonte, não o filme. É nela que se
   arrasta, amplia e gira — e é isso que distorce o resultado
   enquanto o cabeçote anda.
   ============================================================ */
(function (VE) {
  'use strict';

  var U = VE.mesaui = {};
  var laco = null;          /* o laço de animação da sessão */
  var arrasto = null;

  function $(s) { return document.querySelector(s); }
  function el(id) { return document.getElementById(id); }

  /* ------------------------------------------------------------------
     DE ONDE VEM A FONTE
     Primeiro o clipe escolhido na linha do tempo — é o caminho que o
     laboratório já tem e evita pedir o arquivo de novo. Só se não
     houver nada escolhido é que a janela pede um arquivo.           */
  U.fonteDoClipe = function () {
    if (!VE.project) return null;
    var c = VE.selected && VE.selected();
    if (!c || !c.src) return null;
    var s = VE.sources ? VE.sources[c.src] : null;
    if (!s) return null;
    var elFonte = s.el || (VE.media.elFor ? VE.media.elFor(c.src) : null);
    if (!elFonte) return null;
    return { el: elFonte, nome: s.name || 'CLIPE', w: s.w, h: s.h, kind: s.kind };
  };

  /* Reabrir a mesa PRESERVA a sessão — quem escaneou meia folha não
     perde o que gravou. Mas guardar cegamente trazia de volta uma
     sessão INÚTIL: abrir a janela com o laboratório vazio criava uma
     mesa sem fonte e com filme de folha (900×1200); depois, já com um
     clipe escolhido e uma composição aberta, ela reaparecia sem fonte
     e com o tamanho errado. Só vale guardar o que já tem trabalho
     dentro — e trabalho aqui é linha gravada.                       */
  function serveAinda(f) {
    var e = VE.mesa.est;
    if (!e) return false;
    if (e.pos > 0) return true;              /* já gravou: ninguém mexe */
    if (!e.fonte && f) return false;         /* estava vazia e agora há fonte */
    var p = VE.project && VE.project.canvas;
    if (p && p.w && (e.filme.width !== p.w || e.filme.height !== p.h)) return false;
    return true;
  }

  U.abrir = function () {
    var f = U.fonteDoClipe();
    if (!serveAinda(f)) {
      if (f) VE.mesa.abrir(f.el, f.nome, f.w, f.h);
      else VE.mesa.abrir(null, 'SEM FONTE', 0, 0);
    }
    montar();
    var m = el('mesaModal');
    if (m) m.classList.remove('hidden');
    pintar();
    ligarLaco();
  };

  U.fechar = function () {
    var m = el('mesaModal');
    if (m) m.classList.add('hidden');
    pararLaco();
    if (VE.mesa.est) VE.mesa.est.rodando = false;
  };

  /* ------------------------------------------------------------------ */
  function montar() {
    if (el('mesaModal')) return;
    var d = document.createElement('div');
    d.className = 'modal hidden';
    d.id = 'mesaModal';
    d.innerHTML =
      '<div class="modal-card mesa-card">' +
      '<div class="modal-h"><span class="dot" id="mesaDot"></span><h3>MESA DE DIGITALIZAÇÃO</h3>' +
      '<button class="cmd cmd-sm" id="mesaFechar">FECHAR</button></div>' +
      '<div class="modal-b mesa-b">' +

      '<div class="mesa-topo">' +
      '<section class="mesa-cx">' +
      '<div class="mesa-cxh"><span class="lbl lbl-ink">A. BANCADA</span>' +
      '<span class="micro">ARRASTE PARA MOVER · RODA AMPLIA · R REENQUADRA</span></div>' +
      '<div class="mesa-tela"><canvas id="mesaBancada"></canvas></div>' +
      '<div class="mesa-cxf"><button class="cmd cmd-sm" id="mesaGirar">GIRAR 90°</button>' +
      '<button class="cmd cmd-sm" id="mesaEnquadrar">REENQUADRAR (R)</button>' +
      '<button class="cmd cmd-sm" id="mesaTrocar">TROCAR A FONTE…</button></div>' +
      '</section>' +

      '<section class="mesa-cx">' +
      '<div class="mesa-cxh"><span class="lbl lbl-ink">B. FILME</span>' +
      '<span class="micro" id="mesaProg">—</span></div>' +
      '<div class="mesa-tela"><canvas id="mesaFilme"></canvas></div>' +
      '<div class="mesa-cxf"><button class="cmd cmd-sm cmd-danger" id="mesaLimpar">FOLHA NOVA</button>' +
      '<button class="cmd cmd-sm" id="mesaPng">BAIXAR PNG</button>' +
      '<button class="cmd cmd-sm cmd-solid" id="mesaUsar">USAR NA COMPOSIÇÃO</button></div>' +
      '</section>' +
      '</div>' +

      '<div class="mesa-ctrl">' +
      '<div class="mesa-col">' +
      '<div class="subhead">1. FONTE</div>' +
      '<div class="pnote" id="mesaFonteNome">—</div>' +
      '<div class="pbtns"><button class="cmd cmd-sm" id="mesaDoClipe">USAR O CLIPE ESCOLHIDO</button></div>' +
      '<div class="pnote" id="mesaDicaVideo"></div>' +
      '</div>' +

      '<div class="mesa-col">' +
      '<div class="subhead">2. AVANÇO E DIREÇÃO</div>' +
      linhaNum('vel', 'Velocidade', 0.5, 8, 0.1, 1, 'px/quadro') +
      '<div class="pbtns"><button class="cmd cmd-sm" data-dir="Y">VERTICAL (Y)</button>' +
      '<button class="cmd cmd-sm" data-dir="X">HORIZONTAL (X)</button></div>' +
      '</div>' +

      '<div class="mesa-col">' +
      '<div class="subhead">3. COR, GRÃO E ONDA</div>' +
      '<div class="pbtns"><button class="cmd cmd-sm" data-cor="1">COR</button>' +
      '<button class="cmd cmd-sm" data-cor="0">PRETO E BRANCO</button></div>' +
      '<div class="pbtns"><button class="cmd cmd-sm" data-fundo="0">COR SÓLIDA</button>' +
      '<button class="cmd cmd-sm" data-fundo="1">TRANSPARENTE</button></div>' +
      '<div class="prow" id="mesaLinhaCor"><label>Cor do fundo</label>' +
      '<input type="color" id="mesaFundo" value="#ffffff"></div>' +
      '<div class="pnote" id="mesaNotaFundo"></div>' +
      linhaNum('ruido', 'Grão', 0, 100, 1, 40, '%') +
      linhaNum('onda', 'Onda do cabeçote', 0, 100, 1, 0, 'px') +
      '<div class="prow"><label>Queimar a ficha no canto</label>' +
      '<input type="checkbox" id="mesaInfo" checked><span></span></div>' +
      '</div>' +

      '<div class="mesa-col">' +
      '<div class="subhead">4. CABEÇOTE</div>' +
      '<div class="pbtns"><button class="cmd cmd-solid mesa-grande" id="mesaTocar">INICIAR O SCAN</button></div>' +
      '<div class="pbtns"><button class="cmd cmd-sm" id="mesaZerar">VOLTAR O CABEÇOTE</button></div>' +
      '<div class="pnote">o cabeçote anda uma linha por vez e guarda o que estava embaixo dele. ' +
      'mexa na bancada <b>durante</b> o scan — é daí que vem a distorção.</div>' +
      '</div>' +
      '</div>' +

      '</div></div>';
    document.body.appendChild(d);
    ligar();
  }

  function linhaNum(k, rot, min, max, passo, def, un) {
    return '<div class="prow"><label>' + rot + '</label>' +
      '<input class="field num" data-mesanum="' + k + '" value="' + def + '">' +
      '<span class="micro">' + un + '</span></div>' +
      '<div class="prow-slider"><input type="range" data-mesarange="' + k + '" min="' + min +
      '" max="' + max + '" step="' + passo + '" value="' + def + '"></div>';
  }

  /* ------------------------------------------------------------------ */
  function ligar() {
    el('mesaFechar').addEventListener('click', U.fechar);
    el('mesaModal').addEventListener('pointerdown', function (ev) {
      if (ev.target === el('mesaModal')) U.fechar();
    });

    el('mesaTocar').addEventListener('click', function () {
      var e = VE.mesa.est; if (!e) return;
      if (!e.fonte) { VE.app.toast('escolha uma fonte primeiro', 'err'); return; }
      if (VE.mesa.terminou()) VE.mesa.limparFilme();
      e.rodando = !e.rodando;
      /* vídeo: tocar é o que faz cada linha ser um quadro diferente */
      if (e.fonte.play) { if (e.rodando) { try { e.fonte.play(); } catch (x) { } } else e.fonte.pause(); }
      pintar();
    });
    el('mesaZerar').addEventListener('click', function () { VE.mesa.reiniciar(); pintar(); });
    el('mesaLimpar').addEventListener('click', function () { VE.mesa.limparFilme(); pintar(); });
    el('mesaEnquadrar').addEventListener('click', function () { VE.mesa.enquadrar(); pintar(); });
    el('mesaGirar').addEventListener('click', function () {
      var e = VE.mesa.est; if (!e) return;
      e.t.giro = (e.t.giro + 90) % 360; pintar();
    });
    el('mesaPng').addEventListener('click', function () { VE.mesa.baixar(); });
    /* USAR NA COMPOSIÇÃO = virar CAMADA na linha do tempo.
       Antes isto só registrava a fonte e avisava que "entrou nas
       fontes" — o filme existia, mas em lugar nenhum que se veja, e
       quem apertou ficou olhando uma linha do tempo vazia. O caminho
       certo é o mesmo do FRAME da câmera (app.js/grabCam): registrar a
       fonte E acrescentar a mídia.                                  */
    el('mesaUsar').addEventListener('click', function () {
      var e = VE.mesa.est;
      if (!e || e.pos <= 0) { VE.app.toast('escaneie alguma coisa primeiro', 'err'); return; }
      var id = VE.mesa.paraFonte();
      if (!id) { VE.app.toast('não consegui montar o filme', 'err'); return; }
      var s = VE.sources[id];
      var primeiro = !VE.project;
      VE.app.ensureProject(s.w, s.h, 10);
      if (primeiro) VE.setCanvas(s.w, s.h, 'src');
      VE.addMedia({
        kind: 'image', name: s.name, src: id,
        dur: VE.duration(), fit: 'contain'
      });
      VE.pushHistory(); VE.emit('project'); VE.emit('sources');
      U.fechar();
      VE.shell.go('video');
      if (VE.view && VE.view.fit) VE.view.fit();
      VE.app.toast('o filme virou camada na linha do tempo' +
        (e.par.transp ? ' — com fundo transparente' : ''), 'ok');
    });
    el('mesaDoClipe').addEventListener('click', function () {
      var f = U.fonteDoClipe();
      if (!f) { VE.app.toast('escolha um clipe na linha do tempo primeiro', 'err'); return; }
      trocarFonte(f.el, f.nome, f.w, f.h);
    });
    el('mesaTrocar').addEventListener('click', pedirArquivo);

    el('mesaFundo').addEventListener('input', function () { par('fundo', this.value); });
    el('mesaFundo').addEventListener('change', function () { par('fundo', this.value); });
    el('mesaInfo').addEventListener('change', function () { par('info', this.checked ? 1 : 0); });

    el('mesaModal').querySelectorAll('[data-dir]').forEach(function (b) {
      b.addEventListener('click', function () { par('direcao', b.dataset.dir); VE.mesa.reiniciar(); });
    });
    el('mesaModal').querySelectorAll('[data-cor]').forEach(function (b) {
      b.addEventListener('click', function () { par('cor', +b.dataset.cor); });
    });
    el('mesaModal').querySelectorAll('[data-fundo]').forEach(function (b) {
      b.addEventListener('click', function () { par('transp', +b.dataset.fundo); });
    });
    el('mesaModal').querySelectorAll('[data-mesarange]').forEach(function (r) {
      r.addEventListener('input', function () { par(mapa(r.dataset.mesarange), parseFloat(r.value)); });
    });
    el('mesaModal').querySelectorAll('[data-mesanum]').forEach(function (n) {
      n.addEventListener('change', function () {
        var v = parseFloat(n.value); if (isFinite(v)) par(mapa(n.dataset.mesanum), v);
      });
      n.addEventListener('keydown', function (ev) { ev.stopPropagation(); });
    });

    bancada();
    document.addEventListener('keydown', function (ev) {
      var m = el('mesaModal');
      if (!m || m.classList.contains('hidden')) return;
      if (ev.key === 'Escape') { U.fechar(); return; }
      if (ev.key === 'r' || ev.key === 'R') { VE.mesa.enquadrar(); pintar(); }
    });
  }

  function mapa(k) {
    return { vel: 'velocidade', ruido: 'ruido', onda: 'onda' }[k] || k;
  }
  function par(k, v) {
    var e = VE.mesa.est; if (!e) return;
    e.par[k] = v;
    /* trocar a folha só vale enquanto ela está em branco: no meio de um
       scan, refazer o fundo apagaria o que já foi gravado             */
    if ((k === 'fundo' || k === 'transp') && e.pos === 0) VE.mesa.limparFilme();
    pintar();
  }

  function trocarFonte(elFonte, nome, w, h) {
    var e = VE.mesa.est;
    var guardar = e ? JSON.parse(JSON.stringify(e.par)) : null;
    VE.mesa.abrir(elFonte, nome, w, h);
    if (guardar) VE.mesa.est.par = guardar;
    VE.mesa.limparFilme();
    pintar();
  }

  function pedirArquivo() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*,video/*';
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var url = URL.createObjectURL(f);
      if (/^video\//.test(f.type)) {
        var v = document.createElement('video');
        v.src = url; v.loop = true; v.muted = true; v.playsInline = true;
        v.addEventListener('loadeddata', function () {
          trocarFonte(v, f.name, v.videoWidth, v.videoHeight);
        });
      } else {
        var im = new Image();
        im.onload = function () { trocarFonte(im, f.name, im.naturalWidth, im.naturalHeight); };
        im.src = url;
      }
    });
    inp.click();
  }

  /* ---------------------------------------------------- A BANCADA VIVA
     Arrastar aqui move a FONTE, não a vista — e é isso que o cabeçote
     vai gravar. Por isso o arrasto continua valendo com o scan
     rodando: é o gesto que faz a arte.                              */
  function bancada() {
    var cv = el('mesaBancada');
    cv.addEventListener('pointerdown', function (ev) {
      var e = VE.mesa.est; if (!e) return;
      cv.setPointerCapture(ev.pointerId);
      arrasto = { x: ev.clientX, y: ev.clientY, x0: e.t.x, y0: e.t.y };
    });
    cv.addEventListener('pointermove', function (ev) {
      if (!arrasto) return;
      var e = VE.mesa.est; if (!e) return;
      var r = cv.getBoundingClientRect();
      if (!r.width) return;
      var k = e.filme.width / r.width;
      e.t.x = arrasto.x0 + (ev.clientX - arrasto.x) * k;
      e.t.y = arrasto.y0 + (ev.clientY - arrasto.y) * k;
      pintar();
    });
    cv.addEventListener('pointerup', function () { arrasto = null; });
    cv.addEventListener('pointercancel', function () { arrasto = null; });
    cv.addEventListener('wheel', function (ev) {
      var e = VE.mesa.est; if (!e) return;
      ev.preventDefault();
      var r = cv.getBoundingClientRect();
      var k = e.filme.width / Math.max(r.width, 1);
      /* amplia em volta do ponteiro, senão a imagem foge da mão */
      var px = (ev.clientX - r.left) * k, py = (ev.clientY - r.top) * k;
      var f = ev.deltaY < 0 ? 1.08 : 1 / 1.08;
      var novo = Math.max(0.05, Math.min(12, e.t.esc * f));
      var real = novo / e.t.esc;
      e.t.x = px - (px - e.t.x) * real;
      e.t.y = py - (py - e.t.y) * real;
      e.t.esc = novo;
      pintar();
    }, { passive: false });
  }

  /* ------------------------------------------------------------------ */
  function ligarLaco() {
    if (laco) return;
    var tique = function () {
      laco = requestAnimationFrame(tique);
      var e = VE.mesa.est; if (!e) return;
      if (e.rodando) { VE.mesa.passo(); pintar(); }
      else if (e.fonte && e.fonte.videoWidth) pintarBancada();   /* vídeo parado continua vivo */
    };
    laco = requestAnimationFrame(tique);
  }
  function pararLaco() {
    if (laco) cancelAnimationFrame(laco);
    laco = null;
  }

  /* a bancada mostra a fonte como ela está — e onde o cabeçote está */
  function pintarBancada() {
    var e = VE.mesa.est; if (!e) return;
    var cv = el('mesaBancada'); if (!cv) return;
    var W = e.filme.width, H = e.filme.height;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    /* a bancada mostra a MESMA folha que vai ser gravada — inclusive
       quando ela é vazia, e aí quem aparece é o xadrez do CSS por trás */
    c.clearRect(0, 0, W, H);
    if (!e.par.transp) { c.fillStyle = e.par.fundo; c.fillRect(0, 0, W, H); }

    var fw = VE.mesa.larguraFonte(), fh = VE.mesa.alturaFonte();
    if (fw && fh && e.fonte) {
      c.save();
      c.translate(e.t.x, e.t.y);
      if (e.t.giro) {
        c.translate(fw * e.t.esc / 2, fh * e.t.esc / 2);
        c.rotate(e.t.giro * Math.PI / 180);
        c.translate(-fw * e.t.esc / 2, -fh * e.t.esc / 2);
      }
      c.scale(e.t.esc, e.t.esc);
      try { c.drawImage(e.fonte, 0, 0); } catch (x) { }
      c.restore();
    }

    /* o cabeçote: a linha que está sendo lida agora */
    var p = Math.floor(e.pos);
    c.fillStyle = 'rgba(245,208,0,.85)';
    if (e.par.direcao === 'Y') c.fillRect(0, p, W, 2);
    else c.fillRect(p, 0, 2, H);
  }

  function pintarFilme() {
    var e = VE.mesa.est; if (!e) return;
    var cv = el('mesaFilme'); if (!cv) return;
    if (cv.width !== e.filme.width || cv.height !== e.filme.height) {
      cv.width = e.filme.width; cv.height = e.filme.height;
    }
    var c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.drawImage(e.filme, 0, 0);
  }

  function pintar() {
    var e = VE.mesa.est; if (!e) return;
    pintarBancada();
    pintarFilme();

    var b = el('mesaTocar');
    if (b) b.textContent = e.rodando ? 'PAUSAR O SCAN'
      : (VE.mesa.terminou() ? 'ESCANEAR DE NOVO' : (e.pos > 0 ? 'CONTINUAR O SCAN' : 'INICIAR O SCAN'));
    var dot = el('mesaDot');
    if (dot) dot.className = 'dot' + (e.rodando ? ' dot-rec' : '');
    var pr = el('mesaProg');
    if (pr) {
      var tot = VE.mesa.comprimento();
      pr.textContent = Math.round(e.pos) + ' / ' + tot + ' LINHAS · ' +
        Math.round(e.pos / Math.max(tot, 1) * 100) + '%';
    }
    var nm = el('mesaFonteNome');
    if (nm) nm.textContent = e.fonte ? e.nome + ' · ' + VE.mesa.larguraFonte() + '×' + VE.mesa.alturaFonte() : 'nenhuma fonte — use o clipe escolhido ou troque a fonte';
    var dv = el('mesaDicaVideo');
    if (dv) {
      dv.innerHTML = (e.fonte && e.fonte.videoWidth)
        ? '<b>é vídeo:</b> ele TOCA durante o scan, então cada linha do filme é um quadro diferente — quem se mexe vira borrão contínuo, quem fica parado sai nítido'
        : '<b>é foto:</b> a distorção vem da sua mão — arraste, amplie e gire a bancada enquanto o cabeçote anda';
    }
    /* estado dos pares de botão */
    el('mesaModal').querySelectorAll('[data-dir]').forEach(function (x) {
      x.classList.toggle('active', x.dataset.dir === e.par.direcao);
    });
    el('mesaModal').querySelectorAll('[data-cor]').forEach(function (x) {
      x.classList.toggle('active', (+x.dataset.cor) === (e.par.cor ? 1 : 0));
    });
    el('mesaModal').querySelectorAll('[data-fundo]').forEach(function (x) {
      x.classList.toggle('active', (+x.dataset.fundo) === (e.par.transp ? 1 : 0));
    });
    /* o xadrez aparece atrás das duas telas quando a folha é vazia —
       é como se enxerga transparência, aqui e em qualquer editor      */
    var lc = el('mesaLinhaCor');
    if (lc) lc.style.display = e.par.transp ? 'none' : '';
    var nf = el('mesaNotaFundo');
    if (nf) {
      nf.innerHTML = e.par.transp
        ? 'o que o cabeçote não cobrir fica com <b>alfa de verdade</b> — na linha do tempo esta camada deixa ver o que estiver embaixo'
        : 'onde a fonte não chegar, fica esta cor chapada';
    }
    [el('mesaBancada'), el('mesaFilme')].forEach(function (x) {
      if (x) x.classList.toggle('xadrez', !!e.par.transp);
    });
    sinc('vel', e.par.velocidade); sinc('ruido', e.par.ruido); sinc('onda', e.par.onda);
    var fu = el('mesaFundo'); if (fu && fu.value !== e.par.fundo) fu.value = e.par.fundo;
    var inf = el('mesaInfo'); if (inf) inf.checked = !!e.par.info;
  }

  /* A JANELA REDESENHA POR FORA.
     A repaginação do 2.0 (js/lab2.js) acrescenta uma MANIVELA que anda com
     o cabeçote linha a linha, e depois de andar ela precisa mandar as duas
     telas se refazerem. A função era privada; agora é uma porta. Nada aqui
     muda de comportamento — quem não chamar continua vendo o mesmo.     */
  U.pintar = pintar;

  function sinc(k, v) {
    var r = el('mesaModal').querySelector('[data-mesarange="' + k + '"]');
    var n = el('mesaModal').querySelector('[data-mesanum="' + k + '"]');
    if (r && document.activeElement !== r) r.value = v;
    if (n && document.activeElement !== n) n.value = v;
  }

})(window.VE);
