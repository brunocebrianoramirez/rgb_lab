/* ============================================================
   rgb_lab — viewport: zoom, pan, fit
   O canvas é exibido em pixels do projeto (100% = 1:1) e o
   palco é transladado/escalado. Vertical 1080×1920 cabe inteiro.
   ============================================================ */
(function (VE) {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var V = VE.view = { zoom: 1, x: 0, y: 0, mode: 'fit', pixel: false };
  var vp, stage, canvas, rx, ry, dragging = null, spaceDown = false;

  V.init = function () {
    vp = $('#vp'); stage = $('#vpStage'); canvas = $('#gl');
    rx = $('#vpRulerX'); ry = $('#vpRulerY');

    $('#zFit').addEventListener('click', function () { V.fit(); });
    $('#z100').addEventListener('click', function () { V.setZoom(1); V.center(); });
    $('#z200').addEventListener('click', function () { V.setZoom(2); V.center(); });
    $('#z400').addEventListener('click', function () { V.setZoom(4); V.center(); });
    $('#zIn').addEventListener('click', function () { V.zoomBy(1.25); });
    $('#zOut').addEventListener('click', function () { V.zoomBy(0.8); });
    $('#fitW').addEventListener('click', function () { V.fitAxis('w'); });
    $('#fitH').addEventListener('click', function () { V.fitAxis('h'); });
    $('#zCenter').addEventListener('click', function () { V.center(); });
    $('#zoomVal').addEventListener('change', function () {
      var z = parseFloat(this.value) / 100;
      if (isFinite(z) && z > 0) { V.setZoom(Math.max(0.02, Math.min(32, z))); V.center(); }
    });
    $('#pxToggle').addEventListener('click', function () {
      V.pixel = !V.pixel;
      stage.classList.toggle('pixel', V.pixel);
      this.classList.toggle('on', V.pixel);
    });

    /* roda: zoom com ctrl, rolagem normal caso contrário */
    vp.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        V.zoomAt(e.deltaY < 0 ? 1.12 : 0.89, e.clientX, e.clientY);
      } else if (e.shiftKey) {
        V.x -= e.deltaY; V.apply();
      } else {
        V.x -= e.deltaX; V.y -= e.deltaY; V.apply();
      }
    }, { passive: false });

    /* pan: botão do meio, espaço, alt, ou arrasto no fundo */
    vp.addEventListener('pointerdown', function (e) {
      var onMask = e.target.closest('.vp-mask.active');
      if (e.button === 1 || spaceDown || e.altKey || (!onMask && e.button === 0)) {
        if (onMask && !(e.button === 1 || spaceDown || e.altKey)) return;
        e.preventDefault();
        vp.setPointerCapture(e.pointerId);
        vp.classList.add('panning');
        dragging = { x: e.clientX, y: e.clientY, ox: V.x, oy: V.y };
      }
    });
    vp.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      V.x = dragging.ox + (e.clientX - dragging.x);
      V.y = dragging.oy + (e.clientY - dragging.y);
      V.apply();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      vp.addEventListener(ev, function () { dragging = null; vp.classList.remove('panning'); });
    });
    window.addEventListener('keydown', function (e) { if (e.code === 'Space') spaceDown = true; });
    window.addEventListener('keyup', function (e) { if (e.code === 'Space') spaceDown = false; });

    var ro = new ResizeObserver(function () { if (V.mode !== 'free') V.applyMode(); V.drawRulers(); });
    ro.observe(vp);
  };

  V.size = function () {
    var p = VE.project;
    return p ? { w: p.canvas.w, h: p.canvas.h } : { w: 1920, h: 1080 };
  };

  V.apply = function () {
    if (!stage) return;
    var s = V.size();
    canvas.style.width = s.w + 'px';
    canvas.style.height = s.h + 'px';
    stage.style.transform = 'translate(' + V.x.toFixed(1) + 'px,' + V.y.toFixed(1) + 'px) scale(' + V.zoom.toFixed(4) + ')';
    var zv = $('#zoomVal');
    if (zv && document.activeElement !== zv) zv.value = (V.zoom * 100).toFixed(V.zoom < 1 ? 1 : 0);
    ['zFit', 'z100', 'z200', 'z400'].forEach(function (id) { var b = $('#' + id); if (b) b.classList.remove('on'); });
    if (V.mode === 'fit') $('#zFit').classList.add('on');
    else if (Math.abs(V.zoom - 1) < 0.001) $('#z100').classList.add('on');
    else if (Math.abs(V.zoom - 2) < 0.001) $('#z200').classList.add('on');
    else if (Math.abs(V.zoom - 4) < 0.001) $('#z400').classList.add('on');
    V.drawRulers();
    if (VE.panels && VE.panels.renderMaskOverlay) VE.panels.renderMaskOverlay();
  };

  V.setZoom = function (z) { V.zoom = Math.max(0.02, Math.min(32, z)); V.mode = 'free'; V.apply(); };
  V.zoomBy = function (f) {
    var r = vp.getBoundingClientRect();
    V.zoomAt(f, r.left + r.width / 2, r.top + r.height / 2);
  };

  V.zoomAt = function (f, clientX, clientY) {
    var r = vp.getBoundingClientRect();
    var mx = clientX - r.left, my = clientY - r.top;
    var nz = Math.max(0.02, Math.min(32, V.zoom * f));
    var k = nz / V.zoom;
    V.x = mx - (mx - V.x) * k;
    V.y = my - (my - V.y) * k;
    V.zoom = nz; V.mode = 'free';
    V.apply();
  };

  V.fit = function () { V.mode = 'fit'; V.applyMode(); };
  V.fitAxis = function (ax) { V.mode = ax === 'w' ? 'fitw' : 'fith'; V.applyMode(); };

  V.applyMode = function () {
    if (!vp) return;
    var r = vp.getBoundingClientRect(), s = V.size();
    var pad = 34;
    if (V.mode === 'fit') V.zoom = Math.min((r.width - pad) / s.w, (r.height - pad) / s.h);
    else if (V.mode === 'fitw') V.zoom = (r.width - pad) / s.w;
    else if (V.mode === 'fith') V.zoom = (r.height - pad) / s.h;
    V.zoom = Math.max(0.02, Math.min(32, V.zoom));
    V.centerOnly();
    V.apply();
  };

  V.centerOnly = function () {
    var r = vp.getBoundingClientRect(), s = V.size();
    V.x = (r.width - s.w * V.zoom) / 2;
    V.y = (r.height - s.h * V.zoom) / 2;
  };

  V.center = function () { V.centerOnly(); V.apply(); };

  /* réguas do viewport, em pixels do projeto */
  V.drawRulers = function () {
    if (!rx || !ry || !vp) return;
    var r = vp.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var css = getComputedStyle(document.documentElement);
    var ink = css.getPropertyValue('--ink-3').trim() || '#777';
    var ink2 = css.getPropertyValue('--ink').trim() || '#111';

    function setup(cv, w, h) {
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      var c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      c.font = '8px "JetBrains Mono", monospace';
      c.fillStyle = ink; c.strokeStyle = ink;
      return c;
    }
    /* passo em px do projeto */
    var cand = [1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000, 2000];
    var step = cand[cand.length - 1];
    for (var i = 0; i < cand.length; i++) { if (cand[i] * V.zoom >= 56) { step = cand[i]; break; } }

    var cx = setup(rx, r.width, 14);
    var startX = Math.floor((-V.x / V.zoom) / step) * step;
    var endX = (-V.x + r.width) / V.zoom;
    for (var x = startX; x <= endX; x += step) {
      var px = x * V.zoom + V.x;
      cx.fillRect(px, 8, 1, 6);
      cx.fillStyle = ink2;
      cx.fillText(String(x), px + 2, 7);
      cx.fillStyle = ink;
      for (var s2 = 1; s2 < 5; s2++) {
        var pm = (x + step * s2 / 5) * V.zoom + V.x;
        cx.fillRect(pm, 11, 1, 3);
      }
    }
    var cy = setup(ry, 14, r.height);
    var startY = Math.floor((-V.y / V.zoom) / step) * step;
    var endY = (-V.y + r.height) / V.zoom;
    for (var y = startY; y <= endY; y += step) {
      var py = y * V.zoom + V.y;
      cy.fillRect(8, py, 6, 1);
      cy.save();
      cy.translate(6, py + 2);
      cy.rotate(-Math.PI / 2);
      cy.fillStyle = ink2;
      cy.fillText(String(y), -20, 0);
      cy.restore();
      cy.fillStyle = ink;
    }
  };

})(window.VE);
