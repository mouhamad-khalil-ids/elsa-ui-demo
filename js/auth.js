/**
 * auth.js — Authentication Logic
 *
 * Handles login, token + username persistence, and role-based routing.
 * Depends on: ENV (config/env.js), UI (js/ui.js), constants.js
 */

/* ─────────────────────── Storage Keys ──────────────────────────── */

/* ─────────────────────── Token Helpers ─────────────────────────── */

function saveToken(token) {
  localStorage.setItem(ENV.TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(ENV.TOKEN_KEY);
}

function getToken() {
  return localStorage.getItem(ENV.TOKEN_KEY);
}

/** Returns true if a token is stored (basic client-side session check). */
function isAuthenticated() {
  return !!getToken();
}

/* ─────────────────────── Username Helpers ───────────────────────── */

function saveUsername(username) {
  localStorage.setItem(ENV.USERNAME_KEY, username);
}

function clearUsername() {
  localStorage.removeItem(ENV.USERNAME_KEY);
}

/** Returns the stored username, or null if not logged in. */
function getUsername() {
  return localStorage.getItem(ENV.USERNAME_KEY);
}

/**
 * Returns the dashboard URL for the currently logged-in user.
 * Falls back to index.html if no match found.
 */
function getUserDashboard() {
  const username = getUsername();
  return DASHBOARD_ROUTES[username] || "index.html";
}

/**
 * Page-level role guard.
 * Call at the top of each dashboard's init — redirects if wrong user.
 * @param {string} expectedUsername  - One of the Usernames constants
 */
function guardRole(expectedUsername) {
  if (!isAuthenticated() || getUsername() !== expectedUsername) {
    window.location.href = "index.html";
  }
}

/* ─────────────────────── Login Handler ─────────────────────────── */

/**
 * Perform login against the API.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<void>}
 */
async function login(username, password) {
  if (
    username != Usernames.CITIZEN &&
    username != Usernames.IILAM_KANOUNY &&
    username != Usernames.MOAAWEN_CHOOBA
  ) {
    throw new Error("Invalid Username.");
  }
  const data = { username, password };
  const token = JSON.stringify(data);
  if (!token) throw new Error("No token received from server.");

  saveToken(token);
  saveUsername(username);
}

/* ─────────────────────── Form Wiring ───────────────────────────── */

function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    UI.clearFormErrors(form);

    const usernameField = document.getElementById("username");
    const passwordField = document.getElementById("password");

    const username = usernameField.value.trim();
    const password = passwordField.value;

    // ── Client-side validation ──
    let hasError = false;
    if (!username) {
      UI.setFieldError(usernameField, "Username is required.");
      hasError = true;
    }
    if (!password) {
      UI.setFieldError(passwordField, "Password is required.");
      hasError = true;
    }
    if (hasError) return;

    // ── Submit ──
    UI.setFormLoading(form, true);
    try {
      await login(username, password);
      UI.showToast("Login successful! Redirecting…", "success", 1500);
      setTimeout(() => {
        window.location.href = getUserDashboard();
      }, 1000);
    } catch (err) {
      UI.showToast(err.message, "error");
    } finally {
      UI.setFormLoading(form, false);
    }
  });
}

const Auth = {
  login,
  isAuthenticated,
  clearToken,
  clearUsername,
  getToken,
  getUsername,
  getUserDashboard,
  guardRole,
  initLoginPage,
};
