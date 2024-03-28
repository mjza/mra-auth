var DataTypes = require("sequelize").DataTypes;
var _MraAuditLogsAuthentication = require("./MraAuditLogsAuthentication");
var _MraGenderTypes = require("./MraGenderTypes");
var _MraTokenBlacklist = require("./MraTokenBlacklist");
var _MraUserDetails = require("./MraUserDetails");
var _MraUsers = require("./MraUsers");

function initModels(sequelize) {
		var MraAuditLogsAuthentication = _MraAuditLogsAuthentication(sequelize, DataTypes);
		var MraGenderTypes = _MraGenderTypes(sequelize, DataTypes);
		var MraTokenBlacklist = _MraTokenBlacklist(sequelize, DataTypes);
		var MraUserDetails = _MraUserDetails(sequelize, DataTypes);
		var MraUsers = _MraUsers(sequelize, DataTypes);

		MraUserDetails.belongsTo(MraGenderTypes, { as: "gender", foreignKey: "gender_id"});
		MraGenderTypes.hasMany(MraUserDetails, { as: "mra_user_details", foreignKey: "gender_id"});
		MraUserDetails.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraUserDetails, { as: "mra_user_details", foreignKey: "creator"});
		MraUserDetails.belongsTo(MraUsers, { as: "user", foreignKey: "user_id"});
		MraUsers.hasOne(MraUserDetails, { as: "user_mra_user_detail", foreignKey: "user_id"});
		MraUserDetails.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraUserDetails, { as: "updator_mra_user_details", foreignKey: "updator"});
		MraUsers.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraUsers, { as: "mra_users", foreignKey: "creator"});
		MraUsers.belongsTo(MraUsers, { as: "suspender_mra_user", foreignKey: "suspender"});
		MraUsers.hasMany(MraUsers, { as: "suspender_mra_users", foreignKey: "suspender"});
		MraUsers.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraUsers, { as: "updator_mra_users", foreignKey: "updator"});

		return {
				MraAuditLogsAuthentication,
				MraGenderTypes,
				MraTokenBlacklist,
				MraUserDetails,
				MraUsers,
		};
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
