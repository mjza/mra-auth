const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraTicketCategories', {
				ticket_category_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the ticket category record.",
						primaryKey: true
				},
				ticket_category_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Name of the ticket category.",
						unique: "mra_ticket_categories_uc_category"
				},
				parent_category_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_ticket_categories. Nullable; if null, it indicates that this is a head category.",
						references: {
								model: 'mra_ticket_categories',
								key: 'ticket_category_id'
						}
				},
				description: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Description of the ticket category, detailing its purpose and scope."
				},
				customer_type_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_customer_types. Nullable; if not null, applies to all customers of this type. If null, it is suitable for all organizations.",
						references: {
								model: 'mra_customer_types',
								key: 'customer_type_id'
						},
						unique: "mra_ticket_categories_uc_category"
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_customers. Nullable; if null, it is a general category for the customer of the specified type.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						},
						unique: "mra_ticket_categories_uc_category"
				},
				source_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_ticket_categories. Nullable; if set, indicates the original category that this one duplicates or overrides.",
						references: {
								model: 'mra_ticket_categories',
								key: 'ticket_category_id'
						}
				},
				is_active: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: true,
						comment: "Indicates whether the category is active. If false, the category and its descendants are not shown. To deactivate a default category, it must be overridden and then deactivated."
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
				tableName: 'mra_ticket_categories',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_ticket_categories_pkey",
								unique: true,
								fields: [
										{ name: "ticket_category_id" },
								]
						},
						{
								name: "mra_ticket_categories_uc_category",
								unique: true,
								fields: [
										{ name: "ticket_category_name" },
										{ name: "customer_type_id" },
										{ name: "customer_id" },
								]
						},
				]
		});
};
