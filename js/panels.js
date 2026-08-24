/* ============================================================
   rgb_lab — catálogo de efeitos, ficha técnica (inspetor)
   e edição da máscara direto na prévia
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var P = VE.panels = {};
  var curCat = 'todos', curSearch = '', liveRows = [];
  var curStyleSearch = '';
  P.tab = 'fx';

  var SWATCHES = ['#16150f', '#efede4', '#ffffff', '#f5d000', '#d0271b', '#1c7a41',
    '#1b4fd8', '#e2670f', '#7dff9b', '#ff2e9a', '#0f380f', '#000000'];

  /* ===================== CATÁLOGO ===================== */
  P.initLibrary = function () {
    var cats = $('#fxCats');
    /* as OITO FAMÍLIAS: cada uma com a sua cor e a sua conta */
    cats.innerHTML = VE.CATS.map(function (c) {
      var n = (c.id === 'todos') ? VE.FX.length : VE.famCount(c.id);
      /* a cor da família é um filete à esquerda do chip, não um ponto:
         é mais estreito e conversa com os filetes de canal do sistema */
      var risco = c.color ? ' style="border-left-color:' + c.color + '"' : '';
      return '<button class="chip fam-chip' + (c.id === 'todos' ? ' on' : '') + '" data-cat="' + c.id +
        '"' + risco + ' title="' + esc((c.nome || c.label) + ' — ' + (c.note || '')) + '">' +
        '<span class="chip-t">' + c.label + '</span>' +
        '<b class="chip-n">' + n + '</b></button>';
    }).join('');
    cats.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      curCat = b.dataset.cat;
      cats.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c === b); });
      renderFxList();
    });
    $('#fxSearch').addEventListener('input', function (e) { curSearch = e.target.value.toLowerCase(); renderFxList(); });
    var ss = $('#styleSearch');
    if (ss) ss.addEventListener('input', function (e) { curStyleSearch = e.target.value.toLowerCase(); P.renderStyles(); });
    initTabs();
    renderFxList();
    P.renderStyles();
    P.renderPresets();
    VE.on('presets', P.renderPresets);
  };

  /* ---------------- ABAS ----------------
     Só um catálogo aberto por vez. Antes as quatro seções dividiam a mesma
     coluna, e a de efeitos colapsava até vazar por cima da galeria.      */
  function initTabs() {
    var bar = $('#sideTabs');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.stab');
      if (b) P.showTab(b.dataset.tab);
    });
    P.showTab(P.tab);
  }

  P.showTab = function (name) {
    P.tab = name;
    document.querySelectorAll('#sideTabs .stab').forEach(function (b) {
      b.classList.toggle('on', b.dataset.tab === name);
      b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false');
    });
    document.querySelectorAll('.side-tabpane').forEach(function (el) {
      el.classList.toggle('hidden', el.dataset.pane !== name);
    });
    /* a galeria só desenha miniatura quando está à vista */
    if (name === 'filters' && VE.filters) setTimeout(VE.filters.refreshThumbs, 30);
  };

  function renderFxList() {
    var list = $('#fxList');
    var items = VE.FX.filter(function (f) {
      if (curCat !== 'todos' && f.cat !== curCat) return false;
      if (curSearch) {
        var fam = (VE.FAMBY[f.cat] || {}).label || f.cat;
        if ((f.name + ' ' + f.desc + ' ' + f.cat + ' ' + fam).toLowerCase().indexOf(curSearch) < 0) return false;
      }
      return true;
    });
    var cnt = $('#fxCount'); if (cnt) cnt.textContent = String(items.length).padStart(2, '0');
    list.innerHTML = items.map(function (f, i) {
      var fam = VE.FAMBY[f.cat] || {};
      return '<button class="fxitem" draggable="true" data-fx="' + f.id + '" title="' +
        esc(f.name + ' — ' + (fam.label || f.cat)) + '">' +
        '<span class="fxno">' + String(VE.FX.indexOf(f) + 1).padStart(2, '0') + '</span>' +
        '<span class="fxtxt"><span class="fxnm">' + f.name + '</span><span class="fxds">' + f.desc + '</span></span>' +
        '<span class="fxcat" style="background:' + (f.famColor || f.color) + '"></span></button>';
    }).join('') || '<div class="insp-empty">nada encontrado</div>';

    list.querySelectorAll('.fxitem').forEach(function (el) {
      el.addEventListener('click', function () {
        if (!VE.project) { VE.app.toast('carregue uma fonte primeiro'); return; }
        var fxId = el.dataset.fx;
        var sel = VE.selected();
        if (sel) {
          /* há um clipe selecionado: o efeito é DELE */
          VE.addEffect(sel, fxId);
          VE.app.toast((VE.FXBY[fxId] || {}).name + ' → ' + sel.name);
        } else {
          /* nada selecionado: vira CAMADA DE AJUSTE sobre a sequência inteira */
          var t = VE.project.time, total = VE.duration();
          if (t > total - 0.4) t = 0;
          var c = VE.newAdjust(t, total - t, fxId);
          c.name = (VE.FXBY[fxId] || {}).name || fxId;
          var tr = VE.tracksOfClass('fx').filter(function (x) { return !VE.overlaps(x, c.start, c.dur); })[0] || VE.addTrack('fx');
          tr.clips.push(c);
          VE.select([c.id]);
          VE.app.toast('camada de ajuste — afeta tudo abaixo. arraste as bordas para mudar o alcance.');
        }
        VE.pushHistory(); VE.emit('project');
      });
      el.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/fx', el.dataset.fx);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  }

  /* ---------------- ESTILOS PRONTOS ----------------
     Cada estilo monta uma cadeia inteira de efeitos numa camada de ajuste. */
  P.renderStyles = function () {
    var box = $('#styleList');
    if (!box) return;
    var items = VE.STYLES.filter(function (st) {
      if (!curStyleSearch) return true;
      return (st.name + ' ' + (st.desc || '')).toLowerCase().indexOf(curStyleSearch) >= 0;
    });
    var cnt = $('#styleCount');
    if (cnt) cnt.textContent = String(items.length).padStart(2, '0');
    box.innerHTML = items.map(function (st) {
      return '<button class="styleitem" data-style="' + st.id + '">' +
        '<span class="stno">' + String(VE.STYLES.indexOf(st) + 1).padStart(2, '0') + '</span>' +
        '<span class="sttxt"><span class="stnm">' + esc(st.name) + '</span>' +
        '<span class="stds">' + esc(st.desc || '') + '</span></span>' +
        '<span class="stfx">' + st.fx.length + '</span></button>';
    }).join('') || '<div class="insp-empty">nada encontrado</div>';
    box.querySelectorAll('.styleitem').forEach(function (el) {
      el.addEventListener('click', function () {
        if (!VE.project) { VE.app.toast('carregue uma fonte primeiro'); return; }
        VE.applyStyle(el.dataset.style);
        VE.pushHistory(); VE.emit('project');
        VE.app.toast('estilo: ' + el.querySelector('.stnm').textContent);
      });
    });
  };

  /* ---------------- PRESETS SALVOS ---------------- */
  P.renderPresets = function () {
    var box = $('#presetList');
    if (!box) return;
    var chains = VE.presets.list('chain');
    var cnt = $('#presetCount');
    if (cnt) cnt.textContent = String(chains.length).padStart(2, '0');
    if (!chains.length) {
      box.innerHTML = '<div class="insp-empty">nenhuma cadeia salva ainda.<br><br>' +
        'selecione um clipe com efeitos e clique em + SALVAR CADEIA.</div>';
      return;
    }
    box.innerHTML = chains.map(function (p) {
      return '<div class="preset" data-p="' + p.id + '">' +
        '<span class="pno">' + (p.code || '') + '</span>' +
        '<span class="pnm">' + esc(p.name) + '</span>' +
        '<button class="pdel" data-del="' + p.id + '">✕</button></div>';
    }).join('');
    box.querySelectorAll('.preset').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.dataset.del) { VE.presets.remove(e.target.dataset.del); return; }
        VE.presets.applyChain(el.dataset.p);
        VE.pushHistory(); VE.emit('project');
        VE.app.toast('aplicado: ' + el.querySelector('.pnm').textContent);
      });
    });
  };

  /* ===================== FICHA TÉCNICA ===================== */
  P.renderProps = function () {
    var box = $('#props');
    if (!box) return;
    P.initFold();
    liveRows = [];
    var p = VE.project;
    var sel = VE.selected();
    var title = $('#inspTitle'), idl = $('#inspId');

    if (!p) { box.innerHTML = '<div class="insp-empty">sistema aguardando fonte de mídia</div>'; return; }
    if (!sel) {
      title.textContent = 'COMPOSIÇÃO';
      idl.textContent = p.canvas.w + '×' + p.canvas.h;
      box.innerHTML = compositionHtml();
      bindComposition(box);
      P.renderMaskOverlay();
      return;
    }
    VE.motion.renderInspector(box, sel);
  };

  /* ---------- composição ---------- */
  function compositionHtml() {
    var p = VE.project;
    var b = '';
    b += kv('TELA', p.canvas.w + ' × ' + p.canvas.h);
    b += kv('PROPORÇÃO', ratio(p.canvas.w, p.canvas.h));
    b += kv('DURAÇÃO', p.duration.toFixed(2) + ' s');
    b += kv('FPS', p.fps);
    var nv = 0, na = 0, nfx = 0, ncl = 0;
    p.tracks.forEach(function (t) {
      if (t.kind === 'audio') na++; else if (t.kind === 'fx') nfx++; else nv++;
      ncl += t.clips.length;
    });
    b += kv('CLIPES', ncl);
    b += kv('PISTAS DE VÍDEO', nv);
    b += kv('PISTAS DE ÁUDIO', na);
    b += kv('PISTAS DE EFEITO', nfx);
    b += kv('MARCADORES', p.markers.length);
    var h = P.plate('FICHA · COMPOSIÇÃO', b);

    var tb = '';
    tb += rowNum('__cdur', 'Duração (s)', p.duration, 0.2, VE.MAXDUR, 0.01, false);
    tb += rowNum('__cfps', 'FPS do projeto', p.fps, 1, 60, 1, false);
    tb += '<div class="subhead">LIMITE DA COMPOSIÇÃO</div>';
    tb += '<div class="prow"><label title="Até onde a linha do tempo pode ir">Limite (s)</label>' +
      '<input class="field num" data-num="__cmax" value="' + fmtNum(VE.MAXDUR) + '"><span></span></div>';
    tb += '<div class="pbtns">' + [60, 300, 600, 1800, 3600].map(function (v) {
      return '<button class="cmd cmd-sm' + (Math.round(VE.MAXDUR) === v ? ' active' : '') +
        '" data-maxdur="' + v + '">' + VE.limitLabel(v).toUpperCase() + '</button>';
    }).join('') + '</div>';
    tb += '<div class="pnote">o limite é seu: vale <b>' + VE.limitLabel() + '</b> e fica guardado nesta máquina. ' +
      'o teto real é a memória da placa de vídeo — composições muito longas com muitos efeitos podem ficar pesadas para exportar em tempo real.</div>';
    h += P.plate('TEMPO', tb, '', { key: 'COMP_TEMPO' });

    var cb = rowNum('__cw', 'Largura', p.canvas.w, 16, 4096, 2, false);
    cb += rowNum('__ch', 'Altura', p.canvas.h, 16, 4096, 2, false);
    cb += '<div class="pnote">use o seletor TELA na barra do viewport para formatos prontos</div>';
    h += P.plate('TELA', cb, '', { key: 'COMP_TELA' });

    var sb = '';
    var ks = Object.keys(VE.sources);
    if (!ks.length) sb += '<div class="pnote">nenhuma fonte</div>';
    ks.forEach(function (k, i) {
      var s = VE.sources[k];
      sb += '<div class="prow" style="grid-template-columns:1fr auto"><label>' +
        String(i + 1).padStart(2, '0') + ' ' + esc(s.name) + '</label>' +
        '<span class="micro">' + s.kind.toUpperCase() + (s.w ? ' ' + s.w + '×' + s.h : '') + '</span></div>';
    });
    h += P.plate('FONTES CARREGADAS', sb, '', { key: 'COMP_FONTES', count: ks.length });

    /* --------- sessão guardada: o que ocupa e como apagar ---------
       Guardar arquivos no navegador é ocupar disco de verdade. Quem faz
       isso tem de mostrar QUANTO e dar o botão de apagar na mesma tela —
       senão vira lixo invisível.                                     */
    /* --------- os dois arquivos de projeto, e a diferença entre eles ---
       Esta placa existe porque a diferença não é óbvia e a hora de
       descobrir não pode ser quando o trabalho já sumiu.             */
    var pw = VE.projfile ? VE.projfile.peso() : { bytes: 0, arquivos: 0 };
    var pb = '<div class="pnote"><b>COMPLETO (.rgblab)</b> — a edição <b>e os arquivos</b> dentro. ' +
      'É o que você leva para outra máquina e abre com tudo no lugar. ' +
      'Aqui daria <b>' + VE.projfile.tamanhoLegivel(pw.bytes) + '</b> com ' + pw.arquivos + ' arquivo(s).</div>';
    pb += '<div class="pbtns">' +
      '<button class="cmd cmd-sm cmd-solid" data-proj="completo">SALVAR COMPLETO</button>' +
      '<button class="cmd cmd-sm" data-proj="abrir">ABRIR…</button>' +
      '</div>';
    pb += '<div class="pnote"><b>SÓ A EDIÇÃO (.json)</b> — cortes, efeitos, máscaras, keyframes, ' +
      'legendas e traçados, em poucos KB. <b>Não leva os vídeos</b>: só reabre onde os mesmos ' +
      'arquivos forem recarregados. Serve para versionar a montagem, não para arquivar.</div>';
    pb += '<div class="pbtns"><button class="cmd cmd-sm" data-proj="leve">SALVAR SÓ A EDIÇÃO</button></div>';
    h += P.plate('ARQUIVO DE PROJETO', pb, '', { key: 'COMP_ARQ' });

    var ab = '<div id="autoInfo" class="pnote">medindo o que está guardado…</div>';
    ab += '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-auto="agora">GUARDAR AGORA</button>' +
      '<button class="cmd cmd-sm cmd-danger" data-auto="limpar">APAGAR A SESSÃO</button>' +
      '</div>';
    ab += '<div class="prow"><label title="Desligar para de gravar; o que já está guardado continua lá">Guardar sozinho</label>' +
      '<input type="checkbox" data-auto="liga"' + ((VE.auto && VE.auto.estaLigado()) ? ' checked' : '') + '><span></span></div>';
    h += P.plate('SESSÃO GUARDADA', ab, '', { key: 'COMP_AUTO' });
    return h;
  }

  /* preenche a placa depois, porque medir o banco é assíncrono */
  function medirSessao(box) {
    var el = box.querySelector('#autoInfo');
    if (!el || !VE.auto || !VE.auto.espaco) return;
    VE.auto.espaco().then(function (e) {
      var t = VE.auto.tamanhoLegivel;
      var linhas = [];
      linhas.push('<b>' + t(e.bytes) + '</b> em ' + e.arquivos + ' arquivo(s) de mídia');
      if (e.cota) {
        linhas.push('o navegador reserva até <b>' + t(e.cota) + '</b> para este site · ' +
          t(e.usadoNaOrigem) + ' em uso');
      }
      linhas.push(e.persistente
        ? 'marcado como <b>permanente</b>: o navegador não apaga sozinho'
        : 'guardado por <b>melhor esforço</b>: o navegador pode apagar se o disco apertar');
      linhas.push('fica dentro do perfil do navegador, por site — <b>não é o cache de páginas</b>, ' +
        'e limpar "imagens e arquivos em cache" não mexe nele. Só sai por este botão ou ' +
        'limpando "cookies e dados de sites".');
      if (VE.auto.erro) linhas.unshift('<b style="color:var(--sys-red)">a última gravação falhou: ' + VE.auto.erro + '</b>');
      el.innerHTML = linhas.join('<br>');
    }, function () { el.textContent = 'não consegui medir o banco'; });
  }

  function bindComposition(box) {
    medirSessao(box);
    box.querySelectorAll('[data-proj]').forEach(function (el) {
      el.addEventListener('click', function () {
        var a = el.dataset.proj;
        if (a === 'completo') document.getElementById('stSave').click();
        else if (a === 'abrir') document.getElementById('stOpen').click();
        else if (a === 'leve') VE.app.salvarLeve();
      });
    });
    box.querySelectorAll('[data-auto]').forEach(function (el) {
      var a = el.dataset.auto;
      if (a === 'liga') {
        el.addEventListener('change', function () {
          if (el.checked) { VE.auto.religar(); VE.auto.marcar(); }
          else VE.auto.desligar();
          VE.app.toast(el.checked ? 'voltou a guardar sozinho' : 'parei de guardar — o que já está guardado continua lá');
        });
        return;
      }
      el.addEventListener('click', function () {
        if (a === 'agora') {
          VE.auto.guardar().then(function (r) {
            VE.app.toast(r === 'parcial' ? 'guardei só o projeto' : (r ? 'sessão guardada' : 'não consegui guardar'),
              r ? 'ok' : 'err');
            medirSessao(box);
          });
        } else if (a === 'limpar') {
          VE.auto.limpar().then(function () {
            VE.app.toast('sessão apagada do navegador', 'ok');
            medirSessao(box);
          });
        }
      });
    });
    box.querySelectorAll('[data-num]').forEach(function (el) {
      el.addEventListener('change', function () {
        var v = parseFloat(el.value);
        if (!isFinite(v)) return;
        var k = el.dataset.num, p = VE.project;
        if (k === '__cdur') VE.setDuration(v);
        else if (k === '__cfps') p.fps = Math.max(1, Math.min(60, Math.round(v)));
        else if (k === '__cw') VE.setCanvas(v, p.canvas.h, 'custom');
        else if (k === '__ch') VE.setCanvas(p.canvas.w, v, 'custom');
        else if (k === '__cmax') { setMaxDur(v); return; }
        VE.pushHistory(); VE.emit('project'); VE.emit('canvas');
      });
      el.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') el.blur(); });
    });
    box.querySelectorAll('[data-maxdur]').forEach(function (el) {
      el.addEventListener('click', function () { setMaxDur(parseFloat(el.dataset.maxdur)); });
    });
  }

  function setMaxDur(v) {
    var novo = VE.setMaxDur(v);
    VE.app.toast('limite da composição: ' + VE.limitLabel(novo));
    VE.emit('project');
    P.renderProps();
  }

  function ratio(w, h) {
    function g(a, b) { return b ? g(b, a % b) : a; }
    var d = g(w, h);
    return (w / d) + ':' + (h / d);
  }

  function kv(k, v) {
    return '<div class="prow" style="grid-template-columns:1fr auto"><label>' + k + '</label><span class="micro" style="color:var(--ink)">' + v + '</span></div>';
  }

  /* ---------- construtores de linha ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[<>&"]/g, function (m) {
      return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[m];
    });
  }

  function fmtNum(v) {
    if (typeof v !== 'number') return v;
    if (v === Math.round(v)) return String(v);
    return Math.abs(v) < 0.1 ? v.toFixed(3) : v.toFixed(2);
  }

  function rowNum(key, label, val, min, max, step, keyable, obj) {
    var on = keyable && obj && VE.hasKeys(obj, key);
    return '<div class="prow"><label title="' + esc(label) + '">' + esc(label) + '</label>' +
      '<input class="field num" data-num="' + key + '" value="' + fmtNum(val) + '">' +
      (keyable ? '<button class="kf' + (on ? ' on' : '') + '" data-kf="' + key + '" title="animar">◆</button>' : '<span></span>') +
      '</div><div class="prow-slider"><input type="range" data-in="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></div>';
  }

  function rowSel(key, label, val, opts, keyable, obj) {
    var on = keyable && obj && VE.hasKeys(obj, key);
    return '<div class="prow"><label>' + esc(label) + '</label>' +
      '<select class="field" data-in="' + key + '" style="grid-column:2/4">' +
      opts.map(function (o, i) { return '<option value="' + i + '"' + ((val | 0) === i ? ' selected' : '') + '>' + o + '</option>'; }).join('') +
      '</select>' + (keyable ? '<button class="kf' + (on ? ' on' : '') + '" data-kf="' + key + '">◆</button>' : '') + '</div>';
  }

  function paramRow(pr, c) {
    var val = c.params[pr.k];
    if (val === undefined) val = pr.def;
    if (pr.t === 'c') {
      return '<div class="prow" style="grid-template-columns:1fr auto"><label>' + esc(pr.label) + '</label>' +
        '<input type="color" data-in="' + pr.k + '" value="' + (val || '#ffffff') + '"></div>' +
        '<div class="prow-slider"><div class="swatches">' + SWATCHES.map(function (s) {
          return '<button class="swatch" style="background:' + s + '" data-sw="' + s + '" data-for="' + pr.k + '"></button>';
        }).join('') + '</div></div>';
    }
    if (pr.t === 's') return rowSel(pr.k, pr.label, val, pr.opts, pr.uni !== false, c);
    if (pr.t === 'b') {
      return '<div class="prow"><label>' + esc(pr.label) + '</label>' +
        '<input type="checkbox" data-in="' + pr.k + '"' + (val > 0.5 ? ' checked' : '') + '><span></span></div>';
    }
    if (pr.t === 'txt') {
      return '<div class="prow wide"><label>' + esc(pr.label) + '</label></div>' +
        '<div class="prow-slider"><input type="text" class="field" data-in="' + pr.k + '" value="' + esc(val) + '" spellcheck="false"></div>';
    }
    return rowNum(pr.k, pr.label, val, pr.min, pr.max, pr.step, true, c);
  }

  /* ------------------------------------------ MARCAR OBJETO (I.A.)
     O quadro que a I.A. vê é o MESMO que está na tela — copiado do canvas
     de composição depois de um render forçado, porque um canvas WebGL sem
     `preserveDrawingBuffer` pode estar vazio fora do laço de desenho.

     O contorno volta em uv da IMAGEM (y para baixo) e é convertido para o
     espaço da máscara com `daTela`, o mesmo caminho que o arrasto usa —
     assim o resultado já nasce certo com deslocamento, escala e giro da
     máscara aplicados.                                                */
  function quadroParaIA() {
    var gl = document.getElementById('gl');
    if (!gl) return null;
    try { VE.app.renderNow(); } catch (e) { }
    var c = document.createElement('canvas');
    c.width = gl.width; c.height = gl.height;
    try { c.getContext('2d').drawImage(gl, 0, 0); } catch (e) { return null; }
    return c;
  }

  P.marcarObjetoEm = function (clip, mi, ux, uy) {
    var m = (clip.masks || [])[mi];
    if (!VE.ehCaneta(m)) return;
    var W = VE.project.canvas.w, H = VE.project.canvas.h;
    var pre = 'masks.' + mi + '.';
    var lt = Math.max(0, Math.min(clip.dur, VE.project.time - clip.start));
    /* o mesmo caminho de volta que o editor usa: referência em 0,5,
       escala, giro e deslocamento — só que ao contrário */
    var dx = VE.valueAt(clip, pre + 'x', lt) - 0.5;
    var dy = VE.valueAt(clip, pre + 'y', lt) - 0.5;
    var esc = Math.max(0.01, VE.valueAt(clip, pre + 'w', lt));
    var ang = VE.valueAt(clip, pre + 'ang', lt) * Math.PI / 180;
    var aspect = W / H;
    function daTela(px, py) {
      var qx = (px / W - 0.5 - dx) * aspect, qy = ((1 - py / H) - 0.5 - dy);
      var c = Math.cos(-ang), s2 = Math.sin(-ang);
      var rx = qx * c - qy * s2, ry = qx * s2 + qy * c;
      return { x: rx / (aspect * esc) + 0.5, y: ry / esc + 0.5 };
    }
    marcarNoPonto(clip, mi, m, daTela, ux, uy);
  };

  function marcarNoPonto(clip, mi, m, daTela, ux, uy) {
    var img = quadroParaIA();
    if (!img) { VE.app.toast('não achei o quadro na tela', 'err'); return; }
    var W = VE.project.canvas.w, H = VE.project.canvas.h;
    var lt = Math.max(0, Math.min(clip.dur, VE.project.time - clip.start));
    VE.app.toast('procurando o objeto…');
    VE.marcar.carregar().then(function (ok) {
      if (!ok) { VE.app.toast('a I.A. não carregou: ' + VE.marcar.motivo(), 'err'); return null; }
      return VE.marcar.pontosDe(img, ux, uy, VE.MASK_MAX_PTS);
    }).then(function (r) {
      if (!r) return;
      var novos = r.pts.map(function (p) { return daTela(p.x * W, p.y * H); });
      var linha = r.contorno.map(function (p) { return daTela(p.x * W, p.y * H); });
      var atuais = (m.pts || []);
      if (atuais.length < 3) {
        /* PREENCHER: o traçado nasce inteiro, já fechado */
        m.pts = novos.map(function (p) { return VE.newMaskPt(p.x, p.y); });
        m.aberta = 0;
        VE.app.toast('contorno com ' + m.pts.length + ' pontos — arraste para corrigir, SUAVIZAR TUDO para curvar', 'ok');
      } else {
        /* SEGUIR: os vértices que existem encostam no contorno novo. A
           quantidade não muda, as alças ficam — é o que permite ter
           keyframe antes e depois disto.                            */
        var agora = atuais.map(function (p, j) {
          return { x: VE.valueAt(clip, 'masks.' + mi + '.pts.' + j + '.x', lt),
                   y: VE.valueAt(clip, 'masks.' + mi + '.pts.' + j + '.y', lt) };
        });
        var destino = VE.marcar.encostar(agora, linha);
        if (!destino) { VE.app.toast('não consegui encostar os vértices', 'err'); return; }
        if (VE.compui.canetaAnimada(clip, mi)) VE.compui.canetaPose(clip, mi, lt);
        destino.forEach(function (p, j) {
          P.setValue(clip, 'masks.' + mi + '.pts.' + j + '.x', p.x);
          P.setValue(clip, 'masks.' + mi + '.pts.' + j + '.y', p.y);
        });
        VE.app.toast(destino.length + ' vértices encostados no objeto deste quadro', 'ok');
      }
      VE.compui.marcarArmado = null;
      VE.pushHistory(); VE.emit('project');
      P.renderProps(); P.renderMaskOverlay();
    }).catch(function (e) {
      VE.compui.marcarArmado = null;
      P.renderProps(); P.renderMaskOverlay();
      VE.app.toast('a I.A. não achou objeto aqui: ' + (e && e.message ? e.message : e), 'err');
    });
  }

  /* ---------- escrita de valores ----------
     Se a propriedade está animada e o cursor está dentro do clipe, escrever
     um valor CRIA/ATUALIZA um keyframe — exatamente como no Premiere.     */
  function setKeyable(clip, path, v) {
    var localT = VE.project.time - clip.start;
    var inside = localT >= -0.001 && localT <= clip.dur + 0.001;
    if (VE.hasKeys(clip, path) && inside) {
      VE.setKey(clip, path, Math.max(0, Math.min(clip.dur, localT)), v);
      return;
    }
    VE.writeProp(clip, path, v);
  }
  P.setValue = function (clip, path, v, live) {
    setKeyable(clip, path, v);
    VE.emit('livechange');
    if (!live) { VE.pushHistory(); VE.tl.render(); }
  };
  P.setKeyable = setKeyable;

  function wireInputs(box, obj, apply) {
    box.querySelectorAll('[data-in]').forEach(function (el) {
      var key = el.dataset.in;
      var handler = function (live) {
        return function () {
          var v;
          if (el.type === 'checkbox') v = el.checked ? 1 : 0;
          else if (el.type === 'color' || el.type === 'text') v = el.value;
          else v = parseFloat(el.value);
          apply(key, v, live);
          var num = box.querySelector('[data-num="' + key + '"]');
          if (num && typeof v === 'number') num.value = fmtNum(v);
        };
      };
      el.addEventListener('input', handler(true));
      el.addEventListener('change', handler(false));
    });
    box.querySelectorAll('[data-num]').forEach(function (el) {
      el.addEventListener('change', function () {
        var v = parseFloat(el.value);
        if (!isFinite(v)) return;
        var key = el.dataset.num;
        var rng = box.querySelector('input[type=range][data-in="' + key + '"]');
        if (rng) { rng.value = v; }
        apply(key, v, false);
      });
      el.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') el.blur(); });
    });
  }

  /* as linhas animadas se atualizam sozinhas enquanto a composição toca */
  P.liveRows = function (rows) { liveRows = rows || []; };
  P.pushLive = function (r) { liveRows.push(r); };

  P.syncLive = function () {
    if (!liveRows.length || !VE.project) return;
    var t = VE.project.time;
    liveRows.forEach(function (r) {
      var local = t - r.clip.start;
      if (local < 0 || local > r.clip.dur) return;
      var v = VE.valueAt(r.clip, r.path, local);
      if (r.mul) v *= r.mul;
      if (r.rng) r.rng.value = v;
      if (r.num) r.num.value = fmtNum(v);
    });
  };

  /* ===================== PLACAS RECOLHÍVEIS =====================
     Cada bloco da coluna direita (TEMPO, MOTION, ÁUDIO, TRANSIÇÕES,
     EFEITOS, KEYFRAMES…) tem uma setinha no cabeçalho. Clicando, o
     bloco encolhe até virar só o título — dá para deixar um aberto e
     todos os outros fechados, e trabalhar num de cada vez.
     O estado é por BLOCO e sobrevive a recarregar a página.          */

  var FOLDKEY = 'videorte.folded';
  var folded = {};
  try { folded = JSON.parse(localStorage.getItem(FOLDKEY) || '{}') || {}; } catch (e) { folded = {}; }

  function saveFolded() {
    try { localStorage.setItem(FOLDKEY, JSON.stringify(folded)); } catch (e) { }
  }

  /* chave estável do bloco: o título, sem acento e sem espaço */
  function plateKey(title) {
    return String(title).replace(/<[^>]*>/g, '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'BLOCO';
  }

  P.isFolded = function (title) { return !!folded[plateKey(title)]; };

  P.plate = function (title, body, extra, opts) {
    opts = opts || {};
    var key = opts.key || plateKey(title);
    var off = !!folded[key];
    var count = opts.count != null ? '<i class="plate-n">' + opts.count + '</i>' : '';
    return '<div class="plate' + (off ? ' folded' : '') + '" data-plate="' + key + '">' +
      '<div class="plate-h">' +
      '<button class="plate-fold" data-fold="' + key + '" aria-expanded="' + (off ? 'false' : 'true') +
      '" title="' + (off ? 'Abrir' : 'Recolher') + ' ' + esc(String(title).replace(/<[^>]*>/g, '')) + '">▾</button>' +
      /* o TÍTULO também recolhe. É onde a mão vai primeiro, e uma seta de
         14px não é alvo para quem chega agora.                          */
      '<span class="lbl lbl-fold" data-fold="' + key + '">' + title + '</span>' + count + '<i class="l"></i>' +
      (extra || '') + '</div>' +
      '<div class="plate-b">' + body + '</div></div>';
  };

  /* clique na setinha — delegado, vale para tudo que a coluna desenhar */
  P.initFold = function () {
    var insp = $('#insp');
    if (!insp || insp.dataset.foldwired) return;
    insp.dataset.foldwired = '1';
    var fa = $('#inspFoldAll'), oa = $('#inspOpenAll');
    if (fa) fa.addEventListener('click', function () { P.foldAll(); });
    if (oa) oa.addEventListener('click', function () { P.unfoldAll(); });
    insp.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-fold]') : null;
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var key = b.dataset.fold;
      var plate = b.closest('.plate');
      /* alt+clique: fecha todos os outros e deixa só este aberto */
      if (e.altKey) {
        insp.querySelectorAll('.plate[data-plate]').forEach(function (pl) {
          var k = pl.dataset.plate, off = (k !== key);
          pl.classList.toggle('folded', off);
          folded[k] = off;
          var bb = pl.querySelector('[data-fold]');
          if (bb) bb.setAttribute('aria-expanded', off ? 'false' : 'true');
        });
        saveFolded();
        return;
      }
      var novo = !plate.classList.contains('folded');
      plate.classList.toggle('folded', novo);
      folded[key] = novo;
      var bb = plate.querySelector('.plate-fold');
      if (bb) bb.setAttribute('aria-expanded', novo ? 'false' : 'true');
      saveFolded();
    });
  };

  P.unfoldAll = function () {
    folded = {}; saveFolded();
    document.querySelectorAll('#insp .plate').forEach(function (pl) {
      pl.classList.remove('folded');
      var bb = pl.querySelector('[data-fold]');
      if (bb) bb.setAttribute('aria-expanded', 'true');
    });
  };

  P.foldAll = function () {
    document.querySelectorAll('#insp .plate[data-plate]').forEach(function (pl) {
      pl.classList.add('folded');
      folded[pl.dataset.plate] = true;
      var bb = pl.querySelector('[data-fold]');
      if (bb) bb.setAttribute('aria-expanded', 'false');
    });
    saveFolded();
  };

  /* helpers de interface reaproveitados pelo painel de MOTION / EFEITOS */
  P.ui = {
    esc: esc, fmtNum: fmtNum, kv: kv, plate: P.plate,
    rowNum: rowNum, rowSel: rowSel, paramRow: paramRow,
    wireInputs: wireInputs, SWATCHES: SWATCHES
  };

  /* ===================== MÁSCARA NA PRÉVIA ===================== */
  P.renderMaskOverlay = function () {
    var svg = $('#maskOverlay');
    if (!svg) return;
    /* A CANETA tem prioridade: enquanto o traçado está aberto, é ELE que
       o mouse edita na prévia. Fechar a caneta devolve a sobreposição
       à máscara de efeito, como era.                                 */
    if (VE.compui && VE.compui.canetaEdit && desenhaCaneta(svg)) return;
    var foc = VE.motion && VE.motion.focusEffect ? VE.motion.focusEffect() : null;
    if (!foc || !foc.effect.mask || !foc.effect.mask.shape || (foc.effect.mask.shape | 0) === 5) {
      svg.innerHTML = ''; svg.classList.remove('active'); return;
    }
    var clip = foc.clip, eff = foc.effect;
    var pre = 'fx.' + eff.id + '.mask.';
    var c = {
      start: clip.start, dur: clip.dur, mask: eff.mask,
      __clip: clip, __pre: pre
    };
    svg.classList.add('active');
    var W = VE.project.canvas.w, H = VE.project.canvas.h;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var lt = Math.max(0, Math.min(c.dur, VE.project.time - c.start));
    var mx = VE.valueAt(clip, pre + 'x', lt), my = VE.valueAt(clip, pre + 'y', lt);
    var mw = VE.valueAt(clip, pre + 'w', lt), mh = VE.valueAt(clip, pre + 'h', lt);
    var ang = VE.valueAt(clip, pre + 'ang', lt);
    var cx = mx * W, cy = (1 - my) * H, w = mw * W, h = mh * H;
    var sc = 1 / Math.max(0.05, (VE.view ? VE.view.zoom : 1));
    var hs = 5 * sc, sw = 1.4 * sc;
    var g = '<g transform="translate(' + cx + ',' + cy + ') rotate(' + (-ang) + ')">';
    var st = 'fill:none;stroke:#f5d000;stroke-width:' + sw + ';stroke-dasharray:' + (6 * sc) + ' ' + (4 * sc);
    var fl = 'fill:rgba(245,208,0,.10)';
    if (c.mask.shape === 1) g += '<rect style="' + fl + '" x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '"/><rect style="' + st + '" x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '"/>';
    else if (c.mask.shape === 2) g += '<ellipse style="' + fl + '" rx="' + (w / 2) + '" ry="' + (h / 2) + '"/><ellipse style="' + st + '" rx="' + (w / 2) + '" ry="' + (h / 2) + '"/>';
    else if (c.mask.shape === 3) g += '<rect style="' + fl + '" x="' + (-W) + '" y="' + (-h / 2) + '" width="' + (W * 3) + '" height="' + h + '"/><rect style="' + st + '" x="' + (-W) + '" y="' + (-h / 2) + '" width="' + (W * 3) + '" height="' + h + '"/>';
    else g += '<rect style="' + fl + '" x="' + (-w / 2) + '" y="' + (-H) + '" width="' + w + '" height="' + (H * 3) + '"/><rect style="' + st + '" x="' + (-w / 2) + '" y="' + (-H) + '" width="' + w + '" height="' + (H * 3) + '"/>';
    var hst = 'fill:#efede4;stroke:#16150f;stroke-width:' + sw;
    g += '<rect data-mh="size" style="' + hst + '" x="' + (w / 2 - hs) + '" y="' + (h / 2 - hs) + '" width="' + (hs * 2) + '" height="' + (hs * 2) + '"/>';
    g += '<line style="stroke:#16150f;stroke-width:' + sw + '" x1="0" y1="' + (-h / 2) + '" x2="0" y2="' + (-h / 2 - 26 * sc) + '"/>';
    g += '<circle data-mh="rot" style="' + hst + '" cx="0" cy="' + (-h / 2 - 26 * sc) + '" r="' + hs + '"/>';
    g += '<rect data-mh="move" style="' + hst + '" x="' + (-hs) + '" y="' + (-hs) + '" width="' + (hs * 2) + '" height="' + (hs * 2) + '"/>';
    g += '</g>';
    svg.innerHTML = g;
    bindMask(svg, c);
  };

  /* ═════════════════════════════════════════════ A CANETA NA PRÉVIA ═════
     Aqui a máscara deixa de ser um formulário e vira desenho.

     Dois estados, como em qualquer caneta:

       DESENHANDO (`m.aberta`)  cada clique põe um vértice; ARRASTAR ao
                                clicar puxa a alça e o trecho já nasce
                                curvo; clicar no primeiro ponto fecha.
       EDITANDO                 arrastar move o vértice, arrastar a bolinha
                                move a alça, clique numa linha põe vértice
                                no meio, alt+clique tira.

     O valor mostrado é sempre o ANIMADO (`valueAt`), não o guardado —
     senão, num traçado com keyframes, o desenho apareceria no lugar do
     primeiro quadro enquanto a imagem já está noutro instante.

     E escrever passa por `P.setValue`, que grava keyframe quando aquilo
     está animado e valor direto quando não está. É isso que faz a
     rotoscopia funcionar: marcar todos, avançar, arrastar.            */
  function desenhaCaneta(svg) {
    var ed = VE.compui.canetaEdit;
    var f = VE.findClip(ed.clipId);
    if (!f) { VE.compui.canetaEdit = null; return false; }
    var clip = f.clip;
    var m = (clip.masks || [])[ed.mi];
    if (!VE.ehCaneta(m)) { VE.compui.canetaEdit = null; return false; }
    VE.maskPtsOk(m);

    var W = VE.project.canvas.w, H = VE.project.canvas.h;
    svg.classList.add('active');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    var pre = 'masks.' + ed.mi + '.';
    var lt = Math.max(0, Math.min(clip.dur, VE.project.time - clip.start));
    var dx = VE.valueAt(clip, pre + 'x', lt) - 0.5;
    var dy = VE.valueAt(clip, pre + 'y', lt) - 0.5;
    var esc = Math.max(0.01, VE.valueAt(clip, pre + 'w', lt));
    var ang = VE.valueAt(clip, pre + 'ang', lt) * Math.PI / 180;
    var aspect = W / H;

    /* O mesmo caminho que o shader percorre, para o desenho bater com o
       recorte: referência fixa em 0,5 · escala · rotação · deslocamento.

       No shader o Y cresce PARA CIMA (é `vUv`, a convenção do `y` de
       todas as máscaras daqui); na tela cresce para baixo. A volta é
       feita no ÚLTIMO passo, só na conversão para pixel — antes disso,
       a rotação sairia espelhada junto.                             */
    function paraTela(p) {
      var qx = (p.x - 0.5) * aspect * esc, qy = (p.y - 0.5) * esc;
      var c = Math.cos(ang), s = Math.sin(ang);
      var rx = qx * c - qy * s, ry = qx * s + qy * c;
      return { x: (rx / aspect + 0.5 + dx) * W, y: (1 - (ry + 0.5 + dy)) * H };
    }
    function daTela(px, py) {
      var qx = (px / W - 0.5 - dx) * aspect, qy = ((1 - py / H) - 0.5 - dy);
      var c = Math.cos(-ang), s = Math.sin(-ang);
      var rx = qx * c - qy * s, ry = qx * s + qy * c;
      return { x: rx / (aspect * esc) + 0.5, y: ry / esc + 0.5 };
    }
    P.__canetaDaTela = daTela;
    P.__canetaParaTela = paraTela;

    /* vértices e alças no instante atual */
    var vivos = (m.pts || []).map(function (p, j) {
      var q = pre + 'pts.' + j + '.';
      return {
        j: j,
        x: VE.valueAt(clip, q + 'x', lt), y: VE.valueAt(clip, q + 'y', lt),
        hix: VE.valueAt(clip, q + 'hix', lt), hiy: VE.valueAt(clip, q + 'hiy', lt),
        hox: VE.valueAt(clip, q + 'hox', lt), hoy: VE.valueAt(clip, q + 'hoy', lt),
        canto: p.canto ? 1 : 0,
        anim: VE.hasKeys(clip, q + 'x') || VE.hasKeys(clip, q + 'y')
      };
    });
    var n = vivos.length;
    var tela = vivos.map(paraTela);
    var fechado = !m.aberta && n >= 3;

    var sc = 1 / Math.max(0.05, (VE.view ? VE.view.zoom : 1));
    var hs = 5.5 * sc, sw = 1.6 * sc, ah = 4 * sc;

    function curva(p) {
      return (Math.abs(p.hix) + Math.abs(p.hiy) + Math.abs(p.hox) + Math.abs(p.hoy)) > 1e-6;
    }
    /* o contorno em SVG: `C` onde há alça, `L` onde não há. O desenho
       usa a MESMA Bézier que o shader recebe picada, então o que se vê
       é o que recorta.                                              */
    function caminho() {
      if (!n) return '';
      var d = 'M' + tela[0].x.toFixed(1) + ',' + tela[0].y.toFixed(1);
      var lim = fechado ? n : n - 1;
      for (var i = 0; i < lim; i++) {
        var a = vivos[i], b = vivos[(i + 1) % n], pb = tela[(i + 1) % n];
        if (!curva(a) && !curva(b)) { d += ' L' + pb.x.toFixed(1) + ',' + pb.y.toFixed(1); continue; }
        var c1 = paraTela({ x: a.x + a.hox, y: a.y + a.hoy });
        var c2 = paraTela({ x: b.x + b.hix, y: b.y + b.hiy });
        d += ' C' + c1.x.toFixed(1) + ',' + c1.y.toFixed(1) + ' ' +
          c2.x.toFixed(1) + ',' + c2.y.toFixed(1) + ' ' + pb.x.toFixed(1) + ',' + pb.y.toFixed(1);
      }
      if (fechado) d += ' Z';
      return d;
    }

    var g = '';
    /* fundo que recebe o clique — sem ele, clicar no vazio para pôr um
       vértice não chega a lugar nenhum em parte dos navegadores.    */
    g += '<rect data-cfundo="1" x="0" y="0" width="' + W + '" height="' + H +
      '" style="fill:transparent;' + (m.aberta ? 'cursor:crosshair' : 'cursor:crosshair') + '"/>';
    /* Um alvo com a FORMA do traçado, por baixo dos vértices: é ele que
       dá o cursor de mover e recebe o arrasto de "levar tudo junto".
       Sem ele, o clique por dentro seria indistinguível do de fora. */
    if (!m.aberta && n >= 3) {
      var dInt = (function () {
        var pl = VE.maskTesselar(vivos, aspect);
        if (!pl.length) return '';
        var s = '';
        for (var q = 0; q < pl.length; q += 2) {
          var pt = paraTela({ x: pl[q], y: pl[q + 1] });
          s += (q ? 'L' : 'M') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ' ';
        }
        return s + 'Z';
      })();
      if (dInt) g += '<path data-cdentro="1" d="' + dInt + '" style="fill:transparent;cursor:move"/>';
    }

    var d = caminho();
    if (d) {
      if (fechado) g += '<path d="' + d + '" style="fill:rgba(245,208,0,.13);stroke:none"/>';
      /* linha dupla: escura por baixo, clara por cima. Um traço amarelo
         só some em cena clara, e um escuro some em cena escura.     */
      g += '<path d="' + d + '" style="fill:none;stroke:#16150f;stroke-width:' + (sw * 2.4) + ';opacity:.55"/>';
      g += '<path d="' + d + '" style="fill:none;stroke:#f5d000;stroke-width:' + sw +
        ';stroke-dasharray:' + (7 * sc) + ' ' + (4 * sc) + '"/>';
    }

    /* alvo de clique em cada trecho — é onde nasce um vértice novo */
    if (!m.aberta && n >= 2) {
      var lim2 = fechado ? n : n - 1;
      for (var i2 = 0; i2 < lim2; i2++) {
        var a2 = vivos[i2], b2 = vivos[(i2 + 1) % n];
        var pa = tela[i2], pb2 = tela[(i2 + 1) % n];
        var dd;
        if (!curva(a2) && !curva(b2)) {
          dd = 'M' + pa.x.toFixed(1) + ',' + pa.y.toFixed(1) + ' L' + pb2.x.toFixed(1) + ',' + pb2.y.toFixed(1);
        } else {
          var k1 = paraTela({ x: a2.x + a2.hox, y: a2.y + a2.hoy });
          var k2 = paraTela({ x: b2.x + b2.hix, y: b2.y + b2.hiy });
          dd = 'M' + pa.x.toFixed(1) + ',' + pa.y.toFixed(1) + ' C' + k1.x.toFixed(1) + ',' + k1.y.toFixed(1) +
            ' ' + k2.x.toFixed(1) + ',' + k2.y.toFixed(1) + ' ' + pb2.x.toFixed(1) + ',' + pb2.y.toFixed(1);
        }
        g += '<path data-caresta="' + (i2 + 1) + '" d="' + dd +
          '" style="fill:none;stroke:transparent;stroke-width:' + (11 * sc) + ';cursor:copy"/>';
      }
    }

    /* ---- as alças, só do vértice escolhido ----
       Mostrar as alças de todos deixa a imagem ilegível. Premiere,
       Illustrator e afins mostram as do nó selecionado, e é o que faz
       sentido: só uma se está mexendo por vez.                     */
    var sel = VE.compui.canetaSel;
    if (!m.aberta && sel != null && sel < n) {
      var v = vivos[sel], pv = tela[sel];
      [['o', v.hox, v.hoy], ['i', v.hix, v.hiy]].forEach(function (t) {
        var pa2 = paraTela({ x: v.x + t[1], y: v.y + t[2] });
        g += '<line x1="' + pv.x.toFixed(1) + '" y1="' + pv.y.toFixed(1) + '" x2="' + pa2.x.toFixed(1) +
          '" y2="' + pa2.y.toFixed(1) + '" style="stroke:#00e5ff;stroke-width:' + sw + ';opacity:.9"/>';
        g += '<circle data-calca="' + t[0] + '" cx="' + pa2.x.toFixed(1) + '" cy="' + pa2.y.toFixed(1) +
          '" r="' + ah + '" style="fill:#00e5ff;stroke:#16150f;stroke-width:' + sw + ';cursor:grab"/>';
      });
    }

    /* ---- os vértices ----
       losango = tem keyframe · quadrado = não tem · aro = escolhido ·
       o primeiro fica redondo enquanto se desenha, porque é nele que
       se clica para fechar.                                        */
    vivos.forEach(function (v, i) {
      var p = tela[i];
      var escolhido = (sel === i);
      var cor = v.anim ? '#f5d000' : '#efede4';
      if (m.aberta && i === 0 && n >= 2) {
        g += '<circle data-cfechar="1" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) +
          '" r="' + (hs * 1.25) + '" style="fill:#2ee6a8;stroke:#16150f;stroke-width:' + sw + ';cursor:pointer"/>';
        return;
      }
      /* escolhido ganha aro; o ATIVO (o das alças) ganha aro cheio */
      if (VE.compui.canetaTemSel(i)) {
        g += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (hs * 1.9) +
          '" style="fill:' + (escolhido ? 'rgba(0,229,255,.25)' : 'none') +
          ';stroke:#00e5ff;stroke-width:' + sw + '"/>';
      }
      g += '<rect data-cpt="' + v.j + '" x="' + (p.x - hs).toFixed(1) + '" y="' + (p.y - hs).toFixed(1) +
        '" width="' + (hs * 2) + '" height="' + (hs * 2) + '"' +
        (v.anim ? ' transform="rotate(45 ' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')"' : '') +
        ' style="fill:' + (VE.compui.canetaTemSel(i) ? '#00e5ff' : cor) +
        ';stroke:#16150f;stroke-width:' + sw + ';cursor:move"/>';
      g += '<text x="' + (p.x + hs * 1.8).toFixed(1) + '" y="' + (p.y - hs).toFixed(1) +
        '" style="fill:#f5d000;font:' + (9 * sc) + 'px ui-monospace,monospace;paint-order:stroke;' +
        'stroke:#16150f;stroke-width:' + (2 * sc) + ';pointer-events:none">' + (v.j + 1) + '</text>';
    });

    /* o laço de seleção, enquanto o mouse arrasta fora do traçado */
    var laco = VE.compui.canetaLaco;
    if (laco) {
      var a1 = paraTela({ x: laco.x0, y: laco.y0 }), a2 = paraTela({ x: laco.x1, y: laco.y1 });
      var lx = Math.min(a1.x, a2.x), ly = Math.min(a1.y, a2.y);
      g += '<rect x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) +
        '" width="' + Math.abs(a2.x - a1.x).toFixed(1) + '" height="' + Math.abs(a2.y - a1.y).toFixed(1) +
        '" style="fill:rgba(0,229,255,.10);stroke:#00e5ff;stroke-width:' + sw +
        ';stroke-dasharray:' + (4 * sc) + ' ' + (3 * sc) + ';pointer-events:none"/>';
    }

    /* recado curto na própria imagem enquanto se desenha */
    if (m.aberta) {
      var msg = n === 0 ? 'CLIQUE PARA COMEÇAR · ARRASTE PARA CURVAR'
        : (n < 3 ? 'MAIS ' + (3 - n) + ' PONTO(S) PARA FECHAR'
          : 'CLIQUE NO PONTO VERDE PARA FECHAR · ENTER TAMBÉM FECHA');
      g += '<text x="' + (W * 0.5) + '" y="' + (H - 18 * sc) + '" text-anchor="middle" style="fill:#f5d000;font:' +
        (12 * sc) + 'px ui-monospace,monospace;paint-order:stroke;stroke:#16150f;stroke-width:' +
        (3 * sc) + ';pointer-events:none">' + msg + '</text>';
    }

    svg.innerHTML = g;
    bindCaneta(svg, clip, ed.mi, daTela, m);
    return true;
  }

  function bindCaneta(svg, clip, mi, daTela, m) {
    var pre = 'masks.' + mi + '.pts.';
    var arrasto = null;

    /* ---------------- MARCAR OBJETO (I.A.) ----------------
       Armado, o próximo clique na prévia não põe vértice nem arrasta: ele
       vai para o segmentador. Por isso o ouvinte é de CAPTURA — ele chega
       antes dos outros e engole o evento.                            */
    var arm = VE.compui.marcarArmado;
    if (VE.marcar && arm && arm.clipId === clip.id && arm.mi === mi) {
      svg.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        var r = svg.getBoundingClientRect();
        var ux = (e.clientX - r.left) / r.width, uy = (e.clientY - r.top) / r.height;
        marcarNoPonto(clip, mi, m, daTela, ux, uy);
      }, true);
    }
    
    function pos(e) {
      var r = svg.getBoundingClientRect();
      var W = VE.project.canvas.w, H = VE.project.canvas.h;
      return daTela((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H);
    }
    function agora() { return Math.max(0, Math.min(clip.dur, VE.project.time - clip.start)); }
    function refaz() { VE.pushHistory(); VE.emit('project'); P.renderProps(); P.renderMaskOverlay(); }

    /* Com a animação do caminho ligada, QUALQUER mexida grava a pose
       inteira neste instante antes de aplicar a mudança. Sem isso, mover
       um vértice criaria keyframe só para ele e os outros continuariam
       escorregando entre as poses vizinhas — o contorno se desmancharia
       no meio do arrasto, que é o pior jeito de descobrir o problema. */
    function poseAqui() {
      if (VE.compui.canetaAnimada(clip, mi)) VE.compui.canetaPose(clip, mi, agora());
    }

    /* ---------------- desenhando ---------------- */
    var fundo = svg.querySelector('[data-cfundo]');
    if (fundo && m.aberta) {
      fundo.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        var p = pos(e);
        var novo = VE.maskPtAdd(m, p.x, p.y);
        if (!novo) { VE.app.toast('cheguei ao limite de ' + VE.MASK_MAX_PTS + ' pontos', 'err'); return; }
        svg.setPointerCapture(e.pointerId);
        /* arrastar logo após pôr o ponto puxa a alça — o trecho já
           nasce curvo, que é o gesto da caneta em qualquer editor. */
        arrasto = { tipo: 'nascendo', j: m.pts.length - 1, p0: p };
        VE.compui.canetaSelUm(m.pts.length - 1);
        VE.emit('livechange'); P.renderMaskOverlay();
      });
    }
    /* ------- traçado FECHADO: por dentro arrasta tudo, por fora laça -------
       É o gesto que faltava para rotoscopia de verdade. Acompanhar uma
       garrafa que atravessa o quadro é pegar o CONTORNO e ir junto — não
       caçar doze vértices um por um a cada quadro.

       Arrastar por dentro mexe em `x`/`y` da máscara, e não nos vértices:
       é uma propriedade em vez de setenta e duas, e o desenho é o mesmo. */
    var dentroEl = svg.querySelector('[data-cdentro]');
    if (dentroEl && !m.aberta) {
      dentroEl.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        svg.setPointerCapture(e.pointerId);
        poseAqui();
        var raiz = 'masks.' + mi + '.', lt = agora();
        arrasto = { tipo: 'tudo', p0: pos(e),
          v0: { x: VE.valueAt(clip, raiz + 'x', lt), y: VE.valueAt(clip, raiz + 'y', lt) } };
      });
    }
    if (fundo && !m.aberta) {
      fundo.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        var p = pos(e);
        svg.setPointerCapture(e.pointerId);
        var raiz = 'masks.' + mi + '.';
        var lt = agora();
        if (VE.maskContem(m, p.x, p.y, VE.project.canvas.w / VE.project.canvas.h)) {
          poseAqui();
          arrasto = {
            tipo: 'tudo', p0: p,
            v0: { x: VE.valueAt(clip, raiz + 'x', lt), y: VE.valueAt(clip, raiz + 'y', lt) }
          };
        } else {
          if (!e.shiftKey) VE.compui.canetaSelNada();
          arrasto = { tipo: 'laco', p0: p, p1: p, mais: e.shiftKey, base: VE.compui.canetaSels.slice() };
        }
        P.renderMaskOverlay();
      });
    }
    var fecha = svg.querySelector('[data-cfechar]');
    if (fecha) {
      fecha.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (m.pts.length < 3) { VE.app.toast('preciso de pelo menos três pontos', 'err'); return; }
        m.aberta = 0;
        VE.app.toast('traçado fechado — agora arraste os pontos, ou SUAVIZAR para curvar tudo', 'ok');
        refaz();
      });
    }

    /* ---------------- vértices ---------------- */
    svg.querySelectorAll('[data-cpt]').forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        var j = +el.dataset.cpt;
        if (e.altKey) {
          if (!VE.maskPtDel(clip, mi, j)) { VE.app.toast('um traçado precisa de três pontos', 'err'); return; }
          VE.compui.canetaSelNada();
          refaz(); return;
        }
        /* shift acrescenta ou tira da escolha, sem arrastar */
        if (e.shiftKey) {
          VE.compui.canetaSelAlterna(j);
          P.renderProps(); P.renderMaskOverlay();
          return;
        }
        /* ponto que já faz parte de uma escolha: arrasta a escolha
           inteira. Fora dela, a escolha vira só este.              */
        if (!VE.compui.canetaTemSel(j)) VE.compui.canetaSelUm(j);
        else VE.compui.canetaSel = j;
        svg.setPointerCapture(e.pointerId);
        poseAqui();
        var lt = agora();
        var quais = VE.compui.canetaSels.length > 1 ? VE.compui.canetaSels.slice() : [j];
        arrasto = {
          tipo: 'ponto', j: j, quais: quais, p0: pos(e),
          v0: quais.map(function (k) {
            return { x: VE.valueAt(clip, pre + k + '.x', lt), y: VE.valueAt(clip, pre + k + '.y', lt) };
          })
        };
        P.renderMaskOverlay();
      });
    });

    /* ---------------- alças ---------------- */
    svg.querySelectorAll('[data-calca]').forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        var lado = el.dataset.calca, j = VE.compui.canetaSel;
        if (j == null) return;
        svg.setPointerCapture(e.pointerId);
        poseAqui();
        var lt = agora();
        arrasto = {
          tipo: 'alca', lado: lado, j: j, p0: pos(e),
          v0: {
            x: VE.valueAt(clip, pre + j + '.h' + lado + 'x', lt),
            y: VE.valueAt(clip, pre + j + '.h' + lado + 'y', lt)
          },
          /* alt segurando: quebra a simetria e a alça anda sozinha —
             é como se faz um canto vivo no meio de uma curva.     */
          solta: e.altKey
        };
        if (e.altKey && m.pts[j]) m.pts[j].canto = 1;
      });
    });

    /* ---------------- trechos: pôr vértice no meio ---------------- */
    svg.querySelectorAll('[data-caresta]').forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        var onde = +el.dataset.caresta;
        var p = pos(e);
        if (!VE.maskPtAdd(m, p.x, p.y, onde)) {
          VE.app.toast('este traçado chegou ao limite de ' + VE.MASK_MAX_PTS + ' pontos', 'err');
          return;
        }
        /* o ponto novo entrou no meio: os keyframes dos que vieram
           depois escorregam um índice, senão a animação passa a mexer
           no vértice errado no meio da cena.                      */
        var k = clip.keys || {}, novo = {};
        Object.keys(k).forEach(function (path) {
          if (path.indexOf(pre) !== 0) { novo[path] = k[path]; return; }
          var resto = path.slice(pre.length).split('.');
          var idx = +resto[0];
          novo[pre + (idx >= onde ? idx + 1 : idx) + '.' + resto[1]] = k[path];
        });
        clip.keys = novo;
        /* traçado já animado: o vértice novo precisa existir em TODAS as
           poses, senão ele nasce sem valor e o contorno pula no tempo. */
        VE.compui.canetaCompletarPoses(clip, mi, onde);
        VE.compui.canetaSel = onde;
        refaz();
      });
    });

    /* ---------------- arrastar ---------------- */
    svg.addEventListener('pointermove', function (e) {
      if (!arrasto) return;
      var p = pos(e);
      var ddx = p.x - arrasto.p0.x, ddy = p.y - arrasto.p0.y;
      if (arrasto.tipo === 'ponto') {
        arrasto.quais.forEach(function (k, i) {
          P.setValue(clip, pre + k + '.x', arrasto.v0[i].x + ddx, true);
          P.setValue(clip, pre + k + '.y', arrasto.v0[i].y + ddy, true);
        });
      } else if (arrasto.tipo === 'tudo') {
        var raiz2 = 'masks.' + mi + '.';
        P.setValue(clip, raiz2 + 'x', arrasto.v0.x + ddx, true);
        P.setValue(clip, raiz2 + 'y', arrasto.v0.y + ddy, true);
      } else if (arrasto.tipo === 'laco') {
        arrasto.p1 = p;
        var x0 = Math.min(arrasto.p0.x, p.x), x1 = Math.max(arrasto.p0.x, p.x);
        var y0 = Math.min(arrasto.p0.y, p.y), y1 = Math.max(arrasto.p0.y, p.y);
        var lt2 = agora();
        var dentro = [];
        (m.pts || []).forEach(function (_, k) {
          var px = VE.valueAt(clip, pre + k + '.x', lt2);
          var py = VE.valueAt(clip, pre + k + '.y', lt2);
          if (px >= x0 && px <= x1 && py >= y0 && py <= y1) dentro.push(k);
        });
        VE.compui.canetaSels = arrasto.mais
          ? arrasto.base.concat(dentro.filter(function (k) { return arrasto.base.indexOf(k) < 0; }))
          : dentro;
        VE.compui.canetaSel = VE.compui.canetaSels.length === 1 ? VE.compui.canetaSels[0] : null;
        VE.compui.canetaLaco = { x0: x0, x1: x1, y0: y0, y1: y1 };
      } else if (arrasto.tipo === 'nascendo') {
        /* a alça de saída segue o dedo; a de entrada espelha, para o
           trecho anterior chegar liso no ponto novo.               */
        var pt = m.pts[arrasto.j];
        if (!pt) return;
        pt.hox = ddx; pt.hoy = ddy;
        pt.hix = -ddx; pt.hiy = -ddy;
        VE.emit('livechange');
      } else if (arrasto.tipo === 'alca') {
        var lado = arrasto.lado, j = arrasto.j;
        var nx = arrasto.v0.x + ddx, ny = arrasto.v0.y + ddy;
        P.setValue(clip, pre + j + '.h' + lado + 'x', nx, true);
        P.setValue(clip, pre + j + '.h' + lado + 'y', ny, true);
        var pt2 = m.pts[j];
        if (pt2 && !arrasto.solta && !pt2.canto) {
          var outro = lado === 'o' ? 'i' : 'o';
          P.setValue(clip, pre + j + '.h' + outro + 'x', -nx, true);
          P.setValue(clip, pre + j + '.h' + outro + 'y', -ny, true);
        }
      }
      P.renderMaskOverlay();
    });
    var fim = function () {
      if (!arrasto) return;
      var era = arrasto.tipo;
      arrasto = null;
      VE.compui.canetaLaco = null;
      if (era !== 'laco') VE.pushHistory();
      if (era === 'nascendo') { VE.emit('project'); P.renderProps(); }
      else { P.renderProps(); P.renderMaskOverlay(); }
    };
    svg.addEventListener('pointerup', fim);
    svg.addEventListener('pointercancel', fim);
  }

  /* ENTER fecha o traçado, ESC volta um ponto — os dois atalhos que toda
     caneta tem, e sem eles fechar depende de acertar um alvo pequeno. */
  window.addEventListener('keydown', function (e) {
    var ed = VE.compui && VE.compui.canetaEdit;
    if (!ed) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    var f = VE.findClip(ed.clipId);
    if (!f) return;
    var m = (f.clip.masks || [])[ed.mi];
    if (!VE.ehCaneta(m)) return;
    if (e.key === 'Enter' && m.aberta) {
      e.preventDefault();
      if ((m.pts || []).length < 3) { VE.app.toast('preciso de pelo menos três pontos', 'err'); return; }
      m.aberta = 0; VE.pushHistory(); VE.emit('project');
      P.renderProps(); P.renderMaskOverlay();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (m.aberta && (m.pts || []).length) {
        m.pts.pop(); VE.compui.canetaSel = null;
        VE.emit('project'); P.renderProps(); P.renderMaskOverlay();
      } else {
        VE.compui.canetaEdit = null; P.renderProps(); P.renderMaskOverlay();
      }
    }
  });

  function bindMask(svg, c) {
    var drag = null;
    function pos(e) {
      var r = svg.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
    }
    var clip = c.__clip, pre = c.__pre;
    function snap0() {
      var lt = Math.max(0, Math.min(c.dur, VE.project.time - c.start));
      return {
        x: VE.valueAt(clip, pre + 'x', lt), y: VE.valueAt(clip, pre + 'y', lt),
        w: VE.valueAt(clip, pre + 'w', lt), h: VE.valueAt(clip, pre + 'h', lt),
        ang: VE.valueAt(clip, pre + 'ang', lt)
      };
    }
    svg.querySelectorAll('[data-mh]').forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        svg.setPointerCapture(e.pointerId);
        drag = { mode: el.dataset.mh, p0: pos(e), m0: snap0() };
      });
    });
    svg.addEventListener('pointerdown', function (e) {
      if (drag) return;
      e.preventDefault(); e.stopPropagation();
      svg.setPointerCapture(e.pointerId);
      drag = { mode: 'move', p0: pos(e), m0: snap0() };
    });
    svg.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var p = pos(e), dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
      if (drag.mode === 'move') {
        P.setValue(clip, pre + 'x', drag.m0.x + dx, true);
        P.setValue(clip, pre + 'y', drag.m0.y + dy, true);
      } else if (drag.mode === 'size') {
        P.setValue(clip, pre + 'w', Math.max(0.01, drag.m0.w + dx * 2), true);
        P.setValue(clip, pre + 'h', Math.max(0.01, drag.m0.h - dy * 2), true);
      } else if (drag.mode === 'rot') {
        var a = Math.atan2(p.y - drag.m0.y, p.x - drag.m0.x) * 180 / Math.PI;
        P.setValue(clip, pre + 'ang', Math.round(a - 90), true);
      }
      P.renderMaskOverlay();
    });
    var end = function () { if (!drag) return; drag = null; VE.pushHistory(); P.renderProps(); };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }

})(window.VE);
