const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraActions', {
				action_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "The primary key for the actions table. Uniquely identifies an action.",
						primaryKey: true
				},
				action_code: {
						type: DataTypes.CHAR(3),
						allowNull: false,
						comment: "A unique two-character code representing an action (e.g., \"CR\" for Create, \"RD\" for Read). Must be unique across all actions.",
						unique: "mra_actions_action_code_key"
				},
				action_description: {
						type: DataTypes.TEXT,
						allowNull: false,
						comment: "A text description of what the action entails. Provides more context than the code alone."
				},
				customer_access_allowed: {
						type: DataTypes.BOOLEAN,
						allowNull: false,
						defaultValue: false,
						comment: "A boolean flag indicating whether customers are allowed access to this table. Defaults to FALSE."
				}
		}, {
				sequelize,
				tableName: 'mra_actions',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_actions_action_code_key",
								unique: true,
								fields: [
										{ name: "action_code" },
								]
						},
						{
								name: "mra_actions_pkey",
								unique: true,
								fields: [
										{ name: "action_id" },
								]
						},
				]
		});
};
