const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url.startsWith('/api')) {
    proxy.web(req, res, { target: 'http://localhost:3001' });
  } else {
    proxy.web(req, res, { target: 'http://localhost:8081' });
  }
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Proxy server running on port 5000');
});
