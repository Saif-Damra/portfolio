const header = document.getElementById('site-header');
const progress = document.getElementById('scroll-progress');
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');
const menuBackdrop = document.getElementById('menu-backdrop');
const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('main section[id]')];
const heroMedia = document.querySelector('.hero-media');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let scrollable = document.documentElement.scrollHeight - window.innerHeight;
function measure() {
    scrollable = document.documentElement.scrollHeight - window.innerHeight;
}
window.addEventListener('resize', measure, { passive: true });

function updateScrollState() {
    const scrollTop = window.scrollY;
    const percentage = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;

    header.classList.toggle('scrolled', scrollTop > 24);
    progress.style.width = `${percentage}%`;

    let currentId = '';
    sections.forEach((section) => {
        if (scrollTop >= section.offsetTop - 180) currentId = section.id;
    });
    navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
}

let scrollQueued = false;
window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
        updateScrollState();
        scrollQueued = false;
    });
}, { passive: true });

function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    navMenu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
}

menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navMenu.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
});

document.querySelectorAll('.nav-menu a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
});
if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
    });
}, { threshold: 0.12, rootMargin: '0px 0px -50px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

// Defer the hero video: the poster carries the first paint, the 8 MB file loads
// after the page settles — and never on reduced-motion or a metered/slow link.
function loadHeroVideo() {
    if (!heroMedia) return;
    const conn = navigator.connection || {};
    if (reducedMotion.matches || conn.saveData || /2g/.test(conn.effectiveType || '')) return;
    const source = heroMedia.querySelector('source[data-src]');
    if (!source || source.src) return;
    source.src = source.dataset.src;
    heroMedia.load();
}

if (heroMedia && reducedMotion.matches) {
    heroMedia.removeAttribute('autoplay');
} else if (document.readyState === 'complete') {
    loadHeroVideo();
} else {
    window.addEventListener('load', () => setTimeout(loadHeroVideo, 200), { once: true });
}

if (heroMedia && !reducedMotion.matches && window.matchMedia('(pointer: fine)').matches) {
    document.querySelector('.hero').addEventListener('pointermove', (event) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 10;
        const y = (event.clientY / window.innerHeight - 0.5) * 8;
        heroMedia.style.transform = `scale(1.04) translate(${x}px, ${y}px)`;
    });
}

document.getElementById('year').textContent = new Date().getFullYear();
updateScrollState();
