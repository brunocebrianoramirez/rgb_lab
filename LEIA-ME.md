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
texto vindo do laboratório de tipografia, áudio, uma carta de teste procedural
e o **SCANNER** — a mesa de digitalização, que grava matéria nova em vez de
tratar a que já existe (tem seção própria mais abaixo).
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

**Zoom e navegação.** Embaixo da mesa há uma **barra de zoom** igual à da
Premiere: o bloco cinza é o pedaço da sequência que está na tela. Arraste o
**meio** para navegar, as **pontas** para aproximar ou afastar (a ponta que você
não está puxando fica parada), clique no trilho vazio para levar a janela até
lá, dê **duplo clique** para enquadrar tudo.

Pelo teclado: `+` `−` dão zoom, `\` enquadra a sequência, `Shift+\` enquadra o
que está selecionado. `Ctrl`+roda ou `Alt`+roda aproximam no cursor. Os botões
`−` `+` `FIT` `SEL` na barra de cima fazem o mesmo.

Todo zoom tem **âncora**: o instante embaixo do cursor — ou o ponteiro de
reprodução, quando é pelo teclado — fica parado no mesmo lugar da tela. Sem
isso, cada passo de zoom jogaria o trecho que você está olhando para fora da
janela. O rótulo à direita diz quantos segundos cabem na tela.

`↑` `↓` pulam de corte em corte. Rolagem horizontal e vertical independentes.
O ímã encaixa em bordas de clipe, cursor, marcadores e keyframes.

**Estado do clipe** aparece em indicadores pequenos no próprio clipe: `fx3`
(três efeitos), `◆` (tem keyframe), `⇥` (tem transição), `▪` (travado),
`×` (desligado), `M` (mudo), `▦` (composição).

**Composições.** `Ctrl+G` transforma a seleção numa composição aninhada, que entra
na sequência como um clipe só. Os originais continuam vivos lá dentro.

### Efeitos (150), em oito famílias

O catálogo cresceu e deixou de ser uma lista de categorias soltas. Agora são
**oito famílias**, e cada uma é uma maneira diferente de tratar a imagem:

| | família | o que é | quantos |
|---|---|---|---|
| 01 | **COR / MATÉRIA** | o que a cor é, e o que sobra quando ela vai | 37 |
| 02 | **TEMPO** | o quadro como janela sobre vários instantes | 13 |
| 03 | **ESPAÇO / DISTORÇÃO** | a imagem como superfície deformável | 23 |
| 04 | **GLITCH** | mecanismos de falha, digitais e analógicos | 18 |
| 05 | **PIXEL / DIGITAL** | a imagem como grade de valores discretos | 16 |
| 06 | **PINTURA / MATERIALIDADE** | comportamentos de pigmento e de impressão | 17 |
| 07 | **PERCEPÇÃO** | ver o que o olho não vê: borda, calor, relevo | 15 |
| 08 | **INSTRUMENTOS** | não são filtros: são máquinas de videoarte | 11 |

Cada família tem cor própria, e essa cor aparece no filete de cada item da
lista — o catálogo inteiro lê como um sistema em vez de 150 cores soltas.

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
* **GRAVURA / HACHURA (a de dois tons)** — a imagem vira um desenho de
  duas cores de três jeitos: **LINHAS** paralelas que engordam na sombra,
  uma **ESPIRAL** cuja espessura segue a sombra (contida num disco sobre a
  página branca, ou solta pelo quadro), ou uma retícula de **PONTOS** que
  crescem na sombra — em círculo, coração, triângulo, faísca, estrela,
  quadrado ou confete. Quantidade, ângulo, tamanho mínimo e máximo,
  claridade, contraste, inverter, 31 paletas de dois tons ("Ciano e
  ameixa" é a de fábrica; "Para colorir" desenha só o contorno) e a
  personalizada com Tinta e Papel. **Hastes suaves (fuso)** faz a largura
  variar devagar ao longo da haste (numa fonte de borda dura ela saltaria em
  degrau) — é o desenho de código de barras em fuso. A hachura cruzada de
  antes continua como o quarto desenho. Estilos prontos: GRAVURA (a
  hachura), ESPIRAL e RETÍCULA.

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

### As barras horizontais dobram — nenhum botão some

Alargar as colunas laterais espreme o miolo, e as barras horizontais que moram
nele (viewport, transporte, linha do tempo) simplesmente **cortavam** o que não
coubesse. Não era só nas larguras extremas: com as colunas no padrão, num
monitor de 1440px, a barra do viewport já perdia `PNG` e `EXPORTAR`, e a da
linha do tempo perdia 248px — o grupo de zoom inteiro.

Agora essas barras **dobram numa fileira a mais** em vez de esconder. Arraste a
coluna até onde quiser: a barra vira duas, três, sete fileiras, e todo botão
continua clicável. Medido nas duas colunas em 600px cada: 65 controles nas três
barras, **zero fora da tela**.

A linha do tempo cresce junto. A altura que você arrastou continua sendo a
altura das PISTAS; as fileiras que a barra ganhou entram por fora dela. Sem
isso, o botão não sumiria mas a mesa sumiria embaixo dele, que é a mesma
reclamação com outro nome.

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

Uma coisa importante: **os ajustes são em unidades de fita, não de tela.** A
régua é 720 amostras por linha e 480 linhas, que é o que uma fita guarda. O
mesmo ajuste dá a mesma fita numa prévia pequena e num quadro de 4K — foi
medido em três tamanhos, e a cor cai sempre a 2,5% da largura.

**A imagem que a fita consegue guardar**

* **Resolução (linhas)** — quanto detalhe horizontal sobrevive. VHS real fica
  perto de **240**; abaixo de 120 o texto some, que é o que acontece na fita.
* **Suavidade** — a fita também é macia no vertical.
* **Realce do deck** — o aparelho tentava devolver a nitidez perdida e criava
  o **halo claro** na borda. É a assinatura do VHS, e é o controle que faz a
  imagem "parecer VHS" antes de qualquer sujeira.
* **Rabo de luz** — o borrão que um objeto claro deixa **à direita**, porque o
  amplificador da cabeça não acompanha o degrau. Só para a direita: é o que
  faz um rosto claro deixar rastro no fundo escuro.

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
  quadro. Todo VHS tem.
* **Borda rasgada** — a fita não guarda a mesma largura em todas as linhas, e
  o que aparece nas beiradas é a **beira da fita**: preto com sujeira de cor,
  em dentes irregulares dos dois lados. Quase toda linha mostra um fio e uma
  em cada dez mostra um dente longo. Junto com o atraso da cor, é o detalhe
  que mais entrega o formato — e repare que **o miolo continua firme**: a
  beira é irregular sozinha, sem sacudir a imagem.

**A sujeira**

* **Perda de fita** — os riscos curtos onde a fita perdeu contato. Eles não
  caem espalhados: saem em **faixa**, porque o defeito é uma região da fita, e
  saem **coloridos**, porque o que a cabeça recupera ali não é branco.
* **Chuvisco**, **Cintilação** e **Linhas de varredura**.
* **Geração da cópia** — de 0 (a fita original) a 3 (a cópia da cópia da
  cópia): perde resolução, ganha ruído e riscos, e a cor vaza mais. Um
  controle só que envelhece o conjunto inteiro.

Dois pontos de partida na galeria de filtros: **VHS 1994** e **FITA RUIM** —
o segundo é a fita judiada de uma vez só, com o rasgo e os riscos no alto.

### CRT — o tubo pelo mecanismo, com os padrões da referência

O **CRT / Tubão** foi reconstruído a partir da ferramenta aberta da
tooooools (effects/crt), e nasce com os **padrões de fábrica dela**: máscara
MONITOR, 377 colunas de fósforo, ponto 0,93, halo 0,1, bloom em TELA com
limiar 0,36 e intensidade 0,45, convergência de meio ponto. Foi medido lado a
lado com a página deles, na mesma imagem: cinco regiões e três níveis de
bloom batem com diferença de 1%.

* **Máscara** — MONITOR (pontos redondos em trio vertical, coluna sim coluna
  não descida: a máscara delta), TV (listras com o trio vizinho descido meia
  altura: a máscara de fenda), LCD (três listras por célula) ou SÓ LINHAS.
* **Colunas de fósforo** — a régua. Não é pixel de tela: 377 colunas dão a
  mesma tela em 320, 960 ou 1920 de largura.
* **Tamanho** e **suavidade do ponto**, **força da máscara**.
* **Fósforo** — RGB, ou um fósforo só: VERDE (P1), ÂMBAR (P3), BRANCO (P4),
  AZUL — todos os pontos acesos com a mesma cor, pelo brilho da imagem.
* **Brilho** e **gama da máscara** — a máscara cobre uma fração da tela, e a
  referência compensa com ganho 2,5 e saída em gama 2,2. Aqui a compensação
  segue a presença da máscara: sem máscara (força 0, ou SÓ LINHAS) ela some.
* **Convergência** e a **direção** dela — o canhão vermelho e o azul chegam
  desalinhados em direções opostas, a distância em pontos.
* **Halo do ponto** e o **raio** — o fósforo aceso ilumina o vizinho.
* **Bloom**, **limiar**, **raio**, e **como volta** (TELA, CLAREAR, HDR,
  SOMA) — o que passa do limiar vaza num borrão largo. Ele é lido da imagem
  de entrada, não do tubo — foi assim que o branco deixou de sair verde.
* **Curvatura do vidro**, **linhas de varredura** e **quantas**, **grão**,
  **cintilação**, **vinheta**.

Cinco pontos de partida na galeria: **MONITOR CRT** (a referência),
**TV DE TUBO**, **TERMINAL VERDE**, **TUBO AZUL** e **LCD DE PERTO**.

### DATAMOSH — o codec, não o filtro de codec

O **Datamosh** deixou de ser um borrão com blocos e passou a fazer o que um
decodificador faz quando lhe roubam o quadro-chave — que é exatamente o que
o Supermosh (supermosh.github.io) faz com H.264 de verdade. Cada quadro
carrega:

* **vetores de movimento** por macrobloco, MEDIDOS aqui por busca de bloco
  (16×16 deslocamentos testados por bloco, na GPU, como um codificador);
* o **resíduo** — a diferença entre o novo e a previsão, quantizada em
  blocos de DCT;
* **blocos intra** — quando o movimento não explica o bloco.

A saída de cada quadro é a saída ANTERIOR arrastada pelos vetores, mais o
resíduo. Como o resíduo é calculado contra a previsão do codec, a imagem velha
viaja com o movimento do vídeo novo e nunca se apaga. Num **corte** o
movimento não casa, o dado daquele quadro é jogado fora — e a imagem velha
fica, para viajar quando o vídeo novo se mexer. É o datamosh clássico, e foi
medido: no corte, 138 de diferença contra o quadro novo e 3 contra o
anterior.

* **Macrobloco** — contado numa linha de 720, como o codec.
* **Quadros por segundo do codec** — o mosh avança a 24 por segundo (ou o
  que você pedir), e não a cada desenho da tela. É o tranco de vídeo que o
  mosh tem, e é o que faz a prévia e a exportação darem o mesmo resultado.
* **Alcance da busca** — até onde o bloco procura o parecido.
* **Ganho do movimento** — 1 é o movimento medido; 2 arrasta em dobro.
* **REPETIR o quadro-P** — o "bloom" clássico: o efeito congela o campo de
  vetores que acabou de medir e o aplica de novo a cada quadro do codec, e a
  imagem escorre sem parar na direção em que estava indo — mesmo com o vídeo
  parado. É um interruptor **com cronômetro**: ponha keyframes nele para
  marcar onde o bloom começa e onde termina, que é o fluxo de marcadores
  das ferramentas de datamosh. **Aceleração da repetição** faz cada quadro
  repetido puxar um pouco mais que o anterior.
* **Campo de vetores** — o movimento medido, editado como o ffglitch edita
  por script: MEDIDO; somado a uma **DERIVA** constante (força e direção), a
  um **ZOOM** (a explosão do centro para fora) ou a uma **ESPIRAL**; **SÓ
  VERTICAL** (o "sink and rise": tudo afunda e sobe); SÓ HORIZONTAL; ou
  NEGADO. **Força da deriva / zoom** e **direção** valem para esses.
* **Rastro dos vetores** — a média do campo no tempo: o movimento demora a
  mudar e deixa rasto, como o mv_average do ffglitch.
* **Persistência** — segura o resíduo: 0 é o codec exato, 1 é só arrasto.
* **Quantização do resíduo** — só o grosso do bloco sobrevive. **Cor em
  blocos (4:2:0)** — a cor do resíduo é sempre a do bloco inteiro: são os
  retalhos coloridos que todo mosh tem.
* **Tolerância do casamento** e **blocos intra** — o que fazer quando o
  movimento não explica: jogar fora (mosh) ou deixar o bloco novo entrar.
* **Blocos travados** e a **troca** deles — macroblocos que nunca recebem
  resíduo.
* **Bagunça dos vetores**, **queima da cor por geração** (a cor satura a
  cada quadro que passa pela realimentação).
* **Quadro-chave a cada N s** — 0 é só no início do clipe.

A **região** do efeito (retângulo, elipse, traçado) é o "mosh map": o mosh
só onde a região deixa.

Na galeria: **DATAMOSH CLÁSSICO** (o codec exato, quadro-chave removido),
**DATAMOSH DERRETENDO** (movimento amplificado e resíduo segurado),
**DATAMOSH EXPLODINDO** (quadro-P repetido com zoom no campo) e **DATAMOSH
AFUNDANDO** (só o vertical, com rasto).

### PAPEL TÉRMICO — a foto no cupom fiscal

A **impressora de cupom** não tem tinta: tem uma linha de resistências que
queimam o papel ponto a ponto. O efeito é contado em **pontos de 203 dpi** —
80 mm são 576 pontos, 58 mm são 384 — e é um bit por ponto: queimou ou não.
Fora do papel é **transparente** (a sombra também), então o cupom se compõe
sobre o que estiver embaixo na linha do tempo.

* **Papel** (80 ou 58 mm), **altura do cupom** no quadro, **posição X**.
* **Cabeçalho** (o nome da loja, escrito por você) e **itens** — separe com
  `|`; o último pedaço de cada linha vai para a direita se for um número, e
  o TOTAL soma os preços. Há a data, um número de cupom, os separadores e
  o **código de barras** (sorteado pelo nome da loja).
* **Trama** — DIFUSÃO (orgânica, por ruído azul), ORDENADA (grade 8×8) ou
  LIMIAR SECO. **Contraste**, **gama**, **cinza do preto**, **cor do papel**.
* **Desgaste** — a resistência morta (a coluna branca vertical de todo cupom
  velho), a resistência fraca (imprime cinza), a faixa onde o papel
  escorregou, o pontilhado solto.
* **Queima** — o ponto quente aquece o vizinho: o preto engorda e escorre no
  sentido do avanço.
* **Sombra do cupom** e **imprimir ao vivo** — em pontos por segundo, o
  cabeçote avança e o cupom sai da máquina no ritmo do clipe.

Na galeria: **CUPOM FISCAL** e **CUPOM DESBOTADO**.

### MAPA DE PROFUNDIDADE (I.A.) — perto claro, longe escuro

Um modelo de profundidade monocular (**Depth Anything V2**, small) roda
**dentro do navegador**: perto claro, longe escuro, como a estética do TOP de
profundidade do TouchDesigner. Mesmo contrato do MARCAR OBJETO: o modelo
(18 MB) é buscado na primeira vez que o efeito entra no ar, fica guardado no
navegador, nenhum quadro sai da máquina, e a ficha do efeito diz o estado —
carregando, pronta (e em quê: WebGPU ou CPU), ou indisponível e por quê.
Sem I.A., o mapa é de mentira, pelo brilho.

* **Mostrar** — MAPA (perto claro ou perto escuro), COR (turbo), NÉVOA pela
  distância, SÓ O PERTO ou SÓ O LONGE — os dois últimos são o mapa como
  **matte**, com alfa real: o recorte do perto vira uma camada.
* **Análise** — RÁPIDA (154 px), MÉDIA (252) ou FINA (378). Em vídeo o mapa
  atrasa (meio segundo a dois, conforme a máquina); em foto é imediato.
* **Ritmo da análise** — SEMPRE QUE DER, 2 POR SEGUNDO, 1 POR SEGUNDO ou SÓ
  COM O VÍDEO PARADO. O modelo roda num trabalhador, fora da linha principal
  — mas a placa de vídeo é uma só, e enquanto ela pensa a profundidade o
  quadro do vídeo espera um pouco. Se o vídeo engasgar, baixe o ritmo; para
  fotos, SEMPRE.
* **Contraste**, **gama** e **deslocar** do mapa; **cor da névoa**; **onde
  corta** e a **borda** do recorte.

### RASTREIO DE MANCHAS — a visão de máquina

O **Blob Track**: as manchas viram caixas numeradas, com coordenadas, ligadas
por linhas — a sobreposição de visão de máquina. O número **acompanha o
objeto** enquanto ele anda (cada mancha herda o número da mais próxima do
quadro anterior), e as caixas são suavizadas para não tremer.

* **O que é mancha** — O CLARO, O ESCURO, O QUE SE MEXE (contra o quadro
  anterior) ou UMA COR (por matiz, com tolerância).
* **Limiar**, **tamanho mínimo** (% do quadro), **quantas manchas** (até 32),
  **suavizar as caixas**.
* **Desenho** — CAIXA, CANTOS, CRUZ ou CÍRCULO; **ligar as manchas** (cada
  uma às duas vizinhas mais próximas); **número e coordenadas**; **ponto no
  centro**; **cor**, **espessura**, **tamanho do rótulo**; **preencher a
  caixa**; **escurecer o vídeo**.

Na galeria: **VISÃO DE MÁQUINA** e **PROFUNDIDADE (I.A.)**.

### MARCAR OBJETO — a I.A. desenha o contorno para você

Dentro do painel do traçado há um botão de **I.A.**. Ele faz duas coisas,
conforme o estado do traçado:

* **traçado vazio → MARCAR OBJETO.** Você clica em cima da coisa na prévia e o
  contorno dela vira os vértices, já fechados. Dali em diante é traçado normal:
  arraste os pontos, use SUAVIZAR TUDO para curvar, anime.
* **traçado pronto → SEGUIR O OBJETO.** Os vértices que já existem andam até o
  contorno deste quadro, **sem mudar de quantidade e sem perder as alças** — é
  isso que deixa a rotoscopia à mão e a I.A. conviverem: marque, avance, siga,
  corrija.

**Roda dentro do seu navegador: nenhum quadro sai da sua máquina.** A
biblioteca e o modelo são baixados na primeira vez que você usa o botão (uns
dois segundos, uma vez por sessão) e **não fazem parte do arquivo único** — se
você abrir o laboratório sem internet, o botão avisa e todo o resto continua
igual.

Ele é **por quadro**: não adivinha o movimento sozinho. O que ele tira de você
é o trabalho de desenhar o primeiro contorno de cada quadro-chave.

### TRICÔ — o vídeo virando malha, com vão transparente

Família 05 PIXEL. Cada célula da grade olha um pedaço da imagem e decide que
PONTO de tecido desenhar ali. Não é pixelização: entre um ponto e outro pode
não haver **nada**, e é daí que vem o uso dele.

Oito tipos de ponto — quadrado, redondo, losango, cruz, linha, **tricô** (duas
fileiras de "V" entrelaçadas), ponto-cruz e orgânico. Mais organicidade
(0 = geométrico, 1 = tecido feito à mão), sensibilidade de contorno, quatro
modos de cor, cinco simetrias (incluindo caleidoscópio) e cinco animações.

**Fiapos.** Cinco controles no meio da lista soltam microfibras de cada ponto:
fios finos que escapam para o vão, cada um com comprimento, torção e direção
sorteados. **Fiapos** é quantos; **comprimento**, quanto avançam no vão;
**finura**, a espessura (fio mais fino que um pixel não encolhe mais — fica
mais fraco, que é como microfibra se comporta); **frisado**, o quanto entortam
no caminho; **clarear**, se pegam luz (positivo) ou ficam mais escuros que a
malha (negativo). Nas animações, os fiapos balançam junto com o ponto.

É o controle que tira a malha do lugar de esquema: grade limpa demais entrega
na hora que é grade. Vem **desligado** — em 1080p o efeito custa 6ms sem fiapo,
15ms com fiapo no meio e 29ms com tudo no talo, então quem não pediu não paga.

**FUNDO = TRANSPARENTE é o controle que importa.** Com ele, os vãos entre os
pontos ficam com alfa de verdade — a camada deixa ver o que está embaixo dela
na linha do tempo, e funciona com opacidade, modo de mistura e keyframes como
qualquer outra.

**Para transformar só uma pessoa (e não a cena inteira) em tecido:**

1. aplique o TRICÔ no clipe e ajuste o padrão;
2. ponha **Fundo = Transparente** — isso abre os vãos entre os pontos;
3. na ficha da camada, crie uma máscara **CANETA** e use **MARCAR OBJETO
   (I.A.)** para traçar a pessoa;
4. ponha outro vídeo numa pista abaixo.

O passo 2 tira o fundo de dentro do tecido; o passo 3 tira tudo que está fora
da pessoa. Os dois juntos é que dão o resultado.

### SCANNER DE VÍDEO — o cabeçote trepidando

Família 04 GLITCH. Cada linha da imagem é deslocada por uma senoide, com os
vãos em alfa real. Oito controles: direção, velocidade, oscilação, intensidade
do arraste, cor/preto e branco, grão e fundo.

O aviso está na descrição dele: **funciona melhor em foto**. Em vídeo o
resultado fica instável, porque o desenho se refaz a cada quadro.

**O arraste gravado.** Com o efeito aberto na ficha, a prévia inteira vira
superfície: **aperte, arraste, solte**. O gesto inteiro é esticado do começo ao
fim da digitalização — arrastar devagar num trecho faz aquele trecho ocupar
mais linhas. Clicar sem arrastar apaga o gesto.

### SCANNER DE MESA — o escâner de verdade

Está em três lugares, e os três abrem a mesma janela: o botão **SCANNER** na
grade FONTE, o item **Scanner de mesa (foto)** no catálogo de efeitos, e
**ESCANEAR** na barra de transporte.

Ele **não é um efeito**. É uma gravação: um cabeçote anda uma linha por vez e o
filme guarda o que estava embaixo dele **naquele instante**. Por isso mora numa
janela, e por isso o resultado vira uma fonte do laboratório — como o FRAME
congelado da câmera.

```
A. BANCADA                        B. FILME
a fonte, viva.                    o que o cabeçote já gravou.
arraste, role para ampliar,       vai enchendo linha a linha
gire, R reenquadra                enquanto o scan anda
```

**A distorção vem do movimento, e ele pode ser seu ou do vídeo:**

* **foto** — a distorção é da sua mão. Comece o scan e arraste, amplie ou gire
  a bancada enquanto o cabeçote anda. Cada linha guarda a posição daquele
  instante, e a imagem escorre, rasga, estica.
* **vídeo** — a fonte anda sozinha: o vídeo **toca** durante o scan, então cada
  linha do filme é um quadro diferente. Quem se mexeu vira um borrão contínuo,
  quem ficou parado sai nítido. É o slit-scan clássico.

Os dois somam: arraste um vídeo enquanto ele toca.

**Controles.** Velocidade (0,5 a 8 linhas por quadro), direção vertical ou
horizontal, cor ou preto e branco, fundo (cor sólida ou **transparente**), grão,
onda do cabeçote, e a ficha técnica queimada no canto — que dá para desligar.

**FUNDO TRANSPARENTE.** O que o cabeçote não cobrir fica com alfa de verdade —
o recorte irregular que ele deixa nas bordas passa a deixar ver a camada de
baixo. As duas telas ganham xadrez para você enxergar o vazio. Só dá para
trocar o fundo com a folha em branco; no meio de um scan a troca é ignorada,
senão apagaria o que já foi gravado.

**Como levar o resultado para a linha do tempo:**

| botão | o que faz |
|---|---|
| **USAR NA COMPOSIÇÃO** | o filme vira camada na linha do tempo, a janela fecha e o laboratório volta para a vista de vídeo |
| **BAIXAR PNG** | salva o filme no disco (com alfa, se o fundo for transparente) |
| **FOLHA NOVA** | joga o filme fora e recomeça |
| **VOLTAR O CABEÇOTE** | leva o cabeçote ao início sem apagar o filme |

Fechar a janela **não** perde o scan: reabrindo, o filme continua onde estava.
O que não sobrevive é uma sessão vazia — se você abriu sem fonte e depois
escolheu um clipe, a mesa recomeça com ele.

### MOSAICO — uma grade de quadros, com um vídeo dentro de cada um

Está em dois lugares, e os dois abrem a mesma janela: o botão **MOSAICO** na
grade FONTE, logo abaixo do SCANNER, e **MONTAR** na barra de transporte.

Não é um efeito de grade. **Cada quadro do mosaico é um CLIPE de verdade** —
com corte, efeito, máscara, keyframe e transição próprios. É a diferença entre
uma grade desenhada por cima do vídeo e uma grade em que o quadro 3 tem um
vídeo, o 7 tem outro e o 11 está vazio.

A janela é um mapa da grade, na proporção da sua composição:

| Controle | O que faz |
|---|---|
| **1. Quantos quadrados** | colunas e linhas, de 1 a 16 cada |
| **2. Formato do quadrado** | `PREENCHER A TELA` divide o quadro todo · `QUADRADO` faz quadrado de verdade em pixels · `LIVRE` abre a proporção largura÷altura: abaixo de 1 o quadro fica **em pé e fino**, acima fica deitado |
| **3. Borda entre os quadrados** | espessura de 0 a 12% da largura, mais a moldura em volta da grade |
| **4. O vídeo dentro do quadro** | `PREENCHER` corta o que sobra · `CABER INTEIRO` deixa o vídeo inteiro dentro · `ESTICAR` deforma para ocupar tudo. E a **defasagem**, que faz cada quadro mostrar o mesmo vídeo num momento diferente |
| **5. Qual vídeo em qual quadro** | escolha uma fonte e **pinte arrastando** no mapa. A borracha esvazia. `ALTERNAR` faz xadrez, `SORTEAR VAZIOS` deixa buracos |

**A borda não é pintada: é VÃO.** Fora do quadro não fica imagem nenhuma, fica
alfa — o que aparece ali é a camada de baixo, ou o fundo da composição. É por
isso que dá para pôr um mosaico por cima de outro.

**REORGANIZAR O QUE JÁ EXISTE** muda colunas, formato ou borda de um mosaico
já montado, sem desmontar. Encolhendo a grade, os quadros que ficaram de fora
**não são apagados** — continuam na linha do tempo, e a janela avisa quantos.

Duas coisas para saber antes:

* **cada quadro cheio é um vídeo tocando.** Doze quadros são doze
  decodificadores. Acima de umas duas dúzias a prévia engasga (a exportação
  continua exata) — a janela avisa quando você passa disso;
* nos formatos de proporção fixa a grade pode ficar **mais alta que a tela**.
  Ela fica centrada e as pontas saem cortadas; a janela também avisa.

### POLAROID — não há janela, há uma câmera

Está nos mesmos dois lugares do scanner e do mosaico: o botão **POLAROID** na
grade FONTE e **REVELAR** na barra de transporte.

A tela é uma câmera flutuando no escuro. **Não existe cartão de janela, nem
cabeçalho, nem barra de botões embaixo** — fora a telinha de ajustes, todo
comando é uma peça da máquina:

| Peça | O que ela faz |
|---|---|
| **a lente** | é por onde a imagem entra: clique e escolha a foto. **Dois cliques** trazem o clipe escolhido na linha do tempo. Depois de carregada, você a vê **através do vidro** |
| **o botão vermelho** | dispara. A foto sai pela fenda e **fica pendurada** na câmera |
| **a barra do flash** | arma o flash. Acesa, a próxima foto sai com estouro de luz |
| **o botão esquerdo** (dos dois redondos, à direita da lente) | é a roda claro/escuro do 1000. **Arraste em volta dele**; dois cliques voltam ao meio |
| **o botão direito** | **EDITAR** — a telinha se desdobra para o lado |
| **a faixa arco-íris** | é a marca do filme. Clique e ela troca de filme |
| **a porta preta do filme** | é por onde se carrega o pacote — e o pacote é que decide em que papel a foto sai. Ela abre, mostra a câmara e leva direto à página **PAPEL** |
| **a plaqueta Supercolor** | é a leitura. Passe o rato para ver o filme, o papel e a foto que estão carregados |
| **a fenda** | é por onde a foto sai — e onde você pode **largar um arquivo** |

Chegando perto da lente, ela **avisa** que é ali: um anel azul, um **＋** dentro
do vidro e a etiqueta. Você também pode largar uma imagem em cima da câmera
inteira.

Para sair: **Esc**, um clique no fundo, ou o **×** no canto — a única coisa da
tela que não é peça de polaroid nenhum.

#### A foto fica pendurada — e é nela que se trabalha

Ela sai com tranco, balança até assentar e fica ali, segura pela ponta —
**praticamente inteira para fora**, com a imagem toda à vista, que é o que
importa na hora de editar. É sobre ela que a revelação corre, do cinza do
reagente até a imagem.

* **arraste a foto** para reenquadrar; **roda do rato** para aproximar;
* **passe o rato** por cima e aparecem as duas saídas, na própria foto:
  **BAIXAR PNG** (folha inteira, 1000×1232) e **USAR NA LINHA DO TEMPO**;
* dispare de novo e a anterior **continua pendurada atrás**, espiando por
  baixo. Clique numa delas para voltar aos ajustes daquela.

Se você disparar de novo com a telinha aberta, ela continua aberta — é lá que
você está trabalhando.

#### O filme não é um filtro por cima

O que faz um polaroid parecer polaroid é o **preto levantado** — a sombra vira
um cinza leitoso em vez de fechar. Cada um dos oito filmes é uma curva por
canal, não uma cor jogada em cima:

| Filme | Como ele é |
|---|---|
| **600** | o de todo mundo: quente, contraste médio, preto que nunca fecha |
| **SX-70** | macio, sombra puxando para o magenta, branco sem estourar |
| **TIME-ZERO** | esmaecido e quente, como quem guardou a foto na gaveta |
| **779** | frio, azulado, o mais limpo da caixa |
| **669** | peel-apart: contraste alto, preto quase fechado |
| **P&B** | preto e branco de verdade, com o creme do papel por baixo |
| **EXPIRADO** | pacote fora da validade: dominante ciano e vazamento pela borda |
| **ESTOURADO** | luz demais no disparo — o branco come a foto pelas bordas |

#### A telinha, em seis linhas

O botão direito abre a telinha: ela está **dobrada atrás da câmera** e
desdobra para o lado, presa por duas dobradiças. O desenho é o do laboratório —
monoespaçada em caixa alta, filete fino, e o azul do canal de vídeo na linha
acesa.

São dois níveis. Primeiro o **índice**, com as seis linhas; clicando numa você
entra nela, e o botão do cabeçalho vira **‹** para voltar. Só fecha a telinha
quando você já está no índice.

| Linha | O que tem |
|---|---|
| **FILME** | os oito, mais os originais da sua pasta para **amostrar** |
| **AJUSTES** | temperatura, brilho, contraste, vintage e saturação (0 a 200, com 100 no meio), mais halo, vinheta, grão, vazamento de luz e desfoque |
| **LEGENDA** | escrita na tarja de baixo — à mão, Archivo ou monoespaçada; tamanho, alinhamento e cor da tinta |
| **QUADRO** | formato (quadrado, retrato, paisagem, wide) e giro. O que sobra do formato **não fica preto: fica papel** |
| **PAPEL** | qual moldura. A folha padrão é o `papel.png` da sua pasta — o escaneamento em PNG, usado **como está**, sem nada acrescentado |
| **PRESETS** | guarda a receita e reaplica. Ficam no mesmo cofre dos outros presets do laboratório |

#### A pasta é sua, e ela manda

```
assets/polaroid/molduras/   escaneamentos de papel polaroid VAZIO
assets/polaroid/filmes/     fotos ORIGINAIS de polaroid
```

Jogue arquivos lá dentro e eles aparecem — com o servidor no ar (`node
server.js`) a lista vem da pasta, sem precisar editar nada.

**As molduras** dão trama, sujeira e o amarelado que muda de canto para canto,
coisa que retângulo branco desenhado não tem. O laboratório **mede sozinho**
onde termina a borda e começa a emulsão. E depois de revelar, o papel volta por
cima da foto — é o que faz a imagem parecer revelada *dentro* da folha, e não
colada sobre ela.

**Os originais não são exemplo: o laboratório lê a cor deles.** Clicando num
original na linha FILME, ele monta um filme com a assinatura daquela foto —
preto, branco e meio-tom medidos, canal por canal. É por isso que essa pasta
importa. Quem preferir não mexer em pasta tem **AMOSTRAR UM ARQUIVO…**, que faz
a mesma leitura num arquivo solto.

### SONÓGRAFO — o vídeo virando música

Abre pelo botão **SONÓGRAFO**, na aba **TOOLS**. O mesmo botão existe em
**TOOLS** do laboratório de áudio, e abre a mesma janela: ele come vídeo e
devolve som, então tem porta dos dois lados.

A ideia cabe numa frase: **a linha fica parada e a imagem passa por ela.** Não
é a linha que varre o vídeo — é o vídeo que atravessa a linha. Um carro entra
no quadro, cruza a linha, e naquele instante nasce uma nota.

```
vídeo  →  linha parada  →  o que cruza  →  sensor  →  nota  →  som
```

**Como começar, em cinco passos:**

1. **FONTE…** abre um arquivo, ou **DO CLIPE** usa o que estiver escolhido na
   linha do tempo. Arrastar um arquivo para cima do visor também funciona.
2. **Arraste a linha** com o dedo no visor, ou use POSIÇÃO. Ela pode ficar
   vertical, horizontal ou nas duas diagonais.
3. Escolha os **SENSORES** — o que conta como acontecimento.
4. Escolha **ESCALA** e **TOM** no rodapé: toda nota sai afinada nessa
   tonalidade, sem exceção.
5. **▶**.

**Três desenhos contam a mesma história ao mesmo tempo**, e é aí que se entende
a máquina: na linha, um traço curto acende na altura exata de onde alguma coisa
cruzou; no piano roll, a nota nasce embaixo desse traço, no mesmo instante; e
ela **cresce enquanto o objeto ainda está passando**. A duração da nota é o
tempo de travessia, de verdade — objeto lento dá nota longa.

**Os quatro sensores** decidem o que é acontecimento. Podem ser combinados, e
pelo menos um fica sempre ligado:

* **BRILHO** — a coisa que cruzou é mais clara ou mais escura do que o que
  costumava estar ali. É o mais previsível, e o padrão.
* **COR** — a mudança de matiz. Bom para objeto colorido em cena neutra.
* **MOVIMENTO** — a variação de um quadro para o outro. Bom para água, folhagem,
  multidão.
* **BORDA** — o contorno passando pela linha. Bom para vulto, poste, grade.

**Os três botões giratórios**, e é neles que se acerta o resultado:

* **SENSIBILIDADE** — quanto uma mudança precisa ser grande para virar nota.
  Mais alta, mais coisa vira música. Mais baixa, só o que é forte.
* **DENSIDADE** — quantas notas cabem ao mesmo tempo e quão rápido a mesma
  altura pode repetir. É o botão de "está demais" / "está de menos".
* **SUAVIZAÇÃO** — o quanto o sensor ignora tremor. Suba se o vídeo tem grão ou
  câmera na mão.

**MAPEAMENTO** é onde se decide o que vira o quê: a altura pode vir da posição
na linha (o padrão — em cima é agudo), do brilho, da cor ou do movimento; a
duração, do tempo de travessia; a intensidade, do brilho ou do contraste. E o
instrumento pode ser fixo ou **decidido pelo matiz**: vermelho percute, verde é
madeira, azul é eletrônico, magenta é corda.

No rodapé ficam **ESCALA** (14), **TOM**, **ALCANCE** (de que oitava a que
oitava), **GRADE** (encaixa o início das notas em 1/4, 1/8, 1/16 — o som ao
vivo sai na hora do cruzamento, e é o gravado que encaixa), **INSTRUMENTO** (10
vozes) e **INTENSIDADE**.

**O ● grava.** Desligado, você ouve e ajusta sem sujar a gravação; ligado,
guarda. **LIMPAR** apaga tudo.

**As saídas, no alto:** **MIDI** salva a sequência para abrir num DAW,
preservando altura, duração, intensidade e canal. **WAV** salva o áudio
renderizado. **USAR NA COMPOSIÇÃO** rende e põe direto na linha do tempo como
clipe de áudio, já no lugar.

**Imagem parada também funciona.** Sem vídeo não há tempo, então quem anda é a
linha: aparece o controle **VARREDURA DA IMAGEM** com quantos segundos a
travessia leva, e a foto vira partitura da esquerda para a direita.

> **Se sair ruído em vez de música:** baixe a SENSIBILIDADE e a DENSIDADE, e
> deixe só o sensor BRILHO ligado. Se sair silêncio, faça o contrário — e
> confira se a linha está em cima de alguma coisa que se mexe.

### FILMADORA — a traseira de uma câmera de filme

Está em **TOOLS** (no 2.0) e na grade FONTE (no Classic), ao lado do polaroid
e do sonógrafo. Clica e abre, no palco escuro, a **traseira de uma filmadora
vintage** — o visor mostrando a composição **já com a película**, e cada
peça da máquina fazendo o que a peça faria. Não há janela; a telinha de
ajustes é a única coisa que não é câmera.

| Peça | O que ela faz |
|---|---|
| **o visor** | a composição com a película. Clique toca e pausa (a barra de espaço também). Nas bitolas de 8 mm ele é 4:3 e recorta as barras pretas que a janela deixa num vídeo largo — como o visor de uma câmera de verdade |
| **o botão vermelho** | **GRAVA**: a exportação do laboratório, com a película dentro. A lâmpada pisca, o contador conta. Apertar de novo cancela |
| **LENTE** (alto, à direita) | a lente do app: **LIMPA → QUEIMADURA → HALO**, girando a cada toque. A QUEIMADURA é o *film burn*: lampejos **rápidos e trêmulos** de luz queimada — numa beira, num canto, nos dois lados, atravessando o quadro — em paletas de fogo, âmbar, verde com a beira vermelha, azul de um lado e laranja do outro, rosa e ciano. Na engrenagem, a seção QUEIMADURA escolhe ONDE aparece e as CORES (ou sorteia a cada lampejo), o ritmo, a duração e a trêmula. O ajuste VAZAMENTO dosa a força |
| **o centro da roda** | o **TREMOR** do quadro, liga e desliga (o "frame jitter" do app) |
| **o contador** | pés de filme desta bitola. 50 pés de Super 8 a 18 q/s são 3 min 20 s — é conta real (72 quadros por pé no Super 8, 80 no 8 mm, 40 no 16, 16 no 35) |
| **o seletor** (a roda do canto) | o **FILME**: PURO (a película da bitola como vem) ou um dos **dez filmes medidos da saída do app**, com nomes do laboratório na ordem do seletor dele — CRUZADO, NOIR P&B, ANOS 60, ÂMBAR, ÍNDIGO, TOSCANO, BICOLOR, 2 TIRAS, TRÊS-X, TERRA. NOIR P&B e TRÊS-X são preto e branco de verdade. Arraste em volta, role, toque no nome, ou ← → |
| **i** | a plaqueta: o que cada peça faz |
| **ROLOS** (a tira de filme) | os rolos gravados nesta sessão: baixar, **usar na linha do tempo**, apagar. Cada rolo é um quadro de filme com o carimbo laranja da data |
| **BITOLA** (a câmera que gira) | a gaveta das máquinas: **8 MM, SUPER 8, 16 MM, 35 MM**. Cada uma é outra câmera — outro couro, outro visor, outra película, outra cadência |
| **REBOB.** | volta ao início |
| **SOM** | grava em **tempo real, com o áudio** (o gravador do navegador). Desligado, grava **exato**, quadro a quadro, sem som — o arquivo sai certo mesmo com efeito pesado |

A ordem dos botões é a do app (i · rolos · trocar câmera · flash · som embaixo; a lente em cima; o filme na roda; o tremor no centro dela). O flash virou REBOBINAR — não há tocha num laboratório.
| **a engrenagem** | a telinha de ajustes |

**As quatro máquinas.** A bitola é a máquina inteira, e cada uma tem o seu
couro — foto, fixo: o **8 MM** em couro preto, o **SUPER 8** em couro marrom,
o **16 MM** em couro bege (glifos pretos, em plaquetas), o **35 MM** em metal
escovado. Os três couros são os da pasta `assets/filmadora/couro/`,
guardados como ladrilho espelhado 2×2 (emenda sem costura, grão na metade do
tamanho); o metal foi gerado no mesmo tamanho. Não há escolha de carcaça —
a máquina é a máquina.

**A película** é o pacote da bitola em ESTILOS (`8 MM CASEIRO`, `SUPER 8`,
`16 MM DOCUMENTÁRIO`, `35 MM`), calibrado pela régua do 8mm Vintage Camera —
e, desde 12/09/2026, **medido da saída dele**: o Bruno filmou a carta de
calibração com o app, um filme de cada vez, e cada filme do seletor é uma
cadeia (curva por canal ou mesa de canais, e depois o filtro de cor) que o
próprio shader ajustou aos 45 patches lidos do vídeo. Os neutros ficam a
7–14 níveis do app, a pele a ~10; não é o LUT dele, é a família do olhar.
Da mesma medição vieram a maciez (borda de 10 px em 960), o grão (fino, um
nível), a cintilação (nenhuma), o tremor (só vertical, esporádico) e a
janela (quase no limite do quadro, sombra de 3%).
Ela entra como o **último ajuste da cadeia** enquanto a máquina está aberta —
na prévia e no rolo — e some ao fechar. Nada é gravado na linha do tempo
sem você pedir. Se a mesma bitola já estiver aplicada como camada de ajuste,
a película entra duas vezes: feche uma das duas.

**A telinha de ajustes** tem sete valores que MULTIPLICAM a calibração da
bitola (1 é ela como veio, 0 desliga, 2 é o dobro): COR DO FILME (quanto do
olhar do seletor entra), MACIEZ, GRÃO, SUJEIRA, TREMOR, VAZAMENTO, SOMBRA DA
JANELA — mais a CADÊNCIA (da bitola, ou do vídeo como veio) e o modo de
gravação. A máquina lembra a bitola, o filme e os ajustes entre sessões; os
rolos não — são arquivos na memória, baixe o que quiser guardar.

**A gravação** usa a resolução cheia da composição, o formato e o fps da
janela EXPORTAR (que não abre), e o trecho entre as marcas I e O quando
existe. Medido: uma composição de 5,964 s saiu com 5,967 s, 1280×720, VP9
exato, com a janela 4:3 e a cor do filme dentro do arquivo.

### AQUARELA — a mesa de luz do animador

Está em **TOOLS** (no 2.0) e na grade FONTE (no Classic), ao lado da
filmadora. Clica e abre, no palco escuro, a **prancheta de um animador**: a
mesa de madeira com o vidro aceso por baixo, a folha presa na barra de
pinos, a caixa de tintas de lata à esquerda e a tira de quadros embaixo. Não
há janela; cada peça é uma função.

É uma aquarela **por física**, não por filtro: a água anda pelo papel, leva o
pigmento, seca pela beira — o modelo de Curtis e outros ("Computer-Generated
Watercolor", SIGGRAPH 1997), inteiro na placa de vídeo. A cor é
**Kubelka-Munk**: cada um dos **52 pigmentos** tem absorção e espalhamento por
canal, calculados de duas cores (a aguada sobre branco e a mesma camada sobre
preto), e a pilha compõe camada sobre camada — é por isso que amarelo com
azul dá verde, ultramar com siena queimada dá o cinza-violeta clássico, o
branco de titânio cobre e o ftalo não.

| Peça | O que ela faz |
|---|---|
| **a folha** | o papel. Pinte com o ponteiro — caneta com pressão muda o traço e a carga. A água fica à vista enquanto a folha está molhada |
| **LUZ** (o botão de latão) | a mesa de luz: arraste **para a direita ou para cima** para acender (esquerda ou baixo apaga; a roda do mouse também), e o valor fica escrito embaixo. Quanto do **vídeo da composição** aparece por baixo do papel — é o quadro do instante em que a folha está. No fim do curso a luz vem **por trás** da pintura (retroiluminação: o que se vê é o que atravessa) |
| **VEGETAL** (a chave, ou a tecla **V**) | o papel vegetal: o quadro **anterior aparece como uma aguada leve, nas cores dele** — você vê onde pintou e com quê — e o de **dois atrás**, mais leve ainda. Na engrenagem: **AZUL E VERMELHO** (o vegetal do animador: anterior em azul, seguinte em vermelho), 1 ou 2 quadros atrás, e a força |
| **os godês** | os oito pigmentos da paleta. Toque escolhe; o **⇄** abre a gaveta dos 52, em seis grupos, com o índice de cor e as marcas GRANULA e MANCHA |
| **os pincéis** | quatro redondos: **n.º 2, 6, 12 e 24** — e o **TAMANHO** livre por baixo deles, de 1 px a um terço da folha (bem grande). `[` e `]` mudam |
| **− 100% +** (no canto do vidro) | o **zoom** da folha, de 100% a 800%. Com zoom, **barras discretas** rolam a folha (a roda do mouse também; **Ctrl + roda** aproxima onde o ponteiro está). O número volta a 100% |
| **ÁGUA** | só água: molhe antes de pintar (molhado sobre molhado), dilua, provoque floradas |
| **ESPONJA** | levanta tinta e água. Pigmento que MANCHA (ftalos, quinacridonas, perilenos) resiste; o que granula sai fácil |
| **SECO** | o pincel quase sem água: a tinta pega só nas cristas do papel |
| **SAL** | sobre a aguada ainda molhada: os cristais bebem a água e deixam **estrelas claras de borda escura** |
| **ÁLCOOL** | gotas que repelem o pigmento: olhos claros com a borda escura |
| **SECAR** | seca a folha agora. Trocar de quadro também seca |
| **↶ ↷** | desfazer e refazer (**Ctrl+Z**, **Ctrl+Y** ou Ctrl+Shift+Z): doze passos — pincelada, sal, álcool, secar, limpar, copiar o anterior. Trocar de quadro zera o histórico |
| **CLARA · MÉDIA · FORTE** | a diluição: quanta tinta o pincel leva a cada toque. CLARA é a aguada (espessura ~1), MÉDIA a cor cheia (~2), FORTE quase tinta de tubo (~3,5) |
| **a tira** | os **QUADROS** da sequência. ◀ ▶ andam (a **roda do mouse** sobre a tira também, um quadro por dente), e **a composição anda junto**: cada quadro é um instante do vídeo. **+** cria um quadro depois deste, **⧉** copia o anterior para este, 🗑 apaga, ▶ **folheia** a sequência (espaço) |
| **EM 1s · 2s · 3s** | a cadência: um desenho por quadro, por dois, por três — como se anima à mão (a 24 q/s, EM 2s são 12 desenhos por segundo) |
| **USAR** (o vermelho) | a sequência entra na linha do tempo **por cima do vídeo**, no instante em que começou, em modo **Multiplicar** — a aguada como transparência. É a animação em cima da animação |
| **DO CLIPE** | com um clipe de aquarela escolhido na linha do tempo, traz a sequência de volta para a mesa, **editável** (o rolo guarda o depositado de cada quadro) |
| **↓** | baixa os quadros em PNG, num .zip |
| **i · ⚙** | a plaqueta e os ajustes |

**A telinha de ajustes**: o PAPEL (prensado a quente, a frio, rugoso — o
relevo da folha inteira), a SECAGEM (rápida, normal, lenta), a GRANULAÇÃO
(quanto o pigmento assenta nos vales do papel), a BORDA ESCURA (a água escoa
para a beira da mancha e o pigmento vai atrás — a assinatura da aquarela),
as FLORADAS (a água que invade o papel ao lado, e corre longe em papel ainda
úmido), a força do VEGETAL, a cadência da composição (24, 25, 30), a
DEFINIÇÃO da folha (AUTO casa com a composição pixel a pixel, de 1024 a
1920 no lado maior — uma composição 1080p pinta em 1080p; ou 768, 1024,
1280 · LEVE, 1920 — vale para uma folha nova),
a SAÍDA (**SOBRE O VÍDEO**, transparente em Multiplicar; ou **NO PAPEL**,
opaca, com o papel — a animação por si) e o **MODO CÓDIGO**: liga e a mesa
mostra, num terminal de canto, as chamadas que o simulador está fazendo
enquanto você pinta — as de verdade, com os números de verdade
(`aquarela.pincel(307, 288, 15.3, 48, 'ultramar')`, `aquarela.passo(120)`,
`aquarela.secar()`, `aquarela.quadro(4)`).

**O que vai para a linha do tempo** é uma fonte de QUADROS: a sequência
guardada em PNG com alfa **na resolução da composição** (até o dobro da
folha, desenhada com filtro e suavização — nada é reescalado depois; o
rolo, um arquivo só, leva os estados dentro), que
o laboratório desenha quadro a quadro pelo tempo — vale velocidade, reverso,
entrada, como num vídeo, e vai para a sessão guardada e para o .rgblab. Sem
composição aberta, a mesa funciona como uma aquarela solta: 16:9, e o USAR
cria a composição no tamanho da folha. E se a composição for **menor que a
folha** (a tela nasce da primeira fonte carregada — uma fonte de 160×90
deixa a tela de 160×90), o USAR **cresce a tela até a folha** e avisa: a
aquarela não é esmagada numa tela pequena.

### A região de um efeito pode ser um traçado

Todo efeito tem uma **REGIÃO**: onde ele acontece. Além de retângulo, elipse e
as duas faixas, existe **TRAÇADO** — o efeito só age dentro de um contorno
desenhado com a caneta, **com as alças de Bézier e tudo**.

Não é uma segunda caneta: a região aponta para um traçado que já existe no
clipe (os mesmos da máscara de camada). Se o clipe ainda não tem nenhum, o
botão **DESENHAR UM TRAÇADO** cria um e já abre a caneta na prévia — e ele
nasce **sem cortar a camada**, porque quem pediu foi o efeito.

Como o contorno é o mesmo, tudo o que vale para ele vale aqui: **arrastar as
alças curva a borda da região**, e um keyframe num vértice faz o recorte do
efeito acompanhar uma coisa que anda na cena.

Na forma TRAÇADO os controles passam a ser **Deslocar X/Y**, **Escala**,
**Rotação** e **Borda** — e os cinco são animáveis. Apagar o traçado apontado
não quebra nada: a região volta a ser o quadro inteiro.

### Película: 8 mm, Super 8, 16 mm, 35 mm

> **Refeitos em 11/09/2026 pela régua do app 8mm Vintage Camera** (e do
> Super 16), depois de o Bruno achar os pacotes "muito forçados". Cada um
> tinha oito efeitos no talo; agora têm metade, com um décimo dos valores,
> e o que o app tem: a **janela 4:3 com sombra macia** acompanhando a
> borda, a cor **desbotada**, imagem macia, grão fino, **cintilação** leve
> e a **cadência** — 18 quadros por segundo no 8 mm e no Super 8, 24 no
> 16 mm, que é o tranco que diz filme. O 16 mm mostra a tira com as
> perfurações, como o Super 16.
>
> Os filmes ficam na **galeria de filtros**, família **8 MM** — desde
> 12/09/2026 medidos da saída do app e com nomes do laboratório, na ordem
> do seletor dele: CRUZADO, NOIR P&B, ANOS 60, ÂMBAR, ÍNDIGO, TOSCANO,
> BICOLOR, 2 TIRAS, TRÊS-X e TERRA — para pôr por cima de qualquer pacote,
> ou sozinhos. NOIR P&B e TRÊS-X são preto e branco de verdade.
>
> Efeitos novos e controles novos: **CADÊNCIA DE PROJEÇÃO** (segura o
> quadro no ritmo pedido), a **SOMBRA DA BORDA** e a **CINTILAÇÃO** na
> janela, a **FORMA DA JANELA** (larga ou da bitola, 4:3), e a
> **SUAVIDADE** do grão.
>
> **12/09/2026 — o grão parou de voar.** O grão andava na diagonal, de um
> canto ao outro, a 60 px/s: o número do quadro era somado à coordenada do
> sorteio, e a rede de ruído inteira se deslocava uma célula por quadro.
> Agora cada quadro é OUTRO sorteio, parado no lugar (medido: o quadro
> seguinte era o anterior deslocado 3 px, correlação 0,80; hoje, 0,03 em
> qualquer deslocamento). O grão ficou fino — célula de 1,8 px no 8 mm, era
> 3,3 — e ganhou **GRÃO VIVO**: desligado, o grão não é sorteado de novo e
> fica fixo no filme (anda com ele no tremor, não com a tela). A poeira
> também encolheu (metade do tamanho, mais rara) e deixou de se deslocar.

O grupo `película` reconstrói a câmera antiga inteira:

* **Janela da câmera** — o formato do quadro com o canto arredondado de cada
  bitola, sangria, perfuração lateral opcional, queda de luz nos cantos e tremor.
* **Vazamento de luz** — a luz entrando pelo chassi, em vermelho, laranja, amarelo
  e branco, com a borda respirando e pulsação.
* **Queimadura de filme** (13/09/2026) — o *film burn* dos clipes de estoque:
  lampejos rápidos (0,35 s de fábrica) e trêmulos (piscam a 24 Hz) de luz
  queimada, numa BEIRA, num CANTO, no TOPO ou na BASE, nos DOIS LADOS ou
  ATRAVESSANDO o quadro — sorteado a cada lampejo ou fixo em ONDE APARECE —
  com cinco paletas: FOGO, ÂMBAR, VERDE E VERMELHO (o véu verde com a beira
  que estoura em branco), AZUL E LARANJA (frio de um lado, quente do outro),
  ROSA E CIANO. FREQUÊNCIA é quantos por 10 s; TAMANHO, LADO FRIO e SEMENTE
  são as outras rodas.
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

### Exportação — como sair com o vídeo certo

O botão **EXPORTAR** fica na barra de cima da prévia (ao lado de PNG). O que
sai é o que está na linha do tempo, na resolução da composição.

**1. Decida o trecho.** Sem marcas, sai a sequência inteira. Para sair só um
pedaço, ponha o cursor e aperte **I** (entrada) e **O** (saída) — a janela de
exportação avisa em letras grandes que há trecho marcado e diz de onde a
onde; **EXPORTAR TUDO** ali limpa as marcas.

**2. Escolha o modo.** São três, e a escolha depende do que tem na pilha:

| modo | quando usar | o que sai |
|---|---|---|
| **TEMPO REAL · COM ÁUDIO** | quando tem som e a composição roda liso na prévia | MP4 ou WEBM com áudio. Grava tocando: se a máquina engasgar, perde quadro |
| **FRAME A FRAME · EXATO** | efeitos pesados, datamosh, várias camadas, o mapa de profundidade | **WEBM · VP9 · EXATO (codificador)**, sem áudio: cada quadro entra no arquivo com o SEU tempo, e a exportação roda o mais rápido que a máquina desenha — o arquivo sai certo mesmo com efeito pesado. Se escolher MP4 neste modo, cai no gravador do navegador, que carimba pelo relógio (e aí a máquina precisa acompanhar) |
| **SEQUÊNCIA PNG · COM ALPHA** | quando precisa de transparência (tricô, cupom, recorte do perto, letras recortadas) ou vai montar o vídeo em outro programa | um PNG por quadro, com alfa real, num `.zip`. Até 1200 quadros |

**3. Formato, resolução, fps, taxa.** No modo frame a frame o formato
**EXATO (codificador)** é escolhido sozinho — é o único que não depende da
velocidade da máquina. Ele gera WEBM (VP9); se precisar de MP4, o gravador
do navegador continua na lista, ou converta o WEBM depois. Em tempo real,
MP4 H.264 abre em tudo e WEBM VP9 tem a melhor qualidade. 100% é a resolução da composição. 30 fps é o padrão; 24
dá a cadência de cinema; 60 só se a fonte for 60. Taxa de 8 Mbps serve para
1080p; 16 para o que tem muito grão, ruído ou datamosh (o codec do
navegador esmaga detalhe fino com taxa baixa — e o glitch É detalhe fino).

**4. Fundo.** MP4 e WEBM não guardam transparência: escolha PRETO, BRANCO ou
PAPEL para achatar. MANTER ALPHA só vale para a sequência PNG.

**5. Confira.** No fim, a janela mostra o vídeo e **mede a duração do
arquivo** contra a da composição: ✓ quando bate; "saiu curto" quando o
gravador perdeu quadros; "saiu longo" quando a máquina não desenhou no
ritmo. As duas coisas só acontecem com o gravador do navegador (tempo real,
ou frame a frame em MP4) — com o formato EXATO o arquivo bate sempre. Aí é
só BAIXAR.

**Se o vídeo saiu "com uns quadros só", parado ou aos pulos:**

* o download é um **.zip**? Então foi a SEQUÊNCIA PNG — que é só quadros
  mesmo, um PNG por quadro, para montar em outro programa. Para um vídeo,
  escolha FRAME A FRAME;
* foi em **TEMPO REAL** com efeito pesado (datamosh, várias camadas,
  profundidade)? A máquina não desenhou a tempo e o gravador gravou o que
  chegou: poucos quadros num arquivo do tamanho certo. Use FRAME A FRAME,
  que agora não depende da velocidade;
* foi em FRAME A FRAME com **MP4**? O gravador carimba pelo relógio: o
  arquivo sai esticado, com quadro repetido. Deixe no formato EXATO.

**Os efeitos novos na exportação:**

* **Datamosh** e os outros de realimentação (eco, acúmulo) saem certos nos
  três modos — o datamosh anda no relógio do codec (24 por segundo, ou o
  que estiver na ficha), então prévia e arquivo dão o mesmo resultado. Ele
  começa do quadro-chave no início do trecho.
* **Mapa de profundidade (I.A.)**: só sai certo em **FRAME A FRAME** ou
  **SEQUÊNCIA PNG** — antes de gravar, o exportador analisa cada quadro do
  trecho uma vez ("analisando a profundidade · quadro 12 de 300") e guarda
  o mapa; na gravação cada quadro usa o mapa dele. É lento (meio segundo a
  um por quadro, conforme a máquina): um trecho de 10 s a 30 fps leva uns
  3 minutos de análise. Em TEMPO REAL o mapa sai como na prévia — atrasado.
* **Rastreio de manchas** e **cupom** saem certos em qualquer modo.
* **PNG** do quadro atual, a qualquer momento, na resolução cheia — para o
  CRT e o cupom, é o jeito de olhar o ponto e a trama de perto.

---

## 02 · LABORATÓRIO DE ÁUDIO

> **O rack mudou de lugar.** Os módulos e seus controles agora ficam na
> **coluna da direita**, como a pilha de efeitos do vídeo e a ficha da
> tipografia — quem se ajusta vai para a coluna. O centro ficou só com o que
> se olha: a onda, o transporte e o analisador.
>
> **Módulo desligado mostra só o nome.** Ligar abre os controles; clicar no
> **nome** abre sem ligar, para espiar o que ele tem antes de pô-lo na cadeia.
> Com 34 módulos e três ou quatro em uso, é a diferença entre uma coluna
> navegável e uma parede.

Carrega arquivo, grava o **microfone**, gera um tom de teste ou puxa o áudio
de um vídeo já carregado no laboratório 01. Arrastar arquivo para dentro
também funciona.

Debaixo da onda fica o **espectrograma do arquivo inteiro**: o mapa de tempo
× frequência, na mesma régua da onda. A coluna de pixels que você olha é o
mesmo instante nos dois, e a seleção vale para os dois. É onde se enxerga o
sibilante, o zumbido de rede, onde a voz entra e onde o ruído de fundo sobe —
acha-se no mapa e corta-se na onda, no mesmo lugar.

Não confundir com o modo `ESPECTROGRAMA` do **analisador**, na barra de baixo:
aquele rola em tempo real e só existe enquanto toca. Este fica.

Arrastar na onda seleciona um trecho; `CORTAR NA SELEÇÃO` apara. Toda a
cadeia é reprocessada a partir do **áudio original**, sempre — nada é
destrutivo até você cortar.

### MONTAGEM — a linha do tempo do som

Na aba **TOOLS** da coluna, ao lado do sonógrafo e da cifra. É uma linha do
tempo **só de áudio**: várias pistas, vários trechos, arrastar para mover,
arrastar a borda direita para aparar, e sobrepor à vontade. Nasce com duas
pistas, `VOZ` e `TRILHA`, e dá para acrescentar quantas quiser.

`+ O ÁUDIO DA MESA` põe na montagem o som que está no laboratório, **já com a
cadeia de módulos aplicada**. O `M` de cada pista muda ela.

**Botão direito num trecho** abre o menu: cortar, duplicar, apagar e — o que
interessa — **mandar aquele trecho para uma pista de áudio do LAB 01**,
escolhendo qual pela lista (cada uma mostra quantos clipes já tem). Vai só o
pedaço aparado, na posição em que ele está na montagem. Se não houver
composição de vídeo aberta, ela é criada.

No pé, `MANDAR A MONTAGEM PRA TIMELINE` manda tudo de uma vez, misturado, e
`EXPORTAR WAV` salva a mistura no disco.

O que se ouve no ▶ é a **mistura inteira** — o mesmo material que sai nas duas
saídas.

**Cortar não copia som.** Os dois pedaços continuam olhando para o mesmo
áudio na memória, cada um com o seu ponto de entrada. Cortar dez vezes um
arquivo de trinta minutos não custa nada.

### FERRAMENTAS — os dois instrumentos que fabricam som

A coluna do laboratório de áudio tem uma aba **TOOLS**, ao lado de FONTE,
CADEIA e PRESETS. Ali não estão módulos do rack: estão máquinas que **fabricam
material novo**, e o que sai delas entra na linha do tempo ou na FONTE do rack,
para depois passar pela cadeia como qualquer outro som.

* **SONÓGRAFO** — transforma um vídeo em música: a linha fica parada e o que
  atravessa ela vira nota. Está descrito no laboratório 01, porque é lá que o
  vídeo está; o botão daqui abre a mesma janela.
* **CIFRA** — o instrumento abaixo.

### CIFRA — o campo harmônico à mão

Escolha um tom e uma escala, e **os acordes daquela tonalidade aparecem nas
pastilhas**. Aperte uma e sai o acorde inteiro, afinado. Não é preciso saber
qual é o acorde: se está na pastilha, está no tom.

```
TOM  C     ESCALA  Maior
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ 1/I  │ 2/ii │3/iii │ 4/IV │ 5/V  │ 6/vi │7/vii°│
│  C   │  Dm  │  Em  │  F   │  G   │  Am  │ Bdim │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

