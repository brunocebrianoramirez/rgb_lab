/* ============================================================
   rgb_lab — MOTION · CONTROLES DE EFEITO · KEYFRAMES
   ------------------------------------------------------------
   Este é o painel que fica à direita quando um clipe está selecionado.
   Ele é o equivalente ao "Effect Controls": mostra o clipe inteiro como
   uma pilha de propriedades animáveis.

     TEMPO       início, duração, entrada na fonte, timecode
     MOTION      posição · escala · rotação · âncora · opacidade
     ÁUDIO       volume · mudo · fades
     TRANSIÇÕES  entrada e saída, com parâmetros próprios
     EFEITOS     a pilha: ordem, ligar/desligar, duplicar, remover
     GRÁFICOS    valor e velocidade da propriedade em foco

   Toda propriedade tem um CRONÔMETRO (◆). Ligado, qualquer mudança de
   valor vira keyframe no instante do cursor.
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var M = VE.motion = {};
  var focusEff = null;        /* id do efeito aberto na pilha */
  var focusPath = null;       /* propriedade em foco (a que aparece no gráfico) */
  var graphMode = 'value';    /* value | velocity */

  /* ---------------------------------------------------------- EXPORTADOS
     `prop` e `temConv` saem daqui porque a ficha da COMPOSIÇÃO precisa
     desenhar `motion.opacity`, e essa propriedade é GUARDADA em 0..1 mas
     MOSTRADA em 0..100 %. Quem desenhar um trilho próprio em 0..1 para ela
     vai ver o ouvinte compartilhado dividir o valor por 100 — e a camada
     some. Uma propriedade com conversão tem um dono só.                */
  M.temConv = function (path) { return !!CONV[path]; };

  M.focusEffect = function () {
    var c = VE.selected();
    if (!c || !focusEff) return null;
    var e = VE.findEffect(c, focusEff);
    return e ? { clip: c, effect: e } : null;
  };

  /* ============================================== CONVERSORES ============= */
  /* o modelo guarda deslocamento normalizado; a interface mostra pixels,
     porque é assim que se pensa em "esse texto entra no X 540".            */
  function W() { return VE.project ? VE.project.canvas.w : 1920; }
  function H() { return VE.project ? VE.project.canvas.h : 1080; }

  var CONV = {
    'motion.x': { to: function (v) { return (0.5 + v) * W(); }, from: function (px) { return px / W() - 0.5; }, dec: 0, unit: 'px', min: -W, max: function () { return W() * 2; }, step: 1 },
    'motion.y': { to: function (v) { return (0.5 - v) * H(); }, from: function (px) { return 0.5 - px / H(); }, dec: 0, unit: 'px', min: function () { return -H(); }, max: function () { return H() * 2; }, step: 1 },
    'motion.scale': { to: function (v) { return v * 100; }, from: function (p) { return p / 100; }, dec: 1, unit: '%', min: 1, max: 600, step: 0.5 },
    'motion.sx': { to: function (v) { return v * 100; }, from: function (p) { return p / 100; }, dec: 1, unit: '%', min: 1, max: 400, step: 0.5 },
    'motion.sy': { to: function (v) { return v * 100; }, from: function (p) { return p / 100; }, dec: 1, unit: '%', min: 1, max: 400, step: 0.5 },
    'motion.rot': { to: function (v) { return v; }, from: function (v) { return v; }, dec: 1, unit: '°', min: -720, max: 720, step: 0.5 },
    'motion.ax': { to: function (v) { return v * 100; }, from: function (p) { return p / 100; }, dec: 1, unit: '%', min: -100, max: 100, step: 1 },
    'motion.ay': { to: function (v) { return v * 100; }, from: function (p) { return p / 100; }, dec: 1, unit: '%', min: -100, max: 100, step: 1 },
    'motion.opacity': { to: function (v) { return v * 100; }, from: function (p) { return p / 100; }, dec: 1, unit: '%', min: 0, max: 100, step: 0.5 },
    'volume': { to: function (v) { return v * 100; }, from: function (p) { return p / 100; }, dec: 0, unit: '%', min: 0, max: 200, step: 1 }
  };
  function num(x) { return typeof x === 'function' ? x() : x; }

  function esc(s) { return VE.panels.ui.esc(s); }

  /* ============================================== LINHAS ================== */

  /* uma propriedade animável: rótulo · cronômetro · navegação · valor · trilho */
  function prop(clip, path, label) {
    var cv = CONV[path];
    var lt = localT(clip);
    var raw = VE.valueAt(clip, path, lt);
    var v = cv ? cv.to(raw) : raw;
    var anim = VE.hasKeys(clip, path);
    var onKey = anim && !!keyAt(clip, path, lt);
    var mn = cv ? num(cv.min) : 0, mx = cv ? num(cv.max) : 1, st = cv ? cv.step : 0.01;
    return '<div class="mprop' + (focusPath === path ? ' focus' : '') + '" data-path="' + esc(path) + '">' +
      '<div class="mprop-h">' +
      '<button class="stopw' + (anim ? ' on' : '') + '" data-anim="' + esc(path) + '" title="animar (cronômetro)">◆</button>' +
      '<label data-focus="' + esc(path) + '">' + esc(label) + '</label>' +
      (anim ? '<span class="kfnav">' +
        '<button data-kprev="' + esc(path) + '" title="keyframe anterior">◂</button>' +
        '<button class="' + (onKey ? 'on' : '') + '" data-ktog="' + esc(path) + '" title="pôr/tirar keyframe aqui">◆</button>' +
        '<button data-knext="' + esc(path) + '" title="próximo keyframe">▸</button>' +
        '</span>' : '') +
      '<input class="field num mval" data-mnum="' + esc(path) + '" value="' + fmt(v, cv ? cv.dec : 3) + '">' +
      '<i class="munit">' + (cv ? cv.unit : '') + '</i>' +
      '</div>' +
      '<input type="range" class="mrange" data-mrange="' + esc(path) + '" min="' + mn + '" max="' + mx + '" step="' + st + '" value="' + v + '">' +
      '</div>';
  }

  function fmt(v, d) {
    if (typeof v !== 'number' || !isFinite(v)) return '0';
    return v.toFixed(d === undefined ? 2 : d);
  }

  M.prop = function (clip, path, label) { return prop(clip, path, label); };

  function localT(clip) {
    return Math.max(0, Math.min(clip.dur, VE.project.time - clip.start));
  }

  function keyAt(clip, path, lt) {
    var ks = VE.keyList(clip, path);
    for (var i = 0; i < ks.length; i++) if (Math.abs(ks[i].t - lt) < 1 / 40) return ks[i];
    return null;
  }

  /* todo bloco da coluna é recolhível: a setinha vive no cabeçalho e o
     estado de cada um fica guardado. Assim dá para deixar só MOTION
     aberto, ou só a PILHA DE EFEITOS, e trabalhar num de cada vez.   */
  function plate(title, body, extra, opts) {
    return VE.panels.plate(title, body, extra, opts);
  }

  /* ========================================== INSPETOR PRINCIPAL ========== */

  M.renderInspector = function (box, clip) {
    var p = VE.project;
    var src = clip.src ? VE.sources[clip.src] : null;
    var f = VE.findClip(clip.id);
    var track = f ? f.track : null;
    var kindLabel = {
      video: 'VÍDEO', image: 'IMAGEM', webcam: 'CÂMERA', type: 'TIPOGRAFIA',
      audio: 'ÁUDIO', adjust: 'CAMADA DE AJUSTE', comp: 'COMPOSIÇÃO'
    }[clip.kind] || clip.kind.toUpperCase();

    $('#inspTitle').textContent = 'CLIPE · ' + kindLabel;
    $('#inspId').textContent = track ? VE.trackLabel(track) : '—';

    var multi = p.selection.length;
    var h = '';

    if (multi > 1) {
      h += '<div class="plate"><div class="plate-h"><span class="lbl">' + multi + ' CLIPES SELECIONADOS</span><i class="l"></i></div>' +
        '<div class="pnote">as propriedades abaixo pertencem ao último clipe da seleção. mover, apagar e duplicar valem para todos.</div></div>';
    }

    /* ---------------------------------------------------------- cabeçalho */
    h += '<div class="plate"><div class="plate-h">' +
      '<span class="lbl">' + esc(clip.name) + '</span><i class="l"></i>' +
      '<button class="cmd cmd-sm' + (clip.enabled ? ' active' : '') + '" data-act="toggle">' + (clip.enabled ? 'ON' : 'OFF') + '</button>' +
      '<button class="cmd cmd-sm cmd-cad' + (clip.locked ? ' active' : '') + '" data-act="lock" title="' +
      (clip.locked ? 'Travado — clique para destravar' : 'Destravado — clique para travar') + '">' +
      (VE.tl && VE.tl.iconeCadeado ? VE.tl.iconeCadeado(clip.locked) : (clip.locked ? '▪' : '▫')) + '</button>' +
      '<button class="cmd cmd-sm cmd-danger" data-act="del">✕</button></div>';
    h += '<div class="prow wide"><input class="field" data-rename value="' + esc(clip.name) + '" spellcheck="false"></div>';
    if (src) {
      h += VE.panels.ui.kv('FONTE', esc(src.name));
      h += VE.panels.ui.kv('ORIGINAL', src.w ? src.w + '×' + src.h : '—');
      if (src.duration) h += VE.panels.ui.kv('DURAÇÃO DA FONTE', src.duration.toFixed(2) + ' s');
    }
    if (clip.kind === 'adjust') {
      h += '<div class="pnote">camada de ajuste: os efeitos daqui alcançam <b>tudo o que estiver nas pistas abaixo</b>, ' +
        'só dentro do intervalo em que esta camada existe. arraste as bordas na linha do tempo para mudar o alcance.</div>';
    }
    if (clip.kind === 'comp') {
      h += '<div class="pnote">composição aninhada: um conjunto de clipes tratado como um só. os originais continuam vivos lá dentro.</div>';
    }
    h += '</div>';

    /* ------------------------------------------------------------ legenda */
    h += M.extraFicha(clip);

    /* --------------------------------------------------------------- tempo */
    var tbody = '';
    tbody += VE.panels.ui.kv('ENTRA EM', VE.tl.tc(clip.start));
    tbody += VE.panels.ui.kv('SAI EM', VE.tl.tc(clip.start + clip.dur));
    tbody += VE.panels.ui.kv('DURAÇÃO', VE.tl.tc(clip.dur));
    tbody += VE.panels.ui.rowNum('__start', 'Início (s)', clip.start, 0, VE.MAXDUR, 0.01, false);
    tbody += VE.panels.ui.rowNum('__dur', 'Duração (s)', clip.dur, 0.04, VE.MAXDUR, 0.01, false);
    if (clip.srcDur > 0) {
      tbody += VE.panels.ui.rowNum('__in', 'Entrada na fonte (s)', clip.in, 0, Math.max(0.04, clip.srcDur), 0.01, false);
    }
    /* ---- velocidade e sentido: só faz sentido em mídia com duração ---- */
    if (clip.srcDur > 0 || clip.kind === 'video' || clip.kind === 'audio') {
      tbody += '<div class="subhead">VELOCIDADE E SENTIDO</div>';
      tbody += VE.panels.ui.rowNum('__speed', 'Velocidade (×)', clip.speed === undefined ? 1 : clip.speed, 0.1, 8, 0.01, false);
      tbody += '<div class="pbtns">' + [0.25, 0.5, 1, 2, 4].map(function (v) {
        return '<button class="cmd cmd-sm' + (Math.abs((clip.speed || 1) - v) < 0.001 ? ' active' : '') +
          '" data-speed="' + v + '">' + v + '×</button>';
      }).join('') + '</div>';
      tbody += '<div class="pbtns">' + VE.temposLabel.map(function (lab, i) {
        return '<button class="cmd cmd-sm' + ((clip.timeMode | 0) === i ? ' active' : '') +
          '" data-tmode="' + i + '">' + lab.toUpperCase() + '</button>';
      }).join('') + '</div>';
      var m = clip.timeMode | 0;
      if (m === 1) tbody += '<div class="pnote">reverso: nenhum navegador toca mídia para trás, então o clipe é posicionado quadro a quadro. fica mais duro na prévia e sai exato na exportação frame a frame — <b>sem áudio</b>.</div>';
      else if (m === 2) tbody += '<div class="pnote">vai-e-volta: a primeira metade do clipe vai, a segunda volta. também é posicionado quadro a quadro e sai sem áudio.</div>';
      else if (m === 3) tbody += '<div class="pnote">congelado: o clipe mostra sempre o quadro da entrada na fonte. mude <b>entrada na fonte</b> para escolher qual.</div>';
      else tbody += '<div class="pnote">velocidade normal: o vídeo toca de verdade, com som e com o passo do próprio arquivo.</div>';
    }
    tbody += '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-act="split">CORTAR NO CURSOR</button>' +
      '<button class="cmd cmd-sm" data-act="tostart">LEVAR AO CURSOR</button></div>';
    h += plate('TEMPO', tbody);

    /* -------------------------------------------------------------- motion */
    if (clip.kind !== 'audio' && clip.kind !== 'adjust') {
      var mb = '';
      mb += '<div class="pbtns">' + ['contain', 'cover', 'stretch', 'original'].map(function (fit) {
        return '<button class="cmd cmd-sm' + (clip.fit === fit ? ' active' : '') + '" data-fit="' + fit + '">' +
          ({ contain: 'CABER', cover: 'PREENCHER', stretch: 'ESTICAR', original: '1:1' })[fit] + '</button>';
      }).join('') + '</div>';
      mb += prop(clip, 'motion.x', 'POSIÇÃO X');
      mb += prop(clip, 'motion.y', 'POSIÇÃO Y');
      mb += prop(clip, 'motion.scale', 'ESCALA');
      mb += prop(clip, 'motion.sx', 'ESCALA X');
      mb += prop(clip, 'motion.sy', 'ESCALA Y');
      mb += prop(clip, 'motion.rot', 'ROTAÇÃO');
      mb += prop(clip, 'motion.ax', 'ÂNCORA X');
      mb += prop(clip, 'motion.ay', 'ÂNCORA Y');
      /* opacidade e modo de mistura mudaram para a seção COMPOSIÇÃO: eles
         não descrevem onde a camada está, e sim como ela conversa com o
         que está embaixo. Ver `js/compui.js`.                          */
      mb += '<div class="pbtns">' +
        '<button class="cmd cmd-sm' + (clip.flipX ? ' active' : '') + '" data-flip="x">ESPELHAR X</button>' +
        '<button class="cmd cmd-sm' + (clip.flipY ? ' active' : '') + '" data-flip="y">ESPELHAR Y</button>' +
        '<button class="cmd cmd-sm" data-act="resetmotion">ZERAR</button></div>';
      mb += '<div class="pnote">com o clipe selecionado, arraste a caixa sobre a prévia: centro move · canto redimensiona · alça de cima gira · alt+arrastar move a âncora</div>';
      h += plate('MOTION', mb, '<button class="cmd cmd-sm" data-act="resetmotion" title="Zerar posição, escala e rotação">ZERAR</button>');
    }

    /* ============================================ COMPOSIÇÃO POR CAMADAS
       Um clipe visual é uma camada de composição. As seis seções abaixo
       são a conversa dela com o quadro, na ordem em que o motor executa:
       mistura → máscara → matte → cor → canais → faixa de mescla.
       Nascem recolhidas; quem não precisa nem vê que existem.        */
    if (clip.kind !== 'audio' && clip.kind !== 'adjust' && VE.compui) {
      var CO = VE.compui;
      VE.ensureLayer(clip);
      var Lc = clip.layer;
      h += plate('COMPOSIÇÃO', CO.composicao(clip), '',
        { count: VE.BLENDS[clip.blend] === 'Normal' ? null : VE.BLENDS[clip.blend] });
      h += plate('MÁSCARAS DA CAMADA', CO.mascaras(clip),
        '<button class="cmd cmd-sm cmd-solid" data-maddm="7" title="Traçado livre: clique para pôr vértices, arraste para mover, e anime cada ponto">+ CANETA</button>' +
        '<button class="cmd cmd-sm" data-maddm="0">+ RET</button>' +
        '<button class="cmd cmd-sm" data-maddm="1">+ ELIPSE</button>' +
        '<button class="cmd cmd-sm" data-maddm="5">+ RAMPA</button>',
        { count: (clip.masks || []).length || null });
      h += plate('MATTE DE FAIXA', CO.matte(clip), '',
        { count: (Lc.matte.modo | 0) ? VE.MATTE_MODOS[Lc.matte.modo | 0] : null });
      h += plate('COR DA CAMADA', CO.cor(clip), '', { count: Lc.cor.on ? 'ON' : null });
      h += plate('CANAIS', CO.canais(clip), '', { count: Lc.canais.on ? 'ON' : null });
      h += plate('FAIXA DE MESCLA', CO.faixa(clip), '', { count: Lc.blendIf.on ? 'ON' : null });
    }

    /* --------------------------------------------------------------- áudio */
    if (clip.kind === 'audio' || clip.kind === 'video') {
      var ab = prop(clip, 'volume', 'VOLUME');
      ab += VE.panels.ui.rowNum('__fadeIn', 'Fade in (s)', clip.fadeIn, 0, Math.max(0.1, clip.dur), 0.01, false);
      ab += VE.panels.ui.rowNum('__fadeOut', 'Fade out (s)', clip.fadeOut, 0, Math.max(0.1, clip.dur), 0.01, false);
      ab += '<div class="pbtns"><button class="cmd cmd-sm' + (clip.muted ? ' active' : '') + '" data-act="mute">' +
        (clip.muted ? 'MUDO' : 'COM SOM') + '</button>' +
        '<button class="cmd cmd-sm" data-act="syncsel">SINCRONIZAR COM A SELEÇÃO</button></div>';
      h += plate('ÁUDIO', ab);
    }

    /* ---------------------------------------------------------- transições */
    if (clip.kind !== 'audio') {
      h += plate('TRANSIÇÕES', transBody(clip), '', { count: (clip.transIn ? 1 : 0) + (clip.transOut ? 1 : 0) });
    }

    /* ------------------------------------------------------ pilha de efeitos */
    h += plate('PILHA DE EFEITOS', stackBody(clip),
      '<button class="cmd cmd-sm" data-act="addfx">+ EFEITO</button>', { count: clip.effects.length });

    /* -------------------------------------------------------- áudio reativo */
    if (clip.kind !== 'audio') {
      h += plate('ÁUDIO REATIVO', reactBody(clip),
        '<button class="cmd cmd-sm" data-act="addreact">+ MAPEAR</button>',
        { count: (clip.react || []).length });
    }

    /* -------------------------------------------------------------- gráficos */
    var paths = Object.keys(clip.keys || {});
    if (paths.length) {
      h += plate('KEYFRAMES', keysBody(clip, paths), 
        '<button class="cmd cmd-sm' + (graphMode === 'value' ? ' active' : '') + '" data-graph="value">VALOR</button>' +
        '<button class="cmd cmd-sm' + (graphMode === 'velocity' ? ' active' : '') + '" data-graph="velocity">VELOCIDADE</button>');
    }

    box.innerHTML = h;
    bind(box, clip);
    VE.panels.renderMaskOverlay();
    M.renderTransformBox();
  };

  /* a ficha da legenda entra logo abaixo do cabeçalho do clipe, antes de
     TEMPO — é o que se quer editar primeiro numa legenda: o texto.    */
  M.extraFicha = function (clip) {
    if (VE.legendas && VE.legendas.ehLegenda(clip)) return VE.legendas.fichaHtml(clip);
    return '';
  };

  /* ------------------------------------------------------------ transições */
  function transBody(clip) {
    var h = '';
    ['in', 'out'].forEach(function (side) {
      var tr = side === 'in' ? clip.transIn : clip.transOut;
      var lab = side === 'in' ? 'ENTRADA' : 'SAÍDA';
      h += '<div class="prow" style="grid-template-columns:1fr auto"><label>' + lab + '</label>' +
        '<button class="cmd cmd-sm" data-tpick="' + side + '">' + (tr ? esc((VE.TRANSBY[tr.type] || {}).name || tr.type) : 'NENHUMA') + '</button></div>';
      if (!tr) return;
      h += VE.panels.ui.rowNum('__t' + side, 'Duração (s)', tr.dur, 1 / 60, Math.max(0.1, clip.dur), 0.01, false);
      var d = VE.TRANSBY[tr.type];
      if (d) {
        d.params.forEach(function (pr) {
          var val = tr.params[pr.k] === undefined ? pr.def : tr.params[pr.k];
          if (pr.t === 'sel') {
            h += VE.panels.ui.rowSel('__tp' + side + ':' + pr.k, pr.label, val, pr.opts);
          } else {
            h += VE.panels.ui.rowNum('__tp' + side + ':' + pr.k, pr.label, val, pr.min, pr.max, pr.step, false);
          }
        });
        h += '<div class="pnote">' + esc(d.desc) + '</div>';
      }
      h += '<div class="pbtns"><button class="cmd cmd-sm cmd-danger" data-tdel="' + side + '">REMOVER</button></div>';
    });
    h += '<div class="pnote">na linha do tempo, arraste a borda hachurada do clipe para mudar a duração da transição</div>';
    return h;
  }

  /* -------------------------------------------------------- ÁUDIO REATIVO
     Cada linha é "uma faixa do som mexe numa propriedade deste clipe". O
     valor é somado na leitura, então o que você ajustou à mão continua
     valendo e nada vira keyframe. Ver js/reactmap.js.                   */
  function reactBody(clip) {
    var R = VE.reactMap;
    var dest = R.destinos(clip);
    if (!dest.length) {
      return '<div class="pnote">este clipe não tem propriedade que o som possa mexer. acrescente um efeito na pilha acima e os parâmetros dele aparecem aqui.</div>';
    }
    var h = '';
    (clip.react || []).forEach(function (m, i) {
      var d = dest.filter(function (x) { return x.path === m.path; })[0];
      h += '<div class="reactrow' + (m.on ? '' : ' off') + '">' +
        '<button class="cmd cmd-sm' + (m.on ? ' active' : '') + '" data-ron="' + i + '" title="Ligar / desligar">' +
        (m.on ? '●' : '○') + '</button>' +
        '<select class="field" data-rsrc="' + i + '">' +
        R.FONTES.map(function (f) {
          return '<option value="' + f.id + '"' + (m.src === f.id ? ' selected' : '') + '>' + f.label + '</option>';
        }).join('') + '</select>' +
        '<span class="reactarrow">→</span>' +
        '<select class="field" data-rdst="' + i + '">' +
        dest.map(function (x) {
          return '<option value="' + esc(x.path) + '"' + (m.path === x.path ? ' selected' : '') + '>' + esc(x.label) + '</option>';
        }).join('') + '</select>' +
        '<button class="cmd cmd-sm cmd-danger" data-rdel="' + i + '">✕</button></div>';
      h += VE.panels.ui.rowNum('__ramt' + i, 'Quanto mexe', m.amount, -3, 3, 0.01, false);
      h += VE.panels.ui.rowSel('__rcur' + i, 'Curva', m.curve, R.CURVAS);
      h += VE.panels.ui.rowNum('__rsm' + i, 'Suavidade', m.smooth, 0, 0.99, 0.01, false);
      if (!d) h += '<div class="pnote">o destino deste mapeamento não existe mais neste clipe — escolha outro</div>';
    });
    if (!(clip.react || []).length) {
      h += '<div class="pnote">nada mapeado. <b>+ MAPEAR</b> liga uma faixa do som a uma propriedade — grave na escala, agudo no brilho, transiente no glitch.</div>';
    }
    h += '<div class="pnote">o som vem do <b>laboratório 02</b>: carregue um áudio lá e deixe tocando. o valor é somado na leitura, então não cria keyframe e desligar devolve tudo como estava.</div>';
    return h;
  }

  /* ----------------------------------------------------- pilha de efeitos */
  function stackBody(clip) {
    if (!clip.effects.length) {
      return '<div class="pnote">nenhum efeito neste clipe. escolha um no catálogo à esquerda, ou arraste-o para cima do clipe na linha do tempo. ' +
        'os efeitos são aplicados <b>na ordem de cima para baixo</b>.</div>';
    }
    var h = '<div class="fxstack">';
    clip.effects.forEach(function (e, i) {
      var def = VE.FXBY[e.fx] || { name: e.fx, color: '#888', params: [], desc: '' };
      var open = (focusEff === e.id);
      h += '<div class="fxrow' + (open ? ' open' : '') + (e.enabled ? '' : ' off') + '" data-eff="' + e.id + '">' +
        '<span class="fxno">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="fxcat" style="background:' + def.color + '"></span>' +
        '<button class="fxname" data-open="' + e.id + '">' + esc(def.name) + '</button>' +
        '<span class="fxops">' +
        '<button data-ea="up" title="subir">↑</button>' +
        '<button data-ea="down" title="descer">↓</button>' +
        '<button data-ea="tog" class="' + (e.enabled ? 'on' : '') + '" title="ligar/desligar">' + (e.enabled ? '●' : '○') + '</button>' +
        '<button data-ea="dup" title="duplicar">⧉</button>' +
        '<button data-ea="del" title="remover">✕</button>' +
        '</span></div>';
      if (!open) return;
      h += '<div class="fxbody">';
      h += '<div class="pnote">' + esc(def.desc) + '</div>';
      h += effProp(clip, e, { k: 'amount', label: 'INTENSIDADE', min: 0, max: 1, step: 0.01, def: 1 }, true);
      def.params.forEach(function (pr) {
        if (pr.t === 'txt' && e.fx === 'ascii') {
          var cs = VE.CHARSETS[e.params.set | 0];
          if (!cs || cs.id !== 'custom') return;
        }
        h += effProp(clip, e, pr, false);
      });
      /* região (máscara) do efeito */
      var shapes = ['TUDO', 'RETÂNGULO', 'ELIPSE', 'FAIXA H', 'FAIXA V'];
      h += '<div class="subhead">REGIÃO</div><div class="pbtns">' + shapes.map(function (sh, si) {
        return '<button class="cmd cmd-sm' + (e.mask.shape === si ? ' active' : '') + '" data-shape="' + si + '">' + sh + '</button>';
      }).join('') + '</div>';
      if (e.mask.shape > 0) {
        h += '<div class="prow"><label>Inverter (efeito fora)</label><input type="checkbox" data-maskinv' + (e.mask.invert ? ' checked' : '') + '><span></span></div>';
        ['x', 'y', 'w', 'h', 'ang', 'feather'].forEach(function (k) {
          var labels = { x: 'Centro X', y: 'Centro Y', w: 'Largura', h: 'Altura', ang: 'Rotação (°)', feather: 'Borda' };
          var lim = { x: [-0.2, 1.2, 0.001], y: [-0.2, 1.2, 0.001], w: [0.01, 2, 0.001], h: [0.01, 2, 0.001], ang: [-180, 180, 1], feather: [0.001, 1, 0.001] }[k];
          h += VE.panels.ui.rowNum('fx.' + e.id + '.mask.' + k, labels[k], e.mask[k], lim[0], lim[1], lim[2], false);
        });
        h += '<div class="pnote">arraste na prévia: centro move · canto redimensiona · alça de cima gira</div>';
      }
      h += '<div class="pbtns"><button class="cmd cmd-sm" data-ea2="reset">ZERAR PARÂMETROS</button>' +
        '<button class="cmd cmd-sm" data-ea2="savefx">SALVAR PRESET</button></div>';
      h += '</div>';
    });
    h += '</div>';
    return h;
  }

  /* um parâmetro de efeito, com cronômetro */
  function effProp(clip, e, pr, isAmount) {
    var path = 'fx.' + e.id + '.' + pr.k;
    var lt = localT(clip);
    var val = isAmount ? e.amount : (e.params[pr.k] === undefined ? pr.def : e.params[pr.k]);
    if (pr.t === 'c') {
      return '<div class="prow" style="grid-template-columns:1fr auto"><label>' + esc(pr.label) + '</label>' +
        '<input type="color" data-efc="' + esc(pr.k) + '" value="' + (val || '#ffffff') + '"></div>' +
        '<div class="prow-slider"><div class="swatches">' + VE.panels.ui.SWATCHES.map(function (sw) {
          return '<button class="swatch" style="background:' + sw + '" data-sw="' + sw + '" data-for="' + esc(pr.k) + '"></button>';
        }).join('') + '</div></div>';
    }
    if (pr.t === 'txt') {
      return '<div class="prow wide"><label>' + esc(pr.label) + '</label></div>' +
        '<div class="prow-slider"><input type="text" class="field" data-eftxt="' + esc(pr.k) + '" value="' + esc(val) + '" spellcheck="false"></div>';
    }
    if (pr.t === 'b') {
      return '<div class="prow"><label>' + esc(pr.label) + '</label>' +
        '<input type="checkbox" data-efb="' + esc(pr.k) + '"' + (val > 0.5 ? ' checked' : '') + '><span></span></div>';
    }
    /* Um parâmetro com `uni: false` NÃO vira uniform: o motor lê o valor
       base do clipe, fora da animação (é o caso da distância no tempo e da
       memória das TIRAS, que são escolha de alocação e não curva). Oferecer
       o cronômetro nele é desenhar um botão que grava keyframes que ninguém
       lê — e mostrar na caixa um número que o motor não está usando.     */
    var animavel = pr.uni !== false;
    var anim = animavel && VE.hasKeys(clip, path);
    var onKey = anim && !!keyAt(clip, path, lt);
    var live = anim ? VE.valueAt(clip, path, lt) : val;
    if (pr.t === 's') {
      return '<div class="mprop' + (focusPath === path ? ' focus' : '') + '"><div class="mprop-h">' +
        (animavel ? '<button class="stopw' + (anim ? ' on' : '') + '" data-anim="' + esc(path) + '">◆</button>' : '<span class="stopw-off"></span>') +
        '<label data-focus="' + esc(path) + '">' + esc(pr.label) + '</label>' +
        '<select class="field" data-efs="' + esc(pr.k) + '" style="flex:1">' +
        pr.opts.map(function (o, i) { return '<option value="' + i + '"' + ((live | 0) === i ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
        '</select></div></div>';
    }
    return '<div class="mprop' + (focusPath === path ? ' focus' : '') + '" data-path="' + esc(path) + '">' +
      '<div class="mprop-h">' +
      (animavel ? '<button class="stopw' + (anim ? ' on' : '') + '" data-anim="' + esc(path) + '" title="animar">◆</button>' : '<span class="stopw-off"></span>') +
      '<label data-focus="' + esc(path) + '">' + esc(pr.label) + '</label>' +
      (anim ? '<span class="kfnav">' +
        '<button data-kprev="' + esc(path) + '">◂</button>' +
        '<button class="' + (onKey ? 'on' : '') + '" data-ktog="' + esc(path) + '">◆</button>' +
        '<button data-knext="' + esc(path) + '">▸</button></span>' : '') +
      '<input class="field num mval" data-mnum="' + esc(path) + '" value="' + fmt(live, 3) + '">' +
      '</div>' +
      '<input type="range" class="mrange" data-mrange="' + esc(path) + '" min="' + pr.min + '" max="' + pr.max + '" step="' + pr.step + '" value="' + live + '">' +
      '</div>';
  }

  /* ---------------------------------------------------- lista de keyframes */
  function keysBody(clip, paths) {
    if (!focusPath || !clip.keys[focusPath]) focusPath = paths[0];
    VE.tl.focusProp = focusPath;
    var h = '<div class="kplist">';
    paths.forEach(function (path) {
      h += '<button class="kprow' + (path === focusPath ? ' on' : '') + '" data-kpath="' + esc(path) + '">' +
        '<span>' + esc(VE.tl.pathLabel(path)) + '</span><i>' + clip.keys[path].length + '</i></button>';
    });
    h += '</div>';
    h += graphHtml(clip, focusPath, graphMode);

    /* curva do keyframe atual */
    var lt = localT(clip);
    var k = keyAt(clip, focusPath, lt);
    h += '<div class="prow" style="grid-template-columns:1fr auto"><label>CURVA DO KEYFRAME</label>' +
      '<select class="field" data-ease' + (k ? '' : ' disabled') + '>' +
      VE.EASE_LIST.map(function (id) {
        return '<option value="' + id + '"' + (k && (k.ease || 'easeInOut') === id ? ' selected' : '') + '>' + VE.EASE[id].label + '</option>';
      }).join('') + '</select></div>';
    if (!k) h += '<div class="pnote">leve o cursor até um keyframe (◂ ▸) para editar a curva dele</div>';
    h += '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-kall="linear">TUDO LINEAR</button>' +
      '<button class="cmd cmd-sm" data-kall="easeInOut">TUDO SUAVE</button>' +
      '<button class="cmd cmd-sm cmd-danger" data-kall="clear">LIMPAR</button></div>';
    return h;
  }

  /* gráfico de VALOR ou VELOCIDADE, com os keyframes arrastáveis */
  function graphHtml(clip, path, mode) {
    var ks = VE.keyList(clip, path);
    if (!ks.length) return '';
    var GW = 100, GH = 100;
    var lo = Infinity, hi = -Infinity, i;
    var N = 160, vals = [];
    for (i = 0; i <= N; i++) {
      var lt = clip.dur * i / N;
      var v = mode === 'velocity' ? VE.velocityAt(clip, path, lt) : VE.valueAt(clip, path, lt);
      vals.push(v);
      lo = Math.min(lo, v); hi = Math.max(hi, v);
    }
    if (hi - lo < 1e-9) { hi = lo + 1; lo -= 0.5; }
    var pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    var yOf = function (v) { return GH - ((v - lo) / (hi - lo)) * GH; };
    var pts = vals.map(function (v, j) { return (j / N * GW).toFixed(2) + ',' + yOf(v).toFixed(2); }).join(' ');
    var dots = '';
    if (mode === 'value') {
      ks.forEach(function (k) {
        dots += '<rect class="gk" data-gk="' + k.t + '" x="' + (k.t / clip.dur * GW - 1.1).toFixed(2) + '" y="' +
          (yOf(k.v) - 1.1).toFixed(2) + '" width="2.2" height="2.2"/>';
      });
    }
    var phx = (localT(clip) / clip.dur * GW).toFixed(2);
    return '<div class="kgraph"><svg viewBox="0 0 ' + GW + ' ' + GH + '" preserveAspectRatio="none" data-graph-svg data-lo="' + lo + '" data-hi="' + hi + '">' +
      '<line class="gz" x1="0" x2="' + GW + '" y1="' + yOf(mode === 'velocity' ? 0 : lo + (hi - lo) / 2).toFixed(2) + '" y2="' + yOf(mode === 'velocity' ? 0 : lo + (hi - lo) / 2).toFixed(2) + '"/>' +
      '<polyline class="gl" points="' + pts + '"/>' + dots +
      '<line class="gp" x1="' + phx + '" x2="' + phx + '" y1="0" y2="' + GH + '"/>' +
      '</svg>' +
      '<div class="gmeta"><span>' + (mode === 'velocity' ? 'VELOCIDADE' : 'VALOR') + '</span>' +
      '<span>' + fmt(hi, 2) + ' … ' + fmt(lo, 2) + '</span></div></div>';
  }

  /* =============================================== LIGAÇÕES ============== */

  function bind(box, clip) {
    var live = [];

    function commit(soft) {
      VE.emit('livechange');
      if (soft) { VE.tl.renderLite(); return; }
      VE.pushHistory();
      VE.emit('project');
    }

    /* --- ações de cabeçalho --- */
    box.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.act;
        if (a === 'toggle') clip.enabled = !clip.enabled;
        else if (a === 'lock') clip.locked = !clip.locked;
        else if (a === 'del') { VE.removeClip(clip.id); VE.clearSelection(); }
        else if (a === 'mute') clip.muted = !clip.muted;
        else if (a === 'split') { if (!VE.splitClip(clip.id, VE.project.time)) VE.app.toast('ponha o cursor no meio do clipe'); }
        else if (a === 'tostart') { clip.start = VE.project.time; VE.growToFit(); }
        else if (a === 'resetmotion') { clip.motion = VE.newMotion(); }
        else if (a === 'addfx') { VE.app.toast('escolha um efeito no catálogo à esquerda — ele entra neste clipe'); return; }
        else if (a === 'addreact') {
          var dest = VE.reactMap.destinos(clip);
          if (!dest.length) { VE.app.toast('acrescente um efeito primeiro — os parâmetros dele viram destino', 'err'); return; }
          VE.reactMap.novo(clip, dest[0].path, 'bass');
          VE.app.toast('mapeamento criado — deixe um áudio tocando no laboratório 02 para ver');
        }
        else if (a === 'syncsel') { syncToSelection(clip); }
        commit();
      });
    });
    var rn = box.querySelector('[data-rename]');
    if (rn) {
      rn.addEventListener('change', function () { clip.name = rn.value.trim() || clip.name; commit(); });
      rn.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') rn.blur(); });
    }
    box.querySelectorAll('[data-fit]').forEach(function (b) {
      b.addEventListener('click', function () { clip.fit = b.dataset.fit; commit(); });
    });
    box.querySelectorAll('[data-flip]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.flip === 'x') clip.flipX = !clip.flipX; else clip.flipY = !clip.flipY;
        commit();
      });
    });
    /* --- áudio reativo: ligar, trocar fonte e destino, remover --- */
    box.querySelectorAll('[data-ron]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = clip.react[+b.dataset.ron];
        if (m) m.on = !m.on;
        commit(); VE.panels.renderProps();
      });
    });
    box.querySelectorAll('[data-rsrc]').forEach(function (el) {
      el.addEventListener('change', function () {
        var m = clip.react[+el.dataset.rsrc];
        if (m) m.src = el.value;
        commit();
      });
    });
    box.querySelectorAll('[data-rdst]').forEach(function (el) {
      el.addEventListener('change', function () {
        var m = clip.react[+el.dataset.rdst];
        if (m) m.path = el.value;
        commit();
      });
    });
    box.querySelectorAll('[data-rdel]').forEach(function (b) {
      b.addEventListener('click', function () {
        VE.reactMap.remover(clip, +b.dataset.rdel);
        commit(); VE.panels.renderProps();
      });
    });

    /* --- velocidade e sentido do clipe --- */
    box.querySelectorAll('[data-speed]').forEach(function (b) {
      b.addEventListener('click', function () {
        clip.speed = parseFloat(b.dataset.speed);
        commit(); VE.panels.renderProps();
      });
    });
    box.querySelectorAll('[data-tmode]').forEach(function (b) {
      b.addEventListener('click', function () {
        clip.timeMode = parseInt(b.dataset.tmode, 10) || 0;
        if (VE.renderer) VE.renderer.clearPrev();
        commit(); VE.panels.renderProps();
      });
    });

    /* --- propriedades animáveis (motion + parâmetros de efeito) --- */
    box.querySelectorAll('[data-mrange]').forEach(function (el) {
      var path = el.dataset.mrange;
      var cv = CONV[path];
      var write = function (soft) {
        return function () {
          var v = parseFloat(el.value);
          VE.panels.setKeyable(clip, path, cv ? cv.from(v) : v);
          var n = box.querySelector('[data-mnum="' + cssq(path) + '"]');
          if (n) n.value = fmt(v, cv ? cv.dec : 3);
          commit(soft);
          if (!soft) VE.panels.renderProps();
          else M.renderTransformBox();
        };
      };
      el.addEventListener('input', write(true));
      el.addEventListener('change', write(false));
    });
    box.querySelectorAll('[data-mnum]').forEach(function (el) {
      el.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') el.blur(); });
      el.addEventListener('change', function () {
        var v = parseFloat(el.value);
        if (!isFinite(v)) return;
        var path = el.dataset.mnum, cv = CONV[path];
        VE.panels.setKeyable(clip, path, cv ? cv.from(v) : v);
        commit();
        VE.panels.renderProps();
      });
    });

    /* --- cronômetro e navegação de keyframes --- */
    box.querySelectorAll('[data-anim]').forEach(function (b) {
      b.addEventListener('click', function () {
        var path = b.dataset.anim;
        var on = VE.toggleAnim(clip, path, localT(clip));
        focusPath = path;
        VE.tl.focusProp = path;
        VE.app.toast(VE.tl.pathLabel(path) + (on ? ' — animação ligada' : ' — animação desligada'));
        commit();
      });
    });
    box.querySelectorAll('[data-ktog]').forEach(function (b) {
      b.addEventListener('click', function () {
        var path = b.dataset.ktog, lt = localT(clip);
        var k = keyAt(clip, path, lt);
        if (k) VE.removeKey(clip, path, k.t);
        else VE.setKey(clip, path, lt, VE.valueAt(clip, path, lt));
        commit();
      });
    });
    box.querySelectorAll('[data-kprev],[data-knext]').forEach(function (b) {
      b.addEventListener('click', function () {
        var path = b.dataset.kprev || b.dataset.knext;
        var dir = b.dataset.knext ? 1 : -1;
        var lt = localT(clip), ks = VE.keyList(clip, path), best = null;
        ks.forEach(function (k) {
          if (dir > 0 ? k.t > lt + 0.002 : k.t < lt - 0.002) {
            if (best === null || Math.abs(k.t - lt) < Math.abs(best - lt)) best = k.t;
          }
        });
        if (best !== null) { focusPath = path; VE.app.seek(clip.start + best); VE.panels.renderProps(); }
      });
    });
    box.querySelectorAll('[data-focus]').forEach(function (l) {
      l.addEventListener('click', function () {
        focusPath = l.dataset.focus;
        VE.tl.focusProp = focusPath;
        VE.panels.renderProps();
        VE.tl.render();
      });
    });
    box.querySelectorAll('[data-kpath]').forEach(function (b) {
      b.addEventListener('click', function () {
        focusPath = b.dataset.kpath;
        VE.tl.focusProp = focusPath;
        VE.panels.renderProps();
        VE.tl.render();
      });
    });
    box.querySelectorAll('[data-graph]').forEach(function (b) {
      b.addEventListener('click', function () { graphMode = b.dataset.graph; VE.panels.renderProps(); });
    });
    var easeSel = box.querySelector('[data-ease]');
    if (easeSel) {
      easeSel.addEventListener('change', function () {
        var k = keyAt(clip, focusPath, localT(clip));
        if (k) { k.ease = easeSel.value; commit(); VE.panels.renderProps(); }
      });
    }
    box.querySelectorAll('[data-kall]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.kall;
        if (a === 'clear') VE.clearKeys(clip, focusPath);
        else VE.keyList(clip, focusPath).forEach(function (k) { k.ease = a; });
        commit(); VE.panels.renderProps();
      });
    });
    bindGraph(box, clip);

    /* --- transições --- */
    box.querySelectorAll('[data-tpick]').forEach(function (b) {
      b.addEventListener('click', function () { VE.tl.transitionPicker(clip.id, b.dataset.tpick); });
    });
    box.querySelectorAll('[data-tdel]').forEach(function (b) {
      b.addEventListener('click', function () { VE.setTransition(clip.id, b.dataset.tdel, null); commit(); VE.panels.renderProps(); });
    });

    /* --- pilha de efeitos --- */
    box.querySelectorAll('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        focusEff = (focusEff === b.dataset.open) ? null : b.dataset.open;
        VE.panels.renderProps();
      });
    });
    box.querySelectorAll('[data-ea]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = b.closest('.fxrow').dataset.eff;
        var a = b.dataset.ea;
        var eff = VE.findEffect(clip, id);
        if (!eff) return;
        if (a === 'up') VE.moveEffect(clip, id, -1);
        else if (a === 'down') VE.moveEffect(clip, id, 1);
        else if (a === 'tog') eff.enabled = !eff.enabled;
        else if (a === 'dup') { var d = VE.duplicateEffect(clip, id); if (d) focusEff = d.id; }
        else if (a === 'del') { VE.removeEffect(clip, id); if (focusEff === id) focusEff = null; }
        commit();
      });
    });
    var openEff = focusEff ? VE.findEffect(clip, focusEff) : null;
    if (openEff) bindEffectBody(box, clip, openEff, commit);

    /* --- composição por camadas (modo, máscaras, matte, cor, canais) --- */
    if (VE.compui && clip.kind !== 'audio' && clip.kind !== 'adjust') {
      VE.compui.bind(box, clip, commit);
    }

    /* --- legenda: texto do clipe e estilo da faixa --- */
    if (VE.legendas) VE.legendas.ligarFicha(box, clip, commit);

    /* ------------------------------------------------------------------
       Campos da ficha que NÃO são propriedades animáveis: início, duração,
       entrada na fonte, velocidade, mistura, fades e os parâmetros das
       transições. Cada um escreve direto no clipe.
       (Antes só os caminhos `fx.` chegavam aqui: os outros desenhavam na
       tela e não faziam nada. A mistura, que é o coração da sobreposição,
       era um deles.)
       ------------------------------------------------------------------ */
    VE.panels.ui.wireInputs(box, clip, function (key, v, isLive) {
      if (key.indexOf('fx.') === 0) {
        VE.panels.setKeyable(clip, key, v);
        VE.emit('livechange');
        if (!isLive) { VE.pushHistory(); VE.panels.renderMaskOverlay(); }
        return;
      }
      if (key.indexOf('__') !== 0) return;

      /* controles do áudio reativo: __ramt<i> · __rcur<i> · __rsm<i> */
      var mr = key.match(/^__r(amt|cur|sm)(\d+)$/);
      if (mr) {
        var alvo = (clip.react || [])[+mr[2]];
        if (alvo) {
          if (mr[1] === 'amt') alvo.amount = v;
          else if (mr[1] === 'cur') alvo.curve = Math.round(v);
          else alvo.smooth = Math.max(0, Math.min(0.99, v));
        }
        VE.emit('livechange');
        if (!isLive) VE.pushHistory();
        return;
      }

      var refazer = false;

      /* --- transições: __tin / __tout e __tpin:<param> / __tpout:<param> --- */
      if (key.indexOf('__tp') === 0) {
        var corte = key.indexOf(':');
        var lado = key.slice(4, corte);
        var pk = key.slice(corte + 1);
        var tr = (lado === 'in') ? clip.transIn : clip.transOut;
        if (tr) tr.params[pk] = v;
      } else if (key === '__tin' || key === '__tout') {
        var t2 = (key === '__tin') ? clip.transIn : clip.transOut;
        if (t2) t2.dur = Math.max(1 / 60, Math.min(clip.dur, v));
      } else if (key === '__start') {
        clip.start = Math.max(0, Math.min(VE.MAXDUR - 0.04, v));
        VE.growToFit(); refazer = true;
      } else if (key === '__dur') {
        var teto = VE.MAXDUR - clip.start;
        if (clip.srcDur > 0 && (clip.timeMode | 0) === 0) {
          var sp = Math.max(0.01, clip.speed || 1);
          teto = Math.min(teto, (clip.srcDur - clip.in) / sp);
        }
        clip.dur = Math.max(0.04, Math.min(teto, v));
        if (clip.transIn && clip.transIn.dur > clip.dur) clip.transIn.dur = clip.dur;
        if (clip.transOut && clip.transOut.dur > clip.dur) clip.transOut.dur = clip.dur;
        VE.growToFit(); refazer = true;
      } else if (key === '__in') {
        clip.in = Math.max(0, Math.min(Math.max(0, clip.srcDur - 0.04), v));
        refazer = true;
      } else if (key === '__speed') {
        clip.speed = Math.max(0.05, Math.min(16, v));
        refazer = true;
      } else if (key === '__blend') {
        clip.blend = Math.max(0, Math.min(VE.BLENDS.length - 1, Math.round(v)));
      } else if (key === '__fadeIn') {
        clip.fadeIn = Math.max(0, Math.min(clip.dur, v));
      } else if (key === '__fadeOut') {
        clip.fadeOut = Math.max(0, Math.min(clip.dur, v));
      } else return;

      VE.emit('livechange');
      if (!isLive) {
        VE.pushHistory();
        VE.emit('project');
        if (refazer) VE.panels.renderProps();
      } else {
        VE.tl.renderLite();
      }
    });

    VE.panels.liveRows(live);
    collectLive(box, clip, live);
  }

  function cssq(s) { return String(s).replace(/"/g, '\\"'); }

  function collectLive(box, clip, live) {
    box.querySelectorAll('[data-mrange]').forEach(function (el) {
      var path = el.dataset.mrange;
      if (!VE.hasKeys(clip, path)) return;
      var cv = CONV[path];
      live.push({
        clip: clip, path: path, rng: el,
        num: box.querySelector('[data-mnum="' + cssq(path) + '"]'),
        mul: cv ? undefined : 1,
        conv: cv
      });
    });
  }

  /* parâmetros do efeito aberto */
  function bindEffectBody(box, clip, eff, commit) {
    var def = VE.FXBY[eff.fx] || { params: [], name: eff.fx };
    box.querySelectorAll('[data-efs]').forEach(function (el) {
      el.addEventListener('change', function () {
        VE.panels.setKeyable(clip, 'fx.' + eff.id + '.' + el.dataset.efs, parseFloat(el.value));
        commit(); VE.panels.renderProps();
      });
    });
    box.querySelectorAll('[data-efb]').forEach(function (el) {
      el.addEventListener('change', function () {
        eff.params[el.dataset.efb] = el.checked ? 1 : 0;
        commit();
      });
    });
    box.querySelectorAll('[data-efc]').forEach(function (el) {
      el.addEventListener('input', function () { eff.params[el.dataset.efc] = el.value; VE.emit('livechange'); });
      el.addEventListener('change', function () { commit(); });
    });
    box.querySelectorAll('[data-eftxt]').forEach(function (el) {
      el.addEventListener('keydown', function (e) { e.stopPropagation(); });
      el.addEventListener('change', function () { eff.params[el.dataset.eftxt] = el.value; commit(); });
    });
    box.querySelectorAll('[data-sw]').forEach(function (b) {
      b.addEventListener('click', function () {
        eff.params[b.dataset.for] = b.dataset.sw;
        commit(); VE.panels.renderProps();
      });
    });
    box.querySelectorAll('[data-shape]').forEach(function (b) {
      b.addEventListener('click', function () { eff.mask.shape = +b.dataset.shape; commit(); VE.panels.renderProps(); });
    });
    var mi = box.querySelector('[data-maskinv]');
    if (mi) mi.addEventListener('change', function () { eff.mask.invert = mi.checked; commit(); });
    box.querySelectorAll('[data-ea2]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.ea2 === 'reset') { eff.params = VE.defaults(eff.fx); eff.amount = 1; }
        else {
          var n = prompt('nome do preset:', def.name);
          if (!n) return;
          VE.presets.saveFx({ fx: eff.fx, params: eff.params, amount: eff.amount, mask: eff.mask }, n);
          VE.app.toast('preset salvo');
          return;
        }
        commit(); VE.panels.renderProps();
      });
    });
  }

  /* arrastar keyframes dentro do gráfico */
  function bindGraph(box, clip) {
    var svg = box.querySelector('[data-graph-svg]');
    if (!svg) return;
    var lo = parseFloat(svg.dataset.lo), hi = parseFloat(svg.dataset.hi);
    svg.querySelectorAll('.gk').forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        var t0 = parseFloat(el.dataset.gk);
        var r = svg.getBoundingClientRect();
        var cur = t0;
        function mv(ev) {
          var fx = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
          var fy = Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height));
          var nt = fx * clip.dur;
          var nv = hi - fy * (hi - lo);
          VE.moveKey(clip, focusPath, cur, nt);
          cur = nt;
          var ks = VE.keyList(clip, focusPath);
          for (var i = 0; i < ks.length; i++) if (Math.abs(ks[i].t - nt) < 0.0005) { ks[i].v = nv; break; }
          VE.emit('livechange');
        }
        function up() {
          svg.removeEventListener('pointermove', mv);
          svg.removeEventListener('pointerup', up);
          VE.pushHistory();
          VE.panels.renderProps();
          VE.tl.render();
        }
        svg.addEventListener('pointermove', mv);
        svg.addEventListener('pointerup', up);
      });
    });
  }

  /* sincronizar áudio com o vídeo selecionado (por início) */
  function syncToSelection(clip) {
    var others = VE.selectedClips().filter(function (c) { return c !== clip; });
    if (!others.length) return VE.app.toast('selecione também o clipe de referência (shift+clique)');
    clip.start = others[0].start;
    VE.app.toast('início alinhado com ' + others[0].name);
  }

  /* ===================== CAIXA DE TRANSFORMAÇÃO NA PRÉVIA ==================
     Com um clipe selecionado, a prévia ganha uma caixa: arrastar o meio
     move, o canto redimensiona, a alça de cima gira e ALT move a âncora.
     Tudo escreve em MOTION — e vira keyframe se a propriedade estiver
     animada, igual ao painel.                                              */

  M.renderTransformBox = function () {
    var svg = $('#xformOverlay');
    if (!svg) return;
    var clip = VE.selected();
    var p = VE.project;
    if (!clip || !p || clip.kind === 'audio' || clip.kind === 'adjust' ||
      VE.shell.view !== 'video' || !$('#xformChk') || !$('#xformChk').checked) {
      svg.innerHTML = ''; svg.classList.remove('active'); return;
    }
    var t = p.time;
    if (t < clip.start || t > clip.start + clip.dur) { svg.innerHTML = ''; svg.classList.remove('active'); return; }
    var b = VE.media.boundsOf(clip, t);
    if (!b) { svg.innerHTML = ''; return; }
    svg.classList.add('active');
    svg.setAttribute('viewBox', '0 0 ' + p.canvas.w + ' ' + p.canvas.h);
    var sc = 1 / Math.max(0.05, (VE.view ? VE.view.zoom : 1));
    var hs = 5 * sc, sw = 1.4 * sc;
    var g = '<g transform="translate(' + b.cx.toFixed(2) + ',' + b.cy.toFixed(2) + ') rotate(' + (-b.rot).toFixed(2) + ')">';
    var st = 'fill:none;stroke:var(--ch-video);stroke-width:' + sw;
    g += '<rect style="' + st + '" x="' + (-b.w / 2) + '" y="' + (-b.h / 2) + '" width="' + b.w + '" height="' + b.h + '"/>';
    var hst = 'fill:var(--paper);stroke:var(--ink);stroke-width:' + sw;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c, i) {
      g += '<rect data-xh="size" data-c="' + i + '" style="' + hst + '" x="' + (c[0] * b.w / 2 - hs) + '" y="' +
        (c[1] * b.h / 2 - hs) + '" width="' + (hs * 2) + '" height="' + (hs * 2) + '"/>';
    });
    g += '<line style="stroke:var(--ink);stroke-width:' + sw + '" x1="0" y1="' + (-b.h / 2) + '" x2="0" y2="' + (-b.h / 2 - 28 * sc) + '"/>';
    g += '<circle data-xh="rot" style="' + hst + '" cx="0" cy="' + (-b.h / 2 - 28 * sc) + '" r="' + hs + '"/>';
    /* ponto de âncora: círculo com cruz, no lugar de onde o clipe gira */
    var axp = (b.ax || 0) * b.w, ayp = -(b.ay || 0) * b.h;
    g += '<g data-xh="anchor" transform="translate(' + axp.toFixed(2) + ',' + ayp.toFixed(2) + ')">' +
      '<circle r="' + (hs * 1.4) + '" style="fill:none;stroke:var(--ch-type);stroke-width:' + sw + '"/>' +
      '<line x1="' + (-hs * 2) + '" x2="' + (hs * 2) + '" y1="0" y2="0" style="stroke:var(--ch-type);stroke-width:' + sw + '"/>' +
      '<line y1="' + (-hs * 2) + '" y2="' + (hs * 2) + '" x1="0" x2="0" style="stroke:var(--ch-type);stroke-width:' + sw + '"/></g>';
    g += '<rect data-xh="move" style="fill:transparent" x="' + (-b.w / 2) + '" y="' + (-b.h / 2) + '" width="' + b.w + '" height="' + b.h + '"/>';
    g += '</g>';
    svg.innerHTML = g;
    bindXform(svg, clip, b);
  };

  function bindXform(svg, clip, b) {
    var p = VE.project;
    var drag = null;
    function pos(e) {
      var r = svg.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * p.canvas.w, y: (e.clientY - r.top) / r.height * p.canvas.h };
    }
    function snap0() {
      var lt = localT(clip);
      return {
        x: VE.valueAt(clip, 'motion.x', lt), y: VE.valueAt(clip, 'motion.y', lt),
        scale: VE.valueAt(clip, 'motion.scale', lt), rot: VE.valueAt(clip, 'motion.rot', lt),
        ax: VE.valueAt(clip, 'motion.ax', lt), ay: VE.valueAt(clip, 'motion.ay', lt)
      };
    }
    svg.querySelectorAll('[data-xh]').forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        svg.setPointerCapture(e.pointerId);
        drag = { mode: e.altKey ? 'anchor' : el.dataset.xh, p0: pos(e), m0: snap0(), b: b };
      });
    });
    svg.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var q = pos(e);
      var dx = (q.x - drag.p0.x) / p.canvas.w;
      var dy = (q.y - drag.p0.y) / p.canvas.h;
      if (drag.mode === 'move') {
        VE.panels.setValue(clip, 'motion.x', drag.m0.x + dx, true);
        VE.panels.setValue(clip, 'motion.y', drag.m0.y - dy, true);
      } else if (drag.mode === 'size') {
        var d0 = Math.hypot(drag.p0.x - drag.b.cx, drag.p0.y - drag.b.cy);
        var d1 = Math.hypot(q.x - drag.b.cx, q.y - drag.b.cy);
        var k = d0 > 4 ? d1 / d0 : 1;
        VE.panels.setValue(clip, 'motion.scale', Math.max(0.01, drag.m0.scale * k), true);
      } else if (drag.mode === 'rot') {
        var a = Math.atan2(q.y - drag.b.cy, q.x - drag.b.cx) * 180 / Math.PI;
        VE.panels.setValue(clip, 'motion.rot', Math.round(-(a + 90)), true);
      } else if (drag.mode === 'anchor') {
        VE.panels.setValue(clip, 'motion.ax', Math.max(-1, Math.min(1, drag.m0.ax + (q.x - drag.p0.x) / drag.b.w)), true);
        VE.panels.setValue(clip, 'motion.ay', Math.max(-1, Math.min(1, drag.m0.ay - (q.y - drag.p0.y) / drag.b.h)), true);
      }
      M.renderTransformBox();
    });
    var end = function () {
      if (!drag) return;
      drag = null;
      VE.pushHistory();
      VE.panels.renderProps();
      VE.tl.render();
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }

})(window.VE);
