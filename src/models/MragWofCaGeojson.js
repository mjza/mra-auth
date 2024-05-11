const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MragWofCaGeojson', {
				id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Identifies the geographical entity associated with the GeoJSON. Corresponds to the id in the mrag_wof_ca_spr table or other related spatial tables.",
						primaryKey: true
				},
				boundary: {
						type: DataTypes.GEOMETRY('GEOMETRY', 4326),
						allowNull: true,
						comment: "The geometric boundary of the geographical entity in PostGIS geometry format. Represents the spatial extent of the entity in the WGS 84 coordinate system."
				},
				geo_type_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References the geometry type of the boundary, such as point, line, polygon, etc., linking to the mrag_wof_geometry_types table."
				},
				is_alt: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						comment: "Indicates whether the GeoJSON is an alternative representation of the geographical entity. Alternative geometries may represent different perspectives or interpretations of the geographic area."
				},
				last_modified: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last modification made to the GeoJSON data. Reflects the most recent update to the geographic representation."
				}
		}, {
				sequelize,
				tableName: 'mrag_wof_ca_geojson',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mrag_wof_ca_geojson_idx_by_alt",
								fields: [
										{ name: "id" },
										{ name: "is_alt" },
								]
						},
						{
								name: "mrag_wof_ca_geojson_idx_by_boundary",
								fields: [
										{ name: "boundary" },
								]
						},
				]
		});
};
