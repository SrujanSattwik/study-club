const oracledb = require('oracledb');

try {
  oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_23' });
  console.log('✅ Oracle Client initialized in Thick mode');
} catch (err) {
  if (!err.message.includes('already been initialized')) {
    console.error('❌ Oracle Client initialization failed:', err.message);
    throw err;
  }
}

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

let pool;

async function initPool() {
  pool = await oracledb.createPool({
    user: process.env.DB_USER || 'studyhub',
    password: process.env.DB_PASSWORD || 'studyhub2026',
    connectString: process.env.DB_CONNECTION_STRING || '127.0.0.1/XE',
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 60
  });
  console.log('✅ Oracle connection pool created');
}

async function getConnection() {
  if (!pool) await initPool();
  return pool.getConnection();
}

module.exports = getConnection;
module.exports.initPool = initPool;
