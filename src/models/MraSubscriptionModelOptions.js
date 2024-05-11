const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraSubscriptionModelOptions', {
				option_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_subscription_options. Identifies the specific subscription option being applied.",
						primaryKey: true,
						references: {
								model: 'mra_subscription_options',
								key: 'option_id'
						}
				},
				model_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_subscription_models. Identifies the subscription model to which the option is being applied.",
						primaryKey: true,
						references: {
								model: 'mra_subscription_models',
								key: 'model_id'
						}
				},
				option_value: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "This value overwrites the option_default_value from mra_subscription_options, providing a customized option value for the specific model."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "User who created this model-option association.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp when this model-option association was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "User who last updated this model-option association.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update to this model-option association."
				}
		}, {
				sequelize,
				tableName: 'mra_subscription_model_options',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_subscription_model_options_pkey",
								unique: true,
								fields: [
										{ name: "option_id" },
										{ name: "model_id" },
								]
						},
				]
		});
};
