import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraTermsAndConditions extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				tc_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each terms and conditions record.",
						primaryKey: true
				},
				tc_type_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_tc_types. Identifies the type of terms and conditions document.",
						references: {
								model: 'mra_tc_types',
								key: 'tc_type_id'
						}
				},
				content: {
						type: DataTypes.TEXT,
						allowNull: false,
						comment: "The actual text of the terms and conditions, or a URL\/link to the document."
				},
				valid_from: {
						type: DataTypes.DATE,
						allowNull: false,
						comment: "Start date of the validity period for these terms and conditions."
				},
				valid_to: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "End date of the validity period for these terms and conditions. Null if the document is indefinitely valid."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "User who created the terms and conditions record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp when the terms and conditions record was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "User who last updated the terms and conditions record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update to the terms and conditions record."
				}
		}, {
				sequelize,
				tableName: 'mra_terms_and_conditions',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_terms_and_conditions_pkey",
								unique: true,
								fields: [
										{ name: "tc_id" },
								]
						},
				]
		});
		}
}
