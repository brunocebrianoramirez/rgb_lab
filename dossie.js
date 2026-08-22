/* ============================================================
   rgb_lab — GERADOR DE DOSSIÊ
   ------------------------------------------------------------
   Uso:  node dossie.js

   Junta num arquivo só tudo o que alguém (pessoa ou assistente) precisa
   para entrar no projeto sem ter estado nele:

     · as DIRETRIZES e as decisões travadas   (PROJETO.md)
     · o manual de uso                        (LEIA-ME.md)
     · o motor de cor                         (COLOR-ENGINE.md)
     · um INVENTÁRIO gerado na hora           (o que existe hoje no código)

   Por que gerado e não escrito à mão: o inventário envelhece em uma
   semana. Contar efeito, família, forma de máscara e módulo LENDO o
   código é a única forma de o documento não passar a mentir.

   Saem dois arquivos:
     DOSSIE.md    para ler e para subir numa conversa
     DOSSIE.json  o mesmo inventário, em dados, para quem for programar
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

function ler(f) {
  try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }
  catch (e) { return null; }
}

/* ------------------------------------------------ a ordem real dos js
   Não vale listar a pasta em ordem alfabética: a ordem em que os
   arquivos entram no index.html É a arquitetura (fxfam.js tem de ser o
   último dos fx, comp.js antes de gl.js, e por aí).                  */
function ordemDosScripts() {
  const html = ler('index.html') || '';
  const out = [];
  const re = /<script src="(js\/[^"]+)"><\/script>/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

/* o comentário de cabeçalho de cada módulo, que é onde cada arquivo
   explica para que serve */
function resumoDoArquivo(rel) {
  const txt = ler(rel);
  if (!txt) return { linhas: 0, resumo: '' };
  const linhas = txt.split('\n').length;
  const m = txt.match(/^\s*\/\*([\s\S]*?)\*\//);
  let resumo = '';
  if (m) {
    resumo = m[1]
      .split('\n')
      .map(l => l.replace(/^\s*[=\-*]*\s?/, '').trim())
      .filter(l => l && !/^={3,}$/.test(l) && !/^-{3,}$/.test(l))
      .slice(0, 6)
      .join(' ');
  }
  return { linhas, resumo: resumo.slice(0, 260) };
}

/* ------------------------------------------------ catálogos do código */
function efeitos() {
  const out = [];
  fs.readdirSync(path.join(ROOT, 'js'))
    .filter(f => /^fx\d*\.js$/.test(f) || f === 'filters.js')
    .forEach(f => {
      const txt = ler('js/' + f) || '';
      const re = /id:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'\s*,\s*cat:\s*'([^']+)'/g;
      let m;
      while ((m = re.exec(txt))) out.push({ id: m[1], nome: m[2], familia: m[3], arquivo: 'js/' + f });
    });
  return out;
}

function listaSimples(rel, nomeVar) {
  const txt = ler(rel) || '';
  const re = new RegExp(nomeVar + '\\s*=\\s*\\[([^\\]]*)\\]');
  const m = txt.match(re);
  if (!m) return [];
  return (m[1].match(/'([^']+)'/g) || []).map(s => s.slice(1, -1));
}

function familias() {
  const txt = ler('js/fxfam.js') || '';
  const out = [];
  const re = /\{\s*id:\s*'([^']+)',\s*label:\s*'([^']+)',\s*nome:\s*'([^']+)'[\s\S]*?note:\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(txt))) out.push({ id: m[1], label: m[2], nome: m[3], nota: m[4] });
  /* "todos" é o chip de ver tudo, não uma família */
  return out.filter(f => f.id !== 'todos');
}

/* A CATEGORIA ESCRITA NO EFEITO NÃO É A FAMÍLIA DELE.
   `fxfam.js` reetiqueta em tempo de execução: primeiro pela tabela MOVE
   (efeito por efeito), depois por LEGACY (categoria antiga → família).
   Contar direto do `cat:` do código dá número errado — a primeira versão
   deste gerador dizia 6 efeitos em PIXEL quando são 15.               */
function tradutorDeFamilia() {
  const txt = ler('js/fxfam.js') || '';
  function tabela(nome) {
    const i = txt.indexOf('var ' + nome + ' = {');
    if (i < 0) return {};
    const fim = txt.indexOf('};', i);
    const corpo = txt.slice(i, fim);
    const t = {};
    const re = /([A-Za-z_$][\w$]*)\s*:\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(corpo))) t[m[1]] = m[2];
    return t;
  }
  const MOVE = tabela('MOVE'), LEGACY = tabela('LEGACY');
  const validas = familias().map(f => f.id);
  return function (id, cat) {
    let f = MOVE[id] || LEGACY[cat] || cat;
    if (validas.indexOf(f) < 0) f = 'cor';    /* o mesmo recuo do fxfam.js */
    return f;
  };
}

