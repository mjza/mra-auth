import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraTcAcceptance extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				acceptance_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each acceptance record.",
						primaryKey: true
				},
				tc_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_terms_and_conditions. Identifies the specific terms and conditions document that has been accepted.",
						references: {
								model: 'mra_terms_and_conditions',
								key: 'tc_id'
						}
				},
				accepted_by: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users. Indicates the user who has accepted the terms and conditions.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				accepted_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when the terms and conditions were accepted."
				}
		}, {
				sequelize,
				tableName: 'mra_tc_acceptance',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_tc_acceptance_pkey",
								unique: true,
								fields: [
										{ name: "acceptance_id" },
								]
						},
				]
		});
		}
}
