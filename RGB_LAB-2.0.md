# RGB_LAB 2.0

**Repaginação, não reorganização.** Mesma estrutura do Classic, cada painel no
mesmo lugar, cada botão onde já se sabe procurar. O que muda é o desenho.

```
index.html    RGB_LAB CLASSIC   intacto — não carrega uma linha do 2.0
lab2.html     RGB_LAB 2.0       gerado por `node build-lab2.js`
css/lab2.css  o desenho novo, todo sob :root[data-ui="2"]
js/lab2.js    só o que o CSS não faz: miniatura no clipe, etiqueta de pista
```

---

## 1. As duas tentativas erradas, e por quê

**A primeira** montou uma casca nova e MOVEU os painéis para dentro dela,
deixando o resto num bloco escondido. A coluna da esquerda — fonte, catálogo,
filtros, estilos, presets — ficou invisível, e `js/lab2.js` forçava
`shell.go('video')` na entrada, então o índice dos três laboratórios nunca
aparecia. Não dava para achar nada.

**A segunda** manteve a estrutura mas trocou a paleta dos canais por
roxo/ciano/rosa, copiando a referência. Isso apagou o código de navegação do
laboratório — azul é vídeo, verde é áudio, vermelho é tipografia — que não é
escolha de paleta, é como o Bruno encontra as coisas.

O diagnóstico dele estava certo nas três vezes: *"mantendo tudo onde está"*.
Repaginar é trocar o desenho, não a arquitetura nem a identidade.

## 2. O que o lab2.html é

O `index.html` inteiro, com quatro linhas de diferença — e só:

```
+ <html ... data-ui="2">                      liga a folha nova
+ <title>rgb_lab 2.0 — …</title>
+ <link rel="stylesheet" href="css/lab2.css">
+ <script src="js/lab2.js"></script>
```

Conferido por diferença linha a linha: **259 ids nos dois arquivos, zero
faltando no lab2**. Nada movido, escondido ou removido.

O truque que faz uma folha repaginar metade do laboratório sem tocar numa regra
dele: o Classic desenha a partir de variáveis (`--paper`, `--ink`, `--rule`,
`--ch-video`…). Redefini-las sob `:root[data-ui="2"]` repinta tudo que as usa.
O resto são regras de forma — canto, pílula, cartão.

## 3. O desenho

**Sem moldura.** A janela flutuante da referência é recurso de mockup:
fotografa bem, mas custava 32px de cada lado e não devolvia nada. Numa mesa de
edição, largura é o recurso escasso. O respiro que sobrou vive DENTRO, entre os
painéis, que é onde ajuda a ler.

**Os três canais são azul, verde e vermelho.** Os tons não são os do papel: são
os que o próprio Classic já tinha afinado para o modo NOTURNO, em
`css/system.css` — já medidos contra fundo escuro.

```
vídeo   #5b86ff      áudio  #35c072      tipografia #ff5540
cursor  #ff9500      ok     #35c072
janela  #0e0e11      painel #17171c      elevado    #1f1f26
tinta   #f2f2f5      2ª     #9d9daa      3ª         #6b6b78
```

`--accent` de propósito NÃO é definido na folha do 2.0: quem manda nele é a
regra `[data-lab]` do Classic, que já troca o canal ativo a cada vista.
Defini-lo aqui empataria em especificidade e, por vir depois, venceria — e o
laboratório inteiro ficaria de uma cor só.

**Vocabulário de forma**, tirado das referências:

```
painel é bloco escuro com canto de 14px e respiro em volta
aba, etiqueta e chip são PÍLULA
a faixa da linha do tempo é pílula grande COLORIDA pelo canal
clipe é cartão arredondado com MINIATURA dentro
cursor de reprodução é laranja, com alça arredondada
tipografia sans em caixa baixa; monoespaçada só em número técnico
```

## 4. O que `js/lab2.js` faz (e só isso)

- **miniatura dentro do clipe**: uma folha de 12 quadros por FONTE, lida com um
  elemento de vídeo próprio (mexer no da fonte arrastaria a prévia junto),
  recortada por clipe conforme o trecho que ele usa. Roda a cada redesenho da
  mesa, inclusive durante arrasto;
- **etiqueta curta da pista** (`MEDIA 1`, `AUDIO 1`, `FX 1`), escrita como
  atributo para o CSS desenhar.

Se este arquivo não carregar, o laboratório funciona igual — só sem miniatura.

## 5. Acabamento

Coisas que só aparecem olhando a tela, e que separam "escuro" de "acabado":

- barra de rolagem fina, escura e arredondada — antes vinha clara do sistema e
  cortava cada painel com uma faixa branca;
- o filete de canal do cartão acompanha o canto arredondado;
- anel de foco visível, na cor do laboratório aberto — navegar por teclado num
  tema escuro sem anel é navegar às cegas;
- `ON`, cadeado e `✕` da ficha viraram controles de estado discretos: herdavam
  o botão grande e competiam com o nome do clipe;
- as três janelas (exportar, mesa, mosaico) receberam o mesmo canto e o mesmo
  filete dos painéis;
- o chip do canal saía por cima do rótulo do cartão. Em tela larga há recuo do
  tamanho do maior chip; em tela estreita ele sai do canto e entra na coluna —
  some a colisão em vez de administrá-la.

## 5b. A ficha da direita (referência 03)

No Classic a linha de propriedade é rótulo à esquerda, campo estreito à
direita, filete separando. Numa ficha com dezenas de linhas isso vira lista de
texto — e o pedido era *propriedades contextuais*, não *tabela*.

Na referência **a linha É o campo**: caixa arredondada com o rótulo embutido à
esquerda e o valor à direita. O truque para chegar lá sem tocar no HTML é que
quem vira a caixa é a própria `.prow`; o campo por dentro perde fundo e borda e
fica só com o número.

**Campo e cursor viram uma peça só.** O controle deslizante vinha numa linha
separada, solto embaixo, e o olho lia dois objetos onde há um. Encaixado no pé
do campo (via `:has(+ .prow-slider)`), ele deixa de ser um segundo controle e
passa a ser a leitura de onde o número está na faixa.

O **losango de keyframe** era o controle mais importante da ficha e o mais
apagado: um caractere de 10px com filete. Virou alvo redondo de 20px que acende
na cor do laboratório quando a propriedade está animada.

**Dois defeitos de especificidade, achados por medida:**

- a coluna do rótulo colapsava a ZERO. `1fr auto 22px` parece certo, mas um
  `<input>` tem largura intrínseca (~146px); com `auto` a coluna do campo pegava
  tudo e o `1fr` ficava com 0. Medido: colunas resolvidas em `0px 145.6px 22px`,
  e o nome da propriedade sumia da tela. A coluna do campo passou a ter medida
  fixa, como no Classic;
- a linha do NOME DO CLIPE herdou as três colunas: `.prow.wide` do Classic tem
  especificidade 0,2,0 e a regra nova tinha 0,3,0. O campo ficava com ~100px e
  cortava o nome. Especificidade não se resolve com ordem.

## 5c. A coluna da esquerda (referência 04)

Ela empilhava tudo — a grade FONTE, quatro abas e o catálogo, um debaixo do
outro — e a lista de 147 efeitos sobrava com um terço da altura. Em texto.

Agora há uma **torre de ícones** à esquerda (MÍDIA · EFEITOS · FILTROS ·
ESTILOS · PRESETS) e cada categoria abre a coluna ao lado **inteira**: a lista
passou de um terço para os 577px cheios.

**A torre não substitui as abas: ela CLICA nelas.** `VE.panels.showTab` é a
mesma função que a aba antiga chama, e as abas continuam no documento e
continuam funcionando. Quem já usa por lá não perde nada.

**Os 147 efeitos ganharam miniatura.** A galeria de FILTROS já tinha miniatura
ao vivo desde sempre; a de efeitos era texto — e nome mais uma linha de
descrição não bastam para escolher entre "erosão" e "campo de movimento".

A conta é a mesma dos filtros, então `js/filters.js` passou a **expor** a
máquina (`VE.filters.mini`): o renderizador pequeno, a carta de referência para
quando não há mídia no cursor, e o desenho de uma cadeia sobre a fonte. Nada
foi duplicado, e a mudança é aditiva — os 52 filtros continuam com as 52
miniaturas vivas no Classic.

**Sob demanda, e este é o ponto:** desenhar as 147 de uma vez é compilar 147
shaders no mesmo quadro, e a página trava. Um `IntersectionObserver` enfileira
só o que entrou na tela e a fila pinta **três por quadro** — o custo real é a
compilação na primeira aparição de cada efeito, e ela não dá para dividir.
Medido: 24 miniaturas prontas ao abrir a aba, 78 depois de rolar, nenhuma em
branco.

## 5d. Uma torre POR LABORATÓRIO, e nenhuma no índice

A primeira torre foi montada uma vez só, com as categorias do vídeo, e
aparecia no índice e nos outros dois laboratórios — onde nenhum daqueles
botões faz sentido.

Agora as categorias saem das seções que a coluna daquele laboratório já tem:

```
ÍNDICE       sem torre — a coluna ali é sumário, não catálogo
VÍDEO        MÍDIA · EFEITOS · FILTROS · ESTILOS · PRESETS
ÁUDIO        FONTE · CADEIA · PRESETS
TIPOGRAFIA   LETRA · PRESETS · SAÍDA
```

A torre se refaz a cada troca de laboratório (embrulhando `VE.shell.go`) e
guarda qual categoria estava aberta em cada um, então voltar não perde o lugar.

## 5e. O aviso de sessão guardada, e o acabamento iOS

O aviso vinha com o vocabulário do Classic — barra de largura quase inteira,
filete de 2px, sombra dura deslocada, caixa alta monoespaçada — e, encostado no
cabeçalho, **tapava a navegação entre laboratórios**.

Virou cartão flutuante no pé da tela: canto de 16px, fundo translúcido com
desfoque, sombra difusa, botão principal cheio na cor do canal. É o vocabulário
de um alerta de sistema, não de uma faixa de aviso.

O mesmo tratamento foi para o que FLUTUA — janelas, menu de contexto, toast:
vidro com desfoque. O que é chassi continua opaco; misturar os dois é o erro
que faz interface escura parecer borrada.

Mais: transição de mola curta no hover (sem ela o estado muda em corte seco e a
tela parece documento), leve recuo ao pressionar, e **controle segmentado** de
verdade nas abas e no claro/noturno — trilha com uma pastilha destacada, como
no iOS. Os chips de família saíram de duas colunas espremidas para fileira que
quebra sozinha.

## 5f. Dois modos, respiro, e três defeitos

**MODO CLARO.** O Classic já tinha o interruptor (`data-mode` no `<html>`); o
2.0 só tinha desenho escuro, e apertar CLARO não fazia nada. Agora os dois
existem e a chave é a mesma. O escuro ficou **mais escuro** — chassi em
`#08080a`, painel em `#121216` — porque vidro sobre fundo claro demais vira
leite. O claro segue a referência: mesa `#ececed`, painel branco.

**Respiro.** Na referência o que separa um bloco do outro é o VÃO, não a linha.
Filete fora, vão de 10px entre painéis, canto de 16px, sombra interna de 1px.

**O vidro só no que FLUTUA** — janelas, menu, toast, aviso, e o cabeçalho de
placa que fica grudado enquanto o conteúdo rola. Vidro em painel fixo não é
elegante, é borrão.

### Os três defeitos

**1. A coluna da tipografia quebrada.** As 56 ferramentas de lá usam a MESMA
classe `.fxitem` da lista de efeitos do vídeo. Quando `.fxitem` virou cartão
com miniatura, a coluna da tipografia virou 56 cartões vazios de proporção 4:3.
A regra do cartão passou a ser `#fxList .fxitem` — nome de classe não é
contrato de dono. Conferido: 54 ferramentas, 39px cada, em lista.

**2. O cartão que colapsava.** Todas as fileiras da grade saíam com **1,6px** e
os cartões ficavam invisíveis, mesmo com a miniatura dentro medindo 174×131 e
já carregada. É a dependência circular do `aspect-ratio` com coluna `1fr`: a
altura do cartão depende da imagem, a largura da imagem depende da coluna, e a
coluna depende do conteúdo. O navegador degenera para quase zero em vez de
errar alto. Quebrado com altura fixa na miniatura — e de quebra os cartões
ficam todos iguais, como na referência. Agora: 84×114.

