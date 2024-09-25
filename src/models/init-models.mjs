import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _CasbinRule from  "./CasbinRule.mjs";
import _MraActions from  "./MraActions.mjs";
import _MraAdvisorCustomers from  "./MraAdvisorCustomers.mjs";
import _MraAuditLogsAuthentication from  "./MraAuditLogsAuthentication.mjs";
import _MraConditionFields from  "./MraConditionFields.mjs";
import _MraConditionTypes from  "./MraConditionTypes.mjs";
import _MraContactCategories from  "./MraContactCategories.mjs";
import _MraContactInformation from  "./MraContactInformation.mjs";
import _MraContactTypes from  "./MraContactTypes.mjs";
import _MraCurrencyCodes from  "./MraCurrencyCodes.mjs";
import _MraCustomerTypes from  "./MraCustomerTypes.mjs";
import _MraCustomers from  "./MraCustomers.mjs";
import _MraDiscountInterval from  "./MraDiscountInterval.mjs";
import _MraDiscountTypes from  "./MraDiscountTypes.mjs";
import _MraGenderTypes from  "./MraGenderTypes.mjs";
import _MraNotificationTypes from  "./MraNotificationTypes.mjs";
import _MraNotifications from  "./MraNotifications.mjs";
import _MraPaymentDetails from  "./MraPaymentDetails.mjs";
import _MraPaymentMethods from  "./MraPaymentMethods.mjs";
import _MraPosts from  "./MraPosts.mjs";
import _MraRoles from  "./MraRoles.mjs";
import _MraStatuses from  "./MraStatuses.mjs";
import _MraSubscriptionCodeOfCustomers from  "./MraSubscriptionCodeOfCustomers.mjs";
import _MraSubscriptionInterval from  "./MraSubscriptionInterval.mjs";
import _MraSubscriptionModelOptions from  "./MraSubscriptionModelOptions.mjs";
import _MraSubscriptionModels from  "./MraSubscriptionModels.mjs";
import _MraSubscriptionOptions from  "./MraSubscriptionOptions.mjs";
import _MraSubscriptions from  "./MraSubscriptions.mjs";
import _MraTables from  "./MraTables.mjs";
import _MraTcAcceptance from  "./MraTcAcceptance.mjs";
import _MraTcTypes from  "./MraTcTypes.mjs";
import _MraTermsAndConditions from  "./MraTermsAndConditions.mjs";
import _MraTicketAssignments from  "./MraTicketAssignments.mjs";
import _MraTicketCategories from  "./MraTicketCategories.mjs";
import _MraTicketComments from  "./MraTicketComments.mjs";
import _MraTicketHistory from  "./MraTicketHistory.mjs";
import _MraTicketReactionTypes from  "./MraTicketReactionTypes.mjs";
import _MraTicketReactions from  "./MraTicketReactions.mjs";
import _MraTickets from  "./MraTickets.mjs";
import _MraTokenBlacklist from  "./MraTokenBlacklist.mjs";
import _MraTransitionConditions from  "./MraTransitionConditions.mjs";
import _MraUserCities from  "./MraUserCities.mjs";
import _MraUserCustomers from  "./MraUserCustomers.mjs";
import _MraUserDetails from  "./MraUserDetails.mjs";
import _MraUsers from  "./MraUsers.mjs";
import _MragCaAddresses from  "./MragCaAddresses.mjs";
import _MragCities from  "./MragCities.mjs";
import _MragCountries from  "./MragCountries.mjs";
import _MragWofCaGeojson from  "./MragWofCaGeojson.mjs";
import _MragWofCaNames from  "./MragWofCaNames.mjs";
import _MragWofCaSpr from  "./MragWofCaSpr.mjs";
import _MragWofGeometryTypes from  "./MragWofGeometryTypes.mjs";
import _MragWofNameContexts from  "./MragWofNameContexts.mjs";
import _MragWofPlaceTypes from  "./MragWofPlaceTypes.mjs";

