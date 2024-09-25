import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraContactCategories extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				contact_category_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the contact category record. Auto-incremented.",
						primaryKey: true
				},
				category_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "The name of the contact category, e.g., \"email\", \"address\", \"telephone\". Unique for each category, indicating the specific type of contact information.",
						unique: "mra_contact_categories_category_name_key"
				}
		}, {
				sequelize,
				tableName: 'mra_contact_categories',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_contact_categories_category_name_key",
								unique: true,
								fields: [
										{ name: "category_name" },
								]
						},
						{
								name: "mra_contact_categories_pkey",
								unique: true,
								fields: [
										{ name: "contact_category_id" },
								]
						},
				]
		});
		}
}
