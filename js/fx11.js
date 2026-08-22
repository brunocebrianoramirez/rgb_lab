/* ============================================================
   rgb_lab — efeitos parte 11: VIDRO e RADIOGRAFIA
   ------------------------------------------------------------
   Três instrumentos que faltavam, e que têm em comum o fato de a
   imagem passar POR ALGUMA COISA em vez de ser tratada:

     vidro          canelado, martelado, chuva, bolha — a imagem vista
                    através de um relevo transparente
     vidrochanfro   painel chanfrado: bisel nas bordas, com a opção de
                    o vidro ficar embaçado ou continuar limpo
     raiox          radiografia: o claro atravessa, o denso barra, e o
                    contorno acende

   A física de todos é a mesma e cabe em três linhas: o vidro tem uma
   ALTURA que varia pela superfície; a NORMAL dessa altura desvia o raio
   que atravessa; e o desvio cresce com a ESPESSURA do vidro. Por isso o
   controle chama espessura e não "quantidade" — ele é a coisa.

   A altura sai de uma função de superfície; a normal sai da derivada
   dela, calculada por diferença finita no próprio shader. Uma superfície
   nova é uma linha a mais em `altura()`.
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  /* ===================== VIDRO ===================== */

  D({
    id: 'vidro', name: 'VIDRO', cat: 'distorcao', color: '#7c5cff',
    desc: 'a imagem vista através de um vidro com relevo — canelado, martelado, chuva',
    params: [
      {
        k: 'tipo', t: 's', label: 'Tipo de vidro', def: 0,
        opts: ['CANELADO (ripado)', 'CANELADO ONDULADO', 'MARTELADO', 'BOLHA',
          'CHUVA', 'GELO', 'TECIDO', 'ÁGUA PARADA']
      },
      { k: 'esp', label: 'Espessura do vidro', min: 0, max: 3, def: 1 },
      { k: 'passo', label: 'Largura da cana', min: 2, max: 160, step: 0.5, def: 26 },
      { k: 'ang', label: 'Direção', min: -180, max: 180, step: 1, def: 0 },
      { k: 'irreg', label: 'Irregularidade', min: 0, max: 1, def: 0.18 },
      /* o vidro fosco borra o que está atrás; é isso que separa um vidro
         de banheiro de uma janela suja. Custa amostras, então tem chave */
      { k: 'fosco', label: 'Fosco (borra o fundo)', min: 0, max: 1, def: 0 },
      { k: 'brilho', label: 'Brilho da quina', min: 0, max: 2, def: 0.55 },
      { k: 'brilhoCor', t: 'c', label: 'Cor do brilho', def: '#ffffff' },
      { k: 'sombra', label: 'Sombra da quina', min: 0, max: 1, def: 0.25 },
      { k: 'crom', label: 'Dispersão de cor', min: 0, max: 1, def: 0.12 },
      { k: 'sujo', label: 'Sujeira no vidro', min: 0, max: 1, def: 0 },
      { k: 'anim', label: 'Movimento', min: 0, max: 2, def: 0 }
    ],
    glsl: [
      /* ---------- a superfície ----------
         Devolve a ALTURA do vidro em `p` (já girado e em unidades de
         cana). Tudo o mais é derivada disto.                        */
      'float altura(vec2 p, float tipo, float irreg, float tm){',
      '  if(tipo < 0.5){',                       /* canelado reto */
      '    float f = fract(p.x);',
      '    return 1.0 - abs(f*2.0 - 1.0);',
      '  }',
      '  if(tipo < 1.5){',                       /* canelado ondulado */
      '    float w = p.x + sin(p.y*1.7 + tm)*0.22*(0.4 + irreg);',
      '    return 0.5 + 0.5*cos(w*6.28318530718);',
      '  }',
      '  if(tipo < 2.5){',                       /* martelado */
      '    vec2 c = floor(p) + 0.5;',
      '    float d = 9.0;',
      '    for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){',
      '      vec2 g = c + vec2(float(i), float(j));',
      '      vec2 o = (hash22(g) - 0.5)*irreg*1.6;',
      '      d = min(d, length(p - g - o));',
      '    }',
      '    return 1.0 - clamp(d, 0.0, 1.0);',
      '  }',
      '  if(tipo < 3.5){',                       /* bolha */
      '    vec2 c = floor(p) + 0.5 + (hash22(floor(p)) - 0.5)*irreg;',
      '    float d = length(p - c)*1.9;',
      '    return sqrt(max(1.0 - d*d, 0.0));',
      '  }',
      '  if(tipo < 4.5){',                       /* chuva: gotas que escorrem */
      '    vec2 q = vec2(p.x, p.y - tm*0.6);',
      '    vec2 c = floor(q) + 0.5;',
      '    float a = 0.0;',
      '    for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){',
      '      vec2 g = c + vec2(float(i), float(j));',
      '      vec2 o = (hash22(g) - 0.5)*1.2;',
      '      float r = 0.18 + hash21(g+3.1)*0.32;',
      '      vec2 dd = q - g - o;',
      '      dd.y *= 0.55 + hash21(g+7.7)*0.9;',   /* gota alongada */
      '      a = max(a, smoothstep(r, r*0.25, length(dd)));',
      '    }',
      '    return a;',
      '  }',
      '  if(tipo < 5.5){',                       /* gelo: fbm com quinas */
      '    float n = fbm(p*0.9 + tm*0.07);',
      '    return abs(n - 0.5)*2.0;',
      '  }',
      '  if(tipo < 6.5){',                       /* tecido: dois canelados cruzados */
      '    float a = 0.5 + 0.5*cos(p.x*6.28318530718);',
      '    float b = 0.5 + 0.5*cos(p.y*6.28318530718);',
      '    return max(a, b)*0.75 + a*b*0.25;',
      '  }',
      /* água parada: ondas largas somadas */
      '  float w1 = sin(p.x*2.1 + tm*1.1)*0.5;',
      '  float w2 = sin(p.y*1.7 - tm*0.8)*0.5;',
      '  float w3 = sin((p.x+p.y)*1.3 + tm*0.6)*0.35;',
      '  return 0.5 + (w1 + w2 + w3)*0.33;',
      '}',
      'vec3 fx(vec2 uv){',
      '  float tm = uTime*u_anim;',
      '  float passo = max(u_passo, 2.0);',
      '  vec2 px = uv*uRes;',
      '  vec2 g = rot2(px, radians(u_ang))/passo;',
      /* --------- normal por diferença finita ---------
         O passo da diferença é em unidades de cana, então ele acompanha
         a largura: uma cana fina não precisa de amostra grossa.     */
      '  float e = 0.06;',
      '  float h0 = altura(g, u_tipo, u_irreg, tm);',
      '  float hx = altura(g + vec2(e, 0.0), u_tipo, u_irreg, tm);',
      '  float hy = altura(g + vec2(0.0, e), u_tipo, u_irreg, tm);',
      '  vec2 n = vec2(hx - h0, hy - h0)/e;',
      /* o desvio volta ao espaço da tela e cresce com a espessura */
      '  vec2 desv = rot2(n, -radians(u_ang)) * u_esp * passo * 0.06 / uRes;',
      /* --------- ler o fundo, com dispersão de cor ---------
         Vidro de verdade separa as cores nas quinas: o vermelho desvia
         menos que o azul. É o que impede o efeito de parecer só um
         borrão com relevo.                                          */
      '  vec3 col;',
      '  if(u_crom > 0.002){',
      '    float k = u_crom;',
      '    col.r = srccol(uv + desv*(1.0 - k*0.5)).r;',
      '    col.g = srccol(uv + desv).g;',
      '    col.b = srccol(uv + desv*(1.0 + k*0.5)).b;',
      '  } else col = srccol(uv + desv);',
      /* --------- fosco: média em volta, só se pedido --------- */
      '  if(u_fosco > 0.004){',
      '    vec2 t = texel()*(2.0 + u_fosco*14.0);',
      '    vec3 s = vec3(0.0);',
      '    for(int j=-2;j<=2;j++){',
      '      for(int i=-2;i<=2;i++){',
      '        vec2 o = vec2(float(i), float(j))*t;',
      /* o embaçado do vidro fosco segue o relevo, não é gaussiana reta */
      '        s += srccol(uv + desv + o + n.yx*t*0.6);',
      '      }',
      '    }',
      '    col = mix(col, s/25.0, clamp(u_fosco, 0.0, 1.0));',
      '  }',
      /* --------- quina: onde a superfície vira, entra luz --------- */
      '  float decl = clamp(length(n)*0.5, 0.0, 1.0);',
      '  float face = clamp(n.x*0.7 + n.y*0.7, -1.0, 1.0);',
      '  col += u_brilhoCor * u_brilho * pow(max(decl, 1e-6), 1.6) * max(face, 0.0);',
      '  col *= 1.0 - u_sombra*pow(max(decl, 1e-6), 1.6)*max(-face, 0.0);',
      /* --------- sujeira: poeira presa no vidro --------- */
      '  if(u_sujo > 0.004){',
      '    float d = fbm(uv*uRes.y*0.02 + 11.3);',
      '    float p2 = smoothstep(0.62, 0.9, d);',
      '    col = mix(col, col*0.86 + 0.1, p2*u_sujo);',
      '  }',
      '  return col;',
      '}'
    ].join('\n')
  });

  /* ===================== VIDRO CHANFRADO ===================== */

  D({
    id: 'vidrochanfro', name: 'VIDRO CHANFRADO', cat: 'distorcao', color: '#7c5cff',
    desc: 'painéis de vidro com bisel na borda — com ou sem embaçado',
    params: [
      { k: 'cols', label: 'Painéis na horizontal', min: 1, max: 24, step: 1, def: 4 },
      { k: 'rows', label: 'Painéis na vertical', min: 1, max: 24, step: 1, def: 3 },
      { k: 'chanfro', label: 'Largura do chanfro', min: 0.01, max: 0.5, def: 0.16 },
      { k: 'esp', label: 'Espessura do vidro', min: 0, max: 3, def: 1 },
      { k: 'ang', label: 'Direção dos painéis', min: -180, max: 180, step: 1, def: 0 },
      /* "alagar o vidro": o painel inteiro fica fosco, e não só a quina */
      { k: 'alagar', label: 'Alagar (embaçar o painel)', min: 0, max: 1, def: 0 },
      { k: 'brilho', label: 'Luz no bisel', min: 0, max: 3, def: 1.1 },
      { k: 'brilhoCor', t: 'c', label: 'Cor da luz', def: '#ffffff' },
      { k: 'linha', label: 'Risco de junta', min: 0, max: 1, def: 0.35 },
      { k: 'linhaCor', t: 'c', label: 'Cor da junta', def: '#16150f' },
      { k: 'crom', label: 'Dispersão de cor', min: 0, max: 1, def: 0.2 },
      { k: 'losango', t: 'b', label: 'Painéis em losango', def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      '  vec2 px = uv*uRes;',
      '  vec2 r = rot2(px, radians(u_ang));',
      '  vec2 cel = vec2(uRes.x/max(u_cols,1.0), uRes.y/max(u_rows,1.0));',
      '  vec2 q = r/cel;',
      /* losango: meia célula de deslocamento em linha alternada */
      '  if(u_losango > 0.5) q.x += 0.5*floor(q.y);',
      '  vec2 f = fract(q) - 0.5;',
      /* distância à borda do painel, em 0 (borda) .. 1 (centro) */
      '  float d = 1.0 - max(abs(f.x), abs(f.y))*2.0;',
      '  float ch = clamp(u_chanfro, 0.01, 0.5);',
      /* O BISEL. `t` vai de 0 na borda a 1 onde o chanfro acaba. A
         inclinação do vidro é a derivada disso — constante no chanfro,
         zero no meio do painel. É o que faz um bisel parecer bisel: o
         desvio é uniforme na faixa e some de repente.               */
      '  float t = clamp(d/ch, 0.0, 1.0);',
      '  float dentro = step(ch, d);',
      '  vec2 dir = vec2(sign(f.x)*step(abs(f.y), abs(f.x)), sign(f.y)*step(abs(f.x), abs(f.y)));',
      '  float inclin = (1.0 - t);',
      '  vec2 desv = rot2(dir*inclin, -radians(u_ang)) * u_esp * min(cel.x, cel.y) * 0.09 / uRes;',
      '  vec3 col;',
      '  if(u_crom > 0.002){',
      '    col.r = srccol(uv + desv*(1.0 - u_crom*0.5)).r;',
      '    col.g = srccol(uv + desv).g;',
      '    col.b = srccol(uv + desv*(1.0 + u_crom*0.5)).b;',
      '  } else col = srccol(uv + desv);',
      /* ALAGAR: o painel inteiro embaça. Sem isto o chanfrado é uma
         janela limpa recortada; com isto é aquele vidro de porta.  */
      '  if(u_alagar > 0.004){',
      '    vec2 tx = texel()*(3.0 + u_alagar*16.0);',
      '    vec3 s = vec3(0.0);',
      '    for(int j=-2;j<=2;j++) for(int i=-2;i<=2;i++) s += srccol(uv + desv + vec2(float(i), float(j))*tx);',
      '    col = mix(col, s/25.0, clamp(u_alagar, 0.0, 1.0)*dentro);',
      '  }',
      /* luz no bisel: acende de um lado e escurece do outro */
      '  float faixa = (1.0 - dentro)*(1.0 - t);',
      '  float lado = dir.x*0.7 + dir.y*0.7;',
      '  col += u_brilhoCor * u_brilho * faixa * max(lado, 0.0) * 0.6;',
      '  col *= 1.0 - faixa*max(-lado, 0.0)*0.45;',
      /* risco fino na junta */
      '  float j2 = 1.0 - smoothstep(0.0, 0.035, d);',
      '  col = mix(col, u_linhaCor, j2*u_linha);',
      '  return col;',
      '}'
    ].join('\n')
  });

  /* ===================== RAIO-X ===================== */

  D({
    id: 'raioxglow', name: 'RAIO-X', cat: 'percepcao', color: '#38f0ff',
    desc: 'radiografia: o denso barra, o fino atravessa, e o contorno acende',
    params: [
      { k: 'dens', label: 'Densidade do corpo', min: 0.2, max: 4, def: 1.5 },
      { k: 'pen', label: 'Penetração', min: 0, max: 1, def: 0.35 },
      { k: 'inv', t: 'b', label: 'Inverter (chapa negativa)', def: 0 },
      /* o que faz a chapa parecer chapa: a borda acende porque o raio
         atravessa mais matéria na tangente do que de frente */
      { k: 'borda', label: 'Acendimento do contorno', min: 0, max: 4, def: 1.6 },
      { k: 'bordaRaio', label: 'Alcance do contorno', min: 0.5, max: 6, def: 1.6 },
      { k: 'halo', label: 'Halo em volta', min: 0, max: 2, def: 0.8 },
      { k: 'haloRaio', label: 'Alcance do halo', min: 1, max: 24, step: 0.5, def: 8 },
      { k: 'osso', label: 'Separar o denso', min: 0, max: 1, def: 0.45 },
      { k: 'cor1', t: 'c', label: 'Cor do fundo', def: '#03070d' },
      { k: 'cor2', t: 'c', label: 'Cor do tecido', def: '#9fd8ff' },
      { k: 'cor3', t: 'c', label: 'Cor do osso', def: '#ffffff' },
      { k: 'grao', label: 'Grão da chapa', min: 0, max: 1, def: 0.14 },
      { k: 'vinheta', label: 'Vinheta', min: 0, max: 1, def: 0.3 },
      { k: 'scan', label: 'Varredura', min: 0, max: 1, def: 0 }
    ],
    glsl: [
      'vec3 fx(vec2 uv){',
      /* DENSIDADE. Numa radiografia o valor não é cor, é quanta matéria
         o raio atravessou. Luminância invertida é a leitura mais
         próxima disso a partir de uma foto comum.                  */
      '  vec3 s = srccol(uv);',
      '  float l = luma(s);',
      '  float d = 1.0 - l;',
      '  if(u_inv > 0.5) d = l;',
      /* Beer-Lambert de brinquedo: a saída cai exponencialmente com a
         densidade vezes a espessura. É a conta que dá a lavagem das
         partes finas e o corte seco das grossas.                    */
      '  float atrav = exp(-d*u_dens*2.2) + u_pen*0.35;',
      '  atrav = clamp(atrav, 0.0, 1.0);',
      /* --------- contorno: gradiente local, curto --------- */
      '  vec2 t = texel()*u_bordaRaio;',
      '  float gx = luma(srccol(uv + vec2(t.x, 0.0))) - luma(srccol(uv - vec2(t.x, 0.0)));',
      '  float gy = luma(srccol(uv + vec2(0.0, t.y))) - luma(srccol(uv - vec2(0.0, t.y)));',
      '  float borda = clamp(length(vec2(gx, gy))*3.0, 0.0, 1.0);',
      /* --------- halo: média larga, e só o que sobra da imagem --------- */
      '  float halo = 0.0;',
      '  if(u_halo > 0.004){',
      '    vec2 h = texel()*u_haloRaio;',
      '    float acc = 0.0;',
      '    for(int j=-2;j<=2;j++){',
      '      for(int i=-2;i<=2;i++){',
      '        vec2 o = vec2(float(i), float(j))*h;',
      '        acc += 1.0 - luma(srccol(uv + o));',
      '      }',
      '    }',
      '    halo = max(acc/25.0 - d, 0.0);',
      '  }',
      /* --------- a chapa: três faixas de densidade --------- */
      '  float tecido = smoothstep(0.05, 0.5, d);',
      '  float osso = smoothstep(0.55, 0.92, d)*u_osso;',
      '  vec3 col = u_cor1;',
      '  col = mix(col, u_cor2, tecido*(1.0 - atrav*0.55));',
      '  col = mix(col, u_cor3, osso);',
      '  col += u_cor2 * borda * u_borda * 0.55;',
      '  col += u_cor2 * halo * u_halo * 0.7;',
      /* --------- grão de filme e vinheta --------- */
      '  if(u_grao > 0.004){',
      '    float g = hash21(uv*uRes + floor(uTime*24.0)) - 0.5;',
      '    col += g*u_grao*0.5;',
      '  }',
      '  if(u_vinheta > 0.004){',
      '    vec2 c = (uv - 0.5)*vec2(uAspect, 1.0);',
      '    col *= 1.0 - clamp(length(c)*1.35 - 0.25, 0.0, 1.0)*u_vinheta;',
      '  }',
      /* varredura: a linha do aparelho descendo */
      '  if(u_scan > 0.004){',
      '    float y = fract(uTime*0.35);',
      '    float linha = smoothstep(0.035, 0.0, abs(uv.y - y));',
      '    col += u_cor3*linha*u_scan*0.8;',
      '    col *= 1.0 + linha*u_scan*0.5;',
      '  }',
      '  return max(col, vec3(0.0));',
      '}'
    ].join('\n')
  });

  /* ===================== ESTILOS PRONTOS ===================== */
  VE.STYLES.push(
    {
      id: 'vidrocanelado', name: 'Vidro canelado', desc: 'o retrato atrás do vidro ripado',
      fx: [['vidro', { tipo: 0, esp: 1.4, passo: 22, crom: 0.18, brilho: 0.7, fosco: 0.12 }]]
    },
    {
      id: 'vidrochuva', name: 'Chuva no vidro', desc: 'gotas escorrendo, o fundo desfocado',
      fx: [['vidro', { tipo: 4, esp: 1.8, passo: 46, anim: 1, fosco: 0.35, crom: 0.2, irreg: 0.5 }]]
    },
    {
      id: 'portadevidro', name: 'Porta de vidro', desc: 'painéis chanfrados e embaçados',
      fx: [['vidrochanfro', { cols: 3, rows: 4, chanfro: 0.22, esp: 1.2, alagar: 0.5, brilho: 1.3 }]]
    },
    {
      id: 'chapa', name: 'Chapa de raio-x', desc: 'radiografia com contorno aceso',
      fx: [['raioxglow', { dens: 1.7, borda: 1.9, halo: 1, osso: 0.5, grao: 0.16, vinheta: 0.35 }]]
    }
  );

})(window.VE);

