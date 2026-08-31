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
