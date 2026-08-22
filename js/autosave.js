/* ============================================================
   rgb_lab — SESSÃO GUARDADA (o F5 sem querer)
   ------------------------------------------------------------
   Por que NÃO é localStorage:

   O localStorage guarda texto e tem uns 5 MB. O projeto em JSON até
   caberia; os VÍDEOS não. E sem os vídeos o projeto volta vazio, porque
   `VE.deserialize` já joga fora todo clipe cuja fonte sumiu — que é
   exatamente o que aconteceria depois de um F5.

   O IndexedDB guarda Blob de verdade, sem limite de megabyte por item e
   sem transformar em texto. Então é ele que guarda as DUAS metades:

       estado  →  o projeto inteiro em JSON (o mesmo de VE.serialize)
       midia   →  um registro por fonte, com o arquivo original dentro

   Na volta, as fontes entram PRIMEIRO, com o mesmo id de antes, e só
   depois o projeto é lido — senão os clipes seriam descartados.

   O que NÃO volta, e por quê:
     · webcam — é um dispositivo ao vivo, não um arquivo;
     · camadas do laboratório de tipografia — desenham num canvas vivo
       do próprio laboratório. Elas voltam como IMAGEM (o último quadro,
       com alpha), o que preserva o corte e o lugar na linha do tempo,
       mas congela a animação de escrita. O aviso da barra diz isso.

   Nada é restaurado sozinho: a barra pergunta. Um projeto aberto na mão
   nunca é atropelado por uma sessão velha.
   ============================================================ */
