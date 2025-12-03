const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const NetSession = sequelize.define('NetSession', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  external_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  net_callsign: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tx_freq: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rx_freq: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  band: {
    type: DataTypes.STRING,
    allowNull: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    },
    allowNull: false
  }
}, {
  tableName: 'net_sessions',
  timestamps: true
});

module.exports = NetSession;
