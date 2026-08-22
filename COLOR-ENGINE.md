# rgb_lab — color engine

Motor de cor do laboratório. Reconstrução independente de cinco looks
fotográficos, com separação rigorosa entre **perfil de entrada**,
**transformação técnica**, **look criativo**, **transform de saída** e
**ferramentas** (grão, fade, vinheta).

---

## Procedência — leia isto primeiro

Os cinco looks são uma **reconstrução independente**, classificada como
`RECONSTRUCTED`. Não são, e não devem ser descritos como, os parâmetros
internos de nenhum produto: a VSCO não publica matriz, curva, LUT nem
parâmetro de preset algum.

O que foi usado como referência: a **direção estética descrita publicamente**
para cada preset — categoria, comportamento tonal, comportamento cromático,
finalidade. Toda a matemática deste diretório é um modelo próprio construído a
partir dessa direção. Nada foi extraído, decompilado ou copiado de software de
terceiros.

Os nomes de exibição são do rgb_lab. Cada look guarda a referência estética no
campo `ref`, para o trabalho ficar rastreável:

| Código | Nome | Referência estética |
|---|---|---|
| `L01` | ANÁLOGO | VSCO A6 |
| `L02` | VIVO | VSCO C1 |
| `L03` | FERRUGEM | VSCO M5 |
| `L04` | RETRATO | VSCO G3 |
| `L05` | FAROL | VSCO HB2 |

`C.SHOW_REF_NAMES = true` em `looks.js` mostra os códigos de referência na
interface. Fica desligado por padrão: são nomes de produto de terceiros.

---

## A cadeia

```
VÍDEO
  ↓  PERFIL DE ENTRADA · profiles.js
     faixa (full/limited) → função de transferência → matriz de primárias
  ↓  LUZ LINEAR no espaço de trabalho (linear Rec.709)
  ↓  [ tone map, só se a entrada for HDR ]
  ↓  LOOK CRIATIVO · engine.js + looks.js
     exposição · temperatura · matriz · curvas · matiz/saturação seletivos
     · roll-off · tonalização dividida · fade · compressão de gamute
  ↓  TRANSFORM DE SAÍDA
  ↓  sRGB de exibição
  ↓  FERRAMENTAS SEPARADAS: grão, vinheta, película
```

**Perfil não é look.** O mesmo `L01` sobre o mesmo pixel `(0.45, 0.38, 0.30)`:

```
srgb     → 118,98,79
rec709   → 108,85,62
slog3    → 170,100,51
logc3    → 189,118,62
```

É por isso que existe a camada de perfil. Aplicar um look direto sobre um sinal
Log sem normalizar dá um resultado que não tem relação com o look.

---

## Em que domínio cada operação acontece

| Operação | Domínio | Por quê |
|---|---|---|
| exposição, matriz, saturação, matiz | **luz linear** | são operações físicas; em gamma distorcem o matiz |
| contraste e curvas | **log** | curva em S em linear estoura; em log se comporta como emulsão |
| tonalização dividida, fade | **exibição** | são gestos de laboratório, não de cena |
| compressão de gamute | **linear** | último passo antes de codificar |

O domínio log é Cineon-like: `0.18 → 0.5`, cerca de 13 stops.

> **Armadilha que custou caro:** no domínio log, `1.0` **não é branco** — é 16×
> o cinza médio. Branco de exibição fica em `logEnc(1.0) ≈ 0.6903`. A primeira
> versão da curva comprimia o ombro em direção a `1.0`, mandava o branco para
> `1.74` em linear e o clamp cortava. O sintoma aparecia longe da causa: a pele
> clara girava 19° de matiz, porque com o vermelho travado em 255 o matiz
> escorrega para o amarelo. A constante `LOG_WHITE` existe por isso.

---

## Arquivos

