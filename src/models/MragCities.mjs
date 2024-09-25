import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MragCities extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				city_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						primaryKey: true
				},
				city_name: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "We check in a trigger to see if the city_name is null or empty then set it as invalid record."
				},
				iso_country: {
						type: DataTypes.STRING(2),
						allowNull: true,
						comment: "ISO 3166-1 alpha-2 country codes."
				},
				region: {
						type: DataTypes.STRING(255),
						allowNull: true
				},
				area_codes: {
						type: DataTypes.STRING(100),
						allowNull: true
				},
				is_valid: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: true,
						comment: "If data are not valid we can deactivate it from listing using this column."
				},
				is_supported: {
						type: DataTypes.BOOLEAN,
						allowNull: false,
						defaultValue: false,
						comment: "If true means we support this city in our system."
				}
		}, {
				sequelize,
				tableName: 'mrag_cities',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mrag_cities_pkey",
								unique: true,
								fields: [
										{ name: "city_id" },
								]
						},
				]
		});
		}
}
