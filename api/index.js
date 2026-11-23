// Vercel serverless entry: wraps the Express app as one function.
// In-memory data mode on Vercel (read-only filesystem); file persistence locally.
process.env.DATA_MODE = process.env.DATA_MODE || 'memory';

const { createApp } = require('../server/src/app');

module.exports = createApp();
