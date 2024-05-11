const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraDiscountInterval', {
				discount_interval_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "A unique identifier for each discount interval. This column is a serial type, which automatically increments with each new record. It serves as the primary key for the table, ensuring each discount interval is uniquely identifiable.",
						primaryKey: true
				},
				discount_interval_name: {
						type: DataTypes.STRING(50),
						allowNull: false,
						comment: "Descriptive name of the discount interval, such as \"yearly\", \"monthly\", etc. This column is essential for defining the duration or frequency of the discount, thereby allowing for a structured approach in discount management based on time-related criteria."
				}
		}, {
				sequelize,
				tableName: 'mra_discount_interval',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_discount_interval_pkey",
								unique: true,
								fields: [
										{ name: "discount_interval_id" },
								]
						},
				]
		});
};