**3. A busca desproporcional.** Vinha do Classic como faixa da largura inteira,
filete embaixo e caixa alta — do tamanho de um cabeçalho de seção. Virou pílula
de 34px (5,5% da altura da coluna). E o `<input>` dentro dela vazava: largura
intrínseca de 166px numa pílula de 113. `min-width:0` é o que faz um item de
flex aceitar ser menor que o próprio conteúdo.

**Um quarto, de 0,4px:** duas colunas de cartão cabiam por pouco e a grade
desistia — `minmax(84px,1fr)` com vão de 8 pede 176px e havia 175,6. O mínimo
desceu para 78.

## 5g. O visor e a mesa, retrabalhados

As duas peças que o Bruno usa o tempo todo, e as duas que ainda tinham o
desenho do Classic por baixo da pintura.

### A GRADE DO VISOR — não existia

O laboratório não tinha grade: nem terços, nem área segura. Nas referências ela
é o que transforma a prévia em **mesa de enquadramento** — dá para ver se o
horizonte está torto e se o rosto caiu na linha.

Ela é medida a partir do **canvas**, não do palco. Grade que cobre o palco é
enfeite por cima do vídeo; grade que cobre o quadro é ferramenta. Como o canvas
muda de tamanho a cada zoom e a cada troca de tela, a medida acompanha.

Quatro estados num botão só, ao lado de PX: **desligada → terços → grade fina →
área segura**. Um botão com quatro paradas cabe na barra; quatro botões não.
Conferido: encaixa no quadro (558×314 = 558×314) nos três estados ativos.

### O CLIPE mostra o que tem dentro

A miniatura ocupa o clipe **inteiro**. Na versão anterior eu tinha posto uma
máscara que mostrava só os primeiros 46px e pintava o resto de azul — era a
tarja colorida com um nome escrito em cima, exatamente o que a referência não
faz. Medido: miniatura de 218px num clipe de 218px.

O nome saiu de cima da imagem e virou **pastilha de vidro** no canto — legível
sobre qualquer quadro. O que é ESTADO (selecionado, travado, mudo) virou anel e
pastilha, nunca uma segunda cor de fundo competindo com a imagem: selecionado é
anel na cor do canal, e as alças de aparo só aparecem no clipe sob o cursor ou
selecionado.

### O resto

Faixa da pista com canto de 12px e respiro de 4px em volta do clipe; cabeça de
pista em pastilha com a etiqueta curta; régua mais leve, com o traço menor
apagado; visor com sombra projetada em vez de moldura, e a leitura flutuante em
pastilha de vidro.

Conferido: **nenhuma colisão** entre controles na barra do visor, no transporte
e na barra da mesa.

## 5h. O player

O Bruno apontou: *"o botão de play está pequeno e pra cima do círculo"*. Ele
estava certo, e a causa não era o CSS.

**O transporte usava CARACTERES** — `⏮ ◀ ▶ ⏭ ❚❚` — e caractere não é ícone:
cada um traz a própria métrica, a própria linha de base e a própria largura.
O triângulo do `▶` vem desenhado alto e estreito dentro do bloco do tipo. Não
existe CSS que centre o que o tipo já desenhou torto.

Agora são **formas SVG no mesmo quadro de 24×24**, o que dá aos cinco botões o
mesmo peso óptico e o mesmo centro. Medido: desvio de **0,00px** nos dois eixos,
em todos, e nos dois estados do botão de tocar.

Círculos de 38px para os quatro, **52px cheio** para o de tocar, grupo
centralizado na barra (154 = 154), timecode com peso de leitura principal à
esquerda, e os atalhos (CAM, MESA, MOSAICO) discretos à direita — a arrumação
das referências 02 e 05.

### Dois defeitos no caminho

**O laço infinito.** O `js/app.js` reescreve o texto do botão de tocar (troca
entre `▶` e `❚❚`), então um SVG fixo seria apagado. Pus um observador para
acompanhar a troca — e ele reagia à própria escrita: observador escreve,
escrita é mutação, mutação chama o observador. **Travou a página** na primeira
medida, duas chamadas seguidas estouraram o tempo. Duas defesas: só escreve
quando o estado mudou de verdade, e o observador não olha a subárvore.

**O botão FIM numa segunda fileira.** A regra da barra que dobra deixava o
grupo quebrar por dentro, e o quinto botão ia parar 51px abaixo dos outros
quatro. Os cinco são UM controle, não cinco: não dobram. Medido depois: os
cinco centros verticais em 422.

## 5i. O transporte enxuto

O bloco de CAM até MONTAR saiu da barra: ele repetia o que a coluna da esquerda
já oferece, e o preço era a altura da tela de projeto. Conferido **um por um**
antes de esconder:

```
ABRIR     #camToggle → WEBCAM  #srcCam       na grade FONTE
ESCANEAR  #mesaAbrir → SCANNER #srcMesa      na grade FONTE
MONTAR    #mosAbrir  → MOSAICO #srcMosaico   na grade FONTE
— FPS     #fpsBadge  → FPS     #stFps        na barra de estado
```

**Mas FRAME (`#camGrab`) e GRAVAR (`#camRec`) existem UMA VEZ SÓ no documento
inteiro.** Esconder o bloco todo deixaria as duas inalcançáveis: congelar um
quadro da câmera e gravar a câmera sumiriam do laboratório.

Então o grupo da câmera não some — ele **aparece quando a câmera está aberta**,
que é o único momento em que FRAME e GRAVAR querem dizer alguma coisa. Com a
câmera fechada eles só respondiam *"abra a câmera primeiro"*.

O sinal já existia e nada em `js/app.js` precisou mudar: ele põe `dot-live` (ou
`dot-rec`) no `#camDot` ao abrir, e o CSS lê isso com `:has()`.

Medido em 1500px:

```
câmera fechada   transporte 52px (uma fileira) · visor 339px
câmera aberta    FRAME e GRAVAR voltam · grupo com fundo próprio
gravando         o grupo fica avermelhado
fechou           volta a 52px
alcançáveis      WEBCAM · SCANNER · MOSAICO na FONTE · FPS na barra de estado
```

A tela de projeto ganhou **52px** de altura no uso normal.

## 5j. Três ajustes de medida

**O botão de tocar vazava a barra.** Tinha 52px numa fileira de 52px: sem sobra
nenhuma, e qualquer sombra o empurrava para fora em cima e embaixo. Um botão
precisa de ar em volta para PARECER centrado, mesmo quando a conta fecha.
Agora: fileira de 60px, botão de 44px, 8px de folga de cada lado, centrado na
barra e o ícone a 0,00px do centro.

**O filete de canal ao lado da tela saiu.** No Classic ele é a marca do
laboratório: tarja de 3px colada na borda esquerda de quase tudo. Fazia sentido
num layout de blocos encostados — era a única coisa que separava um do outro.
No 2.0 os painéis são cartões separados por vão, e a cor do canal já está no
cabeçalho, na seleção, no clipe e no cursor. O filete virou repetição.

**O realce dos botões estava grande.** `.zbtn` e `.tbtn` ocupavam a altura
inteira da fileira, então o fundo do hover era um bloco de 30px para um texto
de 11px. O realce deve caber no rótulo, não na fileira: 26px na barra do visor,
24px na mesa.

### O mesmo erro, duas vezes

Os dois primeiros ajustes não pegaram de primeira, e pelo mesmo motivo:

- o botão de tocar saiu **44×34**. Ele tem as duas classes (`l2circ` e
  `l2play`), as duas regras têm a mesma especificidade, e a de `l2circ` vinha
  depois — ganhou a altura;
- o realce ficou em **30px** mesmo com `height:26px`: quem mandava era o
  `min-height:var(--row)` da barra que dobra, aplicado a todo filho direto.
  Altura menor que o mínimo não existe.

Empate de especificidade se resolve por ordem, e `height` não vence
`min-height`. Duas regras que eu deveria ter escrito de cabeça, e que só a
medida mostrou.

## 5k. A faixa do laboratório, e o player finalmente centrado

### A FAIXA

O trilho da esquerda já carregava o texto certo — `LAB 01 · VÍDEO · BLUE`,
escrito por `js/shell.js` a cada troca de vista — mas em cinza sobre cinza, com
26px de largura e corpo de 9px. Era informação escondida numa tira.

Agora é **a faixa**: cor cheia do laboratório, letra branca, Helvetica, corpo
12px, largura 34px. Some a necessidade de procurar em que mesa você está — a
borda da tela inteira responde. E como a cor vem de `--ch`, ela troca sozinha.

```
vídeo       rgb(75,123,255)   LAB 01 · VÍDEO · BLUE
áudio       rgb(34,169,92)    LAB 02 · ÁUDIO · GREEN
tipografia  rgb(242,69,61)    LAB 03 · TIPOGRAFIA · RED
índice      neutra — ali não há canal, e fingir um seria mentir
```

### O PLAYER: duas causas, nenhuma era margem

Ele continuava colado no canto, e eu tinha atribuído a margens automáticas
brigando. Errado nas duas vezes.

**Primeira causa: ORDEM.** O preenchedor `.barra-dobra::after` — aquele que
leva o filete até o fim da fileira — não tem `order`, e `order:0` vem ANTES de
tudo que eu numerei de 1 a 4. Ele entrava como primeiro item, crescia com
`flex:1` e empurrava a fileira inteira para a direita. Medido: **229px de vazio
à esquerda**, e todas as margens automáticas resolvendo em `0px` porque já não
sobrava espaço livre para elas distribuírem.

**Segunda causa: a ordem de resolução do flexbox.** Tirar o preenchedor da
frente resolveu metade — o grupo saltou de **+112 para −111**, do canto direito
para o esquerdo. Porque o flexbox resolve `flex-grow` ANTES das margens `auto`:
o `::after` continuava comendo todo o espaço livre, e quando chegava a vez das
margens não havia mais nada. **Os dois mecanismos não convivem na mesma
fileira.** No transporte quem centra são as margens, então o preenchedor não
cresce ali — e ele nem faz falta, porque o transporte já não tem filete embaixo.

Depois das duas: **desvio 0 do grupo e 0 do botão de tocar**.

```
[00:00.00  352→549]   [transporte 660→884]   [LOOP 996→1083] [VOL 1083→1192]
barra 346→1198 · centro 772 · centro do grupo 772
```

O texto da faixa também não pegou de primeira: `#railView{color:var(--ch)}` é
seletor de ID (1,0,0) e o meu era de classe (0,2,0). **ID vence classe, não
importa a ordem** — a mesma família de erro do `min-height`.

## 5l. Os três cartões do índice

**Canto reto.** Eles são a porta de entrada dos três laboratórios, e porta se
reconhece pela forma. Arredondados, viravam mais três cartões iguais aos
outros; retos, voltam a ser um bloco.

**A faixa do canal foi de 5px para 14px** (18px no hover). Ela é a identidade
do cartão — com 5px competia com o filete de estrutura em vez de mandar nele.

**O gif de cada laboratório entra atrás, em ASCII branco.** É a mesma linguagem
da tela de entrada — o laboratório se apresenta em texto antes de mostrar
imagem — e é o que faz três vídeos diferentes parecerem a mesma família. Os
arquivos vieram de `REFERENCIAS/LAB 0N.gif` para `assets/labs/lab0N.gif`
(6,3 MB no total).

A leitura é feita numa grade pequena — uma célula por caractere, não pixel a
pixel — e o desenho é **uma chamada de texto por LINHA**: com 46 colunas e 31
linhas isso é 31 chamadas em vez de 1426, por cartão, por quadro. Medido: os
três cartões juntos custam **1,13ms por quadro**, 3% do orçamento de 30fps.

Se o gif não carregar — e no arquivo único ele não carrega, porque lá não há
pasta de assets — o cartão volta sozinho para a animação procedural que sempre
teve. Nada quebra, só muda de desenho.

**O defeito que levou três tentativas: o ascii saía correto e PARADO.**

