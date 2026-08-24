/* ==========================================================================
   rgb_lab — A FICHA DA COMPOSIÇÃO
   --------------------------------------------------------------------------
   As seções que a coluna da direita ganha quando um clipe de vídeo está
   selecionado. Elas moram aqui e não em `motion.js` porque motion.js já
   carrega tempo, movimento, transições, pilha de efeitos, áudio reativo e
   keyframes — e um arquivo que faz seis coisas não deixa entrar a sétima
   sem começar a mentir sobre o que é.

   Nada aqui desenha na tela nem fala com WebGL. Isto monta HTML e liga
   eventos; quem desenha é `gl.js`, com o que `comp.js` resolveu.

   Todas as seções nascem RECOLHIDAS. Uma pessoa que só quer cortar dois
   clipes não deve ter de rolar por cinquenta controles que não pediu.
   ========================================================================== */
(function (VE) {
  'use strict';

  var C = VE.compui = {};
  var U = null;                    /* VE.panels.ui, resolvido na primeira chamada */
  var maskAberta = 0;              /* índice da máscara aberta na lista */

  function ui() { return U || (U = VE.panels.ui); }
  function esc(s) { return ui().esc(s); }

  /* ------------------------------------------------------------- uma linha
     Igual às linhas do resto da ficha, mas com caminho ANIMÁVEL: o losango
     liga keyframe naquela propriedade, exatamente como em MOTION.        */
  function linha(clip, path, label, min, max, step, dec) {
    /* Propriedade que motion.js converte (px, %, graus) tem de ser desenhada
       POR ELE. Desenhar aqui um trilho em 0..1 para `motion.opacity` fazia o
       ouvinte compartilhado gravar valor/100: arrastar até 0,1 virava 0,001
       e a camada sumia da tela sem sumir da linha do tempo.              */
    if (VE.motion && VE.motion.temConv && VE.motion.temConv(path)) {
      return VE.motion.prop(clip, path, label);
    }
    var lt = Math.max(0, Math.min(clip.dur, (VE.project.time - clip.start)));
    var v = VE.valueAt(clip, path, lt);
    if (typeof v !== 'number' || !isFinite(v)) v = 0;
    var anim = VE.hasKeys(clip, path);
    var q = path.replace(/"/g, '\\"');
    return '<div class="prow"><label data-focus="' + q + '" title="' + esc(label) + '">' + esc(label) + '</label>' +
      '<input class="field num" data-mnum="' + q + '" value="' + v.toFixed(dec === undefined ? 2 : dec) + '">' +
      '<button class="kf' + (anim ? ' on' : '') + '" data-anim="' + q + '" title="animar">◆</button>' +
      '</div><div class="prow-slider">' +
      '<input type="range" data-mrange="' + q + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '"></div>';
  }

  function alterna(rot, ligado, acao, dica) {
    return '<button class="cmd cmd-sm' + (ligado ? ' active' : '') + '" data-cact="' + acao + '"' +
      (dica ? ' title="' + esc(dica) + '"' : '') + '>' + rot + '</button>';
  }

  function nota(t) { return '<div class="pnote">' + t + '</div>'; }

  /* ====================================================== SELETOR DE MODO ===
     27 modos em seis grupos, cada um com uma MINIATURA de verdade: duas
     faixas de teste passadas pela mesma matemática que o shader usa, feitas
     uma vez em canvas e guardadas como imagem. Ver a conta acontecer numa
     amostra ensina mais rápido do que qualquer nome.                      */
  var miniCache = null;

  function fazMiniaturas() {
    if (miniCache) return miniCache;
    var W = 46, H = 26;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    var img = ctx.createImageData(W, H);

    /* fundo: uma rampa de cinza com uma faixa colorida — dá para ver o que
       cada modo faz com claro, com escuro e com cor.
       camada: uma diagonal clara sobre metade escura.                    */
    function fundo(x, y) {
      var g = x / (W - 1);
      var azul = (y > H * 0.62) ? 1 : 0;
      return azul ? [0.12 + g * 0.5, 0.28 + g * 0.35, 0.85 - g * 0.3]
        : [g, g * 0.96, g * 0.9];
    }
    function fonte(x, y) {
      var d = (x / W + (1 - y / H)) * 0.5;
      var q = Math.max(0, Math.min(1, d * 1.35 - 0.12));
      return [q, q * 0.72 + 0.1, 1 - q * 0.85];
    }

    var lum = function (c) { return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]; };
    function sat(c) { return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]); }
    function setLum(c, l) {
      var d = l - lum(c), r = [c[0] + d, c[1] + d, c[2] + d];
      var n = lum(r), lo = Math.min(r[0], r[1], r[2]), hi = Math.max(r[0], r[1], r[2]);
      if (lo < 0) r = r.map(function (x) { return n + (x - n) * n / Math.max(n - lo, 1e-4); });
      if (hi > 1) r = r.map(function (x) { return n + (x - n) * (1 - n) / Math.max(hi - n, 1e-4); });
      return r;
    }
    function setSat(c, s) {
      var mn = Math.min(c[0], c[1], c[2]), mx = Math.max(c[0], c[1], c[2]);
      return (mx > mn) ? c.map(function (x) { return (x - mn) * s / (mx - mn); }) : [0, 0, 0];
    }
    function burn(b, s) { return s <= 0 ? 0 : 1 - Math.min(1, (1 - b) / s); }
    function dodge(b, s) { return s >= 1 ? 1 : Math.min(1, b / (1 - s)); }
    function hard(b, s) { return s <= 0.5 ? 2 * s * b : 1 - 2 * (1 - s) * (1 - b); }
    function vivid(b, s) { return s <= 0.5 ? burn(b, 2 * s) : dodge(b, 2 * (s - 0.5)); }

    /* a mesma tabela do shader, em JS. Se um dia divergirem, a miniatura
       mente — então ela é gerada da MESMA lista de índices.             */
    function porCanal(i, b, s) {
      switch (i) {
        case 2: return Math.min(b, s);
        case 3: return b * s;
        case 4: return burn(b, s);
        case 5: return Math.max(0, Math.min(1, b + s - 1));
        case 7: return Math.max(b, s);
        case 8: return b + s - b * s;
        case 9: return dodge(b, s);
        case 10: return Math.min(1, b + s);
        case 12: return hard(b, s);
        case 13: {
          var d = b <= 0.25 ? ((16 * b - 12) * b + 4) * b : Math.sqrt(b);
          return s <= 0.5 ? b - (1 - 2 * s) * b * (1 - b) : b + (2 * s - 1) * (d - b);
        }
        case 14: return hard(s, b);
        case 15: return vivid(b, s);
        case 16: return Math.max(0, Math.min(1, b + 2 * s - 1));
        case 17: return s <= 0.5 ? Math.min(b, 2 * s) : Math.max(b, 2 * s - 1);
        case 18: return vivid(b, s) >= 0.5 ? 1 : 0;
        case 19: return Math.abs(b - s);
        case 20: return b + s - 2 * b * s;
        case 21: return Math.max(0, b - s);
        case 22: return Math.max(0, Math.min(1, b / Math.max(s, 4 / 255)));
        default: return s;
      }
    }

    miniCache = VE.BLENDS.map(function (nome, idx) {
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          var b = fundo(x, y), s = fonte(x, y), o;
          if (idx === 1) {                                  /* dissolver */
            var h = Math.abs(Math.sin((x * 12.9898 + y * 78.233)) * 43758.5453) % 1;
            o = h < 0.55 ? s : b;
          } else if (idx === 6) o = lum(b) < lum(s) ? b : s;
          else if (idx === 11) o = lum(b) > lum(s) ? b : s;
          else if (idx === 23) o = setLum(setSat(s, sat(b)), lum(b));
          else if (idx === 24) o = setLum(setSat(b, sat(s)), lum(b));
          else if (idx === 25) o = setLum(s, lum(b));
          else if (idx === 26) o = setLum(b, lum(s));
          else o = [porCanal(idx, b[0], s[0]), porCanal(idx, b[1], s[1]), porCanal(idx, b[2], s[2])];
          var k = (y * W + x) * 4;
          img.data[k] = Math.max(0, Math.min(255, o[0] * 255));
          img.data[k + 1] = Math.max(0, Math.min(255, o[1] * 255));
          img.data[k + 2] = Math.max(0, Math.min(255, o[2] * 255));
          img.data[k + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return cv.toDataURL('image/png');
    });
    return miniCache;
  }
  C.miniaturas = fazMiniaturas;

  function seletorModo(clip) {
    var minis = fazMiniaturas();
    var h = '<div class="bmgrid">';
    VE.BLEND_GRUPOS.forEach(function (g) {
      h += '<div class="bmgrupo" style="--bmc:' + g.cor + '">' + g.nome + '</div>';
      g.modos.forEach(function (m, j) {
        var idx = g.base + j;
        h += '<button class="bmitem' + (clip.blend === idx ? ' on' : '') + '" data-bm="' + idx + '"' +
          ' title="' + esc(m[1]) + '">' +
          '<img src="' + minis[idx] + '" alt="" width="46" height="26">' +
          '<span>' + esc(m[0]) + '</span></button>';
      });
    });
    return h + '</div>';
  }

  /* ============================================================ COMPOSIÇÃO */
  C.composicao = function (clip) {
    var L = VE.ensureLayer(clip);
    var h = '';
    /* O modo escolhido ocupa uma FAIXA INTEIRA, não uma célula da grade de
       três colunas: aquela grade reserva 54px e 16px para número e losango,
       e o botão de escolher não cabia — chegava cortado na tela.
       De quebra, a faixa mostra a miniatura do modo que está valendo, então
       dá para ver o que ele faz sem abrir nada.                          */
    var minis = fazMiniaturas();
    var gi = VE.BLEND_GRUPO_DE[clip.blend] || 0;
    h += '<div class="prow wide"><label>MODO DE MISTURA</label></div>';
    h += '<div class="prow-slider">' +
      '<button class="bmopen' + (C.gradeAberta ? ' on' : '') + '" data-cact="bmopen">' +
      '<img src="' + minis[clip.blend] + '" width="46" height="26" alt="">' +
      '<span class="bmtxt"><b>' + esc(VE.BLENDS[clip.blend] || 'Normal') + '</b>' +
      '<i>' + VE.BLEND_GRUPOS[gi].nome + '</i></span>' +
      '<span class="bmcta">' + (C.gradeAberta ? 'FECHAR ▴' : 'ESCOLHER ▾') + '</span>' +
      '</button></div>';
    if (C.gradeAberta) h += seletorModo(clip);
    h += nota(VE.BLEND_INFO[clip.blend] || '');
    h += linha(clip, 'motion.opacity', 'OPACIDADE', 0, 1, 0.001, 3);
    h += linha(clip, 'layer.fill', 'PREENCHIMENTO', 0, 1, 0.001, 3);
    h += nota('<b>opacidade</b> tira a camada da frente. <b>preenchimento</b> tira a conversa dela com o que está embaixo: ' +
      'em 0 a camada continua inteira, mas o modo de mistura para de valer. em NORMAL os dois fazem a mesma coisa — ' +
      'a diferença só aparece em multiplicar, tela, diferença e companhia.');
    h += '<div class="subhead">ESPAÇO DE CÁLCULO</div>';
    h += '<div class="pbtns">' +
      alterna('PERCEPTIVO', !L.espaco, 'esp0', 'como o Photoshop: a mistura acontece no valor que você vê') +
      alterna('LUZ LINEAR', !!L.espaco, 'esp1', 'como a física: soma e tela ficam corretas, brilho não estoura') +
      '</div>';
    h += nota('em <b>luz linear</b> somar e tela se comportam como luz de verdade — dois faróis somados dão o dobro de luz, ' +
      'não o dobro de número. matiz, saturação, cor e luminosidade ignoram este botão de propósito: eles são definidos sobre a percepção.');
    h += '<div class="pbtns">' + alterna('ALFA PRÉ-MULTIPLICADO', !!L.desmult, 'desmult',
      'marque quando a fonte chegar com a cor já multiplicada pela transparência — some as auréolas na borda') + '</div>';
    return h;
  };

  /* ================================================================ MATTE */
  C.matte = function (clip) {
    var L = VE.ensureLayer(clip);
    var lista = [];
    var p = VE.project;
    if (p) p.tracks.forEach(function (tr) {
      if (tr.kind === 'audio') return;
      tr.clips.forEach(function (c) {
        if (c.id === clip.id || c.kind === 'audio' || c.kind === 'adjust') return;
        lista.push({ id: c.id, nome: c.name });
      });
    });
    var h = '';
    h += '<div class="prow"><label>MODO</label><select class="field" data-cmatte="modo" style="grid-column:2/4">' +
      VE.MATTE_MODOS.map(function (n, i) {
        return '<option value="' + i + '"' + ((L.matte.modo | 0) === i ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select></div>';
    if (!lista.length) {
      h += nota('não há outra camada para emprestar a silhueta. ponha um segundo clipe na linha do tempo — pode ser uma forma, um texto, um vídeo em preto e branco.');
      return h;
    }
    h += '<div class="prow"><label>SILHUETA DE</label><select class="field" data-cmatte="de" style="grid-column:2/4">' +
      '<option value="">—</option>' +
      lista.map(function (c) {
        return '<option value="' + c.id + '"' + (L.matte.de === c.id ? ' selected' : '') + '>' + esc(c.nome) + '</option>';
      }).join('') + '</select></div>';
    h += nota('a camada escolhida <b>deixa de aparecer</b> e passa a ser um recorte — é assim em qualquer compositor. ' +
      '<b>alfa</b> usa a transparência dela; <b>luma</b> usa o brilho: onde ela é branca, esta camada aparece; onde é preta, some. ' +
      'é o caminho para texto preenchido por vídeo, para vinheta com forma e para revelar uma imagem com uma mancha.');
    return h;
  };

  /* ------------------------------------------------- pontos da CANETA
     A lista não é decoração: é o único lugar onde se vê QUAIS pontos já
     têm keyframe. O trabalho de rotoscopia é justamente esse — animar
     alguns vértices e deixar os outros parados.                      */
  /* ═══════════════════════════════ O CAMINHO COMO UMA COISA SÓ ═══════
     A primeira versão dava um cronômetro a CADA vértice. Funcionava e era
     confuso: ninguém pensa "vou animar o ponto 5", pensa "vou animar o
     recorte". O Premiere resolve isso com uma linha só — CAMINHO DA
     MÁSCARA — e um cronômetro que liga a animação do contorno inteiro.

     Por dentro os keyframes continuam por propriedade (é o que o motor
     sabe interpolar). O que muda é que eles são escritos e apagados em
     BLOCO, e o traçado passa a ter POSES: num instante marcado, todos os
     vértices e todas as alças têm valor gravado. É isso que evita o
     efeito mais desagradável possível — mexer num ponto e ver os outros
     escorregarem sozinhos porque estavam interpolando entre poses.   */

  var PROPS = ['x', 'y', 'hix', 'hiy', 'hox', 'hoy'];
  /* O caminho não é só a lista de vértices: mover, escalar e girar a
     máscara MUDAM A FORMA NA TELA tanto quanto arrastar um ponto.
     Deixá-los de fora foi um erro com sintoma cruel — mexer na escala
     gravava valor estático, valia para o clipe inteiro, e o keyframe
     seguinte saía idêntico ao anterior. Parecia que o botão de gravar
     "só aceitava se a máscara estivesse sempre do mesmo tamanho".   */
  var PROPS_MASK = ['x', 'y', 'w', 'ang'];

  function caminhosDe(clip, mi) {
    var pre = 'masks.' + mi + '.pts.';
    var raiz = 'masks.' + mi + '.';
    return Object.keys(clip.keys || {}).filter(function (k) {
      if (k.indexOf(pre) === 0) return true;
      if (k.indexOf(raiz) !== 0) return false;
      return PROPS_MASK.indexOf(k.slice(raiz.length)) >= 0;
    });
  }
  /* ------------------------------------------------- QUEM ESTÁ ESCOLHIDO
     `canetaSel` é o vértice ATIVO — o que mostra as alças. `canetaSels` é
     a lista dos escolhidos, que pode ter muitos: arrastar um deles move
     todos. Rotoscopar uma garrafa que atravessa o quadro é isso — pegar
     o contorno inteiro e acompanhar, não caçar doze pontos um a um.  */
  C.canetaSels = [];
  C.canetaSelTodos = function (clip, mi) {
    var m = (clip.masks || [])[mi];
    C.canetaSels = (m && m.pts) ? m.pts.map(function (_, i) { return i; }) : [];
    C.canetaSel = C.canetaSels.length === 1 ? C.canetaSels[0] : null;
  };
  C.canetaSelNada = function () { C.canetaSels = []; C.canetaSel = null; };
  C.canetaSelUm = function (j) { C.canetaSels = [j]; C.canetaSel = j; };
  C.canetaSelAlterna = function (j) {
    var i = C.canetaSels.indexOf(j);
    if (i >= 0) C.canetaSels.splice(i, 1); else C.canetaSels.push(j);
    C.canetaSel = C.canetaSels.length === 1 ? C.canetaSels[0] : null;
  };
  C.canetaTemSel = function (j) { return C.canetaSels.indexOf(j) >= 0; };

  C.canetaPROPS = PROPS;
  C.canetaPROPS_MASK = PROPS_MASK;

  C.canetaAnimada = function (clip, mi) { return caminhosDe(clip, mi).length > 0; };

  /* os instantes em que o traçado tem pose gravada */
  C.canetaTempos = function (clip, mi) {
    var t = {};
    caminhosDe(clip, mi).forEach(function (k) {
      (clip.keys[k] || []).forEach(function (p) { t[p.t.toFixed(4)] = p.t; });
    });
    return Object.keys(t).map(function (k) { return t[k]; }).sort(function (a, b) { return a - b; });
  };

  /* Grava a pose inteira neste instante: todo vértice, toda alça. Chamada
     antes de qualquer arrasto quando a animação está ligada — é o que
     torna o keyframe do caminho atômico.                             */
  /* RETO por padrão, e não suavizado — a diferença aparece justo em quem
     rotoscopa. Uma garrafa que atravessa o quadro em velocidade constante,
     com poses suavizadas, faz a máscara FRENAR ao chegar em cada pose e
     ARRANCAR ao sair: entre um keyframe e outro o recorte atrasa e depois
     alcança. Movimento gravado da vida vai em linha reta entre as poses;
     suavização é escolha de animação, não de rastreio.                 */
  C.canetaSuave = false;

  C.canetaPose = function (clip, mi, lt) {
    var m = (clip.masks || [])[mi];
    if (!VE.ehCaneta(m)) return 0;
    VE.maskPtsOk(m);
    var ez = C.canetaSuave ? 'easeInOut' : 'linear';
    var raiz = 'masks.' + mi + '.', pre = raiz + 'pts.';
    PROPS_MASK.forEach(function (k) {
      VE.setKey(clip, raiz + k, lt, VE.valueAt(clip, raiz + k, lt), ez);
    });
    m.pts.forEach(function (p, j) {
      PROPS.forEach(function (k) {
        var path = pre + j + '.' + k;
        VE.setKey(clip, path, lt, VE.valueAt(clip, path, lt), ez);
      });
    });
    return m.pts.length;
  };

  /* troca a curva de TODAS as poses de uma vez */
  C.canetaCurvaEntrePoses = function (clip, mi, suave) {
    C.canetaSuave = !!suave;
    var ez = suave ? 'easeInOut' : 'linear';
    caminhosDe(clip, mi).forEach(function (k) {
      (clip.keys[k] || []).forEach(function (p) { p.ease = ez; });
    });
  };

  C.canetaApagarPose = function (clip, mi, lt) {
    caminhosDe(clip, mi).forEach(function (k) { VE.removeKey(clip, k, lt); });
    /* caminho que ficou sem nenhum keyframe some da lista */
    caminhosDe(clip, mi).forEach(function (k) {
      if (!clip.keys[k] || !clip.keys[k].length) delete clip.keys[k];
    });
  };

  C.canetaDesanimar = function (clip, mi, lt) {
    var m = (clip.masks || [])[mi];
    if (!VE.ehCaneta(m)) return;
    /* congela no que está sendo visto agora, e não no que foi guardado:
       desligar a animação não pode fazer o traçado saltar.          */
    var raiz = 'masks.' + mi + '.', pre = raiz + 'pts.';
    PROPS_MASK.forEach(function (k) { m[k] = VE.valueAt(clip, raiz + k, lt); });
    m.pts.forEach(function (p, j) {
      PROPS.forEach(function (k) { p[k] = VE.valueAt(clip, pre + j + '.' + k, lt); });
    });
    caminhosDe(clip, mi).forEach(function (k) { delete clip.keys[k]; });
  };

  /* Um vértice novo no meio de um traçado JÁ animado tem de existir em
     todas as poses, senão ele nasce sem valor e o contorno pula. Como
     ele não se move, o valor é o mesmo em todas.                    */
  C.canetaCompletarPoses = function (clip, mi, j) {
    var m = (clip.masks || [])[mi];
    if (!VE.ehCaneta(m) || !C.canetaAnimada(clip, mi)) return;
    var p = m.pts[j];
    if (!p) return;
    var pre = 'masks.' + mi + '.pts.' + j + '.';
    C.canetaTempos(clip, mi).forEach(function (t) {
      PROPS.forEach(function (k) { VE.setKey(clip, pre + k, t, p[k] || 0); });
    });
  };

  function pontosDaCaneta(clip, m, mi, pre) {
    VE.maskPtsOk(m);
    var pts = m.pts || [];
    var aberto = !!m.aberta;
    var curvos = pts.filter(VE.ptTemCurva).length;
    var editando = C.canetaEdit && C.canetaEdit.clipId === clip.id && C.canetaEdit.mi === mi;

    var h = '<div class="subhead">TRAÇADO · ' + pts.length + ' PONTO' + (pts.length === 1 ? '' : 'S') +
      (curvos ? ' · ' + curvos + ' EM CURVA' : ' · TUDO RETO') + (aberto ? ' · DESENHANDO' : '') + '</div>';
    h += '<div class="pbtns">' +
      '<button class="cmd cmd-sm' + (editando ? ' active' : '') + ' cmd-solid" data-mcaneta="edit:' + mi + '">' +
      (editando ? 'FECHAR A CANETA' : 'DESENHAR NA PRÉVIA') + '</button>' +
      (aberto && pts.length >= 3
        ? '<button class="cmd cmd-sm" data-mcaneta="fechar:' + mi + '" title="Enter também fecha">FECHAR O TRAÇADO</button>'
        : '') +
      '</div>';
    /* Os dois botões que resolvem "ficou geométrico" de uma vez: SUAVIZAR
       dá alça a todo vértice na tangente do vizinho, RETO tira todas. */
    h += '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-mcaneta="suave:' + mi + '" title="Dá curva a todos os vértices de uma vez">SUAVIZAR TUDO</button>' +
      '<button class="cmd cmd-sm" data-mcaneta="reto:' + mi + '" title="Volta a cantos vivos">RETO</button>' +
      '</div>';

    /* ---------------- MARCAR OBJETO: a I.A. preenche o traçado ------
       Um botão, dois trabalhos, decididos pelo estado: traçado vazio é
       PREENCHER, traçado pronto é SEGUIR — encostar os vértices que já
       existem no contorno deste quadro, sem mudar a quantidade nem
       perder as alças, que é o que mantém os keyframes de pé.       */
    var iaArmado = C.marcarArmado && C.marcarArmado.clipId === clip.id && C.marcarArmado.mi === mi;
    var iaEstado = VE.marcar ? VE.marcar.estado() : 'sem';
    h += '<div class="pbtns">' +
      '<button class="cmd cmd-sm' + (iaArmado ? ' active cmd-solid' : '') + '" data-mcaneta="ia:' + mi + '"' +
      ' title="Clique no objeto na prévia e a I.A. desenha o contorno dele. Roda dentro do navegador: nenhum quadro sai daqui.">' +
      (iaArmado ? 'CLIQUE NO OBJETO…' : (pts.length >= 3 ? 'SEGUIR O OBJETO (I.A.)' : 'MARCAR OBJETO (I.A.)')) +
      '</button></div>';
    if (iaEstado === 'carregando') h += '<div class="pnote">buscando o modelo da I.A. — alguns megabytes, só desta vez</div>';
    else if (iaEstado === 'sem') h += '<div class="pnote">a I.A. não está disponível: ' + (VE.marcar ? VE.marcar.motivo() : '') + ' — o traçado à mão continua igual</div>';
    else if (iaArmado) h += '<div class="pnote">clique em cima da coisa que você quer contornar · Esc desarma</div>';

    /* ---------------- CAMINHO DO TRAÇADO: um cronômetro só ---------- */
    var anim = C.canetaAnimada(clip, mi);
    var tempos = anim ? C.canetaTempos(clip, mi) : [];
    var lt = Math.max(0, Math.min(clip.dur, VE.project.time - clip.start));
    var aqui = tempos.some(function (t) { return Math.abs(t - lt) < 1 / 60; });

    h += '<div class="subhead">CAMINHO DO TRAÇADO</div>';
    h += '<div class="cankey">' +
      '<button class="kf big' + (anim ? ' on' : '') + '" data-mcaneta="anim:' + mi + '" title="' +
      (anim ? 'Desligar a animação — o traçado congela no que está na tela' :
        'Ligar a animação do caminho inteiro. A partir daqui, cada mudança vira keyframe.') +
      '">' + (anim ? '◆' : '◇') + '</button>' +
      '<span class="cank-l">' + (anim
        ? tempos.length + ' keyframe' + (tempos.length === 1 ? '' : 's')
        : 'sem animação') + '</span>' +
      '<button class="cmd cmd-sm" data-mcaneta="kprev:' + mi + '"' + (anim ? '' : ' disabled') + ' title="keyframe anterior">‹</button>' +
      '<button class="cmd cmd-sm' + (aqui ? ' active' : '') + '" data-mcaneta="khere:' + mi + '"' +
      (anim ? '' : ' disabled') + ' title="' + (aqui ? 'Tirar o keyframe deste instante' : 'Gravar o traçado como está, neste instante') + '">' +
      (aqui ? '◆' : '◇') + '</button>' +
      '<button class="cmd cmd-sm" data-mcaneta="knext:' + mi + '"' + (anim ? '' : ' disabled') + ' title="próximo keyframe">›</button>' +
      '</div>';
    if (anim) {
      h += '<div class="pbtns">' +
        '<button class="cmd cmd-sm' + (C.canetaSuave ? '' : ' active') + '" data-mcaneta="reta:' + mi +
        '" title="Movimento constante entre as poses — é o que se quer ao acompanhar algo filmado">ENTRE POSES: RETO</button>' +
        '<button class="cmd cmd-sm' + (C.canetaSuave ? ' active' : '') + '" data-mcaneta="suavepose:' + mi +
        '" title="Acelera e desacelera em cada pose — para movimento inventado, não para rastreio">SUAVE</button>' +
        '</div>';
    }
    h += nota(anim
      ? 'a animação está <b>ligada</b>. Ande com o cursor na linha do tempo e mexa no traçado — ' +
      '<b>cada mudança vira keyframe sozinha</b>, do contorno inteiro. Os losangos aparecem no clipe.'
      : 'ligue o losango acima quando o traçado já estiver no lugar do <b>primeiro quadro</b>. ' +
      'Daí em diante é só andar com o cursor e corrigir o contorno: o keyframe nasce de cada mexida.');

    var nsel = C.canetaSels.length;
    h += '<div class="subhead">VÉRTICES · ' +
      (nsel ? nsel + ' DE ' + pts.length + ' ESCOLHIDO' + (nsel === 1 ? '' : 'S') : 'NENHUM ESCOLHIDO') +
      '</div>';
    h += '<div class="pbtns">' +
      '<button class="cmd cmd-sm' + (nsel === pts.length && pts.length ? ' active' : '') +
      '" data-mcaneta="seltodos:' + mi + '" title="Escolhe todos: aí arrastar um leva o traçado inteiro">SELECIONAR TUDO</button>' +
      '<button class="cmd cmd-sm" data-mcaneta="selnada:' + mi + '">NENHUM</button>' +
      '</div>';
    h += nota('para acompanhar algo que anda no vídeo: <b>arraste por dentro do traçado</b> e ele vai inteiro. ' +
      'Ou <b>SELECIONAR TUDO</b> e arraste qualquer vértice. Na prévia, <b>arrastar por fora laça</b> ' +
      'os vértices, e <b>shift+clique</b> acrescenta um.');
    h += '<div class="ptlist">';
    pts.forEach(function (p, j) {
      var temC = VE.ptTemCurva(p);
      h += '<div class="ptrow' + (C.canetaSel === j ? ' sel' : '') + '" data-pj="' + j + '">' +
        '<b>' + (j + 1) + '</b>' +
        '<span>' + p.x.toFixed(3) + ' , ' + p.y.toFixed(3) + '</span>' +
        '<button class="ptc' + (temC ? ' on' : '') + '" data-mcaneta="curva:' + mi + ':' + j +
        '" title="' + (temC ? 'virar canto vivo' : 'curvar este vértice') + '">' + (temC ? '◠' : '∟') + '</button>' +
        '<button class="cmd cmd-sm cmd-danger" data-mcaneta="del:' + mi + ':' + j + '" title="remover vértice">✕</button>' +
        '</div>';
    });
    h += '</div>';
    if (aberto) {
      h += nota('<b>desenhando</b>: clique na prévia para pôr vértices · <b>arraste ao clicar</b> e o trecho já nasce ' +
        'curvo · clique no ponto verde (ou <b>Enter</b>) para fechar · <b>Esc</b> tira o último.');
    } else {
      h += nota('na prévia: <b>arraste</b> um ponto · <b>clique num trecho</b> para pôr vértice ali · ' +
        '<b>alt+clique</b> num ponto para tirá-lo. Clique num ponto para ver as <b>alças azuis</b> — ' +
        'arrastá-las curva o traçado, e <b>alt</b> ao arrastar quebra a simetria, fazendo canto vivo no meio da curva.');
    }
    return h;
  }

  /* ============================================================= MÁSCARAS */
  C.mascaras = function (clip) {
    VE.ensureLayer(clip);
    var ms = clip.masks;
    var h = '';
    if (!ms.length) {
      h += nota('nenhuma máscara. a camada aparece inteira.');
    } else {
      h += '<div class="masklist">';
      ms.forEach(function (m, i) {
        h += '<div class="maskrow' + (i === maskAberta ? ' open' : '') + '" data-mi="' + i + '">' +
          '<button class="mtog' + (m.on ? ' on' : '') + '" data-mact="on" title="ligar/desligar">' + (m.on ? '●' : '○') + '</button>' +
          '<button class="mname" data-mact="open">' + (i + 1) + ' · ' + VE.MASK_SHAPES[m.shape | 0] + '</button>' +
          '<span class="mmode">' + VE.MASK_MODOS[m.modo | 0] + '</span>' +
          '<button class="cmd cmd-sm" data-mact="up" title="subir">↑</button>' +
          '<button class="cmd cmd-sm cmd-danger" data-mact="del" title="remover">✕</button></div>';
        if (i === maskAberta) {
          var pre = 'masks.' + i + '.';
          h += '<div class="maskbody">';
          h += '<div class="prow"><label>FORMA</label><select class="field" data-mset="' + i + ':shape" style="grid-column:2/4">' +
            VE.MASK_SHAPES.map(function (n, k) {
              return '<option value="' + k + '"' + ((m.shape | 0) === k ? ' selected' : '') + '>' + n + '</option>';
            }).join('') + '</select></div>';
          h += '<div class="prow"><label>COMBINAR</label><select class="field" data-mset="' + i + ':modo" style="grid-column:2/4">' +
            VE.MASK_MODOS.map(function (n, k) {
              return '<option value="' + k + '"' + ((m.modo | 0) === k ? ' selected' : '') + '>' + n + '</option>';
            }).join('') + '</select></div>';
          var caneta = VE.ehCaneta(m);
          h += linha(clip, pre + 'x', caneta ? 'MOVER X' : 'CENTRO X', -0.2, 1.2, 0.001, 3);
          h += linha(clip, pre + 'y', caneta ? 'MOVER Y' : 'CENTRO Y', -0.2, 1.2, 0.001, 3);
          h += linha(clip, pre + 'w', caneta ? 'ESCALA' : 'LARGURA', 0.01, 2, 0.001, 3);
          if (!caneta) h += linha(clip, pre + 'h', 'ALTURA', 0.01, 2, 0.001, 3);
          h += linha(clip, pre + 'ang', 'ROTAÇÃO', -180, 180, 1, 0);
          h += linha(clip, pre + 'feather', 'SUAVIDADE', 0, 1, 0.001, 3);
          h += linha(clip, pre + 'expandir', 'EXPANDIR', -0.5, 0.5, 0.001, 3);
          h += linha(clip, pre + 'opacidade', 'OPACIDADE', 0, 1, 0.001, 3);
          if ((m.shape | 0) === 2) {
            h += linha(clip, pre + 'lados', 'LADOS', 3, 12, 1, 0);
            h += linha(clip, pre + 'canto', 'ARREDONDAR', 0, 1, 0.001, 3);
          }
          if (caneta) h += pontosDaCaneta(clip, m, i, pre);
          h += '<div class="pbtns">' + alterna('INVERTER', !!m.invert, 'minv:' + i) + '</div>';
          h += '</div>';
        }
      });
      h += '</div>';
      h += nota('<b>somar</b> junta com as de cima · <b>subtrair</b> abre um buraco · <b>intersectar</b> deixa só o que as duas têm em comum · ' +
        '<b>expandir</b> engorda ou corrói a forma sem redesenhá-la. tudo é animável: clique no losango.');
    }
    return h;
  };

  /* ============================================================== COR ==== */
  C.cor = function (clip) {
    var L = VE.ensureLayer(clip);
    var h = '<div class="pbtns">' + alterna(L.cor.on ? 'LIGADA' : 'DESLIGADA', !!L.cor.on, 'coron') +
      '<button class="cmd cmd-sm" data-cact="corzero">ZERAR</button></div>';
    if (!L.cor.on) return h + nota('a correção de cor desta camada está desligada — nenhum controle abaixo é calculado.');
    h += '<div class="subhead">LUZ</div>';
    h += linha(clip, 'layer.cor.expo', 'EXPOSIÇÃO (paradas)', -4, 4, 0.01, 2);
    h += linha(clip, 'layer.cor.contraste', 'CONTRASTE', -1, 1, 0.001, 3);
    h += linha(clip, 'layer.cor.gama', 'GAMA', 0.1, 4, 0.01, 2);
    h += '<div class="subhead">NÍVEIS</div>';
    h += linha(clip, 'layer.cor.entLo', 'ENTRADA · PRETO', 0, 0.99, 0.001, 3);
    h += linha(clip, 'layer.cor.entHi', 'ENTRADA · BRANCO', 0.01, 1, 0.001, 3);
    h += linha(clip, 'layer.cor.saiLo', 'SAÍDA · PRETO', 0, 0.99, 0.001, 3);
    h += linha(clip, 'layer.cor.saiHi', 'SAÍDA · BRANCO', 0.01, 1, 0.001, 3);
    h += '<div class="subhead">COR</div>';
    h += linha(clip, 'layer.cor.matiz', 'MATIZ (giro)', -0.5, 0.5, 0.001, 3);
    h += linha(clip, 'layer.cor.sat', 'SATURAÇÃO', -1, 2, 0.001, 3);
    h += linha(clip, 'layer.cor.vibr', 'VIBRAÇÃO', -1, 2, 0.001, 3);
    h += linha(clip, 'layer.cor.temp', 'TEMPERATURA', -1, 1, 0.001, 3);
    h += linha(clip, 'layer.cor.tinte', 'TINTE', -1, 1, 0.001, 3);
    h += '<div class="subhead">ZONAS DE TOM</div>';
    h += linha(clip, 'layer.cor.altas', 'ALTAS LUZES', -1, 1, 0.001, 3);
    h += linha(clip, 'layer.cor.baixas', 'SOMBRAS', -1, 1, 0.001, 3);
    h += linha(clip, 'layer.cor.brancos', 'BRANCOS', -1, 1, 0.001, 3);
    h += linha(clip, 'layer.cor.pretos', 'PRETOS', -1, 1, 0.001, 3);
    h += nota('<b>vibração</b> puxa só as cores fracas: é o controle que aumenta cor sem transformar pele em cenoura. ' +
      '<b>exposição</b> é a única que trabalha em luz linear, porque é a única que corresponde a abrir o diafragma.');
    return h;
  };

  /* ============================================================= CANAIS == */
  C.canais = function (clip) {
    var L = VE.ensureLayer(clip);
    var k = L.canais;
    var h = '<div class="pbtns">' + alterna(k.on ? 'LIGADO' : 'DESLIGADO', !!k.on, 'canon') +
      '<button class="cmd cmd-sm" data-cact="canzero">ZERAR</button></div>';
    if (!k.on) return h + nota('o misturador de canais está desligado.');
    h += '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-cpre="rgb">R↔B</button>' +
      '<button class="cmd cmd-sm" data-cpre="grb">R↔G</button>' +
      '<button class="cmd cmd-sm" data-cpre="mono">CINZA</button>' +
      '<button class="cmd cmd-sm" data-cpre="sepia">SÉPIA</button>' +
      '<button class="cmd cmd-sm" data-cpre="neg">NEGATIVO</button></div>';
    [['r', 'VERMELHO'], ['g', 'VERDE'], ['b', 'AZUL']].forEach(function (o) {
      h += '<div class="subhead">SAÍDA ' + o[1] + '</div>';
      h += linha(clip, 'layer.canais.' + o[0] + 'r', 'de VERMELHO', -2, 2, 0.001, 3);
      h += linha(clip, 'layer.canais.' + o[0] + 'g', 'de VERDE', -2, 2, 0.001, 3);
      h += linha(clip, 'layer.canais.' + o[0] + 'b', 'de AZUL', -2, 2, 0.001, 3);
      h += linha(clip, 'layer.canais.' + o[0] + 'o', 'somar', -1, 1, 0.001, 3);
    });
    h += '<div class="subhead">INVERTER</div>';
    h += '<div class="pbtns">' +
      alterna('R', k.invR > 0.5, 'invR') + alterna('G', k.invG > 0.5, 'invG') + alterna('B', k.invB > 0.5, 'invB') +
      '</div>';
    h += '<div class="subhead">DESLOCAMENTO CROMÁTICO</div>';
    h += linha(clip, 'layer.canais.desl', 'DISTÂNCIA', -1, 1, 0.001, 3);
    h += linha(clip, 'layer.canais.deslAng', 'ÂNGULO', -180, 180, 1, 0);
    h += nota('cada saída é uma <b>soma</b> das três entradas. a identidade é 1 no próprio canal e 0 nos outros — ' +
      'qualquer outra combinação é uma cor que a câmera não viu. o deslocamento afasta vermelho e azul em direções opostas: ' +
      'é a aberração cromática, o RGB split, a franja de lente barata.');
    return h;
  };

  /* ==================================================== FAIXA DE MESCLA == */
  C.faixa = function (clip) {
    var L = VE.ensureLayer(clip);
    var b = L.blendIf;
    var h = '<div class="pbtns">' + alterna(b.on ? 'LIGADA' : 'DESLIGADA', !!b.on, 'ifon') +
      '<button class="cmd cmd-sm" data-cact="ifzero">ZERAR</button></div>';
    if (!b.on) {
      return h + nota('a camada aparece inteira. ligando, você escolhe <b>em que tons</b> ela tem direito de aparecer.');
    }
    h += '<div class="prow"><label>OLHAR O CANAL</label><select class="field" data-cif="ch" style="grid-column:2/4">' +
      VE.BLENDIF_CANAIS.map(function (n, i) {
        return '<option value="' + i + '"' + ((b.ch | 0) === i ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select></div>';
    h += '<div class="subhead">ESTA CAMADA</div>';
    h += C.barraFaixa(clip, 'esta');
    h += linha(clip, 'layer.blendIf.estaLo0', 'some abaixo de', 0, 1, 0.001, 3);
    h += linha(clip, 'layer.blendIf.estaLo1', 'volta inteira em', 0, 1, 0.001, 3);
    h += linha(clip, 'layer.blendIf.estaHi0', 'começa a sumir em', 0, 1, 0.001, 3);
    h += linha(clip, 'layer.blendIf.estaHi1', 'sumiu de vez em', 0, 1, 0.001, 3);
    h += '<div class="subhead">CAMADA DE BAIXO</div>';
    h += C.barraFaixa(clip, 'fundo');
    h += linha(clip, 'layer.blendIf.fundoLo0', 'some abaixo de', 0, 1, 0.001, 3);
    h += linha(clip, 'layer.blendIf.fundoLo1', 'volta inteira em', 0, 1, 0.001, 3);
    h += linha(clip, 'layer.blendIf.fundoHi0', 'começa a sumir em', 0, 1, 0.001, 3);
    h += linha(clip, 'layer.blendIf.fundoHi1', 'sumiu de vez em', 0, 1, 0.001, 3);
    h += '<div class="pbtns">' +
      '<button class="cmd cmd-sm" data-cifp="tirapreto">TIRAR O PRETO</button>' +
      '<button class="cmd cmd-sm" data-cifp="tirabranco">TIRAR O BRANCO</button>' +
      '<button class="cmd cmd-sm" data-cifp="sofundoescuro">SÓ NO ESCURO DE BAIXO</button></div>';
    h += nota('cada barra mostra onde a camada existe. juntando os dois pontos de um lado o corte fica <b>seco</b> e serrilha; ' +
      'afastando-os a passagem fica <b>macia</b> e integra. é assim que se apaga um céu branco, se casa uma textura com a pele ' +
      'e se faz dupla exposição sem recortar nada.');
    return h;
  };

  /* desenho da barra: onde a camada aparece, ao longo dos tons */
  C.barraFaixa = function (clip, lado) {
    var L = clip.layer, b = L.blendIf;
    var p = [b[lado + 'Lo0'], b[lado + 'Lo1'], b[lado + 'Hi0'], b[lado + 'Hi1']];
    var pts = [];
    for (var i = 0; i <= 60; i++) {
      var x = i / 60;
      var abaixo = (p[1] <= 0.0005) ? 0 : (p[1] <= p[0] ? (x < p[0] ? 1 : 0) : 1 - Math.max(0, Math.min(1, (x - p[0]) / (p[1] - p[0]))));
      var acima = (p[2] >= 0.9995) ? 0 : (p[3] <= p[2] ? (x >= p[2] ? 1 : 0) : Math.max(0, Math.min(1, (x - p[2]) / (p[3] - p[2]))));
      var f = (1 - abaixo) * (1 - acima);
      pts.push((x * 100).toFixed(1) + ',' + ((1 - f) * 22).toFixed(1));
    }
    return '<div class="prow-slider"><svg class="ifbar" viewBox="0 0 100 22" preserveAspectRatio="none">' +
      '<defs><linearGradient id="ifg' + lado + '" x1="0" x2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>' +
      '<rect x="0" y="0" width="100" height="22" fill="url(#ifg' + lado + ')"/>' +
      '<polyline points="' + pts.join(' ') + '" class="ifline"/></svg></div>';
  };

  /* ============================================================== LIGAR ===
     Um só ouvinte por tipo. `motion.js` já liga os campos animáveis
     (`data-mrange` / `data-mnum` / `data-anim`), então aqui só entram os
     controles que NÃO são propriedades animáveis.                       */
  C.bind = function (box, clip, commit) {
    var L = VE.ensureLayer(clip);

    box.querySelectorAll('[data-bm]').forEach(function (b) {
      b.addEventListener('click', function () {
        clip.blend = +b.dataset.bm;
        commit(); VE.panels.renderProps();
      });
    });

    box.querySelectorAll('[data-cact]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.cact;
        if (a === 'bmopen') C.gradeAberta = !C.gradeAberta;
        else if (a === 'esp0') L.espaco = 0;
        else if (a === 'esp1') L.espaco = 1;
        else if (a === 'desmult') L.desmult = L.desmult ? 0 : 1;
        else if (a === 'coron') L.cor.on = L.cor.on ? 0 : 1;
        else if (a === 'canon') L.canais.on = L.canais.on ? 0 : 1;
        else if (a === 'ifon') L.blendIf.on = L.blendIf.on ? 0 : 1;
        else if (a === 'corzero') { var on = L.cor.on; L.cor = VE.newColorGrade(); L.cor.on = on; limpaKeys(clip, 'layer.cor.'); }
        else if (a === 'canzero') { var o2 = L.canais.on; L.canais = VE.newChannels(); L.canais.on = o2; limpaKeys(clip, 'layer.canais.'); }
        else if (a === 'ifzero') { var o3 = L.blendIf.on; L.blendIf = VE.newBlendIf(); L.blendIf.on = o3; limpaKeys(clip, 'layer.blendIf.'); }
        else if (a === 'invR') L.canais.invR = L.canais.invR > 0.5 ? 0 : 1;
        else if (a === 'invG') L.canais.invG = L.canais.invG > 0.5 ? 0 : 1;
        else if (a === 'invB') L.canais.invB = L.canais.invB > 0.5 ? 0 : 1;
        else if (a.indexOf('minv:') === 0) {
          var m = clip.masks[+a.slice(5)];
          if (m) m.invert = m.invert ? 0 : 1;
        }
        commit(); VE.panels.renderProps();
      });
    });

    /* ---- matte ---- */
    box.querySelectorAll('[data-cmatte]').forEach(function (el) {
      el.addEventListener('change', function () {
        var k = el.dataset.cmatte;
        if (k === 'modo') L.matte.modo = +el.value | 0;
        else L.matte.de = el.value;
        commit(); VE.panels.renderProps();
      });
    });

    /* ---- faixa de mescla ---- */
    box.querySelectorAll('[data-cif]').forEach(function (el) {
      el.addEventListener('change', function () { L.blendIf.ch = +el.value | 0; commit(); VE.panels.renderProps(); });
    });
    box.querySelectorAll('[data-cifp]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.cifp, q = L.blendIf;
        if (a === 'tirapreto') { q.estaLo0 = 0.02; q.estaLo1 = 0.20; }
        else if (a === 'tirabranco') { q.estaHi0 = 0.80; q.estaHi1 = 0.98; }
        else { q.fundoHi0 = 0.35; q.fundoHi1 = 0.75; }
        commit(); VE.panels.renderProps();
      });
    });

    /* ---- misturador: atalhos ---- */
    box.querySelectorAll('[data-cpre]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = L.canais, a = b.dataset.cpre;
        var base = VE.newChannels(); base.on = 1;
        base.desl = k.desl; base.deslAng = k.deslAng;
        if (a === 'rgb') { base.rr = 0; base.rb = 1; base.br = 1; base.bb = 0; }
        else if (a === 'grb') { base.rr = 0; base.rg = 1; base.gr = 1; base.gg = 0; }
        else if (a === 'mono') {
          base.rr = base.gr = base.br = 0.30;
          base.rg = base.gg = base.bg = 0.59;
          base.rb = base.gb = base.bb = 0.11;
        } else if (a === 'sepia') {
          base.rr = 0.393; base.rg = 0.769; base.rb = 0.189;
          base.gr = 0.349; base.gg = 0.686; base.gb = 0.168;
          base.br = 0.272; base.bg = 0.534; base.bb = 0.131;
        } else if (a === 'neg') { base.invR = base.invG = base.invB = 1; }
        L.canais = base;
        limpaKeys(clip, 'layer.canais.');
        commit(); VE.panels.renderProps();
      });
    });

    /* ---- máscaras ---- */
    box.querySelectorAll('[data-mact]').forEach(function (b) {
      b.addEventListener('click', function () {
        var row = b.closest('.maskrow');
        var i = +row.dataset.mi, a = b.dataset.mact;
        var m = clip.masks[i];
        if (!m) return;
        if (a === 'on') m.on = m.on ? 0 : 1;
        else if (a === 'open') maskAberta = (maskAberta === i) ? -1 : i;
        else if (a === 'up' && i > 0) {
          clip.masks.splice(i - 1, 0, clip.masks.splice(i, 1)[0]);
          trocaKeys(clip, i, i - 1);
          maskAberta = i - 1;
        } else if (a === 'del') {
          clip.masks.splice(i, 1);
          limpaKeys(clip, 'masks.' + i + '.');
          reindexaKeys(clip);
          maskAberta = 0;
        }
        commit(); VE.panels.renderProps();
      });
    });
    box.querySelectorAll('[data-mset]').forEach(function (el) {
      el.addEventListener('change', function () {
        var b = el.dataset.mset.split(':');
        var m = clip.masks[+b[0]];
        if (m) m[b[1]] = +el.value | 0;
        commit(); VE.panels.renderProps();
      });
    });
    box.querySelectorAll('[data-maddm]').forEach(function (b) {
      b.addEventListener('click', function () {
        var forma = +b.dataset.maddm;
        clip.masks.push(VE.newLayerMask(forma));
        maskAberta = clip.masks.length - 1;
        if (forma === VE.MASK_CANETA) {
          C.canetaEdit = { clipId: clip.id, mi: maskAberta };
          C.canetaSelNada();
          VE.app.toast('clique na prévia para pôr os pontos · ARRASTE ao clicar e o trecho já sai curvo · ' +
            'clique no ponto verde ou Enter para fechar', 'ok');
        }
        commit(); VE.panels.renderProps();
      });
    });

    /* ---------------- botões do traçado da caneta ---------------- */
    box.querySelectorAll('[data-mcaneta]').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        var a = b.dataset.mcaneta.split(':');
        var mi = +a[1], m = clip.masks[mi];
        if (!VE.ehCaneta(m)) return;
        var pre = 'masks.' + mi + '.pts.';
        var lt = Math.max(0, Math.min(clip.dur, VE.project.time - clip.start));

        if (a[0] === 'edit') {
          var ligado = C.canetaEdit && C.canetaEdit.clipId === clip.id && C.canetaEdit.mi === mi;
          C.canetaEdit = ligado ? null : { clipId: clip.id, mi: mi };
          VE.panels.renderMaskOverlay();
          VE.app.toast(ligado ? 'caneta fechada' : 'caneta aberta — arraste os pontos na prévia', 'ok');
          VE.panels.renderProps();
          return;
        }
        if (a[0] === 'reta' || a[0] === 'suavepose') {
          C.canetaCurvaEntrePoses(clip, mi, a[0] === 'suavepose');
          commit(); VE.panels.renderProps();
          VE.app.toast(a[0] === 'reta'
            ? 'movimento reto entre as poses — o recorte acompanha em velocidade constante'
            : 'movimento suave entre as poses — acelera e desacelera em cada uma', 'ok');
          return;
        }
        if (a[0] === 'ia') {
          if (!VE.marcar) { VE.app.toast('a I.A. não está neste build', 'err'); return; }
          if (C.marcarArmado && C.marcarArmado.mi === mi) {
            C.marcarArmado = null;
            VE.panels.renderProps(); VE.panels.renderMaskOverlay();
            return;
          }
          C.marcarArmado = { clipId: clip.id, mi: mi };
          C.canetaEdit = { clipId: clip.id, mi: mi };   /* precisa da prévia ligada */
          VE.panels.renderProps(); VE.panels.renderMaskOverlay();
          VE.marcar.carregar().then(function (ok) {
            VE.panels.renderProps();
            VE.app.toast(ok
              ? 'clique em cima do objeto na prévia'
              : 'a I.A. não carregou: ' + VE.marcar.motivo(), ok ? 'ok' : 'err');
          });
          return;
        }
        if (a[0] === 'seltodos') { C.canetaSelTodos(clip, mi); VE.panels.renderProps(); VE.panels.renderMaskOverlay(); return; }
        if (a[0] === 'selnada') { C.canetaSelNada(); VE.panels.renderProps(); VE.panels.renderMaskOverlay(); return; }
        if (a[0] === 'fechar') {
          if ((m.pts || []).length < 3) { VE.app.toast('preciso de pelo menos três pontos', 'err'); return; }
          m.aberta = 0; commit(); VE.panels.renderProps(); VE.panels.renderMaskOverlay();
          return;
        }
        if (a[0] === 'suave' || a[0] === 'reto') {
          var ok = (a[0] === 'suave') ? VE.maskSuavizar(m) : VE.maskRetificar(m);
          if (!ok) { VE.app.toast('preciso de pelo menos três pontos', 'err'); return; }
          commit(); VE.panels.renderProps(); VE.panels.renderMaskOverlay();
          VE.app.toast(a[0] === 'suave' ? 'traçado curvado' : 'traçado com cantos vivos', 'ok');
          return;
        }
        if (a[0] === 'curva') {
          var jc = +a[2], pc = (m.pts || [])[jc];
          if (!pc) return;
          if (VE.ptTemCurva(pc)) { pc.hix = pc.hiy = pc.hox = pc.hoy = 0; pc.canto = 1; }
          else {
            /* curva um vértice só, na tangente dos vizinhos */
            var np = m.pts.length;
            var aa = m.pts[(jc - 1 + np) % np], bb = m.pts[(jc + 1) % np];
            var tx = (bb.x - aa.x) / 6, ty = (bb.y - aa.y) / 6;
            pc.hox = tx; pc.hoy = ty; pc.hix = -tx; pc.hiy = -ty; pc.canto = 0;
          }
          C.canetaSel = jc;
          commit(); VE.panels.renderProps(); VE.panels.renderMaskOverlay();
          return;
        }
        /* ---- o cronômetro do CAMINHO INTEIRO ---- */
        if (a[0] === 'anim') {
          if (C.canetaAnimada(clip, mi)) {
            C.canetaDesanimar(clip, mi, lt);
            commit(); VE.panels.renderProps(); VE.panels.renderMaskOverlay();
            VE.app.toast('animação desligada — o traçado congelou como está agora');
          } else {
            var n = C.canetaPose(clip, mi, lt);
            commit(); VE.panels.renderProps(); VE.panels.renderMaskOverlay();
            VE.app.toast('animação ligada em ' + VE.tl.tc(VE.project.time) + ' · ' + n +
              ' vértices gravados. Agora ande com o cursor e corrija o traçado — o keyframe nasce sozinho.', 'ok');
          }
          return;
        }
        if (a[0] === 'khere') {
          var ts = C.canetaTempos(clip, mi);
          var jaTem = ts.some(function (t) { return Math.abs(t - lt) < 1 / 60; });
          if (jaTem) {
            if (ts.length <= 1) { VE.app.toast('este é o único keyframe — desligue o losango para tirar a animação', 'err'); return; }
            C.canetaApagarPose(clip, mi, lt);
            VE.app.toast('keyframe removido de ' + VE.tl.tc(VE.project.time));
          } else {
            C.canetaPose(clip, mi, lt);
            VE.app.toast('traçado gravado em ' + VE.tl.tc(VE.project.time), 'ok');
          }
          commit(); VE.panels.renderProps();
          return;
        }
        if (a[0] === 'kprev' || a[0] === 'knext') {
          var ts2 = C.canetaTempos(clip, mi);
          if (!ts2.length) return;
          var alvo = null;
          if (a[0] === 'kprev') {
            for (var i2 = ts2.length - 1; i2 >= 0; i2--) if (ts2[i2] < lt - 1 / 60) { alvo = ts2[i2]; break; }
          } else {
            for (var i3 = 0; i3 < ts2.length; i3++) if (ts2[i3] > lt + 1 / 60) { alvo = ts2[i3]; break; }
          }
          if (alvo === null) { VE.app.toast(a[0] === 'kprev' ? 'não há keyframe antes' : 'não há keyframe depois'); return; }
          VE.app.seek(clip.start + alvo);
          VE.panels.renderProps();
          return;
        }
        if (a[0] === 'del') {
          if (!VE.maskPtDel(clip, mi, +a[2])) {
            VE.app.toast('um traçado precisa de pelo menos três pontos', 'err');
            return;
          }
          commit(); VE.panels.renderProps(); VE.panels.renderMaskOverlay();
        }
      });
    });
  };

  function limpaKeys(clip, pre) {
    Object.keys(clip.keys || {}).forEach(function (k) { if (k.indexOf(pre) === 0) delete clip.keys[k]; });
  }
  /* `.slice(2).join('.')` e não `[2]`: um caminho de caneta é
     `masks.0.pts.3.x`, e ficar só com o pedaço 2 jogava fora o vértice.
     A animação passava a apontar para uma propriedade que não existe. */
  function trocaKeys(clip, a, b) {
    var mapa = {};
    Object.keys(clip.keys || {}).forEach(function (k) {
      var resto = k.split('.').slice(2).join('.');
      if (k.indexOf('masks.' + a + '.') === 0) mapa[k] = 'masks.' + b + '.' + resto;
      else if (k.indexOf('masks.' + b + '.') === 0) mapa[k] = 'masks.' + a + '.' + resto;
    });
    var tmp = {};
    Object.keys(mapa).forEach(function (k) { tmp[mapa[k]] = clip.keys[k]; delete clip.keys[k]; });
    Object.keys(tmp).forEach(function (k) { clip.keys[k] = tmp[k]; });
  }
  /* depois de remover uma máscara, os índices dos keyframes acima dela
     escorregam um para baixo — senão a animação passa a mexer na errada. */
  function reindexaKeys(clip) {
    var n = clip.masks.length, novo = {};
    Object.keys(clip.keys || {}).forEach(function (k) {
      if (k.indexOf('masks.') !== 0) { novo[k] = clip.keys[k]; return; }
      var b = k.split('.'), i = +b[1], resto = b.slice(2).join('.');
      if (i >= n) { novo['masks.' + Math.max(0, i - 1) + '.' + resto] = clip.keys[k]; return; }
      novo[k] = clip.keys[k];
    });
    clip.keys = novo;
  }

  C.gradeAberta = false;
  C.maskAberta = function (v) { if (v !== undefined) maskAberta = v; return maskAberta; };

})(window.VE);
