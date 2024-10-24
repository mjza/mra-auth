
import { config, converters } from '@reportcycle/mra-utils';

// Using config methods
const { setConfig } = config;

// Using converters
const { convertRequestData, encrypt, decrypt, toLowerCamelCase, toSnakeCase } = converters;

// Set config
setConfig({
    secretKey: process.env.SECRET_KEY,
    developmentToken: process.env.X_DEVELOPMENT_TOKEN,
    timezone: process.env.TZ
});
export { convertRequestData, encrypt, decrypt, toLowerCamelCase, toSnakeCase };