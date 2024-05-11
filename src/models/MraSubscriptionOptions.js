const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraSubscriptionOptions', {
				option_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each subscription option.",
						primaryKey: true
				},
				option_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Name of the subscription option."
				},
				option_default_value: {
						type: DataTypes.TEXT,
						allowNull: false,
						defaultValue: "true",
						comment: "Default value of the option."
				},
				option_value_type: {
						type: DataTypes.STRING(50),
						allowNull: false,
						defaultValue: "boolean",
						comment: "Type of the option value; can be numeric, boolean, text, etc."
				},
				option_value_unit: {
						type: DataTypes.STRING(50),
						allowNull: true,
						comment: "Unit for the option value, applicable for types like KB, MB, GB, TB."
				},
				option_description: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Detailed description of the subscription option."
				},
				price: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						defaultValue: 0,
						comment: "Price associated with the option."
				},
				currency_code_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Currency code for the price, referencing mra_currency_codes.",
						references: {
								model: 'mra_currency_codes',
								key: 'currency_code_id'
						}
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "User who created the subscription option.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp when the subscription option was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "User who last updated the subscription option.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update to the subscription option."
				}
		}, {
				sequelize,
				tableName: 'mra_subscription_options',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_subscription_options_pkey",
								unique: true,
								fields: [
										{ name: "option_id" },
								]
						},
				]
		});
};
