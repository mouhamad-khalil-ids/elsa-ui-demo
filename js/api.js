/**
 * api.js — HTTP API Layer
 *
 * A thin fetch wrapper that always reads the base URL from ENV.
 * Every network call in the app should go through this module.
 */

/**
 * Core request function.
 * @param {string} endpoint  - Path relative to BASE_URL (e.g. "/auth/login")
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} with a human-readable message on failure
 */
async function request(endpoint, options = {}) {
  const url = `${ENV.BASE_URL}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Attach bearer token if one exists
  const token = localStorage.getItem(ENV.TOKEN_KEY);
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new Error("Network error — please check your connection.");
  }

  // Try to parse JSON body (even for error responses)
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

/** Convenience: POST JSON body */
function post(endpoint, body) {
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Convenience: GET */
function get(endpoint) {
  return request(endpoint, { method: "GET" });
}

/**
 * Get all pending workflow inbox items for the current user's role.
 * @returns {Promise<Array<{ workflowInstanceId, bookmarkId, applicationId, stepName, requiredRole }>>}
 */
async function getWorkflowInbox() {
  const role = localStorage.getItem("userRole");
  return get(
    `/workflow-inbox?role=${encodeURIComponent(role != null ? role : "")}`
  );
}

/**
 * Get a single workflow inbox item by bookmarkId (full JSON returned as-is).
 * @param {string} bookmarkId
 * @returns {Promise<object>} Includes workflowInstanceId, bookmarkId, applicationId, stepName, requiredRole, availableActions[], …
 */
async function getWorkflowInboxItem(bookmarkId) {
  return get(`/workflow-inbox/${encodeURIComponent(bookmarkId)}`);
}

/**
 * Submit a workflow bookmark action.
 * @param {string} bookmarkId
 * @param {string} action - Machine key from availableActions[].key
 * @param {string|null|undefined} reason
 * @param {object} [extra={}]
 */
async function submitWorkflowDecision(bookmarkId, action, reason, extra = {}) {
  const role = localStorage.getItem("userRole");
  const url = `${ENV.BASE_URL}/workflow-inbox/${encodeURIComponent(
    bookmarkId
  )}/submit?role=${encodeURIComponent(role != null ? role : "")}`;

  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem(ENV.TOKEN_KEY);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action,
        reason: reason ?? null,
        extra,
      }),
    });
  } catch (networkError) {
    throw new Error("Network error — please check your connection.");
  }

  if (response.status === 403) {
    throw new Error("You do not have permission to action this task.");
  }

  if (!response.ok) {
    throw new Error("Failed to submit decision");
  }
}

const API = {
  request,
  post,
  get,
  getWorkflowInbox,
  getWorkflowInboxItem,
  submitWorkflowDecision,
};
