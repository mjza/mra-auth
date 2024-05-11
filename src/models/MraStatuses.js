const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraStatuses', {
				status_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the status record.",
						primaryKey: true
				},
				status_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Name of the status."
				},
				customer_type_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Refers to the type of the customer, linked to mra_customer_types. Indicates the type of customer this status applies to.",
						references: {
								model: 'mra_customer_types',
								key: 'customer_type_id'
						}
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_customers. Null indicates a default status that can be used by all customers of the specified type.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						}
				},
				previous_status_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_statuses, pointing to the previous status. Null if it is the first status. The status_id must have the same customer_id and customer_type_id as the current status.",
						references: {
								model: 'mra_statuses',
								key: 'status_id'
						}
				},
				next_status_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_statuses, pointing to the next status. Null if it is the last status. The status_id must have the same customer_id and customer_type_id as the current status.",
						references: {
								model: 'mra_statuses',
								key: 'status_id'
						}
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now')
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true
				}
		}, {
				sequelize,
				tableName: 'mra_statuses',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_statuses_pkey",
								unique: true,
								fields: [
										{ name: "status_id" },
								]
						},
				]
		});
};
