/* ============================================================
   rgb_lab — exportação
   tempo real (com áudio) · frame a frame (exato) · sequência PNG
   (única saída com alpha real)
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var EX = VE.exporter = {};
  var running = false, cancelFlag = false, recorder = null, lastUrl = null;

  var CANDIDATES = [
    { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', label: 'MP4 · H.264 · abre em tudo', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9,opus', label: 'WEBM · VP9 · melhor qualidade', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', label: 'WEBM · VP8', ext: 'webm' },
    { mime: 'video/webm', label: 'WEBM · padrão do navegador', ext: 'webm' }
  ];

  /* ---------------- ZIP (armazenado, sem compressão) ---------------- */
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zipBlob(files) {
    var parts = [], central = [], offset = 0, enc = new TextEncoder();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0, true);
      lh.setUint16(8, 0, true); lh.setUint16(10, 0, true); lh.setUint16(12, 0, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
      ch.setUint16(8, 0, true); ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true);
      ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true);
      ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cstart = offset, csize = 0;
    central.forEach(function (c) { csize += c.length; });
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(4, 0, true); end.setUint16(6, 0, true);
    end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, csize, true); end.setUint32(16, cstart, true); end.setUint16(20, 0, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: 'application/zip' });
  }

  /* o escritor de ZIP é reaproveitado pelo laboratório de tipografia */
  VE.zip = zipBlob;

  /* ---------------- salvar arquivo ---------------- */
  VE.saveFile = function (filename, blob, url) {
    var fallback = function () {
      var own = !url, href = url || URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = href; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      if (own) setTimeout(function () { URL.revokeObjectURL(href); }, 5000);
      VE.app.toast('salvo: ' + filename, 'ok');
    };
    if (!(window.claude && typeof window.claude.use === 'function')) { fallback(); return; }
    window.claude.use('downloads').then(function (d) {
      if (!d) { fallback(); return; }
      d.save({ filename: filename, data: blob }).then(function () {
        VE.app.toast('salvo: ' + filename, 'ok');
      }).catch(function (err) {
        var code = err && err.code;
        if (code === 'declined') return;
        if (code === 'too_large') VE.app.toast('arquivo acima de 16 mb — limite da versão publicada. use resolução menor ou a versão local.', 'err');
        else if (code === 'rate_limited') VE.app.toast('espere um instante e clique de novo.', 'err');
        else if (code === 'rejected_extension' || code === 'extension_not_enabled') VE.app.toast('formato não permitido aqui. use a versão local.', 'err');
        else VE.app.toast('não consegui salvar (' + (code || 'erro') + ')', 'err');
      });
    }).catch(fallback);
  };

  /* ---------------- interface ---------------- */
  EX.init = function () {
    var sel = $('#expFormat');
    var ok = CANDIDATES.filter(function (c) {
      try { return window.MediaRecorder && MediaRecorder.isTypeSupported(c.mime); } catch (e) { return false; }
    });
    if (!ok.length) {
      sel.innerHTML = '<option>indisponível</option>';
    } else {
      sel.innerHTML = ok.map(function (c, i) { return '<option value="' + i + '">' + c.label + '</option>'; }).join('');
      EX.formats = ok;
      var pref = ok.findIndex(function (c) { return c.ext === 'mp4'; });
      if (pref < 0) pref = 0;
      sel.value = pref;
    }
    $('#exportBtn').addEventListener('click', EX.open);
    $('#expClose').addEventListener('click', EX.close);
    $('#expCancel').addEventListener('click', function () { if (running) cancelFlag = true; else EX.close(); });
    $('#expStart').addEventListener('click', EX.start);
    $('#snapBtn').addEventListener('click', EX.snapshot);
    $('#expMode').addEventListener('change', function () {
      var v = this.value;
      $('#modeHint').textContent = v === 'realtime'
        ? 'Toca a composição do início ao fim gravando a saída. Mantém o áudio. Se a máquina engasgar, pode perder frames.'
        : v === 'precise'
          ? 'Renderiza frame a frame com precisão total. Sem áudio. Mais lento, resultado exato.'
          : 'Gera um PNG por frame, com transparência preservada, e entrega tudo num .zip.';
      $('#expFormat').disabled = (v === 'frames');
    });
  };

  /* O trecho que vai sair: as marcas I e O quando existem, a sequência
     inteira quando não existem. Um lugar só decide isso.            */
  EX.faixa = function () {
    var p = VE.project;
    var dur = VE.duration();
    if (!p) return { ini: 0, fim: dur, marcado: false };
    var a = p.inPoint, b = p.outPoint;
    if (a == null && b == null) return { ini: 0, fim: dur, marcado: false };
    var ini = Math.max(0, Math.min(dur, a == null ? 0 : a));
    var fim = Math.max(0, Math.min(dur, b == null ? dur : b));
    if (fim < ini) { var t = ini; ini = fim; fim = t; }
    if (fim - ini < 0.05) return { ini: 0, fim: dur, marcado: false };
    return { ini: ini, fim: fim, marcado: true };
  };

  EX.open = function () {
    if (!VE.project) return;
    $('#exportModal').classList.remove('hidden');
    var p = VE.project;
    var f = EX.faixa();
    $('#expStatus').textContent = p.canvas.w + '×' + p.canvas.h + ' · ' +
      (f.fim - f.ini).toFixed(2) + 's · ' + VE.allClips().length + ' clipes · ' +
      VE.resolve(p.time).length + ' efeitos no cursor';
    /* aviso grande quando há trecho marcado: sair só um pedaço tem de ser
       uma decisão vista, não uma descoberta depois de exportar */
    var av = $('#expFaixa');
    if (av) {
      av.classList.toggle('hidden', !f.marcado);
      if (f.marcado) {
        av.innerHTML = '<b>TRECHO MARCADO</b> — vai sair de <b>' + VE.tl.tc(f.ini) +
          '</b> a <b>' + VE.tl.tc(f.fim) + '</b> (' + (f.fim - f.ini).toFixed(2) + 's), ' +
          'e não a sequência inteira (' + VE.duration().toFixed(2) + 's). ' +
          '<button class="cmd cmd-sm" id="expLimpaIO">EXPORTAR TUDO</button>';
        var bt = $('#expLimpaIO');
        if (bt) bt.addEventListener('click', function () {
          VE.project.inPoint = null; VE.project.outPoint = null;
          VE.emit('project'); EX.open();
        });
      }
    }
    $('#expResult').classList.add('hidden');
    $('#expBar').classList.add('hidden');
  };

  EX.close = function () { if (!running) $('#exportModal').classList.add('hidden'); };

  function prog(p, txt) {
    $('#expBar').classList.remove('hidden');
    $('#expFill').style.width = (p * 100).toFixed(1) + '%';
    $('#expPct').textContent = (p * 100).toFixed(0) + '%';
    if (txt) $('#expStatus').textContent = txt;
  }

  EX.start = function () {
    if (running) return;
    var mode = $('#expMode').value;
    var p = VE.project;
    if (!p) { VE.app.toast('não há composição para exportar', 'err'); return; }

    /* NÚMERO QUE NÃO É NÚMERO PARA A EXPORTAÇÃO PARA SEMPRE.
       `Math.max(1, NaN)` devolve NaN — não 1 — e `i >= NaN` é falso
       eternamente: o laço de quadros nunca termina, o progresso escreve
       "18 de NaN" e o navegador vai ficando pesado. Um `<select>` com o
       valor trocado por fora basta para chegar aqui. Nada entra sem
       passar por este filtro.                                        */
    function num(v, def, min, max) {
      var n = parseFloat(v);
      if (!isFinite(n)) n = def;
      return Math.max(min, Math.min(max, n));
    }
    var scale = num($('#expRes').value, 1, 0.1, 4);
    var fps = Math.round(num($('#expFps').value, 30, 1, 120));
    var bitrate = Math.round(num($('#expBitrate').value, 8000000, 250000, 200000000));
    var bg = $('#expBg').value;
    var w = Math.max(2, Math.round(p.canvas.w * scale / 2) * 2);
    var h = Math.max(2, Math.round(p.canvas.h * scale / 2) * 2);
    /* ENTRADA e SAÍDA mandam. As marcas I e O já existiam na régua e já
       serviam para levantar trecho — mas a exportação as ignorava e
       gravava a sequência inteira. Marcar um trecho e receber tudo é a
       pior surpresa possível num arquivo de duas horas.              */
    var faixa = EX.faixa();
    var total = num(faixa.fim - faixa.ini, 1, 0.05, VE.MAXDUR || 3600);

    if (mode === 'frames') {
      var frames = Math.round(total * fps);
      if (frames > 1200) { VE.app.toast('sequência de ' + frames + ' frames é demais — reduza fps ou duração', 'err'); return; }
    }

    running = true; cancelFlag = false;
    $('#expStart').disabled = true;
    $('#expResult').classList.add('hidden');
    VE.app.pauseLoop();
    VE.app.setRenderSize(w, h);
    VE.app.exportBg = (bg === 'keep') ? null : bg;

    if (mode === 'frames') { runFrames(fps, total, faixa.ini); return; }

    var fmt = EX.formats[+$('#expFormat').value] || EX.formats[0];
    if (!fmt) { VE.app.toast('sem gravador neste navegador', 'err'); finish(null, null); return; }

    /* Quadro EMPURRADO nos dois modos (`captureStream(0)` + `requestFrame`).
       Com `captureStream(fps)` quem decide quando existe um quadro novo é
       o navegador, olhando se o canvas mudou — e essa heurística falha em
       janela que não está compondo, em aba de fundo e em máquina ocupada.
       O sintoma é o pior possível: o arquivo sai curto, ou vazio, sem
       ninguém dizer nada. Empurrando, o quadro existe porque nós dissemos
       que existe.                                                       */
    var canvas = $('#gl'), chunks = [], stream;
    stream = canvas.captureStream(0);

    /* O áudio entra SÓ se ele estiver mesmo pronto para tocar. Uma trilha
       de áudio de um contexto suspenso é uma trilha que nunca entrega
       dado, e o gravador espera por ela até devolver arquivo curto ou
       vazio — sem dizer por quê. Antes isso acontecia calado.        */
    var espera = (mode === 'realtime')
      ? VE.app.prepararAudio()
      : Promise.resolve({ ok: false, motivo: 'modo exato não grava som' });

    espera.then(function (a) {
      var comSom = false;
      if (mode === 'realtime') {
        if (a.ok) {
          VE.app.getAudioTracks().forEach(function (t) { stream.addTrack(t); });
          comSom = stream.getAudioTracks().length > 0;
        }
        if (!comSom) {
          VE.app.toast('gravando SEM som — ' + (a.motivo || 'o áudio não estava pronto') +
            '. Toque a composição uma vez antes de exportar.', 'err');
        } else if (!VE.app.temAudio()) {
          VE.app.toast('a composição não tem som audível — o arquivo sai com trilha muda');
        }
      }
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: fmt.mime, videoBitsPerSecond: bitrate, audioBitsPerSecond: 192000
        });
      } catch (e) { VE.app.toast('gravador falhou: ' + e.message, 'err'); finish(null, fmt); return; }
      recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = function () { finish(new Blob(chunks, { type: fmt.mime.split(';')[0] }), fmt); };
      recorder.start(200);

      if (mode === 'realtime') runRealtime(total, fps, faixa.ini); else runPrecise(fps, total, faixa.ini);
    });
  };

  /* Quantos quadros, sempre um inteiro >= 1. Existe porque
      é NaN, e um laço comparado com NaN não termina. */
  function quadros(total, fps) {
    var n = Math.round(total * fps);
    if (!isFinite(n) || n < 1) n = 1;
    return Math.min(n, 200000);
  }

  function stopRec() { try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch (e) { } }

  function runRealtime(total, fps, ini) {
    ini = ini || 0;
    VE.app.clearFeedback();
    VE.app.seek(ini);
    var t0 = performance.now();
    VE.app.playAllForExport();
    var vtrack = recorder.stream.getVideoTracks()[0];
    var passo = 1 / Math.max(1, fps || 30), proximo = 0, entregues = 0;

    function tick() {
      if (cancelFlag) { VE.media.pauseAll(); stopRec(); return; }
      var t = (performance.now() - t0) / 1000;
      if (t >= total) {
        /* o último quadro tem de existir, senão o arquivo termina antes
           do fim da composição por um pedaço de segundo             */
        VE.project.time = ini + total;
        VE.media.syncPlayback(ini + total, false);
        VE.app.renderNow();
        try { vtrack.requestFrame(); } catch (e) { }
        VE.media.pauseAll();
        setTimeout(stopRec, 320);
        return;
      }
      VE.project.time = ini + t;
      VE.media.syncPlayback(ini + t, true);
      VE.app.renderNow();
      /* um quadro por passo de fps, e não um por volta do laço: a tela
         pode desenhar a 144 Hz, e gravar 144 quadros por segundo num
         arquivo pedido a 30 só engorda o arquivo.                    */
      if (t >= proximo) {
        try { vtrack.requestFrame(); entregues++; } catch (e) { }
        proximo = Math.max(t, proximo + passo);
      }
      VE.tl.setTime(ini + t);
      prog(t / total, 'gravando em tempo real · ' + t.toFixed(1) + 's de ' +
        total.toFixed(1) + 's · ' + entregues + ' quadros');
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------ FRAME A FRAME
     ARMADILHA QUE CUSTOU UM ARQUIVO INTEIRO:

     O MediaRecorder NÃO aceita que se diga em que instante cada quadro
     acontece. Ele carimba pelo RELÓGIO DE PAREDE, na hora em que o
     quadro chega. Como este modo desenha o mais rápido que consegue,
     uma composição de 6 s renderizada em 1,9 s virava um arquivo de
     1,9 s — com tudo acelerado três vezes. Medido, não suposto.

     A saída é dar o passo do relógio: o quadro `i` só é entregue quando
     o relógio de parede chega em `i/fps`. O arquivo sai com a duração
     certa. O custo é que o modo exato passa a levar o tempo da
     composição — o que já era verdade no modo em tempo real, e é o
     preço honesto de um gravador que só sabe carimbar pelo relógio.

     Se a máquina não conseguir desenhar no ritmo, o quadro sai atrasado
     e o arquivo fica UM POUCO mais longo. Longo demais é chato;
     acelerado três vezes é lixo.                                      */
  function runPrecise(fps, total, ini) {
    ini = ini || 0;
    var frames = quadros(total, fps);
    var vtrack = recorder.stream.getVideoTracks()[0];
    VE.media.pauseAll();
    VE.app.clearFeedback();
    var i = 0, t0 = performance.now(), atrasos = 0;

    function entrega() {
      VE.app.renderNow();
      try { vtrack.requestFrame(); } catch (e) { }
      VE.tl.setTime(ini + i / fps);
      var real = (performance.now() - t0) / 1000;
      prog(i / frames, 'frame ' + (i + 1) + ' de ' + frames +
        (atrasos ? ' · ' + atrasos + ' atrasado(s)' : '') +
        ' · ' + real.toFixed(1) + 's de ' + total.toFixed(1) + 's');
      i++;
      setTimeout(step, 0);
    }

    function step() {
      if (cancelFlag || i >= frames) { setTimeout(stopRec, 260); return; }
      var t = i / fps;
      VE.project.time = ini + t;
      VE.media.seekAll(ini + t).then(function () {
        /* espera o relógio alcançar o instante deste quadro */
        var falta = (t * 1000) - (performance.now() - t0);
        if (falta > 2) setTimeout(entrega, falta);
        else { if (falta < -80) atrasos++; entrega(); }
      }).catch(function () { i++; setTimeout(step, 0); });
    }
    step();
  }

  function runFrames(fps, total, ini) {
    ini = ini || 0;
    var frames = quadros(total, fps);
    var canvas = $('#gl'), files = [], i = 0;
    VE.media.pauseAll();
    VE.app.clearFeedback();
    function step() {
      if (cancelFlag || i >= frames) { packFrames(files); return; }
      var t = i / fps;
      VE.project.time = ini + t;
      VE.media.seekAll(ini + t).then(function () {
        VE.app.renderNow();
        canvas.toBlob(function (b) {
          if (!b) { i++; setTimeout(step, 0); return; }
          b.arrayBuffer().then(function (buf) {
            files.push({ name: VE.BRAND.slug + '_' + String(i).padStart(5, '0') + '.png', data: new Uint8Array(buf) });
            VE.tl.setTime(ini + t);
            prog(i / frames, 'png ' + (i + 1) + ' de ' + frames + ' · ' +
              (files.reduce(function (a, f) { return a + f.data.length; }, 0) / 1048576).toFixed(1) + ' mb');
            i++;
            setTimeout(step, 0);
          });
        }, 'image/png');
      }).catch(function () { i++; setTimeout(step, 0); });
    }
    step();
  }

  function packFrames(files) {
    if (!files.length) { finish(null, null); return; }
    prog(1, 'montando o .zip…');
    setTimeout(function () {
      var blob = zipBlob(files);
      finish(blob, { ext: 'zip' }, files.length);
    }, 20);
  }

  /* Lê a duração de verdade do arquivo gerado e põe o veredito na tela.
     `duration` costuma vir Infinity num blob de MediaRecorder até que se
     force uma busca ao fim — é o que `VE.fixDuration` faz; aqui só
     esperamos o resultado dela.                                       */
  function confereDuracao(video, esperada, box) {
    var aviso = document.createElement('div');
    aviso.className = 'micro exp-confere';
    aviso.textContent = 'conferindo a duração do arquivo…';
    box.appendChild(aviso);

    var pronto = false;
    function veredito(d) {
      if (pronto) return;
      pronto = true;
      if (!isFinite(d) || d <= 0) {
        aviso.textContent = 'não consegui ler a duração do arquivo — abra e confira.';
        aviso.classList.add('exp-duvida');
        return;
      }
      var falta = esperada - d;
      if (Math.abs(falta) <= Math.max(0.4, esperada * 0.03)) {
        aviso.textContent = '✓ arquivo com ' + d.toFixed(2) + 's · a composição tem ' +
          esperada.toFixed(2) + 's';
        aviso.classList.add('exp-ok');
      } else if (falta > 0) {
        aviso.innerHTML = '<b>saiu curto:</b> o arquivo tem ' + d.toFixed(2) +
          's e a composição tem ' + esperada.toFixed(2) + 's. ' +
          'O gravador do navegador carimba pelo relógio — se a máquina não deu conta, ' +
          'tente <b>resolução menor</b>, <b>menos fps</b>, ou o modo <b>frame a frame</b>.';
        aviso.classList.add('exp-curto');
      } else {
        aviso.innerHTML = '<b>saiu longo:</b> ' + d.toFixed(2) + 's contra ' +
          esperada.toFixed(2) + 's da composição — a máquina não desenhou no ritmo. ' +
          'A imagem está toda lá, só mais lenta.';
        aviso.classList.add('exp-duvida');
      }
    }

    if (isFinite(video.duration) && video.duration > 0) { veredito(video.duration); return; }
    video.addEventListener('durationchange', function () {
      if (isFinite(video.duration) && video.duration > 0) veredito(video.duration);
    });
    video.addEventListener('loadedmetadata', function () {
      if (isFinite(video.duration) && video.duration > 0) veredito(video.duration);
    });
    setTimeout(function () { veredito(video.duration); }, 4000);
  }

  function finish(blob, fmt, count) {
    running = false; recorder = null;
    $('#expStart').disabled = false;
    VE.app.exportBg = null;
    VE.app.restoreRenderSize();
    VE.app.resumeLoop();
    if (cancelFlag || !blob || !blob.size) {
      $('#expStatus').textContent = cancelFlag ? 'exportação cancelada.' : 'nada foi gravado.';
      $('#expBar').classList.add('hidden');
      return;
    }
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    lastUrl = URL.createObjectURL(blob);
    var stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    var name = VE.BRAND.slug + '-' + stamp + '.' + fmt.ext;
    var box = $('#expResult');
    box.classList.remove('hidden');
    box.innerHTML = '';
    if (fmt.ext !== 'zip') {
      var v = document.createElement('video');
      v.src = lastUrl; v.controls = true; v.loop = true;
      VE.fixDuration(v);
      box.appendChild(v);
      /* CONFERÊNCIA. O gravador do navegador pode devolver um arquivo mais
         curto do que a composição — e devolve calado. Quem descobre é
         quem abre o vídeo depois, achando que perdeu o trabalho. Aqui a
         duração do que saiu é MEDIDA e comparada com a esperada.      */
      confereDuracao(v, EX.faixa().fim - EX.faixa().ini, box);
    } else {
      var info = document.createElement('div');
      info.className = 'micro';
      info.style.marginBottom = '8px';
      info.textContent = count + ' PNG COM ALPHA · ' + (blob.size / 1048576).toFixed(1) + ' MB';
      box.appendChild(info);
    }
    var btn = document.createElement('button');
    btn.className = 'cmd cmd-solid';
    btn.style.width = '100%';
    btn.style.justifyContent = 'center';
    btn.textContent = '↓ BAIXAR ' + name.toUpperCase() + ' (' + (blob.size / 1048576).toFixed(1) + ' MB)';
    btn.addEventListener('click', function () { VE.saveFile(name, blob, fmt.ext === 'zip' ? null : lastUrl); });
    box.appendChild(btn);
    prog(1, 'pronto.');
  }

  /* PNG do frame atual — sempre na resolução cheia do projeto,
     independente da qualidade usada na prévia */
  EX.snapshot = function () {
    if (!VE.project || running) return;
    var p = VE.project;
    var wasPlaying = VE.app.playing;
    VE.app.pauseLoop();
    VE.app.setRenderSize(p.canvas.w, p.canvas.h);
    VE.app.renderNow();
    VE.app.toast('gerando png ' + p.canvas.w + '×' + p.canvas.h + '…');
    $('#gl').toBlob(function (b) {
      VE.app.restoreRenderSize();
      VE.app.resumeLoop();
      if (wasPlaying) VE.app.play();
      if (!b) return;
      VE.saveFile(VE.BRAND.slug + '-' + p.canvas.w + 'x' + p.canvas.h + '-' + p.time.toFixed(2) + 's.png', b);
    }, 'image/png');
  };

})(window.VE);
