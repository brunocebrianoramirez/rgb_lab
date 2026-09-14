# rgb_lab — estado do projeto

> Documento de continuidade. Última sessão: **13/09/2026** (vigésima
> sétima: a AQUARELA; a vigésima sexta foi a filmadora, em quatro voltas). O manual de uso é o [LEIA-ME.md](LEIA-ME.md); aqui fica o que foi
> decidido, o que está pronto, o que não foi verificado e o que vem depois.

---

### RETOMAR AQUI

**A vigésima sétima passada (13/09/2026) construiu a AQUARELA em TOOLS** —
a mesa de luz de um animador, flutuando no palco: pinta-se com água e
pigmento de verdade (o modelo de Curtis na GPU, a cor por Kubelka-Munk, 52
pigmentos) POR CIMA do quadro da composição, um quadro de cada vez, e a
sequência entra na linha do tempo em Multiplicar — a animação em cima da
animação, que foi o pedido. Está toda na **seção 5n**. Estado em 13/09:

```
js/aquarela.js      o motor: os 52 pigmentos (K e S por canal, de duas cores),
                    o papel (relevo calculado), a simulação (água rasa,
                    pigmento, capilar, sal, álcool) em texturas RGBA32F, o
                    Kubelka-Munk no shader, os quadros (estado quantizado +
                    deflate, PNG escrito à mão), o ROLO e a fonte 'quadros'
js/aquarelaui.js    a mesa: caixa de tintas (8 godês, 4 pincéis, 6 utensílios),
                    folha, LUZ, VEGETAL, tira de quadros, telinha (papel,
                    secagem, granulação, borda, floradas, cadência, definição,
                    saída, MODO CÓDIGO), gaveta dos 52, DO CLIPE, USAR
css/aquarela.css    tudo em --u (1% da largura da mesa)
js/media.js         a fonte kind 'quadros' no plano (pelo tempo da fonte) e o
                    rolo em media.recriar (sessão guardada e .rgblab)
```

**O que a medida provou** (5n.5): massa do pigmento conservada a 0,000%;
borda 1,4× mais escura que o miolo; ultramar granula (−0,71) e ftalo quase
não (−0,15); o sal clareia o cristal; o traço sangra 2 px; estado, PNG e
rolo vão e voltam; no laboratório de verdade, três quadros viraram o clipe
"AQUARELA 01" em Multiplicar e o `#gl` deu azul em t=1,00, amarelo em
t=1,17 e branco fora do clipe. Na placa dele: 9,8 ms por passo a 1024×576.

**O que ficou para ele testar (ninguém viu a mesa em movimento):** pintar
com o ponteiro de verdade (pressão, coalescência), a água à vista secando,
os pincéis e utensílios pela caixa, folhear, o vegetal. E o olho dele para a
força das aguadas, a granulação e as floradas (a couve-flor ainda cresce
pouco — 5n.6).

---

**A vigésima sexta passada (11–13/09/2026) construiu a FILMADORA em TOOLS**
— a traseira de uma câmera de filme flutuando no palco, na regra do
polaroid (cada peça é uma função) — e a levou por quatro voltas de pedidos
do Bruno. Está toda na **seção 5m** (5m.1 a 5m.11). Estado em 13/09, tudo
no ar (último commit `50a137a`):

```
js/filmadora.js     o motor: 4 bitolas (cada uma com a sua carcaça de FOTO
                    fixa e a sua película), F.ops(t) — a cadeia que entra na
                    prévia e na exportação —, F.filmes() lendo a família
                    8 MM do catálogo, a gravação pelo exportador, os rolos
js/filmadoraui.js   a tela: visor espelhando o #gl, os 5 botões na ordem do
                    app (INFO · ROLOS · BITOLA · REBOB. · SOM), a LENTE em
                    cima (LIMPA · QUEIMADURA · HALO), a roda do FILME com o
                    TREMOR no centro, gaveta das bitolas, gaveta dos rolos,
                    telinha (PLAQUETA e AJUSTES, com a seção QUEIMADURA)
css/filmadora.css   tudo em --u (1% da largura da máquina)
assets/filmadora/couro/   couro-preto (escurecido), couro-marrom, couro-bege
                    (os três do Bruno, ladrilho espelhado 2×2) e
                    metal-escovado (gerado) — 8 MM, SUPER 8, 16 MM, 35 MM
js/filters.js       família 8 MM = os DEZ filmes do app MEDIDOS da saída
                    dele (cadeias crossproc/chanmix → filmstock), nomes do
                    laboratório: CRUZADO, NOIR P&B, ANOS 60, ÂMBAR, ÍNDIGO,
                    TOSCANO, BICOLOR, 2 TIRAS, TRÊS-X, TERRA
js/fx5.js           filmgrain sem o grão que voava (item 34 das armadilhas)
                    e com GRÃO VIVO; pacote 8 mm recalibrado pela saída do
                    app; QUEIMADURA DE FILME (o film burn, lampejos rápidos)
```

**As medidas que sustentam isto** (não voltar a chutar):
- o `.MOV` que o app gravou filmando `assets/labs/carta-de-calibracao.png`
  deu, por filme, 45 patches → Nelder–Mead sobre o próprio shader (5m.8);
  e a base do 8 mm: maciez σ 3,6 px em 960, grão de um nível, cintilação
  zero, tremor só vertical e esporádico, janela quase no limite (5m.8);
- a gravação de tela do app deu a ORDEM dos filmes e a função de cada
  botão (5m.8), e a LENTE com três estados;
- o clipe de film burn deu a paleta de fogo e o envelope; o ritmo é o das
  imagens dele (lampejos), não o do clipe (5m.10–5m.11).

**O que ficou para ele testar (ninguém viu em movimento):** o visor a
60 fps; a roda girando; a gaveta subindo; os lampejos da queimadura no
ritmo dele (RITMO e DURAÇÃO na engrenagem); o TREMOR no centro da roda;
NOIR P&B e TRÊS-X em preto e branco; o couro preto fosco; o grão parado no
filme. Se algo estiver forte, os ajustes MULTIPLICAM a calibração (1 = como
medido).

**Pendências deixadas em aberto:**
- rolos não sobrevivem ao recarregar (blobs) — IndexedDB se ele pedir;
- a queimadura na LENTE usa os defaults do efeito mais o que está em
  `est.queima`; TAMANHO e LADO FRIO só pelo catálogo;
- o ombro do app (tudo acima de 204 vira ~240) não cabe no modelo do
  filmstock; um "ponto branco" no filmstock resolveria;
- a cadência do 8 MM está em 18 (a identidade da bitola); o vídeo dele
  estava em 24 — CADÊNCIA na engrenagem troca.

---

**A vigésima quinta passada (11/09/2026) pôs CINCO EFEITOS no LAB 01, a
partir de seis capturas e duas referências abertas que o Bruno mandou** —
está tudo na **seção 5l**:

```
js/fx14.js          CRT / TUBÃO reconstruído pelo tubo (tooooools/crt, com os
                    padrões de fábrica dela, medido a 1% contra a página)
                    DATAMOSH reconstruído pelo codec (Supermosh): vetores
                    medidos por busca de bloco, resíduo, blocos intra
js/fx15.js          PAPEL TÉRMICO / CUPOM — um bit por ponto de 203 dpi
js/fx16.js          MAPA DE PROFUNDIDADE (I.A.) e RASTREIO DE MANCHAS
js/profundidade.js  Depth Anything V2 no navegador (WebGPU/WASM, 18 MB)
js/manchas.js       componentes conexos + rastreio, na CPU
```

Três ganchos novos no motor, todos pequenos e reutilizáveis: `fontePrev:
true` dá a um efeito a FONTE de um quadro atrás (`uFontePrev`) sem perder o
`uPrev` composto; `def.atlas(params, fxDef, inTex, time)` recebe a imagem
de entrada — um atlas pode ser uma ANÁLISE; e `def.nota(e, clip)` escreve
uma nota viva na ficha (o estado da I.A.).

**O que NÃO foi visto por mim: nada em movimento.** Tudo foi medido (o CRT
contra a referência, na mesma imagem; o datamosh quadro a quadro; o cupom,
as manchas e a profundidade em número e em ASCII). Peça para ele abrir o
painel, arrastar os cinco para um clipe de VÍDEO e olhar — o datamosh só
existe em movimento, e a profundidade atrasa meio segundo por quadro.

---

**A vigésima quarta passada foi longa e mexeu nos TRÊS laboratórios.** Ela
começou com um pedido de desenho — *"deixar o lab de tipografia menos
poluído"*, com o brik.space de referência — e terminou com um espectrograma
no áudio, porque cada correção mostrou a próxima. Quatro seções:

```
5h   LAB 03 · TIPOGRAFIA repaginado, e o que isso ensinou
5i   LAB 02 · o rack foi da faixa do pé para a coluna da direita
5j   LAB 02 · A MONTAGEM: uma linha do tempo só de som
5k   LAB 02 · o espectrograma do arquivo inteiro
```

#### A ideia que atravessou tudo: A LINHA É O CAMPO

O par "campo em cima, cursor deslizante solto embaixo" virou UMA caixa que se
enche até onde o valor está na faixa. Começou na ficha da tipografia (5h.1),
o Bruno gostou e pediu no vídeo (5h.9), e no fim chegou às duas mesas da
tipografia e ao rack do áudio — que herdaram de graça, por serem o mesmo par.

```
                          antes              depois
ficha da tipografia       2,8 / 3,5 telas    1,00 tela
ferramentas do LAB 03     4,1 telas          1,15 tela
rack do áudio na coluna   21,3 telas         4,4 telas
```

**A lição, e ela vale para o resto do 2.0:** *o 2.0 tinha embelezado a linha
sem reduzir o NÚMERO de linhas* — a `.prow` virou cartão arredondado e a
ficha ficou mais alta (57px por controle contra 47 do Classic). A calma da
referência não vem de linha bonita; vem de pouca linha na tela.

#### As três armadilhas desta passada, para não cair de novo

1. **`:has()` dentro de `:has()` é inválido, e não avisa.** O navegador
   descarta a regra inteira em silêncio — vinte e três regras morreram de uma
   vez e as três fichas voltaram ao desenho antigo. Quando um `:has()`
   complexo "não pega", `el.matches(seletor)` é onde o erro sai escrito
   (5i.5). A forma certa é um `:has()` só, com seletor relativo composto.
2. **Repaginar por folha de estilo só alcança o que a folha NOMEIA.** As duas
   mesas da tipografia e a pilha de efeitos do vídeo são montadas por
   JavaScript, nunca apareceram numa auditoria do `index.html`, e ficaram com
   o desenho de outra época até alguém olhar (5h.8, 5j). Se sobrar coisa com
   cara de site antigo, é aí que se procura.
3. **`requestAnimationFrame` PARA onde o navegador não está pintando.** A fila
   das miniaturas usava rAF, copiado do LAB 01, e num painel escondido não
   completou um segundo em quarenta e cinco. `setTimeout` é estrangulado, mas
   nunca parado (5h.6).

#### Cinco defeitos ANTIGOS que só apareceram porque algo passou a medi-los

- **Ctrl+Z nunca funcionou no LAB 03** sem uma composição de vídeo aberta —
  uma guarda `if (!VE.project) return` acima do bloco da tipografia (5h.8);
- **POSIÇÃO X nunca foi para a esquerda do centro**: `min: -W` com `W`
  função dá `NaN`, e navegador com `min` inválido usa zero. Só apareceu
  porque o enchimento precisa de min e max válidos (5h.9);
- **MANDAR PRA TIMELINE do áudio nunca funcionou sozinho** — `VE.addMedia`
  lê `VE.project.tracks` sem checar, e o TypeError morria dentro de uma
  promessa, calado (5i.6);
- **a tinta não fechava o recorte** ao abrir (só o contrário), e as duas
  folhas ficavam empilhadas no mesmo palco (5h.8);
- **o menu ESPAÇO do ATMOSFERA aparecia e não abria** — exceção de CSS com
  especificidade menor que a regra que devia vencer (5i.5).

#### O QUE NÃO FOI VISTO POR MIM, e é por onde começar

**Nada do áudio foi OUVIDO.** A montagem, o espectrograma, a mistura — tudo
foi provado por medida (contagem de amostra, variância de pixel, duração do
buffer). É a única parte deste projeto em que um erro passa sem eu detectar.

Também não vi: o espectrograma no modo NOTURNO (vi só o aviso "CALCULANDO"),
nem a mesa ESCREVER À MÃO com o desenho novo, nem as miniaturas da tipografia
no Classic (essas conferi por assinatura de pixel).

**Peça para ele abrir, tocar e trazer o que estranhar** — é assim que os
defeitos deste projeto viram número.

#### O que eu faria primeiro na próxima

1. **A régua de tempo com números** sobre a onda do áudio. Hoje são dez
   divisões sem número nenhum: não dá para saber onde está 1:20, e agora há
   dois gráficos empilhados olhando para a mesma régua invisível.
2. **A onda desenhada dentro do trecho da MONTAGEM.** Hoje o bloco é um
   retângulo com o nome; com a onda dentro dá para cortar no lugar certo
   olhando, que é como se corta som.
3. **A lentidão do rack**, medida e não consertada (5i.4): 3,4s por volta de
   botão num áudio de um minuto, porque toda mudança recomeça do áudio
   original. O conserto proposto é guardar o buffer de ENTRADA de cada passo
   — mexer no módulo 6 recalcularia só o 6. Não fiz porque é o caminho
   central do motor de áudio e eu não escuto o resultado.

---

**A vigésima terceira passada entregou DOIS INSTRUMENTOS DE SOM e um núcleo
novo para os dois** — está tudo na **seção 5g**, que tem um resumo em caixa
logo no começo para quem só quer continuar:

```
js/musica.js       O NÚCLEO MUSICAL: escalas, vozes, síntese, .mid, render
js/sonografo.js    · js/sonografoui.js · css/sonografo.css
                   O SONÓGRAFO (music scanner): a linha fica parada, a
                   imagem passa por ela, o que cruza vira nota
js/cifra.js        · js/cifraui.js · css/cifra.css
                   A CIFRA: o campo harmônico à mão, com teclado e gravador
```

O sonógrafo mora na aba **TOOLS** do vídeo E em **FERRAMENTAS** do áudio (come
vídeo, devolve áudio); a cifra só no áudio. A torre do áudio virou
**FONTE · TOOLS · CADEIA · PRESETS**.

**Duas coisas desta passada que valem para o resto do laboratório:**

1. **Todo controle com sentido prometido tem de ser medido numa CURVA, não num
   ponto.** A SENSIBILIDADE do sonógrafo andava ao contrário — mais sensível
   dava MENOS notas — e um único valor de teste no meio da faixa não mostra
   isso (5g.3).
2. **Cor herdada do tema pode não servir à janela que a herda.** No modo papel
   o piano roll sumia: contraste 1,34 contra o fundo. Herdar E MEDIR, clareando
   por mistura só quando não passa (5g.5).

**O que ficou de fora, de propósito:** o banco de áudios, o upload de sons do
usuário e o sistema de regras de evento do sonógrafo — a fase 2 que o próprio
pedido dele manda deixar para depois (5g.10).

**Antes de tudo, na próxima: nada dos dois instrumentos foi visto por mim em
material de verdade.** O painel estrangula `requestAnimationFrame` e a
decodificação de vídeo quando não está exibido, então a prova foi por medida e
por eventos sintéticos. Peça para ele abrir e tocar.

**Passadas anteriores, para referência:** a décima nona entregou o **TRICÔ**, o
**SCANNER DE VÍDEO** e a **MESA DE DIGITALIZAÇÃO** (`js/fx12.js`,
`js/fx13.js`, `js/mesa.js`, `js/mesaui.js` — **seção 5c**); a vigésima segunda,
a **CÂMERA POLAROID** (**seção 5f**).

**A próxima sessão continua começando pela lista dele.** O combinado de sempre:
ele usa, anota o que quebrou, e a gente ataca um por um na ordem que ele trouxer.

**Enquanto a lista não chega:**

1. Nada do que foi entregue de 22 a 24/08 foi VISTO por mim em material de
   verdade — nem o tecido do Tricô, nem um scan de foto dele. Se ele trouxer um
   defeito, o primeiro passo é reproduzi-lo com uma medida: quase todos os bugs
   graves deste projeto ficaram invisíveis até virar número.
2. **Três defeitos da 5c foram achados por ELE USANDO, não pela medida** — a
   porta da janela no lugar errado, o "usar na composição" que não punha nada na
   linha do tempo, e a sessão vazia grudada. A medida provou que cada controle
   fazia o que prometia; não provou que o CONJUNTO servia. Continua valendo:
   peça para ele abrir o painel e olhar.
3. Não abrir frente nova sem pedido. As seções 7 e 14 têm ideias antigas;
   nenhuma delas foi pedida por ele.

A lista inteira, com o porquê de cada item, está na **seção 14**. Em resumo:

| # | o que | onde está explicado |
|---|---|---|
| 1 | **`D.tom` e `D.esticar` erram o tom** — o motor certo já existe (`D.tomVoz` / `D.esticarVoz`); trocar muda o som dos presets do TEMPO ELÁSTICO e do GRANULAR, e essa decisão é sua | 4v |

**Fechado na décima terceira passada (4v), não repetir:** as TIRAS foram
destravadas — o anel da fonte vive em meia resolução, a distância de leitura
saiu de dentro do intervalo de guarda, e o padrão novo dá 15 trocas por segundo
onde dava 4,7, pelos mesmos 32 MB. E a **família VOZ** entrou no rack de áudio,
sete módulos, medidos por espectro.

**Fechado na décima quarta passada (4w):** as LETRAS RECORTADAS ganharam a
escolha que faltava — dois relógios separados (troca e tremor), os dois em
passos por segundo escritos na tela, e o estilo **LISO**, que desliza em vez de
saltar. E a medida da letra passou a ser guardada: de quatro medições por letra
por quadro para zero nos quadros parados, com a saída idêntica byte a byte. De
quebra, o PULSO, que era o CAOS com outro nome, virou o que o rótulo dele
promete.

**E o VHS foi reconstruído pela cadeia de sinal (4y):** vinte e dois controles,
três passadas, YIQ entre elas, tudo em unidades de FITA (720×480) e não de tela
— com borda rasgada e rabo de luz. Os sete parâmetros antigos ficaram com as
mesmas chaves.

**E o áudio pesado saiu da linha principal (4x):** os vinte módulos de buffer
rodam num Worker montado com o texto da própria biblioteca — som idêntico
amostra a amostra, maior espera da página de 2.607 ms para 30 ms, e mexer num
controle no meio da conta desiste do cálculo velho em vez de esperar por ele.

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
| Efeitos de vídeo | **150** shaders (todos compilam, nenhum sai vazio) — cinco da 25ª passada |
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
js/fx12.js      ← NOVO   TRICÔ — malha generativa com ALFA REAL (família 05 PIXEL):
                         8 tipos de ponto, organicidade, simetria, 5 animações e
                         Fundo=Transparente, que é o que o faz servir de camada
js/fx13.js      ← NOVO   SCANNER DE VÍDEO (fórmula de slit-scan por linha, com o
                         gesto gravado `rawCurve`) + SCANNER DE MESA, que NÃO é
                         shader: é a PORTA do catálogo para a janela (`janela:'mesa'`)
js/fx14.js      ← NOVO   O TUBO E O CODEC: CRT / TUBÃO (máscara delta, fenda ou
                         listras, convergência, halo, bloom — os padrões da
                         tooooools) e DATAMOSH (busca de bloco em 4 passadas,
                         resíduo quantizado, blocos intra, quadro-chave)
js/fx15.js      ← NOVO   PAPEL TÉRMICO / CUPOM — 576 ou 384 pontos, texto pelo
                         atlas, ruído azul, resistência morta, queima, alfa real
js/fx16.js      ← NOVO   VISÃO DE MÁQUINA: MAPA DE PROFUNDIDADE (I.A.) e RASTREIO
                         DE MANCHAS — só o desenho; os analisadores vêm depois
js/fxfam.js     ← NOVO   AS OITO FAMÍLIAS: define a taxonomia, dá cor a cada uma e
                         reetiqueta os 70 efeitos antigos. Carrega DEPOIS de todo fx*.js
js/transitions.js        curvas de keyframe (incl. Bézier) + 30 transições
js/typefaces.js          12 famílias desenhadas por código
js/gl.js                 motor WebGL2 + ANEL DE QUATRO QUADROS + 21 modos de mistura
js/state.js              modelo de edição não linear · VE.srcTime (velocidade e sentido)
                         · VE.setMaxDur (limite definido pelo usuário) · VE.BLENDS
js/stab.js      ← NOVO   analisador do estabilizador: perfis de projeção 64×64,
                         casamento por SAD com refino de sub-pixel e controlador
js/manchas.js   ← NOVO   analisador das MANCHAS: grade 128×72 lida de volta,
                         componentes conexos, rastreio por número, vizinhas
js/profundidade.js ← NOVO analisador da PROFUNDIDADE: Depth Anything V2 pela
                         Transformers.js, WebGPU ou WASM, buscado sob demanda
js/filmadora.js ← NOVO   A FILMADORA, motor: bitolas, cadeia da película, texturas
                         calculadas, gravação pelo exportador, rolos
js/filmadoraui.js ← NOVO a traseira da filmadora: visor, seletor, gavetas, telinha
css/filmadora.css ← NOVO o couro, o visor, o vermelho, a roda — em --u
js/aquarela.js  ← NOVO   A AQUARELA, motor: 52 pigmentos (Kubelka-Munk), papel,
                         simulação de água/pigmento na GPU, quadros, rolo, fonte 'quadros'
js/aquarelaui.js ← NOVO  a mesa de luz: caixa de tintas, folha, luz, vegetal, tira,
                         telinha, gaveta dos 52, modo código
css/aquarela.css ← NOVO  a madeira, a lata, o vidro aceso, a tira — em --u
js/presets.js            presets (localStorage)
js/media.js              fontes + geometria de MOTION + plano para a GPU (e a fonte 'quadros')
js/view.js               viewport: zoom, pan, fit, réguas
js/timeline.js           a mesa de edição
js/panels.js             catálogo, ficha da composição, PLACAS RECOLHÍVEIS, máscara
js/motion.js             MOTION / Effect Controls / keyframes / gráficos / caixa
js/filters.js            galeria de 52 filtros, agora com filtro em CADEIA
js/exporter.js           exportação (vídeo, sequência PNG com alpha, ZIP próprio,
                         e o modo EXATO por WebCodecs, com pré-análise da I.A.)
js/webm.js      ← NOVO   o escritor de WebM (EBML por extenso) para o modo exato
js/audiodsp.js  ← NOVO   biblioteca de sinal: FFT, STFT, granular, esticador,
                         respostas impulsivas, ressonadores, sorteio por semente
js/audio.js              LAB 02 — o rack, agora DIRIGIDO PELA ORDEM dos módulos,
                         com registro aberto (VE.audio.register), MUTAR, A/B e
                         quatro leituras no analisador. WAV e picos como antes.
js/audiofx.js   ← NOVO   os 14 módulos novos do MESMO rack: atmosfera, deformação,
                         glitch, matéria, espacial, psicoacústica, granular,
                         espectral, generativo
js/audiopresets.js ← NOVO as 23 cadeias artísticas prontas
js/audiotrab.js ← NOVO   o TRABALHADOR: monta um Worker com o texto de
                         audiodsp/audiofx/audiovoz e roda a cadeia fora
                         da linha principal (§4x)
js/reactmap.js  ← NOVO   ÁUDIO REATIVO: o som mexendo na imagem do LAB 01,
                         somado na leitura de VE.valueAt
js/type.js               LAB 03 — motor letra a letra + ENTRADA/LAÇO/SAÍDA
js/comp.js               modelo da COMPOSIÇÃO: modos, camada, máscara, assinatura
js/compgl.js             GLSL da composição: espaço de cor, 27 modos, faixa, máscaras
js/compui.js             ficha da composição: seletor com miniatura, máscaras, matte
js/mesa.js      ← NOVO   MESA DE DIGITALIZAÇÃO, o motor: cabeçote que anda uma
                         linha por vez e um filme que guarda o que estava embaixo
                         dele NAQUELE instante. Gravação, não fórmula (§5c)
js/mesaui.js    ← NOVO   a janela da mesa: bancada à esquerda (arrasta/amplia/gira
                         durante o scan), filme à direita, quatro grupos de controle
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
É por isso que o item de catálogo da MESA mora em `fx13.js` e não em `mesa.js`:
`mesa.js` carrega bem depois de `fxfam.js`, e o item ficaria sem família.

`mesa.js` e `mesaui.js` entram depois de `recorteui.js` e antes de `type.js`.
`mesaui.js` depende de `mesa.js`, de `VE.media` e de `VE.app` — mas só na hora
do clique, nunca na carga.

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
js/audiotrab.js    o trabalhador: a mesma biblioteca, fora da linha principal
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

### O QUE ESTÁ ESPERANDO O TESTE DELE — 22 a 24/08/2026

Sete entregas seguidas, todas MEDIDAS e nenhuma julgada por olho ou ouvido.
Ele disse que vai testar tudo e anotar os erros; a próxima sessão começa por
essa lista. Isto aqui é o roteiro do que olhar, e o que cada coisa pode ter de
errado que a medida não pegaria:

| onde | o que abrir | o que pode estar errado sem a medida acusar |
|---|---|---|
| **LAB 03 · letras recortadas** | estilo **LISO** e **CAOS LISO**, com Troca e Treme em taxas diferentes | o deslizar pode parecer manteiga; 12 passos/s pode continuar sendo o certo |
| **LAB 01 · VHS** | o padrão novo e o estilo **FITA RUIM**, RODANDO | fita é tempo: dente, tracking e cintilação só se julgam em movimento |
| **LAB 01 · região do efeito** | REGIÃO → **TRAÇADO** num efeito, com o traçado animado | se o recorte acompanha uma coisa que anda é olho |
| **LAB 01 · MARCAR OBJETO** | a I.A. em **pele, pelo, vidro e fundo parecido** | os testes usaram formas sintéticas; material real é outra história |
| **LAB 02 · família VOZ** | OUVIR os sete módulos com voz gravada no microfone | tudo foi medido por espectro, nada foi ouvido |
| **LAB 02 · TELEFONE e RÁDIO** | ouvir depois do biquad — a banda mudou de verdade | pode ter ficado apertado demais |
| **LAB 02 · cadeia pesada** | um arquivo de três minutos com ESPECTRAL ou VOZ | a aba tem de continuar respondendo; o aviso diz qual módulo está rodando |

**Como trazer um defeito de forma que ele conserte rápido:** dizer **onde**
(qual laboratório, qual controle), **o que se vê ou se ouve**, e se possível o
**valor dos controles**. Print ajuda muito. Arquivo exportado ajuda ainda mais
— com o PNG ou o WAV na mão dá para medir o defeito em vez de adivinhá-lo.



- **Aparência montada.** Durante muitas passadas isto ficou escrito como
  "impossível", e em 24/08/2026 descobriu-se que é **condicional**: o painel
  do navegador só compõe quadros quando ele está **EXIBIDO na janela do app**.
  Com o painel escondido, `screenshot` estoura o tempo com a mensagem
  *"the Browser pane is not displayed"*, `getBoundingClientRect` devolve zero
  e um canvas WebGL lido de fora do laço volta vazio. Com o painel aberto pelo
  Bruno, tudo isso passou a funcionar — foi assim que deu para comparar o
  nosso VHS com o da referência lado a lado, e foi VENDO que apareceram os
  dois erros de desenho que medida nenhuma tinha pegado (seção 4y).

  **Então: se precisar ver, PEÇA A ELE PARA ABRIR O PAINEL.** É um pedido de
  dez segundos que transforma o que dá para verificar.

  Quando o painel está fechado, a auditoria continua sendo geométrica (medir
  elementos) e por pixel lido do WebGL — e uma folha de contato salva em
  arquivo é sempre possível, porque ela não depende de composição.

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

**Efeito que precisa da FONTE de um quadro atrás** (movimento, resíduo,
qualquer conta de codec): declare `fontePrev: true` e leia `uFontePrev` —
meia resolução, sem realimentação, e o `uPrev` composto continua lá. Ver
o datamosh em fx14.js.

**Efeito que precisa de uma ANÁLISE fora do shader** (I.A., visão de
máquina, texto desenhado): o gancho `atlas(params, fxDef, inTex, time)`
recebe a imagem de entrada; devolva `{tex, count, cols, rows, total}` e o
shader lê `uAtlas` / `uAtlasInfo`. O estado por instância se guarda por
`fxDef.effId`. Rode só em `this === VE.renderer` (a galeria tem
renderizador próprio). E ponha `tempo: true` na definição, senão uma
camada parada é guardada em cache antes de a análise chegar. Ver fx16.js,
manchas.js e profundidade.js.

**Nota viva na ficha**: `nota: function (e, clip) { return texto; }` na
definição vira um `pnote`; `notaChave: data-x` marca o elemento para o
módulo trocar o texto sem redesenhar a ficha.

---

## 9. Armadilhas que já me morderam

**Efeito que não compila vira PASSA-TUDO silencioso.** Não dá erro na tela,
não pinta preto, não avisa: o motor simplesmente pula o efeito e o quadro sai
igual ao original. Aconteceu ao pôr uma função GLSL dentro de outra (o que a
linguagem não aceita). Todo teste de efeito começa por `R.progFor(id)` e por
comparar o quadro COM efeito contra o quadro SEM efeito — medir proxies antes
disso é medir o nada.


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
- **Limiar de luma sobre imagem mascarada escolhe uma cor.** O bloom do CRT
  lido do tubo (já com os pontos R, G, B) só deixava passar os pontos
  VERDES — a luma pesa 0,72 no verde — e o branco saía verde. Limiar sobre
  a imagem de ENTRADA, sempre. (5l.2)
- **Resíduo aplicado por inteiro desfaz qualquer mosh.** Saída = arrastado
  + (novo − arrastado) = novo, exato, em qualquer corte. O datamosh existe
  porque o dado do quadro-chave é JOGADO FORA — o bloco que não casa
  descarta o resíduo. (5l.3)
- **Evento sintético em `<input>` de React não chega ao estado.** Para
  mover um controle da página de referência, chame o `onChange` guardado
  em `__reactProps` do elemento. Foi assim que o bloom deles foi medido
  em três níveis. (5l.2)

---


**Botão que promete MAIS e entrega MENOS.** Num detector de eventos, subir a
SENSIBILIDADE baixava o número de notas — 42 no padrão contra 21 no máximo —
porque limiar mais baixo também atrasa o FECHO do evento, e evento que não
fecha não pode reabrir. **Todo controle com sentido prometido tem de ser medido
numa CURVA, não num ponto**: cinco valores do botão, uma cena só, e a coluna de
resultado lida de cima a baixo. Um valor no meio da faixa não mostra inversão
nenhuma. (Seção 5g.3.)


**Grandeza desenhada como TRANSPARÊNCIA some no fundo escuro.** O piano roll
pintava a nota com alfa proporcional à intensidade; sobre o quase-preto do rolo
a nota fraca saía com contraste **1,34** e a forte com **2,84** — abaixo do 3,0
que um elemento gráfico precisa. Nota que não se vê não informa "intensidade
baixa", informa AUSÊNCIA, e o desenho passa a mentir sobre quantas coisas
existem. Mapear em BRILHO com alfa 1, de um piso que já passa o contraste até o
tom claro. Vale para qualquer valor mapeado em alfa sobre fundo escuro.
(Seção 5g.5.)


**Cor herdada do tema pode não servir à janela que a herda.** As janelas de
instrumento têm palco preto em QUALQUER tema, e `--ch-video` no modo papel é
`#1b4fd8` — afinado contra papel. A saída não é copiar um valor fixo (aí a
janela deixa de acompanhar o tema): é herdar E MEDIR, clareando por MISTURA com
o tom claro só quando não passa. No noturno e no 2.0 a conta devolve a cor
intacta. Multiplicar em vez de misturar estoura o canal azul em 255 e a cor
escorrega para ciano. (Seção 5g.5.)


**Índice de POSIÇÃO vira bomba-relógio ao inserir no meio.** A torre do 2.0
aponta para as seções da coluna por posição (`sec: 0,1,2`). Acrescentar uma
seção nova no meio do `#sideAudio` empurrou as de baixo: CADEIA passou a abrir
FERRAMENTAS, PRESETS a abrir CADEIA, e **PRESETS ficou sem porta nenhuma**. Não
dá erro — cada botão continua abrindo alguma coisa, só a errada. A verificação
que serve é clicar CADA botão e ler o rótulo do que abriu. (Seção 5g.9.)


**`getBBox()` em elemento escondido devolve ZERO — e zero passa no teste.** A
conferência de um ícone novo ("todas as peças dentro da caixa de 24×24") passou
limpa medindo nada, porque a seção da coluna estava em `display:none`. Para a
medida valer, clonar a marcação para um SVG VISÍVEL e, de preferência,
rasterizar e contar pixels pintados. Irmã da regra de sempre: valide o
instrumento antes de acusar o código. (Seção 5g.6.)


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

### A MEDIDA DA LETRA, guardada (o item 3 da seção 14)

Cada letra era medida **quatro vezes por quadro** — 80 chamadas a
`measureText` para 20 letras, 800 em dez quadros. Duas delas eram desperdício
puro de estrutura: `R.desenhar` chamava o auto-ajuste e depois `R.montar`
chamava o auto-ajuste **outra vez**, e `desenharPedaco` remedia o que a
montagem tinha acabado de medir. Agora `montar` devolve o corpo que usou
(`itens.corpo`) e a medida da montagem viaja até o desenho.

As duas que sobraram — o auto-ajuste mede no corpo base, a montagem no corpo já
encolhido — passaram a ser guardadas. A medida é função PURA de (semente, letra,
corpo) e dos quatro ajustes que o sorteio lê (`maiusculas`, `varTam`,
`varGiro`, `varAltura`); quando um desses quatro muda, a tabela some inteira.

```
                                        antes    agora
primeiro quadro, 20 letras ...........    80       40
dez quadros parados ..................   800        0
ao mexer num ajuste do sorteio .......    80       40
dez quadros com troca a 2 por segundo    800       20
```

**A saída é a MESMA, byte a byte.** Conferido contra a versão anterior carregada
lado a lado no mesmo navegador — cinco casos (texto curto, com troca de recorte,
frase longa com auto-ajuste, acentos em duas linhas, e variação no talo) em
quatro instantes cada: **0 bytes diferentes**, com 64 mil a 107 mil pixels de
tinta em cada comparação (comparar dois quadros vazios não prova nada).

O tempo de quadro, medido em pares alternados para o ruído não escolher o
vencedor — 23 letras em 1080×1080, três rodadas de 60 quadros:

```
STOP MOTION   3,93 → 3,00   2,63 → 2,01   3,97 → 2,78 ms
CAOS          5,09 → 3,49   3,05 → 1,50   3,92 → 1,66 ms
```

Os seis pares vão para o mesmo lado, o que a 4v não conseguiu dizer das TIRAS:
aqui a diferença é real, entre um quarto e a metade do tempo de quadro.

O teto da tabela é de 4.096 medidas. Medido no navegador, cada entrada custa
**696 bytes** — o pior caso são 2,8 MB, e ele só acontece com texto muito longo
sendo digitado letra a letra (cada corpo novo do auto-ajuste é uma entrada).

De quebra, o teste de clique deixou de re-sortear a letra para descobrir o giro:
ele já está na medida guardada. Conferido pela interface, com eventos sintéticos
de ponteiro: o clique achou a terceira letra, o arrasto moveu **40 e 30 pixels
exatos**, ela ficou presa e as outras seis não se mexeram.

### O que NÃO foi feito aqui

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

## 4x. O TRABALHADOR DO ÁUDIO (ainda a décima quarta passada)

O pedido estava aberto desde a sexta passada e o custo só crescia: ESPECTRAL,
GRANULAR e, desde a 4v, a família VOZ passam de 100 ms por segundo de áudio.
Num arquivo de três minutos isso é mais de um minuto de conta — e, feita na
linha principal, é um minuto com **a aba dura**: o aviso PROCESSANDO aparece e
mais nada responde.

### O que NÃO foi feito: uma segunda biblioteca

A tentação óbvia era escrever uma versão dos efeitos pesados para dentro do
Worker. Seriam duas cópias de cada algoritmo, e a segunda começaria a mentir no
dia seguinte. O que se fez foi olhar o que, na biblioteca inteira, dependia da
página. É **uma linha**:

