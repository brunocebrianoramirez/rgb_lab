# rgb_lab — Laboratório Audiovisual Experimental

> Este é o manual de uso. O estado do projeto, as decisões tomadas e a lista de
> pendências ficam em [PROJETO.md](PROJETO.md).

Sistema de experimentação audiovisual que roda inteiro no navegador, sem servidor
e sem upload. Três mesas de trabalho — **vídeo**, **áudio** e **tipografia** —
compartilhando a mesma composição, os mesmos presets e o mesmo sistema gráfico.

> Elaborado e criado por **Bruno Cebriano Ramirez**.

---

## Como abrir

**Clique duplo em `ABRIR RGB_LAB.bat`** (sobe o servidor local e abre o navegador),
ou pelo terminal:

```bash
node server.js
```

`rgb_lab-arquivo-unico.html` tem tudo dentro de um arquivo só, para mandar pra
alguém. Precisa de Chrome, Edge ou Firefox atualizados (WebGL2 + Web Audio).

---

## Não sei por onde começar

Cada laboratório tem um **tutorial dentro dele**. O botão `? COMO USAR` fica no
cabeçalho, ao lado do seletor CLARO/NOTURNO, e abre uma gaveta que desliza por
cima do trabalho — não é outra página, não tira você de onde estava, e `Esc`
fecha.

É o mesmo botão nos três laboratórios: ele abre o guia daquele em que você está,
e some no índice e no manual, onde não haveria o que ensinar.

Vídeo tem 16 passos, áudio 13, tipografia 8. Cada passo termina numa caixa
**FAÇA AGORA** com uma coisa concreta para fazer ali mesmo, e a barra de espaço
continua funcionando com o guia aberto — quando o passo diz "aperte espaço",
é para apertar de verdade.

Ele lembra onde você parou. Fechar no meio e voltar depois cai no passo certo.

---

## Direção de arte

A interface é parte do experimento. O sistema gráfico nasceu das referências da
pasta `REFERENCIAS/`: fichas técnicas, formulários, tickets perfurados, pastas de
arquivo, impressos suíços.

### Os três canais

RGB aqui **não** quer dizer vermelho-verde-azul no sentido tradicional. As três
cores são os **canais proprietários do laboratório** e funcionam como código de
navegação — você sabe onde está sem ler o nome da seção:

| Canal | Cor | Laboratório |
|---|---|---|
| **BLUE** | `#1B4FD8` | 01 · VÍDEO |
| **GREEN** | `#1C7A41` | 02 · ÁUDIO |
| **RED** | `#D0271B` | 03 · TIPOGRAFIA |

O canal ativo pinta o trilho lateral, a aba do cabeçalho, o ponto de cada seção,
o retículo do cursor, o cabeçote da linha do tempo, o estado selecionado e o
campo LAB da barra de status — e também **toda a cor de interação**: o que está
ligado, o que está em foco, o que você está arrastando, o menu aberto, o botão
escolhido. Dentro do laboratório de áudio, essas coisas são verdes; no de vídeo,
azuis; no de tipografia, vermelhas. Nada de amarelo dentro de um laboratório. Na linha do tempo, cada pista carrega a cor do que
ela guarda: vídeo azul, áudio verde, tipografia vermelho, efeito neutro.

O resto da interface continua **preto, off-white, cinza e branco**. As cores são
raras e funcionais — nunca enfeite.

| | |
|---|---|
| **Papel** | `#EFEDE4` — a base de tudo |
| **Tinta** | `#16150F` — texto, filetes, molduras |
| **Amarelo** | `#F5D000` — interação **fora** dos laboratórios: índice, manual, entrada, boot. Dentro de um laboratório, esse papel passa para a cor do canal |
| **Laranja** | `#E2670F` — alerta e ação destrutiva (fica fora do trio de canais de propósito) |
| **Grotesca** | Archivo — títulos, navegação, nomes |
| **Monoespaçada** | JetBrains Mono — metadados, parâmetros, códigos, tempo |

Zero raio de canto, zero sombra suave, zero gradiente. Filete de 1px, grade de
4px, marcas de corte nos quadros. O seletor **CLARO / NOTURNO** no cabeçalho
inverte o sistema inteiro — a marca inclusive. As colunas são redimensionáveis
pela borda (clique duplo volta ao padrão) e a medida fica guardada.

---

## Estrutura

```
ENTRADA (ascii ao vivo) → BOOT → ÍNDICE → [ MANUAL 01 ] → LABORATÓRIO → FERRAMENTA → SAÍDA
```

* **Cabeçalho** — identidade, navegação numerada, relógio, modo
* **Trilho** — identificação do sistema, furos de fichário
* **Barra lateral** — catálogo contextual (fontes, efeitos, presets)
* **Área de trabalho** — o laboratório aberto
* **Inspetor** — ficha técnica do objeto selecionado
* **Status** — estado, fonte, tela, fps, camadas, efeitos, desfazer, salvar e a
  assinatura de autoria, que acompanha todas as vistas

---

## 01 · LABORATÓRIO DE VÍDEO

### Fontes
Arquivo de vídeo, imagem, **webcam** (ao vivo, congelar frame, gravar trecho),
texto vindo do laboratório de tipografia, áudio e uma carta de teste procedural.
Arrastar arquivo para dentro da janela também funciona.

E **SOBREPOR**, que ocupa a linha inteira porque faz outra coisa: põe o arquivo
escolhido POR CIMA do que já está no cursor, em vez de acrescentar um plano no
fim da pista.

### Camadas
Cada fonte vira uma camada com início, duração, posição, escala, rotação,
opacidade, **modo de mistura (21 modos)**, espelhamento, ajuste (caber/preencher/
esticar/1:1), visibilidade, som, **velocidade e sentido** e keyframes. A ordem da
pilha se muda no inspetor.

### Viewport
`FIT` · `100%` · `200%` · `400%` · valor livre · `LARG` · `ALT` · `CENTRO`.
Roda do mouse rola, `Ctrl`+roda dá zoom no cursor, arrastar move a tela.
Réguas em pixels do projeto nas duas bordas. **Um 1080×1920 aparece inteiro.**

Formatos de tela prontos: fonte, 16:9, 9:16, 1:1, 4:5, 4:3, 21:9 — ou qualquer
medida no inspetor.

### Linha do tempo — uma mesa de edição não linear

Não é mais uma representação do que está acontecendo: é onde a edição acontece.

**Pistas de verdade.** `+V`, `+A` e `+FX` criam quantas pistas você precisar.
Cada uma tem nome editável, ver/mudo, solo, trava e expansão. A ordem é
`FX` no topo, depois vídeo, depois áudio — o que está mais em cima aparece na frente.

**Vários clipes na mesma pista.** Jogar quatro vídeos gera
`[VÍDEO A][VÍDEO B][VÍDEO C][VÍDEO D]` numa pista só, não quatro camadas
empilhadas. Cada arquivo novo entra no fim da pista.

**Edição temporal.** Arraste o corpo do clipe para mover (inclusive entre pistas),
arraste as bordas para aparar. `Alt` enquanto apara faz **ripple** — fecha o buraco.
`S` corta no cursor (sem seleção, corta a coluna inteira). `Ctrl+arrastar`
duplica. Laço no fundo da pista seleciona vários; `Shift+clique` soma à seleção.

**Camadas de ajuste.** O botão `AJUSTE` cria uma camada que afeta **tudo o que
estiver abaixo dela**, só no intervalo em que existir. Arraste as bordas para dizer
de onde até onde o efeito vale. É assim que se faz "o ASCII começa em 00:12 e
termina em 00:38" sem tocar em nenhum clipe.

