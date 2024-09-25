import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraTicketComments extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				comment_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the comment record. Auto-incremented.",
						primaryKey: true
				},
				ticket_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_tickets. Indicates the ticket to which the comment is related.",
						references: {
								model: 'mra_tickets',
								key: 'ticket_id'
						}
				},
				comment_text: {
						type: DataTypes.TEXT,
						allowNull: false,
						comment: "The text content of the comment."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users. Indicates the person (user) who made the comment.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when the comment was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_users. The person who registered the dischargement. Nullable.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update made to the comment. Nullable, as comments may not always be updated."
				}
		}, {
				sequelize,
				tableName: 'mra_ticket_comments',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_ticket_comments_pkey",
								unique: true,
								fields: [
										{ name: "comment_id" },
								]
						},
				]
		});
		}
}
