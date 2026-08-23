# rgb_lab — estado do projeto

> Documento de continuidade. Última sessão: **23/08/2026** (décima quarta passada).
> O manual de uso é o [LEIA-ME.md](LEIA-ME.md); aqui fica o que foi decidido,
> o que está pronto, o que não foi verificado e o que vem depois.

---

### RETOMAR AQUI

A lista inteira, com o porquê de cada item, está na **seção 14**. Em resumo:

| # | o que | onde está explicado |
|---|---|---|
| 1 | **`D.tom` e `D.esticar` erram o tom** — o motor certo já existe (`D.tomVoz` / `D.esticarVoz`); trocar muda o som dos presets do TEMPO ELÁSTICO e do GRANULAR, e essa decisão é sua | 4v |
| 2 | Guardar a medida da letra (hoje mede 4× por quadro) | 4u |
| 3 | Worker para as cadeias longas de áudio — ESPECTRAL, GRANULAR e a família VOZ | 4v e 7 |
| 4 | Filtro de segunda ordem no `D` — é por isso que o TELEFONE deixa 30% da energia fora da banda | 4v |
| 5 | VHS pelo mérito: dropout, erro de croma, tracking, head-switching | 14 |
| 6 | Alça de Bézier na máscara de EFEITO | 4l |
| 7 | Botão SEGUIR na caneta (MediaPipe) | 13 |

**Fechado na décima terceira passada (4v), não repetir:** as TIRAS foram
destravadas — o anel da fonte vive em meia resolução, a distância de leitura
saiu de dentro do intervalo de guarda, e o padrão novo dá 15 trocas por segundo
onde dava 4,7, pelos mesmos 32 MB. E a **família VOZ** entrou no rack de áudio,
sete módulos, medidos por espectro.

**Fechado na décima quarta passada (4w):** as LETRAS RECORTADAS ganharam a
escolha que faltava — dois relógios separados (troca e tremor), os dois em
passos por segundo escritos na tela, e o estilo **LISO**, que desliza em vez de
saltar. De quebra, o PULSO, que era o CAOS com outro nome, virou o que o rótulo
dele promete.

---

## 1. Onde paramos

O projeto é um **laboratório audiovisual experimental** com três mesas (vídeo,
áudio, tipografia) e identidade própria. As mudanças estruturais até aqui:

1. **Identidade por canal.** As três cores deixaram de ser decoração e viraram
   código de navegação: **azul = vídeo, verde = áudio, vermelho = tipografia**.
2. **A linha do tempo virou uma mesa de edição não linear de verdade** — pistas,
   vários clipes por pista, trim, camadas de ajuste, keyframes com curvas,
   transições, marcadores, entrada/saída, composições aninhadas.
3. **Tipografia desenhada por código** — 12 famílias próprias feitas de traço,
   o que permitiu a animação de escrita à mão.
4. **Color engine** — perfil de entrada separado do look criativo, cinco looks
   reconstruídos, LUT 3D e medição por ΔE. Ver [COLOR-ENGINE.md](COLOR-ENGINE.md).
5. **Colunas laterais em pilha rígida** — o LAB 01 em abas, o LAB 03 com saída
   fixa no rodapé. Antes uma seção colapsava e vazava por cima da outra.
6. **O catálogo virou OITO FAMÍLIAS** (quarta passada), o motor passou a guardar
   quatro quadros, e entraram 69 efeitos novos, cinco deles ferramentas
   assinatura que não existem em editor nenhum.
7. **O laboratório de áudio virou uma mesa de processamento** (sexta passada) —
   27 módulos em cadeia ordenável, mutação, presets, e espacialização HRTF
   de verdade. Ver §4f.
8. **A cor de interação passou a seguir o canal** — não existe mais amarelo
   dentro de um laboratório. Ver §4.
9. **O editor de vídeo ganhou um MOTOR DE COMPOSIÇÃO** (sétima passada): cada
   clipe virou camada, com 27 modos de mistura, faixa de mescla, track matte,
   máscaras combináveis, cor e canais — tudo em GPU, tudo pulável. Ver §4g.
10. **Cada laboratório ganhou um tutorial dentro dele** — 37 passos escritos
    para quem nunca abriu um editor. Ver §4h.

| | |
|---|---|
| Código | **27.179 linhas** · 42 JS · 2 CSS · 1 HTML |
| Efeitos de vídeo | **139** shaders (todos compilam, nenhum sai vazio) |
| Famílias de efeito | **8** |
| Filtros de cor | **52** na galeria, com miniatura ao vivo |
| Looks do color engine | **5**, com 12 perfis de entrada |
| Transições | **30**, incluindo a família MOTION |
| **Modos de mistura** | **27** em 6 grupos, com miniatura no seletor |
| Etapas da camada | transformar · efeitos · cor · canais · máscaras · matte · mesclar |
| Famílias tipográficas próprias | **12** |
| Ferramentas de tipografia | **54** (12 de forma, 42 de animação) |
| Estilos prontos | **49** |
| Módulos de áudio | **27** em 10 famílias · 26 presets |
| Conjuntos ASCII | **14** |
| Passos de tutorial | **37** (vídeo 16 · áudio 13 · tipografia 8) |
| Limite de composição | **definido por você** — padrão 10 min |

### O que a sétima passada mediu

```
27 modos × 4 pares de cor ..... 104 comparações contra a fórmula, 0 falhas
pior erro ..................... 0,002 (arredondamento de 8 bits)
camada neutra ................. 1 passada · 0,03 ms em 1280×720
tudo ligado ................... 5 passadas · 0,09 ms
400 quadros com tudo ligado ... 0,40 ms/quadro · sem erro · sem perda de contexto
cache de camada estática ...... 0,38 ms → 0,07 ms (5,4×), pixel idêntico
memória de vídeo .............. 41 MB fixos + até 14 MB de cache
139 efeitos anteriores ........ compilam, nenhum vazio, glErr 0
projeto versão 4 .............. abre traduzido (blend 2 → 8 / Tela)
```

---

## 2. Comandos

```bash
node server.js
```

Abre em `http://localhost:5173`. Ou clique duplo em `ABRIR RGB_LAB.bat`.

```bash
node build-arquivo-unico.js
```

Gera `rgb_lab-arquivo-unico.html` (tudo embutido) e `dist/artifact.html`.
A lista de arquivos vem do próprio `index.html` — o build lê de lá e para com
erro se algum arquivo listado não existir.

**Artifact publicado:** https://claude.ai/code/artifact/4794ba16-501f-4849-bf17-23fe860fc637
Republicar = rodar o build e publicar `dist/artifact.html` **no mesmo caminho**.

---

## 3. Mapa dos arquivos

```
index.html               casca: entrada ascii → boot → índice → manual → 3 laboratórios
css/system.css           tokens, CANAIS, primitivas, casca, cursor, modais, MARCA,
                         placas recolhíveis, assinatura de autoria
css/labs.css             viewport, LINHA DO TEMPO, motion, galeria de filtros,
                         tutorial, O MAPA DO MÉTODO (prancha técnica em SVG)
assets/logo.png          marca recortada (fonte da verdade; original em REFERENCIAS/LOGO)

js/brand.js              nome e etiquetas da marca (VE.BRAND)
js/fx.js                 base do sistema de efeitos + cor/luz  (PRELUDE, MAIN, MAIN4)
                         O PRELUDE agora entrega: memória de quadros (uPrev/uH2/uH3/uH4),
                         som do instante (uAudio), correção do estabilizador (uStab),
                         HSL, gradiente Sobel, aspereza local, Voronoi e fbm com tempo
js/fx2.js                distorção, glitch, tempo, ASCII, charsets, estilos,
                         MOSAICO DE EMOJI (escolhe a figura pela COR da célula)
js/autosave.js           SESSÃO GUARDADA — projeto + arquivos de mídia em IndexedDB
js/legendas.js           LEGENDAS: pista C1, estilo de faixa, SRT/VTT, colar texto
js/tinta.js              ESCREVER À MÃO: captura de traço, suavização, revelação
js/tintaui.js            a folha de captura e a barra, dentro do lab de tipografia
js/fx3.js                alpha, impressão, pixel sort
js/fx4.js                lego, gravura, cianotipia, xerox, paleta, óleo, neon, tv80…
js/fx5.js                PELÍCULA: janela 8/S8/16/35mm, vazamento, flash, grão, halação
js/fx7.js       ← NOVO   FAMÍLIA 01 COR/MATÉRIA + 07 PERCEPÇÃO — kira kira, colorizar,
                         memória de cor, deslocamento espectral, branqueamento, processo
                         cruzado, solarização, mesa de canais, falsa cor, cor seletiva,
                         p&b espectral, infravermelho, registro, riso, serigrafia,
                         cintilância, queima, relevo, campo de bordas, profundidade
js/fx8.js       ← NOVO   FAMÍLIA 02 TEMPO + 03 ESPAÇO — eco temporal, acúmulo, borrão
                         temporal, deslocamento temporal, sangria de tempo, congelamento
                         parcial, ESTABILIZADOR, líquido, calor, turbulência, polar,
                         esfera, túnel, dobra, Möbius, lente, mapa de deslocamento,
                         caleidoscópio de laboratório
js/fx9.js       ← NOVO   FAMÍLIA 04 GLITCH + 05 PIXEL — CUBIK, bits, plano de bits,
                         colapso de compressão, macrobloco preso, fita esticada,
                         chaveamento de cabeça, sangria de croma, perda de sinal,
                         rasgo, erro de trilha, pixel com forma, ordenação de pixels,
                         mosaico celular, deslocamento de bits
js/fx10.js      ← NOVO   FAMÍLIA 06 PINTURA + 08 INSTRUMENTOS — aquarela, nanquim,
                         carvão, lápis, guache, pastel, colagem, motor de realimentação,
                         caleidoscópio realimentado, erosão de matéria, campo de
                         movimento, pintura por fluxo, imagem textual, ruído generativo,
                         tipografia como matéria
js/color/                COLOR ENGINE — perfis, núcleo em JS, cinco looks, LUT 3D e ΔE
js/fx6.js                o gêmeo em GLSL do color engine
js/fxfam.js     ← NOVO   AS OITO FAMÍLIAS: define a taxonomia, dá cor a cada uma e
                         reetiqueta os 70 efeitos antigos. Carrega DEPOIS de todo fx*.js
js/transitions.js        curvas de keyframe (incl. Bézier) + 30 transições
js/typefaces.js          12 famílias desenhadas por código
js/gl.js                 motor WebGL2 + ANEL DE QUATRO QUADROS + 21 modos de mistura
js/state.js              modelo de edição não linear · VE.srcTime (velocidade e sentido)
                         · VE.setMaxDur (limite definido pelo usuário) · VE.BLENDS
js/stab.js      ← NOVO   analisador do estabilizador: perfis de projeção 64×64,
                         casamento por SAD com refino de sub-pixel e controlador
js/presets.js            presets (localStorage)
js/media.js              fontes + geometria de MOTION + plano para a GPU
js/view.js               viewport: zoom, pan, fit, réguas
js/timeline.js           a mesa de edição
js/panels.js             catálogo, ficha da composição, PLACAS RECOLHÍVEIS, máscara
js/motion.js             MOTION / Effect Controls / keyframes / gráficos / caixa
js/filters.js            galeria de 52 filtros, agora com filtro em CADEIA
js/exporter.js           exportação (vídeo, sequência PNG com alpha, ZIP próprio)
js/audiodsp.js  ← NOVO   biblioteca de sinal: FFT, STFT, granular, esticador,
                         respostas impulsivas, ressonadores, sorteio por semente
js/audio.js              LAB 02 — o rack, agora DIRIGIDO PELA ORDEM dos módulos,
                         com registro aberto (VE.audio.register), MUTAR, A/B e
                         quatro leituras no analisador. WAV e picos como antes.
js/audiofx.js   ← NOVO   os 14 módulos novos do MESMO rack: atmosfera, deformação,
                         glitch, matéria, espacial, psicoacústica, granular,
                         espectral, generativo
js/audiopresets.js ← NOVO as 23 cadeias artísticas prontas
js/reactmap.js  ← NOVO   ÁUDIO REATIVO: o som mexendo na imagem do LAB 01,
                         somado na leitura de VE.valueAt
js/type.js               LAB 03 — motor letra a letra + ENTRADA/LAÇO/SAÍDA
js/comp.js               modelo da COMPOSIÇÃO: modos, camada, máscara, assinatura
js/compgl.js             GLSL da composição: espaço de cor, 27 modos, faixa, máscaras
js/compui.js             ficha da composição: seletor com miniatura, máscaras, matte
js/guia.js               os tutoriais de dentro de cada laboratório
js/shell.js              intro ascii, boot, roteamento, CANAIS, cursor, manual
js/app.js                LAB 01 — controlador, laço, atalhos, divisores, SOBREPOR
```

Ordem de carga importa: `brand → fx…fx5 → fx7…fx10 → color/* → fx6 → fxfam →
transitions → typefaces → **comp → compgl** → gl → state → stab → presets → media →
view → timeline → panels → motion → **compui → guia** → filters → exporter →
audio… → type → shell → app`.

`comp.js` e `compgl.js` vêm **antes de `gl.js`** porque o motor lê os shaders de
lá no construtor. `compui.js` vem depois de `motion.js`, que é quem o chama.
A ordem vive **só no `index.html`**. O build lê a lista de lá.

**`fxfam.js` tem de ser o último dos fx**: ele varre `VE.FX` inteiro para
reetiquetar. Um efeito registrado depois dele ficaria fora das famílias.

---

## 4. Decisões travadas

**Os três canais.** Não são R/G/B no sentido tradicional: são códigos de navegação.
`--ch-video` azul, `--ch-audio` verde, `--ch-type` vermelho. O `<html>` recebe
`data-lab` a cada troca de vista e `--ch` passa a valer o canal ativo — uma troca
repinta trilho, abas, cabeçalhos, cursor, playhead, seleção e barra de status.
Fora disso, a interface segue preto / off-white / cinza / branco.

**Laranja é alerta, vermelho é tipografia.** Tudo que era destrutivo ou de erro
saiu do vermelho e foi para `--sys-orange`. Sem isso, vermelho significaria duas
coisas ao mesmo tempo.

**A cor de interação segue o canal do laboratório.** Havia um token só, amarelo,
para foco, seleção, arraste e "ligado". Dentro de um laboratório isso brigava com
a identidade: o menu de ESPAÇO da ATMOSFERA abria amarelo no meio de um
laboratório verde. Agora existe `--accent` (e `--on-accent`), que **vale o canal**
dentro dos três laboratórios e volta a ser amarelo onde não há canal — índice,
manual, entrada, boot. Foram 62 usos convertidos.

Continuam amarelos de propósito: a entrada e o boot (acontecem antes de existir
laboratório) e o nó do diagrama do manual (o canal do manual é tinta, e o nó
ficaria preto sobre preto).

**As cores das oito famílias não são interação, são taxonomia.** Âmbar, ciano,
violeta, magenta, verde-água, laranja, lima e tinta continuam como estão: é o que
permite reconhecer a família de um item no meio de 139. Pintar as oito de azul
deixaria o catálogo bonito e ilegível.

**Armadilha:** a troca em massa de `var(--sys-yellow)` por `var(--accent)` atingiu
a própria definição do token, que virou `--accent: var(--accent)`. Um custom
property que se referencia resolve como inválido e cai para o valor herdado —
índice e manual foram para tinta em vez de amarelo. Ao trocar token em massa,
defina o novo com valor **literal**, ou defina-o depois da troca.

**`--on-yellow` não inverte.** Segue valendo: fundo amarelo usa texto preto fixo.

**A faixa amarela da entrada foi removida.** No lugar dela entrou uma marca de
registro RGB: três filetes de 1px levemente fora de esquadro.

**Modelo de edição.** `Sequence → tracks[] → clips[] → effects[] · keys{} ·
transIn/transOut`. O tempo de um keyframe é **local ao clipe** — mover o clipe não
desloca a animação. Um clipe `kind:'adjust'` alcança tudo **abaixo** dele, só no
intervalo em que existir.

**Ordem das pistas:** `[FX…] [vídeo…] [áudio…]`, de cima para baixo. FX no topo
porque ajuste precisa estar acima do que modifica.

**O motor recebe um PLANO**, não "camadas + cadeia global". Clipe sem efeito é
composto numa passada; clipe com efeito é desenhado sozinho num quadro
transparente, passa pela cadeia dele e só então é misturado.

**Transições não têm shader próprio.** Cada uma é uma função pura que devolve um
modificador de camada (deslocamento, escala, giro, recorte, opacidade) e, quando
faz sentido, injeta um efeito do catálogo. Por isso arrastar a borda muda a
duração em tempo real.

**Toda coluna lateral é uma pilha rígida.** O padrão vale para os três
laboratórios: o container é `flex-direction:column` com `min-height:0`, **uma só**
lista é elástica e rolante, e o resto é `flex:0 0 auto`. Sem isso, uma seção
colapsa e os filhos dela continuam desenhando por cima da seguinte — foi o que
aconteceu no LAB 01 (EFEITOS a 1px por cima da galeria) e no LAB 03 (21
ferramentas medindo 809px numa coluna de 644, empurrando os botões de saída
300px para fora da tela). No LAB 03 o bloco **SAÍDA** é rodapé fixo, de propósito:
é onde se exporta, e não pode depender de rolagem.

**A coluna do LAB 01 é uma pilha rígida com abas.** `#sideVideo` é
`flex-direction:column` com `min-height:0`; FONTE e o seletor de abas são
`flex:0 0 auto`, e só o painel da aba aberta é elástico. Quatro catálogos
empilhados como seções soltas faziam a de EFEITOS colapsar para 1px enquanto os
filhos dela continuavam desenhando por cima da galeria. Se acrescentar um
catálogo novo, ele vira uma **aba**, não uma seção.

**Tipografia sai sempre em PNG com alpha.** O fundo do painel existe só para você
enxergar; exportação e envio para a linha do tempo desenham sem fundo, sempre.

**Texto entra POR CIMA, no cursor.** `VE.insertOver` procura a pista de vídeo mais
ALTA livre naquele intervalo e cria uma nova no topo se não houver. Usar
`appendClip` para tipografia estava jogando o texto no fim da pista de baixo —
atrás do vídeo e fora do tempo em que ele deveria aparecer.

**Chaves de armazenamento continuam com o nome antigo** de propósito:
`videorte.presets.v2`, `videorte.layout`, `videorte.mode`. Não renomear sem migração.

**Arquivo de projeto** grava `version: 4` e **abre os antigos** (v2/v3, `app:
"videorte"`): camadas viram clipes em pistas, pistas de efeito viram camadas de
ajuste, keyframes antigos ganham caminho novo (`scale` → `motion.scale`).

---

## 4b. Decisões travadas na quarta passada

**As oito famílias substituem as seis categorias.** `todos · cor/matéria · tempo ·
espaço · glitch · pixel · pintura · percepção · instrumentos`. A taxonomia vive
em `js/fxfam.js`, que carrega depois de todos os `fx*.js` e reetiqueta os antigos
por id. Nenhum shader foi tocado para isso — só o campo `cat`. Um efeito novo já
nasce com a família certa no próprio `cat`; a lista `MOVE` de `fxfam.js` existe
só para os 70 que vieram de antes.

**A cor do item no catálogo é a cor da FAMÍLIA**, não uma cor por efeito. Com 139
itens, cor por efeito vira ruído. `f.famColor` guarda a nova; `f.color` continua
lá, intocada.

**O motor guarda quatro quadros, num anel.** Não é uma cópia por quadro: os
quatro alvos giram por índice, então o custo é zero. `uPrev` é t−1, `uH2`/`uH3`/
`uH4` são t−2, t−3 e t−4. `clearPrev()` limpa os quatro — pular no tempo
obrigatoriamente limpa, senão dois quadros que não se seguem se misturam.

**Um efeito pode declarar `pre`**, um trecho GLSL compartilhado que entra antes
do corpo. É como `pickFrame` (o seletor contínuo de quadro da família TEMPO) vive
em três efeitos sem ser copiado.

**O estabilizador é malha fechada, de propósito.** A medição é feita no quadro
JÁ corrigido, então o que se mede é o resíduo. `correção += medido × força` com
força entre 0 e 1 é um controlador de primeira ordem provadamente estável; o
`vazamento` devolve devagar para que um movimento intencional de câmera continue
passando. Medir o quadro de ENTRADA daria malha aberta e drift acumulado.