```
D.make  →  VE.audio.context().createBuffer(ch, len, sr)
```

Todo o resto — `audiodsp.js`, `audiofx.js`, `audiovoz.js`, os vinte módulos de
buffer — usa de um AudioBuffer só `numberOfChannels`, `length`, `sampleRate`,
`duration` e `getChannelData`. Então o trabalhador recebe **o texto dos três
arquivos, sem uma vírgula mudada**, e um contexto de mentira de dez linhas que
devolve um objeto com essas cinco coisas. Mexer num módulo muda os dois lados
no mesmo instante, porque só existe um lado.

### De onde sai o texto dos três arquivos

- **no site:** `fetch` dos próprios `js/*.js` (mesma origem);
- **no arquivo único:** cortando o script embutido pelos marcadores
  `/* ===== nome.js ===== */` que o `build-arquivo-unico.js` já escrevia antes
  de cada arquivo — eles deixaram de ser enfeite e viraram estrutura.

O marcador é montado por expressão dentro do `audiotrab.js`, e não escrito à
mão, senão o próprio arquivo viraria um falso marcador quando estivesse dentro
do arquivo único.

### E quando não dá

file:// sem servidor, CSP que barre Worker de blob, navegador velho: o
laboratório calcula na linha principal, exatamente como antes. **O trabalhador
é uma aceleração, nunca uma dependência** — e isso é medido, não prometido (ver
o teste do trabalhador quebrado, abaixo).

### A cadeia continua sendo a cadeia

O trabalhador não conhece os cinco processadores que moram dentro do
`audio.js` (reverso, bitcrush, granular da base, gagueira, ruído). Então a
corrida de módulos é quebrada em pedaços do que ele sabe e do que fica aqui,
**na ordem** — reordenar mudaria o som. Medido numa cadeia misturada de
propósito:

```
reverse (aqui) → spectral (lá) → voztom (lá) → out (aqui)
```

### Medido

**1 · O som é o MESMO.** Os vinte módulos de buffer, um a um, com dois segundos
de voz sintética, comparando a saída do trabalhador com a da linha principal
amostra a amostra:

```
20 de 20 módulos ......... maior diferença 0,0
                           mesmo comprimento em todos
                           picos de 0,43 a 2,15 (não são silêncios comparados)
```

E uma cadeia de seis módulos numa viagem só (voztom → telefone → spectral →
granlab → material → vozradio): **maior diferença 0,0**, mesmo comprimento,
886 ms aqui contra 906 ms lá.

**2 · A aba deixa de travar.** O medidor teve de ser trocado antes de acusar
nada: `setInterval` é estrangulado para um tique por segundo em aba escondida.
O que serve é medir o tempo de ida e volta de uma mensagem, que é o que "a aba
responde" quer dizer. Validado primeiro contra um travamento de 800 ms feito de
propósito — acusou 802 ms.

```
CORO DE UM SÓ, 1 s de áudio
                       conta       maior espera da página
na linha principal ... 2.607 ms          2.607 ms   (parou tudo)
no trabalhador ....... 2.311 ms             30 ms   (128.298 idas e voltas)
```

**3 · Desistir na hora.** Mexer num controle enquanto um cálculo longo corre
não espera mais o cálculo velho: o trabalhador é encerrado e outro é montado
(40 ms, porque o texto fica guardado). Medido com o VOZ · MULTIPLICAR em quatro
segundos de áudio: a promessa antiga soltou em **0 ms**, sem aviso de erro na
tela, e o resultado do cálculo novo saiu **idêntico à referência** (soma
37.315,534 e pico 0,99 nos dois).

**4 · O aviso passou a dizer o que está sendo feito**, porque agora dá para
desenhar durante a conta:

```
PROCESSANDO A CADEIA…
PROCESSANDO · ESPECTRAL (1 de 2)
PROCESSANDO · VOZ · TOM E CORPO (2 de 2)
2 CANAIS · 48000 HZ · 4.00S → 4.00S     ← e a linha volta ao que era
```

**5 · Quebrando o trabalhador de propósito** no meio do trabalho: o pedaço
volta para a linha principal, o resultado sai **idêntico** (soma 19.507,929 nos
dois) e o console diz por quê.

**6 · O preço da viagem.** Três minutos de áudio estéreo (66 MB de amostras):
ida e volta custa **106 ms** fora a conta — os canais vão como cópia doada,
porque o buffer da página não pode ser esvaziado. O pico de memória sobe cerca
de uma cópia do áudio enquanto o trabalho corre (74 MB → 204 MB, com o coletor
ainda sem passar).

### O que NÃO ficou resolvido

- **Os cinco processadores do `audio.js`** continuam na linha principal. São
  baratos (reverso, bitcrush, gagueira, ruído), e movê-los pedia tirá-los de
  dentro do arquivo do laboratório — mudança de estrutura sem ganho medido.
- **Um trabalhador só.** Uma cadeia com dois módulos pesados os calcula em
  sequência. Vários trabalhadores dividiriam por canal ou por trecho, e isso é
  outra passada — e só vale a pena depois de alguém reclamar do tempo, não do
  travamento, que era o problema real.
- **O trecho de grafo (nós do Web Audio) continua onde estava**, porque
  `OfflineAudioContext` não existe dentro de um Worker. São os módulos baratos.
- **Nada foi OUVIDO.** A prova é de identidade amostra a amostra: o áudio que
  sai do trabalhador é o mesmo bit a bit. Se soa bem continua sendo ouvido seu.

---

## 4y. O VHS PELO MÉRITO (décima quinta passada)

O pedido estava na lista desde a nona passada, e o que existia era um filtro
de aparência: deslocamento de RGB, uma barra descendo, chuvisco e listras.
Sete controles, nenhum deles ligado ao que uma fita realmente faz.

O Bruno mandou o **effect.app** como referência e pediu engenharia reversa.
O que foi feito, e o que NÃO foi feito, é importante estar escrito:

- **não** foi lido, baixado nem copiado o código deles;
- foi lida a **lista de controles** que a interface deles mostra — que é o
  vocabulário do efeito, não a implementação — e usada como mapa do que uma
  fita precisa ter;
- o efeito foi escrito daqui, **a partir da cadeia de sinal do formato**.

Isso não é escrúpulo inútil: é o caminho mais curto para o resultado. Os
dezesseis controles deles são dezesseis ARTEFATOS conhecidos, e cada artefato
tem uma causa física que se escreve em três linhas de shader.

### A fita, na ordem em que ela estraga

```
1 · a MECÂNICA erra          a linha inteira anda para o lado
    erro de base de tempo      ruído rápido, linha a linha
    ondulação                  onda lenta ao longo da altura
    vinco da fita              uma faixa que empurra e clareia
    tracking                   a faixa que perde o sincronismo
    troca de cabeça            as últimas linhas do quadro
    salto vertical             o quadro inteiro pula
2 · a LUZ perde banda        VHS resolve ~240 linhas na horizontal
3 · a COR perde MUITO mais   cerca de sete vezes mais borrada que a luz
4 · a COR chega ATRASADA     é por isso que ela escorre para a direita
5 · o DECK realça a borda    o halo claro que todo VHS tem
6 · a FITA suja              chuvisco, perda de fita, cintilação
```

**Vinte controles**, e os SETE antigos ficaram com as mesmas chaves
(`bleed`, `track`, `wob`, `lines`, `noise`, `scan`, `sat`): um projeto
salvo continua achando o efeito e os seus valores. O que ele vai ver é a fita
melhor. O preset **VHS 1994** foi reajustado para a cadeia nova.

### Três passadas, e por quê

Borrão largo com poucas amostras deixa buraco — a armadilha da 5ª passada.
Então:

```
passada 0   mecânica + banda de luz    lê a imagem que entrou
passada 1   banda de cor               lê a passada 0
passada 2   atraso, franja, realce,    compõe sobre a imagem original
            sujeira, varredura
```

Entre as passadas o sinal viaja em **YIQ** — luz num canal, cor em dois —
porque é assim que a fita guarda, e é o que permite borrar a cor sem borrar a
luz. O quadro de trabalho é de 8 bits, então I e Q vão deslocados para 0..1 e
voltam na última passada.

### Medido, controle por controle

Tudo abaixo é leitura de pixel do quadro renderizado, com os outros
dezenove controles em zero — cada número isola UMA coisa.

```
RESOLUÇÃO · contraste de barras verticais de 2 px
  640 linhas .... 223      160 linhas .... 127
  320 linhas .... 191       80 linhas ....   0   (some, como tem de sumir)

SUAVIDADE · linhas de transição numa borda horizontal
  0 → 0 linhas · 1 → 2 · 2 → 4 · 3 → 6

REALCE DO DECK · sobressinal numa borda de cinza 60→190
  0 ...... nenhum (−1 e +1, que é o ruído da conta)
  0,5 .... +45 acima do claro e −47 abaixo do escuro
  1,5 .... +65 e −60

ATRASO DA COR · onde a transição de cor cai (a de luz fica em x=160)
  0 px → 160 · 6 px → 166 · 12 px → 172 · 20 px → 180

SANGRAMENTO · largura da transição de cor, em pixels
  0 → 2 · 0,5 → 4 · 1 → 8 · 2 → 16 · 3 → 22

FRANJA · pico na borda de cor (o chapado ao lado fica em 70)
  0 → 70 (nenhum) · 1 → 117 · 3 → 183

SATURAÇÃO ·  −1 → cinza (0) · 0 → ±138/70 · 1 → o dobro · 2 → satura

DESVIO DE MATIZ · o vermelho (199,61,60) vira
  0,25 → (188,40,195)      0,5 → (126,56,255)
```

**As duas trepidações são coisas diferentes, e a medida separa as duas.**
Medindo em que x caiu a borda vertical, linha a linha:

```
                    desvio    aspereza entre linhas vizinhas
erro de base de tempo 1 ....  0,45 px          0,31    ← pula linha a linha
erro de base de tempo 3 ....  1,17 px          1,18
ondulação 1 ...............  1,10 px          0,11    ← anda liso na altura
ondulação 3 ...............  3,03 px          0,32
```

```
SALTO VERTICAL · linha da borda horizontal em oito instantes
  desligado ... 120 120 120 120 120 120 120 120
  no máximo ... 121 121 120 119 118 118 118 118

VINCO ......... 9 linhas afetadas, entre 203 e 211 — uma faixa estreita
TRACKING ...... 21 linhas, entre 131 e 151 — outra faixa, em outro lugar
TROCA DE CABEÇA . 68,5 de diferença nas 10 ÚLTIMAS linhas da tela,
                  0,0 no meio e 0,0 no topo
PERDA DE FITA ... 0 riscos desligada · 8 linhas com 72 pixels claros no
                  máximo (riscos curtos, de 9 px em média)
CHUVISCO ........ desvio-padrão 0 → 19,2 → 63,8
CINTILAÇÃO ...... média do quadro 119 fixa; ligada, 115·125·153·76·153·110
GERAÇÃO DA CÓPIA  desvio 11,5 → 27,1 → 42,8 e riscos 0 → 2 → 10
```

**O rodapé foi MEDIDO, não suposto.** A troca de cabeça acontece na base do
quadro. Com o teste escrito para "y perto de 1", a sujeira caiu nas dez
PRIMEIRAS linhas da tela — ou seja, neste motor y = 0 é a base. Está
comentado no shader, porque é o tipo de coisa que se erra de novo.

**Neutro é neutro:** com os vinte controles em zero (e a resolução no
máximo), a diferença média para a imagem original é de **0,84 em 255** — o
que sobra é a ida e volta por YIQ em 8 bits.

**Máscara e intensidade continuam valendo** — o que é o risco de todo efeito
de várias passadas, porque as passadas de trabalho não podem respeitá-las:
intensidade 0 muda 0,0; 0,5 muda 16,6; 1 muda 30,4. Com máscara na metade
esquerda: 11,8 de mudança à esquerda e **0,0 à direita**.

### O custo

```
1920×1080, com readPixels forçando a GPU a terminar
  sem efeito .................. 15,0 ms   (a régua: já inclui a espera)
  um efeito de uma passada .... 13,9 ms
  VHS (três passadas) ......... 22,0 ms
  VHS com tudo no talo ........ 23,3 ms   (os laços são fixos)
  kirakira (cinco passadas) ... 53,3 ms
```

**O instrumento mentiu primeiro.** Medindo com `gl.finish()`, o mesmo VHS
dava 0,18 ms — com o painel escondido a chamada volta sem esperar nada. Só
com `readPixels` os números viraram físicos. É a terceira vez neste projeto
que o medidor precisou ser validado antes do código.

### SEGUNDA VOLTA: por que não estava igual à referência

O Bruno olhou e disse que não tinha ficado igual ao site que ele mandou. Ele
estava certo, e a causa principal é um erro de projeto meu:

**Os controles estavam em pixels de TELA, não em unidades de FITA.** "Atraso
da cor = 6 px" é 1,9% da largura numa prévia de 320 e 0,3% num quadro de
1920 — ou seja, o MESMO ajuste dava fitas diferentes conforme o tamanho do
projeto, e a folha de contato que eu mostrei (480 de largura) era quatro a
cinco vezes mais forte do que o que ele via na timeline em 1080p.

Uma fita não sabe quantos pixels você tem. A régua agora é a fita:

```
720 amostras por linha  ·  480 linhas
```

O atraso da cor, o realce do deck, a suavidade, o tamanho do grão, o
comprimento dos riscos e a listra de varredura são frações DISSO. Medido com
o mesmo ajuste em três tamanhos, perguntando em que porcentagem da largura a
cor cai:

```
 320×240 ....... 2,5 %
 960×720 ....... 2,5 %
1920×1080 ...... 2,5 %      antes: 1,9 % · 0,6 % · 0,3 %
```

**E faltavam dois artefatos que aparecem nas capturas dele:**

1. **A BORDA RASGADA.** A linha empurrada para fora do quadro mostrava a
   imagem grampeada na beirada; numa fita ela mostra a BEIRA DA FITA, que é
   preta com sujeira de cor — o dente irregular magenta e laranja nos dois
   lados. É o detalhe que mais entrega o formato, e é o que dominava as
   capturas da referência. O desenho do dente vem de uma cauda de lei de
   potência no erro de base de tempo: quase toda linha anda pouco (a imagem
   parece firme) e uma em cada dez vai muito longe.

   ```
   BORDA RASGADA · num quadro de 400 px, com o erro de base em 1,2
     rasgo 0 ....... 0 linhas com dente
     rasgo 0,5 ... 108 linhas · dente médio 7,9 px · maior 27 px
     rasgo 1 ..... 126 linhas · 9,8 px · maior 37 px
     rasgo 1,5 ... 127 linhas · 12,4 px · maior 46 px
     rasgo 2 ..... 130 linhas · 14,8 px · maior 56 px
   ```

   *(De 1 para cima o trilho não fazia nada na primeira tentativa — a
   mistura já saturava. Medido, corrigido: agora o rasgo também morde mais
   fundo. Controle que aparece e não faz é a armadilha desta casa.)*

2. **O RABO DE LUZ.** O amplificador da cabeça não acompanha o degrau e
   arrasta o que passou para a direita. É assimétrico de propósito — seis
   amostras, só para trás, com peso exponencial:

   ```
   RABO DE LUZ · soma da luz ao lado de uma faixa branca
     rabo 0 ...... 0 à direita · 0 à esquerda
     rabo 0,6 .... 97 à direita · 0 à esquerda
     rabo 2 ..... 658 à direita · 0 à esquerda
   ```

**E a perda de fita estava rala demais.** Nas capturas dele há dezenas de
riscos claros por quadro; o nosso dava um. A conta agora é por LINHA DE FITA:

```
perda 0 → 0 riscos · perda 0,8 → 14 · perda 2 → 31
```

**Os padrões subiram.** O efeito nasce com resolução 215, suavidade 1,5,
rabo 0,6, atraso 8, franja 1, rasgo 1 e geração 0,4 — a fita já é fita ao
arrastar para o clipe, sem precisar mexer em nada. E entrou o estilo
**FITA RUIM** na galeria, que é a versão judiada de uma vez só.

### TERCEIRA VOLTA: com a tela deles à vista

O Bruno abriu o painel do navegador do app — e com o painel VISÍVEL a página
volta a compor quadros, então a captura passou a funcionar. Pela primeira vez
deu para ver o resultado deles e o nosso lado a lado, e duas coisas apareceram
na hora. Nenhuma das duas era achável por medida, porque as duas são de
DESENHO e não de valor.

**1. Na fita deles o miolo é FIRME e a beira é selvagem.** No nosso, a imagem
inteira tremia. A causa era minha: eu fazia o dente da borda com uma cauda
longa no erro de base de tempo — ou seja, para a beira ficar irregular a linha
inteira precisava andar, e aí o prato virava purê.

Na fita são **duas coisas separadas**: o quadro fica no lugar, e a BEIRA é que
é irregular, porque a largura da parte gravada varia. Agora a beira tem largura
própria, sorteada por linha com lei de potência — quase toda linha mostra um
fio, e uma em cada dez mostra um dente longo:

```
BORDA RASGADA · quadro de 544 px        esquerda                (direita)
  rasgo 0 ....... nenhum dente
  rasgo 0,5 ..... 680 linhas · médio 6,7 px · maior 24    (7,1 · 24)
  rasgo 1 ....... 680 linhas · médio 13,3 px · maior 48   (14,1 · 48)
  rasgo 2 ....... 680 linhas · médio 26,6 px · maior 96   (28,1 · 96)

FIRMEZA DO MIOLO · aspereza da borda de um círculo, de linha para linha
  sem efeito .... 0,68 px
  com o padrão .. 3,75 px     antes desta volta o círculo era destruído
```

**2. O miolo derretia por três auréolas somadas.** Comparando um prato branco
sobre vermelho — que por acaso é quase a imagem de amostra deles:

- o **sangramento da cor** espalhava o "sem cor" do prato por 23 px dentro do
  vermelho, e isso vira uma auréola pálida em volta. Padrão de 1,2 para 0,7;
- o **rabo de luz** somava com `max()`, então o objeto claro CRESCIA em vez de
  arrastar. A resposta do amplificador é atraso, não ganho: virou mistura pura;
- o **realce do deck** empilhava halo em cima dos dois. De 0,45 para 0,3.

**E o miolo deles é mais limpo que o nosso era.** O chuvisco caiu de 0,14 para
0,09, o ruído de cor de 0,30 para 0,18 do total, o tracking de 0,6 para 0,35, a
perda de fita de 0,8 para 0,5 e o erro de base de tempo de 0,9 para 0,5. Os
trilhos continuam indo até onde iam; o que mudou foi onde o efeito NASCE.

**O que esta volta ensina, e vale para o resto do projeto:** a medida prova que
um controle faz o que promete, e não prova que o conjunto está certo. Os vinte
e dois controles estavam certos um a um — e o desenho estava errado. Foi VER
que consertou, e ver só foi possível porque ele abriu o painel.

### QUARTA VOLTA: dois defeitos que ele pegou usando

Ele exportou um quadro do rgb_lab e apontou duas coisas — as duas certas, e
as duas de DESENHO outra vez:

**1. "A borda rasgada deveria ter espaçamento vertical entre os rasgos."**
Estava certo: toda linha tinha dente, e uma beira mordida em toda linha não é
dente, é uma coluna de ruído. Agora o dente vem em GRUPO de linhas com VÃO
entre os grupos — a fita morde em pedaços.

**2. "A perda de fita está muito espalhada; elas ficam mais juntas,
coloridas e em forma de faixa."** Também certo, e a causa é física: o defeito
é uma REGIÃO da fita — uma dobra, um pedaço de óxido que soltou —, então os
riscos saem em cacho, não sorteados linha a linha pelo quadro inteiro. Três
faixas por quadro, cada uma com centro e altura própria, e o risco deixou de
ser branco chapado: a cabeça perde o sinal e o que sobra tem cor.

```
Medido em três instantes, quadro de 960×540, rasgo 1,3 e perda 1,2

DENTES DA BEIRA        grupos   tamanho médio   vão médio   maior vão
  instante 1 .......... 64        3,5 linhas     4,8         20
  instante 2 .......... 76        3,7            3,4         24
  instante 3 .......... 67        2,4            5,7         38

RISCOS                 linhas   em cacho (vizinho a ≤15 linhas)
  instante 1 .......... 13       13 de 13
  instante 2 .......... 17       17 de 17
  instante 3 ..........  9        9 de 9
  cor .................. maioria colorida (490/305, 957/53, 543/174)
```

**E uma armadilha que me mordeu no meio disto, que vale mais que os números
acima:** ao acrescentar a função da faixa, ela foi parar DENTRO do corpo de
`vhsFim` — GLSL não aceita função dentro de função. O shader não compilou, o
motor pulou o efeito e o quadro saiu **igualzinho ao original**. E eu não
percebi na hora porque estava medindo PROXIES (quantos pixels claros, quantas
linhas mudaram) em vez de perguntar as duas coisas simples:

```
1. R.progFor('vhs') devolveu um programa?
2. o quadro com efeito difere do quadro sem efeito?
```

Um efeito que não compila vira passa-tudo silencioso — não dá erro, não pinta
preto, não avisa. **Todo teste de efeito começa por essas duas perguntas.**

### O que NÃO foi feito
- **Nada foi VISTO em movimento por mim.** As medidas provam que cada
  controle faz o que promete; a folha de contato mostra quadros parados.
  Fita é tempo — o julgamento de como isso se comporta rodando é seu.
- **A faixa colorida no topo** que aparece numa das capturas da referência.
  Aqui o vinco e o tracking passeiam pela altura em vez de morar no topo;
  se ele quiser a faixa fixa lá, é uma linha em `vhsVinco`.
- **A imagem com alfa não acompanha a mecânica.** O deslocamento move a cor,
  não o alfa, como já era no efeito antigo.

---

## 4z. O BIQUAD NO `D` (décima sexta passada)

O `D` só tinha filtros de UM POLO: 6 dB por oitava. Isso é uma inclinação,
não um corte, e a 4v tinha medido o preço — o TELEFONE deixava **30% da
energia fora** da banda de 300 a 3400 Hz, e o que o ouvido lê nesses 30% é
"voz abafada" e não "voz no telefone".

Entrou o biquad do cookbook do Bristow-Johnson: dois polos e dois zeros, sete
tipos (passa-baixa, passa-alta, passa-banda, rejeita-banda, pico e as duas
prateleiras), com Q e ganho. A conta é em **direta transposta II** — menos
estado e menos erro acumulado em buffer longo que a direta I.

E junto veio `D.butter(b, tipo, hz, polos)`, a cascata Butterworth: os Q de
cada estágio saem dos ângulos dos polos, `Q_k = 1/(2·cos((2k+1)π/2n))`. Com
os Q certos o **−3 dB cai exatamente na frequência pedida**, sem o fator de
correção que a cascata de um polo precisava para não encolher a banda. Ordem
ímpar ganha um estágio de um polo no fim, que é o filtro simples que já
existia.

### Medido

Primeiro o instrumento, que aqui é o próprio filtro contra a resposta que a
teoria manda:

```
passa-baixa em 1 kHz          2 polos      4 polos
  250 Hz .................... −0,02 dB
  500 Hz .................... −0,26       −0,02
  1000 Hz (o corte) ......... −3,01       −3,01
  2000 Hz ................... −12,37      −24,25
  4000 Hz ................... −24,48      −48,92
```

−3,01 dB no corte e 12 dB por oitava por par de polos: é a Butterworth do
livro. Depois os dois módulos que motivaram o pedido, com ruído branco na
entrada e a energia medida por FFT — medidor independente dos filtros que
estão sendo julgados:

```
                        antes (4v)    agora
TELEFONE, 300–3400 Hz .... 69,5%      92,2%   (só o filtro: 92,5%)
RÁDIO, 180–4500 Hz ....... 66,2%      92,4%   (só o filtro: 92,5%)
entrada (ruído branco) ... 13,4% e 18,5% da energia nessas bandas
```

Os 7,5% que sobram são a saia do filtro, não a sujeira dos módulos: desligar
aperto, sujeira e chiado move o número em três décimos.

**A paridade com o trabalhador se manteve sozinha**, que era o ponto de ele
rodar o mesmo texto: TELEFONE, RÁDIO, MATÉRIA e ESPECTRAL saem **idênticos
amostra a amostra** entre a linha principal e o Worker, sem eu tocar em nada
do lado de lá.

### O que muda para quem já usava

O som do TELEFONE e do RÁDIO **muda** — é o conserto de um número errado, não
um ajuste de gosto. Os parâmetros são os mesmos (`grave`, `agudo`, e o
resto), então projeto salvo continua achando tudo; o que ele vai ouvir é a
banda que os controles sempre prometeram.

### O que NÃO foi feito

- **Os outros usos de um polo continuam de um polo** — MATÉRIA e ESPACIAL
  usam `D.passaBaixa` para colorir, e ali inclinação é o que se quer.
- **Nada foi ouvido.** A banda está medida; se o telefone agora soa apertado
  demais é ouvido, e ouvido eu não tenho.

---

## 5a. A REGIÃO DO EFEITO GANHOU TRAÇADO (décima sétima passada)

A região de um efeito eram quatro formas paramétricas — retângulo, elipse e as
duas faixas. O pedido da lista era "alça de Bézier por vértice na máscara de
EFEITO (a de camada já tem)", e a primeira coisa a decidir foi o que NÃO fazer:
uma segunda caneta, com um segundo editor na prévia, uma segunda animação de
vértice e uma segunda picagem de curva. Seriam quatrocentas linhas duplicadas
para dar ao efeito o que a camada já sabe fazer.

**A região do efeito APONTA para um traçado do clipe.** Uma forma nova,
TRAÇADO, e um campo `path` que diz qual. As alças, a animação por vértice, o
editor de caneta na prévia e a picagem da curva continuam existindo em um lugar
só — e agora servem aos dois. Um contorno é desenhado uma vez e vale para
recortar a camada, para limitar um efeito, ou para os dois.

### O que foi preciso ligar

```
comp.js    VE.maskPtsAnimados — os vértices já passados por valueAt viraram
           função, porque agora quem lê o traçado são DOIS caminhos
state.js   a região resolve o traçado apontado e leva os vértices no op
fx.js      maskValue ganhou a forma 5: distância ao polígono já picado,
           lida de uma textura de ponto flutuante (unidade 8, que estava
           livre desde a sétima passada)
gl.js      pica a curva uma vez por efeito — não uma por passada — e sobe
           para a MESMA textura de pontos da máscara de camada
motion.js  o botão TRAÇADO, o seletor de qual, e o botão que cria um e já
           abre a caneta na prévia
```

Na forma TRAÇADO os campos mudam de nome porque mudam de significado:
**Deslocar X/Y, Escala, Rotação e Borda** — a mesma convenção da caneta da
camada, onde `h` não é usada. E os cinco continuam animáveis, como sempre.

### Medido

Efeito INVERTER sobre um azul chapado, num quadro de 400×300 (120.000 pixels),
com um quadrado de vértices cobrindo 30% × 40% do quadro:

```
sem região .................... 120.000 pixels invertidos
com o traçado ................. 14.400   — que é exatamente 0,3 × 0,4
   dentro do contorno ......... (221,187,51)  o azul invertido
   fora ....................... (34,68,204)   o azul intacto
invertendo a região ........... 105.600  = 120.000 − 14.400
o MESMO quadrado suavizado
com as alças da caneta ........ 19.512   — a curva abaúla, e é a alça que faz
escala 0,5 .................... 3.600    = 14.400 / 4
escala 1,5 .................... 32.400   = 14.400 × 2,25
```

**O modelo também foi conferido, não só o motor:** um clipe de verdade com
traçado e efeito devolve a região com os quatro vértices no lugar; um keyframe
em `masks.0.pts.0.x` move o contorno do efeito no tempo (0,200 no começo,
0,900 no fim); e apontar para um traçado que não existe mais faz a região
voltar a ser **TUDO** em vez de recortar errado.

**Pela interface**, que é onde campo que aparece costuma não funcionar: os seis
botões de REGIÃO aparecem, clicar em TRAÇADO grava 5 no modelo, o seletor lista
os traçados do clipe, e o botão DESENHAR UM TRAÇADO cria a máscara, aponta o
efeito para ela e entra no modo caneta. **O traçado criado assim nasce sem
cortar a camada** (`on = 0`) — quem pediu foi a região do efeito, e cortar a
camada inteira seria surpresa.

E os 144 efeitos continuam compilando: o PRELUDE mudou para todos eles.

### O que NÃO foi feito

- **Não há caneta própria do efeito.** Se o clipe não tem traçado, o painel
  oferece criar um — e o que se edita é uma máscara de camada, na aba dela.
- **Um traçado por efeito.** Combinar dois contornos (somar, subtrair) é o que
  a máscara de camada faz com `modo`; aqui a região é uma só.
- **Nada foi visto por mim em movimento.** A área está medida em pixels; se o
  contorno acompanha bem uma coisa que anda na cena, é olhando.

---

## 5b. MARCAR OBJETO: a I.A. preenchendo o traçado (décima oitava passada)

O último item da lista. A pesquisa da seção 13 já tinha escolhido o caminho —
`InteractiveSegmenter` do MediaPipe, rodando DENTRO do navegador — e dito como
ele deveria entrar: **um botão dentro da máscara que já existe**, gerando os
pontos do traçado. Foi assim que entrou.

### Um botão, dois trabalhos

```
traçado VAZIO   → MARCAR OBJETO   o contorno da coisa clicada vira os
                                  vértices, simplificados até caber em 48
traçado PRONTO  → SEGUIR          os vértices que já existem encostam no
                                  contorno deste quadro, sem mudar a
                                  quantidade nem perder as alças
```

A quantidade de vértices só é decidida na primeira vez, e isso não é detalhe:
um traçado que muda de número de pontos no meio da animação **não tem como ser
interpolado** — os keyframes que existiam viram lixo. Mantendo a contagem, o
SEGUIR convive com a rotoscopia à mão: marcar, avançar, seguir, corrigir.

### Como isto NÃO é uma dependência

A biblioteca e o modelo não estão no arquivo único e nunca estarão. São
buscados na primeira vez que alguém clica no botão (**2,1 s** medidos aqui,
uma vez por sessão) e, se não der — sem rede, arquivo aberto do disco, CSP que
barre o CDN —, o botão diz o motivo e o laboratório continua inteiro. Mesma
regra do trabalhador de áudio: acelera, não sustenta. E o processamento é
local: **nenhum quadro sai desta máquina**, que era a condição para o caminho
(a) ser o escolhido.

### Medido — primeiro sem I.A. nenhuma

Da máscara de bits para baixo é geometria pura, e foi testada com uma máscara
sintética de círculo, que tem área e perímetro conhecidos:

```
ilha do círculo R=70 ....... 15.373 px  (esperado 15.394 — 0,1%)
um respingo solto no canto . NÃO entrou no contorno (a ilha é a do clique)
contorno ................... 392 pixels de borda
simplificado ............... 46 pontos, com 1,21% de erro de área
encostar 4 vértices longe .. todos caíram a raio 70,0 — na borda exata
```

### Depois com a I.A. de verdade

```
carregar a biblioteca ...... 2,1 s (uma vez)
segmentar um quadro ........ ~1,0 s
círculo laranja de 110 px .. contorno com 44 pontos, raio médio 109 px,
                             área 12,5% do quadro (esperado 12,4%)
```

E o teste que fecha a corrente: o traçado que a I.A. desenhou, usado como
**recorte de camada**, deixa passar o objeto e corta o fundo —
**99,8% do objeto preservado e 1,6% de fundo vazando**.

*(Esse número precisou do instrumento consertado antes: a conta dava 43,5% de
objeto preservado, e o motivo era que a prévia renderiza em 1267×713 enquanto
o projeto é 1920×1080 — razão de área 0,436. É a terceira vez neste projeto
que o medidor precisou ser validado antes do código.)*

### Dois defeitos achados por medida, que passariam despercebidos

**1. A máscara vem INVERTIDA.** O `magic_touch` devolve a categoria do objeto
em **0** e o fundo em 255 — o contrário do que se espera. Com o limiar
"maior que o meio", 87,5% do quadro vinha marcado e o ponto clicado vinha
zero, então o contorno saía da moldura da tela. Em vez de escrever a convenção
na pedra (que muda com o modelo e com a versão), **o objeto passou a ser
definido pelo clique**: é a categoria que estiver embaixo do dedo. A
polaridade se corrige sozinha.

**2. Encostar no ponto mais perto não é seguir.** Com o objeto andando 0,2 da
largura — mais que o próprio raio —, o traçado inteiro **desabou na borda mais
próxima**: o centro foi de 0,427 para 0,486 quando o objeto tinha ido para
0,62. Metade dos vértices achou a beirada de perto e ficou lá. O conserto é o
que qualquer rastreador faz: **primeiro o grosso, depois o fino** — transladar
e escalar pelo centro e pelo raio médio, e só então encostar. Medido depois:

```
objeto foi para 0,62 ................ vértices em 0,623, raio 110
foi para 0,30/0,62 e cresceu p/ 150 . vértices em 0,304/0,613, raio 150
objeto parado ....................... não piorou o que já estava certo
```

### O que ele NÃO faz

- **Não propaga no tempo.** É por quadro, como a pesquisa já dizia. O
  rotoscópio continua sendo do artista; a I.A. adianta o primeiro contorno de
  cada quadro-chave. Propagação temporal seria SAM 2, que é outro tamanho de
  download e ainda depende de WebGPU (seção 13, caminho b).
- **Não entra no arquivo único.** Quem exporta o laboratório inteiro leva tudo
  menos isto.
- **Não foi visto acertando gente, pelo ou vidro.** Os testes usaram formas
  sintéticas de contorno conhecido, porque é o que dá para medir. Como ele se
  sai numa pessoa contra um fundo parecido é olho — e é seu.

---

## 5c. TRICÔ, SCANNER E A MESA DE DIGITALIZAÇÃO (décima nona passada)

Três coisas pedidas pelo Bruno, nesta ordem, e uma delas mudou de forma no meio
do caminho porque a primeira tentativa ficou confusa de usar.

### O que entrou

```
js/fx12.js    TRICÔ            malha generativa com ALFA REAL (família 05 PIXEL)
js/fx13.js    SCANNER DE VÍDEO fórmula de slit-scan por linha (família 04 GLITCH)
              SCANNER DE MESA  a PORTA para a janela — item de catálogo, não shader
js/mesa.js    o motor da mesa: cabeçote, filme, uma linha por vez
js/mesaui.js  a janela: bancada à esquerda, filme à direita, 4 grupos de controle
```

### 1. TRICÔ — a imagem virando malha, com vão transparente

Vinte controles (grade, matéria, cor, simetria, animação, fundo). O ponto que
faz dele uma ferramenta de composição e não um filtro é o **Fundo =
Transparente**: entre um ponto de tecido e outro não fica cor nenhuma, fica
alfa. Usa o mecanismo `alpha:true` / `vec4 fx4(uv)` que já existia — o alfa
atravessa máscara de camada, matte, modo de mistura e composição sem que nada
em `comp.js`/`compgl.js` precisasse mudar.

**Isolar o sujeito não é trabalho dele.** Quem faz isso é a máscara CANETA com
o botão MARCAR OBJETO (I.A.) da 5b. A receita é: Tricô com fundo transparente
(mata o alfa dos vãos) **+** máscara marcada pela I.A. (mata o alfa de tudo
fora do sujeito). Foi assim que o pedido de "pessoa virando tecido sobre outro
vídeo" foi atendido sem construir segmentação nova.

Medido lendo os pixels de volta: alfa variando 0↔255 de verdade; 256 valores
distintos de alfa na forma Orgânico (a borda suave na ordem certa); simetria
mudando ~50% dos pixels; animação Fluxo mudando 13.134 pixels entre t=0 e t=2 e
**Estática mudando ZERO** entre os mesmos instantes.

### 2. SCANNER DE VÍDEO — a fórmula

Efeito comum de pilha: cada linha é deslocada por uma senoide mais o gesto
gravado, com vãos de alfa real. Nasceu com treze controles e três camadas de
ruído; o Bruno usou, disse que **em vídeo não convence e em foto sim**, e a
versão que ficou tem oito controles e o aviso no próprio `desc` (é a primeira
linha que aparece na ficha e no catálogo).

