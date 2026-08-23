/* ============================================================
   rgb_lab — LETRAS RECORTADAS: a interface
   ------------------------------------------------------------
   Vive dentro do laboratório de tipografia, como a tinta: uma folha por
   cima do palco, uma barra de controles ao lado, e o texto vem do campo
   que já existe. Nada de página nova.

   O gesto que manda: CLICAR NUMA LETRA E ARRASTAR. Cada pedaço guarda o
   próprio deslocamento, e quem foi movido fica PRESO — o re-sorteio
   geral não o joga de volta para a linha. Sem isso, arrumar a mensagem
   e clicar no dado desfaria o trabalho.
   ============================================================ */
(function (VE) {
  'use strict';

  var R = VE.recorte;
  var U = VE.recorteui = {};
  var P = null, folha = null, cx = null, palco = null, barra = null;
  var ligado = false, animando = null, t0 = 0, itens = [];
  var arrasto = null, escolhido = -1;

  function $(s) { return document.querySelector(s); }
  function texto() { var e = $('#tyText'); return e ? e.value : 'rgb_lab'; }

  U.estado = function () { return P; };
  U.ligada = function () { return ligado; };

  /* ---------------- a folha ---------------- */
  function medidaDoPalco(base) {
    var r = base.getBoundingClientRect();
    var w = Math.round(r.width), h = Math.round(r.height);
    if (w > 40 && h > 40) return { w: w, h: h };
    /* mesma saída de recurso da tinta: o palco às vezes ainda não foi
       medido, e uma folha de dois pixels colapsa o desenho todo */
    var aw = base.width || 1080, ah = base.height || 1080;
    var k = Math.min(900 / aw, 620 / ah, 1);
    return { w: Math.max(280, Math.round(aw * k)), h: Math.max(280, Math.round(ah * k)) };
  }

  function montarFolha() {
    palco = $('#tyStage');
    var base = $('#tyCanvas');
    if (!palco || !base) return null;
    folha = document.createElement('canvas');
    folha.id = 'tyRecorteCv';
    folha.className = 'recorte-folha';
    var m = medidaDoPalco(base);
    folha.width = m.w; folha.height = m.h;
    folha.style.width = m.w + 'px';
    folha.style.height = m.h + 'px';
    cx = folha.getContext('2d');
    palco.appendChild(folha);
    window.addEventListener('resize', remedir);
    return folha;
  }

  function remedir() {
    if (!ligado || !folha) return;
    var base = $('#tyCanvas'); if (!base) return;
    var m = medidaDoPalco(base);
    if (m.w === folha.width && m.h === folha.height) return;
    folha.width = m.w; folha.height = m.h;
    folha.style.width = m.w + 'px'; folha.style.height = m.h + 'px';
    pintar();
  }

  function pintar(tempo) {
    if (!cx || !folha) return;
    itens = R.desenhar(cx, texto(), P, folha.width, folha.height, tempo || 0);
    /* aro no pedaço escolhido, para saber em quem se está mexendo */
    if (escolhido >= 0 && itens[escolhido]) {
      var it = itens[escolhido];
      cx.save();
      cx.strokeStyle = '#00e5ff';
      cx.lineWidth = 1.5;
      cx.setLineDash([5, 3]);
      cx.strokeRect(it.x + it.p.dx - it.m.w / 2 - 3, it.y + it.p.dy - it.m.h / 2 - 3,
        it.m.w + 6, it.m.h + 6);
      cx.restore();
    }
    var n = $('#recN');
    if (n) n.textContent = itens.length + ' letra' + (itens.length === 1 ? '' : 's');
  }
  U.pintar = pintar;

  /* ---------------- em quem se clicou ----------------
     De trás para a frente: a letra desenhada por último está por cima,
     e é ela que tem de responder ao clique.                        */
  function pedacoEm(px, py) {
    for (var i = itens.length - 1; i >= 0; i--) {
      var it = itens[i];
      var x = it.x + it.p.dx, y = it.y + it.p.dy;
      var hw = it.m.w / 2 + 2, hh = it.m.h / 2 + 2;
      /* desfaz o giro antes de testar, senão letra torta erra o alvo.
         O giro já veio no sorteio que a medida guardou — sortear de novo
         aqui era a quarta medição por letra. */
      var a = -(it.m.s.giro + it.p.giroMao) * Math.PI / 180;
      var dx = px - x, dy = py - y;
      var rx = dx * Math.cos(a) - dy * Math.sin(a);
      var ry = dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(rx) <= hw && Math.abs(ry) <= hh) return i;
    }
    return -1;
  }

  function ligarMouse() {
    function pos(e) {
      var r = folha.getBoundingClientRect();
      var W = r.width > 10 ? r.width : folha.width;
      var H = r.height > 10 ? r.height : folha.height;
      return {
        x: (e.clientX - r.left) / W * folha.width,
        y: (e.clientY - r.top) / H * folha.height
      };
    }
    folha.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var p = pos(e);
      var i = pedacoEm(p.x, p.y);
      escolhido = i;
      if (i < 0) { pintar(); return; }
      try { folha.setPointerCapture(e.pointerId); } catch (err) { }
      var it = itens[i];
      arrasto = {
        i: i, p0: p,
        dx0: it.p.dx, dy0: it.p.dy, g0: it.p.giroMao,
        girar: e.shiftKey
      };
      pintar();
    });
    folha.addEventListener('pointermove', function (e) {
      if (!arrasto) return;
      e.preventDefault();
      var p = pos(e);
      var it = itens[arrasto.i];
      if (!it) return;
      if (arrasto.girar) {
        /* shift arrastando gira a letra em vez de movê-la */
        it.p.giroMao = arrasto.g0 + (p.x - arrasto.p0.x) * 0.4;
      } else {
        it.p.dx = arrasto.dx0 + (p.x - arrasto.p0.x);
        it.p.dy = arrasto.dy0 + (p.y - arrasto.p0.y);
      }
      it.p.preso = 1;
      pintar();
    });
    function soltar() { if (arrasto) { arrasto = null; pintar(); } }
    folha.addEventListener('pointerup', soltar);
    folha.addEventListener('pointercancel', soltar);
    /* duplo clique re-sorteia SÓ aquela letra */
    folha.addEventListener('dblclick', function (e) {
      e.preventDefault();
      var p = pos(e);
      var i = pedacoEm(p.x, p.y);
      if (i < 0) return;
      var idx = P.pedacos.indexOf(itens[i].p);
      if (idx >= 0) R.resortearUm(P, idx);
      pintar();
      VE.app.toast('letra re-sorteada');
    });
  }

  /* ---------------- a barra ---------------- */
  /* `suf` é a unidade escrita ao lado do número. Sem ela, "velocidade 1"
     não dizia a ninguém que aquilo eram doze passos por segundo.     */
  function trilho(k, rot, min, max, passo, suf) {
    var u = suf || '';
    return '<label class="ti-row" data-recrow="' + k + '"><span>' + rot + '</span>' +
      '<input type="range" data-rec="' + k + '" min="' + min + '" max="' + max +
      '" step="' + passo + '" value="' + P[k] + '"><b data-recv="' + k + '" data-recsuf="' + u + '">' +
      P[k] + u + '</b></label>';
  }
  function marca(k, rot) {
    return '<label class="ti-row" data-recrow="' + k + '"><span>' + rot + '</span>' +
      '<input type="checkbox" data-recchk="' + k + '"><b></b></label>';
  }

  /* Duas taxas na tela e nem sempre as duas valem: no STOP MOTION não há
     troca, no PULSO não há tremor, no PARADO não há nada. Deixar o trilho
     aceso mentindo é a armadilha do controle que aparece e não faz.   */
  function linhasDoEstilo() {
    if (!barra) return;
    var vale = {
      passosTroca: R.troca(P),
      passosTremor: R.treme(P),
      tremor: R.treme(P),
      dessinc: R.animado(P)
    };
    Object.keys(vale).forEach(function (k) {
      var lin = barra.querySelector('[data-recrow="' + k + '"]');
      if (!lin) return;
      lin.classList.toggle('off', !vale[k]);
      var ent = lin.querySelector('input');
      if (ent) ent.disabled = !vale[k];
    });
  }

  function montarBarra() {
    barra = document.createElement('div');
    barra.className = 'tinta-bar recorte-bar';
    barra.innerHTML =
      '<div class="ti-h"><b>LETRAS RECORTADAS</b><span id="recN">0 letras</span>' +
      '<button class="cmd cmd-sm" id="recSair">SAIR</button></div>' +
      '<div class="ti-body">' +
      trilho('corpo', 'Tamanho', 0.04, 0.34, 0.005) +
      trilho('espacoLetra', 'Espaço entre letras', -0.04, 0.3, 0.005) +
      trilho('entrelinha', 'Espaço entre linhas', 0, 1.2, 0.02) +
      '<div class="ti-sep">O RECORTE</div>' +
      trilho('varTam', 'Variação de tamanho', 0, 0.8, 0.01) +
      trilho('varGiro', 'Variação de giro', 0, 30, 0.5) +
      trilho('varAltura', 'Sobe e desce', 0, 0.6, 0.01) +
      trilho('maiusculas', 'Quantas maiúsculas', 0, 1, 0.02) +
      trilho('corte', 'Irregularidade da tesoura', 0, 3, 0.05) +
      trilho('textura', 'Textura do papel', 0, 1, 0.02) +
      trilho('sombra', 'Sombra', 0, 2, 0.05) +
      trilho('vinco', 'Vinco do papel', 0, 1.5, 0.05) +
      '<label class="ti-row"><span>Fundo</span><input type="color" data-reccor="fundo" value="' + P.fundo + '"><b></b></label>' +
      marca('fundoOn', 'Pintar o fundo') +
      '<div class="ti-sep">ANIMAÇÃO</div>' +
      '<label class="ti-row"><span>Estilo</span>' +
      '<select data-recsel="estilo">' + R.ESTILOS.map(function (n, i) {
        return '<option value="' + i + '"' + (P.estilo === i ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select><b></b></label>' +
      trilho('passosTroca', 'Troca o recorte', 1, 30, 1, '/s') +
      trilho('passosTremor', 'Treme', 1, 60, 1, '/s') +
      trilho('tremor', 'Tamanho do tremor (px)', 0, 20, 0.5) +
      marca('dessinc', 'Dessincronizar') +
      '</div>' +
      '<div class="ti-btns">' +
      '<button class="cmd cmd-sm" id="recDado" title="Sorteia tudo de novo">SORTEAR</button>' +
      '<button class="cmd cmd-sm" id="recSoltar" title="Devolve as letras arrastadas para a linha">ENDIREITAR</button>' +
      '<button class="cmd cmd-sm" id="recPrev">ANIMAR</button>' +
      '</div>' +
      '<div class="ti-btns">' +
      '<button class="cmd cmd-sm cmd-solid" id="recSend">ENVIAR PRA TIMELINE</button>' +
      '<button class="cmd cmd-sm" id="recPng">PNG</button>' +
      '</div>' +
      '<div class="ti-nota">clique numa letra e <b>arraste</b> · <b>shift</b> arrastando gira · ' +
      '<b>duplo clique</b> re-sorteia só ela</div>';
    palco.appendChild(barra);

    barra.querySelectorAll('[data-rec]').forEach(function (el) {
      el.addEventListener('input', function () {
        P[el.dataset.rec] = parseFloat(el.value);
        var b = barra.querySelector('[data-recv="' + el.dataset.rec + '"]');
        if (b) b.textContent = el.value + (b.dataset.recsuf || '');
        pintar();
      });
    });
    barra.querySelectorAll('[data-recchk]').forEach(function (el) {
      el.checked = !!P[el.dataset.recchk];
      el.addEventListener('change', function () {
        P[el.dataset.recchk] = el.checked ? 1 : 0; pintar();
      });
    });
    barra.querySelectorAll('[data-recsel]').forEach(function (el) {
      el.addEventListener('change', function () {
        P[el.dataset.recsel] = +el.value; linhasDoEstilo(); pintar();
      });
    });
    barra.querySelectorAll('[data-reccor]').forEach(function (el) {
      var poe = function () { P[el.dataset.reccor] = el.value; pintar(); };
      el.addEventListener('input', poe);
      el.addEventListener('change', poe);
    });

    linhasDoEstilo();

    barra.querySelector('#recSair').addEventListener('click', function () { U.desligar(); });
    barra.querySelector('#recDado').addEventListener('click', function () {
      R.resortear(P); escolhido = -1; pintar();
      VE.app.toast('novo sorteio — as letras que você arrastou ficaram onde estavam');
    });
    barra.querySelector('#recSoltar').addEventListener('click', function () {
      (P.pedacos || []).forEach(function (p) { if (p) { p.dx = 0; p.dy = 0; p.giroMao = 0; p.preso = 0; } });
      escolhido = -1; pintar();
    });
    barra.querySelector('#recPrev').addEventListener('click', prever);
    barra.querySelector('#recSend').addEventListener('click', paraTimeline);
    barra.querySelector('#recPng').addEventListener('click', function () {
      var cv = U.render(1080, 1080, 0);
      cv.toBlob(function (b) {
        VE.saveFile((VE.BRAND ? VE.BRAND.slug : 'rgb_lab') + '-recorte.png', b);
      }, 'image/png');
    });
  }

  /* ---------------- prévia animada ---------------- */
  function prever() {
    if (animando) { cancelAnimationFrame(animando); animando = null; pintar(); return; }
    t0 = performance.now();
    (function passo() {
      var t = (performance.now() - t0) / 1000;
      pintar(t);
      animando = requestAnimationFrame(passo);
    })();
  }
  U.prever = prever;

  /* ---------------- saídas ---------------- */
  U.render = function (W, H, tempo) {
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    R.desenhar(cv.getContext('2d'), texto(), P, W, H, tempo || 0);
    return cv;
  };

  function paraTimeline() {
    if (!VE.project) VE.app.ensureProject();
    var W = VE.project.canvas.w, H = VE.project.canvas.h;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var c2 = cv.getContext('2d');
    /* cópia própria dos ajustes: mexer no laboratório depois não muda o
       que já foi para a linha do tempo */
    var meu = JSON.parse(JSON.stringify(P));
    var txt = texto();
    var id = VE.media.registerTypeSource(cv, 'RECORTE · ' + txt.slice(0, 12), function (local) {
      R.desenhar(c2, txt, meu, W, H, local);
    });
    VE.sources[id].animado = R.animado(meu);
    var n = VE.allClips().filter(function (x) { return (x.name || '').indexOf('RECORTE') === 0; }).length + 1;
    var c = VE.addMedia({
      kind: 'type', name: 'RECORTE_' + String(n).padStart(3, '0'), src: id,
      dur: Math.min(VE.MAXDUR, 4), fit: 'contain', over: true
    });
    VE.pushHistory(); VE.emit('project');
    VE.app.toast('recorte na linha do tempo — ' + txt.length + ' letra(s)' +
      (R.animado(meu) ? ', animando' : ''), 'ok');
    return c;
  }
  U.paraTimeline = paraTimeline;

  /* ---------------- ligar e desligar ---------------- */
  U.ligar = function () {
    if (ligado) { U.desligar(); return false; }
    if (!P) P = R.novoP();
    if (VE.tinta && VE.tinta.ligada && VE.tinta.ligada()) VE.tinta.desligar();
    if (!montarFolha()) return false;
    montarBarra();
    ligarMouse();
    document.body.classList.add('recorte-on');
    ligado = true;
    var b = $('#tyRecorte'); if (b) b.classList.add('active');
    pintar();
    /* redigitar o texto redesenha */
    var t = $('#tyText');
    if (t && !t.__rec) { t.__rec = 1; t.addEventListener('input', function () { if (ligado) pintar(); }); }
    VE.app.toast('escreva no campo de texto · clique numa letra e arraste para onde quiser', 'ok');
    return true;
  };

  U.desligar = function () {
    if (animando) { cancelAnimationFrame(animando); animando = null; }
    window.removeEventListener('resize', remedir);
    if (folha && folha.parentNode) folha.parentNode.removeChild(folha);
    if (barra && barra.parentNode) barra.parentNode.removeChild(barra);
    folha = null; cx = null; barra = null; arrasto = null; escolhido = -1;
    document.body.classList.remove('recorte-on');
    ligado = false;
    var b = $('#tyRecorte'); if (b) b.classList.remove('active');
  };

  function prender() {
    var b = $('#tyRecorte');
    if (!b || b.__rec) return;
    b.__rec = 1;
    b.addEventListener('click', function () { U.ligar(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prender);
  else prender();

})(window.VE);
