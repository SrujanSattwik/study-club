/* ============================================
   SETTINGS PAGE - FRONTEND LOGIC
   ============================================ */

const API_BASE = 'http://localhost:3001/api';
let currentUser = null;
const otpIntervals = { password: null, delete: null };

// Store passwords for resend (step-1 inputs are hidden during step-2)
let _pendingCurrentPwd = '';
let _pendingNewPwd = '';

// ── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('studyhub_token');
  if (!token) { window.location.href = './login.html'; return; }

  setupNav();
  setupEyeButtons();
  setupPasswordStrength();
  setupOtpBoxes();
  setupButtons();
  await loadProfile();
});

// ── NAVIGATION ────────────────────────────────────────────────────────────────

function setupNav() {
  document.querySelectorAll('.settings-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.target).classList.add('active');
    });
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('studyhub_token');
    localStorage.removeItem('studyhub_user');
    window.location.href = './login.html';
  });
}

// ── EYE BUTTONS ───────────────────────────────────────────────────────────────

function setupEyeButtons() {
  document.querySelectorAll('.eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  });
}

// ── PASSWORD STRENGTH ─────────────────────────────────────────────────────────

function setupPasswordStrength() {
  const newPwd = document.getElementById('new-password');
  const confirmPwd = document.getElementById('confirm-new-password');
  const strengthEl = document.getElementById('pwd-strength');
  const matchHint = document.getElementById('pwd-match-hint');

  newPwd.addEventListener('input', () => {
    const val = newPwd.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const classes = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
    strengthEl.textContent = val ? `Strength: ${labels[score]}` : '';
    strengthEl.className = 'password-strength ' + (val ? classes[score] : '');
    checkMatch();
  });

  confirmPwd.addEventListener('input', checkMatch);

  function checkMatch() {
    if (!confirmPwd.value) { matchHint.textContent = ''; return; }
    if (newPwd.value === confirmPwd.value) {
      matchHint.textContent = '✓ Passwords match';
      matchHint.className = 'match-hint match-ok';
    } else {
      matchHint.textContent = '✗ Passwords do not match';
      matchHint.className = 'match-hint match-fail';
    }
  }
}

// ── OTP BOX AUTO-ADVANCE ──────────────────────────────────────────────────────

function setupOtpBoxes() {
  ['pwd-otp-inputs', 'del-otp-inputs'].forEach(containerId => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const boxes = container.querySelectorAll('.otp-digit');
    boxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = box.value.replace(/\D/g, '').slice(-1);
        if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
      });
      box.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
      });
      box.addEventListener('paste', e => {
        e.preventDefault();
        const digits = (e.clipboardData.getData('text').replace(/\D/g, '')).slice(0, 6);
        [...digits].forEach((d, j) => { if (boxes[j]) boxes[j].value = d; });
        const next = boxes[Math.min(digits.length, boxes.length - 1)];
        if (next) next.focus();
      });
    });
  });
}

function getOtp(containerId) {
  return [...document.getElementById(containerId).querySelectorAll('.otp-digit')]
    .map(b => b.value).join('');
}

function clearOtp(containerId) {
  document.getElementById(containerId).querySelectorAll('.otp-digit')
    .forEach(b => { b.value = ''; });
}

// ── BUTTONS ───────────────────────────────────────────────────────────────────

function setupButtons() {
  document.getElementById('btn-send-pwd-otp').addEventListener('click', () => sendPasswordOtp(false));
  document.getElementById('btn-verify-pwd-otp').addEventListener('click', verifyPasswordOtp);
  document.getElementById('btn-cancel-pwd-otp').addEventListener('click', cancelPasswordOtp);
  document.getElementById('btn-resend-pwd-otp').addEventListener('click', () => sendPasswordOtp(true));

  document.getElementById('btn-send-delete-otp').addEventListener('click', () => sendDeleteOtp(false));
  document.getElementById('btn-confirm-delete').addEventListener('click', confirmDelete);
  document.getElementById('btn-cancel-delete-otp').addEventListener('click', cancelDeleteOtp);
  document.getElementById('btn-resend-delete-otp').addEventListener('click', () => sendDeleteOtp(true));
}

// ── PROFILE ───────────────────────────────────────────────────────────────────

