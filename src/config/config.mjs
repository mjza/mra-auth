// set the address for .env file 
import dotenv from 'dotenv';
import { utils } from '@reportcycle/mra-utils';
// set the env addresses
dotenv.config({
  path: 'src/config/.env'
});

// config utils
utils.config({
    secretKey: process.env.SECRET_KEY,
    developmentToken: process.env.X_DEVELOPMENT_TOKEN,
    timezone: process.env.TZ
});
