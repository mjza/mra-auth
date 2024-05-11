const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraUserDetails', {
				user_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key, linked to mra_users. Ensures user details are removed if the user is deleted (ON DELETE CASCADE).",
						primaryKey: true,
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				first_name: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Encrypted data, contains first name of the user"
				},
				middle_name: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Encrypted data, contains middle name of the user"
				},
				last_name: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Encrypted data, contains last name of the user"
				},
				gender_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "Not encrypted data, contains gender id of the user",
						references: {
								model: 'mra_gender_types',
								key: 'gender_id'
						}
				},
				date_of_birth: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Encrypted data, contains date of birth of the user"
				},
				profile_picture_url: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Encrypted data, contains URL of the profile picture of the user"
				},
				profile_picture_thumbnail_url: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Encrypted data, contains URL of the thumbnail version of the profile picture of the user"
				},
				public_profile_picture_thumbnail_url: {
						type: DataTypes.TEXT,
						allowNull: true,
						comment: "Not encrypted data, contains URL of the public picture that user wants to show for people publicly"
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
						defaultValue: Sequelize.Sequelize.fn('now'),
						comment: "Timestamp of when this record was created."
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
						comment: "Timestamp of the last update made to this record."
				}
		}, {
				sequelize,
				tableName: 'mra_user_details',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_user_details_pkey",
								unique: true,
								fields: [
										{ name: "user_id" },
								]
						},
				]
		});
};
