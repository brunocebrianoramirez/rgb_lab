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
    const tipo = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    /* PEDIDO PARCIAL (Range). Sem ele, o navegador considera um vídeo
       servido daqui NÃO POSICIONÁVEL: `seekable` fica vazio e escrever
       em `currentTime` não faz nada — a exportação frame a frame de um
       vídeo carregado por URL repetia o mesmo quadro. Medido em
       11/09/2026. Um arquivo aberto do disco (blob) nunca teve o
       problema; este servidor tinha.                                 */
    const range = req.headers.range && /^bytes=(d*)-(d*)$/.exec(req.headers.range);
    if (range && data.length) {
      let ini = range[1] === '' ? Math.max(0, data.length - parseInt(range[2], 10)) : parseInt(range[1], 10);
      let fim = (range[1] !== '' && range[2] !== '') ? Math.min(parseInt(range[2], 10), data.length - 1) : data.length - 1;
      if (!(ini >= 0 && ini <= fim)) { res.writeHead(416, { 'Content-Range': 'bytes */' + data.length }); res.end(); return; }
      res.writeHead(206, {
        'Content-Type': tipo, 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes',
        'Content-Range': 'bytes ' + ini + '-' + fim + '/' + data.length, 'Content-Length': fim - ini + 1
      });
      res.end(data.subarray(ini, fim + 1));
      return;
    }
    res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes', 'Content-Length': data.length });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('\n  rgb_lab rodando em  http://localhost:' + PORT + '\n');
  console.log('  (deixe esta janela aberta enquanto usa o site — Ctrl+C encerra)\n');
});