A primeira versão desenhava a `<img>` do gif num canvas e contava com o
navegador para trocar de quadro — capturar o que está NA TELA em vez de
decodificar. Funciona, mas só enquanto a página está **pintando**: gif fora da
tela não anima, `display:none` não anima, aba em segundo plano não anima.
Tentei três esconderijos — nunca anexado, `left:-10000px`, três pixels quase
transparentes no canto — e nos três o gif ficou travado no primeiro quadro.

Pior: numa das medições eu li "animando: SIM" e era **falso positivo**. O que
mudava no canvas não era o gif; era a animação procedural do Classic
desenhando por cima, no mesmo canvas. O ascii ganhou canvas próprio, e aí ficou
visível que ele nunca tinha se mexido.

A correção não é achar um esconderijo melhor: é parar de pedir ao navegador.
`ImageDecoder` lê os quadros **do arquivo**, com a duração de cada um, e o
relógio passa a ser o `performance.now()`. Nada disso depende de o gif estar
visível nem de o compositor rodar. Medido: 22 quadros de 40ms, e o ciclo
inteiro passa na tela — cobertura de tinta variando de 0% a 39%, média 19%,
22 leituras e 22 valores distintos.

Duas armadilhas no caminho, as duas medidas:

- `dec.completed` **não basta**. Ele diz que os bytes chegaram; quem diz que a
  lista de quadros existe é `dec.tracks.ready`. Só com o primeiro,
  `selectedTrack` vem nulo — `Cannot read properties of null`.
- a luminância saiu **dividida por 255 duas vezes** (o alfa já vinha
  normalizado). Todo caractere virou espaço: o ascii desenhou 0 pixels de tinta
  e o cartão parecia vazio.

Os quadros ficam guardados já pequenos — 128×88, perto da grade de caracteres,
não do tamanho do gif. Os três somam 3 MB; guardados no tamanho original seriam
perto de 100 MB.

O enquadramento é resolvido no espaço do **cartão**, não no da grade: a célula
de texto é mais alta que larga, e conciliar as três formas (gif, cartão,
célula) na grade espremeria o desenho na horizontal.

O nome e o texto ficam em `z-index:2` com sombra curta, então a trama nunca
come a leitura — conferido nos dois modos, sem corte.

## 5m. Três defeitos que os cartões ainda tinham

**Uma barra colorida só.** O chip "CANAL BLUE" era um bloco de cor cheia de
83×19 no alto do cartão. Com a faixa vertical alargada para 14px, os dois liam
como duas barras coloridas no mesmo cartão — e a faixa é que tem esse papel:
ela atravessa o cartão inteiro e não precisa de reforço. A palavra fica, a
tarja sai. Medido depois: **um** bloco colorido por cartão, `lab-bar 14×286`.

**A caixa clara em volta dos três** era o fundo que eu tinha posto na grade
para pintar o vão de 2px entre os cartões. Fundo de container vira moldura.
Agora o vão é vão: nada pintado, 20px de respiro, três blocos separados.

**O nome estava sendo raspado.** A caixa de glifo pede 31px e a entrelinha dava
28,8 — com `overflow:hidden`, sobravam 2px cortados: o acento de "Áudio", o de
"Vídeo" e o rabo do "p" de "Tipografia". Não era caso de encolher a letra; era
a entrelinha apertada demais para o corpo.

**E um que eu mesmo criei:** declarei um buffer com o nome `grade`. Já existia
uma função `grade()` no mesmo escopo do arquivo, a do enquadramento do visor,
e o `var` içado apagou ela: o laboratório de vídeo parava com
`grade is not a function`. Mesmo arquivo, mesmo escopo, um nome só. É o mesmo
erro do `id="snapBtn"` duplicado, noutra camada.

## 5n. Por que o gif não aparecia — e por que a conversão em ascii estava errada

**O defeito, achado na aba de rede e em nenhum outro lugar:**

```
GET /assets/labs/lab01.gif       → 200 OK    ← o teste que o JS fazia
GET /css/assets/labs/lab01.gif   → 404       ← o que o CSS realmente pedia
```

Um `url()` dentro de variável CSS resolve pela **folha de estilo que a
consome**, não pelo documento nem por quem escreveu a variável. `--l2gif` é
escrita em js/lab2.js e lida em css/lab2.css, então o navegador procurava em
`css/assets/labs/`. Falha silenciosa: 404 sem erro no console, sem exceção,
sem nada — e o `new Image()` de verificação resolvia pelo DOCUMENTO, onde o
arquivo existe, e devolvia 200. **A verificação passava e a tela ficava
vazia.** Só a rede contava a verdade.

Resolvido com `new URL(url, location.href).href`: o caminho sai absoluto e
deixa de importar de qual arquivo .css a variável é lida.

**Não era tamanho.** Os três gifs somam 6,3 MB e o servidor entregava os três
com 200 desde o começo. Hospedar fora não resolveria nada — resolveria menos,
porque o projeto é local-first e um link externo troca um defeito de caminho
por uma dependência de rede.

**E a conversão em ascii estava errada de partida.** Eu vinha lendo o gif e
desenhando ele como ascii branco. Isso fundia duas camadas que têm funções
diferentes e jogava fora a cor — que é justamente o que o gif tem a
acrescentar. Agora são três camadas, na ordem:

```
0   o gif, colorido, cobrindo o cartão          — a matéria
1   o canvas do Classic, na cor do canal        — a assinatura
2   nome e texto
3   a faixa do canal e a seta
```

O gif entra por `background-image` num pseudo-elemento em vez de `<img>`:
assim o degradê que segura a leitura do texto mora na MESMA camada, sem custar
um terceiro elemento por cartão. Os pontos, a onda e as letras voltaram a ser
os de sempre, desenhados pelo js/shell.js, em `mix-blend-mode:screen` para
lerem como luz sobre o gif em vez de tinta tapando ele.

**Nada cruza a faixa.** O canvas é dimensionado pelo js/shell.js com a largura
cheia do cartão, e mexer nisso seria mexer na engine. `clip-path:inset(0 0 0
14px)` resolve por fora: o desenho continua saindo igual, só não aparece em
cima da faixa. O gif começa no mesmo 14px, e a faixa vai para `z-index:4`.

*Fica registrado o caminho inteiro porque ele custou:* três esconderijos para o
`<img>` (nunca anexado, `left:-10000px`, três pixels transparentes), um falso
positivo — eu li "animando: SIM" e o que se mexia era a animação do Classic
desenhando no mesmo canvas —, um decodificador `ImageDecoder` inteiro, e uma
luminância dividida por 255 duas vezes que fez todo caractere virar espaço.
Tudo isso para um problema que era um caminho relativo. **A lição não é sobre
gif: quando a verificação passa e a tela não muda, a verificação está olhando
para outro lugar.**

## 5o. A coluna da esquerda cortava o fim das linhas

Medido: `.folder` tem 268px — a largura cheia da coluna — mais 10px de margem
de cada lado. Pede 288 numa caixa de 268, e como `.side-pane` é
`overflow:hidden`, os 10px da direita eram cortados. Sem aviso: a linha
acabava rente à borda, sem respiro e sem fim visível. O mesmo acontecia com
`.man-card`, `.side-tabs` e `.cat-search`.

A causa é a soma de duas regras certas separadas: o `width:100%` que vem do
system.css e a margem lateral que eu acrescentei para dar ar. `width:100%` não
desconta margem — ela é somada por fora. `width:auto` faz o contrário:
preenche o que SOBRA depois das margens. Mesma intenção, escrita do jeito que
a caixa entende.

Conferido nas quatro telas: `scrollWidth == clientWidth` em todas.

## 5p. O cartão perguntava a medida errada — duas vezes

**A grade.** O Classic troca para uma coluna em `@media (max-width:900px)`, que
pergunta a JANELA. Mas quem aperta o cartão são as duas colunas laterais, não o
monitor: numa janela de 1000px a área da grade tem 372px e os três cartões
ficam com **93px cada**. Tudo cortado, e nenhum media query dispara. `.home`
virou contêiner e a grade pergunta a ele: acima de 596px de área, três colunas;
abaixo, uma. Nunca duas — com três itens, duas colunas deixam o terceiro
sozinho embaixo, e um índice de três portas com uma porta desgarrada parece
defeito.

**O recuo.** Numa janela de 1280px o cartão fica com 177px, e 34px de recuo à
esquerda mais 22 à direita comem 56 — um terço do cartão virando moldura.
Sobram 121px e "01 / LABORATÓRIO" pede 128.

A primeira tentativa foi apertar o recuo dentro de `@container`, e não pegou:
**um contêiner não consulta a si mesmo.** `@container` olha o ancestral mais
próximo, então lá dentro dá para mexer no nome e no texto — que são
descendentes — mas nunca no recuo do próprio cartão. Medido: a letra encolheu e
o recuo ficou nos mesmos 34px.

Percentual dispensa consulta, porque já se refere à largura do cartão:
`clamp(26px, 13%, 40px)` à esquerda e `clamp(14px, 8%, 24px)` à direita. Piso
para o recuo não sumir no estreito, teto para não virar moldura no largo.

Conferido em quatro larguras de janela — 1000, 1150, 1280, 1440 e 1600 — com
cartões de 320 a 287px: **nenhum corte de texto em nenhuma delas.**

## 5q. A animação vira ASCII, sem virar uma segunda cópia dela

O gif entrou colorido; por cima dele, a animação de cada cartão passa a
aparecer em CARACTERES em vez de forma cheia — os pontos do 01, a onda do 02,
as letras do 03, cada uma na cor do seu canal.

**Ela não foi reescrita.** Dava para escrever as três animações de novo aqui,
em versão ascii, e seriam duas cópias da mesma ideia envelhecendo em arquivos
diferentes: mexer no desenho do Classic deixaria de mexer no do 2.0. Em vez
disso o canvas do Classic virou a FONTE — desenha escondido, é encolhido até o
tamanho da grade de caracteres e convertido. Qualquer mudança lá aparece aqui
de graça.

Encolher com `drawImage` é o que dá as meias-tintas: uma linha de 1,5px
reduzida cinco vezes não vira "tem ou não tem", vira cobertura fracionada — e é
dela que sai a rampa em vez de um liga-desliga. A densidade vem do ALFA e não
da luminância: o Classic desenha numa cor só sobre transparente, então o alfa é
exatamente quanto da célula foi pintado. A cor quem põe é o 2.0, do canal.

**Ganho e gama, medidos.** O alfa que chega na grade tem média 0,08 e máximo
0,64: a rampa crua usaria só o terço de baixo — 72% das células caíam em espaço
e o caractere mais forte que aparecia era `*`, uma vez em 2975. Com ganho 2,4 e
gama 0,8 a cobertura foi de 5% para 16/21/4% nos três cartões. A zona morta
segura o fundo: célula praticamente vazia continua vazia, e é ela que preserva
o pontilhado em vez de encardir o cartão inteiro.

**Duas otimizações, as duas medidas:**

```
tabela de 256 entradas no lugar do Math.pow por célula
uma leitura para os três cartões no lugar de três      13,01ms → 8,06ms
20fps no lugar de 30 (é textura de fundo)              ~5,4ms por quadro médio
```

`getImageData` custava 1,36ms por cartão — e não pelo tamanho (2975 pixels),
mas porque cada chamada é uma parada para buscar o que está do outro lado.
Empilhando as três fontes num canvas só, a parada acontece uma vez.

Conferido: grade de 85×35, tinta exatamente na cor do canal
(`75,123,255` / `34,169,92` / `242,69,61`), oito leituras e oito quadros
distintos nos três cartões, e o canvas do Classic escondido assim que o ascii
entra.

## 5r. Três acabamentos

**A grossura da coluna, por laboratório.** Uma medida só para as quatro telas
não serve: o índice tem uma lista de pastas e o vídeo tem a torre de ícones
MAIS o catálogo ao lado. Agora a largura fica guardada NA TELA em que foi
arrastada — sair do vídeo e voltar devolve a largura do vídeo. Padrão: 214px no
índice, 320px nos laboratórios. O js/app.js segue dono do arrasto; o 2.0 só lê
o valor depois que o dedo levanta. Conferido: arrastar no vídeo para 392
guardou `{"video":392}` e não mexeu no índice nem na tipografia.