export default function initModels(sequelize) {
		const CasbinRule = _CasbinRule.init(sequelize, DataTypes);
		const MraActions = _MraActions.init(sequelize, DataTypes);
		const MraAdvisorCustomers = _MraAdvisorCustomers.init(sequelize, DataTypes);
		const MraAuditLogsAuthentication = _MraAuditLogsAuthentication.init(sequelize, DataTypes);
		const MraConditionFields = _MraConditionFields.init(sequelize, DataTypes);
		const MraConditionTypes = _MraConditionTypes.init(sequelize, DataTypes);
		const MraContactCategories = _MraContactCategories.init(sequelize, DataTypes);
		const MraContactInformation = _MraContactInformation.init(sequelize, DataTypes);
		const MraContactTypes = _MraContactTypes.init(sequelize, DataTypes);
		const MraCurrencyCodes = _MraCurrencyCodes.init(sequelize, DataTypes);
		const MraCustomerTypes = _MraCustomerTypes.init(sequelize, DataTypes);
		const MraCustomers = _MraCustomers.init(sequelize, DataTypes);
		const MraDiscountInterval = _MraDiscountInterval.init(sequelize, DataTypes);
		const MraDiscountTypes = _MraDiscountTypes.init(sequelize, DataTypes);
		const MraGenderTypes = _MraGenderTypes.init(sequelize, DataTypes);
		const MraNotificationTypes = _MraNotificationTypes.init(sequelize, DataTypes);
		const MraNotifications = _MraNotifications.init(sequelize, DataTypes);
		const MraPaymentDetails = _MraPaymentDetails.init(sequelize, DataTypes);
		const MraPaymentMethods = _MraPaymentMethods.init(sequelize, DataTypes);
		const MraPosts = _MraPosts.init(sequelize, DataTypes);
		const MraRoles = _MraRoles.init(sequelize, DataTypes);
		const MraStatuses = _MraStatuses.init(sequelize, DataTypes);
		const MraSubscriptionCodeOfCustomers = _MraSubscriptionCodeOfCustomers.init(sequelize, DataTypes);
		const MraSubscriptionInterval = _MraSubscriptionInterval.init(sequelize, DataTypes);
		const MraSubscriptionModelOptions = _MraSubscriptionModelOptions.init(sequelize, DataTypes);
		const MraSubscriptionModels = _MraSubscriptionModels.init(sequelize, DataTypes);
		const MraSubscriptionOptions = _MraSubscriptionOptions.init(sequelize, DataTypes);
		const MraSubscriptions = _MraSubscriptions.init(sequelize, DataTypes);
		const MraTables = _MraTables.init(sequelize, DataTypes);
		const MraTcAcceptance = _MraTcAcceptance.init(sequelize, DataTypes);
		const MraTcTypes = _MraTcTypes.init(sequelize, DataTypes);
		const MraTermsAndConditions = _MraTermsAndConditions.init(sequelize, DataTypes);
		const MraTicketAssignments = _MraTicketAssignments.init(sequelize, DataTypes);
		const MraTicketCategories = _MraTicketCategories.init(sequelize, DataTypes);
		const MraTicketComments = _MraTicketComments.init(sequelize, DataTypes);
		const MraTicketHistory = _MraTicketHistory.init(sequelize, DataTypes);
		const MraTicketReactionTypes = _MraTicketReactionTypes.init(sequelize, DataTypes);
		const MraTicketReactions = _MraTicketReactions.init(sequelize, DataTypes);
		const MraTickets = _MraTickets.init(sequelize, DataTypes);
		const MraTokenBlacklist = _MraTokenBlacklist.init(sequelize, DataTypes);
		const MraTransitionConditions = _MraTransitionConditions.init(sequelize, DataTypes);
		const MraUserCities = _MraUserCities.init(sequelize, DataTypes);
		const MraUserCustomers = _MraUserCustomers.init(sequelize, DataTypes);
		const MraUserDetails = _MraUserDetails.init(sequelize, DataTypes);
		const MraUsers = _MraUsers.init(sequelize, DataTypes);
		const MragCaAddresses = _MragCaAddresses.init(sequelize, DataTypes);
		const MragCities = _MragCities.init(sequelize, DataTypes);
		const MragCountries = _MragCountries.init(sequelize, DataTypes);
		const MragWofCaGeojson = _MragWofCaGeojson.init(sequelize, DataTypes);
		const MragWofCaNames = _MragWofCaNames.init(sequelize, DataTypes);
		const MragWofCaSpr = _MragWofCaSpr.init(sequelize, DataTypes);
		const MragWofGeometryTypes = _MragWofGeometryTypes.init(sequelize, DataTypes);
		const MragWofNameContexts = _MragWofNameContexts.init(sequelize, DataTypes);
		const MragWofPlaceTypes = _MragWofPlaceTypes.init(sequelize, DataTypes);

		MraSubscriptionModels.belongsToMany(MraSubscriptionOptions, { as: 'option_id_mra_subscription_options', through: MraSubscriptionModelOptions, foreignKey: "model_id", otherKey: "option_id" });
		MraSubscriptionOptions.belongsToMany(MraSubscriptionModels, { as: 'model_id_mra_subscription_models', through: MraSubscriptionModelOptions, foreignKey: "option_id", otherKey: "model_id" });
		MraTransitionConditions.belongsTo(MraConditionFields, { as: "condition_field", foreignKey: "condition_field_id"});
		MraConditionFields.hasMany(MraTransitionConditions, { as: "mra_transition_conditions", foreignKey: "condition_field_id"});
		MraTransitionConditions.belongsTo(MraConditionTypes, { as: "condition_type", foreignKey: "condition_type_id"});
		MraConditionTypes.hasMany(MraTransitionConditions, { as: "mra_transition_conditions", foreignKey: "condition_type_id"});
		MraContactTypes.belongsTo(MraContactCategories, { as: "contact_category", foreignKey: "contact_category_id"});
		MraContactCategories.hasMany(MraContactTypes, { as: "mra_contact_types", foreignKey: "contact_category_id"});
		MraContactInformation.belongsTo(MraContactTypes, { as: "contact_type", foreignKey: "contact_type_id"});
		MraContactTypes.hasMany(MraContactInformation, { as: "mra_contact_informations", foreignKey: "contact_type_id"});
		MraCurrencyCodes.belongsTo(MraCurrencyCodes, { as: "parent_currency_code", foreignKey: "parent_currency_code_id"});
		MraCurrencyCodes.hasMany(MraCurrencyCodes, { as: "mra_currency_codes", foreignKey: "parent_currency_code_id"});
		MraPaymentDetails.belongsTo(MraCurrencyCodes, { as: "currency_code", foreignKey: "currency_code_id"});
		MraCurrencyCodes.hasMany(MraPaymentDetails, { as: "mra_payment_details", foreignKey: "currency_code_id"});
		MraSubscriptionModels.belongsTo(MraCurrencyCodes, { as: "currency_code", foreignKey: "currency_code_id"});
		MraCurrencyCodes.hasMany(MraSubscriptionModels, { as: "mra_subscription_models", foreignKey: "currency_code_id"});
		MraSubscriptionOptions.belongsTo(MraCurrencyCodes, { as: "currency_code", foreignKey: "currency_code_id"});
		MraCurrencyCodes.hasMany(MraSubscriptionOptions, { as: "mra_subscription_options", foreignKey: "currency_code_id"});
		MraConditionFields.belongsTo(MraCustomerTypes, { as: "customer_type", foreignKey: "customer_type_id"});
		MraCustomerTypes.hasMany(MraConditionFields, { as: "mra_condition_fields", foreignKey: "customer_type_id"});
		MraCustomers.belongsTo(MraCustomerTypes, { as: "customer_type", foreignKey: "customer_type_id"});
		MraCustomerTypes.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "customer_type_id"});
		MraStatuses.belongsTo(MraCustomerTypes, { as: "customer_type", foreignKey: "customer_type_id"});
		MraCustomerTypes.hasMany(MraStatuses, { as: "mra_statuses", foreignKey: "customer_type_id"});
		MraTicketCategories.belongsTo(MraCustomerTypes, { as: "customer_type", foreignKey: "customer_type_id"});
		MraCustomerTypes.hasMany(MraTicketCategories, { as: "mra_ticket_categories", foreignKey: "customer_type_id"});
		MraAdvisorCustomers.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraAdvisorCustomers, { as: "mra_advisor_customers", foreignKey: "customer_id"});
		MraConditionFields.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraConditionFields, { as: "mra_condition_fields", foreignKey: "customer_id"});
		MraContactInformation.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraContactInformation, { as: "mra_contact_informations", foreignKey: "customer_id"});
		MraCustomers.belongsTo(MraCustomers, { as: "parent_customer", foreignKey: "parent_customer_id"});
		MraCustomers.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "parent_customer_id"});
		MraPosts.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraPosts, { as: "mra_posts", foreignKey: "customer_id"});
		MraStatuses.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraStatuses, { as: "mra_statuses", foreignKey: "customer_id"});
		MraSubscriptionCodeOfCustomers.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraSubscriptionCodeOfCustomers, { as: "mra_subscription_code_of_customers", foreignKey: "customer_id"});
		MraSubscriptions.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraSubscriptions, { as: "mra_subscriptions", foreignKey: "customer_id"});
		MraTicketAssignments.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraTicketAssignments, { as: "mra_ticket_assignments", foreignKey: "customer_id"});
		MraTicketCategories.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraTicketCategories, { as: "mra_ticket_categories", foreignKey: "customer_id"});
		MraTickets.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraTickets, { as: "mra_tickets", foreignKey: "customer_id"});
		MraUserCustomers.belongsTo(MraCustomers, { as: "customer", foreignKey: "customer_id"});
		MraCustomers.hasMany(MraUserCustomers, { as: "mra_user_customers", foreignKey: "customer_id"});
		MraSubscriptionModels.belongsTo(MraDiscountInterval, { as: "discount_interval", foreignKey: "discount_interval_id"});
		MraDiscountInterval.hasMany(MraSubscriptionModels, { as: "mra_subscription_models", foreignKey: "discount_interval_id"});
		MraSubscriptions.belongsTo(MraDiscountInterval, { as: "discount_interval", foreignKey: "discount_interval_id"});
		MraDiscountInterval.hasMany(MraSubscriptions, { as: "mra_subscriptions", foreignKey: "discount_interval_id"});
		MraSubscriptionModels.belongsTo(MraDiscountTypes, { as: "discount_type", foreignKey: "discount_type_id"});
		MraDiscountTypes.hasMany(MraSubscriptionModels, { as: "mra_subscription_models", foreignKey: "discount_type_id"});
		MraSubscriptions.belongsTo(MraDiscountTypes, { as: "discount_type", foreignKey: "discount_type_id"});
		MraDiscountTypes.hasMany(MraSubscriptions, { as: "mra_subscriptions", foreignKey: "discount_type_id"});
		MraUserDetails.belongsTo(MraGenderTypes, { as: "gender", foreignKey: "gender_id"});
		MraGenderTypes.hasMany(MraUserDetails, { as: "mra_user_details", foreignKey: "gender_id"});
		MraPaymentDetails.belongsTo(MraPaymentMethods, { as: "method", foreignKey: "method_id"});
		MraPaymentMethods.hasMany(MraPaymentDetails, { as: "mra_payment_details", foreignKey: "method_id"});
		MraStatuses.belongsTo(MraStatuses, { as: "next_status", foreignKey: "next_status_id"});
		MraStatuses.hasMany(MraStatuses, { as: "mra_statuses", foreignKey: "next_status_id"});
		MraStatuses.belongsTo(MraStatuses, { as: "previous_status", foreignKey: "previous_status_id"});
		MraStatuses.hasMany(MraStatuses, { as: "previous_status_mra_statuses", foreignKey: "previous_status_id"});
		MraTicketHistory.belongsTo(MraStatuses, { as: "status", foreignKey: "status_id"});
		MraStatuses.hasMany(MraTicketHistory, { as: "mra_ticket_histories", foreignKey: "status_id"});
		MraTransitionConditions.belongsTo(MraStatuses, { as: "status", foreignKey: "status_id"});
		MraStatuses.hasMany(MraTransitionConditions, { as: "mra_transition_conditions", foreignKey: "status_id"});
		MraSubscriptionModels.belongsTo(MraSubscriptionInterval, { as: "subscription_interval", foreignKey: "subscription_interval_id"});
		MraSubscriptionInterval.hasMany(MraSubscriptionModels, { as: "mra_subscription_models", foreignKey: "subscription_interval_id"});
		MraSubscriptionModelOptions.belongsTo(MraSubscriptionModels, { as: "model", foreignKey: "model_id"});
		MraSubscriptionModels.hasMany(MraSubscriptionModelOptions, { as: "mra_subscription_model_options", foreignKey: "model_id"});
		MraSubscriptions.belongsTo(MraSubscriptionModels, { as: "subscription_model", foreignKey: "subscription_model_id"});
		MraSubscriptionModels.hasMany(MraSubscriptions, { as: "mra_subscriptions", foreignKey: "subscription_model_id"});
		MraSubscriptionModelOptions.belongsTo(MraSubscriptionOptions, { as: "option", foreignKey: "option_id"});
		MraSubscriptionOptions.hasMany(MraSubscriptionModelOptions, { as: "mra_subscription_model_options", foreignKey: "option_id"});
		MraPaymentDetails.belongsTo(MraSubscriptions, { as: "subscription", foreignKey: "subscription_id"});
		MraSubscriptions.hasMany(MraPaymentDetails, { as: "mra_payment_details", foreignKey: "subscription_id"});
		MraTermsAndConditions.belongsTo(MraTcTypes, { as: "tc_type", foreignKey: "tc_type_id"});
		MraTcTypes.hasMany(MraTermsAndConditions, { as: "mra_terms_and_conditions", foreignKey: "tc_type_id"});
		MraTcAcceptance.belongsTo(MraTermsAndConditions, { as: "tc", foreignKey: "tc_id"});
		MraTermsAndConditions.hasMany(MraTcAcceptance, { as: "mra_tc_acceptances", foreignKey: "tc_id"});
		MraTicketHistory.belongsTo(MraTicketAssignments, { as: "assignment", foreignKey: "assignment_id"});
		MraTicketAssignments.hasMany(MraTicketHistory, { as: "mra_ticket_histories", foreignKey: "assignment_id"});
		MraTicketCategories.belongsTo(MraTicketCategories, { as: "parent_category", foreignKey: "parent_category_id"});
		MraTicketCategories.hasMany(MraTicketCategories, { as: "mra_ticket_categories", foreignKey: "parent_category_id"});
		MraTicketCategories.belongsTo(MraTicketCategories, { as: "source", foreignKey: "source_id"});
		MraTicketCategories.hasMany(MraTicketCategories, { as: "source_mra_ticket_categories", foreignKey: "source_id"});
		MraTickets.belongsTo(MraTicketCategories, { as: "ticket_category", foreignKey: "ticket_category_id"});
		MraTicketCategories.hasMany(MraTickets, { as: "mra_tickets", foreignKey: "ticket_category_id"});
		MraTicketReactions.belongsTo(MraTicketReactionTypes, { as: "reaction_type", foreignKey: "reaction_type_id"});
		MraTicketReactionTypes.hasMany(MraTicketReactions, { as: "mra_ticket_reactions", foreignKey: "reaction_type_id"});
		MraNotifications.belongsTo(MraTickets, { as: "ticket", foreignKey: "ticket_id"});
		MraTickets.hasMany(MraNotifications, { as: "mra_notifications", foreignKey: "ticket_id"});
		MraTicketAssignments.belongsTo(MraTickets, { as: "ticket", foreignKey: "ticket_id"});
		MraTickets.hasMany(MraTicketAssignments, { as: "mra_ticket_assignments", foreignKey: "ticket_id"});
		MraTicketComments.belongsTo(MraTickets, { as: "ticket", foreignKey: "ticket_id"});
		MraTickets.hasMany(MraTicketComments, { as: "mra_ticket_comments", foreignKey: "ticket_id"});
		MraTicketHistory.belongsTo(MraTickets, { as: "ticket", foreignKey: "ticket_id"});
		MraTickets.hasMany(MraTicketHistory, { as: "mra_ticket_histories", foreignKey: "ticket_id"});
		MraTicketReactions.belongsTo(MraTickets, { as: "ticket", foreignKey: "ticket_id"});
		MraTickets.hasMany(MraTicketReactions, { as: "mra_ticket_reactions", foreignKey: "ticket_id"});
		MraAdvisorCustomers.belongsTo(MraUsers, { as: "advisor", foreignKey: "advisor_id"});
		MraUsers.hasMany(MraAdvisorCustomers, { as: "mra_advisor_customers", foreignKey: "advisor_id"});
		MraAdvisorCustomers.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraAdvisorCustomers, { as: "creator_mra_advisor_customers", foreignKey: "creator"});
		MraAdvisorCustomers.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraAdvisorCustomers, { as: "updator_mra_advisor_customers", foreignKey: "updator"});
		MraConditionFields.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraConditionFields, { as: "mra_condition_fields", foreignKey: "creator"});
		MraConditionFields.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraConditionFields, { as: "updator_mra_condition_fields", foreignKey: "updator"});
		MraContactInformation.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraContactInformation, { as: "mra_contact_informations", foreignKey: "creator"});
		MraContactInformation.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraContactInformation, { as: "updator_mra_contact_informations", foreignKey: "updator"});
		MraContactInformation.belongsTo(MraUsers, { as: "user", foreignKey: "user_id"});
		MraUsers.hasMany(MraContactInformation, { as: "user_mra_contact_informations", foreignKey: "user_id"});
		MraCustomers.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "creator"});
		MraCustomers.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraCustomers, { as: "updator_mra_customers", foreignKey: "updator"});
		MraNotifications.belongsTo(MraUsers, { as: "receiver_mra_user", foreignKey: "receiver"});
		MraUsers.hasMany(MraNotifications, { as: "mra_notifications", foreignKey: "receiver"});
		MraNotifications.belongsTo(MraUsers, { as: "sender_mra_user", foreignKey: "sender"});
		MraUsers.hasMany(MraNotifications, { as: "sender_mra_notifications", foreignKey: "sender"});
		MraPaymentMethods.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraPaymentMethods, { as: "mra_payment_methods", foreignKey: "creator"});
		MraPaymentMethods.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraPaymentMethods, { as: "updator_mra_payment_methods", foreignKey: "updator"});
		MraPosts.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraPosts, { as: "mra_posts", foreignKey: "creator"});
		MraPosts.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraPosts, { as: "updator_mra_posts", foreignKey: "updator"});
		MraStatuses.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraStatuses, { as: "mra_statuses", foreignKey: "creator"});
		MraStatuses.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraStatuses, { as: "updator_mra_statuses", foreignKey: "updator"});
		MraSubscriptionCodeOfCustomers.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraSubscriptionCodeOfCustomers, { as: "mra_subscription_code_of_customers", foreignKey: "creator"});
		MraSubscriptionModelOptions.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraSubscriptionModelOptions, { as: "mra_subscription_model_options", foreignKey: "creator"});
		MraSubscriptionModelOptions.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraSubscriptionModelOptions, { as: "updator_mra_subscription_model_options", foreignKey: "updator"});
		MraSubscriptionModels.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraSubscriptionModels, { as: "mra_subscription_models", foreignKey: "creator"});
		MraSubscriptionModels.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraSubscriptionModels, { as: "updator_mra_subscription_models", foreignKey: "updator"});
		MraSubscriptionOptions.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraSubscriptionOptions, { as: "mra_subscription_options", foreignKey: "creator"});
		MraSubscriptionOptions.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraSubscriptionOptions, { as: "updator_mra_subscription_options", foreignKey: "updator"});
		MraSubscriptions.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraSubscriptions, { as: "mra_subscriptions", foreignKey: "creator"});
		MraSubscriptions.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraSubscriptions, { as: "updator_mra_subscriptions", foreignKey: "updator"});
		MraTcAcceptance.belongsTo(MraUsers, { as: "accepted_by_mra_user", foreignKey: "accepted_by"});
		MraUsers.hasMany(MraTcAcceptance, { as: "mra_tc_acceptances", foreignKey: "accepted_by"});
		MraTcTypes.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraTcTypes, { as: "mra_tc_types", foreignKey: "creator"});
		MraTcTypes.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraTcTypes, { as: "updator_mra_tc_types", foreignKey: "updator"});
		MraTermsAndConditions.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraTermsAndConditions, { as: "mra_terms_and_conditions", foreignKey: "creator"});
		MraTermsAndConditions.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraTermsAndConditions, { as: "updator_mra_terms_and_conditions", foreignKey: "updator"});
		MraTicketAssignments.belongsTo(MraUsers, { as: "agent", foreignKey: "agent_id"});
		MraUsers.hasMany(MraTicketAssignments, { as: "mra_ticket_assignments", foreignKey: "agent_id"});
		MraTicketAssignments.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraTicketAssignments, { as: "creator_mra_ticket_assignments", foreignKey: "creator"});
		MraTicketAssignments.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraTicketAssignments, { as: "updator_mra_ticket_assignments", foreignKey: "updator"});
		MraTicketCategories.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraTicketCategories, { as: "mra_ticket_categories", foreignKey: "creator"});
		MraTicketCategories.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraTicketCategories, { as: "updator_mra_ticket_categories", foreignKey: "updator"});
		MraTicketComments.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraTicketComments, { as: "mra_ticket_comments", foreignKey: "creator"});
		MraTicketComments.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraTicketComments, { as: "updator_mra_ticket_comments", foreignKey: "updator"});
		MraTicketHistory.belongsTo(MraUsers, { as: "caused_by_mra_user", foreignKey: "caused_by"});
		MraUsers.hasMany(MraTicketHistory, { as: "mra_ticket_histories", foreignKey: "caused_by"});
		MraTicketReactions.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraTicketReactions, { as: "mra_ticket_reactions", foreignKey: "creator"});
		MraTickets.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraTickets, { as: "mra_tickets", foreignKey: "creator"});
		MraTickets.belongsTo(MraUsers, { as: "publisher_mra_user", foreignKey: "publisher"});
		MraUsers.hasMany(MraTickets, { as: "publisher_mra_tickets", foreignKey: "publisher"});
		MraTickets.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraTickets, { as: "updator_mra_tickets", foreignKey: "updator"});
		MraTransitionConditions.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraTransitionConditions, { as: "mra_transition_conditions", foreignKey: "creator"});
		MraTransitionConditions.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraTransitionConditions, { as: "updator_mra_transition_conditions", foreignKey: "updator"});
		MraUserCities.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraUserCities, { as: "mra_user_cities", foreignKey: "creator"});
		MraUserCities.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraUserCities, { as: "updator_mra_user_cities", foreignKey: "updator"});
		MraUserCities.belongsTo(MraUsers, { as: "user", foreignKey: "user_id"});
		MraUsers.hasMany(MraUserCities, { as: "user_mra_user_cities", foreignKey: "user_id"});
		MraUserCustomers.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraUserCustomers, { as: "mra_user_customers", foreignKey: "creator"});
		MraUserCustomers.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraUserCustomers, { as: "updator_mra_user_customers", foreignKey: "updator"});
		MraUserCustomers.belongsTo(MraUsers, { as: "user", foreignKey: "user_id"});
		MraUsers.hasMany(MraUserCustomers, { as: "user_mra_user_customers", foreignKey: "user_id"});
		MraUserDetails.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraUserDetails, { as: "mra_user_details", foreignKey: "creator"});
		MraUserDetails.belongsTo(MraUsers, { as: "user", foreignKey: "user_id"});
		MraUsers.hasOne(MraUserDetails, { as: "user_mra_user_detail", foreignKey: "user_id"});
		MraUserDetails.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraUserDetails, { as: "updator_mra_user_details", foreignKey: "updator"});
		MraUsers.belongsTo(MraUsers, { as: "creator_mra_user", foreignKey: "creator"});
		MraUsers.hasMany(MraUsers, { as: "mra_users", foreignKey: "creator"});
		MraUsers.belongsTo(MraUsers, { as: "suspender_mra_user", foreignKey: "suspender"});
		MraUsers.hasMany(MraUsers, { as: "suspender_mra_users", foreignKey: "suspender"});
		MraUsers.belongsTo(MraUsers, { as: "updator_mra_user", foreignKey: "updator"});
		MraUsers.hasMany(MraUsers, { as: "updator_mra_users", foreignKey: "updator"});
		MraCustomers.belongsTo(MragCities, { as: "city", foreignKey: "city_id"});
		MragCities.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "city_id"});
		MraPosts.belongsTo(MragCities, { as: "city", foreignKey: "city_id"});
		MragCities.hasMany(MraPosts, { as: "mra_posts", foreignKey: "city_id"});
		MraTickets.belongsTo(MragCities, { as: "city", foreignKey: "city_id"});
		MragCities.hasMany(MraTickets, { as: "mra_tickets", foreignKey: "city_id"});
		MraUserCities.belongsTo(MragCities, { as: "city", foreignKey: "city_id"});
		MragCities.hasMany(MraUserCities, { as: "mra_user_cities", foreignKey: "city_id"});
		MraCustomers.belongsTo(MragCountries, { as: "country", foreignKey: "country_id"});
		MragCountries.hasMany(MraCustomers, { as: "mra_customers", foreignKey: "country_id"});
		MraTickets.belongsTo(MragCountries, { as: "country", foreignKey: "country_id"});
		MragCountries.hasMany(MraTickets, { as: "mra_tickets", foreignKey: "country_id"});

		return {
				CasbinRule,
				MraActions,
				MraAdvisorCustomers,
				MraAuditLogsAuthentication,
				MraConditionFields,
				MraConditionTypes,
				MraContactCategories,
				MraContactInformation,
				MraContactTypes,
				MraCurrencyCodes,
				MraCustomerTypes,
				MraCustomers,
				MraDiscountInterval,
				MraDiscountTypes,
				MraGenderTypes,
				MraNotificationTypes,
				MraNotifications,
				MraPaymentDetails,
				MraPaymentMethods,
				MraPosts,
				MraRoles,
				MraStatuses,
				MraSubscriptionCodeOfCustomers,
				MraSubscriptionInterval,
				MraSubscriptionModelOptions,
				MraSubscriptionModels,
				MraSubscriptionOptions,
				MraSubscriptions,
				MraTables,
				MraTcAcceptance,
				MraTcTypes,
				MraTermsAndConditions,
				MraTicketAssignments,
				MraTicketCategories,
				MraTicketComments,
				MraTicketHistory,
				MraTicketReactionTypes,
				MraTicketReactions,
				MraTickets,
				MraTokenBlacklist,
				MraTransitionConditions,
				MraUserCities,
				MraUserCustomers,
				MraUserDetails,
				MraUsers,
				MragCaAddresses,
				MragCities,
				MragCountries,
				MragWofCaGeojson,
				MragWofCaNames,
				MragWofCaSpr,
				MragWofGeometryTypes,
				MragWofNameContexts,
				MragWofPlaceTypes,
		};
}
