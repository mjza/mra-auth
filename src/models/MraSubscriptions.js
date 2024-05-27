const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraSubscriptions', {
				subscription_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each subscription.",
						primaryKey: true
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_customers. Identifies the customer associated with the subscription.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						}
				},
				subscription_model_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_subscription_models. Specifies the subscription model applied.",
						references: {
								model: 'mra_subscription_models',
								key: 'model_id'
						}
				},
				start_date: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Start date of the subscription."
				},
				end_date: {
						type: DataTypes.DATE,
						allowNull: false,
						comment: "End date of the subscription. A future date indicates an active subscription; null implies intention to renew."
				},
				is_active: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: true,
						comment: "Indicates whether the subscription is currently active."
				},
				renewal_date: {
						type: DataTypes.DATE,
						allowNull: true,
						defaultValue: Sequelize.Sequelize.literal('(now() + 1 year'),
						comment: "Date for the next renewal. Null implies no auto-renewal."
				},
				discount_type_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Can override the default discount type specified in the subscription model.",
						references: {
								model: 'mra_discount_types',
								key: 'discount_type_id'
						}
				},
				discount_value: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						defaultValue: 0,
						comment: "Can override the default discount value in the subscription model. Represents the discount amount, interpreted based on the discount type."
				},
				discount_interval_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Can override the default discount interval in the subscription model. Specifies the interval of the discount.",
						references: {
								model: 'mra_discount_interval',
								key: 'discount_interval_id'
						}
				},
				description: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Additional details or description of the subscription."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "User who created the subscription record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp when the subscription was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "User who last updated the subscription record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update to the subscription."
				}
		}, {
				sequelize,
				tableName: 'mra_subscriptions',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_subscriptions_pkey",
								unique: true,
								fields: [
										{ name: "subscription_id" },
								]
						},
				]
		});
};
