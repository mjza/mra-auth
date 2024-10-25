import { utils } from '@reportcycle/mra-utils';

utils.config({
    secretKey: process.env.SECRET_KEY,
    developmentToken: process.env.X_DEVELOPMENT_TOKEN,
    timezone: process.env.TZ
});
