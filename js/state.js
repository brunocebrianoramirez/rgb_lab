/* ============================================================
   rgb_lab — estado do projeto  ·  MODELO DE EDIÇÃO NÃO LINEAR
   ------------------------------------------------------------
   A composição deixou de ser "uma pilha de camadas" e virou uma
   SEQUÊNCIA com pistas, como numa mesa de edição de verdade.

     Sequence → tracks[]
     Track    → clips[]                (vários clipes por pista)
     Clip     → effects[] · keys{} · transIn · transOut · motion
     Effect   → params{} · mask{}
     Key      → { t, v, ease, bez }
     Marker   → { t, name }

   Regras que valem para tudo:
   · o tempo de um keyframe é LOCAL ao clipe — mover o clipe não
     desloca a animação;
   · uma pista aceita quantos clipes couberem, lado a lado;
   · um clipe de ajuste (kind 'adjust') afeta tudo o que estiver
     ABAIXO dele, só dentro do intervalo em que ele existe;
   · nada aqui desenha nada — este arquivo só descreve o tempo.
   ============================================================ */
(function (VE) {
  'use strict';

  var uidc = 0;
  VE.uid = function (p) { uidc++; return (p || 'c') + Date.now().toString(36).slice(-4) + uidc.toString(36); };

  /* ------------------------------------------------------------- LIMITE
     O limite da composição deixou de ser uma constante: quem decide é você.
     O valor fica guardado na máquina e vale para todos os projetos.
     O único teto real é a memória da placa de vídeo — por isso o número
     grande é permitido e o aviso aparece só quando passa do razoável.    */
  var LIMKEY = 'videorte.maxdur';
  var LIMDEF = 600;                /* 10 minutos, contra os 60 s de antes */
  var LIMHARD = 36000;             /* 10 horas: trava de segurança, não meta */

  VE.MAXDUR = LIMDEF;
  try {
    var stored = parseFloat(localStorage.getItem(LIMKEY));
    if (isFinite(stored) && stored >= 1) VE.MAXDUR = Math.min(LIMHARD, stored);
  } catch (e) { }

  VE.LIMHARD = LIMHARD;

  VE.setMaxDur = function (v) {
    v = parseFloat(v);
    if (!isFinite(v)) return VE.MAXDUR;
    VE.MAXDUR = Math.max(1, Math.min(LIMHARD, v));
    try { localStorage.setItem(LIMKEY, String(VE.MAXDUR)); } catch (e) { }
    VE.emit('limit', VE.MAXDUR);
    return VE.MAXDUR;
  };

  /* texto curto do limite, para as fichas: 600 → "10 MIN" */
  VE.limitLabel = function (v) {
    v = (v === undefined) ? VE.MAXDUR : v;
    if (v < 90) return Math.round(v) + ' s';
    if (v < 5400) return (v / 60).toFixed(v % 60 ? 1 : 0).replace('.0', '') + ' min';
    return (v / 3600).toFixed(1).replace('.0', '') + ' h';
  };

  /* ------------------------------------------------------- SOBREPOSIÇÃO
     Os modos de mistura de duas camadas, na MESMA ordem do shader de
     composição em js/gl.js. Um índice aqui é um índice lá.             */
  /* Os modos de mistura mudaram de casa: agora são 27, agrupados, e vivem
     em `comp.js` — que carrega antes deste arquivo. Aqui ficou só a nota,
     porque era aqui que todo mundo procurava.                            */

  /* classes de pista que entram na composição visual, da base para o topo */
  var VISUAL = { video: 1, fx: 1 };

  /* arquivos gravados por MediaRecorder às vezes vêm sem duração */
  VE.fixDuration = function (v) {
    return new Promise(function (res) {
      var go = function () {
        if (isFinite(v.duration) && v.duration > 0) return res(v.duration);
        var done = false;
        var finish = function () {
          if (done) return;
          done = true;
          v.removeEventListener('timeupdate', onT);
          try { v.currentTime = 0; } catch (e) { }
          res(v.duration);
        };
        var onT = function () { if (isFinite(v.duration) && v.duration > 0) finish(); };
        v.addEventListener('timeupdate', onT);
        try { v.currentTime = 1e7; } catch (e) { finish(); }
        setTimeout(finish, 2500);
      };
      if (v.readyState >= 1) go();
      else v.addEventListener('loadedmetadata', go, { once: true });
    });
  };

  /* ------------ eventos ------------ */
  var handlers = {};
  VE.on = function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); };
  VE.emit = function (ev, a) { (handlers[ev] || []).forEach(function (f) { f(a); }); };

  /* ============================================================ PROJETO ==== */
  VE.project = null;

  VE.TRACK_H = 42;          /* altura padrão de uma pista, em px */
  VE.TRACK_H_BIG = 74;      /* pista expandida (mostra onda / keyframes) */

  VE.newTrackObj = function (kind, name) {
    return {
      id: VE.uid('t'), kind: kind || 'video', name: name || '',
      visible: true, muted: false, solo: false, locked: false,
      expanded: false, height: VE.TRACK_H, color: null,
      clips: []
    };
  };

  VE.newProject = function (o) {
    o = o || {};
    VE.project = {
      version: 4,
      app: 'rgb_lab',
      name: o.name || 'composição',
      canvas: { w: o.w || 1920, h: o.h || 1080, preset: o.preset || 'src' },
      duration: Math.min(VE.MAXDUR, o.duration || 10),
      fps: o.fps || 30,
      /* ordem de exibição: TOPO → BASE. Vídeo/efeito em cima, áudio embaixo. */
      tracks: [
        VE.newTrackObj('fx'),
        VE.newTrackObj('video'),
        VE.newTrackObj('video'),
        VE.newTrackObj('audio'),
        VE.newTrackObj('audio')
      ],
      markers: [],
      comps: {},              /* composições aninhadas: id → sequência */
      selection: [],          /* ids selecionados (seleção múltipla) */
      selKind: null,          /* 'clip' | 'track' | 'marker' | 'trans' */
      inPoint: null, outPoint: null,
      time: 0
    };
    VE.hist = []; VE.histIdx = -1;
    VE.pushHistory();
    return VE.project;
  };

  VE.duration = function () { return VE.project ? Math.max(0.1, VE.project.duration) : 0; };

  /* ----------------------------------------------------------- TEMPO DA FONTE
     Onde a fonte tem de estar para que o clipe mostre, no instante `t` da
     composição, o que deve mostrar. Um único lugar decide isso — velocidade,
     sentido e vai-e-volta entram todos aqui, e o resto do sistema não
     precisa saber que existem.                                            */
  VE.srcTime = function (c, t) {
    var local = t - c.start;
    var d = Math.max(0.0001, c.dur);
    var sp = (c.speed === undefined || !isFinite(c.speed)) ? 1 : c.speed;
    var mode = c.timeMode | 0;
    if (mode === 3) return (c.in || 0);                        /* congelado */
    if (mode === 1) local = d - local;                         /* reverso */
    else if (mode === 2) {                                     /* vai-e-volta */
      var half = d * 0.5;
      local = (local < half) ? local : (d - local);
      sp = sp * 2;
    }
    return Math.max(0, (c.in || 0) + local * sp);
  };

  VE.temposLabel = ['Normal', 'Reverso', 'Vai-e-volta', 'Congelado'];

  VE.setDuration = function (d) {
    VE.project.duration = Math.max(0.2, Math.min(VE.MAXDUR, d));
  };

  /* estica a composição para caber o que foi colocado (até o limite) */
  VE.growToFit = function () {
    var p = VE.project, end = 0;
    if (!p) return;
    p.tracks.forEach(function (tr) {
      tr.clips.forEach(function (c) { end = Math.max(end, c.start + c.dur); });
    });
    if (end > p.duration) p.duration = Math.min(VE.MAXDUR, Math.ceil(end * 100) / 100);
  };

  VE.setCanvas = function (w, h, preset) {
    VE.project.canvas.w = Math.max(16, Math.round(w / 2) * 2);
    VE.project.canvas.h = Math.max(16, Math.round(h / 2) * 2);
    if (preset) VE.project.canvas.preset = preset;
    VE.emit('canvas');
  };

  /* ============================================================= PISTAS ==== */

  /* rótulo técnico: V1 é a pista de vídeo mais BAIXA, A1 a de áudio mais ALTA */
  VE.trackLabel = function (track) {
    var p = VE.project;
    if (!p) return '—';
    var vis = [], aud = [], fxs = [], leg = [];
    p.tracks.forEach(function (tr) {
      if (tr.kind === 'audio') aud.push(tr);
      else if (tr.kind === 'fx') fxs.push(tr);
      /* pista de legenda é pista de vídeo por dentro — arrastar, aparar e
         dividir seguem iguais — mas se chama C1, como em toda ilha.   */
      else if (tr.legenda) leg.push(tr);
      else vis.push(tr);
    });
    var i;
    i = leg.indexOf(track); if (i >= 0) return 'C' + (i + 1);
    i = vis.indexOf(track); if (i >= 0) return 'V' + (vis.length - i);
    i = fxs.indexOf(track); if (i >= 0) return 'FX' + (fxs.length - i);
    i = aud.indexOf(track); if (i >= 0) return 'A' + (i + 1);
    return '—';
  };

  VE.trackName = function (track) {
    return track.name && track.name.trim() ? track.name : VE.trackLabel(track);
  };

  VE.findTrack = function (id) {
    var p = VE.project;
    if (!p) return null;
    for (var i = 0; i < p.tracks.length; i++) if (p.tracks[i].id === id) return p.tracks[i];
    return null;
  };

  VE.trackIndex = function (id) {
    var p = VE.project;
    for (var i = 0; i < p.tracks.length; i++) if (p.tracks[i].id === id) return i;
    return -1;
  };

  /* Ordem de exibição do projeto, sempre nesta sequência:
       [ pistas FX ] [ pistas de vídeo ] [ pistas de áudio ]
     FX fica no topo porque uma camada de ajuste precisa estar ACIMA do que
     ela modifica — é isso que faz o ajuste alcançar os clipes de baixo.     */
  VE.addTrack = function (kind, refId, below) {
    var p = VE.project;
    kind = kind || 'video';
    var tr = VE.newTrackObj(kind);
    var at;
    if (refId) {
      at = VE.trackIndex(refId);
      if (at < 0) at = 0;
      at = below ? at + 1 : at;
    } else if (kind === 'fx') {
      at = 0;                                      /* efeitos, no alto de tudo */
    } else if (kind === 'audio') {
      at = p.tracks.length;                        /* áudio, no fim */
    } else {
      /* vídeo entra logo abaixo do último FX, ou seja: no topo do grupo de vídeo */
      at = 0;
      while (at < p.tracks.length && p.tracks[at].kind === 'fx') at++;
    }
    p.tracks.splice(Math.max(0, Math.min(p.tracks.length, at)), 0, tr);
    return tr;
  };

  VE.removeTrack = function (id) {
    var p = VE.project;
    var i = VE.trackIndex(id);
    if (i < 0) return false;
    var visual = 0, audio = 0;
    p.tracks.forEach(function (t) { if (t.kind === 'audio') audio++; else visual++; });
    var tr = p.tracks[i];
    if (tr.kind === 'audio' ? audio <= 1 : visual <= 1) return false;
    p.tracks.splice(i, 1);
    VE.clearSelection();
    return true;
  };

  VE.moveTrack = function (id, dir) {
    var p = VE.project, i = VE.trackIndex(id);
    var j = i + dir;
    if (i < 0 || j < 0 || j >= p.tracks.length) return false;
    if (p.tracks[i].kind === 'audio' ? p.tracks[j].kind !== 'audio' : p.tracks[j].kind === 'audio') return false;
    var t = p.tracks[i]; p.tracks[i] = p.tracks[j]; p.tracks[j] = t;
    return true;
  };

  /* uma pista está tocando? (respeita solo global) */
  VE.trackAudible = function (tr) {
    var p = VE.project;
    var anySolo = p.tracks.some(function (t) { return t.solo; });
    if (tr.muted) return false;
    if (anySolo && !tr.solo) return false;
    return true;
  };

  VE.trackVisible = function (tr) {
    var p = VE.project;
    var anySolo = p.tracks.some(function (t) { return t.solo && t.kind !== 'audio'; });
    if (!tr.visible) return false;
    if (anySolo && !tr.solo) return false;
    return true;
  };

  /* ============================================================= CLIPES ==== */

  VE.newMotion = function () {
    return { x: 0, y: 0, scale: 1, sx: 1, sy: 1, rot: 0, ax: 0, ay: 0, opacity: 1 };
  };

  VE.newMask = function () {
    return { shape: 0, x: 0.5, y: 0.5, w: 0.5, h: 0.5, ang: 0, feather: 0.12, invert: false };
  };

  /* um clipe de mídia, de tipografia, de áudio ou de ajuste */
  VE.newClipObj = function (o) {
    o = o || {};
    return {
      id: VE.uid('c'),
      kind: o.kind || 'video',            /* video image webcam type audio adjust comp */
      name: o.name || (o.kind || 'CLIPE').toUpperCase(),
      src: o.src || null,                 /* id em VE.sources */
      comp: o.comp || null,               /* id de composição aninhada */
      start: Math.max(0, o.start || 0),
      dur: Math.max(0.04, o.dur || 2),
      in: o.in || 0,                      /* ponto de entrada dentro da fonte */
      srcDur: o.srcDur || 0,              /* 0 = fonte sem duração (imagem, ajuste) */
      enabled: true, locked: false,
      /* ---------------------------------------------------------- TEMPO
         O clipe deixou de tocar sempre para a frente e sempre em 1×.
           speed     multiplicador da velocidade da fonte
           timeMode  0 normal · 1 reverso · 2 vai-e-volta · 3 congelado    */
      speed: 1,
      timeMode: 0,
      motion: VE.newMotion(),
      fit: o.fit || 'contain',
      flipX: false, flipY: false, blend: 0,
      /* -------------------------------------------------- COMPOSIÇÃO
         Um clipe de vídeo é uma CAMADA: além de aparecer em algum lugar
         do quadro, ela conversa com o que está embaixo. `layer` guarda
         essa conversa — preenchimento, espaço de cor, faixa de mescla,
         matte, correção de cor e canais. `masks` é o recorte dela.
         Ver `js/comp.js` para a ordem em que tudo isso acontece.     */
      layer: VE.newLayer ? VE.newLayer() : null,
      masks: [],
      volume: 1, muted: false, fadeIn: 0, fadeOut: 0,
      effects: [],
      keys: {},
      transIn: null, transOut: null,
      color: null
    };
  };

  /* clipe de AJUSTE — a camada que afeta tudo que estiver abaixo dela */
  VE.newAdjust = function (start, dur, fxId) {
    var c = VE.newClipObj({ kind: 'adjust', name: 'AJUSTE', start: start, dur: dur });
    if (fxId) VE.addEffect(c, fxId);
    return c;
  };

  /* ---------------- busca ---------------- */
  VE.findClip = function (id) {
    var p = VE.project;
    if (!p) return null;
    for (var i = 0; i < p.tracks.length; i++) {
      var cs = p.tracks[i].clips;
      for (var j = 0; j < cs.length; j++) {
        if (cs[j].id === id) return { clip: cs[j], track: p.tracks[i], ti: i, idx: j };
      }
    }
    return null;
  };

  VE.allClips = function () {
    var out = [];
    if (!VE.project) return out;
    VE.project.tracks.forEach(function (tr) { tr.clips.forEach(function (c) { out.push(c); }); });
    return out;
  };

  VE.clipsAt = function (t) {
    return VE.allClips().filter(function (c) { return t >= c.start && t < c.start + c.dur; });
  };

  /* clipe vizinho na mesma pista (encostado ou não) */
  VE.neighbour = function (clip, dir) {
    var f = VE.findClip(clip.id);
    if (!f) return null;
    var sorted = f.track.clips.slice().sort(function (a, b) { return a.start - b.start; });
    var i = sorted.indexOf(clip);
    return sorted[i + dir] || null;
  };

  /* ---------------- inserção ---------------- */

  /* a pista onde um clipe deste tipo deve cair */
  function classOf(kind) { return kind === 'audio' ? 'audio' : (kind === 'adjust' ? 'fx' : 'video'); }

  VE.tracksOfClass = function (cls) {
    return VE.project.tracks.filter(function (t) {
      return cls === 'audio' ? t.kind === 'audio' : (cls === 'fx' ? t.kind === 'fx' : t.kind === 'video');
    });
  };

  VE.overlaps = function (track, start, dur, ignoreId) {
    var end = start + dur;
    return track.clips.some(function (c) {
      if (ignoreId && c.id === ignoreId) return false;
      return start < c.start + c.dur - 0.0005 && end > c.start + 0.0005;
    });
  };

  /* fim do último clipe de uma pista */
  VE.trackEnd = function (track) {
    var e = 0;
    track.clips.forEach(function (c) { e = Math.max(e, c.start + c.dur); });
    return e;
  };

  /* põe o clipe na pista pedida; se não couber, procura outra e por fim cria */
  VE.insertClip = function (clip, track) {
    var p = VE.project;
    var cls = classOf(clip.kind);
    var cands = track ? [track] : VE.tracksOfClass(cls);
    /* pistas de vídeo: tenta da base para o topo, como faz uma mesa de edição */
    if (!track && cls !== 'audio') cands = cands.slice().reverse();
    for (var i = 0; i < cands.length; i++) {
      if (!cands[i].locked && !VE.overlaps(cands[i], clip.start, clip.dur)) {
        cands[i].clips.push(clip);
        return cands[i];
      }
    }
    var ref = cands.length ? cands[cls === 'audio' ? cands.length - 1 : 0] : null;
    var nt = VE.addTrack(cls, ref ? ref.id : null, cls === 'audio');
    nt.clips.push(clip);
    return nt;
  };

  /* SOBREPOR: o clipe entra POR CIMA, no instante pedido.
     É o caminho da tipografia e de qualquer coisa que precise ficar na frente:
     procura a pista de vídeo mais ALTA que esteja livre naquele intervalo e,
     se não houver nenhuma, cria uma pista nova no topo do grupo de vídeo.   */
  VE.insertOver = function (clip, t) {
    clip.start = Math.max(0, t == null ? VE.project.time : t);
    if (clip.start + clip.dur > VE.MAXDUR) clip.dur = Math.max(0.2, VE.MAXDUR - clip.start);
    var cands = VE.tracksOfClass('video');          /* já vem do topo para a base */
    for (var i = 0; i < cands.length; i++) {
      if (!cands[i].locked && !VE.overlaps(cands[i], clip.start, clip.dur)) {
        cands[i].clips.push(clip);
        VE.growToFit();
        return cands[i];
      }
    }
    var nt = VE.addTrack('video');                  /* entra no topo do grupo */
    nt.clips.push(clip);
    VE.growToFit();
    return nt;
  };

  /* ACRESCENTAR: o novo clipe entra DEPOIS do último da pista.
     É o comportamento que o usuário espera ao jogar vários vídeos na mesma
     pista: [VÍDEO A][VÍDEO B][VÍDEO C] — e não uma camada nova por arquivo. */
  VE.appendClip = function (clip, cls) {
    cls = cls || classOf(clip.kind);
    var cands = VE.tracksOfClass(cls);
    var tr = null;
    for (var i = cands.length - 1; i >= 0; i--) { if (!cands[i].locked) { tr = cands[i]; break; } }
    if (!tr) tr = VE.addTrack(cls);
    clip.start = VE.trackEnd(tr);
    if (clip.start + clip.dur > VE.MAXDUR) clip.dur = Math.max(0.2, VE.MAXDUR - clip.start);
    tr.clips.push(clip);
    VE.growToFit();
    return tr;
  };

  /* ---------------- edição temporal ---------------- */

  VE.moveClip = function (id, newStart, newTrack) {
    var f = VE.findClip(id);
    if (!f || f.clip.locked || f.track.locked) return false;
    var c = f.clip;
    newStart = Math.max(0, newStart);
    var tr = newTrack || f.track;
    if (classOf(c.kind) === 'audio' ? tr.kind !== 'audio' : tr.kind === 'audio') return false;
    if (tr !== f.track) {
      f.track.clips.splice(f.idx, 1);
      tr.clips.push(c);
    }
    c.start = newStart;
    return true;
  };

  /* TRIM: arrasta a borda sem mudar o conteúdo do outro lado.
     side 'l' mexe no ponto de entrada, 'r' no de saída.          */
  VE.trimClip = function (id, side, newEdge) {
    var f = VE.findClip(id);
    if (!f || f.clip.locked) return false;
    var c = f.clip;
    var end = c.start + c.dur;
    if (side === 'l') {
      var lo = 0;
      /* uma fonte com duração não pode recuar antes do próprio começo */
      if (c.srcDur > 0) lo = Math.max(0, c.start - c.in);
      newEdge = Math.max(lo, Math.min(end - 1 / 60, newEdge));
      var d = newEdge - c.start;
      c.start = newEdge;
      c.dur = end - newEdge;
      c.in = Math.max(0, c.in + d);
      /* keyframes seguem o corte: o tempo local de todos anda junto */
      shiftKeys(c, -d);
    } else {
      var hi = VE.MAXDUR;
      if (c.srcDur > 0) hi = c.start + (c.srcDur - c.in);
      newEdge = Math.min(hi, Math.max(c.start + 1 / 60, newEdge));
      c.dur = newEdge - c.start;
    }
    if (c.transIn && c.transIn.dur > c.dur) c.transIn.dur = c.dur;
    if (c.transOut && c.transOut.dur > c.dur) c.transOut.dur = c.dur;
    return true;
  };

  function shiftKeys(c, d) {
    Object.keys(c.keys || {}).forEach(function (k) {
      c.keys[k].forEach(function (kf) { kf.t += d; });
      c.keys[k] = c.keys[k].filter(function (kf) { return kf.t >= -0.5 && kf.t <= c.dur + 0.5; });
      if (!c.keys[k].length) delete c.keys[k];
    });
  }

  /* RIPPLE TRIM: encurta/estica e puxa tudo que vem depois na mesma pista */
  VE.rippleTrim = function (id, side, newEdge) {
    var f = VE.findClip(id);
    if (!f) return false;
    var before = f.clip.start + f.clip.dur;
    var startBefore = f.clip.start;
    if (!VE.trimClip(id, side, newEdge)) return false;
    var delta = side === 'r' ? (f.clip.start + f.clip.dur) - before : f.clip.start - startBefore;
    f.track.clips.forEach(function (c) {
      if (c === f.clip) return;
      if (side === 'r' && c.start >= before - 0.0005) c.start += delta;
      if (side === 'l' && c.start >= startBefore - 0.0005 && c !== f.clip) c.start += delta;
    });
    VE.growToFit();
    return true;
  };

  /* CORTAR NO CURSOR — o S do teclado */
  VE.splitClip = function (id, t) {
    var f = VE.findClip(id);
    if (!f || f.clip.locked) return null;
    var c = f.clip, rel = t - c.start;
    if (rel <= 1 / 120 || rel >= c.dur - 1 / 120) return null;
    var b = VE.cloneClip(c);
    b.start = t;
    b.dur = c.dur - rel;
    b.in = c.in + rel;
    c.dur = rel;
    /* os keyframes vão cada um para o seu lado, com o tempo local corrigido */
    var ka = {}, kb = {};
    Object.keys(c.keys || {}).forEach(function (k) {
      var here = c.keys[k].filter(function (p) { return p.t <= rel + 0.0001; });
      var there = c.keys[k].filter(function (p) { return p.t > rel - 0.0001; })
        .map(function (p) { return { t: Math.max(0, p.t - rel), v: p.v, ease: p.ease, bez: p.bez }; });
      if (here.length) ka[k] = here;
      if (there.length) kb[k] = there;
    });
    c.keys = ka; b.keys = kb;
    /* a transição de saída passa para a segunda metade; a de entrada fica */
    b.transOut = c.transOut; c.transOut = null;
    b.transIn = null;
    f.track.clips.push(b);
    VE.select([b.id]);
    return b;
  };

  /* corta TODOS os clipes que cruzam o cursor (nas pistas destravadas) */
  VE.splitAll = function (t, onlySelected) {
    var made = [];
    VE.project.tracks.forEach(function (tr) {
      if (tr.locked) return;
      tr.clips.slice().forEach(function (c) {
        if (onlySelected && !VE.isSelected(c.id)) return;
        if (t > c.start && t < c.start + c.dur) {
          var b = VE.splitClip(c.id, t);
          if (b) made.push(b);
        }
      });
    });
    return made;
  };

  VE.cloneClip = function (c) {
    var b = JSON.parse(JSON.stringify(c));
    b.id = VE.uid('c');
    (b.effects || []).forEach(function (e) { e.id = VE.uid('e'); });
    return b;
  };

  VE.duplicateClip = function (id) {
    var f = VE.findClip(id);
    if (!f) return null;
    var b = VE.cloneClip(f.clip);
    b.start = f.clip.start + f.clip.dur;
    if (VE.overlaps(f.track, b.start, b.dur)) {
      VE.insertClip(b);
    } else {
      f.track.clips.push(b);
    }
    VE.growToFit();
    VE.select([b.id]);
    return b;
  };

  VE.removeClip = function (id, ripple) {
    var f = VE.findClip(id);
    if (!f || f.clip.locked) return false;
    var start = f.clip.start, dur = f.clip.dur;
    f.track.clips.splice(f.idx, 1);
    if (ripple) {
      f.track.clips.forEach(function (c) { if (c.start >= start) c.start = Math.max(0, c.start - dur); });
    }
    VE.deselect(id);
    return true;
  };

  /* apaga o trecho entre entrada e saída em todas as pistas destravadas */
  VE.liftRange = function (a, b, ripple) {
    if (b <= a) return 0;
    var n = 0;
    VE.project.tracks.forEach(function (tr) {
      if (tr.locked) return;
      tr.clips.slice().forEach(function (c) {
        var s = c.start, e = c.start + c.dur;
        if (e <= a || s >= b) return;
        n++;
        if (s >= a && e <= b) { VE.removeClip(c.id); return; }
        if (s < a && e > b) {                       /* buraco no meio: vira dois */
          var second = VE.splitClip(c.id, a);
          if (second) { var third = VE.splitClip(second.id, b); if (third) VE.removeClip(second.id); }
          return;
        }
        if (s < a) { VE.trimClip(c.id, 'r', a); return; }
        VE.trimClip(c.id, 'l', b);
      });
      if (ripple) {
        tr.clips.forEach(function (c) { if (c.start >= b - 0.0005) c.start -= (b - a); });
      }
    });
    return n;
  };

  /* ============================================================ EFEITOS ==== */

  VE.newEffect = function (fxId) {
    var d = VE.FXBY[fxId];
    return {
      id: VE.uid('e'), fx: fxId, name: d ? d.name : fxId,
      enabled: true, amount: 1,
      params: VE.defaults(fxId),
      mask: VE.newMask()
    };
  };

  VE.addEffect = function (clip, fxId, at) {
    var e = VE.newEffect(fxId);
    if (at == null || at >= clip.effects.length) clip.effects.push(e);
    else clip.effects.splice(Math.max(0, at), 0, e);
    return e;
  };

  VE.findEffect = function (clip, effId) {
    for (var i = 0; i < clip.effects.length; i++) if (clip.effects[i].id === effId) return clip.effects[i];
    return null;
  };

  VE.removeEffect = function (clip, effId) {
    for (var i = 0; i < clip.effects.length; i++) {
      if (clip.effects[i].id === effId) {
        clip.effects.splice(i, 1);
        /* leva junto os keyframes que pertenciam a este efeito */
        Object.keys(clip.keys || {}).forEach(function (k) {
          if (k.indexOf('fx.' + effId + '.') === 0) delete clip.keys[k];
        });
        return true;
      }
    }
    return false;
  };

  VE.moveEffect = function (clip, effId, dir) {
    for (var i = 0; i < clip.effects.length; i++) {
      if (clip.effects[i].id === effId) {
        var j = i + dir;
        if (j < 0 || j >= clip.effects.length) return false;
        var t = clip.effects[i]; clip.effects[i] = clip.effects[j]; clip.effects[j] = t;
        return true;
      }
    }
    return false;
  };

  VE.duplicateEffect = function (clip, effId) {
    var e = VE.findEffect(clip, effId);
    if (!e) return null;
    var c = JSON.parse(JSON.stringify(e));
    c.id = VE.uid('e');
    clip.effects.splice(clip.effects.indexOf(e) + 1, 0, c);
    return c;
  };

  /* ========================================================= KEYFRAMES ===== */
  /* Chave de propriedade:
       motion.x  motion.y  motion.scale  motion.sx  motion.sy
       motion.rot  motion.ax  motion.ay  motion.opacity
       volume
       fx.<idDoEfeito>.<parametro>     fx.<idDoEfeito>.amount              */

  VE.KEYPATH = {
    'motion.x': { label: 'POSIÇÃO X', unit: 'px', group: 'MOTION' },
    'motion.y': { label: 'POSIÇÃO Y', unit: 'px', group: 'MOTION' },
    'motion.scale': { label: 'ESCALA', unit: '%', group: 'MOTION' },
    'motion.sx': { label: 'ESCALA X', unit: '%', group: 'MOTION' },
    'motion.sy': { label: 'ESCALA Y', unit: '%', group: 'MOTION' },
    'motion.rot': { label: 'ROTAÇÃO', unit: '°', group: 'MOTION' },
    'motion.ax': { label: 'ÂNCORA X', unit: '', group: 'MOTION' },
    'motion.ay': { label: 'ÂNCORA Y', unit: '', group: 'MOTION' },
    'motion.opacity': { label: 'OPACIDADE', unit: '%', group: 'MOTION' },
    'volume': { label: 'VOLUME', unit: '%', group: 'ÁUDIO' }
  };

  VE.readProp = function (clip, path) {
    if (path === 'volume') return clip.volume;
    if (path.indexOf('layer.') === 0 || path.indexOf('masks.') === 0) return VE.layerRead(clip, path);
    if (path.indexOf('motion.') === 0) return clip.motion[path.slice(7)];
    if (path.indexOf('fx.') === 0) {
      var bits = path.split('.');
      var e = VE.findEffect(clip, bits[1]);
      if (!e) return 0;
      if (bits[2] === 'amount') return e.amount;
      if (bits[2] === 'mask') return e.mask[bits[3]];
      return e.params[bits[2]];
    }
    return clip[path];
  };

  VE.writeProp = function (clip, path, v) {
    if (path === 'volume') { clip.volume = v; return; }
    if (path.indexOf('layer.') === 0 || path.indexOf('masks.') === 0) { VE.layerWrite(clip, path, v); return; }
    if (path.indexOf('motion.') === 0) { clip.motion[path.slice(7)] = v; return; }
    if (path.indexOf('fx.') === 0) {
      var bits = path.split('.');
      var e = VE.findEffect(clip, bits[1]);
      if (!e) return;
      if (bits[2] === 'amount') e.amount = v;
      else if (bits[2] === 'mask') e.mask[bits[3]] = v;
      else e.params[bits[2]] = v;
      return;
    }
    clip[path] = v;
  };

  VE.hasKeys = function (clip, path) { return !!(clip.keys && clip.keys[path] && clip.keys[path].length); };

  VE.keyList = function (clip, path) {
    return (clip.keys && clip.keys[path]) ? clip.keys[path] : [];
  };

  /* valor de uma propriedade num instante LOCAL do clipe */
  /* ------------------------------------------------------- ÁUDIO REATIVO
     Um mapeamento de áudio soma-se ao valor da propriedade NO MOMENTO DA
     LEITURA — não escreve no clipe. Assim o som pode mexer em posição,
     escala, opacidade ou em qualquer parâmetro de efeito sem apagar o
     valor que você ajustou à mão e sem criar keyframe nenhum. Desligar o
     mapeamento devolve a imagem exatamente como estava.               */
  function somaReativa(clip, path, v) {
    if (!clip.react || !clip.react.length) return v;
    for (var i = 0; i < clip.react.length; i++) {
      var m = clip.react[i];
      if (!m.on || m.path !== path) continue;
      v += (VE.reactValue ? VE.reactValue(m) : 0);
    }
    return v;
  }

  VE.valueAt = function (clip, path, localT) {
    var ks = clip.keys && clip.keys[path];
    var base = VE.readProp(clip, path);
    if (!ks || !ks.length) return somaReativa(clip, path, base);
    if (ks.length === 1) return somaReativa(clip, path, ks[0].v);
    var s = ks;
    if (localT <= s[0].t) return somaReativa(clip, path, s[0].v);
    if (localT >= s[s.length - 1].t) return somaReativa(clip, path, s[s.length - 1].v);
    for (var i = 0; i < s.length - 1; i++) {
      if (localT >= s[i].t && localT <= s[i + 1].t) {
        var span = s[i + 1].t - s[i].t;
        var f = span > 0.0001 ? (localT - s[i].t) / span : 0;
        if (s[i].ease === 'hold') return somaReativa(clip, path, s[i].v);
        f = VE.easeFactor(s[i], f);
        return somaReativa(clip, path, s[i].v + (s[i + 1].v - s[i].v) * f);
      }
    }
    return somaReativa(clip, path, s[s.length - 1].v);
  };

  /* derivada aproximada — alimenta o gráfico de VELOCIDADE */
  VE.velocityAt = function (clip, path, localT) {
    var h = 1 / 120;
    return (VE.valueAt(clip, path, localT + h) - VE.valueAt(clip, path, localT - h)) / (2 * h);
  };

  VE.setKey = function (clip, path, localT, v, ease) {
    clip.keys = clip.keys || {};
    var ks = clip.keys[path] = clip.keys[path] || [];
    localT = Math.max(0, Math.min(clip.dur, localT));
    if (v === undefined) v = VE.valueAt(clip, path, localT);
    for (var i = 0; i < ks.length; i++) {
      if (Math.abs(ks[i].t - localT) < 1 / 120) {
        ks[i].v = v;
        if (ease) ks[i].ease = ease;
        return ks[i];
      }
    }
    var k = { t: localT, v: v, ease: ease || 'easeInOut' };
    ks.push(k);
    ks.sort(function (a, b) { return a.t - b.t; });
    return k;
  };

  VE.removeKey = function (clip, path, localT) {
    var ks = clip.keys && clip.keys[path];
    if (!ks) return false;
    for (var i = 0; i < ks.length; i++) {
      if (Math.abs(ks[i].t - localT) < 1 / 60) {
        ks.splice(i, 1);
        if (!ks.length) delete clip.keys[path];
        return true;
      }
    }
    return false;
  };

  VE.moveKey = function (clip, path, fromT, toT) {
    var ks = clip.keys && clip.keys[path];
    if (!ks) return false;
    for (var i = 0; i < ks.length; i++) {
      if (Math.abs(ks[i].t - fromT) < 0.0005) {
        ks[i].t = Math.max(0, Math.min(clip.dur, toT));
        ks.sort(function (a, b) { return a.t - b.t; });
        return true;
      }
    }
    return false;
  };

  VE.clearKeys = function (clip, path) { if (clip.keys) delete clip.keys[path]; };

  /* liga/desliga a animação de uma propriedade — o cronômetro do Premiere */
  VE.toggleAnim = function (clip, path, localT) {
    if (VE.hasKeys(clip, path)) {
      var v = VE.valueAt(clip, path, localT);
      VE.clearKeys(clip, path);
      VE.writeProp(clip, path, v);
      return false;
    }
    VE.setKey(clip, path, localT, VE.readProp(clip, path));
    return true;
  };

  /* ========================================================= MARCADORES ==== */
  VE.addMarker = function (t, name) {
    var m = { id: VE.uid('mk'), t: Math.max(0, t), name: name || '', note: '' };
    VE.project.markers.push(m);
    VE.project.markers.sort(function (a, b) { return a.t - b.t; });
    return m;
  };
  VE.removeMarker = function (id) {
    var ms = VE.project.markers;
    for (var i = 0; i < ms.length; i++) if (ms[i].id === id) { ms.splice(i, 1); return true; }
    return false;
  };
  VE.nearestMarker = function (t, dir) {
    var ms = VE.project.markers.slice().sort(function (a, b) { return a.t - b.t; });
    if (dir > 0) { for (var i = 0; i < ms.length; i++) if (ms[i].t > t + 0.001) return ms[i]; }
    else { for (var j = ms.length - 1; j >= 0; j--) if (ms[j].t < t - 0.001) return ms[j]; }
    return null;
  };

  /* ========================================================== TRANSIÇÕES === */

  VE.setTransition = function (clipId, side, type, dur) {
    var f = VE.findClip(clipId);
    if (!f) return null;
    var c = f.clip;
    if (!type) { if (side === 'in') c.transIn = null; else c.transOut = null; return null; }
    var d = Math.max(1 / 30, Math.min(c.dur * 0.9, dur || 0.5));
    var tr = { id: VE.uid('tx'), type: type, dur: d, params: VE.transDefaults(type) };
    if (side === 'in') c.transIn = tr; else c.transOut = tr;
    return tr;
  };

  /* aplica a mesma transição nos dois lados de um ponto de corte */
  VE.applyTransitionAtCut = function (clipId, side, type, dur) {
    var f = VE.findClip(clipId);
    if (!f) return null;
    var c = f.clip;
    var tr = VE.setTransition(clipId, side, type, dur);
    var nb = VE.neighbour(c, side === 'in' ? -1 : 1);
    if (nb && Math.abs((side === 'in' ? c.start - (nb.start + nb.dur) : nb.start - (c.start + c.dur))) < 0.01) {
      var other = VE.setTransition(nb.id, side === 'in' ? 'out' : 'in', type, dur);
      if (other && tr) { other.params = JSON.parse(JSON.stringify(tr.params)); other.link = tr.id; tr.link = other.id; }
    }
    return tr;
  };

  VE.setTransitionDur = function (clipId, side, dur) {
    var f = VE.findClip(clipId);
    if (!f) return false;
    var c = f.clip;
    var tr = side === 'in' ? c.transIn : c.transOut;
    if (!tr) return false;
    tr.dur = Math.max(1 / 60, Math.min(c.dur * 0.95, dur));
    /* mantém o outro lado do corte com a mesma duração */
    var nb = VE.neighbour(c, side === 'in' ? -1 : 1);
    if (nb) {
      var ot = side === 'in' ? nb.transOut : nb.transIn;
      if (ot && (ot.link === tr.id || tr.link === ot.id)) ot.dur = Math.min(nb.dur * 0.95, tr.dur);
    }
    return true;
  };

  /* ========================================================== SELEÇÃO ====== */
  VE.select = function (ids, add) {
    var p = VE.project;
    if (!p) return;
    if (!Array.isArray(ids)) ids = ids ? [ids] : [];
    p.selection = add ? p.selection.concat(ids.filter(function (i) { return p.selection.indexOf(i) < 0; })) : ids.slice();
    p.selKind = p.selection.length ? 'clip' : null;
  };
  VE.toggleSelect = function (id) {
    var p = VE.project, i = p.selection.indexOf(id);
    if (i >= 0) p.selection.splice(i, 1); else p.selection.push(id);
    p.selKind = p.selection.length ? 'clip' : null;
  };
  VE.deselect = function (id) {
    var p = VE.project, i = p.selection.indexOf(id);
    if (i >= 0) p.selection.splice(i, 1);
  };
  VE.clearSelection = function () { if (VE.project) { VE.project.selection = []; VE.project.selKind = null; } };
  VE.isSelected = function (id) { return VE.project && VE.project.selection.indexOf(id) >= 0; };

  /* o clipe "principal" da seleção — o que a ficha técnica mostra */
  VE.selected = function () {
    var p = VE.project;
    if (!p || !p.selection.length) return null;
    var f = VE.findClip(p.selection[p.selection.length - 1]);
    return f ? f.clip : null;
  };
  VE.selectedClips = function () {
    if (!VE.project) return [];
    return VE.project.selection.map(function (id) {
      var f = VE.findClip(id); return f ? f.clip : null;
    }).filter(Boolean);
  };

  /* ================================================== RESOLUÇÃO NO TEMPO === */
  /* Devolve as OPERAÇÕES de composição, da BASE para o TOPO. É isto que o
     motor de render consome. Cada operação é:

       { kind:'clip',   clip, local, opacity, motion, crop, blend, effects[] }
       { kind:'adjust', clip, local, effects[] }                              */

  function resolvedEffects(clip, local, extraFx) {
    var out = [];
    (clip.effects || []).forEach(function (e) {
      if (!e.enabled) return;
      var def = VE.FXBY[e.fx];
      if (!def) return;
      var amt = VE.valueAt(clip, 'fx.' + e.id + '.amount', local);
      if (amt <= 0.0005) return;
      var params = {};
      def.params.forEach(function (pr) {
        var v = e.params[pr.k];
        if (v === undefined) v = pr.def;
        if (pr.t === 'f' || pr.t === 's' || pr.t === 'b' || pr.t === undefined) {
          v = VE.valueAt(clip, 'fx.' + e.id + '.' + pr.k, local);
        }
        params[pr.k] = v;
      });
      var m = e.mask || VE.newMask();
      out.push({
        id: e.fx, effId: e.id, params: params, amount: Math.min(1, amt), local: local,
        mask: {
          shape: m.shape,
          x: VE.valueAt(clip, 'fx.' + e.id + '.mask.x', local),
          y: VE.valueAt(clip, 'fx.' + e.id + '.mask.y', local),
          w: VE.valueAt(clip, 'fx.' + e.id + '.mask.w', local),
          h: VE.valueAt(clip, 'fx.' + e.id + '.mask.h', local),
          ang: VE.valueAt(clip, 'fx.' + e.id + '.mask.ang', local),
          feather: VE.valueAt(clip, 'fx.' + e.id + '.mask.feather', local),
          invert: m.invert
        }
      });
    });
    /* efeitos injetados por transições entram por último, sobre o resultado */
    (extraFx || []).forEach(function (fx) {
      var def = VE.FXBY[fx.id];
      if (!def) return;
      var params = {};
      def.params.forEach(function (pr) {
        params[pr.k] = (fx.params && fx.params[pr.k] !== undefined) ? fx.params[pr.k] : pr.def;
      });
      out.push({
        id: fx.id, effId: 'trans', params: params, amount: fx.amount === undefined ? 1 : fx.amount,
        local: local, mask: VE.newMask()
      });
    });
    return out;
  }

  /* modificadores de transição ativos neste instante para um clipe */
  function transitionMods(clip, local) {
    var mods = [];
    if (clip.transIn && local < clip.transIn.dur) {
      mods.push(VE.transMod(clip.transIn, 'in', local / clip.transIn.dur));
    }
    if (clip.transOut && local > clip.dur - clip.transOut.dur) {
      mods.push(VE.transMod(clip.transOut, 'out', (local - (clip.dur - clip.transOut.dur)) / clip.transOut.dur));
    }
    return mods.filter(Boolean);
  }

  VE.resolveOps = function (t) {
    var p = VE.project, out = [];
    if (!p) return out;
    /* de baixo para cima: o índice maior é a pista mais baixa */
    for (var i = p.tracks.length - 1; i >= 0; i--) {
      var tr = p.tracks[i];
      if (tr.kind === 'audio') continue;
      if (!VE.trackVisible(tr)) continue;
      for (var j = 0; j < tr.clips.length; j++) {
        var c = tr.clips[j];
        if (!c.enabled) continue;
        if (t < c.start - 0.0001 || t >= c.start + c.dur) continue;
        var local = t - c.start;

        if (c.kind === 'adjust') {
          var fxA = resolvedEffects(c, local, null);
          if (fxA.length) out.push({ kind: 'adjust', clip: c, track: tr, local: local, effects: fxA });
          continue;
        }

        var mods = transitionMods(c, local);
        var op = VE.valueAt(c, 'motion.opacity', local);
        var mo = {
          x: VE.valueAt(c, 'motion.x', local),
          y: VE.valueAt(c, 'motion.y', local),
          scale: VE.valueAt(c, 'motion.scale', local),
          sx: VE.valueAt(c, 'motion.sx', local),
          sy: VE.valueAt(c, 'motion.sy', local),
          rot: VE.valueAt(c, 'motion.rot', local),
          ax: VE.valueAt(c, 'motion.ax', local),
          ay: VE.valueAt(c, 'motion.ay', local)
        };
        var crop = null, injected = [];
        mods.forEach(function (m) {
          if (m.op !== undefined) op *= m.op;
          if (m.dx) mo.x += m.dx;
          if (m.dy) mo.y += m.dy;
          if (m.sc) mo.scale *= m.sc;
          if (m.scx) mo.sx *= m.scx;
          if (m.scy) mo.sy *= m.scy;
          if (m.rot) mo.rot += m.rot;
          if (m.crop) crop = m.crop;
          if (m.fx) injected.push(m.fx);
        });
        /* fades de opacidade do próprio clipe */
        if (c.fadeIn > 0.001 && local < c.fadeIn) op *= local / c.fadeIn;
        if (c.fadeOut > 0.001 && local > c.dur - c.fadeOut) op *= Math.max(0, (c.dur - local) / c.fadeOut);
        if (op <= 0.001) continue;

        out.push({
          kind: 'clip', clip: c, track: tr, local: local,
          opacity: Math.max(0, Math.min(1, op)),
          motion: mo, crop: crop, blend: c.blend,
          /* `resolveLayer` devolve null quando a camada está neutra — e é
             esse null que faz o motor correr pelo caminho de uma passada. */
          layer: VE.resolveLayer ? VE.resolveLayer(c, local) : null,
          effects: resolvedEffects(c, local, injected)
        });
      }
    }
    return out;
  };

  /* clipes de áudio (e vídeo com som) tocando agora */
  VE.activeAudio = function (t) {
    var p = VE.project, out = [];
    if (!p) return out;
    p.tracks.forEach(function (tr) {
      if (!VE.trackAudible(tr)) return;
      tr.clips.forEach(function (c) {
        if (c.kind !== 'audio' && c.kind !== 'video') return;
        if (c.muted || !c.enabled) return;
        if (t < c.start - 0.0001 || t >= c.start + c.dur) return;
        out.push({ clip: c, track: tr, local: t - c.start });
      });
    });
    return out;
  };

  /* volume final de um clipe agora (keyframes + fades + pista) */
  VE.audioGain = function (c, local) {
    var g = VE.valueAt(c, 'volume', local);
    if (c.fadeIn > 0.001 && local < c.fadeIn) g *= local / c.fadeIn;
    if (c.fadeOut > 0.001 && local > c.dur - c.fadeOut) g *= Math.max(0, (c.dur - local) / c.fadeOut);
    return Math.max(0, Math.min(2, g));
  };

  /* compatibilidade: quantos efeitos estão ativos no instante t */
  VE.resolve = function (t) {
    var n = [];
    VE.resolveOps(t).forEach(function (o) { o.effects.forEach(function (e) { n.push(e); }); });
    return n;
  };

  /* ========================================================== NESTING ====== */
  /* Transformar uma seleção em COMPOSIÇÃO: os clipes saem da sequência e
     passam a viver dentro de uma sub-sequência, que entra como um clipe só. */
  VE.nestSelection = function (name) {
    var p = VE.project;
    var clips = VE.selectedClips();
    if (clips.length < 1) return null;
    var a = Infinity, b = -Infinity;
    clips.forEach(function (c) { a = Math.min(a, c.start); b = Math.max(b, c.start + c.dur); });
    var id = VE.uid('comp');
    var inner = { id: id, name: name || ('COMPOSIÇÃO ' + (Object.keys(p.comps).length + 1)), tracks: [], duration: b - a };
    /* preserva a ordem de pistas de origem */
    var byTrack = {};
    clips.forEach(function (c) {
      var f = VE.findClip(c.id);
      if (!f) return;
      if (!byTrack[f.track.id]) byTrack[f.track.id] = { kind: f.track.kind, clips: [] };
      var cc = JSON.parse(JSON.stringify(c));
      cc.start -= a;
      byTrack[f.track.id].clips.push(cc);
    });
    p.tracks.forEach(function (tr) {
      if (!byTrack[tr.id]) return;
      var nt = VE.newTrackObj(byTrack[tr.id].kind, tr.name);
      nt.clips = byTrack[tr.id].clips;
      inner.tracks.push(nt);
    });
    p.comps[id] = inner;
    clips.forEach(function (c) { VE.removeClip(c.id); });
    var host = VE.newClipObj({ kind: 'comp', name: inner.name, comp: id, start: a, dur: b - a, srcDur: b - a });
    VE.insertClip(host);
    VE.select([host.id]);
    return host;
  };

  /* ============================================================ HISTÓRICO == */
  VE.hist = []; VE.histIdx = -1;

  function snap() {
    var p = VE.project;
    return JSON.stringify({
      tracks: p.tracks, markers: p.markers, comps: p.comps,
      duration: p.duration, canvas: p.canvas, fps: p.fps,
      selection: p.selection, selKind: p.selKind
    });
  }

  VE.pushHistory = function () {
    if (!VE.project) return;
    var s = snap();
    if (VE.histIdx >= 0 && VE.hist[VE.histIdx] === s) return;
    VE.hist = VE.hist.slice(0, VE.histIdx + 1);
    VE.hist.push(s);
    if (VE.hist.length > 90) VE.hist.shift();
    VE.histIdx = VE.hist.length - 1;
  };

  function restore(s) {
    var o = JSON.parse(s), p = VE.project;
    p.tracks = o.tracks; p.markers = o.markers || []; p.comps = o.comps || {};
    p.duration = o.duration; p.canvas = o.canvas;
    p.fps = o.fps; p.selection = o.selection || []; p.selKind = o.selKind;
    VE.emit('project');
  }

  VE.undo = function () { if (VE.histIdx > 0) { VE.histIdx--; restore(VE.hist[VE.histIdx]); return true; } return false; };
  VE.redo = function () { if (VE.histIdx < VE.hist.length - 1) { VE.histIdx++; restore(VE.hist[VE.histIdx]); return true; } return false; };

  /* ================================================== SALVAR / ABRIR ======= */
  VE.serialize = function () {
    var p = VE.project;
    var tracks = JSON.parse(JSON.stringify(p.tracks));
    tracks.forEach(function (tr) {
      tr.clips.forEach(function (c) {
        var s = VE.sources && VE.sources[c.src];
        c.srcInfo = s ? { kind: s.kind, name: s.name, w: s.w, h: s.h, text: s.text || null } : null;
      });
    });
    return JSON.stringify({
      app: 'rgb_lab', version: 5, name: p.name,
      canvas: p.canvas, duration: p.duration, fps: p.fps,
      tracks: tracks, markers: p.markers, comps: p.comps
    }, null, 1);
  };

  /* --------- migração dos formatos antigos (v2 / v3) --------- */
  function migrate(o) {
    var tracks = [];
    /* cada camada de mídia antiga vira um clipe numa pista própria,
       preservando a ordem: a primeira da lista era a de cima          */
    (o.media || []).forEach(function (m) {
      var kind = m.kind || 'video';
      var tr = VE.newTrackObj(kind === 'audio' ? 'audio' : 'video');
      var c = VE.newClipObj({
        kind: kind, name: m.name, src: m.src,
        start: m.start || 0, dur: m.dur || 2,
        in: (m.trim && m.trim.in) || 0, fit: m.fit || 'contain'
      });
      c.motion.x = m.x || 0; c.motion.y = m.y || 0;
      c.motion.scale = m.scale === undefined ? 1 : m.scale;
      c.motion.rot = m.rot || 0;
      c.motion.opacity = m.opacity === undefined ? 1 : m.opacity;
      c.flipX = !!m.flipX; c.flipY = !!m.flipY; c.blend = VE.migraBlend(m.blend || 0);
      c.enabled = m.visible !== false; c.locked = !!m.locked;
      c.muted = !!m.muted; c.volume = m.volume === undefined ? 1 : m.volume;
      /* os keyframes antigos usavam nomes soltos */
      Object.keys(m.keys || {}).forEach(function (k) {
        var path = ({ x: 'motion.x', y: 'motion.y', scale: 'motion.scale', rot: 'motion.rot', opacity: 'motion.opacity' })[k];
        if (!path) return;
        c.keys[path] = m.keys[k].map(function (p) { return { t: p.t, v: p.v, ease: 'easeInOut' }; });
      });
      tr.clips.push(c);
      tracks.push(tr);
    });
    /* cada pista de efeito antiga vira uma pista FX de camadas de ajuste */
    (o.tracks || []).forEach(function (old) {
      var tr = VE.newTrackObj('fx', old.name);
      tr.visible = old.visible !== false;
      (old.clips || []).forEach(function (oc) {
        var c = VE.newClipObj({ kind: 'adjust', name: oc.name || oc.fx, start: oc.start, dur: oc.dur });
        c.enabled = oc.enabled !== false;
        c.fadeIn = oc.fadeIn || 0; c.fadeOut = oc.fadeOut || 0;
        var e = VE.newEffect(oc.fx);
        e.amount = oc.amount === undefined ? 1 : oc.amount;
        e.params = oc.params || VE.defaults(oc.fx);
        if (oc.mask) e.mask = oc.mask;
        c.effects = [e];
        Object.keys(oc.keys || {}).forEach(function (k) {
          var path = (k === 'amount') ? 'fx.' + e.id + '.amount'
            : (k.indexOf('mask.') === 0 ? 'fx.' + e.id + '.mask.' + k.slice(5) : 'fx.' + e.id + '.' + k);
          c.keys[path] = oc.keys[k].map(function (p) { return { t: p.t, v: p.v, ease: 'easeInOut' }; });
        });
        tr.clips.push(c);
      });
      tracks.unshift(tr);        /* efeitos vão para o topo */
    });
    return tracks;
  }

  VE.deserialize = function (txt) {
    var o = JSON.parse(txt);
    var versaoArq = o && o.version ? o.version : 0;
    if (!o || (o.app !== 'rgb_lab' && o.app !== 'videorte')) throw new Error('arquivo de projeto inválido');
    var p = VE.project;
    /* o nome ia junto no arquivo desde sempre e nunca voltava: abrir um
       projeto salvo trocava o nome dele por "composição".              */
    if (o.name) p.name = o.name;
    p.fps = o.fps || 30;
    p.duration = Math.min(VE.MAXDUR, o.duration || 10);
    if (o.canvas) p.canvas = o.canvas;
    p.markers = o.markers || [];
    p.comps = o.comps || {};

    if (o.version >= 4 && o.tracks && o.tracks.length && o.tracks[0].clips !== undefined && o.tracks[0].kind) {
      p.tracks = o.tracks;
    } else {
      p.tracks = migrate(o);
    }
    /* remove clipes cuja fonte não existe mais nesta sessão */
    p.tracks.forEach(function (tr) {
      tr.clips = tr.clips.filter(function (c) {
        if (!c.src) return true;                     /* ajuste / composição */
        return VE.sources && VE.sources[c.src];
      });
      tr.clips.forEach(function (c) {
        c.motion = c.motion || VE.newMotion();
        c.effects = c.effects || [];
        c.keys = c.keys || {};
        /* projeto salvo antes da composição por camadas: o bloco não
           existia e o número do modo de mistura era de outra lista.  */
        if (!c.layer) {
          if (versaoArq < 5) c.blend = VE.migraBlend(c.blend);
          VE.ensureLayer(c);
        } else VE.ensureLayer(c);
      });
    });
    if (!p.tracks.length) { p.tracks = [VE.newTrackObj('video'), VE.newTrackObj('audio')]; }
    VE.clearSelection();
    VE.pushHistory();
    VE.emit('project');
    return o;
  };

  /* ================================================ COMPATIBILIDADE ======== */
  /* app.js / audio.js / type.js chamam VE.addMedia; aqui isso vira "acrescentar
     um clipe ao fim da pista", que é o comportamento de mesa de edição.       */
  VE.addMedia = function (o) {
    var s = VE.sources && VE.sources[o.src];
    var c = VE.newClipObj({
      kind: o.kind, name: o.name || o.kind, src: o.src,
      start: o.start != null ? o.start : 0,
      dur: Math.min(o.dur != null ? o.dur : VE.duration(), VE.MAXDUR),
      in: o.trimIn || 0,
      srcDur: s ? (s.duration || 0) : 0,
      fit: o.fit || 'contain'
    });
    if (o.over) VE.insertOver(c, o.start != null ? o.start : VE.project.time);
    else if (o.start != null) VE.insertClip(c);
    else VE.appendClip(c);
    VE.select([c.id]);
    return c;
  };

  VE.removeMedia = function (id) { return VE.removeClip(id); };
  VE.findMedia = function (id) { var f = VE.findClip(id); return f ? f.clip : null; };

  /* estilos prontos: viram uma camada de AJUSTE com a cadeia inteira dentro */
  VE.applyStyle = function (styleId) {
    var st = VE.STYLES.filter(function (s) { return s.id === styleId; })[0];
    if (!st) return;
    var total = VE.duration();
    var c = VE.newClipObj({ kind: 'adjust', name: (st.name || 'ESTILO').toUpperCase(), start: 0, dur: total });
    st.fx.forEach(function (pair) {
      var e = VE.addEffect(c, pair[0]);
      Object.keys(pair[1]).forEach(function (k) { e.params[k] = pair[1][k]; });
    });
    var fxTracks = VE.tracksOfClass('fx');
    var tr = fxTracks[0] || VE.addTrack('fx');
    tr.clips.push(c);
    VE.select([c.id]);
    return c;
  };

})(window.VE);