(function (VE) {
  'use strict';

  var A = VE.auto = {};

  var BANCO = 'rgb_lab', VERSAO = 1;
  var ESTADO = 'estado', MIDIA = 'midia';
  var db = null, abrindo = null;
  var timer = null, ATRASO = 1200;   /* junta rajadas de edição numa gravação só */
  var ligado = true;

  /* ================================================== BANCO ============== */

  function abrir() {
    if (db) return Promise.resolve(db);
    if (abrindo) return abrindo;
    abrindo = new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error('sem IndexedDB')); return; }
      var req = indexedDB.open(BANCO, VERSAO);
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains(ESTADO)) d.createObjectStore(ESTADO);
        if (!d.objectStoreNames.contains(MIDIA)) d.createObjectStore(MIDIA);
      };
      req.onsuccess = function () { db = req.result; res(db); };
      req.onerror = function () { rej(req.error || new Error('não abri o banco')); };
    });
    return abrindo;
  }

  function tx(loja, modo) {
    return abrir().then(function (d) { return d.transaction(loja, modo).objectStore(loja); });
  }

  function por(req) {
    return new Promise(function (res, rej) {
      req.onsuccess = function () { res(req.result); };
      req.onerror = function () { rej(req.error); };
    });
  }

  /* ============================================ O QUE VAI PARA O BANCO ====
     Uma fonte só é gravável se tiver o arquivo original guardado nela
     (`s.blob`, posto por media.js na hora de carregar). Tipografia vira
     um PNG com alpha; webcam não vai.                                    */
  function paraGravar(s) {
    if (!s) return null;
    if (s.kind === 'webcam') return null;
    /* legenda não é arquivo: o texto e o estilo vivem no próprio projeto,
       e a fonte é só o pincel. Congelá-la em PNG traria UMA frase para
       todas. Ela é remontada na volta, com o mesmo id.                */
    if (s.kind === 'legenda') return null;
    if (s.blob) {
      return {
        kind: s.kind, name: s.name, w: s.w, h: s.h, duration: s.duration || 0,
        blob: s.blob, tipo: s.blob.type || ''
      };
    }
    if (s.kind === 'type' || s.kind === 'image') {
      /* canvas: congela o quadro atual num PNG com alpha */
      var el = s.el;
      if (el && el.toBlob) return { kind: s.kind, name: s.name, w: s.w, h: s.h, duration: 0, canvas: el };
    }
    return null;
  }

  function blobDoCanvas(cv) {
    return new Promise(function (res) {
      try { cv.toBlob(function (b) { res(b); }, 'image/png'); }
      catch (e) { res(null); }
    });
  }

  /* ================================================== GRAVAR ============= */

  var gravando = false;

  A.guardar = function () {
    if (!ligado || !VE.project || gravando) return Promise.resolve(false);
    gravando = true;
    var json;
    try { json = VE.serialize(); } catch (e) { gravando = false; return Promise.resolve(false); }

    /* quais fontes o projeto ainda usa — não guardamos lixo */
    var usadas = {};
    VE.project.tracks.forEach(function (t) {
      t.clips.forEach(function (c) { if (c.src) usadas[c.src] = 1; });
    });

    var pendentes = Object.keys(usadas).map(function (id) {
      var reg = paraGravar(VE.sources[id]);
      if (!reg) return null;
      if (reg.canvas) {
        return blobDoCanvas(reg.canvas).then(function (b) {
          if (!b) return null;
          delete reg.canvas; reg.blob = b; reg.tipo = 'image/png'; reg.deTipografia = 1;
          return { id: id, reg: reg };
        });
      }
      return Promise.resolve({ id: id, reg: reg });
    }).filter(Boolean);

    return Promise.all(pendentes).then(function (lista) {
      lista = lista.filter(Boolean);
      return abrir().then(function (d) {
        return new Promise(function (res, rej) {
          var t = d.transaction([ESTADO, MIDIA], 'readwrite');
          var e = t.objectStore(ESTADO), m = t.objectStore(MIDIA);
          e.put({
            json: json, quando: Date.now(), nome: VE.project.name || 'sem nome',
            fontes: lista.map(function (o) { return o.id; }),
            marca: VE.BRAND ? VE.BRAND.slug : 'rgb_lab'
          }, 'projeto');
          /* limpa mídia que saiu do projeto e regrava a que ficou */
          m.clear();
          lista.forEach(function (o) { m.put(o.reg, o.id); });
          t.oncomplete = function () { res(true); };
          t.onerror = function () { rej(t.error); };
        });
      });
    }).then(function (r) {
      gravando = false; A.ultimo = Date.now(); A.erro = null; mostrarSelo(); return r;
    }, function (e) {
      gravando = false;
      /* Falhar CALADO é o pior desfecho possível: o selo diz "guardado",
         a pessoa confia, dá F5 e perde o dia. Quando o disco não aceita,
         guardamos só o projeto (que é pequeno) e dizemos o que houve. */
      var cota = e && (e.name === 'QuotaExceededError' || /quota|space/i.test(e.name + ' ' + e.message));
      A.erro = cota ? 'sem espaço' : (e && e.message || 'falhou');
      mostrarSelo();
      if (cota) return soProjeto(json);
      return false;
    });
  };

  /* plano B: o projeto sem os arquivos. Vale a pena — cortes, efeitos e
     legendas voltam; só as mídias é que precisam ser recarregadas.   */
  function soProjeto(json) {
    return abrir().then(function (d) {
      return new Promise(function (res) {
        var t = d.transaction([ESTADO, MIDIA], 'readwrite');
        t.objectStore(MIDIA).clear();
        t.objectStore(ESTADO).put({
          json: json, quando: Date.now(), nome: VE.project.name || 'sem nome',
          fontes: [], semMidia: 1
        }, 'projeto');
        t.oncomplete = function () {
          if (VE.app && VE.app.toast) {
            VE.app.toast('não coube tudo no espaço do navegador — guardei o projeto sem os arquivos. ' +
              'os cortes voltam; as mídias terão de ser recarregadas.', 'err');
          }
          res('parcial');
        };
        t.onerror = function () { res(false); };
      });
    }).catch(function () { return false; });
  }

  /* ---------- quanto está ocupando, e onde ---------- */
  A.espaco = function () {
    var meu = 0;
    return abrir().then(function (d) {
      return new Promise(function (res) {
        var t = d.transaction([ESTADO, MIDIA], 'readonly');
        var cur = t.objectStore(MIDIA).openCursor();
        var n = 0;
        cur.onsuccess = function () {
          var c = cur.result;
          if (c) { meu += (c.value && c.value.blob ? c.value.blob.size : 0); n++; c.continue(); }
          else res(n);
        };
        cur.onerror = function () { res(n); };
      });
    }).then(function (n) {
      var est = (navigator.storage && navigator.storage.estimate)
        ? navigator.storage.estimate() : Promise.resolve({});
      return est.then(function (q) {
        return {
          bytes: meu, arquivos: n,
          usadoNaOrigem: q.usage || 0, cota: q.quota || 0,
          persistente: !!A.persistente
        };
      });
    }).catch(function () { return { bytes: 0, arquivos: 0, usadoNaOrigem: 0, cota: 0 }; });
  };

  A.tamanhoLegivel = function (b) {
    if (!b) return '0 B';
    var u = ['B', 'KB', 'MB', 'GB'], i = 0;
    while (b >= 1024 && i < 3) { b /= 1024; i++; }
    return (b < 10 && i > 0 ? b.toFixed(1) : Math.round(b)) + ' ' + u[i];
  };

  /* junta as rajadas: mexer num controle dispara dezenas de 'project' */
  A.marcar = function () {
    if (!ligado) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; A.guardar(); }, ATRASO);
  };

  /* ================================================== LER DE VOLTA ======= */

  A.sessao = function () {
    return tx(ESTADO, 'readonly').then(function (st) { return por(st.get('projeto')); })
      .catch(function () { return null; });
  };

  A.limpar = function () {
    if (timer) { clearTimeout(timer); timer = null; }
    return abrir().then(function (d) {
      return new Promise(function (res) {
        var t = d.transaction([ESTADO, MIDIA], 'readwrite');
        t.objectStore(ESTADO).clear(); t.objectStore(MIDIA).clear();
        t.oncomplete = function () { res(true); };
        t.onerror = function () { res(false); };
      });
    }).catch(function () { return false; });
  };

  /* recria UMA fonte com o id que ela tinha antes. O id importa: é ele
     que liga o clipe à mídia dentro do arquivo de projeto.              */
  /* a remontagem de fonte agora mora em media.js: a sessão guardada e o
     arquivo de projeto completo precisam exatamente da mesma coisa. */
  var repor = function (id, reg) { return VE.media.recriar(id, reg); };

  A.restaurar = function () {
    var meta;
    return A.sessao().then(function (s) {
      if (!s || !s.json) throw new Error('não há sessão guardada');
      meta = s;
      return tx(MIDIA, 'readonly');
    }).then(function (st) {
      return Promise.all((meta.fontes || []).map(function (id) {
        return por(st.get(id)).then(function (reg) { return reg ? repor(id, reg) : null; });
      }));
    }).then(function (ids) {
      var ok = ids.filter(Boolean).length;
      /* `deserialize` escreve DENTRO de VE.project — numa aba recém-aberta
         ele ainda não existe. Sem esta linha a volta morria em silêncio. */
      var m = null;
      try { m = JSON.parse(meta.json); } catch (e) { }
      if (!VE.project) {
        VE.app.ensureProject(
          m && m.canvas ? m.canvas.w : 1920,
          m && m.canvas ? m.canvas.h : 1080,
          m ? m.duration : 10
        );
      }
      /* o pincel das legendas: remontado com o id que os clipes citam,
         senão `deserialize` os descartaria por "fonte que sumiu".    */
      if (VE.legendas && m) VE.legendas.reporFonte(m);
      /* as fontes já estão no lugar: agora o projeto pode ser lido */
      VE.deserialize(meta.json);
      VE.emit('sources');
      return { fontes: ok, perdidas: (meta.fontes || []).length - ok, quando: meta.quando };
    });
  };

  /* ================================================== A BARRA ============
     Não é janela nem página: é uma faixa que desce sobre a linha do tempo,
     com duas saídas e nada mais. Quem ignora, continua trabalhando.     */

  function quandoTexto(ts) {
    var d = new Date(ts), agora = Date.now();
    var min = Math.round((agora - ts) / 60000);
    var hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (min < 1) return 'agora há pouco';
    if (min < 60) return 'há ' + min + ' min (' + hora + ')';
    if (min < 60 * 20) return 'há ' + Math.round(min / 60) + ' h (' + hora + ')';
    return d.toLocaleDateString('pt-BR') + ' às ' + hora;
  }

  A.oferecer = function () {
    return A.sessao().then(function (s) {
      if (!s || !s.json) return false;
      /* projeto já com conteúdo na tela? então não atropela nada */
      var temCoisa = VE.project && VE.project.tracks.some(function (t) { return t.clips.length; });
      if (temCoisa) return false;
      barra(s);
      return true;
    }).catch(function () { return false; });
  };

  function barra(s) {
    var velha = document.getElementById('autoBar');
    if (velha) velha.remove();
    var n = 0;
    try { n = (JSON.parse(s.json).tracks || []).reduce(function (a, t) { return a + (t.clips || []).length; }, 0); } catch (e) { }
    var el = document.createElement('div');
    el.id = 'autoBar';
    el.className = 'autobar';
    el.innerHTML =
      '<span class="ab-dot"></span>' +
      '<span class="ab-txt"><b>sessão guardada</b> — ' + esc(s.nome || 'sem nome') + ' · ' +
      n + ' clipe' + (n === 1 ? '' : 's') + ' · ' + quandoTexto(s.quando) + '</span>' +
      '<button class="ab-btn ab-sim" id="abVoltar">VOLTAR PARA ELA</button>' +
      '<button class="ab-btn" id="abLimpar">COMEÇAR DO ZERO</button>' +
      '<button class="ab-x" id="abFechar" title="decidir depois">×</button>';
    document.body.appendChild(el);
    el.querySelector('#abVoltar').addEventListener('click', function () {
      el.querySelector('.ab-txt').innerHTML = '<b>voltando…</b> relendo os arquivos guardados';
      A.restaurar().then(function (r) {
        el.remove();
        var msg = r.fontes + ' fonte(s) de volta';
        if (r.perdidas) msg += ' · ' + r.perdidas + ' não voltou (câmera ao vivo não se guarda)';
        VE.app.toast(msg + ' — camadas de texto voltam como imagem', 'ok');
      }, function (e) {
        el.remove();
        VE.app.toast('não consegui reabrir a sessão: ' + e.message, 'err');
      });
    });
    el.querySelector('#abLimpar').addEventListener('click', function () {
      A.limpar().then(function () { el.remove(); VE.app.toast('sessão guardada apagada', 'ok'); });
    });
    el.querySelector('#abFechar').addEventListener('click', function () { el.remove(); });
  }

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]; }); }

  /* selo discreto na barra de estado: "guardado 19:47" — e em vermelho
     quando a última gravação NÃO deu certo, porque um selo que mente é
     pior do que selo nenhum.                                        */
  function mostrarSelo() {
    var el = document.getElementById('stAuto');
    if (!el) return;
    if (A.erro) {
      el.textContent = 'NÃO GUARDOU · ' + A.erro.toUpperCase();
      el.classList.add('falhou'); el.classList.remove('piscou');
      return;
    }
    el.classList.remove('falhou');
    el.textContent = 'GUARDADO ' + new Date(A.ultimo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    el.classList.add('piscou');
    setTimeout(function () { el.classList.remove('piscou'); }, 700);
  }

  /* ================================================== LIGAÇÃO ============ */

  A.ligar = function () {
    if (!window.indexedDB) return false;
    /* Sem isto o armazenamento é "melhor esforço": o navegador PODE
       jogar fora quando o disco apertar. Pedir persistência o põe na
       lista do que não se apaga sozinho.                           */
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then(function (ja) {
        if (ja) { A.persistente = true; return; }
        return navigator.storage.persist().then(function (ok) { A.persistente = !!ok; });
      }).catch(function () { });
    }
    VE.on('project', A.marcar);
    VE.on('sources', A.marcar);
    /* a última chance antes de a aba fechar: grava sem esperar o atraso */
    window.addEventListener('beforeunload', function () {
      if (timer) { clearTimeout(timer); timer = null; A.guardar(); }
    });
    return true;
  };

  A.desligar = function () { ligado = false; if (timer) { clearTimeout(timer); timer = null; } };
  A.religar = function () { ligado = true; };
  A.estaLigado = function () { return ligado; };

})(window.VE);
