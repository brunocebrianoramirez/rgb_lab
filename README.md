# rgb_lab — Laboratório Audiovisual Experimental

> Elaborado e criado por **Bruno Cebriano Ramirez**.

Um sistema de experimentação audiovisual que roda **inteiro no navegador** —
sem servidor, sem upload, sem dependências. HTML, CSS e JavaScript puros, com
WebGL2 para a imagem e Web Audio para o som. Três mesas de trabalho — **vídeo**,
**áudio** e **tipografia** — compartilham a mesma composição, os mesmos presets e
o mesmo sistema gráfico.

**No ar:** https://brunocebrianoramirez.github.io/rgb_lab/ (Classic) ·
https://brunocebrianoramirez.github.io/rgb_lab/lab2.html (o 2.0, a repaginação)

---

## Como abrir

Clique duplo em `ABRIR RGB_LAB.bat` (sobe o servidor local e abre o navegador),
ou pelo terminal:

```bash
node server.js
```

e depois `http://localhost:5173`. O servidor não tem dependências e serve o
vídeo com `Range` (sem isso o navegador não posiciona um MP4).
`rgb_lab-arquivo-unico.html` é tudo dentro de um arquivo só, para mandar pra
alguém. Precisa de Chrome, Edge ou Firefox atualizados (WebGL2 + Web Audio).

---

## O que tem dentro

**01 · LABORATÓRIO DE VÍDEO** — edição não linear por camadas (transformar →
efeitos → cor → canais → máscaras → matte → mesclar → compor), um catálogo de
efeitos em GLSL dividido em oito famílias (lego, gravura, cianotipia, película,
CRT, datamosh, papel térmico, profundidade por I.A., manchas…), MOTION com
keyframes e 30 transições, um motor de cor próprio ([COLOR-ENGINE.md](COLOR-ENGINE.md))
e exportação exata por WebCodecs com escritor de WebM próprio.

**02 · LABORATÓRIO DE ÁUDIO** — montagem, espectrograma, um rack de 26
módulos, tempo elástico e afinação por voz, áudio reativo na ficha do clipe.

**03 · LABORATÓRIO DE TIPOGRAFIA** — 12 famílias desenhadas por código, texto
como camada de vídeo, tramas.

**TOOLS — as máquinas.** Instrumentos que flutuam no palco, cada peça é uma
função, e o que produzem vira **fonte** do laboratório:

| máquina | o que faz |
|---|---|
| **POLAROID** | a câmera é a janela: a foto entra pela lente e sai pela fenda, revelada em papel escaneado |
| **SCANNER** | a mesa de digitalização linha a linha: o filme guarda o que passava sob o cabeçote |
| **MOSAICO** | uma grade de quadros com um vídeo de verdade dentro de cada um |
| **SONÓGRAFO** | uma linha parada sobre o vídeo; o que a atravessa vira nota (MIDI ou áudio) |
| **FILMADORA** | a traseira de uma câmera de filme: bitola, seletor de filme e o vermelho que grava a composição com a película — medida, não imitada |
| **AQUARELA** | a mesa de luz do animador: água e pigmento de verdade (o modelo de Curtis na GPU, 52 pigmentos por Kubelka-Munk) sobre o quadro da composição, um quadro de cada vez — a animação em cima da animação |

No laboratório de tipografia, três **mesas**: LETRAS RECORTADAS (cada letra
um pedaço de papel), ESCREVER À MÃO e **PASTILHA** — o letreiro de metrô
assentado em ladrilhos, com a calçada de Copacabana, o azulejo do Bulcão e
as paletas brasileiras.

Cada laboratório tem um tutorial dentro dele (`? COMO USAR`).

---

## Os documentos

| arquivo | serve para |
|---|---|
| [LEIA-ME.md](LEIA-ME.md) | o **manual de uso** — cada laboratório, cada máquina, atalhos, e o Manual 01 (como fazer uma videoarte) |
| [PROJETO.md](PROJETO.md) | o **documento de continuidade** — decisões tomadas, o que foi medido, o que não foi verificado, pendências; começa em **RETOMAR AQUI** |
| [COLOR-ENGINE.md](COLOR-ENGINE.md) | o motor de cor: perfil de entrada × look |
| [RGB_LAB-2.0.md](RGB_LAB-2.0.md) | a repaginação 2.0 — mesma estrutura, outro desenho |
| [DOSSIE.md](DOSSIE.md) | o dossiê de entrada, gerado por `node dossie.js` |

---

## Estrutura

```
index.html                    RGB_LAB CLASSIC: entrada, boot, índice, três laboratórios
lab2.html                     RGB_LAB 2.0 — gerado por `node build-lab2.js` (não editar à mão)
rgb_lab-arquivo-unico.html    tudo num arquivo — gerado por `node build-arquivo-unico.js`
js/                           os motores: gl.js (WebGL2), state.js (edição), media.js (fontes),
                              fx*.js (efeitos), audio.js, type.js, e cada máquina em <nome>.js + <nome>ui.js
css/                          system.css (tokens e casca), labs.css, lab2.css, e o css de cada máquina
assets/                       marca, papéis escaneados, carcaças de câmera, cartas de calibração
server.js                     servidor local sem dependências (porta 5173)
dist/                         a versão de arquivo único empacotada
```

O que fica fora do repositório (`.gitignore`): a pasta de referências, com
material de terceiros usado só como mapa de categorias, e a configuração local.

---

## Como este projeto é feito

Cada mudança é verificada por **medida**, não por olho: pixel lido da GPU,
massa conservada numa simulação, espectro de um buffer, o modelo lido de volta
depois de um evento. "Compila e roda" não é prova. O [PROJETO.md](PROJETO.md)
guarda, passada por passada, o que foi decidido, o que a medida provou e as
armadilhas que só ela pegou.
