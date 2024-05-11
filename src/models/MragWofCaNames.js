const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MragWofCaNames', {
				id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Identifies the geographical entity associated with the name. Typically corresponds to the id in the mrag_wof_ca_spr table or other related spatial tables.",
						primaryKey: true
				},
				language: {
						type: DataTypes.STRING(3),
						allowNull: true,
						comment: "The ISO 639-2 code representing the language in which the name is given. Facilitates linguistic diversity in naming conventions."
				},
				locale: {
						type: DataTypes.STRING(2),
						allowNull: true,
						comment: "Locale or region code, reflecting regional variations in the name of the geographical entity. Helps in identifying place names as used in specific local or regional contexts. (region in wof)"
				},
				place_type_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References the type of place or geographical entity, linking to the mrag_wof_place_types table."
				},
				context_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Context identifier for the name, potentially representing specific usage or private contexts within the geographical framework. (privateuse in wof)"
				},
				name: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "The actual name of the geographical entity as used in the specified language and region."
				},
				last_modified: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last modification made to the name data. Indicates the most recent update or change in the naming information."
				}
		}, {
				sequelize,
				tableName: 'mrag_wof_ca_names',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mrag_wof_ca_names_idx_by_id",
								fields: [
										{ name: "id" },
								]
						},
						{
								name: "mrag_wof_ca_names_idx_by_language",
								fields: [
										{ name: "language" },
										{ name: "context_id" },
										{ name: "place_type_id" },
								]
						},
						{
								name: "mrag_wof_ca_names_idx_by_name",
								fields: [
										{ name: "name" },
										{ name: "place_type_id" },
								]
						},
						{
								name: "mrag_wof_ca_names_idx_by_name_context",
								fields: [
										{ name: "name" },
										{ name: "context_id" },
										{ name: "place_type_id" },
								]
						},
						{
								name: "mrag_wof_ca_names_idx_by_placetype",
								fields: [
										{ name: "place_type_id" },
										{ name: "context_id" },
								]
						},
				]
		});
};
