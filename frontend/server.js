const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 3000;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = path.normalize(urlPath).replace(/^\.\.(\/|\\|$)/, '');
  let filePath = path.join(root, safePath === '/' ? 'index.html' : safePath);

  fs.stat(filePath, (error, stat) => {
    if (!error && stat.isDirectory()) filePath = path.join(filePath, 'index.html');

    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Không tìm thấy file');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
});

server.listen(port, () => {
  console.log(`Frontend đang chạy tại http://localhost:${port}`);
});
