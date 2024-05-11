const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraNotificationTypes', {
				notification_type_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the notification type record. Auto-incremented.",
						primaryKey: true
				},
				notification_type_name: {
						type: DataTypes.STRING(50),
						allowNull: false,
						comment: "The name of the notification type, e.g., \"new comment\", \"status update\". Unique for each type, indicating the specific nature of the notification.",
						unique: "mra_notification_types_notification_type_name_key"
				}
		}, {
				sequelize,
				tableName: 'mra_notification_types',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_notification_types_notification_type_name_key",
								unique: true,
								fields: [
										{ name: "notification_type_name" },
								]
						},
						{
								name: "mra_notification_types_pkey",
								unique: true,
								fields: [
										{ name: "notification_type_id" },
								]
						},
				]
		});
};
