/* ============================================================
   rgb_lab — efeitos parte 13: SCANNER
   ------------------------------------------------------------
   O escâner de mesa que anda enquanto a folha se mexe embaixo dele.
   Cada LINHA da imagem é capturada num instante ligeiramente
   diferente do cabeçote — e é essa diferença, não um borrão comum,
   que faz a imagem derreter para o lado em vez de só tremer.

   Onde a linha deslocada sai da imagem, aparece o FUNDO — e com
   Fundo=Transparente esse fundo é alfa de verdade, não uma cor
   fingindo ser vazio. Mesmo mecanismo do efeito Tricô (fx12.js).

   SÓ PARA FOTOS. O aviso está no `desc` de propósito — é a primeira
   linha que aparece quando o efeito é aberto na ficha. Em vídeo o
   deslocamento senoidal reembaralha a cada quadro (função de
   `uLocal`) e o resultado fica instável, não um scan coerente.

   O GESTO GRAVADO (24/08/2026, reescrito depois do Bruno achar a
   primeira versão confusa): igual ao site de referência — aperte o
   alvo na prévia, arraste como quiser, solte. O gesto INTEIRO, do
   aperto ao soltar, é esticado para caber do topo ao fim do scan:
   cada linha da imagem mostra o ponto do arraste que corresponde à
   MESMA fração de progresso. Sem cronômetro, sem keyframe — é
   literalmente "puxe a folha enquanto escaneia".

   Por baixo, isso ainda usa o mecanismo genérico `rawCurve` (fx.js/
   gl.js/state.js): o gesto gravado vira uma textura de 128 pontos
   (`e.trilha`, gravado direto no efeito por panels.js) e o shader lê
   o ponto certo pela POSIÇÃO da linha via `curvaEm(pos)`. Clicar sem
   arrastar (gesto muito curto) LIMPA o traçado gravado.

   O que este efeito ainda NÃO tenta imitar: o texto de metadados
   queimado no canto (resolução, hora, modo) — isso já tem casa
   própria, uma camada de TEXTO por cima, no canal de tipografia do
   laboratório.
   ============================================================ */
(function (VE) {
  'use strict';

  var D = VE.def;
  var GLI = '#ff2e63';

  D({
    id: 'scanner', name: 'Scanner de vídeo', cat: 'glitch', color: GLI, alpha: true,
    rawCurve: true, tempo: true,
    desc: '⚠ só funciona direito em FOTOS (em vídeo o resultado fica instável). digitalização linha a linha, com vãos de alfa real — arraste o alvo na prévia pra puxar a folha, exatamente como no site de referência',
    params: [
      { k: 'dir', label: 'Direção do scan', t: 's', opts: ['Vertical (para baixo)', 'Horizontal (para o lado)'], def: 0 },
      { k: 'speed', label: 'Velocidade de digitalização', min: 0, max: 4, def: 1 },
      { k: 'wave', label: 'Oscilação senoidal (px)', min: 0, max: 80, step: 1, def: 22 },
      { k: 'dragAmt', label: 'Intensidade do arraste gravado', min: 0, max: 1, def: 1 },
      { k: 'colorMode', label: 'Cor', t: 's', opts: ['Cor', 'Preto e branco'], def: 0 },
      { k: 'noise', label: 'Grão de ruído', min: 0, max: 1, def: 0.22 },
      { k: 'bgMode', label: 'Fundo', t: 's', opts: ['Original', 'Cor sólida', 'Transparente'], def: 1 },
      { k: 'bgColor', t: 'c', label: 'Cor de fundo', def: '#ffffff' }
    ],
    glsl: [
      'vec4 fx4(vec2 uv){',
      '  bool vert = (u_dir < 0.5);',
      '  float pos  = vert ? uv.y : uv.x;',
      '  float perp = vert ? uv.x : uv.y;',
      '  float fase = pos + uLocal*u_speed*0.18;',
      '  float onda = sin(pos*3.0*6.28318 + fase*2.0);',
      '  float tPerp = 1.0/max(vert ? uRes.x : uRes.y, 1.0);',
      '  float off = onda*u_wave*tPerp;',
      '  float perpD = perp + off;',
      '  vec2 sampleUv = vert ? vec2(perpD, pos) : vec2(pos, perpD);',
      /* o arraste gravado empurra os DOIS eixos livremente — puxar a
         folha na diagonal estica/comprime tanto quanto desvia, que é
         exatamente o que acontece numa digitalização de verdade.       */
      '  vec2 arr = curvaEm(pos)*u_dragAmt;',
      '  sampleUv -= arr;',
      '  vec3 c = srccol(sampleUv);',
      '  if(u_colorMode > 0.5) c = vec3(luma(c));',
      '  vec2 tAA = texel()*1.5;',
      '  vec2 borda = smoothstep(vec2(0.0), tAA, sampleUv)*smoothstep(vec2(0.0), tAA, 1.0 - sampleUv);',
      '  float dentro = clamp(borda.x*borda.y, 0.0, 1.0);',
      '  float g = hash21(floor(uv*uRes) + floor(uLocal*24.0)) - 0.5;',
      '  c += g*u_noise*0.55;',
      '  float bgm = floor(u_bgMode + 0.5);',
      '  vec3 bgc; float bga;',
      '  if(bgm < 0.5){ bgc = srccol(uv); bga = 1.0; }',
      '  else if(bgm < 1.5){ bgc = u_bgColor; bga = 1.0; }',
      '  else { bgc = u_bgColor; bga = 0.0; }',
      '  vec3 rgbOut = mix(bgc, c, dentro);',
      '  float aOut  = mix(bga, 1.0, dentro);',
      '  return vec4(clamp(rgbOut, 0.0, 1.0), clamp(aOut, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

  /* ══════════════════════════════ A MESA, VISTA DO CATÁLOGO ═══════════
     A mesa de digitalização (mesa.js/mesaui.js) não é um shader: é uma
     GRAVAÇÃO ao vivo, e por isso mora numa janela. Mas o lugar onde a
     pessoa PROCURA por ela é o catálogo, ao lado do irmão de vídeo —
     foi exatamente aí que o Bruno clicou esperando a janela abrir.

     Então ela aparece no catálogo como uma porta: `janela: 'mesa'` faz
     o clique ABRIR A JANELA em vez de acrescentar efeito ao clipe
     (ver o tratamento em panels.js/renderFxList). Fica registrada aqui,
     e não em mesa.js, por um motivo bem concreto: `fxfam.js` carrega
     DEPOIS deste arquivo e ANTES de mesa.js, e é ele quem dá família a
     cada item — registrada lá, ela ficaria fora das oito famílias.

     O `glsl` de passagem nunca é usado (o clique não acrescenta nada),
     mas existe para que ela não quebre nada caso um projeto antigo ou
     um arrasto a coloquem numa pilha por engano.                     */
  D({
    id: 'mesa', name: 'Scanner de mesa (foto)', cat: 'glitch', color: GLI,
    janela: 'mesa',
    desc: 'ABRE UMA JANELA — o escâner de verdade, linha por linha: arraste a foto (ou deixe o vídeo tocar) enquanto o cabeçote anda, e o filme guarda o que estava embaixo dele a cada instante',
    params: [],
    glsl: 'vec3 fx(vec2 uv){ return srccol(uv); }'
  });

})(window.VE);
