module.exports = async (req, res) => {
  // 환경 변수 확인 옵션 추가 (쿼리 파라미터로)
  if (req.query && req.query.check === 'env') {
    const hasDbUrl = !!process.env.DATABASE_URL;
    const dbUrlLength = process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0;
    const dbUrlPrefix = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'not set';
    
    return res.json({
      ok: true,
      message: '산책 성장기 API',
      env: {
        DATABASE_URL_exists: hasDbUrl,
        DATABASE_URL_length: dbUrlLength,
        DATABASE_URL_prefix: dbUrlPrefix,
        JWT_SECRET_exists: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV || 'not set',
      }
    });
  }
  
  return res.json({ ok: true, message: '산책 성장기 API' });
};
