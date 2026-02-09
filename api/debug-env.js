module.exports = async (req, res) => {
  // 보안을 위해 프로덕션에서는 비활성화하거나 제한하세요
  const hasDbUrl = !!process.env.DATABASE_URL;
  const dbUrlLength = process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0;
  const dbUrlPrefix = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'not set';
  
  return res.json({
    DATABASE_URL_exists: hasDbUrl,
    DATABASE_URL_length: dbUrlLength,
    DATABASE_URL_prefix: dbUrlPrefix,
    JWT_SECRET_exists: !!process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'not set',
  });
};
