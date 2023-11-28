# mra-authentication

## local
Copy `.env.example` file and rename it to `.env.development`.
Update its content accordingly with respect to your system. 

## production

For production, change the `XXX` in the following list accordingly and run the following commands:

```bash
heroku config:set DB_USER=XXX --app mra-authentication
heroku config:set DB_HOST=XXX --app mra-authentication
heroku config:set DB_NAME=XXX --app mra-authentication
heroku config:set DB_PASSWORD=XXX --app mra-authentication
heroku config:set DB_PORT=5432 --app mra-authentication
heroku config:set BASE_URL=http://auth.myreport.app --app mra-authentication
heroku config:set PORT=443 --app mra-authentication
heroku config:set DOC_USER=modir --app mra-authentication
heroku config:set DOC_PASS=Zu~0WC,X,8h3Hh@s --app mra-authentication
```

## creating SSL for localhost

```bash
openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -days 365 -nodes -subj "/CN=localhost"

```

