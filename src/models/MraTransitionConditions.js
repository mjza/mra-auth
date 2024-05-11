const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
		return sequelize.define('MraTransitionConditions', {
				transition_condition_id: {
						autoIncrement: true,
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "Primary key for the transition condition record.",
						primaryKey: true
				},
				status_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_statuses, indicating the status to which this condition applies.",
						references: {
								model: 'mra_statuses',
								key: 'status_id'
						}
				},
				condition_type_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_condition_types, specifying the type of condition being applied.",
						references: {
								model: 'mra_condition_types',
								key: 'condition_type_id'
						}
				},
				condition_field_id: {
						type: DataTypes.INTEGER,
						allowNull: false,
						comment: "References mra_condition_fields, indicating the field to which the condition applies.",
						references: {
								model: 'mra_condition_fields',
								key: 'condition_field_id'
						}
				},
				value: {
						type: DataTypes.STRING(255),
						allowNull: false,
						comment: "Stores the value against which the condition will be evaluated. For example, if the fieldname is \"commentcount\" and the condition type is \"greaterthan\", the value could be \"10\", checking if a ticket has more than 10 comments."
				},
				order: {
						type: DataTypes.INTEGER,
						allowNull: true,
						defaultValue: 0,
						comment: "Indicates the position of the condition in the expression."
				},
				stick_with_or_operator: {
						type: DataTypes.BOOLEAN,
						allowNull: true,
						defaultValue: false,
						comment: "Indicates whether the condition must be added with an OR operator to the expression."
				},
				creator: {
						type: DataTypes.INTEGER,
						allowNull: false,
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				created_at: {
						type: DataTypes.DATE,
						allowNull: false,
						defaultValue: Sequelize.Sequelize.fn('now')
				},
				updator: {
						type: DataTypes.INTEGER,
						allowNull: true,
						references: {
								model: 'mra_users',
								key: 'user_id'
						}
				},
				updated_at: {
						type: DataTypes.DATE,
						allowNull: true
				}
		}, {
				sequelize,
				tableName: 'mra_transition_conditions',
				schema: 'public',
				hasTrigger: true,
				timestamps: false,
				underscored: true,
				freezeTableName: true,
				indexes: [
						{
								name: "mra_transition_conditions_pkey",
								unique: true,
								fields: [
										{ name: "transition_condition_id" },
								]
						},
				]
		});
};
