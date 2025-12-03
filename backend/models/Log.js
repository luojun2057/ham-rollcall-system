const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NetSession = require('./NetSession');
const User = require('./User');

const Log = sequelize.define('Log', {
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
  operator_user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    },
    allowNull: false
  },
  participant_callsign: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rst_rcvd: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rst_sent: {
    type: DataTypes.STRING,
    allowNull: false
  },
  radio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  antenna: {
    type: DataTypes.STRING,
    allowNull: true
  },
  power: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qth_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qth_province: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qth_city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qth_district: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'logs',
  timestamps: true
});

module.exports = Log;
