import { ActionIDConfig } from '../types/index.js';

export const ACTIONID_CONFIG: ActionIDConfig = {
  CLIENT_ID: process.env.ACTIONID_CLIENT_ID || 'ivengprod',
  BASE_URL: process.env.ACTIONID_BASE_URL || 'https://aa-api.a2.ironvest.com',
  API_KEY: process.env.ACTIONID_API_KEY || '5000d0dc-9729-4273-b286-01ebb5a8fd7f',
};
