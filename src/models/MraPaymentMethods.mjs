import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraPaymentMethods extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				method_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each payment method.",
						primaryKey: true
				},
				method_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Name of the payment method."
				},
				description: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Detailed description of the payment method."
				},
				active: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: true,
						comment: "Indicates whether the payment method is currently active or not."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "User who created the payment method record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp when the payment method was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "User who last updated the payment method record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update to the payment method."
				}
		}, {
				sequelize,
				tableName: 'mra_payment_methods',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_payment_methods_pkey",
								unique: true,
								fields: [
										{ name: "method_id" },
								]
						},
				]
		});
		}
}