```
js/color/profiles.js   perfis de entrada: primárias, transferência, faixa
js/color/engine.js     o núcleo — implementação de REFERÊNCIA em JS
js/color/looks.js      os cinco looks: só parâmetros, nenhuma matemática
js/color/lut.js        LUT 3D, .cube, curvas de 1024 amostras
js/color/validate.js   ΔE2000, ΔE-OK, carta de teste, concordância GPU
js/fx6.js              o gêmeo em GLSL — uma passada de fragment por look
```

A matemática existe **duas vezes** de propósito: o shader roda por pixel em
tempo real; a versão em JS gera os `.cube`, roda os testes e serve de verdade
quando os dois discordam. `validate.js` mede a diferença — e é a única medida
do sistema que tem certo e errado.

---

## Perfis de entrada

| id | nome | gamut | transferência | faixa | confiança |
|---|---|---|---|---|---|
| `srgb` | sRGB / DISPLAY | Rec.709 | sRGB | full | alta |
| `rec709` | REC.709 (BT.1886) | Rec.709 | BT.1886 | limited | alta |
| `rec709full` | REC.709 FULL | Rec.709 | BT.1886 | full | alta |
| `rec709cam` | REC.709 OETF | Rec.709 | BT.709 OETF | limited | alta |
| `p3` | DISPLAY P3 | P3-D65 | sRGB | full | alta |
| `slog3` | SONY S-LOG3 | S-Gamut3.Cine | S-Log3 | limited | média |
| `logc3` | ARRI LOGC3 | ARRI WG3 | LogC3 EI800 | limited | média |
| `clog3` | CANON C-LOG3 | Cinema Gamut | C-Log3 | limited | média |
| `bmdfilm` | BLACKMAGIC FILM G5 | BMD WG | Gen 5 | full | média |
| `applelog` | APPLE LOG | Rec.2020 | Apple Log | full | média |
| `pq` | HDR · PQ | Rec.2020 | ST 2084 | full | alta |
| `hlg` | HDR · HLG | Rec.2020 | HLG | full | alta |

**`conf: 'alta'`** = norma pública, conferida. **`conf: 'media'`** = white paper
do fabricante; as constantes conferem no cinza médio, mas **confira contra o
documento do fabricante antes de usar em entrega**.

Verificação de cinza médio (0.18 linear → código → 0.18):

```
slog3     0.4106     logc3     0.3910     clog3     0.3310
bmdfilm   0.3836     applelog  0.6316     erro < 1e-16 em todos
```

Os dois primeiros batem com os valores publicados (S-Log3 ≈ 0.41,
LogC3 ≈ 0.391), o que é bom indício de que as constantes estão certas.

**HDR** não recebe o look direto: PQ e HLG passam por tone map (Reinhard
estendido, branco de referência 4.0) antes. Nunca há `clamp` antes do tone map.
A detecção automática de HDR não existe no navegador de forma confiável — o
perfil é declarado.

---

## Parâmetros de um look

Todo look é só isto. `engine.js` sabe o que fazer com cada campo; `looks.js`
não contém matemática nenhuma.

| campo | faixa | o que faz |
|---|---|---|
| `exposure` | stops | multiplicação em luz linear |
| `temp` / `tint` | −1…1 | ganho por canal, aproximação de von Kries |
| `contrast` | −1…1 | inclinação em torno do pivô, no log |
| `pivot` | 0…1 | onde a inclinação se apoia (log) |
| `toe` | 0…1 | quanto o pé fecha as sombras |
| `shoulder` | 0…1 | onde o joelho cai entre o pivô e o branco |
| `lift`/`gamma`/`gain` | por canal | curva por canal, no log |
| `mtx` | 3×3 | matriz criativa em linear, perto da identidade |
| `satGlobal` | × | saturação geral, em OKLCH |
| `satShadow`/`satMid`/`satHigh` | × | saturação por faixa de luminância |
| `bands[]` | — | `{c, w, dh, ds, dl}` — centro°, largura°, giro°, croma×, luz× |
| `skinCenter`/`skinWidth` | graus | onde fica a pele em OKLCH |
| `skinProtect` | 0…1 | força da âncora de pele |
| `splitSh*`/`splitHi*` | — | tonalização dividida: matiz° e força |
| `hlRoll`/`hlKnee` | — | compressão de altas luzes em linear |
| `fade` | 0…1 | levanta o preto no fim |

