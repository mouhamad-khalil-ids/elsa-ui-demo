/**
 * Enum for Staff Roles / Usernames
 * @readonly
 * @enum {string}
 */
const Usernames = Object.freeze({
  CITIZEN: "citizen",
  MOAAWEN_CHOOBA: "moaawen chooba",
  IILAM_KANOUNY: "iilam kanouny",
});

/**
 * Maps each username to its dedicated dashboard page.
 * Single source of truth for all post-login routing.
 * @readonly
 */
const DASHBOARD_ROUTES = Object.freeze({
  [Usernames.CITIZEN]:        "dashboard.html",
  [Usernames.MOAAWEN_CHOOBA]: "moaawen-chooba.html",
  [Usernames.IILAM_KANOUNY]:  "iilam-kanouny.html",
});
