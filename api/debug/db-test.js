const { Pool } = require('pg');

module.exports = async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    return res.status(500).json({ error: 'DATABASE_URL not set' });
  }

  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    
    return res.json({
      success: true,
      message: 'DB 연결 성공',
      current_time: result.rows[0].current_time,
      pg_version: result.rows[0].pg_version.substring(0, 50) + '...',
    });
  } catch (err) {
    console.error('DB connection test error:', err);
    return res.status(500).json({
      success: false,
      error: 'DB 연결 실패',
      code: err.code,
      message: err.message,
      detail: err.detail,
    });
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
};
