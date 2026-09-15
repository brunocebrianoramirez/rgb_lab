/* ============================================================
   rgb_lab — PASTILHA: a mesa
   ------------------------------------------------------------
   A terceira mesa do LAB 03, ao lado de LETRAS RECORTADAS e ESCREVER À
   MÃO: uma folha por cima do palco com o texto assentado em pastilhas,
   e uma barra de controles ao lado. O texto, a família, o corpo e o
   arranjo são os da ficha — a mesa só recebe a MÁSCARA das letras
   (`VE.type.mascara`) e a assenta (js/pastilha.js).

   O que muda a GEOMETRIA (passo, rejunte, modo, aro, painel) manda
   assentar de novo; o que muda só a COR (paleta, variação, cantos,
   moldura) só repinta. Um relógio de meio segundo vigia o palco: se as
   letras mudaram (o campo de texto, a família, um arrasto), a folha
   acompanha.                                                          */
(function (VE) {
  'use strict';

  var E = VE.pastilha;
  var U = VE.pastilhaui = {};
  var P = null, folha = null, cx = null, palco = null, barra = null;
  var ligado = false, animando = null, t0 = 0, pan = null, mascara = null, assinatura = '', vigia = null, pedido = 0;

  function $(s) { return document.querySelector(s); }
  U.estado = function () { return P; };
  U.ligada = function () { return ligado; };
  U.painel = function () { return pan; };

  /* ---------------- a folha ---------------- */
  function medidaDoPalco(base) {
    var r = base.getBoundingClientRect();
    var w = Math.round(r.width), h = Math.round(r.height);
    if (w > 40 && h > 40) return { w: w, h: h };
    var aw = base.width || 1080, ah = base.height || 1080;
    var k = Math.min(900 / aw, 620 / ah, 1);
    return { w: Math.max(280, Math.round(aw * k)), h: Math.max(280, Math.round(ah * k)) };
  }
  function montarFolha() {
    palco = $('#tyStage');
    var base = $('#tyCanvas');
    if (!palco || !base) return null;
    folha = document.createElement('canvas');
    folha.id = 'tyPastilhaCv';
    folha.className = 'pastilha-folha';
    var t = VE.type.tamanhoDoPalco();
    folha.width = t.w; folha.height = t.h;          /* a folha tem os pixels do palco: a pastilha sai nítida */
    var m = medidaDoPalco(base);
    folha.style.width = m.w + 'px'; folha.style.height = m.h + 'px';
    cx = folha.getContext('2d');
    palco.appendChild(folha);
    window.addEventListener('resize', remedir);
    return folha;
  }
  function remedir() {
    if (!ligado || !folha) return;
    var base = $('#tyCanvas'); if (!base) return;
    var m = medidaDoPalco(base);
    folha.style.width = m.w + 'px'; folha.style.height = m.h + 'px';
  }

  /* ---------------- assentar e pintar ----------------
     A assinatura da máscara: o alfa lido numa grade de 48×48 pontos.
     Barata, e pega texto, família, corpo, alinhamento e arrasto.       */
  function assinar(m) {
    var g = m.getContext('2d'), d = g.getImageData(0, 0, m.width, m.height).data, s = 0, W = m.width, H = m.height;
    for (var j = 0; j < 48; j++) for (var i = 0; i < 48; i++) {
      var x = Math.floor((i + 0.5) * W / 48), y = Math.floor((j + 0.5) * H / 48);
      if (d[(y * W + x) * 4 + 3] > 127) s = (s * 31 + (j * 48 + i)) % 2147483647;
    }
    return s + '|' + W + 'x' + H;
  }
  function assentar() {
    if (!ligado) return;
    mascara = VE.type.mascara();
    pan = E.assentar(mascara, mascara.width, mascara.height, P);
    assinatura = assinar(mascara) + '|' + chaveGeo();
    var n = $('#pasN');
    if (n) n.textContent = pan.vazio ? 'sem letras' : (pan.tiles.length + ' pastilhas · ' + pan.K + ' fiada' + (pan.K === 1 ? '' : 's') + ' · ' + pan.ms + ' ms');
  }
  function chaveGeo() { return [P.passo, P.rejunte, P.modo, P.aro].join('|'); }
  function pintar(tempo) {
    if (!cx || !folha || !pan) return;
    E.desenhar(cx, pan, P, folha.width, folha.height, tempo || 0);
  }
  /* pedir de novo, coalescido num quadro: arrastar um trilho não pode
     assentar cem vezes por segundo                                    */
  function pedir(geo) {
    if (geo) pedido = 2; else pedido = Math.max(pedido, 1);
    /* um temporizador, e não requestAnimationFrame: o rAF só corre com a
       aba pintando, e a mesa tem de acompanhar o texto mesmo quando o
       painel do app não está à vista                                  */
    if (pedir.raf) return;
    pedir.raf = setTimeout(function () {
      pedir.raf = null;
      var g = pedido === 2; pedido = 0;
      if (g) assentar();
      pintar(animando ? (performance.now() - t0) / 1000 : 0);
    }, 16);
  }
  U.pintar = function () { pedir(false); };

  /* o relógio que vigia o palco */
  function vigiar() {
    vigia = setInterval(function () {
      if (!ligado || animando) return;
      var m = VE.type.mascara();
      var a = assinar(m) + '|' + chaveGeo();
      if (a !== assinatura) { pedir(true); }
    }, 500);
  }

  /* ---------------- a barra ---------------- */
  function pct(v, min, max) { var p = (v - min) / (max - min) * 100; return (p < 0 ? 0 : p > 100 ? 100 : p).toFixed(2) + '%'; }
  function trilho(k, rot, min, max, passo, suf, geo) {
    var u = suf || '';
    return '<label class="ti-row" data-pasrow="' + k + '" style="--fill:' + pct(P[k], min, max) + '">' +
      '<span>' + rot + '</span>' +
      '<input type="range" data-pas="' + k + '" data-geo="' + (geo ? 1 : 0) + '" data-min="' + min + '" data-max="' + max +
      '" min="' + min + '" max="' + max + '" step="' + passo + '" value="' + P[k] + '"><b data-pasv="' + k + '" data-passuf="' + u + '">' +
      P[k] + u + '</b></label>';
  }
  function marca(k, rot, geo) {
    return '<label class="ti-row" data-pasrow="' + k + '"><span>' + rot + '</span>' +
      '<input type="checkbox" data-paschk="' + k + '" data-geo="' + (geo ? 1 : 0) + '"><b></b></label>';
  }
  function escolha(k, rot, opts, geo) {
    return '<label class="ti-row" data-pasrow="' + k + '"><span>' + rot + '</span>' +
      '<select data-passel="' + k + '" data-geo="' + (geo ? 1 : 0) + '">' + opts.map(function (n, i) {
        return '<option value="' + i + '"' + (P[k] === i ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select><b></b></label>';
  }
  function cor(k, rot) {
    return '<label class="ti-row"><span>' + rot + '</span><input type="color" data-pascor="' + k + '" value="' + (P[k] || E.corDoRejunte(P)) + '"><b></b></label>';
  }

  function montarBarra() {
    barra = document.createElement('div');
    barra.className = 'tinta-bar recorte-bar pastilha-bar';
    var paletas = E.PALETAS.map(function (p) { return p.nome + (p.br ? ' ·br' : ''); });
    barra.innerHTML =
      '<div class="ti-h"><b>PASTILHA</b><span id="pasN">…</span>' +
      '<button class="cmd cmd-sm" id="pasSair">SAIR</button></div>' +
      '<div class="ti-body">' +
      '<div class="ti-sep">O ASSENTAMENTO</div>' +
      trilho('passo', 'Passo da pastilha', 4, 25, 0.5, '%', true) +
      trilho('rejunte', 'Rejunte', 0, 30, 1, '%', true) +
      trilho('cobertura', 'Cobertura mínima do caco', 0, 60, 1, '%') +
      trilho('canto', 'Canto arredondado', 0, 50, 1, '%') +
      escolha('modo', 'Desenho', E.MODOS, true) +
      trilho('aro', 'Fiadas de contorno (aro)', 0, 3, 1, '', true) +
      '<div class="ti-sep">O PAINEL</div>' +
      escolha('campo', 'Campo', E.CAMPOS) +
      escolha('moldura', 'Moldura', E.MOLDURAS) +
      trilho('molduraLarg', 'Largura da moldura', 1, 6, 1, ' past.') +
      '<div class="ti-sep">AS CORES</div>' +
      escolha('paleta', 'Paleta', paletas) +
      cor('tinta', 'Pastilha da letra') +
      cor('papel', 'Pastilha do campo') +
      cor('aroCor', 'Aro e moldura') +
      cor('rejunteCor', 'Rejunte') +
      trilho('variacao', 'Variação de tom', 0, 40, 1, '%') +
      '<div class="ti-sep">ANIMAÇÃO</div>' +
      marca('animar', 'Assentar uma a uma') +
      trilho('duracao', 'Duração', 0.5, 12, 0.5, ' s') +
      '</div>' +
      '<div class="ti-btns">' +
      '<button class="cmd cmd-sm" id="pasDado" title="Outro sorteio de tons e de pedras">SORTEAR</button>' +
      '<button class="cmd cmd-sm" id="pasPrev">ASSENTAR</button>' +
      '</div>' +
      '<div class="ti-btns">' +
      '<button class="cmd cmd-sm cmd-solid" id="pasSend">ENVIAR PRA TIMELINE</button>' +
      '<button class="cmd cmd-sm" id="pasPng">PNG</button>' +
      '</div>' +
      '<div class="ti-nota">a família, o corpo e o arranjo são os da ficha · ' +
      '<b>·br</b> marca as paletas brasileiras · a CALÇADA é a pedra portuguesa do Rio</div>';
    palco.appendChild(barra);
    if (VE.type && VE.type.arrastavel) VE.type.arrastavel(barra, 'pastilha');

    barra.querySelectorAll('[data-pas]').forEach(function (el) {
      el.addEventListener('input', function () {
        P[el.dataset.pas] = parseFloat(el.value);
        var b = barra.querySelector('[data-pasv="' + el.dataset.pas + '"]');
        if (b) b.textContent = el.value + (b.dataset.passuf || '');
        var linha = el.closest('.ti-row');
        if (linha) linha.style.setProperty('--fill', pct(parseFloat(el.value), +el.dataset.min, +el.dataset.max));
        pedir(el.dataset.geo === '1');
      });
    });
    barra.querySelectorAll('[data-paschk]').forEach(function (el) {
      el.checked = !!P[el.dataset.paschk];
      el.addEventListener('change', function () { P[el.dataset.paschk] = el.checked ? 1 : 0; pedir(el.dataset.geo === '1'); });
    });
    barra.querySelectorAll('[data-passel]').forEach(function (el) {
      el.addEventListener('change', function () {
        var k = el.dataset.passel, v = +el.value;
        if (k === 'paleta') { E.aplicarPaleta(P, v); refletirCores(); pedir(true); return; }
        P[k] = v; pedir(el.dataset.geo === '1');
      });
    });
    barra.querySelectorAll('[data-pascor]').forEach(function (el) {
      var poe = function () {
        P[el.dataset.pascor] = el.value;
        /* mexer numa cor à mão tira a paleta do preset: vira personalizada */
        P.paleta = E.PALETAS.length - 1;
        var sel = barra.querySelector('[data-passel="paleta"]'); if (sel) sel.value = String(P.paleta);
        pedir(false);
      };
      el.addEventListener('input', poe);
      el.addEventListener('change', poe);
    });
    barra.querySelector('#pasSair').addEventListener('click', function () { U.desligar(); });
    barra.querySelector('#pasDado').addEventListener('click', function () { P.semente = (P.semente + 1) % 1000; pedir(false); });
    barra.querySelector('#pasPrev').addEventListener('click', prever);
    barra.querySelector('#pasSend').addEventListener('click', paraTimeline);
    barra.querySelector('#pasPng').addEventListener('click', function () {
      var t = VE.type.tamanhoDoPalco();
      var cv = U.render(t.w * 2, t.h * 2, 0);
      cv.toBlob(function (b) { VE.saveFile((VE.BRAND ? VE.BRAND.slug : 'rgb_lab') + '-pastilha.png', b); }, 'image/png');
    });
  }
  function refletirCores() {
    if (!barra) return;
    ['tinta', 'papel', 'aroCor'].forEach(function (k) { var el = barra.querySelector('[data-pascor="' + k + '"]'); if (el) el.value = P[k]; });
    var rj = barra.querySelector('[data-pascor="rejunteCor"]'); if (rj) rj.value = E.corDoRejunte(P);
    ['campo', 'moldura'].forEach(function (k) { var el = barra.querySelector('[data-passel="' + k + '"]'); if (el) el.value = String(P[k]); });
  }

  /* ---------------- prévia animada ---------------- */
  function prever() {
    if (animando) { cancelAnimationFrame(animando); animando = null; pintar(0); return; }
    if (!P.animar) { P.animar = 1; var chk = barra.querySelector('[data-paschk="animar"]'); if (chk) chk.checked = true; }
    t0 = performance.now();
    (function passo() {
      var t = (performance.now() - t0) / 1000;
      pintar(t);
      if (t > P.duracao + 0.6) { animando = null; return; }
      animando = requestAnimationFrame(passo);
    })();
  }
  U.prever = prever;

  /* ---------------- saídas ----------------
     A máscara nasce no tamanho do palco; para outro tamanho (a
     composição, o PNG em dobro) ela é ESCALADA por 'contain' num canvas
     do tamanho pedido, e o assentamento é refeito ali — o passo segue a
     altura das letras, então a pastilha é a mesma em proporção.        */
  function mascaraEm(W, H) {
    var m = VE.type.mascara();
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d');
    var k = Math.min(W / m.width, H / m.height);
    var w = m.width * k, h = m.height * k;
    g.drawImage(m, (W - w) / 2, (H - h) / 2, w, h);
    return c;
  }
  U.render = function (W, H, tempo) {
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var m = mascaraEm(W, H), p2 = E.assentar(m, W, H, P);
    E.desenhar(cv.getContext('2d'), p2, P, W, H, tempo || 0);
    return cv;
  };

  function paraTimeline() {
    if (!VE.project) VE.app.ensureProject();
    var W = VE.project.canvas.w, H = VE.project.canvas.h;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c2 = cv.getContext('2d');
    var meu = JSON.parse(JSON.stringify(P));
    var txt = ($('#tyText') || {}).value || 'pastilha';
    var m = mascaraEm(W, H), p2 = E.assentar(m, W, H, meu);
    /* o quadro parado é desenhado uma vez; animando, cada quantidade de
       pastilhas já postas é desenhada uma vez e guardada              */
    /* a composição fica guardada no painel (js/pastilha.js); parado, o
       quadro é desenhado uma vez; animando, cada quadro é só escolher por
       pixel entre a imagem cheia e o fundo                              */
    var total = p2.tiles.length, ultimoN = -1;
    var render = function (local) {
      var n = E.animado(meu) ? Math.floor(Math.max(0, Math.min(1, local / meu.duracao)) * total) : total;
      if (n === ultimoN) return;
      ultimoN = n;
      E.desenhar(c2, p2, meu, W, H, E.animado(meu) ? local : 0);
    };
    render(0);
    var id = VE.media.registerTypeSource(cv, 'PASTILHA · ' + txt.slice(0, 12), render);
    VE.sources[id].animado = E.animado(meu);
    var n = VE.allClips().filter(function (x) { return (x.name || '').indexOf('PASTILHA') === 0; }).length + 1;
    var c = VE.addMedia({
      kind: 'type', name: 'PASTILHA_' + String(n).padStart(3, '0'), src: id,
      dur: Math.min(VE.MAXDUR, E.animado(meu) ? meu.duracao + 2 : 4), fit: 'contain', over: true
    });
    VE.pushHistory(); VE.emit('project');
    VE.app.toast('pastilha na linha do tempo — ' + total + ' pastilhas' + (E.animado(meu) ? ', assentando' : ''), 'ok');
    return c;
  }
  U.paraTimeline = paraTimeline;

  /* ---------------- ligar e desligar ---------------- */
  U.ligar = function () {
    if (ligado) { U.desligar(); return false; }
    if (!P) { P = E.novoP(); E.aplicarPaleta(P, 0); }
    if (VE.tinta && VE.tinta.ligada && VE.tinta.ligada()) VE.tinta.desligar();
    if (VE.recorteui && VE.recorteui.ligada && VE.recorteui.ligada()) VE.recorteui.desligar();
    if (!montarFolha()) return false;
    montarBarra();
    document.body.classList.add('pastilha-on');
    ligado = true;
    var b = $('#tyPastilha'); if (b) b.classList.add('active');
    assentar(); pintar(0);
    vigiar();
    VE.app.toast('escreva no campo de texto; a família e o corpo são os da ficha · a mesa assenta as pastilhas', 'ok');
    return true;
  };
  U.desligar = function () {
    if (animando) { cancelAnimationFrame(animando); animando = null; }
    if (vigia) { clearInterval(vigia); vigia = null; }
    window.removeEventListener('resize', remedir);
    if (folha && folha.parentNode) folha.parentNode.removeChild(folha);
    if (barra && barra.parentNode) barra.parentNode.removeChild(barra);
    folha = null; cx = null; barra = null; pan = null;
    document.body.classList.remove('pastilha-on');
    ligado = false;
    var b = $('#tyPastilha'); if (b) b.classList.remove('active');
  };

  function prender() {
    var b = $('#tyPastilha');
    if (!b || b.__past) return;
    b.__past = 1;
    b.addEventListener('click', function () { U.ligar(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prender);
  else prender();

})(window.VE);
