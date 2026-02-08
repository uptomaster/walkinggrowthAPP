const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('산책 성장기 API 서버:', 'http://localhost:' + PORT);
});
