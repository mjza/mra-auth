const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mra_users', {
    userId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_id'
    },
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "Username of the user, must be unique. It must be between 5 and 30 characters and can only contain alphanumeric characters and underscores.",
      unique: "mra_users_username_key",
      field: 'username'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Email address of the user, must not be unique. One email can have several account.",
      field: 'email'
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Hashed password for the user.",
      field: 'password_hash'
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "If the customer makes a user, this fields is null and user must change it after first login.",
      field: 'password_changed_at'
    },
    activationCode: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: "Code used for account activation. It will be set to null after a successful activation.",
      field: 'activation_code'
    },
    resetToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: "A code that user can reset his or her password.",
      field: 'reset_token'
    },
    resetTokenCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "This must set after setting the reset token. It can be used for expirying the reset token.",
      field: 'reset_token_created_at'
    },
    confirmationAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "It gets value when user presses the activation link, it must be set to null if user change the email.",
      field: 'confirmation_at'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "If has a value, then it means user requested for deletion of data.",
      field: 'deleted_at'
    },
    suspendedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "If set then means user has been suspended.",
      field: 'suspended_at'
    },
    suspensionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "It contains reasons for suspension.",
      field: 'suspension_reason'
    },
    suspender: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "The user who suspended the current user.",
      field: 'suspender',
      references: {
        model: 'mra_users',
        key: 'user_id'
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "If a customer creates a user for its employees, then it has value. It does not have a reference key as we define customers table later.",
      field: 'customer_id'
    },
    isInternal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "If true, it means it is an internal employee.",
      field: 'is_internal'
    },
    creator: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "The user who has created this user (in case a user is controlled by a customer, then it is admin of that customer). This field is the record owner.",
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
      comment: "",
      field: 'created_at'
    },
    updator: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "",
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
      comment: "",
      field: 'updated_at'
    }
  }, {
    sequelize,
    tableName: 'mra_users',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "mra_users_pkey",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "mra_users_username_key",
        unique: true,
        fields: [
          { name: "username" },
        ]
      },
    ]
  });
};
