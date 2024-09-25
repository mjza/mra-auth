import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraGenderTypes extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				gender_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each gender type.",
						primaryKey: true
				},
				gender_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Name of the gender type, such as \"Male\", \"Female\", \"Non-Binary\", etc. Each name is unique and represents a specific gender identity.",
						unique: "mra_gender_types_gender_name_key"
				},
				sort_order: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Numeric value used to determine the display order of the gender types. Useful for sorting or prioritizing gender types in user interfaces."
				}
		}, {
				sequelize,
				tableName: 'mra_gender_types',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_gender_types_gender_name_key",
								unique: true,
								fields: [
										{ name: "gender_name" },
								]
						},
						{
								name: "mra_gender_types_pkey",
								unique: true,
								fields: [
										{ name: "gender_id" },
								]
						},
				]
		});
		}
}