**O topo, sem fundo no hover.** A pílula cinza que acendia atrás do rótulo
dizia a mesma coisa que a pílula do item ATIVO, com outra cor — duas pílulas
parecidas para dois estados diferentes é o que faz alguém não saber em que tela
está. Agora o hover é só movimento: número e palavra crescem juntos, com
`transform`, que não ocupa espaço e não empurra os vizinhos.

**O botão de modo não acendia.** Medido: os dois lados tinham exatamente o
mesmo fundo — `rgb(255,255,255)` no claro, `rgb(18,18,22)` no noturno. A única
diferença entre ligado e desligado era o tom da letra. `--l2-panel` (o
"ligado") e o fundo da trilha caíam na mesma cor neste tema: o CSS estava certo
e o resultado, invisível. Agora as três peças são explícitas e não podem
colidir — trilha afundada, pastilha acesa mais clara que ela com halo curto,
lado apagado apagado de verdade.

*E uma armadilha de MEDIÇÃO, que quase virou um bug inventado:* ler
`getComputedStyle` logo depois de trocar o modo devolve o valor NO MEIO da
transição, não o final. Pior, esperar com laço ocupado não ajuda — transição
não avança enquanto o JS bloqueia a thread. Duas leituras seguidas acusaram a
pastilha acesa no botão errado, nas duas direções, e as duas eram artefato do
meu próprio teste. O jeito certo é desligar a transição
(`*{transition:none !important}`) antes de ler.

## 5s. O cartão da tipografia desenha a própria animação

Os cartões 01 e 02 leem o canvas do js/shell.js e convertem. O 03 não mais: a
animação que o Classic faz ali são doze letras de 34px giradas, e a 34px numa
grade de 8px cada letra vira meia dúzia de caracteres — **4% de cobertura**
contra 16 e 21 dos vizinhos. Sumia no meio do gif, e justo no cartão que é o da
tipografia.

O que entra no lugar é uma **amostra tipográfica**: glifos ocupando de 62% a
88% da altura do cartão, atravessando devagar, cada um numa família diferente —
Archivo, Times, JetBrains Mono, Georgia, Courier, Arial, com pesos de 300 a 900
e alguns em itálico. Um em cada três sai **só de contorno**: é o contorno que
deixa ver o esqueleto da letra em caracteres, que é o assunto do laboratório.

A sequência é derivada da POSIÇÃO, não sorteada por quadro: o glifo de índice
`k` tem sempre a mesma família, o mesmo corpo e a mesma letra. Por isso a fita
rola sem nada piscar, e o que entra pela direita já entrou antes na mesma forma.

Conferido que as famílias são mesmo diferentes e não caíram todas no mesmo
recurso: medindo `RGB&Q` a 100px, **cinco larguras distintas em seis famílias**
— as duas iguais são JetBrains Mono e Courier, que são monoespaçadas e por
definição medem igual.

**Desenhada já pequena**, e é a diferença entre caber e não caber:

```
glifos de 229px num canvas de 411×286        14,56ms os três cartões
glifos de 94px num canvas de 170×118          9,96ms · mesma cobertura (15%)
```

O destino é uma grade de 85×35 caracteres. Rasterizar seis vezes mais pixels do
que alguém vai olhar não melhorou nada — a cobertura ficou igual, e os tons se
espalham pelos nove degraus da rampa em vez de virar mancha de `@`.

## 5t. A marca nova

`assets/logo-01v.png` — 2215×542, e o que muda não é só o desenho: a anterior
era tinta preta sobre transparência e o darkroom resolvia com
`filter:invert(1)`. Esta é **colorida**, com as letras preenchidas por faixas
verticais de RGB e CMY, e inverter uma marca colorida troca todas as cores
dela: o azul viraria laranja, o vermelho viraria ciano. As duas regras de
inversão saíram, e com elas o `mix-blend-mode` da tela de entrada, que fazia a
mesma coisa por outro caminho.

Medido no arquivo antes de usar: **64% transparente, 35% de tinta, 1% de
branco** — sem fundo chapado, assenta nos dois modos sem tratamento.

A proporção foi de 1704/432 para 2215/542 e as três aparições foram
recalculadas em cima dela: marca do cabeçalho 90×22, título do índice até
343×84, palavra da entrada até 458×112 — as três batendo 4,08 contra os 4,087
do arquivo.

O caminho é `../assets/`, com os dois pontos: `url()` numa folha de estilo
resolve a partir da pasta da FOLHA, e esta mora em `css/`. É o mesmo tropeço
que deixou os gifs invisíveis — lá pela variável, aqui seria pelo diretório.
Conferido na rede: 200, e nenhum pedido a `css/assets/`.

**A troca vale só no 2.0.** O Classic continua com a marca antiga embutida em
base64 no system.css — trocar lá mudaria também o arquivo único.

## 5u. A tipografia frenética, e nove milissegundos no lugar errado

O cartão 03 passou a trocar tudo numa BATIDA de 12 por segundo: caractere,
família, corpo, inclinação. O sorteio é por (glifo, batida) e não por quadro —
dentro da batida a letra fica parada, na virada troca inteira. É o que dá o
estalo. Se cada quadro sorteasse de novo, as letras não trocariam: ficariam
vibrando no lugar, e vibração lê como chiado, não como agitação. Junto entrou
um rastro: a letra da batida anterior, deslocada e fraca.

**Medida de agitação** — quantas células da grade mudam de um quadro para o
seguinte:

```
cartão 01 (pontos)          1%
cartão 02 (onda)            5–6%
cartão 03 (tipografia)     24–33%
```

**E a caça ao custo, que errei três vezes seguidas.** A versão frenética
passou de 9,96ms para 21,5ms nos três cartões. Fui atrás na ordem errada:

```
tirei o rastro         21,53 → 21,47    não era
tirei o giro           21,47 → 20,78    não era
graduei o corpo        20,78 → 11,85    ERA
```

O culpado era o corpo da letra variando CONTINUAMENTE dentro da batida. Com o
corpo mudando a cada quadro, a string passada para `ctx.font` é nova toda vez,
e string de fonte nova joga fora o cache de glifos do navegador — ele
rerasteriza tudo. Em degraus de 6px o conjunto de tamanhos é pequeno, se
repete, o cache volta a valer, e o salto de uma batida para outra continua
sendo salto.

Descoberto isso, o rastro e o giro voltaram: custam 1,8ms juntos, contra os 9
que eu tinha atribuído a eles. Final: **13,69ms os três cartões**, a 20fps.

*E um aviso sobre o instrumento.* Montei um microteste isolado para separar os
custos e ele mentiu duas vezes. Na primeira, o canvas nunca era lido de volta —
sem leitura o navegador adia o desenho, e "girar" media 0,19ms. Na segunda, com
a leitura no lugar, os números saíram incoerentes: tudo girando ficou MAIS
barato que sem girar, e mais glifos ficaram mais baratos que menos. Cinquenta
iterações não pagam a compilação. **Quem decidiu foi a medida no caminho real,
com aquecimento** — é a única que nunca desmentiu a si mesma.

## 5v. O realce do selecionado é quadrado

A pílula do item ativo era o último canto oval do cabeçalho, junto com o
interruptor de modo, e os três cartões do índice já eram retos. Um realce oval
no topo de uma página de blocos retos lê como peça de outro conjunto.

Reto não é só menos raio: é a mesma regra dos cartões — **o que marca posição
tem canto duro, o que é ação solta continua arredondado.** Por isso o
`? COMO USAR` ficou como estava: ele não marca onde você está, ele faz uma
coisa.

## 5w. Seis acertos no índice

**A ficha começa pelo inventário.** O primeiro bloco repetia em prosa o que o
cabeçalho já diz em duas palavras — "rgb_lab, laboratório audiovisual
experimental" logo abaixo de FICHA · SISTEMA. Ocupava a primeira dobra inteira
com texto que ninguém lê duas vezes e empurrava para baixo o inventário, que é
a única coisa dali que muda e que se consulta. Escondido por CSS e não removido
do js/shell.js, que é o mesmo arquivo do Classic.

**O cabeçalho da ficha perdeu o que não se usa.** As duas setas recolhiam e
abriam todos os blocos de uma vez — cada bloco já abre e fecha no próprio
título, e são três blocos. O `SYS 01` repetia o que o topo da página mostra. De
seis peças para três.

**O botão de entrada ganhou a marca.** Era azul chapado, e azul é o canal do
VÍDEO — dizia "vídeo" numa porta que abre os três laboratórios. Agora as letras
são preenchidas pelas mesmas faixas de RGB e CMY da marca, e elas ANDAM: a
faixa desliza por trás do texto, então a mesma letra passa por azul, amarelo,
verde. No hover a passagem acelera de 1,8s para 0,6s.

`background-clip:text` recorta o fundo na forma das letras — e leva junto o
preenchimento do botão, que desaparece. Por isso a chapa escura vem por
`box-shadow` interno: sombra interna é pintada DEPOIS do fundo e não é
recortada. Sem navegador que recorte em texto, o `@supports` devolve letra
branca sólida.

**O gif do áudio, mais perto e mais alto.** O lab02.gif tem 325×225 e o cartão
tem quase a mesma proporção — 1,444 contra 1,437 — então `cover` entrava sem
cortar nada, e sem corte não há enquadramento. 122% de largura dá uns 50px de
folga vertical, e 70% de posição usa 20% dessa folga para subir a imagem. Zoom
e subida saem da mesma folga.

**A tira de quatro cedeu altura para o rodapé.** O crédito ficava cortado
embaixo. A tira tinha entrelinha de 22,8px para uma letra de 12 — quase o dobro
do corpo, que é respiro de parágrafo longo e não de nota de quatro linhas. E o
recuo era maior que o texto: 44px de respiro vertical por coluna para 63px de
conteúdo.

```
entrelinha 1,9 → 1,5 e corpo 12 → 11        41px
recuo das colunas 44 → 28, rodapé 40 → 28   29px
                                            ───
                                            70px devolvidos
```

Numa janela de 800px de altura o rodapé passa a caber inteiro, com o nome. Numa
de 640 — que é aperto de propósito — a sobra caiu de 172px para 102, e nenhum
texto ficou cortado.

## 5x. A assinatura, em três tentativas

O crédito de quem fez o laboratório ficava no rodapé do índice, e o rodapé só
aparece se o conteúdo couber na altura da janela.

**Primeira tentativa: abrir espaço.** Encolhi a tira 01–04 e devolvi 70px — 41
de entrelinha e corpo, 29 de recuo. O rodapé passou a caber, e conferido numa
janela de 800px de altura ele aparecia inteiro.

Isso é **caber por sorte**. Basta uma tela mais baixa, uma coluna mais estreita
fazendo o texto quebrar em mais linhas, ou o navegador em 110% de zoom, e o
nome desaparece de novo. O aperto some, o problema volta.

**Segunda tentativa: grudar.** `position:sticky` no rodapé, que passa a parar
no fundo da área do índice enquanto o resto rola por baixo. Funcionava —
medido numa janela de 640px, com 136px de rolagem, o rodapé ficava visível nas
três posições, topo, meio e fim.

E foi rejeitado, com razão: uma barra atravessando a página o tempo todo é peso
demais para uma linha de crédito. Resolver um problema de visibilidade criando
um elemento permanente é trocar de problema.

**Terceira, e a certa: subir.** A assinatura saiu do rodapé e foi para o
cabeçalho do índice, ao lado de "Laboratório Audiovisual Experimental" —
barrinha RGB e a frase. Lá ela não depende de rolagem nenhuma, e fica onde a
leitura começa em vez de onde ela termina. O rodapé voltou a ser `static`, com
o caminho e a data.

É mudança de LUGAR, não cópia: o mesmo elemento sai de um e entra no outro.
Duas assinaturas na mesma página seriam uma a mais.

**AO LADO, e não embaixo — e isso custou uma segunda passada.** Empilhada, a
assinatura virava mais um parágrafo e puxava o olho para longe da marca. Pôr as
duas como elementos em linha quase resolveu: ficaram lado a lado e **6px fora
de prumo**. `vertical-align:middle` alinha pela linha de base do texto, não
pelo centro das caixas — e como uma tem corpo maior que a outra, os centros não
coincidem. Numa caixa flex com `align-items:center` o desvio foi para **0px**.

