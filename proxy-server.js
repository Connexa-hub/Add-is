const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});
const PORT = 5000;
const TARGET_PORT = process.env.EXPO_WEB_PORT || 19006;

const server = http.createServer((req, res) => {
  proxy.web(req, res, {
    target: `http://localhost:${TARGET_PORT}`,
    changeOrigin: true,
    ws: true
  }, (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway');
  });
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, {
    target: `http://localhost:${TARGET_PORT}`,
    ws: true
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Proxy server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Forwarding to Expo on http://localhost:${TARGET_PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Proxy server closed');
    process.exit(0);
  });
});
