const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://10.0.134.79:8082',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onError: function(err, req, res, target) {
        console.log('Proxy error:', err);
      },
      onProxyReq: function(proxyReq, req, res) {
        console.log('Proxying request:', req.method, req.url);
      }
    })
  );
};