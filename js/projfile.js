/* ============================================================
   rgb_lab — ARQUIVO DE PROJETO
   ------------------------------------------------------------
   Existiam dois jeitos de guardar, e nenhum servia para "salvo aqui,
   abro amanhã naquela outra máquina":

     · SALVAR PROJETO (.json)  guarda a EDIÇÃO — cortes, efeitos,
       máscaras, keyframes, legendas, traçados. Não guarda os vídeos.
       Abrir num lugar onde os arquivos não estão descarta os clipes.
     · SESSÃO GUARDADA (IndexedDB) guarda tudo, arquivos inclusive —
       mas só naquele navegador, naquela máquina.

   Falta o óbvio: um arquivo que a pessoa leva embora com TUDO dentro.
   É o `.rgblab`.

   ------------------------------------------------------------
   O FORMATO, e por que não é um zip nem base64

   Base64 engorda 33 % e obriga a montar uma string gigante na memória —
   um vídeo de 500 MB viraria 660 MB de texto e o navegador engasga.
   Zip exigiria uma biblioteca, e este projeto não tem dependência.

   Então é um recipiente simples, que o navegador monta sem carregar
   nada na memória (um `Blob` aceita outros `Blob` como pedaços) e lê
   fatiando (`Blob.slice` não copia bytes):

       bytes 0..7     "RGBLAB01"
       bytes 8..11    uint32 (little-endian) = tamanho do cabeçalho
       bytes 12..     cabeçalho em JSON (utf-8)
       depois         os arquivos, crus, um atrás do outro, na ordem
                      em que o cabeçalho os lista

   O cabeçalho traz o projeto inteiro (o mesmo que `VE.serialize` dá) e
   o índice das partes: id da fonte, tipo, nome e quantos bytes ocupa.
   O ID é o que costura tudo — é por ele que o clipe acha a mídia.
   ============================================================ */
