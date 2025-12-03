const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  callsign: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '操作员呼号'
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'operator'),
    defaultValue: 'operator'
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
