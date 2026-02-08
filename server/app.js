require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { registerRoutes: registerAuth } = require('./auth');
const { registerRoutes: registerData } = require('./data');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// 상위 폴더의 HTML/정적 파일 제공 (Render 등 동일 출처)
app.use(express.static(path.join(__dirname, '..')));

registerAuth(app);
registerData(app);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: '산책 성장기 API' });
});

module.exports = app;
