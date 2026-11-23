const { createApp } = require('./app');
const config = require('./config');

createApp().listen(config.port, () => {
  console.log(`[qisr] API listening on http://localhost:${config.port} (data mode: ${config.dataMode})`);
});
