/**
 * moaawen-chooba.js — Moaawen Chooba Dashboard Logic
 *
 * Workflow inbox list + detail (Mo3awenCho3ba role).
 * Depends on: ENV, API, Auth, constants.js
 */

const MOAAWEN_INBOX_EXPECTED_ROLE = "Mo3awenCho3ba";

let _wfInboxRootContainer = null;
let _wfInboxDetailPanelRef = null;

function loadInbox() {
  if (_wfInboxRootContainer && _wfInboxDetailPanelRef) {
    return _loadAndRenderInboxList(
      _wfInboxRootContainer,
      _wfInboxDetailPanelRef
    );
  }
  return Promise.resolve();
}

function showError(container, message) {
  let el = container.querySelector(".action-error");
  if (!message) {
    if (el) {
      el.textContent = "";
      el.style.display = "none";
    }
    return;
  }
  if (!el) {
    el = document.createElement("p");
    el.className = "action-error field-error";
    el.setAttribute("role", "alert");
    container.appendChild(el);
  }
  el.style.display = "block";
  el.textContent = message;
}

function showSuccess(container, message) {
  let el = container.querySelector(".action-success");
  if (!message) {
    if (el) {
      el.textContent = "";
      el.style.display = "none";
    }
    return;
  }
  if (!el) {
    el = document.createElement("p");
    el.className = "action-success";
    el.style.color = "var(--color-success)";
    el.setAttribute("role", "status");
    container.appendChild(el);
  }
  el.style.display = "block";
  el.textContent = message;
}

async function doSubmit(bookmarkId, actionKey, reason, container) {
  try {
    showError(container, "");
    showSuccess(container, "");
    await API.submitWorkflowDecision(bookmarkId, actionKey, reason, {});
    showSuccess(container, "Action submitted successfully.");
    setTimeout(() => {
      loadInbox().then(() => {
        if (_wfInboxDetailPanelRef) {
          _showDetailEmpty(_wfInboxDetailPanelRef);
        }
        _highlightListSelection(null);
      });
    }, 1500);
  } catch (err) {
    showError(container, err.message);
  }
}

async function handleAction(item, action, container) {
  if (action.requiresReason) {
    let reasonWrapper = container.querySelector(".reason-wrapper");
    if (!reasonWrapper) {
      reasonWrapper = document.createElement("div");
      reasonWrapper.className = "reason-wrapper";
      reasonWrapper.style.marginTop = "12px";

      const input = document.createElement("textarea");
      input.placeholder = "Enter reason...";
      input.rows = 3;
      input.style.width = "100%";
      input.className = "reason-input";

      const confirmBtn = document.createElement("button");
      confirmBtn.textContent = "Confirm " + action.label;
      confirmBtn.className = "btn btn-primary";
      confirmBtn.style.marginTop = "8px";
      confirmBtn.style.width = "auto";

      confirmBtn.addEventListener("click", async () => {
        const reason = input.value.trim();
        if (!reason) {
          showError(container, "Please enter a reason before confirming.");
          return;
        }
        showError(container, "");
        confirmBtn.disabled = true;
        try {
          await doSubmit(item.bookmarkId, action.key, reason, container);
        } finally {
          confirmBtn.disabled = false;
        }
      });

      reasonWrapper.appendChild(input);
      reasonWrapper.appendChild(confirmBtn);
      container.appendChild(reasonWrapper);
    }
    return;
  }

  container.querySelector(".reason-wrapper")?.remove();
  await doSubmit(item.bookmarkId, action.key, action.key, container);
}

function renderActionButtons(item, container) {
  container.innerHTML = "";

  const list =
    item.availableActions ??
    item.AvailableActions ??
    [];
  if (!list.length) {
    container.innerHTML = "<p>No actions available.</p>";
    return;
  }

  const styleClassMap = {
    primary: "btn-primary",
    danger: "btn-danger",
    warning: "btn-warning",
    default: "btn-secondary",
  };

  list.forEach((action) => {
    const cssClass = styleClassMap[action.style] ?? "btn-secondary";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = action.label;
    btn.className = `btn ${cssClass}`;
    btn.style.marginRight = "8px";
    btn.style.width = "auto";

    btn.addEventListener("click", () => {
      handleAction(item, action, container);
    });

    container.appendChild(btn);
  });
}

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
  if (role !== MOAAWEN_INBOX_EXPECTED_ROLE) {
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
            <span class="tx-badge tx-badge--moaawen-chooba">Step</span>
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
      <p>Loading…</p>
    </div>`;

  API.getWorkflowInboxItem(bookmarkId)
    .then((item) => {
      detailPanel.innerHTML = `
        <div class="tx-detail-content">
          <p class="field-error" id="wf-inbox-detail-error" style="display:none" role="alert"></p>

          <div class="tx-detail-header">
            <span class="tx-badge tx-badge--moaawen-chooba">Task</span>
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

          <div class="detail-actions wf-detail-actions-host" id="wf-detail-actions-root"></div>
        </div>`;

      const actionsRoot = detailPanel.querySelector("#wf-detail-actions-root");
      if (actionsRoot) {
        renderActionButtons(item, actionsRoot);
      }
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

function initMoaawenChoobaPage() {
  if (!_guardInboxRole()) return;

  const container = document.getElementById("tx-container");
  if (!container) return;

  _renderInboxShell(container);
  const detailPanel = container.querySelector("#wf-inbox-detail-panel");
  _wfInboxRootContainer = container;
  _wfInboxDetailPanelRef = detailPanel;

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

const MoaawenChooba = { initMoaawenChoobaPage };
