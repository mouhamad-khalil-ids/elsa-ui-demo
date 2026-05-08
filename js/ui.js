/**
 * ui.js — UI Helpers
 *
 * Reusable functions for toasts, loaders, and form state management.
 * Zero dependencies on any framework.
 */

/* ───────────────────────────── Toast ───────────────────────────── */

let _toastTimer = null;

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration  ms before auto-dismiss
 */
function showToast(message, type = "info", duration = 3500) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  clearTimeout(_toastTimer);

  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;

  _toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, duration);
}

/* ───────────────────────────── Loader ──────────────────────────── */

/**
 * Show or hide the full-page loader overlay.
 * @param {boolean} visible
 */
function setLoader(visible) {
  const overlay = document.getElementById("loader-overlay");
  if (!overlay) return;
  overlay.classList.toggle("loader-overlay--visible", visible);
}

/* ─────────────────────────── Form State ────────────────────────── */

/**
 * Put a form into a loading state (disable inputs + show spinner on button).
 * @param {HTMLFormElement} form
 * @param {boolean} loading
 */
function setFormLoading(form, loading) {
  const btn = form.querySelector("button[type='submit']");
  const inputs = form.querySelectorAll("input");

  inputs.forEach((el) => (el.disabled = loading));

  if (btn) {
    btn.disabled = loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = loading ? "Please wait…" : btn.dataset.originalText;
    btn.classList.toggle("btn--loading", loading);
  }
}

/**
 * Show an inline error message below a field.
 * @param {HTMLElement} field  - The input element
 * @param {string|null} message  - Pass null to clear
 */
function setFieldError(field, message) {
  // Remove any existing error for this field
  const existingError = field.parentElement.querySelector(".field-error");
  if (existingError) existingError.remove();

  field.classList.toggle("input--error", !!message);

  if (message) {
    const span = document.createElement("span");
    span.className = "field-error";
    span.textContent = message;
    field.parentElement.appendChild(span);
  }
}

/** Clear all field errors inside a form. */
function clearFormErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => el.remove());
  form.querySelectorAll(".input--error").forEach((el) =>
    el.classList.remove("input--error")
  );
}

const UI = { showToast, setLoader, setFormLoading, setFieldError, clearFormErrors };