O rótulo de cima é o **grau**: o número e o algarismo romano dizem onde aquele
acorde mora na tonalidade — maiúsculo é maior, minúsculo é menor, `°` é
diminuto. É a mesma linguagem de qualquer songbook, e serve para você transpor
depois: `I – V – vi – IV` continua sendo a mesma progressão em qualquer tom.

**Trocar a escala refaz o campo inteiro.** Em Dó menor harmônica saem
`Cm Ddim D#aug Fm G G# Bdim` — repare no **G maior** no quinto grau, que é a
assinatura dessa escala. Em escalas de cinco graus aparecem cinco pastilhas, e
os acordes saem com `sus` em vez de terça: é o que aquela escala tem para dar.

**As três fileiras embaixo das pastilhas:**

* **TIPO** — quantas notas o acorde empilha: `tri` (tríade), `7`, `9`, `11`,
  `13`. Quanto mais alto, mais denso e mais jazz.
* **INVERSÃO** — a mesma harmonia com outro baixo. Trocar de acorde invertendo
  faz as vozes andarem pouco, e é o que deixa a sequência ligada em vez de
  saltada.
* **SECUNDÁRIA** — o empréstimo. `/V` põe a dominante daquele grau, `/IV` a
  subdominante, `/vii` a sensível. É a saída elegante do tom por um compasso —
  aperte `/V` sobre o segundo grau e depois toque o quinto: você acabou de
  fazer o caminho mais usado da música popular.