Cheguei a pôr um filete vertical entre as duas, e ele criava um problema
próprio: quando a coluna aperta e a assinatura cai para a linha de baixo, o
filete fica pendurado no começo da linha sem separar nada. Tentei apagá-lo por
`@container` e a consulta olhava a largura da PÁGINA, não a da linha — não
disparava. Mas a assinatura já começa com a barrinha colorida, que separa
quando estão lado a lado e abre quando estão empilhadas. **Dois separadores
para a mesma junta é um a mais.**

Conferido em duas larguras: área de 1066px, lado a lado, desvio 0; área de
336px, quebram sem estourar.

**E na barra de estado** o crédito ganhou `flex:0 0 auto`. Ele é o último item
de uma fila `nowrap`, e numa fila assim o último é o primeiro a ser espremido —
agora quem cede espaço são os contadores do meio, que se releem em dois
segundos.

*Uma nota sobre o diagnóstico:* o print mostrava `ELABORADO E CRIADO POR BRUNO
CEB` cortado na borda direita, e a primeira leitura foi "a barra de estado está
cortando". Medido, ela estava inteira — 1009→1351 numa janela de 1612. O que
cortava era o RECORTE da imagem: o `CLARO/NOTURNO` e o relógio também tinham
ficado de fora do print. **Print cortado não é tela cortada**, e a diferença
entre os dois é uma medida.

## 5y. TOOLS sai de dentro de MÍDIA

Escâner, mosaico e sobreposição estavam escondidos no fim de uma grade de
importação. São três instrumentos que abrem janela própria — não são atalhos de
"trazer arquivo".

A divisão é por natureza, não por arrumação: em **MÍDIA** fica o que TRAZ
material de fora (arquivo, webcam, imagem, texto, legenda, áudio, carta de
teste); em **TOOLS**, o que FABRICA material a partir do que já existe.

*(A aba nasceu como FERRAMENTAS com um ícone de chave inglesa. Virou TOOLS com
uma televisão: a chave dizia "conserto", e o que está aqui é o contrário — são
instrumentos de FAZER imagem.)*

As duas abas mostram a MESMA seção do index.html — separar de verdade exigiria
mover os botões, e aquele arquivo é o mesmo que o Classic usa. O que muda é
quais botões aparecem, decidido pelo `data-l2cat` que o js/lab2.js escreve na
coluna. E o título da seção, que diz FONTE, vira TOOLS enquanto a aba está
aberta e volta ao sair.

Conferido: MÍDIA mostra 11 botões e nenhum dos três instrumentos; TOOLS mostra
os três e mais nada, com o título trocado; voltando para MÍDIA, os 11 e o
título FONTE de novo.

## 5z. Cada estilo mostra o que faz

Um estilo é uma CADEIA de efeitos — VHS 1994 são três, Vaporwave são cinco. O
nome e a descrição dizem o que ele promete; a miniatura mostra o que ele faz, e
num catálogo de 57 a palavra não dá conta.

**O quadro de teste é desenhado em código**: pôr do sol, sol listrado, grade em
fuga e serra recortada — o cartão-postal dos anos 80. Serve porque tem tudo que
os estilos mexem: céu liso para a cor sangrar, linhas finas para o tracking
rasgar, contraste alto para o preto e branco ter o que separar, magenta e ciano
para os deslocamentos de canal aparecerem. Quando aparecer a imagem definitiva,
é trocar o corpo de `cartao80` por um `drawImage` — o resto continua igual.

Conferido: 57 células, **8 assinaturas distintas em 8 miniaturas** — nenhum
estilo saiu igual ao vizinho.

**Dois defeitos de layout, os dois medidos:**

```
a célula é GRID, não flex          a imagem virou LINHA nova: 46px → 87px
a coluna de texto encolheu 43px   a descrição quebrava mais: 46px → 92px
```

O primeiro foi diagnóstico errado meu: escrevi `flex:0 0 44px` na miniatura, e
`flex` não faz nada num contêiner de grade. A imagem virou a primeira COLUNA
(`34px 22px minmax(0,1fr) auto`) e voltou à mesma linha.

O segundo é consequência do primeiro estar certo: a miniatura ocupa espaço
horizontal, e o que sobra para o texto encolhe. Com a descrição presa em duas
linhas, as 57 células ficam entre 54 e 70px — 46 delas exatamente em 57 — em vez
dos 46 a 92 de antes. Numa lista longa, altura irregular é pior que texto
cortado.

34px é o maior quadrado que ainda deixa a célula perto da altura que tinha:
cresce 6px numa coluna estreita e nada numa coluna larga, onde a descrição já
ocupava duas linhas.

## 5aa. O botão de entrada perdeu o azul de vez

Ele voltava a azul ao passar o mouse. A regra nova cuidava do repouso, mas a
ANTIGA continuava viva num bloco acima —
`.intro-enter:hover{background:var(--l2-video);color:var(--on-ch)}` — e como as
duas não mexiam nas mesmas propriedades, conviviam: repouso com faixas, hover
azul.

Removida, e o estado passou a ser declarado nos três: `:hover`, `:active` e
`:focus` repetem a cor e as faixas explicitamente. Repetição de propósito — o
system.css tem um `.intro-enter:hover` que no papel perde por especificidade,
mas depender disso é depender de uma comparação entre dois arquivos que ninguém
lembra ao editar um deles. **Foi assim que o azul voltou da primeira vez.**

## 5ab. Cinco correções

**TOOLS, com uma televisão.** A chave inglesa dizia "conserto", e o que está
nessa aba é o contrário — são instrumentos de FAZER imagem. A televisão diz
isso em um desenho: caixa, antenas e o pé.

**O quadradinho do estilo foi de 34 para 46px.** A 34 dava para ver que tinha
imagem, não o que a imagem era. Doze pixels a mais é a diferença entre
reconhecer a cor e reconhecer o EFEITO — o pente do VHS, a grade do mosaico, o
verde do terminal. O número ao lado cedeu dois pixels; dois dígitos cabem em 20.

**A assinatura subiu e o rodapé destravou.** Grudar o rodapé no fundo garantia
a assinatura e criava uma barra atravessando a página o tempo todo — peso
demais para uma linha de crédito. Ela subiu para o cabeçalho do índice, logo
abaixo de "Laboratório Audiovisual Experimental": barrinha RGB e a frase. Lá
não depende de rolagem nenhuma, e fica onde a leitura começa em vez de onde ela
termina. É mudança de LUGAR, não cópia — o mesmo elemento sai do rodapé e entra
no cabeçalho; duas assinaturas na mesma página seriam uma a mais.

## 5ac. O botão de entrada estava ilegível, e dava para medir

> **CORRIGIDO NA SEÇÃO 5ai.** A decisão de baixo — "no hover a letra fica
> branca" — foi revista, e o motivo é que ela tratava o sintoma: a chapa escura
> era uma sombra INTERNA, e sombra interna pinta por cima do texto recortado.
> As faixas passavam a 5% em todos os estados, e branco era a única coisa que
> restava legível. O resto desta seção (as medidas de contraste, a largura da
> faixa) continua valendo.

Duas causas, as duas mensuráveis:

```
faixa de 5px numa letra de 13px    cada letra recebia 2,5 cores → papa
azul #1a1aff contra a chapa        contraste 2,57 — abaixo de 3, o mínimo
                                   até para texto grande
```

A marca funciona com faixas finas porque as letras dela são ENORMES. A mesma
faixa que num logo de 500px dá desenho, num botão de 13px dá ruído. Com 11px
por faixa é quase uma letra inteira por cor, e volta a ser listra.

E as cores subiram de tom. A tabela de contraste contra a chapa
(`rgba(4,4,8,.95)`):

```
            antes    agora
azul         2,57     5,58     ← era o que sumia
vermelho     5,33     6,88
magenta      6,05     8,26
verde       11,40    13,69
ciano       13,31    14,27
amarelo     19,06    15,72
```

A pior faixa saiu de 2,57 para 5,58 — acima dos 4,5 que a WCAG pede para texto
normal. A chapa também escureceu de 82% para 95% de opacidade, e ganhou uma
sombra externa para o botão descolar do ascii em vez de flutuar dentro dele.

**No hover a letra fica branca** (contraste 20,47). As faixas são a identidade
em repouso; no hover o que importa é ler sem esforço, e nada lê melhor que
branco sólido. O clique mantém o branco — trocar de aparência no meio do gesto
faz o botão parecer que piscou em vez de ter sido apertado.

A legenda embaixo também estava apagada: contra um fundo de ascii em movimento,
cinza-3 não é texto, é textura.

## 5ad. A coluna da esquerda, como na referência 02

A referência mudava três coisas na coluna, e nenhuma era cor.

**1. Trilho, torre e painel viram TRÊS PEÇAS.** Eram uma só, com a torre
separada do painel por um filete. Filete diz "mesma caixa"; vão diz "duas
coisas". O trilho ganhou canto (era o único bloco da janela com quina viva) e
foi de 34 para 40px; a torre virou cartão próprio de 72px.

**2. A torre cresceu.** Ícone de 19px com rótulo de 8px é item de barra de
ferramentas. Passou a 26px/9px, e o item ativo trocou o bloco cheio por
CONTORNO do canal mais a barrinha na borda — bloco cheio na torre brigava com
as pastilhas cheias da grade FONTE logo ao lado, e nenhuma das duas lia como
"você está aqui".

**3. A grade FONTE virou pastilha cheia da cor do canal.** Vale nos três
laboratórios de uma vez porque a cor sai de `--ch`: azul no vídeo, verde no
áudio, vermelha na tipografia.

### Os ícones tiveram que virar cheios — e isso é CSS, não SVG

Traço de 1,25px sobre uma pastilha azul a 30px lê como rabisco. Os dez ícones
da grade (mais os quatro do áudio) foram redesenhados como silhuetas maciças
em `js/lab2.js` (`CHEIOS`), e **não no `index.html`**: lá os ícones de traço
estão certos, porque o Classic também carrega aquele documento.

Uma armadilha que quase engoliu tudo:

```
css/labs.css  .srcbtn svg { fill:none }        ← propriedade CSS
js/lab2.js    svg.setAttribute('fill', ...)    ← atributo de apresentação
```

Propriedade CSS vence atributo de apresentação, e as silhuetas sumiam inteiras.
O `fill:currentColor` teve que ir para o CSS do 2.0. Já os quatro ícones que
precisam de ANEL (foto, legenda, carta de teste, escâner) declaram `fill="none"`
e `stroke` no **próprio elemento** — e aí atributo do elemento vence herança.
É por isso que os dois tipos convivem no mesmo quadro.

### A grade se rearruma quando a coluna afina

Era `grid-template-columns:1fr 1fr` — DUAS colunas sempre, custe o que custar.
Ao afinar, os botões eram comidos. Três consertos que se somam:

```
auto-fit + min(94px,100%)   uma coluna quando não cabem duas. O `min()` corta a
                            armadilha conhecida do auto-fit: sem ele o mínimo de
                            94px continua valendo numa coluna de 80 e o conteúdo
                            vaza — o defeito que se queria consertar
piso de 196px na coluna     o arrasto do js/app.js para em 120px, medida de
                            antes de existir a torre. Hoje a torre come 72+10 e
                            sobrava um painel de 38px
@container (max-width:170px) MOSAICO e SOBREPOR são faixas deitadas; numa coluna
                            fina a palavra partia ("SOBREP / OR"). Voltam a ser
                            pastilhas normais. Quem decide é a largura da GRADE,
                            não a da janela — uma @media erraria justamente no
                            caso do Bruno: janela enorme, coluna estreita
```

Medido em MÍDIA, em TOOLS e no laboratório de áudio:

```
coluna   grade                     rótulo
120 →196 (piso)  1 coluna,  88px   inteiro
240              1 coluna, 122px   inteiro
320              2 colunas, 101px  inteiro
420              3 colunas,  97px  inteiro
```

---

