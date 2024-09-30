import './config.mjs';
import { createApp } from '../app.mjs';

export default async () => {
    global.__APP__ = await createApp();
};
