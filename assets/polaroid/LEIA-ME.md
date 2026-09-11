# A pasta do polaroid

Três coisas moram aqui, e cada uma é usada de um jeito diferente pelo
laboratório. Nada aqui é enfeite: se um arquivo desta pasta sumir, uma
função da câmera some junto.

```
camera.png        a câmera — é a JANELA, não a ilustração dela
molduras/         escaneamentos de papel polaroid VAZIO
filmes/           fotos ORIGINAIS de polaroid, para amostrar a cor
```

---

## `camera.png` — a câmera é a interface

798×662, com transparência. O laboratório recorta esta imagem em **três
faixas**, nas alturas medidas dentro do próprio arquivo:

| faixa | altura | o que é | o que faz na tela |
|---|---|---|---|
| corpo | 0 → 66,92% | lente, disparador, flash, olho, faixa | os controles |
| porta | 66,92 → 87,61% | o painel do filme | gira e abre os ajustes |
| base | 87,61 → 100% | a fenda e o lábio | por onde a foto sai |

A foto revelada fica **entre** a base e o corpo: some por trás da máquina,
aparece na fenda e passa por cima do lábio — que é como um polaroid sai
de verdade.

Trocar esta imagem por outra câmera exige remedir as peças. As medidas
estão em `js/polaroidui.js`, na tabela `GEO`, em fração (0..1), com os
pixels originais anotados ao lado.

---

## `molduras/` — o papel

Cada arquivo é o **escaneamento de uma folha polaroid vazia**. É o que dá
trama, sujeira e o amarelado que muda de canto para canto — coisa que
retângulo branco desenhado não tem.

**Para acrescentar uma moldura:** jogue o arquivo aqui dentro. Com o
servidor no ar (`node server.js`) ela aparece sozinha na aba PAPEL, e a
**janela da emulsão é medida no arquivo** — o laboratório acha sozinho
onde termina a borda branca e começa a foto.

Se quiser fixar a medida (ou usar o site sem servidor), acrescente uma
linha em `molduras.json`:

```json
{ "id": "minha", "nome": "PAPEL X", "arquivo": "minha.png",
  "janela": null, "realce": 0 }
```

`janela` é o retângulo da emulsão em fração da imagem — deixe `null` para
o laboratório medir. Os escaneamentos que já estão aqui foram medidos e
bateram entre si em 0,2%.

### `realce` — e por que ele existe

**Mande PNG.** É a única coisa que importa nesta pasta.

```
realce: 0   a folha já tem a trama do papel — usa-se COMO ESTÁ, bit a bit
realce: 1   a trama foi comida pela compressão e tem de ser reconstruída
```

O `papel.png` é a folha padrão e leva `realce: 0`. As duas em JPEG
(`creme`, `preta`) levam `1`, e nelas o laboratório desenha um relevo de
losango por cima do escaneamento — porque no arquivo delas não sobrou
relevo nenhum: a faixa branca do `creme.jpg` varia só dezassete níveis
em 255, e o que restou já não é papel, é o bloco de 8×8 do JPEG.

Custou seis tentativas descobrir isto, e a moral é curta: **um PNG de
240 KB resolve o que nenhuma quantidade de processamento resolve num
JPEG de 55 KB.** Se trocar um JPEG por PNG, ponha `realce: 0` e o
laboratório para de acrescentar coisa.

O papel **volta por cima** da foto em dois passes fracos (multiply e
screen) depois da revelação. É isso que faz a imagem parecer revelada
*dentro* da folha, e não colada sobre ela.

---

## `filmes/` — os originais

Fotos de polaroid de verdade, escaneadas. **Não são exemplo:** o
laboratório *lê a cor delas*.

Na aba FILME da janelinha, clicar num original monta um filme com a
assinatura dele. A conta é direta — três percentis por canal (1%, 50%,
99%) resolvem os três números da curva:

```
preto do original  → lift    (onde o preto passa a começar)
branco do original → ganho   (onde o branco termina)
o meio             → gama    (a barriga da curva)
```

É por isso que esta pasta importa. O que faz um polaroid parecer polaroid
não é uma dominante por cima: é o **preto levantado**. Nos originais que
estão aqui, o canal azul começa em 180 de 255 num deles e em 85 no outro
— e é essa diferença, medida, que separa um "estourado" de um "lavado".

**Para acrescentar:** jogue o arquivo aqui. Com o servidor no ar ele
aparece sozinho. Sem servidor, acrescente uma linha em `filmes.json`.

Quem não quiser mexer em pasta nenhuma tem o botão
**AMOSTRAR UM ARQUIVO…**, que faz a mesma leitura num arquivo solto.