**O tempo da fonte tem um lugar só.** `VE.srcTime(clip, t)` decide onde a mídia
tem de estar. Velocidade, reverso, vai-e-volta e congelado moram ali dentro, e o
resto do sistema não precisa saber que existem. `media.js` chama em dois lugares.

**Reverso não toca, posiciona.** Nenhum navegador reproduz mídia para trás. Nos
modos diferente de normal o elemento fica pausado e é reposicionado quadro a
quadro — mais duro na prévia, exato na exportação frame a frame, e **sem áudio**.
Isso está dito na própria ficha do clipe, não só aqui.

**Filtro da galeria pode ser uma CADEIA.** `kind:'chain'` com uma lista de
`{fx, params}`. É o que permitiu reconstruir processos de laboratório que
dependem de matriz de canais — bicromia, tricromia, branqueamento. Aplicar marca
TODA a cadeia com `__filter`, e trocar de filtro remove a cadeia inteira.

**O limite da composição é do usuário.** `VE.MAXDUR` deixou de ser constante:
padrão 600 s, editável na ficha da composição, guardado em `videorte.maxdur`,
teto duro de 10 h só como trava de segurança. `VE.limitLabel()` escreve o número
em minutos ou horas.

**Toda placa da coluna direita recolhe.** A setinha vive no `.plate-h`, o corpo
vira `.plate-b`, o estado de cada bloco fica em `videorte.folded`. Alt+clique
fecha todos os outros. Quem constrói uma placa nova usa `VE.panels.plate()` —
construir `<div class="plate">` à mão deixa o bloco sem setinha.

**A assinatura de autoria acompanha o sistema inteiro.** Fim da barra de status
(todas as vistas), rodapé do índice e fim do manual. Não é um "sobre": é
identidade, e por isso está no canto que nunca some.

---

## 4c. Um bug antigo que só apareceu agora

Os campos `__start`, `__dur`, `__in`, `__blend`, `__fadeIn`, `__fadeOut` e todos
os parâmetros de transição **desenhavam na tela e não faziam nada**. A ligação
que os trata (`wireInputs`) estava dentro de `bindEffectBody`, que só roda quando
há um efeito ABERTO na pilha. Sem efeito aberto, nenhum deles chegava a um
manipulador.

Foi encontrado ao testar a sobreposição — o seletor de MISTURA é um deles, e é o
coração da sobreposição. A ligação foi movida para `bind()`, no nível do clipe,
e a mesma função agora trata os caminhos `fx.` e os `__`.

Fica como aviso: **campo que aparece no inspetor não é campo que funciona.**
Vale testar escrevendo o valor e lendo o clipe de volta.

---

## 4d. Efeitos em VÁRIAS PASSADAS (quinta passada)

Um efeito pode declarar `passes: N`. O motor roda o mesmo shader N vezes,
alternando entre dois quadros de trabalho (`renderer.mp`), e informa em qual
passada está (`uPass`) e quantas são (`uPasses`). A imagem que entrou na cadeia
continua acessível em `uOrig` do começo ao fim.

O shader implementa duas funções em vez de uma:

```
vec4 fxStep(vec2 uv)   as N-1 passadas de trabalho — o que sai daqui é lido
                       pela passada seguinte, e NÃO é imagem
vec3 fxLast(vec2 uv)   a última, que compõe o resultado sobre uOrig
```

Só a última respeita máscara e intensidade — se as de trabalho respeitassem, o
buffer intermediário seria misturado com a imagem e a conta se perderia.

**A condição da última passada é `uPass < uPasses - 1.5`**, e não `- 0.5`. Com
`- 0.5` a passada final também roda como passada de trabalho e o que aparece na
tela é o buffer cru. Foi exatamente o que aconteceu, e o sintoma era estranho: a
imagem saía vermelha e amarela e o controle de intensidade não respondia — porque
o que estava sendo exibido eram os canais R e G do buffer empacotado.

**Por que o kira kira precisa disso.** O pixel que desenha um pedaço de raia
precisa olhar ao longo dela até encontrar o reflexo. Reflexo de água tem 2 a 4
pixels; uma raia que atravessa meia tela tem 300 a 500. Amostrar de 2 em 2
pixels custaria umas 250 amostras por raia. Varrendo em POTÊNCIAS DE QUATRO,
cada passada olha só quatro posições, com o passo multiplicado por quatro:

```
passada 0    0   1   2   3   × passo
passada 1    0   4   8  12   × passo
passada 2    0  16  32  48   × passo
passada 3    0  64 128 192   × passo
```

Somando uma escolha de cada passada chega-se a qualquer distância de 0 a 255
passos — é contagem na base quatro, e não sobra vão. O acúmulo é por **máximo**,
não por soma: assim o brilho da raia a uma distância d vale o brilho do reflexo
vezes a queda naquela distância, em vez de depender de quantas amostras
acertaram — ou seja, não muda com a resolução nem com a qualidade. E como o peso
é exponencial na distância, o máximo composto ao longo das passadas dá o mesmo
resultado de uma varredura fina, porque `w^a · w^b = w^(a+b)`.

As quatro LINHAS da estrela viajam empacotadas nos canais R, G, B e A do quadro
de trabalho, uma por canal, cada uma bidirecional — quatro linhas, oito pontas.

Medido em 1280×720 numa Intel UHD: **raia contínua, 377 de 377 pixels acesos, a
22 ms** por quadro com quatro pontas e 35 ms com oito. A versão de passada única
dava raia furada (112 de 337 pixels) e custava 142 ms.

---

## 4e. `pow()` com base zero devolve NaN nesta GPU

Ao conferir os 139 efeitos um a um, o **Brilho anamórfico** (`glowstreak`)
aparecia como quadro PRETO. Ele compilava, não dava erro de GL e usava só
`srccol`. O culpado era uma linha de aparência inocente:

```glsl
float we = pow(1.0 - f, u_fall);    // f chega a 1.0, então pow(0.0, 1.6)
```

Na Intel UHD via ANGLE/D3D11, `pow` com base exatamente zero devolve **NaN** em
certos contextos — isolado devolve 0, dentro do laço devolve NaN. O NaN
contaminava a soma, depois a divisão, depois a imagem inteira; e `clamp(NaN)`
vira 0, ou seja, preto.

Foram protegidas **17 bases de `pow`** em sete arquivos: `max(x, 0.0)` virou
`max(x, 1e-6)` e `clamp(x, 0.0, …)` virou `clamp(x, 1e-6, …)` sempre que o
resultado entra num `pow`. A diferença é invisível na imagem; o NaN não era.

**Regra daqui em diante: base de `pow` nunca pode chegar a zero.** E "compila e
não dá erro de GL" não quer dizer que desenha — o teste tem de ler o quadro e
conferir que não saiu preto, com preto puro e branco puro presentes na fonte.

---

## 4f. O laboratório de áudio, ampliado (sexta passada)

**A regra que orientou tudo: NÃO criar um segundo laboratório.** A área de
áudio já existia e funcionava; o pedido era torná-la muito mais poderosa sem
fragmentar a experiência. Nenhuma janela nova, nenhuma página nova, nenhuma
segunda timeline, nenhum segundo rack. A estratégia foi **estender,
integrar, melhorar** — e não apagar e reconstruir.

O que foi preservado, intacto: o layout do LAB 02, a onda, a seleção por
arraste, a barra de transporte, o rack de cartões, a coluna da esquerda, o
fluxo de importação, o caminho `buffer original → transformações → grafo
offline → buffer final`, `sendToTimeline`, `peaksFor` e a ficha da direita.

### A mudança estrutural: a ordem do rack virou a cadeia

Era a única forma de permitir reordenar sem trocar o modelo. Antes,
`A.rerender()` tinha a ordem escrita no código (`if (isOn('reverse')) …; if
(isOn('crush')) …`). Agora cada módulo declara COMO processa, e a lista de
módulos é percorrida na ordem:

```
PROC[id] = {
  buf(b, v)            transforma o buffer e devolve outro
  node(off, last, v)   acrescenta um nó no grafo e devolve o novo fim
  tail(v)              cauda em segundos que o módulo acrescenta
  rate(v)              fator de velocidade de leitura
}
```

Como buffer e grafo são domínios diferentes, a cadeia é quebrada em
**trechos de mesmo tipo** e cada trecho é processado inteiro antes do
seguinte. Quem não intercala paga uma renderização só, como antes.

`VE.audio.register(mod, proc)` é o registro aberto: `js/audiofx.js`
acrescenta módulos sem tocar em nada do que já existia. Os doze originais
foram movidos para o mesmo registro **sem mudar uma linha do som deles**.

### Arquivos novos (todos alimentam o MESMO rack)

```
js/audiodsp.js     biblioteca de sinal: FFT radix-2, STFT (duas variantes),
                   motor granular, esticador de tempo, respostas impulsivas
                   de doze espaços, ressonadores, deslocamento de frequência,
                   sorteio por semente. Funções puras sobre AudioBuffer.
js/audiofx.js      os catorze módulos novos, cada um uma declaração curta
js/audiopresets.js as 23 cadeias artísticas prontas
js/reactmap.js     áudio reativo: o som mexendo na imagem do LAB 01
```

### Decisões travadas

**Nada usa `Math.random`.** Todo sorteio passa por `VE.adsp.rng(semente)`.
Sem isso, MUTAR não teria como desfazer, os módulos generativos mudariam
sozinhos a cada re-render, e mexer num controle alteraria o resultado de
outro que nada tem a ver.

**Acúmulo espectral por GANHO, não por magnitude e fase.** A primeira versão
reconstruía cada quadro a partir de magnitude e fase, o que custa um `atan2`
e um par seno/cosseno POR FAIXA E POR QUADRO — num arquivo de 24 segundos
são mais de treze milhões de chamadas trigonométricas, e a renderização
passava de dez segundos. Como quase toda operação espectral só quer ESCALAR
faixas, `D.stftGanho` multiplica a parte real e a imaginária pelo mesmo
ganho e não usa trigonometria nenhuma. Só DESLOCAR, que move faixas de
lugar, ainda precisa do caminho completo.

**A cauda reservada é a duração REAL da resposta impulsiva.** Reservar seis
segundos fixos para uma sala de 0,9 s fazia a renderização custar sete vezes
mais do que precisava, porque tudo o que vinha depois processava silêncio.

**Respostas impulsivas são memorizadas.** Oito últimas, por parâmetro. Sem o
cache, mexer no ganho de saída regerava uma IR de vinte segundos.

**O teto de duração é o mesmo da composição.** Um esticador em 8× num
arquivo longo geraria minutos de áudio e travaria a aba. `VE.MAXDUR` — o
limite que você define no LAB 01 — vale também aqui, com aviso quando apara.

**Áudio reativo soma na LEITURA, não escreve no clipe.** `VE.valueAt` passou
a somar os mapeamentos ativos ao valor da propriedade. Assim o valor
ajustado à mão continua lá, nenhum keyframe é criado, e desligar devolve a
imagem exatamente como estava. Escrever no clipe teria destruído o trabalho
manual a cada quadro.

**Parâmetro que não vale no modo atual não aparece.** Um `when` no parâmetro
esconde o controle quando o seletor dono está noutro valor — controle inerte
é controle falso.

### ÓRBITA 3D: espacialização de verdade, e por que não bastava a que havia

O módulo `ESPACIAL` faz panorâmica com atraso interaural: resolve o eixo
esquerda-direita e só ele. `ÓRBITA 3D (HRTF)` dá POSIÇÃO à fonte — x, y, z —
e deixa o navegador aplicar a função de transferência da cabeça. É o que
permite distinguir frente de trás e acima de abaixo.

Medido: com a fonte à frente e atrás, o balanço entre canais é IDÊNTICO (zero
nos dois) e o espectro difere em 0,093; acima contra abaixo, balanço idêntico e
espectro diferindo em 0,077. Nenhuma panorâmica produz isso.

**O doppler é feito por atraso variável, não por um controle inventado.** O
doppler nativo da Web Audio foi retirado da especificação; o que sobrou seria
um botão que não faz nada. O atraso de propagação é distância ÷ 343 m/s, e
encurtá-lo enquanto a fonte se aproxima comprime as ondas — o fenômeno, não a
imitação dele.

**Armadilha que apareceu aqui:** exagerar o atraso por um fator fixo estourava
o teto do nó de atraso e o doppler travava saturado — o tom caía uma vez e
ficava parado. O fator passou a ser calculado a partir da MAIOR distância do
trajeto, de modo que a excursão inteira caiba sem saturar. Medido num tom de
440 Hz em aproximar-e-afastar: 393 → 382 → 404 → 447 → 490 → 501 → 485 Hz.

No trajeto CÍRCULO o doppler dá zero, e está certo: numa órbita perfeita a
distância até o ouvinte não muda. Serve de aferição — se desse diferente de
zero, o efeito estaria sendo fabricado em vez de derivado da geometria.

### Medido nesta passada

- **27 módulos** no rack (12 originais + 15 novos), **10 famílias**, todos
  com processador registrado.
- **FFT**: erro de ida e volta de 2,4e-7 num sinal de 1024 amostras.
- **Semente**: a mesma devolve a mesma sequência; sementes diferentes
  divergem.
- **82 parâmetros dos módulos novos varridos do mínimo ao máximo**: 77 mudam
  o áudio sozinhos; os 5 restantes são condicionais e foram conferidos um a
  um no modo em que valem. **Nenhum controle é decorativo.**
- **13 processadores de buffer** conferidos: todos alteram o sinal, com
  duração e RMS coerentes. `TEMPO ELÁSTICO` em 2× dobra a duração.
- **11 operações espectrais**: todas mudam o som e todas dão resultados
  diferentes entre si.
- **26 presets artísticos**: cada um produz um áudio distinto de todos os
  outros; nenhum duplica o módulo de saída; mediana de 390 ms por cadeia.
- **Cadeia dirigida pela ordem**: aplicar um preset reordena o rack, e mover
  um módulo com `↑` muda o som.
- **MUTAR**: determinístico por semente; o cadeado protege o parâmetro
  travado mesmo em força 0,9; `↶` restaura.
- **A/B**: `A` e `B` entregam buffers diferentes.
- **Áudio reativo**: grave em 0 dá escala 1,000; grave em 1 dá escala 2,000;
  desligar o mapeamento devolve exatamente 1,000.

### O que NÃO foi feito, e por quê

Estas partes do pedido continuam pendentes. Nenhuma foi implementada pela
metade: ou está inteira, ou não está.

1. **Modulação dos parâmetros de ÁUDIO** (LFO/envelope/random num controle
   do rack). O áudio reativo faz isso na direção áudio→vídeo, mas modular um
   parâmetro do próprio áudio exige que cada processador aceite um valor que
   varia ao longo do buffer — é reescrever os catorze.
2. **Automação dos parâmetros de áudio na linha do tempo.** Depende de (1).
3. **VÍDEO → ÁUDIO** (brilho controlando frequência, movimento controlando
   modulação). O caminho inverso precisa de análise de quadro por quadro do
   vídeo alimentando o áudio, e o áudio aqui é renderizado de uma vez, não
   em tempo real.
4. **IMAGEM → SOM e SOM → IMAGEM (sonificação).** É um gerador, não um
   processador: caberia como uma FONTE nova na coluna esquerda do LAB 02,
   ao lado de ARQUIVO/MICROFONE/TOM/DO VÍDEO.
5. **AudioWorklet e WebAssembly.** Tudo roda no laço principal, com uma
   pausa entre módulos para o aviso `PROCESSANDO` aparecer. Um Worker
   tiraria o travamento das cadeias longas — é a próxima otimização óbvia.
6. **Arrastar para reordenar.** Hoje é por `↑ ↓`, que funciona e não exige
   mira; o arraste seria mais confortável.

---

## 4g. O MOTOR DE COMPOSIÇÃO (sétima passada)

O editor de vídeo deixou de compor "camada + modo de mistura" e passou a ter um
motor de composição de verdade. A palavra é grande, então vale dizer o que ela
significa em código: **cada clipe visual virou uma camada com etapas próprias,
todas em GPU, cada uma podendo ser pulada.**

### A ordem, que é a decisão central

```
FONTE
  ↓  transformar   posição · escala · rotação · âncora · espelho · corte
  ↓  efeitos       a pilha do clipe, exatamente como já era
  ↓  cor           exposição · contraste · gama · níveis · matiz · zonas
  ↓  canais        misturador R/G/B · inverter · deslocamento cromático
  ↓  máscaras      até oito, com somar / subtrair / intersectar / diferença
  ↓  matte         a silhueta emprestada de outra camada
  ↓  mesclar       modo · preenchimento · espaço de cor · faixa de mescla
  ↓  compor        sobre o que já estava montado embaixo
QUADRO
```

Por que essa ordem e não outra:

* **cor antes de máscara** — para poder mascarar o resultado já corrigido;
* **máscara antes de matte** — a máscara é do artista, o matte vem de fora,
  e o de fora tem a última palavra sobre a silhueta;
* **faixa de mescla junto do modo** — ela decide POR PIXEL se a camada existe
  naquele ponto, então precisa do fundo já montado.

### A regra que protege a performance

**Toda etapa nova é pulada quando não muda nada.** `VE.resolveLayer` devolve
`null` quando a camada está neutra, e é esse `null` que manda o motor pelo
caminho de UMA passada — o mesmo que existia antes deste trabalho.

Medido em 1280×720 numa Intel UHD (ANGLE/D3D11):

| situação | passadas | ms/quadro |
|---|---|---|
| uma camada neutra | 1 | 0,03 |
| três camadas neutras com modo | 3 | 0,04 |
| + faixa de mescla | 2 | 0,07 |
| + correção de cor | 3 | 0,05 |
| + máscara | 3 | 0,10 |
| tudo ligado ao mesmo tempo | 5 | 0,09 |

Quem não usa não paga. É a única maneira honesta de acrescentar dezessete
controles a uma camada sem afundar a reprodução.

### Os 27 modos

Seis grupos: NORMAL, ESCURECER, CLAREAR, CONTRASTE, COMPARAÇÃO, COMPONENTE.
As fórmulas seguem a especificação do W3C (*Compositing and Blending Level 1*)
e a documentação pública da Adobe. `dissolver` não é função de cor: é um
sorteio no alfa, com limiar fixo por pixel — por isso ele não pisca entre
quadros.

**O índice em `clip.blend` É a posição em `VE.BLENDS`.** Mexer na ordem quebra
projeto salvo. Se um dia precisar de mais um modo, acrescente no fim.

Projetos gravados antes disto guardavam um número da lista antiga, de 21.
`VE.migraBlend` traduz na abertura, e `version` no arquivo subiu para 5.

### A equação de composição, e o bug que ela conserta

O código anterior misturava assim:

```glsl
col = blendMode(back.rgb, s.rgb, uBlend);
a   = s.a + back.a*(1.0 - s.a);
rgb = (col*s.a + back.rgb*back.a*(1.0 - s.a)) / a;
```

Isso ignora que o fundo pode ser **transparente**. Um `multiplicar` sobre nada
resultava em preto — e é exatamente daí que vêm as auréolas e as bordas sujas
em PNG e vídeo com transparência. A equação certa é a do W3C:

```
Cs' = (1 − αb)·Cs + αb·B(Cb, Cs)
αo  = αs + αb·(1 − αs)
Co  = ( αs·Cs' + αb·Cb·(1 − αs) ) / αo
```

O termo `(1 − αb)·Cs` é o conserto: onde o fundo é transparente a mistura não
acontece e a camada aparece como ela é. Verificado: `multiplicar` sobre quadro
vazio devolve a própria cor da camada, não preto.

### Preenchimento não é opacidade

Duas coisas diferentes, e a distinção só aparece fora do modo NORMAL:

* **opacidade** multiplica o alfa da camada — tira ela da frente;
* **preenchimento** interpola o RESULTADO DA MISTURA de volta para a cor da
  camada: `B' = mix(Cs, B(Cb,Cs), fill)`. Em 0 a camada continua inteira mas
  para de conversar com o fundo.

Medido com MULTIPLICAR, fundo 0.8 e camada 0.2: opacidade 0.5 dá 122;
preenchimento 0.5 dá 46; cheio dá 41.

