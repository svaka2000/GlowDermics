// Minimal scroll-reveal — Aesop-style restraint, no library.
(() => {
  const items = document.querySelectorAll('.section, .step, .science-card, .regimen-col, .quote');
  items.forEach(el => el.classList.add('fade-up'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  items.forEach(el => io.observe(el));
})();
