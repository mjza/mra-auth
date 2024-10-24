// set the address for .env file 
import dotenv from 'dotenv';
import { config } from '@reportcycle/mra-utils';
dotenv.config({
  path: 'src/config/.env'
});

// Set config
config.setConfig({
    secretKey: process.env.SECRET_KEY,
    developmentToken: process.env.X_DEVELOPMENT_TOKEN,
    timezone: process.env.TZ
});