**O gesto gravado (`rawCurve`) — e a versão que foi jogada fora.** A primeira
tentativa puxava dois parâmetros animáveis (`offX`/`offY`) e exigia ligar o
cronômetro antes de arrastar. Era fiel à arquitetura e mesmo assim confusa.
Agora é **aperte, arraste, solte**: o gesto inteiro é guardado em `e.trilha`
(128 pares reamostrados **pelo índice**, que é o ritmo da mão — a demora vira
espaço) e esticado do começo ao fim da digitalização. Clicar sem arrastar apaga.

O caminho genérico ficou de pé para quem vier depois: `rawCurve: true` no
efeito → `state.js` copia `e.trilha` para `curva`/`curvaN` → `gl.js` sobe numa
textura própria (`texCurva`, unidade 9) → o shader lê com `curvaEm(t)`.

**Dois bugs que a medida pegou e o olho não pegaria:**

1. **Sem gesto gravado, a imagem saía embaralhada.** O shader lia uma textura
   NÃO VINCULADA, e isso devolve lixo, não zero. Bastava acrescentar o efeito
   para a imagem quebrar. Guarda em `curvaEm`: se `uCurvaN < 1.5`, devolve zero.
2. **Uniform vaza entre clipes.** Uniform é por PROGRAMA e sobrevive ao quadro:
   um clipe sem gesto herdava o `uCurvaN` do clipe anterior e lia uma curva que
   não era dele. Agora `gl.js` zera explicitamente no ramo `else`.

Depois das duas: apagar o gesto restaura **exatamente** o estado limpo (0 pixels
de diferença) e intensidade 0 também — antes davam 369.203 pixels de diferença.

### 3. A MESA DE DIGITALIZAÇÃO — gravação, não fórmula

A distinção que organiza tudo, e que vale para qualquer instrumento futuro:

```
efeito (fx13)   uma FÓRMULA. Todo quadro recalcula do zero, em qualquer
                instante -> escrubável, exportável, cabe na pilha do clipe.
mesa (mesa.js)  uma GRAVAÇÃO. Cada linha guarda o que a fonte mostrava
                NAQUELE momento, e isso não se recalcula depois.
```

É por ser gravação que ela mora numa **janela** e que o resultado vira uma
**FONTE do laboratório**, pelo mesmo caminho do FRAME da câmera
(`media.js/camGrab` → `VE.media.register` → `VE.addMedia`). Nenhum exportador
novo, nenhuma timeline nova.

**O site de referência foi estudado por MEDIDA, não de olho.** Rodei
`yhhydesign.github.io/tools/scanner_glitch_Art.html` com a fila de
`requestAnimationFrame` bombeada à mão (o código é ofuscado; ler não ia
resolver) e li os pixels da saída. Isso respondeu a pergunta que decide tudo:

- **a fenda é MÓVEL, não fixa** — lê a linha `y` da fonte, escreve na linha `y`
  do filme; parado, a saída sai igual à entrada;
- arrastando 200 px durante o scan, a saída deslocou **exatamente 200 px a
  partir daquela linha**.

A nossa foi medida do mesmo jeito e deu **300 px para um arrasto de 300 px**.

**Como funciona em foto E em vídeo — a mesma mecânica, duas origens:**

```
FOTO    a distorção vem da mão: arrastar, ampliar e girar a bancada
        enquanto o cabeçote anda.
VÍDEO   a fonte anda sozinha: o vídeo TOCA durante o scan, então cada
        linha do filme é um QUADRO DIFERENTE. Quem se mexeu vira borrão
        contínuo, quem ficou parado sai nítido — slit-scan clássico, e
        saiu de graça: mesmo laço, só que a fonte é um <video>.
```

Provado com uma fonte que muda entre os passos: linha 250 saiu azul, 350
amarela, 450 magenta — cada uma capturou o instante certo.

**Desenho interno.** Cada linha é desenhada sozinha, recortada numa faixa de
1 px (`c.clip()`), com a fonte no estado atual — é o recorte por faixa que faz
o slit-scan. Desenhar a imagem inteira e recortar parece desperdício e é, mas é
o único jeito que respeita escala e giro sem reimplementar amostragem à mão, e
o navegador resolve na GPU.

**Fundo transparente (pedido depois de usar).** `par.transp` troca o `fillRect`
da faixa por `clearRect` — que respeita o recorte, então só apaga aquela linha.
No passe de grão/PB, pixel com alfa 0 fica **intocado**: pôr grão nele
escreveria cor por baixo de alfa zero, e é dessa cor escondida que nascem os
halos na composição. Medido: 480.924 pixels com alfa 0, 599.076 opacos,
**zero pixels com cor escondida**.

### A ÚNICA porta que a janela abriu para fora

`js/mesaui.js` expõe **`U.pintar`** — a função que redesenha as duas telas.
Ela era privada; virou porta porque a repaginação 2.0 acrescentou uma MANIVELA
que anda com o cabeçote linha a linha (`RGB_LAB-2.0.md`, seção 5aj) e precisa
mandar as telas se refazerem depois de andar.

É a única linha que o 2.0 escreveu neste arquivo, e ela não muda
comportamento nenhum: quem não chamar continua vendo o mesmo. `js/mesa.js` —
o motor — não foi tocado.

A manivela usa `VE.mesa.linha`, a MESMA primitiva que `M.passo` usa a cada
quadro. Não há caminho paralelo de gravação: girar o knob e deixar o cabeçote
andar sozinho escrevem a mesma linha pelo mesmo lugar.

### O que o Bruno pegou usando, e que a medida não tinha pegado

1. **"Clico em scanner e não abre a janela."** A porta estava na barra de
   transporte, com outro nome (ESCANEAR), e ele clicou no CATÁLOGO — que é onde
   se procura. Virou item de catálogo com `janela: 'mesa'`: o clique abre a
   janela em vez de acrescentar efeito (tratado em `panels.js/renderFxList`,
   antes da checagem de projeto, porque a mesa gera fonte e funciona com o
   laboratório vazio). Arrastar o item para cima de um clipe fica bloqueado.
   Ele está registrado em **`fx13.js` e não em `mesa.js`** de propósito:
   `fxfam.js` carrega depois de fx13 e antes de mesa, e um item registrado
   depois dele fica fora das oito famílias.
2. **"Usar na composição diz que entrou e não vai pra linha do tempo."**
   Era bug: o botão registrava a fonte e avisava, mas nunca chamava
   `VE.addMedia`. Agora faz o caminho inteiro (ensureProject → addMedia →
   pushHistory → emit → fecha a janela → vai para a vista de vídeo).
3. **Sessão vazia grudada.** Reabrir preservava a sessão para não perder scan
   em andamento — e com isso trazia de volta uma mesa SEM FONTE e com filme do
   tamanho errado. Agora `serveAinda()` só preserva se houver **linha gravada**.
4. **Botão no lugar certo.** Ele pediu o SCANNER na grade FONTE, ao lado de
   TESTE. É o lugar certo por arquitetura também: a mesa gera matéria nova,
   como WEBCAM e TESTE. São três portas para a mesma sala (grade, catálogo,
   transporte) — a WEBCAM já era assim.

### Uma decisão tomada sem perguntar

O filme nasce do **tamanho da composição**, não de uma folha retrato fixa. A
metáfora do escâner pedia 900×1200, mas um filme retrato largado numa
composição 16:9 entra com tarja dos dois lados, e o lugar do resultado é a
linha do tempo. Sem projeto aberto, cai na folha 900×1200.

### Composição de ponta a ponta, medida

Azul numa pista abaixo, mesa com fundo transparente acima, um quadro
renderizado e lido: centro deu o vermelho do scan `[238,51,51]`, e **os quatro
cantos deram azul puro `[0,0,255]`** — sem halo, sem borda cinza.

> Um aviso metodológico que custou meia hora: um valor estranho
> (`[76,76,117]` num canto) me fez caçar bug no código quando a sujeira estava
> no MEU TESTE — eu tinha trocado `s.el` na mão e limpado o cache de textura.
> Refazendo do zero, passou limpo. **Quando o número não fecha, desconfie
> primeiro do instrumento** (é a mesma lição da seção 9).

### O que NÃO foi feito, e por quê

- **Nada disto foi VISTO por mim em material de verdade.** Formas sintéticas de
  contorno conhecido é o que dá para medir; se o tecido "parece tecido" e se o
  scan de uma foto sua fica bonito é olho, e é o seu.
- **A mesa não guarda o gesto para repetir depois.** Terminado o scan, o que
  existe é o filme. Regravar é escanear de novo.
- **Textura externa no Tricô** (imagem de referência para a paleta) ficou de
  fora: o sistema de parâmetros de efeito não tem tipo "imagem".
- **A ficha técnica queimada** existe na mesa (canto inferior esquerdo,
  desligável) mas **não** no efeito `scanner` — lá o lugar disso é uma camada de
  TEXTO, no canal de tipografia.

---

## 5d. FIAPOS NO TRICÔ, A BARRA DE ZOOM E OS CARTÕES LIMPOS (vigésima passada)

Três pedidos do Bruno, dos três tamanhos: um shader, uma peça de interface e uma
subtração.

### 1. FIAPOS — microfibras saindo dos pontos de tricô

O tecido do 5c era correto e limpo demais. Malha sem fio solto entrega na hora
que é grade: o olho lê padrão, não pano. Os fiapos são o que faltava.

Cada ponto emite fios num leque de setores em volta. Para o pixel que está sendo
desenhado: descubro em que setor ele caiu e testo só esse e os dois vizinhos —
o fio friza, então pode ter vindo de um setor ao lado. Cada fio tem existência,
comprimento, direção e torção sorteados por hash da célula, então nada treme
entre quadros. A varredura é 3x3 células porque o fio mais longo que existe
(0,85 de célula) somado ao alcance do ponto ainda não alcança a segunda vizinha.

Cinco controles: **Fiapos** (quantos), **Comprimento**, **Finura**, **Frisado**
e **Clarear**.

**A finura não fazia nada, e só a medida pegou.** Primeira versão: a cobertura
ia de 0,1393 para 0,1364 de uma ponta à outra do controle — 2%. O motivo é que
a banda de suavização (0,7 pixel) era mais larga que o próprio fio, e o
resultado era decidido por ela, não pela largura pedida. Consertado do jeito que
fio fino se comporta de verdade: a largura para de encolher em meio pixel e o
que continua caindo é a OPACIDADE. Depois disso a massa de tinta vai de 0,1931
(grosso) a 0,0852 (fino) — 2,3 vezes.

Medido, com o shader compilado num contexto WebGL2 de teste e os pixels lidos de
volta:

```
fiapo em 0        cobertura 0,0642   pixels de alfa parcial: ZERO
fiapo em 0,5      cobertura 0,1610   parcial 0,0784
fiapo em 1        cobertura 0,2505   parcial 0,1371
comprimento 0,05  parcial 0,0193  ·  comprimento 1: parcial 0,3969
frisado 0 vs 1    12,3% dos pixels mudam  ·  frisado 0 vs 0,02: ZERO mudam
distância média do fiapo ao ponto mais próximo: 1,75 px (estática),
                                                1,70 px (animação Deriva)
```

A última linha é a que importa para a animação: o fiapo tinha que continuar
grudado no ponto quando a malha anda. Por isso `trCentro()` — a conta de onde
está o centro do ponto foi aberta para valer também para as células vizinhas.
Sem ela, o fio nasce no meio da célula enquanto o ponto está deslocado pela
organicidade, e a microfibra aparece descolada.

**O custo, e o que foi feito com ele.** Em 1080p, primeira versão: 7,7ms sem
fiapo, 22ms com fiapo no meio. Caro demais. Duas medidas resolveram: um teste
geométrico barato que joga fora a célula vizinha ANTES de gastar hash calculando
onde está o ponto dela, e o terceiro sorteio tirado dos dois primeiros em vez de
mais um `hash21`. Medido com os dois shaders no mesmo teste, mediana de cinco:

```
                antes    depois
fiapo 0,5       19,2ms   15,1ms
fiapo 0,6       19,3ms   15,3ms
fiapo no talo   31,5ms   28,9ms
```

O efeito nasce com **fiapo zero** justamente por isso. O que sobra para quem não
usa é 0,7ms de pressão de registrador (5,5ms sem este código, 6,2ms com ele
desligado) — anotado, não escondido.

### 2. A BARRA DE ZOOM DA LINHA DO TEMPO

O zoom já existia (`+` `−`, `Ctrl`+roda, `FIT`) mas o Bruno pediu de novo, o que
é o sintoma de sempre: existe e não se acha. O controle visível era um cursor
deslizante de 6 a 2400 px/s, linear — 90% do curso ficava numa faixa que ninguém
usa, e o número que ele mostrava (px/s) não diz nada a quem edita.

Saiu o cursor, entrou a **barra da Premiere**, embaixo da mesa: o bloco cinza é a
janela visível desenhada sobre a sequência inteira. Isso dá as duas coisas de uma
vez — arrastar o meio ROLA, arrastar uma ponta faz ZOOM com a outra ponta parada.
Clique no trilho vazio leva a janela até lá; duplo clique enquadra tudo.

**Toda operação de zoom ganhou ÂNCORA.** Aproximar sem âncora joga para fora da
tela justamente o trecho que o editor está olhando. Agora o zoom segura um
instante parado: o cursor do mouse (roda), o ponteiro de reprodução (teclado,
quando ele está visível) ou o centro da janela. Medido com o ponteiro em 30s e
três zooms de 2× seguidos: ele fica em 205,0 → 205,2 → 204,8 → 204,8 px da borda,
e volta em 204,2 depois de desfazer os três.

Medido, disparando os eventos de verdade na barra:

```
arrastar o meio      janela 25,52–34,89 → 31,95–41,31   px/s NÃO muda (60)
puxar ponta direita  esquerda fica em 31,95   px/s 60 → 110,7
puxar ponta esquerda direita fica em 37,02    px/s 110,7 → 48,8
clique em 80%        janela centrada em 48s de 60      px/s não muda
duplo clique         0–62,68  ·  px/s 9  (enquadrou)
Ctrl+roda e Alt+roda o instante sob o cursor: 27,186 nos dois (esperado 27,187)
```

Também: `Alt`+roda passou a fazer zoom (é o que a Premiere usa no Windows),
`Shift+\` enquadra a seleção, e o rótulo agora diz **quantos segundos cabem na
tela** antes do px/s.

**Dois defeitos achados pela medida, não pelo uso.** O primeiro:
`fitSequence()` com a mesa ainda sem largura (aba escondida, laboratório que não
abriu) fazia uma conta negativa que o limite mínimo transformava em 6 px/s. O
editor voltava para a aba e encontrava o zoom no fundo do poço sem ter pedido
nada. Agora, mesa sem largura, não faz nada.

O segundo: `setZoom(pps, âncora)` com uma âncora que está FORA da tela guardava a
distância absurda até ela. Medido: estando no fim da sequência, pedir zoom
ancorado em 0,1s deixava a janela no fim. Pela interface isso não acontece — a
âncora é sempre o cursor do mouse ou o ponteiro visível —, mas a função é
pública. Agora a distância fica presa à janela: quem pede um instante fora da
tela quer VER aquele instante. Depois do conserto, `setZoom(600, 0.1)` a partir
do fim cai em 0,10s, e a âncora dentro da tela continua exata (o ponteiro fica
em 269px por quatro zooms para dentro e quatro para fora).

### 3. OS CARTÕES DO ÍNDICE, SEM AS ETIQUETAS

Cada cartão de laboratório tinha uma fileira de quadradinhos — `TIMELINE`,
`139 EFEITOS`, `8 FAMÍLIAS`, `MÁSCARAS`… Saíram os três (HTML e CSS). Ficaram o
número, o nome e a linha de descrição. O cartão continua com os mesmos 238px de
altura e 21px de folga abaixo da descrição: a régua não mudou, só o ruído saiu.

### O que NÃO foi feito, e por quê

- **Nada disto foi visto por mim numa tela.** O painel do navegador estava
  fechado nesta sessão, então não houve screenshot. O que dá para medir foi
  medido — pixels lidos de volta da GPU, geometria da barra em px, eventos de
  ponteiro disparados de verdade. Se o fiapo *parece* microfibra e se a barra
  *cai bem* embaixo da mesa é olho, e é o seu.
- **O fiapo usa o `org` do pixel atual, não o da célula vizinha.** O valor exato
  dependeria do gradiente da imagem naquela célula: oito leituras de textura por
  vizinha. A distância média do fiapo ao ponto não muda (1,75px); o que aparece
  são uns poucos pixels soltos na animação ONDA com organicidade alta.
- **A barra de zoom não tem miniatura da sequência dentro** (a Premiere também
  não tem; o Resolve tem). Seria desenhar os clipes em escala no trilho.

---

## 5e. AS BARRAS QUE DOBRAM E O MOSAICO (vigésima primeira passada)

Dois pedidos, e o primeiro veio com o diagnóstico já pronto: "o botão de
original-png-export sempre some porque eu preciso alargar a coluna da direita".

### 1. NENHUM BOTÃO SOME MAIS

A reclamação era sobre alargar a coluna. Medindo, o problema era pior: **as
larguras PADRÃO, num monitor de 1440px, já cortavam**.

```
                       largura da barra   conteúdo   sobrando   o que sumia
barra do viewport            930px         1021px      91px     PNG, EXPORTAR
barra da linha do tempo      928px         1176px     248px     o grupo de zoom inteiro
```

Com as duas colunas em 600px, sumiam oito itens da barra do viewport e sete
grupos da linha do tempo. A barra da linha do tempo tinha `overflow-x:auto` com
`scrollbar-width:none` — ou seja, rolava, mas sem barra de rolagem visível.
Rolagem que ninguém vê é a mesma coisa que esconder.

A regra agora é `.barra-dobra`: a barra ganha uma FILEIRA em vez de cortar.
Três peças fazem funcionar, e cada uma resolve um jeito diferente de quebrar:

1. `flex-wrap:wrap` com `flex:0 0 auto` — a barra cresce em altura;
2. altura de fileira EXPLÍCITA (`--row`). Sem isso as fileiras despencam para a
   altura do texto: `height:100%` dentro de um pai de altura automática vira
   `auto`;
3. o espaçador cresce com força **1000** e o `::after` com força **1**. Na
   fileira que tem espaçador é ele que empurra — o grupo da direita continua
   encostado na direita, como sempre foi. Na última fileira, que não tem
   espaçador, quem preenche a sobra é o `::after`, e é ele que leva o filete
   até o fim da barra em vez de a linha terminar no meio, no último botão.

Faltava ainda o caso em que **um item sozinho é mais largo que a barra**: com
as colunas em 600px, o bloco de timecode e o grupo CORTAR continuavam vazando,
porque um item de flex não quebra por dentro sem mandar. Resolvido com
`flex-wrap` nos próprios grupos.

Medido depois, contando controles de verdade (botões, campos, seletores) e
perguntando de cada um se está dentro do retângulo da barra:

```
                    padrão   colunas 520/420   colunas 600/600
viewport (22)         0        0                 0     fora
transporte (17)       0        0                 0     fora
linha do tempo (26)   0        0                 0     fora
altura da barra     61/36/58  91/104/86       211/201/240 px
```

**A mesa cresce junto.** Se a barra dobrasse dentro da altura fixa da linha do
tempo, quem pagaria seriam as PISTAS: o botão não sumiria, mas a mesa sumiria
embaixo dele — a mesma reclamação com outro nome. Então `--tl-h` continua sendo
a altura que o Bruno arrastou e as fileiras que a barra ganhou entram como
`--tl-extra`, medido por `ResizeObserver`. As pistas ficam em 194–224px em todas
as larguras testadas.

Um detalhe que só apareceu arrastando: o observador responde no quadro
SEGUINTE, e a mesa dava um pulo atrasado atrás do dedo. Durante o arrasto a
medida é chamada na mão.

### 2. MOSAICO — a grade com um vídeo dentro de cada quadro

A tentação era um shader: uma grade em GLSL sai em meia hora. Mas um mosaico de
shader é um FILTRO — a grade come o clipe inteiro e nada dentro dela pode ser
aparado, atrasado, mascarado ou receber efeito próprio. O pedido foi "a opção de
inserir vídeos dentro desses mosaicos", no plural, e as duas referências que ele
mandou mostram exatamente isso: na segunda, uma fumaça branca ocupa as colunas
da esquerda e outro vídeo ocupa as da direita.

Então **cada célula é um CLIPE**. A grade é só geometria: calcula onde o quadro
cai e escreve no `motion` (posição e escala) e numa máscara de camada em caixa
(o recorte exato). Feito isso, a célula é um clipe como outro qualquer.

O que a torna reorganizável é uma etiqueta, `c.mosaico = {col, lin}`: por ela
dá para mudar colunas ou borda DEPOIS de montado e ver tudo se reposicionar.

**Duas descobertas que mudaram o desenho:**

*A primeira, no código que já existia:* `js/media.js` CLONA o elemento de vídeo
por clipe (`elFor`). Quer dizer que o mesmo arquivo em vinte células, cada uma
num instante diferente, funciona — e é por isso que a defasagem entre quadros
existe. Também é por isso que a janela avisa acima de duas dúzias: são duas
dúzias de decodificadores.

*A segunda, na medida:* a borda é escrita em fração da LARGURA e convertida para
a vertical multiplicando pela proporção da tela. Sem essa conversão, uma borda
de 1,2% em 1920×1080 sairia com 23px na horizontal e 13px na vertical. Medido
depois do conserto: 23px e 23px.

Medido, com os pixels lidos de volta da composição montada:

```
geometria (8 configurações)  quantidade certa, ZERO sobreposições em todas
borda 0 / 1,2% / 3%          0px / 23px / 57,6px, iguais nas duas direções
formato QUADRADO             proporção 1,000 (293×293 px)
formato LIVRE em 0,35        proporção 0,350 (214×612 px — em pé e fino)
formato LIVRE em 3           proporção 3,000 (609×203 px)
12 clipes montados           recorte bate com a célula dentro de 0,5px; imagem
                             cobre a célula e está centrada nela — 0 erros
faixas de imagem na tela     [15,312] [328,625] [641,938] [954,1251]
esperado pela grade          [15,312] [328,625] [641,938] [954,1251]  → erro 0px
mosaico 11×8 com 2 fontes    32/32 quadros à esquerda com a fonte A,
                             56/56 à direita com a B, 80/80 vãos transparentes
reorganizar de 4×3 p/ 2×2    4 quadros reposicionados, 8 devolvidos (não apagados)
```

**Um defeito que só o teste pegou:** pintar os quadros arrastando chamava o
redesenho da janela inteira a cada célula tocada. Numa grade de 11×8 isso é
oitenta e oito remontagens de oitenta e oito botões — a página parou por mais de
trinta segundos. Agora só o quadro tocado muda de dono e a contagem fica para o
quadro seguinte do navegador: os mesmos 88 quadros levam **291ms**.

### O botão estava no lugar errado

Ele abriu a lista, não achou, e disse: "NÃO TA DO LADO DE SCANNER NÃO". Estava
certo. O SCANNER mora em TRÊS lugares — a grade FONTE, o catálogo e a barra de
transporte — e a grade FONTE é onde se PROCURA, porque é lá que nasce matéria
nova. O mosaico tinha entrado só na barra de transporte.

Agora está nos mesmos dois lugares da mesa. E ocupa a LINHA INTEIRA da grade,
por dois motivos que se somam: com ele a grade passou a ter nove botões de meia
largura, o que deixava um buraco medido na última fileira; e ele não traz UMA
fonte para dentro, arma uma grade com as que já estão lá. Depois do conserto, o
buraco na grade é de 0px.

**A lição é a de sempre nesta pasta:** a função existia e estava medida, e mesmo
assim não servia, porque estava num lugar onde ninguém ia olhar. Medida prova
que o controle faz o que promete; só o uso prova que a ferramenta serve.

### O que NÃO foi feito, e por quê

- **A borda não tem cor própria.** Ela é VÃO — fora do quadro fica alfa, e o que
  aparece ali é a camada de baixo ou o fundo da composição. Dar cor a ela seria
  fechar a porta de empilhar um mosaico sobre outro, que é o que a referência 02
  pede. Para borda colorida: uma camada de cor sólida embaixo.
- **A grade não é um objeto.** Ela é a soma dos quadros cheios. Apagar um clipe
  apaga o quadro, e a grade não reclama — de propósito: uma grade que se defende
  vira uma coisa que não se pode editar à mão.
- **Não vi um vídeo de verdade dentro do mosaico.** O que entrou nas células do
  teste foram imagens sintéticas de cor conhecida, que é o que dá para medir. Se
  o mosaico de um vídeo SEU fica bonito é olho, e é o seu.
- **As barras do laboratório de ÁUDIO e de TIPOGRAFIA** usam a mesma
  `.vp-bar` e já dobram junto; o rack de áudio (`.rack-bar`) não foi mexido
  porque não chegou a cortar nada nas medidas.

---

## 5f. A CÂMERA POLAROID (vigésima segunda passada)

> ### ESTADO ATUAL — leia só isto se for continuar o polaroid
>
> As dezasseis subseções abaixo são o DIÁRIO de seis voltas, e boa parte
> descreve caminhos que foram desfeitos. O que vale hoje é isto:
>
> ```
> js/polaroid.js     o motor: filme (curva por canal), moldura, legenda, saída
> js/polaroidui.js   a tela: a câmera É a interface, sem cartão de janela
> css/polaroid.css   o palco, o recorte da chapa em três faixas, a telinha
> assets/polaroid/   camera.png · molduras/ · filmes/ · LEIA-ME.md
> ```
>
> **A tela.** Uma câmera flutuando num palco escuro. Fora a telinha de
> ajustes, todo comando é uma peça da máquina: lente carrega (2 cliques =
> clipe da linha do tempo), botão vermelho dispara, flash arma, botão
> esquerdo é a roda claro/escuro, **botão direito abre a telinha**, faixa
> arco-íris troca o filme, porta do filme leva à página PAPEL, plaqueta é
> leitura. A foto sai 90% para fora e **fica pendurada**; as duas saídas
> (baixar PNG, usar na linha do tempo) moram nela, ao passar o rato.
>
> **A telinha** desdobra da lateral por duas dobradiças, no desenho do
> laboratório (monoespaçada, filete de 1px, azul `--ch-video`). Dois
> níveis: índice de seis linhas → página, com `‹` para voltar.
>
> **O papel.** `molduras/papel.png` é a folha padrão e leva `realce: 0` no
> manifesto: é usada COMO ESTÁ, bit a bit. A reconstrução de trama que o
> código ainda tem serve só para folhas em JPEG (`realce: 1`), onde o
> relevo foi comido pela compressão. **Regra: PNG na pasta = nada
> acrescentado.**
>
> **Onde ele mora.** Grade FONTE do laboratório de vídeo e barra de
> transporte. No 2.0 ele está na aba **TOOLS** — e quem acrescentar outro
> instrumento tem de o declarar nas duas listas do `lab2.css` (ver 5f.16).
>
> **As três armadilhas que custaram voltas inteiras:**
> `preserve-3d` ignora o `z-index` (5f.10) · medir um sinal que já não
> existe devolve o ruído dele com cara de resposta (5f.15) · e o relógio
> de animação do painel é estrangulado, então medir logo depois de uma
> transição dá números de um elemento a meio do caminho (5f.11).


O pedido veio com a regra de desenho junto, e a regra é o que mandou em tudo:

> "O 3D deve estar a serviço da interface: não faça um objeto 3D decorativo.
> Cada elemento tridimensional deve corresponder a uma função real do polaroid."

Mais três coisas: usar a imagem da câmera do anexo e **fazer o recorte**; a foto
carregada tem de **sair** da máquina; e um botão abre uma **janelinha** com os
ajustes. E, separado, um pedido que ele marcou como importante: as fotos
originais de polaroid e as molduras texturizadas do papel ficam **numa pasta**.

### 1. A JANELA É A CÂMERA — não tem uma câmera dentro

Não há um único ponto de toque que não seja uma peça da máquina, e não há uma
peça da máquina que não faça o que ela faz na vida real:

```
peça                função de verdade            função na tela
lente               por onde a imagem entra      CARREGA a foto; mostra a
                                                 prévia através do vidro
disparador          dispara                      revela — a foto SAI pela fenda
barra do flash      flash                        arma o estouro de luz do disparo
olho elétrico       a roda claro/escuro do 1000  arrasta em volta: exposição
faixa arco-íris     a marca do filme             clique troca o filme
porta do filme      por onde se carrega o pacote ABRE A JANELINHA de ajustes
plaqueta            o modelo                     contador do pacote; clique
                                                 põe um pacote novo
fenda               por onde a foto sai          sai por ali; e aceita arquivo
                                                 largado em cima
```

Duas consequências que só apareceram por seguir a regra até o fim: **a porta
fecha sozinha quando se dispara** (ninguém dispara com o compartimento do filme
aberto), e **a janelinha fica aberta**, porque ela é útil e a porta não é ela.

### 2. O RECORTE — três faixas da MESMA chapa

`assets/polaroid/camera.png` (798×662, com alfa) aparece **três vezes**, partida
nas alturas medidas dentro do próprio arquivo:

```
faixa    altura da chapa    o que é                    profundidade
corpo    0 → 66,92%         lente, botões, faixa       z4
porta    66,92 → 87,61%     o painel do filme, gira    z5
base     87,61 → 100%       a fenda e o lábio          z2
                            A FOTO SAINDO              z3
                            a câmara do filme          z1
```

A ordem não é enfeite, é o mecanismo: a foto sai **entre a base e o corpo**.
Some por trás da máquina, aparece na fenda e passa por cima do lábio — que é
como um polaroid sai de verdade. As duas primeiras faixas são `clip-path`; a
porta não pode ser, porque `clip-path` não gira junto com o elemento: ela é uma
caixa com `overflow` e a chapa inteira dentro, posicionada para mostrar só a
faixa dela.

**Dois defeitos que só a tela mostrou, e ambos de mecanismo:**

1. **`transform-style:preserve-3d` mata o `z-index`.** Num contexto 3D o
   navegador empilha por GEOMETRIA e ignora a ordem declarada — e a foto
   guardada dentro da máquina aparecia flutuando ACIMA da câmera, no meio do
   cabeçalho da janela. O `preserve-3d` saiu do conjunto e a porta ganhou a
   própria `perspective()` na transformação dela. Continua girando em 3D; a
   ordem das camadas voltou a obedecer.

2. **A foto guardada precisava de uma CALHA.** Mesmo com a ordem certa, a parte
   dela que fica acima da borda de cima da câmera não tinha nada por cima para
   escondê-la. A calha (`.pol-tubo`) começa exatamente na borda de cima da
   fenda: o que está acima dela está DENTRO da máquina, e é o `overflow` da
   calha que esconde. Medido depois: a folha some inteira dentro da máquina e sai
   pela fenda, sem boiar em lugar nenhum. (A calha ganhou folga LATERAL na
   segunda volta — ver 5f.10.)

### 3. O PAPEL É ESCANEADO, E A JANELA FOI MEDIDA

A moldura não é um retângulo branco desenhado: é o escaneamento de uma folha
polaroid vazia, com trama, sujeira e o amarelado que muda de canto para canto.
O que o código precisa saber dela é onde termina a borda e começa a emulsão.

Medido nos dois escaneamentos, por varredura (a maior corrida contígua de
colunas e linhas que destoam da cor do papel — pegar a primeira e a última
acendia a textura solta das pontas e devolvia a folha inteira):

```
                    x        y        largura   altura
creme.jpg        0,0546   0,0543    0,8891    0,7414
preta.jpg        0,0545   0,0543    0,8875    0,7414
diferença        0,0001      0      0,0016       0
```

Dois escaneamentos independentes batendo em 0,2% — e batendo com o polaroid
600 de verdade, cuja área de imagem é 79×79 mm numa folha de 88×107 (0,898 e
0,738 contra os 0,889 e 0,741 medidos).

Molduras novas jogadas na pasta são **medidas na hora** pelo mesmo código.

**E o papel volta por cima.** Depois de compor a imagem, o recorte da janela é
redesenhado em `multiply` a 17% e `screen` a 10%, e a trama do papel reaparece
através da emulsão. É a diferença entre uma foto com borda branca e um polaroid.

### 4. O FILME É UMA CURVA POR CANAL, NÃO UMA DOMINANTE

O que faz um polaroid parecer polaroid é o **preto levantado**: o canal azul
começa em 0,42 em vez de 0, e é isso que dá o cinza leitoso no lugar da sombra.
Uma dominante por cima não faz isso — ela pinta a sombra, não a levanta.

```
out = lift + (1 − lift) · in^gama · ganho          por canal, tabela de 256
```

Oito filmes, medidos na mesma foto (percentis dentro da janela da emulsão):

```
            preto 1%        meio 50%       branco 99%
600        34  30  32      66  60  64     241 207 193   quente
SX-70      41  34  38      67  59  73     228 201 202   sombra magenta
779        30  33  42      55  61  86     217 202 213   frio
P&B        34  33  32      68  68  66     210 208 205   mono de verdade
EXPIRADO   42  56  61      72  93 109     213 211 216   dominante ciano
ESTOURADO 115 120 130     170 171 178     242 236 234   preto em 115
```

O `vintage` da referência foi implementado como **papel desbotando** — levanta o
preto e fecha o branco — e não como contraste caindo, que é o que dá cinza
chapado. Os outros quatro (temperatura, brilho, contraste, saturação) usam a
mesma escala 0–200 com 100 no meio, que é a que ele já conhece do site.

### 5. AMOSTRAR — por que a pasta de originais importa

A pasta `assets/polaroid/filmes/` não é galeria de exemplo: o laboratório **lê a
cor** dos escaneamentos. A conta é a inversa da curva — três percentis por canal
resolvem os três números:

```
lift  = p1                      (onde o preto passa a começar)
ganho = (p99 − lift)/(1 − lift) (onde o branco termina)
gama  = log((p50−lift)/((1−lift)·ganho)) / log(0,5)
```

Prova do fecho: os percentis dos dois originais foram medidos **fora do
navegador**, decodificando o JPEG/PNG em Node, e depois lidos de novo pelo
amostrador dentro da página. Bateram exatos:

```
                 medido em Node        lido pelo amostrador
original-01      r106  g133  b180      lift 106 / 133 / 180
original-02      r 23  g 78  b 85      lift  23 /  78 /  85
```

Um limite: `lift` é preso em 0,72. Sem a trava, um escaneamento quase todo
branco devolve uma curva que apaga qualquer foto.

### 6. A JANELINHA

Sai da porta do filme. Seis abas, cobrindo o que a referência tem. (Os nomes
das abas e o desenho dela mudaram na segunda volta — ver 5f.10.)

```
FILME     os 8 filmes, com a bolinha mostrando a curva aplicada a um cinza
          médio — a dominante DE VERDADE, não uma cor escolhida à mão;
          mais os originais da pasta, para amostrar
AJUSTES   temperatura, brilho, contraste, vintage, saturação (os cinco da
          referência) + halo, vinheta, grão, vazamento, desfoque
LEGENDA   escrita na tarja de baixo, que é para isso que ela existe
QUADRO    formato (quadrado, retrato, paisagem, wide), giro, enquadramento
PAPEL     as molduras da pasta + duas desenhadas, para nunca abrir sem papel
PRESETS   no MESMO cofre de `js/presets.js` (`kind:'polaroid'`), para saírem
          no mesmo .json quando ele exporta os presets do laboratório
