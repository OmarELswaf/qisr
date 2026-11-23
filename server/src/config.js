const config = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // 'file' persists to server/data/db.json; 'memory' reseeds on every boot.
  dataMode: process.env.DATA_MODE || 'file',
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;
