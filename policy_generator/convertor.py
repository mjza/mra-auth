import pandas as pd
import json

def parse_json_from_permission_code(permission_code):
    """
    Extracts JSON string from permission code and returns JSON as a dictionary and the cleaned permission code.
    """
    try:
        json_start = permission_code.index("{")
        json_str = permission_code[json_start:]
        permission_code_clean = permission_code[:json_start]
        json_dict = json.loads(json_str)
    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON in permission code: {permission_code}")    
    except ValueError:  # No JSON part found
        return permission_code, "none"    
    
    return permission_code_clean, json_dict

def permission_to_policy_actions_and_conditions(permission_code, table, role):
    """
    Convert permission codes into Casbin policy actions, conditions, and effects more efficiently,
    including handling JSON strings as postfix.
    """
    # Extract JSON from permission code if present
    permission_code, attrs = parse_json_from_permission_code(permission_code)

    # Define possible actions and their corresponding conditions
    actions = ["C", "R", "U", "D"]
    domain = '0' # General doamin is used for all customers
    policies = []
    effect = "allow"
    for action in actions:
        if action in permission_code: 
            # Direct policies           
            condition = "none"
            if f"{action}O" in permission_code:
                condition = "check_ownership"
            elif f"{action}*" in permission_code:
                condition = "check_relationship"        
            policies.append((role, domain, table, action, condition, attrs, effect))
            # Grant policies
            condition = "none"
            grant = False
            if f"G{action}O" in permission_code:
                grant = False
                print(f"Meaningless code => permission code: {permission_code}, table: {table}, role: {role}")
            elif f"G{action}*" in permission_code:
                grant = True
                condition = "check_relationship"    
            elif f"G{action}" in permission_code:
                grant = True             
            if grant:           
                policies.append((role, domain, table, f"G{action}", condition, attrs, effect))
    
    return policies

def generate_policies_csv(input_csv_path, output_csv_path):
    """
    Generate a policies CSV file from a roles CSV file, more efficiently.
    """
    roles_df = pd.read_csv(input_csv_path, sep=';')
    policies_with_conditions = []
    
    # Roles are corrected right here to avoid further modifications
    roles_corrected = [role.strip() for role in roles_df.columns[3:]]

    for _, row in roles_df.iterrows():
        table = row['Tables']
        for role in roles_corrected:
            permission_code = row[role].strip()
            policies = permission_to_policy_actions_and_conditions(permission_code, table, role)
            policies_with_conditions.extend(policies)

    # Generating DataFrame and saving to CSV
    policies_df = pd.DataFrame(policies_with_conditions, columns=['subject', 'doamin', 'object', 'action', 'condition', 'attributes', 'effect'])
    policies_df.to_csv(output_csv_path, sep=';', index=False)
    print(f"Policy CSV generated at: {output_csv_path}")

if __name__ == "__main__":
    input_csv_path = './Roles.csv'  # Adjust as needed
    output_csv_path = '../config/policy.csv'  # Adjust as needed
    generate_policies_csv(input_csv_path, output_csv_path)