const kakaoOAuth = require('./kakao-oauth');

module.exports = async (req, res) => {
  return kakaoOAuth.start(req, res);
};
