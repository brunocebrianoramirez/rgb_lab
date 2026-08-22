/* ============================================================
   rgb_lab — fontes de mídia e composição de camadas
   Uma fonte (source) é um arquivo/dispositivo carregado.
   Uma camada (media layer) usa uma fonte dentro do tempo.
   ============================================================ */
(function (VE) {
  'use strict';

  VE.sources = {};
  var M = VE.media = {};
  var camStream = null, camRec = null, camChunks = [];

  function reg(o) {
    o.id = o.id || VE.uid('s');
    VE.sources[o.id] = o;
    VE.emit('sources');
    return o.id;
  }
  M.register = reg;

  M.get = function (id) { return VE.sources[id]; };

  M.remove = function (id) {
    var s = VE.sources[id];
    if (!s) return;
    if (s.url) URL.revokeObjectURL(s.url);
    if (VE.renderer) VE.renderer.dropTex(id);
    delete VE.sources[id];
  };

  /* Guarda o arquivo original DENTRO da fonte. A URL de blob morre com a
     aba; o File, não — é ele que a sessão guardada grava no IndexedDB e
     usa para remontar tudo depois de um F5.                             */
  function comArquivo(promessa, file) {
    return promessa.then(function (id) {
      var s = VE.sources[id];
      if (s) s.blob = file;
      if (VE.auto) VE.auto.marcar();
      return id;
    });
  }
  M.comArquivo = comArquivo;

  /* ---------------- vídeo em arquivo ---------------- */
  M.loadVideoFile = function (file) {
    return comArquivo(M.loadVideoUrl(URL.createObjectURL(file), file.name), file);
  };

  M.loadVideoUrl = function (url, name) {
    return new Promise(function (res, rej) {
      var el = document.createElement('video');
      el.playsInline = true; el.preload = 'auto'; el.src = url; el.muted = false;
      el.crossOrigin = 'anonymous';
      el.addEventListener('error', function () { rej(new Error('não consegui abrir ' + name)); });
      el.addEventListener('loadedmetadata', function () {
        VE.fixDuration(el).then(function (dur) {
          if (!isFinite(dur) || dur <= 0) return rej(new Error('duração ilegível'));
          var id = reg({
            kind: 'video', name: name, el: el, url: url,
            w: el.videoWidth || 1280, h: el.videoHeight || 720, duration: dur
          });
          el.currentTime = 0;
          res(id);
        });
      });
      el.load();
    });
  };

  /* ---------------- imagem ---------------- */
  M.loadImageFile = function (file) {
    return comArquivo(new Promise(function (res, rej) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        res(reg({ kind: 'image', name: file.name, el: img, url: url, w: img.naturalWidth, h: img.naturalHeight, duration: 0 }));
      };
      img.onerror = function () { rej(new Error('imagem inválida')); };
      img.src = url;
    }), file);
  };

  /* ---------------- áudio ---------------- */
  M.loadAudioFile = function (file) {
    return comArquivo(new Promise(function (res, rej) {
      var url = URL.createObjectURL(file);
      var el = document.createElement('audio');
      el.preload = 'auto'; el.src = url;
      el.addEventListener('error', function () { rej(new Error('áudio inválido')); });
      el.addEventListener('loadedmetadata', function () {
        VE.fixDuration(el).then(function (dur) {
          res(reg({ kind: 'audio', name: file.name, el: el, url: url, w: 0, h: 0, duration: dur || 0 }));
        });
      });
      el.load();
    }), file);
  };

  M.loadAudioBlob = function (blob, name) {
    return M.loadAudioFile(new File([blob], name || 'audio.wav', { type: blob.type || 'audio/wav' }));
  };

  /* ============================================ REMONTAR UMA FONTE ========
     Recria uma fonte a partir do arquivo guardado, COM O ID QUE ELA TINHA.
     O id importa mais do que parece: é ele que liga o clipe à mídia dentro
     do arquivo de projeto. Fonte que volta com id novo é clipe descartado.

     Serve à sessão guardada (IndexedDB) e ao arquivo de projeto completo —
     as duas precisam exatamente disto, e uma cópia de cada lado divergiria
     no primeiro conserto.                                               */
  M.recriar = function (id, info) {
    var url = URL.createObjectURL(info.blob);
    var carga;
    if (info.kind === 'video') {
      carga = M.loadVideoUrl(url, info.name);
    } else if (info.kind === 'audio') {
      carga = M.loadAudioFile(new File([info.blob], info.name || 'audio',
        { type: info.tipo || 'audio/wav' }));
    } else {
      carga = new Promise(function (res, rej) {
        var img = new Image();
        img.onload = function () {
          res(reg({
            kind: 'image', name: info.name, el: img, url: url,
            w: img.naturalWidth, h: img.naturalHeight, duration: 0
          }));
        };
        img.onerror = function () { rej(new Error('imagem ilegível')); };
        img.src = url;
      });
    }
    return carga.then(function (novoId) {
      var s = VE.sources[novoId];
      if (!s) return null;
      delete VE.sources[novoId];
      s.id = id;
      s.blob = info.blob;
      if (info.deTipografia) s.name = (info.name || 'TEXTO') + ' (imagem)';
      VE.sources[id] = s;
      return id;
    }, function () { return null; });
  };

  /* ---------------- camada de texto (TYPE LAB) ---------------- */
  M.registerTypeSource = function (canvas, label, renderFn) {
    return reg({
      kind: 'type', name: label || 'TEXTO', el: canvas, w: canvas.width, h: canvas.height,
      duration: 0, render: renderFn, live: true
    });
  };

  /* ---------------- webcam ---------------- */
  M.camOpen = function () {
    return new Promise(function (res, rej) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        rej(new Error('este navegador não expõe câmera')); return;
      }
      navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
      }).then(function (stream) {
        camStream = stream;
        var el = document.getElementById('camVideo');
        el.srcObject = stream;
        el.play().catch(function () { });
        el.addEventListener('loadedmetadata', function () {
          var s = VE.sources.__cam;
          if (s) { s.w = el.videoWidth; s.h = el.videoHeight; }
        }, { once: true });
        reg({
          id: '__cam', kind: 'webcam', name: 'WEBCAM', el: el,
          w: el.videoWidth || 1280, h: el.videoHeight || 720, duration: 0, live: true
        });
        res('__cam');
      }).catch(function (e) {
        var msg = e && e.name === 'NotAllowedError' ? 'permissão de câmera negada' :
          e && e.name === 'NotFoundError' ? 'nenhuma câmera encontrada' : (e.message || 'falha na câmera');
        rej(new Error(msg));
      });
    });
  };

  M.camClose = function () {
    if (camStream) { camStream.getTracks().forEach(function (t) { t.stop(); }); camStream = null; }
    var el = document.getElementById('camVideo');
    if (el) el.srcObject = null;
    if (VE.sources.__cam) {
      if (VE.project) {
        VE.project.tracks.forEach(function (tr) {
          tr.clips = tr.clips.filter(function (c) { return c.src !== '__cam'; });
        });
      }
      M.remove('__cam');
    }
    VE.emit('project');
  };

  M.camActive = function () { return !!camStream; };

  /* congela um frame da câmera como imagem */
  M.camGrab = function () {
    var el = document.getElementById('camVideo');
    if (!el || !el.videoWidth) return null;
    var cv = document.createElement('canvas');
    cv.width = el.videoWidth; cv.height = el.videoHeight;
    cv.getContext('2d').drawImage(el, 0, 0);
    return reg({ kind: 'image', name: 'FRAME ' + new Date().toLocaleTimeString('pt-BR'), el: cv, w: cv.width, h: cv.height, duration: 0 });
  };

  /* grava um trecho da câmera e devolve uma fonte de vídeo */
  M.camRecStart = function () {
    if (!camStream) return false;
    var mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].filter(function (m) {
      try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; }
    })[0];
    if (!mime) return false;
    camChunks = [];
    camRec = new MediaRecorder(camStream, { mimeType: mime, videoBitsPerSecond: 8000000 });
    camRec.ondataavailable = function (e) { if (e.data.size) camChunks.push(e.data); };
    camRec.start();
    return true;
  };

  M.camRecStop = function () {
    return new Promise(function (res, rej) {
      if (!camRec) { rej(new Error('nada gravando')); return; }
      camRec.onstop = function () {
        var blob = new Blob(camChunks, { type: 'video/webm' });
        camRec = null;
        comArquivo(M.loadVideoUrl(URL.createObjectURL(blob), 'CÂMERA ' + new Date().toLocaleTimeString('pt-BR')), blob).then(res, rej);
      };
      camRec.stop();
    });
  };

  M.camRecording = function () { return !!camRec; };

  /* ---------------- clipe de teste procedural ---------------- */
  M.makeTestClip = function (secs) {
    secs = secs || 6;
    return new Promise(function (res, rej) {
      var W = 1280, H = 720, FPS = 30;
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var c = cv.getContext('2d');
      var mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].filter(function (m) {
        try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; }
      })[0];
      if (!mime) { rej(new Error('sem gravador de vídeo')); return; }
      var stream = cv.captureStream(0);
      var track = stream.getVideoTracks()[0];
      var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 9000000 });
      var chunks = [];
      rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        var bt = new Blob(chunks, { type: 'video/webm' });
        comArquivo(M.loadVideoUrl(URL.createObjectURL(bt), 'TESTE.WEBM'), bt).then(res, rej);
      };
      rec.start();
      var t0 = performance.now();
      function frame() {
        var t = (performance.now() - t0) / 1000;
        if (t > secs) { setTimeout(function () { rec.stop(); }, 120); return; }
        /* carta de teste: papel, grade, barras e círculo */
        c.fillStyle = '#efede4'; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(22,21,15,.16)'; c.lineWidth = 1;
        for (var x = 0; x <= W; x += 40) { c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke(); }
        for (var y = 0; y <= H; y += 40) { c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke(); }
        var bars = ['#16150f', '#d0271b', '#f5d000', '#1c7a41', '#1b4fd8', '#e2670f'];
        for (var i = 0; i < bars.length; i++) { c.fillStyle = bars[i]; c.fillRect(i * (W / bars.length), H - 90, W / bars.length, 90); }
        c.save();
        c.translate(W / 2 + Math.cos(t * 1.1) * 210, H / 2 + Math.sin(t * 1.5) * 110);
        c.rotate(t * 0.8);
        c.fillStyle = '#16150f'; c.fillRect(-70, -70, 140, 140);
        c.fillStyle = '#f5d000'; c.beginPath(); c.arc(0, 0, 44, 0, 6.2832); c.fill();
        c.restore();
        c.fillStyle = '#16150f';
        c.font = '700 96px Archivo, Helvetica, sans-serif'; c.textAlign = 'center';
        c.fillText('rgb_lab', W / 2, 140);
        c.font = '500 26px "JetBrains Mono", monospace';
        c.fillText('CARTA DE TESTE · ' + t.toFixed(2) + 'S', W / 2, 186);
        track.requestFrame();
        setTimeout(frame, 1000 / FPS);
      }
      frame();
    });
  };

  /* ============================================== GEOMETRIA DO CLIPE ========
     Converte MOTION (posição, escala, rotação, ponto de âncora) na geometria
     que o shader de composição entende.

     O shader trabalha num espaço "corrigido pelo aspecto": o deslocamento
     horizontal é multiplicado pela proporção do quadro antes de rodar. Por
     isso toda conta de âncora acontece nesse espaço e só o centro volta para
     coordenadas de tela no fim.                                            */

  function baseSize(src, fit, canvasW, canvasH) {
    var aspect = canvasW / canvasH;
    var sw = src.w || canvasW, sh = src.h || canvasH;
    var sa = sw / sh;
    if (fit === 'stretch') return { w: aspect, h: 1 };
    if (fit === 'original') return { w: (sw / canvasW) * aspect, h: sh / canvasH };
    if (fit === 'cover') {
      if (sa > aspect) return { w: sa, h: 1 };
      return { w: aspect, h: aspect / sa };
    }
    /* contain */
    if (sa > aspect) return { w: aspect, h: aspect / sa };
    return { w: sa, h: 1 };
  }

  function rectFor(src, mo, fit, canvasW, canvasH, crop) {
    var aspect = canvasW / canvasH;
    var b = baseSize(src, fit, canvasW, canvasH);
    var sc = (mo.scale === undefined ? 1 : mo.scale);
    var w = b.w * sc * (mo.sx === undefined ? 1 : mo.sx);
    var h = b.h * sc * (mo.sy === undefined ? 1 : mo.sy);
    var ang = (mo.rot || 0) * Math.PI / 180;
    var cos = Math.cos(ang), sin = Math.sin(ang);

    /* recorte de transição: encolhe o retângulo e reposiciona o que sobrou */
    var shx = 0, shy = 0;
    if (crop) {
      shx = ((crop.x + crop.w / 2) - 0.5) * w;
      shy = ((crop.y + crop.h / 2) - 0.5) * h;
      w *= crop.w; h *= crop.h;
    }

    /* ponto de âncora: o clipe é posicionado PELA âncora, não pelo centro */
    var ox = (mo.ax || 0) * w, oy = (mo.ay || 0) * h;
    var rx = ox * cos - oy * sin + shx * cos - shy * sin;
    var ry = ox * sin + oy * cos + shx * sin + shy * cos;

    return {
      x: 0.5 + (mo.x || 0) - rx / aspect,
      y: 0.5 + (mo.y || 0) - ry,
      w: Math.max(0.0001, w),
      h: Math.max(0.0001, h)
    };
  }
  M.rectFor = rectFor;
  M.baseSize = baseSize;

  /* caixa do clipe na tela, em pixels do projeto — usada pelo controlador
     de transformação que aparece sobre a prévia                            */
  M.boundsOf = function (clip, t) {
    var p = VE.project;
    if (!p) return null;
    var src = VE.sources[clip.src];
    var local = t - clip.start;
    var mo = {
      x: VE.valueAt(clip, 'motion.x', local), y: VE.valueAt(clip, 'motion.y', local),
      scale: VE.valueAt(clip, 'motion.scale', local),
      sx: VE.valueAt(clip, 'motion.sx', local), sy: VE.valueAt(clip, 'motion.sy', local),
      rot: VE.valueAt(clip, 'motion.rot', local),
      ax: VE.valueAt(clip, 'motion.ax', local), ay: VE.valueAt(clip, 'motion.ay', local)
    };
    var cw = p.canvas.w, ch = p.canvas.h, aspect = cw / ch;
    var r = rectFor(src || { w: cw, h: ch }, mo, clip.fit, cw, ch, null);
    /* volta do espaço corrigido para pixels */
    return {
      cx: r.x * cw,
      cy: (1 - r.y) * ch,
      w: (r.w / aspect) * cw,
      h: r.h * ch,
      rot: mo.rot,
      ax: mo.ax, ay: mo.ay,
      motion: mo
    };
  };

  /* ============================================ ELEMENTOS POR CLIPE ========
     Duas ocorrências da mesma fonte podem tocar ao mesmo tempo em pistas
     diferentes. Um <video> só consegue estar num instante por vez, então
     cada clipe extra ganha o seu próprio elemento, clonado sob demanda.   */
  function elFor(clip, src) {
    if (!src) return null;
    if (!src.owner) src.owner = clip.id;
    if (src.owner === clip.id || src.live) return src.el;
    src.clones = src.clones || {};
    if (!src.clones[clip.id]) {
      if (src.kind === 'image' || src.kind === 'type') { src.clones[clip.id] = src.el; }
      else {
        var el = document.createElement(src.kind === 'audio' ? 'audio' : 'video');
        el.playsInline = true; el.preload = 'auto'; el.crossOrigin = 'anonymous';
        el.src = src.url || src.el.src;
        el.load();
        /* o clone também precisa entrar no grafo de áudio da exportação */
        if (VE.app && VE.app.hookAudio) { try { VE.app.hookAudio(el); } catch (e) { } }
        src.clones[clip.id] = el;
      }
    }
    return src.clones[clip.id];
  }
  M.elFor = elFor;

  function texKey(clip, src) {
    /* imagem não muda: uma textura por fonte basta. Vídeo/texto mudam a cada
       quadro e podem estar em tempos diferentes: uma textura por clipe.   */
    return (src.kind === 'image') ? clip.src : 'c:' + clip.id;
  }

  /* ============================================ SINCRONISMO ================ */
  M.syncPlayback = function (t, playing) {
    var p = VE.project;
    if (!p) return;
    var seen = {};
    p.tracks.forEach(function (tr) {
      tr.clips.forEach(function (c) {
        var s = VE.sources[c.src];
        if (!s || !s.el) return;
        if (s.kind !== 'video' && s.kind !== 'audio') return;
        var el = elFor(c, s);
        if (!el) return;
        var active = t >= c.start - 0.001 && t < c.start + c.dur && c.enabled;
        var audible = active && !c.muted && VE.trackAudible(tr);
        var target = VE.srcTime(c, t);
        seen[el.__veId || (el.__veId = VE.uid('el'))] = true;
        if (!active) { if (!el.paused) el.pause(); return; }
        el.volume = audible ? Math.min(1, VE.audioGain(c, t - c.start) * VE.masterVolume) : 0;
        el.muted = !audible;
        /* Reverso, vai-e-volta e congelado NÃO existem no <video>: nenhum
           navegador toca uma mídia para trás. Nesses modos o elemento fica
           pausado e é posicionado quadro a quadro — mais duro, porém exato.
           Em velocidade normal o próprio elemento toca, com playbackRate. */
        var modo = c.timeMode | 0;
        if (playing && modo === 0) {
          var rate = Math.max(0.0625, Math.min(16, (c.speed === undefined ? 1 : c.speed) || 1));
          if (el.playbackRate !== rate) { try { el.playbackRate = rate; } catch (e) { } }
          if (el.paused) { try { el.currentTime = target; } catch (e) { } el.play().catch(function () { }); }
          else if (Math.abs(el.currentTime - target) > 0.28) { try { el.currentTime = target; } catch (e) { } }
        } else if (playing) {
          if (!el.paused) el.pause();
          el.muted = true;
          if (Math.abs(el.currentTime - target) > 0.02) { try { el.currentTime = Math.max(0, target); } catch (e) { } }
        } else {
          if (!el.paused) el.pause();
          if (Math.abs(el.currentTime - target) > 0.02) { try { el.currentTime = Math.max(0, target); } catch (e) { } }
        }
      });
    });
  };

  M.pauseAll = function () {
    Object.keys(VE.sources).forEach(function (k) {
      var s = VE.sources[k];
      if (s.el && s.el.pause && !s.el.paused) s.el.pause();
      if (s.clones) Object.keys(s.clones).forEach(function (c) {
        var e = s.clones[c];
        if (e && e.pause && !e.paused) e.pause();
      });
    });
  };

  /* busca exata (exportação frame a frame) */
  M.seekAll = function (t) {
    var p = VE.project, jobs = [];
    if (!p) return Promise.resolve();
    p.tracks.forEach(function (tr) {
      tr.clips.forEach(function (c) {
        var s = VE.sources[c.src];
        if (!s || s.kind !== 'video') return;
        if (t < c.start - 0.001 || t >= c.start + c.dur) return;
        var el = elFor(c, s);
        if (!el) return;
        var target = VE.srcTime(c, t);
        if (Math.abs(el.currentTime - target) < 0.001) return;
        jobs.push(new Promise(function (res) {
          var done = false;
          var fin = function () { if (done) return; done = true; res(); };
          var onSeek = function () {
            el.removeEventListener('seeked', onSeek);
            if (el.requestVideoFrameCallback) {
              var to = setTimeout(fin, 140);
              el.requestVideoFrameCallback(function () { clearTimeout(to); fin(); });
            } else setTimeout(fin, 24);
          };
          el.addEventListener('seeked', onSeek);
          try { el.currentTime = Math.max(0, target); } catch (e) { fin(); }
          setTimeout(fin, 900);
        }));
      });
    });
    return Promise.all(jobs);
  };

  /* ============================================ PLANO DE COMPOSIÇÃO ========
     Pega as operações que o state.js resolveu no tempo e devolve a lista que
     o motor consome — já com textura, geometria e cadeia de efeitos.       */
  M.buildPlan = function (t) {
    var p = VE.project, out = [];
    if (!p || !VE.renderer) return out;
    var cw = VE.renderer.w, ch = VE.renderer.h;
    var ops = VE.resolveOps(t);

    ops.forEach(function (op) {
      if (op.kind === 'adjust') { out.push({ kind: 'adjust', effects: op.effects }); return; }
      var c = op.clip;
      var s = VE.sources[c.src];
      if (!s || !s.el) return;
      var el = elFor(c, s), tex = null;
      if (s.kind === 'video' || s.kind === 'webcam') {
        if (!el) return;
        /* Ao arrastar a agulha, escrever em `currentTime` derruba o
           readyState para 1 até o quadro novo chegar. Sumir com a camada
           nesse vão é o que fazia o vídeo PISCAR mostrando o fundo. Aqui
           repetimos o último quadro já enviado — a imagem congela por um
           instante em vez de desaparecer.                               */
        var kv = texKey(c, s);
        tex = (el.readyState >= 2)
          ? VE.renderer.upload(kv, el, true)
          : VE.renderer.texUltima(kv);
      } else if (s.kind === 'type') {
        if (s.render) s.render(op.local);
        tex = VE.renderer.upload(texKey(c, s), s.el, true);
      } else if (s.kind === 'legenda') {
        /* uma fonte só para todas as legendas: ela redesenha o texto DO
           CLIPE que está sendo montado agora, por isso o clipe vai junto */
        if (s.render) s.render(op.local, c);
        tex = VE.renderer.upload(texKey(c, s), s.el, true);
      } else if (s.kind === 'image') {
        var key = texKey(c, s);
        if (!s.uploaded) { tex = VE.renderer.upload(key, s.el, true); s.uploaded = !!tex; }
        else tex = VE.renderer.tex(key);
      }
      if (!tex) return;
      /* Uma camada é ESTÁTICA quando a fonte não anda: imagem parada ou
         tipografia sem animação. Só essas podem ir para o cache do motor —
         vídeo e câmera trazem um quadro diferente a cada volta do laço. */
      var estatico = (s.kind === 'image') ||
        (s.kind === 'type' && !(s.animado === true));
      var plano = {
        kind: 'clip',
        tex: tex,
        rect: rectFor(s, op.motion, c.fit, cw, ch, op.crop),
        angle: op.motion.rot,
        opacity: op.opacity,
        blend: op.blend,
        flipX: c.flipX, flipY: c.flipY,
        crop: op.crop,
        effects: op.effects,
        layer: op.layer || null,
        estatico: estatico,
        clipId: c.id
      };
      plano.cacheavel = estatico && VE.layerCacheavel ? VE.layerCacheavel(plano, c) : false;
      out.push(plano);
    });
    return out;
  };

  /* compatibilidade: a antiga lista de camadas, sem cadeia por clipe */
  M.frameLayers = function (t) {
    return M.buildPlan(t).filter(function (o) { return o.kind === 'clip'; });
  };

  VE.masterVolume = 1;

})(window.VE);
