// globalTeardown.js
import { closeApp } from '../app.mjs';

export default async () => {
  if (!process.env.DO_NOT_CLOSE_APP) {
    await closeApp();
  }
};
