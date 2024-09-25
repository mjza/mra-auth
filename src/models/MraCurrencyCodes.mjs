import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class MraCurrencyCodes extends Model {
		static init(sequelize, DataTypes) {
		return super.init({
				currency_code_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key. Unique identifier for each currency entry.",
						primaryKey: true
				},
				parent_currency_code_id: {
						type: DataTypes.INTEGER,
						allowNull: true,
						comment: "References another currency that this currency is related to, if applicable. For instance, countries in the EU sharing a common currency.",
						references: {
								model: 'mra_currency_codes',
								key: 'currency_code_id'
						}
				},
				currency_code: {
						type: DataTypes.CHAR(3),
						allowNull: true,
						comment: "ISO 4217 three-letter code representing the currency."
				},
				currency_sign: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "The symbol or sign of the currency in Unicode format, like \"$\" for USD."
				},
				currency_name: {
						type: DataTypes.STRING(255),
						allowNull: true,
						comment: "The full name of the currency, such as \"United States Dollar\"."
				},
				iso_country: {
						type: DataTypes.STRING(2),
						allowNull: true,
						comment: "ISO 3166-1 alpha-2 country codes associated with the currency."
				}
		}, {
				sequelize,
				tableName: 'mra_currency_codes',
				schema: 'public',
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_currency_codes_pkey",
								unique: true,
								fields: [
										{ name: "currency_code_id" },
								]
						},
				]
		});
		}
}
