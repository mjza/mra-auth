import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraTicketReactionTypes extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				reaction_type_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the reaction type record. Auto-incremented.",
						primaryKey: true
				},
				reaction_type_name: {
						type: DataTypes.STRING(50),
						allowNull: false,
						comment: "Name of the reaction type, e.g., \"like\", \"dislike\", \"happy\", etc. Unique for each reaction type.",
						unique: "mra_ticket_reaction_types_reaction_type_name_key"
				},
				reaction_icon: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "Can be used to store the icon path or unicode symbol representing the reaction. This visual representation is associated with the reaction type name."
				}
		}, {
				sequelize,
				tableName: 'mra_ticket_reaction_types',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_ticket_reaction_types_pkey",
								unique: true,
								fields: [
										{ name: "reaction_type_id" },
								]
						},
						{
								name: "mra_ticket_reaction_types_reaction_type_name_key",
								unique: true,
								fields: [
										{ name: "reaction_type_name" },
								]
						},
				]
		});
		}
}
