import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MragCountries extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				country_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						primaryKey: true
				},
				country_name: {
						type: DataTypes.STRING(255),
						allowNull: false
				},
				iso_code: {
						type: DataTypes.CHAR(2),
						allowNull: false,
						comment: "ISO 3166-1 alpha-2 country codes"
				},
				iso_long_code: {
						type: DataTypes.CHAR(3),
						allowNull: true,
						comment: "ISO 3166-1 alpha-3 country codes"
				},
				dial_code: {
						type: DataTypes.STRING(23),
						allowNull: true,
						comment: "Including the plus sign, e.g., +1"
				},
				capital: {
						type: DataTypes.STRING(255),
						allowNull: true
				},
				continent: {
						type: DataTypes.STRING(2),
						allowNull: true
				},
				continent_name: {
						type: DataTypes.STRING(255),
						allowNull: true
				},
				languages: {
						type: DataTypes.STRING(100),
						allowNull: true
				},
				currency_code: {
						type: DataTypes.CHAR(3),
						allowNull: true,
						comment: "ISO 4217 currency codes"
				},
				boundary: {
						type: DataTypes.GEOMETRY('GEOMETRY', 4326),
						allowNull: true,
						comment: "Spatial data type, e.g., polygon, postgis extension assumed for geospatial data"
				},
				geo_hash: {
						type: DataTypes.CHAR(32),
						allowNull: true,
						comment: "Hash of the geometry data"
				},
				geo_latitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Latitude of the geometric center"
				},
				geo_longitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Longitude of the geometric center"
				},
				geo_location: {
						type: DataTypes.GEOMETRY('POINT', 4326),
						allowNull: true,
						comment: "Cenral point of the country for calculating some distances"
				},
				min_latitude: {
						type: DataTypes.DECIMAL,
						allowNull: true
				},
				min_longitude: {
						type: DataTypes.DECIMAL,
						allowNull: true
				},
				max_latitude: {
						type: DataTypes.DECIMAL,
						allowNull: true
				},
				max_longitude: {
						type: DataTypes.DECIMAL,
						allowNull: true
				},
				bounding_box: {
						type: DataTypes.GEOMETRY('POLYGON', 4326),
						allowNull: true,
						comment: "Representing the area rectangular covered by the country, [min_longitude; min_latitude; max_longitude; max_latitude]"
				},
				lbl_latitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Latitude for label placement"
				},
				lbl_longitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Longitude for label placement"
				},
				cessation: {
						type: DataTypes.DATEONLY,
						allowNull: true,
						comment: "If null means the country still exists, otherwise, it was in the past and does not exist anymore."
				},
				deprecated: {
						type: DataTypes.DATEONLY,
						allowNull: true,
						comment: "The date that a country has been deprecated. If a country has been deprecated we must use new_country."
				},
				new_country: {
						type: DataTypes.CHAR(2),
						allowNull: true,
						comment: "It is used to denote the country in which a particular geographical entity, like a city or a locality, is located after deprication."
				},
				last_modified: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "If data are not valid we can deactivate it from listing using this column."
				},
				is_valid: {
						type: DataTypes.BOOLEAN,
						allowNull: false,
						defaultValue: true
				},
				is_supported: {
						type: DataTypes.BOOLEAN,
						allowNull: false,
						defaultValue: false,
						comment: "If true means we support this country in our system."
				}
		}, {
				sequelize,
				tableName: 'mrag_countries',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mrag_countries_pkey",
								unique: true,
								fields: [
										{ name: "country_id" },
								]
						},
				]
		});
		}
}
