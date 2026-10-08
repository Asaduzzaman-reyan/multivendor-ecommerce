const express = require('express');

const { getDatabase } = require('../config/database');

const router = express.Router();

router.get('/', (_req, res) => {
  const result = getDatabase()
    .prepare('SELECT COUNT(*) AS table_count FROM sqlite_master WHERE type = ? AND name NOT LIKE ?')
    .get('table', 'sqlite_%');

  res.json({
    status: 'ok',
    service: 'multivendor-ecommerce-api',
    database: 'connected',
    tables: result.table_count,
  });
});

module.exports = router;
