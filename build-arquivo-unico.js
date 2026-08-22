/* Junta index.html + css + js num único arquivo .html
   Uso:  node build-arquivo-unico.js                                  */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

/* ============================ UMA FONTE DA VERDADE ============================
   A ordem de carga e a lista de arquivos vêm do PRÓPRIO index.html. Antes esta
   lista existia aqui também, e as duas saíam de sincronia sem avisar: o site
   abria certo no servidor e o arquivo único saía quebrado.
   Agora, registrar um arquivo no HTML basta.                                 */
function listFrom(re, label) {
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  if (!out.length) { console.error('build: nenhum ' + label + ' encontrado no index.html'); process.exit(1); }
  return out;
}

const cssFiles = listFrom(/<link rel="stylesheet" href="css\/([^"]+)">/g, 'css');
const jsFiles = listFrom(/<script src="js\/([^"]+)"><\/script>/g, 'script');

/* falha alto e cedo se algum arquivo listado no HTML não existir */
[['css', cssFiles], ['js', jsFiles]].forEach(([dir, list]) => {
  list.forEach(f => {
    if (!fs.existsSync(path.join(root, dir, f))) {
      console.error('build: ' + dir + '/' + f + ' está no index.html mas não existe');
      process.exit(1);
    }
  });
});

const css = cssFiles
  .map(f => '/* ===== ' + f + ' ===== */\n' + fs.readFileSync(path.join(root, 'css', f), 'utf8')).join('\n');
const js = jsFiles
  .map(f => '/* ===== ' + f + ' ===== */\n' + fs.readFileSync(path.join(root, 'js', f), 'utf8')).join('\n');

/* usa função como substituto: assim "$'", "$&" etc. dentro do CSS/JS
   não são interpretados como padrões especiais do replace */
let firstCss = true;
let out = html
  .replace(/<link rel="stylesheet" href="css\/[^"]+">\s*/g, () => {
    if (!firstCss) return '';
    firstCss = false;
    return '<style>\n' + css + '\n</style>';
  })
  .replace(/<script src="js\/[a-z0-9\/-]+\.js"><\/script>\s*/g, '');

out = out.replace('</body>', () => '<script>\n' + js + '\n</script>\n</body>');

fs.writeFileSync(path.join(root, 'rgb_lab-arquivo-unico.html'), out);

/* versão só-conteúdo (sem doctype/head/body), para publicar como Artifact */
const inner = out
  .replace(/^[\s\S]*?<body>/, '')
  .replace(/<\/body>[\s\S]*$/, '');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'),
  '<title>rgb_lab</title>\n<style>\n' + css + '\n</style>\n' + inner);

console.log('  ' + cssFiles.length + ' css + ' + jsFiles.length + ' js embutidos, na ordem do index.html');
console.log('gerado: rgb_lab-arquivo-unico.html  (' + (out.length / 1024).toFixed(0) + ' KB)');
console.log('gerado: dist/artifact.html');
