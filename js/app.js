/* ============================================================
   rgb_lab — aplicação
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var A = VE.app = {};
  var renderer, raf = null, loopPaused = false;
  var quality = 0.66, exportSize = null;
  var fpsCount = 0, fpsTime = 0, maskTick = 0;
  var playStartWall = 0, playStartT = 0;
  var actx = null, recDest = null;

  A.playing = false;
  A.bypass = false;
  A.exportBg = null;

  /* ================= inicialização ================= */
  A.init = function () {
    renderer = new VE.Renderer($('#gl'));
    if (renderer.failed) {
      document.body.innerHTML = '<div style="padding:40px;font-family:monospace">' +
        'ESTE NAVEGADOR NÃO TEM WEBGL2.<br>USE CHROME, EDGE OU FIREFOX ATUALIZADOS.</div>';
      return;
    }
    VE.renderer = renderer;
    renderer.setSize(1920 * quality, 1080 * quality);

    VE.view.init();
    VE.tl.init();
    VE.panels.initLibrary();
    VE.filters.init();
    VE.exporter.init();
    VE.audio.initUI();
    VE.type.init();
    VE.shell.init();
    if (VE.guia) VE.guia.init();

    initSources();
    initTransport();
    initKeys();
    initResizer();
    initStatusBar();

    VE.on('project', function () {
      VE.tl.render();
      if (VE.shell.view === 'video') VE.panels.renderProps();
      VE.shell.updateStatus();
    });
    VE.on('select', function () { if (VE.shell.view === 'video') VE.panels.renderProps(); });
    VE.on('sources', function () { VE.shell.updateStatus(); });
    VE.on('canvas', function () {
      applyQuality();
      if (VE.view.mode !== 'free') VE.view.applyMode(); else VE.view.apply();
    });
    window.addEventListener('resize', function () { VE.panels.renderMaskOverlay(); });

    /* sessão guardada: liga a gravação e pergunta se quer a de antes.
       Perguntar, nunca restaurar sozinho — quem abriu para começar
       do zero não pode achar o projeto de ontem em cima da mesa.   */
    if (VE.auto && VE.auto.ligar()) VE.auto.oferecer();

    loop();
  };

  A.afterEnter = function () {
    applyQuality();
    VE.view.fit();
    VE.shell.updateStatus();
  };

  /* ================= projeto ================= */
  A.ensureProject = function (w, h, dur) {
    if (VE.project) return VE.project;
    var p = VE.newProject({
      w: w || 1920, h: h || 1080,
      duration: Math.min(VE.MAXDUR, dur || 10),
      name: 'COMPOSIÇÃO 01'
    });
    applyQuality();
    return p;
  };

  /* ================= fontes ================= */
  function initSources() {
    $('#srcFile').addEventListener('click', function () { $('#fileInput').click(); });
    $('#srcImage').addEventListener('click', function () { $('#imgInput').click(); });
    $('#srcAudio').addEventListener('click', function () { $('#audioInput').click(); });
    $('#srcType').addEventListener('click', function () { VE.shell.go('type'); A.toast('monte o texto e clique em ENVIAR PRA TIMELINE'); });
    var bLeg = $('#srcLegenda');
    if (bLeg) bLeg.addEventListener('click', function () { VE.legendas.comecar(); });
    $('#srcTest').addEventListener('click', makeTest);
    $('#srcOver').addEventListener('click', function () {
      if (!VE.project) { A.toast('carregue uma fonte primeiro — a sobreposição vai POR CIMA do que já existe', 'err'); return; }
      overMode = true;
      $('#overInput').click();
    });
    $('#overInput').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      if (!f) { overMode = false; return; }
      if (f.type.indexOf('image/') === 0) addImage(f, true);
      else addVideo(f, true);
    });
    $('#srcCam').addEventListener('click', toggleCam);
    $('#camToggle').addEventListener('click', toggleCam);
    $('#camGrab').addEventListener('click', grabCam);
    $('#camRec').addEventListener('click', recCam);

    $('#fileInput').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      if (f) addVideo(f);
    });
    $('#imgInput').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      if (f) addImage(f);
    });
    $('#audioInput').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      if (!f) return;
      if (VE.shell.view === 'audio') {
        VE.audio.loadFile(f).then(function () {
          A.toast('áudio carregado', 'ok');
          VE.shell.renderAudioInspector();
        }).catch(function (e) { A.toast(e.message, 'err'); });
      } else addAudio(f);
    });
    $('#auFile').addEventListener('click', function () { $('#audioInput').click(); });
    $('#auTone').addEventListener('click', function () { VE.audio.makeTone(); VE.shell.renderAudioInspector(); });
    $('#auMic').addEventListener('click', function () {
      if (VE.audio.micRecording()) {
        VE.audio.micStop().then(function () { A.toast('gravação encerrada', 'ok'); VE.shell.renderAudioInspector(); });
        $('#auMic').classList.remove('on');
      } else {
        VE.audio.micStart().then(function () { A.toast('gravando microfone… clique de novo para parar'); })
          .catch(function (e) { A.toast('microfone: ' + e.message, 'err'); });
      }
    });
    $('#auFromVideo').addEventListener('click', function () {
      var vid = Object.keys(VE.sources).filter(function (k) { return VE.sources[k].kind === 'video'; })[0];
      if (!vid) { A.toast('carregue um vídeo primeiro no laboratório 01', 'err'); return; }
      VE.audio.loadFromVideoSource(vid).then(function () {
        A.toast('áudio extraído do vídeo', 'ok');
        VE.shell.renderAudioInspector();
      }).catch(function () { A.toast('não consegui decodificar o áudio desse arquivo', 'err'); });
    });
    $('#auExport').addEventListener('click', VE.audio.exportWav);

    /* arrastar arquivos para dentro */
    ['dragover', 'drop'].forEach(function (ev) {
      window.addEventListener(ev, function (e) {
        e.preventDefault();
        if (ev !== 'drop') return;
        var f = e.dataTransfer.files[0];
        if (!f) return;
        if (f.type.startsWith('video/')) addVideo(f);
        else if (f.type.startsWith('image/')) addImage(f);
        else if (f.type.startsWith('audio/')) {
          if (VE.shell.view === 'audio') VE.audio.loadFile(f).then(function () { VE.shell.renderAudioInspector(); });
          else addAudio(f);
        } else if (f.name.indexOf('.json') > 0) openProjectFile(f);
      });
    });
  }

  /* ------------------------------------------------------- SOBREPOSIÇÃO
     Com `over`, a mídia não vai para o fim da pista de baixo: ela entra
     numa pista ACIMA, no mesmo intervalo do que já está no cursor, já em
     modo de mistura. É a diferença entre "acrescentar um plano" e
     "sobrepor duas imagens".                                            */
  var overMode = false;

  function overTarget() {
    if (!VE.project) return null;
    var t = VE.project.time;
    var ops = VE.resolveOps(t).filter(function (o) { return o.kind === 'clip' && o.clip; });
    var sel = VE.selected();
    if (sel && sel.kind !== 'audio' && sel.kind !== 'adjust') return sel;
    return ops.length ? ops[ops.length - 1].clip : null;
  }

  function overFinish(c, tipo) {
    if (!c) return;
    var alvo = overTarget();
    if (alvo && alvo !== c) {
      c.start = alvo.start;
      c.dur = Math.min(c.dur || alvo.dur, alvo.dur);
      if (c.kind === 'image') c.dur = alvo.dur;
    }
    c.blend = 8;                     /* TELA: o modo que mais serve para começar */
    VE.writeProp(c, 'motion.opacity', 0.75);
    VE.emit('project');
    A.toast(tipo + ' sobreposto — já entrou em TELA a 75%. para trocar: ficha à direita → COMPOSIÇÃO → ESCOLHER.', 'ok');
  }

  function addVideo(file, over) {
    A.toast('lendo ' + file.name + '…');
    VE.media.loadVideoFile(file).then(function (id) {
      var s = VE.sources[id];
      var first = !VE.project;
      A.ensureProject(s.w, s.h, s.duration);
      if (first) {
        VE.setCanvas(s.w, s.h, 'src');
        VE.setDuration(Math.min(VE.MAXDUR, s.duration));
        $('#canvasPreset').value = 'src';
      }
      var novo = VE.addMedia({
        kind: 'video', name: s.name, src: id,
        dur: Math.min(s.duration, VE.MAXDUR), fit: 'contain',
        over: over || overMode, start: (over || overMode) ? VE.project.time : undefined
      });
      if (over || overMode) { overMode = false; overFinish(novo, 'vídeo'); }
      hookAudio(s.el);
      VE.pushHistory(); VE.emit('project');
      VE.shell.go('video');
      VE.view.fit();
      if (s.duration > VE.MAXDUR) A.toast('vídeo tem ' + s.duration.toFixed(1) + 's · a composição usa até ' + VE.limitLabel() + '. o limite é ajustável na ficha da composição.', 'err');
      else A.toast(s.w + '×' + s.h + ' · ' + s.duration.toFixed(2) + 's · clipe acrescentado na pista', 'ok');
    }).catch(function (e) { A.toast(e.message, 'err'); });
  }

  function addImage(file, over) {
    VE.media.loadImageFile(file).then(function (id) {
      var s = VE.sources[id];
      var first = !VE.project;
      A.ensureProject(s.w, s.h, 10);
      if (first) { VE.setCanvas(s.w, s.h, 'src'); }
      var novo = VE.addMedia({
        kind: 'image', name: s.name, src: id, dur: VE.duration(), fit: 'contain',
        over: over || overMode, start: (over || overMode) ? VE.project.time : undefined
      });
      if (over || overMode) { overMode = false; overFinish(novo, 'imagem'); }
      VE.pushHistory(); VE.emit('project');
      VE.shell.go('video');
      VE.view.fit();
      if (!(over || overMode)) A.toast('imagem ' + s.w + '×' + s.h + ' adicionada', 'ok');
    }).catch(function (e) { A.toast(e.message, 'err'); });
  }

  function addAudio(file) {
    VE.media.loadAudioFile(file).then(function (id) {
      var s = VE.sources[id];
      A.ensureProject(1920, 1080, s.duration);
      VE.addMedia({ kind: 'audio', name: s.name, src: id, dur: Math.min(s.duration, VE.MAXDUR) });
      hookAudio(s.el);
      VE.pushHistory(); VE.emit('project');
      A.toast('áudio na linha do tempo', 'ok');
    }).catch(function (e) { A.toast(e.message, 'err'); });
  }

  function makeTest() {
    A.toast('gerando carta de teste… 6 segundos');
    VE.media.makeTestClip(6).then(function (id) {
      var s = VE.sources[id];
      var first = !VE.project;
      A.ensureProject(s.w, s.h, s.duration);
      if (first) { VE.setCanvas(s.w, s.h, 'src'); VE.setDuration(s.duration); }
      VE.addMedia({ kind: 'video', name: s.name, src: id, dur: Math.min(s.duration, VE.MAXDUR) });
      hookAudio(s.el);
      VE.pushHistory(); VE.emit('project');
      VE.shell.go('video');
      VE.view.fit();
      A.toast('carta de teste pronta', 'ok');
    }).catch(function (e) { A.toast(e.message, 'err'); });
  }

  /* ---------------- webcam ---------------- */
  function toggleCam() {
    if (VE.media.camActive()) {
      VE.media.camClose();
      $('#camDot').className = 'dot';
      $('#camToggle').textContent = 'ABRIR';
      A.toast('câmera fechada');
      return;
    }
    VE.media.camOpen().then(function (id) {
      var s = VE.sources[id];
      var first = !VE.project;
      A.ensureProject(s.w || 1280, s.h || 720, 10);
      if (first) VE.setCanvas(s.w || 1280, s.h || 720, 'src');
      VE.addMedia({ kind: 'webcam', name: 'WEBCAM', src: id, dur: VE.duration(), fit: 'cover' });
      VE.pushHistory(); VE.emit('project');
      VE.shell.go('video');
      VE.view.fit();
      $('#camDot').className = 'dot dot-live';
      $('#camToggle').textContent = 'FECHAR';
      A.toast('câmera aberta — a camada está na composição', 'ok');
    }).catch(function (e) { A.toast('câmera: ' + e.message, 'err'); });
  }

  function grabCam() {
    if (!VE.media.camActive()) { A.toast('abra a câmera primeiro', 'err'); return; }
    var id = VE.media.camGrab();
    if (!id) { A.toast('câmera ainda não tem imagem', 'err'); return; }
    var s = VE.sources[id];
    VE.addMedia({ kind: 'image', name: s.name, src: id, dur: VE.duration(), fit: 'contain' });
    VE.pushHistory(); VE.emit('project');
    A.toast('frame congelado virou camada', 'ok');
  }

  function recCam() {
    if (!VE.media.camActive()) { A.toast('abra a câmera primeiro', 'err'); return; }
    if (VE.media.camRecording()) {
      $('#camRec').textContent = 'GRAVAR';
      $('#camDot').className = 'dot dot-live';
      VE.media.camRecStop().then(function (id) {
        var s = VE.sources[id];
        VE.addMedia({ kind: 'video', name: s.name, src: id, dur: Math.min(s.duration, VE.MAXDUR) });
        hookAudio(s.el);
        VE.pushHistory(); VE.emit('project');
        A.toast('gravação virou camada de vídeo', 'ok');
      }).catch(function (e) { A.toast(e.message, 'err'); });
    } else {
      if (VE.media.camRecStart()) {
        $('#camRec').textContent = 'PARAR';
        $('#camDot').className = 'dot dot-rec';
        A.toast('gravando a câmera…');
      } else A.toast('não consegui gravar', 'err');
    }
  }

  /* ================= áudio para exportação ================= */
  function ensureCtx() {
    if (!actx) {
      try {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        recDest = actx.createMediaStreamDestination();
        /* MANTENEDOR DE SILÊNCIO.
           Um destino de gravação sem nada ligado nele não entrega amostra
           nenhuma. O MediaRecorder, com uma trilha de áudio que nunca
           produz dado, fica esperando — e devolve arquivo vazio ou curto,
           calado. Esta fonte constante em ganho zero é silêncio digital
           que MANTÉM A TRILHA VIVA, e custa nada.                      */
        var manter = actx.createConstantSource();
        var mudo = actx.createGain();
        mudo.gain.value = 0;
        manter.connect(mudo).connect(recDest);
        manter.start();
      } catch (e) { actx = null; }
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }

  /* O contexto de áudio só sai de "suspenso" depois de um gesto da pessoa,
     e `resume()` é assíncrono. Exportar antes disso grava um arquivo sem
     som — ou nenhum arquivo. Quem vai gravar espera aqui.             */
  A.prepararAudio = function () {
    ensureCtx();
    if (!actx) return Promise.resolve({ ok: false, motivo: 'sem contexto de áudio' });
    if (actx.state === 'running') return Promise.resolve({ ok: true });
    return actx.resume().then(function () {
      return { ok: actx.state === 'running', motivo: 'contexto ' + actx.state };
    }, function () { return { ok: false, motivo: 'contexto ' + actx.state }; });
  };

  A.audioPronto = function () { return !!(actx && actx.state === 'running'); };

  /* A composição tem som para gravar? Vídeo com áudio ou clipe de áudio,
     não silenciado, em pista audível.                                  */
  A.temAudio = function () {
    if (!VE.project) return false;
    return VE.project.tracks.some(function (tr) {
      return tr.clips.some(function (c) {
        if (c.muted || !c.enabled) return false;
        var s = VE.sources[c.src];
        if (!s) return false;
        if (s.kind !== 'audio' && s.kind !== 'video') return false;
        return VE.trackAudible ? VE.trackAudible(tr) : true;
      });
    });
  };

  function hookAudio(el) {
    if (!el || el.__veHooked) return;
    var c = ensureCtx();
    if (!c) return;
    try {
      var node = c.createMediaElementSource(el);
      var g = c.createGain();
      g.gain.value = 1;
      node.connect(g);
      g.connect(c.destination);
      g.connect(recDest);
      el.__veHooked = true;
    } catch (e) { /* elemento já ligado */ }
  }

  A.hookAudio = hookAudio;

  A.getAudioTracks = function () {
    ensureCtx();
    return recDest ? recDest.stream.getAudioTracks() : [];
  };
  A.playAllForExport = function () { ensureCtx(); };

  /* ================= qualidade / tamanho ================= */
  function applyQuality() {
    if (!VE.project) return;
    if (exportSize) return;
    var c = VE.project.canvas;
    renderer.setSize(Math.max(32, c.w * quality), Math.max(32, c.h * quality));
    VE.view.apply();
  }
  A.setRenderSize = function (w, h) { exportSize = [w, h]; renderer.setSize(w, h); VE.view.apply(); };
  A.restoreRenderSize = function () { exportSize = null; applyQuality(); };

  /* ================= reprodução ================= */
  A.play = function () {
    if (!VE.project || A.playing) return;
    ensureCtx();
    if (VE.project.time >= VE.duration() - 0.02) VE.project.time = 0;
    playStartWall = performance.now();
    playStartT = VE.project.time;
    A.playing = true;
    $('#playBtn').textContent = '❚❚';
    $('#stState').textContent = 'TOCANDO';
  };

  A.pause = function () {
    A.playing = false;
    VE.media.pauseAll();
    $('#playBtn').textContent = '▶';
    $('#stState').textContent = 'PRONTO';
  };

  A.toggle = function () { A.playing ? A.pause() : A.play(); };

  A.seek = function (t) {
    if (!VE.project) return;
    t = Math.max(0, Math.min(VE.duration(), t));
    /* A memória de quadros (eco, acúmulo, borrão) só faz sentido entre
       instantes vizinhos. Num salto grande ela suja a imagem e precisa
       ser apagada; num arrasto de agulha, apagar a cada movimento é o
       que fazia os efeitos de TEMPO piscarem. Limpa só no salto.      */
    if (Math.abs(t - VE.project.time) > 0.35) renderer.clearPrev();
    VE.project.time = t;
    playStartWall = performance.now();
    playStartT = t;
    VE.media.syncPlayback(t, A.playing);
    VE.tl.setTime(t);
    VE.panels.renderMaskOverlay();
    VE.emit('seek', t);
  };

  A.pauseLoop = function () { loopPaused = true; A.pause(); };
  A.resumeLoop = function () { loopPaused = false; };
  A.clearFeedback = function () { renderer.clearPrev(); };

  A.renderNow = function () {
    if (!VE.project) return;
    var t = VE.project.time;
    var plan = VE.media.buildPlan(t);
    /* prévia da galeria: enquanto o mouse está sobre um filtro, ele entra
       como último ajuste — mostra sem aplicar, e some ao sair.          */
    if (VE.filters && VE.filters.preview && !A.exportBg) {
      var pv = VE.filters.previewOp();
      if (pv) plan = plan.concat([pv]);
    }
    if (A.exportBg) {
      /* o fundo de achatamento entra como um ajuste final sobre tudo */
      plan = plan.concat([{
        kind: 'adjust',
        effects: [{
          id: 'alphaboard', params: { col: A.exportBg, keep: 0 }, amount: 1, local: 0,
          mask: VE.newMask()
        }]
      }]);
    }
    renderer.renderPlan(plan, t, { bypass: A.bypass });
  };

  /* ================= laço principal ================= */
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!VE.project || loopPaused) return;

    if (A.playing) {
      var total = VE.duration();
      var t = playStartT + (performance.now() - playStartWall) / 1000;
      if (t >= total) {
        if ($('#loopChk').checked) { t = 0; playStartT = 0; playStartWall = performance.now(); renderer.clearPrev(); }
        else { A.pause(); t = total; }
      }
      VE.project.time = Math.max(0, Math.min(total, t));
      VE.media.syncPlayback(VE.project.time, A.playing);
      VE.tl.setTime(VE.project.time);
    }

    if (VE.shell.view === 'video' || A.exportBg !== null || loopPaused === false) A.renderNow();
    updateTimecode();
    if (VE.shell.view === 'video') {
      VE.panels.syncLive();
      if (A.playing && (++maskTick % 5 === 0)) VE.panels.renderMaskOverlay();
      updateViewportMeta();
    }

    fpsCount++;
    var now = performance.now();
    if (now - fpsTime > 500) {
      var f = Math.round(fpsCount * 1000 / (now - fpsTime));
      $('#fpsBadge').textContent = f + ' FPS';
      $('#stFps').textContent = f;
      fpsCount = 0; fpsTime = now;
    }
  }

  function tc(t) { return VE.tl.tc(t); }

  function updateTimecode() {
    var el = $('#timecode');
    if (!el || !el.firstChild) return;
    el.firstChild.nodeValue = tc(VE.project.time) + ' ';
    $('#tcTotal').textContent = tc(VE.duration());
  }

  function updateViewportMeta() {
    var p = VE.project;
    var ops = VE.resolveOps(p.time);
    var vis = 0, fx = 0;
    ops.forEach(function (o) { if (o.kind === 'clip') vis++; fx += o.effects.length; });
    $('#vpMetaTL').innerHTML = '<b>' + p.canvas.w + '×' + p.canvas.h + '</b> · ' + vis + ' NO QUADRO';
    $('#vpMetaTR').innerHTML = 'ZOOM <b>' + (VE.view.zoom * 100).toFixed(0) + '%</b>';
    $('#vpMetaBL').innerHTML = 'T <b>' + VE.tl.tc(p.time) + '</b> / ' + VE.tl.tc(VE.duration());
    $('#vpMetaBR').innerHTML = 'FX <b>' + fx + '</b> · ' + (renderer.w) + '×' + (renderer.h);
  }

  /* ================= transporte ================= */
  function initTransport() {
    $('#playBtn').addEventListener('click', A.toggle);
    $('#goStart').addEventListener('click', function () { A.seek(0); });
    $('#goEnd').addEventListener('click', function () { A.seek(VE.duration() - 0.001); });
    $('#stepBack').addEventListener('click', function () { A.seek(VE.project.time - 1 / VE.project.fps); });
    $('#stepFwd').addEventListener('click', function () { A.seek(VE.project.time + 1 / VE.project.fps); });
    $('#quality').addEventListener('change', function () { quality = parseFloat(this.value); applyQuality(); });
    $('#volume').addEventListener('input', function () {
      VE.masterVolume = parseFloat(this.value);
      if (VE.project) VE.media.syncPlayback(VE.project.time, A.playing);
    });
    var bp = $('#bypassBtn');
    bp.addEventListener('pointerdown', function () { A.bypass = true; bp.classList.add('on'); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      bp.addEventListener(ev, function () { A.bypass = false; bp.classList.remove('on'); });
    });

    $('#canvasPreset').addEventListener('change', function () {
      var v = this.value;
      if (v === 'src') {
        var first = VE.allClips().filter(function (c) { return c.src && VE.sources[c.src] && VE.sources[c.src].w; })[0];
        var s = first && VE.sources[first.src];
        if (s && s.w) VE.setCanvas(s.w, s.h, 'src');
      } else {
        var map = {
          '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080],
          '4:5': [1080, 1350], '4:3': [1440, 1080], '21:9': [2560, 1080]
        };
        var d = map[v];
        if (d) VE.setCanvas(d[0], d[1], v);
      }
      VE.pushHistory();
      VE.emit('project');
      VE.view.fit();
    });

    /* ---- barra da linha do tempo ---- */
    var TLB = VE.tl;
    document.querySelectorAll('[data-ferr]').forEach(function (b) {
      b.addEventListener('click', function () { VE.tl.setFerramenta(b.dataset.ferr); });
    });
    on('#addVBtn', function () { VE.addTrack('video'); commit(); });
    on('#addABtn', function () { VE.addTrack('audio'); commit(); });
    on('#addFxBtn', function () { VE.addTrack('fx'); commit(); });
    on('#adjBtn', addAdjust);
    on('#splitBtn', splitSel);
    on('#dupBtn', dupSel);
    on('#delBtn', function () { delSel(false); });
    on('#rippleBtn', function () { delSel(true); });
    on('#markBtn', addMarker);
    on('#inBtn', function () { VE.project.inPoint = VE.project.time; commit(); });
    on('#outBtn', function () { VE.project.outPoint = VE.project.time; commit(); });
    on('#clearIOBtn', function () { VE.project.inPoint = null; VE.project.outPoint = null; commit(); });
    on('#snapBtn', function () {
      TLB.snap = !TLB.snap;
      $('#snapBtn').classList.toggle('on', TLB.snap);
      A.toast('ímã ' + (TLB.snap ? 'ligado' : 'desligado'));
    });
    on('#tcBtn', function () {
      TLB.tcMode = TLB.tcMode === 'frames' ? 'seconds' : 'frames';
      $('#tcBtn').classList.toggle('on', TLB.tcMode === 'seconds');
      TLB.render();
    });
    on('#zoomInBtn', function () { TLB.setZoom(TLB.pps * 1.5); });
    on('#zoomOutBtn', function () { TLB.setZoom(TLB.pps / 1.5); });
    on('#fitSeqBtn', function () { TLB.fitSequence(); });
    $('#savePreset').addEventListener('click', function () {
      if (!VE.project) return;
      var n = prompt('nome do preset (cadeia inteira de efeitos):', 'CADEIA');
      if (!n) return;
      VE.presets.saveChain(n);
      A.toast('preset salvo', 'ok');
    });
  }

  function on(sel, fn) { var el = $(sel); if (el) el.addEventListener('click', fn); }
  function commit() { VE.pushHistory(); VE.emit('project'); }
  A.commit = commit;

  /* CORTAR: se houver seleção, corta a seleção; senão corta tudo no cursor.
     É o comportamento de mesa: S sem selecionar nada corta a coluna inteira. */
  function splitSel() {
    var t = VE.project.time;
    var sel = VE.selectedClips();
    var made = sel.length ? VE.splitAll(t, true) : VE.splitAll(t, false);
    if (!made.length) return A.toast('ponha o cursor sobre um clipe');
    A.toast(made.length + ' corte(s) em ' + VE.tl.tc(t));
    commit();
  }

  function dupSel() {
    var sel = VE.selectedClips();
    if (!sel.length) return A.toast('selecione um clipe');
    var made = [];
    sel.forEach(function (c) { var b = VE.duplicateClip(c.id); if (b) made.push(b.id); });
    VE.select(made);
    commit();
  }

  function delSel(ripple) {
    var sel = VE.selectedClips();
    if (!sel.length) {
      /* sem seleção: se houver entrada/saída, apaga o trecho */
      var p = VE.project;
      if (p.inPoint != null && p.outPoint != null) {
        var n = VE.liftRange(Math.min(p.inPoint, p.outPoint), Math.max(p.inPoint, p.outPoint), ripple);
        A.toast(n + ' clipe(s) afetados no trecho');
        return commit();
      }
      return A.toast('nada selecionado');
    }
    sel.forEach(function (c) { VE.removeClip(c.id, ripple); });
    VE.clearSelection();
    commit();
  }

  function addAdjust() {
    var p = VE.project;
    var a = (p.inPoint != null && p.outPoint != null) ? Math.min(p.inPoint, p.outPoint) : p.time;
    var b = (p.inPoint != null && p.outPoint != null) ? Math.max(p.inPoint, p.outPoint) : VE.duration();
    var c = VE.newAdjust(a, Math.max(0.5, b - a));
    var fxTracks = VE.tracksOfClass('fx');
    var tr = fxTracks.filter(function (t) { return !VE.overlaps(t, c.start, c.dur); })[0] || VE.addTrack('fx');
    tr.clips.push(c);
    VE.select([c.id]);
    A.toast('camada de ajuste de ' + VE.tl.tc(c.start) + ' a ' + VE.tl.tc(c.start + c.dur) + ' — arraste as bordas');
    commit();
  }

  function addMarker() {
    var m = VE.addMarker(VE.project.time, '');
    A.toast('marcador em ' + VE.tl.tc(m.t) + ' — clique duplo para nomear');
    commit();
  }
  A.addMarker = addMarker;

  /* ================= barra de status ================= */
  function initStatusBar() {
    $('#stUndo').addEventListener('click', function () { if (!VE.undo()) A.toast('nada para desfazer'); });
    $('#stRedo').addEventListener('click', function () { if (!VE.redo()) A.toast('nada para refazer'); });
    /* SALVAR PROJETO guarda o COMPLETO: edição mais os arquivos dentro.
       É o que "salvar" quer dizer para quem edita — poder abrir depois,
       noutra máquina, e ver tudo no lugar. A versão leve (só a edição,
       .json) ficou na ficha da COMPOSIÇÃO, para quem sabe o que quer. */
    $('#stSave').addEventListener('click', function () {
      if (!VE.project) return A.toast('nada para salvar');
      var p = VE.projfile.peso();
      A.toast('montando o projeto com ' + p.arquivos + ' arquivo(s) · ' +
        VE.projfile.tamanhoLegivel(p.bytes) + ' — pode demorar um pouco');
      VE.projfile.salvar().then(function (r) {
        A.toast('projeto salvo · ' + r.partes + ' arquivo(s) dentro · ' +
          VE.projfile.tamanhoLegivel(r.blob.size), 'ok');
      }, function (e) { A.toast('não consegui salvar: ' + e.message, 'err'); });
    });
    A.salvarLeve = function () {
      if (!VE.project) return A.toast('nada para salvar');
      var blob = new Blob([VE.serialize()], { type: 'application/json' });
      VE.saveFile(VE.BRAND.slug + '-' + Date.now().toString(36) + '.json', blob);
      A.toast('só a edição — os vídeos NÃO vão neste arquivo', 'ok');
    };
    $('#stOpen').addEventListener('click', function () { $('#projInput').click(); });
    $('#projInput').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      if (f) openProjectFile(f);
    });
  }

  /* Abre os DOIS formatos, decidindo pelo selo do arquivo e não pela
     extensão — nome de arquivo é palpite, os primeiros bytes não são. */
  function openProjectFile(f) {
    VE.projfile.ehCompleto(f).then(function (completo) {
      if (completo) return abrirCompleto(f);
      return abrirLeve(f);
    });
  }

  function abrirCompleto(f) {
    A.toast('abrindo o projeto e remontando os arquivos…');
    VE.projfile.abrir(f).then(function (r) {
      applyQuality();
      VE.view.fit();
      A.toast('“' + (r.nome || 'projeto') + '” de volta · ' + r.clipes + ' clipe(s) · ' +
        r.fontes + ' arquivo(s)' + (r.perdidas ? ' · ' + r.perdidas + ' não abriu' : ''), 'ok');
    }, function (e) { A.toast('erro ao abrir: ' + e.message, 'err'); });
  }

  function abrirLeve(f) {
    var r = new FileReader();
    r.onload = function () {
      try {
        A.ensureProject(1920, 1080, 10);
        /* as legendas guardam o texto no projeto, mas o pincel que as
           desenha morre com a aba: recria antes de ler, senão elas
           seriam descartadas como "fonte que sumiu".                */
        if (VE.legendas) { try { VE.legendas.reporFonte(JSON.parse(r.result)); } catch (e2) { } }
        VE.deserialize(r.result);
        applyQuality();
        VE.view.fit();
        var n = VE.allClips().length;
        /* Este é o ponto em que o arquivo leve decepciona, e a mensagem
           tem de dizer por quê — senão a pessoa acha que perdeu o
           trabalho, quando na verdade escolheu o formato errado.    */
        if (!n) {
          A.toast('este arquivo tem só a EDIÇÃO, e os vídeos dele não estão aqui. ' +
            'Para levar tudo junto, salve em .rgblab (o botão SALVAR PROJETO).', 'err');
        } else {
          A.toast('edição carregada · ' + n + ' clipe(s)', 'ok');
        }
      } catch (e) { A.toast('erro: ' + e.message, 'err'); }
    };
    r.readAsText(f);
  }

  /* ================= atalhos ================= */
  function initKeys() {
    window.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea' || e.target.isContentEditable) return;
      if (!VE.shell.entered) return;

      /* ---------------------------------------------- LABORATÓRIO DE ÁUDIO
         Espaço toca e pausa aqui também, como no vídeo. Vem ANTES da
         checagem de projeto de propósito: dá para trabalhar áudio sem ter
         composição de vídeo nenhuma aberta.                              */
      if (VE.shell.view === 'audio') {
        if (e.key === ' ') { e.preventDefault(); VE.audio.toggle(); return; }
        if (e.key === 'Home') { e.preventDefault(); VE.audio.voltarAoInicio(); return; }
        if (e.key === 'Escape') { e.preventDefault(); VE.audio.stop(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && VE.project) { e.preventDefault(); VE.undo(); }
        return;
      }

      if (!VE.project) return;
      if (VE.shell.view === 'type') {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
          e.preventDefault();
          if (!VE.type.undo()) A.toast('nada para desfazer na tipografia');
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
          e.preventDefault();
          if (!VE.type.redo()) A.toast('nada para refazer na tipografia');
        }
        return;
      }
      if (VE.shell.view !== 'video') {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); VE.undo(); }
        return;
      }
      var fps = VE.project.fps;
      var mod = e.ctrlKey || e.metaKey;

      /* ---- combinações com Ctrl/Cmd primeiro, para não colidir ---- */
      if (mod) {
        var k = e.key.toLowerCase();
        if (k === 'z') { e.preventDefault(); if (e.shiftKey) VE.redo(); else VE.undo(); return; }
        if (k === 'y') { e.preventDefault(); VE.redo(); return; }
        if (k === 'd') { e.preventDefault(); dupSel(); return; }
        if (k === 's') { e.preventDefault(); $('#stSave').click(); return; }
        if (k === 'a') { e.preventDefault(); VE.select(VE.allClips().map(function (c) { return c.id; })); VE.tl.markSelection(); VE.emit('select'); return; }
        if (k === 'c') { e.preventDefault(); A.copySel(); return; }
        if (k === 'v') { e.preventDefault(); A.pasteSel(); return; }
        if (k === 'g') { e.preventDefault(); VE.nestSelection(); commit(); return; }
        /* corta no cursor SEM trocar de ferramenta — é assim que se corta
           na prática; a tesoura serve para cortar olhando a imagem */
        if (k === 'k') { e.preventDefault(); splitSel(); return; }
        return;
      }

      switch (e.key) {
        case ' ': e.preventDefault(); A.toggle(); break;
        case 'ArrowLeft': e.preventDefault(); A.seek(VE.project.time - (e.shiftKey ? 1 : 1 / fps)); break;
        case 'ArrowRight': e.preventDefault(); A.seek(VE.project.time + (e.shiftKey ? 1 : 1 / fps)); break;
        case 'ArrowUp': e.preventDefault(); jumpEdge(-1); break;
        case 'ArrowDown': e.preventDefault(); jumpEdge(1); break;
        case 'Home': A.seek(0); break;
        case 'End': A.seek(VE.duration() - 0.001); break;
        case 'Delete': case 'Backspace': e.preventDefault(); delSel(e.shiftKey); break;
        case 'Escape': VE.clearSelection(); VE.tl.markSelection(); VE.emit('select'); break;
        /* ---- ferramentas, com as letras de sempre ---- */
        case 'v': case 'V': VE.tl.setFerramenta('sel'); break;
        case 'c': case 'C': VE.tl.setFerramenta('corte'); break;
        case 'h': case 'H': VE.tl.setFerramenta('mao'); break;
        case 'b': case 'B': VE.tl.setFerramenta('ondula'); break;
        case 's': case 'S': splitSel(); break;
        case 'm': case 'M': addMarker(); break;
        case 'i': case 'I': VE.project.inPoint = VE.project.time; commit(); break;
        case 'o': case 'O': VE.project.outPoint = VE.project.time; commit(); break;
        case 'f': case 'F': VE.view.fit(); break;
        case '\\': VE.tl.fitSequence(); break;   /* barra invertida: enquadrar sequência */
        case '0': VE.view.setZoom(1); VE.view.center(); break;
        /* + e - mexem no zoom da LINHA DO TEMPO, como numa mesa de edição.
           Com SHIFT, mexem no zoom da PRÉVIA — o comportamento antigo.     */
        case '+': case '=': VE.tl.setZoom(VE.tl.pps * 1.5); break;
        case '-': VE.tl.setZoom(VE.tl.pps / 1.5); break;
        case '_': VE.view.zoomBy(0.8); break;
        case '*': VE.view.zoomBy(1.25); break;
      }
    });
  }

  /* pula para o corte anterior/seguinte — o ↑/↓ de uma mesa de edição */
  function jumpEdge(dir) {
    var t = VE.project.time, best = null;
    VE.allClips().forEach(function (c) {
      [c.start, c.start + c.dur].forEach(function (e) {
        if (dir > 0 ? e > t + 0.002 : e < t - 0.002) {
          if (best === null || Math.abs(e - t) < Math.abs(best - t)) best = e;
        }
      });
    });
    VE.project.markers.forEach(function (m) {
      if (dir > 0 ? m.t > t + 0.002 : m.t < t - 0.002) {
        if (best === null || Math.abs(m.t - t) < Math.abs(best - t)) best = m.t;
      }
    });
    if (best !== null) A.seek(best);
  }

  /* área de transferência interna da linha do tempo */
  var clipboard = [];
  A.copySel = function () {
    var sel = VE.selectedClips();
    if (!sel.length) return A.toast('nada selecionado');
    var a = Math.min.apply(null, sel.map(function (c) { return c.start; }));
    clipboard = sel.map(function (c) {
      var f = VE.findClip(c.id);
      var o = VE.cloneClip(c);
      o.start = c.start - a;
      o.__trackKind = f ? f.track.kind : 'video';
      return o;
    });
    A.toast(clipboard.length + ' clipe(s) copiados');
  };
  A.pasteSel = function () {
    if (!clipboard.length) return A.toast('nada copiado');
    var t = VE.project.time, made = [];
    clipboard.forEach(function (o) {
      var c = VE.cloneClip(o);
      delete c.__trackKind;
      c.start = t + o.start;
      VE.insertClip(c);
      made.push(c.id);
    });
    VE.select(made);
    A.toast(made.length + ' clipe(s) colados em ' + VE.tl.tc(t));
    commit();
  };

  /* ================= divisores do painel =================
     as quatro colunas/blocos são redimensionáveis pela borda;
     a medida fica guardada no navegador. clique duplo volta ao padrão. */
  var LAYOUT_KEY = 'videorte.layout';
  var DEF_LAYOUT = { '--side-w': 206, '--insp-w': 268, '--tl-h': 268 };

  function initResizer() {
    var root = document.documentElement;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {}; } catch (e) { saved = {}; }
    Object.keys(DEF_LAYOUT).forEach(function (k) {
      if (saved[k]) root.style.setProperty(k, saved[k] + 'px');
    });
    function store(k, v) {
      saved[k] = v;
      try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(saved)); } catch (e) { }
    }
    function settle() {
      VE.tl.render();
      if (VE.view.mode !== 'free') VE.view.applyMode(); else VE.view.apply();
      if (VE.audio) VE.audio.drawWave();
      VE.panels.renderMaskOverlay();
    }

    /* colunas laterais */
    document.querySelectorAll('.vsplit').forEach(function (sp) {
      var cssVar = sp.dataset.var, side = sp.dataset.side;
      sp.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        sp.setPointerCapture(e.pointerId);
        sp.classList.add('drag');
        var panel = document.getElementById(side === 'left' ? 'side' : 'insp');
        var box = panel.getBoundingClientRect();
        var maxW = Math.min(window.innerWidth * 0.45, 620);
        function mv(ev) {
          var w = side === 'left' ? (ev.clientX - box.left) : (box.right - ev.clientX);
          w = Math.max(120, Math.min(maxW, Math.round(w)));
          root.style.setProperty(cssVar, w + 'px');
          store(cssVar, w);
          VE.view.drawRulers();
        }
        function up() {
          sp.classList.remove('drag');
          sp.removeEventListener('pointermove', mv);
          sp.removeEventListener('pointerup', up);
          settle();
        }
        sp.addEventListener('pointermove', mv);
        sp.addEventListener('pointerup', up);
      });
      sp.addEventListener('dblclick', function () {
        root.style.setProperty(cssVar, DEF_LAYOUT[cssVar] + 'px');
        store(cssVar, DEF_LAYOUT[cssVar]);
        settle();
      });
    });

    /* altura da linha do tempo */
    var h = $('#tlResize');
    h.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      h.setPointerCapture(e.pointerId);
      h.classList.add('drag');
      var y0 = e.clientY;
      var h0 = $('#timeline').getBoundingClientRect().height;
      function mv(ev) {
        var nh = Math.max(120, Math.min(window.innerHeight - 240, Math.round(h0 - (ev.clientY - y0))));
        root.style.setProperty('--tl-h', nh + 'px');
        store('--tl-h', nh);
      }
      function up() {
        h.classList.remove('drag');
        h.removeEventListener('pointermove', mv);
        h.removeEventListener('pointerup', up);
        settle();
      }
      h.addEventListener('pointermove', mv);
      h.addEventListener('pointerup', up);
    });
    h.addEventListener('dblclick', function () {
      root.style.setProperty('--tl-h', DEF_LAYOUT['--tl-h'] + 'px');
      store('--tl-h', DEF_LAYOUT['--tl-h']);
      settle();
    });
  }

  /* ================= toast ================= */
  var toastTimer = null;
  A.toast = function (msg, type) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = ''; }, type === 'err' ? 6500 : 3000);
  };

  var booted = false;
  var boot = function () { if (booted) return; booted = true; A.init(); };
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})(window.VE);
