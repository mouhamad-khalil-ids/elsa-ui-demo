/**
 * iilam-kanouny.js — Iilam Kanouny Dashboard Logic
 *
 * Guards the page, renders the split transactions grid with
 * Approve / Reject action buttons that call the API.
 * Depends on: ENV, API, UI, Auth, Store, TransactionsGrid, constants.js
 */

/**
 * POST /applications/{id}/i3lam-kanouni/decide
 * @param {string} transactionId - The transaction (application) ID
 * @param {"approved"|"rejected"} decision
 * @param {string} reason
 */
function _submitIilamDecision(transactionId, decision, reason) {
  return API.post(`/applications/${transactionId}/i3lam-kanouni/decide`, {
    decision,
    reason,
  });
}

/** Action button definitions for the iilam kanouny detail panel. */
const IILAM_ACTIONS = [
  {
    id: "approved",
    label: "Approve",
    variant: "success",
    icon: '<polyline points="20 6 9 17 4 12"/>',
    onAction(record) {
      return _submitIilamDecision(record.data.id, "approved", "all is good");
    },
  },
  {
    id: "rejected",
    label: "Reject",
    variant: "danger",
    icon: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    onAction(record) {
      return _submitIilamDecision(record.data.id, "rejected", "missing info");
    },
  },
];

function initIilamKanounyPage() {
  // ── Role guard ── only "iilam kanouny" may enter
  Auth.guardRole(Usernames.IILAM_KANOUNY);

  // ── Transactions grid with Approve / Reject actions ──
  TransactionsGrid.initTransactionsGrid();
  TransactionsGrid.renderTransactionsGrid("tx-container", {
    actions: IILAM_ACTIONS,
  });

  // ── Logout ──
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.clearToken();
      Auth.clearUsername();
      window.location.href = "index.html";
    });
  }
}

const IilamKanouny = { initIilamKanounyPage };
