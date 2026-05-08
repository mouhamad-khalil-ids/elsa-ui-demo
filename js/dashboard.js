/**
 * dashboard.js — Citizen Dashboard Form Logic
 *
 * Guards the page, validates the form, and persists the
 * submitted transaction to localStorage via Store.
 * Depends on: ENV, UI, Auth, Store, constants.js
 */

/* ─────────────────────── Auth Guard ─────────────────────────── */

function guardAuth() {
  Auth.guardRole(Usernames.CITIZEN);
}

/* ─────────────────────── Validation ─────────────────────────── */

/**
 * Validate all dashboard form fields.
 * @param {HTMLFormElement} form
 * @returns {boolean} true if all valid
 */
function validateForm(form) {
  UI.clearFormErrors(form);
  let valid = true;

  const firstnameField = document.getElementById("firstname");
  const lastnameField  = document.getElementById("lastname");
  const ageField       = document.getElementById("age");
  const realEstateField = document.getElementById("real-estate-number");
  const transactionField = document.getElementById("transaction-type");
  const typeCheckboxes = form.querySelectorAll('input[name="type"]');

  // First name
  if (!firstnameField.value.trim()) {
    UI.setFieldError(firstnameField, "First name is required.");
    valid = false;
  }

  // Last name
  if (!lastnameField.value.trim()) {
    UI.setFieldError(lastnameField, "Last name is required.");
    valid = false;
  }

  // Age
  const age = parseInt(ageField.value, 10);
  if (!ageField.value.trim()) {
    UI.setFieldError(ageField, "Age is required.");
    valid = false;
  } else if (isNaN(age) || age < 1 || age > 120) {
    UI.setFieldError(ageField, "Please enter a valid age (1–120).");
    valid = false;
  }

  // Type — at least one checkbox must be checked
  const checkedTypes = [...typeCheckboxes].filter((cb) => cb.checked);
  if (checkedTypes.length === 0) {
    // Attach error to the checkbox group wrapper
    const groupWrapper = document.getElementById("type-group");
    const span = document.createElement("span");
    span.className = "field-error";
    span.textContent = "Please select at least one type.";
    groupWrapper.appendChild(span);
    valid = false;
  }

  // Real estate number
  if (!realEstateField.value.trim()) {
    UI.setFieldError(realEstateField, "Real estate number is required.");
    valid = false;
  }

  // Transaction type
  if (!transactionField.value) {
    UI.setFieldError(transactionField, "Please select a transaction type.");
    valid = false;
  }

  return valid;
}

/* ─────────────────────── Form Submit ────────────────────────── */

async function submitDashboardForm(form) {
  const typeCheckboxes = form.querySelectorAll('input[name="type"]:checked');

  const payload = {
    firstname:         document.getElementById("firstname").value.trim(),
    lastname:          document.getElementById("lastname").value.trim(),
    age:               parseInt(document.getElementById("age").value, 10),
    type:              [...typeCheckboxes].map((cb) => cb.value),
    realEstateNumber:  document.getElementById("real-estate-number").value.trim(),
    transactionType:   document.getElementById("transaction-type").value,
  };

  // Persist to localStorage
  const record = Store.saveTransaction(Usernames.CITIZEN, payload);
  return record;
}

/* ─────────────────────── Page Init ─────────────────────────── */

function initDashboardPage() {
  // Auth guard — must be first
  guardAuth();

  const form = document.getElementById("dashboard-form");
  if (!form) return;

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.clearToken();
      Auth.clearUsername();
      window.location.href = "index.html";
    });
  }

  // Form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm(form)) return;

    UI.setFormLoading(form, true);
    try {
      await submitDashboardForm(form);
      UI.showToast("Form submitted successfully!", "success");
      form.reset();
    } catch (err) {
      UI.showToast(err.message, "error");
    } finally {
      UI.setFormLoading(form, false);
    }
  });
}

const Dashboard = { initDashboardPage };
