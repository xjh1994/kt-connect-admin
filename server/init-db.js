require('dotenv').config();

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'kt_connect_admin';

async function initDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server');
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created or already exists`);
    
    await connection.query(`USE \`${dbName}\``);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clusters (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        kubeconfig TEXT NOT NULL,
        apiServer VARCHAR(255),
        apiServerHost VARCHAR(255),
        clusterIp VARCHAR(45),
        namespace VARCHAR(100) DEFAULT 'default',
        includeIps VARCHAR(100),
        autoHosts TINYINT(1) DEFAULT 1,
        createdAt VARCHAR(50) NOT NULL,
        updatedAt VARCHAR(50) NOT NULL
      )
    `);
    console.log('Clusters table created or already exists');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY,
        sessionId VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        params TEXT NOT NULL,
        logs TEXT,
        startTime VARCHAR(50) NOT NULL,
        endTime VARCHAR(50),
        INDEX idx_sessionId (sessionId)
      )
    `);
    console.log('Tasks table created or already exists');
    
    console.log('\nDatabase initialization complete!');
    console.log('\nConfiguration:');
    console.log(`  Host: ${dbConfig.host}`);
    console.log(`  Port: ${dbConfig.port}`);
    console.log(`  Database: ${dbName}`);
    
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
