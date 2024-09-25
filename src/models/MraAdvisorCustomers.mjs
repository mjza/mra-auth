import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraAdvisorCustomers extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				advisor_customer_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the advisor-customer relationship record.",
						primaryKey: true
				},
				advisor_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Refers to the advisor, linked to mra_users. Indicates which advisor is part of the relationship.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Refers to the customer, linked to mra_customers. Indicates that the customer has some advisors in our system.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						}
				},
				valid_from: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "The start date from which the advisor-customer relationship is valid."
				},
				valid_to: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "The end date until which the advisor-customer relationship is valid."
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
						comment: "Timestamp of when the advisor-customer relationship record was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_users, indicating the user who last updated this record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update made to the advisor-customer relationship record."
				}
		}, {
				sequelize,
				tableName: 'mra_advisor_customers',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_advisor_customers_pkey",
								unique: true,
								fields: [
										{ name: "advisor_customer_id" },
								]
						},
				]
		});
		}
}
