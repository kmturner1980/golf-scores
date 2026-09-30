// Small shared helper so every async button action (submit, save, delete...)
// shows the same spinner + disabled state instead of each call site
// reinventing it.
const UI = {
  async withBusy(button, busyLabel, fn) {
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span>${busyLabel || 'Working…'}`;
    try {
      return await fn();
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  }
};

// Browsers step a focused <input type="number"> up/down on mouse-wheel or
// trackpad scroll, so scrolling the page past a score box silently changes
// it. Blurring the input first lets the scroll go to the page instead.
document.addEventListener('wheel', (e) => {
  const el = document.activeElement;
  if (el && el.type === 'number' && el === e.target) el.blur();
}, { passive: true });
