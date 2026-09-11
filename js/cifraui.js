/* ============================================================
   rgb_lab — A CIFRA · o aparelho
   ------------------------------------------------------------
   Um instrumento claro num palco escuro, como o polaroid. Aqui o
   corpo é de marfim porque teclado é de marfim, e porque a coisa
   toda se opera com os dedos em cima dela: pastilha que afunda,
   tecla que baixa, mostrador que conta.

   O QUE SE APERTA
     as PASTILHAS ...... um acorde inteiro do campo harmônico
     as TECLAS ......... a nota solta, com rato ou com o teclado
                         do computador (a w s e d f t g y h u j k)
     1 a 7 ............. atalho para as pastilhas
     LEGATO ............ a pastilha fica presa até a próxima, em
                         vez de soar só enquanto o dedo está nela
     ● .................. grava o que for tocado a partir da
                         PRIMEIRA nota — não do clique

   A GRAVAÇÃO COMEÇA NA PRIMEIRA NOTA, e não ao armar. Contar
   desde o clique enche o começo da peça de silêncio, e depois é
   preciso aparar isso na linha do tempo. Armar é dizer "guarde o
   que eu tocar"; o relógio zera quando a música começa.

   A MESMA NOTA DO SONÓGRAFO (`{t, dur, nota, vel, canal}`), e por
   isso o `.mid` e a renderização saem do núcleo sem adaptação
   nenhuma. Dois instrumentos, um formato, uma síntese.
   ============================================================ */
