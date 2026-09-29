/* Desktop editorial motion. Content remains available without this enhancement. */
const blackstoneMotion = (() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1024px)');
  let observer;
  let animations = [];
  let curtain;
  let swapVersion = 0;
  let currentPath;

  function clear() {
    observer?.disconnect();
    animations.forEach(animation => animation.cancel());
    animations = [];
    document.querySelectorAll('.motion-pending').forEach(el => el.classList.remove('motion-pending'));
  }

  function reveal(el, delay = 0) {
    el.classList.remove('motion-pending');
    if (reduced.matches || !desktop.matches) return;
    animations.push(el.animate([
      {opacity: 0, transform: 'translateY(24px)'},
      {opacity: 1, transform: 'translateY(0)'}
    ], {duration: 680, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'}));
  }

  function enter(path, changed) {
    clear();
    const workspace = /^\/(workspace|dashboard)(\/|$)/.test(path);
    document.documentElement.dataset.motionContext = workspace ? 'workspace' : 'public';
    if (!changed || reduced.matches || !desktop.matches) return;
    const root = document.querySelector('#content');
    if (!root) return;
    // Dashboard actions stay immediate; only navigation receives a short entrance.
    if (workspace) return;
    const intro = root.querySelector('.hero-copy, .page-head, .auth-form');
    if (intro) [...intro.children].forEach((el, index) => reveal(el, Math.min(index * 65, 260)));
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      let index = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target, Math.min(index++ * 70, 210));
        observer.unobserve(entry.target);
      }
    }, {threshold: 0.08, rootMargin: '0px 0px -24px 0px'});
    const selector = '.section-head, .job-card, .market-bar, .philosophy, .cta-band, .split-features article, .step';
    root.querySelectorAll(selector).forEach(el => {
      // Nested reveals compete with their containing section's transform.
      if (el.parentElement.closest(selector)) return;
      el.classList.add('motion-pending');
      observer.observe(el);
    });
  }

  async function swap(commit, path) {
    const version = ++swapVersion;
    const changed = path !== currentPath;
    curtain?.remove();
    document.querySelector('#app').inert = false;
    const apply = () => {
      if (commit() === false) return;
      if (changed) window.scrollTo({top: 0, behavior: 'instant'});
      enter(path, changed);
      currentPath = path;
    };
    if (!changed || reduced.matches) {
      apply();
      return;
    }
    const screen = document.createElement('div');
    screen.className = 'brand-curtain';
    screen.setAttribute('role', 'status');
    screen.setAttribute('aria-label', 'Blackstone. Opening your next page.');
    screen.innerHTML = `<div class="brand-curtain-content" aria-hidden="true">
        <div class="brand-clock">
          <svg class="brand-clock-ring" viewBox="0 0 200 200"><circle class="clock-track" cx="100" cy="100" r="94"/><circle class="clock-progress" cx="100" cy="100" r="94" pathLength="100"/></svg>
          <span class="brand-monogram"><img src="/assets/client-brand-reference.jpeg" alt=""></span>
        </div>
        <span class="brand-curtain-caption">BLACKSTONE UK RECRUITMENT</span>
      </div>`;
    curtain = screen;
    document.body.append(screen);
    document.querySelector('#app').inert = true;
    try {
      // 750 ms brand animation plus 250 ms exit: one second in total.
      await new Promise(resolve => setTimeout(resolve, 750));
      if (version !== swapVersion) return;
      document.querySelector('#app').inert = false;
      apply();
      screen.classList.add('is-leaving');
      await new Promise(resolve => setTimeout(resolve, 250));
    } finally {
      screen.remove();
      if (version === swapVersion) {
        curtain = null;
        document.querySelector('#app').inert = false;
      }
    }
  }

  document.addEventListener('focusin', event => {
    const pending = event.target.closest('.motion-pending');
    if (pending) { observer?.unobserve(pending); pending.classList.remove('motion-pending'); }
  });
  reduced.addEventListener('change', clear);
  desktop.addEventListener('change', clear);
  return {swap};
})();
