// Contact form AJAX handler
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById('contact-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusEl.className = 'contact-status';
    statusEl.textContent = '';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        statusEl.className = 'contact-status success';
        statusEl.textContent = result.message;
        form.reset();
      } else {
        statusEl.className = 'contact-status error';
        statusEl.textContent = result.message;
      }
    } catch (err) {
      statusEl.className = 'contact-status error';
      statusEl.textContent = 'Network error. Please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
})();
