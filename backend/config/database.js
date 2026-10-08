require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const databasePath = path.resolve(
  process.env.DATABASE_PATH || path.join(__dirname, '..', 'database', 'ecommerce.sqlite'),
);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

let database;

function getDatabase() {
  if (!database) {
    database = new DatabaseSync(databasePath);
    database.exec('PRAGMA foreign_keys = ON;');
  }

  return database;
}

function initializeDatabase() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  getDatabase().exec(fs.readFileSync(schemaPath, 'utf8'));
}

module.exports = {
  databasePath,
  getDatabase,
  initializeDatabase,
};