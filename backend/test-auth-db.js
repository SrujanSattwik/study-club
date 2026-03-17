const getConnection = require('./db/oracle');

async function testDatabase() {
  console.log('🔍 Testing Oracle Database Connection...\n');
  
  let conn;
  try {
    // Test connection
    conn = await getConnection();
    console.log('✅ Database connection successful\n');

    // Check users table
    const result = await conn.execute(
      `SELECT table_name FROM user_tables WHERE table_name = 'USERS'`
    );

    if (result.rows.length > 0) {
      console.log('✅ USERS table exists\n');

      // Get table structure
      const columns = await conn.execute(
        `SELECT column_name, data_type, data_length, nullable 
         FROM user_tab_columns 
         WHERE table_name = 'USERS' 
         ORDER BY column_id`
      );

      console.log('📋 Table Structure:');
      console.log('─'.repeat(60));
      columns.rows.forEach(col => {
        console.log(`${col.COLUMN_NAME.padEnd(20)} ${col.DATA_TYPE}(${col.DATA_LENGTH}) ${col.NULLABLE === 'N' ? 'NOT NULL' : ''}`);
      });
      console.log('─'.repeat(60));

      // Count existing users
      const count = await conn.execute('SELECT COUNT(*) as cnt FROM users');
      console.log(`\n📊 Current users in database: ${count.rows[0].CNT}`);

    } else {
      console.log('❌ USERS table not found!');
      console.log('\nPlease create the table using:');
      console.log(`
CREATE TABLE users (
  user_id        VARCHAR2(36) PRIMARY KEY,
  full_name      VARCHAR2(100),
  email          VARCHAR2(150) UNIQUE NOT NULL,
  password_hash  VARCHAR2(255) NOT NULL,
  role           VARCHAR2(20) DEFAULT 'student',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at  TIMESTAMP
);
      `);
    }

    console.log('\n✅ Database test complete!');
    console.log('\n🚀 Ready to start auth-server.js');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. Oracle database is running');
    console.log('2. Connection details in backend/db/oracle.js are correct');
    console.log('3. Instant Client is properly configured');
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

testDatabase();