function contarEmojiSets() {
  const txt = ler('js/fx2.js') || '';
  return (txt.match(/id:\s*'(retrato|cores|natureza|comida|rostos|cinza|bolhas|personalizado)'/g) || []).length;
}

/* ============================================================ MONTAR */
const scripts = ordemDosScripts();
const modulos = scripts.map(s => Object.assign({ arquivo: s }, resumoDoArquivo(s)));
const fams = familias();
const traduz = tradutorDeFamilia();
const fx = efeitos().map(f => Object.assign({}, f, {
  catNoCodigo: f.familia,
  familia: traduz(f.id, f.familia)
}));

const porFamilia = {};
fams.forEach(f => { porFamilia[f.id] = 0; });
fx.forEach(f => { porFamilia[f.familia] = (porFamilia[f.familia] || 0) + 1; });

const inventario = {
  projeto: 'rgb_lab',
  gerado: new Date().toISOString(),
  descricao: 'Laboratório audiovisual experimental em HTML/CSS/JS puro (WebGL2 + Web Audio), ' +
    'sem dependências e sem servidor. Três mesas: vídeo, áudio, tipografia.',
  autoria: 'Elaborado e criado por Bruno Cebriano Ramirez',
  laboratorios: ['01 VÍDEO', '02 ÁUDIO', '03 TIPOGRAFIA'],
  canais: { azul: 'vídeo', verde: 'áudio', vermelho: 'tipografia' },
  contagens: {
    modulosJs: modulos.length,
    linhasJs: modulos.reduce((a, m) => a + m.linhas, 0),
    efeitos: fx.length,
    familias: fams.length,
    conjuntosDeEmoji: contarEmojiSets(),
    formasDeMascara: listaSimples('js/comp.js', 'VE.MASK_SHAPES').length,
    modosDeMistura: listaSimples('js/comp.js', 'VE.BLENDS').length ||
      listaSimples('js/compgl.js', 'VE.BLENDS').length
  },
  formasDeMascara: listaSimples('js/comp.js', 'VE.MASK_SHAPES'),
  modosDeMascara: listaSimples('js/comp.js', 'VE.MASK_MODOS'),
  familias: fams,
  efeitosPorFamilia: porFamilia,
  efeitos: fx,
  modulos: modulos,
  comandos: {
    abrir: 'node server.js            (porta 5173)',
    arquivoUnico: 'node build-arquivo-unico.js',
    dossie: 'node dossie.js'
  },
  armadilhasCriticas: [
    'js/fxfam.js tem de ser o ÚLTIMO dos fx*.js: ele varre VE.FX para reetiquetar.',
    'O índice em clip.blend É a posição em VE.BLENDS — mexer na ordem quebra projeto salvo.',
    'pow() com base zero devolve NaN nesta GPU (Intel UHD/ANGLE) e apaga o quadro inteiro.',
    'mod(x, n) devolve n quando x é múltiplo exato: usar celulaAtlas() do PRELUDE.',
    'Campo que aparece no inspetor não é campo que funciona — escrever pela interface e ler o modelo.',
    'input type=color precisa gravar no input E no change.',
    'O arquivo único (rgb_lab-arquivo-unico.html) NUNCA se edita à mão.'
  ]
};

/* ------------------------------------------------------------ DOSSIE.md */
function tabela(cab, linhas) {
  return ['| ' + cab.join(' | ') + ' |',
  '|' + cab.map(() => '---').join('|') + '|']
    .concat(linhas.map(l => '| ' + l.join(' | ') + ' |')).join('\n');
}

const partes = [];
partes.push('# rgb_lab — DOSSIÊ DO PROJETO');
partes.push('');
partes.push('> Arquivo único de entrada. Gerado por `node dossie.js` em ' +
  new Date().toLocaleString('pt-BR') + '.');
