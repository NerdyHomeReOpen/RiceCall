const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config.json');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setupDatabase() {
  try {
    // Get database name from env
    const database = process.env.DB_NAME;

    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ...config,
    });

    // Create database if it doesn't exist
    await connection.query(`DROP DATABASE IF EXISTS ${database}`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${database}`);
    await connection.query(`USE ${database}`);

    // Read and execute schema
    const schema = await fs.readFile(
      path.join(__dirname, 'schema.sql'),
      'utf8',
    );
    const statements = schema.split(';').filter((stmt) => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('Database setup completed successfully');
    await connection.end();
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
