import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraTicketHistory extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				history_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key. Auto-incremented. Represents a unique identifier for each history record.",
						primaryKey: true
				},
				ticket_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_tickets. Indicates the ticket to which the history entry is related.",
						references: {
								model: 'mra_tickets',
								key: 'ticket_id'
						}
				},
				status_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_statuses. Indicates the current status of the ticket. This table must be updated as soon as a transition to the next status is accepted.",
						references: {
								model: 'mra_statuses',
								key: 'status_id'
						}
				},
				assignment_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_ticket_assignments. Indicates the assignment associated with the ticket history. Not all statuses require an assigned person. For example, the start status.",
						references: {
								model: 'mra_ticket_assignments',
								key: 'assignment_id'
						}
				},
				caused_by: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users. The person who caused the history entry. Normally, it is the agent with the assignment ID, but not necessarily. The first history of a ticket is made by the ticket reporter. Status 1 is \"reported\/initiated\".",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				recorded_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when the new history entry was recorded. The latest entry indicates the current status of the ticket."
				}
		}, {
				sequelize,
				tableName: 'mra_ticket_history',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_ticket_history_pkey",
								unique: true,
								fields: [
										{ name: "history_id" },
								]
						},
				]
		});
		}
}
