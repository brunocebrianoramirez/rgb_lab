/* ============================================================
   rgb_lab — TINTA: a interface, dentro do laboratório de tipografia
   ------------------------------------------------------------
   Mesma separação de comp.js / compui.js: o modelo e o desenho ficam em
   `tinta.js`, a mão na massa fica aqui.

   Sem janela nova e sem página nova: o palco que já existe ganha uma
   folha por cima. Enquanto a folha está lá, o ponteiro escreve; ao sair,
   o laboratório volta a ser o de sempre, com o texto intacto.
   ============================================================ */
(function (VE) {
  'use strict';

  var T = VE.tinta;
  var obj = null, folha = null, fx = null, palco = null, barra = null, ligado = false;
  var animar = null;

  function $(s) { return document.querySelector(s); }

  T.estado = function () { return obj; };
  T.ligada = function () { return ligado; };

  /* ---------------- a folha de captura ---------------- */
  function montarFolha() {
    palco = $('#tyStage');
    if (!palco) return null;
    var base = $('#tyCanvas');
    if (!base) return null;
    folha = document.createElement('canvas');
    folha.id = 'tyTintaCv';
    folha.className = 'tinta-folha';
    var m = medidaDoPalco(base);
    folha.width = m.w; folha.height = m.h;
    folha.style.width = m.w + 'px';
    folha.style.height = m.h + 'px';
    fx = folha.getContext('2d');
    palco.appendChild(folha);
    window.addEventListener('resize', remedir);
    return folha;
  }

  /* A folha nasce do tamanho de TELA do canvas de baixo, não do tamanho
     interno dele: assim o traço cai exatamente onde o dedo encostou, sem
     conta de escala pelo meio.

     Mas o palco às vezes ainda não foi medido — aba recém-aberta, primeira
     pintura — e aí `getBoundingClientRect` devolve zero. Sem esta saída de
     recurso a folha nascia com dois pixels e o desenho inteiro colapsava
     num ponto. Nesse caso usamos a proporção interna do canvas.        */
  function medidaDoPalco(base) {
    var r = base.getBoundingClientRect();
    var w = Math.round(r.width), h = Math.round(r.height);
    if (w > 40 && h > 40) return { w: w, h: h };
    var aw = base.width || 1080, ah = base.height || 1080;
    var k = Math.min(900 / aw, 620 / ah, 1);
    return { w: Math.max(280, Math.round(aw * k)), h: Math.max(280, Math.round(ah * k)) };
  }

  /* redimensionar a janela move o palco: a folha acompanha, e o desenho
     continua o mesmo porque está guardado em fração, não em pixels.  */
  function remedir() {
    if (!ligado || !folha) return;
    var base = $('#tyCanvas');
    if (!base) return;
    var m = medidaDoPalco(base);
    if (m.w === folha.width && m.h === folha.height) return;
    folha.width = m.w; folha.height = m.h;
    folha.style.width = m.w + 'px';
    folha.style.height = m.h + 'px';
    repintar();
  }
  T.remedir = remedir;

  /* o desenho como ele está agora, inteiro — a animação é o que sai
     depois, não o que atrapalha enquanto se escreve */
  function repintar() {
    if (!fx || !folha || !obj) return;
    var W = folha.width, H = folha.height;
    fx.setTransform(1, 0, 0, 1, 0, 0);
    fx.clearRect(0, 0, W, H);
    var visto = {};
    Object.keys(obj).forEach(function (k) { visto[k] = obj[k]; });
    visto.escrever = 0; visto.caneta = 0; visto.laco = 0; visto.fica = 1;
    T.desenhar(fx, visto, W, H, 1e6);

    /* o traço que ainda está sob o dedo */
    var vivo = T.tracoEmCurso();
    if (vivo) {
      var p = new Path2D();
      p.addPath(new Path2D(vivo.d), new DOMMatrix().scale(W, H));
      fx.save();
      fx.lineCap = obj.ponta || 'round'; fx.lineJoin = 'round';
      fx.strokeStyle = obj.cor;
      fx.lineWidth = obj.espessura * Math.min(W, H);
      fx.stroke(p);
      fx.restore();
    }
    contar();
  }
  T.repintar = repintar;

  function contar() {
    var el = document.getElementById('tintaN');
    if (!el || !obj) return;
    var n = obj.tracos.length;
    var pts = obj.tracos.reduce(function (a, t) { return a + (t.pts ? t.pts.length : 0); }, 0);
    el.textContent = n + ' traço' + (n === 1 ? '' : 's') + ' · ' + pts + ' pontos';
  }

  /* ---------------- a barra de controles ---------------- */
  function trilho(k, rot, val, min, max, passo) {
    return '<label class="ti-row"><span>' + rot + '</span>' +
      '<input type="range" data-ti="' + k + '" min="' + min + '" max="' + max +
      '" step="' + passo + '" value="' + val + '"><b data-tiv="' + k + '">' + val + '</b></label>';
  }
  function marca(k, rot) {
    return '<label class="ti-row"><span>' + rot + '</span>' +
      '<input type="checkbox" data-tichk="' + k + '"><b></b></label>';
  }
  function corDe(k, rot) {
    return '<label class="ti-row"><span>' + rot + '</span>' +
      '<input type="color" data-ticor="' + k + '" value="' + obj[k] + '"><b></b></label>';
  }

  function montarBarra() {
    barra = document.createElement('div');
    barra.className = 'tinta-bar';
    barra.innerHTML =
      '<div class="ti-h"><b>ESCREVER À MÃO</b><span id="tintaN">0 traços</span>' +
      '<button class="cmd cmd-sm" id="tintaSair">SAIR</button></div>' +
      '<div class="ti-body">' +
      corDe('cor', 'Cor') +
      trilho('espessura', 'Espessura', obj.espessura, 0.002, 0.05, 0.001) +
      trilho('pressao', 'Pressão do pincel', obj.pressao, 0, 0.85, 0.01) +
      marca('contorno', 'Contorno') +
      corDe('contornoCor', 'Cor do contorno') +
      marca('sombra', 'Sombra') +
      '<div class="ti-sep">ANIMAÇÃO DE ESCRITA</div>' +
      marca('escrever', 'Desenhar sozinho') +
      trilho('dur', 'Duração (s)', obj.dur, 0.3, 12, 0.1) +
      marca('caneta', 'Ponta da caneta') +
      marca('laco', 'Repetir') +
      '</div>' +
      '<div class="ti-btns">' +
      '<button class="cmd cmd-sm" id="tintaUndo">DESFAZER</button>' +
      '<button class="cmd cmd-sm" id="tintaClear">LIMPAR</button>' +
      '<button class="cmd cmd-sm" id="tintaPrev">VER A ESCRITA</button>' +
      '</div>' +
      '<div class="ti-btns">' +
      '<button class="cmd cmd-sm cmd-solid" id="tintaSend">ENVIAR PRA TIMELINE</button>' +
      '<button class="cmd cmd-sm" id="tintaPng">PNG</button>' +
      '<button class="cmd cmd-sm" id="tintaSvg">SVG</button>' +
      '</div>';
    palco.appendChild(barra);

    barra.querySelectorAll('[data-ti]').forEach(function (el) {
      el.addEventListener('input', function () {
        obj[el.dataset.ti] = parseFloat(el.value);
        var b = barra.querySelector('[data-tiv="' + el.dataset.ti + '"]');
        if (b) b.textContent = el.value;
        repintar();
      });
    });
    /* os dois eventos escrevem: só o `input` perde a cor escolhida
       pelo teclado, que é a armadilha de sempre com <input type=color> */
    barra.querySelectorAll('[data-ticor]').forEach(function (el) {
      var poe = function () { obj[el.dataset.ticor] = el.value; repintar(); };
      el.addEventListener('input', poe);
      el.addEventListener('change', poe);
    });
    barra.querySelectorAll('[data-tichk]').forEach(function (el) {
      el.checked = !!obj[el.dataset.tichk];
      el.addEventListener('change', function () {
        obj[el.dataset.tichk] = el.checked ? 1 : 0; repintar();
      });
    });

    barra.querySelector('#tintaSair').addEventListener('click', function () { T.desligar(); });
    barra.querySelector('#tintaUndo').addEventListener('click', function () {
      if (!T.desfazer(obj)) VE.app.toast('não há traço para desfazer');
      repintar();
    });
    barra.querySelector('#tintaClear').addEventListener('click', function () { T.limpar(obj); repintar(); });
    barra.querySelector('#tintaPrev').addEventListener('click', function () { prever(); });
    barra.querySelector('#tintaSend').addEventListener('click', function () {
      var c = T.paraTimeline(obj);
      if (c) VE.app.toast('TINTA na linha do tempo — ' + obj.tracos.length +
        ' traço(s), ' + T.duracao(obj).toFixed(1) + 's de escrita', 'ok');
    });
    barra.querySelector('#tintaPng').addEventListener('click', function () {
      T.png(obj, 1080, 1080).toBlob(function (b) {
        VE.saveFile((VE.BRAND ? VE.BRAND.slug : 'rgb_lab') + '-tinta.png', b);
      }, 'image/png');
    });
    barra.querySelector('#tintaSvg').addEventListener('click', function () {
      var blob = new Blob([T.svg(obj, 1080, 1080)], { type: 'image/svg+xml' });
      VE.saveFile((VE.BRAND ? VE.BRAND.slug : 'rgb_lab') + '-tinta.svg', blob);
      VE.app.toast('svg com o traço em vetor — pode ampliar à vontade', 'ok');
    });
  }

  /* ---------------- prévia da escrita ---------------- */
  function prever() {
    if (!obj || !obj.tracos.length) { VE.app.toast('desenhe alguma coisa primeiro', 'err'); return; }
    if (animar) { cancelAnimationFrame(animar); animar = null; }
    var t0 = performance.now();
    var total = T.duracao(obj);
    (function passo() {
      var t = (performance.now() - t0) / 1000;
      var W = folha.width, H = folha.height;
      fx.setTransform(1, 0, 0, 1, 0, 0);
      fx.clearRect(0, 0, W, H);
      T.desenhar(fx, obj, W, H, t);
      if (t < total) animar = requestAnimationFrame(passo);
      else { animar = null; repintar(); }
    })();
  }
  T.prever = prever;

  /* ---------------- ligar e desligar ---------------- */
  T.ligar = function () {
    if (ligado) { T.desligar(); return false; }
    if (!obj) obj = T.novo();
    if (!montarFolha()) return false;
    montarBarra();
    T.ligarCaptura(folha, obj, function (o) {
      repintar();
      if (o === 'traco') VE.app.toast('traço guardado — ' + obj.tracos.length + ' no total');
    });
    document.body.classList.add('tinta-on');
    ligado = true;
    var b = $('#tyTinta'); if (b) b.classList.add('active');
    repintar();
    VE.app.toast('escreva no quadro com o mouse, a caneta ou o dedo — depois ENVIAR PRA TIMELINE', 'ok');
    return true;
  };

  T.desligar = function () {
    if (animar) { cancelAnimationFrame(animar); animar = null; }
    T.desligarCaptura();
    window.removeEventListener('resize', remedir);
    if (folha && folha.parentNode) folha.parentNode.removeChild(folha);
    if (barra && barra.parentNode) barra.parentNode.removeChild(barra);
    folha = null; fx = null; barra = null;
    document.body.classList.remove('tinta-on');
    ligado = false;
    var b = $('#tyTinta'); if (b) b.classList.remove('active');
  };

  /* ---------------- o botão do laboratório ---------------- */
  function prender() {
    var b = $('#tyTinta');
    if (!b || b.__tinta) return;
    b.__tinta = 1;
    b.addEventListener('click', function () { T.ligar(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prender);
  else prender();

})(window.VE);
