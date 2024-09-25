import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraTokenBlacklist extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				token: {
						type: DataTypes.STRING(1023),
						allowNull: false,
						primaryKey: true
				},
				expiry: {
						type: DataTypes.BIGINT,
						allowNull: false,
						comment: "Expiry time of the token is stored to know until when we must keep the record."
				}
		}, {
				sequelize,
				tableName: 'mra_token_blacklist',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_token_blacklist_idx_by_expiry",
								fields: [
										{ name: "expiry" },
								]
						},
						{
								name: "mra_token_blacklist_idx_by_token",
								fields: [
										{ name: "token" },
								]
						},
				]
		});
		}
}
