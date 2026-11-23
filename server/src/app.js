const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '20kb' }));

  app.use(
    '/api',
    cors({
      origin: (origin, cb) => {
        if (!origin || origin === config.clientOrigin) return cb(null, true);
        cb(null, false);
      },
    })
  );

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'rate_limited', message: 'Too many requests, slow down' },
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', demo: config.dataMode === 'memory' });
  });

  app.use('/api', require('./routes/links.routes'));
  app.use('/r', require('./routes/redirect.routes'));

  app.use((req, res) => res.status(404).json({ error: 'not_found', message: 'Unknown route' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[qisr] unhandled error:', err.message);
    res.status(500).json({ error: 'server_error', message: 'Something went wrong' });
  });

  return app;
}

module.exports = { createApp };