```

O preset guarda a RECEITA (filme, coloração, papel, jeito da letra) e **não**
o enquadramento nem o texto — zoom, deslocamento e legenda são daquela foto, e
aplicar um preset não pode mexer no que já foi enquadrado à mão.

### 7. A PASTA MANDA

Uma promessa do pedido era "jogo os arquivos na pasta". Servidor de arquivo
estático não sabe listar pasta, então o `server.js` ganhou **duas rotas, e só
duas**: `api/polaroid/molduras` e `api/polaroid/filmes`, que devolvem os nomes
de imagem daquelas duas pastas e de mais nenhuma. Sem servidor, o laboratório
cai nos manifestos `.json` e continua funcionando.

### 8. O QUE FOI MEDIDO

```
janela da emulsão, dois escaneamentos      batem em 0,2%; e batem com o 600 real
peças da câmera, 8                         varredura do PNG; ficam em GEO, em fração
oito filmes                                percentis dentro da janela: distintos
amostragem, ida e volta                    Node × navegador: exato nos 6 canais
caminho completo no laboratório real       clipe de 1000×1232 na linha do tempo
as 6 abas da janelinha                     abrem sem erro, no papel e no darkroom
fechar por botão e por Esc                 fecham; reabrir mantém a foto
disparo → revelação → pacote               classe `tem revelado`, pacote 7/8, 1 mini
```

### 9. O QUE **NÃO** FOI CONFERIDO

- **O laboratório inteiro em foto.** O laço de animação do `index.html`
  estrangula a captura de tela; a câmera foi vista num banco de prova isolado
  (com um VE de mentira) e o `index.html` foi conferido por medida no DOM, não
  por imagem. Se algo do desenho brigar com a folha do 2.0, é aí que aparece.
- **Impressão.** A referência tem IMPRIMIR; aqui há BAIXAR PNG em tamanho de
  folha (1000×1232) e USAR NA LINHA DO TEMPO. Imprimir não entrou.
- **Edição em lote.** A referência baixa um `.zip` com vários; aqui o pacote
  guarda as 8 últimas para comparar e voltar, mas sai uma de cada vez.
- **Uma foto de verdade do Bruno.** Os testes de olho usaram uma imagem de
  referência da pasta e escaneamentos de polaroid. Se o filme fica bonito na
  foto DELE é olho, e é o dele.
- **A pasta cheia.** Ela tem dois escaneamentos de moldura e dois originais. O
  caminho de "muitos arquivos" (rolagem da lista, tempo de carga) nunca rodou
  com mais do que isso.

---

### 10. A SEGUNDA VOLTA — a janela sumiu

O Bruno olhou a primeira entrega e cortou a metade errada dela:

> "Eu não quero que tenha uma janela com a polaroid e sim a imagem da câmera
> flutuando entre si — então aumente a imagem da câmera e a foto sai da câmera e
> fica pendurada, aí você aperta um botão de editar e aí sim vai abrir uma
> janelinha (usar o mesmo estilo do site). Tirando essa janelinha os botões têm
> que estar nas câmeras."

O diagnóstico está certo e é o mesmo da repaginação 2.0: eu tinha construído a
coisa certa dentro da moldura errada. A câmera era o objeto, mas estava presa
num cartão de janela com cabeçalho, rodapé de seis botões e um painel de mesa
ao lado — e **três dos comandos moravam no rodapé, não na máquina**. Metade da
regra que ele mesmo tinha escrito (cada elemento corresponde a uma função real
do polaroid) estava sendo desobedecida pela casca.

**O que saiu:** `.modal-card`, `.modal-h`, `.modal-f`, o painel da mesa, a tira
de miniaturas do pacote e os cinco botões do rodapé.

**O que ficou no lugar:** um palco escuro e a câmera flutuando nele.

```
TROCAR FOTO   → a lente (um clique). Dois cliques: o clipe da linha do tempo
AJUSTES       → a porta do filme, que gira e abre a janelinha
BAIXAR PNG    → na PRÓPRIA FOTO pendurada, ao passar o rato
USAR NA LINHA → idem: são comandos da foto, não da máquina
PACOTE NOVO   → a plaqueta
FECHAR        → Esc, clique no fundo, e um × discreto no canto do palco —
                a única coisa da tela que não é peça de polaroid nenhum
```

#### A foto agora PENDURA

Ela sai da fenda, para com um tranco, **balança até assentar** e fica ali,
segura pela ponta de cima. Não vai para mesa nenhuma porque mesa nenhuma
existe. É nela que se arrasta para reenquadrar, gira a roda para aproximar, e é
sobre ela que a revelação corre. As anteriores continuam penduradas atrás,
espiando por baixo como um maço na mão — e clicar numa volta aos ajustes dela.

#### A conta que decide o tamanho da câmera

"Aumente a imagem da câmera" e "a foto fica pendurada" puxam para lados
opostos: quanto mais folha para fora, menor a câmera cabe. A conta fecha o
tamanho de uma vez:

```
altura da folha ÷ altura da câmera = 1,2525
folha 70% para fora  →  pende 0,6246 × largura da câmera abaixo dela
conjunto inteiro     =  1,4541 × largura da câmera
largura da câmera    =  altura disponível × 0,6877
```

Foi por essa conta que o quanto-fica-de-fora caiu de 78% para **70%**: em 0,78
a folha era decepada pela beirada numa tela de 900px; em 0,70 sobra respiro e a
câmera **cresceu**, que era o pedido. Os quatro lugares que dependem dela
(`--larg`, `PENDURA` no JS, o `margin-bottom` de `.com-folha` e o `bottom` da
calha) estão marcados um a um no código — mexer num sem os outros corta a
folha.

**Um desconto que não estava na conta de papel:** `rotateX(7deg)` faz a caixa
PINTADA ficar ~5% maior que a caixa de layout. A primeira conta, aritmeticamente
certa, cortava 6px da folha por causa disso. Os 104px descontados de `100vh`
são respiro mais essa folga.

**E a câmera só reserva o chão quando há foto.** Reservar sempre deixava a
máquina encostada no alto da tela com meia tela de vazio embaixo, esperando uma
foto que ainda não existia. Agora ela nasce centrada e SOBE enquanto a folha
desce — quem abre espaço é a coisa que está saindo.

#### Três defeitos de mecanismo nesta volta

1. **A calha decepava as fotos de trás.** Ela tinha a largura exata da fenda,
   e as anteriores, que ficam um pouco tortas, saíam pela lateral e eram
   cortadas na vertical pelo `overflow`. A calha precisa cortar PARA CIMA (o
   que está acima dela está dentro da máquina) e não para os lados: ganhou 7%
   de folga de cada lado, e `--pad`/`--folha` recolocam a folha no meio.

2. **Leque lateral não serve para objeto alto.** Girar uma folha de 596px em
   4,4° em torno da ponta de cima joga a ponta de baixo 45px para o lado. As
   anteriores passaram a espiar por BAIXO, com 1,5° de torção só para não
   ficarem alinhadas — que é como um maço de fotos se comporta na mão.

3. **A janelinha tapava a máquina.** Numa tela de 1360px elas mal se encostam,
   mas de 1100 para baixo a janelinha caía em cima da câmera. Com ela aberta o
   conjunto anda 12vw para a esquerda — tapar o objeto para mostrar o painel
   dele é o contrário do que esta tela é.

#### A janelinha, no estilo da referência *(refeita na terceira volta — ver 5f.11)*

É a única coisa da tela que não é câmera, e **parecer outra coisa ajuda a ler
isso**. Não usa o papel do laboratório: é escura, canto de 16px, cabeçalho
vermelho, trilho de ícones à esquerda com o ativo marcado em vermelho, título
grande, uma linha dizendo para que a aba serve, e a linha de controle da
referência — rótulo, barra com pega vermelha quadrada e caixa numérica ao lado,
que andam nos dois sentidos.

```
FILMES   os 8, com a bolinha mostrando a curva aplicada a um cinza médio,
         mais os originais da pasta para amostrar
EFEITOS  temperatura, brilho, contraste, vintage, saturação + halo, vinheta,
         grão, vazamento, desfoque
LEGENDA  o texto da tarja, a letra, o alinhamento e a cor da tinta
FORMATO  formato e giro
PAPEL    as molduras da pasta + duas desenhadas
PRESETS  no mesmo cofre de `js/presets.js` (`kind:'polaroid'`)
```

#### O que foi medido nesta volta

```
conjunto cabe na tela            1360×900: 56px em cima, 28px em baixo, nada cortado
                                 1180×720: idem, e a janelinha ao lado sem tapar
o caminho inteiro no lab2        6 abas montam, disparo revela, clipe de 1000×1232
não sobrou casca de janela       `#polPalco .modal-card` não existe
```

**Uma armadilha de medição que custou uma volta:** medir o layout logo depois
de disparar deu a câmera 160px fora do lugar. Não estava fora — a transição de
`margin-bottom` estava CONGELADA, porque o relógio de animação do painel é
estrangulado. A captura de tela força um quadro; medir DEPOIS dela devolveu os
números certos. Está na memória `rgb-lab-ver-a-tela`, e vale para qualquer
transição CSS medida por aqui.

---

### 11. A TERCEIRA VOLTA — a foto visível, dois botões, e a telinha com dobradiça

Quatro pedidos, e cada um consertou uma coisa que estava errada por decisão
minha, não por acaso:

> "A foto tem que estar praticamente visível ao sair da polaroid pra pessoa ver
> o que editar. Sinalizar ao passar o mouse na lente que ali é onde se faz o
> upload — nos outros é sinalizado, mas nesse não. Crie um segundo botão do lado
> de exposição, então diminua um pouco o botão pra caber os 2, esse segundo vai
> ser o botão de editar, na qual surgirá uma animação de tela desdobrando pro
> lado, como se ela abrisse por trás e viesse pra frente."

#### 1. A folha sai 90%, e a câmera paga por isso

Estava em 70% — o suficiente para *parecer* pendurada, não para se ver o que se
está editando. Em 90% a janela da emulsão inteira e quase toda a tarja
aparecem.

A conta é implacável, e é ela que manda no tamanho da câmera:

```
                  fora   pende abaixo   conjunto    câmera em 940px de tela
antes             70%    0,6246 × larg  1,4541      508 px
agora             90%    0,8324 × larg  1,6620      508 px  (a mesma!)
```

A câmera **não encolheu** porque a conta antiga tinha um desconto de 96px de
respiro que já cobria a diferença — o que mudou foi o conjunto ficar mais alto
e usar a tela toda. Medido em 1440×940: nada cortado, 52px em cima.

#### 2. A lente era a única peça muda

Todas as outras avisam o que fazem ao passar o rato. A lente não — e o motivo
era um `overflow:hidden` nela, posto para arredondar o vidro, que **engolia a
própria etiqueta** (ela fica 26px abaixo do elemento). O vidro já é redondo pelo
`border-radius` do canvas; o `overflow` não fazia falta nenhuma e fazia estrago.

Agora a lente é a peça que MAIS sinaliza, porque é por onde tudo começa: anel
azul, um **＋** dentro do vidro e a etiqueta
`CARREGAR FOTO · 2 CLIQUES: DO CLIPE`.

#### 3. Dois botões onde a arte tem um — o REMENDO

"Diminua um pouco o botão pra caber os 2" não dá para fazer num desenho que é
imagem. Mas dá para **remendar a chapa** e desenhar os dois em CSS, e a
varredura mostrou que ali isso é barato: o corpo da câmera é liso e de uma cor
só na faixa inteira.

```
corpo em y=230,250,270,290,306, de x=664 a x=756:   224  224  224 …  constante
cor exata                                            rgb(224,224,201)
olho elétrico original                               x 578..660, y 226..308
sombra dele                                          até y≈322
borda direita opaca do corpo                         x≈758
```

O remendo é uma elipse de cor chapada que **desaparece num degradê** nas bordas
— e como a vizinhança é 224 constante, não há emenda para ver. Por cima dele,
dois botões de 76px (o original tinha 82) nascem em CSS com a matéria do
original, lida dos pixels dele: centro escuro (#151514 no topo, #272726 no
meio), aro claro (#4a4948) e a sombra quente que o corpo faz por baixo.

```
esquerdo  x 562..638   a roda CLARO/ESCURO — arrasta-se em volta dele
direito   x 662..738   EDITAR — desdobra a telinha
```

#### 4. A telinha tem dobradiça, e ela vem de trás

`rotateY(112°)` com a origem na aresta esquerda deixa a telinha **dobrada atrás
da câmera**, de costas — e `backface-visibility:hidden` a esconde enquanto ela
está virada para o outro lado. Abrir é animar até `rotateY(0)`: ela aparece de
perfil, desdobra e vem para a frente. Duas dobradiças na lateral seguram o
conjunto, e o par inteiro anda 30,5% da largura para a esquerda para ficar
centrado.

Não é enfeite: **a dobradiça existe porque a tela tem de sair de algum lugar, e
o lugar é atrás.** É a mesma regra do resto da máquina.

#### 5. O desenho é o do laboratório

O anexo do Bruno era claro: monoespaçada em caixa alta, filete de 1px, ícone à
esquerda, seta à direita, e uma linha acesa em azul. O azul não foi escolhido
aqui — é `var(--ch-video)`, `#1b4fd8`, o canal de vídeo do próprio rgb_lab. A
telinha é uma tela do laboratório, e parece uma.

Dois níveis, como no desenho: um ÍNDICE de seis linhas e a página de cada uma.
O botão do cabeçalho vira `‹` dentro de uma página e volta um nível; só fecha a
telinha quando já está no índice. A linha acesa é a **última que ele abriu**,
para a telinha lembrar onde ele estava.

#### 6. Dois defeitos de caixa, ambos de flexbox

1. **A caixa numérica comia a barra inteira.** `flex:0 0 46px` não bastava: item
   de flex nasce com `min-width:auto`, e para um `<input>` isso é a largura
   INTRÍNSECA dele (~170px). Sem `min-width:0` o flex-basis é ignorado. A barra
   ficava com 60px e a caixa com 166.
2. **As seis linhas do índice não cabiam em 720px de altura.** A telinha subiu
   para 84% da altura da câmera e o respiro da linha caiu para 8px: seis linhas
   em 198px de conteúdo, dentro dos 207 disponíveis. Medido, não estimado.

#### 7. O que a porta do filme faz agora

Ela abria os ajustes; os ajustes mudaram de botão. Em vez de deixá-la fazendo o
mesmo que o botão novo, ela passou a fazer o que uma porta de filme faz: **abre,
mostra a câmara e põe um pacote novo**. A plaqueta ficou só com a leitura do
contador, ao passar o rato. Cada peça, uma função, e nenhuma repetida.

#### 8. O que foi medido

```
folha inteira na tela            1440×940 e 1280×720: nada cortado
seis linhas do índice sem rolar  1280×720: 198px de linha em 207 disponíveis
o remendo não deixa emenda       corpo 224,224,201 constante na faixa toda
caminho completo no lab2         6 páginas, volta ao índice, clipe 1000×1232
zero erro de console             no papel e no darkroom
```

**A armadilha de sempre, de novo:** medir logo depois de abrir a telinha deu a
barra com 60px e a caixa com 14 — números de um elemento ainda a meio da
rotação, porque o relógio de animação do painel é estrangulado. A captura de
tela força um quadro; medir DEPOIS dela devolveu os números certos. Está na
memória `rgb-lab-ver-a-tela`.

---

### 12. A QUARTA VOLTA — quatro acabamentos, e um deles apagou uma função

> "A dobradiça nem está encostando na câmera. Seja mais detalhista no botão de
> fechar e voltar, porque o símbolo fica pequeno ou torto. Isso de pacote novo 8
> poses serve pra quê? Não vi nenhuma utilidade. Faltou a textura do papel."

#### 1. A dobradiça boiava porque a chapa tem alfa

`left:100%` põe a dobradiça na borda da CAIXA, e a borda da caixa não é a borda
da CÂMERA: a chapa é um PNG com transparência, e na altura das dobradiças o
corpo termina antes.

```
altura   borda direita OPACA        altura   borda direita OPACA
y=100    x=752  (94,2%)             y=300    x=759  (95,1%)
y=140    x=753                      y=340    x=766
y=200    x=756                      y=400    x=796  (99,8% — já é a porta preta)
```

Quarenta pixels de vão, que era exatamente o que ele estava vendo. A dobradiça
passou a começar em **93,5%** — não encostada, *enfiada* no corpo, com folga
suficiente para continuar presa em toda a faixa em que ela vive (14%→48%, onde
a borda anda só de 752 a 759). Do outro lado, ela entra 13px por baixo da
telinha, como uma folha de dobradiça de verdade. Medido depois: encosta.

#### 2. Glifo de texto não serve para ícone

`✕` e `‹` são caracteres, e cada fonte os desenha num tamanho e numa altura de
base diferente. Num botão de 22px isso vira "pequeno" num caso e "torto" no
outro, e não há `line-height` que conserte os dois ao mesmo tempo. Os dois
viraram **SVG desenhado**, centrado por flex, no botão que cresceu para 26px. O
× do palco levou a mesma correção.

#### 3. "Pacote novo, 8 poses" não servia para nada — e saiu

Ele perguntou para que servia. Não servia: era um contador que, de oito em oito
fotos, obrigava a um clique para poder continuar. Atrito sem contrapartida.
**Saiu inteiro** — o contador, o limite e a mensagem.

Mas a porta do filme não podia ficar sem função, que é a regra desta tela. E a
função certa estava à vista: **o pacote é que decide em que PAPEL a foto sai.**
Agora a porta abre, mostra a câmara e leva direto à página PAPEL da telinha. A
plaqueta ficou com a leitura: filme, papel e nome da foto, ao passar o rato.

#### 4. A trama do papel estava lá — quase invisível

Medido na faixa branca do `creme.jpg`, em tamanho real:

```
mínimo 227   máximo 244   →  dezessete níveis em duzentos e cinquenta e seis
amplitude contra a média de janela 7×7 ................ 1,41
```

O escaneamento é bom e a trama existe (o mapa em ASCII mostra o losango, com
período de 10 a 14px). O que a come são três coisas em série: a compressão do
JPEG, a redução para o tamanho de prévia, e a redução que o navegador faz de
novo ao pintar.

A correção **não inventa textura**: pega a que está lá e aumenta o contraste
dela. Máscara de nitidez clássica — tira a média de uma janela do tamanho da
trama e devolve a diferença multiplicada por 3,4:

```
                      amplitude   média   estourados
antes, arquivo           1,41      236       —
depois, prévia 620px     6,61      237      3,8%
depois, folha 1000px     8,43      237      5,4%   ← ainda insuficiente, ver 5f.13
```

Custa um passe de pixel, e por isso é **guardado**: só refaz quando a moldura
ou o tamanho mudam, não a cada mexida num controle. Primeiro render em tamanho
de folha: 363ms; com o realce em cache, 234ms — e esses 234 são a emulsão, que
já custavam antes.

Um efeito colateral bom: a folha realçada passou a ser também a fonte dos dois
passes que devolvem o papel POR CIMA da foto (multiply 19%, screen 12%). Como
ela já está no tamanho de saída, o recorte é o mesmo retângulo — sumiu a
conversão de escala que havia ali, que era um lugar a menos para errar.

#### 5. O que foi medido

```
dobradiça encosta          esquerda em x=796, borda pintada em 809..813 → dentro
trama na prévia            amplitude 1,41 → 6,61, com 3,8% de estouro
trama na folha inteira     amplitude 8,43, média 237
porta do filme             abre a telinha já na página PAPEL
caminho completo no lab2   6 páginas, volta ao índice, clipe de 1000×1232
zero erro de console
```

---

### 13. A TRAMA — primeira tentativa, pela via errada *(corrigida em 5f.14)*

O Bruno voltou com o PNG exportado aberto a 161% e a faixa branca lisa:
*"a textura ainda não foi inserida"*. Do meu lado o número dizia que estava:
amplitude 8,4 contra 1,4 do arquivo, seis vezes mais. **Os dois estavam certos,
e o errado era o número.**

#### O que a medida não via

`amplitude` ali era a média do desvio contra a vizinhança. Ela sobe tanto com
trama boa quanto com borrão, e não diz nada sobre duas coisas que decidem se o
olho vê ou não:

1. **o ESTOURO.** Somando detalhe a um papel de média 237, os picos batiam no
   teto: 5% dos pixels iam a 255 e ficavam chapados — e ficavam chapados
   justamente nos altos da trama, que é onde ela aparece;
2. **o RAIO.** Com raio 4 o passa-altas devolvia um relevo mole. A trama do
   papel tem período medido de 10 a 14 px em 1000 px de largura; raio 3 pega o
   losango, raio 2 vira grão, raio 5 borra.

A prova só veio quando montei a comparação **na condição em que ele olhou** —
a mesma faixa, no mesmo zoom de 161%, o arquivo original em cima e as variantes
embaixo. Aí dá para ver, e o que se vê não é o que o número dizia.

#### O joelho

A correção que destravou foi comprimir o branco em vez de cortá-lo:

```
v = base·(1 − recuo) + detalhe
v > 236  →  236 + 19·(1 − e^−(v−236)/19)
```

Acima de 236 o branco caminha para 255 sem nunca lá chegar. O efeito na
medição é direto:

```
                              média   amplitude   estourados
arquivo original               237       1,9         0,0%
1ª tentativa (f 3,4 · r 4)     237       8,0         4,3%   ← lia como liso
sem joelho    (f 7,0 · r 3)    222      13,8         3,7%   ← papel acinzentado
COM joelho    (f 8,0 · r 3)    230      13,1         0,1%   ← papel claro, trama viva
```

Os quatro números estão nomeados no cabeçalho de `P.realce`, com o porquê de
cada um ao lado.

#### E uma brecha que podia ser a causa real

Enquanto investigava, achei um caminho em que o export saía **mesmo** sem
trama, e sem avisar: `P.moldura(id)` devolve o primeiro item da lista quando
não acha o pedido. Nos primeiros meio segundo da aba, antes de `carregarPastas`
responder, a lista só tem as folhas DESENHADAS — então pedir `'creme'` ali
devolvia a desenhada, e o papel desenhado é liso.

Agora `carregarMoldura` **espera** as pastas, e `carregarPastas` guarda a
própria promessa para ser lida uma vez só por aba. Conferido: pedir `'creme'`
na primeira linha de vida da página devolve o escaneamento de 1000×1232.

#### O custo

O realce é um passe de pixel guardado por moldura e tamanho. Em tamanho de
folha custa ~800 ms na primeira vez e some depois; a prévia usa outro tamanho,
então exportar paga uma vez. Para um botão de salvar, está pago.

#### O que ficou medido

```
trama no PNG exportado    média 230,1 · amplitude 13,1 · estourados 0,1%
vista a 161%              a trama LÊ como trama — conferida em imagem, não em número
moldura pedida cedo       devolve o escaneamento, não a folha desenhada
caminho completo no lab2  6 páginas, porta abrindo no PAPEL, clipe de 1000×1232
zero erro de console
```

**A lição, para a próxima:** medida prova que uma coisa mudou; não prova que
ela ficou visível. Quando o pedido é sobre o que se VÊ, a verificação tem de
ser uma imagem, na condição de quem olha — e de preferência lado a lado com a
referência. Está junto das outras em [[rgb-lab-armadilhas-medida]].

---

### 14. A TRAMA sintetizada — o caminho longo *(resolvido em 5f.15)*

Duas voltas afinando o realce e o Bruno continuando a dizer que não havia
textura. Ele tinha razão as duas vezes, e o erro estava na premissa: eu estava
a tentar **realçar uma trama que já não existia no arquivo**.

#### O que o 1:1 mostrou

Pôr o `creme.jpg` e a saída lado a lado, no tamanho real, sem redução nenhuma:

```
ARQUIVO creme.jpg 1:1     quase liso — dá para adivinhar um losango, nada mais
SAÍDA (máscara 1:1)       mancha quadriculada: BLOCO DE JPEG ampliado
```

A máscara de nitidez faz o que promete — aumenta o contraste local. Só que o
contraste local que restava no arquivo já não era papel: era o artefacto de
compressão de 8×8. Ampliar aquilo dava exatamente o que se via.

#### A medida que faltava fazer — e a que enganou

Autocorrelação do passa-altas, na faixa branca:

```
amplitude do que restou ... desvio padrão 2,35   ← quase nada
período que ela devolveu .. 23 × 13,5 px
```

O primeiro número é o veredicto: o relevo foi-se. **E o segundo estava errado.**
Num sinal cuja amplitude é 2,35, o que a autocorrelação mede é sobretudo o
bloco de 8×8 do JPEG — ela devolveu o período do RUÍDO com cara de resposta, e
eu desenhei a trama com ele. Saíram losangos grandes demais, e o Bruno voltou
a dizer, pela terceira vez, que não era aquilo.

O período bom veio de outro lado: ele mandou um recorte limpo do papel, e foi
**casar o desenho com a fotografia, lado a lado, no mesmo zoom**, variando o
período até bater:

```
23 × 13,5   grande demais — lê como losango desenhado
14 × 10     ainda grande
10 × 7,5    BATE com a referência
 8 × 6      fino demais, some
```

**Medir um sinal que já não existe devolve o ruído dele com cara de resposta.**
Quando a amplitude do que se quer medir é da ordem do erro, a medida não vale —
e a referência visual passa a ser o único instrumento honesto que sobra.

#### Reconstruir, não realçar

A trama passou a ser gerada com aquela geometria e gravada em RELEVO por cima
do escaneamento. O escaneamento continua a mandar em tudo o resto — cor,
amarelado que muda de canto para canto, manchas, a linha da emulsão, as bordas.
Só volta o que a compressão apagou.

```
h = cos u + cos v          u,v = as duas diagonais do losango 10×7,5
s = ∇h · luz               o que se pinta é a INCLINAÇÃO contra a luz
```

**A luz tem de ser de lado, e isso não é gosto.** A inclinação decompõe-se
exatamente nas duas famílias de onda, pesadas por (lx+ly) e (lx−ly). Com a luz
na diagonal (−0,62 −0,78) isso dá 1,40 contra 0,16: uma família nove vezes mais
forte que a outra, e o resultado são **listras**, não losangos. Só com
lx·ly = 0 as duas pesam igual e a trama cruza. Foi preciso ver para perceber.

Mais duas coisas para não parecer estampa de impressora: uma 2.ª harmónica que
aperta o vale entre os losangos (sem ela o relevo é ondulação mole), e duas
ondas lentas incomensuráveis que entortam a grade de leve.

#### O custo

Seis senos por pixel numa folha de 1000×1232 são sete milhões e meio de
chamadas: 925 ms. Com tabela de 4096 entradas, **574 ms** no primeiro render e
273 ms com o realce em cache — e a diferença não se vê num relevo.

#### O que ficou medido

```
folha 1000px      média 236,4 · trama visível · 0,4% de estouro
período final     10 × 7,5 px, casado com o recorte que o Bruno mandou
1.º render        661 ms · com cache 267 ms
caminho no lab2   clipe de 1000×1232, zero erro de console
```

#### A nota honesta, para o futuro

O que está no ecrã é a trama do papel DELE, com o período e a proporção medidos
no ficheiro dele — mas o relevo é reconstruído, não fotografado. Se um dia
houver um escaneamento com menos compressão, o caminho certo é baixar
`TRAMA.alt` e deixar o papel de verdade aparecer: quanto mais relevo real vier
no ficheiro, menos precisa ser reconstruído.

---

### 15. O ARQUIVO CERTO ESTAVA NA PASTA

Cinco tentativas de pôr trama no papel, todas erradas, e a certa era não fazer
nada: o Bruno pôs `exemplo filme2.png` na pasta de referências — o MESMO papel,
mas em PNG, 240 KB contra os 55 KB do JPEG. A trama está lá, intacta.

O que as tentativas anteriores fizeram, e por que falharam:

```
realçar o JPEG        amplificava o bloco de compressão, não a trama
sintetizar a 23×13,5  período medido no ruído — losango grande demais
sintetizar a 10×7,5   período contado a olho — errado, e eu a insistir
```

E a medida no PNG fecha a conta: período **23 × 13 px**, igual ao que a
autocorrelação do JPEG dizia. O meu erro de olho é que tinha levado aquilo para
10 × 7,5.

**O que ficou:** a moldura `papel.png` é a folha padrão e leva `realce: 0` no
manifesto — desenha-se o escaneamento e acabou. Conferido pixel a pixel na
borda: diferença média 0, diferença máxima 0. A moldura É o arquivo dele.

A reconstrução continua no código, mas só para folhas em JPEG (`realce: 1`),
onde ela existe porque não sobrou outra coisa. Quem puser um PNG na pasta ganha
o papel de verdade, sem nada acrescentado — e é isso que o manifesto agora diz,
em uma linha, para a próxima pessoa não repetir a viagem.

**A lição, e é a mesma de sempre nesta passada:** antes de reconstruir o que
falta num arquivo, perguntar se existe um arquivo melhor. Eu passei três voltas
a afinar constantes quando a pergunta certa custava uma frase.

---

### 16. O POLAROID ESTAVA NA ABA ERRADA — e tinha empurrado o scanner

"Jogue essa função para a sessão de tools, onde está o scanner." Fui olhar, e o
botão POLAROID já estava colado ao SCANNER na grade FONTE do index.html. O que
não estava certo era o que a pele 2.0 faz com essa grade.

O 2.0 divide a mesma seção em duas abas — a divisão é por natureza, não por
arrumação: **MÍDIA** é o que TRAZ material de fora, **TOOLS** é o que FABRICA
material a partir do que já existe. E quem decide não é o HTML: é um punhado de
regras em `lab2.css` que listam, por id, quais botões aparecem em cada aba.

O POLAROID não estava em nenhuma das duas listas. O resultado:

```
em MÍDIA   aparecia — e não é importação, é instrumento
em TOOLS   sumia    — que é justamente onde ele devia estar
e de quebra  tomou o 8.º lugar da grade de importação e empurrou
             SCANNER, MOSAICO e SOBREPOR para fora da vista
```

Daí o sintoma que chegou. O Bruno pediu para pôr o polaroid onde está o
scanner; o que ele estava vendo era o polaroid **no lugar** do scanner.

A correção são duas linhas — `#srcPolaroid` nas duas listas. Medido depois:

```
MÍDIA   ARQUIVO, WEBCAM, IMAGEM, TEXTO, LEGENDA, ÁUDIO, TESTE   (os 7 que importam)
TOOLS   SCANNER, MOSAICO, POLAROID, SOBREPOR                    (os 4 instrumentos)
Classic os 11 na mesma grade, sem abas — como sempre foi
```

**A armadilha, anotada no próprio CSS:** acrescentar um instrumento à grade
FONTE e esquecer de o declarar nas duas listas **não dá erro nenhum**. O botão
só aparece do lado errado, e o sintoma chega disfarçado de "sumiu outra coisa".
Está escrito lá em cima das regras, para a próxima pessoa não repetir.

---

## 5g. O SONÓGRAFO E A CIFRA (vigésima terceira passada)

> ### ESTADO ATUAL — leia só isto se for continuar os dois instrumentos
>
> ```
> js/musica.js       O NÚCLEO MUSICAL, novo: escalas, vozes, síntese,
>                    escritor de .mid e renderização offline
> js/sonografo.js    o motor do music scanner (detector + geometria da linha)
> js/sonografoui.js  o aparelho: visor, régua, piano roll, mesa de controle
> css/sonografo.css  o chassi de metal, o palco escuro
> js/cifra.js        o motor da cifra (campo harmônico, acordes, gravação)
> js/cifraui.js      o aparelho: pastilhas, teclado, gravador
> css/cifra.css      o corpo de marfim
> ```
>
> **O SONÓGRAFO** é o "music scanner": uma linha PARADA sobre o vídeo, e o
> que atravessa a linha vira nota. Vídeo → linha fixa → sensor → nota →
> som. Não é a linha que anda; é a imagem. Sai em MIDI, em WAV, ou direto
> como clipe de áudio na linha do tempo.
>
> **A CIFRA** é o campo harmônico à mão: escolhe-se tom e escala e os
> acordes daquela tonalidade aparecem em pastilhas. Toca-se com o rato ou
> com o teclado, grava-se, e vai para a linha do tempo **ou para a FONTE
> do rack de áudio**.
>
> **Onde moram.** O sonógrafo tem DUAS portas — aba **TOOLS** do vídeo (é
> lá que o vídeo está) e **FERRAMENTAS** do áudio (é lá que o resultado
> vive). A cifra só no áudio. Quem acrescentar instrumento à grade FONTE
> do vídeo tem de o declarar nas DUAS listas do `lab2.css`; quem
> acrescentar SEÇÃO ao `#sideAudio` tem de recontar os `sec:` da torre em
> `lab2.js` (ver 5g.9 — foi assim que o PRESETS do áudio ficou sem porta).
>
> **As armadilhas que custaram voltas** (todas anotadas no
> código): o botão de sensibilidade andava ao CONTRÁRIO (5g.3) · o fundo
> da subtração tem três laços fechados e nenhum dá erro (5g.3) ·
> comprimento escrito à mão dentro de `.mid` (5g.3) · intensidade
> desenhada como transparência some no fundo escuro (5g.5) · `getBBox()`
> em elemento escondido devolve zero e o teste PASSA (5g.6).

---

### 5g.1 O pedido, e onde os instrumentos foram parar

O pedido do sonógrafo veio com um documento de 23 seções e uma insistência:
**a linha não se movimenta**. Ela fica parada onde se põe, e quem se mexe é o
conteúdo do vídeo. Um carro cruza a linha, o sensor lê o que cruzou, nasce uma
nota. Isso tinha de ficar óbvio na tela — e é o que os três desenhos
simultâneos fazem: o dente acende na linha, a nota nasce no rolo por baixo
dele, e cresce enquanto o objeto ainda está passando.

A dúvida dele era a casa: TOOLS do vídeo ou FERRAMENTAS do áudio. **A resposta
foi as duas**, e não por indecisão: o instrumento come VÍDEO e devolve ÁUDIO.
No LAB 02 ele é o irmão exótico do botão DO VÍDEO — tira som da IMAGEM em vez
da trilha. No LAB 01 ele está onde o vídeo está na hora em que a ideia aparece.
Uma máquina só, duas portas, como a mesa e o mosaico já faziam.

A cifra não tem essa dúvida: não come vídeo nenhum, e mora só no áudio.

### 5g.2 O detector do sonógrafo, e por que ele é barato

Não se analisa o quadro. Só uma BANDA fina em volta da linha, reamostrada para
**64 células × 6 amostras = 384 pixels por quadro**, qualquer que seja a
resolução da fonte. Um vídeo 4K custa o mesmo que um 480p.

A banda é lida por **transformação, não por recorte**: a matriz leva o
retângulo orientado da linha direto para o canvas de leitura. É isso que faz a
DIAGONAL custar o mesmo que a vertical — sem ela, diagonal viraria varredura
pixel a pixel em JavaScript.

```
x_canvas = (LARG/banda) · ( (p−c)·n + banda/2 )
y_canvas = (CEL/comp)   · ( (p−c)·d + comp/2  )
```

com `d` ao longo da linha e `n` através dela. A **célula 0 é sempre a ponta de
cima** (a da esquerda, na horizontal) — é o que permite dizer "topo = agudo"
sem um `if` por orientação espalhado pelo código.

Três freios impedem o dilúvio de notas, e nenhum é opcional: **limiar com
histerese**, **refratário por célula** e **teto por quadro** (só as N mais
ativas viram nota; o resto é descartado, não enfileirado).

**Medido**, com um objeto de 44 px cruzando uma linha vertical:

| travessia real | duração da nota |
|---|---|
| 0,18 s | 0,20 s |
| 0,40 s | 0,43 s |
| 0,80 s | 0,80 s |
| 1,57 s | 1,60 s |

Uma travessia = uma nota, com a duração do cruzamento. Ruído estático: **0
notas**. Ruído em MOVIMENTO (chuva), 5 s: **8 notas**. Corte de cena: **um
acorde e silêncio** (64 notas, a última aos 2,5 s).

### 5g.3 As quatro armadilhas do sonógrafo, todas medidas

**1. A SENSIBILIDADE andava ao contrário.** Subir o botão baixava o número de
notas — 42 no padrão contra 21 no máximo — porque limiar mais baixo também
atrasa o FECHO do evento, e evento que não fecha não pode reabrir. Lição geral:
**todo controle com sentido prometido tem de ser medido numa CURVA, não num
ponto.** Cinco valores do botão, uma cena só, e a coluna lida de cima a baixo.

**2. A subtração de fundo tem três laços fechados**, e cada um parece bug de
outra coisa:

- fundo rápido demais alcança o objeto NO MEIO da travessia e parte uma nota em
  duas, com duração mentirosa;
- fundo lento demais deixa resíduo depois da saída e a nota não morre —
  travessia de 0,4 s soando **1,77 s**;
- copiar o valor de agora para o fundo ao fechar NÃO resolve, porque no instante
  do fecho o sinal ainda está CAINDO (medido: 0,096 a caminho de 0,064), e o
  resíduo abre uma nota nova que congela o fundo que a sustenta.

A saída foi uma **janela de recuperação**: por 0,22 s a célula não dispara e o
fundo persegue depressa. E o fundo CONGELA durante o evento (5 % do passo), com
os 5 % que sobram servem para absorver mudança permanente — um corte de cena
— em uns dez segundos.