**No alto:** TOM, ESCALA, **OITAVA** (`–` e `+`), **LEGATO** e **INSTRUMENTO**
(as mesmas dez vozes do sonógrafo).

**LEGATO ligado**, a pastilha fica presa: o acorde continua soando até você
apertar outro. É o que permite trocar de harmonia com uma mão só e tocar a
melodia com a outra, no teclado. Desligado, soa só enquanto o dedo está nela.

**O teclado embaixo** toca nota solta, com o rato ou com o teclado do
computador. Os pontinhos verdes marcam as notas que pertencem à escala — quem
não sabe onde pisar, pisa nos pontinhos.

```
atalhos:  1 a 7            as pastilhas
          a w s e d f t g y h u j    o teclado, meia oitava
```

**Gravar e usar.** O **● GRAVAR** arma; o relógio só começa a contar **na
primeira nota**, para a peça não nascer com silêncio na frente. Toque à
vontade, aperte de novo para parar, e escolha o destino:

* **USAR NA COMPOSIÇÃO** — vira clipe de áudio na linha do tempo.
* **MANDAR PRO RACK** — vira a **FONTE** deste laboratório, e aí passa pela
  cadeia de efeitos que você já montou. É o caminho para gravar um piano limpo
  e devolvê-lo com reverberação, granular ou o que estiver no rack.