(function (VE) {
  'use strict';

  var U = VE.cifraui = {};
  var C = null, MU = null;
  var est = null;
  var fx = { mestre: null };
  var vivas = {};          /* tecla/pastilha → punhos das vozes que soam */
  var gravadas = {};       /* tecla/pastilha → notas abertas na gravação */
  var padPreso = null;     /* legato: qual pastilha ficou presa */
  var laco = null;
  var relogioLigado = false;

  function el(id) { return document.getElementById(id); }
  function relog(t) {
    t = Math.max(0, t || 0);
    var m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t % 1) * 100);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + (c < 10 ? '0' : '') + c;
  }

  /* teclas do computador para semitons, na disposição de tracker:
     a fileira de baixo são as brancas, a de cima as pretas       */
  var TECLAS = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
                 k: 12, o: 13, l: 14, p: 15, ç: 16, ';': 16 };
  var OITAVAS_VISIVEIS = 2;

  /* ══════════════════════════════ ABRIR / FECHAR ═══════════════ */
  U.abrir = function () {
    C = VE.cifra; MU = VE.musica;
    if (!C || !MU) { VE.app.toast('o motor da cifra não carregou', 'err'); return; }
    if (!est) est = C.novoEstado();
    montar();
    el('cfPalco').classList.remove('hidden');
    pintarTudo();
    ligarLaco();
  };

  U.fechar = function () {
    soltarTudo();
    var p = el('cfPalco');
    if (p) p.classList.add('hidden');
    pararLaco();
  };

  function ligarLaco() {
    if (laco) return;
    var passo = function () { laco = requestAnimationFrame(passo); quadro(); };
    laco = requestAnimationFrame(passo);
  }
  function pararLaco() { if (laco) cancelAnimationFrame(laco); laco = null; }

  function ctx() { return VE.audio.context(); }
  function mestre() {
    if (fx.mestre) return fx.mestre;
    var c = ctx();
    var g = c.createGain();
    g.gain.value = .85;
    g.connect(c.destination);
    fx.mestre = g;
    return g;
  }

  /* ══════════════════════════════ TOCAR ════════════════════════ */
  function agora() { return ctx().currentTime; }

  /* O relógio da gravação nasce na primeira nota. `relogioLigado`
     é o que separa "armado" de "correndo".                       */
  function marcarInicio() {
    if (!est.gravando || relogioLigado) return;
    est.t0 = agora();
    relogioLigado = true;
  }

  function soar(chave, notas, vel) {
    if (vivas[chave]) return;
    var c = ctx(), t = c.currentTime;
    marcarInicio();
    var punhos = [], regs = [];
    notas.forEach(function (n) {
      try { punhos.push(MU.tocar(c, mestre(), est.vozId, n, t, null, vel)); } catch (e) { }
      if (est.gravando && relogioLigado) regs.push(C.abrir(est, n, vel, t));
    });
    vivas[chave] = punhos;
    gravadas[chave] = regs;
  }

  function calar(chave) {
    var p = vivas[chave];
    if (!p) return;
    var t = agora();
    p.forEach(function (h) { if (h && h.soltar) { try { h.soltar(t); } catch (e) { } } });
    delete vivas[chave];
    (gravadas[chave] || []).forEach(function (n) { C.fechar(est, n, t); });
    delete gravadas[chave];
  }

  function soltarTudo() {
    for (var k in vivas) calar(k);
    padPreso = null;
  }

  /* ══════════════════════════════ PASTILHAS ════════════════════ */
  function apertarPad(i) {
    var campo = C.campo(est);
    var a = campo[i];
    if (!a) return;
    if (est.legato) {
      /* preso: a pastilha só se cala quando outra chega — é o que
         permite trocar de acorde com uma mão só                  */
      if (padPreso === 'pad' + i) { calar('pad' + i); padPreso = null; pintarPads(); return; }
      soltarTudo();
      soar('pad' + i, a.notas, est.vel);
      padPreso = 'pad' + i;
    } else {
      soar('pad' + i, a.notas, est.vel);
    }
    pintarPads();
    pintarTeclado();
  }
  function soltarPad(i) {
    if (est.legato) return;
    calar('pad' + i);
    pintarPads();
    pintarTeclado();
  }

  /* ══════════════════════════════ O QUADRO ═════════════════════ */
  function quadro() {
    if (!est) return;
    var m = el('cfTempo');
    if (m) {
      var t = relogioLigado ? agora() - est.t0 : 0;
      m.textContent = relog(est.gravando ? t : est.dur);
    }
    var q = el('cfQtd');
    if (q) q.textContent = String(est.notas.length).padStart(4, '0');
  }

  /* ══════════════════════════════ A MÁQUINA ════════════════════ */
  function opt(lista, sel, valor, nome) {
    return lista.map(function (o, i) {
      var v = valor ? valor(o, i) : i;
      var n = nome ? nome(o, i) : o;
      return '<option value="' + v + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + n + '</option>';
    }).join('');
  }
  function grupo(id, itens, rotulo) {
    return '<div class="cf-grupo"><label>' + rotulo + '</label><div class="cf-seg" id="' + id + '">' +
      itens.map(function (r, i) {
        return '<button class="cf-seg-b" data-i="' + i + '">' + r + '</button>';
      }).join('') + '</div></div>';
  }

  function montar() {
    if (el('cfPalco')) return;
    var d = document.createElement('div');
    d.className = 'cf-palco hidden';
    d.id = 'cfPalco';
    d.innerHTML =
      '<button class="cf-sair" id="cfSair" title="Fechar (Esc)">' +
        '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +

      '<div class="cf-maq" id="cfMaq">' +

      '<div class="cf-topo">' +
        '<div class="cf-marca"><span class="cf-nome">cifra</span><span class="cf-pro">rgb_lab</span></div>' +
        '<div class="cf-campos">' +
          '<div class="cf-campo"><label>TOM</label><select class="cf-sel" id="cfTom"></select></div>' +
          '<div class="cf-campo cf-campo-w"><label>ESCALA</label><select class="cf-sel" id="cfEscala"></select></div>' +
          '<div class="cf-campo"><label>OITAVA</label>' +
            '<div class="cf-oit"><button class="cf-mini" id="cfOitMenos">–</button>' +
            '<span id="cfOitVal">4</span>' +
            '<button class="cf-mini" id="cfOitMais">+</button></div></div>' +
          '<div class="cf-campo"><label>LEGATO</label>' +
            '<button class="cf-chave" id="cfLegato"><i></i></button></div>' +
          '<div class="cf-campo cf-campo-w"><label>INSTRUMENTO</label><select class="cf-sel" id="cfVoz"></select></div>' +
        '</div>' +
      '</div>' +

      '<div class="cf-pads" id="cfPads"></div>' +

      '<div class="cf-linha2">' +
        grupo('cfTipo', ['tri', '7', '9', '11', '13'], 'TIPO') +
        grupo('cfInv', ['root', '1ª', '2ª', '3ª'], 'INVERSÃO') +
        grupo('cfSec', ['–', '/V', '/IV', '/vii'], 'SECUNDÁRIA') +
      '</div>' +

      '<div class="cf-baixo">' +
        '<section class="cf-grav">' +
          '<div class="cf-grav-h">GRAVAÇÃO</div>' +
          '<div class="cf-grav-mostra">' +
            '<div class="cf-med"><label>TEMPO</label><b id="cfTempo">00:00.00</b></div>' +
            '<div class="cf-med"><label>NOTAS</label><b id="cfQtd">0000</b></div>' +
          '</div>' +
          '<div class="cf-grav-bts">' +
            '<button class="cf-bt cf-rec" id="cfRec" title="Grava o que for tocado, a partir da primeira nota">' +
              '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg><span>GRAVAR</span></button>' +
            '<button class="cf-bt" id="cfLimpar">LIMPAR</button>' +
          '</div>' +
          '<div class="cf-grav-bts">' +
            '<button class="cf-bt" id="cfMidi">MIDI</button>' +
            '<button class="cf-bt" id="cfWav">WAV</button>' +
          '</div>' +
          '<button class="cf-bt cf-bt-solido" id="cfRack" title="Manda o áudio para a FONTE do laboratório de áudio, para passar pela cadeia de efeitos">MANDAR PRO RACK ↗</button>' +
          '<button class="cf-bt cf-bt-solido" id="cfUsar" title="Vira um clipe de áudio na linha do tempo">USAR NA COMPOSIÇÃO</button>' +
          '<div class="cf-dica">as pastilhas são o campo harmônico do tom escolhido. ' +
          'atalhos: <b>1–7</b> nas pastilhas, <b>a w s e d f t g y h u j</b> no teclado.</div>' +
        '</section>' +
        '<section class="cf-tecl" id="cfTecl"></section>' +
      '</div>' +

      '</div>';
    document.body.appendChild(d);
    ligar();
  }

  /* ══════════════════════════════ PINTURA ══════════════════════ */
  function pintarTudo() {
    if (!el('cfPalco')) return;
    var s = el('cfTom');
    if (!s.options.length) {
      s.innerHTML = opt(MU.NOMES, est.tom, function (o, i) { return i; }, function (o) { return o; });
      el('cfEscala').innerHTML = opt(MU.ESCALAS, est.escala,
        function (o) { return o.id; }, function (o) { return o.nome; });
      el('cfVoz').innerHTML = opt(MU.VOZES, est.vozId,
        function (o) { return o.id; }, function (o) { return o.nome; });
    }
    el('cfOitVal').textContent = est.oitava;
    el('cfLegato').classList.toggle('on', est.legato);
    el('cfRec').classList.toggle('on', est.gravando);
    seg('cfTipo', est.tipo);
    seg('cfInv', est.inversao);
    seg('cfSec', est.secundaria);
    pintarPads();
    montarTeclado();
    pintarTeclado();
  }
  function seg(id, i) {
    var n = el(id);
    if (!n) return;
    Array.prototype.forEach.call(n.children, function (b, k) { b.classList.toggle('on', k === i); });
  }

  function pintarPads() {
    var box = el('cfPads');
    if (!box) return;
    var campo = C.campo(est);
    /* a grade lê o COMPRIMENTO do campo: sete numa escala de sete,
       cinco numa pentatônica. Nada de sete caixas fixas com duas
       vazias no fim.                                             */
    box.style.gridTemplateColumns = 'repeat(' + campo.length + ', minmax(0,1fr))';
    if (box.children.length !== campo.length) {
      box.innerHTML = campo.map(function (a, i) {
        return '<button class="cf-pad" data-i="' + i + '">' +
          '<span class="cf-pad-grau"></span><span class="cf-pad-nome"></span></button>';
      }).join('');
      ligarPads();
    }
    campo.forEach(function (a, i) {
      var b = box.children[i];
      if (!b) return;
      b.querySelector('.cf-pad-grau').textContent = a.numero + '/' + a.romano;
      b.querySelector('.cf-pad-nome').textContent = a.nome;
      b.classList.toggle('tocando', !!vivas['pad' + i]);
      b.classList.toggle('preso', padPreso === 'pad' + i);
    });
  }

  /* ── o teclado ─────────────────────────────────────────────────
     Duas oitavas a partir da oitava escolhida. As brancas são a
     régua; as pretas ficam POR CIMA, posicionadas em fração da
     largura da branca — é assim que um teclado é, e evita a grade
     de doze colunas iguais, que sai torta.                      */
  var BRANCAS = [0, 2, 4, 5, 7, 9, 11];
  var PRETAS = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };  /* semitom → índice da branca à esquerda */
  function montarTeclado() {
    var box = el('cfTecl');
    if (!box) return;
    var base = (est.oitava + 1) * 12;
    var nb = BRANCAS.length * OITAVAS_VISIVEIS;
    if (box.dataset.base === String(base)) return;
    box.dataset.base = String(base);
    var brancas = '', pretas = '';
    for (var o = 0; o < OITAVAS_VISIVEIS; o++) {
      for (var i = 0; i < BRANCAS.length; i++) {
        var n = base + o * 12 + BRANCAS[i];
        brancas += '<button class="cf-tb" data-n="' + n + '" style="width:' + (100 / nb) + '%"></button>';
      }
      for (var k in PRETAS) {
        var np = base + o * 12 + (+k);
        var esq = (o * BRANCAS.length + PRETAS[k] + 1) * (100 / nb);
        pretas += '<button class="cf-tp" data-n="' + np + '" style="left:calc(' + esq + '% - ' + (100 / nb / 3.2) + '%)' +
          ';width:' + (100 / nb / 1.6) + '%"></button>';
      }
    }
    box.innerHTML = '<div class="cf-tecl-cx">' + brancas + pretas + '</div>';
    ligarTeclas();
  }

  function pintarTeclado() {
    var box = el('cfTecl');
    if (!box) return;
    var g = MU.escalaDe(est.escala).g;
    var naEscala = {};
    g.forEach(function (x) { naEscala[(est.tom + x) % 12] = 1; });
    var soando = {};
    for (var k in vivas) { }
    Object.keys(gravadas).forEach(function () { });
    /* quais notas soam agora: lidas das pastilhas/teclas vivas */
    var campo = C.campo(est);
    Object.keys(vivas).forEach(function (ch) {
      if (ch.indexOf('pad') === 0) {
        var a = campo[+ch.slice(3)];
        if (a) a.notas.forEach(function (n) { soando[n] = 1; });
      } else if (ch.indexOf('n') === 0) soando[+ch.slice(1)] = 1;
    });
    Array.prototype.forEach.call(box.querySelectorAll('[data-n]'), function (b) {
      var n = +b.dataset.n;
      b.classList.toggle('na-escala', !!naEscala[((n % 12) + 12) % 12]);
      b.classList.toggle('soando', !!soando[n]);
    });
  }

  /* ══════════════════════════════ LIGAR ════════════════════════ */
  function ligarPads() {
    Array.prototype.forEach.call(el('cfPads').children, function (b) {
      var i = +b.dataset.i;
      b.addEventListener('pointerdown', function (ev) {
        b.setPointerCapture(ev.pointerId); apertarPad(i); ev.preventDefault();
      });
      b.addEventListener('pointerup', function () { soltarPad(i); });
      b.addEventListener('pointercancel', function () { soltarPad(i); });
      b.addEventListener('pointerleave', function () { if (!est.legato) soltarPad(i); });
    });
  }

  function ligarTeclas() {
    Array.prototype.forEach.call(el('cfTecl').querySelectorAll('[data-n]'), function (b) {
      var n = +b.dataset.n;
      b.addEventListener('pointerdown', function (ev) {
        b.setPointerCapture(ev.pointerId);
        soar('n' + n, [n], est.vel); pintarTeclado(); ev.preventDefault();
      });
      var solta = function () { calar('n' + n); pintarTeclado(); };
      b.addEventListener('pointerup', solta);
      b.addEventListener('pointercancel', solta);
      b.addEventListener('pointerleave', solta);
    });
  }

  function ligar() {
    el('cfSair').addEventListener('click', U.fechar);
    el('cfPalco').addEventListener('pointerdown', function (ev) {
      if (ev.target === el('cfPalco')) U.fechar();
    });

    el('cfTom').addEventListener('change', function () { est.tom = this.value | 0; pintarTudo(); });
    el('cfEscala').addEventListener('change', function () { est.escala = this.value; pintarTudo(); });
    el('cfVoz').addEventListener('change', function () { est.vozId = this.value; });
    el('cfOitMenos').addEventListener('click', function () { mudarOitava(-1); });
    el('cfOitMais').addEventListener('click', function () { mudarOitava(1); });
    el('cfLegato').addEventListener('click', function () {
      est.legato = !est.legato;
      if (!est.legato) soltarTudo();
      pintarTudo();
    });

    ligarSeg('cfTipo', function (i) { est.tipo = i; });
    ligarSeg('cfInv', function (i) { est.inversao = i; });
    ligarSeg('cfSec', function (i) { est.secundaria = i; });

    el('cfRec').addEventListener('click', function () {
      est.gravando = !est.gravando;
      if (est.gravando) { relogioLigado = false; }
      else { soltarTudo(); }
      pintarTudo();
    });
    el('cfLimpar').addEventListener('click', function () {
      C.limpar(est); relogioLigado = false;
      VE.app.toast('gravação apagada');
    });
    el('cfMidi').addEventListener('click', exportarMidi);
    el('cfWav').addEventListener('click', exportarWav);
    el('cfUsar').addEventListener('click', usarNaComposicao);
    el('cfRack').addEventListener('click', mandarProRack);

    document.addEventListener('keydown', function (ev) {
      var p = el('cfPalco');
      if (!p || p.classList.contains('hidden')) return;
      if (/INPUT|SELECT|TEXTAREA/.test((ev.target || {}).tagName || '')) return;
      if (ev.key === 'Escape') { U.fechar(); return; }
      if (ev.repeat) return;
      var k = ev.key.toLowerCase();
      if (k >= '1' && k <= '9') {
        var i = +k - 1;
        if (i < C.campo(est).length) { apertarPad(i); ev.preventDefault(); }
        return;
      }
      if (TECLAS[k] !== undefined) {
        var n = (est.oitava + 1) * 12 + TECLAS[k];
        soar('n' + n, [n], est.vel); pintarTeclado(); ev.preventDefault();
      }
    });
    document.addEventListener('keyup', function (ev) {
      var p = el('cfPalco');
      if (!p || p.classList.contains('hidden')) return;
      var k = ev.key.toLowerCase();
      if (k >= '1' && k <= '9') { soltarPad(+k - 1); return; }
      if (TECLAS[k] !== undefined) {
        var n = (est.oitava + 1) * 12 + TECLAS[k];
        calar('n' + n); pintarTeclado();
      }
    });
    /* sair da janela com tecla apertada deixava voz presa para sempre */
    window.addEventListener('blur', soltarTudo);
  }

  function ligarSeg(id, aplicar) {
    el(id).addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-i]');
      if (!b) return;
      aplicar(+b.dataset.i);
      soltarTudo();
      pintarTudo();
    });
  }

  function mudarOitava(d) {
    est.oitava = Math.max(0, Math.min(7, est.oitava + d));
    soltarTudo();
    pintarTudo();
  }

  /* ══════════════════════════════ SAÍDAS ═══════════════════════ */
  function semNotas() {
    if (est.notas.length) return false;
    VE.app.toast('não há nada gravado — aperte ● e toque as pastilhas', 'err');
    return true;
  }
  function carimbo() {
    return VE.BRAND.slug + '-cifra-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  function exportarMidi() {
    if (semNotas()) return;
    VE.saveFile(carimbo() + '.mid', C.midi(est));
    VE.app.toast(est.notas.length + ' notas em MIDI', 'ok');
  }
  function exportarWav() {
    if (semNotas()) return;
    VE.app.toast('renderizando…');
    C.render(est).then(function (buf) {
      VE.saveFile(carimbo() + '.wav', VE.audio.encodeWav(buf));
      VE.app.toast('áudio salvo', 'ok');
    }).catch(erro);
  }
  function usarNaComposicao() {
    if (semNotas()) return;
    VE.app.toast('renderizando…');
    C.render(est).then(function (buf) {
      var blob = VE.audio.encodeWav(buf);
      var nome = 'CIFRA · ' + MU.NOMES[est.tom] + ' ' + MU.escalaDe(est.escala).nome;
      return VE.media.loadAudioBlob(blob, nome.replace(/[^\w .·-]/g, '') + '.wav').then(function (id) {
        VE.addMedia({ kind: 'audio', name: nome, src: id, dur: Math.min(buf.duration, VE.MAXDUR) });
        VE.pushHistory();
        VE.emit('project');
        VE.app.toast('entrou na linha do tempo como clipe de áudio', 'ok');
      });
    }).catch(erro);
  }
  /* O RACK é o outro destino, e o mais direto para quem está no
     laboratório 02: em vez de virar clipe, a gravação vira a FONTE
     do rack e passa pela cadeia de efeitos que já estiver montada. */
  function mandarProRack() {
    if (semNotas()) return;
    VE.app.toast('renderizando…');
    C.render(est).then(function (buf) {
      var blob = VE.audio.encodeWav(buf);
      var nome = 'cifra-' + MU.NOMES[est.tom].toLowerCase() + '.wav';
      return VE.audio.loadFile(new File([blob], nome, { type: 'audio/wav' })).then(function () {
        VE.app.toast('carregado na FONTE do rack de áudio', 'ok');
        if (VE.shell.renderAudioInspector) VE.shell.renderAudioInspector();
      });
    }).catch(erro);
  }
  function erro(e) {
    VE.app.toast('não consegui: ' + (e && e.message ? e.message : e), 'err');
  }

})(window.VE);
