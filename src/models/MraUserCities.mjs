import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraUserCities extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				user_city_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each user-city association.",
						primaryKey: true
				},
				user_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users. Identifies the user involved in the city association.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				city_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mrag_cities. Identifies the city to which the user is associated.",
						references: {
								model: 'mrag_cities',
								key: 'city_id'
						}
				},
				valid_from: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Start date and time of the user's association with the city."
				},
				valid_to: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "End date and time of the user's association with the city. If null, the association is considered ongoing or indefinite."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users, indicating the user who created this record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when the customer record was created."
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
						comment: "Timestamp of the last update made to the customer's record."
				}
		}, {
				sequelize,
				tableName: 'mra_user_cities',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_user_cities_pkey",
								unique: true,
								fields: [
										{ name: "user_city_id" },
								]
						},
				]
		});
		}
}