**Pilha de efeitos.** Um clipe (ou uma camada de ajuste) aceita vários efeitos em
sequência: `ASCII + DITHER + CRT + RUÍDO`. No inspetor dá pra reordenar,
ligar/desligar, duplicar, remover e editar cada um.

**Keyframes.** Toda propriedade de MOTION e todo parâmetro de efeito tem um
**cronômetro** `◆`. Ligado, mudar o valor cria keyframe no instante do cursor.
Os keyframes viram losangos dentro do clipe, arrastáveis, com curva por keyframe:
`LINEAR` · `EASE IN` · `EASE OUT` · `EASE IN/OUT` · `BÉZIER` · `HOLD`.
O painel mostra os gráficos de **valor** e de **velocidade**.

**MOTION.** Posição X/Y em pixels, escala (uniforme e por eixo), rotação, ponto de
âncora e opacidade. Com a caixa `CAIXA` ligada, o clipe selecionado ganha um
controlador sobre a prévia: arrastar move, canto redimensiona, alça de cima gira,
`Alt` move a âncora — e tudo vira keyframe se a propriedade estiver animada.

**Transições.** Botão direito num clipe → entrada ou saída. 30 transições em
famílias: `DISSOLVE` · `WIPE` · `SLIDE` · `PUSH` · `ZOOM` · `GLITCH` e a família
própria **`MOTION`** — PULL, BLOCK, TRAVEL, SPIN, FLIP, SPRING, POP, FOLD, cada uma
com parâmetros. A duração se arrasta pela borda hachurada do clipe.

**Marcadores, entrada e saída.** `M` marca (clique duplo nomeia), `I` e `O`
definem o trecho. Sem seleção, `Del` apaga o que estiver entre entrada e saída.

**Zoom e navegação.** `+` `−` ou `Ctrl`+roda dão zoom horizontal, de visão geral
até frame a frame. `FIT` enquadra a sequência. `↑` `↓` pulam de corte em corte.
Rolagem horizontal e vertical independentes. O ímã encaixa em bordas de clipe,
cursor, marcadores e keyframes.

**Estado do clipe** aparece em indicadores pequenos no próprio clipe: `fx3`
(três efeitos), `◆` (tem keyframe), `⇥` (tem transição), `▪` (travado),
`×` (desligado), `M` (mudo), `▦` (composição).

**Composições.** `Ctrl+G` transforma a seleção numa composição aninhada, que entra
na sequência como um clipe só. Os originais continuam vivos lá dentro.

### Efeitos (144), em oito famílias

O catálogo cresceu e deixou de ser uma lista de categorias soltas. Agora são
**oito famílias**, e cada uma é uma maneira diferente de tratar a imagem:

| | família | o que é | quantos |
|---|---|---|---|
| 01 | **COR / MATÉRIA** | o que a cor é, e o que sobra quando ela vai | 37 |
| 02 | **TEMPO** | o quadro como janela sobre vários instantes | 12 |
| 03 | **ESPAÇO / DISTORÇÃO** | a imagem como superfície deformável | 21 |
| 04 | **GLITCH** | mecanismos de falha, digitais e analógicos | 16 |
| 05 | **PIXEL / DIGITAL** | a imagem como grade de valores discretos | 14 |
| 06 | **PINTURA / MATERIALIDADE** | comportamentos de pigmento e de impressão | 16 |
| 07 | **PERCEPÇÃO** | ver o que o olho não vê: borda, calor, relevo | 12 |
| 08 | **INSTRUMENTOS** | não são filtros: são máquinas de videoarte | 11 |

Cada família tem cor própria, e essa cor aparece no filete de cada item da
lista — o catálogo inteiro lê como um sistema em vez de 144 cores soltas.

#### As cinco ferramentas assinatura

Estas cinco não existem em editor nenhum. São o que faz o rgb_lab parecer um
instrumento de criação, e não um site com filtros.

* **MEMÓRIA DE COR** — você escolhe uma cor. O sistema constrói uma máscara
  perceptual em torno dela (matiz + saturação + luminância) e destrói
  progressivamente todo o resto: primeiro a saturação, depois o contraste,
  depois a própria matéria da imagem, que vira ruído e erosão. Não é
  "dessaturar tudo menos o vermelho": é esquecimento em três estágios.
* **DESLOCAMENTO TEMPORAL** — uma máscara decide de qual instante cada pixel
  vem. A esquerda do quadro pode estar no passado enquanto a direita está no
  presente. É contínuo, não em degraus: "1,7 quadros atrás" existe.
* **DESLOCAMENTO ESPECTRAL** — cada faixa de matiz recebe um deslocamento, giro
  e escala próprios. A imagem se desmonta por comprimento de onda, não por
  canal RGB.
* **MOTOR DE REALIMENTAÇÃO** — o quadro volta para dentro de si mesmo,
  transformado: giro, escala, deriva, giro de matiz e decaimento por volta. É a
  câmera apontada para o próprio monitor, com a geometria na mão. Combinado com
  o caleidoscópio, vira o CALEIDOSCÓPIO REALIMENTADO: imagem sem fim.
* **EROSÃO DE MATÉRIA** — a imagem se deteriora organicamente. Um limiar decide
  o que já está perdido, o ruído come a borda do que sobrou e o que caiu escorre
  para fora do quadro. Invertida, ela vira CRESCIMENTO: a imagem se constrói.

#### Os pedidos que viraram efeito

* **ESTRELAS DE LUZ (kira kira)** — é um filtro **cross-screen**: uma grade de
  fios finos na frente da lente difrata cada reflexo especular em raias retas,
  e a ponta abre em arco-íris porque os comprimentos de onda se separam com a
  distância. Aqui: 2, 4, 6 ou 8 pontas, comprimento, brilho na ponta, ângulo,
  giro no tempo, cintilância com fase própria por reflexo, núcleo estourado e
  **difração cromática** regulável — sutil no padrão, arco-íris cheio no máximo.
  As pontas secundárias têm comprimento próprio: é o que dá a estrela de oito
  com quatro raias longas e quatro curtas.

  Ele roda em **cinco passadas**, e isso não é detalhe de implementação: é o que
  faz a raia existir. O pixel que desenha um pedaço de raia precisa olhar ao
  longo dela até encontrar o reflexo; se as amostras ficarem mais espaçadas do
  que o reflexo é largo (2 a 4 px na água), ele cai no vão e a raia sai
  pontilhada. Varrer meia tela de 2 em 2 pixels custaria 250 amostras por raia.
  A saída é varrer em potências de quatro — cada passada olha quatro posições
  com o passo multiplicado por quatro, e somando uma escolha de cada passada
  chega-se a qualquer distância de 0 a 255 passos, que é contagem na base
  quatro. Resultado medido: **raia contínua, 377 de 377 pixels acesos**, a 22 ms
  por quadro em 1280×720 numa placa integrada — a versão de passada única dava
  raia furada e 142 ms.
* **COLORIZAR (P&B → cor)** — devolve cor a um preto e branco por REGIÃO. A
  imagem é separada em céu, vegetação, pele e matéria usando luminância,
  aspereza local e posição no quadro; cada região recebe um matiz plausível e a
  luminância original é preservada. Há cinco cenas prontas (automático,
  paisagem, retrato, interior, arquivo antigo) e as quatro cores são editáveis.
  **Não é uma rede neural** — é o método do colorista, feito por máscara. Se a
  fonte já tiver cor, ela tem prioridade, então dá para deixar o efeito ligado
  num corte que mistura material colorido e P&B.
* **CUBIK (retalho)** — o quadro é picado numa grade irregular por subdivisão
  binária, e cada pedaço vem de outro lugar E de outro instante, com escala,
  espelhamento, separação de canais e filete entre os pedaços.
* **ESTABILIZADOR DE VÍDEO** — mede o tremor e o cancela. Ver mais abaixo.

#### Onde um efeito vive

