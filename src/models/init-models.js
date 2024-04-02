var DataTypes = require("sequelize").DataTypes;
var _CasbinRule = require("./CasbinRule");
var _MraActions = require("./MraActions");
var _MraAuditLogsAuthentication = require("./MraAuditLogsAuthentication");
var _MraCustomerTypes = require("./MraCustomerTypes");
var _MraCustomers = require("./MraCustomers");
var _MraGenderTypes = require("./MraGenderTypes");
var _MraRoles = require("./MraRoles");
var _MraTables = require("./MraTables");
var _MraTokenBlacklist = require("./MraTokenBlacklist");
var _MraUserCustomers = require("./MraUserCustomers");
var _MraUserDetails = require("./MraUserDetails");
var _MraUsers = require("./MraUsers");
var _MragCities = require("./MragCities");
var _MragCountries = require("./MragCountries");

function initModels(sequelize) {
		var CasbinRule = _CasbinRule(sequelize, DataTypes);
		var MraActions = _MraActions(sequelize, DataTypes);
		var MraAuditLogsAuthentication = _MraAuditLogsAuthentication(sequelize, DataTypes);
		var MraCustomerTypes = _MraCustomerTypes(sequelize, DataTypes);
		var MraCustomers = _MraCustomers(sequelize, DataTypes);
		var MraGenderTypes = _MraGenderTypes(sequelize, DataTypes);
		var MraRoles = _MraRoles(sequelize, DataTypes);
		var MraTables = _MraTables(sequelize, DataTypes);
		var MraTokenBlacklist = _MraTokenBlacklist(sequelize, DataTypes);
		var MraUserCustomers = _MraUserCustomers(sequelize, DataTypes);
		var MraUserDetails = _MraUserDetails(sequelize, DataTypes);
		var MraUsers = _MraUsers(sequelize, DataTypes);
		var MragCities = _MragCities(sequelize, DataTypes);
		var MragCountries = _MragCountries(sequelize, DataTypes);

		MraCustomers.belongsTo(MraCustomerTypes, { as: "customer_type", foreignKey: "customer_type_id"});
		MraCustomerTypes.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "customer_type_id"});
		MraCustomers.belongsTo(MraCustomers, { as: "parent_customer", foreignKey: "parent_customer_id"});
		MraCustomers.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "parent_customer_id"});
		MraUserCustomers.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraUserCustomers, { as: "mra_user_customers", foreignKey: "customer_id"});
		MraUserDetails.belongsTo(MraGenderTypes, { as: "gender", foreignKey: "gender_id"});
		MraGenderTypes.hasMany(MraUserDetails, { as: "mra_user_details", foreignKey: "gender_id"});
		MraCustomers.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "creator"});
		MraCustomers.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraCustomers, { as: "updator_mra_customers", foreignKey: "updator"});
		MraUserCustomers.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraUserCustomers, { as: "mra_user_customers", foreignKey: "creator"});
		MraUserCustomers.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraUserCustomers, { as: "updator_mra_user_customers", foreignKey: "updator"});
		MraUserCustomers.belongsTo(MraUsers, { as: "user", foreignKey: "user_id"});
		MraUsers.hasMany(MraUserCustomers, { as: "user_mra_user_customers", foreignKey: "user_id"});
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
		MraCustomers.belongsTo(MragCities, { as: "city", foreignKey: "city_id"});
		MragCities.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "city_id"});
		MraCustomers.belongsTo(MragCountries, { as: "country", foreignKey: "country_id"});
		MragCountries.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "country_id"});

		return {
				CasbinRule,
				MraActions,
				MraAuditLogsAuthentication,
				MraCustomerTypes,
				MraCustomers,
				MraGenderTypes,
				MraRoles,
				MraTables,
				MraTokenBlacklist,
				MraUserCustomers,
				MraUserDetails,
				MraUsers,
				MragCities,
				MragCountries,
		};
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
