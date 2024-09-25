import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class CasbinRule extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						primaryKey: true
				},
				ptype: {
						type: DataTypes.STRING,
						allowNull: true
				},
				v0: {
						type: DataTypes.STRING,
						allowNull: true
				},
				v1: {
						type: DataTypes.STRING,
						allowNull: true
				},
				v2: {
						type: DataTypes.STRING,
						allowNull: true
				},
				v3: {
						type: DataTypes.STRING,
						allowNull: true
				},
				v4: {
						type: DataTypes.STRING,
						allowNull: true
				},
				v5: {
						type: DataTypes.STRING,
						allowNull: true
				},
				v6: {
						type: DataTypes.STRING,
						allowNull: true
				}
		}, {
				sequelize,
				tableName: 'casbin_rule',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "PK_e147354d31e2748a3a5da5e3060",
								unique: true,
								fields: [
										{ name: "id" },
								]
						},
				]
		});
		}
}
