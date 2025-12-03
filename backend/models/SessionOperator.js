const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NetSession = require('./NetSession');
const User = require('./User');

const SessionOperator = sequelize.define('SessionOperator', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.INTEGER,
    references: {
      model: NetSession,
      key: 'id'
    },
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    },
    allowNull: false
  },
  callsign: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '操作员呼号'
  }
}, {
  tableName: 'session_operators',
  timestamps: true
});

module.exports = SessionOperator;
