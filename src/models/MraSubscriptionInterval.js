const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraSubscriptionInterval', {
				subscription_interval_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "A unique identifier for each subscription interval. It is a serial type, automatically incrementing with each new entry. This serves as the primary key of the table, ensuring unique identification of each subscription interval.",
						primaryKey: true
				},
				subscription_interval_name: {
						type: DataTypes.STRING(50),
						allowNull: false,
						comment: "The name of the subscription interval, such as \"yearly\", \"monthly\", etc. This column is vital for specifying the duration or frequency of the subscription, allowing for organized management of subscription plans based on their temporal characteristics."
				}
		}, {
				sequelize,
				tableName: 'mra_subscription_interval',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_subscription_interval_pkey",
								unique: true,
								fields: [
										{ name: "subscription_interval_id" },
								]
						},
				]
		});
};
