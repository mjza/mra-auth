import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraNotifications extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				notification_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the notification record. Auto-incremented.",
						primaryKey: true
				},
				sender: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users. The user who caused the notification to be created, e.g., the user who posted a new comment or updated the ticket status.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				receiver: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users. The user who will receive the notification. Typically, people who are subscribed to a ticket.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				ticket_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_tickets. Nullable: if the notification is related to a ticket, this field must have a value.",
						references: {
								model: 'mra_tickets',
								key: 'ticket_id'
						}
				},
				notification_type_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_notification_types. Specifies the type of notification being sent."
				},
				notification_text: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "Contains the message or a summary of the event described in the notification."
				},
				notification_action_url: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "Contains the URL of the page that should be opened if the user interacts with the notification. For example, it could be a link to a specific ticket or a news item."
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when the notification was created."
				},
				read_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp indicating when the notification was read. Nullable, as some notifications may remain unread."
				}
		}, {
				sequelize,
				tableName: 'mra_notifications',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_notifications_pkey",
								unique: true,
								fields: [
										{ name: "notification_id" },
								]
						},
				]
		});
		}
}
