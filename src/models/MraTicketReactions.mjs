import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraTicketReactions extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				reaction_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the reaction record. Auto-incremented.",
						primaryKey: true
				},
				ticket_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_tickets. Indicates the ticket to which the reaction is related.",
						references: {
								model: 'mra_tickets',
								key: 'ticket_id'
						},
						unique: "mra_ticket_reactions_uc_ticket_id_creator_reaction_type_id_key"
				},
				reaction_type_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_ticket_reaction_types. Specifies the type of reaction given by the user.",
						references: {
								model: 'mra_ticket_reaction_types',
								key: 'reaction_type_id'
						},
						unique: "mra_ticket_reactions_uc_ticket_id_creator_reaction_type_id_key"
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users. Indicates the person (user) who reacted to the ticket.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						},
						unique: "mra_ticket_reactions_uc_ticket_id_creator_reaction_type_id_key"
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when the reaction was created."
				},
				removed_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of when the reaction was removed by the owner. If set, it indicates that the reaction has been retracted."
				}
		}, {
				sequelize,
				tableName: 'mra_ticket_reactions',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_ticket_reactions_pkey",
								unique: true,
								fields: [
										{ name: "reaction_id" },
								]
						},
						{
								name: "mra_ticket_reactions_uc_ticket_id_creator_reaction_type_id_key",
								unique: true,
								fields: [
										{ name: "ticket_id" },
										{ name: "creator" },
										{ name: "reaction_type_id" },
								]
						},
				]
		});
		}
}
