const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QthEntry = sequelize.define('QthEntry', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  province: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  district: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'qth_entries',
  timestamps: true
});

module.exports = QthEntry;
