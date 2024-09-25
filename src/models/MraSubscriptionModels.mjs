import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraSubscriptionModels extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				model_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each subscription model.",
						primaryKey: true
				},
				model_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Name of the subscription model."
				},
				description: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Detailed description of the subscription model."
				},
				subscription_interval_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Interval of the subscription (e.g., yearly, monthly).",
						references: {
								model: 'mra_subscription_interval',
								key: 'subscription_interval_id'
						}
				},
				price: {
						type: DataTypes.DECIMAL,
						allowNull: false,
						defaultValue: 0,
						comment: "Price of the subscription model."
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
				discount_type_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Type of discount applied to this model, referencing mra_discount_types.",
						references: {
								model: 'mra_discount_types',
								key: 'discount_type_id'
						}
				},
				discount_value: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						defaultValue: 0,
						comment: "Value of the discount, interpreted based on the discount type."
				},
				discount_interval_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Interval of the discount (e.g., yearly, monthly).",
						references: {
								model: 'mra_discount_interval',
								key: 'discount_interval_id'
						}
				},
				valid_from: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Start date from which the subscription model offer is valid."
				},
				valid_to: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.literal('(now() + 3 years'),
						comment: "End date until which the subscription model offer is valid."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "User who created the subscription model.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp when the subscription model was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "User who last updated the subscription model.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update to the subscription model."
				}
		}, {
				sequelize,
				tableName: 'mra_subscription_models',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_subscription_models_pkey",
								unique: true,
								fields: [
										{ name: "model_id" },
								]
						},
				]
		});
		}
}