* **MIDI** e **WAV** salvam arquivo.

> **Uma progressão para experimentar:** deixe em Dó maior, TIPO `7`, e toque
> `2 → 5 → 1` (Dm7, G7, Cmaj7). Depois aperte `/V` e toque `2` antes de tudo:
> aparece um A7 que não é do tom e que puxa o Dm7 com força. É assim que se
> escreve música popular há cem anos.

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
celular. A banda é de verdade: **92% da energia cai dentro dela**, com uma
queda de 24 dB por oitava de cada lado.

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

São **60 ferramentas**, na coluna da esquerda, em **sete famílias que abrem e
fecham** — com busca por cima de todas. **Cada uma mostra o próprio efeito
numa miniatura ao vivo**, desenhada pelo mesmo motor que desenha o palco: o
que a prévia mostra é o que vai acontecer.

| família | quantas | o que é |
|---|---|---|
| **MESAS** | 2 | abrem uma folha por cima do palco, para trabalhar com a mão: `✂ LETRAS RECORTADAS` (cada letra é um pedaço de papel; clique e arraste) e `✎ ESCREVER À MÃO` (desenhe o traço com o mouse, a caneta ou o dedo, e a animação o escreve de volta). São as únicas que **ficam ligadas**: o item acende enquanto a mesa está aberta, e clicar de novo fecha. Abrir uma fecha a outra. |
| **FORMA** | 16 | o desenho da letra — base · onda · explosão · escada · rastro · contorno · corte · rgb · pilha · espelho · peso · ímã, mais as quatro de **TRAMA** (abaixo) |
| **TRAÇO** | 5 | a letra sendo escrita; só nas famílias `LAB` |
| **ENTRADAS** | 18 | como as letras chegam ao quadro |
| **SAÍDAS** | 5 | como as letras vão embora |
| **LAÇOS** | 10 | o que fazem enquanto estão no quadro |
| **PRONTOS** | 4 | entrada, laço e saída num jogo só: `TÍTULO` (entra do desfoque, respira, some) · `LEGENDA` (datilografa e apaga) · `IMPACTO` (estoura, treme e explode) · `CARTAZ` (persiana, arco-íris e cortina) |

