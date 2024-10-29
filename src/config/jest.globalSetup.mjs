import { createApp } from '../app.mjs';
import './config.mjs';

export default async () => {
    global.__APP__ = await createApp();
};
