import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraDiscountTypes extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				discount_type_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each discount type. Serves as the primary key of the table.",
						primaryKey: true
				},
				discount_type_name: {
						type: DataTypes.STRING(50),
						allowNull: true,
						comment: "Name of the discount type: e.g., percentage or fixed value"
				}
		}, {
				sequelize,
				tableName: 'mra_discount_types',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_discount_types_pkey",
								unique: true,
								fields: [
										{ name: "discount_type_id" },
								]
						},
				]
		});
		}
}
