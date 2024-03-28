const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mra_gender_types', {
    genderId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Unique identifier for each gender type.",
      field: 'gender_id',
      primaryKey: true
    },
    genderName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Name of the gender type, such as \"Male\", \"Female\", \"Non-Binary\", etc. Each name is unique and represents a specific gender identity.",
      field: 'gender_name',
      unique: "mra_gender_types_gender_name_key"
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Numeric value used to determine the display order of the gender types. Useful for sorting or prioritizing gender types in user interfaces.",
      field: 'sort_order'
    }
  }, {
    sequelize,
    tableName: 'mra_gender_types',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "mra_gender_types_gender_name_key",
        unique: true,
        fields: [
          { name: "gender_name" },
        ]
      },
      {
        name: "mra_gender_types_pkey",
        unique: true,
        fields: [
          { name: "gender_id" },
        ]
      },
    ]
  });
};
