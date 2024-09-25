import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraTicketAssignments extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				assignment_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key. Auto-incremented. By having this ID, we can assign\/discharge a ticket to\/from an agent at different points in time.",
						primaryKey: true
				},
				ticket_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_tickets. Indicates the ticket to which the agent is assigned.",
						references: {
								model: 'mra_tickets',
								key: 'ticket_id'
						}
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_customers. Ticket might transfer between customers. Then we can see the workflow from point X to Y in a specific cutomer.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						}
				},
				agent_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users. The agent who is assigned to the ticket.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				discharged_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of when the ticket was discharged from the agent. Nullable."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users. The person who registered the assignment.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when the ticket was assigned to the agent."
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
						comment: "Timestamp of when the ticket was discharged from the agent."
				}
		}, {
				sequelize,
				tableName: 'mra_ticket_assignments',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_ticket_assignments_pkey",
								unique: true,
								fields: [
										{ name: "assignment_id" },
								]
						},
				]
		});
		}
}