Um efeito pode viver em dois lugares, e a diferença importa:

* **no clipe** — selecione o clipe e clique no efeito. Vale só para aquele pedaço.
* **na camada de ajuste** — sem seleção, o efeito vira uma camada que alcança
  tudo o que estiver abaixo dela, no intervalo em que ela existir.

Todo efeito tem **região** (retângulo, elipse, faixa H, faixa V, com inversão,
rotação e borda suave) arrastável direto na prévia, **intensidade**, **fades** e
**keyframes** em qualquer parâmetro numérico.

### O motor lembra dos quadros passados

A família TEMPO só existe porque o motor deixou de guardar apenas o último
quadro composto e passou a guardar vários, num anel — nada é copiado de um alvo
para outro, só o índice gira, então não custa nada.

É isso que permite eco temporal com vários passos, acúmulo de centenas de
quadros, borrão de movimento estimado ENTRE quadros e o deslocamento temporal.
Pular no tempo limpa a memória inteira, senão dois quadros que não se seguem
seriam misturados.

**São duas memórias, e a diferença importa.** Uma guarda o quadro já COMPOSTO,
com os efeitos dentro — é o que o eco quer, porque eco é realimentação. A outra
guarda a imagem como ela ENTROU na cadeia, e é essa que um efeito precisa quando
quer ver outro momento sem se incluir nele. Sem a segunda, uma tira que lê o
passado leria a si mesma lendo a si mesma, e sairia preta.

**A memória da fonte é ajustável, e o ajuste é de FLUIDEZ, não de tempo.**
Quem lê dali lê em pedaço estreito, então ela vive em meia resolução e cabem
muitas lembranças pelo preço de poucas. Nas TIRAS DE PAPEL isso aparece como
o controle *Memória*:

| escolha | lembranças | trocas de imagem por segundo | vídeo a 1080p |
|---|---|---|---|
| **CURTA** (padrão) | 16 | 15 | 32 MB |
| **LONGA** | 32 | 30 | 63 MB |
| **MÁXIMA** | 64 | 60 | 127 MB |

A *Distância no tempo* continua sendo quem manda no intervalo entre uma tira e
a vizinha. A *Memória* só decide se esse intervalo chega fluido ou aos saltos —
com poucas lembranças o motor é obrigado a guardar um quadro a cada quatro, e a
tira atrasada só troca de imagem quando ele guarda.

Os shaders também recebem o som do instante — nível, grave, médio e agudo — para
quem quiser um efeito que responda ao áudio.

### Estabilizador de vídeo

O shader só APLICA a correção; quem mede o tremor é o analisador em `js/stab.js`:

1. o quadro pronto é reduzido a uma grade de 64×64 e lido de volta para a CPU;
2. dessa grade saem dois **perfis de projeção** — a soma de cada linha e a de
   cada coluna, duas curvas de 64 números;
3. cada perfil é comparado com o do quadro anterior procurando o deslocamento
   que melhor encaixa, com refinamento por parábola para dar resolução de
   sub-pixel;
4. o deslocamento medido entra num controlador de primeira ordem:
   `correção += medido × força` cancela o que acabou de tremer, e
   `correção *= (1 − vazamento)` devolve devagar, para que um movimento
   INTENCIONAL de câmera continue passando.

Como a medição é feita no quadro **já corrigido**, o que se mede é o resíduo: a
malha é fechada e não oscila. O corte de segurança evita as bordas vazias, e as
bordas podem esticar, espelhar, ficar pretas ou vir do quadro anterior.

A leitura de volta custa uma pequena parada por quadro — por isso ela só
acontece quando o efeito está no ar.

### Velocidade, reverso e vai-e-volta

Na ficha do clipe, dentro de **TEMPO**:

* **velocidade** de 0,1× a 8×, com botões rápidos de 0,25× · 0,5× · 1× · 2× · 4×;
* **sentido**: normal, reverso, vai-e-volta ou congelado.

Em velocidade normal o vídeo toca de verdade, com som e com o passo do próprio
arquivo. Nos outros modos ele é posicionado quadro a quadro, porque nenhum
navegador toca mídia para trás: fica mais duro na prévia, sai exato na
exportação frame a frame e **não tem áudio**. Congelado mostra sempre o quadro
da entrada na fonte — mude a entrada para escolher qual.

### Sobreposição de duas imagens

O botão **SOBREPOR**, no fim do bloco FONTE, é diferente dos outros: ele não
acrescenta um plano no fim da pista, ele põe o arquivo **por cima** do que está
no cursor — numa pista acima, no mesmo intervalo, já em modo TELA a 75%.

Serve para dois vídeos, duas imagens ou uma imagem sobre um vídeo. Depois é só
trocar o modo em **MISTURA**, na ficha à direita. São **21 modos**: normal,
multiplicar, tela, somar, diferença, sobrepor, escurecer, clarear, subtrair,
dividir, superexpor, subexpor, luz forte, luz suave, exclusão, luz linear,
matiz, saturação, cor, luminosidade e pino.

### A coluna da direita recolhe

Cada bloco da ficha — TEMPO, MOTION, ÁUDIO, TRANSIÇÕES, PILHA DE EFEITOS,
KEYFRAMES — tem uma **setinha no cabeçalho**. Clicando, o bloco encolhe até
sobrar só o título.

* **alt+clique** na setinha fecha todos os outros e deixa só aquele aberto;
* os dois botões no topo da coluna recolhem tudo ou abrem tudo;
* o estado de cada bloco fica guardado e sobrevive a recarregar a página.

Serve exatamente para o que você pediu: deixar só MOTION aberto, ou só a pilha
de efeitos, e trabalhar num de cada vez.

### A coluna da esquerda tem abas

São quatro catálogos, e empilhados eles se espremiam até um colapsar e vazar por
cima do outro. Agora **FONTE** fica fixo no topo e um seletor abre um catálogo por
vez, cada um com a altura inteira que sobra e rolagem própria:

| | | |
|---|---|---|
| `01 EFEITOS` | 144 | busca, oito famílias, lista |
| `02 FILTROS` | 52 | a galeria, com miniatura |
| `03 ESTILOS` | 49 | cadeias prontas, com busca |
| `04 PRESETS` | — | as cadeias que você salvou |

O número ao lado de cada aba é quantos itens ela tem no momento — com filtro de
categoria aplicado, o número acompanha.

### Galeria de filtros (52)

Oito famílias: `LOOK` · `PROCESSO` · `ÓPTICA` · `NEUTRO` · `FRIO` · `QUENTE` ·
`CRUZADO` · `P&B`.

**PROCESSO** é a família nova, e é diferente das outras: cada item é um
PROCESSO de laboratório cinematográfico reconstruído com uma CADEIA de efeitos,
não um jogo de valores de curva. São doze — **bicromia** (o processo de duas
cores, sem registro do azul), **tricromia**, **reversão**, **revelação
trocada**, **branqueamento** (a prata que fica na película), **toscana**,
**índigo**, **duas cores**, **noir**, **alta sensibilidade**, **anos sessenta**
e **laboratório**. Alguns precisam mexer na matriz de canais, coisa que a curva
sozinha não faz — por isso a cadeia.

**ÓPTICA** são cinco que mexem na LUZ e não só na cor: **estrela**, **estrela de
seis**, **halo**, **retalho** e **colorir**. Ficam na galeria porque é ali que
se escolhe olhando.

**Miniatura ao vivo.** Cada cartão mostra o quadro que está no cursor passado por
aquele filtro, gerado num renderizador pequeno e separado que nunca atrapalha a
prévia. O rodapé da aba diz qual quadro está sendo usado. Se ainda não houver
mídia no cursor, a galeria desenha uma **carta de referência** — céu, pele, sol
estourado, degraus de cinza e barras de cor — para você conseguir escolher mesmo
com o projeto vazio.

