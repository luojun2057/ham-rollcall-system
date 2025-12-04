const { Sequelize } = require('sequelize');
require('dotenv').config();

// 确保sqlite3包被正确加载
try {
  require('sqlite3');
} catch (error) {
  console.error('Error loading sqlite3:', error.message);
  console.error('Attempting to install sqlite3...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install sqlite3', { stdio: 'inherit' });
    require('sqlite3');
  } catch (installError) {
    console.error('Failed to install sqlite3:', installError.message);
    throw installError;
  }
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_NAME,
  logging: false
});

module.exports = sequelize;
