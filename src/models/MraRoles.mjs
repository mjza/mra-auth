import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraRoles extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				role_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "The primary key for the roles table. Uniquely identifies a role.",
						primaryKey: true
				},
				role_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "The name of the role. This should be unique within the context of a single customer."
				},
				weight: {
						type: DataTypes.INTEGER,
						allowNull: false,
						defaultValue: 0
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						defaultValue: 0,
						comment: "References the customer_id from the Customer table. Indicates the customer to which the role belongs. Allows 0 for internal use or IDs that refer to actual customer records."
				},
				customer_access_allowed: {
						type: DataTypes.BOOLEAN,
						allowNull: false,
						defaultValue: false,
						comment: "A boolean flag indicating whether customers are allowed access to this table. Defaults to FALSE."
				}
		}, {
				sequelize,
				tableName: 'mra_roles',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_roles_pkey",
								unique: true,
								fields: [
										{ name: "role_id" },
								]
						},
				]
		});
		}
}