### Espaço de cor

`layer.espaco` escolhe entre misturar no valor percebido (sRGB, que é o que o
Photoshop faz e o que a mão espera) e misturar em luz linear (que é o que a
física faz). A conversão é a sRGB de verdade, com o trecho linear perto do
preto — `pow(x, 2.2)` erra justamente na sombra, que é onde o vídeo mora.

Os quatro modos de COMPONENTE (matiz, saturação, cor, luminosidade) **ignoram
esse botão de propósito**: eles são definidos sobre a percepção, e calculá-los
em luz linear devolve cor errada.

Medido: somar dois cinzas 50% dá 255 (estourado) em sRGB e 176 em luz linear.

### Faixa de mescla (o "Blend If")

Quatro pontos por lado, em 0..1, para a própria camada e para o fundo:

```
lo0 → onde a camada começa a sumir no escuro
lo1 → onde ela já está inteira
hi0 → onde ela começa a sumir no claro
hi1 → onde já sumiu
```

Juntos, o corte é seco; afastados, a passagem é macia. O detalhe que exige
cuidado é o **valor de repouso**: piso em 0 e teto em 1 têm de significar
"não corta nada", e um `step()` ingênuo mataria o branco puro. Por isso
`faixaAbaixo` e `faixaAcima` devolvem 0 nesses extremos, explicitamente.

### Track matte

Uma camada empresta a silhueta para outra: alfa, alfa invertido, luma ou luma
invertido. Quem empresta **deixa de aparecer** — é a regra de qualquer
compositor, e está em `renderPlan` como o mapa `ehMatte`.

O matte é montado ANTES da camada que o consome, porque os dois usam o mesmo
par de quadros de trabalho (`clipA`/`clipB`). O resultado é copiado para
`matteT` e só então a camada é desenhada.

### Cache de camada estática

Uma camada PARADA — imagem ou tipografia, sem keyframe, sem áudio reativo e
sem efeito que leia `uTime`/`uPrev`/`uAudio`/`uStab` — desenha igual em todo
quadro. `VE.layerSig` gera uma assinatura curta do que afeta o desenho; se ela
não mudou, o motor devolve a textura guardada.

Quatro vagas, descarte pelo menos usado. Medido com quatro efeitos na pilha:
**0,38 ms → 0,07 ms, ganho de 5,4×**, e o pixel é idêntico.

### Máscaras da camada

Sete formas (retângulo, elipse, polígono, faixa H, faixa V, rampa, rampa
radial), quatro maneiras de combinar. Tudo por distância assinada, o que
deixa `expandir` ser dilatação/erosão de verdade em vez de mudar o desenho.

A primeira máscara encontra o acumulador vazio. Se ela for de SUBTRAIR ou
INTERSECTAR isso daria sempre nada, então nesses dois casos o acumulador
começa cheio — que é o que a pessoa quis dizer.

A máscara mora no **espaço do quadro**, igual à máscara de efeito que já
existia. É previsível e é o que o resto do programa já fazia.

### O que ficou de fora, e por quê

* **máscara à mão / bézier** — precisa de editor de caminho sobre a prévia,
  com pontos, alças e edição de vértice. Meia implementação disso é pior que
  nenhuma. As sete formas paramétricas cobrem quase todo uso e são animáveis;
  a de caminho entra quando houver o editor inteiro.
* **keyframe no modo de mistura** — é valor discreto. Interpolar entre
  "multiplicar" e "diferença" não quer dizer nada. O caminho certo quando
  precisar é duplicar a camada e cruzar as opacidades.
* **WebGPU** — o motor é WebGL2 e o gargalo medido não é a API. Trocar agora
  seria complexidade sem ganho. A arquitetura em etapas é o que permite
  trocar depois: cada etapa é uma função com entrada e saída declaradas.
* **curvas RGB desenháveis** — níveis, gama e as quatro zonas de tom cobrem
  o que curvas cobrem, sem exigir um editor de curva. Fica na lista.
* **WebCodecs** — a exportação atual funciona; entra quando for exportação
  o gargalo, não antes.

### Arquivos

| arquivo | o que é |
|---|---|
| `js/comp.js` | o MODELO: modos, camada, máscara, resolver no instante, assinatura |
| `js/compgl.js` | o GLSL: espaço de cor, 27 modos, faixa, máscaras, cor, e os três shaders |
| `js/compui.js` | a ficha: seletor com miniatura, lista de máscaras, matte, cor, canais |
| `js/gl.js` | o motor: `placePass`, `gradePass`, `maskPass`, `renderLayer`, `renderPlan` |

`comp.js` e `compgl.js` carregam **antes** de `gl.js`; `compui.js` depois de
`motion.js`.

### Verificado nesta passada

* 27 modos × 4 pares de cor = **104 comparações contra a fórmula em JS**,
  zero falhas, pior erro 0,002 (arredondamento de 8 bits);
* os 26 modos determinísticos são **mutuamente distinguíveis** nos quatro pares;
* dissolver: 1 / 993 / 2028 / 3076 / 4096 pixels em 0 / 25 / 50 / 75 / 100 %,
  e **estável entre quadros**;
* caminho rápido e caminho isolado devolvem **o mesmo pixel** (133,92,230);
* máscaras: união 1384 > subtração 580 > interseção 224; inverter devolve o
  complemento exato (3572 + 524 = 4096); expandir erode e dilata (188/524/1020);
* matte de luma: conteúdo só dentro da silhueta, fora fica alfa 0;
* canais: 255,64,0 → 0,64,255 na troca R↔B; dessaturar leva vermelho a cinza;
* exposição +1 parada leva 0,5 a 176, que é o valor correto em luz linear;
* keyframe em `layer.fill` e em `masks.0.x` interpola, e o motor recebe o
  valor animado;
* ida e volta pelo arquivo de projeto: **idêntica**;
* projeto versão 4 com `blend: 2` abre como **8 / Tela**, ganha `layer` e `masks`;
* desfazer funciona sobre as propriedades novas;
* **os 139 efeitos existentes continuam compilando, nenhum sai vazio, `glErr` 0.**

---

## 4h. Os guias dentro dos laboratórios

Cada laboratório ganhou um tutorial próprio, aberto pelo botão `? COMO USAR`
**no cabeçalho**, entre as abas e o seletor CLARO/NOTURNO. **Não é página nova**:
é uma gaveta que desliza por cima, o trabalho continua atrás, e `Esc` devolve a
pessoa onde ela estava.

**É um botão só, e ele sabe onde você está.** `data-guia=""` vazio faz
`G.abrir()` cair em `VE.shell.view`. Ele some no índice e no manual, que não têm
guia próprio — e isso é CSS puro, sem JavaScript:

```css
.guia-bt{ display:none }
:root[data-lab="video"] .guia-bt,
:root[data-lab="audio"] .guia-bt,
:root[data-lab="type"]  .guia-bt{ display:inline-flex }
```

A borda e o texto usam `--ch`, então o botão é azul no vídeo, verde no áudio e
vermelho na tipografia sem uma linha a mais.

Vídeo 16 passos · Áudio 13 · Tipografia 8.

### A decisão que faz ele crescer sem dor

Tudo vem de uma lista em `js/guia.js`. Acrescentar um passo é escrever um
objeto:

```js
{ t: 'TÍTULO CURTO',
  p: 'o texto. pode ter <b>negrito</b> e <k>tecla</k>.',
  faz: 'a frase que diz o que fazer AGORA',   // opcional
  img: 'nome-do-desenho' }                    // opcional
```

Numeração, bolinhas, "de X", navegação e a memória de onde a pessoa parou se
ajustam sozinhas. Nenhum outro arquivo é tocado. Era esse o pedido: *"esse
tutorial vai mudar ainda conforme for acrescentando coisas"*.

### Regras da escrita, porque tutorial com palavra de programa não ensina

* nada de "renderizar", "buffer", "parâmetro", "instanciar";
* um passo faz UMA coisa — se tem dois verbos, são dois passos;
* dizer o que a pessoa vai **ver acontecer**, não só o que clicar;
* imperativo, nunca "vamos";
* nome estranho do programa se explica na hora, com palavra de gente.

Cada passo termina numa caixa **FAÇA AGORA** com uma ação concreta. São 35 das
37 telas — as duas sem são as de apresentação, onde não há o que fazer ainda.

### A barra de espaço continua chegando no laboratório

De propósito. O guia captura `Esc` e as setas e para a propagação delas, mas
deixa o espaço passar: o passo diz "aperte espaço" e a pessoa tem de poder
apertar sem fechar nada. Verificado.

### Duas armadilhas que apareceram aqui

**Botão que muda de identidade.** O botão PRÓXIMO vira TERMINAR no último
passo e o `data-gir` muda de `'1'` para `'fim'`. Como eu usava `data-gir`
também para ACHAR o botão, a pintura seguinte procurava um seletor que ela
mesma tinha acabado de destruir — e o guia travava no passo 1 em silêncio.
Agora os botões têm `id` fixo e `data-gir` só diz o que fazer.

**`onclick` direto convivendo com ouvinte delegado.** Os dois disparavam: o
direto fechava, o delegado fazia `idx + Number('fim')` = `NaN`. Quem tem
ouvinte delegado não põe `onclick` no filho.


## 5. Pronto e verificado nas passadas anteriores

- **Canais**: `data-lab` troca em `home/tutorial/video/audio/type`; medido no
  navegador que trilho, `#stLab`, cursor e seleção assumem a cor certa nos quatro.
- **Vários clipes na mesma pista**: 4 clipes em V1 lado a lado, sem virar camada.
- **Camada de ajuste**: medido pixel a pixel — fora do intervalo a imagem fica
  intacta; dentro, invertida; ao arrastar a borda direita de 2 s para 3,5 s, o
  efeito passou a alcançar t = 3,0 s.
- **Efeito por clipe**: caminho de duas passadas confirmado (azul `27,79,216`
  vira `228,176,39` com `invert` só naquele clipe).
- **Arrastar e aparar** com eventos de ponteiro reais: mover 60 px a 120 px/s
  deslocou exatamente 0,500 s; aparar 40 px encurtou 0,333 s.
- **Keyframes**: interpolação com curva conferida (easeInOut no meio = 1,400) e
  gráficos de valor e velocidade desenhando.
- **Transições**: `mo_spin` a 0,4 s de uma transição de 0,8 s devolve giro −90°
  e opacidade 0,50; aplicar num corte marca os dois lados.
- **Cortar / duplicar / desfazer / refazer**: ok, inclusive keyframes indo cada
  um para o seu lado no corte.
- **Salvar e abrir**: ida e volta preserva 6 clipes, 5 pistas, 3 marcadores,
  4 transições, keyframes e efeitos.
- **Migração de projeto v3**: camada antiga virou clipe de vídeo com
  `motion.scale`; pista de efeito virou camada de ajuste.
- **69 shaders compilam**, incluindo os 8 novos de película. `gl.getError()` = 0
  em todos os testes.
- **30 filtros** geram 30 miniaturas distintas; trocar de filtro substitui em vez
  de empilhar.
- **12 famílias tipográficas** medem, desenham e escrevem: cobertura de tinta
  125 → 4.550 → 9.123 ao longo da animação de escrita.
- **PNG com alpha**: canto do quadro tem alpha 255 no painel e **0** na exportação
  e na fonte enviada à linha do tempo.
- **Tutorial**: entrada pelo cartão MANUAL 01 na coluna do índice (o corpo do
  índice passou a caber inteiro sem rolagem: 644px de conteúdo em 644 visíveis);
  12 seções, 10 passos práticos, diagrama em SVG, sumário lateral
  com destaque acompanhando a rolagem.
- **Coluna em abas**: medido que só um painel abre por vez, que ele recebe os
  401px que sobram, e que a lista de efeitos voltou a ter altura (239px, 69 itens)
  — antes era 0. Nada mais vaza para fora da coluna.
- **Galeria**: 30 miniaturas distintas tanto do quadro real quanto da carta de
  referência; prévia ao passar o mouse muda a prévia grande (199,153,124 → P&B
  193,172,158 → BRASA 246,143,70) e volta ao original ao sair; trocar de filtro
  substitui em vez de empilhar.
- **Coluna do LAB 03**: ferramentas com rolagem própria (867px de conteúdo em
  307 visíveis), agrupadas em FORMA (12) e ANIMAÇÃO (9), com busca; presets com
  altura limitada; **SAÍDA em 484..696, inteira dentro da coluna** — antes os
  quatro botões viviam entre 898 e 996, fora da tela.
- **Texto na composição**: `TYPE_001` entra em 00:00:05:00 na pista V2 com o
  vídeo em V1; ordem de composição medida como `FUNDO → TYPE_001`. Um segundo
  texto vai sozinho para V3.
- **Color engine**: os cinco looks passam em concordância GPU × referência JS
  (máx ΔE2000 0.98), giro de matiz de pele 0.4°–4.1°, zero clipping novo e
  erro de LUT 33³ entre 0.08 e 0.37. Perfis Log conferem no cinza médio com
  erro < 1e-16 (S-Log3 0.4106, LogC3 0.3910 — batem com os publicados).
  Três bugs achados pela própria medição e corrigidos: ombro da curva ancorado
  no branco errado, proteção de pele que só cobria as bandas, e clamp por canal
  no lugar de compressão de gamute. Ver COLOR-ENGINE.md.
- **Galeria de filtros, três bugs corrigidos** (achados testando P&B):
  a proteção de pele resistia à DESSATURAÇÃO, então um P&B guardava 40% da cor
  em todo matiz alaranjado e saía marrom; a tonalização multiplicava pela cor
  crua do tom, que escurece em vez de tingir; e ela vinha ANTES da saturação,
  que apagava o tom recém-aplicado. Medido depois: P&B com saturação 0.000
  exata, sépia e azulado tingindo (R−B +46 e −29).
- **Miniaturas congeladas**: o quadro de referência não muda mais sozinho —
  aplicar filtro e reproduzir não mexem na galeria; só o botão ↻ e mover o
  cursor com a composição parada. Antes era impossível comparar filtros.
- **Arquivo único**: 761 KB, abre e funciona igual à versão em pastas.

---

## 5b. Pronto e verificado na quarta passada

Tudo abaixo foi medido no navegador, com leitura de pixel ou de geometria — não
é "deve funcionar".

- **139 shaders compilam**, `gl.getError()` = 0 em todos. Eram 70.
- **37 dos efeitos novos renderizados e lidos de volta**: nenhum sai preto,
  nenhum sai NaN, nenhum estoura o quadro inteiro.
- **Estrelas de luz**: com quatro pontas em 0°, um ponto branco isolado num fundo
  escuro produz luz a 10 px (60,82,86) e a 25 px (59,44,57) na horizontal e na
  vertical, e **nada na diagonal** — a geometria da estrela está certa. Os
  valores desiguais entre R, G e B a distâncias diferentes confirmam a difração
  cromática. Com seis pontas a diagonal acende, como deve.
- **Estabilizador**: um padrão com estrutura nos dois eixos, deslocado 8 px na
  horizontal, foi medido como **7,97 px** com confiança 1,00. O controlador
  acumulou 6,6 px de correção no primeiro quadro e liberou devagar. Deslocamento
  vertical de −6 px medido como −4,63 px (perfil de barras espaçadas dá parábola
  pior; a malha fechada compensa nos quadros seguintes).
- **21 modos de mistura**: todos os 21 dão resultado distinto sobre o mesmo par
  de cores. Nenhum repete outro.
- **`VE.srcTime`**: normal 2× em t=2 → 1 e em t=4 → 5; reverso em t=2 → 9 e no
  fim → 1; vai-e-volta 1 → 5 → 1; congelado sempre 1. Confere com a matemática.
- **52 filtros da galeria** geram **52 miniaturas distintas** (assinatura de
  pixel), sem exceção e sem erro.
- **A miniatura em branco acabou**: abrir a aba dá 52 de 52 com imagem; trocar
  para a família PROCESSO dá 12 de 12, **sem apertar ↻**. Era o bug relatado.
- **Placas recolhíveis**: a setinha fecha (corpo com `display:none`) e reabre;
  recolher tudo fecha as 3 do clipe de ajuste e as 4 do clipe de imagem; abrir
  tudo devolve zero fechadas. O estado persiste em `localStorage`.
- **Campos da ficha**: escrever 5 em MISTURA deixa `clip.blend = 5`; escrever
  2,5 em duração deixa `clip.dur = 2.5`; escrever 1,5 em início deixa
  `clip.start = 1.5`. Antes da correção, os três não mudavam nada.
- **Limite da composição**: escrever 1800 no campo deixa `VE.MAXDUR = 1800`,
  rótulo "30 min", e grava `videorte.maxdur`. O botão de 10 min volta para 600.
  7200 vira "2 h".
- **Sobreposição**: a mídia entra em **V2 com o alvo em V1**, acima dele, com
  mistura TELA. O quadro composto renderiza com `gl.getError()` = 0, inclusive
  com uma cadeia de cinco efeitos novos (kira kira + eco temporal + cubik +
  realimentação + colorizar) empilhados no clipe de cima.
- **Animação de texto**: as **19 entradas** todas partem de menos tinta e
  chegam ao texto inteiro; as **11 saídas** todas reduzem a tinta no fim; os
  **10 laços** todos mudam o quadro entre dois instantes (onda foi conferida
  pelo centro de massa vertical: 554,6 → 542,3 → 513,5, porque translação
  rígida não muda a quantidade de tinta).
- **Catálogo**: 139 no "todos", 11 ao filtrar por instrumentos, e as oito
  famílias somam exatamente 139.
- **O manual**: os dois diagramas montam (604 px de largura numa seção de 760)
  e **não há rolagem horizontal na página**.

---

## 6. NÃO verificado (fica pra você testar)

- **Aparência montada.** O painel de navegador destas sessões não compõe
  quadros: nenhum screenshot foi possível do meu lado. Toda a auditoria é
  geométrica (medir elementos) e por pixel lido do WebGL.

  **O Bruno já abriu e olhou** — e valeu: foi assim que apareceram a sobreposição
  na coluna do LAB 01, o transbordo da coluna do LAB 03 e os três bugs do P&B.
  Nenhum dos três teria sido pego por medida automática, porque o código
  "funcionava": o que estava errado era o resultado visível. **Continuar abrindo
  e olhando depois de cada mudança é a verificação que eu não consigo fazer.**
- **Exportação em tempo real** — depende de `requestAnimationFrame`, que não roda
  nesse painel. O caminho frame a frame foi exercitado e funciona.
- **Arquivos reais seus** — de novo não havia MP4/JPG/WAV na máquina. Tudo foi
  testado com mídia gerada por código.

**Acrescentado na sétima passada:**

- **`requestAnimationFrame` não roda no painel.** Isso mordeu ao verificar a
  rolagem automática do arraste: os eventos de ponteiro chegavam e o clipe se
  movia, mas o laço de animação nunca dava um passo, e o teste parecia acusar
  bug onde não havia. A saída foi **trocar `window.requestAnimationFrame` por
  uma fila manual** e bombeá-la à mão — o código de produção rodou inteiro,
  só o relógio era meu. Vale para qualquer coisa animada que precise de prova.
- **O painel só tem tamanho dentro de um laboratório.** `getBoundingClientRect`
  devolve zero enquanto a vista está no índice, porque `#viewVideo` está
  escondido e os filhos não têm caixa. Antes de medir geometria: `VE.shell.go`
  para o laboratório certo, e só então medir.
- **Julgamento de imagem.** A matemática dos 27 modos está provada contra a
  fórmula, mas se um "luz suave" fica bonito num rosto, se a faixa de mescla
  integra sem parecer adesivo e se a luz linear vale a pena — isso é olho, e o
  olho é seu.
- **Onda de áudio na linha do tempo** — `VE.audio.peaksFor` decodifica a fonte em
  segundo plano; só foi exercitado o caminho "ainda não decodificou" (régua neutra).
- **Escrita à mão em texto longo** — testado com até 9 letras.
- **Duas ocorrências do mesmo vídeo tocando ao mesmo tempo** — o código clona o
  elemento por clipe (`media.elFor`), mas isso não foi medido com vídeo real.
- **O estabilizador com tremor de verdade.** A medição foi conferida com
  deslocamento sintético conhecido. Falta um vídeo tremido de mão para saber se
  a força e o vazamento padrão (0,85 e 0,03) são bons — e se a parada por quadro
  do `readPixels` incomoda na prévia.
