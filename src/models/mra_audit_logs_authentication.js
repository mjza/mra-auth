const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mra_audit_logs_authentication', {
    logId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'log_id'
    },
    methodRoute: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Combination of REST method and route address for grouping",
      field: 'method_route'
    },
    req: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "A JSON string of the request",
      field: 'req'
    },
    ipAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ip_address'
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      comment: "For logging errors",
      field: 'comments'
    },
    userId: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Must be extracted from JWT token",
      field: 'user_id'
    },
    eventTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'event_time'
    }
  }, {
    sequelize,
    tableName: 'mra_audit_logs_authentication',
    schema: 'public',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "mra_audit_logs_authentication_pkey",
        unique: true,
        fields: [
          { name: "log_id" },
        ]
      },
    ]
  });
};
