const { createServer } = require('@vercel/node');
const app = require('../server/app');

module.exports = createServer(app);