**Prévia ao passar o mouse.** Passar o cursor sobre um filtro mostra ele na prévia
grande, em tamanho real, **sem aplicar nada**; sair desfaz. O interruptor
`PRÉVIA` na barra da aba desliga isso se atrapalhar.

**Clique aplica.** No clipe selecionado, ou — sem seleção — numa camada de ajuste
sobre a sequência inteira. O filtro em vigor fica marcado como `APLICADO`, e
escolher outro **substitui** em vez de empilhar.

**Miniatura em branco não existe mais.** Antes, abrir a aba ou trocar de família
refazia a lista de botões com a imagem vazia, e o guarda de "quadro congelado"
mandava não redesenhar — só o botão ↻ resolvia. Agora a galeria percebe que há
miniatura faltando e desenha na hora.

Por baixo, os das cinco famílias antigas são o mesmo efeito — `FILTRO DE COR
(GALERIA)` — com curva,
corte de preto, fade, tonalização dividida, temperatura, proteção de pele,
micro-nitidez, grão e vinheta. Aplicou um e quer mexer? Está tudo aberto no
inspetor.

### Looks — o color engine

A família `LOOK` da galeria são cinco looks fotográficos que passam por uma
cadeia de cor completa, e não por um ajuste simples:

```
perfil de entrada → luz linear → look criativo → transform de saída
```

`L01 ANÁLOGO` · `L02 VIVO` · `L03 FERRUGEM` · `L04 RETRATO` · `L05 FAROL`

Cada um tem **força** própria — que interpola os parâmetros do look, não a
saída — e mais quatro ajustes: Exposição, Contraste, Cor e Tom.

O **perfil de entrada** diz o que os números do vídeo significam: sRGB,
Rec.709, Display P3, S-Log3, ARRI LogC3, Canon C-Log3, Blackmagic Film,
Apple Log, PQ e HLG. Isso importa: o mesmo look sobre um Rec.709 já convertido
e sobre um Log cru dá resultados diferentes, e sem declarar o perfil o segundo
sai errado.

Dá para exportar cada look como `.cube` de 33³ para usar em Resolve ou Premiere
(`VE.color.exportAllCubes()` no console). Grão e vinheta ficam de fora do LUT de
propósito — são ferramentas separadas.

Os cinco são uma **reconstrução independente**, classificada como
`RECONSTRUCTED`: nenhum parâmetro veio de software de terceiros. Detalhes,
tabelas e medições em [COLOR-ENGINE.md](COLOR-ENGINE.md).

### VHS — a fita, não o filtro de fita

O **VHS** não é um filtro de aparência: é a cadeia de uma gravação em fita,
escrita a partir do que o formato faz de errado. São vinte controles, em
quatro grupos.

**A imagem que a fita consegue guardar**

* **Resolução (linhas)** — quanto detalhe horizontal sobrevive. VHS real fica
  perto de **240**; abaixo de 120 o texto some, que é o que acontece na fita.
* **Suavidade** — a fita também é macia no vertical.
* **Realce do deck** — o aparelho tentava devolver a nitidez perdida e criava
  o **halo claro** na borda. É a assinatura do VHS, e é o controle que faz a
  imagem "parecer VHS" antes de qualquer sujeira.

**A cor, que é gravada à parte**

* **Atraso da cor (px)** — a cor chega DEPOIS da luz e por isso **escorre
  para a direita**. É o artefato mais característico do formato.
* **Sangramento da cor** — a cor tem muito menos banda que a luz: um vermelho
  saturado vaza por dezenas de pixels.
* **Franja de cor** — o halo colorido na borda entre duas cores.
* **Desvio de matiz** — o erro de fase, que gira a cor inteira.
* **Saturação**.

**A mecânica errando**

* **Erro de base de tempo** — cada linha entra num instante ligeiramente
  errado: a imagem treme **linha a linha**.
* **Ondulação** e **Frequência da onda** — a onda lenta ao longo da altura.
  Não confundir com a de cima: uma é áspera, a outra é lisa.
* **Salto vertical** — o quadro inteiro deslizando.
* **Vinco da fita** — a faixa estreita que empurra e clareia, de uma dobra.
* **Tracking (barras)** — a faixa que perde o sincronismo e vira ruído.
* **Troca de cabeça** — o rabo bagunçado nas últimas linhas, na base do
  quadro. Todo VHS tem, e é o detalhe que mais entrega o formato.

**A sujeira**

* **Perda de fita** — os riscos claros e curtos onde a fita perdeu contato.
* **Chuvisco**, **Cintilação** e **Linhas de varredura**.
* **Geração da cópia** — de 0 (a fita original) a 3 (a cópia da cópia da
  cópia): perde resolução, ganha ruído e riscos, e a cor vaza mais. Um
  controle só que envelhece o conjunto inteiro.

O preset **VHS 1994**, na galeria de filtros, é um ponto de partida ajustado.

### Película: 8 mm, Super 8, 16 mm, 35 mm

O grupo `película` reconstrói a câmera antiga inteira:

* **Janela da câmera** — o formato do quadro com o canto arredondado de cada
  bitola, sangria, perfuração lateral opcional, queda de luz nos cantos e tremor.
* **Vazamento de luz** — a luz entrando pelo chassi, em vermelho, laranja, amarelo
  e branco, com a borda respirando e pulsação.
* **Flash de rolo** — o estouro de começo e fim de rolo, em pulsos irregulares.
* **Grão por bitola** — 8 mm é grosso, 35 mm é fino. O tamanho do grão segue a área
  real do quadro.
* **Poeira e riscos** — cabelo na janela, poeira trocando a cada quadro e risco
  vertical de projetor.
* **Halação** — o vermelho que sangra em volta das altas luzes.
* **Tremor de janela** — a deriva lenta que só a película tem, com pulo de emenda.

E cinco **pacotes prontos** que montam a cadeia inteira já calibrada:
`8 MM CASEIRO` · `SUPER 8` · `16 MM DOCUMENTÁRIO` · `35 MM` · `PROJEÇÃO VELHA`,
mais `CHASSI ABERTO` (só os vazamentos, sem tocar na imagem).

> Nota: **32 mm não existe** como bitola de captação. As bitolas reais são
> 8 mm, Super 8, 16 mm e 35 mm — é o que está implementado.

### ASCII e transparência
O efeito ASCII tem 14 conjuntos de caracteres (inclusive personalizado, com
ordenação automática por densidade de tinta), 8 modos de cor, controle de célula,
proporção, fonte, gama, ponto preto/branco e fundo.

**REMOVER FUNDO (ALPHA)** transforma branco, preto, uma rampa de brilho ou uma
cor específica em transparência, com limiar e suavidade de borda. Cinza vira
alpha intermediário — não é chroma key. A transparência é real no canvas (fundo
xadrez) e sai preservada em **PNG** e em **sequência PNG (.zip)**. MP4 e WEBM não
guardam alpha; para esses o inspetor de exportação oferece achatar sobre uma cor.

### Composição por camadas

Um clipe de vídeo não é só uma imagem posta em cima de outra: é uma **camada de
composição**, com tudo o que a palavra carrega. As seções aparecem na coluna da
direita quando o clipe está selecionado, todas recolhidas — quem só quer cortar
dois planos não vê nada disso.

**COMPOSIÇÃO** · 27 modos de mistura em seis grupos, cada um com uma miniatura
mostrando o que ele faz. Os três que resolvem quase tudo: **multiplicar** (o
branco de cima some — sombra, textura, sujeira), **tela** (o preto de cima some
— luz, fogo, vazamento) e **diferença** (onde as duas são iguais fica preto).