(function (VE) {
  'use strict';

  var P = VE.projfile = {};

  var MAGIC = 'RGBLAB01';
  var CAB = 12;                       /* 8 do selo + 4 do tamanho */

  P.EXT = '.rgblab';

  function bytesDe(s) { return new TextEncoder().encode(s); }

  /* ================================================== SALVAR ============= */

  /* o que de cada fonte vai para dentro do arquivo */
  function partesDoProjeto() {
    var usadas = {};
    VE.project.tracks.forEach(function (t) {
      t.clips.forEach(function (c) { if (c.src) usadas[c.src] = 1; });
    });
    var out = [];
    Object.keys(usadas).forEach(function (id) {
      var s = VE.sources[id];
      if (!s) return;
      /* webcam é dispositivo ao vivo; legenda é pincel, não arquivo —
         o texto dela já viaja dentro do projeto.                   */
      if (s.kind === 'webcam' || s.kind === 'legenda') return;
      if (s.blob) {
        out.push({
          id: id, kind: s.kind, name: s.name, tipo: s.blob.type || '',
          bytes: s.blob.size, w: s.w, h: s.h, duration: s.duration || 0,
          __blob: s.blob
        });
      } else if (s.el && s.el.toBlob) {
        /* canvas (tipografia, tinta, quadro da câmera): congela em PNG */
        out.push({
          id: id, kind: s.kind, name: s.name, tipo: 'image/png',
          bytes: 0, w: s.w, h: s.h, duration: 0, deTipografia: s.kind === 'type',
          __canvas: s.el
        });
      }
    });
    return out;
  }

  function pngDoCanvas(cv) {
    return new Promise(function (res) {
      try { cv.toBlob(function (b) { res(b); }, 'image/png'); }
      catch (e) { res(null); }
    });
  }

  P.montar = function () {
    if (!VE.project) return Promise.reject(new Error('não há projeto'));
    var partes = partesDoProjeto();
    return Promise.all(partes.map(function (p) {
      if (p.__blob) return p;
      return pngDoCanvas(p.__canvas).then(function (b) {
        if (!b) return null;
        p.__blob = b; p.bytes = b.size; delete p.__canvas;
        return p;
      });
    })).then(function (lista) {
      lista = lista.filter(Boolean);
      var cab = {
        app: 'rgb_lab', formato: 1, quando: Date.now(),
        nome: VE.project.name || 'sem nome',
        projeto: JSON.parse(VE.serialize()),
        partes: lista.map(function (p) {
          return {
            id: p.id, kind: p.kind, name: p.name, tipo: p.tipo,
            bytes: p.bytes, w: p.w, h: p.h, duration: p.duration,
            deTipografia: p.deTipografia ? 1 : 0
          };
        })
      };
      var cabBytes = bytesDe(JSON.stringify(cab));
      var tam = new Uint8Array(4);
      new DataView(tam.buffer).setUint32(0, cabBytes.length, true);
      var pedacos = [bytesDe(MAGIC), tam, cabBytes];
      lista.forEach(function (p) { pedacos.push(p.__blob); });
      return {
        blob: new Blob(pedacos, { type: 'application/octet-stream' }),
        partes: lista.length,
        bytesMidia: lista.reduce(function (a, p) { return a + p.bytes; }, 0)
      };
    });
  };

  P.salvar = function () {
    return P.montar().then(function (r) {
      var nome = (VE.project.name || 'projeto').replace(/[^\w\-]+/g, '-').toLowerCase();
      VE.saveFile((VE.BRAND ? VE.BRAND.slug : 'rgb_lab') + '-' + nome + '-' +
        Date.now().toString(36) + P.EXT, r.blob);
      return r;
    });
  };

  /* ================================================== ABRIR ============== */

  /* o arquivo é um `.rgblab`? olha o selo, sem ler o resto */
  P.ehCompleto = function (file) {
    return file.slice(0, 8).text().then(function (t) { return t === MAGIC; },
      function () { return false; });
  };

  P.abrir = function (file) {
    var cab, base;
    return file.slice(0, CAB).arrayBuffer().then(function (buf) {
      var selo = new TextDecoder().decode(new Uint8Array(buf, 0, 8));
      if (selo !== MAGIC) throw new Error('não é um arquivo de projeto completo');
      var n = new DataView(buf).getUint32(8, true);
      if (!n || n > 64 * 1024 * 1024) throw new Error('cabeçalho ilegível');
      base = CAB + n;
      return file.slice(CAB, base).text();
    }).then(function (txt) {
      cab = JSON.parse(txt);
      if (!cab || cab.app !== 'rgb_lab') throw new Error('arquivo de outro programa');

      /* as fontes entram PRIMEIRO, com o id que tinham — só depois o
         projeto é lido, senão `deserialize` descarta os clipes.    */
      var off = base;
      var fatias = (cab.partes || []).map(function (p) {
        var pedaco = file.slice(off, off + p.bytes, p.tipo || '');
        off += p.bytes;
        return { p: p, blob: pedaco };
      });
      return fatias.reduce(function (fila, f) {
        return fila.then(function (acc) {
          return VE.media.recriar(f.p.id, {
            kind: f.p.kind === 'type' ? 'image' : f.p.kind,
            name: f.p.name, tipo: f.p.tipo, blob: f.blob,
            deTipografia: f.p.deTipografia
          }).then(function (id) { acc.push(id); return acc; });
        });
      }, Promise.resolve([]));
    }).then(function (ids) {
      var ok = ids.filter(Boolean).length;
      var m = cab.projeto || {};
      if (!VE.project) {
        VE.app.ensureProject(m.canvas ? m.canvas.w : 1920,
          m.canvas ? m.canvas.h : 1080, m.duration || 10);
      }
      if (VE.legendas) { try { VE.legendas.reporFonte(m); } catch (e) { } }
      VE.deserialize(JSON.stringify(m));
      VE.emit('sources');
      return {
        fontes: ok, perdidas: (cab.partes || []).length - ok,
        nome: cab.nome, quando: cab.quando,
        clipes: VE.allClips().length
      };
    });
  };

  /* ================================================== TAMANHO ============ */
  P.tamanhoLegivel = function (b) {
    if (!b) return '0 B';
    var u = ['B', 'KB', 'MB', 'GB'], i = 0;
    while (b >= 1024 && i < 3) { b /= 1024; i++; }
    return (b < 10 && i > 0 ? b.toFixed(1) : Math.round(b)) + ' ' + u[i];
  };

  /* quanto pesaria o arquivo completo, sem montá-lo */
  P.peso = function () {
    if (!VE.project) return { bytes: 0, arquivos: 0 };
    var usadas = {}, total = 0, n = 0;
    VE.project.tracks.forEach(function (t) {
      t.clips.forEach(function (c) { if (c.src) usadas[c.src] = 1; });
    });
    Object.keys(usadas).forEach(function (id) {
      var s = VE.sources[id];
      if (s && s.blob) { total += s.blob.size; n++; }
    });
    return { bytes: total, arquivos: n };
  };

})(window.VE);
