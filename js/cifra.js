/* ============================================================
   rgb_lab — A CIFRA · o motor
   ------------------------------------------------------------
   O campo harmônico à mão. Escolhe-se um tom e uma escala, e os
   sete acordes daquela tonalidade aparecem em pastilhas: aperta
   uma, sai o acorde inteiro afinado. Por baixo há um teclado,
   para quem quiser a nota solta.

   O QUE ESTE ARQUIVO SABE, e o que ele não sabe:
   sabe empilhar terças dentro de uma escala, inverter acorde,
   montar dominante secundário e dar nome ao resultado. Não sabe
   que existe tela, não faz som e não conhece o navegador. Quem
   toca é `js/musica.js`; quem desenha é `js/cifraui.js`.

   AS TERÇAS SÃO CONTADAS NA ESCALA, NÃO EM SEMITONS. É o que faz
   o mesmo botão dar C-E-G no primeiro grau e D-F-A no segundo
   sem uma tabela de acordes escrita à mão: pula-se de dois em
   dois DENTRO dos graus da escala, e a escala decide se a terça
   sai maior ou menor. Troca-se a escala e o campo inteiro se
   refaz sozinho — inclusive em escalas de cinco ou seis graus,
   onde as "terças" saem estranhas e é exatamente essa a graça.

   O NOME DO ACORDE É LIDO DE VOLTA DOS INTERVALOS, nunca guardado
   junto. Se a conta produzir um acorde, o nome descreve o que a
   conta produziu — não o que se esperava dela. Foi assim que
   apareceram os `sus` das pentatônicas, que ninguém tinha
   previsto e estão certos.
   ============================================================ */