## 5ae. O pôr do sol virou um olho

O quadro de teste das miniaturas de estilo era um cartão dos anos 80 — céu em
degradê, sol listrado, grade em fuga. Mostrava cor, e mentia sobre tudo o que um
estilo faz com uma IMAGEM: não tinha pele, nem um preto real, nem detalhe fino
o bastante para grão e desfoque aparecerem, nem rosto — que é o que quase todo
plano tem.

Agora é um OLHO em close, desenhado em código (`olho` em `js/lab2.js`), e é
carta de teste melhor por seis motivos ao mesmo tempo:

```
PELE            o tom mais difícil de qualquer tratamento de cor
PRETO REAL      a pupila, e o BRANCO ESTOURADO do reflexo — os dois extremos
                da escala numa imagem só
CÍLIOS          linhas de um pixel: nitidez, grão, halação, desfoque
ÍRIS            fibras finas e anel escuro — denuncia deslocamento de canal
ESCLERA         branco quase neutro, grande o bastante para dominante aparecer
CONTRASTE       de fotografia, não de cartaz
```

**Metade em preto e branco, metade em cor.** As duas metades são o mesmo olho,
no mesmo lugar; muda só a saturação. A mesma miniatura responde às duas
perguntas que se faz de um estilo — o que ele faz com a COR e o que faz com o
TOM. `PB = 0` no alto da função devolve o cartão inteiro colorido.

Desenhado no DOBRO da medida e reduzido na hora de virar textura: cílio de um
pixel desenhado em 168px de largura vira borrão cinza.

A dessaturação é por LUMINÂNCIA Rec.709, pixel a pixel, e não por
`globalCompositeOperation:'saturation'` — a conta do navegador para esse modo é
em HSL e escurece o azul da íris; as duas metades deixariam de casar no tom.

**Depois, o olho afastou.** Ele enchia o quadro de canto a canto e num cartão de
84px isso vira textura. `ZOOM = 0.62` dá um passo atrás: sobra pele em volta, a
forma fecha, e o cartão volta a ser uma FOTO. É escala em torno do centro, não
mudança nas marcas do desenho — as proporções continuam as mesmas, só o
enquadramento abre. Os fundos passaram a ser pintados muito além do quadro
(senão a escala deixa canto vazio) e a sombra da órbita, que morria a 62% da
largura, foi para 105%.

---

## 5af. A pilha de efeitos ganhou miniatura

O catálogo da esquerda tinha miniatura e a pilha da direita continuava lista de
nomes. É o lugar ERRADO para faltar imagem: no catálogo você escolhe, na pilha
você EDITA — e editar "erosão" sem ver o que ela faz no seu plano é mexer no
escuro.

Duas diferenças em relação à do catálogo:

- a do catálogo desenha com os valores DE FÁBRICA, porque ali o efeito ainda não
  é seu. A da pilha desenha com os valores QUE VOCÊ PÔS — mexeu no controle
  deslizante, a miniatura acompanha;
- a REGIÃO fica de fora de propósito: a máscara é medida no quadro do clipe e a
  miniatura no quadro da COMPOSIÇÃO. As duas quase nunca coincidem, e miniatura
  com máscara no lugar errado é pior que miniatura sem máscara.

Nada disso toca no `js/motion.js`: o HTML da pilha continua o mesmo e a imagem
entra depois, por fora.

### O defeito: o observador jogava fora o próprio trabalho

`data-chave` era escrito ao ENTRAR na fila. O `<img>` recém-inserido disparava o
MutationObserver, que 90ms depois relia "pronta" e limpava a fila — e a pilha
ficava com três quadrados pretos para sempre. A chave passou a ser escrita
DEPOIS de a imagem existir, e a fila deduplica por `img`+`chave`.

Medido: intensidade do glitch de 0,35 → 0,90 refez a miniatura correspondente e
só ela (`ok:4`, cache 4).

---

## 5ag. O ✕ do LOOP

O interruptor de LOOP virava um ✕ quando ligado, e uma bolinha correta quando
desligado. Um defeito que só aparece em UM dos dois estados é sempre uma pista.

```
css/system.css   input[type=checkbox]:checked::after { clip-path: polygon(...) }
                 ← a marca do Classic é um X recortado no ::after, e SÓ no :checked
css/lab2.css     .transport input::after { ... }
                 ← aqui o ::after deixou de ser marca e virou o BOTÃO da chave
```

O recorte continuava valendo: desligada, bolinha; ligada, o mesmo círculo
cortado em ✕. `clip-path:none` na regra dos DOIS estados — não na do ligado,
senão o recorte volta por especificidade no dia em que alguém mexer. O mesmo
defeito estava nas chaves da ficha técnica.

---

## 5ah. As setinhas de recolher estavam invisíveis

Cada bloco da coluna da direita recolhe por uma setinha. Duas causas somadas:

```
TAMANHO   glifo ▾ de 13px numa caixa de 22 — num painel escuro é um ponto
COR       --l2-ink-3 (#6a6a78) sobre painel #121216: o tom mais apagado da
          paleta, o mesmo do texto auxiliar. Lia como enfeite, não controle
```

Caixa 26px, glifo 17px, cor sobe para `--l2-ink-2`. No hover pega a cor do
canal, e **recolhida ela fica acesa** — é o estado que precisa gritar, porque o
bloco sumiu e só ela diz que há coisa ali dentro.

As duas setas do ALTO da ficha (⌃ ⌄) ficaram de fora: a seção 40b as esconde de
propósito. Cheguei a escrever regra para elas e apaguei — regra de estilo para
elemento escondido é armadilha para quem editar depois.

---

## 5ai. O botão de entrada: a chapa comia as faixas

**Isto corrige o que as seções 5aa e 5ac afirmam.** Lá está escrito que no hover
a letra fica branca, e que isso é a decisão certa. Era decisão certa para o
sintoma errado.

O Bruno reclamou que o botão "fica todo preto" ao passar o mouse. Ao medir,
apareceu um defeito maior e mais antigo, que valia nos TRÊS estados — inclusive
em repouso:

```
box-shadow: inset 0 0 0 999px rgba(4,4,8,.95)     ← a chapa escura
```

Sombra interna pinta ACIMA do fundo do elemento. Como o fundo do elemento é
justamente o arco-íris recortado nas letras (`background-clip:text`), a chapa
caía em cima delas: **passavam 5% da cor**. Medido lado a lado na página — a
mesma regra sem a sombra interna mostra as letras em RGB cheio; com ela, quase
pretas.

Era por isso que a versão anterior "resolveu" o hover trocando as faixas por
branco sólido: com a chapa comendo a cor, branco era a única coisa legível.

O conserto: a chapa passa a vir de `backdrop-filter: brightness()`, que escurece
o que está ATRÁS do botão e não encosta no fundo dele. A chapa continua
existindo — é ela que separa o botão do ascii — e as letras ficam com a cor
inteira. O hover agora **mantém o recorte** e acende por três vias que não mexem
na cor: chapa um pouco mais fechada, faixa deslizando ao dobro da velocidade
(1,8s → 0,9s) e um halo azulado. O `:active` é igual ao `:hover` de propósito.

Duas notas:

- a primeira tentativa de hover usou paleta pastel. Clareado demais, o arco-íris
  vira **cinza colorido** e o botão deixa de dizer RGB — exatamente o problema
  que o conserto veio resolver. Voltou para as mesmas seis cores saturadas, só
  um degrau mais claras;
- sem `backdrop-filter` não há como ter chapa E cor: qualquer fundo pintado no
  botão é recortado nas letras junto. Nesse caso o `@supports` escolhe
  legibilidade — chapa cheia e letra branca. O mesmo vale para o socorro de
  `background-clip:text`, que agora cobre os três estados (antes cobria só o
  repouso, e o botão sumiria justamente no hover).

---

## 5aj. A SCANNER STATION — a mesa de digitalização vira aparelho

A janela da mesa tinha tudo o que precisa e a cara de uma caixa de diálogo: dois
retângulos e quatro colunas de formulário. O que ela é, porém, é um
INSTRUMENTO — um cabeçote que anda linha a linha enquanto a mão mexe na
bancada. Instrumento se opera, não se preenche.

### O que virou o quê

```
.modal-card.mesa-card      →  o CHASSI de metal, com os quatro parafusos
.modal-h                   →  o BISEL com a placa RGBLAB / SCANNER STATION
.mesa-topo + as .mesa-cx   →  a TAMPA
.mesa-ctrl + as .mesa-col  →  a MESA DE CONTROLE, quatro postos
<input type=range> × 3     →  os KNOBS — os mesmos controles
—                          →  a MANIVELA, peça nova com função real
.cmd                       →  TECLAS de painel
```

`js/lab2.js` remonta as peças em volta do que já existe; `css/lab2.css` (seções
47 a 51) desenha. **`js/mesa.js` — o motor — não foi tocado.** `js/mesaui.js`
ganhou UMA linha: expor `pintar`, que a manivela precisa para mandar as duas
telas se refazerem. Tudo pende de `:root[data-ui="2"]`, e o Classic continua
exatamente como era (verificado abrindo o `index.html`).

### O 3D a serviço da função

Nenhuma peça tridimensional é enfeite:

- **VELOCIDADE, GRÃO e ONDA DO CABEÇOTE** escrevem nos mesmos `<input
  type=range>` e disparam `input` — quem responde é o `mesaui.js` de sempre. Os
  deslizadores continuam ao lado: knob e deslizador são o mesmo controle;
- **MANIVELA** chama `VE.mesa.linha`, a mesma primitiva que o motor usa a cada
  quadro. Girar para a direita anda com o cabeçote e GRAVA — é o scan no ritmo
  da mão, que é para isso que esta mesa serve. Para a esquerda não faz nada, e
  isso é honesto: o filme é gravação, não parâmetro.

Medido em operação: manivela girada → 416 de 720 linhas gravadas, com a onda do
cabeçote aparecendo no filme e a leitura do bisel acompanhando.

### Por que NÃO tem `rotateX`

O pedido era frontal com leve visão de cima. Inclinar o cartão daria a
perspectiva de graça e quebraria a bancada: ela converte pixel de tela em pixel
de filme lendo `getBoundingClientRect`, e num plano em perspectiva essa conta
deixa de ser linear. **O arrasto passaria a escorregar, e o arrasto é a
ferramenta.** A profundidade é construída como num objeto real — espessura,
chanfro, sombra de contato — e a leitura de "visto de cima" fica com as peças em
que a mão nunca toca: a aresta de baixo da tampa e (enquanto existiu) o pé,
ambas trapezoidais.

### Três defeitos que a medição pegou

**1. O gesto do knob morria em silêncio.** `setPointerCapture` vinha antes de o
estado ser criado; quando o navegador recusa o ponteiro (`NotFoundError`), a
exceção interrompia o ouvinte e o knob parava de girar — sem erro no console,
porque exceção dentro de ouvinte não sobe para lugar nenhum. Estado primeiro,
captura dentro de `try`, e quem faz o gesto acontecer é o ouvinte no DOCUMENTO,
que vale com captura ou sem.

**2. Arrasto lento não movia nada.** 1px valia 0,42 no grão; arredondar no passo
dava o mesmo número de antes e a peça girava para nada. Com o mouse rápido
funcionava e com a mão parada não — o pior tipo de defeito, porque parece
capricho do aparelho. O eixo passou a guardar a posição CONTÍNUA e só o valor
sai quantizado.

**3. O orçamento de altura estava invertido.** A tela vinha com altura fixa
(`min(46vh,420px)`, herança de quando ela era o único bloco que mandava no
tamanho) e comia 601px de 846 — a mesa ficava com 137 para um conteúdo de 367, e
metade dos botões caía fora da carcaça. Num aparelho a hierarquia é física: a
mesa de controle tem o tamanho que tem, porque é hardware; quem estica para
preencher a carcaça é a TELA.

### E depois: onde estavam os pixels da tela

Medido em 1730×907 — aparelho 853, tela 274. Isso é 32% do aparelho em tela,
contra ~44% na referência, e a diferença aparece em cheio quando a fonte é
RETRATO: o poço largo e baixo esmaga o canvas para uma tarja no meio.

