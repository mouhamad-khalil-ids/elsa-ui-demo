/**
 * env.js — Application Configuration
 *
 * Change BASE_URL to point to your backend API.
 * All other modules import from here — never hard-code URLs elsewhere.
 */
const ENV = Object.freeze({
  /** Base URL of your backend API (no trailing slash) */
  BASE_URL: "http://localhost:5000/api",

  /** Token storage key in localStorage */
  TOKEN_KEY: "auth_token",

  /** Username storage key in localStorage */
  USERNAME_KEY: "auth_username",

  /** App display name */
  APP_NAME: "Workflow Portal",

  /** LocalStorage key for persisted transactions */
  TRANSACTIONS_KEY: "elsa_transactions",
});
