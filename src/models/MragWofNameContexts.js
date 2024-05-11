const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MragWofNameContexts', {
				id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each name context.",
						primaryKey: true
				},
				name: {
						type: DataTypes.STRING(30),
						allowNull: false,
						comment: "The specific name used in a particular context. Each name is unique and represents a distinct usage or functional scenario.",
						unique: "mrag_wof_name_contexts_name_key"
				},
				description: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "A brief description of the name context, outlining its significance or application within the WOF framework."
				}
		}, {
				sequelize,
				tableName: 'mrag_wof_name_contexts',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mrag_wof_name_contexts_name_key",
								unique: true,
								fields: [
										{ name: "name" },
								]
						},
						{
								name: "mrag_wof_name_contexts_pkey",
								unique: true,
								fields: [
										{ name: "id" },
								]
						},
				]
		});
};
