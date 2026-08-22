/* ============================================================
   rgb_lab — presets (efeito, cadeia, áudio, tipografia)
   Guardados no navegador; exportáveis como .json
   ============================================================ */
(function (VE) {
  'use strict';
  var KEY = 'videorte.presets.v2';
  var P = VE.presets = {};
  var store = null;

  function load() {
    if (store) return store;
    try { store = JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { store = {}; }
    return store;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { }
    VE.emit('presets');
  }

  P.list = function (kind) {
    var s = load();
    return Object.keys(s).map(function (k) { return s[k]; })
      .filter(function (p) { return !kind || p.kind === kind; })
      .sort(function (a, b) { return a.created - b.created; });
  };

  P.add = function (kind, name, data) {
    var s = load();
    var id = VE.uid('p');
    var n = P.list(kind).length + 1;
    s[id] = {
      id: id, kind: kind, created: Date.now(),
      code: 'PRESET_' + String(n).padStart(3, '0'),
      name: (name || 'sem nome').toUpperCase().slice(0, 28),
      data: data
    };
    save();
    return s[id];
  };

  P.remove = function (id) { var s = load(); delete s[id]; save(); };
  P.get = function (id) { return load()[id]; };

  P.exportAll = function () {
    return JSON.stringify({ app: 'videorte-presets', version: 2, items: load() }, null, 1);
  };

  P.importAll = function (txt) {
    var o = JSON.parse(txt);
    if (!o || o.app !== 'videorte-presets') throw new Error('arquivo de presets inválido');
    var s = load();
    Object.keys(o.items || {}).forEach(function (k) { s[k] = o.items[k]; });
    save();
  };

  /* atalhos de uso ------------------------------------------------------- */

  /* CADEIA = a pilha de efeitos do clipe selecionado (ou de todos os
     ajustes ativos, se nada estiver selecionado).                       */
  P.saveChain = function (name) {
    var sel = VE.selected();
    var effects = [];
    if (sel && sel.effects.length) effects = sel.effects;
    else {
      VE.allClips().forEach(function (c) {
        if (c.kind === 'adjust') effects = effects.concat(c.effects);
      });
    }
    if (!effects.length) return null;
    return P.add('chain', name, JSON.parse(JSON.stringify(effects)));
  };

  /* aplica a cadeia no clipe selecionado; sem seleção, cria um ajuste novo */
  P.applyChain = function (id) {
    var p = P.get(id);
    if (!p || p.kind !== 'chain') return false;
    var effects = p.data;
    /* formato antigo (pistas de efeito) continua abrindo */
    if (effects.length && effects[0].clips) {
      var flat = [];
      effects.forEach(function (tr) {
        (tr.clips || []).forEach(function (c) {
          var e = VE.newEffect(c.fx);
          e.params = c.params || e.params;
          if (c.mask) e.mask = c.mask;
          e.amount = c.amount === undefined ? 1 : c.amount;
          flat.push(e);
        });
      });
      effects = flat;
    }
    var target = VE.selected();
    if (!target) {
      target = VE.newAdjust(0, VE.duration());
      target.name = p.name;
      var tr2 = VE.tracksOfClass('fx')[0] || VE.addTrack('fx');
      tr2.clips.push(target);
      VE.select([target.id]);
    }
    JSON.parse(JSON.stringify(effects)).forEach(function (e) {
      e.id = VE.uid('e');
      e.mask = e.mask || VE.newMask();
      target.effects.push(e);
    });
    return true;
  };

  /* guarda só os parâmetros de um efeito */
  P.saveFx = function (eff, name) {
    return P.add('fx', name || eff.name, {
      fx: eff.fx, params: JSON.parse(JSON.stringify(eff.params)),
      mask: JSON.parse(JSON.stringify(eff.mask || VE.newMask())), amount: eff.amount
    });
  };

  P.applyFx = function (id, eff) {
    var p = P.get(id);
    if (!p || p.kind !== 'fx' || !eff || eff.fx !== p.data.fx) return false;
    eff.params = JSON.parse(JSON.stringify(p.data.params));
    eff.mask = JSON.parse(JSON.stringify(p.data.mask));
    eff.amount = p.data.amount;
    return true;
  };

})(window.VE);
