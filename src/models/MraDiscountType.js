const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraDiscountType', {
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
				tableName: 'mra_discount_type',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_discount_type_pkey",
								unique: true,
								fields: [
										{ name: "discount_type_id" },
								]
						},
				]
		});
};
