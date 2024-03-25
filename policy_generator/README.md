# Roles
In this B2B app we have different types of users.
Users are in 4 categories:
1. Internal
2. Customer
3. External	
4. Public

## Internal users

Internal users are our staffs. They can have these roles: 
1. super	
2. superdata	
3. devhead	
4. developer	
5. saleshead	
6. sales	
7. support

## Customer users

Customers are type of external users that can login to their dashboard. They can have these roles:
1. admin	
2. admindata	
3. officer	
4. agent 

## Endusers

All users when login to our mobile app instead of dashboard, get the enduser role.
Endusers are considered as external users.

## public users
And finally, if someone do not login like search engines, they are considered as public users and they can read tickets, comments and posts. 

## System user

I have a system user also. There are some actions that even superuser cannot modify them and they must recorded automatically. 
For example, generating logs, managine JWT tokesn, recording payments, generating notifications or recording acceptance of terms and conditions.

# Roles.xlsx

I made a roles file that explains permissions of each role. 

Here is meaning of each permission code:
1.	**N**: Not allowed to access.
2.	**R**: Can read data of any row in the table
3.  **RO**: Only the user with the id of the owner can read	
4.	**R\***: Can read limited rows or under specific conditions (e.g., if related to the customer that user belongs to)
5.	**CUD**: Can write data on any row in the table
6.	**CRUD**: Can read or write data on any row in the table
7.	**COROUODO**: Only the user with the id of the owner can write or read
8.	**C\*R\*U\*D\***: Can read or write limited rows or under specific conditions (e.g., if row is related to the customer that user belongs to)
	
Please note that some data do not belong to an specific user, they belong to the customer. 
So, only users which belongs to that customer (mra_user_customers) with roles with permission W can write the rows that belong to that customer (customer_id).

Some tables belong to the system. Therefore, they don't have owner and a hypothetical column SYS is the owner. For some tables internal users with permission W can write it. They are somehow the essential data.

Please note users of a customer in the dashboard UI must only be able to access those data that are related to the customer that are belonged to. 

Now I want to ask you help me to implement authorization node.js microservice by using a tailored made solution or Casbin to determine if a user is aloowed to edit a table or a row or not.

Please note that I have an authentication microservice and users must login first and we can detect the user from JWT by calling the verify_token service. 

Please note that one user can have multiple roles and I want to add roles to their user_id programatically.

I have defined the permissions based on the tables also. It seems we need ABAC for W\*R\* or R\* or RO or WORO and we need RBAC for others.  

If users of a role can grant their permission you can use a prefix `G`. For example `GC*`. Please note that users cannot grant an ownership permission to someone else. So we don't have `GRO`.  

# Add attributes
We support a JSON object as attributes for each set of prmission code.
For example, you can have **CUD{"age": 30}**.
To support the attributes JSON the separator has changed to semicolon.  

# Convert Role.csv to policy.csv

First make a `Roles.csv` file. This file does not have some redundent columns.

## Install libraries

```
pip install pandas
```

## Run the program

1. Run `python convertor.py` to generate `policy.csv` file. 
2. Move the `policy.csv` to './config' folder.