### Matrizes

Nenhuma matriz é arbitrária. Todas nascem da identidade com perturbação pequena,
por `mtx(mute, warm)`:

* `mute > 0` puxa cada canal na direção da luma → cor contida
* `mute < 0` afasta da luma → **separação cromática**, que é diferente de saturar
* `warm > 0` ganha no vermelho, perde no azul

| look | mute | warm | leitura |
|---|---|---|---|
| L01 ANÁLOGO | +0.06 | +0.012 | contido e levemente quente |
| L02 VIVO | −0.10 | +0.004 | separação cromática |
| L03 FERRUGEM | +0.14 | +0.030 | contido e quente |
| L04 RETRATO | +0.05 | +0.012 | quase neutro, o trabalho é nas bandas |
| L05 FAROL | −0.04 | −0.015 | separação com viés frio |

### Bandas de matiz

Peso **gaussiano** na distância angular, nunca limiar duro — limiar cria borda
visível entre cores vizinhas. Matizes de referência medidos, não estimados:

```
vermelho  29°    amarelo  108°    ciano   195°
verde    142°    azul     264°    magenta 328°
pele  44°–46°  (nas quatro amostras de pele da carta)
```

### Âncora de pele

A proteção de pele não é um "não mexa nesta faixa". É uma **âncora**: depois de
todas as etapas, matiz e croma da pele voltam na direção de onde entraram, na
proporção de `skinProtect`. A **luminância não é ancorada** — a pele continua
recebendo o contraste e a exposição do look, que é o que se quer.

O croma volta para o valor de entrada **reescalado pela mudança de luminância**:
clarear a pele não a deixa lavada, escurecer não a deixa carregada.

> A primeira versão protegia só as **bandas**. Saturação global, saturação por
> luminância, temperatura, matriz e ganho por canal passavam direto — e era daí
> que vinha croma de 2,9× e giro de 25° na pele. Proteger pele exige ancorar o
> resultado, não filtrar uma etapa.

---

## Força do look

`strength` interpola **os parâmetros**, não a saída:

```
L = mixLook(identidade, look, strength)
```

Misturar a saída (`mix(orig, look, s)`) produz matiz intermediário estranho e
achata o contraste de um jeito que preset nenhum faz. A interpolação acontece no
shader, então não custa nada. Medido: em `strength = 0` a imagem volta exata
(ΔE 0.000); em `strength = 0.5` os cinco looks continuam sem clipping.

Os quatro controles do painel — `Exposição`, `Contraste`, `Cor`, `Tom` — são
somados **depois** da força, como ajuste manual sobre o look já interpolado.

---

## LUT 3D

`C.exportCube('l01')` gera um `.cube` de 33³. `C.exportAllCubes()` gera os cinco.

O LUT é do **look**, não da cadeia inteira:

```
PERFIL DE ENTRADA → ESPAÇO DE TRABALHO → [ este LUT ] → SAÍDA
```

O cabeçalho do arquivo declara em que domínio ele espera receber a imagem.
Nunca `VÍDEO → LUT` direto: um `.cube` não sabe o que os números que recebe
significam.

Dois domínios: `srgb` (padrão, o que Resolve e Premiere esperam) e `log`
(mais precisão nas sombras, exige entrada no mesmo log).

Grão, fade e vinheta **não** entram no LUT — são ferramentas separadas.

---

## Medição

`VE.color.report()` no console. Carta de 20 amostras: quatro tons de pele
(clara, parda, escura, muito escura), céu, folhagem, branco, cinza, preto,
primárias saturadas, neon, contraluz, high key, low key.