**3. Comprimento escrito à mão dentro de formato binário.** O `.mid` tinha
`vlq(9)` na frente de um texto de 17 bytes. Cabeçalho perfeito (MThd, MTrk,
formato 0, 480 pulsos), arquivo do tamanho esperado, e **zero notas legíveis**,
porque o leitor seguia oito bytes adiantado. Arquivo binário só está provado
depois de ser LIDO DE VOLTA por um analisador que conta os eventos e chega ao
fim exato da trilha.

**4. Quando a linha ANDA, o fundo não pode congelar.** Todo o raciocínio supõe
linha parada — o fundo é a memória do que estava naquele lugar antes. No modo
imagem (a linha varre a foto) o lugar muda a cada quadro. Congelar travava
tudo: medido, uma varredura de 2 s sobre uma imagem listrada dava **quatro
notas no total**. Com o passo rápido quando `linha.pos` mudou: 292.

### 5g.4 O vídeo inteiro na vista

A primeira montagem empilhava mesa de controle e rodapé por baixo da cavidade.
As duas somavam quase 400 px: sobravam **170 px de visor**, e um vídeo 4:3
entrava como uma tira fina. O Bruno viu na hora.

Três coisas foram necessárias, não uma:

1. **A mesa em coluna à direita** (`clamp(272px, 26vw, 336px)`), que rola por
   dentro se não couber em pé. O que sobra de largura é do vídeo.
2. **Altura presa em `94vh`, não `max-height`** — com `max-height` o aparelho
   encolhia até o conteúdo, e o conteúdo mais alto tinha passado a ser a coluna
   de controles: sobravam 116 px de palco vazio enquanto o vídeo era espremido.
3. **A tela virou `position:absolute; inset:0`** — este era o defeito de
   verdade. Com `height:100%` numa caixa flex que o irmão aperta, o canvas
   continua MEDINDO a altura que pediu enquanto o visor já foi cortado; a conta
   de enquadramento usa uma altura que não existe e o quadro sai cortado.

| janela | visor antes | depois | quadro 4:3 |
|---|---|---|---|
| 1600×950 | 170 px | **487 px** | 240×180 → **649×487** |
| 980×880 | 170 px | **426 px** | 240×180 → **568×426** |

**A quebra para pilha desceu de 1040 px para 620 px**, e o número saiu de medir
os dois arranjos: numa janela de 980, empilhado dá 240×180 e em coluna dá
568×426. Empilhar cedo devolvia exatamente a tira que a coluna veio consertar.

### 5g.5 A cor, e o piano roll que sumia no modo papel

O roxo saiu; entrou `--ch-video`, **herdado e não copiado** — a variável muda
com o tema e com a pele, e o instrumento acompanha. As nove cores que estavam
escritas à mão dentro do canvas passaram a ser lidas da folha
(`--sg-cor`, `--sg-cor-cl`), para que linha, nota e régua não possam discordar
dos botões.

Aí apareceu o problema, e só a medida o pegou. No modo **papel** `--ch-video`
vale `#1b4fd8` — afinado contra papel, escuro demais contra o palco preto desta
janela. Medido no rolo: nota mais forte com contraste **2,84**, mais fraca com
**1,34**. O mínimo para um elemento gráfico é 3,0. Metade do piano roll sumia.

Duas correções:

- **O tom sobe só quando precisa**, por MISTURA com o tom claro (multiplicar
  estoura o canal azul em 255 e a cor escorrega para ciano). No papel mistura
  15 %: 2,97 → 3,71. No noturno e no 2.0 devolve a cor **intacta**, mistura 0.
- **A intensidade virou brilho, não transparência.** Nota fraca com alfa baixo
  sobre quase-preto não informa "intensidade baixa", informa ausência — o rolo
  mentia sobre quantas notas existem. Agora toda nota é opaca e anda do piso ao
  tom claro: **4,3 a 6,3** de contraste, contra 1,34–2,84.

O CLARO (`--sg-cor-cl`) é fixo e sempre luminoso de propósito: é ele que desenha
o fio de 1 px da linha e a cabeça do rolo. Amarrá-lo ao tema faria o fio sumir
no modo papel — e o fio é o instrumento.

### 5g.6 O nome, e a renomeação por inteiro

Chamou-se LEITORA ÓPTICA por uma volta. O Bruno pediu opções; escolheu
**SONÓGRAFO** — a máquina que escreve som, nome próprio de aparelho, do mesmo
tipo de POLAROID e MOSAICO. "Music Scanner" ficou como subtítulo na placa.

Renomeou-se **tudo**: arquivo, namespace, ids e classes (prefixo `sg`).
Meio-nome é pior que nome nenhum — daqui a três meses ninguém acha `leitora`
procurando por sonógrafo.

**A armadilha da conferência do ícone:** `getBBox()` num elemento escondido
devolve zeros, e zeros passam em qualquer teste de "está tudo dentro da caixa".
O ícone teve de ser clonado para um SVG VISÍVEL e rasterizado (5 peças, todas
dentro do 24×24, 42 % de cobertura) para a medida valer.

### 5g.7 O NÚCLEO MUSICAL, e por que ele existe

Escalas, vozes, síntese, escritor de `.mid` e renderização nasceram dentro do
sonógrafo, quando havia um instrumento só. Ao aparecer o segundo, a escolha era
copiar duzentas linhas ou promovê-las. **Copiar significaria dois bancos de
timbre que divergem no primeiro conserto, e dois escritores de `.mid` dos quais
só um teria o comprimento de etiqueta corrigido.** Então promoveu-se, para
`js/musica.js`.

O sonógrafo continua expondo os mesmos nomes (`VE.sonografo.VOZES`, `.tocar`,
`.midi`, `.render`): lá dentro são APELIDOS. Nada que já funcionava mudou de
endereço, e por isso as medições que o provaram continuam válidas — **foram
repassadas depois da extração, número a número, e deram igual**.

A regra que organiza `musica.js`: **só entra o que MAIS DE UM instrumento usa
hoje.** Acordes e campo harmônico são teoria tão geral quanto escalas e mesmo
assim ficaram em `cifra.js`, porque só um instrumento os usa. Quando o segundo
precisar, sobem — e não antes.

Uma decisão de dentro do núcleo, que vale para o resto: as dez vozes são
**sintetizadas, não amostras**. É escopo — um banco de sons é muito arquivo — e
é também o que faz o áudio exportado ser idêntico ao que se ouviu, porque o ao
vivo e o `OfflineAudioContext` correm o MESMO código.

### 5g.8 A CIFRA

As sete pastilhas saem de **empilhar terças dentro da escala**, não de uma
tabela de acordes. É isso que faz trocar de escala refazer o campo inteiro
sozinho, e faz os casos difíceis saírem certos sem ninguém os ter
escrito:

| escala | campo |
|---|---|
| C maior | `C Dm Em F G Am Bdim` |
| C menor harmônica | `Cm Ddim **D#aug** Fm **G** G# Bdim` |
| C dórico | `Cm Dm D# **F** Gm Adim A#` |
| C pentatônica | 5 pastilhas: `C D7sus4 E7sus4 Gsus4 A7sus4` |

O V maior na menor harmônica e o IV maior no dórico são a assinatura de cada
uma. Escalas de cinco graus dão **cinco** pastilhas — a grade lê o comprimento
do campo, não um número fixo.

**O nome do acorde é lido de volta dos INTERVALOS**, nunca guardado junto: se a
conta produzir um acorde, o nome descreve o que a conta produziu. Foi assim que
apareceram os `sus` das pentatônicas, que ninguém tinha previsto e estão
certos. (E foi assim que se viu que a ordem estava errada: escreve-se
**D7sus4**, nunca `Dsus47`.)

**A gravação começa na PRIMEIRA NOTA, não ao armar.** Contar desde o clique
enche o começo da peça de silêncio para aparar depois. Medido: primeiro acorde
`[60 64 67]` no tique **zero** do `.mid`.

Três destinos: **USAR NA COMPOSIÇÃO** (clipe de áudio na linha do tempo),
**MANDAR PRO RACK** (vira a FONTE do lab de áudio, para passar pela cadeia) e
MIDI/WAV em arquivo.

### 5g.9 A torre do áudio, e uma regressão desta passada

Ao inserir a seção FERRAMENTAS entre FONTE e CADEIA no `#sideAudio`, as seções
de baixo foram empurradas — **e a torre do 2.0 aponta para elas por POSIÇÃO**
(`sec: 0,1,2`). Resultado: CADEIA abria FERRAMENTAS, PRESETS abria CADEIA, e
**PRESETS ficou sem porta nenhuma**. Não dá erro; cada botão continua abrindo
alguma coisa, só a errada.

A torre do áudio é agora **FONTE · TOOLS · CADEIA · PRESETS**, com os `sec:`
recontados. A verificação que serve é clicar CADA botão e ler o rótulo do que
abriu, não olhar o código.

**E as pastilhas do TOOLS ficaram quadradas**, iguais às de MÍDIA. A regra
antiga dava a linha inteira a cada instrumento — fazia sentido com três; com
cinco virou uma coluna de faixas deitadas ao lado de uma MÍDIA de pastilhas
quadradas, dois desenhos para a mesma grade. Foram precisas DUAS correções: a
grade (`grid-template-columns:1fr` fora) e o `grid-column:1 / -1` que MOSAICO
(`-larga`) e SOBREPOR (`-hi`) herdam do `css/labs.css`. Só a primeira deixaria
dois dos cinco ainda esparramados.

### 5g.10 O que NÃO foi feito, e por quê

Do documento do sonógrafo ficaram de fora, de propósito, três coisas — são a
fase 2 que o próprio §23 dele manda deixar para depois:

- **§7 Banco de áudios** (Audio Library com categorias, busca, favoritos);
- **§8 Upload de sons do usuário** (WAV/MP3/AIFF/OGG associados a eventos);
- **§9 Sistema de regras de evento** (condição → resultado, combináveis).

As dez vozes sintetizadas de `musica.js` são o que está no lugar disso, e o
banco entra por cima delas sem reescrever nada.

**Nada dos dois instrumentos foi visto por mim em material de verdade.** O
painel do navegador estrangula `requestAnimationFrame` e a decodificação de
vídeo quando não está exibido; a prova foi por medida, por eventos sintéticos e
bombeando o laço à mão. Continua a valer o de sempre: **os defeitos graves
deste projeto foram achados pelo Bruno olhando para a tela.**

---

### Os arquivos que a vigésima quarta tocou

Para quem abrir a próxima sessão e quiser ir direto ao ponto.

```
NOVO
  js/audiotl.js      A MONTAGEM DE ÁUDIO — modelo e janela no mesmo arquivo
                     (o modelo tem quatro campos; separar seria indireção)

MEXIDOS, e onde
  js/type.js         num()/sel()/chk()/color() → um controle por linha ·
                     renderInspector com VE.panels.plate() · renderTools em
                     sete famílias · T.miniatura (motor emprestado) ·
                     T.arrastavel (painel que se move) · T.zerarTudo ·
                     a TRAMA (persiana, tiras, brilho, grão) em T.draw
  js/panels.js       P.initFills (o enchimento, com init PRÓPRIO) ·
                     P.pintarFills · P.foldDefault
  js/audio.js        fazerEspectro / desenharEspectro / limparEspectro ·
                     drawWave tira a altura do espaço que há ·
                     sendToTimeline com ensureProject · o clique no NOME
                     abre módulo desligado
  js/shell.js        renderAudioInspector perdeu a placa CADEIA · S.go troca
                     #props ↔ #propsAudio · setMode limpa o espectrograma
  js/app.js          Ctrl+Z da tipografia ACIMA da guarda de projeto ·
                     ao() tolerante · #auMontagem · redesenho no resize
  js/motion.js       motion.x: min era `-W` (função) → NaN
  js/recorteui.js    U.desfazer (não existia) · botão ↶ DESFAZER · --fill
  js/tintaui.js      T.desfazerTraco · fecha o recorte ao abrir · --fill
  index.html         #propsAudio (corpo próprio da coluna) · o rack saiu do
                     pé · #auSpec · #auMontagem · #auToTl · ty-cmds ·
                     o menu de cinco botões da tipografia saiu
  css/system.css     .prow + .prow-slider viram UMA caixa
  css/labs.css       .tctl · .tyfam · .tymini · .mprop-h · #propsAudio ·
                     .atl-* (a montagem) · onda e espectrograma empilhados
  css/lab2.css       seções 52 a 56: os mesmos no desenho do 2.0
```

**`lab2.html` é gerado** — `node build-lab2.js` depois de qualquer mexida no
`index.html`. Ele confere e diz quantos ids saíram.

---

## 5h. A TIPOGRAFIA REPAGINADA

> As seções **5h, 5i, 5j e 5k** são da MESMA sessão (a vigésima quarta,
> 30–31/08/2026). Estão separadas por assunto, e não por dia: cada uma nasceu
> de um pedido dele, e cada pedido nasceu do que o anterior deixou à vista.

> ### ESTADO ATUAL — leia só isto se for continuar
>
> ```
> js/type.js     num()/sel()/chk()/color() emitem UM controle por linha;
>                renderInspector() usa VE.panels.plate() (as placas recolhem);
>                renderTools() agrupa as 54 ferramentas em SEIS famílias
> js/panels.js   VE.panels.foldDefault(chaves) — novo, recolhe na 1ª visita
> css/labs.css   .tctl / .tnum / .tsel / .tchk / .tcol   e   .tyfam
> css/lab2.css   seção 52 — os mesmos controles no desenho do 2.0
> ```
>
> **O pedido do Bruno:** *"deixar o lab um pouco menos poluído"*, com o
> brik.space de referência (Analog Typewriter, Dynamic Typography Studio,
> Tactile, Dissolve — capturas em `REFERENCIAS/LAB TIPOGRAFIA`).
>
> **O diagnóstico, medido antes de tocar em nada:** a ficha da tipografia
> tinha **2363px de rolagem numa janela de 830** no Classic e **2804px em
> 808** no 2.0 — três telas e meia. Nenhuma das sete placas recolhia,
> embora o maquinário de recolher exista em `js/panels.js` desde sempre e
> a ficha do clipe já o usasse. E cada número ocupava DUAS linhas: o campo
> numa, o cursor deslizante solto embaixo na outra.
>
> **A lição desta passada:** *o 2.0 tinha embelezado a linha sem reduzir o
> número de linhas.* A seção 14 deixou a `.prow` virar caixa arredondada e
> encaixou o cursor no pé dela — ficou bonito e a ficha ficou **mais alta**
> (57px por controle contra 47 do Classic). A calma da referência não vem
> de linha bonita: vem de **pouca linha na tela**.
>
> **Três mudanças, todas de contagem de linhas:**
>
> ```
> 1  a linha É o campo          2 linhas → 1     30 linhas a menos
> 2  as sete placas recolhem    6 abertas → 0    (só TIPO na 1ª visita)
> 3  sete famílias na coluna    2 grupos → 7     14 itens à vista, não 56
> ```
>
> **Medido depois (mesma janela, mesma primeira visita):**
>
> ```
>                      CLASSIC              2.0
>                    antes  depois       antes  depois
> ficha, padrão       2,80    1,00 tela   3,50    1,00 tela
> ficha, tudo aberto  2,80    2,07        3,50    2,71
> ferramentas         4,10    1,16        2,80    1,00
> ```
>
> **O que ficou por medir:** nada foi visto por mim numa peça de verdade —
> o painel estrangula `requestAnimationFrame` quando não está exibido, e a
> prova de que os controles chegam ao motor foi por PIXEL (a ONDA espalha
> a tinta de 172 para 748px de altura; o ALINHAMENTO move o centro de
> massa de 518 para 546), não por olho.

---

### 5h.1 A LINHA É O CAMPO — e agora também é o cursor

No Classic cada número era assim:

```
┌─────────────────────────────────────┐
│ ONDA (ALTURA)              [  70  ] │   .prow          26px
├─────────────────────────────────────┤
│ ─────────●──────────────────────    │   .prow-slider   21px
└─────────────────────────────────────┘
```

Dois objetos para uma coisa só, 47px. O 2.0 juntou os dois num cartão
arredondado (seção 14) e chegou a 57px — **mais alto**, porque juntar
visualmente não é juntar.

Agora é uma caixa só, de 26px no Classic e 30px no 2.0:

```
┌─────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓ ONDA (ALTURA)      70   │   .tnum
└─────────────────────────────────────┘
   ↑ o enchimento é a leitura de onde o valor está na faixa
```

O `<input type=range>` continua lá, do tamanho da caixa inteira e com
`opacity:0`: é ele que arrasta, é ele que o teclado move com as setas, e é
ele que o `bind()` do `type.js` já sabia ouvir — **nenhuma linha de lógica
mudou**. Quem desenha é um `::before` cuja largura vem de `--fill`, escrito
pelo JS a cada movimento. O número à direita fica por cima do range
(`z-index:3`) e continua aceitando clique para digitar o valor exato.

**A barra sai do ZERO, não da borda.** Faixa que atravessa o zero —
DESLOCAR X de −800 a 800, ENTRELETRA de −120 a 300 — enchia da esquerda, e
o valor 0 aparecia com a caixa 28% cheia. Mentira visual num controle que
existe para dizer quanto. Agora `fill()` calcula onde o zero cai na faixa e
cresce de lá para o lado que o valor tomou; faixa que não passa pelo zero
(CORPO, de 12 a 600) segue enchendo da esquerda, como antes.

Os outros três controles — menu, marca e cor — ganharam a MESMA caixa de
26px, para a ficha ter um ritmo só. A marca e a cor são `<label>`, então a
linha inteira é alvo: clicar no rótulo alterna.

### 5h.2 As placas que já sabiam recolher

`VE.panels.plate()`, `initFold()`, `foldAll()`, `unfoldAll()`, o alt+clique
que deixa só uma aberta, o estado que sobrevive a recarregar — tudo isso
existe em `js/panels.js` e a ficha do clipe usa desde sempre. A ficha da
tipografia escrevia as placas à mão, sem o cabeçalho recolhível, e por isso
as sete ficavam abertas para sempre. Trocar por `PN.plate(título, corpo)`
foi o conserto mais barato desta passada e o de maior efeito: **2363 → 829px**.

Novo em `panels.js`: **`P.foldDefault(chaves)`**, que recolhe uma lista de
placas *uma vez*, na primeira visita, antes de o usuário ter opinião. O
`type.js` chama com as seis que não são TIPO, guardado por uma bandeira
própria no `localStorage` — a partir daí manda o que ele escolheu, e
`unfoldAll()` não é desfeito no próximo desenho.

### 5h.3 Seis famílias, um nível só

As 54 ferramentas estavam em dois grupos: FORMA com 12 e **ANIMAÇÃO com 42
num bloco indiviso** — 2193px de rolagem numa janela de 538, com ENTRA ESQ
a quatro telas de LAÇO · NEON. O arquivo já separava as famílias, por
comentário e pelo prefixo do id (`e_`, `s_`, `l_`, `c_`); a lista é que não.

Agora são sete irmãs, todas do mesmo tipo, todas recolhem
(MESAS chegou depois, em 5h.5):

```
MESAS       2   abrem uma folha por cima do palco (recortadas, à mão)
FORMA      12   o desenho da letra
TRAÇO       5   a letra sendo escrita — só nas famílias LAB
ENTRADAS   18   como as letras chegam ao quadro
SAÍDAS      5   como as letras vão embora
LAÇOS      10   o que fazem enquanto estão no quadro
PRONTOS     4   entrada, laço e saída num jogo só
```

**Um nível, não dois.** Grupo dentro de grupo seria uma árvore para
procurar ferramenta, e ninguém procura ferramenta numa árvore. A distinção
que importa — a primeira é desenho, as cinco seguintes são tempo — fica na
ORDEM e num filete antes de TRAÇO.

**O nome no cabeçalho, a frase no título de ajuda.** A primeira versão
punha a frase inteira na linha e as seis se cortavam no meio: *"TRAÇO · a
letra son…"*, *"PRONTOS · entrad…"*. Rótulo cortado não explica nada; só suja.

**Procurando, tudo abre.** Esconder resultado de busca atrás de uma
dobra é o pior que uma lista dobrável pode fazer. Conferido: buscar "onda"
devolve 2 itens em 2 famílias, nenhuma fechada.

### 5h.4 O que foi medido, e como

O painel estrangula `requestAnimationFrame` e a decodificação de vídeo
quando não está exibido — então o `canvas` fica em branco e o `toDataURL()`
não prova nada. A prova de que os controles novos chegam ao motor foi
chamando `VE.type.draw()` à mão e contando PIXEL DE TINTA:

```
ONDA          altura ocupada pela tinta   172px → 748px   (waveAmp 0 → 340)
ALINHAMENTO   centro de massa horizontal  518px → 546px   (esquerda → direita)
```

Duas armadilhas no caminho da medida, as duas anotadas porque vão voltar:

- **somar alfa não serve**: o fundo é opaco, então os 1.166.400 pixels do
  quadro têm alfa 255 e a soma é constante. Quem conta é a LUMINÂNCIA;
- **somar RGB também não serve** quando a letra é preta: preto sobre
  transparente dá zero dos dois lados.

Mais: `renderTools()` não relê o `localStorage` — o objeto de estado é lido
uma vez no carregamento e escrito a cada clique. Testar mexendo no
`localStorage` e chamando `renderTools()` não muda nada; tem de clicar.

E uma armadilha de teste, não de código: o **boot chama `S.go('home')`
sozinho** ao terminar (`shell.js`, fim da animação de arranque). Script de
teste que navega antes disso é atropelado, e a vista volta ao índice sem
que nada esteja quebrado. Espere `#boot` ficar `hidden` antes de navegar.

### 5h.5 O menuzinho de cinco botões tinha duas coisas dentro

Colado ao campo de texto havia uma coluna de cinco botões:

```
✂ LETRAS RECORTADAS      ← ferramenta: abre uma folha e FICA aberta
✎ ESCREVER À MÃO         ← ferramenta: idem
EXPLODIR LETRAS          ← comando: age uma vez e acabou
ZERAR                    ← comando
ALEATÓRIO                ← comando
```

Duas naturezas no mesmo menu. E o pior: as duas ferramentas de verdade — as
únicas do laboratório em que se trabalha com a mão — estavam **fora do
catálogo**, num canto onde ninguém procura ferramenta.

**As duas mesas foram para a coluna da esquerda**, na família nova `MESAS`,
primeira da lista, com o mesmo item das outras 54. São ferramentas de
ESTADO: o item acende enquanto a mesa está aberta e clicar de novo fecha —
por isso trazem símbolo (`✂`, `✎`) no lugar do número, que quer dizer "a de
nº 7 do catálogo", e mesa não é isso.

**Os três comandos foram para a barra do laboratório**, lado a lado, ao lado
de TELA e ANIMAR. E o campo de texto ficou com a largura inteira.

**Três acoplamentos que isto mexeu, todos anotados no código:**

- `js/recorteui.js` e `js/tintaui.js` procuram `#tyRecorte` / `#tyTinta` para
  marcar `.active`. Os botões eram estáticos e agora são desenhados por
  `renderTools()` — o id foi junto, então acende o próprio item da lista, que
  é onde a mão está olhando. Os dois módulos **não foram tocados**;
- os mesmos dois prendem um clique naqueles ids ao carregar a página e marcam
  `__rec` / `__tinta` para não prender duas vezes. A ordem de carregamento diz
  que `prender()` roda antes e não acha nada; se um dia rodar depois,
  prenderia um segundo clique e a mesa abriria e fecharia no mesmo gesto.
  `renderTools()` põe a marca, e fecha essa porta;
- a terceira coluna do `.fxitem` tem **12px** — a medida do quadradinho de
  categoria. A etiqueta `MESA` pede 21 e era cortada (a `LAB` das cinco de
  traço também, desde antes). Em `.tytools` a coluna passou a `auto`, com a
  do meio em `minmax(0,1fr)` para não repetir a armadilha da seção 5b do 2.0.

**E uma regressão que a medida pegou:** pondo as duas mesas no COMEÇO do
vetor `TOOLS`, `BASE` — que é a `01` desde sempre — virou `03`, porque o
número impresso em cada item é `TOOLS.indexOf(t) + 1`. As mesas foram para o
FIM do vetor; a ordem de exibição vem de `TOOLFAMS`, onde `MESAS` é a
primeira. Conferido: BASE 01, ONDA 02, ÍMÃ 12, e as mesas sem número.

**Um defeito ANTIGO que só apareceu agora** — e é o argumento a favor de
mostrar estado na interface. O recorte fechava a tinta ao abrir
(`recorteui.js`); a tinta **não fechava o recorte**. As duas folhas ficavam
empilhadas no mesmo palco. Enquanto os dois botões eram um menu solto, nada
denunciava; com os dois na lista e **acesos os dois ao mesmo tempo**, a
mentira virou visível no primeiro teste. Uma linha em `js/tintaui.js`.
Conferido nos dois sentidos, e com as duas fechadas sobram zero folhas.

### 5h.6 A MINIATURA DE CADA FERRAMENTA — e o motor emprestado

O pedido dele: *"cada efeito tenha uma miniatura com o efeito em si, igual ao
lab visual, porém maior o quadrado de visualização, já que estamos falando de
letras"*.

**O ponto de método, e é o que faz a peça funcionar: a miniatura sai do MESMO
motor que desenha o palco.** Um renderizador pequeno escrito à parte teria de
reimplementar onda, fatia, repetição, escrita de traço, as 40 animações e
agora as quatro tramas — e mentiria no dia seguinte, na primeira vez que uma
delas mudasse.

Aqui o motor é **emprestado**. `T.miniatura(id, canvas)` guarda o estado do
módulo (`cv`, `cx`, `W`, `H`, `P`, `letters`, `selLetter`, `fitScale`), aponta
tudo para o canvas da miniatura, aplica a ferramenta, chama o `build()` e o
`draw()` de sempre, e devolve tudo no lugar. Nada é duplicado, e o que a
miniatura mostra é o que o palco vai fazer — por construção, não por
disciplina.

Tudo síncrono de propósito: um `await` no meio e o resto do laboratório leria
o estado emprestado.

**Três detalhes que o empréstimo exigiu:**

- `build()` chama `renderLetterChips()` e `updateInfo()`, que escrevem na tela
  de verdade. Uma bandeira `emMini` faz as duas voltarem cedo — senão a tira
  de letras do palco piscava a cada miniatura desenhada;
- `T.draw()` congela o tempo em 0 quando ANIMAR está desmarcado. Em 0 uma
  ENTRADA ainda não começou, e a miniatura sairia **em branco**. Na miniatura
  o tempo vem escolhido de fora, e cada família tem o seu instante:
  entrada em 55% da duração, saída perto do fim, traço em 62%, laço em 0,9s;
- `applyTool` misturava "mexer nos parâmetros" com "mexer no DOM e no
  histórico". Virou `aplicar(t)` + `depois(t)`, sem DOM, e as duas metades
  servem aos dois caminhos.

**O tamanho.** A lista de estilos do vídeo tem 46×46 (2.0, seção 26), medido
para reconhecer o pente do VHS e o verde do terminal — coisas de cor e de
trama, que sobrevivem em quadrado pequeno. Letra é larga e precisa de mais.
O quadro é 4:3 deitado: **64×48 no Classic, 88×66 no 2.0** (lá a coluna da
tipografia tem 320px contra os 206 do Classic). O buffer é 176×132 nos dois,
então nenhum serrilha. Medido: as fileiras ficaram todas com 83px, sem variar.

**Uma armadilha de relógio, e é a parte que vale guardar.** A fila das
miniaturas de efeito do vídeo usa `requestAnimationFrame`, e eu comecei
copiando isso. rAF tem um defeito que aqui é fatal: **onde o navegador não
está pintando, ele PARA** — aba de fundo, painel escondido, janela
minimizada. Medido neste ambiente: um laço de rAF não completou um segundo em
quarenta e cinco. A lista ficava em branco e nada no console dizia por quê.
A fila passou para `setTimeout`, que é estrangulado mas nunca parado.

**E uma segunda, do mesmo tipo.** A coluna tem altura ZERO no instante em que
o laboratório abre, e um `IntersectionObserver` cuja raiz mede zero não vê
nada entrar na tela. A primeira correção esperou em laço de `setTimeout(…,25)`
— e caiu na mesma armadilha ao contrário: temporizador de aba escondida é
preso em ~1s, então quarenta tentativas viravam quarenta segundos. Agora é um
`ResizeObserver`, que avisa no instante exato em que a coluna ganha altura,
sem laço e sem relógio.

### 5h.7 A TRAMA — quatro efeitos de QUADRO, das referências

Das capturas em `REFERENCIAS/LAB TIPOGRAFIA`. Nenhum deles cabe em
`drawGlyph`, porque nenhum é efeito de LETRA: acontecem sobre a composição
inteira, depois de todas as letras desenhadas. Um deles (TIRAS) precisa
recortar o quadro em pedaços e movê-los, o que só se faz com o quadro pronto
na mão. Por isso as letras vão para um buffer e a composição acontece depois.

```
PERSIANA   Dynamic Typography Studio — o quadro inteiro vira linha
           horizontal; onde a linha cruza a letra, ela engrossa. O fundo
           não fica limpo, fica PAUTADO, que é o que a referência faz
TIRAS      Tactile Shredder 2 — o papel cortado em tiras verticais que se
           separam, escorregam e não voltam a encostar. `tirasIrreg` faz a
           largura variar: tira toda igual lê como grade, não como papel
BRILHO     Dissolve — três cópias desfocadas em `lighter` por baixo da
           nítida. Luz fica embaixo do que a emite
GRÃO       Dissolve / Analog Typewriter — o ruído que tira da letra a
           limpeza de vetor
```

**Dois buffers, não um.** TIRAS recorta o quadro e PERSIANA pauta o que
sobrou; com as duas ligadas, fazer os dois no mesmo buffer é ler dele
enquanto se escreve nele. A primeira versão fazia isso e funcionava por
acidente. São dois elos de corrente, cada um com o seu.

**O grão, em duas versões.** A primeira era ruído cinza uniforme composto em
`overlay`, e sobre papel claro isso é quase a identidade: medido, a variância
do quadro foi de 2342 para 2363 — vinte e um, em dois mil. Grão que não se vê
não é grão. Agora são pontos pretos e brancos com alfa esparso (`random²`:
muitos fracos, poucos fortes), compostos por cima. Medido num retalho liso do
fundo, **na curva inteira** e não num ponto:

```
grão      0     0,2     0,45     0,9
variância 0   169,1    857,2   3428,6      e volta a 0 ao desligar
```

**E o grão respeita o alpha.** Com FUNDO TRANSPARENTE marcado ele passa a
`source-atop`: só vale onde já há tinta. Espalhá-lo pelo quadro encheria de
pontinhos opacos justamente a região que o LAB 03 promete entregar vazia —
a promessa é png com alpha para entrar por cima do vídeo.

**Custo medido**, quadro de 1080², orçamento de 16,7ms a 60fps:

```
sem trama 0,11 ms · persiana 1,07 · tiras 1,07 · brilho 0,34 · grão 0,10
```

**A miniatura do GRÃO saía idêntica à da BASE**, e por um motivo correto: na
miniatura o fundo é transparente, e com transparência o grão só existe dentro
da letra, onde não se vê. Duas ferramentas — GRÃO e BRILHO — pedem fundo na
prévia (`miniFundo`). Prévia que não mostra o efeito não é prévia.

### 5h.8 O Ctrl+Z que nunca funcionou, o ZERAR que zerava pela metade, e as duas mesas de época errada

Três pedidos numa mensagem só, e o primeiro descobriu um defeito antigo.

#### O Ctrl+Z estava morto no LAB 03

`js/app.js`, no `initKeys()`, tinha esta ordem:

```js
if (!VE.project) return;              ← a guarda
if (VE.shell.view === 'type') { …Ctrl+Z da tipografia… }
```

`VE.project` é a **composição de vídeo**. Quem entrasse pelo índice direto na
tipografia — que é o caminho normal de quem vai fazer um título — não tinha
projeto nenhum, a guarda devolvia, e Ctrl+Z **não fazia absolutamente nada,
sem aviso**. O bloco do áudio já estava certo, acima da guarda, com o
comentário explicando exatamente por quê; o da tipografia não.

O bloco subiu. A tipografia tem histórico próprio (`hist`/`hidx` em
`js/type.js`) e não depende de projeto de vídeo para coisa nenhuma.
Conferido com `VE.project` nulo: onda 250 → 0 no Ctrl+Z.

**E Ctrl+Z passou a saber onde a mão está.** Com uma mesa aberta ele desfaz o
gesto DELA — o traço que acabou de sair da caneta, o arrasto que acabou de
sair do dedo — e não o parâmetro de antes de a mesa abrir. Duas peças novas:

- `VE.tinta.desfazerTraco()` (`tintaui.js`): o modelo já tinha
  `T.desfazer(obj)`, faltava o gesto que repinta e recontа;
- `VE.recorteui.desfazer()` (`recorteui.js`): **o recorte não tinha desfazer
  nenhum**. Arrastou uma letra para o lugar errado e o único caminho de volta
  era ENDIREITAR, que devolve TODAS — perdendo as outras vinte que estavam
  certas. O histórico guarda só o que o gesto muda (posição e giro de UM
  pedaço), trinta passos. É uma mesa de arrastar letra, não um editor de
  texto. Ganhou botão `↶ DESFAZER` também: atalho sem botão é atalho que
  ninguém descobre.

#### O ZERAR zerava um terço

O botão ZERAR chamava `applyTool('reset')`, que é a ferramenta **BASE** do
catálogo — e BASE limpa a deformação e mantém fonte, cor, animação e agora as
quatro tramas. Está certo para uma ferramenta de catálogo; está errado para um
botão chamado ZERAR.

Agora ZERAR é `T.zerarTudo()`: devolve **tudo** ao estado de fábrica menos o
texto, que é dele e não é efeito. O estado de fábrica é uma cópia de `P`
tirada no carregamento, e não uma lista escrita à mão de "o que zerar" —
lista se esquece de crescer, e cresceu quatro vezes só nesta passada.

BASE continua no catálogo, fazendo o que sempre fez. São duas coisas
diferentes e agora dizem coisas diferentes.

Conferido na cadeia inteira, sem projeto de vídeo aberto:

```
GRÃO     → onda=70  grão=0.45
ZERAR    → onda=0   grão=0        (e o texto ficou)
Ctrl+Z   → onda=70  grão=0.45     (desfaz o ZERAR)
Ctrl+Z   → onda=70  grão=0
Ctrl+Y   → onda=70  grão=0.45
```

#### As duas mesas estavam com o desenho de outra época

O diagnóstico dele: *"esse estilo de menu faz parte do site antigo, não
atual"*. O motivo é curto de dizer — **`css/lab2.css` não tinha uma única
regra para `.tinta-bar`**. Os dois painéis caíam inteiros no desenho do
Classic: filete de 2px, sombra dura deslocada, faixa vermelha de cabeçalho, e
a fileira de controle em três pedaços (rótulo, trilho fino, número), que é
exatamente o que a ficha da direita deixou de ser em 5h.1.

Um painel do laboratório com dois vocabulários de controle é um painel de duas
épocas, e é isso que a captura dele mostrava.

Agora as duas mesas seguem o que o resto já diz:

- **a linha É o campo**, no Classic e no 2.0: caixa de 26/30px, rótulo
  embutido à esquerda, valor à direita, e a caixa se enche até onde o valor
  está na faixa. O `<input type=range>` continua por baixo, invisível, e
  nenhum dos dois arquivos trocou de evento — só passaram a escrever `--fill`;
- **o que flutua é vidro** (2.0, seção 17): canto de 16px, desfoque, sombra
  difusa. Estes dois flutuam sobre o palco, então não são chassi opaco;
- **o cabeçalho é título, não faixa de cor.** A cor do canal aparece no ponto
  e no botão principal, que é onde ela informa em vez de gritar;
- a marca virou interruptor e os botões viraram pílula, como na ficha.

**Uma armadilha de três pixels:** a caixa tem o valor preso à direita em 52px,
e a marca e a cor não têm valor nenhum. Sem `.ti-row:not(:has(input[type=range])) > b {display:none}`
sobrava um `<b>` vazio ocupando aqueles 52px e o rótulo ficava espremido no
que restava.

### 5h.9 O painel que se move, e a ficha do vídeo com o controle da tipografia

#### As mesas saíram do canto

As duas mesas nasciam presas no canto de cima à direita do palco, e era onde
o Bruno esbarrou: com a folha aberta ali, metade das letras fica por baixo do
painel — e as letras são o que ele foi ver.

