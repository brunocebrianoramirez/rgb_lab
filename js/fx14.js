/* ============================================================
   rgb_lab — efeitos parte 14: O TUBO E O CODEC
   ------------------------------------------------------------
   Dois efeitos antigos reconstruídos pelo MECANISMO, como o VHS foi
   (PROJETO.md, 4y). Os ids são os mesmos de antes — `crt` e
   `datamosh` — e as chaves antigas que ainda fazem sentido foram
   mantidas, para que um projeto salvo continue achando os dois.

   CRT / TUBÃO
   -----------
   A referência foi a ferramenta aberta da tooooools (effects/crt). O
   que foi lido dela é o VOCABULÁRIO e os PADRÕES DE FÁBRICA — e a
   cadeia é a de um tubo de verdade:

     1 · a CURVATURA do vidro           barril leve
     2 · a CONVERGÊNCIA                  o canhão R e o B não acertam o
                                         mesmo ponto: cada um chega
                                         deslocado numa direção
     3 · a MÁSCARA DE FÓSFORO            MONITOR: pontos redondos em
                                         trio vertical, coluna sim
                                         coluna não descida (delta)
                                         TV: listras com o trio vizinho
                                         descido meia altura (fenda)
                                         LCD: três listras por célula
     4 · o HALO do ponto                 o fósforo aceso ilumina o vizinho
     5 · o BLOOM                         o que passa do limiar vaza, num
                                         borrão largo, e volta por TELA,
                                         CLAREAR ou HDR
     6 · a saída em GAMA                 o tubo é mais claro que o número

   A régua NÃO é o pixel da tela: é a largura em TRÍADES (colunas de
   fósforo). Os 1,59 px da referência numa tela de 600 são 377 colunas —
   e 377 colunas dão a mesma tela em 320, 960 ou 1920 de largura. Foi a
   lição do VHS (4y, segunda volta): controle em pixel de tela muda de
   efeito conforme o tamanho do projeto.

   Três passadas: a primeira separa o que passa do limiar (da imagem de
   ENTRADA, como na referência — não do tubo); a segunda borra na
   horizontal; a última borra na vertical, desenha o tubo e compõe.

   DATAMOSH
   --------
   A referência foi o Supermosh (supermosh.github.io, GPL): ele não
   imita o datamosh — ele FAZ, com o codec de verdade. Recodifica o
   vídeo em H.264 com UM quadro-chave só, monta uma linha do tempo de
   trechos, e manda os quadros-P para o decodificador na ordem que o
   editor quis. O decodificador aplica o MOVIMENTO de um trecho sobre a
   IMAGEM que ficou do trecho anterior. É só isso, e é tudo.

   O que um quadro-P carrega, e o que este shader reproduz:

     1 · VETORES DE MOVIMENTO por macrobloco    cada bloco de 16×16 diz
                                                de onde veio no quadro
                                                anterior
     2 · o RESÍDUO                              a diferença entre o novo
                                                e a previsão, em blocos
                                                de DCT quantizados — só
                                                o grosso sobrevive
     3 · blocos INTRA                           quando o movimento não
                                                explica o bloco, o codec
                                                manda a imagem nova
     4 · o QUADRO-CHAVE                         o único reset. Removê-lo
                                                é o datamosh clássico

   A saída de cada quadro é a saída ANTERIOR (uPrev, o quadro composto)
   deslocada pelos vetores, mais o resíduo. Como o resíduo é calculado
   contra a previsão do CODEC (a fonte de ontem, uFontePrev), a imagem
   velha viaja com o movimento do vídeo novo e nunca se apaga — só o
   resíduo pinta o novo por cima, aos poucos, onde algo muda.

   Os vetores são MEDIDOS aqui, em GPU, por busca de bloco — como um
   codificador faz: para cada bloco, testa 16×16 deslocamentos e fica
   com o de menor diferença (SAD), com um custo pequeno para o vetor
   comprido, que é o termo de taxa de um codificador real. A busca é
   paralela: cada PIXEL do bloco calcula UM candidato; duas passadas de
   redução (16 leituras cada) acham o mínimo; a última passada aplica.
   Custo constante por pixel, em qualquer resolução.

   A régua é o codec: o macrobloco é contado numa linha de 720.

   SEGUNDA VOLTA (11/09/2026, com três exemplos de mosh do Bruno e a
   pesquisa: datamoshing.com, ffglitch, Datamosh 2, Supermosh):
   · MEMÓRIA PRÓPRIA (gl.js, `memoria: true`): a passada 2 guarda o
     campo de vetores. É o que permite REPETIR O QUADRO-P — o "bloom"
     das referências, o mesmo movimento aplicado de novo e de novo,
     acelerando — sem que o vídeo precise parar;
   · o RELÓGIO DO CODEC: o mosh avança a 24 (ou o que se pedir) quadros
     por segundo, e não a cada desenho da tela — igual na prévia e na
     exportação, e com o tranco de vídeo que o mosh tem;
   · o CAMPO editado como o ffglitch edita por script: só vertical (o
     "sink and rise"), só horizontal, negado, ou somado a uma deriva,
     um zoom (a explosão do centro) ou uma espiral; e o RASTRO, a
     média dos vetores no tempo (o mv_average deles);
   · a cor em 4:2:0: a crominância do resíduo é sempre a do bloco —
     os retalhos de cor dos exemplos.
   ============================================================ */