Aqui também estão **opacidade** e **preenchimento**, que parecem a mesma coisa e
não são: opacidade tira a camada da frente, preenchimento mantém a camada
inteira e diminui a **conversa** dela com o fundo. Em modo normal os dois fazem
o mesmo; em multiplicar são resultados diferentes.

E o **espaço de cálculo**: perceptivo (como o Photoshop) ou luz linear (como a
física). Em luz linear, somar e tela se comportam como luz de verdade — dois
faróis somados dão o dobro de luz, não o dobro de número.

**MÁSCARAS DA CAMADA** · até oito por camada, em sete formas — retângulo,
elipse, polígono, faixa horizontal, faixa vertical, rampa e rampa radial. Elas
se **somam**, se **subtraem**, se **intersectam** ou ficam na **diferença**.
Suavidade derrete a borda; expandir engorda ou corrói a forma sem redesenhá-la;
inverter troca o dentro pelo fora. Tudo animável.

**MATTE DE FAIXA** · uma camada empresta a silhueta para outra. Ela some da
imagem e vira molde: onde é branca a outra aparece, onde é preta some. É como
se faz letra preenchida com vídeo e imagem revelada por uma mancha.

**COR DA CAMADA** · exposição em paradas, contraste, gama, níveis de entrada e
saída, matiz, saturação, vibração, temperatura, tinte e as quatro zonas de tom
(altas luzes, sombras, brancos, pretos). Vale só para aquela camada.

**CANAIS** · cada saída R, G ou B é uma soma das três entradas, mais um valor
somado e a inversão. Atalhos prontos para trocar canais, cinza, sépia e
negativo. E o **deslocamento cromático**, que afasta vermelho e azul em
direções opostas — a aberração de lente, o RGB split.

**FAIXA DE MESCLA** · a ferramenta que ninguém conhece e que resolve mais que
todas. Em vez de recortar por lugar, recorta por **tom**: "some onde esta
camada for escura", "só apareça onde o fundo for claro". É o caminho mais
rápido para tirar um céu branco, casar uma textura com a pele sem parecer
adesivo, e fazer dupla exposição — sem contornar nada com o mouse.

**Nada disso custa nada quando não é usado.** Uma camada em estado neutro
atravessa o motor numa passada só, igual a antes de tudo isto existir.

### Arrastar além da borda

Levando um clipe para perto da beirada da linha do tempo, ela **anda sozinha** na
direção em que você está indo — e quanto mais fundo na beirada, mais rápido. Vale
nos dois eixos: para o lado, para levar no tempo; para cima e para baixo, para
alcançar uma pista que está fora da tela. Solta, para.

### Exportação
* **Tempo real** — grava tocando, mantém o áudio
* **Frame a frame** — renderiza cada frame com precisão, sem áudio
* **Sequência PNG** — um PNG por frame com alpha, entregue num `.zip`
* **PNG** do frame atual, a qualquer momento

---

## 02 · LABORATÓRIO DE ÁUDIO

> É o **mesmo laboratório de sempre** — a mesma onda, a mesma barra de
> transporte, o mesmo rack, a mesma coluna. Nada mudou de lugar. O que
> mudou é o que ele consegue fazer.

Carrega arquivo, grava o **microfone**, gera um tom de teste ou puxa o áudio
de um vídeo já carregado no laboratório 01. Arrastar arquivo para dentro
também funciona.

Arrastar na onda seleciona um trecho; `CORTAR NA SELEÇÃO` apara. Toda a
cadeia é reprocessada a partir do **áudio original**, sempre — nada é
destrutivo até você cortar.

### O rack: 34 módulos em onze famílias

O rack cresceu de doze para **trinta e quatro módulos**, e por isso ganhou um
filtro por família e uma busca. Continua sendo um cartão por módulo, com o
interruptor no cabeçalho e os controles embaixo.

| família | módulos |
|---|---|
| **BASE** | os doze de sempre: velocidade & tom, reverso, filtro, distorção, bitcrush, atraso, reverberação, granular, gagueira, modulação, ruído, saída |
| **ATMOSFERA** | `ATMOSFERA` — doze espaços: ar · névoa · sonho · subaquático · distante · catedral · infinito · vazio · sala · caverna · túnel · espaço |
| **DEFORMAÇÃO** | `TEMPO ELÁSTICO` · `FITA` · `DERIVA DE TOM` · `DERRETER` · `MICRO-LOOP` |
| **GLITCH** | `FALHA DIGITAL` (perda de pacote, congelamento, salto, corrupção, rajada) · `PICOTE` |
| **MATÉRIA** | `MATÉRIA` — onze materiais: metal · vidro · pedra · papel · plástico · líquido · areia · fumaça · borracha · madeira · gelo |
| **ESPACIAL** | `ESPACIAL` — órbita · doppler · espiral · deriva estéreo · distância · largura · rotação · **`ÓRBITA 3D (HRTF)`** |
| **PSICOACÚSTICA** | `PSICOACÚSTICA` — binaural · Haas · centro fantasma · Shepard · deslocamento de frequência · fase invertida · desorientação |
| **GRANULAR** | `GRANULAR (LABORATÓRIO)` — motor completo, catorze controles |
| **ESPECTRAL** | `ESPECTRAL` — congelar · borrar · desfocar · esticar · deslocar · porta · filtrar · moldar · congelar faixa · só harmônicos · só ruído |
| **GENERATIVO** | `CAOS / GENERATIVO` — o sistema decide sozinho, por semente |
| **VOZ** | `TOM E CORPO` · `MULTIPLICAR` · `VOCODER` · `SUSSURRO` · `TELEFONE` · `RÁDIO` · `CORO DE UM SÓ` |

**Nenhum controle é decorativo.** Os 82 parâmetros dos módulos novos foram
testados um a um: mover qualquer um deles muda o áudio que sai. Cinco só
valem em certos modos (o deslocamento só existe em DESLOCAR, por exemplo) —
esses simplesmente não aparecem quando não valem.

### A FAMÍLIA VOZ — sete módulos para o que foi falado

O microfone já gravava; o que faltava era o rack saber o que fazer com uma voz.
Sete módulos, na mesma lista dos outros, filtrados pela família **voz**.

**TOM E CORPO** — os dois gestos que a voz pede, separados um do outro.

O *Tom* sobe ou desce sem a fala acelerar. O *Corpo do timbre* é outra coisa:
é o tamanho aparente da boca e da garganta, e é ele que faz uma voz soar de
pessoa grande ou pequena. Mexer nos dois juntos, do jeito que uma fita
acelerada faz, é o que produz voz de desenho animado.

Por isso existe o **Guardar o corpo ao mudar o tom**, que vem ligado: com ele,
uma oitava acima continua sendo a MESMA pessoa cantando agudo. Desligue para
ter o efeito de fita, que às vezes é justamente o que se quer.

E dá para andar só com o corpo, deixando a nota parada: é como se troca a
pessoa sem trocar a melodia.

**MULTIPLICAR** — a mesma voz por 2, 3, 5, 9, 12 ou 16 pessoas.

Não é eco nem cópia: cada voz entra num instante próprio, desafina por conta e
ocupa um lugar entre as caixas. É a soma dessas três diferenças que o ouvido lê
como "várias pessoas" em vez de "uma voz com reverberação".

- **Desafinação** em cents — é o controle que mais decide se soa a coro ou a
  duplicata. Em zero, doze vozes soam como uma.
- **Espalhar no tempo** — o quanto as entradas se atrasam entre si.
- **Corpos diferentes** — dá timbres distintos aos naipes, para não parecer a
  mesma garganta repetida. Custa duas passadas, não doze, seja qual for o
  número de vozes.
- A primeira voz fica no centro e sem atraso: é a âncora que impede o conjunto
  de soar deslocado do resto da mistura.