async function loadProfile() {
  try {
    const res = await authFetch(`${API_BASE}/auth/me`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    currentUser = data.user;
    const { fullName, email, role, createdAt } = data.user;
    const initial = (fullName || 'U')[0].toUpperCase();

    // Hero
    document.getElementById('hero-avatar').textContent = initial;
    document.getElementById('hero-name').textContent = fullName || '—';
    document.getElementById('hero-email').textContent = email || '—';
    document.getElementById('hero-role').textContent = role || 'User';

    // Profile panel
    document.getElementById('profile-avatar-large').textContent = initial;
    document.getElementById('profile-name').textContent = fullName || '—';
    document.getElementById('profile-email').textContent = email || '—';
    document.getElementById('profile-role').textContent = role || 'User';
    document.getElementById('profile-created').textContent = createdAt
      ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    // OTP email labels
    document.getElementById('otp-sent-email').textContent = email;
    document.getElementById('del-otp-sent-email').textContent = email;
  } catch (err) {
    showToast('error', 'Error', 'Failed to load profile');
  }
}

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────

async function sendPasswordOtp(isResend = false) {
  // On first send, read + validate from inputs; on resend, use stored values
  let currentPwd, newPwd;

  if (!isResend) {
    currentPwd = document.getElementById('current-password').value.trim();
    newPwd     = document.getElementById('new-password').value;
    const confirmPwd = document.getElementById('confirm-new-password').value;

    if (!currentPwd || !newPwd || !confirmPwd) {
      return showToast('error', 'Validation', 'Please fill in all password fields');
    }
    if (newPwd.length < 8) {
      return showToast('error', 'Validation', 'New password must be at least 8 characters');
    }
    if (newPwd !== confirmPwd) {
      return showToast('error', 'Validation', 'Passwords do not match');
    }
    if (currentPwd === newPwd) {
      return showToast('error', 'Validation', 'New password must differ from current password');
    }
    // Store for potential resend
    _pendingCurrentPwd = currentPwd;
    _pendingNewPwd     = newPwd;
  } else {
    currentPwd = _pendingCurrentPwd;
    newPwd     = _pendingNewPwd;
  }

  const btnId = isResend ? 'btn-resend-pwd-otp' : 'btn-send-pwd-otp';
  const btn = document.getElementById(btnId);
  setLoading(btn, true, 'Sending...');

  try {
    const res = await authFetch(`${API_BASE}/auth/send-change-password-otp`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (!isResend) {
      // Show OTP step — hide form, reveal OTP card
      document.getElementById('pwd-step-1').style.display = 'none';
      document.getElementById('pwd-step-2').style.display = 'block';
    }
    clearOtp('pwd-otp-inputs');
    startTimer('password');  // also disables resend btn
    // Focus first OTP box so user can type immediately
    document.querySelector('#pwd-otp-inputs .otp-digit').focus();
    showToast('success', 'OTP Sent', 'Check your email for the 6-digit code');
  } catch (err) {
    showToast('error', 'Error', err.message || 'Failed to send OTP');
    // On first-send failure keep step-1 visible (it already is)
    if (isResend) {
      // restore resend button — timer will re-disable if still running
      btn.disabled = false;
    }
  } finally {
    // Only restore the send button; resend button state is managed by startTimer
    if (!isResend) {
      setLoading(btn, false, '<i class="fas fa-paper-plane"></i> Send OTP to Email');
    } else {
      btn.innerHTML = '<i class="fas fa-redo"></i> Resend OTP';
      // keep disabled — startTimer already set it; only re-enable on error above
    }
  }
}

async function verifyPasswordOtp() {
  const otp = getOtp('pwd-otp-inputs');
  const newPwd = document.getElementById('new-password').value;

  if (otp.length !== 6) return showToast('error', 'Validation', 'Enter the complete 6-digit OTP');

  const btn = document.getElementById('btn-verify-pwd-otp');
  setLoading(btn, true, 'Verifying...');

  try {
    const res = await authFetch(`${API_BASE}/auth/verify-change-password`, {
      method: 'POST',
      body: JSON.stringify({ otp, newPassword: newPwd })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('success', 'Success', 'Password updated successfully!');
    stopTimer('password');
    setTimeout(resetPasswordSection, 1500);
  } catch (err) {
    showToast('error', 'Error', err.message || 'Failed to verify OTP');
  } finally {
    setLoading(btn, false, '<i class="fas fa-check-circle"></i> Verify & Update Password');
  }
}

function cancelPasswordOtp() {
  stopTimer('password');
  resetPasswordSection();
}

function resetPasswordSection() {
  document.getElementById('current-password').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-new-password').value = '';
  document.getElementById('pwd-strength').textContent = '';
  document.getElementById('pwd-strength').className = 'password-strength';
  document.getElementById('pwd-match-hint').textContent = '';
  clearOtp('pwd-otp-inputs');
  _pendingCurrentPwd = '';
  _pendingNewPwd = '';
  document.getElementById('pwd-step-1').style.display = 'block';
  document.getElementById('pwd-step-2').style.display = 'none';
}

// ── DELETE ACCOUNT ────────────────────────────────────────────────────────────

async function sendDeleteOtp(isResend = false) {
  const btnId = isResend ? 'btn-resend-delete-otp' : 'btn-send-delete-otp';
  const btn = document.getElementById(btnId);
  setLoading(btn, true, 'Sending...');

  try {
    const res = await authFetch(`${API_BASE}/auth/send-delete-otp`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (!isResend) {
      // Show OTP step — hide initiate card, reveal OTP card
      document.getElementById('del-step-1').style.display = 'none';
      document.getElementById('del-step-2').style.display = 'block';
    }
    clearOtp('del-otp-inputs');
    startTimer('delete');  // also disables resend btn
    // Focus first OTP box
    document.querySelector('#del-otp-inputs .otp-digit').focus();
    showToast('success', 'OTP Sent', 'Check your email for the 6-digit deletion code');
  } catch (err) {
    showToast('error', 'Error', err.message || 'Failed to send OTP');
    if (isResend) btn.disabled = false;
  } finally {
    if (!isResend) {
      setLoading(btn, false, '<i class="fas fa-trash-alt"></i> Send Deletion OTP');
    } else {
      btn.innerHTML = '<i class="fas fa-redo"></i> Resend OTP';
    }
  }
}

async function confirmDelete() {
  const otp = getOtp('del-otp-inputs');
  if (otp.length !== 6) return showToast('error', 'Validation', 'Enter the complete 6-digit OTP');

  const btn = document.getElementById('btn-confirm-delete');
  setLoading(btn, true, 'Deleting...');

  try {
    const res = await authFetch(`${API_BASE}/auth/delete-account`, {
      method: 'POST',
      body: JSON.stringify({ otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('success', 'Account Deleted', 'Your account has been permanently deleted');
    stopTimer('delete');
    setTimeout(() => {
      localStorage.removeItem('studyhub_token');
      localStorage.removeItem('studyhub_user');
      window.location.href = './login.html';
    }, 2000);
  } catch (err) {
    showToast('error', 'Error', err.message || 'Failed to delete account');
    setLoading(btn, false, '<i class="fas fa-trash-alt"></i> Permanently Delete Account');
  }
}

function cancelDeleteOtp() {
  stopTimer('delete');
  clearOtp('del-otp-inputs');
  document.getElementById('del-step-1').style.display = 'block';
  document.getElementById('del-step-2').style.display = 'none';
}

// ── OTP TIMER ─────────────────────────────────────────────────────────────────

function startTimer(type) {
  stopTimer(type);
  const timerId = type === 'password' ? 'password-otp-timer' : 'delete-otp-timer';
  const resendId = type === 'password' ? 'btn-resend-pwd-otp' : 'btn-resend-delete-otp';
  const resendBtn = document.getElementById(resendId);
  resendBtn.disabled = true;

  let secs = 300;
  otpIntervals[type] = setInterval(() => {
    secs--;
    const m = Math.floor(secs / 60), s = secs % 60;
    document.getElementById(timerId).textContent = `${m}:${s.toString().padStart(2, '0')}`;
    if (secs <= 0) { stopTimer(type); resendBtn.disabled = false; }
  }, 1000);
}

function stopTimer(type) {
  if (otpIntervals[type]) { clearInterval(otpIntervals[type]); otpIntervals[type] = null; }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function authFetch(url, options = {}) {
  const token = localStorage.getItem('studyhub_token');
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers || {}) }
  });
}

function setLoading(btn, loading, html) {
  btn.disabled = loading;
  btn.innerHTML = loading ? '<span class="spinner"></span> ' + html : html;
}

function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type]} toast-icon"></i>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" onclick="this.closest('.toast').remove()"><i class="fas fa-times"></i></button>
  `;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 5000);
}