/* ============================================================
   rgb_lab — TIRAS DE PAPEL (parte 2 do fx11)
   ------------------------------------------------------------
   Aquela colagem em que a foto é cortada em tiras, as tiras são
   afastadas e reordenadas, e cada uma mostra um MOMENTO diferente.

   A parte que faz o efeito ser o efeito não é o corte: é o TEMPO. Numa
   colagem de papel o artista imprime várias fotos e intercala; aqui
   cada tira lê a memória de quadros num atraso próprio, e o rosto
   aparece gritando numa tira e calado na vizinha, sozinho.

   Por isso o efeito mora na família TEMPO e não na de espaço.
   ============================================================ */
(function (VE) {
  'use strict';
  var D = VE.def;

  /* quantas lembranças o anel da fonte guarda, por escolha de memória */
  var VAGAS = [16, 32, 64];

  D({
    id: 'tiras', name: 'TIRAS DE PAPEL', cat: 'tempo', color: '#00e5ff',
    desc: 'a imagem cortada em tiras afastadas, cada uma num momento diferente',
    alpha: true,
    /* DISTÂNCIA entre uma lembrança e a seguinte, em quadros. É o que
       transforma 66 milésimos em segundos.                            */
    hist: function (p) { return Math.max(1, Math.round(p.passo || 12)); },
    /* quantas lembranças o motor guarda. Mais vagas não dão mais tempo:
       dão FLUIDEZ, porque com vaga sobrando o motor guarda todo quadro
       em vez de guardar um a cada quatro. Ver o comentário grande em
       gl.js, `A MEMÓRIA DA FONTE`.                                    */
    vagas: function (p) { return VAGAS[Math.round(p.memoria || 0)] || VAGAS[0]; },
    /* lê a memória da FONTE, não a da saída: senão a tira lê a si mesma */
    histFonte: true,
    params: [
      { k: 'n', label: 'Quantas tiras', min: 2, max: 80, step: 1, def: 16 },
      { k: 'ang', label: 'Direção do corte', min: -90, max: 90, step: 1, def: 0 },
      { k: 'vao', label: 'Vão entre as tiras', min: 0, max: 1, def: 0.22 },
      { k: 'desl', label: 'Deslize da tira', min: 0, max: 1, def: 0.1 },
      { k: 'irreg', label: 'Largura irregular', min: 0, max: 1, def: 0.25 },
      /* O CORAÇÃO: cada tira num tempo próprio. Sem isto é só um corte. */
      { k: 'tempo', label: 'Diferença de tempo entre as tiras', min: 0, max: 1, def: 0.75 },
      /* Quantos quadros separam uma tira da vizinha. Com 1, as tiras
         mostram quadros vizinhos e a diferença é invisível — foi assim
         que este efeito nasceu, e não dava para ver nada. Com 12, as
         quatro lembranças cobrem meio, um e um segundo e meio.      */
      { k: 'passo', label: 'Distância no tempo (quadros)', min: 1, max: 40, step: 1, def: 12, uni: false },
      /* O ajuste que conserta o travamento: memória curta obriga o motor
         a guardar um quadro a cada quatro, e a tira atrasada só troca de
         imagem quando ele guarda. Memória longa custa vídeo e devolve
         fluidez. Os números entre parênteses são a 1920×1080.        */
      {
        k: 'memoria', t: 's', label: 'Memória (fluidez das tiras)', def: 0, uni: false,
        opts: ['CURTA — 16 lembranças (33 MB)', 'LONGA — 32 (66 MB)', 'MÁXIMA — 64 (133 MB)']
      },
      { k: 'ordem', t: 's', label: 'Como o tempo se espalha', def: 0, opts: ['ALTERNADO', 'EM RAMPA', 'SORTEADO', 'DO CENTRO'] },
      { k: 'espelha', label: 'Espelhar tiras alternadas', min: 0, max: 1, def: 0 },
      { k: 'fundoOn', t: 'b', label: 'Pintar o vão', def: 1 },
      { k: 'fundo', t: 'c', label: 'Cor do vão', def: '#f4f1e8' },
      { k: 'sombra', label: 'Sombra da tira', min: 0, max: 1, def: 0.45 },
      { k: 'papel', label: 'Grão de papel', min: 0, max: 1, def: 0.2 }
    ],
    glsl: [
      'vec4 fx4(vec2 uv){',
      '  float n = max(u_n, 2.0);',
      '  vec2 c = uv - 0.5;',
      '  vec2 r = rot2(c, radians(u_ang));',
      /* qual tira, e onde dentro dela */
      '  float fx1 = r.x + 0.5;',
      '  float idx = floor(fx1*n);',
      '  float dentro = fract(fx1*n);',
      /* largura irregular: cada tira encolhe um pouco, por sorteio fixo */
      '  float larg = 1.0 - hash21(vec2(idx, 3.7))*u_irreg*0.7;',
      '  float meio = (1.0 - larg)*0.5;',
      /* o vão come das duas pontas da tira */
      '  float v = u_vao*0.5;',
      '  float dentroTira = step(meio + v, dentro)*step(dentro, 1.0 - meio - v);',
      /* --- deslize: a tira anda no próprio eixo --- */
      '  float sl = (hash21(vec2(idx, 11.3)) - 0.5)*2.0*u_desl;',
      /* --- o TEMPO de cada tira --- */
      '  float k;',
      '  if(u_ordem < 0.5)      k = mod(idx, 2.0);',
      '  else if(u_ordem < 1.5) k = idx/max(n - 1.0, 1.0);',
      '  else if(u_ordem < 2.5) k = hash21(vec2(idx, 5.1));',
      '  else                   k = abs(idx/max(n - 1.0, 1.0) - 0.5)*2.0;',
      '  int atraso = int(floor(k*u_tempo*4.0 + 0.5));',
      /* --- ler a fonte, no tempo da tira --- */
      '  vec2 q = r;',
      '  q.y += sl;',
      '  if(u_espelha > 0.004 && mod(idx, 2.0) > 0.5){',
      '    float centro = (idx + 0.5)/n - 0.5;',
      '    q.x = centro*2.0 - q.x;',
      '  }',
      '  vec2 luv = rot2(q, -radians(u_ang)) + 0.5;',
      '  vec4 s;',
      '  if(atraso <= 0) s = src4(luv);',
      '  else { s = vec4(histcol(atraso, luv), 1.0); }',
      '  if(luv.x < 0.0 || luv.x > 1.0 || luv.y < 0.0 || luv.y > 1.0) s = vec4(0.0);',
      /* --- sombra na borda da tira, que é o que dá o relevo de papel --- */
      '  float bordaE = smoothstep(meio + v, meio + v + 0.06, dentro);',
      '  float bordaD = smoothstep(1.0 - meio - v, 1.0 - meio - v - 0.06, dentro);',
      '  float sombra = 1.0 - (1.0 - bordaE*bordaD)*u_sombra;',
      '  s.rgb *= sombra;',
      /* --- grão de papel na tira --- */
      '  if(u_papel > 0.004){',
      '    float g = hash21(floor(uv*uRes*0.7)) - 0.5;',
      '    s.rgb += g*u_papel*0.18;',
      '  }',
      /* --- o vão --- */
      '  vec3 fundo = u_fundo;',
      '  float a = dentroTira*s.a;',
      '  if(u_fundoOn > 0.5) return vec4(mix(fundo, s.rgb, a), 1.0);',
      '  return vec4(s.rgb, a);',
      '}'
    ].join('\n')
  });

  VE.STYLES.push({
    id: 'colagemtiras', name: 'Colagem em tiras', desc: 'a foto cortada e remontada fora do tempo',
    fx: [['tiras', { n: 18, vao: 0.18, tempo: 0.7, ordem: 0, sombra: 0.5, papel: 0.25 }]]
  });

})(window.VE);