- **Colorizar com um P&B de verdade.** Foi testado com carta e degradê. A
  separação de regiões depende de aspereza local e posição, então material de
  arquivo com muito grão pode confundir vegetação com textura de grão.
- **Reverso e vai-e-volta com vídeo real.** O cálculo do tempo da fonte está
  conferido; o posicionamento quadro a quadro de um MP4 comprimido pode ser lento
  em keyframes distantes.
- **As animações de texto olhando.** Foram medidas por quantidade de tinta e
  centro de massa. Nenhuma foi VISTA — se alguma ficar feia, é olhando que se
  descobre.
- **O laboratório de áudio OUVINDO.** Tudo foi medido por assinatura de
  amostras: os módulos mudam o sinal, os parâmetros mexem, os presets são
  distintos entre si. Nada disso diz se soa BEM. As reverberações, a matéria e
  a psicoacústica são os que mais dependem do ouvido.
- **Cadeias longas com arquivo grande.** ESPECTRAL custa de 100 a 240 ms por
  segundo de áudio estéreo. Num arquivo de três minutos com dois módulos
  espectrais a espera passa de um minuto — o aviso PROCESSANDO aparece, mas a
  aba fica pesada. É o caso que pede Worker.

---

## 7. Pendências, na ordem que eu faria

**As duas primeiras valem mais que todo o resto somado.** Tudo neste projeto foi
medido, mas medido com material gerado por código. O que ainda não passou por
aqui é mídia de verdade.

0b. **Mídia real no motor de composição.** Os 27 modos, o matte, as máscaras e a
   faixa de mescla foram conferidos com cores chapadas e texturas sintéticas —
   é o teste certo para a MATEMÁTICA, e ela está certa. O que falta é o teste
   da PERCEPÇÃO: vídeo com grão, pele, céu estourado, PNG com borda macia.
   Especialmente:
   · **auréola em PNG e vídeo com alfa** — a equação foi consertada, mas quem
     confirma é uma borda de cabelo sobre fundo claro;
   · **luz linear em material real** — somar e tela mudam muito, e a diferença
     só é julgável com imagem;
   · **faixa de mescla num céu branco de verdade**, que é o uso que a justifica.

**Deixado de fora na sétima passada, com motivo (ver §4g):**

0c. **Máscara à mão / bézier.** As sete formas paramétricas cobrem quase tudo e
   são animáveis. A de caminho precisa de editor sobre a prévia — pontos, alças,
   inserir e tirar vértice — e meia implementação disso é pior que nenhuma.
   Quando entrar, o shader já está preparado: basta rasterizar num canvas e
   amostrar como textura na unidade 8, que está livre.
0d. **Curvas RGB desenháveis.** Níveis + gama + as quatro zonas de tom cobrem o
   resultado; falta só o gesto de desenhar a curva.
0e. **Keyframe no modo de mistura.** É valor discreto — interpolar entre
   "multiplicar" e "diferença" não quer dizer nada. O caminho certo é duplicar
   a camada e cruzar as opacidades; se um dia virar pedido, é isso que se
   automatiza, não interpolação.
0f. **WebGPU / WebCodecs.** O gargalo medido não é a API. A arquitetura em
   etapas existe justamente para permitir a troca depois sem reescrever: cada
   etapa é uma função com entrada e saída declaradas.

0. **Áudio de verdade no laboratório 02.** Tudo foi conferido com tom gerado
   por código e buffers sintéticos. Uma música e uma gravação de campo é o
   que ainda pode revelar problema — sobretudo nos módulos ESPECTRAL e
   GRANULAR, que dependem do material.
1. **Testar com mídia real** — Reels 1080×1920, 16:9, 1:1, vídeo perto de 60 s,
   WAV/MP3, PNG transparente. É o que ainda pode revelar bug de verdade: até
   agora tudo foi testado com mídia gerada por código, e os vídeos que o Bruno
   usou nos testes eram `generated_video.mp4` de 640×480.
2. **Gráfico de velocidade editável.** Hoje o gráfico de velocidade é leitura; o
   de valor já arrasta keyframe. Falta manipular as alças de Bézier no gráfico.
3. **Nesting de ida e volta.** `VE.nestSelection` cria a composição e a coloca
   como clipe; falta **entrar** na composição para editá-la e renderizá-la
   (hoje um clipe `kind:'comp'` não desenha o conteúdo).
4. **Sincronizar áudio por forma de onda.** A arquitetura permite; só o modo
   "por início" está feito.
5. ~~Áudio reativo ligado nos shaders~~ — feito: `uAudio` (nível, grave, médio,
   agudo) está no PRELUDE e ligado em toda passada de efeito. O RUÍDO GENERATIVO
   já o usa; falta espalhar por mais efeitos.
6. **Desfazer no laboratório de áudio** (o de tipografia já tem). O `↶` da
   mutação existe, mas não cobre mexer num controle à mão.
7. **Importar/exportar presets em arquivo** — `exportAll/importAll` existem, falta botão.
8. **Minúsculas de verdade nas famílias geométricas.** Hoje minúscula vira
   versalete; a manuscrita tem minúscula desenhada.
9. **Tablet/notebook menor** — abaixo de 900px a lateral some; dá pra fazer melhor.

---

## 7b. Distribuição, publicação e cobrança

Conversado na terceira passada. Nada disso está implementado — são decisões de
rumo que se perderiam se ficassem só na conversa.

**Separado é o que se edita; o arquivo único é entrega.** 17 mil linhas num HTML
só seria inviável para trabalhar. O arquivo único existe por outro motivo: abre
com clique duplo, sem servidor, funciona de pendrive e não quebra por falta de
um arquivo. Os dois formatos têm razão de existir; o único nunca se edita à mão.

**O site sobe sem ajuste.** Conferido: nenhum caminho absoluto, nenhuma
suposição de `file://`, e o único recurso externo é o Google Fonts. O que
subiria são `index.html + assets/ + css/ + js/` ≈ **830 KB**. A pasta
`REFERENCIAS` (503 MB) **não** vai junto.

**Se publicar na web, publicar os SEPARADOS**, não o arquivo único: 763 KB num
download bloqueante, e qualquer correção de vírgula invalida tudo no cache.

**Domínio (pesquisado, confirmar antes de fechar).** `.com.br` no Registro.br,
~R$40/ano — registro oficial, sem revendedor e sem jogo de preço na renovação.
Hospedagem estática é **grátis** (Cloudflare Pages, Netlify, Vercel): o site não
precisa de servidor para nada. Evitar TLDs de promoção (`.xyz`, `.site`) que
renovam por 10× o primeiro ano.

**Cobrar pelo acesso: a restrição é dura.** Um app 100% no navegador **não tem
como ser trancado** — quem salva a página, tem a ferramenta. Login na frente do
editor atrapalha quem paga e não segura quem não paga. O que funciona:

1. cobrar pela **conveniência** (grátis com limite de duração, marca d'água,
   resolução; pago libera) — contornável em tese, quase ninguém contorna;
2. vender **o que não é o software**: pacotes de `.cube`, as famílias
   tipográficas, os estilos;
3. mover para servidor só o que for **pesado** (render final, projetos na
   nuvem) — nunca o editor;
4. apoio recorrente.

**Não quebrar o processamento local para monetizar.** É o diferencial real
contra Canva e Adobe Express, que sobem tudo. Vale mais como argumento de venda
do que qualquer DRM valeria como proteção.

**Passo barato para não travar o futuro** (não feito, decisão do Bruno): uma
camada fina `VE.plan.pode(x)` / `VE.plan.limite(x)`, tudo liberado por padrão,
para o código perguntar em vez de assumir. Hoje `MAXDUR` é usado em 23 lugares e
a exportação tem regra própria; com a camada, "implementar planos" vira ligar um
interruptor em vez de refatoração grande.

---

## 8. Como continuar o código

**Efeito novo**: copie um bloco `D({...})` no arquivo da FAMÍLIA dele — fx7
(cor e percepção), fx8 (tempo e espaço), fx9 (glitch e pixel), fx10 (pintura e
instrumentos). Ponha o `cat` da família e a cor dela. Declare `params` — cada um
vira controle sozinho — e escreva `vec3 fx(vec2 uv)`. Máscara, intensidade,
fades e keyframes vêm de graça. Se mexer na transparência, use `alpha: true` +
`vec4 fx4(vec2 uv)`. Se precisar de um trecho GLSL compartilhado com outros
efeitos, ponha em `pre`. Se precisar de ALCANCE grande — borrão largo,
raia longa, brilho espalhado — use `passes: N` e escreva `fxStep`/`fxLast`
em vez de `fx`: ver a seção 4d.

O PRELUDE já entrega, além do básico: `histcol(n, uv)` para os quatro quadros
guardados, `uAudio` para o som do instante, `box3`, `roughness`, `gradient`,
`rgb2hsl`/`hsl2rgb`, `huedist`, `voronoi` e `fbm3`. Antes de escrever um
borrão ou um Sobel do zero, procure ali.

**Transição nova**: um bloco `def({...})` em `js/transitions.js`. A função `mod`
recebe `(lado, progresso, params)` e devolve `{op, dx, dy, sc, scx, scy, rot,
crop, fx}`. Não precisa de shader.

**Filtro novo**: uma linha `f('id','NOME','FAMÍLIA', {...})` em `js/filters.js`
— os valores são parâmetros do efeito `filmstock`. Se o filtro precisar de mais
de um efeito (matriz de canais, curva por canal, separação de cor), use
`c('id','NOME','descrição', [{fx, p}, …])`: é uma CADEIA, e entra inteira.

**Família tipográfica nova**: um bloco em `FACES` no `js/typefaces.js`. Reaproveita
o esqueleto `GEO` ou `SCRIPT` e muda só os parâmetros. Glifo novo = um caminho
SVG numa caixa de 0..100 (0 = topo da maiúscula, 100 = linha de base).

**Módulo de áudio**: um `VE.audio.register(mod, proc)` em `js/audiofx.js`. O
`mod` descreve nome, família e parâmetros; o `proc` diz como processa —
`buf(b, v)` para transformar o buffer, `node(off, last, v)` para entrar no
grafo, mais `tail` e `rate` se fizerem sentido. NÃO mexa em `A.rerender()`:
ele percorre a lista sozinho, na ordem do rack.

Se o parâmetro só valer em certos modos, declare `when: { k: 'tipo', vals: [4] }`
e ele some quando não vale. A matemática pesada vai para `js/audiodsp.js`.

**Ferramenta de tipografia**: entrada no array `TOOLS` de `js/type.js`, com
`g: 'forma'` ou `g: 'anim'`. Uma animação nova de letra é um caso novo dentro de
`animAt()` mais um nome em `T.ENTRADAS`, `T.SAIDAS` ou `T.LACOS` — a lista e o
índice do `switch` têm de andar juntos.

**Placa nova no inspetor**: use `VE.panels.plate(titulo, corpo, extra, opts)`.
Construir `<div class="plate">` à mão deixa o bloco sem a setinha de recolher.

---

## 9. Armadilhas que já me morderam

**Propriedade com CONVERSÃO tem um dono só.** `motion.opacity` é GUARDADA em
0..1 e MOSTRADA em 0..100 % — a tabela `CONV` de `motion.js` faz a tradução, e o
ouvinte compartilhado de `[data-mrange]` aplica `cv.from(v)` na escrita. A ficha
da COMPOSIÇÃO desenhou um trilho próprio em 0..1 para ela, e o ouvinte dividiu
por 100: arrastar até 0,1 gravava **0,001**. A camada sumia da tela sem sumir da
linha do tempo, que é o pior tipo de bug — parece que o vídeo quebrou.

O conserto é estrutural, não pontual: `motion.js` passou a exportar `M.prop` e
`M.temConv`, e `linha()` em `compui.js` delega para o dono quando o caminho tem
conversão. Quem desenhar controle para `motion.*` ou `volume` em qualquer lugar
novo tem de fazer o mesmo.

**`.prow` é uma grade de três colunas: `1fr 54px 16px`.** A segunda é para o
número e a terceira para o losango de animação. Pôr um BOTÃO na terceira coluna
faz ele chegar cortado na tela, e alargar a janela não resolve — a coluna é fixa
em pixel. Quem precisa de largura usa `.prow.wide` (uma coluna só) para o rótulo
e `.prow-slider` para o controle. Foi o que aconteceu com o ESCOLHER do modo de
mistura.

**Alvo de clique pequeno demais não existe para quem chega agora.** A setinha de
recolher tinha 14×14 com glifo de 9px e nenhuma moldura: quem nunca tinha visto
não sabia que dava para clicar. Passou a 22×22 com moldura e fundo, e o TÍTULO
da placa também recolhe — é onde a mão vai antes de procurar a seta.


- **GLSL ES 3.0 tem palavras reservadas** que parecem inocentes: `active`,
  `sample`, `filter`, `input`, `output`, `image`, `buffer`, `common`, `half`.
  Use `onRow`, `take`, `col`, `res`, `half_`.
- **`String.replace` interpreta `$'`, `$&`, `` $` ``** no texto de substituição.
  Ao montar o arquivo único, os substitutos são **funções**, não strings.
- **Efeitos com realimentação** (`echo`, `smoke`, `datamosh`) leem `uPrev`.
  Ao pular no tempo é preciso `renderer.clearPrev()`.
- ~~A lista de scripts está em dois lugares~~ — resolvido: o build lê do index.html.
- **`e.target.closest` quebra em evento sintético** disparado na `window`: o alvo
  não é elemento. O handler do cursor já está protegido.
- **Eventos de rolagem não disparam** no painel de navegador desta sessão. Por
  isso o sumário do manual também roda numa batida lenta, não só no `scroll`.
- **`requestAnimationFrame` também não roda ali**, então `renderer.ready` fica
  falso. A galeria não depende mais disso: ela força um `renderNow()` antes de
  copiar o quadro. Ao medir a interface por script, espere o boot terminar de
  verdade — ele chama `S.go('home')` no fim e desfaz qualquer `go()` prematuro.
- **Efeito que parece "não funcionar"** costuma ser calibragem de padrão numa
  fonte clara demais. Teste com contraste/exposição na frente.
- **Trigonometria dentro de laço de espectro é fatal.** Um `atan2` mais um par
  seno/cosseno por faixa e por quadro viram treze milhões de chamadas num
  arquivo de vinte e quatro segundos. Se a operação só escala faixas, use
  ganho sobre a parte real e a imaginária e não reconstrua o quadro.
- **Cauda de reverberação superdimensionada custa em TUDO o que vem depois.**
  Reservar seis segundos para uma sala de 0,9 s fazia o módulo seguinte
  processar cinco segundos de silêncio.
- **Base de `pow` nunca pode chegar a zero.** `pow(0.0, y)` devolve NaN nesta
  GPU dentro de laço, e um NaN apaga o quadro inteiro. Ver 4e.
- **Varredura ao longo de uma direção precisa de passo menor que a fonte.** Um
  reflexo de 3 px cai no vão entre amostras espaçadas de 4 px, e a raia sai
  furada — furada de um jeito que muda com a resolução, então o que parecia bom
  em 256 px ficava horrível em 1280. Alcance grande pede `passes`, não mais
  amostras.
- **Campo que aparece no inspetor não é campo que funciona.** Sete deles ficaram
  meses desenhando e não fazendo nada porque a ligação vivia num escopo que só
  rodava com um efeito aberto. Ao acrescentar um campo, escreva o valor pela
  interface e leia o clipe de volta.
- **Normalização de efeito de brilho é onde ele morre.** A primeira versão das
  estrelas de luz dividia a soma pelo número de PONTAS e usava um decaimento
  elevado a dez: o resultado era um pixel de diferença. Cada pixel recebe luz da
  ponta em que ELE está — normalize pelo número de amostras de uma ponta.
- **`fxfam.js` tem de ser o último dos fx.** Ele varre `VE.FX` para reetiquetar;
  qualquer efeito registrado depois fica fora das oito famílias.

---

## 4i. A OITAVA PASSADA — mosaico de emoji, legendas, tinta e sessão guardada

### O que entrou

**1. MOSAICO DE EMOJI** (`js/fx2.js`, efeito `emoji`, família PIXEL).
Primo do ASCII com uma diferença que muda tudo: o ASCII escolhe a figura pelo
BRILHO da célula, este escolhe pela **COR**. Por isso a imagem continua sendo a
imagem — céu com figuras azuis, fogo com figuras laranja — em vez de virar uma
rampa colorida.

Como a busca fica barata: `Renderer.atlasEmoji` desenha as figuras num atlas com
fundo TRANSPARENTE, lê a **cor média** de cada uma de volta do canvas (ponderada
pela cobertura) e monta uma tabela **16×16×16 achatada em 256×16** — cor →
figura mais parecida. O shader faz **uma leitura** (`figuraDaCor`, no PRELUDE)
em vez de percorrer 64 comparações por pixel. A comparação da tabela é feita em
**OKLab**, na CPU, onde dá para usar matemática de verdade.

O efeito é `alpha:true`: com "recortar o fundo" ele devolve transparência real,
não branco.

Sobre "emoji do iOS": o desenho vem da **fonte de emoji do sistema**. Num Mac ou
num iPhone é literalmente o conjunto da Apple; num PC é o da Microsoft. Nenhuma
fonte de emoji pode ser embutida no arquivo único — são obras protegidas de
terceiros. Isso está dito na descrição do efeito.

O motor deixou de perguntar `id === 'ascii'` em dois lugares: quem quer atlas
declara `atlas` na definição do efeito, e `Renderer.atlasPara` despacha.

**2. LEGENDAS** (`js/legendas.js`). Uma legenda é um **clipe** (`kind:'legenda'`)
numa pista de vídeo comum marcada com `tr.legenda = 1`, que a linha do tempo
rotula **C1**. Herda de graça arrastar, aparar, dividir, keyframes, opacidade,
mistura e a composição por camadas. O desenho sai de **uma fonte só** (tipo
`legenda`) que redesenha o texto DO CLIPE que está sendo montado — o `render`
recebe o clipe, e por isso não há uma fonte por frase.

O **estilo é da PISTA** (`tr.estilo`), não do clipe: é o "estilo de faixa" do
Premiere, e é o que faz trocar a fonte de duzentas legendas ser um clique.

Entradas: escrever na ficha, **colar um texto** (vira legendas cronometradas por
caracteres/segundo, com corte em frase → vírgula → espaço) e **abrir .srt/.vtt**.
Saídas: .srt, .vtt, ou embutida no vídeo exportado, porque é camada como outra.

Não há transcrição automática, e é decisão, não falta: ela exigiria mandar o
áudio para um servidor, e a barra de estado promete PROCESSAMENTO LOCAL.

**3. ESCREVER À MÃO** (`js/tinta.js` + `js/tintaui.js`). As famílias LAB já eram
traço com comprimento conhecido, e era isso que fazia a escrita à mão existir.
Aqui o caminho vem do **dedo** em vez do alfabeto, e a mesma revelação
progressiva o desenha de volta.

O traço bruto passa por **média móvel** (tira o tremor) e **Ramer–Douglas–Peucker**
(tira o ponto que não muda a forma) — 301 leituras viram 33 pontos sem perder o
arco. Vira **curva** (Catmull-Rom → Bézier), não reta, senão parece escada em 4K.
Tudo guardado em **fração de tela**, para servir a 1080 vertical e a 4K
horizontal sem redesenhar.

Um detalhe que parece pequeno e não é: o caminho vive em 0..1 e a tela raramente
é quadrada. Escalar o CANVAS por (W,H) deixaria o traço **oval** — grosso na
horizontal, fino na vertical. Escala-se só a GEOMETRIA (o Path2D entra numa
DOMMatrix) e a espessura fica em pixels de verdade.

**4. SESSÃO GUARDADA** (`js/autosave.js`). Não é localStorage, e a razão é dura:
o localStorage guarda TEXTO. O projeto caberia; os vídeos não. E sem os vídeos o
projeto volta vazio, porque `VE.deserialize` descarta todo clipe cuja fonte
sumiu — que é exatamente o que aconteceria depois de um F5. **IndexedDB** guarda
Blob de verdade, então guarda as duas metades: `estado` (o JSON de
`VE.serialize`) e `midia` (um registro por fonte com o arquivo original dentro).

Na volta as fontes entram **primeiro**, com o mesmo id de antes, e só depois o
projeto é lido. Nada restaura sozinho: uma faixa pergunta, com VOLTAR PARA ELA
e COMEÇAR DO ZERO. Webcam não volta (é dispositivo ao vivo) e camada do
laboratório de tipografia volta como IMAGEM — o aviso diz isso.

**5. Cadeado e ícones da pista.** Os botões do cabeçalho eram quadradinhos de
15 px com um caractere dentro (▪ ▫ ◉ ◌): dava para clicar, não dava para
reconhecer. Viraram desenho — olho, cadeado, alto-falante, estrela, seta — em
21 px, com o cadeado FECHADO em vermelho, que é o estado mais perigoso da pista.
A coluna passou de 170 para 196 px. O mesmo cadeado serve à ficha do clipe.

### Cinco armadilhas desta passada — todas achadas por MEDIDA

1. **A matriz OKLab estava com um coeficiente com a vírgula no lugar errado**
   (`-0.2428…` em vez de `-2.4285…`). O código compilava, rodava, não dava erro
   e devolvia distâncias plausíveis — só que o componente `a` saía em 1,37 em
   vez de 0,27, e o mosaico escolhia marrom para vermelho E para verde. Só
   apareceu quando a tabela foi lida de volta da GPU e comparada com o esperado.

2. **`mod(gi, cols)` devolve `cols` quando `gi` é múltiplo exato**, nesta GPU.
   A leitura cai fora do atlas, o alfa volta zero e **o quadro inteiro fica
   preto**. O sintoma era só a cor de índice 21 (💚, num atlas de 7 colunas)
   sumir — todas as outras funcionavam. Existe agora `celulaAtlas(gi, cols)` no
   PRELUDE, e o ASCII passou a usá-la também: ele tinha o mesmo defeito, com um
   nível de cinza saindo vazio.

3. **`getCoalescedEvents()` pode devolver lista VAZIA**, e lista vazia é valor
   válido em JavaScript — `|| [ev]` não a substitui. O traço ficava com um ponto
   só. Testar o TAMANHO, não a existência.

4. **`getBoundingClientRect` do palco devolve zero antes da primeira pintura**,
   e a folha de escrever nascia com dois pixels, colapsando o desenho inteiro num
   ponto. Existe agora uma medida de recurso pela proporção interna do canvas,
   e a folha remede quando a janela muda.

5. **`<input type="color">` precisa escrever nos DOIS eventos.** Guardar só no
   `input` funciona enquanto se arrasta o seletor e perde a cor escolhida pelo
   teclado, que manda apenas `change`. Vale para a ficha de legenda e para a
   barra de tinta.

### Dois defeitos antigos corrigidos de passagem

- **`VE.deserialize` nunca restaurava `p.name`.** O nome ia no arquivo desde
  sempre e voltava como "composição".
- **O vídeo piscava ao arrastar a agulha**, mostrando o fundo transparente.
  Causa: escrever em `currentTime` derruba `readyState` para 1 até o quadro novo
  chegar, e `buildPlan` fazia `return` — a camada SUMIA nesse vão. Agora o motor
  guarda quais texturas já receberam um quadro (`Renderer.texUltima`) e repete o
  último em vez de apagar a camada. Junto: `A.seek` só limpa a memória de quadros
  em salto maior que 0,35 s, senão os efeitos de TEMPO piscavam a cada movimento
  do arrasto.

### Medido nesta passada

```
shaders que compilam ............ 140 de 140 (o uAtlasInfo virou vec4)
mosaico, escolha por cor ........ vermelho→🔴  verde→💚  azul→💙  branco→🤍
                                  preto→⬛  amarelo→💛  laranja→🔶  roxo→💜
                                  rosa→❤️  marrom→🟤     (11 de 11 coerentes)
