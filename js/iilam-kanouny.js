/**
 * iilam-kanouny.js — Iilam Kanouny Dashboard Logic
 *
 * Workflow inbox list + detail (I3lamKanouni role).
 * Depends on: ENV, API, Auth, constants.js
 */

const IILAM_INBOX_EXPECTED_ROLE = "I3lamKanouni";

function _escapeHtml(value) {
  const el = document.createElement("div");
  el.textContent = value == null ? "" : String(value);
  return el.innerHTML;
}

function _guardInboxRole() {
  if (!Auth.isAuthenticated()) {
    window.location.href = "index.html";
    return false;
  }
  const role = localStorage.getItem("userRole");
  if (role !== IILAM_INBOX_EXPECTED_ROLE) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

function _showDetailEmpty(detailPanel) {
  if (!detailPanel) return;
  detailPanel.innerHTML = `
    <div class="tx-detail-empty">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 12h6M9 16h6M9 8h2M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
      </svg>
      <p>Select an inbox item<br>to view its details</p>
    </div>`;
}

function _setGlobalError(container, message) {
  const el = container.querySelector("#wf-inbox-global-error");
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.style.display = "block";
  } else {
    el.textContent = "";
    el.style.display = "none";
  }
}

function _highlightListSelection(bookmarkId) {
  document.querySelectorAll(".wf-inbox-item").forEach((node) => {
    node.classList.toggle(
      "tx-list-item--active",
      node.dataset.bookmarkId === bookmarkId
    );
  });
}

function _renderInboxShell(container) {
  container.innerHTML = `
    <p id="wf-inbox-global-error" class="field-error" style="display:none;margin-bottom:0.75rem" role="alert"></p>
    <div class="tx-workspace">
      <div class="tx-list-panel" id="wf-inbox-list-panel"></div>
      <div class="tx-detail-panel" id="wf-inbox-detail-panel"></div>
    </div>`;
}