Os ~100px que faltavam não estavam num lugar só — por isso mexer só na proporção
tampa/base não resolvia:

```
~22px  NA MOLDURA DA JANELA   22px de respiro em volta do modal mais o teto de
                              94vh. O aparelho já tem moldura própria
~42px  NO ACABAMENTO DA TAMPA bisel, cabeçalho da caixa, fileira de teclas e as
                              margens do poço — 4 a 8px cada, seis somados
~38px  NO PASSO DA MESA       a altura da mesa é a da coluna 3, a mais cheia
```

**E a peça que fazia todo o resto não valer:** o cartão tinha `max-height` e
NENHUMA altura. Sem altura definida ele fica do tamanho do conteúdo — e aí
`flex-grow` na tampa não tem para onde crescer, porque não existe sobra para
distribuir. Isso apareceu numa medição que não fechava: o teto da mesa desceu
46px na janela estreita e as telas continuaram exatamente com 75. A mesa cedia
espaço para lugar nenhum. Com `height:calc(100vh - 24px)` o aparelho ocupa a
janela e toda a sobra vai para a tampa.

### A dobradiça e o pé saíram

A pedido, e o argumento é bom: somadas custavam ~50px de altura para dizer o que
a ARESTA da tampa e a sombra de contato já dizem sozinhas. Numa ferramenta em
que se olha a imagem, 50px de enfeite são 50px que a tela não tem. Saíram do JS,
não escondidas por CSS — e os blocos de estilo correspondentes foram apagados.

```
                        1ª versão   depois dos pixels   sem dobradiça/pé
poço da tela              274px         368px               426px
tela / aparelho            32%           42%                 48%
mesa / aparelho            37%           33%                 31%
canvas retrato no poço     ~55%          97%                 98%
```

### O que não dá para igualar à referência

Na imagem de referência as colunas 3 e 4 mostram os mesmos botões que já estão
no rodapé do FILME (FOLHA NOVA, BAIXAR PNG, USAR NA COMPOSIÇÃO). Duplicá-los
significaria dois elementos com o mesmo `id`, e o JS da mesa amarra tudo por
`id` — o segundo botão ficaria morto. É o mesmo defeito do `#snapBtn` que o 2.0
achou no Classic (ver apêndice). Eles continuam onde funcionam.

---

## 5ak. A FICHA DA TIPOGRAFIA — o que a seção 5b não tinha resolvido

A seção 5b acertou o diagnóstico e metade da cura. *"Na referência a linha É
o campo"* — e a `.prow` virou caixa arredondada com o rótulo embutido e o
valor à direita, com o cursor deslizante encaixado no pé dela.

Ficou bonito. E a ficha ficou **mais alta**: 32px do campo mais 25px do
cursor são 57px por controle, contra 47 do Classic. Com 44 controles, a
ficha da tipografia media **2804px de rolagem numa janela de 808** — três
telas e meia, meia tela a mais do que antes da repaginação.

**O erro é de leitura da referência.** A calma do brik.space não vem de
linha bonita; vem de **pouca linha na tela**. Nas capturas, cada painel
mostra uma seção aberta e as outras recolhidas em título, e cada número é
UMA caixa — não uma caixa mais uma trilha embaixo.

Duas correções, as duas em `js/type.js`, nenhuma no desenho:

**1. O cursor não fica embaixo do campo — ele É o campo.** A caixa se enche
até onde o valor está na faixa (`--fill`, escrito pelo JS), arrastar em
qualquer ponto dela muda o valor, e o número continua aceitando clique para
digitar. Um controle, 30px, uma linha. O `<input type=range>` continua lá,
invisível e do tamanho da caixa: é ele que arrasta e é ele que o
`bind()` já sabia ouvir.

E a barra **sai do zero**, não da borda: numa faixa que atravessa o zero
(ENTRELETRA vai de −120 a 300) encher da esquerda fazia o valor 0 aparecer
com a caixa 28% cheia.

**2. As sete placas recolhem.** `VE.panels.plate()` existe desde sempre e a
ficha do clipe usa; a da tipografia escrevia as placas à mão, sem cabeçalho
recolhível. Foi o conserto mais barato e o de maior efeito.

```
ficha da tipografia, no 2.0     antes    depois
padrão (1ª visita)              3,50     1,00 tela
tudo aberto                     3,50     2,71
coluna de ferramentas           2,80     1,00 tela
```

O desenho novo mora na **seção 52** do `css/lab2.css` — `.tctl` e as quatro
variantes, mais `.tyfam` para as seis famílias da coluna. Vale o mesmo aviso
da 5f: as ferramentas da tipografia usavam a classe `.fxitem` da lista de
efeitos do vídeo, e nome de classe não é contrato de dono.

**Onde isto ainda não foi feito:** a ficha do clipe (vídeo) e a do áudio
continuam em `.prow` + `.prow-slider`, com o cursor numa segunda linha. É o
mesmo conserto, em `panels.js` e `motion.js`.

---

## 5al. A MINIATURA DAS FERRAMENTAS DE TIPOGRAFIA

A lista de estilos do vídeo ganhou miniatura de 46×46 (seção 26) e o argumento
de lá vale aqui em dobro: nome mais uma linha de descrição não escolhem entre
ESCADA e CASCATA. Só que 46×46 foi medido para reconhecer o pente do VHS e o
verde do terminal — coisas de COR e de TRAMA, que sobrevivem em quadrado
pequeno.

Aqui o assunto é LETRA, e letra é larga. O quadro é 4:3 deitado e maior:
**88×66**, quase quatro vezes a área do quadradinho do vídeo. Cabe porque a
coluna da tipografia no 2.0 tem 320px (`LARG_PADRAO` em `js/lab2.js`), contra
os 206 do Classic — que fica com 64×48. O buffer é 176×132 nos dois, então a
letra não serrilha em nenhuma das duas folhas.

Com a prévia à vista, o **número do catálogo some** nesta folha: ele era o
índice quando não havia o que ver, e virou ruído quando passou a haver.

**A miniatura sai do mesmo motor que desenha o palco** (`T.miniatura`, em
`js/type.js`) — o motor é emprestado, não reimplementado. O detalhe do 2.0 é
só a medida e o canto; a máquina está documentada em `PROJETO.md`, seção 5h.6,
junto com as duas armadilhas de relógio que ela custou.

**As MESAS não têm prévia**: elas ABREM uma folha, não aplicam um efeito. No
lugar do quadro vai o símbolo (`✂`, `✎`) sobre um fundo tingido com a cor do
laboratório, e o item inteiro acende quando a mesa está aberta.

---

## 5am. AS DUAS MESAS ESTAVAM COM O DESENHO DE OUTRA ÉPOCA

O Bruno mandou a captura das duas mesas do LAB 03 — LETRAS RECORTADAS e
ESCREVER À MÃO — com o diagnóstico: *"esse estilo de menu faz parte do site
antigo, não atual"*.

Ele estava certo, e o motivo é curto: **esta folha não tinha uma única regra
para `.tinta-bar`**. Os dois painéis caíam inteiros no desenho do Classic —
filete de 2px, sombra dura deslocada, faixa vermelha de cabeçalho, e a
fileira de controle em três pedaços (rótulo, trilho fino, número), que é
exatamente o que a ficha da direita deixou de ser na seção 5ak. Um painel do
laboratório com dois vocabulários de controle é um painel de duas épocas.

Vale como aviso geral: **repaginar por folha de estilo só alcança o que a
folha nomeia.** Estes dois painéis são montados por JavaScript
(`recorteui.js`, `tintaui.js`) e nunca apareceram numa auditoria de
`index.html`, porque não estão lá. Quem procurar o que mais ficou de fora
faz bem em olhar o que é criado em tempo de execução.

O que passaram a seguir, e que a folha já dizia em outros lugares:

- **o que FLUTUA é vidro** (seção 17): canto de 16px, desfoque de 20px,
  sombra difusa. Estes dois flutuam sobre o palco, então não são chassi opaco;
- **a LINHA É O CAMPO** (seção 5ak): uma caixa de 30px por controle, rótulo
  embutido à esquerda, valor à direita, e a caixa se enche até onde o valor
  está na faixa. O `<input type=range>` continua por baixo, invisível — os
  dois arquivos não trocaram de evento, só passaram a escrever `--fill`;
- **o cabeçalho é título, não faixa de cor.** A cor do canal aparece num
  ponto de 7px e no botão principal, que é onde ela informa em vez de gritar;
- a marca virou interruptor de trilha e os botões viraram pílula.

**Uma armadilha de três pixels:** a caixa prende o valor à direita em 52px, e
a marca e a cor não têm valor nenhum. Sem
`.ti-row:not(:has(input[type=range])) > b{display:none}` sobrava um `<b>`
vazio ocupando aqueles pixels, e o rótulo ficava espremido no que restava.

---

## 5an. A FICHA DO VÍDEO GANHA O CONTROLE DA TIPOGRAFIA

A seção 14 encostou o cursor deslizante no PÉ do campo: virou um objeto só de
ler, mas continuou um objeto a mais de OCUPAR — 32px do campo mais 25px do
cursor, 57px por parâmetro. Numa pilha de efeitos com sete parâmetros por
efeito é a ficha que o Bruno fotografou: sete linhas duplas e nada mais
cabendo. A tipografia resolveu isso na 5ak; ele viu, gostou, e pediu aqui.

**O par continua saindo igual dos cinco arquivos que desenham nesta coluna.**
Refazer os cinco para mudar DESENHO seria refazer arquitetura para repaginar,
que é o erro que este documento abre dizendo que não se comete. Quem junta é
o CSS; o JS entra só para dizer quanto encher (`--fill`, em `panels.js`,
com um MutationObserver no `#insp` que cobre os cinco sem que nenhum saiba).

**São DUAS estruturas, e a segunda é justamente a da captura dele.** A ficha
do clipe faz `.prow` + `.prow-slider`; a PILHA DE EFEITOS faz `.mprop-h` +
`.mrange`, de `js/motion.js`, e esta folha nunca teve regra para ela. Mais
um caso do aviso da 5am: **repaginar por folha só alcança o que a folha
nomeia**, e o que é montado por JavaScript não aparece numa auditoria do
`index.html`. Vai ficando um padrão — vale procurar o resto por aí.

**Reservar pixels para o número e o cronômetro foi a abordagem errada.** Só
funciona se os dois estiverem à direita, e na pilha de efeitos o cronômetro
fica à ESQUERDA. Medido: cronômetro em 1026→1046 debaixo de um cursor de 1014
a 1158 — o losango de keyframe tinha parado de responder. Agora o cursor
cobre a caixa inteira e quem precisa de clique próprio sobe acima dele.

---

## 6. Verificado