recorte de fundo ................ alfa medido de 0 a 255 (transparência real)
agulha, readyState 1 ............ camada PRESENTE (antes: ausente)
                                  sem quadro anterior: ausente, como deve
legenda no quadro montado ....... 3862 px no canvas = 3862 px no readback
estilo de faixa ................. muda as 4 legendas da pista de uma vez
ida e volta .srt ................ 4 legendas, tempos e textos idênticos
ficha da legenda ................ 25 de 25 campos escrevem no modelo
tinta, suavização ............... 301 pontos → 33, arco preservado (0,327)
tinta, precisão do traço ........ x[89,530] contra x[93,527] esperado
tinta, espessura ................ 8 px na vertical e 8 px na horizontal,
                                  igual em 16:9 e em 9:16 (sem oval)
escrita crescendo ............... 2968 → 9608 → 17948 px, avançando à direita
sessão guardada, ida e volta .... fonte com o MESMO id, posição, trava,
                                  efeito, legendas, estilo e texto de volta
composição com tudo junto ....... 3 camadas (legenda + tinta + vídeo/emoji),
                                  136 cores distintas no quadro final
ícones da pista ................. 21×21 px (antes 15×15), coluna 196 px,
                                  51 px sobrando para o nome
```

### O que NÃO foi feito, e por quê

- **Máscara com caneta** — FEITA na passada seguinte. Ver a seção 4j.
- **Máscara por I.A.** — ver a seção 11.
- **Transcrição automática de fala** — decisão, não falta: ver acima.

---

## 13. Máscara por I.A. — o que existe hoje (pesquisa de 21/08/2026)

A pergunta foi: dá para fazer o recorte de objeto com inteligência artificial,
por API? Dá, e há três caminhos com custos muito diferentes.

**a) Dentro do navegador, de graça, sem servidor — MediaPipe Tasks Vision.**
O `InteractiveSegmenter` do Google recebe um CLIQUE (ou um risco) e devolve a
máscara do objeto ali. É estatal: `setImage` uma vez, `segment` quantas vezes o
usuário clicar. Roda em WASM+WebGL, modelo de poucos megabytes. É o único
caminho que não fere a promessa de PROCESSAMENTO LOCAL da barra de estado.
Limite: é por QUADRO. Não propaga a máscara no tempo — o rotoscópio continua
sendo do artista, a I.A. só adianta o primeiro traçado de cada quadro-chave.

**b) Dentro do navegador, mais pesado — SAM 2 em ONNX/WebGPU.**
O Segment Anything 2 tem memória temporal: marca-se o objeto num quadro e ele
PROPAGA a máscara pelos seguintes, que é rotoscópio de verdade. Já existem
versões rodando 100% no navegador com `onnxruntime-web` e WebGPU. O preço é o
tamanho: o codificador é o pedaço grande, e o suporte a WebGPU ainda é
experimental. Entraria como download opcional, nunca dentro do arquivo único.

**c) Por API paga, fora da máquina.**
Runway (a partir de ~US$ 15/mês por créditos) e Adobe Firefly Services (sem
tabela pública; acesso por contrato empresarial) fazem rotoscópio por I.A. com
qualidade de produção. Custam dinheiro por uso, exigem chave, e — o ponto que
decide — **mandam o vídeo do Bruno para o servidor de outra empresa**.

**Recomendação.** Se um dia entrar, que seja (a): é grátis, é local, é pequeno e
casa com o resto do projeto. E que entre como um BOTÃO DENTRO da máscara de
camada que já existe ("marcar objeto"), gerando os pontos do traçado livre —
não como uma tela nova. Ou seja: a máscara com caneta vem primeiro; a I.A. é
uma forma de preencher os pontos dela.

Fontes: `developers.google.com/edge/mediapipe/solutions/vision/interactive_segmenter`,
`github.com/lucasgelfond/webgpu-sam2`, `docs.ultralytics.com/models/sam-2`.

---

## 4j. A CANETA DE MÁSCARA (nona passada)

A forma **7 — CANETA** entrou no mesmo sistema de máscara de camada que já
existia. Não é uma segunda máscara nem um segundo painel: é mais uma forma na
lista, com os mesmos SUAVIDADE, EXPANDIR, OPACIDADE, INVERTER e os mesmos
quatro modos de combinar.

### O modelo

A caneta é a única forma de contorno variável. Em vez de largura e altura, tem
uma lista de **pontos** (`m.pts`), em coordenadas do quadro. Nela `x`,`y`
deslocam o traçado inteiro, `w` é ESCALA e `h` não é usada.

Cada vértice é animável pelo caminho `masks.<i>.pts.<j>.x` — e isso não exigiu
motor novo, só ensinar `layerRead`/`layerWrite` a atravessar mais dois níveis do
caminho. `resolveLayer` passa cada vértice por `valueAt`, então um ponto com
keyframe anda enquanto os outros ficam parados. É rotoscopia de verdade.

### No shader

`sdCaneta` devolve **distância COM SINAL** ao polígono: negativa dentro,
positiva fora. O sinal dá o recorte; o módulo alimenta suavidade e expansão,
que assim funcionam iguais às das outras formas. Fosse um teste de
dentro/fora puro, a caneta seria a única máscara de borda dura da casa.

Os vértices de todas as máscaras de caneta da camada moram num **reservatório
só** (`uniform vec2 uPts[64]`); cada máscara leva no seu `m3` onde a sua fatia
começa e quantos pontos tem. Assim oito máscaras cabem num uniforme, e uma
máscara que não couber simplesmente não desenha, em vez de invadir a fatia da
vizinha.

**A referência dos vértices é FIXA em (0,5 / 0,5)** enquanto a do ponto lido é
`x`,`y`. Se as duas se movessem juntas, arrastar a máscara não moveria nada —
as duas se cancelariam.

### Na prévia

Os vértices aparecem sobre a imagem: **quadrado** quem não tem keyframe,
**losango amarelo** quem tem. Arrastar move; clicar numa aresta põe um ponto
novo ali; **alt+clique** tira um. O valor mostrado é sempre o ANIMADO, não o
guardado — senão, num traçado com keyframes, os pontos apareceriam no lugar do
primeiro quadro enquanto a imagem já está noutro instante.

Escrever passa por `P.setValue`, que grava keyframe quando o ponto está animado
e valor direto quando não está. É isso que faz o fluxo funcionar: MARCAR TODOS
AQUI no primeiro quadro, avançar o cursor, arrastar — o keyframe seguinte nasce
sozinho.

### Duas armadilhas

1. **O Y do shader sobe; o Y da tela desce.** O primeiro teste deu área certa
   (6,4 % contra 6,1 % esperados) e posição espelhada: o triângulo do canto de
   baixo aparecia no de cima. A volta tem de ser feita no ÚLTIMO passo, só na
   conversão para pixel — se for feita antes, a rotação sai espelhada junto.

2. **`trocaKeys` e `reindexaKeys` remontavam o caminho com `k.split('.')[2]`.**
   Para `masks.0.feather` funcionava; para `masks.0.pts.3.x` jogava fora o
   vértice e sobrava `masks.0.pts`, um caminho que não existe. Reordenar ou
   remover uma máscara apagaria a animação do traçado em silêncio. Agora é
   `.slice(2).join('.')`.

Acrescentar e remover vértice também mexem nos keyframes: inserir empurra os
índices seguintes, remover apaga os do vértice e puxa o resto. Sem isso, a
animação passaria a mexer no vértice errado no meio da cena.

### Medido

```
recorte (triângulo em 0,10 · 0,45) . dentro 255 · direita 0 · cima 0
                                     além da hipotenusa 0
área .............................. 6,4 % contra 6,1 % esperados
vértice na tela ................... [26, 230] contra [26, 230] esperado
ida e volta tela↔máscara .......... 0,100 / 0,100 (exato)
animação (3 vértices, 2 keys cada) . centro em x: 55 → 100 → 145
                                     área constante em 6,4 % nos três
inserir vértice em 1 .............. keys 0 ficam, 1→2, 2→3, novo sem key
remover vértice 2 ................. keys do 2 somem, nenhum key órfão
as oito formas ainda recortam ..... 18,5 / 14,5 / 16 / 43 / 43 / 50,4 / 3,5 / 13,3
caneta SUBTRAINDO de elipse ....... 64,9 % → 52,7 % (abriu o buraco)
shaders que compilam .............. 140 de 140
```

### O que faltava na caneta

Os lados eram RETOS. Isso foi resolvido na passada seguinte — ver 4l.

---

## 4k. Onde a SESSÃO GUARDADA mora, de verdade

Pergunta que apareceu e merece resposta escrita: o IndexedDB acumula arquivo no
computador?

**Onde fica.** No perfil do navegador, por site (origem). No Chrome do Windows,
sob `AppData\Local\Google\Chrome\User Data\<perfil>\IndexedDB\`. É disco, não
memória. **Não é o cache de páginas**: limpar "imagens e arquivos em cache" não
mexe nele; só sai por "cookies e dados de sites" — ou pelo botão APAGAR A
SESSÃO, que agora existe na ficha da COMPOSIÇÃO.

**Acumula?** Não. Cada gravação faz `clear()` na loja de mídia e regrava só o
que o projeto usa AGORA. Guarda **uma** sessão, não um histórico. O tamanho é o
tamanho dos vídeos em uso — um vídeo de 500 MB ocupa 500 MB, e é por isso que a
ficha mostra o número.

**E se não couber?** O navegador reserva uma cota por site (medida aqui: 2,9 GB).
Estourar dava erro engolido e um selo dizendo GUARDADO que era mentira — o pior
desfecho possível. Agora, quando não cabe, o motor guarda **só o projeto** (que
é pequeno: cortes, efeitos, legendas, traçados) e diz na tela que as mídias
terão de ser recarregadas. O selo da barra de estado fica **vermelho** quando a
última gravação falhou.

**Some sozinho?** Por padrão o armazenamento é "melhor esforço" e o navegador
PODE descartá-lo sob pressão de disco. O rgb_lab agora pede
`navigator.storage.persist()` no arranque; se o navegador conceder, a ficha diz
"permanente", e se negar, diz "melhor esforço". Dizer qual dos dois é o ponto —
a sessão guardada é conveniência contra o F5, e o arquivo de projeto continua
sendo a cópia de verdade.

---

## 4l. A CANETA, agora com CURVA (décima passada)

A primeira versão da caneta era polígono: vértices ligados por retas. O Bruno
olhou e disse o que era — "ainda fica geométrico". Estava certo. Uma caneta sem
alça de Bézier não é caneta, é polígono com nome bonito.

### O que mudou no modelo

Cada vértice ganhou **duas alças**: `hix,hiy` (a que puxa a curva que CHEGA) e
`hox,hoy` (a que puxa a que SAI), guardadas como deslocamento a partir do
próprio ponto. Zero nas quatro é canto vivo, e é assim que ele nasce. `canto`
diz se as duas são independentes; fora dele, mexer numa espelha a outra, que é
o que mantém a curva lisa ao atravessar o vértice.

As alças **também são animáveis** (`masks.<i>.pts.<j>.hox` e companhia) e vão
junto no MARCAR TODOS AQUI. Sem isso, animar um traçado curvo moveria os
vértices e deixaria as curvas para trás — o contorno se deformaria sozinho no
meio da cena.

`m.aberta` marca o traçado que ainda está sendo desenhado. E a caneta passou a
nascer **vazia**: antes ela vinha com um quadrilátero pronto, o que empurrava
para "arraste os quatro cantos" em vez de "desenhe o que você quer".

### Curva no shader sem pagar Bézier por pixel

Distância com sinal a uma Bézier cúbica é cara e mal condicionada. Em vez de
ensinar isso ao shader, a curva é **picada em segmentos na CPU**
(`VE.maskTesselar`), uma vez por quadro: o shader continua medindo distância a
um polígono, que é barato, e a curva vem de graça.

A picagem é adaptativa pelo tamanho do trecho na tela, e **trecho sem alça
continua sendo um segmento só** — quem faz reta não paga curva. Medido: um
quadrado reto sobe 4 pontos; o mesmo quadrado suavizado sobe 48.

Isso estourou o uniforme antigo (`vec2 uPts[64]`), e o mínimo garantido de
vetores de uniforme em WebGL2 são 224 — as outras linhas da máscara já comem
trinta e duas. Os pontos passaram para uma **textura de ponto flutuante**
(`RGBA32F`, 256×1) lida com `texelFetch`, que não filtra, não interpola e não
tem teto de uniforme. A textura é uma só, reescrita com `texSubImage2D` a cada
quadro — criar textura por quadro seria alocação à toa.

### Na prévia

Dois estados, como em qualquer caneta:

- **desenhando** — cada clique põe um vértice; **arrastar ao clicar** puxa a
  alça e o trecho já nasce curvo; clicar no ponto verde (o primeiro) ou
  **Enter** fecha; **Esc** tira o último;
- **editando** — arrastar move o vértice; clicar num trecho põe vértice ali;
  **alt+clique** tira; clicar num ponto mostra as **duas alças azuis**, que
  arrastadas abaúlam o traçado. **Alt** ao arrastar a alça quebra a simetria e
  faz canto vivo no meio de uma curva.

O contorno desenhado em SVG usa `C` onde há alça e `L` onde não há — a mesma
Bézier que o shader recebe picada. O que se vê é o que recorta.

As alças aparecem **só do vértice escolhido**. Mostrar todas deixa a imagem
ilegível, e é por isso que nenhum editor de curva faz isso.

Na ficha: **SUAVIZAR TUDO** dá alça a todos os vértices na tangente de
Catmull-Rom (o "suavizar nó" de qualquer editor de curva), **RETO** tira todas,
e cada linha da lista tem um botão para curvar aquele vértice sozinho.

### Medido

```
picagem da curva ............... quadrado reto 4 pontos · suavizado 48
                                 círculo de 40 vértices → 80 pontos (teto 256)
quadrado RETO .................. borda esquerda em 0,298 em TODA altura
quadrado SUAVIZADO ............. borda de 0,282 → 0,251 → 0,282 (arco)
                                 área 16,5 % → 22,1 % → 27,8 % com alça maior
uma alça só, num trecho só ..... a borda de baixo vira arco (0,263→0,192)
                                 e os outros três lados continuam retos
círculo de 40 vértices ......... área 28,6 % contra 28,3 % de um círculo
desenhar clicando .............. 4 cliques → 4 vértices · arrastar no 3º
                                 curvou SÓ o 3º · Enter fechou
contorno em SVG ................ mistura C e L, fecha com Z
alças na tela .................. 2 bolinhas, só no vértice escolhido
                                 arrastar uma espelha a outra
rotoscopia com curva ........... 24 keys (4 vértices × 6 propriedades),
                                 centro 128 → 141 → 179, área estável 22,1 %
projeto antigo (pontos sem alça)  recorta normalmente; campos completados
as sete formas antigas ......... 18,5 / 14,5 / 16 / 43 / 43 / 50,4 / 3,5
shaders que compilam ........... 140 de 140
```

### Armadilha desta passada

**Uma alça que puxa para dentro e outra que puxa para fora quase não mudam a
ÁREA.** O primeiro teste mediu área antes e depois de arrastar uma alça, viu
16,5 % → 16,4 % e concluiu que a alça não funcionava. Funcionava: um trecho
abaulava para fora e o vizinho para dentro, e os dois se cancelavam na conta.
Só a varredura do CONTORNO (onde começa o branco, altura por altura) mostrou a
verdade. **Para provar mudança de forma, meça a forma, não a área.**

---

## 4m. O CAMINHO DO TRAÇADO como uma coisa só (décima primeira passada)

A caneta ganhou curva na passada anterior, e a animação continuou sendo **um
cronômetro por vértice**, numa lista lateral. Funcionava e era confuso — o
Bruno olhou e disse: "achei confuso, faça igual ao do Premiere". Estava certo,
e a razão é simples: **ninguém pensa "vou animar o ponto 5"**. Pensa "vou
animar o recorte".

### O modelo mental que passou a valer

Uma linha só na ficha — **CAMINHO DO TRAÇADO** — com um losango grande que liga
a animação do contorno inteiro, e o `‹ ◆ ›` ao lado para navegar. É o
"Caminho da máscara" do Premiere, e o fluxo é o mesmo:

1. acerta o traçado no primeiro quadro;
2. clica no losango — a forma daquele instante fica gravada;
3. anda com o cursor e corrige. **Cada mexida vira keyframe sozinha.**

Nenhum clique a mais. O losango do meio grava ou tira a pose deste instante, as
setas pulam de uma pose a outra, e desligar o losango grande congela o traçado
no que está NA TELA — nunca no que estava guardado, senão desligar a animação
faria a forma saltar.

### O que segura isso por dentro: POSE ATÔMICA

Os keyframes continuam por propriedade — `masks.0.pts.3.hox` e companhia — que
é o que o motor sabe interpolar. O que mudou é que agora são escritos e
apagados **em bloco**: num instante marcado, TODOS os vértices e TODAS as alças
têm valor gravado.

Isso não é capricho. Sem a pose atômica, mover um vértice em t=1 criaria
keyframe só para ele, e os outros continuariam interpolando entre as poses
vizinhas — o contorno se desmancharia sozinho enquanto a mão arrasta um ponto,
que é o pior jeito possível de descobrir o problema. Por isso
`VE.compui.canetaPose` roda no `pointerdown`, ANTES de qualquer arrasto,
sempre que a animação está ligada.

Três casos de borda que precisaram de conta explícita:

- **Vértice novo num traçado já animado** (`canetaCompletarPoses`): ele tem de
  existir em todas as poses, senão nasce sem valor e o contorno pula. Como ele
  não se move, o valor é o mesmo em todas.
- **Vértice removido**: os keyframes dos índices acima escorregam um, como já
  era; agora o bloco inteiro anda junto.
- **Desligar a animação** (`canetaDesanimar`): grava nos pontos o valor
  RESOLVIDO no instante atual antes de apagar os keyframes.

### A ficha, antes e depois

```
ANTES                            AGORA
lista com um ◆ por vértice       CAMINHO DO TRAÇADO
"MARCAR TODOS AQUI"                ◆  3 keyframes   ‹ ◆ ›
                                 VÉRTICES
                                   1  0.450, 0.818   ◠  ✕
                                   2  0.562, 0.728   ∟  ✕
