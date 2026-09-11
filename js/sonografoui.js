/* ============================================================
   rgb_lab — O SONÓGRAFO · o aparelho
   ------------------------------------------------------------
   NÃO É UMA CAIXA DE DIÁLOGO. É uma máquina num palco escuro, do
   mesmo jeito que o polaroid e a estação de digitalização: chassi
   de metal, cavidade de grafite, visor, e uma MESA DE CONTROLE
   embaixo onde cada coisa se opera — botão que afunda, knob que
   gira, transporte que se aperta.

   A LEITURA DA TELA, que é o ponto do aparelho inteiro
   O pedido insiste numa coisa: tem de ficar ÓBVIO que o objeto
   cruzou a linha e por isso nasceu a nota. Então três desenhos
   contam a mesma história ao mesmo tempo:
     · na linha, um traço curto acende na altura exata da célula
       que disparou;
     · no piano roll, a nota nasce embaixo desse traço, no
       instante do cruzamento;
     · e ela CRESCE enquanto o objeto ainda está passando.

   O VISOR É UM CANVAS SÓ, e isso é decisão, não economia. Um
   `<video>` com uma tela por cima obriga a manter duas caixas
   alinhadas, e qualquer erro de meio pixel entre elas faz a linha
   desenhada mentir sobre onde a leitura acontece. Com um canvas
   só, o que se vê e o que se mede saem da MESMA conta de
   enquadramento.

   O ÁUDIO AO VIVO usa o contexto do laboratório (`VE.audio.context`)
   e não um segundo — assim o volume, o destino e a suspensão por
   aba de fundo continuam sendo os do sistema.
   ============================================================ */