**VOCODER** — a voz manda no timbre de outra coisa. A nota que sai é a da
*portadora* (serra, pulso de glote, ruído, sopro, ou o próprio som), e o que a
voz faz é modelar essa nota banda por banda. O **Sopro** é o que devolve as
consoantes: sem ele o vocoder canta bonito e não se entende.

**SUSSURRO** — sussurrar não é falar baixo, é falar sem a prega vocal. A boca
continua fazendo tudo — os formantes, as consoantes — e o que era nota virou ar.
*Perto do ouvido* acrescenta o realce que a boca colada no microfone produz.

**TELEFONE** — a banda estreita da linha, o pico da cápsula, o aperto da
compressão, a sujeira do codec, o chiado e, se quiser, as quedas de sinal do
celular.

**RÁDIO** — a estação quase sintonizada. A estática ANDA em vez de ficar
parada, que é o que faz a estação parecer distante em vez de suja. Tem assobio
heterodino e oscilação de força.

**CORO DE UM SÓ** — uma frase falada vira naipe: cada voz num grau do acorde
(oitavas, quintas, maior, menor, com sétima, suspenso, ou o naipe inteiro de
sete vozes). O corpo de cada voz é corrigido para o intervalo, senão o baixo
sai como fita lenta e o soprano como desenho animado.

**Sobre a espera.** Estes módulos processam o buffer inteiro, e os que mudam
tom são os mais caros do rack junto com o ESPECTRAL. Numa frase de dez segundos
é imperceptível. Num arquivo de três minutos com MULTIPLICAR em doze vozes, a
espera passa de um minuto — o aviso PROCESSANDO aparece, mas vale cortar o
trecho antes de experimentar.

### A conta pesada acontece fora da linha principal

ESPECTRAL, GRANULAR e os sete módulos de VOZ custam caro: num arquivo de três
minutos são dezenas de segundos de conta. Isso é calculado **fora** da página,
num trabalhador — e a diferença aparece de duas formas:

* **a aba continua respondendo.** Você pode rolar o rack, abrir outro módulo,
  ler a onda. Medido: a maior espera da página caiu de 2,6 segundos para
  30 milésimos num CORO DE UM SÓ.
* **mexer num controle no meio da conta não espera o cálculo velho.** Ele é
  jogado fora na hora e o novo começa.

Enquanto calcula, a linha de informação diz em que módulo está —
`PROCESSANDO · ESPECTRAL (1 de 2)` — e volta ao normal no fim.

O som é exatamente o mesmo: é a mesma biblioteca, o mesmo código, só que
rodando ao lado. Se o navegador não deixar (abrir o arquivo direto do disco,
sem servidor, por exemplo), o laboratório calcula do jeito antigo, na página, e
nada muda a não ser a espera.

### A ordem do rack é a ordem da cadeia

Antes a ordem de processamento estava escrita no código: reverso, depois
bitcrush, depois granular, sempre nessa sequência. Agora **a lista de
módulos é a cadeia**, e cada cartão tem `↑ ↓` para subir e descer. Granular
antes da distorção soa diferente de granular depois — e agora dá para
escolher.

Cada cartão tem também `⧉` para **duplicar** (o sinal passa duas vezes pelo
mesmo módulo, com valores diferentes) e o interruptor de sempre para
**ignorar** sem perder os ajustes.

O bloco **CADEIA**, na coluna da esquerda, mostra o caminho do sinal na
ordem real. Clicar num passo leva ao cartão dele no rack.

Por baixo, a cadeia é quebrada em trechos: os módulos que trabalham no
buffer (granular, espectral, glitch, tempo) e os que entram no grafo do Web
Audio (filtro, distorção, atraso, convolução). Cada trecho é processado
inteiro antes do seguinte, então intercalar os dois tipos custa mais — o
indicador `PROCESSANDO` aparece quando a conta é longa.

### ÓRBITA 3D — o som com lugar no espaço

O módulo `ESPACIAL` põe a fonte à esquerda ou à direita: é panorâmica com
atraso entre os ouvidos, e resolve só o eixo horizontal.

`ÓRBITA 3D (HRTF)` é outra coisa. A fonte tem **posição** — x, y e z — e o
navegador aplica HRTF: o mesmo filtro que o seu crânio, as suas orelhas e os
seus ombros aplicam ao som antes de ele chegar ao tímpano. É isso que permite
ao ouvido distinguir **frente de trás** e **acima de abaixo**, coisa que
panorâmica nenhuma consegue.

Medido: com a fonte à frente e atrás, o balanço entre os canais é idêntico
(zero nos dois) — mas o espectro é diferente. É o filtro da orelha trabalhando.

Oito trajetos: **círculo** · **espiral** (sobe enquanto gira) · **oito** ·
**vaivém** · **elevação** · **aproximar e afastar** · **sobrevoo** (passa por
cima) · **sorteada**. Mais raio, altura, empurrão para frente, perda com a
distância, absorção do ar e ponto de partida.

O **doppler** é feito por atraso variável, não por um controle inventado: o
atraso de propagação é distância ÷ 343 m/s, e encurtá-lo enquanto a fonte se
aproxima comprime as ondas e sobe o tom. Num tom de 440 Hz indo e voltando, a
frequência medida faz 393 → 382 → 404 → 447 → 490 → 501 → 485 Hz.

> Repare que no trajeto **círculo** o doppler dá zero — e está certo: numa
> órbita perfeita a distância até você não muda. Empurre a órbita para frente
> e ele aparece.

**Use fone de ouvido.** Em caixas o HRTF perde quase todo o efeito, porque o
som de cada caixa chega aos dois ouvidos. Os presets do grupo **ESPAÇO** —
`ÓRBITA`, `SOBREVOO` e `DENTRO DA CABEÇA` — foram feitos para fone.

### O menu dentro do módulo

Vários módulos são **um efeito com um menu de variações dentro**. O primeiro
controle do cartão é esse menu, e ele ocupa a linha inteira:

| módulo | o menu tem |
|---|---|
| `ATMOSFERA` | 12 espaços — ar, névoa, sonho, subaquático, distante, catedral, infinito, vazio, sala, caverna, túnel, espaço |
| `MATÉRIA` | 11 materiais — metal, vidro, pedra, papel, plástico, líquido, areia, fumaça, borracha, madeira, gelo |
| `ESPECTRAL` | 11 operações — congelar, borrar, desfocar, esticar, deslocar, porta, filtrar, moldar, congelar faixa, só harmônicos, só ruído |
| `ÓRBITA 3D` | 8 trajetos |
| `ESPACIAL` | 7 movimentos |
| `PSICOACÚSTICA` | 7 ilusões |
| `FALHA DIGITAL` | 6 tipos de falha |

Por isso o chip da família diz `atmosfera 1`: é um módulo, com doze coisas
dentro. Abaixo do menu, o cartão avisa quantas opções ele tem.

### O que é SEMENTE

Alguns módulos sorteiam — onde cai cada grão, quais blocos falham, para onde a
fonte pula. A **semente** é o número que comanda esse sorteio.

Trocar o número dá um resultado diferente. **Voltar ao número devolve o mesmo
som, idêntico.** Nada aqui usa sorteio de verdade, justamente para que um
achado não se perca — e é isso que faz o `↶` do MUTAR poder desfazer.

### MUTAR e travar

`SUTIL` · `MÉDIO` · `EXTREMO` sorteiam valores novos para os parâmetros dos
módulos ligados. `↶` desfaz a última mutação.

O `▪` ao lado de cada controle **trava** aquele parâmetro: ele não muda na
mutação. É assim que se explora — trava a reverberação e o tom, deixa grão,
atraso e filtro mutarem, e vai clicando até achar.

A **semente** manda em tudo: mesma semente + mesma cadeia = exatamente o
mesmo resultado. Nada usa `Math.random`, então um som que você achou não se
perde ao mexer noutro controle.