async function _loadAndRenderInboxList(container, detailPanel) {
  const listPanel = container.querySelector("#wf-inbox-list-panel");
  if (!listPanel) return;

  _setGlobalError(container, "");
  listPanel.innerHTML = `<div class="tx-empty"><p>Loading…</p></div>`;

  try {
    const items = await API.getWorkflowInbox();
    const list = Array.isArray(items) ? items : [];

    if (!list.length) {
      listPanel.innerHTML = `
        <div class="tx-empty">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p>No pending tasks.</p>
        </div>`;
      _showDetailEmpty(detailPanel);
      return;
    }

    listPanel.innerHTML = list
      .map(
        (item) => `
        <div
          class="tx-list-item wf-inbox-item"
          data-bookmark-id="${_escapeHtml(item.bookmarkId)}"
          tabindex="0"
          role="button"
          aria-label="View task ${_escapeHtml(item.bookmarkId)}"
        >
          <div class="tx-list-item-top">
            <span class="tx-badge tx-badge--iilam-kanouny">Step</span>
          </div>
          <div class="tx-list-item-id">${_escapeHtml(item.stepName)}</div>
          <div class="tx-list-item-by">
            Application: ${_escapeHtml(item.applicationId)}
          </div>
        </div>`
      )
      .join("");

    listPanel.querySelectorAll(".wf-inbox-item").forEach((node) => {
      const bookmarkId = node.dataset.bookmarkId;
      const open = () => {
        _highlightListSelection(bookmarkId);
        _openInboxDetail(container, detailPanel, bookmarkId);
      };
      node.addEventListener("click", open);
      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  } catch (err) {
    const msg =
      err && err.message === "You do not have permission to action this task."
        ? err.message
        : err.message || "Failed to load inbox";
    _setGlobalError(container, msg);
    listPanel.innerHTML = `
      <div class="tx-empty">
        <p>Could not load inbox.</p>
      </div>`;
    _showDetailEmpty(detailPanel);
  }
}

function _openInboxDetail(container, detailPanel, bookmarkId) {
  if (!detailPanel) return;

  detailPanel.innerHTML = `
    <div class="tx-detail-content">
      <p class="field-error" id="wf-inbox-detail-error" style="display:none" role="alert"></p>
      <p id="wf-inbox-detail-success" style="display:none;color:var(--color-success);font-size:0.875rem;margin-bottom:0.75rem" role="status"></p>
      <p>Loading…</p>
    </div>`;

  const setDetailError = (message) => {
    const errEl = detailPanel.querySelector("#wf-inbox-detail-error");
    if (!errEl) return;
    if (message) {
      errEl.textContent = message;
      errEl.style.display = "block";
    } else {
      errEl.textContent = "";
      errEl.style.display = "none";
    }
  };

  API.getWorkflowInboxItem(bookmarkId)
    .then((item) => {
      detailPanel.innerHTML = `
        <div class="tx-detail-content">
          <p class="field-error" id="wf-inbox-detail-error" style="display:none" role="alert"></p>
          <p id="wf-inbox-detail-success" style="display:none;color:var(--color-success);font-size:0.875rem;margin-bottom:0.75rem" role="status"></p>

          <div class="tx-detail-header">
            <span class="tx-badge tx-badge--iilam-kanouny">Task</span>
            <span class="tx-detail-id">#${_escapeHtml(item.bookmarkId)}</span>
          </div>

          <div class="modal-meta" style="margin-top:1rem;">
            <div class="modal-meta-item">
              <span class="modal-meta-label">Step name</span>
              <span class="modal-meta-value">${_escapeHtml(item.stepName)}</span>
            </div>
            <div class="modal-meta-item">
              <span class="modal-meta-label">Application ID</span>
              <span class="modal-meta-value">${_escapeHtml(item.applicationId)}</span>
            </div>
            <div class="modal-meta-item">
              <span class="modal-meta-label">Workflow instance ID</span>
              <span class="modal-meta-value">${_escapeHtml(item.workflowInstanceId)}</span>
            </div>
          </div>

          <div class="modal-divider"></div>

          <label class="modal-meta-label" for="wf-reject-reason" style="display:block;margin-bottom:0.35rem">Reason (for reject)</label>
          <input type="text" id="wf-reject-reason" style="width:100%;max-width:28rem;margin-bottom:1rem;padding:0.65rem 0.85rem;border-radius:var(--radius-sm);border:1px solid var(--color-border);background:var(--color-surface-2);color:var(--color-text)" autocomplete="off" />

          <div class="detail-actions">
            <button type="button" class="btn btn-action btn-action--success" id="wf-btn-approve">
              <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Approve
            </button>
            <button type="button" class="btn btn-action btn-action--danger" id="wf-btn-reject">
              <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Reject
            </button>
          </div>
        </div>`;

      const successEl = detailPanel.querySelector("#wf-inbox-detail-success");
      const approveBtn = detailPanel.querySelector("#wf-btn-approve");
      const rejectBtn = detailPanel.querySelector("#wf-btn-reject");

      const afterSubmit = async () => {
        if (successEl) {
          successEl.textContent = "Decision submitted successfully.";
          successEl.style.display = "block";
        }
        await new Promise((resolve) => setTimeout(resolve, 1200));
        await _loadAndRenderInboxList(container, detailPanel);
        _showDetailEmpty(detailPanel);
        _highlightListSelection(null);
      };

      const wireSubmit = (btn, handler) => {
        if (!btn) return;
        btn.addEventListener("click", async () => {
          setDetailError("");
          approveBtn.disabled = true;
          rejectBtn.disabled = true;
          try {
            await handler();
            await afterSubmit();
          } catch (err) {
            const msg =
              err && err.message
                ? err.message
                : "Failed to submit decision";
            setDetailError(msg);
          } finally {
            approveBtn.disabled = false;
            rejectBtn.disabled = false;
          }
        });
      };

      wireSubmit(approveBtn, () =>
        API.submitWorkflowDecision(bookmarkId, "approved", "")
      );

      wireSubmit(rejectBtn, () => {
        const reasonInput = detailPanel.querySelector("#wf-reject-reason");
        const reason = reasonInput ? reasonInput.value.trim() : "";
        return API.submitWorkflowDecision(bookmarkId, "rejected", reason);
      });
    })
    .catch((err) => {
      const msg =
        err && err.message === "You do not have permission to action this task."
          ? err.message
          : err.message || "Failed to fetch inbox item";
      detailPanel.innerHTML = `
        <div class="tx-detail-content">
          <p class="field-error" id="wf-inbox-detail-error" role="alert">${_escapeHtml(
            msg
          )}</p>
        </div>`;
    });
}

function initIilamKanounyPage() {
  if (!_guardInboxRole()) return;

  const container = document.getElementById("tx-container");
  if (!container) return;

  _renderInboxShell(container);
  const detailPanel = container.querySelector("#wf-inbox-detail-panel");
  _showDetailEmpty(detailPanel);
  _loadAndRenderInboxList(container, detailPanel);

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.clearToken();
      Auth.clearUsername();
      localStorage.removeItem("userRole");
      localStorage.removeItem("userType");
      window.location.href = "index.html";
    });
  }
}

const IilamKanouny = { initIilamKanounyPage };
