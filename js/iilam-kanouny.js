/**
 * iilam-kanouny.js — Iilam Kanouny Dashboard Logic
 *
 * Guards the page, renders the split transactions grid with
 * Approve / Reject action buttons that call the API.
 * Depends on: ENV, API, UI, Auth, Store, TransactionsGrid, constants.js
 */

/** Action button definitions for the iilam kanouny detail panel. */
const IILAM_ACTIONS = [
  {
    id:       "approved",
    label:    "Approve",
    variant:  "success",
    endpoint: "/transactions/approve",
    icon:     '<polyline points="20 6 9 17 4 12"/>',
  },
  {
    id:       "rejected",
    label:    "Reject",
    variant:  "danger",
    endpoint: "/transactions/reject",
    icon:     '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  },
];

function initIilamKanounyPage() {
  // ── Role guard ── only "iilam kanouny" may enter
  Auth.guardRole(Usernames.IILAM_KANOUNY);

  // ── Transactions grid with Approve / Reject actions ──
  TransactionsGrid.initTransactionsGrid();
  TransactionsGrid.renderTransactionsGrid("tx-container", { actions: IILAM_ACTIONS });

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
