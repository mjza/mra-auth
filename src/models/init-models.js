var DataTypes = require("sequelize").DataTypes;
var _mra_audit_logs_authentication = require("./mra_audit_logs_authentication");
var _mra_gender_types = require("./mra_gender_types");
var _mra_token_blacklist = require("./mra_token_blacklist");
var _mra_user_details = require("./mra_user_details");
var _mra_users = require("./mra_users");

function initModels(sequelize) {
  var mra_audit_logs_authentication = _mra_audit_logs_authentication(sequelize, DataTypes);
  var mra_gender_types = _mra_gender_types(sequelize, DataTypes);
  var mra_token_blacklist = _mra_token_blacklist(sequelize, DataTypes);
  var mra_user_details = _mra_user_details(sequelize, DataTypes);
  var mra_users = _mra_users(sequelize, DataTypes);

  mra_user_details.belongsTo(mra_gender_types, { as: "gender", foreignKey: "gender_id"});
  mra_gender_types.hasMany(mra_user_details, { as: "mra_user_details", foreignKey: "gender_id"});
  mra_user_details.belongsTo(mra_users, { as: "creator_mra_user", foreignKey: "creator"});
  mra_users.hasMany(mra_user_details, { as: "mra_user_details", foreignKey: "creator"});
  mra_user_details.belongsTo(mra_users, { as: "user", foreignKey: "user_id"});
  mra_users.hasOne(mra_user_details, { as: "user_mra_user_detail", foreignKey: "user_id"});
  mra_user_details.belongsTo(mra_users, { as: "updator_mra_user", foreignKey: "updator"});
  mra_users.hasMany(mra_user_details, { as: "updator_mra_user_details", foreignKey: "updator"});
  mra_users.belongsTo(mra_users, { as: "creator_mra_user", foreignKey: "creator"});
  mra_users.hasMany(mra_users, { as: "mra_users", foreignKey: "creator"});
  mra_users.belongsTo(mra_users, { as: "suspender_mra_user", foreignKey: "suspender"});
  mra_users.hasMany(mra_users, { as: "suspender_mra_users", foreignKey: "suspender"});
  mra_users.belongsTo(mra_users, { as: "updator_mra_user", foreignKey: "updator"});
  mra_users.hasMany(mra_users, { as: "updator_mra_users", foreignKey: "updator"});

  return {
    mra_audit_logs_authentication,
    mra_gender_types,
    mra_token_blacklist,
    mra_user_details,
    mra_users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
