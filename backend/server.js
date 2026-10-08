require('dotenv').config();

const app = require('./app');
const { initializeDatabase } = require('./config/database');

const port = Number(process.env.PORT) || 5000;

initializeDatabase();

app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});