partes.push('> Contém as **diretrizes**, o **histórico de decisões**, o **manual de uso**, o');
partes.push('> **motor de cor** e um **inventário lido do código** neste momento.');
partes.push('>');
partes.push('> Quem chega ao projeto — pessoa ou assistente — só precisa deste arquivo.');
partes.push('');
partes.push('---');
partes.push('');
partes.push('## COMO LER ESTE DOSSIÊ');
partes.push('');
partes.push('| parte | o que tem | quando serve |');
partes.push('|---|---|---|');
partes.push('| **A · Inventário** | o que existe hoje no código, contado na hora | para saber o tamanho e achar um módulo |');
partes.push('| **B · Diretrizes e decisões** (PROJETO.md) | o que já foi decidido e não se reabre, as armadilhas, o que foi medido | **leia antes de mexer em qualquer coisa** |');
partes.push('| **C · Manual de uso** (LEIA-ME.md) | como se usa o produto | para entender a intenção de cada tela |');
partes.push('| **D · Motor de cor** (COLOR-ENGINE.md) | perfil de entrada, look, LUT | só ao mexer em cor |');
partes.push('');
partes.push('---');
partes.push('');
partes.push('# A · INVENTÁRIO');
partes.push('');
partes.push('**' + inventario.descricao + '**');
partes.push('');
partes.push('Autoria: ' + inventario.autoria + '.');
partes.push('');
partes.push('```');
partes.push('módulos js .......... ' + inventario.contagens.modulosJs);
partes.push('linhas de js ........ ' + inventario.contagens.linhasJs.toLocaleString('pt-BR'));
partes.push('efeitos ............. ' + inventario.contagens.efeitos);
partes.push('famílias de efeito .. ' + inventario.contagens.familias);
partes.push('formas de máscara ... ' + inventario.contagens.formasDeMascara);
partes.push('conjuntos de emoji .. ' + inventario.contagens.conjuntosDeEmoji);
partes.push('```');
partes.push('');
partes.push('### Comandos');
partes.push('');
partes.push('```bash');
Object.keys(inventario.comandos).forEach(k => partes.push(inventario.comandos[k]));
partes.push('```');
partes.push('');
partes.push('### Famílias de efeito');
partes.push('');
partes.push(tabela(['família', 'nome', 'quantos', 'o que é'],
  fams.map(f => [f.label, f.nome, String(porFamilia[f.id] || 0), f.nota])));
partes.push('');
partes.push('### Formas de máscara');
partes.push('');
partes.push(inventario.formasDeMascara.map((s, i) => '`' + i + '` ' + s).join(' · '));
partes.push('');
partes.push('Combinadas por: ' + inventario.modosDeMascara.join(' · ') + '.');
partes.push('');
partes.push('### Módulos, na ordem em que carregam');
partes.push('');
partes.push('A ordem é arquitetura, não acaso — veja as armadilhas abaixo.');
partes.push('');
partes.push(tabela(['#', 'arquivo', 'linhas', 'o que faz'],
  modulos.map((m, i) => [String(i + 1).padStart(2, '0'), '`' + m.arquivo + '`',
  String(m.linhas), (m.resumo || '—').replace(/\|/g, '/')])));
partes.push('');
partes.push('### Armadilhas que já custaram caro');
partes.push('');
inventario.armadilhasCriticas.forEach(a => partes.push('- ' + a));
partes.push('');
partes.push('---');
partes.push('');

[['B · DIRETRIZES E DECISÕES', 'PROJETO.md'],
['C · MANUAL DE USO', 'LEIA-ME.md'],
['D · MOTOR DE COR', 'COLOR-ENGINE.md']].forEach(([titulo, arq]) => {
  const txt = ler(arq);
  partes.push('# ' + titulo);
  partes.push('');
  if (!txt) { partes.push('_(' + arq + ' não encontrado)_'); partes.push(''); return; }
  partes.push('> Fonte: `' + arq + '`');
  partes.push('');
  /* rebaixa os títulos um nível para não competir com os do dossiê */
  partes.push(txt.replace(/^(#{1,5}) /gm, '#$1 '));
  partes.push('');
  partes.push('---');
  partes.push('');
});

fs.writeFileSync(path.join(ROOT, 'DOSSIE.md'), partes.join('\n'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'DOSSIE.json'), JSON.stringify(inventario, null, 2), 'utf8');

const kb = n => Math.round(n / 1024) + ' KB';
console.log('');
console.log('  DOSSIE.md    ' + kb(fs.statSync(path.join(ROOT, 'DOSSIE.md')).size) +
  '  — diretrizes + manual + motor de cor + inventário');
console.log('  DOSSIE.json  ' + kb(fs.statSync(path.join(ROOT, 'DOSSIE.json')).size) +
  '  — só o inventário, em dados');
console.log('');
console.log('  ' + inventario.contagens.efeitos + ' efeitos · ' +
  inventario.contagens.familias + ' famílias · ' +
  inventario.contagens.modulosJs + ' módulos · ' +
  inventario.contagens.linhasJs.toLocaleString('pt-BR') + ' linhas de js');
console.log('');
