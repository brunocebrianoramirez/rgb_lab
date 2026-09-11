/* ============================================================
   rgb_lab — A MONTAGEM DE ÁUDIO (LAB 02)
   ------------------------------------------------------------
   Uma linha do tempo SÓ DE SOM, dentro do laboratório de áudio: várias
   pistas, vários trechos, arrastar, cortar e sobrepor. É um montador
   independente da composição de vídeo, e essa independência é o ponto —
   dá para montar a trilha inteira sem ter um quadro de vídeo aberto.

   Por que não reaproveitar a linha do tempo do LAB 01: aquela é uma mesa
   de VÍDEO. Um clipe dela é uma fonte com recorte, transição, efeitos,
   máscara, keyframes e mistura — nada disso vale para um pedaço de som, e
   metade daquele código existe para desenhar miniatura de quadro. Aqui um
   clipe é buffer, começo, duração e ganho. Quatro campos.

   O QUE ESTA JANELA NÃO FAZ, de propósito: efeito por clipe. O tratamento
   do som é o rack, que já existe e é de onde o material sai. Aqui se
   ARRUMA no tempo; lá se TRATA.

   Modelo e janela no mesmo arquivo: o modelo tem quatro campos e cinco
   funções, e separá-lo em `audiotl.js` + `audiotlui.js` seria mais
   indireção do que código. A separação de mesa.js/mesaui.js existe porque
   lá o modelo é um motor de slit-scan; aqui não há motor nenhum — quem
   mistura é o `OfflineAudioContext` do navegador.
   ============================================================ */
