/**
 * transactions-grid.js — Transactions List + Inline Detail Panel
 *
 * Renders a 2-column workspace inside a container:
 *   LEFT  — scrollable list of compact transaction items
 *   RIGHT — inline detail panel that populates on item click
 *
 * Supports optional `options.actions` for custom action buttons
 * (e.g. Approve / Reject) that call an API endpoint.
 *
 * Depends on: Store, API, UI, constants.js
 */

/* ─────────────────────── Helpers ───────────────────────────── */

function _formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function _roleLabel(role) {
  const labels = {
    [Usernames.CITIZEN]:        "Citizen",
    [Usernames.MOAAWEN_CHOOBA]: "Moaawen Chooba",
    [Usernames.IILAM_KANOUNY]:  "Iilam Kanouny",
  };
  return labels[role] || role;
}

function _roleSlug(role) {
  return role.replace(/\s+/g, "-");
}

function _formatKey(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

/* ─────────────────────── Decision Badge ────────────────────── */

function _decisionBadge(decision) {
  if (!decision) return "";
  const map = {
    approved:        { label: "Approved",        cls: "badge--approved" },
    rejected:        { label: "Rejected",         cls: "badge--rejected" },
    mokhatabat:      { label: "Mokhatabat",       cls: "badge--warning"  },
    "maneh-kanouny": { label: "Maneh Kanouny",    cls: "badge--purple"   },
  };
  const d = map[decision] || { label: decision, cls: "badge--neutral" };
  return `<span class="decision-badge ${d.cls}">${d.label}</span>`;
}

/* ─────────────────────── Detail Panel ──────────────────────── */

function _showDetailPanel(record, containerId, options) {
  const panel = document.getElementById("tx-detail-panel");
  if (!panel) return;

  const dataRows = Object.entries(record.data)
    .map(([k, v]) => {
      const value = Array.isArray(v) ? v.join(", ") : v;
      return `
        <div class="detail-row">
          <span class="detail-label">${_formatKey(k)}</span>
          <span class="detail-value">${value}</span>
        </div>`;
    })
    .join("");

  const actions = options.actions || [];
  const isDecided = !!record.decision;

  const actionsHTML = actions.length
    ? `<div class="detail-actions">
        ${
          isDecided
            ? `<div class="detail-decided">
                Decision already recorded: ${_decisionBadge(record.decision)}
               </div>`
            : actions
                .map(
                  (a) => `
                <button
                  class="btn btn-action btn-action--${a.variant}"
                  data-action-id="${a.id}"
                  ${isDecided ? "disabled" : ""}
                >
                  ${a.icon ? `<svg viewBox="0 0 24 24" aria-hidden="true">${a.icon}</svg>` : ""}
                  ${a.label}
                </button>`
                )
                .join("")
        }
      </div>`
    : "";

  panel.innerHTML = `
    <div class="tx-detail-content">
      <div class="tx-detail-header">
        <span class="tx-badge tx-badge--${_roleSlug(record.role)}">${_roleLabel(record.role)}</span>
        <span class="tx-detail-id">#${record.id}</span>
        ${_decisionBadge(record.decision)}
      </div>

      <div class="modal-meta" style="margin-top:1rem;">
        <div class="modal-meta-item">
          <span class="modal-meta-label">Submitted By</span>
          <span class="modal-meta-value">${record.submittedBy}</span>
        </div>
        <div class="modal-meta-item">
          <span class="modal-meta-label">Timestamp</span>
          <span class="modal-meta-value">${_formatDate(record.timestamp)}</span>
        </div>
      </div>

      <div class="modal-divider"></div>
      <p class="modal-fields-title">Form Data</p>
      ${dataRows}
      ${actionsHTML}
    </div>`;

  // Highlight active list item
  document.querySelectorAll(".tx-list-item").forEach((el) =>
    el.classList.toggle("tx-list-item--active", el.dataset.id === record.id)
  );

  // Wire action buttons
  if (!isDecided) {
    actions.forEach((action) => {
      const btn = panel.querySelector(`[data-action-id="${action.id}"]`);
      if (!btn) return;

      btn.addEventListener("click", async () => {
        // Disable both buttons while in-flight
        panel.querySelectorAll("[data-action-id]").forEach((b) => (b.disabled = true));

        try {
          await API.post(action.endpoint, { transactionId: record.id });

          // Persist decision locally
          Store.updateTransaction(record.id, { decision: action.id });
          record.decision = action.id; // update local reference

          UI.showToast(`Transaction ${action.label.toLowerCase()} successfully!`, "success");

          // Re-render detail panel to show badge, re-render list
          _showDetailPanel(record, containerId, options);
          _refreshListItem(record);
        } catch (err) {
          UI.showToast(err.message || "API error — please try again.", "error");
          panel.querySelectorAll("[data-action-id]").forEach((b) => (b.disabled = false));
        }
      });
    });
  }
}

/** Update a single list item's visual state without re-rendering the whole list. */
function _refreshListItem(record) {
  const item = document.querySelector(`.tx-list-item[data-id="${record.id}"]`);
  if (!item) return;
  const badge = item.querySelector(".tx-decision-dot");
  if (!badge && record.decision) {
    const dot = document.createElement("span");
    dot.className = `tx-decision-dot tx-decision-dot--${record.decision}`;
    dot.title = record.decision;
    item.querySelector(".tx-list-item-top").appendChild(dot);
  }
}

function _showDetailEmpty() {
  const panel = document.getElementById("tx-detail-panel");
  if (!panel) return;
  panel.innerHTML = `
    <div class="tx-detail-empty">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 12h6M9 16h6M9 8h2M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
      </svg>
      <p>Select a transaction<br>to view its details</p>
    </div>`;
}

/* ─────────────────────── Main Renderer ─────────────────────── */

/**
 * Render (or re-render) the full split workspace.
 *
 * @param {string} containerId
 * @param {object} [options]
 * @param {Array}  [options.actions]  - Action buttons for the detail panel
 *   Each action: { id, label, variant, endpoint, icon? }
 */
function renderTransactionsGrid(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const records = Store.getTransactions();

  container.innerHTML = `
    <div class="tx-workspace">
      <div class="tx-list-panel" id="tx-list-panel">
        ${
          records.length === 0
            ? `<div class="tx-empty">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <p>No transactions yet.</p>
              </div>`
            : [...records]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map(
                  (r) => `
                  <div
                    class="tx-list-item${r.decision ? " tx-list-item--decided" : ""}"
                    data-id="${r.id}"
                    tabindex="0"
                    role="button"
                    aria-label="View transaction ${r.id}"
                  >
                    <div class="tx-list-item-top">
                      <span class="tx-badge tx-badge--${_roleSlug(r.role)}">${_roleLabel(r.role)}</span>
                      <span class="tx-time">${_formatDate(r.timestamp)}</span>
                    </div>
                    <div class="tx-list-item-id">#${r.id}</div>
                    <div class="tx-list-item-by">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/></svg>
                      ${r.submittedBy}
                      ${r.decision ? `<span class="tx-decision-dot tx-decision-dot--${r.decision}" title="${r.decision}"></span>` : ""}
                    </div>
                  </div>`
                )
                .join("")
        }
      </div>
      <div class="tx-detail-panel" id="tx-detail-panel"></div>
    </div>`;

  _showDetailEmpty();

  container.querySelectorAll(".tx-list-item").forEach((item) => {
    const record = records.find((r) => r.id === item.dataset.id);
    if (!record) return;

    const activate = () => _showDetailPanel(record, containerId, options);
    item.addEventListener("click", activate);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
  });
}

/* ─────────────────────── Init ──────────────────────────────── */

function initTransactionsGrid() {
  // No-op — kept for API compatibility.
}

const TransactionsGrid = {
  renderTransactionsGrid,
  initTransactionsGrid,
};
