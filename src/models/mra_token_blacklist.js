const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mra_token_blacklist', {
    token: {
      type: DataTypes.STRING(1023),
      allowNull: false
    },
    expiry: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "Expiry time of the token is stored to know until when we must keep the record."
    }
  }, {
    sequelize,
    tableName: 'mra_token_blacklist',
    schema: 'public',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "mra_token_blacklist_idx_by_expiry",
        fields: [
          { name: "expiry" },
        ]
      },
      {
        name: "mra_token_blacklist_idx_by_token",
        fields: [
          { name: "token" },
        ]
      },
    ]
  });
};
