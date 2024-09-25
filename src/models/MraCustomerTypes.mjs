import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraCustomerTypes extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				customer_type_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						primaryKey: true
				},
				customer_type_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Name of the customer type. e.g., hospital, city hall, police, etc."
				},
				description: {
						type: DataTypes.TEXT,
						allowNull: true
				}
		}, {
				sequelize,
				tableName: 'mra_customer_types',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_customer_types_pkey",
								unique: true,
								fields: [
										{ name: "customer_type_id" },
								]
						},
				]
		});
		}
}