(function (VE) {
  'use strict';

  var M = VE.audiotl = {};
  function $(s) { return document.querySelector(s); }
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  /* ---------------- o modelo ---------------- */
  var pistas = [];
  var seq = 1, seqP = 1;
  var escolhido = null;          /* uid do clipe em foco */
  var zoom = 60;                 /* pixels por segundo */

  function novaPista(nome) {
    var p = { id: 'ap' + (seqP++), nome: nome || ('PISTA ' + seqP), mudo: 0, ganho: 1, clipes: [] };
    pistas.push(p);
    return p;
  }
  M.novaPista = novaPista;
  M.pistas = function () { return pistas; };

  function acharClipe(uid) {
    for (var i = 0; i < pistas.length; i++) {
      var cs = pistas[i].clipes;
      for (var j = 0; j < cs.length; j++) if (cs[j].uid === uid) return { c: cs[j], p: pistas[i] };
    }
    return null;
  }
  M.achar = function (uid) { return acharClipe(uid); };

  /* Um clipe: buffer, onde começa na linha, quanto dura, e de que ponto do
     buffer ele parte. `entrada` é o que permite cortar sem copiar amostra
     nenhuma — o corte vira dois clipes olhando para o MESMO buffer.    */
  M.por = function (buf, nome, pistaId, start) {
    if (!buf) return null;
    var p = pistaId ? pistas.filter(function (x) { return x.id === pistaId; })[0] : pistas[0];
    if (!p) p = novaPista();
    var c = {
      uid: 'ac' + (seq++), nome: nome || 'ÁUDIO', buf: buf,
      start: start != null ? start : fimDa(p),
      dur: buf.duration, entrada: 0, ganho: 1
    };
    p.clipes.push(c);
    escolhido = c.uid;
    return c;
  };

  function fimDa(p) {
    var f = 0;
    p.clipes.forEach(function (c) { f = Math.max(f, c.start + c.dur); });
    return f;
  }

  M.duracao = function () {
    var d = 0;
    pistas.forEach(function (p) { p.clipes.forEach(function (c) { d = Math.max(d, c.start + c.dur); }); });
    return d;
  };

  M.mover = function (uid, start, pistaId) {
    var f = acharClipe(uid);
    if (!f) return;
    f.c.start = Math.max(0, start);
    if (pistaId && pistaId !== f.p.id) {
      var alvo = pistas.filter(function (x) { return x.id === pistaId; })[0];
      if (alvo) {
        f.p.clipes.splice(f.p.clipes.indexOf(f.c), 1);
        alvo.clipes.push(f.c);
      }
    }
  };

  /* CORTAR não fatia amostra: nasce um segundo clipe que aponta para o
     mesmo buffer, com a `entrada` deslocada. Cortar dez vezes um arquivo
     de trinta minutos continua custando zero de memória. */
  M.cortar = function (uid, t) {
    var f = acharClipe(uid);
    if (!f) return false;
    var c = f.c;
    if (t <= c.start + 0.01 || t >= c.start + c.dur - 0.01) return false;
    var corte = t - c.start;
    var b = {
      uid: 'ac' + (seq++), nome: c.nome, buf: c.buf,
      start: t, dur: c.dur - corte, entrada: c.entrada + corte, ganho: c.ganho
    };
    c.dur = corte;
    f.p.clipes.push(b);
    return true;
  };

  M.duplicar = function (uid) {
    var f = acharClipe(uid);
    if (!f) return;
    var c = f.c;
    f.p.clipes.push({
      uid: 'ac' + (seq++), nome: c.nome, buf: c.buf,
      start: c.start + c.dur, dur: c.dur, entrada: c.entrada, ganho: c.ganho
    });
  };

  M.apagar = function (uid) {
    var f = acharClipe(uid);
    if (!f) return;
    f.p.clipes.splice(f.p.clipes.indexOf(f.c), 1);
    if (escolhido === uid) escolhido = null;
  };

  /* ---------------- a mistura ----------------
     Quem mistura é o `OfflineAudioContext`: cada clipe vira uma fonte com
     o seu ganho, agendada no instante certo. Escrever a soma amostra a
     amostra em JavaScript seria reimplementar — mal — o misturador que o
     navegador já tem, e que roda em código nativo.                    */
  M.mixar = function () {
    var dur = M.duracao();
    if (dur <= 0) return Promise.resolve(null);
    var sr = 48000, canais = 2;
    pistas.forEach(function (p) {
      p.clipes.forEach(function (c) {
        if (c.buf) { sr = c.buf.sampleRate; canais = Math.max(canais, c.buf.numberOfChannels); }
      });
    });
    var oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      canais, Math.ceil(dur * sr), sr);
    pistas.forEach(function (p) {
      if (p.mudo) return;
      p.clipes.forEach(function (c) {
        if (!c.buf || c.dur <= 0) return;
        var n = oc.createBufferSource();
        n.buffer = c.buf;
        var g = oc.createGain();
        g.gain.value = c.ganho * p.ganho;
        n.connect(g); g.connect(oc.destination);
        n.start(c.start, Math.max(0, c.entrada), Math.max(0.001, c.dur));
      });
    });
    return oc.startRendering();
  };

  /* ---------------- tocar ----------------
     Toca a MISTURA, não os clipes soltos. É mais simples de acertar e é o
     mesmo material que sai na exportação: o que se ouve é o que sai. */
  var ac = null, node = null, tocandoT0 = 0, tocando = false, raf = null;
  function ctx() { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); return ac; }

  M.tocar = function () {
    if (tocando) { M.parar(); return; }
    var b = el('atlInfo');
    if (b) b.textContent = 'MISTURANDO…';
    M.mixar().then(function (mix) {
      if (b) b.textContent = '';
      if (!mix) { VE.app.toast('não há nada montado'); return; }
      var c = ctx();
      node = c.createBufferSource();
      node.buffer = mix;
      node.connect(c.destination);
      node.start(0);
      tocandoT0 = c.currentTime;
      tocando = true;
      var bt = el('atlPlay'); if (bt) bt.textContent = '❚❚';
      node.onended = function () { M.parar(); };
      laco();
    });
  };
  M.parar = function () {
    if (node) { try { node.stop(); } catch (e) { } node.disconnect(); node = null; }
    tocando = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    var bt = el('atlPlay'); if (bt) bt.textContent = '▶';
    var pc = el('atlCursor'); if (pc) pc.style.left = '0px';
  };
  function laco() {
    if (!tocando) return;
    var t = ctx().currentTime - tocandoT0;
    var pc = el('atlCursor');
    if (pc) pc.style.left = (t * zoom) + 'px';
    raf = requestAnimationFrame(laco);
  }

  /* ================================================== A JANELA ========= */
  function montarJanela() {
    if (el('atlModal')) return;
    var d = document.createElement('div');
    d.className = 'modal hidden';
    d.id = 'atlModal';
    d.innerHTML =
      '<div class="modal-card atl-card">' +
      '<div class="modal-h"><span class="dot"></span><h3>MONTAGEM DE ÁUDIO</h3>' +
      '<span class="micro" id="atlInfo"></span>' +
      '<button class="cmd cmd-sm" id="atlFechar">FECHAR</button></div>' +

      '<div class="modal-b atl-b">' +
      '<div class="atl-bar">' +
      '<button class="cmd cmd-sm" id="atlPor" title="Põe o áudio que está na mesa, já com a cadeia de módulos aplicada">+ O ÁUDIO DA MESA</button>' +
      '<button class="cmd cmd-sm" id="atlPista">+ PISTA</button>' +
      '<span class="spacer"></span>' +
      '<button class="cmd cmd-sm atl-play" id="atlPlay" title="Toca a montagem inteira">▶</button>' +
      '<span class="micro">ZOOM</span>' +
      '<input type="range" id="atlZoom" min="14" max="220" step="1" value="60" style="width:96px">' +
      '</div>' +

      '<div class="atl-corpo">' +
      '<div class="atl-heads" id="atlHeads"></div>' +
      '<div class="atl-rolo" id="atlRolo">' +
      '<div class="atl-regua" id="atlRegua"></div>' +
      '<div class="atl-lanes" id="atlLanes"></div>' +
      '<div class="atl-cursor" id="atlCursor"></div>' +
      '</div>' +
      '</div>' +

      '<div class="atl-nota micro">arraste para mover · arraste a borda direita para aparar · ' +
      '<b>botão direito</b> abre o menu do trecho</div>' +
      '</div>' +

      '<div class="modal-f">' +
      '<span class="micro" id="atlTotal">—</span>' +
      '<span class="spacer"></span>' +
      '<button class="cmd cmd-sm" id="atlWav">EXPORTAR WAV</button>' +
      '<button class="cmd cmd-solid" id="atlTl">MANDAR A MONTAGEM PRA TIMELINE</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(d);
    ligar();
  }

  function ligar() {
    el('atlFechar').addEventListener('click', M.fechar);
    el('atlPor').addEventListener('click', function () {
      var b = VE.audio && VE.audio.buffer && VE.audio.buffer();
      if (!b) { VE.app.toast('carregue um áudio na mesa primeiro', 'err'); return; }
      M.por(b, (VE.audio.name() || 'ÁUDIO').toUpperCase());
      pintar();
      VE.app.toast('trecho posto na montagem — arraste para onde quiser', 'ok');
    });
    el('atlPista').addEventListener('click', function () { novaPista(); pintar(); });
    el('atlPlay').addEventListener('click', function () { M.tocar(); });
    el('atlZoom').addEventListener('input', function () { zoom = +this.value; pintar(); });
    el('atlWav').addEventListener('click', function () {
      M.mixar().then(function (mix) {
        if (!mix) { VE.app.toast('não há nada montado'); return; }
        VE.saveFile('rgb_lab-montagem.wav', VE.audio.encodeWav(mix));
      });
    });
    el('atlTl').addEventListener('click', function () { M.paraTimeline(); });
  }

  /* ---------------- desenho ---------------- */
  function pintar() {
    if (!el('atlModal')) return;
    var dur = Math.max(4, M.duracao() + 2);

    /* régua: uma marca por segundo, com o número a cada cinco */
    var passo = zoom < 26 ? 5 : (zoom < 70 ? 2 : 1);
    var h = '';
    for (var s = 0; s <= dur; s += passo) {
      h += '<i style="left:' + (s * zoom) + 'px"><b>' + s + 's</b></i>';
    }
    el('atlRegua').innerHTML = h;
    el('atlRegua').style.width = (dur * zoom) + 'px';

    /* cabeçalhos */
    el('atlHeads').innerHTML = pistas.map(function (p) {
      return '<div class="atl-head" data-p="' + p.id + '">' +
        '<span class="atl-nm">' + esc(p.nome) + '</span>' +
        '<button class="atl-mudo' + (p.mudo ? ' on' : '') + '" data-mudo="' + p.id + '" title="Mudo">M</button>' +
        '</div>';
    }).join('') || '<div class="atl-vazio micro">sem pistas</div>';

    /* pistas e trechos. `--z` é o passo da grade de fundo: sem ele as
       listras ficavam num passo fixo e desencontravam da régua a cada
       mudança de zoom — duas grades dizendo tempos diferentes. */
    el('atlLanes').style.setProperty('--z', (passo * zoom) + 'px');
    el('atlLanes').style.width = (dur * zoom) + 'px';
    el('atlLanes').innerHTML = pistas.map(function (p) {
      return '<div class="atl-lane' + (p.mudo ? ' mudo' : '') + '" data-p="' + p.id + '">' +
        p.clipes.map(function (c) {
          return '<div class="atl-clipe' + (escolhido === c.uid ? ' on' : '') + '" data-c="' + c.uid + '"' +
            ' style="left:' + (c.start * zoom) + 'px;width:' + Math.max(6, c.dur * zoom) + 'px"' +
            ' title="' + esc(c.nome) + ' · ' + c.dur.toFixed(2) + 's">' +
            '<span class="atl-cnm">' + esc(c.nome) + '</span>' +
            '<i class="atl-apara" data-apara="' + c.uid + '"></i>' +
            '</div>';
        }).join('') + '</div>';
    }).join('');

    var t = M.duracao();
    el('atlTotal').textContent = t > 0
      ? (pistas.reduce(function (a, p) { return a + p.clipes.length; }, 0) + ' TRECHO(S) · ' + t.toFixed(2) + ' s')
      : 'MONTAGEM VAZIA';

    ligarClipes();
  }
  M.pintar = pintar;

  function ligarClipes() {
    el('atlHeads').querySelectorAll('[data-mudo]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = pistas.filter(function (x) { return x.id === b.dataset.mudo; })[0];
        if (p) { p.mudo = p.mudo ? 0 : 1; pintar(); }
      });
    });

    var lanes = el('atlLanes');
    lanes.querySelectorAll('[data-c]').forEach(function (elc) {
      var uid = elc.dataset.c;

      elc.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        escolhido = uid;
        var f = acharClipe(uid);
        if (!f) return;
        var aparando = e.target.classList.contains('atl-apara');
        var x0 = e.clientX, s0 = f.c.start, d0 = f.c.dur;
        var laneY = e.clientY;
        try { elc.setPointerCapture(e.pointerId); } catch (err) { }

        var mover = function (ev) {
          var dx = (ev.clientX - x0) / zoom;
          if (aparando) {
            /* aparar pela direita: nunca além do que o buffer tem */
            var maxDur = f.c.buf ? (f.c.buf.duration - f.c.entrada) : d0;
            f.c.dur = Math.max(0.05, Math.min(d0 + dx, maxDur));
          } else {
            f.c.start = Math.max(0, s0 + dx);
            /* trocar de pista: arrastar para cima ou para baixo */
            var dy = ev.clientY - laneY;
            var passos = Math.round(dy / 46);
            if (passos !== 0) {
              var i = pistas.indexOf(f.p);
              var alvo = pistas[Math.max(0, Math.min(pistas.length - 1, i + passos))];
              if (alvo && alvo !== f.p) {
                f.p.clipes.splice(f.p.clipes.indexOf(f.c), 1);
                alvo.clipes.push(f.c);
                f.p = alvo; laneY = ev.clientY;
              }
            }
          }
          pintar();
        };
        var soltar = function () {
          window.removeEventListener('pointermove', mover);
          window.removeEventListener('pointerup', soltar);
        };
        window.addEventListener('pointermove', mover);
        window.addEventListener('pointerup', soltar);
      });

      elc.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        escolhido = uid;
        menuDoClipe(uid, e.clientX, e.clientY);
      });
    });
  }

  /* ---------------- menu do trecho ---------------- */
  function menu(itens, x, y) {
    var velho = el('atlMenu');
    if (velho) velho.remove();
    var d = document.createElement('div');
    d.id = 'atlMenu';
    d.className = 'ctxmenu';
    d.innerHTML = itens.map(function (it) {
      if (it === '-') return '<div class="ctxsep"></div>';
      return '<button' + (it.disabled ? ' disabled' : '') + '>' + esc(it.label) +
        (it.hint ? '<i>' + esc(it.hint) + '</i>' : '') + '</button>';
    }).join('');
    document.body.appendChild(d);
    d.style.left = Math.min(x, innerWidth - d.offsetWidth - 8) + 'px';
    d.style.top = Math.min(y, innerHeight - d.offsetHeight - 8) + 'px';
    var bs = d.querySelectorAll('button'), n = 0;
    itens.forEach(function (it) {
      if (it === '-') return;
      var b = bs[n++];
      if (it.disabled) return;
      b.addEventListener('click', function () { d.remove(); it.fn(); });
    });
    setTimeout(function () {
      document.addEventListener('pointerdown', function fecha() {
        d.remove(); document.removeEventListener('pointerdown', fecha);
      });
    }, 0);
  }

  function menuDoClipe(uid, x, y) {
    var f = acharClipe(uid);
    if (!f) return;

    /* AS PISTAS DE ÁUDIO DO LAB 01, uma entrada por pista.
       Não há tipo de pista "voz" no laboratório de vídeo — há VÍDEO,
       ÁUDIO e EFEITOS. Então o destino é uma pista de ÁUDIO, escolhida
       pelo nome, e é o Bruno quem decide qual delas é a da voz. */
    var itens = [
      { label: 'Cortar aqui', hint: 'no meio', fn: function () { if (M.cortar(uid, f.c.start + f.c.dur / 2)) pintar(); } },
      { label: 'Duplicar', fn: function () { M.duplicar(uid); pintar(); } },
      '-'
    ];

    var alvos = VE.project ? VE.tracksOfClass('audio') : [];
    if (!alvos.length) {
      itens.push({
        label: 'Mandar pra uma pista de áudio do LAB 01',
        hint: 'cria a composição', fn: function () { paraPista(uid, null); }
      });
    } else {
      alvos.forEach(function (tr, i) {
        itens.push({
          label: 'Mandar pra ' + (tr.name || ('ÁUDIO ' + (i + 1))) + ' — LAB 01',
          hint: tr.clips.length + ' clipe(s)',
          fn: function () { paraPista(uid, tr); }
        });
      });
    }

    itens.push('-');
    itens.push({ label: 'Apagar', hint: 'Del', fn: function () { M.apagar(uid); pintar(); } });
    menu(itens, x, y);
  }

  /* ---------------- saídas ---------------- */

  /* Um TRECHO para uma pista de áudio do LAB 01. O trecho é recortado do
     buffer (respeitando `entrada` e `dur`) antes de virar wav: mandar o
     buffer inteiro e deixar o corte para lá seria mandar coisa que o
     Bruno já tinha decidido não usar. */
  function recortar(c) {
    var sr = c.buf.sampleRate;
    var n = Math.max(1, Math.floor(c.dur * sr));
    var i0 = Math.floor(c.entrada * sr);
    var oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      c.buf.numberOfChannels, n, sr);
    var saida = oc.createBuffer(c.buf.numberOfChannels, n, sr);
    for (var ch = 0; ch < c.buf.numberOfChannels; ch++) {
      var src = c.buf.getChannelData(ch), dst = saida.getChannelData(ch);
      for (var i = 0; i < n; i++) dst[i] = src[i0 + i] || 0;
    }
    return saida;
  }

  function paraPista(uid, tr) {
    var f = acharClipe(uid);
    if (!f) return;
    var b = recortar(f.c);
    var blob = VE.audio.encodeWav(b);
    VE.media.loadAudioBlob(blob, f.c.nome.replace(/\.[^.]+$/, '') + '.wav').then(function (id) {
      if (!VE.project) VE.app.ensureProject(1920, 1080, b.duration);
      var alvo = tr || VE.tracksOfClass('audio')[0];
      var clipe = VE.newClipObj({
        kind: 'audio', name: f.c.nome, src: id,
        start: f.c.start, dur: Math.min(b.duration, VE.MAXDUR),
        in: 0, srcDur: b.duration
      });
      if (alvo) VE.insertClip(clipe, alvo); else VE.appendClip(clipe);
      VE.select([clipe.id]);
      VE.pushHistory(); VE.emit('project');
      VE.app.toast('trecho na pista ' + ((alvo && alvo.name) || 'de áudio') + ' do LAB 01 · ' +
        b.duration.toFixed(2) + 's', 'ok');
    });
  }

  M.paraTimeline = function () {
    M.mixar().then(function (mix) {
      if (!mix) { VE.app.toast('não há nada montado'); return; }
      var blob = VE.audio.encodeWav(mix);
      VE.media.loadAudioBlob(blob, 'montagem.wav').then(function (id) {
        if (!VE.project) VE.app.ensureProject(1920, 1080, mix.duration);
        VE.addMedia({ kind: 'audio', name: 'MONTAGEM', src: id, dur: Math.min(mix.duration, VE.MAXDUR) });
        VE.pushHistory(); VE.emit('project');
        VE.app.toast('montagem inteira na linha do tempo — ' + mix.duration.toFixed(2) + 's', 'ok');
      });
    });
  };

  /* ---------------- abrir e fechar ---------------- */
  M.abrir = function () {
    montarJanela();
    if (!pistas.length) { novaPista('VOZ'); novaPista('TRILHA'); }
    el('atlModal').classList.remove('hidden');
    pintar();
  };
  M.fechar = function () {
    M.parar();
    var m = el('atlModal');
    if (m) m.classList.add('hidden');
  };

})(window.VE);