```

A lista de vértices continua, mas só com o que é dela: coordenada, o botão de
curvar aquele vértice sozinho, e remover. Cronômetro, nenhum.

### Medido

```
ficha ......................... 1 cronômetro · 0 por ponto · 3 de navegação
ligar em t=0 .................. 24 keys (4 vértices × 6 propriedades) = 1 pose
andar até 2 s e arrastar ...... virou 2 poses SOZINHO, sem clicar em nada
andar até 4 s e arrastar outro  3 poses, e a de t=4 está COMPLETA:
                                todo vértice e toda alça com valor
recorte ao longo do tempo ..... centro em x: 102 → 107 → 111 → 119 → 126
                                (5 instantes, sobe sempre)
‹ e › ......................... de t=3 vai para 2 · depois para 4
◆ do meio ..................... acende em cima de keyframe · tira (3→2) ·
                                põe de volta (2→3)
vértice novo com animação ..... 5 pontos, 3 poses, o novo completo em todas,
                                e a animação não pulou
desligar ...................... keys zerados e a forma congelou EXATAMENTE
                                onde estava na tela (8,6 % · cx 112 em
                                qualquer instante)
shaders que compilam .......... 140 de 140
```

### A lição, que vale para o resto do produto

O primeiro desenho estava correto e era ruim de usar. Dar um controle a cada
peça de uma coisa é o caminho mais fácil para quem escreve e o mais difícil
para quem usa. Quando o usuário pensa numa coisa só — o recorte, a legenda, o
traçado — a interface tem de oferecer **uma alavanca só**, e resolver por
dentro a papelada de manter as dezenas de valores coerentes.

---

## 4n. A garrafa que atravessa o quadro (décima segunda passada)

Dois relatos do Bruno, os dois certos, e o primeiro deles apontava um defeito
de verdade.

### 1. "só aceita se a máscara estiver sempre do mesmo tamanho e forma"

O sintoma: mexer na ESCALA (ou em MOVER X/Y, ou em ROTAÇÃO), avançar a linha do
tempo, e o botão de gravar keyframe não fazer nada de útil.

A causa: o grupo do CAMINHO DO TRAÇADO cobria só os vértices (`pts.*`). Mover,
escalar e girar a máscara ficaram de fora — e eles **mudam a forma na tela
tanto quanto arrastar um ponto**. Sem keyframe, `setKeyable` gravava valor
ESTÁTICO, que vale para o clipe inteiro; a escala do quadro 0 mudava junto; e
`canetaPose` no instante seguinte lia valores idênticos aos da pose anterior.
O keyframe novo nascia igual ao velho, e a impressão era de que o botão
recusava qualquer forma diferente.

Agora o grupo é **`pts.*` mais `x`, `y`, `w`, `ang`**. Qualquer coisa que mude o
desenho na tela entra na mesma pose.

Medido: ligar em t=0, escalar para 1,6 em t=3 → duas poses, escala 1,0 em t=0 e
1,6 em t=3, e o recorte cresce de 9,5 % para 23,8 % ao longo do tempo. Gravar
mais uma pose em t=5 funciona.

### 2. "queria selecionar tudo e acompanhar o traçado durante o vídeo"

O pedido, com o exemplo dele: contornar uma garrafa e **ir junto com ela**, sem
caçar doze vértices a cada quadro. Faltavam dois gestos.

**Arrastar por dentro leva o traçado inteiro.** Existe agora um alvo com a FORMA
do contorno, por baixo dos vértices, que dá cursor de mover e recebe o arrasto.
Ele mexe em `x`/`y` da máscara e não nos vértices: **uma propriedade em vez de
setenta e duas**, com o mesmo desenho na tela e um keyframe muito mais magro.
Quem decide se o clique caiu dentro é `VE.maskContem`, cruzamento de raio sobre
o contorno JÁ ACHATADO — o mesmo que o shader mede, então a resposta bate com o
recorte.

**Escolher vários vértices.** `canetaSels` é a lista; `canetaSel` continua sendo
o ATIVO, o que mostra as alças. Arrastar um vértice que faz parte da escolha
move o grupo inteiro. Os gestos:

- **arrastar por fora** do traçado → laço de seleção (retângulo tracejado ciano)
- **shift+clique** num vértice → junta ou tira da escolha
- **SELECIONAR TUDO / NENHUM** na ficha
- vértice escolhido fica ciano; o ativo ganha o aro cheio

### Medido

```
grupo do caminho ............. pts.* + x, y, w, ang
escalar em t=3 ............... 2 poses · escala 1,0 em t0 e 1,6 em t3
                               recorte 9,5 % → 23,8 %
gravar pose em t=5 ........... [0, 3, 5]
SELECIONAR TUDO .............. 4 de 4 · rótulo confere
arrastar UM vértice .......... os quatro andaram 0,156 juntos
                               keyframe nasceu sozinho em t=2
arrastar POR DENTRO .......... masks.0.x de 0,500 para 0,656
                               keyframe nasceu sozinho em t=4
recorte ao longo do tempo .... cx 89 → 109 → 129 → 149 → 169
laço por fora ................ pegou os 4
shift+clique ................. tirou um (4 → 3)
dentro/fora .................. centro true · canto false
as oito formas ............... 18,5 / 14,5 / 16 / 43 / 43 / 50,4 / 3,5 / 8,6
shaders que compilam ......... 140 de 140
```

### O que isso ensinou sobre a pose atômica

A pose atômica (todos os valores gravados num instante) já existia e foi ela que
salvou este caso: quando `x` e `w` entraram no grupo, tudo o mais continuou
funcionando sem uma linha a mais, porque `canetaPose` percorre o grupo e não
uma lista escrita à mão em três lugares. Grupo declarado num sítio só é o que
permite crescer sem quebrar.

---

### Um defeito que só aparece rotoscopando: a curva ENTRE poses

`VE.setKey` grava com `easeInOut` quando ninguém diz o contrário, e para
animação inventada isso é o certo. Para RASTREIO é errado, e o erro é visível:
uma garrafa que atravessa o quadro em velocidade constante, com poses
suavizadas, faz a máscara FRENAR ao chegar em cada pose e ARRANCAR ao sair.
Entre dois keyframes o recorte atrasa e depois alcança.

As poses do caminho passaram a nascer `linear`, e a ficha ganhou
**ENTRE POSES: RETO / SUAVE** para trocar todas de uma vez.

Medido, com duas poses e um deslocamento de 0,4 em x — fração do caminho
percorrida em 0 %, 25 %, 50 %, 75 % e 100 % do tempo:

```
RETO  (linear)     0 · 0,250 · 0,500 · 0,750 · 1    velocidade constante
SUAVE (easeInOut)  0 · 0,157 · 0,500 · 0,843 · 1    atrasa 9 pontos no
                                                    primeiro quarto
```

Repare que no MEIO os dois dão 0,5 — foi por pouco que isto não passou
despercebido. **Medir só o meio de uma curva simétrica não distingue as duas.**
É irmão da armadilha da área contra o contorno, da passada da Bézier: a medida
tem de ser escolhida para poder FALHAR.

---

## 4o. O DOSSIÊ, e a verdade sobre o desenho dos emoji

### `node dossie.js`

Gera dois arquivos que não se editam à mão:

- **`DOSSIE.md`** (~173 KB) — um arquivo só com as diretrizes (`PROJETO.md`), o
  manual (`LEIA-ME.md`), o motor de cor (`COLOR-ENGINE.md`) e um **inventário
  lido do código naquele instante**. É o que se entrega a quem chega ao
  projeto, pessoa ou assistente, sem ter estado nele.
- **`DOSSIE.json`** (~39 KB) — só o inventário, em dados.

O inventário é **gerado, nunca escrito**: contar efeito, família, forma de
máscara e módulo lendo o código é a única forma de o documento não passar a
mentir em uma semana. Ele traz a ordem real dos scripts (que é arquitetura, não
acaso), o cabeçalho de cada módulo, o catálogo de efeitos e as armadilhas.

**Armadilha do próprio gerador:** a primeira versão contava a família pelo
`cat:` escrito no efeito, e dizia 6 efeitos em PIXEL quando são 15. A categoria
do código-fonte **não é** a família: `fxfam.js` reetiqueta em tempo de execução
pela tabela `MOVE` e depois por `LEGACY`. O gerador agora lê as duas tabelas e
aplica a mesma tradução — e a soma por família bate com o total (140).

### Emoji: qual desenho sai, de verdade

O mosaico não tem imagem própria. Ele desenha com a **fonte de emoji instalada
na máquina**. Num Mac ou iPhone, é literalmente a da Apple; num PC, a da
Microsoft (Segoe UI Emoji). A fonte da Apple é obra protegida e **não pode ser
embutida** no arquivo único — nem essa nem nenhuma outra.

O efeito ganhou um seletor **Desenho do emoji** (do sistema · Apple · Microsoft ·
Google Noto · Twemoji · OpenMoji · outra instalada, com campo livre para o
nome). A escolhida vai na frente da pilha e a do sistema fica atrás — se ela não
existir, o mosaico continua desenhando em vez de sair em quadradinhos.

**Armadilha da detecção:** `document.fonts.check` **não serve** para isto. Ele
devolve verdadeiro sempre que o navegador consegue desenhar o caractere de
algum jeito, e emoji sempre tem recurso de reserva — a primeira versão jurava
que a fonte da Apple estava instalada num PC com Windows.

A pergunta foi trocada. Em vez de "está instalada?", que é difícil de responder
no navegador e pouco útil, `VE.emojiFontesDisponiveis()` responde **"escolher
esta muda o desenho?"** — desenhando a mesma amostra com as duas pilhas e
comparando os pixels.

```
controle positivo (serif × monospace, texto) .... 1476 px de diferença
controle negativo (a mesma pilha duas vezes) ....    0
emoji, mesma pilha ..............................    0
emoji por fonte de texto × fonte de emoji ....... 3734
limiar usado ....................................   60
```

Medido no PC do Bruno (Windows 11): **nenhuma** das nomeadas muda o desenho —
todas caem no Segoe UI Emoji. É a resposta honesta, e é a que a ficha dá.

---

## 4p. O ARQUIVO DE PROJETO COMPLETO (.rgblab)

Havia dois jeitos de guardar e nenhum servia para o caso mais óbvio de todos —
*"salvo aqui, abro amanhã naquela outra máquina"*:

| | guarda a edição | guarda os arquivos | atravessa máquina |
|---|---|---|---|
| `.json` (SALVAR PROJETO, antigo) | sim | **não** | não |
| sessão guardada (IndexedDB) | sim | sim | **não** |
| **`.rgblab` (novo)** | sim | **sim** | **sim** |

O `.json` abria num lugar sem as mídias e **descartava os clipes em silêncio**.
A pessoa achava que tinha perdido o trabalho, quando na verdade tinha escolhido
o formato errado — e ninguém tinha dito qual era a diferença.

### O formato, e por que não é zip nem base64

Base64 engorda 33 % e obriga a montar uma string gigante na memória: um vídeo de
500 MB viraria 660 MB de texto e o navegador engasga. Zip exigiria biblioteca, e
este projeto não tem dependência.

É um recipiente simples, que o navegador monta **sem carregar nada na memória**
(um `Blob` aceita outros `Blob` como pedaços) e lê **fatiando** (`Blob.slice`
não copia bytes):

```
bytes 0..7     "RGBLAB01"
bytes 8..11    uint32 little-endian = tamanho do cabeçalho
bytes 12..     cabeçalho em JSON (utf-8)
depois         os arquivos, crus, um atrás do outro, na ordem do cabeçalho
```

O cabeçalho traz o projeto inteiro (o mesmo de `VE.serialize`) e o índice das
partes. **O id da fonte é o que costura tudo** — é por ele que o clipe acha a
mídia, e é por isso que `VE.media.recriar` devolve a fonte com o id que ela
tinha. Fonte que volta com id novo é clipe descartado.

`ABRIR` decide pelo **selo do arquivo**, não pela extensão: nome de arquivo é
palpite, os primeiros oito bytes não são.

### Uma duplicação que virou função

A sessão guardada já sabia remontar fonte a partir de blob com id fixo. O
arquivo completo precisava exatamente do mesmo. Em vez de copiar, o
`repor` do `autosave.js` virou `VE.media.recriar` — as duas usam. Cópia dos dois
lados divergiria no primeiro conserto.

### Medido

```
ida e volta com 1 arquivo ...... 3 clipes, nome, motion.x, trava, efeito,
                                 máscara de caneta com curva, 22 keyframes
                                 e 2 legendas — TUDO igual
três arquivos de tamanhos
diferentes ..................... 7991 / 19741 / 12983 bytes
                                 voltaram com os MESMOS bytes e dimensões,
                                 cada clipe com o SEU arquivo
                                 (aritmética de deslocamento conferida)
tamanho do recipiente .......... 45157 = 40715 de mídia + 4442 de cabeçalho
o reaberto DESENHA ............. brilho 41, 9 cores distintas, não é preto
.json sem as mídias ............ 0 clipes — e agora a mensagem explica
                                 que faltou o formato completo
sessão guardada (regressão) .... continua voltando com o recriador comum
shaders ........................ 140 de 140
```

---

## 4q. A EXPORTAÇÃO ESTAVA QUEBRADA EM QUATRO LUGARES

O relato foi *"parece que só exporta 1 segundo"*. Eram quatro defeitos
diferentes, todos no mesmo caminho, e três deles falhavam **em silêncio**.

### 1. O arquivo tinha a duração do RENDER, não da composição

Medido: composição de 6 s, modo exato, render em 1937 ms → **arquivo de
1,605 s**, com tudo acelerado três vezes.

O `MediaRecorder` **não aceita que se diga em que instante cada quadro
acontece**. Ele carimba pelo RELÓGIO DE PAREDE, na hora em que o quadro chega.
O modo exato desenhava o mais rápido que conseguia, e o arquivo saía com a
duração do tempo de máquina.

A saída é dar o passo do relógio: o quadro `i` só é entregue quando o relógio
chega em `i/fps`. O modo exato passou a levar o tempo da composição — que já
era verdade no modo em tempo real, e é o preço honesto de um gravador que só
sabe carimbar pelo relógio. Se a máquina não acompanhar, o arquivo sai **um
pouco mais longo**; longo é chato, acelerado três vezes é lixo.

### 2. A trilha de áudio morta engolia a gravação inteira

`A.getAudioTracks()` devolvia a trilha de um `MediaStreamAudioDestinationNode`
**com nada ligado nele**. Um destino sem entrada, ou num `AudioContext`
suspenso, não entrega amostra nenhuma — e o `MediaRecorder`, esperando áudio
que nunca vem, devolvia **arquivo vazio**. Medido aqui: "nada foi gravado" no
tempo real, enquanto o modo exato (sem áudio) gravava normalmente.

Três consertos:
- um **mantenedor de silêncio** (`ConstantSourceNode` em ganho zero ligado ao
  destino) que mantém a trilha viva a custo nenhum;
- `VE.app.prepararAudio()`, que **espera** o `resume()` — que é assíncrono e
  depende de gesto da pessoa — antes de gravar;
- o áudio só é acrescentado se estiver **mesmo pronto**; se não estiver, grava
  sem som e **diz isso na tela**, em vez de devolver arquivo vazio.

### 3. `captureStream(fps)` depende de o navegador ACHAR que o canvas mudou

Essa heurística falha em janela que não está compondo, em aba de fundo e em
máquina ocupada — e o sintoma é arquivo curto ou vazio, calado. Os dois modos
passaram a **empurrar o quadro** (`captureStream(0)` + `requestFrame()`): o
quadro existe porque nós dissemos que existe. No tempo real o empurrão é
ritmado pelo fps pedido — a tela pode desenhar a 144 Hz, e gravar 144 quadros
por segundo num arquivo pedido a 30 só engorda o arquivo.

### 4. `Math.max(1, NaN)` é NaN, e um laço comparado com NaN não termina

`var frames = Math.max(1, Math.round(total * fps))`. Com `fps` inválido — um
`<select>` com valor trocado por fora basta — `frames` virava `NaN`, `i >= NaN`
era falso para sempre e a **exportação de PNG não parava**. O progresso
escrevia "png 18 de NaN" e o navegador ia ficando pesado. Achado por acidente,
com um teste que pediu 12 fps a um seletor que só tem 24, 30 e 60.

Agora há um filtro de entrada (`num()`, com padrão e limites) e uma função
`quadros()` que garante inteiro ≥ 1, usada pelos dois laços.

### E o que faltava acima de tudo: CONFERIR

Nenhum dos quatro se anunciava. O painel agora **mede a duração do arquivo que
saiu** e compara com a da composição, com o veredito na tela:

```
✓ arquivo com 5.97s · a composição tem 6.00s          (verde)
saiu curto: ... tente resolução menor, menos fps...   (laranja)
saiu longo: ... a máquina não desenhou no ritmo       (amarelo)
```

### Medido depois dos consertos

```
exato · webm · 6 s ......... 5,97 s  ✓   (antes: 1,60 s)
exato · webm · 3 s ......... 2,96 s  ✓
tempo real · webm · 4 s .... 4,23 s  ✓   (antes: nada foi gravado)
tempo real · webm · 3 s .... 3,30 s  ✓
tempo real · mp4 · 3 s ..... 3,28 s  ✓
sequência png · fps inválido  terminou em 30 quadros, sem NaN
                              (antes: laço sem fim)
