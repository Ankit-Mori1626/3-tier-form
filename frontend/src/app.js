// API Endpoints (Proxied via Nginx reverse proxy to backend-service)
const API_ENDPOINTS = {
  health: '/health',
  submissions: '/api/submissions',
};

// DOM Elements
const formCard = document.getElementById('form-card');
const successCard = document.getElementById('success-card');
const form = document.getElementById('submission-form');
const submitBtn = document.getElementById('submit-btn');
const submitSpinner = document.getElementById('submit-spinner');
const resetBtn = document.getElementById('reset-btn');
const submitAnotherBtn = document.getElementById('submit-another-btn');
const submissionSummary = document.getElementById('submission-summary');
const toastContainer = document.getElementById('toast-container');

// Status indicators
const backendStatusPill = document.getElementById('backend-status');
const dbStatusPill = document.getElementById('db-status');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  checkSystemHealth();
  setupEventListeners();
  setInterval(checkSystemHealth, 15000);
});

// Event Listeners Setup
function setupEventListeners() {
  form.addEventListener('submit', handleFormSubmit);
  resetBtn.addEventListener('click', resetForm);
  submitAnotherBtn.addEventListener('click', () => {
    successCard.classList.add('hidden');
    formCard.classList.remove('hidden');
    resetForm();
  });
}

// System Health Check
async function checkSystemHealth() {
  try {
    const res = await fetch(API_ENDPOINTS.health, { cache: 'no-store' });
    if (res.ok) {
      updateStatusIndicator(backendStatusPill, 'online', 'Tier 2: Express API (Connected)');
      updateStatusIndicator(dbStatusPill, 'online', 'Tier 3: PostgreSQL (Active)');
    } else {
      updateStatusIndicator(backendStatusPill, 'offline', 'Tier 2: Express API (Degraded)');
      updateStatusIndicator(dbStatusPill, 'checking', 'Tier 3: PostgreSQL');
    }
  } catch (err) {
    updateStatusIndicator(backendStatusPill, 'offline', 'Tier 2: Express API (Offline)');
    updateStatusIndicator(dbStatusPill, 'offline', 'Tier 3: PostgreSQL (Unreachable)');
  }
}

function updateStatusIndicator(pillElement, state, text) {
  if (!pillElement) return;
  const indicator = pillElement.querySelector('.status-indicator');
  const textSpan = pillElement.querySelector('.status-text');
  
  indicator.className = `status-indicator ${state}`;
  if (text) textSpan.textContent = text;
}

// Handle Form Submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Clear previous errors
  document.getElementById('name-error').textContent = '';
  document.getElementById('email-error').textContent = '';
  document.getElementById('message-error').textContent = '';

  const full_name = form.full_name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const category = form.category.value;
  const message = form.message.value.trim();

  let hasError = false;

  if (!full_name) {
    document.getElementById('name-error').textContent = 'Full name is required';
    hasError = true;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('email-error').textContent = 'Valid email is required';
    hasError = true;
  }

  if (!message) {
    document.getElementById('message-error').textContent = 'Message is required';
    hasError = true;
  }

  if (hasError) return;

  // Submit to Backend
  setSubmitting(true);
  try {
    const res = await fetch(API_ENDPOINTS.submissions, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ full_name, email, phone, category, message }),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Form submitted successfully!', 'success');
      showSuccessScreen(result.data);
    } else {
      throw new Error(result.message || 'Failed to submit form');
    }
  } catch (error) {
    console.error('Submission error:', error);
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    setSubmitting(false);
  }
}

// Show Success Confirmation View
function showSuccessScreen(record) {
  formCard.classList.add('hidden');
  
  submissionSummary.innerHTML = `
    <div class="summary-row">
      <span class="summary-label">Submission ID:</span>
      <span class="summary-value">#${record.id || 'N/A'}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Full Name:</span>
      <span class="summary-value">${escapeHtml(record.full_name)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Email:</span>
      <span class="summary-value">${escapeHtml(record.email)}</span>
    </div>
    ${record.phone ? `
    <div class="summary-row">
      <span class="summary-label">Phone:</span>
      <span class="summary-value">${escapeHtml(record.phone)}</span>
    </div>` : ''}
    <div class="summary-row">
      <span class="summary-label">Category:</span>
      <span class="summary-value">${escapeHtml(record.category || 'General')}</span>
    </div>
  `;

  successCard.classList.remove('hidden');
}

// Reset Form Fields
function resetForm() {
  form.reset();
  document.getElementById('name-error').textContent = '';
  document.getElementById('email-error').textContent = '';
  document.getElementById('message-error').textContent = '';
}

// UI State Helpers
function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  if (isSubmitting) {
    submitSpinner.classList.remove('hidden');
    submitBtn.querySelector('.btn-icon').classList.add('hidden');
    submitBtn.querySelector('.btn-text').textContent = 'Submitting...';
  } else {
    submitSpinner.classList.add('hidden');
    submitBtn.querySelector('.btn-icon').classList.remove('hidden');
    submitBtn.querySelector('.btn-text').textContent = 'Submit Form';
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '⚠️'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
