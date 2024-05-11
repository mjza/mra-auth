const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraPaymentDetails', {
				payment_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each payment record.",
						primaryKey: true
				},
				subscription_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Links the payment to a specific subscription in mra_subscriptions.",
						references: {
								model: 'mra_subscriptions',
								key: 'subscription_id'
						}
				},
				method_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Identifies the payment method used, referencing mra_payment_methods.",
						references: {
								model: 'mra_payment_methods',
								key: 'method_id'
						}
				},
				amount: {
						type: DataTypes.DECIMAL,
						allowNull: false,
						comment: "The amount paid in the transaction."
				},
				currency_code_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Currency code for the payment, such as USD or EUR, referencing mra_currency_codes.",
						references: {
								model: 'mra_currency_codes',
								key: 'currency_code_id'
						}
				},
				transaction_date: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Date and time of the transaction."
				},
				transaction_status: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "Status of the payment transaction, e.g., completed, pending, failed."
				},
				transaction_reference: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Reference number or ID from the payment gateway for the transaction."
				},
				additional_info: {
						type: DataTypes.JSONB,
						allowNull: true,
						comment: "A JSON field to store any additional information related to the payment."
				}
		}, {
				sequelize,
				tableName: 'mra_payment_details',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_payment_details_pkey",
								unique: true,
								fields: [
										{ name: "payment_id" },
								]
						},
				]
		});
};
