const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraPosts', {
				posts_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Unique identifier for each post.",
						primaryKey: true
				},
				city_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mrag_cities. Indicates the city associated with the post.",
						references: {
								model: 'mrag_cities',
								key: 'city_id'
						}
				},
				title: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "Title of the post."
				},
				short_content: {
						type: DataTypes.STRING(1023),
						allowNull: true,
						comment: "Short content or summary of the post."
				},
				long_content: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Detailed content of the post."
				},
				additional_info: {
						type: DataTypes.JSONB,
						allowNull: true,
						comment: "PostgreSQL JSONB type for storing media URLs and additional details about the post."
				},
				geo_latitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Latitude coordinate for the location of the post."
				},
				geo_longitude: {
						type: DataTypes.DECIMAL,
						allowNull: true,
						comment: "Longitude coordinate for the location of the post."
				},
				geo_location: {
						type: DataTypes.GEOMETRY('POINT', 4326),
						allowNull: true,
						comment: "Geospatial data point (PostGIS POINT type) representing the geographical location of the post. To be populated via triggers."
				},
				boundary: {
						type: DataTypes.GEOMETRY('GEOMETRY', 4326),
						allowNull: true,
						comment: "Spatial data type, such as a polygon, representing a specific area relevant to the post. Useful for posts relevant to a particular part of a city."
				},
				customer_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_customers. Indicates the customer associated with the post. Set to CASCADE ON DELETE.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						}
				},
				published_from: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Start date from which the post is active or published."
				},
				published_to: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "End date until which the post is active or published. Null implies ongoing activation."
				},
				deletion_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of when the post was deleted. If set, indicates that the post was removed for rule violations."
				},
				deletion_reason: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Reason for the deletion or suspension of the post."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "User who created the post.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp when the post was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "User who last updated the post.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update to the post."
				}
		}, {
				sequelize,
				tableName: 'mra_posts',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_posts_pkey",
								unique: true,
								fields: [
										{ name: "posts_id" },
								]
						},
				]
		});
};