`T.arrastavel(painel, chave)` em `js/type.js`, usado pelas duas. A pega é o
CABEÇALHO, nunca o corpo (que é todo controle) nem o botão SAIR (que fecharia
no meio do gesto). O lugar fica guardado por painel; duplo clique devolve ao
canto, que é o mesmo gesto dos divisores da mesa de edição.

**Uma guarda que a medida pediu:** o palco às vezes ainda não foi medido —
aba recém-aberta, painel escondido — e aí todos os retângulos vêm zero. Sem
guarda o limite prende tudo em 0,0, o painel salta para o canto de cima à
esquerda **e guarda essa posição**, que volta na abertura seguinte. É a mesma
armadilha de medida que a folha das duas mesas já tinha (`medidaDoPalco`), e
aqui ela custaria o lugar que ele escolheu. Conferido: arrastou de (280,10)
para (40,256), guardou, e o duplo clique devolveu ao canto limpando o
registro.

#### A ficha do vídeo ganhou a linha que é o campo

Ele viu o controle da tipografia, gostou, e pediu o mesmo na ficha do vídeo.

**Não dá para refazer os construtores, e não é para refazer.** Quem desenha
naquela coluna são cinco arquivos, com cronômetro de keyframe, linha de áudio
reativo, máscara e gráfico pendurados na estrutura exata que eles emitem.
Mexer nos cinco para mudar DESENHO seria refazer arquitetura para repaginar —
o erro que o `RGB_LAB-2.0.md` abre dizendo que não se comete.

Então: os cinco continuam emitindo o que sempre emitiram, o CSS junta o par
numa caixa só, e o JS entra apenas para dizer QUANTO encher.

```
panels.js   fillDe(range)      calcula --fill e --fill-x
            P.pintarFills(box) pinta todos de uma vez
            um MutationObserver no #insp cobre os cinco arquivos
            sem que nenhum deles saiba que este desenho existe
```

**São DUAS estruturas, não uma** — e descobri isso ao medir. A ficha do clipe
faz `.prow` + `.prow-slider` (`panels.js`); a **pilha de efeitos**, que é
justamente o que o Bruno fotografou, faz `.mprop-h` + `.mrange`
(`motion.js`). O primeiro CSS pegou só a primeira e a captura dele continuava
igual. `fillDe` trata as duas: o desenho é o mesmo, a caixa a encher é que
muda de nome.

**Reservar pixels foi a abordagem errada.** A primeira versão deixava uma
faixa de 76px à direita fora do cursor invisível, para o número e o
cronômetro continuarem clicáveis. Funciona quando os dois estão à direita —
e na pilha de efeitos **o cronômetro fica à ESQUERDA**, antes do rótulo.
Medido: cronômetro em 1026→1046 debaixo de um cursor que ia de 1014 a 1158.
O losango de keyframe, que é o controle mais importante da ficha, tinha
parado de responder ao clique.

Agora o cursor cobre a caixa inteira e quem precisa de clique próprio sobe
ACIMA dele (`z-index`). Empilhar não depende de onde a peça está. Conferido
com `elementFromPoint` nos três alvos: número → `mval`, cronômetro →
`stopw`, resto da barra → `mrange`.

#### Um defeito de dez anos que só apareceu porque o enchimento precisa medir

```js
'motion.x': { …, min: -W,                       ← W é uma FUNÇÃO
'motion.y': { …, min: function(){return -H();}, ← escrito certo
```

Menos-função dá `NaN`. O atributo saía `min="NaN"`, e navegador que recebe
`min` inválido usa **zero**. O cursor de POSIÇÃO X nunca conseguiu ir para a
esquerda do centro; o de POSIÇÃO Y, na linha de baixo, sempre funcionou.

Ninguém tinha visto porque o cursor antigo não precisava de `min` e `max`
para se desenhar — o navegador desenhava a trilha igual de qualquer jeito. O
enchimento precisa, e por isso a linha apareceu vazia e denunciou. Conferido
depois: `min="-1280"` numa tela de 2560, do lado de `min="-720"` numa altura
de 1440.

**A lição, que é a mesma de sempre neste projeto:** controle que não é medido
mente calado. Foi preciso um desenho que DEPENDE do número para o número
errado aparecer.

### 5h.10 O POLAROID saiu da barra de transporte

Pedido curto dele: *"esse polaroid e revelar pode tirar dessa barra de player,
não tem pq estar ali"*. Está certo — aquela barra é onde se ANDA NO TEMPO
(tocar, avançar quadro, laço, volume), e abrir uma câmera não é andar no
tempo.

O comentário em `js/app.js` justificava as duas portas dizendo que o polaroid
"é matéria nova saindo de uma máquina, e não um efeito sobre um clipe". Isso
justifica a porta na **grade FONTE**, que é onde se procura matéria nova — e é
a que ficou. Não justificava a segunda.

**O que a remoção quase quebrou.** `initSources()` ligava os ouvintes assim:

```js
$('#polAbrir').addEventListener('click', abrirPolaroid);
```

Alvo que saiu do documento devolve `null`; `null.addEventListener` é
TypeError; e um TypeError no meio de `initSources()` leva junto **tudo que é
ligado depois dele** — o resto das fontes, o transporte, os atalhos de
teclado. Tirar um botão da tela derrubaria o laboratório inteiro, e o console
diria apenas uma linha sobre `polAbrir`.

Entrou `ao(seletor, evento, fn)`, que não reclama de alvo ausente. As portas
duplicadas da **mesa** e do **mosaico** passaram a usá-lo também: são a mesma
classe de botão — máquina com porta em dois lugares — e a próxima a sair pode
ser uma delas.

Conferido: `#polAbrir` fora dos dois HTML (261 ids contra 262), `#srcPolaroid`
ainda abrindo a câmera, mesa e mosaico de pé na barra, e o arranque inteiro
sem erro no console.

### 5h.11 O que NÃO foi feito

- **Só o LAB 03.** Os controles novos (`.tctl`) só são emitidos pelo
  `type.js`. A ficha do vídeo e a do áudio continuam em `.prow` +
  `.prow-slider`, intactas — conferido: zero `.tctl` vazando para elas. Se
  a ideia agradar, é o mesmo conserto em `panels.js` e `motion.js`;
- **o rodapé SAÍDA não foi tocado.** São ~180px presos no pé da coluna, com
  duas frases de ensino sempre visíveis. Encolhê-lo levaria a coluna de
  ferramentas de 1,16 para ~1,00 tela, mas as frases são dele e ele não
  pediu para tirá-las;
- **o número fica à direita, não centrado.** Na referência o valor é
  centrado na barra; aqui ele segue a convenção que o próprio 2.0 já tinha
  (seção 14), e de quebra os 30 números ficam alinhados numa coluna, que é
  o que serve para varrer a ficha com o olho.

---

## 5i. O LABORATÓRIO DE ÁUDIO — o rack foi para a coluna

> ### ESTADO ATUAL
>
> ```
> index.html    #propsAudio — corpo PRÓPRIO da coluna da direita, permanente
> js/shell.js   renderAudioInspector escreve só a cabeça (#auFicha);
>               S.go troca #props ↔ #propsAudio
> js/audio.js   clicar no NOME abre um módulo desligado sem ligá-lo
> css/labs.css  o rack numa coluna · desligado mostra só o cabeçalho
> ```
>
> **O diagnóstico dele, e estava certo:** *"repara só o tamanho que o cadeia
> ocupa, e em questão de hierarquia os efeitos e suas configs são bem mais
> importantes — olhe como eles estão espremidos no inferior da tela"*.
>
> A coluna da direita mostrava os **34 módulos como lista de texto** com
> ON/OFF ao lado, e os controles de verdade viviam numa faixa no PÉ da tela,
> em três colunas de 228px. Hierarquia ao contrário: o que não se ajusta
> ocupava a coluna, o que se ajusta ficava espremido embaixo.
>
> ```
>                          antes            depois
> coluna da direita        34 linhas mortas  o rack, com os controles
> pé da tela               o rack espremido  (nada — o centro é a onda)
> rolagem da coluna        —                 8630px → 1773px  (21,3 → 4,4 telas)
> ```

---

### 5i.1 Por que um corpo próprio, e não o `#props`

O `#props` é reescrito por `innerHTML` a cada troca de vista. Os módulos do
rack são construídos uma vez e guardam estado — trilhos, travas de mutação,
posição na cadeia. Pôr o rack dentro do `#props` significaria destruí-lo toda
vez que o Bruno fosse ao vídeo e voltasse.

`#propsAudio` é um segundo corpo da mesma coluna, permanente, e o `S.go`
mostra um ou outro. Conferido na ida e volta: 34 módulos ainda lá.

### 5i.2 O que saiu, e por quê

A placa CADEIA da ficha listava os 34 módulos com ON/OFF ao lado. O rack logo
abaixo mostra **os mesmos módulos, na mesma ordem, com o interruptor que de
fato liga** — a lista era uma cópia sem poder. Saiu.

O mapa do caminho do sinal continua no bloco **CADEIA da coluna da esquerda**,
onde ele tem três linhas (só o que está ligado, na ordem, e clicar leva ao
módulo). Ali o tamanho é o que aquilo merece.

### 5i.3 Módulo desligado mostra só o cabeçalho

Com o rack na coluna, medi de novo: **8630px de rolagem, e 8040 deles eram os
trinta módulos DESLIGADOS** — 93% da coluna para controles de coisas que não
estão na cadeia. Era a mesma parede da lista de texto, agora com trilhos.

Desligado mostra só o cabeçalho (38px); ligar abre (177px). De 21,3 telas para
4,4.

**E clicar no NOME abre sem ligar.** Às vezes se quer ver o que um módulo tem
antes de pô-lo na cadeia, e ligá-lo para espiar obrigaria a recalcular o áudio
inteiro — que, medido na passada anterior, custa segundos.

### 5i.4 O que este trabalho NÃO consertou

**A lentidão continua igual.** Ela é do motor, não do desenho: toda mudança
chama `A.rerender()`, que recomeça do áudio ORIGINAL e refaz a cadeia inteira
sobre o arquivo inteiro. Medido num áudio de 1 minuto:

```
cadeia vazia    389 ms      DISTORÇÃO      2 201 ms
ATRASO          769 ms      REVERBERAÇÃO   4 445 ms
BITCRUSH      1 068 ms      ESPECTRAL     14 742 ms
FILTRO        1 316 ms      seis juntos    3 432 ms
```

Mais 220ms de espera antes de começar. Mexer no último módulo de uma cadeia de
seis recalcula os seis.

**O conserto proposto, e ainda não feito:** guardar o buffer de ENTRADA de cada
passo. Mexer no módulo 6 recalcularia só o 6 — de 3,4s para ~0,5s. Custo:
memória (um buffer por passo; 60s estéreo a 48k = 23MB cada). Segundo conserto,
independente: calcular a prévia só no trecho que está tocando enquanto se
arrasta, e o arquivo inteiro quando se solta.

Não foi feito porque mexe no caminho central do motor de áudio, e o áudio é a
parte deste projeto que nunca foi OUVIDA por mim — só medida. Erro ali é erro
que eu não detecto.

---

### 5i.5 Três defeitos que ele achou olhando, e um deles era `:has()` dentro de `:has()`

**1 · A barra de enchimento não aparecia no áudio.** O maquinário que escreve
`--fill` (ouvinte de arraste + observador de redesenho) estava dentro do
`P.initFold()` — e `initFold` é chamado pela ficha do vídeo e pela da
tipografia, **nunca pela do áudio**, que não tem placa para recolher. Quem
entrasse direto no LAB 02 não tinha nem ouvinte nem observador, e nenhuma
barra se enchia. Ligar o enchimento a quem dobra placa era acoplar duas coisas
sem relação nenhuma. Virou `P.initFills()`, com marca própria, chamado pelas
três fichas.

**2 · O menu ESPAÇO do ATMOSFERA não abria.** A regra que junta o par
`.prow` + `.prow-slider` numa caixa só juntava TUDO e depois abria exceção
para o que não é faixa (menu, cor, texto). A exceção tinha especificidade
MENOR do que a regra que deveria vencer: o menu recebia `height:0` e
`pointer-events:none`. Aparecia na tela e não abria — que é o pior tipo de
defeito, porque some da vista e fica só no comportamento.

A condição passou para a PRÓPRIA junção: só junta o par cujo `.prow-slider`
tem cursor dentro. Sem exceção, não há exceção que perca.

**3 · E a primeira correção do 2 foi escrita com selector inválido.**
Escrevi `.prow:has(+ .prow-slider:has(> input[type=range]))` — **`:has()`
dentro de `:has()` é proibido em CSS**. O navegador descarta a regra inteira
em silêncio, e as vinte e três regras da junção morreram de uma vez: todas as
linhas de todas as três fichas voltaram ao desenho de duas linhas. O defeito
apareceu na tela na conferência seguinte, e a chamada a `matches()` no console
disse o motivo em uma linha: *"is not a valid selector"*.

A forma certa é um `:has()` só, com seletor relativo composto:

```css
.prow:has(+ .prow-slider > input[type=range])
```

**A lição:** `:has()` que não casa não avisa. Um seletor inválido não aparece
no console, não quebra nada e não deixa rastro — a regra simplesmente não
existe. Vale conferir com `el.matches(seletor)` quando um `:has()` complexo
"não pega": ali o erro sai escrito.

**4 · A busca e os botões do rack ganharam peso.** Estavam desenhados como
rodapé — texto miúdo e cinza, sem caixa — no alto de uma coluna com 34
módulos, que é onde a busca é a ferramenta mais usada. A busca virou campo de
38px com a lupa na cor do canal; os três graus de mutação viraram pastilhas, e
o EXTREMO já chega colorido porque é o que mais muda o som; as famílias
viraram pílulas, e a escolhida fica cheia na cor do canal.

---

### 5i.6 A coluna do áudio perdeu o cabeçalho, e o MANDAR PRA TIMELINE nunca funcionou sozinho

**O pedido:** tirar o bloco *"SEM ÁUDIO / carregue um arquivo, grave o
microfone…"* do topo da coluna e subir tudo sobre os módulos.

Ele estava certo por um motivo que vale além deste caso: **os dois blocos que
ficavam ali eram repetição.**

- o cabeçalho com nome, duração, canais e taxa repetia a barra do centro, que
  já escreve `TOM DE TESTE · 2 CANAIS · 48000 HZ · 4.00S`;
- o parágrafo de instrução repetia a grade FONTE da coluna ao lado, que diz a
  mesma coisa com quatro botões grandes: ARQUIVO, MICROFONE, TOM TESTE,
  DO VÍDEO.

Dois blocos de repetição empurrando para baixo a única coisa daquela coluna
que se ajusta. O que sobrou do cabeçalho cabe onde já havia lugar: o nome do
arquivo virou o `#inspId`, que é uma palavra no cabeçalho da coluna.

As duas saídas (MANDAR PRA TIMELINE, EXPORTAR WAV) foram para o **pé da
coluna da esquerda**, como a SAÍDA do laboratório de tipografia.

**E aí apareceu um defeito que nunca ninguém tinha visto.** `A.sendToTimeline`
chamava `VE.addMedia`, que lê `VE.project.tracks` — sem checar se existe
projeto. Quem entra pelo índice direto no LAB 02 e monta um som **não tem
composição de vídeo nenhuma**, que é o caso normal e não a exceção: o botão
estourava num `TypeError` dentro de uma promessa, que não aparece na tela.
O botão simplesmente não fazia nada.

Passou despercebido porque o botão vivia dentro da ficha, que só aparece com
áudio carregado, e porque erro em promessa é silencioso. Pô-lo num lugar fixo
e apertá-lo na conferência bastou para ele cair.

Uma linha, e o laboratório de tipografia já fazia exatamente isto na mesma
situação (`if (!VE.project) VE.app.ensureProject(...)`). Conferido: sem
projeto aberto, apertar MANDAR PRA TIMELINE cria a composição e põe o clipe.

---

## 5j. A MONTAGEM DE ÁUDIO

> ### ESTADO ATUAL
>
> ```
> js/audiotl.js   modelo + janela. VE.audiotl
> css/labs.css    .atl-*   ·  css/lab2.css: o mesmo no desenho do 2.0
> porta           FERRAMENTAS do LAB 02, ao lado do sonógrafo e da cifra
> ```
>
> Uma linha do tempo **só de som** dentro do laboratório de áudio: várias
> pistas, vários trechos, arrastar, cortar, sobrepor, mudo por pista. Nasce
> com duas pistas — VOZ e TRILHA.
>
> **A saída que ele pediu:** botão direito num trecho → *"Mandar pra ÁUDIO 1
> — LAB 01"*, uma entrada por pista de áudio existente, com a contagem de
> clipes ao lado. Não há tipo de pista "voz" no laboratório de vídeo (há
> VÍDEO, ÁUDIO e EFEITOS), então o destino é uma pista de ÁUDIO escolhida
> pelo nome — quem decide qual delas é a da voz é ele.

---

### 5j.1 Por que não reaproveitar a linha do tempo do LAB 01

Aquela é uma mesa de VÍDEO. Um clipe dela é fonte com recorte, transição,
efeitos, máscara, keyframes e modo de mistura, e boa parte daquele código
existe para desenhar miniatura de quadro. Nada disso vale para um pedaço de
som.

Aqui um clipe tem **quatro campos**: buffer, começo, duração e de que ponto
do buffer ele parte. Com quatro campos o desenho pode ser simples, e o
arquivo inteiro — modelo e janela — cabe em um lugar só.

**O que esta janela NÃO faz, de propósito:** efeito por trecho. O tratamento
do som é o rack, que já existe e é de onde o material sai. Aqui se ARRUMA no
tempo; lá se TRATA.

### 5j.2 Cortar sem copiar amostra

`M.cortar` não fatia o buffer: nasce um segundo trecho apontando para o
**mesmo** buffer, com a `entrada` deslocada. Conferido: depois de cortar,
`todos[0].buf === todos[1].buf` é verdadeiro, e as entradas ficam 0 e 2 num
corte no meio de quatro segundos. Cortar dez vezes um arquivo de trinta
minutos continua custando zero de memória.

O mesmo campo `entrada` é o que faz aparar pela borda direita ser barato, e é
o que o recorte para o LAB 01 lê para mandar só o pedaço escolhido — mandar o
buffer inteiro seria mandar o que ele já decidiu não usar.

### 5j.3 Quem mistura é o navegador

`M.mixar()` monta um `OfflineAudioContext`, agenda cada trecho como uma fonte
com o seu ganho no instante certo, e pede o render. Somar amostra a amostra em
JavaScript seria reimplementar — mal — o misturador nativo que já existe.

A taxa e o número de canais saem dos próprios trechos, não de um valor fixo:
mistura a 44,1k quando o material é 44,1k, a 48k quando é 48k.

**Tocar é tocar a MISTURA**, não os trechos soltos. É mais simples de acertar
e é exatamente o material que sai na exportação e no envio: o que se ouve é o
que sai.

### 5j.4 O que foi medido

```
abrir a janela        2 pistas (VOZ, TRILHA)
pôr o áudio da mesa   2 trechos · 8,00 s
cortar no meio        3 trechos · 8,00 s  (duração total não muda)
corte sem copiar      buf compartilhado, entradas 0 e 2
mover                 start 0 → 3,5
misturar              8,00 s · 2 canais · 44100 Hz
botão direito         Cortar · Duplicar · 2 destinos · Apagar
mandar (sem projeto)  criou a composição e pôs o clipe
mandar (com projeto)  ÁUDIO 2 foi de 0 para 1 clipe, start 4, dur 4
```

### 5j.5 O que ficou de fora

- **ganho por trecho** existe no modelo e ainda não tem controle na janela;
- **encaixe** (snap) ao começo do trecho vizinho e à grade da régua;
- **desfazer** dentro da janela — hoje o Ctrl+Z do laboratório não alcança a
  montagem;
- **onda desenhada dentro do trecho**: o bloco é um retângulo com o nome. Com
  a onda dentro dá para cortar no lugar certo olhando, que é como se corta
  som de verdade.

---

## 5k. O ESPECTROGRAMA DO ARQUIVO, E O VAZIO QUE EU MESMO ABRI

> ### ESTADO ATUAL
>
> ```
> js/audio.js    fazerEspectro() · desenharEspectro() · A.limparEspectro()
> index.html     #auSpec, dentro do mesmo .wave-wrap da onda
> css/labs.css   onda 2/3 · espectrograma 1/3, mesma largura
> ```

---

### 5k.1 O vazio era meu

Ele mandou a captura do LAB 02 com um retângulo preto ocupando a tela e
perguntou o que pôr ali. Medido antes de responder:

```
centro do LAB 02   874px
  barra              31
  onda              187
  transporte         37
  analisador        619   ← 71% da tela
```

Quando o rack saiu do centro (5i), dei a sobra ao **analisador** — e ele foi
de 52px para 619. Só que espectro em tempo real não melhora com 619px de
altura: fica um retângulo quase todo vazio. **A sobra tinha ido para a peça
errada.**

A sobra passou para a **onda**, que é o documento deste laboratório: 187 →
560px. O analisador voltou a ser faixa (96px), que é o tamanho dele.

**E havia um segundo passo, que só apareceu ao conferir.** `drawWave` tinha
`var H = 186` escrito à mão e escrevia a altura no `style` do canvas — então
a onda continuava desenhada numa tira no alto e o resto ficava branco. O
vazio só tinha trocado de dono. Agora a altura vem do espaço que há.

### 5k.2 Por que um espectrograma NOVO, se já havia um

O analisador da barra de baixo tem um modo `spectrogram`. Ele **rola**: anda
um pixel por quadro e desenha a coluna nova na direita. Isso quer dizer que

- só existe enquanto toca;
- não está preso ao tempo do arquivo — a coluna x não é o instante x;
- some quando se para.

Dá para **acompanhar**, não para **ler**. O que faltava era o mapa tempo ×
frequência do arquivo INTEIRO, dividindo a régua horizontal com a onda: é
assim que se acha o sibilante, o zumbido de rede, onde a voz entra, onde o
ruído de fundo sobe. Olha-se o mapa para achar e corta-se na onda, no mesmo x.

A seleção e o cursor são irmãos absolutos da caixa, então já cobrem os dois
de graça — não foi preciso escrever nada para eles.

**Nada de FFT nova:** `VE.adsp.fft` e `VE.adsp.hann` já existiam, com
tabelas memorizadas por tamanho, e são as mesmas que os módulos espectrais
usam.

### 5k.3 A escala que saturava

Primeira versão: magnitude crua da FFT, faixa `(dB + 90) / 90`. Medido, uma
senoide dava magnitude 175 — **44,9 dB** — e a escala saturava em 1 para
quase tudo. O mapa saiu um bloco verde uniforme: **13.713 de 13.715 pixels
no máximo**. Escala que satura não é escala, é uma cor só.

A magnitude sobe com o tamanho da FFT e precisa ser dividida por `N/2`. Assim
um seno de fundo de escala dá 1,0 → 0 dB, e a faixa `(dB + 80) / 80` cobre
oitenta decibéis de verdade. Depois da correção: 88% dos pixels com alguma
tinta, variância 408 — um mapa com estrutura, e não um retângulo.

**Duas escolhas de leitura**, as duas deliberadas:

- **eixo de frequência comprimido** (`f^2.2`): voz e instrumento vivem
  embaixo, e uma escala linear joga tudo isso nos primeiros pixels e gasta
  metade do desenho no agudo, onde quase nada acontece;
- **densidade, nunca arco-íris**: a cor vai do `--paper` ao `--ch-audio`.
  Arco-íris inventa fronteira onde a intensidade é contínua.

### 5k.4 O custo, e por que ele não trava a tela

```
900 colunas × FFT de 1024      301 ms de cálculo
fatias de 12ms, cedendo a vez  a interface nunca prende
recalcula quando?              só quando o BUFFER é outro
```

Arrastar o cursor, mexer na seleção ou redimensionar a janela **não** refazem
mil FFTs — o desenho na tela é um `drawImage` do que já está pronto.

E os 301ms **não crescem com a duração do áudio**: são sempre 900 colunas,
seja o arquivo de quatro segundos ou de uma hora. O que muda é quanto tempo
cada coluna representa.

### 5k.5 A paleta assada, e o botão CLARO/NOTURNO

O mapa é calculado uma vez e guardado como imagem — com as cores de então
**assadas dentro**. Trocar de tema não o repintaria sozinho: ficaria tinta
sobre papel dentro de um laboratório escuro. `S.setMode` joga o mapa fora, e
ele se refaz com as cores de agora. Conferido: fundo 255 no claro, 19 no
noturno, com o aviso `CALCULANDO O ESPECTROGRAMA…` no intervalo.

### 5k.6 O que ficou de fora

- **régua de tempo com números** sobre a onda. Hoje há dez divisões e nenhum
  número: não dá para saber onde está 1:20. É a próxima que eu faria;
- **medidores permanentes** de pico e RMS, que hoje só aparecem se você
  escolher aquele modo do analisador;
- **clicar no espectrograma para posicionar o cursor** — hoje ele só lê. A
  onda acima já faz isso, e no mesmo x, então a falta é pequena.

---

## 5l. O TUBO, O CODEC, O CUPOM E A VISÃO DE MÁQUINA (vigésima quinta passada)

O Bruno mandou seis capturas de uma série de estética audiovisual — Datamosh,
CRT, Receipt Paper, Depth Map, Blob Tracking, e um CRT verde de Photoshop —
e duas referências abertas: a ferramenta de CRT da **tooooools.app**
(`effects/crt`) e o **Supermosh** (`supermosh.github.io`, GPL). O pedido:
*"insira esses efeitos no site, pesquise, estude o site e as predefinições"*.

Cinco efeitos, três arquivos de catálogo e dois analisadores:

```
js/fx14.js          CRT / TUBÃO (reconstruído)  ·  DATAMOSH (reconstruído)
js/fx15.js          PAPEL TÉRMICO / CUPOM
js/fx16.js          MAPA DE PROFUNDIDADE (I.A.)  ·  RASTREIO DE MANCHAS (blob)
js/profundidade.js  o analisador da profundidade — Depth Anything V2 no navegador
js/manchas.js       o analisador das manchas — componentes conexos e rastreio
```

Os dois primeiros já existiam (`crt` e `datamosh` em fx2.js, filtros de
aparência de 2025) e foram refeitos PELO MECANISMO com os mesmos ids, como o
VHS na 4y — projeto salvo continua achando os dois. Os blocos antigos saíram
de fx2.js; o estilo `mosh` foi reajustado para o vocabulário novo.

### 5l.1 O que foi lido das referências, e o que não foi

**tooooools/crt.** O site é um app Next.js; o shader vive em texto legível
dentro do bundle, e os padrões de fábrica no estado inicial da página. Foi
lido o MECANISMO e os NÚMEROS — e escrito daqui, no formato do laboratório
(GLSL ES 3.0, três passadas, PRELUDE). Os padrões deles:

```
patternType Monitor · distortion 0,02 · dotScale 0,93 · dotPitch 1,59 px
falloff 0,12 · brightnessBoost 2,5 (escondido) · glowRadius 0,2 · glowIntensity 0,1
bloom Screen · bloomThreshold 0,36 · bloomIntensity 0,45 · bloomRadius 1
convergência R (+0,01, +0,01) · B (−0,01, −0,01) · força 0,1  → ±0,6 px
saída: pow(cor, 1/2,2)
```

Três coisas do desenho deles que só a leitura do código mostrou, e que
importaram: (1) o **bloom é lido da imagem de ENTRADA**, não do tubo
mascarado — com o limiar aplicado ao tubo, só os pontos VERDES passam (a
luma pesa 0,72 no verde e 0,21 no vermelho) e o branco sai verde, medido
85/137/85 onde a referência dá 158/158/158; (2) as **amostras do halo entram
sem o ganho** de 2,5, e a normalização depende da SOMA dos pesos (32
amostras) — com oito amostras de peso 1 o meio-tom saía 26% mais claro; (3)
os buffers de trabalho deles ficam em 800×600 enquanto a tela é 600×337, e o
resultado é reamostrado — os pontos deles saem mais macios que a conta prevê.
Isso é artefato da implementação, não do desenho, e não foi copiado.

**Supermosh.** É a coisa real, e é pequeno (1.019 linhas de TypeScript):
recodifica o vídeo com ffmpeg.wasm em H.264 com **um só quadro-chave**
(`-g 99999999 -bf 0`), corta os chunks codificados em trechos `{from, to,
repeat}` e manda para um `VideoDecoder` na ordem que o editor montou. O
decodificador aplica o movimento de um trecho sobre a imagem que ficou do
anterior. O laboratório não tem codec — tem shader; então o shader faz o que
o decodificador faz.

### 5l.2 CRT — a régua é a coluna de fósforo

Vinte e dois controles, três passadas. As chaves antigas `curve`, `scan`,
`mask`, `flick`, `vig`, `bright` continuam; `slf` (densidade das linhas em
pixel de tela) foi substituída por `linhas` (quantas linhas na altura).

A régua **não é o pixel**: é a largura em TRÍADES. Os 1,59 px da referência
numa tela de 600 são 377 colunas, e 377 colunas dão a mesma tela em 320, 960
ou 1920. Lição da 4y, segunda volta.

**A compensação da máscara segue a presença dela.** Os pontos cobrem uma
fração da tela e cada cor só um terço deles; a referência corrige com ganho
2,5 e gama 2,2, e os dois só fazem sentido COM máscara — com o ganho literal,
SÓ LINHAS saía a 216 de média onde a fonte tinha 133. Agora `crtGanho() =
mix(1, 2.5, presença)·brilho` e o mesmo para a gama.

**Medido contra a página deles, na mesma imagem** (a de teste, 640×360,
enviada ao site pelo campo de arquivo; o canvas deles lido de volta; o nosso
em 600×337 com 377 colunas; os controles deles movidos pelo `onChange` do
React, porque o evento sintético no `<input>` não chega ao estado):

```
                     referência              rgb_lab
bloom             0      0,45     2        0      0,45     2
branco           78,4   157,8   255       78,2   157,9   255
cinza-meio       59,5    93,4   209,8     59,7    93,7   210,1
imagem toda      55,8    89,0   152,3     55,1    88,6   152,1
vermelho         47,5    47,7    48,2     47,5    47,6    48,2
```

Cinco regiões, três níveis, diferença máxima 1%. Neutro é neutro: com
máscara, bloom, convergência, halo, curvatura, vinheta e cintilação em zero,
diferença **0,00** para a fonte.

```
CONVERGÊNCIA · borda do retângulo vermelho, canal R, passo de 1,7 px
  0 → x=80 · 2 → 77 · 4 → 73        (2 pontos = 3,4 px, como pedido)
LINHAS DE VARREDURA · 90 pedidas → 89 vales medidos
MÁSCARAS · monitor×TV 81,6 · monitor×LCD 82,3 · monitor×só-linhas 143
FÓSFORO · verde G=190 (R 134, B 149) · âmbar R>G>B · azul B=187
CURVATURA · pixels pretos no canto de 20×20: 0 → 8 · 1 → 293 · 2 → 400
```

**Custo em 1920×1080** (mediana de sete, com `readPixels`): 24–27 ms, com ou
sem halo — o custo é das três passadas e dos dois borrões de 13 toques, não
da máscara. A régua sem efeito é 3,6 ms; o VHS, 33,5.

Cinco estilos: MONITOR CRT (a referência), TV DE TUBO, TERMINAL VERDE, TUBO
AZUL, LCD DE PERTO.

### 5l.3 DATAMOSH — o decodificador em quatro passadas

O que um quadro-P carrega, e o que o shader reproduz: **vetores de
movimento** por macrobloco, **resíduo** quantizado, **blocos intra**, e o
**quadro-chave** como único reset. A saída de cada quadro é a saída ANTERIOR
(`uPrev`, o quadro composto) deslocada pelos vetores, mais o resíduo
calculado contra a previsão do CODEC (a fonte de ontem).

**A fonte de ontem é uma coisa nova no motor.** `uPrev` é o quadro composto
(realimentação); o codec precisa da imagem como ela ENTROU, um quadro atrás,
para medir movimento e resíduo. O anel da fonte já existia (`histFonte`, das
TIRAS), mas quem o pedia perdia o `uPrev` composto. Agora um efeito declara
`fontePrev: true` e recebe `uFontePrev` (unidade 10, meia resolução) SEM
perder `uPrev` — `bindHistory` e `histTexFonteOntem` em gl.js, a declaração
no PRELUDE. "Ontem" é a vaga anterior à última escrita, porque
`pushHistFonte` roda antes da passada e `histTexF(1)` é hoje.

**Os vetores são medidos por busca de bloco, em paralelo.** Cada PIXEL do
macrobloco calcula UM candidato (16×16 por bloco), SAD de 16 amostras contra
a fonte de ontem deslocada, mais um termo de taxa (0,006·|vetor|, como um
codificador — 0,02 deixava o fundo em degradê parado enquanto as bordas
andavam). Duas passadas de redução (16 leituras por linha, 16 por coluna)
acham o mínimo do bloco; a última passada decodifica. Custo constante por
pixel em qualquer resolução: ~76 leituras.

**A regra que faz existir o mosh** — e sem ela não há mosh nenhum: com o
resíduo aplicado por inteiro, saída = arrastado + (novo − arrastado) = novo,
exato, em qualquer corte. Medido. O datamosh clássico funciona porque o dado
do quadro-chave é JOGADO FORA. Então: bloco cujo movimento não explica o que
chegou (SAD acima da tolerância) tem o resíduo descartado — a imagem velha
continua — ou, na medida de INTRA, o bloco novo entra. E o vetor desse bloco
é zero: o codec não manda movimento para bloco que codificou inteiro (sem
isso, o corte embaralhava a imagem velha com vetores de sorteio: 14 de
diferença contra a saída anterior; com, 3).

**Medido, quadro a quadro, com A → A deslocado 12 px → D (o negativo de A,
um corte) → D deslocado 12, 24, 36:**

```
quadro-chave (local 0) ............ saída = A, diferença 0,00
movimento de 12 px, reconstrução .. 0,27 no miolo (A×B sem compensar: 7,18)
só o arrasto, sem resíduo ......... 1,06   ← os vetores acham os 12 px
   com busca curta (4 px) ......... 5,92   ← e o alcance importa
o corte ........................... 138 contra D · 3,2 contra a saída anterior
   com intra = 1 .................. 0,08 contra D (o bloco novo entra)
depois do corte, D anda 12 ........ a imagem velha vai junto: mais perto de
                                    A@24 (6,6) que de A@12 (8,2)
```

A borda do retângulo vermelho de A, lida linha a linha depois do corte, anda
+8, +3, +12 e não +12, +12, +12 — e isto NÃO é erro: os vetores seguem as
bordas do vídeo NOVO, e o bloco onde a borda velha caiu era, para o vídeo
novo, chapado (vetor zero). A imagem velha só anda onde o vídeo novo tem
textura. É exatamente o que um datamosh faz, e é por isso que ele parece o
que parece.

Chaves antigas mantidas: `amt` (blocos travados), `block`, `len` (agora
GANHO do movimento), `ang`, `edge` (deriva), `decay` (persistência = segura o
resíduo), `rate`, `scatter`, `chrom`. `follow` saiu (era o gradiente que
fingia movimento). Novas: `busca`, `quant`, `tol`, `intra`, `gop`.

Custo em 1080p: 25,6 ms. Dois estilos: DATAMOSH CLÁSSICO (persistência 0,
intra 0 — o codec exato) e DATAMOSH DERRETENDO.

**Limites, para não fingir:** os candidatos são 16 por eixo, então em 1080p
com bloco 16 o passo da busca é de 5 px (42 px de bloco); movimento fino
fica quantizado — e o bloco grosso É a estética. Numa FOTO parada não há
movimento e o efeito só age pela deriva (`edge`/`ang`); está no manual. O
`uPrev` é o quadro composto INTEIRO — outras camadas entram na
realimentação, como no eco.

### 5l.4 PAPEL TÉRMICO — um bit por ponto de 203 dpi

A régua é o papel: 80 mm = 576 pontos, 58 mm = 384. O cupom é desenhado em
pontos e depois posto no quadro pela altura pedida — a mesma imagem em
qualquer resolução. Um bit por ponto: queimou ou não; o tom vem da trama
(difusão por ruído azul, Bayer 8×8, ou limiar seco).

