import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraConditionTypes extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				condition_type_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the condition type record.",
						primaryKey: true
				},
				type_name: {
						type: DataTypes.STRING(10),
						allowNull: true,
						comment: "Name of the condition type, e.g., \"greaterthan\", \"equalto\", \"contains\", \"datebefore\", \"dateafter\", etc."
				},
				description: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "Description of the condition type, providing details about its use and application."
				}
		}, {
				sequelize,
				tableName: 'mra_condition_types',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_condition_types_pkey",
								unique: true,
								fields: [
										{ name: "condition_type_id" },
								]
						},
				]
		});
		}
}