**Clique no nome da família** para abrir ou fechar. **Alt+clique** deixa só
aquela aberta e fecha as outras seis. O que estiver aberto continua aberto
quando você voltar. Buscando, todas abrem — resultado de busca nunca fica
escondido atrás de uma dobra.

Na barra do laboratório, ao lado de `TELA` e `ANIMAR`, ficam os três
**comandos** — `EXPLODIR`, `ZERAR` e `ALEATÓRIO`. Não são ferramentas: agem
uma vez sobre o que já está no quadro.

### Desfazer, e voltar ao começo

**`Ctrl+Z` desfaz e `Ctrl+Y` refaz**, dentro da tipografia, sem precisar de
composição de vídeo aberta. Com uma **mesa** aberta, `Ctrl+Z` desfaz o gesto
dela — o último traço da caneta, o último arrasto de letra recortada — e não
o que você tinha mexido antes de abri-la.

**`ZERAR`** volta **tudo** ao estado inicial: fonte, corpo, peso, cor,
animação, deformação e trama. O texto fica — ele é seu, não é efeito. E o
próprio ZERAR entra no histórico, então `Ctrl+Z` traz tudo de volta.

**As duas mesas se movem.** Arraste pelo CABEÇALHO para tirá-las de cima das
letras; o lugar fica guardado. Duplo clique no cabeçalho devolve ao canto.

