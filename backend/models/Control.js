const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NetSession = require('./NetSession');
const User = require('./User');

const Control = sequelize.define('Control', {
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
  callsign: {
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
  operator_user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    },
    allowNull: false
  }
}, {
  tableName: 'controls',
  timestamps: true
});

module.exports = Control;
