const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraUserCustomers', {
				user_customer_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the user-customer relationship record.",
						primaryKey: true
				},
				user_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Refers to the user, linked to mra_users. Indicates which user is part of the relationship.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Refers to the customer, linked to mra_customers. The customer can remove the subscription and is the owner of the record.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						}
				},
				customer_accepted_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp indicating when the customer accepted the relationship. Should be set to the current time if the customer is the creator."
				},
				user_accepted_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp indicating when the user accepted the subscription, required if initiated by the customer."
				},
				valid_from: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "The start date from which the user-customer relationship is valid."
				},
				valid_to: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "The end date until which the user-customer relationship is valid."
				},
				quit_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "If set, indicates that the user has quit the relationship. Only users that joinned with a subscription_code can quit the relationship."
				},
				suspend_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "If the customer suspend a relationship, the related users made by the customer also must be suspended. However, users that joinned by using a subscription_code are not suspended."
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
						comment: "Timestamp of when the user-customer relationship record was created."
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
						comment: "Timestamp of the last update made to the user-customer relationship record."
				}
		}, {
				sequelize,
				tableName: 'mra_user_customers',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_user_customers_pkey",
								unique: true,
								fields: [
										{ name: "user_customer_id" },
								]
						},
				]
		});
};