Última medição, força 1.0, LUT 33³:

```
LOOK              GPU×REF        magnitude   pele giro   clip   LUT 33³
L01 ANÁLOGO       0.26 / 0.98        3.4        1.1°       0      0.08
L02 VIVO          0.18 / 0.36        6.4        2.5°       0      0.37
L03 FERRUGEM      0.27 / 0.66        8.1        2.7°       0      0.22
L04 RETRATO       0.19 / 0.52        3.3        0.4°       0      0.16
L05 FAROL         0.18 / 0.68        6.6        4.1°       0      0.29
```

**O que cada coluna é:**

* **GPU×REF** — shader contra a referência em JS, ΔE2000. É a **única coluna com
  certo e errado**. Alvo < 1.0. O resíduo é quantização de 8 bits do alvo de
  render.
* **magnitude** — quanto o look move a imagem. Serve para comparar os cinco entre
  si e pegar exagero. **Não é medida de acerto.**
* **pele giro** — maior giro de matiz em OKLCH nas quatro amostras de pele.
  Responde "a pele virou laranja?". Alvo < 6°.
* **clip** — patches que **passaram** a estourar (os que já entram no limite —
  branco, neon — não contam).
* **LUT 33³** — perda da quantização do `.cube` contra a matemática contínua.

**O que não é medido, e não pode ser:** equivalência com qualquer produto. Não
existe imagem oficial de referência. Por isso os cinco continuam
`RECONSTRUCTED`, e nenhum deve ser chamado de `EXACT`.

---

## Compressão de gamute

Depois da saturação, uma cor pode cair fora do sRGB. Cortar canal a canal
resolve o número e estraga a cor: o canal que satura trava, os outros continuam,
e o matiz escorrega. Em vez disso o croma encolhe em direção ao eixo acromático
até caber, preservando luminância e matiz.

Foi o que tirou o último clipping de `L02` (amarelo saturado indo para
`255,216,0`).

---

## Acrescentar um look

Uma entrada em `LOOKS` no `js/color/looks.js`. Nada mais.

O shader é **gerado** a partir do registro na hora de compilar, então o núcleo
não muda, a galeria pega o look sozinha e o `.cube` sai junto. Foi a razão de
separar parâmetros de matemática.

```js
L({
  id: 'l06', code: 'L06', name: 'NOME', family: 'LOOK',
  ref: 'direção estética: … (reconstrução independente)',
  status: 'RECONSTRUCTED',
  desc: '…',
  contrast: 0.2, pivot: 0.47, toe: 0.3, shoulder: 0.3,
  mtx: mtx(0.05, 0.01),
  bands: [ { c: H.blue, w: 42, ds: 1.2 } ],
  skinCenter: H.skin, skinWidth: 24, skinProtect: 0.8
})
```

Depois, `VE.color.report()` para conferir pele, clipping e concordância GPU.

---

## Limites conhecidos

* **WebGPU não foi implementado.** O laboratório inteiro é WebGL2; um segundo
  backend seria um renderizador paralelo, com custo alto e ganho nenhum aqui. A
  cadeia cabe numa passada de fragment, que era o objetivo.
* **Curvas são analíticas, não splines amostradas.** §15 pedia LUT 1D de 1024
  pontos; elas existem (`C.curveLUT`) e alimentam o `.cube` e os testes, mas o
  shader avalia a forma analítica. Motivo: parâmetro interpola, LUT amostrada
  não — e a força do look precisa interpolar parâmetros.
* **Perfis Log com `conf: 'media'`** conferem no cinza médio mas não foram
  validados contra material real de câmera.
* **HDR** entra por declaração, não por detecção.
* **Espaço de trabalho é linear Rec.709.** A arquitetura aceita Rec.2020 e
  ACEScg (`C.WORKING`), mas os looks foram calibrados em Rec.709.