(function (VE) {
  'use strict';

  var D = VE.def;
  var GLI = '#ff2e63';
  var DM_ULT = {};   /* último quadro do codec visto por cada datamosh */

  /* ================================================== CRT / TUBÃO ===== */
  D({
    id: 'crt', name: 'CRT / Tubão', cat: 'glitch', color: GLI,
    passes: 3,
    desc: 'o tubo pelo mecanismo: máscara de fósforo (pontos, fenda ou listras), convergência RGB, halo, bloom e curvatura — nasce com os padrões da referência (Monitor)',
    params: [
      { k: 'tipo', t: 's', label: 'Máscara', def: 0, opts: ['MONITOR — pontos (delta)', 'TV — fenda (slot)', 'LCD — listras', 'SÓ LINHAS (sem máscara)'] },
      { k: 'colunas', label: 'Colunas de fósforo (tríades)', min: 40, max: 1200, step: 1, def: 377 },
      { k: 'ponto', label: 'Tamanho do ponto', min: 0.05, max: 2, def: 0.93 },
      { k: 'suave', label: 'Suavidade do ponto', min: 0.01, max: 1, def: 0.12 },
      { k: 'mask', label: 'Força da máscara', min: 0, max: 1, def: 1 },
      { k: 'fosforo', t: 's', label: 'Fósforo', def: 0, opts: ['COR (RGB)', 'VERDE (P1)', 'ÂMBAR (P3)', 'BRANCO (P4)', 'AZUL'] },
      { k: 'bright', label: 'Brilho', min: 0.2, max: 3, def: 1 },
      { k: 'gama', label: 'Gama da máscara', min: 0.5, max: 3, def: 2.2 },
      { k: 'conv', label: 'Convergência (desalinho R/B)', min: 0, max: 4, def: 0.55 },
      { k: 'convAng', label: 'Direção da convergência (°)', min: 0, max: 360, step: 1, def: 45 },
      { k: 'glow', label: 'Halo do ponto', min: 0, max: 1, def: 0.1 },
      { k: 'glowR', label: 'Raio do halo (em pontos)', min: 0, max: 1.5, def: 0.2 },
      { k: 'bloom', label: 'Bloom (luz vazando)', min: 0, max: 4, def: 0.45 },
      { k: 'bloomLim', label: 'Limiar do bloom', min: 0, max: 1, def: 0.36 },
      { k: 'bloomR', label: 'Raio do bloom (em pontos)', min: 0, max: 24, def: 3.8 },
      { k: 'bloomModo', t: 's', label: 'Como o bloom volta', def: 0, opts: ['TELA (screen)', 'CLAREAR (lighten)', 'HDR', 'SOMA'] },
      { k: 'curve', label: 'Curvatura do vidro', min: 0, max: 2, def: 0.25 },
      { k: 'scan', label: 'Linhas de varredura', min: 0, max: 1, def: 0 },
      { k: 'linhas', label: 'Quantas linhas', min: 60, max: 1080, step: 1, def: 480 },
      { k: 'grao', label: 'Grão', min: 0, max: 1, def: 0 },
      { k: 'flick', label: 'Cintilação', min: 0, max: 1, def: 0.04 },
      { k: 'vig', label: 'Vinheta', min: 0, max: 1, def: 0.35 }
    ],
    glsl: [
      /* resto inteiro seguro: nesta GPU `mod` devolve n no múltiplo exato,
         e um ponto do trio que devia ser 0 viraria 3 — célula apagada. */
      'float crtMod(float x, float n){ return x - n*floor(x/n + 0.5/n); }',
      /* a régua: passo da grade em pixels de tela, a partir das COLUNAS */
      'float crtPasso(){ return uRes.x/clamp(u_colunas, 8.0, 4000.0); }',
      /* curvatura de barril — a mesma conta da referência, cc·(1+d)·d */
      'vec2 crtCurva(vec2 uv){',
      '  vec2 cc = uv - 0.5;',
      '  float d = dot(cc, cc)*u_curve*0.08;',
      '  return uv + cc*(1.0 + d)*d;',
      '}',
      'float crtSuave(){ return clamp(u_suave, 0.01, 1.0); }',
      'float crtRedondo(vec2 p, vec2 c, float passo){',
      '  float r = passo*u_ponto*0.5;',
      '  return smoothstep(r, r*(1.0 - crtSuave()), length(p - c));',
      '}',
      'float crtReto(vec2 p, vec2 c, vec2 tam){',
      '  vec2 d = abs(p - c);',
      '  vec2 r = smoothstep(tam, tam*(1.0 - crtSuave()), d);',
      '  return r.x*r.y;',
      '}',
      /* MONITOR: pontos redondos em colunas de um passo; coluna ímpar
         descida um trio e meio; dentro da coluna o trio R-G-B empilha
         na vertical. É a máscara delta dos monitores.                */
      'float crtMonitor(vec2 co, float ci, float passo){',
      '  float col = floor(co.x/passo);',
      '  float desl = crtMod(col, 2.0)*passo*1.5;',
      '  float y = co.y - desl;',
      '  float lin = floor(y/passo);',
      '  float grupo = crtMod(lin, 3.0);',
      '  vec2 c = vec2((col + 0.5)*passo, (lin + 0.5)*passo + desl);',
      '  return (abs(grupo - ci) < 0.5) ? crtRedondo(co, c, passo) : 0.0;',
      '}',
      /* LCD: três listras verticais por célula, uma por cor */
      'float crtLCD(vec2 co, float ci, float passo){',
      '  float lw = passo/3.0;',
      '  float pos = crtMod(floor(co.x/lw), 3.0);',
      '  if(abs(pos - ci) > 0.5) return 0.0;',
      '  vec2 base = floor(co/vec2(lw, passo));',
      '  vec2 c = vec2((base.x + 0.5)*lw, (base.y + 0.5)*passo);',
      '  return crtReto(co, c, vec2(passo*u_ponto*0.5)*vec2(0.31, 1.0));',
      '}',
      /* TV: as listras do LCD com o trio vizinho descido meia altura —
         a máscara de fenda (slot mask) dos televisores                */
      'float crtTV(vec2 co, float ci, float passo){',
      '  float lw = passo/3.0;',
      '  float grupo = floor(co.x/passo);',
      '  float desl = crtMod(grupo, 2.0)*passo*0.5;',
      '  vec2 sc = vec2(co.x, co.y - desl);',
      '  float pos = crtMod(floor(sc.x/lw), 3.0);',
      '  if(abs(pos - ci) > 0.5) return 0.0;',
      '  vec2 base = floor(sc/vec2(lw, passo));',
      '  vec2 c = vec2((base.x + 0.5)*lw, (base.y + 0.5)*passo + desl);',
      '  return crtReto(co, c, vec2(passo*u_ponto*0.5)*vec2(0.31, 1.0));',
      '}',
      'float crtPadrao(vec2 co, float ci, float passo){',
      '  if(u_tipo < 0.5) return crtMonitor(co, ci, passo);',
      '  if(u_tipo < 1.5) return crtTV(co, ci, passo);',
      '  if(u_tipo < 2.5) return crtLCD(co, ci, passo);',
      '  return 1.0;',
      '}',
      'vec3 crtMascara(vec2 co, float passo){',
      '  vec3 m = vec3(crtPadrao(co, 0.0, passo), crtPadrao(co, 1.0, passo), crtPadrao(co, 2.0, passo));',
      '  return mix(vec3(1.0), m, clamp(u_mask, 0.0, 1.0));',
      '}',
      /* RGB, ou um fósforo só: todos os pontos acesos com a mesma cor,
         pelo brilho da imagem — o monitor verde e o âmbar                */
      'vec3 crtFosforo(vec3 c, vec3 m){',
      '  if(u_fosforo < 0.5) return c*m;',
      '  vec3 tinta = u_fosforo < 1.5 ? vec3(0.35, 1.0, 0.45)',
      '             : u_fosforo < 2.5 ? vec3(1.0, 0.72, 0.25)',
      '             : u_fosforo < 3.5 ? vec3(0.92, 0.95, 1.0)',
      '             : vec3(0.35, 0.62, 1.0);',
      '  return tinta*luma(c)*max(max(m.r, m.g), m.b);',
      '}',
      /* A COMPENSAÇÃO DA MÁSCARA. Os pontos cobrem uma fração da tela, e
         cada cor só um terço deles: sem compensar, a imagem sai a um
         quarto do brilho. A referência corrige com um ganho fixo de 2,5
         e a saída em gama 2,2 — e os dois SÓ fazem sentido com máscara.
         Aqui seguem a presença dela: máscara cheia = a conta da
         referência; sem máscara (força 0, ou SÓ LINHAS) = nenhuma. Foi
         medido: com o ganho literal, SÓ LINHAS saía a 216 de média onde
         a fonte tinha 133.                                              */
      'float crtPresenca(){ return (u_tipo < 2.5) ? clamp(u_mask, 0.0, 1.0) : 0.0; }',
      'float crtGanho(){ return mix(1.0, 2.5, crtPresenca())*u_bright; }',
      'float crtGama(){ return mix(1.0, max(u_gama, 0.1), crtPresenca()); }',
      /* leitura com convergência: R e B chegam desalinhados em direções
         opostas, a distância medida em pontos                          */
      'vec3 crtLer(vec2 uv, float passo){',
      '  float a = radians(u_convAng);',
      '  vec2 d = vec2(cos(a), sin(a))*u_conv*passo/uRes;',
      '  float r = texture(uOrig, clamp(uv + d, 0.0, 1.0)).r;',
      '  float g = texture(uOrig, clamp(uv, 0.0, 1.0)).g;',
      '  float b = texture(uOrig, clamp(uv - d, 0.0, 1.0)).b;',
      '  return vec3(r, g, b);',
      '}',
      /* a imagem no tubo, antes do bloom */
      'vec3 crtImagem(vec2 uv){',
      '  float passo = crtPasso();',
      '  vec2 t = crtCurva(uv);',
      '  if(t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) return vec3(0.0);',
      '  vec2 co = t*uRes;',
      '  vec3 c = crtLer(t, passo)*crtGanho();',
      '  if(u_grao > 0.001) c += (hash21(co + fract(uTime)*17.0) - 0.5)*u_grao*0.6;',
      '  vec3 col = crtFosforo(c, crtMascara(co, passo));',
      /* halo: anel de amostras em volta, peso gaussiano na distância,
         normalizado para não estourar — a conta da referência, que usa
         TRINTA E DUAS amostras. Aqui são oito, e cada peso vale por
         quatro: a normalização depende da SOMA dos pesos, e com oito
         pesos de um o halo pesava menos, os pontos estouravam mais e o
         meio-tom saía 26% mais claro que o da referência (medido:
         cinza 74,9 contra 59,5; com o peso corrigido, os dois batem). */
      '  if(u_glow > 0.001 && u_glowR > 0.001){',
      '    float peso = 0.0; vec3 acc = vec3(0.0);',
      '    for(int i = 0; i < 8; i++){',
      '      float ang = float(i)*0.7853981634;',
      '      vec2 off = vec2(cos(ang), sin(ang))*u_glowR*passo;',
      /* as amostras do halo entram SEM o ganho — é assim na referência,
         e é o que segura o meio-tom: com ganho, a média do anel subia
         2,5× e o cinza saía 26% mais claro que o dela                 */
      '      vec3 cs = crtLer(t + off/uRes, passo)*u_bright;',
      '      float w = 4.0*exp(-dot(off, off)/(4.0*passo*passo));',
      '      acc += crtFosforo(cs, crtMascara(co + off, passo))*w;',
      '      peso += w;',
      '    }',
      '    col = (col + acc*u_glow)/(1.0 + peso*u_glow);',
      '  }',
      /* linhas de varredura: contadas na altura da imagem, não em pixel */
      '  if(u_scan > 0.001){',
      '    float sl = 0.5 + 0.5*cos(t.y*max(u_linhas, 10.0)*2.0*PI);',
      '    col *= 1.0 - u_scan*0.6*sl;',
      '  }',
      '  col *= 1.0 + (hash11(floor(uTime*30.0)) - 0.5)*u_flick;',
      '  vec2 p = t*2.0 - 1.0;',
      '  col *= mix(1.0, 1.0 - smoothstep(0.55, 1.4, length(p)), u_vig);',
      /* a saída em gama é do TUBO, antes do bloom — na referência ela
         vive dentro do shader do tubo, e o bloom entra depois, linear */
      '  return pow(max(col, 1e-6), vec3(1.0/crtGama()));',
      '}',
      /* gaussiana de 13 toques com sigma 2 — os pesos da referência,
         escritos como conta em vez de tabela                            */
      'float crtPeso(int i){ return exp(-float(i*i)/8.0)/5.0132; }',
      'float crtRaio(){ return max(u_bloomR, 0.0)*crtPasso()/6.0; }',
      'vec4 fxStep(vec2 uv){',
      '  if(uPass < 0.5){',
      /* passada 0: só o que passa do limiar segue para o bloom — lido da
         IMAGEM DE ENTRADA, não do tubo. Medido contra a referência: com o
         limiar aplicado ao tubo já mascarado, só os pontos VERDES passavam
         (a luma pesa 0,72 no verde e 0,21 no vermelho) e o branco saía
         verde (85/137/85 onde a referência dá 158/158/158).           */
      '    vec3 c = texture(uOrig, uv).rgb;',
      '    float k = smoothstep(u_bloomLim, u_bloomLim + 0.2, luma(c));',
      '    return vec4(c*k, 1.0);',
      '  }',
      /* passada 1: borrão horizontal do que passou */
      '  float r = crtRaio();',
      '  vec3 acc = vec3(0.0);',
      '  for(int i = -6; i <= 6; i++){',
      '    acc += texture(uTex, clamp(uv + vec2(float(i)*r/uRes.x, 0.0), 0.0, 1.0)).rgb*crtPeso(i);',
      '  }',
      '  return vec4(acc, 1.0);',
      '}',
      'vec3 fxLast(vec2 uv){',
      /* passada 2: borrão vertical, o tubo redesenhado, e a mistura */
      '  float r = crtRaio();',
      '  vec3 bloom = vec3(0.0);',
      '  for(int i = -6; i <= 6; i++){',
      '    bloom += texture(uTex, clamp(uv + vec2(0.0, float(i)*r/uRes.y), 0.0, 1.0)).rgb*crtPeso(i);',
      '  }',
      '  bloom = clamp(bloom*u_bloom, 0.0, 1.0);',
      '  vec3 cena = clamp(crtImagem(uv), 0.0, 1.0);',
      '  vec3 c;',
      '  if(u_bloomModo < 0.5)      c = 1.0 - (1.0 - cena)*(1.0 - bloom);',
      '  else if(u_bloomModo < 1.5) c = max(cena, bloom);',
      '  else if(u_bloomModo < 2.5) { vec3 h = cena + bloom; c = h/(1.0 + h); }',
      '  else                       c = cena + bloom;',
      '  return c;',
      '}'
    ].join('\n')
  });

  /* ==================================================== DATAMOSH ===== */
  D({
    id: 'datamosh', name: 'Datamosh', cat: 'glitch', color: GLI,
    passes: 4,
    /* lê a saída anterior (uPrev) E a fonte de ontem (uFontePrev): o
       primeiro é a imagem que arrasta, o segundo é o que o codec compara
       para achar o movimento e para calcular o resíduo. E tem MEMÓRIA
       PRÓPRIA (gl.js): a passada 2 guarda o CAMPO DE VETORES, e é o
       campo guardado que permite repetir um quadro-P, rastrear a média
       no tempo, e andar no relógio do codec e não no da tela.         */
    fontePrev: true, tempo: true, memoria: true, memPass: 2,
    /* a fonte de ONTEM tem de ser a do quadro anterior DO CODEC, não a do
       desenho anterior da tela: a 60 Hz o movimento medido seria o de um
       sexagésimo e aplicado uma vez a cada vinte e quatro avos. Então o
       anel da fonte só recebe um quadro novo quando o relógio do codec
       vira — na prévia e na exportação, o mesmo movimento.            */
    fontePrevQuando: function (fxDef, time) {
      var fps = Math.max(1, +(fxDef.params && fxDef.params.fps) || 24);
      var q = Math.floor(time * fps), k = fxDef.effId || fxDef.id;
      if (DM_ULT[k] === q) return false;
      DM_ULT[k] = q;
      return true;
    },
    desc: 'o codec de verdade: vetores de movimento medidos por macrobloco arrastam o quadro anterior, e só o resíduo quantizado pinta o novo. Remova o quadro-chave (o corte) e a imagem velha viaja com o movimento novo; REPITA o quadro-P e ela escorre sem parar',
    params: [
      { k: 'block', label: 'Macrobloco (numa linha de 720)', min: 4, max: 64, step: 1, def: 16 },
      { k: 'fps', label: 'Quadros por segundo do codec', min: 4, max: 60, step: 1, def: 24 },
      { k: 'busca', label: 'Alcance da busca (em blocos)', min: 0.25, max: 3, def: 1 },
      { k: 'len', label: 'Ganho do movimento', min: 0, max: 4, def: 1.5 },
      { k: 'congelar', label: 'REPETIR o quadro-P (segura o movimento)', min: 0, max: 1, step: 1, def: 0 },
      { k: 'acel', label: 'Aceleração da repetição', min: 0, max: 3, def: 0.5 },
      { k: 'campo', t: 's', label: 'Campo de vetores', def: 0, opts: ['MEDIDO', 'MEDIDO + DERIVA', 'MEDIDO + ZOOM (explode)', 'MEDIDO + ESPIRAL', 'SÓ VERTICAL (afunda e sobe)', 'SÓ HORIZONTAL', 'NEGADO'] },
      { k: 'edge', label: 'Força da deriva / zoom', min: 0, max: 1, def: 0.3 },
      { k: 'ang', label: 'Direção da deriva (°)', min: 0, max: 360, step: 1, def: 0 },
      { k: 'rastro', label: 'Rastro dos vetores (média no tempo)', min: 0, max: 0.98, def: 0 },
      { k: 'decay', label: 'Persistência (segura o resíduo)', min: 0, max: 1, def: 0.5 },
      { k: 'quant', label: 'Quantização do resíduo (blocos de DCT)', min: 0, max: 1, def: 0.6 },
      { k: 'croma', t: 'b', label: 'Cor em blocos (4:2:0)', def: 1 },
      { k: 'tol', label: 'Tolerância do casamento (SAD)', min: 0.02, max: 0.6, def: 0.16 },
      { k: 'intra', label: 'Blocos intra (a imagem nova entra)', min: 0, max: 1, def: 0.25 },
      { k: 'amt', label: 'Blocos travados', min: 0, max: 1, def: 0.35 },
      { k: 'rate', label: 'Troca dos travados (Hz)', min: 0.5, max: 30, step: 0.5, def: 4 },
      { k: 'scatter', label: 'Bagunça dos vetores', min: 0, max: 2, def: 0.08 },
      { k: 'chrom', label: 'Queima da cor por geração', min: 0, max: 2, def: 0.3 },
      { k: 'gop', label: 'Quadro-chave a cada (s) · 0 = só no início', min: 0, max: 30, step: 0.5, def: 0 }
    ],
    glsl: [
      /* a régua é o codec: o bloco é contado numa linha de 720 amostras */
      'float dmBloco(){ return max(u_block, 2.0)*uRes.x/720.0; }',
      'float dmAlcance(){ return max(u_busca, 0.05)*dmBloco(); }',
      /* 16 bits de custo em dois canais de 8 */
      'vec2 dmPack(float v){ v = clamp(v, 0.0, 0.9999); return vec2(floor(v*255.0)/255.0, fract(v*255.0)); }',
      'float dmUnpack(vec2 p){ return (floor(p.x*255.0 + 0.5) + p.y)/255.0; }',
      'vec4 dmTexel(vec2 px){ return texelFetch(uTex, ivec2(clamp(floor(px), vec2(0.0), uRes - 1.0)), 0); }',
      /* o relógio do CODEC: o índice do quadro, guardado em 8 bits */
      'float dmQuadro(){ float fq = floor(uTime*max(u_fps, 1.0)); return (fq - 255.0*floor(fq/255.0) + 1.0)/255.0; }',
      /* ---- passada 0: cada pixel do bloco testa UM deslocamento ---- */
      'vec4 dmBusca(vec2 co){',
      '  float B = dmBloco();',
      '  vec2 bi = floor(co/B);',
      '  vec2 cel = floor(fract(co/B)*16.0);',
      '  vec2 d = (cel - 8.0)/8.0*dmAlcance();',
      '  float sad = 0.0;',
      '  for(int j = 0; j < 4; j++) for(int i = 0; i < 4; i++){',
      '    vec2 s = (bi + (vec2(float(i), float(j)) + 0.5)/4.0)*B;',
      '    vec3 a = texture(uOrig, clamp(s/uRes, 0.0, 1.0)).rgb;',
      '    vec3 b = texture(uFontePrev, clamp((s + d)/uRes, 0.0, 1.0)).rgb;',
      '    sad += dot(abs(a - b), vec3(0.3333));',
      '  }',
      '  sad /= 16.0;',
      /* o termo de taxa: em empate, o codificador prefere o vetor curto.
         Pequeno de propósito — com 0,02 um fundo em degradê, cuja SAD
         mal muda entre candidatos, ficava parado enquanto as bordas
         andavam (medido: o retângulo andou 8 px onde a cena andou 12) */
      '  float custo = sad + 0.006*length(cel - 8.0)/8.0;',
      '  return vec4(dmPack(custo), cel/15.0);',
      '}',
      /* ---- passadas 1 e 2: o menor custo do bloco, por linha e por coluna ---- */
      'vec4 dmReduz(vec2 co, bool horizontal){',
      '  float B = dmBloco();',
      '  vec2 bi = floor(co/B);',
      '  vec4 best = vec4(1.0, 1.0, 0.5333, 0.5333); float bc = 9.0;',
      '  for(int k = 0; k < 16; k++){',
      '    float f = (float(k) + 0.5)/16.0;',
      '    vec2 s = horizontal ? vec2((bi.x + f)*B, co.y) : vec2(co.x, (bi.y + f)*B);',
      '    vec4 t = dmTexel(s);',
      '    float c = dmUnpack(t.xy);',
      '    if(c < bc){ bc = c; best = t; }',
      '  }',
      '  return best;',
      '}',
      /* ---- o CAMPO: o vetor medido, editado como o ffglitch edita por
         script — só vertical, só horizontal, negado, ou somado a uma
         deriva, um zoom ou uma espiral. Em unidades de alcance.       */
      'vec2 dmCampo(vec2 d, vec2 uv){',
      '  float B = dmBloco();',
      '  float forca = u_edge*B*0.5/max(dmAlcance(), 1e-3);',
      '  if(u_campo < 0.5) return d;',
      '  if(u_campo < 1.5){ float a = radians(u_ang); return d - vec2(cos(a), sin(a))*forca; }',
      '  vec2 c = (uv - 0.5)*vec2(uAspect, 1.0);',
      /* zoom: a saída lê o anterior mais perto do centro — a imagem
         explode. Proporcional ao raio, como num zoom de verdade: com
         módulo constante o centro saía em ANÉIS concêntricos (visto);
         proporcional, sai em raias, que é o bloom das referências     */
      '  if(u_campo < 2.5) return d - c*forca*2.5;',
      '  if(u_campo < 3.5) return d - (c*0.6 + vec2(-c.y, c.x)*0.8)*forca*2.5;',
      '  if(u_campo < 4.5) return vec2(0.0, d.y);',
      '  if(u_campo < 5.5) return vec2(d.x, 0.0);',
      '  return -d;',
      '}',
      /* ---- passada 2 (a da MEMÓRIA): o campo do quadro, guardado ----
         R,G = vetor (−alcance..+alcance em 0..1) · B = SAD, ou o contador
         da repetição · A = o índice do quadro do codec                  */
      'vec4 dmCampoGuardado(vec2 co, vec2 uv){',
      '  vec4 old = texture(uMem, uv);',
      '  float idx = dmQuadro();',
      /* não é um quadro novo do codec: o campo (e o índice) ficam como estão */
      '  if(abs(idx - old.a) < 0.5/255.0) return old;',
      /* REPETIR o quadro-P: o campo guardado continua, e conta os quadros */
      '  if(u_congelar > 0.5 && old.a > 0.0) return vec4(old.xy, min(old.b + 1.0/255.0, 1.0), idx);',
      '  vec4 best = dmReduz(co, false);',
      '  float sad = dmUnpack(best.xy);',
      '  vec2 cel = floor(best.zw*15.0 + 0.5);',
      '  float casou = (sad <= u_tol) ? 1.0 : 0.0;',
      /* bloco que não casou não tem vetor que preste: o codec não manda
         movimento para um bloco que ele codificou inteiro              */
      '  vec2 d = (cel - 8.0)/8.0*casou;',
      '  d = dmCampo(d, uv);',
      /* o rastro: a média no tempo do ffglitch, o campo velho pesando */
      '  if(u_rastro > 0.001 && old.a > 0.0) d = mix(d, old.xy*2.0 - 1.0, u_rastro);',
      '  return vec4(clamp(d*0.5 + 0.5, 0.0, 1.0), sad, idx);',
      '}',
      'vec4 fxStep(vec2 uv){',
      '  vec2 co = uv*uRes;',
      '  if(uPass < 0.5) return dmBusca(co);',
      '  if(uPass < 1.5) return dmReduz(co, true);',
      '  return dmCampoGuardado(co, uv);',
      '}',
      /* ---- última passada: o decodificador ---- */
      'vec3 fxLast(vec2 uv){',
      '  float B = dmBloco();',
      '  vec2 co = uv*uRes;',
      '  vec2 bi = floor(co/B);',
      '  vec3 cur = texture(uOrig, uv).rgb;',
      '  vec4 campo = dmTexel(co);',
      '  vec4 prev0 = texture(uPrev, uv);',
      /* o quadro-chave: no início do clipe e, se pedido, a cada N segundos */
      '  bool chave = uLocal < 0.045;',
      '  if(u_gop > 0.01){ float f = uLocal - u_gop*floor(uLocal/u_gop); if(f < 0.045) chave = true; }',
      '  if(chave || prev0.a < 0.02) return cur;',
      /* entre dois quadros do codec a tela repete o que já mostrou: é o
         que faz o mosh andar a 24 e não a 60, e igual na exportação.
         O sinal de "quadro novo" é o campo ter mudado de índice em
         relação à MEMÓRIA VELHA (uMem ainda é a de antes desta passada):
         comparar com o relógio não serve, porque no segundo desenho do
         mesmo quadro o campo já traz o índice de agora. Medido: sem
         isto o mosh dava passo em 6 de 11 desenhos onde devia dar 4. */
      '  vec4 velho = texture(uMem, uv);',
      '  if(abs(campo.a - velho.a) < 0.5/255.0) return prev0.rgb;',
      '  bool repetindo = u_congelar > 0.5;',
      '  float sad = repetindo ? 0.0 : campo.b;',
      '  float casou = (sad <= u_tol) ? 1.0 : 0.0;',
      '  vec2 dpx = (campo.xy*2.0 - 1.0)*dmAlcance();',
      '  float tq = floor(uTime*max(u_rate, 0.5));',
      /* bagunça: o vetor do bloco perturbado, sorteio fixo no ritmo do codec */
      '  vec2 jit = (hash22(bi*1.3 + tq*7.7) - 0.5)*u_scatter*B*0.5;',
      /* a repetição acelera: cada quadro repetido puxa um pouco mais */
      '  float ganho = u_len*(repetindo ? 1.0 + u_acel*campo.b*255.0/24.0 : 1.0);',
      '  vec2 mv0 = dpx/uRes;',
      '  vec2 mv = (dpx*ganho + jit)/uRes;',
      '  vec4 prev = texture(uPrev, clamp(uv + mv, 0.0, 1.0));',
      '  if(prev.a < 0.02) return cur;',
      '  vec3 arrastado = prev.rgb;',
      /* a cor queima a cada geração: satura e escorrega um pouco de matiz.
         Era só matiz, a 0,02 por quadro — em 36 quadros de repetição a
         imagem inteira virou magenta (visto). O que as referências
         mostram é saturação estourando, não a roda de cor girando.   */
      '  if(u_chrom > 0.001){ vec3 h = rgb2hsv(arrastado); h.x = fract(h.x + u_chrom*0.002); h.y = min(h.y*(1.0 + u_chrom*0.012), 1.0); arrastado = hsv2rgb(h); }',
      /* repetindo o quadro-P não há resíduo novo: só o arrasto, de novo */
      '  if(repetindo) return clamp(arrastado, 0.0, 1.0);',
      /* o resíduo que o codec mandaria: o novo menos a previsão DELE.
         A fonte de ontem vive em MEIA resolução; comparar o quadro
         inteiro com ela dava um resíduo de nitidez (novo − borrado)
         que se somava a cada quadro mesmo com a cena parada — a borda
         queimava em um segundo (medido: +1 px por quadro na borda de um
         retângulo parado). Então o novo é lido no CENTRO do texel de
         meia resolução: o filtro linear devolve a média do 2×2, a mesma
         que o anel guardou, e resíduo de cena parada é zero.        */
      '  vec2 uvh = (floor(co*0.5) + 0.5)*2.0/uRes;',
      '  vec3 res = texture(uOrig, uvh).rgb - texture(uFontePrev, clamp(uvh + mv0, 0.0, 1.0)).rgb;',
      /* quantização de DCT: só o grosso do sub-bloco de 8 sobrevive — a
         média de cinco pontos dele. E a cor em 4:2:0: a crominância do
         resíduo é SEMPRE a do bloco — são os retalhos de cor do mosh   */
      '  float S = B*0.5;',
      '  vec2 sb = (floor(co/S) + 0.5)*S;',
      '  vec3 acc = vec3(0.0);',
      '  for(int i = 0; i < 5; i++){',
      '    vec2 o = (i == 0) ? vec2(0.0) : vec2((i == 1 || i == 3) ? -0.25 : 0.25, (i < 3) ? -0.25 : 0.25)*S;',
      '    vec2 su = clamp((floor((sb + o)*0.5) + 0.5)*2.0/uRes, 0.0, 1.0);',
      '    acc += texture(uOrig, su).rgb - texture(uFontePrev, clamp(su + mv0, 0.0, 1.0)).rgb;',
      '  }',
      '  vec3 resBloco = acc/5.0;',
      '  if(u_croma > 0.5){',
      '    float yF = luma(res), yB = luma(resBloco);',
      '    res = vec3(mix(yF, yB, u_quant)) + (resBloco - yB);',
      '  } else {',
      '    res = mix(res, resBloco, u_quant);',
      '  }',
      /* blocos travados: uma parte dos macroblocos nunca recebe resíduo */
      '  float travado = step(hash21(bi*2.1 + tq*3.3), u_amt);',
      /* O CORTE. Um bloco cujo movimento não explica o que chegou (SAD
         acima da tolerância) é um bloco cujo dado o codec NÃO tem: no
         datamosh clássico o quadro-chave foi removido, e o que falta é
         exatamente isto. O resíduo desse bloco é jogado fora — a imagem
         velha continua — ou, na medida de INTRA, o bloco novo entra
         inteiro, como um codificador faria com um bloco intra.
         (Sem esta regra não há mosh nenhum: com o resíduo aplicado por
         inteiro, saída = arrastado + novo − arrastado = novo, exato,
         em qualquer corte. Foi medido.)                                */
      '  float w = (1.0 - clamp(u_decay, 0.0, 1.0))*(1.0 - travado)*casou;',
      '  vec3 saida = arrastado + res*w;',
      '  if(casou < 0.5) saida = mix(arrastado, cur, u_intra*(1.0 - travado));',
      '  return clamp(saida, 0.0, 1.0);',
      '}'
    ].join('\n')
  });

  /* ================= ESTILOS PRONTOS ================= */
  VE.STYLES.push(
    {
      id: 'crtmonitor', name: 'Monitor CRT', desc: 'os padrões de fábrica da referência: pontos delta, bloom em tela',
      fx: [['crt', { tipo: 0, colunas: 377, ponto: 0.93, suave: 0.12, bright: 1, gama: 2.2, conv: 0.55, bloom: 0.45, bloomLim: 0.36, bloomR: 3.8 }]]
    },
    {
      id: 'crttv', name: 'TV de tubo', desc: 'máscara de fenda, linhas de varredura, vidro curvo',
      fx: [['crt', { tipo: 1, colunas: 260, ponto: 1.0, suave: 0.2, bright: 0.9, gama: 2.0, conv: 1.2, convAng: 0, scan: 0.35, linhas: 480, curve: 0.9, bloom: 0.6, bloomR: 5, vig: 0.55, flick: 0.08 }]]
    },
    {
      id: 'crtverde', name: 'Terminal verde', desc: 'fósforo P1, pontos grandes e halo — o monitor de fósforo verde',
      fx: [['crt', { tipo: 0, fosforo: 1, colunas: 220, ponto: 1.0, suave: 0.3, bright: 1.2, gama: 2.2, conv: 0, glow: 0.4, glowR: 0.5, bloom: 1.2, bloomLim: 0.25, bloomR: 8, scan: 0.2, linhas: 300, vig: 0.5 }]]
    },
    {
      id: 'crtazul', name: 'Tubo azul', desc: 'fósforo azul com listras de fenda e muito bloom',
      fx: [['crt', { tipo: 1, fosforo: 4, colunas: 300, ponto: 1.1, suave: 0.25, bright: 1.1, gama: 2.2, conv: 0, bloom: 1.6, bloomLim: 0.2, bloomR: 10, bloomModo: 2, scan: 0.45, linhas: 400, curve: 0.5, vig: 0.5 }]]
    },
    {
      id: 'lcdgrade', name: 'LCD de perto', desc: 'as três listras de cada pixel, como a lupa mostra',
      fx: [['crt', { tipo: 2, colunas: 160, ponto: 1.0, suave: 0.08, bright: 1, gama: 2.0, conv: 0, glow: 0, bloom: 0.2, bloomR: 2, curve: 0, vig: 0 }]]
    },
    {
      id: 'moshclassico', name: 'Datamosh clássico', desc: 'quadro-chave removido: a imagem velha viaja com o movimento novo',
      fx: [['datamosh', { block: 16, fps: 24, busca: 1, len: 1, decay: 0, quant: 0.7, tol: 0.16, intra: 0, amt: 0.1, scatter: 0, chrom: 0, gop: 0, campo: 0, edge: 0 }]]
    },
    {
      id: 'moshbloom', name: 'Datamosh derretendo', desc: 'movimento amplificado e resíduo segurado: o vídeo escorre',
      fx: [['datamosh', { block: 16, fps: 24, busca: 1.5, len: 2.2, decay: 0.7, quant: 0.9, intra: 0.15, amt: 0.4, rate: 3, scatter: 0.3, chrom: 0.5, campo: 0 }]]
    },
    {
      id: 'moshbloom2', name: 'Datamosh explodindo', desc: 'o quadro-P repetido com um zoom no campo: a imagem escorre do centro para fora, acelerando',
      fx: [['datamosh', { block: 12, fps: 24, len: 1.0, congelar: 1, acel: 0.5, campo: 2, edge: 0.22, rastro: 0.3, chrom: 0.15 }]]
    },
    {
      id: 'moshafunda', name: 'Datamosh afundando', desc: 'só o movimento vertical, com rastro — o sink and rise do ffglitch',
      fx: [['datamosh', { block: 16, fps: 24, len: 1.8, decay: 0.6, campo: 4, rastro: 0.6, quant: 0.8, amt: 0.3, chrom: 0.4 }]]
    }
  );

})(window.VE);
