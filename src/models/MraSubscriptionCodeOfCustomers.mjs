import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraSubscriptionCodeOfCustomers extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				subscription_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the subscription record.",
						primaryKey: true
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Refers to the customer, linked to mra_customers. Indicates that the customer can remove the subscription and is the owner of the record.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						}
				},
				subscription_code: {
						type: DataTypes.STRING(1024),
						allowNull: false,
						comment: "The auto-generated unique code for the subscription.",
						unique: "mra_subscription_code_of_customers_subscription_code_key"
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users, indicating the user who created this record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when the subscription record was created."
				},
				valid_from: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "The start date from which the subscription is valid. Cannot be set to past dates."
				},
				valid_to: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "The end date until which the subscription is valid. Intentionally set to current timestamp to prevent missing the value."
				}
		}, {
				sequelize,
				tableName: 'mra_subscription_code_of_customers',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_subscription_code_of_customers_pkey",
								unique: true,
								fields: [
										{ name: "subscription_id" },
								]
						},
						{
								name: "mra_subscription_code_of_customers_subscription_code_key",
								unique: true,
								fields: [
										{ name: "subscription_code" },
								]
						},
				]
		});
		}
}
