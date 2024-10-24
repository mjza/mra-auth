# mra-auth

## GitHub Setup

### Setup Instructions for Mac

After cloning the repository, run the following command to set up the commit message template locally:

```bash
./setup.sh
```

You need to make sure the script has execute permissions:

```bash
chmod +x setup.sh
```

This will configure Git to use the commit message template for this repository only.

### Setup Instructions for Windows

Open Command Prompt or PowerShell, navigate to the repository directory, and run:

```bash
.\setup.bat
```

## Loading `MY_PAT` from `.env` File Automatically

If you want `MY_PAT` to be loaded from a `.env` file automatically, as you need it for installing private packages, you can use a tool like `dotenv-cli` to load the environment variables before running `npm install`. Here’s how to set it up:

### Step 1: Install `dotenv-cli` globally

First, you need to install `dotenv-cli`, which helps load `.env` variables into your environment.

```bash
npm install -g dotenv-cli
```

If face with the following error:

```bash
npm error The operation was rejected by your operating system.
npm error It is likely you do not have the permissions to access this file as the current user
npm error
npm error If you believe this might be a permissions issue, please double-check the
npm error permissions of the file and its containing directories, or try running
npm error the command again as root/Administrator.
```

Then it means you must use the command `sudo ` before the `npm install -g dotenv-cli` and then type your password.

### Step 2: Create a `.env` File

Ensure you have a `.env` file in `/src/config/` directory. For example:

```
MY_PAT=your_personal_access_token_here
```

### Step 3: Run `npm install` with `dotenv`

Now, when you run `npm install`, use `dotenv` to load the `.env` file:

```
dotenv -e ./src/config/.env -- npm install
```

### Update nodejs packages
First make sure `dotenv` has been installed globally.
Then use `npm-check-updates` to automate the process of checking and updating your dependencies:

```bash
dotenv -e ./src/config/.env -- npx npm-check-updates -u
dotenv -e ./src/config/.env -- npm install
```

## Install private packages using `.npmrc` Manually
As we are running npm to install packages locally, the `MY_PAT` (which is your PAT) needs to be set as an environment variable. Here’s how it works in different environments:

1. Generate a personal access token (PAT) in GitHub
2. Set the `MY_PAT` environment variable in your shell manually (or via a script):

For Linux/macOS:

```bash
export MY_PAT=<your_personal_access_token>
```

For Windows (PowerShell):

```powershell
$env:MY_PAT="<your_personal_access_token>"
```
3. Run `npm install` after setting the environment variable.


## Install Heroku CLI
Follow the instructions in this [link](https://devcenter.heroku.com/articles/heroku-cli#verify-your-installation) and install Heroku CLI. 

## local
Copy `config/template.env` file and rename it to `.env` in `config` folder.
Update its content accordingly with respect to your system. 

## production

For the production: 
1. You must change the `XXX` in the following list accordingly from `Settings` tab of the `mra-database` application. 

2. You must change `YYY` must be replaced via [https://app.sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys).

```bash
heroku config:set BASE_URL=http://authentication.myreport.app --app mra-auth
heroku config:set COMPANY_ADDRESS=4515 Varsity Dr. NW, <br/>Calgary T3A0Z8, Canada --app mra-auth
heroku config:set COMPANY_LOGO_URL=https://reportcycle.com/logo512.png --app mra-auth
heroku config:set COMPANY_NAME=Report Cycle --app mra-auth
heroku config:set COMPANY_PHONENUMBER=+1-403-708-9078 --app mra-auth
heroku config:set COMPANY_WEBSITE=https://reportcycle.com/ --app mra-auth
heroku config:set DB_USER=XXX --app mra-auth
heroku config:set DB_HOST=XXX --app mra-auth
heroku config:set DB_NAME=XXX --app mra-auth
heroku config:set DB_PASSWORD=XXX --app mra-auth
heroku config:set DB_PORT=5432 --app mra-auth
heroku config:set DOC_URL=/docs --app mra-auth
heroku config:set DOC_PASS=Zu~0WC,X,8h3Hh@s --app mra-auth
heroku config:set DOC_USER=modir --app mra-auth
heroku config:set FROM_EMAIL=noreply@reportcycle.com --app mra-auth
heroku config:set GENDER_TYPES_TABLE=mra_gender_types --app mra-auth
heroku config:set NODE_ENV=production --app mra-auth
heroku config:set PORT=443 --app mra-auth
heroku config:set SECRET_KEY=ZZZ --app mra-auth
heroku config:set SENDGRID_API_KEY=YYY --app mra-auth
heroku config:set TZ=UTC --app mra-auth
heroku config:set ACTIVATE_SWAGGER=true --app mra-auth
```

Then run run the above commands in the Heroku CLI or go to the `mra-auth` application, then in the `Settings` tab press on the `Reveal Config Vars` button and edit them directly. Like the following picture:
![](./images/figure3.png)


## creating SSL for localhost

```bash
openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -days 365 -nodes -subj "/CN=localhost"
```

## Generate a 256-bit (32-byte) random key and print it in hexadecimal format
```bash 
openssl rand -hex 32
```
This key is used as SECRET_KEY in .env file. It is used for generating the JWT token.

## Generate documentations using JSDoc
```bash
npm run generate-docs
```

## GitHub configuration
`HEROKU_API_KEY` is the api key for accessing `mra-auth` application, and `MY_PAT` is you personal access token of GitHub for tagging releases. They have been particularly set in GitHub secrets.

![](./images/figure4.png)

They are needed in the workflow codes that we generated for automatically tagging the releases based on the version number in Heroku. The code exist in `.github\workflows` folder. 

`main.yml` is run automatically when we push to main branch. However, after a seccessful push to Heroku, we must run the other workflow in GitHub manually. 
![](./images/figure5.png)

