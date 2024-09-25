import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraAuditLogsAuthentication extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				log_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						primaryKey: true
				},
				method_route: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Combination of REST method and route address for grouping"
				},
				req: {
						type: DataTypes.JSONB,
						allowNull: true,
						comment: "A JSON string of the request"
				},
				ip_address: {
						type: DataTypes.TEXT,
						allowNull: true
				},
				comments: {
						type: DataTypes.TEXT,
						allowNull: false,
						defaultValue: "",
						comment: "For logging errors"
				},
				user_id: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Must be extracted from JWT token"
				},
				event_time: {
						type: DataTypes.DATE,
						allowNull: true,
						defaultValue: Sequelize.Sequelize.fn('now')
				}
		}, {
				sequelize,
				tableName: 'mra_audit_logs_authentication',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_audit_logs_authentication_pkey",
								unique: true,
								fields: [
										{ name: "log_id" },
								]
						},
				]
		});
		}
}
