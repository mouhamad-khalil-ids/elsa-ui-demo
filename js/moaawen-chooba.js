/**
 * moaawen-chooba.js — Moaawen Chooba Dashboard Logic
 *
 * Guards the page, renders the split transactions grid with
 * 4 action buttons: Approve, Reject, Mokhatabat, Maneh Kanouny.
 * Depends on: ENV, API, UI, Auth, Store, TransactionsGrid, constants.js
 */

/** Action button definitions for the moaawen chooba detail panel. */
const MOAAWEN_ACTIONS = [
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
  {
    id:       "mokhatabat",
    label:    "Mokhatabat",
    variant:  "warning",
    endpoint: "/transactions/mokhatabat",
    icon:     '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  },
  {
    id:       "maneh-kanouny",
    label:    "Maneh Kanouny",
    variant:  "purple",
    endpoint: "/transactions/maneh-kanouny",
    icon:     '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
  },
];

function initMoaawenChoobaPage() {
  // ── Role guard ── only "moaawen chooba" may enter
  Auth.guardRole(Usernames.MOAAWEN_CHOOBA);

  // ── Transactions grid with 4 action buttons ──
  TransactionsGrid.initTransactionsGrid();
  TransactionsGrid.renderTransactionsGrid("tx-container", { actions: MOAAWEN_ACTIONS });

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

const MoaawenChooba = { initMoaawenChoobaPage };