Para limpar só o desenho e manter fonte, cor e animação, use a ferramenta
**BASE** do catálogo — é outra coisa, e continua lá. Para zerar **uma letra
só**, selecione-a (na tira de baixo ou na tela) e use `ZERAR LETRA` no bloco
`LETRA` da ficha.

### TRAMA — quatro efeitos de quadro inteiro

Marcados com a etiqueta `TRAMA` na lista, e com placa própria na ficha. Não
são efeitos de LETRA como a onda ou a fatia: acontecem sobre a composição
inteira, depois de todas as letras desenhadas. Valem para **qualquer** família
tipográfica, e se somam entre si.

| | o que faz |
|---|---|
| **PERSIANA** | o quadro inteiro vira linha horizontal; onde a linha cruza a letra, ela engrossa. O fundo não fica limpo, fica pautado. Controles: espaço entre linhas, grossura na letra, grossura no fundo |
| **TIRAS** | o papel cortado em tiras verticais que se separam e escorregam. Controles: quantas, vão, escorregão, e **corte torto** — tira toda igual lê como grade, não como papel |
| **BRILHO** | a borda acende e o miolo fica no escuro. Controles: raio e força |
| **GRÃO** | ruído de impressão. Com **FUNDO TRANSPARENTE** marcado, o grão vale só onde há tinta — o fundo continua limpo para o png com alpha |

