const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mra_user_details', {
    userId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Primary key, linked to mra_users. Ensures user details are removed if the user is deleted (ON DELETE CASCADE).",
      field: 'user_id',
      primaryKey: true,
      references: {
        model: 'mra_users',
        key: 'user_id'
      }
    },
    firstName: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Encrypted data, contains first name of the user",
      field: 'first_name'
    },
    middleName: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Encrypted data, contains middle name of the user",
      field: 'middle_name'
    },
    lastName: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Encrypted data, contains last name of the user",
      field: 'last_name'
    },
    genderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Not encrypted data, contains gender id of the user",
      field: 'gender_id',
      references: {
        model: 'mra_gender_types',
        key: 'gender_id'
      }
    },
    dateOfBirth: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Encrypted data, contains date of birth of the user",
      field: 'date_of_birth'
    },
    profilePictureUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Encrypted data, contains URL of the profile picture of the user",
      field: 'profile_picture_url'
    },
    profilePictureThumbnailUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Encrypted data, contains URL of the thumbnail version of the profile picture of the user",
      field: 'profile_picture_thumbnail_url'
    },
    displayName: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Not encrypted data, contains the name that user wants to display for other people publicly",
      field: 'display_name'
    },
    publicProfilePictureThumbnailUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Not encrypted data, contains URL of the public picture that user wants to show for people publicly",
      field: 'public_profile_picture_thumbnail_url'
    },
    creator: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "References mra_users, indicating the user who created this record.",
      field: 'creator',
      references: {
        model: 'mra_users',
        key: 'user_id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Timestamp of when this record was created.",
      field: 'created_at'
    },
    updator: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "References mra_users, indicating the user who last updated this record.",
      field: 'updator',
      references: {
        model: 'mra_users',
        key: 'user_id'
      }
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      comment: "Timestamp of the last update made to this record.",
      field: 'updated_at'
    }
  }, {
    sequelize,
    tableName: 'mra_user_details',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
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
