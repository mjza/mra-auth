const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraCustomers', {
				customer_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the customer record.",
						primaryKey: true
				},
				customer_name: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "Name of the customer."
				},
				customer_type_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Immutable property, refers to the type of the customer, linked to mra_customer_types.",
						references: {
								model: 'mra_customer_types',
								key: 'customer_type_id'
						}
				},
				parent_customer_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Sometimes one customer has several sub-sections, for example, divisions of a police department. References parent entity.",
						references: {
								model: 'mra_customers',
								key: 'customer_id'
						}
				},
				country_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Used to detect the responsibility boundary of the customer, linked to mrag_countries.",
						references: {
								model: 'mrag_countries',
								key: 'country_id'
						}
				},
				city_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Used to detect the responsibility boundary of the customer, linked to mrag_cities.",
						references: {
								model: 'mrag_cities',
								key: 'city_id'
						}
				},
				boundary: {
						type: DataTypes.GEOMETRY('GEOMETRY', 4326),
						allowNull: true,
						comment: "Spatial data type (e.g., polygon), assumes PostGIS extension for geospatial data. Represents the geographical area of responsibility for some customers. If null the whole city is the responsibility boundary"
				},
				is_private: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: true,
						comment: "Indicates whether the customer is private or public. For public entities like city halls should be set to false."
				},
				inactive_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.literal('((now() AT TIME ZONE UTC'),
						comment: "The last day that a subscription is active. Set to one year from creation by default."
				},
				deletion_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "If set, indicates that the customer has requested data deletion. Only private customers can delete all their data including tickets."
				},
				suspension_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "If set, indicates that the customer has been suspended."
				},
				suspension_reason: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Contains reasons for the customer's suspension."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_users, indicating the user who created this record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.literal("(now() AT TIME ZONE 'UTC')"),
						comment: "Timestamp of when the customer record was created."
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References mra_users, indicating the user who last updated this record.",
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true,
						comment: "Timestamp of the last update made to the customer's record."
				}
		}, {
				sequelize,
				tableName: 'mra_customers',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_customers_pkey",
								unique: true,
								fields: [
										{ name: "customer_id" },
								]
						},
				]
		});
};