### A ficha da direita

Os controles vivem em **sete blocos que recolhem** — `TIPO`, `ANIMAÇÃO`,
`DEFORMAÇÃO`, `REPETIÇÃO`, `TRATAMENTO`, `COR` e `CURSOR` (mais `LETRA`, que
aparece quando há uma letra selecionada). Na primeira vez, só `TIPO` está
aberto; a partir daí manda o que você deixou. Os mesmos gestos da ficha do
clipe: clique no título recolhe, **alt+clique** deixa só aquele aberto, e as
setas `⌃` `⌄` no alto da coluna fecham e abrem todos.

**Cada número é uma linha só, e a linha é o controle.** A caixa se enche até
onde o valor está na faixa — **arraste em qualquer ponto dela** para mudar, ou
**clique no número** à direita para digitar o valor exato. Nos controles que
vão de negativo a positivo (entreletra, deslocar X, sombra X…), a barra sai do
**zero** e cresce para o lado que o valor tomou.

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
`Shift+\` enquadrar a seleção · `F` enquadrar a prévia · `0` prévia em 100% ·
`Ctrl`+roda (ou `Alt`+roda) zoom no cursor · `Shift`+roda rolagem horizontal ·
`ESPAÇO`+arrastar move a tela · barra de zoom embaixo da mesa: meio navega,
pontas aproximam, duplo clique enquadra

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
js/fx14.js                    CRT (o tubo, com os padrões da referência) e DATAMOSH (o codec)
js/fx15.js                    PAPEL TÉRMICO: a foto no cupom, em pontos de 203 dpi
js/fx16.js                    visão de máquina: MAPA DE PROFUNDIDADE (I.A.) e MANCHAS
js/profundidade.js            o analisador da profundidade: Depth Anything V2 no navegador
js/manchas.js                 o analisador das manchas: componentes conexos e rastreio
js/transitions.js             curvas de keyframe + 30 transições (família MOTION)
js/typefaces.js               12 famílias tipográficas desenhadas por código
js/gl.js                      motor WebGL2: plano de composição, cadeia por clipe
js/state.js                   modelo de edição não linear (pistas, clipes, keys)
js/media.js                   fontes, geometria de MOTION, plano para a GPU
js/view.js                    viewport: zoom, pan, fit, réguas
js/timeline.js                a mesa de edição
js/mosaico.js                 a grade do mosaico: geometria e montagem dos quadros
js/mosaicoui.js               a janela do mosaico: mapa, pincel de fontes, controles
js/musica.js                  núcleo musical: escalas, vozes, síntese, .mid, render
js/sonografo.js               sonógrafo: a linha parada e o detector do que cruza
js/sonografoui.js             a janela do sonógrafo: visor, régua, piano roll, mesa
css/sonografo.css             o chassi de metal do sonógrafo, no palco escuro
js/filmadora.js               filmadora: bitolas, a cadeia da película, as texturas calculadas, a gravação e os rolos
js/filmadoraui.js             a traseira da filmadora: visor, seletor, botões, gavetas, telinha
css/filmadora.css             o couro, o visor, o vermelho, a roda — em 1% da largura da máquina
js/aquarela.js                aquarela: 52 pigmentos (Kubelka-Munk), o papel, a simulação de água e pigmento na GPU, os quadros, o rolo e a fonte 'quadros'
js/aquarelaui.js              a mesa de luz: caixa de tintas, folha, luz, vegetal, tira de quadros, telinha, gaveta dos 52, modo código
css/aquarela.css              a madeira, a lata, o vidro aceso, a tira — em 1% da largura da mesa
js/cifra.js                   cifra: campo harmônico, acordes, inversões, gravação
js/cifraui.js                 a janela da cifra: pastilhas, teclado, gravador
css/cifra.css                 o corpo de marfim da cifra
js/panels.js                  catálogo, ficha da composição, máscara na prévia
js/motion.js                  MOTION, Effect Controls, gráficos, caixa na prévia
js/filters.js                 galeria de filtros com miniatura ao vivo
js/presets.js                 presets
js/exporter.js                exportação (vídeo, sequência PNG, zip, modo exato por WebCodecs)
js/webm.js                    o escritor de WebM do modo exato
js/audio.js                   laboratório de áudio
js/audiotrab.js               o trabalhador: a cadeia calculada fora da linha principal
js/type.js                    laboratório de tipografia
js/shell.js                   entrada ascii, boot, roteamento, cursor, status
js/app.js                     controlador do laboratório de vídeo
server.js                     servidor local sem dependências
build-arquivo-unico.js        gera a versão de arquivo único
build-lab2.js                 gera o lab2.html — a repaginação 2.0
lab2.html                     RGB_LAB 2.0: o index inteiro + 4 linhas
css/lab2.css                  o desenho do 2.0, sob :root[data-ui="2"]
js/lab2.js                    2.0: miniatura no clipe, etiqueta de pista
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