### A · original × B · processado

Na barra de transporte, `A` toca o áudio **como entrou** e `B` o áudio
**depois da cadeia**. Trocar não desfaz nada e não interrompe o trabalho — a
onda desenhada acompanha o que está sendo ouvido.

### Quatro leituras no analisador

O seletor no fim da barra de transporte troca o que o analisador mostra:

* **ESPECTRO** — barras por faixa, como antes;
* **ESPECTROGRAMA** — o espectro rolando no tempo, como uma esteira;
* **MEDIDORES** — pico e RMS em dB, com retenção de pico e aviso nos
  últimos 3 dB;
* **OSCILOSCÓPIO** — a forma de onda instantânea.

Todos lêem o mesmo analisador do grafo: não há segunda cadeia de áudio.

### Presets artísticos

Vinte e seis cadeias prontas, na mesma caixa PRESETS de sempre, acima das
suas: **CINEMÁTICO** (espaço de sonho, sala escura, salão infinito, memória
distante), **EXPERIMENTAL** (colapso digital, fantasma espectral, máquina
líquida, memória quebrada, tempestade de dados), **GLITCH** (corrupção VHS,
falha de buffer, poeira digital, sinal quebrado), **TEXTURA** (vidro, metal,
fumaça, líquido, pedra) e **VIDEOARTE** (dissolução lenta, memória,
fragmentação, colapso temporal, quadro fantasma).

Cada um é uma cadeia de módulos reais, com ordem própria. Aplicar reordena o
rack e deixa tudo aberto para você mexer. Salvar a sua cadeia guarda também
a ordem e o que está travado.

### ÁUDIO REATIVO — o som mexendo na imagem

Esta é a ponte entre os dois laboratórios, e ela **não é uma janela nova**:
mora na ficha do clipe, no laboratório de vídeo, como mais uma placa.

Com um clipe selecionado no LAB 01, a placa **ÁUDIO REATIVO** permite ligar
uma faixa do som a uma propriedade daquele clipe:

```
NÍVEL · RMS · PICO · GRAVE · MÉDIO · AGUDO · TRANSIENTE
   →  escala · posição X · posição Y · rotação · opacidade
   →  intensidade de qualquer efeito da pilha
   →  QUALQUER parâmetro de QUALQUER efeito da pilha
```

Com o efeito ESTRELAS DE LUZ na pilha, por exemplo, os destinos incluem o
limiar, o comprimento, a difração e o giro — grave no comprimento da
estrela, agudo na difração, transiente na intensidade.

Cada mapeamento tem **quanto mexe** (pode ser negativo), **curva** (linear,
suave, só o topo, só o começo, invertida) e **suavidade** — com ataque
rápido e queda lenta, que é como o olho lê uma batida.

O valor é **somado na leitura**, não escrito no clipe: o que você ajustou à
mão continua valendo, nenhum keyframe é criado, e desligar o mapeamento
devolve a imagem exatamente como estava.

Para usar: carregue um áudio no LAB 02, deixe tocando, vá para o LAB 01. O
analisador continua correndo em segundo plano.

---

## 03 · LABORATÓRIO DE TIPOGRAFIA

Cada letra é um objeto com posição, rotação, escala e cor próprias. Clique numa
letra na tira inferior (ou na tela) para editar só ela.

### Famílias próprias, desenhadas por código

Além das fontes do sistema, existem **12 famílias LAB** que não são arquivo de
fonte: são desenhadas por código. Cada glifo é um **esqueleto de traço**, e a
família nasce de parâmetros aplicados sobre ele — peso, largura, inclinação,
ponta, junta, vazado, recorte de estêncil, quantização em grade, tremor.

`LAB GROTESK` · `LAB ROUND` · `LAB WIDE` · `LAB NARROW` · `LAB HAIRLINE` ·
`LAB OBLIQUE` · `LAB STENCIL` · `LAB BITMAP` · `LAB HOLLOW` ·
`LAB SCRIPT` · `LAB MARKER` · `LAB BRUSH`

Duas consequências: são originais do laboratório (nada foi decalcado de fonte de
terceiros) e, por serem traço com começo e fim, **podem ser escritas na tela**.

### Animação

A animação de texto tem **três camadas independentes que se somam**, do jeito
que se espera de um editor de vídeo:

```
ENTRADA   como cada letra chega ao lugar
LAÇO      o que ela faz enquanto está lá
SAÍDA     como ela vai embora
```

**ENTRADA — 19 modos.** salto (mola) · giro · estouro · subir do rodapé ·
aparecer · cair do topo · deslizar da esquerda · deslizar da direita · sair do
desfoque · máquina de escrever · cortina de baixo · virar no eixo vertical ·
elástico · persiana · cascata · rolar · espremer · chegar tremendo · desenrolar.

**LAÇO — 10 modos.** onda · tremor · pulso · piscar · arco-íris (o matiz corre
pelas letras) · flutuar · respirar · neon (falha como letreiro velho) · letreiro
(atravessa o quadro) · balançar.

**SAÍDA — 11 modos.** sumir · cair · subir · encolher · explodir · entrar no
desfoque · deslizar para a esquerda · deslizar para a direita · girar e sumir ·
cortina para cima · apagar letra a letra.

**A ORDEM decide quem entra primeiro:** da esquerda, da direita, do meio para
fora, das pontas para o meio ou sorteada. Junto com o *atraso entre letras*, é
o que faz uma mesma entrada parecer três animações diferentes.

Cada camada tem duração, atraso entre letras e alcance próprios. A **duração da
peça** governa quando a saída começa — ela acontece nos últimos segundos.

**Escrita à mão** é outra coisa e continua existindo: desenha a letra do começo
ao fim do traço, com a ponta da caneta acompanhando. Junto vêm `MARCADOR`
(ponta grossa), `PINCEL` (o traço engrossa no meio, como pressão de mão),
`MÁQUINA` (uma letra por vez, seca) e `DESMONTE` (o traço se apaga). Essas
quatro só funcionam nas famílias `LAB`, desenhadas por código — escolher uma
delas troca a família sozinha e avisa.

São **54 ferramentas**, separadas na coluna em dois grupos, com busca:

* **FORMA · desenho da letra** (12) — base · onda · explosão · escada · rastro ·
  contorno · corte · rgb · pilha · espelho · peso · ímã
* **ANIMAÇÃO · a letra no tempo** (42) — as cinco de traço, as nove antigas de
  entrada, mais as entradas, laços e saídas novos, e quatro **combinações
  prontas**: `TÍTULO` (entra do desfoque, respira, some), `LEGENDA` (datilografa
  e apaga), `IMPACTO` (estoura, treme e explode) e `CARTAZ` (persiana,
  arco-íris e cortina).

Controles: fonte, corpo com ajuste automático ao quadro, peso, entreletra,
entrelinha, alinhamento, caixa, onda (altura/frequência/velocidade), rotação e
escala por letra, bagunça com semente, repetição em fuga, contorno, fatias,
separação RGB, sombra, três modos de cor e fundo transparente.

Desfoque e giro de matiz por letra usam o filtro do canvas. Onde ele não
existir, as animações continuam funcionando — só sem esses dois.

### LETRAS RECORTADAS — cada letra é um pedaço de papel

O botão **RECORTE** põe uma folha por cima do palco. Não é uma fonte: cada letra
sorteia o próprio tipo, papel, tinta, textura, tamanho, giro e o corte da borda,
a partir de uma semente que fica guardada. Dois "A" na mesma palavra saem
diferentes, e é isso que faz parecer revista cortada com tesoura.

O gesto que manda é **clicar numa letra e arrastar**. Quem foi movido fica
preso, e o botão SORTEAR não o joga de volta para a linha. **Shift** arrastando
gira; **duplo clique** re-sorteia só aquela letra; **ENDIREITAR** devolve todas.

