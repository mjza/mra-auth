const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MragWofGeometryTypes', {
				id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each geometry type.",
						primaryKey: true
				},
				name: {
						type: DataTypes.STRING(50),
						allowNull: true,
						comment: "Name of the geometry type, such as \"Point\", \"LineString\", \"Polygon\", etc. It specifies the type of geometric shape or structure."
				},
				description: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "A detailed description of the geometry type, explaining its characteristics and potential usage in spatial data representation."
				}
		}, {
				sequelize,
				tableName: 'mrag_wof_geometry_types',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mrag_wof_geometry_types_pkey",
								unique: true,
								fields: [
										{ name: "id" },
								]
						},
				]
		});
};
