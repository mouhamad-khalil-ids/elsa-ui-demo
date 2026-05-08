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

const API = { request, post, get };
