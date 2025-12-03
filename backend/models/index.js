const User = require('./User');
const NetSession = require('./NetSession');
const Control = require('./Control');
const Log = require('./Log');
const QthEntry = require('./QthEntry');
const SessionOperator = require('./SessionOperator');

// 设置关联关系
NetSession.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
NetSession.hasMany(Control, { foreignKey: 'session_id', as: 'controls' });
NetSession.hasMany(Log, { foreignKey: 'session_id', as: 'logs' });
NetSession.hasMany(SessionOperator, { foreignKey: 'session_id', as: 'operators' });
Control.belongsTo(NetSession, { foreignKey: 'session_id', as: 'session' });
Control.belongsTo(User, { foreignKey: 'operator_user_id', as: 'operator' });
Log.belongsTo(NetSession, { foreignKey: 'session_id', as: 'session' });
Log.belongsTo(User, { foreignKey: 'operator_user_id', as: 'operator' });
SessionOperator.belongsTo(NetSession, { foreignKey: 'session_id', as: 'session' });
SessionOperator.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  NetSession,
  Control,
  Log,
  QthEntry,
  SessionOperator
};