O TEXTO (cabeçalho, data, itens com o preço à direita, total somado, código
de barras sorteado pelo nome da loja, "OBRIGADO") é desenhado num canvas com
um pixel por ponto e sobe pelo gancho do ATLAS — o mesmo do ASCII —, e o
ladrilho de ruído azul (128×128, ruído branco reordenado por passa-alta em
seis voltas, gerado uma vez) vai na mesma textura. O shader lê o ponto exato
com `texelFetch`. Os campos `titulo` e `linhas` são de texto (`t:'txt'`,
`uni:false`): o atlas é refeito quando o texto muda, e o anterior é apagado
da GPU.

Os artefatos, todos de causa física: a resistência morta (coluna branca), a
fraca (cinza), a faixa onde o papel escorregou, o pontilhado solto, e a
QUEIMA que engorda o preto e o escorre no sentido do avanço. Alfa real fora
do papel — a sombra é alfa também.

```
papel de 0,96 da altura em 640×360 ... 244×344 px, centrado (198..442)
tinta por faixa (topo → base)
   fonte branca ..... 5% 4% | 0,2% 0,2% 0,2% | 2% 9% 8% 32% 3%
   fonte cinza 50% .. 5% 5% | 47% 47% 48% | ...        ← a trama segue o tom
   fonte preta ...... 5% 7% | 94% 94% 94% | ...
   (as duas primeiras faixas são o cabeçalho; 32% é o código de barras)
desgaste 1, fonte preta ......... 15 colunas mortas
imprimir 400 pontos/s, t=1 s .... as cinco faixas de baixo em 0% (ainda não saiu)
custo em 1080p .................. 8,2 ms (6,7 sem queima)
```

### 5l.5 MAPA DE PROFUNDIDADE — a I.A. como atlas

`atlasPara` passou a entregar ao efeito a imagem de ENTRADA e o tempo
(`def.atlas(params, fxDef, inTex, time)`): um atlas pode ser uma ANÁLISE.
Os dois efeitos de visão de máquina moram nisso; quem só monta letras ignora
os dois argumentos.

O modelo é o **Depth Anything V2 small** pela Transformers.js (v3, do
jsdelivr), `onnx-community/depth-anything-v2-small`, q4f16 em WebGPU (18 MB)
ou q8 em WASM. Mesmo contrato do MARCAR OBJETO: buscado na primeira vez,
guardado pelo navegador, e o efeito explica na ficha o estado — um gancho
novo, `def.nota(e, clip)`, desenhado por motion.js como `pnote`, com
`notaChave` para o módulo atualizar o texto sem redesenhar a ficha.

**Medido no navegador daqui** (Intel Gen12, WebGPU): carga 5,4 s na primeira
vez (3,3 s com o cache), primeira inferência 4,6–5,6 s (compilação dos
shaders), depois **460 ms em 154 px, 715 em 196, 1.090 em 252**. Numa cena
sintética (céu em degradê, chão, um retângulo escuro na frente) o mapa saiu
certo: o retângulo a 217 (perto), o céu a 22 (longe), o chão subindo em
direção à base — o modelo entendeu a perspectiva de uma cena que nunca viu.
A leitura da entrada inverte as linhas antes de ir ao modelo: o WebGL entrega
de baixo para cima e um modelo que aprendeu que o céu fica em cima se
importa com isso.

Seis modos: mapa (perto claro / escuro), cor turbo, névoa pela distância, e
SÓ O PERTO / SÓ O LONGE — o mapa como matte, com alfa real (medido: 29 mil
pixels opacos no recorte, o retângulo). Sem I.A., o mapa é pelo brilho, e a
ficha diz.

### 5l.6 RASTREIO DE MANCHAS — na CPU, como o estabilizador

Grade de 128×72 lida de volta (37 KB), máscara por fonte (claro, escuro,
movimento contra a grade anterior, ou matiz), componentes conexos de oito
vizinhos com pilha, filtro por área, as N maiores. RASTREIO: cada mancha
herda o número da mais próxima do quadro anterior (raio 0,12) e a caixa é
suavizada. Cada uma guarda as duas vizinhas mais perto — as linhas.

Tudo sobe numa textura de ponto flutuante de 128×20: linha 0 as caixas,
linha 1 número/área/vizinha 1, linha 18 a vizinha 2 e o centro, linhas 2–17
os glifos dos dígitos (0-9 : ,), desenhados uma vez — o shader escreve "07"
e "x,y" sem fonte. O estado é por INSTÂNCIA (`fxDef.effId`): dois rastreios
não se misturam.

```
três manchas brancas + uma vermelha, fonte CLARO, limiar 0,6
   retângulo 80..200 × 60..150 → uv 0,125..0,313 × 0,583..0,833   exato
   círculo r=60 em (450,200)   → 0,609..0,797 × 0,278..0,611       exato
   quadrado 40×30              → 0,469..0,531 × 0,111..0,194       exato
   vizinhas do círculo: o quadrado (0,35) antes do retângulo (0,55)  certo
fonte UMA COR, matiz 0 ......... só a vermelha (0,813..0,938)
o círculo anda 20 px ........... os três números ficam (1, 2, 3); o centro
                                 vai de 0,703 a 0,721 (suavizado, k=0,575)
custo em 1080p ................. 21 ms (a leitura de volta é o que pesa)
```

O desenho (cantos, caixa, cruz, círculo, ponto, rótulos, linhas) foi VISTO
em ASCII — o alfa lido como grade de 128×48 —, e está onde devia.

### 5l.7 O que foi verificado pela interface

Fonte de teste registrada como o polaroid faz, clipe na linha do tempo, os
cinco efeitos acrescentados por `VE.addEffect` e lidos de volta no clipe;
os cinco no catálogo com a família e a cor certas; as fichas na pilha; a
nota da I.A. viva na ficha; o campo `titulo` do cupom escrito pela ficha e
lido no clipe ("LOJA DO BRUNO"); os onze estilos novos no DOM da galeria;
três `renderNow()` com os cinco na pilha sem erro de GL; o `lab2.html`
regenerado carregando os 150 efeitos; o arquivo único com os cinco dentro.
O clipe e a fonte de teste foram removidos no fim.

### 5l.9 SEGUNDA VOLTA: o datamosh pelas referências dele, e o travamento da I.A.

O Bruno mandou três exemplos de mosh (o casaco vermelho com blocos chapados
de outra cena; a multidão em retalhos ciano e rosa; a explosão radial em
raias) e disse que a profundidade *"meio que ficou travando"* num vídeo.
Pesquisa: datamoshing.com e glitchology (as duas técnicas clássicas —
remover o quadro-chave para a transição, duplicar quadros-P para o
"bloom"), o **ffglitch** (edição dos vetores por script: média no tempo,
"sink and rise", que zera o horizontal), o Datamosh 2 (intensidade,
aceleração, mosh maps, marcadores) e o Supermosh (trechos e `repeat`).

**A MEMÓRIA PRÓPRIA do efeito (gl.js).** Repetir um quadro-P exige lembrar
o campo de vetores entre quadros, e o motor não tinha onde. Agora um efeito
declara `memoria: true` e `memPass: k`: a passada k escreve num alvo
próprio da INSTÂNCIA (dois alvos, trocados a cada quadro — ler e escrever
a mesma textura numa passada é proibido), e todas as passadas leem o do
quadro anterior em `uMem`. Por `fxDef.effId`, até oito vivas, a mais
antiga cai. É uma GRAVAÇÃO dentro da pilha de FÓRMULAS — a mesma família
do anel de quadros, só que privada. Serve a qualquer acúmulo futuro.

**O que o datamosh ganhou com ela:**

1. **REPETIR o quadro-P** (`congelar`, com cronômetro): o campo medido
   fica congelado e é aplicado a cada quadro do codec; a **aceleração**
   faz cada repetição puxar mais. Medido: a fonte anda 12 px por quadro e
   PARA; com repetir, a imagem continua (80 → 92 → 103 → 116 → 128) e
   depois fica onde o campo congelado é zero — o interior chapado do
   retângulo tinha vetor zero, e a borda que entrou nele parou. Não é
   erro: é o que uma duplicação de P-frame faz num bloco sem movimento.
2. **O RELÓGIO DO CODEC** (`fps`, padrão 24): o mosh só avança quando
   `floor(t·fps)` vira. A fonte de ontem também só vira nesse instante
   (`fontePrevQuando` em gl.js) — senão a 60 Hz o movimento medido seria
   o de um sexagésimo, aplicado uma vez a cada vinte e quatro avos.
   Medido: 12 desenhos a 60 Hz deram 4 passos, exatamente os 4 do relógio.
   **Um erro no caminho:** o sinal de "quadro novo" era o campo bater com
   o relógio, e no segundo desenho do mesmo quadro o campo já trazia o
   índice de agora — dava passo em 6 de 11 desenhos. O sinal certo é o
   campo ter mudado em relação à MEMÓRIA VELHA (uMem ainda é a de antes).
3. **O CAMPO editado**: só vertical, só horizontal, negado, ou somado a
   deriva, zoom ou espiral; e o **rastro** (média no tempo). O zoom
   PROPORCIONAL ao raio: com módulo constante o centro saía em anéis
   concêntricos (visto no banco de prova); proporcional, sai em raias.
4. **Cor em 4:2:0**: a crominância do resíduo é a do bloco.

**Dois defeitos que só a medida pegou:** (a) o resíduo contra a fonte de
ontem em MEIA resolução era um resíduo de nitidez (novo − borrado) que se
somava a cada quadro com a cena parada — a borda de um retângulo parado
andava 1 px por quadro. O novo passou a ser lido no centro do texel de
meia resolução (o filtro linear devolve a média do 2×2, a mesma que o anel
guardou): cena parada, resíduo zero — 0,77 → 1,12 de diferença em dois
segundos, contra crescimento sem fim. (b) A "deriva de cor" girava o matiz
0,02 por quadro: em 36 repetições a imagem inteira ficou magenta (visto).
Virou QUEIMA — saturação a subir 1,2% e matiz 0,2% por geração.

**Visto no banco de prova**, com o painel aberto: o corte com os
macroblocos do vídeo novo entrando em retalhos (o primeiro exemplo dele),
e a explosão radial com as raias (o terceiro). Presets novos: DATAMOSH
EXPLODINDO e DATAMOSH AFUNDANDO.

**O travamento da profundidade era real, e era meu.** O modelo rodava na
linha principal: o JavaScript da biblioteca (despachar os kernels,
converter tensores) segurava 50–150 ms por análise, e a primeira
inferência (compilação dos shaders) segurava cinco segundos. Agora o
modelo vive num **Worker de módulo** (o texto do worker está dentro de
profundidade.js e vira Blob — entra no arquivo único sem arquivo a mais);
a linha principal só lê a entrada e manda o buffer por transferência.
Medido durante a primeira inferência de 5,2 s: a linha principal sentiu
no máximo 5,4 ms, mediana 0,1. Em regime, 396 ms por análise no worker;
o que sobra é a GPU dividida — com análise contínua, o pior quadro do
WebGL esperou 24 ms; a 1 por segundo, 9 ms. Daí o **RITMO** na ficha
(sempre · 2/s · 1/s · só parado), padrão 2 por segundo.

### 5l.10 A EXPORTAÇÃO da I.A.: pré-análise

O Bruno perguntou como exportar direito, e a resposta honesta era que o
mapa de profundidade NÃO saía direito em nenhum modo: a análise é
assíncrona (worker), o gravador não espera por ela, e o arquivo levava o
mapa da prévia — atrasado e aos pulos. E não dá para esperar dentro do
modo frame a frame: o MediaRecorder carimba pelo relógio de parede, e meio
segundo de análise por quadro viraria um arquivo doze vezes mais longo.

A saída é uma PRÉ-ANÁLISE (exporter.js, `preAnalise`): antes de o gravador
existir, os modos frame a frame e sequência PNG passam por cada quadro do
trecho — seek, render (que dispara a análise com `VE.exportando.pre`),
`P.pendente()` até o worker devolver — e o mapa fica no cache do módulo
por número de quadro. Na gravação, `VE.exportando.quadro` diz ao efeito
qual mapa subir. Medido no lab: trecho de 0,5 s a 4 fps com a
profundidade na pilha → 2 análises, 2 PNGs, `VE.exportando` limpo no fim.
O tempo real não tem como esperar, e a dica da janela diz isso.

### 5l.11 A EXPORTAÇÃO EXATA DE VERDADE: o codificador e o escritor de WebM

O Bruno: *"quando exporto o vídeo nesse efeito, só exporta uns frames, não
o vídeo animado como era"*. Reproduzi aqui com um MP4 real (uma gravação
de tela dele, copiada para dentro do projeto só durante o teste e apagada
no fim): 2 s de composição com o datamosh, FRAME A FRAME em MP4 → um
arquivo de **47 s com 3 quadros distintos nos primeiros 2 s**. O
MediaRecorder carimba cada quadro pelo relógio de parede — o quadro vale
o instante em que CHEGOU. Este painel é lento (temporizadores
estrangulados), então o caso é extremo; na máquina dele é o mesmo
mecanismo em escala menor: efeito pesado, quadro atrasado, arquivo
esticado ou com quadro repetido. Em TEMPO REAL o sintoma é o inverso —
arquivo do tamanho certo com poucos quadros. E a SEQUÊNCIA PNG é só
quadros por definição. Os três dão "uns frames, não o vídeo".

A saída é não usar o gravador: **WebCodecs**. `VideoEncoder` recebe cada
quadro como `VideoFrame` com o carimbo `i/fps` e devolve pedaços VP9 com
esse carimbo; o **js/webm.js** escreve o arquivo à mão (EBML: header,
Info com duração, Tracks, Clusters com SimpleBlocks, Cues para a busca —
tamanhos por extenso, sem "desconhecido"), no espírito do escritor de ZIP.
Sem relógio de parede em lugar nenhum: a máquina lenta demora mais e o
arquivo sai igual. Contrapressão de quatro quadros na fila do
codificador. O formato aparece como **WEBM · VP9 · EXATO (codificador)**
e é escolhido sozinho quando o modo vira FRAME A FRAME; em tempo real cai
no gravador (o codificador não grava som).

**Medido, o mesmo trecho de 2 s a 24 fps com o datamosh:** o arquivo saiu
com **2,000 s, 48 quadros lidos, 48 distintos, 47 mudanças**, posicionável
de ponta a ponta — em 49 s de máquina. O gravador, no mesmo painel: 47 s e
3 distintos.

**E o servidor local não respondia a Range.** Um vídeo carregado por URL
daqui ficava com `seekable` vazio — escrever em `currentTime` não fazia
nada, e a exportação frame a frame repetia o mesmo quadro. Não era o caso
dele (ARQUIVO → blob), mas era um buraco: server.js agora responde 206 com
`Content-Range` e anuncia `Accept-Ranges`. Precisa reiniciar o servidor.

### 5l.12 A PELÍCULA PELO 8MM VINTAGE CAMERA

*"Os efeitos de 8mm, super 8mm e 16mm estão MUITO FORÇADOS, HORRÍVEL"* —
com quatro prints do app 8mm Vintage Camera (e um do Super 16). Ele tinha
razão: cada pacote empilhava OITO efeitos, todos no talo (grão 0,4 grosso
e colorido, poeira 0,5, riscos, cabelo, tremor contínuo 0,5, vazamento
0,7 pulsando, flash de rolo a cada dois segundos, halação 0,75, vinheta
duas vezes). Nenhuma câmera faz isso tudo ao mesmo tempo; o app faz quase
nada, e é por isso que parece filme.

O que os prints mostram, lido controle a controle: janela 4:3 de canto
redondo com uma SOMBRA MACIA que acompanha a borda (não vinheta radial);
cor desbotada (preto levantado, ombro nas luzes, saturação contida) com um
tom por filme — 60s: sombra magenta, luz amarelo-esverdeada; Two-Color:
sombra teal, luz rosada; imagem macia; grão fino e baixo; cintilação
leve; um vazamento discreto à esquerda de vez em quando; jitter raro; e a
CADÊNCIA de 18 quadros por segundo.

**O que mudou (fx5.js, filters.js):**
- `filmgate` ganhou SOMBRA (força e largura, seguindo o canto redondo),
  CINTILAÇÃO (com ritmo) e a FORMA DA JANELA — LARGA (o desenho antigo:
  fração do quadro) ou DA BITOLA (4:3 pela altura, barras pretas dos
  lados, como o app; a imagem é recortada, não espremida);
- `filmgrain` ganhou SUAVIDADE (mistura ruído de valor contínuo — o
  "smoothness" do Super 16) e nasce em 0,14 em vez de 0,28;
- `cadencia` é efeito novo, sobre a MEMÓRIA PRÓPRIA do motor (5l.9): a
  passada 0 guarda o quadro quando o relógio vira e devolve o guardado
  nos outros — 18 fps no 8 mm e no Super 8, 24 no 16 mm. Vale na prévia
  e na exportação;
- os quatro pacotes foram refeitos: cadência → maciez → cor → grão →
  (poeira rara, jitter mínimo, vazamento 0,2) → janela. Sem flash, sem
  riscos, sem halação no 8 mm. O 16 mm mostra a tira com perfurações e a
  base marrom (Super 16); a PROJEÇÃO VELHA continua sendo a cópia
  judiada, só sem o flash a cada dois segundos;
- a galeria de filtros ganhou a família 8 MM: 60s, TWO-COLOR, 70s, 1920,
  SIENA, SAKURA, INDIGO, XPRO, NOIR — `filmstock` puro, para pôr por cima
  de qualquer pacote.

**Visto no banco de prova** (painel aberto, cena de praia sintética com
céu, mar, areia e duas figuras): o 8 mm sai numa janela 4:3 de 640×483
num quadro de 960 (aspecto 1,33 medido), sombra na borda, cor
desbotada quente, grão fino, três ou quatro pontos de poeira; o 16 mm
sai na tira marrom com as perfurações à esquerda, neutro e limpo; os
filtros 60s (céu amarelo-verde, sombra quente) e TWO-COLOR (mar teal,
luz rosada, quase sem saturação) batem com os prints.

**Segunda afinação, no mesmo dia** (ele: *"ainda está muito forçado"*).
Achei o culpado principal medindo unidades: o raio do efeito `blur` é
FRAÇÃO DO QUADRO (`u_rad·0,02`), e os pacotes pediam 1,1 — **2,2% da
largura, 42 px em 1080p**, uma imagem inteira borrada. Passou para 0,09
(0,18%, uns 3 px em 1920 — a resolução de um 8 mm de verdade). O
vazamento era permanente; ganhou VEM E VAI (`raro`: chance por trecho de
3 s, com subida e descida macias). A cor padrão do 8 mm ficou mais
neutra (o tom 60s fica como filtro), grão 0,10, sombra 0,45. Visto com
texto de 14 e 9 px na cena: o de 14 legível, o de 9 macio — é o que se
espera. **Lição:** controle de efeito com unidade em fração do quadro
não se copia "a olho" de um preset para outro — 1,1 no `blur` e 1,1 no
`filmgrain` são grandezas de mundos diferentes.

**Armadilha de ferramenta, para não repetir:** dois scripts de edição
falharam por BARRA INVERTIDA — `\n` num template literal virou quebra de
linha de verdade dentro do `join('...')` do shader, e o MSYS do Git Bash
colapsa `\\` em argumentos de `node -e`. Script de edição que carrega
texto de shader vai para ARQUIVO, e a barra se monta com
`String.fromCharCode(92)`.

### 5l.8 O que NÃO foi feito, e por quê

- **Nada foi VISTO por mim em movimento** — o painel estava escondido. O
  CRT foi medido contra a referência; o datamosh, o cupom e as manchas
  foram lidos em número e em ASCII; a profundidade, em número. O
  julgamento do conjunto é do Bruno com o painel aberto.
- ~~O datamosh não guarda o campo de vetores entre quadros~~ — guarda,
  desde a segunda volta (5l.9): memória própria do efeito.
- **A repetição do quadro-P não repete o RESÍDUO**, só o movimento. Numa
  duplicação real o mesmo resíduo entra de novo a cada cópia e a cor
  "queima" por isso; aqui a queima é a saturação por geração. Repetir o
  resíduo pediria uma segunda memória (RGB) por instância.
- **O cupom não tem o texto em japonês da referência**, de propósito: o
  laboratório escreve em português e o texto é do usuário.
- **A profundidade em vídeo atrasa** (meio segundo a um, conforme o
  tamanho); é o custo do modelo nesta máquina. Não há fila nem
  interpolação entre mapas. E a GPU é uma só: o ritmo da análise é o
  controle de quanto o vídeo espera por ela.
- **A textura da tooooools sai mais macia** pelo buffer de 800×600 deles
  reamostrado; o nosso ponto é o do desenho, sem essa suavização. Se ele
  quiser o mesmo aveludado, é subir `suave` ou o halo.

## 5m. A FILMADORA — a traseira de uma câmera de filme (vigésima sexta passada)

O pedido veio com nove capturas de tela — o NOMO Cam (a Instax branca
pontilhada, a 135 de couro preto com a gaveta de câmeras em baixo, a galeria
com carimbo laranja da data), o 8mm Vintage Camera (o visor 4:3 no couro
preto, os cinco botões, o vermelho de cromo, a roda com o nome do filme) e o
Super 16 — e uma frase: *"vamos fazer isso de câmera 8mm 16mm 32mm uma tool
separada na parte de tool onde está o polaroid, sonógrafo etc. — ao clicar
no tool, abre uma janela, uma traseira flutuante de uma câmera vintage.
Texturas reais."*

### 5m.1 O que a máquina é

A regra é a do polaroid (5f): **não há janela, há uma máquina**, e cada peça
faz o que a peça faria. A BITOLA é a máquina inteira — couro, visor,
película, cadência, contador — e são quatro: 8 MM (couro preto, 4:3, 18 q/s),
SUPER 8 (couro marrom, 4:3, 18), 16 MM (pintura rugosa, 5:3, 24, glifos
laranja como o Super 16) e 35 MM (martelada cinza das câmeras de cinema,
1,85, 24). "32 mm" não existe: é 35. O FILME é o seletor: PURO ou os nove
olhares da família 8 MM do catálogo. O vermelho GRAVA.

```
visor        espelha o #gl a cada quadro (preserveDrawingBuffer já era true);
             recortado à proporção da bitola — no 4:3 as barras da janela somem
vermelho     VE.exporter.start() sem a janela: modo exato (ou tempo real com
             SOM), resolução cheia, formato/fps da janela EXPORTAR, trecho I–O
contador     pés de filme: t × fps / quadros-por-pé (80, 72, 40, 16)
porta        ROLOS da sessão: blob guardado, url próprio (o do exportador é
             revogado na exportação seguinte), miniatura do visor a 25%
seletor      arrasto angular em volta do centro, roda, toque, ← →; a roda
             gira um dente por filme e continua no mesmo sentido
BITOLA       gaveta que sobe do chão do palco (o desenho do NOMO), com as
             quatro máquinas em miniatura na própria pele
i / ⚙        a telinha do polaroid (mesmo desenho), com PLAQUETA e AJUSTES
```

### 5m.2 A película entra pela cadeia, não pela linha do tempo

`VE.filmadora.ops(t)` devolve UM ajuste com a cadeia do pacote da bitola
(js/fx5.js) já resolvida: `params` completos por `VE.defaults`, `effId`
fixo (`fil-cadencia` etc., para a memória da cadência), máscara nova. Entra
em `A.renderNow` logo depois da prévia da galeria e ANTES do fundo de
achatamento — na prévia e na exportação, que é o que faz o vermelho gravar
com a película. Fechou a máquina, `ativa` cai e a cadeia some. Nada vai
para a linha do tempo sem USAR.

Os sete ajustes da telinha são MULTIPLICADORES sobre a calibração da bitola
(1 = como veio), não valores soltos — é o que mantém a régua do 8mm Vintage
Camera (metade dos efeitos, um décimo dos valores) como referência de cada
controle. O olhar do seletor substitui os parâmetros do `filmstock` inteiro,
com grão/nitidez zerados (são da bitola) e a vinheta do pacote; COR DO FILME
é o `amount` desse efeito (0,7 de fábrica).

### 5m.3 As texturas são relevo calculado

"Texturas reais" com referências que são capturas de tela de aplicativos:
nada se copia. Cada pele é um MAPA DE ALTURA periódico (o ladrilho emenda)
iluminado por uma luz de cima e da esquerda com brilho de Blinn, gerado num
canvas de 320 px na abertura e entregue ao CSS como `--fil-pele`:

- **couro**: pastilhas de Voronoi numa grade tremida (32 por lado), vinco
  macio entre elas, leve domo, duas oitavas de ruído. A primeira versão tinha
  18 pastilhas e o triplo do brilho — e parecia PLÁSTICO BOLHA. O couro de
  câmera é grão fino e fosco;
- **rugosa**: ruído em cristas (1 − |2n − 1|) em três oitavas;
- **martelada**: covas rasas que se sobrepõem, a mais funda manda; base
  clara (152) para a tinta preta ler;
- **disco torneado**: ruído em função do ÂNGULO (o risco circular), um arco
  de luz e a borda que escurece — o alumínio do seletor.

A pele clara precisou de PLAQUETAS: tinta preta com halo branco ainda sumia
na martelada, e a solução foi a das câmeras de cinema mesmo — o nome numa
plaquinha lisa (`--fil-placa`, transparente nas peles escuras).

### 5m.4 Como isto foi visto, com o painel a 280 px

O painel do navegador estava aberto mas com **280×163 px** (`outerWidth`):
a emulação de 1400×820 fazia o layout certo e o screenshot voltava com a
página inteira num canto de 160 px. O que destravou: **o Chrome instalado,
sem cabeça** — `chrome.exe --headless=new --screenshot=x.png
--window-size=1400,820 --virtual-time-budget=6000 http://localhost:5173/__banco.html?auto=1`
— renderiza a página em tamanho cheio e eu LEIO o PNG. O banco de prova
(`__banco.html`, apagado no fim) recebia por querystring a bitola, o filme, a
tela, a gaveta e um `gravar=1` que simulava a exportação. Foi assim que
apareceram o couro-bolha, o TWO-COLOR cortado no rótulo, a tinta ilegível na
pele clara e o × do palco debaixo da gaveta. Vale para qualquer coisa
visual daqui em diante: é um Chrome de verdade, com GPU por software.

### 5m.5 Medido no laboratório de verdade (lab2.html, servidor local)

- TOOLS mostra seis instrumentos, FILMADORA entre SONÓGRAFO e SOBREPOR;
  em MÍDIA o botão some (as duas listas do lab2.css);
- máquina aberta: `ops(1)` = 8 efeitos (cadencia, blur, filmstock@0.7,
  filmgrain, dustscratch, gateweave, lightleak, filmgate); o pixel da beira
  do #gl foi de 238/238/226 a **11/10/8** (a barra da janela 4:3) e o do meio
  de 236/239/224 a **218/214/175** (o olhar 60s);
- visor 485×362 (1,339 = 4:3), canvas 603×453 (dpr 1,25);
- vermelho: rolo de **5,967 s** de uma composição de 5,964 s, 1280×720, VP9
  exato, 4,78 MB, miniatura JPEG de 15,6 KB; no arquivo, beira 12/10/8 e
  miolo 214/206/167 — a película está DENTRO; campos da janela EXPORTAR
  devolvidos; crachá "1"; gaveta abre sozinha;
- → troca o filme (m02, rótulo TWO-COLOR, roda a 36°); gaveta com quatro
  máquinas; 35 MM veste `pele-35mm`, visor 1,855, cadeia de 4 efeitos;
- USAR: 1 → 2 clipes, palco fechado, `ops` vazio. Console sem erro.

### 5m.7 SEGUNDA VOLTA (12/09/2026): a carcaça de foto, e o grão que voava

O Bruno olhou e trouxe quatro coisas: não gostou do couro calculado ("a
textura de fundo da carcaça"), mandou três fotos de couro numa pasta,
pediu um botão para subir arquivo do PC, e — a mais importante — *"o grão
está muito grosso e fica voando em uma direção dos cantos; o certo é o grão
ser estático, porém estático dentro do filme e não da tela"*. E a sujeira
grossa demais.

**O grão voava de verdade, e a causa estava numa linha.** O `filmgrain`
sorteava com `hash21(floor(uv*uRes*sc) + tk)` — o número do quadro
SOMADO à coordenada. Somar um inteiro à coordenada de uma rede de ruído não
sorteia de novo: DESLOCA a rede uma célula na diagonal. A 18 q/s com célula
de 3,3 px, o grão inteiro andava ~60 px/s de um canto ao outro, exatamente
o que ele descreveu. A poeira tinha o mesmo desenho (`cell*1.7 + fr`).
Conserto: o quadro entra como um SALTO aleatório grande na rede
(`floor(vec2(hash11(tk*1.31), hash11(tk*2.17))*1024)`), e cada quadro é
um grão novo, parado. Célula de 1/0,55 = 1,8 px no 8 mm (era 3,3), e o
controle **GRÃO VIVO**: desligado, `tk = 0` e o grão fica fixo no filme —
e anda com ele, porque o tremor da janela vem depois na cadeia.

Medido no motor (efeito isolado sobre cinza liso, dois quadros a 1/18 s,
correlação normalizada num bloco de 96×96):

```
                       antigo            novo
melhor deslocamento    (−3, −3) px       nenhum
correlação lá          0,80              0,03 (máx. em ±4 px)
autocorrelação 1 px    0,69 (3,3 px)     0,45 (1,8 px)
GRÃO VIVO desligado    —                 9216/9216 pixels iguais entre quadros
```

O A/B foi feito compilando o shader antigo NO LUGAR (String.replace no
`def.glsl` + `delete r.programs.filmgrain`), medindo, e devolvendo o novo
— o truque da memória de 24/08. Pacotes: grão 0,08/0,07/0,06/0,06 e
`suave` 0,35–0,4 (menos nublado = mais fino); poeira 0,03 com
`dustSize` 0,4 (era 0,05 e 0,8), fiapo 0,012.

**A carcaça.** Os três couros dele (5–17 MB cada) foram reduzidos a 1200 px
com o System.Drawing do PowerShell (245–319 KB) e estão em
`assets/filmadora/couro/`: `F.CARCACAS` é o manifesto (preto, marrom,
bege, calculada). A gaveta BITOLA ganhou a linha CARCAÇA: pastilhas com o
material, a escolhida marcada, e **SUBIR DO PC** — `<input type=file>`
escondido, a imagem reduzida a 1200 px num canvas, JPEG 0,84 em data-URL, a
tinta (clara/escura) decidida pela luminância média, guardada no
`localStorage` (se não couber, vale na sessão). Cada bitola lembra a sua
carcaça (`est.carcaca[bitola]`); 16 e 35 mm ficam na calculada de fábrica,
que é pintura e não couro. A foto entra com `background-size: cover` (não
emenda como ladrilho); os nomes gravados ganham plaqueta escura sobre couro
de foto (os brilhos do couro comiam a tinta creme).

**Duas armadilhas de `url()` em variável CSS, achadas pela foto sem cabeça:**
1. `url()` relativo dentro de uma variável CSS resolve pela FOLHA que a usa,
   não pelo documento — `assets/…` virou `css/assets/…` e a foto não
   aparecia (a calculada, em data-URL, nunca sofreu disso). A variável recebe
   sempre o endereço absoluto (`new URL(u, document.baseURI)`).
2. O mesmo valor vai dentro de `style="…"` nas gavetas: `url("…")` com
   aspas duplas fecha o atributo. Aspas simples.

### 5m.8 TERCEIRA VOLTA (12/09/2026): a película MEDIDA da saída do app, e a máquina pela régua dele

O Bruno mandou dois vídeos: o `.MOV` que o 8mm Vintage Camera gravou
(960×720, 4:3, H.264, 58 s, sem áudio) **filmando a minha carta de
calibração**, um filme do seletor de cada vez; e a gravação de tela do
telefone (750×1334, 68 s) com o app gravando — o tutorial de cada botão. E
quatro pedidos: carcaça fixa com os couros dele (grão menor — "muito zoom"),
uma quarta textura de metal raspado, tirar o efeito da tira de filme
(anexo 02), e "otimizar tudo" pelos vídeos.

**Como os vídeos foram lidos.** Sem ffmpeg nesta máquina; os dois arquivos
foram copiados para `__prova/` (servida pelo servidor local, apagada no
fim) e lidos por `<video>` + canvas no painel, com um receptor HTTP de
uma página (`recebe.js`, porta 5199, POST → arquivo no scratchpad) para
tirar de lá folhas de contato e JSON. Folha de contato do tutorial com o
rótulo da roda recortado a 1:1 deu a ORDEM dos filmes: **XPro → NOIR → 60s →
Pela → Indigo → Tuscan → Two-Color → 2 Strip → 3-X → Siena** (quatro que eu
não tinha), e as três LENTES do app (limpa, um ponto de luz, vazamento
laranja). A linha do tempo do `.MOV` (cor e saturação médias a cada
0,5 s) separou os dez trechos; entre 29,7 e 43 s a tira de filme anda no
quadro (beira preta, beira creme, borda quente) — é o "frame jitter"/tira
que ele mandou tirar, e esses trechos ficaram fora da medição.

**O registro da carta.** Homografia carta→quadro por mínimos quadrados em 16
cantos de patch medidos pelo máximo do gradiente (resíduo ≤ 8 px), depois de
três tentativas por limiar que a borda preta da janela e a beira creme
enganavam. Cada patch lido na região central (40%) de 5 quadros por filme.

**As medidas da base** (Two-Color/Siena, carta parada):

```
maciez        borda 10–90% de 10 px em 960 (σ ≈ 3,6 px)  → blur rad 0,3 (era 0,09)
grão          desvio ≈ 1 nível, célula ~2 px, ferve      → filmgrain amt 0,035 (era 0,08)
cintilação    0,06% (nada)                               → filmgate flick 0,005 (era 0,07)
cadência      24 quadros únicos por segundo no arquivo   (o app estava em 24; a bitola fica em 18)
tremor        só vertical, ≤ 0,5% da altura, esporádico → gateweave amt 0,02, rot 0, jump 0,06 a 2,5/s
janela        preta quase no limite (tam 0,97), sombra ~3% → sombra 0,8, sombraW 0,04
tira/perfuração  fora (o pedido)                          → 16 mm holes 0
```

**Os filmes.** Para cada um, 45 patches (rampa de 16, os 24 do ColorChecker,
5 grandes) lidos da saída do app viraram o alvo, e o PRÓPRIO SHADER do
laboratório se ajustou a eles: Nelder–Mead em 20 dimensões sobre uma cadeia
`crossproc → filmstock` (curva por canal + o filtro de cor), renderizando
a carta pelo `VE.renderer` e lendo os patches com UM `readPixels` por
avaliação (8 ms; com 45 leituras eram 90). Two-Color e 2 Strip trocam de cor
(verde vira ciano, amarelo vira branco) e precisaram de `chanmix →
filmstock`. Erro médio (RMSE nos 45 patches, 0–255): XPro 25 · NOIR 25 ·
60s 25 · Pela 32 · Indigo 34 · Tuscan 28 · Two-Color 36 · 2 Strip 30 · 3-X 22
· Siena 28; nos neutros, 7–14 níveis; pele a ~10. O modelo não é o LUT do
app — o que fica de fora é o ombro dele (tudo acima de 204 vira ~240) e as
cores muito saturadas (o laranja do checker, 40 níveis). A família 8 MM do
catálogo (js/filters.js) agora são essas dez cadeias, na ordem do seletor,
e o seletor da máquina lê a família.

**A máquina pela régua do tutorial.** Os cinco botões na ordem do app: i ·
ROLOS (a tira de filme = os "reels") · BITOLA (a câmera que gira = "trocar
câmera") · REBOB. (o flash do app é tocha, não serve) · SOM. A LENTE ficou
onde o app tem "change lens" (a porta, em cima à direita), com três
estados (LIMPA · VAZAMENTO · HALO, o ícone muda como o dele); o TREMOR é o
centro da roda ("frame jitter"). A carcaça é fixa por bitola: preto, marrom,
bege e o metal escovado gerado (`metal.js` do scratchpad: ruído
alongado em x em duas oitavas, 9 000 riscos, banda de luz), todos ladrilhos
espelhados 2×2 de 1680×1120 (System.Drawing no PowerShell) exibidos a 86% da
largura da máquina — o grão do couro na metade do tamanho. A escolha de
carcaça e o SUBIR DO PC saíram ("o usuário não precisa escolher").

**Medido no laboratório:** cadeia com XPro = cadencia, blur, crossproc,
filmstock, grão, poeira, gateweave, janela; Two-Color = chanmix no lugar do
crossproc; PURO = o filmstock do pacote; LENTE 1 acrescenta lightleak, LENTE
2 acrescenta halation depois da cor; TREMOR desligado tira o gateweave.
Quadro de teste (236,239,224): Siena → (240,201,152), NOIR → (240,240,240),
beira da janela (11,10,8).

### 5m.9 Quarta volta (13/09/2026): couro mais escuro, nomes do laboratório, P&B de verdade

Três pedidos curtos. O couro preto tinha brilho demais: a foto foi
escurecida na própria imagem (matriz de cor a 0,55 + gama 1,6 pelo
System.Drawing) — pastilha visível, brilho fosco. Os dez filmes ganharam
nomes do laboratório, parecidos com os do app e na ordem do seletor dele:
CRUZADO, NOIR P&B, ANOS 60, ÂMBAR, ÍNDIGO, TOSCANO, BICOLOR, 2 TIRAS, TRÊS-X,
TERRA. E "faltou o Noir preto e branco": a medida do app dava um leve quente
nos médios (148/143/130) e o ajuste tinha tingido as sombras de oliva —
lido na tela como sépia, não como P&B. NOIR P&B e TRÊS-X agora têm
saturação −1 e tonalização 0; medido no motor, R=G=B em todos os patches
(NOIR: rampa 7 → 145, branco → 255, azul → 10; TRÊS-X: 152, 221, 51 — as
curvas medidas continuam).

### 5m.10 A QUEIMADURA DE FILME na lente (13/09/2026)

Pedido: *"no botão de lente, ao pressionar, o vazamento de filme são
liberados efeitos de vídeos animados estilo Film Burn Light Leak Effect que
percorrem o vídeo"*, com quatro imagens e um clipe de estoque (5,5 s,
1920×1080). O clipe é de terceiro e não entra no site; entrou a MECÂNICA,
lida dele a 15 quadros por segundo (`__prova/folha.html` + o receptor):

```
0,0–0,9 s   nada
0,9–1,7 s   sobe (média 1 → 115); a banda quente nasce na coluna 11/32
1,7–2,1 s   segura; a banda atravessa até a coluna 31/32 em ~0,9 s
2,1–2,5 s   apaga (108 → 13)
2,5–3,7 s   BRASA: borrões vermelhos fracos, pulsando (média 12–45)
3,73 s      RELÂMPAGO na beira esquerda, um quadro só (máx 230)
4,0–5,2 s   rescaldo até o preto
paleta      (60,12,9) → (155,25,0) → (247,90,0) → (255,215,30) → quase branco
```

O efeito `queimadura` (js/fx5.js, película) é isso em GLSL: eventos
sorteados por vaga de tempo (FREQUÊNCIA por 10 s), cada um com envelope
sobe-segura-apaga, uma banda larga (σ 0,11 na frente, 0,16 atrás) de borda
irregular (fbm) atravessando de fora a fora, um halo assimétrico (o rastro
fica atrás), a brasa (borrão que pulsa e esfria por 1,3 × a duração) e o
relâmpago na beira de saída; a rampa de calor é a do clipe; a luz entra por
TELA e o miolo estoura em branco. Na filmadora, LENTE 1 põe a queimadura no
lugar do vazamento do pacote, dosada pelo ajuste VAZAMENTO.

Medido no motor (fonte lisa, 12 s a 15 leituras/s): eventos a cada ~4 s,
cada um ~1,1 s, o pico da coluna andando 29 → 1 e 4 → 30 (os dois
sentidos), rescaldo de ~1,5 s entre eles; folha de contato lida de volta
pelo receptor — a primeira versão era uma linha fina de neon (σ 0,055) e
virou a banda larga e irregular do clipe.

### 5m.11 A queimadura refeita: rápida, trêmula, com ONDE e CORES (13/09/2026)

O Bruno olhou a primeira queimadura e cortou: *"a animação está errada, não
passa da direita pra esquerda de forma lenta, é bem rápido e pode ter outras
posições também, aparecer só no canto — coloque nas configurações o estilo,
onde vai aparecer; é bem rápida e trêmula; os anexos são diferentes, têm
várias cores."* Eu tinha copiado o RITMO do clipe de estoque (a varredura
de 1 s); as referências dele são lampejos.