```

---

## 4r. FERRAMENTAS DA ILHA, TRECHO DE SAÍDA, VIDRO E RADIOGRAFIA

### Ferramentas com letra (V C B H)

A linha do tempo passou a ter MODOS, com as letras que toda ilha usa:

```
V  seleção     mover, aparar, escolher
C  tesoura     clicar num clipe corta ali
B  ondulação   aparar fechando o vão que sobra
H  mão         arrastar a linha do tempo
Ctrl/Cmd+K     corta no cursor SEM trocar de ferramenta
```

A tesoura vem ANTES de tudo no tratador de clique: no modo tesoura o clipe não
se seleciona nem se arrasta, a ferramenta manda. O Ctrl+K existe porque é assim
que se corta na prática — o modo tesoura serve para cortar em vários pontos
seguidos, olhando a imagem.

**Aparar arrastando a borda já existia** e ninguém via: a alça tinha 7 px e
nenhuma marca. Agora tem 10 px e um risquinho que aparece ao passar o mouse
sobre o clipe. Com a ferramenta B (ou segurando alt), aparar ONDULA — puxa o
resto da pista junto, sem deixar buraco.

### O trecho que sai (I / O)

As marcas de entrada e saída existiam na régua e serviam para levantar trecho —
**mas a exportação as ignorava** e gravava a sequência inteira. Receber duas
horas quando se marcou meio minuto é a pior surpresa possível.

Agora `EX.faixa()` decide num lugar só, e os três laços de exportação (tempo
real, exato, sequência PNG) andam deslocados pelo início do trecho. O painel
mostra uma tarja amarela quando há trecho marcado, com o botão EXPORTAR TUDO ao
lado — sair só um pedaço tem de ser decisão vista, não descoberta.

### `js/fx11.js` — VIDRO, VIDRO CHANFRADO e RAIO-X

A física dos três cabe em três linhas: o vidro tem uma ALTURA que varia pela
superfície; a NORMAL dessa altura desvia o raio que atravessa; e o desvio cresce
com a ESPESSURA. Por isso o controle se chama espessura e não "quantidade" —
ele é a coisa. A normal sai por diferença finita no próprio shader, e uma
superfície nova é uma linha a mais em `altura()`.

**VIDRO** tem oito superfícies (canelado, canelado ondulado, martelado, bolha,
chuva, gelo, tecido, água parada), espessura, largura da cana, direção,
irregularidade, **fosco** (borra o que está atrás, com custo, por isso tem
controle), brilho e sombra de quina, **dispersão de cor** (vidro de verdade
separa as cores nas quinas — é o que impede o efeito de parecer só um borrão
com relevo), sujeira e movimento.

**VIDRO CHANFRADO** faz painéis com bisel na borda, em grade ou em losango, com
**ALAGAR** — o painel inteiro embaça, e não só a quina. Sem alagar é uma janela
limpa recortada; com alagar é aquele vidro de porta.

**RAIO-X** usa Beer-Lambert de brinquedo: a saída cai exponencialmente com a
densidade vezes a espessura, o que dá a lavagem das partes finas e o corte seco
das grossas. O contorno acende porque o raio atravessa mais matéria na tangente
do que de frente — é isso que faz a chapa parecer chapa.

### Medido

```
143 de 143 shaders compilam
vidro, espessura 0 .......... 0 % diferente da fonte  (sem desvio, como deve)
vidro, espessura 2,5 ........ 46 % diferente          (o desvio é real)
fosco 0 → 0,9 ............... 3 % → 100 % de meio-tom num xadrez puro P&B
chanfro, 8 painéis em 256 px  período medido 32 px, força 1,000
alagar 0 → 0,9 .............. 9 % → 76 % de meio-tom
raio-x ...................... onde era preto 131 · onde era branco 28
                              (a densidade inverteu, como numa chapa)
tesoura ..................... clique a 160/400 de 10 s cortou em 4,00 s
seleção ..................... o mesmo clique NÃO corta
teclas ...................... c→corte b→ondula h→mão v→seleção (e maiúsculas)
Ctrl+K ...................... cortou em 6,00 s sem trocar de ferramenta
I e O ....................... marcam, e a exportação passou de 20 s para 6 s
```

### O que ficou de fora desta passada, e por quê

- **Letras recortadas** (tipo jornal, animadas, com acento) — é um módulo novo
  no laboratório de tipografia, e prefiro fazer inteiro a fazer pela metade.
- **Voz tipo Voicebox** — ver a seção 12: não é questão de tempo, é de o
  navegador não poder.
- **Engenharia reversa do VHS do nando.mp4** — as duas páginas dele são Wix e
  não renderizam no painel de navegador destas sessões; não consigo abrir para
  comparar. O nosso VHS pode ser melhorado pelo próprio mérito, mas não por
  cópia do que não deu para ver.

---

## 12. Voz tipo ElevenLabs no laboratório de áudio (pesquisa)

`github.com/jamiepine/voicebox` é **aplicativo de desktop**: Tauri (Rust) na
casca, FastAPI (Python) no motor, e os modelos rodando em PyTorch ou MLX — 
Qwen3-TTS, Kokoro, Chatterbox, LuxTTS para a fala; Whisper para a escuta; um
Qwen3 local para reescrever texto. **Não roda em navegador** e pede GPU ou uma
CPU boa. Licença MIT.

Portar isso para o rgb_lab, que é HTML/CSS/JS sem dependência e sem servidor,
não é trabalho grande: é impossível pelo caminho dele.

O que o navegador dá, e vale a pena:

| o quê | como | limite honesto |
|---|---|---|
| **fala do sistema** | `speechSynthesis` — as vozes do Windows, em português | toca no alto-falante e **não dá para gravar** direto: a API não expõe a saída ao Web Audio |
| **transformação de voz** | Web Audio, no rack que já existe: mudança de tom sem mudar duração, deslocamento de formante, vocoder, sussurro, coro, telefone, rádio | nenhum — é onde está o valor real, e roda hoje |
| **TTS de verdade no navegador** | Kokoro-82M por `transformers.js` com WebGPU | download de 80 a 320 MB de um CDN; fere o arquivo único e o "processamento local" |
| **clonagem de voz** | — | precisa de modelo grande e treino; não cabe |

**Recomendação:** o caminho certo é a **transformação de voz** sobre o que o
microfone já grava — o laboratório de áudio já tem 26 módulos e um rack; falta
uma família VOZ. Isso é rgb_lab. Ler texto em voz sintética é bonito de
demonstrar e não se consegue nem gravar.

---

## 4s. LETRAS RECORTADAS e TIRAS DE PAPEL

### `js/recorte.js` + `js/recorteui.js`

A ideia inteira cabe numa frase: **cada letra é um pedaço de papel
diferente**. Não é uma fonte — é um sorteio por letra. Se dois "A" saíssem
iguais, o efeito morre na hora e vira fonte com textura.

Cada pedaço sorteia, a partir de uma **semente própria**: tipo de letra, caixa,
papel, tinta, textura, tamanho, giro, sobra de papel em volta e o recorte da
borda. A semente é **guardada**, e isso importa por dois motivos: o desenho sai
igual a cada quadro (senão tremeria sozinho, sem se pedir), e dá para
re-sortear UMA letra sem mexer nas outras.

**Papel e tinta andam juntos**, num sorteio com peso. Recorte de jornal é preto
sobre creme e sai muito; manchete de revista é branco sobre cor chapada e sai
pouco. Sortear papel e tinta separadamente daria amarelo sobre creme, e sortear
sem peso daria arco-íris — as duas coisas matam o ar de recorte.

**A borda não é retângulo**: é um polígono de dez pontos com deslocamento
pequeno. Tesoura em papel de jornal não faz linha reta nem faz rasgo — faz uma
reta com hesitação, e é esse meio-termo que engana o olho.

**O gesto que manda: arrastar a letra.** Cada pedaço guarda o próprio
deslocamento, e quem foi movido fica **preso** — o re-sorteio geral não o joga
de volta para a linha. Sem isso, arrumar a mensagem e clicar no dado desfaria o
trabalho. `shift` arrastando gira; duplo clique re-sorteia só aquela letra.

**Acentos** vêm de graça porque o pedaço é medido pelo glifo DE VERDADE
(`actualBoundingBoxAscent`), não por altura fixa: o papel do `Ã` nasce mais alto
que o do `A` para o til caber.

Quatro estilos de animação — **CAOS** (troca o recorte e treme), **STOP MOTION**
(só treme), **PULSO**, **PARADO** — com velocidade, amplitude de tremor e
**dessincronizar**. Em compasso parece máquina; fora de compasso parece mão.

**Auto-ajuste**: sem ele, escrever uma frase com o tamanho de uma palavra joga
metade das letras para fora do quadro — e o pedaço que sai não avisa, some.

### `tiras` — a colagem em tiras (fx11)

A parte que faz o efeito ser o efeito não é o corte: é o **tempo**. Numa colagem
de papel o artista imprime várias fotos e intercala; aqui cada tira lê a memória
de quadros num atraso próprio, e o rosto aparece gritando numa tira e calado na
vizinha. Por isso o efeito mora na família TEMPO e não na de espaço.

Controles: número de tiras, direção do corte, vão, deslize, largura irregular,
**atraso entre as tiras**, como o tempo se espalha (alternado, rampa, sorteado,
do centro), espelhar tiras alternadas, cor do vão, sombra e grão de papel.

### Medido

```
oito "A" seguidos ........... oito combinações diferentes de fonte+papel
mesmo pedaço, dois sorteios . idêntico (a semente segura)
acento ...................... papel do Ã com 217 px · o do A com 194
arrastar .................... 60/40 px exatos, e a letra fica presa
shift arrastando ............ girou sem mover
SORTEAR ..................... respeitou a letra arrastada
ENDIREITAR .................. devolveu para a linha
CAOS ........................ trocou o papel entre t=0 e t=1
STOP MOTION ................. manteve o papel E continuou tremendo
PARADO ...................... não treme
auto-ajuste ................. 3, 11, 32 e 35 letras couberam em 620×620
                              desligado, o texto longo vai de −1439 a 2055
clique depois do ajuste ..... continua achando a letra certa
tiras, 16 tiras em 256 px ... período medido 16 px (exato)
deslize ..................... 13 % dos pixels mudaram
144 de 144 shaders compilam
```

---

## 4t. TIRAS DE PAPEL: dois defeitos que o Bruno pegou usando

Ele disse "não estou conseguindo fazer aqui". Estava certo — o efeito tinha
dois defeitos, e os dois eram meus.

### 1. A memória de quadros só cobria 66 milésimos

O anel guarda QUATRO quadros. A 60 por segundo, isso são 66 ms. A colagem de
referência mostra momentos com **segundos** de diferença. As quatro lembranças
eram quadros vizinhos: a diferença existia e era invisível.

Existe agora um **passo da memória** (`Renderer.passoHist`): de quantos em
quantos quadros um é guardado. Com passo 30, os quatro cobrem um, dois e três
segundos. Fica em 1 por padrão — quem não pede não paga, e eco continua eco.

Quem pede é o EFEITO: declarar `hist` na definição diz de quantos em quantos, e
o maior pedido do quadro vence. Nenhum ajuste global, nenhum arquivo novo.

### 2. A tira lia a SI MESMA

Este é o bom. O anel guarda o quadro **já composto, com os efeitos dentro** — é
o que o eco quer, porque eco é realimentação. Para uma tira que quer ver outro
momento, é veneno: ela lê a si mesma do quadro anterior, que leu a si mesma do
anterior, e a recursão termina no preto com que o anel nasceu.

Medido antes do conserto: **sete das oito tiras saíam pretas**. Não dava para
ver porque a primeira tira, a de atraso zero, aparecia normal — parecia um
corte com problema de vão.

Existe agora um **segundo anel**, o da FONTE, que guarda a imagem como ela
ENTROU na cadeia de efeitos. Quem declara `histFonte` recebe esse, e não aquele.
Criado sob demanda: quem não usa não gasta memória de vídeo.

### Medido

Fonte de teste que **sobe dois níveis de cinza por quadro** — assim a diferença
entre duas tiras É a diferença de tempo entre elas, em quadros, dividida por
dois. Oito tiras, tempo em rampa:

```
passo  1 .... espalhamento   0   as oito no mesmo instante (o defeito)
passo 10 .... espalhamento  17   ~8 quadros entre a primeira e a última
passo 30 .... espalhamento 137   ~68 quadros ≈ 2,3 s a 30 fps
tiras pretas ....... 0  (eram 7 de 8)
```

### O que isso ensina

Um efeito que lê a própria saída e um efeito que lê o passado da fonte parecem a
mesma coisa na descrição e são opostos na implementação. O anel único servia aos
dois porque nenhum efeito tinha, até aqui, pedido para ver o passado SEM se
incluir nele.

---

## 4u. AS DUAS ANIMAÇÕES TRAVADAS — diagnóstico, com número

O Bruno: *"as animações de ambos estão meio que travadas"*. São **duas causas
diferentes**, e nenhuma é performance. Isso importa: a primeira suspeita seria
otimizar, e otimizar não conserta nenhuma das duas.

### TIRAS DE PAPEL — o passo comprou tempo e vendeu fluidez

A memória de quadros tem QUATRO vagas. Para cobrir segundos, o passo faz o anel
girar só de N em N quadros. Consequência aritmética: **a tira atrasada só troca
de imagem quando o anel gira**.

Medido, lendo a tira mais atrasada quadro a quadro:

```
passo  1 .... 58 trocas por segundo    fluido, mas sem diferença de tempo
passo 13 .... 3 trocas por segundo     ← o que ele está usando: TRAVADO
passo 30 .... 0,5 troca por segundo    quadro parado que pula
```

Não é bug de código: é o desenho do anel de quatro vagas. Quem quiser dois
segundos de intervalo com quatro lembranças tem de segurar cada uma por meio
segundo.

**A saída: mais vagas, em resolução menor.** As tiras são largas e o olho não
cobra detalhe numa tira de 20 px; o anel da FONTE pode viver em metade da
resolução sem custo visível.

```
hoje ...........  4 vagas a 1920×1080 = 33 MB · passo 13 → 3 trocas/s
proposto ....... 32 vagas a  960×540  = 66 MB · passo  1 → 60 trocas/s
                 e 32 quadros de intervalo, que a 30 fps é mais de um segundo
```

Fluido E com tempo, pelo dobro da memória de vídeo que já se gasta. O número de
vagas entra como ajuste do efeito (`memória`), com o padrão em 16.

Enquanto isso não existe, o conselho honesto é **passo entre 2 e 5**: dá
diferença visível entre as tiras e ainda troca 12 a 30 vezes por segundo.

### LETRAS RECORTADAS — não está travada, está em stop motion

Isto não é defeito, é o efeito. `R.quadroDe` divide o tempo em passos de
`1/(velocidade × 12)`. Em velocidade 1 são **12 passos por segundo** — que é
exatamente a cadência de animação de papel feita à mão, e foi de propósito.

Quem espera movimento de vídeo lê 12 por segundo como travamento.

Medido, e serve para descartar a suspeita de performance:

```
quadro completo, 24 letras ..... 6,51 ms  (154 por segundo)
sem o auto-ajuste .............. 7,27 ms  (o ajuste não é o gargalo)
```

Sobra máquina. O que falta é **escolha**, e são três coisas:

1. **Velocidade em passos por segundo, escrito na tela.** Hoje o número é
   abstrato ("1") e ninguém adivinha que são doze.
2. **Um estilo LISO**, que interpola o tremor entre um passo e o seguinte em vez
   de saltar. Stop motion continua sendo o padrão, mas deixa de ser o único.
3. **Tremor separado da troca.** Hoje os dois andam no mesmo relógio. Tremer a
   60 e trocar o recorte a 6 é o que os animadores de papel realmente fazem.

### Uma gordura achada de passagem (não é a causa, mas é feia)

Cada letra é **medida quatro vezes por quadro**: uma no auto-ajuste, uma na
montagem, uma no desenho e uma no teste de clique. Medido: 96 chamadas para 24
letras. Guardar a medida por (semente, corpo) tira três quartos disso. Não
resolve o travamento — o quadro já cabe em 6,5 ms — mas é trabalho jogado fora e
vai doer quando o texto for longo.

---

## 4v. AS TIRAS DESTRAVADAS E A FAMÍLIA VOZ (décima terceira passada)

Duas frentes: o conserto que a passada anterior só diagnosticou, e a família
VOZ pedida na seção 14. As duas cresceram por dentro do que já existia — o anel
de quadros do motor de vídeo e o rack de áudio — sem tela nova, sem segundo
painel, sem duplicar arquivo.

### As TIRAS: separar as duas coisas que estavam no mesmo número

O diagnóstico da 4u estava certo e a saída proposta estava só metade certa. Não
bastava dar mais vagas ao anel: era preciso perceber que `passoHist` fazia DUAS
coisas ao mesmo tempo, e que só uma delas custava a fluidez.

```
distHist   DISTÂNCIA de leitura — quantos quadros separam uma lembrança
           da seguinte. É o que dá o TEMPO, e é o que a pessoa pede.
subHist    de quantos em quantos quadros um é GUARDADO. É o que tira a
           FLUIDEZ, e ninguém pediu.
```

Antes, pedir distância 13 impunha guardar um a cada 13. Agora a distância é
resolvida na LEITURA — `histTexF(n)` devolve a vaga a `n·dist/sub` passos
atrás — e o sub só sobe quando não há vaga:

```
subHist = teto(4·dist / (vagas − 1))
```

Com quatro níveis de lembrança e 16 vagas, distância 13 pede sub 4 em vez de
13. Com 64 vagas, sub 1. **As vagas não compram tempo: compram fluidez.**

E saem baratas porque o anel da fonte passou a viver em **meia resolução** —
quem lê dali lê em tira de vinte pixels. Dezesseis vagas a 960×540 custam os
mesmos 33 MB que quatro a 1920×1080 custavam.

### Medido no motor real, lendo o quadro com `readPixels`

Fonte que muda de cor a cada quadro, efeito TIRAS com oito tiras e distância 13,
contando quantas vezes a tira mais atrasada troca de imagem:

```
                            trocas/s   vídeo a 1080p
antes (4 vagas, 1 a cada 13)   4,7          32 MB
CURTA  — 16 vagas (padrão)    15,0          32 MB
LONGA  — 32 vagas             30,0          63 MB
MÁXIMA — 64 vagas             60,0         127 MB
```

**O padrão novo é três vezes mais fluido pelo mesmo preço de memória de vídeo.**
Sobre o tempo de quadro, a leitura honesta é que ele NÃO mudou: repetindo a
medida, a diferença entre duas rodadas do mesmo modo ficou maior que a
diferença entre os modos (2,7 a 4,2 ms, sem ordem). O que dá para afirmar é que
nenhum dos modos custa caro; qualquer número mais preciso que isso seria
inventado.

E a separação no tempo se manteve: com distância 13 as quatro lembranças caíram
nos quadros 142, 126, 114 e 102 — o intervalo que o efeito existe para mostrar.

Também conferido, com fonte em quatro quadrantes de cor: o anel de meia
resolução guarda a **imagem inteira**, não o canto. Isso importa porque
`Renderer.pass` fixa o viewport no tamanho do render, e escrever com viewport
grande num alvo pequeno guarda o quadrante de baixo — o anel usa `downsample`,
que recebe o tamanho do alvo.

### Duas coisas que a medida pegou e o olho não pegaria

1. **Níveis colidindo.** Com o anel apertado, `round(n·dist/sub)` mandava os
   níveis 1 e 2 para a MESMA vaga: duas tiras vizinhas mostravam o mesmo
   instante, e o efeito perdia um quarto do seu repertório em silêncio.
   `Math.max(n, …)` garante vagas distintas. O teto é `V` e não `V−1` porque a
   vaga V é a vaga 0 — a mais antiga, que é o que se quer quando acabou a
   lembrança.
2. **O anel COMPOSTO andava junto.** `passoHist` era usado pelos dois anéis, e
   uma colagem em tiras no quadro fazia o ECO de qualquer outro efeito perder
   quadros. Agora `pushHistory` guarda sempre. Conserto de passagem, achado
   lendo o código para mudar outra coisa.

### Uma armadilha nova, irmã da que já estava escrita

A seção 4i registrou que **campo que aparece no inspetor não é campo que
funciona**. A irmã dela: **botão que aparece não é botão que faz**.

`effProp` desenhava o cronômetro de animação (`data-anim`) em TODO parâmetro,
inclusive nos de `uni: false` — os que não viram uniform e que o motor lê pelo
valor base, fora da animação. Animar a "Distância no tempo" das tiras gravava
keyframes que nada lia, e ainda mostrava na caixa um número que o motor não
estava usando. Vale para o `passo` (que era assim desde sempre) e valeria para
a `memória` nova. Agora o cronômetro só aparece onde animar faz alguma coisa;
no lugar dele vai um `.stopw-off`, que guarda a coluna para o rótulo não dançar
de linha para linha.

### A FAMÍLIA VOZ — sete módulos no MESMO rack

`js/audiovoz.js`, carregado depois de `audiofx.js` (que define `A.FAMS`) e antes
de `audiopresets.js`. O rack foi de 27 para 34 módulos e ganhou a décima
primeira família. Nada de laboratório novo.

```
VOZ · TOM E CORPO      o tom sobe sem a fala acelerar, e o corpo anda só
VOZ · MULTIPLICAR      a mesma voz por três, cinco, nove ou doze pessoas
VOZ · VOCODER          a voz manda no timbre de outra coisa
VOZ · SUSSURRO         troca a prega vocal por ar, e a fala continua legível
VOZ · TELEFONE         a banda estreita da linha, com o aperto que vem junto
VOZ · RÁDIO            a estação fora de sintonia
VOZ · CORO DE UM SÓ    uma frase falada vira naipe de quatro a sete vozes
```

### O defeito mais sério da passada: `D.tom` estava errado, e há meses

O primeiro módulo precisava mudar o tom. `D.tom` já existia, é usado pelo TEMPO
ELÁSTICO e pelo GRANULAR, e **não entrega o tom que promete**. Medido numa
senoide de 200 Hz, onde o resultado não admite interpretação:

```
pedido      esperado    D.tom devolve   energia na raia certa
+12 st       400 Hz        345 Hz              0 %
 +7 st       300 Hz        309 Hz             27 %
 +5 st       267 Hz        297 Hz              0 %
 −5 st       150 Hz        145 Hz             86 %
