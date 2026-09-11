/* ============================================================
   rgb_lab — efeitos parte 12: TRICÔ
   ------------------------------------------------------------
   O vídeo virando malha: cada célula da grade olha para um pedaço
   da imagem e decide, sozinha, que PONTO de tecido desenhar ali —
   quadrado, redondo, cruz, ponto-cruz ou o próprio tricô (duas
   fileiras de "V" entrelaçadas). Não é pixelização: entre um ponto
   e outro pode não haver NADA — é aí que mora o alfa real.

   O efeito devolve vec4 (alpha:true). Fora do ponto, o FUNDO decide
   o que fica: o vídeo original, uma cor sólida, ou TRANSPARENTE de
   verdade — é essa terceira opção que faz o resultado servir de
   camada de composição, e não de filtro que sempre tampa tudo.

   Isolar o SUJEITO (tirar a cena inteira, não só os vãos entre os
   pontos) não é trabalho deste arquivo: é a máscara de camada tipo
   CANETA que já existe, com o botão MARCAR OBJETO (I.A.) de
   `js/marcar.js`. Aqui só se desenha o tecido; quem decide onde ele
   existe na cena é a máscara, como em qualquer outro efeito.

   Os FIAPOS são a parte que tira o desenho do lugar de esquema: fios de
   microfibra que escapam de cada ponto e ficam boiando no vão, finos,
   tortos e de comprimento sorteado. Malha limpa demais entrega na hora
   que é grade; o fiapo é o que faz parecer tecido fotografado. Vêm
   desligados — custam caro na GPU, e a conta está anotada lá embaixo.

   A SIMETRIA dobra o próprio lugar de onde a grade e a cor são lidas
   — por isso o padrão espelhado usa pedaços espelhados da imagem, e
   não só a forma da malha.

   Nada aqui depende do quadro anterior: toda variação "orgânica" sai
   de um hash por CÉLULA (estável, não treme) e a ANIMAÇÃO é função
   contínua de `uTime` (desliza, não pisca).
   ============================================================ */
