const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraContactTypes', {
				contact_type_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the contact type record. Auto-incremented.",
						primaryKey: true
				},
				contact_category_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_contact_categories. Used to categorize contact types, for example, filtering all contact types that are emails.",
						references: {
								model: 'mra_contact_categories',
								key: 'contact_category_id'
						}
				},
				type_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "The name of the contact type, e.g., \"business email\", \"home address\". Unique for each type, indicating the specific nature of the contact information.",
						unique: "mra_contact_types_type_name_key"
				}
		}, {
				sequelize,
				tableName: 'mra_contact_types',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_contact_types_pkey",
								unique: true,
								fields: [
										{ name: "contact_type_id" },
								]
						},
						{
								name: "mra_contact_types_type_name_key",
								unique: true,
								fields: [
										{ name: "type_name" },
								]
						},
				]
		});
};
