const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraConditionFields', {
				condition_field_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the condition field record.",
						primaryKey: true
				},
				condition_field_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "The name of the condition field, e.g., \"commentcount\", \"ticketage\", \"lastupdatedate\", etc."
				},
				type_cast: {
						type: DataTypes.STRING(255),
						allowNull: false,
						defaultValue: "string",
						comment: "Used for type casting the field value, represents the type of the field, e.g., \"string\", \"int\", \"char\", \"date\", \"timestamp\", \"long\", \"decimal\", \"float\", \"double\", \"uint\", etc."
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
				tableName: 'mra_condition_fields',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_condition_fields_pkey",
								unique: true,
								fields: [
										{ name: "condition_field_id" },
								]
						},
				]
		});
};
