const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MragWofPlaceTypes', {
				id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each place type.",
						primaryKey: true
				},
				name: {
						type: DataTypes.STRING(50),
						allowNull: true,
						comment: "Name of the place type, such as \"Country\", \"City\", \"Landmark\", etc. It defines the category of geographical entity."
				},
				description: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "A detailed description of the place type, providing insights into the characteristics and significance of each geographical category."
				}
		}, {
				sequelize,
				tableName: 'mrag_wof_place_types',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mrag_wof_place_types_pkey",
								unique: true,
								fields: [
										{ name: "id" },
								]
						},
				]
		});
};
