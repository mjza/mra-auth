import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MragWofCaSpr extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each geographical entity.",
						primaryKey: true
				},
				parent_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References the parent entity to which this entity is related, establishing a hierarchical relationship."
				},
				name: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "Name of the geographical entity."
				},
				place_type_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References the type of place or geographical entity."
				},
				geo_latitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Geographic latitude coordinate of the entity."
				},
				geo_longitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Geographic longitude coordinate of the entity."
				},
				geo_location: {
						type: DataTypes.GEOMETRY('POINT', 4326),
						allowNull: true,
						comment: "Geospatial data point (PostGIS POINT type) representing the exact geographical location of the entity. Auto-calculated based on latitude and longitude."
				},
				min_latitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Minimum latitude value of the entity’s boundary."
				},
				min_longitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Minimum longitude value of the entity’s boundary."
				},
				max_latitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Maximum latitude value of the entity’s boundary."
				},
				max_longitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Maximum longitude value of the entity’s boundary."
				},
				bounding_box: {
						type: DataTypes.GEOMETRY('POLYGON', 4326),
						allowNull: true,
						comment: "Geospatial polygon (PostGIS POLYGON type) representing the bounding box of the entity, defined by the minimum and maximum latitude and longitude."
				},
				is_current: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: true,
						comment: "Indicates whether the entity is current and active."
				},
				is_deprecated: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: false,
						comment: "Indicates whether the entity is deprecated."
				},
				is_ceased: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: false,
						comment: "Indicates whether the entity has ceased to exist."
				},
				is_superseded: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: false,
						comment: "Indicates whether the entity has been superseded by another."
				},
				is_superseding: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: false,
						comment: "Indicates whether the entity is superseding another."
				},
				superseded_by: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Comma-separated list of entities by which this entity is superseded."
				},
				supersedes: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Comma-separated list of entities that this entity supersedes."
				},
				last_modified: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last modification to the entity."
				},
				is_valid: {
						type: DataTypes.BOOLEAN,
						allowNull: false,
						defaultValue: true,
						comment: "Indicates whether the spatial data of the entity is considered valid."
				}
		}, {
				sequelize,
				tableName: 'mrag_wof_ca_spr',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mrag_wof_ca_spr_idx_by_bbox",
								fields: [
										{ name: "min_latitude" },
										{ name: "min_longitude" },
										{ name: "max_latitude" },
										{ name: "max_longitude" },
										{ name: "place_type_id" },
										{ name: "is_current" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_ceased",
								fields: [
										{ name: "is_ceased" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_centroid",
								fields: [
										{ name: "geo_latitude" },
										{ name: "geo_longitude" },
										{ name: "is_current" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_current",
								fields: [
										{ name: "is_current" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_deprecated",
								fields: [
										{ name: "is_deprecated" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_geo_location",
								fields: [
										{ name: "geo_location" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_name",
								fields: [
										{ name: "name" },
										{ name: "place_type_id" },
										{ name: "is_current" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_obsolete",
								fields: [
										{ name: "is_deprecated" },
										{ name: "is_superseded" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_parent",
								fields: [
										{ name: "parent_id" },
										{ name: "is_current" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_placetype",
								fields: [
										{ name: "place_type_id" },
										{ name: "is_current" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_superseded",
								fields: [
										{ name: "is_superseded" },
								]
						},
						{
								name: "mrag_wof_ca_spr_idx_by_superseding",
								fields: [
										{ name: "is_superseding" },
								]
						},
						{
								name: "mrag_wof_ca_spr_pkey",
								unique: true,
								fields: [
										{ name: "id" },
								]
						},
				]
		});
		}
}