(function (VE) {
  'use strict';

  var U = VE.sonografoui = {};
  var L = null;                /* VE.sonografo, resolvido na abertura */
  var est = null;
  var laco = null;
  var vivos = {};              /* célula → punho da voz que ainda soa */
  var fx = { fonte: null, mestre: null };
  var arrasto = null;
  var relogio = 0;             /* modo imagem: o relógio da varredura */
  var tocando = false;
  var faisca = {};             /* célula → instante do último disparo */

  function el(id) { return document.getElementById(id); }
  function num(v, n) { return (Math.round(v * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n); }

  /* ------------------------------------------------------------------
     A COR DO DESENHO VEM DA FOLHA
     `--sg-cor` e `--sg-cor-cl` estão em css/sonografo.css e são as mesmas
     que pintam botão, knob e chapa. Lidas daqui, o traço da linha, a
     nota do rolo e a marca da régua não podem discordar do resto do
     aparelho — e trocar o canal de cor volta a ser uma linha só, num
     lugar só, em vez de nove literais espalhados por três funções. */
  var COR = { base: '91,134,255', cl: '#bcd0ff', viva: '#eef3ff' };
  function rgbDe(hex) {
    var h = String(hex).trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (h.length !== 6 || !isFinite(n)) return null;
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  /* O PALCO É PRETO EM QUALQUER TEMA, e o canal de vídeo não é.
     Medido no modo papel, onde `--ch-video` vale #1b4fd8: a nota mais
     forte do rolo saía com contraste 2,84 contra o fundo #0a0a0d, e a
     mais fraca com 1,34 — abaixo do 3,0 que um elemento gráfico
     precisa para ser visto. Metade do piano roll simplesmente sumia.
     No noturno e no 2.0 o mesmo azul passa folgado, e aí esta conta
     não mexe em nada: ela só age quando o tema entrega uma cor escura
     demais para o fundo desta janela.

     Levantar é MISTURAR COM O TOM CLARO, não multiplicar. Multiplicar
     estoura o canal azul em 255 primeiro e a cor escorrega para ciano;
     misturar sobe a luz mantendo o matiz do canal.                  */
  var FUNDO_ROLO = [10, 10, 13];
  function lumRel(r, g, b) {
    function f(x) { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b);
  }
  function contraste(r, g, b) {
    var a = lumRel(r, g, b), z = lumRel(FUNDO_ROLO[0], FUNDO_ROLO[1], FUNDO_ROLO[2]);
    return (Math.max(a, z) + .05) / (Math.min(a, z) + .05);
  }
  function levantar(base, claro) {
    var a = base.split(',').map(Number), c = claro.split(',').map(Number);
    for (var t = 0; t <= .601; t += .05) {
      var r = Math.round(a[0] + (c[0] - a[0]) * t);
      var g = Math.round(a[1] + (c[1] - a[1]) * t);
      var b = Math.round(a[2] + (c[2] - a[2]) * t);
      if (contraste(r, g, b) >= 3.6) return r + ',' + g + ',' + b;
    }
    return Math.round(a[0] + (c[0] - a[0]) * .6) + ',' +
           Math.round(a[1] + (c[1] - a[1]) * .6) + ',' +
           Math.round(a[2] + (c[2] - a[2]) * .6);
  }

  function lerCores() {
    var p = el('sgPalco');
    if (!p) return;
    var cs = getComputedStyle(p);
    var b = rgbDe(cs.getPropertyValue('--sg-cor'));
    var c = (cs.getPropertyValue('--sg-cor-cl') || '').trim();
    if (c) COR.cl = c;
    if (b) COR.base = levantar(b, rgbDe(COR.cl) || '188,208,255');
    COR.a = COR.base.split(',').map(Number);
    COR.c = (rgbDe(COR.cl) || '188,208,255').split(',').map(Number);
    CACHE_NOTA.length = 0;
  }

  /* A INTENSIDADE DA NOTA É BRILHO, NÃO TRANSPARÊNCIA. Desenhar a nota
     fraca com alfa baixo sobre o quase-preto do rolo levava-a a
     contraste 1,42 contra o fundo — medido. Nota que não se vê não
     informa "intensidade baixa": informa ausência, e o rolo passava a
     mentir sobre quantas notas existem.

     Agora toda nota é opaca e anda do PISO (o tom já levantado, que
     passa o 3,0) até o tom claro. A intensidade continua legível — a
     nota forte é visivelmente mais clara — só que a fraca continua lá.

     Dezesseis degraus memorizados, e não uma string por nota por
     quadro: com algumas centenas de notas na janela, montar a string
     de cor a cada uma é exatamente o tipo de churn que já custou caro
     neste laboratório.                                              */
  var CACHE_NOTA = [];
  function corNota(vel) {
    var i = Math.max(0, Math.min(15, Math.round((vel || 0) * 15)));
    if (CACHE_NOTA[i]) return CACHE_NOTA[i];
    var t = (i / 15) * .6, a = COR.a || [91, 134, 255], c = COR.c || [188, 208, 255];
    CACHE_NOTA[i] = 'rgb(' + Math.round(a[0] + (c[0] - a[0]) * t) + ',' +
                             Math.round(a[1] + (c[1] - a[1]) * t) + ',' +
                             Math.round(a[2] + (c[2] - a[2]) * t) + ')';
    return CACHE_NOTA[i];
  }
  function cor(a) { return 'rgba(' + COR.base + ',' + Math.max(0, Math.min(1, a)) + ')'; }
  function relog(t) {
    t = Math.max(0, t || 0);
    var m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t % 1) * 100);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + (c < 10 ? '0' : '') + c;
  }

  var ALCANCES = [
    { nome: 'C1 – C3', a: 24, b: 48 }, { nome: 'C1 – C5', a: 24, b: 72 },
    { nome: 'C2 – C5', a: 36, b: 72 }, { nome: 'C2 – C6', a: 36, b: 84 },
    { nome: 'C3 – C6', a: 48, b: 84 }, { nome: 'C0 – C7', a: 12, b: 96 }
  ];
  var TAXAS = [0.25, 0.5, 0.75, 1, 1.5, 2];

  /* ══════════════════════════════ ABRIR / FECHAR ═══════════════ */
  U.abrir = function () {
    L = VE.sonografo;
    if (!L) { VE.app.toast('o motor do sonógrafo não carregou', 'err'); return; }
    if (!est) est = L.novoEstado();
    montar();
    el('sgPalco').classList.remove('hidden');
    lerCores();
    if (!est.fonte) daLinhaDoTempo(true);
    pintarTudo();
    ligarLaco();
  };

  U.fechar = function () {
    parar();
    var p = el('sgPalco');
    if (p) p.classList.add('hidden');
    pararLaco();
  };

  function ligarLaco() {
    if (laco) return;
    var passo = function () {
      laco = requestAnimationFrame(passo);
      quadro();
    };
    laco = requestAnimationFrame(passo);
  }
  function pararLaco() { if (laco) cancelAnimationFrame(laco); laco = null; }

  /* ══════════════════════════════ A FONTE ══════════════════════
     Primeiro o clipe escolhido na linha do tempo — é o caminho que
     o laboratório já tem, e evita pedir de novo um arquivo que já
     está aberto. O elemento, porém, é NOSSO: reaproveitar o
     `<video>` da fonte faria o transporte daqui mexer na prévia do
     laboratório, e o sonógrafo precisa de laço e velocidade próprios. */
  function clipeAtual() {
    if (!VE.project || !VE.sources) return null;
    var c = VE.selected && VE.selected();
    if (!c || !c.src) return null;
    var s = VE.sources[c.src];
    if (!s || (s.kind !== 'video' && s.kind !== 'image')) return null;
    return s;
  }

  function daLinhaDoTempo(silencioso) {
    var s = clipeAtual();
    if (!s) {
      if (!silencioso) VE.app.toast('escolha um clipe de vídeo ou imagem na linha do tempo', 'err');
      return false;
    }
    usarUrl(s.url, s.name, s.kind);
    return true;
  }

  function usarUrl(url, nome, tipo) {
    parar();
    if (fx.fonte && fx.fonte.tagName === 'VIDEO') { try { fx.fonte.pause(); } catch (e) { } }
    if (tipo === 'image') {
      var img = new Image();
      img.onload = function () {
        est.fonte = { el: img, nome: nome, kind: 'image', w: img.naturalWidth, h: img.naturalHeight, dur: est.varreDur };
        fx.fonte = img; relogio = 0;
        L.limpar(est); pintarTudo();
      };
      img.onerror = function () { VE.app.toast('não consegui abrir a imagem', 'err'); };
      img.src = url;
      return;
    }
    var v = document.createElement('video');
    v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
    v.muted = !est.somDaFonte; v.src = url;
    v.addEventListener('loadedmetadata', function () {
      /* `VE.fixDuration` e não `v.duration`: webm gravado pelo próprio
         laboratório (a câmera, o mosaico) chega com duração infinita
         no metadado, e aí a régua divide por infinito, o cursor mora
         no zero e o relógio marca 00:00 o tempo todo. A casa já tem a
         correção — media.js usa a mesma em toda fonte de vídeo.   */
      var pronto = function (dur) {
        est.fonte = { el: v, nome: nome, kind: 'video', w: v.videoWidth, h: v.videoHeight, dur: dur };
        fx.fonte = v;
        L.limpar(est); pintarTudo();
      };
      if (VE.fixDuration) VE.fixDuration(v).then(pronto, function () { pronto(v.duration); });
      else pronto(v.duration);
    });
    v.addEventListener('error', function () { VE.app.toast('não consegui abrir o vídeo', 'err'); });
    v.load();
  }

  function pedirArquivo() {
    var i = document.createElement('input');
    i.type = 'file';
    i.accept = 'video/*,image/*';
    i.addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      usarUrl(URL.createObjectURL(f), f.name, /^image\//.test(f.type) ? 'image' : 'video');
    });
    i.click();
  }

  /* ══════════════════════════════ TRANSPORTE ═══════════════════ */
  function ctx() { return VE.audio.context(); }
  function mestre() {
    if (fx.mestre) return fx.mestre;
    var c = ctx();
    var g = c.createGain();
    g.gain.value = .9;
    g.connect(c.destination);
    fx.mestre = g;
    return g;
  }

  function tocar() {
    if (!est.fonte) { VE.app.toast('carregue um vídeo ou uma imagem primeiro'); return; }
    ctx();
    tocando = true;
    if (est.fonte.kind === 'video') {
      fx.fonte.playbackRate = est.taxa;
      fx.fonte.muted = !est.somDaFonte;
      var p = fx.fonte.play();
      if (p && p.catch) p.catch(function () { });
    }
    pintarTransporte();
  }
  function pausar() {
    tocando = false;
    if (est.fonte && est.fonte.kind === 'video') { try { fx.fonte.pause(); } catch (e) { } }
    soltarTudo();
    pintarTransporte();
  }
  function parar() {
    tocando = false;
    if (est.fonte && est.fonte.kind === 'video' && fx.fonte) {
      try { fx.fonte.pause(); fx.fonte.currentTime = 0; } catch (e) { }
    }
    relogio = 0;
    if (est) { L.fecharTodas(est, est.t); est.ultimoT = -1; }
    soltarTudo();
    pintarTransporte();
  }
  function soltarTudo() {
    var c = ctx();
    for (var k in vivos) if (vivos[k]) { try { vivos[k].soltar(c.currentTime); } catch (e) { } }
    vivos = {};
  }

  function tempoAgora() {
    if (!est.fonte) return 0;
    if (est.fonte.kind === 'image') return relogio;
    return fx.fonte ? fx.fonte.currentTime : 0;
  }
  function duracao() {
    if (!est.fonte) return 0;
    if (est.fonte.kind === 'image') return est.varreDur;
    /* a duração medida na abertura manda; o elemento é só a reserva */
    var d = est.fonte.dur;
    if (!isFinite(d) || d <= 0) d = fx.fonte ? fx.fonte.duration : 0;
    return isFinite(d) && d > 0 ? d : 0;
  }

  /* ══════════════════════════════ O QUADRO ═════════════════════ */
  var ultimoReal = 0;
  function quadro() {
    if (!est) return;
    var agora = performance.now() / 1000;
    var dtReal = ultimoReal ? Math.min(.25, agora - ultimoReal) : 0;
    ultimoReal = agora;

    /* MODO IMAGEM (§18): não há tempo no material, então a linha é
       que anda — e o resto do motor não muda uma linha por causa
       disso, porque ele lê a posição da linha, não o relógio.    */
    if (tocando && est.fonte && est.fonte.kind === 'image') {
      relogio += dtReal * est.taxa;
      if (relogio >= est.varreDur) {
        if (est.laco) { relogio = 0; L.fecharTodas(est, est.t); est.ultimoT = -1; }
        else { relogio = est.varreDur; pausar(); }
      }
      est.linha.pos = Math.max(0, Math.min(1, relogio / est.varreDur));
      var sl = el('sgPos'); if (sl) sl.value = String(Math.round(est.linha.pos * 1000));
      var lb = el('sgPosVal'); if (lb) lb.textContent = num(est.linha.pos * 100, 1) + ' %';
    }
    if (tocando && est.fonte && est.fonte.kind === 'video' && fx.fonte) {
      if (fx.fonte.ended) {
        if (est.laco) { try { fx.fonte.currentTime = 0; fx.fonte.play(); } catch (e) { } L.fecharTodas(est, est.t); est.ultimoT = -1; }
        else pausar();
      }
    }

    var t = tempoAgora();
    if (tocando) {
      var novas = L.passo(est, t);
      var c = ctx();
      for (var i = 0; i < novas.length; i++) {
        var n = novas[i];
        faisca[n.cel] = agora;
        try {
          vivos[n.cel] = L.tocar(c, mestre(), L.vozDoCanal(est, n.canal), n.nota, c.currentTime, null, n.vel);
        } catch (e) { }
      }
      /* a voz é solta quando a célula apaga — é isso que faz a nota
         durar exatamente o tempo da travessia                     */
      for (var k in vivos) {
        if (vivos[k] && !est.cel[k].viva) {
          try { vivos[k].soltar(c.currentTime); } catch (e) { }
          delete vivos[k];
        }
      }
    }
    desenharVisor(agora);
    desenharRoll(t);
    desenharRegua(t);
    var m = el('sgTempo');
    if (m) m.textContent = relog(t) + ' / ' + relog(duracao());
    var q = el('sgQtd');
    if (q) q.textContent = String(est.notas.length).padStart(4, '0');
  }

  /* ══════════════════════════════ O VISOR ══════════════════════ */
  function enq(W, H, cw, ch) {
    var k = Math.min(cw / W, ch / H);
    return { k: k, x: (cw - W * k) / 2, y: (ch - H * k) / 2, w: W * k, h: H * k };
  }
  U._enq = enq;

  function desenharVisor(agora) {
    var cv = el('sgTela');
    if (!cv) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cw = cv.clientWidth, ch = cv.clientHeight;
    if (!cw || !ch) return;
    if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#08080a';
    g.fillRect(0, 0, cw, ch);
    if (!est.fonte) return;
    var tam = L.tamanho(est);
    if (!tam.w || !tam.h) return;
    var e = enq(tam.w, tam.h, cw, ch);
    try { g.drawImage(est.fonte.el, e.x, e.y, e.w, e.h); } catch (err) { }

    var G = L.geometria(est, tam.w, tam.h);
    var d = { x: Math.cos(G.ang), y: Math.sin(G.ang) };
    var ax = e.x + (G.cx - d.x * G.comp / 2) * e.k, ay = e.y + (G.cy - d.y * G.comp / 2) * e.k;
    var bx = e.x + (G.cx + d.x * G.comp / 2) * e.k, by = e.y + (G.cy + d.y * G.comp / 2) * e.k;

    /* o halo primeiro, a linha depois: é o que dá a leitura de feixe
       sem precisar de filtro nenhum                                */
    g.save();
    g.lineCap = 'round';
    g.strokeStyle = cor(.16);
    g.lineWidth = 11;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    g.strokeStyle = cor(.42);
    g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    g.strokeStyle = COR.cl;
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();

    /* os dentes: um por célula, acesos conforme a atividade. É o
       desenho que mostra ONDE a linha está lendo alguma coisa.   */
    var nx = -d.y, ny = d.x, CEL = L.CEL;
    for (var i = 0; i < CEL; i++) {
      var c = est.cel[i];
      var q = Math.min(1, c.at * 3.2);
      var vivo = !!c.viva;
      var fs = faisca[i] ? Math.max(0, 1 - (agora - faisca[i]) * 3.2) : 0;
      if (q < .06 && !vivo && fs <= 0) continue;
      var px = ax + (bx - ax) * ((i + .5) / CEL), py = ay + (by - ay) * ((i + .5) / CEL);
      var comp = 5 + q * 12 + fs * 16;
      g.strokeStyle = vivo ? 'rgba(255,255,255,' + (.55 + fs * .45) + ')'
                           : cor(.24 + q * .5 + fs * .5);
      g.lineWidth = vivo ? 2.4 : 1.4;
      g.beginPath();
      g.moveTo(px - nx * comp, py - ny * comp);
      g.lineTo(px + nx * comp, py + ny * comp);
      g.stroke();
    }

    /* o alvo do centro: é por ele que se arrasta */
    var mx = e.x + G.cx * e.k, my = e.y + G.cy * e.k;
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(mx, my, 4.5, 0, 6.2832); g.fill();
    g.strokeStyle = cor(.62);
    g.lineWidth = 1;
    g.beginPath(); g.arc(mx, my, 9, 0, 6.2832); g.stroke();
    g.restore();
  }

  /* ══════════════════════════════ O PIANO ROLL ═════════════════
     Janela deslizante com a cabeça a 45 % — o que já passou fica à
     esquerda para se conferir, e sobra tempo à direita para ver a
     nota nascer. Desenhar a composição inteira encolhida faria a
     nota de meio segundo virar meio pixel.                       */
  var JANELA = 7;
  function desenharRoll(t) {
    var cv = el('sgRoll');
    if (!cv) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cw = cv.clientWidth, ch = cv.clientHeight;
    if (!cw || !ch) return;
    if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#0a0a0d';
    g.fillRect(0, 0, cw, ch);

    var TEC = 44;                       /* o teclado da esquerda */
    var lo = est.notaMin, hi = est.notaMax;
    var faixa = Math.max(1, hi - lo);
    var alt = ch / faixa;
    function yDe(n) { return ch - (n - lo) * alt - alt; }
    var cab = TEC + (cw - TEC) * .45;
    var esc = (cw - TEC) / JANELA;
    function xDe(tt) { return cab + (tt - t) * esc; }

    /* linhas das oitavas e faixa das teclas pretas */
    var PRETAS = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };
    for (var n = lo; n <= hi; n++) {
      var y = yDe(n);
      if (PRETAS[((n % 12) + 12) % 12]) {
        g.fillStyle = 'rgba(255,255,255,.022)';
        g.fillRect(TEC, y, cw - TEC, alt);
      }
      if (n % 12 === 0) {
        g.fillStyle = 'rgba(255,255,255,.10)';
        g.fillRect(TEC, y + alt, cw - TEC, 1);
      }
    }
    /* grade do compasso */
    var spb = 60 / est.bpm;
    var t0 = Math.floor((t - JANELA * .45) / spb) * spb;
    for (var tt = t0; tt < t + JANELA; tt += spb) {
      var x = xDe(tt);
      if (x < TEC) continue;
      var forte = Math.abs((tt / spb) % 4) < .01;
      g.fillStyle = forte ? 'rgba(255,255,255,.085)' : 'rgba(255,255,255,.035)';
      g.fillRect(Math.round(x), 0, 1, ch);
    }

    /* as notas */
    for (var i = 0; i < est.notas.length; i++) {
      var nt = est.notas[i];
      if (nt.t + nt.dur < t - JANELA * .5) continue;
      if (nt.t > t + JANELA * .6) break;
      var x0 = xDe(nt.t), x1 = xDe(nt.t + nt.dur);
      if (x1 < TEC) continue;
      var yy = yDe(nt.nota);
      var w = Math.max(3, x1 - x0), h = Math.max(2.5, alt - 1.6);
      var viva = nt.viva;
      g.fillStyle = viva ? COR.viva : corNota(nt.vel);
      arred(g, Math.max(TEC, x0), yy + .8, w, h, Math.min(2.5, h / 2));
      g.fill();
      if (viva) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1; g.stroke(); }
    }

    /* o teclado, por cima da grade e por baixo da cabeça */
    g.fillStyle = '#101014';
    g.fillRect(0, 0, TEC, ch);
    for (var n2 = lo; n2 <= hi; n2++) {
      var y2 = yDe(n2), pc = ((n2 % 12) + 12) % 12;
      g.fillStyle = PRETAS[pc] ? '#1a1a20' : '#d9d9de';
      g.fillRect(0, y2 + .5, PRETAS[pc] ? TEC * .62 : TEC - 6, Math.max(1, alt - 1));
      if (pc === 0 && alt > 6) {
        g.fillStyle = '#6d6d78';
        g.font = '8px "JetBrains Mono", monospace';
        g.fillText(L.nomeNota(n2), TEC - 22, y2 + alt - 1);
      }
    }
    g.fillStyle = 'rgba(255,255,255,.09)';
    g.fillRect(TEC - 1, 0, 1, ch);

    /* a cabeça de leitura: a MESMA cor da linha do visor, porque é
       literalmente o mesmo instante                                */
    g.fillStyle = cor(.30);
    g.fillRect(cab - 1.5, 0, 3, ch);
    g.fillStyle = COR.cl;
    g.fillRect(cab - .5, 0, 1.4, ch);
  }

  function arred(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }

  /* ══════════════════════════ A RÉGUA (fina, §11) ══════════════ */
  function desenharRegua(t) {
    var cv = el('sgRegua');
    if (!cv) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cw = cv.clientWidth, ch = cv.clientHeight;
    if (!cw || !ch) return;
    if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#0d0d11';
    g.fillRect(0, 0, cw, ch);
    var dur = duracao() || 1;
    /* onde há nota, a régua acende: é o mapa da composição inteira */
    g.fillStyle = cor(.62);
    for (var i = 0; i < est.notas.length; i++) {
      var x = (est.notas[i].t / dur) * cw;
      g.fillRect(x, ch * .30, 1, ch * .40);
    }
    g.fillStyle = 'rgba(255,255,255,.13)';
    for (var s = 0; s < dur; s += Math.max(1, Math.round(dur / 24))) {
      g.fillRect((s / dur) * cw, ch - 4, 1, 4);
    }
    var px = (t / dur) * cw;
    g.fillStyle = COR.cl;
    g.fillRect(px - .5, 0, 1.4, ch);
  }

  /* ══════════════════════════════ A MÁQUINA ════════════════════ */
  function opt(lista, sel, valor, nome) {
    return lista.map(function (o, i) {
      var v = valor ? valor(o, i) : i;
      var n = nome ? nome(o, i) : o;
      return '<option value="' + v + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + n + '</option>';
    }).join('');
  }

  function botOrient(i, titulo, svg) {
    return '<button class="sg-orient" data-orient="' + i + '" title="' + titulo + '">' + svg + '</button>';
  }

  function knobHtml(id, rot) {
    return '<div class="sg-knob" id="' + id + '" tabindex="0"' + (rot ? ' data-grande="1"' : '') + '>' +
      '<div class="sg-knob-corpo"><i class="sg-knob-marca"></i></div>' +
      '<svg class="sg-knob-arco" viewBox="0 0 100 100"><path class="sg-arco-tr" d="M18,82 A45,45 0 1,1 82,82"/>' +
      '<path class="sg-arco-on" d="M18,82 A45,45 0 1,1 82,82"/></svg></div>';
  }

  function montar() {
    if (el('sgPalco')) return;
    var d = document.createElement('div');
    d.className = 'sg-palco hidden';
    d.id = 'sgPalco';
    d.innerHTML =
      '<button class="sg-sair" id="sgSair" title="Fechar (Esc)">' +
        '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +

      '<div class="sg-maq" id="sgMaq">' +

      /* ─── a placa de cima ─── */
      '<div class="sg-placa">' +
        '<div class="sg-marca"><span class="sg-nome">rgb_lab <b>SONÓGRAFO</b></span>' +
        '<span class="sg-sub">music scanner · a linha lê, a imagem toca</span></div>' +
        '<div class="sg-mostra">' +
          '<div class="sg-med"><label>ANDAMENTO</label><div class="sg-med-v"><input id="sgBpm" type="number" min="40" max="240" step="1" value="120"><span>BPM</span></div></div>' +
          '<div class="sg-med"><label>TONALIDADE</label><div class="sg-med-v" id="sgTonal">A menor</div></div>' +
          '<div class="sg-med"><label>NOTAS</label><div class="sg-med-v mono" id="sgQtd">0000</div></div>' +
          '<div class="sg-med"><label>TEMPO</label><div class="sg-med-v mono" id="sgTempo">00:00.00 / 00:00.00</div></div>' +
        '</div>' +
        '<div class="sg-saidas">' +
          '<button class="sg-bt" id="sgFonte" title="Abrir um vídeo ou uma imagem do computador">FONTE…</button>' +
          '<button class="sg-bt" id="sgDoClipe" title="Usar o clipe escolhido na linha do tempo">DO CLIPE</button>' +
          '<button class="sg-bt sg-bt-perigo" id="sgLimpar" title="Apagar todas as notas geradas">LIMPAR</button>' +
          '<button class="sg-bt" id="sgMidi">MIDI</button>' +
          '<button class="sg-bt" id="sgWav">WAV</button>' +
          '<button class="sg-bt sg-bt-solido" id="sgUsar" title="Rende o áudio e põe como clipe na linha do tempo">USAR NA COMPOSIÇÃO</button>' +
        '</div>' +
      '</div>' +

      /* ─── o corpo: a cavidade à esquerda, a mesa de controle numa
             COLUNA à direita. Era tudo empilhado, e empilhado a mesa
             comia a altura toda: sobravam 170 px para o visor e um
             vídeo 4:3 entrava como uma tira. Aqui a altura inteira do
             aparelho é do vídeo. ─── */
      '<div class="sg-corpo">' +

      /* ─── a cavidade: visor, régua, piano roll ─── */
      '<div class="sg-cav">' +
        '<div class="sg-visor" id="sgVisor">' +
          '<canvas id="sgTela"></canvas>' +
          '<div class="sg-vazio" id="sgVazio"><b>SEM FONTE</b>' +
          '<span>arraste um vídeo aqui, ou aperte FONTE… — a linha fica parada e a imagem passa por ela</span></div>' +
          '<div class="sg-fonte-nome" id="sgFonteNome">—</div>' +
        '</div>' +
        '<canvas class="sg-regua" id="sgRegua"></canvas>' +
        '<canvas class="sg-roll" id="sgRoll"></canvas>' +
      '</div>' +

      /* ─── a mesa de controle ─── */
      '<div class="sg-mesa">' +

        '<section class="sg-posto">' +
          '<div class="sg-posto-h">VARREDURA</div>' +
          '<div class="sg-orients">' +
            botOrient(0, 'Vertical', '<svg viewBox="0 0 24 24"><path d="M12 3v18M12 3l-2.5 3M12 3l2.5 3"/></svg>') +
            botOrient(1, 'Horizontal', '<svg viewBox="0 0 24 24"><path d="M3 12h18M3 12l3-2.5M3 12l3 2.5"/></svg>') +
            botOrient(2, 'Diagonal ↗', '<svg viewBox="0 0 24 24"><path d="M5 19L19 5M19 5h-4M19 5v4"/></svg>') +
            botOrient(3, 'Diagonal ↘', '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 19h-4M19 19v-4"/></svg>') +
          '</div>' +
          '<div class="sg-lin"><label>POSIÇÃO</label><span class="sg-val" id="sgPosVal">50.0 %</span></div>' +
          '<div class="sg-passo">' +
            '<button class="sg-bt sg-bt-mini" id="sgPosMenos">←</button>' +
            '<input type="range" id="sgPos" min="0" max="1000" value="500">' +
            '<button class="sg-bt sg-bt-mini" id="sgPosMais">→</button>' +
          '</div>' +
          '<div class="sg-diag" id="sgDiag">' +
            '<div class="sg-lin"><label>ÂNGULO</label><span class="sg-val" id="sgAngVal">0°</span></div>' +
            '<input type="range" id="sgAng" min="-40" max="40" value="0">' +
            '<div class="sg-lin"><label>COMPRIMENTO</label><span class="sg-val" id="sgCompVal">100 %</span></div>' +
            '<input type="range" id="sgComp" min="30" max="140" value="100">' +
          '</div>' +
          '<div class="sg-img" id="sgImg">' +
            '<div class="sg-lin"><label>VARREDURA DA IMAGEM</label><span class="sg-val" id="sgVarreVal">8 s</span></div>' +
            '<input type="range" id="sgVarre" min="2" max="40" value="8">' +
            '<div class="sg-nota">na imagem parada é a LINHA que anda — a foto vira partitura da esquerda para a direita</div>' +
          '</div>' +
        '</section>' +

        '<section class="sg-nucleo">' +
          '<div class="sg-knobs">' +
            '<div class="sg-knob-cx sg-knob-cx-g">' + knobHtml('sgKSens', 1) +
              '<label>SENSIBILIDADE</label><span id="sgKSensV">60</span></div>' +
            '<div class="sg-knob-cx">' + knobHtml('sgKDens') +
              '<label>DENSIDADE</label><span id="sgKDensV">55</span></div>' +
            '<div class="sg-knob-cx">' + knobHtml('sgKSuav') +
              '<label>SUAVIZAÇÃO</label><span id="sgKSuavV">45</span></div>' +
          '</div>' +
          '<div class="sg-transp">' +
            '<button class="sg-tb" id="sgParar" title="Parar e rebobinar"><svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10"/></svg></button>' +
            '<button class="sg-tb sg-tb-g" id="sgTocar" title="Tocar / pausar"><svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg></button>' +
            '<button class="sg-tb sg-tb-rec on" id="sgRec" title="Gravar as notas (desligado: ouve mas não guarda)"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5.5"/></svg></button>' +
          '</div>' +
          '<div class="sg-transp2">' +
            '<button class="sg-bt sg-bt-mini" id="sgLaco">LAÇO</button>' +
            '<select class="sg-sel sg-sel-mini" id="sgTaxa"></select>' +
            '<button class="sg-bt sg-bt-mini" id="sgSomFonte">SOM DA FONTE</button>' +
          '</div>' +
        '</section>' +

        '<section class="sg-posto">' +
          '<div class="sg-posto-h">SENSORES</div>' +
          '<div class="sg-sens">' +
            '<button class="sg-sensor on" data-sensor="luz"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg><span>BRILHO</span></button>' +
            '<button class="sg-sensor" data-sensor="cor"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg><span>COR</span></button>' +
            '<button class="sg-sensor" data-sensor="mov"><svg viewBox="0 0 24 24"><path d="M3 9c3-4 6 4 9 0s6-4 9 0M3 15c3-4 6 4 9 0s6-4 9 0"/></svg><span>MOVIMENTO</span></button>' +
            '<button class="sg-sensor" data-sensor="borda"><svg viewBox="0 0 24 24"><path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/></svg><span>BORDA</span></button>' +
          '</div>' +
          '<div class="sg-posto-h sg-posto-h2">MAPEAMENTO</div>' +
          '<div class="sg-mapa">' +
            '<div class="sg-mrow"><label>Posição / brilho</label><select class="sg-sel" id="sgMPitch">' +
              '<option value="0">→ Altura pela posição</option><option value="1">→ Altura pelo brilho</option>' +
              '<option value="2">→ Altura pela cor</option><option value="3">→ Altura pelo movimento</option></select></div>' +
            '<div class="sg-mrow"><label>Duração</label><select class="sg-sel" id="sgMDur">' +
              '<option value="0">→ Tempo de travessia</option><option value="1">→ Largura do objeto</option>' +
              '<option value="2">→ Fixa (1/4)</option></select></div>' +
            '<div class="sg-mrow"><label>Intensidade</label><select class="sg-sel" id="sgMVel">' +
              '<option value="0">→ Brilho</option><option value="1">→ Contraste do evento</option>' +
              '<option value="2">→ Velocidade do movimento</option></select></div>' +
            '<div class="sg-mrow"><label>Instrumento</label><select class="sg-sel" id="sgMInst">' +
              '<option value="1">→ Fixo (o escolhido)</option><option value="0">→ O matiz decide (4 vozes)</option></select></div>' +
          '</div>' +
        '</section>' +
      '</div>' +
      '</div>' +

      /* ─── o rodapé musical ─── */
      '<div class="sg-rodape">' +
        '<div class="sg-campo"><label>ESCALA</label><select class="sg-sel" id="sgEscala"></select></div>' +
        '<div class="sg-campo"><label>TOM</label><select class="sg-sel" id="sgTom"></select></div>' +
        '<div class="sg-campo"><label>ALCANCE</label><select class="sg-sel" id="sgAlcance"></select></div>' +
        '<div class="sg-campo"><label>GRADE</label><select class="sg-sel" id="sgGrade"></select></div>' +
        '<div class="sg-campo"><label>INSTRUMENTO</label><select class="sg-sel" id="sgVoz"></select></div>' +
        '<div class="sg-campo sg-campo-w"><label>INTENSIDADE <i id="sgVelVal">80 %</i></label>' +
          '<input type="range" id="sgVel" min="10" max="100" value="80"></div>' +
      '</div>' +

      '</div>';
    document.body.appendChild(d);
    ligar();
  }

  /* ══════════════════════════════ OS KNOBS ═════════════════════
     Arrasta para cima sobe. O arco é um `stroke-dasharray` sobre um
     caminho fixo — nada de trigonometria por quadro, e o mesmo
     desenho serve para os três tamanhos.                          */
  var COMP_ARCO = 212;   /* comprimento do arco de 270° com r=45 */
  function ligarKnob(id, ler, escrever, saida, fmt) {
    var k = el(id);
    if (!k) return;
    var pegando = null;
    function pintar() {
      var v = Math.max(0, Math.min(1, ler()));
      var arco = k.querySelector('.sg-arco-on');
      if (arco) {
        arco.style.strokeDasharray = COMP_ARCO;
        arco.style.strokeDashoffset = String(COMP_ARCO * (1 - v));
      }
      var m = k.querySelector('.sg-knob-corpo');
      if (m) m.style.transform = 'rotate(' + (-135 + v * 270) + 'deg)';
      var s = el(saida);
      if (s) s.textContent = fmt ? fmt(v) : String(Math.round(v * 100));
    }
    k._pintar = pintar;
    k.addEventListener('pointerdown', function (ev) {
      pegando = { y: ev.clientY, v: ler() };
      k.setPointerCapture(ev.pointerId);
      k.classList.add('pegando');
      ev.preventDefault();
    });
    k.addEventListener('pointermove', function (ev) {
      if (!pegando) return;
      var dv = (pegando.y - ev.clientY) / 190;
      escrever(Math.max(0, Math.min(1, pegando.v + dv)));
      pintar();
    });
    function larga(ev) {
      if (!pegando) return;
      pegando = null;
      k.classList.remove('pegando');
      try { k.releasePointerCapture(ev.pointerId); } catch (e) { }
    }
    k.addEventListener('pointerup', larga);
    k.addEventListener('pointercancel', larga);
    k.addEventListener('keydown', function (ev) {
      var p = ev.key === 'ArrowUp' ? .02 : ev.key === 'ArrowDown' ? -.02 : 0;
      if (!p) return;
      escrever(Math.max(0, Math.min(1, ler() + p)));
      pintar();
      ev.preventDefault();
    });
    k.addEventListener('wheel', function (ev) {
      escrever(Math.max(0, Math.min(1, ler() + (ev.deltaY < 0 ? .03 : -.03))));
      pintar();
      ev.preventDefault();
    }, { passive: false });
    pintar();
  }

  /* ══════════════════════════════ LIGAR TUDO ═══════════════════ */
  function ligar() {
    el('sgSair').addEventListener('click', U.fechar);
    document.addEventListener('keydown', function (ev) {
      var p = el('sgPalco');
      if (!p || p.classList.contains('hidden')) return;
      if (ev.key === 'Escape') { U.fechar(); return; }
      if (ev.key === ' ' && !/INPUT|SELECT|TEXTAREA/.test((ev.target || {}).tagName || '')) {
        tocando ? pausar() : tocar();
        ev.preventDefault();
      }
    });

    el('sgFonte').addEventListener('click', pedirArquivo);
    el('sgDoClipe').addEventListener('click', function () { daLinhaDoTempo(false); });
    el('sgLimpar').addEventListener('click', function () {
      L.limpar(est); soltarTudo(); faisca = {};
      VE.app.toast('notas apagadas');
    });
    el('sgMidi').addEventListener('click', exportarMidi);
    el('sgWav').addEventListener('click', exportarWav);
    el('sgUsar').addEventListener('click', usarNaComposicao);

    /* largar arquivo no visor */
    var vis = el('sgVisor');
    vis.addEventListener('dragover', function (ev) { ev.preventDefault(); vis.classList.add('largando'); });
    vis.addEventListener('dragleave', function () { vis.classList.remove('largando'); });
    vis.addEventListener('drop', function (ev) {
      ev.preventDefault(); vis.classList.remove('largando');
      var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (f) usarUrl(URL.createObjectURL(f), f.name, /^image\//.test(f.type) ? 'image' : 'video');
    });

    /* arrastar a linha sobre o visor */
    var tela = el('sgTela');
    tela.addEventListener('pointerdown', function (ev) {
      if (!est.fonte) return;
      arrasto = true;
      tela.setPointerCapture(ev.pointerId);
      moverLinha(ev);
    });
    tela.addEventListener('pointermove', function (ev) { if (arrasto) moverLinha(ev); });
    var solta = function (ev) {
      if (!arrasto) return;
      arrasto = false;
      try { tela.releasePointerCapture(ev.pointerId); } catch (e) { }
    };
    tela.addEventListener('pointerup', solta);
    tela.addEventListener('pointercancel', solta);

    /* orientação */
    Array.prototype.forEach.call(document.querySelectorAll('#sgPalco .sg-orient'), function (b) {
      b.addEventListener('click', function () {
        est.linha.orient = parseInt(b.dataset.orient, 10);
        pintarTudo();
      });
    });

    /* posição */
    el('sgPos').addEventListener('input', function () {
      est.linha.pos = this.value / 1000;
      el('sgPosVal').textContent = num(est.linha.pos * 100, 1) + ' %';
    });
    el('sgPosMenos').addEventListener('click', function () { nudge(-.005); });
    el('sgPosMais').addEventListener('click', function () { nudge(.005); });
    el('sgAng').addEventListener('input', function () {
      est.linha.ang = this.value * Math.PI / 180;
      el('sgAngVal').textContent = this.value + '°';
    });
    el('sgComp').addEventListener('input', function () {
      est.linha.comp = this.value / 100;
      el('sgCompVal').textContent = this.value + ' %';
    });
    el('sgVarre').addEventListener('input', function () {
      est.varreDur = parseFloat(this.value);
      el('sgVarreVal').textContent = this.value + ' s';
    });

    /* transporte */
    el('sgTocar').addEventListener('click', function () { tocando ? pausar() : tocar(); });
    el('sgParar').addEventListener('click', parar);
    el('sgRec').addEventListener('click', function () {
      est.gravando = !est.gravando;
      pintarTransporte();
    });
    el('sgLaco').addEventListener('click', function () {
      est.laco = !est.laco;
      if (fx.fonte && est.fonte && est.fonte.kind === 'video') fx.fonte.loop = false;
      pintarTransporte();
    });
    el('sgSomFonte').addEventListener('click', function () {
      est.somDaFonte = !est.somDaFonte;
      if (fx.fonte && est.fonte && est.fonte.kind === 'video') fx.fonte.muted = !est.somDaFonte;
      pintarTransporte();
    });
    el('sgTaxa').addEventListener('change', function () {
      est.taxa = TAXAS[this.value | 0];
      if (fx.fonte && est.fonte && est.fonte.kind === 'video') fx.fonte.playbackRate = est.taxa;
    });

    /* sensores */
    Array.prototype.forEach.call(document.querySelectorAll('#sgPalco .sg-sensor'), function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.sensor;
        est.sensores[k] = !est.sensores[k];
        /* nunca todos desligados: sem sensor não há evento, e uma
           janela que não faz nada parece quebrada                */
        if (!est.sensores.luz && !est.sensores.cor && !est.sensores.mov && !est.sensores.borda) {
          est.sensores[k] = true;
          VE.app.toast('pelo menos um sensor precisa ficar ligado');
        }
        pintarSensores();
      });
    });

    /* mapeamento */
    el('sgMPitch').addEventListener('change', function () { est.mapa.pitch = this.value | 0; });
    el('sgMDur').addEventListener('change', function () { est.mapa.dur = this.value | 0; });
    el('sgMVel').addEventListener('change', function () { est.mapa.vel = this.value | 0; });
    el('sgMInst').addEventListener('change', function () { est.mapa.inst = this.value | 0; });

    /* rodapé */
    el('sgEscala').addEventListener('change', function () { est.escala = this.value; pintarTonal(); });
    el('sgTom').addEventListener('change', function () { est.tom = this.value | 0; pintarTonal(); });
    el('sgAlcance').addEventListener('change', function () {
      var a = ALCANCES[this.value | 0];
      est.notaMin = a.a; est.notaMax = a.b;
    });
    el('sgGrade').addEventListener('change', function () { est.grade = this.value | 0; });
    el('sgVoz').addEventListener('change', function () { est.vozId = this.value; });
    el('sgVel').addEventListener('input', function () {
      est.velBase = this.value / 100;
      el('sgVelVal').textContent = this.value + ' %';
    });
    el('sgBpm').addEventListener('change', function () {
      est.bpm = Math.max(40, Math.min(240, parseFloat(this.value) || 120));
      this.value = est.bpm;
    });

    ligarKnob('sgKSens', function () { return est.sens; }, function (v) { est.sens = v; }, 'sgKSensV');
    ligarKnob('sgKDens', function () { return est.densidade; }, function (v) { est.densidade = v; }, 'sgKDensV');
    ligarKnob('sgKSuav', function () { return est.suav; }, function (v) { est.suav = v; }, 'sgKSuavV');

    el('sgPalco').addEventListener('pointerdown', function (ev) {
      if (ev.target === el('sgPalco')) U.fechar();
    });
  }

  function nudge(d) {
    est.linha.pos = Math.max(0, Math.min(1, est.linha.pos + d));
    el('sgPos').value = String(Math.round(est.linha.pos * 1000));
    el('sgPosVal').textContent = num(est.linha.pos * 100, 1) + ' %';
  }

  function moverLinha(ev) {
    var tela = el('sgTela');
    var r = tela.getBoundingClientRect();
    var tam = L.tamanho(est);
    if (!tam.w) return;
    var e = enq(tam.w, tam.h, r.width, r.height);
    var px = (ev.clientX - r.left - e.x) / e.k;
    var py = (ev.clientY - r.top - e.y) / e.k;
    est.linha.pos = L.posDoPonto(est, tam.w, tam.h, px, py);
    el('sgPos').value = String(Math.round(est.linha.pos * 1000));
    el('sgPosVal').textContent = num(est.linha.pos * 100, 1) + ' %';
  }

  /* ══════════════════════════════ PINTURA ══════════════════════ */
  function pintarTudo() {
    if (!el('sgPalco')) return;
    var e = el('sgEscala');
    if (!e.options.length) {
      e.innerHTML = opt(L.ESCALAS, est.escala, function (o) { return o.id; }, function (o) { return o.nome; });
      el('sgTom').innerHTML = opt(L.NOMES, est.tom, function (o, i) { return i; }, function (o) { return o; });
      el('sgAlcance').innerHTML = opt(ALCANCES, 1, function (o, i) { return i; }, function (o) { return o.nome; });
      el('sgGrade').innerHTML = opt(L.GRADES_NOME, est.grade, function (o, i) { return i; }, function (o) { return o; });
      el('sgVoz').innerHTML = opt(L.VOZES, est.vozId, function (o) { return o.id; }, function (o) { return o.nome; });
      el('sgTaxa').innerHTML = opt(TAXAS, 3, function (o, i) { return i; }, function (o) { return o + '×'; });
    }
    el('sgPos').value = String(Math.round(est.linha.pos * 1000));
    el('sgPosVal').textContent = num(est.linha.pos * 100, 1) + ' %';
    el('sgBpm').value = est.bpm;
    pintarTonal();
    pintarSensores();
    pintarTransporte();

    Array.prototype.forEach.call(document.querySelectorAll('#sgPalco .sg-orient'), function (b) {
      b.classList.toggle('on', (b.dataset.orient | 0) === est.linha.orient);
    });
    el('sgDiag').classList.toggle('hidden', est.linha.orient < 2);
    var img = est.fonte && est.fonte.kind === 'image';
    el('sgImg').classList.toggle('hidden', !img);
    el('sgVazio').classList.toggle('hidden', !!est.fonte);
    el('sgFonteNome').textContent = est.fonte
      ? (est.fonte.nome || '—') + '  ·  ' + est.fonte.w + '×' + est.fonte.h
      : '—';
    ['sgKSens', 'sgKDens', 'sgKSuav'].forEach(function (k) {
      var n = el(k);
      if (n && n._pintar) n._pintar();
    });
  }

  function pintarTonal() {
    var e = el('sgTonal');
    if (e) e.textContent = L.NOMES[est.tom] + ' ' + L.escalaDe(est.escala).nome.toLowerCase();
  }
  function pintarSensores() {
    Array.prototype.forEach.call(document.querySelectorAll('#sgPalco .sg-sensor'), function (b) {
      b.classList.toggle('on', !!est.sensores[b.dataset.sensor]);
    });
  }
  function pintarTransporte() {
    var t = el('sgTocar');
    if (!t) return;
    t.innerHTML = tocando
      ? '<svg viewBox="0 0 24 24"><rect x="7" y="6" width="3.5" height="12"/><rect x="13.5" y="6" width="3.5" height="12"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>';
    t.classList.toggle('on', tocando);
    el('sgRec').classList.toggle('on', est.gravando);
    el('sgLaco').classList.toggle('on', est.laco);
    el('sgSomFonte').classList.toggle('on', est.somDaFonte);
  }

  /* ══════════════════════════════ SAÍDAS ═══════════════════════ */
  function semNotas() {
    if (est.notas.length) return false;
    VE.app.toast('não há nota nenhuma — toque o vídeo com a linha sobre alguma coisa que se mexe', 'err');
    return true;
  }
  function carimbo() {
    return VE.BRAND.slug + '-sonografo-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  function exportarMidi() {
    if (semNotas()) return;
    VE.saveFile(carimbo() + '.mid', L.midi(est));
    VE.app.toast(est.notas.length + ' notas em MIDI', 'ok');
  }

  function exportarWav() {
    if (semNotas()) return;
    VE.app.toast('renderizando o áudio…');
    L.render(est).then(function (buf) {
      VE.saveFile(carimbo() + '.wav', VE.audio.encodeWav(buf));
      VE.app.toast('áudio salvo · ' + num(buf.duration, 1) + ' s', 'ok');
    }).catch(function (e) {
      VE.app.toast('não consegui renderizar: ' + (e && e.message ? e.message : e), 'err');
    });
  }

  function usarNaComposicao() {
    if (semNotas()) return;
    VE.app.toast('renderizando o áudio…');
    L.render(est).then(function (buf) {
      var blob = VE.audio.encodeWav(buf);
      var nome = 'SONÓGRAFO · ' + (est.fonte ? est.fonte.nome : 'sem fonte');
      return VE.media.loadAudioBlob(blob, nome.replace(/[^\w .·-]/g, '') + '.wav').then(function (id) {
        VE.addMedia({ kind: 'audio', name: nome, src: id, dur: Math.min(buf.duration, VE.MAXDUR) });
        VE.pushHistory();
        VE.emit('project');
        VE.app.toast('a música entrou na linha do tempo como clipe de áudio', 'ok');
      });
    }).catch(function (e) {
      VE.app.toast('não consegui renderizar: ' + (e && e.message ? e.message : e), 'err');
    });
  }

})(window.VE);
