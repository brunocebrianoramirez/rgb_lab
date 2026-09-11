/* Servidor local simples (sem dependências) para abrir o rgb_lab.
   Uso:  node server.js  [porta]
   A porta também pode vir da variável de ambiente PORT (usada quando
   outra coisa já está ocupando a porta padrão e alguém precisa de uma
   porta livre escolhida de fora) — ela tem prioridade sobre o argumento.  */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || parseInt(process.argv[2], 10) || 5173;
const ROOT = __dirname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon'
};

/* As DUAS únicas rotas que não são arquivo.
   O polaroid promete ao Bruno que basta jogar os escaneamentos em
   assets/polaroid/molduras e assets/polaroid/filmes para eles
   aparecerem no laboratório — e servidor de arquivo estático não sabe
   listar pasta. Estas rotas sabem, e só sabem isto: devolvem os nomes
   de imagem daquelas duas pastas, e de mais nenhuma. Sem servidor, o
   laboratório cai nos manifestos .json e continua funcionando.       */
const PASTAS = { molduras: 'assets/polaroid/molduras', filmes: 'assets/polaroid/filmes' };
const EH_IMAGEM = /\.(jpe?g|png|webp)$/i;

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);

  const lista = p.match(/^\/api\/polaroid\/(molduras|filmes)\/?$/);
  if (lista) {
    fs.readdir(path.join(ROOT, PASTAS[lista[1]]), (err, nomes) => {
      res.writeHead(200, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ arquivos: err ? [] : nomes.filter(n => EH_IMAGEM.test(n)).sort() }));
    });
    return;
  }

  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p).replace(/^([/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('403'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 — não encontrei ' + p); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('\n  rgb_lab rodando em  http://localhost:' + PORT + '\n');
  console.log('  (deixe esta janela aberta enquanto usa o site — Ctrl+C encerra)\n');
});
