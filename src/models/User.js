'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.User, { as: 'Creator', foreignKey: 'creator' });
            this.belongsTo(models.User, { as: 'Suspender', foreignKey: 'suspender' });
            this.belongsTo(models.User, { as: 'Updator', foreignKey: 'updator' });
        }
    };
    User.init({
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true,
            validate: {
                is: /^[a-zA-Z0-9_]+$/, // Ensures username contains only alphanumeric characters and underscores
                len: [5, 30] // Ensures username is between 5 and 30 characters
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                isEmail: true, // Validates the email format
            }
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'password_hash'
        },
        passwordChangedAt: {
            type: DataTypes.DATE,
            field: 'password_changed_at'
        },
        activationCode: {
            type: DataTypes.STRING(64),
            field: 'activation_code'
        },
        resetToken: {
            type: DataTypes.STRING(64),
            field: 'reset_token'
        },
        resetTokenCreatedAt: {
            type: DataTypes.DATE,
            field: 'reset_token_created_at'
        },
        confirmationAt: {
            type: DataTypes.DATE,
            field: 'confirmation_at'
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        },
        suspendedAt: {
            type: DataTypes.DATE,
            field: 'suspended_at'
        },
        suspensionReason: {
            type: DataTypes.TEXT,
            field: 'suspension_reason'
        },
        suspender: {
            type: DataTypes.INTEGER,
            field: 'suspender'
        },
        customerId: {
            type: DataTypes.INTEGER,
            field: 'customer_id'
        },
        isInternal: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_internal'
        },
        creator: {
            type: DataTypes.INTEGER,
            field: 'creator'
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updator: {
            type: DataTypes.INTEGER,
            field: 'updator'
        },
        updated_at: {
            type: DataTypes.DATE
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'mra_users',
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'
    });
    return User;
};