−12 st       100 Hz         91 Hz              0 %
```

A causa é o `D.esticar`: ele cola cada grão na posição que a conta manda, sem
olhar a fase do que já foi escrito. Num som com altura definida o descasamento
periódico vira modulação, e nascem raias espaçadas pela taxa de grãos — no caso
acima, 200 + n·72,8 Hz, com a de 345,6 ficando mais forte que a fundamental
deslocada. Para material com ruído e transitório isso soa "granulado" e passa;
para voz, o tom simplesmente sai errado.

`D.esticarVoz` e `D.tomVoz` (em `js/audiovoz.js`) fazem o mesmo caminho com
**WSOLA**: em vez de ler no passo teórico, procuram numa janelinha em volta dele
o pedaço que melhor continua o que já está escrito. O passo médio continua sendo
o pedido; o que muda é que a emenda cai em fase.

```
pedido      esperado    D.tomVoz    energia na raia certa
+12 st       400 Hz     400,5 Hz         100 %
 +5 st       267 Hz     267,1 Hz         100 %
 −7 st     133,5 Hz     133,8 Hz          99 %
−12 st       100 Hz      99,9 Hz          90 %
```

Custa 87 a 137 ms por segundo de áudio mono — a mesma faixa do ESPECTRAL, que
já era o módulo mais caro do rack. A busca só varre 12 ms (um período de uma
voz de 83 Hz); varrer meio grão inteiro, como a conta pedia ao descer de tom,
custava o triplo pelo mesmo resultado.

**`D.esticar` e `D.tom` não foram tocados.** O TEMPO ELÁSTICO e o GRANULAR
continuam com o som que sempre tiveram, e os presets que os usam não mudam.
Trocar o motor deles é decisão de produto, não de conserto — mas está aqui
medido, para quando você quiser.

### O corpo da voz: a média móvel não serve, o cepstro serve

Separar tom de corpo exige processo espectral: reamostrar e esticar movem os
dois juntos, sempre. A ideia é transplantar o ENVELOPE — a forma por cima do
pente dos harmônicos, que é onde mora "que boca produziu este som".

A primeira versão alisou a magnitude com média móvel de largura proporcional à
frequência. **Não serve, e falha parecendo funcionar:** a média larga o bastante
para apagar o pente de uma voz grave é estreita demais para uma aguda, e aí o
"envelope" segue o próprio pente. Transplantar um envelope que É o pente não
move o corpo — move a nota. Medido: subir uma oitava guardando o corpo voltava
a 131 Hz em vez de 240. O módulo desfazia o próprio pitch shift, em silêncio.

O **cepstro** separa por construção: no log do espectro, envelope e pente estão
somados, e a transformada disso põe a forma nas quefrências baixas e o pente num
pico único em `q = sr/F0`. Corte em Q = 100 apaga o pente de qualquer voz com
fundamental abaixo de 441 Hz.

Duas correções que só a medida revelaria:

- **O teto de ganho precisa ser alto.** Com teto 8, um pedido de sete semitons
  de corpo chegava como 4,7 — o ganho saturava justamente onde o formante novo
  precisa nascer, num lugar do espectro onde ainda não havia energia. Com 64, o
  pedido de +7 sai como +7,0. Quem protege de amplificar silêncio é o corte de
  envelope, não o teto.
- **Duas passadas de formante não somam.** Tom e corpo pedidos juntos faziam
  duas passadas — uma para desfazer o que o tom levou, outra para o corpo — e a
  segunda trabalha sobre um envelope que a primeira já mexeu. Medido: tom +7 com
  corpo −4 saía como corpo −8,4. Uma passada com a soma custa metade e chega no
  lugar certo.

### VOZ · TOM E CORPO, medido

Vogal sintética, F0 120 Hz, formantes em 600 / 1500 / 2600. A régua é a mesma
vogal com os formantes movidos **de verdade** no sintetizador — é ela que diz
quanto "andar o corpo" deveria valer em centróide:

```
                          F0 medido   alvo    corpo andou   alvo
tom +12, guardando corpo    242 Hz    240        +1,8         0
tom +12, sem guardar        242 Hz    240       +11,8      +11,8
tom −12, guardando corpo   59,2 Hz     60        −1,9         0
tom −12, sem guardar       59,2 Hz     60       −12,0      −10,5
corpo +7, tom parado        118 Hz    120        +7,0         +7
corpo −7, tom parado        118 Hz    120        −6,0       −6,5
corpo +12, tom parado       118 Hz    120       +10,2      +11,8
```

Lendo: o tom acerta em tudo; guardar o corpo segura 85% dele (deriva de 1,8
semitons contra os 11,8 que derivariam sem guardar); mover o corpo sozinho
acerta em cheio até sete semitons e entrega 86% numa oitava inteira.

### Os outros seis, medidos

- **VOCODER** — portadora em 110 Hz devolve fundamental 107,7; em 220 devolve
  220,7. A saída tem a nota da PORTADORA e não os 120 Hz da voz, que é a
  definição do efeito. Cinco portadoras: serra, pulso de glote, ruído, sopro e o
  próprio som.
- **MULTIPLICAR** — a largura do harmônico de 600 Hz vai de **5,4 Hz** (voz
  sozinha, e também doze vozes SEM desafinar — como tem de ser) para **18,8 Hz**
  com desafinação em 40 cents. Esse alargamento É o que faz soar como várias
  pessoas. As vozes saem em estéreo com 27 a 30% de diferença entre as caixas.
  A desafinação não vem de doze pitch shifts (custariam mais do que valem): vem
  de uma linha de atraso que respira, com a amplitude do balanço saindo de uma
  conta que recebe o pedido em cents. E os "corpos diferentes" custam DUAS
  passadas de formante, não doze — as vozes se repartem entre três versões.
- **SUSSURRO** — a periodicidade cai de **1,00 para 0,08**: a prega vocal sai e
  a fala continua modulada pelo envelope da voz, que é o efeito inteiro.
- **TELEFONE** — com ruído branco na entrada (que tem energia em toda parte), a
  banda de 300 a 3400 Hz vai de 14% da energia para **69,5%**. Com um filtro de
  um polo eram 57%.
- **RÁDIO** — a banda de 180 a 4500 Hz vai de 19,6% para **66,2%**; com a voz e
  fora de sintonia, a periodicidade cai de 1,00 para 0,64 (a estática entrando).
- **CORO DE UM SÓ** — no acorde MAIOR (graus −12, 0, +4, +7) as quatro
  fundamentais aparecem entre −19,6 e −26,8 dB, e a frequência de controle de
  100 Hz, que não é grau nenhum, fica em **−61,5 dB** — 35 dB abaixo do grau
  mais fraco. O acorde está lá e não é acaso.

### Uma correção no vocoder que valeu para os dois

Um passa-banda de Q fixo é mais largo em Hz quanto mais agudo for, então uma
portadora de energia plana entrega muito mais sinal nas bandas de cima. Sem
normalizar, o timbre da saída é o da PORTADORA e não o da voz: o sussurro saía
com centróide 3051 onde a voz tinha 1200 — legível, e de outra pessoa.
Dividindo cada banda pela própria energia, quem manda no volume de cada faixa
volta a ser só o envelope da voz.

### O que NÃO ficou resolvido, e por quê

- **O sussurro sai com o dobro do brilho da voz** (centróide 2570 contra 1200).
  Não é o realce de proximidade nem a banda mais aguda — com os dois desligados
  o número mal se move. É do banco de filtros: bandas de Q fixo vazam umas nas
  outras, e o envelope nunca chega a zero numa banda vizinha a um formante.
  Sussurro de verdade TAMBÉM é mais brilhante que voz sonora; se o dobro é
  demais ou está bom é ouvido, e ouvido eu não tenho. Baixar "Perto do ouvido" e
  "Banda mais aguda" é por onde escurecer.
- **Sobra energia acima da banda no TELEFONE** (29,6%). Não é a sujeira entrando
  depois do filtro — reordenar os estágios mudou 70,2% para 69,5%, ou seja,
  nada. É a inclinação do próprio filtro: três polos de um polo cada ainda levam
  uma oitava para chegar aos 18 dB por oitava. Um biquad de segunda ordem
  resolveria; o `D` só tem filtros de um polo, e criar um banco novo era mais
  passada do que cabia aqui.
- **Nada foi OUVIDO.** Todos os sete módulos foram medidos por espectro,
  periodicidade e fundamental, com sinais sintéticos de parâmetros conhecidos.
  A medida prova que fazem o que dizem; não prova que soam bem. Voz é o material
  em que o ouvido é mais exigente e mais rápido — grave uma frase no microfone,
  que o laboratório já tem, e ouça os sete.
- **O custo.** MULTIPLICAR com doze vozes e corpos diferentes custa da ordem de
  meio segundo por segundo de áudio; TOM E CORPO, 0,3 a 0,5. Numa frase de dez
  segundos é imperceptível; num arquivo de três minutos a espera é de minutos, e
  o aviso PROCESSANDO aparece mas a aba fica pesada. É o mesmo caso do ESPECTRAL
  e pede a mesma solução, que é Worker.

---

## 4w. AS LETRAS RECORTADAS GANHARAM ESCOLHA (décima quarta passada)

A 4u tinha diagnosticado e não consertado: as letras **não estavam travadas**,
estavam em stop motion a 12 passos por segundo — de propósito. O que faltava
eram as três escolhas que ela listou, e as três entraram por dentro do mesmo
painel, sem tela nova.

### 1. Dois relógios, porque papel animado tem dois

Havia UM número, `velocidade`, multiplicado por 12 na conta. Quem quisesse
trocar o recorte três vezes por segundo era obrigado a tremer três vezes
também — e o que o animador de papel faz é justamente o contrário: **tremer
depressa e trocar devagar**. Agora são duas taxas independentes:

```
passosTroca    quantas vezes por segundo a letra vira OUTRO recorte
passosTremor   quantas vezes por segundo ela se remexe
```

Medido no modelo, amostrando a 240 Hz durante um segundo, com troca pedida em 3
e tremor em 30:

```
                        trocas/s   valores de tremor/s
CAOS                       3              30
STOP MOTION                –              30
PULSO                      3               –
PARADO                     –               –
```

As duas taxas andam sozinhas, e o que se pede é o que se mede.

### 2. Velocidade em passos por segundo, escrita na tela

Os dois trilhos mostram `12/s` ao lado do número. A unidade não é enfeite: com
"velocidade 1" ninguém adivinhava que aquilo eram doze passos por segundo, que
é a cadência clássica do papel feito à mão.

### 3. O estilo LISO — o tremor caminhado, não saltado

Dois estilos novos **no fim da lista** (a posição É o número que vai guardado no
clipe que já está na linha do tempo; acrescentar no meio quebraria projeto
aberto):

```
4  LISO        só desliza
5  CAOS LISO   troca o recorte — que só pode saltar, é papel — e desliza
```

O sorteio é o MESMO de sempre; o que muda é que o valor do passo seguinte é
alcançado caminhando, com entrada e saída suaves (`f²(3−2f)`). Nos passos
inteiros o liso passa exatamente pelos valores do saltado — conferido, diferença
0 em seis passos seguidos. Não é outra animação: é a mesma, sem o salto.

**Medido lendo o quadro desenhado** (`getImageData`, 420×220, seis letras, taxas
em 6 por segundo, dois instantes a 4 ms de distância — dentro de um passo):

```
                     pixels que mudaram em 4 ms   em 167 ms (um passo)
STOP MOTION                     0                      10.881
CAOS                            0                      11.645
LISO                        4.381                      10.611
CAOS LISO                   5.316                      11.645
PARADO                          0                           0
```

Zero dentro do passo é a definição de stop motion; quatro mil pixels em 4 ms é a
definição de deslizar. E o clipe **na linha do tempo** faz o mesmo: enviado com
LISO, a fonte desenha 60.704 pixels diferentes a 4 ms de distância, com
`animado` verdadeiro.

### O PULSO era o CAOS com outro nome

Achado de passagem, e é a armadilha de sempre: **o estilo aparecia e não fazia**.
`pedacoNoTempo` trocava o recorte em CAOS e em PULSO, e `tremorDe` tremia em
tudo que não fosse PARADO — ou seja, PULSO e CAOS eram o mesmo estilo. O rótulo
prometia "troca no tempo". Agora as quatro combinações são ortogonais de
verdade, e o rótulo virou **PULSO (só troca)**.

Quem estivesse com PULSO escolhido nesta sessão vai ver a letra parar de tremer.
É a correção, não uma perda: o ajuste do recorte não é guardado entre sessões
(vive em memória; o que vai para a linha do tempo é uma cópia própria).

### O trilho que não vale fica apagado

Duas taxas na tela e nem sempre as duas valem: em STOP MOTION não há troca, em
PULSO não há tremor, em PARADO não há nada. A linha ganha `.off` e o campo fica
`disabled` — controle aceso que não faz nada é a armadilha que já mordeu este
projeto quatro vezes. Conferido pela interface, estilo a estilo.

### Escrito pela interface, lido no motor

O caminho inteiro foi exercitado com eventos sintéticos, que é a única prova que
vale: arrastar o trilho para 4/s e 48/s grava `passosTroca: 4` e
`passosTremor: 48`, a tela mostra `4/s` e `48/s`, e `R.passosDe` devolve 4 e 48
ao motor.

### Compatibilidade

Um ajuste antigo, só com `velocidade`, continua funcionando: `R.passosDe` cai
para `velocidade × 12` quando as taxas novas não existem. Conferido contra a
fórmula anterior em 500 instantes — **500 de 500 passos idênticos**.

### O custo, lido com honestidade

23 letras em 1080×1080, três rodadas por estilo, 60 quadros cada:

```
CAOS         4,17 · 3,81 · 4,19 ms
STOP MOTION  4,91 · 4,04 · 4,18 ms
LISO         3,46 · 4,85 · 2,95 ms
CAOS LISO    3,84 · 3,43 · 3,87 ms
```

O liso calcula dois sorteios por letra em vez de um, e isso **não aparece**: a
diferença entre duas rodadas do mesmo estilo é maior que a diferença entre os
estilos. O que dá para afirmar é que nenhum passa de 5 ms.

### O que NÃO foi feito aqui

- **A medida da letra continua sendo feita quatro vezes por quadro** (item 3 da
  seção 14). Segue de pé, e agora custa a mesma coisa que antes.
- **Nada foi VISTO em movimento por mim.** O painel destas sessões não compõe
  quadros — não há screenshot. A prova é por pixel lido e por folha de contato:
  seis quadros seguidos a 60 fps dentro de um passo, e a fila do STOP MOTION sai
  com seis quadros idênticos enquanto a do LISO caminha. Se o deslizar ficou
  bonito ou parece manteiga, é olho, e o olho é seu.
- **A taxa é a mesma para todas as letras.** `Dessincronizar` dá fase própria a
  cada uma (medido: 1,84 passos diferentes entre oito letras, contra 1,00
  desligado), mas não velocidade própria. Se um dia isso for pedido, o lugar é
  `R.faseDe`.

---

## 14. O QUE FAZER NA PRÓXIMA PASSADA

Em ordem de valor. Os dois primeiros vieram do que a 4v mediu e não consertou.

### Consertos

1. **`D.tom` e `D.esticar` erram o tom.** Medido na 4v, numa senoide: uma oitava
   acima vira 10,6 semitons, cinco semitons viram 6,9. O TEMPO ELÁSTICO e o
   GRANULAR carregam isso desde sempre. O motor certo já existe e está medido —
   `D.esticarVoz` / `D.tomVoz`, em `js/audiovoz.js`. Trocar é uma linha em cada
   um; o que segura é que o som dos presets muda, e essa decisão é sua.
   *(seção 4v)*
2. ~~Letras recortadas: estilo LISO, velocidade em passos por segundo, e tremor
   separado da troca~~ — **feito na 4w.** Duas taxas independentes, medidas; a
   unidade escrita na tela; LISO e CAOS LISO no fim da lista de estilos. *(seção 4w)*
3. **Guardar a medida da letra** por (semente, corpo) — de quatro medições por
   letra por quadro para uma. *(seção 4u)*
4. **Worker para as cadeias longas de áudio.** ESPECTRAL, GRANULAR e agora a
   família VOZ passam de 100 ms por segundo de áudio; num arquivo de três
   minutos a aba trava. É o mesmo pedido de três passadas atrás e o custo só
   cresceu. *(seções 4v e 7)*
5. **Filtro de segunda ordem no `D`.** Só há passa-baixa e passa-alta de um
   polo, e é por isso que o TELEFONE ainda deixa 30% da energia fora da banda.
   Um biquad genérico serve a ele, ao RÁDIO e a qualquer módulo futuro.
   *(seção 4v)*

### Pedidos ainda não atendidos

6. **VHS pelo mérito.** Perda de fita (dropout) em risco horizontal, erro de
   croma que atrasa a cor em relação à luz, tracking instável na base do quadro,
   head-switching na última linha, e o ruído que aumenta na terceira cópia.
   As telas do nandomp4 que o Bruno mandou mostram a INTERFACE dele — cinco
   controles, quatro filtros de cor e quatro texturas de VHS em MP4 sobrepostas.
   Confirmam que a barra é baixa e que o caminho dele é decalque (vídeo de fita
   real por cima), não simulação. Nenhum dos artefatos da lista acima está lá.
7. **Alça de Bézier por vértice na máscara de EFEITO** (a de camada já tem).
   *(seção 4l)*
8. **Botão SEGUIR na máscara de caneta** — MediaPipe `InteractiveSegmenter`
   empurrando os vértices do traçado que já existe. *(seção 13)*

### Ideias que apareceram e ainda não foram escritas

9. **Legenda com palavra acesa por áudio** — hoje a palavra acende pelo tempo
   repartido; poderia acender pelo pico do áudio, que já é medido.
10. **Recorte: colar um pedaço de imagem de verdade** dentro do papel, em vez de
    letra desenhada — é o que uma revista dá.
11. **Tiras: puxar o tempo de OUTRA camada**, não da própria. Agora que o anel
    da fonte tem até 64 vagas, isto ficou barato: é escolher de qual camada o
    anel é alimentado. *(seção 4v)*
12. **Fala do sistema (`speechSynthesis`) como fonte da família VOZ.** Ler texto
    em voz do Windows e passar pelos sete módulos. O limite conhecido é que a
    API não expõe a saída ao Web Audio e portanto não dá para gravar direto;
    dá para tocar e capturar pelo microfone, o que é feio mas funciona.
    *(seções 12 e 4v)*

---

## 10. Referências

`REFERENCIAS/SITE` — 7 imagens; uma mockup do próprio site virou a espinha dorsal
do sistema gráfico.

`REFERENCIAS/EFEITOS` — 453 MB. 32 PNGs soltos (implementados) mais um PPTX de
catálogo com ~284 imagens.

`REFERENCIAS/EFEITOS/fontes e efeitos` — 84 PNGs de **specimens comerciais** de
fontes e efeitos PSD (Envato). Foram usados **só como mapa de categorias**:
manuscrita, geométrica modular, tecnológica larga, grotesca estendida, estêncil.
Nenhum contorno foi decalcado, convertido ou renomeado — as 12 famílias do
`js/typefaces.js` são desenhadas do zero como esqueleto de traço. Ver a nota no
cabeçalho daquele arquivo.

`REFERENCIAS/LOGO` — `LOGO.png` (no ar), `LOGO 01.png` e o `.psd`.