O efeito ficou com ONDE APARECE (sorteado · beira esquerda · beira direita ·
canto · topo · base · atravessa · os dois lados) e CORES (sorteado · fogo ·
âmbar · verde e vermelho · azul e laranja · rosa e ciano), DURAÇÃO de 0,35 s
com subida em 15% e queda em 28%, e TRÊMULA — um piscar a 24 Hz (hash por
quadro) sobre um ruído mais macio. As paletas de duas cores põem o lado
frio no lado oposto ao quente; a verde vira um véu no quadro inteiro (a
segunda imagem dele). A beira tem um fio que estoura em branco. Na
filmadora, a seção QUEIMADURA da engrenagem guarda onde, cores, ritmo,
duração e trêmula (`est.queima`), e a LENTE 1 passa isso ao efeito.

Medido no motor (60 leituras/s, 8 s): lampejos de 0,28–0,42 s, três em 8 s
(freq 4), média pulando ~5,5 níveis por quadro dentro do lampejo (a
trêmula). Uma galeria de 18 combinações lida pelo receptor mostrou o
TOPO na base: neste motor o canvas WebGL cresce para cima, `uv.y = 1` é
o topo DA TELA — confirmado depois pela leitura das metades (TOPO acende as
linhas de cima: 299 contra 49). A varredura ATRAVESSA saía branca demais
(1,1 + 0,5) e caiu para 0,9 + 0,35.

### 5m.6 O que NÃO foi feito

- A máquina em movimento não foi vista (o painel). O visor a 60 fps, a roda
  girando, a gaveta subindo, a lâmpada piscando: só o Bruno olhando.
- Rolos não sobrevivem ao recarregar (são blobs). Guardar em IndexedDB é
  simples se ele pedir.
- Não há "foto" (quadro parado): a filmadora só grava rolo. O polaroid é a
  máquina de foto.
- O 16 MM não tem a tira de filme com perfurações no visor — está na
  película (o `filmgate` com `holes`), não na máquina.

## 5n. A AQUARELA — a mesa de luz do animador (vigésima sétima passada)

O pedido: *"uma nova tool que é um gerador de aquarela… simulador de aquarela
baseado em física real que permite pintar diretamente pelo navegador"*, com
a referência de um simulador feito no Claude (52 pigmentos por Kubelka-Munk,
sal, álcool, retroiluminação, um Modo Código que mostra as chamadas enquanto
se pinta, o modelo de Curtis da SIGGRAPH) — e o que é dele: *"QUERO UMA OPÇÃO
QUE DÊ PRA PINTAR CONFORME OS FRAMES, ASSIM VIRA UMA ANIMAÇÃO EM CIMA DA
ANIMAÇÃO."*

### 5n.1 O que a máquina é, e por que é uma mesa de luz

Pintar quadro a quadro por cima de um vídeo é o que o animador faz na mesa
de luz: o vidro aceso mostra o fotograma por baixo do papel, o vegetal mostra
o desenho anterior, a barra de pinos segura a folha. Então a máquina é essa
mesa (regra do polaroid: não há janela, cada peça é uma função): madeira
calculada (veios ao comprido, gerada no tamanho da mesa, sem emenda), a
caixa de tintas de lata com oito godês, quatro pincéis, água, esponja,
pincel seco, sal, álcool e secador; o vidro com a folha; o botão de LUZ (o
vídeo por baixo, e no fim do curso a retroiluminação); a chave do VEGETAL; a
tira de quadros; o vermelho USAR. É a segunda natureza de instrumento
(GRAVAÇÃO): mora no palco, e o resultado vira FONTE.

### 5n.2 O modelo, e onde ele saiu de Curtis (por medida)

Curtis et al. têm: máscara molhada M, velocidades (u,v), pressão p,
pigmentos g (na água) e d (depositados), saturação s do papel, relevo h. A
cada passo: mover a água (advecção, viscosidade, ∇p, declive, arrasto,
relaxar a divergência), escoar para a borda (p −= η(1−M')M), mover o
pigmento (fluxo pelas faces), transferir (depositar/levantar com densidade
ρ, mancha ω, granulação γ contra h), capilar (s absorve, difunde, e M cresce
onde s > σ). Tudo isso está no motor. Três coisas mudaram, cada uma por uma
medida que deu errado antes:

1. **A pressão virou altura de água (água rasa, compressível), e a
   relaxação de divergência saiu.** No artigo a água nunca acaba; p pode
   ficar negativa na beira e é isso que sustenta o escoamento para fora.
   Com água finita, p era pressão E quantidade, e o passo capilar tirava
   3% da água por passo — a mancha secava em 100 passos sem fluir. Separei:
   `w` (a água da célula, em sat.a: anda com o fluxo, evapora, é absorvida,
   some pela beira) e a velocidade vem do gradiente de `w` (`pressao` 0,5,
   arrasto 0,06). A relaxação de Curtis fecha a mancha (um campo sem
   divergência não leva nada à beira) e foi retirada. Medido: antes,
   orla/centro = 0,53 (a borda saía CLARA); depois, 1,4.
2. **O pigmento assenta quando a água vai embora, não com água por cima.**
   Com taxa constante, 30% já tinha assentado antes de chegar à beira.
   Agora `desce ∝ (0,12 + 0,88·(1 − w/0,15))` e `sobe ∝ w`.
3. **A célula só seca quando as vizinhas também estão sem água**, senão a
   beira secava primeiro e M=0 bloqueava o fluxo para lá. O contador de
   secagem vive dentro do próprio M (1 → cai por passo seco → 0 abaixo de
   0,7).

E duas coisas de precisão que só a medida pegou: **texturas de 16 bits
perdiam 2,3% do pigmento em 40 passos** (a fração que entra numa célula ficava
abaixo do último bit) — o estado é RGBA32F, sem filtro; e a **água
fantasma fora da máscara** (o pincel punha água onde a cobertura era menor
que 2%) segurava 30 células da beira molhadas para sempre.

O sangrado e a florada: uma célula seca ao lado de uma molhada com água
bastante (`sangra` 0,2) molha também; em papel ainda ÚMIDO (s alto — o
pincel encharca o papel a 2× a água, e o papel seca a 0,4× a evaporação)
a água exigida cai quase a zero, e o papel CHEIO (s > σ) devolve água à
superfície ao lado de uma molhada. O sal: cristais sorteados (pequenos,
raros), que puxam a água (o gradiente do sal borrado entra na velocidade),
bebem-na, capturam o pigmento (g × 0,85 por passo, e ao secar o que estava
no cristal vai embora com ele) e escurecem a orla (deposição × 3,5 num anel
do borrado). O álcool: impulso radial para fora, evaporação 4×, deposição
× 0,15. O pincel seco só assenta nas cristas (h > 0,5–0,78).

### 5n.3 A cor: Kubelka-Munk de duas cores

Cada pigmento é dado pela aguada sobre branco e pela mesma camada sobre
preto (o método do artigo, 4.4): `a = ½(Rw + (Rb − Rw + 1)/Rb)`, `b =
√(a²−1)`, `S = arccoth((1/Rb − a)/b)/b`, `K = S(a−1)`, por canal, em luz
linear. Uma camada de espessura x: `R = (1−e^{−2y})/(a(1−e^{−2y}) +
b(1+e^{−2y}))`, `T = 2b·e^{−y}/(…)`, y = bSx (a forma estável, sem sinh).
A pilha: `R = R₁ + T₁²R₂/(1 − R₁R₂)`. Os 52 devolvem as cores de partida
com erro 5·10⁻³ (teste em Node, `A.ks` + `A.kmCompor`); hansa + ftalo =
#b4d483, rosa + hansa = #e9b476, ultramar + siena queimada = #b9abb0,
titânio x=2 sobre preto = #dedede, ftalo x=2 sobre preto = #0c2b4c.

**Sobre o vídeo é MULTIPLICAR.** O compositor do laboratório tem um alfa só
por pixel, e uma aguada é um filtro POR CANAL (T² não é igual nos três). O
quadro sai com a cor sobre branco (C_w) e alfa de cobertura, e o clipe entra
em Multiplicar: C = C_w·B — exato para pigmento transparente, e o pigmento
com corpo (cádmios, titânio) perde o corpo sobre vídeo escuro (é o que fica
de fora; NO PAPEL, opaco, o corpo é exato). Um modo de mistura próprio
(índice 27, com o "corpo" no alfa) resolveria — anotado.

### 5n.4 Os quadros, o rolo e a fonte

Cada quadro terminado: o depositado (8 canais × 0,25, quantizados em 8 bits,
dois RGBA8, deflate do navegador — 17 KB a 1024×576) e o quadro renderizado
(PNG escrito à mão, sem canvas no meio, para o alfa não ser pré-multiplicado
— 25 KB). Trocar de quadro seca, empacota, guarda e repõe o de destino (122
ms na placa dele). O ROLO é um arquivo só (cabeçalho JSON + PNGs + estados +
paleta) e é o `blob` da fonte — vai para a sessão guardada e para o .rgblab
sem que autosave.js ou projfile.js saibam dele; `media.recriar` tem o ramo.
A fonte `kind: 'quadros'` desenha o quadro do instante (`floor(t·fps)`)
num canvas, decodificando sob demanda com cache de 40 e prefetch de 4 — e o
plano chama `render(VE.srcTime(c, t))`, por isso velocidade, reverso e
entrada valem como num vídeo.

### 5n.5 Medido

Motor (Chrome sem cabeça, GPU por software, 256×192, `__teste.html`, apagado):

```
massa do pigmento em 40 passos      Δ 0,000% (com 16F: −2,3%)
borda escura (d orla / d centro)    1,39 (era 0,53 antes da água rasa)
granulação corr(d, h)               ultramar −0,71 · ftalo −0,15
sal                                 d no cristal 0,139 < orla 0,183
sangrado do traço                   raio 19,3 → 21,8 px
estado ida e volta                  erro máx 0,0078 (½ degrau); deflate 393 KB → 4 KB, idêntico
PNG                                 decodifica 256×192; alfa 0 onde não há tinta; linha 0 = topo
quadros                             pintar 3, voltar ao 0: depositado reposto (erro 0,0078)
fonte                               render(t) escolhe 0,0,1,2,3 para t = 0, .05, .09, .17, .25
rolo                                3 quadros, 3 estados, paleta de 8, PNG idêntico
```

Laboratório de verdade (lab2.html, painel escondido, por medida): TOOLS
mostra #srcAquarela, MÍDIA esconde; folha 1024×576 de uma composição
1280×720; fundo copiado do #gl; três quadros (ultramar, pirrol, hansa) → o
clipe "AQUARELA 01" kind quadros, start 1,00, dur 0,25, blend 3, numa pista
acima da imagem; `#gl` em t=1,00 no traço: (193,204,244); em t=1,17 no
traço do quadro 2: (249,248,171); fora do clipe: branco; azul (27,79,216)
multiplicado → (22,67,209). `media.recriar` do rolo: 3 quadros, fps 12, o
mesmo pixel (194,205,244,255). DO CLIPE: 3 quadros de volta, ultramar 0,675
no quadro 0, hansa 0,533 no quadro 2. Placa dele (Intel UHD): 9,8 ms por
passo, 2,8 ms para desenhar, empacotar 19 ms, exportar 8 ms, quadro 122 ms.

Como foi visto: o banco de prova `__banco.html` (VE de mentira, apagado) no
Chrome sem cabeça — foi assim que apareceram a madeira em espinha de peixe,
as aguadas fracas (carga 0,26 → 0,42) e a telinha saindo da janela (o
conjunto encolhe a 0,86 com ela aberta).

### 5n.7 Segunda volta (13/09/2026, à noite): desfazer/refazer, a roda nos quadros, as cores

Três pedidos: *"ctrl z e ctrl y"*, *"rolagem entre os quadros"*, *"aumentar
as cores"*.

**Desfazer e refazer.** O de antes eram três cópias em float sem volta. Agora
é um histórico linear (`hist` / `refaz`) de instantâneos em **RGBA8** com
escala e deslocamento por canal (velocidade ±0,5, pigmento 0..4, o resto
0..1) — 13,5 MB por nível a 1024×576, doze níveis (`Motor.HIST`), jogos de
textura numa reserva reaproveitada. Entra no histórico: pincelada, sal,
álcool (`tocar`), SECAR, LIMPAR e COPIAR O ANTERIOR; trocar de quadro zera.
Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z e os dois botões na tampa da lata (acendem e
apagam conforme há o que desfazer). Medido (`__teste2.html`, apagado): cada
volta repõe o estado com erro de um degrau (pigmento 0,0078, velocidade
0,001, água 0,002); três traços → três desfazer → folha vazia → quarto
devolve `false`; três refazer → o terceiro traço de volta; ação nova esvazia
o refazer; 15 toques → hist 12, 13 jogos no total; secar e desfazer devolve
a água (2012 → 0 → 2012, molhada); guardar 0,04 ms, desfazer 0,07 ms. No
laboratório, pelo teclado de verdade: hansa 0,098 → Ctrl+Z 0 → Ctrl+Y 0,094.

**A roda nos quadros.** `wheel` sobre a tira anda um quadro por dente, com
respiro de 140 ms (uma rolada de trackpad atravessaria a sequência): três
dentes seguidos contam um. Medido: 1 dente → quadro 2; três rápidos → 3;
volta → 2.

**As cores.** A carga de fábrica subiu (0,42 → 0,75) e a lata ganhou a
DILUIÇÃO — CLARA (carga 0,35, água 0,42), MÉDIA (0,75, 0,30), FORTE (1,3,
0,20): a espessura de uma pincelada vai de ~1 (a aguada) a ~3,5 (quase
massa). Medido de passagem: um traço por cima de um traço ainda molhado
perdia **92%** do pigmento no cruzamento em 20 passos — cada toque somava
água à área molhada, o morro de água disparava o fluxo e levava o pigmento.
Água nova sobre área molhada agora entra a 40% (`1 − 0,6·clamp(w/0,3)`) e
a pressão caiu de 0,5 para 0,4: o cruzamento guarda 69% em 20 passos e 42%
em 220 (o molhado sobre molhado espalha, não some); a borda escura continua
1,36.

### 5n.8 Terceira volta (13/09/2026): zoom com barras, pincel bem grande, a luz pelos dois eixos, a tela pequena

O print dele: uma composição de **160×90** com a aquarela dentro, a 396% de
zoom do laboratório — *"quando inseri na linha do tempo, ficou com a
qualidade péssima"*. A tela da composição nasce da primeira fonte carregada
(`setCanvas(s.w, s.h, 'src')` em app.js); uma fonte pequena deixa a tela
pequena, e a folha de 1024×576 era esmagada nela. Agora: (1) a DEFINIÇÃO tem
**AUTO** (padrão): o lado maior da composição, entre 1024 e 1280 — a folha
casa com a composição pixel a pixel e nunca fica pequena; 1920 existe, com
aviso de lento; (2) o **USAR cresce a tela** até a folha quando ela é menor
(a folha tem a proporção da composição, o enquadramento não muda) e avisa.
Medido no laboratório: tela 160×90 → folha 1024×576 → USAR → tela 1024×576,
toast escrito.

**Zoom e rolagem.** `− 100% +` no canto do vidro (100 a 800%, o número
volta a 100%), Ctrl + roda aproxima onde o ponteiro está (`zoomPara` mantém
fixo o ponto sob o cursor). A folha vive numa caixa dentro do papel; com
zoom o papel ganha `overflow:auto` com barras finas e escuras (as
"discretas" que ele pediu); sem zoom não há barra. O cursor do pincel passou
a somar o `scrollLeft/Top`. Medido no banco: zoom 2 → caixa 1138×640 num
papel de 569×320, rola, cursor no lugar do ponteiro mais a rolagem.

**Pincel bem grande.** Os quatro presets ficaram; por baixo, TAMANHO livre
(a linha é o campo) de 1 px a **30% da largura da folha** (307 em 1024), com
`[` e `]` em passos de 1,25×. Medido: preset 24 → 20 px, três `]` → 39,
slider 250 → motor 250, teto 307.

**A luz.** *"clico e arrasto pra direita e vai pra esquerda"* — o botão só
lia o eixo vertical. Agora soma os dois (direita ou cima acende) e escreve
o valor embaixo (LUZ 0–100%, depois RETRO 0–100%). Medido: 0,3 → arrasto
90 px à direita → 0,8 (RETRO 33%); 90 px para baixo → 0,3.

### 5n.9 Quarta volta (13/09/2026): o acabamento — a folha desenhada maior que a simulação

*"Consegue deixar o acabamento da pintura mais refinado e menos pixelado?"*,
com dois prints a 300% de zoom: a beira das manchas em degraus de célula.
A simulação tem 1024–1280 células no lado maior e a orla escura (onde o
pigmento se concentra) cai numa fronteira de células inteiras; ampliada
3×, cada degrau tem 3 px. A física não muda; o que muda é como se DESENHA:

1. **Uma pré-passada** (`FS_PRE`) soma depositado + suspenso por godê em
   duas texturas de 16 bits, na resolução da simulação, mais o molhado à
   vista. O desenho (`FS_VER`) e a saída (`FS_EXP`) amostram ESSAS, por
   uv, com filtro bilinear, em qualquer resolução — o papel de desenho é
   uma cópia de 8 bits. A pilha de Kubelka-Munk continua por pixel, mas só
   dos godês que já pintaram na folha (`ativos`, uniforme `uAtivo[8]`).
2. **O canvas cresce com o zoom** (`escalaTela`, até 2× a folha, em
   passos de ¼, pelo tamanho em que aparece × devicePixelRatio): a 300%
   uma folha de 1280 é desenhada a 2560 e o navegador só reduz.
3. **O quadro que vai para a linha do tempo sai na resolução da
   COMPOSIÇÃO** (até 2× a folha; `A.filme.saida`, `exportar(modo, W, H)`
   com um alvo do tamanho pedido), com quatro toques em quincôncio de meio
   texel (`uSuave`) — o laboratório não reescala mais nada. O rolo passou a
   guardar `sim` (o tamanho dos estados) ao lado de `w×h` (o dos PNGs); o
   DO CLIPE abre a folha no tamanho da simulação.
4. O relevo do papel no desenho ficou mais calmo (0,16/0,10 → 0,12/0,08).

**O que a medida mandou refazer no meio:** a primeira versão amostrava as
texturas de 32 bits direto, com o quincôncio (16 leituras de 16 bytes por
pixel): desenhar a 2× custava **35 ms** na placa dele — e pular godês
vazios não mudou nada (33 ms com a folha vazia), porque o custo era
LARGURA DE BANDA, não a conta. Com a pré-passada em 16 bits: **13 ms a 2×,
9 a 1,5×, 7,5 a 1×**; passo + desenho a 2× = 25 ms (~40 q/s pintando com
zoom). A saída a 1920×1080: ~36 ms + PNG 105 ms + estado 86 ms + decodificar
29 ms (a troca de quadro fica em ~260 ms em 1080p). O `gl.finish()` desta
ANGLE não espera nada — medir sempre com um `readPixels` de 1 px.

Visto no banco: a 300%, a beira do ultramar é uma diagonal limpa com a orla
macia. No laboratório: composição 1920×1080 → folha 1280×720 (AUTO) →
saída 1920×1080 (PNG de 96 KB) → o clipe entra 1:1; DO CLIPE reabre a folha
a 1280×720 com o depositado intacto (1,19).

### 5n.10 Quinta volta (13/09/2026): a folha na definição da composição, e o VEGETAL em cores

*"Tá bem, faça"* (a simulação na definição da composição) e *"tem como ter
a opção de ver uma leve camada da anterior, na atual? … qual a proposta
você dá?"*

**A folha em 1080p.** AUTO passou a ir até 1920 (1024–1920 pelo lado maior
da composição); 1280 ficou como a opção LEVE. Como 1080p custa 2,25× por
passo, o motor foi enxugado antes: o transporte dos DOIS pigmentos e da
água numa passada só (três alvos; era três passadas lendo as mesmas
vizinhas), a transferência dos oito godês numa passada (quatro alvos; era
duas), o papel da simulação em 8 bits e o borrão em 16 (100 MB a menos em
1080p), o borrão a cada 3 passos (era 2), e os níveis do desfazer pelo
tamanho da folha (12 a 720p, 5 a 1080p). Medido na placa dele: massa do
pigmento conservada (460,14 → 460,14), borda 1,35, secagem igual; 1080p:
**33,7 ms por passo**, 11,5 ms para desenhar. Para o traço acompanhar a mão
numa folha pesada, o laço pula o passo da água quadro sim, quadro não
ENQUANTO se pinta (só quando o quadro passa de 26 ms); parada a mão, a água
anda a cada quadro.

**O vegetal.** Já existia (anterior em azul, seguinte em vermelho), mas
fraco e sem o que ele pediu: a anterior NAS CORES. A proposta que ficou:
modo CORES (padrão) — o quadro anterior entra como uma aguada leve nas
cores dele (`cor *= mix(1, ca, força·alfa)`), o de dois atrás a 45% da
força; modo AZUL E VERMELHO — o clássico do animador; 1 ou 2 quadros atrás;
a força (0,4 de fábrica); a chave VEGETAL ou a tecla V. Texturas
`vegAnt`, `vegAnt2`, `vegProx`; no modo NO PAPEL o quadro guardado é opaco e
o vegetal divide pela cor do papel (`uVegOpaco`).

**Duas armadilhas desta volta, as duas do tipo que não dá erro:**
1. **ImageBitmap subido direto para a textura chega VAZIO nesta placa**
   (Intel UHD / ANGLE D3D11): `texImage2D(…, bitmap)` sem erro de GL, e a
   textura toda zero — pelo Chrome sem cabeça o vegetal aparecia, no
   laboratório dele não. O mesmo bitmap desenhado num canvas 2D e subido
   dali chega inteiro (`setVegetal` faz isso sempre). Medido lendo a
   textura de volta: (0,0,0,0) contra (246,245,143,255).
2. **Pintar no meio da troca de quadro apagava o traço**: a reposição do
   quadro de destino é assíncrona (deflate, PNG, miniatura) e um traço
   feito antes de ela terminar era limpo por ela. A folha ignora o ponteiro
   enquanto `trocando`.

Visto no banco: quadro 2 com o traço amarelo cheio e o azul e o vermelho
do quadro 1 como aguadas leves; quadro 3 com o amarelo leve e os dois
primeiros mais leves ainda; o modo azul tingindo os dois de azul. No
laboratório dele: quadro 3, um atrás (hansa) = (240,239,205), dois atrás
(ultramar) = (229,230,234), papel (244,243,239); a tecla V devolve o papel.

### 5n.6 O que NÃO foi feito, e por quê

- **A mesa em movimento não foi vista** (o painel). O ponteiro de verdade
  (pressão, `getCoalescedEvents`), a água à vista secando, o cursor, o
  folhear, o vegetal: só o Bruno olhando.
- **A florada grande (a couve-flor) cresce pouco** no teste: uma gota na
  beira de uma aguada úmida cresceu +52 células contra +190 no papel seco.
  O mecanismo existe (o limiar cai em papel úmido) mas a água evapora antes
  de correr longe. É ajuste de constantes com o olho dele (`sangra`,
  `evap`, `eta`, `pressao` em `M.par`).
- **Corpo sobre o vídeo**: pigmento opaco sobre vídeo escuro perde o corpo
  em Multiplicar (5n.3). Um modo de mistura próprio resolveria.
- **Sem pincel chato, sem leque, sem spray** — só redondos.
- O histórico de desfazer é por quadro (trocar de quadro zera) e mora na
  placa de vídeo: doze níveis são 162 MB a 1024×576 — se a máquina dele
  reclamar, `Motor.HIST` é o número.
- A paleta é lembrada entre sessões (localStorage); os rolos só vivem na
  linha do tempo (o clipe) — não há gaveta de rolos como na filmadora.

## 14. O QUE FAZER NA PRÓXIMA PASSADA

**Antes de tudo: a lista do Bruno.** Ele fecha cada sessão usando o que entrou
e trazendo o que quebrou — foi assim que os três defeitos da 5c apareceram.
Começar por ela; o que está abaixo é só o que sobra quando ela acaba.

Em ordem de valor. Os dois primeiros vieram do que a 4v mediu e não consertou.

### O que ficou aberto na VIGÉSIMA QUARTA *(seções 5h a 5k)*

O mais recente. Em ordem de valor.

**Antes de tudo: nada do ÁUDIO foi ouvido.** A montagem, o espectrograma, a
mistura, os quatro efeitos de TRAMA da tipografia — tudo provado por medida
(contagem de amostra, variância de pixel, duração de buffer, centro de massa
de tinta). É a única parte deste projeto em que um erro passa sem ser
detectado. Peça para ele abrir e escutar antes de qualquer coisa.

1. **A RÉGUA DE TEMPO com números** sobre a onda do LAB 02. Hoje são dez
   divisões e nenhum número: não dá para saber onde está 1:20. Agora há DOIS
   gráficos empilhados (onda e espectrograma) olhando para a mesma régua
   invisível, o que torna a falta maior do que era.
2. **A onda desenhada dentro do trecho da MONTAGEM** (5j.5). Hoje o bloco é
   um retângulo com o nome. Com a onda dentro dá para cortar no lugar certo
   olhando, que é como se corta som de verdade.
3. **A LENTIDÃO DO RACK**, medida e não consertada (5i.4). Num áudio de um
   minuto: 3,4s por volta de botão com seis módulos, 14,7s só com o
   ESPECTRAL. A causa é estrutural — toda mudança chama `A.rerender()`, que
   recomeça do áudio ORIGINAL e refaz a cadeia inteira sobre o arquivo
   inteiro. Mexer no último módulo de seis recalcula os seis.
   **O conserto proposto:** guardar o buffer de ENTRADA de cada passo; mexer
   no módulo 6 recalcularia só o 6 (de 3,4s para ~0,5s). Custo: memória, um
   buffer por passo. Segundo conserto, independente: calcular a prévia só no
   trecho que está tocando enquanto se arrasta.
4. **PAPEL com `multiply` na tipografia** (5h.7) — o efeito mais forte do
   Analog Typewriter, e o único das referências que não entrou. Precisa de
   uma textura de papel escaneada, e isso é decisão dele: o polaroid já tem a
   convenção de jogar escaneamentos numa pasta (`assets/polaroid/molduras`).
   Papel pediria a mesma coisa.
5. **Ganho por trecho, encaixe e desfazer** dentro da MONTAGEM (5j.5). O
   ganho já existe no modelo, falta o controle. O Ctrl+Z do laboratório não
   alcança a montagem.
6. **O rodapé SAÍDA da tipografia** (5h.10): ~180px presos no pé da coluna,
   com duas frases de ensino sempre visíveis. Encolhê-lo levaria a coluna de
   ferramentas de 1,15 para ~1,00 tela. As frases são dele, e ele não pediu
   para tirá-las — perguntar antes.
7. **Onde mais a repaginação não chegou**, pelo aviso da 5i.5: o áudio
   reativo e a janela de legendas são as próximas candidatas a estarem com o
   desenho de outra época, porque também são montadas por JavaScript e não
   aparecem numa auditoria do `index.html`.

### O que ficou aberto no SONÓGRAFO e na CIFRA *(seção 5g)*

O mais recente, e o que tem mais chão pela frente.

1. **Nem um nem outro foi visto por mim em material de verdade.** A prova foi
   por medida, por eventos sintéticos e bombeando o laço à mão, porque o painel
   estrangula `requestAnimationFrame` e a decodificação de vídeo quando não
   está exibido. Peça para ele abrir, tocar e trazer o que estranhar.
2. **O BANCO DE ÁUDIOS** (§7 do pedido dele): categorias, busca, prévia,
   favoritos, forma de onda. Hoje há dez vozes SINTETIZADAS em `js/musica.js`,
   e o banco entra por cima delas sem reescrever nada — `M.tocar` é o único
   ponto que precisa saber tocar amostra além de oscilador.
3. **UPLOAD DE SONS DO USUÁRIO** (§8): WAV/MP3/AIFF/OGG, nomeados e associados
   a um sensor ou evento. Depende do item 2.
4. **SISTEMA DE REGRAS DE EVENTO** (§9): condição → resultado, combináveis
   ("objeto azul → sintetizador", "brilho > 80 % → velocity 100"). Hoje o
   mapeamento é fixo em quatro seletores; as regras seriam a versão aberta
   disso.
5. **A cauda de 2 s do render** é boa para o sonógrafo (o sino ainda soa quando
   o vídeo acaba) e desproporcional para uma gravação curta da cifra — numa
   peça de 1,8 s ela dobra o clipe. `M.render` já aceita `opc.cauda`; falta
   decidir o número por instrumento, ou tirá-lo do release da voz escolhida.
6. **O nome CIFRA foi escolha minha**, não dele — ele nomeou o SONÓGRAFO mas
   não este. Alternativas que cabem no vocabulário da casa: CAMPO HARMÔNICO,
   HARMÔNIO, ACORDEIRO. É uma troca de rótulo em quatro lugares.
7. **A cifra não tem metrônomo nem quantização.** O sonógrafo tem GRADE; aqui
   o que se toca é gravado como se tocou. Para casar com a linha do tempo, um
   dia isso vai fazer falta.
8. **Nenhum dos dois entrou no LEIA-ME.md.** O manual ainda não os conhece.

### O que ficou aberto na CÂMERA POLAROID *(seção 5f)*

Nada disto impede usar; é o que eu sei que falta.

1. **Nenhuma foto do Bruno passou por lá.** Os testes de olho usaram um
   escaneamento de polaroid e uma imagem de referência da pasta. Se o filme
   fica bonito nas fotos DELE é olho, e é o dele.
2. **Imprimir** — a referência tem; aqui há BAIXAR PNG em tamanho de folha
   (1000×1231) e USAR NA LINHA DO TEMPO.
3. **Edição em lote** — a referência baixa um `.zip` com vários; aqui o maço
   guarda as três últimas para comparar, mas sai uma de cada vez.
4. **A pasta cheia nunca rodou.** Há dois escaneamentos de moldura e dois
   originais. O caminho de "muitos arquivos" — rolagem da lista, tempo de
   carga — não foi exercitado.
5. **`preta.jpg` e `creme.jpg` continuam em JPEG**, e portanto ainda dependem
   da trama reconstruída (`realce: 1`). Se aparecerem em PNG, é trocar o
   arquivo e pôr `realce: 0` — nada de código.
6. **A folha desenhada** (`branco`, `velho`) é lisa de propósito e só existe
   para o laboratório nunca abrir sem papel. Se um dia incomodar, o caminho é
   apagá-la da lista, não texturizá-la.

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
3. ~~Guardar a medida da letra por (semente, corpo)~~ — **feito na 4w.** De
   quatro medições por letra por quadro para duas no primeiro quadro e zero
   nos seguintes; saída idêntica byte a byte. *(seção 4w)*
4. ~~Worker para as cadeias longas de áudio~~ — **feito na 4x.** Os vinte
   módulos de buffer rodam fora da linha principal, com o mesmo texto da
   biblioteca; saída idêntica amostra a amostra, e a maior espera da página
   caiu de 2.607 ms para 30 ms. *(seção 4x)*
5. ~~Filtro de segunda ordem no `D`~~ — **feito na 4z.** Biquad de sete tipos
   mais a cascata Butterworth `D.butter`. O TELEFONE foi de 69,5% para 92,2%
   da energia dentro da banda, o RÁDIO de 66,2% para 92,4%. *(seção 4z)*

### Pedidos ainda não atendidos

6. ~~VHS pelo mérito~~ — **feito na 4y.** Os cinco artefatos pedidos estão lá,
   medidos um a um, mais a banda de luz e de cor, o atraso da cor, a franja, o
   realce do deck e a geração da cópia: vinte controles, três passadas, e os
   sete parâmetros antigos com as mesmas chaves. *(seção 4y)*
7. ~~Alça de Bézier por vértice na máscara de EFEITO~~ — **feito na 5a.** A
   região do efeito aponta para um traçado do clipe e herda as alças, a
   animação por vértice e o editor da caneta. *(seção 5a)*
8. ~~Botão SEGUIR na máscara de caneta~~ — **feito na 5b.** MARCAR OBJETO
   preenche o traçado vazio e SEGUIR encosta os vértices que já existem no
   contorno do quadro, mantendo a contagem e as alças. *(seção 5b)*

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
