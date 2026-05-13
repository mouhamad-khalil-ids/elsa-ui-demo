/**
 * store.js — Transaction Persistence Layer
 *
 * All submitted transactions (from any dashboard) are stored in
 * localStorage under ENV.TRANSACTIONS_KEY as a JSON array.
 *
 * Each record has:
 *   id          — unique string (timestamp-based)
 *   submittedBy — username from Auth
 *   role        — one of the Usernames constants
 *   timestamp   — ISO 8601 string
 *   data        — the raw form payload
 */

/* ─────────────────────── Helpers ───────────────────────────── */

/** Generate a short unique ID (no external library needed). */
function _generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Read the full transactions array from localStorage. */
function _readAll() {
  try {
    return JSON.parse(localStorage.getItem(ENV.TRANSACTIONS_KEY)) || [];
  } catch {
    return [];
  }
}

/** Persist an array of transaction records. */
function _writeAll(records) {
  localStorage.setItem(ENV.TRANSACTIONS_KEY, JSON.stringify(records));
}

/* ─────────────────────── Public API ────────────────────────── */

/**
 * Save a new transaction record.
 *
 * @param {string} role   - Usernames constant (e.g. Usernames.CITIZEN)
 * @param {object} data   - The validated form payload
 * @returns {object}      - The saved record (with id + timestamp)
 */
function saveTransaction(role, data) {
  const records = _readAll();

  const record = {
    id: _generateId(),
    submittedBy: Auth.getUsername(),
    role,
    timestamp: new Date().toISOString(),
    data,
  };

  records.push(record);
  _writeAll(records);
  return record;
}

/**
 * Return all stored transactions.
 * Optionally filter by role.
 *
 * @param {string} [role] - Optional Usernames constant to filter by
 * @returns {object[]}
 */
function getTransactions(role) {
  const all = _readAll();
  if (!role) return all;
  return all.filter((r) => r.role === role);
}

/**
 * Remove a single transaction by id.
 * @param {string} id
 */
function deleteTransaction(id) {
  const filtered = _readAll().filter((r) => r.id !== id);
  _writeAll(filtered);
}

/**
 * Merge `updates` into an existing transaction record.
 * @param {string} id
 * @param {object} updates  - Fields to merge (e.g. { decision: "approved" })
 * @returns {object|null}   - The updated record, or null if not found
 */
function updateTransaction(id, updates) {
  const records = _readAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...updates };
  _writeAll(records);
  return records[idx];
}

/** Wipe all transactions from localStorage. */
function clearTransactions() {
  localStorage.removeItem(ENV.TRANSACTIONS_KEY);
}

const Store = {
  saveTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  clearTransactions,
};