**A animação tem dois relógios, e eles são separados.** Um animador de papel
treme depressa e troca o recorte devagar — se os dois andassem no mesmo número,
isso seria impossível:

* **Troca o recorte** — quantas vezes por segundo a letra vira outro pedaço de
  papel. É o que dá o pisca do stop motion.
* **Treme** — quantas vezes por segundo ela se remexe. Junto vem **o tamanho do
  tremor**, em pixels.

Os dois números estão escritos na tela em **passos por segundo**, que é a
unidade que o olho entende: 12/s é a cadência clássica da animação de papel
feita à mão, 24/s ou mais já parece vídeo, 3/s é aquele pisca duro de colagem.

**Seis estilos**, que são combinações dessas duas colunas:

| estilo | troca | treme | como se lê |
|---|:--:|:--:|---|
| **CAOS** | · | · | salta nos dois — a colagem inquieta |
| **STOP MOTION** | | · | o recorte fica, a letra se remexe |
| **PULSO** | · | | troca sem tremer |
| **PARADO** | | | fica quieta |
| **LISO** | | · | **desliza** — o mesmo tremor, caminhado entre um passo e o seguinte em vez de saltado |
| **CAOS LISO** | · | · | troca o recorte (papel só pode saltar) e desliza |

**LISO é para quem espera movimento de vídeo.** Stop motion continua sendo o
padrão, porque é o que o material pede; o que faltava era poder escolher.

**Dessincronizar** dá a cada letra um relógio próprio. Em compasso parece
máquina; fora de compasso parece mão.

O trilho que o estilo escolhido não usa fica **apagado e desligado** — em PULSO
não há tremor para ajustar, em STOP MOTION não há troca.

**ANIMAR** mostra o resultado na folha; **ENVIAR PRA TIMELINE** leva uma cópia
própria dos ajustes, então mexer no laboratório depois não muda o que já foi.

### Saída — no rodapé da coluna, sempre visível

O bloco **SAÍDA** fica preso no pé da coluna da esquerda, com a barra vermelha do
canal. Ele não rola junto com as ferramentas: está sempre lá. São dois caminhos.

**PARA A COMPOSIÇÃO**

* **`ENVIAR PRA TIMELINE ↗`** — leva o texto para o laboratório de vídeo. Ele
  entra **no instante em que o cursor está**, na pista de vídeo mais alta que
  estiver livre — ou seja, **por cima do vídeo**, não atrás. Vira um clipe
  `TYPE_001`, `TYPE_002`… vermelho na linha do tempo, desenhado sem fundo.
  O aviso diz em que tempo e em que pista ele caiu.

**SALVAR ARQUIVO**

* **`PNG α`** — o quadro atual, com fundo transparente
* **`SEQUÊNCIA α`** — a animação inteira, um PNG por quadro, num `.zip`
* **`SVG`** — vetor; usa a fonte instalada na máquina de quem abrir

O fundo que você vê no painel existe **só para enxergar** enquanto trabalha.
Ele nunca vai junto: as três saídas de imagem são sempre com alpha.

---

## Presets

`+ SALVAR CADEIA`, na aba `04 PRESETS`, guarda a **pilha de efeitos** do clipe
selecionado; dentro de cada efeito dá pra salvar só os parâmetros dele; o áudio
salva a cadeia de módulos; a tipografia salva o estado completo com as letras.
Tudo fica no navegador, numerado `PRESET_001`, `PRESET_002`…

Os **49 estilos prontos** têm aba própria (`03 ESTILOS`), com busca e o número de
efeitos de cada cadeia à direita. Antes ficavam misturados aos presets salvos numa
lista só.

---

## Atalhos

**Tempo**
`ESPAÇO` tocar/pausar · `←` `→` um frame (com `Shift`, 1 segundo) ·
`↑` `↓` corte anterior/seguinte · `Home` `End` início/fim

**Edição**
`S` cortar no cursor · `Del` apagar · `Shift+Del` apagar e fechar o buraco ·
`Ctrl+D` duplicar · `Ctrl+C` `Ctrl+V` copiar e colar · `Ctrl+A` selecionar tudo ·
`Ctrl+G` virar composição · `Esc` limpar seleção ·
`Shift+clique` seleção múltipla · `Ctrl+arrastar` duplica ·
`Alt` ao aparar faz ripple

**Marcação**
`M` marcador · `I` entrada · `O` saída

**No laboratório de áudio**
`ESPAÇO` tocar/pausar · `Home` voltar ao início · `Esc` parar

**Histórico**
`Ctrl+Z` desfazer · `Ctrl+Shift+Z` (ou `Ctrl+Y`) refazer · `Ctrl+S` salvar projeto

**Zoom**
`+` `−` zoom da linha do tempo · `\` enquadrar a sequência ·
`F` enquadrar a prévia · `0` prévia em 100% ·
`Ctrl`+roda zoom no cursor · `Shift`+roda rolagem horizontal ·
`ESPAÇO`+arrastar move a tela

---

## Arquivos

```
index.html                    casca: entrada, boot, índice, três laboratórios
css/system.css                tokens, primitivas, casca, cursor, modais, marca
js/brand.js                   nome e etiquetas da marca
assets/logo.png               marca recortada (também embutida no css)
css/labs.css                  viewport, timeline, rack de áudio, mesa de tipo
js/fx.js  fx2.js  fx3.js      catálogo de efeitos (GLSL) e estilos prontos
js/fx4.js                     efeitos das referências: lego, gravura, cianotipia…
js/fx5.js                     película: janela 8/S8/16/35mm, vazamento, grão, filtro
js/transitions.js             curvas de keyframe + 30 transições (família MOTION)
js/typefaces.js               12 famílias tipográficas desenhadas por código
js/gl.js                      motor WebGL2: plano de composição, cadeia por clipe
js/state.js                   modelo de edição não linear (pistas, clipes, keys)
js/media.js                   fontes, geometria de MOTION, plano para a GPU
js/view.js                    viewport: zoom, pan, fit, réguas
js/timeline.js                a mesa de edição
js/panels.js                  catálogo, ficha da composição, máscara na prévia
js/motion.js                  MOTION, Effect Controls, gráficos, caixa na prévia
js/filters.js                 galeria de filtros com miniatura ao vivo
js/presets.js                 presets
js/exporter.js                exportação (vídeo, sequência PNG, zip)
js/audio.js                   laboratório de áudio
js/audiotrab.js               o trabalhador: a cadeia calculada fora da linha principal
js/type.js                    laboratório de tipografia
js/shell.js                   entrada ascii, boot, roteamento, cursor, status
js/app.js                     controlador do laboratório de vídeo
server.js                     servidor local sem dependências
build-arquivo-unico.js        gera a versão de arquivo único
```

## Manual 01 — como fazer uma videoarte

No índice, o **MANUAL 01** fica na coluna da esquerda, logo abaixo das listas de laboratórios e arquivo: um tutorial em duas partes. A primeira
é método — tema, referências externas, material, a poética que cruza os três, e
por que a montagem é onde o sentido é decidido. A segunda é execução, etapa por
etapa dentro do laboratório, com a cor do canal dizendo em qual mesa cada passo
acontece. Fecha com um roteiro de exercício de 60 segundos.

---

### Criar um efeito novo

Em `js/fx3.js` ou `js/fx5.js`, copie um bloco `D({...})`: declare os parâmetros (viram controles
automaticamente) e escreva `vec3 fx(vec2 uv)` — ou `vec4 fx4(vec2 uv)` com
`alpha: true` se o efeito mexer na transparência. Máscara, intensidade, fades e
keyframes vêm de graça: o framework aplica
`mix(original, seu_efeito, intensidade × máscara)`.
