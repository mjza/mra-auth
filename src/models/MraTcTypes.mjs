import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraTcTypes extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				tc_type_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each terms and conditions type.",
						primaryKey: true
				},
				type_name: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Name of the terms and conditions type, such as \"end users\", \"agents\", or specific subscription models."
				},
				description: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Detailed description of the terms and conditions type."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "User who created the terms and conditions type record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp when the terms and conditions type was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "User who last updated the terms and conditions type record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update to the terms and conditions type record."
				}
		}, {
				sequelize,
				tableName: 'mra_tc_types',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_tc_types_pkey",
								unique: true,
								fields: [
										{ name: "tc_type_id" },
								]
						},
				]
		});
		}
}
