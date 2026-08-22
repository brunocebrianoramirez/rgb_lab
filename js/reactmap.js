/* ============================================================
   rgb_lab — ÁUDIO REATIVO
   ------------------------------------------------------------
   O som do laboratório 02 mexendo na imagem do laboratório 01.

   Não é um módulo novo nem uma janela: é uma camada de leitura.
   Um mapeamento diz "grave → escala deste clipe", e o valor é
   SOMADO à propriedade no momento em que ela é lida
   (`VE.valueAt`). O valor que você ajustou à mão continua lá;
   desligar o mapeamento devolve a imagem exatamente como estava,
   e nenhum keyframe é criado.

   A fonte dos números é o mesmo analisador que já desenhava o
   espectro no laboratório de áudio — `VE.reactive`.
   ============================================================ */
(function (VE) {
  'use strict';

  var R = VE.reactMap = {};

  /* o que o áudio oferece */
  R.FONTES = [
    { id: 'level', label: 'NÍVEL', desc: 'o quanto está tocando, no geral' },
    { id: 'rms', label: 'RMS', desc: 'energia média — mais estável que o pico' },
    { id: 'peak', label: 'PICO', desc: 'o valor instantâneo mais alto' },
    { id: 'bass', label: 'GRAVE', desc: 'as faixas baixas' },
    { id: 'mid', label: 'MÉDIO', desc: 'a faixa da voz e dos instrumentos' },
    { id: 'treble', label: 'AGUDO', desc: 'os brilhos e as consoantes' },
    { id: 'transient', label: 'TRANSIENTE', desc: 'as batidas — só o ataque' }
  ];

  R.CURVAS = ['Linear', 'Suave', 'Só o topo', 'Só o começo', 'Invertida'];

  /* estado suavizado por mapeamento: sem isso a imagem treme a 60 Hz */
  var suav = {};
  var atual = { level: 0, rms: 0, peak: 0, bass: 0, mid: 0, treble: 0, transient: 0 };

  R.tick = function (react) {
    if (!react) return;
    R.FONTES.forEach(function (f) {
      var v = react[f.id];
      atual[f.id] = (typeof v === 'number' && isFinite(v)) ? v : 0;
    });
    R.ativo = true;
  };

  function curvar(v, curva) {
    v = Math.max(0, Math.min(1.6, v));
    var c = curva | 0;
    if (c === 1) return v * v * (3 - 2 * Math.min(1, v));
    if (c === 2) return Math.max(0, (v - 0.55)) / 0.45;
    if (c === 3) return Math.min(1, v * 2.6);
    if (c === 4) return 1 - Math.min(1, v);
    return v;
  }

  /* o valor que este mapeamento soma AGORA */
  VE.reactValue = function (m) {
    if (!m || !m.on) return 0;
    var bruto = atual[m.src] || 0;
    var k = m.uid || (m.uid = 'r' + Math.random().toString(36).slice(2, 7));
    var alvo = curvar(bruto, m.curve);
    var s = (m.smooth === undefined ? 0.5 : m.smooth);
    var anterior = suav[k] === undefined ? alvo : suav[k];
    /* ataque rápido, queda lenta: é assim que o olho lê uma batida */
    var passo = alvo > anterior ? (1 - s * 0.75) : (1 - s * 0.96);
    suav[k] = anterior + (alvo - anterior) * Math.max(0.02, passo);
    return suav[k] * (m.amount === undefined ? 1 : m.amount);
  };

  /* ------------------------------------------------------------ DESTINOS
     Um destino é um caminho de propriedade do clipe — os mesmos que os
     keyframes usam. Motion vale para qualquer clipe visual; os parâmetros
     de efeito dependem do que estiver na pilha daquele clipe.          */
  R.destinos = function (clip) {
    if (!clip) return [];
    var out = [];
    if (clip.kind !== 'audio' && clip.kind !== 'adjust') {
      out.push(
        { path: 'motion.scale', label: 'ESCALA', sug: 0.35 },
        { path: 'motion.x', label: 'POSIÇÃO X', sug: 0.08 },
        { path: 'motion.y', label: 'POSIÇÃO Y', sug: 0.08 },
        { path: 'motion.rot', label: 'ROTAÇÃO', sug: 25 },
        { path: 'motion.opacity', label: 'OPACIDADE', sug: -0.5 },
        { path: 'motion.sx', label: 'ESCALA X', sug: 0.3 },
        { path: 'motion.sy', label: 'ESCALA Y', sug: 0.3 }
      );
    }
    (clip.effects || []).forEach(function (e) {
      var def = VE.FXBY[e.fx];
      if (!def) return;
      out.push({ path: 'fx.' + e.id + '.amount', label: def.name + ' · INTENSIDADE', sug: 0.6 });
      def.params.forEach(function (p) {
        if (p.t === 'c' || p.t === 'txt') return;
        var faixa = (p.max === undefined ? 1 : p.max) - (p.min === undefined ? 0 : p.min);
        out.push({
          path: 'fx.' + e.id + '.' + p.k,
          label: def.name + ' · ' + p.label,
          sug: faixa * 0.3
        });
      });
    });
    return out;
  };

  R.novo = function (clip, path, src) {
    clip.react = clip.react || [];
    var d = R.destinos(clip).filter(function (x) { return x.path === path; })[0];
    var m = {
      on: true, src: src || 'bass', path: path,
      amount: d ? d.sug : 0.3, curve: 0, smooth: 0.5
    };
    clip.react.push(m);
    return m;
  };

  R.remover = function (clip, i) {
    if (!clip.react) return;
    clip.react.splice(i, 1);
  };

  /* quantos mapeamentos existem no projeto inteiro — usado na ficha */
  R.total = function () {
    if (!VE.project) return 0;
    var n = 0;
    VE.allClips().forEach(function (c) { n += (c.react || []).length; });
    return n;
  };

  /* ---------------------------------------------------------- REDESENHO
     A imagem só muda se alguém pedir para redesenhar. Quando há
     mapeamento ligado e o áudio está tocando, o laboratório de vídeo
     precisa redesenhar mesmo com a composição parada.                 */
  R.precisaRedesenhar = function () {
    if (!VE.project || !R.ativo) return false;
    var achou = false;
    VE.allClips().forEach(function (c) {
      if (achou || !c.react) return;
      for (var i = 0; i < c.react.length; i++) if (c.react[i].on) { achou = true; return; }
    });
    return achou;
  };

})(window.VE);
