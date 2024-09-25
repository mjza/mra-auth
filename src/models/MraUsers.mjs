import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraUsers extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				user_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						primaryKey: true
				},
				username: {
						type: DataTypes.STRING(30),
						allowNull: false,
						comment: "Username of the user, must be unique. It must be between 5 and 30 characters and can only contain alphanumeric characters and underscores.",
						unique: "mra_users_username_key"
				},
				display_name: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Contains the name that user wants to display for other people publicly"
				},
				public_profile_picture_url: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Contains URL of the public picture that user wants to show for people publicly"
				},
				email: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Email address of the user, must not be unique. One email can have several account."
				},
				password_hash: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Hashed password for the user."
				},
				password_changed_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "If the customer makes a user, this fields is null and user must change it after first login."
				},
				activation_code: {
						type: DataTypes.STRING(64),
						allowNull: true,
						comment: "Code used for account activation. It will be set to null after a successful activation."
				},
				reset_token: {
						type: DataTypes.STRING(64),
						allowNull: true,
						comment: "A code that user can reset his or her password."
				},
				reset_token_created_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "This must set after setting the reset token. It can be used for expirying the reset token."
				},
				confirmation_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "It gets value when user presses the activation link, it must be set to null if user change the email."
				},
				deleted_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "If has a value, then it means user requested for deletion of data."
				},
				suspended_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "If set then means user has been suspended."
				},
				suspension_reason: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "It contains reasons for suspension."
				},
				suspender: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "The user who suspended the current user.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "If a customer creates a user for its employees, then it has value. It does not have a reference key as we define customers table later."
				},
				is_internal: {
						type: DataTypes.BOOLEAN,
						allowNull: false,
						defaultValue: false,
						comment: "If true, it means it is an internal employee."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "The user who has created this user (in case a user is controlled by a customer, then it is admin of that customer). This field is the record owner.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when this record was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_users, indicating the user who last updated this record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update made to this record."
				}
		}, {
				sequelize,
				tableName: 'mra_users',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_users_pkey",
								unique: true,
								fields: [
										{ name: "user_id" },
								]
						},
						{
								name: "mra_users_username_key",
								unique: true,
								fields: [
										{ name: "username" },
								]
						},
				]
		});
		}
}
