/* Portraits by Sophia — shared site behavior */

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initContactForm();
  initScrollReveal();
  initHeroParallax();
  initInstagramFeed();
});

// Behold.so JSON feed URL (Embed → JSON in the Behold dashboard).
// Leave blank to keep the static placeholder grid.
const BEHOLD_FEED_URL = 'https://feeds.behold.so/H16wLZy1miZOlnRw9Btb';

/**
 * Mobile nav: toggles a body class so the CSS can slide the menu in,
 * and closes automatically when a link is chosen.
 */
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelectorAll('.nav-links a');

  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.forEach((link) => {
    link.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/**
 * Contact form: validates in the browser, then submits to Formspree
 * via fetch so the page never reloads.
 */
function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setStatus('Sending...', 'success');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        setStatus('Thank you! Your message has been sent — I’ll be in touch within 2 business days.', 'success');
        form.reset();
      } else {
        setStatus('Something went wrong sending your message — please email sophia@portraitsbysophia.com directly.', 'error');
      }
    } catch (error) {
      setStatus('Something went wrong sending your message — please email sophia@portraitsbysophia.com directly.', 'error');
    }
  });

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('success', 'error');
    status.classList.add('visible', type);
  }
}

/**
 * Fades/slides elements marked [data-reveal] into place as they enter
 * the viewport. Falls back to fully visible if IntersectionObserver
 * isn't available, and respects prefers-reduced-motion via CSS.
 */
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/**
 * Subtle hero background parallax on scroll — the image drifts slower
 * than the page for a bit of depth. Skipped entirely for users who
 * prefer reduced motion.
 */
function initHeroParallax() {
  const heroImage = document.querySelector('.hero-media img');
  if (!heroImage) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;

    window.requestAnimationFrame(() => {
      const offset = Math.min(window.scrollY * 0.12, 60);
      heroImage.style.transform = `translateY(${offset}px)`;
      ticking = false;
    });
  }, { passive: true });
}

/**
 * Pulls the latest posts from a Behold.so JSON feed and swaps them into
 * the Instagram grid, so the section refreshes automatically on every
 * page load without touching the site's code again.
 */
async function initInstagramFeed() {
  const grid = document.querySelector('#instagram-feed');
  if (!grid || !BEHOLD_FEED_URL) return;

  try {
    const response = await fetch(BEHOLD_FEED_URL);
    if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);

    const feed = await response.json();
    const posts = (feed.posts || []).slice(0, 6);
    if (!posts.length) return;

    grid.innerHTML = posts
      .map((post) => {
        const imageUrl = post.sizes?.medium?.mediaUrl || post.mediaUrl;
        const label = (post.prunedCaption || 'View post on Instagram')
          .slice(0, 140)
          .replace(/"/g, '&quot;');

        return `
          <a class="instagram-item" href="${post.permalink}" target="_blank" rel="noopener" aria-label="${label}">
            <img src="${imageUrl}" alt="${label}" loading="lazy" />
          </a>
        `;
      })
      .join('');
  } catch (error) {
    // Feed unreachable — leave the static placeholder grid in place.
    console.warn('Instagram feed could not be loaded:', error);
  }
}
