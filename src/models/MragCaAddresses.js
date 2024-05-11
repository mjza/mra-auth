const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MragCaAddresses', {
				id: {
						type: DataTypes.STRING(32),
						allowNull: false,
						comment: "A unique identifier for each address record, typically a 32-character string.",
						primaryKey: true
				},
				group_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "An integer identifier that groups related addresses or serves as a reference to an external dataset."
				},
				geo_latitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Geographic latitude coordinate of the address."
				},
				geo_longitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Geographic longitude coordinate of the address."
				},
				geo_location: {
						type: DataTypes.GEOMETRY('POINT', 4326),
						allowNull: true,
						comment: "Geospatial data point (PostGIS POINT type) representing the exact geographic location of the address, auto-calculated based on latitude and longitude."
				},
				street_name: {
						type: DataTypes.STRING(50),
						allowNull: true,
						comment: "The name of the street without type or directional indicators.(str_name in statcan.gc.ca)"
				},
				street_type: {
						type: DataTypes.STRING(20),
						allowNull: true,
						comment: "The type of street, e.g., Avenue, Street, Boulevard.(str_type in statcan.gc.ca)"
				},
				street_quad: {
						type: DataTypes.STRING(10),
						allowNull: true,
						comment: "Quadrant or directional indicator of the street, if applicable.(str_dir in statcan.gc.ca)"
				},
				street_full_name: {
						type: DataTypes.STRING(100),
						allowNull: true,
						comment: "The full name of the street including name, type, and directional indicators.(street in statcan.gc.ca)"
				},
				street_no: {
						type: DataTypes.STRING(30),
						allowNull: true,
						comment: "The street number associated with the address.(street_no in statcan.gc.ca)"
				},
				house_number: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Numeric part of the house number, extracted from street_no."
				},
				house_alpha: {
						type: DataTypes.STRING(30),
						allowNull: true,
						comment: "Alphabetic part of the house number, if present, extracted from street_no."
				},
				unit: {
						type: DataTypes.STRING(50),
						allowNull: true,
						comment: "Unit number or identifier for multi-unit buildings."
				},
				city: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "Name of the city where the address is located.(csdname in statcan.gc.ca)"
				},
				region: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "The region or state code where the address is situated."
				},
				postal_code: {
						type: DataTypes.STRING(20),
						allowNull: true,
						comment: "The postal code associated with the address."
				},
				full_address: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "The complete address in a standardized format.(full_addr in statcan.gc.ca)"
				},
				is_valid: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: true,
						comment: "Indicates whether the address is considered valid and accurate."
				}
		}, {
				sequelize,
				tableName: 'mrag_ca_addresses',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mrag_ca_addresses_idx_by_full_address",
								fields: [
										{ name: "full_address" },
								]
						},
						{
								name: "mrag_ca_addresses_idx_by_geo_location",
								fields: [
										{ name: "geo_location" },
								]
						},
						{
								name: "mrag_ca_addresses_idx_by_region",
								fields: [
										{ name: "region" },
								]
						},
						{
								name: "mrag_ca_addresses_idx_by_street_full_name",
								fields: [
										{ name: "street_full_name" },
								]
						},
						{
								name: "mrag_ca_addresses_pkey",
								unique: true,
								fields: [
										{ name: "id" },
								]
						},
				]
		});
};