```
diferença index ↔ lab2      4 linhas · 259 ids nos dois · 0 faltando
índice dos 3 laboratórios   presente, 3 cartões, nomes sem corte, 1 linha
cartões: blocos coloridos   1 por cartão (lab-bar 14×286) · chip sem fundo
cartões: sem moldura        .labs transparente · vão de 20px · canto 0px
cartões: cortes de texto    0 em rótulo, chip, nome e texto
gif no cartão               3/3 carregados · url absoluta · 0 pedidos em 404
camadas do cartão           gif 0 · canvas 1 · texto 2 · faixa 4
nada cruza a faixa          clip-path inset(0 0 0 14px) nos três canvas
coluna esquerda             scrollWidth == clientWidth nas 4 telas · 0 vazando
cartões em 5 larguras       1000·1150·1280·1440·1600 → 0 cortes de texto
grade do índice             3 colunas acima de 596px de área · 1 abaixo
ascii nos cartões           85×35 · cor exata do canal · 8/8 quadros distintos
ascii: custo                9,96ms os três (era 14,56) · a 20fps
tipografia do cartão 03     cobertura 4% → 15% · 6 famílias, 5 larguras
tipografia: agitação        24–33% das células mudam por quadro (onda: 5%)
tipografia: custo           13,69ms os três (era 21,5) · a 20fps
cantos do selecionado       topo e interruptor de modo em 0px
ficha do índice             abre em INVENTÁRIO · cabeçalho de 6 peças para 3
botão de entrada            sem azul · faixas RGB no texto, deslizando
gif do áudio                122% e posição 70% · o do vídeo intocado
tira 01–04 + rodapé         70px devolvidos · 0 textos cortados
assinatura no cabeçalho     ao lado do subtítulo · desvio 0px · quebra limpa
rodapé do índice            static, como era · caminho e data
crédito na barra de estado  inteiro nas 4 telas
aba TOOLS                   11 botões em MÍDIA · 3 em TOOLS · título troca
miniaturas de estilo        57 células · 8 de 8 assinaturas distintas · 46px
altura das células          54–70px (46 delas em 57) · era 46–92
botão de entrada            pior faixa de 2,57 para 5,58 de contraste
botão: hover e clique       branco sólido (20,47) · faixas só em repouso
aba TOOLS                   televisão · 3 botões · título troca e volta
miniatura de estilo         46px · badge de contagem preservado em 12px
assinatura                  no cabeçalho, uma só · rodapé de volta a static
marca nova                  logo-01v.png · 200 na rede · proporção 4,08
marca: Classic intocado     0 ocorrências de logo-01v fora do lab2.css
coluna por laboratório      índice 214 · labs 320 · arrasto guardado por tela
modo claro/noturno          pastilha acesa segue o modo nos dois sentidos
Classic intacto             0 ocorrências de "lab2" no index e nos artefatos
Classic: 4 telas + resize   0 erros novos · botão de grade cicla os 4 estados
canais no cartão            azul #5b86ff · verde #35c072 · vermelho #ff5540
sem moldura                 shell em 0,0 ocupando 1900 de 1900
canal ativo segue a vista   --ch = #5b86ff no lab de vídeo
clipe da mesa               fundo #5b86ff · pílula
miniaturas                  pintadas, uma por clipe de vídeo/imagem
ficha: linhas de propriedade  17 · nenhuma sem rótulo visível
ficha: campo + cursor        fundidos numa peça (9px 9px 0 0 · 0 0 9px 9px)
ficha: nome do clipe         193px de coluna única · não corta
torre                        58px · 5 categorias · alterna FONTE ↔ catálogo
lista de efeitos             147 cartões · altura cheia (577px)
miniaturas de efeito         24 ao abrir · 78 após rolar · 0 em branco
CLASSIC após expor a máquina 52 filtros com 52 miniaturas vivas · 4 abas
                             sem torre · sem lab2 · 0 seções escondidas
torre por laboratório       índice: nenhuma · vídeo 5 · áudio 3 · tipo 3
seções se revezam           áudio FONTE→CADEIA→PRESETS, uma ON por vez
                            tipo FERRAMENTAS→SAÍDA, idem
aviso de sessão guardada    26px do pé · raio 16 · blur 20 · não tapa o topo
                            botão principal na cor do canal, em pílula
modo CLARO pelo interruptor  corpo rgb(236,236,237) · painel branco
modo NOTURNO                 corpo rgb(8,8,10) · painel rgb(18,18,22)
tipografia consertada        54 ferramentas · 39px · lista, sem cartão
cartão de efeito             84×114 · grade em 2 colunas de 83,8px
busca                        34px de altura · pílula · campo não vaza
canais                       azul #4b7bff · verde #22a95c · vermelho #f2453d
grade do visor               4 estados · encaixa 558×314 no quadro 558×314
clipe                        miniatura de 218px num clipe de 218px (sem máscara)
                             raio 10 · anel do canal quando selecionado
faixa da pista               42px · raio 12 · régua 28px
colisões nas barras          nenhuma (visor · transporte · mesa)
player: ícones centrados     desvio 0,00px em x e y, nos 5 botões
player: tamanhos             4 círculos de 38px · tocar 52px cheio
player: alinhamento          5 centros verticais em 422 · grupo no meio (154=154)
player: tocar ↔ pausar       ▶ vira ❚❚, forma troca, sem travar a página
CLASSIC: botão de tocar      34px · texto ▶ · sem svg — intocado
transporte enxuto            52px numa fileira · visor +52px de altura
botão de tocar               44×44 · folga 8/8 · centrado · ícone 0,00px
realce dos botões            26px no visor · 24px na mesa (era 30px)
filetes de canal no 2.0      0px em vp · barra · transporte · mesa
CLASSIC: filetes             2,4px azul — intocados
CLASSIC: botão de tocar      34×24 · realce 30px — intocado
player centrado              desvio 0 do grupo e 0 do botão de tocar
faixa do laboratório         34px · Helvetica 12px · branco sobre a cor do canal
                             azul · verde · vermelho, trocando com a vista
CLASSIC: faixa               26px · JetBrains Mono 9px · texto azul — intocada
cartões do índice            canto 0px · faixa 14px na cor do canal
ascii dos gifs               3 de 3 animando (conteúdo do canvas em 3 instantes)
nome e texto sobre o ascii   z-index 2 · sem corte · nos dois modos
CLASSIC: cartões             faixa 12px · sem ascii · 0 imgs de gif — intocado
FRAME e GRAVAR               voltam com a câmera aberta, somem ao fechar
CLASSIC: transporte          CAM · FRAME · GRAVAR · ESCANEAR · MONTAR · FPS
                             todos visíveis — intocado
colisão chip × rótulo       nenhuma, a 570px e a 1900px
erros de console            nenhum
CLASSIC                     sem data-ui · sem lab2.css · sem lab2.js
                            --paper #efede4 · canais #1b4fd8/#1c7a41/#d0271b
```

**Sessão 5ad–5aj** (esta, com captura de tela):

```
COLUNA ESQUERDA
grade FONTE em 4 larguras   196(piso)→1 col 88px · 240→1 col 122 · 320→2×101
                            420→3×97 · 0 cortes de rótulo em nenhuma
ícones cheios               14 trocados · fill computado currentColor
                            CLASSIC: 0 trocados · fill none — intocado
faixas deitadas             @container ≤170px → viram pastilha; SOBREPOR
                            deixa de partir a palavra
piso da coluna              196px · arrasto abaixo disso não vaza (vaza −23px)

MINIATURAS
olho: metade PB/cor         luminância Rec.709 · desenhado a 336×252 (2×)
olho no cartão              ZOOM 0.62 · fundos pintados de −w a 2w
estilos pintados            6/6 com src > 100 chars, sem erro
pilha de efeitos            3 linhas → 3 <img> → 3 pintadas · cache 3
pilha: valor mudou          amount 0,35→0,90 refez 1 miniatura (ok:4, cache 4)

CHAVES E SETAS
LOOP ligado                 clip-path: none · knob 14×14 · translateX(14px)
setas de recolher           26×26 · glifo 17px · rgb(155,155,170) aberta
                            rgb(75,123,255) recolhida (= --ch)

BOTÃO DE ENTRADA
repouso / hover / clique    os três com background-clip:text e faixas vivas
chapa                       backdrop-filter, não sombra interna
@supports sem backdrop      cobre os 3 estados (antes só o repouso)

SCANNER STATION
knobs                       4 · VELOCIDADE 1→2,3 · GRÃO 40→61 · ONDA 0→12
manivela                    0→70 linhas num arrasto · 416/720 num longo
                            leitura do bisel espelha a da caixa do filme
gesto sem captura           pegou:[true,true,true] com ponteiro sintético
aparelho em 1730×907        cartão 883 · tela 426 (48%) · mesa 271 (31%)
                            canvas retrato ocupa 98% da altura do poço
aparelho em 1090×800        tela 41% · mesa sem rolagem
aparelho em 860×760         2 colunas · telas empilhadas 103px cada
                            fileira de teclas dentro da tampa · 0 cortes
dobradiça e pé              removidos do DOM (não escondidos por CSS)
FECHAR · Esc · reabrir      fecha, fecha, reabre · knobs continuam 4
CLASSIC: mesa               sem l2sc · 0 knobs · sem tampa — intocada
                            VE.mesaui.pintar exposto (única linha nova lá)
erros de console            nenhum, em aba limpa
```

## 7. Falta

- **FAVORITOS** e as faixas TRENDING / FOR YOU da referência — a busca já
  existe e já funciona sobre os cartões; falta a estrela e a seção;
- **arrastar o cartão para o clipe** (hoje o cartão já é `draggable`, herdado
  do Classic, mas o alvo de soltar é o antigo);
- **grupos de ícones segmentados** na ficha (alinhamento, espelhar, girar) —
  a referência 03 os mostra numa caixa arredondada única;
- **a torre de áudio e tipografia** existe, mas mostra seções empilhadas; só a
  de vídeo tem catálogo com abas;
- janela de exportação redesenhada;
- ~~a imagem das miniaturas de estilo~~ **resolvido na 5ae**: o cartão dos anos
  80 virou um OLHO em close, ainda desenhado em código (`olho` em js/lab2.js),
  metade em preto e branco e metade em cor. Continua trocável por um
  `drawImage` se um dia aparecer uma foto — mas desenhado ele mantém o
  `rgb_lab-arquivo-unico.html` funcionando, que não embute imagem externa;
- **o amarelo da marca no modo claro** é o par de menor contraste do conjunto.
  Não foi mexido: alterar cor de marca não é decisão de quem implementa. Se
  incomodar, resolve-se com uma sombra fininha só no modo claro;
- **a mesa de controle do scanner rola** abaixo de ~900px de largura: com as
  duas telas empilhadas não há altura para as duas coisas, e entre esconder
  metade dos botões e rolar um pouco, rolar é o mal menor. Se incomodar, o
  caminho é reagrupar os controles entre os quatro postos — hoje a coluna 3
  concentra dois pares de botão, a cor, dois deslizadores e uma chave, e é ela
  sozinha que define a altura da mesa;
- **os ícones da grade FONTE** são silhuetas desenhadas à mão em `js/lab2.js`.
  Se um dia entrar um conjunto de ícones de verdade, é trocar o mapa `CHEIOS`
  e nada mais — o resto do desenho não olha para dentro deles;
- **aviso no console:** `ResizeObserver loop completed with undelivered
  notifications` ao trocar de aba na torre. É o aviso benigno do Chrome quando
  um observador de tamanho provoca outro ajuste no mesmo quadro — vem do
  medidor da barra da mesa, que é comportamento antigo. Nada quebra.

**Aviso sobre tela estreita:** abaixo de 900px o Classic esconde a coluna da
esquerda inteira (`@media` em `css/labs.css`) — e com ela a torre. Isso é
comportamento antigo, não do 2.0, mas foi o que me impediu de julgar a torre
no painel desta sessão, que abre com 519px.

**Sobre ver a tela.** Nas primeiras sessões o painel não pintava a página
(`visibilityState: hidden`), e tudo era verificado por MEDIDA — geometria,
estilo calculado, leitura de pixels, contraste, rede. Da sessão das seções
5ad–5aj em diante a captura de tela funciona, e as decisões que dependem do olho
puderam ser julgadas: o olho das miniaturas a 84px, os ícones cheios sobre a
pastilha azul, o aparelho da mesa inteiro.

Uma ressalva que continua valendo: no painel o `requestAnimationFrame` é
**estrangulado**. As miniaturas e o scan avançam devagar ou só quando uma
captura força um quadro. Isso é do ambiente, não do código — no navegador do
Bruno o laço roda a 60fps. Quando uma medição de fila ou de scan parecer travada
neste painel, é este o motivo, e não um defeito.

---

## Apêndice — auditoria do Classic

```
1.200  controles no documento com o app parado
1.186  parâmetros somando os 147 efeitos
  376  IDs consultados pelo JavaScript · 222 declarados no HTML
  147  efeitos em 8 famílias · 52 filtros · 57 estilos · 30 transições
   27  modos de mistura · 34 módulos de áudio · 26 presets de áudio
   12  famílias tipográficas · 43 animações de texto
   36  atalhos + 9 com Ctrl
```

**Um defeito do Classic que o 2.0 encontrou:** `id="snapBtn"` estava em DOIS
elementos — o botão PNG do viewport e o ÍMÃ da mesa. Os dois `addEventListener`
caíam no primeiro do documento, então o ÍMÃ **não fazia nada** e apertar PNG
ligava e desligava o ímã junto com a foto. O botão da mesa virou `#imaBtn`.
Corrigido no Classic também.