(function (VE) {
  'use strict';

  var C = VE.cifra = {};
  var MU = VE.musica;

  /* Quantas notas cada tipo empilha: tríade, sétima, nona, décima
     primeira, décima terceira.                                  */
  C.TIPOS = [
    { id: 'tri', rot: 'tri', n: 3 },
    { id: '7',   rot: '7',   n: 4 },
    { id: '9',   rot: '9',   n: 5 },
    { id: '11',  rot: '11',  n: 6 },
    { id: '13',  rot: '13',  n: 7 }
  ];
  C.INVERSOES = ['root', '1ª', '2ª', '3ª'];

  /* Os empréstimos. Cada um é uma FÓRMULA em semitons a partir de
     uma raiz deslocada — não um grau da escala, porque a graça do
     secundário é justamente sair dela por um compasso.

       /V    a dominante do grau: quinta acima, com sétima menor
       /IV   a subdominante: quarta acima, maior
       /vii  a sensível: semitom abaixo, diminuta                */
  C.SECUNDARIAS = [
    { id: 'nenhuma', rot: '–',    desl: 0,  f: null },
    { id: 'v',       rot: '/V',   desl: 7,  f: [0, 4, 7, 10, 14, 17, 21] },
    { id: 'iv',      rot: '/IV',  desl: 5,  f: [0, 4, 7, 11, 14, 18, 21] },
    { id: 'vii',     rot: '/vii', desl: -1, f: [0, 3, 6, 9, 14, 17, 20] }
  ];

  C.novoEstado = function () {
    return {
      tom: 0, escala: 'maior', oitava: 4,
      legato: false, vozId: 'piano',
      tipo: 0, inversao: 0, secundaria: 0,
      bpm: 100, vel: .8,
      notas: [], gravando: false, t0: 0, dur: 0
    };
  };

  function graus(est) { return MU.escalaDe(est.escala).g; }

  /* A raiz do grau, em MIDI. Oitava 4 põe o tom em C4 = 60.     */
  C.raizDoGrau = function (est, grau) {
    var g = graus(est), n = g.length;
    var oct = Math.floor(grau / n);
    return est.tom + (est.oitava + 1) * 12 + g[((grau % n) + n) % n] + oct * 12;
  };

  /* ═══════════════════════ O ACORDE ════════════════════════════
     Devolve `{ raiz, notas, nome, romano, qualidade }`. As notas
     saem em ordem e já invertidas; a RAIZ vai separada de
     propósito, porque depois de inverter a nota mais grave já não
     é ela — e é a raiz que dá nome ao acorde, não o baixo.      */
  C.acorde = function (est, grau, opc) {
    opc = opc || {};
    var tipo = opc.tipo != null ? opc.tipo : est.tipo;
    var inv = opc.inversao != null ? opc.inversao : est.inversao;
    var sec = opc.secundaria != null ? opc.secundaria : est.secundaria;
    var quantas = (C.TIPOS[tipo] || C.TIPOS[0]).n;
    var g = graus(est), n = g.length;
    var raizGrau = C.raizDoGrau(est, grau);
    var notas = [], raiz = raizGrau;

    var S = C.SECUNDARIAS[sec] || C.SECUNDARIAS[0];
    if (S.f) {
      raiz = raizGrau + S.desl;
      for (var k = 0; k < quantas; k++) notas.push(raiz + S.f[Math.min(k, S.f.length - 1)] + (k >= S.f.length ? (k - S.f.length + 1) * 12 : 0));
    } else {
      /* terças contadas na escala: dois graus de cada vez */
      for (var j = 0; j < quantas; j++) {
        var idx = grau + j * 2;
        var oct = Math.floor(idx / n);
        notas.push(est.tom + (est.oitava + 1) * 12 + g[((idx % n) + n) % n] + oct * 12);
      }
    }
    notas.sort(function (a, b) { return a - b; });
    var info = C.nomear(raiz, notas);

    /* a inversão sobe a nota mais grave uma oitava, tantas vezes
       quantas se pedir — o acorde é o mesmo, o baixo é que muda */
    for (var i = 0; i < inv && notas.length > 1; i++) notas.push(notas.shift() + 12);

    return { raiz: raiz, notas: notas, nome: info.nome,
             romano: info.romano, qualidade: info.qualidade };
  };

  /* ═══════════════════════ O NOME ══════════════════════════════
     Lido dos INTERVALOS que sobraram, e não de uma tabela: assim
     o nome nunca mente sobre o que soa. Escalas de cinco graus
     produzem acordes sem terça, e o nome diz `sus` porque é o que
     eles são.                                                    */
  C.nomear = function (raiz, notas) {
    var tem = {};
    notas.forEach(function (x) { tem[(((x - raiz) % 12) + 12) % 12] = 1; });
    var terca = tem[4] ? 4 : tem[3] ? 3 : 0;
    var quinta = tem[7] ? 7 : tem[6] ? 6 : tem[8] ? 8 : 0;

    var qual, suf;
    if (terca === 3 && quinta === 6) { qual = 'dim'; suf = 'dim'; }
    else if (terca === 4 && quinta === 8) { qual = 'aug'; suf = 'aug'; }
    else if (terca === 3) { qual = 'menor'; suf = 'm'; }
    else if (terca === 4) { qual = 'maior'; suf = ''; }
    else if (tem[5]) { qual = 'sus'; suf = 'sus4'; }
    else if (tem[2]) { qual = 'sus'; suf = 'sus2'; }
    else { qual = 'quinta'; suf = '5'; }

    /* a extensão que aparece no nome é a MAIS ALTA presente, que é
       como se escreve cifra: um C13 já subentende a sétima e a nona */
    var ext = '';
    if (tem[9] && (tem[10] || tem[11]) && terca) ext = '13';
    else if (tem[5] && (tem[10] || tem[11]) && terca) ext = '11';
    else if (tem[2] && (tem[10] || tem[11])) ext = '9';
    else if (tem[10]) ext = '7';
    else if (tem[11]) ext = qual === 'maior' ? 'maj7' : '7M';
    if (ext && qual === 'dim' && tem[9]) ext = '7';

    /* NOS SUS A SÉTIMA VEM ANTES: escreve-se D7sus4, nunca Dsus47.
       Apareceu nas pentatônicas, onde empilhar terças da escala dá
       acordes sem terça — o motor estava certo e o nome é que saía
       ao contrário do que qualquer songbook escreve.              */
    var letra = MU.NOMES[((raiz % 12) + 12) % 12];
    var nome = (qual === 'sus' && ext) ? letra + ext + suf : letra + suf + ext;
    var rom = { maior: 1, aug: 1 }[qual] ? 'MAI' : 'men';
    return { nome: nome, qualidade: qual, romano: rom };
  };

  var ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  C.romano = function (grau, qual) {
    var r = ROMANOS[grau] || String(grau + 1);
    if (qual === 'menor') return r.toLowerCase();
    if (qual === 'dim') return r.toLowerCase() + '°';
    if (qual === 'aug') return r + '+';
    if (qual === 'sus' || qual === 'quinta') return r.toLowerCase() + 's';
    return r;
  };

  /* ═══════════════════════ O CAMPO ═════════════════════════════
     Um acorde por grau da escala. Sete nas escalas de sete, cinco
     nas pentatônicas — a grade da tela lê o comprimento, não um
     número fixo, e por isso trocar de escala não deixa pastilha
     vazia nem acorde de fora.                                    */
  C.campo = function (est) {
    var g = graus(est), lista = [];
    for (var i = 0; i < g.length; i++) {
      var a = C.acorde(est, i);
      /* o algarismo romano descreve a TRÍADE do grau, mesmo quando
         se está a tocar uma décima terceira: é a função dele —
         dizer onde se está na tonalidade, não quantas notas soam */
      var tri = C.acorde(est, i, { tipo: 0, inversao: 0, secundaria: 0 });
      lista.push({ grau: i, numero: i + 1, romano: C.romano(i, tri.qualidade),
                   nome: a.nome, notas: a.notas, raiz: a.raiz, qualidade: a.qualidade });
    }
    return lista;
  };

  /* ═══════════════════════ A GRAVAÇÃO ══════════════════════════
     O instrumento guarda o que foi TOCADO, com o tempo que levou:
     a nota nasce ao apertar e fecha ao soltar. Mesmo formato de
     nota do sonógrafo (`{t, dur, nota, vel, canal}`), e é por isso
     que o `.mid` e o render do núcleo servem aos dois sem uma
     linha de adaptação.                                          */
  C.limpar = function (est) { est.notas = []; est.dur = 0; };

  C.abrir = function (est, nota, vel, t) {
    var n = { t: Math.max(0, t - est.t0), dur: .05, nota: nota, vel: vel, canal: 0, viva: true };
    if (est.gravando) est.notas.push(n);
    return n;
  };

  C.fechar = function (est, n, t) {
    if (!n || !n.viva) return;
    n.viva = false;
    n.dur = Math.max(.06, (t - est.t0) - n.t);
    est.dur = Math.max(est.dur, n.t + n.dur);
  };

  /* ═══════════════════════ AS SAÍDAS ═══════════════════════════ */
  C.midi = function (est) {
    return MU.midi(est.notas, { bpm: est.bpm, etiqueta: 'rgb_lab cifra',
      voz: function () { return est.vozId; } });
  };
  C.render = function (est) {
    return MU.render(est.notas, { voz: function () { return est.vozId; } });
  };

})(window.VE);
