/* Gera lab2.html — RGB_LAB 2.0
   ---------------------------------------------------------------------------
   Uso:  node build-lab2.js

   O lab2.html é o index.html INTEIRO, sem uma linha movida de lugar. A única
   diferença são três marcas:

     · `data-ui="2"` no <html>   — liga o css/lab2.css inteiro
     · <link css/lab2.css>       — o desenho novo, por cima de tudo
     · <script js/lab2.js>       — só o que o CSS não dá conta (miniatura)

   A primeira tentativa fez o contrário: montou uma casca nova e MOVEU os
   painéis para dentro dela. O resultado é que a coluna da esquerda — fonte,
   catálogo, filtros, estilos, presets — ficou num bloco escondido, o índice
   dos três laboratórios nunca aparecia, e não dava para achar nada. Estava
   certo o diagnóstico do Bruno: repaginar não é reorganizar.

   Então aqui não há casca, não há legado, não há mudança de casa. Cada botão
   continua exatamente onde ele já sabe procurar. O que muda é o desenho, e
   desenho é CSS.                                                           */

const fs = require('fs');
const path = require('path');
const root = __dirname;

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

/* 1. a marca no <html> — é ela que liga a folha nova inteira */
const tagHtml = html.match(/<html[^>]*>/)[0];
if (tagHtml.indexOf('data-ui') < 0) {
  html = html.replace(tagHtml, tagHtml.replace('>', ' data-ui="2">'));
}

/* 2. o título, única coisa que anuncia a versão */
html = html.replace(/<title>[^<]*<\/title>/,
  '<title>rgb_lab 2.0 — Laboratório Audiovisual Experimental</title>');

/* 3. a folha nova, DEPOIS de todas as outras: ela existe para vencer */
const cssTags = [...html.matchAll(/<link rel="stylesheet" href="css\/[^"]+">/g)];
if (!cssTags.length) { console.error('build-lab2: não achei as folhas de estilo'); process.exit(1); }
const ultimaCss = cssTags[cssTags.length - 1][0];
html = html.replace(ultimaCss, ultimaCss + '\n<link rel="stylesheet" href="css/lab2.css">');

/* 4. o script, depois de todos os outros */
const jsTags = [...html.matchAll(/<script src="js\/[^"]+"><\/script>/g)];
const ultimoJs = jsTags[jsTags.length - 1][0];
html = html.replace(ultimoJs, ultimoJs + '\n<script src="js/lab2.js"></script>');

fs.writeFileSync(path.join(root, 'lab2.html'), html);

const ids = (html.match(/id="/g) || []).length;
console.log('gerado: lab2.html  (' + (html.length / 1024).toFixed(0) + ' KB)');
console.log('  estrutura idêntica ao index.html · ' + ids + ' ids · nada movido de lugar');
