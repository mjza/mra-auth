const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraContactInformation', {
				contact_information_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the contact information record. Auto-incremented.",
						primaryKey: true
				},
				user_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_users. Indicates the user associated with this contact information. Set to CASCADE ON DELETE.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_customers. Indicates the customer associated with this contact information. Set to CASCADE ON DELETE.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						}
				},
				contact_type_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_contact_types. Specifies the type of contact information.",
						references: {
								model: 'mra_contact_types',
								key: 'contact_type_id'
						}
				},
				contact_value: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "General single contact information, e.g., a phone number or email."
				},
				additional_info: {
						type: DataTypes.JSONB,
						allowNull: true,
						comment: "PostgreSQL JSONB type for storing structured additional details. For example, for addresses, { \"street\": \"123 main st\", \"city\": \"anytown\", \"postcode\": \"12345\", \"country\": \"usa\" }, for phone number, { \"countrycode\": \"+1\", \"areacode\": \"123\", \"number\": \"4567890\", \"extension\": \"200\" }"
				},
				is_primary: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: false,
						comment: "Indicates whether this is the primary contact information for the associated user or customer."
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
				tableName: 'mra_contact_information',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_contact_information_pkey",
								unique: true,
								fields: [
										{ name: "contact_information_id" },
								]
						},
				]
		});
};