(function (VE) {
  'use strict';

  var D = VE.def;
  var PIX = '#2ee6a8';

  D({
    id: 'trico', name: 'Tricô', cat: 'pixel', color: PIX, alpha: true,
    desc: 'malha generativa com alfa real — pontos de tecido no lugar dos pixels, fiapos de microfibra saindo deles, e vão transparente de verdade para compor sobre outras camadas',
    params: [
      /* ---- GRADE ---- */
      { k: 'size', label: 'Tamanho da célula (px)', min: 3, max: 64, step: 1, def: 14 },
      { k: 'rot', label: 'Girar a grade (°)', min: 0, max: 90, step: 1, def: 0 },
      { k: 'layout', label: 'Disposição', t: 's', opts: ['Embutida', 'Separada'], def: 1 },
      { k: 'gap', label: 'Vão entre pontos', min: 0, max: 0.6, def: 0.16 },

      /* ---- MATÉRIA ---- */
      { k: 'shape', label: 'Ponto', t: 's', opts: ['Quadrado', 'Redondo', 'Losango', 'Cruz', 'Linha', 'Tricô', 'Ponto-cruz', 'Orgânico'], def: 5 },
      { k: 'thick', label: 'Espessura do fio', min: 0.1, max: 1, def: 0.55 },
      { k: 'organic', label: 'Organicidade', min: 0, max: 1, def: 0.25 },
      { k: 'contour', label: 'Sensibilidade de contorno', min: 0, max: 1, def: 0.4 },
      { k: 'seed', label: 'Semente', min: 0, max: 999, step: 1, def: 7 },

      /* ---- COR ---- */
      { k: 'colorMode', label: 'Modo de cor', t: 's', opts: ['Cor cheia', 'Paleta reduzida', 'Monocromo', 'Duotom'], def: 0 },
      { k: 'levels', label: 'Níveis de cor', min: 2, max: 32, step: 1, def: 8 },
      { k: 'tintA', t: 'c', label: 'Cor A (mono/duotom)', def: '#12111a' },
      { k: 'tintB', t: 'c', label: 'Cor B (duotom)', def: '#ff5fae' },

      /* ---- SIMETRIA ---- */
      { k: 'sym', label: 'Simetria', t: 's', opts: ['Nenhuma', 'Espelho H', 'Espelho V', 'Quatro lados', 'Caleidoscópio'], def: 0 },
      { k: 'symN', label: 'Repetições do caleidoscópio', min: 3, max: 16, step: 1, def: 8 },

      /* ---- ANIMAÇÃO ---- */
      { k: 'anim', label: 'Animação', t: 's', opts: ['Estática', 'Fluxo', 'Pulso', 'Onda', 'Deriva'], def: 0 },
      { k: 'speed', label: 'Velocidade', min: 0, max: 3, def: 0.6 },
      { k: 'animAmt', label: 'Quantidade', min: 0, max: 1, def: 0.4 },

      /* ---- FIAPOS (microfibras soltas) ---- */
      { k: 'fuzz', label: 'Fiapos', min: 0, max: 1, def: 0 },
      { k: 'fuzzLen', label: 'Comprimento do fiapo', min: 0, max: 1, def: 0.4 },
      { k: 'fuzzFine', label: 'Finura do fiapo', min: 0, max: 1, def: 0.55 },
      { k: 'fuzzCurl', label: 'Frisado do fiapo', min: 0, max: 1, def: 0.35 },
      { k: 'fuzzLight', label: 'Clarear o fiapo', min: -1, max: 1, def: 0.25 },

      /* ---- FUNDO ---- */
      { k: 'bgMode', label: 'Fundo', t: 's', opts: ['Original', 'Cor sólida', 'Transparente'], def: 0 },
      { k: 'bgColor', t: 'c', label: 'Cor do fundo', def: '#0b0b10' }
    ],
    glsl: [
      /* dobra o lugar de leitura — a simetria vale para a grade E para
         a cor amostrada, senão o padrão fica simétrico mas a imagem
         por trás não, e a costura da dobra aparece na hora            */
      'vec2 trSym(vec2 uv){',
      '  float m = floor(u_sym + 0.5);',
      '  vec2 p = uv - 0.5;',
      '  if(m < 0.5) return uv;',
      '  if(m < 1.5){ p.x = abs(p.x); return p + 0.5; }',
      '  if(m < 2.5){ p.y = abs(p.y); return p + 0.5; }',
      '  if(m < 3.5){ p = abs(p); return p + 0.5; }',
      '  float ang = atan(p.y, p.x);',
      '  float rad = length(p);',
      '  float n = max(u_symN, 2.0);',
      '  float setor = 2.0*PI/n;',
      '  ang = mod(ang, setor);',
      '  ang = abs(ang - setor*0.5);',
      '  return vec2(cos(ang), sin(ang))*rad + 0.5;',
      '}',
      /* a forma de UM ponto, em coordenada de célula (-0.5..0.5) já
         girada/deslocada pela organicidade. `s` é o alcance do ponto,
         `elong` só é usado pelo tricô (proporção do "V" da malha).   */
      'float trPonto(vec2 q, float s, float elong, vec2 jit){',
      '  float m = floor(u_shape + 0.5);',
      '  vec2 aq = abs(q);',
      '  if(m < 0.5) return step(max(aq.x, aq.y), s);',
      '  if(m < 1.5) return step(length(q), s);',
      '  if(m < 2.5) return step(aq.x + aq.y, s*1.35);',
      '  if(m < 3.5) return step(min(aq.x, aq.y), s*0.4);',
      '  if(m < 4.5) return step(aq.y, s*0.42);',
      '  if(m < 5.5){',
      '    float d1 = abs(q.y - q.x*elong);',
      '    float d2 = abs(q.y + q.x*elong);',
      '    float band = s*0.55, lim = s*1.15;',
      '    float v1 = step(d1, band)*step(aq.x, lim);',
      '    float v2 = step(d2, band)*step(aq.x, lim);',
      '    return max(v1, v2);',
      '  }',
      '  if(m < 6.5){',
      '    float d1 = abs(q.y - q.x), d2 = abs(q.y + q.x);',
      '    float band = s*0.32, lim = s*1.05;',
      '    return max(step(d1, band), step(d2, band))*step(max(aq.x, aq.y), lim);',
      '  }',
      '  float n = vnoise(q*3.0 + jit*7.0);',
      '  float rr = s*(0.75 + 0.5*n);',
      '  return 1.0 - smoothstep(max(rr - 0.03, 0.0), rr + 0.03, length(q));',
      '}',
      /* o modo de cor virou função porque agora existem DUAS coisas para
         pintar: o ponto e o fiapo. Se cada uma fizesse a sua conta, o
         fiapo sairia com cor cheia num tecido monocromático.            */
      'vec3 trCor(vec3 c){',
      '  float cm = floor(u_colorMode + 0.5);',
      '  if(cm > 0.5 && cm < 1.5){ float lv = max(u_levels, 2.0); return floor(c*lv + 0.5)/lv; }',
      '  if(cm > 1.5 && cm < 2.5) return mix(vec3(0.0), u_tintA, luma(c));',
      '  if(cm > 2.5) return mix(u_tintA, u_tintB, luma(c));',
      '  return c;',
      '}',
      /* onde está o CENTRO do ponto de uma célula qualquer — a mesma conta
         que fx4 faz para a célula do fragmento, agora aberta para poder
         valer também para as vizinhas. Sem isso, o fiapo nasce no meio da
         célula enquanto o ponto está deslocado pela organicidade, e a
         microfibra aparece descolada da malha.                          */
      /* `org` vem do fragmento atual, não da célula vizinha: o valor exato
         dependeria do gradiente da imagem naquela célula, e isso custaria
         oito leituras de textura por vizinha. Medido: a distância média do
         fiapo ao ponto não muda (1,75px), só uns poucos pixels soltos na
         animação ONDA com organicidade alta. Não vale a conta.          */
      'vec2 trCentro(vec2 cn, float org, float animT){',
      '  vec2 hn = hash22(cn + vec2(u_seed*13.1 + 1.0, u_seed*7.7 + 5.0));',
      '  vec2 dr = vec2(0.0);',
      '  if(animT > 3.5) dr = vec2(sin(uTime*u_speed*0.6 + hn.x*6.28318), cos(uTime*u_speed*0.5 + hn.y*6.28318))*0.12*u_animAmt;',
      '  vec2 ct = (hn - 0.5)*org*0.55 + dr*org;',
      '  if(animT > 2.5 && animT < 3.5){',
      '    vec2 h2n = hash22(cn + vec2(u_seed*3.3 + 11.0, u_seed*2.1 + 5.0));',
      '    float rj = (h2n.x - 0.5)*org*1.4;',
      '    ct -= rot2(vec2(sin(uTime*u_speed*1.3 + cn.y*0.7), cos(uTime*u_speed*1.1 + cn.x*0.7))*0.18*u_animAmt, -rj);',
      '  }',
      '  return ct;',
      '}',
      /* ---------------------------------------------------- FIAPOS ------
         Microfibras soltas: os fios que escapam do ponto e ficam boiando
         no vão. É o que separa malha DESENHADA de malha FOTOGRAFADA — a
         grade limpa demais entrega o truque na hora.

         Cada ponto emite fios num leque de setores em volta. Para o
         fragmento atual: descubro em que setor ele está e testo só esse
         e os dois vizinhos (o fio friza, então pode ter vindo do lado).
         O fio é um raio que sai da borda do ponto, entorta conforme
         anda, afina para a ponta e some antes de terminar.

         A varredura é 3x3 porque o fiapo mais longo que existe aqui
         (0,85 de célula) somado ao alcance do ponto ainda é menor que a
         distância até a célula seguinte: nenhum fio de duas casas de
         distância consegue chegar neste pixel.

         CUSTO, medido em 1080p nesta máquina (mediana de 5 medidas, os
         dois shaders no mesmo teste): sem fiapo 6,2ms · fiapo 0,5 15,1ms
         · fiapo no talo com comprimento 1 28,9ms. O efeito nasce com
         fiapo ZERO justamente por isso — quem não pediu não paga. O que
         sobra para quem não usa é 0,7ms de pressão de registrador
         (5,5ms sem este código, 6,2ms com ele em zero).                */
      'float trFiapo(vec2 q, float s, vec2 cell, float org, float animT, float S, out vec2 cellOut){',
      '  cellOut = cell;',
      '  float L = 0.08 + u_fuzzLen*0.77;',
      '  float r0 = max(s*0.55, 0.02);',
      '  float px = 1.0/max(S, 3.0);',
      /* Fio mais fino que um pixel não pode simplesmente encolher: ele
         cintila, ou some. Então a largura para de diminuir em meio pixel
         e o que continua caindo é a OPACIDADE — é assim que a microfibra
         fica fina de verdade em vez de virar risco tremido. Sem isso o
         controle de finura mexia no número e não na imagem: medi, e a
         cobertura ia de 0,1393 para 0,1364 de uma ponta à outra.       */
      '  float wAlvo = mix(0.055, 0.004, u_fuzzFine);',
      '  float wMin = px*0.5;',
      '  float ganho = clamp(wAlvo/wMin, 0.22, 1.0);',
      '  float halfW = max(wAlvo, wMin);',
      '  float aa = px*0.55;',
      '  float dens = floor(6.0 + u_fuzz*26.0);',
      '  float sw = (2.0*PI)/dens;',
      '  float best = 0.0;',
      /* alcance com folga para o deslocamento do ponto (a organicidade
         empurra o centro até ~0,3 de célula). Serve para jogar fora a
         célula vizinha ANTES de gastar hash calculando onde está o ponto
         dela — era esse o custo: 22ms em 1080p, quase tudo em vizinha que
         nem chegava perto deste pixel.                                  */
      '  float alcance = r0 + L + 0.32;',
      '  float alc2 = alcance*alcance;',
      '  for(int j=-1;j<=1;j++){',
      '    for(int i=-1;i<=1;i++){',
      '      vec2 off = vec2(float(i), float(j));',
      '      vec2 pd = q - off;',
      '      if(dot(pd, pd) > alc2) continue;',
      '      vec2 cn = cell + off;',
      '      vec2 p = pd - trCentro(cn, org, animT);',
      '      float r = length(p);',
      '      if(r < r0*0.45 || r > r0 + L) continue;',
      '      float ang = atan(p.y, p.x);',
      '      float k0 = floor(ang/sw);',
      '      for(int k=-1;k<=1;k++){',
      '        float fi = k0 + float(k);',
      '        vec2 e = hash22(cn*4.3 + fi*vec2(17.3, 29.7) + u_seed*2.9);',
      /* nem todo setor tem fio: é isso que faz o fiapo ser esparso e não franja */
      '        if(e.x > 0.18 + u_fuzz*0.82) continue;',
      /* terceiro sorteio tirado dos dois primeiros em vez de outro hash:
         o fio não precisa de independência estatística, precisa de não
         repetir o vizinho — e um hash a menos por setor é 1/3 do laço  */
      '        float e3 = fract((e.x + 0.37)*(e.y + 0.61)*43.7581);',
      '        float Lk = L*(0.3 + 0.7*e.y*e.y);',
      '        float t = (r - r0)/max(Lk, 1e-4);',
      '        if(t > 1.0) continue;',
      '        float base = (fi + 0.15 + 0.7*e3)*sw;',
      '        float bal = 0.0;',
      '        if(animT > 0.5) bal = sin(uTime*u_speed*1.9 + e.x*6.28318 + t*2.2)*0.5*u_animAmt;',
      /* o entortamento é medido em SETORES: assim ele nunca passa do que a
         varredura de três setores consegue enxergar, e o fio não some     */
      '        float curl = (e3 - 0.5)*2.0*u_fuzzCurl + bal;',
      '        float bend = sw*(curl*t*0.75 + sin(t*4.2 + e.x*6.28318)*u_fuzzCurl*t*0.25);',
      '        float d = mod(ang - base - bend + PI, 2.0*PI) - PI;',
      '        float w = halfW*(1.0 - t*0.8);',
      '        float m = (1.0 - smoothstep(max(w - aa, 0.0), w + aa, abs(d)*r))*ganho;',
      '        m *= 1.0 - smoothstep(0.6, 1.0, t);',
      '        m *= smoothstep(r0*0.5, r0, r);',
      '        if(m > best){ best = m; cellOut = cn; }',
      '      }',
      '    }',
      '  }',
      '  return clamp(best, 0.0, 1.0);',
      '}',
      'vec4 fx4(vec2 uv){',
      '  vec2 suv = trSym(uv);',
      '  float S = max(3.0, u_size);',
      '  vec2 g = uRes/S;',
      '  float radG = u_rot*PI/180.0;',
      '  float animT = floor(u_anim + 0.5);',
      '  vec2 flowOff = vec2(0.0);',
      '  if(animT > 0.5 && animT < 1.5) flowOff = vec2(uTime*u_speed*0.15, uTime*u_speed*0.09)*u_animAmt;',
      '  vec2 r = rot2(suv - 0.5, radG) + 0.5 + flowOff;',
      '  vec2 gp = r*g;',
      '  vec2 cell = floor(gp);',
      '  vec2 q = fract(gp) - 0.5;',
      '  vec2 cuv = rot2((cell + 0.5)/g - flowOff - 0.5, -radG) + 0.5;',
      '  vec3 c = box3(cuv, S*0.4);',
      '  float ed = length(gradient(cuv, S*0.5));',
      '  float edge = clamp(ed*u_contour*3.0, 0.0, 1.0);',
      '  vec2 h  = hash22(cell + vec2(u_seed*13.1 + 1.0, u_seed*7.7 + 5.0));',
      '  vec2 h2 = hash22(cell + vec2(u_seed*3.3 + 11.0, u_seed*2.1 + 5.0));',
      '  vec2 driftOff = vec2(0.0);',
      '  if(animT > 3.5) driftOff = vec2(sin(uTime*u_speed*0.6 + h.x*6.28318), cos(uTime*u_speed*0.5 + h.y*6.28318))*0.12*u_animAmt;',
      '  float org = u_organic*(1.0 - edge*0.7);',
      '  vec2 jit = (h - 0.5)*org*0.55 + driftOff*org;',
      '  float rotJit = (h2.x - 0.5)*org*1.4;',
      '  vec2 qs = rot2(q - jit, rotJit);',
      '  if(animT > 2.5 && animT < 3.5) qs += vec2(sin(uTime*u_speed*1.3 + cell.y*0.7), cos(uTime*u_speed*1.1 + cell.x*0.7))*0.18*u_animAmt;',
      '  float thick = u_thick;',
      '  if(animT > 1.5 && animT < 2.5) thick *= 1.0 + sin(uTime*u_speed*2.0 + hash21(cell)*6.28318)*0.35*u_animAmt;',
      '  float layoutIdx = floor(u_layout + 0.5);',
      '  float gapEff = mix(u_gap*0.2, u_gap, layoutIdx);',
      '  float s = clamp(thick*0.5 - gapEff*0.5 + edge*0.12, 0.02, 0.49)*(0.65 + 0.5*h2.y*org);',
      '  float elong = 1.4 + h2.x*org*1.2;',
      '  float on = trPonto(qs, s, elong, jit);',
      '  vec3 outc = trCor(c);',
      '  float bgm = floor(u_bgMode + 0.5);',
      '  vec3 bgc; float bga;',
      '  if(bgm < 0.5){ bgc = srccol(suv); bga = 1.0; }',
      '  else if(bgm < 1.5){ bgc = u_bgColor; bga = 1.0; }',
      '  else { bgc = u_bgColor; bga = 0.0; }',
      '  vec3 rgbOut = bgc;',
      '  float aOut = bga;',
      /* o fiapo entra ANTES do ponto: ele sai de baixo da malha, como fio
         solto de verdade. E carrega a cor da célula que o soltou — não a
         do pixel onde ele foi parar, senão o fio troca de cor no meio.
         A busca da cor fica fora do `if` do fiapo de propósito: dentro,
         seria leitura de textura em fluxo divergente.                   */
      '  if(u_fuzz > 0.001){',
      '    vec2 fcell = cell;',
      '    float fm = trFiapo(q, s, cell, org, animT, S, fcell);',
      '    vec2 fuv = rot2((fcell + 0.5)/g - flowOff - 0.5, -radG) + 0.5;',
      '    vec3 fcol = trCor(srccol(fuv));',
      '    fcol = clamp(mix(fcol, vec3(step(0.0, u_fuzzLight)), abs(u_fuzzLight)*0.6), 0.0, 1.0);',
      '    rgbOut = mix(rgbOut, fcol, fm);',
      '    aOut = mix(aOut, 1.0, fm);',
      '  }',
      '  rgbOut = mix(rgbOut, outc, on);',
      '  aOut = mix(aOut, 1.0, on);',
      '  return vec4(clamp(rgbOut, 0.0, 1.0), clamp(aOut, 0.0, 1.0));',
      '}'
    ].join('\n')
  });

})(window.VE);
